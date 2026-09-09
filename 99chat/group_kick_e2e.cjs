const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:5199';
const GROUP_NAME = `移除成员验证群-${Date.now()}`;

async function login(page, phone, password) {
  await page.goto(`${BASE_URL}/#/auth/sign-in`, { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('请输入手机号').waitFor({ state: 'visible', timeout: 20000 });
  await page.getByPlaceholder('请输入手机号').fill(phone || '13800138000');
  await page.getByPlaceholder('请输入密码').fill(password || 'test123456');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 60000 });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ownerContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const memberContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const owner = await ownerContext.newPage();
  const member = await memberContext.newPage();

  await login(owner);
  await owner.goto(`${BASE_URL}/#/contact/create-group`);
  const memberToAdd = owner.getByText('suxia', { exact: true }).last();
  await memberToAdd.waitFor({ state: 'visible', timeout: 90000 });
  await memberToAdd.click();
  await owner.getByPlaceholder('群名称').fill(GROUP_NAME);
  await owner.getByRole('button', { name: /完成（1）/ }).click();
  await owner.waitForURL(/#\/contact\/groups/, { timeout: 15000 });
  await owner.getByText(GROUP_NAME, { exact: true }).click();
  await owner.getByText('群管理', { exact: true }).click();

  owner.once('dialog', (dialog) => dialog.accept());
  await owner.getByRole('button', { name: '移除 suxia', exact: true }).click();
  await owner.getByText('群成员（1）', { exact: true }).waitFor({ state: 'visible', timeout: 30000 });

  await login(member, '13700137000', 'test123456');
  await member.goto(`${BASE_URL}/#/contact/groups`);
  await member.getByText(GROUP_NAME, { exact: true }).waitFor({ state: 'detached', timeout: 30000 });

  console.log('Group admin can remove a member through OpenIM and the member loses group access.');
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
