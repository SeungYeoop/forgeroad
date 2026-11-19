// 구역의 상자·적 자리·역할 수 세기 (실제 drawChunk로)
//   node --import ./tools/json-hook.mjs tools/natloot.mjs g1_0
import { ZONES, upChunk, downChunk } from "../src/forge/zones.js";
import { planOf, drawChunk } from "../src/forge/natgen.js";
const id = process.argv[2] ?? "g1_0";
const z = ZONES.find((q) => q.id === id);
const o = { seed: 1, Ft: 528, up: z.kind === "zone" ? upChunk(z) : -1, down: z.kind === "zone" ? downChunk(z) : -1, fe: 1, ze: 0, biome: "drip", noRepair: !!process.env.NOREP };
o.patterns = z.y === 0 ? z.reg?.patterns : null;
const P = planOf(z, o);
const roles = {};
for (const t of P.roomTags ?? []) roles[t.role] = (roles[t.role] ?? 0) + 1;
console.log("check", JSON.stringify(P.check), "roles", JSON.stringify(roles));
let chests = [], spawns = [], hz = 0;
for (let S = z.c0; S < z.c1; S++) {
  const r = new Uint8Array(32 * 528), l = new Array(32), s = new Array(32);
  const ch = drawChunk(P, z, S, r, l, s, { ...o, arena: false });
  const bx = (S - z.c0) * 512;
  for (const c of ch.chests) chests.push([bx + c.x * 16, c.py, c.tier]);
  for (const c of ch.spawns) spawns.push([bx + c.x * 16, c.py ?? c.row * 16, c.fly ? "fly" : ""]);
  hz += ch.hazards.length;
}
const area = (x, y) => (y < 4790 ? "sky" : y < 4900 ? "surf" : x >= 4200 ? "dun" : "cave");
const cnt = (a) => a.reduce((m, [x, y]) => ((m[area(x, y)] = (m[area(x, y)] ?? 0) + 1), m), {});
console.log("chests", chests.length, JSON.stringify(cnt(chests)));
console.log("spawns", spawns.length, JSON.stringify(cnt(spawns)), "hazards", hz);
console.log("chest xy", chests.map(([x, y]) => Math.round(x) + "," + Math.round(y)).join(" "));
