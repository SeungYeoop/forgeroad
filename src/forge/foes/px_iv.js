// 아이언베인 몬스터 12종 (2D 픽셀 손그림, 오른쪽을 본다) — 거점 아래 지하 입문, 옛 갱도와 철 광맥
//   윗층(옛 갱도): 광석 쥐 떼 · 곡괭이 코볼트 · 램프 나방 · [정예] 코볼트 십장
//   가운데(광맥 굴): 쇠껍질 공벌레 · 녹 먹는 벌레 · 꼬마 광석 골렘 · [정예] 증기 굴착 기계
//   아랫층(깊은 광맥): 폭발 가스 버섯 · 유령 광부 · 수정 전갈 · [정예] 광산 웜
import { board, ellR, capF, polyF, U, minus, pol, lerp, ik, ramp, rampF, rampGlow, mixc, dots, strokes, rot, eye, glass, limb, gait4, gait2, flapOf, spec, done, flash, T2, L } from "./kit.js";

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

// ════ [정예] 코볼트 십장 ════ 덩치 큰 코볼트 감독. 굵은 가죽 채찍 · 놋쇠 호루라기 · 등에 다이너마이트 꾸러미
//   p: bob · legs · whip 채찍(-1 뒤로 ~ 1 앞으로) · whistle · dyn 다이너마이트 들기 · hurt
const FMN = ramp(0x8a4a30), FMNF = rampF(0x763e28);
function foremanFrame(p = {}) {
  const W = 72, H = 58, G = H - 1, C = board(W, H);
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, wp = p.whip ?? 0;
  // 등 다이너마이트 꾸러미
  C.part(polyF([[16, 20 + b], [24, 18 + b], [26, 32 + b], [17, 34 + b]]), ramp(0xc8402a), { shine: 1, flat: 0.6 });
  strokes(C, [[17, 25 + b, 25, 24 + b], [18, 29 + b, 26, 28 + b]], ramp(0x5a3a2a)[3]);
  C.part(capF([20, 18 + b], [18, 12 + b], 0.6), ramp(0x3a3030), { sep: !1 });
  // 꼬리 + 다리
  C.part(capF([20, 38 + b], [6, 46 + b], 3, 1), FMN, { shine: 1 });
  for (const [o, far] of [[g.f, 1], [g.n, 0]]) { const hp = [27 + (far ? -2 : 2), 40 + b], ft = [hp[0] + o[0], G - 1.5 - o[1]]; limb(C, hp, ft, 8, 8, 1, far ? 3.4 : 4, 2.2, far ? FMNF : FMN, { shine: !far }); C.part(polyF([[ft[0] - 3, ft[1] - 1], [ft[0] + 5, ft[1] - 1], [ft[0] + 5, ft[1] + 1.5], [ft[0] - 3, ft[1] + 1.5]]), ramp(0x3a2a24), { sep: !1 }); }
  // 몸 (배 + 멜빵)
  C.part(U(ellR(30, 30 + b, 12, 12), ellR(34, 20 + b, 9, 7)), FMN, { shine: 1 });
  C.part(ellR(33, 33 + b, 7, 7), ramp(0xc8a080), { sep: !1 });
  strokes(C, [[26, 18 + b, 30, 40 + b], [36, 18 + b, 34, 40 + b]], ramp(0x4a3a2a)[3]);
  // 머리 + 헬멧(큰 등불) + 호루라기
  const hx = 42, hy = 12 + b;
  C.part(U(ellR(hx, hy, 7, 6), polyF([[hx + 3, hy - 1], [hx + 13, hy + 2], [hx + 12, hy + 5], [hx + 3, hy + 5]])), FMN, { shine: 1, lv: 0.05 });
  C.part(polyF([[hx - 7, hy - 3], [hx - 6, hy - 10], [hx + 6, hy - 10], [hx + 7, hy - 3]]), HELM, { shine: 1, flat: 0.6 });
  C.part(ellR(hx + 6, hy - 7, 2.6, 2.4), LAMP, { sep: !1 });
  !p.hurt && (C.over(hx + 3, hy - 1, 0xffe060), C.over(hx + 3.6, hy - 1, 0x101008));
  strokes(C, [[hx + 1, hy - 2.6, hx + 5, hy - 2]], FMN[1]);
  (p.whistle ?? 0) > 0 ? C.part(capF([hx + 12, hy + 4], [hx + 17, hy + 3], 1.4, 1.6), BRASS, { shine: 1, sep: !1 }) : C.part(ellR(hx + 2, hy + 9, 1.6, 1.4), BRASS, { sep: !1 });
  // 다이너마이트 든 먼 손 / 채찍 든 앞 손
  if ((p.dyn ?? 0) > 0) { const hd = [28, 6 + b]; C.part(capF([28, 20 + b], hd, 2.6, 2.2), FMNF); C.part(capF([hd[0] - 1, hd[1] - 3], [hd[0] + 1, hd[1] + 3], 1.6), ramp(0xc8402a), { sep: !1, shine: 1 }); C.over(hd[0] + 1, hd[1] - 5, 0xfff080); }
  const s = [38, 22 + b], hand = pol(s, 0.6 - wp * 0.9, 9);
  C.part(capF(s, hand, 2.8, 2.4), FMN, { shine: 1 });
  const pts = [hand];
  for (let k = 1; k <= 6; k++) pts.push(pol(pts[k - 1], -wp * 0.4 + (wp < 0 ? -2.6 : 0) + Math.sin(k * 0.8) * 0.3 * (1 - Math.abs(wp)) + k * 0.12 * (wp >= 0 ? 1 : -1), wp > 0.5 ? 5 : 3.4));
  C.part(U(...pts.slice(1).map((q, k) => capF(pts[k], q, 1 - k * 0.1, 0.9 - k * 0.1))), ramp(0x5a3a24), { shine: 1, sep: !1 });
  return done(C, p);
}
export const pxForeman = spec(72, 58, 22, 34,
  { idle: [4, 6], move: [8, 10], wind: [3, 10, !1], atk: [3, 18, !1], rec: [3, 10, !1], hurt: [2, 10, !1], whistle: [4, 10, !1], dyn: [4, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "idle") return { bob: Math.sin(ph) * 0.4, whip: -0.1 };
    if (nm === "move") { const g = gait2(f, n, 4, 2.5); return { legs: g, bob: g.bob, whip: -0.2 }; }
    if (nm === "wind") return { whip: -t };
    if (nm === "atk") return { whip: [0.4, 1, 1][f], bob: 1 };
    if (nm === "rec") return { whip: 1 - t * 1.1 };
    if (nm === "whistle") return { whistle: 1, bob: f % 2 ? 1 : 0 };
    if (nm === "dyn") return { dyn: f < 3 ? 1 : 0, whip: -0.2 };
    return { hurt: f === 0, whip: -0.4 };
  }, foremanFrame);

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

// ════ [정예] 증기 굴착 기계 ════ 버려진 광산의 놋쇠 굴착기. 앞에 커다란 드릴 · 굴뚝에서 증기 · 바퀴 대신 무한궤도
//   p: spin 드릴 위상 · steam 증기 · lunge 앞으로 · burrow 땅속(0~1) · hurt
function drillFrame(p = {}) {
  const W = 84, H = 52, G = H - 1, C = board(W, H);
  const sp = p.spin ?? 0, ln = (p.lunge ?? 0) * 4, bu = p.burrow ?? 0, sink = bu * 30;
  const clipY = (f) => (x, y) => f(x, y) && y < G + 0.5 - (bu > 0 ? 0 : -1) && (bu < 0.05 || y < G - 1);
  // 증기 (굴뚝 위)
  (p.steam ?? 0) > 0 && bu < 0.5 && dots(C, [[22, 4], [26, 1], [19, 0], [24, 6]], 0xe8e8e8);
  // 무한궤도
  C.part(clipY(U(ellR(18 + ln, G - 5 + sink, 6, 5), ellR(46 + ln, G - 5 + sink, 6, 5), polyF([[18 + ln, G - 10 + sink], [46 + ln, G - 10 + sink], [46 + ln, G + sink], [18 + ln, G + sink]]))), ramp(0x3a3a40), { shine: 1 });
  for (let k = 0; k < 6; k++) C.over(16 + ln + k * 6 + (sp % 1) * 6, G - 9.5 + sink, 0x6a6a72);
  // 몸통 (놋쇠 보일러) + 굴뚝 + 창
  C.part(clipY(U(ellR(32 + ln, G - 18 + sink, 18, 10), polyF([[16 + ln, G - 22 + sink], [48 + ln, G - 22 + sink], [48 + ln, G - 10 + sink], [16 + ln, G - 10 + sink]]))), BRASS, { shine: 1 });
  C.part(clipY(polyF([[20 + ln, G - 36 + sink], [26 + ln, G - 36 + sink], [26 + ln, G - 26 + sink], [20 + ln, G - 26 + sink]])), IRON, { shine: 1, flat: 0.6 });
  for (const x of [22, 30, 38]) C.over(x + ln, G - 22 + sink, BRASS[6]);
  C.part(clipY(ellR(36 + ln, G - 22 + sink, 4, 3.6)), ramp(0x2a3038), { sep: !1 });
  !p.hurt && C.over(37 + ln, G - 23 + sink, 0xff6a30);
  // 드릴 (나선)
  const dx = 50 + ln;
  C.part(clipY(polyF([[dx, G - 26 + sink], [dx, G - 8 + sink], [dx + 26, G - 17 + sink]])), IRON, { shine: 1 });
  for (let k = 0; k < 4; k++) { const x = dx + 3 + k * 6 + ((sp * 6) % 6); strokes(C, [[x, G - 25 + sink + (x - dx) * 0.33, x + 3, G - 9 + sink - (x - dx) * 0.33]], IRON[1]); }
  return done(C, p);
}
export const pxDrill = spec(84, 52, 40, 30,
  { idle: [4, 6], move: [6, 12], wind: [4, 14, !1], atk: [4, 24], rec: [3, 10, !1], hurt: [2, 10, !1], steam: [4, 12, !1], burrow: [5, 12, !1], under: [2, 8], rise: [5, 14, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "move") return { spin: ph };
    if (nm === "wind") return { spin: ph * 3, steam: 1, lunge: -0.5 * t };
    if (nm === "atk") return { spin: ph * 4, lunge: 1, steam: 1 };
    if (nm === "steam") return { steam: 1, spin: ph };
    if (nm === "burrow") return { burrow: t, spin: ph * 3 };
    if (nm === "under") return { burrow: 1, spin: ph };
    if (nm === "rise") return { burrow: 1 - t, spin: ph * 3, lunge: t };
    if (nm === "rec") return { spin: ph * (1 - t), lunge: 1 - t };
    return { hurt: f === 0, spin: ph * 0.2, steam: nm === "hurt" ? 1 : 0 };
  }, drillFrame);

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

// ════ [정예] 광산 웜 ════ 거대한 지렁이 같은 웜. 둥근 입에 이빨이 겹겹이 · 몸에 광석이 박혔다. 땅속을 헤엄치다 솟구친다
//   p: wave · rise 솟음(0 땅속 ~ 1 전부) · mouth · hurt
const WRM = ramp(0x9a6a5a), WRMB = ramp(0xc89a80);
function wormFrame(p = {}) {
  const W = 90, H = 64, G = H - 1, C = board(W, H);
  const wv = p.wave ?? 0, rs = p.rise ?? 1, mo = p.mouth ?? 0;
  const below = (f) => (x, y) => f(x, y) && y < G - 1;
  // 흙 둔덕 (땅에서 나오는 자리)
  C.part(U(ellR(40, G - 1, 22, 5), ellR(30, G - 3, 8, 4), ellR(50, G - 3, 9, 4)), ramp(0x6a5040), { shine: 1 });
  if (rs > 0.05) {
    const pts = [];
    for (let k = 0; k <= 8; k++) { const t = k / 8; pts.push([40 + Math.sin(wv + k * 0.7) * 4 + t * 18 * rs, G - 2 - t * 52 * rs]); }
    C.part(below(U(...pts.slice(1).map((q, k) => capF(pts[k], q, 9 - k * 0.3, 9 - (k + 1) * 0.3)))), WRM, { shine: 1 });
    for (let k = 1; k < 8; k++) C.part(below(capF([pts[k][0] - 8, pts[k][1]], [pts[k][0] + 8, pts[k][1]], 0.8)), WRM, { sep: !1, lv: -0.25 });
    for (const k of [2, 4, 6]) C.part(below(ellR(pts[k][0] - 4, pts[k][1] + 1, 2.2, 1.8)), ramp(0x8a8a90), { sep: !1, shine: 1 });
    // 입 (원형, 겹친 이빨)
    const hd = pts[8], a = 0.6;
    C.part(below(ellR(hd[0] + 3, hd[1] - 1, 8, 7, a)), WRMB, { shine: 1 });
    C.part(below(ellR(hd[0] + 5, hd[1] - 2, 3 + mo * 3, 2.6 + mo * 3, a)), ramp(0x3a0a10), { sep: !1 });
    for (let k = 0; k < 8; k++) { const q = pol([hd[0] + 5, hd[1] - 2], (k / 8) * T2, 3 + mo * 3); C.over(q[0], q[1], 0xf0e8d0); }
  }
  return done(C, p);
}
export const pxMineWorm = spec(90, 64, 30, 40,
  { idle: [4, 6], move: [6, 10], wind: [4, 10, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1], dive: [5, 12, !1], under: [4, 10], rise: [5, 14, !1], spit: [3, 12, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "wind") return { wave: ph, mouth: t, rise: 1 };
    if (nm === "atk") return { mouth: 1.2, rise: 1, wave: 0.5 };
    if (nm === "spit") return { mouth: [0.6, 1.4, 1][f], rise: 1 };
    if (nm === "dive") return { rise: 1 - t, wave: ph };
    if (nm === "under") return { rise: 0 };
    if (nm === "rise") return { rise: t, mouth: t, wave: ph };
    if (nm === "rec") return { mouth: 1 - t, rise: 1 };
    if (nm === "hurt") return { hurt: f === 0, rise: 0.9, mouth: 0.8 };
    return { wave: ph, rise: nm === "move" ? 0.6 : 1, mouth: 0.2 };
  }, wormFrame);
