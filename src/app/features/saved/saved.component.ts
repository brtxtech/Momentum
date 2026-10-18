import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudioStore } from '../../core/store.service';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { PostCardComponent } from '../../shared/post-card.component';
import { EmptyStateComponent } from '../../shared/empty-state.component';
@Component({ standalone: true, imports: [CommonModule, PageHeaderComponent, PostCardComponent, EmptyStateComponent], template: `<ms-page-header title="Your saved moments" subtitle="Keep your favorite stories close." eyebrow="COLLECTION"/><div class="narrow-feed"><ms-post-card *ngFor="let post of store.saved()" [post]="post"/><ms-empty-state *ngIf="!store.saved().length" title="No saved posts yet" description="Save a moment from your feed to find it here."/></div>` })
export class SavedComponent {
    constructor(public store: StudioStore) { }
}
