const { chromium } = require('playwright');
const GROUP_NAME = `全员禁言验证-${Date.now()}`;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto('http://localhost:5199/#/auth/sign-in', { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('请输入手机号').waitFor({ state: 'visible', timeout: 30000 });
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 60000 });

  await page.goto('http://localhost:5199/#/contact/create-group');
  await page.getByRole('button', { name: 'suxia', exact: true }).last().click();
  await page.getByPlaceholder('群名称').fill(GROUP_NAME);
  await page.getByRole('button', { name: /完成（1）/ }).click();
  await page.waitForURL(/#\/contact\/groups/, { timeout: 30000 });

  await page.goto('http://localhost:5199/#/messages');
  await page.getByRole('button', { name: '群聊', exact: true }).click();
  const group = page.locator('.cursor-pointer').filter({ hasText: GROUP_NAME }).first();
  await group.waitFor({ state: 'visible', timeout: 30000 });
  await group.click();
  await page.getByRole('button', { name: '聊天设置', exact: true }).click();
  await page.getByText('群组管理', { exact: true }).click();
  await page.getByRole('button', { name: '设置', exact: true }).nth(1).click();

  const muteSwitch = page.getByRole('switch', { name: '全员禁言', exact: true });
  if (!await muteSwitch.count()) throw new Error('Group owner does not have a full-group mute control.');
  const initial = await muteSwitch.getAttribute('aria-checked');
  await muteSwitch.click();
  await page.waitForTimeout(700);
  if (await muteSwitch.getAttribute('aria-checked') === initial) throw new Error('Group mute state did not change after the SDK operation.');
  await muteSwitch.click();
  await page.waitForTimeout(700);
  if (await muteSwitch.getAttribute('aria-checked') !== initial) throw new Error('Group mute state was not restored.');

  console.log('Group owner can enable and restore the OpenIM full-group mute state.');
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
