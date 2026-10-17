// Monta index.html a partir do template + figura Anatomy. Uso: node tools/figure.mjs && node tools/build.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(join(HERE, f), "utf8");
const REGIOES = ["Plano Piloto","Taguatinga","Ceilândia","Samambaia","Águas Claras","Gama","Sobradinho","Planaltina","Santa Maria","São Sebastião","Recanto das Emas","Riacho Fundo","Guará","Vicente Pires","Sudoeste / Octogonal","Lago Sul","Lago Norte","Jardim Botânico","Paranoá","Park Way","Núcleo Bandeirante","Brazlândia","Cruzeiro","Itapoã","Candangolândia","Varjão","SIA","Estrutural","Arniqueira","Sol Nascente / Pôr do Sol"];
const html = read("index.template.html")
  .replace("/*FIG_CSS*/", read("figure.css") + read("figure.theme.css"))
  .replace("<!--FIG-->", read("figure.fragment.html"))
  .replace("<!--REGIOES_OPT-->", REGIOES.map((r) => `<option>${r}</option>`).join(""))
  .replace("<!--REGIOES_LI-->", REGIOES.map((r) => `<li>${r}</li>`).join(""));
writeFileSync(join(HERE, "..", "index.html"), html);
console.log("index.html:", html.length, "bytes");
