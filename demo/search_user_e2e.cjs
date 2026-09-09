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
  await page.goto(`${BASE}/#/contact/search/user`);
  const input = page.getByPlaceholder('输入用户 ID 或手机号');
  await input.fill('suxia');
  await input.press('Enter');
  await page.getByText('suxia', { exact: true }).waitFor({ state: 'visible', timeout: 30000 });
  await page.getByRole('button', { name: '查看', exact: true }).click();
  await page.getByRole('heading', { name: '用户资料', exact: true }).waitFor({ state: 'visible', timeout: 15000 });
  console.log('Friend search uses the OpenIM SDK and opens the matched user profile.');
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
