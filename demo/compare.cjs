const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });

  // Two contexts - one for each app
  const ourCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const refCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const our = await ourCtx.newPage();
  const ref = await refCtx.newPage();

  // === LOGIN BOTH APPS ===
  console.log("=== Logging in to 99chat ===");
  await our.goto("http://localhost:5199/", { waitUntil: "domcontentloaded" });
  await our.waitForTimeout(10000);
  await our.click('button.bg-primary-500:has-text("登录")').catch(() => {});
  await our.waitForTimeout(12000);
  console.log("99chat URL:", await our.evaluate(() => window.location.href));

  console.log("=== Logging in to 66快捷版 ===");
  await ref.goto("https://pwa.6cchh6.com/auth/sign-in", { waitUntil: "domcontentloaded" });
  await ref.waitForTimeout(5000);
  await ref.fill('input[name="phoneNumber"]', "13800138000").catch(e => console.log("ref phone err:", e.message));
  await ref.fill('input[name="password"]', "test123456").catch(() => {});
  await ref.waitForTimeout(500);
  await ref.click('button[type="submit"]').catch(() => {});
  await ref.waitForTimeout(8000);
  var refUrl = await ref.evaluate(() => window.location.href);
  console.log("66快捷版 URL:", refUrl);

  // If login failed, try verify code login
  if (refUrl.includes("sign-in")) {
    console.log("Password login failed, trying verify code...");
    await ref.click('button:has-text("验证码登录")').catch(() => {});
    await ref.waitForTimeout(2000);
    await ref.fill('input[name="phoneNumber"]', "13800138000").catch(() => {});
    await ref.click('button:has-text("获取验证码")').catch(() => {});
    await ref.waitForTimeout(3000);
    await ref.fill('input[name="password"]', "666666").catch(() => {});
    await ref.click('button[type="submit"]').catch(() => {});
    await ref.waitForTimeout(8000);
    refUrl = await ref.evaluate(() => window.location.href);
    console.log("After verify code login:", refUrl);
  }

  if (refUrl.includes("sign-in")) {
    console.log("Cannot login to reference app. Comparing login pages only.");
  }

  // === COMPARISON: Login Page ===
  console.log("\n=== 1. LOGIN PAGE COMPARISON ===");
  await our.goto("http://localhost:5199/#/auth/sign-in");
  await our.waitForTimeout(3000);
  await ref.goto("https://pwa.6cchh6.com/auth/sign-in");
  await ref.waitForTimeout(3000);

  var ourLogin = await our.evaluate(() => ({
    text: document.body?.innerText,
    buttons: Array.from(document.querySelectorAll("button")).map(b => b.textContent?.trim()),
    inputs: Array.from(document.querySelectorAll("input")).map(i => ({ name: i.name, type: i.type, placeholder: i.placeholder })),
    links: Array.from(document.querySelectorAll("a")).map(a => ({ text: a.textContent?.trim(), href: a.getAttribute("href") })),
  }));
  var refLogin = await ref.evaluate(() => ({
    text: document.body?.innerText,
    buttons: Array.from(document.querySelectorAll("button")).map(b => b.textContent?.trim()),
    inputs: Array.from(document.querySelectorAll("input")).map(i => ({ name: i.name, type: i.type, placeholder: i.placeholder })),
    links: Array.from(document.querySelectorAll("a")).map(a => ({ text: a.textContent?.trim(), href: a.getAttribute("href") })),
  }));

  console.log("\n--- 66快捷版 Login ---");
  console.log("Text:", refLogin.text);
  console.log("Buttons:", JSON.stringify(refLogin.buttons));
  console.log("Inputs:", JSON.stringify(refLogin.inputs));
  console.log("Links:", JSON.stringify(refLogin.links));

  console.log("\n--- 99chat Login ---");
  console.log("Text:", ourLogin.text);
  console.log("Buttons:", JSON.stringify(ourLogin.buttons));
  console.log("Inputs:", JSON.stringify(ourLogin.inputs));
  console.log("Links:", JSON.stringify(ourLogin.links));

  // Compare
  var loginDiff = [];
  if (refLogin.buttons.includes("验证码登录") && !ourLogin.buttons.includes("验证码登录")) loginDiff.push("Missing: 验证码登录 tab");
  if (refLogin.links.some(l => l.href?.includes("forgot-password")) && !ourLogin.links.some(l => l.href?.includes("forgot-password"))) loginDiff.push("Missing: forgot password link");
  if (refLogin.links.some(l => l.href?.includes("sign-up")) && !ourLogin.links.some(l => l.href?.includes("sign-up"))) loginDiff.push("Missing: sign-up link");
  console.log("\n--- Login Diff ---");
  console.log(loginDiff.length === 0 ? "No differences found" : loginDiff.join("\n"));

  // === COMPARISON: Messages Page ===
  if (!refUrl.includes("sign-in")) {
    console.log("\n=== 2. MESSAGES LIST COMPARISON ===");
    await our.goto("http://localhost:5199/#/messages");
    await our.waitForTimeout(3000);
    await ref.goto("https://pwa.6cchh6.com/messages");
    await ref.waitForTimeout(5000);

    var ourMsgs = await our.evaluate(() => ({
      text: document.body?.innerText?.slice(0, 800),
      navButtons: Array.from(document.querySelectorAll("nav button, .sidebar button, [class*='nav'] button")).map(b => b.textContent?.trim()),
      items: document.querySelectorAll(".cursor-pointer, [class*='conversation']").length,
    }));
    var refMsgs = await ref.evaluate(() => ({
      text: document.body?.innerText?.slice(0, 800),
      navButtons: Array.from(document.querySelectorAll("nav button, .sidebar button, [class*='nav'] button, [class*='bottom'] button")).map(b => b.textContent?.trim()),
      items: document.querySelectorAll("[class*='conversation'], [class*='session'], [class*='chat-item']").length,
    }));

    console.log("\n--- 66快捷版 Messages ---");
    console.log("Text:", refMsgs.text?.slice(0, 300));
    console.log("Nav:", JSON.stringify(refMsgs.navButtons));
    console.log("Items:", refMsgs.items);

    console.log("\n--- 99chat Messages ---");
    console.log("Text:", ourMsgs.text?.slice(0, 300));
    console.log("Nav:", JSON.stringify(ourMsgs.navButtons));
    console.log("Items:", ourMsgs.items);

    // === COMPARISON: Contact Page ===
    console.log("\n=== 3. CONTACTS COMPARISON ===");
    await our.goto("http://localhost:5199/#/contact");
    await our.waitForTimeout(3000);
    await ref.goto("https://pwa.6cchh6.com/contact");
    await ref.waitForTimeout(3000);

    var ourContact = await our.evaluate(() => document.body?.innerText?.slice(0, 500));
    var refContact = await ref.evaluate(() => document.body?.innerText?.slice(0, 500));

    console.log("\n--- 66快捷版 Contacts ---");
    console.log(refContact?.slice(0, 300));
    console.log("\n--- 99chat Contacts ---");
    console.log(ourContact?.slice(0, 300));

    // === COMPARISON: Settings Page ===
    console.log("\n=== 4. SETTINGS COMPARISON ===");
    await our.goto("http://localhost:5199/#/settings");
    await our.waitForTimeout(3000);
    await ref.goto("https://pwa.6cchh6.com/settings");
    await ref.waitForTimeout(3000);

    var ourSettings = await our.evaluate(() => document.body?.innerText?.slice(0, 500));
    var refSettings = await ref.evaluate(() => document.body?.innerText?.slice(0, 500));

    console.log("\n--- 66快捷版 Settings ---");
    console.log(refSettings?.slice(0, 300));
    console.log("\n--- 99chat Settings ---");
    console.log(ourSettings?.slice(0, 300));

    // === COMPARISON: Chat View ===
    console.log("\n=== 5. CHAT VIEW COMPARISON ===");
    await our.goto("http://localhost:5199/#/messages");
    await our.waitForTimeout(2000);
    var ourConvCount = await our.locator(".cursor-pointer").count();
    if (ourConvCount > 0) {
      await our.locator(".cursor-pointer").first().click();
      await our.waitForTimeout(2000);
      var ourChat = await our.evaluate(() => ({
        url: window.location.href,
        text: document.body?.innerText?.slice(0, 500),
        hasInput: !!document.querySelector('input[placeholder*="消息"]'),
        hasEmojiBtn: !!document.querySelector('button:has(svg)'),
        buttons: Array.from(document.querySelectorAll("button")).map(b => b.textContent?.trim().slice(0, 20)).filter(Boolean),
      }));
      console.log("\n--- 99chat Chat ---");
      console.log("URL:", ourChat.url);
      console.log("Has input:", ourChat.hasInput);
      console.log("Text:", ourChat.text?.slice(0, 300));
    }

    // Reference chat view
    await ref.goto("https://pwa.6cchh6.com/messages");
    await ref.waitForTimeout(3000);
    var refConvItems = await ref.locator("[class*='conversation'], [class*='session'], [class*='chat-item'], .cursor-pointer").count();
    console.log("\n--- 66快捷版 Chat ---");
    console.log("Conversation items:", refConvItems);
    var refMsgText = await ref.evaluate(() => document.body?.innerText?.slice(0, 300));
    console.log("Text:", refMsgText);
  }

  await browser.close();
  console.log("\n=== COMPARISON COMPLETE ===");
})();
