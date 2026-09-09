const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  page.on("console", (msg) => {
    const t = msg.text();
    if (t.includes("99chat") || t.includes("error") || t.includes("Error") || msg.type() === "error" || t.includes("wasm") || t.includes("Go") || t.includes("login")) {
      console.log(`[${msg.type()}] ${t.slice(0, 400)}`);
    }
  });
  page.on("pageerror", (err) => console.log(`[PAGE ERROR] ${err.message}`));
  page.on("worker", (worker) => console.log("[WORKER]", worker.url()));

  await page.goto("http://localhost:5199/#/auth/sign-in", { waitUntil: "networkidle" });
  await page.waitForTimeout(5000);

  console.log("=== Clicking login ===");
  await page.click('button.bg-primary-500:has-text("登录")');
  await page.waitForTimeout(20000);
  console.log("FINAL URL:", page.url());
  await page.screenshot({ path: "/tmp/prod-after-login.png" });
  
  await browser.close();
})();
