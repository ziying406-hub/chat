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
  const conversation = page.locator('.cursor-pointer').filter({ hasText: 'suxia' }).first();
  await conversation.waitFor({ state: 'visible', timeout: 90000 });
  await conversation.click();
  await page.getByRole('button', { name: '聊天设置', exact: true }).click();

  const burnSwitch = page.getByText('阅后即焚', { exact: true }).locator('..').getByRole('switch');
  const initial = await burnSwitch.getAttribute('aria-checked');
  const expected = initial === 'true' ? 'false' : 'true';
  await burnSwitch.click();
  await page.waitForFunction(
    ({ expected }) => [...document.querySelectorAll('button[role="switch"]')]
      .find((button) => button.parentElement?.innerText === '阅后即焚')?.getAttribute('aria-checked') === expected,
    { expected },
    { timeout: 15000 },
  );
  await burnSwitch.click();
  await page.waitForFunction(
    ({ initial }) => [...document.querySelectorAll('button[role="switch"]')]
      .find((button) => button.parentElement?.innerText === '阅后即焚')?.getAttribute('aria-checked') === initial,
    { initial },
    { timeout: 15000 },
  );

  console.log('Burn-after-reading setting uses the SDK and restores its original state.');
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
