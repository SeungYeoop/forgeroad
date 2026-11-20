// 몬스터 동작 전체 장면 그림: 고른 동작마다 한 줄, 모든 장면을 나란히 (브라우저 없이)
//   node tools/foeanim.mjs out.png 배율 모듈 이름 동작1,동작2,...   (동작 생략 = 전부)
import { savePNG } from "./png.mjs";
import { renderSheet } from "../src/forge/foes/sheet.js";
const [out = "anim.png", scS = "3", mod = "pgm3", nm = "", list = ""] = process.argv.slice(2);
const M = await import(`../src/forge/foes/${mod}.js`);
const spec = M[nm], sh = renderSheet(spec, nm), px = new Uint8Array(sh.buf.buffer), sc = +scS;
const anims = list ? list.split(",") : Object.keys(spec.anims);
const { fw, fh } = spec, cols = sh.cols ?? sh.total, SW = sh.W;
const W = Math.max(...anims.map((a) => sh.fi[a].length)) * (fw * sc + 6) + 8, H = anims.length * (fh * sc + 8) + 8;
const img = new Uint8Array(W * H * 4);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4, c = ((x >> 4) + (y >> 4)) % 2 ? 150 : 170; img[i] = c - 20; img[i + 1] = c; img[i + 2] = c + 30; img[i + 3] = 255; }
anims.forEach((a, r) => {
  const oy = 6 + r * (fh * sc + 8);
  sh.fi[a].forEach((f, j) => {
    const sx = (f % cols) * fw, sy = Math.floor(f / cols) * fh, ox = 6 + j * (fw * sc + 6);
    for (let y = 0; y < fh * sc; y++)
      for (let x = 0; x < fw * sc; x++) {
        const si = ((sy + Math.floor(y / sc)) * SW + sx + Math.floor(x / sc)) * 4, di = ((oy + y) * W + ox + x) * 4;
        if (!px[si + 3]) { (x === 0 || y === fh * sc - 1) && ((img[di] = 90), (img[di + 1] = 90), (img[di + 2] = 110)); continue; }
        img[di] = px[si]; img[di + 1] = px[si + 1]; img[di + 2] = px[si + 2];
      }
  });
});
savePNG(out, W, H, img);
console.log("ok", out, W, H, anims.join(","));
