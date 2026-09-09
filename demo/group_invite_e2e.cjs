const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:5199';
const GROUP_NAME = `邀请验证群-${Date.now()}`;

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
  const initialMember = page.getByText('suxia', { exact: true }).last();
  await initialMember.waitFor({ state: 'visible', timeout: 90000 });
  await initialMember.click();
  await page.getByPlaceholder('群名称').fill(GROUP_NAME);
  await page.getByRole('button', { name: /完成（1）/ }).click();
  await page.waitForURL(/#\/contact\/groups/, { timeout: 15000 });
  await page.getByText(GROUP_NAME, { exact: true }).click();
  await page.getByText('群管理', { exact: true }).click();

  await page.getByRole('button', { name: '邀请', exact: true }).click();
  const inviteDialog = page.getByText('邀请好友', { exact: true }).locator('xpath=../..');
  page.once('dialog', (dialog) => dialog.accept());
  await inviteDialog.getByRole('button', { name: 'qq', exact: true }).click();
  await page.getByText('邀请好友', { exact: true }).waitFor({ state: 'detached', timeout: 30000 });
  await page.getByText('群成员（3）', { exact: true }).waitFor({ state: 'visible', timeout: 30000 });

  console.log('Group invite adds a selected friend through the OpenIM group API.');
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
