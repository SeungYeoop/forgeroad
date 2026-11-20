// 드립스톤 몬스터 12종 (2D 픽셀 손그림, 오른쪽을 본다) — 종유석 동굴 · 지하 호수 · 협곡
//   윗층: 종유석 박쥐 · 석순 미믹 · 물방울 정령 · [정예] 석회 거인
//   가운데: 동굴 도롱뇽 · 호수 거머리 · 빛 이끼 덩이 · [정예] 전기 뱀장어
//   아랫층: 바위 갑충 · 메아리 정령 · 굴뚝 지네 · [정예] 협곡 바실리스크
import { board, ellR, capF, polyF, U, minus, pol, lerp, ik, ramp, rampF, rampGlow, mixc, dots, strokes, rot, eye, glass, limb, gait4, gait2, flapOf, spec, done, flash, T2, L } from "./kit.js";
import { sculpt, mat } from "./px3.js";

const LIME = ramp(0xc4c8bc), LIMEF = rampF(0xaab0a6), LIMED = ramp(0x8a948e), SLATE = ramp(0x4e5a66), SLATEF = rampF(0x44505c);
const WATER = rampGlow(0x48b8d8), CYAN = rampGlow(0x60e8f8), MOSSG = rampGlow(0x50d8a0);

// ════ 종유석 박쥐 ════ 천장에 거꾸로 매달려 있다가 초음파를 쏘며 덤빈다. 큰 귀 · 막 날개 · 석회 가루 묻은 털
//   p: flap · hang 매달림(거꾸로) · mouth 입 벌림(초음파) · hurt
const BAT = ramp(0x5a5068), BATF = rampF(0x4a4058), BMEM = ramp(0x8a6a7a);
function batFrame(p = {}) {
  const W = 46, H = 34, C = board(W, H);
  const fl = p.flap ?? 0, hg = p.hang;
  const wing = (far, side) => {
    const root = [23 + side * 3, 15], a = hg ? (side > 0 ? 1.9 : 1.25) : side > 0 ? -0.5 - fl * 0.8 : -2.65 + fl * 0.8, len = hg ? 9 : 17;
    const tip = pol(root, a, len), f1 = pol(root, a + side * 0.6, len * 0.75), f2 = pol(root, a + side * 1.1, len * 0.5);
    C.part(polyF([root, tip, lerp(tip, f1, 0.5), f1, lerp(f1, f2, 0.5), f2, [23, 20]]), far ? rampF(0x8a6a7a) : BMEM, { shine: !far });
    C.part(U(capF(root, tip, 1, 0.5), capF(root, f1, 0.7, 0.4)), far ? BATF : BAT, { sep: !1 });
  };
  wing(!0, -1);
  // 몸통 + 머리 (매달리면 뒤집힌다)
  const R = hg ? rot([23, 16], Math.PI) : (q) => q, P = (x, y) => R([x, y]);
  C.part(ellR(...P(23, 18), 5.5, 6.5), BAT, { shine: 1 });
  dots(C, [P(21, 16), P(25, 19), P(22, 21)], LIME[4]);
  C.part(ellR(...P(24, 10), 4.6, 4.2), BAT, { shine: 1, lv: 0.05 });
  C.part(U(polyF([P(21, 8), P(19, 1), P(23, 6)]), polyF([P(26, 7), P(29, 0), P(28, 8)])), BAT, { shine: 1 });
  C.over(...P(20.5, 4), BMEM[4]).over(...P(28, 3.5), BMEM[4]);
  if (!p.hurt) { C.over(...P(22.6, 9.6), 0xff4a5a); C.over(...P(25.6, 9.6), 0xff4a5a); }
  const mo = p.mouth ?? 0;
  mo > 0.2 ? C.part(ellR(...P(24.2, 12.6), 1.6, 0.8 + mo), ramp(0x4a1020), { sep: !1 }) : strokes(C, [[...P(23, 12.5), ...P(25.5, 12.5)]], 0x1a0c14);
  dots(C, [P(23, 13), P(25.4, 13)], 0xf0f0e0);
  // 발 (매달린 자리)
  hg && C.part(U(capF(P(21.5, 23.5), P(21.5, 26), 0.8), capF(P(24.5, 23.5), P(24.5, 26), 0.8)), BATF, { sep: !1 });
  wing(!1, 1);
  return done(C, p);
}
export const pxCaveBat = spec(46, 34, 16, 14,
  { hang: [2, 2], idle: [4, 18], move: [4, 20], wind: [3, 12, !1], atk: [3, 14, !1], rec: [3, 10, !1], hurt: [2, 12, !1], shriek: [4, 14, !1] },
  (nm, f, n, t) => {
    const fl = [1, 0.3, -1, 0.3][f % 4];
    if (nm === "hang") return { hang: 1, mouth: f ? 0.3 : 0 };
    if (nm === "wind") return { flap: fl, mouth: t };
    if (nm === "atk") return { flap: -1, mouth: 1.2 };
    if (nm === "shriek") return { flap: fl * 0.5, mouth: 1.4 + (f % 2) * 0.4 };
    if (nm === "rec") return { flap: fl, mouth: 1 - t };
    if (nm === "hurt") return { hurt: f === 0, flap: 0.6 };
    return { flap: fl };
  }, batFrame, { flying: !0 });

// ════ 석순 미믹 ════ 천장 석순인 척 매달려 있다가 바로 아래로 떨어져 찌른다. 떨어진 뒤엔 다리 여섯으로 기어 다닌다
//   p: cling 천장(1) · legs(0~1) · open 아래 입 벌림 · hurt
function mimicFrame(p = {}) {
  const W = 34, H = 44, C = board(W, H);
  const cl = p.cling ?? 0, lg = p.legs ?? 0, op = p.open ?? 0;
  // 몸: 아래로 뾰족한 원뿔 (천장 = 위 / 땅 = 옆으로 누운 대신 위를 향해 선다)
  const R = cl ? (q) => q : rot([17, 22], Math.PI), P = (x, y) => R([x, y]);
  if (lg > 0) for (let k = 0; k < 3; k++) for (const s of [-1, 1]) { const a = P(17 + s * 5, 10 + k * 4), b = P(17 + s * (11 + lg * 3), 6 + k * 5); C.part(capF(a, b, 1, 0.6), s < 0 ? LIMEF : LIMED, { sep: !1 }); }
  C.part(polyF([P(8, 2), P(26, 2), P(24, 12), P(20, 30), P(17, 40), P(14, 30), P(10, 12)]), LIME, { shine: 1, flat: 0.6 });
  for (let k = 0; k < 5; k++) strokes(C, [[...P(10 + k * 0.6, 8 + k * 6), ...P(24 - k * 0.6, 8 + k * 6)]], LIME[2]);
  // 눈: 몸통 가운데 줄 따라 셋 (깨면 빛남)
  const ec = cl && op < 0.2 ? LIME[2] : 0x7af0ff;
  for (const y of [12, 17, 22]) C.over(...P(17, y), ec);
  // 아래 입 (끝이 갈라짐)
  op > 0.2 && C.part(polyF([P(15, 30), P(19, 30), P(17 + op * 3, 38), P(17, 34), P(17 - op * 3, 38)]), ramp(0x3a1820), { sep: !1 });
  C.part(ellR(...P(17, 2), 10, 2.4), LIMED, { sep: !1 });
  return done(C, p);
}
export const pxStalMimic = spec(34, 44, 14, 26,
  { hide: [1, 1], wake: [3, 12, !1], idle: [4, 8], move: [6, 14], wind: [3, 10, !1], atk: [2, 14], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    if (nm === "hide") return { cling: 1 };
    if (nm === "wake") return { cling: 1, open: t };
    if (nm === "atk") return { cling: 1, open: 1.2 };
    if (nm === "idle") return { legs: 0.6 + 0.2 * Math.sin((f / n) * T2), open: 0.3 };
    if (nm === "move") return { legs: 0.5 + 0.5 * Math.abs(Math.sin((f / n) * T2)), open: 0.4 };
    if (nm === "wind") return { legs: 1, open: t };
    if (nm === "rec") return { legs: 1, open: 1 - t };
    return { hurt: f === 0, legs: 1, open: 0.6 };
  }, mimicFrame, { flying: !0 });

// ════ 물방울 정령 ════ 맑은 물방울 몸 속에 빛나는 핵. 물방울을 튕겨 쏘고, 바닥을 미끄럽게 적신다
//   p: wob 출렁 · squash 쏠 때 납작 · core 핵 빛 · hurt
function dropFrame(p = {}) {
  const W = 34, H = 38, C = board(W, H);
  const wb = p.wob ?? 0, sq = p.squash ?? 0;
  const body = U(ellR(17, 22 + sq * 2, 10 + sq * 2 + wb, 11 - sq * 2 - wb), polyF([[13, 14], [17, 3 - wb * 2], [21, 14]]));
  C.part(body, WATER, { shine: 1 });
  // 안쪽 반사 + 핵
  C.part((x, y) => body(x, y) && (x - 13) ** 2 + (y - 16) ** 2 < 10, ramp(0xd8f8ff), { sep: !1 });
  C.part(ellR(18, 24 + sq, 3.2 * (p.core ?? 1), 3.2 * (p.core ?? 1)), CYAN, { sep: !1, shine: 1 });
  // 눈 (핵 위)
  !p.hurt && (C.over(15, 20 + sq, 0x0c2830), C.over(20, 20 + sq, 0x0c2830), C.over(15, 19 + sq, 0xffffff));
  strokes(C, [[16, 26 + sq, 19, 26 + sq]], 0x1a5868);
  // 떨어지는 물방울
  dots(C, [[9, 31 + wb * 2], [25, 32 - wb * 2]], 0x90e0f8);
  return done(C, p);
}
export const pxDrop = spec(34, 38, 16, 20,
  { idle: [6, 9], move: [6, 12], wind: [3, 10, !1], atk: [2, 14, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "wind") return { squash: t, core: 1 + t * 0.5 };
    if (nm === "atk") return { squash: -0.6, core: 1.6 };
    if (nm === "rec") return { wob: Math.sin(t * 6) * 0.6 };
    if (nm === "hurt") return { hurt: f === 0, wob: 1 };
    return { wob: Math.sin(ph) * 0.8 };
  }, dropFrame, { flying: !0 });

// ════ [정예] 석회 거인 ════ (큰 몬스터 조각 도구) 흘러내린 석회암이 굳은 거인. 등에 석순과 푸른 결정이 돋고 턱·팔에 종유석이 매달린다. 주먹을 내려치면 바닥에서 석순이 솟는다
//   p: bob · step · arm 가까운 팔(0 내림 ~ 1 머리 위 ~ 2 내려침) · far 먼 손 위치 · held 종유석 쥠 · hurt
const GTK = 0.7;
const GT_L = mat(ramp(0xccd0c4), { tex: "stone", amp: 0.6 }), GT_LF = mat(ramp(0xaab2a8, { cool: 0x24304a }), { tex: "stone", amp: 0.5 }), GT_LD = mat(ramp(0xa4aca2), { tex: "stone", amp: 0.8 });
const GT_WET = mat(ramp(0x9cc4cc), { tex: "skin", amp: 0.2, spec: 0.6 }), GT_GLOW = mat(rampGlow(0x60e0f0)), GT_XT = mat(rampGlow(0x78e4f4), { spec: 0.7 });
function giantFrame(p = {}) {
  const W = 132, H = 116, G = H - 1, S = sculpt(W, H, { k: p.k ?? GTK, ax: 58 });
  const b = (p.bob ?? 0) + 10, st = p.step ?? 0, ar = p.arm ?? 0;
  // 등 석순 (뒤로 비스듬히, 고리 홈) + 푸른 결정 무리
  for (const [x, y, h, a] of [[30, 28, 15, -0.5], [38, 20, 20, -0.32], [46, 15, 19, -0.15]]) {
    const base = [x, y + b], tip = pol(base, -Math.PI / 2 + a, h);
    S.add(polyF([[x - 4.6, y + b + 5], [x + 4.6, y + b + 5], tip]), GT_LD, { z: -4, h: 4 });
    for (const u of [0.3, 0.6]) { const m = lerp(base, tip, u), w = 3.6 * (1 - u); S.carve(capF(pol(m, a, w), pol(m, a + Math.PI, w), 0.45), 0.55); }
  }
  for (const [x, y, a, l] of [[54, 19, -1.85, 8], [59, 17, -1.5, 12], [65, 20, -1.15, 7]]) S.add(polyF([pol([x, y + b], a - 1.45, 2.6), pol([x, y + b], a + 1.45, 2.6), pol([x, y + b], a, l)]), GT_XT, { z: -3, h: 3, prof: "sharp" });
  // 먼 팔 (손 위치 far) + 쥔 종유석
  const sF = [40, 48 + b], hF = p.far ? [p.far[0], p.far[1] + b] : [30, 80 + b], eF = ik(sF, hF, 18, 18, -1);
  S.add(U(capF(sF, eF, 8.4, 7.2), capF(eF, hF, 7.2, 6.4)), GT_LF, { z: -4, h: 7 });
  S.add(ellR(hF[0], hF[1], 7.4, 6.6), GT_LF, { z: -3, h: 6 });
  if (p.held) {
    const a0 = -0.22, B0 = pol(hF, Math.PI + a0, 12), T0 = pol(hF, a0, 30);
    S.add(U(polyF([pol(B0, a0 - Math.PI / 2, 6), pol(B0, a0 + Math.PI / 2, 6), T0]), ellR(B0[0], B0[1], 3.2, 6, a0)), GT_LD, { z: -2.5, h: 5 });
    for (const u of [0.32, 0.58]) { const m = lerp(B0, T0, u), w = 5.4 * (1 - u); S.carve(capF(pol(m, a0 - Math.PI / 2, w), pol(m, a0 + Math.PI / 2, w), 0.5), 0.6); }
    S.add(ellR(hF[0], hF[1] - 0.5, 6.6, 5.6), GT_LF, { z: -2, h: 6 });
  }
  // 다리 (짧고 굵은 바위 기둥 + 넓은 발)
  for (const [x, far, sg] of [[44, 1, -st], [66, 0, st]]) {
    const M0 = far ? GT_LF : GT_L;
    S.add(U(ellR(x + sg * 0.5, 76 + b, 11, 8), capF([x + sg * 0.5, 76 + b], [x + sg, G - 7], 10.5, 9.5)), M0, { z: far ? -2 : 3, h: 9 });
    S.add(U(ellR(x + sg + 1, G - 4, 12.5, 4.6), ellR(x + sg + 8, G - 3, 5.4, 3.4)), far ? GT_LF : GT_LD, { z: far ? -1 : 4, h: 3.4 });
    far || S.carve(capF([x + sg - 4, 93 + b], [x + sg + 4, 94 + b], 0.7), 1);
  }
  // 몸통: 흘러내린 덩어리 + 흐름돌 주름(물결 테 + 방울) + 흐른 자국 홈 + 젖은 반짝임 + 푸른 광맥
  S.add(U(ellR(54, 52 + b, 25, 22), ellR(62, 36 + b, 17, 14)), GT_L, { z: 0, h: 18 });
  S.add(ellR(58, 58 + b, 14, 10), GT_L, { blend: 5, h: 5 });
  for (const [y0, x0, x1] of [[47, 36, 70], [63, 34, 72]]) {
    let i = 0;
    for (let x = x0; x <= x1; x += 4, i++) {
      const y = y0 + Math.sin(x * 0.45) * 1.6 + b;
      S.add(ellR(x, y, 2.8, 1.7), GT_L, { blend: 1.2, h: 1.3 });
      i % 3 === 1 && S.add(polyF([[x - 1.6, y + 1], [x + 1.6, y + 1], [x + 0.2, y + 5.5]]), GT_L, { blend: 0.8, h: 0.9 });
    }
  }
  for (const [x, y, l] of [[40, 34, 10], [50, 51, 9], [62, 52, 8], [46, 68, 9], [60, 68, 8]]) S.carve(capF([x, y + b], [x + 0.6, y + l + b], 1), 1.2);
  S.add(ellR(46, 40 + b, 5.4, 8.6), GT_WET, { on: 1, h: 0.8 });
  S.add(ellR(62, 72 + b, 4, 3), GT_WET, { on: 1, h: 0.6 });
  for (const [x0, y0, x1, y1] of [[42, 56, 50, 62], [50, 62, 48, 70], [64, 50, 70, 58], [70, 58, 68, 64]]) S.add(capF([x0, y0 + b], [x1, y1 + b], 0.85), GT_GLOW, { on: 1, h: 0.6, lift: 0.3 });
  // 머리 (어깨에 파묻힘) · 눈썹 바위 · 동굴 같은 눈 · 입 · 턱 종유석
  S.add(ellR(76, 28 + b, 12, 10.5), GT_L, { z: 6, h: 10 });
  S.add(capF([66, 22 + b], [85, 20 + b], 3.2, 2.6), GT_L, { blend: 2, h: 2.4 });
  S.carve(ellR(73, 28 + b, 2.6, 2.2), 3.4, !1).carve(ellR(81, 27 + b, 2.6, 2.2), 3.4, !1).carve(capF([72, 34.5 + b], [83, 35 + b], 1), 2.6, !1);
  for (const [x, l] of [[69, 5], [73, 9], [77, 7], [81, 5]]) S.add(polyF([[x - 2, 37 + b], [x + 2, 37 + b], [x + 0.3, 37 + l + b]]), GT_LD, { z: 7, h: 1.6 });
  if (!p.block && !p.hurt) for (const [x, y] of [[73, 28], [81, 27]]) S.decal(x, y + b, 0x7af0ff).decal(x + 1, y + b, 0xc8f8ff);
  // 가까운 팔: 커다란 주먹 + 팔뚝에 매달린 종유석
  const s0 = [80, 44 + b];
  const ua = ar > 1 ? 1.15 : L(1.0, -0.8, ar), fa = ar > 1 ? 1.15 : ua + L(0.3, -1.0, ar);
  const e0 = pol(s0, ua, 18), fist = ar > 1 ? [s0[0] + 22, G - 9] : pol(e0, fa, 15);
  S.add(U(capF(s0, e0, 9, 7.6), capF(e0, fist, 7.6, 7)), GT_L, { z: 10, h: 8 });
  for (const [u, l] of [[0.35, 6], [0.65, 8]]) { const q = lerp(e0, fist, u); S.add(polyF([[q[0] - 2.2, q[1] + 4], [q[0] + 2.2, q[1] + 4], [q[0] + 0.4, q[1] + 4 + l]]), GT_LD, { z: 9.5, h: 1.6 }); }
  S.add(ellR(fist[0], fist[1], 9.6, 8.4), GT_L, { z: 11, h: 9 });
  S.carve(capF([fist[0] - 4, fist[1] - 3], [fist[0] + 4, fist[1] - 3], 0.6), 1.2).carve(capF([fist[0] - 3, fist[1] + 1], [fist[0] + 5, fist[1] + 1], 0.6), 1.1);
  S.add(ellR(...lerp(s0, e0, 0.4), 5, 3), GT_WET, { on: 1, h: 0.8 });
  const C = S.render({ debug: p.debug, rim: !p.block });
  return p.hurt ? flash(C) : C;
}
export const pxLimeGiant = {
  fw: Math.round(132 * GTK), fh: Math.round(116 * GTK), w: 34, h: 50,
  anims: { idle: [4, 5], move: [6, 7], wind: [4, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], pull: [4, 8, !1], throw: [3, 12, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = {};
    if (nm === "idle") P = { bob: Math.sin(ph) * 0.6 };
    if (nm === "move") P = { step: Math.sin(ph) * 4.5, bob: -Math.abs(Math.sin(ph)) * 1.6, arm: Math.max(0, Math.sin(ph)) * 0.12 };
    if (nm === "wind") P = { arm: t, bob: -t };
    if (nm === "atk") P = { arm: 2, bob: 2 };
    if (nm === "rec") P = { arm: f === 0 ? 2 : 0.3 * (1 - t), bob: 2 * (1 - t) };
    if (nm === "pull") P = f < 2 ? { far: [[30, 30], [44, 2]][f], bob: -f } : { far: [44, 4], held: 1, bob: f === 2 ? 1 : 0 };
    if (nm === "throw") P = [{ far: [44, 4], held: 1, bob: -1 }, { far: [86, 12] }, { far: [96, 40], bob: 1 }][f];
    if (nm === "hurt") P = { hurt: f === 0, bob: 1 };
    return giantFrame(P);
  },
};

// ════ 동굴 도롱뇽 ════ 미끈한 청록 몸 · 바깥 아가미 · 흐린 눈. 물웅덩이에서 튀어나와 물고 미끄러지듯 물러난다
//   p: legs · bob · jaw · gill 아가미 떨림 · low 웅크림 · hurt
const NWT = ramp(0x4a9a9a), NWTF = rampF(0x3e8686), NWTB = ramp(0xe8c890), GILL = ramp(0xe86a8a);
function newtFrame(p = {}) {
  const W = 52, H = 24, G = H - 1, C = board(W, H);
  const b = (p.bob ?? 0) + (p.low ?? 0) * 2, lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) };
  const leg = (sh, o, far) => { const ft = [sh[0] + o[0], G - 0.5 - o[1]]; C.part(U(capF(sh, ft, far ? 1.6 : 1.9, 1.3)), far ? NWTF : NWT, { shine: !far }); C.part(ellR(ft[0] + 1, ft[1], 1.8, 0.9), far ? NWTF : NWT, { sep: !1 }); };
  leg([34, 17 + b], lg.ff, !0);
  leg([18, 17 + b], lg.bf, !0);
  // 꼬리 (납작 노)
  C.part(U(capF([13, 15 + b], [2, 12 + b], 3.4, 1.2)), NWT, { shine: 1 });
  strokes(C, [[3, 11.5 + b, 12, 13 + b]], NWT[5]);
  const body = ellR(24, 15 + b, 12, 4.6);
  C.part(body, NWT, { shine: 1 });
  C.part((x, y) => body(x, y) && y > 16.5 + b, NWTB, { sep: !1 });
  dots(C, [[18, 12.5 + b], [24, 12 + b], [30, 12.5 + b]], NWT[2]);
  // 머리 (넓적) + 아가미
  C.part(ellR(39, 14 + b, 6.5, 4.6), NWT, { shine: 1, lv: 0.05 });
  const gl = p.gill ?? 0;
  for (const [dy, a] of [[-3, -2.3], [0, -2.8], [3, 2.6]]) C.part(capF([35, 13 + b + dy * 0.5], pol([35, 13 + b + dy * 0.5], a + gl * 0.3, 4.5), 1.1, 0.5), GILL, { sep: !1, shine: 1 });
  const jw = p.jaw ?? 0;
  jw > 0.2 && C.part(polyF([[40, 16 + b], [46, 15.5 + b + jw * 2], [44, 18 + b + jw * 2]]), ramp(0x8a2a3a), { sep: !1 });
  strokes(C, [[39, 16 + b, 45.5, 15.4 + b]], 0x0c2020);
  !p.hurt && (C.over(41, 12.2 + b, 0xc8d8e0), C.over(41.6, 12.2 + b, 0x203038));
  leg([31, 18 + b], lg.fn, !1);
  leg([16, 18 + b], lg.bn, !1);
  return done(C, p);
}
export const pxNewt = spec(52, 24, 24, 10,
  { idle: [4, 6], move: [6, 14], wind: [3, 12, !1], atk: [3, 18, !1], rec: [3, 10, !1], hurt: [2, 10, !1], dive: [3, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "idle") return { gill: Math.sin(ph * 2), bob: Math.sin(ph) * 0.3 };
    if (nm === "move") return { legs: gait4(f, n, 4.5, 1.6), gill: Math.sin(ph) };
    if (nm === "wind") return { low: t, jaw: t };
    if (nm === "atk") return { jaw: 1.4, legs: { fn: [4, 1], ff: [4, 1], bn: [-2, 0], bf: [-2, 0] } };
    if (nm === "rec") return { jaw: 1 - t };
    if (nm === "dive") return { low: 1 + t, gill: 1 };
    return { hurt: f === 0, jaw: 0.6 };
  }, newtFrame);

// ════ 호수 거머리 ════ 검붉은 마디 몸 · 둥근 빨판 입. 꿈틀대며 다가와 달라붙어 피를 빤다
//   p: wave 꿈틀 위상 · rear 머리 들기 · suck 빨판 벌림 · hurt
const LCH = ramp(0x5a2a3a), LCHB = ramp(0x8a5a4a);
function leechFrame(p = {}) {
  const W = 40, H = 22, G = H - 1, C = board(W, H);
  const wv = p.wave ?? 0, rr = p.rear ?? 0;
  const pts = [];
  for (let k = 0; k <= 6; k++) { const x = 6 + k * 4.4, y = G - 4 - Math.sin(wv + k * 0.9) * 1.8 - (k > 4 ? rr * (k - 4) * 5 : 0); pts.push([x, y]); }
  const body = U(...pts.slice(1).map((q, k) => capF(pts[k], q, 3.2 + Math.sin((k / 6) * Math.PI) * 1.2, 3.2 + Math.sin(((k + 1) / 6) * Math.PI) * 1.2)));
  C.part(body, LCH, { shine: 1 });
  for (let k = 1; k < 6; k++) strokes(C, [[pts[k][0], pts[k][1] - 3, pts[k][0], pts[k][1] + 3]], LCH[2]);
  strokes(C, [[pts[0][0], pts[0][1] + 2.2, pts[6][0], pts[6][1] + 2.2]], LCHB[4]);
  const hd = pts[6], su = p.suck ?? 0;
  C.part(ellR(hd[0] + 2, hd[1], 3 + su, 3.4 + su * 0.5), LCHB, { shine: 1 });
  C.part(ellR(hd[0] + 3, hd[1], 1.2 + su, 1.6 + su * 0.6), ramp(0x2a0a10), { sep: !1 });
  su > 0.4 && dots(C, [[hd[0] + 3, hd[1] - 1.8 - su], [hd[0] + 4.6, hd[1]], [hd[0] + 3, hd[1] + 1.8 + su]], 0xe8d8c8);
  return done(C, p);
}
export const pxLeech = spec(40, 22, 20, 8,
  { idle: [4, 6], move: [6, 10], wind: [3, 10, !1], atk: [3, 14, !1], rec: [3, 10, !1], hurt: [2, 10, !1], suck: [4, 10] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "move") return { wave: ph };
    if (nm === "wind") return { rear: t, suck: t * 0.5, wave: 0.5 };
    if (nm === "atk") return { rear: 0.6, suck: 1.2 };
    if (nm === "suck") return { rear: 0.3, suck: 0.8 + (f % 2) * 0.4, wave: ph * 0.3 };
    if (nm === "rec") return { rear: 0.6 * (1 - t), suck: 1 - t };
    if (nm === "hurt") return { hurt: f === 0, wave: 1.5 };
    return { wave: Math.sin(ph) * 0.6 };
  }, leechFrame);

// ════ 빛 이끼 덩이 ════ 푸르게 빛나는 이끼가 뭉친 덩어리. 빛을 내뿜어 주변 몬스터의 상처를 메운다
//   p: pulse 빛(0~1.5) · bob · hurt
function mossFrame(p = {}) {
  const W = 36, H = 30, G = H - 1, C = board(W, H);
  const pu = p.pulse ?? 0.5, b = p.bob ?? 0;
  C.part(U(ellR(18, G - 8 + b, 13, 8), ellR(11, G - 12 + b, 6, 6), ellR(24, G - 13 + b, 7, 6.5), ellR(18, G - 16 + b, 6, 5)), ramp(0x2e6a5a), { shine: 1 });
  for (const [x, y, r] of [[9, -12, 2], [14, -17, 1.6], [21, -18, 2], [27, -12, 1.8], [18, -7, 1.6], [12, -6, 1.4], [25, -6, 1.5]]) C.part(ellR(x, G + y + b, r * (0.8 + pu * 0.3), r * (0.8 + pu * 0.3)), MOSSG, { sep: !1, shine: 1 });
  pu > 1 && dots(C, [[18, G - 22 + b], [6, G - 16 + b], [30, G - 17 + b]], 0xd8fff0);
  // 작은 눈 둘 (졸린)
  !p.hurt && strokes(C, [[14, G - 10 + b, 15.5, G - 10 + b], [20, G - 10 + b, 21.5, G - 10 + b]], 0x0c2a20);
  return done(C, p);
}
export const pxGlowMoss = spec(36, 30, 20, 16,
  { idle: [6, 6], move: [4, 6], wind: [4, 8, !1], atk: [3, 10, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "wind") return { pulse: 0.5 + t, bob: -t };
    if (nm === "atk") return { pulse: 1.6, bob: -1 };
    if (nm === "rec") return { pulse: 1.4 - t };
    if (nm === "hurt") return { hurt: f === 0, pulse: 0.2, bob: 1 };
    return { pulse: 0.5 + 0.3 * Math.sin(ph), bob: Math.sin(ph) * 0.4 };
  }, mossFrame);

// ════ [정예] 전기 뱀장어 ════ (큰 몬스터 조각 도구) 호수 위로 솟아 몸을 휘감는 커다란 뱀장어. 옆구리의 발전 세포가 줄지어 빛나고, 배 쪽 긴 지느러미가 물결친다
//   p: wave 몸 물결 · rear 머리 들기 · lunge 앞으로 뻗기 · charge 전기(0~1.5) · fl 불꽃 깜빡 · jaw · coil 말기 · hurt
const ELK = 0.72;
const EL_SK = mat(ramp(0x34465e), { tex: "skin", amp: 0.3, spec: 0.5 }), EL_BEL = mat(ramp(0xb8a676), { tex: "skin", amp: 0.2, spec: 0.3 });
const EL_FIN = mat(ramp(0x6a9cc0), { tex: "skin", amp: 0.2 }), EL_GLOW = mat(rampGlow(0x8af0ff)), EL_DIM = mat(ramp(0x3c8aa8), { spec: 0.4 }), EL_MOUTH = mat(ramp(0x6a2434));
function eelFrame(p = {}) {
  const W = 136, H = 78, S = sculpt(W, H, { k: p.k ?? ELK, ax: 64 });
  const N = 14, wv = p.wave ?? 0, rr = p.rear ?? 0, ln = p.lunge ?? 0, ch = p.charge ?? 0, co = p.coil ?? 0;
  const pts = [];
  for (let k = 0; k <= N; k++) {
    const u = k / N, up = Math.pow(Math.max(0, (u - 0.5) / 0.5), 1.6);
    let x = 6 + u * (98 + ln * 8) - rr * up * 10, y = 54 - Math.sin(wv + u * 5.2) * 4.2 * (1.15 - u) - rr * up * 30;
    if (co > 0) {
      const a = -0.5 - (1 - u) * 1.1 * T2, r = 9 + u * 15;
      x = L(x, 60 + Math.cos(a) * r, co), y = L(y, 50 + Math.sin(a) * r * 0.62 - Math.max(0, u - 0.86) * 90, co);
    }
    pts.push([x, y]);
  }
  const rad = (u) => 1.6 + 6.8 * Math.sin((Math.min(1, u / 0.6) * Math.PI) / 2) - Math.max(0, u - 0.9) * 10;
  const nrm = (k) => { const a = pts[Math.min(N, k + 1)], c = pts[Math.max(0, k - 1)], dx = a[0] - c[0], dy = a[1] - c[1], l = Math.hypot(dx, dy) || 1; return [dy / l, -dx / l]; };
  const off = (k, d) => { const q = pts[k], n = nrm(k); return [q[0] + n[0] * d, q[1] + n[1] * d]; };
  // 지느러미: 배 쪽 긴 띠(물결 가장자리 + 살) · 등 낮은 띠 · 꼬리 끝 노
  const fin = (k0, k1, side, hgt) => {
    const top = [], bot = [];
    for (let k = k0; k <= k1; k++) { const u = k / N, r = rad(u), hh = hgt(u) * (1 + 0.22 * Math.sin(wv * 2 + k * 1.3)); top.push(off(k, side * (r + hh))); bot.push(off(k, side * r * 0.4)); }
    S.add(polyF([...top, ...bot.reverse()]), EL_FIN, { z: -3, h: 1.4, prof: "flat" });
    for (let k = k0 + 1; k < k1; k++) { const u = k / N, r = rad(u); hgt(u) > 1.2 && S.carve(capF(off(k, side * (r + 0.6)), off(k, side * (r + hgt(u) * 0.85)), 0.35), 0.5); }
  };
  fin(0, 11, -1, (u) => 6.4 * Math.sin(Math.PI * Math.min(1, (u + 0.06) / 0.86)));
  fin(0, 6, 1, (u) => 4.2 * Math.sin(Math.PI * Math.min(1, (u + 0.04) / 0.47)));
  const tl = pts[0], tn = nrm(0);
  S.add(ellR(tl[0] - 3, tl[1], 5, 3.8, Math.atan2(-tn[0], tn[1])), EL_FIN, { z: -2.5, h: 1.4, prof: "flat" });
  // 몸 마디 (꼬리 → 머리 순, 앞쪽이 위) + 연한 배 + 옆줄
  for (let k = 1; k <= N; k++) S.add(capF(pts[k - 1], pts[k], rad((k - 1) / N), rad(k / N)), EL_SK, { z: k * 0.35, h: rad(k / N) * 0.95 });
  for (let k = 1; k <= N; k++) { const r0 = rad((k - 1) / N), r1 = rad(k / N); S.add(capF(off(k - 1, -r0 * 0.68), off(k, -r1 * 0.68), r0 * 0.27, r1 * 0.27), EL_BEL, { on: 1, h: 0.5 }); }
  // 발전 세포 (두 줄 · 충전되면 밝게)
  const EM = ch > 0.6 ? EL_GLOW : EL_DIM;
  for (let k = 2; k < N - 1; k++) { const r = rad(k / N); for (const s of [0.2, -0.22]) { const q = off(k, r * s); S.add(ellR(q[0], q[1], 1.7, 1.1), EM, { on: 1, h: 0.5, lift: 0.3 }); } }
  // 머리: 둥근 이마 → 납작한 주둥이 · 아래턱 · 입 속 · 아가미 틈 · 가슴지느러미 · 눈
  const hb = pts[N], hp = pts[N - 1], ha = Math.atan2(hb[1] - hp[1], hb[0] - hp[0]), R = rot(hb, ha), Q = (x, y) => R([hb[0] + x, hb[1] + y]), jw = p.jaw ?? 0, hz = N * 0.35;
  S.add(ellR(...Q(-4, 4.6), 4.6, 2.4, ha + 0.6), EL_FIN, { z: hz + 2.5, h: 1.6 });
  jw > 0.2 && S.add(polyF([Q(2, 2), Q(17, 1.2), Q(15, 1.8 + jw * 4.5), Q(2, 3.4)]), EL_MOUTH, { z: hz + 1, h: 1 });
  S.add(U(ellR(...Q(2, -0.5), 9.4, 7.6, ha), polyF([Q(2, -6.8), Q(13, -3.8), Q(19, 0), Q(17, 1.8), Q(2, 3.6)])), EL_SK, { z: hz + 2, h: 7.5 });
  S.add(polyF([Q(0, 2.6), Q(16, 1.8 + jw * 4.5), Q(14, 4.6 + jw * 4.8), Q(2, 6.2)]), EL_SK, { z: hz + 1.5, h: 4.4 });
  S.add(polyF([Q(3, 4.6), Q(13, 3.9 + jw * 4.6), Q(4, 6)]), EL_BEL, { on: 1, h: 0.4 });
  S.carve(capF(Q(4, 2.2), Q(17, 1.2), 0.5), 1.1, !1).carve(capF(Q(-3.4, -3), Q(-2.8, 3), 0.5), 0.8);
  if (!p.block) {
    jw > 0.35 && [[8, 2.4], [11, 2.2], [14, 1.8]].forEach(([x, y]) => S.decal(...Q(x, y + jw * 1.4), 0xf4f0e0));
    p.hurt || (S.decal(...Q(8, -3), 0xffe860), S.decal(...Q(9, -3), 0x202020), S.decal(...Q(8, -4), 0xffffff));
  }
  // 방전: 몸에서 튀는 지그재그 번개
  if (ch > 0.9 && !p.block)
    for (let k = 2; k < N; k += 3) {
      const n = nrm(k), q0 = off(k, rad(k / N) + 1.5), s = (k + (p.fl ?? 0)) % 2 ? 1 : -1;
      const q1 = [q0[0] + n[0] * 4 + s * 2, q0[1] + n[1] * 4], q2 = [q1[0] + n[0] * 3 - s * 3, q1[1] + n[1] * 3], q3 = [q2[0] + n[0] * 4 + s * 1.5, q2[1] + n[1] * 4];
      S.add(U(capF(q0, q1, 0.7), capF(q1, q2, 0.7), capF(q2, q3, 0.6)), EL_GLOW, { z: 14, h: 0.6 });
    }
  const C = S.render({ debug: p.debug, rim: !p.block });
  return p.hurt ? flash(C) : C;
}
export const pxEel = {
  fw: Math.round(136 * ELK), fh: Math.round(78 * ELK), w: 40, h: 20, flying: !0,
  anims: { idle: [6, 8], move: [6, 10], wind: [4, 10, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1], shock: [4, 16], coil: [4, 10] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { wave: ph, rear: 0.25 + Math.sin(ph) * 0.06, charge: f % 3 === 0 ? 0.7 : 0.2 };
    if (nm === "move") P = { wave: ph, rear: 0.08, charge: 0.2 };
    if (nm === "wind") P = { wave: ph * 0.5, rear: 0.3 + t * 0.6, charge: t * 1.1, fl: f, jaw: t * 0.4 };
    if (nm === "atk") P = { rear: 0.1, lunge: 1, jaw: 1.4, charge: 0.6, wave: 1 };
    if (nm === "shock") P = { wave: ph * 2, rear: 0.55, charge: 1.3, fl: f, jaw: 0.8 };
    if (nm === "coil") P = { coil: 1, charge: 1 + (f % 2) * 0.3, fl: f, wave: ph, jaw: 0.4 };
    if (nm === "rec") P = { rear: 0.5 * (1 - t), charge: 0.5 * (1 - t), wave: ph };
    if (nm === "hurt") P = { hurt: f === 0, rear: 0.45, jaw: 1, wave: 1.5 };
    return eelFrame(P);
  },
};

// ════ 바위 갑충 ════ 등딱지가 바위인 큰 딱정벌레. 들이받다 벽에 박히면 뒤집혀 버둥거린다 (뒤집히면 약해짐)
//   p: legs 위상 · flip 뒤집힘 · horn 뿔 숙이기 · hurt
const BTL = ramp(0x5a5048), BTLL = ramp(0x2a2224);
function beetleFrame(p = {}) {
  const W = 50, H = 32, G = H - 1, C = board(W, H);
  const lp = p.legs ?? 0, fl = p.flip ?? 0, hn = p.horn ?? 0;
  const R = fl ? rot([25, 20], Math.PI) : (q) => q, P = (x, y) => R([x, y + (fl ? -4 : 0)]);
  // 다리 여섯 (마디)
  for (let k = 0; k < 3; k++) for (const far of [1, 0]) { const s = P(16 + k * 8, 22), a = (fl ? -1.4 : 1.6) + Math.sin(lp + k * 2 + far * 3) * 0.4 * (fl ? 2 : 1) + (k - 1) * 0.3, e = pol(s, a, 5), ft = pol(e, a + 0.5, 5); C.part(U(capF(s, e, 1.2, 1), capF(e, ft, 1, 0.6)), far ? rampF(0x2a2224) : BTLL, { sep: !1 }); }
  // 몸 (바위 등딱지)
  C.part(ellR(...P(24, 16), 15, 9), STONEISH(), { shine: 1 });
  strokes(C, [[...P(24, 8), ...P(24, 25)]], BTL[1]);
  for (const [x, y] of [[17, 12], [29, 11], [20, 19], [31, 18]]) C.part(ellR(...P(x, y), 2.4, 1.8), ramp(0x6a6058), { sep: !1 });
  // 머리 + 뿔
  C.part(ellR(...P(40, 19), 5.5, 5), BTLL, { shine: 1 });
  C.part(U(capF(P(43, 17), P(49, 12 + hn * 4), 2, 0.8)), BTLL, { shine: 1, sep: !1 });
  !p.hurt && C.over(...P(42, 18), 0xff9030);
  return done(C, p);
}
const STONEISH = () => ramp(0x7a7064);
export const pxRockBeetle = spec(50, 32, 26, 14,
  { idle: [4, 6], move: [6, 14], wind: [4, 12, !1], atk: [4, 18], rec: [3, 10, !1], hurt: [2, 10, !1], flip: [4, 12] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "move") return { legs: ph * 2 };
    if (nm === "wind") return { horn: t, legs: t * 4 };
    if (nm === "atk") return { horn: 1, legs: ph * 3 };
    if (nm === "flip") return { flip: 1, legs: ph * 3 };
    if (nm === "rec") return { horn: 1 - t };
    if (nm === "hurt") return { hurt: f === 0, horn: 0.5 };
    return { legs: Math.sin(ph) * 0.3 };
  }, beetleFrame);

// ════ 메아리 정령 ════ 동그란 고리들이 겹친 소리 덩어리. 입처럼 벌어지면 소리 고리를 퍼뜨린다
//   p: ring 고리 퍼짐(0~1) · spin · open · hurt
function echoFrame(p = {}) {
  const W = 40, H = 40, C = board(W, H);
  const rg = p.ring ?? 0, sp = p.spin ?? 0, op = p.open ?? 0;
  // 바깥 고리 (퍼짐)
  for (let k = 0; k < 3; k++) { const r = 8 + k * 4 + rg * 4; for (let a = 0; a < T2; a += 0.18) { const on = Math.sin(a * 3 + sp + k) > 0.2; on && C.px(20 + Math.cos(a) * r, 20 + Math.sin(a) * r * 0.8, k === 0 ? 0xc0e8ff : k === 1 ? 0x8ab8e0 : 0x5a7aa8); } }
  // 몸 (안쪽 구)
  C.part(ellR(20, 20, 7.5, 7), ramp(0x8ab0d8), { shine: 1 });
  C.part(ellR(20, 21, 4 + op * 2, 1.2 + op * 2.4), ramp(0x1a2238), { sep: !1 });
  !p.hurt && (C.over(17, 17, 0xffffff), C.over(23, 17, 0xffffff));
  return done(C, p);
}
export const pxEcho = spec(40, 40, 16, 16,
  { idle: [6, 10], move: [6, 10], wind: [4, 10, !1], atk: [3, 14, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "wind") return { open: t, ring: -0.5 * t, spin: ph };
    if (nm === "atk") return { open: 1.2, ring: 1 + f * 0.4, spin: ph };
    if (nm === "rec") return { open: 1 - t, ring: 1 - t, spin: ph };
    if (nm === "hurt") return { hurt: f === 0, ring: 0.6 };
    return { ring: 0.2 * Math.sin(ph), spin: ph };
  }, echoFrame, { flying: !0 });

// ════ 굴뚝 지네 ════ 마디마다 붉은 다리가 달린 긴 지네. 바닥과 벽을 따라 빠르게 기어 와 독니로 문다
//   p: wave 꿈틀 · legs 다리 위상 · rear 머리 들기 · jaw · hurt
const CEN = ramp(0x8a3a2a), CENL = ramp(0xd8a040);
function centipedeFrame(p = {}) {
  const W = 58, H = 22, G = H - 1, C = board(W, H);
  const wv = p.wave ?? 0, lp = p.legs ?? 0, rr = p.rear ?? 0;
  const pts = [];
  for (let k = 0; k <= 8; k++) pts.push([5 + k * 5.6, G - 5 - Math.sin(wv + k * 0.8) * 1.2 - (k > 6 ? rr * (k - 6) * 4 : 0)]);
  for (let k = 0; k <= 7; k++) for (const far of [1, 0]) { const s = pts[k], a = 1.4 + Math.sin(lp + k * 1.2 + far * 3.14) * 0.5 + (far ? 0.4 : 0), ft = pol(s, a, 5); C.part(capF(s, ft, 0.8, 0.5), far ? rampF(0xd8a040) : CENL, { sep: !1 }); }
  for (let k = 0; k <= 8; k++) C.part(ellR(pts[k][0], pts[k][1], 3.6, 3), CEN, { shine: 1 });
  for (let k = 0; k <= 7; k++) C.over(pts[k][0] - 1, pts[k][1] - 1.5, CEN[5]);
  const hd = pts[8], jw = p.jaw ?? 0;
  C.part(ellR(hd[0] + 3, hd[1] - 0.5, 3.6, 3.2), CEN, { shine: 1, lv: 0.05 });
  C.part(U(capF([hd[0] + 5, hd[1] + 1], [hd[0] + 9, hd[1] + 2 - jw * 2], 1, 0.4), capF([hd[0] + 5, hd[1] + 2], [hd[0] + 9, hd[1] + 3 + jw * 2], 1, 0.4)), ramp(0x2a1410), { sep: !1 });
  strokes(C, [[hd[0] + 3, hd[1] - 3, hd[0] + 9, hd[1] - 8], [hd[0] + 2, hd[1] - 3, hd[0] + 5, hd[1] - 9]], CEN[1]);
  !p.hurt && C.over(hd[0] + 4, hd[1] - 1.5, 0xfff080);
  return done(C, p);
}
export const pxCentipede = spec(58, 22, 30, 10,
  { idle: [4, 8], move: [6, 20], wind: [3, 12, !1], atk: [3, 18, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "move") return { wave: ph, legs: ph * 2 };
    if (nm === "wind") return { rear: t, jaw: t };
    if (nm === "atk") return { rear: 0.4, jaw: 1.5, legs: ph };
    if (nm === "rec") return { rear: 0.5 * (1 - t), jaw: 1 - t };
    if (nm === "hurt") return { hurt: f === 0, wave: 1.5 };
    return { wave: Math.sin(ph) * 0.4, legs: Math.sin(ph) };
  }, centipedeFrame);

// ════ [정예] 협곡 바실리스크 ════ (큰 몬스터 조각 도구) 돌빛 비늘의 거대한 도마뱀. 왕관 같은 붉은 볏과 목주머니 · 시선을 모으면 눈이 하얗게 빛난다 · 독 이빨
//   p: legs · bob · head · jaw · gaze 눈빛(0~1.5) · tail 꼬리 휘두르기 · hurt
const BSK = 0.72;
const BS_SC = mat(ramp(0x5e6e4a), { tex: "skin", amp: 0.6 }), BS_SCF = mat(rampF(0x6e7e5a), { tex: "skin", amp: 0.5 });
const BS_BEL = mat(ramp(0xccbc84), { tex: "stone", amp: 0.3 }), BS_CR = mat(ramp(0xcc4a36), { tex: "skin", amp: 0.3 }), BS_CRD = mat(ramp(0xa03a2c), { tex: "skin", amp: 0.3 });
const BS_PL = mat(ramp(0x86946a), { tex: "stone", amp: 0.6 }), BS_CLAW = mat(ramp(0xe0d4b8), { spec: 0.4 });
function basiliskFrame(p = {}) {
  const W = 128, H = 68, G = H - 1, S = sculpt(W, H, { k: p.k ?? BSK, ax: 62 });
  const b = (p.bob ?? 0) + 4, lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) }, tw = p.tail ?? 0;
  // 다리: 어깨 → 팔꿈치(앞다리는 뒤로, 뒷다리는 앞으로 꺾임) → 발 + 발톱 셋
  const leg = (sh, o, far, front) => {
    const ft = [sh[0] + o[0] + (front ? 4 : -3), G - 2 - o[1]], kn = [L(sh[0], ft[0], 0.5) + (front ? -4 : 5), sh[1] + 7];
    const M0 = far ? BS_SCF : BS_SC;
    S.add(U(capF(sh, kn, far ? 5 : 5.8, 4.4), capF(kn, ft, 4.4, 3.2)), M0, { z: far ? -5 : 5, h: 4 });
    for (const d of [-2.6, 0, 2.6]) S.add(capF(ft, [ft[0] + d + 3.4, ft[1] + 1.6], 1.4, 0.5), BS_CLAW, { z: far ? -4 : 6, h: 1 });
  };
  leg([84, 42 + b], lg.ff, !0, !0);
  leg([48, 42 + b], lg.bf, !0, !1);
  // 꼬리 (휘두르면 위로 크게) + 가시 + 띠무늬
  const t0 = [38, 40 + b], t1 = [20, 42 + b - tw * 6], t2 = [5 + tw * 4, 34 + b - tw * 14];
  S.add(U(capF(t0, t1, 8, 5), capF(t1, t2, 5, 1.4)), BS_SC, { z: -2, h: 5 });
  for (let k = 0; k < 4; k++) { const q = lerp(t0, t1, k / 4); S.add(polyF([[q[0] - 2, q[1] - 4], [q[0] + 2, q[1] - 4], [q[0], q[1] - 7]]), BS_PL, { z: -1, h: 1.6 }); }
  for (const [A0, B0, u, r] of [[t0, t1, 0.55, 7], [t1, t2, 0.12, 5], [t1, t2, 0.55, 3.4]]) { const q = lerp(A0, B0, u); S.tone(capF([q[0] - 1, q[1] - r], [q[0] + 1, q[1] + r], 1.6), -0.14); }
  // 몸통 + 등 비늘판 + 띠무늬 + 배
  S.add(U(ellR(64, 36 + b, 28, 12), ellR(42, 37 + b, 11, 10)), BS_SC, { z: 0, h: 12 });
  for (let k = 0; k < 9; k++) S.add(polyF([[40 + k * 6, 25.5 + b], [45 + k * 6, 25.5 + b], [42.5 + k * 6, 20 + b - (k % 2) * 2]]), BS_PL, { lift: 2, h: 2.2 });
  for (const x of [47, 61, 75]) S.tone(polyF([[x - 3, 25 + b], [x + 3, 25 + b], [x + 2, 40 + b], [x - 2, 40 + b]]), -0.13);
  S.add(ellR(66, 43 + b, 22, 5), BS_BEL, { on: 1, h: 1.6, lift: 0.4 });
  for (let k = 0; k < 6; k++) S.carve(capF([52 + k * 5, 40 + b], [53 + k * 5, 47 + b], 0.5), 0.8);
  for (const [x, y] of [[54, 32], [68, 30], [70, 35], [50, 36]]) S.carve(ellR(x, y + b, 2, 1.4), 0.7);
  // 목 + 머리 (볏 · 목주머니 · 눈두덩 · 턱 · 독 이빨 · 눈)
  const Hr = rot([90, 30 + b], -(p.head ?? 0) * 0.4), Q = (x, y) => Hr([x, y + b]);
  S.add(capF(Q(84, 34), Q(94, 26), 8, 6.6), BS_SC, { blend: 3, h: 6 });
  S.add(polyF([Q(91, 32), Q(104, 34), Q(101, 41), Q(94, 42)]), BS_CRD, { z: 4, h: 2.4 });
  for (const x of [96, 99.5]) S.carve(capF(Q(x, 35), Q(x - 1, 40), 0.4), 0.6);
  S.add(polyF([Q(92, 18), Q(108, 19), Q(120, 25), Q(119, 30), Q(104, 34), Q(92, 33)]), BS_SC, { z: 6, h: 8 });
  S.add(capF(Q(101, 20.6), Q(110, 21.4), 1.6, 1.2), BS_SC, { blend: 1.5, h: 1.6 });
  S.add(polyF([Q(88, 20), Q(91, 6), Q(95, 15), Q(99, 3), Q(102, 15), Q(106, 9), Q(106, 21)]), BS_CR, { z: 7, h: 3, lift: 2 });
  const jw = p.jaw ?? 0;
  S.add(polyF([Q(98, 32), Q(118, 30 + jw * 4), Q(114, 36 + jw * 4), Q(98, 36)]), BS_SC, { z: 5, h: 4 });
  S.carve(capF(Q(100, 31), Q(119, 29.5), 0.6), 1.6, !1).carve(ellR(...Q(117, 25.6), 0.8, 0.6), 0.8, !1);
  if (!p.block) {
    jw > 0.3 && (S.decal(...Q(108, 31), 0xf0f0e0), S.decal(...Q(113, 31), 0xf0f0e0), S.decal(...Q(110, 33 + jw * 2), 0xa0ff60));
    if (!p.hurt) {
      const gz = p.gaze ?? 0, ec = gz > 1 ? 0xffffff : mixc(0xffc020, 0xfff8d0, gz);
      for (const [x, y] of [[106, 23], [107, 23], [106.5, 22]]) S.decal(...Q(x, y), ec);
      gz > 0.8 && [[110, 22], [111, 23], [110, 24]].forEach(([x, y]) => S.decal(...Q(x, y), 0xfff8d0));
    }
  }
  leg([78, 43 + b], lg.fn, !1, !0);
  leg([42, 43 + b], lg.bn, !1, !1);
  const C = S.render({ debug: p.debug, rim: !p.block });
  return p.hurt ? flash(C) : C;
}
export const pxBasilisk = {
  fw: Math.round(128 * BSK), fh: Math.round(68 * BSK), w: 44, h: 24,
  anims: { idle: [4, 5], move: [6, 10], wind: [4, 10, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1], gaze: [4, 10], tail: [4, 14, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = {};
    if (nm === "idle") P = { bob: Math.sin(ph) * 0.5, jaw: f === 2 ? 0.4 : 0 };
    if (nm === "move") { const g = gait4(f, n, 7, 3); P = { legs: g, tail: Math.sin(ph) * 0.3 }; }
    if (nm === "wind") P = { head: 0.4 * t, jaw: t, bob: t };
    if (nm === "atk") P = { head: -0.2, jaw: 1.5, legs: { fn: [7, 1], ff: [7, 1], bn: [-3, 0], bf: [-3, 0] } };
    if (nm === "gaze") P = { head: 0.3, gaze: 0.6 + t * 1.1 + (f % 2) * 0.2 };
    if (nm === "tail") P = { tail: [0.3, 1, 1.4, 0.6][f], head: -0.2 };
    if (nm === "rec") P = { jaw: 1 - t };
    if (nm === "hurt") P = { hurt: f === 0, head: -0.3, jaw: 0.8 };
    return basiliskFrame(P);
  },
};
