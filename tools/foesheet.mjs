// 몬스터 그림 시트 보기 (브라우저 없이): node tools/foesheet.mjs out.png 배율 모듈 이름1,이름2,...
//   예) node tools/foesheet.mjs shots/gm_foes.png 3 mg0 gSlime,goblin
//   동작마다 한 줄: 프레임을 가로로 늘어놓는다 (뒤 배경은 연한 체크무늬)
import { savePNG } from "./png.mjs";
import { renderSheet } from "../src/forge/foes/sheet.js";
const [out = "foes.png", scS = "3", mod = "mg0", list = ""] = process.argv.slice(2);
const M = await import(`../src/forge/foes/${mod}.js`);
const names = list ? list.split(",") : Object.keys(M).filter((k) => M[k]?.model);
const sc = +scS, rows = [];
for (const nm of names) {
  const spec = M[nm];
  const sh = renderSheet(spec, nm);
  const px = new Uint8Array(sh.buf.buffer);
  for (const an of Object.keys(spec.anims).filter((a) => !process.env.ANIMS || process.env.ANIMS.split(",").includes(a))) rows.push({ spec, sh, px, an, fr: sh.fi[an] });
}
const W = Math.max(...rows.map((r) => r.fr.length * r.spec.fw)) * sc + 8, H = rows.reduce((a, r) => a + r.spec.fh * sc + 4, 4);
const img = new Uint8Array(W * H * 4);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4, c = ((x >> 4) + (y >> 4)) % 2 ? 214 : 232; img[i] = c; img[i + 1] = c + 4; img[i + 2] = c + 10; img[i + 3] = 255; }
let oy = 4;
for (const r of rows) {
  const { fw, fh } = r.spec, cols = r.sh.cols ?? r.sh.total, SW = r.sh.W;
  r.fr.forEach((f, j) => {
    const sx = (f % cols) * fw, sy = Math.floor(f / cols) * fh;
    for (let y = 0; y < fh * sc; y++)
      for (let x = 0; x < fw * sc; x++) {
        const si = ((sy + Math.floor(y / sc)) * SW + sx + Math.floor(x / sc)) * 4;
        if (!r.px[si + 3]) continue;
        const di = ((oy + y) * W + 4 + j * fw * sc + x) * 4;
        img[di] = r.px[si]; img[di + 1] = r.px[si + 1]; img[di + 2] = r.px[si + 2];
      }
  });
  oy += fh * sc + 4;
}
savePNG(out, W, H, img);
console.log("ok", out, W, H, rows.length, "rows");
