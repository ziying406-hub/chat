const { chromium } = require('playwright');
const BASE_URL = 'http://localhost:5199';
const GROUP_NAME = `管理员权限验证群-${Date.now()}`;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(`${BASE_URL}/#/auth/sign-in`, { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('请输入手机号').waitFor({ state: 'visible', timeout: 20000 });
  await page.getByPlaceholder('请输入手机号').fill('13800138000');
  await page.getByPlaceholder('请输入密码').fill('test123456');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 60000 });
  await page.goto(`${BASE_URL}/#/contact/create-group`);
  const member = page.getByText('suxia', { exact: true }).last();
  await member.waitFor({ state: 'visible', timeout: 90000 });
  await member.click();
  await page.getByPlaceholder('群名称').fill(GROUP_NAME);
  await page.getByRole('button', { name: /完成（1）/ }).click();
  await page.waitForURL(/#\/contact\/groups/, { timeout: 15000 });
  await page.getByText(GROUP_NAME, { exact: true }).click();
  await page.getByText('群管理', { exact: true }).click();
  await page.getByRole('button', { name: '设为管理员 suxia', exact: true }).click();
  await page.getByRole('button', { name: '取消管理员 suxia', exact: true }).waitFor({ state: 'visible', timeout: 30000 });
  await page.getByRole('button', { name: '取消管理员 suxia', exact: true }).click();
  await page.getByRole('button', { name: '设为管理员 suxia', exact: true }).waitFor({ state: 'visible', timeout: 30000 });
  console.log('Group owner can grant and revoke administrator permissions through OpenIM.');
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
