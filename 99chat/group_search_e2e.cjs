const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('http://localhost:5199/#/auth/sign-in', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 15000 });

  await page.goto('http://localhost:5199/#/contact/search/group');
  await page.getByPlaceholder('输入群名称').fill('端到端测试群');
  await page.getByRole('button', { name: '搜索', exact: true }).click();
  await page.waitForTimeout(900);
  if (!await page.getByText('端到端测试群', { exact: true }).count()) throw new Error('OpenIM group search did not return a matching group.');

  console.log('OpenIM group search returns matching groups.');
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
