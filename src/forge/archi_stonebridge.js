// ══════════════════════════════════════════════════════════════
// 스톤브리지 「다리의 도시」 — 층마다 생김새가 다른 돌다리가 하늘을 가로지르고, 회백색 석회암 바위가 다리를 받친다
//   지도 = 칸(8px) 1024 × 1056 · 맨 아래 대교 줄 1000 (좌우 성문 출구) · ▲ = 꼭대기 성채 바위 동쪽 끝
//   층 (아래→위)
//     0  아치 대교 (줄 1000): 성문 탑 둘 · 다리 속 회랑 둘 · 도개교 · 무너진 경간 · 교각 밑 받침 바위
//     1  집 다리 (줄 830, 서쪽): 다리 위에 지붕·층수가 다른 집 여섯 — 길이 1층을 꿰뚫는다 · 도개교
//        수도교 (줄 790, 동쪽): 위는 동쪽으로 흐르는 물길, 아래 두 겹 아치 (작은 아치 회랑 · 큰 아치)
//     2  현수교 (줄 662): 두 주탑 사이 처진 다리, 주탑 꼭대기에서 다리 가운데로 쇠줄 (타고 내려간다)
//        석공 마당 바위 (서) · 사슬 감는 집 바위 (동, 레버 승강기 지름길)
//     3  성벽 다리 (줄 470, 서쪽): 성가퀴 · 성문 탑 둘 앞 도개교 · 다리 속 포대 방
//        종탑 다리 (줄 440, 동쪽): 가운데 종탑
//     4  개선문 다리 (줄 290): 석상이 늘어선 다리 한가운데 개선문 (다락 방), 그 위 성채 바위
//   길: 탑 속 계단·사다리로 층을 오른다 · 승강기 · 쇠줄 · 도개교 타이밍 · 물길 거슬러 헤엄
// ══════════════════════════════════════════════════════════════
import { PL, jag, nat, room, surf, climb, dropTo, rope_bridge, P_, mark, skyHole, skyBegin, skyEnd } from "./archi_sky.js";

// 벽돌 덩어리 (다리·탑·집 몸)
const brick = (K, x0, y0, x1, y1) => (K.rock(x0, y0, x1, y1), K.mat(x0, y0, x1, y1, "brick"));
// 다리 밑 아치 천장: [a, b) 사이 deck 밑에 d칸 깊이로 둥글게 (가운데가 가장 얕다)
//   아치 테 = 다듬은 돌 띠 (ring칸), 꼭대기 이맛돌 (아래로 살짝 내민다)
function vault(K, a, b, y, d, ring = 2) {
  for (let x = a; x < b; x++) {
    const v = Math.round(d * (1 - Math.sin((Math.PI * (x + 0.5 - a)) / (b - a))) ** 0.8);
    v > 0 && brick(K, x, y, x + 1, y + v);
    ring && K.mat(x, y + v - ring, x + 1, y + v, "trim");
  }
  if (ring && b - a >= 14) {
    const m = Math.round((a + b) / 2);
    K.rock(m - 1, y, m + 2, y + 2), K.mat(m - 2, y - 3, m + 3, y + 2, "trim");
  }
}
// 교각: 몸 + 받침단(넓게) + 중간 띠 + 머리(아치가 시작하는 곳)
function pier(K, a, b, top, bot) {
  brick(K, a, top, b, bot);
  brick(K, a - 2, bot - 5, b + 2, bot), K.mat(a - 2, bot - 5, b + 2, bot, "trim");
  K.mat(a, top + Math.round((bot - top) * 0.55), b, top + Math.round((bot - top) * 0.55) + 2, "trim");
  K.mat(a - 1, top, b + 1, top + 2, "trim");
}
// 다리 윗면 처마 띠 + 아치 사이 벽감 (교각 위)
function cornice(K, x0, x1, y, h = 2) {
  K.mat(x0, y + 1, x1, y + 1 + h, "trim");
}
function niche(K, cx, cy) {
  K.ell(cx, cy, 2.2, 3.2);
  K.rock(cx - 3, cy + 3, cx + 4, cy + 4), K.mat(cx - 3, cy - 4, cx + 4, cy + 4, "trim");
}
// 다리 위 난간·가로등 (이미 놓인 소품과 겹치지 않게)
function deckDeco(K, x0, x1, f, step = 16, lampEvery = 4, skip = []) {
  const near = (x) => (K.P.fixedProps ?? []).some((q) => Math.abs(q.x - (x * 8 + 4)) < 72 && Math.abs(q.y - f * 8) < 40) || skip.some(([a, b]) => x >= a && x < b);
  for (let x = x0 + 6, i = 0; x < x1 - 6; x += step, i++) {
    if (near(x)) continue;
    K.prop(x, f, i % lampEvery === lampEvery - 1 ? "p_lamp" : "p_balus");
  }
}
// 성가퀴 (톱니 위 끝)
const merlons = (K, x0, x1, y, step, w) => {
  for (let x = x0; x < x1; x += step) brick(K, x, y - 3, Math.min(x1, x + w), y);
};
// 교각 밑 받침 바위 (자연 석회암)
const footing = (K, a, b, y, d, seed) => nat(K, a, b, () => y, PL([[a, y + 4], [(a + b) / 2 + ((seed * 7) % 9) - 4, y + d], [b, y + 4]]), { sh: 3, roll: 0.5, fingers: 2, seed });

export function stonebridge(K) {
  skyBegin(K);
  mark(true);
  viaduct(K);
  houseBridge(K), aqueduct(K);
  mark(false);
  anchors2(K);
  mark(true);
  suspension(K);
  rampart(K), bellBridge(K);
  triumph(K);
  mark(false);
  citadel(K);
  ruins(K);
  skyEnd(K);
}
stonebridge.own = 1;

// ═══ 0 아치 대교 ═══
function viaduct(K) {
  const F = 1000;
  brick(K, 0, F, 300, F + 14), brick(K, 324, F, 640, F + 14), brick(K, 664, F, 1024, F + 14);
  K.draw(300, 324, F, "L", 0);
  K.crumble(640, 648, F), K.plank(648, 656, F), K.crumble(656, 664, F);
  // 교각 (경간 폭이 제각각) + 아치 + 받침 바위
  const piers = [[44, 58], [136, 150], [262, 278], [370, 384], [492, 508], [600, 612], [716, 732], [842, 856], [954, 968]];
  piers.forEach(([a, b], i) => (pier(K, a, b, F + 14, F + 40), footing(K, a - 8, b + 8, F + 38, 12 + (i % 3) * 3, 300 + i), niche(K, (a + b) >> 1, F + 22)));
  cornice(K, 0, 1024, F, 2);
  for (let i = 0; i + 1 < piers.length; i++) vault(K, piers[i][1], piers[i + 1][0], F + 14, 10 + (i % 3) * 4);
  vault(K, 0, piers[0][0], F + 14, 8), vault(K, piers[piers.length - 1][1], 1024, F + 14, 8);
  // 다리 속 회랑 둘 (서: 통행세 회랑 · 동: 창고 회랑)
  room(K, 96, 1003, 250, 1011, "brick"), climb(K, 104, F, 1011, "ladder", "brick"), climb(K, 240, F, 1011, "ladder", "brick");
  for (const x of [140, 190]) K.wall(x, 1003, x + 2, 1011, "stem");
  room(K, 744, 1003, 900, 1011, "brick"), climb(K, 752, F, 1011, "rope", "brick"), climb(K, 890, F, 1011, "ladder", "brick");
  K.crack(820, 1003, 824, 1011);
  P_(K, 120, 1011, "p_crates"), P_(K, 160, 1011, "p_rack"), P_(K, 212, 1011, "p_urn"), P_(K, 780, 1011, "p_crates"), P_(K, 806, 1011, "p_shelf"), P_(K, 860, 1011, "p_urn");
  K.tag(110, 1003, 236, 1011, "arena"), K.tag(826, 1003, 884, 1011, "treasure"), K.tag(760, 1003, 818, 1011, "arena");
  // 서쪽 성문 탑 (출구): 아래는 지나가는 문, 위 두 방
  brick(K, 0, 934, 46, 988), merlons(K, 0, 46, 934, 6, 3), K.mat(0, 934, 46, 938, "trim"), K.mat(0, 960, 46, 964, "trim"), K.mat(0, 984, 46, 988, "trim");
  room(K, 4, 944, 42, 958, "brick"), room(K, 4, 964, 42, 984, "brick"), K.air(0, 988, 46, F);
  climb(K, 36, 984, F, "ladder", "brick"), climb(K, 10, 958, 964, "ladder", "brick"), K.ladder(10, 958, 984);
  P_(K, 16, 958, "p_flags"), P_(K, 30, 984, "p_rack"), P_(K, 20, 958, "p_crates");
  K.tag(2, F - 12, 44, F, "rest", { safe: 1 }), K.tag(4, 944, 42, 958, "treasure");
  // 동쪽 성문 탑 (출구): 위가 무너진 등대탑
  brick(K, 978, 920, 1024, 988), K.mat(978, 950, 1024, 956, "trim"), K.mat(978, 984, 1024, 988, "trim");
  for (let x = 978; x < 1024; x += 5) brick(K, x, 914 - ((x * 7) % 5), x + 3, 920);
  room(K, 982, 930, 1020, 950, "brick"), room(K, 982, 956, 1020, 984, "brick"), K.air(978, 988, 1024, F);
  climb(K, 986, 984, F, "ladder", "brick"), climb(K, 1012, 950, 956, "rope", "brick"), K.rope(1012, 947, 984);
  P_(K, 1000, 950, "p_brazier", { sc: 1.3 }), P_(K, 996, 984, "p_shelf");
  K.tag(982, F - 12, 1022, F, "rest", { safe: 1 }), K.tag(982, 930, 1020, 950, "treasure");
  // 다리 위: 석상·등·분수
  for (const [x, k] of [[80, "p_statue"], [200, "p_brazier"], [350, "p_statue"], [430, "p_urn"], [560, "p_statue"], [700, "p_brazier"], [930, "p_statue"]]) P_(K, x, F, k);
  P_(K, 470, F, "p_font", { sc: 1.3 }), K.heal(464, 476, F - 4, F), K.tag(450, F - 12, 490, F, "rest");
  K.tag(150, F - 12, 290, F, "arena"), K.tag(520, F - 12, 630, F, "arena"), K.tag(680, F - 12, 840, F, "arena");
  deckDeco(K, 104, 960, F, 15, 4, [[296, 330], [636, 668]]);
  K.struct("아치 대교", "출구·전투·보물고", 0, 914, 1024, 1050);
  // 집 다리로 오르는 계단탑 (대교 위)
  brick(K, 62, 812, 100, F);
  room(K, 66, 966, 96, F, "brick"), K.air(62, 990, 66, F), K.air(96, 990, 100, F);
  room(K, 66, 930, 96, 960, "brick"), climb(K, 90, 960, 966, "ladder", "brick"), K.ladder(90, 960, F);
  room(K, 66, 892, 96, 924, "brick"), climb(K, 70, 924, 930, "ladder", "brick"), K.ladder(70, 924, 960);
  room(K, 66, 852, 96, 886, "brick"), climb(K, 88, 886, 892, "rope", "brick"), K.rope(88, 883, 924);
  room(K, 66, 816, 96, 830, "brick"), climb(K, 72, 830, 852, "ladder", "brick"), K.ladder(72, 830, 886), K.air(96, 822, 104, 830);
  P_(K, 80, 960, "p_flags"), P_(K, 80, 924, "p_shelf"), P_(K, 76, 886, "p_crates"), P_(K, 84, 830, "p_bell");
  K.tag(66, 892, 96, 924, "arena"), K.tag(66, 852, 96, 886, "treasure");
  K.struct("계단탑", "오르는 길", 62, 824, 100, F);
}

// ═══ 1 집 다리 (서) ═══
function houseBridge(K) {
  const D = 830;
  brick(K, 100, D, 330, D + 10), brick(K, 346, D, 540, D + 10);
  K.draw(330, 346, D, "R", 2.5);
  const piers = [[146, 160], [262, 276], [406, 420], [500, 512]];
  piers.forEach(([a, b], i) => (pier(K, a, b, D + 10, D + 52), footing(K, a - 14, b + 14, D + 48, 16 + i * 4, 400 + i), niche(K, (a + b) >> 1, D + 20)));
  cornice(K, 100, 540, D, 2);
  vault(K, 100, 146, D + 10, 14), vault(K, 160, 262, D + 10, 22), vault(K, 276, 406, D + 10, 26), vault(K, 420, 500, D + 10, 18), vault(K, 512, 540, D + 10, 10);
  // 받침 바위 속 방 (가운데 둘)
  room(K, 256, 880, 282, 890), climb(K, 268, D + 10, 890, "ladder", "brick");
  room(K, 400, 880, 426, 890), climb(K, 412, D + 10, 890, "rope", "brick");
  P_(K, 262, 890, "p_urn"), P_(K, 418, 890, "p_crates"), K.tag(256, 880, 282, 890, "treasure"), K.tag(400, 880, 426, 890, "treasure");
  // 집 여섯: [x0, x1, 층 높이들, 지붕]
  const HS = [
    [112, 150, [14, 12], "peak"], [166, 192, [12, 12, 10], "flat"], [204, 252, [16], "dome"],
    [360, 398, [12, 14], "crenel"], [430, 470, [14, 10, 10], "peak"], [484, 532, [16, 12], "flat"],
  ];
  HS.forEach(([x0, x1, hs, roof], n) => {
    let f = D;
    const tops = [];
    hs.forEach((h, i) => {
      // 위층은 양쪽으로 2칸 내밀고 나무 골조, 밑에 받침목
      const o = i > 0 ? 2 : 0;
      brick(K, x0 - o, f - h - 2, x1 + o, f);
      if (o) {
        K.mat(x0 - o, f - h - 2, x1 + o, f, "wood");
        for (const cx of [x0 - 2, x1 + 1]) K.rock(cx, f, cx + 1, f + 2), K.mat(cx, f, cx + 1, f + 2, "trim");
      } else K.mat(x0, f - 3, x1, f, "trim");
      room(K, x0 + 2, f - h, x1 - 2, f, i === 0 ? "brick" : "wood");
      i === 0 && (K.air(x0, f - 8, x0 + 2, f), K.air(x1 - 2, f - 8, x1, f));
      i > 0 && (climb(K, i % 2 ? x1 - 5 : x0 + 4, f, f + 2, "ladder", "wood"), K.ladder(i % 2 ? x1 - 5 : x0 + 4, f, f + 2 + hs[i - 1]));
      tops.push(f);
      f -= h + 2;
    });
    // 지붕
    const w = x1 - x0, cx = (x0 + x1) / 2;
    if (roof === "peak") for (let k = 0; k < w / 2; k++) brick(K, x0 + k, f - Math.min(k, w - k) / 1.6, x1 - k, f), (k = k);
    else if (roof === "dome") for (let x = x0; x < x1; x++) brick(K, x, f - Math.round(Math.sqrt(Math.max(0, 1 - ((x + 0.5 - cx) / (w / 2)) ** 2)) * 8), x + 1, f);
    else if (roof === "crenel") merlons(K, x0, x1, f, 5, 3);
    // 2층 발코니 (판자 + 난간): 바깥쪽 문
    if (hs.length > 1 && n % 2 === 0) {
      const g = tops[1];
      K.air(x1, g - 8, x1 + 2, g), K.plank(x1 + 2, x1 + 9, g), K.prop(x1 + 6, g, "p_balus");
    }
    // 지붕 처마 띠
    K.mat(x0 - (hs.length > 1 ? 2 : 0), f, x1 + (hs.length > 1 ? 2 : 0), f + 2, "trim");
    // 지붕으로 나가는 뚜껑
    climb(K, n % 2 ? x0 + 6 : x1 - 7, f, f + 2, "ladder", "wood"), K.ladder(n % 2 ? x0 + 6 : x1 - 7, f, f + 2 + hs[hs.length - 1]);
    K.tag(x0 + 2, D - hs[0], x1 - 2, D, n % 3 === 1 ? "treasure" : "arena");
    hs.length > 1 && K.tag(x0 + 2, tops[1] - hs[1], x1 - 2, tops[1], n % 2 ? "rest" : "treasure");
  });
  for (const [x, f, k] of [[124, D, "p_crates"], [140, D, "p_rack"], [176, D, "p_loom"], [230, D, "p_shelf"], [240, D, "p_urn"], [376, D, "p_cheese"], [446, D, "p_crates"], [500, D, "p_shelf"], [518, D, "p_urn"]]) P_(K, x, f, k);
  P_(K, 316, D, "p_brazier"), P_(K, 290, D, "p_statue");
  K.struct("집 다리", "전투·보물고·쉼터", 100, 760, 540, 902);
}

// ═══ 1 수도교 (동) ═══
function aqueduct(K) {
  const T = 790;
  brick(K, 580, T, 1012, 800);
  brick(K, 580, T - 6, 586, T), brick(K, 1006, T - 6, 1012, T);
  K.water(586, T - 5, 1006, T, "curR");
  // 작은 아치 회랑 (윗단) — 아래 걷는 길 820
  brick(K, 580, 820, 1012, 826);
  const small = [];
  for (let x = 580, i = 0; x < 1012; i++) {
    const w = 4, gap = 18 + (i % 3) * 4;
    small.push([x, x + w]);
    K.wall(x, 800, x + w, 820, "stem");
    x += w + gap;
    x < 1012 && vault(K, x - gap - w, Math.min(1012, x), 800, 7);
  }
  // 큰 아치 (아랫단) + 받침 바위
  const big = [[600, 614], [702, 718], [810, 826], [912, 928], [996, 1012]];
  big.forEach(([a, b], i) => (pier(K, a, b, 826, 880), footing(K, a - 16, b + 16, 876, 20 + (i % 2) * 10, 500 + i), niche(K, (a + b) >> 1, 838)));
  // 물길 테 (위) · 아랫단 띠
  K.mat(580, T - 6, 1012, T - 4, "trim"), K.mat(580, T, 1012, T + 2, "trim"), K.mat(580, 820, 1012, 822, "trim");
  for (let i = 0; i + 1 < big.length; i++) vault(K, big[i][1], big[i + 1][0], 826, 20);
  // 받침 바위 속 물탱크 방 (두 곳)
  room(K, 694, 880, 726, 892), climb(K, 710, 826, 892, "ladder", "brick"), K.air(700, 892, 720, 895), K.water(700, 892, 720, 895);
  room(K, 904, 880, 936, 892), climb(K, 920, 826, 892, "rope", "brick");
  P_(K, 698, 892, "p_urn"), P_(K, 914, 892, "p_crates"), K.tag(694, 880, 726, 892, "treasure"), K.tag(904, 880, 936, 892, "arena");
  // 승강기: 대교 → 회랑
  K.air(960, 812, 968, 1000), K.wall(960, 826, 968, 1000, "brick"), K.lift(960, 968, 820, 1000, 806);
  // 물길로 오르는 사다리 (회랑 → 위)
  climb(K, 640, T, 820, "ladder", "brick"), climb(K, 880, T, 820, "ladder", "brick");
  P_(K, 620, 820, "p_crates"), P_(K, 760, 820, "p_urn"), P_(K, 850, 820, "p_rack");
  K.tag(600, 806, 700, 820, "arena"), K.tag(730, 806, 860, 820, "arena"), K.tag(870, 806, 950, 820, "treasure");
  K.struct("수도교", "전투·보물고·물길", 580, 780, 1012, 906);
}

// ═══ 2 현수교 양쪽 바위 (자연 석회암, 속에 방) ═══
function anchors2(K) {
  // 석공 마당 (서)
  nat(K, 30, 210, jag(PL([[30, 612], [70, 602], [170, 604], [210, 614]]), 0.5, 1), jag(PL([[30, 622], [50, 676], [100, 724], [150, 716], [190, 668], [210, 620]]), 1.2, 2), { fingers: 4 });
  room(K, 52, 616, 190, 632), climb(K, 180, 604, 632, "ladder");
  room(K, 70, 646, 160, 660), climb(K, 80, 632, 660, "ladder");
  room(K, 96, 676, 140, 690), climb(K, 132, 660, 690, "rope");
  for (const x of [100, 130, 160]) K.wall(x, 616, x + 2, 632, "stem");
  P_(K, 64, 632, "p_rubble"), P_(K, 90, 632, "p_brokencol"), P_(K, 120, 632, "p_column", { e: { h: 14, w: 6 } }), P_(K, 150, 632, "p_statue", { sc: 0.8 });
  P_(K, 100, 660, "p_crates"), P_(K, 140, 660, "p_rack"), P_(K, 116, 690, "p_urn"), P_(K, 60, 603, "p_brokencol"), P_(K, 130, 603, "p_rubble");
  K.tag(52, 616, 190, 632, "arena"), K.tag(70, 646, 160, 660, "arena"), K.tag(96, 676, 140, 690, "treasure");
  K.struct("석공 마당 바위", "전투·보물고", 30, 590, 210, 724);
  // 사슬 감는 집 (동)
  nat(K, 820, 1014, jag(PL([[820, 650], [860, 640], [980, 640], [1014, 652]]), 0.5, 3), jag(PL([[820, 660], [846, 700], [900, 744], [960, 736], [1000, 690], [1014, 656]]), 1.2, 4), { fingers: 4 });
  room(K, 836, 652, 960, 666, "wood"), climb(K, 950, 640, 666, "ladder", "wood");
  room(K, 860, 680, 940, 694), climb(K, 870, 666, 694, "ladder");
  P_(K, 880, 666, "p_wheel", { sc: 1.2 }), P_(K, 910, 666, "p_rack"), P_(K, 940, 666, "p_crates"), P_(K, 900, 694, "p_urn");
  K.lever(846, 666, "winch");
  K.air(990, 432, 998, 642), K.lift(990, 998, 440, 640, 426, "winch", "down");
  K.tag(836, 652, 960, 666, "arena"), K.tag(860, 680, 940, 694, "treasure");
  K.struct("사슬 감는 집 바위", "전투·보물고·지름길", 820, 628, 1014, 744);
}

// ═══ 2 현수교 ═══
function suspension(K) {
  // 주탑 (서: 집 다리 위 · 동: 수도교 위)
  const tower = (x0, x1, top, base, doors) => {
    brick(K, x0, top, x1, base);
    merlons(K, x0, x1, top, 6, 3), K.mat(x0, top - 3, x1, top + 3, "trim");
    brick(K, x0 - 3, base - 8, x1 + 3, base), K.mat(x0 - 3, base - 8, x1 + 3, base, "trim");
    K.air(x0 - 3, base - 8, x1 + 3, base - 1);
    K.rock(x0 - 3, base - 8, x0, base - 6), K.rock(x1, base - 8, x1 + 3, base - 6);
    let f = base;
    const fl = [];
    while (f - 30 > top + 6) fl.push(f), (f -= 30);
    fl.forEach((g, i) => {
      room(K, x0 + 3, g - 24, x1 - 3, g, "brick");
      K.mat(x0, g, x1, g + 2, "trim"), K.air(x0, g - 16, x0 + 1, g - 10), K.air(x1 - 1, g - 16, x1, g - 10);
      i > 0 && (climb(K, i % 2 ? x1 - 7 : x0 + 6, g, fl[i - 1] - 24, "ladder", "brick"), K.ladder(i % 2 ? x1 - 7 : x0 + 6, g, fl[i - 1]));
    });
    climb(K, fl.length % 2 ? x1 - 7 : x0 + 6, top, fl[fl.length - 1] - 24, "ladder", "brick"), K.ladder(fl.length % 2 ? x1 - 7 : x0 + 6, top, fl[fl.length - 1]);
    for (const [side, f2] of doors) side < 0 ? K.air(x0 - 1, f2 - 8, x0 + 3, f2) : K.air(x1 - 3, f2 - 8, x1 + 1, f2);
    return fl;
  };
  const W = tower(286, 318, 556, 830, [[-1, 830], [1, 830], [-1, 620], [1, 650]]);
  const E = tower(690, 722, 568, 790, [[-1, 790], [1, 790], [-1, 640], [1, 640]]);
  void W, void E;
  // 주탑 안 바닥이 문 높이와 맞게: 문턱 판
  K.plank(318, 324, 650), K.plank(682, 690, 640);
  // 처진 다리 (가운데 낮다)
  rope_bridge(K, 324, 682, 650, 12, 6, 3);
  // 쇠줄: 주탑 꼭대기 → 다리 가운데 (타고 내려간다)
  K.zip(300, 552, 496, 656), K.zip(706, 564, 512, 656);
  // 매단 줄 (쇠줄 → 다리 판): 타고 오를 수도 있다
  const deckY = (x) => 650 + Math.round(12 * Math.sin((Math.PI * (x - 324)) / (682 - 324)));
  for (let x = 340; x < 490; x += 22) K.rope(x, Math.round(552 + ((x - 300) * 104) / 196), deckY(x));
  for (let x = 528; x < 690; x += 22) K.rope(x, Math.round(564 + ((706 - x) * 92) / 194), deckY(x));
  // 석공 마당 → 서 주탑 문 (줄 620)
  rope_bridge(K, 210, 286, 620, 4, 0);
  K.stairway(190, 604, 212, 620, 1);
  // 동 주탑 → 사슬 감는 집 (줄 640)
  rope_bridge(K, 722, 820, 640, 5, 4, 1);
  P_(K, 302, 556, "p_flags", { s: 2 }), P_(K, 706, 568, "p_flags"), P_(K, 500, 662, "p_brazier");
  K.tag(400, 640, 600, 662, "arena"), K.tag(290, 600, 314, 620, "treasure"), K.tag(694, 616, 718, 640, "treasure");
  K.struct("현수교", "전투·오르는 길", 286, 552, 722, 830);
}

// ═══ 3 성벽 다리 (서) ═══
function rampart(K) {
  const D = 470;
  brick(K, 40, D, 128, D + 16), brick(K, 150, D, 356, D + 16), brick(K, 380, D, 540, D + 16);
  K.draw(128, 150, D, "R", 1), K.draw(356, 380, D, "L", 4.5);
  merlons(K, 40, 128, D, 7, 3), merlons(K, 186, 356, D, 7, 3), merlons(K, 414, 540, D, 7, 3);
  for (const [a, b] of [[40, 128], [150, 356], [380, 540]]) {
    K.mat(a, D, b, D + 3, "trim");
    for (let x = a + 3; x < b - 3; x += 7) K.air(x, D + 3, x + 1, D + 5), K.mat(x - 1, D + 3, x + 2, D + 6, "trim");
  }
  vault(K, 40, 128, D + 16, 10), vault(K, 150, 356, D + 16, 24), vault(K, 380, 540, D + 16, 16);
  // 다리 속 포대 방 (창 = 바깥으로 뚫린 총안)
  room(K, 196, 474, 250, 484, "brick"), climb(K, 204, D, 484, "ladder", "brick"), K.air(250, 477, 254, 481);
  room(K, 280, 474, 340, 484, "brick"), climb(K, 330, D, 484, "rope", "brick");
  room(K, 430, 474, 520, 484, "brick"), climb(K, 438, D, 484, "ladder", "brick");
  P_(K, 220, 484, "p_rack"), P_(K, 240, 484, "p_crates"), P_(K, 300, 484, "p_urn"), P_(K, 470, 484, "p_rack"), P_(K, 500, 484, "p_crates");
  K.tag(196, 474, 250, 484, "arena"), K.tag(280, 474, 340, 484, "treasure"), K.tag(430, 474, 520, 484, "arena");
  // 성문 탑 1 (낮다): 문 통로 + 위 두 방
  brick(K, 150, 410, 186, D), K.mat(150, 434, 186, 436, "trim"), K.mat(150, 456, 186, 458, "trim");
  for (const [x, y] of [[152, 420], [183, 420], [152, 444], [183, 444]]) K.air(x, y, x + 1, y + 4);
  merlons(K, 150, 186, 410, 6, 3);
  K.air(150, D - 9, 186, D);
  room(K, 154, 440, 182, 456, "brick"), room(K, 154, 416, 182, 434, "brick");
  climb(K, 178, 456, D - 9, "ladder", "brick"), K.ladder(178, 456, D);
  climb(K, 158, 434, 440, "rope", "brick"), K.rope(158, 431, 456), climb(K, 176, 410, 416, "ladder", "brick"), K.ladder(176, 410, 434);
  P_(K, 168, 456, "p_flags"), P_(K, 166, 434, "p_crates");
  K.tag(154, 440, 182, 456, "arena"), K.tag(154, 416, 182, 434, "treasure");
  // 성문 탑 2 (높다): 개선문 다리(290)까지
  brick(K, 380, 290, 414, D);
  for (const y of [326, 362, 396, 426, 452]) K.mat(380, y, 414, y + 2, "trim");
  for (const y of [312, 344, 380, 412]) K.air(381, y, 382, y + 5), K.air(412, y, 413, y + 5);
  K.air(380, D - 9, 414, D);
  let prev = D, prevTop = D - 9;
  for (const [f, h, k] of [[452, 14, "ladder"], [426, 18, "rope"], [396, 22, "ladder"], [362, 26, "vine"], [326, 22, "ladder"]]) {
    room(K, 384, f - h, 410, f, "brick");
    const x = k === "rope" ? 388 : k === "vine" ? 404 : 396;
    climb(K, x, f, prevTop, k, "brick"), k === "ladder" ? K.ladder(x, f, prev) : k === "rope" ? K.rope(x, f - 3, prev) : K.vine(x - 1, x + 2, f - 3, prev);
    (prev = f), (prevTop = f - h);
  }
  climb(K, 392, 290, 304, "ladder", "brick"), K.ladder(392, 290, 326);
  P_(K, 396, 452, "p_flags"), P_(K, 400, 426, "p_rack"), P_(K, 392, 396, "p_shelf"), P_(K, 398, 362, "p_bell"), P_(K, 396, 326, "p_crates");
  K.tag(384, 404, 410, 426, "arena"), K.tag(384, 340, 410, 362, "treasure"), K.tag(384, 304, 410, 326, "arena");
  K.tag(60, D - 12, 126, D, "arena"), K.tag(240, D - 12, 350, D, "arena"), K.tag(420, D - 12, 530, D, "arena");
  deckDeco(K, 192, 350, D, 21, 3), deckDeco(K, 420, 536, D, 21, 3);
  P_(K, 90, D, "p_statue"), P_(K, 260, D, "p_brazier"), P_(K, 470, D, "p_statue"), P_(K, 520, D, "p_brazier");
  // 석공 마당 위 계단탑 (줄 604 → 470)
  brick(K, 56, D, 92, 604);
  room(K, 60, 574, 88, 604, "brick"), K.air(56, 596, 60, 604), K.air(88, 596, 92, 604);
  room(K, 60, 540, 88, 568, "brick"), climb(K, 84, 568, 574, "ladder", "brick"), K.ladder(84, 568, 604);
  room(K, 60, 506, 88, 534, "brick"), climb(K, 64, 534, 540, "rope", "brick"), K.rope(64, 531, 568);
  room(K, 60, 488, 88, 500, "brick"), climb(K, 82, 500, 506, "ladder", "brick"), K.ladder(82, 500, 534);
  climb(K, 70, D, 488, "ladder", "brick"), K.ladder(70, D, 500);
  P_(K, 74, 604, "p_crates"), P_(K, 72, 568, "p_shelf"), P_(K, 76, 534, "p_rack"), K.tag(60, 540, 88, 568, "treasure");
  K.stairway(540, 470, 600, 440, 2), K.mat(540, 440, 600, 474, "brick");
  K.struct("성벽 다리", "전투·보물고·오르는 길", 40, 290, 540, 604);
}

// ═══ 3 종탑 다리 (동) ═══
function bellBridge(K) {
  const D = 440;
  brick(K, 600, D, 990, D + 8);
  const piers = [[650, 662], [736, 748], [828, 842], [930, 944]];
  piers.forEach(([a, b], i) => (pier(K, a, b, D + 8, D + 44), footing(K, a - 12, b + 12, D + 40, 14 + i * 3, 600 + i), niche(K, (a + b) >> 1, D + 16)));
  cornice(K, 600, 990, D, 2);
  vault(K, 600, 650, D + 8, 12), vault(K, 662, 736, D + 8, 18), vault(K, 748, 828, D + 8, 20), vault(K, 842, 930, D + 8, 18), vault(K, 944, 990, D + 8, 10);
  // 종탑: 위로 갈수록 좁아지는 세 단, 맨 위 종 (개선문 다리 밑까지)
  brick(K, 760, 360, 800, D), brick(K, 766, 330, 794, 360), brick(K, 772, 306, 788, 330);
  K.mat(758, 358, 802, 362, "trim"), K.mat(764, 328, 796, 332, "trim"), K.mat(770, 304, 790, 307, "trim");
  brick(K, 756, D - 10, 804, D - 8), K.mat(756, D - 10, 804, D - 8, "trim");
  K.air(760, D - 9, 800, D);
  room(K, 764, 404, 796, 428, "brick"), climb(K, 792, 428, D - 9, "ladder", "brick"), K.ladder(792, 428, D);
  room(K, 764, 366, 796, 398, "brick"), climb(K, 768, 398, 404, "ladder", "brick"), K.ladder(768, 398, 428);
  room(K, 770, 336, 790, 356, "brick"), climb(K, 786, 356, 366, "rope", "brick"), K.rope(786, 353, 398);
  K.air(774, 310, 786, 330), climb(K, 776, 330, 336, "ladder", "brick"), K.ladder(776, 330, 356);
  climb(K, 780, 300, 310, "ladder", "brick"), K.ladder(780, 290, 330), K.air(779, 290, 782, 306), K.plank(779, 782, 290);
  P_(K, 780, 330, "p_bell", { sc: 1.6 }), P_(K, 776, 398, "p_bell"), P_(K, 788, 428, "p_rack"), P_(K, 780, 356, "p_candles");
  K.tag(764, 404, 796, 428, "arena"), K.tag(764, 366, 796, 398, "treasure");
  for (const [x, k] of [[630, "p_statue"], [700, "p_brazier"], [860, "p_statue"], [900, "p_urn"]]) P_(K, x, D, k);
  K.tag(610, D - 12, 750, D, "arena"), K.tag(810, D - 12, 980, D, "arena");
  // 사슬 감는 집 위 계단탑 (640 → 440)
  brick(K, 956, D + 8, 988, 642);
  room(K, 960, 612, 984, 642, "brick"), K.air(956, 632, 960, 642);
  room(K, 960, 576, 984, 606, "brick"), climb(K, 980, 606, 612, "ladder", "brick"), K.ladder(980, 606, 642);
  room(K, 960, 540, 984, 570, "brick"), climb(K, 964, 570, 576, "vine", "brick"), K.vine(963, 966, 567, 606);
  room(K, 960, 500, 984, 534, "brick"), climb(K, 978, 534, 540, "ladder", "brick"), K.ladder(978, 534, 570);
  room(K, 960, 456, 984, 494, "brick"), climb(K, 966, 494, 500, "rope", "brick"), K.rope(966, 491, 534);
  climb(K, 974, D, 456, "ladder", "brick"), K.ladder(974, D, 494);
  P_(K, 970, 642, "p_crates"), P_(K, 972, 570, "p_shelf"), P_(K, 970, 534, "p_urn"), K.tag(960, 540, 984, 570, "treasure"), K.tag(960, 456, 984, 494, "arena");
  deckDeco(K, 600, 956, D, 14, 3, [[756, 804]]);
  K.struct("종탑 다리", "전투·보물고·오르는 길", 600, 300, 990, 642);
}

// ═══ 4 개선문 다리 ═══
function triumph(K) {
  const D = 290;
  brick(K, 190, D, 850, D + 10);
  const piers = [[240, 254], [330, 344], [600, 614], [700, 714], [800, 814]];
  piers.forEach(([a, b], i) => (pier(K, a, b, D + 10, D + 40), footing(K, a - 10, b + 10, D + 36, 12 + (i % 3) * 5, 700 + i), niche(K, (a + b) >> 1, D + 18)));
  cornice(K, 190, 850, D, 2);
  vault(K, 190, 240, D + 10, 10), vault(K, 254, 330, D + 10, 16), vault(K, 344, 380, D + 10, 8), vault(K, 414, 600, D + 10, 30), vault(K, 614, 700, D + 10, 16), vault(K, 714, 800, D + 10, 16), vault(K, 814, 850, D + 10, 8);
  // 개선문: 가운데 큰 문 + 양 기둥 속 방 + 다락
  brick(K, 470, 226, 574, D);
  K.air(500, 252, 544, D), skyHole(K, 522, 272, 23, 21), skyHole(K, 522, 284, 23, 8);
  for (let x = 500; x < 544; x++) brick(K, x, 252, x + 1, 252 + Math.round(8 * (1 - Math.sin((Math.PI * (x + 0.5 - 500)) / 44)) ** 0.7));
  room(K, 474, 258, 496, D, "brick"), room(K, 548, 258, 570, D, "brick");
  K.air(470, D - 9, 474, D), K.air(570, D - 9, 574, D), K.air(496, D - 9, 500, D), K.air(544, D - 9, 548, D);
  room(K, 476, 232, 568, 250, "brick");
  climb(K, 480, 250, 258, "ladder", "brick"), K.ladder(480, 250, D), climb(K, 564, 250, 258, "rope", "brick"), K.rope(564, 247, D);
  climb(K, 512, 226, 232, "ladder", "brick"), K.ladder(512, 226, 250);
  merlons(K, 470, 574, 226, 8, 4);
  K.mat(470, 226, 574, 232, "trim"), K.mat(470, 250, 574, 258, "trim");
  for (const x of [470, 496, 544, 570]) K.mat(x, 258, x + 4, D - 9, "stem");
  for (const x of [482, 556]) K.mat(x - 4, 236, x + 4, 246, "trim");
  P_(K, 486, 226, "p_statue", { sc: 1.5 }), P_(K, 522, 226, "p_flags", { s: 2 }), P_(K, 558, 226, "p_statue", { sc: 1.5 });
  P_(K, 486, D, "p_statue", { sc: 1.2 }), P_(K, 560, D, "p_statue", { sc: 1.2 }), P_(K, 492, 250, "p_flags"), P_(K, 540, 250, "p_shelf"), P_(K, 526, 250, "p_candles");
  K.tag(476, 232, 568, 250, "treasure", { big: 1 }), K.tag(474, 258, 496, D, "arena"), K.tag(548, 258, 570, D, "arena");
  for (const x of [210, 290, 370, 440, 620, 680, 760, 830]) P_(K, x, D, x % 3 ? "p_statue" : "p_brazier");
  K.tag(200, D - 12, 460, D, "arena"), K.tag(590, D - 12, 840, D, "arena");
  deckDeco(K, 190, 850, D, 14, 3, [[376, 418], [466, 578]]);
  K.struct("개선문 다리", "전투·보물고", 190, 222, 850, 336);
}

// ═══ 꼭대기 성채 바위 ═══
function citadel(K) {
  nat(K, 396, 652, jag(PL([[396, 124], [440, 110], [600, 108], [652, 120]]), 0.5, 5), jag(PL([[396, 134], [420, 170], [470, 196], [524, 204], [580, 196], [630, 166], [652, 128]]), 1.0, 6), { fingers: 0 });
  for (const [x, L] of [[420, 18], [446, 26], [610, 22], [632, 14]]) for (let j = 0; j < L; j++) {
    const hw = 3 * (1 - j / L) ** 0.8, y = 150 + Math.round((x - 396) * 0.0) + (x < 500 ? (x - 396) * 0.5 : (652 - x) * 0.6);
    hw > 0.4 && K.rock(Math.round(x - hw), Math.round(y) + j, Math.round(x + hw) + 1, Math.round(y) + j + 1);
  }
  // 성채 건물 (바위 위)
  mark(true);
  brick(K, 460, 70, 580, 110);
  merlons(K, 460, 580, 70, 8, 4);
  room(K, 464, 78, 576, 108, "brick"), K.air(460, 100, 464, 108), K.air(576, 100, 580, 108);
  K.plank(468, 500, 92), K.ladder(498, 92, 108), K.plank(540, 572, 92), K.ladder(542, 92, 108);
  climb(K, 470, 70, 78, "ladder", "brick"), K.ladder(470, 70, 92);
  mark(false);
  // 바위 속: 왕좌 홀 · 지하 묘실
  room(K, 430, 128, 620, 158, "brick");
  for (const x of [470, 500, 550, 580]) K.wall(x, 128, x + 3, 158, "stem");
  climb(K, 520, 108, 128, "ladder", "brick"), K.ladder(520, 108, 158);
  room(K, 460, 172, 590, 190), climb(K, 576, 158, 190, "ladder");
  dropTo(K, 522, 190, "ladder");
  K.peak(600, surf(K, 600, 104));
  P_(K, 520, 158, "p_altar", { sc: 1.4 }), P_(K, 446, 158, "p_brazier"), P_(K, 604, 158, "p_brazier"), P_(K, 486, 158, "p_flags");
  P_(K, 480, 190, "p_sarcoph"), P_(K, 540, 190, "p_candles"), P_(K, 560, 190, "p_urn");
  P_(K, 484, 108, "p_shelf"), P_(K, 520, 108, "p_lectern"), P_(K, 556, 108, "p_crates"), P_(K, 520, 70, "p_flags", { s: 2 });
  P_(K, 420, 112, "p_statue"), P_(K, 640, 118, "p_statue");
  K.tag(430, 128, 620, 158, "arena", { big: 1, elite: 1 }), K.tag(460, 172, 590, 190, "treasure"), K.tag(464, 78, 576, 108, "rest"), K.tag(596, 96, 636, 108, "rest", { safe: 1 });
  K.struct("성채 바위", "출구·정예·보물고", 396, 62, 652, 210);
}

// ═══ 무너진 다리 조각들 (층 사이 빈 하늘): 떠 있는 바위에 얹힌 옛 다리 토막 — 속에 작은 방 ═══
function ruins(K) {
  const R = [
    // [x0, x1, 윗면, 깊이, 토막 길이, 방]
    [210, 290, 740, 40, 1, [222, 750, 262, 760]],
    [560, 640, 690, 36, 1, [574, 700, 610, 710]],
    [60, 140, 380, 44, 1, [74, 390, 118, 400]],
    [560, 650, 360, 40, 1, [576, 370, 624, 380]],
    [870, 960, 300, 44, 1, [884, 310, 930, 320]],
    [80, 180, 200, 50, 1, [96, 210, 150, 222]],
    [700, 800, 160, 46, 1, [716, 170, 776, 182]],
    [240, 330, 120, 40, 1, [254, 130, 300, 140]],
  ];
  R.forEach(([a, b, t, d, , rm], i) => {
    nat(K, a, b, jag(() => t, 0.4, 80 + i), jag(PL([[a, t + 8], [a + (b - a) * 0.3, t + d * 0.8], [(a + b) / 2, t + d], [b - (b - a) * 0.25, t + d * 0.7], [b, t + 8]]), 1, 90 + i), { fingers: 2 });
    // 토막마다 위에 남은 것이 다르다
    const [r0, r1, r2, r3] = rm, mid = (a + b) >> 1;
    if (i === 0) {
      // 등불 기둥이 남은 통행 다리 끝 · 밑은 둥근 굴
      brick(K, a + 6, t - 4, b - 14, t), P_(K, a + 12, t - 4, "p_brazier"), P_(K, b - 22, t - 4, "p_brazier"), P_(K, mid - 4, t - 4, "p_statue");
      K.ell((r0 + r2) / 2, r3 - 5, (r2 - r0) / 2, 6), K.rock(r0, r3, r2, r3 + 2), K.wall(r0 + 2, r1, r2 - 2, r3, "rock"), climb(K, r2 - 6, t - 4, r1 + 2, "ladder");
    } else if (i === 1) {
      // 작은 예배당 (둥근 지붕) · 밑은 납골실
      brick(K, mid - 14, t - 18, mid + 14, t), room(K, mid - 12, t - 14, mid + 12, t, "brick"), K.air(mid - 14, t - 8, mid - 12, t);
      for (let x = mid - 14; x < mid + 14; x++) brick(K, x, t - 18 - Math.round(Math.sqrt(Math.max(0, 1 - ((x + 0.5 - mid) / 14) ** 2)) * 6), x + 1, t - 18);
      P_(K, mid, t, "p_altar"), P_(K, mid + 8, t, "p_candles");
      room(K, r0, r1, r2, r3, "brick"), climb(K, mid + 6, t, r3, "ladder", "brick"), P_(K, r0 + 6, r3, "p_sarcoph");
    } else if (i === 2) {
      // 높은 교각 그루터기: 속에 방, 꼭대기는 망보는 자리
      brick(K, mid - 8, t - 34, mid + 8, t), room(K, mid - 5, t - 26, mid + 5, t - 4, "brick"), K.air(mid - 8, t - 12, mid - 5, t - 4);
      climb(K, mid + 2, t - 34, t - 26, "ladder", "brick"), K.ladder(mid + 2, t - 34, t - 4);
      room(K, r0, r1, r2, r3), climb(K, r2 - 4, t, r3, "rope"), P_(K, mid, t - 34, "p_flags");
      K.tag(mid - 10, t - 46, mid + 10, t - 34, "vista");
    } else if (i === 3) {
      // 성가퀴가 남은 성벽 토막 · 밑 경비실
      brick(K, a + 6, t - 4, b - 8, t), merlons(K, a + 6, b - 8, t - 4, 6, 3);
      room(K, r0, r1, r2, r3, "brick"), climb(K, r2 - 4, t - 4, r3, "ladder", "brick"), P_(K, r0 + 8, r3, "p_rack");
    } else if (i === 4) {
      // 부서진 망루가 서는 받침 (토막만)
      brick(K, a + 10, t - 4, b - 8, t);
      room(K, r0, r1, r2, r3), climb(K, r2 - 4, t - 4, r3, "ladder");
    } else if (i === 5) {
      // 허공에서 끊긴 돌계단 · 밑은 둥근 굴
      K.stairway(a + 14, t - 2, a + 44, t - 26, 2), K.mat(a + 14, t - 28, a + 46, t, "brick"), P_(K, a + 44, t - 26, "p_brokencol");
      K.ell((r0 + r2) / 2, r3 - 6, (r2 - r0) / 2, 7), K.rock(r0, r3, r2, r3 + 2), K.wall(r0 + 2, r1, r2 - 2, r3, "rock"), climb(K, r2 - 8, t, r1 + 2, "rope");
    } else if (i === 6) {
      // 문틀만 남은 성문 · 밑 방 안쪽 금 간 벽 너머 숨은 방
      brick(K, mid - 16, t - 26, mid - 10, t), brick(K, mid + 10, t - 26, mid + 16, t), brick(K, mid - 18, t - 30, mid + 18, t - 26);
      room(K, r0, r1, r2, r3, "brick"), climb(K, r2 - 4, t, r3, "ladder", "brick"), K.crack(r0 - 4, r3 - 8, r0, r3), room(K, r0 - 14, r3 - 8, r0 - 4, r3, "brick");
      P_(K, r0 - 9, r3, "p_urn"), K.tag(r0 - 14, r3 - 8, r0 - 4, r3, "treasure");
    } else {
      // 물 마른 분수 (돌 테 · 회복 샘) · 밑 저수 방
      brick(K, mid - 16, t - 3, mid - 13, t), brick(K, mid + 13, t - 3, mid + 16, t), P_(K, mid, t, "p_font", { sc: 1.4 }), K.heal(mid - 6, mid + 6, t - 4, t);
      room(K, r0, r1, r2, r3), K.air(r0 + 4, r3, r2 - 4, r3 + 3), K.water(r0 + 4, r3, r2 - 4, r3 + 3), climb(K, r2 - 4, t, r3, "ladder");
    }
    P_(K, (rm[0] + rm[2]) >> 1, rm[3], ["p_urn", "p_bones", "p_rubble", "p_crates", "p_shelf", "p_nest", "p_candles", "p_urn"][i]);
    K.tag(rm[0], rm[1], rm[2], rm[3], i % 2 ? "treasure" : "arena");
    K.struct(["등불 다리 끝", "작은 예배당 바위", "교각 그루터기", "성벽 토막", "망루 받침 바위", "끊긴 돌계단 바위", "문틀 바위", "마른 분수 바위"][i], "전투·보물고", a, t - 34, b, t + d);
  });
  // ── 대교와 집 다리 사이 ──
  // 대장간 바위: 화로·모루 선반, 굴뚝 구멍
  nat(K, 296, 384, jag(PL([[296, 912], [320, 906], [370, 906], [384, 912]]), 0.4, 130), jag(PL([[296, 918], [312, 944], [340, 956], [370, 944], [384, 918]]), 1.1, 131), { fingers: 2 });
  room(K, 306, 914, 374, 928), K.air(352, 906, 356, 914), climb(K, 314, 906, 928, "ladder");
  dropTo(K, 340, 928, "rope"), dropTo(K, 330, 906, "rope");
  P_(K, 330, 928, "p_brazier", { sc: 1.4 }), P_(K, 350, 928, "p_rack"), P_(K, 364, 928, "p_crates"), K.tag(306, 914, 374, 928, "arena");
  K.struct("대장간 바위", "전투", 296, 900, 384, 956);
  // 저수조 바위: 물이 고인 둥근 물탱크 방 (물속 바닥에 보물)
  nat(K, 632, 704, jag(PL([[632, 918], [650, 912], [690, 912], [704, 918]]), 0.4, 132), jag(PL([[632, 924], [646, 950], [670, 962], [694, 948], [704, 924]]), 1.1, 133), { fingers: 2 });
  K.ell(668, 934, 26, 10), K.rock(640, 940, 696, 946), K.water(644, 928, 692, 940), K.wall(646, 926, 690, 940, "rock"), climb(K, 690, 912, 930, "ladder");
  dropTo(K, 668, 940, "rope"), dropTo(K, 656, 912, "rope");
  K.tag(648, 930, 688, 940, "treasure");
  K.struct("저수조 바위", "보물고·물", 632, 900, 704, 962);
  // 새장 바위: 천장에 매달린 새장들 · 바위 밑 둥지
  nat(K, 770, 852, jag(PL([[770, 916], [790, 910], [840, 910], [852, 916]]), 0.4, 134), jag(PL([[770, 922], [786, 946], [810, 958], [838, 944], [852, 922]]), 1.1, 135), { fingers: 3 });
  room(K, 780, 918, 842, 934), climb(K, 836, 910, 934, "rope");
  dropTo(K, 800, 934, "ladder");
  K.prop(792, 918, "p_cage"), K.prop(812, 918, "p_cage"), K.prop(830, 918, "p_cage");
  P_(K, 800, 934, "p_nest"), K.tag(780, 918, 842, 934, "arena");
  K.struct("새장 바위", "전투", 770, 900, 852, 958);
  // ── 모양이 다른 잔해 넷 ──
  // 물 새는 수도교 토막: 끊긴 물길 끝에서 물이 하늘로 쏟아진다 (서 주탑 740 문에서 판자)
  nat(K, 372, 520, jag(() => 742, 0.4, 120), jag(PL([[372, 750], [400, 780], [446, 792], [494, 776], [520, 750]]), 1.1, 121), { fingers: 3 });
  brick(K, 380, 730, 512, 742), brick(K, 380, 724, 386, 730), brick(K, 506, 724, 512, 730);
  K.water(386, 725, 506, 730, "curR"), K.fallw(512, 726, 518, 800);
  for (let x = 392; x < 500; x += 26) vault(K, x, x + 20, 742, 5);
  room(K, 410, 752, 480, 764), climb(K, 470, 730, 764, "ladder", "brick");
  K.air(318, 732, 322, 740), rope_bridge(K, 322, 380, 740, 3, 4, 1);
  dropTo(K, 440, 764, "rope");
  P_(K, 430, 764, "p_urn"), P_(K, 456, 764, "p_brokencol"), K.tag(410, 752, 480, 764, "treasure");
  K.struct("물 새는 수도교 토막", "보물고·물길", 372, 720, 520, 792);
  // 떨어진 종 바위: 바위 구덩이에 박힌 큰 종, 구덩이 밑 종지기 방
  nat(K, 556, 660, jag(PL([[556, 566], [590, 560], [630, 562], [660, 570]]), 0.5, 122), jag(PL([[556, 574], [576, 604], [610, 620], [646, 600], [660, 572]]), 1.1, 123), { fingers: 2 });
  K.air(590, 554, 626, 568), K.rock(586, 568, 630, 571);
  room(K, 572, 582, 640, 594), climb(K, 618, 568, 594, "rope");
  dropTo(K, 600, 594, "rope");
  P_(K, 608, 568, "p_bell", { sc: 2.2 }), P_(K, 584, 594, "p_candles"), P_(K, 630, 594, "p_rubble"), K.tag(572, 582, 640, 594, "arena");
  K.struct("떨어진 종 바위", "전투", 556, 548, 660, 620);
  // 부서진 망루: 토막 5 위에 선 반쯤 무너진 탑 (방 셋)
  mark(true);
  brick(K, 882, 176, 926, 300);
  for (let x = 882; x < 926; x += 4) brick(K, x, 168 + ((x * 13) % 9), x + 3, 176);
  room(K, 886, 274, 922, 296, "brick"), room(K, 886, 238, 922, 266, "brick"), room(K, 886, 192, 922, 230, "brick");
  K.air(922, 288, 926, 296), climb(K, 916, 266, 274, "ladder", "brick"), K.ladder(916, 266, 296), climb(K, 890, 230, 238, "rope", "brick"), K.rope(890, 227, 266);
  climb(K, 904, 176, 192, "ladder", "brick"), K.ladder(904, 176, 230);
  mark(false);
  P_(K, 900, 296, "p_rack"), P_(K, 906, 266, "p_shelf"), P_(K, 900, 230, "p_brazier"), K.tag(886, 238, 922, 266, "treasure"), K.tag(886, 192, 922, 230, "arena");
  K.struct("부서진 망루", "전투·보물고", 882, 166, 926, 300);
  // 아치 조각 바위: 떠 있는 바위에 얹힌 아치 하나 (위를 걸어 건넌다), 아치 밑 둥지 굴
  nat(K, 30, 176, jag(() => 132, 0.4, 124), jag(PL([[30, 140], [60, 166], [104, 178], [150, 164], [176, 140]]), 1.1, 125), { fingers: 3 });
  brick(K, 44, 96, 58, 132), brick(K, 148, 96, 162, 132), brick(K, 44, 88, 162, 96), vault(K, 58, 148, 96, 14);
  room(K, 70, 140, 140, 152), climb(K, 128, 132, 152, "ladder");
  climb(K, 51, 88, 132, "ladder", "brick");
  dropTo(K, 104, 152, "rope");
  P_(K, 100, 132, "p_statue", { sc: 1.3 }), P_(K, 80, 152, "p_nest"), P_(K, 120, 152, "p_urn"), K.tag(70, 140, 140, 152, "treasure"), K.tag(60, 120, 146, 132, "arena");
  K.struct("아치 조각 바위", "전투·보물고", 30, 84, 176, 178);
  // 토막 잇기 (오르는 길 보조): 아래 다리에서 위 토막으로 밧줄
  dropTo(K, 250, 760, "rope");
  dropTo(K, 600, 710, "rope");
  dropTo(K, 100, 400, "rope");
  dropTo(K, 610, 380, "rope");
  dropTo(K, 920, 320, "rope");
  dropTo(K, 130, 222, "rope");
  dropTo(K, 760, 182, "rope");
  dropTo(K, 298, 140, "rope");
}
