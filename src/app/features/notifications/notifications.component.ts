import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudioStore } from '../../core/store.service';
import { ActivityPremiumComponent } from '../../ui/extra/notifications-view.component';
import { UiNotification } from '../../ui/extra/view-models';
import { NotificationItem } from '../../core/models';
@Component({ standalone: true, imports: [CommonModule, ActivityPremiumComponent], template: `<ms-activity-premium [notices]="notices" [busy]="false" [loading]="false" [error]="''" (notificationOpen)="open($event)" (markRead)="markRead($event)" (markAllRead)="markAllRead()" (filterChanged)="setFilter($event)"></ms-activity-premium>` })
export class NotificationsComponent {
    filter = 'all';
    constructor(public store: StudioStore) { }
    get notices(): UiNotification[] {
        return this.store.notifications().map((notification: NotificationItem) => ({
            id: notification.id,
            kind: 'like',
            title: notification.message,
            description: notification.message,
            timestamp: notification.createdAt,
            read: notification.read,
            actionable: true
        }));
    }
    open(notification: UiNotification) { this.store.announce(`Opened notification ${notification.id}`); }
    markRead(id: string) {
        this.store.notifications.update((items: NotificationItem[]) =>
            items.map((item: NotificationItem) => item.id === id ? { ...item, read: true } : item)
        );
    }
    markAllRead() { this.store.markAllRead(); }
    setFilter(filter: string) { this.filter = filter; }
}
