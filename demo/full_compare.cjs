const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  
  // Two contexts
  const ourCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const refCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const our = await ourCtx.newPage();
  const ref = await refCtx.newPage();

  // Collect errors
  our.on("console", (msg) => { if (msg.type() === "error") console.log(`[OUR ERR] ${msg.text().slice(0,150)}`); });
  ref.on("console", (msg) => { if (msg.type() === "error") console.log(`[REF ERR] ${msg.text().slice(0,150)}`); });

  // Login both apps
  console.log("=== Login ===");
  await our.goto("http://localhost:5199/", { waitUntil: "domcontentloaded" });
  await our.waitForTimeout(10000);
  await our.click('button.bg-primary-500:has-text("登录")').catch(() => {});
  await our.waitForTimeout(12000);
  console.log("Our: " + await our.evaluate(() => window.location.href));

  // Reference: try register with verify code
  await ref.goto("https://pwa.6cchh6.com/auth/sign-up", { waitUntil: "domcontentloaded" });
  await ref.waitForTimeout(5000);
  await ref.fill('input[name="phoneNumber"]', "13700137000").catch(() => {});
  await ref.click("text=获取验证码").catch(() => {});
  await ref.waitForTimeout(3000);
  await ref.fill('input[name="oneTimeCode"]', "666666").catch(() => {});
  await ref.click('button:has-text("注册")').catch(() => {});
  await ref.waitForTimeout(8000);
  var refUrl = await ref.evaluate(() => window.location.href);
  console.log("Ref: " + refUrl);

  // If register failed, try login with verify code
  if (refUrl.includes("sign")) {
    await ref.goto("https://pwa.6cchh6.com/auth/sign-in");
    await ref.waitForTimeout(3000);
    await ref.click("text=验证码登录").catch(() => {});
    await ref.waitForTimeout(1000);
    await ref.fill('input[name="phoneNumber"]', "13800138000").catch(() => {});
    await ref.click("text=获取验证码").catch(() => {});
    await ref.waitForTimeout(3000);
    await ref.fill('input[name="password"]', "666666").catch(() => {});
    await ref.click('button[type="submit"]').catch(() => {});
    await ref.waitForTimeout(8000);
    refUrl = await ref.evaluate(() => window.location.href);
    console.log("Ref retry: " + refUrl);
  }

  // Helper: extract ALL interactive elements from a page
  async function extractPage(page, label) {
    return await page.evaluate((label) => {
      var result = { label, url: window.location.href };
      var els = [];
      document.querySelectorAll("*").forEach(el => {
        var rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;
        var tag = el.tagName.toLowerCase();
        if (!["button","a","input","select","textarea"].includes(tag)) return;
        if (el.closest("[class*='hidden']")) return;
        var text = "";
        el.childNodes.forEach(n => { if (n.nodeType === 3) text += n.textContent; });
        text = text.trim().slice(0, 40);
        var svg = el.querySelector("svg");
        var iconClass = svg ? Array.from(svg.classList).filter(c => c.startsWith("lucide")).join(" ") : "";
        els.push({
          tag, text, icon: iconClass,
          type: el.getAttribute("type") || "",
          placeholder: el.getAttribute("placeholder") || "",
          href: el.getAttribute("href") || "",
          x: Math.round(rect.x), y: Math.round(rect.y),
          w: Math.round(rect.width), h: Math.round(rect.height),
        });
      });
      // Also get all visible text sections
      result.bodyText = document.body?.innerText?.slice(0, 600);
      result.elements = els;
      return result;
    }, label);
  }

  // If reference app is logged in, do full comparison
  if (!refUrl.includes("sign")) {
    console.log("\n=== REFERENCE APP LOGGED IN - FULL COMPARISON ===");
    
    var pages = [
      { name: "messages", our: "http://localhost:5199/#/messages", ref: "https://pwa.6cchh6.com/messages" },
      { name: "contacts", our: "http://localhost:5199/#/contact", ref: "https://pwa.6cchh6.com/contact" },
      { name: "settings", our: "http://localhost:5199/#/settings", ref: "https://pwa.6cchh6.com/settings" },
    ];

    for (var p of pages) {
      console.log(`\n\n======== ${p.name.toUpperCase()} ========`);
      await our.goto(p.our);
      await our.waitForTimeout(3000);
      await ref.goto(p.ref);
      await ref.waitForTimeout(5000);

      var ourData = await extractPage(our, "99chat");
      var refData = await extractPage(ref, "66快捷版");

      console.log(`\n--- 66快捷版 ${p.name} (${refData.elements.length} elements) ---`);
      refData.elements.forEach(e => {
        console.log(`  ${e.tag} "${e.text}" ${e.icon ? "["+e.icon+"]" : ""} ${e.placeholder ? "ph="+e.placeholder : ""} ${e.href ? "href="+e.href : ""} [${e.x},${e.y}] ${e.w}x${e.h}`);
      });
      console.log("  Text: " + refData.bodyText?.slice(0, 200));

      console.log(`\n--- 99chat ${p.name} (${ourData.elements.length} elements) ---`);
      ourData.elements.forEach(e => {
        console.log(`  ${e.tag} "${e.text}" ${e.icon ? "["+e.icon+"]" : ""} ${e.placeholder ? "ph="+e.placeholder : ""} ${e.href ? "href="+e.href : ""} [${e.x},${e.y}] ${e.w}x${e.h}`);
      });
      console.log("  Text: " + ourData.bodyText?.slice(0, 200));

      // Find differences
      var refTexts = refData.elements.map(e => (e.text || e.placeholder || e.href || e.icon).trim()).filter(Boolean);
      var ourTexts = ourData.elements.map(e => (e.text || e.placeholder || e.href || e.icon).trim()).filter(Boolean);
      var missingInOurs = refTexts.filter(t => !ourTexts.some(o => o.includes(t) || t.includes(o)));
      var missingInRef = ourTexts.filter(t => !refTexts.some(r => r.includes(t) || t.includes(r)));
      
      if (missingInOurs.length > 0) {
        console.log(`\n❌ Missing in 99chat:`);
        missingInOurs.forEach(t => console.log(`   - ${t}`));
      }
      if (missingInRef.length > 0) {
        console.log(`\n⚠️ Extra in 99chat:`);
        missingInRef.forEach(t => console.log(`   - ${t}`));
      }
      if (missingInOurs.length === 0 && missingInRef.length === 0) {
        console.log(`\n✅ No differences`);
      }
    }

    // Also compare a chat view if possible
    console.log(`\n\n======== CHAT VIEW ========`);
    await our.goto("http://localhost:5199/#/messages");
    await our.waitForTimeout(2000);
    var ourConvs = await our.locator(".cursor-pointer").count();
    if (ourConvs > 0) {
      await our.locator(".cursor-pointer").last().click();
      await our.waitForTimeout(3000);
      var ourChat = await extractPage(our, "99chat-chat");
      console.log(`\n--- 99chat Chat (${ourChat.elements.length} elements) ---`);
      ourChat.elements.forEach(e => {
        console.log(`  ${e.tag} "${e.text}" ${e.icon ? "["+e.icon+"]" : ""} ${e.placeholder ? "ph="+e.placeholder : ""} [${e.x},${e.y}] ${e.w}x${e.h}`);
      });
      console.log("  Text: " + ourChat.bodyText?.slice(0, 300));
    }

    // Compare reference chat view
    await ref.goto("https://pwa.6cchh6.com/messages");
    await ref.waitForTimeout(3000);
    var refConvs = await ref.locator("[class*='cursor-pointer'], [class*='conversation'], a").count();
    if (refConvs > 0) {
      await ref.locator("[class*='cursor-pointer'], [class*='conversation'], a").first().click().catch(() => {});
      await ref.waitForTimeout(3000);
      var refChat = await extractPage(ref, "66快捷版-chat");
      console.log(`\n--- 66快捷版 Chat (${refChat.elements.length} elements) ---`);
      refChat.elements.forEach(e => {
        console.log(`  ${e.tag} "${e.text}" ${e.icon ? "["+e.icon+"]" : ""} ${e.placeholder ? "ph="+e.placeholder : ""} [${e.x},${e.y}] ${e.w}x${e.h}`);
      });
      console.log("  Text: " + refChat.bodyText?.slice(0, 300));

      // Diff chat elements
      var refChatTexts = refChat.elements.map(e => (e.text || e.placeholder || e.icon).trim()).filter(Boolean);
      var ourChatTexts = ourChat.elements.map(e => (e.text || e.placeholder || e.icon).trim()).filter(Boolean);
      var chatMissing = refChatTexts.filter(t => !ourChatTexts.some(o => o.includes(t) || t.includes(o)));
      if (chatMissing.length > 0) {
        console.log(`\n❌ Missing in 99chat chat:`);
        chatMissing.forEach(t => console.log(`   - ${t}`));
      } else {
        console.log(`\n✅ Chat view: No differences`);
      }
    }
  } else {
    console.log("\n⚠️ Cannot login to 66快捷版 - comparing UI structure from route JS only");
  }

  await browser.close();
  console.log("\n=== DONE ===");
})();
