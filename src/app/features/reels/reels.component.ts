import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudioStore } from '../../core/store.service';
import { PageHeaderComponent } from '../../shared/page-header.component';
@Component({ standalone: true, imports: [CommonModule, PageHeaderComponent], template: `<ms-page-header title="Reels & highlights" subtitle="An editorial preview of short-form moments. Video publishing is not yet connected." eyebrow="MOTION"/><div class="reels-grid"><article *ngFor="let post of store.posts();index as i" class="reel-card"><img [src]="store.image(post.image)" [alt]="post.caption"><div class="reel-overlay"><span class="reel-play">▷</span><strong>{{post.author}}</strong><p>{{post.caption}}</p><button (click)="store.toggleLike(post.id)">{{post.liked?'♥':'♡'}} {{post.likes}}</button></div></article></div><p class="notice">Preview only: these are still images, not playable video reels. Real transcoding, streaming and moderation require backend services.</p>` })
export class ReelsComponent {
    constructor(public store: StudioStore) { }
}
