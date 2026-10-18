# Functional status and limitations

This release has two distinct experiences. **Local demo routes** retain browser-only data; **Cloud setup**, **Cloud feed**, and **Cloud social tools** invoke actual Supabase tables. A successful backend workflow requires running the migration, a working Supabase project, and two registered accounts for access-control testing.

| Feature | Actual shipped behavior | Missing / unverified |
|---|---|---|
| Feed | Cloud create, upload image/video, delete own, like, save, comment, paginate | End-to-end server test, automatic refresh, production video processing |
| Explore | Cloud filtered text search of profiles, posts, events | Search ranking and full-text index |
| Reels | Video upload via Cloud feed; native HTML video playback with pause and seek | Dedicated immersive reels feed and encoding pipeline |
| Stories | Upload and list with 24h database expiry filter | Polished sequential viewer of cloud stories; cleanup job |
| Messages | Persistent send/read; subscription function | Conversation creation UI and realtime publication configuration |
| Notifications | List and mark read | Automated server-side notification triggers |
| People | Search, follow/unfollow, private profile schema | Full relationship UI and follow request approval |
| Events | Backend create and invite APIs; local event UI | Dedicated cloud event UI and RSVP flow |
| Gallery | Event media upload API; local gallery | Complete cloud media management UI |
| Invitations | Local editor and print; backend JSON save API | Cloud invitation editor integration and PDF rendering service |
| QR | Local QR generation and PNG export | Secure server-side QR redemption and camera scanning |
| Create | Local post editor; cloud media publisher | Unified cloud composer with progress events |
| Profile | Backend fetch/update API; local profile UI | Cloud profile editing UI |
| Saved | Cloud save/unsave API; local saved view | Cloud saved-list page |
| Insights | Backend counts of own posts/followers/events | Engagement and retention analytics |
| Settings | Persistent local preferences; cloud sign-in | Account recovery/2FA settings integration |
| Help | Local help content; cloud support ticket API | Staff ticket dashboard |

## Security concerns that block production

1. The SQL migration has **not** been applied or tested against a real Supabase instance. Review RLS and storage policies before using real data.
2. Private profiles have no follow-approval workflow; following a private profile can currently expose its content. **Do not use this migration for sensitive private content.**
3. Event membership invitation acceptance and event media upload authorization need server-side role validation.
4. Storage uploads can be orphaned before post metadata is created. Scheduled cleanup is required.
5. Realtime requires publication configuration and RLS validation with multiple accounts.
6. Video transcoding, content moderation, virus scanning, abuse controls, rate limiting, GDPR deletion, and email delivery are not implemented.
7. QR codes are shareable visual codes, **not** access-control credentials.
8. Local demo data in localStorage is not secure or synchronized.

## Reproduction

- `npm install`
- `npm run check`
- `npm test`
- `npm run build`
- `npm start`
- Open `/cloud` to configure; `/cloud-feed` for persistent posts; `/cloud-social` for server-side tools.
