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
  await page.goto(`${BASE}/#/contact/user/3540424232`);
  await page.getByRole('button', { name: '发消息', exact: true }).waitFor({ state: 'visible', timeout: 30000 });
  await page.getByRole('button', { name: '发消息', exact: true }).click();
  await page.waitForURL(/#\/messages\/session\/si_3004649357_3540424232/, { timeout: 30000 });
  await page.getByPlaceholder('输入消息...').waitFor({ state: 'visible', timeout: 15000 });
  console.log('User profile opens the real OpenIM direct conversation.');
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
