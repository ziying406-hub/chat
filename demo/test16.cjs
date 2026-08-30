const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.text().includes("99chat")) {
      console.log(`[${msg.type()}] ${msg.text().slice(0, 200)}`);
    }
  });
  page.on("response", (res) => {
    if (res.status() === 500) console.log(`[500] ${res.url().replace("http://localhost:5199", "")}`);
  });

  await page.goto("http://localhost:5199/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector('button.bg-primary-500', { timeout: 15000 });
  console.log("Login page ready");
  await page.waitForTimeout(2000);

  // Login
  await page.click('button.bg-primary-500:has-text("登录")');
  console.log("Login clicked");
  
  // Wait for redirect
  await page.waitForURL("**/#/messages", { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(5000);
  console.log("URL:", page.url());
  await page.screenshot({ path: "/tmp/prod-main2.png" });

  // Check conversations
  const convs = await page.$$('.cursor-pointer');
  console.log("Conversations:", convs.length);

  // Navigate to contacts
  await page.goto("http://localhost:5199/#/contact", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "/tmp/prod-contacts2.png" });
  console.log("Contacts page");

  // Settings
  await page.goto("http://localhost:5199/#/settings", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "/tmp/prod-settings2.png" });
  console.log("Settings page");

  await browser.close();
  console.log("done");
})();
