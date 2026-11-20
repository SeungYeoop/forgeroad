// 그래스메어 몬스터 추가 4종 (2D 픽셀 손그림, 오른쪽을 본다): 하늘 염소 · [정예] 말벌 여왕 · 고블린 주술사 · 굴파기 두더지
import { board, ellR, capF, polyF, U, minus, pol, lerp, ik, ramp, rampF, rampGlow, mixc, dots, strokes, rot, eye, glass, limb, gait4, gait2, flapOf, spec, done, flash, T2, L } from "./kit.js";
import { sculpt, mat } from "./px3.js";

// ════ 하늘 염소 ════ 하늘섬 턱을 뛰어다니는 산양. 크림색 북슬 털 · 말린 뿔 · 턱수염 · 가로 눈동자
//   p: bob · head(0~1 고개 숙임) · legs · jaw · blink · tail · hurt
const GF = ramp(0xd6ccb4), GFF = rampF(0xc0b49a), HORN = ramp(0x8a7456), HOOF = ramp(0x3a3438), GSK = ramp(0x9a8a7a);
function goatFrame(p = {}) {
  const W = 58, H = 44, G = H - 1, C = board(W, H);
  const b = p.bob ?? 0, hd = p.head ?? 0, lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) };
  const leg = (hip, o, far, front) => {
    const ft = [hip[0] + o[0] + (front ? 1 : -1), G - 3 - o[1]];
    limb(C, hip, ft, 7.5, 7.5, front ? -1 : 1, far ? 2.6 : 3, 1.8, far ? GFF : GF, { shine: !far });
    C.part(polyF([[ft[0] - 1.8, ft[1]], [ft[0] + 1.8, ft[1]], [ft[0] + 2.2, ft[1] + 3], [ft[0] - 2, ft[1] + 3]]), HOOF, { shine: !far });
  };
  leg([38, 27 + b], lg.ff, !0, !0);
  leg([20, 27 + b], lg.bf, !0, !1);
  // 꼬리 (짧게 들림)
  C.part(capF([13, 20 + b], [10, 16 + b - (p.tail ?? 0) * 2], 2, 1.2), GF, { shine: 1 });
  // 몸통: 북슬북슬 (가장자리 털 뭉치)
  const body = U(ellR(28, 23 + b, 14, 8.6), ellR(18, 23 + b, 6.5, 7.5), ellR(37, 22 + b, 7.5, 7.5));
  C.part(body, GF, { shine: 1 });
  for (let k = 0; k < 9; k++) C.part(ellR(16 + k * 3, 30.5 + b + (k % 2) * 0.8, 2, 1.6), GF, { sep: !1 });
  strokes(C, [[20, 19 + b, 22, 22 + b], [26, 18 + b, 28, 21 + b], [32, 18 + b, 34, 21 + b], [23, 25 + b, 25, 28 + b], [30, 25 + b, 32, 28 + b]], GF[3]);
  // 머리 (숙이면 앞으로 돌림)
  const Hr = rot([42, 18 + b], hd * 0.8), Q = (x, y) => Hr([x, y + b]);
  C.part(capF(Q(38, 20), Q(44, 14), 4.6, 3.6), GF, { shine: 1 }); // 목
  // 먼 뿔
  C.part(U(capF(Q(44, 9), Q(40, 4), 2, 1.6), capF(Q(40, 4), Q(36, 7), 1.6, 1)), rampF(0x8a7456));
  C.part(U(ellR(...Q(46.5, 13), 4.6, 4), capF(Q(47, 14), Q(53, 17), 3, 2.1)), GF, { shine: 1, lv: 0.06 });
  C.part(ellR(...Q(53.2, 17.5), 1.6, 1.4), GSK, { sep: !1 });
  // 턱수염
  C.part(polyF([Q(49, 18), Q(52, 18.5), Q(50.5, 23 + (p.jaw ?? 0) * 0.6), Q(49.5, 22)]), GF, { sep: !1, lv: -0.05 });
  strokes(C, [[...Q(50, 19), ...Q(50.5, 22)]], GF[2]);
  (p.jaw ?? 0) > 0.4 && strokes(C, [[...Q(51, 18.4), ...Q(53.5, 18.6)]], 0x2a1414);
  // 눈: 노란 홍채 + 가로 눈동자
  if (p.blink || p.hurt) strokes(C, [[...Q(46.5, 12.4), ...Q(48.5, 12.4)]], GF[1]);
  else { const e0 = Q(47.2, 12.2); C.over(e0[0] - 0.6, e0[1], 0xe8c040).over(e0[0] + 0.6, e0[1], 0xe8c040).over(e0[0], e0[1], 0x140c08).over(e0[0] + 1.4, e0[1], 0x140c08); }
  // 귀 (옆으로)
  C.part(capF(Q(44, 11.5), Q(39.5, 12.5), 1.5, 0.8), GF, { shine: 1 });
  // 가까운 뿔: 뒤로 크게 말림 (마디 줄)
  const h0 = Q(45.5, 9), h1 = Q(42, 3), h2 = Q(36.5, 4), h3 = Q(35.5, 9), h4 = Q(38.5, 11);
  C.part(U(capF(h0, h1, 2.4, 2.1), capF(h1, h2, 2.1, 1.8), capF(h2, h3, 1.8, 1.3), capF(h3, h4, 1.3, 0.8)), HORN, { shine: 1 });
  for (const t of [0.25, 0.5, 0.75]) { const q = lerp(h0, h1, t); C.over(q[0], q[1], HORN[2]); }
  { const q = lerp(h1, h2, 0.5); C.over(q[0], q[1], HORN[2]); }
  leg([35, 28 + b], lg.fn, !1, !0);
  leg([18, 28 + b], lg.bn, !1, !1);
  return done(C, p);
}
export const pxGoat = spec(58, 44, 24, 22,
  { idle: [6, 7], move: [8, 15], wind: [4, 10, !1], atk: [6, 18], rec: [3, 10, !1], hurt: [2, 10, !1], leap: [4, 10, !1], chew: [4, 6] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "idle") return { bob: Math.sin(ph) * 0.4, tail: Math.sin(ph * 2) * 0.5, blink: f === 4 };
    if (nm === "chew") return { bob: 0.3, head: 0.25, jaw: f % 2, tail: 0.3 };
    if (nm === "move") { const g = gait4(f, n, 5, 3); return { bob: g.bob, legs: g, tail: 0.6 }; }
    if (nm === "wind") return { head: 0.8 * t, bob: t * 1.2, legs: { fn: [-1.5 * t, 0], ff: [-1.5 * t, 0], bn: [2 * t, 0], bf: [2 * t, 0] }, tail: 0.8 };
    if (nm === "atk") { const g = gait4(f, n, 7, 3.5); return { head: 0.9, bob: g.bob + 1, legs: g, jaw: 0.6 }; }
    if (nm === "rec") return { head: 0.9 * (1 - t), bob: 0.5 * (1 - t) };
    if (nm === "leap") return [{ bob: 2, head: 0.2, legs: { fn: [-2, 0], ff: [-2, 0], bn: [2, 0], bf: [2, 0] } }, { bob: -2, head: -0.2, legs: { fn: [4, 4], ff: [3, 4], bn: [-4, 3], bf: [-4, 3] }, tail: 1 }, { bob: -1, legs: { fn: [5, 3], ff: [4, 3], bn: [-5, 2], bf: [-5, 2] }, tail: 1 }, { bob: 1.5, head: 0.2 }][f];
    return { hurt: f === 0, head: -0.3, bob: 0.5, blink: 1 };
  }, goatFrame);

// ════ [정예] 말벌 여왕 ════ (큰 몬스터 조각 도구) 말벌보다 두 배 큰 여왕. 금빛 왕관 등딱지 · 붉은 겹눈 · 솜털 목깃 · 줄무늬 큰 배와 독침 · 반투명 날개 넷
//   p: flap(-1~1) · curl 배 말기 · tilt 기울기 · bite 턱 · sting 독침 내밈 · hurt
const QNK = 0.7;
const QN_Y = mat(ramp(0xf0b820), { tex: "skin", amp: 0.25, spec: 0.5 }), QN_K = mat(ramp(0x2a2234), { tex: "fur", amp: 0.5, spec: 0.3 }), QN_KF = mat(ramp(0x221c2a, { cool: 0x1c2a40 }), { spec: 0.3 });
const QN_YF = mat(ramp(0xc89418, { cool: 0x1c2a40 }), { spec: 0.3 }), QN_R = mat(ramp(0xc8402a), { spec: 0.6 }), QN_GOLD = mat(ramp(0xffd860), { spec: 0.9 }), QN_EYE = mat(ramp(0xa01c26), { spec: 0.9 }), QN_FUZZ = mat(ramp(0xd8a840), { tex: "fur", amp: 0.8 });
function queenFrame(p = {}) {
  const W = 108, H = 92, AX = 52, k = p.k ?? QNK, S = sculpt(W, H, { k, ax: AX });
  const fl = p.flap ?? 0, cu = p.curl ?? 0, tl = p.tilt ?? 0, R = rot([52, 44], tl), P = (x, y) => R([x, y]);
  // 다리 여섯 (검은 넓적다리 + 노란 종아리, 늘어뜨림)
  const leg = (x, a, far) => {
    const s = P(x, 42), e = pol(s, a + tl, 9), f = pol(e, a + 0.9 + tl, 8);
    S.add(capF(s, e, 1.5, 1.2), far ? QN_KF : QN_K, { z: far ? -3 : 7, h: 1.2 });
    S.add(capF(e, f, 1.2, 0.7), far ? QN_YF : QN_Y, { z: far ? -2.8 : 7.2, h: 1 });
  };
  for (const [x, a] of [[49, 2.0], [54, 1.7], [59, 1.35]]) leg(x + 2, a, 1);
  // 배 (줄무늬 다섯 마디 · 말면 앞으로 굽음) + 독침
  const base = P(46, 40), ab = (j) => pol(base, 2.3 - cu * 1.2 + j * 0.2 * (1 - cu * 0.4) + tl, 9 + j * 7.6);
  const seg = [0, 1, 2, 3, 4].map(ab), ang = (j) => 2.3 - cu * 1.2 + j * 0.2 * (1 - cu * 0.4) + tl;
  for (let j = 0; j < 5; j++) S.add(ellR(seg[j][0], seg[j][1], 10.5 - j * 1.6, 9.6 - j * 1.4, ang(j)), QN_Y, { z: 1 + j * 0.1, h: 10 - j * 1.4 });
  for (let j = 0; j < 5; j++) { const a = ang(j), q = pol(seg[j], a, 2.2 - j * 0.2), r = 9.6 - j * 1.4; S.add(capF(pol(q, a + 1.57, r), pol(q, a - 1.57, r), 1.9 - j * 0.15), QN_K, { on: 1, h: 0.4 }); }
  const sa = ang(4) + 0.3, st = pol(seg[4], sa, 7 + (p.sting ?? 0) * 5);
  S.add(capF(pol(seg[4], sa, 3), st, 2.4, 0.4), QN_K, { z: 1.6, h: 1.6 });
  p.block || S.decal(st[0], st[1], 0xb0ff60);
  // 가슴 (솜털 검정) + 붉은 등판 + 금빛 왕관 등딱지 + 솜털 목깃
  S.add(ellR(...P(54, 34), 11.5, 10, -0.2), QN_K, { z: 3, h: 10 });
  S.add(ellR(...P(54, 28.5), 9, 4, -0.2), QN_R, { lift: 1.2, h: 1.6 });
  S.add(polyF([P(45.5, 27), P(46.5, 18), P(50.5, 24), P(54, 14.5), P(57.5, 24), P(61.5, 18), P(62.5, 27)]), QN_GOLD, { lift: 3, h: 3 });
  p.block || [[54, 18], [47, 21], [61, 21]].forEach(([x, y]) => S.decal(...P(x, y), 0xff5050));
  S.add(ellR(...P(63, 36), 4.4, 7.6, -0.1), QN_FUZZ, { z: 4, h: 5 });
  // 머리: 노란 얼굴 · 큰 붉은 겹눈(눈알 무늬) · ㄱ자 더듬이 · 큰 턱
  S.add(U(capF(P(68, 29), P(71, 20), 0.8, 0.7), capF(P(71, 20), P(80, 17), 0.7, 0.6)), QN_K, { z: 5, h: 0.8 });
  S.add(U(capF(P(70, 29.4), P(74, 21.4), 0.7), capF(P(74, 21.4), P(82, 20), 0.6)), QN_KF, { z: 4.6, h: 0.6 });
  S.add(ellR(...P(70, 37.4), 8.4, 8, 0.1), QN_Y, { z: 5, h: 7 });
  S.add(ellR(...P(72.6, 33.6), 4.4, 5.4, 0.35), QN_EYE, { z: 6, h: 4 });
  if (!p.block && !p.hurt) { const e0 = P(72, 32.4); S.decal(e0[0], e0[1], 0xffb0a0).decal(e0[0] + 1, e0[1] + 0.6, 0xff6040).decal(e0[0] - 0.6, e0[1] + 2, 0x6a1018).decal(e0[0] + 1.2, e0[1] + 2.6, 0x6a1018); }
  S.add(capF(P(66, 40), P(74, 41), 0.8, 0.6), QN_YF, { lift: 0.6, h: 0.6 });
  const bt = p.bite ?? 0;
  S.add(U(capF(P(75, 41), P(79 + bt, 40.4 - bt * 1.6), 1.7, 0.7), capF(P(75, 42.6), P(78.6 + bt, 45 + bt * 1.4), 1.7, 0.7)), QN_K, { z: 6.4, h: 1.4 });
  for (const [x, a] of [[47, 1.95], [52, 1.65], [57, 1.3]]) leg(x, a, 0);
  const C = S.render({ debug: p.debug, rim: !p.block });
  // 반투명 날개 넷 (뒤 둘은 몸 뒤에만, 앞 둘은 몸 위로 비침) + 날개맥
  if (!p.block && !p.debug) {
    const Wo = C.W, Ho = C.H, T = (q) => [Wo / 2 + (q[0] - AX) * k, Ho + (q[1] - H) * k];
    const wingF = (o0, a, len, wd) => {
      const o = T(o0), L0 = len * k, Wd = wd * k, r = pol(o, a, L0), m = lerp(o, r, 0.5), ca = Math.cos(a), sa2 = Math.sin(a);
      return (x, y) => { const u = (x - m[0]) * ca + (y - m[1]) * sa2, v = -(x - m[0]) * sa2 + (y - m[1]) * ca; return (u / (L0 / 2)) ** 2 + (v / Wd) ** 2 <= 1; };
    };
    const vein = (o0, a, len) => { const o = T(o0); for (let s = 2; s < len * k * 0.86; s += 0.5) { const x = Math.floor(o[0] + Math.cos(a) * s), y = Math.floor(o[1] + Math.sin(a) * s); if (x < 0 || y < 0 || x >= Wo || y >= Ho) continue; const i = y * Wo + x; C.d[i] >= 0 && (C.d[i] = mixc(C.d[i], 0x2e3a46, 0.35)); } };
    glass(C, wingF(P(52, 26), -2.35 + fl * 0.5, 40, 9), 0.25, !0);
    glass(C, wingF(P(50, 28), -2.85 + fl * 0.4, 30, 7), 0.3, !0);
    glass(C, wingF(P(55, 25), -2.05 - fl * 0.6, 42, 10), 0.05);
    glass(C, wingF(P(53, 27), -2.6 - fl * 0.5, 31, 7.5), 0.1);
    vein(P(55, 25), -2.05 - fl * 0.6 + 0.06, 42), vein(P(53, 27), -2.6 - fl * 0.5 - 0.05, 31);
  }
  return p.hurt ? flash(C) : C;
}
export const pxQueen = {
  fw: Math.round(108 * QNK), fh: Math.round(92 * QNK), w: 30, h: 26, flying: !0,
  anims: { idle: [4, 24], move: [4, 26], wind: [4, 12, !1], atk: [3, 16], rec: [3, 10, !1], hurt: [2, 12, !1], call: [6, 14, !1], volley: [4, 14, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), fl = [1, 0.2, -1, 0.2][f % 4];
    let P = { flap: fl, curl: 0.15 };
    if (nm === "move") P = { flap: fl, tilt: 0.12, curl: 0.1 };
    if (nm === "wind") P = { flap: fl, curl: t, tilt: -0.12 * t };
    if (nm === "atk") P = { flap: [-1, 0.6, -0.4][f], curl: 1, tilt: 0.5, bite: 1, sting: 1 };
    if (nm === "rec") P = { flap: fl, curl: 1 - t, tilt: 0.25 * (1 - t) };
    if (nm === "call") P = { flap: fl, tilt: -0.2 - 0.1 * Math.sin(t * 6), bite: f % 2, curl: 0.2 };
    if (nm === "volley") P = { flap: fl, curl: 0.8, tilt: 0.25, sting: 1 };
    if (nm === "hurt") P = { hurt: f === 0, flap: 0.4, tilt: -0.3, curl: 0.5, bite: 1 };
    return queenFrame(P);
  },
};

// ════ 고블린 주술사 ════ 잎 망토 두건 · 뼈 지팡이 끝에 불씨 해골 · 깃털 장식 · 허리에 작은 북
//   p: bob · lean · staff 지팡이 각(0 세움 · + 앞으로) · flame 불씨 크기 · drum 북 치는 손 · cast 손 앞으로 · jaw · hurt
const GSKN = ramp(0x6a9a3e), GSKF = rampF(0x5a8a38), ROBE = ramp(0x4a6a3a), ROBEF = rampF(0x3e5a32), BONE = ramp(0xcabf9a), FLM = rampGlow(0xff8a2a), FEA = ramp(0xc84a3a), DRUM = ramp(0x8a5a34);
function shamanFrame(p = {}) {
  const W = 48, H = 46, G = H - 1, C = board(W, H);
  const b = p.bob ?? 0, ln = p.lean ?? 0;
  const hip = [22 + ln * 2, 34 + b], sh = [24 + ln * 4, 25 + b], hd = [28 + ln * 5, 18 + b];
  // 지팡이 (뒤 손): 세워 들고, 휘두르면 앞으로 기운다
  const sa = -Math.PI / 2 + (p.staff ?? 0.1), hand = [sh[0] - 9, sh[1] + 8];
  const top = pol(hand, sa, 21), bot = pol(hand, sa + Math.PI, 11);
  C.part(capF(bot, top, 1.1, 1), BONE, { shine: 1 });
  C.part(ellR(top[0], top[1], 3.2, 3), BONE, { shine: 1 }); // 해골
  C.over(top[0] + 1, top[1], 0x1a0c0c).over(top[0] - 0.5, top[1] + 0.2, 0x1a0c0c);
  const fz = p.flame ?? 1;
  C.part(polyF([[top[0] - 2.4 * fz, top[1] - 2], [top[0], top[1] - 9 * fz], [top[0] + 2.4 * fz, top[1] - 2]]), FLM, { sep: !1 });
  C.over(top[0], top[1] - 3, 0xfff4c0);
  // 다리 (망토 아래 발만)
  for (const [dx, far] of [[-3, 1], [3, 0]]) C.part(polyF([[hip[0] + dx - 2, G - 2], [hip[0] + dx + 3, G - 2], [hip[0] + dx + 4.5, G + 0.5], [hip[0] + dx - 2.5, G + 0.5]]), far ? GSKF : GSKN, { shine: !far });
  // 망토 몸 (밑단 너덜)
  const hem = [];
  for (let k = 0; k <= 8; k++) hem.push([hip[0] + 8 - k * 2, G - 2 - (k % 2) * 2.2]);
  C.part(polyF([[sh[0] - 6, sh[1] - 1], [sh[0] + 4, sh[1] - 1], [hip[0] + 8, hip[1]], ...hem, [hip[0] - 8, hip[1]]]), ROBE, { shine: 1 });
  strokes(C, [[sh[0] - 2, sh[1] + 2, hip[0] - 3, G - 4], [sh[0] + 2, sh[1] + 2, hip[0] + 3, G - 4]], ROBE[2]);
  // 잎 장식 (망토 어깨)
  for (const [x, y] of [[-5, 0], [-2, -1.5], [1.5, -1]]) C.part(ellR(sh[0] + x, sh[1] + y, 2.2, 1.3, 0.5), ramp(0x6aa848), { sep: !1, shine: 1 });
  // 지팡이 쥔 뒷손
  C.part(capF([sh[0] - 4, sh[1] + 2], hand, 1.9, 1.6), ROBEF);
  C.part(ellR(hand[0], hand[1], 1.9, 1.7), GSKF, { sep: !1 });
  // 허리 북 + 북 치는 손
  C.part(ellR(hip[0] + 6, hip[1] - 1, 3.2, 3.6), DRUM, { shine: 1 });
  C.part(ellR(hip[0] + 6.8, hip[1] - 1.2, 1.8, 3), ramp(0xd8c8a0), { sep: !1 });
  // 머리: 두건 아래 고블린 얼굴
  const [hx, hy] = hd;
  C.part(capF([hx - 4, hy + 2], [hx - 14, hy - 2], 2.4, 0.5), GSKF); // 먼 귀
  C.part(U(ellR(hx, hy, 5.6, 5), polyF([[hx - 2, hy + 1], [hx + 6, hy + 1], [hx + 5, hy + 5.4 + (p.jaw ?? 0)], [hx - 2, hy + 4]])), GSKN, { shine: 1, lv: 0.1, sep: !1 });
  C.part(U(capF([hx + 3, hy - 1], [hx + 7.5, hy + 1.6], 1.6, 1.2), ellR(hx + 7.6, hy + 2, 1.6, 1.5)), GSKN, { shine: 1, sep: !1 });
  // 얼굴 칠 (하얀 줄) + 빛나는 눈
  strokes(C, [[hx + 1, hy - 2.2, hx + 4.5, hy - 2.2]], 0xe8e0c8);
  if (p.hurt) strokes(C, [[hx + 1, hy - 0.5, hx + 3, hy - 0.5]], GSKN[1]);
  else C.over(hx + 2, hy - 0.6, 0xffc040).over(hx + 3, hy - 0.6, 0xffffff);
  strokes(C, [[hx + 1, hy + 3.4, hx + 5, hy + 3]], 0x1a080a);
  C.over(hx + 4.6, hy + 2.4, 0xd8cca8);
  // 두건 + 깃털
  C.part(minus(ellR(hx - 1.5, hy - 2, 7, 6.2), (x, y) => x > hx + 2.4 && y > hy - 3.4), ROBE, { shine: 1 });
  C.part(capF([hx - 5, hy - 7], [hx - 11, hy - 14], 1.6, 0.6), FEA, { shine: 1, sep: !1 });
  C.part(capF([hx - 3, hy - 7.5], [hx - 6, hy - 16], 1.4, 0.5), ramp(0xe8c040), { shine: 1, sep: !1 });
  // 가까운 귀
  C.part(capF([hx - 3, hy + 1], [hx - 12, hy - 3.5], 2.8, 0.5), GSKN, { shine: 1 });
  // 앞 팔 (주문: 앞으로 뻗음 / 북: 아래로)
  const ca = p.cast ?? 0, dr = p.drum ?? 0;
  const s = [sh[0] + 2, sh[1] + 1.5], e = ca ? pol(s, -0.3, 6) : pol(s, 1.2 - dr * 0.5, 6), w = ca ? pol(e, -0.1, 5.5) : pol(e, 0.6 + dr * 0.8, 5);
  C.part(U(capF(s, e, 2.2, 1.9), capF(e, w, 1.9, 1.6)), ROBE, { shine: 1 });
  C.part(ellR(w[0], w[1], 2, 1.8), GSKN, { shine: 1, sep: !1 });
  ca && C.part(ellR(w[0] + 3, w[1] - 0.5, 2.4 * ca, 2.2 * ca), FLM, { sep: !1 });
  return done(C, p);
}
export const pxShaman = spec(48, 46, 13, 22,
  { idle: [6, 8], move: [8, 12], wind: [4, 12, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1], drum: [6, 12, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "idle") return { bob: Math.sin(ph) * 0.5, flame: 0.8 + 0.3 * Math.sin(ph * 2), staff: 0.1 };
    if (nm === "move") return { bob: Math.abs(Math.sin(ph)) * -1 + 0.4, lean: 0.2, staff: 0.4 + Math.sin(ph) * 0.1, flame: 0.9 };
    if (nm === "wind") return { lean: -0.25 * t, staff: 0.1 - 0.4 * t, cast: 0.6 * t, flame: 1 + t * 0.5 };
    if (nm === "atk") return { lean: 0.35, staff: 0.6, cast: [1.2, 1, 0.6][f], flame: 1.2, jaw: 1 };
    if (nm === "rec") return { lean: 0.2 * (1 - t), staff: 0.3, cast: 0, flame: 0.9 };
    if (nm === "drum") return { bob: f % 2 ? 0.8 : 0, drum: f % 2, staff: 0.05, jaw: f % 2 ? 1 : 0, flame: 1.2 };
    return { hurt: f === 0, lean: -0.4, staff: -0.2, flame: 0.6 };
  }, shamanFrame);

// ════ 굴파기 두더지 ════ 통통한 몸 · 삽 같은 앞발톱 · 분홍 별 코 · 작은 눈. 땅속에선 흙 둔덕만 보인다
//   p: bob · dig 앞발(-1~1) · rise 몸이 얼마나 나왔나(0 땅속 ~ 1) · claw 휘두르기(0~1) · hurt
const MF = ramp(0x5a4a52), MFF = rampF(0x4a3c44), PINK = ramp(0xe08a9a), CLAW = ramp(0xd8ccb0), DIRT = ramp(0x7a5a3a);
function moleFrame(p = {}) {
  const W = 46, H = 36, G = H - 1, C = board(W, H);
  const b = p.bob ?? 0, rs = p.rise ?? 1, dg = p.dig ?? 0, cl = p.claw ?? 0;
  const sink = (1 - rs) * 22;
  if (rs < 0.98) {
    // 흙 둔덕 (땅속에 있을 때)
    C.part(U(ellR(23, G - 1, 14, 5 + (1 - rs) * 2), ellR(17, G - 2, 6, 4), ellR(29, G - 3, 7, 4.5)), DIRT, { shine: 1 });
    for (const [x, y] of [[14, -3], [20, -6], [27, -5], [33, -2]]) C.part(ellR(x, G + y, 1.6, 1.2), ramp(0x9a7a50), { sep: !1 });
    if (rs < 0.05) return done(C, p);
  }
  const clip = (f) => (x, y) => f(x, y) && y < G - 1.5 + (rs < 0.98 ? -1 : 2);
  // 뒷발
  C.part(clip(ellR(14, G - 3 + sink, 4, 3)), MFF);
  // 몸통 (배 쪽 밝게)
  const body = ellR(21, 23 + b + sink, 13, 10);
  C.part(clip(body), MF, { shine: 1 });
  C.part(clip((x, y) => body(x, y) && y > 27 + b + sink), ramp(0x7a6870), { sep: !1 });
  // 머리 + 긴 주둥이 + 별 코
  C.part(clip(U(ellR(32, 21 + b + sink, 7, 6.5), capF([35, 22 + b + sink], [41, 23.5 + b + sink], 3, 2))), MF, { shine: 1, lv: 0.05 });
  C.part(clip(ellR(42, 23.5 + b + sink, 2.4, 2.2)), PINK, { shine: 1, sep: !1 });
  dots(C, [[43.5, 22 + b + sink], [44, 24 + b + sink], [42.5, 25.5 + b + sink], [42, 21.4 + b + sink]], PINK[5]);
  // 작은 눈 (거의 감김)
  !p.hurt && C.over(35, 18.5 + b + sink, 0x100810).over(35.6, 18 + b + sink, 0x8a7a90);
  // 앞발: 커다란 삽 발톱 (휘두르면 앞으로)
  const sh = [33, 26 + b + sink], pw = pol(sh, 1.0 - cl * 1.6 + dg * 0.4, 7);
  C.part(clip(capF(sh, pw, 3.2, 2.8)), MF, { shine: 1 });
  C.part(clip(ellR(pw[0] + 1, pw[1], 3.6, 3, 0.4 - cl)), PINK, { shine: 1, sep: !1 });
  for (let k = -1; k <= 1; k++) { const a = 0.6 - cl * 1.4 + k * 0.35, s0 = pol([pw[0] + 1, pw[1]], a, 2.5); C.part(clip(capF(s0, pol(s0, a, 4.2 + cl), 1, 0.3)), CLAW, { shine: 1, sep: !1 }); }
  return done(C, p);
}
export const pxMole = spec(46, 36, 22, 16,
  { idle: [4, 6], move: [6, 12], burrow: [5, 12, !1], under: [4, 10], rise: [5, 14, !1], wind: [3, 10, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1], dirt: [4, 12, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "idle") return { bob: Math.sin(ph) * 0.4, dig: Math.sin(ph) * 0.2 };
    if (nm === "move") return { bob: Math.abs(Math.sin(ph)) * -0.8, dig: Math.sin(ph) };
    if (nm === "burrow") return { rise: 1 - t, dig: Math.sin(t * 9) };
    if (nm === "under") return { rise: 0, bob: f % 2 };
    if (nm === "rise") return { rise: Math.min(1, t * 1.4), claw: t > 0.5 ? 1 : 0, bob: -1 };
    if (nm === "wind") return { claw: -0.4 * t, bob: 0.5 };
    if (nm === "atk") return { claw: [0.6, 1, 0.8][f], bob: -0.5 };
    if (nm === "rec") return { claw: 0.8 * (1 - t) };
    if (nm === "dirt") return { dig: [1, -1, 1, -1][f], claw: f % 2 ? 0.5 : 0 };
    return { hurt: f === 0, bob: 0.6, claw: -0.3 };
  }, moleFrame);
