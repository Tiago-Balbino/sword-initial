#!/usr/bin/env node
/** Teste NÃO-DESTRUTIVO do teto de CSRF: um atacante cross-site só consegue cookies auto-anexados
 * + headers "simples" (sem X-Airbnb-API-Key, sem X-CSRF). Pergunta: a API aceita request autenticada
 * SEM esses headers custom? Se sim → o header não é defesa → CSRF depende só do SameSite (exposto Safari/FF).
 * Só GET de leitura na própria sessão. Nenhuma mutação aqui.
 */
const { chromium } = require("playwright");
const fs = require("fs");
const COOKIES = JSON.parse(fs.readFileSync(__dirname + "/cookies.json", "utf8"));
const BASE = "https://www.airbnb.com.br";
const H = "90c152b4bd4dd2f734e037b69bfede138be70dd2b3ab83602c7c291aebd75d55";
const vars = encodeURIComponent(JSON.stringify({cdnCacheSafe:false,hasLoggedIn:true,isInitialLoad:false,source:"EXPLORE",supportsM13ListingsSetupFlow:true}));
const ext = encodeURIComponent(JSON.stringify({persistedQuery:{version:1,sha256Hash:H}}));
const URL = `${BASE}/api/v3/Header/${H}?operationName=Header&locale=pt&currency=BRL&variables=${vars}&extensions=${ext}`;

// cenários de headers (do "cross-site-forjável" ao "cliente completo")
const SCEN = {
  "só-cookie (simulа cross-site)":        {},
  "+ content-type text/plain (simples)":  { "Content-Type": "text/plain" },
  "+ API-key só":                         { "X-Airbnb-API-Key": "d306zoyjsyarp7ifhu67rjxn52tv0t20" },
  "+ API-key + CSRF-without (cliente)":   { "X-Airbnb-API-Key": "d306zoyjsyarp7ifhu67rjxn52tv0t20", "X-CSRF-Without-Token": "1", "X-Airbnb-GraphQL-Platform": "web" },
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  await ctx.addCookies(COOKIES);
  console.log("URL de leitura autenticada (Header, self):\n  " + URL.slice(0,90) + "…\n");
  for (const [label, hdr] of Object.entries(SCEN)) {
    try {
      const r = await ctx.request.get(URL, { headers: { "X-HackerOne-Researcher": "moldret", ...hdr } });
      const body = await r.text();
      const loggedIn = /isServiceHost|"user":\{/.test(body) && !/error/i.test(body.slice(0,80));
      console.log(`[${label}]`);
      console.log(`   status=${r.status()}  len=${body.length}  autenticado?=${loggedIn}`);
      console.log(`   ${body.slice(0,120).replace(/\s+/g," ")}\n`);
    } catch (e) { console.log(`[${label}] ERR ${e.message.slice(0,80)}\n`); }
    await new Promise(r=>setTimeout(r,500));
  }
  await browser.close();
  console.log("LEITURA — interpretação:");
  console.log("  se 'só-cookie' já retorna autenticado → header custom NÃO é exigido → CSRF depende só de SameSite (exposto em Safari/FF).");
  console.log("  se 'só-cookie' falha e só o cliente-completo funciona → header custom É defesa de CSRF → SameSite-none = Low (defense-in-depth).");
})();
