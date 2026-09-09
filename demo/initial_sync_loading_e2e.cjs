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
  await page.getByRole('button', { name: '全部', exact: true }).waitFor({ state: 'visible', timeout: 10000 });
  if (await page.locator('.cursor-pointer').count() === 0) {
    await page.getByText('正在同步聊天数据', { exact: true }).waitFor({ state: 'visible', timeout: 3000 });
  }
  console.log('Initial OpenIM synchronization is shown as loading, not as an empty conversation list.');
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
