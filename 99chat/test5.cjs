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

  // Test SDK initialization directly
  const result = await page.evaluate(async () => {
    try {
      console.log("Importing SDK...");
      const mod = await import("@openim/wasm-client-sdk");
      console.log("SDK imported, getting instance...");
      const sdk = mod.getSDK({
        coreWasmPath: "/openIM.wasm",
        sqlWasmPath: "/sql-wasm.wasm",
        debug: true,
      });
      console.log("SDK instance created, calling login...");
      
      // First login via chat API
      const res = await fetch("http://localhost:10008/account/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", operationID: "test-" + Date.now() },
        body: JSON.stringify({ areaCode: "+86", phoneNumber: "13800138000", password: "test123456", platform: 5, autoLogin: true }),
      });
      const data = await res.json();
      console.log("Chat login OK, userID:", data.data.userID);
      
      console.log("SDK login starting...");
      const loginResult = await sdk.login({
        userID: data.data.userID,
        token: data.data.imToken,
        platformID: 5,
        apiAddr: "http://localhost:10002/api",
        wsAddr: "ws://localhost:10001",
      });
      console.log("SDK login result:", loginResult);
      return "SUCCESS: " + loginResult;
    } catch (e) {
      console.log("ERROR:", e.message, e.stack);
      return "ERROR: " + e.message;
    }
  });
  console.log("RESULT:", result);

  await page.waitForTimeout(5000);
  await browser.close();
})();
