// 그린스텝 몬스터 12종 (2D 픽셀 손그림, 오른쪽을 본다) — 거점 위 하늘 입문, 풀로 덮인 계단 섬
//   아래 섬 줄: 솜털 구름양 · 풀섬 토끼 · 새싹 정령 · [정예] 숫양 대장
//   가운데 줄: 참새 떼 · 꽃 해파리 · 민들레 기사 · [정예] 거대 무당벌레
//   위 줄: 하늘 매 · 비구름 정령 · 바람개비 요정 · [정예] 구름 고래 새끼
import { board, ellR, capF, polyF, U, minus, pol, lerp, ik, ramp, rampF, rampGlow, mixc, dots, strokes, rot, eye, glass, limb, gait4, gait2, flapOf, spec, done, flash, T2, L } from "./kit.js";

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

// ════ [정예] 숫양 대장 ════ 회갈색 거구 양 · 크게 말린 두 뿔 · 목 갈기. 앞발을 구르다 길게 돌진, 뿔로 걷어 올린다
//   p: legs · bob · head 숙임 · rear 앞발 들기 · hurt
const RAM = ramp(0xd8ccb8), RAMF = rampF(0xc4b8a4), RHORN = ramp(0xa08458), RFACE = ramp(0x6a5a50);
function ramFrame(p = {}) {
  const W = 74, H = 56, G = H - 1, C = board(W, H);
  const b = p.bob ?? 0, hd = p.head ?? 0, rr = p.rear ?? 0, lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) };
  const R = rot([22, 36], -rr * 0.25), P = (x, y) => R([x, y + b]);
  const leg = (x, o, far, front) => { const s = P(x, 38), ft = front && rr > 0 ? P(x + 6, 46) : [s[0] + o[0], G - 3 - o[1]]; C.part(capF(s, ft, far ? 3 : 3.6, 2.4), far ? RAMF : RAM, { shine: !far }); C.part(polyF([[ft[0] - 2.4, ft[1]], [ft[0] + 2.4, ft[1]], [ft[0] + 2.8, ft[1] + 3], [ft[0] - 2.6, ft[1] + 3]]), ramp(0x3a3034), { sep: !1 }); };
  leg(46, lg.ff, !0, !0), leg(22, lg.bf, !0, !1);
  // 몸통 (털 뭉치)
  puff(C, ...P(33, 30), 22, 13, RAM, 10, 0.2);
  // 목 갈기
  puff(C, ...P(50, 24), 9, 10, FLUFF, 6, 0.8);
  // 머리 (숙이면 앞으로 내림)
  const Hr = rot(P(54, 22), hd * 0.7), Q = (x, y) => Hr(P(x, y));
  C.part(U(ellR(...Q(58, 20), 6, 5.6), polyF([Q(60, 17), Q(68, 20), Q(66, 25), Q(59, 25)])), RFACE, { shine: 1 });
  !p.hurt && (C.over(...Q(61, 18.6), 0xe8c040), C.over(...Q(61.6, 18.6), 0x101008));
  // 큰 뿔 (나선)
  const h0 = Q(56, 15), pts = [h0];
  for (let k = 1; k <= 7; k++) pts.push(pol(h0, -1.4 - k * 0.75, 3 + k * 1.3 - (k > 4 ? (k - 4) * 1.6 : 0)));
  C.part(U(...pts.slice(1).map((q, k) => capF(pts[k], q, 3.4 - k * 0.32, 3.2 - k * 0.34))), RHORN, { shine: 1 });
  for (let k = 1; k < 7; k += 2) C.over(...pts[k], RHORN[2]);
  leg(43, lg.fn, !1, !0), leg(19, lg.bn, !1, !1);
  return done(C, p);
}
export const pxRam = spec(74, 56, 34, 32,
  { idle: [4, 5], move: [6, 10], wind: [6, 12, !1], atk: [6, 18], rec: [3, 10, !1], hurt: [2, 10, !1], toss: [3, 12, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "idle") return { bob: Math.sin(ph) * 0.4 };
    if (nm === "move") { const g = gait4(f, n, 5, 3); return { legs: g, bob: g.bob }; }
    if (nm === "wind") return { rear: f % 2 ? 1 : 0.4, head: 0.4 };
    if (nm === "atk") { const g = gait4(f, n, 7, 3.5); return { legs: g, head: 1, bob: g.bob + 1 }; }
    if (nm === "toss") return { head: [1, -0.6, -0.4][f], rear: f === 1 ? 0.6 : 0 };
    if (nm === "rec") return { head: 1 - t };
    return { hurt: f === 0, head: -0.4 };
  }, ramFrame);

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

// ════ [정예] 거대 무당벌레 ════ 빨간 딱지에 까만 점 일곱. 딱지를 펴고 날아올라 몸통 박치기, 딱지 닫고 막기, 굴러 돌진
//   p: legs · wings 딱지 펴기(0~1) · guard 움츠림 · bob · hurt
const LBR = ramp(0xd83a2a), LBK = ramp(0x1e1a24);
function ladybugFrame(p = {}) {
  const W = 64, H = 46, G = H - 1, C = board(W, H);
  const b = p.bob ?? 0, wg = p.wings ?? 0, gd = p.guard ?? 0, lp = p.legs ?? 0;
  // 날개 (딱지 아래 투명 날개)
  wg > 0 && (glass(C, ellR(22, 14 + b, 18 * wg, 6, -0.4), 0.15, !1, 0xe0e8f0), glass(C, ellR(26, 12 + b, 16 * wg, 5, -0.7), 0.1, !1, 0xe0e8f0));
  // 다리 여섯
  if (gd < 0.6) for (let k = 0; k < 3; k++) for (const far of [1, 0]) { const s = [22 + k * 9, 32 + b], a = 1.7 + Math.sin(lp + k * 2 + far * 3) * 0.4 + (far ? 0.25 : 0), f = pol(s, a, 9); C.part(capF(s, f, 1.4, 1), LBK, { sep: !1 }); }
  // 딱지 (펴면 양쪽이 들림)
  const sh = (x0, ang) => rot([x0, 26 + b], ang);
  const L2 = sh(32, -wg * 0.5);
  C.part(polyF([[12, 30 + b], [12, 20 + b], [20, 11 + b], [32, 9 + b], [32, 32 + b]].map(L2)), LBR, { shine: 1 });
  C.part(polyF([[32, 9 + b], [44, 11 + b], [50, 20 + b], [50, 30 + b], [32, 32 + b]]), LBR, { shine: 1 });
  strokes(C, [[32, 10 + b, 32, 32 + b]], LBK[2]);
  for (const [x, y] of [[20, 17], [26, 26], [16, 25]]) C.part(ellR(...L2([x, y + b]), 2.4, 2.2), LBK, { sep: !1 });
  for (const [x, y] of [[38, 16], [44, 24], [37, 26], [44, 15]]) C.part(ellR(x, y + b, 2.4, 2.2), LBK, { sep: !1 });
  // 머리
  C.part(ellR(52, 26 + b - gd * 2, 6, 5.4), LBK, { shine: 1 });
  C.part(U(ellR(50, 23 + b - gd * 2, 1.8, 1.6), ellR(55, 24 + b - gd * 2, 1.6, 1.4)), ramp(0xf0f0e0), { sep: !1 });
  !p.hurt && (C.over(56, 26 + b - gd * 2, 0xffffff), C.over(56.5, 25.5 + b - gd * 2, 0xffe060));
  strokes(C, [[52, 21 + b, 55, 15 + b], [54, 22 + b, 59, 17 + b]], LBK[2]);
  return done(C, p);
}
export const pxLadybug = spec(64, 46, 34, 24,
  { idle: [4, 6], move: [6, 12], wind: [3, 10, !1], atk: [4, 18], rec: [3, 10, !1], hurt: [2, 10, !1], guard: [2, 4], fly: [4, 20] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "idle") return { bob: Math.sin(ph) * 0.3, legs: Math.sin(ph) * 0.2 };
    if (nm === "move") return { legs: ph * 2 };
    if (nm === "wind") return { wings: t * 0.6, bob: t };
    if (nm === "atk" || nm === "fly") return { wings: 0.8 + 0.2 * Math.sin(ph * 4), legs: 0, bob: -2 };
    if (nm === "guard") return { guard: 1, bob: 2 };
    if (nm === "rec") return { wings: 0.6 * (1 - t) };
    return { hurt: f === 0, bob: 1 };
  }, ladybugFrame);

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

// ════ [정예] 구름 고래 새끼 ════ 하늘을 헤엄치는 아기 고래. 등은 하늘색, 배는 구름처럼 하얗다. 숨구멍 물줄기 · 꼬리 내리치기
//   p: swim 꼬리 위상 · spout 물줄기 · tail 꼬리 내리침 · tilt · mouth · hurt
const WHL = ramp(0x6aa8e0), WHLB = ramp(0xf0f4fa, { cool: 0x5a6a9a });
function whaleFrame(p = {}) {
  const W = 96, H = 60, C = board(W, H);
  const sw = p.swim ?? 0, R = rot([48, 34], p.tilt ?? 0), P = (x, y) => R([x, y]);
  // 꼬리지느러미
  const tl = p.tail ?? 0, ta = Math.sin(sw) * 0.3 + tl * 0.9, t0 = P(22, 34), t1 = pol(t0, Math.PI + ta, 12);
  C.part(capF(t0, t1, 6, 3), WHL, { shine: 1 });
  C.part(U(ellR(...pol(t1, Math.PI + ta - 0.9, 5), 7, 3, ta - 0.9 + Math.PI / 2), ellR(...pol(t1, Math.PI + ta + 0.9, 5), 7, 3, ta + 0.9 + Math.PI / 2)), WHL, { shine: 1 });
  // 몸 (둥근 방추) + 배 줄무늬
  C.part(ellR(...P(52, 32), 28, 16), WHL, { shine: 1 });
  C.part((x, y) => ellR(...P(56, 38), 24, 9)(x, y), WHLB, { sep: !1 });
  for (let k = 0; k < 6; k++) strokes(C, [[...P(40 + k * 6, 36), ...P(42 + k * 6, 44)]], WHLB[2]);
  // 지느러미 (가슴)
  C.part(ellR(...P(58, 44), 7, 3, 0.7 + Math.sin(sw) * 0.2), WHL, { shine: 1 });
  // 눈 + 입
  !p.hurt && (C.over(...P(70, 30), 0x102030), C.over(...P(70.6, 29.4), 0xffffff));
  const mo = p.mouth ?? 0;
  strokes(C, [[...P(66, 37), ...P(79, 35 + mo * 2)]], 0x1a3050);
  mo > 0.3 && C.part(polyF([P(70, 37), P(79, 36 + mo * 2), P(76, 40 + mo * 2)]), ramp(0xd86a7a), { sep: !1 });
  // 볼 홍조
  C.part(ellR(...P(68, 34), 2.4, 1.4), ramp(0xf0a0b0), { sep: !1 });
  // 숨구멍 물줄기
  if ((p.spout ?? 0) > 0) { const s0 = P(56, 17); for (let k = 0; k < 6; k++) C.part(ellR(s0[0] + (k % 2 ? 2 : -2), s0[1] - k * 3 * p.spout, 2.4 - k * 0.2, 2), ramp(0x90d8f8), { sep: !1, shine: 1 }); }
  // 등 구름 장식
  puff(C, ...P(46, 17), 7, 3, WHLB, 5, 0.2);
  return done(C, p);
}
export const pxWhale = spec(96, 60, 46, 28,
  { idle: [6, 8], move: [6, 10], wind: [4, 10, !1], atk: [3, 14], rec: [3, 10, !1], hurt: [2, 10, !1], spout: [4, 10, !1], tail: [4, 14, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "wind") return { swim: ph, tilt: -0.15 * t, mouth: t * 0.6 };
    if (nm === "atk") return { swim: ph * 2, tilt: 0.25, mouth: 1 };
    if (nm === "spout") return { swim: ph, spout: [0.4, 1, 1, 0.6][f], tilt: -0.1 };
    if (nm === "tail") return { tail: [0, 1, 1.4, 0.5][f], tilt: 0.1 };
    if (nm === "rec") return { swim: ph, tilt: 0.2 * (1 - t) };
    if (nm === "hurt") return { hurt: f === 0, tilt: -0.2, mouth: 0.6 };
    return { swim: ph };
  }, whaleFrame, { flying: !0 });
