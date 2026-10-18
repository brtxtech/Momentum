/**
 * Integration example for Moments-Studio-Reels-Implemented.
 * Save as src/app/features/messages/messages-premium-page.component.ts
 * It uses the existing SocialApi. It does not invent messages or user identities.
 * Conversation titles need an additional authorized membership/profile join in SocialApi.
 */
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { MessagesPremiumComponent } from '../../ui/extra/messages-view.component';
import { UiConversation, UiMessage, UiPerson } from '../../ui/extra/view-models';
import { SocialApi } from '../../core/social-api.service';

@Component({
  standalone: true,
  imports: [MessagesPremiumComponent],
  template: `<ms-messages-premium
    [currentUserId]="userId" [conversations]="conversations" [messages]="messages"
    [recipients]="recipients" [activeId]="activeId" [busy]="busy" [error]="error"
    (recipientSearch)="searchPeople($event)"
    (conversationCreate)="createConversation($event)"
    (conversationOpen)="openConversation($event)"
    (messageSend)="sendMessage($event)"
    (messageDelete)="deleteMessage($event)" />`
})
export class MessagesPremiumPageComponent implements OnInit, OnDestroy {
  @ViewChild(MessagesPremiumComponent) view?: MessagesPremiumComponent;
  conversations: UiConversation[] = [];
  messages: UiMessage[] = [];
  recipients: UiPerson[] = [];
  activeId: string | null = null;
  userId = '';
  busy = false;
  error = '';
  private channel?: RealtimeChannel;
  constructor(private readonly api: SocialApi) {}
  async ngOnInit() {
    try {
      if (!this.api.ready) throw Error('Configure Supabase under Cloud setup');
      const user = await this.api.user();
      if (!user) throw Error('Please sign in');
      this.userId = user.id;
      await this.loadConversations();
    } catch (err) { this.error = this.reason(err); }
  }
  private reason(e: unknown) { return e instanceof Error ? e.message : String(e); }
  private async loadConversations() {
    const rows = await this.api.conversations();
    this.conversations = rows.map((r: any) => ({
      id: String(r.id),
      // Provide recipient names via an authorized join to conversation_members/profiles.
      title: String(r.title || 'Conversation'),
      updatedAt: r.updated_at ? new Date(r.updated_at).toLocaleDateString() : '',
    }));
  }
  async searchPeople(term: string) {
    if (term.length < 2) { this.recipients = []; return; }
    try {
      const rows: any[] = await this.api.explore(term, 'profiles');
      this.recipients = rows.filter(r => r.id !== this.userId).map(r => ({
        id: String(r.id), username: String(r.username),
        displayName: r.display_name || '', isPrivate: !!r.is_private
      }));
    } catch(err) { this.error = this.reason(err); }
  }
  async createConversation(otherUserId: string) {
    this.busy = true; this.error = '';
    try {
      const c = await this.api.createConversation(otherUserId);
      await this.loadConversations();
      await this.openConversation(c.id);
    } catch(err) { this.error = this.reason(err); }
    finally { this.busy = false; }
  }
  async openConversation(id: string) {
    this.activeId = id;
    if (this.channel) await this.api.stop(this.channel);
    this.channel = undefined;
    try {
      await this.loadMessages(id);
      this.channel = this.api.watchMessages(id, () => { void this.loadMessages(id); });
    } catch(err) { this.error = this.reason(err); }
  }
  private async loadMessages(id: string) {
    const rows: any[] = await this.api.messages(id);
    this.messages = rows.map(r => ({
      id: String(r.id), conversationId: String(r.conversation_id),
      senderId: String(r.sender_id), text: String(r.body ?? ''),
      sentAt: new Date(r.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})
    }));
  }
  async sendMessage(payload: {conversationId:string;body:string}) {
    this.busy = true; this.error = '';
    try {
      await this.api.sendMessage(payload.conversationId, payload.body);
      this.view?.clearDraft(); // Only clear after server confirmation.
      await this.loadMessages(payload.conversationId);
    } catch(err) { this.error = this.reason(err); }
    finally { this.busy = false; }
  }
  async deleteMessage(id: string) {
    if (!this.activeId) return;
    this.busy = true; this.error = '';
    try { await this.api.deleteMessage(id); await this.loadMessages(this.activeId); }
    catch(err) { this.error = this.reason(err); }
    finally { this.busy = false; }
  }
  ngOnDestroy() { if (this.channel) void this.api.stop(this.channel); }
}
