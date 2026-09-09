const { chromium } = require('playwright');
const BASE_URL = 'http://localhost:5199';
const ORIGINAL = `资料验证群-${Date.now()}`;
const RENAMED = `${ORIGINAL}-已更新`;
const NOTICE = `公告-${Date.now()}`;
const INTRO = `简介-${Date.now()}`;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('console', (message) => { if (message.type() === 'error') console.error('[browser]', message.text()); });
  await page.goto(`${BASE_URL}/#/auth/sign-in`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1800);
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 15000 });

  await page.goto(`${BASE_URL}/#/contact/create-group`);
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: 'suxia', exact: true }).last().click();
  await page.getByPlaceholder('群名称').fill(ORIGINAL);
  await page.getByRole('button', { name: /完成（1）/ }).click();
  await page.waitForURL(/#\/contact\/groups/, { timeout: 15000 });
  await page.getByText(ORIGINAL, { exact: true }).click();
  await page.getByText('群管理', { exact: true }).click();
  await page.getByRole('button', { name: '设置', exact: true }).nth(1).click();

  const inputs = page.locator('input');
  await inputs.last().fill(RENAMED);
  const textareas = page.locator('textarea');
  await textareas.nth(0).fill(NOTICE);
  await textareas.nth(1).fill(INTRO);
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await page.waitForTimeout(1000);

  await page.goto(`${BASE_URL}/#/contact/groups`);
  const renamedGroup = page.getByText(RENAMED, { exact: true });
  await renamedGroup.waitFor({ state: 'visible', timeout: 8000 });
  await renamedGroup.click();
  await page.waitForURL(/#\/contact\/group\//, { timeout: 5000 });
  await page.waitForTimeout(500);
  await page.getByText(NOTICE, { exact: true }).waitFor({ state: 'visible', timeout: 8000 });
  await page.getByText(INTRO, { exact: true }).waitFor({ state: 'visible', timeout: 8000 });

  console.log('Group name, announcement, and introduction persist through OpenIM.');
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
