const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  page.on("console", (msg) => {
    console.log(`[${msg.type()}] ${msg.text().slice(0, 200)}`);
  });
  page.on("pageerror", (err) => console.log(`[PAGE ERROR] ${err.message}`));
  page.on("requestfailed", (req) => console.log(`[REQ FAIL] ${req.url()}`));
  page.on("response", async (res) => {
    const url = res.url();
    if (url.includes("10008") || url.includes("10002") || url.includes("10001") || url.includes("wasm")) {
      const status = res.status();
      let body = "";
      try { body = (await res.text()).slice(0, 200); } catch {}
      console.log(`[RES ${status}] ${url} => ${body}`);
    }
  });

  await page.goto("http://localhost:5199/#/auth/sign-in", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);

  console.log("=== Clicking login ===");
  await page.click('button:has-text("登录")');
  await page.waitForTimeout(15000);
  
  console.log("FINAL URL:", page.url());
  await browser.close();
})();
