const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const BASE = process.env.E2E_BASE || 'http://localhost:5199';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const artifacts = fs.mkdtempSync(path.join(os.tmpdir(), '99chat-mobile-chat-'));
  let mobile;
  async function login(phone, password, width) {
    const context = await browser.newContext({ permissions: ['notifications'], viewport: { width, height: 844 } });
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    await page.goto(`${BASE}/#/auth/sign-in`);
    await page.getByPlaceholder('请输入手机号').fill(phone);
    await page.getByPlaceholder('请输入密码').fill(password);
    const response = page.waitForResponse(r => r.url().endsWith('/account/login'));
    await page.getByRole('button', { name: '登录', exact: true }).click();
    const result = await (await response).json();
    assert.equal(result.errCode, 0, 'test account login');
    await page.waitForURL(/#\/messages$/, { timeout: 60000 });
    return { page, id: result.data.userID };
  }
  async function openPeer(page, id) {
    await page.goto(`${BASE}/#/contact/user/${id}`);
    await page.getByRole('button', { name: '发消息', exact: true }).click();
    await page.getByPlaceholder('输入消息...').waitFor();
  }
  async function withinViewport(locator, page) {
    const box = await locator.boundingBox();
    const { width, height } = page.viewportSize();
    assert.ok(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= width + 1 && box.y + box.height <= height + 1,
      `control outside ${width}x${height}: ${JSON.stringify(box)}`);
  }
  try {
    const a = await login(process.env.E2E_PHONE || '13800138000', process.env.E2E_PASSWORD || 'test123456', 375);
    mobile = a.page;
    const b = await login(process.env.E2E_PEER_PHONE || '13900139000', process.env.E2E_PEER_PASSWORD || 'test123456', 1280);
    // Establish the local test pair if an earlier friend-lifecycle test removed it.
    await mobile.goto(`${BASE}/#/contact/user/${b.id}`);
    const hasPeer = await mobile.getByRole('button', { name: '发消息', exact: true }).waitFor({ timeout: 5000 }).then(() => true, () => false);
    if (!hasPeer) {
      await mobile.goto(`${BASE}/#/settings/profile`);
      const nicknameInput = mobile.getByText('昵称', { exact: true }).locator('..').locator('input');
      await nicknameInput.waitFor();
      const nickname = await nicknameInput.inputValue();
      assert.ok(nickname);
      await mobile.goto(`${BASE}/#/contact/requests`);
      await mobile.getByRole('button', { name: '扫一扫', exact: true }).click();
      await mobile.getByPlaceholder('输入用户 ID').fill(b.id);
      await mobile.getByRole('button', { name: '发送申请', exact: true }).click();
      await mobile.getByText('好友申请已发送，等待对方确认', { exact: true }).waitFor();
      await b.page.goto(`${BASE}/#/contact/requests`);
      await b.page.getByRole('button', { name: `同意 ${nickname}`, exact: true }).click();
    }
    await openPeer(mobile, b.id);
    await openPeer(b.page, a.id);
    const chatURL = mobile.url();
    const input = mobile.getByPlaceholder('输入消息...');
    const send = mobile.locator('button').filter({ has: mobile.locator('svg.lucide-send') });
    const draft = `mobile-layout-${Date.now()}`;
    await input.fill(draft);
    for (const width of [375, 390, 430, 768, 1280, 390]) {
      await mobile.setViewportSize({ width, height: 844 });
      await withinViewport(input, mobile);
      await withinViewport(send, mobile);
      assert.equal(await input.inputValue(), draft, 'resize preserves draft');
      if (width <= 768) {
        assert.ok((await send.boundingBox()).width >= 44, 'mobile send target must be at least 44px');
        assert.equal(await mobile.locator('.list-panel').isVisible(), false);
        assert.equal(await mobile.locator('.mobile-tabbar').isVisible(), false);
      }
    }
    await mobile.setViewportSize({ width: 390, height: 440 });
    await input.focus();
    await withinViewport(input, mobile);
    await withinViewport(send, mobile);
    await mobile.getByRole('button', { name: '表情', exact: true }).click();
    await withinViewport(mobile.getByRole('button', { name: '插入 😀', exact: true }), mobile);
    await mobile.getByRole('button', { name: '插入 😀', exact: true }).click();
    assert.equal(await input.inputValue(), `${draft}😀`);
    await send.click();
    await mobile.locator('.chat-composer').getByRole('button', { name: '表情', exact: true }).click();
    await b.page.locator('.chat-bg').getByText(`${draft}😀`, { exact: true }).waitFor();
    await b.page.getByPlaceholder('输入消息...').fill(`reply-${draft}`);
    await b.page.getByPlaceholder('输入消息...').press('Enter');
    await mobile.locator('.chat-bg').getByText(`reply-${draft}`, { exact: true }).waitFor();
    await b.page.getByPlaceholder('输入消息...').fill('好');
    await b.page.getByPlaceholder('输入消息...').press('Enter');
    const short = mobile.locator('.chat-bg').getByText('好', { exact: true }).last();
    await short.waitFor();
    await short.click({ button: 'right' });
    const actionMenu = mobile.getByRole('button', { name: '收藏', exact: true }).locator('..');
    assert.ok((await actionMenu.boundingBox()).width >= 128, 'short-message menu must not collapse to bubble width');
    await mobile.getByRole('button', { name: '回复', exact: true }).click();
    await mobile.reload();
    await mobile.locator('.chat-bg').getByText(`reply-${draft}`, { exact: true }).waitFor();
    await withinViewport(input, mobile);
    const imageCount = await mobile.locator('[data-message-type="image"]').count();
    await mobile.locator('input[type=file][accept="image/*"]').setInputFiles(path.join(__dirname, 'src/assets/hero.png'));
    await mobile.waitForFunction(count => document.querySelectorAll('[data-message-type="image"]').length > count, imageCount);
    const image = mobile.locator('[data-message-type="image"]').last();
    await image.scrollIntoViewIfNeeded();
    await image.click();
    const viewer = mobile.locator('.fixed.inset-0').filter({ has: mobile.locator('a[download]') });
    await viewer.waitFor();
    await withinViewport(viewer.locator('a[download]'), mobile);
    await withinViewport(viewer.locator('button').filter({ has: mobile.locator('svg.lucide-x') }), mobile);
    await mobile.screenshot({ path: path.join(artifacts, 'image-preview-short.png') });
    await viewer.locator('button').filter({ has: mobile.locator('svg.lucide-x') }).click();
    const reply = mobile.locator('.chat-bg').getByText(`reply-${draft}`, { exact: true });
    await reply.click({ button: 'right' });
    await mobile.getByRole('button', { name: '收藏', exact: true }).click();
    await mobile.getByText('已收藏', { exact: true }).waitFor();
    await mobile.goto(`${BASE}/#/settings/collections`);
    await mobile.getByRole('button', { name: '查看收藏 文字收藏', exact: true }).filter({ hasText: `reply-${draft}` }).click();
    await mobile.getByRole('heading', { name: '收藏详情', exact: true }).waitFor();
    await mobile.getByRole('button', { name: '返回我的收藏', exact: true }).click();
    await mobile.goto(chatURL);
    await input.waitFor();
    await mobile.setViewportSize({ width: 390, height: 844 });
    await mobile.screenshot({ path: path.join(artifacts, 'chat.png') });
    await mobile.getByRole('button', { name: '聊天设置', exact: true }).click();
    await mobile.getByRole('button', { name: '返回聊天', exact: true }).click();
    await input.waitFor();
    await mobile.getByRole('button', { name: '返回聊天列表', exact: true }).click();
    await mobile.locator('.list-panel').waitFor({ state: 'visible' });
    await mobile.goto(chatURL);
    await input.waitFor();
    await mobile.getByRole('button', { name: '返回聊天列表', exact: true }).click();
    await mobile.locator('.list-panel').waitFor({ state: 'visible' });
    await mobile.goto(`${BASE}/#/contact/groups`);
    await mobile.locator('.detail-panel .overflow-y-auto button').filter({ has: mobile.locator('img') }).first().click();
    await mobile.getByRole('button', { name: '群管理', exact: true }).click();
    await mobile.getByRole('heading', { name: '群管理', exact: true }).waitFor();
    assert.equal(await mobile.locator('.mobile-tabbar').isVisible(), false);
    assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await mobile.screenshot({ path: path.join(artifacts, 'group-admin.png') });
    console.log(`PASS responsive composer, resize draft, emoji, real two-way delivery, reload history, image preview, favorite detail, group admin and direct-link return. Screenshots: ${artifacts}`);
  } catch (error) {
    if (mobile) await mobile.screenshot({ path: path.join(artifacts, 'failure.png') });
    console.error(`Artifacts: ${artifacts}`);
    throw error;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
