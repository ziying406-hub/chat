const { chromium } = require('playwright');

const BASE = 'http://localhost:5199';
const png = require('node:fs').readFileSync(require('node:path').join(__dirname, 'src/assets/hero.png'));

async function login(page) {
  await page.goto(`${BASE}/#/auth/sign-in`);
  await page.getByPlaceholder('请输入手机号').fill('13800138000');
  await page.getByPlaceholder('请输入密码').fill('test123456');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 60000 });
}

async function waitForUploadedImage(page) {
  await page.locator('img[src*="/object/"]').first().waitFor({ state: 'visible', timeout: 30000 });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.setDefaultTimeout(30000);
  await login(page);

  await page.goto(`${BASE}/#/settings/profile`);
  await page.locator('input[type="file"]').setInputFiles({ name: 'profile.png', mimeType: 'image/png', buffer: png });
  await waitForUploadedImage(page);

  const groupName = `头像验证群-${Date.now()}`;
  await page.goto(`${BASE}/#/contact/create-group`);
  await page.getByRole('button', { name: 'suxia', exact: true }).last().click();
  await page.getByPlaceholder('群名称').fill(groupName);
  await page.getByRole('button', { name: /完成（1）/ }).click();
  await page.waitForURL(/#\/contact\/groups/, { timeout: 30000 });
  await page.getByText(groupName, { exact: true }).click();
  const groupID = new URL(page.url()).hash.split('/').pop();
  await page.goto(`${BASE}/#/messages/groups/admin/${groupID}`);
  await page.getByRole('button', { name: '设置', exact: true }).last().click();
  await page.getByRole('button', { name: '更换头像', exact: true }).waitFor();
  await page.locator('input[type="file"]').setInputFiles({ name: 'group.png', mimeType: 'image/png', buffer: png });
  await page.getByText('群头像已更新', { exact: true }).waitFor();
  const avatar = page.getByRole('img', { name: '群头像', exact: true });
  await avatar.waitFor();
  await page.waitForFunction(() => {
    const image = document.querySelector('img[alt="群头像"]');
    return image?.src.includes('/object/') && image.naturalWidth > 0;
  });
  const savedURL = await avatar.getAttribute('src');
  await page.reload();
  await page.getByRole('button', { name: '设置', exact: true }).last().click();
  await page.waitForFunction((url) => {
    const image = document.querySelector('img[alt="群头像"]');
    return image?.src === url && image.naturalWidth > 0;
  }, savedURL, { timeout: 30000 });

  console.log('Profile and group avatars upload through OpenIM and render remote URLs.');
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
