const { chromium } = require('playwright');
const BASE = 'http://localhost:5199';
const GROUP_NAME = `解散群验证-${Date.now()}`;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`${BASE}/#/auth/sign-in`);
  await page.getByPlaceholder('请输入手机号').fill('13800138000');
  await page.getByPlaceholder('请输入密码').fill('test123456');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 60000 });

  await page.goto(`${BASE}/#/contact/create-group`);
  await page.getByRole('button', { name: 'suxia', exact: true }).last().waitFor({ state: 'visible', timeout: 90000 });
  await page.getByRole('button', { name: 'suxia', exact: true }).last().click();
  await page.getByPlaceholder('群名称').fill(GROUP_NAME);
  await page.getByRole('button', { name: /完成（1）/ }).click();
  await page.waitForURL(/#\/contact\/groups/, { timeout: 30000 });
  await page.getByText(GROUP_NAME, { exact: true }).click();
  await page.getByRole('button', { name: '解散群组', exact: true }).click();
  await page.getByRole('button', { name: '解散', exact: true }).click();
  await page.waitForURL(/#\/contact\/groups/, { timeout: 30000 });
  await page.getByText(GROUP_NAME, { exact: true }).waitFor({ state: 'detached', timeout: 30000 });

  console.log('Group dismissal is confirmed and removes the group from the OpenIM joined-group view.');
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
