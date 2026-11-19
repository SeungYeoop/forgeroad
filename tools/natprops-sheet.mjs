// 소품 그림 모아 보기: node tools/natprops-sheet.mjs out.png [배율]
import { PROP_KINDS, paintProp } from "../src/forge/natprops.js";
import { savePNG } from "./png.mjs";
const [out = "props.png", scS = "3"] = process.argv.slice(2);
const sc = +scS, pal = { top: 0x6a9a3a, rock: 0x8a7a6a, acc: 0xffc040 };
const cells = [];
const t0 = performance.now();
for (const k of PROP_KINDS) for (const s of [0, 1, 2]) for (const v of [0, 1]) cells.push({ k, s, v, d: paintProp(k, s, v, k === "p_crystal" ? { ...pal, acc: 0x60d0ff } : k === "p_shroom" ? { ...pal, acc: 0xc060e0 } : pal) });
const ms = performance.now() - t0;
const CW = 90, CH = 96, cols = 6, rows = Math.ceil(cells.length / cols), W = CW * cols, H = CH * rows;
const img = new Uint8Array(W * H * 4);
for (let i = 0; i < W * H; i++) ((img[i * 4] = 92), (img[i * 4 + 1] = 120), (img[i * 4 + 2] = 150), (img[i * 4 + 3] = 255));
cells.forEach((c, i) => {
  const ox = (i % cols) * CW + Math.floor((CW - c.d.w) / 2), oy = Math.floor(i / cols) * CH + Math.floor((CH - c.d.h) / 2);
  for (let y = 0; y < c.d.h; y++) for (let x = 0; x < c.d.w; x++) {
    const s = (y * c.d.w + x) * 4;
    if (!c.d.data[s + 3]) continue;
    const X = ox + x, Y = oy + y;
    if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
    const d = (Y * W + X) * 4;
    img[d] = c.d.data[s]; img[d + 1] = c.d.data[s + 1]; img[d + 2] = c.d.data[s + 2];
  }
});
const BW = W * sc, BH = H * sc, big = new Uint8Array(BW * BH * 4);
for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) { const s = (((y / sc) | 0) * W + ((x / sc) | 0)) * 4, d = (y * BW + x) * 4; big[d] = img[s]; big[d + 1] = img[s + 1]; big[d + 2] = img[s + 2]; big[d + 3] = 255; }
savePNG(out, BW, BH, big);
console.log(cells.length, "props", Math.round(ms), "ms", PROP_KINDS.join(","));
