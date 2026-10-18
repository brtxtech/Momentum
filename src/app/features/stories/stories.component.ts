import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudioStore } from '../../core/store.service';
import { PageHeaderComponent } from '../../shared/page-header.component';
@Component({ standalone: true, imports: [CommonModule, PageHeaderComponent], template: `<ms-page-header title="Stories worth keeping" subtitle="Browse the moments people share with you." eyebrow="STORIES"/><div class="story-viewer"><div class="story-progress"><span *ngFor="let s of store.stories();index as i" [class.filled]="i<=index()"></span></div><div class="story-stage"><img [src]="store.image(store.stories()[index()].image)" [alt]="store.stories()[index()].author+' story'"><div class="story-meta"><strong>{{store.stories()[index()].author}}</strong><span>Demo story</span></div></div><div class="story-controls"><button class="btn btn-outline" (click)="move(-1)">← Previous</button><span>{{index()+1}} / {{store.stories().length}}</span><button class="btn btn-primary" (click)="move(1)">Next →</button></div></div>` })
export class StoriesComponent {
    index = signal(0);
    constructor(public store: StudioStore) { }
    move(delta: number) { this.index.update(i => (i + delta + this.store.stories().length) % this.store.stories().length); }
}
