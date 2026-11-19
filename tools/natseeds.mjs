// 여러 시드를 한 번에 (고치기 없이): 통과 여부 + 갇힌 곳·못 닿은 곳 무리
//   node --import ./tools/json-hook.mjs tools/natseeds.mjs g1_0 1-20   (REP=1 이면 고치기 켜고)
import { ZONES, upChunk, downChunk } from "../src/forge/zones.js";
import { makePlan } from "../src/forge/natgen.js";
const [id = "g1_0", range = "1-20"] = process.argv.slice(2);
const z = ZONES.find((q) => q.id === id);
const seeds = range.includes("-") ? (([a, b]) => Array.from({ length: b - a + 1 }, (_, i) => a + i))(range.split("-").map(Number)) : range.split(",").map(Number);
const clusters = (pts, r = 120) => {
  const cl = [];
  for (const [x, y] of pts) {
    const c = cl.find((q) => Math.abs(q[0] - x) < r && Math.abs(q[1] - y) < r);
    c ? c[2]++ : cl.push([x, y, 1]);
  }
  return cl.sort((a, b) => b[2] - a[2]);
};
let bad = 0;
for (const seed of seeds) {
  const P = makePlan(z, { seed, Ft: 528, up: z.kind === "zone" ? upChunk(z) : -1, down: z.kind === "zone" ? downChunk(z) : -1, fe: 1, ze: 0, noRepair: !process.env.REP }, 0);
  const A = P.A, { nC, nY, NN, reach } = A;
  const tr = clusters(A.traps.map((n) => [nC[n] * 8 + 4, nY[n]]));
  const un = [];
  for (let n = 0; n < NN; n++) reach[n] || un.push([nC[n] * 8 + 4, nY[n]]);
  const uc = clusters(un, 160).filter((c) => c[2] >= 3);
  const ok = P.check.ok;
  ok || bad++;
  console.log(`seed ${seed} ${ok ? "ok " : "BAD"} miss=${P.check.miss.join("") || "-"} traps=${P.check.traps} rep=${P.check.repairs} unreached=${NN - reach.reduce((s, v) => s + v, 0)}/${NN}` + (tr.length ? ` trapAt=${tr.slice(0, 4).map((c) => c.join(",")).join(" ")}` : "") + (uc.length ? ` unrAt=${uc.slice(0, 4).map((c) => c.join(",")).join(" ")}` : ""));
}
console.log(`bad ${bad}/${seeds.length}`);
