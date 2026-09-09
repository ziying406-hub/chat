const { chromium } = require('playwright');
const fs = require('fs');

const BASE_URL = 'http://localhost:5199';
const VIDEO_PATH = '/tmp/99chat-e2e-video.webm';

async function login(page, phone, password) {
  await page.goto(`${BASE_URL}/#/auth/sign-in`, { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('请输入手机号').waitFor({ state: 'visible', timeout: 30000 });
  if (phone) await page.getByPlaceholder('请输入手机号').fill(phone);
  if (password) await page.getByPlaceholder('请输入密码').fill(password);
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 60000 });
}

async function createVideoFixture(page) {
  const base64 = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    context.fillStyle = '#2563eb';
    context.fillRect(0, 0, canvas.width, canvas.height);
    const stream = canvas.captureStream(5);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const chunks = [];
    recorder.addEventListener('dataavailable', (event) => chunks.push(event.data));
    const finished = new Promise((resolve) => recorder.addEventListener('stop', resolve));
    recorder.start();
    await new Promise((resolve) => setTimeout(resolve, 300));
    recorder.stop();
    await finished;
    const bytes = new Uint8Array(await new Blob(chunks, { type: 'video/webm' }).arrayBuffer());
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
  });
  fs.writeFileSync(VIDEO_PATH, Buffer.from(base64, 'base64'));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const senderContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const recipientContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const sender = await senderContext.newPage();
  const recipient = await recipientContext.newPage();

  await createVideoFixture(sender);
  await Promise.all([
    login(sender),
    login(recipient, '13700137000', 'test123456'),
  ]);

  await sender.goto(`${BASE_URL}/#/messages/session/si_3004649357_3540424232`, { waitUntil: 'domcontentloaded' });
  await sender.getByPlaceholder('输入消息...').waitFor({ state: 'visible', timeout: 15000 });
  await sender.getByRole('button', { name: '附件', exact: true }).click();
  await sender.getByRole('button', { name: '视频', exact: true }).click();
  await sender.locator('input[accept="video/*"]').setInputFiles(VIDEO_PATH);
  await sender.locator('video[controls]').last().waitFor({ state: 'visible', timeout: 20000 });

  await recipient.goto(`${BASE_URL}/#/messages/session/si_3004649357_3540424232`, { waitUntil: 'domcontentloaded' });
  await recipient.getByPlaceholder('输入消息...').waitFor({ state: 'visible', timeout: 15000 });
  await recipient.locator('video[controls]').last().waitFor({ state: 'visible', timeout: 60000 });

  console.log('Video attachment sends and renders through the OpenIM message flow.');
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
