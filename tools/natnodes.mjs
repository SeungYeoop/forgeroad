// 마디 도달 여부: node --import ./tools/json-hook.mjs tools/natnodes.mjs g1_0 <seed> x0 x1 y0 y1
import { ZONES, upChunk, downChunk } from "../src/forge/zones.js";
import { makePlan } from "../src/forge/natgen.js";
const [id, sd, x0, x1, y0, y1] = process.argv.slice(2);
const z = ZONES.find((q) => q.id === id);
const P = makePlan(z, { seed: +sd, Ft: 528, up: upChunk(z), down: downChunk(z), fe: 1, ze: 0, noRepair: true }, 0);
const A = P.A, out = [];
for (let n = 0; n < A.NN; n++) {
  const x = A.nC[n] * 8 + 4, y = A.nY[n];
  if (x >= +x0 && x <= +x1 && y >= +y0 && y <= +y1) out.push(`${x},${y}:${A.reach[n] ? "R" : "-"}`);
}
console.log(out.join(" "));
