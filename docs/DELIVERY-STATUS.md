# Delivery status — verified scope and limitations

## Included in this iteration
- 17 original local demo routes plus a new authenticated `/social` workspace.
- Supabase-backed feed: create, list, page, like, save, comment, delete own posts; signed media URLs.
- Explore: search users/posts/events; people: follow request (private accounts require approval).
- Reels: upload video as post, HTML5 playback, seek, pause, like/comment.
- Stories: upload, list non-expired stories, play/view, delete own stories. Expiry enforced by RLS, but automatic storage garbage collection is **not** implemented.
- Messages: list conversations, create a conversation, send/list/delete own messages, subscribe to insert changes. Requires realtime publication configuration.
- Notifications: list and mark read; automatic generation triggers **not** implemented.
- Events: create/list, invite registered guests by UUID, gallery upload/list/delete, invitation design save and browser print.
- Profile: edit display name/bio/privacy, avatar upload. Saved posts, basic record-count insights, preference persistence, password change, support tickets.
- Existing local QR generator and local invitation designer remain separate from cloud. Secure event QR redemption **not implemented**.

## Security status: NOT production approved
- Two SQL migrations supplied for fresh/staging Supabase only. Not deployed or integration tested.
- Private buckets, RLS, signed URLs, approved follower logic, ownership checks, storage policies provided as code; policy tests have **not** been run against a live database.
- Storage orphan cleanup, moderation, spam throttling, email confirmation, MFA enrollment UI, abuse reporting, account deletion/export, consent and retention policies remain incomplete.
- Conversation membership creation is not atomic; failure can leave orphaned conversations.
- Profile reads reveal public profile fields to authenticated users; design requires privacy review.
- Notification generation and secure event QR redemption require trusted backend functions.
- A publishable Supabase key is appropriate for the browser; NEVER insert service-role/secret keys.

## Build status
- Dependency installation from npm was attempted but timed out in this environment. `ng build` and browser E2E could not be run. This package is **not build-verified**.
- Source file counts and tree are generated automatically in `docs/FILE-LINES.md` and `docs/TREE.txt`.
- Run `npm install`, `npm run check`, `npm test`, `npm run build` on your machine and report failures.

## Production blockers
1. Test and fix SQL migrations, grants and policies with multiple users and private accounts.
2. Build reliable notification triggers, invitation acceptance and secure QR redemption.
3. Add background video transcoding, thumbnails, CDN, quotas, virus scanning, cleanup jobs.
4. Add full accessibility audits, responsive browser E2E, performance budgets and error monitoring.
5. Implement abuse controls, moderation, legal/privacy compliance and account lifecycle.
