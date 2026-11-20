// 뒷벽 검사: 허공(아래가 트인 곳)에 걸린 뒷벽 · 구름/하늘 위 장식 · 지표 위 동굴 소품을 찾는다
//   node --import ./tools/json-hook.mjs tools/natwalls.mjs g1_0 [시드]
const { ZONES, upChunk, downChunk } = await import("../src/forge/zones.js");
const { makePlan } = await import("../src/forge/natgen.js");
const z = ZONES.find((q) => q.id === (process.argv[2] || "g1_0"));
const P = makePlan(z, { seed: Number(process.argv[3] ?? 1), Ft: 528, up: upChunk(z), down: downChunk(z) }, 0);
const F = P.F, sol = (x, y) => F.solid(x, y);
// 1) 뒷벽: 칸마다 아래로 300px 안에 땅이 없고 위로 300px 안에 땅이 있으면 '섬 밑에 매달린 벽'
const bad = [];
for (const w of P.walls ?? []) {
  let n = 0, tot = 0, ex = null;
  for (let x = w.x0 + 4; x < w.x1; x += 8)
    for (let y = w.y0 + 4; y < w.y1; y += 8) {
      tot++;
      if (sol(x, y)) continue;
      let below = !1, above = !1;
      for (let d = 8; d < 300 && !below; d += 8) below = sol(x, y + d);
      for (let d = 8; d < 300 && !above; d += 8) above = sol(x, y - d);
      if (!below) (n++, (ex ??= [x, y]));
    }
  n > 0 && bad.push({ m: w.m, x0: w.x0, y0: w.y0, x1: w.x1, y1: w.y1, hanging: n, of: tot, ex });
}
console.log("walls", (P.walls ?? []).length, "hanging", bad.length);
for (const b of bad.slice(0, 30)) console.log(JSON.stringify(b));
// 2) 소품·장식 종류별 개수와 자리 (지표=지표 높이 근처)
const surf = (x) => (P.h ? P.h[Math.max(0, Math.min(P.h.length - 1, Math.round(x / 4)))] : 1e9);
const cnt = {};
for (const p of P.props ?? []) {
  const where = Math.abs(p.y - surf(p.x)) < 12 ? "surface" : p.y < surf(p.x) - 12 ? "sky" : "under";
  const k = p.k + "@" + where;
  cnt[k] = (cnt[k] ?? 0) + 1;
}
console.log(JSON.stringify(cnt));
console.log("deco", (P.deco ?? P.decos ?? []).length, Object.keys(P).join(","));
// 하늘 쪽만 다시
const skyBad = bad.filter((b) => b.y1 < surf((b.x0 + b.x1) / 2) - 40);
console.log("SKY hanging walls", skyBad.length);
for (const b of skyBad) console.log(JSON.stringify(b));
const mc = {};
for (const m of P.mats ?? []) mc[m.m] = (mc[m.m] ?? 0) + 1;
console.log("mats", JSON.stringify(mc));
console.log("islands", (P.islands ?? []).length, JSON.stringify((P.islands ?? []).slice(0, 3)).slice(0, 400));
