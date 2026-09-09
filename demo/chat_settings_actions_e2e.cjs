const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto('http://localhost:5199/#/auth/sign-in', { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('请输入手机号').waitFor({ state: 'visible', timeout: 20000 });
  await page.getByPlaceholder('请输入手机号').fill('13800138000');
  await page.getByPlaceholder('请输入密码').fill('test123456');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 60000 });

  const directChat = page.locator('.cursor-pointer').filter({ hasText: 'suxia' }).first();
  await directChat.waitFor({ state: 'visible', timeout: 90000 });
  await directChat.click();
  await page.getByRole('button', { name: '聊天设置', exact: true }).click();

  const muteSwitch = page.getByText('消息免打扰', { exact: true }).locator('..').getByRole('switch');
  const pinSwitch = page.getByText('置顶聊天', { exact: true }).locator('..').getByRole('switch');
  const initialMute = await muteSwitch.getAttribute('aria-checked');
  const initialPin = await pinSwitch.getAttribute('aria-checked');
  const opposite = (value) => value === 'true' ? 'false' : 'true';
  const waitForChecked = async (control, expected) => {
    const label = await control.locator('..').innerText();
    await control.page().waitForFunction(
      ({ expected, label }) => [...document.querySelectorAll('button[role="switch"]')]
        .find((button) => button.parentElement?.innerText === label)?.getAttribute('aria-checked') === expected,
      { expected, label },
      { timeout: 15000 },
    );
  };

  await muteSwitch.click();
  await waitForChecked(muteSwitch, opposite(initialMute));

  await pinSwitch.click();
  await waitForChecked(pinSwitch, opposite(initialPin));

  // Restore the user’s original conversation settings after exercising the real APIs.
  await muteSwitch.click();
  await waitForChecked(muteSwitch, initialMute);
  await pinSwitch.click();
  await waitForChecked(pinSwitch, initialPin);

  console.log('Mute and pin controls call the SDK and update the active conversation state.');
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
