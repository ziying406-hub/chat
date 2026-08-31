const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  // Use wider viewport to avoid mobile tabbar issues
  const ctx1 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const p1 = await ctx1.newPage();
  const p2 = await ctx2.newPage();

  p1.on("console", (msg) => { if (msg.type() === "error" || msg.type() === "log") console.log(`[P1] ${msg.text().slice(0,200)}`); });
  p2.on("console", (msg) => { if (msg.type() === "error" || msg.type() === "log") console.log(`[P2] ${msg.text().slice(0,200)}`); });

  // Login both
  await p1.goto("http://localhost:5199/", { waitUntil: "domcontentloaded" });
  await p1.waitForTimeout(10000);
  await p1.click('button.bg-primary-500:has-text("登录")').catch(() => {});
  await p1.waitForTimeout(12000);
  console.log("User1 logged in");

  await p2.goto("http://localhost:5199/", { waitUntil: "domcontentloaded" });
  await p2.waitForTimeout(10000);
  await p2.fill('input[placeholder*="手机号"]', "13700137000");
  await p2.fill('input[placeholder*="密码"]', "test123456");
  await p2.click('button.bg-primary-500:has-text("登录")').catch(() => {});
  await p2.waitForTimeout(12000);
  console.log("User3 logged in");

  // User1 sends message
  console.log("\n=== User1 sends message ===");
  await p1.goto("http://localhost:5199/#/messages");
  await p1.waitForTimeout(3000);
  
  var convCount = await p1.locator('.cursor-pointer').count();
  console.log("Conversations:", convCount);
  
  if (convCount > 0) {
    await p1.locator('.cursor-pointer').first().click();
    await p1.waitForTimeout(2000);
    
    var msgInput = p1.locator('input[placeholder*="消息"]');
    if (await msgInput.count() > 0) {
      await msgInput.fill("你好！端到端测试 🎉");
      await p1.waitForTimeout(500);
      // Use Enter key to send
      await msgInput.press("Enter");
      await p1.waitForTimeout(3000);
      console.log("Message sent!");
      
      var chatText = await p1.evaluate(() => document.body?.innerText);
      console.log("User1 chat:", chatText.slice(0, 500));
    }
  }

  // User3 checks
  console.log("\n=== User3 receives ===");
  await p2.goto("http://localhost:5199/#/messages");
  await p2.waitForTimeout(5000);
  var p2Text = await p2.evaluate(() => document.body?.innerText?.slice(0, 500));
  console.log("User3 messages:", p2Text);
  
  var p2Convs = await p2.locator('.cursor-pointer').count();
  console.log("User3 conversations:", p2Convs);
  
  if (p2Convs > 0) {
    await p2.locator('.cursor-pointer').first().click();
    await p2.waitForTimeout(2000);
    var p2Chat = await p2.evaluate(() => document.body?.innerText?.slice(0, 500));
    console.log("User3 chat:", p2Chat);
  }

  await browser.close();
  console.log("\n=== Done ===");
})();
