// 6지역 「서리 협곡」 3D 모델 — 화로의 열이 닿지 않는 협곡. 모든 것이 얼어붙은 채 숨을 쉰다.
// 색: 눈 흰색 · 빙하 하늘색 · 깊은 남색 그림자 · 서리 보라
import { mat, rough, cloth, cape, EYE, gait, leg, arm, PI, TAU, chain, add, rot2, ease, lerp, noise3, hash } from "./rig.js";

const SNOW = mat(0xe8f0f8, { tex: rough(0.5, 0.5), rim: 0.6, rimCol: 0xa0e0ff });
const SNOWD = mat(0xa8b8d0, { tex: rough(0.5, 0.6) });
const FURW = mat(0xd0dcea, { tex: (u, v, w, s) => Math.sin(u * 1.4 + v * 0.4 + s) * 0.35 + (noise3(u * 0.5, v * 0.5, w * 0.5) - 0.5) * 0.6, rim: 0.6, rimCol: 0x9ad8ff });
const FURG = mat(0x8a98b0, { tex: (u, v, w, s) => Math.sin(u * 1.4 + v * 0.4 + s) * 0.35 });
const ICE = mat(0x8ad0f0, { spec: 0.9, shin: 70, hi: 0xffffff, rim: 0.8, rimCol: 0xe0f8ff, tex: (u, v, w) => (noise3(u * 0.3, v * 0.3, w * 0.3) - 0.5) * 0.5 });
const ICED = mat(0x4a8ab8, { spec: 0.8, shin: 60, rim: 0.6, rimCol: 0xc0f0ff });
const ICEG = EYE(0xb8f4ff), ICEW = EYE(0xffffff), FROST = EYE(0x7ae8ff);
const SLATE = mat(0x3a4258, { tex: rough(0.4, 0.8) });
const SKINB = mat(0x4a6898, { tex: rough(0.5, 0.5), rim: 0.6, rimCol: 0xb0e8ff });
const NOSE = mat(0x1a1a28);
const FANG = mat(0xf0f4ff, { spec: 0.6 });
const GUM = mat(0x5a2a3a);
const COAL = mat(0x1e1e24, { spec: 0.5, shin: 40 });
const CARROT = mat(0xe07a2a, { tex: rough(1, 0.4) });
const WOOD = mat(0x5a4030, { tex: (u, v) => Math.sin(u * 2 + v * 0.3) * 0.5 });
const STEELB = mat(0x5a6278, { spec: 0.6, shin: 50, rim: 0.5, rimCol: 0xb0e0ff });
const BONE = mat(0xc8d0d8, { tex: rough(0.6, 0.4) });
const SHELL = mat(0x4a6478, { tex: (u, v) => ((Math.floor(u * 0.3) + Math.floor(v * 0.3)) % 2 ? 0.25 : -0.25), rim: 0.5, rimCol: 0xa0e0ff });
const TURT = mat(0x5a7a7a, { tex: rough(0.5, 0.6) });
const GOWN = mat(0x6a8ad0, { tex: cloth(0.7), rim: 0.7, rimCol: 0xd0f4ff });
const GOWND = mat(0x34467a, { tex: cloth(0.7) });
const SKINP = mat(0xc8d8f0, { tex: rough(0.4, 0.3), rim: 0.6, rimCol: 0xffffff });
const HAIR = mat(0xe0f0ff, { tex: (u, v) => Math.sin(u * 3) * 0.4, rim: 0.7, rimCol: 0xa0e8ff });
const WINGM = mat(0x6a88b8, { tex: (u, v) => Math.sin(v * 1.6) * 0.4 + (noise3(u * 0.4, v * 0.4, 0) - 0.5) * 0.4, rim: 0.6, rimCol: 0xc8f0ff });
const WSCALE = mat(0x9ab8e0, { tex: (u, v) => ((Math.floor(u * 0.8) + Math.floor(v * 0.8)) % 2 ? 0.3 : -0.25), spec: 0.5, shin: 40, rim: 0.7, rimCol: 0xe0f8ff });
const WSCALED = mat(0x4a5e8a, { tex: (u, v) => ((Math.floor(u * 0.8) + Math.floor(v * 0.8)) % 2 ? 0.3 : -0.25) });
const WBELLY = mat(0xd8e8f8, { tex: (u, v) => (Math.floor(v * 0.6) % 2 ? 0.25 : -0.15) });

const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
// 얼음 결정: 뾰족한 원뿔 (밑동 굵고 끝이 뾰족)
function shard(M, base, ang, len, w, m = ICE) {
  const tip = add(base, [Math.cos(ang) * len, Math.sin(ang) * len, 0]);
  M.cap(base, tip, w, 0.3, m);
  return tip;
}
function qleg(M, hip, ph, len, w, m, paw, back, lift = 1) {
  const sw = Math.sin(ph) * 0.55;
  const a1 = PI / 2 + (back ? 0.15 : -0.1) - sw;
  const a2 = back ? -0.55 - Math.max(0, Math.cos(ph)) * 0.6 * lift : 0.35 + Math.max(0, Math.cos(ph)) * 0.6 * lift;
  const [kn, ft] = chain(hip, a1, len * 0.52, a2, len * 0.55);
  M.cap(hip, kn, w, w * 0.75, m).cap(kn, ft, w * 0.75, w * 0.55, m);
  M.ell(add(ft, [1.5, 0, 0]), [w * 0.9, w * 0.5, w * 0.7], paw);
  return ft;
}

// ════ 설원 늑대 ════ (가늘고 긴 몸, 등뼈를 따라 솟은 얼음 결정, 입김)
export const snowWolf = {
  fw: 80, fh: 50, w: 22, h: 16,
  anims: { idle: [6, 6], move: [6, 15], slide: [2, 10], wind: [3, 9, !1], atk: [3, 14, !1], rec: [2, 8, !1], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 47, cx = 36;
    let bob = 0, ph = 0, stretch = 0, tilt = 0, crouch = 0, jaw = 0.15, headT = 0, tail = Math.sin((k / Math.max(1, n)) * TAU) * 0.2, slide = 0, leap = 0;
    if (nm === "idle") ((bob = Math.sin((k / n) * TAU) * 0.6), (headT = -0.05));
    if (nm === "move") ((ph = (k / n) * TAU), (stretch = Math.sin(ph) * 4), (bob = Math.abs(Math.cos(ph)) * 2.5), (tilt = Math.sin(ph) * 0.07));
    if (nm === "slide") ((slide = 1), (crouch = 5), (tilt = 0.06), (headT = 0.1), (tail = 0.5));
    if (nm === "wind") ((crouch = (k + 1) * 2.4), (headT = 0.3), (jaw = 0.5), (tail = -0.3));
    if (nm === "atk") ((leap = 1), (tilt = [-0.3, -0.15, 0.1][k]), (stretch = [7, 8, 3][k]), (jaw = [1, 1, 0.3][k]), (bob = [7, 5, 1][k]));
    if (nm === "rec") ((crouch = 2 - k), (jaw = 0.3));
    if (nm === "hurt") ((tilt = 0.2), (headT = -0.4), (jaw = 0.7));
    const b = [cx, G - 18 - bob + crouch * 0.6, 0];
    const front = add(b, rot2([11 + stretch * 0.5, -1], tilt)), rear = add(b, rot2([-11 - stretch * 0.5, 0], tilt));
    // 꼬리 (얼음 끝)
    const t0 = add(rear, rot2([-6, -2, 0], tilt)), t1 = add(t0, [-7, -2 + tail * 6, -1]), t2 = add(t1, [-6, 1 + tail * 6, -1]);
    M.cap(t0, t1, 2.8, 3.2, FURW).cap(t1, t2, 3.2, 1.6, FURW);
    shard(M, t2, PI + 0.3 + tail, 5, 1.6);
    const legs = (zN, m, paw) => {
      if (slide) {
        // 얼음 위 미끄러짐: 다리를 앞뒤로 쭉 뻗는다
        M.cap(add(front, [0, 3, zN]), add(front, [12, 11, zN]), 2.6, 1.8, m).ell(add(front, [14, 12, zN]), [2.4, 1.2, 2], paw);
        M.cap(add(rear, [0, 3, zN]), add(rear, [-12, 11, zN]), 3.2, 2, m).ell(add(rear, [-14, 12, zN]), [2.4, 1.2, 2], paw);
      } else if (leap) {
        M.cap(add(front, [0, 3, zN]), add(front, [10, 7, zN]), 2.6, 1.8, m);
        M.cap(add(rear, [0, 3, zN]), add(rear, [-11, 9, zN]), 3.2, 2, m);
      } else {
        const o = zN < 0 ? PI : 0;
        qleg(M, add(front, [0, 3, zN]), ph + o, 16 - crouch * 0.5, 2.5, m, paw, !1);
        qleg(M, add(rear, [0, 3, zN]), ph + o + PI * 0.4, 17 - crouch * 0.5, 3.1, m, paw, !0);
      }
    };
    legs(-4, FURG, FURG);
    // 몸통 (가늘고 길다)
    M.ell(rear, [8, 6.5, 6], FURW, tilt);
    M.ell(b, [12, 5.5, 5.8], FURW, tilt);
    M.ell(front, [8.5, 7.5, 6.5], FURW, tilt - 0.1);
    // 등뼈 얼음 결정 (예고 때 더 솟는다)
    for (let i = 0; i < 6; i++) {
      const p = add(b, rot2([-13 + i * 5, -5, 0], tilt));
      shard(M, p, -PI / 2 - 0.5 + tilt, 4 + (i % 2) * 2 + crouch * 0.3, 1.6, i % 2 ? ICE : ICED);
    }
    legs(4, FURW, FURG);
    // 목 + 머리
    const neck = add(front, rot2([5, -5, 1], tilt));
    const ha = tilt + headT;
    const head = add(neck, rot2([6, -1 + headT * 6, 2], ha));
    M.cap(front, neck, 5.5, 4.6, FURW);
    M.ell(head, [6.8, 5.6, 6], FURW, ha);
    const snoutE = add(head, rot2([10, 1.5, 1.5], ha));
    M.cap(add(head, rot2([3, 0.5, 1], ha)), snoutE, 3.6, 2.2, FURW);
    M.sphere(add(snoutE, [0.8, -0.4, 0.6]), 1.4, NOSE);
    const jawE = add(head, rot2([9, 4 + jaw * 2.4, 1.5], ha + jaw * 0.35));
    M.cap(add(head, rot2([2, 3, 1], ha)), jawE, 2.2, 1.4, FURG);
    jaw > 0.5 && (M.ell(add(head, rot2([6, 3, 3], ha)), [3, 1.2 * jaw, 2], GUM), M.cap(add(snoutE, rot2([-1, 1.5, 2], ha)), add(snoutE, rot2([-1, 3.5, 2], ha)), 0.7, 0.2, FANG));
    // 서리 갈기 + 귀 + 얼음빛 눈
    for (let i = 0; i < 3; i++) shard(M, add(neck, rot2([-2 - i * 2.5, -4, 0], ha)), -PI / 2 - 0.9 + i * 0.1, 6 - i, 1.8, ICE);
    M.cap(add(head, rot2([-1, -4, 3], ha)), add(head, rot2([-3, -10, 3], ha - 0.2)), 1.9, 0.3, FURW);
    M.cap(add(head, rot2([-2, -4, -2], ha)), add(head, rot2([-4, -9, -2], ha - 0.2)), 1.7, 0.3, FURG);
    M.sphere(add(head, rot2([3.6, -1.6, 5.8], ha)), 1.3, ICEG).sphere(add(head, rot2([5.2, -1.6, 2], ha)), 1, ICEG);
    // 입김
    (nm === "wind" || nm === "idle") && M.sphere(add(snoutE, [3 + (k % 3), 1, 1]), 1.2 + (k % 3) * 0.5, mat(0xe8f8ff, { emit: 0xc8e8ff }));
  },
};

// ════ 얼음 정령 ════ (다면체 얼음 심장 + 돌아가는 파편 + 서리 장막)
export const iceSpirit = {
  fw: 56, fh: 64, w: 16, h: 24, flying: !0,
  anims: { idle: [8, 10], blink: [4, 18, !1], wind: [3, 9, !1], cast: [3, 14, !1], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const cx = 28, cy = 28;
    let spin = (k / Math.max(1, n)) * TAU, open = 0, shrink = 1, bob = Math.sin((k / Math.max(1, n)) * TAU) * 1.5;
    if (nm === "blink") shrink = [0.7, 0.3, 0.3, 0.8][k];
    if (nm === "wind") ((open = (k + 1) / 3), (spin = k * 0.8));
    if (nm === "cast") ((open = [1.4, 1.1, 0.7][k]), (spin = 2 + k));
    if (nm === "hurt") ((open = 0.5), (bob = 2));
    const c = [cx, cy + bob, 0];
    // 서리 장막 (뒤로 흐르는 꼬리)
    for (let i = 0; i < 5; i++) {
      const t = i / 4, sw = Math.sin(spin + t * 3) * 2;
      M.ell(add(c, [-2 - t * 6 + sw, 8 + t * 12, -3]), [6 - t * 4, 4, 2], i % 2 ? mat(0x9ad8f8, { emit: 0x5a8ab8 }) : mat(0x6ab0e0, { emit: 0x4a7aa8 }), 0.3);
    }
    // 심장: 기울어진 얼음 결정 여러 개 겹침
    const s = shrink;
    M.box(c, [5 * s, 9 * s, 5 * s], ICE, 0.785 + Math.sin(spin) * 0.1, 0.4);
    M.box(add(c, [0, 0, 1]), [4 * s, 7 * s, 4 * s], ICED, -0.3, 0.9);
    M.sphere(add(c, [1, -1, 4 * s]), 2.6 * s, ICEW);
    // 얼굴: 두 개의 빛나는 틈
    M.ell(add(c, [2.5, -3 * s, 4.6 * s]), [1.2, 0.5, 0.5], FROST).ell(add(c, [4.6, -3 * s, 2.4 * s]), [1, 0.5, 0.5], FROST);
    // 위성 파편 셋 (펼치면 멀어진다)
    for (let i = 0; i < 3; i++) {
      const a = spin + (i * TAU) / 3, r = (11 + open * 8) * s;
      const p = add(c, [Math.cos(a) * r, -2 + Math.sin(a) * r * 0.45, Math.sin(a) * 6]);
      shard(M, add(p, [0, 3, 0]), -PI / 2 + (open ? 0 : 0.3), 7 + open * 2, 2, i % 2 ? ICE : ICED);
    }
    // 머리 위 왕관 결정
    for (const [dx, a, l] of [[-3, -1.9, 7], [0, -PI / 2, 10], [3, -1.2, 7]]) shard(M, add(c, [dx, -8 * s, 0]), a, l * s, 1.8 * s, ICE);
  },
};

// ════ 서리 예티 ════ (거대한 털북숭이, 긴 팔, 푸른 얼굴, 털에 매달린 고드름)
export const frostYeti = {
  fw: 100, fh: 88, w: 30, h: 50,
  anims: { idle: [6, 5], move: [8, 7], scoop: [3, 8, !1], throw: [3, 14, !1], wind: [3, 8, !1], grab: [3, 14, !1], slam: [3, 14, !1], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 86, cx = 46;
    let bob = 0, lean = 0.15, legs = gait(0, 0.1, 0), aN = [1.5, 0.3], aF = [1.6, 0.2], ball = 0, jaw = 0.2;
    if (nm === "idle") ((bob = Math.sin((k / n) * TAU) * 1), (aN = [1.5 + Math.sin((k / n) * TAU) * 0.05, 0.3]));
    if (nm === "move") ((legs = gait((k / n) * TAU, 0.35, 0.5)), (bob = Math.abs(Math.cos((k / n) * TAU)) * 2.4), (aN = [1.5 + Math.sin((k / n) * TAU) * 0.4, 0.4]), (aF = [1.6 - Math.sin((k / n) * TAU) * 0.4, 0.3]));
    if (nm === "scoop") ((lean = 0.5), (aN = [1.2, 0.6]), (aF = [1.2, 0.5]), (ball = (k + 1) / 3));
    if (nm === "throw") ((ball = k === 0 ? 1 : 0), (aN = [[-2.4, -0.4], [-0.6, 0.1], [0.4, 0.3]][k]), (lean = [-0.15, 0.25, 0.35][k]), (jaw = 0.8));
    if (nm === "wind") ((aN = [lerp(1.5, -1.9, ease((k + 1) / 3)), -0.5]), (aF = [lerp(1.6, -1.6, ease((k + 1) / 3)), -0.5]), (lean = -0.12), (jaw = 0.6));
    if (nm === "grab") ((aN = [[-0.2, 0.2], [0.1, 0.4], [0.3, 0.6]][k]), (aF = [[-0.3, 0.2], [0.1, 0.4], [0.3, 0.6]][k]), (lean = [0.2, 0.35, 0.3][k]), (jaw = 1));
    if (nm === "slam") ((aN = [[-1.2, 0], [0.6, 0.3], [1.2, 0.3]][k]), (aF = [[-1.2, 0], [0.6, 0.3], [1.2, 0.3]][k]), (lean = [0, 0.45, 0.5][k]), (bob = [0, -3, -4][k]), (jaw = 1));
    if (nm === "hurt") ((lean = -0.2), (jaw = 0.8));
    const hip = [cx - 2, G - 26 + bob * 0.3, 0];
    leg(M, add(hip, [-1, 0, -7]), legs[1][0], 12, legs[1][1], 12, 6, 5, FURG, SKINB, 6);
    const chest = add(hip, rot2([0, -18], lean));
    // 뒷팔 (긴 팔, 주먹)
    const [, hF] = arm(M, add(chest, rot2([-2, -8, -12], lean)), aF[0], 16, aF[1], 15, 6, 5.5, FURG);
    M.ell(hF, [5.5, 5, 5], SKINB);
    // 몸통: 둥근 배 + 넓은 어깨
    M.ell(add(hip, rot2([0, -4], lean)), [13, 10, 11], FURW, lean);
    M.ell(chest, [17, 15, 13], FURW, lean);
    // 털에 매달린 고드름
    for (let i = 0; i < 4; i++) shard(M, add(chest, rot2([-10 + i * 6, 12, 8], lean)), PI / 2, 4 + (i % 2) * 3, 1.4, ICE);
    leg(M, add(hip, [1, 0, 7]), legs[0][0], 12, legs[0][1], 12, 6.4, 5.4, FURW, SKINB, 6);
    // 등과 어깨의 덥수룩한 털 뭉치 (끝이 어둡다)
    for (let i = 0; i < 7; i++) {
      const p = add(chest, rot2([-14 + i * 4, -12 + Math.abs(i - 3) * 1.2, -2 + (i % 2) * 4], lean));
      M.ell(p, [4, 5, 4], i % 2 ? FURW : FURG, lean - 0.4 + i * 0.1);
    }
    for (let i = 0; i < 5; i++) M.ell(add(chest, rot2([-9 + i * 5, 13 + (i % 2) * 2, 7], lean)), [3, 4, 3], FURG, lean + 0.2);
    // 머리: 어깨에 파묻힌 머리, 푸른 얼굴, 두꺼운 눈썹, 짧은 뿔
    const h = add(chest, rot2([13, -13, 1], lean));
    M.ell(add(h, [-3, -1, 0]), [9, 8.5, 8], FURW, lean);
    M.ell(add(h, rot2([3, 1.5, 4.2], lean)), [7, 6.5, 5], SKINB, lean);
    M.ell(add(h, rot2([3.5, -3.5, 6], lean)), [6.5, 1.8, 3], FURG, lean - 0.15);
    M.sphere(add(h, rot2([2.6, -1.4, 8.4], lean)), 1.5, ICEG).sphere(add(h, rot2([7, -1.4, 6], lean)), 1.2, ICEG);
    M.sphere(add(h, rot2([6.5, 1, 7.6], lean)), 1.4, mat(0x2a3a58));
    M.ell(add(h, rot2([5, 5 + jaw * 2, 6.4], lean)), [4.4, 1.2 + jaw * 1.8, 2.4], GUM, lean);
    M.cap(add(h, rot2([2.4, 4, 8], lean)), add(h, rot2([2.4, 7.4, 8], lean)), 0.9, 0.2, FANG).cap(add(h, rot2([7.6, 4, 6.6], lean)), add(h, rot2([7.6, 7.4, 6.6], lean)), 0.9, 0.2, FANG);
    M.cap(add(h, rot2([-3, -6, 4], lean)), add(h, rot2([-7, -13, 5], lean)), 2, 0.4, BONE).cap(add(h, rot2([-3, -6, -4], lean)), add(h, rot2([-8, -12, -4], lean)), 1.8, 0.4, BONE);
    // 앞팔
    M.ell(add(chest, rot2([-1, -6, 12], lean)), [7, 6, 6], FURW, lean);
    const [, hN] = arm(M, add(chest, rot2([-1, -5, 12], lean)), aN[0], 16, aN[1], 15, 6.4, 6, FURW);
    M.ell(hN, [6, 5.4, 5.4], SKINB);
    ball && M.sphere(add(hN, [1, -4, 2]), 5 + ball * 4, SNOW);
  },
};

// ════ 얼어붙은 병사 ════ (얼음에 반쯤 갇힌 해골 궁수, 얼음 활)
export const frozenSoldier = {
  fw: 64, fh: 66, w: 16, h: 32,
  anims: { idle: [6, 5], move: [8, 8], draw: [3, 8, !1], shoot: [2, 12, !1], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 64, cx = 28;
    let bob = 0, lean = 0.05, legs = gait(0, 0.1, 0), pull = 0, aim = 0;
    if (nm === "idle") bob = Math.sin((k / n) * TAU) * 0.5;
    if (nm === "move") ((legs = gait((k / n) * TAU, 0.35, 0.5)), (bob = Math.abs(Math.cos((k / n) * TAU)) * 1.2));
    if (nm === "draw") ((pull = (k + 1) / 3), (aim = -0.1), (lean = -0.05), (legs = [[PI / 2 - 0.3, 0.2], [PI / 2 + 0.3, -0.1]]));
    if (nm === "shoot") ((pull = k ? 0 : 0.2), (aim = -0.1), (lean = -0.1), (legs = [[PI / 2 - 0.3, 0.2], [PI / 2 + 0.3, -0.1]]));
    if (nm === "hurt") ((lean = -0.25), (bob = 1));
    const hip = [cx, G - 22 + bob * 0.3, 0];
    leg(M, add(hip, [0, 0, -4]), legs[1][0], 10, legs[1][1], 11, 2.2, 1.8, BONE, BONE, 3);
    // 앞다리는 얼음에 덮였다
    const [kn] = leg(M, add(hip, [0, 0, 4]), legs[0][0], 10, legs[0][1], 11, 2.4, 2, BONE, STEELB, 3.5);
    M.box(lerp3(add(hip, [0, 0, 4]), kn, 0.5), [4, 6, 4], ICE, legs[0][0] - PI / 2, 0.3);
    const chest = add(hip, rot2([0, -12], lean));
    M.ell(add(hip, rot2([0, -1], lean)), [6, 3.5, 5], STEELB, lean);
    // 녹슨 흉갑 + 갈비뼈
    M.ell(chest, [7, 8, 6], STEELB, lean);
    for (let i = 0; i < 3; i++) M.cap(add(chest, rot2([-3, -2 + i * 3, 6], lean)), add(chest, rot2([4, -2 + i * 3, 6], lean)), 0.8, 0.8, BONE);
    // 등에 박힌 얼음 덩이 (갇혀 있던 흔적)
    M.box(add(chest, rot2([-6, 0, -4], lean)), [3.5, 6, 4], ICE, 0.4, 0.5);
    M.box(add(chest, rot2([-7, -7, -4], lean)), [2, 3.5, 2.5], ICED, -0.3, 0.8);
    // 해골 머리 + 투구
    const h = add(chest, rot2([2, -11, 0], lean));
    M.ell(h, [5, 5.4, 5], BONE, lean);
    M.ell(add(h, [0, -2.5, 0]), [5.6, 3, 5.6], STEELB, lean);
    M.ell(add(h, rot2([2.4, 0, 4.2], lean)), [1.4, 1.4, 0.8], NOSE, lean).ell(add(h, rot2([4.6, 0, 2.2], lean)), [1.1, 1.3, 0.8], NOSE, lean);
    M.sphere(add(h, rot2([2.4, 0, 4.8], lean)), 0.7, FROST).sphere(add(h, rot2([4.8, 0, 2.6], lean)), 0.6, FROST);
    M.ell(add(h, rot2([3, 3.4, 2.6], lean)), [2.6, 0.9, 2.4], BONE, lean);
    // 얼음 활 (앞)
    const bh = add(chest, rot2([10, -4, 6], lean + aim));
    const ba = aim;
    const top = add(bh, rot2([-3 - pull * 2, -12], ba)), bot = add(bh, rot2([-3 - pull * 2, 12], ba));
    M.cap(bh, top, 1.4, 0.6, ICE).cap(bh, bot, 1.4, 0.6, ICE);
    const str = add(bh, rot2([-4 - pull * 9, 0], ba));
    M.cap(top, str, 0.35, 0.35, ICEW).cap(str, bot, 0.35, 0.35, ICEW);
    M.cap(add(chest, rot2([1, -5, 6], lean)), bh, 2, 1.6, BONE);
    M.cap(add(chest, rot2([0, -5, -5], lean)), str, 2, 1.6, BONE);
    pull > 0.1 && (M.cap(str, add(str, rot2([16, 0], ba)), 0.6, 0.6, ICE), shard(M, add(str, rot2([15, 0], ba)), ba, 4, 1.4, ICEW));
  },
};

// ════ 고드름 박쥐 ════ (천장에 거꾸로 매달림 / 날개에 고드름)
export const icicleBat = {
  fw: 64, fh: 50, w: 18, h: 14, flying: !0,
  anims: { idle: [4, 4], hang: [4, 4], fly: [4, 14], drop: [3, 12, !1], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const cx = 32, cy = 22;
    if (nm === "hang" || nm === "idle") {
      // 거꾸로 매달려 날개로 몸을 감싼다. 아래로 고드름
      const sw = Math.sin((k / n) * TAU) * 0.6, top = [cx, 4, 0];
      M.cap(add(top, [-2, 0, 0]), add(top, [-2, 5, 0]), 0.8, 0.8, SLATE).cap(add(top, [2, 0, 0]), add(top, [2, 5, 0]), 0.8, 0.8, SLATE);
      const b = add(top, [sw, 14, 0]);
      M.ell(b, [7, 10, 6], WINGM, sw * 0.05);
      M.ell(add(b, [0, 1, 3]), [5, 8, 3], WINGM);
      const h = add(b, [sw, 10, 2]);
      M.ell(h, [4.6, 4.2, 4.2], SLATE);
      M.cap(add(h, [-2.5, 2, 1]), add(h, [-4, 7, 1]), 1.4, 0.3, SLATE).cap(add(h, [2.5, 2, 1]), add(h, [4, 7, 1]), 1.4, 0.3, SLATE);
      M.sphere(add(h, [-1.6, 0.5, 3.6]), 0.9, FROST).sphere(add(h, [1.6, 0.5, 3.6]), 0.9, FROST);
      for (let i = 0; i < 3; i++) shard(M, add(b, [-4 + i * 4, 6, 4]), PI / 2, 3 + (i % 2) * 2, 1.2, ICE);
      return;
    }
    let flap = Math.sin((k / Math.max(1, n)) * TAU), dive = 0;
    if (nm === "drop") ((dive = [0.4, 0.8, 0.6][k]), (flap = [1, -1, 0.3][k]));
    if (nm === "hurt") flap = 0.6;
    const b = [cx, cy + dive * 2, 0];
    const wing = (z, m) => {
      const u = (flap + 1) / 2, P = (U, D) => add(b, [lerp(D[0], U[0], u), lerp(D[1], U[1], u), z]);
      const sh = add(b, [0, -3, z]);
      const el = P([-2, -10], [-3, 2]), wr = P([-5, -18], [-6, 7]);
      const tips = [P([-22, -20], [-20, 12]), P([-20, -9], [-16, 18]), P([-12, -3], [-9, 17])];
      M.cap(sh, el, 1.8, 1.3, SLATE).cap(el, wr, 1.3, 1, SLATE);
      for (const t of tips) M.cap(wr, t, 0.9, 0.4, SLATE);
      const pts = [el, ...tips, add(b, [-5, 3, z * 0.5])];
      for (let i = 0; i < pts.length - 1; i++)
        for (const f of [0.3, 0.55, 0.8]) {
          const q = lerp3(lerp3(wr, pts[i], f), lerp3(wr, pts[i + 1], f), 0.5);
          const r = Math.hypot(pts[i][0] - pts[i + 1][0], pts[i][1] - pts[i + 1][1]) * f * 0.42 + 1;
          M.ell(add(q, [0, 0, -0.5]), [r, r * 0.75, 0.6], m, Math.atan2(pts[i + 1][1] - pts[i][1], pts[i + 1][0] - pts[i][0]));
        }
      shard(M, add(tips[0], [0, 1, 0]), PI / 2 + 0.3, 5, 1.2, ICE);
      shard(M, add(tips[2], [0, 1, 0]), PI / 2, 4, 1, ICE);
    };
    wing(-4, mat(0x4a5a7a, { tex: (u, v) => Math.sin(v * 1.6) * 0.4 }));
    M.ell(b, [5.5, 6, 5], WINGM, 0.3 + dive * 0.5);
    M.ell(add(b, [1, 1, 3]), [3.5, 4.5, 2.4], mat(0xa8c0e0, { tex: rough(0.6, 0.5) }));
    const h = add(b, [5, -4, 1]);
    M.ell(h, [4.4, 4, 4], SLATE);
    M.cap(add(h, [-1, -3, 2]), add(h, [-2, -9, 2]), 1.6, 0.3, SLATE).cap(add(h, [-2, -3, -2]), add(h, [-4, -8, -2]), 1.4, 0.3, SLATE);
    M.sphere(add(h, [2, -0.6, 3.6]), 1, FROST).sphere(add(h, [4, -0.6, 1.6]), 0.8, FROST);
    M.cap(add(h, [2.5, 2.4, 2.6]), add(h, [2.5, 4.4, 2.6]), 0.6, 0.2, FANG);
    M.cap(add(b, [-2, 5, 1]), add(b, [-3, 9, 1]), 0.8, 0.5, SLATE);
    wing(5, WINGM);
  },
};

// ════ 눈사람 폭탄병 ════ (양동이 투구, 석탄 눈, 머리에 꽂힌 도화선 / 몸을 말아 굴러온다)
export const snowmanBomber = {
  fw: 64, fh: 64, w: 20, h: 28,
  anims: { idle: [6, 6], move: [6, 10], roll: [4, 14], swell: [4, 16], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 62, cx = 30;
    const fuse = (p, a = 0) => {
      const tip = add(p, rot2([2, -7], a));
      M.cap(p, tip, 0.8, 0.6, mat(0x3a2a20));
      M.sphere(add(tip, [0, -1, 0]), 1.6 + (k % 2) * 0.6, EYE(k % 2 ? 0xfff0a0 : 0xffa040));
    };
    if (nm === "roll") {
      // 둥글게 말려 구르는 눈덩이 (팔다리 접고, 양동이와 도화선만 보인다)
      const r = 13, c = [cx, G - r, 0], a = (k / n) * TAU;
      M.sphere(c, r, SNOW);
      for (let i = 0; i < 5; i++) {
        const q = a + i * 1.25;
        M.sphere(add(c, [Math.cos(q) * r * 0.85, Math.sin(q) * r * 0.85, 6]), 2.2, i % 2 ? SNOWD : COAL);
      }
      const bk = add(c, [Math.cos(a - 1.2) * r, Math.sin(a - 1.2) * r, 2]);
      M.ell(bk, [5, 4, 5], STEELB, a);
      fuse(add(bk, rot2([0, -3], a)), a);
      return;
    }
    let bob = 0, sq = 1, arms = 0.3, lean = 0;
    if (nm === "idle") bob = Math.sin((k / n) * TAU) * 0.8;
    if (nm === "move") ((bob = Math.abs(Math.sin((k / n) * TAU)) * 2.4), (lean = Math.sin((k / n) * TAU) * 0.08), (arms = 0.3 + Math.sin((k / n) * TAU) * 0.4));
    if (nm === "swell") ((sq = 1 + (k % 2) * 0.12 + k * 0.03), (arms = -0.6));
    if (nm === "hurt") ((lean = -0.2), (bob = 1));
    // 아래 몸 · 가운데 · 머리 (눈덩이 셋)
    const b0 = [cx, G - 11 * sq, 0];
    M.sphere(b0, 11 * sq, SNOW);
    const b1 = add(b0, rot2([1, -15 * sq - bob * 0.3], lean));
    M.sphere(b1, 8.5 * sq, SNOW);
    M.sphere(add(b1, [2, -2, 8]), 1.3, COAL).sphere(add(b1, [3, 3, 7.6]), 1.3, COAL);
    // 몸통에 묶인 폭약 띠
    M.ell(add(b1, [0, 4, 0]), [8.8 * sq, 1.6, 8.8 * sq], mat(0x8a3a2a, { tex: cloth(1) }));
    for (let i = 0; i < 3; i++) M.cap(add(b1, [-4 + i * 4, 1, 7.8]), add(b1, [-4 + i * 4, 6, 7.8]), 1.4, 1.4, mat(0xc04030, { spec: 0.4 }));
    // 나뭇가지 팔
    for (const [z, s] of [[-6, -1], [6, 1]]) {
      const sh = add(b1, [0, -2, z]), a = -PI / 2 - s * (1.2 - arms) + (s < 0 ? PI : 0);
      const e = add(sh, [Math.cos(arms * s - (s < 0 ? PI : 0) + 0.2) * 10 * s, -Math.sin(arms) * 8 - 2, z * 0.3]);
      M.cap(sh, e, 1, 0.6, WOOD).cap(e, add(e, [s * 3, -3, 0]), 0.6, 0.3, WOOD);
    }
    const h = add(b1, rot2([2, -12 * sq], lean));
    M.sphere(h, 6.5 * sq, SNOW);
    // 화난 석탄 눈 + 당근 코 + 석탄 입
    M.sphere(add(h, [2, -1.5, 5.6]), 1.2, COAL).sphere(add(h, [5.2, -1.5, 3]), 1, COAL);
    M.cap(add(h, [1.5, -3.6, 5.6]), add(h, [4, -2.8, 5.2]), 0.5, 0.5, COAL);
    M.cap(add(h, [4, 0.4, 4.6]), add(h, [11, 1.4, 5]), 1.5, 0.3, CARROT);
    for (let i = 0; i < 4; i++) M.sphere(add(h, [1 + i * 1.4, 3 + Math.abs(i - 1.5) * -0.5, 5.6 - i * 0.6]), 0.6, COAL);
    // 양동이 투구 + 도화선
    const bk = add(h, [-1, -6 * sq, 0]);
    M.cap(add(bk, [0, 1.5, 0]), add(bk, [-1, -3, 0]), 6, 4.6, STEELB);
    fuse(add(bk, [-1, -3.5, 0]), -0.3);
  },
};

// ════ [정예] 빙하 거북 ════ (등딱지에 솟은 빙하 봉우리, 껍질 속으로 숨어 회전 / 서리 숨결)
export const glacierTurtle = {
  fw: 124, fh: 100, w: 44, h: 42,
  anims: { idle: [6, 4], move: [8, 6], hide: [3, 10, !1], spin: [4, 18], wind: [3, 7, !1], breath: [4, 14], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 98, cx = 58;
    let bob = 0, ph = 0, headOut = 1, jaw = 0.1, neckUp = 0, spin = 0, hide = 0;
    if (nm === "idle") bob = Math.sin((k / n) * TAU) * 0.6;
    if (nm === "move") ((ph = (k / n) * TAU), (bob = Math.abs(Math.cos(ph)) * 1.4));
    if (nm === "hide") ((hide = (k + 1) / 3), (headOut = 1 - hide));
    if (nm === "spin") ((hide = 1), (headOut = 0), (spin = (k / 4) * TAU));
    if (nm === "wind") ((neckUp = (k + 1) / 3), (jaw = 0.4));
    if (nm === "breath") ((jaw = 1), (neckUp = 0.2 - (k % 2) * 0.1));
    if (nm === "hurt") ((jaw = 0.7), (bob = 1));
    const sh = [cx - 4, G - 24 - bob + hide * 8, 0];
    // 뒷다리 (뭉툭한 기둥)
    const limb = (x, z, o, m) => {
      if (hide > 0.6) return;
      const p = add(sh, [x, 10, z]), s = Math.sin(ph + o) * 4;
      M.cap(p, [p[0] + s, G - 3, z], 5.5, 5, m);
      M.ell([p[0] + s + 2, G - 2, z], [6, 2.6, 5], m);
    };
    limb(-16, -12, PI, mat(0x3a5050, { tex: rough(0.5, 0.6) }));
    limb(18, -12, 0, mat(0x3a5050, { tex: rough(0.5, 0.6) }));
    // 등딱지: 납작한 돔 + 무늬 + 빙하 봉우리
    const rot = spin;
    M.ell(sh, [30, 16, 22], SHELL, Math.sin(rot) * 0.05);
    M.ell(add(sh, [0, 10, 0]), [29, 5, 21], mat(0x7a8a80, { tex: (u, v) => (Math.floor(u * 0.25) % 2 ? 0.2 : -0.2) }));
    for (let i = 0; i < 5; i++) {
      const a = rot + i * 1.26, x = Math.cos(a) * 16, z = Math.sin(a) * 10;
      const base = add(sh, [x, -10 + Math.abs(z) * 0.2, z]);
      shard(M, base, -PI / 2 + Math.cos(a) * 0.35, 20 - (i % 2) * 6, 6, i % 2 ? ICED : ICE);
    }
    shard(M, add(sh, [0, -13, 0]), -PI / 2, 30, 8.5, ICE);
    shard(M, add(sh, [-6, -12, 3]), -PI / 2 - 0.35, 20, 5.5, ICED);
    shard(M, add(sh, [7, -12, -2]), -PI / 2 + 0.3, 22, 6, ICE);
    // 회전 중: 서리 소용돌이
    spin && [0, 1, 2].forEach((i) => M.sphere(add(sh, [Math.cos(rot * 2 + i * 2.1) * 34, 6, Math.sin(rot * 2 + i * 2.1) * 20]), 2.2, FROST));
    // 앞다리
    limb(-14, 12, 0, TURT);
    limb(20, 12, PI, TURT);
    // 목 + 머리 (부리 같은 입, 서리 수염)
    if (headOut > 0.05) {
      const nb = add(sh, [26, 2, 4]);
      const hd = add(nb, [10 * headOut, -6 * neckUp - 2, 2]);
      M.cap(nb, hd, 6 * headOut, 5 * headOut, TURT);
      const hs = headOut;
      M.ell(hd, [8 * hs, 6 * hs, 6.5 * hs], TURT, -neckUp * 0.4);
      M.ell(add(hd, rot2([5, 3 + jaw * 2, 2], jaw * 0.3)), [5 * hs, 1.6 + jaw * 1.5, 4.5 * hs], mat(0x3a5050), jaw * 0.3);
      jaw > 0.5 && M.ell(add(hd, [7, 2, 3]), [3, jaw * 1.6, 2.5], FROST);
      M.sphere(add(hd, [3, -2, 5.6 * hs]), 1.4 * hs, ICEG).sphere(add(hd, [6, -2, 3 * hs]), 1.1 * hs, ICEG);
      for (let i = 0; i < 3; i++) shard(M, add(hd, [2 - i * 2, 5, 3]), PI / 2 + 0.2, 4 * hs, 1.2, ICE);
    }
  },
};

// ════ [정예] 서리 처녀 ════ (얼음 왕관, 흘러내리는 드레스, 결정 지팡이)
export const frostMaiden = {
  fw: 72, fh: 86, w: 18, h: 40,
  anims: { idle: [8, 7], move: [8, 8], cast: [3, 10, !1], raise: [3, 8, !1], barrier: [4, 10], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 84, cx = 32;
    const sw = Math.sin((k / Math.max(1, n)) * TAU);
    let float = 2 + sw * 1.2, lean = 0, aN = [1.9, 0.4], aF = [1.6, 0.5], staff = 0, glow = 0;
    if (nm === "move") ((lean = 0.12), (float = 3 + sw));
    if (nm === "cast") ((aN = [[-0.4, -0.3], [-0.1, -0.1], [0.1, 0]][k]), (lean = [0.05, 0.15, 0.2][k]), (glow = [0.6, 1, 0.5][k]));
    if (nm === "raise") ((aN = [lerp(1.9, -1.6, ease((k + 1) / 3)), -0.2]), (aF = [lerp(1.6, -1.3, ease((k + 1) / 3)), -0.3]), (glow = (k + 1) / 3), (float = 2 + k * 2));
    if (nm === "barrier") ((aN = [-0.2, -0.4]), (aF = [-0.6, -0.4]), (glow = 0.8 + (k % 2) * 0.3));
    if (nm === "hurt") ((lean = -0.25), (float = 1));
    const waist = [cx, G - 30 - float, 0];
    // 드레스: 위는 좁고 아래로 퍼지며 끝이 얼음 조각
    cape(M, add(waist, [-2, -14, -3]), 40, 12, 0.3, GOWND, k, -5);
    const hem = add(waist, [-3 + Math.sin(k * 0.9) * 1.5, 25, 0]);
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      M.ell(lerp3(add(waist, [0, 1, 0]), hem, t), [4.5 + t * t * 7 + t * 2, 1.6, 4 + t * t * 6 + t * 2], i > 22 ? GOWND : GOWN, 0);
    }
    for (let i = 0; i < 3; i++) M.cap(add(waist, [1 + i * 2, 4, 4.5]), add(waist, [-3 + i * 5 - 2, 25, 10 - Math.abs(i - 1) * 2]), 0.8, 1.6, mat(0xa8c8f0, { tex: cloth(0.7) }));
    for (let i = 0; i < 5; i++) shard(M, add(waist, [-14 + i * 6.5 - 3, 28, 2]), PI / 2 + (i - 2) * 0.15, 4 + (i % 2) * 3, 1.6, ICE);
    // 뒷머리 (긴 흰 머리카락)
    const chest = add(waist, rot2([0, -10], lean));
    const h = add(chest, rot2([1, -11, 0], lean));
    for (let i = 0; i < 4; i++) M.ell(add(h, [-4 - i * 1.2, 3 + i * 5, -2]), [4 - i * 0.4, 4, 3.5], HAIR, 0.15);
    // 뒷팔
    arm(M, add(chest, rot2([0, -5, -5], lean)), aF[0], 8, aF[1], 8, 1.8, 1.4, SKINP);
    // 몸통 (코르셋) + 얼음 어깨 장식
    M.ell(chest, [5.5, 7.5, 4.5], GOWN, lean);
    M.ell(add(chest, rot2([1, 1, 3.5], lean)), [3, 5, 1.5], mat(0xb8d8ff, { spec: 0.6 }), lean);
    for (const z of [-5, 5]) shard(M, add(chest, rot2([0, -6, z], lean)), -PI / 2 - 0.4, 6, 2, ICE);
    // 얼굴 + 왕관
    M.ell(h, [4.6, 5.2, 4.6], SKINP, lean);
    M.ell(add(h, rot2([-1.5, -2.5, 0], lean)), [5, 3.2, 5], HAIR, lean);
    M.sphere(add(h, rot2([2.4, -0.4, 4], lean)), 0.8, FROST).sphere(add(h, rot2([4.2, -0.4, 2], lean)), 0.7, FROST);
    M.ell(add(h, rot2([3, 2.6, 3], lean)), [1.2, 0.4, 0.8], mat(0x6a7ab8), lean);
    for (let i = 0; i < 5; i++) shard(M, add(h, rot2([-4 + i * 2, -4.6, 0], lean)), -PI / 2 + (i - 2) * 0.28, 4 + (i === 2 ? 4 : i % 2 ? 1 : 2.5), 1, ICE);
    // 앞팔 + 결정 지팡이
    const [, hd] = arm(M, add(chest, rot2([1, -5, 5], lean)), aN[0], 8, aN[1], 8, 1.8, 1.4, SKINP);
    const sa = -PI / 2 + 0.15 + staff;
    M.cap(add(hd, [-Math.cos(sa) * 14, -Math.sin(sa) * 14, 0.5]), add(hd, [Math.cos(sa) * 12, Math.sin(sa) * 12, 0.5]), 0.9, 0.9, mat(0xc8d8f0, { spec: 0.7, shin: 60 }));
    const top = add(hd, [Math.cos(sa) * 14, Math.sin(sa) * 14, 0.5]);
    M.box(top, [2.4, 4.4, 2.4], ICE, 0.785, 0.4);
    glow > 0 && M.sphere(top, 2 + glow * 2, ICEW);
  },
};

// ════ 보스 「서리비늘 크리오스」 ════ (얼음 와이번: 두 다리 · 날개가 곧 앞발 · 긴 목 · 얼음 가시 꼬리)
export const kryos = {
  boss: !0, fw: 210, fh: 176, w: 60, h: 70,
  anims: { idle: [4, 5], move: [6, 8], stagger: [1, 1], breath: [2, 12], rear: [1, 1], fly: [4, 10], dive: [1, 1], claw: [2, 12, !1], roar: [1, 1], wing: [2, 10], tail: [2, 12, !1] },
  model(M, nm, k, n) {
    const G = 173, cx = 104;
    let bob = 0, ph = 0, tilt = 0, neckA = -0.9, headA = 0.2, jaw = 0.1, wingUp = 0, wingSpread = 0.2, tailA = 0, crouch = 0, air = 0, clawA = 0;
    if (nm === "idle") ((bob = Math.sin((k / n) * TAU) * 1.4), (neckA = -0.9 + Math.sin((k / n) * TAU) * 0.05), (wingUp = Math.sin((k / n) * TAU) * 0.1));
    if (nm === "move") ((ph = (k / n) * TAU), (bob = Math.abs(Math.cos(ph)) * 3), (tilt = 0.08), (wingUp = Math.sin(ph) * 0.15));
    if (nm === "stagger") ((crouch = 14), (neckA = -0.1), (headA = 0.6), (jaw = 0.6), (wingSpread = 0.1), (tilt = 0.15));
    if (nm === "breath") ((neckA = -0.35), (headA = 0.1 + (k % 2) * 0.03), (jaw = 1), (tilt = 0.1), (wingSpread = 0.5), (wingUp = -0.2));
    if (nm === "rear") ((tilt = -0.4), (neckA = -1.3), (headA = -0.3), (jaw = 0.7), (wingSpread = 1), (wingUp = 0.8));
    if (nm === "fly") ((air = 30), (wingSpread = 1), (wingUp = Math.sin((k / n) * TAU) * 1.1), (tilt = 0.1), (neckA = -0.6));
    if (nm === "dive") ((air = 18), (tilt = 0.55), (wingSpread = 0.7), (wingUp = 0.9), (neckA = -0.1), (headA = 0.3), (jaw = 0.8), (clawA = 1));
    if (nm === "claw") ((tilt = [0.05, 0.25][k]), (clawA = [0.3, 1][k]), (wingSpread = [0.9, 0.6][k]), (wingUp = [0.8, -0.4][k]), (neckA = -0.7), (jaw = 0.7));
    if (nm === "roar") ((neckA = -1.25), (headA = -0.5), (jaw = 1), (wingSpread = 1), (wingUp = 0.5), (tilt = -0.12));
    if (nm === "wing") ((wingSpread = 1), (wingUp = [1.1, -0.9][k]), (tilt = -0.05), (neckA = -0.8), (jaw = 0.4));
    if (nm === "tail") ((tailA = [0.9, -0.6][k]), (tilt = [0.1, 0.15][k]), (neckA = -0.5), (headA = 0.4));
    const body = [cx - 10, G - 62 - bob + crouch * 0.6 - air, 0];
    const fwd = (d) => add(body, rot2(d, tilt));
    const hipP = fwd([-14, 4, 0]), chestP = fwd([16, -4, 0]);
    // 꼬리 (가시 달린 긴 꼬리, 휘두를 수 있다)
    let tp = add(hipP, rot2([-12, 2, 0], tilt));
    for (let i = 0; i < 8; i++) {
      const a = PI - 0.25 + tailA * (i / 8) * 1.4 + Math.sin(ph + i * 0.6) * 0.06 + (air ? 0.2 : 0);
      const q = add(tp, [Math.cos(a) * 7, -Math.sin(a) * 7 * -1 + 1.8 - (air ? 0 : i * 0.2), -i * 0.3]);
      M.cap(tp, q, 7 - i * 0.75, 6.4 - i * 0.75, i % 2 ? WSCALE : WSCALED);
      i % 2 || shard(M, add(q, [0, -4 + i * 0.3, 0]), -PI / 2 - 0.4, 7 - i * 0.6, 2.4, ICE);
      tp = q;
    }
    shard(M, tp, PI + 0.1 + tailA * 0.8, 12, 3.4, ICE);
    shard(M, tp, PI - 0.6 + tailA * 0.8, 9, 2.6, ICED);
    // 뒷다리 (먼 쪽)
    const legW = (z, m, o) => {
      if (air && nm !== "dive") {
        const kn = add(hipP, [4, 12, z]);
        M.cap(add(hipP, [0, 2, z]), kn, 8, 6, m).cap(kn, add(kn, [-6, 12, 0]), 6, 4, m);
        return;
      }
      const s = Math.sin(ph + o) * 7, hp = add(hipP, [2, 4, z]);
      const ft = [hp[0] + 4 + s, G - 3, z], kn = [hp[0] + 14 + s * 0.5, lerp(hp[1], G, 0.45), z];
      const ank = [ft[0] - 6, G - 12, z];
      M.ell(add(hp, [3, 4, 0]), [11, 13, 8], m, 0.6);
      M.cap(add(hp, [4, 6, 0]), kn, 8, 6.5, m);
      M.cap(kn, ank, 6, 4.2, m).cap(ank, ft, 4.2, 3.4, m);
      M.sphere(kn, 6.5, m);
      for (let i = 0; i < 3; i++) M.cap(ft, add(ft, [6 + i * 1.5, 2, -3 + i * 3]), 2.2, 0.6, ICEW);
      M.cap(ank, add(ank, [-5, 4, 0]), 1.6, 0.4, ICEW);
    };
    // 먼 날개 (날개가 앞발: 팔뚝 + 손가락 뼈 + 막)
    // 날개 자세: 접힘 / 펼침(가운데·위·아래) 사이를 섞는다. 점은 어깨 기준
    const WK = {
      fold: [[-10, -6], [-2, -14], [-22, -16], [-24, -10], [-22, -4], [-16, 0]],
      mid: [[-8, -16], [2, -30], [-40, -44], [-48, -26], [-40, -8], [-24, 2]],
      up: [[-6, -20], [4, -42], [-28, -66], [-44, -48], [-42, -26], [-26, -4]],
      down: [[-6, -4], [6, 4], [-22, 30], [-34, 22], [-38, 10], [-26, 2]],
    };
    const wingF = (z, m, mem, far) => {
      const sh = add(chestP, rot2([-4, -8, z], tilt));
      const sp = Math.min(1, wingSpread), up = Math.max(-1, Math.min(1, wingUp));
      const pose = WK.fold.map((f, i) => {
        const tgt = up >= 0 ? [lerp(WK.mid[i][0], WK.up[i][0], up), lerp(WK.mid[i][1], WK.up[i][1], up)] : [lerp(WK.mid[i][0], WK.down[i][0], -up), lerp(WK.mid[i][1], WK.down[i][1], -up)];
        const q = [lerp(f[0], tgt[0], sp) * 1.5, lerp(f[1], tgt[1], sp) * 1.5];
        return add(sh, rot2([q[0], q[1], z * (0.2 + i * 0.05)], tilt * 0.5));
      });
      const [el, wr, ...tips] = pose;
      M.cap(sh, el, 5.5, 4, m).cap(el, wr, 4, 3, m);
      for (const t of tips) M.cap(wr, t, 1.9, 0.7, m);
      // 막: 손목에서 부채꼴로, 손가락 사이를 채우고 가장자리는 물결
      const pts = [...tips, add(hipP, [-6, -4, z * 0.4])];
      for (let i = 0; i < pts.length - 1; i++)
        for (let f = 0.18; f < 0.95; f += 0.13) {
          const a = lerp3(wr, pts[i], f), b = lerp3(wr, pts[i + 1], f);
          const r = Math.hypot(a[0] - b[0], a[1] - b[1]) * 0.42 + 1.4;
          M.ell(add(lerp3(a, b, 0.5), [0, 0, -1]), [r, r * 0.8, 0.8], mem, Math.atan2(b[1] - a[1], b[0] - a[0]));
        }
      // 앞쪽 막 (어깨-팔꿈치-손목)
      for (const f of [0.35, 0.7]) M.ell(add(lerp3(lerp3(sh, el, f), lerp3(sh, wr, f), 0.5), [0, 0, -1]), [5, 4, 0.8], mem, 0);
      // 날개 손톱
      M.cap(wr, add(wr, [4 + clawA * 6, 6 + clawA * 4, 0]), 2.2, 0.4, ICEW);
      M.cap(wr, add(wr, [2 + clawA * 4, 8 + clawA * 4, 2]), 2, 0.4, ICEW);
      far && shard(M, el, -PI / 2 - 1, 7, 2.2, ICED);
    };
    wingF(-14, WSCALED, mat(0x34466e, { tex: (u, v) => Math.sin(v * 1.2) * 0.35 }), !0);
    legW(-10, WSCALED, PI);
    // 몸통
    M.ell(hipP, [14, 13.5, 13], WSCALE, tilt);
    M.ell(body, [25, 14.5, 14.5], WSCALE, tilt);
    M.ell(chestP, [15, 16, 13.5], WSCALE, tilt - 0.15);
    M.ell(add(chestP, rot2([3, 8, 7], tilt)), [10, 8, 6], WBELLY, tilt - 0.2);
    M.ell(add(body, rot2([2, 9, 8], tilt)), [14, 5, 6], WBELLY, tilt);
    // 등 가시 줄
    for (let i = 0; i < 6; i++) shard(M, fwd([-20 + i * 7, -14 + Math.abs(i - 3) * 0.6, 0]), -PI / 2 - 0.35 + tilt, 9 + (i % 2) * 4, 3, i % 2 ? ICE : ICED);
    legW(10, WSCALE, 0);
    // 목 (S자) + 머리
    let np = add(chestP, rot2([8, -8, 2], tilt));
    for (let i = 0; i < 5; i++) {
      const a = neckA + tilt + (i - 2) * 0.12;
      const q = add(np, [Math.cos(a) * 7, Math.sin(a) * 7, 0.4]);
      M.cap(np, q, 8 - i * 0.6, 7.4 - i * 0.6, WSCALE);
      M.ell(add(lerp3(np, q, 0.5), [1.5, 2, 4]), [3.5, 3, 2], WBELLY, a);
      i % 2 && shard(M, add(lerp3(np, q, 0.5), [-3, -3, 0]), a - PI / 2 - 0.5, 6, 1.8, ICE);
      np = q;
    }
    const ha = headA + tilt;
    const hd = add(np, rot2([7, 0, 1], ha));
    M.ell(hd, [11.5, 8.5, 9], WSCALE, ha);
    // 위턱 (긴 주둥이) + 아래턱
    const snout = add(hd, rot2([14, 1, 1], ha));
    M.cap(add(hd, rot2([4, 0, 1], ha)), snout, 6, 3.6, WSCALE);
    M.sphere(add(snout, rot2([0.5, -1.2, 2.4], ha)), 0.9, NOSE);
    const ja = ha + jaw * 0.55;
    const jawE = add(hd, rot2([13, 5, 1], ja));
    M.cap(add(hd, rot2([2, 4, 1], ja)), jawE, 4.4, 2.6, WSCALED);
    jaw > 0.3 && M.ell(add(hd, rot2([8, 4, 3], (ha + ja) / 2)), [6, jaw * 2.4, 3.6], GUM, (ha + ja) / 2);
    jaw > 0.3 && [0, 1, 2].forEach((i) => M.cap(add(snout, rot2([-3 - i * 3, 2.4, 3], ha)), add(snout, rot2([-3 - i * 3, 4.6, 3], ha)), 0.9, 0.2, FANG));
    nm === "breath" && [0, 1, 2, 3].forEach((i) => M.sphere(add(snout, rot2([6 + i * 7, 3 + i * 1.5, 2], ha + jaw * 0.25)), 3 + i * 1.6, i ? mat(0xc8f0ff, { emit: 0x9ad8ff }) : ICEW));
    // 뿔 왕관 + 눈
    for (const [dx, dy, a, l, w] of [[-6, -6, -2.6, 16, 3], [-3, -7, -2.2, 12, 2.4], [0, -6, -1.9, 8, 2]]) shard(M, add(hd, rot2([dx, dy, 3], ha)), a + ha, l, w, ICE);
    shard(M, add(hd, rot2([-6, -5, -4], ha)), -2.5 + ha, 13, 2.6, ICED);
    M.ell(add(hd, rot2([4, -3, 6.6], ha)), [3, 1.2, 1], WSCALED, ha - 0.3);
    M.sphere(add(hd, rot2([4.4, -2.4, 7.2], ha)), 1.6, ICEG).sphere(add(hd, rot2([8, -2.4, 4.2], ha)), 1.3, ICEG);
    // 가까운 날개
    wingF(14, WSCALE, WINGM, !1);
  },
};
