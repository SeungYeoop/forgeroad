import { ZONES, upChunk, downChunk } from "../src/forge/zones.js";
import { planOf } from "../src/forge/natgen.js";
const ids = process.argv[2].split(","), seeds = (process.argv[3] ?? "1").split(",").map(Number);
for (const id of ids) for (const seed of seeds) {
  const z = ZONES.find((q) => q.id === id);
  const log = [];
  const ol = console.log;
  globalThis.__sky = 1;
  console.log = (...a) => log.push(a.join(" "));
  const P = planOf(z, { seed, Ft: 528, up: upChunk(z), down: downChunk(z), fe: 1, ze: 0, patterns: z.y === 0 ? z.reg?.patterns : null });
  console.log = ol;
  const fails = log.filter((l) => /FAIL|missing|warn/.test(l));
  console.log(id, seed, "links ok", log.filter((l) => l.startsWith("link ")).length, "fails", fails.length, "peak", JSON.stringify(P.peak), "check", JSON.stringify(P.check));
  fails.slice(0, 6).forEach((f) => console.log("   ", f.slice(0, 200)));
}
