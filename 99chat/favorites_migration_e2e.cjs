const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const BASE = process.env.E2E_BASE;
assert.ok(BASE && process.env.TEST_VERIFY_CODE, 'Set E2E_BASE and TEST_VERIFY_CODE');
async function api(path, body, token) {
  const response = await fetch(`${BASE}/chat/${path}`, { method: 'POST',
    headers: { 'Content-Type': 'application/json', operationID: randomUUID(), ...(token ? { token } : {}) }, body: JSON.stringify(body) });
  const result = await response.json();
  assert.equal(result.errCode, 0, `${path}: ${result.errMsg}`);
  return result.data;
}
(async () => {
  const phoneNumber = `139${String(Date.now()).slice(-8)}`;
  const password = randomUUID();
  await api('account/register', { verifyCode: process.env.TEST_VERIFY_CODE, platform: 5, autoLogin: true,
    user: { areaCode: '+86', phoneNumber, password, nickname: 'qa-favorite-migration' } });
  const browser = await chromium.launch({ headless: true });
  let auth;
  const original = { clientMsgID: randomUUID(), content: 'server canonical', kind: 'text', contentType: 101, time: Date.now() };
  const legacy = { clientMsgID: randomUUID(), content: `legacy-${Date.now()}`, kind: 'text', contentType: 101, time: Date.now() };
  try {
    const context = await browser.newContext({ permissions: ['notifications'] });
    const page = await context.newPage();
    page.setDefaultTimeout(20000);
    await page.goto(`${BASE}/#/auth/sign-in`);
    await page.getByPlaceholder('请输入手机号').fill(phoneNumber);
    await page.getByPlaceholder('请输入密码').fill(password);
    const login = page.waitForResponse(response => response.url().endsWith('/account/login'));
    await page.getByRole('button', { name: '登录', exact: true }).click();
    auth = (await (await login).json()).data;
    await page.waitForURL(/#\/messages/, { timeout: 60000 });
    await api('user/favorites/save', original, auth.chatToken);
    const local = [legacy, legacy, { ...original, content: 'stale local must not overwrite server' }];
    await page.evaluate(({ userID, local }) => {
      localStorage.setItem(`99chat_favorites_${userID}`, JSON.stringify(local));
      localStorage.setItem('99chat_favorites_unrelated-user', JSON.stringify([{ clientMsgID: 'other-user', content: 'private other account' }]));
    }, { userID: auth.userID, local });
    await page.goto(`${BASE}/#/settings/collections`);
    await page.getByRole('button', { name: '同步本机收藏', exact: true }).click();
    await page.getByText('本机收藏已同步', { exact: true }).waitFor();
    const items = await api('user/favorites/list', {}, auth.chatToken);
    assert.equal(items.length, 2);
    assert.equal(items.find(item => item.clientMsgID === original.clientMsgID).content, original.content);
    assert.equal(items.find(item => item.clientMsgID === legacy.clientMsgID).content, legacy.content);
    assert.equal(await page.evaluate(userID => JSON.parse(localStorage.getItem(`99chat_favorites_${userID}`)).length, auth.userID), 3, 'original local data is retained');
    await page.reload();
    await page.getByText(legacy.content, { exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: '同步本机收藏', exact: true }).count(), 0);
    console.log('PASS legacy migration: real server persistence, deduplication, server wins, account scope and original local retention');
  } finally {
    try {
      if (auth) for (const item of [original, legacy]) await api('user/favorites/delete', { clientMsgID: item.clientMsgID }, auth.chatToken);
    } finally { await browser.close(); }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
