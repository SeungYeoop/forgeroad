// 길 검사 + 빠른 도달 지도
//   node --import ./tools/json-hook.mjs tools/natreach.mjs <구역id> [시드] [출력.png] [축소]
//   NOREP=1 이면 수리 없이. 회색 바위 · 초록 도달 마디 · 빨강 갇힘 · 파랑 못 닿은 마디 · 노랑 목표
import { ZONES, upChunk, downChunk } from "../src/forge/zones.js";
import { makePlan } from "../src/forge/natgen.js";
import { savePNG } from "./png.mjs";

const [id = "g1_0", seedS = "1", out = "", downS = "4"] = process.argv.slice(2);
const z = ZONES.find((q) => q.id === id);
const o = { seed: Number(seedS), Ft: 528, up: z.kind === "zone" ? upChunk(z) : -1, down: z.kind === "zone" ? downChunk(z) : -1, fe: 1, ze: 0, noRepair: !!process.env.NOREP };
const t0 = performance.now();
const P = makePlan(z, o, Number(process.env.ATT ?? 0));
const ms = performance.now() - t0;
const A = P.A;
const { nC, nY, NN, reach, co } = A;
let nr = 0, maxX = -1, maxN = -1;
for (let n = 0; n < NN; n++) if (reach[n]) (nr++, nC[n] > maxX && ((maxX = nC[n]), (maxN = n)));
console.log(JSON.stringify({ id, kind: P.kind, ms: Math.round(ms), tm: Object.fromEntries(Object.entries(P.tm).map(([k, v]) => [k, Math.round(v)])), check: P.check, nodes: NN, reached: nr, farX: maxX * 8 + 4, farY: maxN >= 0 ? nY[maxN] : null, peak: P.peak && { x: Math.round(P.peak.x), y: Math.round(P.peak.y) }, deep: P.deep && { x: Math.round(P.deep.x), y: Math.round(P.deep.y) }, goals: A.goals.map((g) => [g.id, g.n >= 0 ? [nC[g.n] * 8 + 4, nY[g.n]] : null]) }));
if (out) {
  // CROP=x,y,w,h: 그 부분만 (축소 D는 1/2도 된다)
  const [ox, oy, cw, chh] = process.env.CROP ? process.env.CROP.split(",").map(Number) : [0, 0, P.WP, P.HP];
  const D = Number(downS), W = Math.ceil(cw / D), H = Math.ceil(chh / D), img = new Uint8Array(W * H * 4);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const k = (y * W + x) * 4, s = P.F.solid(ox + x * D + D / 2, oy + y * D + D / 2);
      img[k] = s ? 110 : 20; img[k + 1] = s ? 100 : 26; img[k + 2] = s ? 95 : 40; img[k + 3] = 255;
    }
  const dot = (px, py, r, g, b, rad = 1) => {
    const X = Math.round((px - ox) / D), Y = Math.round((py - oy) / D);
    for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
      const x = X + dx, y = Y + dy;
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const k = (y * W + x) * 4; img[k] = r; img[k + 1] = g; img[k + 2] = b;
    }
  };
  for (const r of P.spec ?? []) for (let y = r.y0; y < r.y1; y += D) for (let x = r.x0; x < r.x1; x += D) dot(x, y, r.t === 2 ? 240 : r.t === 1 ? 170 : 90, r.t === 2 ? 240 : r.t === 1 ? 120 : 160, r.t === 2 ? 250 : r.t === 1 ? 60 : 230, 0);
  const trap = new Set(A.traps);
  for (let n = 0; n < NN; n++) {
    const x = nC[n] * 8 + 4, y = nY[n] - 2;
    if (trap.has(n)) dot(x, y, 255, 40, 40);
    else if (reach[n]) dot(x, y, 60, 230, 90, D < 2 ? 1 : 0);
    else dot(x, y, 60, 110, 255, D < 2 ? 1 : 0);
  }
  for (const g of A.goals) g.n >= 0 && dot(nC[g.n] * 8 + 4, nY[g.n] - 10, 255, 230, 0, 5);
  maxN >= 0 && dot(nC[maxN] * 8 + 4, nY[maxN] - 10, 255, 0, 255, 6);
  savePNG(out, W, H, img);
  console.log("saved", out, W, H);
}
