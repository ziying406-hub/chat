// ego-browser nodejs; define adminBrowserLogin={spaceId,fixture,index?} first.
// Must start on the real 99chat sign-in page, with no production user logged in.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const config = globalThis.adminBrowserLogin;
const stored = JSON.parse(await readFile(config.fixture, 'utf8'));
const user = Array.isArray(stored) ? stored[config.index ?? 0] : stored;
const task = await taskSpace(config.spaceId);
const page = task.page('p1');
for (const [selector, value] of [['input[placeholder="请输入邮箱"]', user.email], ['input[placeholder="请输入密码"]', user.password]]) {
  await page.click(selector);
  await page.press(selector, 'ControlOrMeta+A');
  await page.press(selector, 'Backspace');
  await page.fill(selector, value);
}
await page.click('text="登录"');
await page.waitForFunction(() => location.hash.startsWith('#/messages'), undefined, { timeout: 30000 });
const sessionID = await page.evaluate(() => JSON.parse(localStorage.getItem('99chat_session'))?.userID);
assert.equal(sessionID, user.userID);
assert.ok(await page.evaluate(() => document.body.innerText.includes('通讯录')));
console.log('PASS actual browser sign-in, SDK session and chat page; userID:', sessionID);
