import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { RealtimeChannel } from '@supabase/supabase-js';
import { SocialApi } from '../../core/social-api.service';

type Section = 'feed' | 'explore' | 'reels' | 'stories' | 'messages' | 'notifications' | 'people' | 'events' | 'gallery' | 'invitations' | 'profile' | 'saved' | 'insights' | 'settings' | 'help';
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  styles: [`
  :host{display:block}.workspace{max-width:1120px;margin:0 auto;padding:24px}.tabs{display:flex;flex-wrap:wrap;gap:8px;margin:20px 0}.tabs button{border:1px solid var(--border,#9995);border-radius:24px;padding:9px 13px;background:transparent;color:inherit;cursor:pointer}.tabs button[aria-selected=true]{background:var(--accent,#7957d5);color:white}.stack{display:grid;gap:16px}.card{padding:20px;border:1px solid var(--border,#9995);border-radius:16px;background:var(--surface,#ffffff0b)}.fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}.fields label{display:grid;gap:5px}input,textarea,select{max-width:100%;width:100%;padding:10px;border-radius:9px;border:1px solid #8887;background:var(--surface,#fff);color:inherit}textarea{min-height:90px}button{cursor:pointer}.action{padding:10px 16px;border-radius:10px;border:0;background:#7653db;color:#fff;margin:4px}.secondary{background:#586172}.danger{background:#a82d46}.record{border-bottom:1px solid #8883;padding:14px 0}.record:last-child{border:0}.muted{opacity:.7}.preview{max-height:360px;max-width:100%;border-radius:12px}.video{width:100%;max-height:480px}.message{white-space:pre-wrap;overflow-wrap:anywhere}.toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.error{color:#d24c5d}.success{color:#25996a}.metric{font-size:2rem;font-weight:700}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px}@media(max-width:640px){.workspace{padding:10px}.card{padding:14px}.tabs{flex-wrap:nowrap;overflow:auto;scroll-snap-type:x mandatory}.tabs button{white-space:nowrap;scroll-snap-align:start}}
  `],
  template: `<main class="workspace">
  <section class="stack" *ngIf="active()==='feed' || active()==='reels'">
   <article class="card"><h2>{{active()==='reels'?'Publish a reel':'Create a post'}}</h2><label>Caption<textarea [(ngModel)]="caption" maxlength="2200"></textarea></label><label>Media (image or video)<input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" (change)="pick($event)"></label><button class="action" (click)="act('post')">Publish</button></article>
   <article class="card" *ngFor="let post of rows()"><div class="toolbar"><strong>{{post.profiles?.display_name||post.profiles?.username||'Member'}}</strong><small class="muted">{{post.created_at|date:'medium'}}</small></div><p class="message">{{post.caption}}</p><img *ngIf="post._url && post.kind==='image'" class="preview" [src]="post._url" alt="Post media"><video *ngIf="post._url && post.kind==='video'" class="video" controls playsinline [src]="post._url"></video><div class="toolbar"><button class="action secondary" (click)="act('like',post)">♥ Like</button><button class="action secondary" (click)="act('save',post)">Bookmark</button><button class="action secondary" (click)="editPostPrompt(post)">Edit my post</button><button class="action danger" (click)="act('deletePost',post)">Delete my post</button></div><label>Comment<input [(ngModel)]="drafts[post.id]" maxlength="1000" placeholder="Write a comment"></label><button class="action" (click)="act('comment',post)">Send comment</button><div class="record" *ngFor="let c of post.post_comments">{{c.body}} <button class="action secondary" (click)="editCommentPrompt(c)">Edit my comment</button><button class="action danger" (click)="act('deleteComment',c)">Delete my comment</button></div></article>
   <button class="action secondary" (click)="nextPage()">Load more</button>
  </section>
  <section class="stack" *ngIf="active()==='explore' || active()==='people'"><article class="card"><h2>Search</h2><div class="fields"><label>Search<input [(ngModel)]="query" (keyup.enter)="refresh()"></label><label>Category<select [(ngModel)]="searchKind"><option value="profiles">People</option><option value="posts">Posts</option><option value="events">Events</option></select></label></div><button class="action" (click)="refresh()">Search</button></article><article class="card" *ngFor="let item of rows()"><strong>{{item.display_name||item.username||item.title||item.caption}}</strong><p>{{item.bio||item.caption||item.id}}</p><button *ngIf="searchKind==='profiles'" class="action" (click)="act('follow',item)">Follow / unfollow</button></article><article *ngIf="active()==='people'" class="card"><h3>Pending follow requests</h3><p class="muted">Review who is requesting access to your private profile.</p><div *ngFor="let request of pendingFollows()" class="record"><strong>{{request.profiles?.username || request.follower_id}}</strong><button class="action" (click)="act('approveFollow',request)">Approve</button></div><p *ngIf="!pendingFollows().length" class="muted">No pending requests</p></article></section>
  <section class="stack" *ngIf="active()==='stories'"><article class="card"><h2>Share a 24-hour story</h2><input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" (change)="pick($event)"><button class="action" (click)="act('story')">Upload story</button></article><article class="card" *ngFor="let item of rows()"><strong>{{item.created_at|date:'short'}}</strong><p>Expires {{item.expires_at|date:'short'}}</p><img *ngIf="item._url && !isVideo(item.media_path)" [src]="item._url" class="preview" alt="Story"><video *ngIf="item._url && isVideo(item.media_path)" [src]="item._url" class="video" controls playsinline></video><button class="action danger" (click)="act('deleteStory',item)">Delete my story</button></article></section>
  <section class="stack" *ngIf="active()==='messages'"><article class="card"><h2>Conversations</h2><label>Recipient user UUID<input [(ngModel)]="recipient" placeholder="User UUID"></label><button class="action" (click)="act('conversation')">Create conversation</button><div *ngFor="let item of rows()" class="record"><button class="action secondary" (click)="openChat(item.id)">Open conversation {{item.id|slice:0:8}}</button></div></article><article class="card" *ngIf="conversationId"><h2>Messages</h2><div class="record" *ngFor="let m of chatRows()"><strong>{{m.sender_id|slice:0:8}}</strong> <span class="muted">{{m.created_at|date:'short'}}</span><p class="message">{{m.body}}</p><button class="action danger" (click)="act('deleteMessage',m)">Delete my message</button></div><label>Message<textarea [(ngModel)]="message" maxlength="4000"></textarea></label><button class="action" (click)="act('message')">Send</button></article></section>
  <section class="stack" *ngIf="active()==='notifications'"><article class="card"><h2>Notifications</h2><button class="action secondary" (click)="act('readAll')">Mark all as read</button><div *ngFor="let n of rows()" class="record"><strong>{{n.kind}}</strong><p>{{n.body}}</p><small>{{n.created_at|date:'short'}}</small><button class="action secondary" *ngIf="!n.read" (click)="act('read',n)">Mark read</button></div></article></section>
  <section class="stack" *ngIf="active()==='events' || active()==='gallery' || active()==='invitations'"><article *ngIf="active()==='events'" class="card"><h2>My invitations</h2><div class="record" *ngFor="let invite of pendingInvites()"><span>Event {{invite.event_id|slice:0:8}} · {{invite.status}}</span><button class="action" (click)="act('acceptEvent',invite)">Accept invitation</button></div><p *ngIf="!pendingInvites().length" class="muted">No pending invitations</p></article><article class="card"><h2>Events and guests</h2><div class="fields"><label>Event title<input [(ngModel)]="eventTitle" maxlength="120"></label><label>Date<input type="datetime-local" [(ngModel)]="eventDate"></label><label>Privacy<select [(ngModel)]="eventPrivacy"><option value="private">Private</option><option value="public">Public</option></select></label></div><button class="action" (click)="act('event')">Create event</button><div class="record" *ngFor="let e of rows()"><button class="action secondary" (click)="selectEvent(e.id)">{{e.title}} · {{e.privacy}}</button></div></article><article class="card" *ngIf="eventId"><h2>Selected event</h2><p>{{eventId}}</p><label>Guest user UUID<input [(ngModel)]="guestId"></label><button class="action" (click)="act('invite')">Invite guest</button><h3>Private event gallery</h3><input type="file" accept="image/jpeg,image/png,image/webp" (change)="pick($event)"><button class="action" (click)="act('eventUpload')">Upload photo</button><div class="grid"><div *ngFor="let m of mediaRows()"><img class="preview" [src]="m._url" alt="Event photo"><button class="action secondary" (click)="downloadMedia(m)">Download</button><button class="action danger" (click)="act('deleteMedia',m)">Delete authorized photo</button></div></div><h3>Invitation editor</h3><label>Invitation heading<input [(ngModel)]="invitationTitle"></label><label>Invitation message<textarea [(ngModel)]="invitationBody"></textarea></label><label>Theme<select [(ngModel)]="invitationTheme"><option value="classic">Classic</option><option value="modern">Modern</option><option value="floral">Floral</option></select></label><div class="card" id="invitation-preview"><h2>{{invitationTitle}}</h2><p>{{invitationBody}}</p><small>{{invitationTheme}}</small></div><button class="action" (click)="act('invitation')">Save invitation</button><button class="action secondary" (click)="printInvitation()">Print / Save PDF</button><div class="record" *ngFor="let inv of inviteRows()">{{inv.design?.title}} · {{inv.created_at|date:'short'}}</div></article></section>
  <section class="stack" *ngIf="active()==='profile'"><article class="card"><h2>Edit profile</h2><div class="fields"><label>Display name<input [(ngModel)]="displayName" maxlength="100"></label><label>Bio<textarea [(ngModel)]="bio" maxlength="500"></textarea></label><label><input type="checkbox" [(ngModel)]="privateProfile"> Private profile</label></div><button class="action" (click)="act('profile')">Save profile</button><label>Avatar<input type="file" accept="image/jpeg,image/png,image/webp" (change)="pick($event)"></label><button class="action" (click)="act('avatar')">Upload avatar</button></article></section>
  <section class="stack" *ngIf="active()==='saved'"><article class="card"><h2>Saved posts</h2><div *ngFor="let s of rows()" class="record"><p>{{s.posts?.caption||s.post_id}}</p><button class="action secondary" (click)="act('unsave',s)">Remove bookmark</button></div></article></section>
  <section class="stack" *ngIf="active()==='insights'"><article class="card"><h2>Your activity</h2><div class="grid"><div><div class="metric">{{metrics().posts||0}}</div>Posts</div><div><div class="metric">{{metrics().followers||0}}</div>Followers</div><div><div class="metric">{{metrics().events||0}}</div>Events</div></div><p class="muted">Counts are derived from accessible database records, not estimated impressions.</p></article></section>
  <section class="stack" *ngIf="active()==='settings'"><article class="card"><h2>Preferences and security</h2><label>Theme<select [(ngModel)]="theme"><option value="system">System</option><option value="dark">Dark</option><option value="light">Light</option></select></label><label><input type="checkbox" [(ngModel)]="reducedMotion"> Reduce motion</label><button class="action" (click)="act('preferences')">Save preferences</button><h3>Change password</h3><label>New password (12+ characters)<input type="password" [(ngModel)]="newPassword" autocomplete="new-password"></label><button class="action" (click)="act('password')">Change password</button><button class="action secondary" (click)="act('logout')">Sign out</button></article></section>
  <section class="stack" *ngIf="active()==='help'"><article class="card"><h2>Support</h2><label>Search help<input [(ngModel)]="query" placeholder="Search help articles"></label><div *ngFor="let a of helpArticles" [hidden]="query && !(a.title+' '+a.body).toLowerCase().includes(query.toLowerCase())" class="record"><strong>{{a.title}}</strong><p>{{a.body}}</p></div><h3>Open support ticket</h3><label>Subject<input [(ngModel)]="supportSubject"></label><label>Details<textarea [(ngModel)]="supportBody"></textarea></label><button class="action" (click)="act('support')">Submit ticket</button><div *ngFor="let ticket of rows()" class="record">{{ticket.subject}} · {{ticket.created_at|date:'short'}}</div></article></section>
  </main>`
})
export class SocialWorkspaceComponent implements OnInit, OnDestroy {
  readonly sections: Section[] = ['feed', 'explore', 'reels', 'stories', 'messages', 'notifications', 'people', 'events', 'gallery', 'invitations', 'profile', 'saved', 'insights', 'settings', 'help'];
  active = signal<Section>('feed'); rows = signal<any[]>([]); chatRows = signal<any[]>([]); mediaRows = signal<any[]>([]); inviteRows = signal<any[]>([]); pendingInvites = signal<any[]>([]); pendingFollows = signal<any[]>([]); metrics = signal<any>({}); notice = signal('');
  error = signal(false); busy = signal(false);
  caption = ''; file?: File; drafts: Record<string, string> = {}; query = ''; searchKind: 'posts' | 'profiles' | 'events' = 'profiles'; recipient = ''; conversationId = ''; message = ''; eventTitle = ''; eventDate = ''; eventPrivacy: 'public' | 'private' = 'private'; eventId = ''; guestId = ''; invitationTitle = 'You are invited'; invitationBody = 'Join us for a special celebration'; invitationTheme = 'classic'; displayName = ''; bio = ''; privateProfile = false; theme: 'light' | 'dark' | 'system' = 'system'; reducedMotion = false; newPassword = ''; supportSubject = ''; supportBody = ''; page = 0; channel?: RealtimeChannel;
  helpArticles = [{ title: 'Private accounts', body: 'A private profile requires approved-follow semantics on the server. Do not rely on client-side controls alone.' }, { title: 'Event invitations', body: 'Invite a registered guest by user UUID. Guest acceptance and secure QR redemption require backend workflows.' }, { title: 'Media safety', body: 'Upload only content you have permission to share. Images and videos are stored in private buckets.' }, { title: 'Account security', body: 'Use a unique password, verify your email, and enable MFA in Supabase Auth if configured.' }];
  constructor(public api: SocialApi, private route: ActivatedRoute, private router: Router) { }
  ngOnInit() { const section = this.route.snapshot.data['section'] as Section | undefined; if (section && this.sections.includes(section)) this.active.set(section); void this.refresh() }
  ngOnDestroy() { if (this.channel) void this.api.stop(this.channel) }
  pick(event: Event) { this.file = (event.target as HTMLInputElement).files?.[0] }
  isVideo(path: string) { return /\.(mp4|webm)$/i.test(path) }
  async work(task: () => Promise<void>) { if (this.busy()) return; this.busy.set(true); this.error.set(false); try { await task(); this.notice.set('Operation completed.') } catch (e) { this.error.set(true); this.notice.set(e instanceof Error ? e.message : String(e)) } finally { this.busy.set(false) } }
  switchTo(section: Section) { void this.router.navigateByUrl('/' + section) }
  async withUrls(items: any[], field = 'media_path', bucket: 'social-media' | 'event-private' = 'social-media') {
    return Promise.all(items.map(async item => ({ ...item, _url: item[field] ? await this.api.signedUrl(bucket, item[field]).catch(() => null) : null })));
  }
  sectionLabel(section: Section) {
    const map: Record<Section, string> = {
      feed: 'Feed',
      explore: 'Explore',
      reels: 'Reels',
      stories: 'Stories',
      messages: 'Messages',
      notifications: 'Notifications',
      people: 'People',
      events: 'Events',
      gallery: 'Gallery',
      invitations: 'Invitations',
      profile: 'Profile',
      saved: 'Saved',
      insights: 'Insights',
      settings: 'Settings',
      help: 'Help'
    };
    return map[section];
  }
  async refresh() {
    if (!this.api.ready) { this.notice.set(''); this.rows.set([]); return } await this.work(async () => {
      const tab = this.active(); let items: any[] = [];
      if (tab === 'feed' || tab === 'reels') { items = tab === 'reels' ? await this.api.reels(this.page) : await this.api.feed(this.page); items = await this.withUrls(items) }
      else if (tab === 'explore' || tab === 'people') { items = await this.api.explore(this.query, this.searchKind); if (tab === 'people') this.pendingFollows.set(await this.api.followersPending()) }
      else if (tab === 'stories') items = await this.withUrls(await this.api.stories());
      else if (tab === 'messages') items = await this.api.conversations();
      else if (tab === 'notifications') items = await this.api.notifications();
      else if (tab === 'events' || tab === 'gallery' || tab === 'invitations') { items = await this.api.events(); if (tab === 'events') this.pendingInvites.set(await this.api.pendingEventInvites()) }
      else if (tab === 'saved') items = await this.api.saved();
      else if (tab === 'insights') this.metrics.set(await this.api.insights());
      else if (tab === 'profile') { const p: any = await this.api.profile(); this.displayName = p.display_name || ''; this.bio = p.bio || ''; this.privateProfile = !!p.is_private }
      else if (tab === 'settings') { const pref = await this.api.preferences(); if (pref) { this.theme = pref.theme; this.reducedMotion = pref.reduced_motion; this.applyAppearance() } }
      else if (tab === 'help') items = await this.api.listSupport();
      this.rows.set(items);
    })
  }
  nextPage() { this.page++; void this.work(async () => { const more = await this.withUrls(this.active() === 'reels' ? await this.api.reels(this.page) : await this.api.feed(this.page)); this.rows.update(v => [...v, ...more]) }) }
  openChat(id: string) { this.conversationId = id; if (this.channel) void this.api.stop(this.channel); void this.work(async () => { this.chatRows.set(await this.api.messages(id)); this.channel = this.api.watchMessages(id, () => { void this.api.messages(id).then(m => this.chatRows.set(m)).catch(() => { }) }) }) }
  selectEvent(id: string) { this.eventId = id; void this.work(async () => { this.mediaRows.set(await this.withUrls(await this.api.eventMedia(id), 'storage_path', 'event-private')); this.inviteRows.set(await this.api.invitations(id)) }) }
  async downloadMedia(m: any) { if (!m._url) return; try { const response = await fetch(m._url); if (!response.ok) throw Error('Download failed'); const blob = await response.blob(); const href = URL.createObjectURL(blob); try { const a = document.createElement('a'); a.href = href; a.download = 'moments-event-photo'; a.click() } finally { setTimeout(() => URL.revokeObjectURL(href), 30000) } } catch (e) { this.notice.set('Download failed: ' + String(e)); this.error.set(true) } }
  applyAppearance() { document.documentElement.dataset['theme'] = this.theme === 'system' ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : this.theme; document.documentElement.dataset['motion'] = this.reducedMotion ? 'reduced' : 'normal' }
  printInvitation() { window.print() }
  editPostPrompt(post: any) {
    const updated = window.prompt('Edit your caption', String(post.caption ?? ''));
    if (updated === null) return;
    void this.work(async () => { await this.api.editPost(post.id, updated); this.rows.set(await this.withUrls(await this.api.feed(0))) });
  }
  editCommentPrompt(comment: any) {
    const updated = window.prompt('Edit your comment', String(comment.body ?? ''));
    if (updated === null) return;
    void this.work(async () => { await this.api.editComment(comment.id, updated); this.rows.set(await this.withUrls(await this.api.feed(0))) });
  }
  act(action: string, item: any = {}) {
    void this.work(async () => {
      switch (action) {
        case 'post': if (this.active() === 'reels' && !this.file?.type.startsWith('video/')) throw Error('Select a video for reels'); await this.api.createPost(this.caption, this.file); this.caption = ''; this.file = undefined; break;
        case 'like': await this.api.toggleRelation('post_likes', item.id); break;
        case 'save': await this.api.toggleRelation('saved_posts', item.id); break;
        case 'unsave': await this.api.toggleRelation('saved_posts', item.post_id); break;
        case 'comment': await this.api.comment(item.id, this.drafts[item.id] || ''); this.drafts[item.id] = ''; break;
        case 'deletePost': if (!confirm('Delete this post if you own it?')) return; await this.api.deletePost(item.id); break;
        case 'follow': await this.api.follow(item.id); break;
        case 'approveFollow': await this.api.approveFollower(item.follower_id); this.pendingFollows.set(await this.api.followersPending()); return;
        case 'acceptEvent': await this.api.acceptEventInvite(item.event_id); this.pendingInvites.set(await this.api.pendingEventInvites()); this.rows.set(await this.api.events()); return;
        case 'story': if (!this.file) throw Error('Choose media'); await this.api.createStory(this.file); this.file = undefined; break;
        case 'deleteStory': await this.api.deleteStory(item.id); break;
        case 'conversation': await this.api.createConversation(this.recipient); break;
        case 'message': await this.api.sendMessage(this.conversationId, this.message); this.message = ''; this.chatRows.set(await this.api.messages(this.conversationId)); return;
        case 'deleteMessage': await this.api.deleteMessage(item.id); this.chatRows.set(await this.api.messages(this.conversationId)); return;
        case 'read': await this.api.markRead(item.id); break;
        case 'readAll': await this.api.markAllNotificationsRead(); break;
        case 'deleteComment': await this.api.deleteComment(item.id); break;
        case 'event': await this.api.createEvent(this.eventTitle, this.eventDate ? new Date(this.eventDate).toISOString() : '', this.eventPrivacy); break;
        case 'invite': await this.api.invite(this.eventId, this.guestId); return;
        case 'eventUpload': if (!this.file) throw Error('Choose a photo'); await this.api.uploadEvent(this.eventId, this.file); this.file = undefined; this.selectEvent(this.eventId); return;
        case 'deleteMedia': if (!confirm('Delete photo?')) return; await this.api.deleteEventMedia(item.id, item.storage_path); this.selectEvent(this.eventId); return;
        case 'invitation': await this.api.saveInvitation(this.eventId, { title: this.invitationTitle, body: this.invitationBody, theme: this.invitationTheme }); this.selectEvent(this.eventId); return;
        case 'profile': await this.api.updateProfile({ display_name: this.displayName, bio: this.bio, is_private: this.privateProfile }); return;
        case 'avatar': if (!this.file) throw Error('Choose an avatar'); await this.api.updateAvatar(this.file); this.file = undefined; return;
        case 'preferences': await this.api.savePreferences(this.theme, this.reducedMotion); this.applyAppearance(); return;
        case 'password': await this.api.changePassword(this.newPassword); this.newPassword = ''; return;
        case 'logout': await this.api.logout(); this.rows.set([]); return;
        case 'support': await this.api.support(this.supportSubject, this.supportBody); this.supportSubject = ''; this.supportBody = ''; break;
        default: throw Error('Unknown action');
      }const tab = this.active(); let next: any[] = [];
      if (tab === 'feed' || tab === 'reels') { next = await this.withUrls(tab === 'reels' ? await this.api.reels(0) : await this.api.feed(0)) }
      else if (tab === 'stories') next = await this.withUrls(await this.api.stories());
      else if (tab === 'messages') next = await this.api.conversations();
      else if (tab === 'notifications') next = await this.api.notifications();
      else if (tab === 'events' || tab === 'gallery' || tab === 'invitations') { next = await this.api.events(); if (tab === 'events') this.pendingInvites.set(await this.api.pendingEventInvites()) }
      else if (tab === 'saved') next = await this.api.saved();
      else if (tab === 'help') next = await this.api.listSupport();
      else if (tab === 'people' || tab === 'explore') { next = await this.api.explore(this.query, this.searchKind); if (tab === 'people') this.pendingFollows.set(await this.api.followersPending()) }
      this.rows.set(next);
    })
  }
}
