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
  await page.goto("http://localhost:5199/#/contact/requests");
  await page.waitForTimeout(3000);
  
  // Click 扫一扫 button
  await page.locator("text=扫一扫").click().catch(e => console.log("click err:", e.message));
  await page.waitForTimeout(1000);
  
  // Type userID in the input
  var addInput = page.locator('input[placeholder*="用户"]');
  var inputCount = await addInput.count();
  console.log("Input count:", inputCount);
  
  if (inputCount > 0) {
    await addInput.fill("3847511793");
    await page.waitForTimeout(500);
    await page.locator('button:has-text("发送申请")').click();
    await page.waitForTimeout(3000);
    console.log("=== After add friend ===");
    console.log(await page.evaluate(() => document.body?.innerText?.slice(0, 300)));
  } else {
    console.log("No input found, checking page state");
    var inputs = await page.evaluate(() => Array.from(document.querySelectorAll('input')).map(i => i.placeholder));
    console.log("All inputs:", JSON.stringify(inputs));
  }

  // Go to create group
  await page.goto("http://localhost:5199/#/contact/create-group");
  await page.waitForTimeout(2000);
  console.log("=== Create Group Page ===");
  var groupText = await page.evaluate(() => document.body?.innerText?.slice(0, 300));
  console.log(groupText);
  
  // Check if friends list is empty
  var friendCheckboxes = await page.locator('button:has(.w-5.h-5)').count();
  console.log("Friend checkboxes:", friendCheckboxes);

  await browser.close();
  console.log("done");
})();
