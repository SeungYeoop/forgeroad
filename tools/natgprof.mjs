// 지표 높이 (x마다) + 평평한 곳 + 하늘섬 목록
import { ZONES, upChunk, downChunk } from "../src/forge/zones.js";
import { makePlan } from "../src/forge/natgen.js";
const z = ZONES.find((q) => q.id === process.argv[2]);
const P = makePlan(z, { seed: 1, Ft: 528, up: upChunk(z), down: downChunk(z), fe: 1, ze: 0, noRepair: true }, 0);
const h = P.h, Q = 4;
const at = (x) => Math.round(h[Math.round(x / Q)]);
let line = [];
for (let x = 0; x < 8192; x += 100) line.push(x + ":" + at(x));
console.log(line.join(" "));
// 평평한 곳 (±60px에서 10px 안)
const flats = [];
for (let x = 80; x < 8100; x += 40) {
  const y = at(x);
  if ([-60, -30, 30, 60].every((d) => Math.abs(at(x + d) - y) <= 10)) flats.push(x + "@" + y);
}
console.log("flat", flats.join(" "));
console.log("upX", P.upX, "peak", JSON.stringify(P.peak), "mtn", JSON.stringify(P.mtn));
