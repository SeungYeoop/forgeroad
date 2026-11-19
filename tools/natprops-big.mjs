// 큰 크기 소품만 크게: node tools/natprops-big.mjs out.png
import { PROP_KINDS, paintProp } from "../src/forge/natprops.js";
import { savePNG } from "./png.mjs";
const out = process.argv[2] ?? "big.png", sc = 4, pal = { top: 0x6a9a3a, rock: 0x8a7a6a, acc: 0xffc040 };
const cells = PROP_KINDS.map((k) => paintProp(k, 2, 0, k === "p_crystal" ? { ...pal, acc: 0x60d0ff } : k === "p_shroom" ? { ...pal, acc: 0xc060e0 } : pal));
const CW = 70, CH = 90, cols = 7, rows = Math.ceil(cells.length / cols), W = CW * cols, H = CH * rows;
const img = new Uint8Array(W * H * 4);
for (let i = 0; i < W * H; i++) ((img[i * 4] = 70), (img[i * 4 + 1] = 64), (img[i * 4 + 2] = 72), (img[i * 4 + 3] = 255));
cells.forEach((d, i) => {
  const ox = (i % cols) * CW + Math.floor((CW - d.w) / 2), oy = Math.floor(i / cols) * CH + Math.floor((CH - d.h) / 2);
  for (let y = 0; y < d.h; y++) for (let x = 0; x < d.w; x++) {
    const s = (y * d.w + x) * 4;
    if (!d.data[s + 3]) continue;
    const X = ox + x, Y = oy + y;
    if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
    const t = (Y * W + X) * 4;
    img[t] = d.data[s]; img[t + 1] = d.data[s + 1]; img[t + 2] = d.data[s + 2];
  }
});
const BW = W * sc, BH = H * sc, big = new Uint8Array(BW * BH * 4);
for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) { const s = (((y / sc) | 0) * W + ((x / sc) | 0)) * 4, t = (y * BW + x) * 4; big[t] = img[s]; big[t + 1] = img[s + 1]; big[t + 2] = img[s + 2]; big[t + 3] = 255; }
savePNG(out, BW, BH, big);
