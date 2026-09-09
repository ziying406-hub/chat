const { chromium } = require('playwright');
const BASE = 'http://localhost:5199';
const GROUP_NAME = `退出群验证-${Date.now()}`;

async function login(page, phone) {
  await page.goto(`${BASE}/#/auth/sign-in`);
  await page.getByPlaceholder('请输入手机号').fill(phone);
  await page.getByPlaceholder('请输入密码').fill('test123456');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 60000 });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const owner = await (await browser.newContext()).newPage();
  const member = await (await browser.newContext()).newPage();
  await login(owner, '13800138000');
  await owner.goto(`${BASE}/#/contact/create-group`);
  const invitee = owner.getByText('suxia', { exact: true }).last();
  await invitee.waitFor({ state: 'visible', timeout: 90000 });
  await invitee.click();
  await owner.getByPlaceholder('群名称').fill(GROUP_NAME);
  await owner.getByRole('button', { name: /完成（1）/ }).click();
  await owner.waitForURL(/#\/contact\/groups/, { timeout: 30000 });

  await login(member, '13700137000');
  await member.goto(`${BASE}/#/contact/groups`);
  const group = member.getByText(GROUP_NAME, { exact: true });
  await group.waitFor({ state: 'visible', timeout: 90000 });
  await group.click();
  await member.getByRole('button', { name: '退出群组', exact: true }).click();
  await member.getByRole('button', { name: '退出', exact: true }).click();
  await member.waitForURL(/#\/contact\/groups/, { timeout: 30000 });
  await group.waitFor({ state: 'detached', timeout: 30000 });

  console.log('A group member can confirm exit and the group is removed from their OpenIM group list.');
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
