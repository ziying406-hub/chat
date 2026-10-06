// Uses existing authorized independent accounts and group records; creates no messages.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { chromium } = require('playwright');
const BASE = process.env.E2E_BASE || 'http://localhost:5199';
const API = process.env.E2E_IM_API || `${BASE}/api`;
assert.ok(process.env.TEST_FIXTURES && process.env.TEST_GROUP_FIXTURE, 'Independent account and group fixtures are required');
const users = JSON.parse(fs.readFileSync(process.env.TEST_FIXTURES));
const { conversationID } = JSON.parse(fs.readFileSync(process.env.TEST_GROUP_FIXTURE));
(async () => {
  const browser = await chromium.launch();
  try {
    let peerTexts;
    for (const user of [...users].reverse()) {
      const response = await (await fetch(`${API}/msg/pull_msg_by_seq`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', token: user.imToken, operationID: randomUUID() },
        body: JSON.stringify({ userID: user.userID, seqRanges: [{ conversationID, begin: 1, end: 100, num: 100 }] }),
      })).json();
      assert.equal(response.errCode, 0, response.errMsg);
      const records = response.data.msgs?.[conversationID]?.Msgs || [];
      const texts = records.filter(msg => msg.contentType === 101 && msg.status < 4).map(msg => JSON.parse(Buffer.from(msg.content, 'base64').toString()).content);
      assert.ok(texts.length > 0, 'Native server must contain existing visible group text');
      const context = await browser.newContext();
      const page = await context.newPage();
      page.setDefaultTimeout(60000);
      await page.route('**/openIM.wasm', route => route.fulfill({ path: `${__dirname}/public/openIM.wasm`, contentType: 'application/wasm' }));
      await page.addInitScript(() => {
        // Observe the native callback without changing which events the application receives.
        let register;
        window.qaSyncFinished = false;
        Object.defineProperty(window, 'commonEventFunc', {
          configurable: true,
          set(fn) { register = fn; },
          get() { return callback => register(event => {
            if (JSON.parse(event).event === 'OnSyncServerFinish') window.qaSyncFinished = true;
            callback(event);
          }); },
        });
      });
      await page.addInitScript(auth => localStorage.setItem('99chat_session', JSON.stringify(auth)), user);
      await page.goto(`${BASE}/#/contact/requests`, { waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: '扫一扫', exact: true }).waitFor();
      await page.goto(`${BASE}/#/messages/session/${conversationID}`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.qaSyncFinished, undefined, { timeout: 60000 });
      try { await page.getByPlaceholder('输入消息...').waitFor(); }
      catch (error) { console.log('UI state:', page.url(), (await page.locator('body').innerText()).slice(-1000)); throw error; }
      const native = await page.evaluate(async conversationID => {
        const raw = await window.getAdvancedHistoryMessageList(String(Date.now()), JSON.stringify({ conversationID, count: 50, startClientMsgID: '', viewType: 0 }));
        const result = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return { count: result.messageList?.length, isEnd: result.isEnd, errCode: result.errCode };
      }, conversationID);
      console.log(`${user.nickname}: server has ${texts.length} visible texts; native history`, native);
      for (const text of texts) await page.locator('.message-content').getByText(text, { exact: true }).waitFor({ timeout: 15000 });
      if (peerTexts) {
        for (const text of peerTexts.filter(text => !texts.includes(text))) {
          assert.equal(await page.locator('.message-content').getByText(text, { exact: true }).count(), 0, 'Own deleted text must not return');
        }
      } else peerTexts = texts;
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.qaSyncFinished, undefined, { timeout: 60000 });
      for (const text of texts) await page.locator('.message-content').getByText(text, { exact: true }).waitFor({ timeout: 15000 });
      for (const text of peerTexts.filter(text => !texts.includes(text))) {
        assert.equal(await page.locator('.message-content').getByText(text, { exact: true }).count(), 0);
      }
      console.log(`PASS fresh browser recovers ${user.nickname}'s own group history`);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
