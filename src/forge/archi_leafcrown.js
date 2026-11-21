// ══════════════════════════════════════════════════════════════
// 리프크라운 「하늘에 뜬 숲」 — 뿌리 덩이 흙섬마다 종이 다른 거대한 나무가 서고, 나무와 나무를 가지·덩굴 그네로 건넌다
//   지도 = 칸(8px) 1024 × 1056 · 맨 아래 뿌리섬 길 줄 1000 (좌우 출구) · ▲ = 가운데 거목 수관 꼭대기
//   나무 (모양·속 짜임이 모두 다르다)
//     거목 (가운데): 줄기 속 다섯 마디 — 뿌리 홀 · 선반 버섯 굴뚝 · 옹이 웅덩이 · 덩굴 굴뚝 · 심장 방(정예), 위 수관 잎 홀
//     참나무 (서): 속 빈 줄기의 나무집 네 층, 둥근 수관 속 잎 방 · 버드나무: 수관에서 늘어진 덩굴 커튼
//     소나무 (동): 줄기를 감은 덩굴과 층층 잎 단 · 자작나무 숲섬: 가는 줄기 셋에 매단 오두막과 출렁다리
//     거대 버섯 섬 · 죽은 고목(속 빈 거미 굴) · 어미새 둥지 섬 · 반딧불 이끼 연못 섬
//   길: 줄기 속을 올라 가지 문으로 나가 가지를 걸어 이웃 나무로 · 덩굴 그네(새) · 튕김 버섯 · 늘어진 뿌리 덩굴
// ══════════════════════════════════════════════════════════════
import { PL, jag, fbm, nat, hollow, room, surf, climb, dropTo, rope_bridge, P_, mark, skyBegin, skyEnd } from "./archi_sky.js";

const wood = (K, x0, y0, x1, y1) => (K.rock(x0, y0, x1, y1), K.mat(x0, y0, x1, y1, "wood"));
// 줄기: 아래 반폭 wb → 위 반폭 wt, 밑동은 벌어진다, 껍질 결 흔들림
function trunk(K, cx, yb, yt, wb, wt, s) {
  for (let y = yt; y < yb; y++) {
    const u = (y - yt) / (yb - yt), flare = y > yb - 16 ? (y - (yb - 16)) * 0.7 : 0;
    const hw = wt + (wb - wt) * u ** 1.4 + flare + Math.sin(y * 0.21 + s) * 0.8 + Math.sin(y * 0.07 + s * 2) * 1.2;
    const c = cx + Math.sin(y * 0.013 + s) * 3;
    wood(K, Math.round(c - hw), y, Math.round(c + hw), y + 1);
  }
}
// 가지: 윗면 점들을 잇는다 (걷는 길), 두께 t0 → t1로 가늘어진다
function limb(K, pts, t0 = 5, t1 = 3) {
  const n = pts.length - 1;
  for (let k = 0; k < n; k++) {
    const [xa, ya] = pts[k], [xb, yb] = pts[k + 1], dir = Math.sign(xb - xa) || 1;
    for (let x = xa; x !== xb + dir; x += dir) {
      const u = (x - xa) / ((xb - xa) || 1), y = Math.round(ya + (yb - ya) * u), t = Math.round(t0 + (t1 - t0) * ((k + u) / n));
      wood(K, x, y, x + 1, y + t);
    }
  }
}
// 잎 덩어리 (수관): 잡음으로 흔든 타원, 위는 걷는 잎
function canopy(K, cx, cy, rx, ry, s, amt = 0.35) {
  for (let y = Math.floor(cy - ry * 1.3); y <= cy + ry * 1.3; y++)
    for (let x = Math.floor(cx - rx * 1.3); x <= cx + rx * 1.3; x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      if (dx * dx + dy * dy < 1 + (fbm(x / 11, y / 9, s) - 0.5) * 2 * amt) K.rock(x, y, x + 1, y + 1), K.mat(x, y, x + 1, y + 1, "leaf");
    }
}
// 늘어진 뿌리 (구불구불 가늘어진다), climbable이면 덩굴처럼 탄다
function root(K, x, y, len, s, climbable) {
  let cx = x;
  for (let j = 0; j < len; j++) {
    const w = 2.2 * (1 - j / len) ** 0.6;
    cx = x + Math.sin(j * 0.12 + s) * 3 + Math.sin(j * 0.05 + s * 2) * 2;
    w > 0.4 && wood(K, Math.round(cx - w), y + j, Math.round(cx + w) + 1, y + j + 1);
  }
  climbable && K.vine(Math.round(x) - 4, Math.round(x) + 5, y, y + len);
}
// 버섯: 대(크림) + 갓(붉은 점박이, 위는 튕김)
function shroom(K, x, f, h, r, bounce = 1) {
  // 대는 뒤에 선다 (밑으로 지나다닌다), 갓만 밟힌다
  K.wall(x - 2, f - h, x + 3, f, "stem");
  const top = f - h;
  for (let y = top - Math.round(r * 0.55); y < top + 3; y++) {
    const hw = Math.round(r * Math.sqrt(Math.max(0, 1 - ((y - top + 1) / (r * 0.6)) ** 2)));
    hw > 0 && (K.rock(x - hw, y, x + hw + 1, y + 1), K.mat(x - hw, y, x + hw + 1, y + 1, "cap"));
  }
  bounce && K.bounce(x - Math.round(r * 0.4), x + Math.round(r * 0.4) + 1, top - Math.round(r * 0.55));
}

// 잎 굴 (수관 속 방): 둥글고 울퉁불퉁하게 파고 바닥만 평평, 뒷벽은 잎
function pocket(K, x0, y0, x1, y1, s) {
  K.wall(x0 - 2, y0 - 3, x1 + 2, y1, "leaf");
  hollow(K, (x0 + x1) / 2, (y0 + y1) / 2 - 1, (x1 - x0) / 2 + 1, (y1 - y0) / 2 + 3, s, 0.16);
  K.air(x0 + 2, y1 - 5, x1 - 2, y1), K.rock(x0 - 2, y1, x1 + 2, y1 + 2), K.mat(x0 - 2, y1, x1 + 2, y1 + 2, "leaf");
}

export function leafcrown(K) {
  skyBegin(K);
  road(K);
  mark(true);
  greatTree(K);
  oak(K);
  mark(false);
  willow(K), pine(K), birches(K), shroomIsle(K), deadTree(K), nestIsle(K), mossPond(K);
  skyEnd(K);
}
leafcrown.own = 1;

// ═══ 뿌리섬 길 (줄 1000) ═══
function road(K) {
  const F = 1000;
  nat(K, 0, 100, () => F, jag(PL([[0, 1046], [30, 1040], [70, 1030], [100, 1008]]), 1.4, 1), { flat: 1, fingers: 3 });
  room(K, 12, 1008, 60, 1020), climb(K, 54, F, 1020, "ladder");
  P_(K, 24, 1020, "p_shroom", { acc: 0xc060e0 }), P_(K, 40, 1020, "p_log"), P_(K, 12, F, "p_fern"), P_(K, 30, F, "p_font"), K.heal(26, 34, F - 4, F);
  K.tag(2, F - 14, 70, F, "rest", { safe: 1 }), K.tag(12, 1008, 60, 1020, "treasure");
  K.struct("서쪽 뿌리섬", "거점·출구", 0, 986, 100, 1046);
  // 통나무 다리
  wood(K, 98, F, 126, F + 4), K.rock(99, F + 4, 125, F + 5), K.mat(99, F + 4, 125, F + 5, "wood");
  nat(K, 124, 300, () => F, jag(PL([[124, 1006], [150, 1034], [210, 1048], [270, 1036], [300, 1006]]), 1.4, 2), { flat: 1, fingers: 4 });
  for (const [x, l, s] of [[150, 30, 1], [182, 44, 2], [262, 36, 3]]) root(K, x, 1030, l, s, 0);
  nat(K, 352, 470, () => F, jag(PL([[352, 1006], [380, 1032], [420, 1042], [460, 1028], [470, 1006]]), 1.3, 3), { flat: 1, fingers: 3 });
  room(K, 366, 1008, 454, 1020), climb(K, 446, F, 1020, "rope");
  P_(K, 380, 1020, "p_shroom", { acc: 0x40e0c0 }), P_(K, 410, 1020, "p_shroom", { acc: 0xffa040 }), P_(K, 430, 1020, "p_log");
  K.tag(366, 1008, 440, 1020, "arena");
  // 튕김 버섯 셋 (버드나무 섬 뿌리까지 튕겨 오른다)
  shroom(K, 372, F, 34, 15), shroom(K, 410, F, 64, 20), shroom(K, 450, F, 48, 16);
  K.struct("버섯 뿌리섬", "전투", 352, 900, 470, 1042);
  wood(K, 468, F, 512, F + 4), K.rock(470, F + 4, 510, F + 5), K.mat(470, F + 4, 510, F + 5, "wood");
  nat(K, 510, 880, () => F, jag(PL([[510, 1006], [540, 1034], [620, 1048], [760, 1050], [840, 1036], [880, 1006]]), 1.4, 4), { flat: 1, fingers: 6 });
  for (const [x, l, s] of [[560, 30, 4], [610, 46, 5], [790, 40, 6], [830, 28, 7]]) root(K, x, 1036, l, s, 0);
  nat(K, 920, 1024, () => F, jag(PL([[920, 1006], [950, 1034], [990, 1046], [1024, 1048]]), 1.3, 5), { flat: 1, fingers: 3 });
  room(K, 940, 1008, 1000, 1020), climb(K, 948, F, 1020, "ladder");
  P_(K, 970, 1020, "p_nest"), P_(K, 990, 1020, "p_shroom", { acc: 0xc060e0 }), P_(K, 960, F, "p_fern"), P_(K, 1000, F, "p_bush");
  K.tag(966, F - 14, 1022, F, "rest", { safe: 1 }), K.tag(940, 1008, 1000, 1020, "treasure");
  K.struct("동쪽 뿌리섬", "거점·출구", 920, 986, 1024, 1048);
  // 길 위 소품
  for (const [x, k] of [[140, "p_fern"], [270, "p_flowers"], [540, "p_bush"], [600, "p_log"], [800, "p_fern"], [850, "p_flowers"]]) P_(K, x, F, k);
  K.tag(130, F - 12, 190, F, "arena"), K.tag(520, F - 12, 640, F, "arena"), K.tag(770, F - 12, 870, F, "arena");
}

// ═══ 가운데 거목 ═══
function greatTree(K) {
  const X = 700;
  // 수관 (먼저 — 줄기·가지가 그 위를 덮는다)
  canopy(K, X, 142, 180, 62, 11, 0.3);
  canopy(K, X - 150, 196, 60, 26, 12), canopy(K, X + 150, 190, 64, 28, 13);
  trunk(K, X, 1000, 196, 50, 34, 1);
  // 뿌리 (길 섬 밑으로)
  for (const [x, l, s] of [[662, 40, 8], [690, 54, 9], [724, 48, 10], [748, 36, 11]]) root(K, x, 1040, l, s, 0);
  // ── 줄기 속 ──
  // 1 뿌리 홀 (길에서 양옆 문)
  room(K, 664, 948, 736, 1000, "wood"), K.air(628, 990, 664, 1000), K.air(736, 990, 774, 1000);
  P_(K, 680, 1000, "p_shroom", { acc: 0x60f0c0 }), P_(K, 700, 1000, "p_log"), P_(K, 722, 1000, "p_fern");
  K.tag(664, 960, 736, 1000, "arena");
  // 홀 안 선반 버섯 셋 + 벽 덩굴 (굴뚝 첫 선반까지)
  for (const [a, b, y] of [[706, 724, 988], [680, 698, 975], [700, 718, 962], [704, 722, 950]]) K.rock(a, y, b, y + 2), K.mat(a, y, b, y + 2, "stem");
  K.vine(664, 668, 936, 1000);
  // 2 선반 버섯 굴뚝 (선반을 밟아 오른다)
  K.air(674, 770, 726, 948), K.wall(674, 770, 726, 948, "wood");
  const shelves = [[674, 690, 938], [706, 726, 926], [680, 698, 913], [702, 720, 900], [674, 688, 888], [692, 712, 876], [710, 726, 863], [678, 696, 851], [700, 718, 838], [674, 692, 825], [704, 726, 812], [682, 700, 799], [698, 716, 786], [674, 690, 776]];
  for (const [a, b, y] of shelves) K.rock(a, y, b, y + 2), K.mat(a, y, b, y + 2, "stem");
  K.tag(676, 800, 724, 948, "trial");
  K.vine(722, 726, 770, 948);
  // 3 옹이 웅덩이 (바닥 770, 물 + 벽 덩굴)
  room(K, 668, 704, 732, 770, "wood"), K.air(676, 770, 724, 776), K.water(676, 764, 724, 776), K.vine(668, 672, 704, 770);
  K.plank(674, 690, 776), K.rope(700, 637, 768);
  P_(K, 712, 764, "p_moss", { hang: 0 }), K.tag(680, 704, 724, 760, "treasure");
  // 가지 문 (770): 서 — 긴 가지 끝 잎 다발, 동 — 가지 위 오두막 둘
  K.air(640, 762, 668, 770), K.air(732, 762, 762, 770);
  limb(K, [[650, 770], [600, 760], [548, 748]], 6, 4), canopy(K, 532, 742, 26, 10, 14);
  limb(K, [[750, 770], [810, 762], [880, 760]], 6, 3), canopy(K, 896, 754, 22, 9, 15);
  wood(K, 790, 742, 824, 762), room(K, 792, 746, 822, 762, "wood"), K.air(790, 754, 792, 762), K.air(822, 754, 824, 762), wood(K, 788, 738, 826, 742);
  wood(K, 842, 744, 866, 760), room(K, 844, 748, 864, 760, "wood"), K.air(842, 752, 844, 760), K.air(864, 752, 866, 760);
  P_(K, 800, 762, "p_crates"), P_(K, 814, 762, "p_nest"), P_(K, 852, 760, "p_urn");
  K.tag(792, 746, 822, 762, "arena"), K.tag(844, 748, 864, 760, "treasure");
  // 낮은 가지 둘 (그네 매는 곳)
  limb(K, [[652, 952], [600, 946], [560, 944]], 5, 3);
  limb(K, [[748, 952], [830, 946], [902, 944]], 5, 3);
  K.swing(898, 948, 40);
  // 4 올빼미 회랑 (바닥 640): 옹이 창, 서·동 가지 문
  K.air(684, 640, 716, 704), K.wall(684, 640, 716, 704, "wood"), K.vine(684, 688, 640, 768), climb(K, 712, 640, 704, "rope", "wood");
  room(K, 666, 596, 734, 640, "wood");
  K.plank(670, 690, 618), K.plank(710, 730, 618);
  for (const [x, y] of [[664, 612], [734, 606]]) K.air(x, y, x + 3, y + 4);
  P_(K, 680, 618, "p_nest"), P_(K, 720, 618, "p_nest", { v: 1 }), P_(K, 700, 640, "p_rack");
  K.tag(666, 618, 734, 640, "arena"), K.tag(670, 600, 730, 618, "treasure");
  K.air(636, 632, 666, 640), K.air(734, 632, 766, 640);
  limb(K, [[648, 640], [590, 620], [528, 596]], 6, 4);
  limb(K, [[752, 640], [800, 640], [856, 638]], 6, 4);
  // 5 덩굴 굴뚝 (420 → 596)
  K.air(684, 426, 716, 596), K.wall(684, 426, 716, 596, "wood"), K.vine(684, 688, 426, 640), K.vine(712, 716, 426, 640);
  for (const [x, y] of [[680, 520], [716, 470]]) K.air(x, y, x + 4, y + 5);
  K.rock(690, 510, 710, 512), K.mat(690, 510, 710, 512, "stem"), K.rock(690, 470, 702, 472), K.mat(690, 470, 702, 472, "stem");
  // 6 심장 방 (바닥 420, 정예): 둥근 큰 방, 서·동 가지 문
  for (let y = 336; y < 420; y++) {
    const hw = Math.round(28 * Math.sqrt(Math.max(0, 1 - ((y - 392) / 58) ** 2)));
    hw > 0 && K.air(X - hw, y, X + hw, y + 1);
  }
  K.wall(672, 336, 728, 420, "wood");
  K.rock(676, 392, 688, 394), K.rock(712, 380, 724, 382), K.mat(676, 380, 724, 394, "stem");
  P_(K, 700, 420, "p_altar", { sc: 1.3 }), P_(K, 684, 420, "p_shroom", { acc: 0x60f0c0 }), P_(K, 716, 420, "p_shroom", { acc: 0xffd070 });
  K.tag(674, 360, 726, 420, "arena", { big: 1, elite: 1 });
  K.air(632, 412, 672, 420), K.air(728, 412, 768, 420);
  limb(K, [[644, 420], [580, 400], [500, 384], [446, 380]], 6, 3);
  K.swing(450, 383, 40);
  limb(K, [[756, 420], [820, 404], [884, 396]], 6, 3);
  // 7 수관 잎 홀 (바닥 200) → 위 잎 방 → 꼭대기
  climb(K, 700, 200, 336, "ladder", "wood"), K.ladder(700, 200, 420);
  K.air(684, 420, 690, 426), K.vine(684, 688, 412, 430), K.air(710, 420, 716, 426), K.vine(712, 716, 412, 430);
  pocket(K, 618, 168, 782, 200, 101), pocket(K, 664, 120, 744, 152, 102);
  climb(K, 734, 152, 168, "vine", "leaf"), K.vine(733, 736, 149, 200);
  climb(K, 676, surf(K, 676, 80), 120, "vine", "leaf");
  for (const [a, b] of [[620, 650], [752, 780]]) K.wall(a - 18, 192, a, 200, "leaf"), K.wall(b, 192, b + 18, 200, "leaf"), K.air(a - 18, 192, a, 200), K.air(b, 192, b + 18, 200);
  K.peak(X, surf(K, X, 76));
  P_(K, 640, 200, "p_nest"), P_(K, 700, 200, "p_flowers"), P_(K, 760, 200, "p_shroom", { acc: 0xffa040 }), P_(K, 690, 152, "p_hive"), P_(K, 718, 152, "p_fern");
  K.tag(620, 168, 780, 200, "arena"), K.tag(666, 124, 742, 152, "treasure"), K.tag(X - 30, 60, X + 30, 78, "rest", { safe: 1 });
  K.struct("거목", "출구·정예·보물고·오르는 길", 510, 70, 900, 1000);
}

// ═══ 참나무 (서, 길 위) ═══
function oak(K) {
  const X = 216;
  canopy(K, X, 600, 112, 48, 21, 0.38);
  canopy(K, X - 96, 632, 36, 18, 22), canopy(K, X + 100, 626, 40, 20, 23);
  trunk(K, X, 1000, 640, 30, 20, 2);
  // 속 빈 줄기 나무집 네 층 (층마다 모양이 다르다)
  room(K, 200, 958, 232, 1000, "wood"), K.air(168, 990, 200, 1000), K.air(232, 990, 266, 1000);
  room(K, 202, 904, 230, 944, "wood"), climb(K, 226, 944, 958, "ladder", "wood"), K.ladder(226, 944, 1000);
  K.plank(204, 216, 926), K.ladder(214, 926, 944);
  room(K, 204, 842, 228, 890, "wood"), climb(K, 208, 890, 904, "vine", "wood"), K.vine(207, 210, 887, 944);
  room(K, 202, 770, 230, 828, "wood"), climb(K, 224, 828, 842, "rope", "wood"), K.rope(224, 825, 890);
  K.plank(214, 230, 800), K.rope(220, 797, 828);
  for (const [x, y] of [[196, 920], [232, 868], [196, 800]]) K.air(x, y, x + 3, y + 4);
  room(K, 206, 690, 226, 756, "wood"), climb(K, 212, 756, 770, "ladder", "wood"), K.ladder(212, 756, 828);
  // 수관 속 잎 방 둘 + 윗면
  pocket(K, 150, 594, 204, 612, 103), pocket(K, 230, 586, 296, 606, 104);
  climb(K, 216, 612, 690, "ladder", "wood"), K.ladder(216, 612, 756);
  K.wall(204, 600, 230, 612, "leaf"), K.air(204, 600, 230, 612), climb(K, 284, surf(K, 284, 560), 586, "vine", "leaf"), climb(K, 160, surf(K, 160, 560), 594, "vine", "leaf");
  K.vine(283, 286, 586, 606), K.vine(159, 162, 594, 612);
  // 가지: 동 (780 문 → 버드나무 쪽 잎 다발), 서 (880, 버섯 섬 쪽), 낮은 동 (그네)
  K.air(230, 820, 252, 828), limb(K, [[240, 828], [290, 812], [334, 796]], 5, 3), canopy(K, 348, 790, 18, 8, 24);
  K.air(184, 882, 204, 890), limb(K, [[194, 890], [150, 878], [110, 872]], 5, 3), canopy(K, 96, 866, 20, 8, 25);
  limb(K, [[240, 952], [290, 948], [322, 946]], 5, 3);
  K.swing(318, 950, 40);
  P_(K, 210, 1000, "p_log"), P_(K, 214, 944, "p_shelf"), P_(K, 210, 890, "p_crates"), P_(K, 210, 828, "p_nest"), P_(K, 216, 756, "p_urn");
  P_(K, 170, 612, "p_shroom", { acc: 0xc060e0 }), P_(K, 250, 606, "p_hive"), P_(K, 270, 606, "p_flowers");
  K.tag(202, 904, 230, 944, "arena"), K.tag(204, 842, 228, 890, "treasure"), K.tag(202, 770, 230, 828, "arena"), K.tag(150, 594, 204, 612, "rest"), K.tag(230, 586, 296, 606, "treasure"), K.tag(130, 540, 300, 556, "arena");
  K.struct("참나무", "전투·보물고·오르는 길", 100, 548, 356, 1000);
}

// ═══ 버드나무 (떠 있는 뿌리섬) ═══
function willow(K) {
  nat(K, 360, 500, jag(PL([[360, 786], [400, 778], [470, 780], [500, 788]]), 0.5, 30), jag(PL([[360, 794], [380, 818], [430, 834], [480, 820], [500, 794]]), 1.3, 31), { fingers: 2 });
  for (const [x, l, s, c] of [[384, 70, 1, 1], [410, 96, 2, 1], [440, 84, 3, 0], [470, 62, 4, 1]]) root(K, x, 826, l, s, c);
  room(K, 380, 788, 480, 804), climb(K, 470, 778, 804, "ladder");
  dropTo(K, 410, 804, "vine");
  mark(true);
  canopy(K, 430, 566, 92, 26, 32, 0.3);
  trunk(K, 434, 780, 584, 14, 9, 3);
  room(K, 424, 700, 444, 744, "wood"), K.air(420, 736, 424, 744), climb(K, 436, 744, 780, "ladder", "wood");
  climb(K, 430, 576, 700, "vine", "wood");
  pocket(K, 380, 556, 486, 576, 105);
  mark(false);
  // 덩굴 커튼 (수관 밑에서 길게)
  for (let x = 346, i = 0; x < 518; x += 9 + (i % 3) * 3, i++) {
    if (x > 420 && x < 448) continue;
    let y = 560;
    while (y < 640 && K.get(x, y) !== -1) y++;
    K.vine(x - 1, x + 2, y - 2, y + 40 + ((i * 17) % 50));
  }
  P_(K, 400, 804, "p_shroom", { acc: 0x40e0c0 }), P_(K, 440, 804, "p_log"), P_(K, 432, 744, "p_nest"), P_(K, 420, 576, "p_flowers"), P_(K, 470, 576, "p_fern"), P_(K, 390, 778, "p_fern");
  K.tag(380, 788, 460, 804, "arena"), K.tag(424, 700, 444, 744, "treasure"), K.tag(380, 556, 486, 576, "rest"), K.tag(360, 520, 510, 540, "arena");
  K.struct("버드나무", "전투·보물고·쉼터", 340, 530, 520, 920);
}

// ═══ 소나무 (떠 있는 뿌리섬, 동) ═══
function pine(K) {
  nat(K, 850, 1004, jag(PL([[850, 646], [880, 638], [980, 640], [1004, 648]]), 0.5, 40), jag(PL([[850, 654], [870, 690], [920, 712], [970, 698], [1004, 654]]), 1.3, 41), { fingers: 3 });
  for (const [x, l, s] of [[880, 50, 5], [940, 70, 6], [980, 44, 7]]) root(K, x, 700, l, s, x === 940);
  room(K, 872, 648, 990, 662), climb(K, 980, 640, 662, "ladder");
  room(K, 900, 670, 950, 684), climb(K, 910, 662, 684, "rope");
  P_(K, 890, 662, "p_log"), P_(K, 930, 662, "p_shroom", { acc: 0xffa040 }), P_(K, 924, 684, "p_urn");
  K.tag(872, 648, 990, 662, "arena"), K.tag(900, 670, 950, 684, "treasure");
  mark(true);
  trunk(K, 922, 640, 256, 9, 4, 4);
  // 층층 잎 단: 아래가 넓고 위로 좁아진다 (단마다 폭·높이가 조금씩 다르다)
  const tiers = [[604, 66], [574, 58], [548, 60], [520, 50], [494, 46], [466, 44], [440, 36], [412, 34], [384, 28], [356, 24], [328, 20], [300, 16], [274, 10]];
  for (const [y, w] of tiers) {
    for (let k = 0; k < 7; k++) {
      const hw = Math.round(w * (1 - k / 9) + Math.sin(y + k) * 1.5);
      K.rock(922 - hw, y + k, 922 + hw, y + k + 1), K.mat(922 - hw, y + k, 922 + hw, y + k + 1, "leaf");
    }
  }
  mark(false);
  // 줄기를 감은 덩굴 (단과 단 사이)
  K.vine(912, 932, 270, 640);
  P_(K, 900, 604, "p_nest"), P_(K, 950, 520, "p_nest", { v: 1 }), P_(K, 922, 274, "p_flags");
  K.tag(870, 590, 980, 604, "arena"), K.tag(890, 480, 960, 494, "arena"), K.tag(900, 370, 950, 384, "treasure"), K.tag(900, 250, 944, 268, "vista");
  K.struct("소나무", "전투·보물고·전망", 850, 250, 1004, 712);
}

// ═══ 자작나무 숲섬 ═══
function birches(K) {
  nat(K, 180, 400, jag(PL([[180, 406], [220, 398], [360, 400], [400, 408]]), 0.5, 50), jag(PL([[180, 414], [200, 440], [260, 456], [330, 452], [380, 432], [400, 412]]), 1.3, 51), { fingers: 3 });
  for (const [x, l, s] of [[230, 70, 8], [300, 100, 9], [360, 56, 10]]) root(K, x, 450, l, s, true);
  room(K, 200, 408, 380, 424), climb(K, 370, 398, 424, "ladder");
  dropTo(K, 266, 424, "vine");
  P_(K, 230, 424, "p_log"), P_(K, 300, 424, "p_shroom", { acc: 0xc060e0 }), K.tag(200, 408, 380, 424, "arena");
  // 가는 줄기 셋 (흰 껍질 = 크림 재질), 줄기마다 오두막 높이가 다르다
  const bark = (x, top) => {
    for (let y = top; y < 400; y++) K.rock(x - 2, y, x + 3, y + 1);
    K.mat(x - 2, top, x + 3, 400, "stem");
    for (let y = top + 6; y < 396; y += 9 + ((x + y) % 5)) K.mat(x - 2, y, x + 3, y + 1, "wood");
  };
  bark(224, 216), bark(290, 196), bark(356, 236);
  const hut = (x0, x1, f, h) => {
    wood(K, x0, f - h - 2, x1, f + 2), room(K, x0 + 2, f - h, x1 - 2, f, "wood");
    K.air(x0, f - 7, x0 + 2, f), K.air(x1 - 2, f - 7, x1, f);
    for (let k = 0; k < 4; k++) (K.rock(x0 - 2 + k, f - h - 3 - k, x1 + 2 - k, f - h - 2 - k), K.mat(x0 - 2, f - h - 6, x1 + 2, f - h - 2, "leaf"));
  };
  hut(210, 240, 330, 12), hut(276, 306, 286, 14), hut(342, 372, 352, 11), hut(270, 312, 236, 12);
  climb(K, 228, 330, 332, "ladder", "wood"), K.ladder(228, 330, 398);
  climb(K, 294, 286, 288, "ladder", "wood"), K.ladder(294, 286, 398);
  climb(K, 360, 352, 354, "ladder", "wood"), K.ladder(360, 352, 398);
  climb(K, 298, 236, 286, "ladder", "wood");
  rope_bridge(K, 240, 276, 330, 4, 3, 1), rope_bridge(K, 306, 342, 300, 3, 3, 2);
  for (const [cx, cy, rx] of [[224, 206, 22], [290, 186, 26], [356, 226, 20]]) canopy(K, cx, cy, rx, 12, cx, 0.4);
  P_(K, 226, 330, "p_crates"), P_(K, 290, 286, "p_rack"), P_(K, 356, 352, "p_nest"), P_(K, 290, 236, "p_shelf");
  K.tag(212, 318, 238, 330, "arena"), K.tag(278, 272, 304, 286, "treasure"), K.tag(344, 341, 370, 352, "arena"), K.tag(272, 224, 310, 236, "treasure");
  K.struct("자작나무 숲섬", "전투·보물고", 180, 170, 400, 456);
}

// ═══ 거대 버섯 섬 (서) ═══
function shroomIsle(K) {
  nat(K, 24, 160, jag(PL([[24, 786], [60, 778], [130, 780], [160, 788]]), 0.5, 60), jag(PL([[24, 794], [44, 820], [90, 836], [140, 818], [160, 794]]), 1.3, 61), { fingers: 2 });
  for (const [x, l, s] of [[60, 50, 11], [100, 72, 12], [140, 44, 13]]) root(K, x, 828, l, s, x === 100);
  room(K, 40, 788, 146, 804), climb(K, 136, 778, 804, "ladder");
  dropTo(K, 100, 804, "vine");
  // 큰 버섯 집: 갓 속에 방
  K.rock(78, 700, 94, 780), K.mat(78, 700, 94, 780, "stem");
  for (let y = 664; y < 704; y++) {
    const hw = Math.round(48 * Math.sqrt(Math.max(0, 1 - ((y - 704) / 40) ** 2)));
    hw > 0 && (K.rock(86 - hw, y, 86 + hw, y + 1), K.mat(86 - hw, y, 86 + hw, y + 1, "cap"));
  }
  room(K, 56, 680, 116, 700, "wood"), K.air(80, 700, 92, 778), K.ladder(86, 700, 778), K.wall(80, 700, 92, 778, "wood");
  K.air(78, 770, 94, 778);
  K.bounce(70, 102, 663);
  shroom(K, 40, 778, 26, 12), shroom(K, 134, 778, 40, 16);
  P_(K, 70, 700, "p_shelf"), P_(K, 102, 700, "p_cheese"), P_(K, 60, 804, "p_shroom", { acc: 0xffa040 }), P_(K, 100, 804, "p_log");
  K.tag(56, 680, 116, 700, "treasure"), K.tag(40, 788, 130, 804, "arena"), K.tag(30, 760, 150, 778, "arena");
  K.struct("거대 버섯 섬", "전투·보물고", 24, 650, 160, 900);
}

// ═══ 죽은 고목 (속 빈 거미 굴) ═══
function deadTree(K) {
  nat(K, 24, 150, jag(PL([[24, 476], [60, 468], [120, 470], [150, 478]]), 0.5, 70), jag(PL([[24, 484], [50, 510], [90, 524], [130, 508], [150, 484]]), 1.3, 71), { fingers: 3 });
  for (const [x, l, s] of [[50, 40, 14], [96, 60, 15]]) root(K, x, 516, l, s, x === 96);
  mark(true);
  trunk(K, 86, 470, 300, 18, 9, 5);
  K.mat(60, 300, 112, 470, "stem");
  limb(K, [[96, 360], [126, 340], [150, 330]], 4, 2), limb(K, [[76, 400], [50, 384], [30, 380]], 4, 2);
  mark(false);
  room(K, 74, 420, 100, 470, "wood"), K.air(64, 462, 74, 470), K.air(100, 462, 110, 470);
  dropTo(K, 70, 470, "vine");
  room(K, 76, 356, 98, 410, "wood"), climb(K, 80, 410, 420, "rope", "wood"), K.rope(80, 407, 470);
  K.crumble(78, 96, 384);
  climb(K, 92, 300, 356, "ladder", "wood"), K.ladder(92, 300, 410);
  K.fall(84, 88, 360, 410);
  P_(K, 86, 470, "p_web", { hang: 0 }), P_(K, 90, 410, "p_bones"), P_(K, 82, 384, "p_nest");
  K.tag(74, 420, 100, 470, "arena"), K.tag(76, 356, 98, 410, "treasure");
  rope_bridge(K, 150, 182, 474, 6, 3, 1);
  K.struct("죽은 고목", "전투·보물고", 24, 296, 150, 524);
}

// ═══ 어미새 둥지 섬 (꼭대기 서) ═══
function nestIsle(K) {
  nat(K, 30, 200, jag(PL([[30, 116], [70, 108], [160, 110], [200, 118]]), 0.5, 80), jag(PL([[30, 124], [56, 156], [110, 176], [170, 156], [200, 124]]), 1.3, 81), { fingers: 3 });
  for (const [x, l, s] of [[50, 90, 16], [150, 60, 17]]) root(K, x, 168, l, s, 0);
  // 큰 둥지: 가지 엮은 테 (나무) — 안이 정예 싸움터
  for (let x = 50; x < 180; x++) {
    const d = Math.abs(x - 115) / 65, h = Math.round(10 * (1 - d * d) * 0 + (d > 0.8 ? (d - 0.8) * 40 : 0));
    h > 0 && wood(K, x, 108 - h, x + 1, 108);
  }
  room(K, 60, 124, 170, 140), climb(K, 160, 108, 140, "vine");
  dropTo(K, 84, 140, "vine");
  P_(K, 115, 108, "p_nest", { sc: 3 }), P_(K, 90, 140, "p_bones"), P_(K, 140, 140, "p_nest");
  K.tag(56, 90, 176, 108, "arena", { big: 1, elite: 1 }), K.tag(60, 124, 170, 140, "treasure");
  K.struct("어미새 둥지 섬", "정예·보물고", 30, 84, 200, 176);
}

// ═══ 반딧불 이끼 연못 섬 (꼭대기 동) ═══
function mossPond(K) {
  nat(K, 860, 1012, jag(PL([[860, 150], [890, 142], [980, 142], [1012, 152]]), 0.5, 90), jag(PL([[860, 158], [884, 190], [936, 208], [990, 190], [1012, 158]]), 1.3, 91), { fingers: 3 });
  for (const [x, l, s] of [[922, 70, 18], [970, 50, 19]]) root(K, x, 200, l, s, x === 922);
  K.air(890, 138, 960, 150), K.water(890, 142, 960, 150);
  room(K, 880, 160, 990, 176), climb(K, 980, 142, 176, "ladder");
  dropTo(K, 950, 176, "vine");
  P_(K, 900, 176, "p_shroom", { acc: 0x60f0c0 }), P_(K, 930, 176, "p_shroom", { acc: 0x80e0ff }), P_(K, 960, 176, "p_moss", { hang: 0 }), P_(K, 970, 142, "p_fern"), P_(K, 996, 142, "p_flowers");
  K.tag(880, 160, 990, 176, "treasure"), K.tag(870, 128, 1004, 142, "rest");
  K.struct("반딧불 이끼 연못 섬", "쉼터·보물고", 860, 128, 1012, 208);
}
