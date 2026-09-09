const { chromium } = require('playwright');
const BASE = 'http://localhost:5199';
const SIGNATURE = `签名验证-${Date.now()}`;

async function login(page) {
  await page.goto(`${BASE}/#/auth/sign-in`);
  await page.getByPlaceholder('请输入手机号').fill('13800138000');
  await page.getByPlaceholder('请输入密码').fill('test123456');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 60000 });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await login(page);
  await page.goto(`${BASE}/#/settings/profile`);
  const nickname = page.locator('input:not([type="file"])').first();
  const signature = page.getByPlaceholder('设置签名');
  const originalNickname = await nickname.inputValue();
  const originalSignature = await signature.inputValue();

  await signature.fill(SIGNATURE);
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await page.waitForURL(/#\/settings$/, { timeout: 15000 });
  await page.goto(`${BASE}/#/settings/profile`);
  await signature.waitFor({ state: 'visible', timeout: 15000 });
  if (await signature.inputValue() !== SIGNATURE) throw new Error('Updated profile signature was not persisted.');

  await nickname.fill(originalNickname);
  await signature.fill(originalSignature);
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await page.waitForURL(/#\/settings$/, { timeout: 15000 });
  console.log('Profile updates persist through OpenIM and the original value is restored.');
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
