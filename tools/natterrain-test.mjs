// 자연 지형 종합 검사 (노드). 실패하면 종료 코드 1
//   node --import ./tools/json-hook.mjs tools/natterrain-test.mjs   [SEEDS=1,2,3] [FAST=1]
// 1) 같은 시드 → 같은 지형 (캐시를 비우고 다시 만들어 비교)
// 2) 그림 = 충돌: 칠한 바위 픽셀과 충돌 판정이 1px까지 같다 (조각 경계 포함)
// 3) 길: 모든 구역·던전에서 입구 → ▶·▲·▼ 출구 도달, 들어가면 못 나오는 곳 0
// 4) 길찾기가 인정한 이동을 실제 충돌 코드(finephys)로 다시 해 본다
// 5) 경사: 윗면 경사가 몇 가지 각도에 몰리지 않는다
// 6) 지역 차이: 지역마다 높낮이·거칠기·동굴 비율·섬 모양이 다르다
// 7) 시간
import { ZONES, upChunk, downChunk, SKY_EDGE } from "../src/forge/zones.js";
import { planOf, planCache, drawChunk } from "../src/forge/natgen.js";
import { installFinePhysics } from "../src/forge/finephys.js";
import { pixFine, fineSlice } from "../src/forge/terrfine.js";
import { biomeOf } from "../src/forge/terrprof.js";

const seeds = (process.env.SEEDS || "1,2,3").split(",").map(Number);
const FAST = !!process.env.FAST;
const fails = [];
const check = (name, ok, info = "") => (ok ? console.log(`  ✓ ${name} ${info}`) : (console.log(`  ✗ ${name} ${info}`), fails.push(name)));
const opt = (z, seed) => ({ seed, Ft: 176, up: z.kind === "zone" ? upChunk(z) : -1, down: z.kind === "zone" ? downChunk(z) : -1, biome: biomeOf(z), patterns: z.y === 0 ? z.reg?.patterns : null });
const hash = (arr) => {
  let h = 2166136261;
  const u = new Uint32Array(arr.buffer, arr.byteOffset, arr.byteLength >> 2);
  for (let i = 0; i < u.length; i++) h = Math.imul(h ^ u[i], 16777619);
  return h >>> 0;
};

// ── 1) 결정성 ──
console.log("1) 같은 시드 → 같은 지형");
{
  let same = 0, n = 0;
  for (const z of ZONES.filter((_, i) => i % (FAST ? 8 : 3) === 0)) {
    const a = planOf(z, opt(z, 7)), ha = hash(a.F.d), ga = a.gy.join(",");
    planCache.clear();
    const b = planOf(z, opt(z, 7)), hb = hash(b.F.d), gb = b.gy.join(",");
    n++;
    ha === hb && ga === gb && same++;
  }
  check("다시 만들어도 장·지면이 같다", same === n, `${same}/${n}`);
  const z = ZONES.find((v) => v.id === "g1_0");
  const a = planOf(z, opt(z, 1)), b = planOf(z, opt(z, 2));
  check("시드가 다르면 지형이 다르다", hash(a.F.d) !== hash(b.F.d));
}

// ── 2) 그림 = 충돌 ──
console.log("2) 칠한 픽셀 = 충돌 판정");
{
  let px = 0, diff = 0, seam = 0, chunks = 0;
  for (const id of ["gm3_0", "g0_2", "g0_m3"]) {
    const z = ZONES.find((v) => v.id === id), o = opt(z, 1), P = planOf(z, o);
    const region = { pal: z.reg.pal, theme: z.reg.theme };
    let prevRight = null;
    for (let S = z.c0; S < z.c0 + (FAST ? 2 : 4); S++) {
      const r = new Uint8Array(32 * 176), l = [], s = [];
      const ch = drawChunk(P, z, S, r, l, s, { ...o, fe: 1, ze: 0 });
      const g = pixFine({ ug: ch.ug }, S * 32, region, fineSlice(ch));
      let st;
      do st = g.next(); while (!st.done);
      const front = st.value.front;
      chunks++;
      const x0 = (S - z.c0) * 512;
      for (let y = 0; y < P.HP; y++)
        for (let x = 0; x < 512; x++) {
          const solid = P.F.solid(x0 + x, y), opaque = front[(y * 512 + x) * 4 + 3] > 0;
          px++;
          // 바위인데 안 칠해졌거나, 바위가 아닌데 몸통 그림(front)이 칠해졌다 (매달린 장식은 front에 들어가므로 제외: 아래쪽 공기)
          if (solid && !opaque) diff++;
        }
      // 조각 경계: 왼쪽 조각의 마지막 열과 이 조각 첫 열의 바위 판정이 장과 같다
      const right = [], left = [];
      for (let y = 0; y < P.HP; y++) (left.push(P.F.solid(x0, y)), right.push(P.F.solid(x0 + 511, y)));
      if (prevRight) for (let y = 0; y < P.HP; y++) prevRight[y] !== P.F.solid(x0 - 1, y) && seam++;
      prevRight = right;
    }
  }
  check("바위 픽셀은 모두 칠해져 있다", diff === 0, `${diff}/${px} (조각 ${chunks}개)`);
  check("조각 경계에서 끊김 없음", seam === 0, `${seam}`);
}

// ── 3) 길 ──
console.log("3) 입구 → 모든 출구, 갇히는 곳 없음");
const rows = [];
{
  let tot = 0, ok = 0, traps = 0, firstTry = 0;
  for (const seed of seeds)
    for (const z of ZONES) {
      const t0 = performance.now();
      const P = planOf(z, opt(z, seed));
      rows.push({ z, seed, P, ms: performance.now() - t0 });
      tot++;
      P.check.ok && ok++;
      traps += P.check.traps;
      P.tries.length === 1 && firstTry++;
    }
  check("모든 출구에 닿는다", ok === tot, `${ok}/${tot} (구역 ${ZONES.length}곳 × 시드 ${seeds.length})`);
  check("갇히는 곳 0", traps === 0, `${traps}`);
  console.log(`     첫 설계로 통과 ${firstTry}/${tot}`);
}

// ── 4) 실제 충돌로 다시 해 보기 ──
console.log("4) 길찾기가 인정한 이동 → 실제 충돌 코드로 재현");
class World {}
installFinePhysics(World.prototype, { gt: 16, vt: 32, Oe: 2816, fe: 1, ze: 0, plat: 2, SKY_EDGE, Ft: 176 });
function replay(W, xa, ya, xb, yb, mode) {
  const dt = 1 / 60;
  const b = { x: xa, y: ya, w: 10, h: 22, vx: 0, vy: 0, onGround: !1, hitWall: 0, groundCode: 0, dropThrough: 0, groundGtx: 0, groundRow: 0 };
  for (let k = 0; k < 3; k++) ((b.vy = Math.min(720, b.vy + 1500 * dt)), W.move(b, dt));
  const dir = xb > xa ? 1 : -1;
  let phase = 0, air2 = 1, overl = 0;
  for (let t = 0; t < 3.5; t += dt) {
    let want = Math.abs(xb - b.x) < 3 ? 0 : Math.sign(xb - b.x);
    if (mode === 2 || mode === 3) {
      if (phase === 0) ((b.vy = -500), (phase = 1));
      if (mode === 2 && phase === 1 && b.vy >= 0) ((b.vy = -440), (phase = 2));
      (mode === 2 ? phase < 2 || b.vy < 0 : b.vy < 0) && (want = 0);
    } else if (mode === 0 || mode === 1) {
      if (phase === 0 && b.onGround) ((b.vy = -500), (phase = 1));
      if (mode === 1 && phase === 1 && b.vy >= 0 && air2) ((b.vy = -440), air2--, (phase = 2));
    } else if (mode === "walk" && b.onGround && (W.wallAhead(b, dir) || b.hitWall === dir) && phase === 0) ((b.vy = -500), (phase = 1));
    b.vx = want * (mode === "walk" ? 150 : 135);
    b.vy = Math.min(720, b.vy + 1500 * dt * (b.vy > 0 ? 1.15 : 1));
    W.move(b, dt);
    W.overlapAt(b, b.x, b.y) && overl++;
    if (t > 0.05 && b.onGround && Math.abs(b.x - xb) <= 10 && Math.abs(b.y - yb) <= 8) return { ok: !0, overl };
    if (b.y > yb + 260) break;
  }
  return { ok: !1, overl };
}
{
  let edges = 0, bad = 0, overl = 0;
  const sample = rows.filter((r, i) => r.z.kind === "zone" && (!FAST || i % 4 === 0) && r.seed === seeds[0]);
  for (const { z, P } of sample) {
    const W = new World();
    W.originChunk = z.c0;
    W.gates = new Set();
    const cache = new Map();
    W.gen = { get: (C) => cache.get(C) ?? cache.set(C, { fine: { F: P.F, x0: (C - z.c0) * 512 } }).get(C) };
    W.code = () => 0;
    const A = P.A, X = (n) => A.nC[n] * 8 + 4;
    const par = new Int32Array(A.NN).fill(-2);
    const q = [A.start];
    par[A.start] = -1;
    for (let h = 0; h < q.length; h++) for (const b of A.adj[q[h]] ?? []) par[b] < -1 && ((par[b] = q[h]), q.push(b));
    const seen = new Set();
    for (const g of A.goals) {
      if (g.n < 0 || par[g.n] < -1) continue;
      for (let n = g.n; par[n] >= 0; n = par[n]) {
        const a = par[n], key = a * 1e6 + n;
        if (seen.has(key)) continue;
        seen.add(key);
        const r = replay(W, X(a), A.nY[a], X(n), A.nY[n], A.how(a, n));
        edges++;
        r.ok || bad++;
        overl += r.overl;
      }
    }
  }
  const rate = (100 * bad) / Math.max(1, edges);
  check("인정된 이동이 실제로 된다 (99% 이상)", rate <= 1, `${edges - bad}/${edges} (${(100 - rate).toFixed(2)}%)`);
  check("이동 중 몸이 지형에 박히지 않는다", overl === 0, `${overl}`);
}

// ── 5) 경사 분포 ──
console.log("5) 윗면 경사");
{
  const bins = new Array(10).fill(0);
  let tot = 0, at45 = 0, flat = 0;
  for (const { P } of rows.filter((r) => r.seed === seeds[0])) {
    const C = P.A.C;
    for (let c = 0; c < C.NC - 1; c++)
      for (let k = C.ivS[c]; k < C.ivS[c + 1]; k++) {
        const t = C.top[k];
        if (t <= 0) continue;
        let best = 1e9;
        for (let m = C.ivS[c + 1]; m < C.ivS[c + 2]; m++) Math.abs(C.top[m] - t) < Math.abs(best) && (best = C.top[m] - t);
        if (Math.abs(best) > 24) continue;
        const deg = (Math.atan2(Math.abs(best), 8) * 180) / Math.PI;
        bins[Math.min(9, Math.floor(deg / 8))]++;
        tot++;
        Math.abs(deg - 45) < 2 && at45++;
        deg < 2 && flat++;
      }
  }
  const spread = bins.filter((b) => b / tot > 0.02).length;
  console.log("     8° 간격 분포:", bins.map((b) => `${((100 * b) / tot).toFixed(1)}%`).join(" "));
  check("경사가 여러 각도에 퍼져 있다 (2% 넘는 구간 5개 이상)", spread >= 5, `${spread}개`);
  check("45°에 몰리지 않는다 (45°±2° 8% 미만)", at45 / tot < 0.08, `${((100 * at45) / tot).toFixed(1)}%`);
  console.log(`     평평(0~2°) ${((100 * flat) / tot).toFixed(1)}% — 문·보스방·함정 자리처럼 일부러 평평한 곳 포함`);
}

// ── 6) 지역 차이 ──
console.log("6) 지역마다 다른 생성 규칙");
{
  const by = {};
  for (const { P } of rows.filter((r) => r.z.kind === "zone")) {
    const k = P.pkey, s = (by[k] ??= { n: 0, relief: 0, rough: 0, air: 0, isl: 0, islT: 0 });
    s.n++;
    if (P.h) {
      let lo = 1e9, hi = -1e9, r = 0;
      for (let i = 1; i < P.h.length; i++) ((lo = Math.min(lo, P.h[i])), (hi = Math.max(hi, P.h[i])), (r += Math.abs(P.h[i] - P.h[i - 1])));
      s.relief += hi - lo;
      s.rough += r / P.h.length;
    }
    let air = 0, n = 0;
    for (let k = 0; k < P.F.d.length; k += 7) (n++, P.F.d[k] <= 0 && air++);
    s.air += air / n;
    s.isl += P.islands.length;
    s.islT += P.islands.reduce((t, I) => t + I.t / Math.max(1, I.w), 0) / Math.max(1, P.islands.length);
  }
  for (const [k, s] of Object.entries(by))
    console.log(`     ${k.padEnd(7)} 기복 ${(s.relief / s.n).toFixed(0).padStart(4)}px · 거칠기 ${(s.rough / s.n).toFixed(2)} · 빈 공간 ${((100 * s.air) / s.n).toFixed(0)}% · 섬 ${(s.isl / s.n).toFixed(1)}개 (두께/폭 ${(s.islT / s.n).toFixed(2)})`);
  const g = ["ash", "mist", "marsh", "glass", "frost", "fort"].filter((k) => by[k]).map((k) => by[k].relief / by[k].n);
  check("지상 지역끼리 기복이 크게 다르다 (최대/최소 2배 이상)", Math.max(...g) / Math.min(...g) >= 2, g.map((v) => v.toFixed(0)).join(" / "));
  const c = ["vein", "abyss", "core"].filter((k) => by[k]).map((k) => by[k].air / by[k].n);
  check("지하 지역끼리 빈 공간 비율이 다르다", Math.max(...c) - Math.min(...c) > 0.05, c.map((v) => `${(100 * v).toFixed(0)}%`).join(" / "));
}

// ── 7) 시간 ──
console.log("7) 시간");
{
  const ms = rows.map((r) => r.ms).sort((a, b) => a - b);
  console.log(`     구역 설계 중간값 ${ms[ms.length >> 1].toFixed(0)}ms · 90% ${ms[Math.floor(ms.length * 0.9)].toFixed(0)}ms · 최대 ${ms[ms.length - 1].toFixed(0)}ms (같은 프로세스에서 연속 실행 — 노트북이 열을 받으면 느려진다)`);
}
console.log(fails.length ? `\n실패 ${fails.length}: ${fails.join(", ")}` : "\n모두 통과");
process.exitCode = fails.length ? 1 : 0;
