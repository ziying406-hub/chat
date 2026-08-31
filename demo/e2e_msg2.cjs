const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx1 = await browser.newContext({ viewport: { width: 640, height: 800 } });
  const ctx2 = await browser.newContext({ viewport: { width: 640, height: 800 } });
  const p1 = await ctx1.newPage();
  const p2 = await ctx2.newPage();

  p1.on("console", (msg) => { if (msg.type() === "error" || msg.type() === "log") console.log(`[P1] ${msg.text().slice(0,200)}`); });
  p2.on("console", (msg) => { if (msg.type() === "error" || msg.type() === "log") console.log(`[P2] ${msg.text().slice(0,200)}`); });

  // Login both
  await p1.goto("http://localhost:5199/", { waitUntil: "domcontentloaded" });
  await p1.waitForTimeout(10000);
  await p1.click('button.bg-primary-500:has-text("登录")').catch(() => {});
  await p1.waitForTimeout(12000);

  await p2.goto("http://localhost:5199/", { waitUntil: "domcontentloaded" });
  await p2.waitForTimeout(10000);
  await p2.fill('input[placeholder*="手机号"]', "13700137000");
  await p2.fill('input[placeholder*="密码"]', "test123456");
  await p2.click('button.bg-primary-500:has-text("登录")').catch(() => {});
  await p2.waitForTimeout(12000);
  console.log("Both logged in");

  // User1 goes to messages
  console.log("\n=== User1 sends message ===");
  await p1.goto("http://localhost:5199/#/messages");
  await p1.waitForTimeout(3000);

  // Click on the conversation
  var convCount = await p1.locator('.cursor-pointer').count();
  console.log("Conversations:", convCount);

  if (convCount > 0) {
    await p1.locator('.cursor-pointer').first().click();
    await p1.waitForTimeout(2000);
    console.log("Chat URL:", await p1.evaluate(() => window.location.href));

    // Type and send message
    var msgInput = p1.locator('input[placeholder*="消息"]');
    if (await msgInput.count() > 0) {
      await msgInput.fill("你好！端到端测试消息 🎉");
      await p1.waitForTimeout(500);
      // Find send button (the one with Send icon, not in the nav)
      var sendBtns = await p1.locator('button.w-9.h-9.rounded-lg.bg-primary-500').count();
      console.log("Send buttons:", sendBtns);
      if (sendBtns > 0) {
        await p1.locator('button.w-9.h-9.rounded-lg.bg-primary-500').first().click();
      } else {
        // Try pressing Enter
        await msgInput.press("Enter");
      }
      await p1.waitForTimeout(3000);
      console.log("Message sent!");

      // Check messages in chat
      var chatText = await p1.evaluate(() => document.body?.innerText?.slice(0, 500));
      console.log("User1 chat:", chatText);

      // Wait and check User2
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
    } else {
      console.log("No message input");
      var inputs = await p1.evaluate(() => Array.from(document.querySelectorAll('input')).map(i => i.placeholder));
      console.log("Inputs:", JSON.stringify(inputs));
    }
  } else {
    console.log("No conversations");
  }

  await browser.close();
  console.log("\n=== Done ===");
})();
