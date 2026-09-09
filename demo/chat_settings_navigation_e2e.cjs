const { chromium } = require('playwright');
const TEXT = `settings-search-${Date.now()}`;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto('http://localhost:5199/#/auth/sign-in', { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('请输入手机号').waitFor({ state: 'visible', timeout: 20000 });
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 60000 });

  const directChat = page.locator('.cursor-pointer').filter({ hasText: 'suxia' }).first();
  await directChat.waitFor({ state: 'visible', timeout: 30000 });
  await directChat.click();
  const composer = page.getByPlaceholder('输入消息...');
  await composer.waitFor({ state: 'visible', timeout: 15000 });
  await composer.fill(TEXT);
  await composer.press('Enter');
  await page.locator('.break-words').filter({ hasText: TEXT }).waitFor({ state: 'visible', timeout: 15000 });
  await page.getByRole('button', { name: '聊天设置', exact: true }).click();

  await page.getByText('图片与视频', { exact: true }).click();
  await page.waitForURL(/#\/messages\/session\/.*\/settings\/media$/, { timeout: 5000 });
  await page.waitForTimeout(800);
  for (const label of ['全部', '图片', '视频', '档案']) {
    if (!await page.getByText(label, { exact: true }).count()) throw new Error(`Missing media filter: ${label}`);
  }

  await page.getByRole('button', { name: '返回聊天设置', exact: true }).click();
  await page.getByText('搜索聊天记录', { exact: true }).click();
  await page.waitForURL(/#\/messages\/session\/.*\/settings\/search$/, { timeout: 5000 });
  const searchInput = page.getByPlaceholder('搜索聊天记录');
  await searchInput.fill(TEXT);
  await searchInput.press('Enter');
  await page.getByRole('button', { name: new RegExp(TEXT) }).waitFor({ state: 'visible', timeout: 15000 });

  console.log('Media navigation and local chat-history search work through the conversation settings flow.');
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
