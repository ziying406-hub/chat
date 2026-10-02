const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { randomUUID } = require('node:crypto');

// Only a new local fixture account is reset. Never targets a customer's account.
const BASE = 'http://127.0.0.1:5199';
const API = 'http://localhost:10008';
const code = process.env.TEST_VERIFY_CODE;
assert.ok(code, 'Set TEST_VERIFY_CODE to the local OpenIM test verification code');
async function request(path, body) {
  const response = await fetch(`${API}${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', operationID: randomUUID() },
    body: JSON.stringify(body),
  });
  return response.json();
}

(async () => {
  const phoneNumber = `139${String(Date.now()).slice(-8)}`;
  const password = randomUUID();
  const newPassword = randomUUID();
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.clock.install();
    page.setDefaultTimeout(5000);
    const requests = [];
    page.on('request', req => {
      if (req.url().startsWith(API)) requests.push({ url: req.url(), body: req.postDataJSON() });
    });
    await page.goto(`${BASE}/#/auth/sign-in`);
    await page.getByRole('link', { name: '忘记密码？' }).click();
    await page.getByRole('heading', { name: '重置密码', exact: true }).waitFor();
    assert.ok(page.url().endsWith('#/auth/forgot-password'), 'Forgot password must stay on its public route');
    await page.reload();
    await page.getByRole('heading', { name: '重置密码', exact: true }).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'Recovery form must fit a phone viewport');
    const registration = await request('/account/register', {
      verifyCode: code, platform: 5, autoLogin: true,
      user: { areaCode: '+86', phoneNumber, password, nickname: 'password-reset-qa' },
    });
    assert.equal(registration.errCode, 0, registration.errMsg);
    await page.getByPlaceholder('请输入手机号').fill(phoneNumber);
    const sent = page.waitForResponse(res => res.url().endsWith('/account/code/send'));
    await page.getByRole('button', { name: '获取验证码', exact: true }).click();
    assert.equal((await (await sent).json()).errCode, 0, 'Reset code must be sent for an existing account');
    assert.equal(requests.at(-1).body.usedFor, 2, 'Code must use OpenIM password recovery purpose');
    const resend = page.getByRole('button', { name: /秒后重发/ });
    assert.equal(await resend.isDisabled(), true);
    for (let second = 0; second < 60; second++) await page.clock.runFor(1000);
    assert.equal(await page.getByRole('button', { name: '获取验证码', exact: true }).isEnabled(), true, 'Resend must become available after the countdown');
    await page.screenshot({ path: '/tmp/99chat-password-recovery.png' });
    await page.getByPlaceholder('请输入验证码').fill('wrong-code');
    await page.getByPlaceholder('请输入新密码', { exact: true }).fill('short');
    await page.getByPlaceholder('请再次输入新密码').fill('short');
    await page.getByRole('button', { name: '重置密码', exact: true }).click();
    await page.getByText('新密码至少 6 位', { exact: true }).waitFor();
    await page.getByPlaceholder('请输入新密码', { exact: true }).fill(newPassword);
    await page.getByPlaceholder('请再次输入新密码').fill('different-password');
    await page.getByRole('button', { name: '重置密码', exact: true }).click();
    await page.getByText('两次输入的新密码不一致', { exact: true }).waitFor();
    assert.equal(requests.filter(req => req.url.endsWith('/account/password/reset')).length, 0);
    await page.getByPlaceholder('请再次输入新密码').fill(newPassword);
    const rejected = page.waitForResponse(res => res.url().endsWith('/account/password/reset'));
    await page.getByRole('button', { name: '重置密码', exact: true }).click();
    assert.notEqual((await (await rejected).json()).errCode, 0, 'Invalid code must fail');
    await page.getByRole('alert').waitFor();
    const unchanged = await request('/account/login', { areaCode: '+86', phoneNumber, password, platform: 5 });
    assert.equal(unchanged.errCode, 0, 'Rejected reset must preserve the old password');
    await page.getByPlaceholder('请输入验证码').fill(code);
    const reset = page.waitForResponse(res => res.url().endsWith('/account/password/reset'));
    await page.getByRole('button', { name: '重置密码', exact: true }).click();
    assert.equal((await (await reset).json()).errCode, 0);
    await page.getByText('密码重置成功，请使用新密码登录', { exact: true }).waitFor();
    assert.equal(requests.filter(req => req.url.endsWith('/account/code/send')).length, 1, 'Submitting must not resend or invalidate the code');
    assert.equal(requests.filter(req => req.url.endsWith('/account/register')).length, 0, 'Reset must never register an account');
    const oldLogin = await request('/account/login', { areaCode: '+86', phoneNumber, password, platform: 5 });
    assert.notEqual(oldLogin.errCode, 0, 'Old password must stop working');
    const newLogin = await request('/account/login', { areaCode: '+86', phoneNumber, password: newPassword, platform: 5 });
    assert.equal(newLogin.errCode, 0, newLogin.errMsg);
    assert.equal(newLogin.data.userID, registration.data.userID, 'Reset must preserve the original account');
    await page.getByRole('button', { name: '返回登录', exact: true }).click();
    await page.getByRole('link', { name: '忘记密码？' }).waitFor();
    console.log('PASS public recovery route, reset code purpose, mismatch/error handling, persisted password change and unchanged account identity');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
