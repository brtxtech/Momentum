import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudioStore } from '../core/store.service';
@Component({ selector: 'ms-media-grid', standalone: true, imports: [CommonModule], template: `<div class="media-grid"><a *ngFor="let n of items" [href]="store.image(n)" target="_blank" rel="noopener noreferrer" [attr.aria-label]="'Open artwork '+n"><img [src]="store.image(n)" [alt]="'Editorial artwork '+n" loading="lazy"></a></div>` })
export class MediaGridComponent {
    @Input()
    items: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    constructor(public store: StudioStore) { }
}
