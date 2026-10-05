// Uses explicitly authorized independent accounts and creates persistent messages.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { chromium } = require('playwright');
assert.ok(process.env.TEST_FIXTURES, 'Independent TEST_FIXTURES are required');
const [a, b] = JSON.parse(fs.readFileSync(process.env.TEST_FIXTURES));
const BASE = process.env.E2E_BASE || 'http://localhost:5199';
(async () => {
  const browser = await chromium.launch();
  async function login(user) {
    const page = await (await browser.newContext()).newPage();
    page.setDefaultTimeout(60000);
    await page.addInitScript(auth => localStorage.setItem('99chat_session', JSON.stringify(auth)), user);
    await page.goto(`${BASE}/#/contact/requests`);
    await page.getByRole('button', { name: '扫一扫', exact: true }).waitFor();
    return page;
  }
  async function openChat(page, peer) {
    await page.goto(`${BASE}/#/contact/user/${peer.userID}`);
    await page.getByRole('button', { name: '发消息', exact: true }).click();
    await page.getByPlaceholder('输入消息...').waitFor();
  }
  function bubble(page, text) { return page.locator('.message-content > .relative.group').filter({ has: page.getByText(text, { exact: true }) }); }
  async function send(page) {
    const text = `read-receipt-qa-${randomUUID()}`;
    await page.getByPlaceholder('输入消息...').fill(text);
    await page.getByPlaceholder('输入消息...').press('Enter');
    await bubble(page, text).locator('svg.lucide-check, svg.lucide-check-check').first().waitFor();
    return text;
  }
  try {
    const pa = await login(a), pb = await login(b);
    await openChat(pa, b);
    await pb.goto(`${BASE}/#/messages`);
    const unreadBadge = pb.locator('div.cursor-pointer.group').filter({ has: pb.getByText(a.nickname, { exact: true }) }).locator('span.bg-red-500');
    const first = await send(pa);
    await unreadBadge.waitFor();
    assert.equal(await bubble(pa, first).locator('svg.lucide-check-check').count(), 0);
    await openChat(pb, a);
    await bubble(pb, first).waitFor();
    await bubble(pa, first).locator('svg.lucide-check-check').waitFor({ timeout: 15000 });
    await unreadBadge.waitFor({ state: 'hidden' });
    const second = await send(pa);
    await bubble(pb, second).waitFor();
    await bubble(pa, second).locator('svg.lucide-check-check').waitFor({ timeout: 15000 });
    await pa.reload();
    await bubble(pa, second).locator('svg.lucide-check-check').waitFor();
    // Leaving the conversation must keep the next message unread until it is opened.
    await pb.goto(`${BASE}/#/contact/requests`);
    const third = await send(pa);
    await pa.reload();
    await bubble(pa, third).locator('svg.lucide-check').waitFor();
    assert.equal(await bubble(pa, third).locator('svg.lucide-check-check').count(), 0);
    await openChat(pb, a);
    try {
      await bubble(pa, third).locator('svg.lucide-check-check').waitFor({ timeout: 15000 });
    } catch (error) {
      console.log('Native sender history:', await pa.evaluate(async text => {
        const conversationID = location.hash.split('/').pop();
        const raw = await window.getAdvancedHistoryMessageList(String(Date.now()), JSON.stringify({ conversationID, count: 50, startClientMsgID: '', viewType: 0 }));
        const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
        const message = data.messageList.find(item => item.textElem?.content === text);
        return { isRead: message?.isRead, status: message?.status };
      }, third));
      throw error;
    }
    console.log('PASS real unread before opening, live receipt on opening, continued reading, reload persistence and unread while away');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
