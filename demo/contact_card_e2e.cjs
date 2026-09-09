const { chromium } = require('playwright');
const BASE = 'http://localhost:5199';
const CONVERSATION = 'si_3004649357_3540424232';

async function login(page, phone) {
  await page.goto(`${BASE}/#/auth/sign-in`);
  await page.getByPlaceholder('请输入手机号').fill(phone);
  await page.getByPlaceholder('请输入密码').fill('test123456');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 60000 });
}
async function openConversation(page, name) {
  const row = page.locator('.cursor-pointer').filter({ hasText: name }).first();
  await row.waitFor({ state: 'visible', timeout: 90000 });
  await row.click();
  await page.getByPlaceholder('输入消息...').waitFor({ state: 'visible', timeout: 15000 });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const sender = await (await browser.newContext()).newPage();
  const recipient = await (await browser.newContext()).newPage();
  await Promise.all([login(sender, '13800138000'), login(recipient, '13700137000')]);
  await Promise.all([openConversation(sender, 'suxia'), openConversation(recipient, 'linwan')]);

  await sender.getByRole('button', { name: '附件', exact: true }).click();
  await sender.getByText('发送名片', { exact: true }).click();
  await sender.getByRole('button', { name: '发送 suxia 的名片', exact: true }).click();
  const senderCard = sender.locator('[data-message-type="contact-card"]').filter({ hasText: 'suxia' }).last();
  await senderCard.waitFor({ state: 'visible', timeout: 30000 });
  const recipientCard = recipient.locator('[data-message-type="contact-card"]').filter({ hasText: 'suxia' }).last();
  await recipientCard.waitFor({ state: 'visible', timeout: 30000 });
  console.log(JSON.stringify({ senderCards: await senderCard.count(), recipientCards: await recipientCard.count(), recipientURL: recipient.url() }, null, 2));
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
