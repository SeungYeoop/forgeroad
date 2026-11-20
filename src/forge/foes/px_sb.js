// 스톤브리지 몬스터 12종 (2D 픽셀 손그림, 오른쪽을 본다) — 하늘에 뜬 고대 석조 유적과 돌다리
//   아래 섬 줄: 돌 도마뱀 · 이끼 석상 · 다리 장인 인형 · [정예] 석조 수문장
//   가운데 줄: 바위 원숭이 · 항아리 미믹 · 칼날 제비 · [정예] 그리폰
//   위 줄: 룬 부유석 · 가고일 · 옛 병사 망령 · [정예] 번개 와이번
import { board, ellR, capF, polyF, U, minus, pol, lerp, ik, ramp, rampF, rampGlow, mixc, dots, strokes, rot, eye, glass, limb, gait4, gait2, flapOf, spec, done, flash, T2, L } from "./kit.js";
import { sculpt, mat } from "./px3.js";

const STONE = ramp(0xb0a690), STONEF = rampF(0x9a907a), STONED = ramp(0x857c6c), MOSS = ramp(0x6a9a44), MOSSD = ramp(0x4e7a36);
const RUNE = rampGlow(0x6ae0ff), BRONZE = ramp(0xb08446), BRONZEF = rampF(0x9a7038), WOODP = ramp(0x9a6a40), CLOTH = ramp(0x8a5040);
const mossy = (C, pts, r = 1.4) => pts.forEach(([x, y, s = 1]) => C.part(ellR(x, y, r * s * 1.4, r * s), MOSS, { sep: !1, shine: 1 }));
// 바닥 쪽을 점점 비우기 (망령 꼬리)
const fade = (C, y0, y1) => { for (let y = 0; y < C.H; y++) { const t = (y - y0) / Math.max(1, y1 - y0); if (t <= 0) continue; for (let x = 0; x < C.W; x++) { const i = y * C.W + x; if (C.d[i] < 0) continue; const k = ((x * 7 + y * 13) % 8) / 8; if (k < t) C.d[i] = -1; } } };

// ════ 돌 도마뱀 ════ 납작한 몸 · 넓게 벌린 네 다리 · 긴 꼬리 · 돌비늘 혹 · 이끼 얼룩
//   p: legs · bob · head 고개 · jaw · tail 꼬리 흔들기 · noTail 꼬리 끊김 · hurt
const LZ = ramp(0x8c8a76), LZF = rampF(0x7a786a), LZB = ramp(0xc4bca0);
function lizardFrame(p = {}) {
  const W = 56, H = 26, G = H - 1, C = board(W, H);
  const b = p.bob ?? 0, lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) }, tw = p.tail ?? 0;
  const leg = (sh, o, far, front) => {
    const ft = [sh[0] + o[0] + (front ? 3 : -3), G - 1 - o[1]];
    const kn = [L(sh[0], ft[0], 0.5) + (front ? 2 : -2), sh[1] - 2];
    C.part(U(capF(sh, kn, far ? 1.8 : 2.2, 1.6), capF(kn, ft, 1.6, 1.2)), far ? LZF : LZ, { shine: !far });
    for (const d of [-1.5, 0, 1.5]) C.part(capF(ft, [ft[0] + d + (front ? 1.5 : -1.5), ft[1] + 1], 0.7, 0.4), far ? LZF : LZ, { sep: !1 });
  };
  leg([36, 18 + b], lg.ff, !0, !0);
  leg([18, 18 + b], lg.bf, !0, !1);
  // 꼬리
  if (!p.noTail) {
    const t0 = [12, 17 + b], t1 = [5, 15 + b + tw * 2], t2 = [1, 11 + b + tw * 4];
    C.part(U(capF(t0, t1, 3.6, 2.2), capF(t1, t2, 2.2, 0.6)), LZ, { shine: 1 });
    dots(C, [[9, 14 + b], [6, 13.5 + b + tw], [3.5, 12 + b + tw * 2]], LZ[2]);
  } else C.part(ellR(11.5, 17 + b, 2.6, 2.4), ramp(0xa06050), { sep: !1 });
  // 몸통 + 배
  const body = U(ellR(26, 16.5 + b, 14, 5.2), ellR(14, 17 + b, 4, 4));
  C.part(body, LZ, { shine: 1 });
  C.part((x, y) => body(x, y) && y > 18.5 + b, LZB, { sep: !1, lv: -0.05 });
  // 돌비늘 혹 (등 따라)
  for (let k = 0; k < 7; k++) C.part(ellR(15 + k * 3.6, 12.5 + b - Math.sin(k / 6 * Math.PI) * 1.2, 1.8, 1.3), STONE, { sep: !1, shine: 1 });
  mossy(C, [[20, 12 + b, 0.8], [31, 12 + b, 0.9]], 1);
  // 머리 (납작한 삼각)
  const Hr = rot([40, 15 + b], -(p.head ?? 0) * 0.5), Q = (x, y) => Hr([x, y + b]);
  C.part(polyF([Q(38, 11.5), Q(46, 12), Q(52, 14.5), Q(52.5, 16.5), Q(46, 19), Q(38, 19)]), LZ, { shine: 1, lv: 0.06 });
  const jw = p.jaw ?? 0;
  jw > 0.2 && C.part(polyF([Q(43, 17.5), Q(52, 16.6 + jw * 2.2), Q(51, 19 + jw * 2.4), Q(43, 19.5)]), ramp(0x9a3a3a), { sep: !1 });
  strokes(C, [[...Q(44, 16.6), ...Q(52, 16 + jw * 1.5)]], 0x1a1010);
  p.hurt ? strokes(C, [[...Q(45, 13.6), ...Q(47, 13.6)]], LZ[1]) : (C.over(...Q(45.5, 13.8), 0xe8a020), C.over(...Q(46.4, 13.6), 0x140808));
  dots(C, [Q(51, 15.2)], 0x1a1010);
  leg([33, 19 + b], lg.fn, !1, !0);
  leg([16, 19 + b], lg.bn, !1, !1);
  return done(C, p);
}
export const pxLizard = spec(56, 26, 26, 12,
  { idle: [4, 6], move: [6, 16], wind: [3, 12, !1], atk: [3, 18, !1], rec: [3, 10, !1], hurt: [2, 10, !1], flee: [6, 20] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "idle") return { bob: Math.sin(ph) * 0.3, tail: Math.sin(ph) * 0.6, head: f === 2 ? 0.3 : 0 };
    if (nm === "move" || nm === "flee") { const g = gait4(f, n, 5, 2); return { legs: g, tail: Math.sin((f / n) * T2 * 2) * 1.2, noTail: nm === "flee" }; }
    if (nm === "wind") return { head: 0.5 * t, jaw: t, bob: 1 * t, legs: { fn: [-2 * t, 0], ff: [-2 * t, 0], bn: [2, 0], bf: [2, 0] } };
    if (nm === "atk") return { head: -0.2, jaw: 1.4, bob: -0.5, legs: { fn: [5, 1], ff: [5, 1], bn: [-3, 0], bf: [-3, 0] } };
    if (nm === "rec") return { jaw: 1 - t };
    return { hurt: f === 0, head: -0.3, jaw: 0.5 };
  }, lizardFrame);

// ════ 이끼 석상 ════ 유적에 서 있던 석상. 각진 몸 · 이끼 덮인 어깨 · 깨어나면 눈과 가슴 룬이 빛난다
//   p: awake(0~1) · bob · arm 주먹 들기(0 내림 ~ 1 머리 위) · step 걸음 · lean · hurt
function statueFrame(p = {}) {
  const W = 44, H = 52, G = H - 1, C = board(W, H);
  const b = p.bob ?? 0, aw = p.awake ?? 1, st = p.step ?? 0, ln = p.lean ?? 0, ar = p.arm ?? 0;
  // 받침 (잠든 동안만)
  aw < 0.5 && C.part(polyF([[8, G - 5], [36, G - 5], [38, G + 0.5], [6, G + 0.5]]), STONED, { shine: 1 });
  const lift = aw < 0.5 ? -5 : 0;
  // 다리 (짧고 굵은 기둥)
  for (const [x, far, s] of [[16, 1, -st], [27, 0, st]]) C.part(polyF([[x - 4, 36 + b + lift], [x + 4, 36 + b + lift], [x + 4.5 + s, G - 0.5 + lift - Math.max(0, s) * 0.8], [x - 4.5 + s, G - 0.5 + lift - Math.max(0, s) * 0.8]]), far ? STONEF : STONE, { shine: !far, flat: 0.6 });
  // 먼 팔
  C.part(polyF([[9 + ln * 2, 20 + b + lift], [14, 20 + b + lift], [13, 34 + b + lift], [8 + ln, 34 + b + lift]]), STONEF, { flat: 0.6 });
  // 몸통 (사다리꼴) + 가슴 룬
  const tor = polyF([[10 + ln * 3, 17 + b + lift], [34 + ln * 3, 17 + b + lift], [31 + ln, 37 + b + lift], [13 + ln, 37 + b + lift]]);
  C.part(tor, STONE, { shine: 1, flat: 0.55 });
  strokes(C, [[13 + ln, 27 + b + lift, 31 + ln, 27 + b + lift], [22 + ln * 2, 17 + b + lift, 22 + ln, 37 + b + lift]], STONE[2]);
  const rc = aw > 0.5 ? RUNE[3] : STONE[2];
  strokes(C, [[19 + ln * 2, 21 + b + lift, 25 + ln * 2, 21 + b + lift], [22 + ln * 2, 19 + b + lift, 22 + ln * 2, 25 + b + lift], [19.5 + ln * 2, 24 + b + lift, 24.5 + ln * 2, 24 + b + lift]], rc);
  // 머리 (네모 투구 모양 + 금)
  const hx = 22 + ln * 4, hy = 10 + b + lift;
  C.part(polyF([[hx - 6, hy - 6], [hx + 6, hy - 6], [hx + 7, hy + 6], [hx - 6, hy + 6]]), STONE, { shine: 1, flat: 0.6 });
  strokes(C, [[hx - 5, hy + 1, hx + 6.5, hy + 1]], STONE[1]);
  const ec = aw > 0.5 ? 0x7af0ff : STONE[1];
  C.over(hx + 2, hy - 0.5, ec).over(hx + 4.5, hy - 0.5, ec);
  aw > 0.5 && C.over(hx + 2, hy - 1.5, 0xffffff);
  strokes(C, [[hx - 3, hy - 6, hx - 1, hy - 1]], STONE[2]); // 금
  // 이끼 (머리·어깨)
  mossy(C, [[hx - 3, hy - 6, 1.2], [hx + 2, hy - 6.4, 0.9], [11 + ln * 3, 17 + b + lift, 1.1], [33 + ln * 3, 17.5 + b + lift, 1]], 1.3);
  // 가까운 팔: 주먹 (들기)
  const sh = [32 + ln * 3, 20 + b + lift], fist = ar > 0 ? [sh[0] + 3 - ar * 4, sh[1] + 10 - ar * 22] : [sh[0] + 1, sh[1] + 15];
  C.part(capF(sh, fist, 4, 3.6), STONE, { shine: 1, flat: 0.6 });
  C.part(ellR(fist[0], fist[1], 4.6, 4.2), STONE, { shine: 1, flat: 0.7 });
  strokes(C, [[fist[0] - 2, fist[1] - 1, fist[0] + 2, fist[1] - 1]], STONE[2]);
  return done(C, p);
}
export const pxStatue = spec(44, 52, 18, 30,
  { dormant: [1, 1], wake: [5, 10, !1], idle: [4, 5], move: [6, 8], wind: [4, 8, !1], atk: [3, 16, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "dormant") return { awake: 0 };
    if (nm === "wake") return { awake: t, bob: Math.sin(t * 9) * 0.6 * (1 - t) };
    if (nm === "idle") return { bob: Math.sin(ph) * 0.3 };
    if (nm === "move") return { step: Math.sin(ph) * 3, bob: -Math.abs(Math.sin(ph)) * 1, lean: 0.1 };
    if (nm === "wind") return { arm: t, lean: -0.2 * t };
    if (nm === "atk") return { arm: [-0.2, -0.5, -0.5][f] * 0 - 0.6, lean: 0.4, bob: 1 };
    if (nm === "rec") return { arm: -0.6 * (1 - t), lean: 0.4 * (1 - t) };
    return { hurt: f === 0, lean: -0.3 };
  }, statueFrame);

// ════ 다리 장인 인형 ════ 돌다리를 고치던 청동 관절 인형. 둥근 머리통 · 앞치마 · 큰 망치 · 태엽 열쇠
//   p: bob · ham 망치 각(0 어깨에 메기 ~ 1 머리 위 ~ 2 내려침) · legs · key 태엽 돌기 · hurt
function masonFrame(p = {}) {
  const W = 46, H = 42, G = H - 1, C = board(W, H);
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, hm = p.ham ?? 0;
  const hip = [20, 30 + b];
  // 다리 (막대 관절)
  for (const [o, far] of [[g.f, 1], [g.n, 0]]) {
    const ft = [hip[0] + o[0] + (far ? -2 : 2), G - 2 - o[1]];
    const K = ik([hip[0] + (far ? -2 : 2), hip[1]], ft, 6, 6, 1);
    C.part(U(capF([hip[0] + (far ? -2 : 2), hip[1]], K, 1.6, 1.4), capF(K, ft, 1.4, 1.2)), far ? BRONZEF : BRONZE, { shine: !far });
    C.part(ellR(K[0], K[1], 1.8, 1.8), far ? BRONZEF : BRONZE, { sep: !1 });
    C.part(polyF([[ft[0] - 2.5, ft[1]], [ft[0] + 3.5, ft[1]], [ft[0] + 3.5, ft[1] + 2.5], [ft[0] - 2.5, ft[1] + 2.5]]), WOODP, { shine: !far });
  }
  // 태엽 열쇠 (등)
  const kr = p.key ?? 0;
  C.part(capF([13, 22 + b], [8, 22 + b], 1, 1), BRONZEF);
  C.part(U(ellR(7, 19.5 + b + Math.sin(kr) * 1, 2, 2.6), ellR(7, 24.5 + b - Math.sin(kr) * 1, 2, 2.6)), BRONZE, { shine: 1 });
  // 몸통 (둥근 통) + 앞치마
  C.part(ellR(20, 23 + b, 7.5, 8.5), BRONZE, { shine: 1 });
  C.part(polyF([[15, 21 + b], [25, 21 + b], [26, 31 + b], [14, 31 + b]]), CLOTH, { shine: 1, flat: 0.5 });
  strokes(C, [[15, 21 + b, 25, 21 + b]], CLOTH[2]);
  C.part(ellR(20, 26 + b, 2.6, 1.8), ramp(0x6a4030), { sep: !1 }); // 주머니
  dots(C, [[18, 17 + b], [22, 17 + b]], BRONZE[6]); // 리벳
  // 머리 (둥근 통 + 렌즈 눈 하나 + 입 격자)
  C.part(ellR(22, 9.5 + b, 6.5, 6), BRONZE, { shine: 1 });
  C.part(ellR(25, 9 + b, 2.6, 2.6), ramp(0x30383e), { sep: !1 });
  C.over(25, 9 + b, p.hurt ? 0x30383e : 0xffc860).over(26, 8 + b, 0xffffff);
  strokes(C, [[20, 13 + b, 26, 13 + b]], BRONZE[1]);
  dots(C, [[21, 13 + b], [23, 13 + b], [25, 13 + b]], BRONZE[4]);
  C.part(ellR(22, 3.4 + b, 3.4, 1.6), STONED, { sep: !1 }); // 돌가루 모자
  // 망치 (앞 팔)
  const sh = [24, 19 + b], a = -2.2 + hm * 1.6;
  const hand = pol(sh, a + 0.7, 7), tip = pol(hand, a, 14);
  C.part(capF(sh, hand, 1.8, 1.6), BRONZE, { shine: 1 });
  C.part(capF(pol(hand, a, -3), tip, 1, 1), WOODP, { shine: 1 });
  const hh = tip, ha = a + Math.PI / 2;
  C.part(polyF([pol(pol(hh, ha, 4.5), a, 2.5), pol(pol(hh, ha, -4.5), a, 2.5), pol(pol(hh, ha, -4.5), a, -2.5), pol(pol(hh, ha, 4.5), a, -2.5)]), STONED, { shine: 1, flat: 0.6 });
  C.part(ellR(hand[0], hand[1], 1.9, 1.9), BRONZE, { sep: !1, shine: 1 });
  return done(C, p);
}
export const pxMason = spec(46, 42, 14, 24,
  { idle: [4, 6], move: [8, 12], wind: [4, 10, !1], atk: [3, 18, !1], rec: [3, 10, !1], hurt: [2, 10, !1], pound: [6, 14, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "idle") return { bob: Math.sin(ph) * 0.4, key: ph, ham: 0.1 };
    if (nm === "move") { const g = gait2(f, n, 3, 2); return { legs: g, bob: g.bob, key: ph * 2, ham: 0.15 }; }
    if (nm === "wind") return { ham: 0.2 + 0.9 * t, bob: -0.5 * t, key: t * 6 };
    if (nm === "atk") return { ham: [1.6, 2, 2.1][f], bob: 1 };
    if (nm === "rec") return { ham: 2 - 1.8 * t };
    if (nm === "pound") return { ham: f % 2 ? 2.1 : 1, bob: f % 2 ? 1 : 0, key: f };
    return { hurt: f === 0, ham: 0.4, bob: 0.5 };
  }, masonFrame);

// ════ [정예] 석조 수문장 ════ (큰 몬스터 조각 도구) 거대한 돌 기사. 탑 방패(룬) · 돌 철퇴 · 투구 틈으로 빛나는 눈 · 이끼 망토
//   p: bob · step · shield 방패 내밀기(0~1) · mace 철퇴(0 내림 ~ 1 위 ~ 2 내려침) · crouch · hurt
const WDK = 0.7;
const WD_ST = mat(ramp(0xb4aa96), { tex: "stone", amp: 0.7 }), WD_STF = mat(rampF(0x9a907c), { tex: "stone", amp: 0.6 }), WD_STD = mat(ramp(0x8a8070), { tex: "stone", amp: 0.8 });
const WD_MOSS = mat(ramp(0x5a8a3a), { tex: "fur", amp: 1, dir: 1.5 }), WD_BR = mat(ramp(0xb08446), { spec: 0.5 }), WD_RUNE = mat(rampGlow(0x6ae0ff));
function wardenFrame(p = {}) {
  const W = 106, H = 100, G = H - 1, S = sculpt(W, H, { k: p.k ?? WDK, ax: 50 });
  const b = (p.bob ?? 0) + (p.crouch ?? 0) * 5, st = p.step ?? 0, sd = p.shield ?? 0, mc = p.mace ?? 0;
  // 이끼 망토 (등 뒤로 늘어짐, 끝단 너덜)
  S.add(polyF([[30, 30 + b], [52, 28 + b], [50, 80 + b], [46, 84 + b], [42, 80 + b], [37, 86 + b], [33, 80 + b], [24, 74 + b]]), WD_MOSS, { z: -6, h: 4 });
  // 먼 팔 + 돌 철퇴 (가시 여섯)
  const shB = [36, 36 + b], ma = -2.6 + mc * 1.5, elB = pol(shB, ma + 0.9, 14), mt = pol(elB, ma, 30);
  S.add(capF(shB, elB, 6, 5), WD_STF, { z: -4, h: 5 });
  S.add(capF(elB, mt, 2.2, 2.2), WD_BR, { z: -3, h: 2 });
  S.add(ellR(mt[0], mt[1], 8.5, 8.5), WD_STD, { z: -2, h: 8 });
  for (let k = 0; k < 6; k++) { const a = k * 1.047 + mc; S.add(capF(pol(mt, a, 7), pol(mt, a, 13), 2.2, 0.6), WD_STD, { z: -1, h: 2 }); }
  // 다리: 두꺼운 돌기둥 + 무릎 판 + 발판
  for (const [x, far, sg] of [[42, 1, -st], [60, 0, st]]) {
    const top = [x, 64 + b], ft = [x + sg, G - 4 - Math.max(0, sg) * 0.8], M0 = far ? WD_STF : WD_ST, M1 = far ? WD_STF : WD_STD;
    S.add(capF(top, ft, 9, 8), M0, { z: far ? -2 : 3, h: 8, prof: "flat" });
    S.add(ellR(x + sg * 0.5, 77 + b, 6, 4.5), M1, { z: far ? -1 : 5, h: 3 });
    S.add(polyF([[ft[0] - 9, ft[1] - 3], [ft[0] + 11, ft[1] - 3], [ft[0] + 12, G + 0.5], [ft[0] - 9, G + 0.5]]), M1, { z: far ? -1 : 5, h: 3 });
  }
  // 몸통: 갑옷 판 · 가슴 판 볼록 · 판 이음 홈 · 놋쇠 리벳 · 허리띠와 룬 버클
  S.add(polyF([[34, 28 + b], [68, 28 + b], [66, 66 + b], [36, 66 + b]]), WD_ST, { z: 0, h: 15, prof: "flat" });
  S.add(ellR(51, 40 + b, 13, 9), WD_ST, { blend: 4, h: 4 });
  S.carve(capF([37, 50 + b], [65, 50 + b], 0.8), 1.4).carve(capF([51, 30 + b], [51, 60 + b], 0.7), 1.1);
  for (const [x, y] of [[40, 34], [62, 34], [40, 56], [62, 56]]) S.add(ellR(x, y + b, 1.3, 1.3), WD_BR, { on: 1, h: 0.9 });
  S.add(polyF([[35, 60 + b], [67, 60 + b], [67, 65 + b], [35, 65 + b]]), WD_BR, { on: 1, h: 1.6, lift: 1 });
  S.add(ellR(51, 62.5 + b, 3, 2.6), WD_RUNE, { on: 1, h: 1.2, lift: 1 });
  // 어깨판 둘 + 이끼
  S.add(ellR(36, 30 + b, 9, 7), WD_STD, { lift: 4, h: 6 });
  S.add(ellR(66, 31 + b, 8, 6.5), WD_STD, { lift: 3, h: 5 });
  S.add(ellR(35, 25 + b, 6, 2.6), WD_MOSS, { on: 1, h: 1.4 });
  // 투구: 네모 투구 · 이끼 볏 · 눈 틈(빛나는 두 눈) · 턱 이음
  S.add(polyF([[42, 6 + b], [62, 6 + b], [64, 26 + b], [40, 26 + b]]), WD_ST, { lift: 3, h: 11, prof: "flat" });
  S.add(capF([52, 1 + b], [52, 10 + b], 3, 2.6), WD_MOSS, { h: 3, lift: 6 });
  S.carve(capF([47, 15 + b], [63, 15 + b], 1.1), 3, !1);
  if (!p.block && !p.hurt) for (const x of [55, 56, 59, 60]) S.decal(x, 15 + b, x % 2 ? 0x7af0ff : 0xd0faff);
  S.carve(capF([44, 21 + b], [62, 21 + b], 0.5), 1);
  // 탑 방패 (가까운 손, 내밀면 앞으로): 테두리 단 · 놋쇠 판 · 룬 십자 · 방패 쥔 주먹
  const sx = 66 + sd * 10;
  S.add(polyF([[sx, 24 + b], [sx + 16, 27 + b], [sx + 16, 70 + b], [sx + 8, 78 + b], [sx, 70 + b]]), WD_ST, { z: 14, h: 6, prof: "flat" });
  S.add(polyF([[sx + 2, 29 + b], [sx + 14, 31 + b], [sx + 14, 68 + b], [sx + 8, 74 + b], [sx + 2, 68 + b]]), WD_ST, { blend: 2, h: 1.6 });
  S.add(polyF([[sx + 5, 40 + b], [sx + 12, 41 + b], [sx + 12, 56 + b], [sx + 5, 56 + b]]), WD_BR, { on: 1, h: 1.2 });
  S.add(capF([sx + 8.5, 42 + b], [sx + 8.5, 54 + b], 0.9), WD_RUNE, { on: 1, h: 1, lift: 0.8 });
  S.add(capF([sx + 6, 47 + b], [sx + 11, 47 + b], 0.9), WD_RUNE, { on: 1, h: 1, lift: 0.8 });
  S.add(ellR(sx + 1, 46 + b, 3.4, 3.4), WD_ST, { z: 16, h: 3 });
  const C = S.render({ debug: p.debug, rim: !p.block });
  return p.hurt ? flash(C) : C;
}
export const pxWarden = {
  fw: Math.round(106 * WDK), fh: Math.round(100 * WDK), w: 30, h: 46,
  anims: { idle: [4, 5], move: [6, 7], guard: [2, 6], bash: [3, 14, !1], wind: [4, 9, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], jump: [3, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = {};
    if (nm === "idle") P = { bob: Math.sin(ph) * 0.5, shield: 0.1 };
    if (nm === "move") P = { step: Math.sin(ph) * 4, bob: -Math.abs(Math.sin(ph)) * 1.4, shield: 0.2 };
    if (nm === "guard") P = { shield: 0.6, crouch: 0.3 };
    if (nm === "bash") P = { shield: [0.2, 1.2, 1][f], step: 3, crouch: 0.2 };
    if (nm === "wind") P = { mace: 1.1 * t, crouch: 0.6 * t, shield: 0.2 };
    if (nm === "jump") P = { mace: 1.1, crouch: -0.3, step: 2 };
    if (nm === "atk") P = { mace: [1.6, 2, 2.1][f], crouch: 0.7, shield: 0.3 };
    if (nm === "rec") P = { mace: 2 - 1.8 * t, crouch: 0.6 * (1 - t) };
    if (nm === "hurt") P = { hurt: f === 0, crouch: 0.2 };
    return wardenFrame(P);
  },
};

// ════ 바위 원숭이 ════ 회색 털 · 돌처럼 굳은 손 · 긴 꼬리. 턱을 뛰어다니며 바위를 던진다
//   p: bob · legs · arm 던지는 팔(0~1) · rock 손에 돌 · crouch · tail · jaw · hurt
const MK = ramp(0x8a8478), MKF = rampF(0x76706a), MKS = ramp(0xd0a890);
function monkeyFrame(p = {}) {
  const W = 46, H = 42, G = H - 1, C = board(W, H);
  const b = (p.bob ?? 0) + (p.crouch ?? 0) * 3, g = p.legs ?? { n: [0, 0], f: [0, 0] }, ar = p.arm ?? 0, tw = p.tail ?? 0;
  // 꼬리 (말려 올라감)
  const t0 = [14, 28 + b], t1 = [6, 26 + b - tw * 2], t2 = [4, 18 + b - tw * 3], t3 = [8, 14 + b - tw * 2];
  C.part(U(capF(t0, t1, 2, 1.6), capF(t1, t2, 1.6, 1.4), capF(t2, t3, 1.4, 1)), MK, { shine: 1 });
  // 뒷다리
  for (const [o, far] of [[g.f, 1], [g.n, 0]]) {
    const hp = [18 + (far ? -2 : 1), 30 + b], ft = [hp[0] + o[0] + 3, G - 1.5 - o[1]];
    limb(C, hp, ft, 6.5, 6, 1, far ? 2.8 : 3.2, 2, far ? MKF : MK, { shine: !far });
    C.part(ellR(ft[0] + 1.5, ft[1] + 0.5, 3, 1.4), far ? STONEF : STONED, { sep: !1 });
  }
  // 먼 팔 (주먹 짚기)
  C.part(capF([26, 21 + b], [29, G - 2], 2.2, 2), MKF);
  C.part(ellR(29.5, G - 1.5, 2.6, 2), STONEF, { sep: !1 });
  // 몸통 (구부정)
  C.part(U(ellR(22, 24 + b, 8.5, 8), ellR(28, 18 + b, 6.5, 6)), MK, { shine: 1 });
  C.part(ellR(25, 25 + b, 4, 5), MKS, { sep: !1, lv: -0.05 });
  // 머리: 하얀 얼굴 털 + 분홍 얼굴
  const hx = 33, hy = 12 + b;
  C.part(ellR(hx, hy, 6.4, 6), MK, { shine: 1 });
  C.part(ellR(hx + 2.2, hy + 1, 4, 4.2), MKS, { shine: 1, sep: !1 });
  C.part(ellR(hx - 5, hy - 0.5, 2, 2.6), MKS, { sep: !1 }); // 귀
  p.hurt ? strokes(C, [[hx + 1, hy - 0.5, hx + 4, hy - 0.5]], MKS[1]) : (C.over(hx + 2, hy - 0.5, 0x2a1810), C.over(hx + 4.2, hy - 0.5, 0x2a1810), C.over(hx + 2.5, hy - 1.3, 0xffffff));
  strokes(C, [[hx + 2, hy + 3 + (p.jaw ?? 0), hx + 5, hy + 2.6 + (p.jaw ?? 0)]], 0x4a1a1a);
  dots(C, [[hx - 2, hy - 5.5], [hx, hy - 6], [hx + 2, hy - 5.6]], MK[2]);
  // 가까운 팔: 던지기 (뒤로 젖혔다 앞으로)
  const sh = [29, 19 + b], hand = ar > 0.5 ? pol(sh, -2.4 + (ar - 0.5) * 4, 11) : pol(sh, 1.2 - ar * 2, 10);
  C.part(capF(sh, hand, 2.4, 2), MK, { shine: 1 });
  C.part(ellR(hand[0], hand[1], 2.8, 2.6), STONED, { shine: 1, sep: !1 });
  p.rock && C.part(ellR(hand[0], hand[1] - 3, 3.4, 3), STONE, { shine: 1, sep: !1 });
  return done(C, p);
}
export const pxMonkey = spec(46, 42, 16, 22,
  { idle: [6, 8], move: [6, 14], wind: [3, 10, !1], atk: [3, 18, !1], rec: [3, 10, !1], hurt: [2, 10, !1], throw: [5, 14, !1], leap: [4, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "idle") return { bob: Math.sin(ph) * 0.4, tail: Math.sin(ph), jaw: f === 3 ? 1 : 0 };
    if (nm === "move") { const g = gait2(f, n, 4, 2.5); return { legs: g, bob: g.bob, tail: Math.sin(ph) * 1.5, arm: 0.2 }; }
    if (nm === "wind") return { crouch: t, arm: 0.1, jaw: 1 };
    if (nm === "atk") return { arm: 0.25 + f * 0.1, bob: -1, jaw: 1.2, legs: { n: [4, 1], f: [-2, 0] } };
    if (nm === "rec") return { crouch: 1 - t };
    if (nm === "throw") return [{ arm: 0.6, rock: 1, crouch: 0.3 }, { arm: 0.8, rock: 1, crouch: 0.5, jaw: 1 }, { arm: 0.9, rock: 1, crouch: 0.4 }, { arm: 1.2, jaw: 1.2 }, { arm: 0.4 }][f];
    if (nm === "leap") return [{ crouch: 1 }, { bob: -2, tail: 2, legs: { n: [3, 4], f: [-3, 4] } }, { bob: -1, tail: 2, legs: { n: [3, 3], f: [-2, 3] } }, { crouch: 0.6 }][f];
    return { hurt: f === 0, crouch: 0.4, jaw: 1 };
  }, monkeyFrame);

// ════ 항아리 미믹 ════ 깨진 항아리인 척. 깨어나면 금 간 틈이 입이 되어 이빨과 혀가 드러나고, 아래로 작은 다리가 나온다
//   p: open 입 벌림(0~1.4) · legs 다리(0 숨김 ~ 1) · tilt 기울기 · hop 뜀 · hurt
const CLAY = ramp(0xb87650), CLAYD = ramp(0x8a5236);
function jarFrame(p = {}) {
  const W = 38, H = 40, G = H - 1, C = board(W, H);
  const op = p.open ?? 0, lgs = p.legs ?? 0, hp = (p.hop ?? 0) * 4;
  const R = rot([19, 26], p.tilt ?? 0), Pp = (x, y) => R([x, y - hp]);
  // 다리
  if (lgs > 0) for (const [x, far] of [[13, 1], [24, 0]]) C.part(capF(Pp(x, 32), Pp(x + 1, 32 + lgs * 6), 1.4, 1.1), far ? rampF(0x6a4a3a) : ramp(0x6a4a3a), { shine: !far });
  const base = lgs > 0 ? 0 : 6;
  const T = (x, y) => Pp(x, y + base);
  // 아랫몸 (둥근 단지)
  C.part(U(ellR(...T(19, 22), 11, 10), polyF([T(13, 30), T(25, 30), T(23, 33), T(15, 33)])), CLAY, { shine: 1 });
  strokes(C, [[...T(10, 20), ...T(28, 20)], [...T(9.5, 24), ...T(28.5, 24)]], CLAYD[3]);
  dots(C, [T(13, 22), T(17, 22), T(21, 22), T(25, 22)], CLAYD[5]);
  // 입 (벌어진 틈): 위 뚜껑 부분이 뒤로 젖혀진다
  const Rl = rot(T(10, 14), -op * 0.7), Qd = (x, y) => Rl(T(x, y));
  if (op > 0.1) {
    C.part(polyF([T(10, 15), T(28, 15), T(27, 15 + op * 4), T(11, 15 + op * 4)]), ramp(0x4a1418), { sep: !1 });
    for (let k = 0; k < 5; k++) C.part(polyF([T(12 + k * 3.4, 15), T(13.6 + k * 3.4, 15), T(12.8 + k * 3.4, 17.6)]), ramp(0xf0e8d0), { sep: !1 });
    C.part(capF(T(18, 18 + op * 3), T(24 + op * 3, 17 + op * 3), 1.6, 1.1), ramp(0xd8607a), { sep: !1 });
  }
  // 윗몸 + 목 + 뚜껑 (젖혀짐)
  C.part(U(ellR(...Qd(19, 12), 9.5, 4.6), polyF([Qd(14, 9), Qd(24, 9), Qd(23, 4), Qd(15, 4)])), CLAY, { shine: 1 });
  C.part(ellR(...Qd(19, 3.2), 5.6, 1.8), CLAYD, { shine: 1, sep: !1 });
  strokes(C, [[...Qd(16, 6), ...Qd(18, 10)], [...Qd(18, 10), ...Qd(16.5, 13)]], CLAYD[1]); // 금
  // 눈 (깨어났을 때 틈 위)
  op > 0.1 && !p.hurt && (C.over(...Qd(15, 12.5), 0xffd040), C.over(...Qd(22, 12.5), 0xffd040), C.over(...Qd(15.6, 12), 0xffffff));
  return done(C, p);
}
export const pxJar = spec(38, 40, 18, 24,
  { hide: [1, 1], wake: [4, 12, !1], idle: [4, 8], move: [6, 12], wind: [3, 12, !1], atk: [3, 18, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    if (nm === "hide") return {};
    if (nm === "wake") return { legs: t, open: t * 0.8, tilt: Math.sin(t * 9) * 0.15 };
    if (nm === "idle") return { legs: 1, open: 0.4 + 0.2 * Math.sin((f / n) * T2), tilt: Math.sin((f / n) * T2) * 0.06 };
    if (nm === "move") return { legs: 1, open: 0.5, hop: Math.abs(Math.sin((f / n) * Math.PI)), tilt: 0.1 };
    if (nm === "wind") return { legs: 1, open: 0.2, tilt: -0.25 * t };
    if (nm === "atk") return { legs: 1, open: [1, 1.4, 1.3][f], tilt: 0.25, hop: f === 1 ? 0.6 : 0.2 };
    if (nm === "rec") return { legs: 1, open: 1.2 - t * 0.7 };
    return { hurt: f === 0, legs: 1, open: 0.8, tilt: -0.2 };
  }, jarFrame);

// ════ 칼날 제비 ════ 강철빛 날개 끝이 칼날처럼 날카로운 제비. 날개를 접고 일직선으로 꿰뚫는다
//   p: flap(-1~1) · tuck 접기(0~1) · tilt · hurt
const SW = ramp(0x3a4a6a), SWB = ramp(0xe8e0d0), BLADE = ramp(0xb8c8d8), SWR = ramp(0xc84030);
function swallowFrame(p = {}) {
  const W = 46, H = 32, C = board(W, H);
  const fl = p.flap ?? 0, tk = p.tuck ?? 0, R = rot([22, 16], p.tilt ?? 0), P = (x, y) => R([x, y]);
  const wing = (far) => {
    const root = P(22, 14), a = -2.0 - fl * 0.7 * (1 - tk) + tk * 0.9 + (far ? -0.25 : 0), len = 18 - tk * 6;
    const tip = pol(root, a, len), mid = pol(root, a + 0.25, len * 0.55);
    C.part(polyF([root, mid, tip, pol(root, a - 0.15, len * 0.5)]), far ? rampF(0x3a4a6a) : SW, { shine: !far });
    C.part(capF(lerp(root, tip, 0.55), tip, 1.1, 0.3), far ? rampF(0xb8c8d8) : BLADE, { sep: !1, shine: 1 });
  };
  wing(!0);
  // 꼬리 (갈라진)
  C.part(U(capF(P(14, 16), P(4, 13), 1.6, 0.4), capF(P(14, 17), P(5, 20), 1.6, 0.4)), SW, { shine: 1 });
  // 몸통 (방추형) + 흰 배
  C.part(ellR(...P(22, 16), 9, 4.2, p.tilt ?? 0), SW, { shine: 1 });
  C.part((x, y) => ellR(...P(23, 17.5), 7, 2.6, p.tilt ?? 0)(x, y), SWB, { sep: !1 });
  // 머리 + 붉은 목 + 부리
  C.part(ellR(...P(31, 14), 4.2, 3.8), SW, { shine: 1 });
  C.part(ellR(...P(32.5, 16.5), 2.4, 1.6), SWR, { sep: !1 });
  C.part(polyF([P(34.5, 13), P(39, 14.2), P(34.5, 15)]), BLADE, { shine: 1 });
  !p.hurt && (C.over(...P(32.5, 12.8), 0x101010), C.over(...P(33, 12.2), 0xffffff));
  wing(!1);
  return done(C, p);
}
export const pxSwallow = spec(46, 32, 18, 12,
  { idle: [4, 20], move: [4, 22], wind: [3, 12, !1], atk: [2, 16], rec: [3, 10, !1], hurt: [2, 12, !1] },
  (nm, f, n, t) => {
    const fl = [1, 0.3, -1, 0.3][f % 4];
    if (nm === "wind") return { flap: fl, tuck: t * 0.5, tilt: -0.15 * t };
    if (nm === "atk") return { tuck: 1, tilt: 0.1 };
    if (nm === "rec") return { flap: fl, tuck: 1 - t };
    if (nm === "hurt") return { hurt: f === 0, flap: 0.5, tilt: -0.3 };
    return { flap: fl };
  }, swallowFrame, { flying: !0 });

// ════ [정예] 그리폰 ════ (큰 몬스터 조각 도구) 독수리 머리·앞발 + 사자 몸 · 큰 날개. 낚아채 높이 올라갔다 떨어뜨린다
//   p: flap · tilt · claw 앞발 뻗기(0~1) · beak 부리 벌림 · hurt
const GRK = 0.72;
const GR_FE = mat(ramp(0xe0d4b8), { tex: "fur", amp: 0.6, dir: 1.5 }), GR_FED = mat(ramp(0x8a6a40), { tex: "fur", amp: 0.8, dir: 0.5 }), GR_FEF = mat(rampF(0x8a6a40), { tex: "fur", amp: 0.7, dir: 0.5 });
const GR_LI = mat(ramp(0xc89a50), { tex: "fur", amp: 0.6, dir: 0.2 }), GR_LIF = mat(rampF(0xb08440), { tex: "fur", amp: 0.5, dir: 0.2 });
const GR_BK = mat(ramp(0xf0b830), { spec: 0.5 }), GR_BKF = mat(rampF(0xf0b830)), GR_TL = mat(ramp(0x3a2a20), { spec: 0.3 });
function griffinFrame(p = {}) {
  const W = 122, H = 100, S = sculpt(W, H, { k: p.k ?? GRK, ax: 60 });
  const fl = p.flap ?? 0, R = rot([60, 52], p.tilt ?? 0), P = (x, y) => R([x, y]), cl = p.claw ?? 0;
  // 날개: 어깨 → 손목 → 칼깃 일곱 (먼 쪽 먼저)
  const wing = (far) => {
    const root = P(54, 38), a = -1.95 - fl * 0.85 + (far ? -0.3 : 0), M0 = far ? GR_FEF : GR_FED;
    const wr = pol(root, a + 0.4, 22), tip = pol(root, a, 50);
    S.add(U(capF(root, wr, 7, 5), capF(wr, tip, 5, 2.4)), M0, { z: far ? -8 : 10, h: 4 });
    for (let k = 0; k < 7; k++) { const q = lerp(wr, tip, k / 7), fa = a + 1.65 - k * 0.06; S.add(capF(q, pol(q, fa, 19 - k * 1.3), 2.8, 0.9), k % 2 ? M0 : far ? GR_FEF : GR_FE, { z: far ? -9 : 9, h: 1.6 }); }
    S.add(capF(lerp(root, wr, 0.3), lerp(wr, tip, 0.35), 4, 3), far ? GR_FEF : GR_FE, { blend: 2, h: 1.2 });
  };
  wing(!0);
  // 사자 꼬리 (끝에 털뭉치)
  S.add(U(capF(P(30, 60), P(16, 66), 2.6, 2), capF(P(16, 66), P(10, 74), 2, 1.6)), GR_LI, { z: -2, h: 2 });
  S.add(ellR(...P(9, 76), 4, 4), GR_FED, { z: -2, h: 3 });
  // 뒷다리 (사자)
  for (const [x, far] of [[40, 1], [46, 0]]) { const h0 = P(x, 62), kn = P(x - 6, 70), ft = P(x - 2, 80); S.add(U(capF(h0, kn, far ? 6 : 7, 4.6), capF(kn, ft, 4.6, 3.4)), far ? GR_LIF : GR_LI, { z: far ? -4 : 4, h: 4 }); S.add(ellR(...P(x + 1, 81), 4.6, 2.6), far ? GR_LIF : GR_LI, { z: far ? -3 : 5, h: 2 }); }
  // 몸통 (사자) + 엉덩이 근육 + 배 홈
  S.add(ellR(...P(52, 58), 22, 13, -0.1), GR_LI, { z: 0, h: 12 });
  S.add(ellR(...P(40, 58), 10, 10), GR_LI, { blend: 4, h: 4 });
  S.carve(capF(P(44, 66), P(60, 67), 0.9), 1);
  // 깃털 가슴 (겹친 깃 줄)
  S.add(ellR(...P(70, 50), 12, 13), GR_FE, { blend: 5, h: 7 });
  for (let k = 0; k < 5; k++) S.carve(capF(P(64 + k * 2, 44 + k * 3), P(72 + k * 2, 46 + k * 3), 0.5), 0.7);
  // 머리 (독수리): 둥근 머리 · 귀깃 · 갈고리 부리 · 매서운 눈
  const hc = P(80, 34);
  S.add(ellR(hc[0], hc[1], 10, 9.5), GR_FE, { h: 9 });
  S.add(U(capF(P(72, 27), P(64, 20), 2.6, 0.8), capF(P(74, 26), P(68, 17), 2.2, 0.7)), GR_FED, { h: 2, lift: 3 });
  const bk = p.beak ?? 0;
  S.add(polyF([P(87, 30), P(99, 33), P(97, 38), P(88, 37)]), GR_BK, { h: 3.5, lift: 3 });
  S.add(polyF([P(97, 33), P(101, 36), P(97, 38)]), GR_TL, { h: 2, lift: 4 });
  bk > 0.2 && S.add(polyF([P(88, 38), P(96, 39 + bk * 3), P(89, 41 + bk)]), GR_BK, { h: 2, lift: 3 });
  if (!p.block && !p.hurt) { const e0 = P(84, 31); S.decal(e0[0], e0[1], 0xffc020).decal(e0[0] + 1, e0[1], 0x101010).decal(e0[0], e0[1] - 1, 0xffffff); }
  S.tone(capF(P(82, 28), P(88, 29), 1.2), -0.15);
  // 앞발 (독수리 발톱): 뻗으면 앞으로
  for (const [x, far] of [[64, 1], [72, 0]]) {
    const sh = P(x, 58), ft = cl > 0 ? P(x + 12 + cl * 8, 70 - cl * 6) : P(x + 2, 78);
    S.add(capF(sh, ft, far ? 3.4 : 4, 2.6), far ? GR_BKF : GR_BK, { z: far ? -2 : 8, h: 2.6 });
    for (const d of [-0.6, 0, 0.6]) S.add(capF(ft, pol(ft, 1.1 + d - cl * 0.7, 5), 1.3, 0.4), GR_TL, { z: far ? -1 : 9, h: 1.2 });
  }
  wing(!1);
  const C = S.render({ debug: p.debug, rim: !p.block });
  return p.hurt ? flash(C) : C;
}
export const pxGriffin = {
  fw: Math.round(122 * GRK), fh: Math.round(100 * GRK), w: 34, h: 30, flying: !0,
  anims: { idle: [4, 14], move: [4, 16], wind: [4, 10, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1], carry: [4, 16], gust: [5, 12, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), fl = [1, 0.3, -1, 0.3][f % 4];
    let P = { flap: fl };
    if (nm === "move") P = { flap: fl, tilt: 0.1 };
    if (nm === "wind") P = { flap: fl * 0.5, tilt: -0.2 * t, beak: t };
    if (nm === "atk") P = { flap: -1, tilt: 0.35, claw: 1, beak: 1 };
    if (nm === "carry") P = { flap: fl, claw: 0.6, tilt: -0.1 };
    if (nm === "gust") P = { flap: [1, 1, -1, -1, 0][f], tilt: -0.15, beak: 0.6 };
    if (nm === "rec") P = { flap: fl, tilt: 0.2 * (1 - t) };
    if (nm === "hurt") P = { hurt: f === 0, flap: 0.5, tilt: -0.25, beak: 1 };
    return griffinFrame(P);
  },
};

// ════ 룬 부유석 ════ 공중에 뜬 오벨리스크 조각. 가운데 룬이 빛나고 둘레를 작은 돌이 돈다. 쏠 때마다 룬이 번쩍
//   p: glow(0~1.5) · spin 주변 돌 위상 · crack 금 · hurt
function runeFrame(p = {}) {
  const W = 36, H = 44, C = board(W, H);
  const gl = p.glow ?? 0.6, sp = p.spin ?? 0;
  // 뒤쪽 돌
  for (let k = 0; k < 3; k++) { const a = sp + k * 2.09, x = 18 + Math.cos(a) * 14, y = 22 + Math.sin(a) * 4; Math.sin(a) < 0 && C.part(ellR(x, y, 2.2, 2), STONEF, { shine: 1 }); }
  // 몸 (길쭉한 팔각 석판)
  C.part(polyF([[13, 6], [23, 6], [26, 12], [25, 32], [21, 38], [15, 38], [11, 32], [10, 12]]), STONE, { shine: 1, flat: 0.5 });
  strokes(C, [[13, 6, 11, 32], [23, 6, 25, 32]], STONE[2]);
  p.crack && strokes(C, [[20, 10, 17, 18], [17, 18, 20, 26]], STONE[0]);
  // 룬 (빛)
  const rc = gl > 1 ? 0xffffff : mixc(0x4a7a90, 0x7af0ff, Math.min(1, gl));
  strokes(C, [[18, 13, 18, 31], [14.5, 17, 21.5, 17], [15, 24, 18, 27], [21, 24, 18, 27], [15, 30, 21, 30]], rc);
  gl > 0.8 && dots(C, [[17, 13], [19, 13], [18, 12]], 0xffffff);
  // 앞쪽 돌
  for (let k = 0; k < 3; k++) { const a = sp + k * 2.09, x = 18 + Math.cos(a) * 14, y = 22 + Math.sin(a) * 4; Math.sin(a) >= 0 && C.part(ellR(x, y, 2.4, 2.2), STONE, { shine: 1 }); }
  return done(C, p);
}
export const pxRune = spec(36, 44, 16, 30,
  { idle: [6, 10], move: [6, 12], wind: [4, 12, !1], atk: [2, 14, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "wind") return { glow: 0.6 + t * 0.9, spin: ph * 2 };
    if (nm === "atk") return { glow: 1.6, spin: ph };
    if (nm === "rec") return { glow: 1.2 - t * 0.6, spin: ph };
    if (nm === "hurt") return { hurt: f === 0, crack: 1, glow: 0.3 };
    return { glow: 0.5 + 0.2 * Math.sin(ph), spin: ph };
  }, runeFrame, { flying: !0 });

// ════ 가고일 ════ 석상처럼 웅크리고 앉아 있다가 날개를 펴고 덮친다. 뿔 · 송곳니 · 박쥐 날개 · 돌 발톱
//   p: perch(0~1 석상) · flap · claw · jaw · tilt · hurt
const GG = ramp(0x8a8a90), GGF = rampF(0x76767c);
function gargoyleFrame(p = {}) {
  const W = 54, H = 48, C = board(W, H);
  const pc = p.perch ?? 0, fl = p.flap ?? 0, R = rot([26, 26], p.tilt ?? 0), P = (x, y) => R([x, y]);
  const wing = (far) => {
    const root = P(22, 18), a = pc > 0.5 ? -2.6 : -2.1 - fl * 0.8 + (far ? -0.3 : 0), len = pc > 0.5 ? 12 : 22;
    const tip = pol(root, a, len), m1 = pol(root, a + 0.7, len * 0.8), m2 = pol(root, a + 1.3, len * 0.6);
    C.part(polyF([root, tip, lerp(tip, m1, 0.5), m1, lerp(m1, m2, 0.5), m2, P(26, 22)]), far ? GGF : GG, { shine: !far });
    C.part(capF(root, tip, 1.4, 0.6), far ? GGF : GG, { sep: !1 });
  };
  wing(!0);
  // 웅크린 다리 + 꼬리
  C.part(U(capF(P(16, 30), P(6, 34), 1.8, 1.2), polyF([P(5, 32), P(2, 35), P(6, 36)])), GG, { shine: 1 });
  for (const [x, far] of [[20, 1], [24, 0]]) { C.part(ellR(...P(x, 32), 4.2, 5), far ? GGF : GG, { shine: !far }); C.part(polyF([P(x - 2, 37), P(x + 5, 37), P(x + 6, 39), P(x - 2, 39)]), far ? GGF : GG, { sep: !1 }); }
  // 몸통 (웅크림 / 펼침)
  C.part(U(ellR(...P(24, 24), 8, 9)), GG, { shine: 1 });
  strokes(C, [[...P(20, 22), ...P(27, 22)], [...P(20, 26), ...P(27, 26)]], GG[2]);
  // 머리: 뿔 · 송곳니 · 이마 주름
  const hx = 31, hy = 13;
  C.part(U(ellR(...P(hx, hy), 6, 5.6), polyF([P(hx + 2, hy + 1), P(hx + 8, hy + 2), P(hx + 7, hy + 5 + (p.jaw ?? 0)), P(hx + 1, hy + 5)])), GG, { shine: 1, lv: 0.05 });
  C.part(U(capF(P(hx - 2, hy - 4), P(hx - 6, hy - 10), 1.6, 0.4), capF(P(hx + 1, hy - 5), P(hx + 1, hy - 11), 1.5, 0.4)), GGF, { sep: !1 });
  dots(C, [P(hx + 4, hy + 4.6), P(hx + 6, hy + 4.4)], 0xe8e0d0);
  const ec = pc > 0.5 ? GG[2] : 0xff5030;
  C.over(...P(hx + 3, hy), ec).over(...P(hx + 5, hy), ec);
  pc < 0.5 && C.over(...P(hx + 3, hy - 1), 0xffc0a0);
  // 앞 팔 (발톱)
  const cl = p.claw ?? 0, s = P(28, 20), hnd = pc > 0.5 ? P(30, 31) : pol(s, 1.2 - cl * 1.6, 9);
  C.part(capF(s, hnd, 2.2, 1.8), GG, { shine: 1 });
  for (const d of [-0.4, 0, 0.4]) C.part(capF(hnd, pol(hnd, 0.6 - cl * 1.2 + d, 3.4), 0.9, 0.3), STONED, { sep: !1 });
  wing(!1);
  return done(C, p);
}
export const pxGargoyle = spec(54, 48, 22, 24,
  { perch: [1, 1], wake: [4, 10, !1], idle: [4, 14], move: [4, 16], wind: [3, 10, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const fl = [1, 0.3, -1, 0.3][f % 4];
    if (nm === "perch") return { perch: 1 };
    if (nm === "wake") return { perch: 1 - t, flap: t > 0.5 ? 1 : 0, jaw: t };
    if (nm === "wind") return { flap: fl * 0.5, claw: -0.4 * t, tilt: -0.15 * t, jaw: t };
    if (nm === "atk") return { flap: -1, claw: 1, tilt: 0.35, jaw: 1 };
    if (nm === "rec") return { flap: fl, claw: 1 - t };
    if (nm === "hurt") return { hurt: f === 0, flap: 0.6, tilt: -0.25 };
    return { flap: fl };
  }, gargoyleFrame, { flying: !0 });

// ════ 옛 병사 망령 ════ 녹슨 투구와 갑옷 조각만 남은 유령 병사. 다리 대신 흩어지는 안개 꼬리, 녹슨 창
//   p: bob · spear 창 각(0 세움 ~ 1 겨눔 ~ 1.3 찌름) · thrust 앞으로 · fade 흐려짐 · hurt
const GHO = ramp(0x9ac8e0, { warm: 0xe8fff8 }), RUST = ramp(0x8a5a3a), IRONG = ramp(0x7a8a90);
function ghostFrame(p = {}) {
  const W = 50, H = 52, C = board(W, H);
  const b = p.bob ?? 0, sp = p.spear ?? 0, th = (p.thrust ?? 0) * 6;
  // 창 (뒤 손)
  const hand = [26 + th, 26 + b], a = -Math.PI / 2 + sp * 1.57, tip = pol(hand, a, 24), butt = pol(hand, a + Math.PI, 12);
  C.part(capF(butt, tip, 1, 1), ramp(0x6a4a30), { shine: 1 });
  C.part(polyF([pol(tip, a + 1.57, 2.2), pol(tip, a, 6), pol(tip, a - 1.57, 2.2)]), RUST, { shine: 1 });
  // 안개 꼬리 + 몸
  C.part(polyF([[18 + th, 24 + b], [32 + th, 24 + b], [30 + th, 36 + b], [27 + th, 46 + b], [22 + th, 50 + b], [20 + th, 42 + b], [15 + th, 36 + b]]), GHO, { shine: 1 });
  // 갑옷 조각 (가슴판·어깨판)
  C.part(polyF([[19 + th, 22 + b], [31 + th, 22 + b], [30 + th, 31 + b], [20 + th, 31 + b]]), IRONG, { shine: 1, flat: 0.5 });
  dots(C, [[22 + th, 25 + b], [27 + th, 28 + b]], RUST[4]);
  // 머리: 녹슨 투구 (얼굴 자리엔 빛나는 두 눈)
  const hx = 26 + th, hy = 14 + b;
  C.part(U(ellR(hx, hy, 6, 6.5), polyF([[hx - 6, hy], [hx + 6, hy], [hx + 7, hy + 6], [hx - 5, hy + 6]])), IRONG, { shine: 1 });
  C.part(capF([hx - 1, hy - 7], [hx - 7, hy - 9], 1.6, 0.6), ramp(0xa04040), { sep: !1 }); // 낡은 깃
  C.part(polyF([[hx + 1, hy - 1], [hx + 7, hy - 1], [hx + 7, hy + 2], [hx + 1, hy + 2]]), ramp(0x0e1a22), { sep: !1 });
  !p.hurt && (C.over(hx + 3, hy, 0xa0f8ff), C.over(hx + 5.5, hy, 0xa0f8ff));
  dots(C, [[hx - 2, hy + 3], [hx + 2, hy - 4]], RUST[3]);
  // 앞 팔 (안개 팔 + 쇠 장갑)
  const s = [hx + 2, hy + 10], w = pol(s, 0.6 - sp * 0.6, 8);
  C.part(capF(s, w, 2.2, 1.8), GHO, { shine: 1 });
  C.part(ellR(w[0], w[1], 2.2, 2), IRONG, { sep: !1, shine: 1 });
  // 흐림은 외곽선 다음에 (흐린 칸마다 외곽선이 생겨 검게 보이지 않게)
  C.selout();
  fade(C, 30 + b, 52);
  (p.fade ?? 0) > 0 && fade(C, 0, 52 / (p.fade + 0.01));
  return p.hurt ? flash(C) : C;
}
export const pxGhost = spec(50, 52, 16, 30,
  { idle: [6, 8], move: [6, 10], wind: [4, 10, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1], fade: [4, 12, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "idle") return { bob: Math.sin(ph) * 1.2, spear: 0.05 };
    if (nm === "move") return { bob: Math.sin(ph) * 1, spear: 0.4 };
    if (nm === "wind") return { spear: 0.4 + 0.6 * t, thrust: -0.5 * t, bob: -0.5 };
    if (nm === "atk") return { spear: 1, thrust: [0.8, 1.4, 1.3][f] };
    if (nm === "rec") return { spear: 1 - 0.6 * t, thrust: 1 - t };
    if (nm === "fade") return { fade: 0.3 + t * 2, bob: 1 };
    return { hurt: f === 0, bob: 1, spear: 0.2 };
  }, ghostFrame, { flying: !0 });

// ════ [정예] 번개 와이번 ════ (큰 몬스터 조각 도구) 청회색 비늘 · 날개가 곧 앞발 · 노란 번개 줄무늬 · 꼬리 가시. 번개 숨결을 내뿜는다
//   p: flap · tilt · jaw · breath 숨결 빛 · tail 꼬리 휘두르기 · hurt
const WVK = 0.72;
const WV_SC = mat(ramp(0x5a6a88), { tex: "skin", amp: 0.5 }), WV_SCF = mat(rampF(0x4e5a76), { tex: "skin", amp: 0.4 });
const WV_MEM = mat(ramp(0x7a8aa8), { tex: "skin", amp: 0.3 }), WV_MEMF = mat(rampF(0x6a7a98), { tex: "skin", amp: 0.3 });
const WV_BEL = mat(ramp(0xc8c0a0), { tex: "stone", amp: 0.3 }), WV_BOLT = mat(rampGlow(0xffe040)), WV_HORN = mat(ramp(0xd8d0b8), { spec: 0.4 });
function wyvernFrame(p = {}) {
  const W = 130, H = 114, S = sculpt(W, H, { k: p.k ?? WVK, ax: 62 });
  const fl = p.flap ?? 0, R = rot([62, 64], p.tilt ?? 0), P = (x, y) => R([x, y + 14]);
  // 날개 = 앞발: 어깨 → 팔꿈치 → 손목(갈고리) → 손가락 뼈 셋, 그 사이 막
  const wing = (far) => {
    const root = P(58, 40), a = -2.0 - fl * 0.9 + (far ? -0.3 : 0), MB = far ? WV_SCF : WV_SC, MM = far ? WV_MEMF : WV_MEM;
    const el = pol(root, a + 0.4, 19), wr = pol(el, a - 0.2, 17), f1 = pol(wr, a + 0.1, 26), f2 = pol(wr, a + 0.75, 22), f3 = pol(wr, a + 1.35, 17);
    S.add(polyF([root, el, wr, f1, lerp(f1, f2, 0.5), f2, lerp(f2, f3, 0.5), f3, P(66, 50)]), MM, { z: far ? -9 : 9, h: 1.4, prof: "flat" });
    S.add(U(capF(root, el, 4.4, 3.4), capF(el, wr, 3.4, 2.6)), MB, { z: far ? -8 : 10, h: 3 });
    for (const q of [f1, f2, f3]) S.add(capF(wr, q, 1.8, 0.7), MB, { z: far ? -8 : 10, h: 1.6 });
    S.add(capF(wr, pol(wr, a - 1.4, 5), 1.4, 0.4), WV_HORN, { z: far ? -7 : 11, h: 1.2 });
    !far && S.add(capF(lerp(root, el, 0.4), lerp(el, wr, 0.6), 1, 0.8), WV_BOLT, { on: 1, h: 0.8 });
  };
  wing(!0);
  // 꼬리 + 번개 가시
  const tw = p.tail ?? 0, t0 = P(40, 56), t1 = P(22, 62 + tw * 6), t2 = P(8, 56 + tw * 14);
  S.add(U(capF(t0, t1, 6, 3.8), capF(t1, t2, 3.8, 1.4)), WV_SC, { z: -2, h: 4 });
  S.add(polyF([pol(t2, 2.7, 4), pol(t2, 3.5, 10), pol(t2, 4.3, 4)]), WV_BOLT, { z: -1, h: 2 });
  // 뒷다리 + 발톱
  for (const [x, far] of [[48, 1], [54, 0]]) { const h0 = P(x, 58), kn = P(x + 6, 68), ft = P(x + 2, 78); S.add(U(capF(h0, kn, far ? 5 : 6, 4), capF(kn, ft, 4, 2.6)), far ? WV_SCF : WV_SC, { z: far ? -4 : 4, h: 3.6 }); for (const d of [-0.5, 0, 0.5]) S.add(capF(ft, pol(ft, 0.3 + d, 4.4), 1.1, 0.4), WV_HORN, { z: far ? -3 : 5, h: 1 }); }
  // 몸통 + 배 비늘 판
  S.add(ellR(...P(58, 52), 20, 12, -0.2), WV_SC, { z: 0, h: 12 });
  S.add(ellR(...P(60, 58), 15, 6, -0.2), WV_BEL, { on: 1, h: 2, lift: 0.6 });
  for (let k = 0; k < 5; k++) S.carve(capF(P(50 + k * 4.5, 55), P(51 + k * 4.5, 62), 0.5), 0.9);
  // 등 번개 줄무늬 (지그재그)
  for (const [x0, y0, x1, y1] of [[44, 46, 50, 43], [50, 43, 48, 48], [48, 48, 56, 44], [60, 42, 66, 40]]) S.add(capF(P(x0, y0), P(x1, y1), 0.9), WV_BOLT, { on: 1, h: 0.8, lift: 0.4 });
  // 목 + 머리 + 뿔 + 턱
  S.add(capF(P(70, 46), P(84, 30), 6.5, 5.2), WV_SC, { blend: 2, h: 5 });
  const hc = P(90, 26), jw = p.jaw ?? 0;
  S.add(U(ellR(hc[0], hc[1], 8, 6.4), polyF([P(90, 20), P(106, 24), P(105, 29), P(92, 31)])), WV_SC, { h: 7 });
  S.add(polyF([P(92, 31), P(104, 30 + jw * 3), P(101, 35 + jw * 4), P(91, 34)]), WV_SC, { h: 4, lift: 1 });
  jw > 0.3 && !p.block && (S.decal(...P(98, 31 + jw * 1.5), 0x6a1a2a), S.decal(...P(99, 32 + jw * 2), 0x6a1a2a));
  S.add(U(capF(P(86, 19), P(76, 8), 2, 0.5), capF(P(90, 18), P(84, 5), 1.8, 0.5)), WV_HORN, { h: 2, lift: 4 });
  S.carve(capF(P(94, 23), P(100, 24), 0.6), 1.4, !1);
  if (!p.block && !p.hurt) { const e0 = P(93, 22); S.decal(e0[0], e0[1], 0xfff060).decal(e0[0] + 1, e0[1], 0xffffff).decal(e0[0], e0[1] + 1, 0xc8a020); }
  (p.breath ?? 0) > 0 && S.add(ellR(...P(108, 30 + jw * 2), 4 * p.breath, 3 * p.breath), WV_BOLT, { z: 20, h: 2 });
  wing(!1);
  const C = S.render({ debug: p.debug, rim: !p.block });
  return p.hurt ? flash(C) : C;
}
export const pxWyvern = {
  fw: Math.round(130 * WVK), fh: Math.round(114 * WVK), w: 38, h: 30, flying: !0,
  anims: { idle: [4, 12], move: [4, 14], wind: [4, 10, !1], breath: [4, 16], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1], tail: [4, 14, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), fl = [1, 0.3, -1, 0.3][f % 4];
    let P = { flap: fl };
    if (nm === "move") P = { flap: fl, tilt: 0.12 };
    if (nm === "wind") P = { flap: fl * 0.5, tilt: -0.25 * t, jaw: 0.4 * t, breath: t * 0.8 };
    if (nm === "breath") P = { flap: fl * 0.4, tilt: 0.1, jaw: 1.2, breath: 1.4 + (f % 2) * 0.3 };
    if (nm === "atk") P = { flap: -1, tilt: 0.45, jaw: 1 };
    if (nm === "tail") P = { flap: fl, tail: [0, 1, 2, 1][f], tilt: -0.15 };
    if (nm === "rec") P = { flap: fl, tilt: 0.2 * (1 - t) };
    if (nm === "hurt") P = { hurt: f === 0, flap: 0.5, tilt: -0.25, jaw: 1 };
    return wyvernFrame(P);
  },
};
