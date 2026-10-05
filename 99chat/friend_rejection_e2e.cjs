// Uses explicitly authorized independent fixtures from friend_delete_e2e.cjs.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const { randomUUID } = require('node:crypto');
const BASE = process.env.E2E_BASE || 'http://localhost:5199';
const API = process.env.E2E_IM_API || (BASE.startsWith('https://') ? `${BASE}/api` : 'http://localhost:10002');
assert.ok(process.env.TEST_FIXTURES, 'Independent TEST_FIXTURES are required');
const [a, b] = JSON.parse(fs.readFileSync(process.env.TEST_FIXTURES));
async function request(user, path, body) {
  const result = await (await fetch(`${API}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', operationID: randomUUID(), token: user.imToken }, body: JSON.stringify(body) })).json();
  assert.equal(result.errCode, 0, result.errMsg);
  return result.data;
}
(async () => {
  for (const [user, peer] of [[a, b], [b, a]]) {
    const relation = await request(user, '/friend/is_friend', { userID1: user.userID, userID2: peer.userID });
    if (relation.inUser1Friends) await request(user, '/friend/delete_friend', { ownerUserID: user.userID, friendUserID: peer.userID });
  }
  const browser = await chromium.launch({ headless: true });
  async function login(user) {
    const context = await browser.newContext();
    const page = await context.newPage();
    page.setDefaultTimeout(45000);
    await page.addInitScript(auth => localStorage.setItem('99chat_session', JSON.stringify(auth)), user);
    await page.goto(`${BASE}/#/contact/requests`);
    await page.getByRole('button', { name: '扫一扫', exact: true }).waitFor();
    return page;
  }
  try {
    let pa = await login(a);
    const pb = await login(b);
    async function apply() {
      await pa.goto(`${BASE}/#/contact/requests`);
      await pa.getByRole('button', { name: '扫一扫', exact: true }).click();
      await pa.getByPlaceholder('输入用户 ID').fill(b.userID);
      await pa.getByRole('button', { name: '发送申请', exact: true }).click();
      await pa.getByText('好友申请已发送，等待对方确认', { exact: true }).waitFor();
    }
    await apply();
    await pb.goto(`${BASE}/#/contact/requests`);
    await pb.getByRole('button', { name: `拒绝 ${a.nickname}`, exact: true }).click();
    await pa.getByRole('status').filter({ hasText: `${b.nickname}拒绝了你的好友申请` }).waitFor({ timeout: 15000 });
    await pa.getByRole('button', { name: '我发出的', exact: true }).click();
    await pa.getByText('对方已拒绝', { exact: true }).waitFor();
    await pa.reload();
    await pa.getByRole('button', { name: '我发出的', exact: true }).click();
    await pa.getByText('对方已拒绝', { exact: true }).waitFor();
    // Retry the native request, then disconnect the applicant before rejection.
    await apply();
    await pa.context().close();
    await pb.getByRole('button', { name: `拒绝 ${a.nickname}`, exact: true }).click();
    await pb.getByRole('button', { name: '已处理', exact: true }).click();
    await pb.getByText('已拒绝', { exact: true }).waitFor();
    pa = await login(a);
    await pa.getByRole('button', { name: '我发出的', exact: true }).click();
    await pa.getByText('对方已拒绝', { exact: true }).waitFor();
    // A later accepted request must replace the rejected status and restore friendship.
    await apply();
    await pb.getByRole('button', { name: /^待处理/ }).click();
    await pb.getByRole('button', { name: `同意 ${a.nickname}`, exact: true }).click();
    await pa.getByRole('button', { name: '我发出的', exact: true }).click();
    await pa.getByText('对方已同意', { exact: true }).waitFor();
    await pa.goto(`${BASE}/#/contact/user/${b.userID}`);
    await pa.getByRole('button', { name: '发消息', exact: true }).waitFor();
    console.log('PASS native rejection via ×, applicant live notice, refresh/offline recovery, and later accepted request');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
