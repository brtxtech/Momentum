import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const ui=path.join(root,'src/app/ui/extra');
const views=['messages','notifications','people','events','gallery','invitations','qr','profile','saved','insights','settings','help'];
for(const view of views){
  test(`view ${view}: TS and HTML files`,()=>{
    const ts=path.join(ui,`${view}-view.component.ts`);
    const html=path.join(ui,`${view}-view.component.html`);
    assert(existsSync(ts),`missing ${ts}`);
    assert(existsSync(html),`missing ${html}`);
    const source=readFileSync(ts,'utf8');
    const template=readFileSync(html,'utf8');
    assert.match(source,/standalone:\s*true/);
    assert.match(source,/@Output\(\)/);
    assert.match(source,/@Input\(\)/);
    assert(source.includes(`templateUrl: './${view}-view.component.html'`) || source.includes(`templateUrl:'./${view}-view.component.html'`));
    assert(template.length>300,`${view} template too short`);
    assert(!template.includes('onclick='),'inline HTML handler not allowed');
  });
}
test('Messages uses person-name search, not direct recipient UUID entry',()=>{
  const html=readFileSync(path.join(ui,'messages-view.component.html'),'utf8');
  assert.match(html,/Search by username or name/);
  assert.match(html,/conversationCreate|chooseRecipient/);
  assert.doesNotMatch(html,/Recipient user UUID/i);
  assert(html.includes('(ngSubmit)="send()"'));
});
test('Activity has filter, request actions and read receipts',()=>{
  const html=readFileSync(path.join(ui,'notifications-view.component.html'),'utf8');
  assert.match(html,/followApprove/);
  assert.match(html,/followReject/);
  assert.match(html,/markAllRead/);
});
test('No test/demo personal data in TypeScript view models',()=>{
  const models=readFileSync(path.join(ui,'view-models.ts'),'utf8');
  assert.doesNotMatch(models,/@example\.com|fake users|demo posts/i);
});
test('Shared design tokens support dark mode, mobile and reduced motion',()=>{
  const css=readFileSync(path.join(ui,'moments-extra-views.css'),'utf8');
  for (const marker of [":root", "[data-theme='dark']",'@media(max-width:640px)','prefers-reduced-motion:reduce','.mx-inbox','.mx-invite-card','.mx-qr-preview-card','.mx-settings-panel','.mx-help-hero']) assert(css.includes(marker),marker);
});
test('All 12 components exported through index',()=>{
  const index=readFileSync(path.join(ui,'index.ts'),'utf8');
  for(const view of views)assert(index.includes(`./${view}-view.component`),view);
});
