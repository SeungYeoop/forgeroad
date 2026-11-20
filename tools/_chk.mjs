import { ZONES, upChunk, downChunk } from "../src/forge/zones.js";
import { planOf } from "../src/forge/natgen.js";
const ids = (process.argv[2] ?? "gm1_0,g0_m1,g1_m1,gm1_m1,g0_1,g1_1,gm1_1").split(",");
const seeds = (process.argv[3] ?? "1,2").split(",").map(Number);
for (const id of ids)
  for (const seed of seeds) {
    const z = ZONES.find((q) => q.id === id);
    const t0 = Date.now();
    const P = planOf(z, { seed, Ft: 528, up: z.kind === "zone" ? upChunk(z) : -1, down: z.kind === "zone" ? downChunk(z) : -1, fe: 1, ze: 0, patterns: z.y === 0 ? z.reg?.patterns : null });
    console.log(id, seed, P.kind, JSON.stringify(P.check), "spots", P.spots.length, "ms", Date.now() - t0);
  }
