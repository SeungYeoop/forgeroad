// 빈 하늘 구멍 지도: 글자 하나 = 16×16칸 (128px). # 바위 많음 · + 바위 조금 · . 바위 가까움 · (빈칸) 80px 넘게 빈 하늘
import { ZONES, upChunk, downChunk } from "../src/forge/zones.js";
import { makePlan } from "../src/forge/natgen.js";
import { biomeOf } from "../src/forge/terrprof.js";
globalThis.__sky = 1;
const [id = "g0_m1", sd = "1"] = process.argv.slice(2);
const z = ZONES.find((q) => q.id === id);
const o = { seed: +sd, Ft: 528, up: upChunk(z), down: downChunk(z), fe: 1, ze: 0, biome: biomeOf(z), noRepair: 1, patterns: null };
const P = makePlan(z, o, 0), F = P.F;
const NX = Math.floor(P.WP / 8), NY = Math.floor(P.HP / 8);
const sol = new Uint8Array(NX * NY);
for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) sol[y * NX + x] = F.solid(x * 8 + 4, y * 8 + 4) ? 1 : 0;
const R = 10, near = new Uint8Array(NX * NY), nx = new Uint8Array(NX * NY);
for (let y = 0; y < NY; y++) { let l = -1e9; for (let x = 0; x < NX; x++) (sol[y * NX + x] && (l = x), x - l <= R && (nx[y * NX + x] = 1)); l = 1e9; for (let x = NX - 1; x >= 0; x--) (sol[y * NX + x] && (l = x), l - x <= R && (nx[y * NX + x] = 1)); }
for (let x = 0; x < NX; x++) { let l = -1e9; for (let y = 0; y < NY; y++) (nx[y * NX + x] && (l = y), y - l <= R && (near[y * NX + x] = 1)); l = 1e9; for (let y = NY - 1; y >= 0; y--) (nx[y * NX + x] && (l = y), l - y <= R && (near[y * NX + x] = 1)); }
const B = 16;
console.log("      " + Array.from({ length: Math.ceil(NX / B / 4) }, (_, i) => String(i * 64).padEnd(4)).join(""));
for (let by = 0; by < NY / B; by++) {
  let line = "";
  for (let bx = 0; bx < NX / B; bx++) {
    let s = 0, f = 0, n = 0;
    for (let y = by * B; y < Math.min(NY, by * B + B); y++) for (let x = bx * B; x < Math.min(NX, bx * B + B); x++) (n++, sol[y * NX + x] && s++, !near[y * NX + x] && f++);
    line += s / n > 0.5 ? "#" : s / n > 0.08 ? "+" : f / n > 0.5 ? " " : ".";
  }
  console.log(String(by * B).padStart(5) + " " + line + "|");
}
