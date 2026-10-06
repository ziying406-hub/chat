import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
assert.ok(process.env.ADMIN_ACCESS_FILE, 'ADMIN_ACCESS_FILE must point to a private credential file');
const credentials = JSON.parse(readFileSync(process.env.ADMIN_ACCESS_FILE));
const base = credentials.url;
async function post(path, body, token = '') {
  const response = await fetch(`${base}${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', token, operationID: randomUUID() },
    body: JSON.stringify(body),
  });
  assert.equal(response.status, 200, path);
  return response.json();
}
const html = await (await fetch(`${base}/login`)).text();
assert.ok(html.includes('OpenIM-Admin'));
const userPage = await (await fetch(`${base}/chat/user/user_list`)).text();
assert.ok(userPage.includes('OpenIM-Admin'), 'Business page must survive direct navigation and refresh');
const unauthorized = await post('/complete_admin/account/info', {});
assert.notEqual(unauthorized.errCode, 0, 'Unauthenticated administrator requests must be rejected');
const login = await post('/complete_admin/account/login', {
  account: credentials.account,
  password: createHash('md5').update(credentials.password).digest('hex'),
});
assert.equal(login.errCode, 0, login.errMsg);
assert.ok(login.data.adminToken && login.data.imToken);
const info = await post('/complete_admin/account/info', {}, login.data.adminToken);
assert.equal(info.errCode, 0, info.errMsg);
const users = await post('/api/user/get_all_users_uid', { pagination: { pageNumber: 1, showNumber: 10 } }, login.data.imToken);
assert.equal(users.errCode, 0, users.errMsg);
assert.ok(users.data.userIDs.length > 0, 'Existing IM users must be returned');
const groups = await post('/api/group/get_groups', { pagination: { pageNumber: 1, showNumber: 10 } }, login.data.imToken);
assert.equal(groups.errCode, 0, groups.errMsg);
assert.ok(groups.data.groups.length > 0, 'Existing groups must be returned');
console.log(`PASS HTTPS frontend, unauthenticated rejection, native admin login/profile, ${users.data.userIDs.length} users and ${groups.data.groups.length} groups`);
