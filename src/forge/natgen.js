// 자연 지형 생성기 — 구역 하나를 "밀도장"(4px 격자의 연속 값, 양수 = 바위)으로 만든다.
//
// 예전 방식(16px 칸 + 45° 경사 칸)으로는 사각형·삼각형·계단 모양을 벗어날 수 없어서, 지형 자체를
// 칸보다 촘촘한 연속 값으로 바꾸었다. 충돌·그림 모두 같은 장을 픽셀마다 쌍선형 보간해 쓰므로
// 보이는 윤곽과 밟는 윤곽이 1px까지 같다.
//
// 만드는 순서 (자연에서 지형이 생기는 과정을 흉내 낸다)
//  지상: 큰·중간·작은 잡음 겹침 → 단층(솟음·꺼짐) → 협곡 → 지층 경도에 따른 풍화(열 침식)
//        → 물길 침식(오목한 비탈) → 잔물결 → 가파른 면만 2D로 비틀어 돌출·오목·처마 → 굴러온 바위
//  땅속: 치즈(큰 공동)·스파게티(구불 통로)·수직 틈 잡음 → 뼈대 굴(입구·출구를 잇는 구불길) → 셀룰러 오토마타
//  하늘: 윗면은 평평하고 아래로 좁아지는 바위섬, 지역마다 모양 규칙이 다르다
//  끝으로 길찾기 검사: 입구에서 모든 출구에 닿고, 빠져나올 수 없는 구덩이가 없을 때까지
//        자연스러운 바위 턱·굴을 덧붙여 고친다 (사각형·45° 경사로 단순화하지 않는다)
import { makeNoise, rng, strHash, clamp, lerp, smooth } from "./noise.js";
import { profileOf, profileKey } from "./terrprof.js";

export const Q = 4; // 격자 간격 (px)
const TS = 16;
export const FLOOR = 70, UG_TOP = 76;
export const HEAD = 28; // 지나갈 수 있는 최소 높이 (몸 22px + 여유)
const BODY = 22;

// ── 밀도장 ───────────────────────────────────────────
export class ZField {
  constructor(LW, LH) {
    this.LW = LW;
    this.LH = LH;
    this.d = new Float32Array(LW * LH);
    this.WP = (LW - 1) * Q;
    this.HP = (LH - 1) * Q;
  }
  // 구역 안 연속 좌표(px)의 값
  v(x, y) {
    const LW = this.LW;
    let u = x / Q, w = y / Q;
    if (u < 0) u = 0;
    else if (u > LW - 1.000001) u = LW - 1.000001;
    if (w < 0) w = 0;
    else if (w > this.LH - 1.000001) w = this.LH - 1.000001;
    const i = u | 0, j = w | 0, fu = u - i, fv = w - j, k = j * LW + i, d = this.d;
    const a = d[k] + (d[k + 1] - d[k]) * fu, b = d[k + LW] + (d[k + LW + 1] - d[k + LW]) * fu;
    return a + (b - a) * fv;
  }
  // 픽셀 (px, py)가 바위인가 (픽셀 가운데에서 잰다)
  solid(px, py) {
    return this.v(px + 0.5, py + 0.5) > 0;
  }
}

// ── 구역 설계 (캐시) ─────────────────────────────────
const PLANS = new Map();
export const planCache = PLANS;
export function planOf(z, o) {
  const key = `${z.id}:${o.seed}`;
  let P = PLANS.get(key);
  if (P) {
    PLANS.delete(key);
    PLANS.set(key, P);
    return P;
  }
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  let best = null;
  const tries = [];
  for (let a = 0; a < 6; a++) {
    const Q2 = makePlan(z, o, a);
    tries.push(Q2.check);
    if (!best || Q2.check.score > best.check.score) best = Q2;
    if (Q2.check.ok) break;
  }
  best.tries = tries;
  best.ms = Math.round(((typeof performance !== "undefined" ? performance.now() : Date.now()) - t0) * 10) / 10;
  while (PLANS.size >= 5) PLANS.delete(PLANS.keys().next().value);
  PLANS.set(key, best);
  return best;
}

export function makePlan(z, o, attempt) {
  const prof = profileOf(z);
  const kind = prof.kind;
  const Ft = o.Ft ?? 116;
  const W = (z.c1 - z.c0) * 32, WP = W * TS, HP = Ft * TS;
  const LW = WP / Q + 1, LH = HP / Q + 1;
  const seed = (Math.imul((o.seed >>> 0) ^ 0x2545f491, 2654435761) ^ strHash(z.id) ^ Math.imul(attempt + 1, 0x9e3779b9)) >>> 0;
  const N = makeNoise(seed), R = rng(seed ^ 0xa511e9b3);
  const isZone = z.kind === "zone";
  const arenaFrom = isZone && z.boss ? WP - 64 * TS : WP;
  const P = {
    z, kind, prof, pkey: profileKey(z), attempt, seed, W, WP, HP, Ft, LW, LH, isZone, arenaFrom,
    F: new ZField(LW, LH), N, R,
    h: null, islands: [], pads: [], peak: null, deep: null, mouths: [], rooms: [], repairs: 0,
    upX: isZone && o.up >= 0 ? (o.up - z.c0) * 512 + 256 : -1,
    downX: isZone && o.down >= 0 ? (o.down - z.c0) * 512 + 256 : -1,
  };
  const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
  let t0 = now();
  if (kind === "ground") buildGround(P);
  else if (kind === "cave") buildCave(P);
  else buildSky(P);
  P.tm = { build: now() - t0, an: 0, rep: 0 };
  specks(P);
  // 고치기: 길이 이어질 때까지 자연스러운 턱·굴을 덧붙인다
  t0 = now();
  let A = analyze(P);
  P.tm.an += now() - t0;
  for (let it = 0; it < 26 && !A.ok; it++) {
    t0 = now();
    const fixed = repair(P, A);
    fixed && specks(P);
    P.tm.rep += now() - t0;
    if (!fixed) break;
    P.repairs++;
    t0 = now();
    A = analyze(P);
    P.tm.an += now() - t0;
  }
  P.check = { ok: A.ok, score: A.score, miss: A.miss, traps: A.trapCount, repairs: P.repairs };
  P.A = A;
  finishMeta(P, A);
  return P;
}

// 임시 버퍼 재사용 (구역마다 수 MB씩 새로 만들면 쓰레기 수거로 가끔 크게 멈춘다)
const SCR = new Map();
function scratch(name, Ctor, n) {
  let a = SCR.get(name);
  if (!a || a.length < n || !(a instanceof Ctor)) SCR.set(name, (a = new Ctor(Math.ceil(n * 1.05))));
  return a.subarray(0, n);
}

// ── 공용 도형 ────────────────────────────────────────
// 바위 더하기: F = max(F, sdf)  (sdf: 안쪽 양수, px)
function addShape(P, x0, y0, x1, y1, sdf) {
  const { F } = P, LW = F.LW, d = F.d;
  const i0 = Math.max(0, Math.floor(x0 / Q)), i1 = Math.min(LW - 1, Math.ceil(x1 / Q));
  const j0 = Math.max(0, Math.floor(y0 / Q)), j1 = Math.min(F.LH - 1, Math.ceil(y1 / Q));
  for (let j = j0; j <= j1; j++)
    for (let i = i0; i <= i1; i++) {
      const v = sdf(i * Q, j * Q);
      const k = j * LW + i;
      if (v > d[k]) d[k] = v > 12 ? 12 : v;
    }
}
// 파내기: F = min(F, -sdf)
function cutShape(P, x0, y0, x1, y1, sdf) {
  const { F } = P, LW = F.LW, d = F.d;
  const i0 = Math.max(0, Math.floor(x0 / Q)), i1 = Math.min(LW - 1, Math.ceil(x1 / Q));
  const j0 = Math.max(0, Math.floor(y0 / Q)), j1 = Math.min(F.LH - 1, Math.ceil(y1 / Q));
  for (let j = j0; j <= j1; j++)
    for (let i = i0; i <= i1; i++) {
      const v = -sdf(i * Q, j * Q);
      const k = j * LW + i;
      if (v < d[k]) d[k] = v < -12 ? -12 : v;
    }
}
// 평평한 바닥 (칸 경계에 정확히): 문·보스 방·함정 자리. 위쪽 공기는 얇게만 (방 모양은 따로 판다)
function flatFloor(P, xa, xb, yF, above = 12, below = 28, feather = 20) {
  const { F } = P, LW = F.LW, d = F.d;
  const FA = 12, FB = 12;
  const i0 = Math.max(0, Math.floor((xa - feather) / Q)), i1 = Math.min(LW - 1, Math.ceil((xb + feather) / Q));
  const j0 = Math.max(0, Math.floor((yF - above - FA) / Q)), j1 = Math.min(F.LH - 1, Math.ceil((yF + below + FB) / Q));
  for (let j = j0; j <= j1; j++) {
    const y = j * Q;
    let t = y - yF;
    t = t > 8 ? 8 : t < -8 ? -8 : t;
    // 띠 안은 정확히, 띠 바깥은 원래 값으로 부드럽게
    const vy = y < yF - above ? smooth((y - (yF - above - FA)) / FA) : y > yF + below ? smooth((yF + below + FB - y) / FB) : 1;
    if (vy <= 0) continue;
    for (let i = i0; i <= i1; i++) {
      const x = i * Q;
      const wx = x < xa ? smooth(1 - (xa - x) / feather) : x > xb ? smooth(1 - (x - xb) / feather) : 1;
      const w = wx * vy;
      if (w <= 0) continue;
      const k = j * LW + i;
      // 바닥 위 공기는 반드시 비우고(min), 아래 바위는 반드시 채운다(max)
      const cur = d[k];
      const tgt = y < yF ? Math.min(cur, t) : Math.max(cur, t);
      d[k] = cur + (tgt - cur) * w;
    }
  }
}

// 바위섬 (윗면은 x의 함수라 반드시 밟을 수 있다)
// 밑면 = 얕은 몸통 + 아래로 처진 덩어리 여러 개(위치·폭·깊이 제각각) + 두 겹 거친 잡음 → 원뿔·반원이 아닌 불규칙한 바윗덩이
// st: rock | cloud | garden | spire | ledge
function island(P, cx, top, w, t, st, opt = {}) {
  const { N, R } = P;
  const hw = w / 2, so = R() * 1000;
  const tilt = st === "ledge" ? R.range(-0.02, 0.02) : R.range(-0.05, 0.05);
  const lipL = R.range(0.7, 0.9), lipR = R.range(0.7, 0.9), rimD = st === "cloud" ? R.range(8, 14) : R.range(4, 11);
  const body = st === "spire" ? 0.44 : st === "cloud" ? 0.4 : st === "ledge" ? 0.62 : st === "garden" ? 0.42 : 0.34;
  const nl = opt.lobes ?? (st === "ledge" ? R.int(0, 1) : st === "spire" ? R.int(1, 3) : R.int(2, 4));
  const lobes = [];
  for (let k = 0; k < nl; k++) {
    const s = st === "spire" ? R.range(0.22, 0.42) : st === "cloud" ? R.range(0.32, 0.66) : R.range(0.2, 0.48);
    lobes.push({ u: R.range(-0.66, 0.66), s, d: t * (k === 0 ? R.range(0.8, 1) : R.range(0.4, 0.85)) });
  }
  const crag = st === "spire" ? 0.32 : st === "cloud" ? 0.1 : st === "garden" ? 0.16 : 0.24;
  const topAt =
    opt.topFn ??
    ((x) => {
      const u = (x - cx) / hw, au = u < 0 ? -u : u;
      const lip = u < 0 ? lipL : lipR;
      const r = au > lip ? (au - lip) / (1 - lip) : 0;
      return top + tilt * (x - cx) + 1.5 * N.n1(x / 23 + so) + r * r * rimD;
    });
  const botAt = (x) => {
    const u = (x - cx) / hw, au = u < 0 ? -u : u;
    const env = 1 - au * au;
    if (env <= 0) return topAt(x);
    let dep = t * body * Math.sqrt(env);
    const e3 = env * 3 < 1 ? env * 3 : 1;
    for (const L of lobes) {
      const v = (u - L.u) / L.s, q = 1 - v * v;
      if (q <= 0) continue;
      const lv = L.d * (st === "spire" ? q * Math.sqrt(q) : q) * e3;
      dep = dep > lv ? dep + lv * 0.18 : lv + dep * 0.18;
    }
    const n = 0.5 + 0.5 * N.fbm1(x / (st === "spire" ? 10 : 17) + so + 7, 3);
    dep *= 1 - crag + 2 * crag * n;
    dep += 3 * N.n1(x / 5 + so);
    return topAt(x) + (dep > 6 ? dep : 6);
  };
  // 격자 세로줄마다 윗면·밑면을 한 번만 재서 채운다
  {
    const { F } = P, LW = F.LW, LH = F.LH, d = F.d;
    const i0 = Math.max(0, Math.ceil((cx - hw) / Q)), i1 = Math.min(LW - 1, Math.floor((cx + hw) / Q));
    for (let i = i0; i <= i1; i++) {
      const x = i * Q, u = (x - cx) / hw;
      if (u <= -1 || u >= 1) continue;
      const tp = topAt(x), bt = botAt(x), c = (1 - (u < 0 ? -u : u)) * hw;
      const j0 = Math.max(0, Math.floor((tp - 12) / Q)), j1 = Math.min(LH - 1, Math.ceil((bt + 12) / Q));
      for (let j = j0; j <= j1; j++) {
        const y = j * Q, a = y - tp, b = bt - y;
        let v = a < b ? (a < c ? a : c) : b < c ? b : c;
        const k = j * LW + i;
        if (v > d[k]) d[k] = v > 12 ? 12 : v;
      }
    }
  }
  opt.keep !== false && P.islands.push({ cx, top, w, t, st });
  // 붙은 작은 바위 (크고 작은 바위가 이어진 모양)
  if (opt.sub !== false && w > 70 && st !== "ledge") {
    const n = R.int(0, st === "spire" ? 2 : 1);
    for (let k = 0; k < n; k++) {
      const side = R() < 0.5 ? -1 : 1;
      const sw = w * R.range(0.2, 0.38);
      const sx = cx + side * (hw - sw * R.range(0.15, 0.55));
      const stp = top + R.range(14, Math.max(16, t * 0.45));
      island(P, sx, stp, sw, sw * R.range(0.5, 1.1), st === "cloud" ? "rock" : st, { sub: false, keep: false });
    }
  }
}
// 지상·동굴 구역의 세계 맨 아래는 늘 막혀 있게 (고치기 굴이 바닥을 뚫어 세계 밖으로 떨어지는 일이 없게)
function sealBottom(P) {
  if (P.kind === "sky") return;
  const { F } = P, LW = F.LW, d = F.d;
  for (let j = Math.floor((P.HP - 40) / Q); j < F.LH; j++) for (let i = 0, o = j * LW; i < LW; i++) d[o + i] < 4 && (d[o + i] = 4);
}
// 최종 장에서 떠 있는 아주 작은 바위 부스러기를 지운다 (파내기·깎기로 쪼개진 조각 등). 섬은 훨씬 크다
function specks(P, minPts = 20) {
  sealBottom(P);
  const { F } = P, LW = F.LW, LH = F.LH, d = F.d, n = d.length;
  const seen = scratch("SK", Uint8Array, n).fill(0), q = scratch("SQ", Int32Array, n);
  for (let s = 0; s < n; s++) {
    if (seen[s] || d[s] <= 0) continue;
    let h = 0, t = 0, border = false;
    q[t++] = s;
    seen[s] = 1;
    while (h < t) {
      const k = q[h++], j = (k / LW) | 0, i = k - j * LW;
      if (i === 0 || j === 0 || i === LW - 1 || j === LH - 1) border = true;
      if (i > 0 && !seen[k - 1] && d[k - 1] > 0) ((seen[k - 1] = 1), (q[t++] = k - 1));
      if (i < LW - 1 && !seen[k + 1] && d[k + 1] > 0) ((seen[k + 1] = 1), (q[t++] = k + 1));
      if (j > 0 && !seen[k - LW] && d[k - LW] > 0) ((seen[k - LW] = 1), (q[t++] = k - LW));
      if (j < LH - 1 && !seen[k + LW] && d[k + LW] > 0) ((seen[k + LW] = 1), (q[t++] = k + LW));
    }
    if (!border && t < minPts) for (let m = 0; m < t; m++) d[q[m]] = -2;
  }
}
// 작은 덩어리 지우기: 셀룰러 오토마타 뒤에도 남은 작은 공기 주머니·떠 있는 바위 조각
function prune(B, LW, LH, minAir, minRock, ja = 0, jb = LH - 1) {
  if (jb < ja) return;
  const n = B.length, seen = scratch("PS", Uint8Array, n).fill(0), q = scratch("PQ", Int32Array, (jb - ja + 1) * LW);
  const kA = ja * LW, kB = (jb + 1) * LW;
  for (let s = kA; s < kB; s++) {
    if (seen[s]) continue;
    const val = B[s];
    let h = 0, t = 0, border = false;
    q[t++] = s;
    seen[s] = 1;
    while (h < t) {
      const k = q[h++], j = (k / LW) | 0, i = k - j * LW;
      if (i === 0 || j <= ja || i === LW - 1 || j >= jb) border = true;
      if (i > 0 && !seen[k - 1] && B[k - 1] === val) ((seen[k - 1] = 1), (q[t++] = k - 1));
      if (i < LW - 1 && !seen[k + 1] && B[k + 1] === val) ((seen[k + 1] = 1), (q[t++] = k + 1));
      if (j > ja && !seen[k - LW] && B[k - LW] === val) ((seen[k - LW] = 1), (q[t++] = k - LW));
      if (j < jb && !seen[k + LW] && B[k + LW] === val) ((seen[k + LW] = 1), (q[t++] = k + LW));
    }
    if (val === 0 ? t < minAir : !border && t < minRock) for (let m = 0; m < t; m++) B[q[m]] = 1 - val;
  }
}

// 굴 파기: 점 목록을 따라 반지름이 바뀌는 둥근 굴 (바닥은 조금 평평하게)
function carveWormB(P, B, pts, r0, r1, flat = 0.82) {
  const { LW, LH, N } = P;
  const so = P.R() * 999;
  let s = 0;
  for (let k = 0; k < pts.length; k++) {
    const [px, py] = pts[k];
    if (k) {
      const ex = px - pts[k - 1][0], ey = py - pts[k - 1][1];
      s += Math.sqrt(ex * ex + ey * ey);
    }
    // 굵기: 긴 물결 + 짧은 물결 (좁아졌다 넓어지는 통로)
    const r = lerp(r0, r1, 0.5 + 0.5 * N.n1(s / 70 + so)) * (0.82 + 0.36 * (0.5 + 0.5 * N.n1(s / 23 + so + 41)));
    const rx = r * 1.18, ryU = r, ryD = r * flat;
    const i0 = Math.max(1, Math.floor((px - rx) / Q)), i1 = Math.min(LW - 2, Math.ceil((px + rx) / Q));
    const j0 = Math.max(1, Math.floor((py - ryU) / Q)), j1 = Math.min(LH - 2, Math.ceil((py + ryD) / Q));
    for (let j = j0; j <= j1; j++) {
      const dy = j * Q - py, ry = dy < 0 ? ryU : ryD;
      for (let i = i0; i <= i1; i++) {
        const dx = (i * Q - px) / rx, ddy = dy / ry;
        if (dx * dx + ddy * ddy < 1) B[j * LW + i] = 0;
      }
    }
  }
}
// 사행(蛇行) 길: 관성 있는 무작위 걸음이 목표 쪽으로 점점 끌려간다 → 직선·45° 대각선이 아닌 굽이치는 굴
// wig: 굽이 세기, wl: 굽이 길이(px)
function meander(P, ax, ay, bx, by, wig = 0.7, wl = 90, step = 10) {
  const { N, R } = P;
  const L0 = Math.sqrt((bx - ax) * (bx - ax) + (by - ay) * (by - ay)) || 1;
  const so = R() * 700;
  let x = ax, y = ay, dx = (bx - ax) / L0, dy = (by - ay) / L0;
  // 처음 방향도 조금 비튼다
  const k0 = R.range(-0.6, 0.6);
  ((dx = dx - dy * k0), (dy = dy + ((bx - ax) / L0) * k0));
  let n0 = Math.sqrt(dx * dx + dy * dy);
  ((dx /= n0), (dy /= n0));
  let pts = [[x, y]];
  const maxS = Math.ceil((L0 * 2.2) / step) + 8;
  for (let k = 0; k < maxS; k++) {
    const tx = bx - x, ty = by - y, tl = Math.sqrt(tx * tx + ty * ty);
    if (tl < step * 1.6) break;
    const n = N.fbm1((k * step) / wl + so, 2);
    let nx = dx - dy * n * wig, ny = dy + dx * n * wig;
    // 처음엔 거의 제멋대로, 갈수록(그리고 목표가 가까울수록) 목표 쪽으로
    const prog = (k * step) / (L0 * 1.5);
    const pull = Math.min(0.7, 0.04 + 0.3 * prog + (tl < 120 ? 0.3 : 0));
    nx = nx * (1 - pull) + (tx / tl) * pull;
    ny = ny * (1 - pull) + (ty / tl) * pull;
    const nl = Math.sqrt(nx * nx + ny * ny) || 1;
    dx = nx / nl;
    dy = ny / nl;
    x += dx * step;
    y += dy * step;
    pts.push([x, y]);
  }
  pts.push([bx, by]);
  return resample(smoothPts(pts, 2));
}
function smoothPts(pts, it) {
  for (let r = 0; r < it; r++) {
    const q = [pts[0]];
    for (let k = 0; k < pts.length - 1; k++) {
      const [x0, y0] = pts[k], [x1, y1] = pts[k + 1];
      q.push([x0 * 0.75 + x1 * 0.25, y0 * 0.75 + y1 * 0.25], [x0 * 0.25 + x1 * 0.75, y0 * 0.25 + y1 * 0.75]);
    }
    q.push(pts[pts.length - 1]);
    pts = q;
  }
  return pts;
}
function resample(pts, gap = 4) {
  const out = [pts[0]];
  let acc = 0;
  for (let k = 1; k < pts.length; k++) {
    const [x0, y0] = pts[k - 1], [x1, y1] = pts[k];
    const seg = Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0));
    acc += seg;
    while (acc >= gap) {
      acc -= gap;
      const t = 1 - acc / (seg || 1);
      out.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
// 경유점들을 차례로 사행 길로 잇는다
function meanderVia(P, way, wig, wl) {
  const out = [];
  for (let k = 0; k < way.length - 1; k++) out.push(...meander(P, way[k][0], way[k][1], way[k + 1][0], way[k + 1][1], wig, wl));
  return out;
}

// ── 동굴 바위 지도 (1 = 바위) ─────────────────────────
// 8px 간격으로 잡음을 재고(빠르게) 4px 격자로 보간해 문턱값을 넘는지 본다
function caveRock(P, cp, limit) {
  const { LW, LH, N } = P;
  const LW8 = ((LW - 1) >> 1) + 1, LH8 = ((LH - 1) >> 1) + 1;
  const A8 = scratch("A8", Float32Array, LW8 * LH8).fill(-1);
  const ch = cp.cheese, sp = cp.spag, vt = cp.vert, pl = cp.pillars;
  const warp = cp.warp ?? 40;
  for (let j = 0; j < LH8; j++) {
    const y = j * 8;
    for (let i = 0; i < LW8; i++) {
      const x = i * 8;
      const lim = limit(x, y);
      if (lim <= -1) continue;
      const wx = warp * N.n2(x / 190 + 3.3, y / 190 + 1.7), wy = warp * 0.65 * N.n2(x / 190 + 8.1, y / 190 + 5.9);
      const X = x + wx, Y = y + wy;
      let air = -1;
      if (ch) {
        const c = N.fbm2(X / ch.wl, Y / (ch.wl * ch.aniso), 3);
        air = Math.max(air, (c - ch.thr) * 5);
      }
      if (sp) {
        const w = lerp(sp.w[0], sp.w[1], 0.5 + 0.5 * N.n2(x / 420 + 2.2, y / 420 + 6.6));
        const s = N.n2(X / sp.wl + 31.1, Y / (sp.wl * sp.aniso) + 17.3);
        air = Math.max(air, (w - Math.abs(s)) * 14);
      }
      if (vt) {
        const w = lerp(vt.w[0], vt.w[1], 0.5 + 0.5 * N.n2(x / 380 + 4.4, y / 380 + 9.9));
        const s = N.n2(X / (vt.wl * 0.32) + 51.5, Y / vt.wl + 23.3);
        air = Math.max(air, (w - Math.abs(s)) * 12);
      }
      if (air > 0 && pl) {
        const p = N.n2(x / pl.wl + 61.1, y / (pl.wl * 3.4) + 37.7);
        if (p > pl.thr) air = Math.min(air, (pl.thr - p) * 6);
      }
      A8[j * LW8 + i] = air + lim;
    }
  }
  const B = scratch("B", Uint8Array, LW * LH);
  for (let j = 0; j < LH; j++) {
    const j8 = j >> 1, fj = (j & 1) * 0.5, j8b = Math.min(LH8 - 1, j8 + 1);
    for (let i = 0; i < LW; i++) {
      const i8 = i >> 1, fi = (i & 1) * 0.5, i8b = Math.min(LW8 - 1, i8 + 1);
      const a = A8[j8 * LW8 + i8], b = A8[j8 * LW8 + i8b], c = A8[j8b * LW8 + i8], e = A8[j8b * LW8 + i8b];
      const v = (a + (b - a) * fi) * (1 - fj) + (c + (e - c) * fi) * fj;
      B[j * LW + i] = v > 0 ? 0 : 1;
    }
  }
  return B;
}
// 공기가 있는 줄 범위 (위아래 여유 포함) — 그 바깥은 전부 바위라 계산할 필요가 없다
function airRows(B, LW, LH, pad = 6) {
  let a = -1, b = -1;
  for (let j = 0; j < LH; j++) {
    const o = j * LW;
    for (let i = 0; i < LW; i++)
      if (!B[o + i]) {
        a < 0 && (a = j);
        b = j;
        break;
      }
  }
  return a < 0 ? [0, -1] : [Math.max(0, a - pad), Math.min(LH - 1, b + pad)];
}
// 셀룰러 오토마타: 3×3 안 바위가 5칸 이상이면 바위 (잡티 제거·둥글게)
function caSmooth(B, LW, LH, iters, ja = 0, jb = LH - 1) {
  let a = B, b = scratch("CA", Uint8Array, B.length);
  b.set(a);
  const row = new Uint8Array(LW);
  const j0 = Math.max(1, ja), j1 = Math.min(LH - 2, jb);
  for (let it = 0; it < iters; it++) {
    for (let j = j0; j <= j1; j++) {
      const o = j * LW;
      // 세로 3칸 합
      for (let i = 0; i < LW; i++) row[i] = a[o - LW + i] + a[o + i] + a[o + LW + i];
      for (let i = 1; i < LW - 1; i++) b[o + i] = row[i - 1] + row[i] + row[i + 1] >= 5 ? 1 : 0;
    }
    const t = a;
    a = b;
    b = t;
  }
  if (a !== B) B.set(a);
}
// 바위 지도 → 부드러운 장 (흐림 두 번, px 단위 ±4). ja..jb 바깥 줄은 바위(+4)
function blurToField(B, LW, LH, ja = 0, jb = LH - 1) {
  const n = B.length, f = scratch("BF", Float32Array, n).fill(4);
  if (jb < ja) return f;
  const r0 = Math.max(0, ja - 2), r1 = Math.min(LH - 1, jb + 2), RN = r1 - r0 + 1;
  const a = scratch("BA", Float32Array, RN * LW), g = scratch("BG", Float32Array, RN * LW);
  for (let j = 0; j < RN; j++) for (let i = 0, o = (r0 + j) * LW, p = j * LW; i < LW; i++) a[p + i] = B[o + i] ? 1 : -1;
  const T = 1 / 3;
  for (let pass = 0; pass < 2; pass++) {
    for (let j = 0; j < RN; j++) {
      const o = j * LW;
      g[o] = (a[o] * 2 + a[o + 1]) * T;
      for (let i = 1; i < LW - 1; i++) g[o + i] = (a[o + i - 1] + a[o + i] + a[o + i + 1]) * T;
      g[o + LW - 1] = (a[o + LW - 2] + a[o + LW - 1] * 2) * T;
    }
    for (let j = 0; j < RN; j++) {
      const o = j * LW, up = j > 0 ? o - LW : -1, dn = j < RN - 1 ? o + LW : -1;
      for (let i = 0; i < LW; i++) a[o + i] = ((up < 0 ? 1 : g[up + i]) + g[o + i] + (dn < 0 ? 1 : g[dn + i])) * T;
    }
  }
  for (let j = 0; j < RN; j++) for (let i = 0, o = (r0 + j) * LW, p = j * LW; i < LW; i++) f[o + i] = a[p + i] * 4;
  return f;
}

// ── 지상 ─────────────────────────────────────────────
function surfaceHeights(P) {
  const { prof: S, LW, WP, N, R } = P;
  const h = new Float64Array(LW), ro = new Float64Array(LW);
  const base = FLOOR * TS;
  const M = S.macro, Me = S.meso, Wp = S.warp, Ro = S.rough;
  const flip = R() < 0.5;
  for (let i = 0; i < LW; i++) {
    const x = i * Q;
    const xw = x + Wp.amp * N.fbm1(x / Wp.wl + 11.3, 2);
    ro[i] = lerp(Ro.lo, Ro.hi, smooth(0.5 + 0.65 * N.fbm1(x / Ro.wl + 71.7, 2)));
    let mac = N.fbm1(xw / M.wl + 3.1, 3);
    if (M.ridge > 0) mac = lerp(mac, 2 * N.ridge1(xw / M.wl + 41.9, 3) - 1, M.ridge);
    let e = M.amp * mac + Me.amp * ro[i] * N.fbm1(xw / Me.wl + 19.7, 3);
    if (S.dunes) {
      // 사구: 바람받이는 길고 완만하게, 미끄럼면은 짧고 가파르게 (안식각은 풍화가 정한다)
      const D = S.dunes, xd = flip ? WP - x : x;
      const ph = xd / D.wl + 0.4 * N.fbm1(xd / (D.wl * 2.6) + 5.5, 2);
      const k = Math.floor(ph), t = ph - k;
      const a = D.asym;
      const p = t < a ? smooth(t / a) : 1 - smooth((t - a) / (1 - a));
      const amp = D.amp * (0.4 + 0.8 * (0.5 + 0.5 * N.n1(k * 0.61 + 9.3)));
      e += amp * (p - 0.5) * ro[i];
    }
    h[i] = base - e;
  }
  // 단층: 한쪽이 솟거나 꺼진 급경사, 또는 솟은 땅덩이(탁상지)·꺼진 땅(지구대)
  const F0 = S.faults;
  for (let k = R.int(F0.n[0], F0.n[1]); k > 0; k--) {
    const xf = R.range(0.14, 0.82) * WP;
    const hf = R.range(F0.h[0], F0.h[1]) * (R() < 0.5 ? 1 : -1);
    const wf = R.range(F0.w[0], F0.w[1]);
    const block = R() < 0.6 ? R.range(180, 560) : 0;
    const wf2 = R.range(F0.w[0], F0.w[1]) * R.range(1, 2.5);
    for (let i = 0; i < LW; i++) {
      const x = i * Q;
      let s = smooth((x - xf) / wf + 0.5);
      if (block) s *= 1 - smooth((x - xf - block) / wf2 + 0.5);
      h[i] -= hf * s;
    }
  }
  // 산괴: 크게 솟은 산덩어리 (산악 지역). 양쪽 비탈 길이가 다르고, 능선 잡음으로 봉우리가 제각각
  const MS = S.massif;
  if (MS)
    for (let k = R.int(MS.n[0], MS.n[1]); k > 0; k--) {
      const xm = R.range(0.2, 0.75) * Math.min(WP, P.arenaFrom), hm = R.range(MS.h[0], MS.h[1]), wm = R.range(MS.w[0], MS.w[1]);
      const as = R.range(0.55, 1.45), so = R() * 99;
      for (let i = 0; i < LW; i++) {
        const x = i * Q;
        const t = (x - xm) / ((wm * (x < xm ? as : 2 - as)) / 2);
        if (t <= -1 || t >= 1) continue;
        const q = 1 - t * t;
        h[i] -= hm * q * q * (0.6 + 0.4 * N.ridge1(x / 240 + so, 3));
      }
    }
  // 협곡·골짜기 (양쪽 비탈이 다른 비대칭)
  const V = S.valleys;
  for (let k = R.int(V.n[0], V.n[1]); k > 0; k--) {
    const xv = R.range(0.15, 0.8) * WP, dv = R.range(V.d[0], V.d[1]), wv = R.range(V.w[0], V.w[1]);
    const as = R.range(0.55, 1.45);
    for (let i = 0; i < LW; i++) {
      const x = i * Q;
      const t = (x - xv) / (wv * (x < xv ? as : 2 - as));
      if (t <= -1 || t >= 1) continue;
      const q = 1 - Math.abs(t);
      h[i] += dv * q * Math.sqrt(q) * (0.6 + 0.4 * q);
    }
  }
  // 풍화(열 침식): 비탈이 안식각보다 가파르면 위의 흙이 아래로 흘러내린다. 단단한 지층은 버틴다(절벽이 남는다)
  const E = S.erosion;
  const hardAt = (x, y) => {
    const v = N.n2(x / 900 + 9.1, y / E.layerWl + 3.7) * 0.7 + N.n2(x / 300 + 1.3, y / (E.layerWl * 0.5)) * 0.3;
    return E.layerAmt * smooth((v + 0.05) / 0.5);
  };
  const tal = new Float64Array(LW);
  for (let it = 0; it < E.iters; it++) {
    if (it % 10 === 0)
      for (let i = 0; i < LW; i++) tal[i] = Q * lerp(E.soft, E.hard, hardAt(i * Q, h[i]));
    const fw = it & 1;
    for (let k = 0; k < LW - 1; k++) {
      const i = fw ? k : LW - 2 - k;
      const d = h[i + 1] - h[i];
      const top = d > 0 ? i : i + 1;
      const ad = d > 0 ? d : -d, lim = tal[top];
      if (ad > lim) {
        const m = (ad - lim) * 0.25;
        if (d > 0) ((h[i] += m), (h[i + 1] -= m));
        else ((h[i] -= m), (h[i + 1] += m));
      }
    }
  }
  // 물길 침식: 위에서 모인 물이 많을수록 비탈 아래쪽을 더 깎는다 → 오목한 비탈, 넓은 골짜기 바닥
  const St = S.stream;
  if (St && St.k > 0) {
    const A = new Float64Array(LW), D = new Int32Array(LW), ord = new Int32Array(LW);
    for (let it = 0; it < St.iters; it++) {
      for (let i = 0; i < LW; i++) ord[i] = i;
      ord.sort((a, b) => h[a] - h[b]);
      A.fill(1);
      for (let q = 0; q < LW; q++) {
        const i = ord[q];
        const l = i > 0 ? h[i - 1] : -1e9, r = i < LW - 1 ? h[i + 1] : -1e9;
        let dn = -1;
        if (l > h[i] || r > h[i]) dn = l > r ? i - 1 : i + 1;
        D[i] = dn;
        dn >= 0 && (A[dn] += A[i]);
      }
      for (let i = 0; i < LW; i++) {
        const dn = D[i];
        if (dn < 0) continue;
        const drop = h[dn] - h[i];
        const ero = Math.min(drop * 0.45, St.k * Math.sqrt(A[i] / 25) * (drop / Q) * 2);
        h[i] += ero;
      }
    }
  }
  // 잔물결
  const Mi = S.micro;
  for (let i = 0; i < LW; i++) h[i] += Mi.amp * ro[i] * N.fbm1((i * Q) / Mi.wl + 91.3, 2);
  // 높이 범위 (넘치면 눌러 담는다)
  const top = S.band[0] * TS, bot = S.band[1] * TS;
  for (let i = 0; i < LW; i++) {
    if (h[i] < top + 48) h[i] = top + 48 - (top + 48 - h[i]) * 0.35;
    if (h[i] > bot - 32) h[i] = bot - 32 + (h[i] - (bot - 32)) * 0.35;
  }
  P.ro = ro;
  return h;
}
function flattenH(h, xa, xb, y, feather) {
  for (let i = 0; i < h.length; i++) {
    const x = i * Q;
    if (x >= xa && x <= xb) h[i] = y;
    else if (x > xa - feather && x < xa) h[i] = lerp(h[i], y, smooth((x - (xa - feather)) / feather));
    else if (x > xb && x < xb + feather) h[i] = lerp(h[i], y, smooth(1 - (x - xb) / feather));
  }
}
function buildGround(P) {
  const { prof: S, LW, LH, WP, N, R, F, arenaFrom } = P;
  const h = surfaceHeights(P);
  const base = FLOOR * TS;
  // 구역 양 끝: 출구 자리(평평, 칸 경계) → 자연 지형으로 부드럽게
  flattenH(h, 0, 132, base, 300);
  flattenH(h, arenaFrom < WP ? arenaFrom - 40 : WP - 132, WP, base, arenaFrom < WP ? 260 : 300);
  // 평평한 자리(함정·웅덩이·쉼터): 분지 바닥이나 완만한 언덕 위를 칸 경계 높이로 고른다
  const pads = [];
  const nPads = R.int(S.pads.n[0], S.pads.n[1]);
  for (let k = 0, tries = 0; k < nPads && tries < 80; tries++) {
    const wT = R.int(S.pads.w[0], S.pads.w[1]);
    const xa = Math.round(R.range(260, Math.min(WP, arenaFrom) - 300 - wT * TS) / TS) * TS;
    const xb = xa + wT * TS;
    if (pads.some((p) => xa < p.xb + 160 && xb > p.xa - 160)) continue;
    if (P.upX >= 0 && Math.abs((xa + xb) / 2 - P.upX) < 220) continue;
    let lo = 1e9, hi = -1e9, sum = 0, n = 0;
    for (let x = xa; x <= xb; x += Q) {
      const v = h[x / Q];
      lo = Math.min(lo, v);
      hi = Math.max(hi, v);
      sum += v;
      n++;
    }
    if (hi - lo > 40) continue;
    // 분지라면 아래로(물이 고이는 높이), 아니면 평균 높이
    const basin = h[xa / Q - 8] < hi - 4 && h[xb / Q + 8] < hi - 4;
    const yP = Math.round((basin ? hi : sum / n) / TS) * TS;
    flattenH(h, xa, xb, yP, 56);
    pads.push({ xa, xb, y: yP, basin });
    k++;
  }
  P.pads = pads;
  P.h = h;
  // 비탈 가파름 (돌출·처마 비틀기 세기)
  const st = new Float64Array(LW);
  for (let i = 0; i < LW; i++) {
    let s = 0;
    for (let k = -3; k <= 3; k++) {
      const a = Math.max(0, Math.min(LW - 1, i + k - 1)), b = Math.max(0, Math.min(LW - 1, i + k + 1));
      s = Math.max(s, Math.abs(h[b] - h[a]) / (2 * Q));
    }
    st[i] = s;
  }
  const flatMask = new Float64Array(LW);
  for (let i = 0; i < LW; i++) {
    const x = i * Q;
    let m = 0;
    if (x < 150 || x > Math.min(WP, arenaFrom) - 150) m = 1;
    for (const p of pads) if (x > p.xa - 24 && x < p.xb + 24) m = 1;
    flatMask[i] = m;
  }
  const hAt = (x) => {
    const u = x / Q;
    if (u <= 0) return h[0];
    if (u >= LW - 1) return h[LW - 1];
    const i = u | 0, f = u - i;
    return h[i] + (h[i + 1] - h[i]) * f;
  };
  const OV = S.overhang, GR = S.grain;
  const Fs = F.d;
  for (let j = 0; j < LH; j++) {
    const y = j * Q;
    for (let i = 0; i < LW; i++) {
      const hy = h[i];
      let f;
      if (y < hy - 160) f = -12;
      else if (y > hy + 160) f = 12;
      else {
        const x = i * Q, fm = 1 - flatMask[i];
        const ax = OV.amp * clamp(st[i] - 0.55, 0, 1.6) * fm;
        let xs = x;
        if (ax > 0.4) xs = x + ax * N.fbm2(x / OV.wl + 13.7, y / OV.wl + 2.9, 2);
        const gy = GR.amp * fm * N.n2(x / GR.wl + 7.7, y / GR.wl + 4.4);
        f = y + gy - hAt(xs);
        f = f > 12 ? 12 : f < -12 ? -12 : f;
      }
      Fs[j * LW + i] = f;
    }
  }
  // 땅속 동굴
  const cp = S.caves;
  const bottom = (P.Ft - 5) * TS;
  const B = caveRock(P, cp, (x, y) => {
    if (y > bottom - 24 || x < 70 || x > WP - 70) return -1;
    const hs = hAt(x);
    const d = y - (hs + cp.top);
    if (d < 0) return -1;
    if (x > arenaFrom - 60) return -1;
    // 깊을수록 굴이 잘 생긴다, 바닥 가까이는 줄어든다
    return -0.35 + 0.35 * smooth(d / 120) - 0.5 * smooth((y - (bottom - 110)) / 86);
  });
  // 뼈대: 아래 굴(▼ 문) + 지표에서 비스듬히 내려가는 입구
  const wR = cp.worm;
  const xb0 = R.range(180, 300), xb1 = Math.min(arenaFrom - 120, WP - R.range(220, 340));
  // 아래 굴: 깊이가 오르내리는 경유점들을 사행 길로
  const bw = [[xb0, R.range(1500, 1620)]];
  for (let k = 1, n = R.int(3, 5); k < n; k++) bw.push([lerp(xb0, xb1, k / n) + R.range(-120, 120), R.range(1440, 1650)]);
  bw.push([xb1, R.range(1500, 1620)]);
  const botPath = meanderVia(P, bw, 0.75, 110);
  carveWormB(P, B, botPath, wR[0], wR[1]);
  P.botPath = botPath;
  if (P.downX >= 0) {
    const dx = clamp(P.downX + R.range(-120, 120), 200, arenaFrom - 200);
    const dy = Math.min(bottom - 64, botY(botPath, dx) + R.range(-8, 20));
    P.deep = { x: dx, y: Math.round(dy / TS) * TS };
    room(P, B, dx, P.deep.y, R.range(60, 84), R.range(38, 52));
  }
  const nm = P.isZone ? 2 : 1;
  const mxs = [R.range(380, 860), R.range(1700, Math.max(1800, Math.min(arenaFrom, WP) - 900))];
  for (let k = 0; k < nm; k++) {
    let mx = mxs[k];
    for (let t = 0; t < 12 && pads.some((p) => mx > p.xa - 100 && mx < p.xb + 100); t++) mx += 90;
    const dir = mx < WP / 2 ? 1 : -1;
    const sy = hAt(mx);
    const ex = clamp(mx + dir * R.range(320, 640), 160, WP - 160), ey = botY(botPath, ex);
    // 비탈 옆구리로 비스듬히 들어가 안쪽에서 아래로 굽이친다
    const pts = meanderVia(P, [[mx, sy + 4], [mx + dir * R.range(90, 170), sy + R.range(46, 84)], [ex, ey]], 0.9, 80);
    // 입구는 조금 좁고 안으로 갈수록 넓어진다
    carveWormB(P, B, pts.slice(0, 14), 18, 22);
    carveWormB(P, B, pts.slice(12), wR[0] - 2, wR[1]);
    P.mouths.push({ x: mx, y: sy, dir });
  }
  const [ja, jb] = airRows(B, LW, LH);
  caSmooth(B, LW, LH, cp.ca, ja, jb);
  prune(B, LW, LH, 90, 260, ja, jb);
  const Fc = blurToField(B, LW, LH, ja, jb);
  for (let k = Math.max(0, ja - 2) * LW; k < Math.min(Fs.length, (jb + 3) * LW); k++) if (Fc[k] < Fs[k]) Fs[k] = Fc[k];
  // 문 자리 바닥은 정확하게 평평하게
  if (P.deep) flatFloor(P, P.deep.x - 40, P.deep.x + 40, P.deep.y, 12, 30, 18);
  // 굴러온 바위 (비탈·절벽 아래)
  const Bo = S.boulders;
  for (let k = R.int(Bo.n[0], Bo.n[1]), t = 0; k > 0 && t < 60; t++) {
    const x = R.range(200, Math.min(arenaFrom, WP) - 200);
    if (pads.some((p) => x > p.xa - 60 && x < p.xb + 60)) continue;
    if (P.mouths.some((m) => Math.abs(x - m.x) < 120)) continue;
    const r = R.range(Bo.r[0], Bo.r[1]), rx = r * R.range(1, 1.5), cy = hAt(x) + r * R.range(0.15, 0.45);
    const so = R() * 99;
    addShape(P, x - rx - 4, cy - r - 4, x + rx + 4, cy + r + 4, (px, py) => {
      const dx = (px - x) / rx, dy = (py - cy) / r;
      const rr = 1 + 0.18 * N.n2(px / 9 + so, py / 9);
      return (rr - Math.sqrt(dx * dx + dy * dy)) * r * 0.9;
    });
    k--;
  }
  // 하늘: 땅에서 ▲ 문(꼭대기 섬)까지 이어지는 섬 사슬 + 흩어진 섬
  const groundAt = (x) => hAt(x);
  if (P.isZone && P.upX >= 0) skyChain(P, groundAt, S.islands.style);
  scatterIslands(P, groundAt, R.int(S.islands.n[0], S.islands.n[1]), S.islands);
  zoneEnds(P);
  P.ugTop = Math.max(UG_TOP, Math.ceil(Math.max(...Array.from(h)) / TS) + 3);
}
const botY = (path, x) => {
  let best = path[0], bd = 1e9;
  for (const p of path) {
    const d = Math.abs(p[0] - x);
    d < bd && ((bd = d), (best = p));
  }
  return best[1];
};
function room(P, B, cx, yF, rx, ry, lift = 0.55) {
  const { LW, LH, N } = P, so = P.R() * 99;
  const cy = yF - ry * lift;
  const i0 = Math.max(1, Math.floor((cx - rx * 1.3) / Q)), i1 = Math.min(LW - 2, Math.ceil((cx + rx * 1.3) / Q));
  const j0 = Math.max(1, Math.floor((cy - ry * 1.3) / Q)), j1 = Math.min(LH - 2, Math.ceil((cy + ry * 1.3) / Q));
  for (let j = j0; j <= j1; j++)
    for (let i = i0; i <= i1; i++) {
      const x = i * Q, y = j * Q;
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      const rr = 1 + 0.22 * N.n2(x / 26 + so, y / 26);
      if (dx * dx + dy * dy < rr * rr) B[j * LW + i] = 0;
    }
  P.rooms.push({ x: cx, y: yF, rx, ry });
}

// ▲ 문까지 오르는 섬 사슬 (꼭대기부터 아래로 내려오며 놓는다)
function skyChain(P, groundAt, style) {
  const { R, WP, arenaFrom } = P;
  const lim = Math.min(WP, arenaFrom) - 60;
  for (let tries = 0; tries < 50; tries++) {
    const pw = R.range(150, 210);
    const pcx = clamp(P.upX + R.range(-110, 110), 140, lim - 140);
    const ptop = Math.round(R.range(5, 7)) * TS;
    const chain = [{ cx: pcx, top: ptop, w: pw, t: R.range(80, 130) }];
    let cur = chain[0], ok = false;
    for (let g = 0; g < 40; g++) {
      const gl = Math.min(groundAt(cur.cx - cur.w / 2), groundAt(cur.cx), groundAt(cur.cx + cur.w / 2));
      if (cur.top >= gl - 96) {
        ok = true;
        break;
      }
      // 제멋대로 걷기: 방향은 매번 새로 고르되, ▲ 문에서 너무 멀어지면 되돌아오게
      const pull = clamp((cur.cx - P.upX) / 700, -0.4, 0.4);
      const dir = R() < 0.5 - pull ? 1 : -1;
      let placed = null;
      for (const d of [dir, -dir]) {
        for (let q = 0; q < 7 && !placed; q++) {
          const big = R() < 0.18;
          const w = big ? R.range(130, 200) : R.range(44, 120);
          const gap = R.range(-20, 60);
          const cx = d > 0 ? cur.cx + cur.w / 2 + gap + w / 2 : cur.cx - cur.w / 2 - gap - w / 2;
          if (cx - w / 2 < 70 || cx + w / 2 > lim) continue;
          const gnd = Math.min(groundAt(cx - w / 2), groundAt(cx), groundAt(cx + w / 2));
          let top = cur.top + R.range(30, 78);
          if (top > gnd - 60) top = gnd - 60;
          if (top < cur.top + 24) continue;
          const t = Math.min(big ? R.range(60, 120) : R.range(28, 80), gnd - 44 - top);
          // 너무 얇으면 판자처럼 보인다
          if (t < 24) continue;
          const B = { cx, top, w, t };
          // 다른 섬 머리 위를 막지 않게, 겹치지 않게
          if (chain.some((A) => Math.abs(A.cx - cx) < (A.w + w) / 2 + 14 && Math.abs(top - A.top) < HEAD + 30 + (A.top < top ? A.t * 1.3 : t * 1.3))) continue;
          placed = B;
        }
        if (placed) break;
      }
      if (!placed) break;
      chain.push(placed);
      cur = placed;
    }
    if (!ok) continue;
    for (const I of chain) island(P, I.cx, I.top, I.w, I.t, I === chain[0] ? (style === "spire" ? "rock" : style) : style);
    const pk = chain[0];
    P.peak = { x: Math.round((pk.cx - pk.w * 0.22) / TS) * TS + 8, y: pk.top, isl: pk };
    // 꼭대기 섬 위는 평평하게 (문·보물 상자)
    flatFloor(P, pk.cx - pk.w * 0.36, pk.cx + pk.w * 0.36, Math.round(pk.top / TS) * TS, 16, 10, 14);
    P.peak.y = Math.round(pk.top / TS) * TS;
    P.chest = { x: Math.round((pk.cx + pk.w * 0.22) / TS) * TS + 8, y: P.peak.y };
    return;
  }
}
function scatterIslands(P, groundAt, n, I) {
  const { R, WP, arenaFrom } = P;
  const lim = Math.min(WP, arenaFrom) - 50;
  const placed = P.islands.slice();
  for (let k = 0, t = 0; k < n && t < 300; t++) {
    const w = R.range(I.w[0], I.w[1]), th = R.range(I.t[0], I.t[1]);
    const cx = R.range(90 + w / 2, lim - w / 2);
    const gnd = Math.min(groundAt(cx - w / 2), groundAt(cx), groundAt(cx + w / 2));
    const maxTop = gnd - th * 1.25 - 120;
    if (maxTop < 150) continue;
    const top = R.range(130, maxTop);
    if (placed.some((A) => Math.abs(A.cx - cx) < (A.w + w) / 2 + 56 && top < A.top + A.t * 1.4 + 70 && top + th * 1.4 + 70 > A.top)) continue;
    island(P, cx, top, w, th, I.style);
    placed.push({ cx, top, w, t: th });
    k++;
  }
}
// 구역 양 끝 벽 (지상: 땅 위 14줄까지 바위 절벽, 동굴: 위아래 전체)
function zoneEnds(P) {
  const { N, WP, kind } = P;
  const topY = kind === "ground" ? (FLOOR - 14) * TS : -40;
  for (const side of [0, 1]) {
    const so = side * 37.7;
    const sdf = (x, y) => {
      const xx = side ? WP - x : x;
      const face = 40 + 9 * N.fbm1(y / 34 + so, 2) + 4 * N.n1(y / 9 + so);
      const tp = topY + 10 * N.fbm1(xx / 20 + so + 3, 2);
      const a = Math.max(33, face) - xx;
      return Math.min(a, y - tp + (xx < 20 ? 8 : 0));
    };
    side ? addShape(P, WP - 70, topY - 20, WP, P.HP, sdf) : addShape(P, 0, topY - 20, 70, P.HP, sdf);
  }
}

// ── 동굴 ─────────────────────────────────────────────
function buildCave(P) {
  const { prof: S, LW, LH, WP, HP, R, arenaFrom } = P;
  const cp = S.caves;
  const base = FLOOR * TS, bottom = (P.Ft - 5) * TS;
  const B = caveRock(P, cp, (x, y) => {
    if (y < 120 || y > bottom - 16 || x < 60 || x > WP - 60) return -1;
    let l = 0;
    l -= 0.6 * smooth((260 - y) / 140);
    l -= 0.6 * smooth((y - (bottom - 120)) / 100);
    l -= 0.4 * smooth((200 - Math.min(x, WP - x)) / 120);
    return l;
  });
  const wR = cp.worm;
  // 큰길: 왼쪽 입구(70줄) → 오른쪽 출구, 위아래로 크게 굽이친다
  const mainEnd = arenaFrom < WP ? arenaFrom + 60 : WP - 40;
  const mid = [];
  const nW = R.int(5, 7);
  for (let k = 1; k < nW; k++) mid.push([lerp(150, mainEnd - 100, k / nW) + R.range(-110, 110), base + R.range(-230, 190)]);
  const way = [[44, base - 18], [150, base - 20], ...mid, [mainEnd - 100, base - 30], [mainEnd, base - 18]];
  const mainPts = [...meander(P, 44, base - 18, 150, base - 20, 0.1, 200), ...meanderVia(P, way.slice(1, -1), 0.8, 100), ...meander(P, mainEnd - 100, base - 30, mainEnd, base - 18, 0.1, 200)];
  carveWormB(P, B, mainPts, wR[0], wR[1] + 4);
  P.mainPath = mainPts;
  // 위층(▲ 문) · 아래층(▼ 문)
  const topY = R.range(380, 470), botYv = R.range(1520, 1600);
  const up = P.upX >= 0 ? P.upX : WP * 0.55, dn = P.downX >= 0 ? P.downX : WP * 0.4;
  const tA = clamp(up - R.range(700, 1100), 220, WP - 400), tB = clamp(up + R.range(500, 900), tA + 500, Math.min(arenaFrom, WP) - 220);
  const tMid = [(tA + tB) / 2 + R.range(-150, 150), topY + R.range(-70, 90)];
  const topPts = meanderVia(P, [[tA, topY + R.range(-40, 40)], tMid, [tB, topY + R.range(-40, 40)]], 0.8, 100);
  carveWormB(P, B, topPts, wR[0] - 2, wR[1] - 2);
  const bA = clamp(dn - R.range(600, 1000), 220, WP - 500), bB = clamp(dn + R.range(500, 1000), bA + 500, Math.min(arenaFrom, WP) - 220);
  const bMid = [(bA + bB) / 2 + R.range(-150, 150), botYv + R.range(-90, 50)];
  const botPts = meanderVia(P, [[bA, botYv + R.range(-30, 30)], bMid, [bB, botYv + R.range(-30, 30)]], 0.8, 100);
  carveWormB(P, B, botPts, wR[0], wR[1]);
  P.topPath = topPts;
  P.botPath = botPts;
  // 층 사이: 구불구불한 세로 굴 (오르는 턱은 길찾기 고치기가 자연스럽게 붙인다)
  const link = (pa, pb, n) => {
    for (let k = 0; k < n; k++) {
      const a = pa[Math.floor(R.range(0.15, 0.85) * pa.length)];
      // 층 사이는 비스듬히 (세로로 곧게 뚫으면 사다리처럼 턱만 쌓인다)
      const dyl = Math.abs(pb[0][1] - a[1]);
      const want = a[0] + (R() < 0.5 ? -1 : 1) * dyl * R.range(0.8, 1.3);
      let b = pb[0], bd = 1e9;
      for (const p of pb) {
        const d = Math.abs(p[0] - want);
        d < bd && ((bd = d), (b = p));
      }
      carveWormB(P, B, meander(P, a[0], a[1], b[0], b[1], 1.0, 70), wR[0] + 2, wR[1] + 6);
    }
  };
  link(topPts, mainPts, 2);
  link(mainPts, botPts, 2);
  // 동굴방 (비대칭, 가장자리 울퉁불퉁)
  const all = [...mainPts, ...topPts, ...botPts];
  for (let k = R.int(cp.rooms[0], cp.rooms[1]); k > 0; k--) {
    const p = all[Math.floor(R() * all.length)];
    if (p[0] < 240 || p[0] > Math.min(arenaFrom, WP) - 240) continue;
    const r = R.range(cp.roomR[0], cp.roomR[1]);
    room(P, B, p[0], p[1] + r * 0.3, r * R.range(1.1, 1.6), r * R.range(0.6, 0.9));
  }
  // 문 자리
  if (P.isZone && P.upX >= 0) {
    const px = clamp(P.upX + R.range(-100, 100), tA + 80, tB - 80);
    P.peak = { x: Math.round(px / TS) * TS + 8, y: Math.round((botY(topPts, px) + 6) / TS) * TS };
    room(P, B, P.peak.x, P.peak.y, R.range(64, 90), R.range(40, 56));
  }
  if (P.isZone && P.downX >= 0) {
    const dx = clamp(P.downX + R.range(-100, 100), bA + 80, bB - 80);
    P.deep = { x: Math.round(dx / TS) * TS + 8, y: Math.min(bottom - 48, Math.round((botY(botPts, dx) + 6) / TS) * TS) };
    room(P, B, P.deep.x, P.deep.y, R.range(64, 90), R.range(40, 56));
  }
  // 보스 방: 넓은 동굴방 (바닥은 70줄, 천장은 울퉁불퉁)
  if (arenaFrom < WP) {
    const cx = (arenaFrom + WP) / 2;
    room(P, B, cx, base, (WP - arenaFrom) * 0.56, 13 * TS, 0.92);
    room(P, B, arenaFrom + 60, base - 40, 120, 80, 0.7);
  }
  const [ja, jb] = airRows(B, LW, LH);
  caSmooth(B, LW, LH, cp.ca, ja, jb);
  prune(B, LW, LH, 260, 320, ja, jb);
  P.F.d.set(blurToField(B, LW, LH, ja, jb));
  // 입구·출구 통로 바닥 (칸 경계에 평평하게)
  flatFloor(P, 34, 140, base, 16, 28, 30);
  flatFloor(P, WP - 140, WP - 34, base, 16, 28, 30);
  if (arenaFrom < WP) flatFloor(P, arenaFrom, WP - 34, base, 16, 48, 40);
  if (P.peak) flatFloor(P, P.peak.x - 40, P.peak.x + 40, P.peak.y, 12, 30, 18);
  if (P.deep) flatFloor(P, P.deep.x - 40, P.deep.x + 40, P.deep.y, 12, 30, 18);
  // 무너진 바위 더미
  if (cp.rubble) rubble(P);
  zoneEnds(P);
  P.ugTop = 0;
}
function rubble(P) {
  const { R, N, F } = P;
  for (let k = 0, t = 0; k < 10 && t < 200; t++) {
    const x = R.range(200, Math.min(P.arenaFrom, P.WP) - 200), y = R.range(300, P.HP - 140);
    // 바닥 위 (공기 바로 아래가 바위)
    if (F.v(x, y) > 0 || F.v(x, y + 12) <= 0 || F.v(x, y - 40) > 0) continue;
    const r = R.range(8, 18), so = R() * 99;
    addShape(P, x - r * 2, y - r, x + r * 2, y + r, (px, py) => {
      const dx = (px - x) / (r * 1.6), dy = (py - (y + r * 0.3)) / r;
      return (1 + 0.25 * N.n2(px / 7 + so, py / 7) - Math.sqrt(dx * dx + dy * dy)) * r;
    });
    k++;
  }
}

// ── 하늘 ─────────────────────────────────────────────
function buildSky(P) {
  const { prof: S, WP, R, N, arenaFrom, F } = P;
  F.d.fill(-12);
  const base = FLOOR * TS;
  const fl = S.floor;
  // 바닥 섬: 큰 섬 사이 틈 (뛰어넘는다)
  const segs = [];
  let x = 0;
  while (x < WP) {
    let w = R.int(fl.w[0], fl.w[1]) * TS;
    if (x === 0) w = Math.max(w, 22 * TS);
    if (x + w >= WP - 18 * TS || x + w > arenaFrom - 6 * TS) w = arenaFrom < WP && x < arenaFrom - 6 * TS ? Math.max(w, arenaFrom - x) : WP - x;
    if (x >= arenaFrom - 6 * TS) w = WP - x;
    segs.push([x, Math.min(WP, x + w)]);
    x += w;
    if (x >= WP) break;
    x += R.int(fl.gap[0], fl.gap[1]) * TS;
  }
  P.floorSegs = segs;
  const so = R() * 999;
  const topAt = (x) => base - fl.amp * (0.5 + 0.5 * N.fbm1(x / 260 + so, 2)) + 3 * N.n1(x / 31 + so);
  const style = S.islands.style;
  for (const [a, b] of segs) {
    const w = b - a, cx = (a + b) / 2, hw = w / 2;
    const t = R.int(fl.t[0], fl.t[1]) * TS;
    const lipA = R.range(0.9, 0.97), lipB = R.range(0.9, 0.97), rd = R.range(8, 16);
    // 윗면: 완만한 기복, 가장자리만 둥글게 (틈 쪽 끝에서 뛰어오를 수 있게)
    const tf = (px) => {
      const u = (px - cx) / hw, au = u < 0 ? -u : u, lip = u < 0 ? lipA : lipB;
      const r = au > lip ? (au - lip) / (1 - lip) : 0;
      return (a === 0 && px < 150) || (b >= WP && px > WP - 150) ? base : topAt(px) + r * r * rd;
    };
    island(P, cx, base, w, t, style === "spire" ? "rock" : style, { topFn: tf, lobes: clamp(Math.round(w / 110), 2, 7), sub: false });
  }
  // 출구 자리·보스 방 바닥은 정확히 70줄
  flatFloor(P, 34, 140, base, 40, 20, 40);
  flatFloor(P, WP - 140, WP - 34, base, 40, 20, 40);
  if (arenaFrom < WP) flatFloor(P, arenaFrom, WP - 34, base, 40, 20, 60);
  const groundAt = (x) => {
    for (const [a, b] of segs) if (x >= a && x < b) return topAt(x);
    return P.HP;
  };
  if (P.isZone && P.upX >= 0) skyChain(P, groundAt, S.islands.style);
  scatterIslands(P, groundAt, R.int(S.islands.n[0], S.islands.n[1]), S.islands);
  P.ugTop = P.Ft + 20;
}

// ── 길찾기 검사 ──────────────────────────────────────
// 8px마다 세로줄을 재서 바위 구간을 정확히 구하고(쌍선형 장은 세로로 선형이라 0이 되는 곳을 바로 계산),
// 바닥(머리 위 28px 이상 빈 곳)마다 걷기·점프·떨어지기로 갈 수 있는 곳을 잇는다.
const CW = 8;
// 세로줄 하나(픽셀 열 px)의 바위 구간 [위, 아래): 쌍선형 장은 세로로 선형이라 0이 되는 곳을 바로 계산한다
function colIntervals(d, LW, LH, HP, px, tops, bots) {
  const x = px + 0.5, u = x / Q, i = Math.min(LW - 2, u | 0), fu = u - i;
  let v0 = d[i] + (d[i + 1] - d[i]) * fu;
  let start = v0 > 0 ? 0 : -1;
  for (let j = 0; j < LH - 1; j++) {
    const k = (j + 1) * LW + i;
    const v1 = d[k] + (d[k + 1] - d[k]) * fu;
    if (v0 > 0 !== v1 > 0) {
      const p = Math.floor(Q * (j + v0 / (v0 - v1)) - 0.5) + 1;
      if (v1 > 0) start = p;
      else {
        tops.push(start);
        bots.push(p);
        start = -1;
      }
    }
    v0 = v1;
  }
  start >= 0 && (tops.push(start), bots.push(HP));
}
// 8px 기둥마다: 가운데 열(발 닿는 바닥)과, 몸 너비(±5px)를 덮는 세 열을 합친 구간(머리·어깨가 지나갈 자리)
function columns(P) {
  const { F } = P, d = F.d, LW = F.LW, LH = F.LH, WP = P.WP;
  const NC = Math.floor(WP / CW);
  const ivS = new Int32Array(NC + 1), dvS = new Int32Array(NC + 1);
  const tops = [], bots = [], dts = [], dbs = [], tT = [], tB = [];
  for (let c = 0; c < NC; c++) {
    ivS[c] = tops.length;
    colIntervals(d, LW, LH, P.HP, c * CW + 4, tops, bots);
    dvS[c] = dts.length;
    tT.length = tB.length = 0;
    for (let k = ivS[c]; k < tops.length; k++) (tT.push(tops[k]), tB.push(bots[k]));
    colIntervals(d, LW, LH, P.HP, Math.max(0, c * CW - 1), tT, tB);
    colIntervals(d, LW, LH, P.HP, Math.min(WP - 1, c * CW + 9), tT, tB);
    const ord = tT.map((_, k) => k).sort((a, b) => tT[a] - tT[b]);
    let cs = -1, ce = -1;
    for (const k of ord) {
      const s = tT[k], e = tB[k];
      if (cs < 0) ((cs = s), (ce = e));
      else if (s <= ce) e > ce && (ce = e);
      else (dts.push(cs), dbs.push(ce), (cs = s), (ce = e));
    }
    cs >= 0 && (dts.push(cs), dbs.push(ce));
  }
  ivS[NC] = tops.length;
  dvS[NC] = dts.length;
  return { NC, ivS, top: Int32Array.from(tops), bot: Int32Array.from(bots), dvS, dtop: Int32Array.from(dts), dbot: Int32Array.from(dbs) };
}
// 점프 물리 (엔진 플레이어와 같은 값): 점프 500, 2단 점프 440(꼭대기에서), 중력 오를 때 1500 · 내려갈 때 1725,
// 가로 속도는 기본 150보다 조금 낮게(140) 잡아 빠듯한 점프는 넣지 않는다
// 엔진은 프레임마다 속도에 중력을 먼저 더하고 움직이므로 꼭대기가 공식보다 낮다 → 30fps 기기에서도 되도록
// 실효 점프 속도(500 → 475, 440 → 415)를 쓴다. 떨어질 때는 최고 낙하 속도 720을 넘지 않는다
const VX = 135, GU = 1500, GD = 1725, VMAX = 720, J1 = 475, J2 = 415;
const T1 = J1 / GU, H1 = (J1 * J1) / (2 * GU), T2 = J2 / GU, H2 = (J2 * J2) / (2 * GU), TV = VMAX / GD;
const fallD = (w) => (w <= TV ? 0.5 * GD * w * w : 0.5 * VMAX * TV + VMAX * (w - TV));
// 달리며 뛴 뒤 t초의 높이 (위로 +)
const hRun = (t, dbl) => {
  if (t <= T1) return J1 * t - 0.5 * GU * t * t;
  const u = t - T1;
  if (!dbl) return H1 - fallD(u);
  if (u <= T2) return H1 + J2 * u - 0.5 * GU * u * u;
  return H1 + H2 - fallD(u - T2);
};
export function analyze(P) {
  const C = columns(P);
  const { NC, ivS, top, bot, dvS, dtop, dbot } = C;
  // 가운데 열 [y0, y1]에 바위가 없는가
  const airC = (c, y0, y1) => {
    if (c < 0 || c >= NC) return false;
    for (let k = ivS[c]; k < ivS[c + 1]; k++) if (top[k] <= y1 && bot[k] > y0) return false;
    return true;
  };
  // 몸 너비 전체 [y0, y1]에 바위가 없는가
  const airD = (c, y0, y1) => {
    if (c < 0 || c >= NC) return false;
    for (let k = dvS[c]; k < dvS[c + 1]; k++) if (dtop[k] <= y1 && dbot[k] > y0) return false;
    return true;
  };
  // 발이 y에 있을 때 몸이 들어갈 자리 (아래 모서리 6px은 비탈에 걸쳐도 된다 — 충돌 모양과 같다)
  const bodyAir = (c, y) => airD(c, y - BODY, y - 7) && airC(c, y - BODY, y - 1);
  const air = airD;
  // 바닥 마디 (16px마다; 장애물은 8px마다·몸 너비로 검사)
  const nC = [], nY = [], colN = new Int32Array(NC + 1);
  for (let c = 0; c < NC; c++) {
    colN[c] = nC.length;
    if (c & 1) continue;
    let prev = -9999;
    for (let k = ivS[c]; k < ivS[c + 1]; k++) {
      const t = top[k];
      // 발 디딜 폭: 가운데 ±4px 모두 바닥이 있어야 (바늘 끝 같은 돌 꼭대기는 설 자리가 아니다)
      if (t > 0 && t - prev >= HEAD && t < P.HP - 2 && bodyAir(c, t) && P.F.solid(c * CW, t + 2) && P.F.solid(c * CW + 8, t + 2)) (nC.push(c), nY.push(t));
      prev = bot[k];
    }
  }
  colN[NC] = nC.length;
  const NN = nC.length;
  // 한 가지 움직임으로 A(ca, ya) → B(cb, yb)에 갈 수 있나
  // mode 0: 달리며 1단 점프, 1: 달리며 2단 점프, 2: 제자리 2단으로 솟았다 건너기, 3: 제자리 1단, 4: 걸어 나가 떨어지기
  const hMode = (mode, t, t0, hTop) => (mode === 0 ? hRun(t, !1) : mode === 1 ? hRun(t, !0) : mode === 4 ? -fallD(t) : hTop - fallD(t - t0));
  const tryMode = (ca, ya, cb, yb, mode) => {
    const dir = cb > ca ? 1 : -1, n = (cb - ca) * dir;
    let t0 = 0, hTop = 0, kOff = 0;
    if (mode === 2 || mode === 3) {
      hTop = mode === 2 ? H1 + H2 : H1;
      t0 = mode === 2 ? T1 + T2 : T1;
    }
    // 걸어 나가기: 발밑이 끊기는 기둥부터 떨어진다
    if (mode === 4) {
      while (kOff < n && !airC(ca + kOff * dir, ya, ya + 3)) kOff++;
      if (kOff >= n) return false;
    }
    const tAt = (k) => (mode === 4 ? (Math.max(0, k - kOff) * CW) / VX : t0 + (k * CW) / VX);
    // 도착 높이부터 (B 바닥보다 아래로 도착하면 옆면에 부딪힌다)
    const yEnd = ya - hMode(mode, tAt(n), t0, hTop);
    // 6px 이상 여유 있게 도착해야 (빠듯한 점프는 사람도 어렵다)
    if (yEnd > yb - 6) return false;
    if ((mode === 2 || mode === 3) && !(airD(ca, ya - hTop - BODY, ya - 7) && airC(ca, ya - hTop - BODY, ya - 1))) return false;
    for (let k = 1; k < n; k++) {
      const y = mode === 4 && k < kOff ? ya : Math.round(ya - hMode(mode, tAt(k), t0, hTop));
      if (!bodyAir(ca + k * dir, y)) return false;
    }
    const ye = Math.round(yEnd);
    return airD(cb, ye - BODY, yb - 7) && airC(cb, ye - BODY, yb - 1);
  };
  const UP_MODES = [1, 0, 2, 3], DN_MODES = [4, 0, 1];
  // (검사 도구용) 이 길을 어떤 움직임으로 인정했나: "walk" | 0~4
  const how = (a, b) => {
    const ca = nC[a], ya = nY[a], cb = nC[b], yb = nY[b], rise = ya - yb, dc = cb > ca ? 1 : -1;
    if (Math.abs(cb - ca) === 2 && Math.abs(rise) <= 16 && bodyAir(ca, Math.min(ya, yb)) && bodyAir(ca + dc, Math.min(ya, yb)) && bodyAir(cb, yb)) return "walk";
    for (const m of rise > 0 ? UP_MODES : DN_MODES) if (tryMode(ca, ya, cb, yb, m)) return m;
    return null;
  };
  // 마디에서 나가는 길
  const out = (a) => {
    const ca = nC[a], ya = nY[a], res = [];
    for (let cb = Math.max(0, ca - 18); cb <= Math.min(NC - 1, ca + 18); cb += 2) {
      if (cb === ca) continue;
      const dc = cb > ca ? 1 : -1;
      for (let b = colN[cb]; b < colN[cb + 1]; b++) {
        const yb = nY[b], rise = ya - yb;
        // 걷기: 이웃 마디, 높이 차 16px 이내 (충돌은 1px에 2px까지 오르고 6px 턱을 넘는다)
        if (Math.abs(cb - ca) === 2 && Math.abs(rise) <= 16) {
          const hi = Math.min(ya, yb);
          if (bodyAir(ca, hi) && bodyAir(ca + dc, hi) && bodyAir(cb, yb)) {
            res.push(b);
            continue;
          }
        }
        if (rise > H1 + H2 - 20) continue;
        const modes = rise > 0 ? UP_MODES : DN_MODES;
        for (const m of modes)
          if (tryMode(ca, ya, cb, yb, m)) {
            res.push(b);
            break;
          }
      }
    }
    return res;
  };
  const near = (x, y, rx = 14, ry = 12) => {
    let best = -1, bd = 1e9;
    const c0 = Math.max(0, Math.floor((x - rx) / CW)), c1 = Math.min(NC - 1, Math.floor((x + rx) / CW));
    for (let c = c0; c <= c1; c++)
      for (let n = colN[c]; n < colN[c + 1]; n++) {
        const dd = Math.abs(nC[n] * CW + 4 - x) + Math.abs(nY[n] - y);
        if (Math.abs(nY[n] - y) <= ry && dd < bd) ((bd = dd), (best = n));
      }
    return best;
  };
  const base = FLOOR * TS;
  const start = near(44, base, 20, 40);
  const goals = [];
  goals.push({ id: "R", n: near(P.WP - 56, base, 24, 40) });
  P.peak && goals.push({ id: "U", n: near(P.peak.x, P.peak.y, 16, 6) });
  P.deep && goals.push({ id: "D", n: near(P.deep.x, P.deep.y, 16, 6) });
  // 앞으로 (입구에서)
  const adj = new Array(NN);
  const reach = new Uint8Array(NN);
  const q = [];
  if (start >= 0) ((reach[start] = 1), q.push(start));
  while (q.length) {
    const a = q.pop();
    const o = (adj[a] = out(a));
    for (const b of o) reach[b] || ((reach[b] = 1), q.push(b));
  }
  const miss = goals.filter((g) => g.n < 0 || !reach[g.n]).map((g) => g.id);
  start < 0 && miss.push("L");
  // 거꾸로 (어느 출구에든 닿을 수 있는가): 닿은 마디들 안에서
  const rev = new Array(NN);
  for (let a = 0; a < NN; a++) if (adj[a]) for (const b of adj[a]) (rev[b] ??= []).push(a);
  const co = new Uint8Array(NN);
  for (const g of [{ n: start }, ...goals]) if (g.n >= 0 && reach[g.n]) ((co[g.n] = 1), q.push(g.n));
  while (q.length) {
    const b = q.pop();
    for (const a of rev[b] ?? []) co[a] || ((co[a] = 1), q.push(a));
  }
  let trapCount = 0;
  const traps = [];
  for (let a = 0; a < NN; a++) if (reach[a] && !co[a]) (trapCount++, traps.push(a));
  // 하늘 구역은 떨어지면 처음 자리로 돌아오므로 갇힘이 아니다
  const trapsBad = P.kind === "sky" ? 0 : trapCount;
  const ok = miss.length === 0 && trapsBad === 0;
  const score = (goals.length + 1 - miss.length) * 1000 - Math.min(999, trapsBad);
  return { ok, score, miss, trapCount: trapsBad, traps: P.kind === "sky" ? [] : traps, nC, nY, colN, NN, reach, co, adj, out, start, goals, C, air, how };
}

// ── 고치기 ───────────────────────────────────────────
// 갈 수 있는 곳(a)과 가야 하는 곳(b) 중 가장 가까운 짝을 찾아, 사이가 비었으면 바위 턱을 놓고 막혔으면 굴을 판다
// 한 번에 여러 곳을 고친다 (못 닿은 출구마다 하나, 갇히는 구덩이는 서로 떨어진 곳 3군데까지)
function repair(P, A) {
  const { nC, nY, NN, reach, co, out } = A;
  const X = (n) => nC[n] * CW + 4;
  const pairs = [];
  // 가장 가까운 짝 (위로 가는 길은 조금 더 비싸게)
  const closest = (src, dst) => {
    let best = null, bd = 1e18;
    const stepS = Math.max(1, Math.floor(src.length / 700)), stepD = Math.max(1, Math.floor(dst.length / 700));
    for (let i = 0; i < src.length; i += stepS) {
      const a = src[i], xa = X(a), ya = nY[a];
      for (let k = 0; k < dst.length; k += stepD) {
        const b = dst[k], dx = Math.abs(X(b) - xa), dy = ya - nY[b];
        const cost = dx + (dy > 0 ? dy * 1.25 : -dy * 0.6);
        cost < bd && ((bd = cost), (best = [a, b]));
      }
    }
    return best;
  };
  let did = false;
  if (A.miss.length) {
    let rev = null;
    for (const id of A.miss) {
      const g = A.goals.find((q) => q.id === id);
      const gn = g ? g.n : -1;
      if (gn < 0) {
        did = true;
        // 목표 자리에 바닥이 없다: 그 자리를 둥근 방 + 평평한 바닥으로
        const pt = id === "U" ? P.peak : id === "D" ? P.deep : id === "R" ? { x: P.WP - 56, y: FLOOR * TS } : { x: 44, y: FLOOR * TS };
        if (!pt) continue;
        cutShape(P, pt.x - 50, pt.y - 66, pt.x + 50, pt.y, (x, y) => {
          const ex = (x - pt.x) / 1.4, ey = y - (pt.y - 26);
          return 32 - Math.sqrt(ex * ex + ey * ey);
        });
        flatFloor(P, pt.x - 36, pt.x + 36, pt.y, 14, 20, 14);
        continue;
      }
      // 목표로 갈 수 있는 마디들 (전체 그래프를 거꾸로)
      if (!rev) {
        rev = new Array(NN);
        for (let a = 0; a < NN; a++) for (const b of A.adj[a] ?? (A.adj[a] = out(a))) (rev[b] ??= []).push(a);
      }
      const back = new Uint8Array(NN), q = [gn];
      back[gn] = 1;
      while (q.length) {
        const b = q.pop();
        for (const a of rev[b] ?? []) back[a] || ((back[a] = 1), q.push(a));
      }
      const src = [], dst = [];
      for (let n = 0; n < NN; n++) reach[n] ? src.push(n) : back[n] && dst.push(n);
      const pr = src.length && dst.length ? closest(src, dst) : null;
      pr && pairs.push(pr);
    }
  }
  if (A.traps.length && pairs.length < 3) {
    const dst = [];
    for (let n = 0; n < NN; n++) co[n] && dst.push(n);
    // 서로 떨어진 구덩이끼리 묶는다
    const groups = [];
    for (const t of A.traps) {
      const g = groups.find((G) => Math.abs(X(G[0]) - X(t)) < 120 && Math.abs(nY[G[0]] - nY[t]) < 120);
      g ? g.push(t) : groups.push([t]);
    }
    groups.sort((a, b) => b.length - a.length);
    for (const G of groups.slice(0, 3 - pairs.length)) {
      const pr = dst.length ? closest(G, dst) : null;
      pr && pairs.push(pr);
    }
  }
  // 같은 짝을 또 고치려 하면(앞 고치기가 소용없었다) 검사하는 길 그대로를 둥글게 파낸다. 세 번째는 포기
  const tried = (P.tried ??= new Map());
  for (const [a, b] of pairs) {
    const key = `${X(a)},${nY[a]},${X(b)},${nY[b]}`, cnt = (tried.get(key) ?? 0) + 1;
    tried.set(key, cnt);
    if (cnt === 1) (bridge(P, X(a), nY[a], X(b), nY[b]), (did = !0));
    else if (cnt === 2) {
      // 그래도 안 되면 사이에 디딤 바위를 하나 더 (높이를 반씩 나눈다)
      const xa = X(a), xb = X(b), ya = nY[a], yb = nY[b];
      ledge(P, (xa + xb) / 2 + P.R.range(-10, 10), Math.round(Math.max(ya, yb) - Math.abs(ya - yb) / 2 - 6), P.R.range(36, 56));
      clearPath(P, xa, ya, (xa + xb) / 2, Math.max(ya, yb) - Math.abs(ya - yb) / 2);
      did = !0;
    }
  }
  return did;
}
// 둥근 캡슐 모양으로 파낸다 (선분 두 끝 사이)
function capsule(P, x0, y0, x1, y1, r) {
  const L = Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0));
  const n = Math.max(1, Math.ceil(L / 4));
  for (let k = 0; k <= n; k++) {
    const x = x0 + ((x1 - x0) * k) / n, y = y0 + ((y1 - y0) * k) / n;
    cutShape(P, x - r - 2, y - r - 2, x + r + 2, y + r + 2, (px, py) => r - Math.sqrt((px - x) * (px - x) + (py - y) * (py - y)));
  }
}
// 달리며 2단 점프하는 실제 궤적(길찾기가 검사하는 것과 같은 식)을 따라 몸 크기만큼 둥글게 비운다
function clearPath(P, xa, ya, xb, yb) {
  const dir = xb > xa ? 1 : -1, dx = Math.abs(xb - xa);
  let ye = ya;
  for (let s = 0; s <= dx + 0.01; s += 4) {
    const y = ya - hRun(s / VX, !0);
    ye = y;
    const x = xa + dir * s;
    cutShape(P, x - 16, y - 28, x + 16, y + 4, (px, py) => 13.5 - Math.sqrt((px - x) * (px - x) + (py - (y - 12)) * (py - (y - 12))));
  }
  ye < yb && capsule(P, xb, ye - 12, xb, yb - 12, 12);
}
function bridge(P, xa, ya, xb, yb) {
  const { F, R } = P;
  // 사이가 바위로 얼마나 막혔나
  let rock = 0, n = 0;
  for (let t = 0.1; t <= 0.9; t += 0.05) {
    const x = lerp(xa, xb, t), y = lerp(ya, yb, t) - 14;
    F.v(x, y) > 0 && rock++;
    n++;
  }
  const rise = ya - yb, dx = Math.abs(xb - xa), L = Math.sqrt(dx * dx + rise * rise);
  const so = R() * 99;
  const carveAlong = (pts, r0, r1) => {
    let s = 0;
    for (let k = 0; k < pts.length; k++) {
      const [x, y] = pts[k];
      k && (s += 4);
      const r = lerp(r0, r1, 0.5 + 0.5 * P.N.n1(s / 50 + so));
      cutShape(P, x - r * 1.3, y - r - 2, x + r * 1.3, y + r, (px, py) => {
        const ex = (px - x) / 1.2, ey = py - y;
        return r - Math.sqrt(ex * ex + ey * ey);
      });
    }
  };
  if (rock / n > 0.3) {
    // 굴: 굽이치고, 굵기가 바뀌고, 바닥은 걸을 수 있게
    carveAlong(meander(P, xa, ya - 16, xb, yb - 16, L > 80 ? 0.8 : 0.3, 70), 17, 25);
    return;
  }
  // 바위 턱 사다리: 한 번에 오를 수 있는 높이·거리로 나누고, 좌우로 엇갈리게 놓는다
  const hops = Math.max(1, Math.ceil(Math.max(rise / 68, dx / 90)));
  if (hops === 1) {
    // 한 번 뛰면 되는데 막혔다: 실제로 뛰는 궤적을 따라 둥글게 깎는다 (머리 위 낮은 천장·튀어나온 바위)
    clearPath(P, xa, ya, xb, yb);
    return;
  }
  // 간격·크기·좌우가 제각각인 바위 턱 (같은 간격으로 쌓인 사다리처럼 보이지 않게)
  const side = R() < 0.5 ? 1 : -1;
  for (let k = 1; k < hops; k++) {
    const t = clamp((k + R.range(-0.22, 0.22)) / hops, 0.08, 0.92);
    const x = lerp(xa, xb, t) + side * (k % 2 ? 1 : -1) * R.range(8, 34), y = Math.round(lerp(ya, yb, t) + R.range(-10, 8));
    ledge(P, x, y, R.range(30, 72));
  }
}
// 벽에서 튀어나온 바위 턱 (가까운 벽이 없으면 떠 있는 작은 바위)
function ledge(P, x, y, w) {
  const { F, R } = P;
  let wall = 0;
  for (let d = w / 2; d < w / 2 + 44 && !wall; d += 4) {
    if (F.v(x - d, y + 6) > 0 && F.v(x - d, y - 20) > 0) wall = -d;
    else if (F.v(x + d, y + 6) > 0 && F.v(x + d, y - 20) > 0) wall = d;
  }
  // 턱 위 머리 공간 (둥근 천장)
  cutShape(P, x - w / 2 - 10, y - 50, x + w / 2 + 10, y - 1, (px, py) => {
    const ex = (px - x) / (w / 2 + 8), ey = (py - (y - 6)) / 44;
    return (1 - Math.sqrt(ex * ex + ey * ey)) * 24;
  });
  if (wall) {
    const ext = Math.abs(wall) + 12, cx = x + Math.sign(wall) * (ext / 2);
    island(P, cx, y, w + ext, R.range(18, 34), "ledge", { sub: false, keep: false });
  } else island(P, x, y, w, R.range(20, 40), "ledge", { sub: false, keep: false });
}

// ── 결과 정리: 바닥·적 자리·보물·함정 ─────────────────
function finishMeta(P, A) {
  const { nC, nY, NN, reach } = A;
  const NC = A.C.NC;
  // 칸마다 "주 지면" 높이 (px)
  const W = P.W, gy = new Int16Array(W).fill(-1);
  const base = FLOOR * TS;
  for (let t = 0; t < W; t++) {
    const c = t * 2;
    let best = -1, bd = 1e9;
    const ref = P.kind === "ground" ? P.h[Math.min(P.h.length - 1, (t * TS + 8) / Q | 0)] : base;
    for (const cc of [c, c + 1])
      for (let n = A.colN[cc]; n < A.colN[cc + 1]; n++) {
        if (!reach[n] && P.kind !== "ground") continue;
        const dd = Math.abs(nY[n] - ref);
        if (P.kind === "sky" && dd > 48) continue;
        if (P.kind === "cave" && dd > 220) continue;
        dd < bd && ((bd = dd), (best = nY[n]));
      }
    gy[t] = best;
  }
  P.gy = gy;
  // 서 있을 만한 자리 (평평하고 머리 위가 넉넉한 곳)
  const spots = [];
  for (let n = 0; n < NN; n++) {
    if (!reach[n]) continue;
    const c = nC[n], y = nY[n];
    if (c < 8 || c > NC - 8) continue;
    let flat = 0;
    for (const d of [-4, -2, 2, 4]) {
      const cc = c + d;
      for (let m = A.colN[cc]; m < A.colN[cc + 1]; m++) if (Math.abs(nY[m] - y) <= (d === 2 || d === -2 ? 4 : 7)) (flat++, (m = 1e9));
    }
    if (flat < 4 || !A.air(c, y - 48, y - 1)) continue;
    spots.push({ x: c * CW + 4, y });
  }
  P.spots = spots;
  // 함정 자리: 지상의 평평한 자리(분지는 웅덩이·늪)
  P.hzSpots = P.pads.map((p) => ({ x0: p.xa / TS, x1: p.xb / TS, y: p.y, basin: p.basin }));
}

// ── 조각 그리기 (엔진에 넘길 칸 격자·높이·물건) ─────────
// r: 조각 칸 격자(32 × Ft), l: 땅 높이(아래에서 센 값), s: 천장 줄
export function chunk(z, S, r, l, s, o) {
  const P = planOf(z, o);
  return drawChunk(P, z, S, r, l, s, o);
}
const HZ = { spikes: "spikes", poison: "poison", quicksand: "quicksand", ice: "ice", firetrap: "fireJet" };
export function drawChunk(P, z, S, r, l, s, o) {
  const { Ft, fe, ze } = o;
  const vt = 32, base = (S - z.c0) * vt, x0 = base * TS;
  const F = P.F;
  // 칸 격자: 칸 가운데가 바위면 바위 (예전 시스템·AI용 근사)
  for (let y = 0; y < Ft; y++)
    for (let x = 0; x < vt; x++) r[y * vt + x] = F.v(x0 + x * TS + 8, y * TS + 8) > 0 ? fe : ze;
  const gy = new Int16Array(vt), flat = new Uint8Array(vt);
  for (let x = 0; x < vt; x++) {
    const v = P.gy[base + x];
    gy[x] = v;
    l[x] = v >= 0 ? Ft - Math.floor(v / TS) : 0;
    // 천장 (동굴): 주 지면 위 바위의 아랫면
    let c = 0;
    if (P.kind === "cave" && v > 0) {
      for (let yy = v - HEAD; yy > 0; yy -= 2)
        if (F.solid(x0 + x * TS + 8, yy)) {
          c = Math.floor(yy / TS) + 1;
          break;
        }
    }
    s[x] = c;
    // 칸 전체가 평평한가 (±1px) — 함정·행사·상자를 놓아도 되는 칸
    if (v >= 0 && v % TS === 0) {
      let ok = true;
      for (let px = 0; px < TS && ok; px += 3) ok = F.solid(x0 + x * TS + px, v) && !F.solid(x0 + x * TS + px, v - 1);
      flat[x] = ok ? 1 : 0;
    }
  }
  const R = rng((P.seed ^ Math.imul(S + 1, 0x85ebca6b)) >>> 0);
  const out = { clouds: [], chests: [], spawns: [], hazards: [], peak: null, deep: null, ug: null, natural: 1 };
  out.fine = { F, x0, kind: P.kind, pkey: P.pkey, render: P.prof.render, zone: z.id };
  out.gy = gy;
  out.flat = flat;
  const inC = (px) => px >= x0 && px < x0 + vt * TS;
  // ▲·▼ 문
  if (P.peak && S === o.up && inC(P.peak.x)) {
    out.peak = { x: Math.floor((P.peak.x - x0) / TS), row: P.peak.y / TS, py: P.peak.y };
    P.chest && inC(P.chest.x) && out.chests.push({ x: Math.floor((P.chest.x - x0) / TS), row: P.chest.y / TS, py: P.chest.y, tier: R() < 0.35 ? 2 : 1 });
  }
  if (P.deep && S === o.down && inC(P.deep.x)) out.deep = { x: Math.floor((P.deep.x - x0) / TS), row: P.deep.y / TS, py: P.deep.y };
  // 지하 표시 (뒷벽·어둠)
  if (P.kind === "cave") out.ug = { top: 0, biome: o.biome, entrances: [], surface: new Array(vt).fill(0) };
  else if (P.kind === "ground")
    out.ug = {
      top: P.ugTop,
      biome: o.biome,
      entrances: [],
      surface: Array.from({ length: vt }, (_, x) => Math.floor(P.h[Math.min(P.h.length - 1, ((x0 + x * TS + 8) / Q) | 0)] / TS)),
      // 4px마다 지표 높이(px): 뒷벽은 지표 아래 덮인 곳에만, 땅속 암석은 지표에서 일정 깊이 아래부터
      surfPx: Array.from({ length: (vt * TS) / Q + 1 }, (_, k) => Math.round(P.h[Math.min(P.h.length - 1, x0 / Q + k)])),
    };
  else out.ug = { top: Ft + 20, biome: null, entrances: [], surface: [] };
  // 적·보물 자리
  if (!o.arena) {
    const near = (g, p) => g && Math.abs(g.x - p.x) < 5 && Math.abs(g.row - p.row) < 3;
    const spots = P.spots.filter((p) => inC(p.x) && (P.kind !== "ground" || Math.abs(p.y - P.gy[Math.floor(p.x / TS)]) > 20));
    const pick = () => spots.splice(Math.floor(R() * spots.length), 1)[0];
    const mk = (p) => ({ x: Math.floor((p.x - x0) / TS), row: Math.floor((p.y - 1) / TS), py: p.y });
    for (let k = 0, n = P.kind === "ground" ? 2 : 4; k < n && spots.length; k++) {
      const p = mk(pick());
      p && !near(out.peak, p) && !near(out.deep, p) && out.spawns.push(p);
    }
    for (let k = 0; k < 2 && spots.length; k++) {
      const p = mk(pick());
      p && !near(out.peak, p) && !near(out.deep, p) && R() < 0.3 && out.chests.push({ ...p, tier: R() < 0.12 ? 2 : R() < 0.45 ? 1 : 0 });
    }
    P.kind === "sky" && R() < 0.7 && out.spawns.push({ x: 4 + Math.floor(R() * 24), row: 20 + Math.floor(R() * 40), fly: 1 });
    // 지상 함정: 평평한 자리에만 (분지는 웅덩이·늪, 언덕 위는 가시·불기둥·얼음)
    if (P.kind === "ground" && o.patterns) {
      const pool = Object.entries(o.patterns).filter(([k]) => HZ[k]);
      for (const hz of P.hzSpots) {
        const a = Math.max(hz.x0, base), b = Math.min(hz.x1, base + vt);
        if (b - a < 2 || !pool.length) continue;
        let tot = pool.reduce((s2, [, w]) => s2 + w, 0) * R();
        let pickK = pool[0][0];
        for (const [k2, w] of pool) if ((tot -= w) <= 0) ((pickK = k2), (tot = 1e9));
        if (hz.basin && (pickK === "spikes" || pickK === "firetrap")) {
          const wet = pool.find(([k2]) => k2 === "poison" || k2 === "quicksand" || k2 === "ice");
          wet && (pickK = wet[0]);
        }
        const type = HZ[pickK];
        const row = hz.y / TS;
        if (type === "fireJet") {
          for (const xx of [a + 1, a + 4]) xx < b && flat[xx - base] && out.hazards.push({ type, x: xx - base, row, py: hz.y, w: 1, natural: 1 });
        } else {
          const w = Math.min(b - a - 1, type === "spikes" ? R.int(1, 3) : R.int(2, 4));
          const xx = a + Math.floor(R() * (b - a - w));
          let okW = true;
          for (let q = xx; q < xx + w; q++) okW = okW && !!flat[q - base];
          okW && w > 0 && out.hazards.push({ type, x: xx - base, row, py: hz.y, w, natural: 1 });
        }
      }
    }
  }
  return out;
}

// ── 엔진 바깥(도구·검사)용 ───────────────────────────
export const sampleSolid = (P, x, y) => P.F.solid(x, y);
