const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  page.on("console", (msg) => {
    console.log(`[${msg.type()}] ${msg.text().slice(0, 300)}`);
  });
  page.on("pageerror", (err) => console.log(`[PAGE_ERROR] ${err.message}`));
  page.on("response", (res) => {
    if (res.status() === 500) console.log(`[500] ${res.url().replace("http://localhost:5199", "")}`);
  });

  await page.goto("http://localhost:5199/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(12000);
  
  var bodyText = await page.evaluate(() => document.body?.innerText?.slice(0, 500));
  console.log("=== LOGIN PAGE ===");
  console.log(bodyText);
  
  var buttons = await page.evaluate(() => Array.from(document.querySelectorAll("button")).map(b => b.textContent?.trim().slice(0, 30)));
  console.log("Buttons:", JSON.stringify(buttons));

  // Login
  await page.click('button.bg-primary-500:has-text("登录")').catch(e => console.log("Click err:", e.message));
  await page.waitForTimeout(15000);
  
  var afterLogin = await page.evaluate(() => ({
    url: window.location.href,
    bodyText: document.body?.innerText?.slice(0, 500),
  }));
  console.log("=== AFTER LOGIN ===");
  console.log(JSON.stringify(afterLogin, null, 2));

  // Navigate to contact
  await page.goto("http://localhost:5199/#/contact", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  console.log("=== CONTACT ===");
  console.log(await page.evaluate(() => document.body?.innerText?.slice(0, 300)));

  // Navigate to settings
  await page.goto("http://localhost:5199/#/settings", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  console.log("=== SETTINGS ===");
  console.log(await page.evaluate(() => document.body?.innerText?.slice(0, 300)));

  await page.screenshot({ path: "/tmp/final-verify.png" });
  await browser.close();
  console.log("done");
})();
