const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto('http://localhost:5199/#/auth/sign-in', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 15000 });
  await page.evaluate(() => localStorage.setItem('99chat_favorites', JSON.stringify([{
    clientMsgID: 'collection-test-message',
    sendID: '3540424232',
    content: '可验证的收藏消息',
    contentType: 101,
    time: Date.now(),
  }])));

  await page.goto('http://localhost:5199/#/settings/collections');
  await page.waitForTimeout(800);
  if (!await page.getByText('可验证的收藏消息', { exact: true }).count()) {
    throw new Error('A locally saved favorite is not shown in 我的收藏.');
  }

  console.log('Favorites saved from chat are rendered in 我的收藏.');
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
