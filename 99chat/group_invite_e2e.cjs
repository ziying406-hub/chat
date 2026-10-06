// Uses authorized independent accounts; creates persistent groups and membership records.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const BASE = process.env.E2E_BASE || 'http://localhost:5199';
const API = process.env.E2E_IM_API || 'http://localhost:10002';
const WS = process.env.E2E_WS || 'ws://localhost:10001';
const fixturePath = process.env.TEST_FIXTURES;
assert.ok(fixturePath, 'TEST_FIXTURES must point to a private fixture file');
async function call(page, method, params) {
  return page.evaluate(async ({ method, params }) => {
    try { const res = await window.im[method](params); return { errCode: res.errCode, data: res.data }; }
    catch (error) { return { errCode: error.errCode, errMsg: error.errMsg }; }
  }, { method, params });
}
async function waitFor(check) {
  const end = Date.now() + 30000;
  while (Date.now() < end) { if (await check()) return; await new Promise(resolve => setTimeout(resolve, 250)); }
  throw new Error('Timed out waiting for native SDK state');
}
(async () => {
  const [a, b] = JSON.parse(fs.readFileSync(fixturePath));
  const browser = await chromium.launch({ headless: true });
  const pages = [];
  try {
    for (const user of [a, b]) {
      const context = await browser.newContext();
      const page = await context.newPage();
      page.on('pageerror', error => console.error(error.message));
      page.on('requestfailed', request => console.error(new URL(request.url()).pathname, request.failure()?.errorText));
      await context.route('**/__sdk/*', route => route.fulfill({ contentType: 'application/javascript', path: `${__dirname}/node_modules/@openim/wasm-client-sdk/lib/${new URL(route.request().url()).pathname.split('/').pop()}` }));
      await page.route('**/__group_invite_qa', route => route.fulfill({ contentType: 'text/html', body: '<html><head><base href="/__sdk/"></head><body>Independent group invitation fixture</body></html>' }));
      await page.route('**/openIM.wasm', route => route.fulfill({path: `${__dirname}/public/openIM.wasm`, contentType: 'application/wasm'}));
      await page.goto(`${BASE}/__group_invite_qa`);
      await page.addScriptTag({ url: `${BASE}/wasm_exec.js` });
      await page.addScriptTag({ url: `${BASE}/__sdk/index.umd.js` });
      await page.evaluate(async ({ user, API, WS }) => {
        window.received = [];
        window.im = window.openImSdkWasm.getSDK({ coreWasmPath: '/openIM.wasm', sqlWasmPath: '/sql-wasm.wasm', debug: false });
        window.qaStatus = [];
        for (const name of ['OnConnectSuccess', 'OnConnectFailed', 'OnSyncServerStart', 'OnSyncServerFailed', 'OnSyncServerFinish']) {
          window.im.on(name, event => window.qaStatus.push({ name, errCode: event.errCode }));
        }
        window.im.on(window.openImSdkWasm.CbEvents.OnRecvNewMessages, event => window.received.push(...event.data));
        const synced = new Promise(resolve => window.im.on(window.openImSdkWasm.CbEvents.OnSyncServerFinish, resolve));
        await window.im.login({ userID: user.userID, token: user.imToken, platformID: 5, apiAddr: API, wsAddr: WS });
        await Promise.race([synced, new Promise((_, reject) => setTimeout(() => reject(new Error(JSON.stringify(window.qaStatus))), 60000))]);
      }, { user, API, WS });
      pages.push(page);
      console.log(`Native SDK ready: ${user.nickname}`);
    }
    const [pa, pb] = pages;
    const ui = await (await browser.newContext()).newPage();
    const recipient = await (await browser.newContext()).newPage();
    for (const [page, user] of [[ui, a], [recipient, b]]) {
      page.setDefaultTimeout(60000);
      await page.route('**/openIM.wasm', route => route.fulfill({path: `${__dirname}/public/openIM.wasm`, contentType: 'application/wasm'}));
      await page.addInitScript(auth => localStorage.setItem('99chat_session', JSON.stringify(auth)), user);
      await page.goto(`${BASE}/#/contact/requests`);
      await page.getByRole('button', {name:'扫一扫',exact:true}).waitFor();
      await page.goto(`${BASE}/#/contact/groups`);
      console.log(`UI ready: ${user.nickname}`);
    }
    for (const entry of ['admin', 'chat']) {
      const name = `group-invite-${entry}-qa-${Date.now()}`;
      const created = await call(pa, 'createGroup', { memberUserIDs: [], groupInfo: { groupName: name, groupType: 2, needVerification: 1 } });
      assert.equal(created.errCode, 0, created.errMsg);
      const groupID = created.data.groupID;
      const open = async () => {
        if (entry === 'admin') await ui.getByRole('button', {name:'邀请',exact:true}).click();
        else {
          await ui.getByRole('button', {name:'更多聊天操作',exact:true}).click();
          await ui.getByRole('button', {name:'邀请好友',exact:true}).click();
        }
      };
      await ui.goto(`${BASE}/#/${entry === 'admin' ? `messages/groups/admin/${groupID}` : `messages/session/sg_${groupID}`}`);
      await open();
      const inviteTitle = entry === 'admin' ? '邀请好友' : '邀请好友进群';
      const rejected = '邀请测试：服务端拒绝';
      await ui.route('**/group/invite_user_to_group', route => route.fulfill({headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:JSON.stringify({errCode:1002,errMsg:rejected,errDlt:''})}));
      if (entry === 'admin') ui.once('dialog', dialog => dialog.accept());
      await ui.getByRole('button', {name: entry === 'admin' ? b.nickname : `${b.nickname} ID: ${b.userID}`,exact:true}).click();
      try { await ui.getByText(rejected).waitFor({timeout:15000}); } catch(error) { console.log('Invitation UI:',(await ui.locator('body').innerText()).slice(-1000)); throw error; }
      assert.ok(!(await call(pb,'getJoinedGroupList')).data.some(group => group.groupID === groupID), 'Rejected invitation must not add recipient');
      await ui.unroute('**/group/invite_user_to_group');
      if (entry === 'admin') ui.once('dialog', dialog => dialog.accept());
      await ui.getByRole('button', {name: entry === 'admin' ? b.nickname : `${b.nickname} ID: ${b.userID}`,exact:true}).click();
      await ui.getByText(inviteTitle,{exact:true}).waitFor({state:'hidden'});
      await ui.getByText('好友已加入群组',{exact:true}).waitFor();
      await waitFor(async () => (await call(pb,'getJoinedGroupList')).data.some(group => group.groupID === groupID));
      await recipient.getByText(name,{exact:true}).waitFor();
      await recipient.reload();
      await recipient.getByText(name,{exact:true}).waitFor();
      const members = await call(pa,'getGroupMemberList',{groupID,filter:0,offset:0,count:100});
      assert.equal(members.data.length,2);
      await open();
      await ui.getByText('暂无可邀请的好友',{exact:true}).waitFor();
      assert.equal(await ui.getByRole('button', {name:b.nickname,exact:true}).count(),0);
      if (entry === 'admin') await ui.getByRole('button',{name:'取消',exact:true}).click();
      else await ui.goto(`${BASE}/#/contact/groups`);
      console.log(`PASS ${entry}: server rejection shown, retry joins recipient in approval-enabled group, live recipient UI and reload, duplicate excluded`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
