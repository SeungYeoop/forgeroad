// 지표 높이선(h)보다 위 허공에 그려지는 뒷벽 칸 (섬 속 벽 제외: 위아래 300px 안에 모두 땅이 있으면 섬 속으로 본다)
const { ZONES, upChunk, downChunk } = await import("../src/forge/zones.js");
const { makePlan } = await import("../src/forge/natgen.js");
const z = ZONES.find((q) => q.id === (process.argv[2] || "g1_0"));
const seed = Number(process.argv[3] || 1);
const P = makePlan(z, { seed, Ft: 528, up: upChunk(z), down: downChunk(z) }, 0);
const sol = (x, y) => P.F.solid(x, y), surf = (x) => P.h[Math.max(0, Math.min(P.h.length - 1, Math.round(x / 4)))];
const by = new Map();
for (const w of P.walls ?? []) {
  let n = 0;
  for (let x = w.x0 + 4; x < w.x1; x += 8)
    for (let y = w.y0 + 4; y < w.y1; y += 8) {
      if (sol(x, y) || y < surf(x) - 600 || y > surf(x) + 40) continue;
      let up = !1, dn = !1;
      for (let d = 8; d < 300 && !up; d += 8) up = sol(x, y - d);
      for (let d = 8; d < 300 && !dn; d += 8) dn = sol(x, y + d);
      // 하늘이 트인 칸(위로 땅이 없음)인데 벽이 있으면 이상
      !up && n++;
    }
  n && by.set(`${w.m} ${w.x0},${w.y0}-${w.x1},${w.y1}`, n);
}
console.log("seed", seed, "open-sky wall cells by wall:", JSON.stringify([...by].slice(0, 20)));
