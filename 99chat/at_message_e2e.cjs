const { chromium } = require('playwright');
const BASE = 'http://localhost:5199';
const TEXT = `提及验证-${Date.now()}`;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`${BASE}/#/auth/sign-in`);
  await page.getByPlaceholder('请输入手机号').fill('13800138000');
  await page.getByPlaceholder('请输入密码').fill('test123456');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 60000 });
  await page.getByRole('button', { name: '群聊', exact: true }).click();
  const group = page.locator('.cursor-pointer').filter({ hasText: '端到端测试群' }).first();
  await group.waitFor({ state: 'visible', timeout: 90000 });
  await group.click();
  const input = page.getByPlaceholder('输入消息...');
  await input.fill('@');
  await page.getByText('suxia', { exact: true }).last().click();
  await input.fill(`${await input.inputValue()}${TEXT}`);
  await input.press('Enter');
  await page.getByText(TEXT, { exact: false }).last().waitFor({ state: 'visible', timeout: 15000 });
  console.log('Group @ mention creates and renders an OpenIM mention message.');
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
