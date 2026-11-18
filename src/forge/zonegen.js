// 구역 지형 — 구역 하나(8조각 = 256칸 × 116줄)를 통째로 설계한 뒤, 조각마다 그 부분을 그린다.
// 테라리아·스컬처럼 큼직하고 자연스럽게: 나무 발판 없이 언덕·절벽·떠 있는 큰 섬·구불구불한 땅굴·동굴방.
//
// 점프: 1단 약 5칸, 2단까지 약 8칸 위로. 길은 "한 번에 위로 4~5칸, 옆으로 2~4칸" 안에서만 잇는다.
// 한 줄씩 오르내리는 곳은 경사 타일로 다듬어 걸어서 오르내린다.
//
// 지상: 큰 언덕(구역 끝·보스 방 근처는 평지) + 언덕 옆 작은 굴. 땅속엔 깊은 땅굴과 동굴방, 땅에서 비스듬히 내려가는 동굴 입구.
//       하늘엔 땅에서 꼭대기(▲ 문)까지 이어지는 떠 있는 섬들 + 흩어진 섬.
// 하늘: 70줄 바닥은 큰 섬들(사이 틈은 뛰어넘는다), 위로 큰 섬들이 꼭대기까지 이어진다.
// 동굴: 바위 속에 위·가운데(입구, 70줄)·아래 땅굴 + 중간 굴, 층 사이는 비스듬한 경사 굴, 큰 동굴방.
const FLOOR = 70;
const UG_TOP = 76;

const hh = (a, b) => {
  let x = (a * 374761393 + b * 668265263) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
};
const vnoise = (x, sc, seed) => {
  const i = Math.floor(x / sc), f = x / sc - i, u = f * f * (3 - 2 * f);
  return hh(i, seed) * (1 - u) + hh(i + 1, seed) * u;
};
const strHash = (s) => {
  let h = 2166136261 >>> 0;
  for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return h;
};
const rngOf = (seed, a, k) => {
  let s = (Math.floor(hh(((seed ^ a) + k * 101) | 0, (a ^ 0x5bd1) | 0) * 4294967296) >>> 0) || 1;
  return () => ((s = (Math.imul(s ^ (s >>> 15), 2246822519) + 0x6d2b79f5) >>> 0), (s >>> 8) / 16777216);
};

// ── 구역 설계 ────────────────────────────────────────
const PLANS = new Map();
// z: 구역 {id, kind, x, y, c0, c1, boss}, o: {seed, up, down, Ft}
export function planOf(z, o) {
  const key = `${z.id}:${o.seed}`;
  let P = PLANS.get(key);
  if (!P) {
    PLANS.size > 40 && PLANS.clear();
    // 입구에서 모든 출구에 닿을 때까지 다시 설계 (최대 20번, 실패하면 가장 많이 닿는 설계)
    let best = null;
    for (let a = 0; a < 20; a++) {
      const Q = makePlan(z, o, a);
      const v = validate(Q, z, o);
      Q.check = v;
      if (!best || v.score > best.check.score) best = Q;
      if (v.ok) break;
    }
    P = best;
    PLANS.set(key, P);
  }
  return P;
}
// 구역 전체를 그려 길찾기 (점프: 위 7칸까지·옆 4~5칸, 머리 공간 확인)
function validate(P, z, o) {
  const { Ft } = o, W = P.W, G = new Uint8Array(W * Ft);
  const r = new Uint8Array(32 * Ft), l = new Array(32), s = new Array(32);
  for (let S = z.c0; S < z.c1; S++) {
    drawChunk(P, z, S, r, l, s, { ...o, fe: 1, ze: 0, arena: z.kind === "zone" && z.boss && S >= z.c1 - 2, quiet: 1 });
    const b = (S - z.c0) * 32;
    for (let y = 0; y < Ft; y++) for (let x = 0; x < 32; x++) G[y * W + b + x] = r[y * 32 + x];
  }
  const code = (x, y) => (x < 0 || x >= W || y < 0 || y >= Ft ? 1 : G[y * W + x]);
  const air = (x, y) => code(x, y) === 0;
  const stand = (x, y) => {
    const c = code(x, y);
    return c !== 0 && air(x, y - 1) && (c === 4 || c === 5 || air(x, y - 2));
  };
  const seen = new Uint8Array(W * Ft), q = [];
  const push = (x, y) => x >= 0 && x < W && y >= 0 && y < Ft && !seen[y * W + x] && ((seen[y * W + x] = 1), q.push(x, y));
  let sy = FLOOR;
  while (sy > 0 && !stand(3, sy)) sy--;
  push(3, sy);
  while (q.length) {
    const y = q.pop(), x = q.pop();
    for (const dx of [-1, 1]) {
      const nx = x + dx;
      for (const dy of [0, -1]) stand(nx, y + dy) && push(nx, y + dy);
      if (air(nx, y) && air(nx, y - 1)) for (let yy = y + 1; yy < Ft; yy++) if (!air(nx, yy)) { stand(nx, yy) && push(nx, yy); break; }
    }
    for (let dy = -7; dy <= 8; dy++) {
      const ny = y + dy;
      if (dy < 0) {
        let ok = !0;
        for (let k = 1; k <= -dy + 1 && ok; k++) air(x, y - 1 - k) || (ok = !1);
        if (!ok) continue;
      }
      const DX = dy < -4 ? 4 : 5;
      for (let dx = -DX; dx <= DX; dx++) {
        if (!dx || !stand(x + dx, ny)) continue;
        const top = Math.min(y, ny) - 2;
        let ok = !0;
        for (let k = Math.min(x, x + dx); k <= Math.max(x, x + dx) && ok; k++) air(k, top) || (ok = !1);
        if (ok && dy > 0) for (let yy = top; yy < ny && ok; yy++) air(x + dx, yy) || (ok = !1);
        ok && push(x + dx, ny);
      }
    }
  }
  const hit = (p) => !p || [-2, -1, 0, 1, 2].some((d) => seen[p.row * W + p.i + d]);
  let ry = FLOOR;
  while (ry > 0 && !stand(W - 4, ry)) ry--;
  const goals = [{ i: W - 4, row: ry }, P.peak, P.deep];
  const n = goals.filter((g) => g && hit(g)).length, need = goals.filter(Boolean).length;
  return { ok: n === need, score: n };
}
function makePlan(z, o, attempt = 0) {
  const { seed, Ft } = o;
  const W = (z.c1 - z.c0) * 32, X0 = z.c0 * 32;
  const zs = strHash(z.id);
  const R = rngOf(seed, zs, 1 + attempt * 7);
  const ri = (a, b) => a + Math.floor(R() * (b - a + 1));
  const kind = z.y < 0 ? "sky" : z.y > 0 ? "cave" : "ground";
  const isZone = z.kind === "zone";
  // 평지로 둘 곳: 구역 양 끝, 보스 방(뒤 2조각)
  const arenaFrom = isZone && z.boss ? W - 64 : W;
  const edgeDist = (i) => Math.min(i, W - 1 - i, i >= arenaFrom - 1 ? 0 : arenaFrom - 1 - i);
  const P = { kind, W, X0, z, surf: null, islands: [], tunnels: [], blobs: [], peak: null, deep: null, entrances: [], arenaFrom };
  const sv = (zs + attempt * 7919) % 100000;

  // 1) 땅 (지상) / 바닥 섬 (하늘)
  if (kind === "ground") {
    const surf = new Array(W);
    for (let i = 0; i < W; i++) {
      const gx = X0 + i;
      const n = vnoise(gx, 46, seed + sv) * 0.6 + vnoise(gx, 19, seed + sv + 1) * 0.3 + vnoise(gx, 7, seed + sv + 2) * 0.1;
      const A = 11 * Math.max(0, Math.min(1, (edgeDist(i) - 8) / 24));
      surf[i] = FLOOR + Math.round(A * (2 * n - 1));
    }
    // 절벽은 한 칸에 최대 4줄 (한 번에 뛰어오를 수 있게)
    for (let i = 1; i < W; i++) surf[i] = Math.max(surf[i - 1] - 4, Math.min(surf[i - 1] + 4, surf[i]));
    for (let i = W - 2; i >= 0; i--) surf[i] = Math.max(surf[i + 1] - 4, Math.min(surf[i + 1] + 4, surf[i]));
    P.surf = surf;
  }
  if (kind === "sky") {
    // 바닥 섬: 큰 섬 사이에 2~4칸 틈
    const surf = new Array(W).fill(Infinity);
    let i = 0;
    while (i < W) {
      const w = i === 0 ? ri(22, 30) : ri(16, 34);
      const ww = i + w >= W - 18 ? W - i : w;
      P.islands.push({ i, row: FLOOR, w: ww, t: ri(9, 15), base: 1 });
      for (let q = i; q < i + ww; q++) surf[q] = FLOOR;
      i += ww;
      if (i >= W) break;
      i += i >= arenaFrom - 2 ? 0 : ri(2, 4);
    }
    P.surf = surf;
  }
  const surfAt = (i) => {
    if (!P.surf) return FLOOR;
    const v = P.surf[Math.max(0, Math.min(W - 1, i))];
    return v === Infinity ? FLOOR : v;
  };
  const floorUnder = (a, b) => {
    let m = Ft;
    for (let q = Math.max(0, a - 1); q <= Math.min(W - 1, b + 1); q++) m = Math.min(m, surfAt(q));
    return m;
  };

  // 2) 땅굴 (지상 땅속 / 동굴 구역 전체)
  const tunnel = (i0, i1, base, amp, k, hmin = 6, hmax = 10, flatEnds = !1) => {
    const F = new Array(W).fill(Infinity), H = new Array(W).fill(0);
    for (let i = i0; i <= i1; i++) {
      const gx = X0 + i;
      let a = amp;
      flatEnds && (a *= Math.max(0, Math.min(1, (edgeDist(i) - 6) / 20)));
      F[i] = base + Math.round(a * (2 * vnoise(gx, 34, seed + sv + k) - 1) + 0.35 * a * (2 * vnoise(gx, 11, seed + sv + k + 9) - 1));
      H[i] = hmin + Math.round((hmax - hmin) * vnoise(gx, 13, seed + sv + k + 3));
    }
    for (let i = i0 + 1; i <= i1; i++) F[i] = Math.max(F[i - 1] - 1, Math.min(F[i - 1] + 1, F[i]));
    const T = { F, H, i0, i1, base };
    P.tunnels.push(T);
    return T;
  };
  // 경사 굴: fromRow에서 한 칸에 한 줄씩 내려가 아래 굴(toT)과 만날 때까지
  const ramp = (fromRow, i, d, toT, h = 7, mouth = !1) => {
    const F = new Array(W).fill(Infinity), H = new Array(W).fill(0);
    let f = fromRow, q = i, ok = !1;
    for (let k = 0; k < W; k++) {
      if (q < 2 || q > W - 3) break;
      F[q] = f;
      H[q] = mouth ? Math.min(h, 4 + Math.max(0, Math.floor((k - 6) / 2))) : h;
      if (toT.F[q] !== Infinity && f >= toT.F[q]) {
        ok = !0;
        break;
      }
      q += d;
      f += 1;
    }
    if (!ok) return null;
    P.tunnels.push({ F, H, i0: Math.min(i, q), i1: Math.max(i, q), ramp: 1 });
    return { i0: i, i1: q };
  };
  const caverns = (T, n, rmin, rmax) => {
    for (let k = 0; k < n; k++) {
      const i = ri(Math.max(T.i0, 20), Math.min(T.i1, W - 20));
      if (T.F[i] === Infinity || edgeDist(i) < 16) continue;
      const r = ri(rmin, rmax);
      P.blobs.push({ i, row: T.F[i] - r + 2, r });
    }
  };
  const link = (A, B) => {
    for (const d of [1, -1])
      for (let t = 0; t < 10; t++) {
        const i = d > 0 ? ri(Math.max(A.i0, 16), Math.min(A.i1, W / 2)) : ri(Math.max(A.i0, W / 2), Math.min(A.i1, W - 16));
        if (A.F[i] === Infinity) continue;
        if (ramp(A.F[i], i, d, B)) break;
      }
  };
  if (kind === "cave") {
    const main = tunnel(0, W - 1, FLOOR, 5, 10, 7, 11, !0);
    const top = tunnel(6, W - 7, ri(24, 30), 6, 20, 6, 10);
    const bot = tunnel(6, W - 7, ri(100, 104), 3, 30, 6, 9);
    const midA = tunnel(ri(10, 60), ri(W - 120, W - 60), ri(46, 52), 4, 40, 5, 8);
    const midB = tunnel(ri(60, 120), W - ri(10, 40), ri(86, 90), 3, 50, 5, 8);
    link(top, midA), link(midA, main), link(top, main), link(main, midB), link(midB, bot), link(main, bot);
    caverns(main, 3, 6, 10), caverns(top, 2, 6, 9), caverns(bot, 2, 7, 11), caverns(midA, 1, 6, 8), caverns(midB, 1, 6, 8);
    P.top = top;
    P.bot = bot;
    P.main = main;
  }
  if (kind === "ground") {
    const bot = tunnel(6, W - 7, ri(98, 103), 3, 30, 6, 10);
    const mid = tunnel(ri(30, 80), ri(W - 90, W - 40), ri(86, 90), 3, 40, 5, 8);
    // 땅에서 비스듬히 내려가는 동굴 입구 (앞쪽에 하나는 꼭)
    for (const i of [ri(26, 60), ri(110, Math.max(111, arenaFrom - 40))]) {
      const d = R() < 0.5 ? 1 : -1;
      const top = surfAt(i);
      const rp = ramp(top - 1, i, d, bot, 7, !0);
      rp && P.entrances.push({ i0: Math.min(i, i + d * 10), i1: Math.max(i, i + d * 10), top });
    }
    for (let t = 0; t < 10; t++) {
      const i = ri(mid.i0, mid.i1);
      if (ramp(mid.F[i], i, R() < 0.5 ? 1 : -1, bot)) break;
    }
    caverns(bot, 3, 7, 11), caverns(mid, 1, 6, 8);
    P.bot = bot;
  }

  // 3) 떠 있는 큰 섬
  // A(위쪽 섬)가 B(아래쪽) 머리 위를 막는가: 가로로 겹치고, A 아랫면과 B 윗면 사이가 6줄보다 좁다
  const blocks = (A, B) => A.i - 1 <= B.i + B.w && A.i + A.w + 1 >= B.i && A.row < B.row && B.row - (A.row + A.t + 1) < 6;
  const chain = (topRow, pw, lo, hi) => {
    // 꼭대기 섬부터 아래로, 바닥에서 4줄 안까지
    for (let tries = 0; tries < 40; tries++) {
      const peak = { i: ri(Math.max(lo, 4), Math.max(Math.max(lo, 4), Math.min(hi, W - 4) - pw)), row: topRow, w: pw, t: ri(4, 6), top: 1 };
      const st = [peak];
      let cur = peak, dir = R() < 0.5 ? 1 : -1;
      for (let g = 0; g < 40; g++) {
        if (cur.row >= floorUnder(cur.i, cur.i + cur.w - 1) - 5) break;
        let placed = null;
        for (const d of [dir, -dir]) {
          for (const gap of [2, 3, 4, 5]) {
            const w = ri(6, 12), t = ri(3, 6);
            const i = d > 0 ? cur.i + cur.w + gap : cur.i - gap - w;
            if (i < lo || i + w > hi || i < 3 || i + w > W - 3 || i + w > arenaFrom - 2) continue;
            const fl = floorUnder(i, i + w - 1);
            const row = Math.min(cur.row + ri(3, 5), fl - 5);
            if (row <= cur.row + 1) continue;
            // 섬 아래로 3줄 이상 비워 땅 위를 지나갈 수 있게
            const B = { i, row, w, t: Math.max(1, Math.min(t, fl - 4 - row)) };
            if (st.some((A) => A !== cur && blocks(A, B))) continue;
            placed = B;
            dir = d;
            break;
          }
          if (placed) break;
        }
        if (!placed) break;
        st.push(placed);
        cur = placed;
      }
      if (cur.row >= floorUnder(cur.i, cur.i + cur.w - 1) - 5) return st;
    }
    return null;
  };
  if (kind === "ground" || kind === "sky") {
    if (isZone) {
      const upI = (o.up - z.c0) * 32 + 16;
      const st = chain(ri(5, 7), 11, upI - 70, upI + 70) ?? chain(ri(5, 7), 9, upI - 110, upI + 110) ?? chain(ri(6, 8), 9, 8, arenaFrom - 8);
      if (st) {
        P.islands.push(...st);
        const pk = st[0];
        P.peak = { i: pk.i + 2, row: pk.row };
        P.chest = { i: pk.i + pk.w - 3, row: pk.row };
      }
    }
    // 흩어진 큰 섬 (탐험·보물·적)
    const want = kind === "sky" ? ri(12, 18) : ri(4, 7);
    for (let k = 0, made = 0; k < 240 && made < want; k++) {
      const w = ri(9, kind === "sky" ? 22 : 16), t = ri(4, 11), i = ri(6, Math.max(7, arenaFrom - 6 - w));
      const fl = floorUnder(i, i + w - 1);
      if (fl - t - 12 < 8) continue;
      const row = ri(8, fl - t - 12);
      const B = { i, row, w, t };
      // 다른 섬과 위아래 7줄·옆 4칸 이상 떨어지게
      if (P.islands.some((A) => !A.base && i - 4 <= A.i + A.w && i + w + 4 >= A.i && row - 7 <= A.row + A.t && row + t + 7 >= A.row)) continue;
      P.islands.push(B);
      made++;
    }
  }

  // 4) ▲·▼ 문 자리
  const flatOn = (F, i0, i1) => {
    const c = [];
    for (let i = Math.max(i0, 3); i <= Math.min(i1, W - 4); i++) if (F[i] !== Infinity && [-2, -1, 1, 2].every((d) => F[i + d] === F[i])) c.push(i);
    return c.length ? c[Math.floor(R() * c.length)] : null;
  };
  if (isZone && kind === "cave") {
    const ui = (o.up - z.c0) * 32, di = (o.down - z.c0) * 32;
    const a = flatOn(P.top.F, ui + 3, ui + 28);
    a != null && (P.peak = { i: a, row: P.top.F[a] });
    const b = flatOn(P.bot.F, di + 3, di + 28);
    b != null && (P.deep = { i: b, row: P.bot.F[b] });
  }
  if (isZone && kind === "ground") {
    const di = (o.down - z.c0) * 32;
    const b = flatOn(P.bot.F, di + 3, di + 28);
    b != null && (P.deep = { i: b, row: P.bot.F[b] });
  }
  return P;
}

// ── 조각 그리기 ─────────────────────────────────────
// r: 조각 격자(32 × Ft), l: 땅 높이(아래에서 센 값), s: 천장 줄
export function chunk(z, S, r, l, s, o) {
  return drawChunk(planOf(z, o), z, S, r, l, s, o);
}
function drawChunk(P, z, S, r, l, s, o) {
  const { Ft, fe, ze, arena, biome } = o;
  const vt = 32, base = S * vt - P.X0;
  const set = (x, y, v) => x >= 0 && x < vt && y >= 0 && y < Ft && (r[y * vt + x] = v);
  const get = (x, y) => (x < 0 || x >= vt || y < 0 || y >= Ft ? fe : r[y * vt + x]);
  const R = rngOf(o.seed, (strHash(z.id) + S) | 0, 7);
  const out = { clouds: [], chests: [], spawns: [], peak: null, deep: null, ug: null };

  // 바탕
  r.fill(P.kind === "cave" ? fe : ze);
  if (P.kind === "ground")
    for (let x = 0; x < vt; x++) {
      const row = arena ? FLOOR : P.surf[base + x];
      for (let y = row; y < Ft; y++) set(x, y, fe);
    }
  // 섬 (아랫면은 둥글고 울퉁불퉁, 윗면은 평평)
  for (const I of P.islands) {
    if (I.i > base + vt + 1 || I.i + I.w < base - 1) continue;
    for (let q = 0; q < I.w; q++) {
      const x = I.i + q - base;
      if (x < 0 || x >= vt) continue;
      const c = (q - (I.w - 1) / 2) / (I.w / 2);
      const n = vnoise(P.X0 + I.i + q, 4, o.seed + 77);
      const depth = I.base ? I.t + Math.round(4 * n) : Math.max(1, Math.min(I.t, Math.round(I.t * Math.sqrt(Math.max(0, 1 - c * c)) * (0.75 + 0.35 * n))));
      const lip = !I.base && (q === 0 || q === I.w - 1) ? 1 : 0;
      for (let y = I.row + lip; y < I.row + 1 + depth; y++) set(x, y, fe);
    }
  }
  // 동굴방 먼저 (둥근 방, 테두리 울퉁불퉁)
  const inBlob = (x, y) =>
    P.blobs.some((B) => {
      const dx = base + x - B.i, dy = (y - B.row) * 1.15;
      const rr = B.r * (0.82 + 0.3 * vnoise(P.X0 + base + x + y * 13, 5, o.seed + 91));
      return dx * dx + dy * dy < rr * rr;
    });
  for (const B of P.blobs) {
    if (B.i + B.r + 2 < base || B.i - B.r - 2 > base + vt) continue;
    for (let x = 0; x < vt; x++)
      for (let y = B.row - B.r - 2; y <= B.row + B.r + 2; y++) {
        const dx = base + x - B.i, dy = (y - B.row) * 1.15;
        const rr = B.r * (0.82 + 0.3 * vnoise(P.X0 + base + x + y * 13, 5, o.seed + 91));
        dx * dx + dy * dy < rr * rr && set(x, y, ze);
      }
  }
  // 땅굴·경사 굴
  for (const T of P.tunnels)
    for (let x = 0; x < vt; x++) {
      const i = base + x;
      if (i < T.i0 || i > T.i1 || T.F[i] === Infinity) continue;
      for (let y = T.F[i] - T.H[i]; y < T.F[i]; y++) set(x, y, ze);
    }
  // 동굴방이 수평 굴 바닥을 파먹은 곳은 다시 메운다 (동굴방을 가로지르는 바위 턱이 된다)
  for (const T of P.tunnels) {
    if (T.ramp) continue;
    for (let x = 0; x < vt; x++) {
      const i = base + x, f = T.F[i];
      if (i < T.i0 || i > T.i1 || f === Infinity || get(x, f) !== ze || !inBlob(x, f)) continue;
      set(x, f, fe);
      set(x, f + 1, fe);
    }
  }
  // 경사 굴이 열린 공간(다른 굴·동굴방)을 지나는 곳: 3줄마다 작은 바위 턱 (밑으로 지나갈 수 있고, 밟고 오를 수 있다)
  for (const T of P.tunnels) {
    if (!T.ramp) continue;
    for (let x = 0; x < vt; x++) {
      const i = base + x, f = T.F[i];
      if (i < T.i0 || i > T.i1 || f === Infinity || f % 3 !== 0 || get(x, f) !== ze) continue;
      // 아래 땅과 4줄 이상 떨어진 곳만 (통로를 막지 않게)
      let g = f + 1;
      while (g < Ft && get(x, g) === ze) g++;
      if (g - f < 4) continue;
      for (let k = -1; k <= 1; k++) get(x + k, f) === ze && get(x + k, f - 1) === ze && set(x + k, f, fe);
    }
  }
  // 보스 방: 지상·하늘은 70줄 평지 위가 비어 있게, 동굴은 넓은 방
  if (arena) {
    if (P.kind === "cave") for (let x = 0; x < vt; x++) for (let y = FLOOR - 13; y < FLOOR; y++) set(x, y, ze);
    else for (let x = 0; x < vt; x++) for (let y = 0; y < FLOOR; y++) set(x, y, ze);
    for (let x = 0; x < vt; x++) for (let y = FLOOR; y < FLOOR + 3; y++) set(x, y, fe);
  }
  // 맨 아래는 바위
  if (P.kind !== "sky") for (let x = 0; x < vt; x++) for (let y = Ft - 5; y < Ft; y++) set(x, y, fe);
  // 한 줄 턱은 경사로 (걸어서 오르내린다)
  for (let x = 1; x < vt - 1; x++)
    for (let y = 2; y < Ft - 1; y++) {
      if (get(x, y) !== ze || get(x, y + 1) !== fe || get(x, y - 1) !== ze) continue;
      const up = get(x + 1, y) === fe && get(x + 1, y - 1) === ze, dn = get(x - 1, y) === fe && get(x - 1, y - 1) === ze;
      up && !dn ? set(x, y, 4) : dn && !up && set(x, y, 5);
    }

  // 엔진용 높이: 지상=땅, 하늘=바닥 섬, 동굴=입구 굴 바닥
  for (let x = 0; x < vt; x++) {
    const i = base + x;
    const row = arena ? FLOOR : P.kind === "cave" ? (P.main.F[i] === Infinity ? FLOOR : P.main.F[i]) : P.kind === "sky" ? FLOOR : P.surf[i];
    // 하늘 바닥 섬 사이 틈은 땅이 없다 (적·상자·문이 허공에 서지 않게)
    l[x] = P.kind === "sky" && !arena && P.surf[i] === Infinity ? 0 : Ft - row;
    s[x] = P.kind === "cave" && !arena ? row - (P.main.H[i] || 8) : 0;
  }
  // 지하 표시 (뒷벽·어둠)
  if (P.kind === "cave") out.ug = { top: 0, biome, entrances: [], surface: new Array(vt).fill(0) };
  else if (P.kind === "ground")
    out.ug = {
      top: UG_TOP,
      biome,
      entrances: P.entrances.filter((e) => e.i1 >= base && e.i0 < base + vt).map((e) => ({ x: Math.max(0, e.i0 - base), w: Math.min(vt, e.i1 - base + 1) - Math.max(0, e.i0 - base), top: e.top })),
      surface: Array.from({ length: vt }, (_, x) => (arena ? FLOOR : P.surf[base + x])),
    };
  else out.ug = { top: Ft + 20, biome: null, entrances: [], surface: [] };

  // ▲·▼ 문 (이 조각에 있으면)
  const inChunk = (p) => p && p.i >= base && p.i < base + vt;
  if (S === o.up && inChunk(P.peak)) {
    out.peak = { x: P.peak.i - base, row: P.peak.row };
    P.chest && inChunk(P.chest) && out.chests.push({ x: P.chest.i - base, row: P.chest.row, tier: R() < 0.35 ? 2 : 1 });
  }
  S === o.down && inChunk(P.deep) && (out.deep = { x: P.deep.i - base, row: P.deep.row });

  // 설 수 있는 자리 → 적·보물 (땅 위 큰길 말고 섬·굴·동굴방)
  if (!arena) {
    const spots = [];
    for (let x = 2; x < vt - 2; x++)
      for (let y = 4; y < Ft - 5; y++) {
        const v = get(x, y);
        if (v === fe && get(x, y - 1) === ze && get(x, y - 2) === ze && get(x, y - 3) === ze && get(x - 1, y) === fe && get(x + 1, y) === fe && y !== Ft - l[x]) spots.push({ x, row: y });
      }
    const near = (g, p) => g && Math.abs(g.x - p.x) < 5 && Math.abs(g.row - p.row) < 3;
    const pick = () => spots.splice(Math.floor(R() * spots.length), 1)[0];
    for (let k = 0, n = P.kind === "ground" ? 2 : 4; k < n && spots.length; k++) {
      const p = pick();
      p && !near(out.peak, p) && !near(out.deep, p) && out.spawns.push(p);
    }
    for (let k = 0; k < 2 && spots.length; k++) {
      const p = pick();
      p && !near(out.peak, p) && !near(out.deep, p) && R() < 0.3 && out.chests.push({ x: p.x, row: p.row, tier: R() < 0.12 ? 2 : R() < 0.45 ? 1 : 0 });
    }
    P.kind === "sky" && R() < 0.7 && out.spawns.push({ x: 4 + Math.floor(R() * 24), row: 20 + Math.floor(R() * 40), fly: 1 });
  }
  return out;
}
