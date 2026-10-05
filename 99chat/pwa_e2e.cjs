const assert = require('node:assert/strict');
const { chromium, devices } = require('playwright');
const BASE = process.env.E2E_BASE || 'http://127.0.0.1:5200';
(async () => {
 const browser = await chromium.launch({ headless: true });
 try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/`);
  await page.getByRole('heading', { name: '99chat', exact: true }).waitFor();
  const manifest = await (await context.request.get(`${BASE}/manifest.json`)).json();
  assert.equal(manifest.short_name, '99chat'); assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.id, '/'); assert.equal(manifest.scope, '/');
  for (const size of [192, 512]) {
   const icon = manifest.icons.find(icon => icon.sizes === `${size}x${size}` && icon.type === 'image/png');
   assert.ok(icon, `Missing ${size}px icon`);
   const data = await (await context.request.get(new URL(icon.src, BASE).href)).body();
   assert.equal(data.subarray(1, 4).toString(), 'PNG', 'Icon endpoint must return PNG, not SPA HTML');
   assert.equal(data.readUInt32BE(16), size); assert.equal(data.readUInt32BE(20), size);
  }
  const apple = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href');
  const appleData = await (await context.request.get(new URL(apple, BASE).href)).body();
  assert.equal(appleData.subarray(1, 4).toString(), 'PNG'); assert.equal(appleData.readUInt32BE(16), 180);
  const cdp = await context.newCDPSession(page);
  const installability = await cdp.send('Page.getInstallabilityErrors');
  assert.deepEqual(installability.installabilityErrors, [], 'Chromium installability criteria must pass');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  assert.equal(await page.getByText('新版本可用，点击刷新', { exact: true }).count(), 0, 'First installation must not look like an update');
  assert.equal(await page.evaluate(async () => !!(await (await caches.open('99chat-pwa-v1')).match('/firebase-config.js'))), true, 'Bootstrap config must be cached on first installation');
  await page.evaluate(async () => {
   const cache = await caches.open('99chat-pwa-v1');
   await cache.put('/', new Response('<html><body>STALE_SHELL</body></html>', { headers: { 'Content-Type': 'text/html' } }));
  });
  await page.goto(`${BASE}/`);
  await page.getByRole('heading', { name: '99chat', exact: true }).waitFor();
  const cached = await page.evaluate(async () => {
   const requests = (await Promise.all((await caches.keys()).map(async key => (await (await caches.open(key)).keys()).map(req => ({ url: req.url, method: req.method }))))).flat();
   return requests;
  });
  assert.ok(cached.every(req => req.method === 'GET' && new URL(req.url).origin === new URL(BASE).origin));
  assert.ok(cached.every(req => !/^\/(chat|im|api|account|user)(\/|$)/.test(new URL(req.url).pathname)));
  await context.setOffline(true);
  const config = await page.evaluate(async () => {
   const response = await fetch('/firebase-config.js');
   return { ok: response.ok, body: await response.text() };
  });
  assert.equal(config.ok, true); assert.match(config.body, /CHAT_FIREBASE/);
  await page.reload();
  await page.getByRole('heading', { name: '99chat', exact: true }).waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await context.close();
  const ios = await browser.newContext({ ...devices['iPhone 13'] });
  const iosPage = await ios.newPage(); await iosPage.goto(`${BASE}/`);
  await iosPage.getByText('在 Safari 中点“分享”，再选择“添加到主屏幕”。', { exact: true }).waitFor();
  await iosPage.getByRole('button', { name: '稍后', exact: true }).click();
  await iosPage.reload();
  assert.equal(await iosPage.getByText('在 Safari 中点“分享”，再选择“添加到主屏幕”。', { exact: true }).count(), 0);
  await ios.close();
  const standalone = await browser.newContext({ ...devices['iPhone 13'] });
  await standalone.addInitScript(() => Object.defineProperty(navigator, 'standalone', { value: true }));
  const appPage = await standalone.newPage(); await appPage.goto(`${BASE}/`);
  await appPage.getByRole('heading', { name: '99chat', exact: true }).waitFor();
  assert.equal(await appPage.getByText('在 Safari 中点“分享”，再选择“添加到主屏幕”。', { exact: true }).count(), 0);
  await standalone.close();
  console.log('PASS PWA manifest, PNG icons, Chromium installability, first-install state, fresh online shell, offline reload, iOS guidance and standalone mode');
 } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
