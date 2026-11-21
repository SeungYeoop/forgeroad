// ══════════════════════════════════════════════════════════════
// 리프크라운 「뿌리섬 숲」 — 하늘 가득 뿌리 덩이 흙섬이 층층이 엇갈려 떠 있고, 섬마다 나무가 선다
//   지도 = 칸(8px) 1024 × 1056 · 맨 아래 뿌리섬 길 줄 1000 (좌우 출구) · ▲ = 맨 위 가운데 고목 섬
//   섬 쉰 남짓: 섬마다 속 짜임(쌍굴·겹굴·뿌리 기둥 홀·샘 굴·굴토끼 굴·움막+굴·고리 굴·둥지 굴·긴 회랑)과
//              나무(참나무·자작·소나무·버드나무·고사목·큰 버섯·덤불·쌍둥이 나무·속 빈 그루터기)가 이웃과 겹치지 않게 다르다
//   잎은 바위가 아니다: 어두운 잎 뒷벽 + 3D 잎 덩어리 소품. 밟는 것은 흙섬·가지·통나무 다리·출렁다리
//   길: 아래 섬에서 늘어진 덩굴로 위 섬 굴에 들어가 윗면으로 · 이웃 섬은 통나무·출렁다리 · 덩굴 그네 · 튕김 버섯
// ══════════════════════════════════════════════════════════════
import { PL, jag, H2, fbm, nat, hollow, room, surf, climb, hang, dropTo, rope_bridge, P_, mark, skyBegin, skyEnd } from "./archi_sky.js";

const wood = (K, x0, y0, x1, y1, m = "wood") => (K.rock(x0, y0, x1, y1), K.mat(x0, y0, x1, y1, m));
const rnd = (i, s) => H2(i, s, 777);
let CR = null; // 수관 가지 자리 (위 섬 덩굴은 뚫고 지나간다)
function knob(K, cx, cy, r, m, cr) {
  for (let y = Math.floor(cy - r); y <= cy + r; y++)
    for (let x = Math.floor(cx - r); x <= cx + r; x++) (x - cx) ** 2 + (y - cy) ** 2 <= r * r && (wood(K, x, y, x + 1, y + 1, m), cr && CR && x >= 0 && y >= 0 && x < K.NX && y < K.NY && (CR[y * K.NX + x] = 1));
}
// 휜 가지: 시작(줄기 속) → 굽이 → 끝, 둥근 마디를 이어 r0 → r1로 가늘게
function bough(K, p0, p1, p2, r0, r1, m = "bough") {
  const L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) + Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), n = Math.ceil(L * 1.6);
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t;
    knob(K, a * p0[0] + b * p1[0] + c * p2[0], a * p0[1] + b * p1[1] + c * p2[1], r0 + (r1 - r0) * t, m);
  }
}
const qpt = (p0, p1, p2, t) => [(1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0], (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]];
// 줄기: 굽으며 가늘어지고 밑동이 벌어진다
function trunk(K, X, yb, yt, wb, wt, amp, s) {
  const c = (y) => X + amp * Math.sin(y * 0.03 + s) + amp * 0.4 * Math.sin(y * 0.09 + s * 2);
  const w = (y) => wt + (wb - wt) * Math.max(0, (y - yt) / (yb - yt)) ** 1.3 + (y > yb - 6 ? (y - (yb - 6)) * 0.9 : 0);
  for (let y = yt; y < yb; y++) {
    const hw = w(y) + Math.sin(y * 0.4 + s) * 0.4;
    wood(K, Math.round(c(y) - hw), y, Math.round(c(y) + hw), y + 1);
  }
  return { c, w };
}
// 밑동 문: 나무 밑을 지나다닌다 (섬 윗면이 둘로 갈리지 않게)
function baseDoor(K, T, t) {
  const c = T.c(t - 4), hw = T.w(t - 1) + 2;
  for (let x = Math.round(c - hw); x <= Math.round(c + hw); x++) {
    const u = Math.abs(x + 0.5 - c) / (hw + 0.5), h = Math.round(8 + 2 * Math.sqrt(Math.max(0, 1 - u * u)) - (u > 0.8 ? 2 : 0));
    K.air(x, t - h, x + 1, t);
  }
}
// 잎 (마지막에 한꺼번에): 어두운 잎 뒷벽 + 3D 잎 덩어리 — 방 안·방 옆엔 두지 않는다
const FOL = [];
const leaves = (K, cx, cy, rx, ry, s, conif = 0) => FOL.push([cx, cy, rx, ry, s, conif]);
function placeLeaves(K) {
  const { NX, NY } = K, RM = new Uint8Array(NX * NY), NEAR = new Uint8Array(NX * NY);
  for (const w of K.P.walls) {
    if (w.m !== "wood" && w.m !== "brick" && w.m !== "rock") continue;
    const x0 = Math.max(0, Math.floor(w.x0 / 8)), x1 = Math.min(NX, Math.ceil(w.x1 / 8)), y0 = Math.max(0, Math.floor(w.y0 / 8)), y1 = Math.min(NY, Math.ceil(w.y1 / 8));
    for (let y = y0; y < y1; y++) RM.fill(1, y * NX + x0, y * NX + x1);
    for (let y = Math.max(0, y0 - 6); y < Math.min(NY, y1 + 6); y++) NEAR.fill(1, y * NX + Math.max(0, x0 - 6), y * NX + Math.min(NX, x1 + 6));
  }
  const inRoom = (x, y, m) => x >= 0 && y >= 0 && x < NX && y < NY && (m ? NEAR : RM)[y * NX + x] === 1;
  for (const [cx, cy, rx, ry, s, conif] of FOL) {
    for (let y = Math.floor(cy - ry * 1.15); y <= cy + ry * 1.15; y++) {
      let a = null;
      for (let x = Math.floor(cx - rx * 1.2); x <= cx + rx * 1.2 + 1; x++) {
        const dx = (x - cx) / rx, dy = (y - cy) / ry, inside = dx * dx + dy * dy < 0.82 + (fbm(x / 9, y / 7, s) - 0.5) * 0.7 && !inRoom(x, y, 0);
        if (inside && a === null) a = x;
        if (!inside && a !== null) (K.wall(a, y, x, y + 1, "leaf"), (a = null));
      }
    }
  }
  FOL.length = 0;
}
function root(K, x, y, len, s, climbable) {
  for (let j = 0; j < len; j++) {
    const w = 1.8 * (1 - j / len) ** 0.6, cx = x + Math.sin(j * 0.12 + s) * 3 + Math.sin(j * 0.05 + s * 2) * 2;
    w > 0.4 && wood(K, Math.round(cx - w), y + j, Math.round(cx + w) + 1, y + j + 1);
  }
  climbable && K.vine(Math.round(x) - 4, Math.round(x) + 5, y, y + len);
}
// 둥근 굴방 (흔들린 타원, 바닥 평평)
function cave(K, x0, y0, x1, y1, s) {
  hollow(K, (x0 + x1) / 2, (y0 + y1) / 2 - 1, (x1 - x0) / 2, (y1 - y0) / 2 + 2, s, 0.12);
  K.air(x0 + 2, y1 - 5, x1 - 2, y1);
  K.rock(x0 - 1, y1, x1 + 1, y1 + 2);
  return { x0, y0, x1, y1 };
}

// ══ 섬 표 ══ [x0, x1, 윗면, 깊이, 속 짜임, 나무, 나무 자리(0~1)] — 이웃 섬과 짜임·나무가 겹치지 않게
const L = ["twin", "stack", "hall", "pool", "burrow", "cellar", "ring", "nest", "gallery"];
const TREES = ["oak", "birch", "pine", "willow", "dead", "shroom", "bush", "twin", "stump"];
const ISLES = [
  // 라1 (≈900)
  [36, 150, 904, 38, "pool", "oak", 0.4], [196, 324, 892, 44, "ring", "pine", 0.7], [372, 468, 910, 36, "burrow", "shroom", 0.5], [512, 654, 896, 44, "hall", "willow", 0.45], [700, 806, 906, 38, "twin", "stump", 0.55], [846, 990, 892, 42, "cellar", "oak", 0.3],
  // 라2 (≈800)
  [8, 118, 800, 38, "nest", "birch", 0.6], [160, 282, 812, 40, "gallery", "dead", 0.35], [318, 440, 792, 44, "stack", "oak", 0.6], [478, 600, 808, 38, "pool", "twin", 0.5], [640, 762, 790, 44, "burrow", "pine", 0.3], [802, 904, 814, 36, "ring", "bush", 0.5], [934, 1016, 798, 36, "twin", "willow", 0.5],
  // 다1 (≈690)
  [56, 190, 690, 44, "cellar", "willow", 0.55], [228, 342, 704, 38, "nest", "shroom", 0.4], [382, 520, 684, 46, "hall", "pine", 0.65], [560, 672, 700, 38, "gallery", "oak", 0.4], [710, 852, 688, 44, "stack", "birch", 0.35], [884, 1002, 704, 38, "burrow", "dead", 0.6],
  // 다2 (≈580)
  [18, 132, 586, 38, "ring", "stump", 0.5], [170, 300, 574, 44, "pool", "oak", 0.65], [340, 452, 592, 36, "twin", "bush", 0.4], [492, 622, 576, 44, "nest", "dead", 0.5], [662, 774, 590, 38, "cellar", "twin", 0.6], [812, 944, 578, 44, "gallery", "willow", 0.35],
  // 나1 (≈470)
  [58, 182, 470, 42, "hall", "birch", 0.35], [222, 350, 482, 38, "stack", "willow", 0.6], [392, 522, 466, 44, "burrow", "oak", 0.45], [560, 682, 480, 38, "ring", "shroom", 0.55], [722, 852, 468, 44, "pool", "pine", 0.4], [892, 1010, 482, 36, "nest", "stump", 0.5],
  // 나2 (≈360)
  [18, 150, 360, 42, "gallery", "pine", 0.6], [192, 312, 372, 38, "cellar", "dead", 0.4], [352, 482, 356, 44, "twin", "oak", 0.55], [522, 652, 372, 38, "hall", "bush", 0.5], [692, 812, 360, 42, "nest", "willow", 0.45], [852, 990, 368, 40, "stack", "birch", 0.6],
  // 가1 (≈250)
  [60, 190, 250, 42, "pool", "twin", 0.5], [232, 362, 262, 38, "burrow", "stump", 0.35], [400, 530, 246, 44, "ring", "pine", 0.6], [572, 702, 258, 38, "gallery", "shroom", 0.45], [742, 872, 248, 44, "cellar", "oak", 0.55], [904, 1012, 262, 36, "twin", "dead", 0.5],
  // 가2 (≈140) — 가운데 = 고목 섬 (▲)
  [120, 262, 142, 40, "stack", "willow", 0.5],
  [30, 150, 110, 38, "twin", "bush", 0.5], [190, 310, 70, 36, "pool", "birch", 0.4], [700, 820, 74, 36, "ring", "twin", 0.5], [870, 1004, 56, 38, "gallery", "pine", 0.6],
  [300, 420, 930, 36, "nest", "bush", 0.5], [600, 700, 936, 34, "burrow", "stump", 0.5], [296, 380, 560, 36, "cellar", "dead", 0.5], [640, 700, 470, 32, "twin", "bush", 0.5], [330, 460, 132, 42, "nest", "birch", 0.4], [500, 648, 112, 46, "elder", "elder", 0.5], [700, 832, 136, 40, "hall", "pine", 0.6], [880, 1004, 146, 38, "burrow", "oak", 0.45],
];

export function leafcrown(K) {
  skyBegin(K);
  CR = new Uint8Array(K.NX * K.NY);
  DECKS.length = 0;
  road(K);
  // 섬마다 높이·폭·깊이를 흔들어 줄 맞춘 격자로 보이지 않게
  giants(K);
  // 섬 자리: 바위·나무가 이미 있거나 잎 뭉치 한가운데면 건너뛴다
  const busy = (x0, x1, t, d) => {
    let n = 0, m = 0;
    for (let y = t - 30; y < t + d; y += 3) for (let x = x0 - 6; x < x1 + 6; x += 3) (m++, K.get(x, y) === 1 && n++);
    const inLeaf = FOL.some(([cx, cy, rx, ry]) => (((x0 + x1) / 2 - cx) / rx) ** 2 + ((t - cy) / ry) ** 2 < 0.8);
    return n / m > 0.01 || inLeaf;
  };
  const built = ISLES.map(([x0, x1, t, d, lay, tree, tp], i) => {
    if (tree !== "elder" && busy(x0, x1, t, d)) return null;
    if (tree === "elder") return isle(K, [x0, x1, t, d, lay, tree, tp], i);
    const dt = Math.round((rnd(i, 1) - 0.5) * 34), g0 = Math.round(rnd(i, 2) * 12), g1 = Math.round(rnd(i, 4) * 12), dd = Math.round(rnd(i, 5) * 16);
    return isle(K, [x0 - g0, x1 + g1, t + dt, d + dd, lay, tree, tp], i);
  }).filter(Boolean);
  // 나무 꼭대기 마루마다: 바로 위 섬에서 수관을 뚫고 마루까지 덩굴
  for (const [d0, d1, dy] of DECKS) {
    const I = built.filter((q) => q.x1 - 5 > d0 + 2 && q.x0 + 5 < d1 - 2 && q.t + q.d < dy - 10).sort((p, q) => q.t - p.t)[0];
    if (!I) continue;
    const x = Math.round(Math.max(I.x0 + 6, d0 + 3, Math.min(I.x1 - 6, d1 - 3, (d0 + d1) / 2)));
    islandVine(K, x, surf(K, x, I.t), 500, false, true);
  }
  // 가운데 버섯 섬 ↔ 갈래 줄기 나무 서쪽 가지 끝: 통나무
  {
    const I = built.find((q) => q.x0 > 530 && q.x0 < 580 && q.t > 440 && q.t < 540);
    if (I) {
      const xa = I.x1 - 3, ya = surf(K, xa, I.t);
      bough(K, [xa - 2, ya + 2], [(xa + 728) / 2, (ya + 506) / 2 + 2], [730, 506], 2.4, 2.4);
    }
  }
  // 아래 층부터: 이웃 섬 잇기, 덩굴로 아래 섬까지 내리기 (아래가 먼저 지어진 뒤)
  for (let i = built.length - 1; i >= 0; i--) linkDown(K, built[i], i);
  linkSide(K, built);
  const el = built.find((b) => b.tree === "elder"), lowE = el.R.slice().sort((a, b) => b.y1 - a.y1)[0];
  islandVine(K, Math.max(el.x0 + 5, Math.round(G3.H[G3.H.length - 1].cx) + 1), el.t);
  placeLeaves(K);
  skyEnd(K, "rock");
}
leafcrown.own = 1;

// 나무집: 통나무 벽, 지붕이 집마다 다르다 (peak 박공 · round 잎 얹은 둥근 · leaf 잎 덩이), 양옆 문, 가지에 얹으면 받침 기둥
function hut(K, x0, x1, f, h, roof, opt = {}) {
  wood(K, x0, f - h - 2, x1, f + 2), room(K, x0 + 2, f - h, x1 - 2, f, "wood");
  K.air(x0, f - 8, x0 + 2, f), K.air(x1 - 2, f - 8, x1, f);
  const w = x1 - x0, cx = (x0 + x1) / 2, top = f - h - 2;
  if (roof === "peak") for (let k = 0; k < w / 2 + 2; k++) wood(K, x0 - 2 + k, top - Math.floor(k * 0.7), x1 + 2 - k, top - Math.floor(k * 0.7) + 1);
  else if (roof === "round") for (let x = x0 - 2; x < x1 + 2; x++) wood(K, x, top - Math.round(Math.sqrt(Math.max(0, 1 - ((x + 0.5 - cx) / (w / 2 + 2)) ** 2)) * 6), x + 1, top);
  else if (roof === "leaf") (wood(K, x0 - 3, top - 2, x1 + 3, top), leaves(K, cx, top - 6, w * 0.6, 7, x0));
  opt.posts && (wood(K, x0 + 1, f + 2, x0 + 3, f + opt.posts), wood(K, x1 - 3, f + 2, x1 - 1, f + opt.posts));
}
// ══ 거대한 나무 다섯 (섬 여덟 크기) — 가지가 휘며 갈라지고, 잎은 가지 끝 뭉치, 속은 갈래진 굴 ══
// 나무 속 굴: 흔들린 타원, 바닥은 평평, 뒷벽은 나무 속 결
function hollowWood(K, cx, y0, y1, rx, s) {
  const cy = (y0 + y1) / 2, ry = (y1 - y0) / 2;
  for (let y = y0 - 2; y <= y1; y++) {
    let a = null;
    for (let x = Math.floor(cx - rx * 1.25); x <= cx + rx * 1.25 + 1; x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / (ry + 1.5), inside = y >= y1 - 5 ? Math.abs(dx) < 0.92 : dx * dx + dy * dy < 1 + (fbm(x / 7, y / 7, s) - 0.5) * 0.35;
      if (inside && a === null) a = x;
      if ((!inside || x > cx + rx * 1.25) && a !== null) (K.air(a, y, x, y + 1), K.wall(a, y, x, y + 1, "inwood"), (a = null));
    }
  }
  const r = { x0: Math.round(cx - rx * 0.9), x1: Math.round(cx + rx * 0.9), y0, y1, cx };
  wood(K, r.x0 - 2, y1, r.x1 + 2, y1 + 2);
  return r;
}
// 가지 끝에서 아래 무엇에든 덩굴
function tipVine(K, x, top, reach = 220) {
  let y = top;
  while (y < K.NY - 2 && K.get(x, y) === 1) y++;
  const yb = y;
  while (y < K.NY - 2 && y - yb < reach && K.get(x, y) !== 1) y++;
  if (y - yb >= reach || y >= K.NY - 2 || y - yb < 4) return;
  K.air(x - 1, top, x + 2, yb), K.plank(x - 1, x + 2, top), K.vine(x - 1, x + 2, top - 3, y);
}
// 섬 윗면에서 섬을 통째로 꿰뚫고 섬 밑 하늘로 늘어지는 덩굴 (섬 속 굴은 지나간다)
const DECKS = [];
export function islandVine(K, x, t, reach = 400, dry = false, force = false) {
  let y = t, yb = -1;
  while (y < K.NY - 2) {
    while (y < K.NY - 2 && K.get(x, y) === 1) y++;
    let e = y;
    // 섬 속 굴(높이 40칸 미만)은 지나가고, 그보다 긴 빈 하늘이 섬 밑이다
    while (e < K.NY - 2 && K.get(x, e) !== 1 && e - y < 40) e++;
    if (e - y >= 40) {
      yb = y;
      break;
    }
    y = e;
  }
  if (yb < 0) return -1;
  // 넓은 발판(9칸)이 나올 때까지 내려간다, 그 사이 얇은 가지·뿌리는 덩굴 자리만 뚫는다
  let z = yb;
  for (;;) {
    while (z < K.NY - 2 && z - yb < reach && K.get(x, z) !== 1) z++;
    if (z - yb >= reach || z >= K.NY - 2) return -1;
    const crown = CR && [-1, 0, 1, 2].every((d) => CR[z * K.NX + x + d] === 1);
    const wide = !crown && [-4, -2, 2, 4].every((d) => K.get(x + d, z) === 1);
    let th = 0;
    const lim = crown || (force && CR && CR[z * K.NX + x] === 1) ? (force ? 80 : 30) : 12;
    while (K.get(x, z + th) === 1 && th < lim) th++;
    if (wide || th >= lim) break;
    dry || K.air(x - 1, z, x + 2, z + th);
    z += th;
  }
  if (dry) return z - t;
  K.air(x - 1, t, x + 2, yb), K.wall(x - 1, t, x + 2, yb, "rock"), K.plank(x - 1, x + 2, t), K.vine(x - 1, x + 2, t - 3, z);
  return z - t;
}
// 점들을 잇는 굽은 가지 (둥근 마디, 반지름 r0 → r1)
function limbPath(K, pts, r0, r1, cr) {
  let L = 0;
  for (let k = 0; k + 1 < pts.length; k++) L += Math.hypot(pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1]);
  let acc = 0;
  for (let k = 0; k + 1 < pts.length; k++) {
    const [xa, ya] = pts[k], [xb, yb] = pts[k + 1], l = Math.hypot(xb - xa, yb - ya), n = Math.max(1, Math.ceil(l * 1.6));
    for (let i = 0; i <= n; i++) knob(K, xa + (xb - xa) * (i / n), ya + (yb - ya) * (i / n), r0 + (r1 - r0) * ((acc + (l * i) / n) / Math.max(1, L)), "bough", cr);
    acc += l;
  }
}
// 자라는 가지: 마디마다 조금씩 휘고 끝에서 둘·셋으로 갈라진다 (위로 조금 끌린다), 맨 끝은 작은 잎 뭉치
function grow(K, x, y, ang, len, r, depth, s, tips) {
  const pts = [[x, y]];
  let a = ang, cx = x, cy = y;
  for (let k = 1; k <= 4; k++) {
    a += (rnd(k + depth * 7, s) - 0.5) * 0.42;
    cx += (Math.cos(a) * len) / 4, cy += (Math.sin(a) * len) / 4;
    pts.push([cx, cy]);
  }
  const r1 = Math.max(1, r * 0.6);
  limbPath(K, pts, r, r1, 1);
  if (depth <= 0 || len < 9) {
    leaves(K, cx, cy - 2, 8 + len * 0.55 + rnd(1, s) * 6, 6 + len * 0.3 + rnd(2, s) * 3, s);
    tips && tips.push([cx, cy]);
    return;
  }
  depth <= 1 && leaves(K, pts[2][0], pts[2][1] - 3, 7 + len * 0.2, 5, s + 13);
  const kids = 2 + (rnd(depth, s + 3) > 0.55 ? 1 : 0);
  for (let c = 0; c < kids; c++) {
    const spread = (c - (kids - 1) / 2) * (0.5 + rnd(c, s + 5) * 0.35), up = (-Math.PI / 2 - a) * 0.22;
    grow(K, cx, cy, a + spread + up, len * (0.6 + rnd(c, s + 9) * 0.2), r1, depth - 1, s * 3 + c + 1, tips);
  }
}
// 걷는 굵은 가지: 줄기에서 옆으로 완만히 오르내리며 뻗고(비탈 ≤ 0.6), 중간에서 위로 잔가지, 끝은 갈라져 잎
function walkLimb(K, x0, y0, side, len, rise, r0, s) {
  const pts = [];
  for (let k = 0; k <= 6; k++) {
    const t = k / 6, wob = k && k < 6 ? (rnd(k, s) - 0.5) * 4 : 0;
    pts.push([x0 + side * len * t, y0 - rise * (t * (2 - t)) + wob]);
  }
  limbPath(K, pts, r0, Math.max(2.5, r0 * 0.45));
  // 걷는 윗면을 막지 않게: 잔가지는 가지 밑에서 비스듬히 아래로 늘어지고, 위엔 잎만
  for (const k of [2, 4]) {
    grow(K, pts[k][0], pts[k][1] + r0 * 0.5, side > 0 ? 0.6 + rnd(k, s + 2) * 0.4 : Math.PI - 0.6 - rnd(k, s + 2) * 0.4, 14 + rnd(k, s + 3) * 12, Math.max(1.5, r0 * 0.3), 1, s + k * 17);
    leaves(K, pts[k][0], pts[k][1] - r0 - 10, 14, 7, s + k * 19);
  }
  const [ex, ey] = pts[6];
  grow(K, ex, ey, side > 0 ? -0.35 : Math.PI + 0.35, 14 + rnd(9, s) * 10, Math.max(1.5, r0 * 0.3), 2, s + 99);
  return pts;
}
// 굽은 줄기: 조절점마다 옆으로 흔들리며 가늘어진다, 혹 · 벌어진 밑동
function trunk2(K, X, yb, yt, wb, wt, amp, s) {
  const P = [];
  for (let y = yb, k = 0; y > yt - 30; y -= 36, k++) P.push([y, X + (k ? (rnd(k, s) - 0.5) * 2 * amp : 0)]);
  const c = (y) => {
    for (let k = 0; k + 1 < P.length; k++)
      if (y <= P[k][0] && y >= P[k + 1][0]) {
        const t = (P[k][0] - y) / (P[k][0] - P[k + 1][0]), u = t * t * (3 - 2 * t);
        return P[k][1] + (P[k + 1][1] - P[k][1]) * u;
      }
    return P[P.length - 1][1];
  };
  const w = (y) => wt + (wb - wt) * Math.max(0, (y - yt) / (yb - yt)) ** 1.25 + (y > yb - 14 ? ((y - (yb - 14)) / 14) ** 2 * wb * 0.45 : 0);
  for (let y = yt; y < yb; y++) {
    const hw = w(y) + Math.sin(y * 0.31 + s) * 0.6 + (fbm(y / 9, s, s) - 0.5) * 2.2;
    wood(K, Math.round(c(y) - hw), y, Math.round(c(y) + hw), y + 1);
  }
  // 혹 (줄기 옆 불룩한 곳)
  for (let k = 0; k < 4; k++) {
    const y = Math.round(yt + (yb - yt) * (0.2 + 0.6 * rnd(k, s + 30))), side = k % 2 ? 1 : -1;
    knob(K, c(y) + side * (w(y) - 1), y, 3 + rnd(k, s + 31) * 3, "wood");
  }
  return { c, w };
}
// 밑동 뿌리: 섬 윗면을 따라 기어 나가다 섬 속으로 박힌다
function rootFlare(K, T, base, s, n = 4) {
  for (let k = 0; k < n; k++) {
    const side = k % 2 ? 1 : -1, len = 16 + rnd(k, s) * 22, x0 = T.c(base - 6) + side * T.w(base - 6) * 0.6;
    limbPath(K, [[x0, base - 6], [x0 + side * len * 0.5, base - 1], [x0 + side * len, base + 4]], 4.5 - k * 0.4, 1.5);
  }
}
// 큰 받침 섬: 넓은 흙섬, 속은 짜임이 다른 굴 무리 셋을 비탈 굴로 잇는다, 밑으로 뿌리 커튼
function baseIsle(K, x0, x1, t, d, s, lays, flat, vx) {
  nat(K, x0, x1, flat ? () => t : jag(PL([[x0, t + 5], [x0 + 24, t], [x1 - 24, t], [x1, t + 5]]), 0.6, s), jag(PL([[x0, t + 10], [x0 + (x1 - x0) * 0.18, t + d * 0.65], [(x0 + x1) / 2 - 20, t + d], [(x0 + x1) / 2 + 30, t + d * 0.9], [x1 - (x1 - x0) * 0.16, t + d * 0.6], [x1, t + 10]]), 1.4, s + 1), { sh: flat ? 0 : 4, roll: flat ? 0 : 0.6, fingers: 5, flat: flat ? 1 : 0 });
  const w = (x1 - x0) / lays.length, all = [];
  lays.forEach((lay, k) => {
    const a = Math.round(x0 + w * k + 6), b = Math.round(x0 + w * (k + 1) - 6), R = rooms(K, a, b, t + (k % 2 ? 4 : 0), d - 8, lay, s + k * 5);
    R.forEach((r, j) => K.tag(r.x0, r.y0, r.x1, r.y1, (k + j) % 3 === 0 ? "treasure" : "arena"));
    const top = R.slice().sort((p, q) => p.y1 - q.y1)[0], hx = top.x0 + 4;
    climb(K, hx, t, top.y1, ["vine", "ladder", "rope"][k % 3]);
    all.push(R);
  });
  for (let k = 0; k + 1 < all.length; k++) {
    const A = all[k].slice().sort((p, q) => q.y1 - p.y1)[0], B = all[k + 1].slice().sort((p, q) => q.y1 - p.y1)[0];
    K.wiggle([[A.x1 - 2, A.y1], [B.x0 + 2, B.y1]], 7, 0.4);
  }
  for (let k = 0; k < 9; k++) root(K, Math.round(x0 + (x1 - x0) * (0.08 + k * 0.105)), t + Math.round(d * 0.55), 24 + Math.round(rnd(k, s) * 70), s + k, k % 3 === 1);
  for (const x of vx ?? []) islandVine(K, x, t);
  return all.flat();
}
// 나무 하나 o: x · base · top · wb · wt · amp · s · lv 줄기 속 층 [[위, 바닥, dx, 반폭]] · limbs [{h, side, len, rise, r0, hut}] · lead 수관 갈래 [[각, 길이, 굵기]]
function giant(K, o) {
  const T = trunk2(K, o.x, o.base + 1, o.top, o.wb, o.wt, o.amp, o.s), c = T.c;
  rootFlare(K, T, o.base, o.s, o.roots ?? 4);
  // 수관: 줄기 끝에서 큰 갈래가 자라며 갈라진다
  const tips = [];
  for (const [ang, len, r] of o.lead) grow(K, c(o.top) + Math.cos(ang) * o.wt * 0.4, o.top + 6, ang, len, r, 3, o.s + Math.round(ang * 100), tips);
  for (const [x, y] of tips.filter((_, k) => k % 3 === 0)) leaves(K, (x + c(o.top)) / 2, (y + o.top) / 2, 26, 14, o.s + x);
  // 줄기 속 굴: 층마다 한두 개, 좌우로 엇갈린다
  const H = o.lv.map(([y0, y1, dx, rx], k) => hollowWood(K, c((y0 + y1) / 2) + dx, y0, y1, rx, o.s + k));
  for (let k = 0; k + 1 < H.length; k++) {
    const lo = H[k], up = H[k + 1];
    if (lo.y1 === up.y1) {
      // 같은 층 옆방: 문
      K.air(Math.min(lo.x1, up.x1) - 2, lo.y1 - 8, Math.max(lo.x0, up.x0) + 2, lo.y1), K.wall(Math.min(lo.x1, up.x1) - 2, lo.y1 - 8, Math.max(lo.x0, up.x0) + 2, lo.y1, "inwood");
      continue;
    }
    const a = Math.max(lo.x0, up.x0) + 3, b = Math.min(lo.x1, up.x1) - 3;
    if (b - a >= 2) {
      const x = Math.round(a + (b - a) * (0.35 + 0.3 * rnd(k, o.s))), kind = ["vine", "ladder", "rope"][(k + o.s) % 3];
      K.air(x - 1, up.y1, x + 2, lo.y0 + 3), K.wall(x - 1, up.y1, x + 2, lo.y0 + 3, "inwood"), K.plank(x - 1, x + 2, up.y1), hang(K, x, up.y1, lo.y1, kind);
    } else {
      // 겹치지 않으면: 위 굴 바닥에서 옆으로 판 굴감을 지나 아래 굴로 내려가는 세로 굴
      const x = Math.round(Math.max(lo.x0 + 3, Math.min(lo.x1 - 3, up.cx))), kind = ["rope", "vine", "ladder"][(k + o.s) % 3];
      const ea = Math.min(x - 2, up.x1 - 2), eb = Math.max(x + 3, up.x0 + 2);
      K.air(ea, up.y1 - 8, eb, up.y1), K.wall(ea, up.y1 - 8, eb, up.y1, "inwood");
      K.air(x - 1, up.y1, x + 2, lo.y0 + 3), K.wall(x - 1, up.y1, x + 2, lo.y0 + 3, "inwood"), K.plank(x - 1, x + 2, up.y1), hang(K, x, up.y1, lo.y1, kind);
    }
  }
  // 밑동 문 (길·섬 윗면이 줄기를 지나간다)
  const f0 = H[0].y1;
  K.air(Math.round(c(f0 - 4) - T.w(f0 - 4)) - 4, f0 - 9, H[0].x0 + 2, f0), K.wall(Math.round(c(f0 - 4) - T.w(f0 - 4)) - 4, f0 - 9, H[0].x0 + 2, f0, "inwood");
  K.air(H[0].x1 - 2, f0 - 9, Math.round(c(f0 - 4) + T.w(f0 - 4)) + 5, f0), K.wall(H[0].x1 - 2, f0 - 9, Math.round(c(f0 - 4) + T.w(f0 - 4)) + 5, f0, "inwood");
  // 걷는 가지: 굴 바닥 문에서 나간다, 끝 나무집, 끝에서 덩굴
  for (const L of o.limbs) {
    const h = H[L.h], f = h.y1, side = L.side, r0 = L.r0 ?? 6;
    const e = Math.round(c(f - 4) + side * (T.w(f - 4) + 3)), fx = side < 0 ? h.x0 + 2 : h.x1 - 2;
    // 가지는 줄기 가장자리에서 시작 (굴 속을 메우지 않게), 문은 가지를 그린 뒤 판다
    const pts = walkLimb(K, e - side * 3, f + r0, side, L.len, L.rise, r0, o.s + L.h * 31 + side);
    K.air(Math.min(fx, e), f - 9, Math.max(fx, e), f), K.wall(Math.min(fx, e), f - 9, Math.max(fx, e), f, "inwood");
    const [ex, ey] = pts[5];
    if (L.hut) {
      const hx0 = Math.round(ex - L.hut / 2), ty = surf(K, Math.round(ex), Math.round(ey - 8));
      hut(K, hx0, hx0 + L.hut, ty, 11 + (L.h % 3), L.roof ?? "peak", { posts: 3 });
      K.tag(hx0 + 2, ty - 10, hx0 + L.hut - 2, ty, L.h % 2 ? "treasure" : "arena");
      P_(K, hx0 + 6, ty, ["p_crates", "p_nest", "p_shelf", "p_urn", "p_hive"][(o.s + L.h) % 5]);
    }
    const vx = Math.round(pts[6][0] - side * 3);
    tipVine(K, vx, surf(K, vx, Math.round(pts[6][1] - 8)));
  }
  // 수관 마루 (줄기 끝 갈래목) + 맨 위 굴에서 사다리
  const top = H[H.length - 1], lx = Math.round(top.cx), dy = o.top + 4;
  K.air(lx - 14, dy - 9, lx + 15, dy), K.wall(lx - 14, dy - 9, lx + 15, dy, "inwood"), DECKS.push([lx - 14, lx + 15, dy]), K.plank(lx - 14, lx + 15, dy), K.air(lx - 1, dy, lx + 2, top.y0 + 2), K.wall(lx - 1, dy, lx + 2, top.y0 + 2, "inwood"), K.ladder(lx, dy, top.y1);
  K.tag(lx - 14, dy - 12, lx + 15, dy, "arena");
  // 굴 역할 · 소품
  H.forEach((h, k) => {
    K.tag(h.x0, h.y0 + 2, h.x1, h.y1, k % 4 === 1 ? "treasure" : k % 4 === 3 ? "rest" : "arena");
    P_(K, Math.round(h.cx + (k % 2 ? 6 : -6)), h.y1, ["p_shroom", "p_nest", "p_log", "p_urn", "p_hive", "p_fern"][(o.s + k) % 6], { acc: 0x60f0c0 });
  });
  K.struct(o.name, "전투·보물고·오르는 길", Math.round(o.x - 160), o.top - 120, Math.round(o.x + 160), o.base);
  return { T, H };
}
let G3 = null;
function giants(K) {
  // 1 넓은 참나무 (서, 길 위)
  const G1 = giant(K, {
    name: "넓은 참나무", x: 150, base: 1000, top: 712, wb: 30, wt: 15, amp: 10, s: 501, roots: 5,
    lv: [[958, 1000, 0, 20], [914, 948, -10, 12], [914, 948, 12, 10], [864, 902, 8, 13], [818, 852, -8, 12], [770, 808, 6, 12], [726, 760, -4, 9]],
    limbs: [{ h: 1, side: -1, len: 96, rise: 20, hut: 26, roof: "round" }, { h: 3, side: 1, len: 104, rise: 26, hut: 24, roof: "leaf" }, { h: 4, side: -1, len: 80, rise: 16 }, { h: 5, side: 1, len: 70, rise: 22, hut: 22 }],
    lead: [[-2.7, 56, 8], [-2.1, 40, 7], [-1.0, 40, 7], [-0.45, 56, 8]],
  });
  // 2 반얀나무 (동, 길 위): 굵고 낮다, 가지가 길게 옆으로, 가지에서 공기뿌리
  const G2 = giant(K, {
    name: "반얀나무", x: 860, base: 1000, top: 690, wb: 38, wt: 24, amp: 8, s: 502, roots: 6,
    lv: [[952, 1000, 0, 28], [902, 942, 14, 14], [902, 942, -14, 12], [852, 892, -6, 16], [800, 842, 10, 14], [748, 790, -4, 15], [706, 740, 4, 11]],
    limbs: [{ h: 1, side: 1, len: 110, rise: 8, hut: 26, roof: "peak", r0: 7 }, { h: 3, side: -1, len: 130, rise: 10, r0: 7 }, { h: 4, side: 1, len: 100, rise: 18, hut: 24, roof: "round" }, { h: 5, side: -1, len: 90, rise: 24, hut: 22, roof: "leaf" }],
    lead: [[-2.75, 66, 9], [-2.15, 44, 8], [-1.0, 44, 8], [-0.4, 66, 9]],
  });
  for (const [x, y] of [[742, 900], [770, 896], [956, 928], [988, 930], [800, 846]]) {
    for (let j = 0; j < 990 - y; j++) K.wall(x - 1 + Math.round(Math.sin(j * 0.07 + x) * 1.5), y + j, x + 2 + Math.round(Math.sin(j * 0.07 + x) * 1.5), y + j + 1, "wood");
    K.vine(x - 1, x + 3, y, 996);
  }
  // 3 속 빈 고목 (가운데, 넓은 받침 섬)
  baseIsle(K, 340, 664, 790, 76, 503, ["burrow", "hall", "ring"], 0, [394]);
  G3 = giant(K, {
    name: "속 빈 고목", x: 500, base: 790, top: 450, wb: 36, wt: 20, amp: 12, s: 504, roots: 6,
    lv: [[740, 790, 0, 24], [690, 730, -14, 13], [690, 730, 14, 12], [638, 680, 4, 18], [586, 628, -10, 14], [534, 576, 10, 15], [534, 576, -14, 9], [488, 524, 0, 12]],
    limbs: [{ h: 1, side: -1, len: 120, rise: 14, hut: 26, roof: "leaf" }, { h: 2, side: 1, len: 120, rise: 20 }, { h: 3, side: -1, len: 100, rise: 24, hut: 24, roof: "peak" }, { h: 4, side: 1, len: 110, rise: 28, hut: 26, roof: "round" }, { h: 6, side: -1, len: 80, rise: 18 }],
    lead: [[-2.55, 84, 10], [-1.95, 66, 9], [-1.2, 66, 9], [-0.6, 84, 10]],
  });
  // 4 우산 소나무 (서 위): 곧고 높다, 꼭대기만 옆으로 퍼진 납작한 갈래
  baseIsle(K, 40, 316, 560, 64, 505, ["cellar", "twin"], 0, [Math.round(G1.H[G1.H.length - 1].cx) + 1]);
  giant(K, {
    name: "우산 소나무", x: 176, base: 560, top: 280, wb: 18, wt: 9, amp: 6, s: 506, roots: 4,
    lv: [[516, 560, 0, 12], [470, 508, 4, 8], [424, 462, -4, 8], [378, 416, 4, 8], [334, 370, -3, 7], [296, 326, 0, 6]],
    limbs: [{ h: 2, side: 1, len: 70, rise: 6, hut: 22, roof: "round", r0: 5 }, { h: 4, side: -1, len: 80, rise: 10, r0: 5 }, { h: 5, side: 1, len: 100, rise: 16, hut: 24, roof: "peak", r0: 5 }],
    lead: [[-2.95, 76, 6], [-2.5, 50, 5], [-0.65, 50, 5], [-0.2, 76, 6]],
  });
  // 5 갈래 줄기 나무 (동 위): 낮은 데서 두 갈래로 갈라져 각자 수관
  baseIsle(K, 700, 1010, 520, 66, 507, ["gallery", "nest", "pool"], 0, [Math.round(G2.H[G2.H.length - 1].cx) + 1]);
  const T5 = giant(K, {
    name: "갈래 줄기 나무", x: 856, base: 520, top: 410, wb: 24, wt: 16, amp: 6, s: 508, roots: 5,
    lv: [[476, 520, 0, 16], [436, 468, 0, 11]],
    limbs: [{ h: 0, side: -1, len: 100, rise: 18, hut: 24, roof: "leaf" }, { h: 1, side: 1, len: 90, rise: 22, hut: 22 }],
    lead: [[-2.15, 96, 11], [-0.95, 100, 11]],
  });
  void T5;
}

// ═══ 섬 하나: 흙 몸통 · 속 굴방 · 나무 · 잎 ═══
function isle(K, [x0, x1, t, d, lay, tree, tp], i) {
  const w = x1 - x0, s = 100 + i * 7, mid = (x0 + x1) / 2, lob = (rnd(i, 3) - 0.5) * w * 0.3;
  nat(K, x0, x1, jag(PL([[x0, t + 4], [x0 + w * 0.2, t], [x1 - w * 0.2, t], [x1, t + 4]]), 0.6, s), jag(PL([[x0, t + 8], [x0 + w * 0.18, t + d * 0.6], [mid + lob, t + d], [x1 - w * 0.2, t + d * 0.7], [x1, t + 8]]), 1.3, s + 1), { sh: 4, roll: 0.8, fingers: 2 + (i % 3) });
  for (let k = 0; k < 2 + (i % 2); k++) {
    const rx = Math.round(x0 + w * (0.25 + 0.5 * rnd(k, s))), ry = Math.round(t + d * 0.55);
    root(K, rx, ry, 18 + Math.round(rnd(k + 9, s) * 34), s + k, 0);
  }
  const R = rooms(K, x0, x1, t, d, lay, s);
  // 윗면 → 맨 위 방 뚜껑 (나무 자리를 피해서)
  const tx = Math.round(x0 + w * tp), top = R.slice().sort((a, b) => a.y1 - b.y1)[0];
  if (top) {
    let hx = Math.abs(top.x0 + 4 - tx) > 10 ? top.x0 + 4 : top.x1 - 5;
    climb(K, hx, t, top.y1, i % 3 === 0 ? "vine" : i % 3 === 1 ? "ladder" : "rope");
  }
  // 나무
  mark(true);
  const tr = plant(K, tree, tx, t, s, i);
  mark(false);
  // 역할: 방마다 번갈아, 윗면 싸움터
  R.forEach((r, k) => K.tag(r.x0, r.y0, r.x1, r.y1, (i + k) % 3 === 0 ? "treasure" : (i + k) % 3 === 1 ? "arena" : k ? "rest" : "arena"));
  K.tag(x0 + 6, t - 12, x1 - 6, t, tree === "elder" ? "rest" : "arena", tree === "elder" ? { safe: 1 } : undefined);
  const LN = { twin: "쌍굴", stack: "겹굴", hall: "뿌리 기둥 홀", pool: "샘 굴", burrow: "굴토끼 굴", cellar: "움막 굴", ring: "고리 굴", nest: "둥지 굴", gallery: "긴 회랑", elder: "고목 사당" };
  const TN = { oak: "참나무", birch: "자작나무", pine: "소나무", willow: "버드나무", dead: "고사목", shroom: "큰 버섯", bush: "덤불", twin: "쌍둥이 나무", stump: "속 빈 그루터기", elder: "고목" };
  K.struct(`${TN[tree]} ${LN[lay]} 섬`, "전투·보물고", x0, t - 60, x1, t + d);
  return { x0, x1, t, d, R, i, tree, tx, tr };
}

// ── 속 짜임 아홉 가지 (방 크기·자리는 섬 폭·깊이를 따른다) ──
function rooms(K, x0, x1, t, d, lay, s) {
  const w = x1 - x0, R = [], add = (a, b, c, e, k) => (R.push({ x0: Math.round(a), y0: Math.round(b), x1: Math.round(c), y1: Math.round(e), k }), R[R.length - 1]);
  const P = (r, k, o) => P_(K, Math.round((r.x0 + r.x1) / 2 + (o ?? 0)), r.y1, k);
  if (lay === "twin") {
    const a = add(x0 + 8, t + 5, x0 + w * 0.47, t + 17), b = add(x0 + w * 0.53, t + 8, x1 - 8, t + 20);
    cave(K, a.x0, a.y0, a.x1, a.y1, s), cave(K, b.x0, b.y0, b.x1, b.y1, s + 1);
    K.air(a.x1 - 3, a.y1 - 7, b.x0 + 3, a.y1), K.rock(a.x1 - 3, a.y1, b.x0 + 3, b.y1 + 1);
    P(a, "p_shroom"), P(b, "p_log");
  } else if (lay === "stack") {
    const a = add(x0 + 8, t + 5, x1 - w * 0.36, t + 16), b = add(x0 + w * 0.34, t + 21, x1 - 8, t + 32);
    cave(K, a.x0, a.y0, a.x1, a.y1, s), cave(K, b.x0, b.y0, b.x1, b.y1, s + 1);
    climb(K, Math.round(Math.max(a.x0, b.x0) + 4), a.y1, b.y0, "rope"), hang(K, Math.round(Math.max(a.x0, b.x0) + 4), a.y1, b.y1, "rope");
    P(a, "p_nest"), P(b, "p_urn");
  } else if (lay === "hall") {
    // 뿌리 기둥 홀: 넓은 방에 뿌리 기둥(뒷벽)과 다락 판자
    const a = add(x0 + 6, t + 5, x1 - 6, t + 22);
    room(K, a.x0, a.y0, a.x1, a.y1);
    for (let x = a.x0 + 10; x < a.x1 - 8; x += 13 + Math.round(rnd(x, s) * 6)) K.wall(x, a.y0, x + 2, a.y1, "wood");
    K.plank(a.x0, a.x0 + Math.round(w * 0.3), a.y0 + 9), K.ladder(a.x0 + Math.round(w * 0.3) - 2, a.y0 + 9, a.y1);
    P(a, "p_crates", -w * 0.25), P(a, "p_shroom", w * 0.2);
  } else if (lay === "pool") {
    // 샘 굴: 바닥 가운데 웅덩이, 왼쪽 위 작은 굴
    const a = add(x0 + 8, t + 7, x1 - 8, t + 21), b = add(x0 + 6, t + 3, x0 + w * 0.32, t + 9);
    cave(K, a.x0, a.y0, a.x1, a.y1, s), room(K, b.x0, b.y0, b.x1, b.y1);
    const m = Math.round((a.x0 + a.x1) / 2);
    K.air(m - 9, a.y1, m + 9, a.y1 + 4), K.water(m - 9, a.y1 - 2, m + 9, a.y1 + 4);
    climb(K, b.x1 - 3, b.y1, a.y0 + 2, "vine"), hang(K, b.x1 - 3, b.y1, a.y1, "vine");
    P(a, "p_fern", -w * 0.3), P(b, "p_nest");
  } else if (lay === "burrow") {
    // 굴토끼 굴: 작은 굴 셋을 비탈 굴로
    const a = add(x0 + 8, t + 5, x0 + w * 0.36, t + 13), b = add(x0 + w * 0.6, t + 9, x1 - 8, t + 17), c = add(x0 + w * 0.3, t + 21, x0 + w * 0.66, t + 29);
    for (const [r, k] of [[a, 0], [b, 1], [c, 2]]) cave(K, r.x0, r.y0, r.x1, r.y1, s + k);
    K.wiggle([[a.x1 - 2, a.y1], [b.x0 + 2, b.y1]], 6, 0.5), K.wiggle([[b.x0 + 3, b.y1], [c.x1 - 2, c.y1]], 6, 0.4);
    P(a, "p_log"), P(b, "p_nest"), P(c, "p_shroom");
  } else if (lay === "cellar") {
    // 움막 + 굴: 나무 벽 움막(위) 밑에 둥근 굴
    const a = add(x0 + 10, t + 5, x0 + w * 0.56, t + 15, "wood"), b = add(x0 + w * 0.3, t + 20, x1 - 10, t + 31);
    room(K, a.x0, a.y0, a.x1, a.y1, "wood"), cave(K, b.x0, b.y0, b.x1, b.y1, s);
    climb(K, a.x1 - 4, a.y1, b.y0 + 2, "ladder"), hang(K, a.x1 - 4, a.y1, b.y1, "ladder");
    P(a, "p_shelf"), P(a, "p_crates", 6), P(b, "p_urn");
  } else if (lay === "ring") {
    // 고리 굴: 높이가 다른 두 굴을 윗굴·아랫굴 둘로 이어 빙 돈다
    const a = add(x0 + 8, t + 6, x0 + w * 0.4, t + 18), b = add(x1 - w * 0.4, t + 14, x1 - 8, t + 26);
    cave(K, a.x0, a.y0, a.x1, a.y1, s), cave(K, b.x0, b.y0, b.x1, b.y1, s + 1);
    K.wiggle([[a.x1 - 2, a.y1], [b.x0 + 2, b.y1]], 6, 0.3), K.wiggle([[a.x1 - 3, a.y1 - 8], [b.x0 + 3, b.y0 + 2]], 5, 0.2);
    P(a, "p_crates"), P(b, "p_nest");
  } else if (lay === "nest") {
    // 둥지 굴: 큰 둥근 굴, 벽에 턱
    const a = add(x0 + w * 0.15, t + 4, x1 - w * 0.15, t + 26);
    cave(K, a.x0, a.y0, a.x1, a.y1, s);
    K.rock(a.x0 + 2, a.y0 + 10, a.x0 + 10, a.y0 + 12), K.rock(a.x1 - 10, a.y0 + 14, a.x1 - 2, a.y0 + 16);
    P_(K, Math.round((a.x0 + a.x1) / 2), a.y1, "p_nest", { sc: 1.6 }), P(a, "p_bones", 8);
  } else if (lay === "gallery") {
    // 긴 회랑: 섬을 가로지르는 낮은 굴 + 위로 패인 굴감 둘
    const a = add(x0 + 6, t + 14, x1 - 6, t + 22), b = add(x0 + w * 0.2, t + 5, x0 + w * 0.36, t + 14), c = add(x1 - w * 0.38, t + 6, x1 - w * 0.2, t + 14);
    K.wiggle([[a.x0, a.y1], [a.x1, a.y1]], 8, 1), cave(K, b.x0, b.y0, b.x1, b.y1 + 1, s), cave(K, c.x0, c.y0, c.x1, c.y1 + 1, s + 1);
    P(a, "p_log", -w * 0.3), P(a, "p_fern", w * 0.3), P(b, "p_urn"), P(c, "p_nest");
  } else if (lay === "elder") {
    // 고목 섬: 사당 굴 (회복 샘) · 아래 보물 굴
    const a = add(x0 + 12, t + 6, x1 - 12, t + 20), b = add(x0 + w * 0.3, t + 26, x1 - w * 0.3, t + 36);
    cave(K, a.x0, a.y0, a.x1, a.y1, s), cave(K, b.x0, b.y0, b.x1, b.y1, s + 1);
    climb(K, Math.round(b.x0 + 4), a.y1, b.y0 + 2, "ladder"), hang(K, Math.round(b.x0 + 4), a.y1, b.y1, "ladder");
    P_(K, Math.round((a.x0 + a.x1) / 2), a.y1, "p_font", { sc: 1.3 }), K.heal(Math.round((a.x0 + a.x1) / 2) - 5, Math.round((a.x0 + a.x1) / 2) + 5, a.y1 - 4, a.y1), P(b, "p_altar");
  }
  return R;
}

// ── 나무 (섬 윗면 t, 자리 x) — 위 섬에 닿지 않게 키를 줄인다 ──
function plant(K, type, x, t, s, i) {
  let room_ = 200;
  for (let y = t - 4; y > t - 200 && y > 2; y--) if ([-34, -20, -8, 0, 8, 20, 34].some((d) => K.get(x + d, y) === 1)) ((room_ = t - y), (y = 0));
  const H = (want) => Math.max(12, Math.min(want, room_ - 40));
  const r = (k) => rnd(i * 13 + k, s);
  if (type === "oak" || type === "elder") {
    const h = H(type === "elder" ? 64 : 40 + Math.round(r(1) * 18)), T = trunk(K, x, t + 1, t - h, type === "elder" ? 9 : 6, type === "elder" ? 4 : 3, 2, s), top = t - h;
    const n = type === "elder" ? 5 : 3 + (i % 2);
    for (let k = 0; k < n; k++) {
      const side = k % 2 ? 1 : -1, y0 = top + 4 + Math.round(h * 0.15 * k), len = 14 + r(k + 2) * 16 + (type === "elder" ? 12 : 0);
      const p2 = [T.c(y0) + side * len, y0 - 6 - r(k + 5) * 8];
      bough(K, [T.c(y0), y0], [T.c(y0) + side * len * 0.5, y0 - 2], p2, 3, 1.5);
      leaves(K, p2[0], p2[1] - 4, 14 + r(k) * 8, 9, s + k);
    }
    leaves(K, T.c(top), top - 4, 22 + h * 0.3, 14, s + 9), leaves(K, T.c(top) + 10, top + 8, 18, 10, s + 10);
    // 속 빈 줄기 방 (큰 나무만)
    if (h >= 44) {
      const c = Math.round(T.c(t - 8)), hw = Math.max(3, Math.round(T.w(t - 8)) - 2);
      room(K, c - hw, t - 14, c + hw, t, "wood"), K.air(c - hw - 4, t - 8, c - hw, t), K.air(c + hw, t - 8, c + hw + 4, t);
      P_(K, c, t, "p_shelf"), K.tag(c - hw, t - 14, c + hw, t, "treasure");
    }
    h < 44 && baseDoor(K, T, t);
    if (type === "elder") {
      const pk = Math.round(T.c(top));
      K.plank(pk - 8, pk + 8, top - 2), climb(K, pk, top - 2, t - 14, "ladder", "wood"), hang(K, pk, top - 2, t, "ladder");
      K.peak(pk, top - 2);
    }
    return { top: t - h };
  }
  if (type === "birch") {
    const h = H(36 + Math.round(r(1) * 16));
    for (let k = 0; k < 2; k++) {
      const bx = x + (k ? 7 : -3), hh = h - k * 8;
      // 흰 줄기 + 검은 띠, 밑동은 지나다닌다
      K.rock(bx - 1, t - hh, bx + 2, t), K.mat(bx - 1, t - hh, bx + 2, t, "stem");
      for (let y = t - hh + 4; y < t - 10; y += 7 + ((bx + y) % 4)) K.mat(bx - 1, y, bx + 2, y + 1, "wood");
      K.air(bx - 1, t - 8, bx + 2, t), K.wall(bx - 1, t - 8, bx + 2, t, "stem");
      bough(K, [bx, t - hh * 0.6], [bx + (k ? 6 : -6), t - hh * 0.7], [bx + (k ? 11 : -11), t - hh * 0.8], 1.4, 0.8);
      leaves(K, bx, t - hh - 2, 12, 10, s + k);
    }
    return { top: t - h };
  }
  if (type === "pine") {
    const h = H(44 + Math.round(r(1) * 20)), T = trunk(K, x, t + 1, t - h, 3, 1, 1, s);
    baseDoor(K, T, t);
    for (let k = 0, y = t - 8; y > t - h + 4; k++) {
      const u = (t - y) / h, len = (1 - u) * 22 + 4 + r(k) * 4;
      bough(K, [T.c(y), y], [T.c(y) - len * 0.5, y - 1], [T.c(y) - len, y + 3], 1.5, 1), bough(K, [T.c(y), y], [T.c(y) + len * 0.5, y - 1], [T.c(y) + len * 0.9, y + 3], 1.5, 1);
      leaves(K, T.c(y), y - 2, len + 2, 5, s + k, 1);
      y -= 8 + Math.round(r(k + 30) * 5);
    }
    leaves(K, T.c(t - h), t - h - 2, 6, 6, s + 77, 1);
    return { top: t - h };
  }
  if (type === "willow") {
    const h = H(34 + Math.round(r(1) * 12)), T = trunk(K, x, t + 1, t - h, 5, 3, 2, s), top = t - h;
    baseDoor(K, T, t);
    for (const [dx, dy] of [[-26, 10], [-12, 16], [14, 14], [28, 8]]) {
      const p0 = [T.c(top + 2), top + 2], p1 = [x + dx * 0.6, top - 8], p2 = [x + dx, top + dy];
      bough(K, p0, p1, p2, 2.5, 1.2);
      for (const tt of [0.7, 0.9]) {
        const [vx, vy] = qpt(p0, p1, p2, tt);
        K.vine(Math.round(vx) - 1, Math.round(vx) + 2, Math.round(vy) + 1, Math.round(vy) + 16 + ((Math.round(vx) * 7) % 14));
      }
    }
    leaves(K, x, top - 4, 34, 12, s), leaves(K, x - 22, top + 4, 16, 9, s + 1), leaves(K, x + 22, top + 4, 16, 9, s + 2);
    return { top };
  }
  if (type === "dead") {
    const h = H(30 + Math.round(r(1) * 14)), T = trunk(K, x, t + 1, t - h, 4, 2, 2, s), top = t - h;
    baseDoor(K, T, t);
    for (const [dx, dy, yy] of [[-14, -8, 0.4], [12, -12, 0.6], [-8, -14, 0.85]]) {
      const y0 = Math.round(t - h * yy);
      bough(K, [T.c(y0), y0], [T.c(y0) + dx * 0.5, y0 + dy * 0.3], [T.c(y0) + dx, y0 + dy], 2, 1);
    }
    K.mat(x - 20, top - 16, x + 20, t + 1, "stem");
    P_(K, x + 10, t, "p_bones");
    return { top };
  }
  if (type === "shroom") {
    for (const [dx, h, rr] of [[0, 26, 13], [-14, 12, 7], [15, 16, 8]]) {
      const hh = H(h), mx = x + dx;
      K.wall(mx - 2, t - hh, mx + 3, t, "stem");
      const top = t - hh;
      for (let y = top - Math.round(rr * 0.55); y < top + 3; y++) {
        const hw = Math.round(rr * Math.sqrt(Math.max(0, 1 - ((y - top + 1) / (rr * 0.6)) ** 2)));
        hw > 0 && (K.rock(mx - hw, y, mx + hw + 1, y + 1), K.mat(mx - hw, y, mx + hw + 1, y + 1, "cap"));
      }
      K.bounce(mx - Math.round(rr * 0.4), mx + Math.round(rr * 0.4) + 1, top - Math.round(rr * 0.55));
    }
    return { top: t - 30 };
  }
  if (type === "bush") {
    leaves(K, x, t - 6, 20, 8, s), leaves(K, x - 16, t - 4, 12, 6, s + 1), leaves(K, x + 16, t - 4, 12, 6, s + 2);
    P_(K, x - 8, t, "p_flowers"), P_(K, x + 10, t, "p_flowers");
    return { top: t - 12 };
  }
  if (type === "twin") {
    for (const [dx, hh] of [[-10, 30], [10, 22]]) {
      const h = H(hh), T = trunk(K, x + dx, t + 1, t - h, 3, 2, 1, s + dx);
      baseDoor(K, T, t);
      bough(K, [T.c(t - h + 4), t - h + 4], [x + dx + Math.sign(dx) * 6, t - h], [x + dx + Math.sign(dx) * 12, t - h - 4], 2, 1);
      leaves(K, x + dx, t - h - 2, 16, 10, s + dx);
    }
    return { top: t - 30 };
  }
  if (type === "stump") {
    // 속 빈 그루터기: 넓은 그루터기 안에 방, 위가 뚫려 있다
    const T = trunk(K, x, t + 1, t - 18, 14, 12, 1, s);
    room(K, x - 10, t - 16, x + 10, t, "wood"), K.air(x - 16, t - 8, x - 10, t), K.air(x + 10, t - 8, x + 16, t), K.air(x - 6, t - 20, x + 6, t - 16);
    for (let k = 0; k < 6; k++) wood(K, x - 13 + k * 5, t - 20 - (k % 2) * 2, x - 11 + k * 5, t - 18);
    P_(K, x, t, "p_nest"), K.tag(x - 10, t - 16, x + 10, t, "treasure");
    return { top: t - 20 };
  }
  return { top: t };
}

// ═══ 덩굴로 아래 섬까지 (맨 아래 방에서, 가장 가까이 닿는 자리) ═══
function linkDown(K, I, i) {
  let best = null;
  for (let x = I.x0 + 8; x < I.x1 - 8; x += 3) {
    if (Math.abs(x - I.tx) < 10) continue;
    const d = islandVine(K, x, surf(K, x, I.t), 260, true);
    d > 0 && (!best || d < best[1]) && (best = [x, d]);
  }
  best && islandVine(K, best[0], surf(K, best[0], I.t), 260);
}
// ═══ 이웃 섬 잇기 (같은 층, 높이 차가 크지 않으면 통나무 다리 / 판자 출렁다리) ═══
function linkSide(K, B) {
  for (let a = 0; a < B.length; a++)
    for (let b = 0; b < B.length; b++) {
      const A = B[a], C = B[b];
      if (C.x0 <= A.x1 || C.x0 - A.x1 > 64 || Math.abs(C.t - A.t) > 60) continue;
      if (B.some((D) => D !== A && D !== C && D.x0 > A.x1 - 4 && D.x1 < C.x0 + 4 && Math.abs(D.t - (A.t + C.t) / 2) < 50)) continue;
      const xa = A.x1 - 3, xb = C.x0 + 3, ya = surf(K, xa, A.t), yb = surf(K, xb, C.t), gap = xb - xa, dt = Math.abs(ya - yb);
      if (dt <= gap * 0.8) {
        if ((a + b) % 2 && dt <= 4) rope_bridge(K, xa, xb, Math.min(ya, yb), 3 + ((a * 3) % 4), 4, a % 3);
        else bough(K, [xa - 2, ya + 2], [(xa + xb) / 2, (ya + yb) / 2 + 2], [xb + 2, yb + 2], 2.4, 2.4);
      } else {
        // 높이 차가 크면: 높은 섬 끝에서 덩굴을 늘어뜨리고, 낮은 섬에서 그 밑까지 통나무
        const hi = ya < yb ? { x: xa + 3, y: ya } : { x: xb - 3, y: yb }, lo = ya < yb ? { x: xb + 2, y: yb } : { x: xa - 2, y: ya };
        bough(K, [lo.x, lo.y + 2], [(lo.x + hi.x) / 2, lo.y + 2], [hi.x, lo.y + 2], 2.4, 2.4);
        K.vine(hi.x - 1, hi.x + 2, hi.y - 2, lo.y);
      }
    }
}

// ═══ 뿌리섬 길 (줄 1000): 양 끝은 거대 나무가 선 넓은 섬, 가운데는 작은 섬 넷 + 그네 둘 ═══
function road(K) {
  const F = 1000;
  // 서쪽 넓은 섬 (출구 · 넓은 참나무)
  baseIsle(K, 0, 306, F, 48, 401, ["pool", "cellar", "burrow"], 1);
  P_(K, 20, F, "p_font"), K.heal(16, 24, F - 4, F), K.tag(2, F - 14, 50, F, "rest", { safe: 1 });
  bough(K, [304, F + 2], [318, F + 3], [332, F + 2], 2.4, 2.4);
  const isl = (x0, x1, bot, s) => nat(K, x0, x1, () => F, jag(PL(bot), 1.3, s), { flat: 1, fingers: 3 });
  isl(330, 436, [[330, 1006], [350, 1030], [390, 1044], [420, 1030], [436, 1006]], 3);
  cave(K, 342, 1008, 388, 1022, 3), climb(K, 350, F, 1012, "ladder"), cave(K, 394, 1010, 428, 1022, 4), K.air(386, 1014, 396, 1020);
  P_(K, 360, 1022, "p_shroom", { acc: 0x40e0c0 }), P_(K, 410, 1022, "p_log"), K.tag(342, 1008, 388, 1022, "treasure"), K.tag(394, 1010, 428, 1022, "arena");
  K.swing(446, F - 40, 34);
  mark(true);
  const Ta = trunk2(K, 420, F + 1, F - 34, 5, 3, 3, 33);
  grow(K, Ta.c(F - 30), F - 30, -0.5, 30, 3, 2, 33);
  K.air(Math.round(Ta.c(F - 4)) - 9, F - 9, Math.round(Ta.c(F - 4)) + 10, F), K.wall(Math.round(Ta.c(F - 4)) - 8, F - 9, Math.round(Ta.c(F - 4)) + 9, F, "inwood");
  mark(false);
  isl(470, 560, [[470, 1006], [490, 1032], [520, 1044], [550, 1030], [560, 1006]], 4);
  cave(K, 480, 1008, 520, 1020, 5), climb(K, 512, F, 1012, "rope"), cave(K, 524, 1012, 552, 1024, 6), K.air(518, 1016, 526, 1020);
  P_(K, 496, 1020, "p_urn"), P_(K, 540, 1024, "p_nest"), K.tag(480, 1008, 520, 1020, "arena"), K.tag(524, 1012, 552, 1024, "treasure");
  bough(K, [558, F + 2], [572, F + 3], [588, F + 2], 2.4, 2.4);
  isl(586, 680, [[586, 1006], [606, 1032], [640, 1046], [670, 1030], [680, 1006]], 5);
  cave(K, 598, 1008, 640, 1022, 7), climb(K, 606, F, 1012, "ladder"), room(K, 646, 1010, 674, 1022, "wood"), K.air(638, 1014, 648, 1020);
  P_(K, 616, 1022, "p_shroom", { acc: 0xffa040 }), P_(K, 660, 1022, "p_crates"), K.tag(598, 1008, 640, 1022, "arena"), K.tag(646, 1010, 674, 1022, "treasure");
  K.swing(690, F - 38, 32);
  mark(true);
  const Tb = trunk2(K, 664, F + 1, F - 30, 5, 3, 3, 44);
  grow(K, Tb.c(F - 26), F - 26, -0.4, 28, 3, 2, 44);
  K.air(Math.round(Tb.c(F - 4)) - 9, F - 9, Math.round(Tb.c(F - 4)) + 10, F), K.wall(Math.round(Tb.c(F - 4)) - 8, F - 9, Math.round(Tb.c(F - 4)) + 9, F, "inwood");
  mark(false);
  // 동쪽 넓은 섬 (출구 · 반얀나무)
  baseIsle(K, 714, 1024, F, 50, 402, ["twin", "hall", "stack"], 1);
  P_(K, 1004, F, "p_font"), K.heal(1000, 1008, F - 4, F), K.tag(976, F - 14, 1022, F, "rest", { safe: 1 });
  K.struct("뿌리섬 길", "거점·출구", 0, 960, 1024, 1050);
}
