const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  page.on("console", (msg) => {
    console.log(`[${msg.type()}] ${msg.text().slice(0, 300)}`);
  });
  page.on("pageerror", (err) => console.log(`[PAGE ERROR] ${err.message}`));

  await page.goto("http://localhost:5199/#/auth/sign-in", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);

  // Inject a test: call loginUser directly and log
  const result = await page.evaluate(async () => {
    try {
      console.log("Starting login test...");
      const res = await fetch("http://localhost:10008/account/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", operationID: "test-" + Date.now() },
        body: JSON.stringify({ areaCode: "+86", phoneNumber: "13800138000", password: "test123456", platform: 5, autoLogin: true }),
      });
      const data = await res.json();
      console.log("Login API response:", JSON.stringify(data));
      return JSON.stringify(data);
    } catch (e) {
      console.log("Login API error:", e.message);
      return "ERROR: " + e.message;
    }
  });
  console.log("EVAL RESULT:", result);

  await page.waitForTimeout(2000);
  await browser.close();
})();
