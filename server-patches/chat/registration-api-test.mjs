// Reuses a private independent test account; sends no OTP or messages.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
const users = JSON.parse(fs.readFileSync(process.env.TEST_FIXTURES, 'utf8'));
const base = process.env.CHAT_API || 'https://999.99chat99.com/chat';
const result = await (await fetch(`${base}/account/register`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', operationID: randomUUID() },
  body: JSON.stringify({ platform: 5, autoLogin: false, verifyCode: 'invalid', user: {
    email: users[0].email, password: 'unused', nickname: 'duplicate-check'
  } })
})).json();
assert.equal(result.errCode, 20014, 'Registered email must be rejected before OTP verification or writes');
assert.equal(result.data, undefined);
console.log('PASS: duplicate email rejected with EmailAlreadyRegister');
