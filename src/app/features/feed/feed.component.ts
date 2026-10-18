import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StudioStore } from '../../core/store.service';

@Component({
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
    <div class="ms-feed-layout">
      <main class="ms-feed-column">
        <nav class="ms-feed-tabs" aria-label="Feed selection">
          <button class="active" type="button">For you</button>
          <button type="button">Following</button>
        </nav>

        <section class="ms-stories-strip" aria-label="Stories">
          <button *ngFor="let story of store.stories(); let i = index" type="button" class="ms-story" [class.viewed]="story.viewed" [attr.aria-label]="story.author + ' story'" routerLink="/stories">
            <span class="ms-story-ring" [class.viewed]="story.viewed">
              <img [src]="store.image(story.image)" [alt]="story.author" />
            </span>
            <span class="ms-story-name">{{ story.author }}</span>
          </button>
        </section>

        <section class="ms-feed-posts">
          <article *ngFor="let post of store.filtered().slice(0, 6)" class="ms-post">
            <header class="ms-post-header">
              <img class="ms-avatar" [src]="store.image(post.avatar)" [alt]="post.author" />
              <div class="ms-post-byline">
                <strong>{{ post.author }} <span *ngIf="post.author === 'Ariana' || post.author === 'Noah'">✓</span></strong>
                <small>{{ post.createdAt }}</small>
              </div>
              <button type="button" aria-label="Post options">···</button>
            </header>

            <div class="ms-post-media">
              <img [src]="store.image(post.image)" [alt]="post.caption" loading="lazy" />
            </div>

            <div class="ms-post-actions">
              <button type="button" [attr.aria-label]="post.liked ? 'Unlike post' : 'Like post'" (click)="store.toggleLike(post.id)">{{ post.liked ? '♥' : '♡' }}</button>
              <button type="button" aria-label="Comment">♧</button>
              <button type="button" aria-label="Share">➤</button>
              <button type="button" class="ms-push" aria-label="Save post" (click)="store.toggleSave(post.id)">{{ post.saved ? '▣' : '▢' }}</button>
            </div>

            <strong class="ms-post-likes">{{ post.likes | number }} likes</strong>
            <p class="ms-caption"><b>{{ post.author }}</b> {{ post.caption }}</p>
            <button class="ms-comments-link" type="button">View all {{ post.comments.length }} comments</button>
          </article>
        </section>
      </main>

      <aside class="ms-suggestions" aria-label="Suggested accounts">
        <h3>Suggested for you</h3>
        <div *ngFor="let person of store.posts().slice(0, 4)" class="ms-suggestion">
          <img class="ms-avatar" [src]="store.image(person.avatar)" [alt]="person.author" />
          <div>
            <strong>{{ person.author }}</strong>
            <small>{{ '@' + person.handle }}</small>
          </div>
          <button type="button">Follow</button>
        </div>
      </aside>
    </div>
  `
})
export class FeedComponent {
    constructor(public store: StudioStore) { }
}
