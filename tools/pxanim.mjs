// 2D 픽셀 몬스터 동작표: 동작마다 한 줄씩 모든 프레임을 늘어놓는다
//   node tools/pxanim.mjs out.png 배율 모듈 스펙이름 [동작,동작,...]
import { savePNG } from "./png.mjs";
const [out = "anim.png", scS = "4", mod = "pgob", name = "pxGoblin", only = ""] = process.argv.slice(2);
const M = await import(`../src/forge/foes/${mod}.js`), spec = M[name], sc = +scS;
const names = only ? only.split(",") : Object.keys(spec.anims);
const rows = names.map((nm) => { const n = spec.anims[nm][0]; return Array.from({ length: n }, (_, f) => spec.px(nm, f, n)); });
const fw = spec.fw, fh = spec.fh, cols = Math.max(...rows.map((r) => r.length));
const W = cols * (fw * sc + 6) + 6, H = rows.length * (fh * sc + 6) + 6, img = new Uint8Array(W * H * 4);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4, c = ((x >> 4) + (y >> 4)) % 2 ? 60 : 70; img[i] = c; img[i + 1] = c + 2; img[i + 2] = c + 8; img[i + 3] = 255; }
rows.forEach((r, ry) => r.forEach((C, k) => {
  const ox = 6 + k * (fw * sc + 6), oy = 6 + ry * (fh * sc + 6);
  for (let y = 0; y < fh * sc; y++) for (let x = 0; x < fw * sc; x++) {
    const c = C.d[Math.floor(y / sc) * C.W + Math.floor(x / sc)], i = ((oy + y) * W + ox + x) * 4;
    if (y === fh * sc - 1) { img[i] = 120; img[i + 1] = 90; img[i + 2] = 60; }
    if (c < 0) continue;
    img[i] = (c >> 16) & 255; img[i + 1] = (c >> 8) & 255; img[i + 2] = c & 255;
  }
}));
savePNG(out, W, H, img);
console.log("ok", out, names.join(","));
