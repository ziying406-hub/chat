const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  page.on("console", (msg) => {
    if (msg.type() === "error") console.log(`[error] ${msg.text().slice(0, 200)}`);
  });
  page.on("response", (res) => {
    if (res.status() === 404) console.log(`[404] ${res.url().replace("http://localhost:10002", "")}`);
  });

  await page.goto("http://localhost:5199/#/auth/sign-in", { waitUntil: "networkidle" });
  await page.waitForTimeout(5000);

  await page.click('button.bg-primary-500:has-text("登录")');
  await page.waitForTimeout(10000);
  
  console.log("URL:", page.url());
  await page.screenshot({ path: "/tmp/prod-messages2.png" });
  console.log("1. messages");

  // Check conversation list content
  const convItems = await page.$$(".cursor-pointer");
  console.log("Conversations:", convItems.length);

  // Click first conversation
  if (convItems.length > 0) {
    await convItems[0].click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "/tmp/prod-chat.png" });
    console.log("2. chat view");
  }

  // Contacts
  await page.goto("http://localhost:5199/#/contact", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "/tmp/prod-contacts.png" });
  console.log("3. contacts");

  // Settings
  await page.goto("http://localhost:5199/#/settings", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "/tmp/prod-settings.png" });
  console.log("4. settings");

  await browser.close();
  console.log("done");
})();
