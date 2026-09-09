const { chromium } = require('playwright');
const BASE_URL = 'http://localhost:5199';

async function login(page, phone, password) {
  await page.goto(`${BASE_URL}/#/auth/sign-in`, { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('请输入手机号').waitFor({ state: 'visible', timeout: 30000 });
  if (phone) await page.getByPlaceholder('请输入手机号').fill(phone);
  if (password) await page.getByPlaceholder('请输入密码').fill(password);
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 60000 });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const senderContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const recipientContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const sender = await senderContext.newPage(); sender.on('console', m => { if (m.type() === 'error') console.error('[sender]', m.text()); });
  const recipient = await recipientContext.newPage(); recipient.on('console', m => { if (m.type() === 'error') console.error('[recipient]', m.text()); });
  await Promise.all([
    login(sender),
    login(recipient, '13700137000', 'test123456'),
  ]);
  await sender.goto(`${BASE_URL}/#/messages/session/si_3004649357_3540424232`);
  await sender.getByPlaceholder('输入消息...').waitFor({ state: 'visible', timeout: 15000 });
  await sender.getByRole('button', { name: '表情', exact: true }).click();
  await sender.getByText('😀', { exact: true }).first().click();
  await recipient.goto(`${BASE_URL}/#/messages/session/si_3004649357_3540424232`);
  await recipient.getByPlaceholder('输入消息...').waitFor({ state: 'visible', timeout: 15000 });
  await recipient.waitForTimeout(1800);
  if (!await recipient.locator('[data-message-type="face"]').count()) { console.error(await recipient.locator('body').innerText()); throw new Error('Recipient did not receive a native OpenIM face message.'); }
  console.log('Native face messages send and render through OpenIM.');
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
