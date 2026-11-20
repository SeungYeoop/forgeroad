// 아이언베인 몬스터 12종 (2D 픽셀 손그림, 오른쪽을 본다) — 거점 아래 지하 입문, 옛 갱도와 철 광맥
//   윗층(옛 갱도): 광석 쥐 떼 · 곡괭이 코볼트 · 램프 나방 · [정예] 코볼트 십장
//   가운데(광맥 굴): 쇠껍질 공벌레 · 녹 먹는 벌레 · 꼬마 광석 골렘 · [정예] 증기 굴착 기계
//   아랫층(깊은 광맥): 폭발 가스 버섯 · 유령 광부 · 수정 전갈 · [정예] 광산 웜
import { board, ellR, capF, polyF, U, minus, pol, lerp, ik, ramp, rampF, rampGlow, mixc, dots, strokes, rot, eye, glass, limb, gait4, gait2, flapOf, spec, done, flash, T2, L } from "./kit.js";
import { sculpt, mat } from "./px3.js";

const IRON = ramp(0x7a8088), IRONF = rampF(0x6a7078), RUST = ramp(0xb8642e), BRASS = ramp(0xc89a40), BRASSF = rampF(0xb08834);
const ORE = ramp(0x6a6460), LAMP = rampGlow(0xffc850), CRYS = rampGlow(0xb07aff), CRYC = rampGlow(0x6ae0f0);
const fade = (C, y0, y1) => { for (let y = 0; y < C.H; y++) { const t = (y - y0) / Math.max(1, y1 - y0); if (t <= 0) continue; for (let x = 0; x < C.W; x++) { const i = y * C.W + x; if (C.d[i] < 0) continue; if (((x * 7 + y * 13) % 8) / 8 < t) C.d[i] = -1; } } };

// ════ 광석 쥐 떼 ════ 등에 광석 부스러기가 박힌 쥐 셋. 떼로 몰려와 갉는다
//   p: run 위상 · spread · bite · hurt
const RAT = ramp(0x6a5a5a), RATF = rampF(0x5a4c4c), RATP = ramp(0xd88a8a);
function ratsFrame(p = {}) {
  const W = 48, H = 22, G = H - 1, C = board(W, H);
  const ph = p.run ?? 0, sp = p.spread ?? 0.5, bt = p.bite ?? 0;
  const rat = (x, far, k) => {
    const y = G - 4 - Math.abs(Math.sin(ph + k)) * 1.5, R0 = far ? RATF : RAT;
    C.part(capF([x - 6, y], [x - 12, y - 2 + Math.sin(ph * 2 + k)], 0.8, 0.4), RATP, { sep: !1 }); // 꼬리
    for (const d of [-3, 2]) C.part(capF([x + d, y + 1], [x + d + Math.sin(ph + k + d) * 2, G], 0.8, 0.6), R0, { sep: !1 });
    C.part(ellR(x - 1, y - 1, 6, 3.6), R0, { shine: !far });
    C.part(polyF([[x + 3, y - 3], [x + 9 + bt * 1.5, y - 0.5], [x + 3, y + 2]]), R0, { shine: !far });
    C.over(x + 9 + bt * 1.5, y - 0.5, RATP[4]);
    C.part(ellR(x + 3, y - 4, 1.4, 1.4), RATP, { sep: !1 });
    !p.hurt && C.over(x + 5, y - 2, 0xff4040);
    for (const dx of [-4, -1]) C.part(ellR(x + dx, y - 4, 1.2, 1), ORE, { sep: !1, shine: 1 });
    bt > 0.5 && C.over(x + 8, y + 0.5, 0xf0f0e0);
  };
  rat(14 + sp * -4, 1, 0), rat(36 + sp * 4, 1, 2), rat(25, 0, 1);
  return done(C, p);
}
export const pxRats = spec(48, 22, 26, 10,
  { idle: [4, 8], move: [6, 18], wind: [3, 12, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 12, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "move") return { run: ph * 2, spread: 0.5 };
    if (nm === "wind") return { spread: 0.5 - t * 0.5, run: t };
    if (nm === "atk") return { bite: 1, run: ph * 3, spread: 0 };
    if (nm === "rec") return { spread: t, bite: 0 };
    if (nm === "hurt") return { hurt: f === 0, spread: 1.4 };
    return { run: Math.sin(ph) * 0.3, spread: 0.5 };
  }, ratsFrame);

// ════ 곡괭이 코볼트 ════ 개 얼굴 비늘 코볼트. 광부 헬멧 등불 · 곡괭이. 휘두르고, 멀면 광석 덩이를 던진다
//   p: bob · legs · pick 곡괭이(0 메기 ~ 1 위 ~ 2 내려침) · ore 손에 광석 · hurt
const KOB = ramp(0xa85a3a), KOBF = rampF(0x904c30), HELM = ramp(0xc8a040);
function koboldFrame(p = {}) {
  const W = 46, H = 40, G = H - 1, C = board(W, H);
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, pk = p.pick ?? 0;
  // 꼬리
  C.part(capF([14, 26 + b], [5, 32 + b], 2, 0.8), KOB, { shine: 1 });
  for (const [o, far] of [[g.f, 1], [g.n, 0]]) { const hp = [18 + (far ? -1.5 : 1.5), 28 + b], ft = [hp[0] + o[0], G - 1 - o[1]]; limb(C, hp, ft, 5.4, 5.4, 1, far ? 2 : 2.4, 1.4, far ? KOBF : KOB, { shine: !far }); C.part(capF(ft, [ft[0] + 3, ft[1] + 0.5], 1.2, 0.8), far ? KOBF : KOB, { sep: !1 }); }
  // 몸 (조끼)
  C.part(ellR(19, 22 + b, 6, 7.4), KOB, { shine: 1 });
  C.part(polyF([[14, 18 + b], [24, 18 + b], [23, 27 + b], [15, 27 + b]]), ramp(0x5a4a3a), { shine: 1, sep: !1 });
  // 머리 (개 주둥이) + 헬멧 등불
  const hx = 25, hy = 12 + b;
  C.part(U(ellR(hx, hy, 5, 4.6), polyF([[hx + 2, hy - 1], [hx + 9, hy + 1], [hx + 8, hy + 3.4], [hx + 2, hy + 3.4]])), KOB, { shine: 1, lv: 0.05 });
  C.part(polyF([[hx - 5, hy - 2], [hx - 4, hy - 7], [hx + 4, hy - 7], [hx + 5, hy - 2]]), HELM, { shine: 1, flat: 0.6 });
  C.part(ellR(hx + 4.6, hy - 5, 1.8, 1.6), LAMP, { sep: !1 });
  !p.hurt && (C.over(hx + 2, hy - 0.5, 0xffe060), C.over(hx + 2.6, hy - 0.5, 0x101008));
  dots(C, [[hx + 6, hy + 3.6], [hx + 7.4, hy + 3.4]], 0xf0f0e0);
  // 곡괭이 (앞 팔)
  const s = [22, 18 + b], a = pk > 1 ? -0.2 + (pk - 1) * 1.6 : -2.4 + pk * 1.2, hand = pol(s, a + 1.2, 6), top = pol(hand, a, 14);
  C.part(capF(s, hand, 1.7, 1.5), KOB, { shine: 1 });
  C.part(capF(pol(hand, a, -3), top, 0.9, 0.9), ramp(0x7a5432), { shine: 1 });
  const ha = a + Math.PI / 2;
  C.part(U(capF(top, pol(pol(top, ha, 7), a, -2), 1.4, 0.4), capF(top, pol(top, ha, -5), 1.2, 0.6)), IRON, { shine: 1, sep: !1 });
  p.ore && C.part(ellR(14, 20 + b, 3, 2.6), ORE, { shine: 1, sep: !1 });
  return done(C, p);
}
export const pxKobold = spec(46, 40, 14, 22,
  { idle: [4, 6], move: [8, 14], wind: [3, 10, !1], atk: [3, 18, !1], rec: [3, 10, !1], hurt: [2, 10, !1], throw: [4, 12, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "idle") return { bob: Math.sin(ph) * 0.4, pick: 0.1 };
    if (nm === "move") { const g = gait2(f, n, 3.5, 2); return { legs: g, bob: g.bob, pick: 0.2 }; }
    if (nm === "wind") return { pick: 0.2 + 0.8 * t };
    if (nm === "atk") return { pick: [1.6, 2, 2.1][f], bob: 1 };
    if (nm === "rec") return { pick: 2 - 1.8 * t };
    if (nm === "throw") return { ore: f < 2 ? 1 : 0, pick: 0.1, bob: f === 2 ? 1 : 0 };
    return { hurt: f === 0, pick: 0.4 };
  }, koboldFrame);

// ════ 램프 나방 ════ 등불 빛에 몰려드는 나방. 날개 무늬가 불꽃 같고, 몸으로 부딪치면 불이 붙는다
//   p: flap · glow 몸에 붙은 불씨 · hurt
const LMOTH = ramp(0x8a6a4a), FLAMEW = ramp(0xe88a3a);
function lampMothFrame(p = {}) {
  const W = 40, H = 34, C = board(W, H);
  const fl = p.flap ?? 0;
  const wing = (far, up) => { const root = [20, 16], a = (up ? -2.1 : 2.6) + (up ? -fl * 0.8 : fl * 0.4) + (far ? -0.3 : 0), len = up ? 15 : 10; const tip = pol(root, a, len), s1 = pol(root, a + (up ? 0.8 : -0.8), len * 0.8); C.part(polyF([root, tip, s1]), far ? rampF(0x8a6a4a) : up ? FLAMEW : LMOTH, { shine: !far }); !far && up && C.part(ellR(...lerp(root, lerp(tip, s1, 0.5), 0.55), 2, 1.6), LAMP, { sep: !1 }); };
  wing(!0, !0), wing(!0, !1);
  C.part(ellR(21, 18, 3.4, 7, -0.3), LMOTH, { shine: 1 });
  C.part(ellR(24, 10, 3, 2.8), LMOTH, { shine: 1 });
  !p.hurt && C.over(25.4, 9.6, 0xfff0a0);
  strokes(C, [[24, 8, 27, 3], [23, 8, 22, 2]], LMOTH[2]);
  wing(!1, !0), wing(!1, !1);
  (p.glow ?? 0) > 0 && dots(C, [[16, 24], [22, 26], [26, 22]], 0xffd060);
  return done(C, p);
}
export const pxLampMoth = spec(40, 34, 16, 14,
  { idle: [4, 16], move: [4, 18], wind: [3, 10, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const fl = [1, 0.3, -1, 0.3][f % 4];
    if (nm === "wind") return { flap: fl, glow: t };
    if (nm === "atk") return { flap: -1, glow: 1 };
    if (nm === "hurt") return { hurt: f === 0, flap: 0.6 };
    return { flap: fl };
  }, lampMothFrame, { flying: !0 });

// ════ [정예] 코볼트 십장 ════ (큰 몬스터 조각 도구) 덩치 큰 코볼트 감독. 비늘 개 얼굴과 목 지느러미 · 등불 달린 광부 헬멧 · 가죽 앞치마와 멜빵 · 굵은 가죽 채찍 · 놋쇠 호루라기 · 등에 다이너마이트 꾸러미
//   p: bob · legs · whip 채찍(-1 뒤로 ~ 1 앞으로) · whistle · dyn 다이너마이트 들기 · hurt
const FMK = 0.7;
const FM_SC = mat(ramp(0x9a5234), { tex: "skin", amp: 0.6 }), FM_SCF = mat(ramp(0x7c422c, { cool: 0x1c2a40 }), { tex: "skin", amp: 0.5 }), FM_BEL = mat(ramp(0xd0a878), { tex: "skin", amp: 0.3 });
const FM_LTH = mat(ramp(0x8a6038), { tex: "leather", amp: 0.6 }), FM_STRAP = mat(ramp(0x4a3424), { tex: "leather", amp: 0.4 }), FM_HELM = mat(ramp(0xd0a440), { spec: 0.6 }), FM_LAMP = mat(rampGlow(0xffd060));
const FM_DYN = mat(ramp(0xc8402a), { tex: "cloth", amp: 0.3 }), FM_ROPE = mat(ramp(0xc8b080), { tex: "fur", amp: 0.5 }), FM_BRASS = mat(ramp(0xd8aa48), { spec: 0.8 }), FM_WHIP = ramp(0x5a3a24);
const FM_BOOT = mat(ramp(0x4a3a30), { tex: "leather", amp: 0.4 }), FM_HORN = mat(ramp(0xe0d0b0), { spec: 0.3 }), FM_FUSE = mat(ramp(0x2a2420));
function foremanFrame(p = {}) {
  const W = 112, H = 84, G = H - 1, S = sculpt(W, H, { k: p.k ?? FMK, ax: 48 });
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, wp = p.whip ?? 0, dy = p.dyn ?? 0;
  // 다리: 짐승 다리(무릎 앞 · 발목 뒤) + 가죽 장화
  const leg = (o, far) => {
    const hip = [far ? 42 : 46, 62 + b], ft = [hip[0] + 2 + o[0], G - 3 - o[1]], kn = ik(hip, ft, 11, 12, -1), M0 = far ? FM_SCF : FM_SC;
    S.add(U(capF(hip, kn, far ? 5.6 : 6.4, 4.6), capF(kn, ft, 4.6, 4)), M0, { z: far ? -3 : 5, h: 5 });
    S.add(U(ellR(ft[0] + 2, ft[1] + 0.4, 6.6, 3), capF([ft[0] - 1, ft[1] - 6], [ft[0], ft[1]], 4.4)), FM_BOOT, { z: far ? -2.6 : 5.4, h: 3.4 });
    S.add(capF([ft[0] - 4, ft[1] - 5.5], [ft[0] + 4, ft[1] - 5.5], 1), FM_STRAP, { z: far ? -2.5 : 5.6, h: 1.2 });
  };
  leg(g.f, 1);
  // 꼬리 (비늘 · 끝으로 가늘게)
  S.add(U(capF([34, 62 + b], [16, 70 + b], 6.4, 3.8), capF([16, 70 + b], [4, 77 + b], 3.8, 1.2)), FM_SC, { z: -2, h: 4 });
  for (const x of [28, 22, 15]) S.carve(capF([x, 63 + b + (34 - x) * 0.4], [x - 1, 70 + b + (34 - x) * 0.4], 0.45), 0.5);
  // 등 다이너마이트 꾸러미 (빨간 막대 넷 · 밧줄 두 줄 · 심지)
  for (let k = 0; k < 4; k++) S.add(capF([21 + k * 3.4, 30 + b], [22 + k * 3.4, 50 + b], 1.9), FM_DYN, { z: -1.5, h: 2 });
  for (const y of [35, 45]) S.add(capF([19, y + b], [34, y + b], 1.1), FM_ROPE, { z: -1, h: 2.6 });
  S.add(U(capF([27, 30 + b], [25, 24 + b], 0.6), capF([25, 24 + b], [27, 20 + b], 0.6)), FM_FUSE, { z: -1, h: 0.6 });
  // 먼 팔: 허리에 손 / 다이너마이트 치켜들기 (불붙은 심지)
  const sF = [50, 32 + b], hF = dy ? [44, 8 + b] : [40, 48 + b], eF = ik(sF, hF, 10, 11, dy ? 1 : -1);
  S.add(U(capF(sF, eF, 4.2, 3.6), capF(eF, hF, 3.6, 3.2)), FM_SCF, { z: -2, h: 4 });
  if (dy) {
    S.add(capF([hF[0] - 1, hF[1] - 6], [hF[0] + 1, hF[1] + 5], 2.2), FM_DYN, { z: -1.4, h: 2.4 });
    S.add(capF([hF[0] - 1, hF[1] - 6], [hF[0] + 1, hF[1] - 10], 0.6), FM_FUSE, { z: -1.2, h: 0.6 });
    p.block || [[0, 0, 0xfff4a0], [1, -1, 0xffa030], [-1, -1, 0xffd060], [0, -2, 0xffffff]].forEach(([dx, dd, c]) => S.decal(hF[0] + 1 + dx, hF[1] - 11 + dd, c));
  }
  S.add(ellR(hF[0], hF[1], 3.6, 3.4), FM_SCF, { z: -1, h: 3 });
  // 몸 (불룩한 배) + 배 비늘 + 가죽 앞치마(주머니) + 멜빵
  S.add(U(ellR(46, 52 + b, 16, 14), ellR(50, 38 + b, 13, 10)), FM_SC, { z: 0, h: 14 });
  S.add(ellR(53, 50 + b, 9, 11), FM_BEL, { on: 1, h: 0.8 });
  for (const y of [42, 47, 52, 57]) S.carve(capF([47, y + b], [59, y + b], 0.4), 0.4);
  S.add(polyF([[40, 46 + b], [60, 45 + b], [63, 65 + b], [40, 66 + b]]), FM_LTH, { lift: 1, h: 1.6 });
  S.carve(U(capF([49, 53 + b], [57, 53 + b], 0.4), capF([49, 53 + b], [49, 59 + b], 0.4), capF([57, 53 + b], [57, 59 + b], 0.4)), 0.6);
  S.add(capF([52, 52 + b], [52, 47 + b], 0.9), FM_BRASS, { lift: 1.6, h: 1 });
  for (const x of [45, 57]) S.add(capF([x - 1, 29 + b], [x, 47 + b], 1.4), FM_STRAP, { lift: 0.8, h: 1.2 });
  for (const x of [45, 57]) S.add(ellR(x, 46.5 + b, 1.4, 1.2), FM_BRASS, { lift: 1.8, h: 1 });
  // 머리: 목 지느러미 · 작은 뿔 · 비늘 주둥이 · 송곳니 · 노란 눈(세로 동공) · 광부 헬멧과 등불
  const hx = 64, hy = 22 + b;
  S.add(polyF([[hx - 6, hy - 2], [hx - 16, hy - 7], [hx - 12, hy], [hx - 15, hy + 5], [hx - 6, hy + 5]]), FM_SC, { z: 3, h: 2.4 });
  S.add(capF([hx - 5, hy - 6], [hx - 13, hy - 11], 1.7, 0.6), FM_HORN, { z: 3.4, h: 1.6 });
  S.add(ellR(hx, hy, 9.4, 8.6), FM_SC, { z: 4, h: 8 });
  S.add(polyF([[hx + 3, hy - 2.6], [hx + 18, hy + 0.8], [hx + 18, hy + 4.6], [hx + 4, hy + 4.8]]), FM_SC, { z: 5, h: 6 });
  S.add(polyF([[hx + 2, hy + 4.4], [hx + 16, hy + 4.4], [hx + 14, hy + 8], [hx + 4, hy + 9.4]]), FM_BEL, { z: 5.4, h: 4 });
  S.add(capF([hx + 1, hy - 4.6], [hx + 9, hy - 3.6], 1.4, 1), FM_SC, { blend: 1, h: 1.3 });
  S.carve(ellR(hx + 17, hy + 1.6, 0.8, 0.6), 0.9, !1).carve(capF([hx + 4, hy + 4.6], [hx + 17.4, hy + 4.4], 0.5), 1, !1);
  S.add(polyF([[hx + 12, hy + 4.6], [hx + 14, hy + 4.6], [hx + 13, hy + 7.2]]), FM_HORN, { z: 6, h: 0.8 });
  if (!p.block && !p.hurt) { for (const [x, y] of [[5, -2], [6, -2], [5, -1], [6, -1]]) S.decal(hx + x, hy + y, 0xffe060); S.decal(hx + 5.6, hy - 2, 0x1a1008).decal(hx + 5.6, hy - 1, 0x1a1008); }
  S.add(polyF([[hx - 9, hy - 6], [hx - 8, hy - 13], [hx - 2, hy - 16.5], [hx + 6, hy - 15.5], [hx + 9.5, hy - 10], [hx + 10, hy - 6]]), FM_HELM, { lift: 3, h: 4 });
  S.add(capF([hx - 11, hy - 6], [hx + 12, hy - 5.6], 1.3), FM_HELM, { lift: 3.4, h: 1.4 });
  S.add(ellR(hx + 9, hy - 12, 3.4, 3.4), FM_BRASS, { lift: 4, h: 2.6 });
  S.add(ellR(hx + 9.6, hy - 12, 2.2, 2.2), FM_LAMP, { lift: 5, h: 1.6 });
  // 호루라기: 불 때는 입에, 아니면 가슴에 끈으로
  if ((p.whistle ?? 0) > 0) S.add(capF([hx + 15, hy + 4], [hx + 21, hy + 2.6], 1.4, 1.8), FM_BRASS, { z: 9, h: 1.8 });
  else (S.add(capF([hx - 3, hy + 6], [hx - 1, hy + 14], 0.4), FM_STRAP, { lift: 1, h: 0.4 }), S.add(capF([hx - 1.6, hy + 14.6], [hx + 1.6, hy + 14], 1.2, 1.4), FM_BRASS, { lift: 1.4, h: 1.2 }));
  leg(g.n, 0);
  // 가까운 팔 + 채찍 (손잡이 · 놋쇠 꼭지 · 마디 채찍끈)
  const s0 = [56, 34 + b], hd = pol(s0, 0.6 - wp * 0.9, 13), e0 = ik(s0, hd, 7, 7, 1);
  S.add(U(capF(s0, e0, 4.6, 3.8), capF(e0, hd, 3.8, 3.4)), FM_SC, { z: 8, h: 4.4 });
  const ba = wp >= 0 ? L(1.2, -0.4, wp) : L(1.2, -2.5, -wp), hdl = pol(hd, ba, 5);
  S.add(capF(pol(hd, ba + Math.PI, 1.6), hdl, 1.5, 1.3), FM_STRAP, { z: 9, h: 1.4 });
  S.add(ellR(...pol(hd, ba + Math.PI, 2), 1.4, 1.4), FM_BRASS, { z: 9.2, h: 1.4 });
  const pts = [hdl];
  for (let k = 1; k <= 8; k++) {
    const hang = 1.3 + Math.sin(k * 0.9) * 0.4, a = wp >= 0 ? L(hang, -0.25 + k * 0.1, wp) : L(hang, -2.3 - k * 0.14, -wp);
    pts.push(pol(pts[k - 1], a, wp > 0.5 ? 3.6 : 3.3));
  }
  const WM0 = mat(FM_WHIP, { tex: "leather", amp: 0.3 });
  for (let k = 1; k < pts.length; k++) S.add(capF(pts[k - 1], pts[k], 1.2 - k * 0.09, 1.1 - k * 0.09), WM0, { z: 9.4, h: 1 });
  S.add(ellR(hd[0], hd[1], 3.6, 3.4), FM_SC, { z: 9.6, h: 3 });
  const C = S.render({ debug: p.debug, rim: !p.block });
  return p.hurt ? flash(C) : C;
}
export const pxForeman = {
  fw: Math.round(112 * FMK), fh: Math.round(84 * FMK), w: 22, h: 34,
  anims: { idle: [4, 6], move: [8, 10], wind: [3, 10, !1], atk: [3, 18, !1], rec: [3, 10, !1], hurt: [2, 10, !1], whistle: [4, 10, !1], dyn: [4, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = {};
    if (nm === "idle") P = { bob: Math.sin(ph) * 0.4, whip: -0.1 };
    if (nm === "move") { const g = gait2(f, n, 4, 2.5); P = { legs: g, bob: g.bob, whip: -0.2 }; }
    if (nm === "wind") P = { whip: -t };
    if (nm === "atk") P = { whip: [0.4, 1, 1][f], bob: 1 };
    if (nm === "rec") P = { whip: 1 - t * 1.1 };
    if (nm === "whistle") P = { whistle: 1, bob: f % 2 ? 1 : 0 };
    if (nm === "dyn") P = { dyn: f < 3 ? 1 : 0, whip: -0.2 };
    if (nm === "hurt") P = { hurt: f === 0, whip: -0.4 };
    return foremanFrame(P);
  },
};

// ════ 쇠껍질 공벌레 ════ 쇠판 마디를 두른 커다란 공벌레. 몸을 말아 쇠공처럼 굴러 돌진 (말린 동안 단단함)
//   p: curl 말기(0~1) · roll 굴림 각 · legs · hurt
const PILL = ramp(0x6a7480), PILLF = rampF(0x5a6470);
function pillbugFrame(p = {}) {
  const W = 44, H = 30, G = H - 1, C = board(W, H);
  const cu = p.curl ?? 0, lp = p.legs ?? 0;
  if (cu > 0.6) {
    // 공 (마디 줄이 굴러 돈다)
    const cx = 22, cy = G - 11, r = 11, ro = p.roll ?? 0;
    C.part(ellR(cx, cy, r, r), PILL, { shine: 1 });
    for (let k = 0; k < 5; k++) { const a = ro + k * 0.63; strokes(C, [[cx + Math.cos(a) * r * 0.95, cy + Math.sin(a) * r * 0.95, cx - Math.cos(a) * r * 0.3, cy - Math.sin(a) * r * 0.3]], PILL[2]); }
    C.over(cx - 4, cy - 5, PILL[6]);
    return done(C, p);
  }
  for (let k = 0; k < 6; k++) for (const far of [1, 0]) { const s = [10 + k * 4.4, G - 6], f = pol(s, 1.6 + Math.sin(lp + k + far * 3) * 0.4, 5); C.part(capF(s, f, 0.8, 0.6), far ? PILLF : ramp(0x4a4a50), { sep: !1 }); }
  C.part(ellR(22, G - 8 - cu * 4, 15 - cu * 4, 7 + cu * 3), PILL, { shine: 1 });
  for (let k = 0; k < 6; k++) strokes(C, [[11 + k * 4.4, G - 14 - cu * 4, 11 + k * 4.4, G - 3]], PILL[2]);
  C.part(ellR(36, G - 6, 4, 3.4), PILLF, { shine: 1 });
  strokes(C, [[38, G - 8, 43, G - 11], [38, G - 7, 43, G - 6]], PILL[1]);
  return done(C, p);
}
export const pxPillbug = spec(44, 30, 24, 16,
  { idle: [4, 6], move: [6, 12], wind: [3, 10, !1], atk: [6, 24], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "move") return { legs: ph * 2 };
    if (nm === "wind") return { curl: t };
    if (nm === "atk") return { curl: 1, roll: ph };
    if (nm === "rec") return { curl: 1 - t };
    if (nm === "hurt") return { hurt: f === 0, curl: 0.3 };
    return { legs: Math.sin(ph) * 0.3 };
  }, pillbugFrame);

// ════ 녹 먹는 벌레 ════ 녹빛 껍질의 납작한 벌레. 더듬이를 흔들며 달라붙어 갑옷을 갉는다 (방어가 잠깐 깎임)
//   p: legs · ant 더듬이 · bite · hurt
function rustbugFrame(p = {}) {
  const W = 36, H = 20, G = H - 1, C = board(W, H);
  const lp = p.legs ?? 0, an = p.ant ?? 0, bt = p.bite ?? 0;
  for (let k = 0; k < 3; k++) for (const far of [1, 0]) { const s = [12 + k * 5, G - 4], f = pol(s, 1.5 + Math.sin(lp + k * 2 + far * 3) * 0.5, 4); C.part(capF(s, f, 0.7, 0.5), far ? rampF(0x6a3a20) : ramp(0x6a3a20), { sep: !1 }); }
  C.part(ellR(17, G - 6, 10, 4.6), RUST, { shine: 1 });
  for (const [x, y] of [[12, -8], [18, -9], [22, -6], [14, -5]]) C.part(ellR(x, G + y, 1.6, 1.2), ramp(0xd88a4a), { sep: !1, shine: 1 });
  C.part(ellR(28, G - 5, 3.6, 3), ramp(0x6a3a20), { shine: 1 });
  C.part(U(capF([30, G - 4], [33 + bt * 2, G - 3 - bt], 0.8, 0.4), capF([30, G - 3], [33 + bt * 2, G - 2 + bt], 0.8, 0.4)), ramp(0x2a1a10), { sep: !1 });
  strokes(C, [[29, G - 7, 34, G - 13 - an * 2], [28, G - 7, 30, G - 14 + an * 2]], ramp(0x6a3a20)[2]);
  !p.hurt && C.over(30, G - 6, 0xffe080);
  return done(C, p);
}
export const pxRustbug = spec(36, 20, 18, 8,
  { idle: [4, 8], move: [6, 16], wind: [3, 12, !1], atk: [4, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "move") return { legs: ph * 2, ant: Math.sin(ph * 2) };
    if (nm === "wind") return { ant: t, bite: t * 0.5 };
    if (nm === "atk") return { bite: f % 2, legs: ph };
    if (nm === "rec") return { bite: 0, ant: 1 - t };
    if (nm === "hurt") return { hurt: f === 0, ant: 1 };
    return { ant: Math.sin(ph) };
  }, rustbugFrame);

// ════ 꼬마 광석 골렘 ════ 바위 몸 여기저기 광석(구리·쇠·수정)이 박힌 작은 골렘. 커다란 주먹으로 내려친다
//   p: bob · step · arm 주먹(0 내림 ~ 1 듦 ~ 2 내려침) · hurt
function oreGolemFrame(p = {}) {
  const W = 44, H = 42, G = H - 1, C = board(W, H);
  const b = p.bob ?? 0, st = p.step ?? 0, ar = p.arm ?? 0;
  for (const [x, far, s] of [[16, 1, -st], [26, 0, st]]) C.part(polyF([[x - 4, 30 + b], [x + 4, 30 + b], [x + 5 + s, G - Math.max(0, s) * 0.6], [x - 4 + s, G - Math.max(0, s) * 0.6]]), far ? rampF(0x7a7470) : ORE, { shine: !far, flat: 0.6 });
  C.part(capF([12, 16 + b], [9, 30 + b], 3.6, 3.4), rampF(0x7a7470), { flat: 0.7 });
  C.part(U(ellR(20, 21 + b, 11, 10), ellR(22, 12 + b, 7, 6)), ORE, { shine: 1, flat: 0.7 });
  for (const [x, y, c] of [[15, 18, 0xd8803a], [24, 24, 0x9aa4b0], [18, 26, 0xb07aff], [27, 15, 0xd8803a]]) C.part(ellR(x, y + b, 2, 1.7), ramp(c), { sep: !1, shine: 1 });
  !p.hurt && (C.over(24, 11 + b, 0xffb040), C.over(27, 11 + b, 0xffb040));
  const s = [28, 16 + b], fist = ar > 1 ? [36, G - 4] : pol(s, 1.2 - ar * 2.6, 11);
  C.part(capF(s, fist, 4, 3.6), ORE, { shine: 1, flat: 0.7 });
  C.part(ellR(fist[0], fist[1], 5, 4.6), ORE, { shine: 1, flat: 0.75 });
  C.part(ellR(fist[0] + 1, fist[1] - 1, 1.6, 1.4), ramp(0x9aa4b0), { sep: !1, shine: 1 });
  return done(C, p);
}
export const pxOreGolem = spec(44, 42, 20, 26,
  { idle: [4, 5], move: [6, 8], wind: [4, 10, !1], atk: [3, 16, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "move") return { step: Math.sin(ph) * 3, bob: -Math.abs(Math.sin(ph)) * 1 };
    if (nm === "wind") return { arm: t, bob: -t };
    if (nm === "atk") return { arm: 2, bob: 1.5 };
    if (nm === "rec") return { arm: 2 - 2 * t };
    if (nm === "hurt") return { hurt: f === 0, bob: 1 };
    return { bob: Math.sin(ph) * 0.4 };
  }, oreGolemFrame);

// ════ [정예] 증기 굴착 기계 ════ (큰 몬스터 조각 도구) 버려진 광산의 놋쇠 굴착기. 리벳 박힌 보일러 · 압력계 · 굴뚝 증기 · 붉게 빛나는 둥근 창 · 나선 홈 드릴 · 무한궤도
//   p: spin 드릴 위상 · steam 증기 · lunge 앞으로 · burrow 땅속(0~1) · hurt
const DRK = 0.7;
const DR_BR = mat(ramp(0xc89a40), { spec: 0.75 }), DR_BRD = mat(ramp(0x9a7430), { spec: 0.5 }), DR_IR = mat(ramp(0x8a9098), { spec: 0.7 }), DR_IRD = mat(ramp(0x4a4e56), { spec: 0.4 });
const DR_TR = mat(ramp(0x3a3a40), { tex: "leather", amp: 0.3 }), DR_GL = mat(rampGlow(0xff6a30)), DR_GAUGE = mat(ramp(0xf0ead8)), DR_DIRT = mat(ramp(0x6a5040), { tex: "stone", amp: 0.9 });
const DR_ST = mat(ramp(0xf0f0f0, { cool: 0x8a9ab8 }), { tex: "fur", amp: 0.3 }), DR_RUST = mat(ramp(0xa85a2e), { tex: "stone", amp: 0.6 });
function drillFrame(p = {}) {
  const W = 124, H = 80, G = H - 1, S = sculpt(W, H, { k: p.k ?? DRK, ax: 56 });
  const sp = p.spin ?? 0, ln = (p.lunge ?? 0) * 5, bu = p.burrow ?? 0, sk = bu * 46, gl = G - 1.5;
  const cl = (f) => (bu > 0.02 ? (x, y) => f(x, y) && y < gl : f), X = (x) => x + ln, Y = (y) => y + sk;
  // 증기 (굴뚝 위로 뭉게뭉게)
  const st = p.steam ?? 0;
  if (st > 0) for (let k = 0; k < 4; k++) S.add(ellR(X(33 + (k % 2 ? 3 : -2) + k), Y(13 - k * 5), 3.4 + k * 1.1, 2.8 + k * 0.9), DR_ST, { z: 20, h: 3 });
  // 무한궤도 (바퀴 넷 · 궤도 마디가 굴러간다)
  S.add(cl(U(ellR(X(28), Y(G - 8), 8, 7.6), ellR(X(72), Y(G - 8), 8, 7.6), polyF([[X(28), Y(G - 15.6)], [X(72), Y(G - 15.6)], [X(72), Y(G - 0.4)], [X(28), Y(G - 0.4)]]))), DR_TR, { z: 2, h: 6 });
  for (const x of [28, 43, 57, 72]) { S.add(cl(ellR(X(x), Y(G - 8), 5, 5)), DR_IRD, { z: 3, h: 6.6 }); S.add(cl(ellR(X(x), Y(G - 8), 1.8, 1.8)), DR_IR, { z: 3.4, h: 7 }); }
  for (let k = 0; k < 8; k++) { const x = X(26 + k * 6.4 + ((sp / T2) * 6.4) % 6.4); S.carve(cl(capF([x, Y(G - 15.4)], [x + 1, Y(G - 14)], 0.5)), 0.8); }
  // 보일러 (놋쇠 · 띠 셋 · 리벳 · 녹 얼룩) + 증기 돔 + 굴뚝
  S.add(cl(U(ellR(X(50), Y(46), 26, 13), polyF([[X(24), Y(40)], [X(76), Y(40)], [X(76), Y(60)], [X(24), Y(60)]]))), DR_BR, { z: 0, h: 14 });
  for (const x of [34, 50, 66]) S.add(cl(capF([X(x), Y(34)], [X(x), Y(60)], 1.6)), DR_BRD, { lift: 0.6, h: 1.2 });
  if (!p.block) for (const x of [34, 50, 66]) for (const y of [38, 44, 50, 56]) bu < 0.3 && S.decal(X(x), Y(y), 0xf8e0a0);
  S.add(cl(U(ellR(X(42), Y(54), 4, 2.6), ellR(X(30), Y(48), 3, 4))), DR_RUST, { on: 1, h: 0.5 });
  S.add(cl(ellR(X(56), Y(33), 6, 4)), DR_BR, { z: 1, h: 6 });
  S.add(cl(U(polyF([[X(29), Y(18)], [X(38), Y(18)], [X(37), Y(36)], [X(30), Y(36)]]), ellR(X(33.5), Y(18), 6.4, 2.4))), DR_IR, { z: 1.4, h: 5 });
  S.add(cl(capF([X(29), Y(25)], [X(38), Y(25)], 1)), DR_IRD, { lift: 0.5, h: 1 });
  // 압력계 (바늘이 흔들림) · 관 · 둥근 창 (붉은 빛)
  S.add(cl(ellR(X(42), Y(46), 4.4, 4.4)), DR_BRD, { lift: 1, h: 2 });
  S.add(cl(ellR(X(42), Y(46), 3.2, 3.2)), DR_GAUGE, { lift: 1.6, h: 1.6 });
  if (!p.block && bu < 0.3) { const na = -2.2 + st * 1.8 + Math.sin(sp) * 0.2, n0 = [X(42), Y(46)]; for (let r = 0; r < 3; r++) S.decal(...pol(n0, na, r), 0x2a1a10); }
  S.add(cl(U(capF([X(24), Y(44)], [X(18), Y(44)], 1.6), capF([X(18), Y(44)], [X(18), Y(56)], 1.6))), DR_IRD, { z: -1, h: 2 });
  S.add(cl(ellR(X(64), Y(45), 5.6, 5.6)), DR_IRD, { lift: 1, h: 2.6 });
  S.add(cl(ellR(X(64), Y(45), 3.8, 3.8)), p.hurt ? DR_IRD : DR_GL, { lift: 1.4, h: 2 });
  // 드릴 (깃 + 나선 홈 원뿔 · 돌면 홈이 앞으로 흐른다)
  const dx = X(78), cy = Y(52), r0 = 12, Ln = 34, rr = (x) => r0 * (1 - (x - dx) / Ln);
  S.add(cl(ellR(dx - 1, cy, 4, 13.6)), DR_IRD, { z: 4, h: 8 });
  S.add(cl(polyF([[dx, cy - r0], [dx, cy + r0], [dx + Ln, cy]])), DR_IR, { z: 5, h: 10, prof: "round" });
  for (let k = 0; k < 6; k++) { const x = dx + 2 + k * 6 + ((sp / T2) * 6) % 6; x < dx + Ln - 3 && S.carve(cl(capF([x, cy - rr(x) + 0.6], [x + 4.6, cy + rr(x + 4.6) - 0.6], 0.55)), 1.2); }
  // 땅속: 흙 둔덕과 튀는 돌
  if (bu > 0.02) {
    const m = Math.min(1, bu * 1.6);
    S.add(U(ellR(X(52), G - 1, 34 * m, 5.6 * m), ellR(X(38), G - 3, 10 * m, 4.4 * m), ellR(X(66), G - 3, 11 * m, 4.6 * m)), DR_DIRT, { z: 25, h: 4 });
    for (const [x, y, r] of [[30, -7, 2], [74, -6, 1.6], [56, -8, 1.8]]) S.add(ellR(X(x), G + y * m, r * m, r * 0.8 * m), DR_DIRT, { z: 26, h: 2 });
  }
  const C = S.render({ debug: p.debug, rim: !p.block });
  return p.hurt ? flash(C) : C;
}
export const pxDrill = {
  fw: Math.round(124 * DRK), fh: Math.round(80 * DRK), w: 40, h: 30,
  anims: { idle: [4, 6], move: [6, 12], wind: [4, 14, !1], atk: [4, 24], rec: [3, 10, !1], hurt: [2, 10, !1], steam: [4, 12, !1], burrow: [5, 12, !1], under: [2, 8], rise: [5, 14, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { spin: ph * 0.3, steam: f % 2 ? 0.4 : 0 };
    if (nm === "move") P = { spin: ph, steam: 0.3 };
    if (nm === "wind") P = { spin: ph * 3, steam: 1, lunge: -0.5 * t };
    if (nm === "atk") P = { spin: ph * 4, lunge: 1, steam: 1 };
    if (nm === "steam") P = { steam: 1, spin: ph };
    if (nm === "burrow") P = { burrow: t, spin: ph * 3 };
    if (nm === "under") P = { burrow: 1, spin: ph, steam: 0.6 };
    if (nm === "rise") P = { burrow: 1 - t, spin: ph * 3, lunge: t };
    if (nm === "rec") P = { spin: ph * (1 - t), lunge: 1 - t };
    if (nm === "hurt") P = { hurt: f === 0, spin: ph * 0.2, steam: 1 };
    return drillFrame(P);
  },
};

// ════ 폭발 가스 버섯 ════ 노란 점박이 버섯. 갓 아래 주머니가 부풀었다 펑 터지며 가스를 뿜는다 (불이 닿으면 크게 폭발)
//   p: swell 부풀기(0~1.4) · burst 터짐 · hurt
const SHRM = ramp(0xc8a840), GILL = ramp(0xe8d8b0);
function gasShroomFrame(p = {}) {
  const W = 36, H = 36, G = H - 1, C = board(W, H);
  const sw = p.swell ?? 0;
  C.part(polyF([[14, G], [22, G], [21, G - 12], [15, G - 12]]), GILL, { shine: 1 });
  C.part(ellR(18, G - 10, 5 + sw * 3, 4 + sw * 2.5), ramp(0xb8c868), { shine: 1 }); // 가스 주머니
  C.part(ellR(18, G - 16, 13 + sw, 7), SHRM, { shine: 1 });
  C.part(polyF([[5 - sw, G - 15], [31 + sw, G - 15], [29, G - 12], [7, G - 12]]), GILL, { sep: !1 });
  for (const [x, y, r] of [[12, -20, 1.8], [19, -22, 2], [25, -18, 1.6], [16, -16, 1.4]]) C.part(ellR(x, G + y, r, r * 0.8), ramp(0x8a5a2a), { sep: !1 });
  !p.hurt && (C.over(15, G - 8, 0x2a2010), C.over(21, G - 8, 0x2a2010));
  (p.burst ?? 0) > 0 && dots(C, [[6, G - 6], [30, G - 6], [10, G - 2], [26, G - 3], [18, G - 4]], 0xc8e070);
  return done(C, p);
}
export const pxGasShroom = spec(36, 36, 18, 20,
  { idle: [4, 5], move: [4, 6], wind: [5, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "wind") return { swell: t * 1.4 };
    if (nm === "atk") return { swell: [1.4, 0.2, 0][f], burst: 1 };
    if (nm === "rec") return { swell: 0 };
    if (nm === "hurt") return { hurt: f === 0, swell: 0.5 };
    return { swell: Math.max(0, Math.sin(ph)) * 0.3 };
  }, gasShroomFrame);

// ════ 유령 광부 ════ 무너진 갱도에 갇힌 광부의 혼. 헬멧 등불은 아직 켜져 있고, 곡괭이를 내려찍고는 벽 속으로 사라진다
//   p: bob · pick 곡괭이 · fade · hurt
const GMIN = ramp(0x8ab0c8, { warm: 0xe8f8ff });
function ghostMinerFrame(p = {}) {
  const W = 42, H = 46, C = board(W, H);
  const b = p.bob ?? 0, pk = p.pick ?? 0;
  C.part(polyF([[13, 20 + b], [27, 20 + b], [26, 34 + b], [22, 44 + b], [18, 40 + b], [14, 34 + b]]), GMIN, { shine: 1 });
  C.part(ellR(21, 14 + b, 6, 6), GMIN, { shine: 1 });
  C.part(polyF([[14, 11 + b], [15, 6 + b], [27, 6 + b], [28, 11 + b]]), ramp(0x9a8a5a), { shine: 1, flat: 0.6 });
  C.part(ellR(26, 8 + b, 2, 1.8), LAMP, { sep: !1 });
  !p.hurt && (C.over(23, 14 + b, 0x203040), C.over(25, 14 + b, 0x203040));
  strokes(C, [[21, 18 + b, 25, 18.4 + b]], GMIN[1]);
  const s = [26, 22 + b], a = pk > 1 ? 0.2 + (pk - 1) * 1.2 : -2.3 + pk * 1.3, hand = pol(s, a + 1.2, 6), top = pol(hand, a, 13);
  C.part(capF(s, hand, 1.8, 1.5), GMIN, { shine: 1 });
  C.part(capF(pol(hand, a, -2), top, 0.8, 0.8), ramp(0x6a5a40), { shine: 1 });
  const ha = a + Math.PI / 2;
  C.part(U(capF(top, pol(top, ha, 6), 1.2, 0.4), capF(top, pol(top, ha, -4), 1, 0.5)), IRON, { shine: 1, sep: !1 });
  C.selout();
  fade(C, 30 + b, 46);
  (p.fade ?? 0) > 0 && fade(C, 0, 46 / (p.fade + 0.01));
  return p.hurt ? flash(C) : C;
}
export const pxGhostMiner = spec(42, 46, 14, 28,
  { idle: [6, 8], move: [6, 10], wind: [3, 10, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1], fade: [4, 10, !1], appear: [4, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "wind") return { pick: t, bob: -0.5 };
    if (nm === "atk") return { pick: [1.6, 2, 2.1][f], bob: 1 };
    if (nm === "rec") return { pick: 2 - 1.8 * t };
    if (nm === "fade") return { fade: 0.3 + t * 2.2 };
    if (nm === "appear") return { fade: 2.5 - t * 2.4 };
    if (nm === "hurt") return { hurt: f === 0, bob: 1 };
    return { bob: Math.sin(ph) * 1.2, pick: 0.2 };
  }, ghostMinerFrame, { flying: !0 });

// ════ 수정 전갈 ════ 보랏빛 수정이 돋은 전갈. 수정 꼬리로 찌르고 집게로 붙잡는다
//   p: legs · tail 꼬리 찌르기(0~1) · claw · hurt
const SCOR = ramp(0x4a3a5a), SCORF = rampF(0x3e3050);
function crystalScorpFrame(p = {}) {
  const W = 56, H = 34, G = H - 1, C = board(W, H);
  const lp = p.legs ?? 0, tl = p.tail ?? 0, cl = p.claw ?? 0;
  for (let k = 0; k < 4; k++) for (const far of [1, 0]) { const s = [18 + k * 5, G - 7], kn = [s[0] - 2 + Math.sin(lp + k + far * 3) * 2, G - 11], f = [s[0] - 4 + Math.sin(lp + k + far * 3) * 3, G]; C.part(U(capF(s, kn, 0.9, 0.8), capF(kn, f, 0.8, 0.5)), far ? SCORF : SCOR, { sep: !1 }); }
  // 꼬리 (마디가 휘어 올라와 앞으로)
  const segs = [[14, G - 9]];
  for (let k = 1; k <= 5; k++) { const a = -2.3 + k * 0.42 + tl * k * 0.12; segs.push(pol(segs[k - 1], a, 5)); }
  C.part(U(...segs.slice(1).map((q, k) => capF(segs[k], q, 2.8 - k * 0.3, 2.6 - k * 0.3))), SCOR, { shine: 1 });
  const st = segs[5];
  C.part(polyF([[st[0] - 2, st[1]], [st[0] + 2, st[1] - 1], [st[0] + 6 + tl * 2, st[1] + 3 + tl * 2]]), CRYS, { sep: !1, shine: 1 });
  // 몸 + 수정 돌기
  C.part(ellR(24, G - 9, 11, 5), SCOR, { shine: 1 });
  for (const [x, h] of [[18, 5], [23, 7], [28, 5]]) C.part(polyF([[x - 2, G - 12], [x + 2, G - 12], [x, G - 12 - h]]), CRYS, { sep: !1, shine: 1 });
  C.part(ellR(36, G - 9, 4.6, 4), SCOR, { shine: 1 });
  !p.hurt && (C.over(38, G - 11, 0xe0a0ff), C.over(39, G - 11, 0xe0a0ff));
  // 집게 둘
  for (const far of [1, 0]) { const s = [38, G - 8 + far], e = [44, G - 10 + far - cl * 2], c0 = [e[0] + 4, e[1]]; C.part(capF(s, e, 1.4, 1.2), far ? SCORF : SCOR, { sep: !1 }); C.part(ellR(c0[0], c0[1], 3.4, 2.4), far ? SCORF : SCOR, { shine: !far }); C.part(polyF([[c0[0] + 1, c0[1] - 1], [c0[0] + 7, c0[1] - 2.5 - (1 - cl) * 1.5], [c0[0] + 4, c0[1] + 0.5]]), far ? SCORF : CRYS, { sep: !1 }); }
  return done(C, p);
}
export const pxCrystalScorp = spec(56, 34, 28, 14,
  { idle: [4, 6], move: [6, 14], wind: [3, 10, !1], atk: [3, 18, !1], rec: [3, 10, !1], hurt: [2, 10, !1], pinch: [3, 16, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "move") return { legs: ph * 2, claw: 0.2 };
    if (nm === "wind") return { tail: -0.5 * t, claw: 0.3 };
    if (nm === "atk") return { tail: [0.6, 1.2, 1][f] };
    if (nm === "pinch") return { claw: [0, 1, 1][f] };
    if (nm === "rec") return { tail: 1 - t, claw: 0.2 };
    if (nm === "hurt") return { hurt: f === 0, tail: -0.3 };
    return { legs: Math.sin(ph) * 0.3, claw: 0.2 + 0.1 * Math.sin(ph) };
  }, crystalScorpFrame);

// ════ [정예] 광산 웜 ════ (큰 몬스터 조각 도구) 땅을 헤엄치는 거대한 웜. 마디 주름 몸 · 몸에 박힌 광석(쇠·구리·수정) · 겹겹이 이빨 난 둥근 입. 땅속을 헤엄치다 솟구친다
//   p: wave · rise 솟음(0 땅속 ~ 1 전부) · mouth · hurt
const WMK = 0.7;
const WM_SK = mat(ramp(0xa06e5c), { tex: "skin", amp: 0.5, spec: 0.3 }), WM_BEL = mat(ramp(0xd4a48c), { tex: "skin", amp: 0.3 }), WM_LIP = mat(ramp(0xc88a7a), { tex: "skin", amp: 0.3, spec: 0.3 });
const WM_IN = mat(ramp(0x4a0e18)), WM_DIRT = mat(ramp(0x6a5040), { tex: "stone", amp: 0.9 }), WM_IRON = mat(ramp(0x8a8a92), { spec: 0.6 }), WM_CU = mat(ramp(0xc87a40), { spec: 0.6 }), WM_CRY = mat(rampGlow(0xb07aff), { spec: 0.8 });
function wormFrame(p = {}) {
  const W = 128, H = 92, G = H - 1, S = sculpt(W, H, { k: p.k ?? WMK, ax: 58 });
  const wv = p.wave ?? 0, rs = p.rise ?? 1, mo = p.mouth ?? 0, gl = G - 2;
  const up = (f) => (x, y) => f(x, y) && y < gl;
  if (rs > 0.04) {
    const N = 10, pts = [];
    for (let k = 0; k <= N; k++) { const t = k / N; pts.push([54 + Math.sin(wv + k * 0.6) * 5 * (1 - t * 0.5) + t * t * 26 * rs, gl + 4 - t * 74 * rs]); }
    const rad = (k) => 12.6 - k * 0.3, ang = (k) => { const a = pts[Math.min(N, k + 1)], c = pts[Math.max(0, k - 1)]; return Math.atan2(a[1] - c[1], a[0] - c[0]); };
    const off = (k, d) => pol(pts[k], ang(k) + Math.PI / 2, d);
    // 몸 마디 (아래 → 위) + 앞쪽 연한 배 + 마디 주름
    for (let k = 1; k <= N; k++) S.add(up(capF(pts[k - 1], pts[k], rad(k - 1), rad(k))), WM_SK, { z: k * 0.4, h: rad(k) * 0.9 });
    for (let k = 1; k <= N; k++) S.add(up(capF(off(k - 1, -rad(k - 1) * 0.5), off(k, -rad(k) * 0.5), rad(k - 1) * 0.36, rad(k) * 0.36)), WM_BEL, { on: 1, h: 0.5 });
    for (let k = 1; k < N; k++) { const a = ang(k), r = rad(k); S.carve(up(capF(pol(pts[k], a + 1.57, r * 0.98), pol(pts[k], a - 1.57, r * 0.98), 0.6)), 1.1); }
    // 박힌 광석 (등 쪽)
    for (const [k, M0, s] of [[2, WM_IRON, 1], [4, WM_CU, 0.9], [6, WM_CRY, 1], [8, WM_IRON, 0.8], [5, WM_CRY, 0.7]]) {
      if (k > N) continue;
      const q = off(k, rad(k) * 0.55), a = ang(k) + Math.PI / 2;
      S.add(up(M0 === WM_CRY ? polyF([pol(q, a - 1.6, 2.4 * s), pol(q, a + 1.6, 2.4 * s), pol(q, a, 6 * s)]) : U(ellR(q[0], q[1], 3.2 * s, 2.6 * s, a), ellR(...pol(q, a, 2 * s), 2.2 * s, 1.8 * s))), M0, { lift: 1.6, h: 2.4 * s });
    }
    // 머리: 입술 고리 · 입 속 · 이빨 두 겹
    const hd = pts[N], a = ang(N), c = pol(hd, a, 3);
    S.add(up(ellR(c[0], c[1], 6.4, 12.4, a)), WM_LIP, { z: N * 0.4 + 1, h: 6 });
    const mr = 0.55 + Math.min(1.4, mo) * 0.32, ic = pol(c, a, 1.6);
    S.add(up(ellR(ic[0], ic[1], 3.8 * mr, 8.6 * mr, a)), WM_IN, { on: 1, h: 0.4 });
    if (!p.block) {
      for (let k = 0; k < 12; k++) { const u = (k / 12) * T2, q = [ic[0] + Math.cos(u) * 3.8 * mr * Math.cos(a) - Math.sin(u) * 8.6 * mr * Math.sin(a), ic[1] + Math.cos(u) * 3.8 * mr * Math.sin(a) + Math.sin(u) * 8.6 * mr * Math.cos(a)]; S.decal(q[0], q[1], 0xf4ecd8); }
      mo > 0.5 && [0, 1, 2, 3, 4, 5].forEach((k) => { const u = (k / 6) * T2 + 0.4, q = [ic[0] + Math.cos(u) * 2 * mr * Math.cos(a) - Math.sin(u) * 4.6 * mr * Math.sin(a), ic[1] + Math.cos(u) * 2 * mr * Math.sin(a) + Math.sin(u) * 4.6 * mr * Math.cos(a)]; S.decal(q[0], q[1], 0xe0d0b8); });
    }
  }
  // 흙 둔덕 (나오는 자리) + 흩어진 돌
  const m = rs > 0.04 ? 1 : 0.8;
  S.add(U(ellR(54, G - 1, 26 * m, 6), ellR(38, G - 3.4, 10 * m, 5), ellR(70, G - 3.4, 11 * m, 5)), WM_DIRT, { z: 30, h: 5 });
  for (const [x, y, r] of [[30, -6, 2.2], [78, -5, 1.8], [46, -8, 1.6], [64, -7.5, 2]]) S.add(ellR(x, G + y, r, r * 0.8), WM_DIRT, { z: 31, h: 2 });
  rs <= 0.04 && S.carve(U(capF([46, G - 7], [54, G - 4], 0.6), capF([54, G - 4], [62, G - 7.4], 0.6)), 1);
  const C = S.render({ debug: p.debug, rim: !p.block });
  return p.hurt ? flash(C) : C;
}
export const pxMineWorm = {
  fw: Math.round(128 * WMK), fh: Math.round(92 * WMK), w: 30, h: 40,
  anims: { idle: [4, 6], move: [6, 10], wind: [4, 10, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1], dive: [5, 12, !1], under: [4, 10], rise: [5, 14, !1], spit: [3, 12, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { wave: ph, rise: nm === "move" ? 0.6 : 1, mouth: 0.2 };
    if (nm === "wind") P = { wave: ph, mouth: t, rise: 1 };
    if (nm === "atk") P = { mouth: 1.2, rise: 1, wave: 0.5 };
    if (nm === "spit") P = { mouth: [0.6, 1.4, 1][f], rise: 1 };
    if (nm === "dive") P = { rise: 1 - t, wave: ph };
    if (nm === "under") P = { rise: 0 };
    if (nm === "rise") P = { rise: t, mouth: t, wave: ph };
    if (nm === "rec") P = { mouth: 1 - t, rise: 1 };
    if (nm === "hurt") P = { hurt: f === 0, rise: 0.9, mouth: 0.8 };
    return wormFrame(P);
  },
};
