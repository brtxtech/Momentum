# Moments Studio — Premium Instagram-inspired additional views

**Purpose:** Visual and interaction components for the existing Angular 18 website. These are not a second app. The routes and Supabase backend stay in your main Moments Studio repository.

## Twelve views

| Existing route | Standalone Angular component | Visual concept |
| --- | --- | --- |
| `/messages` | `MessagesPremiumComponent` | Two-pane inbox, recipient username search, conversation bubbles and bottom composer |
| `/notifications` | `ActivityPremiumComponent` | Activity side-panel, filter chips, unread indicators, date groups and follow-request actions |
| `/people` | `PeoplePremiumComponent` | Searchable directory, creator cards, suggestions, followers and pending requests |
| `/events` | `EventsPremiumComponent` | Editorial celebration hero, event cards, RSVP, create-event form |
| `/gallery` | `GalleryPremiumComponent` | Masonry-like responsive grid, event chips, photo/video filters, selection and media actions |
| `/invitations` | `InvitationsPremiumComponent` | Six themed invitation designs, live editing and saved designs |
| `/qr` | `QrPremiumComponent` | Two-column QR generator, preview, scanner trigger, token validation and QR history |
| `/profile` | `ProfilePremiumComponent` | Instagram-like avatar, stats, Highlights circles and 3-column content grid |
| `/saved` | `SavedPremiumComponent` | Private collections and saved-post thumbnails |
| `/insights` | `InsightsPremiumComponent` | KPI cards, date filters, bar chart and top content |
| `/settings` | `SettingsPremiumComponent` | Profile, privacy, notifications, theme, language and account-security panels |
| `/help` | `HelpPremiumComponent` | Searchable help center, category cards, FAQ accordion and support form |

The selectors are listed in each component file. All views use **real typed @Input data contracts and @Output action events**. They never show fake users/posts, and never claim a button succeeded without the parent responding.

## Install into the existing Angular project

1. Copy the entire `src/app/ui/extra/` directory into your existing Angular project's `src/app/ui/extra/`.
2. Add once to `src/styles.css`:

   ```css
   @import './app/ui/extra/moments-extra-views.css';
   ```

3. Import each standalone component in its route-level page or wrapper and supply authorized data from your `SocialApi`. Handle emitted events by calling your backend service, then refresh the component inputs.
4. For `/messages` an **actual Supabase binding example** is at `examples/messages-page.example.ts`. Copy it to `src/app/features/messages/messages-premium-page.component.ts` and update the route to that component **after checking your database's conversation schema**. Do not replace other routes until they have equivalent adapters.
5. Run `npm install`, `npm run build`, `npm start`; open `http://localhost:4200/messages` etc.

### Example: make Messages route use the new design

After adding the files and the example adapter:

```ts
import { MessagesPremiumPageComponent } from './features/messages/messages-premium-page.component';
// In existing app.routes.ts, change ONLY the messages route to:
{ path: 'messages', component: MessagesPremiumPageComponent, title: 'Messages | Moments Studio' }
```

**Crucial:** Routing directly to `<ms-messages-premium>` without binding inputs and outputs displays an empty, interactive shell, but will NOT fetch or persist conversations. The adapter is the actual connection. For other routes, leave the existing `SocialWorkspaceComponent` pages in place until you write adapters; using only an unbound visual component would regress functionality.

### Example: generic parent binding

```ts
@Component({
  standalone: true,
  imports: [PeoplePremiumComponent],
  template: `<ms-people-premium [people]="profiles" [busy]="busy"
               (peopleSearch)="searchUsers($event)" (followToggle)="toggleFollow($event)" />`
})
export class PeoplePage {
  // Populate profiles from SocialApi.explore(query,'profiles') and use SocialApi.follow(id).
  // Apply the same pattern to each view with its typed action events.
}
```

## Design tokens and responsive layout

- Main canvas: `#ffffff`, primary text `#151820`, hairline borders `#e7e9ee`.
- Social blue: `#3857f6` for calls to action; warm gold `#b28a56` as Moments Studio's premium accent.
- Desktop: two-panel inbox, three-column People / Events, four-column Gallery and Saved; desktop Settings sidebar.
- Tablet: denser cards, compact inbox and adaptive grids.
- Mobile: inbox-to-chat navigation, single-column events, 3-column photo grid, stacking QR and Invitation editors; `env(safe-area-inset-bottom)` padding.
- Dark mode: automatically follows your existing `data-theme='dark'` setting.
- Motion accessibility: reduced animations for `prefers-reduced-motion` and `data-motion='reduced'`.

See `docs/DESIGN-SPEC.md` for detailed per-view interactions.

## Security and delivery limitations

- UI `@Output` is not an authorization barrier. Maintain Supabase RLS and private Storage policies.
- Direct messages may only be retrieved by conversation participants; the existing backend must enforce this.
- The example Messages adapter uses **real** SocialApi reads, writes and Realtime but your current `conversations()` method does not return recipient names/avatars. Add a membership/profile join with RLS for true Instagram-like conversation previews.
- Other views remain **presentation + events** until you connect their data/actions. QR camera/scanning and SVG/PNG generation are **not** implemented by these UI components (the host provides those through existing QR functionality).
- Email/push settings, moderation, account deletion, MFA, insights aggregation and invitations require backend endpoints and database migrations not included here.
- No deployment of Supabase policies, credentials or privileged keys.

## Checks provided

`node --test tests/ui-structure.test.mjs` checks file presence, component selectors, and design hook coverage.
`tsc -p tests/tsconfig.syntax.json` checks standalone TypeScript syntax against narrow Angular type shims; it is **not** an Angular compiler build.

Full Angular template compilation and interactive browser QA require installing Angular dependencies within your actual project. The npm registry was not reachable in the generation environment, so no Angular build success is claimed.
