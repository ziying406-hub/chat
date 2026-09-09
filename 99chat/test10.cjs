const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  page.on("console", (msg) => {
    if (msg.type() === "error") console.log(`[error] ${msg.text().slice(0, 200)}`);
  });
  page.on("pageerror", (err) => console.log(`[PAGE ERROR] ${err.message}`));
  page.on("response", (res) => {
    if (res.status() === 404 && (res.url().includes("10002") || res.url().includes("10001"))) {
      console.log(`[404] ${res.url()}`);
    }
  });

  await page.goto("http://localhost:5199/#/auth/sign-in", { waitUntil: "networkidle" });
  await page.waitForTimeout(5000);

  // Login
  await page.click('button.bg-primary-500:has-text("登录")');
  await page.waitForTimeout(10000);
  
  console.log("URL:", page.url());
  await page.screenshot({ path: "/tmp/prod-messages.png" });
  console.log("1. messages page");

  await browser.close();
})();
