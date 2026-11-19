// 구간의 마디와 각 마디에서 나가는 길 보기: natprobe <id> x0 x1 y0 y1
import { ZONES, upChunk, downChunk } from "../src/forge/zones.js";
import { makePlan } from "../src/forge/natgen.js";
const [id, x0, x1, y0, y1] = process.argv.slice(2);
const z = ZONES.find((q) => q.id === id);
const P = makePlan(z, { seed: 1, Ft: 528, up: upChunk(z), down: downChunk(z), fe: 1, ze: 0, noRepair: true }, 0);
const A = P.A, { nC, nY, NN, reach } = A;
for (let n = 0; n < NN; n++) {
  const x = nC[n] * 8 + 4;
  if (x < +x0 || x > +x1 || nY[n] < +y0 || nY[n] > +y1) continue;
  const o = (A.adj[n] ?? A.out(n)).map((b) => `${nC[b] * 8 + 4}:${nY[b]}`);
  console.log(x, nY[n], reach[n] ? "R" : "-", o.filter((s) => +s.split(":")[0] > x).slice(0, 8).join(" "));
}
