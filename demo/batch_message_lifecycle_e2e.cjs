const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5199';
const MESSAGE = `群发生命周期验证 ${Date.now()}`;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto(`${BASE_URL}/#/auth/sign-in`, { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('请输入手机号').waitFor({ state: 'visible', timeout: 20000 });
  await page.getByPlaceholder('请输入手机号').fill('13800138000');
  await page.getByPlaceholder('请输入密码').fill('test123456');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 60000 });

  await page.goto(`${BASE_URL}/#/settings/messaging/batch/create`);
  await page.getByRole('checkbox').nth(0).waitFor({ state: 'visible', timeout: 90000 });
  await page.getByRole('checkbox').nth(0).check();
  await page.getByRole('checkbox').nth(1).check();
  await page.getByPlaceholder('输入群发内容').fill(MESSAGE);
  await page.getByRole('button', { name: '发送', exact: true }).click();
  await page.waitForURL(/#\/settings\/messaging\/batch\/[^/]+$/, { timeout: 20000 });
  await page.waitForTimeout(600);

  await page.getByRole('button', { name: '再发一条', exact: true }).click();
  await page.waitForURL(/#\/settings\/messaging\/batch\/create\?task=/, { timeout: 5000 });
  if (await page.getByPlaceholder('输入群发内容').inputValue() !== MESSAGE) throw new Error('Resend does not prefill the original message.');
  if (await page.locator('input[type="checkbox"]:checked').count() !== 2) throw new Error('Resend does not preselect the successful recipients.');

  await page.getByRole('button', { name: '返回群发助手', exact: true }).click();
  await page.getByText(MESSAGE, { exact: true }).click();
  await page.getByRole('button', { name: '删除群发记录', exact: true }).click();
  await page.getByRole('button', { name: '删除', exact: true }).click();
  await page.waitForTimeout(500);
  if (!await page.getByText('暂无群发记录', { exact: true }).count()) { console.error(await page.locator('body').innerText()); throw new Error('Confirmed deletion did not remove the local batch task.'); }

  console.log('Batch preview, resend prefill, and confirmed deletion work.');
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
