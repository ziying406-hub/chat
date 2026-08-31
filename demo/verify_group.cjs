const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on("console", (msg) => { if (msg.type() === "error" || msg.type() === "log") console.log(`[${msg.type()}] ${msg.text().slice(0,200)}`); });

  await page.goto("http://localhost:5199/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(10000);
  await page.click('button.bg-primary-500:has-text("登录")').catch(() => {});
  await page.waitForTimeout(12000);

  // Go to create group
  await page.goto("http://localhost:5199/#/contact/create-group");
  await page.waitForTimeout(2000);

  // Check if friends list is populated
  var friends = await page.locator('button:has(.w-5.h-5)').count();
  console.log("Friend checkboxes:", friends);

  if (friends > 0) {
    // Click first friend
    await page.locator('button:has(.w-5.h-5)').first().click();
    await page.waitForTimeout(500);
    
    // Type group name
    await page.fill('input[placeholder="群名称"]', "测试群");
    await page.waitForTimeout(500);
    
    // Check button state
    var btnText = await page.locator('button:has-text("完成")').textContent();
    var btnDisabled = await page.locator('button:has-text("完成")').isDisabled();
    console.log("Button text:", btnText, "| Disabled:", btnDisabled);
    
    // Try clicking it
    await page.locator('button:has-text("完成")').click();
    await page.waitForTimeout(5000);
    console.log("After click URL:", await page.evaluate(() => window.location.href));
  } else {
    console.log("No friends - testing empty state");
    var pageText = await page.evaluate(() => document.body?.innerText?.slice(0, 300));
    console.log("Page:", pageText);
  }

  await browser.close();
  console.log("done");
})();
