import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudioStore } from '../../core/store.service';
import { PageHeaderComponent } from '../../shared/page-header.component';
@Component({ standalone: true, imports: [CommonModule, PageHeaderComponent], template: `<ms-page-header title="People & creators" subtitle="Meet the storytellers behind the moments." eyebrow="COMMUNITY"/><div class="card-grid"><article class="panel creator" *ngFor="let p of store.posts()"><img [src]="store.image(p.avatar)" [alt]="p.author"><h3>{{p.author}}</h3><p class="muted">&#64;{{p.handle}}</p><button class="btn" [class.btn-primary]="following().includes(p.id)" [class.btn-outline]="!following().includes(p.id)" (click)="toggle(p.id)">{{following().includes(p.id)?'Following ✓':'Follow +'}}</button></article></div><p class="notice">Follow state is an in-memory UI preview and is not synchronized with other accounts.</p>` })
export class PeopleComponent {
    following = signal<string[]>([]);
    constructor(public store: StudioStore) { }
    toggle(id: string) { this.following.update(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]); }
}
