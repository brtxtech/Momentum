import { Entity, QueryFilter, PageResult, ChangeEvent, query, toIndex, ensureUnique, describeChange, applyChange, revertChange, validateEntity, mergeMany, summary, byId, removeById, prependUnique, editLocal, ownerOf, sortNewest, filter, paginate, toCsv, exportJson, parseJson, countToday, countLastMonth, dailyCounts, groupByMonth, groupByDay, distinctOwners, topOwners, patchFields, applyPatch, accessible } from './feature-lab';
export type Subscriber = (records: readonly Entity[], reason: string) => void;
export type ChangeResult = {
    success: boolean;
    message: string;
    entity?: Entity;
};
export type WriteAction = 'create' | 'update' | 'delete' | 'restore';
export type WritePermission = {
    actor: string;
    canModerate: boolean;
    viewerIds: string[];
};
export class FeatureCollection {
    private items: Entity[] = [];
    private listeners = new Set<Subscriber>();
    private history: ChangeEvent[] = [];
    private future: ChangeEvent[] = [];
    private busy = false;
    private lastReason = 'init';
    constructor(initial: readonly Entity[] = []) { this.items = ensureUnique(initial); }
    subscribe(listener: Subscriber): () => void { this.listeners.add(listener); listener(this.items, this.lastReason); return () => this.listeners.delete(listener); }
    private emit(reason: string) { this.lastReason = reason; for (const l of this.listeners)
        l(this.items, reason); }
    get count() { return this.items.length; }
    get canUndo() { return this.history.length > 0; }
    get canRedo() { return this.future.length > 0; }
    get isBusy() { return this.busy; }
    all(): Entity[] { return [...this.items]; }
    get(id: string): Entity | undefined { return byId(this.items, id); }
    view(filterBy: QueryFilter): PageResult<Entity> { return query(this.items, filterBy); }
    metrics() { return summary(this.items); }
    historySize() { return this.history.length; }
    exportAsCsv(columns: readonly string[]) { return toCsv(this.items, columns); }
    exportAsJson() { return exportJson(this.items); }
    importJson(data: string, replace = false) { const incoming = parseJson(data); this.items = replace ? incoming : mergeMany(this.items, incoming); this.emit('import'); return incoming.length; }
    replace(items: readonly Entity[]) { this.items = ensureUnique(items); this.history = []; this.future = []; this.emit('replace'); }
    merge(items: readonly Entity[]) { this.items = mergeMany(this.items, items); this.emit('merge'); }
    write(action: WriteAction, entity: Entity, permissions: WritePermission): ChangeResult {
        if (this.busy)
            return { success: false, message: 'Another write is in progress' };
        const found = this.get(entity.id);
        if (action === 'create') {
            if (found)
                return { success: false, message: 'Duplicate identifier' };
            const issues = validateEntity(entity);
            if (issues.length)
                return { success: false, message: issues.map(x => x.message).join('; ') };
            if (ownerOf(entity) !== permissions.actor)
                return { success: false, message: 'Actor cannot create another owner record' };
        }
        else {
            if (!found)
                return { success: false, message: 'Record not found' };
            if (ownerOf(found) !== permissions.actor && !permissions.canModerate)
                return { success: false, message: 'Not authorized' };
        }
        const after = action === 'delete' ? undefined : entity;
        const event = describeChange(found, after);
        this.items = applyChange(this.items, event);
        this.history.push(event);
        this.future = [];
        this.emit(action);
        return { success: true, message: 'Applied', entity: after };
    }
    update(id: string, actor: string, changes: Record<string, unknown>): ChangeResult {
        const before = this.get(id);
        if (!before)
            return { success: false, message: 'Record not found' };
        try {
            const edited = editLocal(before, actor, changes);
            return this.write('update', edited, { actor, canModerate: false, viewerIds: [] });
        }
        catch (e) {
            return { success: false, message: String(e) };
        }
    }
    delete(id: string, actor: string): ChangeResult {
        const before = this.get(id);
        if (!before)
            return { success: false, message: 'Record not found' };
        return this.write('delete', before, { actor, canModerate: false, viewerIds: [] });
    }
    undo(): boolean { const change = this.history.pop(); if (!change)
        return false; this.items = revertChange(this.items, change); this.future.push(change); this.emit('undo'); return true; }
    redo(): boolean { const change = this.future.pop(); if (!change)
        return false; this.items = applyChange(this.items, change); this.history.push(change); this.emit('redo'); return true; }
    timeline(): readonly ChangeEvent[] { return [...this.history]; }
    clearHistory() { this.history = []; this.future = []; this.emit('history-clear'); }
    visible(actor: string, viewerIds: string[]): Entity[] { return this.items.filter(item => accessible(item, actor, viewerIds)); }
    owned(actor: string): Entity[] { return this.items.filter(item => ownerOf(item) === actor); }
    listed(options: QueryFilter): Entity[] { return filter(this.items, options); }
    oldestFirst(): Entity[] { return sortNewest(this.items).reverse(); }
    byMonth() { return groupByMonth(this.items); }
    byDay() { return groupByDay(this.items); }
    topAuthors(limit = 10) { return topOwners(this.items, limit); }
    daily() { return dailyCounts(this.items); }
    countToday() { return countToday(this.items); }
    countLastMonth() { return countLastMonth(this.items); }
    owners() { return distinctOwners(this.items); }
    page(page = 0, pageSize = 20) { return paginate(this.items, page, pageSize); }
    compare(firstId: string, secondId: string) { const first = this.get(firstId), second = this.get(secondId); if (!first || !second)
        throw Error('Record not found'); return patchFields(first, second); }
    apply(id: string, revision: ReturnType<typeof patchFields>): boolean { const previous = this.get(id); if (!previous)
        return false; const updated = applyPatch(previous, revision); this.items = prependUnique(removeById(this.items, id), updated); this.emit('patch'); return true; }
    async sync(task: (snapshot: readonly Entity[]) => Promise<readonly Entity[]>): Promise<boolean> {
        if (this.busy)
            return false;
        this.busy = true;
        const previous = [...this.items];
        try {
            const remote = await task(previous);
            this.items = mergeMany(this.items, remote);
            this.emit('sync');
            return true;
        }
        catch (e) {
            this.items = previous;
            this.emit('rollback');
            throw e;
        }
        finally {
            this.busy = false;
        }
    }
}
