// 게임과 같은 planOf (최대 3번 시도) 결과
import { ZONES, upChunk, downChunk } from "../src/forge/zones.js";
import { planOf } from "../src/forge/natgen.js";
for (const id of process.argv.slice(2)) {
  const z = ZONES.find((q) => q.id === id);
  const t = performance.now();
  const P = planOf(z, { seed: 1, Ft: 528, up: z.kind === "zone" ? upChunk(z) : -1, down: z.kind === "zone" ? downChunk(z) : -1, fe: 1, ze: 0 });
  console.log(id, Math.round(performance.now() - t) + "ms", "attempt", P.attempt, JSON.stringify(P.check));
}
