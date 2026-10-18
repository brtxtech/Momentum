import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudioStore } from '../../core/store.service';
import { EventsPremiumComponent } from '../../ui/extra/events-view.component';
import { UiEvent } from '../../ui/extra/view-models';
import { EventItem } from '../../core/models';
@Component({ standalone: true, imports: [CommonModule, EventsPremiumComponent], template: `<ms-events-premium [events]="events" [loading]="false" [busy]="false" [error]="''" (eventOpen)="open($event)" (eventCreate)="create($event)" (eventRsvp)="rsvp($event)" (eventInvite)="invite($event)" (eventShare)="share($event)"></ms-events-premium>` })
export class EventsComponent {
    constructor(public store: StudioStore) { }
    get events(): UiEvent[] {
        return this.store.events().map((event: EventItem) => ({ id: event.id, title: event.title, description: event.description, coverUrl: this.store.image(event.cover), startsAt: event.date || new Date().toISOString(), location: event.location, privacy: event.privacy, guests: 18, going: true, status: 'upcoming' }));
    }
    open(eventId: string) { this.store.announce(`Opening event ${eventId}`); }
    create(payload: { title: string; date: string; location: string; privacy: 'private' | 'public'; description: string }) {
        const event = { id: crypto.randomUUID(), title: payload.title, date: payload.date, location: payload.location || 'To be announced', description: payload.description || 'A beautiful celebration planned with love.', cover: 9, privacy: payload.privacy };
        this.store.addEvent(event); this.store.announce('Event created');
    }
    rsvp(eventId: string) { this.store.announce(`RSVP confirmed for ${eventId}`); }
    invite(eventId: string) { this.store.announce(`Invitations sent for ${eventId}`); }
    share(eventId: string) { this.store.announce(`Sharing event ${eventId}`); }
}
