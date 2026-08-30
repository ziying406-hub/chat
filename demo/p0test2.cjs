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

  await page.goto("http://localhost:5199/#/auth/sign-in", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(12000);
  
  var beforeLogin = await page.evaluate(() => document.body?.innerText?.slice(0, 200));
  console.log("Before login:", beforeLogin);

  // Click login button
  await page.click('button.bg-primary-500:has-text("登录")').catch(e => console.log("Click failed:", e.message));
  await page.waitForTimeout(15000);

  var afterLogin = await page.evaluate(() => ({
    url: window.location.href,
    bodyText: document.body?.innerText?.slice(0, 500),
  }));
  console.log("After login:", JSON.stringify(afterLogin, null, 2));
  
  await page.screenshot({ path: "/tmp/p0-after-login.png" });
  
  // Navigate to settings/profile
  await page.goto("http://localhost:5199/#/settings/profile", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  var profileText = await page.evaluate(() => document.body?.innerText?.slice(0, 300));
  console.log("Profile:", profileText);
  await page.screenshot({ path: "/tmp/p0-profile-edit.png" });

  await browser.close();
  console.log("done");
})();
