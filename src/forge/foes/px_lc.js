// 리프크라운 몬스터 12종 (오른쪽을 본다) — 하늘에 뜬 거목 수관, 새 둥지 섬, 줄기 속 굴
//   아래(가지 층): 실 타는 애벌레 · 잎 카멜레온 · 가시 고슴도치 · [정예] 수관 거미
//   가운데(둥지 섬): 까치 도둑 · 최면 나비 · 아기새 떼 · [정예] 거대 어미새
//   위(나무 꼭대기): 호박 정령 · 나뭇잎 요정 궁수 · 딱따구리 기사 · [정예] 고목 수호 정령
//   작은 몬스터 = 부위 명암 손그림(kit board), 정예(큰 몬스터) = 높이 지도 조각(px3 sculpt)
import { board, ellR, capF, polyF, U, minus, pol, lerp, ik, ramp, rampF, rampGlow, mixc, dots, strokes, rot, eye, glass, limb, gait4, gait2, flapOf, spec, done, flash, T2, L } from "./kit.js";
import { sculpt, mat } from "./px3.js";

const LEAF = ramp(0x58b038), LEAFD = ramp(0x3e8a2a), BARK = ramp(0x7a5434), BARKF = rampF(0x6a4a2e), SILK = ramp(0xe8eef0);
const fadeD = (C, a) => { if (a <= 0) return; for (let i = 0; i < C.d.length; i++) if (C.d[i] >= 0 && ((i * 7 + Math.floor(i / C.W) * 3) % 10) / 10 < a) C.d[i] = -1; };

// ════ 실 타는 애벌레 ════ 통통한 연두 애벌레(마디·발·노란 점). 가지에 건 실을 타고 내려와 물고 다시 올라간다
//   p: thread 실 길이(위로) · curl 몸 말기 · bite · wave · hurt
const CAT = ramp(0x8ad040), CATB = ramp(0xe8e070);
function larvaFrame(p = {}) {
  const W = 30, H = 44, C = board(W, H);
  const th = p.thread ?? 14, cu = p.curl ?? 0, wv = p.wave ?? 0;
  const top = 30 - th;
  strokes(C, [[15, 0, 15, top + 2]], 0); // (빈 줄 자리)
  for (let y = Math.max(0, top - 30); y <= top + 2; y++) C.px(15, y, 0xe8eef0);
  // 마디 (위에서 아래로 매달림, 아래가 머리)
  const pts = [];
  for (let k = 0; k <= 5; k++) { const a = Math.PI / 2 + Math.sin(wv + k) * 0.25 + cu * k * 0.35; pts.push(k ? pol(pts[k - 1], a, 3.6) : [15, top + 3]); }
  for (let k = 0; k <= 5; k++) C.part(ellR(pts[k][0], pts[k][1], 4 - (k === 5 ? 0.4 : 0), 3.2), CAT, { shine: 1 });
  for (let k = 0; k < 5; k++) (C.over(pts[k][0] + 2, pts[k][1], CATB[4]), C.over(pts[k][0] - 2.5, pts[k][1] + 1, CAT[2]));
  const hd = pts[5];
  C.part(ellR(hd[0], hd[1] + 2.4, 3.4, 3), ramp(0x6a9a30), { shine: 1 });
  !p.hurt && (C.over(hd[0] - 1, hd[1] + 2, 0x101008), C.over(hd[0] + 1.4, hd[1] + 2, 0x101008));
  (p.bite ?? 0) > 0 && C.part(ellR(hd[0], hd[1] + 5, 1.6, 1 + p.bite), ramp(0x4a1a10), { sep: !1 });
  strokes(C, [[hd[0] - 1, hd[1] + 4, hd[0] - 3, hd[1] + 6], [hd[0] + 1, hd[1] + 4, hd[0] + 3, hd[1] + 6]], 0x2a3010);
  return done(C, p);
}
export const pxLarva = spec(30, 44, 12, 20,
  { idle: [4, 6], move: [4, 8], wind: [3, 10, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1], drop: [3, 12, !1], climb: [4, 10] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "drop") return { thread: 14 + t * 18, wave: ph };
    if (nm === "climb") return { thread: 32 - t * 18, wave: ph * 2, curl: 0.2 };
    if (nm === "wind") return { thread: 30, curl: t * 0.6 };
    if (nm === "atk") return { thread: 32, curl: -0.3, bite: 1 };
    if (nm === "rec") return { thread: 30, curl: 0.3 * (1 - t) };
    if (nm === "hurt") return { hurt: f === 0, thread: 28, curl: 0.8 };
    return { thread: nm === "move" ? 24 : 14, wave: ph };
  }, larvaFrame, { flying: !0 });

// ════ 잎 카멜레온 ════ 말린 꼬리 · 빙글 도는 눈 · 볏. 몸을 투명하게 감췄다가 긴 혀로 낚아챈다
//   p: legs · hide 투명(0~1) · tongue · eye 눈 돌림 · hurt
const CHA = ramp(0x6ac048), CHAB = ramp(0xd8e890);
function chameleonFrame(p = {}) {
  const W = 66, H = 30, G = H - 1, C = board(W, H);
  const lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) }, tg = p.tongue ?? 0;
  const leg = (sh, o, far) => { const ft = [sh[0] + o[0], G - o[1]], kn = [sh[0] + 1, sh[1] + 3]; C.part(U(capF(sh, kn, 1.6, 1.3), capF(kn, ft, 1.3, 1)), far ? rampF(0x6ac048) : CHA, { sep: !1, shine: !far }); C.part(ellR(ft[0], ft[1], 1.8, 1), far ? rampF(0x6ac048) : CHA, { sep: !1 }); };
  leg([24, 20], lg.ff, !0), leg([12, 20], lg.bf, !0);
  // 말린 꼬리
  const t0 = [7, 17], pts = [t0];
  for (let k = 1; k <= 7; k++) pts.push(pol(pts[k - 1], Math.PI * 0.9 + k * 0.62, 3.4 - k * 0.25));
  C.part(U(...pts.slice(1).map((q, k) => capF(pts[k], q, 2 - k * 0.2, 1.8 - k * 0.2))), CHA, { shine: 1 });
  // 몸 (옆으로 납작, 등 볏)
  const body = ellR(18, 15, 11, 6.4, -0.05);
  C.part(body, CHA, { shine: 1 });
  C.part((x, y) => body(x, y) && y > 17.5, CHAB, { sep: !1 });
  for (let k = 0; k < 6; k++) C.part(polyF([[10 + k * 3.4, 9.5], [12.5 + k * 3.4, 9.5], [11.2 + k * 3.4, 7]]), LEAFD, { sep: !1 });
  strokes(C, [[12, 13, 26, 13], [11, 16, 27, 16]], CHA[3]);
  // 머리 + 투구 볏 + 돌출 눈
  C.part(polyF([[27, 11], [33, 8], [36, 13], [34, 18], [27, 19]]), CHA, { shine: 1, lv: 0.05 });
  C.part(ellR(31, 12.5, 2.6, 2.6), CHA, { shine: 1, sep: !1 });
  !p.hurt && (C.over(31 + (p.eye ?? 0), 12.5, 0x101008), C.over(30.5, 11.6, 0xffffff));
  strokes(C, [[30, 17, 35.5, 15]], 0x1a3010);
  tg > 0 && (C.part(capF([35, 15], [35 + tg * 28, 14], 1, 0.8), ramp(0xe86a8a), { sep: !1 }), C.part(ellR(35 + tg * 28 + 1, 14, 2, 1.8), ramp(0xe86a8a), { sep: !1, shine: 1 }));
  leg([22, 21], lg.fn, !1), leg([10, 21], lg.bn, !1);
  C.selout();
  fadeD(C, (p.hide ?? 0) * 0.85);
  return p.hurt ? flash(C) : C;
}
export const pxChameleon = spec(66, 30, 22, 12,
  { hide: [2, 4], idle: [4, 4], move: [6, 8], wind: [3, 10, !1], atk: [4, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "hide") return { hide: 1, eye: f ? 1 : -1 };
    if (nm === "move") return { legs: gait4(f, n, 3, 1.5), eye: 1 };
    if (nm === "wind") return { eye: 1, hide: 0.3 * (1 - t) };
    if (nm === "atk") return { tongue: [0.5, 1, 1, 0.4][f] };
    if (nm === "rec") return { tongue: 0 };
    if (nm === "hurt") return { hurt: f === 0 };
    return { eye: Math.sin(ph) };
  }, chameleonFrame);

// ════ 가시 고슴도치 ════ 갈색 가시 망토 · 뾰족 주둥이. 몸을 말아 가시를 사방으로 쏘고, 공처럼 굴러 다닌다
//   p: curl(0~1) · roll · bristle 가시 세움 · legs · hurt
const HOG = ramp(0x8a6a4a), QUILL = ramp(0x5a4030), HOGF = ramp(0xd8b890);
function hedgehogFrame(p = {}) {
  const W = 40, H = 28, G = H - 1, C = board(W, H);
  const cu = p.curl ?? 0, br = p.bristle ?? 0, lp = p.legs ?? 0;
  const cx = 19, cy = G - 8 - cu * 2;
  // 가시 (뒤부터 방사형)
  const n = 14;
  for (let k = 0; k < n; k++) { const a = Math.PI + (k / (n - 1)) * Math.PI * (1 + cu) - cu * 0.5, r0 = 6 + cu, r1 = 11 + br * 3 + cu * 2; C.part(capF(pol([cx, cy], a, r0), pol([cx, cy], a, r1), 1.3, 0.3), QUILL, { sep: !1, shine: 1 }); C.over(...pol([cx, cy], a, r1 - 1), 0xf0e0c0); }
  C.part(ellR(cx, cy, 10 + cu, 7 + cu * 2), HOG, { shine: 1 });
  if (cu < 0.6) {
    C.part(ellR(cx + 2, cy + 3, 6, 3), HOGF, { sep: !1 });
    C.part(polyF([[cx + 6, cy - 2], [cx + 15, cy + 2], [cx + 7, cy + 5]]), HOGF, { shine: 1 });
    C.over(cx + 15, cy + 2, 0x201010);
    !p.hurt && (C.over(cx + 8, cy, 0x101008), C.over(cx + 8.5, cy - 0.5, 0xffffff));
    for (const [x, far] of [[cx - 4, 1], [cx + 4, 0]]) C.part(capF([x, cy + 5], [x + Math.sin(lp + far * 3) * 2, G], 1.2, 1), far ? rampF(0xd8b890) : HOGF, { sep: !1 });
  } else strokes(C, [[cx - 3, cy + 1, cx + 3, cy + 1]], HOG[2]);
  return done(C, p);
}
export const pxHedgehog = spec(40, 28, 18, 14,
  { idle: [4, 6], move: [6, 14], wind: [3, 10, !1], atk: [3, 14, !1], rec: [3, 10, !1], hurt: [2, 10, !1], roll: [4, 20] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "move") return { legs: ph * 2 };
    if (nm === "wind") return { curl: t, bristle: t };
    if (nm === "atk") return { curl: 1, bristle: [1.6, 1, 0.6][f] };
    if (nm === "roll") return { curl: 1, roll: ph, bristle: 0.4 };
    if (nm === "rec") return { curl: 1 - t };
    if (nm === "hurt") return { hurt: f === 0, bristle: 1 };
    return { bristle: Math.max(0, Math.sin(ph)) * 0.3 };
  }, hedgehogFrame);

// ════ 까치 도둑 ════ 검은 머리와 흰 배, 푸른 윤기 꼬리. 반짝이는 것을 노려 낚아채고 달아난다
//   p: flap · loot 부리에 문 반짝이 · tilt · hurt
const MAG = ramp(0x202430), MAGW = ramp(0xf0f0ec), MAGB = ramp(0x3a5aa8);
function magpieFrame(p = {}) {
  const W = 50, H = 34, C = board(W, H);
  const fl = p.flap ?? 0, R = rot([24, 16], p.tilt ?? 0), P = (x, y) => R([x, y]);
  const wing = (far) => { const root = P(24, 14), a = -2.1 - fl * 0.8 + (far ? -0.3 : 0), tip = pol(root, a, 17), m = pol(root, a + 0.6, 12); C.part(polyF([root, tip, m, P(28, 18)]), far ? rampF(0x202430) : MAG, { shine: !far }); !far && C.part(capF(lerp(root, m, 0.3), lerp(root, m, 0.8), 1.4, 1), MAGW, { sep: !1 }); };
  wing(!0);
  C.part(U(capF(P(14, 17), P(1, 14), 2.4, 1.4)), MAGB, { shine: 1 }); // 긴 꼬리
  C.part(ellR(...P(21, 17), 8, 4.6), MAG, { shine: 1 });
  C.part(ellR(...P(23, 19), 5, 2.6), MAGW, { sep: !1 });
  C.part(ellR(...P(30, 12), 4, 3.6), MAG, { shine: 1 });
  C.part(polyF([P(33, 11), P(38, 12.5), P(33, 14)]), ramp(0x2a2a30), { shine: 1 });
  !p.hurt && (C.over(...P(31.5, 11), 0x9a6a20), C.over(...P(32, 10.5), 0xffffff));
  p.loot && (C.part(ellR(...P(38, 13.4), 1.8, 1.6), ramp(0xffd040), { sep: !1, shine: 1 }), C.over(...P(38.4, 12.6), 0xffffff));
  wing(!1);
  return done(C, p);
}
export const pxMagpie = spec(50, 34, 18, 12,
  { idle: [4, 14], move: [4, 16], wind: [3, 10, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1], flee: [4, 18] },
  (nm, f, n, t) => {
    const fl = [1, 0.3, -1, 0.3][f % 4];
    if (nm === "wind") return { flap: fl, tilt: -0.2 * t };
    if (nm === "atk") return { flap: -1, tilt: 0.45 };
    if (nm === "flee") return { flap: fl, loot: 1, tilt: -0.15 };
    if (nm === "rec") return { flap: fl, tilt: 0.2 * (1 - t) };
    if (nm === "hurt") return { hurt: f === 0, flap: 0.5, tilt: -0.3 };
    return { flap: fl };
  }, magpieFrame, { flying: !0 });

// ════ 최면 나비 ════ 커다란 눈알 무늬 날개(보라·청록). 날개 가루를 뿌리면 잠깐 좌우가 헷갈린다
//   p: flap(0 접음 ~ 1 활짝) · dust · hurt
const BWG = ramp(0x8a5ad8), BWG2 = ramp(0x40c8c0);
function butterflyFrame(p = {}) {
  const W = 46, H = 40, C = board(W, H);
  const fl = p.flap ?? 1, sx = 0.25 + 0.75 * fl;
  // 앞에서 본 나비: 몸통이 가운데, 날개 넷이 양옆으로 (날갯짓 = 가로 폭)
  const wing = (side, up, far) => {
    const cx = 23 + side * (up ? 9 : 7) * sx, cy = up ? 14 : 25, rx = (up ? 9.5 : 7) * sx + 1, ry = up ? 9 : 6.5;
    const f = ellR(cx, cy, rx, ry, side * (up ? -0.35 : 0.4));
    C.part(f, far ? rampF(up ? 0x8a5ad8 : 0x40c8c0) : up ? BWG : BWG2, { shine: !far, flat: 0.5 });
    if (up && sx > 0.45) {
      const ex = cx + side * rx * 0.15;
      C.part(ellR(ex, cy - 1, 3.4 * sx + 0.6, 3.4), ramp(0xf8e070), { sep: !1 });
      C.part(ellR(ex, cy - 1, 1.8 * sx + 0.3, 1.8), ramp(0x202030), { sep: !1 });
      C.over(ex - 0.5, cy - 1.8, 0xffffff);
    }
    strokes(C, [[23 + side * 2, cy, cx + side * rx * 0.7, cy + (up ? -3 : 3)]], (up ? BWG : BWG2)[2]);
    up && C.over(cx + side * rx * 0.75, cy - ry * 0.5, 0xffffff);
  };
  wing(-1, !1, !0), wing(1, !1, !0);
  wing(-1, !0, !1), wing(1, !0, !1);
  C.part(capF([23, 11], [23, 30], 2.2, 1.6), ramp(0x3a2a4a), { shine: 1 });
  for (let k = 0; k < 4; k++) C.over(23, 18 + k * 3, 0x5a4a6a);
  C.part(ellR(23, 9, 2.6, 2.4), ramp(0x3a2a4a), { shine: 1 });
  strokes(C, [[24, 7, 28, 1], [22, 7, 18, 1]], ramp(0x3a2a4a)[3]);
  C.over(28, 1, 0xf0e0ff).over(18, 1, 0xf0e0ff);
  !p.hurt && (C.over(22, 9, 0xf0e0ff), C.over(24, 9, 0xf0e0ff));
  (p.dust ?? 0) > 0 && dots(C, [[14, 34], [20, 37], [30, 36], [36, 32], [10, 30], [26, 38]], 0xf0d8ff);
  return done(C, p);
}
export const pxButterfly = spec(46, 40, 20, 18,
  { idle: [4, 10], move: [4, 12], wind: [3, 10, !1], atk: [4, 12, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const fl = [1, 0.5, 0, 0.5][f % 4];
    if (nm === "wind") return { flap: 1 - t * 0.6 };
    if (nm === "atk") return { flap: [0, 1, 0, 1][f], dust: 1 };
    if (nm === "rec") return { flap: fl };
    if (nm === "hurt") return { hurt: f === 0, flap: 0.3 };
    return { flap: fl };
  }, butterflyFrame, { flying: !0 });

// ════ 아기새 떼 ════ 둥지에서 뛰쳐나온 솜털 아기새 셋. 우르르 몰려와 쪼아 댄다
//   p: hop 위상 · peck · hurt
const CHK = ramp(0xf8d050), CHKD = ramp(0xe8a038);
function chicksFrame(p = {}) {
  const W = 46, H = 24, G = H - 1, C = board(W, H);
  const hp = p.hop ?? 0, pk = p.peck ?? 0;
  const chick = (x, k, far) => {
    const y = G - 5 - Math.abs(Math.sin(hp + k * 2)) * 3;
    C.part(ellR(x, y, 5, 4.6), far ? rampF(0xf8d050) : CHK, { shine: !far });
    C.part(ellR(x - 3, y - 1, 2.4, 1.8, 0.6), far ? rampF(0xe8a038) : CHKD, { sep: !1 });
    C.part(ellR(x + 2, y - 5, 3.4, 3), far ? rampF(0xf8d050) : CHK, { shine: !far });
    C.part(polyF([[x + 4.5, y - 5.5], [x + 7.5 + pk * 1.5, y - 4.6 + pk], [x + 4.5, y - 3.6]]), ramp(0xf08030), { sep: !1 });
    !p.hurt && C.over(x + 3, y - 6, 0x101008);
    C.over(x + 1, y - 8, CHK[5]).over(x + 2, y - 8.5, CHK[5]);
    C.part(U(capF([x - 1, y + 3], [x - 1, G], 0.6), capF([x + 1, y + 3], [x + 1.5, G], 0.6)), ramp(0xf08030), { sep: !1 });
  };
  chick(11, 0, 1), chick(33, 2, 1), chick(22, 1, 0);
  return done(C, p);
}
export const pxChicks = spec(46, 24, 26, 12,
  { idle: [4, 8], move: [4, 12], wind: [3, 10, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "move") return { hop: ph };
    if (nm === "wind") return { hop: 0, peck: -0.5 * t };
    if (nm === "atk") return { peck: [1, 0, 1][f], hop: f };
    if (nm === "hurt") return { hurt: f === 0 };
    return { hop: Math.sin(ph) * 0.4 };
  }, chicksFrame);

// ════ 호박 정령 ════ 굳은 수액(호박) 몸 속에 잎과 작은 벌레가 갇혀 있다. 끈적한 수액 덩이를 던져 굳힌다
//   p: wob · drip · throw 팔 · hurt
const AMB = rampGlow(0xf0a028), AMBD = ramp(0xc87818);
function amberFrame(p = {}) {
  const W = 36, H = 42, C = board(W, H);
  const wb = p.wob ?? 0, th = p.throw ?? 0;
  const body = U(ellR(18, 22 + wb, 10, 12 - wb), polyF([[13, 12], [18, 4 - wb * 2], [23, 12]]));
  C.part(body, AMB, { shine: 1 });
  C.part((x, y) => body(x, y) && (x - 13) ** 2 + (y - 15) ** 2 < 14, ramp(0xfff0c0), { sep: !1 });
  // 갇힌 잎과 벌레
  C.part(ellR(20, 26, 3, 1.6, 0.6), ramp(0x6a7a30), { sep: !1 });
  C.part(ellR(15, 30, 1.6, 1), ramp(0x3a2a1a), { sep: !1 });
  !p.hurt && (C.over(15, 19, 0x4a2a08), C.over(21, 19, 0x4a2a08), C.over(15, 18, 0xffffff));
  // 팔 (수액 덩이)
  const s = [26, 22], h = th > 0.5 ? pol(s, -2.2 + (th - 0.5) * 3.6, 7) : pol(s, 1 - th * 2, 6);
  C.part(capF(s, h, 2.4, 2), AMB, { shine: 1 });
  th > 0 && th < 0.9 && C.part(ellR(h[0], h[1], 3.4, 3), AMBD, { sep: !1, shine: 1 });
  dots(C, [[12, 35 + (p.drip ?? 0) * 3], [24, 36]], 0xf0a028);
  return done(C, p);
}
export const pxAmber = spec(36, 42, 16, 22,
  { idle: [6, 8], move: [6, 10], wind: [3, 10, !1], atk: [3, 14, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "wind") return { throw: 0.4 + t * 0.4, wob: t };
    if (nm === "atk") return { throw: [0.8, 1.2, 1.4][f] };
    if (nm === "rec") return { throw: 0, wob: Math.sin(t * 5) * 0.5 };
    if (nm === "hurt") return { hurt: f === 0, wob: 1 };
    return { wob: Math.sin(ph) * 0.7, drip: (f % 3) / 2 };
  }, amberFrame, { flying: !0 });

// ════ 나뭇잎 요정 궁수 ════ 잎사귀 망토와 두건을 쓴 작은 요정. 덩굴 활을 당겨 쏘고 뒤로 물러난다
//   p: bob · legs · draw 시위 당김(0~1) · hurt
const FSK = ramp(0xf0d0b0), CLOAK = ramp(0x4a9a3a), BOWW = ramp(0x8a5a30);
function archerFrame(p = {}) {
  const W = 40, H = 40, G = H - 1, C = board(W, H);
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, dr = p.draw ?? 0;
  glass(C, ellR(10, 16 + b, 7, 3, -0.6), 0.1, !0, 0xe8ffe0); // 투명 날개
  for (const [o, far] of [[g.f, 1], [g.n, 0]]) C.part(capF([17 + (far ? -1.5 : 1.5), 28 + b], [17 + (far ? -1.5 : 1.5) + o[0], G - o[1]], 1.3, 1.1), far ? rampF(0x6a4a30) : ramp(0x6a4a30), { sep: !1 });
  // 잎 망토 몸
  C.part(polyF([[12, 16 + b], [22, 16 + b], [24, 30 + b], [20, 28 + b], [17, 31 + b], [14, 28 + b], [10, 30 + b]]), CLOAK, { shine: 1 });
  strokes(C, [[17, 17 + b, 17, 29 + b], [14, 20 + b, 12, 27 + b], [20, 20 + b, 22, 27 + b]], CLOAK[2]);
  // 머리 + 잎 두건 + 뾰족 귀
  C.part(ellR(19, 11 + b, 4.2, 4), FSK, { shine: 1 });
  C.part(minus(ellR(18, 9 + b, 5, 4.4), (x, y) => x > 19.5 && y > 8.5 + b), CLOAK, { shine: 1 });
  C.part(polyF([[15, 11 + b], [11, 8 + b], [15.5, 9.5 + b]]), FSK, { sep: !1 });
  !p.hurt && (C.over(21, 11 + b, 0x2a5a20), C.over(21.5, 10.4 + b, 0xffffff));
  // 덩굴 활 + 화살 (앞)
  const bx = 27, by = 18 + b;
  C.part(U(capF([bx - 1, by - 10], [bx + 2, by], 0.9, 0.9), capF([bx + 2, by], [bx - 1, by + 10], 0.9, 0.9)), BOWW, { shine: 1 });
  const nx = bx - 2 - dr * 5;
  strokes(C, [[bx - 1, by - 10, nx, by], [nx, by, bx - 1, by + 10]], 0xe8e8e0);
  dr > 0.2 && (strokes(C, [[nx, by, bx + 7, by]], 0x8a5a30), C.part(polyF([[bx + 7, by - 1.4], [bx + 10, by], [bx + 7, by + 1.4]]), ramp(0x9ab0b8), { sep: !1 }));
  C.part(capF([20, 20 + b], [bx, by], 1.2, 1), CLOAK, { sep: !1 }); // 활 쥔 팔
  C.part(capF([19, 21 + b], [nx, by], 1.1, 0.9), FSK, { sep: !1 }); // 시위 당긴 팔
  return done(C, p);
}
export const pxArcher = spec(40, 40, 12, 20,
  { idle: [4, 6], move: [6, 12], wind: [4, 10, !1], atk: [2, 14, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "move") { const g = gait2(f, n, 3, 2); return { legs: g, bob: g.bob }; }
    if (nm === "wind") return { draw: t };
    if (nm === "atk") return { draw: f === 0 ? 1 : 0 };
    if (nm === "hurt") return { hurt: f === 0 };
    return { bob: Math.sin(ph) * 0.5, draw: 0.1 };
  }, archerFrame);

// ════ 딱따구리 기사 ════ 붉은 볏 투구 · 나무껍질 흉갑 · 송곳 같은 부리. 부리로 쉴 새 없이 쪼는 연타
//   p: bob · legs · peck 쪼기(0~1) · lean · hurt
const WPK = ramp(0x2a2a34), WPKW = ramp(0xf0f0e8), CREST2 = ramp(0xd83a2a);
function woodpeckerFrame(p = {}) {
  const W = 46, H = 46, G = H - 1, C = board(W, H);
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, pk = p.peck ?? 0, ln = p.lean ?? 0;
  // 꼬리 깃 (지지대)
  C.part(polyF([[12, 26 + b], [6, 38 + b], [10, 39 + b], [15, 30 + b]]), WPK, { shine: 1 });
  for (const [o, far] of [[g.f, 1], [g.n, 0]]) { const s = [17 + (far ? -1 : 1), 32 + b], ft = [s[0] + o[0] + 1, G - o[1]]; C.part(capF(s, ft, 1.3, 1), ramp(0x8a8a90), { sep: !1 }); C.part(U(capF(ft, [ft[0] + 3, ft[1]], 0.6), capF(ft, [ft[0] - 2, ft[1]], 0.6)), ramp(0x8a8a90), { sep: !1 }); }
  // 몸 + 나무껍질 흉갑
  const sx = 19 + ln * 4;
  C.part(ellR(sx, 26 + b, 7, 9, 0.2 + ln * 0.3), WPK, { shine: 1 });
  C.part(polyF([[sx - 4, 19 + b], [sx + 5, 21 + b], [sx + 4, 33 + b], [sx - 3, 31 + b]]), BARK, { shine: 1, flat: 0.6 });
  strokes(C, [[sx, 21 + b, sx + 1, 32 + b]], BARK[2]);
  C.part(ellR(sx - 4, 24 + b, 3, 6, 0.3), WPKW, { sep: !1, shine: 1 }); // 날개 흰 무늬
  // 머리 (붉은 볏 투구) + 긴 부리
  const hx = sx + 6 + pk * 3, hy = 14 + b + pk * 2;
  C.part(ellR(hx, hy, 5, 4.6), WPK, { shine: 1, lv: 0.05 });
  C.part(ellR(hx + 1, hy + 1.5, 3, 2), WPKW, { sep: !1 });
  C.part(polyF([[hx - 5, hy - 2], [hx - 2, hy - 8], [hx + 3, hy - 6], [hx + 3, hy - 3]]), CREST2, { shine: 1 });
  C.part(polyF([[hx + 3, hy - 1], [hx + 14 + pk * 2, hy + 1], [hx + 3, hy + 2]]), ramp(0x9aa0a8), { shine: 1 });
  !p.hurt && (C.over(hx + 1.6, hy - 1, 0x101010), C.over(hx + 2, hy - 1.6, 0xffffff));
  return done(C, p);
}
export const pxWoodpecker = spec(46, 46, 14, 26,
  { idle: [4, 6], move: [6, 12], wind: [3, 10, !1], atk: [4, 22], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "move") { const g = gait2(f, n, 2.5, 2.5); return { legs: g, bob: g.bob - 0.5, lean: 0.1 }; }
    if (nm === "wind") return { peck: -0.4 * t, lean: -0.2 * t };
    if (nm === "atk") return { peck: f % 2 ? 1 : 0.2, lean: 0.4 };
    if (nm === "rec") return { peck: 0, lean: 0.3 * (1 - t) };
    if (nm === "hurt") return { hurt: f === 0, lean: -0.3 };
    return { bob: Math.sin(ph) * 0.4 };
  }, woodpeckerFrame);

// ════════════ 정예 (큰 몬스터 조각 도구) ════════════
// 재질: 7단 색 묶음 + 질감
const TEXM = (c, o = {}) => mat(ramp(c, o), o);

// ════ [정예] 수관 거미 ════ 잎 무늬 배를 가진 커다란 숲 거미. 여덟 다리 · 독 송곳니 · 눈 여덟(둘은 크게).
//   가지 사이에 거미줄 덫을 놓고, 실을 타고 내려와 문다
//   p: bob · legs 위상 · fang 송곳니 벌림 · rear 앞다리 치켜들기 · spin 실 뽑기(배 들기) · hang 실 길이(위로) · hurt
const SPK = 0.72; // 설계 96×74 → 69×53
const SPB = mat(ramp(0x3a4a2a), { tex: "fur", amp: 0.5, dir: 1.2 }), SPBF = mat(rampF(0x3a4a2a), { tex: "fur", amp: 0.4, dir: 1.2 });
const SPA = mat(ramp(0x5a7a34), { tex: "skin", amp: 0.2 }), SPAL = mat(ramp(0x9ad050), { tex: "skin", amp: 0.1 });
const SPLEG = mat(ramp(0x2e3a22), { tex: "fur", amp: 0.6, dir: 1.6 }), SPLEGF = mat(rampF(0x2e3a22), { tex: "fur", amp: 0.5, dir: 1.6 });
const FANG = mat(ramp(0xd8d0b0), { spec: 0.4 });
function spiderFrame(p = {}) {
  const W = 96, H = 74, G = H - 1, S = sculpt(W, H, { k: p.k ?? SPK, ax: 46 }), b = p.bob ?? 0;
  const lp = p.legs ?? 0, rr = p.rear ?? 0, sp = p.spin ?? 0, hg = p.hang ?? 0;
  const cy = 60 + b - hg * 14;
  // 실 (매달렸을 때)
  hg > 0 && S.add(capF([52, 0], [52, cy - 10], 0.5), mat(ramp(0xe8f0f4)), { h: 0.5, z: -6 });
  // 다리 여덟: 몸 둘레에서 위로 꺾였다 땅으로. 뒤쪽(먼) 넷 먼저
  const leg = (sx, sy, dir, k, far) => {
    const ph = lp + k * 1.3 + (far ? 1.6 : 0), lift = Math.max(0, Math.sin(ph)) * 3;
    const front = k >= 2, up = front && !far && rr > 0 ? rr : 0;
    // 무릎은 몸보다 높이 솟고(아치), 발은 몸에서 멀리 벌어진다. 뒷다리 둘은 배 너머 뒤로
    const reach = dir < 0 ? 30 + (k % 2) * 14 : 26 + (k % 2) * 12;
    const kn = [sx + dir * reach * 0.45, sy - 22 - (k % 2) * 5 - lift - up * 8];
    const ft = up > 0 ? [sx + dir * 28, sy - 26 - up * 6] : [sx + dir * reach + Math.cos(ph) * 2, (hg ? sy + 10 : G) - lift * 0.6];
    const m = far ? SPLEGF : SPLEG;
    S.add(capF([sx, sy], kn, 2.4, 1.9), m, { z: far ? -4 : 2, h: 2.2 });
    S.add(capF(kn, ft, 1.9, 0.8), m, { z: far ? -4 : 2, h: 1.8 });
    S.add(ellR(kn[0], kn[1], 2.3, 2.3), m, { blend: 1, h: 0.8 });
    return kn;
  };
  for (let k = 0; k < 4; k++) leg(48 + (k < 2 ? -2 : 2), cy - 3, k < 2 ? -1 : 1, k, !0);
  // 배 (뒤, 크고 둥근) + 잎맥 무늬
  const ab = [26, cy - 8 - sp * 6];
  S.add(ellR(ab[0], ab[1], 20, 15, -0.2 - sp * 0.3), SPA, { h: 14 });
  S.paint((x, y) => {
    const u = (x - ab[0]) / 20, v = (y - ab[1]) / 15;
    return u * u + v * v < 1 && (Math.abs(v + u * 0.2) < 0.08 || Math.abs(Math.abs(v) - Math.abs(u + 0.3) * 0.7) < 0.07);
  }, SPAL);
  for (const [dx, dy] of [[-6, -6], [4, -8], [-10, 2]]) S.add(ellR(ab[0] + dx, ab[1] + dy, 2.6, 1.8), SPAL, { blend: 1.5, h: 1.2 });
  S.tone(ellR(ab[0] + 6, ab[1] + 9, 14, 6), -0.12);
  S.add(capF([ab[0] - 18, ab[1] + 6], [ab[0] - 22, ab[1] + 9], 1.6, 1), SPB, { h: 1.4 }); // 실샘
  // 머리가슴 (앞)
  const hc = [56, cy - 8];
  S.add(ellR(hc[0], hc[1], 12, 9.5), SPB, { h: 9 });
  S.add(ellR(hc[0] + 7, hc[1] - 3, 6.5, 5.5), SPB, { blend: 3, h: 3 });
  S.carve(capF([hc[0] - 4, hc[1] - 7], [hc[0] + 1, hc[1] + 3], 0.7), 1);
  // 송곳니 (아래로, 벌리면 바깥으로)
  const fg = p.fang ?? 0;
  for (const s of [-1, 1]) { const r0 = [hc[0] + 11, hc[1] + 3 + s * 1.5], r1 = [r0[0] + 3 + fg * 2, r0[1] + 6 + s * fg * 2]; S.add(capF(r0, r1, 2, 0.6), FANG, { h: 1.6, lift: 4 }); }
  S.add(capF([hc[0] + 10, hc[1] + 1], [hc[0] + 13, hc[1] + 3], 2.2, 1.6), SPB, { h: 2, lift: 3 }); // 더듬이 수염
  // 앞다리 넷 (가까운)
  for (let k = 0; k < 4; k++) leg(52 + (k < 2 ? -2 : 2), cy - 1, k < 2 ? -1 : 1, k, !1);
  // 눈 여덟 (큰 둘 + 작은 여섯)
  if (!p.block) {
    const ec = p.hurt ? 0x3a3a2a : 0xd8f040;
    for (const [x, y, big] of [[64.5, cy - 13, 1], [61.5, cy - 13.5, 1], [66, cy - 16, 0], [63, cy - 16.5, 0], [60, cy - 16, 0], [67, cy - 11, 0]]) {
      S.decal(x, y, ec);
      big && (S.decal(x + 1, y, ec), S.decal(x, y - 1, 0xffffff));
    }
  }
  const C = S.render({ debug: p.debug, rim: !p.block });
  return p.hurt ? flash(C) : C;
}
export const pxSpider = {
  fw: Math.round(96 * SPK), fh: Math.round(74 * SPK), w: 36, h: 24,
  anims: { idle: [4, 6], move: [6, 12], wind: [4, 10, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1], web: [4, 10, !1], hang: [4, 6] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = {};
    if (nm === "idle") P = { bob: Math.sin(ph) * 0.5, legs: Math.sin(ph) * 0.3 };
    if (nm === "move") P = { legs: ph * 2, bob: -Math.abs(Math.sin(ph * 2)) * 0.8 };
    if (nm === "wind") P = { rear: t, fang: t, bob: t };
    if (nm === "atk") P = { rear: 0.3, fang: [1, 1.4, 1][f], bob: -1, legs: 1 };
    if (nm === "rec") P = { rear: 0.4 * (1 - t), fang: 1 - t };
    if (nm === "web") P = { spin: [0.4, 1, 1, 0.5][f], fang: 0.3 };
    if (nm === "hang") P = { hang: 1, legs: Math.sin(ph) * 0.5, bob: Math.sin(ph) };
    if (nm === "hurt") P = { hurt: f === 0, rear: 0.2, fang: 0.8 };
    return spiderFrame(P);
  },
};

// ════ [정예] 거대 어미새 ════ 둥지를 지키는 큰 숲새. 주홍 가슴 털 · 금빛 볏 · 넓은 날개. 깃털 탄막 · 돌풍 · 아기새를 부른다
//   p: flap(-1~1) · tilt · beak 부리 벌림 · fluff 가슴털 부풀림 · talon 발톱 · hurt
const MBK = 0.72;
const MB_BACK = mat(ramp(0x6a4a2e), { tex: "fur", amp: 0.7, dir: 0.4 }), MB_BACKF = mat(rampF(0x6a4a2e), { tex: "fur", amp: 0.6, dir: 0.4 });
const MB_CH = mat(ramp(0xe0702e), { tex: "fur", amp: 0.8, dir: 1.5 }), MB_CR = mat(ramp(0xf0c040), { tex: "fur", amp: 0.5, dir: -1.2 });
const MB_BEAK = mat(ramp(0xe8b830), { spec: 0.4 }), MB_TAL = mat(ramp(0x4a3a30), { spec: 0.3 }), MB_WHITE = mat(ramp(0xf0ead8), { tex: "fur", amp: 0.4, dir: 1.5 });
function motherFrame(p = {}) {
  const W = 112, H = 92, S = sculpt(W, H, { k: p.k ?? MBK, ax: 56 });
  const fl = p.flap ?? 0, R = rot([56, 48], p.tilt ?? 0), P = (x, y) => R([x, y]), fz = p.fluff ?? 0;
  // 날개 (먼 쪽 먼저): 어깨 → 손목 → 깃 끝. 깃은 칸칸이
  const wing = (far) => {
    const root = P(50, 36), a = -2.1 - fl * 0.85 + (far ? -0.3 : 0), len = 46, m = far ? MB_BACKF : MB_BACK;
    const wr = pol(root, a + 0.35, len * 0.45), tip = pol(root, a, len);
    S.add(U(capF(root, wr, 6, 4.6), capF(wr, tip, 4.6, 2.4)), m, { z: far ? -6 : 8, h: 4 });
    for (let k = 0; k < 7; k++) { const q = lerp(wr, tip, k / 7), fa = a + 1.6 + k * 0.05; S.add(capF(q, pol(q, fa, 16 - k * 1.1), 2.6, 1), k % 2 ? m : far ? MB_BACKF : MB_WHITE, { z: far ? -7 : 7, h: 1.6 }); }
    S.add(capF(lerp(root, wr, 0.2), lerp(wr, tip, 0.4), 4, 3), m, { blend: 2, h: 1.2 });
  };
  wing(!0);
  // 꼬리깃 (부채)
  for (let k = -2; k <= 2; k++) S.add(capF(P(30, 54), P(12, 56 + k * 4), 3.4, 1.8), k % 2 ? MB_BACK : MB_BACKF, { z: -2, h: 2 });
  // 몸통 + 주홍 가슴 (부풀면 크게)
  S.add(ellR(...P(52, 50), 22, 15, -0.15), MB_BACK, { z: 0, h: 13 });
  S.add(ellR(...P(64, 52), 13 + fz * 3, 13 + fz * 2), MB_CH, { blend: 5, h: 7 + fz * 2 });
  for (let k = 0; k < 5; k++) S.carve(capF(P(58 + k * 2.5, 44 + k * 3), P(66 + k * 2, 46 + k * 3), 0.5), 0.8);
  // 발 (발톱)
  const tl = p.talon ?? 0;
  for (const [x, far] of [[50, 1], [58, 0]]) { const s = P(x, 62), ft = P(x + tl * 8, 72 + tl * 3); S.add(capF(s, ft, 2.2, 1.6), MB_TAL, { z: far ? -2 : 4, h: 1.6 }); for (const d of [-0.6, 0, 0.6]) S.add(capF(ft, pol(ft, 1.2 + d - tl * 0.8, 4.6), 1.1, 0.4), MB_TAL, { z: far ? -2 : 5, h: 1 }); }
  // 머리 + 금빛 볏 + 부리
  const hc = P(76, 30);
  S.add(capF(P(66, 40), hc, 9, 8), MB_BACK, { blend: 3, h: 6 });
  S.add(ellR(hc[0], hc[1], 10, 9), MB_BACK, { h: 9 });
  S.add(ellR(hc[0] + 3, hc[1] + 5, 6, 4.5), MB_CH, { blend: 2, h: 2 });
  for (let k = 0; k < 4; k++) S.add(capF(P(72 - k * 3, 22 - k * 0.5), P(66 - k * 4, 10 + k * 1.5), 2.2, 0.7), MB_CR, { h: 2, lift: 3 });
  const bk = p.beak ?? 0;
  S.add(polyF([P(84, 27), P(97, 31), P(85, 34)]), MB_BEAK, { h: 3, lift: 3 });
  bk > 0.2 && S.add(polyF([P(84, 34), P(95, 34 + bk * 4), P(85, 37 + bk)]), MB_BEAK, { h: 2, lift: 3 });
  if (!p.block && !p.hurt) { const e0 = P(81, 27); S.decal(e0[0], e0[1], 0x1a0c08).decal(e0[0] + 1, e0[1], 0x1a0c08).decal(e0[0], e0[1] - 1, 0xffe880).decal(e0[0] + 1, e0[1] - 1, 0xffffff); }
  wing(!1);
  const C = S.render({ debug: p.debug, rim: !p.block });
  return p.hurt ? flash(C) : C;
}
export const pxMother = {
  fw: Math.round(112 * MBK), fh: Math.round(92 * MBK), w: 38, h: 30, flying: !0,
  anims: { idle: [4, 12], move: [4, 14], wind: [4, 10, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1], volley: [4, 12, !1], gust: [5, 12, !1], call: [4, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), fl = [1, 0.3, -1, 0.3][f % 4];
    let P = { flap: fl };
    if (nm === "wind") P = { flap: fl * 0.5, tilt: -0.2 * t, fluff: t, beak: t * 0.5 };
    if (nm === "atk") P = { flap: -1, tilt: 0.45, talon: 1, beak: 1 };
    if (nm === "volley") P = { flap: [1, 1, -1, -1][f], fluff: 1, tilt: -0.1, beak: 0.6 };
    if (nm === "gust") P = { flap: [1, 1, -1, -1, 0][f], tilt: -0.2 };
    if (nm === "call") P = { flap: fl, beak: f % 2 ? 1.2 : 0.4, fluff: 0.6, tilt: -0.15 };
    if (nm === "rec") P = { flap: fl, tilt: 0.2 * (1 - t) };
    if (nm === "hurt") P = { hurt: f === 0, flap: 0.5, tilt: -0.3, beak: 1 };
    return motherFrame(P);
  },
};

// ════ [정예] 고목 수호 정령 ════ 오래된 나무에 깃든 정령. 갈라진 나무껍질 몸통 · 옹이 구멍에서 빛나는 눈 · 이끼 수염 ·
//   가지 팔 · 뿌리 다리 · 머리에 잎 왕관. 가지 채찍 · 땅에서 뿌리 솟구치기 · 잎 폭풍
//   p: bob · step · arm 가지 팔(0 내림 ~ 1 휘두르기 위 ~ 2 내려침) · glow 눈 빛 · storm 잎 · hurt
const GK = 0.72;
const GBARK = mat(ramp(0x6a4a30), { tex: "wood", amp: 1.1, dir: 1.5 }), GBARKF = mat(rampF(0x6a4a30), { tex: "wood", amp: 0.9, dir: 1.5 });
const GLEAF = mat(ramp(0x4a9a34), { tex: "fur", amp: 0.9, dir: 0.8 }), GLEAFL = mat(ramp(0x8ad050), { tex: "fur", amp: 0.6, dir: 0.8 });
const GMOSS = mat(ramp(0x5a8a3a), { tex: "fur", amp: 1, dir: 1.55 }), GROOT = mat(ramp(0x5a3e28), { tex: "wood", amp: 1, dir: 1.2 });
function guardianFrame(p = {}) {
  const W = 104, H = 104, G = H - 1, S = sculpt(W, H, { k: p.k ?? GK, ax: 50 }), b = p.bob ?? 0, st = p.step ?? 0, ar = p.arm ?? 0;
  // 먼 가지 팔
  const sF = [36, 44 + b], eF = [26, 60 + b], hF = [22, 74 + b];
  S.add(U(capF(sF, eF, 5, 4), capF(eF, hF, 4, 2.4)), GBARKF, { z: -4, h: 4 });
  S.add(capF(hF, [16, 80 + b], 1.6, 0.6), GBARKF, { z: -4, h: 1.4 });
  // 뿌리 다리 (뒤 → 앞)
  for (const [x, far, s] of [[40, 1, -st], [58, 0, st]]) {
    const top = [x, 70 + b], ft = [x + s, G - 3];
    S.add(capF(top, ft, 8, 6), far ? GBARKF : GBARK, { z: far ? -2 : 4, h: 6 });
    for (const d of [-1, 1]) S.add(capF([ft[0], ft[1]], [ft[0] + d * 10, G], 3, 1.2), GROOT, { z: far ? -2 : 5, h: 2 });
  }
  // 몸통 (굵은 줄기) + 갈라진 껍질 홈 + 이끼
  S.add(polyF([[34, 32 + b], [66, 30 + b], [70, 50 + b], [64, 74 + b], [36, 74 + b], [30, 52 + b]]), GBARK, { z: 0, h: 14, prof: "flat" });
  for (const [x0, y0, x1, y1] of [[40, 36, 38, 70], [48, 34, 47, 72], [56, 33, 58, 70], [63, 40, 61, 66]]) S.carve(capF([x0, y0 + b], [x1, y1 + b], 0.8), 1.6);
  S.add(ellR(50, 62 + b, 6, 4.5), GBARK, { blend: 2, h: 2 }); // 옹이
  S.carve(ellR(50, 62 + b, 2.4, 1.8), 2.5, !1);
  S.add(polyF([[38, 48 + b], [62, 48 + b], [60, 58 + b], [54, 56 + b], [50, 62 + b], [46, 56 + b], [40, 58 + b]]), GMOSS, { on: 1, h: 1.6 }); // 이끼 수염
  // 얼굴: 옹이 구멍 두 눈 + 입 구멍
  if (!p.block) {
    S.carve(ellR(44, 42 + b, 3.2, 2.6), 3, !1).carve(ellR(57, 41 + b, 3.2, 2.6), 3, !1).carve(capF([46, 50 + b], [55, 49.5 + b], 1.2), 2.4, !1);
    const ec = p.hurt ? 0x2a3010 : mixc(0x6a9a30, 0xe8ff90, Math.min(1, p.glow ?? 0.6));
    for (const [x, y] of [[44, 42], [57, 41]]) S.decal(x, y + b, ec).decal(x + 1, y + b, ec).decal(x, y - 1 + b, 0xffffff);
  }
  // 잎 왕관 (머리 위 덩이들)
  for (const [x, y, rx, ry, m] of [[38, 26, 12, 8, GLEAF], [62, 24, 13, 9, GLEAF], [50, 18, 14, 10, GLEAFL], [30, 32, 8, 6, GLEAF], [70, 32, 8, 6, GLEAF]]) S.add(ellR(x, y + b, rx, ry), m, { z: 6, h: 7 });
  for (let k = 0; k < 6; k++) S.add(ellR(36 + k * 5.6, 16 + b + (k % 2) * 4, 2.4, 1.8), GLEAFL, { blend: 1.5, h: 1.4 });
  // 가까운 가지 팔 (휘두르기)
  const sN = [64, 44 + b], a = ar > 1 ? 0.6 + (ar - 1) * 0.8 : 1.3 - ar * 2.9, eN = pol(sN, a, 16), hN = pol(eN, a + (ar > 0.5 && ar <= 1 ? -0.5 : 0.4), 14);
  S.add(U(capF(sN, eN, 5.6, 4.4), capF(eN, hN, 4.4, 2.6)), GBARK, { z: 8, h: 4.5 });
  for (const d of [-0.7, 0, 0.7]) S.add(capF(hN, pol(hN, a + d, 7), 1.6, 0.5), GBARK, { z: 9, h: 1.4 }); // 가지 손가락
  S.add(ellR(...lerp(sN, eN, 0.6), 4, 2.6), GLEAF, { z: 10, h: 2 }); // 팔에 돋은 잎
  // 잎 폭풍 (흩날리는 잎)
  if ((p.storm ?? 0) > 0) for (let k = 0; k < 10; k++) { const ang = k * 0.63 + (p.storm * 3), r = 30 + (k % 3) * 8; S.add(ellR(50 + Math.cos(ang) * r, 50 + b + Math.sin(ang) * r * 0.6, 2.4, 1.4, ang), GLEAFL, { z: 14, h: 1 }); }
  const C = S.render({ debug: p.debug, rim: !p.block });
  return p.hurt ? flash(C) : C;
}
export const pxGuardian = {
  fw: Math.round(104 * GK), fh: Math.round(104 * GK), w: 30, h: 52,
  anims: { idle: [4, 5], move: [6, 7], wind: [4, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], roots: [4, 8, !1], storm: [6, 12] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = {};
    if (nm === "idle") P = { bob: Math.sin(ph) * 0.6, glow: 0.6 + 0.2 * Math.sin(ph) };
    if (nm === "move") P = { step: Math.sin(ph) * 4, bob: -Math.abs(Math.sin(ph)) * 1.4 };
    if (nm === "wind") P = { arm: t, glow: 0.8, bob: -t };
    if (nm === "atk") P = { arm: [1.4, 2, 2][f], bob: 1.5, glow: 1 };
    if (nm === "rec") P = { arm: 2 - 2 * t, bob: 1.5 * (1 - t) };
    if (nm === "roots") P = { arm: 0.4, bob: [0, 2, 2, 1][f], glow: 1.2 };
    if (nm === "storm") P = { storm: f / n, arm: 0.6, glow: 1 };
    if (nm === "hurt") P = { hurt: f === 0, bob: 1 };
    return guardianFrame(P);
  },
};
