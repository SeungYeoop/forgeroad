// 3지역 「울림 광산」 3D 모델 — 화로의 파편을 캐기 위해 파 들어간 광산. 광부들은 너무 깊이 팠다.
// 색: 바위 회갈색 · 촛불 주황 · 광석 청록/금빛
import { mat, rough, cloth, plates, EYE, gait, leg, arm, PI, TAU, chain, add, rot2, ease, lerp, noise3, hash } from "./rig.js";

// ── 재질 ──
const BONE = mat(0xd8ccb0, { tex: rough(0.6, 0.6), spec: 0.25, shin: 30, rim: 0.5, rimCol: 0xffd8a0 });
const BONED = mat(0xa89a80, { tex: rough(0.6, 0.6) });
const SOCK = mat(0x140c0a);
const CANDLE = EYE(0xffb040), FLAME = EYE(0xfff0a0), EMBR = EYE(0xff7020);
const HAT = mat(0xc8a030, { spec: 0.5, shin: 36, rim: 0.4, tex: (u, v, w, s) => (noise3(u * 0.5 + s, v * 0.5, w) - 0.5) * 0.8 });
const RAGB = mat(0x5a4a3a, { tex: cloth(0.6) });
const RAGR = mat(0x7a3a2a, { tex: cloth(0.6) });
const WOOD = mat(0x7a5634, { tex: (u, v) => Math.sin(u * 2 + v * 0.3) * 0.5 });
const IRON = mat(0x6a6a74, { spec: 0.45, shin: 44, rim: 0.4 });
const IRONR = mat(0x7a5a48, { spec: 0.3, shin: 30, tex: (u, v, w, s) => (noise3(u * 0.6 + s, v * 0.6, w * 0.6) > 0.62 ? -1 : 0.2) });
const ORE = EYE(0x5af0d8), ORED = mat(0x2a8a80, { spec: 0.8, shin: 50, rim: 0.9, rimCol: 0xa0fff0 }), GOLD = EYE(0xffd060);
const GOLDM = mat(0xd8a830, { spec: 0.8, shin: 44 });
const ROCK = mat(0x7a6e62, { tex: (u, v, w, s) => (noise3(u * 0.4 + s, v * 0.4, w * 0.4) - 0.5) * 1.4, rim: 0.45, rimCol: 0xffd8a0 });
const ROCKD = mat(0x564c44, { tex: rough(0.5, 1.2) });
const WORM = mat(0x8a6a5a, { tex: (u) => (Math.floor(u * 0.9) % 2 ? 0.4 : -0.3), rim: 0.5, rimCol: 0xffc8a0 });
const WORMB = mat(0xb08a74, { tex: rough(0.5, 0.6) });
const MAWR = mat(0x6a1a20), TOOTH = mat(0xf0e6d0, { spec: 0.4 });
const BAT = mat(0x4a4058, { tex: rough(0.7, 0.8), rim: 0.6, rimCol: 0xd0a0ff });
const BATW = mat(0x3a3048, { tex: (u, v) => (Math.abs(Math.sin(u * 1.2)) < 0.15 ? -1 : 0.2), rim: 0.6, rimCol: 0xc0a0ff });
const GOB = mat(0x6a9a3a, { tex: rough(0.6, 0.7), rim: 0.5, rimCol: 0xe0ffa0 });
const GOBD = mat(0x4a7028, { tex: rough(0.6, 0.7) });
const GOGG = mat(0x8a6a3a, { spec: 0.4 }), LENS = mat(0xa0e0ff, { spec: 1, shin: 60, rim: 0.9, rimCol: 0xffffff });
const DYN = mat(0xc83a2a, { spec: 0.3 }), FUSE = EYE(0xffe080);
const LEATH = mat(0x6a4a2a, { tex: rough(0.6, 0.5) });
const SPID = mat(0x3a3a4a, { spec: 0.4, shin: 40, rim: 0.6, rimCol: 0x9af0ff });
const SPIDL = mat(0x2a2a36, { spec: 0.3 });
const CRYS = mat(0x6ae0f0, { spec: 1, shin: 60, rim: 0.9, rimCol: 0xffffff, hi: 0xe8ffff, emit: null });
const THREAD = EYE(0xd8e8f0);
const EYER = EYE(0xff4040), EYEC = EYE(0x9af8ff), EYEY = EYE(0xffe060);
const SPIRIT = mat(0x8a7a6a, { tex: (u, v, w, s) => (noise3(u * 0.3 + s, v * 0.3, w * 0.3) - 0.5) * 1.6, rim: 0.7, rimCol: 0x9af8e8 });
const KNIGHT = mat(0x6e6a78, { spec: 0.4, shin: 44, tex: plates(0.25), rim: 0.5, rimCol: 0xffd090 });
const KNIGHTD = mat(0x4e4a58, { spec: 0.3, shin: 40 });
const CART = mat(0x6a4a30, { tex: (u, v) => (Math.floor(v * 0.5) % 2 ? 0.3 : -0.2) });
const WHEEL = mat(0x3a3a42, { spec: 0.5, shin: 40 });
const CORE = EYE(0xffa830), CORED = EYE(0xff6a18);
const MOSSY = mat(0x5a7a3a, { tex: rough(1, 1) });
const CHITIN = mat(0x5a4a50, { spec: 0.5, shin: 40, tex: plates(0.2), rim: 0.6, rimCol: 0xa0fff0 });
const CHITIND = mat(0x3e343a, { spec: 0.4 });
const MAND = mat(0xd8c8a8, { spec: 0.5, shin: 40 });
const FLESH = mat(0xa86a6a, { tex: rough(0.5, 0.6) });

function lamp(M, p, k) {
  M.sphere(p, 1.6, CANDLE);
  M.sphere(add(p, [0, -2 - (k % 2) * 0.5, 0.5]), 1.2, FLAME);
}
// 곡괭이: 손에서 각도 ang
function pick(M, hd, ang, len = 15) {
  const c = Math.cos(ang), s = Math.sin(ang);
  const top = add(hd, [c * len, s * len, 0]);
  M.cap(add(hd, [-c * 3, -s * 3, 0]), top, 1.1, 1.1, WOOD);
  // 머리: 손잡이에 수직, 양쪽 뾰족
  M.cap(top, add(top, [-s * 8 + c * 2, c * 8 + s * 2, 0]), 1.8, 0.4, IRON);
  M.cap(top, add(top, [s * 6 + c * 1, -c * 6 + s * 1, 0]), 1.8, 0.6, IRON);
  return top;
}

// ════ 해골 광부 ════
export const skelMiner = {
  fw: 64, fh: 66, w: 14, h: 30,
  anims: { idle: [6, 6], move: [8, 10], wind: [4, 9, !1], atk: [3, 16, !1], rec: [3, 8, !1], ceil: [4, 10, !1], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 64, cx = 28;
    let bob = 0, lean = 0.12, legs = gait(0, 0.08, 0), pA = [1.1, 0.5], headT = 0;
    if (nm === "idle") ((bob = Math.sin((k / n) * TAU) * 0.6), (pA = [1.1 + Math.sin((k / n) * TAU) * 0.08, 0.5]));
    if (nm === "move") ((legs = gait((k / n) * TAU, 0.42, 0.7)), (bob = Math.abs(Math.cos((k / n) * TAU)) * 1.4), (pA = [0.9 + Math.sin((k / n) * TAU) * 0.2, 0.6]));
    if (nm === "wind") {
      const t = ease((k + 1) / n);
      ((pA = [lerp(1.1, -2.6, t), lerp(0.5, -0.6, t)]), (lean = lerp(0.12, -0.15, t)), (headT = -0.2 * t), (legs = [[PI / 2 - 0.35 * t, 0.2], [PI / 2 + 0.3 * t, -0.2]]));
    }
    if (nm === "atk") ((pA = [[-0.9, -0.3], [0.5, 0.4], [0.9, 0.5]][k]), (lean = [0.2, 0.42, 0.45][k]), (legs = [[PI / 2 - 0.55, 0.4], [PI / 2 + 0.4, -0.2]]));
    if (nm === "rec") ((pA = [1.0, 0.5]), (lean = 0.35 - k * 0.08));
    if (nm === "ceil") ((pA = [[-1.2, -0.2], [-1.6, -0.5], [-1.75, -0.4], [-1.5, -0.3]][k]), (lean = -0.1), (headT = -0.4));
    if (nm === "hurt") ((lean = -0.25), (headT = -0.4), (bob = 1));
    const hip = [cx, G - 21 + bob * 0.3, 0];
    leg(M, add(hip, [0, 0, -3]), legs[1][0], 10, legs[1][1], 10, 1.7, 1.5, BONED, LEATH, 3);
    leg(M, add(hip, [0, 0, 3]), legs[0][0], 10, legs[0][1], 10, 1.8, 1.6, BONE, LEATH, 3);
    // 너덜너덜한 바지·조끼
    M.ell(add(hip, [0, 2, 0]), [5, 4, 4], RAGB);
    const chest = add(hip, rot2([0, -11], lean));
    M.cap(hip, chest, 1.4, 1.4, BONE);
    for (let i = 0; i < 4; i++) M.ell(add(chest, rot2([0.5, -2 + i * 2.4, 0], lean)), [5 - i * 0.5, 1.1, 4.5 - i * 0.4], BONE, lean);
    M.ell(add(chest, rot2([-3, 1, -3], lean)), [4, 7, 3], RAGR, lean);
    // 뒷팔
    const shB = add(chest, rot2([1, -4, -4], lean));
    arm(M, shB, pA[0] + 0.3, 8, pA[1], 7, 1.5, 1.3, BONED);
    // 두개골 + 안전모 + 촛불
    const head = add(chest, rot2([2, -9, 0], lean + headT));
    M.ell(head, [5.3, 5.3, 5], BONE);
    M.ell(add(head, [2.6, 3.4, 0.5]), [3, 1.8, 3.2], BONE, 0.2);
    M.ell(add(head, [2.6, -0.5, 3]), [1.7, 1.9, 1.2], SOCK).ell(add(head, [4.6, -0.5, 0.5]), [1.3, 1.7, 1], SOCK);
    M.sphere(add(head, [2.8, -0.4, 3.8]), 0.7, EYEY);
    for (let i = 0; i < 4; i++) M.sphere(add(head, [1 + i * 1.2, 4.6, 2.6]), 0.55, i % 2 ? SOCK : BONE);
    M.ell(add(head, [0, -3, 0]), [6.5, 3.2, 6], HAT, headT);
    M.ell(add(head, [1, -1.4, 0]), [8, 0.9, 7], HAT, headT);
    lamp(M, add(head, rot2([4, -4, 2], headT)), k);
    // 곡괭이를 든 앞팔
    const shN = add(chest, rot2([1.5, -4, 4], lean));
    const [, hd] = arm(M, shN, pA[0], 8, pA[1], 7, 1.6, 1.4, BONE);
    pick(M, add(hd, [0, 0, 1]), pA[0] + pA[1]);
  },
};

// ════ 광석 벌레 ════ (등에 광석이 자란 땅속 벌레)
export const oreWorm = {
  fw: 64, fh: 64, w: 16, h: 26,
  anims: { hide: [2, 4], emerge: [4, 14, !1], idle: [6, 8], atk: [3, 16, !1], sink: [3, 12, !1], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 62, cx = 28;
    if (nm === "hide") {
      // 땅 위로 흙더미만
      for (let i = 0; i < 4; i++) M.ell([cx - 8 + i * 5 + (k ? 1 : 0), G - 1, 0], [3.5, 2 + (i % 2), 3], ROCKD);
      M.sphere([cx + 4, G - 3, 2], 1.2, ORE);
      return;
    }
    let rise = 1, bend = Math.sin((k / Math.max(1, n)) * TAU) * 0.2, jaw = 0.4;
    if (nm === "emerge") ((rise = ease((k + 1) / n)), (jaw = 1));
    if (nm === "sink") rise = 1 - ease((k + 1) / n);
    if (nm === "atk") ((bend = [0.4, 1.0, 1.2][k]), (jaw = 1));
    if (nm === "hurt") ((bend = -0.5), (jaw = 0.8));
    // 흙더미 구멍
    M.ell([cx, G - 1, 0], [11, 2.5, 7], ROCKD);
    const segs = 6, L = 5.5 * rise;
    let p = [cx, G - 1, 0], a = -PI / 2;
    const pts = [p];
    for (let i = 0; i < segs; i++) {
      a += bend * (i / segs) * 0.6;
      p = add(p, [Math.cos(a) * L, Math.sin(a) * L, 0]);
      pts.push(p);
    }
    for (let i = 0; i < segs; i++) {
      const r = 6.5 - i * 0.2;
      M.sphere(pts[i + 1], r, i % 2 ? WORM : WORMB);
      // 등의 광석 (빛나는 결정)
      i % 2 === 0 && i > 0 && (M.cap(pts[i + 1], add(pts[i + 1], [Math.cos(a - 1.6) * 7 - 1, Math.sin(a - 1.6) * 7, -2]), 2.2, 0.6, ORED), M.sphere(add(pts[i + 1], [Math.cos(a - 1.6) * 6.5 - 1, Math.sin(a - 1.6) * 6.5, -1]), 1, ORE));
    }
    if (rise < 0.35) return;
    // 머리: 동그란 이빨 고리 입 (보는 쪽으로)
    const h = pts[segs], ha = a + PI / 2;
    M.sphere(h, 7.5, WORM);
    M.ell(add(h, rot2([3, -1, 4], ha)), [4.5, 4.5 * jaw + 1, 3], MAWR, ha);
    for (let i = 0; i < 8; i++) {
      const ta = (i / 8) * TAU;
      M.cap(add(h, rot2([3 + Math.cos(ta) * 4.5, -1 + Math.sin(ta) * (4.5 * jaw + 1), 5.5], ha)), add(h, rot2([3 + Math.cos(ta) * 2.4, -1 + Math.sin(ta) * 2.4 * jaw, 6.5], ha)), 0.9, 0.2, TOOTH);
    }
    M.sphere(add(h, rot2([-3, -5, 4], ha)), 1.1, EYEC).sphere(add(h, rot2([1, -6, 5], ha)), 0.9, EYEC);
  },
};

// ════ 동굴 박쥐 떼 ════ (한 무리 = 박쥐 다섯)
export const batSwarm = {
  fw: 72, fh: 52, w: 34, h: 24, flying: !0,
  anims: { idle: [6, 14], dive: [3, 14], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const cx = 36, cy = 26;
    const bats = [[0, 0, 1.35], [-16, -9, 1.1], [15, -8, 1.15], [-11, 10, 1.05], [13, 11, 1.1]];
    bats.forEach(([dx, dy, s], i) => {
      const ph = (k / Math.max(1, n)) * TAU + i * 1.3;
      const flap = nm === "dive" ? -0.3 : Math.sin(ph);
      const swirl = nm === "dive" ? 0 : Math.sin(ph * 0.5) * 2;
      const b = [cx + dx * (nm === "dive" ? 0.6 : 1) + swirl, cy + dy * (nm === "dive" ? 0.6 : 1), (i % 2) * 4 - 2];
      // 날개 (막)
      for (const side of [-1, 1]) {
        const tip = add(b, [side * 9 * s, -flap * 7 * s - 2, side * 2]);
        const mid = add(b, [side * 5 * s, -flap * 4 * s + 2, side]);
        M.cap(b, mid, 1.2 * s, 1 * s, BATW).cap(mid, tip, 1 * s, 0.4, BATW);
        M.ell(add(b, [side * 5 * s, -flap * 3 * s + 1.5, side]), [4.5 * s, 2.6 * s, 0.6], BATW, -side * flap * 0.6);
      }
      M.ell(b, [2.8 * s, 3.4 * s, 2.6 * s], BAT);
      M.cap(add(b, [-1.4 * s, -2.6 * s, 1]), add(b, [-2 * s, -5.5 * s, 1]), 1 * s, 0.3, BAT).cap(add(b, [1.4 * s, -2.6 * s, 1]), add(b, [2 * s, -5.5 * s, 1]), 1 * s, 0.3, BAT);
      M.sphere(add(b, [-1 * s, -1 * s, 2.4 * s]), 0.7, EYER).sphere(add(b, [1 * s, -1 * s, 2.4 * s]), 0.7, EYER);
      nm === "dive" && M.sphere(add(b, [0, 1.6 * s, 2.4 * s]), 0.6, TOOTH);
    });
  },
};

// ════ 폭약 고블린 ════
export const bombGoblin = {
  fw: 56, fh: 52, w: 13, h: 22,
  anims: { idle: [6, 8], move: [6, 12], wind: [3, 9, !1], throw: [3, 16, !1], run: [6, 18], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 50, cx = 24;
    let bob = 0, lean = 0.1, legs = gait(0, 0.08, 0), aA = [0.9, 0.6], bomb = 1, grin = 0.5, earT = 0;
    if (nm === "idle") ((bob = Math.sin((k / n) * TAU) * 0.8), (earT = Math.sin((k / n) * TAU) * 0.15));
    if (nm === "move") ((legs = gait((k / n) * TAU, 0.5, 0.9)), (bob = Math.abs(Math.cos((k / n) * TAU)) * 2));
    if (nm === "wind") ((aA = [lerp(0.9, -2.6, ease((k + 1) / n)), -0.4]), (lean = -0.2), (grin = 1));
    if (nm === "throw") ((aA = [[-1.6, -0.3], [-0.2, 0.1], [0.5, 0.3]][k]), (lean = 0.3), (bomb = k === 0 ? 1 : 0));
    if (nm === "run") ((legs = gait((k / n) * TAU, 0.75, 1.2)), (bob = Math.abs(Math.cos((k / n) * TAU)) * 3), (lean = 0.4), (aA = [-1.9, -0.2]), (grin = 1.3), (earT = -0.4));
    if (nm === "hurt") ((lean = -0.3), (grin = 0));
    const hip = [cx, G - 14 + bob * 0.3, 0];
    leg(M, add(hip, [0, 0, -3]), legs[1][0], 7, legs[1][1], 7, 2, 1.7, GOBD, LEATH, 3);
    leg(M, add(hip, [0, 0, 3]), legs[0][0], 7, legs[0][1], 7, 2.1, 1.8, GOB, LEATH, 3);
    const chest = add(hip, rot2([0, -7], lean));
    M.ell(chest, [5.5, 6, 5], GOB, lean);
    M.ell(add(chest, rot2([0, 1, 1], lean)), [6, 4, 5.3], LEATH, lean);
    // 다이너마이트 띠
    for (let i = 0; i < 4; i++) M.cap(add(chest, rot2([-4 + i * 2.6, -1, 5], lean)), add(chest, rot2([-4 + i * 2.6, 4, 5], lean)), 0.9, 0.9, DYN);
    // 뒷팔
    arm(M, add(chest, rot2([0, -3, -4], lean)), 1.6, 5, 0.5, 5, 1.6, 1.3, GOBD);
    // 큰 머리 + 귀 + 고글 + 씩 웃는 입
    const h = add(chest, rot2([2, -9, 0], lean));
    M.ell(h, [6.5, 5.5, 6], GOB, lean * 0.5);
    M.cap(add(h, [-3, -2, -4]), add(h, [-11, -6 + earT * 10, -5]), 2.2, 0.4, GOBD);
    M.cap(add(h, [-2, -2, 4]), add(h, [-9, -7 + earT * 10, 6]), 2.4, 0.4, GOB);
    M.cap(add(h, [5, 0, 1]), add(h, [9, 1.5, 1.5]), 1.8, 1, GOB);
    M.ell(add(h, [0, -3.5, 0]), [6.6, 1.2, 6.2], GOGG);
    M.sphere(add(h, [2.5, -2.5, 4.6]), 2, LENS).sphere(add(h, [5.3, -2.5, 2.4]), 1.6, LENS);
    M.ell(add(h, [3, 2.6, 3.5]), [3, 0.6 + grin * 0.8, 2], SOCK, 0.2);
    for (let i = 0; i < 3; i++) M.sphere(add(h, [1.5 + i * 1.4, 2.2, 5]), 0.5, TOOTH);
    // 폭탄을 든 앞팔
    const sh = add(chest, rot2([1, -3, 4], lean));
    const [, hd] = arm(M, sh, aA[0], 5.5, aA[1], 5, 1.7, 1.4, GOB);
    if (bomb) {
      const bp = add(hd, [Math.cos(aA[0] + aA[1]) * 3, Math.sin(aA[0] + aA[1]) * 3 - 2, 1]);
      M.sphere(bp, 3.4, mat(0x2a2a30, { spec: 0.6, shin: 40 }));
      M.cap(add(bp, [1, -3, 0]), add(bp, [3, -6, 0]), 0.5, 0.4, LEATH);
      M.sphere(add(bp, [3, -6.5, 0.5]), 1 + (k % 2) * 0.5, FUSE);
    }
  },
};

// ════ 수정 거미 ════ (천장에 매달렸다 내려오는 결정 거미)
export const crystalSpider = {
  fw: 64, fh: 56, w: 18, h: 16,
  anims: { hang: [4, 6], idle: [4, 8], move: [6, 14], wind: [3, 9, !1], spit: [3, 14, !1], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 54, cx = 30;
    const hang = nm === "hang";
    let ph = 0, bob = 0, rear = 0;
    if (nm === "idle") bob = Math.sin((k / n) * TAU) * 0.5;
    if (nm === "move") ph = (k / n) * TAU;
    if (nm === "wind") rear = (k + 1) / 3;
    if (nm === "spit") rear = [1, 0.5, 0.2][k];
    const b = hang ? [cx, 18 + Math.sin((k / n) * TAU) * 1.5, 0] : [cx, G - 11 - bob - rear * 3, 0];
    hang && M.cap([cx, 0, 0], add(b, [0, -5, 0]), 0.4, 0.4, THREAD);
    // 다리 여덟 (관절 둘)
    for (let i = 0; i < 4; i++) {
      for (const z of [-1, 1]) {
        const dx = -6 + i * 4, o = (i % 2 ? PI : 0) + (z > 0 ? 0 : PI);
        const lift = Math.max(0, Math.sin(ph + o)) * 3;
        const hip = add(b, [dx * 0.5, 0, z * 3]);
        const knee = add(b, [dx * 2.4 + (i < 2 ? -4 : 4), -9 - lift, z * 7]);
        const foot = hang ? add(b, [dx * 3, 10 + i, z * 11]) : [b[0] + dx * 3.6 + (i < 2 ? -4 : 4) + Math.sin(ph + o) * 2, G - 1, z * 12];
        M.cap(hip, knee, 1.4, 1.1, z < 0 ? SPIDL : SPID).cap(knee, foot, 1.1, 0.5, z < 0 ? SPIDL : SPID);
      }
    }
    // 배 (등에 수정 결정) + 머리가슴
    const ab = add(b, [-7, -2 - rear * 3, 0]);
    M.ell(ab, [8, 7, 7], SPID, -rear * 0.4);
    for (let i = 0; i < 4; i++) {
      const a = -PI / 2 - 0.8 + i * 0.5, base = add(ab, [Math.cos(a) * 5, Math.sin(a) * 5, (i % 2) * 3 - 1]);
      const tip = add(base, [Math.cos(a) * (6 + (i % 2) * 3), Math.sin(a) * (6 + (i % 2) * 3), 0]);
      M.cap(base, tip, 2.2, 0.5, CRYS);
      M.sphere(add(base, [0, 0, 2]), 1, ORE);
    }
    M.ell(add(b, [3, 0, 0]), [5.5, 4.5, 5], SPID);
    // 눈 여러 개 + 송곳니
    const h = add(b, [7, 0, 1]);
    for (const [ex, ey, ez] of [[1, -1.5, 4], [2.5, -2, 2], [0, -0.5, 4.5], [2.8, -0.2, 3]]) M.sphere(add(h, [ex, ey, ez]), ex > 2 ? 0.7 : 1, EYEC);
    M.cap(add(h, [2, 2, 2]), add(h, [3, 5 + rear, 2.5]), 1, 0.3, CRYS).cap(add(h, [2, 2, -1]), add(h, [3, 5 + rear, -1]), 1, 0.3, CRYS);
  },
};

// ════ 광맥 정령 ════ (떠다니는 바위 정령, 가운데 보석)
export const veinSpirit = {
  fw: 56, fh: 56, w: 18, h: 22, flying: !0,
  anims: { idle: [6, 8], cast: [4, 10, !1], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const cx = 28, cy = 28;
    let spread = 1, glow = 1, spin = (k / Math.max(1, n)) * TAU;
    if (nm === "cast") ((spread = [1.2, 1.5, 1.7, 1.1][k]), (glow = 1.5));
    if (nm === "hurt") spread = 0.8;
    const c = [cx, cy + Math.sin(spin) * 1.5, 0];
    // 몸: 바위 덩어리 여럿이 가운데 보석을 감싼다
    const rocks = [[-6, -5, -3, 5], [6, -6, -2, 4.6], [-7, 4, -2, 4.4], [6, 5, -3, 4.8], [0, -9, -1, 4]];
    for (const [dx, dy, dz, r] of rocks) M.ell(add(c, [dx * spread, dy * spread, dz]), [r, r * 0.85, r * 0.9], ROCK, dx * 0.05);
    M.sphere(c, 4.6 * Math.min(1.3, glow), ORE);
    M.sphere(add(c, [-1, -1, 3]), 2, mat(0xe8fffc, { emit: 0xe8fffc }));
    for (const [dx, dy] of [[-4, 0], [4, -1], [0, 4]]) M.cap(add(c, [dx * 0.4, dy * 0.4, 1]), add(c, [dx * 2 * spread, dy * 2 * spread, 2]), 0.8, 0.4, ORE);
    // 얼굴 (보석 위)
    M.sphere(add(c, [2, -3, 5]), 0.9, EYEY).sphere(add(c, [4.5, -3, 3.6]), 0.8, EYEY);
    // 주위를 도는 작은 돌
    for (let i = 0; i < 4; i++) {
      const a = spin + (i / 4) * TAU;
      M.ell(add(c, [Math.cos(a) * 14 * spread, Math.sin(a) * 6, Math.sin(a) * 8]), [2.2, 2, 2], i % 2 ? ROCKD : ROCK);
    }
  },
};

// ════ [정예] 광차 기사 ════ (광차를 탄 기사 / 내려서 곡괭이창)
export const cartKnight = {
  fw: 88, fh: 80, w: 24, h: 40,
  anims: { ride: [4, 10], rush: [2, 14], idle: [6, 5], move: [8, 8], wind: [3, 9, !1], thrust: [3, 18, !1], kick: [3, 12, !1], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 78, cx = 40;
    const riding = nm === "ride" || nm === "rush";
    let bob = 0, lean = 0, legs = gait(0, 0.1, 0), lA = [0.1, 0.1], lance = 0;
    if (nm === "idle") bob = Math.sin((k / n) * TAU) * 0.6;
    if (nm === "move") ((legs = gait((k / n) * TAU, 0.4, 0.6)), (bob = Math.abs(Math.cos((k / n) * TAU)) * 1.5));
    if (nm === "ride") bob = Math.sin((k / n) * TAU) * 0.8;
    if (nm === "rush") ((lean = 0.3), (lance = 1), (bob = k));
    if (nm === "wind") ((lA = [lerp(0.1, -0.2, (k + 1) / 3), 0]), (lean = -0.15), (lance = -6 * ((k + 1) / 3)));
    if (nm === "thrust") ((lean = [0.2, 0.35, 0.3][k]), (lance = [4, 12, 8][k]), (legs = [[PI / 2 - 0.55, 0.4], [PI / 2 + 0.45, -0.2]]));
    if (nm === "kick") ((legs = [[[PI / 2 - 0.2, 0.6], [0.3, 0.1], [0.4, 0.2]][k], [PI / 2 + 0.2, 0]]), (lean = -0.15));
    if (nm === "hurt") ((lean = -0.25), (bob = 1));
    // 광차
    if (riding || nm === "kick") {
      const cc = riding ? [cx, G - 9, 0] : [cx + 22 + k * 3, G - 9, 0];
      M.box(cc, [15, 7, 9], CART, 0);
      M.box(add(cc, [0, -6.5, 0]), [16, 1.2, 10], IRONR, 0);
      for (const dx of [-9, 9]) for (const z of [-9, 9]) (M.ell(add(cc, [dx, 7, z]), [4, 4, 1.5], WHEEL), M.sphere(add(cc, [dx, 7, z + (z > 0 ? 1.4 : -1.4)]), 1.2, IRON));
      riding && [0, 1, 2].forEach((i) => M.ell(add(cc, [-6 + i * 6, -8, 2]), [3, 2.2, 3], i === 1 ? GOLD : ORED));
    }
    const hip = riding ? [cx - 2, G - 24 + bob * 0.3, 0] : [cx - 6, G - 25 + bob * 0.3, 0];
    if (!riding) {
      leg(M, add(hip, [-1, 0, -5]), legs[1][0], 12, legs[1][1], 12, 4.2, 3.6, KNIGHTD, KNIGHTD, 4.5);
      leg(M, add(hip, [1, 0, 5]), legs[0][0], 12, legs[0][1], 12, 4.4, 3.8, KNIGHT, KNIGHTD, 4.5);
    }
    const chest = add(hip, rot2([0, -13], lean));
    M.ell(add(hip, rot2([0, -3], lean)), [8, 4.5, 7], KNIGHTD, lean);
    M.ell(chest, [10, 10.5, 8.5], KNIGHT, lean);
    M.ell(add(chest, rot2([-1, -7, -8], lean)), [6.5, 4.5, 5], KNIGHT, lean - 0.3);
    // 투구 (광부 램프 달린)
    const head = add(chest, rot2([1, -13, 0], lean));
    M.ell(head, [6.3, 6.8, 6.3], KNIGHT, lean);
    M.ell(add(head, rot2([3, 0.5, 4], lean)), [3.4, 1.4, 3.2], SOCK, lean);
    M.sphere(add(head, rot2([4, 0.5, 6], lean)), 1.2, EYEY);
    lamp(M, add(head, rot2([2, -6, 3], lean)), k);
    // 곡괭이창 (앞으로 겨눔)
    const sh = add(chest, rot2([2, -6, 8], lean));
    M.ell(sh, [6.5, 5, 5.5], KNIGHT, lean + 0.3);
    const hd = add(sh, [8 + lance * 0.6, 6, 2]);
    M.cap(sh, hd, 3.6, 3, KNIGHT);
    const ang = lA[0];
    const tip = add(hd, [Math.cos(ang) * (26 + lance), Math.sin(ang) * (26 + lance), 0]);
    M.cap(add(hd, [-Math.cos(ang) * 10, -Math.sin(ang) * 10, 0]), tip, 1.4, 1.2, WOOD);
    M.cap(tip, add(tip, [Math.cos(ang) * 9, Math.sin(ang) * 9, 0]), 2.4, 0.3, IRON);
    M.cap(add(tip, [0, 0, 0]), add(tip, [-4, -6, 0]), 1.6, 0.4, IRON);
  },
};

// ════ [정예] 돌 골렘 ════ (가슴에 빛나는 화로 파편, 죽으면 셋으로 갈라진다)
export const stoneGolem = {
  fw: 92, fh: 90, w: 30, h: 50,
  anims: { idle: [6, 5], move: [8, 6], wind: [4, 7, !1], throw: [3, 14, !1], slam: [3, 10, !1], dash: [2, 10], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 88, cx = 44;
    let bob = 0, ph = 0, lean = 0.05, aN = [1.8, 0.4], aF = [1.6, 0.3], rock = 0, crouch = 0;
    if (nm === "idle") bob = Math.sin((k / n) * TAU) * 1;
    if (nm === "move") ((ph = (k / n) * TAU), (bob = Math.abs(Math.cos(ph)) * 2), (aN = [1.7 + Math.sin(ph) * 0.3, 0.4]), (aF = [1.5 - Math.sin(ph) * 0.3, 0.3]));
    if (nm === "wind") ((aN = [lerp(1.8, -2.3, ease((k + 1) / n)), -0.4]), (rock = 1), (lean = -0.15), (crouch = 2));
    if (nm === "throw") ((aN = [[-1.6, -0.2], [-0.3, 0.1], [0.4, 0.3]][k]), (rock = k === 0 ? 1 : 0), (lean = 0.3));
    if (nm === "slam") ((lean = [0.15, 0.4, 0.5][k]), (aN = [0.8, 0.3]), (aF = [0.9, 0.3]), (crouch = k * 3));
    if (nm === "dash") ((lean = 0.5), (aN = [1.2, 0.3]), (ph = k * PI));
    if (nm === "hurt") ((lean = -0.2), (bob = 1));
    const hip = [cx, G - 28 + bob * 0.4 + crouch, 0];
    const s = Math.sin(ph) * 5;
    for (const [z, m, sg] of [[-8, ROCKD, -1], [8, ROCK, 1]]) {
      const kn = add(hip, [sg * s * 0.5, 13, z]), ft = [cx + sg * s, G - 3, z];
      M.ell(add(hip, [0, 6, z]), [6, 8, 6], m);
      M.ell(ft, [7, 4, 6], m);
      void kn;
    }
    const chest = add(hip, rot2([0, -20], lean));
    M.ell(add(hip, rot2([0, -4], lean)), [12, 9, 10], ROCK, lean);
    M.ell(chest, [16, 15, 13], ROCK, lean);
    // 가슴의 빛나는 파편 + 균열 + 이끼
    M.ell(add(chest, rot2([3, 0, 11], lean)), [4.5, 5, 3], CORE, lean);
    M.ell(add(chest, rot2([3, 0, 12.2], lean)), [2, 2.4, 2], FLAME, lean);
    for (let i = 0; i < 4; i++) M.cap(add(chest, rot2([3, 0, 11], lean)), add(chest, rot2([3 + Math.cos(i * 1.6) * 9, Math.sin(i * 1.6) * 8, 10], lean)), 0.7, 0.3, CORED);
    M.ell(add(chest, rot2([-6, -12, 2], lean)), [8, 3, 9], MOSSY, lean);
    M.cap(add(chest, rot2([6, -10, -8], lean)), add(chest, rot2([9, -18, -8], lean)), 2.6, 0.6, ORED);
    M.sphere(add(chest, rot2([9, -18, -7], lean)), 1.2, ORE);
    // 뒷팔
    const shF = add(chest, rot2([-1, -9, -13], lean));
    const [, hf] = arm(M, shF, aF[0], 14, aF[1], 13, 6, 5.5, ROCKD);
    M.ell(hf, [6, 6, 6], ROCKD);
    // 머리 (작고 어깨에 파묻힘)
    const head = add(chest, rot2([4, -16, 2], lean));
    M.ell(head, [6.5, 6, 6.5], ROCK, lean);
    M.ell(add(head, rot2([3, 0, 5], lean)), [4, 1.2, 2], SOCK, lean);
    M.sphere(add(head, rot2([2.5, 0, 6.4], lean)), 1.1, EYEY).sphere(add(head, rot2([5, 0, 5], lean)), 1, EYEY);
    // 앞팔 + 주먹 (+ 던질 바위)
    const shN = add(chest, rot2([1, -9, 13], lean));
    M.ell(shN, [8, 7, 7], ROCK, lean);
    const [, hn] = arm(M, shN, aN[0], 14, aN[1], 13, 6.5, 6, ROCK);
    M.ell(hn, [7, 7, 6.5], ROCK);
    rock && M.ell(add(hn, [0, -9, 0]), [8, 7, 7], ROCKD);
  },
};

// ════ [보스] 광맥 포식자 그라우크 ════ (광석 껍질을 두른 거대 벌레)
export const grauk = {
  boss: !0, fw: 150, fh: 130, w: 46, h: 70,
  anims: { idle: [4, 5], move: [4, 8], stagger: [1, 1], rise: [1, 1], dive: [2, 10], spit: [1, 1], sweep: [2, 10], roar: [1, 1], inhale: [2, 10], hide: [1, 1] },
  model(M, nm, k, n) {
    const G = 128, cx = 70;
    if (nm === "hide") {
      for (let i = 0; i < 6; i++) M.ell([cx - 22 + i * 9, G - 2, 0], [6, 3 + (i % 2) * 2, 6], ROCKD);
      M.sphere([cx, G - 4, 4], 2, ORE);
      return;
    }
    let rise = 1, bend = Math.sin((k / Math.max(1, n)) * TAU) * 0.08, jaw = 0.3, low = 0, headUp = 0;
    if (nm === "move") bend = Math.sin((k / n) * TAU) * 0.2;
    if (nm === "stagger") ((bend = 0.9), (jaw = 0.8), (low = 1));
    if (nm === "rise") ((bend = -0.15), (jaw = 1), (headUp = 1));
    if (nm === "dive") ((rise = k ? 0.4 : 0.7), (bend = 0.8));
    if (nm === "spit") ((bend = 0.35), (jaw = 1.3));
    if (nm === "sweep") ((low = 1), (bend = k ? 1.5 : 1.2), (jaw = 0.5));
    if (nm === "roar") ((bend = -0.1), (jaw = 1.4), (headUp = 1));
    if (nm === "inhale") ((bend = 0.45), (jaw = 1.6 + k * 0.2));
    // 땅의 구멍
    M.ell([cx - 10, G - 2, 0], [24, 4, 14], ROCKD);
    // 몸통 마디 (갑각 + 등의 광석)
    const segs = 8, L = 9.5 * rise;
    let p = [cx - 10, G - 2, 0], a = -PI / 2 + 0.1;
    const pts = [p];
    for (let i = 0; i < segs; i++) {
      a += (bend / segs) * (low ? 1.6 : 1) + (headUp ? -0.02 : 0);
      p = add(p, [Math.cos(a) * L, Math.sin(a) * L, 0]);
      pts.push(p);
    }
    for (let i = 0; i < segs; i++) {
      const r = 14 - i * 0.5;
      M.sphere(pts[i + 1], r, FLESH);
      M.ell(add(pts[i + 1], [Math.cos(a - 1.7) * 3, Math.sin(a - 1.7) * 3, 0]), [r * 1.05, r * 0.7, r * 0.95], i % 2 ? CHITIN : CHITIND, a + PI / 2);
      // 등의 광석 결정
      if (i % 2 === 1) {
        const n2 = [Math.cos(a - PI / 2), Math.sin(a - PI / 2)];
        const base = add(pts[i + 1], [n2[0] * r * 0.8, n2[1] * r * 0.8, -3]);
        M.cap(base, add(base, [n2[0] * 12 - 3, n2[1] * 12, -2]), 3.6, 0.8, ORED);
        M.sphere(add(base, [n2[0] * 4, n2[1] * 4, 1]), 1.6, i === 5 ? GOLD : ORE);
      }
    }
    // 머리: 거대한 턱 (위아래로 벌어지는 집게) + 눈 여럿
    const h = pts[segs], ha = a + PI / 2;
    M.sphere(h, 15, CHITIN);
    M.ell(add(h, rot2([8, 2, 8], ha)), [8, 3 + jaw * 4, 6], MAWR, ha);
    // 위턱 · 아래턱 집게
    for (const sg of [-1, 1]) {
      const base = add(h, rot2([10, sg * (4 + jaw * 3), 8], ha));
      const tip = add(base, rot2([12, sg * (2 + jaw * 6), 0], ha));
      M.cap(base, tip, 3.4, 0.8, MAND);
      M.cap(tip, add(tip, rot2([-3, -sg * 4, 0], ha)), 1.6, 0.4, MAND);
      for (let i = 0; i < 3; i++) M.cap(add(base, rot2([3 + i * 3, 0, 0], ha)), add(base, rot2([3 + i * 3, -sg * 3, 0], ha)), 0.8, 0.2, TOOTH);
    }
    for (const [ex, ey, ez, r] of [[2, -8, 12, 2], [7, -7, 9, 1.6], [-3, -10, 9, 1.4], [5, -11, 6, 1.2]]) M.sphere(add(h, rot2([ex, ey, ez], ha)), r, EYEC);
    // 머리 위 광석 왕관
    for (let i = 0; i < 3; i++) M.cap(add(h, rot2([-6 + i * 5, -12, -2 + i * 2], ha)), add(h, rot2([-8 + i * 5, -24 - (i % 2) * 4, -2 + i * 2], ha)), 3.4, 0.6, ORED);
    // 흡입: 빨려 드는 먼지
    nm === "inhale" && [0, 1, 2, 3].forEach((i) => M.sphere(add(h, rot2([24 + i * 6, ((i % 2) * 2 - 1) * 4, 10], ha)), 2.2 - i * 0.3, mat(0xb8a890, { emit: 0xc8b8a0 })));
  },
};
