import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudioStore } from '../../core/store.service';
import { SupabaseService } from '../../core/supabase.service';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { MediaGridComponent } from '../../shared/media-grid.component';
@Component({ standalone: true, imports: [CommonModule, FormsModule, PageHeaderComponent, MediaGridComponent], template: `<ms-page-header title="The memory gallery" subtitle="Browse the editorial collection or access private event media with Supabase." eyebrow="GALLERY"/><div class="panel"><h3>Editorial collection</h3><p class="muted">Bundled demo artwork. Open an image to inspect it in a new tab.</p><ms-media-grid [items]="[1,2,3,4,5,6,7,8,9,10,11,12]"/></div><div class="panel form-stack"><h3>Private event gallery</h3><p class="muted">Requires Supabase authentication, event membership and deployed RLS/storage policies.</p><label>Event ID<input [(ngModel)]="eventId" placeholder="UUID of your event"></label><button class="btn btn-primary" (click)="load()" [disabled]="busy()">{{busy()?'Loading...':'Load authorized photos'}}</button><p role="alert" *ngIf="error()">{{error()}}</p><div class="media-grid"><a *ngFor="let photo of photos()" [href]="photo.url" target="_blank" rel="noopener noreferrer"><img [src]="photo.url" [alt]="photo.caption||'Private event photo'"></a></div><label>Upload a photo<input type="file" accept="image/jpeg,image/png,image/webp" (change)="upload($event)"></label></div>` })
export class GalleryComponent {
    eventId = '';
    busy = signal(false);
    error = signal('');
    photos = signal<{
        id: string;
        caption: string;
        url: string;
    }[]>([]);
    constructor(public store: StudioStore, private sb: SupabaseService) { }
    async load() { this.busy.set(true); this.error.set(''); try {
        this.photos.set(await this.sb.eventMedia(this.eventId));
    }
    catch (e) {
        this.error.set(e instanceof Error ? e.message : 'Unable to load photos');
    }
    finally {
        this.busy.set(false);
    } }
    async upload(e: Event) { const f = (e.target as HTMLInputElement).files?.[0]; if (!f)
        return; this.busy.set(true); try {
        await this.sb.uploadEventPhoto(this.eventId, f, '');
        await this.load();
    }
    catch (err) {
        this.error.set(err instanceof Error ? err.message : 'Upload failed');
    }
    finally {
        this.busy.set(false);
    } }
}
