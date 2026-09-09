const { chromium } = require('playwright');
const BASE = 'http://localhost:5199';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`${BASE}/#/auth/sign-in`);
  await page.getByPlaceholder('请输入手机号').fill('13800138000');
  await page.getByPlaceholder('请输入密码').fill('test123456');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 60000 });

  await page.goto(`${BASE}/#/messages`);
  const groupConversation = page.locator('.cursor-pointer').filter({ hasText: '端到端测试群' }).first();
  await groupConversation.waitFor({ state: 'visible', timeout: 90000 });
  await groupConversation.click();
  await page.waitForURL(/#\/messages\/session\/sg_\d+$/, { timeout: 15000 });
  const groupID = page.url().match(/session\/sg_(\d+)$/)?.[1];
  if (!groupID) throw new Error('Expected an existing group conversation.');
  await page.goto(`${BASE}/#/contact/group/${groupID}`);
  const muteButton = page.getByRole('button', { name: /^(消息免打扰|解除免打扰)$/, exact: false });
  await muteButton.waitFor({ state: 'visible', timeout: 15000 });
  const initialLabel = await muteButton.innerText();
  const changedLabel = initialLabel === '消息免打扰' ? '解除免打扰' : '消息免打扰';
  await muteButton.click();
  await page.getByRole('button', { name: changedLabel, exact: true }).waitFor({ state: 'visible', timeout: 15000 });
  await page.getByRole('button', { name: changedLabel, exact: true }).click();
  await page.getByRole('button', { name: initialLabel, exact: true }).waitFor({ state: 'visible', timeout: 15000 });

  console.log('Existing group detail mute setting uses the OpenIM conversation record and restores its state.');
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
