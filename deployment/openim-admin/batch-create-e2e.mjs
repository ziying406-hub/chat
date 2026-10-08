// ego-browser nodejs; define globalThis.adminBatchTest={spaceId,fixture} first.
// Uses independent test users and creates persistent native account records.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

const config = globalThis.adminBatchTest;
const fixture = JSON.parse(await readFile(config.fixture, 'utf8'));
const task = await taskSpace(config.spaceId);
const page = task.page('p1');
const input = 'textarea[aria-label="批量账号资料"]';
async function fill(text) {
  await page.click(input);
  await page.press(input, 'ControlOrMeta+A');
  await page.press(input, 'Backspace');
  await page.fill(input, text);
}
await fill('测试,invalid,,secret');
await page.click('text="检查账号"');
await page.waitForFunction(() => document.querySelector('.admin-batch-error')?.innerText.includes('有效邮箱'));
await fill('甲,a@example.com,,secret\n乙,a@example.com,,secret');
await page.click('text="检查账号"');
await page.waitForFunction(() => document.querySelector('.admin-batch-error')?.innerText.includes('重复'));
console.log('PASS browser invalid and intra-batch duplicate validation');
await fill(fixture.map(row => [row.nickname, row.email, row.phoneNumber, row.password].join('\t')).join('\n'));
await page.click('text="检查账号"');
await page.waitForFunction(count => document.querySelectorAll('.admin-batch-table tbody tr').length === count, fixture.length);
await page.click('text="开始创建"');
await page.waitForFunction(() => document.querySelector('.admin-batch-panel [role="status"]')?.innerText.includes('成功 2，失败 2，待确认 0，未提交 0'), undefined, { timeout: 30000 });
const results = await page.evaluate(() => [...document.querySelectorAll('.admin-batch-table tbody tr')].map(row => [...row.querySelectorAll('td')].map(cell => cell.innerText)));
assert.deepEqual(results.map(row => row[4]), ['成功', '失败', '成功', '失败']);
assert.equal(results[1][5], '邮箱已注册');
assert.equal(results[3][5], '手机号已注册');
assert.equal(await page.evaluate(() => [...document.querySelectorAll('.admin-batch-panel button')].some(button => button.innerText === '开始创建')), false);
assert.equal(await page.evaluate(() => !!document.querySelector('.admin-batch-panel textarea')), false);
console.log('PASS native batch: two successes, duplicate email and optional-profile phone rejected, submitted batch locked');
for (const index of [0, 2]) {
  const row = fixture[index];
  const response = await fetch('https://999.99chat99.com/chat/account/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json', operationID: randomUUID() },
    body: JSON.stringify({ email: row.email, password: row.password, platform: 5, autoLogin: true }),
  });
  const data = await response.json();
  assert.equal(data.errCode, 0, data.errMsg);
  assert.equal(data.data.userID, results[index][5]);
  assert.ok(data.data.imToken && data.data.chatToken);
  row.userID = data.data.userID;
}
await writeFile(config.fixture, JSON.stringify(fixture), { mode: 0o600 });
console.log('PASS both created users can log in with their email/password, including phone-empty user');
