const { chromium } = require('playwright');
const BASE = 'http://localhost:5199';
const CONVERSATION = 'si_3004649357_3540424232';
const TEXT = `recipient-sync-${Date.now()}`;

async function login(page, phone, password) {
  await page.goto(`${BASE}/#/auth/sign-in`);
  await page.getByPlaceholder('请输入手机号').waitFor({ state: 'visible', timeout: 20000 });
  await page.getByPlaceholder('请输入手机号').fill(phone);
  await page.getByPlaceholder('请输入密码').fill(password);
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 60000 });
}

async function waitForConversation(page, name) {
  await page.goto(`${BASE}/#/messages`);
  const row = page.locator('.cursor-pointer').filter({ hasText: name }).first();
  await row.waitFor({ state: 'visible', timeout: 30000 });
  return row;
}

function messageBubble(page, text) {
  return page.locator('.break-words').filter({ hasText: text });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const senderContext = await browser.newContext();
  const recipientContext = await browser.newContext();
  const sender = await senderContext.newPage();
  const recipient = await recipientContext.newPage();

  await Promise.all([
    login(sender, '13800138000', 'test123456'),
    login(recipient, '13700137000', 'test123456'),
  ]);

  await waitForConversation(sender, 'suxia');
  await waitForConversation(recipient, 'linwan');

  await sender.goto(`${BASE}/#/messages/session/${CONVERSATION}`);
  const composer = sender.getByPlaceholder('输入消息...');
  await composer.waitFor({ state: 'visible', timeout: 20000 });
  await composer.fill(TEXT);
  await composer.press('Enter');
  await messageBubble(sender, TEXT).waitFor({ state: 'visible', timeout: 15000 });

  await sender.getByRole('button', { name: '表情', exact: true }).click();
  await sender.getByText('😀', { exact: true }).first().click();
  await sender.locator('[data-message-type="face"]').last().waitFor({ state: 'visible', timeout: 15000 });

  const recipientRow = await waitForConversation(recipient, 'linwan');
  await recipientRow.click();
  await messageBubble(recipient, TEXT).waitFor({ state: 'visible', timeout: 30000 });
  await recipient.locator('[data-message-type="face"]').last().waitFor({ state: 'visible', timeout: 30000 });

  console.log(JSON.stringify({
    text: TEXT,
    senderText: await messageBubble(sender, TEXT).count(),
    senderFace: await sender.locator('[data-message-type="face"]').count(),
    recipientText: await messageBubble(recipient, TEXT).count(),
    recipientFace: await recipient.locator('[data-message-type="face"]').count(),
    recipientUrl: recipient.url(),
  }, null, 2));
  await browser.close();
})().catch(async (error) => { console.error(error); process.exit(1); });
