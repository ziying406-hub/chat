const { chromium } = require('playwright');

const BASE = 'http://localhost:5199';
const TEXT = `时间验证-${Date.now()}`;

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

  const bubble = page.locator('.break-words').filter({ hasText: TEXT }).last();
  await bubble.waitFor({ state: 'visible', timeout: 15000 });
  const rowText = await bubble.locator('xpath=../../..').innerText();
  if (!/\b\d{2}:\d{2}\b/.test(rowText)) {
    throw new Error(`Message timestamp was not rendered: ${rowText}`);
  }

  console.log('A sent OpenIM message renders its time in the chat history.');
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
