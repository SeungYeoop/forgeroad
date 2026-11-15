// 5지역 「불타는 요새」 3D 모델 — 화로의 불을 차지하려던 군대가 세운 요새. 군대는 불에 삼켜졌지만 여전히 성벽을 지킨다.
// 색: 그을린 쇠 · 달아오른 붉은 금속 · 용암 주황 · 군기 진홍
import { mat, rough, cloth, cape, plates, veins, EYE, gait, leg, arm, PI, TAU, chain, add, rot2, ease, lerp, noise3, hash } from "./rig.js";

const STEEL = mat(0x4a4450, { spec: 0.4, shin: 44, tex: plates(0.25), rim: 0.6, rimCol: 0xff9a50 });
const STEELD = mat(0x2e2a34, { spec: 0.3, shin: 40 });
const HOTM = mat(0x8a3a2a, { spec: 0.5, shin: 40, tex: veins(0.2, 0xff6a18, 0xffd060, 0.3), rim: 0.7, rimCol: 0xffb060 });
const RED = mat(0xa02a24, { tex: cloth(0.6), rim: 0.5, rimCol: 0xffa070 });
const REDD = mat(0x6a1a18, { tex: cloth(0.6) });
const GOLD = mat(0xc89a40, { spec: 0.8, shin: 44 });
const WOOD = mat(0x5a3a22, { tex: (u, v) => Math.sin(u * 2 + v * 0.3) * 0.5 });
const LEATH = mat(0x5a3a26, { tex: rough(0.6, 0.6) });
const SKINB = mat(0xa86a4a, { tex: rough(0.5, 0.6), rim: 0.6, rimCol: 0xffb070 });
const SOOT = mat(0x2a2224, { tex: rough(0.6, 1) });
const LAVA = mat(0x5a3a32, { tex: veins(0.22, 0xff6a18, 0xffe080, 1.2), rim: 0.8, rimCol: 0xffa050 });
const LAVAD = mat(0x3a2622, { tex: veins(0.22, 0xff5010, 0xffc040, 1) });
const CORE = EYE(0xffc040), FLAME = EYE(0xffe080), EMB = EYE(0xff8a30), EMBR = EYE(0xff4a18), EYEW = EYE(0xffffff);
const VISOR = mat(0x140808);
const CHAIN = mat(0x7a7a84, { spec: 0.7, shin: 40, tex: (u) => (Math.floor(u * 2) % 2 ? 0.6 : -0.6) });
const SCALE = mat(0x8a3a1e, { tex: (u, v, w, s) => ((Math.floor(u * 0.9) + Math.floor(v * 0.9)) % 2 ? 0.35 : -0.3), spec: 0.4, shin: 30, rim: 0.6, rimCol: 0xffc070 });
const SCALEB = mat(0xd8a050, { tex: rough(0.5, 0.5) });
const BRICK = mat(0x6a3a2e, { tex: (u, v) => (Math.floor(v * 0.5) % 2 ? (Math.floor(u * 0.35) % 2 ? 0.3 : -0.2) : Math.floor(u * 0.35 + 0.5) % 2 ? 0.3 : -0.2), rim: 0.5, rimCol: 0xffa060 });
const BLADE = mat(0xc8c0d0, { spec: 0.6, shin: 60, hi: 0xffffff, rim: 0.4 });
const LENS = mat(0xffb040, { emit: 0xffb040 });

const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
function flame(M, p, h, k, s = 1) {
  for (let i = 0; i < 4; i++) {
    const t = i / 4, sw = Math.sin(k * 1.7 + i * 1.3) * 1.2 * t * s;
    M.sphere([p[0] + sw, p[1] - t * h, p[2] + 1], (3.2 - t * 2.4) * s, i < 2 ? (i === 0 ? FLAME : EMB) : EMBR);
  }
}
// 투구: 둥근 돔 + 붉게 달아오른 눈구멍 (3/4)
function helm(M, h, lean, r = 6, crest = !0) {
  M.ell(h, [r, r * 1.08, r], STEEL, lean);
  M.ell(add(h, rot2([r * 0.5, r * 0.1, r * 0.66], lean)), [r * 0.55, r * 0.22, r * 0.5], VISOR, lean);
  M.sphere(add(h, rot2([r * 0.6, r * 0.1, r * 1.0], lean)), 1.1, EMB);
  M.sphere(add(h, rot2([r * 0.9, r * 0.1, r * 0.5], lean)), 0.9, EMB);
  crest && [0, 1, 2, 3].forEach((i) => M.sphere(add(h, rot2([-1 - i * 2, -r - 1 + i * 0.8, 0], lean)), 2.2 - i * 0.3, RED));
}

// ════ 화염 보병 ════ (방패와 창, 밀집 대형)
export const flameInfantry = {
  fw: 72, fh: 66, w: 18, h: 32,
  anims: { idle: [6, 5], move: [8, 8], wind: [3, 9, !1], thrust: [3, 18, !1], rec: [2, 8, !1], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 64, cx = 30;
    let bob = 0, lean = 0.08, legs = gait(0, 0.1, 0), spear = 0, shY = 0;
    if (nm === "idle") bob = Math.sin((k / n) * TAU) * 0.6;
    if (nm === "move") ((legs = gait((k / n) * TAU, 0.35, 0.55)), (bob = Math.abs(Math.cos((k / n) * TAU)) * 1.4));
    if (nm === "wind") ((spear = -6 * ((k + 1) / 3)), (lean = -0.05), (shY = -2));
    if (nm === "thrust") ((spear = [6, 16, 12][k]), (lean = [0.2, 0.3, 0.28][k]), (legs = [[PI / 2 - 0.5, 0.35], [PI / 2 + 0.4, -0.2]]));
    if (nm === "rec") ((spear = 4 - k * 4), (lean = 0.2));
    if (nm === "hurt") ((lean = -0.2), (bob = 1));
    const hip = [cx, G - 22 + bob * 0.3, 0];
    leg(M, add(hip, [-1, 0, -4]), legs[1][0], 10, legs[1][1], 11, 3.4, 3, STEELD, STEELD, 4);
    leg(M, add(hip, [1, 0, 4]), legs[0][0], 10, legs[0][1], 11, 3.6, 3.2, STEEL, STEELD, 4);
    const chest = add(hip, rot2([0, -12], lean));
    M.ell(add(hip, rot2([0, -2], lean)), [7, 4, 6], RED, lean);
    M.ell(chest, [8.5, 9, 7], STEEL, lean);
    M.ell(add(chest, rot2([1, 0, 5], lean)), [5.5, 6.5, 2.6], HOTM, lean);
    helm(M, add(chest, rot2([1, -12, 0], lean)), lean, 5.6);
    // 창 (뒷손, 앞으로 겨눔)
    const shB = add(chest, rot2([0, -5, -6], lean));
    const hd = add(shB, [9 + spear * 0.5, 4, 0]);
    M.cap(shB, hd, 2.6, 2.2, STEELD);
    M.cap(add(hd, [-14, 0, 0]), add(hd, [22 + spear, 0, 0]), 0.9, 0.9, WOOD);
    M.cap(add(hd, [22 + spear, 0, 0]), add(hd, [30 + spear, 0, 0]), 2, 0.3, BLADE);
    // 탑 방패 (앞) + 불꽃 문장
    const shF = add(chest, rot2([2, -5, 7], lean));
    const sc = add(shF, [7, 6 + shY, 3]);
    M.ell(shF, [5.5, 4.5, 4.5], STEEL, lean + 0.3);
    M.ell(sc, [3, 14, 9.5], STEEL, 0);
    M.ell(add(sc, [2.6, 0, 0]), [1.2, 5, 4], HOTM);
    M.sphere(add(sc, [3.2, -1, 0]), 1.6, EMB);
  },
};

// ════ 화약 포병 ════ (어깨 박격포)
export const artillerist = {
  fw: 64, fh: 60, w: 16, h: 28,
  anims: { idle: [6, 6], move: [8, 10], aim: [3, 8, !1], fire: [3, 14, !1], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 58, cx = 28;
    let bob = 0, lean = 0.1, legs = gait(0, 0.1, 0), tube = -0.35, kick = 0, smoke = 0;
    if (nm === "idle") bob = Math.sin((k / n) * TAU) * 0.6;
    if (nm === "move") ((legs = gait((k / n) * TAU, 0.45, 0.7)), (bob = Math.abs(Math.cos((k / n) * TAU)) * 1.6), (tube = -0.25));
    if (nm === "aim") ((tube = lerp(-0.35, -0.85, ease((k + 1) / n))), (lean = -0.12), (legs = [[PI / 2 - 0.35, 0.3], [PI / 2 + 0.35, -0.2]]));
    if (nm === "fire") ((tube = -0.85), (kick = [3, 2, 0][k]), (smoke = 1 - k * 0.3), (lean = -0.2));
    if (nm === "hurt") ((lean = -0.25), (bob = 1));
    const hip = [cx, G - 19 + bob * 0.3, 0];
    leg(M, add(hip, [0, 0, -4]), legs[1][0], 9, legs[1][1], 9, 3, 2.6, LEATH, SOOT, 3.5);
    leg(M, add(hip, [0, 0, 4]), legs[0][0], 9, legs[0][1], 9, 3.2, 2.8, LEATH, SOOT, 3.5);
    const chest = add(hip, rot2([0, -10], lean));
    M.ell(chest, [8, 8, 7], LEATH, lean);
    M.ell(add(chest, rot2([1, 2, 5], lean)), [6, 6.5, 3], RED, lean);
    M.cap(add(chest, rot2([-5, -6, 6], lean)), add(chest, rot2([5, 5, 6], lean)), 1.1, 1.1, GOLD);
    // 포탄 주머니
    for (let i = 0; i < 3; i++) M.sphere(add(chest, rot2([-6 + i * 3, 7, 5], lean)), 1.6, STEELD);
    // 머리: 그을린 얼굴 + 고글 + 모자
    const h = add(chest, rot2([3, -10, 2], lean));
    M.ell(h, [5.5, 5.5, 5.5], SKINB, lean);
    M.ell(add(h, [0, -1.5, 0]), [5.4, 1, 5.4], LEATH);
    M.sphere(add(h, [2.4, -1.4, 4.4]), 1.6, LENS).sphere(add(h, [4.6, -1.4, 2.4]), 1.3, LENS);
    M.ell(add(h, [-1, -5, 0]), [6, 2.5, 5.5], REDD, -0.2);
    M.ell(add(h, [2, 3, 3.5]), [2.5, 0.8, 1.5], SOOT);
    // 어깨 박격포
    const sh = add(chest, rot2([-2, -6, -6], lean));
    const base = add(sh, [-kick + 1, -1, -2]);
    const mouth = add(base, [Math.cos(tube) * 18, Math.sin(tube) * 18, 0]);
    M.cap(add(base, [-Math.cos(tube) * 6, -Math.sin(tube) * 6, 0]), mouth, 3.2, 3.8, STEEL);
    M.ell(mouth, [1.8, 4.2, 4.2], STEELD, tube);
    M.ell(add(base, [-Math.cos(tube) * 4, -Math.sin(tube) * 4, 0]), [3, 3, 5], HOTM, tube);
    arm(M, add(chest, rot2([1, -5, 6], lean)), 0.1, 6, -1.5, 6, 2.6, 2.2, LEATH);
    smoke > 0 && [0, 1, 2].forEach((i) => M.sphere(add(mouth, [Math.cos(tube) * (3 + i * 3), Math.sin(tube) * (3 + i * 3) - i, 0]), (3 + i) * smoke, i ? mat(0x6a6060, { emit: 0x8a8080 }) : FLAME));
  },
};

// ════ 불도마뱀 ════ (등에 불꽃 가시)
export const salamander = {
  fw: 72, fh: 42, w: 22, h: 12,
  anims: { idle: [6, 7], move: [6, 14], wind: [3, 9, !1], spit: [3, 14, !1], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 40, cx = 32;
    let ph = 0, sway = 0, head = 0, jaw = 0.1, crouch = 0;
    if (nm === "idle") ((sway = Math.sin((k / n) * TAU) * 0.15), (head = Math.sin((k / n) * TAU) * 0.08));
    if (nm === "move") ((ph = (k / n) * TAU), (sway = Math.sin(ph) * 0.35));
    if (nm === "wind") ((head = -0.25 * ((k + 1) / 3)), (crouch = 2), (jaw = 0.5));
    if (nm === "spit") ((head = [0.1, 0.05, 0][k]), (jaw = 1));
    if (nm === "hurt") ((head = -0.4), (jaw = 0.7));
    // 몸이 S자로 꿈틀대는 마디
    const pts = [];
    for (let i = 0; i < 7; i++) {
      const t = i / 6, x = cx - 10 + t * 20, y = G - 9 - t * t * 7 + crouch * (0.5 + t) + Math.sin(t * 3 + sway * 4) * sway * 3;
      pts.push([x, y, Math.sin(t * PI * 1.5 + ph) * sway * 4]);
    }
    // 꼬리
    let tp = pts[0];
    for (let i = 0; i < 4; i++) {
      const q = add(tp, [-4.5 + i * 0.8, -1.2 - i * 1.6 + Math.sin(ph + i) * 1.2, -0.5]);
      M.cap(tp, q, 3.4 - i * 0.7, 2.8 - i * 0.7, SCALE);
      i === 3 && flame(M, q, 6, k, 0.7);
      tp = q;
    }
    // 다리 넷 (옆으로 뻗은 도마뱀 다리)
    for (const [i, z, o] of [[1, -1, PI], [5, -1, 0], [1, 1, 0], [5, 1, PI]]) {
      const hip = pts[i], s = Math.sin(ph + o) * 3;
      const kn = add(hip, [s, 3, z * 7]), ft = [hip[0] + s * 1.6 + 2 + (i > 3 ? 2 : 0), G - 1, z * 8];
      M.cap(hip, kn, 2.6, 2.1, z < 0 ? mat(0x6a2a14) : SCALE).cap(kn, ft, 1.8, 1.4, z < 0 ? mat(0x6a2a14) : SCALE);
    }
    for (let i = 0; i < 7; i++) M.sphere(pts[i], 5.6 - Math.abs(i - 3.5) * 0.3, SCALE);
    for (let i = 1; i < 6; i++) M.ell(add(pts[i], [0, 2.4, 2]), [3.6, 1.6, 3], SCALEB);
    // 등의 불꽃 가시
    for (let i = 1; i < 6; i++) flame(M, add(pts[i], [0, -4, 0]), 4 + (i % 2) * 2, k + i, 0.6);
    // 머리
    const h = add(pts[6], rot2([6, -2, 1], head));
    M.ell(h, [7.5, 5.2, 5.5], SCALE, head);
    M.cap(add(h, rot2([-2, -4, 2], head)), add(h, rot2([-7, -8, 2], head)), 1.6, 0.4, SCALE);
    M.ell(add(h, rot2([3, 2 + jaw * 1.5, 1], head)), [4.5, 1.4 + jaw, 3.5], mat(0x6a2a14), head + jaw * 0.3);
    jaw > 0.4 && M.ell(add(h, rot2([5, 1.5, 2], head)), [2.5, jaw * 1.2, 2], EMB);
    M.sphere(add(h, rot2([1.5, -2.2, 4.6], head)), 1.4, mat(0xffe040, { emit: 0xffe040 })).sphere(add(h, rot2([2, -2.2, 5.8], head)), 0.6, VISOR);
  },
};

// ════ 용광로 정령 ════ (용암 바위 몸 + 열기 오라)
export const furnaceSpirit = {
  fw: 72, fh: 74, w: 22, h: 38,
  anims: { idle: [6, 6], move: [8, 8], wind: [3, 8, !1], atk: [3, 16, !1], rec: [2, 8, !1], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 72, cx = 32;
    let bob = 0, lean = 0.05, legs = gait(0, 0.1, 0), aN = [1.7, 0.5], aF = [1.5, 0.4], heat = Math.sin((k / Math.max(1, n)) * TAU);
    if (nm === "move") ((legs = gait((k / n) * TAU, 0.35, 0.55)), (bob = Math.abs(Math.cos((k / n) * TAU)) * 1.8));
    if (nm === "wind") ((aN = [lerp(1.7, -2.4, ease((k + 1) / n)), -0.4]), (lean = -0.12));
    if (nm === "atk") ((aN = [[-0.8, -0.2], [0.5, 0.3], [0.8, 0.4]][k]), (lean = [0.2, 0.38, 0.4][k]));
    if (nm === "rec") ((aN = [1.1, 0.4]), (lean = 0.3 - k * 0.1));
    if (nm === "hurt") lean = -0.25;
    const hip = [cx, G - 24 + bob * 0.3, 0];
    leg(M, add(hip, [-1, 0, -5]), legs[1][0], 11, legs[1][1], 12, 4.4, 4, LAVAD, LAVAD, 4.5);
    leg(M, add(hip, [1, 0, 5]), legs[0][0], 11, legs[0][1], 12, 4.6, 4.2, LAVA, LAVAD, 4.5);
    const chest = add(hip, rot2([0, -15], lean));
    M.ell(add(hip, rot2([0, -4], lean)), [9, 7, 8], LAVA, lean);
    M.ell(chest, [12, 12, 10], LAVA, lean);
    // 가슴의 용광로 (빛나는 구멍)
    M.ell(add(chest, rot2([2, 1, 8.5], lean)), [5, 5.5, 2.5], CORE, lean);
    M.ell(add(chest, rot2([2, 1, 10], lean)), [2.4, 2.8, 1.5], FLAME, lean);
    // 어깨의 바위 덩이
    M.ell(add(chest, rot2([-2, -9, -9], lean)), [6, 5, 5], LAVAD, lean);
    arm(M, add(chest, rot2([-1, -8, -10], lean)), aF[0], 10, aF[1], 10, 4, 3.6, LAVAD);
    // 머리 = 타오르는 불꽃 + 눈
    const h = add(chest, rot2([2, -14, 0], lean));
    M.ell(h, [6, 6, 5.5], LAVA, lean);
    flame(M, add(h, [0, -4, 0]), 12 + heat * 2, k, 1.4);
    M.sphere(add(h, [2.4, 0, 4.8]), 1.3, FLAME).sphere(add(h, [5, 0, 2.6]), 1.1, FLAME);
    // 앞팔 (녹아내리는 주먹)
    M.ell(add(chest, rot2([1, -8, 10], lean)), [6.5, 5.5, 5.5], LAVA, lean);
    const [, hn] = arm(M, add(chest, rot2([1, -8, 10], lean)), aN[0], 11, aN[1], 11, 4.4, 4, LAVA);
    M.ell(hn, [5, 4.6, 4.6], LAVA);
    M.cap(add(hn, [0, 3, 2]), add(hn, [0, 7 + (k % 3), 2]), 1.2, 0.7, EMB);
    // 열기 아지랑이 (작은 불씨)
    for (let i = 0; i < 3; i++) M.sphere([cx - 14 + hash(k, i) * 28, G - 50 - hash(i, k) * 20, 9], 0.8, EMB);
  },
};

// ════ 쇠사슬 고문관 ════ (두건 쓴 처형인, 갈고리 사슬 + 철퇴)
export const chainTorturer = {
  fw: 76, fh: 70, w: 18, h: 34,
  anims: { idle: [6, 6], move: [8, 8], throw: [3, 12, !1], wind: [3, 9, !1], atk: [3, 16, !1], rec: [2, 8, !1], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 68, cx = 30;
    let bob = 0, lean = 0.1, legs = gait(0, 0.1, 0), hook = 0, fA = [1.7, 0.3], swing = Math.sin((k / Math.max(1, n)) * TAU) * 0.3;
    if (nm === "idle") bob = Math.sin((k / n) * TAU) * 0.6;
    if (nm === "move") ((legs = gait((k / n) * TAU, 0.4, 0.6)), (bob = Math.abs(Math.cos((k / n) * TAU)) * 1.5));
    if (nm === "throw") ((hook = [0.2, 1, 0.6][k]), (lean = [0, 0.25, 0.2][k]));
    if (nm === "wind") ((fA = [lerp(1.7, -2.5, ease((k + 1) / n)), -0.3]), (lean = -0.12));
    if (nm === "atk") ((fA = [[-0.8, -0.2], [0.6, 0.4], [0.9, 0.5]][k]), (lean = [0.25, 0.42, 0.45][k]), (legs = [[PI / 2 - 0.55, 0.4], [PI / 2 + 0.4, -0.2]]));
    if (nm === "rec") ((fA = [1.1, 0.4]), (lean = 0.3));
    if (nm === "hurt") lean = -0.25;
    const hip = [cx, G - 22 + bob * 0.3, 0];
    leg(M, add(hip, [0, 0, -4]), legs[1][0], 10, legs[1][1], 11, 3.4, 3, LEATH, SOOT, 4);
    leg(M, add(hip, [0, 0, 4]), legs[0][0], 10, legs[0][1], 11, 3.6, 3.2, LEATH, SOOT, 4);
    const chest = add(hip, rot2([0, -12], lean));
    M.ell(add(hip, rot2([0, -1], lean)), [7.5, 4, 6.5], LEATH, lean);
    // 맨 가슴 (화상 자국) + 가죽 멜빵
    M.ell(chest, [9, 9, 7], SKINB, lean);
    M.cap(add(chest, rot2([-5, -6, 6], lean)), add(chest, rot2([5, 6, 6], lean)), 1.2, 1.2, LEATH);
    M.ell(add(chest, rot2([3, 3, 6], lean)), [2.5, 3, 1], mat(0x7a3a2a, { tex: rough(1, 1) }), lean);
    // 두건 (뾰족, 눈구멍 둘)
    const h = add(chest, rot2([2, -11, 0], lean));
    M.ell(h, [6, 6.5, 6], REDD, lean);
    M.cap(add(h, [-1, -4, 0]), add(h, [-4, -12, 0]), 4.4, 0.8, REDD);
    M.sphere(add(h, [2.5, -0.5, 5.2]), 1.1, EMB).sphere(add(h, [5, -0.5, 3]), 0.9, EMB);
    // 뒷손: 갈고리 사슬
    const shB = add(chest, rot2([0, -6, -6], lean));
    const hB = add(shB, [6 + hook * 6, 6 - hook * 4, 0]);
    M.cap(shB, hB, 3, 2.6, SKINB);
    const tip = hook ? add(hB, [hook * 44, -2, 2]) : add(hB, [2 + swing * 4, 10, 1]);
    const nl = Math.ceil(Math.hypot(tip[0] - hB[0], tip[1] - hB[1]) / 2.5);
    for (let i = 0; i <= nl; i++) M.sphere([lerp(hB[0], tip[0], i / nl), lerp(hB[1], tip[1], i / nl) + (hook ? 0 : Math.sin((i / nl) * PI) * 2), lerp(hB[2], tip[2], i / nl)], 0.9, CHAIN);
    M.cap(tip, add(tip, [hook ? 4 : 2, hook ? -3 : 3, 0]), 1.4, 0.4, BLADE);
    // 앞손: 가시 철퇴
    const shN = add(chest, rot2([1, -6, 7], lean));
    const [, hd] = arm(M, shN, fA[0], 9, fA[1], 8, 3.2, 2.8, SKINB);
    const ga = fA[0] + fA[1], top = add(hd, [Math.cos(ga) * 13, Math.sin(ga) * 13, 1]);
    M.cap(add(hd, [-Math.cos(ga) * 2, -Math.sin(ga) * 2, 1]), top, 1.2, 1.2, WOOD);
    M.sphere(top, 4.4, STEELD);
    for (let i = 0; i < 6; i++) M.cap(top, add(top, [Math.cos(i * 1.05) * 7, Math.sin(i * 1.05) * 7, 0]), 1.2, 0.2, BLADE);
    (nm === "wind" && k === 2) && M.sphere(add(top, [0, 0, 4]), 1.6, FLAME);
  },
};

// ════ 깃발병 ════ (군기를 든 병사 / 꽂힌 깃발 flag)
export const bannerBearer = {
  fw: 68, fh: 82, w: 16, h: 32,
  anims: { idle: [6, 6], move: [8, 9], plant: [4, 9, !1], hurt: [2, 10, !1], flag: [6, 8] },
  model(M, nm, k, n) {
    const G = 80, cx = 28;
    const wave = (kk) => Math.sin((kk / 6) * TAU);
    const banner = (top, z, kk) => {
      M.cap(add(top, [0, 50, 0]), top, 1.3, 1.3, WOOD);
      M.cap(top, add(top, [0, -4, 0]), 1.8, 0.4, GOLD);
      for (let i = 0; i < 7; i++) {
        const t = i / 6, w = wave(kk + i * 0.6) * 2 * t;
        M.ell(add(top, [2.5 + t * 16, 9 + w, z + w * 0.4]), [1.6, 9 - t * 1.5, 0.8], i % 2 ? RED : REDD, 0);
      }
      M.ell(add(top, [9, 8, z + 1.5]), [3, 3, 0.8], GOLD);
      M.sphere(add(top, [9, 8, z + 2.4]), 1.4, EMB);
    };
    if (nm === "flag") {
      // 땅에 꽂힌 군기만
      M.ell([cx, G - 1, 0], [6, 2, 5], SOOT);
      banner([cx, G - 52, 0], 0, k);
      flame(M, [cx, G - 56, 0], 5, k, 0.6);
      return;
    }
    let bob = 0, lean = 0.05, legs = gait(0, 0.1, 0), up = 0;
    if (nm === "idle") bob = Math.sin((k / n) * TAU) * 0.6;
    if (nm === "move") ((legs = gait((k / n) * TAU, 0.4, 0.6)), (bob = Math.abs(Math.cos((k / n) * TAU)) * 1.5));
    if (nm === "plant") ((up = [-4, -8, 4, 6][k]), (lean = [-0.1, -0.15, 0.2, 0.15][k]));
    if (nm === "hurt") lean = -0.25;
    const hip = [cx, G - 22 + bob * 0.3, 0];
    leg(M, add(hip, [0, 0, -4]), legs[1][0], 10, legs[1][1], 11, 3, 2.6, STEELD, STEELD, 3.5);
    leg(M, add(hip, [0, 0, 4]), legs[0][0], 10, legs[0][1], 11, 3.2, 2.8, STEEL, STEELD, 3.5);
    const chest = add(hip, rot2([0, -12], lean));
    M.ell(add(hip, rot2([0, -2], lean)), [6.5, 4, 6], RED, lean);
    M.ell(chest, [7.5, 8.5, 6.5], STEEL, lean);
    M.ell(add(chest, rot2([1, 0, 5], lean)), [4.5, 6, 2], RED, lean);
    helm(M, add(chest, rot2([1, -11, 0], lean)), lean, 5.2, !1);
    // 군기를 두 손으로
    const hd = add(chest, rot2([6, -2 + up, 6], lean));
    M.cap(add(chest, rot2([1, -5, 6], lean)), hd, 2.6, 2.2, STEEL);
    M.cap(add(chest, rot2([0, -5, -5], lean)), add(hd, [-1, 4, -6]), 2.4, 2, STEELD);
    banner(add(hd, [2, -36 + up * 0.5, 0]), 0, k);
  },
};

// ════ [정예] 공성 골렘 ════ (벽돌·쇠 몸, 등에 화로, 팔 대포)
export const siegeGolem = {
  fw: 112, fh: 100, w: 36, h: 60,
  anims: { idle: [6, 5], move: [8, 6], aim: [3, 8, !1], fire: [3, 12, !1], wind: [3, 7, !1], stomp: [2, 10, !1], hot: [4, 16], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 94, cx = 44;
    let bob = 0, ph = 0, lean = 0.05, cannon = 0.1, recoil = 0, legUp = 0, glow = 1;
    if (nm === "idle") bob = Math.sin((k / n) * TAU) * 1;
    if (nm === "move") ((ph = (k / n) * TAU), (bob = Math.abs(Math.cos(ph)) * 2.5));
    if (nm === "aim") cannon = lerp(0.1, -0.15, (k + 1) / 3);
    if (nm === "fire") ((cannon = -0.15), (recoil = [4, 2, 0][k]));
    if (nm === "wind") ((legUp = (k + 1) / 3), (lean = -0.12));
    if (nm === "stomp") ((legUp = 0), (lean = 0.15));
    if (nm === "hot") ((glow = 1.4 + (k % 2) * 0.6), (bob = (k % 2) * 1.5));
    if (nm === "hurt") lean = -0.2;
    const hip = [cx, G - 30 + bob * 0.4, 0];
    const s = Math.sin(ph) * 6;
    // 기둥 같은 다리 (벽돌 허벅지 + 쇠 정강이)
    for (const [z, m, sg] of [[-11, STEELD, -1], [11, STEEL, 1]]) {
      const up = sg > 0 ? legUp * 14 : 0, fx = cx + sg * 5 + sg * s + (sg > 0 ? legUp * 6 : 0);
      const kn = [lerp(hip[0], fx, 0.5) + 3, lerp(hip[1], G - 4 - up, 0.5), z];
      M.cap(add(hip, [sg * 3, 2, z]), kn, 9, 8, BRICK);
      M.box(lerp3(kn, [fx, G - 6 - up, z], 0.5), [8, 9, 8], m, 0);
      M.box([fx + 2, G - 3 - up, z], [12, 3.5, 9], m, 0);
      M.sphere(kn, 6.5, STEELD);
    }
    const chest = add(hip, rot2([0, -22], lean));
    M.box(add(hip, rot2([0, -4], lean)), [14, 7, 13], STEELD, lean);
    M.box(chest, [20, 15, 15], BRICK, lean);
    M.box(add(chest, rot2([0, -14, 0], lean)), [22, 3.5, 16], STEEL, lean);
    M.box(add(chest, rot2([0, 12, 0], lean)), [21, 2.5, 16], STEEL, lean);
    for (const yy of [-6, 4]) M.sphere(add(chest, rot2([10, yy, 15], lean)), 1.4, GOLD);
    M.box(add(chest, rot2([3, 0, 15], lean)), [11, 9, 1.5], STEEL, lean);
    M.ell(add(chest, rot2([3, 0, 16.5], lean)), [4.5, 4.5, 1.5], CORE, lean);
    // 등의 화로 + 굴뚝 불꽃
    const fur = add(chest, rot2([-18, -6, -6], lean));
    M.ell(fur, [8, 10, 8], STEELD, lean);
    M.ell(add(fur, [-2, 2, 6]), [4, 4, 2], CORE);
    M.cap(add(fur, [-2, -8, 0]), add(fur, [-4, -20, 0]), 3.6, 3, STEELD);
    flame(M, add(fur, [-4, -22, 0]), 8 * glow, k, glow);
    // 머리 (작은 철 투구, 빛나는 틈)
    const h = add(chest, rot2([7, -20, 3], lean));
    M.ell(h, [7.5, 6.5, 7.5], STEEL, lean);
    M.ell(add(h, rot2([4, 0, 4], lean)), [3.5, 1.2, 3], CORE, lean);
    // 뒷팔
    M.ell(add(chest, rot2([-2, -12, -16], lean)), [9, 8, 8], STEELD, lean);
    arm(M, add(chest, rot2([-2, -10, -17], lean)), 1.7, 14, 0.3, 13, 7, 6.5, STEELD);
    // 앞팔 = 대포
    const sh = add(chest, rot2([2, -11, 17], lean));
    M.ell(sh, [10, 8.5, 8.5], STEEL, lean);
    const el = add(sh, [4, 10, 2]);
    M.cap(sh, el, 6, 5.5, BRICK);
    const mz = add(el, [Math.cos(cannon) * (22 - recoil), Math.sin(cannon) * (22 - recoil), 2]);
    M.cap(el, mz, 6, 7, STEEL);
    M.ell(mz, [2.4, 6, 6], STEELD, cannon);
    M.ell(add(mz, [1, 0, 0]), [1, 3.4, 3.4], nm === "fire" && k === 0 ? FLAME : VISOR, cannon);
    // 과열 균열
    nm === "hot" && [0, 1, 2, 3].forEach((i) => M.cap(add(chest, rot2([0, 0, 13], lean)), add(chest, rot2([Math.cos(i * 1.6) * 14, Math.sin(i * 1.6) * 12, 12], lean)), 0.9, 0.4, FLAME));
  },
};

// ════ [정예] 화염 근위대장 ════ (대검 자세 ↔ 방패 자세)
export const guardCaptain = {
  fw: 92, fh: 84, w: 22, h: 42,
  anims: { idle: [6, 5], move: [8, 8], swap: [3, 8, !1], wind: [3, 9, !1], s1: [2, 16, !1], s2: [2, 16, !1], s3: [3, 14, !1], sidle: [6, 5], smove: [8, 7], block: [2, 8], counter: [3, 16, !1], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 82, cx = 40;
    const shield = nm[0] === "s" && nm !== "s1" && nm !== "s2" && nm !== "s3" || nm === "block" || nm === "counter";
    let bob = 0, lean = 0.05, legs = gait(0, 0.1, 0), sA = [-0.9, -0.6], shD = [9, 0];
    if (nm.endsWith("idle")) bob = Math.sin((k / n) * TAU) * 0.6;
    if (nm.endsWith("move")) ((legs = gait((k / n) * TAU, 0.38, 0.6)), (bob = Math.abs(Math.cos((k / n) * TAU)) * 1.5));
    if (nm === "swap") ((lean = -0.1), (sA = [-2.2 + k * 0.6, -0.3]));
    if (nm === "wind") ((sA = [lerp(-0.9, -2.6, ease((k + 1) / n)), -0.6]), (lean = -0.12));
    if (nm === "s1") ((sA = [[-0.3, 0.2], [0.5, 0.4]][k]), (lean = 0.3), (legs = [[PI / 2 - 0.5, 0.35], [PI / 2 + 0.4, -0.2]]));
    if (nm === "s2") ((sA = [[0.4, 0.3], [-1.2, -0.6]][k]), (lean = 0.25), (legs = [[PI / 2 - 0.5, 0.35], [PI / 2 + 0.4, -0.2]]));
    if (nm === "s3") ((sA = [[-2.7, -0.3], [-0.2, 0.4], [0.8, 0.5]][k]), (lean = [0.05, 0.35, 0.45][k]), (legs = [[PI / 2 - 0.6, 0.5], [PI / 2 + 0.45, -0.2]]));
    if (nm === "block") ((shD = [11, -3]), (lean = 0.15), (sA = [1.3, 0.3]));
    if (nm === "counter") ((shD = [[12, -3], [16, -2], [13, 0]][k]), (sA = [[-1.6, -0.2], [0.2, 0.3], [0.6, 0.4]][k]), (lean = [0.1, 0.35, 0.3][k]));
    if (shield && !["block", "counter"].includes(nm)) sA = [1.2, 0.4];
    if (nm === "hurt") lean = -0.2;
    const hip = [cx, G - 26 + bob * 0.3, 0];
    const chest = add(hip, rot2([0, -14], lean));
    cape(M, add(chest, rot2([-3, -8, 0], lean)), 32, 11, lean, RED, k, -7);
    leg(M, add(hip, [-1, 0, -5]), legs[1][0], 12, legs[1][1], 12, 4.4, 3.8, STEELD, STEELD, 4.5);
    leg(M, add(hip, [1, 0, 5]), legs[0][0], 12, legs[0][1], 12, 4.6, 4, STEEL, STEELD, 4.5);
    M.ell(add(hip, rot2([0, -3], lean)), [8.5, 4.5, 7.5], STEELD, lean);
    M.ell(chest, [11, 11, 9], STEEL, lean);
    M.ell(add(chest, rot2([1, 0, 6], lean)), [7.5, 8.5, 3.5], HOTM, lean);
    M.ell(add(chest, rot2([-2, -8, -8], lean)), [7, 5, 5], STEEL, lean - 0.3);
    helm(M, add(chest, rot2([1, -14, 0], lean)), lean, 6.6);
    [0, 1, 2].forEach((i) => M.cap(add(chest, rot2([-1 - i * 2, -21, 0], lean)), add(chest, rot2([-6 - i * 3, -27 + i * 2, 0], lean)), 1.6, 0.6, GOLD));
    // 대검 (뒷손)
    const shB = add(chest, rot2([1, -7, -8], lean));
    const [, hd] = arm(M, shB, sA[0], 10, sA[1], 9, 3.6, 3.2, STEELD);
    const ang = sA[0] + sA[1], hot = ["s1", "s2", "s3", "counter"].includes(nm) && k > 0;
    M.box(add(hd, [Math.cos(ang) * 17, Math.sin(ang) * 17, -1]), [15, 2.2, 0.8], BLADE, ang, 0.6);
    hot && M.cap(add(hd, [Math.cos(ang) * 4, Math.sin(ang) * 4, -0.2]), add(hd, [Math.cos(ang) * 32, Math.sin(ang) * 32, -0.2]), 0.6, 0.3, FLAME);
    M.box(add(hd, [Math.cos(ang) * 2, Math.sin(ang) * 2, -1]), [1, 6, 1.6], GOLD, ang);
    // 방패 (앞): 방패 자세에서는 앞으로, 대검 자세에서는 등에
    const shF = add(chest, rot2([2, -6, 9], lean));
    M.ell(shF, [7, 5, 5], STEEL, lean + 0.3);
    if (shield) {
      const sc = add(shF, [shD[0], 8 + shD[1], 3]);
      M.ell(sc, [3.5, 15, 10], STEEL, 0);
      M.ell(add(sc, [2.8, 0, 0]), [1.4, 6, 5], HOTM);
      M.sphere(add(sc, [3.4, -1, 0]), 1.8, EMB);
    } else M.ell(add(chest, rot2([-9, 2, -9], lean)), [3, 13, 9], STEELD, lean);
  },
};

// ════ [보스] 화염 장군 이그나르 ════ (불꽃 언월도, 깃털 투구, 진홍 망토)
export const ignar = {
  boss: !0, fw: 140, fh: 120, w: 38, h: 66,
  anims: { idle: [4, 5], move: [6, 8], stagger: [1, 1], wind: [1, 1], cut1: [1, 1], cut2: [1, 1], spin: [2, 12], plant: [1, 1], dash: [2, 12], throw: [1, 1], cast: [1, 1], roar: [1, 1] },
  model(M, nm, k, n) {
    const G = 118, cx = 60;
    let bob = 0, lean = 0, crouch = 0, legs = gait(0, 0.12, 0), gA = 1.2, hand = [16, 6], cp = 0, hot = 1;
    if (nm === "idle") bob = Math.sin((k / n) * TAU) * 1;
    if (nm === "move") ((legs = gait((k / n) * TAU, 0.38, 0.6)), (bob = Math.abs(Math.cos((k / n) * TAU)) * 2.5));
    const P = {
      stagger: () => ((crouch = 12), (lean = 0.4), (gA = 1.5), (hand = [12, 12]), (legs = [[PI / 2 - 1.1, 1.7], [PI / 2 + 0.2, 1.1]])),
      wind: () => ((lean = -0.15), (gA = -2.5), (hand = [2, -18]), (legs = [[PI / 2 - 0.3, 0.2], [PI / 2 + 0.3, -0.2]])),
      cut1: () => ((lean = 0.32), (gA = 0.6), (hand = [26, 12]), (cp = 4), (hot = 2), (legs = [[PI / 2 - 0.6, 0.4], [PI / 2 + 0.45, -0.2]])),
      cut2: () => ((lean = 0.22), (gA = -0.8), (hand = [24, -6]), (cp = 3), (hot = 2), (legs = [[PI / 2 - 0.5, 0.3], [PI / 2 + 0.4, -0.2]])),
      spin: () => ((lean = 0.1), (gA = k ? PI : 0), (hand = k ? [-22, 4] : [22, 4]), (hot = 2), (cp = 5)),
      plant: () => ((crouch = 6), (lean = 0.15), (gA = -PI / 2), (hand = [16, -10])),
      dash: () => ((lean = 0.5), (gA = 0.05), (hand = [28, 4]), (cp = 7), (hot = 2), (legs = gait(k * PI, 0.7, 0.9))),
      throw: () => ((lean = -0.2), (gA = -0.4), (hand = [-6, -20]), (hot = 2)),
      cast: () => ((lean = -0.1), (gA = -PI / 2), (hand = [12, -26]), (hot = 2)),
      roar: () => ((lean = -0.15), (gA = 1.3), (hand = [14, 8])),
    };
    P[nm] && P[nm]();
    const hip = [cx, G - 40 + bob * 0.4 + crouch, 0];
    const chest = add(hip, rot2([0, -20], lean));
    cape(M, add(chest, rot2([-4 - cp, -12, 0], lean)), 50, 16, lean + cp * 0.05, RED, k, -10);
    leg(M, add(hip, [-2, 0, -8]), legs[1][0], 18, legs[1][1], 19, 6.5, 5.6, STEELD, STEELD, 7);
    leg(M, add(hip, [2, 0, 8]), legs[0][0], 18, legs[0][1], 19, 7, 6, STEEL, STEELD, 7);
    M.ell(add(hip, rot2([0, -4], lean)), [12.5, 6.5, 10.5], STEELD, lean);
    M.ell(chest, [16, 16, 13], STEEL, lean);
    M.ell(add(chest, rot2([2, -2, 9], lean)), [11, 13, 5], HOTM, lean);
    M.ell(add(chest, rot2([2, -6, 13], lean)), [3, 5, 2], GOLD, lean);
    // 어깨 (불길)
    const shB = add(chest, rot2([0, -11, -13], lean));
    M.ell(shB, [9, 6.5, 7.5], STEEL, lean - 0.3);
    flame(M, add(shB, [0, -6, 0]), 10, k + 1, 1);
    // 투구: 붉은 깃털 장식 + 불타는 눈
    const h = add(chest, rot2([2, -22, 0], lean));
    M.ell(h, [9, 10, 9], STEEL, lean);
    M.ell(add(h, rot2([4.5, 1.5, 5], lean)), [4.4, 1.9, 4.6], VISOR, lean);
    M.sphere(add(h, rot2([6.5, 1.5, 8], lean)), 1.8, FLAME).sphere(add(h, rot2([8.5, 1.5, 4], lean)), 1.5, EMB);
    for (let i = 0; i < 6; i++) M.cap(add(h, rot2([-2 - i * 1.5, -9 + i * 0.5, 0], lean)), add(h, rot2([-8 - i * 3, -18 + i * 3, 0], lean)), 2.6, 0.8, i % 2 ? RED : REDD);
    // 앞 어깨 + 언월도를 쥔 팔
    const shF = add(chest, rot2([2, -11, 13], lean));
    const hd = add(chest, rot2([hand[0], hand[1], 15], lean * 0.5));
    M.cap(shF, hd, 6.5, 5.5, STEEL);
    M.ell(shF, [9.5, 7, 8], STEEL, lean + 0.3);
    flame(M, add(shF, [0, -7, 0]), 10, k, 1);
    M.cap(add(shB, [2, 6, 2]), add(hd, [-3, 2, -4]), 5.5, 4.6, STEELD);
    // 언월도: 긴 자루 + 넓은 굽은 날 (날 가장자리가 타오름)
    const c = Math.cos(gA), s = Math.sin(gA);
    M.cap(add(hd, [-c * 22, -s * 22, 2]), add(hd, [c * 26, s * 26, 2]), 1.5, 1.5, WOOD);
    const bc = add(hd, [c * 36, s * 36, 2]);
    M.box(bc, [12, 4, 1.2], BLADE, gA, 0.6);
    M.ell(add(bc, [-s * 3, c * 3, 0]), [11, 2.6, 1.3], BLADE, gA);
    for (let i = 0; i < 4; i++) M.sphere(add(bc, [c * (i * 6 - 9) - s * 5, s * (i * 6 - 9) + c * 5, 2]), 1.2 * hot, i % 2 ? FLAME : EMB);
    M.cap(add(hd, [c * 24, s * 24, 2]), add(hd, [c * 26, s * 26, 2]), 3, 3, GOLD);
  },
};
