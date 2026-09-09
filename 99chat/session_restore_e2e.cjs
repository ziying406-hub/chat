const { chromium } = require('playwright');

const BASE = 'http://localhost:5199';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${BASE}/#/auth/sign-in`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  const phone = page.getByPlaceholder('请输入手机号');
  const password = page.getByPlaceholder('请输入密码');
  if (await phone.inputValue() || await password.inputValue()) {
    throw new Error('Login form must not prefill a test account.');
  }
  if ((await page.locator('body').innerText()).includes('默认账号:')) {
    throw new Error('Login page must not display test account credentials.');
  }

  await phone.fill('13800138000');
  await password.fill('test123456');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 60000 });
  await page.reload();
  await page.waitForURL(/#\/messages/, { timeout: 60000 });
  await page.getByRole('button', { name: '消息', exact: true }).waitFor({ state: 'visible', timeout: 15000 });

  console.log('Session survives refresh and the login form contains no test credentials.');
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
