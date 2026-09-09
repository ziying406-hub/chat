const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on("console", (msg) => { if (msg.type() === "error" || msg.type() === "log") console.log(`[${msg.type()}] ${msg.text().slice(0,200)}`); });

  await page.goto("http://localhost:5199/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(10000);
  await page.click('button.bg-primary-500:has-text("登录")').catch(() => {});
  await page.waitForTimeout(12000);

  // Go to the conversation with notifications
  await page.goto("http://localhost:5199/#/messages");
  await page.waitForTimeout(3000);
  var convs = await page.locator('.cursor-pointer').count();
  console.log("Conversations:", convs);
  
  if (convs > 0) {
    await page.locator('.cursor-pointer').first().click();
    await page.waitForTimeout(2000);
    
    // Check if notification text appears as "你们已成为好友" instead of raw JSON
    var chatText = await page.evaluate(() => document.body?.innerText);
    var hasRawJson = chatText.includes('"fromToUserID"') || chatText.includes('"handleResult"');
    var hasFriendlyText = chatText.includes('你们已成为好友') || chatText.includes('系统通知');
    
    console.log("Raw JSON visible:", hasRawJson);
    console.log("Friendly text visible:", hasFriendlyText);
    console.log("Chat text (first 400):", chatText.slice(0, 400));
  }
  
  await browser.close();
  console.log("done");
})();
