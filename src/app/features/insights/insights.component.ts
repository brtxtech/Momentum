import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudioStore } from '../../core/store.service';
import { PageHeaderComponent } from '../../shared/page-header.component';
import type { Post } from '../../core/models';
@Component({ standalone: true, imports: [CommonModule, PageHeaderComponent], template: `<div class="account-page"><ms-page-header title="Creator insights" subtitle="An overview of the activity in your local demo dataset." eyebrow="ANALYTICS" /><div class="account-insights-grid"><div class="panel metric-card"><small>Demo posts</small><strong>{{ store.posts().length }}</strong></div><div class="panel metric-card"><small>Total likes</small><strong>{{ likes() | number }}</strong></div><div class="panel metric-card"><small>Saved posts</small><strong>{{ store.saved().length }}</strong></div><div class="panel metric-card"><small>Events</small><strong>{{ store.events().length }}</strong></div></div><div class="panel insight-chart"><h3>Engagement by post</h3><div *ngFor="let post of store.posts()" class="bar-row"><span>{{ post.author }}</span><div class="bar-track"><div class="bar-fill" [style.width.%]="(post.likes / max()) * 100"></div></div><strong>{{ post.likes }}</strong></div><p class="muted">These are calculations over local demonstration data, not real audience analytics.</p></div></div>` })
export class InsightsComponent {
    constructor(public store: StudioStore) { }
    likes(): number { return this.store.posts().reduce((total: number, post: Post) => total + post.likes, 0); }
    max(): number { return Math.max(1, ...this.store.posts().map((post: Post) => post.likes)); }
}
