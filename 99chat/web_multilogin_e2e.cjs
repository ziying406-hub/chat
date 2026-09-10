const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const BASE = process.env.E2E_BASE;
assert.ok(BASE && process.env.TEST_VERIFY_CODE, 'Set E2E_BASE and TEST_VERIFY_CODE');
async function post(route, body, token) {
  const response = await fetch(`${BASE}${route}`, { method: 'POST', headers: {
    'Content-Type': 'application/json', operationID: randomUUID(), ...(token ? { token } : {}),
  }, body: JSON.stringify(body) });
  return response.json();
}
async function register(index) {
  const user = { phoneNumber: `139${String(Date.now()).slice(-7)}${index}`, password: randomUUID(), nickname: `qa-multiweb-${Date.now()}-${index}` };
  const result = await post('/chat/account/register', { verifyCode: process.env.TEST_VERIFY_CODE, platform: 5, autoLogin: true, user: { ...user, areaCode: '+86' } });
  assert.equal(result.errCode, 0);
  return { ...user, ...result.data };
}
async function login(page, user) {
  await page.goto(`${BASE}/#/auth/sign-in`);
  await page.getByPlaceholder('请输入手机号').fill(user.phoneNumber);
  await page.getByPlaceholder('请输入密码').fill(user.password);
  const response = page.waitForResponse(r => r.url().endsWith('/account/login'));
  await page.getByRole('button', { name: '登录', exact: true }).click();
  const result = await (await response).json();
  assert.equal(result.errCode, 0);
  await page.waitForURL(/#\/messages/, { timeout: 60000 });
  return result.data.imToken;
}
async function validToken(user, token) {
  return (await post('/api/user/get_users_info', { userIDs: [user.userID] }, token)).errCode === 0;
}
async function send(page, text) {
  await page.getByPlaceholder('输入消息...').fill(text);
  await page.getByPlaceholder('输入消息...').press('Enter');
}
async function received(page, text) {
  await page.locator('.break-words').filter({ hasText: text }).waitFor();
}
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const user = await register(0), peer = await register(1);
    const pages = await Promise.all([0, 1, 2].map(async () => {
      const page = await (await browser.newContext({ permissions: ['notifications'] })).newPage();
      page.setDefaultTimeout(30000);
      return page;
    }));
    const [a, b, p] = pages;
    const tokenA = await login(a, user);
    const tokenB = await login(b, user);
    assert.equal(await validToken(user, tokenA), true, 'second Web login must preserve first Web token');
    assert.equal(await validToken(user, tokenB), true);
    console.log('PASS two independent Web login tokens remain valid');
    // Exercise every existing non-Web policy-1 platform through real login/API auth.
    for (const platform of [1, 2, 3, 4]) {
      const params = { areaCode: '+86', phoneNumber: user.phoneNumber, password: user.password, platform };
      const first = await post('/chat/account/login', params);
      // Upstream JWT claims have second precision; create a distinct second login token.
      await new Promise(resolve => setTimeout(resolve, 1100));
      const second = await post('/chat/account/login', params);
      assert.equal(first.errCode, 0); assert.equal(second.errCode, 0);
      assert.equal(await validToken(user, first.data.imToken), false, `platform ${platform} old token must be kicked`);
      assert.equal(await validToken(user, second.data.imToken), true);
      assert.equal(await validToken(user, tokenA), true, 'non-Web login must not trim Web tokens');
      assert.equal(await validToken(user, tokenB), true);
    }
    console.log('PASS Android/iOS/Windows/Mac still enforce single-instance tokens');
    await login(p, peer);
    await a.goto(`${BASE}/#/contact/requests`);
    await a.getByText('扫一扫', { exact: true }).click();
    await a.getByPlaceholder('输入用户 ID').fill(peer.userID);
    await a.getByRole('button', { name: '发送申请', exact: true }).click();
    await a.getByText('好友申请已发送，等待对方确认', { exact: true }).waitFor();
    await p.goto(`${BASE}/#/contact/requests`);
    await p.getByRole('button', { name: `同意 ${user.nickname}`, exact: true }).click();
    for (const page of [a, b]) {
      await page.goto(`${BASE}/#/contact/user/${peer.userID}`);
      await page.getByRole('button', { name: '发消息', exact: true }).click();
    }
    await p.goto(`${BASE}/#/contact/user/${user.userID}`);
    await p.getByRole('button', { name: '发消息', exact: true }).click();
    const stamp = Date.now();
    await send(a, `web-a-${stamp}`); await received(p, `web-a-${stamp}`);
    await send(b, `web-b-${stamp}`); await received(p, `web-b-${stamp}`);
    await send(p, `both-${stamp}`);
    await Promise.all([received(a, `both-${stamp}`), received(b, `both-${stamp}`)]);
    await a.reload(); await received(a, `both-${stamp}`);
    await send(p, `reload-${stamp}`);
    await Promise.all([received(a, `reload-${stamp}`), received(b, `reload-${stamp}`)]);
    console.log('PASS both Web sessions send/receive and survive reload without kicking');
    await a.goto(`${BASE}/#/settings/profile`);
    await a.getByRole('button', { name: '退出', exact: true }).click();
    await a.waitForURL(/#\/auth\/sign-in/);
    await send(p, `after-logout-${stamp}`); await received(b, `after-logout-${stamp}`);
    await send(b, `still-online-${stamp}`); await received(p, `still-online-${stamp}`);
    console.log('PASS logout of one Web session does not disconnect the other');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
