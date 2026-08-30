const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  // Capture console
  page.on("console", (msg) => {
    const type = msg.type();
    if (type === "error" || type === "warning") {
      console.log(`[${type}] ${msg.text()}`);
    }
  });
  page.on("pageerror", (err) => console.log(`[PAGE ERROR] ${err.message}`));

  // Login page
  console.log("=== Loading login page ===");
  await page.goto("http://localhost:5199/#/auth/sign-in", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "/tmp/prod-login.png" });
  console.log("1. login page loaded");

  // Click login button (default credentials are pre-filled)
  console.log("=== Clicking login ===");
  await page.click('button:has-text("登录")');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: "/tmp/prod-messages.png" });
  console.log("2. after login");
  
  // Check if we're on messages page
  const url = page.url();
  console.log("URL:", url);

  await browser.close();
  console.log("done");
})();
