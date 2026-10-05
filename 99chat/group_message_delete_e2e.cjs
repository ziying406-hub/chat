// Uses authorized independent accounts; creates a private test group and persistent messages.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { chromium } = require('playwright');
const BASE = process.env.E2E_BASE || 'http://localhost:5199';
assert.ok(process.env.TEST_FIXTURES && process.env.TEST_GROUP_FIXTURE, 'Independent account and group fixture files are required');
const [a, b] = JSON.parse(fs.readFileSync(process.env.TEST_FIXTURES));
(async () => {
  const browser = await chromium.launch();
  async function login(user) {
    const page = await (await browser.newContext()).newPage();
    page.setDefaultTimeout(60000);
    await page.addInitScript(auth => localStorage.setItem('99chat_session', JSON.stringify(auth)), user);
    await page.goto(`${BASE}/#/contact/requests`, { waitUntil: "domcontentloaded" });
    await page.getByRole('button', { name: '扫一扫', exact: true }).waitFor();
    return page;
  }
  const bubble = (page, text) => page.locator('.message-content > .relative.group').filter({ has: page.getByText(text, { exact: true }) });
  async function send(page, text) {
    await page.getByPlaceholder('输入消息...').fill(text);
    await page.getByPlaceholder('输入消息...').press('Enter');
    await bubble(page, text).locator('svg.lucide-check').waitFor();
  }
  try {
    const pa = await login(a);
    let fixture;
    if (fs.existsSync(process.env.TEST_GROUP_FIXTURE)) fixture = JSON.parse(fs.readFileSync(process.env.TEST_GROUP_FIXTURE));
    else {
      const name = `group-delete-qa-${Date.now()}`;
      await pa.goto(`${BASE}/#/contact/create-group`);
      await pa.getByRole('button', { name: b.nickname, exact: true }).last().click();
      await pa.getByPlaceholder('群名称').fill(name);
      await pa.getByRole('button', { name: '完成（1）', exact: true }).click();
      await pa.waitForURL(/#\/contact\/groups$/);
      await pa.getByText(name, { exact: true }).click();
      await pa.waitForURL(/#\/contact\/group\/[^/]+$/);
      const groupID = pa.url().split('/').pop();
      const conversationID = await pa.evaluate(async groupID => {
        const raw = await window.getOneConversation(String(Date.now()), 3, groupID);
        return (typeof raw === 'string' ? JSON.parse(raw) : raw).conversationID;
      }, groupID);
      assert.ok(conversationID.startsWith('sg_'));
      fixture = { conversationID };
      fs.writeFileSync(process.env.TEST_GROUP_FIXTURE, JSON.stringify(fixture), { mode: 0o600 });
    }
    const { conversationID } = fixture;
    const pb = await login(b);
    await Promise.all([pa.goto(`${BASE}/#/messages/session/${conversationID}`, { waitUntil: 'domcontentloaded' }), pb.goto(`${BASE}/#/messages/session/${conversationID}`, { waitUntil: 'domcontentloaded' })]);
    const oldText = `group-delete-old-${randomUUID()}`, control = `group-delete-keep-${randomUUID()}`;
    await send(pa, oldText);
    await send(pa, control);
    await bubble(pb, oldText).waitFor();
    console.log('Both group members display the real test text');
    let oldSentAt;
    async function serverHistory(user) {
      const response = await (await fetch(`${BASE}/api/msg/pull_msg_by_seq`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', token: user.imToken, operationID: randomUUID() },
        body: JSON.stringify({ userID: user.userID, seqRanges: [{ conversationID, begin: 1, end: 100, num: 100 }] }),
      })).json();
      assert.equal(response.errCode, 0, response.errMsg);
      const messages = (response.data.msgs?.[conversationID]?.Msgs || []).filter(msg => msg.contentType === 101 && msg.status < 4);
      const old = messages.find(msg => JSON.parse(Buffer.from(msg.content, 'base64').toString()).content === oldText);
      if (old) oldSentAt = old.sendTime;
      return messages.map(msg => JSON.parse(Buffer.from(msg.content, 'base64').toString()).content);
    }
    assert.ok((await serverHistory(b)).includes(oldText));
    assert.ok(oldSentAt);
    while (Date.now() - oldSentAt < 125000) await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Testing a real group message older than two minutes');
    await bubble(pa, oldText).click({ button: 'right' });
    assert.match(await pa.getByRole('button', { name: '撤回', exact: true }).getAttribute('class'), /text-gray-300/);
    await pa.getByRole('button', { name: '删除', exact: true }).click({ timeout: 10000 });
    await bubble(pa, oldText).waitFor({ state: 'detached' });
    await bubble(pb, oldText).waitFor();
    // Read each account's native server history: a hidden local row cannot satisfy these checks.
    assert.ok(!(await serverHistory(a)).includes(oldText));
    assert.ok((await serverHistory(a)).includes(control));
    assert.ok((await serverHistory(b)).includes(oldText));
    assert.ok((await serverHistory(b)).includes(control));
    await pa.getByRole('button', { name: '更多聊天操作', exact: true }).click();
    await pa.getByRole('button', { name: '多选', exact: true }).click();
    await bubble(pa, control).locator('../..').getByRole('button', { name: /^选择消息 / }).click();
    await pa.getByRole('button', { name: '删除', exact: true }).click();
    await bubble(pa, control).waitFor({ state: 'detached' });
    assert.ok(!(await serverHistory(a)).includes(control));
    assert.ok((await serverHistory(b)).includes(control));
    await pa.reload({ waitUntil: 'domcontentloaded' });
    await pa.getByPlaceholder('输入消息...').waitFor();
    assert.equal(await bubble(pa, oldText).count(), 0);
    console.log('PASS old group text deletion, own reload and native server persistence, preserved unselected message, multi-select deletion and unaffected other member');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
