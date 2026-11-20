// 그래스메어 몬스터 — 2D 픽셀로 직접 그린 그림 (시험: 고블린 정찰병)
//   비율: 머리는 키의 1/4, 긴 팔, 굽은 등·구부린 무릎 (아기자기하지 않게, 매섭고 거칠게)
import { canvas } from "./px2d.js";

const OUT = 0x120a12;
// 색 묶음 [가장 어두움, 어두움, 기본, 밝음]
const SK = [0x232c20, 0x3e4e2c, 0x627a3a, 0x8ea456];
const IR = [0x2a2e3c, 0x4c5266, 0x7a8296, 0xb8c0d0];
const RU = [0x3a2018, 0x6a3a22, 0x9a5a30, 0xc48a50];
const LE = [0x2e1e1a, 0x4a3024, 0x6e4a32, 0x96704a];
const CL = [0x2a2024, 0x463840, 0x6a5a5e, 0x8e8080];
const BL = [0x3a404e, 0x6a7282, 0xa4aab8, 0xe0e4ec];
const EYE = 0xffb83a, EYEC = 0xfff2c0, MOUTH = 0x2a0c10, TOOTH = 0xe8dcc0, SCAR = 0x8a5a4a;

// 팔다리: 어두운 바탕 → 기본색(빛 쪽으로 살짝) → 밝은 줄 (원기둥 명암)
function limb(C, ax, ay, bx, by, wa, wb, R) {
  C.taper(ax, ay, bx, by, wa, wb, R[1]);
  const nx = -(by - ay), ny = bx - ax, L = Math.hypot(nx, ny) || 1, ox = (nx / L) * -0.7 - 0.3, oy = (ny / L) * -0.7 - 0.5;
  C.taper(ax + ox, ay + oy, bx + ox, by + oy, wa * 0.62, wb * 0.62, R[2]);
  C.taper(ax + ox * 2.2, ay + oy * 2.2, bx + ox * 2.2, by + oy * 2.2, Math.max(1, wa * 0.2), Math.max(1, wb * 0.2), R[3]);
}

// p: bob 들썩 · arm(0~1) 칼 든 팔 들기 · step(-1~1) 걸음 · grin 입 벌림
export function goblinFrame(p = {}) {
  const W = 64, H = 64, C = canvas(W, H);
  const b = p.bob ?? 0, st = p.step ?? 0, ar = p.arm ?? 0, gr = p.grin ?? 0;
  const G = 61;
  // ── 먼 다리 (구부린 무릎, 어둡게) ──
  const hip = [27, 40 + b];
  {
    const kn = [31 - st * 3, 48 + b * 0.5], an = [27 - st * 4, 56], ft = [31 - st * 4, 58.5];
    C.taper(hip[0] - 2, hip[1], kn[0] - 2, kn[1], 6, 4.6, SK[0]).taper(kn[0] - 2, kn[1], an[0] - 2, an[1], 4.4, 3.4, SK[0]);
    C.poly([[an[0] - 5, G - 2], [ft[0] + 1, G - 3.5], [ft[0] + 2, G], [an[0] - 5, G]], LE[0]);
  }
  // ── 먼 팔 (축 늘어져 무릎까지) ──
  C.taper(27, 27 + b, 25, 36 + b, 4.6, 3.8, SK[0]).taper(25, 36 + b, 27, 45 + b, 3.8, 3.2, SK[0]);
  C.ell(27.5, 46.5 + b, 2.6, 2.4, SK[0]);
  // ── 몸통: 굽은 등 · 갈비 드러난 가슴 · 해진 천 ──
  // 앙상한 몸: 넓은 어깨 → 좁은 허리 (등은 굽고 가슴은 갈비뼈)
  C.shade(30, 29 + b, 6.6, 5.6, SK, { lx: -0.5, ly: -0.85 });
  C.shade(30.5, 35 + b, 4.4, 4, SK, { lx: -0.5, ly: -0.85, t: [0.6, 0.1, -0.5] });
  for (const y of [28, 30.5, 33]) C.line(31.5, y + b, 35, y + 0.6 + b, SK[1]).px(32, y - 1 + b, SK[3]);
  // 등뼈 혹 (굽은 등)
  C.ell(25, 25.5 + b, 3, 2.6, SK[2]).px(24, 23.6 + b, SK[3]).px(25, 23.6 + b, SK[3]);
  // 어깨에서 허리로 가죽 띠 + 해진 허리천
  C.line(25, 25 + b, 34, 37 + b, LE[1], 2).line(25, 24 + b, 33, 36 + b, LE[3]);
  C.poly([[24, 38.5 + b], [36, 38 + b], [35, 43 + b], [33, 46 + b], [31, 43.5 + b], [28, 47 + b], [26, 43 + b], [24, 45 + b]], CL[2]);
  C.line(25, 39.5 + b, 35, 39 + b, CL[3]).line(26, 43 + b, 28, 46 + b, CL[1]).line(31, 43 + b, 33, 45 + b, CL[1]);
  C.rect(24, 37.5 + b, 13, 2, LE[1]).rect(24, 37.5 + b, 13, 1, LE[2]).rect(30, 37 + b, 3, 3, RU[2]).px(30, 37 + b, RU[3]);
  // ── 앞 다리 ──
  {
    const kn = [35 + st * 3, 48 + b * 0.5], an = [31 + st * 4, 56], ft = [36 + st * 4, 58.5];
    limb(C, hip[0] + 3, hip[1], kn[0], kn[1], 6.4, 5, SK);
    limb(C, kn[0], kn[1], an[0], an[1], 5, 3.8, SK);
    C.poly([[an[0] - 4, G - 2.5], [ft[0] + 1, G - 4], [ft[0] + 3, G - 0.5], [an[0] - 4, G]], LE[2]);
    C.line(an[0] - 3, G - 2.5, ft[0], G - 3.8, LE[3]);
    // 무릎 감싼 천
    C.ell(kn[0], kn[1], 2.6, 2, CL[1]).px(kn[0] - 1, kn[1] - 1, CL[3]);
  }
  // ── 목 · 머리 (앞으로 쭉 뺀 작은 머리) ──
  limb(C, 34, 26 + b, 40, 22 + b, 6, 5, SK);
  const hx = 43, hy = 19 + b;
  // 먼 귀 (뒤로 뻗음)
  C.taper(hx - 4, hy - 2, hx - 14, hy - 8, 4, 0.8, SK[0]);
  C.shade(hx, hy, 6.4, 5.8, SK);
  // 튀어나온 아래턱 + 이빨
  C.poly([[hx - 2, hy + 3], [hx + 8, hy + 2], [hx + 8, hy + 5 + gr], [hx - 1, hy + 7 + gr]], SK[1]);
  C.line(hx - 1, hy + 3, hx + 7, hy + 2.4, SK[2]);
  C.rect(hx + 1, hy + 3, 7, 1 + gr, MOUTH);
  for (const x of [1, 3, 6]) C.px(hx + x, hy + 2.6, TOOTH);
  C.px(hx + 2, hy + 4 + gr, TOOTH).px(hx + 5, hy + 4 + gr, TOOTH).px(hx + 5, hy + 3 + gr, TOOTH);
  // 매부리코
  C.taper(hx + 4, hy - 1, hx + 9.5, hy + 2.2, 3.2, 1.4, SK[2]);
  C.px(hx + 5, hy - 1.5, SK[3]).px(hx + 9, hy + 2, SK[1]);
  // 깊은 눈두덩 + 째진 눈 (빛)
  C.line(hx - 2, hy - 3.4, hx + 6, hy - 2.2, SK[0], 2);
  C.px(hx + 2, hy - 1.4, EYE).px(hx + 3, hy - 1.4, EYEC).px(hx + 4, hy - 1, EYE).px(hx + 1, hy - 1.8, EYE);
  C.px(hx + 6, hy - 1, EYE);
  // 흉터
  C.line(hx - 3, hy - 4, hx, hy + 1, SCAR);
  // 가까운 귀: 길고 좁게 뒤로 (안쪽 그늘)
  C.taper(hx - 3, hy - 1, hx - 17, hy - 6, 4.6, 0.8, SK[2]);
  C.taper(hx - 4, hy - 2.2, hx - 15, hy - 6.4, 1.4, 0.5, SK[3]);
  C.taper(hx - 4, hy + 0.4, hx - 13, hy - 4, 1.4, 0.5, SK[0]);
  C.px(hx - 11, hy - 3, SK[1]).px(hx - 12, hy - 4, 0x101010);
  // 찌그러진 쇠 투구 (코 가리개)
  for (let y = hy - 9; y <= hy - 2; y++)
    for (let x = hx - 7; x <= hx + 7; x++) {
      const u = (x + 0.5 - hx) / 7.2, v = (y + 0.5 - (hy - 2)) / 7;
      if (u * u + v * v > 1 || (x === hx + 3 && y === hy - 7)) continue;
      const k = u * -0.6 + v * -0.8 + Math.sqrt(Math.max(0, 1 - u * u - v * v)) * 0.3;
      C.px(x, y, IR[k > 0.5 ? 3 : k > 0.05 ? 2 : k > -0.45 ? 1 : 0]);
    }
  C.rect(hx - 7, hy - 3, 15, 1, IR[1]).px(hx - 5, hy - 3, IR[3]).px(hx - 1, hy - 3, IR[3]).px(hx + 3, hy - 3, IR[3]);
  C.rect(hx + 4, hy - 3, 2, 4, IR[1]).px(hx + 4, hy - 3, IR[3]);
  C.px(hx - 3, hy - 7, IR[3]).px(hx - 2, hy - 8, 0xffffff);
  // ── 가까운 팔: 쇠 어깨판 · 긴 팔 · 녹슨 넓적칼 ──
  const sh = [34, 27 + b];
  const el = [39 - ar * 8, 35 + b - ar * 10], hd = [44 - ar * 13, 41 + b - ar * 22];
  limb(C, sh[0], sh[1] + 1, el[0], el[1], 5.6, 4.4, SK);
  limb(C, el[0], el[1], hd[0], hd[1], 4.4, 3.6, SK);
  C.line(el[0], el[1], hd[0] - 0.5, hd[1] - 0.5, LE[1], 3).line(el[0] - 0.5, el[1] - 0.5, hd[0] - 1, hd[1] - 1, LE[3]);
  C.shade(sh[0], sh[1], 5, 4, IR);
  C.px(sh[0] - 2, sh[1] - 2, 0xffffff).line(sh[0] - 3, sh[1] + 2, sh[0] + 4, sh[1] + 2, IR[0]);
  // 칼: 손 → 앞쪽 아래로 (들면 위로), 이 빠진 날
  const ang = 0.35 - ar * 2.6, cs = Math.cos(ang), sn = Math.sin(ang);
  const P = (d, o) => [hd[0] + cs * d - sn * o, hd[1] + sn * d + cs * o];
  C.poly([P(2, -1.6), P(15, -2.6), P(17, 0), P(15, 2.2), P(2, 1.6)], RU[2]);
  C.poly([P(2, 0.2), P(15, 0.4), P(15, 2.2), P(2, 1.6)], RU[1]);
  C.line(...P(2.5, -1.4), ...P(15, -2.4), BL[3]);
  C.line(...P(3, -0.8), ...P(14.5, -1.6), BL[2]);
  for (const d of [7, 11]) C.px(...P(d, -2.4), -1);
  C.line(...P(-2, 0), ...P(1.5, 0), LE[1], 2);
  C.line(...P(1.6, -2.6), ...P(1.6, 2.6), IR[2], 2);
  C.ell(hd[0], hd[1], 2.4, 2.4, SK[2]).px(hd[0] - 1, hd[1] - 1, SK[3]);
  C.outline(OUT);
  return C;
}

// ════ 풀잎 슬라임 ════ 반투명한 초록 젤리 덩어리. 삼킨 뼈·돌·풀잎이 비쳐 보이고, 속 깊이 두 눈이 빛난다
export const JL = [0x173a2c, 0x23603a, 0x3a8e44, 0x6cc25a, 0xb4f08a]; // 젤리 (깊음 → 밝음, 반짝)
const JIN = 0x2c7440;
const TINT = (c, k = 0.45) => {
  const m = (s) => Math.round(((c >> s) & 255) * (1 - k) + ((0x3a8e44 >> s) & 255) * k);
  return (m(16) << 16) | (m(8) << 8) | m(0);
};
// p: scale 크기 · sq 세로 늘임(<1 납작) · lean 앞쏠림 · rip 출렁임 · blink 눈 감음 · wide 눈 부릅뜸 · hurt 번쩍
//    bulge 앞쪽이 부풀어 오름(침 뱉기) · air 공중(바닥에서 떨어져 아래로 방울이 매달림)
//    땅에 있을 때는 몸 아래 자락이 그림 맨 아래 줄까지 닿는다 (그림 바닥 = 땅 높이라서 뜨지 않음)
export function slimeFrame(p = {}) {
  const k = p.scale ?? 1, sq = p.sq ?? 1, q = Math.sqrt(sq), ln = p.lean ?? 0, rip = p.rip ?? 0, air = !!p.air, bg = p.bulge ?? 0;
  const W = Math.round(64 * k), H = Math.round(50 * k), C = canvas(W, H);
  const G = air ? H - 1 - Math.max(2, Math.round(4 * k)) : H - 1;
  const rx = (21 * k) / q, ry = 13 * k * sq, cx = 32 * k + ln * 3 * k, cy = G - ry + 1;
  const X = (dx) => cx + (dx * k) / q, Y = (dy) => cy + dy * k * sq;
  const r1 = Math.sin(rip) * 0.9 * k, r2 = Math.sin(rip + 2.1) * 0.9 * k;
  const inside = (x, y) => {
    if (y > G) return !1;
    const xx = x + (y - cy) * ln * 0.22; // 위쪽이 앞(오른쪽)으로 쏠린다
    const e = (ax, ay, bx, by) => ((xx + 0.5 - ax) / bx) ** 2 + ((y + 0.5 - ay) / by) ** 2 <= 1;
    return (
      e(cx, cy, rx, ry) ||
      e(cx - (7 * k) / q, cy - ry * 0.45 + r1, 8.5 * k, 7 * k * sq) ||
      e(cx + (6 * k) / q, cy - ry * 0.55 + r2, 9.5 * k, 7.5 * k * sq) ||
      (bg > 0 && e(cx + rx * 0.72, cy + ry * 0.05, (4 + bg * 5) * k, (3.5 + bg * 3.5) * k)) ||
      (!air && y > G - 2.4 * k && e(cx, G + 0.6, rx + 1.6 * k, 2.6 * k))
    );
  };
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!inside(x, y)) continue;
      const u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry;
      let edge = 9;
      for (let r = 1; r <= 3 && edge === 9; r++) for (const [dx, dy] of [[r, 0], [-r, 0], [0, -r], [r, -r], [-r, -r]]) !inside(x + dx, y + dy) && (edge = r);
      const lit = -u * 0.6 - v * 0.8;
      let c;
      if (edge <= 1) c = lit > 0.1 ? JL[3] : JL[2];
      else if (edge <= 2) c = lit > 0.35 ? JL[3] : JL[2];
      else {
        const cu = (x + 0.5 - (cx + 3 * k)) / (rx * 0.78), cv = (y + 0.5 - (cy + 3 * k * sq)) / (ry * 0.7), cr = cu * cu + cv * cv;
        c = lit > 0.55 ? JL[2] : cr < 0.45 && cv > 0.1 ? JL[1] : cr < 1 ? JIN : JL[2];
      }
      // 땅에 닿은 아랫단: 밝은 반사광 한 줄 + 맨 아래는 땅 그늘에 묻힌 어두운 줄
      if (!air && y === G - 1 && edge <= 3) c = JL[3];
      if (!air && y === G) c = JL[1];
      p.hurt && edge <= 2 && (c = JL[4]);
      C.px(x, y, c);
    }
  // ── 삼킨 것들 (큰 슬라임만: 뼈·해골·풀잎, 작은 것은 돌멩이 하나) ──
  if (k >= 0.8) {
    const bone = TINT(0xe8dcc0, 0.4), boneD = TINT(0xa89878, 0.45);
    C.line(X(-11), Y(2 / sq), X(-2), Y(6), boneD, 2).line(X(-11), Y(1.4 / sq), X(-2), Y(5.4), bone);
    C.ell(X(-12), Y(1 / sq), 1.6, 1.6, bone, true).ell(X(-1.4), Y(6.4), 1.6, 1.6, bone, true);
    C.ell(X(14), Y(7), 2.4, 2.2, TINT(0xe0d4b8, 0.45), true).over(X(13), Y(7), TINT(0x3a2a20, 0.4)).over(X(15), Y(7), TINT(0x3a2a20, 0.4));
    C.line(X(-6), Y(-6), X(-2), Y(-1), TINT(0x2e7a2a, 0.3)).line(X(-5), Y(-6), X(-7), Y(-3), TINT(0x2e7a2a, 0.3));
    C.ell(X(3), Y(8), 1.6, 1.2, TINT(0x8a8070, 0.5), true);
  }
  C.ell(X(9), Y(5), 2.6 * k, 2 * k, TINT(0x7a7468, 0.5), true).over(X(8), Y(4), TINT(0xb0a898, 0.5));
  // 기포 (출렁임에 따라 오르내림)
  for (const [bx, by, r] of [[-15, -2, 1.4], [14, -6, 1], [-4, 4, 1], [10, 9, 1.2]]) {
    const xx = X(bx), yy = Y(by + Math.sin(rip + bx) * 0.9), rr = Math.max(1, r * k);
    C.over(xx, yy - rr, JL[3]).over(xx - rr, yy, JL[3]).over(xx + rr, yy, JL[1]).over(xx, yy + rr, JL[1]);
  }
  // 침 뱉기: 앞쪽 부푼 곳에 모인 산성 덩이
  if (bg > 0.3) C.ell(cx + rx * 0.8, cy + ry * 0.05, 2.6 * bg * k, 2.2 * bg * k, 0x8ee048, true).over(cx + rx * 0.74, cy - ry * 0.08, 0xe8ffb0);
  // ── 눈: 홈 속 째진 빛 (부릅뜨면 크고 밝게, 감으면 가는 선) ──
  const ey = Y(-2), bl = p.blink ?? 0, wd = p.wide ?? 0;
  for (const [ex, sz] of [[6, 1], [12.5, 0.8]]) {
    const xx = X(ex), z = sz * Math.max(0.7, k), kk = Math.max(0.7, k);
    C.ell(xx, ey, (2.8 + wd * 0.5) * z, (1.7 + wd * 0.8) * kk, JL[0], true);
    if (bl > 0.6 || p.hurt) C.over(xx - 1.5 * z, ey, 0x8ac04a).over(xx - 0.5 * z, ey, 0x8ac04a).over(xx + 0.5 * z, ey, 0x8ac04a).over(xx + 1.5 * z, ey + (p.hurt ? 0.6 : 0), 0x8ac04a);
    else if (wd > 0.5) {
      C.over(xx - 1.2 * z, ey - 0.7, 0xc8f05a).over(xx - 0.2 * z, ey - 0.7, 0xffffe0).over(xx + 0.8 * z, ey - 0.9, 0xe0ff70);
      C.over(xx - 1.2 * z, ey + 0.4, 0xa8e050).over(xx - 0.2 * z, ey + 0.4, 0xf0ffb0).over(xx + 0.8 * z, ey + 0.2, 0xc8f05a);
    } else C.over(xx - 1.5 * z, ey + 0.4, 0xc8f05a).over(xx - 0.5 * z, ey, 0xf0ffb0).over(xx + 0.5 * z, ey - 0.2, 0xffffe0).over(xx + 1.5 * z, ey - 0.6, 0xc8f05a);
  }
  // ── 윤기 ──
  C.over(X(-13), Y(-6), JL[4]).over(X(-12), Y(-7), JL[4]).over(X(-11), Y(-8), JL[4]).over(X(-14), Y(-5), JL[3]);
  C.over(X(-8), Y(-10), JL[4]).over(X(-7), Y(-10.5), JL[4]).over(X(3), Y(-11.5), JL[4]);
  // ── 공중: 아래로 매달린 방울 ──
  if (air)
    for (const [dx, L] of [[-13, 2], [-3, 1], [9, 3], [15, 1]]) {
      const xx = Math.round(X(dx)), n = Math.max(1, Math.round(L * k));
      for (let j = 0; j < n; j++) C.px(xx, G + 1 + j, j === n - 1 ? JL[2] : JL[3]);
    }
  C.outline(OUT);
  return C;
}
// 동작 → 자세. 프레임을 넉넉히(숨쉬기 8장) + 빠른 재생으로 매끄럽게
//   idle 숨쉬기 · move(예비) · alert 알아챔 · crouch 뛰기 전 웅크림 · air 공중 · land 착지 출렁
//   wind 덮치기 준비 · atk 덮치기(공중) · spit 산성 뱉기 · hurt 맞음 · rec 회복
function slimeSpec(k) {
  const T = Math.PI * 2;
  return {
    fw: Math.round(64 * k), fh: Math.round(50 * k), w: Math.round(26 * k), h: Math.round(18 * k),
    anims: {
      idle: [8, 10], move: [6, 12], alert: [5, 12, !1], crouch: [3, 18, !1], air: [3, 12], land: [4, 18, !1],
      wind: [4, 12, !1], atk: [3, 14], spit: [6, 14, !1], hurt: [3, 14, !1], rec: [4, 12, !1],
    },
    px(nm, f, n) {
      const t = f / n, P = { scale: k };
      if (nm === "idle") Object.assign(P, { sq: 1 + Math.sin(t * T) * 0.05, rip: t * T, blink: f === 6 ? 1 : 0, lean: Math.sin(t * T + 1) * 0.08 });
      if (nm === "move") Object.assign(P, { sq: [0.86, 0.94, 1.05, 1.1, 1.02, 0.92][f], rip: f * 1.1 });
      if (nm === "alert") Object.assign(P, { sq: [0.78, 1.24, 1.1, 0.9, 1][f], wide: 1, rip: f * 2, lean: [0, -0.3, -0.1, 0.15, 0][f] });
      if (nm === "crouch") Object.assign(P, { sq: [0.88, 0.78, 0.72][f], lean: -0.15 * (f + 1), rip: f });
      if (nm === "air") Object.assign(P, { sq: [1.22, 1.14, 1.08][f], air: 1, rip: f * 1.4, lean: 0.2 });
      if (nm === "land") Object.assign(P, { sq: [0.64, 0.8, 1.1, 0.97][f], rip: f * 1.6, lean: [-0.15, 0, 0.1, 0][f] });
      if (nm === "wind") Object.assign(P, { sq: [0.9, 0.8, 0.72, 0.66][f], lean: -0.22 * f, wide: f >= 2 ? 1 : 0, rip: f * 2 });
      if (nm === "atk") Object.assign(P, { sq: [1.3, 1.22, 1.12][f], lean: [1.3, 1.1, 0.8][f], air: 1, wide: 1 });
      if (nm === "spit") Object.assign(P, { sq: [1.04, 1.1, 1.16, 1.18, 0.9, 0.98][f], bulge: [0.2, 0.5, 0.8, 1, 0.15, 0][f], lean: [0, -0.2, -0.35, -0.45, 0.8, 0.2][f], wide: f < 4 ? 1 : 0, rip: f });
      if (nm === "hurt") Object.assign(P, { sq: [0.66, 1.14, 0.92][f], hurt: f === 0, blink: 1, lean: [-0.7, 0.3, -0.1][f], rip: f * 3 });
      if (nm === "rec") Object.assign(P, { sq: [0.78, 1.08, 0.96, 1][f], rip: f * 2 });
      return slimeFrame(P);
    },
  };
}
export const pxSlime = slimeSpec(1);
export const pxSlimeMini = slimeSpec(0.62);

// ── 이펙트용 작은 그림 (젤리 방울 · 바닥 자국 · 산성 덩이) ──
export function slimeFxArt() {
  const drop = canvas(4, 4).px(1, 0, JL[4]).px(2, 0, JL[3]).rect(0, 1, 4, 2, JL[3]).px(1, 1, JL[4]).rect(1, 3, 2, 1, JL[2]);
  const drop2 = canvas(2, 2).rect(0, 0, 2, 2, JL[3]).px(0, 0, JL[4]);
  const puddle = canvas(34, 7);
  puddle.ell(17, 4, 16, 3, JL[2]).ell(16, 3.5, 13, 2, JL[3], true).ell(11, 3, 4, 0.8, JL[4], true).ell(22, 4.8, 6, 0.9, JL[1], true);
  puddle.outline(OUT);
  const glob = canvas(10, 10).ell(5, 5, 4, 4, 0x5ec03c).ell(4.6, 4.4, 2.8, 2.6, 0x9ae84a, true).px(3, 3, 0xe8ffb0).px(4, 2, 0xe8ffb0).outline(OUT);
  return { drop, drop2, puddle, glob };
}
