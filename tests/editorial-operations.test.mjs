import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const src=readFileSync('src/app/core/social-api.service.ts','utf8');
const ui=readFileSync('src/app/features/social-workspace/social-workspace.component.ts','utf8');
const sql=readFileSync('supabase/migrations/005_editorial_permissions.sql','utf8');
test('edits scope changes to current user',()=>{
 assert.match(src,/async editPost\(/);assert.match(src,/async editComment\(/);
 assert.match(src,/\.eq\('user_id',await this.uid\(\)\)/);
});
test('UI exposes real editing and read-all operations',()=>{
 for(const action of ['editPostPrompt','editCommentPrompt','readAll','deleteComment'])assert.ok(ui.includes(action));
});
test('migration closes direct conversation membership creation',()=>{
 assert.match(sql,/drop policy if exists chat_members_insert/);
 assert.match(sql,/revoke insert, update, delete on public.conversation_members/);
 assert.match(sql,/grant update\(caption\)/);assert.match(sql,/grant update\(body\)/);
});
