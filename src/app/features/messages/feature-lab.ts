/** Messages: functional data transformations for private messages. */
export const FEATURE = "messages" as const;
export const TABLE = "messages" as const;
export const TEXT_COLUMN = "body" as const;
export const OWNER_COLUMN = "sender_id" as const;
export const CREATED_COLUMN = "created_at" as const;
export const FEATURE_CATEGORIES = ["text", "attachment"] as const;
export const FEATURE_STATES = ["sent", "received", "deleted"] as const;
export type Entity = Record<string, unknown> & {
    id: string;
};
export type QueryFilter = {
    search?: string;
    ownerId?: string;
    from?: string;
    to?: string;
    states?: string[];
    categories?: string[];
    sort?: 'newest' | 'oldest' | 'name';
    page?: number;
    pageSize?: number;
};
export type FieldIssue = {
    field: string;
    message: string;
};
export type PageResult<T> = {
    records: T[];
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
};
export type RecordPatch = {
    id: string;
    changes: Record<string, unknown>;
    timestamp: string;
    revision: number;
};
export type ChangeEvent = {
    id: string;
    action: 'create' | 'edit' | 'delete' | 'restore';
    before?: Entity;
    after?: Entity;
    at: string;
};
export function isObject(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === 'object' && !Array.isArray(value); }
export function text(value: unknown): string { return typeof value === 'string' ? value.normalize('NFC').trim() : String(value ?? '').trim(); }
export function safeDate(value: unknown): number { if (value instanceof Date)
    return value.getTime(); if (typeof value !== 'string' && typeof value !== 'number')
    return 0; const ms = new Date(value).getTime(); return Number.isFinite(ms) ? ms : 0; }
export function stableId(record: Partial<Entity>): string { return text(record.id); }
export function ownerOf(record: Record<string, unknown>): string { return text(record[OWNER_COLUMN]); }
export function titleOf(record: Record<string, unknown>): string { const value = record[TEXT_COLUMN]; return typeof value === 'object' ? JSON.stringify(value) : text(value); }
export function createdAt(record: Record<string, unknown>): number { return safeDate(record[CREATED_COLUMN]); }
export function ensureUnique(records: readonly Entity[]): Entity[] { const found = new Set<string>(); return records.filter(v => { const id = stableId(v); if (!id || found.has(id))
    return false; found.add(id); return true; }); }
export function byId(records: readonly Entity[], id: string): Entity | undefined { return records.find(item => item.id === id); }
export function toIndex(records: readonly Entity[]): Map<string, Entity> { return new Map(records.map(item => [item.id, item])); }
export function byOwner(records: readonly Entity[], userId: string): Entity[] { return records.filter(item => ownerOf(item) === userId); }
export function countByOwner(records: readonly Entity[]): Map<string, number> { const counts = new Map<string, number>(); for (const item of records) {
    const key = ownerOf(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
} return counts; }
export function sortNewest(records: readonly Entity[]): Entity[] { return [...records].sort((a, b) => createdAt(b) - createdAt(a) || a.id.localeCompare(b.id)); }
export function sortOldest(records: readonly Entity[]): Entity[] { return [...records].sort((a, b) => createdAt(a) - createdAt(b) || a.id.localeCompare(b.id)); }
export function sortTitle(records: readonly Entity[]): Entity[] { return [...records].sort((a, b) => titleOf(a).localeCompare(titleOf(b)) || a.id.localeCompare(b.id)); }
export function groupByDay(records: readonly Entity[], tz = 'en-CA'): Map<string, Entity[]> { const groups = new Map<string, Entity[]>(); for (const item of sortNewest(records)) {
    const time = createdAt(item);
    const day = time ? new Date(time).toLocaleDateString(tz) : 'undated';
    groups.set(day, [...(groups.get(day) || []), item]);
} return groups; }
export function groupByMonth(records: readonly Entity[]): Map<string, Entity[]> { const groups = new Map<string, Entity[]>(); for (const item of records) {
    const time = createdAt(item);
    const key = time ? new Date(time).toISOString().slice(0, 7) : 'undated';
    groups.set(key, [...(groups.get(key) || []), item]);
} return groups; }
export function search(records: readonly Entity[], query: string): Entity[] { const q = text(query).toLocaleLowerCase(); if (!q)
    return [...records]; return records.filter(item => titleOf(item).toLocaleLowerCase().includes(q)); }
export function withinDates(records: readonly Entity[], from?: string, to?: string): Entity[] { const fromMs = from ? safeDate(from) : 0; const toMs = to ? safeDate(to) : Number.POSITIVE_INFINITY; return records.filter(item => createdAt(item) >= fromMs && createdAt(item) <= toMs); }
export function matchesCategory(record: Entity, categories: readonly string[]): boolean { return !categories.length || categories.includes(text(record['category'] ?? record['kind'] ?? record['type'])); }
export function matchesState(record: Entity, states: readonly string[]): boolean { return !states.length || states.includes(text(record['status'] ?? (record['read'] ? 'read' : 'unread'))); }
export function filter(records: readonly Entity[], query: QueryFilter): Entity[] { let output = [...records]; if (query.search)
    output = search(output, query.search); if (query.ownerId)
    output = byOwner(output, query.ownerId); if (query.from || query.to)
    output = withinDates(output, query.from, query.to); if (query.states?.length)
    output = output.filter(r => matchesState(r, query.states!)); if (query.categories?.length)
    output = output.filter(r => matchesCategory(r, query.categories!)); return query.sort === 'name' ? sortTitle(output) : query.sort === 'oldest' ? sortOldest(output) : sortNewest(output); }
export function paginate<T>(items: readonly T[], page = 0, pageSize = 20): PageResult<T> { if (!Number.isSafeInteger(page) || page < 0)
    throw Error('Invalid page'); if (!Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100)
    throw Error('Invalid page size'); const start = page * pageSize; return { records: items.slice(start, start + pageSize), page, pageSize, total: items.length, hasMore: start + pageSize < items.length }; }
export function query(records: readonly Entity[], options: QueryFilter): PageResult<Entity> { return paginate(filter(records, options), options.page ?? 0, options.pageSize ?? 20); }
export function total(records: readonly Entity[]): number { return records.length; }
export function distinctOwners(records: readonly Entity[]): number { return new Set(records.map(ownerOf).filter(Boolean)).size; }
export function latest(records: readonly Entity[]): Entity | undefined { return sortNewest(records)[0]; }
export function oldest(records: readonly Entity[]): Entity | undefined { return sortOldest(records)[0]; }
export function averageTitleLength(records: readonly Entity[]): number { if (!records.length)
    return 0; return records.reduce((sum, item) => sum + titleOf(item).length, 0) / records.length; }
export function minDate(records: readonly Entity[]): number { return records.length ? Math.min(...records.map(createdAt)) : 0; }
export function maxDate(records: readonly Entity[]): number { return records.length ? Math.max(...records.map(createdAt)) : 0; }
export function countSince(records: readonly Entity[], ms: number): number { return records.filter(item => createdAt(item) >= ms).length; }
export function countToday(records: readonly Entity[], now = Date.now()): number { const d = new Date(now); d.setHours(0, 0, 0, 0); return countSince(records, d.getTime()); }
export function countLastWeek(records: readonly Entity[], now = Date.now()): number { return countSince(records, now - 7 * 86400000); }
export function countLastMonth(records: readonly Entity[], now = Date.now()): number { return countSince(records, now - 30 * 86400000); }
export function dailyCounts(records: readonly Entity[]): Array<{
    date: string;
    count: number;
}> { return [...groupByDay(records).entries()].map(([date, items]) => ({ date, count: items.length })).sort((a, b) => a.date.localeCompare(b.date)); }
export function topOwners(records: readonly Entity[], limit = 10): Array<{
    owner: string;
    count: number;
}> { return [...countByOwner(records)].map(([owner, count]) => ({ owner, count })).sort((a, b) => b.count - a.count || a.owner.localeCompare(b.owner)).slice(0, limit); }
export function normalizedTitle(record: Entity): string { return titleOf(record).normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, ' '); }
export function duplicateTitles(records: readonly Entity[]): string[] { const found = new Set<string>(); const duplicates = new Set<string>(); for (const item of records) {
    const t = normalizedTitle(item);
    if (found.has(t))
        duplicates.add(t);
    found.add(t);
} return [...duplicates]; }
export function createLocal(id: string, ownerId: string, heading: string, at = new Date()): Entity { if (!id || !ownerId)
    throw Error('ID and owner required'); return { id, ...((OWNER_COLUMN as string) === 'id' ? {} : { [OWNER_COLUMN]: ownerId }), [TEXT_COLUMN]: heading, [CREATED_COLUMN]: at.toISOString(), revision: 1, status: FEATURE_STATES[0] }; }
export function editLocal(record: Entity, actor: string, changes: Record<string, unknown>, at = new Date()): Entity { if (ownerOf(record) !== actor)
    throw Error('Owner mismatch'); if (changes['id'] !== undefined || changes[OWNER_COLUMN] !== undefined)
    throw Error('Immutable identity'); return { ...record, ...changes, updated_at: at.toISOString(), revision: Number(record['revision'] ?? 1) + 1 }; }
export function patchFields(before: Entity, after: Entity): RecordPatch { const changes: Record<string, unknown> = {}; for (const [key, value] of Object.entries(after)) {
    if (key === 'id')
        continue;
    if (JSON.stringify(before[key]) !== JSON.stringify(value))
        changes[key] = value;
} return { id: before.id, changes, timestamp: new Date().toISOString(), revision: Number(after['revision'] ?? 1) }; }
export function applyPatch(before: Entity, patch: RecordPatch): Entity { if (before.id !== patch.id)
    throw Error('Patch identity mismatch'); if (patch.changes['id'] !== undefined || patch.changes[OWNER_COLUMN] !== undefined)
    throw Error('Immutable identity'); return { ...before, ...patch.changes }; }
export function mergeRevision(local: Entity, remote: Entity): Entity { if (local.id !== remote.id)
    throw Error('Record mismatch'); const lr = Number(local['revision'] ?? 0); const rr = Number(remote['revision'] ?? 0); if (lr !== rr)
    return lr > rr ? local : remote; return safeDate(local['updated_at']) >= safeDate(remote['updated_at']) ? local : remote; }
export function mergeMany(local: readonly Entity[], remote: readonly Entity[]): Entity[] { const map = toIndex(local); for (const item of remote) {
    const before = map.get(item.id);
    map.set(item.id, before ? mergeRevision(before, item) : item);
} return sortNewest([...map.values()]); }
export function removeById(records: readonly Entity[], id: string): Entity[] { return records.filter(r => r.id !== id); }
export function updateById(records: readonly Entity[], id: string, changes: Record<string, unknown>): Entity[] { return records.map(r => r.id === id ? { ...r, ...changes, id } : r); }
export function prependUnique(records: readonly Entity[], record: Entity): Entity[] { return [record, ...removeById(records, record.id)]; }
export function describeChange(before: Entity | undefined, after: Entity | undefined): ChangeEvent { const id = before?.id ?? after?.id ?? ''; if (!id)
    throw Error('No record'); return { id, action: !before ? 'create' : !after ? 'delete' : 'edit', before, after, at: new Date().toISOString() }; }
export function revertChange(records: readonly Entity[], event: ChangeEvent): Entity[] { if (!event.before)
    return removeById(records, event.id); return prependUnique(records, event.before); }
export function applyChange(records: readonly Entity[], event: ChangeEvent): Entity[] { if (!event.after)
    return removeById(records, event.id); return prependUnique(records, event.after); }
export function toCsv(records: readonly Entity[], columns: readonly string[]): string { const esc = (value: unknown) => '"' + text(typeof value === 'object' ? JSON.stringify(value) : value).replace(/"/g, '""') + '"'; return [columns.map(esc).join(','), ...records.map(record => columns.map(c => esc(record[c])).join(','))].join('\n'); }
export function exportJson(records: readonly Entity[]): string { return JSON.stringify(records, null, 2); }
export function parseJson(data: string): Entity[] { const v: unknown = JSON.parse(data); if (!Array.isArray(v))
    throw Error('Expected array'); return v.filter((r): r is Entity => isObject(r) && typeof r['id'] === 'string'); }
export function safeFilename(record: Entity): string { return (normalizedTitle(record).replace(/[^a-z0-9_-]+/g, '-').slice(0, 60) || record.id) + '.json'; }
export function nonEmpty(records: readonly Entity[]): boolean { return records.length > 0; }
export function hasOwner(record: Entity, actor: string): boolean { return !!actor && ownerOf(record) === actor; }
export function accessible(record: Entity, actor: string, viewerIds: readonly string[]): boolean { return hasOwner(record, actor) || viewerIds.includes(actor); }
export function validateText(value: unknown, min = 0, max = 2200): FieldIssue[] { const v = text(value); const issues: FieldIssue[] = []; if (v.length < min)
    issues.push({ field: TEXT_COLUMN, message: 'Too short' }); if (v.length > max)
    issues.push({ field: TEXT_COLUMN, message: 'Too long' }); if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v))
    issues.push({ field: TEXT_COLUMN, message: 'Control characters forbidden' }); return issues; }
export function validateEntity(record: Record<string, unknown>): FieldIssue[] { const issues: FieldIssue[] = []; if (!text(record['id']))
    issues.push({ field: 'id', message: 'Record ID required' }); if (!ownerOf(record))
    issues.push({ field: OWNER_COLUMN, message: 'Owner ID required' }); if (!text(record[CREATED_COLUMN]))
    issues.push({ field: CREATED_COLUMN, message: 'Timestamp required' }); return issues; }
export function validateStates(states: readonly string[]): FieldIssue[] { return states.filter(s => !(FEATURE_STATES as readonly string[]).includes(s)).map(s => ({ field: 'status', message: 'Unsupported state ' + s })); }
export function validateCategories(values: readonly string[]): FieldIssue[] { return values.filter(s => !(FEATURE_CATEGORIES as readonly string[]).includes(s)).map(s => ({ field: 'category', message: 'Unsupported category ' + s })); }
export function summary(records: readonly Entity[]): {
    records: number;
    owners: number;
    newest?: string;
    oldest?: string;
    averageText: number;
    lastWeek: number;
} { return { records: total(records), owners: distinctOwners(records), newest: latest(records)?.id, oldest: oldest(records)?.id, averageText: averageTitleLength(records), lastWeek: countLastWeek(records) }; }
