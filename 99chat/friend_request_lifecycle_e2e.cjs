const { chromium } = require('playwright');
const BASE = 'http://localhost:5199';
const USER_A = { phone: '13800138000', id: '3004649357', name: 'linwan' };
const USER_B = { phone: '13700137000', id: '3540424232', name: 'suxia' };

async function login(page, user) {
  await page.goto(`${BASE}/#/auth/sign-in`);
  await page.getByPlaceholder('请输入手机号').fill(user.phone);
  await page.getByPlaceholder('请输入密码').fill('test123456');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 60000 });
}
async function deleteFriend(page, friend) {
  await page.goto(`${BASE}/#/contact/user/${friend.id}`);
  const deleteButton = page.getByRole('button', { name: '删除好友', exact: true });
  await deleteButton.waitFor({ state: 'visible', timeout: 30000 });
  await deleteButton.click();
  await page.getByRole('button', { name: '删除', exact: true }).click();
  await page.waitForURL(/#\/contact$/, { timeout: 15000 });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const a = await (await browser.newContext()).newPage();
  const b = await (await browser.newContext()).newPage();
  await Promise.all([login(a, USER_A), login(b, USER_B)]);
  await deleteFriend(a, USER_B);
  await deleteFriend(b, USER_A);

  await a.goto(`${BASE}/#/contact/requests`);
  await a.getByText('扫一扫', { exact: true }).click();
  await a.getByPlaceholder('输入用户 ID').fill(USER_B.id);
  await a.getByRole('button', { name: '发送申请', exact: true }).click();
  await a.getByText('好友申请已发送，等待对方确认', { exact: true }).waitFor({ state: 'visible', timeout: 15000 });

  await b.goto(`${BASE}/#/contact/requests`);
  await b.getByText(USER_A.name, { exact: true }).waitFor({ state: 'visible', timeout: 30000 });
  await b.getByRole('button', { name: `同意 ${USER_A.name}`, exact: true }).click();
  await Promise.all([
    a.goto(`${BASE}/#/contact/user/${USER_B.id}`),
    b.goto(`${BASE}/#/contact/user/${USER_A.id}`),
  ]);
  await Promise.all([
    a.getByRole('button', { name: '发消息', exact: true }).waitFor({ state: 'visible', timeout: 30000 }),
    b.getByRole('button', { name: '发消息', exact: true }).waitFor({ state: 'visible', timeout: 30000 }),
  ]);
  console.log('Friend application appears, can be accepted, and restores both OpenIM friend lists.');
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
