// 루트홀로우 몬스터 12종 (오른쪽을 본다) — 모스바크 거목 아래 뿌리 굴, 빛나는 균사 숲, 심장 뿌리
//   윗층(뿌리 얽힘): 뿌리 손 · 노움 도둑 · 뿌리 벌레 떼 · [정예] 뿌리 갑옷 곰
//   가운데(균사 숲): 발광 버섯 꼬마 · 포자 풍선 · 균사 사슴 · [정예] 버섯 왕
//   아랫층(심장 뿌리): 흙덩이 정령 · 썩은 뿌리 망령 · 돌껍질 달팽이 · [정예] 고대 뿌리 심장
//   작은 몬스터 = 부위 명암 손그림(kit board), 정예(큰 몬스터) = 높이 지도 조각(px3 sculpt)
import { board, ellR, capF, polyF, U, minus, pol, lerp, ik, ramp, rampF, rampGlow, mixc, dots, strokes, rot, eye, glass, limb, gait4, gait2, flapOf, spec, done, flash, T2, L } from "./kit.js";
import { sculpt, mat } from "./px3.js";

const ROOT = ramp(0x6a4a30), ROOTF = rampF(0x5a3e28), SOIL = ramp(0x5a4030), GLOWG = rampGlow(0x7af0a0), SPORE = ramp(0x9a7ab0);
const fadeY = (C, y0, y1) => { for (let y = 0; y < C.H; y++) { const t = (y - y0) / Math.max(1, y1 - y0); if (t <= 0) continue; for (let x = 0; x < C.W; x++) { const i = y * C.W + x; if (C.d[i] < 0) continue; if (((x * 7 + y * 13) % 8) / 8 < t) C.d[i] = -1; } } };

// ════ 뿌리 손 ════ 땅에서 손처럼 솟는 뿌리 다발. 붙잡아 끌어당긴다 (움직이지 않음)
//   p: rise(0~1) · grab 손가락 오므림 · reach 앞으로 뻗기 · hurt
function rootHandFrame(p = {}) {
  const W = 40, H = 46, G = H - 1, C = board(W, H);
  const rs = p.rise ?? 1, gb = p.grab ?? 0, rc = p.reach ?? 0;
  C.part(U(ellR(18, G - 1, 11, 3.6), ellR(12, G - 2, 4, 3)), SOIL, { shine: 1 });
  if (rs > 0.05) {
    const base = [18, G - 2], wr = [18 + rc * 8, G - 2 - rs * 24], palm = pol(wr, -Math.PI / 2 + rc * 0.9, 4);
    C.part(capF(base, wr, 4, 3), ROOT, { shine: 1 });
    strokes(C, [[base[0] - 1, base[1], wr[0] - 1, wr[1]], [base[0] + 2, base[1], wr[0] + 1.5, wr[1] + 2]], ROOT[2]);
    C.part(ellR(palm[0], palm[1], 4.6, 3.6, rc * 0.9), ROOT, { shine: 1 });
    for (let k = 0; k < 4; k++) { const a = -Math.PI / 2 + rc * 0.9 + (k - 1.5) * (0.42 - gb * 0.18), f0 = pol(palm, a, 3), f1 = pol(f0, a + gb * 0.9 * (k < 2 ? 1 : -1), 6 - gb * 2), f2 = pol(f1, a + gb * 1.6 * (k < 2 ? 1 : -1), 3.5); C.part(U(capF(f0, f1, 1.4, 1.1), capF(f1, f2, 1.1, 0.5)), ROOT, { shine: 1, sep: !1 }); }
    dots(C, [[wr[0] - 1, wr[1] + 6], [base[0] + 1, base[1] - 8]], GLOWG[3]);
  }
  return done(C, p);
}
export const pxRootHand = spec(40, 46, 16, 28,
  { hide: [1, 1], rise: [4, 12, !1], idle: [4, 6], move: [4, 6], wind: [3, 10, !1], atk: [3, 14, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "hide") return { rise: 0 };
    if (nm === "rise") return { rise: t };
    if (nm === "wind") return { reach: -0.3 * t, grab: 0 };
    if (nm === "atk") return { reach: [0.6, 1, 1][f], grab: [0, 0.5, 1][f] };
    if (nm === "rec") return { reach: 1 - t, grab: 1 - t };
    if (nm === "hurt") return { hurt: f === 0, reach: -0.3, grab: 0.4 };
    return { reach: Math.sin(ph) * 0.15, grab: 0.2 + 0.2 * Math.sin(ph) };
  }, rootHandFrame);

// ════ 노움 도둑 ════ 뾰족 빨간 모자 · 흰 수염 · 등에 자루. 몰래 다가와 재료를 훔쳐 달아난다
//   p: bob · legs · sack 자루 부풂 · grab · hurt
const GNM = ramp(0xe8b890), HAT = ramp(0xc8402a), BEARD = ramp(0xf0ece4), SACK = ramp(0x9a7a50);
function gnomeFrame(p = {}) {
  const W = 34, H = 36, G = H - 1, C = board(W, H);
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, sk = p.sack ?? 0;
  C.part(ellR(9, 20 + b, 5 + sk * 2, 6 + sk * 2), SACK, { shine: 1 }); // 자루
  strokes(C, [[11, 15 + b, 14, 20 + b]], SACK[2]);
  for (const [o, far] of [[g.f, 1], [g.n, 0]]) C.part(U(capF([16 + (far ? -1.5 : 1.5), 26 + b], [16 + (far ? -1.5 : 1.5) + o[0], G - 1 - o[1]], 1.5, 1.3), ellR(16 + (far ? -1.5 : 1.5) + o[0] + 1.5, G - 0.5 - o[1], 2.6, 1.2)), far ? rampF(0x4a5a8a) : ramp(0x4a5a8a), { sep: !1, shine: !far });
  C.part(ellR(17, 22 + b, 5.6, 6), ramp(0x4a6a3a), { shine: 1 }); // 초록 옷
  C.part(ellR(19, 14 + b, 4.6, 4.4), GNM, { shine: 1 });
  C.part(polyF([[14, 13 + b], [24, 12 + b], [21, 4 + b - sk], [17, -1 + b]]), HAT, { shine: 1 }); // 뾰족 모자
  C.part(polyF([[17, 16 + b], [24, 15 + b], [22, 22 + b], [19, 23 + b]]), BEARD, { shine: 1, sep: !1 }); // 수염
  C.part(ellR(23, 14.6 + b, 1.6, 1.4), ramp(0xe89a8a), { sep: !1 }); // 코
  !p.hurt && (C.over(21, 13 + b, 0x201010), C.over(21.4, 12.4 + b, 0xffffff));
  const gr = p.grab ?? 0;
  C.part(capF([20, 20 + b], [22 + gr * 6, 21 + b - gr * 2], 1.3, 1.1), ramp(0x4a6a3a), { sep: !1 });
  return done(C, p);
}
export const pxGnome = spec(34, 36, 12, 18,
  { idle: [4, 6], move: [8, 16], wind: [3, 10, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1], flee: [8, 18] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "move" || nm === "flee") { const g = gait2(f, n, 3.5, 2.5); return { legs: g, bob: g.bob, sack: nm === "flee" ? 1 : 0 }; }
    if (nm === "wind") return { grab: -0.3 * t };
    if (nm === "atk") return { grab: [0.6, 1, 1][f] };
    if (nm === "rec") return { grab: 1 - t, sack: t };
    if (nm === "hurt") return { hurt: f === 0 };
    return { bob: Math.sin(ph) * 0.4 };
  }, gnomeFrame);

// ════ 뿌리 벌레 떼 ════ 하얀 굼벵이 넷이 뿌리 속에서 꿈틀꿈틀 기어 나와 문다
//   p: wave · bite · hurt
const GRUB = ramp(0xe8dcc0), GRUBH = ramp(0x8a5a3a);
function grubsFrame(p = {}) {
  const W = 44, H = 18, G = H - 1, C = board(W, H);
  const wv = p.wave ?? 0, bt = p.bite ?? 0;
  for (const [x0, k, far] of [[4, 0, 1], [24, 2, 1], [14, 1, 0], [30, 3, 0]]) {
    const pts = [];
    for (let j = 0; j <= 4; j++) pts.push([x0 + j * 2.6, G - 3 - Math.abs(Math.sin(wv + k + j * 0.8)) * 1.6]);
    for (const q of pts) C.part(ellR(q[0], q[1], 2.2, 2), far ? rampF(0xe8dcc0) : GRUB, { shine: !far });
    const hd = pts[4];
    C.part(ellR(hd[0] + 1.6, hd[1], 1.8, 1.6), GRUBH, { sep: !1, shine: 1 });
    bt > 0.4 && C.over(hd[0] + 3.4, hd[1], 0x3a1a10);
  }
  return done(C, p);
}
export const pxGrubs = spec(44, 18, 26, 8,
  { idle: [4, 6], move: [6, 12], wind: [3, 10, !1], atk: [3, 14, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "move") return { wave: ph * 2 };
    if (nm === "atk") return { bite: f % 2, wave: ph };
    if (nm === "hurt") return { hurt: f === 0, wave: 2 };
    return { wave: Math.sin(ph) * 0.6 };
  }, grubsFrame);

// ════ 발광 버섯 꼬마 ════ 빛나는 갓을 쓴 꼬마 버섯. 아장아장 걸으며 빛 포자를 퍼뜨리고, 붙으면 도망친다
//   p: bob · legs · puff 포자 뿜기 · glow · hurt
const CAPG = rampGlow(0x5ad8c0), STEM = ramp(0xe0d8c0);
function shroomFrame(p = {}) {
  const W = 32, H = 32, G = H - 1, C = board(W, H);
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, pf = p.puff ?? 0;
  for (const [o, far] of [[g.f, 1], [g.n, 0]]) C.part(capF([15 + (far ? -2 : 2), 22 + b], [15 + (far ? -2 : 2) + o[0], G - o[1]], 1.6, 1.4), far ? rampF(0xe0d8c0) : STEM, { sep: !1 });
  C.part(ellR(16, 19 + b, 5, 5.5), STEM, { shine: 1 });
  !p.hurt && (C.over(18, 18 + b, 0x1a2020), C.over(15, 18 + b, 0x1a2020), C.over(18.4, 17.4 + b, 0xffffff));
  C.part(ellR(16, 11 + b - pf, 11 + pf, 6.5), CAPG, { shine: 1 });
  for (const [x, y] of [[11, 9], [17, 7], [21, 11], [14, 12]]) C.part(ellR(x, y + b - pf, 1.6, 1.2), ramp(0xe8fff8), { sep: !1 });
  pf > 0 && dots(C, [[6, 4 + b], [26, 3 + b], [16, 1 + b], [10, 0 + b], [22, 0 + b]], 0xb0fff0);
  return done(C, p);
}
export const pxShroomKid = spec(32, 32, 12, 18,
  { idle: [4, 6], move: [6, 12], wind: [3, 10, !1], atk: [3, 14, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "move") { const g = gait2(f, n, 2.5, 2); return { legs: g, bob: g.bob }; }
    if (nm === "wind") return { puff: -0.5 * t, bob: t };
    if (nm === "atk") return { puff: [1.6, 1, 0.4][f] };
    if (nm === "hurt") return { hurt: f === 0, puff: 0.6 };
    return { bob: Math.sin(ph) * 0.4 };
  }, shroomFrame);

// ════ 포자 풍선 ════ 부푼 보랏빛 포자 주머니. 둥둥 떠다니다 다가와 터지며 독 구름을 남긴다
//   p: swell · wob · burst · hurt
function balloonFrame(p = {}) {
  const W = 34, H = 40, C = board(W, H);
  const sw = p.swell ?? 0, wb = p.wob ?? 0;
  C.part(ellR(17, 16 + wb, 10 + sw * 3, 11 + sw * 3), SPORE, { shine: 1 });
  for (const [x, y, r] of [[12, 12, 1.8], [20, 9, 1.6], [22, 18, 2], [14, 20, 1.4]]) C.part(ellR(x, y + wb, r, r), ramp(0xc8a8e0), { sep: !1, shine: 1 });
  !p.hurt && (C.over(14, 16 + wb, 0x2a1a3a), C.over(20, 16 + wb, 0x2a1a3a));
  strokes(C, [[15, 20 + wb, 19, 20 + wb]], 0x2a1a3a);
  // 아래 늘어진 실뿌리
  for (const dx of [-3, 0, 3]) strokes(C, [[17 + dx, 27 + wb + sw * 2, 17 + dx * 1.4, 36 + wb]], 0x6a5a7a);
  (p.burst ?? 0) > 0 && dots(C, [[4, 10], [30, 12], [6, 24], [28, 26], [17, 2]], 0xd8b8f0);
  return done(C, p);
}
export const pxBalloon = spec(34, 40, 16, 20,
  { idle: [6, 6], move: [6, 8], wind: [4, 10, !1], atk: [2, 12, !1], rec: [2, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "wind") return { swell: t, wob: Math.sin(t * 9) };
    if (nm === "atk") return { swell: 1.2, burst: 1 };
    if (nm === "hurt") return { hurt: f === 0, wob: 1.5 };
    return { wob: Math.sin(ph) * 1.2 };
  }, balloonFrame, { flying: !0 });

// ════ 균사 사슴 ════ 균에 뒤덮인 사슴. 뿔은 버섯이 핀 가지, 몸엔 하얀 균사가 덮였다. 뿔을 낮추고 돌진, 포자를 털어낸다
//   p: legs · bob · head · shake · hurt
const DEER = ramp(0x8a6a50), DEERF = rampF(0x7a5c44), MYC = ramp(0xe0e0d0);
function deerFrame(p = {}) {
  const W = 62, H = 50, G = H - 1, C = board(W, H);
  const b = p.bob ?? 0, hd = p.head ?? 0, lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) }, sh = p.shake ?? 0;
  const leg = (x, o, far, front) => { const s = [x, 32 + b], kn = [x + (front ? 1 : -2), 40 + b], ft = [x + o[0], G - 2 - o[1]]; C.part(U(capF(s, kn, far ? 2.2 : 2.6, 1.8), capF(kn, ft, 1.8, 1.2)), far ? DEERF : DEER, { shine: !far }); C.part(ellR(ft[0], ft[1] + 1, 1.8, 1.4), ramp(0x2a2020), { sep: !1 }); };
  leg(40, lg.ff, !0, !0), leg(20, lg.bf, !0, !1);
  C.part(U(ellR(30, 28 + b, 15, 7.5), ellR(18, 27 + b, 6, 7)), DEER, { shine: 1 });
  for (const [x, y, r] of [[22, 23, 3], [30, 22, 3.6], [38, 24, 2.6], [26, 30, 2], [34, 30, 2.2]]) C.part(ellR(x + sh, y + b, r, r * 0.7), MYC, { sep: !1, shine: 1 });
  C.part(capF([14, 24 + b], [11, 21 + b], 1.4, 1), MYC, { sep: !1 }); // 꼬리
  // 목 + 머리 (숙이면 앞 아래)
  const Hr = rot([42, 24 + b], hd * 0.7), Q = (x, y) => Hr([x, y + b]);
  C.part(capF(Q(40, 26), Q(47, 15), 4, 3.2), DEER, { shine: 1 });
  C.part(U(ellR(...Q(49, 13), 4.6, 4), capF(Q(50, 14), Q(56, 17), 2.6, 1.8)), DEER, { shine: 1, lv: 0.05 });
  !p.hurt && (C.over(...Q(50, 12), 0xb0ffe0), C.over(...Q(50.6, 12), 0x103020));
  // 버섯 핀 가지 뿔
  for (const s of [-1, 1]) {
    const a0 = Q(47 + s, 9), a1 = pol(a0, -1.9 + s * 0.35, 7), a2 = pol(a1, -2.3 + s * 0.5, 6), a3 = pol(a1, -1.2 + s * 0.3, 5);
    C.part(U(capF(a0, a1, 1.2, 0.9), capF(a1, a2, 0.9, 0.5), capF(a1, a3, 0.8, 0.5)), s < 0 ? rampF(0xd8d0b8) : ramp(0xd8d0b8), { sep: !1, shine: 1 });
    C.part(ellR(a2[0], a2[1] - 1, 2.6, 1.6), CAPG, { sep: !1, shine: 1 });
    C.part(ellR(a3[0], a3[1] - 1, 2, 1.3), CAPG, { sep: !1, shine: 1 });
  }
  leg(37, lg.fn, !1, !0), leg(17, lg.bn, !1, !1);
  sh && dots(C, [[18, 14 + b], [30, 12 + b], [42, 16 + b], [24, 10 + b]], 0xb0fff0);
  return done(C, p);
}
export const pxMycoDeer = spec(62, 50, 30, 26,
  { idle: [4, 5], move: [6, 12], wind: [4, 10, !1], atk: [6, 18], rec: [3, 10, !1], hurt: [2, 10, !1], shake: [4, 14, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "idle") return { bob: Math.sin(ph) * 0.4, head: f === 2 ? 0.3 : 0 };
    if (nm === "move") { const g = gait4(f, n, 5, 3); return { legs: g, bob: g.bob }; }
    if (nm === "wind") return { head: 0.9 * t, bob: t };
    if (nm === "atk") { const g = gait4(f, n, 7, 3.5); return { legs: g, head: 1, bob: g.bob + 1 }; }
    if (nm === "shake") return { shake: f % 2 ? 1.5 : -1.5, head: 0.2 };
    if (nm === "rec") return { head: 1 - t };
    return { hurt: f === 0, head: -0.4 };
  }, deerFrame);

// ════ 흙덩이 정령 ════ 축축한 흙과 돌이 뭉친 덩어리. 둘이 만나면 합쳐져 커진다. 흙 주먹을 휘두른다
//   p: big 크기(0~1) · bob · arm · hurt
const CLOD = ramp(0x6a5038);
function clodFrame(p = {}) {
  const W = 44, H = 40, G = H - 1, C = board(W, H);
  const bg = p.big ?? 0, b = p.bob ?? 0, ar = p.arm ?? 0, s = 0.75 + bg * 0.35;
  C.part(U(ellR(20, G - 10 * s + b, 11 * s, 10 * s), ellR(14, G - 16 * s + b, 6 * s, 6 * s)), CLOD, { shine: 1 });
  for (const [x, y, r] of [[13, -9, 2.2], [24, -14, 2], [18, -20, 1.6], [26, -6, 1.8]]) C.part(ellR(20 + (x - 20) * s, G + y * s + b, r * s, r * s * 0.8), ramp(0x8a8478), { sep: !1, shine: 1 });
  dots(C, [[16, G - 6 + b], [23, G - 12 * s + b]], GLOWG[3]);
  !p.hurt && (C.over(22, G - 15 * s + b, 0xc8ff90), C.over(26, G - 15 * s + b, 0xc8ff90));
  const sh = [28 * s + 4, G - 13 * s + b], fist = ar > 1 ? [sh[0] + 9, G - 4] : pol(sh, 1.1 - ar * 2.4, 9 * s);
  C.part(capF(sh, fist, 3 * s, 2.6 * s), CLOD, { shine: 1 });
  C.part(ellR(fist[0], fist[1], 4 * s, 3.6 * s), CLOD, { shine: 1 });
  return done(C, p);
}
export const pxClod = spec(44, 40, 18, 18,
  { idle: [4, 5], move: [6, 8], wind: [3, 10, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], grow: [4, 8, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "move") return { bob: -Math.abs(Math.sin(ph)) * 1.2 };
    if (nm === "wind") return { arm: t };
    if (nm === "atk") return { arm: 2, bob: 1 };
    if (nm === "rec") return { arm: 2 - 2 * t };
    if (nm === "grow") return { big: t };
    if (nm === "hurt") return { hurt: f === 0, bob: 1 };
    return { bob: Math.sin(ph) * 0.5 };
  }, clodFrame);

// ════ 썩은 뿌리 망령 ════ 시든 뿌리에 깃든 원한. 뿌리가 엉킨 몸에 빈 눈구멍, 아래는 흩어진다. 뿌리 사이로 순간이동해 뒤에서 할퀸다
//   p: bob · claw · fade · hurt
const WRT = ramp(0x5a4a5a, { warm: 0xd8c8f0 });
function wraithFrame(p = {}) {
  const W = 44, H = 48, C = board(W, H);
  const b = p.bob ?? 0, cl = p.claw ?? 0;
  C.part(polyF([[14, 18 + b], [28, 18 + b], [30, 32 + b], [24, 44 + b], [20, 40 + b], [16, 46 + b], [12, 32 + b]]), WRT, { shine: 1 });
  for (const [x0, y0, x1, y1] of [[16, 20, 14, 40], [22, 19, 23, 42], [27, 22, 27, 38]]) strokes(C, [[x0, y0 + b, x1, y1 + b]], WRT[2]);
  C.part(ellR(21, 12 + b, 6.4, 6.6), WRT, { shine: 1 });
  C.part(U(capF([17, 7 + b], [12, 1 + b], 1.4, 0.5), capF([24, 6 + b], [27, 0 + b], 1.2, 0.4)), ROOT, { sep: !1 }); // 뿌리 뿔
  if (!p.hurt) { C.part(ellR(19, 12 + b, 1.6, 2), ramp(0x100810), { sep: !1 }); C.part(ellR(24, 12 + b, 1.6, 2), ramp(0x100810), { sep: !1 }); C.over(19, 12 + b, 0xd890ff).over(24, 12 + b, 0xd890ff); }
  const s = [27, 22 + b], h = pol(s, 0.9 - cl * 1.4, 9);
  C.part(capF(s, h, 1.8, 1.4), WRT, { shine: 1 });
  for (const d of [-0.5, 0, 0.5]) C.part(capF(h, pol(h, 0.6 - cl * 1.2 + d, 4.5), 0.8, 0.3), ROOT, { sep: !1 });
  C.selout();
  fadeY(C, 32 + b, 48);
  (p.fade ?? 0) > 0 && fadeY(C, 0, 48 / (p.fade + 0.01));
  return p.hurt ? flash(C) : C;
}
export const pxWraith = spec(44, 48, 14, 28,
  { idle: [6, 8], move: [6, 10], wind: [3, 10, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1], fade: [4, 12, !1], appear: [4, 12, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "wind") return { claw: -0.4 * t, bob: -0.5 };
    if (nm === "atk") return { claw: [0.6, 1, 1][f] };
    if (nm === "rec") return { claw: 1 - t };
    if (nm === "fade") return { fade: 0.3 + t * 2.2 };
    if (nm === "appear") return { fade: 2.5 - t * 2.4 };
    if (nm === "hurt") return { hurt: f === 0, bob: 1 };
    return { bob: Math.sin(ph) * 1.2 };
  }, wraithFrame, { flying: !0 });

// ════ 돌껍질 달팽이 ════ 돌 같은 나선 껍질 · 축축한 몸 · 눈자루. 산성 점액을 뱉고, 지나간 자리는 미끄럽다
//   p: stretch · eyes 눈자루 · spit · hide 껍질에 숨기 · hurt
const SNL = ramp(0x9a8a6a), SHELLS = ramp(0x7a7468);
function snailFrame(p = {}) {
  const W = 46, H = 32, G = H - 1, C = board(W, H);
  const st = p.stretch ?? 0, hd = p.hide ?? 0;
  if (hd < 0.7) {
    C.part(U(ellR(24 + st * 2, G - 3, 16 + st * 2, 3.4), polyF([[30, G - 6], [38 + st * 3, G - 8], [40 + st * 3, G - 2], [30, G - 1]])), SNL, { shine: 1 });
    for (const [dx, a] of [[0, -1.3], [3, -1.1]]) { const s0 = [36 + st * 3 + dx, G - 7], e0 = pol(s0, a - (p.eyes ?? 0) * 0.3, 7); C.part(capF(s0, e0, 0.9, 0.7), SNL, { sep: !1 }); C.part(ellR(e0[0], e0[1], 1.4, 1.4), SNL, { sep: !1 }); !p.hurt && C.over(e0[0] + 0.5, e0[1], 0x101010); }
    (p.spit ?? 0) > 0 && dots(C, [[42 + st * 3, G - 6], [44 + st * 3, G - 7]], 0xc8f070);
  }
  // 나선 돌껍질
  C.part(ellR(20, G - 12, 12, 11), SHELLS, { shine: 1 });
  for (let k = 0; k < 28; k++) { const a = k * 0.42, r = 10 - k * 0.32; C.over(20 + Math.cos(a) * r, G - 12 + Math.sin(a) * r * 0.9, SHELLS[2]); }
  dots(C, [[16, G - 18], [25, G - 9]], GLOWG[3]);
  return done(C, p);
}
export const pxSnail = spec(46, 32, 24, 16,
  { idle: [4, 5], move: [6, 8], wind: [3, 10, !1], atk: [3, 14, !1], rec: [3, 10, !1], hurt: [2, 10, !1], hide: [2, 4] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "move") return { stretch: Math.max(0, Math.sin(ph)), eyes: Math.sin(ph) };
    if (nm === "wind") return { stretch: -0.5 * t, eyes: t };
    if (nm === "atk") return { spit: 1, stretch: 0.6 };
    if (nm === "hide") return { hide: 1 };
    if (nm === "hurt") return { hurt: f === 0, hide: 0.4 };
    return { eyes: Math.sin(ph) * 0.5 };
  }, snailFrame);

// ════════════ 정예 (큰 몬스터 조각 도구) ════════════
// ════ [정예] 뿌리 갑옷 곰 ════ 굵은 뿌리가 갑옷처럼 몸을 감은 거대한 곰. 이끼 등 · 빛나는 균사 상처. 앞발 연타 · 일어서서 내려찍기 · 포효
//   p: bob · legs · stand 일어섬(0~1) · paw 앞발(0~1 휘두름) · roar · hurt
const BRK = 0.7;
const BFUR = mat(ramp(0x5a4030), { tex: "fur", amp: 1, dir: 1.2 }), BFURF = mat(rampF(0x5a4030), { tex: "fur", amp: 0.8, dir: 1.2 });
const BROOT = mat(ramp(0x7a5a38), { tex: "wood", amp: 1, dir: 0.3 }), BMOSS = mat(ramp(0x4e7a34), { tex: "fur", amp: 1, dir: 1.5 });
const BCLAW = mat(ramp(0xd8ccb0), { spec: 0.4 }), BNOSE = mat(ramp(0x2a2020), { spec: 0.5 });
function bearFrame(p = {}) {
  const W = 110, H = 96, G = H - 1, S = sculpt(W, H, { k: p.k ?? BRK, ax: 54 }), b = p.bob ?? 0, sd = p.stand ?? 0, pw = p.paw ?? 0;
  const lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) };
  const R = rot([40, 70], -sd * 0.9), P = (x, y) => R([x, y + b]);
  // 뒷다리 (서면 그대로 땅)
  for (const [x, o, far] of [[30, lg.bf, 1], [36, lg.bn, 0]]) { const hip = [x, 68 + b], ft = [x + o[0] + 2, G - 3 - o[1]]; S.add(capF(hip, ft, 9, 7), far ? BFURF : BFUR, { z: far ? -4 : 2, h: 7 }); S.add(ellR(ft[0] + 3, ft[1] + 1, 7, 3.4), far ? BFURF : BFUR, { z: far ? -4 : 3, h: 2.4 }); for (let k = 0; k < 3; k++) S.add(capF([ft[0] + 7, ft[1] - 1 + k * 1.4], [ft[0] + 10, ft[1] + k * 1.4], 0.8, 0.4), BCLAW, { z: far ? -3 : 4, h: 0.8 }); }
  // 몸통 (서면 세워짐)
  S.add(ellR(...P(50, 58), 26, 18, -sd * 0.9), BFUR, { z: 0, h: 16 });
  S.add(ellR(...P(64, 48), 15, 14), BFUR, { blend: 5, h: 7 }); // 어깨 혹
  // 뿌리 갑옷 (몸을 감고 도는 굵은 뿌리)
  for (const [x0, y0, x1, y1, r] of [[30, 48, 62, 70, 3.2], [40, 42, 70, 62, 2.8], [52, 40, 76, 54, 2.6], [28, 62, 50, 76, 2.4]]) S.add(capF(P(x0, y0), P(x1, y1), r, r * 0.8), BROOT, { on: 1, h: 2.6, lift: 1.2 });
  S.add(polyF([P(40, 38), P(64, 36), P(70, 44), P(44, 46)]), BMOSS, { on: 1, h: 1.8 }); // 등 이끼
  for (const [x, y] of [[46, 56], [58, 64], [36, 60]]) S.carve(capF(P(x, y), P(x + 4, y + 3), 0.9), 1.6, !1), S.decal(...P(x + 2, y + 1.5), 0x9affd0);
  // 머리 (서면 위로)
  const hc = P(80, 40);
  S.add(ellR(hc[0], hc[1], 13, 11.5), BFUR, { h: 11 });
  S.add(ellR(hc[0] + 9, hc[1] + 4, 7.5, 6), BFUR, { blend: 3, h: 4 }); // 주둥이
  S.add(ellR(hc[0] + 15, hc[1] + 2, 3, 2.4), BNOSE, { h: 2, lift: 4 });
  S.add(U(ellR(hc[0] - 6, hc[1] - 10, 4, 3.6), ellR(hc[0] + 3, hc[1] - 11, 3.6, 3.2)), BFUR, { h: 3, lift: 2 }); // 귀
  S.add(capF([hc[0] - 4, hc[1] - 12], [hc[0] - 10, hc[1] - 20], 2, 0.8), BROOT, { h: 1.6, lift: 4 }); // 머리 위 뿌리 가지
  const ro = p.roar ?? 0;
  S.carve(capF([hc[0] + 7, hc[1] + 8 + ro], [hc[0] + 15, hc[1] + 7 + ro], 0.8 + ro * 2), 2.4, !1);
  if (!p.block) {
    for (let x = hc[0] + 8; x < hc[0] + 15; x++) for (let yy = 0; yy <= ro * 4; yy++) S.decal(x, hc[1] + 7.5 + yy, yy > 0 && yy < ro * 4 ? 0x5a1418 : 0x1a0c0c);
    ro > 0.3 && (S.decal(hc[0] + 9, hc[1] + 7, 0xf0ead8), S.decal(hc[0] + 13, hc[1] + 7, 0xf0ead8));
    p.hurt || (S.decal(hc[0] + 4, hc[1] - 2, 0x9affd0).decal(hc[0] + 5, hc[1] - 2, 0x9affd0).decal(hc[0] + 4, hc[1] - 3, 0xffffff));
  }
  // 앞다리 둘 (휘두르면 앞으로 크게)
  for (const far of [1, 0]) {
    const sh = P(66 + far * -6, 54), a = sd > 0.5 ? -0.6 + pw * 1.8 : 1.4 - pw * 1.2, el = pol(sh, a, 14), ft = sd > 0.5 ? pol(el, a + 0.4, 12) : [sh[0] + 4 + (far ? lg.ff[0] : lg.fn[0]), G - 3 - (far ? lg.ff[1] : lg.fn[1])];
    S.add(U(capF(sh, el, 8, 6.5), capF(el, ft, 6.5, 5.5)), far ? BFURF : BFUR, { z: far ? -2 : 10, h: 6 });
    S.add(capF(lerp(sh, el, 0.3), lerp(el, ft, 0.6), 3, 2.6), BROOT, { on: 1, h: 1.6 });
    for (let k = 0; k < 3; k++) S.add(capF([ft[0] + 3, ft[1] - 1 + k * 1.6], [ft[0] + 7.5, ft[1] + 0.5 + k * 1.6], 0.9, 0.4), BCLAW, { z: far ? 0 : 12, h: 0.9 });
  }
  const C = S.render({ debug: p.debug, rim: !p.block });
  return p.hurt ? flash(C) : C;
}
export const pxRootBear = {
  fw: Math.round(110 * BRK), fh: Math.round(96 * BRK), w: 40, h: 40,
  anims: { idle: [4, 5], move: [6, 8], wind: [4, 10, !1], atk: [4, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1], stand: [4, 8, !1], slam: [3, 12, !1], roar: [4, 8, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = {};
    if (nm === "idle") P = { bob: Math.sin(ph) * 0.6 };
    if (nm === "move") { const g = gait4(f, n, 6, 3); P = { legs: g, bob: g.bob }; }
    if (nm === "wind") P = { paw: -0.3 * t, bob: t };
    if (nm === "atk") P = { paw: [0.6, 1, 0.6, 1][f], bob: -1 };
    if (nm === "stand") P = { stand: t, paw: 0, roar: t * 0.4 };
    if (nm === "slam") P = { stand: [0.8, 0.3, 0][f], paw: 1, bob: f * 1.5 };
    if (nm === "roar") P = { roar: [0.4, 1, 1, 0.6][f], stand: 0.3 };
    if (nm === "rec") P = { paw: 1 - t };
    if (nm === "hurt") P = { hurt: f === 0, roar: 0.4, bob: 1 };
    return bearFrame(P);
  },
};

// ════ [정예] 버섯 왕 ════ 왕관처럼 둘레가 말린 거대한 빛나는 갓 · 굵은 자루 몸통 · 균사 망토 · 버섯 지팡이.
//   버섯 꼬마를 불러내고 포자 비를 뿌리며, 갓으로 내려찍는다
//   p: bob · step · cap 갓 숙이기 · staff 지팡이 들기 · glow · spores · hurt
const KK = 0.72;
const KCAP = mat(rampGlow(0x48c8b0), { tex: "skin", amp: 0.25, spec: 0.2 }), KSPOT = mat(ramp(0xe8fff4), { tex: "skin", amp: 0.1 });
const KSTEM = mat(ramp(0xe0d4b8), { tex: "skin", amp: 0.3 }), KGILL = mat(ramp(0xb8a890), { tex: "wood", amp: 0.6, dir: 1.57 });
const KCLOAK = mat(ramp(0xd8d8c8), { tex: "cloth", amp: 0.6 }), KSTAFF = mat(ramp(0x6a4a30), { tex: "wood", amp: 0.8, dir: 1.5 });
function mushKingFrame(p = {}) {
  const W = 100, H = 104, G = H - 1, S = sculpt(W, H, { k: p.k ?? KK, ax: 50 }), b = p.bob ?? 0, st = p.step ?? 0, cp = p.cap ?? 0;
  // 지팡이 (먼 손) + 작은 버섯 머리
  const sh = p.staff ?? 0, hand = [28, 64 + b - sh * 16], top = [24, 34 + b - sh * 22];
  S.add(capF([30, G - 2], top, 1.8, 1.6), KSTAFF, { z: -4, h: 1.8 });
  S.add(ellR(top[0], top[1] - 2, 7, 4.6), KCAP, { z: -2, h: 4 });
  // 다리 (뿌리 발)
  for (const [x, far, s] of [[42, 1, -st], [58, 0, st]]) S.add(U(capF([x, 76 + b], [x + s, G - 4], 6, 5), ellR(x + s + 2, G - 2, 8, 3)), far ? mat(rampF(0xe0d4b8)) : KSTEM, { z: far ? -2 : 3, h: 5 });
  // 균사 망토 몸 (자루)
  S.add(polyF([[36, 46 + b], [64, 46 + b], [68, 80 + b], [60, 84 + b], [50, 80 + b], [40, 84 + b], [32, 80 + b]]), KCLOAK, { z: 0, h: 12, prof: "flat" });
  for (const [x0, x1] of [[40, 38], [50, 50], [60, 62]]) S.carve(capF([x0, 50 + b], [x1, 80 + b], 0.8), 1.4);
  S.add(ellR(50, 56 + b, 10, 8), KSTEM, { blend: 3, h: 4 }); // 가슴
  // 얼굴 (갓 아래 자루 윗부분)
  S.add(ellR(52, 40 + b, 11, 9), KSTEM, { h: 9 });
  if (!p.block) {
    S.carve(ellR(48, 40 + b, 2, 2.4), 2.4, !1).carve(ellR(57, 40 + b, 2, 2.4), 2.4, !1);
    const ec = p.hurt ? 0x203030 : 0x9affe0;
    S.decal(48, 40 + b, ec).decal(57, 40 + b, ec).decal(48, 39 + b, 0xffffff).decal(57, 39 + b, 0xffffff);
    S.carve(capF([49, 46 + b], [56, 46 + b], 0.7), 1.6, !1);
  }
  // 거대한 갓 (숙이면 앞으로 기울어 내려옴) + 주름 + 반점 + 말린 테
  const cr = rot([50, 30 + b], cp * 0.35), Q = (x, y) => cr([x, y + b]);
  S.add(polyF([Q(16, 32), Q(84, 32), Q(78, 36), Q(22, 36)]), KGILL, { z: 4, h: 3 });
  S.add(U(ellR(...Q(50, 24), 36, 16, cp * 0.35)), KCAP, { z: 6, h: 14 });
  for (let k = 0; k < 8; k++) { const x = 18 + k * 9.2; S.add(ellR(...Q(x, 34 - Math.sin((k / 7) * Math.PI) * 1.5), 4, 2.4), KCAP, { blend: 1.5, h: 1.2 }); } // 말린 테 (왕관처럼)
  for (const [x, y, r] of [[34, 18, 4], [52, 12, 5], [68, 18, 3.6], [44, 26, 2.6], [62, 27, 2.4], [26, 25, 2.2]]) S.add(ellR(...Q(x, y), r, r * 0.75), KSPOT, { blend: 1.2, h: 1.2 });
  // 포자 (뿌릴 때)
  if ((p.spores ?? 0) > 0) for (let k = 0; k < 12; k++) S.add(ellR(14 + k * 6.4, 6 + ((k * 13) % 9) - p.spores * 4, 1.2, 1.2), KSPOT, { z: 16, h: 0.8 });
  // 가까운 팔 (망토 소매)
  const sN = [62, 50 + b], hN = sh > 0.5 ? [68, 30 + b] : [70, 66 + b];
  S.add(capF(sN, hN, 4.6, 3.6), KCLOAK, { z: 8, h: 4 });
  S.add(ellR(hN[0], hN[1], 3.6, 3.4), KSTEM, { z: 9, h: 3 });
  const C = S.render({ debug: p.debug, rim: !p.block });
  return p.hurt ? flash(C) : C;
}
export const pxMushKing = {
  fw: Math.round(100 * KK), fh: Math.round(104 * KK), w: 34, h: 54,
  anims: { idle: [4, 5], move: [6, 7], wind: [4, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], call: [4, 8, !1], rain: [6, 10] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = {};
    if (nm === "idle") P = { bob: Math.sin(ph) * 0.6 };
    if (nm === "move") P = { step: Math.sin(ph) * 4, bob: -Math.abs(Math.sin(ph)) * 1.4 };
    if (nm === "wind") P = { cap: -0.4 * t, bob: -t * 2 };
    if (nm === "atk") P = { cap: [0.6, 1, 1][f], bob: 2 };
    if (nm === "rec") P = { cap: 1 - t, bob: 2 * (1 - t) };
    if (nm === "call") P = { staff: [0.5, 1, 1, 0.6][f], bob: -1 };
    if (nm === "rain") P = { spores: f / n + 0.2, staff: 0.6, cap: -0.15 };
    if (nm === "hurt") P = { hurt: f === 0, bob: 1, cap: -0.2 };
    return mushKingFrame(P);
  },
};

// ════ [정예] 고대 뿌리 심장 ════ 거목 뿌리가 얽혀 만든 거대한 심장. 뿌리 혈관이 땅으로 뻗고, 가운데 균열에서 초록 빛이 맥박친다.
//   움직이지 않는다. 뿌리 촉수를 사방에서 솟구치게 하고, 맥박 충격파를 낸다
//   p: beat 맥박(0~1) · open 균열 벌어짐 · hurt
const HK = 0.72;
const HROOT = mat(ramp(0x6a3a2a), { tex: "wood", amp: 1.1, dir: 0.8 }), HROOTD = mat(ramp(0x4a2a20), { tex: "wood", amp: 1, dir: 1.2 });
const HFLESH = mat(ramp(0x8a3a3a), { tex: "skin", amp: 0.4 }), HCORE = mat(rampGlow(0x6af0a0), { tex: "skin", amp: 0.15 });
function heartFrame(p = {}) {
  const W = 100, H = 96, G = H - 1, S = sculpt(W, H, { k: p.k ?? HK, ax: 50 }), bt = p.beat ?? 0, op = p.open ?? 0;
  // 땅으로 뻗은 뿌리 혈관 (뒤)
  for (const [x0, y0, x1, y1, r] of [[30, 64, 6, G, 4], [70, 64, 94, G, 4], [40, 70, 24, G, 3.4], [60, 70, 78, G, 3.4], [50, 72, 50, G, 4.4]]) S.add(capF([x0, y0], [x1, y1], r, r * 0.6), HROOTD, { z: -4, h: 3 });
  // 심장 몸 (맥박에 따라 부풂)
  const s = 1 + bt * 0.06;
  S.add(U(ellR(42, 46, 22 * s, 24 * s, 0.3), ellR(60, 46, 20 * s, 23 * s, -0.3), polyF([[30, 60], [70, 60], [50, 80 + bt * 2]])), HFLESH, { z: 0, h: 18 });
  // 감은 뿌리 (몸을 휘감음)
  for (const [x0, y0, x1, y1, r] of [[24, 30, 70, 74, 3.4], [76, 28, 34, 72, 3.2], [30, 22, 74, 40, 2.8], [38, 64, 66, 62, 2.6], [50, 20, 50, 46, 2.4]]) S.add(capF([x0, y0], [x1, y1], r, r * 0.8), HROOT, { on: 1, h: 3, lift: 1.4 });
  // 위로 솟은 굵은 뿌리 동맥 둘
  S.add(capF([40, 26], [34, 4], 6, 4.4), HROOT, { z: 2, h: 5 });
  S.add(capF([60, 24], [68, 6], 5, 3.6), HROOT, { z: 2, h: 4.4 });
  // 가운데 균열 → 빛나는 핵
  S.carve(polyF([[48, 32], [54, 34], [56, 50], [52, 62], [46, 56], [44, 42]]), 3 + op * 3, !0);
  S.add(polyF([[49, 36], [53, 37], [54, 50], [51, 58], [47, 53], [46, 43]]), HCORE, { z: 8 + op * 3, h: 3 + bt * 2 });
  !p.block && (S.decal(50, 44, 0xffffff), S.decal(51, 48, 0xd8ffe8));
  // 이끼·균사 반점
  for (const [x, y] of [[32, 40], [68, 50], [40, 66], [62, 34]]) S.add(ellR(x, y, 3, 2), mat(ramp(0x5a8a3a), { tex: "fur", amp: 1 }), { on: 1, h: 1 });
  const C = S.render({ debug: p.debug, rim: !p.block });
  return p.hurt ? flash(C) : C;
}
export const pxRootHeart = {
  fw: Math.round(100 * HK), fh: Math.round(96 * HK), w: 50, h: 54,
  anims: { idle: [6, 6], move: [6, 6], wind: [4, 10, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], pulse: [4, 12, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = {};
    if (nm === "idle" || nm === "move") P = { beat: Math.max(0, Math.sin(ph * 2)) };
    if (nm === "wind") P = { beat: t, open: t };
    if (nm === "atk") P = { beat: 1, open: [1, 1.4, 1][f] };
    if (nm === "pulse") P = { beat: [1, 0.2, 1, 0.2][f], open: 0.6 };
    if (nm === "rec") P = { beat: 1 - t, open: 1 - t };
    if (nm === "hurt") P = { hurt: f === 0, beat: 0.5, open: 0.4 };
    return heartFrame(P);
  },
};
