const { chromium } = require('playwright');

const BASE = 'http://localhost:5199';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(`${BASE}/#/auth/sign-in`);
  await page.getByPlaceholder('请输入手机号').waitFor({ state: 'visible', timeout: 20000 });
  await page.getByPlaceholder('请输入手机号').fill('13800138000');
  await page.getByPlaceholder('请输入密码').fill('test123456');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 60000 });

  await page.goto(`${BASE}/#/settings/messaging`);
  await page.getByText('我的表情', { exact: true }).click();
  await page.getByRole('heading', { name: '我的表情', exact: true }).waitFor({ state: 'visible', timeout: 10000 });
  await page.getByRole('button', { name: '添加表情', exact: true }).waitFor({ state: 'visible', timeout: 10000 });

  console.log('My emoji management page is available.');
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
