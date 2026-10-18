import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
@Injectable({ providedIn: 'root' })
export class SupabaseService {
    private client?: SupabaseClient;
    connect(url: string, publishableKey: string) { if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url))
        throw new Error('Invalid Supabase project URL'); if (!publishableKey || publishableKey.startsWith('sb_secret_'))
        throw new Error('Only a publishable/anon key is permitted'); this.client = createClient(url, publishableKey); }
    get configured() { return !!this.client; }
    async signIn(email: string, password: string) { if (!this.client)
        throw new Error('Configure Supabase first'); const { data, error } = await this.client.auth.signInWithPassword({ email, password }); if (error)
        throw error; return data.user; }
    async signUp(email: string, password: string) { if (!this.client)
        throw new Error('Configure Supabase first'); const { data, error } = await this.client.auth.signUp({ email, password }); if (error)
        throw error; return data.user; }
    async signOut() { if (!this.client)
        throw new Error('Configure Supabase first'); const { error } = await this.client.auth.signOut(); if (error)
        throw error; }
    async user() { if (!this.client)
        return null; const { data, error } = await this.client.auth.getUser(); if (error)
        return null; return data.user; }
    async eventMedia(eventId: string) { if (!this.client)
        throw new Error('Configure Supabase first'); const { data, error } = await this.client.from('event_media').select('id,caption,storage_path').eq('event_id', eventId).limit(100); if (error)
        throw error; return Promise.all((data || []).map(async (row) => { const { data: signed, error: signError } = await this.client!.storage.from('event-private').createSignedUrl(row.storage_path, 60); if (signError)
        throw signError; return { ...row, url: signed.signedUrl }; })); }
    async uploadEventPhoto(eventId: string, file: File, caption: string) { if (!this.client)
        throw new Error('Configure Supabase first'); if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024)
        throw new Error('Only JPEG, PNG and WebP up to 10MB'); const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'; const path = `${eventId}/${crypto.randomUUID()}.${ext}`; const { error } = await this.client.storage.from('event-private').upload(path, file, { upsert: false, contentType: file.type }); if (error)
        throw error; const { error: metadata } = await this.client.from('event_media').insert({ event_id: eventId, storage_path: path, caption: caption.slice(0, 500) }); if (metadata)
        throw new Error('Media uploaded but metadata failed; an administrator should clean up the orphaned object. ' + metadata.message); }
}
