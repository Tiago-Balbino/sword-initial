#!/usr/bin/env node
/** Navega autenticado (cookies.json) e captura TODAS as operações /api/v3 (op+hash+variables)
 * das páginas de objeto (inbox/wishlists/trips/profile). SÓ LEITURA (GET de navegação).
 * Salva o mapa de ops em recon/hunt/ops_capturadas.json — pra identificar as com id de objeto (BOLA).
 */
const { chromium } = require("playwright");
const fs = require("fs");
const HDR = { "X-HackerOne-Researcher": "moldret" };
const COOKIES = JSON.parse(fs.readFileSync(__dirname + "/cookies.json", "utf8"));
const BASE = "https://www.airbnb.com.br";
const PAGES = ["/", "/wishlists", "/trips", "/guest/inbox", "/users/profile", "/account-settings", "/hosting"];

const ops = {}; // operationName -> {hash, variablesSamples:Set, urls:count}

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
      if (!ops[op]) ops[op] = { hash, variables: [], count: 0, method: req.method() };
      ops[op].count++;
      try {
        const vars = new URL(u).searchParams.get("variables");
        if (vars && ops[op].variables.length < 3) ops[op].variables.push(decodeURIComponent(vars));
      } catch (e) {}
    }
  });
  for (const p of PAGES) {
    try {
      process.stdout.write(`  navegando ${p} … `);
      await page.goto(BASE + p, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(2500);
      console.log("ok");
    } catch (e) { console.log("timeout/err:", e.message.slice(0, 60)); }
  }
  await browser.close();
  // relatório: ops com id de objeto nos variables (candidatas a BOLA)
  const idKeys = /("|)(id|Id|listingId|reservationId|threadId|wishlistId|userId|confirmationCode|productId|messageThreadId|hostId|paymentId)("|)\s*:/;
  console.log("\n=== OPS CAPTURADAS (" + Object.keys(ops).length + ") ===");
  const withId = [];
  for (const [op, d] of Object.entries(ops).sort()) {
    const hasId = d.variables.some(v => idKeys.test(v));
    const tag = hasId ? "🎯 ID" : "  ";
    console.log(`${tag} ${op}  (${d.count}x)  hash=${d.hash.slice(0,12)}…`);
    if (hasId) { withId.push(op); d.variables.forEach(v => console.log(`       vars: ${v.slice(0,200)}`)); }
  }
  console.log("\n=== COM ID DE OBJETO (candidatas BOLA): " + withId.join(", ") + " ===");
  fs.writeFileSync("/Users/tiagobalbinoferreira/Documents/Sword/targets/airbnb/recon/hunt/ops_capturadas.json", JSON.stringify(ops, null, 1));
  console.log("salvo: ops_capturadas.json");
})();
