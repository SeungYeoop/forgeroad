// 하늘 디딤돌 뛰기를 검사기로 하나씩: 뛰는 곳·내리는 곳 가까운 마디 사이에 길이 있나
import { ZONES, upChunk, downChunk } from "../src/forge/zones.js";
import { makePlan } from "../src/forge/natgen.js";
const z = ZONES.find((q) => q.id === process.argv[2]);
const P = makePlan(z, { seed: 1, Ft: 528, up: upChunk(z), down: downChunk(z), fe: 1, ze: 0, noRepair: true }, 0);
const A = P.A, { nC, nY, NN, colN } = A;
const nearN = (x, y) => {
  let best = -1, bd = 1e9;
  const c0 = Math.max(0, Math.floor((x - 40) / 8)), c1 = Math.floor((x + 40) / 8);
  for (let c = c0; c <= c1 && c < colN.length - 1; c++) for (let n = colN[c]; n < colN[c + 1]; n++) { const d = Math.abs(nC[n] * 8 + 4 - x) + Math.abs(nY[n] - y) * 2; d < bd && Math.abs(nY[n] - y) < 24 && ((bd = d), (best = n)); }
  return best;
};
let bad = 0;
for (const h of P.skyHops ?? []) {
  const a = nearN(h.from.x, h.from.y), b = nearN(h.to.x, h.to.y);
  if (a < 0 || b < 0) { console.log("no node", JSON.stringify(h)); bad++; continue; }
  const ok = (A.adj[a] ?? A.out(a)).includes(b) || (A.adj[b] ?? A.out(b)).includes(a);
  if (!ok) { bad++; console.log("FAIL hop", Math.round(h.from.x), Math.round(h.from.y), "→", Math.round(h.to.x), Math.round(h.to.y), "nodes", nC[a] * 8 + 4, nY[a], nC[b] * 8 + 4, nY[b], "how", A.how(a, b)); }
}
console.log("hops", (P.skyHops ?? []).length, "bad", bad);
