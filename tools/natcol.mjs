// 기둥별 마디 조건 보기: natcol <id> x0 x1 y
import { ZONES, upChunk, downChunk } from "../src/forge/zones.js";
import { makePlan } from "../src/forge/natgen.js";
const [id, x0, x1, y] = process.argv.slice(2);
const z = ZONES.find((q) => q.id === id);
const P = makePlan(z, { seed: 1, Ft: 528, up: upChunk(z), down: downChunk(z), fe: 1, ze: 0, noRepair: true }, 0);
const A = P.A, C = A.C;
for (let c = Math.floor(+x0 / 8); c <= Math.floor(+x1 / 8); c++) {
  const iv = [];
  for (let k = C.ivS[c]; k < C.ivS[c + 1]; k++) C.bot[k] > +y - 140 && C.top[k] < +y + 20 && iv.push(C.top[k] + "-" + C.bot[k]);
  console.log(c, c * 8 + 4, "iv", iv.join(" "), "bodyAir", A.bodyAir(c, +y), "solid", P.F.solid(c * 8 + 1, +y + 2), P.F.solid(c * 8 + 6, +y + 2));
}
