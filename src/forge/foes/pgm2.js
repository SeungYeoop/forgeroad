// 그래스메어 몬스터 (완성본, 관절로 움직이는 2D 픽셀 그림): 늑대 · 멧돼지 · 말벌 · 맨드레이크
//   그리는 법은 고블린과 같음 (pgob.js board: 부위별 6단 입체 명암 + 겹침 선 + 부위 색 외곽선). 모두 오른쪽을 본다
//   발바닥 = 그림 맨 아래 줄 (뜨지 않게). 각 스펙의 동작 이름은 rg0.js 행동 AI가 쓰는 이름 그대로
import { board, ellR, capF, polyF, U, minus, pol, lerp, ik } from "./pgob.js";

const GRAY = [0x0e1014, 0x1e2228, 0x30363e, 0x4a515a, 0x6a727a, 0x8e969c, 0xbac0c4];
const GRAYF = [0x0a0c10, 0x14181c, 0x1e2228, 0x282e34, 0x343a42, 0x40474e, 0x40474e];
const CREAM = [0x1a1814, 0x3a342a, 0x5a5242, 0x7e745e, 0xa0967c, 0xc4ba9e, 0xe2dac2];
const BROWN = [0x100a08, 0x22140e, 0x3a2416, 0x553620, 0x744c2c, 0x96683e, 0xb88a58];
const BROWNF = [0x0c0806, 0x180e0a, 0x22140e, 0x2e1c12, 0x3a2416, 0x482e1c, 0x482e1c];
const BRIST = [0x0a0606, 0x160e0a, 0x22160e, 0x302014, 0x40301e, 0x584430, 0x705a40];
const BONE = [0x2a2418, 0x4a4030, 0x6e6248, 0x948666, 0xb8aa86, 0xd8ccaa, 0xf4ecd4];
const BONEF = [0x2a2418, 0x2a2418, 0x4a4030, 0x6e6248, 0x6e6248, 0x6e6248, 0x6e6248];
const HOOF = [0x08080a, 0x141418, 0x202026, 0x2e2e36, 0x3e3e48, 0x52525e, 0x6a6a78];
const YEL = [0x1a1006, 0x4a2c08, 0x8a5a10, 0xc08a18, 0xe0b028, 0xf4d050, 0xfff090];
const BLK = [0x060608, 0x101014, 0x1a1a20, 0x26262e, 0x34343e, 0x484854, 0x62626e];
const REDE = [0x140406, 0x3a0a0e, 0x6a1418, 0x9a2020, 0xc83a2a, 0xe86a40, 0xffb070];
const ROOT = [0x140e0a, 0x2e2218, 0x4e3c2a, 0x725a40, 0x96805e, 0xbaa682, 0xdccaa6];
const ROOTF = [0x100a08, 0x221a12, 0x3a2c1e, 0x4e3c2a, 0x5e4a34, 0x6e5a40, 0x6e5a40];
const LEAF = [0x0c160e, 0x16301a, 0x22481e, 0x346a26, 0x4c8e30, 0x70b040, 0xa4d466];
const LEAFF = [0x0c160e, 0x16301a, 0x16301a, 0x22481e, 0x346a26, 0x346a26, 0x346a26];
const SNOUT = [0x140a0a, 0x3a1e1e, 0x5a3030, 0x7a4442, 0x9a5c58, 0xb87a72, 0xd09a90];
const VOID = [0x0a0604, 0x0a0604, 0x1a1008, 0x1a1008, 0x1a1008, 0x1a1008, 0x1a1008];
const MOUTHR = [0x0a0404, 0x0a0404, 0x2a0a0c, 0x2a0a0c, 0x3a1014, 0x3a1014, 0x3a1014];
const mixc = (a, b, t) => { const g = (s) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t); return (g(16) << 16) | (g(8) << 8) | g(0); };
const dots = (C, pts, c) => pts.forEach(([x, y]) => C.over(x, y, c));
const strokes = (C, list, c) => list.forEach(([x0, y0, x1, y1]) => { const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0))); for (let k = 0; k <= n; k++) C.over(x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n, c); });
// 맞았을 때 번쩍 (외곽선 빼고 하얗게)
export function flash(C, t = 0.6) {
  for (let i = 0; i < C.d.length; i++) { const c = C.d[i]; if (c < 0) continue; const l = ((c >> 16) & 255) + ((c >> 8) & 255) + (c & 255); l > 90 && (C.d[i] = mixc(c, 0xffffff, t)); }
  return C;
}
const rot = (o, a) => (q) => { const c = Math.cos(a), s = Math.sin(a), dx = q[0] - o[0], dy = q[1] - o[1]; return [o[0] + dx * c - dy * s, o[1] + dx * s + dy * c]; };
function glassWing(C, f, dark = 0, back = !1) {
  for (let y = 0; y < C.H; y++) for (let x = 0; x < C.W; x++) {
    if (!f(x + 0.5, y + 0.5)) continue;
    const i = y * C.W + x, edge = !f(x - 0.5, y + 0.5) || !f(x + 0.5, y - 0.5) || !f(x + 1.5, y + 0.5) || !f(x + 0.5, y + 1.5);
    if (back && C.d[i] >= 0) continue;
    if (edge) C.d[i] = mixc(0x2e3a46, 0x10141a, dark);
    else if (C.d[i] >= 0) C.d[i] = mixc(C.d[i], 0xd8e8f2, 0.5 - dark);
    else C.d[i] = (x + y) & 1 ? -1 : mixc(0xd4e6f0, 0x5a6a78, dark);
  }
}
const T2 = Math.PI * 2;
const L = (a, b, t) => a + (b - a) * t;

// ════ 초원 회색늑대 ════
//   p: bob · pitch(+ 앞이 들림) · crouch 웅크림 · legs {fn,ff,bn,bf: [발 x 이동, 들림]} · head 고개 들기 · jaw 입 벌림 · tail 꼬리 각
export function wolfFrame(p = {}) {
  const W = 62, H = 38, G = H - 1, C = board(W, H);
  const b = (p.bob ?? 0) + (p.crouch ?? 0) * 3.5, pt = p.pitch ?? 0, jw = p.jaw ?? 0, hu = p.head ?? 0, tl = p.tail ?? 0;
  const lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) };
  const R = rot([30, 22], -pt), P = (x, y) => R([x, y + b]);
  // 다리 하나: 앞다리 = 어깨→팔꿈치(뒤로)→발, 뒷다리 = 엉덩이→무릎(앞)→발목(뒤)→발
  const front = (far, o) => {
    const S = P(far ? 40.5 : 38, 25), pw = [S[0] + 1.5 + o[0], G - 1.2 - o[1]];
    const E = ik(S, pw, 6.4, 7.4, -1), Rm = far ? GRAYF : GRAY;
    !far && C.part(ellR(S[0], S[1] - 0.5, 4.2, 5, 0.2), GRAY, { shine: 1 });
    C.part(U(capF(S, E, 2.5, 1.8), capF(E, pw, 1.7, 1.4)), Rm);
    C.part(ellR(pw[0] + 1.2, pw[1], 2.5, 1.3), Rm, { shine: !far });
    !far && dots(C, [[pw[0] + 2, pw[1] + 1], [pw[0] + 3.4, pw[1] + 1]], BONE[4]);
  };
  const back = (far, o) => {
    const Hp = P(far ? 21.5 : 19.5, 25), pw = [Hp[0] - 2.5 + o[0], G - 1.2 - o[1]], hk = [pw[0] - 2.2, pw[1] - 4.6];
    const K = ik(Hp, hk, 6.4, 5.4, 1), Rm = far ? GRAYF : GRAY;
    !far && C.part(ellR(Hp[0], Hp[1] - 0.5, 5, 5.6, 0.35), GRAY, { shine: 1 });
    C.part(U(capF(Hp, K, 3, 2.2), capF(K, hk, 2.2, 1.6), capF(hk, pw, 1.6, 1.4)), Rm);
    C.part(ellR(pw[0] + 1.2, pw[1], 2.5, 1.3), Rm, { shine: !far });
    !far && dots(C, [[pw[0] + 2, pw[1] + 1], [pw[0] + 3.4, pw[1] + 1]], BONE[4]);
  };
  front(!0, lg.ff);
  back(!0, lg.bf);
  // 꼬리
  { const t0 = P(13, 19), a = 2.5 + tl, t1 = pol(t0, a, 6), t2 = pol(t1, a + 0.5, 6);
    C.part(U(capF(t0, t1, 3.2, 3.8), capF(t1, t2, 3.8, 1.5)), GRAY, { shine: 1 });
    C.over(t2[0], t2[1], CREAM[4]); }
  // 몸통 + 배(크림)
  const bd = [P(39, 22), P(21, 22)];
  const body = U(ellR(bd[0][0], bd[0][1], 9, 7.4, -0.1 - pt), ellR(bd[1][0], bd[1][1], 8.4, 6.2, 0.05 - pt), capF(P(21, 21), P(38, 21), 5.8, 6.8));
  C.part(body, GRAY, { shine: 1 });
  C.part((x, y) => body(x, y) && y > 26.4 + b + (x - 30) * (-0.05 - pt) + Math.sin(x * 0.9) * 0.4, CREAM, { sep: !1, lv: -0.1 });
  const sk = [[24, 17, 27, 19], [29, 16.5, 32, 18.5], [34, 16, 37, 18], [19, 19, 22, 21], [27, 21, 30, 22.5], [33, 21, 36, 22.5]].map(([a, c, d, e]) => [...P(a, c), ...P(d, e)]);
  strokes(C, sk, GRAY[3]);
  // 갈기
  C.part(polyF([[40, 13], [43, 10.5], [44.5, 12], [47, 10], [48, 13], [50.5, 15], [49, 20], [50, 24], [47, 23], [46.5, 26.5], [44, 24.5], [42, 27.5], [40.5, 23], [37.5, 21], [38, 16]].map(([x, y]) => P(x, y - hu * 0.6))), GRAY, { shine: 1 });
  // 머리 (고개 들기: 위로 돌림)
  const Hr = rot(P(47, 17), -hu * 0.9 - pt * 0.3), Q = (x, y) => Hr(P(x, y));
  C.part(polyF([Q(49.5, 11), Q(51.5, 4.5), Q(53, 10.5)]), GRAYF);
  C.part(U(ellR(...Q(50.5, 14.5), 5.4, 4.8, 0.15 - hu * 0.9), capF(Q(53, 15.5), Q(59.5, 18), 3, 1.9)), GRAY, { shine: 1 });
  const ja = rot(Q(52, 19.5), jw * 0.5 - hu * 0.9 - pt * 0.3);
  C.part(capF(Q(51, 19.5), ja(Q(57.5, 20.6 + 0)), 2, 1.2), GRAY, { lv: 0.12 });
  jw > 0.3 && dots(C, [Q(55, 20.4), Q(57, 20.6)], BONE[6]);
  C.part(ellR(...Q(59.6, 17.4), 1.6, 1.4), BLK, { sep: !1, shine: 1 });
  strokes(C, [[...Q(52.5, 19.4), ...Q(58, 19.6)]], 0x140a0c);
  dots(C, [Q(55, 20.2), Q(57, 20.3)], BONE[6]);
  strokes(C, [[...Q(54, 15.6), ...Q(56.5, 16.2)]], GRAY[2]);
  dots(C, [Q(51, 12.6), Q(52, 12.8), Q(53, 13.2), Q(54, 13.6)], GRAY[1]);
  if (!p.blink) { const e0 = Q(52, 13.8), e1 = Q(53, 14); C.over(...e0, 0xe0a030).over(...e1, 0xfff0a0); }
  C.part(polyF([Q(46, 12), Q(47.5, 4), Q(50.5, 10.5)]), GRAY, { shine: 1 });
  back(!1, lg.bn);
  front(!1, lg.fn);
  C.selout();
  return p.hurt ? flash(C) : C;
}
const wolfRun = (f, n, A, lift) => {
  const ph = (f / n) * T2, s = Math.sin(ph), c = Math.cos(ph);
  return { bob: -Math.abs(c) * 1.2 + 0.4, pitch: s * 0.06, tail: s * 0.2, legs: { fn: [A * s, lift * Math.max(0, c)], ff: [A * Math.sin(ph + 0.6), lift * Math.max(0, Math.cos(ph + 0.6))], bn: [-A * s, lift * Math.max(0, -c)], bf: [-A * Math.sin(ph + 0.6), lift * Math.max(0, -Math.cos(ph + 0.6))] } };
};
export const pxWolf = {
  fw: 62, fh: 38, w: 30, h: 18,
  anims: { idle: [6, 8], move: [8, 16], wind: [4, 12, !1], atk: [3, 14, !1], rec: [3, 10, !1], hurt: [2, 10, !1], howl: [5, 8, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = {};
    if (nm === "idle") P = { bob: Math.sin(ph) * 0.5, tail: Math.sin(ph) * 0.15, jaw: 0.2 + Math.max(0, Math.sin(ph)) * 0.3, blink: f === 4 };
    if (nm === "move") P = wolfRun(f, n, 5.5, 3);
    if (nm === "wind") P = { crouch: t, pitch: -0.08 * t, tail: -0.3 * t, jaw: t, legs: { fn: [2 * t, 0], ff: [2 * t, 0], bn: [-2 * t, 0], bf: [-2 * t, 0] } };
    if (nm === "atk") P = { bob: -2 - f, pitch: 0.16 - f * 0.06, jaw: 1, tail: 0.4, legs: { fn: [7, 4], ff: [6, 3.4], bn: [-7, 3], bf: [-6, 2.6] } };
    if (nm === "rec") P = { pitch: -0.05 * (1 - t), crouch: 0.5 * (1 - t), jaw: 0.5, legs: { fn: [2, 0], ff: [2, 0], bn: [-2, 0], bf: [-2, 0] } };
    if (nm === "hurt") P = { hurt: f === 0, pitch: -0.1, crouch: 0.3, jaw: 0.6, blink: 1, tail: -0.4 };
    if (nm === "howl") P = { head: Math.min(1, f * 0.45), pitch: 0.12 * Math.min(1, f * 0.5), jaw: f >= 2 ? 1 : 0.4, tail: 0.3, legs: { bn: [-1, 0], bf: [-1, 0] } };
    return wolfFrame(P);
  },
};

// ════ 엄니 멧돼지 ════
//   p: bob · head 고개 숙임(돌진) · legs {fn,ff,bn,bf} · scrape 앞발 긁기(0~1) · dizzy 어지러움(눈 X) · hurt
export function boarFrame(p = {}) {
  const W = 66, H = 42, G = H - 1, C = board(W, H);
  const b = p.bob ?? 0, hd = p.head ?? 0, dz = p.dizzy;
  const lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) };
  const leg = (top, o, far, front) => {
    const ft = [top[0] + o[0] * 0.8, G - 4.4 - o[1]], kn = [L(top[0], ft[0], 0.5) + (front ? 0.6 : -0.8), L(top[1], ft[1], 0.55)];
    C.part(U(capF(top, kn, far ? 3 : 3.4, 2.6), capF(kn, ft, 2.6, 2.3)), far ? BROWNF : BROWN, { shine: !far });
    C.part(polyF([[ft[0] - 2.6, ft[1] - 0.4], [ft[0] + 2.6, ft[1] - 0.4], [ft[0] + 3.2, ft[1] + 4.3], [ft[0] - 3, ft[1] + 4.3]]), HOOF, { shine: !far });
    !far && C.over(ft[0] + 0.3, ft[1] + 3, HOOF[1]);
  };
  leg([47, 28 + b], lg.ff, !0, !0);
  leg([23, 30 + b], lg.bf, !0, !1);
  C.part(U(capF([12, 20 + b], [8.5, 19 + b], 1.2, 0.9), capF([8.5, 19 + b], [8, 22.5 + b], 0.9, 0.6)), BROWN);
  const body = U(ellR(31, 23 + b, 14.5, 9.5, -0.06), ellR(37, 17.5 + b, 9.5, 6.5, -0.25), ellR(19, 24 + b, 8, 8));
  C.part(body, BROWN, { shine: 1 });
  strokes(C, [[21, 18, 24, 21], [26, 16, 29, 19], [31, 15, 34, 18], [19, 25, 22, 28], [26, 26, 29, 29], [33, 25, 36, 28]].map(([a, c, d, e]) => [a, c + b, d, e + b]), BROWN[3]);
  strokes(C, [[28, 20 + b, 34, 23 + b]], 0xa4705a);
  strokes(C, [[28, 21 + b, 34, 24 + b]], BROWN[2]);
  const sp = [];
  for (let i = 0; i <= 12; i++) { const x = 17 + i * 2.3, y = 14 + b - Math.sin((i / 12) * Math.PI) * 3.5 - (i > 8 ? (i - 8) * 0.5 : 0) + (p.bristle ? -0.8 : 0); sp.push([x, y + 2.5], [x + 1.15, y - 1.6 - (i % 2) * (1 + (p.bristle ? 1 : 0))]); }
  sp.push([46, 13 + b], [45, 17 + b], [17, 18 + b]);
  C.part(polyF(sp), BRIST, { shine: 1 });
  // 머리 (고개 숙이면 아래로 돌림)
  const Hr = rot([44, 22 + b], hd * 0.35), Q = (x, y) => Hr([x, y + b]);
  C.part(U(ellR(...Q(46, 21), 7.5, 7.5), polyF([Q(42, 14.5), Q(52, 16.5), Q(59, 22), Q(61, 26), Q(58, 29.5), Q(48, 30), Q(41, 26)])), BROWN, { shine: 1 });
  C.part(ellR(...Q(60.5, 25.8), 1.8, 2.8, hd * 0.35), SNOUT, { sep: !1, shine: 1 });
  dots(C, [Q(60.4, 25), Q(60.4, 27)], 0x1a0a0a);
  strokes(C, [[...Q(52, 20), ...Q(56, 22.5)], [...Q(53, 23), ...Q(57, 24.5)]], BROWN[2]);
  strokes(C, [[...Q(50, 28.5), ...Q(57, 28)]], 0x140a08);
  C.part(capF(Q(53.5, 28), Q(55.5, 25), 0.9, 0.5), BONEF, { sep: !1 });
  C.part(U(capF(Q(55.5, 29), Q(59, 25.5), 1.4, 0.8), capF(Q(59, 25.5), Q(58.5, 21.5), 0.8, 0.35)), BONE, { shine: 1, sep: !1 });
  dots(C, [Q(47, 17), Q(48, 17.2), Q(49, 17.6), Q(50, 18.2)], BROWN[0]);
  if (dz) { const e = Q(49, 19); C.over(e[0] - 0.6, e[1] - 0.6, 0xfff0a0).over(e[0] + 0.6, e[1] + 0.6, 0xfff0a0).over(e[0] + 0.6, e[1] - 0.6, 0xfff0a0).over(e[0] - 0.6, e[1] + 0.6, 0xfff0a0); }
  else C.over(...Q(48.6, 18.8), 0xc83020).over(...Q(49.6, 19), 0xff9060);
  C.part(polyF([Q(43.5, 14), Q(41 - hd, 7.5 + hd), Q(47.5, 12)]), BROWN, { shine: 1 });
  // 가까운 다리 (긁기: 앞발을 뒤로 끌며 들었다 놓음)
  const sc = p.scrape ?? 0;
  C.part(ellR(43, 28 + b, 5, 5.5), BROWN, { shine: 1 });
  leg([43.5, 31 + b], [lg.fn[0] - sc * 6, lg.fn[1] + Math.sin(sc * Math.PI) * 3], !1, !0);
  C.part(ellR(19, 28 + b, 6, 6.5), BROWN, { shine: 1 });
  leg([18.5, 32 + b], lg.bn, !1, !1);
  C.selout();
  return p.hurt ? flash(C) : C;
}
export const pxBoar = {
  fw: 66, fh: 42, w: 34, h: 24,
  anims: { idle: [4, 6], move: [8, 12], scrape: [4, 12, !1], charge: [6, 18], stun: [4, 6], hurt: [2, 10, !1], rec: [2, 8, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2, s = Math.sin(ph), c = Math.cos(ph);
    let P = {};
    const gait = (A, lift) => ({ fn: [A * s, lift * Math.max(0, c)], bf: [A * s, lift * Math.max(0, c)], ff: [-A * s, lift * Math.max(0, -c)], bn: [-A * s, lift * Math.max(0, -c)] });
    if (nm === "idle") P = { bob: Math.sin(ph) * 0.5, head: Math.sin(ph) * 0.1 };
    if (nm === "move") P = { bob: -Math.abs(c) * 0.8 + 0.3, legs: gait(3.5, 2.2), head: 0.05 };
    if (nm === "scrape") P = { scrape: [0.2, 0.9, 0.6, 0][f], head: 0.25, bristle: 1, bob: 0.5 };
    if (nm === "charge") P = { bob: -Math.abs(c) * 1.4 + 0.6, legs: gait(6, 3.5), head: 0.45, bristle: 1 };
    if (nm === "stun") P = { dizzy: 1, head: -0.15 + Math.sin(ph) * 0.12, bob: Math.sin(ph) * 0.6 };
    if (nm === "hurt") P = { hurt: f === 0, head: -0.2, bob: -0.5 };
    if (nm === "rec") P = { head: 0.2 * (1 - t) };
    return boarFrame(P);
  },
};

// ════ 거대 말벌 ════ p: flap 날개(-1~1) · curl 배 말기(0~1) · tilt 몸 기울기 · hurt
export function waspFrame(p = {}) {
  const W = 50, H = 42, C = board(W, H);
  const fl = p.flap ?? 0, cu = p.curl ?? 0, tl = p.tilt ?? 0;
  const R = rot([27, 19], tl), P = (x, y) => R([x, y]);
  for (const [x0, x1, y1] of [[25, 22, 30], [28, 27, 31], [30, 32, 30]]) C.part(U(capF(P(x0, 22), P(x1, 26), 1, 0.8), capF(P(x1, 26), P(x1 - 1, y1), 0.8, 0.5)), BLK);
  // 배: 마디에서 아래로 접힘 (curl 이 크면 앞쪽 아래로 말려 독침이 앞을 향함)
  const Rab = rot([21, 22], -cu * 1.25), A2 = (x, y) => P(...Rab([x, y]));
  const aa = 0.55 - cu * 1.25 + tl, abc = A2(14, 26);
  const ab = ellR(abc[0], abc[1], 9.5, 6.6, aa), st0 = A2(7.5, 31.5), st1 = A2(3, 36.5);
  C.part(capF(st0, st1, 1.6, 0.3), BLK, { shine: 1 });
  C.part(ab, YEL, { shine: 1 });
  const ca = Math.cos(aa), sa = Math.sin(aa);
  C.part((x, y) => { if (!ab(x, y)) return !1; const u = (x - abc[0]) * ca + (y - abc[1]) * sa; return Math.abs(((u + 40) % 5.2) - 2.6) < 1.1 || u < -7; }, BLK, { sep: !1 });
  C.part(capF(P(20.5, 22), P(24, 20), 1.6), BLK);
  C.part(ellR(...P(27, 18), 6.2, 5.6), BLK, { shine: 1 });
  C.part(ellR(...P(28, 15.5), 2.6, 1.4), YEL, { sep: !1 });
  C.part(ellR(...P(25, 21), 1.6, 1.2), YEL, { sep: !1 });
  C.part(ellR(...P(35, 18.5), 4.6, 4.4), YEL, { shine: 1 });
  C.part(ellR(...P(36.2, 16.8), 2.8, 3.2, 0.2 + tl), REDE, { shine: 1 });
  dots(C, [P(35.5, 16), P(37, 17.5), P(36, 18.6)], REDE[2]);
  const mo = p.bite ?? 0;
  C.part(U(capF(P(37.5, 21.5), P(41, 23.5 - mo), 1, 0.5), capF(P(36.5, 22), P(39, 24.8 + mo), 0.9, 0.4)), BLK, { sep: !1 });
  for (const [a, bb] of [[[35, 14.2], [38, 9]], [[33.5, 14.5], [35, 8.5]]]) { C.part(capF(P(...a), P(...bb), 0.6, 0.5), BLK, { sep: !1 }); C.part(capF(P(...bb), P(bb[0] + 2.5, bb[1] - 0.5), 0.5, 0.4), BLK, { sep: !1 }); }
  C.selout();
  glassWing(C, ellR(...P(20, 10.5 - fl * 3), 8.5, 3.4 - Math.abs(fl) * 0.8, -0.6 - fl * 0.5 + tl), 0.3, !0);
  glassWing(C, ellR(...P(26, 8.5 - fl * 3), 10, 3.6 - Math.abs(fl) * 0.8, -0.4 - fl * 0.5 + tl));
  return p.hurt ? flash(C) : C;
}
export const pxWasp = {
  fw: 50, fh: 42, w: 20, h: 16, flying: !0,
  anims: { idle: [4, 24], wind: [4, 12, !1], atk: [3, 16], rec: [3, 10, !1], hurt: [2, 12, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), fl = [1, 0.2, -1, 0.2][f % 4];
    let P = { flap: fl };
    if (nm === "wind") P = { flap: fl, curl: t, tilt: -0.1 * t };
    if (nm === "atk") P = { flap: [-1, 0.6, -0.4][f], curl: 1, tilt: 0.45, bite: 1 };
    if (nm === "rec") P = { flap: fl, curl: 1 - t, tilt: 0.2 * (1 - t) };
    if (nm === "hurt") P = { flap: 0.6, hurt: f === 0, tilt: -0.25 };
    return waspFrame(P);
  },
};

// ════ 맨드레이크 ════ p: up 땅 위로 나온 정도(0 = 잎만, 1 = 다 나옴) · scream 비명(0~1) · walk 걸음 위상 · sway 잎 흔들림 · hurt
export function mandrakeFrame(p = {}) {
  const W = 32, H = 40, G = H - 1, C = board(W, H);
  const up = p.up ?? 1, sc = p.scream ?? 0.2, wk = p.walk ?? 0, sw = p.sway ?? 0;
  const dy = (1 - up) * 28; // 땅속으로 내려간 만큼
  const D = (x, y) => [x, y + dy];
  const ls = Math.sin(wk) * 2.2, lb = Math.cos(wk);
  C.part(U(ellR(...D(10 + sw, 7), 2.6, 6, -0.6 + sw * 0.1), ellR(...D(22 + sw, 7.5), 2.6, 6, 0.65 + sw * 0.1)), LEAFF);
  C.part(U(capF(D(16, 13), D(16 + sw * 0.5, 9), 1, 0.8), ellR(...D(16 + sw, 5), 2.8, 5.5, 0.05 + sw * 0.1), ellR(...D(12.5 + sw, 8.5), 2.2, 5, -0.9 + sw * 0.1), ellR(...D(19.5 + sw, 8.5), 2.2, 5, 0.9 + sw * 0.1)), LEAF, { shine: 1 });
  strokes(C, [[...D(16 + sw, 2), ...D(16, 9)], [...D(10.5 + sw, 6.5), ...D(13.5, 10.5)], [...D(21.5 + sw, 6.5), ...D(18.5, 10.5)]], LEAF[2]);
  if (up > 0.05) {
    C.part(U(capF(D(21, 23), D(26.5, 19 - sc * 4), 1.4, 0.6), capF(D(26.5, 19 - sc * 4), D(28, 17 - sc * 6), 0.6, 0.35)), ROOTF);
    C.part(U(capF(D(17.5, 31), D(20 - ls, 38.5 - Math.max(0, lb) * 1.5), 2, 1.2), capF(D(20 - ls, 38.5 - Math.max(0, lb) * 1.5), D(22.5 - ls, 39.4 - Math.max(0, lb) * 1.5), 1.1, 0.6)), ROOTF);
    C.part(U(ellR(...D(16, 20), 7.6, 8.4), ellR(...D(13, 15), 3, 2.4), capF(D(16, 25), D(15.5, 31), 5, 3)), ROOT, { shine: 1 });
    strokes(C, [[...D(10, 16), ...D(11, 22)], [...D(21, 17), ...D(22, 23)], [...D(12.5, 26), ...D(14, 29)], [...D(18, 25), ...D(17.5, 29)]], ROOT[2]);
    dots(C, [D(9, 21), D(23, 19), D(9.5, 25), D(22.5, 24), D(11, 13), D(20, 13)], ROOT[5]);
    C.part(ellR(...D(12.6, 18), 1.7, 2.2, -0.2), VOID, { sep: !1 });
    C.part(ellR(...D(19, 18), 1.7, 2.2, 0.2), VOID, { sep: !1 });
    C.over(...D(12.8, 18.4), 0xd8f0a0).over(...D(18.8, 18.4), 0xd8f0a0);
    C.part(ellR(...D(15.8, 23.5), 1.2 + sc * 1.6, 1.2 + sc * 2.2), MOUTHR, { sep: !1 });
    strokes(C, [[...D(10.5, 15.5), ...D(13.5, 16.5)], [...D(21, 15.5), ...D(18, 16.5)]], ROOT[1]);
    C.part(U(capF(D(11, 22), D(5.5, 18 - sc * 4), 1.5, 0.7), capF(D(5.5, 18 - sc * 4), D(3.5, 15.5 - sc * 6), 0.7, 0.35), capF(D(5.5, 18 - sc * 4), D(3, 19 - sc * 2), 0.5, 0.3)), ROOT, { shine: 1 });
    C.part(U(capF(D(14, 31), D(11 + ls, 38.5 - Math.max(0, -lb) * 1.5), 2.2, 1.3), capF(D(11 + ls, 38.5 - Math.max(0, -lb) * 1.5), D(8.4 + ls, 39.4 - Math.max(0, -lb) * 1.5), 1.2, 0.6), capF(D(12.5, 35), D(14.5, 39.4), 0.8, 0.4)), ROOT, { shine: 1 });
  }
  // 땅 아래로 들어간 부분은 지운다 (흙 둔덕을 덮어 그림)
  if (up < 1) {
    C.part(ellR(16, G + 1.2, 9 * (1 - up * 0.4), 3), [0x140e08, 0x2e2010, 0x4a3418, 0x5e4422, 0x7a5a30, 0x967444, 0xb08c58], { shine: 1 });
  }
  C.selout();
  return p.hurt ? flash(C) : C;
}
export const pxMandrake = {
  fw: 32, fh: 40, w: 16, h: 22,
  anims: { hide: [2, 3], rise: [5, 14, !1], idle: [4, 8], move: [6, 14], scream: [4, 12, !1], burrow: [5, 14, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = {};
    if (nm === "hide") P = { up: 0, sway: [0, 0.6][f] };
    if (nm === "rise") P = { up: [0.1, 0.35, 0.7, 1, 1][f], scream: 0.2, sway: [0.5, -0.5, 0.4, 0, 0][f] };
    if (nm === "idle") P = { sway: Math.sin(ph) * 0.4, scream: 0.15 + Math.max(0, Math.sin(ph)) * 0.1 };
    if (nm === "move") P = { walk: ph, sway: Math.sin(ph) * 0.6, scream: 0.3 };
    if (nm === "scream") P = { scream: [0.5, 1, 1, 0.8][f], sway: [0.6, -0.8, 0.8, -0.4][f] };
    if (nm === "burrow") P = { up: 1 - t, scream: 0.3, sway: Math.sin(f * 2) * 0.5 };
    if (nm === "hurt") P = { hurt: f === 0, scream: 0.7, sway: 0.8 };
    return mandrakeFrame(P);
  },
};
