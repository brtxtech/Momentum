import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudioStore } from '../../core/store.service';
import { PageHeaderComponent } from '../../shared/page-header.component';
@Component({ standalone: true, imports: [CommonModule, FormsModule, PageHeaderComponent], template: `<ms-page-header title="Conversations" subtitle="Stay close to the people who matter. Messages are local demo data." eyebrow="INBOX"/><div class="messages-layout"><div class="panel chat-list"><button *ngFor="let chat of store.chats()" class="chat-person" [class.selected]="active()===chat.id" (click)="active.set(chat.id)"><img [src]="store.image(chat.avatar)" alt=""><span><strong>{{chat.name}}</strong><small>{{chat.messages[chat.messages.length-1]?.body}}</small></span></button></div><section class="panel conversation"><h3>{{current()?.name}}</h3><div class="message-scroll"><p *ngFor="let message of current()?.messages" class="message-bubble" [class.mine]="message.mine">{{message.body}}</p></div><form (ngSubmit)="send()" class="inline-form"><input name="draft" [(ngModel)]="draft" maxlength="1000" aria-label="Write a message" placeholder="Write a message"><button class="btn btn-primary">Send</button></form><p class="muted tiny">Not delivered to other users. This demo persists only in your browser.</p></section></div>` })
export class MessagesComponent {
    active = signal('d1');
    draft = '';
    constructor(public store: StudioStore) { }
    current() { return this.store.chats().find(c => c.id === this.active()); }
    send() { this.store.sendMessage(this.active(), this.draft); this.draft = ''; }
}
