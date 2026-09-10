const { chromium } = require('playwright');

const BASE = 'http://localhost:5199';
const CONVERSATION = 'si_3004649357_3540424232';

async function login(page, phone) {
  await page.goto(`${BASE}/#/auth/sign-in`);
  await page.getByPlaceholder('请输入手机号').fill(phone);
  await page.getByPlaceholder('请输入密码').fill('test123456');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL(/#\/messages/, { timeout: 60000 });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const sender = await (await browser.newContext()).newPage();
  const recipient = await (await browser.newContext()).newPage();
  await Promise.all([login(sender, '13800138000'), login(recipient, '13700137000')]);
  await recipient.goto(`${BASE}/#/messages/session/${CONVERSATION}`);
  await recipient.getByPlaceholder('输入消息...').waitFor({ state: 'visible', timeout: 15000 });
  await recipient.evaluate(() => {
    class FakeAudioContext {
      currentTime = 0;
      destination = {};
      createOscillator() { return { frequency: { setValueAtTime() {} }, connect() {}, start() { (window).__messageToneStarts++; }, stop() {} }; }
      createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
      close() { return Promise.resolve(); }
    }
    (window).__messageToneStarts = 0;
    (window).AudioContext = FakeAudioContext;
    localStorage.setItem('99chat_sound_enabled_3540424232', 'true');
    localStorage.removeItem('99chat_mute_all_3540424232');
  });

  await sender.goto(`${BASE}/#/messages/session/${CONVERSATION}`);
  const message = `sound-${Date.now()}`;
  await sender.getByPlaceholder('输入消息...').fill(message);
  await sender.getByPlaceholder('输入消息...').press('Enter');
  await recipient.getByText(message, { exact: true }).last().waitFor({ state: 'visible', timeout: 30000 });
  if (await recipient.evaluate(() => (window).__messageToneStarts) !== 1) {
    throw new Error('Incoming message did not play the enabled notification sound.');
  }

  console.log('Incoming messages play a notification sound when enabled.');
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
