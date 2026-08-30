const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.text().includes("99chat")) {
      console.log(`[${msg.type()}] ${msg.text().slice(0, 200)}`);
    }
  });

  await page.goto("http://localhost:5199/#/auth/sign-in", { waitUntil: "domcontentloaded" });
  // Wait for the login button to appear (WASM loads in background)
  await page.waitForSelector('button.bg-primary-500', { timeout: 30000 });
  console.log("Login page ready");
  await page.waitForTimeout(2000);

  // Login
  await page.click('button.bg-primary-500:has-text("登录")');
  console.log("Login clicked, waiting for redirect...");
  
  // Wait for redirect to /messages
  await page.waitForURL("**/#/messages", { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(5000);
  console.log("URL:", page.url());
  await page.screenshot({ path: "/tmp/prod-final.png" });

  await browser.close();
  console.log("done");
})();
