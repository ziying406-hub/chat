const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  
  const ctx1 = await browser.newContext({ viewport: { width: 640, height: 800 } });
  const ctx2 = await browser.newContext({ viewport: { width: 640, height: 800 } });
  const p1 = await ctx1.newPage(); // User1: 13800138000 (3004649357)
  const p2 = await ctx2.newPage(); // User3: 13700137000 (3540424232)

  p1.on("console", (msg) => { if (msg.type() !== "debug") console.log(`[P1 ${msg.type()}] ${msg.text().slice(0,200)}`); });
  p2.on("console", (msg) => { if (msg.type() !== "debug") console.log(`[P2 ${msg.type()}] ${msg.text().slice(0,200)}`); });

  // Login User1
  console.log("=== Login User1 (13800138000) ===");
  await p1.goto("http://localhost:5199/", { waitUntil: "domcontentloaded" });
  await p1.waitForTimeout(10000);
  await p1.click('button.bg-primary-500:has-text("登录")').catch(() => {});
  await p1.waitForTimeout(12000);
  console.log("User1 logged in:", await p1.evaluate(() => window.location.href));

  // Login User3
  console.log("=== Login User3 (13700137000) ===");
  await p2.goto("http://localhost:5199/", { waitUntil: "domcontentloaded" });
  await p2.waitForTimeout(10000);
  await p2.fill('input[placeholder*="手机号"]', "13700137000");
  await p2.fill('input[placeholder*="密码"]', "test123456");
  await p2.click('button.bg-primary-500:has-text("登录")').catch(() => {});
  await p2.waitForTimeout(12000);
  console.log("User3 logged in:", await p2.evaluate(() => window.location.href));

  // User1 adds User3 as friend
  console.log("\n=== User1 adds User3 (3540424232) ===");
  await p1.goto("http://localhost:5199/#/contact/requests");
  await p1.waitForTimeout(2000);
  await p1.locator("text=扫一扫").click().catch(e => console.log("click err:", e.message));
  await p1.waitForTimeout(1000);
  await p1.fill('input[placeholder*="用户"]', "3540424232");
  await p1.waitForTimeout(500);
  await p1.locator('button:has-text("发送申请")').click();
  await p1.waitForTimeout(3000);
  var toast = await p1.evaluate(() => document.body?.innerText?.includes("好友申请已发送"));
  console.log("Add friend success toast:", toast);

  // User3 checks and accepts
  console.log("\n=== User3 checks friend requests ===");
  await p2.goto("http://localhost:5199/#/contact/requests");
  await p2.waitForTimeout(5000);
  var p2Text = await p2.evaluate(() => document.body?.innerText);
  console.log("User3 page text:", p2Text.slice(0, 500));
  
  // Find and click accept button
  var acceptBtns = await p2.locator('.bg-primary-50').count();
  console.log("Accept buttons:", acceptBtns);
  
  if (acceptBtns > 0) {
    // Click the first accept button (green check icon)
    await p2.locator('.bg-primary-50').first().click();
    await p2.waitForTimeout(3000);
    console.log("Accept clicked");
    
    // Check updated friend requests
    var afterAccept = await p2.evaluate(() => document.body?.innerText?.slice(0, 300));
    console.log("After accept:", afterAccept);
  }

  // Check both users' friend lists
  console.log("\n=== Check friend lists ===");
  await p1.goto("http://localhost:5199/#/contact");
  await p1.waitForTimeout(3000);
  var p1Friends = await p1.evaluate(() => document.body?.innerText?.slice(0, 300));
  console.log("User1 friends:", p1Friends);
  
  await p2.goto("http://localhost:5199/#/contact");
  await p2.waitForTimeout(3000);
  var p2Friends = await p2.evaluate(() => document.body?.innerText?.slice(0, 300));
  console.log("User3 friends:", p2Friends);

  // Send message from User1 to User3
  console.log("\n=== Send message ===");
  await p1.goto("http://localhost:5199/#/messages");
  await p1.waitForTimeout(3000);
  var convCount = await p1.locator('.cursor-pointer').count();
  console.log("User1 conversations:", convCount);
  
  if (convCount > 0) {
    await p1.locator('.cursor-pointer').first().click();
    await p1.waitForTimeout(2000);
    await p1.fill('input[placeholder*="消息"]', "你好，我是林晚！");
    await p1.waitForTimeout(500);
    await p1.locator('button.bg-primary-500:has(svg)').last().click();
    await p1.waitForTimeout(3000);
    console.log("Message sent!");
    
    // Check User3 received
    await p2.goto("http://localhost:5199/#/messages");
    await p2.waitForTimeout(3000);
    var p2Msgs = await p2.evaluate(() => document.body?.innerText?.slice(0, 300));
    console.log("User3 messages:", p2Msgs);
  } else {
    console.log("No conversations yet");
  }

  await browser.close();
  console.log("\n=== Done ===");
})();
