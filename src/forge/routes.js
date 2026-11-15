// 하늘 루트와 지하 루트 생성기
import { UG } from "./levels.js";

const hh = (a, b) => {
  let x = (a * 374761393 + b * 668265263) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
};
// 1차원 잡음 (전역 열 번호 → 조각 경계에서 이어진다)
const vnoise = (x, sc, seed) => {
  const i = Math.floor(x / sc), f = x / sc - i, u = f * f * (3 - 2 * f);
  return hh(i, seed) * (1 - u) + hh(i + 1, seed) * u;
};
// 2차원 잡음 (동굴 모양)
const vn2 = (x, y, sx, sy, seed) => {
  const fx0 = x / sx, fy0 = y / sy, ix = Math.floor(fx0), iy = Math.floor(fy0), fx = fx0 - ix, fy = fy0 - iy;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const h2 = (a, b) => hh(a * 7 + seed, b * 13 - seed);
  const a = h2(ix, iy), b = h2(ix + 1, iy), c = h2(ix, iy + 1), d = h2(ix + 1, iy + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};

// ── 하늘 루트: 유적이 있는 큰 섬들과 그 사이를 잇는 작은 섬·구름·부서지는 발판 ──
// 상자는 많고 적은 적다. 사이 간격이 넓어 떨어지기 쉽다.
export function skyRoute(b, ctx) {
  const { S, seed, rng, Ft } = ctx;
  const out = { chests: [], spawns: [], clouds: [] };
  const base = S * 32;
  const R = () => rng.next();
  const rowAt = (gx) => 6 + Math.round(9 * vnoise(gx, 22, seed + 3)); // 6..15줄
  const island = (x, row, w, h = 2, taper = 0.6) => b.blocks.push({ x, row, w, h, taper });
  const plat = (x, row, w, crumble) => b.plats.push({ x, row, w, fixed: 1, crumble: !!crumble });
  const cloud = (x, row, w) => {
    b.plats.push({ x, row, w, fixed: 1 });
    for (let k = 0; k < w; k++) out.clouds.push(`${x + k},${row}`);
  };
  const tops = [];
  const r0 = rowAt(base), r1 = rowAt(base + 31);
  // 이음 섬 (조각 끝끼리 같은 높이)
  island(0, r0, 3);
  island(29, r1, 3);
  // 큰 섬: 폭 9~13, 두께 4~6, 위에 유적
  const mw = 9 + Math.floor(R() * 5), mx = 8 + Math.floor(R() * (22 - mw)), mr = Math.max(7, Math.min(16, rowAt(base + mx + mw / 2) + 1));
  island(mx, mr, mw, 4 + Math.floor(R() * 3), 0.45);
  tops.push([mx + 1, mr, mw - 2, "big"]);
  const ruin = R();
  if (ruin < 0.45) {
    // 아치: 기둥 둘 + 위 발판
    const p1 = mx + 1 + Math.floor(R() * 2), p2 = mx + mw - 2 - Math.floor(R() * 2), ph = 3 + Math.floor(R() * 2);
    b.blocks.push({ x: p1, row: mr - ph, w: 1, h: ph });
    b.blocks.push({ x: p2, row: mr - ph, w: 1, h: ph });
    plat(p1, mr - ph - 1, p2 - p1 + 1);
    tops.push([p1 + 1, mr - ph - 1, p2 - p1 - 1, "arch"]);
  } else if (ruin < 0.8) {
    for (let k = 0; k < 2; k++) {
      const px = mx + 2 + Math.floor(R() * (mw - 4)), ph = 2 + Math.floor(R() * 3);
      b.blocks.push({ x: px, row: mr - ph, w: 1 + (R() < 0.4 ? 1 : 0), h: ph });
    }
  }
  // 징검다리
  const bridge = (xa, ra, xb, rb) => {
    let x = xa, prev = ra;
    while (xb - x > 4) {
      const gap = 2 + Math.floor(R() * 3), w = 2 + Math.floor(R() * 2);
      const nx = x + gap;
      if (nx + w > xb - 1) break;
      const t = (nx - xa) / Math.max(1, xb - xa);
      let row = Math.round(ra + (rb - ra) * t + (R() - 0.5) * 3);
      row = Math.max(3, Math.min(18, Math.max(prev - 3, row)));
      const k = R();
      if (k < 0.3) plat(nx, row, w, !0);
      else if (k < 0.55) cloud(nx, row, w + 1);
      else (island(nx, row, w), tops.push([nx, row, w, "step"]));
      x = nx + w;
      prev = row;
    }
  };
  bridge(3, r0, mx, mr);
  bridge(mx + mw, mr, 29, r1);
  // 높은 보물 섬: 구름을 밟고 올라가야 한다
  if (R() < 0.5) {
    const hx = mx + Math.floor(mw / 2) - 1, hr = Math.max(2, mr - 8);
    cloud(hx - 4, mr - 4, 3);
    island(hx, hr, 3);
    tops.push([hx + 1, hr, 1, "high"]);
  }
  const tier = (bonus) => {
    const rr = R() - bonus;
    return rr < 0.18 ? 2 : rr < 0.6 ? 1 : 0;
  };
  for (const [x, row, w, kind] of tops) {
    if (kind === "big") out.chests.push({ x: x + Math.floor(R() * Math.max(1, w)), row, tier: tier(0) });
    if (kind === "high") out.chests.push({ x, row, tier: tier(0.25) });
    if (kind === "arch" && R() < 0.5) out.chests.push({ x: x + Math.floor(w / 2), row, tier: tier(0.1) });
    if (kind === "step" && R() < 0.12) out.chests.push({ x, row, tier: 0 });
  }
  R() < 0.3 && out.spawns.push({ x: mx + 2, row: mr - 4, fly: 1 });
  // 땅에서 하늘로 오르는 사다리 (네 조각마다)
  if (S % 4 === 2) {
    let row = Ft - (b.cols[5]?.g || b.h) - 3, side = 0;
    const goal = r0 + 3;
    while (row > goal) {
      plat(side ? 6 : 2, row, 3);
      side ^= 1;
      row -= 3;
    }
  }
  return out;
}

// ── 지하 루트: 깊고 넓은 동굴 지대 ──
// 오르내리는 큰 굴(본길) + 위로 솟은 거대한 동굴방 + 오를 수 있는 바위 턱 + 물웅덩이.
// 세 조각마다 생물군계가 바뀐다. 강한 적이 많고 상자는 없으며, 가끔 중간 보스의 방이 있다.
const BIO_LIST = ["lush", "drip", "geode", "deep", "magma"];
export function carveUnderground(r, l, ctx) {
  const { S, seed, rng, vt, Ft, codes, hasL, hasR, mid, slopeCols, regionIdx = 0 } = ctx;
  const { fe, ze, plat } = codes;
  const set = (x, y, v) => x >= 0 && x < vt && y >= 0 && y < Ft && (r[y * vt + x] = v);
  const at = (x, y) => (x < 0 || x >= vt || y < 0 || y >= Ft ? fe : r[y * vt + x]);
  const R = () => rng.next();
  const top = Ft - UG;
  const out = { shafts: [], strong: [], mid: null, caves: [], floor: [], slopes: [], pools: [], ug: null };
  const base = S * vt;
  let bio = BIO_LIST[Math.floor(hh(Math.floor(S / 3), seed + 41) * BIO_LIST.length)];
  bio === "magma" && regionIdx < 3 && (bio = "drip");
  bio === "deep" && regionIdx < 1 && (bio = "lush");
  out.ug = { top, biome: bio, entrances: [] };
  // 본길 바닥: 크게 오르내린다 (한 칸에 1줄 이하 → 경사로 걸어갈 수 있다)
  const F = (gx) => Ft - 19 + Math.round(10 * (2 * vnoise(gx, 46, seed + 11) - 1));
  const CH = (gx) => 6 + Math.round(3 * vnoise(gx, 9, seed + 12));
  const xa = hasL ? 0 : 2, xb = hasR ? vt - 1 : vt - 3;
  const fl = {};
  for (let x = -1; x <= vt; x++) fl[x] = F(base + x);
  if (mid) {
    const fm = fl[16];
    for (let x = 0; x < vt; x++) {
      const t = x < 6 ? Math.max(0, (x - 1) / 5) : x > 25 ? Math.max(0, (30 - x) / 5) : 1;
      fl[x] = Math.round(fl[x] * (1 - t) + fm * t);
    }
  }
  for (let x = 0; x < vt; x++) for (let y = top; y < Ft; y++) set(x, y, fe);
  for (let x = 0; x < vt; x++) {
    out.floor[x] = fl[x];
    if (x < xa || x > xb) continue;
    let ct = fl[x] - CH(base + x);
    if (mid && x >= 4 && x <= 27) ct = fl[x] - (x < 6 || x > 25 ? 10 : 15);
    for (let y = ct; y < fl[x]; y++) set(x, y, ze);
    // 거대한 동굴방: 본길 위로 솟는다
    for (let y = top + 2; y < ct; y++) {
      const n = vn2(base + x, y, 13, 7, seed + 5) * 0.65 + vn2(base + x, y, 5, 4, seed + 6) * 0.35;
      n > 0.56 && set(x, y, ze);
    }
  }
  // 외톨이 바위 정리
  for (let x = xa + 1; x < xb; x++)
    for (let y = top + 1; y < Ft - 3; y++)
      at(x, y) === fe && at(x - 1, y) === ze && at(x + 1, y) === ze && at(x, y - 1) === ze && at(x, y + 1) === ze && set(x, y, ze);
  // 경사
  for (let x = xa; x <= xb; x++) {
    const f = fl[x];
    if (x < xb && fl[x + 1] === f - 1 && at(x, f - 1) === ze) out.slopes.push({ x, row: f - 1, code: 4 });
    else if (x > xa && fl[x - 1] === f - 1 && at(x, f - 1) === ze) out.slopes.push({ x, row: f - 1, code: 5 });
  }
  // 동굴방 안의 바위 턱 (3~4줄 간격)
  for (let x = xa + 2; x < xb - 3; x += 4 + Math.floor(R() * 4)) {
    const w = 2 + Math.floor(R() * 3);
    for (let y = fl[x] - CH(base + x) - 3; y > top + 2; y -= 3 + Math.floor(R() * 2)) {
      let ok = !0;
      for (let k = 0; k < w; k++) if (at(x + k, y) !== ze || at(x + k, y - 1) !== ze || at(x + k, y + 1) !== ze) ok = !1;
      if (ok) {
        for (let k = 0; k < w; k++) set(x + k, y, plat);
        R() < 0.25 && out.strong.push({ x: x + 1, row: y });
      }
    }
  }
  // 물웅덩이 (용암 지대 제외)
  if (bio !== "magma")
    for (let k = 0; k < 2; k++) {
      const w = 4 + Math.floor(R() * 4), x0 = xa + 3 + Math.floor(R() * Math.max(1, xb - xa - w - 6));
      let flat = !0;
      for (let x = x0 - 1; x <= x0 + w; x++) fl[x] !== fl[x0] && (flat = !1);
      if (!flat || out.slopes.some((s) => s.x >= x0 - 1 && s.x <= x0 + w)) continue;
      for (let x = x0; x < x0 + w; x++) for (let y = fl[x0]; y < fl[x0] + 2; y++) set(x, y, ze);
      out.pools.push({ x: x0, w, row: fl[x0], depth: 2 });
    }
  if (mid) {
    for (const [px, py] of [[7, 5], [22, 5], [12, 9], [17, 9]]) for (let k = 0; k < 3; k++) at(px + k, fl[px] - py) === ze && set(px + k, fl[px] - py, plat);
    out.mid = { x: 16, row: fl[16] };
  }
  // 오르내리는 구멍
  const want = [];
  !hasL && want.push(3);
  !hasR && want.push(vt - 6);
  !mid && R() < 0.5 && want.push(9 + Math.floor(R() * 12));
  for (let sx of want) {
    for (let k = 0; k < 6 && [0, 1, 2].some((d) => slopeCols.has(sx + d) || l[sx + d] <= 0); k++) sx += sx < 16 ? 1 : -1;
    if ([0, 1, 2].some((d) => slopeCols.has(sx + d) || l[sx + d] <= 0)) continue;
    let s = Ft;
    for (let x = sx; x < sx + 3; x++) s = Math.min(s, Ft - l[x]);
    const f = Math.min(fl[sx], fl[sx + 1], fl[sx + 2]);
    for (let x = sx; x < sx + 3; x++) {
      for (let y = s; y < fl[x]; y++) at(x, y) !== plat && set(x, y, ze);
      l[x] = Ft - fl[x];
    }
    let row = f - 3, side = 0;
    while (row > s) {
      set(side ? sx + 2 : sx, row, plat);
      side ^= 1;
      row -= 3;
    }
    out.shafts.push([sx, 3]);
    out.ug.entrances.push({ x: sx, w: 3, top: s });
  }
  out.slopes = out.slopes.filter((s) => !out.shafts.some(([sx]) => s.x >= sx && s.x < sx + 3) && !out.pools.some((p) => s.x >= p.x - 1 && s.x <= p.x + p.w));
  // 강한 적 (본길 바닥)
  const n = mid ? 2 : 3 + Math.floor(R() * 3);
  const busy = new Set(out.shafts.flatMap(([sx]) => [sx - 1, sx, sx + 1, sx + 2, sx + 3]));
  for (let k = 0; k < n * 4 && out.strong.length < n + 2; k++) {
    const x = xa + 3 + Math.floor(R() * Math.max(1, xb - xa - 6));
    if (busy.has(x) || at(x, fl[x] - 1) !== ze || at(x, fl[x] - 2) !== ze || at(x, fl[x]) === ze) continue;
    busy.add(x), busy.add(x + 1), busy.add(x - 1);
    out.strong.push({ x, row: fl[x] });
  }
  return out;
}
