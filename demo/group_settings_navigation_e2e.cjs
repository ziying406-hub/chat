const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto('http://localhost:5199/#/auth/sign-in', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 15000 });
  await page.waitForTimeout(2000);

  const groupChat = page.locator('.cursor-pointer').filter({ hasText: '群' }).first();
  await groupChat.click();
  await page.getByRole('button', { name: '聊天设置', exact: true }).click();
  await page.waitForTimeout(800);
  await page.getByText('入群申请', { exact: true }).click();
  await page.waitForURL(/#\/messages\/groups\/admin\/.*\?tab=applications$/, { timeout: 5000 });
  if (!await page.getByRole('button', { name: /入群申请/, exact: false }).count()) {
    throw new Error('Group application setting did not open the real group-management application tab.');
  }

  console.log('Group application settings open the existing OpenIM-backed management screen.');
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
