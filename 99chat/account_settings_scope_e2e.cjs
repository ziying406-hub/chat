const { chromium } = require('playwright');

const BASE = 'http://localhost:5199';

async function hasPrimary(locator) {
  return locator.evaluate((element) => element.className.includes('bg-primary-500'));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`${BASE}/#/auth/sign-in`);
  await page.getByPlaceholder('请输入手机号').fill('13800138000');
  await page.getByPlaceholder('请输入密码').fill('test123456');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 60000 });
  await page.evaluate(() => {
    localStorage.setItem('99chat_friend_verification', 'false');
    localStorage.setItem('99chat_group_verification', 'false');
    localStorage.setItem('99chat_show_online', 'false');
    localStorage.setItem('99chat_mute_all', 'true');
    localStorage.setItem('99chat_sound_enabled', 'false');
    localStorage.setItem('99chat_vibrate_enabled', 'false');
  });

  await page.goto(`${BASE}/#/settings/privacy`);
  for (const label of ['加我为好友需验证', '邀请我加入群聊需验证', '展示在线状态']) {
    const toggle = page.getByText(label, { exact: true }).locator('xpath=..').getByRole('button');
    if (!await hasPrimary(toggle)) throw new Error(`${label} inherited another account's disabled setting.`);
  }

  await page.goto(`${BASE}/#/settings/notifications`);
  const mute = page.getByText('消息免打扰', { exact: true }).locator('xpath=..').getByRole('button');
  const sound = page.getByText('声音', { exact: true }).locator('xpath=../..').getByRole('button');
  const vibrate = page.getByText('震动', { exact: true }).locator('xpath=../..').getByRole('button');
  if (await hasPrimary(mute)) throw new Error('Mute-all inherited another account\'s setting.');
  if (!await hasPrimary(sound) || !await hasPrimary(vibrate)) throw new Error('Notification preferences inherited another account\'s setting.');

  console.log('Privacy and notification preferences from another account are not applied.');
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
