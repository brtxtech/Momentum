import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StudioStore } from '../../core/store.service';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { MediaGridComponent } from '../../shared/media-grid.component';
@Component({ standalone: true, imports: [CommonModule, RouterLink, PageHeaderComponent, MediaGridComponent], template: `<ms-page-header title="Your profile" subtitle="Your creative home on Moments Studio." eyebrow="IDENTITY"><a routerLink="/settings" class="btn btn-outline">Edit preferences</a></ms-page-header><div class="profile-hero panel"><img [src]="store.image(7)" alt="Demo profile avatar"><div><h2>Your Studio</h2><p class="muted">&#64;yourstudio · Creative storyteller</p><p>Collecting life's most beautiful moments.</p><div class="profile-stats"><span><strong>{{store.posts().length}}</strong> posts in demo</span><span><strong>{{store.saved().length}}</strong> saved</span><span><strong>{{store.events().length}}</strong> events</span></div></div></div><h2>Selected moments</h2><ms-media-grid [items]="[7,8,9,10,11,12]"/>` })
export class ProfileComponent {
    constructor(public store: StudioStore) { }
}
