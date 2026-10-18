import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const features=['profile','saved','insights','settings','help'];
for(const f of features){
 test(`account: /${f} is a dedicated Angular page`,()=>{
  const routes=read('src/app/app.routes.ts');
  assert.match(routes,new RegExp(`path: '${f}', component: ${f[0].toUpperCase()+f.slice(1)}Component`));
  assert.ok(existsSync(new URL(`../src/app/features/${f}/${f}.component.html`,import.meta.url)));
  assert.match(read(`src/app/features/${f}/${f}.component.ts`),/SocialApi/);
 });
}
test('account: private records and media are queried by authenticated identity',()=>{
 const api=read('src/app/core/social-api.service.ts');
 for(const method of ['ownPosts','accountCounts','savedPage','updateAccountProfile','saveAccountPreferences','recentSupportTickets'])assert.ok(api.includes(`async ${method}(`));
 assert.match(api,/\.eq\('user_id',await this\.uid\(\)\)/);
 assert.match(api,/\.from\('saved_posts'\)/);
 assert.match(api,/createSignedUrl/);
});
test('account: preference fields have a migration',()=>{
 const sql=read('supabase/migrations/007_account_preferences.sql');
 assert.match(sql,/language text/);assert.match(sql,/email_notifications boolean/);
 assert.match(sql,/message_notifications boolean/);
});
test('account: no demo store data in account screen',()=>{
 for(const f of features){const ts=read(`src/app/features/${f}/${f}.component.ts`);assert.doesNotMatch(ts,/StudioStore|demo-data/);}
});
