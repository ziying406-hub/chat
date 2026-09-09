const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5199';
const MESSAGE = `批量发送验证 ${Date.now()}`;

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
  const sender = await senderContext.newPage();
  const recipient = await recipientContext.newPage();

  await Promise.all([
    login(sender),
    login(recipient, '13700137000', 'test123456'),
  ]);
  await sender.goto(`${BASE_URL}/#/settings/messaging/batch`, { waitUntil: 'domcontentloaded' });
  await sender.getByRole('button', { name: '新建群发', exact: true }).click();
  await sender.waitForURL(/#\/settings\/messaging\/batch\/create$/, { timeout: 5000 });

  await sender.getByText('suxia').waitFor({ state: 'visible', timeout: 30000 });
  await sender.getByRole('checkbox').first().check();

  await sender.getByPlaceholder('输入群发内容').fill(MESSAGE);
  await sender.getByRole('button', { name: '发送', exact: true }).click();
  await sender.waitForURL(/#\/settings\/messaging\/batch\/batch_/, { timeout: 30000 });
  await sender.getByText('群发详情', { exact: true }).waitFor({ state: 'visible', timeout: 15000 });

  if (!await sender.getByText(MESSAGE, { exact: true }).count()) throw new Error('Batch preview does not show the sent message.');
  const sentCount = await sender.locator('span').filter({ hasText: '已发送' }).count();
  if (sentCount !== 1) {
    console.error(sender.url());
    console.error(await sender.locator('body').innerText());
    throw new Error(`The batch task does not record one successful recipient send (found ${sentCount}).`);
  }

  await recipient.goto(`${BASE_URL}/#/messages/session/si_3004649357_3540424232`, { waitUntil: 'domcontentloaded' });
  await recipient.getByPlaceholder('输入消息...').waitFor({ state: 'visible', timeout: 15000 });
  await recipient.locator('.break-words').filter({ hasText: MESSAGE }).waitFor({ state: 'visible', timeout: 30000 });

  console.log('Batch assistant sends a real message to the selected recipient and records the successful recipient result.');
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
