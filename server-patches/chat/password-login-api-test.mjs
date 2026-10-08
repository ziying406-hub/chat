import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';

const single = JSON.parse(readFileSync(process.env.ADMIN_USER_FIXTURE));
const batch = JSON.parse(readFileSync(process.env.BATCH_USER_FIXTURE));
const signup = JSON.parse(readFileSync(process.env.SIGNUP_USER_FIXTURE));
async function login(user, password) {
  const response = await fetch('https://999.99chat99.com/chat/account/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json', operationID: randomUUID() },
    body: JSON.stringify({ email: user.email, password, platform: 5, autoLogin: true }),
  });
  assert.equal(response.status, 200);
  return response.json();
}
for (const user of [single, ...batch.filter(row => row.userID), signup]) {
  const result = await login(user, user.password);
  assert.equal(result.errCode, 0, result.errMsg);
  assert.equal(result.data.userID, user.userID);
  assert.ok(result.data.imToken && result.data.chatToken);
}
const native = await login(single, createHash('md5').update(single.password).digest('hex'));
assert.equal(native.errCode, 0, 'Native MD5 client protocol must remain valid');
const wrong = await login(single, randomUUID());
assert.notEqual(wrong.errCode, 0, 'Incorrect passwords must remain rejected');
assert.ok(!wrong.data?.chatToken);
console.log('PASS raw login: manual admin user, both batch users and existing signup user; native hash login; wrong password rejected');
