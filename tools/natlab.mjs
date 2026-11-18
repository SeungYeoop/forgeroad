// 자연 지형 실험실 (노드에서 바로): 여러 시드로 구역을 만들어 검사하고 그림으로 저장한다
//   node --import ./tools/json-hook.mjs tools/natlab.mjs
//   SEEDS=1,2,3  ZONES=g1_0,gm3_0  IMG=폴더  SCALE=4
import { ZONES, upChunk, downChunk } from "../src/forge/zones.js";
import { planOf, makePlan, FLOOR } from "../src/forge/natgen.js";
import { savePNG } from "./png.mjs";
import fs from "node:fs";

const seeds = (process.env.SEEDS || "1").split(",").map(Number);
const only = process.env.ZONES ? process.env.ZONES.split(",") : null;
const IMG = process.env.IMG || "";
const SC = Number(process.env.SCALE || 4);
IMG && fs.mkdirSync(IMG, { recursive: true });

const PAL = { ground: [0x8a, 0x6a, 0x50], cave: [0x6a, 0x60, 0x70], sky: [0x9a, 0x8a, 0x7a] };
const rows = [];
for (const seed of seeds)
  for (const z of ZONES) {
    if (only && !only.includes(z.id)) continue;
    const o = { seed, Ft: 116, up: z.kind === "zone" ? upChunk(z) : -1, down: z.kind === "zone" ? downChunk(z) : -1 };
    const t0 = performance.now();
    const P = process.env.ATT != null ? Object.assign(makePlan(z, o, Number(process.env.ATT)), { tries: [] }) : planOf(z, o);
    const ms = performance.now() - t0;
    rows.push({ seed, id: z.id, kind: P.kind, prof: P.pkey, ms: Math.round(ms), build: Math.round(P.tm.build), an: Math.round(P.tm.an), rep: P.repairs, ok: P.check.ok, miss: P.check.miss.join(""), traps: P.check.traps, att: P.attempt, why: P.tries.slice(0, -1).map((c) => `${c.miss.join("")}/${c.traps}`).join(" ") });
    if (IMG) {
      const w = Math.ceil(P.WP / SC), h = Math.ceil(P.HP / SC);
      const px = new Uint8Array(w * h * 4);
      const base = PAL[P.kind];
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const k = (y * w + x) * 4;
          const s = P.F.solid(x * SC + SC / 2, y * SC + SC / 2);
          const sky = P.kind === "cave" ? [24, 20, 30] : y * SC < FLOOR * 16 + 200 ? [150, 200, 240] : [40, 36, 50];
          const c = s ? base : sky;
          px[k] = c[0];
          px[k + 1] = c[1];
          px[k + 2] = c[2];
          px[k + 3] = 255;
        }
      const A = P.A;
      const dot = (cx, cy, col, r = 1) => {
        for (let dy = -r; dy <= r; dy++)
          for (let dx = -r; dx <= r; dx++) {
            const X = Math.round(cx / SC) + dx, Y = Math.round(cy / SC) + dy;
            if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
            const k = (Y * w + X) * 4;
            px[k] = col[0];
            px[k + 1] = col[1];
            px[k + 2] = col[2];
          }
      };
      for (let n = 0; n < A.NN; n++) {
        const col = !A.reach[n] ? [120, 120, 120] : A.co[n] ? [60, 230, 90] : [255, 60, 220];
        dot(A.nC[n] * 8 + 4, A.nY[n] - 2, col, 0);
      }
      dot(44, FLOOR * 16 - 6, [40, 90, 255], 3);
      dot(P.WP - 56, FLOOR * 16 - 6, [255, 40, 40], 3);
      P.peak && dot(P.peak.x, P.peak.y - 6, [255, 230, 40], 3);
      P.deep && dot(P.deep.x, P.deep.y - 6, [255, 120, 20], 3);
      savePNG(`${IMG}/${z.id}_s${seed}.png`, w, h, px);
    }
  }
process.env.QUIET ? console.table(rows.filter((r) => !r.ok || r.att > 0 || r.ms > 150)) : console.table(rows);
const bad = rows.filter((r) => !r.ok);
const ms = rows.map((r) => r.ms).sort((a, b) => a - b);
console.log(`zones ${rows.length}, ok ${rows.length - bad.length}, fail ${bad.length}, ms median ${ms[ms.length >> 1]} max ${ms[ms.length - 1]}`);
