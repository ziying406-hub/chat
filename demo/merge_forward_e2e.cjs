const { chromium } = require('playwright');
const TARGET_GROUP = `合并转发目标群-${Date.now()}`;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto('http://localhost:5199/#/auth/sign-in', { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('请输入手机号').waitFor({ state: 'visible', timeout: 20000 });
  await page.getByPlaceholder('请输入手机号').fill('13800138000');
  await page.getByPlaceholder('请输入密码').fill('test123456');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 60000 });

  await page.goto('http://localhost:5199/#/contact/create-group');
  await page.getByRole('button', { name: 'suxia', exact: true }).last().click();
  await page.getByPlaceholder('群名称').fill(TARGET_GROUP);
  await page.getByRole('button', { name: /完成（1）/ }).click();
  await page.waitForURL(/#\/contact\/groups/, { timeout: 30000 });
  await page.getByText(TARGET_GROUP, { exact: true }).click();
  const groupID = page.url().split('/').pop();

  await page.goto('http://localhost:5199/#/messages/session/si_3004649357_3540424232', { waitUntil: 'domcontentloaded' });
  const sourceA = `合并来源A ${Date.now()}`;
  const sourceB = `合并来源B ${Date.now()}`;
  const input = page.getByPlaceholder('输入消息...');
  await input.fill(sourceA);
  await input.press('Enter');
  await page.waitForTimeout(500);
  await input.fill(sourceB);
  await input.press('Enter');
  await page.waitForTimeout(700);

  await page.getByRole('button', { name: '更多聊天操作', exact: true }).click();
  await page.getByRole('button', { name: '多选', exact: true }).click();
  if (!await page.getByText('已选择 0 条', { exact: true }).count()) throw new Error('Multi-select mode did not open.');
  await page.getByRole('button', { name: /选择消息/ }).nth(0).click();
  await page.getByRole('button', { name: /选择消息/ }).nth(1).click();
  if (!await page.getByText('已选择 2 条', { exact: true }).count()) throw new Error('Could not select two messages for merging.');
  await page.getByRole('button', { name: '转发', exact: true }).click();
  if (!await page.getByText('合并转发', { exact: true }).count()) throw new Error('Multi-select forwarding did not open the merged-forward flow.');
  if (!await page.getByText(sourceA, { exact: true }).count() || !await page.getByText(sourceB, { exact: true }).count()) throw new Error('The source messages were not available for merging.');

  const targetGroup = page.getByRole('button', { name: TARGET_GROUP, exact: true });
  await targetGroup.click();
  await page.waitForTimeout(1000);
  if (!await page.getByText('转发成功', { exact: true }).count()) throw new Error('The SDK did not confirm merged forwarding.');

  await page.goto(`http://localhost:5199/#/messages/session/sg_${groupID}`, { waitUntil: 'domcontentloaded' });
  await page.getByText('linwan的聊天记录', { exact: true }).waitFor({ state: 'visible', timeout: 30000 });

  console.log('Merged forwarding creates, sends, and renders a real OpenIM merge message.');
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
