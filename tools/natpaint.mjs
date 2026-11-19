// 자연 지형을 실제 그림(terrfine.js)으로 그려 PNG로 저장 — 픽셀 아트 품질 확인용
//   node --import ./tools/json-hook.mjs tools/natpaint.mjs <구역id> <시드> <출력.png> [x0 y0 w h]
import { ZONES, upChunk, downChunk, FR_WORLD } from "../src/forge/zones.js";
import { planOf, drawChunk, adoptPlan } from "../src/forge/natgen.js";
import v8 from "node:v8";
import { pixFine, fineSlice } from "../src/forge/terrfine.js";
import { savePNG } from "./png.mjs";
import fs from "node:fs";
import { paintDeco } from "../src/forge/natdeco.js";

const [id = "g1_0", seedS = "1", out = "paint.png", ...crop] = process.argv.slice(2);
const z = ZONES.find((q) => q.id === id);
const seed = Number(seedS);
const o = { seed, Ft: 528, up: z.kind === "zone" ? upChunk(z) : -1, down: z.kind === "zone" ? downChunk(z) : -1, fe: 1, ze: 0, biome: null, noRepair: !!process.env.NOREP };
const CAVE_BIO = (x, y) => (y === 3 ? "magma" : y === 2 ? "deep" : x === -1 ? "lush" : Math.abs(x) % 2 ? "geode" : "drip");
const GROUND_BIO = { "-3": "drip", "-2": "deep", "-1": "lush", 1: "drip", 2: "geode", 3: "magma" };
o.biome = z.y > 0 ? CAVE_BIO(z.x, z.y) : GROUND_BIO[z.x] ?? "drip";
o.patterns = z.y === 0 ? z.reg?.patterns : null;
// PLANFILE: 미리 만든 설계(natpaintp가 한 번만 만든다)
const P = process.env.PLANFILE ? adoptPlan(z, seed, v8.deserialize(fs.readFileSync(process.env.PLANFILE))) : planOf(z, o);
const region = { pal: z.reg.pal, theme: z.reg.theme };
const [cx = 0, cy = 0, cw = P.WP, chh = P.HP] = crop.map(Number);
const W = cw, Hh = chh, img = new Uint8Array(W * Hh * 4);
// 하늘 배경
for (let y = 0; y < Hh; y++)
  for (let x = 0; x < W; x++) {
    const k = (y * W + x) * 4, t = (cy + y) / P.HP;
    img[k] = 120 + 60 * t;
    img[k + 1] = 170 + 40 * t;
    img[k + 2] = 230;
    img[k + 3] = 255;
  }
// 나무·폐허 (지형 뒤)
const DC = new Map();
for (const T of P.trees ?? []) {
  let D = DC.get(T.key);
  D || DC.set(T.key, (D = paintDeco(T.key)));
  const ox = T.x - D.w / 2 - cx, oy = T.y - D.h + 1 - cy;
  for (let y = 0; y < D.h; y++)
    for (let x = 0; x < D.w; x++) {
      const q = (y * D.w + x) * 4, X = ox + x, Y = oy + y;
      if (!D.data[q + 3] || X < 0 || Y < 0 || X >= W || Y >= Hh) continue;
      const k = (Y * W + X) * 4;
      img[k] = D.data[q]; img[k + 1] = D.data[q + 1]; img[k + 2] = D.data[q + 2];
    }
}
console.log("trees", (P.trees ?? []).length);
const t0 = performance.now();
let painted = 0;
// PART=k/n: 조각 k, k+n, …만 그리고 날것(RGBA)을 out.raw로 (natpaintp.mjs가 합친다)
const PART = process.env.PART ? process.env.PART.split("/").map(Number) : null;
for (let S = z.c0; S < z.c1; S++) {
  const sx = (S - z.c0) * 512;
  if (sx + 512 <= cx || sx >= cx + W) continue;
  if (PART && (S - z.c0) % PART[1] !== PART[0]) continue;
  const r = new Uint8Array(32 * 528), l = new Array(32), s = new Array(32);
  const ch = drawChunk(P, z, S, r, l, s, { ...o, arena: false });
  const g = pixFine({ ug: ch.ug }, S * 32, region, fineSlice(ch));
  let st;
  do st = g.next(); while (!st.done);
  painted++;
  const { img: im, wall } = st.value;
  const A = im.data, Wl = wall;
  for (let y = 0; y < Hh; y++) {
    const yy = cy + y;
    if (yy >= im.height) break;
    for (let x = 0; x < W; x++) {
      const xx = cx + x - sx;
      if (xx < 0 || xx >= 512) continue;
      const q = (yy * 512 + xx) * 4, k = (y * W + x) * 4;
      const src = A[q + 3] ? A : Wl[q + 3] ? Wl : null;
      if (!src) continue;
      const al = src[q + 3] / 255;
      img[k] = img[k] * (1 - al) + src[q] * al;
      img[k + 1] = img[k + 1] * (1 - al) + src[q + 1] * al;
      img[k + 2] = img[k + 2] * (1 - al) + src[q + 2] * al;
    }
  }
}
// MARK=1: 캐릭터(몸 10×22px)와 게임 화면(640×360) 크기 표시
if (process.env.MARK) {
  const put = (x, y, c) => {
    x -= cx;
    y -= cy;
    if (x < 0 || y < 0 || x >= W || y >= Hh) return;
    const k = (y * W + x) * 4;
    img[k] = c[0];
    img[k + 1] = c[1];
    img[k + 2] = c[2];
  };
  const fig = (fx, fy) => {
    fx = Math.round(fx);
    fy = Math.round(fy);
    for (let y = fy - 23; y <= fy; y++)
      for (let x = fx - 6; x <= fx + 6; x++) {
        const edge = y === fy - 23 || y === fy || x === fx - 6 || x === fx + 6;
        const head = y < fy - 15 && x > fx - 4 && x < fx + 4;
        put(x, y, edge ? [20, 10, 10] : head ? [255, 220, 170] : [230, 30, 40]);
      }
  };
  const rect = (x0, y0, w, h, c, th = 3) => {
    for (let t = 0; t < th; t++) {
      for (let x = x0; x < x0 + w; x++) (put(x, y0 + t, c), put(x, y0 + h - 1 - t, c));
      for (let y = y0; y < y0 + h; y++) (put(x0 + t, y, c), put(x0 + w - 1 - t, y, c));
    }
  };
  const base = 300 * 16;
  fig(60, base);
  rect(0, base - 230, 640, 360, [255, 255, 255]);
  P.peak && fig(P.peak.x + 20, P.peak.y);
  for (const I of P.islands) if (I.w > 500) fig(I.cx - I.w * 0.2, Math.round(I.top / 8) * 8);
  for (const s of P.spots.filter((_, k) => k % 60 === 0)) fig(s.x, s.y);
}
console.log(`${id} seed ${seed}: ${painted} chunks painted in ${Math.round(performance.now() - t0)}ms (${Math.round((performance.now() - t0) / painted)}ms/chunk)`);
if (PART) {
  fs.writeFileSync(out + ".raw", img);
  process.exit(0);
}
// DOWN=n: n×n 픽셀을 하나로 (큰 구역 전체를 한 장에)
const DN = Number(process.env.DOWN || 1);
if (DN > 1) {
  const w2 = Math.floor(W / DN), h2 = Math.floor(Hh / DN), o2 = new Uint8Array(w2 * h2 * 4);
  for (let y = 0; y < h2; y++)
    for (let x = 0; x < w2; x++) {
      let r = 0, g = 0, b = 0;
      for (let j = 0; j < DN; j++) for (let i = 0; i < DN; i++) { const k = ((y * DN + j) * W + x * DN + i) * 4; r += img[k]; g += img[k + 1]; b += img[k + 2]; }
      const k = (y * w2 + x) * 4, n = DN * DN;
      o2[k] = r / n; o2[k + 1] = g / n; o2[k + 2] = b / n; o2[k + 3] = 255;
    }
  savePNG(out, w2, h2, o2);
} else savePNG(out, W, Hh, img);
