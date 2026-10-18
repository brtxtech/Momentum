# QA report

This report distinguishes source-level checks from execution checks. See `docs/VERIFICATION.json` for machine-readable results generated at packaging time.

## Test scenarios to run manually
- Desktop at 1440×900: sidebar navigation, search, feed, invitation preview.
- Tablet at 768×1024: drawer open/close, gallery grid, messaging.
- Mobile at 390×844: bottom navigation, post actions, QR download, settings.
- Keyboard-only: navigate links, activate buttons, enter comments and forms, verify visible focus.
- Create a post, refresh, verify persistence; save a post, open Saved, verify persistence.
- Create an event, refresh, verify persistence.
- Change theme and accent, refresh, verify persistence.
- Generate QR and download PNG; print invitation to PDF.
- Supabase: reject invalid project URL and secret key; test login failure, unauthorized event read and unauthorized upload on a deployed test backend.

**Do not interpret presence of test files as proof of a successful browser or backend test.**
