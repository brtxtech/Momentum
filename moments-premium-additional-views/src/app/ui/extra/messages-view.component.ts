import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiConversation, UiMessage, UiPerson, UI_AVATAR_FALLBACK } from './view-models';

/** Two-pane inbox UI. Emits normalized actions; parent owns authenticated persistence and subscriptions. */
@Component({
  selector: 'ms-messages-premium', standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messages-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessagesPremiumComponent {
  @Input() conversations: UiConversation[] = [];
  @Input() messages: UiMessage[] = [];
  @Input() recipients: UiPerson[] = [];
  @Input() activeId: string | null = null;
  @Input() currentUserId = '';
  @Input() busy = false;
  @Input() loading = false;
  @Input() error = '';
  @Input() typing = false;
  @Output() conversationOpen = new EventEmitter<string>();
  @Output() recipientSearch = new EventEmitter<string>();
  @Output() conversationCreate = new EventEmitter<string>();
  @Output() messageSend = new EventEmitter<{conversationId:string; body:string}>();
  @Output() attachmentSelect = new EventEmitter<File>();
  @Output() messageDelete = new EventEmitter<string>();
  @Output() olderMessages = new EventEmitter<string>();
  @Output() conversationMenu = new EventEmitter<string>();
  showNew = false;
  inboxSearch = '';
  recipientTerm = '';
  draft = '';
  mobileChat = false;
  avatar = UI_AVATAR_FALLBACK;
  get filteredConversations(): UiConversation[] {
    const q = this.inboxSearch.toLocaleLowerCase().trim();
    return q ? this.conversations.filter(c => `${c.title} ${c.latest ?? ''}`.toLocaleLowerCase().includes(q)) : this.conversations;
  }
  get selected(): UiConversation | undefined { return this.conversations.find(c => c.id === this.activeId); }
  get filteredRecipients(): UiPerson[] {
    const q = this.recipientTerm.toLocaleLowerCase().trim();
    return this.recipients.filter(p => `${p.username} ${p.displayName ?? ''}`.toLowerCase().includes(q)).slice(0, 15);
  }
  open(id: string) { this.mobileChat = true; this.conversationOpen.emit(id); }
  searchRecipients(q:string) { this.recipientTerm = q; this.recipientSearch.emit(q.trim()); }
  chooseRecipient(id:string) { this.conversationCreate.emit(id); this.showNew = false; this.recipientTerm = ''; }
  send() {
    const value = this.draft.trim();
    if (!this.activeId || !value || this.busy) return;
    this.messageSend.emit({conversationId:this.activeId,body:value});
    // Clear only after the parent reflects an accepted send. See README for error handling.
  }
  clearDraft() { this.draft = ''; }
  pickFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file && this.activeId) this.attachmentSelect.emit(file);
    input.value = '';
  }
  id = (_: number, item: {id:string}) => item.id;
}
