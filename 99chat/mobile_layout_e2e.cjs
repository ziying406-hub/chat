const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// Local integration account, matching the existing local E2E suite.
// Override explicitly when using a different test environment. Never use customer accounts.
const BASE = process.env.E2E_BASE || 'http://localhost:5199';
const PHONE = process.env.E2E_PHONE || '13800138000';
const PASSWORD = process.env.E2E_PASSWORD || 'test123456';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, permissions: ['notifications'] });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const artifacts = fs.mkdtempSync(path.join(os.tmpdir(), '99chat-mobile-'));
  const go = async route => {
    await page.goto(`${BASE}/#${route}`);
    await page.waitForURL(`**/#${route}`);
  };
  const noOverflow = async () => {
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `horizontal overflow: ${page.url()}`);
  };
  try {
    await go('/auth/sign-in');
    await page.getByPlaceholder('请输入手机号').fill(PHONE);
    await page.getByPlaceholder('请输入密码').fill(PASSWORD);
    await page.getByRole('button', { name: '登录', exact: true }).click();
    await page.waitForURL(/#\/messages$/, { timeout: 60000 });
    const list = page.getByPlaceholder('搜索').locator('xpath=ancestor::div[contains(@class,"w-[320px]")]');
    const initial = await list.boundingBox();
    assert.ok(initial && Math.abs(initial.width - 375) <= 1, `mobile list must fill viewport, got ${initial?.width}px`);

    for (const width of [375, 390, 430, 768]) {
      await page.setViewportSize({ width, height: 844 });
      for (const route of ['/messages', '/contact', '/settings', '/messages/', '/contact/', '/settings/']) {
        await go(route);
        await page.locator('.list-panel').waitFor({ state: 'visible' });
        assert.equal(Math.round((await page.locator('.list-panel').boundingBox()).width), width);
        assert.equal(await page.locator('.detail-panel').isVisible(), false);
        assert.equal(await page.locator('.mobile-tabbar').isVisible(), true);
        assert.deepEqual(await page.locator('.mobile-tabbar button span.text-\\[10px\\]').allTextContents(), ['通讯录', '聊天', '我的']);
        await noOverflow();
      }
      await page.getByRole('button', { name: '我的收藏', exact: true }).click();
      await page.waitForURL('**/#/settings/collections');
      await page.getByRole('heading', { name: '我的收藏', exact: true }).waitFor();
      assert.equal(await page.locator('.list-panel').isVisible(), false);
      assert.equal(await page.locator('.mobile-tabbar').isVisible(), false);
      await page.getByRole('button', { name: '返回个人中心', exact: true }).click();
      await page.waitForURL('**/#/settings');
      await go('/contact/requests');
      await page.getByRole('heading', { name: '新的朋友', exact: true }).waitFor();
      assert.equal(await page.locator('.list-panel').isVisible(), false);
      await page.getByRole('button', { name: '扫一扫', exact: true }).click();
      await page.getByPlaceholder('输入用户 ID').waitFor();
      const modal = await page.getByPlaceholder('输入用户 ID').locator('..').boundingBox();
      assert.ok(modal.x >= 0 && modal.x + modal.width <= width);
      await page.getByRole('button', { name: '取消', exact: true }).click();
      await noOverflow();
    }
    // Check direct-link parents for all settings roots, without a history dependency.
    for (const route of ['general', 'notifications', 'messaging', 'privacy', 'security', 'collections']) {
      await go(`/settings/${route}`);
      await page.getByRole('button', { name: '返回个人中心', exact: true }).click();
      await page.waitForURL('**/#/settings');
    }
    for (const [route, label, parent] of [
      ['/messages/session/missing', '返回聊天列表', '/messages'],
      ['/messages/session/missing/settings', '返回聊天列表', '/messages'],
      ['/contact/user/missing', '返回通讯录', '/contact'],
      ['/contact/group/missing', '返回群组列表', '/contact/groups'],
      ['/messages/groups/admin/missing', '返回群组列表', '/contact/groups'],
      ['/settings/collections/missing', '返回我的收藏', '/settings/collections'],
      ['/settings/messaging/batch/missing', '返回群发助手', '/settings/messaging/batch'],
    ]) {
      await go(route);
      await page.getByRole('button', { name: label, exact: true }).click();
      await page.waitForURL(`**/#${parent}`);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await go('/messages');
    await page.screenshot({ path: path.join(artifacts, 'mobile-messages.png') });
    await go('/settings');
    await page.screenshot({ path: path.join(artifacts, 'mobile-settings.png') });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForURL('**/#/settings/profile');
    assert.equal(await page.locator('.sidebar-nav').isVisible(), true);
    assert.equal(await page.locator('.list-panel').isVisible(), true);
    assert.equal(await page.locator('.mobile-tabbar').isVisible(), false);
    assert.equal(Math.round((await page.locator('.list-panel').boundingBox()).width), 320);
    await noOverflow();
    await page.screenshot({ path: path.join(artifacts, 'desktop-settings.png') });
    console.log(`PASS mobile root/detail routes, back navigation, modal bounds, desktop layout. Screenshots: ${artifacts}`);
  } catch (error) {
    await page.screenshot({ path: path.join(artifacts, 'failure.png') });
    console.error(`FAIL at ${page.url()}; screenshot: ${artifacts}/failure.png`);
    throw error;
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
