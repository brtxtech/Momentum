import fs from 'node:fs';
const migrations=['001_social.sql','002_hardening.sql','003_functional_security.sql'].map(f=>fs.readFileSync('supabase/migrations/'+f,'utf8'));
for(const tab of ['posts','messages','event_media','stories','event_members','invitations','follows'])if(!migrations.some(s=>s.includes(`public.${tab}`)))throw Error('Missing table '+tab);
const api=fs.readFileSync('src/app/core/social-api.service.ts','utf8');if(api.includes('sb_secret_')&&!api.includes("startsWith('sb_secret_')"))throw Error('Possible secret key');
for(const fn of ['start_conversation','notify_post_interaction','notify_follow_request','prevent_follow_identity_change'])if(!migrations.some(s=>s.includes(fn)))throw Error('Missing '+fn);
console.log('PASS: static presence checks only; real RLS security tests are NOT performed.');
