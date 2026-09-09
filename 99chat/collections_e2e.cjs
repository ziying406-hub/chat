const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto('http://localhost:5199/#/auth/sign-in', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 15000 });
  await page.evaluate(async () => {
    const login = await fetch('http://localhost:10008/account/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', operationID: `${Date.now()}collection` },
      body: JSON.stringify({ areaCode: '+86', phoneNumber: '13800138000', password: 'test123456', platform: 5, autoLogin: true }),
    }).then((response) => response.json());
    const result = await fetch('http://localhost:10008/user/favorites/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', token: login.data.chatToken, operationID: `${Date.now()}favorite` },
      body: JSON.stringify({ clientMsgID: 'collection-test-message', sendID: '3540424232', content: '可验证的收藏消息', contentType: 101, time: Date.now(), kind: 'text' }),
    }).then((response) => response.json());
    if (login.errCode !== 0 || result.errCode !== 0) throw new Error('Could not create a server-backed favorite.');
  });

  await page.goto('http://localhost:5199/#/settings/collections');
  await page.waitForTimeout(800);
  if (!await page.getByText('可验证的收藏消息', { exact: true }).count()) {
    throw new Error('A server-backed favorite is not shown in 我的收藏.');
  }

  console.log('Server-backed favorites are rendered in 我的收藏.');
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
