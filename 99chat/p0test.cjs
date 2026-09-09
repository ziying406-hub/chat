const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  page.on("console", (msg) => {
    if (msg.type() === "error") console.log(`[error] ${msg.text().slice(0, 200)}`);
  });
  page.on("pageerror", (err) => console.log(`[PAGE ERR] ${err.message}`));

  await page.goto("http://localhost:5199/#/auth/sign-in", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(10000);

  // Login
  await page.click('button.bg-primary-500:has-text("登录")').catch(() => {});
  await page.waitForTimeout(12000);

  var state = await page.evaluate(() => ({
    url: window.location.href,
    bodyText: document.body?.innerText?.slice(0, 500),
  }));
  console.log("State:", JSON.stringify(state, null, 2));
  
  await page.screenshot({ path: "/tmp/p0-test.png" });
  
  // Navigate to settings
  await page.goto("http://localhost:5199/#/settings", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "/tmp/p0-settings.png" });
  console.log("Settings OK");

  // Navigate to settings/profile
  await page.goto("http://localhost:5199/#/settings/profile", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "/tmp/p0-profile.png" });
  console.log("Profile OK");

  // Navigate to contact
  await page.goto("http://localhost:5199/#/contact", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "/tmp/p0-contact.png" });
  console.log("Contact OK");

  await browser.close();
  console.log("done");
})();
