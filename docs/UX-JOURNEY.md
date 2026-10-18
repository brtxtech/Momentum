# End-to-end experience map

1. **Arrival**: the visitor lands on the responsive home feed with sample stories and editorial posts; no account required for the demonstration.
2. **Discovery**: sidebar navigation on desktop, drawer on tablet, bottom bar on mobile browser; search and Explore provide paths to content.
3. **Engagement**: like, save, comment and create a post. UI state updates immediately and persists locally on that browser.
4. **Social**: view People and Messages; following is a visual preview; message composer stores local examples and does not send messages.
5. **Celebration**: create a private-labelled event, explore editorial gallery, design an invitation and generate an event QR code.
6. **Personalization**: choose theme, accent, density, motion and local privacy preference; state persists across refreshes.
7. **Account integration**: optionally configure Supabase publishable key in Settings, sign up or sign in, and access event gallery by event ID. Server RLS must independently authorize each request.
8. **Exit**: sign out of Supabase; local demo data remains until explicitly reset. Reset control requires confirmation.

## Responsive states
- Desktop ≥1251px: permanent sidebar, search, two-column feed, supporting panels.
- Tablet 621–900px: collapsible navigation drawer, adaptive grids, single-column feed.
- Phone browser ≤620px: bottom navigation, compact header, stacked feed and editors.
- 901–1250px: compact sidebar, single-column feed, two-column cards.

## Accessibility considerations
Semantic headings, accessible input labels, focus-visible outlines, button labels and responsive navigation are included. Full screen-reader and keyboard audits remain pending.
