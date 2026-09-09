const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const BASE = 'http://localhost:5199';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);
  try {
    await page.goto(`${BASE}/#/auth/sign-in`);
    await page.getByPlaceholder('请输入手机号').fill('13800138000');
    await page.getByPlaceholder('请输入密码').fill('test123456');
    await page.getByRole('button', { name: '登录', exact: true }).click();
    await page.locator('.cursor-pointer').first().waitFor({ state: 'visible' });

    const hasStrayZero = await page.locator('.cursor-pointer').evaluateAll((rows) => rows.some((row) =>
      [...row.querySelectorAll('.flex.items-center.gap-1.min-w-0')]
        .some((header) => [...header.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim() === '0'))
    ));
    assert.equal(hasStrayZero, false, 'A non-muted conversation must not render a bare 0 after its name.');
    console.log('Conversation names do not include a zero mute indicator.');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exit(1); });
