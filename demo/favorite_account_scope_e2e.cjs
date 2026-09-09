const { chromium } = require('playwright');

const BASE = 'http://localhost:5199';
const LEAKED_TEXT = '不应跨账号显示的收藏';

async function login(page, phone) {
  await page.goto(`${BASE}/#/auth/sign-in`);
  await page.getByPlaceholder('请输入手机号').fill(phone);
  await page.getByPlaceholder('请输入密码').fill('test123456');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 60000 });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await login(page, '13700137000');
  await page.evaluate((content) => localStorage.setItem('99chat_favorites', JSON.stringify([{
    clientMsgID: 'another-account-favorite', sendID: '3540424232', content, contentType: 101, time: Date.now(),
  }])), LEAKED_TEXT);
  await page.goto(`${BASE}/#/settings/collections`);
  await page.getByText('无收藏', { exact: true }).waitFor({ state: 'visible', timeout: 15000 });
  if (await page.getByText(LEAKED_TEXT, { exact: true }).count()) {
    throw new Error('A favorite from a different account was displayed.');
  }

  console.log('Favorites from another account are not shown after switching users.');
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
