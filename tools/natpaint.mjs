// 자연 지형을 실제 그림(terrfine.js)으로 그려 PNG로 저장 — 픽셀 아트 품질 확인용
//   node --import ./tools/json-hook.mjs tools/natpaint.mjs <구역id> <시드> <출력.png> [x0 y0 w h]
import { ZONES, upChunk, downChunk, FR_WORLD } from "../src/forge/zones.js";
import { planOf, drawChunk } from "../src/forge/natgen.js";
import { pixFine, fineSlice } from "../src/forge/terrfine.js";
import { savePNG } from "./png.mjs";

const [id = "g1_0", seedS = "1", out = "paint.png", ...crop] = process.argv.slice(2);
const z = ZONES.find((q) => q.id === id);
const seed = Number(seedS);
const o = { seed, Ft: 176, up: z.kind === "zone" ? upChunk(z) : -1, down: z.kind === "zone" ? downChunk(z) : -1, fe: 1, ze: 0, biome: null, noRepair: !!process.env.NOREP };
const CAVE_BIO = (x, y) => (y === 3 ? "magma" : y === 2 ? "deep" : x === -1 ? "lush" : Math.abs(x) % 2 ? "geode" : "drip");
const GROUND_BIO = { "-3": "drip", "-2": "deep", "-1": "lush", 1: "drip", 2: "geode", 3: "magma" };
o.biome = z.y > 0 ? CAVE_BIO(z.x, z.y) : GROUND_BIO[z.x] ?? "drip";
o.patterns = z.y === 0 ? z.reg?.patterns : null;
const P = planOf(z, o);
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
const t0 = performance.now();
let painted = 0;
for (let S = z.c0; S < z.c1; S++) {
  const sx = (S - z.c0) * 512;
  if (sx + 512 <= cx || sx >= cx + W) continue;
  const r = new Uint8Array(32 * 176), l = new Array(32), s = new Array(32);
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
      img[k] = src[q];
      img[k + 1] = src[q + 1];
      img[k + 2] = src[q + 2];
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
  const base = 100 * 16;
  fig(60, base);
  rect(0, base - 230, 640, 360, [255, 255, 255]);
  P.peak && fig(P.peak.x + 20, P.peak.y);
  for (const I of P.islands) if (I.w > 500) fig(I.cx - I.w * 0.2, Math.round(I.top / 8) * 8);
  for (const s of P.spots.filter((_, k) => k % 60 === 0)) fig(s.x, s.y);
}
console.log(`${id} seed ${seed}: ${painted} chunks painted in ${Math.round(performance.now() - t0)}ms (${Math.round((performance.now() - t0) / painted)}ms/chunk)`);
savePNG(out, W, Hh, img);
