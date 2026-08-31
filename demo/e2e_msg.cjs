const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx1 = await browser.newContext({ viewport: { width: 640, height: 800 } });
  const ctx2 = await browser.newContext({ viewport: { width: 640, height: 800 } });
  const p1 = await ctx1.newPage();
  const p2 = await ctx2.newPage();

  p1.on("console", (msg) => { if (msg.type() === "error" || msg.type() === "log") console.log(`[P1] ${msg.text().slice(0,200)}`); });
  p2.on("console", (msg) => { if (msg.type() === "error" || msg.type() === "log") console.log(`[P2] ${msg.text().slice(0,200)}`); });

  // Login both users
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

  // User1 goes to contacts and clicks on friend
  console.log("\n=== User1 clicks friend to start chat ===");
  await p1.goto("http://localhost:5199/#/contact");
  await p1.waitForTimeout(3000);
  
  // Click on the friend (linwan)
  await p1.locator("text=linwan").first().click().catch(e => console.log("click err:", e.message));
  await p1.waitForTimeout(2000);
  console.log("User1 on user profile:", await p1.evaluate(() => window.location.href));
  
  // Click "发消息" button
  var sendMsgBtn = p1.locator('button:has-text("发消息")');
  var btnCount = await sendMsgBtn.count();
  console.log("Send message buttons:", btnCount);
  
  if (btnCount > 0) {
    await sendMsgBtn.first().click();
    await p1.waitForTimeout(3000);
    console.log("User1 on chat:", await p1.evaluate(() => window.location.href));
    
    // Check if message input exists
    var msgInput = p1.locator('input[placeholder*="消息"]');
    var inputCount = await msgInput.count();
    console.log("Message input found:", inputCount);
    
    if (inputCount > 0) {
      // Send message
      await msgInput.fill("你好！这是端到端测试消息 🎉");
      await p1.waitForTimeout(500);
      await p1.locator('button.bg-primary-500:has(svg)').last().click().catch(() => {});
      await p1.waitForTimeout(3000);
      console.log("Message sent!");
      
      // Check User2 received
      await p2.goto("http://localhost:5199/#/messages");
      await p2.waitForTimeout(5000);
      var p2Text = await p2.evaluate(() => document.body?.innerText?.slice(0, 500));
      console.log("User3 messages page:", p2Text);
      
      // Check if conversation appeared
      var p2Convs = await p2.locator('.cursor-pointer').count();
      console.log("User3 conversations:", p2Convs);
      
      if (p2Convs > 0) {
        // Click the conversation and read message
        await p2.locator('.cursor-pointer').first().click();
        await p2.waitForTimeout(2000);
        var chatText = await p2.evaluate(() => document.body?.innerText?.slice(0, 500));
        console.log("User3 chat view:", chatText);
      }
    }
  } else {
    // Try navigating to messages and checking conversations
    await p1.goto("http://localhost:5199/#/messages");
    await p1.waitForTimeout(3000);
    var convCount = await p1.locator('.cursor-pointer').count();
    console.log("User1 conversations:", convCount);
    var msgText = await p1.evaluate(() => document.body?.innerText?.slice(0, 300));
    console.log("User1 messages:", msgText);
  }

  await browser.close();
  console.log("\n=== Done ===");
})();
