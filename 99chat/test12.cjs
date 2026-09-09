const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  page.on("console", (msg) => {
    const t = msg.text();
    if (msg.type() === "error" || t.includes("99chat")) {
      console.log(`[${msg.type()}] ${t.slice(0, 200)}`);
    }
  });
  page.on("pageerror", (err) => console.log(`[PAGE ERROR] ${err.message}`));

  await page.goto("http://localhost:5199/#/auth/sign-in", { waitUntil: "networkidle" });
  await page.waitForTimeout(5000);

  // Login as user1
  await page.click('button.bg-primary-500:has-text("登录")');
  await page.waitForTimeout(10000);
  console.log("URL after login:", page.url());
  await page.screenshot({ path: "/tmp/prod-main.png" });

  // Type a message in the input
  const input = await page.$('input[placeholder="输入消息..."]');
  if (input) {
    await input.fill("测试消息");
    await page.waitForTimeout(500);
    await page.click('button.bg-primary-500:has(svg)');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "/tmp/prod-sent.png" });
    console.log("Message sent!");
  } else {
    console.log("No input found - no conversation selected");
    // Go to contacts and try to add friend
    await page.goto("http://localhost:5199/#/contact/requests", { waitUntil: "networkidle" });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "/tmp/prod-requests.png" });
    console.log("Friend requests page");
  }

  await browser.close();
  console.log("done");
})();
