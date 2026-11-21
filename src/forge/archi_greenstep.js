// ══════════════════════════════════════════════════════════════
// 그린스텝 「붉은 사암 군도」 — 땅덩어리 없이 맨 아래까지 떠 있는 섬뿐
//   지도 = 칸(8px) 1024 × 1056 · 맨 아래 섬 길 줄 1000 (좌우 출구) · ▲ = 정상 목초지 돌 고리 (x 544)
//   섬 하나하나를 손으로 짓는다: 모양·속 짜임이 전부 다르다 (같은 틀을 찍는 함수 없음)
//   층 띠 (위→아래)
//     가 줄: 연 언덕 · 봉화 첨탑 · 정상 목초지(큰 헛간·낙농실·양치기 묘실, 서쪽 큰 폭포) · 하늘 우물 · 엇갈린 탑 섬
//     나 줄: 독수리 바위(굴 사슬) · 유목 천막 뗏목 넷 · 선돌 사당(별 돔·소용돌이 비탈) · 부서진 둑길(아치·폐탑) · 바람개비 언덕(바람 굴뚝)
//     다 줄: 바람 아치(아치 구멍을 바람이 지난다) · 계단밭(단마다 뒤에 움) · 알 섬(숫양 우두머리 방) · 베틀 공방(속 비탈) · 폭포 계단 군도
//     라 줄: 갈라진 협곡 고원(벼랑 집) · 양 우리와 토끼 굴 · 물레방아 섬 · 거꾸로 매달린 마을 · 매 둥지 첨탑 · 치즈 동굴 섬
//     섬 길: 서쪽 나루 → 출렁다리 → 양 건너기 바위 → 구름 디딤 → 장터 섬 → 출렁다리 → 연못 섬 → 나룻 바구니 → 아치 바위 → 디딤돌 → 풍차 섬 → 판자 다리 → 동쪽 나루
//   길: 섬 속이 곧 오르는 길이다 — 아래 섬 윗면에 늘어진 줄·덩굴을 타고 위 섬 배 속으로 들어가 층을 지나 윗면으로
//   장치: 나룻 바구니(새) · 폭포(헤엄쳐 오른다) · 바람 굴뚝 · 아치 바람 · 짚라인 · 사다리·밧줄·덩굴 · 무너지는 판 · 금 간 벽
// ══════════════════════════════════════════════════════════════

// ── 모양 도구 (선 하나 = 점 목록) ──
const PL = (pts) => (x) => {
  if (x <= pts[0][0]) return pts[0][1];
  for (let k = 0; k + 1 < pts.length; k++) {
    const [xa, ya] = pts[k], [xb, yb] = pts[k + 1];
    if (x <= xb) return ya + ((yb - ya) * (x - xa)) / Math.max(1e-9, xb - xa);
  }
  return pts[pts.length - 1][1];
};
// 울퉁불퉁 (사암 벼랑 결)
const jag = (f, a, s) => (x) => f(x) + (Math.sin(x * 0.37 + s) * 0.5 + Math.sin(x * 0.11 + s * 1.7) * 0.8 + Math.sin(x * 0.83 + s * 3.1) * 0.3) * a;
// 2D 값 잡음 (0~1)
const H2 = (i, j, s) => {
  let h = (i * 374761393 + j * 668265263 + s * 1274126177) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const vn = (x, y, s) => {
  const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = H2(i, j, s), b = H2(i + 1, j, s), c = H2(i, j + 1, s), d = H2(i + 1, j + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};
const fbm = (x, y, s) => vn(x, y, s) * 0.55 + vn(x * 2.1 + 3.3, y * 2.1, s + 7) * 0.3 + vn(x * 4.4, y * 4.4 + 1.7, s + 13) * 0.15;
// 떠 있는 섬 몸통 (자연 바위): 윗면 top(x) ~ 밑면 bot(x)를 뼈대로
//   윗면: 완만히 구르고 양 끝 어깨가 둥글게 떨어진다 · 밑면·옆: 2D로 비틀고 깎아 처마·혹·패인 곳 · 밑으로 늘어진 바위 손가락
//   o.flat: 윗면을 그대로 (섬 길·출구) · o.roll 윗면 굴곡 · o.warp 비틀기 · o.rough 깎기 · o.fingers 손가락 수 · o.sh 어깨 폭
function nat(K, x0, x1, top, bot, o = {}) {
  const s = o.seed ?? (x0 * 13 + x1 * 7) % 997, W = x1 - x0;
  const roll = o.flat ? 0 : o.roll ?? 1.6, warp = o.warp ?? Math.min(7, 2 + W / 40), rough = o.rough ?? 2.2, sh = o.flat ? o.sh ?? 0 : o.sh ?? Math.min(14, 4 + W / 16);
  const cl = (x) => Math.max(x0, Math.min(x1 - 1, x));
  let yMax = 0;
  for (let x = x0 - 8; x < x1 + 8; x++) {
    const d = Math.min(x - x0, x1 - 1 - x);
    let T = top(cl(x)) + (fbm(x / 26, 0.5, s) - 0.5) * 2 * roll;
    if (d < sh) T += ((sh - d) / Math.max(1, sh)) ** 2 * sh * 0.8;
    const t = Math.round(T);
    for (let y = t; y < t + 400; y++) {
      const wx = (fbm(x / 17, y / 17, s + 3) - 0.5) * 2 * warp, wy = (fbm(x / 17 + 9, y / 17, s + 5) - 0.5) * 1.2 * warp;
      const xw = x + wx * Math.min(1, (y - t) / 6);
      if (xw < x0 || xw >= x1) {
        if (y - t > 6) continue;
        break;
      }
      const B = bot(cl(Math.round(xw))) + wy + (fbm(x / 6, y / 6, s + 9) - 0.5) * 2 * rough;
      if (y >= B) break;
      K.set(x, y, 1), body(K, x, y), (yMax = Math.max(yMax, y));
    }
  }
  // 바위 손가락 (밑면에서 늘어진 뾰족 바위)
  const n = o.fingers ?? Math.max(1, Math.round(W / 34));
  for (let k = 0; k < n; k++) {
    const fx = Math.round(x0 + W * (0.15 + (0.7 * (k + 0.5)) / n) + (H2(k, 1, s) - 0.5) * W * 0.12);
    let y = Math.round(top(cl(fx)));
    while (y < K.NY - 2 && K.get(fx, y) === 1) y++;
    const L = Math.round(5 + H2(k, 2, s) * Math.min(22, W / 6)), w = 1.5 + H2(k, 3, s) * Math.min(4, W / 30);
    for (let j = -2; j < L && y + j < K.NY - 8; j++) {
      const hw = w * Math.pow(1 - Math.max(0, j) / L, 0.75), xc = fx + Math.sin(j * 0.33 + k) * 1.3;
      if (hw > 0.4) for (let xx = Math.round(xc - hw); xx < Math.round(xc + hw) + 1; xx++) K.set(xx, y + j, 1), body(K, xx, y + j);
    }
  }
}
// 둥근 속 빈 곳 (가장자리를 잡음으로 흔든다)
function hollow(K, cx, cy, rx, ry, s, amt = 0.08) {
  for (let y = Math.floor(cy - ry * 1.2); y <= cy + ry * 1.2; y++)
    for (let x = Math.floor(cx - rx * 1.2); x <= cx + rx * 1.2; x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      dx * dx + dy * dy < (1 + (fbm(x / 9, y / 9, s) - 0.5) * 2 * amt) ** 2 && K.set(x, y, -1);
    }
}
// 방 (뒷벽 포함): [x0, x1) × [y0, y1), 바닥 = y1
function room(K, x0, y0, x1, y1, m = "rock") {
  K.air(x0, y0, x1, y1);
  K.wall(x0, y0, x1, y1, m);
  // 바위 방은 위 모서리가 둥글다
  if (m === "rock" && y1 - y0 >= 9 && x1 - x0 >= 12) {
    const c = Math.min(4, Math.floor((y1 - y0) / 3));
    for (let k = 0; k < c; k++) K.rock(x0, y0 + k, x0 + c - k, y0 + k + 1), K.rock(x1 - c + k, y0 + k, x1, y0 + k + 1);
  }
  // 바위 방은 천장에 사암 덩이가 처진다 (높은 방만)
  if (m === "rock" && y1 - y0 >= 11)
    for (let x = x0 + 2; x < x1 - 2; x++) {
      const v = Math.round(Math.sin(x * 0.53 + y0) * 1.1 + Math.sin(x * 0.19 + x0) * 1.2 - 0.6);
      v > 0 && K.rock(x, y0, x + 1, y0 + v);
    }
}
// 윗면 찾기: 어림 줄 y 근처에서 그 세로줄의 바위 윗면
function surf(K, x, y) {
  while (y < K.NY - 2 && K.get(x, y) !== 1) y++;
  while (y > 1 && K.get(x, y - 1) === 1) y--;
  return y;
}
// 층 사이 세로 통로 (가운데 x, 3칸 폭): 위 바닥 fu(윗면이면 어림)에 판자 뚜껑, 아래 바닥 fd까지
function climb(K, x, fu, fd, k = "ladder", m = "rock") {
  fu = surf(K, x, fu);
  K.air(x - 1, fu, x + 2, fd);
  m && K.wall(x - 1, fu, x + 2, fd, m);
  K.plank(x - 1, x + 2, fu);
  hang(K, x, fu, fd, k);
}
function hang(K, x, fu, fd, k) {
  k === "ladder" ? K.ladder(x, fu, fd) : k === "rope" ? K.rope(x, fu - 3, fd) : K.vine(x - 1, x + 2, fu - 3, fd);
}
// 섬 배를 뚫고 아래 섬 윗면까지 늘어뜨린다 (아래 섬이 먼저 지어져 있어야 한다)
function dropTo(K, x, f, k = "rope") {
  let y = f;
  while (y < K.NY - 2 && K.get(x, y) === 1) y++;
  K.air(x - 1, f, x + 2, y);
  K.wall(x - 1, f, x + 2, y, "rock");
  K.plank(x - 1, x + 2, f);
  while (y < K.NY - 2 && K.get(x, y) !== 1) y++;
  hang(K, x, f, y, k);
  return y;
}
// 출렁다리: 판자를 4칸씩, 가운데가 sag만큼 처진다 (every번째마다 무너지는 판)
function rope_bridge(K, xa, xb, f, sag, every = 0, off = 0) {
  for (let x = xa, i = 0; x < xb; x += 4, i++) {
    const t = (x + 2 - xa) / (xb - xa), y = f + Math.round(sag * Math.sin(Math.PI * t));
    every && (i + off) % every === every - 1 ? K.crumble(x, Math.min(xb, x + 4), y) : K.plank(x, Math.min(xb, x + 4), y);
  }
}
const P_ = (K, x, f, k, o) => K.prop(x, surf(K, x, f), k, o);

// 섬 윤곽 기록 (몸통을 지을 때 바위가 된 칸): 다 지은 뒤 그 안 빈 곳에 뒷벽을 깐다
let BODY = null, MARK = false;
const body = (K, x, y) => x >= 0 && y >= 0 && x < K.NX && y < K.NY && (BODY[y * K.NX + x] = 1);
// 일부러 뚫은 하늘 창 (아치 구멍): 뒷벽을 깔지 않는다
function skyHole(K, cx, cy, rx, ry) {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++)
    for (let x = Math.floor(cx - rx); x <= cx + rx; x++) ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1 && x >= 0 && y >= 0 && x < K.NX && y < K.NY && (BODY[y * K.NX + x] = 0);
}
function backfill(K) {
  const { NX, NY } = K, cov = new Uint8Array(NX * NY);
  for (const w of K.P.walls) {
    const x0 = Math.max(0, Math.floor(w.x0 / 8)), x1 = Math.min(NX, Math.ceil(w.x1 / 8)), y0 = Math.max(0, Math.floor(w.y0 / 8)), y1 = Math.min(NY, Math.ceil(w.y1 / 8));
    for (let y = y0; y < y1; y++) cov.fill(1, y * NX + x0, y * NX + x1);
  }
  // 줄마다 빈 칸 구간 → 위 줄과 같은 구간이면 이어 붙인다 (뒷벽 사각형 수를 줄인다)
  let open = new Map();
  const flush = (keep) => {
    for (const [k, r] of open) if (!keep.has(k)) K.wall(r.a, r.y0, r.b, r.y1, "rock");
  };
  for (let y = 1; y < NY - 1; y++) {
    const next = new Map();
    for (let x = 0; x < NX; ) {
      const i = y * NX + x;
      if (!BODY[i] || K.get(x, y) === 1 || cov[i]) { x++; continue; }
      const a = x;
      while (x < NX && BODY[y * NX + x] && K.get(x, y) !== 1 && !cov[y * NX + x]) x++;
      const k = a + ":" + x, r = open.get(k);
      next.set(k, r ? ((r.y1 = y + 1), r) : { a, b: x, y0: y, y1: y + 1 });
    }
    flush(next);
    open = next;
  }
  flush(new Map());
}

export function greenstep(K, o) {
  BODY = new Uint8Array(K.NX * K.NY);
  const rock0 = K.rock;
  K.rock = (x0, y0, x1, y1) => {
    rock0(x0, y0, x1, y1);
    if (MARK) for (let y = Math.max(0, y0 | 0); y < y1; y++) for (let x = Math.max(0, x0 | 0); x < x1; x++) body(K, x, y);
  };
  road(K);
  splitMesa(K), sheepfold(K), mill(K), hayBasket(K), ropeRest(K), underhang(K), hawkNeedle(K), cheeseCave(K), campfire(K);
  windArch(K), terraces(K), egg(K), workshop(K), cascade(K);
  felt(K), dyeVats(K), shrine(K), swing(K);
  eagleCrag(K), rafts(K), stoneCircle(K), causeway(K), windmillHill(K);
  apiary(K), tether(K), sprayCave(K);
  summit(K), beacon(K), kiteBluff(K), skyWell(K), stagger(K);
  rookery(K), bellCrag(K), observatory(K), cloudPen(K);
  links(K);
  backfill(K);
  K.rock = rock0;
}
greenstep.own = 1;

// ═══ 섬 길 (줄 1000): 좌우 출구를 섬 일곱과 다리·구름·바구니로 잇는다 ═══
function road(K) {
  const F = 1000;
  // 서쪽 나루: 배 창고 움
  nat(K, 0, 66, () => F, jag(PL([[0, 1048], [24, 1046], [50, 1034], [66, 1008]]), 1.4, 1), { flat: 1, fingers: 1 });
  room(K, 12, 1010, 48, 1020, "wood"), K.mat(10, 1008, 50, 1022, "wood");
  climb(K, 44, F, 1020, "ladder", "wood");
  P_(K, 20, 1020, "p_crates"), P_(K, 32, 1020, "p_rack");
  P_(K, 8, F, "p_flags", { s: 1 }), P_(K, 28, F, "p_font"), K.heal(24, 32, F - 4, F);
  K.tag(2, F - 14, 60, F, "rest", { safe: 1 });
  K.tag(12, 1010, 48, 1020, "treasure");
  K.struct("서쪽 나루", "거점·출구", 0, 986, 66, 1048);
  rope_bridge(K, 66, 98, F, 3, 3, 1);
  // 양 건너기 바위: 둥근 혹 + 양 쉼터 굴
  nat(K, 98, 172, jag(PL([[98, F], [112, 997], [150, 996], [172, F]]), 0.5, 2), jag(PL([[98, 1004], [118, 1028], [140, 1036], [160, 1024], [172, 1004]]), 1.4, 3), { sh: 2, roll: 0.5, fingers: 1 });
  room(K, 110, 1005, 158, 1015);
  climb(K, 150, 996, 1015, "ladder");
  P_(K, 120, 1015, "p_sheep"), P_(K, 134, 1015, "p_hay", { s: 1 }), P_(K, 126, 997, "p_cairn");
  K.tag(110, 1005, 146, 1015, "arena");
  K.struct("양 건너기 바위", "전투", 98, 990, 172, 1036);
  K.cloud(179, 193, F);
  // 장터 섬: 천막 둘·회복 샘 + 기둥 늘어선 지하 장터 (사다리와 내려가는 비탈)
  nat(K, 200, 330, () => F, jag(PL([[200, 1006], [226, 1034], [262, 1046], [300, 1036], [330, 1006]]), 1.5, 4), { flat: 1, fingers: 1 });
  room(K, 214, 1009, 318, 1022);
  for (const x of [236, 263, 291]) K.wall(x, 1009, x + 2, 1022, "stem");
  climb(K, 222, F, 1022, "ladder");
  K.ramp(318, F, 296, 1022, 7), K.wall(296, 1000, 318, 1022, "rock");
  P_(K, 226, 1022, "p_cheese"), P_(K, 250, 1022, "p_crates"), P_(K, 276, 1022, "p_urn"), P_(K, 286, 1022, "p_wool");
  P_(K, 244, F, "p_yurt", { sc: 1.6 }), P_(K, 282, F, "p_yurt", { v: 1, sc: 1.4 }), P_(K, 208, F, "p_flags"), P_(K, 262, F, "p_font"), K.heal(258, 266, F - 4, F);
  K.tag(206, F - 14, 318, F, "rest", { safe: 1 });
  K.tag(240, 1009, 294, 1022, "treasure");
  K.struct("장터 섬", "거점·보물고", 200, 986, 330, 1046);
  rope_bridge(K, 330, 376, F, 4, 4, 2);
  // 연못 섬: 물레방아 폭포가 떨어지는 연못 + 물에 잠긴 굴
  nat(K, 376, 466, () => F, jag(PL([[376, 1006], [398, 1030], [428, 1042], [452, 1028], [466, 1006]]), 1.3, 5), { flat: 1, fingers: 1 });
  K.air(396, 996, 446, 1012), K.water(396, 1000, 446, 1012);
  K.air(404, 1012, 432, 1022), K.water(404, 1012, 432, 1022);
  K.tag(406, 1012, 430, 1022, "treasure");
  P_(K, 386, F, "p_fern"), P_(K, 454, F, "p_flowers");
  K.struct("연못 섬", "보물고", 376, 990, 466, 1042);
  // 하늘 나룻 바구니
  K.ferry(466, 520, F, 6, 14);
  // 아치 바위: 윗길 밑으로 큰 아치, 두 다리에 방
  nat(K, 520, 640, () => F, jag(PL([[520, 1008], [530, 1040], [552, 1047], [604, 1047], [620, 1043], [640, 1008]]), 1.2, 6), { flat: 1, fingers: 1 });
  K.ell(580, 1048, 26, 36), skyHole(K, 580, 1048, 27, 37);
  room(K, 526, 1018, 550, 1028), climb(K, 530, F, 1028, "ladder"), K.air(550, 1022, 562, 1028);
  room(K, 612, 1016, 636, 1030), climb(K, 632, F, 1030, "rope");
  K.vine(569, 572, 1014, 1040), K.vine(589, 592, 1013, 1032);
  P_(K, 536, 1028, "p_urn"), P_(K, 618, 1030, "p_loom", { s: 2 });
  K.tag(526, 1018, 550, 1028, "treasure"), K.tag(612, 1016, 636, 1030, "arena"), K.tag(524, F - 12, 636, F, "arena");
  K.struct("아치 바위", "전투·보물고", 520, 990, 640, 1048);
  K.rock(650, F, 660, F + 3), K.cloud(664, 672, F);
  // 풍차 섬: 언덕 위 풍차, 속엔 맷돌 방 (다락)
  nat(K, 676, 790, jag(PL([[676, F], [700, 996], [730, 990], [760, 995], [790, F]]), 0.4, 7), jag(PL([[676, 1006], [700, 1036], [734, 1046], [770, 1030], [790, 1006]]), 1.4, 8), { sh: 2, roll: 0.5, fingers: 1 });
  room(K, 690, 1004, 772, 1016, "wood");
  K.plank(742, 772, 1010), K.ladder(744, 1010, 1016);
  climb(K, 704, 996, 1016, "ladder"), climb(K, 762, 995, 1016, "rope");
  P_(K, 730, 990, "p_windmill", { sc: 1.2 }), P_(K, 714, 1016, "p_hay", { s: 1 }), P_(K, 726, 1016, "p_crates"), P_(K, 758, 1010, "p_hay");
  K.tag(690, 1004, 742, 1016, "arena"), K.tag(746, 1002, 772, 1010, "treasure");
  K.struct("풍차 섬", "전투·보물고", 676, 980, 790, 1046);
  rope_bridge(K, 790, 822, F, 1, 3, 0);
  // 동쪽 나루: 통행세 집 · 디딤돌 · 두 층 창고 (출구)
  nat(K, 822, 900, () => F, jag(PL([[822, 1006], [840, 1030], [870, 1040], [900, 1008]]), 1.3, 9), { flat: 1, fingers: 1 });
  room(K, 832, 1006, 890, 1016, "wood"), climb(K, 884, F, 1016, "ladder", "wood");
  P_(K, 846, 1016, "p_shelf"), P_(K, 866, 1016, "p_crates");
  K.tag(832, 1006, 878, 1016, "arena");
  K.rock(906, F, 914, F + 4), K.rock(920, F, 926, F + 3);
  nat(K, 930, 1024, () => F, jag(PL([[930, 1006], [950, 1034], [990, 1048], [1024, 1050]]), 1.2, 10), { flat: 1, fingers: 1 });
  room(K, 944, 1006, 1010, 1016, "wood"), climb(K, 952, F, 1016, "ladder", "wood");
  room(K, 950, 1024, 1004, 1034, "wood"), climb(K, 996, 1016, 1034, "rope", "wood");
  P_(K, 970, 1016, "p_crates"), P_(K, 984, 1016, "p_rack"), P_(K, 964, 1034, "p_crates"), P_(K, 980, 1034, "p_urn");
  K.tag(944, 1006, 990, 1016, "arena"), K.tag(950, 1024, 990, 1034, "treasure");
  K.tag(966, F - 14, 1020, F, "rest", { safe: 1 });
  K.struct("동쪽 나루", "거점·출구", 822, 986, 1024, 1050);
}

// ═══ 라 줄 ═══
// 갈라진 협곡 고원: 가운데를 협곡이 쪼갠다. 서쪽은 양치기 집(두 층·움), 협곡 벽엔 벼랑 집, 동쪽은 곡식 사일로와 다락
function splitMesa(K) {
  nat(K, 20, 200, jag(PL([[20, 812], [60, 808], [100, 810], [124, 810], [170, 808], [200, 814]]), 0.5, 11), jag(PL([[20, 830], [34, 888], [64, 940], [104, 954], [150, 944], [184, 900], [200, 842]]), 1.5, 12));
  for (let y = 806; y < 900; y++) K.air(Math.round(100 + Math.sin(y * 0.21) * 1.4), y, Math.round(118 + Math.sin(y * 0.17 + 1) * 1.4), y + 1);
  K.wall(99, 814, 120, 900, "rock");
  K.water(100, 892, 118, 900);
  K.plank(100, 106, 810), K.crumble(106, 112, 810), K.plank(112, 119, 810);
  K.rope(109, 807, 892);
  // 서쪽 집
  room(K, 30, 822, 74, 836, "wood"), climb(K, 40, 808, 836, "ladder", "wood");
  room(K, 84, 822, 100, 830), K.air(74, 824, 84, 830), K.plank(100, 106, 830);
  room(K, 34, 856, 72, 868, "wood"), climb(K, 66, 836, 868, "ladder", "wood");
  room(K, 78, 858, 100, 868), K.air(72, 860, 78, 868), K.plank(100, 106, 868);
  room(K, 86, 880, 100, 888), K.plank(100, 106, 888);
  room(K, 46, 896, 96, 906), climb(K, 52, 868, 906, "rope"), K.air(96, 898, 100, 906);
  dropTo(K, 60, 906, "rope");
  P_(K, 44, 836, "p_loom"), P_(K, 60, 836, "p_wool"), P_(K, 48, 868, "p_cheese"), P_(K, 58, 868, "p_shelf"), P_(K, 70, 906, "p_crates"), P_(K, 84, 906, "p_urn");
  P_(K, 90, 830, "p_nest"), P_(K, 92, 868, "p_urn"), P_(K, 94, 888, "p_bones");
  // 동쪽: 사일로 (협곡 벽 창으로 드나든다) + 곡식 다락
  room(K, 118, 832, 132, 842), K.plank(112, 118, 842);
  room(K, 132, 848, 176, 900, "wood");
  K.air(118, 862, 132, 870), K.plank(112, 118, 870), K.air(118, 890, 132, 900);
  K.plank(132, 146, 888), K.plank(160, 176, 876), K.plank(140, 156, 862);
  K.ladder(172, 848, 900);
  room(K, 140, 824, 190, 836, "wood"), K.air(149, 836, 152, 848), K.plank(149, 152, 836), K.ladder(150, 836, 862);
  climb(K, 184, 808, 836, "ladder", "wood");
  room(K, 140, 910, 176, 922), climb(K, 166, 900, 922, "ladder");
  P_(K, 150, 922, "p_crates"), K.tag(140, 910, 176, 922, "treasure");
  P_(K, 150, 900, "p_hay", { s: 1 }), P_(K, 140, 888, "p_hay"), P_(K, 168, 876, "p_crates"), P_(K, 160, 836, "p_hay"), P_(K, 176, 836, "p_crates");
  P_(K, 60, 808, "p_sheep"), P_(K, 76, 809, "p_fence"), P_(K, 150, 808, "p_flags"), P_(K, 130, 809, "p_cairn");
  K.tag(30, 822, 74, 836, "arena"), K.tag(34, 856, 72, 868, "arena"), K.tag(46, 896, 96, 906, "arena");
  K.tag(78, 858, 100, 868, "treasure"), K.tag(132, 852, 176, 900, "arena"), K.tag(140, 824, 190, 836, "treasure");
  K.tag(28, 796, 96, 808, "arena");
  K.struct("갈라진 협곡 고원", "전투·보물고·오르는 길", 20, 796, 200, 954);
}
// 양 우리와 토끼 굴: 윗면은 돌담 우리, 속은 가지 치는 굴과 굴방 (맨 아래 굴방에서 장터 섬으로)
function sheepfold(K) {
  nat(K, 230, 400, jag(PL([[230, 868], [250, 862], [380, 860], [400, 866]]), 0.5, 13), jag(PL([[230, 874], [244, 920], [262, 950], [280, 944], [300, 936], [320, 952], [340, 966], [362, 950], [388, 910], [400, 880]]), 1.3, 14));
  for (const x of [268, 304, 344]) K.rock(x, 857, x + 2, 862);
  K.wiggle([[390, 858], [366, 882], [344, 882]], 6, 0, "rock");
  K.ell(330, 876, 15, 7), K.rock(313, 882, 347, 890), K.wall(315, 869, 345, 882, "rock");
  K.wiggle([[318, 882], [290, 900], [262, 902]], 6, 0.6, "rock");
  K.ell(250, 896, 14, 8), K.rock(234, 902, 266, 910), K.wall(237, 889, 263, 902, "rock");
  K.wiggle([[262, 902], [292, 930], [310, 932]], 6, 0, "rock");
  K.ell(326, 925, 18, 9), K.rock(306, 932, 346, 942), K.wall(309, 917, 343, 932, "rock");
  K.wiggle([[318, 882], [300, 872], [280, 872]], 6, 0, "rock");
  climb(K, 282, 861, 872, "vine");
  dropTo(K, 322, 932, "ladder");
  P_(K, 326, 882, "p_nest"), P_(K, 246, 902, "p_hay"), P_(K, 256, 902, "p_crates"), P_(K, 334, 932, "p_bones"), P_(K, 314, 932, "p_rubble");
  for (const [x, k] of [[244, "p_sheep"], [286, "p_sheep"], [292, "p_fence"], [322, "p_sheep"], [360, "p_hay"], [376, "p_fence"]]) P_(K, x, 861, k, { v: x & 1 });
  K.tag(316, 869, 344, 882, "arena"), K.tag(238, 889, 262, 902, "treasure"), K.tag(310, 917, 342, 932, "arena"), K.tag(240, 846, 380, 860, "arena");
  K.struct("양 우리와 토끼 굴", "전투·보물고", 230, 846, 400, 962);
}
// 물레방아 섬: 윗면 샘에서 폭포가 섬을 꿰뚫어 물레방 · 수문 움을 지나 연못 섬까지 (거꾸로 헤엄쳐 오른다)
function mill(K) {
  nat(K, 424, 590, jag(PL([[424, 806], [436, 800], [560, 798], [590, 806]]), 0.5, 15), jag(PL([[424, 810], [430, 870], [440, 916], [462, 936], [506, 950], [540, 944], [566, 922], [584, 898], [590, 830]]), 1.2, 16));
  K.air(434, 796, 448, 804), K.water(434, 799, 448, 804);
  K.fallw(438, 804, 444, 1000);
  K.wall(436, 804, 446, 930, "rock");
  room(K, 444, 850, 530, 880, "wood");
  K.plank(494, 528, 864), K.ladder(498, 864, 880);
  room(K, 470, 822, 576, 836, "wood"), climb(K, 566, 799, 836, "ladder", "wood");
  K.air(513, 836, 516, 850), K.plank(513, 516, 836), K.ladder(514, 836, 864);
  room(K, 540, 862, 584, 874), K.air(530, 866, 540, 874), climb(K, 572, 836, 862, "rope");
  room(K, 446, 900, 506, 912), K.air(444, 902, 446, 912), climb(K, 500, 880, 900, "rope");
  K.air(450, 912, 500, 914), K.water(450, 908, 500, 914, "curL");
  room(K, 520, 888, 566, 900), climb(K, 556, 874, 900, "ladder");
  P_(K, 530, 900, "p_urn"), K.tag(520, 888, 552, 900, "arena");
  P_(K, 455, 880, "p_wheel", { sc: 1.3 }), P_(K, 476, 880, "p_hay", { s: 1 }), P_(K, 520, 864, "p_hay"), P_(K, 506, 864, "p_crates");
  P_(K, 486, 836, "p_loom", { s: 1 }), P_(K, 530, 836, "p_cheese"), P_(K, 548, 836, "p_shelf");
  P_(K, 552, 874, "p_crates"), P_(K, 566, 874, "p_urn"), P_(K, 470, 912, "p_rubble");
  P_(K, 470, 799, "p_hive"), P_(K, 490, 799, "p_flowers"), P_(K, 512, 798, "p_hive", { v: 1 }), P_(K, 540, 798, "p_sheep");
  K.tag(450, 850, 492, 880, "arena"), K.tag(470, 822, 556, 836, "arena"), K.tag(540, 862, 584, 874, "treasure"), K.tag(452, 900, 500, 912, "treasure"), K.tag(456, 786, 586, 798, "arena");
  K.struct("물레방아 섬", "전투·보물고·폭포 길", 424, 786, 590, 946);
}
// 거꾸로 매달린 마을: 두꺼운 판 섬 밑에 나무 집들이 매달려 있다 (판자 길·밧줄 광주리·망대)
function underhang(K) {
  nat(K, 610, 810, jag(PL([[610, 796], [640, 790], [780, 790], [810, 796]]), 0.4, 17), jag(PL([[610, 802], [640, 814], [700, 818], [760, 816], [810, 804]]), 1.0, 18));
  const house = (x0, x1, y0, y1) => (K.rock(x0, 806, x1, y1), K.mat(x0, 812, x1, y1, "wood"));
  // 집 1: 한 칸
  house(626, 660, 820, 848), room(K, 628, 820, 658, 846, "wood"), climb(K, 644, 790, 846, "ladder", "wood"), K.air(658, 838, 660, 846);
  dropTo(K, 632, 846, "rope");
  K.plank(660, 676, 846);
  // 집 2: 두 층
  house(676, 716, 820, 880), room(K, 678, 820, 714, 846, "wood"), room(K, 678, 850, 714, 878, "wood");
  climb(K, 708, 846, 878, "ladder", "wood"), K.air(676, 838, 678, 846), K.air(714, 870, 716, 878);
  rope_bridge(K, 716, 732, 878, 2, 3, 1);
  // 집 3: 높은 방 + 다락, 밑으로 늘어진 밧줄 (광주리 쉼터를 지나 풍차 섬까지)
  house(732, 770, 830, 882), room(K, 734, 830, 768, 878, "wood"), K.air(732, 870, 734, 878);
  K.plank(750, 768, 848), K.ladder(752, 848, 878);
  K.air(759, 878, 762, 882), K.plank(759, 762, 878), K.rope(760, 875, 994);
  K.plank(744, 757, 906);
  // 집 4: 망대
  K.air(768, 840, 770, 848), K.plank(770, 782, 848);
  house(782, 806, 822, 850), room(K, 784, 822, 804, 848, "wood"), K.air(782, 840, 784, 848), climb(K, 796, 791, 848, "rope", "wood");
  dropTo(K, 790, 848, "rope");
  P_(K, 636, 846, "p_shelf"), P_(K, 650, 846, "p_cheese"), P_(K, 690, 846, "p_loom"), P_(K, 690, 878, "p_crates"), P_(K, 702, 878, "p_wool");
  P_(K, 742, 878, "p_rack"), P_(K, 760, 848, "p_crates"), P_(K, 792, 848, "p_urn"), P_(K, 750, 906, "p_nest");
  P_(K, 622, 790, "p_flags"), P_(K, 660, 790, "p_wool"), P_(K, 700, 790, "p_yurt", { sc: 1.5 }), P_(K, 730, 790, "p_rack"), P_(K, 770, 790, "p_flags", { s: 1 });
  K.tag(628, 820, 658, 846, "arena"), K.tag(678, 820, 714, 846, "rest"), K.tag(678, 850, 714, 878, "arena"), K.tag(734, 850, 768, 878, "arena");
  K.tag(784, 822, 804, 848, "treasure"), K.tag(744, 896, 757, 906, "treasure"), K.tag(626, 778, 800, 790, "arena");
  K.struct("거꾸로 매달린 마을", "전투·보물고·쉼터", 610, 778, 810, 906);
}
// 매 둥지 첨탑: 가는 바늘 바위, 속은 아래가 뚫린 바람 굴뚝 (섬 길에서 타고 꼭대기까지), 굴뚝 옆 벽에 매잡이 방
function hawkNeedle(K) {
  MARK = true;
  for (let y = 780; y < 968; y++) {
    const hw = 30 - (y - 780) * 0.12 + Math.sin(y * 0.2) * 1.2, cx = 865 + Math.sin(y * 0.05) * 2.5;
    K.rock(Math.round(cx - hw), y, Math.round(cx + hw), y + 1);
  }
  K.air(858, 776, 872, 968), K.wall(858, 786, 872, 962, "rock");
  MARK = false;
  K.wind(858, 872, 774, 1000, 260);
  room(K, 842, 800, 858, 812), K.air(838, 804, 842, 812);
  room(K, 872, 836, 886, 848), K.air(886, 840, 890, 848);
  room(K, 850, 872, 858, 884);
  P_(K, 846, 780, "p_nest", { sc: 1.5 }), P_(K, 884, 780, "p_flags"), P_(K, 848, 812, "p_rack"), P_(K, 878, 848, "p_nest");
  K.tag(842, 800, 858, 812, "treasure"), K.tag(872, 836, 886, 848, "arena"), K.tag(836, 766, 894, 780, "vista");
  K.struct("매 둥지 첨탑", "전망·보물고·바람 길", 832, 766, 900, 968);
}
// 치즈 동굴 섬: 목초지 아래 둥근 치즈 동굴 (선반 두 단), 건초 미끄럼 구멍, 배 밑 덩굴
function cheeseCave(K) {
  nat(K, 920, 1016, jag(PL([[920, 860], [940, 856], [1000, 856], [1016, 862]]), 0.4, 19), jag(PL([[920, 866], [924, 898], [938, 928], [968, 946], [996, 932], [1010, 902], [1016, 866]]), 1.0, 20));
  K.ell(968, 888, 30, 11), K.rock(936, 896, 1000, 906), K.wall(940, 878, 996, 896, "rock");
  K.plank(944, 960, 886), K.plank(978, 994, 884);
  climb(K, 990, 856, 896, "vine");
  dropTo(K, 970, 896, "vine");
  P_(K, 950, 896, "p_cheese"), P_(K, 986, 896, "p_cheese", { v: 1 }), P_(K, 952, 886, "p_urn"), P_(K, 984, 884, "p_cheese");
  P_(K, 932, 857, "p_sheep"), P_(K, 950, 856, "p_sheep", { v: 1 }), P_(K, 972, 856, "p_fence"), P_(K, 1004, 856, "p_hay");
  K.tag(944, 878, 996, 896, "treasure"), K.tag(926, 842, 1010, 856, "arena");
  K.struct("치즈 동굴 섬", "전투·보물고", 920, 842, 1016, 944);
}

// 건초 광주리 섬: 매달린 마을 밑 작은 바위 — 건초 광, 아치 바위로 밧줄
function hayBasket(K) {
  nat(K, 588, 664, jag(PL([[588, 932], [600, 928], [652, 928], [664, 934]]), 0.3, 82), jag(PL([[588, 938], [604, 956], [630, 968], [652, 956], [664, 938]]), 1.0, 83));
  room(K, 600, 934, 652, 946, "wood"), climb(K, 612, 928, 946, "ladder", "wood");
  dropTo(K, 626, 946, "rope");
  P_(K, 636, 946, "p_hay", { s: 1 }), P_(K, 646, 946, "p_hay"), P_(K, 640, 928, "p_hay");
  K.tag(600, 934, 652, 946, "treasure");
  K.struct("건초 광주리 섬", "보물고", 588, 914, 664, 968);
}
// 밧줄 쉼터 바위: 망대 밑에 매달린 듯 뜬 바위 — 밧줄꾼 쉼터
function ropeRest(K) {
  nat(K, 770, 826, jag(PL([[770, 934], [780, 930], [818, 930], [826, 936]]), 0.3, 84), jag(PL([[770, 940], [786, 958], [804, 964], [826, 940]]), 1.0, 85));
  room(K, 780, 936, 816, 948, "wood"), climb(K, 808, 930, 948, "ladder", "wood");
  dropTo(K, 784, 948, "rope");
  P_(K, 792, 948, "p_rack"), P_(K, 800, 930, "p_flags");
  K.tag(780, 936, 816, 948, "rest");
  K.struct("밧줄 쉼터 바위", "쉼터", 770, 916, 826, 964);
}
// 저녁 모닥불 바위: 양치기들이 모이는 모닥불 방 (천장 연기 구멍)
function campfire(K) {
  nat(K, 930, 1012, jag(PL([[930, 764], [944, 760], [1000, 760], [1012, 766]]), 0.3, 86), jag(PL([[930, 770], [944, 790], [972, 802], [1000, 790], [1012, 770]]), 1.0, 87));
  room(K, 942, 768, 1000, 782), K.air(968, 760, 972, 768), climb(K, 994, 760, 782, "ladder");
  dropTo(K, 1004, 782, "rope");
  P_(K, 970, 782, "p_brazier", { sc: 1.3 }), P_(K, 950, 782, "p_wool"), P_(K, 986, 782, "p_cheese"), P_(K, 956, 760, "p_sheep");
  K.tag(942, 768, 1000, 782, "arena");
  K.struct("저녁 모닥불 바위", "전투", 930, 746, 1012, 802);
}

// ═══ 다 줄 ═══
// 바람 아치: 아치 구멍으로 동쪽 바람이 분다 — 서쪽 다리 맨 아래 방에서 나서면 아치·동쪽 다리 방을 지나 계단밭까지 날려 간다
function windArch(K) {
  nat(K, 10, 180, jag(PL([[10, 606], [40, 600], [150, 600], [180, 606]]), 0.4, 21), jag(PL([[10, 640], [22, 710], [48, 742], [66, 738], [120, 730], [150, 724], [172, 690], [180, 640]]), 1.4, 22));
  // 아치 구멍 (섬 밑까지만 판다 — 아래 협곡 고원을 건드리지 않게)
  for (let y = 642; y < 748; y++) {
    const hw = 28 * Math.sqrt(Math.max(0, 1 - ((y - 748) / 106) ** 2));
    hw > 0 && (K.air(Math.round(93 - hw), y, Math.round(93 + hw), y + 1), skyHole(K, 93, y, hw + 1, 0.6));
  }
  room(K, 20, 618, 58, 630, "wood"), climb(K, 30, 600, 630, "ladder", "wood");
  room(K, 16, 648, 56, 660), climb(K, 52, 630, 660, "ladder");
  room(K, 22, 678, 64, 690), climb(K, 26, 660, 690, "rope"), K.air(64, 682, 72, 690);
  dropTo(K, 40, 690, "vine");
  room(K, 120, 676, 166, 690), K.air(114, 682, 122, 690), K.air(166, 682, 184, 690);
  room(K, 126, 646, 168, 660), climb(K, 160, 660, 690, "ladder"), climb(K, 140, 600, 660, "vine");
  K.windH(66, 224, 673, 690, 1, 330, 40);
  P_(K, 30, 630, "p_loom", { s: 3 }), P_(K, 44, 630, "p_flags"), P_(K, 24, 660, "p_crates"), P_(K, 40, 660, "p_wool"), P_(K, 140, 660, "p_rack");
  P_(K, 40, 600, "p_flags", { s: 2 }), P_(K, 70, 600, "p_flags", { s: 1 }), P_(K, 110, 600, "p_cairn"), P_(K, 160, 600, "p_flags");
  K.tag(20, 618, 58, 630, "arena"), K.tag(16, 648, 56, 660, "treasure"), K.tag(22, 678, 60, 690, "arena"), K.tag(126, 646, 168, 660, "arena"), K.tag(30, 588, 160, 600, "arena");
  K.struct("바람 아치", "전투·보물고·바람 길", 10, 588, 180, 742);
}
// 계단밭: 동쪽으로 내려가는 네 단, 단마다 그 밑에 움 (포도주 움·치즈 굴·우물 움), 아래 물 저장고와 뿌리 움
function terraces(K) {
  const top = (x) => (x < 250 ? 572 : x < 292 ? 586 : x < 336 ? 602 : 618) + Math.round(Math.sin(x * 0.4) * 0.4);
  nat(K, 210, 380, top, jag(PL([[210, 640], [216, 692], [236, 714], [256, 744], [290, 762], [320, 772], [344, 756], [366, 724], [376, 690], [380, 640]]), 1.2, 23));
  room(K, 216, 577, 250, 586);
  K.ell(272, 596, 19, 6), K.rock(252, 602, 292, 606), K.air(286, 593, 292, 602), K.wall(256, 591, 290, 602, "rock");
  room(K, 298, 607, 336, 618);
  climb(K, 312, 618, 690, "rope");
  room(K, 244, 670, 350, 690);
  for (const x of [262, 288, 330]) K.wall(x, 670, x + 2, 690, "stem");
  K.air(270, 690, 320, 696), K.water(270, 688, 320, 696);
  K.air(212, 682, 244, 690), K.rock(206, 690, 246, 693);
  room(K, 276, 722, 340, 732), climb(K, 336, 690, 732, "ladder");
  room(K, 218, 630, 262, 646), climb(K, 230, 586, 646, "ladder"), climb(K, 254, 646, 690, "ladder");
  room(K, 340, 640, 372, 654, "wood"), climb(K, 366, 618, 654, "ladder", "wood"), climb(K, 346, 654, 690, "rope");
  P_(K, 226, 646, "p_hay", { s: 1 }), P_(K, 244, 646, "p_wheel", { s: 0, sc: 0.8 }), P_(K, 356, 654, "p_hay"), P_(K, 352, 654, "p_crates");
  K.tag(218, 630, 262, 646, "arena"), K.tag(340, 640, 372, 654, "treasure");
  dropTo(K, 296, 732, "rope");
  P_(K, 224, 586, "p_crates"), P_(K, 236, 586, "p_urn"), P_(K, 266, 602, "p_cheese"), P_(K, 280, 602, "p_cheese", { v: 1 }), P_(K, 322, 618, "p_shelf");
  P_(K, 254, 690, "p_urn"), P_(K, 342, 690, "p_crates"), P_(K, 290, 732, "p_hay"), P_(K, 318, 732, "p_crates");
  P_(K, 222, 572, "p_hive"), P_(K, 238, 572, "p_hive", { v: 1 }), P_(K, 262, 586, "p_hay", { s: 1 }), P_(K, 280, 586, "p_hay"), P_(K, 304, 602, "p_flowers"), P_(K, 326, 602, "p_flags"), P_(K, 352, 618, "p_fence"), P_(K, 368, 618, "p_sheep");
  K.tag(216, 577, 250, 586, "treasure"), K.tag(254, 591, 290, 602, "arena"), K.tag(298, 607, 336, 618, "arena");
  K.tag(244, 670, 350, 690, "rest"), K.tag(276, 722, 340, 732, "arena"), K.tag(250, 574, 292, 586, "arena"), K.tag(336, 606, 378, 618, "arena");
  K.struct("계단밭", "전투·보물고·쉼터", 210, 560, 380, 762);
}
// 알 섬: 속이 빈 알 — 숫양 우두머리 방. 안벽 돌 턱 여섯, 천장에 매달린 가운데 받침 (위 구멍 덩굴 · 바닥 구멍 밧줄)
function egg(K) {
  nat(K, 408, 562, PL([[408, 646], [416, 606], [434, 580], [462, 564], [496, 558], [528, 566], [548, 590], [562, 636]]), PL([[408, 656], [418, 694], [442, 718], [478, 730], [516, 726], [546, 700], [562, 652]]), { seed: 501, sh: 3, roll: 1.2, warp: 6, rough: 2.6, fingers: 4 });
  hollow(K, 474, 652, 52, 54, 77, 0.14), hollow(K, 500, 624, 44, 48, 78, 0.16), hollow(K, 456, 616, 26, 30, 79, 0.18);
  K.rock(436, 700, 534, 714);
  // 뒷벽: 속 빈 곳만 (줄마다 공기 구간을 따라)
  for (let y = 570; y < 702; y++) {
    let x = 418;
    while (x < 556) {
      if (K.get(x, y) !== -1) { x++; continue; }
      const a = x;
      while (x < 556 && K.get(x, y) === -1) x++;
      K.get(a - 1, y) === 1 && K.get(x, y) === 1 && K.wall(a, y, x, y + 1, "rock");
    }
  }
  K.rock(434, 684, 452, 686), K.rock(518, 684, 536, 686);
  K.rock(428, 664, 446, 666), K.rock(524, 664, 542, 666);
  K.rock(424, 640, 458, 642), K.rock(512, 640, 534, 642);
  K.rock(466, 604, 504, 607);
  K.rope(462, 604, 700), K.rope(508, 604, 700);
  K.air(482, 556, 488, 604), K.wall(482, 556, 488, 604, "rock"), K.vine(482, 488, 554, 604);
  K.air(408, 632, 436, 640), K.air(542, 656, 562, 664);
  dropTo(K, 485, 700, "rope");
  P_(K, 446, 700, "p_brazier"), P_(K, 524, 700, "p_brazier"), P_(K, 470, 700, "p_bones"), P_(K, 500, 700, "p_skulls"), P_(K, 476, 604, "p_nest"), P_(K, 444, 640, "p_flags");
  P_(K, 470, 562, "p_cairn"), P_(K, 500, 562, "p_bones");
  K.tag(436, 620, 534, 700, "arena", { big: 1, elite: 1 }), K.tag(466, 592, 504, 604, "treasure");
  K.struct("알 섬", "정예·보물고", 410, 556, 560, 724);
}
// 베틀 공방: 쐐기 모양 섬, 층마다 폭이 다르다 — 베틀방 →(밧줄) 염색방 →(실 나르는 승강기) 창고 →(비탈) 금고
function workshop(K) {
  nat(K, 590, 770, jag(PL([[590, 600], [680, 592], [770, 598]]), 0.4, 24), jag(PL([[590, 640], [612, 710], [648, 770], [700, 764], [740, 704], [770, 624]]), 1.4, 25));
  room(K, 604, 610, 756, 624, "wood"), climb(K, 700, 592, 624, "ladder", "wood");
  room(K, 616, 648, 744, 660);
  climb(K, 620, 624, 660, "rope");
  K.air(650, 660, 662, 664), K.water(650, 660, 662, 664), K.air(690, 660, 702, 664), K.water(690, 660, 702, 664);
  room(K, 632, 688, 724, 700);
  K.air(710, 650, 720, 700), K.wall(710, 650, 720, 700, "wood"), K.lift(711, 719, 660, 700, 650);
  room(K, 652, 726, 702, 738);
  K.ramp(634, 700, 672, 738, 7), K.wall(632, 693, 674, 738, "rock");
  dropTo(K, 690, 738, "rope");
  K.air(756, 616, 772, 624), K.rock(770, 624, 780, 626);
  K.air(590, 652, 616, 660);
  P_(K, 630, 624, "p_loom"), P_(K, 676, 624, "p_loom", { s: 1 }), P_(K, 724, 624, "p_loom", { s: 2 }), P_(K, 746, 624, "p_wool");
  P_(K, 630, 660, "p_shelf"), P_(K, 676, 660, "p_urn"), P_(K, 720, 660, "p_crates");
  P_(K, 650, 700, "p_crates"), P_(K, 690, 700, "p_wool"), P_(K, 670, 738, "p_urn");
  P_(K, 620, 597, "p_rack"), P_(K, 650, 595, "p_wool"), P_(K, 730, 594, "p_flags");
  K.tag(604, 610, 756, 624, "arena"), K.tag(616, 648, 744, 660, "arena"), K.tag(640, 688, 724, 700, "rest"), K.tag(652, 726, 702, 738, "treasure"), K.tag(600, 580, 760, 592, "arena");
  K.struct("베틀 공방", "전투·보물고", 590, 580, 770, 770);
}
// 폭포 계단 군도: 세 섬을 폭포가 차례로 타고 내린다 (헤엄쳐 거슬러 오른다), 폭포 뒤엔 금 간 벽 너머 방
function cascade(K) {
  // 아래 섬
  nat(K, 792, 866, jag(PL([[792, 746], [800, 742], [852, 742], [866, 746]]), 0.4, 26), jag(PL([[792, 752], [806, 776], [826, 786], [850, 772], [866, 752]]), 1.2, 27));
  K.air(852, 738, 866, 748), K.water(852, 742, 866, 748);
  K.fallw(786, 744, 792, 790);
  room(K, 804, 752, 842, 764), climb(K, 834, 742, 764, "ladder");
  K.crack(792, 756, 804, 764);
  // 가운데 섬
  nat(K, 866, 940, jag(PL([[866, 706], [876, 702], [930, 702], [940, 706]]), 0.4, 28), jag(PL([[866, 712], [880, 738], [900, 748], [924, 732], [940, 708]]), 1.2, 29));
  K.air(924, 698, 940, 708), K.water(924, 702, 940, 708);
  K.fallw(860, 704, 866, 742);
  room(K, 874, 712, 916, 724), climb(K, 880, 702, 724, "ladder");
  room(K, 884, 728, 912, 738), climb(K, 904, 724, 738, "rope");
  K.crack(866, 716, 874, 724);
  // 위 섬 (샘)
  nat(K, 940, 1014, jag(PL([[940, 656], [952, 652], [1004, 652], [1014, 658]]), 0.4, 30), jag(PL([[940, 662], [952, 690], [976, 704], [1000, 690], [1014, 662]]), 1.2, 31));
  K.air(944, 648, 958, 658), K.water(944, 652, 958, 658);
  K.fallw(934, 654, 940, 702);
  room(K, 948, 664, 1002, 678), K.plank(982, 1000, 670), K.ladder(984, 670, 678), climb(K, 970, 652, 678, "ladder");
  room(K, 956, 684, 990, 694), climb(K, 962, 678, 694, "rope");
  dropTo(K, 976, 694, "rope");
  K.crack(940, 670, 948, 678);
  P_(K, 818, 764, "p_urn"), P_(K, 828, 764, "p_crates"), P_(K, 896, 724, "p_shelf"), P_(K, 896, 738, "p_urn"), P_(K, 960, 678, "p_wool"), P_(K, 992, 670, "p_crates"), P_(K, 974, 694, "p_cheese");
  P_(K, 812, 742, "p_fern"), P_(K, 900, 702, "p_flowers"), P_(K, 980, 652, "p_flowers"), P_(K, 1000, 652, "p_fern");
  K.tag(796, 752, 812, 764, "treasure"), K.tag(816, 752, 842, 764, "arena"), K.tag(868, 712, 894, 724, "treasure"), K.tag(884, 728, 912, 738, "arena");
  K.tag(942, 664, 966, 678, "treasure"), K.tag(966, 664, 1002, 678, "arena"), K.tag(956, 684, 990, 694, "rest");
  K.struct("폭포 계단 군도", "전투·보물고·폭포 길", 786, 640, 1016, 790);
}

// ═══ 나 줄 ═══
// 독수리 바위: 깊은 용골, 속은 위아래로 엇갈린 굴방 다섯 (밧줄·덩굴로 이어 내려간다), 용골 끝에서 바람 아치 윗면으로
function eagleCrag(K) {
  nat(K, 16, 150, jag(PL([[16, 334], [52, 318], [96, 320], [130, 328], [150, 340]]), 0.6, 32), jag(PL([[16, 352], [28, 410], [50, 470], [76, 520], [90, 532], [104, 500], [126, 430], [150, 356]]), 1.6, 33));
  const cav = (cx, cy, rx, ry, x0, x1, f) => (K.ell(cx, cy, rx, ry, -1, 0.06), K.rock(x0, f, x1, f + 5), K.wall(cx - rx + 2, cy - ry + 1, cx + rx - 2, f, "rock"));
  cav(70, 344, 28, 9, 42, 100, 352);
  cav(98, 382, 24, 11, 74, 124, 390);
  cav(60, 420, 24, 11, 36, 86, 428);
  cav(86, 458, 20, 10, 66, 106, 466);
  cav(81, 498, 11, 9, 70, 94, 506);
  climb(K, 56, 318, 352, "vine"), climb(K, 92, 352, 390, "rope"), climb(K, 78, 390, 428, "vine"), climb(K, 76, 428, 466, "rope"), climb(K, 84, 466, 506, "ladder");
  dropTo(K, 82, 506, "vine");
  P_(K, 40, 318, "p_nest", { sc: 1.6 }), P_(K, 110, 322, "p_flags"), P_(K, 70, 352, "p_bones"), P_(K, 108, 390, "p_nest"), P_(K, 48, 428, "p_rubble"), P_(K, 96, 466, "p_bones");
  K.tag(46, 336, 96, 352, "arena"), K.tag(76, 372, 120, 390, "treasure"), K.tag(40, 410, 84, 428, "arena"), K.tag(68, 449, 104, 466, "arena"), K.tag(22, 304, 140, 318, "vista");
  K.struct("독수리 바위", "전투·보물고·전망", 16, 304, 150, 532);
}
// 유목 천막 뗏목: 크기·높이가 다른 작은 뗏목 섬 넷 (천막·움), 판자 디딤으로 잇는다
function rafts(K) {
  nat(K, 172, 212, jag(() => 414, 0.3, 34), jag(PL([[172, 420], [190, 438], [212, 420]]), 1, 35));
  room(K, 180, 420, 204, 430), climb(K, 200, 414, 430, "ladder");
  dropTo(K, 186, 430, "rope");
  nat(K, 222, 262, jag(() => 400, 0.3, 36), jag(PL([[222, 406], [240, 428], [262, 406]]), 1, 37));
  room(K, 230, 406, 254, 414), climb(K, 250, 400, 414, "rope");
  nat(K, 272, 330, jag(() => 416, 0.3, 38), jag(PL([[272, 422], [290, 448], [312, 452], [330, 422]]), 1, 39));
  room(K, 280, 422, 322, 434, "wood"), climb(K, 316, 416, 434, "ladder", "wood");
  room(K, 290, 438, 314, 446), climb(K, 296, 434, 446, "rope");
  dropTo(K, 304, 446, "rope");
  nat(K, 340, 382, jag(() => 402, 0.3, 40), jag(PL([[340, 408], [360, 430], [382, 408]]), 1, 41));
  room(K, 348, 408, 368, 418), climb(K, 352, 402, 418, "ladder");
  dropTo(K, 362, 418, "rope");
  K.plank(212, 217, 410), K.plank(217, 222, 405);
  K.plank(262, 267, 405), K.plank(267, 272, 411);
  K.plank(330, 335, 411), K.plank(335, 340, 406);
  K.plank(382, 392, 401);
  P_(K, 186, 414, "p_yurt", { sc: 1.3 }), P_(K, 236, 400, "p_yurt", { v: 1, sc: 1.2 }), P_(K, 288, 416, "p_yurt", { sc: 1.5 }), P_(K, 306, 416, "p_wool"), P_(K, 358, 402, "p_flags"), P_(K, 344, 402, "p_sheep");
  P_(K, 190, 430, "p_hay"), P_(K, 240, 414, "p_cheese"), P_(K, 300, 434, "p_loom", { s: 3 }), P_(K, 306, 446, "p_urn"), P_(K, 360, 418, "p_crates");
  K.tag(180, 420, 198, 430, "treasure"), K.tag(230, 406, 248, 414, "arena"), K.tag(280, 422, 312, 434, "rest"), K.tag(290, 438, 314, 446, "treasure"), K.tag(354, 408, 368, 418, "arena");
  K.tag(274, 404, 330, 416, "arena"), K.tag(174, 402, 212, 414, "arena");
  K.struct("유목 천막 뗏목", "쉼터·전투·보물고", 172, 388, 382, 452);
}
// 선돌 사당: 둥근 윗면에 선돌 고리, 속은 별을 보는 둥근 방(빛 구멍 덩굴) → 두 번 꺾인 비탈로 아래 묘실
function stoneCircle(K) {
  nat(K, 390, 580, jag(PL([[390, 376], [430, 356], [485, 348], [540, 356], [580, 376]]), 0.5, 42), jag(PL([[390, 382], [398, 420], [414, 452], [440, 468], [452, 488], [462, 516], [486, 534], [512, 528], [530, 502], [544, 472], [566, 452], [578, 416], [580, 382]]), 1.2, 43), { rough: 1.8 });
  K.ell(485, 420, 50, 34), K.rock(440, 450, 530, 460), K.wall(436, 388, 534, 450, "rock");
  K.air(483, 346, 488, 390), K.wall(483, 346, 488, 390, "rock"), K.vine(483, 488, 344, 450);
  K.rock(444, 400, 478, 402), K.rock(512, 430, 530, 432);
  K.air(390, 392, 446, 400);
  K.air(525, 432, 582, 440), K.plank(570, 590, 440);
  climb(K, 520, 450, 486, "rope"), K.rope(520, 447, 498);
  room(K, 456, 486, 524, 498);
  dropTo(K, 500, 498, "rope");
  for (const [x, s] of [[452, 1], [466, 0], [504, 0], [518, 1], [534, 0]]) P_(K, x, Math.round(PL([[390, 376], [430, 356], [485, 348], [540, 356], [580, 376]])(x)), "p_menhir", { s });
  P_(K, 470, 450, "p_cairn"), P_(K, 504, 450, "p_candles"), P_(K, 520, 430, "p_lectern");
  P_(K, 470, 498, "p_urn"), P_(K, 490, 498, "p_candles"), P_(K, 512, 498, "p_bones");
  K.tag(440, 410, 530, 450, "arena"), K.tag(456, 486, 524, 498, "treasure"), K.tag(440, 334, 530, 348, "vista");
  K.struct("선돌 사당", "전투·보물고·전망", 390, 334, 580, 526);
}
// 부서진 둑길: 옛 돌 둑길 (윗길 + 아치 밑 아랫길, 교각 속 방), 동쪽 끝 무너진 탑 (지하실 · 지붕)
function causeway(K) {
  MARK = true;
  K.rock(590, 440, 644, 446), K.crumble(644, 652, 440), K.rock(652, 440, 700, 446), K.crumble(700, 712, 440), K.rock(712, 440, 780, 446);
  for (const [a, b] of [[596, 614], [664, 684], [732, 750]]) K.rock(a, 446, b, 502);
  for (const [a, b] of [[614, 664], [684, 732], [750, 778]])
    for (let x = a; x < b; x++) {
      const d = Math.round(12 * (1 - Math.sin((Math.PI * (x + 0.5 - a)) / (b - a))));
      d > 0 && K.rock(x, 446, x + 1, 446 + d);
    }
  K.mat(590, 436, 780, 502, "brick");
  for (const [a, b, d] of [[588, 622, 30], [656, 692, 40], [724, 758, 26]]) nat(K, a, b, () => 500, PL([[a, 506], [(a + b) / 2, 500 + d], [b, 506]]), { sh: 3, roll: 0.6, fingers: 2 });
  rope_bridge(K, 614, 664, 486, 2, 4, 0), rope_bridge(K, 684, 732, 486, 2, 4, 2);
  room(K, 600, 474, 610, 486, "brick"), K.air(596, 478, 600, 486), K.air(610, 478, 614, 486), climb(K, 605, 440, 486, "ladder", "brick");
  room(K, 667, 452, 681, 486, "brick"), K.air(664, 478, 667, 486), K.air(681, 478, 684, 486), climb(K, 676, 440, 486, "rope", "brick");
  room(K, 735, 470, 747, 486, "brick"), K.air(732, 478, 735, 486), climb(K, 741, 440, 486, "ladder", "brick");
  // 무너진 탑
  K.rock(778, 380, 808, 502), K.mat(776, 372, 810, 502, "brick");
  for (const x of [778, 790, 802]) K.rock(x, 375, x + 4, 380);
  room(K, 781, 430, 805, 440, "brick"), K.air(778, 432, 781, 440);
  room(K, 781, 404, 805, 424, "brick"), climb(K, 800, 424, 430, "ladder", "brick"), K.ladder(800, 424, 440);
  room(K, 781, 386, 805, 398, "brick"), climb(K, 786, 398, 404, "rope", "brick"), K.rope(786, 395, 424);
  climb(K, 784, 380, 386, "ladder", "brick"), K.ladder(784, 380, 398);
  MARK = false;
  K.stairway(808, 382, 832, 392, 2);
  room(K, 782, 452, 804, 470, "brick"), climb(K, 790, 440, 452, "ladder", "brick"), K.ladder(790, 440, 470), K.air(804, 462, 808, 470);
  P_(K, 620, 440, "p_brokencol"), P_(K, 690, 440, "p_rubble"), P_(K, 760, 440, "p_brokencol", { v: 1 }), P_(K, 640, 486, "p_bones");
  P_(K, 790, 440, "p_rack"), P_(K, 794, 424, "p_shelf"), P_(K, 796, 398, "p_bell"), P_(K, 792, 470, "p_urn"), P_(K, 798, 470, "p_crates");
  K.tag(600, 474, 610, 486, "treasure"), K.tag(667, 452, 681, 486, "arena"), K.tag(735, 470, 747, 486, "arena"), K.tag(620, 474, 660, 486, "arena");
  K.tag(781, 404, 805, 424, "arena"), K.tag(782, 452, 804, 470, "treasure"), K.tag(596, 428, 700, 440, "arena"), K.tag(712, 428, 776, 440, "arena");
  K.struct("부서진 둑길", "전투·보물고", 590, 372, 810, 502);
}
// 바람개비 언덕: 언덕 위 바람개비 셋, 동쪽 끝을 꿰뚫는 바람 굴뚝 (폭포 군도 위 섬에서 타고 오른다) 옆에 곡식 광 셋
function windmillHill(K) {
  nat(K, 830, 1016, jag(PL([[830, 392], [860, 374], [900, 360], [950, 354], [990, 362], [1016, 380]]), 0.5, 44), jag(PL([[830, 400], [846, 450], [872, 486], [896, 472], [916, 500], [940, 540], [964, 522], [986, 494], [1000, 502], [1016, 420]]), 1.3, 45));
  K.air(990, 356, 1000, 500), K.wall(990, 364, 1000, 492, "rock");
  K.wind(990, 1000, 348, 652, 270);
  room(K, 946, 398, 990, 410, "wood");
  room(K, 920, 428, 990, 442, "wood"), climb(K, 952, 410, 428, "ladder", "wood"), K.ladder(952, 410, 442);
  room(K, 954, 462, 990, 474), climb(K, 970, 442, 462, "rope"), K.rope(970, 439, 474);
  K.wiggle([[920, 442], [892, 462], [852, 470]], 7, 0, "rock");
  room(K, 856, 404, 910, 418, "wood"), climb(K, 870, 376, 418, "ladder", "wood"), climb(K, 900, 418, 457, "rope");
  P_(K, 866, 418, "p_loom", { s: 1 }), P_(K, 884, 418, "p_wool"), K.tag(856, 404, 896, 418, "arena");
  dropTo(K, 962, 474, "rope");
  rope_bridge(K, 808, 852, 470, 3, 4, 1);
  P_(K, 880, 366, "p_windmill"), P_(K, 932, 355, "p_windmill", { sc: 1.3 }), P_(K, 970, 358, "p_windmill", { v: 1 }), P_(K, 906, 359, "p_sheep"), P_(K, 852, 378, "p_cairn");
  P_(K, 960, 410, "p_hay", { s: 1 }), P_(K, 976, 410, "p_crates"), P_(K, 932, 442, "p_hay"), P_(K, 940, 442, "p_hay", { s: 1 }), P_(K, 966, 474, "p_urn");
  K.tag(946, 398, 990, 410, "treasure"), K.tag(920, 428, 990, 442, "arena"), K.tag(954, 462, 990, 474, "arena"), K.tag(850, 342, 980, 356, "arena");
  K.struct("바람개비 언덕", "전투·보물고·바람 길", 830, 342, 1016, 546);
}

// ═══ 가 줄 ═══
// 정상 목초지: 가장 큰 섬. 윗면 돌 고리(▲), 속은 큰 헛간(건초 다락 둘) · 기둥 낙농실(물 저장고) · 양치기 묘실, 서쪽으로 큰 폭포
function summit(K) {
  const top = jag(PL([[360, 142], [400, 128], [470, 118], [520, 112], [568, 112], [620, 118], [690, 128], [720, 144]]), 0.5, 46);
  nat(K, 360, 720, top, jag(PL([[360, 150], [372, 190], [396, 222], [426, 252], [470, 274], [520, 298], [548, 312], [584, 302], [624, 278], [664, 254], [692, 220], [710, 184], [720, 154]]), 1.2, 47), { rough: 1.6, warp: 5, fingers: 6 });
  K.rock(514, 110, 574, 113), K.air(514, 100, 574, 112);
  room(K, 420, 132, 640, 160, "wood");
  K.wall(520, 132, 522, 160, "stem"), K.wall(560, 132, 562, 160, "stem");
  K.plank(426, 476, 146), K.ladder(474, 146, 160);
  K.plank(590, 636, 144), K.ladder(592, 144, 160);
  climb(K, 604, 118, 132, "ladder", "wood"), K.ladder(604, 118, 144);
  climb(K, 446, 121, 132, "vine", "wood"), K.vine(445, 448, 118, 146);
  K.air(640, 150, 720, 160);
  room(K, 440, 190, 620, 210);
  for (const x of [470, 500, 562, 592]) K.wall(x, 190, x + 2, 210, "stem");
  K.air(520, 210, 600, 216), K.water(520, 208, 600, 216);
  climb(K, 556, 160, 190, "rope"), K.rope(556, 157, 210);
  climb(K, 466, 160, 190, "ladder"), K.ladder(466, 160, 210);
  K.air(376, 202, 440, 210), K.wall(384, 202, 440, 210, "rock");
  K.fallw(370, 202, 376, 402);
  room(K, 480, 252, 614, 264), climb(K, 610, 210, 252, "ladder"), K.ladder(610, 210, 264);
  K.crumble(520, 532, 264), K.air(520, 264, 532, 270), K.rock(518, 270, 534, 272);
  dropTo(K, 548, 264, "rope");
  room(K, 430, 226, 474, 240), climb(K, 452, 210, 240, "ladder");
  room(K, 642, 176, 698, 192, "wood"), climb(K, 690, 160, 192, "ladder", "wood"), K.ramp(624, 210, 642, 192, 7), K.wall(622, 185, 644, 210, "rock");
  P_(K, 652, 192, "p_wool"), P_(K, 666, 192, "p_sheep"), P_(K, 680, 192, "p_rack"), K.tag(642, 176, 684, 192, "arena");
  room(K, 626, 222, 664, 236, "wood"), K.ramp(612, 264, 640, 236, 7), K.wall(612, 229, 642, 264, "rock");
  P_(K, 440, 240, "p_wool"), P_(K, 462, 240, "p_crates"), P_(K, 636, 236, "p_sheep"), P_(K, 652, 236, "p_hay");
  K.tag(430, 226, 474, 240, "treasure"), K.tag(626, 222, 664, 236, "arena");
  K.peak(544, 112);
  for (const [x, s] of [[518, 1], [530, 0], [560, 0], [572, 1]]) P_(K, x, 112, "p_menhir", { s });
  P_(K, 470, 118, "p_sheep"), P_(K, 490, 115, "p_fence"), P_(K, 620, 118, "p_sheep", { v: 1 }), P_(K, 650, 122, "p_yurt", { sc: 1.5 }), P_(K, 420, 124, "p_flags", { s: 2 }), P_(K, 680, 127, "p_hay");
  P_(K, 440, 146, "p_hay", { s: 1 }), P_(K, 460, 146, "p_hay"), P_(K, 612, 144, "p_hay", { s: 1 }), P_(K, 500, 160, "p_sheep"), P_(K, 540, 160, "p_fence"), P_(K, 580, 160, "p_wool"), P_(K, 630, 160, "p_crates");
  P_(K, 452, 210, "p_cheese"), P_(K, 484, 210, "p_cheese", { v: 1 }), P_(K, 512, 210, "p_urn"), P_(K, 612, 210, "p_shelf");
  P_(K, 494, 264, "p_urn"), P_(K, 510, 264, "p_candles"), P_(K, 570, 264, "p_bones"), P_(K, 590, 264, "p_cairn");
  K.tag(514, 98, 574, 112, "rest", { safe: 1 });
  K.tag(480, 132, 640, 160, "arena", { big: 1 }), K.tag(426, 134, 476, 146, "treasure"), K.tag(590, 132, 636, 144, "treasure");
  K.tag(440, 190, 520, 210, "arena"), K.tag(480, 252, 614, 264, "treasure"), K.tag(400, 106, 500, 118, "arena"), K.tag(600, 106, 700, 120, "arena");
  K.struct("정상 목초지", "출구·정예·보물고", 360, 96, 720, 306);
}
// 봉화 첨탑: 높고 가는 탑 바위 — 위로 갈수록 넓은 방 다섯이 좌우로 엇갈려 쌓였다, 꼭대기 봉화
function beacon(K) {
  nat(K, 250, 320, jag(PL([[250, 70], [262, 64], [308, 64], [320, 70]]), 0.3, 48), jag(PL([[250, 90], [260, 170], [276, 262], [288, 284], [300, 262], [312, 170], [320, 90]]), 1.2, 49));
  room(K, 262, 76, 308, 90, "brick"), climb(K, 300, 64, 90, "ladder", "brick");
  room(K, 266, 110, 300, 126), climb(K, 270, 90, 126, "rope");
  room(K, 268, 152, 304, 170, "brick"), climb(K, 296, 126, 170, "ladder"), K.air(258, 162, 268, 170);
  room(K, 274, 196, 298, 210), climb(K, 280, 170, 210, "vine");
  room(K, 280, 234, 294, 246), climb(K, 290, 210, 246, "ladder");
  dropTo(K, 287, 246, "vine");
  P_(K, 284, 64, "p_brazier", { sc: 1.6 }), P_(K, 266, 64, "p_flags"), P_(K, 272, 90, "p_rack"), P_(K, 288, 90, "p_shelf"), P_(K, 284, 126, "p_crates"), P_(K, 280, 170, "p_bell");
  K.tag(262, 76, 296, 90, "treasure"), K.tag(266, 110, 300, 126, "arena"), K.tag(268, 152, 304, 170, "arena"), K.tag(274, 196, 298, 210, "arena"), K.tag(256, 50, 314, 64, "vista");
  K.struct("봉화 첨탑", "전망·전투·보물고", 250, 50, 320, 284);
}
// 연 언덕: 길고 납작한 언덕 — 연 공방 긴 다락 · 매 기르는 방, 배 밑으로 독수리 바위까지 덩굴
function kiteBluff(K) {
  nat(K, 20, 220, jag(PL([[20, 158], [60, 150], [140, 148], [200, 152], [220, 160]]), 0.4, 50), jag(PL([[20, 170], [34, 212], [60, 220], [70, 238], [84, 242], [96, 222], [140, 224], [150, 244], [162, 248], [172, 226], [196, 220], [210, 200], [220, 170]]), 0.9, 51));
  room(K, 34, 170, 206, 182, "wood"), climb(K, 50, 150, 182, "ladder", "wood");
  for (const x of [90, 150]) K.wall(x, 170, x + 2, 182, "stem");
  room(K, 70, 204, 170, 216), climb(K, 160, 182, 216, "rope");
  dropTo(K, 120, 216, "vine");
  dropTo(K, 166, 216, "rope");
  K.stairway(220, 160, 258, 170, 2);
  P_(K, 60, 182, "p_loom", { s: 2 }), P_(K, 110, 182, "p_flags", { s: 1 }), P_(K, 130, 182, "p_flags"), P_(K, 176, 182, "p_wool"), P_(K, 90, 216, "p_nest"), P_(K, 140, 216, "p_rack");
  P_(K, 40, 154, "p_flags", { s: 2 }), P_(K, 80, 150, "p_flags", { s: 1 }), P_(K, 120, 148, "p_flags", { s: 2 }), P_(K, 170, 149, "p_cairn"), P_(K, 196, 151, "p_flags");
  K.tag(34, 170, 90, 182, "arena"), K.tag(150, 170, 206, 182, "treasure"), K.tag(70, 204, 150, 216, "arena"), K.tag(40, 136, 200, 148, "arena");
  K.struct("연 언덕", "전투·보물고", 20, 136, 220, 234);
}
// 하늘 우물: 섬을 꿰뚫는 우물 (물기둥을 헤엄쳐 오르내린다) — 우물가 회복 샘, 물길 옆 저수 방 둘, 아래로 무너진 탑 지붕까지
function skyWell(K) {
  nat(K, 740, 860, jag(PL([[740, 208], [800, 200], [860, 208]]), 0.4, 52), jag(PL([[740, 214], [748, 250], [766, 286], [800, 306], [834, 288], [852, 256], [860, 214]]), 1.2, 53));
  K.fallw(797, 200, 803, 380);
  K.wall(795, 200, 805, 300, "rock");
  room(K, 756, 222, 797, 236), room(K, 803, 246, 840, 258);
  room(K, 764, 256, 794, 268), K.air(794, 260, 797, 268), climb(K, 776, 236, 268, "rope");
  P_(K, 770, 268, "p_urn"), K.tag(764, 256, 794, 268, "treasure");
  K.rock(786, 186, 814, 188), K.rock(786, 188, 788, 194), K.rock(812, 188, 814, 194), K.mat(786, 186, 814, 194, "wood");
  P_(K, 820, 202, "p_font"), K.heal(816, 824, 198, 202);
  P_(K, 770, 236, "p_urn"), P_(K, 782, 236, "p_crates"), P_(K, 820, 258, "p_urn"), P_(K, 760, 205, "p_flowers"), P_(K, 846, 205, "p_sheep");
  K.tag(756, 222, 797, 236, "arena"), K.tag(803, 246, 840, 258, "treasure"), K.tag(808, 186, 836, 200, "rest");
  K.struct("하늘 우물", "쉼터·보물고·폭포 길", 740, 186, 860, 300);
}
// 엇갈린 탑 섬: 좌우로 엇갈려 쌓인 방 다섯 (망루·침소·무기고·부엌·움), 밧줄로 바람개비 언덕까지
function stagger(K) {
  nat(K, 878, 1018, jag(PL([[878, 96], [900, 86], [1000, 86], [1018, 98]]), 0.4, 54), jag(PL([[878, 112], [884, 160], [890, 212], [904, 264], [930, 302], [958, 316], [984, 294], [1000, 244], [1010, 182], [1018, 122]]), 1.3, 55), { warp: 4, rough: 1.8, fingers: 3 });
  room(K, 892, 100, 950, 112, "brick"), climb(K, 930, 86, 112, "ladder", "brick");
  room(K, 940, 128, 1006, 144, "wood"), climb(K, 944, 112, 128, "ladder"), K.ladder(944, 112, 144);
  room(K, 894, 170, 960, 186, "brick"), climb(K, 952, 144, 170, "rope"), K.rope(952, 141, 186), K.air(882, 178, 894, 186), K.plank(872, 884, 186);
  room(K, 950, 210, 1000, 226, "wood"), climb(K, 956, 186, 210, "vine"), K.vine(955, 958, 183, 226);
  room(K, 916, 248, 970, 262), climb(K, 962, 226, 248, "ladder"), K.ladder(962, 226, 262);
  dropTo(K, 940, 262, "rope");
  P_(K, 960, 86, "p_bell"), P_(K, 990, 86, "p_flags", { s: 2 }), P_(K, 906, 86, "p_brazier");
  P_(K, 910, 112, "p_rack"), P_(K, 960, 144, "p_crates"), P_(K, 990, 144, "p_wool"), P_(K, 910, 186, "p_rack"), P_(K, 930, 186, "p_rack", { v: 1 }), P_(K, 970, 226, "p_cheese"), P_(K, 986, 226, "p_urn"), P_(K, 930, 262, "p_crates");
  K.tag(892, 100, 924, 112, "arena"), K.tag(960, 128, 1006, 144, "rest"), K.tag(894, 170, 948, 186, "arena"), K.tag(966, 210, 1000, 226, "treasure"), K.tag(916, 248, 956, 262, "arena");
  K.struct("엇갈린 탑 섬", "전투·보물고", 880, 72, 1016, 310);
}

// ═══ 사이 섬들 (빈 하늘을 메운다) ═══
// 펠트 짓는 섬: 양털을 밟아 펠트를 만드는 방 — 바닥 가운데 털 구덩이는 밟으면 튕겨 오른다
function felt(K) {
  nat(K, 170, 290, jag(PL([[170, 496], [200, 492], [270, 492], [290, 498]]), 0.4, 60), jag(PL([[170, 502], [190, 530], [230, 548], [270, 532], [290, 502]]), 1.2, 61));
  room(K, 182, 498, 280, 512, "wood"), climb(K, 274, 492, 512, "ladder", "wood");
  K.air(212, 512, 248, 518), K.wall(212, 512, 248, 518, "wood"), K.bounce(214, 246, 518), K.mat(212, 517, 248, 519, "leaf");
  K.plank(250, 278, 503);
  dropTo(K, 266, 512, "rope");
  P_(K, 194, 512, "p_wool"), P_(K, 260, 503, "p_loom", { s: 2 }), P_(K, 200, 492, "p_sheep"), P_(K, 236, 492, "p_wool");
  K.tag(182, 498, 212, 512, "arena"), K.tag(250, 496, 278, 503, "treasure");
  K.struct("펠트 짓는 섬", "전투·보물고", 170, 480, 290, 548);
}
// 샘 사당: 작은 사당 방 (회복 샘), 공방 발코니에서 들어가 밧줄로 폭포 군도 아래 섬까지
function shrine(K) {
  nat(K, 786, 866, jag(PL([[786, 608], [800, 604], [850, 604], [866, 610]]), 0.4, 62), jag(PL([[786, 614], [800, 640], [826, 656], [852, 640], [866, 614]]), 1.1, 63));
  room(K, 796, 612, 856, 626), K.air(786, 618, 796, 626), K.plank(780, 786, 626);
  K.air(840, 626, 852, 630), K.water(840, 626, 852, 630);
  P_(K, 812, 626, "p_font", { sc: 1.2 }), K.heal(806, 818, 622, 626), P_(K, 826, 626, "p_candles"), P_(K, 820, 604, "p_cairn"), P_(K, 846, 604, "p_flags");
  dropTo(K, 830, 626, "rope");
  K.plank(866, 872, 598);
  K.tag(796, 612, 856, 626, "rest");
  K.struct("샘 사당", "쉼터", 786, 590, 866, 656);
}
// 바람 그네 섬: 낮은 해먹 방 (줄에 걸린 해먹 판자) — 위 바람개비 언덕에서 밧줄로, 아래 폭포 군도로 사다리
function swing(K) {
  nat(K, 872, 968, jag(PL([[872, 592], [890, 588], [950, 588], [968, 594]]), 0.4, 64), jag(PL([[872, 600], [890, 620], [920, 634], [950, 620], [968, 598]]), 1.1, 65));
  room(K, 894, 596, 946, 610, "wood"), climb(K, 940, 588, 610, "ladder", "wood");
  K.plank(900, 912, 604), K.plank(924, 934, 602);
  dropTo(K, 910, 610, "ladder");
  P_(K, 902, 610, "p_wool"), P_(K, 930, 610, "p_crates"), P_(K, 896, 588, "p_flags", { s: 1 }), P_(K, 960, 589, "p_sheep");
  K.tag(894, 596, 936, 610, "arena");
  K.struct("바람 그네 섬", "전투", 872, 574, 968, 634);
}
// 벌집 바위: 속이 벌집처럼 엇갈린 작은 방 세 줄 (벌통), 밧줄로 둑길까지
function apiary(K) {
  nat(K, 610, 722, jag(PL([[610, 340], [640, 330], [700, 330], [722, 340]]), 0.3, 66), jag(PL([[610, 346], [624, 378], [650, 398], [680, 402], [706, 386], [722, 346]]), 1, 67), { rough: 1.6 });
  const rows = [[350, 620, 6], [362, 627, 5], [374, 634, 4]];
  for (const [f, x0, n] of rows)
    for (let i = 0; i < n; i++) {
      const a = x0 + i * 14;
      room(K, a, f - 7, a + 12, f), i + 1 < n && K.air(a + 12, f - 5, a + 14, f);
      K.mat(a - 1, f - 8, a + 13, f + 1, "wood");
    }
  climb(K, 700, 330, 350, "ladder"), climb(K, 640, 350, 362, "ladder"), climb(K, 682, 362, 374, "rope"), climb(K, 622, 350, 362, "vine");
  dropTo(K, 664, 374, "rope");
  for (const [x, f] of [[626, 350], [654, 350], [668, 350], [694, 350], [632, 362], [674, 362], [642, 374], [686, 374]]) P_(K, x, f, "p_hive", { v: x & 1 });
  P_(K, 660, 329, "p_flowers"), P_(K, 690, 330, "p_hive");
  K.tag(618, 343, 704, 350, "arena"), K.tag(627, 355, 695, 362, "treasure"), K.tag(634, 367, 690, 374, "arena");
  K.struct("벌집 바위", "전투·보물고", 610, 316, 722, 404);
}
// 연 매는 바위: 연 줄을 매어 두는 작은 바위 (연 창고), 연 언덕과 뗏목 사이
function tether(K) {
  nat(K, 160, 244, jag(PL([[160, 274], [176, 270], [230, 270], [244, 276]]), 0.4, 68), jag(PL([[160, 282], [180, 302], [210, 314], [236, 300], [244, 282]]), 1.1, 69));
  room(K, 172, 278, 232, 290, "wood"), climb(K, 226, 270, 290, "rope", "wood");
  dropTo(K, 194, 290, "rope");
  P_(K, 180, 290, "p_rack"), P_(K, 210, 290, "p_flags", { s: 1 }), P_(K, 186, 270, "p_flags", { s: 2 }), P_(K, 214, 270, "p_flags");
  K.tag(172, 278, 220, 290, "arena");
  K.struct("연 매는 바위", "전투", 160, 256, 244, 314);
}
// 새 떼 둥지 바위: 지도 맨 위 — 벼랑마다 새 둥지 구멍, 속은 알 방과 둥지 방
function rookery(K) {
  nat(K, 40, 200, jag(PL([[40, 48], [80, 40], [150, 42], [200, 52]]), 0.5, 70), jag(PL([[40, 62], [60, 96], [110, 118], [160, 104], [200, 64]]), 1.3, 71));
  room(K, 70, 56, 170, 70), climb(K, 150, 42, 70, "ladder");
  room(K, 90, 84, 140, 96), climb(K, 100, 70, 96, "rope");
  dropTo(K, 118, 96, "vine");
  for (const [x, y] of [[48, 66], [56, 80], [66, 92], [176, 76], [186, 68], [166, 90]]) (K.air(x, y, x + 4, y + 3), K.prop(x + 2, y + 3, "p_nest", { sc: 0.6 }));
  K.stairway(200, 54, 252, 68, 2);
  P_(K, 90, 70, "p_nest"), P_(K, 130, 70, "p_nest", { v: 1 }), P_(K, 110, 96, "p_bones"), P_(K, 70, 42, "p_flags"), P_(K, 120, 41, "p_cairn");
  K.tag(70, 56, 120, 70, "arena"), K.tag(90, 84, 140, 96, "treasure"), K.tag(60, 28, 180, 40, "arena");
  K.struct("새 떼 둥지 바위", "전투·보물고", 40, 28, 200, 118);
}
// 종 매단 바위: 높은 종 방 (엇갈린 다락 둘), 밑으로 하늘 우물 지붕까지 덩굴
function bellCrag(K) {
  nat(K, 734, 868, jag(PL([[734, 84], [760, 72], [840, 72], [868, 86]]), 0.4, 72), jag(PL([[734, 94], [752, 122], [780, 148], [800, 158], [828, 146], [850, 120], [868, 94]]), 1.2, 73), { fingers: 3 });
  room(K, 770, 82, 830, 122, "brick");
  K.plank(772, 792, 108), K.ladder(790, 108, 122), K.plank(808, 828, 94), K.ladder(810, 94, 108);
  climb(K, 820, 72, 94, "ladder", "brick");
  dropTo(K, 818, 122, "vine");
  P_(K, 778, 122, "p_bell", { sc: 1.8 }), P_(K, 816, 122, "p_candles"), P_(K, 780, 108, "p_crates"), P_(K, 760, 72, "p_flags"), P_(K, 850, 74, "p_brazier");
  K.tag(770, 108, 830, 122, "arena"), K.tag(772, 96, 792, 108, "treasure");
  K.struct("종 매단 바위", "전투·보물고", 734, 58, 866, 156);
}

// 염색 통 섬: 펠트를 물들이는 통 두 개가 바닥에 파인 방, 펠트 섬과 판자로 이어진다
function dyeVats(K) {
  nat(K, 306, 396, jag(PL([[306, 486], [320, 480], [384, 480], [396, 488]]), 0.4, 74), jag(PL([[306, 494], [326, 520], [352, 532], [380, 516], [396, 494]]), 1.0, 75));
  room(K, 318, 488, 386, 500, "wood"), climb(K, 326, 480, 500, "ladder", "wood");
  K.air(336, 500, 348, 505), K.water(336, 500, 348, 505), K.air(362, 500, 374, 505), K.water(362, 500, 374, 505);
  rope_bridge(K, 290, 306, 492, 1);
  dropTo(K, 352, 500, "rope");
  P_(K, 330, 500, "p_wool"), P_(K, 356, 500, "p_loom", { s: 1 }), P_(K, 380, 500, "p_shelf"), P_(K, 370, 480, "p_flags");
  K.tag(318, 488, 386, 500, "arena");
  K.struct("염색 통 섬", "전투", 306, 466, 396, 532);
}
// 물보라 굴 바위: 큰 폭포 바로 뒤 — 폭포를 헤엄쳐 오르다 옆으로 빠지면 숨은 굴
function sprayCave(K) {
  nat(K, 300, 366, jag(PL([[300, 324], [316, 318], [352, 318], [366, 322]]), 0.4, 76), jag(PL([[300, 330], [316, 350], [336, 362], [356, 350], [366, 330]]), 1.0, 77));
  room(K, 312, 326, 366, 338), K.air(366, 330, 370, 338);
  K.ell(326, 330, 8, 4);
  P_(K, 330, 338, "p_fern"), P_(K, 346, 338, "p_urn"), P_(K, 320, 318, "p_flowers");
  K.tag(312, 326, 360, 338, "treasure");
  K.struct("물보라 굴 바위", "보물고", 300, 306, 370, 362);
}
// 별 보는 망대 바위: 지도 꼭대기 — 망원경 방과 다락, 봉화 첨탑에서 판자 디딤으로
function observatory(K) {
  nat(K, 334, 440, jag(PL([[334, 40], [350, 34], [420, 34], [440, 42]]), 0.3, 78), jag(PL([[334, 50], [350, 80], [384, 98], [420, 84], [440, 50]]), 1.0, 79));
  room(K, 352, 44, 424, 60, "brick"), climb(K, 416, 34, 60, "ladder", "brick");
  K.plank(354, 376, 52), K.ladder(374, 52, 60);
  K.plank(320, 326, 64), K.plank(326, 334, 57);
  dropTo(K, 400, 60, "rope");
  P_(K, 364, 52, "p_lectern"), P_(K, 390, 60, "p_shelf"), P_(K, 404, 60, "p_candles"), P_(K, 380, 34, "p_flags", { s: 2 }), P_(K, 430, 36, "p_cairn");
  K.tag(378, 44, 424, 60, "arena"), K.tag(354, 44, 376, 52, "treasure");
  K.struct("별 보는 망대 바위", "전투·보물고", 334, 20, 440, 98);
}
// 구름 양 우리: 정상 위에 뜬 작은 우리 섬 (양 우리 방), 사다리로 정상 목초지 윗면까지
function cloudPen(K) {
  nat(K, 606, 716, jag(PL([[606, 46], [620, 40], [700, 40], [716, 48]]), 0.3, 80), jag(PL([[606, 54], [622, 74], [644, 78], [664, 92], [690, 80], [716, 54]]), 1.0, 81));
  room(K, 624, 48, 700, 62, "wood"), climb(K, 630, 40, 62, "rope", "wood");
  dropTo(K, 690, 62, "ladder");
  P_(K, 640, 62, "p_sheep"), P_(K, 656, 62, "p_sheep", { v: 1 }), P_(K, 672, 62, "p_hay"), P_(K, 660, 40, "p_fence"), P_(K, 690, 40, "p_sheep");
  K.tag(624, 48, 684, 62, "arena");
  K.struct("구름 양 우리", "전투", 606, 26, 716, 92);
}

// ═══ 섬 사이 잇기 (아래 섬이 먼저 지어진 뒤) ═══
function links(K) {
  // 라 줄 가로
  K.zip(200, 806, 248, 856);
  K.cloud(402, 412, 852), K.cloud(414, 424, 838), K.cloud(404, 414, 822);
  K.stairway(590, 806, 610, 794, 2);
  K.stairway(810, 795, 834, 781, 2);
  rope_bridge(K, 890, 920, 848, 3, 0);
  // 다 줄 가로: 계단밭 → 알 섬 돌계단, 알 섬 → 공방 판자, 공방 발코니 → 폭포 군도 짚라인
  K.stairway(380, 618, 408, 640, 2);
  rope_bridge(K, 562, 590, 662, 2, 3, 1);
  // 나 줄 가로: 독수리 바위 → 뗏목 짚라인
  K.zip(150, 336, 194, 410);
  // 가 줄: 봉화 첨탑 → 정상 목초지 짚라인, 정상 → 하늘 우물 돌계단, 엇갈린 탑 → 정상 · 하늘 우물 짚라인
  K.zip(310, 62, 384, 130);
  K.stairway(716, 160, 762, 206, 2);
  rope_bridge(K, 838, 884, 84, 3, 4, 1);
  K.zip(772, 72, 704, 126);
  K.zip(872, 184, 850, 202);
}
