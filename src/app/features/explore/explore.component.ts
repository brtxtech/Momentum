import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudioStore } from '../../core/store.service';

type ExploreTab = 'For you' | 'Recent' | 'Reels';

@Component({
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <section class="ms-explore" aria-label="Explore">
      <div class="ms-explore-toolbar">
        <div class="ms-search" aria-label="Search moments">
          <span aria-hidden="true">⌕</span>
          <input type="text" [ngModel]="store.search()" (ngModelChange)="store.search.set($event)" placeholder="Search people, posts, reels" />
        </div>
      </div>

      <div class="ms-explore-tabs" role="tablist" aria-label="Explore categories">
        <div class="ms-tab-indicator" [style.transform]="indicatorTransform" aria-hidden="true"></div>
        <button
          *ngFor="let tab of tabs"
          type="button"
          role="tab"
          [attr.aria-selected]="selectedTab === tab"
          [class.active]="selectedTab === tab"
          (click)="selectedTab = tab"
        >
          {{ tab }}
        </button>
      </div>

      <div class="ms-explore-grid" *ngIf="visiblePosts.length; else emptyExplore">
        <button *ngFor="let post of visiblePosts; trackBy: trackByPost" type="button" class="ms-explore-tile" [attr.aria-label]="post.caption" [class.is-reel]="selectedTab === 'Reels'">
          <img [src]="store.image(post.image)" [alt]="post.caption" loading="lazy" />
          <span class="ms-media-tag" *ngIf="selectedTab === 'Reels'">▶</span>
          <span class="ms-tile-stats"><span>♥ {{ post.likes }}</span><span>♧ {{ post.comments.length }}</span></span>
        </button>
      </div>

      <ng-template #emptyExplore>
        <div class="ms-empty-state ms-explore-empty">
          <h3>No matches yet</h3>
          <p>Try another keyword or switch tabs.</p>
        </div>
      </ng-template>
    </section>
  `
})
export class ExploreComponent {
    readonly tabs: ExploreTab[] = ['For you', 'Recent', 'Reels'];
    selectedTab: ExploreTab = 'For you';

    constructor(public store: StudioStore) { }

    get indicatorTransform(): string {
        const index = this.tabs.indexOf(this.selectedTab);
        return `translateX(${index * 100}%)`;
    }

    get visiblePosts() {
        const term = this.store.search().trim().toLowerCase();
        const posts = [...this.store.posts()].filter(post => {
            const haystack = [post.author, post.handle, post.caption, post.event].join(' ').toLowerCase();
            return !term || haystack.includes(term);
        });

        switch (this.selectedTab) {
            case 'Recent':
                return posts.sort((a, b) => this.recencyWeight(b.createdAt) - this.recencyWeight(a.createdAt));
            case 'Reels':
                return posts.slice(0, 12);
            default:
                return posts.sort((a, b) => b.likes - a.likes);
        }
    }

    readonly trackByPost = (_: number, post: { id: string }) => post.id;

    private recencyWeight(createdAt: string): number {
        const weights: Record<string, number> = {
            '2 hours ago': 120,
            'Yesterday': 90,
            '2 days ago': 60,
            '3 days ago': 40,
            '4 days ago': 26,
            'Last week': 10,
        };

        return weights[createdAt] ?? 0;
    }
}
