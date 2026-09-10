const { chromium } = require('playwright');

const BASE = 'http://localhost:5199';
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL3VQAAAABJRU5ErkJggg==', 'base64');

async function login(page) {
  await page.goto(`${BASE}/#/auth/sign-in`);
  await page.getByPlaceholder('请输入手机号').fill('13800138000');
  await page.getByPlaceholder('请输入密码').fill('test123456');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 60000 });
}

async function waitForUploadedImage(page) {
  await page.locator('img[src*="/object/"]').first().waitFor({ state: 'visible', timeout: 30000 });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await login(page);

  await page.goto(`${BASE}/#/settings/profile`);
  await page.locator('input[type="file"]').setInputFiles({ name: 'profile.png', mimeType: 'image/png', buffer: png });
  await waitForUploadedImage(page);

  const groupName = `头像验证群-${Date.now()}`;
  await page.goto(`${BASE}/#/contact/create-group`);
  await page.getByRole('button', { name: 'suxia', exact: true }).last().click();
  await page.getByPlaceholder('群名称').fill(groupName);
  await page.getByRole('button', { name: /完成（1）/ }).click();
  await page.waitForURL(/#\/contact\/groups/, { timeout: 30000 });
  await page.getByText(groupName, { exact: true }).click();
  await page.locator('input[type="file"]').setInputFiles({ name: 'group.png', mimeType: 'image/png', buffer: png });
  await waitForUploadedImage(page);

  console.log('Profile and group avatars upload through OpenIM and render remote URLs.');
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
