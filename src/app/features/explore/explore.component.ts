import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudioStore } from '../../core/store.service';
import { PageHeaderComponent } from '../../shared/page-header.component';

type ExploreTab = 'Reels' | 'People' | 'Posts' | 'Events';

@Component({
    standalone: true,
    imports: [CommonModule, FormsModule, PageHeaderComponent],
    template: `
    <ms-page-header
      title="Explore the extraordinary"
      subtitle="Discover inspiring celebrations, details and beautiful stories."
      eyebrow="DISCOVER"
    />

    <section class="explore-shell">
      <div class="top-bar">
        <label class="search-box" aria-label="Search the collection">
          <span class="search-icon">⌕</span>
          <input
            type="text"
            [ngModel]="store.search()"
            (ngModelChange)="store.search.set($event)"
            placeholder="Search creators and moments"
          />
        </label>
        <button type="button" class="ghost-button">Filter</button>
      </div>

      <div class="tab-row" role="tablist" aria-label="Explore categories">
        <button
          *ngFor="let tab of tabs"
          type="button"
          role="tab"
          [attr.aria-selected]="tab === selectedTab"
          [class.active]="tab === selectedTab"
          (click)="selectedTab = tab"
        >
          {{ tab }}
        </button>
      </div>

      <div *ngIf="selectedTab === 'Reels'; else collectionView" class="reels-grid">
        <article class="reel-card" *ngFor="let post of visiblePosts; let i = index">
          <div class="reel-media" [style.background-image]="'url(' + store.image(post.image) + ')'">
            <div class="reel-overlay">
              <div class="overlay-top">
                <span class="live-pill">{{ i % 2 === 0 ? 'Popular' : 'Fresh' }}</span>
                <span class="meta-chip">{{ post.likes }} likes</span>
              </div>

              <div class="overlay-bottom">
                <div>
                  <strong>{{ post.author }}</strong>
                  <small>{{ '@' + post.handle }}</small>
                </div>
                <button type="button" class="like-button" aria-label="Like this reel">♡</button>
              </div>
            </div>
          </div>

          <div class="reel-copy">
            <span class="topic-tag">{{ post.event }}</span>
            <p>{{ post.caption }}</p>
          </div>
        </article>
      </div>

      <ng-template #collectionView>
        <div class="collection-grid">
          <article class="collection-card" *ngFor="let post of visiblePosts">
            <img [src]="store.image(post.image)" [alt]="post.caption" loading="lazy" />
            <div class="card-body">
              <div class="card-label">{{ selectedTab }}</div>
              <h3>{{ getCardTitle(post) }}</h3>
              <p *ngIf="selectedTab === 'People'">{{ '@' + post.handle }}</p>
              <p *ngIf="selectedTab === 'Posts'">{{ post.author }} · {{ post.likes }} likes</p>
              <p *ngIf="selectedTab === 'Events'">{{ post.createdAt }} · {{ post.event }}</p>
            </div>
          </article>
        </div>
      </ng-template>
    </section>
  `,
    styles: [`
      :host {
        display: block;
        color: #f5f3f2;
      }

      .explore-shell {
        max-width: 1180px;
        margin: 0 auto;
        padding: 1.25rem 1rem 2.5rem;
      }

      .top-bar {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin: 0 0 1rem;
      }

      .search-box {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 0.6rem;
        min-height: 46px;
        padding: 0 0.9rem;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.025);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
      }

      .search-icon {
        font-size: 1.05rem;
        opacity: 0.7;
      }

      .search-box input {
        flex: 1;
        border: 0;
        outline: none;
        background: transparent;
        color: #f5f3f2;
        font-size: 0.96rem;
      }

      .search-box input::placeholder {
        color: rgba(245, 243, 242, 0.5);
      }

      .ghost-button {
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.03);
        color: #f5f3f2;
        border-radius: 999px;
        padding: 0.7rem 1rem;
        font-weight: 600;
        cursor: pointer;
      }

      .tab-row {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin-bottom: 1.25rem;
      }

      .tab-row button {
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 999px;
        background: transparent;
        color: rgba(245, 243, 242, 0.72);
        padding: 0.55rem 0.9rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 160ms ease;
      }

      .tab-row button.active {
        background: rgba(255, 255, 255, 0.09);
        color: #ffffff;
        border-color: rgba(255, 255, 255, 0.16);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.14);
      }

      .reels-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 1.1rem;
      }

      .reel-card {
        border-radius: 1.1rem;
        overflow: hidden;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.07);
        box-shadow: 0 18px 40px rgba(9, 10, 18, 0.18);
      }

      .reel-media {
        position: relative;
        height: 440px;
        background-size: cover;
        background-position: center;
      }

      .reel-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 0.9rem;
        background: linear-gradient(180deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.55) 100%);
      }

      .overlay-top,
      .overlay-bottom {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
      }

      .live-pill,
      .meta-chip,
      .topic-tag {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        font-size: 0.7rem;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }

      .live-pill {
        padding: 0.35rem 0.65rem;
        background: rgba(255, 255, 255, 0.14);
        color: #fff;
      }

      .meta-chip {
        padding: 0.3rem 0.5rem;
        background: rgba(0, 0, 0, 0.18);
        color: rgba(255, 255, 255, 0.82);
      }

      .overlay-bottom {
        align-items: end;
      }

      .overlay-bottom strong,
      .overlay-bottom small {
        display: block;
      }

      .overlay-bottom small {
        color: rgba(255, 255, 255, 0.78);
        margin-top: 0.1rem;
      }

      .like-button {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 50%;
        border: 0;
        background: rgba(255, 255, 255, 0.14);
        color: #fff;
        font-size: 1.15rem;
        cursor: pointer;
      }

      .reel-copy {
        padding: 0.9rem 0.9rem 1rem;
      }

      .topic-tag {
        padding: 0.34rem 0.6rem;
        background: rgba(255, 255, 255, 0.06);
        color: rgba(255, 255, 255, 0.8);
        margin-bottom: 0.6rem;
      }

      .reel-copy p {
        margin: 0;
        line-height: 1.5;
        color: rgba(245, 243, 242, 0.8);
      }

      .collection-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1rem;
      }

      .collection-card {
        overflow: hidden;
        border-radius: 1rem;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.02);
      }

      .collection-card img {
        width: 100%;
        height: 230px;
        display: block;
        object-fit: cover;
      }

      .card-body {
        padding: 0.85rem 0.9rem 1rem;
      }

      .card-label {
        display: inline-block;
        margin-bottom: 0.5rem;
        font-size: 0.7rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: rgba(245, 243, 242, 0.7);
      }

      .card-body h3 {
        margin: 0 0 0.35rem;
        font-size: 1.05rem;
      }

      .card-body p {
        margin: 0;
        color: rgba(245, 243, 242, 0.68);
      }

      @media (max-width: 640px) {
        .top-bar {
          flex-direction: column;
          align-items: stretch;
        }

        .ghost-button {
          width: 100%;
        }
      }
    `],
})
export class ExploreComponent {
    readonly tabs: ExploreTab[] = ['Reels', 'People', 'Posts', 'Events'];
    selectedTab: ExploreTab = 'Reels';

    constructor(public store: StudioStore) { }

    get visiblePosts() {
        return this.store.filtered().slice(0, 8);
    }

    getCardTitle(post: { author: string; event: string; caption: string }) {
        if (this.selectedTab === 'People') {
            return post.author;
        }
        if (this.selectedTab === 'Events') {
            return post.event;
        }
        return post.caption;
    }
}
