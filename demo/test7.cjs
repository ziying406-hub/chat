const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  page.on("console", (msg) => {
    const text = msg.text();
    console.log(`[${msg.type()}] ${text.slice(0, 400)}`);
  });
  page.on("pageerror", (err) => console.log(`[PAGE ERROR] ${err.message}`));

  await page.goto("http://localhost:5199/#/auth/sign-in", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);

  // Click the actual login button (the one at the bottom, not the tab)
  console.log("=== Clicking login button ===");
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await btn.textContent();
    const cls = await btn.getAttribute('class');
    console.log("  button:", text.trim(), "| class:", cls?.slice(0, 50));
  }
  
  // Click the submit button (has bg-primary-500 and full width)
  await page.click('button.bg-primary-500:has-text("登录")');
  
  await page.waitForTimeout(15000);
  
  console.log("FINAL URL:", page.url());
  await browser.close();
})();
