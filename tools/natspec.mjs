import { ZONES, upChunk, downChunk } from "../src/forge/zones.js";
import { makePlan } from "../src/forge/natgen.js";
const z = ZONES.find((q) => q.id === process.argv[2]);
const P = makePlan(z, { seed: 1, Ft: 528, up: upChunk(z), down: downChunk(z), fe: 1, ze: 0, noRepair: true }, 0);
for (const r of P.spec) if (r.y1 - r.y0 > r.x1 - r.x0) console.log(r);
console.log(P.spec.length, P.mats.length, P.walls.length);
