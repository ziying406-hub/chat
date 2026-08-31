const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on("console", (msg) => { if (msg.type() === "error") console.log(`[ERR] ${msg.text().slice(0,200)}`); });
  page.on("response", (res) => { if (res.status() === 500) console.log(`[500] ${res.url().replace("http://localhost:5199","")}`); });

  await page.goto("http://localhost:5199/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(10000);
  await page.click('button.bg-primary-500:has-text("登录")').catch(() => {});
  await page.waitForTimeout(12000);
  console.log("Logged in:", await page.evaluate(() => window.location.href));

  // Settings page - wait longer and check full text
  await page.goto("http://localhost:5199/#/settings");
  await page.waitForTimeout(5000);
  var settingsText = await page.evaluate(() => document.body?.innerText);
  console.log("\n=== SETTINGS FULL TEXT ===");
  console.log(settingsText?.slice(0, 500));

  // Check for specific items in full text
  console.log("\nSettings checks:");
  console.log("修改密码:", settingsText?.includes("修改密码"));
  console.log("账号切换:", settingsText?.includes("账号切换"));
  console.log("关于我们:", settingsText?.includes("关于我们"));
  console.log("开发者工具:", settingsText?.includes("开发者工具"));
  console.log("退出登录:", settingsText?.includes("退出登录"));

  // Group detail - first check groups list
  await page.goto("http://localhost:5199/#/contact/groups");
  await page.waitForTimeout(3000);
  var groupsText = await page.evaluate(() => document.body?.innerText?.slice(0, 300));
  console.log("\n=== GROUPS LIST ===");
  console.log(groupsText);
  
  // Find a group ID from the groups list
  var groupLinks = await page.locator("button:has(img)").count();
  console.log("Group buttons:", groupLinks);
  
  if (groupLinks > 0) {
    // Click first group
    await page.locator("button:has(img)").first().click();
    await page.waitForTimeout(3000);
    var groupText = await page.evaluate(() => document.body?.innerText?.slice(0, 600));
    console.log("\n=== GROUP DETAIL ===");
    console.log(groupText);
    console.log("\nGroup checks:");
    console.log("群昵称:", groupText?.includes("群昵称"));
    console.log("清空:", groupText?.includes("清空"));
    console.log("举报:", groupText?.includes("举报"));
    console.log("群管理:", groupText?.includes("群管理"));
  }

  // Chat view - check features
  await page.goto("http://localhost:5199/#/messages");
  await page.waitForTimeout(2000);
  var convs = await page.locator(".cursor-pointer").count();
  console.log("\n=== CHAT ===");
  console.log("Conversations:", convs);
  
  if (convs > 0) {
    // Click last conversation (single chat)
    await page.locator(".cursor-pointer").nth(convs - 1).click();
    await page.waitForTimeout(3000);
    
    var chatText = await page.evaluate(() => document.body?.innerText?.slice(0, 400));
    console.log("Chat text:", chatText?.slice(0, 200));
    
    // Check tool buttons
    var toolBtns = await page.evaluate(() => {
      var inputBar = document.querySelector('[class*="border-t"][class*="bg-white"]');
      if (!inputBar) return { count: 0, icons: [] };
      var svgs = inputBar.querySelectorAll("svg");
      return { count: svgs.length, icons: Array.from(svgs).map(s => Array.from(s.classList).filter(c => c.startsWith("lucide")).join(" ")) };
    });
    console.log("Tool buttons:", toolBtns.count, JSON.stringify(toolBtns.icons));
  }

  await browser.close();
  console.log("\n=== DONE ===");
})();
