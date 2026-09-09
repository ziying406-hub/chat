const { chromium } = require('playwright');
const BASE = 'http://localhost:5199';
const CONVERSATION = 'si_3004649357_3540424232';
const TEXT = `live-delivery-${Date.now()}`;

async function login(page, phone) {
  await page.goto(`${BASE}/#/auth/sign-in`);
  await page.getByPlaceholder('请输入手机号').waitFor({ state: 'visible', timeout: 20000 });
  await page.getByPlaceholder('请输入手机号').fill(phone);
  await page.getByPlaceholder('请输入密码').fill('test123456');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 60000 });
}
async function openConversation(page, name) {
  const row = page.locator('.cursor-pointer').filter({ hasText: name }).first();
  await row.waitFor({ state: 'visible', timeout: 90000 });
  await row.click();
  await page.getByPlaceholder('输入消息...').waitFor({ state: 'visible', timeout: 20000 });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const sender = await (await browser.newContext()).newPage();
  const recipient = await (await browser.newContext()).newPage();
  await Promise.all([login(sender, '13800138000'), login(recipient, '13700137000')]);
  await Promise.all([openConversation(sender, 'suxia'), openConversation(recipient, 'linwan')]);

  const senderComposer = sender.getByPlaceholder('输入消息...');
  await senderComposer.fill(TEXT);
  await senderComposer.press('Enter');
  await sender.getByRole('button', { name: '表情', exact: true }).click();
  await sender.getByText('😀', { exact: true }).first().click();

  const recipientText = recipient.locator('div').filter({ hasText: new RegExp(`^${TEXT}$`) }).last();
  await recipientText.waitFor({ state: 'visible', timeout: 90000 });
  await recipient.locator('[data-message-type="face"]').last().waitFor({ state: 'visible', timeout: 90000 });
  console.log(JSON.stringify({
    text: TEXT,
    senderText: await sender.locator('div').filter({ hasText: new RegExp(`^${TEXT}$`) }).count(),
    senderFaces: await sender.locator('[data-message-type="face"]').count(),
    recipientText: await recipientText.count(),
    recipientFaces: await recipient.locator('[data-message-type="face"]').count(),
    recipientURL: recipient.url(),
  }, null, 2));
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
