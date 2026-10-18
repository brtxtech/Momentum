import { Entity, text, safeDate, titleOf, ownerOf, createdAt, sortNewest, QueryFilter, filter, paginate, PageResult } from './feature-lab';
export const DISPLAY_LABEL = "Invitations";
export const MIN_TITLE_LENGTH = 1;
export const MAX_TITLE_LENGTH = 255;
export const ALLOWED_MEDIA = [] as const;
export const MAX_MEDIA_BYTES = 5242880;
export interface EditorDraft {
    id?: string;
    content: string;
    category?: string;
    state?: string;
    ownerId?: string;
    file?: {
        name: string;
        size: number;
        type: string;
    };
    createdAt?: string;
}
export interface EditorError {
    field: 'content' | 'category' | 'state' | 'file' | 'ownerId' | 'createdAt';
    message: string;
}
export interface AuditDetail {
    actorId: string;
    recordId: string;
    action: string;
    at: string;
    changes: Record<string, unknown>;
}
export interface EditorResult {
    ok: boolean;
    draft: EditorDraft;
    errors: EditorError[];
}
export function sanitizeInput(value: unknown): string { return text(value).replace(/\u0000/g, '').replace(/\r\n?/g, '\n'); }
export function validateDraft(draft: EditorDraft): EditorResult {
    const errors: EditorError[] = [];
    const content = sanitizeInput(draft.content);
    if (content.length < MIN_TITLE_LENGTH)
        errors.push({ field: 'content', message: 'Required' });
    if (content.length > MAX_TITLE_LENGTH)
        errors.push({ field: 'content', message: 'Too long' });
    if (draft.file) {
        if (!ALLOWED_MEDIA.includes(draft.file.type as never))
            errors.push({ field: 'file', message: 'Unsupported media type' });
        if (draft.file.size <= 0 || draft.file.size > MAX_MEDIA_BYTES)
            errors.push({ field: 'file', message: 'Invalid file size' });
    }
    if (draft.ownerId !== undefined && !draft.ownerId.trim())
        errors.push({ field: 'ownerId', message: 'Owner required' });
    if (draft.createdAt && safeDate(draft.createdAt) === 0)
        errors.push({ field: 'createdAt', message: 'Invalid timestamp' });
    return { ok: !errors.length, draft: { ...draft, content }, errors };
}
export function canSubmit(draft: EditorDraft): boolean { return validateDraft(draft).ok; }
export function remainingChars(draft: EditorDraft): number { return Math.max(0, MAX_TITLE_LENGTH - sanitizeInput(draft.content).length); }
export function hasMedia(draft: EditorDraft): boolean { return !!draft.file; }
export function filenameOf(draft: EditorDraft): string { return draft.file?.name ?? ''; }
export function acceptsFile(file: {
    name: string;
    size: number;
    type: string;
}): boolean { return ALLOWED_MEDIA.includes(file.type as never) && file.size > 0 && file.size <= MAX_MEDIA_BYTES; }
export function fileSizeMb(file: {
    size: number;
}): number { return Math.round(file.size / 1048576 * 100) / 100; }
export function safePreviewName(file: {
    name: string;
}): string { return file.name.replace(/[\\/\u0000-\u001f]/g, '_').slice(0, 100); }
export function newDraft(ownerId: string, content = ''): EditorDraft { return { content, ownerId, createdAt: new Date().toISOString() }; }
export function changeDraft(draft: EditorDraft, patch: Partial<EditorDraft>): EditorDraft { return { ...draft, ...patch, ownerId: draft.ownerId }; }
export function resetDraft(ownerId: string): EditorDraft { return newDraft(ownerId); }
export function toAudit(actorId: string, recordId: string, action: string, changes: Record<string, unknown>): AuditDetail { if (!actorId || !recordId)
    throw Error('Missing identity'); return { actorId, recordId, action, changes, at: new Date().toISOString() }; }
export function validAudit(item: AuditDetail): boolean { return !!item.actorId && !!item.recordId && !!item.action && !!safeDate(item.at); }
export function authorSummary(records: readonly Entity[]): Array<{
    actor: string;
    count: number;
}> { const result = new Map<string, number>(); for (const r of records) {
    const actor = ownerOf(r);
    result.set(actor, (result.get(actor) || 0) + 1);
} return [...result].map(([actor, count]) => ({ actor, count })).sort((a, b) => b.count - a.count); }
export function popularityRank(records: readonly Entity[], field = 'like_count'): Entity[] { return [...records].sort((a, b) => Number(b[field] ?? 0) - Number(a[field] ?? 0) || createdAt(b) - createdAt(a)); }
export function recentActivity(records: readonly Entity[], limit = 10): Entity[] { return sortNewest(records).slice(0, limit); }
export function filteredPage(records: readonly Entity[], options: QueryFilter): PageResult<Entity> { return paginate(filter(records, options), options.page ?? 0, options.pageSize ?? 20); }
export function matchAny(records: readonly Entity[], keywords: readonly string[]): Entity[] { const qs = keywords.map(q => q.toLowerCase().trim()).filter(Boolean); return records.filter(r => qs.some(q => titleOf(r).toLowerCase().includes(q))); }
export function matchAll(records: readonly Entity[], keywords: readonly string[]): Entity[] { const qs = keywords.map(q => q.toLowerCase().trim()).filter(Boolean); return records.filter(r => qs.every(q => titleOf(r).toLowerCase().includes(q))); }
export function fuzzyMatch(records: readonly Entity[], fragment: string): Entity[] { const chars = fragment.toLowerCase().split('').filter(Boolean); return records.filter(r => { const word = titleOf(r).toLowerCase(); let i = 0; for (const c of word)
    if (c === chars[i])
        i++; return i === chars.length; }); }
export function weightedSearch(records: readonly Entity[], fragment: string): Array<{
    record: Entity;
    score: number;
}> { const q = fragment.toLowerCase().trim(); return records.map(record => { const title = titleOf(record).toLowerCase(); const score = q ? title === q ? 100 : title.startsWith(q) ? 50 : title.includes(q) ? 25 : 0 : 1; return { record, score }; }).filter(x => x.score > 0).sort((a, b) => b.score - a.score || createdAt(b.record) - createdAt(a.record)); }
export function compareByDate(a: Entity, b: Entity): number { return createdAt(a) - createdAt(b); }
export function timelineBuckets(records: readonly Entity[], days = 7, now = Date.now()): number[] { const counts = Array.from({ length: days }, () => 0); for (const record of records) {
    const age = Math.floor((now - createdAt(record)) / 86400000);
    if (age >= 0 && age < days)
        counts[days - 1 - age]++;
} return counts; }
export function timelineGrowth(records: readonly Entity[], days = 7, now = Date.now()): Array<{
    date: string;
    count: number;
    accumulated: number;
}> { const counts = timelineBuckets(records, days, now); let sum = 0; return counts.map((count, index) => { sum += count; return { date: new Date(now - (days - index - 1) * 86400000).toISOString().slice(0, 10), count, accumulated: sum }; }); }
export function percentOf(part: number, total: number): number { return total > 0 ? Math.round(part / total * 10000) / 100 : 0; }
export function averagePerDay(records: readonly Entity[], days = 30, now = Date.now()): number { const since = now - days * 86400000; return records.filter(r => createdAt(r) >= since).length / days; }
export function recordQuality(records: readonly Entity[]): {
    total: number;
    missingTitles: number;
    missingOwners: number;
    missingDates: number;
} { return { total: records.length, missingTitles: records.filter(r => !titleOf(r)).length, missingOwners: records.filter(r => !ownerOf(r)).length, missingDates: records.filter(r => !createdAt(r)).length }; }
export function prioritize(records: readonly Entity[], score: (record: Entity) => number): Entity[] { return [...records].sort((a, b) => score(b) - score(a) || compareByDate(b, a)); }
export function descriptiveStats(records: readonly Entity[]): {
    count: number;
    medianText: number;
    minText: number;
    maxText: number;
} { const lengths = records.map(r => titleOf(r).length).sort((a, b) => a - b); const mid = Math.floor(lengths.length / 2); return { count: lengths.length, medianText: lengths.length ? lengths.length % 2 ? lengths[mid] : (lengths[mid - 1] + lengths[mid]) / 2 : 0, minText: lengths[0] ?? 0, maxText: lengths[lengths.length - 1] ?? 0 }; }
