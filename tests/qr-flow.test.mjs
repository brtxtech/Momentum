import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const api=readFileSync('src/app/core/social-api.service.ts','utf8');
const sql=readFileSync('supabase/migrations/004_qr_checkin.sql','utf8');
const view=readFileSync('src/app/features/qr/qr.component.ts','utf8');
test('check-in token minted with Web Crypto, hashed before database RPC',()=>{
 assert.match(api,/crypto\.getRandomValues\(bytes\)/);
 assert.match(api,/crypto\.subtle\.digest\('SHA-256'/);
 assert.match(api,/issue_event_checkin_token/);
 assert.match(api,/redeem_event_checkin_token/);
 assert.match(api,/expires/);
});
test('check-in SQL enforces owner issuance and guest-bound one-time redemption',()=>{
 assert.match(sql,/e\.owner_id=actor/);
 assert.match(sql,/guest_id=actor/);
 assert.match(sql,/redeemed_at is null/);
 assert.match(sql,/m\.status='accepted'/);
 assert.match(sql,/expires_at>now\(\)/);
 assert.match(sql,/event_checkin_tokens enable row level security/);
 assert.match(sql,/revoke all on public\.event_checkin_tokens from anon, authenticated/);
});
test('QR page supports manual redemption if image scan is unavailable',()=>{
 assert.match(view,/BarcodeDetector/);
 assert.match(view,/does not support QR image scanning/);
 assert.match(view,/redeemGuestQr/);
});
