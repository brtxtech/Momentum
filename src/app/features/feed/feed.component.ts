import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StudioStore } from '../../core/store.service';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { PostCardComponent } from '../../shared/post-card.component';
@Component({ standalone: true, imports: [CommonModule, RouterLink, PageHeaderComponent, PostCardComponent], template: `<ms-page-header title="Your world, beautifully connected" subtitle="The people and celebrations that make life memorable." eyebrow="YOUR FEED"><a routerLink="/create" class="btn btn-primary">＋ Share a moment</a></ms-page-header><div class="feed-layout"><section><div class="stories-strip"><a *ngFor="let story of store.stories()" routerLink="/stories" class="story-bubble"><img [src]="store.image(story.image)" [alt]="story.author+' story'"><span>{{story.author}}</span></a></div><div class="feed-posts"><ms-post-card *ngFor="let post of store.filtered()" [post]="post"/></div><p *ngIf="!store.filtered().length" class="muted">No moments match your search.</p></section><aside class="right-rail"><div class="panel"><p class="eyebrow">CURATED FOR YOU</p><h3>Celebrate beautifully</h3><p class="muted">Your moments deserve a space as meaningful as the memories themselves.</p><a routerLink="/invitations" class="btn btn-outline">Open invitation studio →</a></div><div class="panel"><p class="eyebrow">UPCOMING</p><div *ngFor="let event of store.events()" class="mini-event"><img [src]="store.image(event.cover)" alt=""><div><strong>{{event.title}}</strong><small>{{event.date}}</small></div></div><a routerLink="/events">View all events →</a></div></aside></div>` })
export class FeedComponent {
    constructor(public store: StudioStore) { }
}
