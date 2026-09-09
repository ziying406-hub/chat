const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on("console", (msg) => { 
    if (msg.text().includes("DEBUG") || msg.type() === "error") 
      console.log(`[${msg.type()}] ${msg.text().slice(0,300)}`); 
  });

  await page.goto("http://localhost:5199/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(10000);
  await page.click('button.bg-primary-500:has-text("登录")').catch(() => {});
  await page.waitForTimeout(15000);

  // Navigate to groups page
  await page.goto("http://localhost:5199/#/contact/groups");
  await page.waitForTimeout(5000);

  // Get group IDs from the store by evaluating
  var groupIds = await page.evaluate(() => {
    // Access the Zustand store
    var store = window.__ZUSTAND_STORE__;
    if (store) return JSON.stringify(store.getState().groups);
    // Try to find store in React fiber
    var root = document.getElementById("root");
    var fiber = root?._reactRootContainer?._internalRoot?.current;
    return "store not accessible directly";
  }).catch(e => "err: " + e.message);
  console.log("Groups in store:", groupIds?.slice(0, 500));

  // Try clicking group by evaluating the href
  var groupHrefs = await page.evaluate(() => {
    // Find all buttons that might be group links
    var btns = Array.from(document.querySelectorAll("button"));
    return btns.filter(b => {
      var text = b.textContent || "";
      return text.includes("人") && (text.includes("测试群") || text.includes("123"));
    }).map(b => b.textContent?.trim().slice(0, 60));
  });
  console.log("Group buttons:", JSON.stringify(groupHrefs));

  // Click the first group and check the URL
  if (groupHrefs.length > 0) {
    // Click it
    var clicked = await page.evaluate(() => {
      var btns = Array.from(document.querySelectorAll("button"));
      var groupBtn = btns.find(b => (b.textContent || "").includes("人") && (b.textContent || "").includes("123"));
      if (groupBtn) { groupBtn.click(); return true; }
      return false;
    });
    console.log("Clicked group:", clicked);
    await page.waitForTimeout(3000);
    var url = await page.evaluate(() => window.location.href);
    console.log("URL after click:", url);
    var text = await page.evaluate(() => document.body?.innerText?.slice(0, 800));
    console.log("Page text:", text?.slice(0, 500));
  }

  await browser.close();
  console.log("\n=== DONE ===");
})();
