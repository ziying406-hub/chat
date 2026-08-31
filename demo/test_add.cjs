const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "log") console.log(`[${msg.type()}] ${msg.text().slice(0, 300)}`);
  });

  await page.goto("http://localhost:5199/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(10000);
  await page.click('button.bg-primary-500:has-text("登录")').catch(() => {});
  await page.waitForTimeout(12000);

  // Go to friend requests page
  await page.goto("http://localhost:5199/#/contact/requests", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  
  var pageText = await page.evaluate(() => document.body?.innerText);
  console.log("=== Friend Requests Page ===");
  console.log(pageText);

  // Click 扫一扫 to add friend
  await page.click('button:has-text("扫一扫")').click().catch(() => {});
  await page.waitForTimeout(1000);
  
  // Type a userID - the second test user
  var addInput = await page.$('input[placeholder*="用户"]');
  if (addInput) {
    await addInput.fill("3847511793");
    await page.waitForTimeout(500);
    await page.click('button:has-text("发送申请")');
    await page.waitForTimeout(3000);
    console.log("=== After add friend ===");
    console.log(await page.evaluate(() => document.body?.innerText?.slice(0, 300)));
  } else {
    console.log("No add input found");
    // Try to find any input
    var inputs = await page.evaluate(() => Array.from(document.querySelectorAll('input')).map(i => i.placeholder));
    console.log("Inputs:", JSON.stringify(inputs));
  }

  // Go to create group
  await page.goto("http://localhost:5199/#/contact/create-group", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  console.log("=== Create Group Page ===");
  console.log(await page.evaluate(() => document.body?.innerText?.slice(0, 300)));

  await browser.close();
  console.log("done");
})();
