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

const redirect = await fetch(`${base}/api/third/prometheus`, { redirect: 'manual' });
assert.equal(redirect.status, 302);
assert.equal(redirect.headers.get('location'), '/grafana/d/openim/99chat?orgId=1');
const grafanaHeaders = { Authorization: `Basic ${Buffer.from(`${credentials.account}:${credentials.password}`).toString('base64')}` };
async function grafana(path) {
  const response = await fetch(`${base}/grafana${path}`, { headers: grafanaHeaders });
  assert.equal(response.status, 200, path);
  return response.json();
}
const health = await grafana('/api/health');
assert.equal(health.database, 'ok');
const dashboard = await grafana('/api/dashboards/uid/openim');
assert.ok(dashboard.dashboard.panels.length > 0);
const metrics = await grafana('/api/datasources/proxy/uid/prometheus/api/v1/query?query=up');
assert.equal(metrics.status, 'success');
assert.ok(metrics.data.result.length >= 11, 'All native OpenIM services must be discovered');
assert.ok(metrics.data.result.every(series => series.value[1] === '1'), 'All discovered service metrics must be reachable');
console.log(`PASS monitor entry redirect, authenticated Grafana, provisioned dashboard, ${metrics.data.result.length} healthy OpenIM scrape targets`);
