const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  
  // Two contexts for two users
  const ctx1 = await browser.newContext({ viewport: { width: 640, height: 800 } });
  const ctx2 = await browser.newContext({ viewport: { width: 640, height: 800 } });
  const p1 = await ctx1.newPage();
  const p2 = await ctx2.newPage();

  p1.on("console", (msg) => { if (msg.type() === "error" || msg.type() === "log") console.log(`[P1 ${msg.type()}] ${msg.text().slice(0,200)}`); });
  p2.on("console", (msg) => { if (msg.type() === "error" || msg.type() === "log") console.log(`[P2 ${msg.type()}] ${msg.text().slice(0,200)}`); });

  // === Step 1: User 1 login (13800138000) ===
  console.log("\n=== Step 1: User 1 login ===");
  await p1.goto("http://localhost:5199/", { waitUntil: "domcontentloaded" });
  await p1.waitForTimeout(10000);
  await p1.click('button.bg-primary-500:has-text("登录")').catch(() => {});
  await p1.waitForTimeout(12000);
  console.log("User1 URL:", await p1.evaluate(() => window.location.href));

  // === Step 2: User 2 login (13900139000) ===
  console.log("\n=== Step 2: User 2 login ===");
  await p2.goto("http://localhost:5199/", { waitUntil: "domcontentloaded" });
  await p2.waitForTimeout(10000);
  await p2.fill('input[placeholder*="手机号"]', "13900139000");
  await p2.fill('input[placeholder*="密码"]', "test123456");
  await p2.click('button.bg-primary-500:has-text("登录")').catch(() => {});
  await p2.waitForTimeout(12000);
  console.log("User2 URL:", await p2.evaluate(() => window.location.href));

  // === Step 3: User 1 goes to friend requests and adds User 2 ===
  console.log("\n=== Step 3: User 1 adds User 2 as friend ===");
  await p1.goto("http://localhost:5199/#/contact/requests");
  await p1.waitForTimeout(2000);
  
  // Click 扫一扫 to open add friend modal
  await p1.locator("text=扫一扫").click().catch(e => console.log("P1 click err:", e.message));
  await p1.waitForTimeout(1000);
  
  // Type User2's userID
  await p1.fill('input[placeholder*="用户"]', "3847511793");
  await p1.waitForTimeout(500);
  await p1.locator('button:has-text("发送申请")').click();
  await p1.waitForTimeout(3000);
  
  // Check for success toast
  var p1Text = await p1.evaluate(() => document.body?.innerText?.slice(0, 300));
  console.log("P1 after add:", p1Text);
  
  var hasToast = await p1.evaluate(() => document.body?.innerText?.includes("好友申请已发送"));
  console.log("Success toast shown:", hasToast);

  // === Step 4: User 2 checks friend requests and accepts ===
  console.log("\n=== Step 4: User 2 accepts friend request ===");
  await p2.goto("http://localhost:5199/#/contact/requests");
  await p2.waitForTimeout(5000); // Wait for sync
  
  var p2Text = await p2.evaluate(() => document.body?.innerText?.slice(0, 500));
  console.log("P2 friend requests page:", p2Text);
  
  // Check if there's a friend request from User1
  var hasRequest = await p2.evaluate(() => document.body?.innerText?.includes("3004649357") || document.body?.innerText?.includes("linwan"));
  console.log("Friend request visible to User2:", hasRequest);
  
  // Click accept button if available
  var acceptBtn = p2.locator('button:has(svg path[d*="M20"])').first(); // Check icon button
  var acceptCount = await p2.locator('.bg-primary-50 .text-primary-500').count().catch(() => 0);
  console.log("Accept buttons found:", acceptCount);

  // === Step 5: Verify both users now have each other as friends ===
  console.log("\n=== Step 5: Verify friendship ===");
  await p1.goto("http://localhost:5199/#/contact");
  await p1.waitForTimeout(3000);
  var p1Friends = await p1.evaluate(() => document.body?.innerText?.slice(0, 300));
  console.log("P1 contacts:", p1Friends);
  
  await p2.goto("http://localhost:5199/#/contact");
  await p2.waitForTimeout(3000);
  var p2Friends = await p2.evaluate(() => document.body?.innerText?.slice(0, 300));
  console.log("P2 contacts:", p2Friends);

  // === Step 6: User 1 sends a message to User 2 ===
  console.log("\n=== Step 6: Send message ===");
  // Navigate to messages and find the conversation
  await p1.goto("http://localhost:5199/#/messages");
  await p1.waitForTimeout(3000);
  var p1Msgs = await p1.evaluate(() => document.body?.innerText?.slice(0, 300));
  console.log("P1 messages:", p1Msgs);
  
  // Click first conversation if exists
  var convCount = await p1.locator('.cursor-pointer').count();
  console.log("Conversations:", convCount);
  
  if (convCount > 0) {
    await p1.locator('.cursor-pointer').first().click();
    await p1.waitForTimeout(2000);
    
    // Type and send message
    var msgInput = p1.locator('input[placeholder*="消息"]');
    if (await msgInput.count() > 0) {
      await msgInput.fill("你好！这是一条测试消息");
      await p1.waitForTimeout(500);
      // Click send button
      await p1.locator('button.bg-primary-500:has(svg)').last().click().catch(() => {});
      await p1.waitForTimeout(3000);
      console.log("Message sent!");
      
      // Check User2 receives the message
      await p2.goto("http://localhost:5199/#/messages");
      await p2.waitForTimeout(3000);
      var p2Msgs = await p2.evaluate(() => document.body?.innerText?.slice(0, 500));
      console.log("P2 messages:", p2Msgs);
    } else {
      console.log("No message input found");
    }
  } else {
    console.log("No conversations - need to create one first");
  }

  await browser.close();
  console.log("\n=== E2E test done ===");
})();
