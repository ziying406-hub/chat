const { chromium } = require('playwright');

const BASE = 'http://localhost:5199';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`${BASE}/#/auth/sign-in`);
  await page.getByPlaceholder('请输入手机号').fill('13800138000');
  await page.getByPlaceholder('请输入密码').fill('test123456');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 60000 });

  await page.evaluate(() => {
    localStorage.setItem('99chat_tags', JSON.stringify([{ tagID: 'other-account-tag', name: '他人标签', memberIDs: [] }]));
    localStorage.setItem('99chat_batch_messages', JSON.stringify([{
      id: 'other-account-batch', content: '他人的群发内容', createdAt: new Date().toISOString(), recipients: [],
    }]));
  });

  await page.goto(`${BASE}/#/contact/tags`);
  await page.getByText('暂无标签', { exact: true }).waitFor({ state: 'visible', timeout: 15000 });
  if (await page.getByText('他人标签', { exact: true }).count()) throw new Error('A tag from another account was displayed.');

  await page.goto(`${BASE}/#/settings/messaging/batch`);
  await page.getByText('暂无群发记录', { exact: true }).waitFor({ state: 'visible', timeout: 15000 });
  if (await page.getByText('他人的群发内容', { exact: true }).count()) throw new Error('A batch record from another account was displayed.');

  console.log('Tags and batch-message records from another account are not displayed.');
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
