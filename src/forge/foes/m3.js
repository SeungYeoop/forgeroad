// 4지역 「썩은 늪」 3D 모델 — 광산에서 흘러나온 폐수가 고여 만들어진 늪. 무엇이든 썩어 다시 살아난다.
// 색: 탁한 늪 초록 · 썩은 보라 · 점액 광택 · 병든 빛(연두)
import { mat, rough, cloth, cape, plates, EYE, gait, leg, arm, PI, TAU, chain, add, rot2, ease, lerp, noise3, hash } from "./rig.js";

const SLIME = (c, o = {}) => mat(c, { spec: 0.55, shin: 46, rim: 0.6, rimCol: 0xd8ffb0, ...o });
const LEECH = SLIME(0x4a2e44, { tex: (u) => (Math.floor(u * 0.7) % 2 ? 0.35 : -0.25) });
const LEECHB = SLIME(0x7a4a5a, { tex: rough(0.5, 0.5) });
const MAW = mat(0x2a0a10), TOOTH = mat(0xf0e8d0, { spec: 0.4 });
const ROT = mat(0x7a8a64, { tex: (u, v, w, s) => (noise3(u * 0.4 + s, v * 0.4, w * 0.4) - 0.5) * 1.4, rim: 0.5, rimCol: 0xd0ff90 });
const ROTD = mat(0x56604a, { tex: rough(0.5, 1) });
const BRUISE = mat(0x6a4a6a, { tex: rough(0.6, 0.8) });
const PUS = EYE(0xc8ff60), PUSD = EYE(0x8ad040);
const RAG = mat(0x5a5040, { tex: cloth(0.6) });
const TOAD = mat(0x6a8a3a, { tex: (u, v, w, s) => (noise3(u * 0.5 + s, v * 0.5, w * 0.5) > 0.66 ? -0.9 : 0.1), rim: 0.55, rimCol: 0xe8ffa0, spec: 0.3, shin: 30 });
const TOADB = mat(0xc8c890, { tex: rough(0.5, 0.5), spec: 0.2 });
const TOADD = mat(0x4a6428, { tex: rough(0.5, 1) });
const TONGUE = SLIME(0xd85a6a);
const BARKA = mat(0x6a4a2e, { tex: (u, v) => Math.sin(u * 1.4 + v * 0.3) * 0.5 });
const BONE = mat(0xd8ccb0, { tex: rough(0.6, 0.5), spec: 0.2 });
const EYEY = EYE(0xffe060), EYEG = EYE(0xb8ff60), EYER = EYE(0xff4030), EYEW = EYE(0xffffff), EYEP = EYE(0xd890ff);
const PUPIL = mat(0x101008);
const DFLY = mat(0x2a9a7a, { spec: 0.8, shin: 50, rim: 0.8, rimCol: 0xa0fff0, tex: (u) => (Math.floor(u * 0.6) % 2 ? 0.4 : -0.2) });
const DWING = mat(0xa8d8e8, { rim: 0.9, rimCol: 0xffffff, hi: 0xf0ffff, lo: 0x3a6a7a, tex: (u, v) => (Math.abs(Math.sin(u * 1.1 + v * 0.6)) < 0.13 ? -1.4 : 0.2) });
const CEYE = mat(0xd84a2a, { spec: 0.9, shin: 60, rim: 0.8, rimCol: 0xffd0a0, tex: (u, v) => ((Math.floor(u * 1.5) + Math.floor(v * 1.5)) % 2 ? 0.4 : -0.2) });
const HAG = mat(0x8a9a78, { tex: rough(0.5, 0.8), rim: 0.5, rimCol: 0xe0ffc0 });
const HAIR = mat(0xd8dcd0, { rim: 0.7, rimCol: 0xffffff, tex: (u) => Math.sin(u * 2.4) * 0.5 });
const SHAWL = mat(0x4a6034, { tex: (u, v, w, s) => (noise3(u + s, v, w) - 0.5) * 1.6 });
const ROBEH = mat(0x4a3a4e, { tex: cloth(0.5) });
const STAFF = mat(0x5a4632, { tex: (u) => Math.sin(u * 3) * 0.4 });
const GFIRE = EYE(0x9aff60), GFIRED = EYE(0x5ac030);
const SHROOM = (c) => mat(c, { rim: 0.8, rimCol: 0xffffff, tex: (u, v, w, s) => (noise3(u * 0.4 + s, v * 0.4, w * 0.4) > 0.66 ? 1.6 : 0) });
const GLOWC = EYE(0x60fff0), GLOWM = EYE(0xff70e8);
const STEM = mat(0xd8d0c0, { tex: rough(0.4, 0.4) });
const TROLL = mat(0x5a7a6a, { tex: (u, v, w, s) => (noise3(u * 0.4 + s, v * 0.4, w * 0.4) - 0.5) * 1.2, rim: 0.55, rimCol: 0xd8ffd0 });
const TROLLD = mat(0x3e5648, { tex: rough(0.5, 1) });
const MOSS = mat(0x5a7a2e, { tex: (u, v, w, s) => (noise3(u * 1.2 + s, v * 1.2, w * 1.2) - 0.5) * 1.8, rim: 0.4, rimCol: 0xd0ff90 });
const TUSK = mat(0xe8e0c8, { spec: 0.4 });
const LOG = mat(0x5a4028, { tex: (u, v) => Math.sin(v * 1.2 + noise3(u * 0.2, v * 0.2, 0) * 4) * 0.5 });
const MUD = mat(0x4a5a3a, { emit: null, spec: 0.6, shin: 40, rim: 0.7, rimCol: 0xb8e090 });
const COAT = mat(0x2a2630, { tex: cloth(0.5), spec: 0.3, shin: 30, rim: 0.6, rimCol: 0xb8ffa0 });
const COATD = mat(0x1a1820, { tex: cloth(0.5) });
const BEAK = mat(0xe8e0d0, { spec: 0.6, shin: 50, rim: 0.5 });
const GLOVE = mat(0x4a3a2a, { spec: 0.4 });
const FLASK = mat(0x9ad8a0, { spec: 1, shin: 60, rim: 0.9, rimCol: 0xffffff }), BREW = EYE(0x9aff50);
const KING = mat(0x6a7a3a, { tex: (u, v, w, s) => (noise3(u * 0.3 + s, v * 0.3, w * 0.3) > 0.64 ? -1 : 0.15), rim: 0.55, rimCol: 0xe8ffa0, spec: 0.35, shin: 34 });
const KINGB = mat(0xb8b47a, { tex: rough(0.4, 0.5) });
const CROWN = mat(0xb89a3a, { spec: 0.8, shin: 44, tex: (u, v, w, s) => (noise3(u * 0.5 + s, v * 0.5, w) > 0.6 ? -1 : 0.2) });
const GEM = EYE(0xa0ff60);

// ════ 늪 거머리 ════
export const leech = {
  fw: 56, fh: 34, w: 18, h: 10,
  anims: { idle: [6, 7], move: [6, 10], wind: [2, 8, !1], atk: [2, 14, !1], latch: [4, 10], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 32, cx = 26;
    let squ = 0, rear = 0, lunge = 0, ph = (k / Math.max(1, n)) * TAU, mouth = 0.4, vert = 0;
    if (nm === "idle") squ = Math.sin(ph) * 0.15;
    if (nm === "move") squ = Math.sin(ph) * 0.45;
    if (nm === "wind") ((rear = (k + 1) / 2), (mouth = 1));
    if (nm === "atk") ((lunge = 6 + k * 3), (mouth = 1));
    if (nm === "latch") ((vert = 1), (mouth = 1), (squ = Math.sin(ph) * 0.2));
    if (nm === "hurt") rear = -0.3;
    const segs = 6;
    for (let i = 0; i < segs; i++) {
      const t = i / (segs - 1);
      let x = cx - 14 + t * 26 * (1 - squ * 0.4) + lunge * t, y = G - 4 - Math.sin(t * PI) * (2 + squ * 8);
      if (rear) y -= t * t * rear * 12;
      if (vert) ((x = cx + Math.sin(t * 2 + ph) * 2), (y = G - 4 - t * 22));
      M.sphere([x, y, 0], 4.2 - Math.abs(t - 0.55) * 2.5, i % 2 ? LEECH : LEECHB);
      i === segs - 1 && ((M.ell([x + (vert ? 0 : 2), y - (vert ? 2 : 0), 3.5], [2.6, 2 + mouth * 1.2, 1.5], MAW)), [0, 1, 2, 3, 4, 5].forEach((q) => {
        const a = (q / 6) * TAU;
        M.sphere([x + (vert ? 0 : 2) + Math.cos(a) * 2.4, y - (vert ? 2 : 0) + Math.sin(a) * (2 + mouth), 4.6], 0.5, TOOTH);
      }));
    }
  },
};

// ════ 부풀은 시체 ════
export const bloater = {
  fw: 68, fh: 68, w: 24, h: 36,
  anims: { idle: [6, 5], move: [8, 6], wind: [3, 7, !1], atk: [3, 12, !1], rec: [2, 6, !1], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 66, cx = 32;
    let bob = 0, ph = 0, lean = 0, aA = [1.9, 0.3], swell = 0, jaw = 0.3;
    if (nm === "idle") ((bob = Math.sin((k / n) * TAU) * 1), (swell = Math.sin((k / n) * TAU) * 0.04));
    if (nm === "move") ((ph = (k / n) * TAU), (bob = Math.abs(Math.cos(ph)) * 1.5), (lean = Math.sin(ph) * 0.08));
    if (nm === "wind") ((lean = -0.2 * ((k + 1) / 3)), (aA = [-1.6, -0.4]), (swell = 0.08 * (k + 1)), (jaw = 0.8));
    if (nm === "atk") ((lean = [0.15, 0.35, 0.3][k]), (aA = [[0, 0.2], [0.7, 0.3], [0.9, 0.3]][k]), (jaw = 1));
    if (nm === "rec") lean = 0.2 - k * 0.1;
    if (nm === "hurt") ((lean = -0.25), (jaw = 1));
    const hip = [cx, G - 14 + bob * 0.3, 0];
    const lg = gait(ph, 0.25, 0.4);
    leg(M, add(hip, [-3, 0, -6]), lg[1][0], 6, lg[1][1], 6, 3.4, 3, ROTD, ROTD, 3.5);
    leg(M, add(hip, [3, 0, 6]), lg[0][0], 6, lg[0][1], 6, 3.6, 3.2, ROT, ROTD, 3.5);
    // 거대한 배
    const belly = add(hip, rot2([2, -14], lean));
    M.ell(belly, [17 * (1 + swell), 16 * (1 + swell), 14 * (1 + swell)], ROT, lean);
    M.ell(add(belly, rot2([4, 4, 9], lean)), [9, 8, 5], BRUISE, lean);
    // 고름 종기
    for (const [dx, dy, dz, r] of [[6, -4, 12, 2.6], [-6, 4, 12, 2], [10, 6, 9, 1.8], [-2, -10, 11, 1.6], [2, 10, 12, 1.5]]) (M.sphere(add(belly, rot2([dx, dy, dz], lean)), r, ROTD), M.sphere(add(belly, rot2([dx, dy - r * 0.3, dz + r * 0.6], lean)), r * 0.6, PUS));
    M.ell(add(belly, rot2([-2, 12, 4], lean)), [12, 4, 10], RAG, lean);
    // 뒷팔
    arm(M, add(belly, rot2([-4, -10, -12], lean)), aA[0] + 0.2, 8, aA[1], 7, 2.6, 2.2, ROTD);
    // 작은 머리 (배 위에 파묻힘)
    const h = add(belly, rot2([6, -17, 2], lean));
    M.ell(h, [5.5, 5, 5], ROT, lean);
    M.ell(add(h, [2.5, 2.6, 3.5]), [3, 1 + jaw * 1.4, 2], MAW);
    M.sphere(add(h, [1.5, -1, 4.6]), 1, EYEG).sphere(add(h, [4, -1, 3]), 0.8, EYEG);
    for (let i = 0; i < 3; i++) M.cap(add(h, [-2 + i * 2, -4, 0]), add(h, [-3 + i * 2.4, -7 - (i % 2), -1]), 0.5, 0.3, HAIR);
    // 앞팔
    const [, hd] = arm(M, add(belly, rot2([4, -10, 12], lean)), aA[0], 9, aA[1], 8, 2.8, 2.4, ROT);
    M.ell(hd, [3, 2.6, 2.6], ROT);
  },
};

// ════ 두꺼비 전사 ════
export const toadWarrior = {
  fw: 76, fh: 68, w: 18, h: 32,
  anims: { idle: [6, 6], move: [8, 9], tongue: [3, 14, !1], wind: [3, 9, !1], atk: [3, 16, !1], rec: [2, 8, !1], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 66, cx = 30;
    let bob = 0, lean = 0.15, legs = gait(0, 0.1, 0), cA = [1.2, 0.5], tongue = 0, jaw = 0.1, throat = 0;
    if (nm === "idle") ((bob = Math.sin((k / n) * TAU) * 0.8), (throat = Math.max(0, Math.sin((k / n) * TAU * 2)) * 1.5));
    if (nm === "move") ((legs = gait((k / n) * TAU, 0.5, 0.9)), (bob = Math.abs(Math.cos((k / n) * TAU)) * 2.5));
    if (nm === "tongue") ((tongue = [0.3, 1, 0.6][k]), (jaw = 1), (lean = 0.25));
    if (nm === "wind") ((cA = [lerp(1.2, -2.6, ease((k + 1) / n)), -0.5]), (lean = -0.1), (jaw = 0.5));
    if (nm === "atk") ((cA = [[-0.9, -0.2], [0.5, 0.4], [0.9, 0.5]][k]), (lean = [0.25, 0.45, 0.45][k]), (legs = [[PI / 2 - 0.6, 0.6], [PI / 2 + 0.4, -0.2]]));
    if (nm === "rec") ((cA = [1, 0.5]), (lean = 0.3 - k * 0.1));
    if (nm === "hurt") ((lean = -0.25), (jaw = 0.8));
    const hip = [cx, G - 20 + bob * 0.3, 0];
    // 굵은 개구리 다리 (무릎을 바깥으로 굽힘)
    leg(M, add(hip, [-1, 0, -5]), legs[1][0] - 0.3, 9, legs[1][1] + 0.9, 10, 3.6, 2.8, TOADD, TOADD, 5);
    leg(M, add(hip, [1, 0, 5]), legs[0][0] - 0.3, 9, legs[0][1] + 0.9, 10, 3.8, 3, TOAD, TOADD, 5);
    const chest = add(hip, rot2([0, -10], lean));
    M.ell(add(hip, rot2([0, -3], lean)), [9, 8, 8], TOAD, lean);
    M.ell(add(hip, rot2([3, -2, 4], lean)), [6, 7, 5], TOADB, lean);
    M.ell(chest, [9, 8, 8], TOAD, lean);
    // 나무껍질 어깨 갑옷 + 허리띠
    M.ell(add(chest, rot2([0, -4, 6], lean)), [6, 3.5, 4], BARKA, lean + 0.4);
    M.ell(add(hip, rot2([0, -4, 0], lean)), [9.6, 1.6, 8.6], BARKA, lean);
    // 뒷팔
    arm(M, add(chest, rot2([-1, -3, -7], lean)), cA[0] + 0.3, 7, cA[1], 7, 2.4, 2, TOADD);
    // 넓은 머리 + 툭 튀어나온 눈 + 큰 입
    const h = add(chest, rot2([5, -9, 0], lean));
    M.ell(h, [9, 6, 8], TOAD, lean);
    M.ell(add(h, [2, 3 + throat, 2]), [7, 3 + throat, 6], TOADB, lean);
    M.ell(add(h, [5, 1.5 + jaw, 5]), [5.5, 0.8 + jaw * 2, 3], MAW, lean);
    M.sphere(add(h, [1, -5, 5]), 3, TOAD).sphere(add(h, [5, -5, 1.5]), 2.6, TOAD);
    M.sphere(add(h, [1.6, -5.4, 7.4]), 1.6, EYEY).sphere(add(h, [1.9, -5.4, 8.6]), 0.8, PUPIL);
    M.sphere(add(h, [6.2, -5.4, 3.6]), 1.3, EYEY);
    // 혀
    tongue && M.cap(add(h, [6, 2, 5]), add(h, [6 + tongue * 40, 2.5, 5]), 1.8, 2.4, TONGUE);
    // 뼈 몽둥이를 든 앞팔
    const sh = add(chest, rot2([1, -3, 7], lean));
    const [, hd] = arm(M, sh, cA[0], 7, cA[1], 7, 2.6, 2.2, TOAD);
    const ga = cA[0] + cA[1], top = add(hd, [Math.cos(ga) * 15, Math.sin(ga) * 15, 1]);
    M.cap(add(hd, [-Math.cos(ga) * 2, -Math.sin(ga) * 2, 1]), top, 1.4, 2.4, BONE);
    M.sphere(top, 3.6, BONE);
    for (let i = 0; i < 3; i++) M.cap(top, add(top, [Math.cos(i * 2.1) * 5, Math.sin(i * 2.1) * 5, 0]), 1, 0.3, TOOTH);
  },
};

// ════ 독침 잠자리 ════
export const dragonfly = {
  fw: 68, fh: 44, w: 18, h: 12, flying: !0,
  anims: { idle: [4, 22], wind: [2, 8, !1], shoot: [3, 14, !1], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const cx = 32, cy = 22;
    const buzz = k % 2;
    let curl = 0;
    if (nm === "wind") curl = (k + 1) / 2;
    if (nm === "shoot") curl = [1, 0.6, 0.2][k];
    // 뒷날개
    M.ell([cx - 4, cy - 9 - buzz * 3, -3], [11, 2.4, 0.6], DWING, buzz ? -0.5 : -0.2);
    M.ell([cx + 6, cy - 9 - buzz * 3, -3], [10, 2.2, 0.6], DWING, buzz ? -0.7 : -0.3);
    // 긴 배 (끝이 아래로 말려 독침)
    let p = [cx - 2, cy, 0];
    for (let i = 0; i < 7; i++) {
      const a = PI + curl * (i / 7) * -1.3;
      const q = add(p, [Math.cos(a) * 3.4, -Math.sin(a) * 3.4 + curl * i * 0.6, 0]);
      M.sphere(q, 2.4 - i * 0.18, i % 2 ? DFLY : mat(0x1e7a5e, { spec: 0.8, shin: 50 }));
      p = q;
    }
    M.cap(p, add(p, [-2, 3 + curl * 2, 0]), 1, 0.2, GFIRE);
    // 가슴 + 머리 + 겹눈
    M.ell([cx + 3, cy, 0], [4.5, 3.4, 3.4], DFLY);
    M.sphere([cx + 9, cy - 1, 1], 3.4, DFLY);
    M.sphere([cx + 10, cy - 2, 3.5], 2.6, CEYE).sphere([cx + 11.5, cy - 2.2, -0.5], 2.2, CEYE);
    // 다리
    for (let i = 0; i < 3; i++) M.cap([cx + 1 + i * 2.5, cy + 2, 1], [cx - 1 + i * 3, cy + 7, 2], 0.6, 0.4, DFLY);
    // 앞날개
    M.ell([cx - 3, cy - 8 - buzz * 3, -1], [11, 2.2, 0.6], DWING, buzz ? -0.4 : -0.1);
    M.ell([cx + 7, cy - 8 - buzz * 3, -1], [10, 2, 0.6], DWING, buzz ? -0.6 : -0.2);
  },
};

// ════ 늪 마녀 ════
export const swampHag = {
  fw: 64, fh: 66, w: 14, h: 30,
  anims: { idle: [6, 6], move: [8, 8], cast: [4, 10, !1], raise: [4, 8, !1], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 64, cx = 30;
    let bob = 0, ph = 0, lean = 0.35, sA = [1.4, 0.3], fA = [1.6, 0.4], fl = 1;
    if (nm === "idle") bob = Math.sin((k / n) * TAU) * 0.6;
    if (nm === "move") ((ph = (k / n) * TAU), (bob = Math.abs(Math.cos(ph)) * 1.3));
    if (nm === "cast") ((sA = [[1.0, 0], [-0.5, -0.4], [0.2, 0], [0.5, 0.2]][k]), (lean = [0.3, 0.1, 0.45, 0.4][k]), (fl = [1, 1.5, 0.6, 1][k]));
    if (nm === "raise") ((sA = [-1.6, -0.2]), (fA = [-1.8, -0.3]), (lean = [0.2, 0.05, 0, 0.05][k]), (fl = 1.2 + k * 0.2));
    if (nm === "hurt") lean = 0;
    const hip = [cx, G - 18 + bob * 0.3, 0];
    const lg = gait(ph, 0.3, 0.5);
    leg(M, add(hip, [0, 0, -3]), lg[1][0], 8, lg[1][1], 9, 1.8, 1.5, HAG, mat(0x3a2a20), 3);
    leg(M, add(hip, [0, 0, 3]), lg[0][0], 8, lg[0][1], 9, 1.9, 1.6, HAG, mat(0x3a2a20), 3);
    // 너덜너덜한 치마 + 굽은 등
    M.ell(add(hip, [-1, 5, 0]), [10, 6, 7.5], ROBEH, 0.1);
    for (let i = 0; i < 5; i++) M.cap(add(hip, [-8 + i * 4, 8, 2]), add(hip, [-9 + i * 4 + Math.sin(k + i), 14, 3]), 1.6, 0.5, ROBEH);
    const chest = add(hip, rot2([0, -11], lean));
    M.ell(chest, [7, 8, 6], ROBEH, lean);
    M.ell(add(chest, rot2([-2, -4, 0], lean)), [8, 6, 7], SHAWL, lean);
    // 해골 지팡이 (뒷손) — 초록 불꽃
    const shB = add(chest, rot2([1, -4, -5], lean));
    const [, hb] = arm(M, shB, sA[0], 7, sA[1], 7, 1.6, 1.3, HAG);
    M.cap(add(hb, [0, 14, -1]), add(hb, [0, -14, -1]), 1.1, 1, STAFF);
    M.sphere(add(hb, [0, -16, -1]), 3, BONE);
    M.sphere(add(hb, [1.4, -16, 1.4]), 0.8, MAW).sphere(add(hb, [-0.6, -16, 1.6]), 0.8, MAW);
    M.sphere(add(hb, [0, -21 - fl, 0]), 2.2 * fl, GFIRE).sphere(add(hb, [0, -24 - fl * 2, 0]), 1.2 * fl, GFIRED);
    // 머리: 매부리코 · 사마귀 · 헝클어진 흰머리 · 빛나는 눈
    const h = add(chest, rot2([4, -9, 1], lean));
    M.ell(h, [5, 5.5, 5], HAG, lean);
    M.cap(add(h, [3, 0, 3]), add(h, [8, 3, 4]), 1.6, 0.6, HAG);
    M.sphere(add(h, [6, 1.4, 4.6]), 0.6, ROTD);
    M.sphere(add(h, [2.4, -1.4, 4.4]), 0.9, EYEG).sphere(add(h, [4.6, -1.4, 2.8]), 0.7, EYEG);
    M.ell(add(h, [3, 3.4, 3.6]), [2, 0.5, 1], MAW);
    for (let i = 0; i < 6; i++) M.cap(add(h, [-1, -4, -1 + i * 0.4]), add(h, [-8 - i * 1.2, -2 + i * 2.2, -3 + i * 0.6]), 1.6, 0.5, HAIR);
    // 앞손 (손가락이 긴 마녀 손)
    const [, hf] = arm(M, add(chest, rot2([2, -4, 5], lean)), fA[0], 7, fA[1], 7, 1.6, 1.3, HAG);
    for (let i = 0; i < 3; i++) M.cap(hf, add(hf, [Math.cos(fA[0] + fA[1] + (i - 1) * 0.4) * 4, Math.sin(fA[0] + fA[1] + (i - 1) * 0.4) * 4, 1]), 0.5, 0.3, HAG);
    // 매달린 부적
    M.sphere(add(chest, rot2([3, 3, 6], lean)), 1.2, BONE);
  },
};

// ════ 버섯 군락 ════
export const fungalColony = {
  fw: 68, fh: 54, w: 26, h: 20,
  anims: { idle: [6, 5], pulse: [4, 8, !1], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 52, cx = 32;
    let sq = Math.sin((k / Math.max(1, n)) * TAU) * 0.05, glow = 1;
    if (nm === "pulse") ((sq = [0.12, 0.2, -0.1, 0][k]), (glow = [1.2, 1.5, 2, 1][k]));
    if (nm === "hurt") sq = 0.15;
    M.ell([cx, G - 1, 0], [22, 3, 12], mat(0x3a4a2a, { tex: rough(1, 1) }));
    const sh = [[-14, 9, 0.8, 0xc85ac0, -3], [-4, 17, 1.1, 0x4ac8c0, 1], [8, 13, 1, 0xc85ac0, -2], [17, 8, 0.7, 0x4ac8c0, 3], [2, 6, 0.6, 0xe08ad8, 6], [-10, 5, 0.55, 0x6ae0d8, 6]];
    sh.forEach(([dx, h, s, col, z], i) => {
      const base = [cx + dx, G - 2, z];
      const hh = h * (1 - sq * (i % 2 ? 1 : 0.6));
      M.cap(base, add(base, [Math.sin(i) * 1.5, -hh, 0]), 2.4 * s, 1.8 * s, STEM);
      const top = add(base, [Math.sin(i) * 1.5, -hh, 0]);
      M.ell(top, [8 * s * (1 + sq * 0.5), 4 * s, 7 * s], SHROOM(col));
      // 빛나는 점
      for (let q = 0; q < 3; q++) M.sphere(add(top, [Math.cos(q * 2.1 + i) * 4 * s, -1.5 * s, Math.sin(q * 2.1 + i) * 3 * s + 2 * s]), 0.9 * s * glow, i % 2 ? GLOWC : GLOWM);
    });
    nm === "pulse" && k > 0 && [0, 1, 2, 3, 4, 5].forEach((i) => M.sphere([cx - 16 + i * 6.5, G - 20 - (i % 2) * 6 - k * 3, 8], 1.4, i % 2 ? GLOWC : GLOWM));
  },
};

// ════ [정예] 이끼 트롤 ════
export const mossTroll = {
  fw: 96, fh: 92, w: 28, h: 52,
  anims: { idle: [6, 5], move: [8, 7], wind: [3, 8, !1], atk: [3, 16, !1], atk2: [3, 16, !1], scoop: [3, 8, !1], throw: [3, 14, !1], rec: [2, 7, !1], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 90, cx = 44;
    let bob = 0, ph = 0, lean = 0.35, cA = [1.6, 0.4], fA = [1.9, 0.3], mud = 0, jaw = 0.2;
    if (nm === "idle") ((bob = Math.sin((k / n) * TAU) * 1.2), (fA = [1.9 + Math.sin((k / n) * TAU) * 0.1, 0.3]));
    if (nm === "move") ((ph = (k / n) * TAU), (bob = Math.abs(Math.cos(ph)) * 2.5), (cA = [1.4 + Math.sin(ph) * 0.3, 0.4]), (fA = [1.8 - Math.sin(ph) * 0.3, 0.3]));
    if (nm === "wind") ((cA = [lerp(1.6, -2.4, ease((k + 1) / n)), -0.5]), (lean = 0.15), (jaw = 0.8));
    if (nm === "atk") ((cA = [[-0.8, -0.2], [0.6, 0.4], [0.9, 0.5]][k]), (lean = [0.4, 0.6, 0.62][k]));
    if (nm === "atk2") ((cA = [[0.9, 0.5], [-0.2, -0.6], [-0.9, -0.7]][k]), (lean = [0.6, 0.45, 0.4][k]));
    if (nm === "scoop") ((fA = [[1.6, 0.2], [1.2, 0.8], [0.6, 1.4]][k]), (lean = 0.6 + k * 0.05), (mud = k === 2 ? 1 : 0));
    if (nm === "throw") ((fA = [[-2.2, -0.4], [-0.8, 0], [0.2, 0.2]][k]), (mud = k === 0 ? 1 : 0), (lean = 0.25 + k * 0.1));
    if (nm === "rec") ((cA = [1.1, 0.5]), (lean = 0.5 - k * 0.1));
    if (nm === "hurt") ((lean = 0.1), (jaw = 1));
    const hip = [cx, G - 28 + bob * 0.4, 0];
    const lg = gait(ph, 0.3, 0.5);
    leg(M, add(hip, [-2, 0, -7]), lg[1][0], 13, lg[1][1], 13, 6, 5, TROLLD, TROLLD, 6);
    leg(M, add(hip, [2, 0, 7]), lg[0][0], 13, lg[0][1], 13, 6.4, 5.4, TROLL, TROLLD, 6);
    const chest = add(hip, rot2([0, -20], lean));
    M.ell(add(hip, rot2([0, -5], lean)), [12, 10, 10], TROLL, lean);
    M.ell(add(hip, rot2([0, -1], lean)), [12.6, 3, 10.6], mat(0x5a4030, { tex: cloth(0.6) }), lean);
    M.ell(chest, [16, 14, 12], TROLL, lean);
    // 등의 이끼 갈기
    for (let i = 0; i < 6; i++) M.ell(add(chest, rot2([-8 + i * 2, -12 + i * 1.5, -2 + (i % 2) * 3], lean)), [7, 4, 7], MOSS, lean - 0.6 + i * 0.15);
    // 뒷팔 (진흙 퍼 올리기)
    const shF = add(chest, rot2([0, -8, -12], lean));
    const [, hf] = arm(M, shF, fA[0], 15, fA[1], 14, 5, 4.4, TROLLD);
    M.ell(hf, [5, 4.5, 5], TROLLD);
    mud && M.ell(add(hf, [1, -3, 0]), [6.5, 5, 6], MUD);
    // 머리: 큰 코 · 엄니 · 작은 눈
    const h = add(chest, rot2([10, -10, 2], lean * 0.5));
    M.ell(h, [8, 7, 7.5], TROLL, lean * 0.3);
    M.ell(add(h, [7, 1, 3]), [4, 3.5, 3.5], TROLL);
    M.ell(add(h, [4, 5 + jaw, 3]), [6, 2 + jaw * 2, 5], TROLLD);
    M.cap(add(h, [6, 4, 5]), add(h, [8, -1, 6]), 1.4, 0.4, TUSK).cap(add(h, [5, 4, -2]), add(h, [7, -1, -2.5]), 1.2, 0.4, TUSK);
    M.sphere(add(h, [3, -2.5, 6]), 1.1, EYEY).sphere(add(h, [6, -2.5, 3.5]), 0.9, EYEY);
    for (let i = 0; i < 4; i++) M.cap(add(h, [-4 + i * 2, -6, -1]), add(h, [-9 + i * 2, -12 + (i % 2) * 3, -3]), 2.2, 0.6, MOSS);
    // 통나무 몽둥이를 든 앞팔
    const sh = add(chest, rot2([2, -8, 12], lean));
    M.ell(sh, [7, 6, 6], TROLL, lean);
    const [, hd] = arm(M, sh, cA[0], 15, cA[1], 14, 5.4, 4.6, TROLL);
    const ga = cA[0] + cA[1], top = add(hd, [Math.cos(ga) * 26, Math.sin(ga) * 26, 2]);
    M.cap(add(hd, [-Math.cos(ga) * 3, -Math.sin(ga) * 3, 2]), top, 3, 5.5, LOG);
    M.cap(add(top, [Math.cos(ga + 1.4) * 2, Math.sin(ga + 1.4) * 2, 3]), add(top, [Math.cos(ga + 1.4) * 7, Math.sin(ga + 1.4) * 7, 3]), 1.4, 0.4, LOG);
    M.sphere(add(top, [0, 0, 3]), 2, MOSS);
  },
};

// ════ [정예] 역병 의사 ════
export const plagueDoctor = {
  fw: 76, fh: 78, w: 16, h: 38,
  anims: { idle: [6, 6], move: [8, 9], throw: [4, 12, !1], tele: [3, 10, !1], inject: [3, 10, !1], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 76, cx = 34;
    let bob = 0, ph = 0, lean = 0.1, aA = [1.3, 0.4], flare = 0, sink = 0;
    if (nm === "idle") bob = Math.sin((k / n) * TAU) * 0.6;
    if (nm === "move") ((ph = (k / n) * TAU), (bob = Math.abs(Math.cos(ph)) * 1.4), (flare = 1), (lean = 0.2));
    if (nm === "throw") ((aA = [[1.2, 0], [-1.4, -0.6], [-0.3, 0], [0.4, 0.2]][k]), (lean = [0.1, -0.1, 0.3, 0.25][k]));
    if (nm === "tele") ((sink = (k + 1) * 8), (flare = 2));
    if (nm === "inject") ((aA = [[-0.3, 0], [0.1, 0], [0.2, 0]][k]), (lean = 0.3));
    if (nm === "hurt") lean = -0.2;
    const hip = [cx, G - 24 + bob * 0.3 + sink, 0];
    const lg = gait(ph, 0.35, 0.6);
    leg(M, add(hip, [0, 0, -3]), lg[1][0], 11, lg[1][1], 11, 1.8, 1.6, COATD, GLOVE, 3.5);
    leg(M, add(hip, [0, 0, 3]), lg[0][0], 11, lg[0][1], 11, 1.9, 1.7, COATD, GLOVE, 3.5);
    // 긴 코트 자락 (펄럭임)
    for (let i = 0; i < 3; i++) M.ell(add(hip, [-3 - i * 2 - flare * i * 1.5, 6 + i * 4, -2 + i]), [8 - i, 5, 6 - i], i % 2 ? COATD : COAT, 0.3 + flare * 0.15);
    const chest = add(hip, rot2([0, -13], lean));
    M.ell(chest, [7, 10, 6], COAT, lean);
    // 플라스크 띠
    for (let i = 0; i < 4; i++) (M.ell(add(chest, rot2([-4 + i * 2.8, 8, 5.5], lean)), [1.2, 2, 1.2], FLASK, lean), M.sphere(add(chest, rot2([-4 + i * 2.8, 9, 6.4], lean)), 0.8, BREW));
    // 뒷팔
    arm(M, add(chest, rot2([0, -6, -5], lean)), 1.7, 8, 0.3, 8, 1.8, 1.5, COATD);
    // 머리: 넓은 챙 모자 + 흰 부리 가면 + 붉은 렌즈
    const h = add(chest, rot2([2, -14, 0], lean));
    M.ell(h, [5, 5.5, 5], COATD, lean);
    M.cap(add(h, [3, 1, 2]), add(h, [16, 6, 3]), 3, 0.6, BEAK);
    M.sphere(add(h, [3, -1.5, 4.8]), 1.6, EYER).sphere(add(h, [5.4, -1.5, 2.6]), 1.3, EYER);
    M.ell(add(h, [0, -5, 0]), [11, 1.4, 10], COATD, lean);
    M.cap(add(h, [0, -5, 0]), add(h, [-1, -12, 0]), 5.5, 5, COAT);
    // 앞팔: 플라스크/주사기
    const sh = add(chest, rot2([1, -6, 5], lean));
    const [, hd] = arm(M, sh, aA[0], 8, aA[1], 8, 1.9, 1.6, COAT);
    M.ell(hd, [1.8, 1.6, 1.6], GLOVE);
    if (nm === "inject") M.cap(hd, add(hd, [12, 0, 1]), 1.2, 0.3, FLASK), M.sphere(add(hd, [3, 0, 1]), 1, BREW);
    else (M.ell(add(hd, [1, -3, 1]), [2.2, 3, 2.2], FLASK), M.sphere(add(hd, [1, -2.5, 2.4]), 1.4, BREW));
  },
};

// ════ [보스] 부패의 왕 글로브락 ════
export const globrak = {
  boss: !0, fw: 164, fh: 132, w: 64, h: 62,
  anims: { idle: [4, 5], move: [4, 8], stagger: [1, 1], tongue: [3, 14], jump: [1, 1], land: [1, 1], burp: [2, 8], summon: [1, 1], roar: [1, 1], swell: [2, 8] },
  model(M, nm, k, n) {
    const G = 130, cx = 76;
    let bob = 0, squash = 0, jaw = 0.15, tongue = 0, swell = 0, air = 0, throat = 0, eyesUp = 0;
    if (nm === "idle") ((bob = Math.sin((k / n) * TAU) * 1.5), (throat = Math.max(0, Math.sin((k / n) * TAU)) * 3));
    if (nm === "move") ((squash = Math.sin((k / n) * TAU) * 0.1), (bob = Math.abs(Math.sin((k / n) * TAU)) * 6));
    if (nm === "stagger") ((squash = 0.2), (jaw = 0.8));
    if (nm === "tongue") ((jaw = 1), (tongue = [0.4, 1, 0.7][k]));
    if (nm === "jump") ((air = 1), (squash = -0.15), (eyesUp = 1));
    if (nm === "land") ((squash = 0.28), (jaw = 0.6));
    if (nm === "burp") ((jaw = 1.3), (throat = 8 - k * 4), (eyesUp = 0.5));
    if (nm === "summon") ((jaw = 0.8), (swell = 0.1), (eyesUp = 1));
    if (nm === "roar") ((jaw = 1.4), (eyesUp = 1));
    if (nm === "swell") ((swell = 0.15 + k * 0.12), (jaw = 0.3));
    const sx = 1 + squash * 0.6 + swell, sy = 1 - squash + swell;
    const b = [cx, G - 30 * sy - bob - air * 6, 0];
    // 뒷다리 (접힌 두꺼비 다리)
    for (const [z, m] of [[-14, mat(0x4e5e2a, { tex: rough(0.5, 1) })], [14, KING]]) {
      M.ell(add(b, [-18 * sx, 14, z]), [14, 10, 9], m, 0.4);
      M.ell([b[0] - 6 * sx, G - 3 + air * -10, z], [12, 3.5, 7], m);
    }
    // 이끼 망토 (뒤)
    for (let i = 0; i < 5; i++) M.ell(add(b, [-20 - i * 3, -8 + i * 6, -12]), [12 - i, 6, 4], MOSS, 0.4 + i * 0.1);
    // 거대한 몸
    M.ell(b, [36 * sx, 26 * sy, 26 * sx], KING);
    M.ell(add(b, [10, 10 + throat * 0.3, 14]), [22 * sx, 14 * sy + throat * 0.5, 13], KINGB);
    // 사마귀 (빛나는 고름)
    for (const [dx, dy, dz, r] of [[-14, -14, 18, 3], [-26, -4, 14, 2.6], [4, -20, 16, 2.4], [-6, -8, 24, 2], [-20, 8, 20, 2.2]]) (M.sphere(add(b, [dx * sx, dy * sy, dz]), r, mat(0x4e5e2a)), M.sphere(add(b, [dx * sx, dy * sy - r * 0.3, dz + r * 0.6]), r * 0.55, PUS));
    // 앞다리
    M.cap(add(b, [18 * sx, 14, 16]), [cx + 22 * sx, G - 2 + air * -14, 18], 6, 5, KING);
    M.ell([cx + 25 * sx, G - 2 + air * -14, 18], [8, 3, 6], KING);
    // 입 (넓게) + 혀
    const mouthY = b[1] + 4 * sy;
    M.ell([cx + 22 * sx, mouthY + jaw * 3, 14], [16 * sx, 1.5 + jaw * 6, 12], MAW);
    tongue && (M.cap([cx + 30 * sx, mouthY + 4, 16], [cx + 30 * sx + tongue * 70, mouthY + 6, 16], 4, 5.5, TONGUE), M.sphere([cx + 30 * sx + tongue * 70, mouthY + 6, 16], 6.5, TONGUE));
    // 툭 튀어나온 눈
    for (const [dx, dz, near] of [[6, 18, 1], [20, 4, 0]]) {
      const e = [cx + dx * sx, b[1] - 22 * sy - eyesUp * 3, dz];
      M.sphere(e, 8, KING);
      M.sphere(add(e, [2, -1, 5]), 5, EYEY);
      M.ell(add(e, [3, -1, 9.5]), [1.4, 3.4, 1], PUPIL);
      void near;
    }
    // 삐뚤어진 썩은 왕관
    const cr = [cx - 4 * sx, b[1] - 27 * sy, 4];
    M.ell(cr, [12, 3, 10], CROWN, -0.15);
    for (let i = 0; i < 5; i++) M.cap(add(cr, [-9 + i * 4.5, -1, 4]), add(cr, [-9 + i * 4.5 - 1, -8 - (i % 2) * 3, 4]), 1.6, 0.4, CROWN);
    M.sphere(add(cr, [0, -2, 10]), 2, GEM);
    // 독가스
    nm === "burp" && [0, 1, 2, 3].forEach((i) => M.sphere([cx + 44 + i * 9, mouthY - 4 - i * 2, 18], 5 - i * 0.6, mat(0x9ad060, { emit: 0xa8e070 })));
  },
};
