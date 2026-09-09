const { chromium } = require('playwright');

const BASE = 'http://localhost:5199';
const CONVERSATION = 'si_3004649357_3540424232';
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL3VQAAAABJRU5ErkJggg==', 'base64');
const filename = `e2e-sticker-${Date.now()}.png`;

async function login(page, phone) {
  await page.goto(`${BASE}/#/auth/sign-in`);
  await page.getByPlaceholder('请输入手机号').waitFor({ state: 'visible', timeout: 20000 });
  await page.getByPlaceholder('请输入手机号').fill(phone);
  await page.getByPlaceholder('请输入密码').fill('test123456');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 60000 });
}

async function openConversation(page, userID) {
  await page.goto(`${BASE}/#/contact/user/${userID}`);
  await page.getByRole("button", { name: "发消息", exact: true }).waitFor({ state: "visible", timeout: 90000 });
  await page.getByRole("button", { name: "发消息", exact: true }).click();
  await page.waitForURL(/#\/messages\/session\//, { timeout: 30000 });
  await page.getByPlaceholder("输入消息...").waitFor({ state: "visible", timeout: 20000 });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const sender = await (await browser.newContext()).newPage();
  const recipient = await (await browser.newContext()).newPage();
  await Promise.all([login(sender, '13800138000'), login(recipient, '13700137000')]);

  await sender.goto(`${BASE}/#/settings/messaging/emojis`);
  const upload = sender.locator('input[type="file"]');
  await upload.setInputFiles({ name: filename, mimeType: 'image/png', buffer: png });
  const sticker = sender.getByAltText(filename);
  try { await sticker.waitFor({ state: 'visible', timeout: 30000 }); } catch (error) { throw new Error(`Upload did not finish: ${await sender.locator('body').innerText()}`); }
  const imageURL = await sticker.getAttribute('src');
  if (!imageURL) throw new Error('The uploaded emoji has no image URL.');

  await Promise.all([openConversation(sender, '3540424232'), openConversation(recipient, '3004649357')]);
  await sender.getByRole('button', { name: '表情', exact: true }).click();
  await sender.getByText('我的', { exact: true }).click();
  await sender.getByRole('button', { name: `发送 ${filename}`, exact: true }).click();
  await sender.locator(`[data-message-type="face"] img[src="${imageURL}"]`).waitFor({ state: 'visible', timeout: 30000 });
  await recipient.locator(`[data-message-type="face"] img[src="${imageURL}"]`).waitFor({ state: 'visible', timeout: 90000 });

  await sender.goto(`${BASE}/#/settings/messaging/emojis`);
  const managedSticker = sender.getByAltText(filename);
  await managedSticker.waitFor({ state: 'visible', timeout: 30000 });
  await managedSticker.hover();
  await sender.getByRole('button', { name: `删除 ${filename}`, exact: true }).click();
  await sender.getByAltText(filename).waitFor({ state: 'detached', timeout: 10000 });

  console.log(JSON.stringify({ filename, imageURL, senderReceived: true, recipientReceived: true, deleted: true }, null, 2));
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
