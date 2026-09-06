#!/usr/bin/env node
/**
 * formação tridente — teste diferencial multi-engine (Blink/Gecko/WebKit) via Playwright.
 * Roda o MESMO fluxo nos 3 engines e captura: redirect chain, URL final, params/token na URL,
 * cookies (nome/flags/SameSite), CSP efetiva, violações de CSP no console, e erros.
 * Divergência entre engines = candidato a bug P5 client-side.
 *
 * Uso:
 *   node tridente.js <url-inicial> [--label T1] [--cookies cookies.json] [--nav "<url2>"]
 *   node tridente.js "https://www.airbnb.com/" --label T1 --nav "https://www.airbnb.com.br/"
 *
 * cookies.json (opcional, p/ fluxo autenticado): array Playwright de cookies
 *   [{"name":"...","value":"...","domain":".airbnb.com","path":"/"}]
 *
 * Header do programa (Airbnb): X-HackerOne-Researcher: moldret em toda request.
 */
const { chromium, firefox, webkit } = require("playwright");
const fs = require("fs");

const ENGINES = { chromium, firefox, webkit }; // Blink, Gecko, WebKit
const HDR = { "X-HackerOne-Researcher": "moldret" };

function arg(name, def=null){ const i=process.argv.indexOf(name); return i>=0 ? process.argv[i+1] : def; }

const START = process.argv[2];
const LABEL = arg("--label", "flow");
const NAV   = arg("--nav", null);
const COOKIES_FILE = arg("--cookies", null);
const TIMEOUT = parseInt(arg("--timeout", "30000"),10);

if(!START){ console.error("uso: node tridente.js <url> [--label X] [--nav url2] [--cookies f.json]"); process.exit(1); }

// heurística: acha token-like em URL (JWT, code, ticket, oauth, *token*)
function tokenParams(u){
  try{
    const url = new URL(u);
    const hits = [];
    for(const [k,v] of url.searchParams){
      if(/token|ticket|code|oauth|assertion|sig|state|auth|session|sso/i.test(k) || /^ey[A-Za-z0-9_-]{10,}\./.test(v))
        hits.push(`${k}=${v.slice(0,12)}…(${v.length}b)`);
    }
    if(url.hash && /token|code|access|id_token|ey[A-Za-z0-9_-]{10,}\./i.test(url.hash))
      hits.push(`#${url.hash.slice(1,24)}…`);
    return hits;
  }catch(e){ return []; }
}

async function runEngine(name){
  const res = { engine:name, redirects:[], finalURL:null, tokensInURL:[], cookies:[], csp:null, cspViolations:[], errors:[] };
  let browser;
  try{
    browser = await ENGINES[name].launch({ headless:true });
    const ctx = await browser.newContext({ extraHTTPHeaders: HDR, ignoreHTTPSErrors:true });
    if(COOKIES_FILE){ try{ await ctx.addCookies(JSON.parse(fs.readFileSync(COOKIES_FILE,"utf8"))); }catch(e){ res.errors.push("cookies: "+e.message); } }
    const page = await ctx.newPage();
    page.on("console", m=>{ if(/Content Security Policy|CSP|Refused to/i.test(m.text())) res.cspViolations.push(m.text().slice(0,160)); });
    page.on("response", r=>{
      const st=r.status(); const h=r.headers();
      if(st>=300 && st<400){ res.redirects.push(`${st} ${r.url().slice(0,120)} -> ${(h["location"]||"").slice(0,140)}`); }
      // captura a CSP de QUALQUER documento (não só a 1ª response) — corrige artefato WebKit
      const c=h["content-security-policy"]||h["content-security-policy-report-only"];
      if(c && !res.csp) res.csp = (r.url().includes(new URL(START).host)||r.url().includes(NAV?new URL(NAV).host:"")) ? c.slice(0,90)+"…" : res.csp;
    });
    const resp = await page.goto(START, { waitUntil:"domcontentloaded", timeout:TIMEOUT });
    if(resp){ const h=resp.headers(); res.csp = (h["content-security-policy"]||h["content-security-policy-report-only"]||"(nenhuma)").slice(0,90)+"…"; }
    if(NAV){ await page.goto(NAV, { waitUntil:"domcontentloaded", timeout:TIMEOUT }); }
    await page.waitForTimeout(1500);
    res.finalURL = page.url();
    res.tokensInURL = tokenParams(page.url());
    // varre também as URLs de redirect por token
    for(const r of res.redirects){ const m=r.match(/-> (\S+)/); if(m){ const t=tokenParams(m[1]); if(t.length) res.tokensInURL.push(...t.map(x=>"(redir) "+x)); } }
    const cs = await ctx.cookies();
    res.cookies = cs.map(c=>`${c.name} [SameSite=${c.sameSite||"-"}${c.httpOnly?",HttpOnly":""}${c.secure?",Secure":""}] dom=${c.domain}`);
    // SameSite dos cookies de SESSÃO (o que vira achado se divergir)
    res.sessionCookieSameSite = cs.filter(c=>/_aat|_airbed_session_id|_csrf_token|hli|abb|jwt/i.test(c.name))
                                  .map(c=>`${c.name}=${c.sameSite||"-"}${c.httpOnly?"/HttpOnly":""}`);
    // sinal de sessão: marcador que SÓ aparece logado (não link público de profile)
    res.loggedIn = await page.evaluate(()=>/Sair da conta|"LOG_OUT"|logOut|\/guest\/inbox|isExperienceHost|avatarImageUrl/.test(document.documentElement.innerHTML)).catch(()=>null);
    // flag específica: algum cookie de sessão autenticado presente?
    res.hasSessionCookie = (await ctx.cookies()).some(c=>/_aat|_airbed_session_id|_csrf_token|hli|abb/i.test(c.name));
    await browser.close();
  }catch(e){ res.errors.push(e.message.slice(0,160)); if(browser) await browser.close().catch(()=>{}); }
  return res;
}

(async ()=>{
  console.log(`\n🔱 tridente [${LABEL}]  start=${START}${NAV?"  nav="+NAV:""}  ${COOKIES_FILE?"(autenticado)":"(unauth)"}\n`);
  const out = {};
  for(const eng of Object.keys(ENGINES)){ process.stdout.write(`  rodando ${eng}… `); out[eng]=await runEngine(eng); console.log("ok"); }
  // relatório + diff
  const rep = [];
  for(const eng of Object.keys(ENGINES)){
    const r=out[eng]; const tag={chromium:"Blink",firefox:"Gecko",webkit:"WebKit"}[eng];
    rep.push(`\n=== ${tag} (${eng}) ===`);
    rep.push(`  final URL:    ${r.finalURL}`);
    rep.push(`  logado?       ${r.loggedIn}  (cookie sessão: ${r.hasSessionCookie})`);
    rep.push(`  sessão SameSite: ${r.sessionCookieSameSite&&r.sessionCookieSameSite.length?r.sessionCookieSameSite.join(", "):"(sem cookie de sessão)"}`);
    rep.push(`  token na URL: ${r.tokensInURL.length?r.tokensInURL.join(" | "):"(nenhum)"}`);
    rep.push(`  redirects:    ${r.redirects.length}`);
    r.redirects.slice(0,8).forEach(x=>rep.push(`      ${x}`));
    rep.push(`  CSP:          ${r.csp}`);
    rep.push(`  CSP violations: ${r.cspViolations.length}`);
    r.cspViolations.slice(0,4).forEach(x=>rep.push(`      ${x}`));
    rep.push(`  cookies (${r.cookies.length}): ${r.cookies.slice(0,10).join("  ·  ")}`);
    if(r.errors.length) rep.push(`  ERROS: ${r.errors.join(" | ")}`);
  }
  // diff simples: finalURL, token, #redirects, #cookies, loggedIn divergem?
  rep.push(`\n=== DIFF (divergência = P5 candidato) ===`);
  const keys=["finalURL","loggedIn"];
  for(const k of keys){ const vals=Object.keys(ENGINES).map(e=>JSON.stringify(out[e][k])); const uniq=new Set(vals);
    rep.push(`  ${k}: ${uniq.size>1?"⚠️ DIVERGE — "+Object.keys(ENGINES).map(e=>`${e}=${out[e][k]}`).join(" | "):"igual"}`); }
  const tokDiff=Object.keys(ENGINES).map(e=>out[e].tokensInURL.length);
  rep.push(`  token-na-URL count: ${new Set(tokDiff).size>1?"⚠️ DIVERGE — "+Object.keys(ENGINES).map(e=>`${e}=${out[e].tokensInURL.length}`).join(" | "):"igual ("+tokDiff[0]+")"}`);
  const rc=Object.keys(ENGINES).map(e=>out[e].redirects.length);
  rep.push(`  #redirects: ${new Set(rc).size>1?"⚠️ DIVERGE — "+Object.keys(ENGINES).map(e=>`${e}=${out[e].redirects.length}`).join(" | "):"igual ("+rc[0]+")"}`);
  const cspv=Object.keys(ENGINES).map(e=>out[e].cspViolations.length);
  rep.push(`  #CSP-violations: ${new Set(cspv).size>1?"⚠️ DIVERGE — "+Object.keys(ENGINES).map(e=>`${e}=${out[e].cspViolations.length}`).join(" | "):"igual ("+cspv[0]+")"}`);
  const report=rep.join("\n");
  console.log(report);
  const fn=`/Users/tiagobalbinoferreira/Documents/Sword/targets/airbnb/recon/hunt/tridente_${LABEL}.txt`;
  fs.writeFileSync(fn, report); fs.writeFileSync(fn.replace(".txt",".json"), JSON.stringify(out,null,1));
  console.log(`\nsalvo: ${fn}`);
})();
