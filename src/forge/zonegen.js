// 하늘·동굴 구역 전용 지형 — 조각 하나(32칸 × 116줄)를 위에서 아래까지 통째로 채운다.
// 점프: 한 번에 위로 약 5칸, 옆으로 약 6칸. 길은 "위로 3~4칸, 옆으로 1~3칸" 안에서만 잇는다.
//
// 하늘: 바닥(70줄)은 큰 섬들과 그 사이 구름 다리. 위로는 섬과 구름이 징검다리로 이어져 꼭대기(6줄 근처)까지 오른다.
//       조각마다 바닥에서 꼭대기까지 가는 길이 하나는 꼭 있다. ▲ 문 조각은 그 꼭대기에 넓은 섬을 둔다.
// 동굴: 전부 바위로 채운 뒤 층층이 굴(바닥 22·40·56·70·86·102줄)을 판다. 층 사이는 세로 굴(안에 발판)로 잇고,
//       군데군데 큰 동굴방이 뚫린다. ▲ 문은 맨 위층, ▼ 문은 맨 아래층 바닥.
const FLOOR = 70; // 구역 입구(양 끝 출구)가 서는 줄 = 지상 지면과 같은 높이
const LEVELS = [22, 40, 56, 70, 86, 102];

const hh = (a, b) => {
  let x = (a * 374761393 + b * 668265263) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
};
const vnoise = (x, sc, seed) => {
  const i = Math.floor(x / sc), f = x / sc - i, u = f * f * (3 - 2 * f);
  return hh(i, seed) * (1 - u) + hh(i + 1, seed) * u;
};
const vn2 = (x, y, sx, sy, seed) => {
  const fx0 = x / sx, fy0 = y / sy, ix = Math.floor(fx0), iy = Math.floor(fy0), fx = fx0 - ix, fy = fy0 - iy;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const h2 = (a, b) => hh(a * 7 + seed, b * 13 - seed);
  const a = h2(ix, iy), b = h2(ix + 1, iy), c = h2(ix, iy + 1), d = h2(ix + 1, iy + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};
const rngOf = (seed, S, k) => {
  let s = (Math.floor(hh(seed + k * 101, S) * 4294967296) >>> 0) || 1;
  return () => ((s = (Math.imul(s ^ (s >>> 15), 2246822519) + 0x6d2b79f5) >>> 0), (s >>> 8) / 16777216);
};

// 계단을 섬으로 둘 수 있는가: 바로 아래(8줄 안) 계단의 머리 위를 막으면 안 된다 → 그땐 구름(아래에서 뚫고 오름)
// 계단을 위(꼭대기 섬)에서 아래로 만든다. 새 칸은 바로 위 칸 말고 다른 위쪽 칸(8줄 안)과 겹치지 않는 자리만.
// floorAt(x0, x1) = 그 폭 아래 가장 높은 땅 줄. 땅에서 4줄 안으로 내려오면 끝.
// 무작위로 섬을 고른 뒤에도, 아래 계단(바로 아래 이웃 제외)의 머리를 막으면 구름으로
const blockers2 = (t, steps) => {
  const i = steps.indexOf(t);
  return steps.some((b, j) => j > i + 1 && b.row > t.row && b.row - t.row <= 8 && t.x <= b.x + b.w && t.x + t.w >= b.x);
};
function stairsDown(R, vt, topRow, pw, floorAt) {
  let best = null;
  for (let tries = 0; tries < 12; tries++) {
    const st = stairsTry(R, vt, topRow, pw, floorAt);
    const last = st[st.length - 1];
    const gap = floorAt(last.x, last.x + last.w - 1) - last.row;
    if (gap <= 4) return st;
    (!best || gap < best.gap) && (best = { st, gap });
  }
  return best.st;
}
function stairsTry(R, vt, topRow, pw, floorAt) {
  const ri = (a, b) => a + Math.floor(R() * (b - a + 1));
  const peak = { x: ri(2, vt - 2 - pw), row: topRow, w: pw, top: 1 };
  const steps = [peak];
  // 첫 걸음은 공간이 넓은 쪽으로
  let cur = peak, dir = peak.x - 1 > vt - 2 - (peak.x + pw) ? -1 : 1;
  const blockers = (t) => steps.filter((u) => u !== cur && !u.cloud && u.row < t.row && t.row - u.row <= 8 && t.x <= u.x + u.w && t.x + t.w >= u.x);
  for (let guard = 0; guard < 40; guard++) {
    if (cur.row >= floorAt(cur.x, cur.x + cur.w - 1) - 4) break;
    let placed = null, fallback = null;
    for (const d of [dir, -dir]) {
      for (const g of [1, 2, 3, 4]) {
        for (const w of [ri(4, 6), 3]) {
          const x = d > 0 ? cur.x + cur.w + g : cur.x - g - w;
          if (x < 1 || x + w > vt - 2) continue;
          const fl = floorAt(x, x + w - 1);
          const row = Math.min(cur.row + ri(3, 4), fl - 3);
          if (row <= cur.row + 1) continue;
          const t = { x, row, w }, b = blockers(t);
          if (!b.length) { placed = t; dir = d; break; }
          // 막는 게 꼭대기 섬이 아니면, 막는 계단을 구름으로 바꾸고 쓴다
          !fallback && !b.some((u) => u.top) && (fallback = { t, b, d });
        }
        if (placed) break;
      }
      if (placed) break;
    }
    if (!placed && fallback) {
      for (const u of fallback.b) u.cloud = !0;
      placed = fallback.t;
      dir = fallback.d;
    }
    if (!placed) break;
    steps.push(placed);
    cur = placed;
  }
  return steps;
}
export function generate(kind, S, r, l, s, o) {
  return kind === "sky" ? sky(S, r, l, s, o) : cave(S, r, l, s, o);
}

// ── 하늘 ────────────────────────────────────────────
function sky(S, r, l, s, o) {
  const { vt, Ft, fe, ze, plat, seed, edge, peak, arena } = o;
  const R = rngOf(seed, S, 1);
  const ri = (a, b) => a + Math.floor(R() * (b - a + 1));
  const set = (x, y, v) => x >= 0 && x < vt && y >= 0 && y < Ft && (r[y * vt + x] = v);
  const at = (x, y) => (x < 0 || x >= vt || y < 0 || y >= Ft ? ze : r[y * vt + x]);
  // 지하 뒷벽을 그리지 않는다 (섬 아래에 동굴 벽이 보이지 않게)
  const out = { clouds: [], chests: [], spawns: [], peak: null, deep: null, ug: { top: Ft + 20, biome: null, entrances: [], surface: [] } };
  r.fill(ze);
  // 섬: 윗면 row, 폭 w, 두께 h, 아래로 갈수록 좁아진다
  const island = (x, row, w, h) => {
    for (let k = 0; k < h; k++) {
      const inset = Math.floor((k * k) / Math.max(1, h) * 0.9);
      for (let i = inset; i < w - inset; i++) set(x + i, row + k, fe);
    }
  };
  const cloud = (x, row, w) => {
    for (let i = 0; i < w; i++) x + i >= 0 && x + i < vt && at(x + i, row) === ze && (set(x + i, row, plat), out.clouds.push(`${x + i},${row}`));
  };
  // 1) 바닥: 섬 + 구름 다리 (가장자리·보스 방은 이어진 섬)
  if (edge || arena) island(0, FLOOR, vt, 9);
  else {
    let x = 0;
    while (x < vt) {
      const w = Math.min(vt - x, ri(7, 13));
      island(x, FLOOR, w, ri(6, 10));
      x += w;
      if (x >= vt) break;
      const g = Math.min(vt - x, ri(3, 5));
      cloud(x, FLOOR, g);
      x += g;
    }
  }
  for (let x = 0; x < vt; x++) (l[x] = Ft - FLOOR), (s[x] = 0);
  if (edge || arena) return out;
  // 2) 꼭대기까지 가는 징검다리 (반드시 오를 수 있는 길): 꼭대기 섬부터 아래로
  const steps = stairsDown(R, vt, peak ? ri(6, 8) : ri(9, 14), peak ? 7 : ri(5, 7), () => FLOOR);
  const pk = steps[0];
  if (peak) {
    out.peak = { x: pk.x + 1, row: pk.row };
    out.chests.push({ x: pk.x + pk.w - 2, row: pk.row, tier: R() < 0.35 ? 2 : 1 });
  } else pk.top = 0;
  steps[steps.length - 1].cloud = !0;
  for (const t of steps) t.top || t.cloud || (t.cloud = R() < 0.4 || blockers2(t, steps));
  // 계단 위쪽 5줄은 비워 둔다 (머리 부딪힘 방지)
  const keep = steps.map((t) => [t.x - 1, t.row - 5, t.x + t.w, t.row + 1]);
  const free = (x0, r0, x1, r1) => !keep.some(([a, b, c, d]) => x0 <= c && x1 >= a && r0 <= d && r1 >= b);
  // 3) 큰 떠 있는 섬들 (보물·적)
  let made = 0;
  for (let k = 0; k < 80 && made < 6; k++) {
    const iw = ri(5, 11), ih = ri(3, 6), ix = ri(1, vt - 1 - iw), ir = ri(8, FLOOR - 10);
    if (!free(ix, ir - 3, ix + iw, ir + ih + 5)) continue;
    let ok = !0;
    for (let yy = ir - 4; yy <= ir + ih + 1 && ok; yy++) for (let xx = ix - 2; xx <= ix + iw + 1; xx++) at(xx, yy) !== ze && (ok = !1);
    if (!ok) continue;
    island(ix, ir, iw, ih);
    made++;
    keep.push([ix - 2, ir - 4, ix + iw + 1, ir + ih + 1]);
    R() < 0.22 && out.chests.push({ x: ix + ri(1, iw - 2), row: ir, tier: R() < 0.15 ? 2 : R() < 0.5 ? 1 : 0 });
    R() < 0.5 && out.spawns.push({ x: ix + Math.floor(iw / 2), row: ir });
  }
  // 4) 계단 (꼭대기 섬은 두껍게)
  for (const t of steps) t.top ? island(t.x, t.row, t.w, 3) : t.cloud ? cloud(t.x, t.row, t.w) : island(t.x, t.row, t.w, 2);
  // 날아다니는 적
  for (let k = 0; k < 2; k++) out.spawns.push({ x: ri(4, vt - 5), row: ri(20, 60), fly: 1 });
  return out;
}

// ── 동굴 ────────────────────────────────────────────
function cave(S, r, l, s, o) {
  const { vt, Ft, fe, ze, plat, seed, edge, up, down, arena, biome, forceShafts } = o;
  const R = rngOf(seed, S, 2);
  const ri = (a, b) => a + Math.floor(R() * (b - a + 1));
  const set = (x, y, v) => x >= 0 && x < vt && y >= 0 && y < Ft && (r[y * vt + x] = v);
  const at = (x, y) => (x < 0 || x >= vt || y < 0 || y >= Ft ? fe : r[y * vt + x]);
  const base = S * vt;
  const out = { clouds: [], chests: [], spawns: [], peak: null, deep: null, ug: { top: 0, biome, entrances: [], surface: new Array(vt).fill(0) } };
  r.fill(fe);
  if (arena) {
    // 보스 방: 입구 층 높이의 넓은 동굴방
    for (let x = 0; x < vt; x++) for (let y = FLOOR - 13; y < FLOOR; y++) set(x, y, ze);
    for (let x = 0; x < vt; x++) (l[x] = Ft - FLOOR), (s[x] = FLOOR - 13);
    return out;
  }
  // 1) 층마다 구불구불한 굴
  const floorOf = LEVELS.map((L, k) => {
    const f = {};
    for (let x = -1; x <= vt; x++) f[x] = edge && L === FLOOR ? FLOOR : L + Math.round(2 * (2 * vnoise(base + x, 14, seed + k * 17) - 1));
    return f;
  });
  const heightOf = (k, x) => 5 + Math.round(3 * vnoise(base + x, 9, seed + 300 + k));
  LEVELS.forEach((L, k) => {
    for (let x = 0; x < vt; x++) {
      const f = floorOf[k][x], h = edge && L === FLOOR ? 7 : heightOf(k, x);
      for (let y = f - h; y < f; y++) set(x, y, ze);
    }
  });
  // 2) 큰 동굴방 (층 사이를 크게 뚫는다)
  if (!edge)
    for (let x = 1; x < vt - 1; x++)
      for (let y = 12; y < Ft - 8; y++) {
        const n = vn2(base + x, y, 12, 9, seed + 5) * 0.7 + vn2(base + x, y, 5, 4, seed + 6) * 0.3;
        n > 0.6 && set(x, y, ze);
      }
  // 3) 세로 굴: 위층 바닥에 구멍 → 아래층까지, 안에 3줄마다 발판
  const shafts = [];
  for (let k = 0; k < LEVELS.length - 1; k++) {
    if (edge || (!forceShafts && R() > 0.65)) continue;
    let sx = ri(4, vt - 8);
    shafts.some((q) => Math.abs(q - sx) < 5) && (sx = (sx + 9) % (vt - 10) + 4);
    shafts.push(sx);
    const top = Math.min(floorOf[k][sx], floorOf[k][sx + 1], floorOf[k][sx + 2]) - 1, bot = Math.max(floorOf[k + 1][sx], floorOf[k + 1][sx + 1], floorOf[k + 1][sx + 2]);
    for (let x = sx; x < sx + 3; x++) for (let y = top - 2; y < bot; y++) set(x, y, ze);
    for (let x = sx; x < sx + 3; x++) set(x, bot, fe);
    for (let y = bot - 3; y > top + 1; y -= 3) for (let x = sx; x < sx + 3; x++) set(x, y, plat);
  }
  // 동굴방 안 바위 턱 (올라갈 수 있게)
  if (!edge)
    for (let x = 2; x < vt - 4; x += ri(4, 7)) {
      const w = ri(2, 4);
      for (let y = Ft - 12; y > 14; y -= ri(3, 4)) {
        let ok = !0;
        for (let i = 0; i < w; i++) if (at(x + i, y) !== ze || at(x + i, y - 1) !== ze || at(x + i, y + 1) !== ze || at(x + i, y + 2) !== ze) ok = !1;
        ok && R() < 0.55 && (() => { for (let i = 0; i < w; i++) set(x + i, y, plat); })();
      }
    }
  // 입구 층 큰길은 끊기지 않게 바닥을 다시 메운다 (세로 굴 자리는 그대로)
  {
    const fk0 = LEVELS.indexOf(FLOOR);
    for (let x = 0; x < vt; x++) {
      if (shafts.some((q) => x >= q && x < q + 3)) continue;
      set(x, floorOf[fk0][x], fe), set(x, floorOf[fk0][x] + 1, fe);
    }
  }
  // 바닥 정리: 맨 아래 몇 줄은 바위
  for (let x = 0; x < vt; x++) for (let y = Ft - 6; y < Ft; y++) set(x, y, fe);
  // 입구 층 높이를 "지면"으로 (출구·적 배치·구덩이 복귀 기준)
  const fk = LEVELS.indexOf(FLOOR);
  for (let x = 0; x < vt; x++) {
    const f = floorOf[fk][x];
    l[x] = Ft - f;
    s[x] = f - (edge ? 7 : heightOf(fk, x));
  }
  // 4) 서 있을 자리 찾기 (바닥 단단 · 위 3칸 비어 있음)
  const spot = (k, x0, x1) => {
    const c = [];
    for (let x = Math.max(2, x0); x <= Math.min(vt - 3, x1); x++) {
      const f = floorOf[k][x];
      if ([x - 1, x, x + 1].every((q) => at(q, f) === fe && at(q, f - 1) === ze && at(q, f - 2) === ze) && at(x, f - 3) === ze && !shafts.some((q) => x >= q - 1 && x <= q + 3)) c.push({ x, row: f });
    }
    return c.length ? c[Math.floor(R() * c.length)] : null;
  };
  up && (out.peak = spot(0, 4, vt - 5));
  down && (out.deep = spot(LEVELS.length - 1, 4, vt - 5));
  if (!edge) {
    for (let k = 0; k < LEVELS.length; k++) {
      if (k === fk || R() < 0.45) continue;
      const p = spot(k, 3, vt - 4);
      p && out.spawns.push(p);
    }
    if (R() < 0.45) {
      const p = spot(ri(0, LEVELS.length - 1), 3, vt - 4);
      const nearGate = (g) => g && p && Math.abs(g.x - p.x) < 5 && g.row === p.row;
      p && !nearGate(out.peak) && !nearGate(out.deep) && out.chests.push({ x: p.x, row: p.row, tier: R() < 0.12 ? 2 : R() < 0.45 ? 1 : 0 });
    }
  }
  return out;
}

// ── 지상 구역의 ▲ 문 조각: 땅에서 꼭대기까지 섬 징검다리 ──
export function groundPeak(S, r, l, o) {
  const { vt, Ft, fe, ze, plat, seed } = o;
  const R = rngOf(seed, S, 3);
  const ri = (a, b) => a + Math.floor(R() * (b - a + 1));
  const set = (x, y, v) => x >= 0 && x < vt && y >= 0 && y < Ft && (r[y * vt + x] = v);
  const out = { clouds: [], chests: [], peak: null };
  // 땅 위 하늘을 비운다 (원래 있던 떠 있는 발판·섬 제거)
  let gTop = Ft;
  for (let x = 0; x < vt; x++) l[x] > 0 && (gTop = Math.min(gTop, Ft - l[x]));
  for (let y = 0; y < gTop - 3; y++) for (let x = 0; x < vt; x++) set(x, y, ze);
  const island = (x, row, w, h) => {
    for (let k = 0; k < h; k++) {
      const inset = Math.floor((k * k) / Math.max(1, h) * 0.9);
      for (let i = inset; i < w - inset; i++) set(x + i, row + k, fe);
    }
  };
  const cloud = (x, row, w) => {
    for (let i = 0; i < w; i++) x + i >= 0 && x + i < vt && r[row * vt + x + i] === ze && (set(x + i, row, plat), out.clouds.push(`${x + i},${row}`));
  };
  // 꼭대기 섬부터 땅까지 아래로
  const floorAt = (x0, x1) => {
    let m = Ft;
    for (let x = Math.max(0, x0 - 1); x <= Math.min(vt - 1, x1 + 1); x++) l[x] > 0 && (m = Math.min(m, Ft - l[x]));
    return m;
  };
  const steps = stairsDown(R, vt, ri(6, 8), 7, floorAt);
  const pk = steps[0];
  steps[steps.length - 1].cloud = !0;
  for (const t of steps) t.top ? island(t.x, t.row, t.w, 3) : t.cloud || R() < 0.45 || blockers2(t, steps) ? cloud(t.x, t.row, t.w) : island(t.x, t.row, t.w, 2);
  out.peak = { x: pk.x + 1, row: pk.row };
  out.chests.push({ x: pk.x + pk.w - 2, row: pk.row, tier: R() < 0.3 ? 2 : 1 });
  return out;
}

// ── 지상 구역의 땅 모양 (원래 지형 조각 그림 대신) ──
// 완만한 언덕(한 칸에 1줄 이하), 평평한 칸(구역 끝·▲ 빈터·보스 방) 근처에서는 평지로 이어진다.
// 떠 있는 발판·작은 섬은 땅에서 4줄 이상 띄운다. 함정 위치(i.hazards)는 그대로 쓰고 높이는 엔진이 맞춘다.
export function groundShape(i, S, o) {
  const { vt, Ft, seed, flatDist } = o;
  const base = S * vt, H0 = 46;
  const R = rngOf(seed, S, 4);
  const ri = (a, b) => a + Math.floor(R() * (b - a + 1));
  const hAt = (gx) => {
    const n = vnoise(gx, 18, seed + 71) * 0.75 + vnoise(gx, 7, seed + 72) * 0.25;
    const A = 5 * Math.max(0, Math.min(1, (flatDist(gx) - 2) / 8));
    return H0 + Math.round(A * (2 * n - 1));
  };
  const h = [];
  for (let x = 0; x < vt; x++) h.push(hAt(base + x));
  i.cols = h.map((g) => ({ g, c: 0 }));
  i.h = h[vt - 1];
  i.blocks = [];
  i.plats = [];
  i.decorHints = [];
  i.extraSpawns = [];
  i.noSpawn = new Set();
  i.slopes = [];
  const hl = hAt(base - 1), hr = hAt(base + vt);
  for (let x = 0; x < vt; x++) {
    const L = x > 0 ? h[x - 1] : hl, Rr = x < vt - 1 ? h[x + 1] : hr;
    if (Rr === h[x] + 1 && L !== h[x] + 1) i.slopes.push({ x, row: Ft - (h[x] + 1), code: 4 });
    else if (L === h[x] + 1 && Rr !== h[x] + 1) i.slopes.push({ x, row: Ft - (h[x] + 1), code: 5 });
  }
  // 떠 있는 발판·작은 섬
  const used = [];
  for (let k = 0, n = ri(1, 3); k < 12 && used.length < n; k++) {
    const w = ri(3, 6), x = ri(2, vt - 3 - w);
    if (used.some(([a, b]) => x <= b + 2 && x + w >= a - 2)) continue;
    let top = Ft;
    for (let q = x - 1; q <= x + w; q++) top = Math.min(top, Ft - h[Math.max(0, Math.min(vt - 1, q))]);
    if (R() < 0.6) i.plats.push({ x, row: top - ri(4, 5), w, fixed: 1 });
    else i.blocks.push({ x, row: top - ri(6, 8), w, h: 2, taper: 0.5 });
    used.push([x, x + w]);
  }
}
