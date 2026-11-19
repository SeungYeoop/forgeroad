// analyze 시간 재기 (같은 설계로 3번)
import { ZONES, upChunk, downChunk } from "../src/forge/zones.js";
import { makePlan, analyze } from "../src/forge/natgen.js";
const z = ZONES.find((q) => q.id === (process.argv[2] ?? "g1_0"));
const P = makePlan(z, { seed: 1, Ft: 528, up: upChunk(z), down: downChunk(z), fe: 1, ze: 0, noRepair: !process.env.REP }, 0);
for (let i = 0; i < 3; i++) {
  const t = performance.now();
  const A = analyze(P);
  console.log("analyze", Math.round(performance.now() - t), "ms", A.miss, A.trapCount, A.reach.reduce((s, v) => s + v, 0));
}
