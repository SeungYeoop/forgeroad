// 층별 무리·상자 배치 확인 (그래스메어처럼 z.reg.layers가 있는 구역)
//   node --import ./tools/json-hook.mjs tools/natenc.mjs g1_0 [세계 시드] [탐험 시드]
import { ZONES, upChunk, downChunk } from "../src/forge/zones.js";
import { planOf, drawChunk, layerAt } from "../src/forge/natgen.js";
const id = process.argv[2] ?? "g1_0", seed = +(process.argv[3] ?? 1), rs = +(process.argv[4] ?? 7);
const z = ZONES.find((q) => q.id === id);
const o = { seed, Ft: 528, up: z.kind === "zone" ? upChunk(z) : -1, down: z.kind === "zone" ? downChunk(z) : -1, fe: 1, ze: 0, biome: "drip", runSeed: rs };
o.patterns = z.y === 0 ? z.reg?.patterns : null;
const P = planOf(z, o);
const by = {}, ch = {}, camps = new Map();
let bad = 0;
for (let S = z.c0; S < z.c1; S++) {
  const r = new Uint8Array(32 * 528), l = new Array(32), s = new Array(32);
  const out = drawChunk(P, z, S, r, l, s, { ...o, arena: false });
  const bx = (S - z.c0) * 512;
  for (const c of out.spawns) {
    const x = bx + c.x * 16 + 8;
    (by[c.layer] ??= {})[c.enemy] = (by[c.layer][c.enemy] ?? 0) + 1;
    if (layerAt(P, x, c.py) !== c.layer || P.F.solid(x, c.py - 8) || !P.F.solid(x, c.py + 3)) (bad++, process.env.V && console.log("bad", c.layer, c.enemy, x, c.py, layerAt(P, x, c.py), P.F.solid(x, c.py - 8), P.F.solid(x, c.py + 3)));
    camps.set(c.camp, (camps.get(c.camp) ?? 0) + 1);
  }
  for (const c of out.chests) {
    const lay = layerAt(P, bx + c.x * 16 + 8, c.py);
    (ch[lay] ??= []).push(`${bx + c.x * 16}:${c.py}:t${c.tier}`);
  }
}
const sizes = {};
for (const n of camps.values()) sizes[n] = (sizes[n] ?? 0) + 1;
console.log(id, "seed", seed, "run", rs, "WP", P.WP);
console.log("monsters", JSON.stringify(by));
console.log("camp sizes", JSON.stringify(sizes), "camps", camps.size, "bad", bad);
for (const k in ch) console.log("chests", k, ch[k].length, ch[k].join(" "));
