// Gera a figura isométrica "Pavimento em camadas" (kit Anatomy) como fragmento para o index.html.
// Uso: node tools/figure.mjs   → escreve tools/figure.fragment.html
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KIT = "/Users/brunocesar/.agents/skills/anatomy";
const k = await import(`${KIT}/kit/iso-kit.mjs`);
const { kitScript } = await import(`${KIT}/scripts/inline-kit.mjs`);
const HERE = dirname(fileURLToPath(import.meta.url));

const WIDTH = 640;
const HEIGHT = 440;

// Mundo (1 unidade ≈ 1 px). Layers empilhadas de baixo para cima.
const W = 230;
const D = 140;
const PLAN = { x: 0, y: 0, w: W, d: D, r: 2 };
const GAP = 34; // quanto cada camada sobe quando "abre"
const LAYERS = [
  { id: "subleito", z: 0, h: 18, tone: "lo" },
  { id: "brita", z: 18, h: 26, tone: "mid" },
  { id: "areia", z: 44, h: 10, tone: "lo" },
  { id: "bloquete", z: 54, h: 14, tone: "hi" },
];
const KERB = { x: -18, y: 0, w: 18, d: D, r: 2.5 };
const KERB_Z = 18;
const KERB_H = 62;
const KERB_PULL = 46;
const TOP = LAYERS[3].z + LAYERS[3].h;

const P = k.fitProjection(
  [
    ...k.boxCorners({ x: -18 - KERB_PULL, y: 0, w: W + 18 + KERB_PULL, d: D }, 0, 0),
    ...k.boxCorners(PLAN, TOP + GAP * 3 + 12, TOP + GAP * 3 + 12),
    [W, D, 0],
  ],
  WIDTH,
  HEIGHT,
  { pad: 26, azimuth: 42 },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D_ = (points, style) => k.dotsSvg(points, style);

// pseudo-aleatório determinístico
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

// pontos espalhados sobre as duas faces visíveis (corte) de uma camada: +y e +x
function faceDots(z0, h, count, edge = 2.2) {
  const pts = [];
  for (let i = 0; i < count; i++) {
    const z = z0 + edge + rnd() * (h - edge * 2);
    pts.push(at([edge + rnd() * (W - edge * 2), D, z]));
  }
  for (let i = 0; i < count * 0.6; i++) {
    const z = z0 + edge + rnd() * (h - edge * 2);
    pts.push(at([W, edge + rnd() * (D - edge * 2), z]));
  }
  return pts;
}
function topDots(z, count, edge = 4) {
  const pts = [];
  for (let i = 0; i < count; i++) pts.push(at([edge + rnd() * (W - edge * 2), edge + rnd() * (D - edge * 2), z]));
  return pts;
}

function subleito() {
  const { z, h } = LAYERS[0];
  const out = [`<path class="iso-halo" d="${k.haloOf(PLAN, z, 0.1, P)}" style="filter:blur(5px)"/>`];
  out.push(S(k.slabOf(PLAN, z, h, P, 3, 0.6), { tone: "lo" }));
  // compactação: faixas de rolo no topo, terminando nas bordas
  const rows = [];
  for (let y = 20; y < D; y += 20) rows.push(k.lineOnTop([0, y], [W, y], z + h, P));
  out.push(L(rows.join(""), { tone: "faint" }));
  // estratos do corte (linhas que correm de ponta a ponta da face)
  const strata = [6, 12].map((dz) => k.segment([0, D, z + dz], [W, D, z + dz], P)).join("");
  out.push(L(strata, { tone: "faint" }));
  out.push(D_(faceDots(z, h, 22, 2), { size: 0.35, tone: "lo" }));
  return out.join("");
}

function brita() {
  const { z, h } = LAYERS[1];
  const out = [S(k.slabOf(PLAN, z, h, P, 3, 0.6), { tone: "mid" })];
  out.push(D_(faceDots(z, h, 90, 2), { size: 0.55, tone: "hi" }));
  out.push(D_(faceDots(z, h, 50, 2), { size: 0.3, tone: "lo" }));
  out.push(D_(topDots(z + h, 70), { size: 0.45, tone: "lo" }));
  return out.join("");
}

function areia() {
  const { z, h } = LAYERS[2];
  const out = [S(k.slabOf(PLAN, z, h, P, 3, 0.4), { tone: "lo" })];
  out.push(D_(faceDots(z, h, 120, 1.4), { size: 0.22, tone: "mid" }));
  // marcas da régua de nivelar: sulcos paralelos de ponta a ponta
  const lines = [];
  for (let x = 14; x < W; x += 14) lines.push(k.lineOnTop([x, 0], [x, D], z + h, P));
  out.push(L(lines.join(""), { tone: "faint" }));
  return out.join("");
}

function bloquete() {
  const { z, h } = LAYERS[3];
  const out = [S(k.slabOf(PLAN, z, h, P, 3, 0.8), { tone: "hi", lit: true, crease: "lo" })];
  // juntas em fiada travada (running bond): cada junta termina em outra junta ou na borda
  const ROW = 20;
  const BLK = 28;
  const rows = [];
  const joints = [];
  for (let y = ROW; y < D; y += ROW) rows.push(k.lineOnTop([0, y], [W, y], z + h, P));
  let r = 0;
  for (let y = 0; y < D; y += ROW, r++) {
    const off = r % 2 ? BLK / 2 : 0;
    for (let x = off + BLK; x < W - 1; x += BLK) joints.push(k.lineOnTop([x, y], [x, Math.min(y + ROW, D)], z + h, P));
  }
  out.push(L(rows.join(""), { tone: "lo" }), L(joints.join(""), { tone: "lo" }));
  // juntas na face do corte (+y): uma divisória vertical por bloco da última fiada
  const face = [];
  const lastOff = Math.floor((D - 1) / ROW) % 2 ? BLK / 2 : 0;
  for (let x = lastOff + BLK; x < W - 1; x += BLK) face.push(k.segment([x, D, z], [x, D, z + h], P));
  out.push(L(face.join(""), { tone: "lo" }));
  // junta de dilatação com a borda: moldura leve
  out.push(L(k.planOutline(k.insetPlan(PLAN, 1.6), z + h, P, 3), { tone: "faint" }));
  // nível de bolha pousado sobre o piso: pertence à camada e sobe junto
  const lvl = { x: 120, y: 28, w: 62, d: 9, r: 1.6 };
  out.push(S(k.slabOf(lvl, z + h, 5, P, 3, 0.4), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(lvl, 1.4), z + h + 5, P, 3), { tone: "lo" }));
  out.push(S(k.slabOf({ x: lvl.x + 26, y: lvl.y + 2.4, w: 10, d: 4.2, r: 1.4 }, z + h + 5, 0.8, P, 3), { tone: "hi", crease: "none", flat: true }));
  out.push(D_([at([lvl.x + 5, lvl.y + 4.5, z + h + 5]), at([lvl.x + lvl.w - 5, lvl.y + 4.5, z + h + 5])], { size: 0.45 }));
  return out.join("");
}

function meiofio() {
  const z = KERB_Z;
  const out = [`<path class="iso-halo" d="${k.haloOf(KERB, z, 0.1, P)}" style="filter:blur(4px)"/>`];
  out.push(S(k.slabOf(KERB, z, KERB_H, P, 4, 0.9), { tone: "hi", crease: "lo" }));
  // juntas entre peças de meio-fio (a cada 1 m ≈ 70 u): cruzam o topo e descem pela face
  const mid = D / 2;
  out.push(L(k.lineOnTop([KERB.x, mid], [KERB.x + KERB.w, mid], z + KERB_H, P), { tone: "lo" }));
  out.push(L(k.segment([KERB.x + KERB.w, mid, z], [KERB.x + KERB.w, mid, z + KERB_H], P), { tone: "lo" }));
  out.push(L(k.planOutline(k.insetPlan(KERB, 3), z + KERB_H, P, 3), { tone: "faint" }));
  // topo arredondado = chanfro da quina: linha na face visível do fim da peça
  out.push(L(k.segment([KERB.x, D, z + KERB_H - 6], [KERB.x + KERB.w, D, z + KERB_H - 6], P), { tone: "faint" }));
  return out.join("");
}

const PARTS = [
  { part: "meiofio", html: meiofio() },
  { part: "subleito", html: subleito() },
  { part: "brita", html: brita() },
  { part: "areia", html: areia() },
  { part: "bloquete", html: bloquete() },
];

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "Corte de um pavimento de bloquete em camadas: terreno compactado, base de brita, colchão de areia, bloquetes intertravados e, na borda, o meio-fio que contém o conjunto.",
  body: PARTS.map((p) => `<g data-part="${p.part}">${p.html}</g>`),
});

const LAYER_INFO = [
  { part: "subleito", name: "Terreno compactado", note: "É o chão firme. Sem compactar, o piso afunda depois." },
  { part: "brita", name: "Base de brita", note: "Reparte o peso e deixa a água escoar. A espessura segue o tráfego." },
  { part: "areia", name: "Colchão de areia", note: "Cama de assentamento, nivelada na régua. Em geral 3 a 5 cm." },
  { part: "bloquete", name: "Bloquetes intertravados", note: "Encaixados, travam um no outro. 6 cm para pedestre e carro; 8 cm ou mais para tráfego pesado." },
  { part: "meiofio", name: "Meio-fio", note: "Segura as bordas. Sem ele, os blocos abrem e o piso se desloca com o tempo." },
];

const live = `
const P = ${JSON.stringify(P)};
const GAP = ${GAP}, KERB_PULL = ${KERB_PULL};
const LIFT = { subleito: 0, brita: 1, areia: 2, bloquete: 3 };
const INFO = ${JSON.stringify(LAYER_INFO)};
const root = document.querySelector("[data-hc-figure]");
const stage = root.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const parts = Object.fromEntries([...svg.querySelectorAll("[data-part]")].map((el) => [el.dataset.part, el]));
const readout = root.querySelector("[data-readout]");
const buttons = [...document.querySelectorAll("[data-layer]")];
const still = matchMedia("(prefers-reduced-motion: reduce)");
let open = 1, openTo = 1, focus = null, frame = 0, last = 0, visible = false, tour = true, tourTimer = 0, clock = 2.4;
function draw() {
  for (const [id, n] of Object.entries(LIFT)) parts[id].setAttribute("transform", translateAlong(P, [0, 0, GAP * n * open]));
  parts.meiofio.setAttribute("transform", translateAlong(P, [-KERB_PULL * open, 0, 0]));
  for (const id in parts) parts[id].style.opacity = focus && focus !== id ? 0.28 : 1;
  const info = INFO.find((i) => i.part === focus);
  const text = info ? info.name : open > 0.5 ? "Aberto: passe o dedo em cada camada" : "Montado: como a obra fica por baixo";
  if (readout.textContent !== text) readout.textContent = text;
  buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.layer === focus)));
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  if (tour && !still.matches) { clock += dt; const ph = clock % 9; openTo = ph > 1.8 && ph < 6.8 ? 1 : 0; }
  open = still.matches ? openTo : open + (openTo - open) * (1 - Math.exp(-dt / 0.32));
  if (Math.abs(openTo - open) < 0.002) open = openTo;
  draw();
  const settled = !tour && open === openTo;
  frame = visible && !settled ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
function pick(id) {
  tour = false; clearTimeout(tourTimer);
  focus = id; openTo = id ? 1 : openTo;
  tourTimer = setTimeout(() => { focus = null; tour = !still.matches; clock = 0; run(); }, 9000);
  if (!visible) draw(); run();
}
buttons.forEach((b) => {
  b.addEventListener("click", () => pick(focus === b.dataset.layer ? null : b.dataset.layer));
  b.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") pick(b.dataset.layer); });
});
root.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse" && focus) { focus = null; run(); if (!visible) draw(); } });
// o desenho também responde: a faixa vertical sob o ponteiro escolhe a camada
stage.addEventListener("pointermove", (e) => {
  if (e.pointerType !== "mouse") return;
  const el = document.elementFromPoint(e.clientX, e.clientY);
  const part = el && el.closest && el.closest("[data-part]");
  if (part && part.dataset.part !== focus) pick(part.dataset.part);
});
stage.addEventListener("keydown", (e) => {
  const order = ["bloquete", "areia", "brita", "subleito", "meiofio"];
  let i = order.indexOf(focus);
  if (e.key === "ArrowDown" || e.key === "ArrowRight") i = Math.min(order.length - 1, i + 1);
  else if (e.key === "ArrowUp" || e.key === "ArrowLeft") i = Math.max(0, i < 0 ? 0 : i - 1);
  else return;
  e.preventDefault(); pick(order[i]);
});
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
if (still.matches) { tour = false; openTo = 1; }
draw();
`;

const plate = k.plateHtml({
  fig: "Corte",
  title: "Pavimento em camadas",
  hint: "Toque numa camada",
  readout: "Montado: como a obra fica por baixo",
  keys: [
    { mark: "lit", label: "Bloquetes: a parte que você vê" },
    { mark: "raised", label: "O resto fica enterrado, e é onde a obra se decide" },
  ],
  caption: "",
  body: `<div class="iso-stage" tabindex="0" role="group" aria-label="Corte do pavimento. Setas escolhem a camada.">${svg}</div>`,
});

const list = LAYER_INFO.map(
  (i, n) =>
    `<li><button type="button" data-layer="${i.part}" aria-pressed="false"><span class="ly-n">${n + 1}</span><span class="ly-t"><strong>${i.name}</strong><span>${i.note}</span></span></button></li>`,
).join("");

// ordem da lista: de cima para baixo, como o olho lê o corte
const order = ["bloquete", "areia", "brita", "subleito", "meiofio"];
const listOrdered = order
  .map((part) => LAYER_INFO.find((i) => i.part === part))
  .map(
    (i, n) =>
      `<li><button type="button" data-layer="${i.part}" aria-pressed="false"><span class="ly-n">${n + 1}</span><span class="ly-t"><strong>${i.name}</strong><span>${i.note}</span></span></button></li>`,
  )
  .join("");

const fragment = `<div class="iso hc-fig" data-theme="dark" data-hc-figure>
${plate}
<ol class="hc-layers">${listOrdered}</ol>
</div>
<script type="module">${(kitScript() + live).replace(/<\/(script)/gi, "<\\/$1")}</script>`;

writeFileSync(join(HERE, "figure.fragment.html"), fragment);
writeFileSync(join(HERE, "figure.css"), k.ISO_CSS);
void list;
console.log("figura gerada:", fragment.length, "bytes; css:", k.ISO_CSS.length);
