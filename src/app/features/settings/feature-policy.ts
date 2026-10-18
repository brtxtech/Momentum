import { Entity, ownerOf, titleOf, createdAt, safeDate, FEATURE_STATES, FEATURE_CATEGORIES } from './feature-lab';
export type Visibility = 'public' | 'followers' | 'event' | 'private';
export type Action = 'read' | 'create' | 'edit' | 'delete' | 'share' | 'download' | 'moderate' | 'approve';
export type Role = 'owner' | 'editor' | 'guest' | 'viewer' | 'moderator';
export type Gate = {
    allowed: boolean;
    reason: string;
    action: Action;
    actor: string;
    record: string;
};
export type Identity = {
    id: string;
    roles: Role[];
    approvedFollows: string[];
    acceptedEvents: string[];
    suspended?: boolean;
};
export type AccessResource = {
    record: Entity;
    ownerId: string;
    visibility: Visibility;
    eventId?: string;
    blockedUsers?: string[];
    deleted?: boolean;
};
export type ContentNotice = {
    level: 'info' | 'warning' | 'error';
    code: string;
    message: string;
};
export type Transition = {
    from: string;
    to: string;
    actorId: string;
    time: number;
};
export type AuditEntry = {
    actorId: string;
    action: Action;
    resourceId: string;
    allowed: boolean;
    reason: string;
    at: string;
};
export type RetentionOptions = {
    expireAfterMs: number;
    preservePinned: boolean;
    now?: number;
};
export function isSuspended(actor: Identity): boolean { return actor.suspended === true; }
export function isOwner(actor: Identity, resource: AccessResource): boolean { return actor.id === resource.ownerId; }
export function isBlocked(actor: Identity, resource: AccessResource): boolean { return resource.blockedUsers?.includes(actor.id) ?? false; }
export function isModerator(actor: Identity): boolean { return actor.roles.includes('moderator'); }
export function canRead(actor: Identity, resource: AccessResource): boolean {
    if (isSuspended(actor) || isBlocked(actor, resource) || resource.deleted)
        return false;
    if (isOwner(actor, resource))
        return true;
    if (resource.visibility === 'public')
        return true;
    if (resource.visibility === 'followers')
        return actor.approvedFollows.includes(resource.ownerId);
    if (resource.visibility === 'event')
        return !!resource.eventId && actor.acceptedEvents.includes(resource.eventId);
    return false;
}
export function canEdit(actor: Identity, resource: AccessResource): boolean {
    return !isSuspended(actor) && !isBlocked(actor, resource) && (isOwner(actor, resource) || actor.roles.includes('editor'));
}
export function canDelete(actor: Identity, resource: AccessResource): boolean {
    return !isSuspended(actor) && (isOwner(actor, resource) || isModerator(actor));
}
export function canCreate(actor: Identity): boolean {
    return !!actor.id && !isSuspended(actor) && actor.roles.some(role => role !== 'viewer');
}
export function canModerate(actor: Identity): boolean {
    return !isSuspended(actor) && isModerator(actor);
}
export function canShare(actor: Identity, resource: AccessResource): boolean {
    return canRead(actor, resource) && (resource.visibility === 'public' || isOwner(actor, resource));
}
export function canDownload(actor: Identity, resource: AccessResource): boolean {
    return canRead(actor, resource) && !resource.deleted;
}
export function canApprove(actor: Identity, resource: AccessResource): boolean {
    return !isSuspended(actor) && (isOwner(actor, resource) || isModerator(actor));
}
export function authorize(action: Action, actor: Identity, resource: AccessResource): Gate {
    const rules: Record<Action, boolean> = {
        read: canRead(actor, resource),
        create: canCreate(actor),
        edit: canEdit(actor, resource),
        delete: canDelete(actor, resource),
        share: canShare(actor, resource),
        download: canDownload(actor, resource),
        moderate: canModerate(actor),
        approve: canApprove(actor, resource)
    };
    const allowed = rules[action];
    const reason = allowed ? 'Client-side hint only: server policy still required' : isSuspended(actor) ? 'Account suspended' : isBlocked(actor, resource) ? 'Blocked' : 'Insufficient access';
    return { allowed, reason, action, actor: actor.id, record: resource.record.id };
}
export function auditFor(gate: Gate, at = new Date()): AuditEntry {
    return { actorId: gate.actor, action: gate.action, resourceId: gate.record, allowed: gate.allowed, reason: gate.reason, at: at.toISOString() };
}
export function batchAuthorize(action: Action, actor: Identity, resources: readonly AccessResource[]): Gate[] {
    return resources.map(resource => authorize(action, actor, resource));
}
export function permittedResources(action: Action, actor: Identity, resources: readonly AccessResource[]): AccessResource[] {
    return resources.filter(resource => authorize(action, actor, resource).allowed);
}
export function deniedResources(action: Action, actor: Identity, resources: readonly AccessResource[]): AccessResource[] {
    return resources.filter(resource => !authorize(action, actor, resource).allowed);
}
export function resourceFromRecord(record: Entity, visibility: Visibility = 'private'): AccessResource {
    return { record, ownerId: ownerOf(record), visibility, eventId: String(record['event_id'] ?? '') || undefined };
}
export function approvedFollowers(identity: Identity): string[] { return [...identity.approvedFollows]; }
export function acceptedEvents(identity: Identity): string[] { return [...identity.acceptedEvents]; }
export function updateFollows(identity: Identity, ids: readonly string[]): Identity {
    return { ...identity, approvedFollows: [...new Set(ids)].filter(Boolean) };
}
export function updateAcceptedEvents(identity: Identity, ids: readonly string[]): Identity {
    return { ...identity, acceptedEvents: [...new Set(ids)].filter(Boolean) };
}
export function revokeFollower(identity: Identity, ownerId: string): Identity {
    return updateFollows(identity, identity.approvedFollows.filter(id => id !== ownerId));
}
export function revokeEvent(identity: Identity, eventId: string): Identity {
    return updateAcceptedEvents(identity, identity.acceptedEvents.filter(id => id !== eventId));
}
export function blockUser(resource: AccessResource, targetId: string): AccessResource {
    return { ...resource, blockedUsers: [...new Set([...(resource.blockedUsers ?? []), targetId])] };
}
export function unblockUser(resource: AccessResource, targetId: string): AccessResource {
    return { ...resource, blockedUsers: (resource.blockedUsers ?? []).filter(id => id !== targetId) };
}
export function markDeleted(resource: AccessResource): AccessResource { return { ...resource, deleted: true }; }
export function restore(resource: AccessResource): AccessResource { return { ...resource, deleted: false }; }
export function isExpired(record: Entity, now = Date.now()): boolean {
    const expiry = safeDate(record['expires_at']);
    return expiry > 0 && expiry <= now;
}
export function expiresWithin(record: Entity, windowMs: number, now = Date.now()): boolean {
    const expiry = safeDate(record['expires_at']);
    return expiry > now && expiry <= now + windowMs;
}
export function expiredResources(resources: readonly AccessResource[], now = Date.now()): AccessResource[] {
    return resources.filter(item => isExpired(item.record, now));
}
export function currentlyActive(resources: readonly AccessResource[], now = Date.now()): AccessResource[] {
    return resources.filter(item => !isExpired(item.record, now) && !item.deleted);
}
export function shouldRetain(record: Entity, options: RetentionOptions): boolean {
    if (options.preservePinned && record['pinned'] === true)
        return true;
    const creation = createdAt(record);
    if (!creation)
        return true;
    return (options.now ?? Date.now()) - creation < options.expireAfterMs;
}
export function retentionCandidates(records: readonly Entity[], options: RetentionOptions): Entity[] {
    return records.filter(record => !shouldRetain(record, options));
}
export function validTransition(from: string, to: string): boolean {
    if (!(FEATURE_STATES as readonly string[]).includes(from))
        return false;
    if (!(FEATURE_STATES as readonly string[]).includes(to))
        return false;
    return from !== to;
}
export function recordTransition(from: string, to: string, actorId: string, at = Date.now()): Transition {
    if (!validTransition(from, to))
        throw Error('Invalid state transition');
    if (!actorId)
        throw Error('Actor ID required');
    return { from, to, actorId, time: at };
}
export function transitionHistoryIsValid(items: readonly Transition[]): boolean {
    if (!items.length)
        return true;
    for (let i = 0; i < items.length; i++) {
        if (!validTransition(items[i].from, items[i].to))
            return false;
        if (i > 0 && items[i - 1].to !== items[i].from)
            return false;
        if (i > 0 && items[i - 1].time > items[i].time)
            return false;
    }
    return true;
}
export function finalState(initial: string, changes: readonly Transition[]): string {
    if (!changes.length)
        return initial;
    if (changes[0].from !== initial || !transitionHistoryIsValid(changes))
        throw Error('Invalid state history');
    return changes[changes.length - 1].to;
}
export function contentWarnings(record: Entity): ContentNotice[] {
    const result: ContentNotice[] = [];
    if (!titleOf(record))
        result.push({ level: 'warning', code: 'empty_content', message: 'No text available' });
    if (!ownerOf(record))
        result.push({ level: 'error', code: 'missing_owner', message: 'Missing ownership metadata' });
    if (isExpired(record))
        result.push({ level: 'info', code: 'expired', message: 'Record is expired' });
    if (!createdAt(record))
        result.push({ level: 'warning', code: 'missing_date', message: 'Missing creation date' });
    return result;
}
export function catalogState(value: string): boolean { return (FEATURE_STATES as readonly string[]).includes(value); }
export function catalogCategory(value: string): boolean { return (FEATURE_CATEGORIES as readonly string[]).includes(value); }
export function stateHistogram(items: readonly Entity[]): Record<string, number> {
    const result: Record<string, number> = {};
    for (const record of items) {
        const state = String(record['status'] ?? 'unspecified');
        result[state] = (result[state] || 0) + 1;
    }
    return result;
}
export function categoryHistogram(items: readonly Entity[]): Record<string, number> {
    const result: Record<string, number> = {};
    for (const record of items) {
        const category = String(record['category'] ?? record['kind'] ?? 'unspecified');
        result[category] = (result[category] || 0) + 1;
    }
    return result;
}
