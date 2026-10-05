const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { randomUUID } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const BASE = process.env.E2E_BASE, API = process.env.E2E_CHAT_API;
const email = process.env.TEST_EMAIL, reader = process.env.TEST_CODE_READER;
assert.ok(BASE && API && email && reader, 'Explicit live URLs, isolated test mailbox alias and private OTP reader are required');
const readCode = () => execFileSync(reader, [email], { encoding: 'utf8' }).trim();
async function request(path, body, token = '') {
  return (await fetch(`${API}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', operationID: randomUUID(), token }, body: JSON.stringify(body) })).json();
}
(async () => {
  const password = randomUUID(), newPassword = randomUUID();
  const phoneNumber = `139${String(Date.now()).slice(-8)}`;
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.setDefaultTimeout(45000);
    await page.goto(`${BASE}/?v=email-auth-e360268#/auth/sign-in`);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForFunction(async () => (await caches.keys()).includes('99chat-email-auth-v5'));
    await page.getByRole('button', { name: '注册', exact: true }).first().click();
    await page.getByPlaceholder('请输入昵称').fill('email-live-qa');
    await page.getByPlaceholder('请输入邮箱', { exact: true }).fill(email);
    await page.getByPlaceholder('请输入手机号').fill(phoneNumber);
    await page.getByRole('button', { name: '+86', exact: true }).click();
    await page.getByRole('button', { name: '+60 马来西亚', exact: true }).click();
    const sent = page.waitForResponse(res => res.url().endsWith('/account/code/send'));
    await page.getByRole('button', { name: '获取验证码', exact: true }).click();
    const sentData = await (await sent).json(); assert.equal(sentData.errCode, 0, sentData.errMsg);
    await page.getByPlaceholder('请输入邮箱验证码').fill(readCode());
    await page.getByPlaceholder('请输入密码', { exact: true }).fill(password);
    await page.getByPlaceholder('请再次输入密码').fill(password);
    const registered = page.waitForResponse(res => res.url().endsWith('/account/register'));
    await page.getByRole('button', { name: '注册', exact: true }).last().click();
    const reg = await (await registered).json(); assert.equal(reg.errCode, 0, reg.errMsg);
    await page.waitForURL(/#\/messages$/);
    await page.screenshot({ path: '/tmp/99chat-email-live-registered.png' });
    const profile = await request('/user/contact/get', {}, reg.data.chatToken);
    assert.equal(profile.errCode, 0, profile.errMsg);
    assert.deepEqual(profile.data, { email, phoneNumber, areaCode: '+60' });
    assert.notEqual((await request('/account/login', { phoneNumber, areaCode: '+60', password, platform: 5 })).errCode, 0);
    const login = await request('/account/login', { email, password, platform: 5 });
    assert.equal(login.errCode, 0, login.errMsg); assert.equal(login.data.userID, reg.data.userID);
    assert.deepEqual((await request('/user/contact/get', {}, login.data.chatToken)).data, profile.data);
    assert.notEqual((await request('/user/contact/save', { phoneNumber, areaCode: '+60' })).errCode, 0);
    let result = await request('/account/code/send', { email, usedFor: 3 }); assert.equal(result.errCode, 0, result.errMsg);
    result = await request('/account/login', { email, verifyCode: readCode(), platform: 5 });
    assert.equal(result.errCode, 0, result.errMsg); assert.equal(result.data.userID, reg.data.userID);
    result = await request('/account/code/send', { email, usedFor: 2 }); assert.equal(result.errCode, 0, result.errMsg);
    assert.notEqual((await request('/account/password/reset', { email, verifyCode: 'wrong-code', password: newPassword })).errCode, 0);
    result = await request('/account/password/reset', { email, verifyCode: readCode(), password: newPassword }); assert.equal(result.errCode, 0, result.errMsg);
    assert.notEqual((await request('/account/login', { email, password, platform: 5 })).errCode, 0);
    result = await request('/account/login', { email, password: newPassword, platform: 5 });
    assert.equal(result.errCode, 0, result.errMsg); assert.equal(result.data.userID, reg.data.userID);
    console.log('PASS live SMTP-backed browser registration, IM SDK login, durable optional +60 phone, email password/OTP login and same-account recovery');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
