// 세로줄마다 공기 구간(위→아래): node --import ./tools/json-hook.mjs tools/natcolumn.mjs g1_0 <seed> x0 x1 y0 y1 [step]
import { ZONES, upChunk, downChunk } from "../src/forge/zones.js";
import { makePlan } from "../src/forge/natgen.js";
const [id, sd, x0, x1, y0, y1, st = 16] = process.argv.slice(2);
const z = ZONES.find((q) => q.id === id);
const P = makePlan(z, { seed: +sd, Ft: 528, up: upChunk(z), down: downChunk(z), fe: 1, ze: 0, noRepair: true }, 0);
for (let x = +x0; x <= +x1; x += +st) {
  const runs = [];
  let a = null;
  for (let y = +y0; y <= +y1; y += 4) {
    const s = P.F.solid(x, y);
    if (!s && a === null) a = y;
    if (s && a !== null) (runs.push(`${a}-${y}`), (a = null));
  }
  a !== null && runs.push(`${a}-`);
  console.log(x, runs.join(" "));
}
