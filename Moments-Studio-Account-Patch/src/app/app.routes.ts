import { accountGuard } from './core/account.guard';
import { SocialWorkspaceComponent } from './features/social-workspace/social-workspace.component';
import { CloudComponent } from './features/cloud/cloud.component';
import { CloudFeedComponent } from './features/cloud-feed/cloud-feed.component';
import { CloudSocialComponent } from './features/cloud-social/cloud-social.component';
import { Routes } from '@angular/router';
import { FeedComponent } from './features/feed/feed.component';
import { ExploreComponent } from './features/explore/explore.component';
import { ReelsComponent } from './features/reels/reels.component';
import { StoriesComponent } from './features/stories/stories.component';
import { MessagesComponent } from './features/messages/messages.component';
import { NotificationsComponent } from './features/notifications/notifications.component';
import { PeopleComponent } from './features/people/people.component';
import { EventsComponent } from './features/events/events.component';
import { GalleryComponent } from './features/gallery/gallery.component';
import { InvitationsComponent } from './features/invitations/invitations.component';
import { QrComponent } from './features/qr/qr.component';
import { CreateComponent } from './features/create/create.component';
import { ProfileComponent } from './features/profile/profile.component';
import { SavedComponent } from './features/saved/saved.component';
import { InsightsComponent } from './features/insights/insights.component';
import { SettingsComponent } from './features/settings/settings.component';
import { HelpComponent } from './features/help/help.component';
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'feed' },
  { path: 'feed', component: SocialWorkspaceComponent, data: { section: 'feed' }, title: 'Feed | Moments Studio' },
  { path: 'explore', component: SocialWorkspaceComponent, data: { section: 'explore' }, title: 'Explore | Moments Studio' },
  { path: 'reels', component: ReelsComponent, title: 'Reels | Moments Studio' },
  { path: 'stories', component: SocialWorkspaceComponent, data: { section: 'stories' }, title: 'Stories | Moments Studio' },
  { path: 'messages', component: SocialWorkspaceComponent, data: { section: 'messages' }, title: 'Messages | Moments Studio' },
  { path: 'notifications', component: SocialWorkspaceComponent, data: { section: 'notifications' }, title: 'Notifications | Moments Studio' },
  { path: 'people', component: SocialWorkspaceComponent, data: { section: 'people' }, title: 'People | Moments Studio' },
  { path: 'events', component: SocialWorkspaceComponent, data: { section: 'events' }, title: 'Events | Moments Studio' },
  { path: 'gallery', component: SocialWorkspaceComponent, data: { section: 'gallery' }, title: 'Gallery | Moments Studio' },
  { path: 'invitations', component: SocialWorkspaceComponent, data: { section: 'invitations' }, title: 'Invitations | Moments Studio' },
  { path: 'qr', component: QrComponent, title: 'Qr | Moments Studio' },
  { path: 'create', component: CreateComponent, title: 'Create | Moments Studio' },
  { path: 'profile', component: ProfileComponent, canActivate: [accountGuard], title: 'Profile | Moments Studio' },
  { path: 'saved', component: SavedComponent, canActivate: [accountGuard], title: 'Saved | Moments Studio' },
  { path: 'insights', component: InsightsComponent, canActivate: [accountGuard], title: 'Insights | Moments Studio' },
  { path: 'settings', component: SettingsComponent, canActivate: [accountGuard], title: 'Settings | Moments Studio' },
  { path: 'help', component: HelpComponent, title: 'Help | Moments Studio' },
  { path: 'social', component: SocialWorkspaceComponent, title: 'Social workspace | Moments Studio' },
  { path: 'cloud', component: CloudComponent, title: 'Connect Supabase | Moments Studio' },
  { path: 'cloud-feed', redirectTo: 'feed' },
  { path: 'cloud-social', redirectTo: 'social' },
  { path: '**', redirectTo: 'feed' }
];
