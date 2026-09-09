const { chromium } = require('playwright');
const TEXT = `收藏验证-${Date.now()}`;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto('http://localhost:5199/#/auth/sign-in', { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('请输入手机号').waitFor({ state: 'visible', timeout: 30000 });
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 60000 });
  await page.evaluate(() => localStorage.removeItem('99chat_favorites'));

  await page.goto('http://localhost:5199/#/messages/session/si_3004649357_3540424232', { waitUntil: 'domcontentloaded' });
  const input = page.getByPlaceholder('输入消息...');
  await input.waitFor({ state: 'visible', timeout: 15000 });
  await input.fill(TEXT);
  await input.press('Enter');

  const message = page.locator('.break-words').filter({ hasText: TEXT }).last();
  await message.waitFor({ state: 'visible', timeout: 15000 });
  await message.click({ button: 'right' });
  await page.getByText('收藏', { exact: true }).click();
  await page.getByText('已收藏', { exact: true }).waitFor({ state: 'visible', timeout: 15000 });

  await page.goto('http://localhost:5199/#/settings/collections');
  await page.waitForTimeout(600);
  if (!await page.getByText(TEXT, { exact: true }).count()) {
    throw new Error('Favoriting a chat message did not make it available in 我的收藏.');
  }

  console.log('Favoriting a message persists and appears in 我的收藏.');
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
