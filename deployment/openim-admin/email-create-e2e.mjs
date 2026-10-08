// Run through ego-browser nodejs after defining globalThis.adminEmailTest.
// The private fixture contains nickname, phoneNumber, email and password.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';

const config = globalThis.adminEmailTest;
const fixture = JSON.parse(await readFile(config.fixture, 'utf8'));
const task = await taskSpace(config.spaceId);
const page = task.page('p1');
async function fill(selector, value) {
  await page.click(selector);
  await page.press(selector, 'ControlOrMeta+A');
  await page.press(selector, 'Backspace');
  await page.fill(selector, value);
}
await fill('#nickname', fixture.nickname);
await fill('#phoneNumber', fixture.phoneNumber);
await fill('#password', fixture.password);
await fill('#email', 'invalid-email');
await page.click('[role="dialog"] button.ant-btn-primary');
await page.waitForFunction(() => document.querySelector('[role="dialog"]')?.innerText.includes('请输入有效的邮箱地址'));
console.log('PASS invalid email rejected by create-user form');
await fill('#email', fixture.email);
await page.press('#email', 'Tab');
await page.click('[role="dialog"] button.ant-btn-primary');
await page.waitForFunction(() => !document.querySelector('.ant-drawer-open'), undefined, { timeout: 15000 });
console.log('PASS native administrator create-user submission');

async function post(url, data, token = '') {
  const response = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json', operationID: randomUUID(), token },
    body: JSON.stringify(data),
  });
  assert.equal(response.status, 200);
  return response.json();
}
const password = createHash('md5').update(fixture.password).digest('hex');
const login = await post('https://999.99chat99.com/chat/account/login', { email: fixture.email, password, platform: 5, autoLogin: true });
assert.equal(login.errCode, 0, login.errMsg);
assert.ok(login.data.imToken && login.data.chatToken && login.data.userID);
fixture.userID = login.data.userID;
await writeFile(config.fixture, JSON.stringify(fixture), { mode: 0o600 });
console.log('PASS same native email/password login, userID:', fixture.userID);

const access = JSON.parse(await readFile(config.adminAccess, 'utf8'));
const adminLogin = await post(`${access.url}/complete_admin/account/login`, {
  account: access.account, password: createHash('md5').update(access.password).digest('hex'),
});
assert.equal(adminLogin.errCode, 0, adminLogin.errMsg);
const duplicate = await post(`${access.url}/complete_admin/user/import/json`, {
  users: [{ nickname: fixture.nickname + '-duplicate', email: fixture.email, areaCode: '+86', phoneNumber: String(Number(fixture.phoneNumber) + 1), password, registerType: 0 }],
}, adminLogin.data.adminToken);
assert.equal(duplicate.errCode, 20014, 'A different phone must not bypass duplicate email rejection');
console.log('PASS native duplicate email rejected (20014) with a different phone');

await page.click('text="创建新用户"');
await page.waitForSelector('#email');
await fill('#nickname', fixture.nickname + '-duplicate');
await fill('#phoneNumber', String(Number(fixture.phoneNumber) + 1));
await fill('#password', fixture.password);
await fill('#email', fixture.email);
await page.press('#email', 'Tab');
await page.click('[role="dialog"] button.ant-btn-primary');
await page.waitForFunction(() => document.querySelector('.ant-message')?.innerText.includes('该邮箱已注册，请使用其他邮箱'));
assert.ok(await page.evaluate(() => !!document.querySelector('.ant-drawer-open')));
console.log('PASS duplicate email stays in the form with a Chinese error message');
