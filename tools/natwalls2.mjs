// 여러 시드에서 하늘에 매달린 뒷벽(아래 600px가 비고 위에 섬이 있는 벽 칸)만 찾는다
const { ZONES, upChunk, downChunk } = await import("../src/forge/zones.js");
const { makePlan } = await import("../src/forge/natgen.js");
const z = ZONES.find((q) => q.id === (process.argv[2] || "g1_0"));
const [a, b] = (process.argv[3] || "1-8").split("-").map(Number);
for (let seed = a; seed <= b; seed++) {
  const P = makePlan(z, { seed, Ft: 528, up: upChunk(z), down: downChunk(z) }, 0);
  const sol = (x, y) => P.F.solid(x, y), surf = (x) => P.h[Math.max(0, Math.min(P.h.length - 1, Math.round(x / 4)))];
  const hits = [];
  for (const w of P.walls ?? []) {
    if (w.y1 > surf((w.x0 + w.x1) / 2) - 40) continue;
    for (let x = w.x0 + 4; x < w.x1; x += 8)
      for (let y = w.y0 + 4; y < w.y1; y += 8) {
        if (sol(x, y)) continue;
        let below = !1;
        for (let d = 8; d < 700 && !below; d += 8) below = sol(x, y + d);
        if (!below) hits.push([x, y, w.m]);
      }
  }
  const box = hits.length ? [Math.min(...hits.map((h) => h[0])), Math.min(...hits.map((h) => h[1])), Math.max(...hits.map((h) => h[0])), Math.max(...hits.map((h) => h[1]))] : null;
  console.log("seed", seed, "hanging cells", hits.length, box ? JSON.stringify(box) : "", hits.slice(0, 3).map((h) => h.join(",")).join(" "));
}
