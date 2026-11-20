// 처마(지표 높이선 아래인데 옆으로 하늘과 트인 공기) 찾기: 여기 지하 뒷벽이 칠해지면 하늘에 네모난 벽이 생긴다
const { ZONES, upChunk, downChunk } = await import("../src/forge/zones.js");
const { makePlan } = await import("../src/forge/natgen.js");
const z = ZONES.find((q) => q.id === (process.argv[2] || "g1_0"));
const P = makePlan(z, { seed: Number(process.argv[3] || 1), Ft: 528, up: upChunk(z), down: downChunk(z) }, 0);
const sol = (x, y) => P.F.solid(x, y), H = (x) => P.h[Math.max(0, Math.min(P.h.length - 1, Math.round(x / 4)))];
const hits = [];
for (let x = 8; x < P.WP - 8; x += 16) {
  const h = H(x);
  for (let y = h + 8; y < h + 960; y += 8) {
    if (sol(x, y)) continue;
    // 옆으로 400px 안에서 같은 높이가 하늘(지표선 위)인 곳까지 공기로 이어지는가
    for (const d of [-1, 1]) {
      let ok = !1;
      for (let k = 8; k <= 400; k += 8) {
        const xx = x + d * k;
        if (sol(xx, y)) break;
        if (y < H(xx) - 4) { ok = !0; break; }
      }
      if (ok) { hits.push([x, y]); break; }
    }
  }
}
// 묶어서 보여 주기
const cols = new Map();
for (const [x, y] of hits) cols.set(x, [...(cols.get(x) ?? []), y]);
let run = null;
const out = [];
for (const [x, ys] of [...cols].sort((a, b) => a[0] - b[0])) {
  const y0 = Math.min(...ys), y1 = Math.max(...ys);
  if (run && x - run.x1 <= 16) Object.assign(run, { x1: x, y0: Math.min(run.y0, y0), y1: Math.max(run.y1, y1), n: run.n + ys.length });
  else (run = { x0: x, x1: x, y0, y1, n: ys.length }), out.push(run);
}
console.log("overhang air cells", hits.length);
for (const r of out) r.n > 6 && console.log(JSON.stringify(r));
