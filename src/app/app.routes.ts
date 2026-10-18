import { authGuard } from './core/auth.guard';
import { SocialWorkspaceComponent } from './features/social-workspace/social-workspace.component';
import { CloudComponent } from './features/cloud/cloud.component';
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
import { LoginComponent } from './features/login/login.component';
import { Routes } from '@angular/router';
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent, title: 'Login | Moments Studio' },
  { path: 'feed', component: FeedComponent, title: 'Feed | Moments Studio', canActivate: [authGuard] },
  { path: 'explore', component: ExploreComponent, title: 'Explore | Moments Studio', canActivate: [authGuard] },
  { path: 'reels', component: ReelsComponent, title: 'Reels | Moments Studio', canActivate: [authGuard] },
  { path: 'stories', component: StoriesComponent, title: 'Stories | Moments Studio', canActivate: [authGuard] },
  { path: 'messages', component: MessagesComponent, title: 'Messages | Moments Studio', canActivate: [authGuard] },
  { path: 'notifications', component: NotificationsComponent, title: 'Notifications | Moments Studio', canActivate: [authGuard] },
  { path: 'people', component: PeopleComponent, title: 'People | Moments Studio', canActivate: [authGuard] },
  { path: 'events', component: EventsComponent, title: 'Events | Moments Studio', canActivate: [authGuard] },
  { path: 'gallery', component: GalleryComponent, title: 'Gallery | Moments Studio', canActivate: [authGuard] },
  { path: 'invitations', component: InvitationsComponent, title: 'Invitations | Moments Studio', canActivate: [authGuard] },
  { path: 'qr', component: QrComponent, title: 'Qr | Moments Studio', canActivate: [authGuard] },
  { path: 'create', component: CreateComponent, title: 'Create | Moments Studio', canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, title: 'Profile | Moments Studio', canActivate: [authGuard] },
  { path: 'saved', component: SavedComponent, title: 'Saved | Moments Studio', canActivate: [authGuard] },
  { path: 'insights', component: InsightsComponent, title: 'Insights | Moments Studio', canActivate: [authGuard] },
  { path: 'settings', component: SettingsComponent, title: 'Settings | Moments Studio', canActivate: [authGuard] },
  { path: 'help', component: HelpComponent, title: 'Help | Moments Studio', canActivate: [authGuard] },
  { path: 'social', component: SocialWorkspaceComponent, title: 'Social workspace | Moments Studio', canActivate: [authGuard] },
  { path: 'cloud', component: CloudComponent, title: 'Connect Supabase | Moments Studio', canActivate: [authGuard] },
  { path: 'cloud-feed', redirectTo: 'feed' },
  { path: 'cloud-social', redirectTo: 'social' },
  { path: '**', redirectTo: 'login' }
];
