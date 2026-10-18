# Feature implementation matrix

| Feature | Status | Persistence / boundary |
|---|---|---|
| Feed, likes, saved posts, comments | Interactive demo | localStorage only |
| Post creation | Interactive demo | localStorage only |
| Explore and search | Interactive demo | localStorage |
| Stories viewer | Interactive demo | bundled still imagery |
| Reels | Visual preview | no playable videos |
| Conversations | Interactive demo | localStorage only; no delivery |
| Activity and read state | Interactive demo | localStorage |
| People and follow controls | UI preview | in-memory only |
| Events creation | Interactive demo | localStorage |
| Gallery | Bundled demo + optional Supabase integration | private backend requires setup |
| Invitation editor | Working preview and print | browser print to PDF |
| QR code generator | Functional client-side | PNG download |
| Profile, saved, insights | Demo data | localStorage |
| Settings/themes/density/motion | Interactive | localStorage |
| Supabase email auth | Integration code | external Supabase project required |
| Private media upload | Integration code | external Supabase RLS and storage required |
| Video streaming, DMs, live, payments, moderation, 2FA | Not implemented | substantial backend work |
