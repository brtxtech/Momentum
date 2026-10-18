# Moments Studio — twelve premium views UX specification

Based on the seven supplied Instagram screenshots for Feed, Stories, Reels, Explore, Activity and Profile. New event-specific views borrow the same minimal visual hierarchy without copying Instagram branding.

## Universal composition

- Keep the existing desktop navigation sidebar and mobile bottom tabs in `app.component.html`; do **not** add second global navigation systems inside pages.
- Background white/dark via theme token; text black/dark; hairline dividers, generous whitespace, single blue primary button per area.
- Use 44px minimum touch targets where space permits; obvious focus ring for keyboard; avoid relying on color alone for unread state.
- All empty states display an actionable explanation. Loading skeletons appear for activity (other pages take `loading` and can add skeletons at host level).

## Screen-by-screen design

### 1. Messages `/messages`
**Desktop:** Inbox at 320–355px on the left; active chat on the right. Inbox header 'Messages' with compose icon, search field, avatar circles, snippets, unread badges. Chat top bar shows recipient; messages align left/right by sender; fixed composer at bottom.
**Mobile:** Inbox fills viewport; opening a conversation switches to chat with back button.
**Flow:** search username -> select real profile -> send to backend start-conversation RPC -> load messages -> subscribe to Realtime -> send -> clear draft only on confirmed success. No raw UUID field.

### 2. Activity `/notifications`
A narrower, almost overlay-style panel, large heading, scrolling category chips, activity grouped Today/This week/Earlier. Unread small blue dot, related photo thumbnail, follow-request Confirm/Delete.
**Flow:** load authorized notifications -> filter client view -> click -> mark read -> navigate to target; approve/reject handled by parent service.

### 3. People `/people`
Search near page header, secondary tabs For You, Followers, Following, Requests. Three-column creator cards with full circular profile photos, name, bio and big Follow action. For private accounts use Requested state until approved.

### 4. Events `/events`
Full-width charcoal-to-taupe editorial celebration hero, inline Create button, event category filter, 3-column event photography cards. Each card: event date, title, location, guests, RSVP, Invite, share. Private events must remain private in backend queries.

### 5. Gallery `/gallery`
Edge-to-edge photo tiles with 4-column desktop/3-column mobile, hover tools, selection mode, event filter chips, Photo/Video toggles. Host integrates PhotoSwipe on `galleryOpen` and signs private media URLs only for authorized members.

### 6. Invitations `/invitations`
Left live-edit panel / right tall card preview; mobile stacks preview then editor. Six styles: Ivory, Blush, Midnight, Sage, Classic, Gilded. Preview typography uses Georgia to echo print invitations. Save, print/export and share are parent-host actions.

### 7. QR Studio `/qr`
Left create/scanner form / right luxurious QR print card. Specific targets for profile/post/event; invitation token must be generated server-side and redeemed atomically. QR scanning triggers camera setup in parent, over HTTPS or localhost.

### 8. Profile `/profile`
Large circular avatar, username and controls, posts/followers/following, bio, Highlights strip, centered tab bar and 3-column square media tiles. Saved tab owner-only in UI **and** backend, tagged media separately supplied.

### 9. Saved `/saved`
Private collection chips, saved media cards with captions and remove bookmark actions. Collection creation currently emits an event and requires storage/backend implementation. No public access to another user's saved list.

### 10. Insights `/insights`
Creator KPIs: reach, engagement, followers, posts from actual query results; date chips 7/30/90 days; CSS bar chart with a semantic summary; sortable top posts from input records. Empty state for no data, no invented analytics.

### 11. Settings `/settings`
Desktop left section navigation and right forms. Account, Privacy, Notifications, Appearance, Security. Styled switch/toggle rows, color-theme preview options, MFA and sessions links, account export and deletion workflows. Save waits for backend confirmation; true privacy relies on RLS, not client controls.

### 12. Help `/help`
Charcoal editorial hero, prominent search field, four category cards, filterable FAQ accordion and support form. Safety banner links to report content or privacy settings. Backend persists support tickets, not browser-local mock records.

## Browser & accessibility verification checklist

- [ ] Desktop at 1440x900: sidebar and content do not overlap
- [ ] Tablet at 768x1024: grids collapse and no horizontal body scroll
- [ ] Mobile at 390x844 and 320x568: chat, forms, cards and bottom nav fit
- [ ] Dark mode: text contrast and controls readable
- [ ] Keyboard: all actions reachable, focus visible, dialogs close predictably
- [ ] Screen reader: buttons and input labels have meaningful names
- [ ] Supabase: no unauthorized content visible in any view
- [ ] Messaging: second signed-in user receives message in Realtime
- [ ] Private event gallery: nonmember receives denied response, not signed URL
- [ ] Settings: changing preferences persists after session restart
- [ ] Build: `npm run build` passes using actual Angular dependencies

These are **QA tasks to execute**, not assertions that they have passed.
