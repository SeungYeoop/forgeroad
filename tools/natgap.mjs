// 끊긴 곳 찾기: 닿은 마디 바로 위(100px 안)에 못 닿은 마디가 있는 자리를 묶어 보여 준다
//   natgap <id> [시드]   (또는 GAPTRAP=1: 갇힌 마디 묶음)
import { ZONES, upChunk, downChunk } from "../src/forge/zones.js";
import { makePlan } from "../src/forge/natgen.js";
const [id, seedS = "1"] = process.argv.slice(2);
const z = ZONES.find((q) => q.id === id);
const P = makePlan(z, { seed: +seedS, Ft: 528, up: upChunk(z), down: downChunk(z), fe: 1, ze: 0, noRepair: true }, 0);
const A = P.A, { nC, nY, NN, reach, colN } = A;
const hits = [];
if (process.env.GAPTRAP) for (const t of A.traps) hits.push([nC[t] * 8 + 4, nY[t], 0]);
else
  for (let a = 0; a < NN; a++) {
    if (!reach[a]) continue;
    for (let c = Math.max(0, nC[a] - 4); c <= nC[a] + 4 && c < colN.length - 1; c++)
      for (let b = colN[c]; b < colN[c + 1]; b++) if (!reach[b] && nY[b] < nY[a] && nY[a] - nY[b] <= 140) hits.push([nC[a] * 8 + 4, nY[a], nY[a] - nY[b]]);
  }
const cl = [];
for (const h of hits) {
  const g = cl.find((q) => Math.abs(q.x - h[0]) < 200 && Math.abs(q.y - h[1]) < 200);
  g ? (g.n++, (g.d = Math.max(g.d, h[2]))) : cl.push({ x: h[0], y: h[1], n: 1, d: h[2] });
}
console.log(P.check, "clusters:", cl.length);
for (const g of cl.slice(0, 40)) console.log(`  x=${g.x} y=${g.y} n=${g.n} rise=${g.d}`);
