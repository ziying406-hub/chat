const { chromium } = require('playwright');
const BASE = 'http://localhost:5199';
const GROUP_NAME = `清空历史验证-${Date.now()}`;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`${BASE}/#/auth/sign-in`, { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('请输入手机号').waitFor({ state: 'visible', timeout: 30000 });
  await page.getByPlaceholder('请输入手机号').fill('13800138000');
  await page.getByPlaceholder('请输入密码').fill('test123456');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 60000 });
  await page.goto(`${BASE}/#/contact/create-group`);
  await page.getByRole('button', { name: 'suxia', exact: true }).last().click();
  await page.getByPlaceholder('群名称').fill(GROUP_NAME);
  await page.getByRole('button', { name: /完成（1）/ }).click();
  await page.waitForURL(/#\/contact\/groups/, { timeout: 30000 });
  const group = page.getByText(GROUP_NAME, { exact: true }).first();
  await group.waitFor({ state: 'visible', timeout: 30000 });
  await group.click();
  const clear = page.getByRole('button', { name: '清空聊天记录', exact: true });
  await clear.waitFor({ state: 'visible', timeout: 15000 });
  await clear.click();
  await page.getByRole('button', { name: '清空', exact: true }).click();
  await page.getByText('暂无本地聊天记录', { exact: true }).waitFor({ state: 'visible', timeout: 15000 });
  console.log('Group history clearing removes the local OpenIM conversation record after confirmation.');
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
