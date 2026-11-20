// 드립스톤 몬스터 12종 (2D 픽셀 손그림, 오른쪽을 본다) — 종유석 동굴 · 지하 호수 · 협곡
//   윗층: 종유석 박쥐 · 석순 미믹 · 물방울 정령 · [정예] 석회 거인
//   가운데: 동굴 도롱뇽 · 호수 거머리 · 빛 이끼 덩이 · [정예] 전기 뱀장어
//   아랫층: 바위 갑충 · 메아리 정령 · 굴뚝 지네 · [정예] 협곡 바실리스크
import { board, ellR, capF, polyF, U, minus, pol, lerp, ik, ramp, rampF, rampGlow, mixc, dots, strokes, rot, eye, glass, limb, gait4, gait2, flapOf, spec, done, flash, T2, L } from "./kit.js";

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

// ════ [정예] 석회 거인 ════ 흘러내린 석회암이 굳은 거인. 등에 종유석이 돋고, 주먹을 내려치면 바닥에서 석순이 솟는다
//   p: bob · step · arm 주먹(0 내림 ~ 1 들기 ~ 2 내려침) · lift 종유석 뽑아 들기 · hurt
function giantFrame(p = {}) {
  const W = 80, H = 74, G = H - 1, C = board(W, H);
  const b = p.bob ?? 0, st = p.step ?? 0, ar = p.arm ?? 0;
  // 등 종유석
  for (const [x, y, h] of [[24, 16, 12], [30, 12, 15], [36, 11, 13], [42, 13, 10]]) C.part(polyF([[x - 3, y + b + 4], [x + 3, y + b + 4], [x, y + b - h]]), LIMED, { shine: 1, flat: 0.6 });
  // 먼 팔 (늘어뜨림 / 종유석 들기)
  const lt = p.lift ?? 0;
  const sF = [26, 28 + b], hF = lt ? [20, 6 + b] : [20, 54 + b];
  C.part(capF(sF, hF, 6, 5.4), LIMEF, { flat: 0.7 });
  lt && C.part(polyF([[hF[0] - 4, hF[1] + 2], [hF[0] + 4, hF[1] + 2], [hF[0], hF[1] - 20]]), LIMED, { shine: 1 });
  // 다리
  for (const [x, far, s] of [[32, 1, -st], [48, 0, st]]) C.part(U(ellR(x + s * 0.5, 52 + b, 8, 6), polyF([[x - 7 + s * 0.5, 50 + b], [x + 7 + s * 0.5, 50 + b], [x + 9 + s, G - Math.max(0, s) * 0.6], [x - 8 + s, G - Math.max(0, s) * 0.6]])), far ? LIMEF : LIME, { shine: !far, flat: 0.7 });
  // 몸통 (흘러내린 덩어리)
  C.part(U(ellR(40, 36 + b, 17, 16), ellR(46, 26 + b, 12, 10)), LIME, { shine: 1, flat: 0.75 });
  for (const [x, y, l] of [[30, 30, 8], [36, 34, 10], [44, 40, 9], [52, 32, 7]]) strokes(C, [[x, y + b, x + 1, y + b + l]], LIME[3]); // 흘러내린 줄
  dots(C, [[34, 44 + b], [48, 46 + b]], CYAN[3]);
  // 머리 (몸에 파묻힘) + 동굴 같은 눈
  C.part(ellR(53, 20 + b, 8.5, 7.5), LIME, { shine: 1, flat: 0.75 });
  C.part(ellR(56, 19 + b, 2.2, 1.8), ramp(0x10181c), { sep: !1 });
  C.part(ellR(51, 19.5 + b, 1.8, 1.6), ramp(0x10181c), { sep: !1 });
  !p.hurt && (C.over(56.5, 19 + b, 0x7af0ff), C.over(51.3, 19.5 + b, 0x7af0ff));
  strokes(C, [[50, 24 + b, 58, 24.5 + b]], ramp(0x10181c)[3]);
  // 가까운 팔: 커다란 주먹
  const s = [54, 30 + b], a = ar > 1 ? 1.2 : 1.0 - ar * 2.4, e = pol(s, a, 12), fist = ar > 1 ? [s[0] + 16, G - 6] : pol(e, a + 0.3, 10);
  C.part(U(capF(s, e, 6.5, 5.6), capF(e, fist, 5.6, 5)), LIME, { shine: 1, flat: 0.7 });
  C.part(ellR(fist[0], fist[1], 7, 6.2), LIME, { shine: 1, flat: 0.75 });
  strokes(C, [[fist[0] - 3, fist[1] - 2, fist[0] + 3, fist[1] - 2]], LIME[2]);
  return done(C, p);
}
export const pxLimeGiant = spec(80, 74, 34, 50,
  { idle: [4, 5], move: [6, 7], wind: [4, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], pull: [4, 8, !1], throw: [3, 12, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "idle") return { bob: Math.sin(ph) * 0.5 };
    if (nm === "move") return { step: Math.sin(ph) * 4, bob: -Math.abs(Math.sin(ph)) * 1.5 };
    if (nm === "wind") return { arm: t, bob: -t };
    if (nm === "atk") return { arm: 2, bob: 2 };
    if (nm === "rec") return { arm: 2 - t * 2, bob: 2 * (1 - t) };
    if (nm === "pull") return { lift: t > 0.4 ? 1 : 0, bob: t };
    if (nm === "throw") return { lift: f < 1 ? 1 : 0, arm: 0.5 };
    return { hurt: f === 0, bob: 1 };
  }, giantFrame);

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

// ════ [정예] 전기 뱀장어 ════ 호수 위로 솟아 몸을 휘감는 커다란 뱀장어. 몸을 따라 전기 무늬가 흐른다
//   p: wave 몸 물결 · rear 머리 들기 · charge 전기(0~1.5) · jaw · coil 말기 · hurt
const EEL = ramp(0x2e3e5a), EELB = ramp(0xc8d0a0);
function eelFrame(p = {}) {
  const W = 90, H = 50, C = board(W, H);
  const wv = p.wave ?? 0, rr = p.rear ?? 0, ch = p.charge ?? 0, co = p.coil ?? 0;
  const pts = [];
  for (let k = 0; k <= 10; k++) {
    const u = k / 10;
    let x = 8 + k * 6.8, y = 36 - Math.sin(wv + k * 0.7) * 3 - (k > 7 ? rr * (k - 7) * 6 : 0);
    if (co > 0) { const a = u * T2 * co * 0.9 + 1.5, r = 16 - u * 6; x = L(x, 44 + Math.cos(a) * r, co); y = L(y, 26 + Math.sin(a) * r * 0.7, co); }
    pts.push([x, y]);
  }
  const body = U(...pts.slice(1).map((q, k) => capF(pts[k], q, 2 + Math.sin(((k + 1) / 11) * Math.PI) * 4.4, 2 + Math.sin(((k + 2) / 11) * Math.PI) * 4.4)));
  C.part(body, EEL, { shine: 1 });
  // 배 줄 + 지느러미
  for (let k = 1; k < 10; k++) C.over(pts[k][0], pts[k][1] + 3, EELB[4]);
  for (let k = 2; k < 9; k++) C.part(polyF([[pts[k][0] - 2, pts[k][1] - 4], [pts[k][0] + 3, pts[k][1] - 4], [pts[k][0] + 1, pts[k][1] - 8]]), rampF(0x2e3e5a), { sep: !1 });
  // 전기 무늬 (충전되면 밝게)
  const ec = ch > 0.6 ? 0xffffff : mixc(0x2a6a8a, 0x8af0ff, ch);
  for (let k = 1; k < 10; k += 2) strokes(C, [[pts[k][0] - 2, pts[k][1] - 1, pts[k][0] + 1, pts[k][1] + 1], [pts[k][0] + 1, pts[k][1] + 1, pts[k][0] + 4, pts[k][1] - 1]], ec);
  // 머리
  const hd = pts[10], jw = p.jaw ?? 0;
  C.part(U(ellR(hd[0] + 3, hd[1] - 1, 6.5, 5), polyF([[hd[0] + 4, hd[1] - 4], [hd[0] + 13, hd[1] - 1], [hd[0] + 4, hd[1] + 2]])), EEL, { shine: 1, lv: 0.05 });
  C.part(polyF([[hd[0] + 3, hd[1] + 2], [hd[0] + 12, hd[1] + jw * 3], [hd[0] + 4, hd[1] + 4 + jw * 2]]), EEL, { shine: 1 });
  jw > 0.3 && dots(C, [[hd[0] + 7, hd[1] + 1], [hd[0] + 9, hd[1] + 1.4], [hd[0] + 11, hd[1] + 1]], 0xf0f0e0);
  !p.hurt && (C.over(hd[0] + 5, hd[1] - 2.5, 0xfff060), C.over(hd[0] + 5.6, hd[1] - 3, 0xffffff));
  ch > 0.8 && dots(C, pts.filter((_, k) => k % 3 === 0).map((q) => [q[0] + (Math.random() - 0.5) * 6, q[1] - 6]), 0xc8ffff);
  return done(C, p);
}
export const pxEel = spec(90, 50, 40, 20,
  { idle: [6, 8], move: [6, 10], wind: [4, 10, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1], shock: [4, 16], coil: [4, 10] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "wind") return { wave: ph, rear: t, charge: t };
    if (nm === "atk") return { rear: 0.8, jaw: 1.4, charge: 0.6 };
    if (nm === "shock") return { wave: ph * 2, rear: 0.5, charge: 1.2 + (f % 2) * 0.3 };
    if (nm === "coil") return { coil: 1, charge: 1 + (f % 2) * 0.4, wave: ph };
    if (nm === "rec") return { rear: 0.8 * (1 - t), charge: 0.4 * (1 - t), wave: ph };
    if (nm === "hurt") return { hurt: f === 0, rear: 0.4, jaw: 1 };
    return { wave: ph, rear: nm === "idle" ? 0.3 : 0.1, charge: 0.2 };
  }, eelFrame, { flying: !0 });

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

// ════ [정예] 협곡 바실리스크 ════ 돌빛 비늘의 거대한 도마뱀. 왕관 같은 볏 · 시선을 모으면 눈이 하얗게 빛난다 · 독 이빨
//   p: legs · bob · head · jaw · gaze 눈빛(0~1.5) · tail 꼬리 휘두르기 · hurt
const BAS = ramp(0x5a6a4a), BASF = rampF(0x4e5c40), BASB = ramp(0xc8b880), CREST = ramp(0xc84a3a);
function basiliskFrame(p = {}) {
  const W = 92, H = 48, G = H - 1, C = board(W, H);
  const b = p.bob ?? 0, lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) }, tw = p.tail ?? 0;
  const leg = (sh, o, far, front) => {
    const ft = [sh[0] + o[0] + (front ? 4 : -4), G - 1.5 - o[1]], kn = [L(sh[0], ft[0], 0.5) + (front ? 3 : -3), sh[1] - 3];
    C.part(U(capF(sh, kn, far ? 3.2 : 3.8, 3), capF(kn, ft, 3, 2.2)), far ? BASF : BAS, { shine: !far });
    for (const d of [-2, 0, 2]) C.part(capF(ft, [ft[0] + d + (front ? 2.5 : -2.5), ft[1] + 1.4], 1.1, 0.5), far ? BASF : BAS, { sep: !1 });
  };
  leg([60, 30 + b], lg.ff, !0, !0);
  leg([34, 30 + b], lg.bf, !0, !1);
  // 꼬리
  const t0 = [26, 28 + b], t1 = [12, 30 + b + tw * 6], t2 = [2, 22 + b + tw * 12];
  C.part(U(capF(t0, t1, 6, 3.6), capF(t1, t2, 3.6, 1)), BAS, { shine: 1 });
  // 몸통
  const body = U(ellR(46, 26 + b, 21, 9), ellR(30, 27 + b, 8, 7.5));
  C.part(body, BAS, { shine: 1 });
  C.part((x, y) => body(x, y) && y > 29 + b, BASB, { sep: !1 });
  for (let k = 0; k < 8; k++) C.part(polyF([[28 + k * 5, 18.5 + b], [32 + k * 5, 18.5 + b], [30 + k * 5, 14 + b - (k % 2) * 2]]), BASF, { sep: !1 });
  // 목 + 머리 + 볏
  const Hr = rot([66, 22 + b], -(p.head ?? 0) * 0.4), Q = (x, y) => Hr([x, y + b]);
  C.part(capF(Q(62, 24), Q(70, 18), 6, 5), BAS, { shine: 1 });
  C.part(polyF([Q(68, 12), Q(80, 13), Q(88, 18), Q(87, 22), Q(76, 25), Q(68, 24)]), BAS, { shine: 1, lv: 0.05 });
  C.part(polyF([Q(66, 13), Q(68, 4), Q(71, 10), Q(74, 3), Q(76, 11), Q(79, 7), Q(78, 14)]), CREST, { shine: 1 });
  const jw = p.jaw ?? 0;
  jw > 0.2 && (C.part(polyF([Q(73, 22), Q(87, 21 + jw * 3), Q(84, 25 + jw * 3), Q(73, 25)]), ramp(0x6a1a2a), { sep: !1 }), dots(C, [Q(80, 22.5), Q(84, 22.6)], 0xf0f0e0), C.over(...Q(82, 24 + jw * 2), 0xa0ff60));
  strokes(C, [[...Q(74, 21.5), ...Q(87, 20.5)]], 0x101410);
  const gz = p.gaze ?? 0;
  if (!p.hurt) {
    const ec = gz > 1 ? 0xffffff : mixc(0xffc020, 0xfff8d0, gz);
    C.over(...Q(77, 16), ec).over(...Q(78, 16), ec).over(...Q(77.5, 15), ec);
    gz > 0.8 && dots(C, [Q(80, 15), Q(81, 16), Q(80, 17)], 0xfff8d0);
  }
  leg([56, 31 + b], lg.fn, !1, !0);
  leg([30, 31 + b], lg.bn, !1, !1);
  return done(C, p);
}
export const pxBasilisk = spec(92, 48, 44, 24,
  { idle: [4, 5], move: [6, 10], wind: [4, 10, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1], gaze: [4, 10], tail: [4, 14, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "idle") return { bob: Math.sin(ph) * 0.4, jaw: f === 2 ? 0.4 : 0 };
    if (nm === "move") { const g = gait4(f, n, 6, 2.5); return { legs: g, tail: Math.sin(ph) * 0.4 }; }
    if (nm === "wind") return { head: 0.4 * t, jaw: t, bob: t };
    if (nm === "atk") return { head: -0.2, jaw: 1.5, legs: { fn: [6, 1], ff: [6, 1], bn: [-3, 0], bf: [-3, 0] } };
    if (nm === "gaze") return { head: 0.3, gaze: 0.6 + t * 1.1 + (f % 2) * 0.2 };
    if (nm === "tail") return { tail: [0.3, 1, 1.4, 0.6][f], head: -0.2 };
    if (nm === "rec") return { jaw: 1 - t };
    return { hurt: f === 0, head: -0.3, jaw: 0.8 };
  }, basiliskFrame);
