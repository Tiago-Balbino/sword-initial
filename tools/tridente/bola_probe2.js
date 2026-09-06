#!/usr/bin/env node
const { chromium } = require("playwright");
const fs = require("fs");
const HDR = { "X-HackerOne-Researcher": "moldret", "X-Airbnb-API-Key": "d306zoyjsyarp7ifhu67rjxn52tv0t20", "X-Airbnb-GraphQL-Platform": "web" };
const COOKIES = JSON.parse(fs.readFileSync(__dirname + "/cookies.json", "utf8"));
const BASE = "https://www.airbnb.com.br";
const MYNUM = "1768931195641399446";
const gid = n => Buffer.from("User:" + n).toString("base64").replace(/=+$/,"");
const opsCap = JSON.parse(fs.readFileSync("/Users/tiagobalbinoferreira/Documents/Sword/targets/airbnb/recon/hunt/ops_capturadas.json","utf8"));

const TESTS = [
  { op: "HostRecommendedActionsCountQuery", vars: id => ({userId:id, includeListingIds:false}) },
  { op: "UserDirectMessageQuery", vars: id => ({userId: gid(MYNUM), destinationUserId: id}) }, // eu -> destino variável
];
const IDS = { "meu(baseline, destino=eu mesmo)": gid(MYNUM), "inexistente-0": gid("0"), "inexistente-big": gid("9999999999999999999") };

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ extraHTTPHeaders: HDR, ignoreHTTPSErrors: true });
  await ctx.addCookies(COOKIES);
  const page = await ctx.newPage();
  for (const t of TESTS) {
    const hash = opsCap[t.op] && opsCap[t.op].hash;
    console.log(`\n### ${t.op}  hash=${hash?hash.slice(0,12):"???"}…`);
    if (!hash) { console.log("   (sem hash capturado)"); continue; }
    for (const [label, idv] of Object.entries(IDS)) {
      const varsObj = t.op==="HostRecommendedActionsCountQuery" ? t.vars(idv) : t.vars(idv);
      const vars = encodeURIComponent(JSON.stringify(varsObj));
      const ext = encodeURIComponent(JSON.stringify({persistedQuery:{version:1,sha256Hash:hash}}));
      const url = `${BASE}/api/v3/${t.op}/${hash}?operationName=${t.op}&locale=pt&currency=BRL&variables=${vars}&extensions=${ext}`;
      try {
        const r = await page.request.get(url);
        const body = await r.text();
        const denied = /Permission denied|not authorized|Forbidden/i.test(body);
        console.log(`   [${label}]  ${r.status()}  len=${body.length}  denied?=${denied}`);
        console.log(`        ${body.slice(0,170).replace(/\s+/g," ")}`);
      } catch(e) { console.log(`   [${label}] ERR ${e.message.slice(0,60)}`); }
      await page.waitForTimeout(700);
    }
  }
  await browser.close();
})();
