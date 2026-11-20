import { ZONES, upChunk, downChunk } from "../src/forge/zones.js";
import { planOf, layerAt } from "../src/forge/natgen.js";
const z = ZONES.find((q) => q.id === process.argv[2]);
const P = planOf(z, { seed: 1, Ft: 528, up: upChunk(z), down: downChunk(z), fe: 1, ze: 0 });
const ys = P.spots.map((p) => p.y).sort((a, b) => a - b);
console.log("kind", P.kind, "spots", ys.length, "min", ys[0], "max", ys[ys.length - 1]);
const hist = {};
for (const y of ys) hist[Math.floor(y / 500) * 500] = (hist[Math.floor(y / 500) * 500] ?? 0) + 1;
console.log(JSON.stringify(hist));
layerAt(P, 0, 0);
console.log("bands", P.bands);
const c = {};
for (const p of P.spots) c[layerAt(P, p.x, p.y)] = (c[layerAt(P, p.x, p.y)] ?? 0) + 1;
console.log(c);
console.log("check", JSON.stringify(P.check), "islands", (P.islands ?? []).length, "peak", JSON.stringify(P.peak), "deep", JSON.stringify(P.deep));
const A = P.A;
if (A) {
  const h2 = {};
  for (let n = 0; n < A.NN; n++) if (A.reach[n]) h2[Math.floor(A.nY[n] / 500) * 500] = (h2[Math.floor(A.nY[n] / 500) * 500] ?? 0) + 1;
  console.log("reach nodes by y", JSON.stringify(h2));
  const h3 = {};
  for (let n = 0; n < A.NN; n++) h3[Math.floor(A.nY[n] / 500) * 500] = (h3[Math.floor(A.nY[n] / 500) * 500] ?? 0) + 1;
  console.log("all nodes by y", JSON.stringify(h3));
}
