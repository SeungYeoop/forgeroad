// 배경 층 따로 보기: node tools/bgsheet.mjs out.png [look] — 하늘·원경·중경·근경을 위아래로 쌓고 마지막에 겹친 모습
import { savePNG } from "./png.mjs";
import { paintLayer3d, paintSky3d } from "../src/forge/bgnew.js";
const [out = "bg.png", look = "grassmere"] = process.argv.slice(2);
const pal = { sky: [0x3f86d6, 0xcdeaf8], far: 0x7f9cc4, mid: 0x5f9a5c, near: 0x355f3c, top: 0x6aaf48, topHi: 0xb6e070, soil: 0x86684a, soilDark: 0x46342a, soilHi: 0xa8885e, rock: 0x9c9686, accent: 0xffe08a, fog: 0xeaf6ff, glow: 0xfff2c8 };
const W = 640, H = 600;
const fake = (w, h) => { const d = new Uint8Array(w * h * 4); return { w, h, d, px(x, y, c, a = 255) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= w || y >= h) return; const i = (y * w + x) * 4, t = a / 255; d[i] = d[i] * (1 - t) + ((c >> 16) & 255) * t; d[i + 1] = d[i + 1] * (1 - t) + ((c >> 8) & 255) * t; d[i + 2] = d[i + 2] * (1 - t) + (c & 255) * t; d[i + 3] = Math.min(255, d[i + 3] + a); } }; };
let s = 7;
const h = { next: () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296), int(a, b) { return a + Math.floor(this.next() * (b - a + 1)); } };
const sky = fake(W, 360); paintSky3d(sky, pal, W, 360);
const L = [0, 1, 2].map((k) => { const T = fake(W, H); paintLayer3d(T, k, pal, h, look); return T; });
const OH = 360 + H * 3 + 360;
const img = new Uint8Array(W * OH * 4);
const blit = (T, oy) => { for (let y = 0; y < T.h; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4, j = ((y + oy) * W + x) * 4, a = T.d[i + 3] / 255; if (y + oy >= OH) continue; for (let c = 0; c < 3; c++) img[j + c] = img[j + c] * (1 - a) + T.d[i + c] * a; img[j + 3] = 255; } };
blit(sky, 0); L.forEach((T, k) => blit(T, 360 + k * H));
// 겹친 모습 (게임처럼 아래쪽 정렬, 위로 120px 올림)
blit(sky, 360 + H * 3); for (const T of L) blit(T, 360 + H * 3 - 220);
savePNG(out, W, OH, img);
console.log("ok", out);
