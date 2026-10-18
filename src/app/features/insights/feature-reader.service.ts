import { Injectable } from '@angular/core';
import { SocialApi } from '../../core/social-api.service';
import { Entity, QueryFilter, query, PageResult, text, TABLE, CREATED_COLUMN, OWNER_COLUMN } from './feature-lab';
export interface RemotePage {
    items: Entity[];
    nextPage: number | null;
}
/** Insights repository supports read-only local normalization. All writes are handled by specific SocialApi methods and RLS. */
@Injectable({ providedIn: 'root' })
export class InsightsReader {
    constructor(private api: SocialApi) { }
    async read(limit = 30): Promise<Entity[]> {
        if (!this.api.ready)
            throw Error('Connect Supabase before reading');
        if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100)
            throw Error('Invalid limit');
        return await this.api.list(TABLE as never, limit) as Entity[];
    }
    async listFiltered(options: QueryFilter): Promise<PageResult<Entity>> {
        const records = await this.read(100);
        return query(records, options);
    }
    async recent(page = 0, pageSize = 20): Promise<RemotePage> {
        if (page < 0 || pageSize < 1 || pageSize > 100)
            throw Error('Invalid page');
        const all = await this.read(Math.min(100, (page + 1) * pageSize + 1));
        const items = all.slice(page * pageSize, (page + 1) * pageSize);
        return { items, nextPage: (page + 1) * pageSize < all.length ? page + 1 : null };
    }
    async search(term: string): Promise<Entity[]> {
        const normalized = text(term).toLowerCase();
        return (await this.read(100)).filter(row => JSON.stringify(row).toLowerCase().includes(normalized));
    }
    async ownedBy(userId: string): Promise<Entity[]> {
        return (await this.read(100)).filter(row => row[OWNER_COLUMN] === userId);
    }
    async since(date: string): Promise<Entity[]> {
        return (await this.read(100)).filter(row => Date.parse(String(row[CREATED_COLUMN])) >= Date.parse(date));
    }
}
