const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  page.on("console", (msg) => {
    console.log(`[console.${msg.type()}] ${msg.text()}`);
  });
  page.on("pageerror", (err) => console.log(`[PAGE ERROR] ${err.message}`));
  page.on("requestfailed", (req) => console.log(`[REQ FAIL] ${req.url()} - ${req.failure()?.errorText}`));

  await page.goto("http://localhost:5199/#/auth/sign-in", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);

  // Check for error messages on page
  const errorEl = await page.$(".bg-red-50");
  if (errorEl) {
    const errorText = await errorEl.textContent();
    console.log("ERROR DISPLAYED:", errorText);
  }

  // Try clicking login and wait longer
  console.log("=== Clicking login ===");
  await page.click('button:has-text("登录")');
  await page.waitForTimeout(8000);
  
  const errorEl2 = await page.$(".bg-red-50");
  if (errorEl2) {
    const errorText = await errorEl2.textContent();
    console.log("AFTER LOGIN ERROR:", errorText);
  }
  
  const url = page.url();
  console.log("FINAL URL:", url);

  await page.screenshot({ path: "/tmp/prod-debug.png" });
  
  await browser.close();
})();
