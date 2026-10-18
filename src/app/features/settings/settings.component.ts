import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudioStore } from '../../core/store.service';
import { SupabaseService } from '../../core/supabase.service';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { Preferences } from '../../core/models';
@Component({ standalone: true, imports: [CommonModule, FormsModule, PageHeaderComponent], template: `<div class="account-page"><ms-page-header title="Settings & privacy" subtitle="A calmer, more personal experience—on your terms." eyebrow="PREFERENCES" /><div class="settings-grid"><section class="panel form-stack"><h3>Appearance</h3><label>Theme<select [ngModel]="store.preferences().theme" (ngModelChange)="set('theme',$event)"><option value="dark">Dark</option><option value="light">Light</option><option value="system">System</option></select></label><label>Accent<select [ngModel]="store.preferences().accent" (ngModelChange)="set('accent',$event)"><option value="rose">Rose</option><option value="violet">Violet</option><option value="emerald">Emerald</option><option value="gold">Gold</option></select></label><label>Density<select [ngModel]="store.preferences().density" (ngModelChange)="set('density',$event)"><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></label><label class="checkbox-row"><span>Enable animations</span><input type="checkbox" [ngModel]="store.preferences().motion" (ngModelChange)="set('motion',$event)"/></label><label class="checkbox-row"><span>Private profile preference (demo)</span><input type="checkbox" [ngModel]="store.preferences().privateProfile" (ngModelChange)="set('privateProfile',$event)"/></label></section><aside class="panel form-stack"><h3>Supabase connection</h3><p class="muted">Enter only your project URL and publishable/anon key. Never paste a service-role key.</p><label>Project URL<input [(ngModel)]="url" placeholder="https://PROJECT.supabase.co"/></label><label>Publishable key<input [(ngModel)]="key" type="password" placeholder="sb_publishable_..."/></label><button type="button" class="btn btn-outline" (click)="connect()">Connect for this session</button><label>Email<input [(ngModel)]="email" type="email" autocomplete="username"/></label><label>Password<input [(ngModel)]="password" type="password" autocomplete="current-password"/></label><div class="inline-actions"><button type="button" class="btn btn-primary" (click)="auth('in')">Sign in</button><button type="button" class="btn btn-outline" (click)="auth('up')">Sign up</button><button type="button" class="btn btn-outline" (click)="signOut()">Sign out</button></div><p class="notice" role="status">{{status}}</p><p class="muted tiny">Connection credentials are not persisted by this form.</p></aside></div></div>` })
export class SettingsComponent {
    url = '';
    key = '';
    email = '';
    password = '';
    status = 'Not connected';
    constructor(public store: StudioStore, private sb: SupabaseService) { }
    set<K extends keyof Preferences>(key: K, value: Preferences[K]) { this.store.updatePreferences({ [key]: value }); }
    connect() {
        try {
            this.sb.connect(this.url, this.key);
            this.status = 'Supabase client configured for this session. Backend permissions must be deployed separately.';
        }
        catch (e) {
            this.status = e instanceof Error ? e.message : 'Configuration failed';
        }
    }
    async auth(kind: 'in' | 'up') {
        try {
            if (kind === 'in')
                await this.sb.signIn(this.email, this.password);
            else
                await this.sb.signUp(this.email, this.password);
            this.password = '';
            this.status = kind === 'in' ? 'Signed in' : 'Sign-up requested. Check email confirmation if enabled.';
        }
        catch (e) {
            this.status = e instanceof Error ? e.message : 'Authentication failed';
        }
    }
    async signOut() {
        try {
            await this.sb.signOut();
            this.status = 'Signed out';
        }
        catch (e) {
            this.status = e instanceof Error ? e.message : 'Sign out failed';
        }
    }
}
