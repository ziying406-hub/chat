const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');

// Sends one real registration verification email to the explicitly supplied recipient.
const api = process.env.E2E_CHAT_API;
const email = process.env.TEST_EMAIL;
assert.ok(api && email, 'Set E2E_CHAT_API and TEST_EMAIL to an authorized, unregistered test mailbox');

async function request(path, body) {
  const response = await fetch(`${api}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', operationID: randomUUID() },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  assert.equal(response.ok, true, `HTTP ${response.status}`);
  return response.json();
}

(async () => {
  const sent = await request('/account/code/send', { email, usedFor: 1, platform: 5 });
  assert.equal(sent.errCode, 0, sent.errMsg);
  console.log('PASS: OpenIM accepted the real email verification send request; recipient confirmation is still required.');
  const invalid = await request('/account/code/verify', { email, verifyCode: 'invalid-test-code' });
  assert.notEqual(invalid.errCode, 0, 'Incorrect verification code must be rejected');
  console.log('PASS: Incorrect email verification code was rejected.');
})().catch(error => { console.error(error.message); process.exit(1); });
