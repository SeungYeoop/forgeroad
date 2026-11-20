// 모스바크 몬스터 12종 (2D 픽셀 손그림, 오른쪽을 본다) — 이끼 덮인 거목 숲
//   땅: 이끼 거북 · 가시덩굴 · 사슴벌레 기사 · [정예] 이끼 트롤
//   수관(하늘섬): 숲 올빼미 · 도토리 다람쥐 · 잎사귀 나방 · [정예] 거대 사마귀
//   땅속(이끼 굴): 독두꺼비 · 반딧불 무리 · 개울 가재 · [정예] 늪 두꺼비 왕
import { board, ellR, capF, polyF, U, minus, pol, lerp, ik, ramp, rampF, rampGlow, mixc, dots, strokes, rot, eye, glass, limb, gait4, gait2, flapOf, spec, done, flash, T2, L } from "./kit.js";
import { sculpt, mat } from "./px3.js";

const MOSS = ramp(0x5a9a3a), MOSSD = ramp(0x3e7a2e), BARK = ramp(0x6a4a30), BARKF = rampF(0x5a3e28), FERN = ramp(0x7ab848);
const mossy = (C, pts, r = 1.4) => pts.forEach(([x, y, s = 1]) => C.part(ellR(x, y, r * s * 1.4, r * s), MOSS, { sep: !1, shine: 1 }));

// ════ 이끼 거북 ════ 이끼와 고사리가 자란 둥근 등껍질. 껍질에 숨어 막고, 껍질째 굴러 들이받는다. 뒤집히면 버둥버둥
//   p: legs · hide 숨기(0~1) · roll 구르기 각 · flip 뒤집힘 · head · hurt
const TSK = ramp(0x8a8a50), TSKF = rampF(0x7a7a44), SHELL = ramp(0x5a5a36);
function turtleFrame(p = {}) {
  const W = 52, H = 34, G = H - 1, C = board(W, H);
  const hd = p.hide ?? 0, lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) };
  const R = p.flip ? rot([26, 20], Math.PI) : p.roll != null ? rot([26, 21], p.roll) : (q) => q, P = (x, y) => R([x, y]);
  const leg = (x, o, far) => { if (hd > 0.6) return; const s = P(x, 25), ft = P(x + o[0], G - 1 - o[1] * (1 - hd)); C.part(capF(s, ft, far ? 3 : 3.4, 2.6), far ? TSKF : TSK, { shine: !far }); };
  leg(34, lg.ff, !0), leg(16, lg.bf, !0);
  // 머리 (숨으면 껍질 속으로)
  if (hd < 0.8) {
    const hx = 42 - hd * 8 + (p.head ?? 0) * 2;
    C.part(U(capF(P(36, 21), P(hx, 18), 3.6, 3.2), ellR(...P(hx + 2, 17.5), 4.4, 3.6)), TSK, { shine: 1 });
    C.part(polyF([P(hx + 4, 16), P(hx + 8, 18), P(hx + 4, 20)]), ramp(0x4a4430), { sep: !1 });
    !p.hurt && (C.over(...P(hx + 2.5, 16), 0x101008), C.over(...P(hx + 3, 15.5), 0xffffff));
  }
  // 등껍질 (둥근 지붕) + 판 무늬 + 이끼·고사리
  C.part(U(ellR(...P(25, 18), 16, 11), polyF([P(8, 22), P(42, 22), P(40, 26), P(10, 26)])), SHELL, { shine: 1 });
  for (const [x0, y0, x1, y1] of [[15, 12, 19, 22], [25, 9, 25, 22], [35, 12, 31, 22], [12, 17, 38, 17]]) strokes(C, [[...P(x0, y0), ...P(x1, y1)]], SHELL[2]);
  C.part(polyF([P(8, 23), P(42, 23), P(41, 26), P(9, 26)]), ramp(0x9a8a5a), { sep: !1 }); // 배딱지 테
  mossy(C, [[...P(18, 9), 1.4], [...P(27, 7.5), 1.6], [...P(34, 10), 1.1], [...P(12, 14), 1]], 1.4);
  for (const [x, a] of [[23, -2], [29, -1.2]]) { const s0 = P(x, 7); C.part(capF(s0, pol(s0, a, 7), 0.9, 0.3), FERN, { sep: !1 }); }
  leg(31, lg.fn, !1), leg(13, lg.bn, !1);
  return done(C, p);
}
export const pxTurtle = spec(52, 34, 26, 18,
  { idle: [4, 5], move: [6, 8], wind: [3, 10, !1], atk: [6, 20], rec: [3, 10, !1], hurt: [2, 10, !1], hide: [2, 4], flip: [4, 10] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "idle") return { head: Math.sin(ph) * 0.4 };
    if (nm === "move") return { legs: gait4(f, n, 3, 1.5) };
    if (nm === "wind" || nm === "hide") return { hide: nm === "hide" ? 1 : t };
    if (nm === "atk") return { hide: 1, roll: ph };
    if (nm === "rec") return { hide: 1 - t };
    if (nm === "flip") return { flip: 1, legs: { fn: [Math.sin(ph * 2) * 3, 4], ff: [Math.cos(ph * 2) * 3, 4], bn: [-Math.sin(ph * 2) * 3, 4], bf: [-Math.cos(ph * 2) * 3, 4] } };
    return { hurt: f === 0, hide: 0.4 };
  }, turtleFrame);

// ════ 가시덩굴 ════ 덤불로 숨어 있다가 꽃봉오리 머리를 쳐들고 가시 덩굴을 채찍처럼 휘두른다
//   p: rise(0 덤불 ~ 1 쳐듦) · whip 채찍(-1 뒤로 ~ 1 앞으로 길게) · open 봉오리 벌림 · hurt
const VINE = ramp(0x3e7a32), VINEF = rampF(0x346a2a), BUD = ramp(0xb03a4a), THORN = ramp(0xe0d0a0);
function thornFrame(p = {}) {
  const W = 60, H = 46, G = H - 1, C = board(W, H);
  const rs = p.rise ?? 1, wp = p.whip ?? 0;
  // 덤불 (뿌리)
  C.part(U(ellR(20, G - 4, 12, 5), ellR(14, G - 6, 6, 5), ellR(26, G - 7, 7, 5.5)), VINEF, { shine: 1 });
  for (const [x, y] of [[10, -7], [17, -10], [24, -11], [30, -6]]) C.part(polyF([[x - 1, G + y + 1], [x + 1, G + y + 1], [x, G + y - 2]]), THORN, { sep: !1 });
  if (rs > 0.05) {
    // 줄기 (휘어 올라감) → 채찍 덩굴
    const base = [20, G - 8], top = [20 + wp * 4, G - 8 - rs * 22], ctl = [14 - wp * 4, G - 18 * rs];
    const pts = [];
    for (let k = 0; k <= 8; k++) { const t = k / 8; pts.push([(1 - t) ** 2 * base[0] + 2 * (1 - t) * t * ctl[0] + t * t * top[0], (1 - t) ** 2 * base[1] + 2 * (1 - t) * t * ctl[1] + t * t * top[1]]); }
    C.part(U(...pts.slice(1).map((q, k) => capF(pts[k], q, 3 - k * 0.15, 2.8 - k * 0.15))), VINE, { shine: 1 });
    // 채찍 (앞으로 뻗는 덩굴)
    if (Math.abs(wp) > 0.05) {
      const w0 = top, len = 10 + Math.max(0, wp) * 26, a = wp > 0 ? -0.15 + (1 - wp) * -0.9 : -2.4 - wp * 0.3;
      const w1 = pol(w0, a, len * 0.5), w2 = pol(w1, a + (wp > 0 ? 0.3 : -0.4), len * 0.5);
      C.part(U(capF(w0, w1, 1.8, 1.3), capF(w1, w2, 1.3, 0.6)), VINE, { shine: 1 });
      for (const t of [0.3, 0.6, 0.85]) { const q = lerp(w0, w2, t); C.over(q[0], q[1] - 2, THORN[4]); }
    }
    for (const k of [2, 4, 6]) C.part(polyF([[pts[k][0] - 3, pts[k][1]], [pts[k][0] - 7, pts[k][1] - 2], [pts[k][0] - 3, pts[k][1] + 2]]), FERN, { sep: !1 }); // 잎
    // 꽃봉오리 머리 (벌리면 가시 이빨)
    const op = p.open ?? 0;
    C.part(ellR(top[0] + 2, top[1] - 3, 5, 6), BUD, { shine: 1 });
    op > 0.2 && C.part(polyF([[top[0] + 2, top[1] - 4], [top[0] + 9, top[1] - 6 - op * 3], [top[0] + 9, top[1] - 1 + op * 2]]), ramp(0x2a0a14), { sep: !1 });
    op > 0.2 && dots(C, [[top[0] + 6, top[1] - 5], [top[0] + 6, top[1] - 2]], THORN[5]);
    C.part(U(polyF([[top[0] - 2, top[1] + 1], [top[0] - 6, top[1] - 2], [top[0] - 1, top[1] - 3]]), polyF([[top[0] + 4, top[1] + 2], [top[0] + 8, top[1] + 1], [top[0] + 4, top[1] - 1]])), VINE, { sep: !1 });
    !p.hurt && C.over(top[0] + 3, top[1] - 6, 0xffe060);
  }
  return done(C, p);
}
export const pxThorn = spec(60, 46, 18, 22,
  { hide: [1, 1], rise: [4, 12, !1], idle: [4, 6], move: [4, 6], wind: [3, 10, !1], atk: [3, 18, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "hide") return { rise: 0 };
    if (nm === "rise") return { rise: t, open: t };
    if (nm === "wind") return { whip: -t, open: 0.5 };
    if (nm === "atk") return { whip: [0.4, 1, 0.9][f], open: 1 };
    if (nm === "rec") return { whip: 0.9 * (1 - t), open: 0.6 * (1 - t) };
    if (nm === "hurt") return { hurt: f === 0, whip: -0.3 };
    return { whip: Math.sin(ph) * 0.1, open: 0.2 };
  }, thornFrame);

// ════ 사슴벌레 기사 ════ 뒷다리로 선 사슴벌레. 등딱지는 갑옷, 거대한 큰턱으로 붙잡아 뒤로 내던진다. 딱지를 펴고 짧게 난다
//   p: bob · legs · jaw 큰턱 벌림 · lift 들어올림 · fly 날개 · lean · hurt
const STAG = ramp(0x4a2a1e), STAGF = rampF(0x3e2218), MAND = ramp(0x7a4a2a);
function stagFrame(p = {}) {
  const W = 50, H = 46, G = H - 1, C = board(W, H);
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, jw = p.jaw ?? 0, ln = p.lean ?? 0, fl = p.fly ?? 0;
  // 날개 (딱지 펴면)
  fl > 0 && glass(C, ellR(12, 18 + b, 13 * fl, 6, -0.6), 0.15, !0, 0xd8e8c8);
  // 다리 (뒷다리 둘로 섬)
  for (const [o, far] of [[g.f, 1], [g.n, 0]]) {
    const hp = [21 + (far ? -2 : 1) + ln * 2, 31 + b], ft = [hp[0] + o[0], G - 1 - o[1]];
    limb(C, hp, ft, 7.5, 7, 1, far ? 1.8 : 2.2, 1.2, far ? STAGF : STAG, { shine: !far });
    C.part(capF(ft, [ft[0] + 4, ft[1] + 0.5], 1, 0.6), far ? STAGF : STAG, { sep: !1 });
  }
  // 몸통 (딱지 = 갑옷) + 가슴
  const sx = 22 + ln * 5;
  C.part(U(ellR(sx - 2, 24 + b, 8, 11, 0.1 + ln * 0.3), ellR(sx + 3, 13 + b, 7, 6)), STAG, { shine: 1 });
  strokes(C, [[sx - 3, 14 + b, sx - 4, 34 + b]], STAG[1]);
  C.part(ellR(sx - 6, 22 + b, 2.2, 7, 0.1), ramp(0x9a5a3a), { sep: !1, shine: 1 }); // 딱지 반짝
  dots(C, [[sx - 5, 17 + b], [sx - 6, 27 + b]], 0xf0c8a0);
  // 앞다리 (작은 팔) 둘
  for (const far of [1, 0]) { const s = [sx + 3, 17 + b + far], e2 = [sx + 9, 22 + b + far * 2 - (p.lift ?? 0) * 6]; C.part(capF(s, e2, 1.3, 0.9), far ? STAGF : STAG, { sep: !1 }); }
  // 머리 + 큰턱 (벌림)
  const hx = sx + 9, hy = 9 + b;
  C.part(ellR(hx, hy, 5.5, 4.4), STAG, { shine: 1, lv: 0.05 });
  // 큰턱: 사슴뿔처럼 길게 휘고 가운데 가지가 있다 (벌리면 위아래로 벌어짐)
  for (const s of [-1, 1]) {
    const r0 = [hx + 3, hy + s * 1.8], a = -s * (0.75 + jw * 0.4) - (p.lift ?? 0) * 0.7;
    const r1 = pol(r0, a, 8), r2 = pol(r1, a + s * 0.5, 7), r3 = pol(r2, a + s * 1.4, 3.5), tn = pol(r1, a - s * 1.2, 3);
    C.part(U(capF(r0, r1, 2.2, 1.8), capF(r1, r2, 1.8, 1.2), capF(r2, r3, 1.2, 0.5), capF(r1, tn, 1, 0.4)), MAND, { shine: 1, sep: !1 });
    C.over(...pol(r0, a, 4), MAND[6]).over(...pol(r1, a + s * 0.5, 3), MAND[6]);
  }
  strokes(C, [[hx - 2, hy - 4, hx - 6, hy - 9], [hx, hy - 4, hx + 1, hy - 10]], STAG[1]);
  !p.hurt && (C.over(hx + 1, hy - 1, 0xffb030), C.over(hx + 1.6, hy - 1.6, 0xffffff));
  return done(C, p);
}
export const pxStag = spec(50, 46, 18, 28,
  { idle: [4, 6], move: [8, 12], wind: [3, 10, !1], atk: [3, 18, !1], rec: [3, 10, !1], hurt: [2, 10, !1], toss: [4, 12, !1], fly: [4, 18] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "idle") return { bob: Math.sin(ph) * 0.4, jaw: 0.2 + 0.1 * Math.sin(ph) };
    if (nm === "move") { const g = gait2(f, n, 3.5, 2); return { legs: g, bob: g.bob, lean: 0.15 }; }
    if (nm === "wind") return { jaw: t * 1.2, lean: -0.2 * t };
    if (nm === "atk") return { jaw: [1.2, -0.2, -0.3][f], lean: 0.4 };
    if (nm === "toss") return { jaw: -0.3, lift: [0.5, 1, 1, 0.2][f], lean: [-0.2, -0.5, -0.6, 0.3][f] };
    if (nm === "fly") return { fly: 0.6 + 0.4 * Math.abs(Math.sin(ph * 2)), jaw: 0.8, legs: { n: [2, 3], f: [-1, 3] } };
    if (nm === "rec") return { jaw: 0.3, lean: 0.4 * (1 - t) };
    return { hurt: f === 0, lean: -0.4, jaw: 0.5 };
  }, stagFrame);

// ════ [정예] 이끼 트롤 ════ (큰 몬스터 조각 도구) 구부정한 거구 · 땅에 닿을 듯 긴 팔 · 등을 덮은 이끼와 버섯 · 이끼 수염 · 통나무 몽둥이. 맞지 않으면 이끼가 빛나며 상처를 메운다
//   p: bob · step · log 통나무(0 끌기 ~ 0.5 세워 들기 ~ 1 어깨 뒤로 ~ 2 내려침) · rock 바위 들기(1)/던짐(2) · regen 재생 빛 · fl 깜빡 · hurt
const TRK = 0.7;
const TR_SK = mat(ramp(0x6e7e5c), { tex: "skin", amp: 0.6 }), TR_SKF = mat(ramp(0x5e6e50, { cool: 0x1c2a40 }), { tex: "skin", amp: 0.5 }), TR_BEL = mat(ramp(0x94a27a), { tex: "skin", amp: 0.4 });
const TR_MOSS = mat(ramp(0x4e8c36), { tex: "fur", amp: 0.9, dir: 1.57 }), TR_MOSSD = mat(ramp(0x467e30), { tex: "fur", amp: 0.9, dir: 1.57 });
const TR_LOGC = ramp(0x7a5432), TR_LOGE = mat(ramp(0xc8a070), { tex: "wood", amp: 0.4 }), TR_TUSK = mat(ramp(0xece0bc), { spec: 0.4 });
const TR_CAP = mat(ramp(0xc4503a), { spec: 0.35 }), TR_STEM = mat(ramp(0xe4d8b4)), TR_ROCK = mat(ramp(0x7e786a), { tex: "stone", amp: 0.8 }), TR_GLOW = mat(rampGlow(0x9cff64));
const TR_KF = [[1.45, 1.3, 0.3], [0.9, -1.2, -1.75], [-1.3, -2.2, -2.8]];
function trollFrame(p = {}) {
  const W = 124, H = 108, G = H - 1, S = sculpt(W, H, { k: p.k ?? TRK, ax: 56 });
  const b = p.bob ?? 0, st = p.step ?? 0, lg = p.log ?? 0, rk = p.rock ?? 0, rg = p.regen ?? 0, fl = p.fl ?? 0;
  // 먼 팔: 늘어뜨림(손등이 땅에 닿을 듯) / 바위 들어 올림 / 던진 뒤 앞으로
  const sF = [52, 50 + b], hF = rk === 1 ? [56, 28 + b] : rk === 2 ? [98, 46 + b] : [44, 94 + b], eF = ik(sF, hF, 22, 22, rk === 1 ? 1 : -1);
  S.add(U(capF(sF, eF, 7, 6), capF(eF, hF, 6, 5.4)), TR_SKF, { z: -5, h: 6 });
  S.add(ellR(hF[0], hF[1], 6.4, 5.6), TR_SKF, { z: -4, h: 5 });
  if (rk === 1) {
    S.add(ellR(hF[0] + 1, hF[1] - 12, 12, 10.5), TR_ROCK, { z: -3, h: 10 });
    S.carve(capF([hF[0] - 6, hF[1] - 16], [hF[0] + 2, hF[1] - 10], 0.6), 1).carve(capF([hF[0] + 4, hF[1] - 20], [hF[0] + 8, hF[1] - 14], 0.5), 0.8);
    S.add(ellR(hF[0] - 3, hF[1] - 19, 5, 3), TR_MOSS, { on: 1, h: 0.8 });
  }
  // 다리 (짧고 휜 다리 + 넓적한 발과 발가락)
  for (const [x, far, sg] of [[46, 1, -st], [64, 0, st]]) {
    const M0 = far ? TR_SKF : TR_SK, hip = [x, 78 + b], ft = [x + sg, G - 4], kn = [x + 5 + sg * 0.5, 92 + b * 0.5];
    S.add(U(ellR(hip[0], hip[1], 10, 8), capF(hip, kn, 9, 7.4), capF(kn, ft, 7.4, 6)), M0, { z: far ? -2 : 3, h: 8 });
    S.add(ellR(ft[0] + 3, G - 3, 10, 3.8), M0, { z: far ? -1.5 : 3.5, h: 3 });
    for (const d of [0, 1, 2]) S.add(ellR(ft[0] + 10 + d * 2.2, G - 2.4 + d * 0.3, 2.4, 2), M0, { z: far ? -1 : 4, h: 2 });
    far || S.carve(capF([kn[0] - 5, kn[1] + 1], [kn[0] + 3, kn[1] + 2], 0.6), 0.8);
  }
  // 몸통 (구부정한 등 혹) + 배 + 배 주름
  S.add(U(ellR(54, 64 + b, 24, 19), ellR(58, 46 + b, 21, 17)), TR_SK, { z: 0, h: 18 });
  S.add(ellR(66, 70 + b, 13, 11), TR_BEL, { blend: 4, h: 4 });
  for (const y of [64, 69, 74]) S.carve(capF([59, y + b], [72, y + 1 + b], 0.6), 0.6);
  // 등 이끼 덮개 (털결이 아래로) + 늘어진 이끼 가닥
  S.add(U(ellR(50, 38 + b, 19, 10, -0.25), ellR(38, 50 + b, 9, 13)), TR_MOSS, { lift: 2, h: 3 });
  for (const [x, y, l] of [[30, 56, 10], [35, 61, 8], [41, 48, 6], [58, 44, 7], [47, 47, 5]]) S.add(capF([x, y + b], [x - 0.6, y + l + b], 1.8, 0.9), TR_MOSS, { lift: 1.6, h: 1.4 });
  // 등 버섯 셋 (붉은 갓 + 흰 점) + 고사리
  for (const [x, y, s] of [[40, 30, 1], [49, 26, 0.8], [33, 38, 0.7]]) {
    S.add(capF([x, y + 6 * s + b], [x + 0.6, y + b], 1.5 * s), TR_STEM, { lift: 3, h: 1.6 });
    S.add(ellR(x + 0.6, y + b, 5.4 * s, 3.2 * s), TR_CAP, { lift: 5, h: 3 * s, prof: "soft" });
    p.block || (S.decal(x - 1.4 * s, y - 1 * s + b, 0xfff4e0), S.decal(x + 2 * s, y - 0.6 * s + b, 0xfff4e0));
  }
  for (const a of [-2.4, -2.0, -1.65]) S.add(capF([60, 31 + b], pol([60, 31 + b], a, 9), 1.2, 0.5), TR_MOSS, { lift: 3, h: 1 });
  // 머리 (앞으로 쑥, 낮게) · 처진 귀 · 눈썹 · 작은 눈 · 큰 매부리코 · 아래턱 엄니 · 이끼 수염
  const hx = 86, hy = 50 + b;
  S.add(polyF([[hx - 8, hy - 6], [hx - 22, hy - 11], [hx - 10, hy + 2]]), TR_SK, { z: 4, h: 3 });
  S.add(ellR(hx, hy, 11, 10), TR_SK, { z: 6, h: 10 });
  S.add(capF([hx - 7, hy - 6], [hx + 8, hy - 5], 3, 2.4), TR_SK, { blend: 2, h: 2.4 });
  S.add(ellR(hx + 3, hy + 7, 9, 4.5), TR_SK, { z: 7, h: 5 });
  S.add(U(ellR(hx + 11, hy + 1, 5.6, 5), capF([hx + 8, hy - 3], [hx + 12, hy + 2], 2.4)), TR_SK, { z: 8, h: 6 });
  S.carve(ellR(hx + 13, hy + 3.5, 1.2, 0.8), 1, !1).carve(capF([hx - 3, hy + 4.5], [hx + 8, hy + 5], 0.6), 1.2, !1);
  for (const x of [hx + 1, hx + 6]) S.add(polyF([[x - 1.4, hy + 6], [x + 1.4, hy + 6], [x + 0.6, hy + 1.5]]), TR_TUSK, { z: 9, h: 1.6 });
  S.add(polyF([[hx - 6, hy + 8], [hx + 10, hy + 9], [hx + 9, hy + 16], [hx + 6, hy + 14], [hx + 4, hy + 20], [hx + 1, hy + 15], [hx - 2, hy + 19], [hx - 4, hy + 13]]), TR_MOSSD, { z: 8.5, h: 2 });
  if (!p.block && !p.hurt) for (const [x, y] of [[hx + 1, hy - 2], [hx + 6, hy - 1.6]]) S.decal(x, y, 0xffd040).decal(x, y - 1, 0x2a1a08);
  // 가까운 팔 + 통나무 몽둥이 (손잡이 쪽이 가늘고 끝이 굵다 · 끝에 이끼와 잘린 면 · 잔가지)
  const kk = lg > 1 ? [0.55, 0.95, 1.0] : lg > 0.5 ? TR_KF[1].map((v, i) => L(v, TR_KF[2][i], (lg - 0.5) * 2)) : TR_KF[0].map((v, i) => L(v, TR_KF[1][i], lg * 2));
  const s0 = [72, 54 + b], e0 = pol(s0, kk[0], 20), hd = pol(e0, kk[1], 19), dv = [Math.cos(kk[2]), Math.sin(kk[2])];
  const ln = dv[1] > 0.05 ? Math.min(36, (G - 5 - hd[1]) / dv[1]) : 36, lt = [hd[0] + dv[0] * ln, hd[1] + dv[1] * ln];
  const LG = mat(TR_LOGC, { tex: "wood", amp: 0.8, dir: kk[2] });
  S.add(capF(pol(hd, kk[2] + Math.PI, 5), lt, 3.8, 6.2), LG, { z: 9, h: 6 });
  S.add(ellR(lt[0], lt[1], 2, 5.6, kk[2]), TR_LOGE, { z: 9.6, h: 5 });
  S.add(ellR(...lerp(hd, lt, 0.78), 5, 3, kk[2]), TR_MOSS, { on: 1, h: 1 });
  const bq = lerp(hd, lt, 0.55);
  S.add(capF(bq, pol(bq, kk[2] - 1.0, 7), 1.7, 0.8), LG, { z: 8.8, h: 1.4 });
  S.add(ellR(...pol(bq, kk[2] - 1.0, 8), 2.4, 1.4, kk[2]), TR_MOSS, { z: 8.9, h: 1 });
  S.carve(ellR(...lerp(hd, lt, 0.35), 1.4, 1), 0.8);
  S.add(U(capF(s0, e0, 7.6, 6.4), capF(e0, hd, 6.4, 5.6)), TR_SK, { z: 10, h: 7 });
  S.add(ellR(hd[0], hd[1], 6.4, 5.8), TR_SK, { z: 11, h: 6 });
  S.add(ellR(...lerp(e0, hd, 0.4), 4, 2.6, kk[1]), TR_MOSS, { on: 1, h: 1 });
  // 재생: 이끼가 빛나고 빛 알갱이가 오른다
  if (rg > 0 && !p.block) {
    for (const [x, y] of [[44, 36], [52, 34], [38, 48], [60, 40], [34, 56], [hx, hy + 14]]) S.add(ellR(x, y + b, 1.6, 1.3), TR_GLOW, { on: 1, h: 0.6, lift: 0.5 });
    for (const [x, y] of [[30, 26], [50, 18], [66, 24], [24, 44], [76, 34]]) S.decal(x + (fl % 2), y + b - (fl % 4) * 2, 0xd8ffb0);
  }
  const C = S.render({ debug: p.debug, rim: !p.block });
  return p.hurt ? flash(C) : C;
}
export const pxTroll = {
  fw: Math.round(124 * TRK), fh: Math.round(108 * TRK), w: 32, h: 50,
  anims: { idle: [4, 5], move: [6, 7], wind: [4, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], throw: [4, 10, !1], regen: [4, 8] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { log: 0 };
    if (nm === "idle") P = { bob: Math.sin(ph) * 0.6, log: 0.04 * Math.sin(ph) };
    if (nm === "move") P = { step: Math.sin(ph) * 4, bob: -Math.abs(Math.sin(ph)) * 1.5, log: 0.06 };
    if (nm === "wind") P = { log: 0.2 + 0.8 * t, bob: -t };
    if (nm === "atk") P = { log: 2, bob: 2 };
    if (nm === "rec") P = { log: f === 0 ? 2 : 0.3 * (1 - t), bob: 2 * (1 - t) };
    if (nm === "throw") P = { rock: f < 2 ? 1 : 2, log: 0.05, bob: f < 2 ? -1 : 1 };
    if (nm === "regen") P = { regen: 1, fl: f, bob: Math.sin(ph) * 0.4 };
    if (nm === "hurt") P = { hurt: f === 0, bob: 1, log: 0.3 };
    return trollFrame(P);
  },
};

// ════ 숲 올빼미 ════ 동그란 몸 · 귀깃 · 커다란 눈. 가지에 앉아 고개를 돌리다 소리 없이 급강하해 할퀸다
//   p: perch 앉음 · flap · turn 고개 돌림 · talon 발톱 뻗기 · hurt
const OWL = ramp(0x8a6a48), OWLF = rampF(0x7a5c3e), OWLB = ramp(0xd8c8a0);
function owlFrame(p = {}) {
  const W = 42, H = 40, C = board(W, H);
  const fl = p.flap ?? 0, pc = p.perch ?? 0, tl = p.talon ?? 0;
  const wing = (far) => { const root = [18, 18], a = pc ? (far ? 2.0 : 1.75) : -2.2 - fl * 0.9 + (far ? -0.3 : 0), len = pc ? 10 : 18, tip = pol(root, a, len), m = pol(root, a + 0.6, len * 0.7); C.part(polyF([root, tip, m, [20, 24]]), far ? OWLF : OWL, { shine: !far }); for (let k = 1; k <= 3; k++) C.over(...lerp(root, tip, k / 4), far ? OWLF[2] : OWL[2]); };
  wing(!0);
  // 몸 + 가슴 무늬
  C.part(ellR(21, 22, 9, 11), OWL, { shine: 1 });
  C.part(ellR(23, 25, 6, 7.5), OWLB, { sep: !1 });
  for (const [x, y] of [[21, 22], [24, 23], [22, 26], [25, 27], [21, 29]]) C.over(x, y, OWL[3]);
  // 머리 (몸과 하나) + 귀깃 + 눈
  const tu = p.turn ?? 0;
  C.part(U(ellR(22 + tu, 10, 8, 7), polyF([[15 + tu, 6], [14 + tu, 0], [19 + tu, 4]]), polyF([[26 + tu, 4], [30 + tu, 0], [29 + tu, 6]])), OWL, { shine: 1, lv: 0.05 });
  C.part(U(ellR(19 + tu * 1.5, 10, 3.4, 3.4), ellR(26 + tu * 1.5, 10, 3.4, 3.4)), OWLB, { sep: !1 });
  if (!p.hurt) for (const x of [19, 26]) (C.over(x + tu * 1.5, 10, 0x101008), C.over(x + tu * 1.5 - 1, 10, 0xffb020), C.over(x + tu * 1.5 + 1, 9, 0xffffff));
  C.part(polyF([[22 + tu * 1.5, 12], [24 + tu * 1.5, 12], [23 + tu * 1.5, 15]]), ramp(0x5a4a30), { sep: !1 });
  // 발톱
  const fy = pc ? 33 : 32 + tl * 4;
  for (const dx of [-2, 2]) { const s = [21 + dx, 31], f = [21 + dx + tl * 5, fy]; C.part(capF(s, f, 1, 0.8), ramp(0xc8a040), { sep: !1 }); for (const d of [-0.5, 0.3]) C.part(capF(f, pol(f, 1.2 + d - tl, 2.4), 0.6, 0.3), ramp(0x302018), { sep: !1 }); }
  wing(!1);
  return done(C, p);
}
export const pxOwl = spec(42, 40, 18, 20,
  { perch: [4, 4], idle: [4, 14], move: [4, 16], wind: [3, 10, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const fl = [1, 0.3, -1, 0.3][f % 4];
    if (nm === "perch") return { perch: 1, turn: [0, -2, 0, 2][f] };
    if (nm === "wind") return { flap: fl, talon: 0.3 * t };
    if (nm === "atk") return { flap: -1, talon: 1 };
    if (nm === "rec") return { flap: fl, talon: 1 - t };
    if (nm === "hurt") return { hurt: f === 0, flap: 0.6 };
    return { flap: fl };
  }, owlFrame, { flying: !0 });

// ════ 도토리 다람쥐 ════ 꼬리가 몸보다 큰 다람쥐. 도토리를 꼭 쥐고 다니다 던진다
//   p: bob · legs · tail · throw 던지기(0~1) · acorn · crouch · hurt
const SQ = ramp(0xb8703a), SQF = rampF(0xa0602e), SQB = ramp(0xf0d8b0), ACORN = ramp(0x8a5a2a);
function squirrelFrame(p = {}) {
  const W = 34, H = 30, G = H - 1, C = board(W, H);
  const b = (p.bob ?? 0) + (p.crouch ?? 0) * 2, g = p.legs ?? { n: [0, 0], f: [0, 0] }, tw = p.tail ?? 0, th = p.throw ?? 0;
  // 큰 꼬리 (S자 털뭉치)
  C.part(U(ellR(8, 14 + b - tw, 5.5, 8, 0.3), ellR(6, 6 + b - tw * 1.5, 5, 5, -0.2), ellR(10, 21 + b, 4, 4)), SQ, { shine: 1 });
  strokes(C, [[5, 4 + b - tw, 8, 18 + b]], SQ[5]);
  // 뒷다리
  for (const [o, far] of [[g.f, 1], [g.n, 0]]) C.part(U(ellR(14 + (far ? -1 : 1), 23 + b, 4, 3.6), capF([15, 25 + b], [16 + o[0], G - 0.5 - o[1]], 1.4, 1.2)), far ? SQF : SQ, { shine: !far });
  // 몸통 + 배
  C.part(ellR(17, 19 + b, 6, 6.5), SQ, { shine: 1 });
  C.part(ellR(19, 21 + b, 3.4, 4.4), SQB, { sep: !1 });
  // 머리
  C.part(U(ellR(22, 11 + b, 5, 4.5), polyF([[19, 7 + b], [19, 3 + b], [22, 6.5 + b]])), SQ, { shine: 1, lv: 0.05 });
  C.part(ellR(25, 12.5 + b, 2.4, 2), SQB, { sep: !1 });
  !p.hurt && (C.over(23, 10 + b, 0x101008), C.over(23.6, 9.4 + b, 0xffffff));
  C.over(27, 12.5 + b, 0x2a1810);
  // 앞발 + 도토리
  const s = [21, 16 + b], hand = th > 0.5 ? pol(s, -2.4 + (th - 0.5) * 4, 6) : [23, 18 + b - th * 3];
  C.part(capF(s, hand, 1.2, 1), SQ, { sep: !1 });
  (p.acorn ?? 1) && (C.part(ellR(hand[0] + 1, hand[1], 2, 2.4), ACORN, { shine: 1, sep: !1 }), C.part(ellR(hand[0] + 1, hand[1] - 2, 2.2, 1), ramp(0x5a3a1a), { sep: !1 }));
  return done(C, p);
}
export const pxSquirrel = spec(34, 30, 12, 14,
  { idle: [6, 8], move: [6, 16], wind: [3, 12, !1], atk: [4, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "idle") return { bob: Math.sin(ph) * 0.4, tail: Math.sin(ph) * 0.8, throw: f === 3 ? 0.4 : 0 };
    if (nm === "move") return { bob: -Math.abs(Math.sin(ph)) * 2.5, legs: { n: [2 * Math.sin(ph), Math.max(0, Math.cos(ph)) * 2], f: [-2 * Math.sin(ph), Math.max(0, -Math.cos(ph)) * 2] }, tail: Math.sin(ph) * 1.5 };
    if (nm === "wind") return { throw: 0.6 + 0.3 * t, crouch: t };
    if (nm === "atk") return { throw: [0.9, 1.3, 1.4, 1.1][f], acorn: f < 2 ? 1 : 0, crouch: 0.4 };
    if (nm === "rec") return { throw: 0.6 * (1 - t), acorn: 0 };
    return { hurt: f === 0, crouch: 0.6, tail: 1.5 };
  }, squirrelFrame);

// ════ 잎사귀 나방 ════ 잎맥 무늬 날개(초록·갈색) · 털 많은 몸 · 깃털 더듬이. 인분을 흩뿌려 느려지게 한다
//   p: flap · dust 인분(0~1) · tilt · hurt
const MTH = ramp(0x8a8a5a), LEAFW = ramp(0x6a9a48), LEAFB = ramp(0x8a6a3a);
function mothFrame(p = {}) {
  const W = 46, H = 38, C = board(W, H);
  const fl = p.flap ?? 0, R = rot([23, 20], p.tilt ?? 0), P = (x, y) => R([x, y]);
  const wing = (far, up) => {
    const root = P(22, 18), a = (up ? -2.0 : 2.6) + (up ? -fl * 0.7 : fl * 0.3) + (far ? -0.25 : 0), len = up ? 18 : 12;
    const tip = pol(root, a, len), s1 = pol(root, a + (up ? 0.7 : -0.7), len * 0.85);
    const sh = polyF([root, tip, s1]);
    C.part(sh, far ? rampF(0x6a9a48) : up ? LEAFW : LEAFB, { shine: !far });
    strokes(C, [[...root, ...lerp(tip, s1, 0.5)], [...lerp(root, tip, 0.5), ...lerp(tip, s1, 0.6)]], far ? LEAFW[1] : LEAFW[2]);
    !far && up && C.over(...lerp(root, lerp(tip, s1, 0.5), 0.6), 0xe8d870); // 눈알 무늬
  };
  wing(!0, !0), wing(!0, !1);
  C.part(ellR(...P(24, 20), 3.6, 8, -0.3), MTH, { shine: 1 });
  for (let k = 0; k < 3; k++) C.over(...P(24 - k * 0.8, 21 + k * 2.6), MTH[2]);
  C.part(ellR(...P(27, 11), 3.2, 3), MTH, { shine: 1 });
  !p.hurt && (C.over(...P(28.5, 10.5), 0x1a1408), C.over(...P(29, 10), 0xd8ffd0));
  for (const s of [-1, 1]) { const a0 = P(27, 9), a1 = P(30 + s, 3); C.part(capF(a0, a1, 0.6, 0.6), MTH, { sep: !1 }); dots(C, [lerp(a0, a1, 0.5), lerp(a0, a1, 0.8)], MTH[5]); }
  wing(!1, !0), wing(!1, !1);
  (p.dust ?? 0) > 0 && dots(C, [P(18, 30), P(24, 33), P(30, 30), P(14, 26), P(32, 26)], 0xe8e8a0);
  return done(C, p);
}
export const pxMoth = spec(46, 38, 18, 16,
  { idle: [4, 14], move: [4, 16], wind: [3, 10, !1], atk: [4, 12, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const fl = [1, 0.3, -1, 0.3][f % 4];
    if (nm === "wind") return { flap: fl, tilt: -0.2 * t };
    if (nm === "atk") return { flap: fl * 1.2, dust: 1, tilt: 0.1 };
    if (nm === "rec") return { flap: fl };
    if (nm === "hurt") return { hurt: f === 0, flap: 0.6, tilt: -0.3 };
    return { flap: fl };
  }, mothFrame, { flying: !0 });

// ════ [정예] 거대 사마귀 ════ (큰 몬스터 조각 도구) 잎사귀 같은 큰 날개 · 세모 머리와 큰 겹눈 · 가시 돋친 두 낫. 잎처럼 가만히 있다가 낫 두 자루로 연속 베기, 뒤로 뛰었다 날아드는 베기
//   p: hide 잎 위장 · bob · scythe/scythe2 가까운·먼 낫(0 접음 ~ 1 들기 ~ 2 내려벰) · lean · legs · wing 날개 펼침 · sway 더듬이 · hurt
const MTK = 0.68;
const MT_B = mat(ramp(0x6aa848), { tex: "skin", amp: 0.3 }), MT_BF = mat(ramp(0x5a8e40, { cool: 0x1c2a40 }), { tex: "skin", amp: 0.3 });
const MT_W = mat(ramp(0x8ac060), { tex: "skin", amp: 0.2 }), MT_WF = mat(ramp(0x6e9a4c, { cool: 0x1c2a40 }), { tex: "skin", amp: 0.2 });
const MT_EYE = mat(ramp(0xd8f080), { spec: 0.6 }), MT_SP = mat(ramp(0xf0ffd8), { spec: 0.4 }), MT_PINK = mat(ramp(0xe89ab0), { spec: 0.3 });
const MT_BEL = mat(ramp(0xb8d890), { tex: "skin", amp: 0.2 }), MT_DRY = mat(ramp(0xb08a48), { tex: "skin", amp: 0.4 });
function mantisFrame(p = {}) {
  const W = 104, H = 84, G = H - 1, S = sculpt(W, H, { k: p.k ?? MTK, ax: 48 });
  const hd = p.hide ?? 0, b = (p.bob ?? 0) + hd * 5, sc = p.scythe ?? 0, sc2 = p.scythe2 ?? sc, ln = p.lean ?? 0, wg = p.wing ?? 0, sw = p.sway ?? 0;
  const g = p.legs ?? { n: [0, 0], f: [0, 0] };
  const leg = (at, kn, ft, far) => S.add(U(capF(at, kn, 1.9, 1.5), capF(kn, ft, 1.5, 0.8)), far ? MT_BF : MT_B, { z: far ? -3 : 8, h: 1.4 });
  // 낫: 넓적다리(안쪽 가시 줄) → 접히는 낫날(가시 · 끝 갈고리)
  const nx = 64 + ln * 8, ny = 40 + b + Math.abs(ln) * 2;
  const scy = (far, s) => {
    const s0 = [nx - 2 + far * 2, ny + 6 - far], u = Math.max(0, s - 1);
    const a = s > 1 ? L(-1.6, 0.3, u) : L(1.05, -1.6, s), ta = s > 1 ? L(2.18, 0.85, u) : L(3.55, 2.18, s);
    const e = pol(s0, a, 16), f = pol(e, ta, 17), sd = Math.sin(ta - a) > 0 ? 1 : -1, M0 = far ? MT_BF : MT_B, SP = far ? MT_BF : MT_SP, z0 = far ? -1 : 12;
    S.add(U(capF(s0, e, 3.2, 3), ellR(e[0], e[1], 3, 3)), M0, { z: z0, h: 3 });
    for (let k = 1; k <= 3; k++) { const q = lerp(s0, e, 0.25 + k * 0.18); S.add(polyF([pol(q, a, 1), pol(q, a + Math.PI, 1), pol(q, a + sd * 1.45, 5)]), SP, { z: z0 + 0.3, h: 0.7 }); }
    S.add(capF(e, f, 2.6, 0.6), M0, { z: z0 + 0.5, h: 2.2 });
    for (let k = 1; k <= 4; k++) { const q = lerp(e, f, k / 5.5); S.add(polyF([pol(q, ta, 0.9), pol(q, ta + Math.PI, 0.9), pol(q, ta - sd * 1.35, 3.6)]), SP, { z: z0 + 0.6, h: 0.7 }); }
    S.add(capF(f, pol(f, ta - sd * 1.9, 4), 1.1, 0.3), M0, { z: z0 + 0.7, h: 1 });
    far || S.add(ellR(...lerp(s0, e, 0.5), 1.6, 1.2), MT_PINK, { on: 1, h: 0.4 });
  };
  // 먼 다리 (가운데 · 뒤) + 먼 낫 + 먼 날개
  leg([46, 67 + b], [56, 58 + b], [66 + g.f[0], G - g.f[1]], 1);
  leg([40, 68 + b], [30, 59 + b], [18 + g.f[0], G - g.f[1]], 1);
  scy(1, sc2);
  const wingP = (dy) => [[48, 62 + dy], [34, 56 + dy], [16, 55 + dy], [2, 60 + dy], [12, 66 + dy], [30, 67 + dy], [46, 66 + dy]];
  const WR = (ang) => rot([48, 64 + b], ang);
  wg > 0.05 && S.add(polyF(wingP(b - 1).map(WR(-wg * 1.15))), MT_WF, { z: 1, h: 2 });
  // 배 (넓은 잎 모양, 끝이 위로 휨) + 마디
  S.add(U(ellR(26, 69 + b, 20, 7.5, 0.08), ellR(7, 64 + b, 6.5, 5, -0.5)), MT_B, { z: 0, h: 6 });
  S.add(ellR(26, 74 + b, 18, 2.4, 0.08), MT_BEL, { on: 1, h: 0.6 });
  for (let k = 0; k < 6; k++) S.carve(capF([14 + k * 5, 65 + b + k * 0.3], [13 + k * 5, 76 + b], 0.45), 0.7);
  // 가까운 날개 (잎맥 · 가운데 맥)
  const wr = WR(-wg * 0.9), WP = wingP(b).map(wr);
  S.add(polyF(WP), MT_W, { z: 3, h: 2.5, lift: 1 });
  S.add(U(ellR(...wr([9, 60 + b]), 5, 3, -0.2), ellR(...wr([20, 65.5 + b]), 3, 1.4)), MT_DRY, { on: 1, h: 0.5 });
  S.carve(capF(wr([47, 64 + b]), wr([4, 60.5 + b]), 0.5), 0.8);
  for (const [x0, x1, y1] of [[40, 33, 57.5], [31, 24, 56.5], [22, 15, 57], [13, 7, 58.5], [40, 35, 66], [31, 26, 66.5], [22, 17, 66]]) S.carve(capF(wr([x0, 63 + b]), wr([x1, y1 + b]), 0.35), 0.5);
  // 가슴 → 앞가슴(비스듬히 세움) → 세모 머리 · 큰 겹눈 · 입틀 · 더듬이
  S.add(ellR(46, 66 + b, 9, 5.6), MT_B, { z: 3, h: 5 });
  S.add(capF([48, 65 + b], [nx, ny], 4, 2.8), MT_B, { z: 4, h: 3 });
  const hx = nx + 3, hy = ny - 7;
  S.add(U(capF([hx - 1, hy - 6], [hx - 8 + sw, hy - 16], 0.8, 0.6), capF([hx - 8 + sw, hy - 16], [hx - 15 + sw * 1.5, hy - 21], 0.6, 0.5)), MT_B, { z: 6, h: 0.6 });
  S.add(capF([hx + 2, hy - 6], [hx + 6 - sw, hy - 20], 0.7, 0.5), MT_BF, { z: 5, h: 0.6 });
  S.add(polyF([[hx - 7, hy - 3], [hx + 8, hy - 5], [hx + 6, hy + 3], [hx + 1, hy + 8]]), MT_B, { z: 6, h: 4 });
  S.add(ellR(hx + 6, hy - 4.8, 2.4, 2.4), MT_EYE, { z: 5.5, h: 2 });
  S.add(ellR(hx - 4, hy - 3.8, 3.8, 3.5), MT_EYE, { z: 7, h: 3 });
  S.add(polyF([[hx, hy + 6], [hx + 3, hy + 6], [hx + 1.4, hy + 10]]), MT_BF, { z: 6.5, h: 1.2 });
  p.block || p.hurt || (S.decal(hx - 3.4, hy - 3.2, 0x1a3010), S.decal(hx + 6.5, hy - 4.6, 0x1a3010));
  // 가까운 다리 + 가까운 낫
  leg([44, 68 + b], [53, 60 + b], [62 + g.n[0], G - g.n[1]], 0);
  leg([38, 69 + b], [28, 61 + b], [15 + g.n[0], G - g.n[1]], 0);
  scy(0, sc);
  const C = S.render({ debug: p.debug, rim: !p.block });
  return p.hurt ? flash(C) : C;
}
export const pxMantis = {
  fw: Math.round(104 * MTK), fh: Math.round(84 * MTK), w: 24, h: 30,
  anims: { hide: [2, 2], idle: [4, 6], move: [6, 12], wind: [3, 10, !1], atk: [4, 18, !1], rec: [3, 10, !1], hurt: [2, 10, !1], leap: [4, 12, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = {};
    if (nm === "hide") P = { hide: 1, scythe: 0, lean: -0.3, sway: f };
    if (nm === "idle") P = { bob: Math.sin(ph) * 0.4, scythe: 0.1 + 0.05 * Math.sin(ph), sway: Math.sin(ph) };
    if (nm === "move") P = { scythe: 0.25, lean: 0.2, bob: -Math.abs(Math.sin(ph)) * 0.8, legs: { n: [2.4 * Math.sin(ph), Math.max(0, Math.cos(ph)) * 2.4], f: [-2.4 * Math.sin(ph), Math.max(0, -Math.cos(ph)) * 2.4] } };
    if (nm === "wind") P = { scythe: t, lean: -0.35 * t, wing: 0.25 * t };
    if (nm === "atk") P = { scythe: [2, 2, 1.4, 2][f], scythe2: [1.6, 1.4, 2, 2][f], lean: 0.55 };
    if (nm === "leap") P = { scythe: [1, 1, 1.4, 2][f], lean: [0.2, 0.6, 0.6, 0.4][f], bob: [2, -3, -3, 1][f], wing: [0.3, 1, 0.8, 0.3][f] };
    if (nm === "rec") P = { scythe: L(1.5, 0.15, t), lean: 0.4 * (1 - t) };
    if (nm === "hurt") P = { hurt: f === 0, lean: -0.45, scythe: 0.4, wing: 0.3 };
    return mantisFrame(P);
  },
};

// ════ 독두꺼비 ════ 오돌토돌한 자줏빛 두꺼비. 긴 혀로 멀리서 끌어당기고, 독 거품을 뱉는다
//   p: bob · crouch · mouth · tongue 혀 길이(0~1) · puff 볼 부풀림 · hurt
const TOAD = ramp(0x6a5a7a), TOADB = ramp(0xd8c890), WART = ramp(0xa87aa0), TONG = ramp(0xd85a7a);
function toadFrame(p = {}) {
  const W = 72, H = 32, G = H - 1, C = board(W, H);
  const b = (p.bob ?? 0) + (p.crouch ?? 0) * 2, mo = p.mouth ?? 0, tg = p.tongue ?? 0;
  // 뒷다리 (접힌)
  C.part(U(ellR(14, G - 5 + b * 0.3, 7, 5), capF([12, G - 2], [24, G - 1], 2.4, 2)), TOAD, { shine: 1 });
  // 몸 + 배
  C.part(ellR(22, G - 10 + b, 13, 9), TOAD, { shine: 1 });
  C.part(ellR(25, G - 6 + b, 8, 4.6), TOADB, { sep: !1 });
  for (const [x, y] of [[14, -14], [20, -17], [26, -15], [17, -10], [12, -9]]) C.part(ellR(x, G + y + b, 1.6, 1.3), WART, { sep: !1, shine: 1 });
  // 머리 (넓적) + 볼
  C.part(U(ellR(32, G - 14 + b, 8, 6.5)), TOAD, { shine: 1, lv: 0.05 });
  (p.puff ?? 0) > 0 && C.part(ellR(33, G - 8 + b, 4 + p.puff * 3, 3 + p.puff * 2.5), ramp(0xc8a8d8), { sep: !1, shine: 1 });
  // 입 + 혀
  if (mo > 0.2) C.part(polyF([[32, G - 12 + b], [40, G - 13 + b], [39, G - 10 + b + mo * 3]]), ramp(0x4a1a2a), { sep: !1 });
  else strokes(C, [[30, G - 11 + b, 40, G - 12 + b]], 0x1a0c14);
  tg > 0 && (C.part(capF([39, G - 11 + b], [39 + tg * 30, G - 12 + b], 1.3, 1.1), TONG, { sep: !1, shine: 1 }), C.part(ellR(39 + tg * 30 + 1, G - 12 + b, 2.6, 2.2), TONG, { sep: !1, shine: 1 }));
  // 눈 (튀어나온)
  C.part(ellR(31, G - 21 + b, 3, 2.8), TOAD, { shine: 1 });
  !p.hurt && (C.over(32, G - 21 + b, 0xffc020), C.over(32.5, G - 21 + b, 0x101008), C.over(31.5, G - 22 + b, 0xffffff));
  // 앞다리
  C.part(capF([30, G - 6 + b], [33, G], 2, 1.6), TOAD, { shine: 1 });
  return done(C, p);
}
export const pxToad = spec(72, 32, 26, 16,
  { idle: [4, 6], move: [4, 10], wind: [3, 10, !1], atk: [4, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1], spit: [4, 12, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "idle") return { puff: Math.max(0, Math.sin(ph)) * 0.6 };
    if (nm === "move") return { crouch: f % 2 ? 1 : 0, bob: f % 2 ? 0 : -4 };
    if (nm === "wind") return { crouch: t, mouth: t * 0.5 };
    if (nm === "atk") return { mouth: 1, tongue: [0.5, 1, 1, 0.4][f] };
    if (nm === "spit") return { puff: [0.6, 1, 0.3, 0][f], mouth: f >= 2 ? 1 : 0 };
    if (nm === "rec") return { mouth: 1 - t, tongue: 0 };
    return { hurt: f === 0, crouch: 0.8, mouth: 0.6 };
  }, toadFrame);

// ════ 반딧불 무리 ════ 빛나는 반딧불 여럿이 모인 무리. 흩어져 날다가 한데 모여 눈부신 빛을 터뜨린다
//   p: spread 흩어짐(0 모임 ~ 1) · glow 빛 · ph 위상 · hurt
const FLY = ramp(0x3a3a2a), FLYG = rampGlow(0xf0f070);
function fireflyFrame(p = {}) {
  const W = 40, H = 36, C = board(W, H);
  const sp = p.spread ?? 0.6, gl = p.glow ?? 0.6, ph = p.ph ?? 0;
  for (let k = 0; k < 6; k++) {
    const a = ph + k * 1.047, r = 4 + sp * (6 + (k % 3) * 3), x = 20 + Math.cos(a) * r, y = 18 + Math.sin(a * 1.3) * r * 0.7;
    C.part(ellR(x, y, 1.6, 1.3), FLY, { sep: !1 });
    C.part(ellR(x - 1.4, y + 0.6, 1.4 + gl * 0.6, 1.2 + gl * 0.5), FLYG, { sep: !1, shine: 1 });
    glass(C, ellR(x + 0.5, y - 1.6, 1.6, 1), 0.1, !1, 0xe8f0ff);
  }
  // 대장 반딧불 (가운데)
  C.part(ellR(20, 18, 2.4, 2), FLY, { sep: !1 });
  C.part(ellR(18, 19, 2.4 + gl, 2 + gl * 0.8), FLYG, { sep: !1, shine: 1 });
  !p.hurt && C.over(21.5, 17.5, 0xffffff);
  gl > 1 && dots(C, [[20, 6], [8, 18], [32, 18], [20, 30], [11, 9], [29, 27]], 0xffffd0);
  return done(C, p);
}
export const pxFirefly = spec(40, 36, 18, 16,
  { idle: [6, 12], move: [6, 14], wind: [4, 10, !1], atk: [3, 14, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "wind") return { spread: 0.8 - t * 0.8, glow: 0.6 + t * 0.6, ph: ph * 2 };
    if (nm === "atk") return { spread: 0.1 + f * 0.4, glow: 1.6, ph };
    if (nm === "rec") return { spread: t, glow: 1 - t * 0.4, ph };
    if (nm === "hurt") return { hurt: f === 0, spread: 1.2, glow: 0.3, ph };
    return { spread: 0.7, glow: 0.5 + 0.3 * Math.sin(ph * 2), ph };
  }, fireflyFrame, { flying: !0 });

// ════ 개울 가재 ════ 붉은 갈색 껍질 · 커다란 두 집게(들고 다님) · 마디 꼬리. 옆걸음 치며 집고, 물을 튀겨 쏜다
//   p: legs 위상 · claw 집게(0 들기 ~ 1 집기) · squirt · bob · hurt
const CRAY = ramp(0xa8483a), CRAYF = rampF(0x903e32), CLAWC = ramp(0xc8584a);
function crayFrame(p = {}) {
  const W = 52, H = 32, G = H - 1, C = board(W, H);
  const b = p.bob ?? 0, cl = p.claw ?? 0, lp = p.legs ?? 0;
  // 다리 넷 (옆걸음)
  for (let k = 0; k < 4; k++) for (const far of [1, 0]) { const s = [16 + k * 4, 22 + b], a = 1.7 + Math.sin(lp + k * 1.5 + far * 3) * 0.35 + (far ? 0.3 : 0), ft = pol(s, a, 8); C.part(capF(s, ft, 0.9, 0.6), far ? CRAYF : CRAY, { sep: !1 }); }
  // 꼬리 (마디, 뒤로 말림) + 꼬리부채
  for (let k = 0; k < 4; k++) C.part(ellR(12 - k * 2.6, 19 + b + k * 0.8, 3.6 - k * 0.4, 3.2 - k * 0.3), CRAY, { shine: 1 });
  C.part(polyF([[3, 19 + b], [0, 15 + b], [-1, 22 + b], [2, 25 + b]]), CRAY, { sep: !1 });
  // 몸통 (갑각)
  C.part(ellR(22, 17 + b, 9, 6), CRAY, { shine: 1 });
  strokes(C, [[16, 14 + b, 28, 14 + b]], CRAY[2]);
  // 머리 + 더듬이 + 눈자루
  C.part(polyF([[29, 13 + b], [36, 15 + b], [35, 19 + b], [29, 21 + b]]), CRAY, { shine: 1 });
  strokes(C, [[34, 14 + b, 46, 6 + b], [34, 15 + b, 48, 11 + b]], CRAY[1]);
  for (const x of [31, 33]) (C.part(capF([x, 13 + b], [x + 1, 10 + b], 0.6), CRAY, { sep: !1 }), !p.hurt && C.over(x + 1, 10 + b, 0x101010));
  (p.squirt ?? 0) > 0 && dots(C, [[38, 17 + b], [41, 17 + b], [44, 16.5 + b]], 0x90e0f8);
  // 집게 둘 (위로 듦)
  for (const far of [1, 0]) {
    const s = [30, 18 + b + far], e = [36 + far, 12 + b - (1 - cl) * 4], c0 = [e[0] + 6, e[1] - 2 + cl * 4];
    C.part(capF(s, e, 1.6, 1.4), far ? CRAYF : CRAY, { sep: !1 });
    C.part(U(ellR(c0[0], c0[1], 4.6, 3.2, -0.3 + cl * 0.3)), far ? CRAYF : CLAWC, { shine: !far });
    const op = (1 - cl) * 2.2;
    C.part(polyF([[c0[0] + 2, c0[1] - 1], [c0[0] + 8, c0[1] - 2 - op], [c0[0] + 5, c0[1] + 0.5]]), far ? CRAYF : CLAWC, { sep: !1 });
  }
  return done(C, p);
}
export const pxCrayfish = spec(52, 32, 24, 14,
  { idle: [4, 6], move: [6, 14], wind: [3, 10, !1], atk: [3, 18, !1], rec: [3, 10, !1], hurt: [2, 10, !1], squirt: [4, 14, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "idle") return { bob: Math.sin(ph) * 0.3, claw: 0.1 + 0.1 * Math.sin(ph) };
    if (nm === "move") return { legs: ph * 2, claw: 0.2 };
    if (nm === "wind") return { claw: 0, bob: -t };
    if (nm === "atk") return { claw: [0.6, 1, 1][f] };
    if (nm === "squirt") return { squirt: f > 0 ? 1 : 0, claw: 0.3 };
    if (nm === "rec") return { claw: 1 - t };
    return { hurt: f === 0, claw: 0.5, bob: 1 };
  }, crayFrame);

// ════ [정예] 늪 두꺼비 왕 ════ (큰 몬스터 조각 도구) 머리에 버섯 왕관을 쓴 거대한 두꺼비. 오돌토돌한 혹 · 이끼 망토 · 금빛 눈 · 늘어나는 턱주머니. 높이 뛰어 짓누르고, 혀로 삼켰다 뱉는다
//   p: bob · crouch 웅크림 · air 공중 · mouth · tongue 혀 길이 · belly 턱주머니 부풀림 · hurt
const TKK = 0.68;
const TK_SK = mat(ramp(0x627240), { tex: "skin", amp: 0.7 }), TK_SKF = mat(ramp(0x52603a, { cool: 0x1c2a40 }), { tex: "skin", amp: 0.6 }), TK_BEL = mat(ramp(0xdccc94), { tex: "skin", amp: 0.3 });
const TK_WART = mat(ramp(0x7e8c4e), { tex: "skin", amp: 0.4 }), TK_EYE = mat(ramp(0xf0b830), { spec: 0.7 }), TK_MOUTH = mat(ramp(0x5a1e2c)), TK_TONG = mat(ramp(0xe0607e), { spec: 0.5 });
const TK_CAP = mat(ramp(0xc8402a), { spec: 0.35 }), TK_CAPY = mat(ramp(0xe0a830), { spec: 0.35 }), TK_STEM = mat(ramp(0xe8dcb8)), TK_MOSS = mat(ramp(0x4e8a36), { tex: "fur", amp: 0.9, dir: 1.57 });
function toadKingFrame(p = {}) {
  const W = 148, H = 88, G = H - 1, S = sculpt(W, H, { k: p.k ?? TKK, ax: 62 });
  const cr = p.crouch ?? 0, air = p.air ?? 0, mo = p.mouth ?? 0, tg = p.tongue ?? 0, be = p.belly ?? 0;
  const sq = 1 - cr * 0.1 + air * 0.08, Y = (y) => G - (G - y) * sq - air * 12 + (p.bob ?? 0), RX = (r) => r * (2 - sq), RY = (r) => r * sq;
  // 먼 뒷다리 · 먼 앞다리
  S.add(ellR(42, Y(68), 12, 9), TK_SKF, { z: -3, h: 8 });
  S.add(capF([98, Y(66)], air ? [104, Y(84)] : [106, G - 3], 3.6, 3), TK_SKF, { z: -3, h: 3 });
  // 몸 (거대) + 머리 덩이
  S.add(U(ellR(58, Y(58), RX(34), RY(24)), ellR(86, Y(50), RX(18), RY(15))), TK_SK, { z: 0, h: 22 });
  // 혹 (옆구리 · 머리)
  for (const [x, y, r] of [[36, 64, 2.6], [46, 63, 2.4], [56, 64, 2.2], [30, 56, 2.4], [62, 41, 2.4], [68, 47, 2], [96, 47, 1.8], [88, 55, 1.6], [64, 56, 2.2], [74, 62, 1.8]]) S.add(ellR(x, Y(y), r, r * 0.85), TK_WART, { blend: 1.2, h: r * 0.7 });
  // 이끼 망토 (등을 덮고 끝이 너덜너덜)
  S.add(polyF([[24, Y(52)], [34, Y(40)], [48, Y(35)], [60, Y(37)], [58, Y(45)], [52, Y(52)], [48, Y(48)], [44, Y(57)], [40, Y(51)], [34, Y(60)], [31, Y(53)], [26, Y(59)]]), TK_MOSS, { lift: 1.6, h: 2.2 });
  // 배 + 턱주머니 (부풀면 크게)
  S.add(ellR(76, Y(72), RX(20), RY(9)), TK_BEL, { on: 1, h: 1 });
  S.add(ellR(92, Y(65) + be * 2, 8 + be * 6, 4.5 + be * 5), TK_BEL, { z: 4, h: 3 + be * 4 });
  // 입: 다물면 긴 입선, 벌리면 입 속 + 아래턱이 내려온다
  const mc = [76, Y(56)];
  if (mo > 0.15) {
    S.add(polyF([[mc[0] + 4, mc[1] - 0.5], [104, Y(53)], [103, Y(53) + mo * 9], [mc[0] + 6, mc[1] + 2]]), TK_MOUTH, { on: 1, h: 0.4 });
    S.add(polyF([[mc[0] + 4, mc[1] + 2], [103, Y(53) + mo * 9], [101, Y(58) + mo * 10], [86, Y(64) + mo * 5], [mc[0] + 2, mc[1] + 5]]), TK_SK, { z: 5, h: 5 });
  } else S.carve(capF([mc[0] + 2, mc[1]], [104, Y(53)], 0.7), 1.4, !1);
  S.carve(ellR(102, Y(47.5), 1, 0.7), 0.9, !1);
  // 귀샘 · 눈두덩 · 금빛 눈(가로 동공) · 찌푸린 눈꺼풀
  S.add(ellR(72, Y(44), 7, 3.6, -0.2), TK_WART, { blend: 2, h: 2 });
  S.add(ellR(94, Y(41), 4.4, 4), TK_SK, { z: 2, h: 4 });
  S.add(ellR(95, Y(40.5), 3, 2.8), TK_EYE, { z: 2.4, h: 3.4 });
  S.add(ellR(84, Y(40), 7.4, 6.4), TK_SK, { z: 5, h: 6 });
  S.add(ellR(85, Y(39), 5, 4.6), TK_EYE, { z: 6, h: 5.4 });
  S.add(capF([79, Y(35)], [91, Y(36)], 1.5, 1.2), TK_SK, { z: 6.5, h: 1.6 });
  if (!p.block && !p.hurt) { for (const x of [83, 84, 85, 86, 87]) S.decal(x, Y(39.4), 0x1a1008); S.decal(84, Y(37.4), 0xffffff); S.decal(96, Y(40.4), 0x1a1008); }
  // 버섯 왕관 (붉은 갓 둘 + 노란 갓 · 흰 점)
  for (const [x, y, s, M0] of [[64, 38, 0.7, TK_CAPY], [71, 34, 1, TK_CAP], [78, 32, 0.8, TK_CAP]]) {
    S.add(capF([x, Y(y) + 6 * s], [x, Y(y)], 1.6 * s), TK_STEM, { lift: 2, h: 1.6 });
    S.add(ellR(x, Y(y) - 0.5, 5.6 * s, 3.4 * s), M0, { lift: 5, h: 3 * s, prof: "soft" });
    p.block || (S.decal(x - 1.6 * s, Y(y) - 1.4 * s, 0xfff4e0), S.decal(x + 2 * s, Y(y) - 0.8 * s, 0xfff4e0));
  }
  // 혀 (끈적한 끝)
  if (tg > 0) {
    const t0 = [100, Y(56) + mo * 5], t1 = [100 + tg * 28, t0[1] - 1];
    S.add(capF(t0, t1, 2.8, 2.2), TK_TONG, { z: 7, h: 2.4 });
    S.add(ellR(t1[0] + 3, t1[1], 4.8, 4), TK_TONG, { z: 7.5, h: 4 });
  }
  // 가까운 앞다리 (손가락 셋) · 가까운 뒷다리 (접힌 허벅지 + 물갈퀴 발)
  const sh = [94, Y(64)], hn = air ? [104, Y(82)] : [100, G - 3];
  S.add(capF(sh, hn, 4.6, 3.6), TK_SK, { z: 6, h: 4 });
  for (const d of [-0.5, 0.1, 0.7]) S.add(capF(hn, pol(hn, d, 5), 1.5, 1.1), TK_SK, { z: 6.5, h: 1.4 });
  S.add(ellR(32, Y(66), RX(15), RY(11)), TK_SK, { z: 4, h: 9 });
  S.carve(capF([22, Y(62)], [40, Y(72)], 0.6), 0.7);
  const ft = air ? [14, Y(86)] : [46, G - 3];
  S.add(capF([24, Y(74)], ft, 5, 3.6), TK_SK, { z: 4.5, h: 4 });
  for (const d of [-0.4, 0, 0.4]) S.add(capF(ft, pol(ft, (air ? Math.PI + 0.6 : 0) + d, 7), 1.5, 1), TK_SK, { z: 5, h: 1.4 });
  const C = S.render({ debug: p.debug, rim: !p.block });
  return p.hurt ? flash(C) : C;
}
export const pxToadKing = {
  fw: Math.round(148 * TKK), fh: Math.round(88 * TKK), w: 44, h: 34,
  anims: { idle: [4, 5], move: [4, 8], wind: [4, 8, !1], atk: [3, 12, !1], rec: [3, 8, !1], hurt: [2, 10, !1], air: [2, 6], swallow: [4, 12, !1], spit: [3, 12, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = {};
    if (nm === "idle") P = { belly: Math.max(0, Math.sin(ph)) * 0.5, bob: Math.sin(ph) * 0.4 };
    if (nm === "move") P = { crouch: f % 2, air: f % 2 ? 0 : 0.6 };
    if (nm === "wind") P = { crouch: t, belly: t * 0.5 };
    if (nm === "air") P = { air: 1, mouth: 0.4, bob: f * 0.6 };
    if (nm === "atk") P = { crouch: [1.2, 0.8, 0.4][f], mouth: 1 };
    if (nm === "swallow") P = { mouth: 1, tongue: [0.5, 1, 0.6, 0.1][f] };
    if (nm === "spit") P = { mouth: [0.3, 1.4, 1][f], belly: [1, 0.2, 0][f] };
    if (nm === "rec") P = { crouch: 0.6 * (1 - t), mouth: 0.6 * (1 - t) };
    if (nm === "hurt") P = { hurt: f === 0, crouch: 0.6, mouth: 0.8 };
    return toadKingFrame(P);
  },
};
