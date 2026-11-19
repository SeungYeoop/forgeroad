// 지표 높이 줄: node tools/natgline.mjs g1_0 x0 x1 [step]
import { ZONES, upChunk, downChunk } from "../src/forge/zones.js";
import { makePlan } from "../src/forge/natgen.js";
const [id, a, b, st = 16] = process.argv.slice(2);
const z = ZONES.find((q) => q.id === id);
const P = makePlan(z, { seed: 1, Ft: 528, up: upChunk(z), down: downChunk(z), fe: 1, ze: 0, noRepair: true }, 0);
const out = [];
for (let x = +a; x <= +b; x += +st) out.push(x + ":" + Math.round(P.h[Math.round(x / 4)]));
console.log(out.join(" "));
