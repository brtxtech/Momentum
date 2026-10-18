import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudioStore } from '../../core/store.service';
import { PageHeaderComponent } from '../../shared/page-header.component';
@Component({ standalone: true, imports: [CommonModule, PageHeaderComponent], template: `<ms-page-header title="Activity" subtitle="Your latest interactions and updates." eyebrow="NOTIFICATIONS"><button class="btn btn-outline" (click)="store.markAllRead()">Mark all read</button></ms-page-header><div class="panel"><div *ngFor="let item of store.notifications()" class="activity-row" [class.unread]="!item.read"><span class="activity-icon">♡</span><div><strong>{{item.message}}</strong><p class="muted">{{item.createdAt}}</p></div></div></div>` })
export class NotificationsComponent {
    constructor(public store: StudioStore) { }
}
