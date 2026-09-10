import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';

// Use an explicitly selected deployment and dedicated test accounts only.
const phase = process.argv[2];
const statePath = process.env.FAVORITES_TEST_STATE;
assert.ok(['prepare', 'verify'].includes(phase) && statePath, 'Use prepare/verify and set FAVORITES_TEST_STATE');
const state = phase === 'verify' ? JSON.parse(readFileSync(statePath, 'utf8')) : null;
const base = state?.base || process.env.CHAT_URL;
assert.ok(base, 'Set CHAT_URL');
if (phase === 'prepare') assert.ok(process.env.TEST_VERIFY_CODE, 'Set TEST_VERIFY_CODE');
const id = state?.id || `favorites-test-${randomUUID()}`;
async function request(path, body = {}, token) {
  const response = await fetch(`${base}${path}`, {
    method: 'POST', signal: AbortSignal.timeout(10000),
    headers: { 'Content-Type': 'application/json', operationID: randomUUID(), ...(token ? { token } : {}) },
    body: JSON.stringify(body),
  });
  assert.equal(response.status, 200, `${path}: HTTP ${response.status}`);
  return response.json();
}
async function ok(user, action, body = {}) {
  const result = await request(`/user/favorites/${action}`, body, user.chatToken);
  assert.equal(result.errCode, 0, `${action}: ${result.errMsg}`);
  return result.data;
}
async function account(index) {
  const result = await request('/account/register', {
    verifyCode: process.env.TEST_VERIFY_CODE, platform: 5, autoLogin: true,
    user: { areaCode: '+86', phoneNumber: `138${String(Date.now()).slice(-7)}${index}`,
      password: randomUUID(), nickname: `${id}-${index}` },
  });
  assert.equal(result.errCode, 0, 'fixture registration failed');
  return result.data;
}
if (phase === 'prepare') {
  for (const token of [undefined, 'invalid-test-token']) {
    for (const action of ['save', 'list', 'delete']) {
      const result = await request(`/user/favorites/${action}`, { clientMsgID: id }, token);
      assert.notEqual(result.errCode, 0, `${action} accepted invalid authentication`);
    }
  }
  console.log('PASS: all favorites APIs require valid authentication');
}
const users = state?.users || await Promise.all([0, 1].map(account));
const [a, b] = users;
if (phase === 'prepare') writeFileSync(statePath, JSON.stringify({ base, id, users }), { mode: 0o600, flag: 'wx' });
let prepared = false;
try {
  if (phase === 'prepare') {
    await ok(a, 'save', { clientMsgID: id, content: 'account A', userID: b.userID });
    assert.equal((await ok(a, 'list')).find(x => x.clientMsgID === id)?.content, 'account A');
    assert.ok(!(await ok(b, 'list') || []).some(x => x.clientMsgID === id));
    await ok(b, 'delete', { clientMsgID: id });
    assert.equal((await ok(a, 'list')).find(x => x.clientMsgID === id)?.content, 'account A');
    await ok(b, 'save', { clientMsgID: id, content: 'account B' });
    await ok(a, 'save', { clientMsgID: id, content: 'account A updated' });
    const items = (await ok(a, 'list')).filter(x => x.clientMsgID === id);
    assert.equal(items.length, 1);
    assert.equal(items[0].content, 'account A updated');
    assert.equal((await ok(b, 'list')).find(x => x.clientMsgID === id)?.content, 'account B');
    console.log('PASS: save/list/update/delete ownership and same-message isolation');
    prepared = true;
    console.log('PREPARED: restart only openim-chat, wait for healthy, then run verify.');
  } else {
    assert.equal((await ok(a, 'list')).find(x => x.clientMsgID === id)?.content, 'account A updated');
    assert.equal((await ok(b, 'list')).find(x => x.clientMsgID === id)?.content, 'account B');
    console.log('PASS: both accounts retained favorites across chat restart');
  }
} finally {
  if (!prepared) {
    for (const user of users) {
      await ok(user, 'delete', { clientMsgID: id });
      assert.ok(!(await ok(user, 'list') || []).some(x => x.clientMsgID === id));
    }
    console.log('PASS: temporary favorite records removed; dedicated test accounts retained');
    unlinkSync(statePath);
  }
}
