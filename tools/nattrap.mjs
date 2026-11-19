// 갇힌 곳의 꼭대기 찾기: 갇힌 마디 묶음마다 가장 높은 마디와 그 위 160px 안의 갇히지 않은 마디
import { ZONES, upChunk, downChunk } from "../src/forge/zones.js";
import { makePlan } from "../src/forge/natgen.js";
const [id, seedS = "1"] = process.argv.slice(2);
const z = ZONES.find((q) => q.id === id);
const P = makePlan(z, { seed: +seedS, Ft: 528, up: upChunk(z), down: downChunk(z), fe: 1, ze: 0, noRepair: true }, 0);
const A = P.A, { nC, nY, NN, reach, co, colN } = A;
const isT = new Uint8Array(NN);
for (const t of A.traps) isT[t] = 1;
// 묶음: adj로 이어진 갇힘 마디
const grp = new Int32Array(NN).fill(-1), G = [];
for (const t of A.traps) {
  if (grp[t] >= 0) continue;
  const q = [t], g = G.length;
  grp[t] = g;
  for (let h = 0; h < q.length; h++) for (const b of A.adj[q[h]] ?? []) isT[b] && grp[b] < 0 && ((grp[b] = g), q.push(b));
  let top = q[0];
  for (const n of q) nY[n] < nY[top] && (top = n);
  G.push({ n: q.length, top });
}
G.sort((a, b) => b.n - a.n);
console.log(P.check);
for (const g of G.slice(0, 12)) {
  const t = g.top, x = nC[t] * 8 + 4;
  // 위쪽 가까운 바깥 마디
  let best = null;
  for (let c = Math.max(0, nC[t] - 20); c <= nC[t] + 20 && c < colN.length - 1; c++)
    for (let b = colN[c]; b < colN[c + 1]; b++) if (!isT[b] && nY[b] < nY[t] + 10 && nY[t] - nY[b] < 200) { const d = Math.abs(c - nC[t]) * 8 + Math.abs(nY[t] - nY[b]); (!best || d < best[0]) && (best = [d, c * 8 + 4, nY[b], reach[b] ? "R" : "-", co[b] ? "co" : ""]); }
  console.log(`n=${g.n} top=(${x},${nY[t]}) near:`, best && best.slice(1).join(" "));
}
