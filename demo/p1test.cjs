const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  page.on("console", (msg) => {
    if (msg.type() === "error") console.log(`[error] ${msg.text().slice(0, 200)}`);
  });
  page.on("response", (res) => {
    if (res.status() === 500) console.log(`[500] ${res.url().replace("http://localhost:5199", "")}`);
  });

  // Login page
  await page.goto("http://localhost:5199/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(10000);
  var loginText = await page.evaluate(() => document.body?.innerText?.slice(0, 300));
  console.log("Login page:", loginText);

  // Check for tabs
  var tabs = await page.evaluate(() => Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim()));
  console.log("Buttons:", tabs);

  // Click login
  await page.click('button.bg-primary-500:has-text("登录")').catch(() => {});
  await page.waitForTimeout(15000);
  
  var afterLogin = await page.evaluate(() => ({
    url: window.location.href,
    bodyText: document.body?.innerText?.slice(0, 200),
  }));
  console.log("After login:", JSON.stringify(afterLogin));

  // Check settings
  await page.goto("http://localhost:5199/#/settings", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  var settingsText = await page.evaluate(() => document.body?.innerText?.slice(0, 200));
  console.log("Settings:", settingsText);

  // Check contact
  await page.goto("http://localhost:5199/#/contact", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  var contactText = await page.evaluate(() => document.body?.innerText?.slice(0, 200));
  console.log("Contact:", contactText);

  await page.screenshot({ path: "/tmp/p1-test.png" });
  await browser.close();
  console.log("done");
})();
