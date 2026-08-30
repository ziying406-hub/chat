const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  page.on("console", (msg) => {
    const text = msg.text();
    if (text.includes("99chat") || text.includes("error") || text.includes("Error") || msg.type() === "error") {
      console.log(`[${msg.type()}] ${text.slice(0, 400)}`);
    }
  });
  page.on("pageerror", (err) => console.log(`[PAGE ERROR] ${err.message}`));

  await page.goto("http://localhost:5199/#/auth/sign-in", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);

  console.log("=== Clicking login ===");
  await page.click('button:has-text("登录")');
  await page.waitForTimeout(15000);
  
  console.log("FINAL URL:", page.url());
  await browser.close();
})();
