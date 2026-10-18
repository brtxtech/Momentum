import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudioStore } from '../../core/store.service';
import { GalleryPremiumComponent } from '../../ui/extra/gallery-view.component';
import { UiEvent, UiMedia } from '../../ui/extra/view-models';
import { EventItem, Post } from '../../core/models';
@Component({ standalone: true, imports: [CommonModule, FormsModule, GalleryPremiumComponent], template: `<ms-gallery-premium [media]="media" [events]="events" [activeEventId]="''" [canUpload]="true" [loading]="false" [busy]="false" [error]="''" (eventChange)="filterByEvent($event)" (galleryOpen)="open($event)" (galleryDownload)="download($event)" (galleryDelete)="deleteMedia($event)" (uploadRequested)="upload($event)"></ms-gallery-premium>` })
export class GalleryComponent {
    constructor(public store: StudioStore) { }
    get events(): UiEvent[] {
        return this.store.events().map((event: EventItem) => ({
            id: event.id,
            title: event.title,
            description: event.description,
            coverUrl: this.store.image(event.cover),
            startsAt: event.date || new Date().toISOString(),
            location: event.location,
            privacy: event.privacy,
            guests: 18,
            status: 'upcoming'
        }));
    }
    get media(): UiMedia[] {
        return this.store.posts().map((post: Post) => ({
            id: post.id,
            eventId: post.event,
            url: this.store.image(post.image),
            thumbUrl: this.store.image(post.image),
            type: 'image',
            caption: post.caption,
            createdAt: post.createdAt
        }));
    }
    filterByEvent(_eventId: string) { }
    open(id: string) { this.store.announce(`Opening media ${id}`); }
    download(id: string) { this.store.announce(`Downloading media ${id}`); }
    deleteMedia(id: string) { this.store.announce(`Deleting media ${id}`); }
    upload(files: File[]) {
        this.store.announce(`Uploading ${files.length} media item(s)`);
    }
}
