import { Injectable, signal, computed, effect } from '@angular/core';
import { Post, Story, EventItem, Conversation, NotificationItem, Preferences } from './models';
import { DEMO_POSTS, DEMO_STORIES, DEMO_EVENTS, DEMO_CHATS, DEMO_NOTIFICATIONS } from './demo-data';
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
function restore<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) as T : clone(fallback);
    }
    catch {
        return clone(fallback);
    }
}
@Injectable({ providedIn: 'root' })
export class StudioStore {
    readonly posts = signal<Post[]>(restore('moments-posts', DEMO_POSTS));
    readonly stories = signal<Story[]>(restore('moments-stories', DEMO_STORIES));
    readonly events = signal<EventItem[]>(restore('moments-events', DEMO_EVENTS));
    readonly chats = signal<Conversation[]>(restore('moments-chats', DEMO_CHATS));
    readonly notifications = signal<NotificationItem[]>(restore('moments-notifications', DEMO_NOTIFICATIONS));
    readonly preferences = signal<Preferences>(restore('moments-preferences', { theme: 'dark', accent: 'rose', density: 'comfortable', motion: true, privateProfile: true }));
    readonly search = signal('');
    readonly toast = signal('');
    readonly saved = computed(() => this.posts().filter(p => p.saved));
    readonly unread = computed(() => this.notifications().filter(n => !n.read).length);
    readonly filtered = computed(() => this.posts().filter(p => [p.author, p.handle, p.caption, p.event].some(s => s.toLowerCase().includes(this.search().toLowerCase()))));
    constructor() { effect(() => localStorage.setItem('moments-posts', JSON.stringify(this.posts()))); effect(() => localStorage.setItem('moments-stories', JSON.stringify(this.stories()))); effect(() => localStorage.setItem('moments-events', JSON.stringify(this.events()))); effect(() => localStorage.setItem('moments-chats', JSON.stringify(this.chats()))); effect(() => localStorage.setItem('moments-notifications', JSON.stringify(this.notifications()))); effect(() => localStorage.setItem('moments-preferences', JSON.stringify(this.preferences()))); effect(() => { const p = this.preferences(); document.documentElement.dataset['theme'] = p.theme === 'system' ? (matchMedia('(prefers-color-scheme:light)').matches ? 'light' : 'dark') : p.theme; document.documentElement.dataset['accent'] = p.accent; document.documentElement.dataset['density'] = p.density; document.documentElement.dataset['motion'] = p.motion ? 'normal' : 'reduced'; }); }
    image(n: number) { return 'assets/editorial-' + String(((n - 1) % 12) + 1).padStart(2, '0') + '.svg'; }
    announce(message: string) { this.toast.set(message); }
    toggleLike(id: string) { this.posts.update(items => items.map(p => p.id === id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p)); }
    toggleSave(id: string) { this.posts.update(items => items.map(p => p.id === id ? { ...p, saved: !p.saved } : p)); }
    addComment(id: string, body: string) {
        const safe = body.trim().slice(0, 500); if (!safe)
            return; this.posts.update(items => items.map(p => p.id === id ? { ...p, comments: [...p.comments, { id: crypto.randomUUID(), author: 'You', body: safe, createdAt: 'Just now' }] } : p));
    }
    createPost(caption: string, image: number) {
        const safe = caption.trim().slice(0, 1500); if (!safe)
            return; this.posts.update(items => [{ id: crypto.randomUUID(), author: 'You', handle: 'yourstudio', image, avatar: 7, caption: safe, likes: 0, liked: false, saved: false, comments: [], createdAt: 'Just now', event: 'My memories' }, ...items]); this.announce('Saved in this browser — demo only');
    }
    sendMessage(chatId: string, body: string) {
        const safe = body.trim().slice(0, 1000); if (!safe)
            return; this.chats.update(items => items.map(c => c.id === chatId ? { ...c, messages: [...c.messages, { id: crypto.randomUUID(), mine: true, body: safe, createdAt: 'Just now' }] } : c));
    }
    replaceChatMessages(chatId: string, messages: Array<{ id?: string; mine?: boolean; body: string; createdAt?: string; created_at?: string; }>) {
        const next = messages.map((message, index) => ({
            id: message.id ?? `${chatId}-${index}`,
            mine: message.mine ?? false,
            body: message.body || '',
            createdAt: message.createdAt ?? message.created_at ?? 'Just now'
        }));

        this.chats.update(items => items.map(chat => chat.id === chatId ? { ...chat, messages: next } : chat));
    }
    addEvent(event: EventItem) { this.events.update(items => [event, ...items]); }
    updatePreferences(patch: Partial<Preferences>) { this.preferences.update(p => ({ ...p, ...patch })); }
    markAllRead() { this.notifications.update(items => items.map(n => ({ ...n, read: true }))); }
    reset() {
        for (const key of ['moments-posts', 'moments-stories', 'moments-events', 'moments-chats', 'moments-notifications', 'moments-preferences'])
            localStorage.removeItem(key); location.reload();
    }
}
