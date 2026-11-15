// 직접 디자인한 맵 조각. 무작위 지형 생성 대신 한 조각(32칸)씩 손으로 짠 배치를 이어 붙인다.
// 모든 조각은 땅 높이 6에서 시작해 6으로 끝난다(이음새가 항상 맞음). 점프 한계: 위로 4칸, 옆으로 4칸.
// 명령: F 평지, U 오르막 경사, D 내리막 경사, S 턱(높이 변화), P 구덩이,
//       I/IA 떠 있는 섬(지면 기준/절대 높이), L/LA 발판, C/CA 부서지는 발판, Z 지역 함정, END 높이 6으로 복귀
// 세계 높이: 위로 TOP줄(하늘 루트), 아래로 UG줄(지하 루트)을 덧붙였다. 옛 좌표(56줄)는 그대로 쓰고 여기서 옮긴다.
export const TOP = 20, UG = 40;
export const BASE_H = 6 + UG;
const T = {
  meadow: [["F", 2], ["U", 2], ["F", 3], ["L", 2, 5, 4], ["F", 4], ["D", 2], ["F", 2], ["U", 1], ["F", 3], ["D", 1], ["END"]],
  twinHills: [["F", 1], ["U", 3], ["F", 2], ["D", 2], ["F", 2], ["U", 3], ["F", 2], ["L", 1, 5, 4], ["F", 3], ["D", 4], ["END"]],
  bumpy: [["F", 1], ["S", 1], ["F", 2], ["S", 1], ["F", 3], ["S", -1], ["F", 2], ["U", 2], ["F", 2], ["D", 3], ["F", 2], ["S", 1], ["F", 2], ["END"]],
  overhangRun: [["F", 3], ["I", 2, 5, 8, 2], ["F", 4], ["U", 2], ["F", 2], ["L", 1, 5, 5], ["F", 4], ["D", 2], ["END"]],
  valley: [["F", 2], ["D", 3], ["L", 1, 4, 4], ["F", 7], ["U", 3], ["F", 3], ["END"]],
  plateau: [["F", 2], ["U", 4], ["F", 3], ["Z"], ["F", 3], ["D", 4], ["END"]],
  cliffClimb: [["F", 2], ["S", 3], ["F", 3], ["U", 2], ["F", 2], ["S", 3], ["F", 4], ["L", -3, 4, 3], ["D", 3], ["S", -3], ["F", 1], ["END"]],
  ruinsTower: [["F", 3], ["S", 3], ["F", 2], ["S", 3], ["F", 3], ["L", -2, 4, 4], ["S", -3], ["F", 2], ["D", 4], ["END"]],
  islandHop: [["F", 2], ["I", 2, 1, 4, 3], ["I", 8, 2, 3, 3], ["I", 13, 1, 4, 3], ["P", 18], ["END"]],
  bridge: [["F", 2], ["L", 1, 0, 4], ["C", 6, 0, 4], ["L", 11, 1, 3], ["P", 14], ["END"]],
  canyon: [["F", 2], ["S", 3], ["F", 3], ["S", -3], ["L", 1, 3, 3], ["L", 5, 6, 3], ["F", 7], ["S", 3], ["F", 3], ["D", 4], ["END"]],
  hazardRun: [["F", 3], ["Z"], ["F", 3], ["U", 2], ["F", 2], ["Z"], ["D", 2], ["END"]],
  // 하늘 오르기 (두 조각 연속): 섬을 지그재그로 밟고 구름 위까지
  skyA: [["F", 2], ["IA", 2, 10, 5, 2], ["IA", 8, 14, 4, 2], ["IA", 3, 18, 4, 2], ["IA", 9, 22, 4, 2], ["IA", 4, 26, 4, 2], ["IA", 10, 30, 5, 2], ["IA", 16, 34, 4, 2], ["IA", 21, 38, 5, 2], ["LA", 26, 42, 6], ["F", 30]],
  skyB: [["LA", 0, 42, 5], ["IA", 6, 44, 5, 2], ["LA", 9, 48, 4], ["IA", 12, 51, 8, 2], ["CA", 13, 44, 4], ["IA", 19, 41, 5, 2], ["LA", 25, 36, 4], ["IA", 26, 30, 4, 2], ["LA", 20, 24, 4], ["IA", 27, 18, 4, 2], ["LA", 22, 12, 4], ["F", 32]],
};

// ── 다층 맵 조각: 지면 명령(ops) + 직접 그린 도면(art, 줄 단위 RLE: "8.9#15." = 빈칸8·바위9·빈칸15)
// 기호: # 바위, = 발판, ~ 부서지는 발판. 각 층은 위로 4칸·옆으로 3칸 이내로 이어져 아래에서부터 오를 수 있다.
// 높은 층 이음 높이: 26줄(오른쪽/왼쪽 끝 바위가 다음 조각과 이어짐)
const ART = {
  ascent: {
    ops: [["F", 20], ["U", 2], ["F", 4], ["D", 2], ["END"]],
    top: 13,
    art: ["32.", "8.9#15.", "9.8#15.", "10.6#16.", "11.4#17.", "18.8#6.", "19.6#7.", "20.4#8.", "32.", "26.5=1.", "32.", "32.", "32.",
      "23.9#", "22.10#", "22.10#", "23.9#", "18.5=1.8#", "24.8#", "26.6#", "28.4#", "9.8#15.", "10.7#15.", "11.5#16.", "12.3#17.", "4.5=23.",
      "32.", "32.", "32.", "10.6#16.", "11.4#17.", "12.2#18.", "32.", "4.6=22."],
    spawns: [[12, 14], [21, 18], [27, 26], [12, 34]],
  },
  cavern: {
    ops: [["F", 8], ["Z"], ["F", 4], ["END"]],
    top: 26,
    art: ["14#4.14#", "14#4.14#", "14#4.14#", "12#8.12#", "4#3.4#3.4=1.4#3.6#", "2#6.2#10.2#6.4#", "1#8.1#12.1#7.2#", "32.", "13.6=13.",
      "32.", "32.", "32.", "6.5=10.5=6.", "32.", "32.", "32.", "6.4#12.4#6.", "7.2#14.2#7.", "32.", "32.", "1.4=22.4=1."],
    spawns: [[5, 26], [26, 26], [15, 34], [8, 38], [23, 38]],
  },
  cliffs: {
    ops: [["F", 2], ["S", 3], ["F", 5], ["S", 3], ["F", 5], ["S", 3], ["F", 4], ["D", 3], ["S", -3], ["END"]],
    top: 18,
    art: ["12.7#13.", "13.5#14.", "14.3#15.", "32.", "20.4=8.", "32.", "32.", "32.", "24.8#", "23.9#", "23.9#", "16.5#3.8#", "17.3#4.8#",
      "25.7#", "27.5#", "8.6#18.", "9.4#19.", "32.", "32.", "13.5=14."],
    spawns: [[15, 18], [27, 26], [10, 33], [18, 29]],
  },
  gardens: {
    ops: [["F", 3], ["U", 3], ["F", 4], ["D", 3], ["F", 4], ["U", 2], ["F", 3], ["D", 2], ["END"]],
    top: 18,
    art: ["18.6#8.", "19.4#9.", "32.", "32.", "10.5=17.", "32.", "32.", "32.", "1.7#16.6#2.", "2.5#18.4#3.", "3.3#20.2#4.", "32.", "11.4=17.",
      "32.", "32.", "32.", "18.4=10.", "32.", "32.", "32.", "8#3.7#3.11#", "7#4.5#5.11#", "5#7.3#7.10#", "3#10.1#9.9#", "26.4=2.", "32.", "32.", "32.", "22.4=6."],
    spawns: [[20, 18], [4, 26], [26, 26], [3, 38], [14, 38], [27, 38]],
  },
  bastion: {
    ops: [["F", 2], ["U", 1], ["F", 3], ["D", 1], ["F", 26], ["END"]],
    top: 26,
    art: ["11.10#11.", "10.12#10.", "10.12#10.", "11.10#11.", "4.4=4.3#2.3#4.4=4.", "32.", "32.", "32.", "1.5#20.5#1.", "2.3#22.3#2.",
      "32.", "32.", "8.4=8.4=8.", "32.", "32.", "32.", "10.12#10.", "11.10#11.", "13.6#13.", "32.", "5.4=14.4=5."],
    spawns: [[15, 26], [3, 34], [28, 34], [15, 42]],
  },
};
const MIRROR = (A) => ({ ...A, art: A.art.map((r) => r), mirror: 1, spawns: A.spawns.map(([x, r]) => [31 - x, r]) });
for (const k of Object.keys(ART)) ART[k + "_m"] = MIRROR(ART[k]);
const rle = (r) => {
  let out = "";
  for (const m of r.matchAll(/(\d+)(.)/g)) out += m[2].repeat(Number(m[1]));
  return (out + ".".repeat(32)).slice(0, 32);
};
export const _ART = ART;
export const _rle = rle;

// ── 지역 테마 전용 맵 조각 (사각형 배치) ─────────────
// B: 바위 덩어리(x, 윗줄, 폭, 높이) · T: 아래가 좁아지는 섬 · P: 발판 · C: 부서지는 발판
// 땅 윗면 = 50줄. 한 단은 위로 4줄, 옆으로 3칸 이내.
const R = {
  // 불탄 마을: 무너진 집 지붕 → 망루 → 하늘 섬
  village: { th: "plains", ops: [["F", 2], ["U", 1], ["F", 6], ["D", 1], ["F", 22], ["END"]],
    r: [["B", 3, 46, 6, 4], ["B", 11, 42, 7, 8], ["B", 20, 38, 4, 12], ["P", 25, 34, 5], ["T", 17, 30, 6, 3], ["P", 10, 26, 5], ["T", 2, 22, 7, 3], ["P", 11, 18, 4], ["T", 17, 14, 8, 3]],
    sp: [[5, 46], [14, 42], [21, 38], [19, 30], [5, 22], [20, 14]] },
  embers: { th: "plains", ops: [["F", 3], ["U", 2], ["F", 3], ["D", 2], ["F", 3], ["U", 3], ["F", 4], ["D", 3], ["F", 2], ["END"]],
    r: [["P", 6, 44, 4], ["T", 12, 40, 5, 2], ["P", 4, 36, 5], ["T", 10, 32, 6, 3], ["P", 18, 28, 4], ["T", 23, 24, 7, 3], ["P", 15, 20, 5], ["T", 6, 16, 7, 3]],
    sp: [[14, 40], [12, 32], [26, 24], [9, 16]] },
  // 숲: 거대한 나무 줄기와 가지, 위쪽 수관
  treehouse: { th: "forest", ops: [["F", 10], ["U", 1], ["F", 4], ["D", 1], ["F", 16], ["END"]],
    r: [["B", 6, 27, 3, 23], ["P", 2, 46, 4], ["P", 9, 42, 5], ["P", 3, 38, 3], ["P", 9, 34, 5], ["P", 2, 30, 4], ["T", 2, 23, 12, 3],
      ["B", 22, 31, 3, 19], ["P", 18, 46, 4], ["P", 25, 42, 4], ["P", 18, 38, 4], ["P", 25, 34, 4], ["T", 17, 27, 13, 3]],
    sp: [[8, 23], [23, 27], [11, 42], [26, 42], [7, 27]] },
  roots: { th: "forest", ops: [["F", 4], ["U", 2], ["F", 8], ["D", 2], ["F", 4], ["END"]],
    r: [["T", 0, 34, 10, 5], ["T", 20, 30, 12, 6], ["P", 12, 46, 4], ["P", 16, 42, 4], ["P", 12, 38, 4], ["P", 16, 34, 4], ["P", 15, 26, 4], ["T", 4, 22, 8, 3], ["P", 14, 18, 4], ["T", 20, 14, 8, 3]],
    sp: [[4, 34], [25, 30], [7, 22], [23, 14]] },
  // 광산: 두꺼운 천장과 갱도
  mineshaft: { th: "cave", ops: [["F", 8], ["Z"], ["F", 6], ["END"]],
    r: [["B", 0, 22, 14, 6], ["B", 18, 22, 14, 6], ["P", 2, 46, 6], ["P", 10, 42, 5], ["P", 20, 46, 6], ["P", 24, 42, 6], ["P", 14, 38, 4], ["P", 8, 34, 4], ["P", 20, 34, 4],
      ["P", 14, 30, 4], ["P", 14, 26, 4], ["T", 6, 18, 6, 2], ["P", 13, 14, 4], ["T", 20, 10, 7, 2]],
    sp: [[4, 22], [26, 22], [15, 38], [8, 18], [22, 10]] },
  tunnels: { th: "cave", ops: [["F", 32], ["END"]],
    r: [["B", 0, 38, 12, 3], ["B", 16, 38, 16, 3], ["B", 0, 26, 10, 4], ["B", 14, 26, 18, 4], ["P", 13, 46, 3], ["P", 13, 42, 3], ["P", 11, 34, 3], ["P", 11, 30, 3],
      ["T", 4, 22, 6, 2], ["T", 12, 18, 6, 2], ["T", 21, 14, 6, 2]],
    sp: [[5, 38], [24, 38], [5, 26], [22, 26], [14, 18]] },
  // 요새: 성벽 탑과 성가퀴 다리
  rampart: { th: "fortress", ops: [["F", 6], ["Z"], ["F", 6], ["END"]],
    r: [["B", 2, 34, 5, 16], ["B", 25, 30, 5, 20], ["B", 7, 34, 8, 2], ["B", 18, 30, 7, 2], ["P", 8, 46, 4], ["P", 12, 42, 4], ["P", 8, 38, 4],
      ["P", 20, 26, 4], ["B", 10, 22, 8, 2], ["P", 4, 18, 4], ["B", 10, 14, 10, 2]],
    sp: [[4, 34], [10, 34], [27, 30], [13, 22], [15, 14]] },
  forgehall: { th: "fortress", ops: [["F", 10], ["Z"], ["F", 4], ["END"]],
    r: [["B", 0, 24, 14, 4], ["B", 18, 24, 14, 4], ["P", 3, 46, 5], ["P", 9, 42, 4], ["P", 15, 38, 3], ["P", 21, 42, 4], ["P", 25, 46, 5], ["P", 14, 34, 5], ["P", 14, 30, 4], ["P", 15, 26, 2],
      ["B", 4, 20, 6, 2], ["P", 12, 16, 4], ["B", 18, 12, 8, 2]],
    sp: [[5, 24], [26, 24], [16, 34], [6, 20], [21, 12]] },
  // 설원: 가파른 협곡 절벽과 얼음 턱
  gorge: { th: "snow", ops: [["F", 2], ["S", 3], ["F", 3], ["S", 3], ["F", 3], ["S", 3], ["F", 3], ["D", 3], ["F", 2], ["END"]],
    r: [["P", 12, 37, 4], ["T", 18, 33, 7, 3], ["P", 12, 29, 4], ["T", 4, 25, 7, 3], ["P", 13, 21, 4], ["T", 19, 17, 8, 3]],
    sp: [[20, 33], [6, 25], [22, 17]] },
  icefall: { th: "snow", ops: [["F", 32], ["END"]],
    r: [["T", 3, 46, 5, 3], ["T", 10, 42, 5, 3], ["T", 17, 38, 5, 3], ["T", 24, 34, 6, 3], ["T", 17, 30, 5, 3], ["T", 9, 26, 6, 3], ["T", 2, 22, 5, 3], ["T", 9, 18, 7, 3], ["T", 17, 14, 7, 3]],
    sp: [[12, 42], [26, 34], [11, 26], [12, 18], [20, 14]] },
  // 사막: 경사 사구와 계단 피라미드
  dunes: { th: "desert", ops: [["U", 3], ["F", 2], ["D", 2], ["F", 1], ["U", 4], ["F", 3], ["D", 4], ["U", 2], ["F", 2], ["D", 3], ["END"]],
    r: [["P", 10, 41, 4], ["T", 4, 37, 6, 3], ["P", 12, 33, 4], ["T", 18, 29, 7, 3], ["P", 13, 25, 4], ["T", 5, 21, 6, 3], ["T", 13, 17, 7, 3]],
    sp: [[6, 37], [20, 29], [7, 21], [15, 17]] },
  pyramid: { th: "desert", ops: [["F", 32], ["END"]],
    r: [["B", 6, 46, 20, 4], ["B", 9, 42, 14, 4], ["B", 12, 38, 8, 4], ["B", 14, 34, 4, 4], ["P", 20, 30, 4], ["T", 25, 26, 6, 3], ["P", 20, 22, 4], ["T", 11, 18, 7, 3]],
    sp: [[8, 46], [24, 46], [11, 42], [15, 34], [27, 26], [13, 18]] },
  // 왕국 폐허: 기둥 회랑과 아치
  colonnade: { th: "kingdom", ops: [["F", 32], ["END"]],
    r: [["P", 6, 46, 4], ["B", 3, 42, 3, 8], ["P", 7, 38, 4], ["B", 12, 34, 3, 16], ["P", 16, 30, 4], ["B", 21, 26, 3, 24], ["P", 25, 22, 4], ["B", 29, 18, 3, 32], ["T", 14, 16, 12, 3], ["T", 4, 12, 8, 3]],
    sp: [[4, 42], [13, 34], [22, 26], [18, 16], [7, 12]] },
  // 심연: 솟은 어둠의 첨탑
  spires: { th: "abyss", ops: [["F", 32], ["END"]],
    r: [["P", 1, 46, 3], ["B", 4, 42, 3, 8], ["B", 10, 38, 3, 12], ["B", 16, 34, 3, 16], ["B", 22, 30, 3, 20], ["B", 28, 26, 3, 24], ["P", 23, 22, 4], ["T", 13, 18, 8, 3], ["T", 3, 14, 7, 3]],
    sp: [[5, 42], [11, 38], [17, 34], [23, 30], [29, 26], [16, 18], [6, 14]] },
};
export const _R = R;
// 테마별 조각 목록 (전용 + 공통)
const POOL = {
  plains: { village: 5, embers: 5, ascent: 2, ascent_m: 2, gardens: 2, gardens_m: 2, bastion: 1 },
  forest: { treehouse: 5, roots: 5, gardens: 2, gardens_m: 2, ascent: 1 },
  cave: { mineshaft: 5, tunnels: 5, cavern: 3, cavern_m: 3 },
  fortress: { rampart: 5, forgehall: 5, bastion: 3, bastion_m: 2 },
  snow: { gorge: 5, icefall: 5, cliffs: 2, cliffs_m: 2 },
  desert: { dunes: 5, pyramid: 5, cliffs: 2, ascent: 1 },
  kingdom: { colonnade: 5, bastion: 2, ascent: 2, ascent_m: 2, skyA: 3 },
  abyss: { spires: 5, cavern: 3, cavern_m: 2, bastion: 2 },
};
const GENTLE = ["meadow", "gardens", "gardens_m", "ascent", "ascent_m", "bastion", "overhangRun"];
const ALL = { ascent: 4, ascent_m: 4, cavern: 3, cavern_m: 3, cliffs: 3, cliffs_m: 2, gardens: 4, gardens_m: 4, bastion: 3, bastion_m: 3, islandHop: 2, bridge: 1, canyon: 1, skyA: 3 };
const HAZ = [["spikes", "spikes"], ["poison", "poison"], ["voidPool", "voidpool"], ["quicksand", "quicksand"], ["ice", "ice"], ["fireJet", "firetrap"], ["arcaneRune", "runes"]];

// ctx: { rng, region, dist, S, Ft, hazard(name), state: Map }
export function designChunk(b, ctx) {
  const { rng, region, Ft } = ctx;
  const st = ctx.state;
  let name = st.get(ctx.S);
  if (!name) {
    const prev = st.get(ctx.S - 1);
    const tp = POOL[region.theme] ?? ALL;
    const pool = ctx.dist < 120 ? Object.entries(tp).filter(([k]) => !/sky|cavern|tunnels|mineshaft/.test(k)).concat([["meadow", 1]]) : Object.entries(tp);
    for (let k = 0; k < 6; k++) {
      name = rng.weighted(pool, (e) => e[1])[0];
      if (name !== prev) break;
    }
  }
  name === "skyA" && st.set(ctx.S + 1, "skyB");
  st.set(ctx.S, name);
  b.blocks = b.blocks ?? [];
  // 조각마다 지면 높이가 달라진다 (2칸씩 오르내리는 길)
  const L = liftOf(st, ctx.S, rng);
  name === "skyA" && !st.has("L" + (ctx.S + 1)) && st.set("L" + (ctx.S + 1), L);
  const Ln = liftOf(st, ctx.S + 1, rng);
  const base = BASE_H + L, target = BASE_H + Ln;
  const ab = (row) => Math.max(2, row + TOP - L);
  if (b.h !== base) {
    const d = base - b.h;
    d > 0 ? b.rampUp(Math.min(3, d)) : b.rampDown(Math.min(3, -d));
  }
  b.setH(base);
  const surf = () => Ft - b.h;
  const A = ART[name], RT = R[name];
  for (const op of RT ? RT.ops : A ? A.ops : T[name]) {
    const [k, a, c, d, e] = op;
    switch (k) {
      case "F": b.flat(a); break;
      case "U": b.rampUp(a); break;
      case "D": b.rampDown(a); break;
      case "S": b.setH(b.h + a); break;
      case "P": b.pit(Math.min(a, b.room - 2)); break;
      case "I": b.blocks.push({ x: b.x + a, row: surf() - c, w: d, h: e, taper: 0.6 }); break;
      case "IA": b.blocks.push({ x: a, row: ab(56 - c), w: d, h: e, taper: 0.6 }); break;
      case "L": b.plats.push({ x: b.x + a, row: surf() - c, w: d, fixed: 1 }); break;
      case "LA": b.plats.push({ x: a, row: ab(56 - c), w: d, fixed: 1 }); break;
      case "C": b.plats.push({ x: b.x + a, row: surf() - c, w: d, crumble: !0, fixed: 1 }); break;
      case "CA": b.plats.push({ x: a, row: ab(56 - c), w: d, crumble: !0, fixed: 1 }); break;
      case "Z": {
        const hz = HAZ.find(([t]) => region.hazards?.includes(t));
        hz ? ctx.hazard(hz[1]) : b.flat(4);
        break;
      }
      case "END": {
        const need = b.h - target;
        need > 0 ? b.rampDown(need) : need < 0 && b.rampUp(-need);
        b.flat(b.room);
        break;
      }
    }
  }
  if (b.room > 0 && b.h !== target) {
    const need = b.h - target;
    need > 0 ? b.rampDown(Math.min(need, b.room)) : b.rampUp(Math.min(-need, b.room));
  }
  b.setH(target);
  b.flat(b.room);
  if (RT) {
    for (const [k, x, row, w, hh] of RT.r) {
      const rr = ab(row);
      if (k === "B") b.blocks.push({ x, row: rr, w, h: hh });
      else if (k === "T") b.blocks.push({ x, row: rr, w, h: hh, taper: 0.6 });
      else if (k === "P") b.plats.push({ x, row: rr, w, fixed: 1 });
      else if (k === "C") b.plats.push({ x, row: rr, w, crumble: !0, fixed: 1 });
    }
    b.extraSpawns = RT.sp.map(([x, r]) => ({ x, row: ab(r) }));
  }
  if (A) {
    A.art.forEach((row, i) => {
      const line = rle(row);
      for (let x = 0; x < 32; x++) {
        const ch = line[A.mirror ? 31 - x : x], r = ab(A.top + i);
        if (ch === "#") b.blocks.push({ x, row: r, w: 1, h: 1 });
        else if (ch === "=") b.plats.push({ x, row: r, w: 1, fixed: 1 });
        else if (ch === "~") b.plats.push({ x, row: r, w: 1, crumble: !0, fixed: 1 });
      }
    });
    b.extraSpawns = A.spawns.map(([x, r]) => ({ x, row: ab(r) }));
  }
  return name;
}

// 조각별 지면 높이 (0~8칸, 2칸씩 변화). 처음 몇 조각은 평탄.
function liftOf(st, S, rng) {
  const k = "L" + S;
  if (st.has(k)) return st.get(k);
  let v = 0;
  if (S > 2) {
    const p = st.has("L" + (S - 1)) ? st.get("L" + (S - 1)) : 0;
    const r = rng.next ? rng.next() : Math.random();
    v = Math.max(0, Math.min(8, p + (r < 0.3 ? -2 : r < 0.62 ? 2 : 0)));
  }
  st.set(k, v);
  return v;
}

// ── 지하 동굴: 두꺼운 땅 밑을 파서 굴과 내려가는 구멍을 만든다 ──
// r: 격자, l: 열별 지면 높이, codes: { fe, ze, plat }
export function carveCaves(r, l, slopeCols, vt, Ft, rng, codes, out) {
  const { fe, ze, plat } = codes;
  const at = (x, y) => r[y * vt + x];
  const set = (x, y, v) => (r[y * vt + x] = v);
  const floorTop = Ft - 3; // 바닥 3줄
  const caveTop = Ft - 9; // 굴 높이 6줄
  const ok = (x) => l[x] >= 12 && !slopeCols.has(x) && (() => { for (let y = Ft - l[x]; y < Ft; y++) if (at(x, y) !== fe) return !1; return !0; })();
  let a = -1;
  const spans = [];
  for (let x = 0; x <= vt; x++) {
    if (x < vt && ok(x)) a < 0 && (a = x);
    else if (a >= 0) (x - a >= 14 && spans.push([a, x - 1]), (a = -1));
  }
  if (!spans.length) return;
  const rnd = () => (rng.next ? rng.next() : Math.random());
  for (const [s0, s1] of spans) {
    if (rnd() < 0.25) continue;
    const x0 = s0 + 1, x1 = s1 - 1;
    // 굴 파기 (천장과 바닥이 조금씩 울퉁불퉁)
    for (let x = x0; x <= x1; x++) {
      const edge = x === x0 || x === x1;
      const top = caveTop + (edge ? 2 : rnd() < 0.3 ? 1 : 0);
      const bot = floorTop - 1 - (edge ? 1 : 0);
      for (let y = top; y <= bot; y++) set(x, y, ze);
    }
    // 바닥 돌기와 굴 속 발판
    for (let x = x0 + 4; x < x1 - 3; x += 5 + Math.floor(rnd() * 3)) rnd() < 0.5 && set(x, floorTop - 1, fe);
    // 내려가는 구멍 (왼쪽, 오른쪽): 가운데는 비워 떨어질 수 있고 가장자리 발판으로 다시 올라온다
    const shafts = [x0 + 1, x1 - 3];
    for (const sx of shafts) {
      let s = Ft;
      for (let x = sx; x < sx + 3; x++) s = Math.min(s, Ft - l[x]);
      for (let x = sx; x < sx + 3; x++) {
        for (let y = s; y < caveTop + 1; y++) set(x, y, ze);
        l[x] = 3;
      }
      const inner = sx === shafts[0] ? sx + 3 : sx - 3;
      for (let x = inner; x < inner + 3; x++) x >= x0 && x <= x1 && at(x, floorTop - 3) === ze && set(x, floorTop - 3, plat);
      let row = floorTop - 6, side = 0;
      while (row > s - 1) {
        const px = side ? sx + 2 : sx;
        at(px, row) === ze && set(px, row, plat);
        side ^= 1;
        row -= 3;
      }
      out.shafts.push([sx, 3]);
    }
    // 굴 속 적
    for (let k = 0; k < 2; k++) out.spawns.push({ x: x0 + 5 + Math.floor(rnd() * Math.max(1, x1 - x0 - 10)), row: floorTop });
    out.caves.push([x0, caveTop, x1 - x0 + 1, floorTop - caveTop]);
  }
}


