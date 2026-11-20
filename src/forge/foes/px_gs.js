// 그린스텝 몬스터 12종 (2D 픽셀 손그림, 오른쪽을 본다) — 거점 위 하늘 입문, 풀로 덮인 계단 섬
//   아래 섬 줄: 솜털 구름양 · 풀섬 토끼 · 새싹 정령 · [정예] 숫양 대장
//   가운데 줄: 참새 떼 · 꽃 해파리 · 민들레 기사 · [정예] 거대 무당벌레
//   위 줄: 하늘 매 · 비구름 정령 · 바람개비 요정 · [정예] 구름 고래 새끼
import { board, ellR, capF, polyF, U, minus, pol, lerp, ik, ramp, rampF, rampGlow, mixc, dots, strokes, rot, eye, glass, limb, gait4, gait2, flapOf, spec, done, flash, T2, L } from "./kit.js";
import { sculpt, mat } from "./px3.js";

const FLUFF = ramp(0xf0ecf4, { cool: 0x5a6a9a, hi: 0.2 }), FLUFFD = ramp(0xc8c4d8, { cool: 0x4a5a8a }), GRASS = ramp(0x78c850), GRASSD = ramp(0x5aa83e);
const puff = (C, cx, cy, rx, ry, R, n = 7, seed = 0) => {
  const fs = [];
  for (let k = 0; k < n; k++) { const a = (k / n) * T2 + seed, r = 0.62 + ((k * 37) % 7) / 20; fs.push(ellR(cx + Math.cos(a) * rx * 0.62, cy + Math.sin(a) * ry * 0.6, rx * 0.5 * r + 1, ry * 0.5 * r + 1)); }
  C.part(U(ellR(cx, cy, rx * 0.8, ry * 0.8), ...fs), R, { shine: 1 });
};

// ════ 솜털 구름양 ════ 구름 같은 솜털 덩어리에 까만 얼굴과 짧은 다리. 솜털을 부풀렸다 들이받아 민다
//   p: legs · bob · fluff 부풀림 · head 숙임 · hurt
const SHEEPF = ramp(0x2a2630), SHEEPFF = rampF(0x2a2630);
function sheepFrame(p = {}) {
  const W = 46, H = 34, G = H - 1, C = board(W, H);
  const b = p.bob ?? 0, fz = p.fluff ?? 0, lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) }, hd = p.head ?? 0;
  for (const [x, o, far] of [[28, lg.ff, 1], [14, lg.bf, 1]]) C.part(capF([x, 24 + b], [x + o[0], G - 0.5 - o[1]], 1.8, 1.6), far ? SHEEPFF : SHEEPF, { sep: !1 });
  puff(C, 21, 17 + b, 14 + fz * 3, 10 + fz * 2, FLUFF, 8, 0.3);
  // 머리 (까만 얼굴 + 솜털 앞머리)
  const hx = 34 + hd * 2, hy = 16 + b + hd * 4;
  C.part(U(ellR(hx, hy, 5, 4.6), polyF([[hx + 2, hy - 1], [hx + 7, hy + 1], [hx + 5, hy + 4], [hx + 1, hy + 4]])), SHEEPF, { shine: 1 });
  C.part(capF([hx - 3, hy - 1], [hx - 7, hy + 2], 1.6, 1), SHEEPF, { sep: !1 }); // 귀
  puff(C, hx - 1, hy - 4, 4.6, 3, FLUFF, 5, 1);
  !p.hurt && (C.over(hx + 2, hy, 0xf0f0e0), C.over(hx + 2.5, hy, 0x101010));
  for (const [x, o] of [[26, lg.fn], [12, lg.bn]]) C.part(capF([x, 25 + b], [x + o[0], G - 0.5 - o[1]], 1.9, 1.7), SHEEPF, { sep: !1, shine: 1 });
  return done(C, p);
}
export const pxSheep = spec(46, 34, 22, 18,
  { idle: [4, 5], move: [6, 12], wind: [4, 10, !1], atk: [4, 16], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "idle") return { bob: Math.sin(ph) * 0.4, fluff: Math.max(0, Math.sin(ph)) * 0.2 };
    if (nm === "move") { const g = gait4(f, n, 3.5, 2); return { legs: g, bob: g.bob }; }
    if (nm === "wind") return { fluff: t, head: t * 0.8, bob: t };
    if (nm === "atk") { const g = gait4(f, n, 5, 2.5); return { legs: g, head: 0.9, fluff: 0.6 }; }
    if (nm === "rec") return { fluff: 0.6 * (1 - t), head: 0.9 * (1 - t) };
    return { hurt: f === 0, fluff: 0.8, head: -0.3 };
  }, sheepFrame);

// ════ 풀섬 토끼 ════ 긴 귀 · 흰 솜꼬리 · 강한 뒷다리. 깡충깡충 다가와 뒷발로 걷어찬다
//   p: bob · crouch · ears 귀 젖힘 · kick 뒷발차기(0~1) · air · hurt
const RAB = ramp(0xc8a87a), RABF = rampF(0xb0906a), RABB = ramp(0xf4ecdc);
function rabbitFrame(p = {}) {
  const W = 38, H = 34, G = H - 1, C = board(W, H);
  const b = (p.bob ?? 0) + (p.crouch ?? 0) * 3, ea = p.ears ?? 0, kk = p.kick ?? 0, air = p.air ?? 0;
  // 뒷다리 (차기: 뒤로 쭉)
  const hip = [14, 22 + b];
  const ft = kk > 0 ? [hip[0] - 10 - kk * 4, hip[1] + 2] : [hip[0] + 4 - air * 4, G - 0.5 - air * 3];
  C.part(U(ellR(hip[0], hip[1], 5.6, 5), capF(hip, ft, 3, 2)), RABF, { shine: 1 });
  C.part(ellR(ft[0] + (kk > 0 ? -2 : 2), ft[1], 3.6, 1.6), RABF, { sep: !1 });
  // 몸 + 꼬리
  C.part(ellR(17, 19 + b, 9, 7, -0.2), RAB, { shine: 1 });
  C.part(ellR(8, 18 + b, 3.4, 3.2), RABB, { shine: 1 });
  C.part(ellR(19, 22 + b, 5, 3.6), RABB, { sep: !1 });
  // 머리 + 귀
  const hx = 26, hy = 12 + b;
  for (const [dx, far] of [[-1, 1], [1.5, 0]]) { const e0 = [hx - 2 + dx, hy - 3], e1 = [hx - 6 + dx - ea * 6, hy - 14 + ea * 5]; C.part(capF(e0, e1, 2, 1.4), far ? RABF : RAB, { shine: !far }); !far && C.part(capF(lerp(e0, e1, 0.2), lerp(e0, e1, 0.85), 0.8, 0.6), ramp(0xe8a0a0), { sep: !1 }); }
  C.part(ellR(hx, hy, 5.4, 4.6), RAB, { shine: 1, lv: 0.05 });
  C.part(ellR(hx + 3.6, hy + 1.6, 2, 1.6), RABB, { sep: !1 });
  !p.hurt && (C.over(hx + 1.6, hy - 1, 0x2a1810), C.over(hx + 2, hy - 1.6, 0xffffff));
  C.over(hx + 5.2, hy + 0.8, 0xd87a7a);
  // 앞발
  C.part(capF([22, 22 + b], [24 + air * 2, G - 1 - air * 4], 1.6, 1.3), RAB, { sep: !1 });
  return done(C, p);
}
export const pxRabbit = spec(38, 34, 14, 16,
  { idle: [6, 8], move: [4, 12], wind: [3, 12, !1], atk: [3, 18, !1], rec: [3, 10, !1], hurt: [2, 10, !1], hop: [4, 12, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "idle") return { bob: Math.sin(ph) * 0.3, ears: f === 3 ? 0.4 : 0 };
    if (nm === "move" || nm === "hop") return [{ crouch: 1 }, { air: 1, ears: 0.6, bob: -3 }, { air: 0.6, ears: 0.4, bob: -2 }, { crouch: 0.6 }][f];
    if (nm === "wind") return { crouch: t, ears: 0.6 * t };
    if (nm === "atk") return { kick: [0.6, 1, 1][f], ears: 0.8, bob: -1 };
    if (nm === "rec") return { kick: 1 - t, ears: 0.4 };
    return { hurt: f === 0, ears: 1, crouch: 0.5 };
  }, rabbitFrame);

// ════ 새싹 정령 ════ 땅에 뿌리박은 작은 새싹 요정. 큰 떡잎 두 장 · 꽃봉오리 머리. 씨앗을 세 발씩 쏜다
//   p: sway · open 꽃봉오리 벌림 · recoil · hurt
const SPR = ramp(0x8ad858), SPRD = ramp(0x5ab03e), BLOOM = ramp(0xffb0c8);
function sproutFrame(p = {}) {
  const W = 32, H = 34, G = H - 1, C = board(W, H);
  const sw = p.sway ?? 0, op = p.open ?? 0, rc = p.recoil ?? 0;
  // 뿌리 흙
  C.part(ellR(16, G - 1, 8, 2.6), ramp(0x8a6a4a), { shine: 1 });
  for (const dx of [-5, 0, 5]) C.part(capF([16 + dx, G - 1], [16 + dx * 1.6, G + 1], 0.8, 0.5), ramp(0x6a4a30), { sep: !1 });
  // 줄기 + 떡잎
  const top = [16 + sw * 2 - rc * 2, 12];
  C.part(capF([16, G - 2], top, 2, 1.6), SPRD, { shine: 1 });
  C.part(ellR(10 + sw, 18, 6, 3, -0.5), SPR, { shine: 1 });
  C.part(ellR(22 + sw, 17, 6, 3, 0.5), SPR, { shine: 1 });
  strokes(C, [[7 + sw, 19.5, 13 + sw, 17], [19 + sw, 16, 25 + sw, 18.5]], SPRD[2]);
  // 머리 (봉오리) + 얼굴
  C.part(ellR(top[0], top[1] - 2, 5.4, 6), SPR, { shine: 1, lv: 0.05 });
  op > 0.1 && C.part(polyF([[top[0] - 3, top[1] - 7], [top[0], top[1] - 12 - op * 3], [top[0] + 3, top[1] - 7]]), BLOOM, { shine: 1, sep: !1 });
  !p.hurt && (C.over(top[0] + 1, top[1] - 2, 0x1a3010), C.over(top[0] + 3.4, top[1] - 2, 0x1a3010), C.over(top[0] + 1, top[1] - 3, 0xffffff));
  C.over(top[0] + 2.4, top[1] + 1, 0xd86a7a);
  return done(C, p);
}
export const pxSprout = spec(32, 34, 14, 20,
  { idle: [6, 6], move: [4, 6], wind: [3, 10, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "wind") return { open: t, recoil: -0.5 * t };
    if (nm === "atk") return { open: 1, recoil: [1, 0.6, 0.3][f] };
    if (nm === "rec") return { open: 1 - t };
    if (nm === "hurt") return { hurt: f === 0, sway: -1.5 };
    return { sway: Math.sin(ph) * 0.8, open: 0.2 };
  }, sproutFrame);

// ════ [정예] 숫양 대장 ════ (큰 몬스터 조각 도구) 회갈색 거구 양 · 크게 말린 두 뿔(마디 홈) · 목 갈기 · 대장의 붉은 목수건. 앞발을 구르다 길게 돌진, 뿔로 걷어 올린다
//   p: legs · bob · head 숙임(+)/들기(-) · rear 앞발 들기 · hurt
const RMK = 0.7;
const RM_W = mat(ramp(0xe2d8c6), { tex: "fur", amp: 0.7, dir: 0.4 }), RM_WF = mat(ramp(0xc4b8a4, { cool: 0x1c2a40 }), { tex: "fur", amp: 0.6, dir: 0.4 });
const RM_FACE = mat(ramp(0x6a5a50), { tex: "skin", amp: 0.4 }), RM_LEG = mat(ramp(0x5e504a), { tex: "skin", amp: 0.3 }), RM_LEGF = mat(ramp(0x4a3e3a, { cool: 0x1c2a40 }), { tex: "skin", amp: 0.3 });
const RM_HORN = mat(ramp(0xb89868), { tex: "wood", amp: 0.5 }), RM_HORNF = mat(ramp(0x957a52, { cool: 0x1c2a40 }), { tex: "wood", amp: 0.4 }), RM_HOOF = mat(ramp(0x3a3034), { spec: 0.4 }), RM_SCARF = mat(ramp(0xc83a30), { tex: "cloth", amp: 0.4 });
function ramFrame(p = {}) {
  const W = 106, H = 80, G = H - 1, S = sculpt(W, H, { k: p.k ?? RMK, ax: 48 });
  const b = p.bob ?? 0, hd = p.head ?? 0, rr = p.rear ?? 0, lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) };
  const R = rot([30, 54], -rr * 0.28), P = (x, y) => R([x, y + b]);
  // 다리: 털 아래 가는 다리 + 무릎 마디 + 발굽 (앞발 들면 접힘)
  const leg = (x, o, far, front) => {
    const s = P(x, 54), up = front && rr > 0, ft = up ? P(x + 9, 64) : [s[0] + o[0], G - 4 - o[1]], kn = up ? P(x + 2, 64) : lerp(s, ft, 0.5);
    S.add(U(capF(s, kn, far ? 3.4 : 4, 3), capF(kn, ft, 3, 2.4), ellR(kn[0], kn[1], 3.2, 3)), far ? RM_LEGF : RM_LEG, { z: far ? -4 : 6, h: 3 });
    S.add(polyF([[ft[0] - 2.8, ft[1]], [ft[0] + 2.8, ft[1]], [ft[0] + 3.4, ft[1] + 4], [ft[0] - 3, ft[1] + 4]]), RM_HOOF, { z: far ? -3.5 : 6.5, h: 2 });
  };
  leg(64, lg.ff, !0, !0), leg(28, lg.bf, !0, !1);
  // 꼬리 (털 뭉치)
  S.add(ellR(...P(16, 40), 5.4, 5), RM_W, { z: -1, h: 4 });
  // 몸통: 털 덩어리 (가장자리 몽실몽실)
  S.add(ellR(...P(46, 44), 30, 16), RM_W, { z: 0, h: 16 });
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * T2, q = P(46 + Math.cos(a) * 27, 44 + Math.sin(a) * 14);
    S.add(ellR(q[0], q[1], 6.2, 5.6), RM_W, { blend: 2.2, h: 3 });
  }
  for (const [x, y] of [[30, 38], [42, 34], [54, 38], [38, 48], [52, 50], [24, 46]]) S.carve(capF(P(x - 3, y), P(x + 3, y + 1), 0.6), 0.7);
  // 목 갈기 (털결 아래로) + 대장 목수건 (매듭 · 펄럭이는 끝)
  S.add(U(ellR(...P(70, 38), 11, 13), ellR(...P(66, 48), 9, 8)), mat(RM_W.ramp, { tex: "fur", amp: 0.8, dir: 1.4 }), { z: 2, h: 10 });
  S.add(capF(P(64, 46), P(80, 40), 3, 2.6), RM_SCARF, { z: 4, h: 3 });
  S.add(U(polyF([P(66, 45), P(54, 49 + Math.sin(b) * 0.5), P(56, 53)]), polyF([P(67, 47), P(58, 56), P(62, 57)])), RM_SCARF, { z: 3.6, h: 1.6 });
  S.add(ellR(...P(66, 46.5), 2.6, 2.4), RM_SCARF, { z: 4.4, h: 2.6 });
  // 머리 (숙이면 뿔이 앞으로)
  const Hr = rot(P(76, 32), hd * 0.7), Q = (x, y) => Hr(P(x, y));
  S.add(polyF([Q(79, 30), Q(70, 34), Q(77, 35)]), RM_FACE, { z: 4, h: 2 });
  S.add(U(ellR(...Q(82, 30), 7.6, 7.2), polyF([Q(84, 24.5), Q(96, 30), Q(95.5, 37), Q(84, 38)])), RM_FACE, { z: 5, h: 7 });
  S.add(capF(Q(86, 27.5), Q(94, 30.5), 1.6, 1.2), RM_FACE, { blend: 1, h: 1 });
  S.add(ellR(...Q(80, 23.6), 6.4, 4), RM_W, { lift: 2, h: 2.4 });
  S.carve(ellR(...Q(94.6, 32.4), 0.9, 0.7), 0.9, !1).carve(capF(Q(89, 36), Q(95, 35.4), 0.5), 0.8, !1);
  if (!p.block && !p.hurt) { const e0 = Q(85, 28.4); S.decal(e0[0], e0[1], 0xe8c040).decal(e0[0] + 1, e0[1], 0x1a1008).decal(e0[0] - 1, e0[1], 0x1a1008); }
  // 큰 뿔 (나선 · 마디 홈) — 먼 뿔은 살짝 뒤
  const horn = (dx, dy, far) => {
    let q = Q(80 + dx, 22 + dy);
    const pts = [q], rs = [4.6];
    for (let k = 1; k <= 10; k++) { q = pol(q, -1.45 - k * 0.6, 4.6 - k * 0.24); pts.push(q), rs.push(4.6 - k * 0.34); }
    const M0 = far ? RM_HORNF : RM_HORN;
    for (let k = 1; k < pts.length; k++) S.add(capF(pts[k - 1], pts[k], rs[k - 1], rs[k]), M0, { z: (far ? 1 : 8) + k * 0.05, h: rs[k] * 0.8 });
    if (!far) for (let k = 1; k < pts.length - 1; k++) { const a = Math.atan2(pts[k + 1][1] - pts[k - 1][1], pts[k + 1][0] - pts[k - 1][0]); S.carve(capF(pol(pts[k], a + 1.57, rs[k] * 0.9), pol(pts[k], a - 1.57, rs[k] * 0.9), 0.4), 0.6); }
  };
  horn(4, -1.4, 1);
  horn(0, 0, 0);
  leg(60, lg.fn, !1, !0), leg(24, lg.bn, !1, !1);
  const C = S.render({ debug: p.debug, rim: !p.block });
  return p.hurt ? flash(C) : C;
}
export const pxRam = {
  fw: Math.round(106 * RMK), fh: Math.round(80 * RMK), w: 34, h: 32,
  anims: { idle: [4, 5], move: [6, 10], wind: [6, 12, !1], atk: [6, 18], rec: [3, 10, !1], hurt: [2, 10, !1], toss: [3, 12, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = {};
    if (nm === "idle") P = { bob: Math.sin(ph) * 0.4 };
    if (nm === "move") { const g = gait4(f, n, 5, 3); P = { legs: g, bob: g.bob }; }
    if (nm === "wind") P = { rear: f % 2 ? 1 : 0.4, head: 0.4 };
    if (nm === "atk") { const g = gait4(f, n, 7, 3.5); P = { legs: g, head: 1, bob: g.bob + 1 }; }
    if (nm === "toss") P = { head: [1, -0.6, -0.4][f], rear: f === 1 ? 0.6 : 0 };
    if (nm === "rec") P = { head: 1 - t };
    if (nm === "hurt") P = { hurt: f === 0, head: -0.4 };
    return ramFrame(P);
  },
};

// ════ 참새 떼 ════ 통통한 참새 넷이 우르르. 번갈아 쪼고 흩어진다
//   p: flap · spread · ph · peck · hurt
const SPAR = ramp(0x8a6a4a), SPARB = ramp(0xe8dcc0);
function sparrowFrame(p = {}) {
  const W = 46, H = 34, C = board(W, H);
  const fl = p.flap ?? 0, sp = p.spread ?? 0.6, ph = p.ph ?? 0, pk = p.peck ?? 0;
  const bird = (x, y, s, fo) => {
    const w = fo > 0 ? -1.9 - fl * 0.8 : -1.9 + fl * 0.8;
    C.part(capF([x - 1, y - 1], pol([x - 1, y - 1], w, 6 * s), 1.6 * s, 0.6), rampF(0x8a6a4a), { sep: !1 });
    C.part(ellR(x, y, 4 * s, 3 * s), SPAR, { shine: 1 });
    C.part(ellR(x + 1, y + 1, 2.4 * s, 1.6 * s), SPARB, { sep: !1 });
    C.part(ellR(x + 3 * s, y - 2 * s, 2.4 * s, 2.2 * s), SPAR, { shine: 1 });
    C.part(polyF([[x + 5 * s, y - 2 * s], [x + 7 * s + pk * 2, y - 1.4 * s], [x + 5 * s, y - 1 * s]]), ramp(0xe0a030), { sep: !1 });
    !p.hurt && C.over(x + 3.6 * s, y - 2.6 * s, 0x101010);
    C.part(capF([x - 3 * s, y], [x - 6 * s, y - 1], 1, 0.5), SPAR, { sep: !1 });
  };
  for (let k = 0; k < 4; k++) { const a = ph + k * 1.6; bird(23 + Math.cos(a) * (6 + sp * 8), 17 + Math.sin(a * 1.4) * (4 + sp * 5), k === 0 ? 1.15 : 0.9, Math.sin(a * 2 + fl)); }
  return done(C, p);
}
export const pxSparrows = spec(46, 34, 22, 16,
  { idle: [4, 16], move: [4, 18], wind: [3, 12, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 12, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2, fl = [1, 0.3, -1, 0.3][f % 4];
    if (nm === "wind") return { flap: fl, spread: 0.6 - t * 0.5, ph };
    if (nm === "atk") return { flap: fl, spread: 0.1, peck: 1, ph };
    if (nm === "rec") return { flap: fl, spread: t, ph };
    if (nm === "hurt") return { hurt: f === 0, flap: 0.5, spread: 1.2, ph };
    return { flap: fl, spread: 0.7, ph: ph * 0.5 };
  }, sparrowFrame, { flying: !0 });

// ════ 꽃 해파리 ════ 꽃잎 갓이 펄럭이는 하늘 해파리. 촉수 끝 꽃가루 침을 흩뿌린다 (맞으면 중독)
//   p: pulse 갓 오므림(0~1) · glow · hurt
const PET = ramp(0xf0a0c8, { cool: 0x8a5a9a }), PETD = ramp(0xd078a8, { cool: 0x6a4a8a }), JEL = ramp(0xd8f0ff);
function jellyFrame(p = {}) {
  const W = 38, H = 44, C = board(W, H);
  const pu = p.pulse ?? 0;
  // 촉수 (물결)
  for (let k = 0; k < 5; k++) { const x0 = 11 + k * 4, pts = []; for (let j = 0; j <= 5; j++) pts.push([x0 + Math.sin(j * 0.9 + k + pu * 3) * 1.6, 22 + j * 3.6 - pu * 2]); C.part(U(...pts.slice(1).map((q, j) => capF(pts[j], q, 0.9, 0.7))), JEL, { sep: !1 }); C.over(...pts[5], 0xfff080); }
  // 갓: 꽃잎 여섯
  for (let k = 0; k < 6; k++) { const a = Math.PI + (k / 5) * Math.PI, r = 10 - pu * 2; C.part(ellR(19 + Math.cos(a) * r, 18 + Math.sin(a) * (6 - pu), 4.6, 3.4, a), k % 2 ? PETD : PET, { shine: 1 }); }
  C.part(ellR(19, 17 - pu, 9 - pu * 2, 7), PET, { shine: 1 });
  C.part(ellR(19, 15 - pu, 3, 2.6), ramp(0xfff080), { sep: !1, shine: 1 });
  !p.hurt && (C.over(16, 19, 0x4a1a3a), C.over(22, 19, 0x4a1a3a));
  return done(C, p);
}
export const pxJelly = spec(38, 44, 16, 24,
  { idle: [6, 8], move: [6, 10], wind: [3, 10, !1], atk: [3, 14, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "wind") return { pulse: t };
    if (nm === "atk") return { pulse: [1, 0.2, 0][f] };
    if (nm === "rec") return { pulse: 0.3 * Math.sin(t * 6) };
    if (nm === "hurt") return { hurt: f === 0, pulse: 0.8 };
    return { pulse: (Math.sin(ph) + 1) * 0.35 };
  }, jellyFrame, { flying: !0 });

// ════ 민들레 기사 ════ 꽃받침 투구를 쓴 작은 풀 요정 기사. 민들레 창을 겨누고 찌르고, 홀씨를 타고 날아올랐다 내려찍는다
//   p: bob · legs · lance 창(0 세움 ~ 1 겨눔 ~ 1.3 찌름) · float 홀씨 날기 · hurt
const KNT = ramp(0x6ab848), KNTF = rampF(0x5aa03e), PUFFW = ramp(0xf8f8f0), YEL = ramp(0xf8d040);
function knightFrame(p = {}) {
  const W = 44, H = 44, G = H - 1, C = board(W, H);
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, la = p.lance ?? 0, fl = p.float ?? 0;
  // 홀씨 낙하산 (날 때)
  fl > 0 && (C.part(capF([18, 14 + b], [18, 2 + b], 0.6), PUFFW, { sep: !1 }), puff(C, 18, 0 + b + 2, 9 * fl, 4 * fl, PUFFW, 7, 0.4));
  // 다리
  for (const [o, far] of [[g.f, 1], [g.n, 0]]) C.part(capF([18 + (far ? -1.5 : 1.5), 32 + b], [18 + (far ? -1.5 : 1.5) + o[0], G - o[1]], 1.6, 1.3), far ? KNTF : KNT, { sep: !1, shine: !far });
  // 몸 (잎 갑옷)
  C.part(ellR(18, 27 + b, 5.6, 6.4), KNT, { shine: 1 });
  C.part(polyF([[13, 24 + b], [23, 24 + b], [22, 33 + b], [18, 35 + b], [14, 33 + b]]), ramp(0x9ad868), { shine: 1, sep: !1 });
  // 머리 + 꽃받침 투구
  C.part(ellR(20, 17 + b, 4.6, 4.4), ramp(0xf0d8b0), { shine: 1 });
  C.part(polyF([[14, 16 + b], [16, 10 + b], [19, 13 + b], [21, 9 + b], [23, 13 + b], [26, 11 + b], [25, 16 + b]]), YEL, { shine: 1 });
  !p.hurt && (C.over(22, 17 + b, 0x1a3010), C.over(22.5, 16.4 + b, 0xffffff));
  // 민들레 창 (앞 팔)
  const s = [21, 25 + b], a = la > 1 ? 0 : -1.5 + la * 1.5, hand = pol(s, a + 0.8, 5), tip = pol(hand, a, 20 + (la > 1 ? 4 : 0)), butt = pol(hand, a + Math.PI, 6);
  C.part(capF(s, hand, 1.5, 1.2), KNT, { sep: !1 });
  C.part(capF(butt, tip, 0.8, 0.8), GRASSD, { shine: 1 });
  puff(C, tip[0], tip[1], 3.4, 3.4, YEL, 6, 0.1);
  return done(C, p);
}
export const pxKnight = spec(44, 44, 12, 22,
  { idle: [4, 6], move: [8, 14], wind: [3, 10, !1], atk: [3, 18, !1], rec: [3, 10, !1], hurt: [2, 10, !1], float: [4, 8] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "idle") return { bob: Math.sin(ph) * 0.4, lance: 0.1 };
    if (nm === "move") { const g = gait2(f, n, 3, 2); return { legs: g, bob: g.bob, lance: 0.5 }; }
    if (nm === "wind") return { lance: 0.5 + 0.5 * t, bob: t };
    if (nm === "atk") return { lance: [1.2, 1.3, 1.3][f], legs: { n: [4, 0], f: [-3, 0] } };
    if (nm === "float") return { float: 1, lance: 1, bob: Math.sin(ph) * 1 };
    if (nm === "rec") return { lance: 1.2 - t };
    return { hurt: f === 0, lance: 0.3 };
  }, knightFrame);

// ════ [정예] 거대 무당벌레 ════ (큰 몬스터 조각 도구) 반들반들 빨간 딱지에 까만 점 일곱 · 흰 무늬 앞가슴 · 곤봉 더듬이. 딱지를 펴고 날아올라 박치기, 움츠려 막고 굴러 돌진
//   p: legs 다리 위상 · wings 딱지 펴기(0~1) · flap 속날개 · guard 움츠림 · bob · hurt
const LBG = 0.7;
const LB_R = mat(ramp(0xdc3a2a), { spec: 0.9 }), LB_RD = mat(ramp(0x9a2a22), { spec: 0.5 }), LB_K = mat(ramp(0x2a2630), { spec: 0.6 }), LB_KF = mat(ramp(0x1c1a22, { cool: 0x1c2a40 }), { spec: 0.3 });
const LB_WH = mat(ramp(0xf0ece0), { spec: 0.4 }), LB_MEM = mat(ramp(0xc8d6e4), { tex: "skin", amp: 0.15, spec: 0.5 });
function ladybugFrame(p = {}) {
  const W = 92, H = 66, G = H - 1, S = sculpt(W, H, { k: p.k ?? LBG, ax: 46 });
  const gd = p.guard ?? 0, b = (p.bob ?? 0) + gd * 4, wg = p.wings ?? 0, lp = p.legs ?? 0, fl = p.flap ?? 0;
  // 다리 여섯 (마디 셋 · 갈고리 발끝) — 움츠리면 숨김
  const leg = (k, far) => {
    const s = [32 + k * 12 + (far ? 3 : 0), 50 + b], sw = Math.sin(lp + k * 2.1 + far * 3) * 3.4;
    const kn = [s[0] + (k - 1) * 3 + sw * 0.5, 55 + b], ft = [s[0] + (k - 1) * 6 + sw, G - 1 - Math.max(0, Math.cos(lp + k * 2.1 + far * 3)) * 1.6];
    S.add(U(capF(s, kn, 1.8, 1.5), capF(kn, ft, 1.5, 1)), far ? LB_KF : LB_K, { z: far ? -4 : 8, h: 1.4 });
    S.add(capF(ft, [ft[0] + 2, ft[1] + 0.4], 0.8, 0.4), far ? LB_KF : LB_K, { z: far ? -3.8 : 8.2, h: 0.6 });
  };
  if (gd < 0.6) for (let k = 0; k < 3; k++) leg(k, 1);
  // 속날개 (투명한 막 · 맥) — 딱지 아래에서 뒤로 펼침
  if (wg > 0.05) for (const [da, M0] of [[-0.25, LB_MEM], [0.15, LB_MEM]]) {
    const h0 = [58, 32 + b], a = Math.PI + 0.35 + da - fl * 0.5, tip = pol(h0, a, 44 * wg), mid = pol(h0, a + 0.12, 26 * wg);
    S.add(polyF([h0, pol(mid, a - 1.5, 6), pol(tip, a - 1.2, 3), tip, pol(tip, a + 1.6, 4), pol(mid, a + 1.6, 3)]), M0, { z: da < 0 ? -2 : 9, h: 0.8, prof: "flat" });
    S.carve(capF(h0, tip, 0.35), 0.4).carve(capF(mid, pol(mid, a - 1.1, 5), 0.3), 0.4);
  }
  // 몸 아래 (검정) + 딱지 (펴면 뒤끝이 들림) + 점 일곱 + 가운데 이음선
  S.add(ellR(46, 48 + b, 24, 6), LB_K, { z: 0, h: 5 });
  const Lf = rot([62, 30 + b], -wg * 0.55), D = (x, y) => Lf([x, y + b]);
  const dome = (x, y) => ((x - 42) / 27) ** 2 + ((y - 40 - b) / 19) ** 2 <= 1 && y < 49 + b;
  const shell = (x, y) => { const q = rot([62, 30 + b], wg * 0.55)([x, y]); return dome(q[0], q[1]); };
  S.add(shell, LB_R, { z: 2, h: 16, prof: "round" });
  S.add((x, y) => shell(x, y) && !dome(x, y + 2.2) && dome(x, y), LB_RD, { on: 1, h: 0.3 });
  for (const [x, y, r] of [[28, 31, 3.6], [44, 27, 3.8], [53, 37, 3.4], [37, 42, 3.6], [21, 41, 3], [58, 28, 2.8], [46, 45, 2.6]]) S.add(ellR(...D(x, y), r, r * 0.92), LB_K, { on: 1, h: 0.5 });
  S.carve(capF(D(62, 24), D(60, 46), 0.45), 0.6);
  // 앞가슴 (검정 + 흰 무늬) · 머리 (흰 볼 · 곤봉 더듬이)
  const hx = 70 - gd * 6, hy = 42 + b;
  S.add(ellR(64, 38 + b, 8.6, 10.6), LB_K, { z: 5, h: 9 });
  S.add(U(ellR(66, 33 + b, 3.4, 3), ellR(68, 43 + b, 2.6, 3.2)), LB_WH, { on: 1, h: 0.5 });
  S.add(ellR(hx + 4, hy + 2, 6.4, 5.8), LB_K, { z: 6, h: 6 });
  S.add(U(ellR(hx + 2, hy - 0.6, 1.9, 1.6), ellR(hx + 7.4, hy + 0.4, 1.6, 1.4)), LB_WH, { on: 1, h: 0.4 });
  if (gd < 0.6) for (const [dx, ex, ey] of [[0, 84, 30], [2, 88, 33]]) { const a0 = [hx + 5 + dx, hy - 3]; S.add(capF(a0, [ex - gd, ey + b], 0.7, 0.6), dx ? LB_KF : LB_K, { z: dx ? 5 : 7, h: 0.6 }); S.add(ellR(ex - gd, ey + b, 1.6, 1.3), dx ? LB_KF : LB_K, { z: dx ? 5 : 7, h: 1.2 }); }
  if (!p.block && !p.hurt) S.decal(hx + 8, hy + 2.4, 0xffffff).decal(hx + 8.6, hy + 1.6, 0xffe060);
  if (gd < 0.6) for (let k = 0; k < 3; k++) leg(k, 0);
  const C = S.render({ debug: p.debug, rim: !p.block });
  return p.hurt ? flash(C) : C;
}
export const pxLadybug = {
  fw: Math.round(92 * LBG), fh: Math.round(66 * LBG), w: 34, h: 24,
  anims: { idle: [4, 6], move: [6, 12], wind: [3, 10, !1], atk: [4, 18], rec: [3, 10, !1], hurt: [2, 10, !1], guard: [2, 4], fly: [4, 20] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = {};
    if (nm === "idle") P = { bob: Math.sin(ph) * 0.3, legs: Math.sin(ph) * 0.2 };
    if (nm === "move") P = { legs: ph * 2 };
    if (nm === "wind") P = { wings: t * 0.6, bob: t };
    if (nm === "atk" || nm === "fly") P = { wings: 1, flap: Math.sin(ph * 2), legs: 0.4, bob: -2 };
    if (nm === "guard") P = { guard: 1, bob: f * 0.4 };
    if (nm === "rec") P = { wings: 0.6 * (1 - t) };
    if (nm === "hurt") P = { hurt: f === 0, bob: 1, wings: 0.15 };
    return ladybugFrame(P);
  },
};

// ════ 하늘 매 ════ 갈색 등 · 하얀 가슴 · 노란 부리와 발톱. 높이 맴돌다 날카롭게 내리꽂힌다
//   p: flap · tuck 접고 내리꽂기 · talon · tilt · hurt
const HAWK = ramp(0x8a5a32), HAWKF = rampF(0x7a4e2c), HAWKB = ramp(0xf0e4cc);
function hawkFrame(p = {}) {
  const W = 52, H = 38, C = board(W, H);
  const fl = p.flap ?? 0, tk = p.tuck ?? 0, R = rot([26, 18], p.tilt ?? 0), P = (x, y) => R([x, y]);
  const wing = (far) => { const root = P(24, 15), a = -2.1 - fl * 0.8 * (1 - tk) + tk * 1.1 + (far ? -0.3 : 0), len = 22 - tk * 8, tip = pol(root, a, len), m = pol(root, a + 0.55, len * 0.75); C.part(polyF([root, tip, pol(tip, a + 1.6, 4), m, P(28, 19)]), far ? HAWKF : HAWK, { shine: !far }); for (let k = 0; k < 3; k++) C.part(capF(lerp(root, tip, 0.6 + k * 0.13), pol(lerp(root, tip, 0.6 + k * 0.13), a + 1.5, 5), 1.1, 0.4), far ? HAWKF : HAWK, { sep: !1 }); };
  wing(!0);
  C.part(polyF([P(14, 17), P(5, 14), P(5, 21)]), HAWK, { shine: 1 }); // 꼬리
  C.part(ellR(...P(22, 18), 10, 5), HAWK, { shine: 1 });
  C.part(ellR(...P(25, 20), 6, 3), HAWKB, { sep: !1 });
  C.part(ellR(...P(33, 14), 4.6, 4.2), HAWK, { shine: 1 });
  C.part(ellR(...P(34, 15.5), 3, 2.4), HAWKB, { sep: !1 });
  C.part(polyF([P(37, 13), P(41, 15), P(37, 17)]), YEL, { shine: 1 });
  !p.hurt && (C.over(...P(35, 13), 0x101010), C.over(...P(35.6, 12.4), 0xffd060));
  const tl = p.talon ?? 0;
  C.part(capF(P(24, 22), P(26 + tl * 6, 25 + tl * 3), 1, 0.8), YEL, { sep: !1 });
  wing(!1);
  return done(C, p);
}
export const pxHawk = spec(52, 38, 22, 14,
  { idle: [4, 12], move: [4, 14], wind: [3, 10, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const fl = [1, 0.3, -1, 0.3][f % 4];
    if (nm === "wind") return { flap: fl, tuck: 0.4 * t, tilt: -0.2 * t };
    if (nm === "atk") return { tuck: 1, talon: 1, tilt: 0.6 };
    if (nm === "rec") return { flap: fl, tuck: 1 - t, tilt: 0.3 * (1 - t) };
    if (nm === "hurt") return { hurt: f === 0, flap: 0.5, tilt: -0.3 };
    return { flap: fl };
  }, hawkFrame, { flying: !0 });

// ════ 비구름 정령 ════ 회색 비구름에 졸린 얼굴. 머리 위로 따라와 비를 뿌리고(젖으면 느려짐), 가끔 작은 번개
//   p: rain 빗줄기 · puffy 부풂 · spark 번개 · hurt
const CLOUD = ramp(0xb8c0d0, { cool: 0x3a4a7a, hi: 0.15 });
function rainFrame(p = {}) {
  const W = 46, H = 40, C = board(W, H);
  const rn = p.rain ?? 0, pf = p.puffy ?? 0;
  if (rn > 0) for (let k = 0; k < 7; k++) { const x = 10 + k * 4.4, y = 24 + ((k * 7) % 5) + rn * 4; strokes(C, [[x, y, x - 1, y + 5]], 0x8ac8f0); }
  puff(C, 23, 16, 17 + pf * 2, 9 + pf, CLOUD, 9, 0.5);
  if ((p.spark ?? 0) > 0) strokes(C, [[24, 24, 21, 30], [21, 30, 25, 31], [25, 31, 22, 38]], 0xfff070);
  !p.hurt && (strokes(C, [[17, 16, 20, 16], [26, 16, 29, 16]], 0x2a3048), C.over(23, 20, 0x2a3048));
  return done(C, p);
}
export const pxRainCloud = spec(46, 40, 24, 16,
  { idle: [4, 6], move: [4, 8], wind: [3, 10, !1], atk: [4, 12], rec: [3, 10, !1], hurt: [2, 10, !1], zap: [3, 14, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "wind") return { puffy: t };
    if (nm === "atk") return { rain: f % 2 ? 1 : 0.5, puffy: 0.6 };
    if (nm === "zap") return { spark: f === 1 ? 1 : 0, puffy: 1 };
    if (nm === "rec") return { puffy: 1 - t };
    if (nm === "hurt") return { hurt: f === 0, puffy: -0.5 };
    return { puffy: Math.sin(ph) * 0.3 };
  }, rainFrame, { flying: !0 });

// ════ 바람개비 요정 ════ 바람개비를 든 작은 요정. 날개는 투명, 바람개비를 힘껏 돌려 돌풍을 일으킨다
//   p: spin 바람개비 각 · flap · blow 볼 부풀림 · hurt
const FAE = ramp(0xf0d8c0), FAEH = ramp(0x8ad0f0);
function pinwheelFrame(p = {}) {
  const W = 40, H = 40, C = board(W, H);
  const sp = p.spin ?? 0, fl = p.flap ?? 0, bl = p.blow ?? 0;
  glass(C, ellR(12, 14 - fl * 2, 8, 4, -0.6 - fl * 0.3), 0.1, !1, 0xe8f8ff);
  glass(C, ellR(13, 20 + fl, 6, 3, 0.4), 0.15, !1, 0xe8f8ff);
  C.part(polyF([[14, 22], [22, 22], [24, 32], [12, 32]]), FAEH, { shine: 1 }); // 옷
  C.part(ellR(18, 16, 5, 4.6), FAE, { shine: 1 });
  C.part(ellR(17, 12, 5, 3), FAEH, { shine: 1, sep: !1 }); // 머리카락
  !p.hurt && (C.over(20, 16, 0x1a2a40), C.over(20.6, 15.4, 0xffffff));
  bl > 0 && C.part(ellR(22, 18, 1.6 + bl, 1.4 + bl * 0.6), ramp(0xf0b0a0), { sep: !1 });
  // 바람개비 (막대 + 날개 넷)
  const hub = [30, 12];
  C.part(capF([22, 22], [hub[0], hub[1] + 2], 0.8, 0.8), ramp(0x8a6a4a), { sep: !1 });
  const cols = [0xf05a5a, 0xf0c040, 0x5ab0f0, 0x6ad06a];
  for (let k = 0; k < 4; k++) { const a = sp + (k * Math.PI) / 2, t1 = pol(hub, a, 7), t2 = pol(hub, a + 0.7, 4.5); C.part(polyF([hub, t1, t2]), ramp(cols[k]), { shine: 1, sep: !1 }); }
  C.part(ellR(hub[0], hub[1], 1.2, 1.2), ramp(0xf0f0e0), { sep: !1 });
  return done(C, p);
}
export const pxPinwheel = spec(40, 40, 14, 18,
  { idle: [4, 12], move: [4, 14], wind: [4, 14, !1], atk: [4, 20], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2, fl = [1, 0.3, -1, 0.3][f % 4];
    if (nm === "wind") return { spin: ph * 2, flap: fl, blow: t };
    if (nm === "atk") return { spin: ph * 3, flap: fl, blow: 1 };
    if (nm === "rec") return { spin: ph, flap: fl, blow: 1 - t };
    if (nm === "hurt") return { hurt: f === 0, flap: 0.5 };
    return { spin: ph * 0.5, flap: fl };
  }, pinwheelFrame, { flying: !0 });

// ════ [정예] 구름 고래 새끼 ════ (큰 몬스터 조각 도구) 하늘을 헤엄치는 아기 고래. 하늘색 등과 흰 주근깨 · 구름처럼 하얀 배와 주름 · 등에 실린 작은 구름. 숨구멍 물줄기 · 꼬리 내리치기
//   p: swim 꼬리 위상 · spout 물줄기 · tail 꼬리 내리침 · tilt · mouth · hurt
const WHK = 0.7;
const WH_B = mat(ramp(0x6aa8e0), { tex: "skin", amp: 0.25, spec: 0.45 }), WH_BF = mat(ramp(0x5a92c8, { cool: 0x1c2a40 }), { tex: "skin", amp: 0.2 });
const WH_W = mat(ramp(0xf0f4fa, { cool: 0x5a6a9a }), { tex: "skin", amp: 0.15 }), WH_CL = mat(ramp(0xffffff, { cool: 0x8a9ac8 }), { tex: "fur", amp: 0.3 });
const WH_SP = mat(rampGlow(0x90d8f8)), WH_MOUTH = mat(ramp(0xc85a6e)), WH_BLUSH = mat(ramp(0xf4a8b8)), WH_EYE = mat(ramp(0x1a2a40), { spec: 0.8 });
function whaleFrame(p = {}) {
  const W = 136, H = 86, S = sculpt(W, H, { k: p.k ?? WHK, ax: 66 });
  const sw = p.swim ?? 0, R = rot([66, 52], p.tilt ?? 0), P = (x, y) => R([x, y]), tl = p.tail ?? 0, mo = p.mouth ?? 0;
  // 먼 가슴지느러미
  S.add(ellR(...P(84, 64), 8, 3.2, 0.5 + Math.sin(sw) * 0.2), WH_BF, { z: -3, h: 2.4 });
  // 꼬리자루 + 꼬리지느러미 (V자 두 잎)
  const ta = Math.sin(sw) * 0.3 + tl * 0.8, t0 = P(38, 54), t1 = pol(t0, Math.PI - ta, 18);
  S.add(capF(t0, t1, 10, 4.6), WH_B, { z: -1, h: 6 });
  for (const s of [-1, 1]) S.add(ellR(...pol(t1, Math.PI - ta + s * 0.85, 6.6), 9.6, 3.6, Math.PI - ta + s * 0.85), WH_B, { z: s > 0 ? -2 : 0.5, h: 3 });
  // 몸 (둥근 방추, 머리가 크다) + 하얀 배 + 배 주름
  S.add(U(ellR(...P(72, 50), 38, 21), ellR(...P(98, 46), 20, 20)), WH_B, { z: 0, h: 20 });
  S.add(U(ellR(...P(80, 61), 32, 10), ellR(...P(104, 55), 13, 8)), WH_W, { on: 1, h: 1.2 });
  for (let k = 0; k < 3; k++) S.carve(capF(P(70 + k * 2, 59 + k * 3), P(110 - k * 4, 54 + k * 3.6), 0.45), 0.7);
  // 숨구멍 · 흰 주근깨 · 등 구름
  S.carve(ellR(...P(82, 28), 2, 0.9), 1);
  if (!p.block) for (const [x, y] of [[90, 32], [94, 30], [98, 33], [86, 35], [102, 36]]) S.decal(...P(x, y), 0xe4f2ff);
  S.add(U(ellR(...P(56, 30), 8, 4.6), ellR(...P(64, 27), 7, 5.4), ellR(...P(71, 30), 6, 4), ellR(...P(48, 32), 5, 3.4)), WH_CL, { lift: 2, h: 4 });
  // 눈 (큰 검은 눈 + 반짝) · 볼 홍조 · 웃는 입
  S.add(ellR(...P(102, 44), 2.4, 2.9), WH_EYE, { on: 1, h: 0.6 });
  if (!p.block && !p.hurt) { const e0 = P(102, 43); S.decal(e0[0] + 0.6, e0[1] - 0.4, 0xffffff).decal(e0[0] - 0.6, e0[1] + 1.4, 0x6a8ab0); }
  S.add(ellR(...P(104, 50), 3.2, 1.7), WH_BLUSH, { on: 1, h: 0.4 });
  if (mo > 0.3) S.add(polyF([P(96, 53), P(117, 49), P(115, 51 + mo * 4), P(100, 56 + mo * 2)]), WH_MOUTH, { on: 1, h: 0.4 });
  else S.carve(U(capF(P(96, 53), P(108, 53.5), 0.5), capF(P(108, 53.5), P(116, 49.6), 0.5)), 0.9, !1);
  // 가까운 가슴지느러미
  S.add(ellR(...P(86, 64), 9.4, 3.6, 0.7 + Math.sin(sw) * 0.25), WH_B, { z: 8, h: 2.6 });
  // 숨구멍 물줄기 (방울이 위로 솟아 퍼진다)
  const sp = p.spout ?? 0;
  if (sp > 0) {
    const s0 = P(82, 26);
    for (let k = 0; k < 7; k++) { const y = s0[1] - k * 3.4 * sp, dx = (k % 2 ? 1.6 : -1.6) * (1 + k * 0.15); S.add(ellR(s0[0] + dx, y, 2.6 - k * 0.12, 2.2), WH_SP, { z: 20, h: 1.6 }); }
    sp > 0.7 && [-6, -3, 3, 6].forEach((dx, k) => S.add(ellR(s0[0] + dx, s0[1] - 22 * sp + Math.abs(dx) * 0.6, 1.6, 1.4), WH_SP, { z: 20, h: 1 }));
  }
  const C = S.render({ debug: p.debug, rim: !p.block });
  return p.hurt ? flash(C) : C;
}
export const pxWhale = {
  fw: Math.round(136 * WHK), fh: Math.round(86 * WHK), w: 46, h: 28, flying: !0,
  anims: { idle: [6, 8], move: [6, 10], wind: [4, 10, !1], atk: [3, 14], rec: [3, 10, !1], hurt: [2, 10, !1], spout: [4, 10, !1], tail: [4, 14, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { swim: ph };
    if (nm === "wind") P = { swim: ph, tilt: -0.15 * t, mouth: t * 0.6 };
    if (nm === "atk") P = { swim: ph * 2, tilt: 0.25, mouth: 1 };
    if (nm === "spout") P = { swim: ph, spout: [0.4, 1, 1, 0.6][f], tilt: -0.1 };
    if (nm === "tail") P = { tail: [0, 1, 1.4, 0.5][f], tilt: 0.1 };
    if (nm === "rec") P = { swim: ph, tilt: 0.2 * (1 - t) };
    if (nm === "hurt") P = { hurt: f === 0, tilt: -0.2, mouth: 0.6 };
    return whaleFrame(P);
  },
};
