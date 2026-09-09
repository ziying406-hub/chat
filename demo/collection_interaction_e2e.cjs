const { chromium } = require('playwright');

const BASE = 'http://localhost:5199';
const IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="20" height="20"%3E%3C/svg%3E';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`${BASE}/#/auth/sign-in`);
  const phone = page.getByPlaceholder('请输入手机号');
  await phone.waitFor({ state: 'visible', timeout: 30000 });
  await phone.fill('13800138000');
  await page.getByPlaceholder('请输入密码').fill('test123456');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 60000 });
  await page.evaluate(({ image }) => {
    const accounts = JSON.parse(localStorage.getItem('99chat_accounts') || '[]');
    localStorage.setItem(`99chat_favorites_${accounts[0].userID}`, JSON.stringify([
      { clientMsgID: 'collection-image', sendID: '3540424232', senderName: '测试好友', contentType: 102, time: Date.now(), kind: 'image', mediaUrl: image, content: '' },
      { clientMsgID: 'collection-voice', sendID: '3540424232', senderName: '测试好友', contentType: 103, time: Date.now() - 60000, kind: 'voice', mediaUrl: 'https://example.invalid/voice.mp3', duration: 2, content: '' },
    ]));
  }, { image: IMAGE });

  await page.goto(`${BASE}/#/settings/collections`);
  await page.getByText(/今天 \d{2}:\d{2}/).first().waitFor({ state: 'visible', timeout: 15000 });
  await page.getByRole('button', { name: '查看收藏 图片收藏' }).click();
  await page.waitForURL(/#\/settings\/collections\/collection-image$/, { timeout: 10000 });
  await page.locator('img[src^="data:image/svg+xml"]').waitFor({ state: 'visible', timeout: 10000 });

  await page.getByRole('button', { name: '返回我的收藏' }).click();
  await page.getByRole('button', { name: '查看收藏 语音收藏' }).click();
  await page.locator('audio').waitFor({ state: 'visible', timeout: 10000 });

  console.log('Image and voice favorites open as clickable details with their date and time.');
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
