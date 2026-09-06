#!/usr/bin/env node
/** Converte um header Cookie cru (string) em array de cookies do Playwright.
 * Uso: node cookie2json.js "<cookie-header>" [dominio] > cookies.json
 * dominio default: .airbnb.com  (também gera p/ .airbnb.com.br)
 * O arquivo cookies.json é gitignorado — apagar após uso.
 */
const raw = process.argv[2] || "";
const base = process.argv[3] || "airbnb.com";
if (!raw) { console.error('uso: node cookie2json.js "<cookie header>" [dominio]'); process.exit(1); }
const pairs = raw.split(/;\s*/).map(s => s.trim()).filter(Boolean).map(s => {
  const i = s.indexOf("=");
  return { name: s.slice(0, i).trim(), value: s.slice(i + 1).trim() };
}).filter(c => c.name);
const out = [];
for (const dom of ["." + base, "." + base + ".br", "www." + base]) {
  for (const c of pairs) out.push({ name: c.name, value: c.value, domain: dom, path: "/", secure: true, sameSite: "None" });
}
console.error(`convertidos ${pairs.length} cookies × ${3} domínios = ${out.length} entradas`);
process.stdout.write(JSON.stringify(out, null, 1));
