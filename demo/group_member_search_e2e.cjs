const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto('http://localhost:5199/#/auth/sign-in', { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('请输入手机号').waitFor({ state: 'visible', timeout: 20000 });
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 60000 });

  await page.getByRole('button', { name: '群聊', exact: true }).click();
  const group = page.locator('.cursor-pointer').filter({ hasText: '端到端测试群' }).first();
  await group.waitFor({ state: 'visible', timeout: 30000 });
  await group.click();
  await page.getByRole('button', { name: '聊天设置', exact: true }).click();
  await page.getByText('群组管理', { exact: true }).click();

  const search = page.getByPlaceholder('搜索群成员');
  await search.fill('suxia');
  await search.press('Enter');
  await page.getByText('suxia', { exact: true }).waitFor({ state: 'visible', timeout: 15000 });
  if (await page.getByText('我', { exact: true }).count()) throw new Error('Member search did not filter unmatched members.');

  console.log('Group member search uses OpenIM and filters the visible member list.');
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
