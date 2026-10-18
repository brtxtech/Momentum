# Moments Studio user journey: routes and verification map

1. Open `/cloud` and enter your own Supabase project URL and **publishable** key. Never enter a service-role secret. Session-storage configuration is optional and stays on this device; Supabase manages the auth session.
2. Register or sign in. New profile is created by an Auth trigger supplied in migration 001.
3. Open `/feed` to read available posts (server RLS controls visibility). Publish with `/create` or the Feed form. Images/videos are stored in a private bucket.
4. Interact with visible posts using like, comment, save, unsave or delete owned posts. Those operations use authenticated API calls, not the old demo store.
5. Visit `/explore` and `/people` to search, follow, cancel requests, and approve pending followers if you own the receiving account.
6. Open `/stories` to upload temporary content. Expired stories are filtered, but storage cleanup requires a server job.
7. Use `/reels` to upload videos and play them with native HTML5 controls. No streaming/CDN transcoding is included.
8. Open `/messages`, create a conversation with a registered user's UUID, write messages, and receive realtime events **after enabling Realtime**.
9. Open `/events`, create an event, invite registered members, and have guests accept via their event dashboard. `/gallery` uploads private photos to accepted/authorized events.
10. Use `/invitations` to create and print a design. `/qr` can issue an expiring check-in token for an invited guest and redeem it once after RSVP acceptance.
11. Update `/profile` details; use `/saved` to revisit posts, `/insights` to inspect count metrics, `/settings` to change preferences/password, and `/help` to open a ticket.

## Responsive behavior (source review only)

- Desktop: fixed sidebar and wide main content; topbar search.
- Tablet: sidebar collapses to drawer; cards reflow.
- Mobile web: bottom navigation and stacked forms; media constrained to the viewport.
- Print: invitation design is the focus of print styles.

### Usability tests still needed

With two or more real Supabase test accounts, test sign-up confirmation, logout, blocked/private-profile access, posting with no media, every allowed media MIME type, failed uploads, 24-hour expiry, message subscriptions, guest invitation acceptance, token redemption and token replay; test viewport widths 320, 375, 768, 1024 and 1440 px with keyboard and screen reader. No completed browser testing is claimed.
