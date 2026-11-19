// 못 닿은 마디 무리 (가로 80px·세로 40px 칸으로 묶어 큰 무리부터)
import { ZONES, upChunk, downChunk } from "../src/forge/zones.js";
import { makePlan } from "../src/forge/natgen.js";
const z = ZONES.find((q) => q.id === process.argv[2]);
const P = makePlan(z, { seed: 1, Ft: 528, up: upChunk(z), down: downChunk(z), fe: 1, ze: 0, noRepair: true }, 0);
const A = P.A, { nC, nY, NN, reach } = A;
const g = new Map();
for (let n = 0; n < NN; n++) if (!reach[n]) { const k = Math.floor(nC[n] / 10) + ":" + Math.floor(nY[n] / 40); g.set(k, (g.get(k) ?? []).concat(n)); }
// 이웃 칸 합치기
const keys = [...g.keys()], seen = new Set(), out = [];
for (const k of keys) {
  if (seen.has(k)) continue;
  const st = [k], grp = [];
  seen.add(k);
  while (st.length) { const q = st.pop(); grp.push(...g.get(q)); const [a, b] = q.split(":").map(Number); for (const [da, db] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]) { const kk = (a + da) + ":" + (b + db); g.has(kk) && !seen.has(kk) && (seen.add(kk), st.push(kk)); } }
  const xs = grp.map((n) => nC[n] * 8), ys = grp.map((n) => nY[n]);
  out.push([grp.length, Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]);
}
out.sort((a, b) => b[0] - a[0]);
for (const o of out.slice(0, 15)) console.log("unreached", o[0], "x", o[1], "-", o[2], "y", o[3], "-", o[4]);
