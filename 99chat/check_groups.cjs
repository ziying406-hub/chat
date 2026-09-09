const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on("console", (msg) => { if (msg.type() === "error") console.log(`[ERR] ${msg.text().slice(0,200)}`); });

  await page.goto("http://localhost:5199/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(10000);
  await page.click('button.bg-primary-500:has-text("登录")').catch(() => {});
  await page.waitForTimeout(15000);

  // Go to groups page and extract group IDs
  await page.goto("http://localhost:5199/#/contact/groups");
  await page.waitForTimeout(5000);
  
  // Wait for groups to load
  await page.waitForTimeout(3000);
  
  // Navigate to each group detail
  var groupInfo = await page.evaluate(() => {
    // Check store state
    var text = document.body?.innerText || "";
    return text.slice(0, 500);
  });
  console.log("Groups page text:", groupInfo);
  
  // Click first group link in the groups list (not friends)
  var groupBtns = await page.locator("button:has(img)").all();
  console.log("Total buttons with images:", groupBtns.length);
  
  // The groups are at the bottom of the page, after friends
  // Let's click the ones that have "人" (member count) in text
  for (var i = 0; i < groupBtns.length; i++) {
    var text = await groupBtns[i].textContent();
    if (text && text.includes("人")) {
      console.log("Clicking group:", text.trim().slice(0, 50));
      await groupBtns[i].click();
      await page.waitForTimeout(3000);
      
      var detailText = await page.evaluate(() => document.body?.innerText?.slice(0, 800));
      console.log("\n=== GROUP DETAIL ===");
      console.log(detailText);
      break;
    }
  }

  await browser.close();
  console.log("\n=== DONE ===");
})();
