const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  page.on("console", (msg) => console.log(`[${msg.type()}] ${msg.text().slice(0, 400)}`));
  page.on("pageerror", (err) => console.log(`[PAGE ERROR] ${err.message}`));
  page.on("requestfailed", (req) => console.log(`[REQ FAIL] ${req.url()}`));
  page.on("worker", (worker) => {
    console.log("[WORKER] created:", worker.url());
    worker.on("close", () => console.log("[WORKER] closed"));
  });

  await page.goto("http://localhost:5199/#/auth/sign-in", { waitUntil: "networkidle" });
  await page.waitForTimeout(5000);

  // Now click login
  console.log("=== Clicking login ===");
  await page.click('button.bg-primary-500:has-text("登录")');
  await page.waitForTimeout(20000);
  console.log("FINAL URL:", page.url());
  
  await browser.close();
})();
