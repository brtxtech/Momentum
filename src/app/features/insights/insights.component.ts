import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudioStore } from '../../core/store.service';
import { PageHeaderComponent } from '../../shared/page-header.component';
@Component({ standalone: true, imports: [CommonModule, PageHeaderComponent], template: `<ms-page-header title="Creator insights" subtitle="An overview of the activity in your local demo dataset." eyebrow="ANALYTICS"/><div class="metrics"><div class="metric panel"><small>Demo posts</small><strong>{{store.posts().length}}</strong></div><div class="metric panel"><small>Total likes (demo)</small><strong>{{likes() | number}}</strong></div><div class="metric panel"><small>Saved posts</small><strong>{{store.saved().length}}</strong></div><div class="metric panel"><small>Events</small><strong>{{store.events().length}}</strong></div></div><div class="panel"><h3>Engagement by post</h3><div *ngFor="let post of store.posts()" class="bar-row"><span>{{post.author}}</span><div class="bar-track"><div class="bar-fill" [style.width.%]="post.likes/max()*100"></div></div><strong>{{post.likes}}</strong></div></div><p class="notice">These are calculations over local demonstration data, not real audience analytics.</p>` })
export class InsightsComponent {
    constructor(public store: StudioStore) { }
    likes() { return this.store.posts().reduce((a, p) => a + p.likes, 0); }
    max() { return Math.max(1, ...this.store.posts().map(p => p.likes)); }
}
