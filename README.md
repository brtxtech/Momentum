# Moments Studio — Connected Angular social website

Angular 18 + Supabase prototype with **separate domain code per feature**. The main navigation now routes to the **authenticated live workspace**, not the previous local-demo pages. Use **Cloud setup** to connect to your own project; the frontend never requires a service-role secret.

## Run

```bash
npm install
npm start
```

Visit http://localhost:4200/cloud, configure the Supabase URL and publishable key, sign up/sign in, then go to `/feed`, `/stories`, `/messages`, `/events`, etc. The `create` and `qr` routes have their own forms.

**Database prerequisites:** Carefully review and execute `supabase/migrations/001_social.sql`, `002_hardening.sql`, then `003_functional_security.sql` in a *new staging project*. Existing schemas may conflict. Realtime messages also require publication configuration. Do not enable production use before an adversarial RLS test, and do not paste secret keys into frontend controls.

## Feature scope

- Feed: posts/media uploads, feed pagination, likes, comments, saves, deletion.
- Explore/people: search profiles, posts and events, follow/unfollow. Private follows require owner approval; approval API exists but an owner-facing request queue still needs completion.
- Reels: upload and native browser video playback, without transcoding/recommendations.
- Stories: uploads, signed media previews, 24-hour query expiry; permanent object removal needs background cleanup.
- Messages: conversation RPC, messages, subscriptions (Supabase realtime must be configured).
- Notifications: listing/read state and trigger-created likes/comments/follows (staging SQL required).
- Events/gallery/invitations: event creation, member invites, private files with signed URLs, invitation editor/print; full RSVP and guest QR redemption is not finished.
- Create: real publish form; Profile/saved/insights/settings/help: backend-driven workspace UI.
- QR: visual QR generation only; QR is NOT authorization.

The feature directories additionally contain tested-in-principle pure transformations, validation, filtering, change history, optimistic collection management, exports and read-only repository adapters. These utilities are not a substitute for fully integrated end-to-end interactions.

## Verified vs unverified

- Files and line totals: `docs/LINE-COUNTS.md` and `docs/TREE-LINES.txt`.
- Static checks and Node.js test suite: run `npm test`, `npm run audit:structure`, `npm run audit:security`.
- Angular production build: `npm run build` (run locally; dependencies could not be fetched in the authoring environment).
- Browser cross-device tests, cloud integration tests, pentest and upload streaming: **not verified**.

This is a development build, not an Instagram-equivalent production service. Do not store sensitive private event media until policies are manually tested against real accounts.
