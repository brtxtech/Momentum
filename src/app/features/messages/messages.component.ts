import { Component, computed, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudioStore } from '../../core/store.service';
import { SocialApi } from '../../core/social-api.service';
import { MessagesPremiumComponent } from '../../ui/extra/messages-view.component';
import { UiConversation, UiMessage, UiPerson } from '../../ui/extra/view-models';
import { RealtimeChannel } from '@supabase/supabase-js';

@Component({
    standalone: true,
    imports: [CommonModule, FormsModule, MessagesPremiumComponent],
    template: `
    <ms-messages-premium
      [conversations]="conversations()"
      [messages]="messages()"
      [recipients]="recipients()"
      [activeId]="activeId()"
      [currentUserId]="'demo-user'"
      [loading]="false"
      [busy]="false"
      [error]="''"
      (conversationOpen)="selectConversation($event)"
      (recipientSearch)="searchRecipients($event)"
      (conversationCreate)="createConversation($event)"
      (messageSend)="sendMessage($event)"
      (messageDelete)="deleteMessage($event)"
      (olderMessages)="loadEarlier($event)"
    ></ms-messages-premium>
  `
})
export class MessagesComponent {
    readonly activeId = signal<string | null>('d1');
    readonly search = signal('');
    readonly recipients = computed<UiPerson[]>(() =>
        this.store.chats().map((chat) => ({
            id: chat.id,
            username: chat.name,
            displayName: chat.name,
            avatarUrl: this.store.image(chat.avatar),
            bio: 'Studio contact',
            followers: 1200
        }))
    );
    readonly conversations = computed<UiConversation[]>(() =>
        this.store.chats().map((chat) => ({
            id: chat.id,
            title: chat.name,
            avatarUrl: this.store.image(chat.avatar),
            subtitle: 'Conversation',
            latest: chat.messages[chat.messages.length - 1]?.body ?? 'Start your conversation',
            updatedAt: chat.messages[chat.messages.length - 1]?.createdAt ?? 'Now',
            unread: 0,
            online: true
        }))
    );
    readonly messages = computed<UiMessage[]>(() => {
        const chat = this.store.chats().find((item: { id: string }) => item.id === this.activeId());
        if (!chat) return [];
        return (chat.messages ?? []).map((message: { id: string; mine: boolean; body: string; createdAt: string }) => ({
            id: message.id,
            conversationId: chat.id,
            senderId: message.mine ? 'demo-user' : chat.id,
            text: message.body,
            sentAt: message.createdAt,
            read: true
        }));
    });

    private channel: RealtimeChannel | null = null;

    constructor(public store: StudioStore, private api: SocialApi) {
        effect(() => {
            const chatId = this.activeId();
            if (!chatId) return;
            this.stopRealtime();
            if (this.api.ready) {
                this.channel = this.api.watchMessages(chatId, () => {
                    void this.refreshFromSupabase(chatId);
                });
            }
        });
    }

    selectConversation(id: string) { this.activeId.set(id); }
    searchRecipients(value: string) { this.search.set(value); }
    createConversation(id: string) { this.activeId.set(id); this.store.announce(`Opened ${id}`); }
    sendMessage(payload: { conversationId: string; body: string }) {
        if (!payload.body.trim()) return;
        this.store.sendMessage(payload.conversationId, payload.body);
    }
    deleteMessage(id: string) {
        this.store.chats.update((items: Array<{ id: string; name: string; avatar: number; messages: Array<{ id: string; mine: boolean; body: string; createdAt: string }> }>) =>
            items.map((chat: { id: string; name: string; avatar: number; messages: Array<{ id: string; mine: boolean; body: string; createdAt: string }> }) => ({
                ...chat,
                messages: chat.messages.filter((message: { id: string; mine: boolean; body: string; createdAt: string }) => message.id !== id)
            }))
        );
    }
    loadEarlier(_id: string) { this.store.announce('Earlier messages requested'); }
    private stopRealtime() { if (this.channel) { this.api.stop(this.channel); this.channel = null; } }
    private async refreshFromSupabase(chatId: string) {
        if (!this.api.ready) return;
        try {
            const rows = await this.api.messages(chatId);
            this.store.replaceChatMessages(chatId, rows.map((message: any) => ({
                id: message.id,
                body: message.body,
                createdAt: message.created_at,
                mine: message.sender_id === 'demo-user'
            })));
        } catch {
            // keep local demo conversations responsive
        }
    }
}
