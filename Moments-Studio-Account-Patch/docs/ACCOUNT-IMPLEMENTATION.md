# Moments Studio — Account implementation audit

Scope: `/profile`, `/saved`, `/insights`, `/settings`, `/help`, applied to the previously supplied **Moments-Studio-Reels-Implemented** Angular repository.

## New or updated behaviors

- Profile: authenticated record, own post grid with paginated SQL queries, photo/Reels tab, an authenticated media detail dialog with post deletion, private signed media URLs (15-minute expiry), editable username/display name/biography, avatar upload with type/size validation, database-derived follower counts.
- Saved: authenticated saved items with matching post metadata and short-lived signed media, client-side search/type filter over loaded records, paginated fetch, **delete-only** unsave action. Other users cannot query saved items if the supplied RLS policies are deployed.
- Insights: exact count-based post/follower/following/bookmark/event cards and 7/14/30-day publication histogram from timestamp-scoped database counts. No fake engagement values.
- Settings: backend-saved privacy setting, appearance, reduced motion, language preference, notification preferences, password change, and logout. Language preference is stored but translations are NOT implemented. Email or push delivery is NOT implemented.
- Help: searchable local educational articles and a real Supabase support-ticket form and recent ticket subjects. FAQ does not require login; requests do. Response workflow is NOT implemented.
- App routes: dedicated feature components replace the five monolithic social-workspace routes; 4 protected by a Supabase session check guard. Backend authorization remains mandatory.
- SQL: additive migration `007_account_preferences.sql`. Must be reviewed and applied AFTER prior migrations to a staging database; earlier migration `002_hardening.sql` creates `user_preferences` with owner-only RLS.

## Integration instructions

1. Extract the full ZIP (`Moments-Studio-Account-Integrated.zip`) into a new folder, or apply the separate Account Patch ZIP to a copy of the matching Reels-Implemented repository. Do NOT copy only templates; core services, routing and SQL must be deployed too.
2. From the extracted project root: `npm install`, `npm test`, `npm run build`, `npm start`.
3. Open `http://localhost:4200/cloud`, configure an existing Supabase project, register/sign in, and deploy migrations **001–007 in order** to an empty *staging* project. Never paste production secrets into frontend config.
4. Open `/profile`, `/saved`, `/insights`, `/settings`, `/help`.
5. Test with two real accounts to validate that private profiles and saved posts are inaccessible to unauthorized users.

## QA performed in packaging environment

| Check | Result |
|---|---|
| Node source tests (`npm test`) | **69/69 passed** |
| Source structure audit | Passed |
| Static security presence audit | Passed (**not** a security penetration test) |
| TypeScript transpile/syntax checks on changed TS | Passed |
| Angular production build | **NOT VERIFIED** (npm dependencies inaccessible in this environment) |
| Browser desktop/mobile visual tests | **NOT PERFORMED** |
| Supabase backend connectivity and staging migration | **NOT PERFORMED** |
| RLS tests with two identities | **NOT PERFORMED** |
| Security certification | **NOT APPROVED** |

## Important limitations and safe defaults

- New setting fields are stored only after migration 007; message/email notification delivery requires separate backend workers or services.
- There is no self-service account deletion or full data export workflow; these require verified server-side administration.
- Avatar and post signed URLs expire after 15 minutes. Reload pages to renew. Video streaming and thumbnail generation are separate engineering tasks.
- The existing social platform code remains a development prototype and has not been penetration-tested. Do not upload sensitive private event data until storage policies and RLS are independently verified.
- Some feed/media links navigate to a listing page rather than a dedicated post detail route; fine-grained per-post navigation is still incomplete.
- Account stats show persistent database values; chart dates are UTC. Insights does not claim reach, impressions, or watch time.
- `npm audit` on a previously installed project reported dependency vulnerabilities; run `npm audit --omit=dev`, review transitive vulnerabilities and upgrade with Angular compatibility before production deployment.
