#!/usr/bin/env node
const { chromium } = require("playwright");
const fs = require("fs");
const HDR = { "X-HackerOne-Researcher": "moldret" };
const COOKIES = JSON.parse(fs.readFileSync(__dirname + "/cookies.json", "utf8"));
const BASE = "https://www.airbnb.com.br";
const PAGES = ["/become-a-host", "/hosting/reservations", "/hosting/listings", "/multicalendar",
               "/help", "/rooms/messages/inbox", "/experiences/host", "/hosting/earnings",
               "/wishlists", "/wishlists/current", "/users/show/1768931195641399446"];
const ops = {};
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ extraHTTPHeaders: HDR, ignoreHTTPSErrors: true });
  await ctx.addCookies(COOKIES);
  const page = await ctx.newPage();
  page.on("request", req => {
    const u = req.url();
    const m = u.match(/\/api\/v3\/([A-Za-z0-9_]+)\/([0-9a-f]{64})/);
    if (m) {
      const [_, op, hash] = m;
      if (!ops[op]) ops[op] = { hash, variables: [], count: 0 };
      ops[op].count++;
      try { const vars = new URL(u).searchParams.get("variables");
        if (vars && ops[op].variables.length < 2) ops[op].variables.push(decodeURIComponent(vars)); } catch(e){}
    }
  });
  for (const p of PAGES) {
    try { process.stdout.write(`  ${p} … `);
      await page.goto(BASE + p, { waitUntil: "networkidle", timeout: 20000 });
      await page.waitForTimeout(2000); console.log("ok");
    } catch (e) { console.log("timeout"); }
  }
  await browser.close();
  const idKeys = /("|)(id|Id|listingId|reservationId|threadId|wishlistId|userId|confirmationCode|productId|hostId|paymentId|payoutId|earningId)("|)\s*:/;
  console.log("\n=== NOVAS OPS (" + Object.keys(ops).length + ") ===");
  const prev = JSON.parse(fs.readFileSync("/Users/tiagobalbinoferreira/Documents/Sword/targets/airbnb/recon/hunt/ops_capturadas.json","utf8"));
  for (const [op, d] of Object.entries(ops).sort()) {
    if (prev[op]) continue;
    const hasId = d.variables.some(v => idKeys.test(v));
    console.log(`${hasId?"🎯 ID":"  "} ${op} (${d.count}x) hash=${d.hash.slice(0,12)}…`);
    if (hasId) d.variables.forEach(v=>console.log(`     vars: ${v.slice(0,180)}`));
    prev[op] = d;
  }
  fs.writeFileSync("/Users/tiagobalbinoferreira/Documents/Sword/targets/airbnb/recon/hunt/ops_capturadas.json", JSON.stringify(prev, null, 1));
})();
