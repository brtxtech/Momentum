import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudioStore } from '../../core/store.service';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { PostCardComponent } from '../../shared/post-card.component';
import { EmptyStateComponent } from '../../shared/empty-state.component';

@Component({
    standalone: true,
    imports: [CommonModule, PageHeaderComponent, PostCardComponent, EmptyStateComponent],
    template: `
    <div class="account-page">
      <ms-page-header title="Your saved moments" subtitle="Keep your favorite stories close." eyebrow="COLLECTION" />

      <div *ngIf="store.saved().length; else empty" class="account-saved-grid">
        <article *ngFor="let post of store.saved()" class="account-saved-card">
          <div class="account-saved-image">
            <img [src]="store.image(post.image)" [alt]="post.caption" />
          </div>
          <div class="account-saved-body">
            <strong>{{ post.author }}</strong>
            <p>{{ post.caption }}</p>
            <button type="button" class="btn btn-outline" (click)="store.toggleSave(post.id)">Remove</button>
          </div>
        </article>
      </div>

      <ng-template #empty>
        <div class="panel">
          <h3>No saved posts yet</h3>
          <p class="muted">Save a moment from your feed to find it here.</p>
        </div>
      </ng-template>
    </div>
  `
})
export class SavedComponent {
    constructor(public store: StudioStore) { }
}
