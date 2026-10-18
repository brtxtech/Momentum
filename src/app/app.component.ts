import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudioStore } from './core/store.service';
@Component({ selector: 'app-root', standalone: true, imports: [RouterLink, RouterLinkActive, RouterOutlet, CommonModule, FormsModule], templateUrl: './app.component.html' })
export class AppComponent {
    navOpen = signal(false);
    sections = [{ title: 'DISCOVER', items: [['/feed', '⌂', 'Home'], ['/explore', '⌕', 'Explore'], ['/reels', '▷', 'Reels'], ['/stories', '◉', 'Stories']] }, { title: 'CONNECT', items: [['/messages', '✉', 'Messages'], ['/notifications', '♡', 'Activity'], ['/people', '♧', 'People']] }, { title: 'CELEBRATE', items: [['/events', '▤', 'Events'], ['/gallery', '▦', 'Gallery'], ['/invitations', '✧', 'Invitations'], ['/qr', '▣', 'QR Studio']] }, { title: 'ACCOUNT', items: [['/profile', '♙', 'Profile'], ['/saved', '◇', 'Saved'], ['/insights', '▥', 'Insights'], ['/settings', '⚙', 'Settings'], ['/help', '?', 'Help & safety']] }];
    constructor(public store: StudioStore) { }
    close() { this.navOpen.set(false); }
}
