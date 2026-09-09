const { chromium } = require('playwright');
const BASE = 'http://localhost:5199';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto(`${BASE}/#/auth/sign-in`);
    await page.getByRole('button', { name: '登录', exact: true }).click();
    await page.waitForURL(/#\/messages/, { timeout: 60000 });

    const rows = page.locator('.cursor-pointer');
    await rows.first().waitFor({ state: 'visible', timeout: 30000 });
    const before = await rows.count();
    await rows.first().click();
    await page.getByRole('button', { name: '聊天设置', exact: true }).click();
    await page.getByText('隐藏聊天', { exact: true }).click();
    await page.getByRole('button', { name: '隐藏', exact: true }).click();
    await page.waitForURL(/#\/messages$/, { timeout: 10000 });
    await page.waitForFunction((expected) => document.querySelectorAll('.cursor-pointer').length === expected, before - 1);

    console.log('Conversation hides from the list without deletion.');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exit(1); });
