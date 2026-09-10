const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const BASE = 'http://localhost:5199';

async function login(page, phone) {
  page.setDefaultTimeout(30000);
  await page.goto(`${BASE}/#/auth/sign-in`);
  await page.getByPlaceholder('请输入手机号').fill(phone);
  await page.getByPlaceholder('请输入密码').fill('test123456');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 60000 });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const owner = await (await browser.newContext()).newPage();
    const member = await (await browser.newContext()).newPage();
    await login(owner, '13800138000');
    const name = `权限验证-${Date.now()}`;
    await owner.goto(`${BASE}/#/contact/create-group`);
    await owner.getByRole('button', { name: 'suxia', exact: true }).last().click();
    await owner.getByPlaceholder('群名称').fill(name);
    await owner.getByRole('button', { name: /完成（1）/ }).click();
    await owner.waitForURL(/#\/contact\/groups/);
    await owner.getByText(name, { exact: true }).click();
    const groupID = new URL(owner.url()).hash.split('/').pop();
    const url = `${BASE}/#/messages/groups/admin/${groupID}`;
    await login(member, '13700137000');
    await member.goto(`${BASE}/#/settings/profile`);
    await member.getByText('3540424232', { exact: true }).waitFor();
    await member.goto(`${BASE}/#/contact/groups`);
    await member.getByText(name, { exact: true }).click();
    await member.goto(`${url}?tab=applications`);
    await member.getByRole('heading', { name: '群管理', exact: true }).waitFor();
    await member.getByRole('button', { name: '设置', exact: true }).last().click();
    assert.equal(await member.getByRole('button', { name: '入群申请', exact: true }).count(), 0);
    assert.equal(await member.getByRole('button', { name: '保存', exact: true }).count(), 0);
    assert.equal(await member.getByRole('button', { name: '更换头像', exact: true }).count(), 0);
    assert.equal(await member.locator('input[readonly]').count(), 1);
    assert.equal(await member.locator('textarea[readonly]').count(), 2);
    const rejected = await member.evaluate(async (groupID) => {
      const { getIMSDK } = await import('/src/services/openim.ts');
      try {
        const result = await getIMSDK().setGroupInfo({ groupID, introduction: 'must be rejected' });
        return { errCode: result.errCode, errMsg: result.errMsg };
      } catch (error) { return { errCode: error.errCode, errMsg: error.errMsg }; }
    }, groupID);
    assert.ok(rejected.errCode, 'OpenIM must reject ordinary member group modifications');
    assert.match(rejected.errMsg || '', /permission|owner|admin/i, 'Must fail for permission, not a network error');
    await owner.goto(url);
    await owner.getByRole('button', { name: /^设为管理员 / }).click();
    await owner.getByRole('button', { name: /^取消管理员 / }).waitFor();
    await member.getByRole('button', { name: '更换头像', exact: true }).waitFor();
    assert.equal(await member.locator('textarea[readonly]').count(), 0);
    assert.equal(await member.getByRole('button', { name: '解散群组', exact: true }).count(), 0);
    await member.locator('textarea').last().fill('管理员更新简介');
    await member.getByRole('button', { name: '保存', exact: true }).click();
    await member.reload();
    await member.getByRole('button', { name: '设置', exact: true }).last().click();
    await member.waitForFunction(() => [...document.querySelectorAll('textarea')].some(el => el.value === '管理员更新简介'));
    await owner.getByRole('button', { name: /^转让群主 / }).waitFor();
    await owner.getByRole('button', { name: /^取消管理员 / }).click();
    await member.getByRole('button', { name: '更换头像', exact: true }).waitFor({ state: 'detached' });
    assert.equal(await member.getByRole('button', { name: '保存', exact: true }).count(), 0);
    console.log('PASS: ordinary member readonly and API rejection; administrator edit persisted; demotion removes permissions; owner can transfer to administrator');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
