// Shapes "حكايتي" with HarfBuzz and writes one SVG path per glyph (design-time tool).
import * as hb from "harfbuzzjs";
import fs from "node:fs";
const [,, fontPath, out] = process.argv;
const data = fs.readFileSync(fontPath);
const face = new hb.Face(new hb.Blob(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)));
const font = new hb.Font(face);
const buf = new hb.Buffer();
buf.addText("حكايتي");
buf.guessSegmentProperties();
hb.shape(font, buf);
const infos = buf.getGlyphInfos(), pos = buf.getGlyphPositions();
let x = 0; const res = [];
infos.forEach((g, i) => {
  res.push({ gid: g.codepoint, cluster: g.cluster, x: x + pos[i].xOffset, y: pos[i].yOffset, adv: pos[i].xAdvance, d: font.glyphToPath(g.codepoint) });
  x += pos[i].xAdvance;
});
console.log(face.upem, "total adv", x, res.map(r => `${r.gid}@${r.cluster} x=${r.x} adv=${r.adv}`).join(" | "));
const paths = res.map((r,i) => `<path transform="translate(${r.x} ${-r.y}) scale(1 -1)" d="${r.d}" fill="hsl(${i*50} 40% 30%)" fill-opacity=".8"/>`).join("");
fs.writeFileSync(out, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 -1000 ${x+200} 1800" width="1400"><rect x="-100" y="-1000" width="${x+200}" height="1800" fill="#fff"/><g>${paths}</g></svg>`);
fs.writeFileSync(out.replace(".svg",".json"), JSON.stringify({upem: face.upem, width: x, glyphs: res}));
