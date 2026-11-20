// 그래스메어 몬스터 추가 4종 (2D 픽셀 손그림, 오른쪽을 본다): 하늘 염소 · [정예] 말벌 여왕 · 고블린 주술사 · 굴파기 두더지
import { board, ellR, capF, polyF, U, minus, pol, lerp, ik, ramp, rampF, rampGlow, mixc, dots, strokes, rot, eye, glass, limb, gait4, gait2, flapOf, spec, done, T2, L } from "./kit.js";

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

// ════ [정예] 말벌 여왕 ════ 말벌보다 두 배 큰 여왕. 왕관 같은 등딱지 · 줄무늬 큰 배 · 날개 넷 · 독침
//   p: flap(-1~1) · curl 배 말기 · tilt 기울기 · bite 턱 · sting 독침 내밈 · hurt
const QY = ramp(0xf0b820), QK = ramp(0x2a2234), QKF = rampF(0x2a2234), QR = ramp(0xc8402a);
function queenFrame(p = {}) {
  const W = 76, H = 64, C = board(W, H);
  const fl = p.flap ?? 0, cu = p.curl ?? 0, tl = p.tilt ?? 0;
  const R = rot([36, 30], tl), P = (x, y) => R([x, y]);
  // 뒤 날개 둘
  const wingF = (o, a, len, wd) => { const r = pol(o, a, len), m = lerp(o, r, 0.5); return (x, y) => { const d = Math.hypot(x - m[0], y - m[1]); const ang = Math.atan2(r[1] - o[1], r[0] - o[0]), u = (x - m[0]) * Math.cos(ang) + (y - m[1]) * Math.sin(ang), v = -(x - m[0]) * Math.sin(ang) + (y - m[1]) * Math.cos(ang); return (u / (len / 2)) ** 2 + (v / wd) ** 2 <= 1 && d < len; }; };
  glass(C, wingF(P(34, 18), -2.3 + fl * 0.5, 30, 7), 0.25);
  glass(C, wingF(P(32, 20), -2.8 + fl * 0.4, 22, 5.5), 0.3);
  // 다리 (가는 마디)
  for (const [x, a] of [[33, 1.9], [37, 1.6], [41, 1.3]]) { const s = P(x, 33), e = pol(s, a + tl, 7), f = pol(e, a + 0.9 + tl, 6); C.part(U(capF(s, e, 1, 0.8), capF(e, f, 0.8, 0.5)), QKF); }
  // 배 (줄무늬, 말면 앞으로 굽음)
  const ab = (k) => { const a = 2.2 - cu * 1.1 + k * 0.18 * (1 - cu * 0.4); return pol(P(28, 30), a + tl, 7 + k * 6.5); };
  const segs = [0, 1, 2, 3].map((k) => ab(k));
  C.part(U(...segs.map((q, k) => ellR(q[0], q[1], 9 - k * 1.5, 8 - k * 1.2, 0.6 - cu * 0.5))), QY, { shine: 1 });
  for (let k = 0; k < 4; k++) { const q = segs[k], aa = 2.2 - cu * 1.1 + 1.57; for (let j = -6; j <= 6; j++) C.over(q[0] + Math.cos(aa) * j * 0.9 + 1.5, q[1] + Math.sin(aa) * j * 0.9 + 1.2, QK[2]); }
  // 독침
  const st = pol(segs[3], 2.2 - cu * 1.1 + tl + 0.3, 7 + (p.sting ?? 0) * 4);
  C.part(capF(segs[3], st, 2.4, 0.4), QK, { shine: 1 });
  C.over(st[0], st[1], 0xb0ff60);
  // 가슴 + 머리
  C.part(ellR(...P(38, 22), 8.5, 7.5, -0.2), QK, { shine: 1 });
  C.part(ellR(...P(38, 19), 7, 3.4, -0.2), QR, { sep: !1, shine: 1 }); // 붉은 등판
  // 왕관 등딱지 (뾰족 셋)
  C.part(polyF([P(32, 16), P(33, 9), P(35.5, 14), P(38, 7), P(40.5, 14), P(43, 9), P(44, 16)]), ramp(0xffd860), { shine: 1 });
  C.part(ellR(...P(48, 24), 6.5, 6, 0.1), QY, { shine: 1, lv: 0.05 });
  // 큰 겹눈
  C.part(ellR(...P(50.5, 22.5), 3.4, 3.8, 0.3), ramp(0x8a1820), { shine: 1, sep: !1 });
  C.over(...P(50, 21), 0xffb0a0).over(...P(51, 21.5), 0xff6040);
  // 더듬이
  strokes(C, [[...P(46, 18), ...P(50, 10)], [...P(50, 10), ...P(54, 9)]], QK[1]);
  // 큰 턱
  const bt = p.bite ?? 0;
  C.part(U(capF(P(51, 28), P(55 + bt, 30 - bt), 1.6, 0.8), capF(P(51, 29), P(54 + bt, 32 + bt), 1.6, 0.8)), QK, { shine: 1 });
  // 앞 날개 둘 (가장 앞)
  glass(C, wingF(P(38, 17), -2.0 - fl * 0.6, 32, 7.5), 0.05);
  glass(C, wingF(P(36, 19), -2.6 - fl * 0.5, 23, 5.5), 0.1);
  return done(C, p);
}
export const pxQueen = spec(76, 64, 30, 26,
  { idle: [4, 24], move: [4, 26], wind: [4, 12, !1], atk: [3, 16], rec: [3, 10, !1], hurt: [2, 12, !1], call: [6, 14, !1], volley: [4, 14, !1] },
  (nm, f, n, t) => {
    const fl = [1, 0.2, -1, 0.2][f % 4];
    if (nm === "wind") return { flap: fl, curl: t, tilt: -0.12 * t };
    if (nm === "atk") return { flap: [-1, 0.6, -0.4][f], curl: 1, tilt: 0.5, bite: 1, sting: 1 };
    if (nm === "rec") return { flap: fl, curl: 1 - t, tilt: 0.25 * (1 - t) };
    if (nm === "call") return { flap: fl, tilt: -0.2 - 0.1 * Math.sin(t * 6), bite: f % 2, curl: 0.2 };
    if (nm === "volley") return { flap: fl, curl: 0.8, tilt: 0.25, sting: 1 };
    if (nm === "hurt") return { flap: 0.6, hurt: f === 0, tilt: -0.3 };
    return { flap: fl, tilt: nm === "move" ? 0.15 : 0 };
  }, queenFrame, { flying: !0 });

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
