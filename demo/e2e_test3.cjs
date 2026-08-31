const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx1 = await browser.newContext({ viewport: { width: 640, height: 800 } });
  const ctx2 = await browser.newContext({ viewport: { width: 640, height: 800 } });
  const p1 = await ctx1.newPage(); // User1: 3004649357
  const p2 = await ctx2.newPage(); // User3: 3540424232

  p1.on("console", (msg) => { if (msg.type() !== "debug" && msg.type() !== "info") console.log(`[P1 ${msg.type()}] ${msg.text().slice(0,200)}`); });
  p2.on("console", (msg) => { if (msg.type() !== "debug" && msg.type() !== "info") console.log(`[P2 ${msg.type()}] ${msg.text().slice(0,200)}`); });

  // Login both
  console.log("=== Login User1 ===");
  await p1.goto("http://localhost:5199/", { waitUntil: "domcontentloaded" });
  await p1.waitForTimeout(10000);
  await p1.click('button.bg-primary-500:has-text("登录")').catch(() => {});
  await p1.waitForTimeout(12000);
  console.log("User1:", await p1.evaluate(() => window.location.href));

  console.log("=== Login User3 ===");
  await p2.goto("http://localhost:5199/", { waitUntil: "domcontentloaded" });
  await p2.waitForTimeout(10000);
  await p2.fill('input[placeholder*="手机号"]', "13700137000");
  await p2.fill('input[placeholder*="密码"]', "test123456");
  await p2.click('button.bg-primary-500:has-text("登录")').catch(() => {});
  await p2.waitForTimeout(12000);
  console.log("User3:", await p2.evaluate(() => window.location.href));

  // User1 adds User3
  console.log("\n=== User1 adds User3 ===");
  await p1.goto("http://localhost:5199/#/contact/requests");
  await p1.waitForTimeout(3000);
  await p1.locator("text=扫一扫").click().catch(e => console.log("err:", e.message));
  await p1.waitForTimeout(1000);
  await p1.fill('input[placeholder*="用户"]', "3540424232");
  await p1.waitForTimeout(500);
  await p1.locator('button:has-text("发送申请")').click();
  await p1.waitForTimeout(3000);
  console.log("Add friend sent");

  // Wait for sync then User3 checks
  console.log("\n=== User3 checks friend requests ===");
  await p2.waitForTimeout(5000); // Wait for SDK sync
  await p2.goto("http://localhost:5199/#/contact/requests");
  await p2.waitForTimeout(5000); // Wait for auto-refresh
  
  var p2Text = await p2.evaluate(() => document.body?.innerText);
  console.log("User3 friend requests page:");
  console.log(p2Text);
  
  // Look for accept button - it should be a small button with a Check icon
  var acceptBtns = await p2.locator('button.w-9.h-9.rounded-lg.bg-primary-50').count();
  console.log("Accept buttons found:", acceptBtns);
  
  if (acceptBtns > 0) {
    await p2.locator('button.w-9.h-9.rounded-lg.bg-primary-50').first().click();
    await p2.waitForTimeout(3000);
    console.log("Accept clicked!");
    
    // Check friends
    await p2.goto("http://localhost:5199/#/contact");
    await p2.waitForTimeout(3000);
    var p2Friends = await p2.evaluate(() => document.body?.innerText?.slice(0, 300));
    console.log("User3 friends:", p2Friends);
    
    // Check User1 friends
    await p1.goto("http://localhost:5199/#/contact");
    await p1.waitForTimeout(3000);
    var p1Friends = await p1.evaluate(() => document.body?.innerText?.slice(0, 300));
    console.log("User1 friends:", p1Friends);
    
    // Send message
    console.log("\n=== Send message ===");
    await p1.goto("http://localhost:5199/#/messages");
    await p1.waitForTimeout(3000);
    var convs = await p1.locator('.cursor-pointer').count();
    console.log("User1 conversations:", convs);
    
    if (convs > 0) {
      await p1.locator('.cursor-pointer').first().click();
      await p1.waitForTimeout(2000);
      await p1.fill('input[placeholder*="消息"]', "你好，这是测试消息！");
      await p1.waitForTimeout(500);
      await p1.locator('button.bg-primary-500:has(svg)').last().click().catch(() => {});
      await p1.waitForTimeout(3000);
      console.log("Message sent!");
      
      // Check User3 received
      await p2.goto("http://localhost:5199/#/messages");
      await p2.waitForTimeout(3000);
      var p2Msgs = await p2.evaluate(() => document.body?.innerText?.slice(0, 300));
      console.log("User3 messages:", p2Msgs);
    }
  } else {
    console.log("No accept buttons - checking all buttons on page");
    var allBtns = await p2.evaluate(() => Array.from(document.querySelectorAll('button')).map(b => ({text: b.textContent?.trim().slice(0,20), class: b.className.slice(0,60)})));
    console.log("All buttons:", JSON.stringify(allBtns.slice(0, 15), null, 1));
  }

  await browser.close();
  console.log("\n=== Done ===");
})();
