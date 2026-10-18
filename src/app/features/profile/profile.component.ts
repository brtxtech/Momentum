import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StudioStore } from '../../core/store.service';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { MediaGridComponent } from '../../shared/media-grid.component';

@Component({
    standalone: true,
    imports: [CommonModule, RouterLink, PageHeaderComponent, MediaGridComponent],
    template: `
    <div class="account-page">
      <ms-page-header title="Your profile" subtitle="Your creative home on Moments Studio." eyebrow="IDENTITY">
        <div class="account-action-group">
          <a routerLink="/settings" class="btn btn-outline">Edit preferences</a>
        </div>
      </ms-page-header>

      <section class="panel account-profile">
        <div class="account-avatar-wrap">
          <img [src]="store.image(7)" alt="Demo profile avatar" />
        </div>

        <div class="account-profile-copy">
          <h2>Your Studio</h2>
          <p>&#64;yourstudio · Creative storyteller</p>
          <p>Collecting life's most beautiful moments.</p>

          <div class="account-meta">
            <span><strong>{{ store.posts().length }}</strong> posts</span>
            <span><strong>{{ store.saved().length }}</strong> saved</span>
            <span><strong>{{ store.events().length }}</strong> events</span>
          </div>
        </div>
      </section>

      <nav class="account-tabs" aria-label="Profile sections">
        <button type="button" class="active">Posts</button>
        <button type="button">Reels</button>
        <button type="button">Gallery</button>
      </nav>

      <div class="account-grid">
        <a *ngFor="let n of [7,8,9,10,11,12]" class="account-tile" [href]="store.image(n)" target="_blank" rel="noopener noreferrer" [attr.aria-label]="'Open artwork ' + n">
          <img [src]="store.image(n)" [alt]="'Editorial artwork ' + n" loading="lazy" />
        </a>
      </div>
    </div>
  `
})
export class ProfileComponent {
    constructor(public store: StudioStore) { }
}
