const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  page.on("console", (msg) => {
    console.log(`[${msg.type()}] ${msg.text().slice(0, 300)}`);
  });
  page.on("pageerror", (err) => console.log(`[PAGE ERROR] ${err.message}`));

  await page.goto("http://localhost:5199/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(10000);
  
  console.log("URL:", page.url());
  const title = await page.title();
  console.log("Title:", title);
  
  // Get page content
  const bodyText = await page.evaluate(() => document.body?.innerText?.slice(0, 200));
  console.log("Body text:", bodyText);
  
  await page.screenshot({ path: "/tmp/prod-browser.png" });
  await browser.close();
})();
