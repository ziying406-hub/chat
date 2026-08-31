const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on("console", (msg) => { if (msg.type() === "error") console.log(`[ERR] ${msg.text().slice(0,200)}`); });

  await page.goto("http://localhost:5199/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(10000);
  await page.click('button.bg-primary-500:has-text("登录")').catch(() => {});
  await page.waitForTimeout(12000);

  // Navigate directly to group detail with known group ID
  await page.goto("http://localhost:5199/#/contact/group/3165103642");
  await page.waitForTimeout(5000);
  
  var groupText = await page.evaluate(() => document.body?.innerText?.slice(0, 800));
  console.log("=== GROUP DETAIL ===");
  console.log(groupText);
  
  console.log("\nGroup checks:");
  console.log("群昵称:", groupText?.includes("群昵称") || groupText?.includes("我的群昵称"));
  console.log("清空:", groupText?.includes("清空"));
  console.log("举报:", groupText?.includes("举报"));
  console.log("群管理:", groupText?.includes("群管理"));
  console.log("公开群:", groupText?.includes("公开"));
  console.log("入群:", groupText?.includes("入群"));
  
  // Also check call overlay features
  await page.goto("http://localhost:5199/#/messages");
  await page.waitForTimeout(2000);
  var convs = await page.locator(".cursor-pointer").count();
  if (convs > 0) {
    // Click last conv (suxia - single chat)
    await page.locator(".cursor-pointer").nth(convs - 1).click();
    await page.waitForTimeout(3000);
    
    // Click call button (phone)
    await page.locator('button:has(svg.lucide-phone)').first().click().catch(() => {});
    await page.waitForTimeout(3000);
    
    var callText = await page.evaluate(() => document.body?.innerText?.slice(0, 300));
    console.log("\n=== CALL OVERLAY ===");
    console.log(callText);
    console.log("\nCall checks:");
    console.log("等待接听:", callText?.includes("等待") || callText?.includes("呼叫"));
    console.log("发消息:", callText?.includes("发消息") || callText?.includes("消息"));
    console.log("静音:", callText?.includes("静音"));
    
    // Close call
    await page.locator('button:has(svg.lucide-phone-off)').click().catch(() => {});
  }
  
  await browser.close();
  console.log("\n=== DONE ===");
})();
