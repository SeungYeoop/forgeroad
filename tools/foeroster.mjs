// 지역 몬스터 명단 그림: 여러 그림 파일의 몬스터를 한 장에 (한 줄 = 한 몬스터, 동작마다 가운데 장면 하나)
//   node tools/foeroster.mjs out.png 배율 "모듈:이름,모듈:이름,..."   (모듈 = src/forge/foes/<모듈>.js)
import { savePNG } from "./png.mjs";
import { renderSheet } from "../src/forge/foes/sheet.js";
const [out = "roster.png", scS = "2", list = ""] = process.argv.slice(2);
const sc = +scS, rows = [];
for (const it of list.split(",").filter(Boolean)) {
  const [mod, nm] = it.split(":");
  const M = await import(`../src/forge/foes/${mod}.js`);
  const spec = M[nm];
  if (!spec) throw new Error("no spec " + it);
  const sh = renderSheet(spec, nm), px = new Uint8Array(sh.buf.buffer);
  const fr = Object.keys(spec.anims).map((a) => sh.fi[a][Math.floor((sh.fi[a].length - 1) / 2)]);
  rows.push({ spec, sh, px, fr });
}
const W = Math.max(...rows.map((r) => r.fr.length * (r.spec.fw * sc + 6))) + 8, H = rows.reduce((a, r) => a + r.spec.fh * sc + 8, 8);
const img = new Uint8Array(W * H * 4);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4, c = ((x >> 4) + (y >> 4)) % 2 ? 150 : 170; img[i] = c - 20; img[i + 1] = c; img[i + 2] = c + 30; img[i + 3] = 255; }
let oy = 6;
for (const r of rows) {
  const { fw, fh } = r.spec, cols = r.sh.cols ?? r.sh.total, SW = r.sh.W;
  r.fr.forEach((f, j) => {
    const sx = (f % cols) * fw, sy = Math.floor(f / cols) * fh, ox = 6 + j * (fw * sc + 6);
    for (let y = 0; y < fh * sc; y++)
      for (let x = 0; x < fw * sc; x++) {
        const si = ((sy + Math.floor(y / sc)) * SW + sx + Math.floor(x / sc)) * 4, di = ((oy + y) * W + ox + x) * 4;
        if (!r.px[si + 3]) { (x === 0 || y === fh * sc - 1) && ((img[di] = 90), (img[di + 1] = 90), (img[di + 2] = 110)); continue; }
        img[di] = r.px[si]; img[di + 1] = r.px[si + 1]; img[di + 2] = r.px[si + 2];
      }
  });
  oy += fh * sc + 8;
}
savePNG(out, W, H, img);
console.log("ok", out, W, H, rows.length);
