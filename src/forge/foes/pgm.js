// 그래스메어 몬스터 (초안) — 고블린과 같은 그리는 법: 부위마다 모양 → 둥근 입체 6단 명암 → 겹침 선 → 부위 색 외곽선
//   늑대 · 멧돼지 · 말벌 · 맨드레이크 · [정예] 오우거 · [정예] 켄타우로스. 모두 오른쪽을 본다. 발바닥 = 맨 아래 줄
import { board, ellR, capF, polyF, U, minus, pol, lerp } from "./pgob.js";

//                 0 외곽   1 그늘    2 어둠    3 중간    4 기본    5 밝음    6 반짝
const GRAY = [0x0e1014, 0x1e2228, 0x30363e, 0x4a515a, 0x6a727a, 0x8e969c, 0xbac0c4];
const GRAYF = [0x0a0c10, 0x14181c, 0x1e2228, 0x282e34, 0x343a42, 0x40474e, 0x40474e];
const CREAM = [0x1a1814, 0x3a342a, 0x5a5242, 0x7e745e, 0xa0967c, 0xc4ba9e, 0xe2dac2];
const BROWN = [0x100a08, 0x22140e, 0x3a2416, 0x553620, 0x744c2c, 0x96683e, 0xb88a58];
const BROWNF = [0x0c0806, 0x180e0a, 0x22140e, 0x2e1c12, 0x3a2416, 0x482e1c, 0x482e1c];
const BRIST = [0x0a0606, 0x160e0a, 0x22160e, 0x302014, 0x40301e, 0x584430, 0x705a40];
const BONE = [0x2a2418, 0x4a4030, 0x6e6248, 0x948666, 0xb8aa86, 0xd8ccaa, 0xf4ecd4];
const HOOF = [0x08080a, 0x141418, 0x202026, 0x2e2e36, 0x3e3e48, 0x52525e, 0x6a6a78];
const YEL = [0x1a1006, 0x4a2c08, 0x8a5a10, 0xc08a18, 0xe0b028, 0xf4d050, 0xfff090];
const BLK = [0x060608, 0x101014, 0x1a1a20, 0x26262e, 0x34343e, 0x484854, 0x62626e];
const REDE = [0x140406, 0x3a0a0e, 0x6a1418, 0x9a2020, 0xc83a2a, 0xe86a40, 0xffb070];
const WING = [0x2a3440, 0x5a7080, 0x8aa0b0, 0xb0c6d4, 0xcfe0ea, 0xe8f4fa, 0xffffff];
const ROOT = [0x140e0a, 0x2e2218, 0x4e3c2a, 0x725a40, 0x96805e, 0xbaa682, 0xdccaa6];
const ROOTF = [0x100a08, 0x221a12, 0x3a2c1e, 0x4e3c2a, 0x5e4a34, 0x6e5a40, 0x6e5a40];
const LEAF = [0x0c160e, 0x16301a, 0x22481e, 0x346a26, 0x4c8e30, 0x70b040, 0xa4d466];
const OGRE = [0x140e0c, 0x2e2018, 0x4c3526, 0x6c4e36, 0x8e6a48, 0xb08a60, 0xd0ae82];
const OGREF = [0x120c0a, 0x241a14, 0x382820, 0x4a3628, 0x5c4432, 0x6e523c, 0x6e523c];
const LE = [0x120a08, 0x22140e, 0x362216, 0x50331c, 0x6c4826, 0x8c6234, 0xae8048];
const FUR = [0x141008, 0x2c2212, 0x4a3a1e, 0x6a5430, 0x8c7244, 0xae945c, 0xccb47a];
const WOOD = [0x120a06, 0x26160c, 0x3e2814, 0x583a1e, 0x765028, 0x946a38, 0xb2884c];
const ST = [0x0e1016, 0x1e222a, 0x343a46, 0x525a68, 0x76808e, 0xa2aab6, 0xd8dee8];
const CHEST = [0x120806, 0x2a140c, 0x481f10, 0x6a3018, 0x8c4422, 0xae5c2e, 0xcc7a40];
const CHESTF = [0x0c0604, 0x1c0e08, 0x2a140c, 0x381a0e, 0x481f10, 0x582614, 0x582614];
const MANE = [0x0a0806, 0x18120c, 0x281e14, 0x3a2c1c, 0x4e3c26, 0x645032, 0x7c6640];
const SKIN = [0x1a0e0a, 0x3a2216, 0x5e3a24, 0x845634, 0xa87448, 0xc8925e, 0xe4b47c];
const SKINF = [0x120a06, 0x26160e, 0x3a2216, 0x4c2c1c, 0x5e3a24, 0x6e462c, 0x6e462c];
const CLOTH = [0x0e1210, 0x1c2622, 0x2c3a32, 0x405446, 0x58705c, 0x748e74, 0x96ae92];
const mixc = (a, b, t) => { const g = (s) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t); return (g(16) << 16) | (g(8) << 8) | g(0); };
function glassWing(C, f, dark = 0, back = !1) {
  for (let y = 0; y < C.H; y++) for (let x = 0; x < C.W; x++) {
    if (!f(x + 0.5, y + 0.5)) continue;
    const i = y * C.W + x, edge = !f(x - 0.5, y + 0.5) || !f(x + 0.5, y - 0.5) || !f(x + 1.5, y + 0.5) || !f(x + 0.5, y + 1.5);
    if (back && C.d[i] >= 0) continue; // 먼 날개는 몸 뒤로
    if (edge) C.d[i] = mixc(0x2e3a46, 0x10141a, dark);
    else if (C.d[i] >= 0) C.d[i] = mixc(C.d[i], 0xd8e8f2, 0.5 - dark);
    else C.d[i] = (x + y) & 1 ? -1 : mixc(0xd4e6f0, 0x5a6a78, dark);
  }
}
const dots = (C, pts, c) => pts.forEach(([x, y]) => C.over(x, y, c));
const strokes = (C, list, c) => list.forEach(([x0, y0, x1, y1]) => { const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0))); for (let k = 0; k <= n; k++) C.over(x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n, c); });

// ════ 초원 회색늑대 ════ 날렵한 몸, 갈기 진 목, 북슬한 꼬리, 배는 크림색. 으르렁거리며 낮게 노려본다
export function wolfFrame(p = {}) {
  const W = 62, H = 38, G = H - 1, C = board(W, H);
  const b = p.bob ?? 0;
  // 먼 다리
  C.part(U(capF([40, 24 + b], [42, 30], 2.4, 1.6), capF([42, 30], [43, 35.5], 1.6, 1.4), ellR(44.5, 36, 2.4, 1.3)), GRAYF);
  C.part(U(capF([20, 24 + b], [23, 29], 3, 1.8), capF([23, 29], [18.5, 32], 1.8, 1.4), capF([18.5, 32], [19.5, 35.5], 1.4, 1.3), ellR(21, 36, 2.4, 1.3)), GRAYF);
  // 꼬리 (북슬, 끝으로 갈수록 가늘게 아래로)
  C.part(U(capF([13, 19 + b], [7, 23 + b], 3.2, 3.8), capF([7, 23 + b], [4.5, 29.5 + b], 3.8, 1.6), minus(ellR(7, 24 + b, 4.6, 5), (x, y) => x > 11)), GRAY, { shine: 1 });
  dots(C, [[6, 26], [5, 28], [8, 22], [10, 21]], GRAY[2]);
  C.over(4.5, 29.5 + b, CREAM[4]).over(5, 30 + b, CREAM[3]);
  // 몸통
  const body = U(ellR(39, 22 + b, 9, 7.5, -0.1), ellR(21, 22 + b, 8.5, 6.3, 0.05), capF([21, 21 + b], [38, 21 + b], 5.8, 6.8));
  C.part(body, GRAY, { shine: 1 });
  // 배 크림색 (아래쪽만)
  C.part((x, y) => body(x, y) && y > 26.4 + b + (x - 30) * -0.05 + Math.sin(x * 0.9) * 0.4, CREAM, { sep: !1, lv: -0.1 });
  // 털결
  strokes(C, [[24, 17, 27, 19], [29, 16.5, 32, 18.5], [34, 16, 37, 18], [19, 19, 22, 21], [27, 21, 30, 22.5], [33, 21, 36, 22.5]], GRAY[3]);
  dots(C, [[25, 16.6], [30, 16], [35, 15.6], [20, 18]], GRAY[5]);
  // 목 갈기 (들쭉날쭉)
  C.part(polyF([[40, 13 + b], [43, 10.5 + b], [44.5, 12 + b], [47, 10 + b], [48, 13 + b], [50.5, 15 + b], [49, 20 + b], [50, 24 + b], [47, 23 + b], [46.5, 26.5 + b], [44, 24.5 + b], [42, 27.5 + b], [40.5, 23 + b], [37.5, 21 + b], [38, 16 + b]]), GRAY, { shine: 1 });
  strokes(C, [[42, 15, 44, 19], [45, 14, 46.5, 18], [43, 20, 44.5, 23]], GRAY[3]);
  C.part(polyF([[46, 21.5 + b], [49, 20 + b], [49.5, 23 + b], [47.5, 24.5 + b]]), CREAM, { sep: !1, lv: -0.1 });
  // 먼 귀
  C.part(polyF([[49.5, 11 + b], [51.5, 4.5 + b], [53, 10.5 + b]]), GRAYF);
  // 머리: 두개골 + 긴 주둥이 + 아래턱
  C.part(U(ellR(50.5, 14.5 + b, 5.4, 4.8, 0.15), capF([53, 15.5 + b], [59.5, 18 + b], 3, 1.9)), GRAY, { shine: 1 });
  C.part(capF([51, 19.5 + b], [57.5, 20.6 + b], 2, 1.2), GRAY, { lv: 0.12 });
  // 코 · 입 · 이빨 (으르렁)
  C.part(ellR(59.6, 17.4 + b, 1.6, 1.4), BLK, { sep: !1, shine: 1 });
  strokes(C, [[52.5, 19.4 + b, 58, 19.6 + b]], 0x140a0c);
  dots(C, [[55, 20.2 + b], [57, 20.3 + b]], BONE[6]);
  C.over(56, 18.6 + b, BONE[5]);
  // 주름 (콧등)
  strokes(C, [[54, 15.6 + b, 56.5, 16.2 + b]], GRAY[2]);
  // 눈: 찡그린 눈썹 아래 호박색 눈
  dots(C, [[51, 12.6 + b], [52, 12.8 + b], [53, 13.2 + b], [54, 13.6 + b]], GRAY[1]);
  C.over(52, 13.8 + b, 0xe0a030).over(53, 14 + b, 0xfff0a0).over(51.4, 14.2 + b, GRAY[1]);
  // 가까운 귀
  C.part(polyF([[46, 12 + b], [47.5, 4 + b], [50.5, 10.5 + b]]), GRAY, { shine: 1 });
  C.over(47.6, 7 + b, GRAY[2]).over(48, 9 + b, GRAY[2]);
  // 가까운 다리: 어깨 근육 → 앞다리 · 허벅지 → 뒷다리
  C.part(ellR(38, 25 + b, 4.2, 5, 0.2), GRAY, { shine: 1 });
  C.part(U(capF([38, 28 + b], [37.5, 32], 2.4, 1.7), capF([37.5, 32], [38.5, 35.5], 1.7, 1.5)), GRAY);
  C.part(ellR(40, 36, 2.6, 1.3), GRAY, { shine: 1 });
  C.part(ellR(19.5, 25 + b, 5, 5.6, 0.35), GRAY, { shine: 1 });
  C.part(U(capF([21, 29 + b], [15.5, 32.2], 2.4, 1.6), capF([15.5, 32.2], [16.5, 35.5], 1.6, 1.5)), GRAY);
  C.part(ellR(18, 36, 2.6, 1.3), GRAY, { shine: 1 });
  dots(C, [[40.5, 37], [42, 37], [18.5, 37], [20, 37]], BONE[4]);
  C.selout();
  return C;
}

// ════ 엄니 멧돼지 ════ 앞이 무거운 몸, 등줄기 억센 갈기, 휘어 오른 엄니 한 쌍, 붉은 작은 눈. 흉터투성이
export function boarFrame(p = {}) {
  const W = 66, H = 42, G = H - 1, C = board(W, H);
  const b = p.bob ?? 0;
  // 먼 다리
  C.part(U(capF([47, 28 + b], [48.5, 38], 3, 2.2)), BROWNF);
  C.part(polyF([[46, 37.5], [51, 37.5], [51.5, 41.9], [45.6, 41.9]]), HOOF);
  C.part(U(capF([24, 30 + b], [22, 35], 3.2, 2.4), capF([22, 35], [21.5, 38], 2.4, 2.2)), BROWNF);
  C.part(polyF([[19, 37.5], [24, 37.5], [24.5, 41.9], [18.6, 41.9]]), HOOF);
  // 꼬리 (돌돌)
  C.part(U(capF([12, 20 + b], [8.5, 19 + b], 1.2, 0.9), capF([8.5, 19 + b], [8, 22.5 + b], 0.9, 0.6)), BROWN);
  // 몸통: 앞쪽 혹 + 뒤 엉덩이
  const body = U(ellR(31, 23 + b, 14.5, 9.5, -0.06), ellR(37, 17.5 + b, 9.5, 6.5, -0.25), ellR(19, 24 + b, 8, 8));
  C.part(body, BROWN, { shine: 1 });
  // 털결 · 흉터
  strokes(C, [[21, 18, 24, 21], [26, 16, 29, 19], [31, 15, 34, 18], [19, 25, 22, 28], [26, 26, 29, 29], [33, 25, 36, 28]], BROWN[3]);
  strokes(C, [[28, 20, 34, 23]], 0xa4705a);
  strokes(C, [[28, 21, 34, 24]], BROWN[2]);
  // 등 갈기 (뻣뻣한 가시털)
  const sp = [];
  for (let i = 0; i <= 12; i++) {
    const x = 17 + i * 2.3, y = 14 + b - Math.sin((i / 12) * Math.PI) * 3.5 - (i > 8 ? (i - 8) * 0.5 : 0);
    sp.push([x, y + 2.5], [x + 1.15, y - 1.6 - (i % 2) * 1]);
  }
  sp.push([46, 13 + b], [45, 17 + b], [17, 18 + b]);
  C.part(polyF(sp), BRIST, { shine: 1 });
  // 머리: 묵직한 쐐기 + 주둥이
  C.part(U(ellR(46, 21 + b, 7.5, 7.5), polyF([[42, 14.5 + b], [52, 16.5 + b], [59, 22 + b], [61, 26 + b], [58, 29.5 + b], [48, 30 + b], [41, 26 + b]])), BROWN, { shine: 1 });
  C.part(ellR(60.5, 25.8 + b, 1.8, 2.8), [0x140a0a, 0x3a1e1e, 0x5a3030, 0x7a4442, 0x9a5c58, 0xb87a72, 0xd09a90], { sep: !1, shine: 1 });
  dots(C, [[60.4, 25 + b], [60.4, 27 + b]], 0x1a0a0a);
  strokes(C, [[52, 20 + b, 56, 22.5 + b], [53, 23 + b, 57, 24.5 + b]], BROWN[2]); // 콧등 주름
  strokes(C, [[50, 28.5 + b, 57, 28 + b]], 0x140a08); // 입
  // 먼 엄니 (작게) · 가까운 엄니
  C.part(U(capF([53.5, 28 + b], [55.5, 25 + b], 0.9, 0.5)), [BONE[0], BONE[1], BONE[2], BONE[3], BONE[3], BONE[3], BONE[3]], { sep: !1 });
  C.part(U(capF([55.5, 29 + b], [59, 25.5 + b], 1.4, 0.8), capF([59, 25.5 + b], [58.5, 21.5 + b], 0.8, 0.35)), BONE, { shine: 1, sep: !1 });
  // 눈: 찡그린 이마 아래 작은 붉은 눈
  dots(C, [[47, 17 + b], [48, 17.2 + b], [49, 17.6 + b], [50, 18.2 + b]], BROWN[0]);
  C.over(48.6, 18.8 + b, 0xc83020).over(49.6, 19 + b, 0xff9060);
  // 귀
  C.part(polyF([[43.5, 14 + b], [41, 7.5 + b], [47.5, 12 + b]]), BROWN, { shine: 1 });
  C.over(43, 10.5 + b, BROWN[2]);
  // 가까운 다리 (짧고 굵게) + 발굽
  C.part(U(ellR(43, 28 + b, 5, 5.5), capF([43.5, 31 + b], [44.5, 38], 3.2, 2.4)), BROWN, { shine: 1 });
  C.part(polyF([[42, 37.5], [47.5, 37.5], [48.3, 41.9], [41.5, 41.9]]), HOOF, { shine: 1 });
  C.over(45, 40.5, HOOF[1]);
  C.part(U(ellR(19, 28 + b, 6, 6.5), capF([19, 32 + b], [17, 35], 3.4, 2.6), capF([17, 35], [16.5, 38], 2.6, 2.4)), BROWN, { shine: 1 });
  C.part(polyF([[13.4, 37.5], [19, 37.5], [19.6, 41.9], [13, 41.9]]), HOOF, { shine: 1 });
  C.over(16.4, 40.5, HOOF[1]);
  C.selout();
  return C;
}

// ════ 거대 말벌 ════ 검정·노랑 줄무늬 배와 독침, 붉은 겹눈, 큰 턱. 늘 날고 있다 (그림에 땅 없음)
export function waspFrame(p = {}) {
  const W = 50, H = 42, C = board(W, H);
  const fl = p.flap ?? 0;
  // 먼 날개
  // 다리 (가늘게 늘어뜨림)
  for (const [x0, x1, y1] of [[25, 22, 30], [28, 27, 31], [30, 32, 30]]) C.part(U(capF([x0, 22], [x1, 26], 1, 0.8), capF([x1, 26], [x1 - 1, y1], 0.8, 0.5)), BLK);
  // 배: 줄무늬 + 독침
  const ab = ellR(14, 26, 9.5, 6.6, 0.55), ca = Math.cos(0.55), sa = Math.sin(0.55);
  C.part(capF([7.5, 31.5], [3, 36.5], 1.6, 0.3), BLK, { shine: 1 });
  C.part(ab, YEL, { shine: 1 });
  C.part((x, y) => {
    if (!ab(x, y)) return !1;
    const u = (x - 14) * ca + (y - 26) * sa;
    return Math.abs(((u + 40) % 5.2) - 2.6) < 1.1 || u < -7;
  }, BLK, { sep: !1 });
  // 가슴 (검고 노란 무늬) · 허리 마디
  C.part(capF([20.5, 22], [24, 20], 1.6), BLK);
  C.part(ellR(27, 18, 6.2, 5.6), BLK, { shine: 1 });
  C.part(ellR(28, 15.5, 2.6, 1.4), YEL, { sep: !1 });
  C.part(ellR(25, 21, 1.6, 1.2), YEL, { sep: !1 });
  // 머리 · 겹눈 · 큰 턱 · 더듬이
  C.part(ellR(35, 18.5, 4.6, 4.4), YEL, { shine: 1 });
  C.part(ellR(36.2, 16.8, 2.8, 3.2, 0.2), REDE, { shine: 1 });
  dots(C, [[35.5, 16], [37, 17.5], [36, 18.6]], REDE[2]);
  C.part(U(capF([37.5, 21.5], [41, 23.5], 1, 0.5), capF([36.5, 22], [39, 24.8], 0.9, 0.4)), BLK, { sep: !1 });
  for (const [a, bb] of [[[35, 14.2], [38, 9]], [[33.5, 14.5], [35, 8.5]]]) {
    C.part(capF(a, bb, 0.6, 0.5), BLK, { sep: !1 });
    C.part(capF(bb, [bb[0] + 2.5, bb[1] - 0.5], 0.5, 0.4), BLK, { sep: !1 });
  }
  // 가까운 날개: 반투명 (몸 위는 섞어 비치고, 빈 곳은 옅은 유리빛) + 맥 무늬
  C.selout();
  glassWing(C, ellR(20, 10.5 - fl, 8.5, 3.4, -0.6 - fl * 0.15), 0.3, !0);
  glassWing(C, ellR(26, 8.5 - fl, 10, 3.6, -0.4 - fl * 0.15));
  for (const [x0, y0, x1, y1] of [[18, 12, 34, 5], [21, 10.5, 29, 8.6], [25, 9.5, 32, 9.2]]) { const n = Math.round(Math.hypot(x1 - x0, y1 - y0)); for (let k = 0; k <= n; k++) C.px(x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n, 0x8aa0b0); }
  return C;
}

// ════ 맨드레이크 ════ 사람 모양으로 뒤틀린 뿌리. 머리 위 잎사귀, 텅 빈 눈구멍과 비명 지르는 입
export function mandrakeFrame(p = {}) {
  const W = 32, H = 40, G = H - 1, C = board(W, H);
  const sc = p.scream ?? 1;
  // 잎사귀 (뒤 → 앞)
  C.part(U(ellR(10, 7, 2.6, 6, -0.6), ellR(22, 7.5, 2.6, 6, 0.65)), [LEAF[0], LEAF[1], LEAF[1], LEAF[2], LEAF[3], LEAF[3], LEAF[3]]);
  C.part(U(capF([16, 13], [16, 9], 1, 0.8), ellR(16, 5, 2.8, 5.5, 0.05), ellR(12.5, 8.5, 2.2, 5, -0.9), ellR(19.5, 8.5, 2.2, 5, 0.9)), LEAF, { shine: 1 });
  strokes(C, [[16, 2, 16, 9], [10.5, 6.5, 13.5, 10.5], [21.5, 6.5, 18.5, 10.5]], LEAF[2]);
  // 먼 팔·다리 뿌리
  C.part(U(capF([21, 23], [26.5, 19 - sc * 2], 1.4, 0.6), capF([26.5, 19 - sc * 2], [28, 17 - sc * 3], 0.6, 0.35)), ROOTF);
  C.part(U(capF([17.5, 31], [20, 38.5], 2, 1.2), capF([20, 38.5], [22.5, 39.4], 1.1, 0.6)), ROOTF);
  // 몸통 뿌리: 울퉁불퉁한 덩이 + 아래로 가늘어짐
  C.part(U(ellR(16, 20, 7.6, 8.4), ellR(13, 15, 3, 2.4), capF([16, 25], [15.5, 31], 5, 3)), ROOT, { shine: 1 });
  // 주름 · 잔뿌리 털
  strokes(C, [[10, 16, 11, 22], [21, 17, 22, 23], [12.5, 26, 14, 29], [18, 25, 17.5, 29]], ROOT[2]);
  dots(C, [[9, 21], [23, 19], [9.5, 25], [22.5, 24], [11, 13], [20, 13]], ROOT[5]);
  // 얼굴: 텅 빈 눈구멍(희미한 빛) + 비명 입
  C.part(ellR(12.6, 18, 1.7, 2.2, -0.2), [0x0a0604, 0x0a0604, 0x1a1008, 0x1a1008, 0x1a1008, 0x1a1008, 0x1a1008], { sep: !1 });
  C.part(ellR(19, 18, 1.7, 2.2, 0.2), [0x0a0604, 0x0a0604, 0x1a1008, 0x1a1008, 0x1a1008, 0x1a1008, 0x1a1008], { sep: !1 });
  C.over(12.8, 18.4, 0xd8f0a0).over(18.8, 18.4, 0xd8f0a0);
  C.part(ellR(15.8, 23.5, 2 * sc + 0.6, 2.6 * sc + 0.6), [0x0a0404, 0x0a0404, 0x2a0a0c, 0x2a0a0c, 0x3a1014, 0x3a1014, 0x3a1014], { sep: !1 });
  C.over(15.8, 25 * 1, 0x6a1a20);
  strokes(C, [[10.5, 15.5, 13.5, 16.5], [21, 15.5, 18, 16.5]], ROOT[1]); // 찌푸린 이마
  // 가까운 팔·다리 뿌리
  C.part(U(capF([11, 22], [5.5, 18 - sc * 2], 1.5, 0.7), capF([5.5, 18 - sc * 2], [3.5, 15.5 - sc * 3], 0.7, 0.35), capF([5.5, 18 - sc * 2], [3, 19 - sc], 0.5, 0.3)), ROOT, { shine: 1 });
  C.part(U(capF([14, 31], [11, 38.5], 2.2, 1.3), capF([11, 38.5], [8.4, 39.4], 1.2, 0.6), capF([12.5, 35], [14.5, 39.4], 0.8, 0.4)), ROOT, { shine: 1 });
  C.selout();
  return C;
}

// ════ [정예] 들판 오우거 ════ 커다란 배와 떡 벌어진 어깨, 작은 머리에 아래 엄니. 쇠못 박은 통나무 몽둥이를 끌고 다닌다
export function ogreFrame(p = {}) {
  const W = 86, H = 86, G = H - 1, C = board(W, H);
  const b = p.bob ?? 0;
  // 먼 팔 (뒤로 늘어뜨림)
  C.part(U(capF([30, 36 + b], [24, 50 + b], 5.5, 4.5), capF([24, 50 + b], [25, 62 + b], 4.5, 3.8), ellR(25.5, 65 + b, 4.4, 4)), OGREF);
  // 먼 다리
  C.part(U(capF([36, 62 + b], [33, 73], 7, 5.5), capF([33, 73], [33, 80], 5.5, 4.8)), OGREF);
  C.part(polyF([[27, 79], [37, 78.5], [39, 84], [39, 85.9], [26.5, 85.9]]), [LE[0], LE[0], LE[1], LE[1], LE[2], LE[2], LE[2]]);
  // 몸통: 떡 벌어진 가슴·어깨 + 큰 배
  C.part(U(ellR(41, 39 + b, 16, 10, -0.08), ellR(30, 35 + b, 7, 6)), OGRE, { shine: 1 });
  C.part(ellR(45, 53 + b, 14.5, 12.5), OGRE, { shine: 1 });
  // 가슴·배 근육 선, 배꼽, 털
  strokes(C, [[42, 41 + b, 48, 40 + b], [44, 47 + b, 46, 52 + b]], OGRE[2]);
  C.over(50, 55 + b, OGRE[1]).over(50, 56 + b, OGRE[2]);
  dots(C, [[45, 43 + b], [47, 44 + b], [44, 45 + b], [48, 46 + b]], OGRE[2]);
  // 모피 허리 두르개 (점무늬) + 허리띠 + 해골 버클
  const pelt = polyF([[27, 59 + b], [58, 60 + b], [59, 66 + b], [56, 72 + b], [53, 68 + b], [49, 73 + b], [45, 68 + b], [40, 73.5 + b], [36, 68 + b], [32, 72 + b], [27, 66 + b]]);
  C.part(pelt, FUR, { shine: 1 });
  dots(C, [[33, 63], [38, 66], [44, 63], [50, 65], [55, 63], [41, 69], [35, 69]].map(([x, y]) => [x, y + b]), FUR[1]);
  C.part(capF([27, 59.5 + b], [58.5, 60.5 + b], 2.2), LE, { sep: !1, shine: 1 });
  C.part(ellR(49, 60.5 + b, 3, 3.2), BONE, { shine: 1, sep: !1 });
  dots(C, [[48, 60 + b], [50, 60 + b]], 0x1a1410);
  C.over(49, 62 + b, 0x2a2018);
  // 가까운 다리 (굵고 짧게) + 가죽 감은 발
  C.part(U(capF([47, 64 + b], [50, 74], 8, 6.2), capF([50, 74], [50.5, 80], 6.2, 5.4)), OGRE, { shine: 1 });
  C.part(capF([50, 75], [50.4, 78.5], 6, 5.6), LE, { sep: !1 });
  C.part(polyF([[43.5, 79], [55, 78.5], [58.5, 82.5], [59, 85.9], [43, 85.9]]), LE, { shine: 1 });
  dots(C, [[59.5, 85], [59.5, 84], [56, 85]], BONE[4]);
  // 머리: 작고 앞으로 뺀 머리, 두꺼운 눈썹뼈, 뭉툭코, 아래턱 엄니
  const hx = 56, hy = 24 + b;
  C.part(capF([47, 33 + b], [hx - 2, hy + 3], 6, 5), OGRE); // 굵은 목
  C.part(U(ellR(hx, hy - 1, 8.4, 7.8), polyF([[hx - 5, hy + 2], [hx + 7.5, hy + 1], [hx + 8.5, hy + 5], [hx + 6, hy + 9], [hx - 3, hy + 8.5]])), OGRE, { shine: 1, lv: 0.08 });
  C.part(capF([hx + 0.5, hy - 3.6], [hx + 7, hy - 2.6], 1.8, 1.5), OGRE, { shine: 1 }); // 눈썹뼈
  C.part(ellR(hx + 7.4, hy + 0.8, 2.4, 2), OGRE, { shine: 1, sep: !1 }); // 뭉툭코
  dots(C, [[hx + 2.5, hy - 1.4], [hx + 3.5, hy - 1.2], [hx + 5, hy - 1]], OGRE[1]);
  C.over(hx + 3, hy - 1.2, 0xe8d070).over(hx + 4, hy - 1.2, 0x1a0c0a);
  strokes(C, [[hx + 1, hy + 5, hx + 7.5, hy + 4.4]], 0x1a0a08);
  C.part(U(capF([hx + 2.4, hy + 5.6], [hx + 2, hy + 2.6], 1, 0.5), capF([hx + 6.6, hy + 5], [hx + 6.4, hy + 2.2], 1, 0.5)), BONE, { shine: 1, sep: !1 });
  C.part(polyF([[hx - 5, hy - 2], [hx - 10, hy - 6], [hx - 4.5, hy - 5]]), OGRE, { shine: 1 }); // 귀
  dots(C, [[hx - 2, hy - 7], [hx, hy - 7.4], [hx - 4, hy - 6]], 0x1a1410);
  // 가까운 팔: 굵은 어깨 · 팔뚝 보호대 · 몽둥이 쥔 주먹
  C.part(U(ellR(52, 36 + b, 6.5, 6), capF([53, 38 + b], [58, 49 + b], 5.5, 4.6)), OGRE, { shine: 1 });
  C.part(U(capF([58, 49 + b], [62, 58 + b], 4.6, 4)), OGRE, { shine: 1 });
  C.part(capF([59, 51 + b], [61.2, 56 + b], 4.6, 4.3), LE, { shine: 1 });
  dots(C, [[59, 52 + b], [60.5, 55 + b]], ST[5]);
  // 몽둥이: 통나무, 끝이 굵고 쇠못
  const c0 = [63, 60 + b], c1 = [74, 83];
  C.part(U(capF(c0, c1, 2.6, 5.2), capF([62, 56 + b], c0, 2.2, 2.6)), WOOD, { shine: 1 });
  strokes(C, [[64.5, 64, 69, 74], [67, 64, 72, 75]], WOOD[2]);
  for (const t of [0.6, 0.75, 0.9]) {
    const q = lerp(c0, c1, t);
    C.part(capF([q[0] + 4.5, q[1] - 1.5], [q[0] + 7, q[1] - 2.5], 0.9, 0.4), ST, { sep: !1, shine: 1 });
    C.part(capF([q[0] - 4, q[1] + 1], [q[0] - 6.5, q[1] + 1.8], 0.9, 0.4), ST, { sep: !1, shine: 1 });
  }
  C.part(ellR(62.5, 58.5 + b, 4.2, 3.8), OGRE, { shine: 1 });
  C.selout();
  return C;
}

// ════ [정예] 초원 켄타우로스 ════ 밤색 말 몸에 사람 상체. 뒤로 묶은 머리, 가죽 가슴띠, 등에 화살통, 활을 당긴다
export function centaurFrame(p = {}) {
  const W = 92, H = 82, G = H - 1, C = board(W, H);
  const b = p.bob ?? 0, dr = p.draw ?? 0.6;
  // 먼 다리 (앞·뒤)
  C.part(U(capF([48, 56 + b], [49, 67], 3.4, 2.4), capF([49, 67], [48.5, 77], 2.2, 1.9)), CHESTF);
  C.part(polyF([[46, 76.5], [51.2, 76.5], [52, 81.9], [45.6, 81.9]]), HOOF);
  C.part(U(capF([27, 56 + b], [24, 66], 4.4, 2.6), capF([24, 66], [26, 77], 2.2, 1.9)), CHESTF);
  C.part(polyF([[23.5, 76.5], [28.8, 76.5], [29.5, 81.9], [23, 81.9]]), HOOF);
  // 꼬리 (흘러내림)
  C.part(U(capF([13, 44 + b], [8, 52 + b], 3, 3.6), capF([8, 52 + b], [7, 64 + b], 3.6, 1.6)), MANE, { shine: 1 });
  strokes(C, [[10, 47, 8, 56], [9, 52, 8.5, 61]], MANE[2]);
  // 말 몸통
  C.part(U(ellR(34, 50 + b, 19, 10), ellR(51, 47 + b, 8.5, 9.5), ellR(19, 48 + b, 10, 10)), CHESTF.map((c, i) => CHEST[i]), { shine: 1 });
  strokes(C, [[24, 45, 30, 44], [36, 44, 42, 44.5], [20, 52, 24, 55]], CHEST[3]);
  // 화살통 (말 등 위, 비스듬히) + 화살 깃
  C.part(capF([30, 44 + b], [40, 33 + b], 2.6), LE, { shine: 1 });
  for (const dx of [0, 2, -1.5]) C.part(polyF([[40 + dx, 33 + b], [42.5 + dx, 28 + b], [43.5 + dx, 31 + b]]), [0x2a0a08, 0x5a1a14, 0x8a2a1e, 0xb43c28, 0xd65a3a, 0xf08a5a, 0xffb080], { sep: !1 });
  // 먼 팔 (시위를 당김)
  const shF = [55, 27 + b], elF = [50 - dr * 2, 31 + b], hdF = [58 - dr * 4, 28.5 + b];
  C.part(U(capF(shF, elF, 2.6, 2.1), capF(elF, hdF, 2.1, 1.7)), SKINF);
  // 사람 상체: 허리 → 가슴 → 어깨
  C.part(U(capF([53, 44 + b], [56, 34 + b], 5.5, 5), ellR(56.5, 31 + b, 6.4, 7, 0.1)), SKIN, { shine: 1 });
  strokes(C, [[56, 32 + b, 59, 33 + b], [56.5, 37 + b, 57, 40 + b]], SKIN[2]);
  // 가죽 가슴띠 (사선)
  C.part(capF([52, 26 + b], [60, 40 + b], 1.5), LE, { sep: !1, shine: 1 });
  // 허리 천
  C.part(polyF([[48, 41 + b], [60, 40 + b], [61, 45 + b], [57, 48 + b], [52, 46.5 + b], [47.5, 47 + b]]), CLOTH, { shine: 1 });
  // 머리: 옆얼굴 · 뒤로 묶은 머리 · 머리띠
  const hx = 59, hy = 17 + b;
  C.part(capF([57, 25 + b], [hx - 0.5, hy + 4], 2.4, 2), SKIN);
  C.part(U(capF([hx - 3, hy - 3], [hx - 9, hy + 2], 2.4, 2), capF([hx - 9, hy + 2], [hx - 11, hy + 10], 2, 1)), MANE, { shine: 1 }); // 묶은 머리
  C.part(U(ellR(hx, hy, 4.6, 5.2), polyF([[hx + 2, hy - 1], [hx + 5.6, hy + 1.2], [hx + 4.2, hy + 2.6], [hx + 4.6, hy + 4.6], [hx + 2.4, hy + 6], [hx - 1, hy + 5]])), SKIN, { shine: 1, lv: 0.06 });
  C.part(minus(ellR(hx - 0.6, hy - 1.4, 5, 4.6), (x, y) => y > hy - 1.6 + (x - hx) * 0.6 || (x > hx + 1.5 && y > hy - 3)), MANE, { shine: 1, sep: !1 });
  C.part(capF([hx - 4.5, hy - 1.6], [hx + 3.5, hy - 2.6], 0.8), CLOTH, { sep: !1 });
  C.over(hx + 2.2, hy + 0.2, 0x2a1a10).over(hx + 3, hy + 0.2, SKIN[6]);
  strokes(C, [[hx + 1.2, hy - 0.8, hx + 3.6, hy - 0.6]], MANE[1]);
  strokes(C, [[hx + 2.5, hy + 4, hx + 4, hy + 3.8]], SKIN[1]);
  // 가까운 팔: 활을 앞으로 쭉
  const sh = [58, 27 + b], el = [64, 28 + b], hd = [69, 28 + b];
  C.part(ellR(57.5, 27.5 + b, 3.2, 2.8), SKIN, { shine: 1 });
  C.part(U(capF(sh, el, 2.4, 2), capF(el, hd, 2, 1.7)), SKIN, { shine: 1 });
  C.part(capF([64.5, 28 + b], [67.5, 28 + b], 2.1), LE, { sep: !1, shine: 1 });
  // 활: 크게 휜 활대 + 당긴 시위 + 메긴 화살
  const top = [70, 12 + b], bot = [70, 44 + b], pull = [58 - dr * 4, 28.5 + b];
  const bow = (x, y) => {
    const t = (y - top[1]) / (bot[1] - top[1]);
    if (t < 0 || t > 1) return !1;
    const cx = top[0] + Math.sin(t * Math.PI) * (4 + dr * 1.5) - 1;
    return Math.abs(x - cx) <= 1.1 - Math.abs(t - 0.5) * 0.6;
  };
  C.part(bow, WOOD, { shine: 1, sep: !1 });
  strokes(C, [[top[0] - 0.5, top[1], pull[0], pull[1]], [pull[0], pull[1], bot[0] - 0.5, bot[1]]], 0xd8d0b8);
  strokes(C, [[pull[0], pull[1], 76, 28.5 + b]], WOOD[4]);
  C.part(polyF([[76, 27 + b], [79, 28.5 + b], [76, 30 + b]]), ST, { sep: !1, shine: 1 });
  C.part(ellR(hd[0] + 0.5, hd[1], 2, 1.9), SKIN, { shine: 1, sep: !1 });
  // 가까운 다리 (앞·뒤) + 발굽 + 발목 털
  C.part(U(ellR(52, 54 + b, 5, 6), capF([53, 57 + b], [54.5, 67], 3.6, 2.4), capF([54.5, 67], [54, 77], 2.4, 2)), CHEST, { shine: 1 });
  C.part(capF([54, 72], [54.2, 76.5], 2.6, 2.8), MANE, { sep: !1 });
  C.part(polyF([[51.5, 76.5], [57, 76.5], [57.8, 81.9], [51, 81.9]]), HOOF, { shine: 1 });
  C.part(U(ellR(20, 53 + b, 7, 7.5), capF([21, 58 + b], [17, 67], 4.4, 2.6), capF([17, 67], [19, 77], 2.4, 2)), CHEST, { shine: 1 });
  C.part(capF([18.6, 72], [19, 76.5], 2.6, 2.8), MANE, { sep: !1 });
  C.part(polyF([[16.4, 76.5], [22, 76.5], [22.6, 81.9], [16, 81.9]]), HOOF, { shine: 1 });
  C.selout();
  return C;
}
