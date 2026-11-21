// 못 닿은 마디 묶음 (구조물별): 칸 좌표 x, 줄 y
import { ZONES, upChunk, downChunk } from "../src/forge/zones.js";
import { makePlan } from "../src/forge/natgen.js";
import { biomeOf } from "../src/forge/terrprof.js";
globalThis.__sky = 1;
const [id = "g0_m1", sd = "1"] = process.argv.slice(2);
const z = ZONES.find((q) => q.id === id);
const o = { seed: +sd, Ft: 528, up: upChunk(z), down: downChunk(z), fe: 1, ze: 0, biome: biomeOf(z), noRepair: 1, patterns: null };
const P = makePlan(z, o, 0), A = P.A;
for (const s of P.structs ?? []) {
  const un = [];
  for (let n = 0; n < A.NN; n++) { const x = A.nC[n] * 8 + 4, y = A.nY[n]; if (x >= s.x0 && x < s.x1 && y >= s.y0 && y <= s.y1 && !A.reach[n]) un.push([A.nC[n], Math.round(y / 8)]); }
  if (!un.length) continue;
  un.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  const g = [];
  for (const [x, y] of un) { const l = g[g.length - 1]; if (l && l.y === y && x - l.x1 <= 2) l.x1 = x; else g.push({ y, x0: x, x1: x }); }
  console.log(s.name, g.map((q) => `${q.x0}-${q.x1}@${q.y}`).join(" "));
}
