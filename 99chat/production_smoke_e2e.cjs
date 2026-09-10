const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

// Creates isolated accounts; never uses an existing customer's account.
const BASE = process.env.E2E_BASE;
assert.ok(BASE && process.env.TEST_VERIFY_CODE, 'Set E2E_BASE and TEST_VERIFY_CODE');
const png = fs.readFileSync(path.join(__dirname, 'src/assets/hero.png'));
async function register(index) {
  const user = { phone: `139${String(Date.now()).slice(-7)}${index}`, password: randomUUID(), name: `qa-${Date.now()}-${index}` };
  const response = await fetch(`${BASE}/chat/account/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', operationID: randomUUID() },
    body: JSON.stringify({ verifyCode: process.env.TEST_VERIFY_CODE, platform: 5, autoLogin: true,
      user: { areaCode: '+86', phoneNumber: user.phone, password: user.password, nickname: user.name } }),
  });
  const result = await response.json();
  assert.equal(result.errCode, 0, `registration: ${result.errMsg}`);
  return { ...user, ...result.data };
}
async function login(page, user) {
  await page.goto(`${BASE}/#/auth/sign-in`);
  await page.getByPlaceholder('请输入手机号').fill(user.phone);
  await page.getByPlaceholder('请输入密码').fill(user.password);
  const response = page.waitForResponse(response => response.url().endsWith('/account/login'));
  await page.getByRole('button', { name: '登录', exact: true }).click();
  Object.assign(user, (await (await response).json()).data);
  await page.waitForURL(/#\/messages/, { timeout: 60000 });
}
(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const pages = [];
  let groupID;
  let users;
  try {
    users = await Promise.all([0, 1].map(register));
    for (const user of users) {
      const context = await browser.newContext({ permissions: ['notifications', 'microphone'], viewport: { width: 1280, height: 800 } });
      await context.addInitScript(() => {
        const NativeAudio = window.Audio;
        window.__qaAudio = [];
        window.Audio = function(...args) { const audio = new NativeAudio(...args); window.__qaAudio.push(audio); return audio; };
        const NativeContext = window.AudioContext;
        window.__qaTones = [];
        window.AudioContext = class extends NativeContext {
          createOscillator() {
            const oscillator = super.createOscillator();
            oscillator.addEventListener('ended', () => window.__qaTones.push({ state: this.state, time: this.currentTime }));
            return oscillator;
          }
        };
      });
      const page = await context.newPage();
      page.on('console', msg => { if (msg.text().startsWith('FCM registration skipped:')) console.log(`PUSH CAPABILITY: ${msg.text()}`); });
      page.setDefaultTimeout(30000);
      pages.push(page);
      await login(page, user);
    }
    const [a,b] = pages;
    await a.goto(`${BASE}/#/contact/requests`);
    await a.getByText('扫一扫', { exact: true }).click();
    await a.getByPlaceholder('输入用户 ID').fill(users[1].userID);
    await a.getByRole('button', { name: '发送申请', exact: true }).click();
    await a.getByText('好友申请已发送，等待对方确认', { exact: true }).waitFor();
    await b.goto(`${BASE}/#/contact/requests`);
    await b.getByRole('button', { name: `同意 ${users[0].name}`, exact: true }).click();
    for (const [index,page] of pages.entries()) {
      await page.goto(`${BASE}/#/contact/user/${users[1-index].userID}`);
      await page.getByRole('button', { name: '发消息', exact: true }).click();
    }
    console.log('PASS friend request and acceptance in two browser contexts');
    const message = `production-text-${Date.now()}`;
    await a.getByPlaceholder('输入消息...').fill(message);
    await a.getByPlaceholder('输入消息...').press('Enter');
    await b.locator('.break-words').filter({ hasText: message }).waitFor();
    await b.reload();
    await b.locator('.break-words').filter({ hasText: message }).waitFor();
    console.log('PASS text recipient delivery and reload session/history');
    await b.getByPlaceholder('输入消息...').fill(`ready-${message}`);
    await b.getByPlaceholder('输入消息...').press('Enter');
    await a.locator('.break-words').filter({ hasText: `ready-${message}` }).waitFor();
    await b.getByPlaceholder('输入消息...').click();
    const tones = await b.evaluate(() => window.__qaTones.length);
    await a.getByPlaceholder('输入消息...').fill(`tone-${message}`);
    await a.getByPlaceholder('输入消息...').press('Enter');
    await b.waitForFunction(count => window.__qaTones.length > count && window.__qaTones.at(-1).state === 'running', tones);
    console.log('PASS incoming message runs native browser audio oscillator');
    await a.locator('input[type=file]').nth(0).setInputFiles({ name: 'qa.png', mimeType: 'image/png', buffer: png });
    await b.waitForFunction(() => [...document.querySelectorAll('[data-message-type="image"]')].some(img => img.naturalWidth > 0 && img.src.startsWith('https://')));
    await b.reload();
    await b.waitForFunction(() => [...document.querySelectorAll('[data-message-type="image"]')].some(img => img.naturalWidth > 0 && img.src.startsWith('https://')));
    console.log('PASS image upload, recipient decode, reload persistence');
    await a.locator('button').filter({ has: a.locator('svg.lucide-mic') }).click();
    await a.getByText('3"', { exact: true }).waitFor();
    await a.getByRole('button', { name: '发送', exact: true }).click();
    const voice = b.locator('button').filter({ has: b.locator('svg.lucide-play') });
    await voice.waitFor();
    console.log(`VOICE recipient duration label: ${await voice.innerText()}`);
    assert.match(await voice.innerText(), /[3-9]"/, 'recorded voice must retain elapsed duration');
    await voice.click();
    await b.waitForFunction(() => window.__qaAudio.some(audio => audio.currentTime > 0 && !audio.paused));
    await voice.click();
    await b.waitForFunction(() => window.__qaAudio.every(audio => audio.paused));
    console.log('PASS recorded voice delivered, decoded, played and paused');
    await a.locator('button').filter({ has: a.locator('svg.lucide-mic') }).click();
    await a.getByText('1"', { exact: true }).waitFor();
    await a.getByTitle('取消', { exact: true }).click();
    await a.getByPlaceholder('输入消息...').fill(`cancel-marker-${message}`);
    await a.getByPlaceholder('输入消息...').press('Enter');
    await b.locator('.break-words').filter({ hasText: `cancel-marker-${message}` }).waitFor();
    await b.reload();
    await b.locator('svg.lucide-play').waitFor();
    assert.equal(await b.locator('svg.lucide-play').count(), 1, 'cancel must not create a second voice message');
    console.log('PASS cancelled recording does not send; sent voice survives reload');
    await a.goto(`${BASE}/#/settings/profile`);
    await a.locator('input[type=file]').setInputFiles({ name: 'profile.png', mimeType: 'image/png', buffer: png });
    await a.waitForFunction(() => [...document.images].some(img => img.src.includes('/object/') && img.naturalWidth > 0));
    await a.getByRole('button', { name: '保存', exact: true }).click();
    await a.waitForURL(/#\/settings$/);
    await a.goto(`${BASE}/#/settings/profile`);
    await a.reload();
    await a.waitForFunction(() => [...document.images].some(img => img.src.includes('/object/') && img.naturalWidth > 0));
    console.log('PASS personal avatar upload and reload');
    await a.goto(`${BASE}/#/contact/create-group`);
    await a.getByRole('button', { name: users[1].name, exact: true }).last().click();
    const groupName = `qa-group-${Date.now()}`;
    await a.getByPlaceholder('群名称').fill(groupName);
    await a.getByRole('button', { name: /完成（1）/ }).click();
    await a.waitForURL(/#\/contact\/groups/);
    await a.getByText(groupName, { exact: true }).click();
    groupID = new URL(a.url()).hash.split('/').pop();
    await a.goto(`${BASE}/#/messages/groups/admin/${groupID}`);
    await a.getByRole('button', { name: '设置', exact: true }).last().click();
    await a.getByRole('button', { name: '更换头像', exact: true }).waitFor();
    await a.locator('input[type=file]').setInputFiles({ name: 'group.png', mimeType: 'image/png', buffer: png });
    await a.waitForFunction(() => { const img = document.querySelector('img[alt="群头像"]'); return img?.src.includes('/object/') && img.naturalWidth > 0; });
    await a.reload();
    await a.getByRole('button', { name: '设置', exact: true }).last().click();
    await a.waitForFunction(() => { const img = document.querySelector('img[alt="群头像"]'); return img?.src.includes('/object/') && img.naturalWidth > 0; });
    console.log('PASS group owner avatar setting, upload and reload');
    const directURL = b.url();
    await b.goto(`${BASE}/#/messages/groups/admin/${groupID}`);
    await b.getByRole('button', { name: '设置', exact: true }).last().click();
    await b.getByRole('img', { name: '群头像', exact: true }).waitFor();
    assert.equal(await b.getByRole('button', { name: '更换头像', exact: true }).count(), 0);
    console.log('PASS group avatar visible to member without editing control');
    await b.goto(directURL);
    await a.goto(b.url());
    await a.locator('.break-words').filter({ hasText: new RegExp(`^${message}$`) }).click({ button: 'right' });
    await a.getByText('收藏', { exact: true }).click();
    await a.getByText('已收藏', { exact: true }).waitFor();
    await a.locator('[data-message-type="image"]').click({ button: 'right' });
    await a.getByText('收藏', { exact: true }).click();
    await a.getByText('已收藏', { exact: true }).waitFor();
    await a.locator('button').filter({ has: a.locator('svg.lucide-play') }).click({ button: 'right' });
    await a.getByText('收藏', { exact: true }).click();
    await a.getByText('已收藏', { exact: true }).waitFor();
    await a.goto(`${BASE}/#/settings/collections`);
    await a.getByText(message, { exact: true }).waitFor();
    const favorites = await fetch(`${BASE}/chat/user/favorites/list`, { method: 'POST', headers: { 'Content-Type': 'application/json', operationID: randomUUID(), token: users[0].chatToken }, body: '{}' });
    assert.equal(favorites.status, 200, 'favorites server endpoint');
    const saved = await favorites.json();
    assert.equal(saved.errCode, 0);
    assert.ok(saved.data.some(item => item.content === message), 'favorite must exist on server');
    assert.deepEqual(saved.data.map(item => item.kind).sort(), ['image', 'text', 'voice']);
    console.log('PASS text, image and voice favorites exist on server');
    await b.goto(`${BASE}/#/settings/collections`);
    await b.getByText('无收藏', { exact: true }).waitFor();
    console.log('PASS other account has no leaked favorites');
    await a.context().close();
    const fresh = await browser.newContext({ permissions: ['notifications'], viewport: { width: 1280, height: 800 } });
    const c = await fresh.newPage();
    pages.push(c);
    c.setDefaultTimeout(30000);
    await login(c, users[0]);
    await c.goto(`${BASE}/#/settings/collections`);
    await c.getByText(message, { exact: true }).waitFor();
    await c.getByRole('button', { name: '查看收藏 图片收藏', exact: true }).click();
    await c.waitForFunction(() => { const img = document.querySelector('img[alt="收藏图片"]'); return img?.naturalWidth > 0; });
    await c.goto(`${BASE}/#/settings/collections`);
    await c.getByRole('button', { name: '查看收藏 语音收藏', exact: true }).click();
    await c.locator('audio').evaluate(audio => audio.play());
    await c.waitForFunction(() => document.querySelector('audio')?.currentTime > 0);
    console.log('PASS fresh browser image and voice favorite detail decode/playback');
    await c.goto(directURL);
    await c.locator('.break-words').filter({ hasText: message }).first().waitFor();
    await c.waitForFunction(() => [...document.querySelectorAll('[data-message-type="image"]')].some(img => img.naturalWidth > 0));
    console.log('PASS fresh browser login retrieves server favorites and message/image history');
    console.log('SCOPE: sequential browser migration verified here; simultaneous Web login is covered by web_multilogin_e2e.cjs');
  } catch (error) {
    for (const [index,page] of pages.entries()) {
      if (page.isClosed()) continue;
      console.error(`PAGE ${index}: ${page.url()}\n${(await page.locator('body').innerText()).slice(-4000)}`);
    }
    throw error;
  } finally {
    try { if (groupID && users) {
      const response = await fetch(`${BASE}/api/group/dismiss_group`, { method: 'POST', headers: { 'Content-Type': 'application/json', operationID: randomUUID(), token: users[0].imToken }, body: JSON.stringify({ groupID }) });
      const result = await response.json();
      assert.equal(result.errCode, 0, 'temporary group cleanup');
      console.log('CLEANUP temporary group dismissed');
    } } finally { await browser.close(); }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
