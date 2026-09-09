const { chromium } = require('playwright');

const BASE = 'http://localhost:5199';
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

  const divider = page.locator('[data-message-date-divider]').filter({ hasText: /\d+月\d+日/ }).first();
  await divider.waitFor({ state: 'visible', timeout: 90000 });
  console.log(`Message date divider renders ${await divider.innerText()}.`);
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
