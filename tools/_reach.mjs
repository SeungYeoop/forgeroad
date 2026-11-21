// 닿은 곳 지도: 구조물(P.structs)마다 닿은 마디 비율 + 못 닿은 마디 묶음
import { ZONES, upChunk, downChunk } from "../src/forge/zones.js";
import { makePlan } from "../src/forge/natgen.js";
import { biomeOf } from "../src/forge/terrprof.js";
globalThis.__sky = 1;
const [id = "g0_m1", sd = "1"] = process.argv.slice(2);
const z = ZONES.find((q) => q.id === id);
const o = { seed: +sd, Ft: 528, up: upChunk(z), down: downChunk(z), fe: 1, ze: 0, biome: biomeOf(z), noRepair: 1, patterns: null };
const P = makePlan(z, o, 0), A = P.A;
console.log("check", JSON.stringify(P.check));
for (const s of P.structs ?? []) {
  let r = 0, t = 0;
  for (let n = 0; n < A.NN; n++) { const x = A.nC[n] * 8 + 4, y = A.nY[n]; if (x >= s.x0 && x < s.x1 && y >= s.y0 && y <= s.y1) (t++, A.reach[n] && r++); }
  console.log(`${s.name.padEnd(16)} ${String(t ? Math.round((100 * r) / t) : "-").padStart(4)}%  (${t})`);
}
if (process.env.XY) {
  const [X0, X1, Y0, Y1] = process.env.XY.split(",").map(Number);
  const at = {};
  for (let n = 0; n < A.NN; n++) at[A.nC[n] + ":" + Math.round(A.nY[n] / 16)] = A.reach[n] ? "R" : "n";
  for (let y = Y0; y < Y1; y += 16) { let row = ""; for (let x = X0; x < X1; x += 8) row += at[Math.floor(x / 8) + ":" + Math.round(y / 16)] ?? (P.F.solid(x, y) ? "#" : "."); console.log(String(y).padStart(5), row); }
}
