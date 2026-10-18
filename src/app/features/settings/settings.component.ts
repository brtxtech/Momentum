import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudioStore } from '../../core/store.service';
import { SupabaseService } from '../../core/supabase.service';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { Preferences } from '../../core/models';
@Component({ standalone: true, imports: [CommonModule, FormsModule, PageHeaderComponent], template: `<ms-page-header title="Settings & privacy" subtitle="A calmer, more personal experience—on your terms." eyebrow="PREFERENCES"/><div class="settings-grid"><section class="panel form-stack"><h3>Appearance</h3><label>Theme<select [ngModel]="store.preferences().theme" (ngModelChange)="set('theme',$event)"><option value="dark">Dark</option><option value="light">Light</option><option value="system">System</option></select></label><label>Accent<select [ngModel]="store.preferences().accent" (ngModelChange)="set('accent',$event)"><option value="rose">Rose</option><option value="violet">Violet</option><option value="emerald">Emerald</option><option value="gold">Gold</option></select></label><label>Density<select [ngModel]="store.preferences().density" (ngModelChange)="set('density',$event)"><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></label><label class="checkbox-row"><input type="checkbox" [ngModel]="store.preferences().motion" (ngModelChange)="set('motion',$event)"> Enable animations</label><label class="checkbox-row"><input type="checkbox" [ngModel]="store.preferences().privateProfile" (ngModelChange)="set('privateProfile',$event)"> Private profile preference (demo)</label></section><section class="panel form-stack"><h3>Supabase connection</h3><p class="muted">Enter only your project URL and publishable/anon key. Never paste a service-role key.</p><label>Project URL<input [(ngModel)]="url" placeholder="https://PROJECT.supabase.co"></label><label>Publishable key<input [(ngModel)]="key" type="password" placeholder="sb_publishable_..."></label><button class="btn btn-outline" (click)="connect()">Connect for this session</button><label>Email<input [(ngModel)]="email" type="email" autocomplete="username"></label><label>Password<input [(ngModel)]="password" type="password" autocomplete="current-password"></label><div class="inline-actions"><button class="btn btn-primary" (click)="auth('in')">Sign in</button><button class="btn btn-outline" (click)="auth('up')">Sign up</button><button class="btn btn-outline" (click)="signOut()">Sign out</button></div><p role="status">{{status()}}</p><p class="muted tiny">Connection credentials are not persisted by this form. Supabase SDK may persist authenticated sessions according to its default settings.</p></section><section class="panel form-stack"><h3>Demo data</h3><p class="muted">Likes, comments, posts and chats in this demonstration are stored in your browser's localStorage.</p><button class="btn btn-outline" (click)="export()">Export preferences</button><button class="btn btn-danger" (click)="reset()">Reset local demo data</button></section></div>` })
export class SettingsComponent {
    url = '';
    key = '';
    email = '';
    password = '';
    status = signal('Not connected');
    constructor(public store: StudioStore, private sb: SupabaseService) { }
    set<K extends keyof Preferences>(key: K, value: Preferences[K]) { this.store.updatePreferences({ [key]: value }); }
    connect() { try {
        this.sb.connect(this.url, this.key);
        this.status.set('Supabase client configured for this session. Backend permissions must be deployed separately.');
    }
    catch (e) {
        this.status.set(e instanceof Error ? e.message : 'Configuration failed');
    } }
    async auth(kind: 'in' | 'up') { try {
        if (kind === 'in')
            await this.sb.signIn(this.email, this.password);
        else
            await this.sb.signUp(this.email, this.password);
        this.password = '';
        this.status.set(kind === 'in' ? 'Signed in' : 'Sign-up requested. Check email confirmation if enabled.');
    }
    catch (e) {
        this.status.set(e instanceof Error ? e.message : 'Authentication failed');
    } }
    async signOut() { try {
        await this.sb.signOut();
        this.status.set('Signed out');
    }
    catch (e) {
        this.status.set(e instanceof Error ? e.message : 'Sign out failed');
    } }
    export() { const blob = new Blob([JSON.stringify(this.store.preferences(), null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'moments-preferences.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
    reset() { if (confirm('Delete all local demo data and restore defaults?'))
        this.store.reset(); }
}
