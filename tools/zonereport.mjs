// 구역 보고서: 역할 지도 그림 + 측정표 (구조물 크기 분포 · 속 빈 큰 바위 · 빈 하늘 · 역할 자리 평지 폭 · 길찾기)
//   node --import ./tools/json-hook.mjs tools/zonereport.mjs g0_m1 [시드] [그림.png]
//   그림: 바위 회갈색 · 하늘/공기 하늘색 · 역할 칠(거점 초록·전투 빨강·보물 금·시련 보라·출구 파랑) · 구조물 흰 테두리
//         장치 선(사다리 갈색·밧줄/덩굴 초록·승강기 회색·바람 흰색·짚라인 검정·물 파랑·무너지는 판 주황·금 간 벽 빨강·회복 샘 청록·레버 노랑)
import { ZONES, upChunk, downChunk } from "../src/forge/zones.js";
import { makePlan } from "../src/forge/natgen.js";
import { biomeOf } from "../src/forge/terrprof.js";
import { savePNG } from "./png.mjs";
globalThis.__sky = 1;
const [id = "g0_m1", sd = "1", out = `shots/blue/${id}_roles.png`] = process.argv.slice(2);
const z = ZONES.find((q) => q.id === id);
const o = { seed: +sd, Ft: 528, up: upChunk(z), down: downChunk(z), fe: 1, ze: 0, biome: biomeOf(z), noRepair: 1, patterns: null };
const P = makePlan(z, o, 0), A = P.A, F = P.F;
const SC = 4, W = Math.floor(P.WP / SC), H = Math.floor(P.HP / SC);
const px = new Uint8Array(W * H * 4);
const put = (x, y, c, a = 1) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 4;
  px[i] = px[i] * (1 - a) + ((c >> 16) & 255) * a;
  px[i + 1] = px[i + 1] * (1 - a) + ((c >> 8) & 255) * a;
  px[i + 2] = px[i + 2] * (1 - a) + (c & 255) * a;
  px[i + 3] = 255;
};
const solidAt = new Uint8Array(W * H);
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    const s = F.solid(x * SC + 2, y * SC + 2);
    solidAt[y * W + x] = s ? 1 : 0;
    put(x, y, s ? 0x8c7c70 : 0xa8d0f0);
  }
// 역할 칠
const RC = { rest: 0x40d060, arena: 0xe84040, treasure: 0xf0c020, trial: 0xa060f0, vista: 0x4090ff, sanctum: 0x40d0d0 };
for (const t of P.roomTags ?? []) {
  const c = RC[t.role] ?? 0xffffff;
  for (let y = Math.floor(t.y0 / SC); y < t.y1 / SC; y++) for (let x = Math.floor(t.x0 / SC); x < t.x1 / SC; x++) put(x, y, c, solidAt[y * W + x] ? 0.18 : 0.42);
}
// 장치
const DC = { 1: 0xc89060, 2: 0xffffff, 3: 0x3070e0, 4: 0xb0e0ff, 5: 0xff70c0, 6: 0x8a5a2a, 7: 0x2a9a3a, 8: 0x2a9a3a, 10: 0xffffff, 11: 0x2050c0, 12: 0x2050c0, 13: 0xff9020, 14: 0xff2020, 15: 0x606870, 16: 0xc0c0d0, 17: 0x80e0ff, 18: 0x20e0d0, 19: 0xffff40, 20: 0xff40ff };
for (const r of P.spec ?? []) {
  if (r.t === 9 && r.ax != null) {
    const n = Math.ceil(Math.hypot(r.bx - r.ax, r.by - r.ay) / SC);
    for (let k = 0; k <= n; k++) put(Math.round((r.ax + ((r.bx - r.ax) * k) / n) / SC), Math.round((r.ay + ((r.by - r.ay) * k) / n) / SC), 0x101010);
    continue;
  }
  const c = DC[r.t];
  if (c == null) continue;
  const a = r.t === 10 || r.t === 20 ? 0.35 : r.t === 3 || r.t === 11 || r.t === 12 ? 0.55 : 0.9;
  for (let y = Math.floor(r.y0 / SC); y < r.y1 / SC; y++) for (let x = Math.floor(r.x0 / SC); x < r.x1 / SC; x++) put(x, y, c, a);
}
// 구조물 테두리
for (const s of P.structs ?? []) {
  const x0 = Math.floor(s.x0 / SC), x1 = Math.floor(s.x1 / SC), y0 = Math.floor(s.y0 / SC), y1 = Math.floor(s.y1 / SC);
  for (let x = x0; x <= x1; x++) (put(x, y0, 0xffffff, 0.8), put(x, y1, 0xffffff, 0.8));
  for (let y = y0; y <= y1; y++) (put(x0, y, 0xffffff, 0.8), put(x1, y, 0xffffff, 0.8));
}
// ▲ · 시작/끝
P.peak && [[0, 0], [1, 0], [0, 1], [1, 1], [-1, 0], [0, -1]].forEach(([dx, dy]) => put(Math.round(P.peak.x / SC) + dx, Math.round(P.peak.y / SC) + dy, 0xffff00));
savePNG(out, W, H, px);

// ── 측정표 ──
const SW = 640, SH = 360; // 화면 한 칸
console.log(`\n${z.reg?.name ?? id} (${id}) 시드 ${sd} — 길찾기: ${P.check.ok ? "통과" : "실패"} · 못 닿은 출구 ${P.check.miss.join(",") || "없음"} · 갇힘 ${P.check.traps}`);
console.log("\n구조물 (크기 = 가로 × 세로 px, 화면 = 640×360)");
const cls = (w, h) => (Math.max(w, h) >= 3000 ? "거대" : Math.max(w, h) >= 1500 ? "대형" : Math.max(w, h) >= 600 ? "중형" : "소형");
const cnt = { 거대: 0, 대형: 0, 중형: 0, 소형: 0 };
for (const s of P.structs ?? []) {
  const w = s.x1 - s.x0, h = s.y1 - s.y0, k = cls(w, h);
  cnt[k]++;
  let r = 0, t = 0;
  for (let n = 0; n < A.NN; n++) {
    const x = A.nC[n] * 8 + 4, y = A.nY[n];
    if (x >= s.x0 && x < s.x1 && y >= s.y0 && y <= s.y1) (t++, A.reach[n] && r++);
  }
  console.log(`  ${k}  ${s.name.padEnd(14)} ${String(w).padStart(5)} × ${String(h).padStart(4)}  (${(w / SW).toFixed(1)}×${(h / SH).toFixed(1)}화면)  역할: ${s.role}  닿음 ${t ? Math.round((100 * r) / t) : "-"}%`);
}
console.log(`  크기 분포: 거대 ${cnt.거대} · 대형 ${cnt.대형} · 중형 ${cnt.중형} · 소형 ${cnt.소형}`);
// 속 빈 큰 바위 · 빈 하늘: 거리 변환(칸 = 4px)으로 가장 큰 안쪽 정사각형
const dist = (want) => {
  const D = new Uint16Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (solidAt[i] !== want) continue;
      D[i] = x && y ? 1 + Math.min(D[i - 1], D[i - W], D[i - W - 1]) : 1;
    }
  const best = [];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const d = D[y * W + x];
      if (d < 20) continue;
      if (best.some((b) => Math.abs(b.x - x) < b.d && Math.abs(b.y - y) < b.d)) {
        const b = best.find((b) => Math.abs(b.x - x) < b.d && Math.abs(b.y - y) < b.d);
        d > b.d && Object.assign(b, { x, y, d });
        continue;
      }
      best.push({ x, y, d });
    }
  return best.sort((a, b) => b.d - a.d).slice(0, 4).map((b) => ({ x: (b.x - b.d / 2) * SC, y: (b.y - b.d / 2) * SC, s: b.d * SC }));
};
// 맨 아래 받침 바닥(구역 바닥)은 빼고 잰다
const yFloor = (P.skyFloorY ?? P.HP) / SC;
for (let y = Math.floor(yFloor) - 2; y < H; y++) for (let x = 0; x < W; x++) solidAt[y * W + x] = 2;
console.log("\n속이 빈 가장 큰 바위 덩어리 (안에 아무것도 없는 정사각형 한 변):");
for (const b of dist(1)) console.log(`  ${b.s}px (${(b.s / SW).toFixed(2)}화면 폭) — 가운데 (${Math.round(b.x)}, ${Math.round(b.y)})px · 칸 (${Math.round(b.x / 8)}, ${Math.round(b.y / 8)})`);
console.log("가장 큰 빈 하늘 (아무 구조도 없는 정사각형 한 변):");
for (const b of dist(0)) console.log(`  ${b.s}px (${(b.s / SW).toFixed(2)}화면 폭) — 가운데 (${Math.round(b.x)}, ${Math.round(b.y)})px · 칸 (${Math.round(b.x / 8)}, ${Math.round(b.y / 8)})`);
// 밀도: 바위에서 80px(10칸) 넘게 떨어진 빈 하늘 비율 — 구역 9칸(3×3)별 (맨 위 줄 240px·맨 아래 받침은 뺀다)
{
  const R = 20, far = new Uint8Array(W * H);
  const rowOK = (y) => y * SC >= 240 && y * SC < (P.skyFloorY ?? P.HP) - 16;
  // 가로·세로 두 번 훑어 체비셰프 거리 R 안에 바위가 있는지
  const nearX = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    let last = -1e9;
    for (let x = 0; x < W; x++) (solidAt[y * W + x] === 1 && (last = x), x - last <= R && (nearX[y * W + x] = 1));
    last = 1e9;
    for (let x = W - 1; x >= 0; x--) (solidAt[y * W + x] === 1 && (last = x), last - x <= R && (nearX[y * W + x] = 1));
  }
  for (let x = 0; x < W; x++) {
    let last = -1e9;
    for (let y = 0; y < H; y++) (nearX[y * W + x] && (last = y), y - last > R && (far[y * W + x] = 1));
    last = 1e9;
    for (let y = H - 1; y >= 0; y--) (nearX[y * W + x] && (last = y), last - y <= R && (far[y * W + x] = 0));
  }
  const XS = [0, 340, 690, 1024].map((c) => (c * 8) / SC), YS = [0, 330, 700, 1000].map((c) => (c * 8) / SC);
  let tf = 0, tn = 0;
  const row = [];
  for (let j = 0; j < 3; j++) {
    const cols = [];
    for (let i = 0; i < 3; i++) {
      let f = 0, n = 0;
      for (let y = Math.floor(YS[j]); y < YS[j + 1]; y++) {
        if (!rowOK(y)) continue;
        for (let x = Math.floor(XS[i]); x < XS[i + 1]; x++) (n++, far[y * W + x] && f++);
      }
      (tf += f), (tn += n);
      cols.push(`${"가나다"[i]}${j + 1} ${n ? Math.round((100 * f) / n) : 0}%`.padEnd(9));
    }
    row.push(cols.join(" · "));
  }
  console.log(`
빈 하늘 비율 (바위에서 80px 넘게 떨어진 곳, 낮을수록 빽빽함) 전체 ${Math.round((100 * tf) / tn)}%`);
  for (const r of row) console.log("  " + r);
}
// 역할 자리 평지 폭: 태그 안에서 가장 긴 평평한 바닥 (마디 높이 차 ≤ 4px)
console.log("\n역할 자리 평지 폭 (가장 긴 평평한 바닥):");
const byRole = {};
for (const t of P.roomTags ?? []) {
  const ns = [];
  for (let n = 0; n < A.NN; n++) {
    const x = A.nC[n] * 8 + 4, y = A.nY[n];
    x >= t.x0 && x < t.x1 && y >= t.y0 && y <= t.y1 && ns.push([x, y]);
  }
  ns.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  let best = 0;
  for (let i = 0; i < ns.length; ) {
    let j = i;
    while (j + 1 < ns.length && Math.abs(ns[j + 1][1] - ns[i][1]) <= 4 && ns[j + 1][0] - ns[j][0] <= 16) j++;
    best = Math.max(best, ns[j][0] - ns[i][0] + 16);
    i = j + 1;
  }
  (byRole[t.role] ??= []).push(best);
}
for (const [r, a] of Object.entries(byRole)) console.log(`  ${r.padEnd(9)} ${a.length}곳 · 평지 폭 ${a.sort((p, q) => q - p).join(", ")}px`);
console.log(`\n그림: ${out}`);
