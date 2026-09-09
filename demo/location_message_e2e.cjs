const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:5199';

async function login(page, phone, password) {
  await page.goto(`${BASE_URL}/#/auth/sign-in`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  if (phone) await page.getByPlaceholder('请输入手机号').fill(phone);
  if (password) await page.getByPlaceholder('请输入密码').fill(password);
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 15000 });
  await page.waitForTimeout(1800);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const senderContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    permissions: ['geolocation'],
    geolocation: { latitude: 3.139, longitude: 101.6869 },
  });
  const recipientContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const sender = await senderContext.newPage();
  const recipient = await recipientContext.newPage();

  await login(sender);
  await login(recipient, '13700137000', 'test123456');

  const directChat = sender.locator('.cursor-pointer').filter({ hasText: 'suxia' }).first();
  if (!await directChat.count()) throw new Error('The test recipient conversation is not available.');
  await directChat.click();
  await sender.getByRole('button', { name: '附件', exact: true }).click();
  await sender.getByRole('button', { name: '发送位置', exact: true }).click();

  await recipient.goto(`${BASE_URL}/#/messages`);
  await recipient.waitForTimeout(2600);
  const senderConversation = recipient.locator('.cursor-pointer').filter({ hasText: 'linwan' }).first();
  if (!await senderConversation.count()) throw new Error('Recipient did not receive the sender conversation.');
  await senderConversation.click();
  await recipient.waitForTimeout(1000);
  if (!await recipient.getByText('我的位置', { exact: true }).count()) throw new Error('Recipient did not receive a rendered location message.');

  console.log('Location attachment sends and renders through the real OpenIM message flow.');
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
