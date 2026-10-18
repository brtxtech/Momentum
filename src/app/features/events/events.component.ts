import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudioStore } from '../../core/store.service';
import { PageHeaderComponent } from '../../shared/page-header.component';
@Component({ standalone: true, imports: [CommonModule, FormsModule, PageHeaderComponent], template: `<ms-page-header title="Your celebrations" subtitle="Every unforgettable occasion starts here." eyebrow="EVENTS"><button class="btn btn-primary" (click)="show.set(!show())">＋ New event</button></ms-page-header><form *ngIf="show()" (ngSubmit)="create()" class="panel form-stack"><h3>Create an event</h3><label>Event title<input name="title" [(ngModel)]="title" required maxlength="100"></label><label>Date<input name="date" [(ngModel)]="date" type="date" required></label><label>Location<input name="place" [(ngModel)]="place" maxlength="120"></label><label>Description<textarea name="description" [(ngModel)]="description" maxlength="500"></textarea></label><button class="btn btn-primary" type="submit">Save event locally</button></form><div class="card-grid"><article *ngFor="let event of store.events()" class="event-card"><img [src]="store.image(event.cover)" [alt]="event.title"><div><span class="pill">{{event.privacy}}</span><h3>{{event.title}}</h3><p>{{event.description}}</p><p class="muted">{{event.date}} · {{event.location}}</p></div></article></div>` })
export class EventsComponent {
    show = signal(false);
    title = '';
    date = '';
    place = '';
    description = '';
    constructor(public store: StudioStore) { }
    create() { if (!this.title.trim() || !this.date)
        return; this.store.addEvent({ id: crypto.randomUUID(), title: this.title.trim().slice(0, 100), date: this.date, location: this.place.slice(0, 120), description: this.description.slice(0, 500), cover: 9, privacy: 'private' }); this.show.set(false); this.title = ''; this.date = ''; this.place = ''; this.description = ''; }
}
