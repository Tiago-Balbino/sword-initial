#!/usr/bin/env node
/** Caracterização de authz (BOLA) — SEGURO: usa meu próprio id (baseline) + ids inexistentes/inválidos.
 * NÃO lê dado de terceiro real (isso fica pra 2ª conta própria). Só GET autenticado (leitura).
 * Pergunta: o resolver HONRA o id (troca muda o alvo → BOLA se valid-other retorna) ou IGNORA (decorativo)?
 */
const { chromium } = require("playwright");
const fs = require("fs");
const HDR = { "X-HackerOne-Researcher": "moldret", "X-Airbnb-API-Key": "d306zoyjsyarp7ifhu67rjxn52tv0t20", "X-Airbnb-GraphQL-Platform": "web", "Content-Type": "application/json" };
const COOKIES = JSON.parse(fs.readFileSync(__dirname + "/cookies.json", "utf8"));
const BASE = "https://www.airbnb.com.br";
const MYNUM = "1768931195641399446";
const gid = n => Buffer.from("User:" + n).toString("base64").replace(/=+$/,"");

// [op, hash, template de variables com {ID}] — {ID} = numérico cru ou {GID} = base64
const OPS = [
  ["HostPayoutHistoryQuery","f56101433e60...", v=>`{"userId":"${v.num}"}`, "num"],
  ["UserResidenceCountryQuery","43f2a75dfb6a...", v=>`{"id":"${v.gid}"}`, "gid"],
  ["AccountSettingsVisibilityQuery","0b6e54b17ffa...", v=>`{"userId":"${v.gid}"}`, "gid"],
  ["ProfileReintroductionQuery","c1a5aa6ca3d1...", v=>`{"userId":"${v.gid}"}`, "gid"],
];
// carrega os hashes reais do ops_capturadas.json
const opsCap = JSON.parse(fs.readFileSync("/Users/tiagobalbinoferreira/Documents/Sword/targets/airbnb/recon/hunt/ops_capturadas.json","utf8"));

// identidades a testar: meu id (baseline), id inexistente (0), id inexistente grande
const IDS = {
  "meu(baseline)":  { num: MYNUM,               gid: gid(MYNUM) },
  "inexistente-0":  { num: "0",                 gid: gid("0") },
  "inexistente-big":{ num: "9999999999999999999", gid: gid("9999999999999999999") },
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ extraHTTPHeaders: HDR, ignoreHTTPSErrors: true });
  await ctx.addCookies(COOKIES);
  const page = await ctx.newPage();
  for (const [op, _h, tmpl] of OPS) {
    const hash = opsCap[op] ? opsCap[op].hash : null;
    if (!hash) { console.log(`\n### ${op}: (hash não capturado, pulando)`); continue; }
    console.log(`\n### ${op}  hash=${hash.slice(0,12)}…`);
    for (const [label, idv] of Object.entries(IDS)) {
      const vars = encodeURIComponent(tmpl(idv));
      const ext = encodeURIComponent(JSON.stringify({persistedQuery:{version:1,sha256Hash:hash}}));
      const url = `${BASE}/api/v3/${op}/${hash}?operationName=${op}&locale=pt&currency=BRL&variables=${vars}&extensions=${ext}`;
      try {
        const r = await page.request.get(url);
        const body = await r.text();
        const hasData = /"data":\{(?!"[a-zA-Z]+":null\}).+[^}]/.test(body) && !/"errors"/.test(body);
        const errs = (body.match(/"message":"([^"]{0,60})"/g)||[]).slice(0,1);
        console.log(`   [${label}]  ${r.status()}  len=${body.length}  data?=${hasData}  ${errs.join("")}`);
        console.log(`        ${body.slice(0,150).replace(/\s+/g," ")}`);
      } catch(e) { console.log(`   [${label}]  ERR ${e.message.slice(0,60)}`); }
      await page.waitForTimeout(600); // rate baixo
    }
  }
  await browser.close();
})();
