const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:5199';
const GROUP_NAME = `转让群主验证群-${Date.now()}`;

async function login(page, phone, password) {
  await page.goto(`${BASE_URL}/#/auth/sign-in`, { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('请输入手机号').waitFor({ state: 'visible', timeout: 20000 });
  await page.getByPlaceholder('请输入手机号').fill(phone || '13800138000');
  await page.getByPlaceholder('请输入密码').fill(password || 'test123456');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 60000 });
}

async function openGroupAdmin(page, groupName) {
  await page.goto(`${BASE_URL}/#/contact/groups`);
  const group = page.getByText(groupName, { exact: true });
  await group.waitFor({ state: 'visible', timeout: 90000 });
  await group.click();
  await page.getByText('群管理', { exact: true }).click();
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ownerContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const newOwnerContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const owner = await ownerContext.newPage();
  const newOwner = await newOwnerContext.newPage();

  await login(owner);
  await owner.goto(`${BASE_URL}/#/contact/create-group`);
  const memberToPromote = owner.getByText('suxia', { exact: true }).last();
  await memberToPromote.waitFor({ state: 'visible', timeout: 90000 });
  await memberToPromote.click();
  await owner.getByPlaceholder('群名称').fill(GROUP_NAME);
  await owner.getByRole('button', { name: /完成（1）/ }).click();
  await owner.waitForURL(/#\/contact\/groups/, { timeout: 15000 });
  await openGroupAdmin(owner, GROUP_NAME);

  owner.once('dialog', (dialog) => dialog.accept());
  await owner.getByRole('button', { name: '转让群主 suxia', exact: true }).click();
  await login(newOwner, '13700137000', 'test123456');
  await newOwner.goto(`${BASE_URL}/#/contact/groups`);
  await newOwner.getByRole('button', { name: '我创建的', exact: true }).click();
  await newOwner.getByText(GROUP_NAME, { exact: true }).waitFor({ state: 'visible', timeout: 30000 });

  await openGroupAdmin(newOwner, GROUP_NAME);
  newOwner.once('dialog', (dialog) => dialog.accept());
  await newOwner.getByRole('button', { name: '转让群主 linwan', exact: true }).click();
  console.log('Group ownership can be transferred and restored through OpenIM.');
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
