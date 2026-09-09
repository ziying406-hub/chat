const { chromium } = require('playwright');
const BASE = 'http://localhost:5199';
const TEXT = `delete-local-${Date.now()}`;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`${BASE}/#/auth/sign-in`);
  await page.getByPlaceholder('请输入手机号').fill('13800138000');
  await page.getByPlaceholder('请输入密码').fill('test123456');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 60000 });
  const conversation = page.locator('.cursor-pointer').filter({ hasText: 'suxia' }).first();
  await conversation.waitFor({ state: 'visible', timeout: 90000 });
  await conversation.click();

  const composer = page.getByPlaceholder('输入消息...');
  await composer.fill(TEXT);
  await composer.press('Enter');
  const message = page.locator('div').filter({ hasText: new RegExp(`^${TEXT}$`) }).last();
  await message.waitFor({ state: 'visible', timeout: 15000 });

  await page.getByRole('button', { name: '更多聊天操作', exact: true }).click();
  await page.getByText('多选', { exact: true }).click();
  await page.getByRole('button', { name: /选择消息 / }).last().click();
  await page.getByRole('button', { name: '删除', exact: true }).click();
  await message.waitFor({ state: 'detached', timeout: 15000 });

  console.log('Selected messages are actually removed from local OpenIM history.');
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
