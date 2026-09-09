const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto('http://localhost:5199/#/auth/sign-in', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 15000 });
  const directChat = page.locator('.cursor-pointer').filter({ hasText: 'suxia' }).first();
  await directChat.waitFor({ state: 'visible', timeout: 30000 });
  await directChat.click();
  await page.waitForTimeout(1000);

  const settingsButton = page.getByRole('button', { name: '聊天设置', exact: true });
  await settingsButton.click();
  await page.waitForTimeout(500);

  for (const label of ['图片与视频', '阅后即焚', '消息免打扰', '置顶聊天', '搜索聊天记录', '清除聊天记录']) {
    if (!await page.getByText(label, { exact: true }).count()) {
      throw new Error(`Missing conversation setting: ${label}`);
    }
  }

  console.log('Chat settings route renders the reference controls.');
  await browser.close();
})().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
