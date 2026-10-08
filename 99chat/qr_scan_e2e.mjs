// Prepend globalThis.qrTestConfig with EGO_TASK_SPACE, TEST_FIXTURES, TARGET_FIXTURE.
// Run the combined script using ego-browser nodejs on an existing QA task space.
// Uses real OpenIM account lookup. Native friend request is sent only if SEND_REQUEST=1.
const config = globalThis.qrTestConfig;
const fs = await import('node:fs/promises');
const assert = (await import('node:assert/strict')).default;
const users = JSON.parse(await fs.readFile(config.TEST_FIXTURES, 'utf8'));
const target = JSON.parse(await fs.readFile(config.TARGET_FIXTURE, 'utf8'));
const task = await taskSpace(Number(config.EGO_TASK_SPACE));
const p = task.page('p1');
const base = config.E2E_BASE || 'http://127.0.0.1:5214';
async function clickText(text) {
  // Select a rendered control by its actual text, then click through the browser API.
  const found = await p.evaluate((text) => {
    document.querySelectorAll('[data-qr-test-click]').forEach(e => e.removeAttribute('data-qr-test-click'));
    const button = [...document.querySelectorAll('button')].find(e => e.textContent.trim() === text);
    if (!button) return false;
    button.setAttribute('data-qr-test-click', '1'); return true;
  }, text);
  assert.ok(found, `Missing control: ${text}`);
  await p.click('[data-qr-test-click="1"]');
}
await p.goto(`${base}/?qr-test=${Date.now()}#/contact/requests`);
await p.waitForFunction(() => document.body.textContent.includes("扫一扫") || !!document.querySelector('input[placeholder="请输入邮箱"]'), undefined, {timeout:45000});
if (await p.evaluate(() => !!document.querySelector('input[placeholder="请输入邮箱"]'))) {
  for (const [selector,value] of [['input[placeholder="请输入邮箱"]',users[0].email],['input[placeholder="请输入密码"]',users[0].password]]) {
    await p.click(selector); await p.press(selector,'ControlOrMeta+A'); await p.press(selector,'Backspace'); await p.fill(selector,value);
  }
  await clickText('登录');
}
await p.waitForFunction(() => !location.hash.includes('/auth/'), undefined, {timeout:45000});
await p.goto(`${base}/?qr-test=${Date.now()}#/contact/requests`);
await p.waitForFunction(() => document.body.textContent.includes('扫一扫'), undefined, {timeout:20000});
if (await p.evaluate(() => document.body.textContent.includes('开启通知，及时收到消息提醒'))) await clickText('拒绝');
if (await p.evaluate(() => document.body.textContent.includes('将 99chat 添加到主屏幕'))) await clickText('稍后');
// Permission denial must leave album scanning usable.
await p.evaluate(() => { navigator.mediaDevices.getUserMedia = async () => { throw new DOMException('Denied', 'NotAllowedError'); }; });
await clickText('扫一扫');
await p.waitForFunction(() => document.body.textContent.includes('无法使用摄像头'), undefined, {timeout:10000});
assert.equal(await p.evaluate(() => !!document.querySelector('input[placeholder="输入用户 ID"]')), false);
await p.setInputFiles('input[aria-label="选择二维码图片"]', config.INVALID_QR || '/tmp/99chat-qr-invalid.png');
await p.waitForFunction(() => document.body.textContent.includes('这不是 99chat 个人名片'), undefined, {timeout:15000});
await p.setInputFiles('input[aria-label="选择二维码图片"]', config.VALID_QR || '/tmp/99chat-qr-valid.png');
await p.waitForFunction(id => document.querySelector('[role="dialog"]')?.textContent.includes(`ID: ${id}`), target.userID, {timeout:20000});
assert.ok(await p.evaluate(() => document.querySelector('[role="dialog"]')?.textContent.includes('发送申请')));
assert.equal(await p.evaluate(() => document.body.textContent.includes('好友申请已发送')), false);
await p.click('button[aria-label="关闭扫一扫"]');
// Feed an actual QR image into a video MediaStream; decoding is never mocked.
const png = await fs.readFile(config.VALID_QR || '/tmp/99chat-qr-valid.png');
await p.evaluate(async (data) => {
  window.qrTestTracks = []; window.qrTestFeed = false;
  const image = new Image(); image.src = data; await image.decode();
  navigator.mediaDevices.getUserMedia = async () => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 640;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = 'white'; ctx.fillRect(0,0,640,640); if (window.qrTestFeed) ctx.drawImage(image,170,170,300,300);
    const stream = canvas.captureStream(10); window.qrTestTracks.push(...stream.getTracks());
    return stream;
  };
}, `data:image/png;base64,${png.toString('base64')}`);
await clickText('扫一扫');
await p.waitForFunction(() => window.qrTestTracks.some(t => t.readyState === 'live'), undefined, {timeout:10000});
await p.click('button[aria-label="关闭扫一扫"]');
await p.waitForFunction(() => window.qrTestTracks.every(t => t.readyState === 'ended'), undefined, {timeout:10000});
await p.evaluate(() => { window.qrTestFeed = true; });
await clickText('扫一扫');
await p.waitForFunction(id => document.querySelector('[role="dialog"]')?.textContent.includes(`ID: ${id}`), target.userID, {timeout:20000});
await p.waitForFunction(() => window.qrTestTracks.length > 0 && window.qrTestTracks.every(t => t.readyState === 'ended'), undefined, {timeout:10000});
if (config.SEND_REQUEST === '1') {
  await clickText('发送申请');
  await p.waitForFunction(() => document.body.textContent.includes('好友申请已发送，等待对方确认'), undefined, {timeout:15000});
} else await p.click('button[aria-label="关闭扫一扫"]');
console.log('PASS: scanner entrance, permission denial, invalid QR, real image and video decoding, user lookup, explicit confirmation and camera release');
