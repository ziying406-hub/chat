const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:5199';
const GROUP_NAME = `申请处理验证群-${Date.now()}`;

async function login(page, phone, password) {
  await page.goto(`${BASE_URL}/#/auth/sign-in`, { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('请输入手机号').waitFor({ state: 'visible', timeout: 20000 });
  await page.getByPlaceholder('请输入手机号').fill(phone || '13800138000');
  await page.getByPlaceholder('请输入密码').fill(password || 'test123456');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 60000 });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ownerContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const applicantContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const owner = await ownerContext.newPage();
  const applicant = await applicantContext.newPage();

  await login(owner);
  await owner.goto(`${BASE_URL}/#/contact/create-group`);
  const invitee = owner.getByText('qq', { exact: true }).last();
  await invitee.waitFor({ state: 'visible', timeout: 90000 });
  await invitee.click();
  await owner.getByPlaceholder('群名称').fill(GROUP_NAME);
  await owner.getByRole('button', { name: /完成（1）/ }).click();
  await owner.waitForURL(/#\/contact\/groups/, { timeout: 15000 });
  await owner.getByText(GROUP_NAME, { exact: true }).click();
  const groupID = new URL(await owner.url()).hash.match(/\/contact\/group\/([^?]+)/)?.[1];
  if (!groupID) throw new Error('Could not resolve created group ID.');

  await owner.getByText('入群方式', { exact: true }).click();
  await owner.getByText('申请和邀请均需审批', { exact: true }).click();
  await owner.getByText('申请和邀请均需审批', { exact: true }).last().waitFor({ state: 'visible', timeout: 15000 });
  await login(applicant, '13700137000', 'test123456');
  const joinResult = await applicant.evaluate(async (targetGroupID) => {
    const { getIMSDK } = await import('/src/services/openim.ts');
    const result = await getIMSDK().joinGroup({ groupID: targetGroupID, reqMsg: '申请加入验证群', joinSource: 3 });
    return { errCode: result.errCode, errMsg: result.errMsg };
  }, groupID);
  if (joinResult.errCode !== 0) throw new Error(`Join request failed: ${joinResult.errMsg || joinResult.errCode}`);
  await owner.goto(`${BASE_URL}/#/messages/groups/admin/${groupID}?tab=applications`);

  const accept = owner.getByRole('button', { name: '同意 3540424232', exact: true });
  await accept.waitFor({ state: 'visible', timeout: 30000 });
  await accept.click();
  await applicant.goto(`${BASE_URL}/#/contact/groups`);
  await applicant.getByText(GROUP_NAME, { exact: true }).waitFor({ state: 'visible', timeout: 30000 });
  const applicantGroups = await applicant.locator('body').innerText();
  if (!applicantGroups.includes(GROUP_NAME)) { console.error('EXPECTED', GROUP_NAME); console.error(applicantGroups); throw new Error('Accepted applicant did not join the group.'); }
  console.log('Group owner can approve an OpenIM group application and the applicant joins.');
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
