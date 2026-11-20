// 큰 몬스터 (px3 조각 도구로 그림): [정예] 들판 오우거 · [정예] 초원 켄타우로스
import { sculpt, mat, ellR, capF, polyF, U, minus, lerp, ik } from "./px3.js";
import { flash } from "./pgm2.js";

//                0 외곽     1 그늘    2 어둠    3 중간    4 기본    5 밝음    6 반짝
const OSK = mat([0x0e1014, 0x1b2226, 0x2a3a36, 0x3e5446, 0x587256, 0x7c946a, 0xaebe8e], { tex: "skin", amp: 0.08, lv: 0.07 });
const OSKF = mat([0x0b0f0e, 0x141c1a, 0x1e2a26, 0x2b3b33, 0x384b40, 0x46594c, 0x46594c], { tex: "skin", amp: 0.1 });
const PELT = mat([0x140e08, 0x2e2010, 0x4c3618, 0x6c4e22, 0x8e6a30, 0xb08a44, 0xd0ac62], { tex: "fur", amp: 1.2, dir: 1.4 });
const SPOT = mat([0x0a0806, 0x1a120a, 0x2a1e10, 0x3a2a16, 0x4a361c, 0x5c4424, 0x6c522c], { tex: "fur", amp: 1, dir: 1.4 });
const LEA = mat([0x100806, 0x22120c, 0x381e12, 0x522c1a, 0x6e3e24, 0x8c5432, 0xaa6e44], { tex: "leather", amp: 0.6 });
const LEAD = mat([0x0a0604, 0x180e08, 0x26160c, 0x361e12, 0x482818, 0x5a3420, 0x6c4028], { tex: "leather", amp: 0.6 });
const WOOD = mat([0x120a06, 0x26160c, 0x3e2814, 0x583a1e, 0x765028, 0x946a38, 0xb2884c], { tex: "wood", amp: 1.1, dir: -0.95 });
const IRON = mat([0x0c0e12, 0x1c2028, 0x30363e, 0x4a525c, 0x6c7680, 0x9aa4ae, 0xe2e8ee], { spec: 0.9 });
const BONE = mat([0x2a2418, 0x4a4030, 0x6e6248, 0x948666, 0xb8aa86, 0xd8ccaa, 0xf6eed8], { spec: 0.4 });
// 점들을 지나는 부드러운 닫힌 곡선 (캣멀롬)
const smooth = (P, n = 6) => { const out = []; for (let i = 0; i < P.length; i++) { const p0 = P[(i - 1 + P.length) % P.length], p1 = P[i], p2 = P[(i + 1) % P.length], p3 = P[(i + 2) % P.length]; for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t; out.push([0, 1].map((a) => 0.5 * (2 * p1[a] + (-p0[a] + p2[a]) * t + (2 * p0[a] - 5 * p1[a] + 4 * p2[a] - p3[a]) * t2 + (-p0[a] + 3 * p1[a] - 3 * p2[a] + p3[a]) * t3))); } } return out; };
const L2 = (a, c, t) => a + (c - a) * t;
export const OK = 0.66, CK = 0.7; // 오우거·켄타우로스 크기 (설계 그림 → 실제 픽셀)
const EYEW = 0xe8d878, PUP = 0x140808, MOUTH = 0x160808;

// ════ [정예] 들판 오우거 ════ 회녹색 거구 (키 ≈ 78px). 앞 3/4 각도: 가슴·배가 보는 사람 쪽, 얼굴은 오른쪽을 본다
//   구조: 어깨선 위 머리 → 넓은 어깨·가슴(근육 둘) → 둥근 배 → 허리띠 → 모피 앞자락 → 양옆으로 벌린 두 다리
//         화면 왼쪽 팔(가까운 쪽)은 주먹을 늘어뜨리고, 오른쪽 팔은 몽둥이를 끈다
//   표지: 왼쪽 어깨 쇠 어깨판 · 대각선 가슴 가죽띠 · 이빨 목걸이 · 해골 버클 · 팔뚝 보호대 · 정강이 가죽끈 · 상투
//   p.block: 부위별 단색 구조도
export function ogreFrame(p = {}) {
  const W = 104, H = 92, G = H - 1, S = sculpt(W, H, { k: p.k ?? OK, ax: 45 }), b = p.bob ?? 0;
  const BL = (c) => mat([0x101010, c, c, c, c, c, c]);
  const M = p.block
    ? { skin: BL(0x6a9a6a), head: BL(0xd0c060), armN: BL(0x70b0d0), armF: BL(0x3a6a80), legN: BL(0xc08060), legF: BL(0x9a6448), belly: BL(0x90c090), lea: BL(0x8a5a30), pelt: BL(0xd0a050), iron: BL(0xb0b8c8), bone: BL(0xf0e8d0), wood: BL(0x8a6a40), hair: BL(0x302010) }
    : { skin: OSK, head: OSK, armN: OSK, armF: OSKF, legN: OSK, legF: OSK, belly: OSK, lea: LEA, pelt: PELT, iron: IRON, bone: BONE, wood: WOOD, hair: HAIR };
  const J = {
    head: [49.5, 18.5 + b],
    sN: [29.5, 35.5 + b], eN: [22.5, 47 + b], wN: [20.5, 57.5 + b], // 화면 왼쪽 팔
    sF: [60, 35.5 + b], eF: [66.5, 46.5 + b], wF: [69, 57 + b], // 화면 오른쪽 팔
    hN: [37.5, 64 + b], hF: [52, 64 + b],
  };
  // 다리 자세: [발 x 이동, 들림]
  const nl = p.nLeg ?? [0, 0], fl = p.fLeg ?? [0, 0];
  J.aN = [32.5 + nl[0], 85 - nl[1]], J.aF = [57 + fl[0], 85 - fl[1]];
  J.kN = ik(J.hN, J.aN, 12, 10.2, -1), J.kF = ik(J.hF, J.aF, 12, 10.2, 1);
  // 가까운 팔 흔들기 · 몽둥이 쥔 손 위치 (down 늘어뜨림 / up 치켜듦 / mid 휘두르는 중 / smash 내려찍음)
  const sw = p.swing ?? 0;
  J.eN = [22.5 - sw * 2 - (p.roar ?? 0) * 4, 47 + b + sw * 0.5 - (p.roar ?? 0) * 3], J.wN = [20.5 - sw * 4 - (p.roar ?? 0) * 7, 57.5 + b - (p.roar ?? 0) * 6];
  const CL = { down: [[69, 57 + b], [80, 87]], up: [[72, 22 + b], [83, 5 + b]], mid: [[76, 34 + b], [96, 24 + b]], smash: [[73, 58 + b], [97, 84]] };
  const cp = typeof p.club === "string" || !p.club ? CL[p.club ?? "down"] : p.club;
  J.wF = cp[0];
  J.eF = ik(J.sF, J.wF, 11.5, 11, J.wF[1] < J.sF[1] + 8 ? -1 : 1);
  // ── 오른쪽 팔 (먼 쪽, 어깨는 몸통 뒤) ──
  const farZ = J.wF[1] < 50 ? 30 : -6;
  S.add(capF(J.sF, J.eF, 5.4, 4.6), M.armF, { z: farZ });
  S.add(capF(J.eF, J.wF, 4.6, 4), M.armF, { z: farZ });
  S.add(capF(lerp(J.eF, J.wF, 0.4), lerp(J.eF, J.wF, 0.9), 4.4, 4), p.block ? M.lea : LEAD, { z: farZ + 1, h: 4 });
  // ── 두 다리 (몸통·모피보다 먼저) ──
  for (const [h, k, a, m, dir] of [[J.hF, J.kF, J.aF, M.legF, 1], [J.hN, J.kN, J.aN, M.legN, -1]]) {
    S.add(capF(h, k, 7.4, 5.6), m, { lv: dir > 0 ? -0.04 : 0 });
    S.add(ellR(k[0], k[1], 4.4, 3.8), m, { blend: 2, h: 1.4 });
    S.add(capF(k, a, 5.6, 4.6), m);
    for (const t of [0.35, 0.65]) { const q = lerp(k, a, t); S.add(capF([q[0] - 5.6, q[1]], [q[0] + 5.6, q[1] + 0.4], 1.2), M.lea, { on: 1, h: 1.1 }); }
    // 발: 바깥쪽을 향해 벌어짐
    const fx = a[0], g = a[1] + 6;
    S.add(polyF(dir > 0 ? [[fx - 5, g - 5], [fx + 5, g - 5.5], [fx + 9, g - 2], [fx + 9.5, g + 0.9], [fx - 5.5, g + 0.9]] : [[fx + 5, g - 5], [fx - 5, g - 5.5], [fx - 9, g - 2], [fx - 9.5, g + 0.9], [fx + 5.5, g + 0.9]]), M.lea, { h: 3.4 });
  }
  // ── 몸통: 넓은 어깨에서 엉덩이까지 한 덩어리 (정면에 가깝게, 오른쪽이 살짝 좁아짐) ──
  const torso = polyF(smooth([
    [41, 27.5], [33.5, 29], [28.5, 32.5], [26.5, 38], [27.5, 45], [29.5, 52], [31, 60],
    [44, 63], [57.5, 60.5], [61, 53.5], [62.5, 46], [62, 40], [62.5, 35], [59, 30.5], [52, 28],
  ].map(([x, y]) => [x, y + b])));
  S.add(torso, M.skin, { z: 0, h: 12, prof: "flat" });
  S.add(ellR(39, 37.5 + b, 7, 4.4, -0.1), M.skin, { blend: 3, h: 2.6 }); // 왼쪽 가슴 근육
  S.add(ellR(53.5, 37.5 + b, 5.8, 4.2, 0.1), M.skin, { blend: 3, h: 2.4 }); // 오른쪽 가슴 근육 (돌아서 좁게)
  S.carve(capF([46.6, 33 + b], [46.9, 42 + b], 0.7), 1.2); // 가슴 가운데 홈
  S.add(ellR(47.5, 52 + b, 12.5, 9.5), p.block ? M.belly : M.skin, { blend: 6, h: 5.5 }); // 둥근 배
  S.carve((x, y) => { const u = (x - 47) / 13, v = (y - (43.5 + b)) / 2.4; return u * u + v * v <= 1 && y > 43 + b + u * u * 1.8; }, 1.4); // 가슴 아래 접힘
  S.carve(ellR(48.5, 54.5 + b, 1.1, 1.4), 2.2, !1); // 배꼽
  S.carve(capF([30, 45 + b], [32.5, 56 + b], 1.1), 0.9).carve(capF([61, 46 + b], [59.5, 56 + b], 1.1), 0.9); // 옆구리
  for (const [x, y] of [[45, 40], [48, 40.5], [46.5, 42.5], [44, 43], [49.5, 43]]) S.decal(x, y + b, p.block ? 0x101010 : 0x1e2820); // 가슴 털
  // 대각선 가슴 가죽띠 (오른쪽 어깨 → 왼쪽 허리) + 쇠고리
  S.add(capF([57, 30.5 + b], [33, 59 + b], 1.6), M.lea, { on: 1, h: 1.3, lift: 0.8 });
  S.add(ellR(45, 45 + b, 1.8, 1.8), M.iron, { on: 1, h: 1.1, lift: 0.6 });
  // ── 허리띠 + 해골 버클 + 모피 (양옆 + 앞자락) ──
  const fr = [];
  for (let k = 0; k <= 10; k++) fr.push([58.5 - k * 2.75, 67 + b + (k % 2 ? 3 : 0)]);
  const pelt = polyF([[30.5, 60 + b], [59, 60 + b], [59.5, 65 + b], ...fr, [30, 65 + b]]);
  S.add(pelt, M.pelt, { h: 3.6, lift: 0 });
  const flap = polyF([[40, 62 + b], [53, 62 + b], [52, 72 + b], [49.5, 70 + b], [47, 74 + b], [44.5, 70.5 + b], [42, 73 + b]]); // 앞자락
  S.add(flap, M.pelt, { h: 2.6, lift: 1.5 });
  p.block || S.paint((x, y) => (pelt(x, y) || flap(x, y)) && [[34, 63.5], [39.5, 66], [56, 63.5], [45, 66.5], [50, 69.5], [44, 71]].some(([sx, sy]) => (x - sx) ** 2 + ((y - b - sy) * 1.3) ** 2 < 3), SPOT);
  S.add(polyF([[30, 59 + b], [59.5, 59 + b], [59.5, 62.2 + b], [45, 63.4 + b], [30, 62.2 + b]]), M.lea, { on: 1, h: 1.5, lift: 0.8 });
  for (const x of [34, 40, 55]) S.add(ellR(x, 60.8 + b, 0.9, 0.9), M.iron, { on: 1, h: 0.8 });
  S.add(ellR(47, 61.4 + b, 3.5, 3.7), M.bone, { on: 1, h: 2.4, lift: 1 });
  p.block || S.carve(ellR(45.9, 60.9 + b, 0.9, 1), 2, !1).carve(ellR(48.2, 60.9 + b, 0.9, 1), 2, !1).carve(capF([46.3, 63.5 + b], [47.7, 63.5 + b], 0.5), 1.4, !1);
  // ── 머리 (어깨선 위, 오른쪽을 본다): 목 · 두개골 · 눈썹뼈 · 두 눈 · 뭉툭코 · 주걱턱 · 엄니 둘 · 두 귀 · 상투 ──
  const [hx, hy] = J.head;
  S.add(capF([46, 30 + b], [hx, hy + 6], 7, 6), M.skin, { blend: 3, h: 3 }); // 굵은 목
  S.add(U(capF([hx - 1, hy - 6.5], [hx - 3, hy - 11], 1.9, 1.4), capF([hx - 3, hy - 11], [hx - 7, hy - 12.5], 1.4, 0.6)), M.hair, { lift: 3 }); // 상투
  S.add(polyF([[hx - 6.5, hy - 1], [hx - 12.5, hy - 5.5], [hx - 6, hy - 4.5]]), M.head, { h: 2, lift: 2 }); // 왼쪽 귀
  S.add(polyF([[hx + 6, hy - 1.5], [hx + 10, hy - 5], [hx + 6.4, hy - 4.4]]), M.head, { h: 1.6, lift: 1 }); // 오른쪽 귀 (작게)
  S.add(U(ellR(hx, hy - 1, 7.4, 6.8), polyF([[hx - 7, hy + 1.5], [hx + 7.4, hy + 1], [hx + 8.2, hy + 5.4], [hx + 5, hy + 9.4], [hx - 4.5, hy + 9.4], [hx - 7.6, hy + 5.4]])), M.head, { h: 7.5 });
  S.add(ellR(hx - 1, hy - 6.6, 2, 1.2), M.lea, { on: 1, h: 1, lift: 0.5 }); // 상투 끈
  if (!p.block) {
    S.tone(ellR(hx, hy, 7, 6.5), 0.05);
    S.add(capF([hx - 6, hy - 2.8], [hx + 6.6, hy - 2.6], 2, 1.8), M.head, { blend: 2, h: 2.4 }); // 눈썹뼈 (두 눈 위로 가로)
    S.carve(capF([hx + 1, hy - 2.4], [hx + 1.4, hy - 0.6], 0.6), 1.2, !1); // 미간 주름
    S.add(ellR(hx + 2.4, hy + 1.8, 2.8, 2.3), M.head, { blend: 2, h: 3.2 }); // 뭉툭코 (오른쪽으로 치우침)
    S.carve(ellR(hx + 1.4, hy + 3, 0.6, 0.5), 1.2, !1).carve(ellR(hx + 3.6, hy + 3, 0.6, 0.5), 1.2, !1); // 콧구멍
    const ro = p.roar ?? 0;
    S.carve(capF([hx - 5, hy + 5.8 + ro], [hx + 7, hy + 5.4 + ro], 0.6 + ro * 1.6), 2.4, !1); // 입
    for (let x = hx - 3; x < hx + 5.5; x += 1) for (let yy = 0; yy <= ro * 3; yy++) S.decal(x, hy + 5.6 + yy, yy > 0 && yy < ro * 3 ? 0x5a1418 : MOUTH);
    // 두 눈 (오른쪽 눈은 조금 작게)
    S.decal(hx - 4, hy - 0.6, 0x1b2522).decal(hx - 3, hy - 0.8, 0xe0b840).decal(hx - 2, hy - 0.8, 0xfff4b0).decal(hx - 1, hy - 0.6, 0x1b2522);
    S.decal(hx + 4, hy - 0.8, 0xe0b840).decal(hx + 5, hy - 0.8, 0xfff4b0).decal(hx + 6, hy - 0.6, 0x1b2522);
    for (const x of [-4, -3, -2, -1, 4, 5, 6]) S.decal(hx + x, hy - 1.8, 0x141c1a);
    S.tone(capF([40, 30.5 + b], [56, 30.5 + b], 2.4), -0.12); // 턱 밑 그늘
  }
  S.add(capF([hx - 3.6, hy + 7], [hx - 3.8, hy + 2], 1.3, 0.5), M.bone, { h: 1.5, lift: 6 }); // 엄니
  S.add(capF([hx + 5, hy + 6.6], [hx + 5.2, hy + 1.8], 1.2, 0.5), M.bone, { h: 1.5, lift: 6 });
  // 이빨 목걸이
  for (const [x, y] of [[40, 31.5], [43, 32.6], [46.5, 33], [50, 32.6], [53, 31.6]]) S.add(polyF([[x - 0.9, y + b - 0.6], [x + 0.9, y + b - 0.6], [x, y + b + 2]]), M.bone, { h: 1, lift: 2 });
  // ── 화면 왼쪽 팔 (가까운 쪽): 어깨 → 팔꿈치 → 늘어뜨린 주먹, 쇠 어깨판 ──
  S.add(ellR(J.sN[0] - 0.5, J.sN[1] + 1, 6, 5.6), M.armN, { lift: 2 });
  S.add(capF(J.sN, J.eN, 5.6, 4.8), M.armN, { lift: 2 });
  S.add(ellR(...lerp(J.sN, J.eN, 0.5), 3.8, 3, Math.atan2(J.eN[1] - J.sN[1], J.eN[0] - J.sN[0])), M.armN, { blend: 2, h: 1.6 });
  S.add(capF(J.eN, J.wN, 5, 4.2), M.armN, { lift: 2 });
  S.add(capF(lerp(J.eN, J.wN, 0.4), lerp(J.eN, J.wN, 0.92), 4.8, 4.4), M.lea, { on: 1, h: 1.5 });
  for (const t of [0.55, 0.8]) { const q = lerp(J.eN, J.wN, t); S.add(ellR(q[0] + 0.5, q[1], 0.95, 0.95), M.iron, { on: 1, h: 0.9 }); }
  S.add(ellR(J.wN[0] - 0.4, J.wN[1] + 3.4, 4.6, 4.3), M.armN, { h: 4.5, lift: 2 });
  p.block || S.carve(capF([J.wN[0] - 3.5, J.wN[1] + 2.6], [J.wN[0] + 2.5, J.wN[1] + 3], 0.45), 1.1, !1);
  S.add(minus(ellR(J.sN[0] - 0.5, J.sN[1] - 0.5, 7.4, 6, -0.3), (x, y) => y > J.sN[1] + 3.5 - (x - J.sN[0]) * 0.3), M.iron, { lift: 3, h: 3 });
  S.add(minus(ellR(J.sN[0] - 2, J.sN[1] + 2.5, 6.2, 4.4, -0.4), (x, y) => y < J.sN[1] + 1.5 || y > J.sN[1] + 6.2 - (x - J.sN[0]) * 0.3), M.iron, { lift: 4, h: 2 });
  p.block || S.decal(J.sN[0] + 2, J.sN[1] - 3, 0xe8eef4).decal(J.sN[0] - 3, J.sN[1] - 3.5, 0xe8eef4);
  // ── 오른쪽 주먹 + 몽둥이 (땅으로) ──
  const c1 = cp[1], cd = Math.hypot(c1[0] - J.wF[0], c1[1] - J.wF[1]), ux = (c1[0] - J.wF[0]) / cd, uy = (c1[1] - J.wF[1]) / cd;
  const c0 = [J.wF[0] + ux * 3.5, J.wF[1] + uy * 3.5];
  S.add(U(capF([J.wF[0] - ux * 2, J.wF[1] - uy * 2], c0, 2.4, 2.8), capF(c0, c1, 2.8, 5.4), ellR(c1[0] - ux * 0.5, c1[1] - uy * 0.5, 5.4, 4.6)), M.wood);
  for (const t of [0.5, 0.82]) { const q = lerp(c0, c1, t), w = 3.1 + t * 2.4; S.add(capF([q[0] + uy * w, q[1] - ux * w], [q[0] - uy * w, q[1] + ux * w], 1.15), M.iron, { on: 1, h: 1.4, lift: 0.8 }); }
  for (const [t, o] of [[0.62, 1], [0.8, 1], [0.97, 1], [0.7, -1], [0.92, -1]]) {
    const q = lerp(c0, c1, t), w = 2.9 + t * 2.5;
    S.add(capF([q[0] + uy * o * (w - 0.5), q[1] - ux * o * (w - 0.5)], [q[0] + uy * o * (w + 2.6), q[1] - ux * o * (w + 2.6)], 1, 0.35), M.iron, { h: 1.5, lift: 3 });
  }
  S.add(ellR(J.wF[0], J.wF[1], 4.4, 4.1), M.armF, { h: 4.5, lift: 2 });
  const C = S.render({ debug: p.debug, rim: !p.block });
  return p.hurt ? flash(C) : C;
}

// ════ [정예] 초원 켄타우로스 ════ 밤색 말 몸 + 사람 상체. 뒤로 묶은 머리와 머리띠, 녹색 천 안장깔개,
//   가죽 가슴띠, 말 등의 화살통. 큰 활을 앞으로 겨누고 시위를 뺨까지 당긴다
const HOR = mat([0x120806, 0x2a140c, 0x461f10, 0x683018, 0x8a4422, 0xac5c30, 0xcc7c46], { tex: "fur", amp: 0.5, dir: 0.15 });
const HORF = mat([0x0c0604, 0x1c0e08, 0x2a140c, 0x381a0e, 0x461f10, 0x562814, 0x562814], { tex: "fur", amp: 0.4, dir: 0.15 });
const HAIR = mat([0x0a0806, 0x18120c, 0x281e14, 0x3a2c1c, 0x4e3c26, 0x665034, 0x806844], { tex: "fur", amp: 1.3, dir: 1.45 });
const HSKIN = mat([0x1a0e0a, 0x3a2216, 0x5c3a24, 0x825634, 0xa67448, 0xc8925e, 0xe8b880], { tex: "skin", amp: 0.12 });
const FACE = mat(HSKIN.ramp, { tex: "skin", amp: 0.08, lv: 0.16 });
const HSKINF = mat([0x120a06, 0x26160e, 0x3a2216, 0x4c2c1c, 0x5c3a24, 0x6c462c, 0x6c462c], { tex: "skin", amp: 0.1 });
const CLG = mat([0x0c1210, 0x18261e, 0x26402e, 0x365a40, 0x4a7652, 0x649468, 0x88b486], { tex: "cloth", amp: 0.4 });
const HOOF = mat([0x08080a, 0x141418, 0x202026, 0x2e2e36, 0x3e3e48, 0x52525e, 0x707080], { spec: 0.3 });
const FEATH = mat([0x1a0806, 0x4a140e, 0x7a2416, 0xa63a22, 0xc85a34, 0xe68a56, 0xffb888]);
const BOW = mat([0x120a06, 0x26160c, 0x3e2814, 0x583a1e, 0x765028, 0x946a38, 0xb8904e], { tex: "wood", amp: 0.5, dir: 1.5 });
const SOCK = mat([0x2a241c, 0x5a5040, 0x847a66, 0xa89e88, 0xc8c0aa, 0xe2dcc8, 0xf6f2e4], { tex: "fur", amp: 0.4, dir: 1.5 });
const PAINT = 0xb02a1e;
export function centaurFrame(p = {}) {
  const W = 98, H = 88, G = H - 1, S = sculpt(W, H, { k: p.k ?? CK, ax: 41 }), b = p.bob ?? 0;
  // 말 다리: 위 → 무릎(앞다리)/뒷무릎(뒷다리) → 발목 마디 → 발굽. sock: 흰 양말 무늬, up: 발굽 높이(든 다리)
  const lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) };
  const leg = (top, knee, fet, m, o = {}) => {
    const d = o.d ?? [0, 0];
    o.up = o.up || d[1] > 3;
    knee = [knee[0] + d[0] * 0.5 + (o.up && !o.back ? d[1] * 0.35 : 0), knee[1] - d[1] * 0.55];
    fet = [fet[0] + d[0], fet[1] - d[1] - (o.up && d[1] > 3 ? 0 : 0)];
    const hb = o.up ? fet[1] + 7 : G, hx = fet[0] + (o.up ? 2.6 : 1.2);
    S.add(capF(top, knee, o.back ? 4.2 : 3.8, 2.4), m);
    S.add(capF(knee, fet, 2.1, 1.8), m, { lift: 0.5 });
    S.add(ellR(fet[0] + 0.3, fet[1] + 0.5, 2.4, 2.1), m, { lift: 0.5 });
    S.add(capF([fet[0] + 0.3, fet[1] + 1], [hx, hb - 4], 1.9, 2), m, { lift: 0.5 });
    o.sock && S.paint((x, y) => y > fet[1] - 1.5 && y < hb - 4 && Math.abs(x - (fet[0] + hx) / 2) < 4.5, SOCK);
    S.add(polyF(o.up ? [[hx - 2.4, hb - 4.6], [hx + 2.6, hb - 3.4], [hx + 2.4, hb + 1.2], [hx - 3, hb]] : [[hx - 2.6, hb - 4.5], [hx + 2.4, hb - 4.5], [hx + 3.4, hb + 0.9], [hx - 3, hb + 0.9]]), HOOF, { h: 2.5 });
  };
  // ── 먼 다리 · 꼬리 ──
  leg([49, 56 + b], [47.5, 67], [47, 77], HORF, { d: lg.ff });
  leg([28, 57 + b], [27, 67.5], [29, 77], HORF, { back: 1, d: lg.bf });
  S.add(U(capF([12, 43 + b], [7, 51 + b], 3.4, 4.2), capF([7, 51 + b], [6, 66 + b], 4.2, 1.5), capF([9.5, 47 + b], [11, 60 + b], 2, 0.9)), HAIR, { z: -2 });
  // ── 말 몸: 몸통 + 앞가슴 + 엉덩이 + 근육 ──
  S.add(ellR(38, 51 + b, 17, 9.5), HOR, { z: 0, h: 10, prof: "flat" });
  S.add(ellR(54, 49 + b, 8.5, 10), HOR, { blend: 4, h: 6 });
  S.add(ellR(21.5, 48 + b, 10.5, 10), HOR, { blend: 5, h: 7 });
  S.add(ellR(52.5, 50 + b, 4.6, 6, 0.2), HOR, { blend: 2, h: 2 });
  S.add(ellR(22.5, 52 + b, 6.5, 7.5, -0.3), HOR, { blend: 2, h: 2.2 });
  S.carve(capF([29, 58.5 + b], [47, 59 + b], 1.2), 1.2);
  S.carve(capF([30, 45 + b], [32, 55 + b], 1), 0.9);
  // 옆구리 화살통 (말 몸에 매달림) + 화살대 · 깃
  S.add(capF([27.5, 56 + b], [35, 42 + b], 2.9, 2.6), LEA, { on: 1, h: 2.6, lift: 1.2 });
  S.add(capF([27, 53 + b], [30, 52.5 + b], 1), IRON, { on: 1, h: 0.8 });
  for (const [dx, dy] of [[0, 0], [2, 0.8], [-1.4, 1.2]]) {
    S.add(capF([35 + dx, 42.5 + dy + b], [37.5 + dx, 37.5 + dy + b], 0.55), BOW, { h: 0.8, lift: 4 });
    S.add(polyF([[36.4 + dx, 38.6 + dy + b], [38.6 + dx, 37.8 + dy + b], [38.6 + dx, 34.6 + dy + b]]), FEATH, { h: 1, lift: 4.5 });
  }
  // 안장깔개 (녹색 천 + 금띠 + 술)
  const bl = polyF([[40, 41.5 + b], [57, 40.5 + b], [59, 51 + b], [55, 53.5 + b], [51, 52 + b], [47, 54 + b], [42.5, 52 + b]]);
  S.add(bl, CLG, { on: 1, h: 1.6, lift: 0.8 });
  S.paint((x, y) => bl(x, y) && Math.abs(y - (50.4 + b)) < 0.8, mat([0x1a0e06, 0x3a2210, 0x6a4018, 0x9a6020, 0xc88a30, 0xe8b050, 0xffd880]));
  // 가까운 다리: 앞다리는 들어 올림, 흰 양말
  leg([23, 58 + b], [18.5, 67.5], [20.5, 77], HOR, { back: 1, sock: 1, d: lg.bn });
  leg([54.5, 56 + b], [55.5, 66], [55, 76], HOR, { sock: 1, d: lg.fn });
  // ── 먼 팔 (시위를 턱 앞까지, 팔꿈치 뒤로 높이) ──
  const dr = p.draw ?? 0, pullX = 73.2 - dr * 5.7, handF = dr > 0.1 ? [pullX - 1.5, 23.6 + b] : [58, 42 + b];
  const elF = dr > 0.1 ? [L2(55, 48.5, dr), L2(31, 24.5, dr) + b] : [53, 36 + b];
  S.add(capF([55.5, 27 + b], elF, 3, 2.5), HSKINF, { z: 10 });
  S.add(capF(elF, handF, 2.5, 2), HSKINF, { z: 10 });
  // ── 사람 상체 (더 크고 근육질) ──
  S.add(capF([55, 45 + b], [57.5, 34 + b], 6, 6.4), HSKIN, { z: 12 });
  S.add(ellR(58.5, 30.5 + b, 7.6, 7.8, 0.1), HSKIN, { blend: 3, h: 4 });
  S.add(ellR(61, 29.5 + b, 4.2, 3, 0.35), HSKIN, { blend: 2, h: 1.8 }); // 가슴 근육
  S.carve(capF([59.6, 34.5 + b], [60, 42 + b], 0.6), 0.9).carve(capF([56.5, 37.5 + b], [62, 37.6 + b], 0.5), 0.6).carve(capF([56.5, 40.5 + b], [61.6, 40.6 + b], 0.5), 0.5);
  S.add(capF([53.5, 25 + b], [62.5, 41 + b], 1.5), LEA, { on: 1, h: 1.2, lift: 0.6 }); // 가슴띠
  S.add(ellR(57.5, 32 + b, 1.4, 1.4), IRON, { on: 1, h: 0.9 });
  S.add(polyF([[49, 42 + b], [63, 41 + b], [64, 46.5 + b], [60, 49.5 + b], [55, 48 + b], [49.5, 49 + b]]), CLG, { on: 1, h: 2, lift: 1 }); // 허리 천
  // ── 머리: 목 · 옆얼굴 · 수염 · 땋은 머리 · 머리띠 · 뺨 물감 ──
  const hx = 62, hy = 15.5 + b;
  S.add(capF([59.5, 25 + b], [hx - 0.5, hy + 4], 2.9, 2.5), HSKIN, { blend: 2, h: 1.6 });
  S.add(U(capF([hx - 3.5, hy - 2], [hx - 9, hy + 3], 2.4, 2), capF([hx - 9, hy + 3], [hx - 11, hy + 14], 2, 1.1)), HAIR, { z: 14 });
  for (let k = 0; k < 4; k++) S.carve(capF([hx - 9.6 - k * 0.45, hy + 4.5 + k * 2.4], [hx - 8.4 - k * 0.45, hy + 5.6 + k * 2.4], 0.5), 0.9, !1); // 땋은 마디
  S.add(U(ellR(hx, hy, 5.2, 5.6), polyF([[hx + 2, hy - 1.6], [hx + 6, hy + 0.8], [hx + 4.8, hy + 2.6], [hx + 5.2, hy + 4.8], [hx + 2.8, hy + 6.6], [hx - 1, hy + 5.6]])), FACE, { z: 16, h: 4.5 });
  S.add(minus(ellR(hx - 0.6, hy - 1.6, 5.6, 5), (x, y) => y > hy - 1.8 + (x - hx) * 0.6 || (x > hx + 1.5 && y > hy - 3.2)), HAIR, { on: 1, h: 1.6, lift: 0.8 });
  S.add(polyF([[hx + 0.5, hy + 3.4], [hx + 5.4, hy + 4.4], [hx + 4.8, hy + 7.6], [hx + 2, hy + 8.6], [hx - 1.5, hy + 6]]), HAIR, { on: 1, h: 1.2, lift: 0.6 }); // 수염
  S.add(capF([hx - 5.2, hy - 1.4], [hx + 4, hy - 3], 0.9), CLG, { on: 1, h: 1, lift: 0.6 });
  S.add(ellR(hx + 5.2, hy + 1.3, 1.2, 1.1), FACE, { blend: 1, h: 1 });
  S.decal(hx + 2.4, hy + 0.2, 0x2a1a10).decal(hx + 3.3, hy + 0.2, 0xf4e8d0).decal(hx + 1.6, hy - 0.9, 0x2a1e14).decal(hx + 2.6, hy - 1, 0x2a1e14).decal(hx + 3.6, hy - 0.8, 0x2a1e14);
  // ── 가까운 팔: 굵게, 활을 앞으로 ──
  S.add(ellR(60.5, 27 + b, 4.4, 3.8), HSKIN, { lift: 2 });
  S.add(capF([61, 28 + b], [67.5, 29 + b], 2.9, 2.4), HSKIN, { lift: 2 });
  S.add(capF([67.5, 29 + b], [76.5, 28.6 + b], 2.4, 2), HSKIN, { lift: 2 });
  S.add(capF([68, 29 + b], [71.2, 28.7 + b], 2.5), LEA, { on: 1, h: 1.2 });
  // 활
  const top = [74.5, 8 + b], bot = [74.5, 48 + b], pull = [pullX, 24 + b];
  S.add((x, y) => {
    const t = (y - top[1]) / (bot[1] - top[1]);
    if (t < 0 || t > 1) return !1;
    const cx = top[0] + Math.sin(t * Math.PI) * 5.4 - 1 + (t < 0.08 || t > 0.92 ? -1.3 : 0);
    return Math.abs(x - cx) <= 1.25 - Math.abs(t - 0.5) * 0.5;
  }, BOW, { h: 2, lift: 6 });
  S.add(capF([78.4, 26 + b], [78.6, 31 + b], 1.6), LEA, { on: 1, h: 0.8 }); // 활 손잡이 감개
  const line = (a, c, col) => { const n = Math.ceil(Math.hypot(c[0] - a[0], c[1] - a[1]) * 1.5); for (let k = 0; k <= n; k++) S.decal(a[0] + ((c[0] - a[0]) * k) / n, a[1] + ((c[1] - a[1]) * k) / n, col); };
  line([top[0] - 1.8, top[1] + 1], pull, 0xd8d0b8);
  line(pull, [bot[0] - 1.8, bot[1] - 1], 0xd8d0b8);
  if (p.arrow !== !1 && dr > 0.1) {
    const tip = pullX + 18.5;
    line(pull, [tip - 3, 24.4 + b], 0x8a6234);
    S.add(polyF([[tip - 3.5, 22.8 + b], [tip, 24.4 + b], [tip - 3.5, 26 + b]]), IRON, { h: 1.4, lift: 8 });
    S.add(polyF([[pull[0] - 0.5, pull[1] - 2], [pull[0] + 2.5, pull[1] - 0.2], [pull[0] - 0.5, pull[1] + 0.4]]), FEATH, { h: 1, lift: 7 });
  }
  S.add(ellR(78.5, 28.6 + b, 2.3, 2.4), HSKIN, { h: 2.2, lift: 4 });
  S.add(ellR(handF[0] + 1.8, handF[1] + 0.6, 2, 1.9), HSKINF, { h: 2, lift: 5 });
  const C = S.render({ debug: p.debug, block: p.block });
  return p.hurt ? flash(C) : C;
}

// ── 오우거 동작 → 자세 ──
const LP = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const OCL = { down: [[69, 57], [80, 87]], up: [[72, 22], [83, 5]], mid: [[76, 34], [96, 24]], smash: [[73, 58], [97, 84]] };
const club = (a, c, t) => [LP(OCL[a][0], OCL[c][0], t), LP(OCL[a][1], OCL[c][1], t)];
export const pxOgre = {
  fw: Math.round(104 * OK), fh: Math.round(92 * OK), w: 28, h: 46,
  anims: { idle: [6, 6], move: [8, 9], wind: [4, 8, !1], atk: [3, 14, !1], rec: [3, 7, !1], hurt: [2, 10, !1], stomp: [4, 10, !1], roar: [4, 8, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * Math.PI * 2, s = Math.sin(ph), c = Math.cos(ph);
    let P = {};
    if (nm === "idle") P = { bob: s * 0.8, swing: s * 0.15 };
    if (nm === "move") P = { bob: -Math.abs(c) * 1.4 + 0.5, swing: s * 0.8, nLeg: [3.5 * s, 3.5 * Math.max(0, c)], fLeg: [-3.5 * s, 3.5 * Math.max(0, -c)] };
    if (nm === "wind") P = { club: club("down", "up", t), bob: -t, roar: t > 0.6 ? 0.3 : 0 };
    if (nm === "atk") P = { club: f === 0 ? OCL.mid : OCL.smash, bob: f === 0 ? 0 : 2, roar: 0.5, nLeg: [-1, 0], fLeg: [2, 0] };
    if (nm === "rec") P = { club: club("smash", "down", t), bob: 2 * (1 - t) };
    if (nm === "hurt") P = { hurt: f === 0, roar: 0.3, bob: 1 };
    if (nm === "stomp") P = { nLeg: [[2, 6], [3, 12], [3, 13], [0, 0]][f], bob: [-1, -2, -2, 2][f], swing: [-0.5, -1, -1, 0.5][f], roar: f === 3 ? 0.6 : 0.2 };
    if (nm === "roar") P = { roar: [0.4, 1, 1, 0.6][f], bob: [0, -1.5, -1.5, 0][f], swing: -0.5 };
    return ogreFrame(P);
  },
};

// ── 켄타우로스 동작 → 자세 ──
const gallop = (f, n, A, lift) => {
  const ph = (f / n) * Math.PI * 2, s = Math.sin(ph), c = Math.cos(ph), s2 = Math.sin(ph + 0.7), c2 = Math.cos(ph + 0.7);
  return { fn: [A * s, lift * Math.max(0, c)], ff: [A * s2, lift * Math.max(0, c2)], bn: [-A * s, lift * Math.max(0, -c)], bf: [-A * s2, lift * Math.max(0, -c2)] };
};
export const pxCentaur = {
  fw: Math.round(98 * CK), fh: Math.round(88 * CK), w: 34, h: 44,
  anims: { idle: [6, 6], move: [8, 15], aim: [4, 10, !1], shoot: [3, 14, !1], rear: [5, 10, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * Math.PI * 2;
    let P = {};
    if (nm === "idle") P = { bob: Math.sin(ph) * 0.6, legs: { fn: [0, f === 3 ? 1.5 : 0] } };
    if (nm === "move") P = { bob: -Math.abs(Math.cos(ph)) * 1.6 + 0.6, legs: gallop(f, n, 5, 4) };
    if (nm === "aim") P = { draw: t, bob: 0 };
    if (nm === "shoot") P = { draw: [0.15, 0.6, 1][f], arrow: f > 0, bob: 0 };
    if (nm === "rear") P = { bob: [-1, -3, -4, -2, 1][f], legs: { fn: [[3, 6], [4, 11], [4, 12], [3, 8], [0, 0]][f], ff: [[2, 4], [3, 9], [3, 10], [2, 6], [0, 0]][f], bn: [-2, 0], bf: [-1, 0] } };
    if (nm === "hurt") P = { hurt: f === 0, bob: 1 };
    return centaurFrame(P);
  },
};
