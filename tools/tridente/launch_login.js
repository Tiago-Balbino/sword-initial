#!/usr/bin/env node
/** Abre um Chromium (Blink) VISÍVEL e persistente pro Tiago logar no Airbnb.
 * A sessão fica salva em ./profile-chromium (reusada pelos testes autenticados).
 * Mantém a janela aberta até aparecer o arquivo STOP (então fecha e libera o lock do perfil).
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const USERDATA = path.join(__dirname, "profile-chromium");
const STOP = path.join(__dirname, "STOP_LOGIN");
const HDR = { "X-HackerOne-Researcher": "moldret" };

(async () => {
  try { if (fs.existsSync(STOP)) fs.unlinkSync(STOP); } catch(e){}
  const ctx = await chromium.launchPersistentContext(USERDATA, {
    headless: false,
    viewport: { width: 1280, height: 900 },
    extraHTTPHeaders: HDR,
    ignoreDefaultArgs: ["--enable-automation"],
    args: ["--no-first-run","--no-default-browser-check","--disable-blink-features=AutomationControlled"],
  });
  const page = ctx.pages()[0] || await ctx.newPage();
  // esconde navigator.webdriver (detecção básica do Google)
  await ctx.addInitScript(() => { Object.defineProperty(navigator, "webdriver", { get: () => undefined }); });
  await page.goto("https://www.airbnb.com/login", { waitUntil: "domcontentloaded" }).catch(()=>{});
  console.log("JANELA ABERTA — faça login no Airbnb nesta janela do Chromium.");
  console.log("Perfil salvo em:", USERDATA);
  console.log("Quando terminar, crie o arquivo STOP para eu fechar e rodar os testes.");
  // mantém vivo até STOP aparecer
  while (!fs.existsSync(STOP)) { await page.waitForTimeout(2000).catch(()=>{}); }
  console.log("STOP detectado — salvando sessão e fechando.");
  await ctx.close();
  process.exit(0);
})();
