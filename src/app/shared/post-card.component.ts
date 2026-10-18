import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Post } from '../core/models';
import { StudioStore } from '../core/store.service';
@Component({ selector: 'ms-post-card', standalone: true, imports: [CommonModule, FormsModule], template: `<article class="post-card"><div class="post-top"><img [src]="store.image(post.avatar)" alt="" class="avatar"><div class="post-author"><strong>{{post.author}}</strong><span class="muted">&#64;{{post.handle}} · {{post.createdAt}}</span></div><span class="pill">{{post.event}}</span></div><img class="post-photo" [src]="store.image(post.image)" [alt]="post.caption"><div class="post-actions"><button [attr.aria-label]="post.liked?'Unlike':'Like'" [attr.aria-pressed]="post.liked" (click)="store.toggleLike(post.id)">{{post.liked?'♥':'♡'}} {{post.likes | number}}</button><button (click)="commentsOpen.set(!commentsOpen())" [attr.aria-expanded]="commentsOpen()">♧ {{post.comments.length}} comments</button><button [attr.aria-pressed]="post.saved" (click)="store.toggleSave(post.id)">{{post.saved?'◆':'◇'}} Save</button></div><p class="caption"><strong>{{post.author}}</strong> {{post.caption}}</p><section *ngIf="commentsOpen()" class="comments"><p *ngFor="let comment of post.comments"><strong>{{comment.author}}</strong> {{comment.body}}</p><form (ngSubmit)="addComment()" class="inline-form"><input aria-label="Write a comment" name="comment" [(ngModel)]="draft" maxlength="500" placeholder="Write a thoughtful comment"><button class="btn btn-primary" type="submit">Post</button></form></section></article>` })
export class PostCardComponent {
    @Input({ required: true })
    post!: Post;
    commentsOpen = signal(false);
    draft = '';
    constructor(public store: StudioStore) { }
    addComment() { this.store.addComment(this.post.id, this.draft); this.draft = ''; }
}
