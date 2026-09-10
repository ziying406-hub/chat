const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { mkdtemp } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const BASE = process.env.E2E_BASE;
assert.ok(BASE && process.env.TEST_VERIFY_CODE, 'Set E2E_BASE and TEST_VERIFY_CODE');
(async () => {
  const phoneNumber = `139${String(Date.now()).slice(-8)}`;
  const password = randomUUID();
  const response = await fetch(`${BASE}/chat/account/register`, { method: 'POST',
    headers: { 'Content-Type': 'application/json', operationID: randomUUID() },
    body: JSON.stringify({ verifyCode: process.env.TEST_VERIFY_CODE, platform: 5, autoLogin: true,
      user: { areaCode: '+86', phoneNumber, password, nickname: 'qa-web-push' } }) });
  const account = await response.json();
  assert.equal(account.errCode, 0);
  // Push API is disabled in Chrome incognito contexts, even with granted permission.
  const profile = await mkdtemp(join(tmpdir(), '99chat-push-e2e-'));
  const context = await chromium.launchPersistentContext(profile, { channel: 'chrome', headless: true,
    permissions: ['notifications'], ignoreDefaultArgs: ['--disable-background-networking'] });
  let senderBrowser;
  try {
    const page = await context.newPage();
    context.on('requestfailed', request => console.error('REQUEST FAILED', new URL(request.url()).pathname, request.failure()?.errorText));
    const diagnostics = await context.newCDPSession(page);
    await diagnostics.send('Log.enable');
    diagnostics.on('Log.entryAdded', ({ entry }) => { if (entry.level === 'error') console.error(entry.text.slice(0, 300)); });
    page.on('console', msg => { if (msg.type() === 'error') console.error(msg.text().slice(0, 200)); });
    page.setDefaultTimeout(20000);
    await page.goto(`${BASE}/#/auth/sign-in`);
    await page.getByPlaceholder('请输入手机号').fill(phoneNumber);
    await page.getByPlaceholder('请输入密码').fill(password);
    await page.getByRole('button', { name: '登录', exact: true }).click();
    await page.waitForURL(/#\/messages/, { timeout: 60000 });
    await page.goto(`${BASE}/#/settings/notifications`);
    const toggle = page.getByRole('button', { name: '新消息通知', exact: true });
    await toggle.click();
    try {
      await page.getByRole('status').waitFor({ timeout: 60000 });
      assert.equal(await page.getByRole('status').innerText(), '离线推送已启用');
    }
    catch (error) { console.error(await page.getByRole('status').allTextContents()); throw error; }
    assert.equal(await toggle.getAttribute('aria-pressed'), 'true');
    const subscription = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration('/firebase-cloud-messaging-push-scope');
      return Boolean(await registration?.pushManager.getSubscription());
    });
    assert.equal(subscription, true, 'real browser push subscription');
    console.log('PASS FCM subscription and OpenIM token binding');
    if (process.env.TEST_OFFLINE_PUSH === '1') {
      const senderPhone = `138${String(Date.now()).slice(-8)}`;
      const senderName = `qa-push-sender-${Date.now()}`;
      const senderResponse = await fetch(`${BASE}/chat/account/register`, { method: 'POST',
        headers: { 'Content-Type': 'application/json', operationID: randomUUID() },
        body: JSON.stringify({ verifyCode: process.env.TEST_VERIFY_CODE, platform: 5, autoLogin: true,
          user: { areaCode: '+86', phoneNumber: senderPhone, password, nickname: senderName } }) });
      assert.equal((await senderResponse.json()).errCode, 0);
      senderBrowser = await chromium.launch({ channel: 'chrome', headless: true });
      const sender = await senderBrowser.newPage({ permissions: ['notifications'] });
      sender.setDefaultTimeout(30000);
      await sender.goto(`${BASE}/#/auth/sign-in`);
      await sender.getByPlaceholder('请输入手机号').fill(senderPhone);
      await sender.getByPlaceholder('请输入密码').fill(password);
      await sender.getByRole('button', { name: '登录', exact: true }).click();
      await sender.waitForURL(/#\/messages/, { timeout: 60000 });
      await sender.goto(`${BASE}/#/contact/requests`);
      await sender.getByText('扫一扫', { exact: true }).click();
      await sender.getByPlaceholder('输入用户 ID').fill(account.data.userID);
      await sender.getByRole('button', { name: '发送申请', exact: true }).click();
      await sender.getByText('好友申请已发送，等待对方确认', { exact: true }).waitFor();
      await page.goto(`${BASE}/#/contact/requests`);
      await page.getByRole('button', { name: `同意 ${senderName}`, exact: true }).click();
      await sender.goto(`${BASE}/#/contact/user/${account.data.userID}`);
      await sender.getByRole('button', { name: '发消息', exact: true }).click();
      const worker = context.serviceWorkers().find(worker => worker.url().includes('firebase-messaging-sw.js'));
      assert.ok(worker);
      await worker.evaluate(async () => (await self.registration.getNotifications()).forEach(notification => notification.close()));
      await page.goto('about:blank');
      // Allow the server to finish the WebSocket close/presence update.
      await new Promise(resolve => setTimeout(resolve, 1500));
      await sender.getByPlaceholder('输入消息...').fill(`offline-push-${Date.now()}`);
      await sender.getByPlaceholder('输入消息...').press('Enter');
      let notificationCount = 0;
      for (let attempt = 0; attempt < 60 && !notificationCount; attempt++) {
        notificationCount = await worker.evaluate(async () => (await self.registration.getNotifications()).length);
        if (!notificationCount) await new Promise(resolve => setTimeout(resolve, 1000));
      }
      assert.ok(notificationCount > 0, 'OpenIM message must reach native browser notifications with app page closed');
      await worker.evaluate(async () => (await self.registration.getNotifications()).forEach(notification => notification.close()));
      console.log('PASS real OpenIM -> FCM -> service worker notification while app page closed');
      await page.goto(`${BASE}/#/settings/notifications`);
    }
    await toggle.click();
    await page.getByText('离线推送已关闭', { exact: true }).waitFor();
    assert.equal(await toggle.getAttribute('aria-pressed'), 'false');
    assert.equal(await page.evaluate(async () => Boolean(await (await navigator.serviceWorker.getRegistration('/firebase-cloud-messaging-push-scope'))?.pushManager.getSubscription())), false);
    await toggle.click();
    await page.getByText('离线推送已启用', { exact: true }).waitFor({ timeout: 60000 });
    await page.getByRole('button', { name: '退出', exact: true }).click();
    await page.waitForURL(/#\/auth\/sign-in/);
    assert.equal(await page.evaluate(async () => Boolean(await (await navigator.serviceWorker.getRegistration('/firebase-cloud-messaging-push-scope'))?.pushManager.getSubscription())), false, 'logout revokes browser subscription');
    console.log('PASS real FCM registration, OpenIM binding and unsubscribe');
  } finally { await senderBrowser?.close(); await context.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
