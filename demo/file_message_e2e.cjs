const { chromium } = require('playwright');
const BASE = 'http://localhost:5199';
const NAME = `附件验证-${Date.now()}.txt`;
const CONTENT = 'OpenIM file attachment verification';

async function login(page, phone) {
  await page.goto(`${BASE}/#/auth/sign-in`);
  await page.getByPlaceholder('请输入手机号').fill(phone);
  await page.getByPlaceholder('请输入密码').fill('test123456');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 60000 });
}
async function openConversation(page) {
  await page.goto(`${BASE}/#/messages/session/si_3004649357_3540424232`, { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('输入消息...').waitFor({ state: 'visible', timeout: 15000 });
}
async function waitForRemoteURL(locator) {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    const href = await locator.getAttribute('href');
    if (href && !href.startsWith('blob:')) return href;
    await locator.page().waitForTimeout(500);
  }
  throw new Error('File message did not receive a remote download URL.');
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const sender = await (await browser.newContext()).newPage();
  const recipient = await (await browser.newContext()).newPage();
  await Promise.all([login(sender, '13800138000'), login(recipient, '13700137000')]);
  await Promise.all([openConversation(sender), openConversation(recipient)]);
  await sender.getByRole('button', { name: '附件', exact: true }).click();
  await sender.getByText('文件', { exact: true }).click();
  await sender.locator('input[type="file"]').nth(1).setInputFiles({ name: NAME, mimeType: 'text/plain', buffer: Buffer.from(CONTENT) });
  const senderFile = sender.locator('[data-message-type="file"]').filter({ hasText: NAME }).last();
  await senderFile.waitFor({ state: 'visible', timeout: 30000 });
  const senderURL = await waitForRemoteURL(senderFile);
  const recipientFile = recipient.locator('[data-message-type="file"]').filter({ hasText: NAME }).last();
  await recipientFile.waitFor({ state: 'visible', timeout: 60000 });
  const recipientURL = await waitForRemoteURL(recipientFile);
  if (recipientURL !== senderURL) throw new Error('Recipient did not receive the same uploaded file URL.');
  console.log(JSON.stringify({ name: NAME, url: senderURL, sender: true, recipient: true }, null, 2));
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
