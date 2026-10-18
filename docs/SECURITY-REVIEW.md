# Security review — scope and limitations

**Status: architecture/source review only. Not a penetration test or security certification.**

## Included controls
- The browser client accepts only `https://*.supabase.co` project URLs and rejects obvious `sb_secret_` keys.
- User-generated captions and comments are rendered with Angular interpolation, which escapes HTML by default. No unsafe `innerHTML` is used in feature views.
- Local inputs have length limits; private upload client validation restricts file MIME type and size (10 MB). These are **not server-side protections**.
- Private event media is retrieved using short-lived (60-second) signed URLs from a private bucket, conditional on Supabase authorization.
- No service-role key is embedded in source code.
- User-visible QR codes are not treated as authentication.

## Critical preproduction work
1. Deploy and verify Supabase row-level security for every user-owned table; prevent cross-event reads and writes.
2. Enforce storage object ownership, membership and path constraints in database/storage policies; do not rely on client checks.
3. Validate actual file signatures and sizes server-side; consider malware scanning, rate limits, content moderation and image metadata stripping.
4. Add abuse prevention, email verification, recovery and optional MFA flows; build server-authorized guest invitations.
5. Configure CSP, secure headers, audit logging, error monitoring and secret management at the hosting layer.
6. Add automated negative authorization tests using two unrelated accounts and event memberships.
7. Avoid using localStorage for sensitive private content; this demo stores only mock social data.
8. Review session persistence defaults and consider additional protections for shared devices.

## Not verified
- No live Supabase project access or RLS test executed.
- No automated vulnerability scanner or external penetration test executed.
- No claim of GDPR compliance or complete privacy protection.
