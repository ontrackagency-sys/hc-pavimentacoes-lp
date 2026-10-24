// Trava de seguranca da LP. Rodar: node --test tools/seguranca.test.mjs
// Sem dependencia nenhuma: so Node.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const ler = (f) => readFileSync(join(RAIZ, f), "utf8");
const TEMPLATE = ["tools/index.template.tpl", "tools/index.template.html"].find((f) => existsSync(join(RAIZ, f)));

function metaCSP(html) {
  const m = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/i);
  return m ? m[1] : null;
}

for (const arquivo of ["index.html", TEMPLATE]) {
  test(`${arquivo}: CSP por meta com base-uri e object-src, sem mexer em script`, () => {
    const csp = metaCSP(ler(arquivo));
    assert.ok(csp, "sem meta CSP");
    assert.match(csp, /base-uri 'self'/);
    assert.match(csp, /object-src 'none'/);
    // script-src/default-src por meta bloquearia o script inline da pagina e as tags.
    assert.doesNotMatch(csp, /script-src|default-src|strict-dynamic/);
  });

  test(`${arquivo}: Referrer-Policy por meta`, () => {
    assert.match(ler(arquivo), /<meta name="referrer" content="strict-origin-when-cross-origin">/);
  });
}

test("o Jekyll do GitHub Pages nao publica os arquivos internos", () => {
  const cfg = ler("_config.yml");
  for (const item of ["README.md", "PROMPTS-CHATGPT.md", "tools", "vercel.json"]) {
    assert.match(cfg, new RegExp(`^\\s*-\\s*${item.replace(".", "\\.")}\\s*$`, "m"), `${item} fora do exclude`);
  }
  // Com .nojekyll o Jekyll nao roda e o exclude acima deixa de valer.
  assert.ok(!existsSync(join(RAIZ, ".nojekyll")), ".nojekyll anula o _config.yml: tudo volta a ser publicado");
});

test("vercel.json: cabecalhos prontos para quando a LP sair do GitHub Pages", () => {
  const cab = Object.fromEntries(JSON.parse(ler("vercel.json")).headers[0].headers.map((h) => [h.key, h.value]));
  const csp = cab["Content-Security-Policy"];
  assert.match(csp, /frame-ancestors 'self'/);
  assert.match(csp, /base-uri 'self'/);
  assert.match(csp, /object-src 'none'/);
  assert.doesNotMatch(csp, /script-src|default-src|strict-dynamic/, "CSP aplicada de verdade so com as 3 diretivas seguras");
  const ro = cab["Content-Security-Policy-Report-Only"];
  const diretiva = (nome) => ro.split(";").map((d) => d.trim()).find((d) => d.startsWith(nome + " ")) || "";
  assert.match(diretiva("script-src"), /https:\/\/www\.googletagmanager\.com/);
  assert.match(diretiva("script-src"), /https:\/\/connect\.facebook\.net/);
  // O beacon de conversao do Google Ads vai para www.google.com: sem ele a conversao some calada.
  assert.match(diretiva("connect-src"), /https:\/\/www\.google\.com( |$)/);
  assert.match(diretiva("connect-src"), /https:\/\/\*\.google-analytics\.com/);
  assert.equal(cab["X-Content-Type-Options"], "nosniff");
  assert.equal(cab["Referrer-Policy"], "strict-origin-when-cross-origin");
  assert.equal(cab["X-Frame-Options"], "SAMEORIGIN");
  assert.match(cab["Strict-Transport-Security"] || "", /max-age=\d{8,}/);
});

test("repositorio publico: nenhum arquivo versionado tem cara de segredo", () => {
  const arquivos = execFileSync("git", ["ls-files"], { cwd: RAIZ, encoding: "utf8" }).split("\n").filter(Boolean)
    .filter((f) => !/\.(webp|png|jpe?g|gif|ico)$/i.test(f) && f !== "tools/seguranca.test.mjs");
  const PADROES = [
    ["token do Meta", /EAA[A-Za-z0-9]{30,}/],
    ["chave Stripe", /\bsk_(live|test)_[A-Za-z0-9]{10,}/],
    ["token Supabase", /\bsbp_[a-f0-9]{30,}/],
    ["service_role", /service_role/],
    ["chave Google", /AIza[0-9A-Za-z_-]{35}/],
    ["chave Resend", /\bre_[A-Za-z0-9]{8,}_[A-Za-z0-9]{8,}/],
    ["token GitHub", /\b(ghp_[A-Za-z0-9]{30,}|github_pat_)/],
    ["chave privada", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
    ["JWT", /eyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}\./],
  ];
  const achados = [];
  for (const f of arquivos) {
    const conteudo = ler(f);
    for (const [nome, re] of PADROES) if (re.test(conteudo)) achados.push(`${f}: ${nome}`);
  }
  assert.deepEqual(achados, []);
});
