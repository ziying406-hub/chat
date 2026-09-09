const { chromium } = require('playwright');
const BASE = 'http://localhost:5199';
const FRIEND_ID = '3540424232';
const REMARK = `备注验证-${Date.now()}`;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`${BASE}/#/auth/sign-in`);
  await page.getByPlaceholder('请输入手机号').fill('13800138000');
  await page.getByPlaceholder('请输入密码').fill('test123456');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 60000 });
  await page.goto(`${BASE}/#/contact/user/${FRIEND_ID}`);
  await page.getByText('设置备注和标签', { exact: true }).waitFor({ state: 'visible', timeout: 30000 });

  await page.getByText('设置备注和标签', { exact: true }).click();
  const input = page.getByPlaceholder('输入备注名');
  await input.fill(REMARK);
  await page.getByRole('button', { name: '确定', exact: true }).click();
  await page.getByText(`备注: ${REMARK}`, { exact: true }).waitFor({ state: 'visible', timeout: 15000 });

  await page.getByText('设置备注和标签', { exact: true }).click();
  await input.fill('');
  await page.getByRole('button', { name: '确定', exact: true }).click();
  await page.getByText(`备注: ${REMARK}`, { exact: true }).waitFor({ state: 'detached', timeout: 15000 });

  await page.getByRole('button', { name: '加入黑名单', exact: true }).click();
  await page.getByRole('button', { name: '确定', exact: true }).click();
  await page.getByRole('button', { name: '移出黑名单', exact: true }).waitFor({ state: 'visible', timeout: 15000 });
  await page.goto(`${BASE}/#/settings/blacklist`);
  await page.getByText('suxia', { exact: true }).waitFor({ state: 'visible', timeout: 15000 });

  await page.goto(`${BASE}/#/contact/user/${FRIEND_ID}`);
  await page.getByRole('button', { name: '移出黑名单', exact: true }).click();
  await page.getByRole('button', { name: '确定', exact: true }).click();
  await page.getByRole('button', { name: '加入黑名单', exact: true }).waitFor({ state: 'visible', timeout: 15000 });

  console.log('Friend remark and blacklist add/remove use real OpenIM SDK state and restore the test account.');
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
