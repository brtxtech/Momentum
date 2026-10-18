import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const files=[
 'src/app/features/explore/explore.component.ts',
 'src/app/features/people/people.component.ts',
 'src/app/features/profile/profile.component.ts',
 'src/app/shared/post-card.component.ts'
];
test('literal @ handles must be escaped in Angular templates',()=>{
 for(const file of files){const source=readFileSync(file,'utf8');
  assert.doesNotMatch(source,/@\{\{|@yourstudio/,file);
 }
});
test('pending-follow service method exists and is scoped to current authenticated user',()=>{
 const source=readFileSync('src/app/core/social-api.service.ts','utf8');
 assert.match(source,/async followersPending\(\)/);
 assert.match(source,/\.eq\('following_id',userId\)/);
 assert.match(source,/\.eq\('status','pending'\)/);
});
