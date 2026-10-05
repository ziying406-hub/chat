// Creates independent accounts and persistent test messages. Requires explicit authorization.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const BASE = process.env.E2E_BASE || 'http://localhost:5199';
const CHAT = process.env.E2E_CHAT_API || 'http://localhost:10008';
const API = process.env.E2E_IM_API || 'http://localhost:10002';
const WS = process.env.E2E_WS || 'ws://localhost:10001';
const fixturePath = process.env.TEST_FIXTURES;
assert.ok(fixturePath, 'TEST_FIXTURES must point to a private fixture file');
async function request(path, body) {
  const result = await (await fetch(`${CHAT}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', operationID: randomUUID() }, body: JSON.stringify(body) })).json();
  assert.equal(result.errCode, 0, result.errMsg);
  return result.data;
}
async function fixtures() {
  if (fs.existsSync(fixturePath)) return JSON.parse(fs.readFileSync(fixturePath));
  const users = [];
  for (let i = 0; i < 2; i++) {
    const stamp = `${Date.now()}-${i}`;
    const email = process.env.TEST_CODE_READER ? `ziying406+99chatqa${stamp}@gmail.com` : `friend-delete-${stamp}@example.com`;
    const password = randomUUID(), nickname = `friend-delete-qa-${i}`;
    await request('/account/code/send', { email, usedFor: 1 });
    const verifyCode = process.env.TEST_CODE_READER ? execFileSync(process.env.TEST_CODE_READER, [email], { encoding: 'utf8' }).trim() : '666666';
    const auth = await request('/account/register', { platform: 5, autoLogin: true, verifyCode, user: { email, password, nickname } });
    users.push({ ...auth, email, password, nickname });
  }
  fs.writeFileSync(fixturePath, JSON.stringify(users), { mode: 0o600 });
  return users;
}
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
async function send(page, recvID, text) {
  const created = await call(page, 'createTextMessage', text);
  assert.equal(created.errCode, 0);
  return call(page, 'sendMessage', { recvID, groupID: '', message: created.data });
}
async function history(page, peer) {
  const conv = await call(page, 'getOneConversation', { sourceID: peer, sessionType: 1 });
  assert.equal(conv.errCode, 0);
  const result = await call(page, 'getAdvancedHistoryMessageList', { conversationID: conv.data.conversationID, count: 100, startClientMsgID: '', viewType: 0 });
  assert.equal(result.errCode, 0);
  return result.data.messageList;
}
(async () => {
  const [a, b] = await fixtures();
  const browser = await chromium.launch({ headless: true });
  const pages = [];
  try {
    for (const user of [a, b]) {
      const context = await browser.newContext();
      const page = await context.newPage();
      page.on('pageerror', error => console.error(error.message));
      page.on('requestfailed', request => console.error(new URL(request.url()).pathname, request.failure()?.errorText));
      await context.route('**/__sdk/*', route => route.fulfill({ contentType: 'application/javascript', path: `${__dirname}/node_modules/@openim/wasm-client-sdk/lib/${new URL(route.request().url()).pathname.split('/').pop()}` }));
      await page.route('**/__friend_delete_qa', route => route.fulfill({ contentType: 'text/html', body: '<html><head><base href="/__sdk/"></head><body>Independent friend deletion fixture</body></html>' }));
      await page.goto(`${BASE}/__friend_delete_qa`);
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
    }
    const [pa, pb] = pages;
    async function add() {
      const requested = await call(pa, 'addFriend', { toUserID: b.userID, reqMsg: 'Independent regression fixture' });
      assert.equal(requested.errCode, 0, requested.errMsg);
      assert.equal((await call(pb, 'acceptFriendApplication', { toUserID: a.userID, handleMsg: '' })).errCode, 0);
      await waitFor(async () => (await call(pa, 'getFriendList', false)).data.some(friend => friend.userID === b.userID));
    }
    await add();
    const warm = `friend-delete-before-${randomUUID()}`;
    assert.equal((await send(pb, a.userID, warm)).errCode, 0);
    await waitFor(async () => (await history(pa, b.userID)).some(msg => msg.textElem?.content === warm));
    assert.equal((await call(pa, 'deleteFriend', b.userID)).errCode, 0);
    await waitFor(async () => !(await call(pa, 'getFriendList', false)).data.some(friend => friend.userID === b.userID));
    assert.ok((await call(pb, 'getFriendList', false)).data.some(friend => friend.userID === a.userID), 'Deletion stays one-way');
    const blocked = `friend-delete-blocked-${randomUUID()}`;
    const refused = await send(pb, a.userID, blocked);
    console.log(`Native send after deletion: errCode=${refused.errCode}`);
    assert.equal(refused.errCode, 1303, 'Deleted sender must be rejected by the server');
    await add();
    const restored = `friend-delete-restored-${randomUUID()}`;
    assert.equal((await send(pb, a.userID, restored)).errCode, 0);
    await waitFor(async () => (await history(pa, b.userID)).some(msg => msg.textElem?.content === restored));
    assert.ok(!(await history(pa, b.userID)).some(msg => msg.textElem?.content === blocked));
    await call(pa, 'logout');
    await pa.evaluate(async ({ user, API, WS }) => window.im.login({ userID: user.userID, token: user.imToken, platformID: 5, apiAddr: API, wsAddr: WS }), { user: a, API, WS });
    const persisted = await history(pa, b.userID);
    assert.ok(persisted.some(msg => msg.textElem?.content === warm));
    assert.ok(persisted.some(msg => msg.textElem?.content === restored));
    assert.ok(!persisted.some(msg => msg.textElem?.content === blocked), 'Rejected message must stay absent after login');
    console.log('PASS native SDK delivery before deletion, immediate server rejection after deletion, one-way relation, re-add delivery, and recipient history after login');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
