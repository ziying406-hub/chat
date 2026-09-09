const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  // Capture ALL console output
  page.on("console", (msg) => console.log(`[${msg.type()}] ${msg.text().slice(0,300)}`));
  page.on("pageerror", (err) => console.log(`[PAGEERROR] ${err.message}`));
  page.on("response", (res) => { if (res.status() >= 400) console.log(`[${res.status()}] ${res.url().replace("http://localhost:5199","")}`); });

  await page.goto("http://localhost:5199/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(10000);
  await page.click('button.bg-primary-500:has-text("登录")').catch(() => {});
  await page.waitForTimeout(15000);

  // Go to groups list first, wait for data to load
  await page.goto("http://localhost:5199/#/contact/groups");
  await page.waitForTimeout(5000);
  
  // Now click the "123" group
  var clicked = await page.evaluate(() => {
    var btns = Array.from(document.querySelectorAll("button"));
    var groupBtn = btns.find(b => (b.textContent || "").includes("123") && (b.textContent || "").includes("人"));
    if (groupBtn) { groupBtn.click(); return true; }
    return false;
  });
  console.log("Clicked group:", clicked);
  await page.waitForTimeout(5000);
  
  var url = await page.evaluate(() => window.location.href);
  console.log("URL:", url);
  
  var html = await page.evaluate(() => document.getElementById("root")?.innerHTML?.slice(0, 500));
  console.log("Root HTML:", html);
  
  var bodyText = await page.evaluate(() => document.body?.innerText);
  console.log("Body text:", bodyText?.slice(0, 500));
  
  await browser.close();
})();
