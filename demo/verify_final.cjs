const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on("console", (msg) => { if (msg.type() === "error") console.log(`[ERR] ${msg.text().slice(0,150)}`); });
  page.on("response", (res) => { if (res.status() === 500) console.log(`[500] ${res.url().replace("http://localhost:5199","")}`); });

  await page.goto("http://localhost:5199/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(10000);
  await page.click('button.bg-primary-500:has-text("登录")').catch(() => {});
  await page.waitForTimeout(12000);
  console.log("Logged in:", await page.evaluate(() => window.location.href));

  // Test messages page features
  await page.goto("http://localhost:5199/#/messages");
  await page.waitForTimeout(2000);
  
  // Check filter tabs
  var filterTabs = await page.evaluate(() => Array.from(document.querySelectorAll("button")).map(b => b.textContent?.trim()).filter(t => ["全部","群聊","未读"].includes(t)));
  console.log("Filter tabs:", JSON.stringify(filterTabs));

  // Test privacy page
  await page.goto("http://localhost:5199/#/settings/privacy");
  await page.waitForTimeout(2000);
  var privacyText = await page.evaluate(() => document.body?.innerText?.slice(0, 300));
  console.log("\nPrivacy page:");
  console.log("加好友验证:", privacyText?.includes("加好友需要验证"));
  console.log("加群验证:", privacyText?.includes("加群需要验证"));
  console.log("黑名单:", privacyText?.includes("黑名单"));

  // Test group detail
  await page.goto("http://localhost:5199/#/contact/group/3165103642");
  await page.waitForTimeout(2000);
  var groupText = await page.evaluate(() => document.body?.innerText?.slice(0, 500));
  console.log("\nGroup detail:");
  console.log("群昵称:", groupText?.includes("群昵称") || groupText?.includes("我的群昵称"));
  console.log("清空消息:", groupText?.includes("清空"));
  console.log("举报:", groupText?.includes("举报"));
  console.log("群管理:", groupText?.includes("群管理"));

  // Test settings page
  await page.goto("http://localhost:5199/#/settings");
  await page.waitForTimeout(2000);
  var settingsText = await page.evaluate(() => document.body?.innerText?.slice(0, 400));
  console.log("\nSettings:");
  console.log("修改密码:", settingsText?.includes("修改密码"));
  console.log("账号切换:", settingsText?.includes("账号切换"));
  console.log("关于我们:", settingsText?.includes("关于我们"));
  console.log("开发者工具:", settingsText?.includes("开发者工具"));

  await browser.close();
  console.log("\n=== DONE ===");
})();
