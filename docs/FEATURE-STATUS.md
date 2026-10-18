# Feature-by-feature delivery status

The Angular navigation now opens the authenticated live workspace for 15 social sections. Create and QR have dedicated connected forms. Operations require a configured Supabase project and migrations. **All statuses below refer to code presence, not a successful live integration test.**

| Feature | Available UI / API functionality | Known limitation |
| --- | --- | --- |
| Feed | Post creation, upload, likes, comments, bookmarking, delete, server pagination | No ranking algorithm, moderation, infinite scroll calibration or cloud QA |
| Explore | Search profiles, posts, events | One-field backend filtering; no full-text indexing or search ranking |
| Reels | MP4/WebM upload, filtered server query, HTML5 play/pause/seek and post reactions | No adaptive streaming, transcoding, thumbnails or recommended ranking |
| Stories | Upload, signed preview, delete metadata, 24-hour visibility cutoff | No scheduled storage cleanup or auto-advance player |
| Messages | Atomic conversation RPC, send, list, delete-own via migration 004, realtime subscription hooks | Realtime publication setup and delivery/read receipts missing |
| Notifications | Read/mark read; migration 003 triggers likes/comments/follow requests | Not all event/message notification types, no push notifications |
| People | Search, follow/unfollow, pending request list and owner approval | Blocking/reporting and spam control not backend implemented |
| Events | Create public/private events, guest invitations, RSVP acceptance RPC | Complex event-role administration and calendars incomplete |
| Gallery | Upload, signed image access, download, delete authorized photos | No image processing, bulk management or asset virus scan |
| Invitations | Create/save/edit JSON designs, live preview, print CSS | Limited template customization, no email delivery |
| QR | Link QR/PNG, random guest token, secure hash + one-time redemption RPC and QR image scan when supported | Requires migration 004 and accepted guest; browser BarcodeDetector support varies |
| Create | Signed-in post publishing with file preview | No resumable uploads or server compression |
| Profile | Display name, bio, avatar upload, privacy setting | Avatar processing and advanced profile editor missing |
| Saved | List and toggle persistent bookmarks | No nested bookmark folders |
| Insights | Actual counts of accessible posts, followers and events | No impression tracking or creator monetization |
| Settings | User preferences stored in database, applied theme, motion reduction, password change, sign-out | No complete MFA enrollment UI; password changes need reauthentication policy |
| Help | Search static articles and submit/list support tickets | No staff backoffice, routing, or SLA automation |

All 17 feature directories have 1,000+ physical TypeScript lines. Those include **domain models plus reusable transformation, collections, access hints, async queues and repository readers**. Shared logic is similar across features by design; that is not evidence that every advanced user journey is integrated or production-ready.
