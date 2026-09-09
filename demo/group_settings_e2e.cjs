const { chromium } = require('playwright');
const GROUP_NAME = `群设置验证-${Date.now()}`;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto('http://localhost:5199/#/auth/sign-in', { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('请输入手机号').waitFor({ state: 'visible', timeout: 30000 });
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 60000 });

  await page.goto('http://localhost:5199/#/contact/create-group');
  await page.getByRole('button', { name: 'suxia', exact: true }).last().click();
  await page.getByPlaceholder('群名称').fill(GROUP_NAME);
  await page.getByRole('button', { name: /完成（1）/ }).click();
  await page.waitForURL(/#\/contact\/groups/, { timeout: 30000 });

  await page.goto('http://localhost:5199/#/messages');
  await page.getByRole('button', { name: '群聊', exact: true }).click();
  const groupChat = page.locator('.cursor-pointer').filter({ hasText: GROUP_NAME }).first();
  await groupChat.waitFor({ state: 'visible', timeout: 30000 });
  await groupChat.click();
  await page.getByRole('button', { name: '聊天设置', exact: true }).click();
  await page.waitForTimeout(800);

  for (const label of ['群组管理', '入群申请', '入群方式', '群公告', '群二维码', '我在本群的昵称', '图片与视频', '搜索聊天记录', '清除聊天记录', '消息免打扰', '置顶聊天']) {
    if (!await page.getByText(label, { exact: true }).count()) {
      throw new Error(`Missing group setting: ${label}`);
    }
  }
  if (await page.getByText('阅后即焚', { exact: true }).count()) {
    throw new Error('Group settings incorrectly show the direct-chat-only burn-after-reading option.');
  }

  console.log('Group settings render the reference group controls.');
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
