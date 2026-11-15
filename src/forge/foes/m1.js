// 2지역 「안개 숲」 3D 모델 — 화로가 떨어질 때 튀어나간 증기가 식어 숲 전체에 짙은 안개로 남았다.
// 색: 이끼 초록 · 나무껍질 갈색 · 안개 청록 · 창백한 빛
import { mat, rough, cloth, cape, EYE, gait, leg, arm, PI, TAU, chain, add, rot2, ease, lerp, noise3, hash } from "./rig.js";

// ── 재질 ──
const FUR = mat(0x5e6a58, { tex: (u, v, w, s) => (noise3(u * 0.8 + s, v * 0.3, w * 0.8) - 0.5) * 1.4, rim: 0.55, rimCol: 0xd8ffe8 });
const FURD = mat(0x3e463c, { tex: rough(0.7, 1) });
const BELLY = mat(0x8a9480, { tex: rough(0.5, 0.6) });
const MOSS = mat(0x5a8a34, { tex: (u, v, w, s) => (noise3(u * 1.2 + s, v * 1.2, w * 1.2) - 0.5) * 1.8, rim: 0.4, rimCol: 0xc8ff90 });
const MOSSL = mat(0x86b848, { tex: rough(1, 1) });
const LICHEN = mat(0xb8c890, { tex: rough(1.4, 1.2) });
const NOSE = mat(0x1e1a1c, { spec: 0.5, shin: 40 });
const FANG = mat(0xf0ecdc, { spec: 0.4, shin: 40 });
const GUM = mat(0x8a3a44);
const EYEG = EYE(0xc8ffb0), EYEC = EYE(0x9af0ff), EYEA = EYE(0xffd060), EYEW = EYE(0xffffff);
const BARK = mat(0x6a4a32, { tex: (u, v, w, s) => Math.sin(u * 1.1 + noise3(u * 0.2, v * 0.2, w + s) * 5) * 0.55, rim: 0.4, rimCol: 0xe0ffc8 });
const BARKD = mat(0x46301e, { tex: (u, v) => Math.sin(u * 1.4 + v * 0.2) * 0.5 });
const LEAF = mat(0x4e8a3a, { tex: (u, v, w, s) => (hash(Math.floor(u * 0.7) + s, Math.floor(v * 0.7)) - 0.5) * 1.4, rim: 0.5, rimCol: 0xd8ff9a });
const LEAFL = mat(0x7ab84a, { tex: rough(1, 1) });
const THORN = mat(0xc8b890, { spec: 0.3 });
const MAW = mat(0x1a0e0a);
const CAP = mat(0x9a3a5a, { tex: (u, v, w, s) => (noise3(u * 0.35 + s, v * 0.35, w * 0.35) > 0.68 ? 1.6 : 0), rim: 0.4, rimCol: 0xffd0e8, spec: 0.25, shin: 30 });
const GILL = mat(0xd8c0a8, { tex: (u) => (Math.floor(u * 1.5) % 2 ? 0.6 : -0.6) });
const STEM = mat(0xe8dcc4, { tex: rough(0.4, 0.5) });
const SPORE = EYE(0xb8f070), SPORED = EYE(0x8ac048);
const WRAITH = mat(0x5ad0b8, { rim: 0.9, rimCol: 0xe0fff8, hi: 0xd0fff4, lo: 0x1a4a50, tones: 7, tex: (u, v, w, s) => Math.sin(v * 0.8 + s) * 0.4 });
const WRAITHD = mat(0x2a7a74, { rim: 0.7, rimCol: 0xb0fff0, tex: cloth(0.6) });
const HOODIN = mat(0x081414);
const SPECT = EYE(0xa8fff0);
const QUILL = mat(0x7a5634, { spec: 0.2, tex: (u) => (u > 7 ? 1 : 0) });
const QUILLT = mat(0x9ad060);
const HOG = mat(0x8a7058, { tex: rough(0.6, 0.8) });
const SKIN = mat(0xe0e8e0, { rim: 0.6, rimCol: 0xc8fff8 });
const WING = mat(0x8ac8e8, { rim: 0.9, rimCol: 0xffffff, hi: 0xe8fcff, lo: 0x2a4a7a, tex: (u, v) => (Math.abs(Math.sin(u * 0.9 + v * 0.4)) < 0.14 ? -1.6 : 0.2) });
const FSKIN = mat(0xf2dccc, { rim: 0.6, rimCol: 0xffffff });
const HAIRF = mat(0x7ae8d8, { rim: 0.8, rimCol: 0xffffff, tex: (u) => Math.sin(u * 2) * 0.4 });
const ORB = EYE(0xc0fff0), ORBC = EYE(0xffffff);
const ROBE = mat(0x4a5a5e, { tex: cloth(0.5), rim: 0.6, rimCol: 0xb8fff0 });
const ROBEB = mat(0x5a4a66, { tex: cloth(0.5), rim: 0.6, rimCol: 0xe8c8ff });
const VEIL = mat(0x2e3a3c, { tex: cloth(0.9) });
const PALE = mat(0xd8e0d0, { rim: 0.5 });
const MASK = mat(0xf4f0e8, { spec: 0.5, shin: 50, rim: 0.4 });
const STAFF = mat(0x5a4030, { tex: (u) => Math.sin(u * 3) * 0.4 });
const POIS = EYE(0x9aff60), POISD = EYE(0x5ac030);
const FLOWER = EYE(0xffa8d0), FLOWERC = EYE(0xfff0a0);
const ANT = mat(0xe8dcc0, { spec: 0.3, shin: 40, rim: 0.5, rimCol: 0xe8fff0, tex: rough(0.5, 0.5) });
const HOOF = mat(0x2a221e, { spec: 0.4 });
const ELK = mat(0x6a5444, { tex: (u, v, w, s) => (noise3(u * 0.5 + s, v * 0.2, w * 0.5) - 0.5) * 1.2, rim: 0.55, rimCol: 0xd0fff0 });
const ELKD = mat(0x4a382c, { tex: rough(0.6, 1) });
const MANE = mat(0xb0dcd4, { rim: 0.9, rimCol: 0xffffff, hi: 0xf0fffc, tex: (u, v) => Math.sin(u * 1.5 + v) * 0.5 });

// 네발 다리 (무릎 방향: front는 앞으로, back은 뒤로 굽는다)
function qleg(M, hip, ph, len, w, m, paw, back, lift = 1) {
  const sw = Math.sin(ph) * 0.55;
  const a1 = PI / 2 + (back ? 0.15 : -0.1) - sw;
  const a2 = back ? -0.55 - Math.max(0, Math.cos(ph)) * 0.6 * lift : 0.35 + Math.max(0, Math.cos(ph)) * 0.6 * lift;
  const [kn, ft] = chain(hip, a1, len * 0.52, a2, len * 0.55);
  M.cap(hip, kn, w, w * 0.75, m).cap(kn, ft, w * 0.75, w * 0.55, m);
  M.ell(add(ft, [1.5, 0, 0]), [w * 0.9, w * 0.5, w * 0.7], paw);
  return ft;
}

// ════ 이끼 늑대 ════
export const mossWolf = {
  fw: 76, fh: 50, w: 22, h: 16,
  anims: { idle: [6, 6], move: [6, 14], wind: [3, 9, !1], atk: [3, 14, !1], rec: [2, 8, !1], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 47, cx = 34;
    let bob = 0, ph = 0, stretch = 0, tilt = 0, crouch = 0, jaw = 0.15, headT = 0, tail = Math.sin((k / Math.max(1, n)) * TAU) * 0.3, legsUp = 0, hack = 0;
    if (nm === "idle") bob = Math.sin((k / n) * TAU) * 0.7;
    if (nm === "move") ((ph = (k / n) * TAU), (stretch = Math.sin(ph) * 3), (bob = Math.abs(Math.cos(ph)) * 2.5), (tilt = Math.sin(ph) * 0.06));
    if (nm === "wind") ((crouch = (k + 1) * 2.2), (headT = 0.25), (hack = k + 1), (jaw = 0.4), (tail = -0.4));
    if (nm === "atk") ((tilt = [-0.35, -0.2, 0.1][k]), (stretch = [6, 7, 3][k]), (jaw = [1, 1, 0.3][k]), (legsUp = [1, 1, 0.3][k]), (bob = [6, 5, 1][k]), (headT = -0.1));
    if (nm === "rec") ((crouch = 2 - k), (jaw = 0.3));
    if (nm === "hurt") ((tilt = 0.2), (headT = -0.4), (jaw = 0.7));
    const b = [cx, G - 17 - bob + crouch * 0.6, 0];
    const fwd = rot2([1, 0], tilt);
    const front = add(b, rot2([10 + stretch * 0.5, -1], tilt)), rear = add(b, rot2([-10 - stretch * 0.5, 0], tilt));
    // 꼬리 (풍성, 끝에 이끼)
    const t0 = add(rear, rot2([-6, -2, 0], tilt)), t1 = add(t0, [-7, -3 + tail * 6, -1]), t2 = add(t1, [-6, -1 + tail * 8, -1]);
    M.cap(t0, t1, 3, 3.6, FUR).cap(t1, t2, 3.6, 2, FUR).sphere(t2, 2.4, MOSS);
    // 뒤쪽 다리 (어둡게)
    const legPh = (o) => ph + o;
    if (legsUp) {
      qleg(M, add(front, [0, 3, -4]), 0, 15, 2.6, FURD, FURD, !1, 0);
      M.cap(add(front, [0, 3, -4]), add(front, [9 * legsUp, 8, -4]), 2.4, 1.8, FURD);
      M.cap(add(rear, [0, 3, -4]), add(rear, [-9 * legsUp, 9, -4]), 3, 2, FURD);
    } else {
      qleg(M, add(front, [0, 3, -4]), legPh(PI), 15 - crouch * 0.5, 2.6, FURD, FURD, !1);
      qleg(M, add(rear, [0, 3, -4]), legPh(PI * 0.4), 16 - crouch * 0.5, 3.2, FURD, FURD, !0);
    }
    // 몸통: 엉덩이 · 허리 · 가슴
    M.ell(rear, [8, 7, 6.5], FUR, tilt);
    M.ell(b, [11, 6.5, 6.5], FUR, tilt);
    M.ell(add(b, rot2([2, 4, 2], tilt)), [9, 3, 5], BELLY, tilt);
    M.ell(front, [8.5, 8, 7], FUR, tilt - 0.1);
    // 등의 이끼 뭉치 + 지의류 (예고 때 곤두섬)
    for (let i = 0; i < 6; i++) {
      const p = add(b, rot2([-12 + i * 4.8, -6 - (i % 2) - hack * 0.6, 0], tilt));
      M.ell(p, [3.2, 2.4 + hack * 0.4, 3.6], i % 3 === 1 ? LICHEN : i % 2 ? MOSSL : MOSS, tilt + (i - 3) * 0.1);
    }
    // 앞쪽 다리
    if (legsUp) {
      M.cap(add(front, [1, 4, 4]), add(front, [11 * legsUp, 7, 4]), 2.8, 2, FUR).ell(add(front, [12 * legsUp + 1, 7.5, 4]), [2.4, 1.4, 2], FUR);
      M.cap(add(rear, [0, 4, 4]), add(rear, [-10 * legsUp, 10, 4]), 3.4, 2.2, FUR);
    } else {
      qleg(M, add(front, [1, 4, 4]), legPh(0), 15 - crouch * 0.5, 2.8, FUR, FURD, !1);
      qleg(M, add(rear, [0, 4, 4]), legPh(PI * 1.4), 16 - crouch * 0.5, 3.4, FUR, FURD, !0);
    }
    // 목 + 머리 (3/4: 얼굴이 보는 쪽으로)
    const neck = add(front, rot2([5, -5, 1], tilt));
    const head = add(neck, rot2([6, -2 + headT * 6, 2], tilt + headT));
    M.cap(front, neck, 6, 5, FUR);
    M.ell(head, [7.2, 6.2, 6.4], FUR, tilt + headT);
    M.ell(add(head, rot2([2, 2.5, 3.5], tilt + headT)), [4.5, 3, 3], BELLY, tilt + headT);
    const ha = tilt + headT;
    const snoutE = add(head, rot2([9, 1.5, 1.5], ha));
    M.cap(add(head, rot2([3, 0.5, 1], ha)), snoutE, 4, 2.6, FUR);
    M.sphere(add(snoutE, [0.8, -0.4, 0.6]), 1.5, NOSE);
    // 아래턱 (물 때 벌어짐) + 송곳니
    const jawA = ha + jaw * 0.7;
    const jawE = add(head, rot2([8, 4 + jaw * 2, 1.5], jawA * 0.5 + ha * 0.5));
    M.cap(add(head, rot2([2, 3, 1], ha)), jawE, 2.4, 1.6, FURD);
    jaw > 0.5 && (M.ell(add(head, rot2([6, 3, 3], ha)), [3, 1.2 * jaw, 2], GUM), M.cap(add(snoutE, rot2([-1, 1.5, 2], ha)), add(snoutE, rot2([-1, 3.5, 2], ha)), 0.7, 0.2, FANG), M.cap(add(jawE, rot2([-1, -1, 2], ha)), add(jawE, rot2([-1, -3, 2], ha)), 0.7, 0.2, FANG));
    // 귀 + 눈
    M.cap(add(head, rot2([-1, -4, 3], ha)), add(head, rot2([-4, -10, 3], ha - 0.2)), 2, 0.4, FURD);
    M.cap(add(head, rot2([-2, -4, -2], ha)), add(head, rot2([-5, -9, -2], ha - 0.2)), 1.8, 0.4, FURD);
    M.ell(add(head, rot2([3.5, -2, 5.6], ha)), [2.2, 1.4, 1], FURD, ha - 0.3);
    M.sphere(add(head, rot2([3.8, -1.8, 6.4], ha)), 1.3, EYEG);
    M.sphere(add(head, rot2([5.4, -1.8, 2], ha)), 1, EYEG);
    // 목덜미 이끼 갈기
    for (let i = 0; i < 3; i++) M.ell(add(neck, rot2([-2 - i * 2, -5 + i, -1], ha)), [3, 2.5, 4], i % 2 ? MOSSL : MOSS, ha);
  },
};

// ════ 안개 요정 ════
export const mistFairy = {
  fw: 48, fh: 50, w: 12, h: 16, flying: !0,
  anims: { idle: [6, 14], wind: [3, 8, !1], cast: [3, 14, !1], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const cx = 24, cy = 26;
    let flap = Math.sin((k / Math.max(1, n)) * TAU), bob = Math.sin((k / Math.max(1, n)) * TAU) * 1.5, orbUp = 0, orbR = 2.6, armA = 0.6, lean = 0;
    if (nm === "wind") ((orbUp = (k + 1) / 3), (orbR = 2.6 + k * 1.2), (armA = -1.2 - k * 0.3), (lean = -0.15));
    if (nm === "cast") ((armA = [0.2, 0.8, 1.1][k]), (orbR = [4, 0, 0][k]), (lean = 0.2));
    if (nm === "hurt") ((lean = -0.4), (flap = -0.8));
    const b = [cx, cy + bob, 0];
    // 나방 날개 두 쌍 (뒤 → 앞)
    const wing = (z, up, big) => {
      const a = -0.9 - up * 0.5;
      M.ell(add(b, rot2([-5, -5, z], lean)), [big ? 9 : 7, big ? 5 : 4, 0.8], WING, a);
      M.ell(add(b, rot2([-4, 0, z], lean)), [big ? 6 : 5, big ? 4 : 3, 0.8], WING, 0.5 + up * 0.4);
      M.sphere(add(b, rot2([-10, -9 - up * 3, z + 0.5], lean)), 1, ORB);
    };
    wing(-3, flap, 1);
    // 다리 (늘어진)
    M.cap(add(b, [0, 4, -1]), add(b, [-2, 10, -1]), 1, 0.6, FSKIN).cap(add(b, [1, 4, 1]), add(b, [0, 10, 1]), 1, 0.6, FSKIN);
    // 몸통 + 잎사귀 옷
    M.ell(b, [3.4, 5, 3], FSKIN, lean);
    M.ell(add(b, [0, 3, 0]), [4.5, 3, 3.8], LEAFL, lean);
    // 머리 + 큰 눈 + 머리카락 갈래
    const h = add(b, rot2([1, -8, 0], lean));
    M.sphere(h, 5, FSKIN);
    for (let i = 0; i < 4; i++) M.cap(add(h, [-2 + i * 0.5, -3, -1]), add(h, [-7 - i, -6 + i * 2 + flap, -2 + i * 0.5]), 1.8, 0.6, HAIRF);
    M.sphere(add(h, [1.8, 0, 4.4]), 1.5, EYEC).sphere(add(h, [4.2, 0, 2]), 1.2, EYEC);
    M.ell(add(h, [2.6, 2.6, 4]), [1, 0.5, 0.5], mat(0xd07a8a));
    // 안개 구슬을 든 팔
    const sh = add(b, rot2([1, -3, 3], lean));
    const hand = add(sh, [Math.cos(armA) * 6, Math.sin(armA) * 6, 1]);
    M.cap(sh, hand, 1.1, 0.9, FSKIN);
    orbR > 0.5 && (M.sphere(add(hand, [1, -1 - orbUp * 2, 1]), orbR, ORB), M.sphere(add(hand, [0.4, -1.6 - orbUp * 2, 2]), orbR * 0.45, ORBC));
    wing(-1.5, flap * 0.9, 0);
    // 반짝이는 가루
    for (let i = 0; i < 3; i++) M.sphere([cx - 12 + hash(k, i, 3) * 24, cy - 14 + hash(i, k, 5) * 28, 5], 0.7, ORB);
  },
};

// ════ 뿌리 덩굴 ════
export const rootVine = {
  fw: 64, fh: 70, w: 14, h: 34,
  anims: { hide: [2, 3], emerge: [4, 12, !1], idle: [6, 6], wind: [3, 9, !1], atk: [3, 16, !1], rec: [2, 8, !1], sink: [3, 12, !1], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 68, cx = 26;
    // 땅 위 새싹 (숨어 있을 때도 보임)
    const sprouts = () => {
      for (let i = 0; i < 3; i++) {
        const x = cx - 6 + i * 6, h = 4 + (i % 2) * 2 + (nm === "hide" ? Math.sin(k * 2 + i) : 0);
        M.cap([x, G, 1], [x + 1, G - h, 1], 0.9, 0.5, MOSS);
        M.ell([x + 2, G - h, 1.5], [2.4, 1, 1.4], LEAFL, -0.4);
      }
      M.ell([cx, G, 0], [9, 2, 6], BARKD);
    };
    if (nm === "hide") return void sprouts();
    let rise = 1, bend = Math.sin((k / Math.max(1, n)) * TAU) * 0.15, jaw = 0.2;
    if (nm === "emerge") rise = ease((k + 1) / n);
    if (nm === "sink") rise = 1 - ease((k + 1) / n);
    if (nm === "wind") ((bend = -0.6 - k * 0.25), (jaw = 0.6));
    if (nm === "atk") ((bend = [0.5, 1.15, 1.35][k]), (jaw = 1));
    if (nm === "rec") bend = 0.8 - k * 0.4;
    if (nm === "hurt") ((bend = -0.4), (jaw = 0.8));
    sprouts();
    // 뿌리 촉수: 바닥에서 위로 휘어 오른다 (마디마다 굵기 감소)
    const segs = 6, L = 6.6 * rise;
    let p = [cx, G - 1, 0], a = -PI / 2;
    const pts = [p];
    for (let i = 0; i < segs; i++) {
      a += bend * (i / segs) * 0.55 + Math.sin(i + k * 0.6) * 0.05;
      p = add(p, [Math.cos(a) * L, Math.sin(a) * L, 0]);
      pts.push(p);
    }
    for (let i = 0; i < segs; i++) {
      const r0 = 6.5 - i * 0.35, r1 = 6.5 - (i + 1) * 0.35;
      M.cap(pts[i], pts[i + 1], r0, r1, i % 2 ? BARK : BARKD);
      // 가시 + 잔뿌리
      i > 1 && M.cap(pts[i], add(pts[i], [Math.cos(a + 1.6) * 4, Math.sin(a + 1.6) * 4, 3]), 0.9, 0.2, THORN);
      i % 2 === 0 && M.cap(pts[i], add(pts[i], [-3, 3, -3]), 0.8, 0.3, BARKD);
    }
    if (rise < 0.4) return;
    // 머리: 옹이 덩어리 + 갈라진 아가리 + 호박색 눈
    const h = pts[segs], ha = a + PI / 2;
    M.ell(add(h, rot2([-1, -2, 0], ha)), [10, 8, 8.5], BARK, ha);
    M.ell(add(h, rot2([4, 5 + jaw * 2, 0], ha)), [8, 4, 7], BARKD, ha + jaw * 0.35);
    M.ell(add(h, rot2([3, 2.5, 4], ha)), [7, 1.6 + jaw * 3.5, 5], MAW, ha);
    for (let i = 0; i < 4; i++) {
      M.cap(add(h, rot2([-2 + i * 2.6, 1, 6.5], ha)), add(h, rot2([-2 + i * 2.6, 3 + jaw * 1.6, 6.5], ha)), 0.9, 0.2, THORN);
      M.cap(add(h, rot2([-2 + i * 2.6, 4.5 + jaw * 3.6, 6.5], ha)), add(h, rot2([-2 + i * 2.6, 2.5 + jaw * 2.4, 6.5], ha)), 0.9, 0.2, THORN);
    }
    M.ell(add(h, rot2([0, -4, 6], ha)), [2.4, 2, 1.5], MAW, ha).ell(add(h, rot2([5, -3.5, 4], ha)), [2, 1.8, 1.5], MAW, ha);
    M.sphere(add(h, rot2([0, -4, 7.2], ha)), 1.4, EYEA).sphere(add(h, rot2([5, -3.5, 5.2], ha)), 1.2, EYEA);
    // 머리 위 잎사귀 왕관
    for (let i = 0; i < 5; i++) M.ell(add(h, rot2([-7 + i * 3, -9, (i % 2) * 3 - 1.5], ha)), [4.4, 1.8, 2.6], i % 2 ? LEAF : LEAFL, ha - 0.8 + i * 0.4);
  },
};

// ════ 포자 버섯 ════
export const sporeShroom = {
  fw: 56, fh: 54, w: 18, h: 26,
  anims: { idle: [6, 5], move: [6, 7], puff: [4, 10, !1], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 52, cx = 26;
    let sq = Math.sin((k / Math.max(1, n)) * TAU) * 0.06, bob = 0, eyes = 0, ph = 0, lean = 0, spores = 0;
    if (nm === "move") ((ph = (k / n) * TAU), (bob = Math.abs(Math.sin(ph)) * 2), (lean = Math.sin(ph) * 0.08));
    if (nm === "puff") ((sq = [0.2, 0.32, -0.15, 0][k]), (spores = [0, 0, 1, 0.6][k]), (eyes = 0.5));
    if (nm === "hurt") ((eyes = 1), (sq = 0.1));
    // 발
    const fp = Math.sin(ph) * 2;
    M.ell([cx - 5 + fp, G - 1, -2], [4, 2.4, 3.5], STEM).ell([cx + 5 - fp, G - 1, 2], [4, 2.4, 3.5], STEM);
    // 줄기 (얼굴)
    const st = [cx, G - 11 - bob, 0];
    M.ell(st, [8.5, 10 * (1 - sq * 0.5), 8], STEM, lean);
    // 얼굴: 졸린 눈 → 놀라면 동그래짐 · 입
    const fz = add(st, rot2([2, -1, 7.2], lean));
    if (eyes > 0.6) (M.sphere(add(fz, [-2.6, -1, 0]), 1.6, EYEW), M.sphere(add(fz, [2.6, -1, 0]), 1.6, EYEW), M.sphere(add(fz, [-2.4, -1, 1.2]), 0.7, NOSE), M.sphere(add(fz, [2.8, -1, 1.2]), 0.7, NOSE));
    else (M.ell(add(fz, [-2.6, -1, 0]), [1.8, 0.6, 0.8], NOSE), M.ell(add(fz, [2.6, -1, 0]), [1.8, 0.6, 0.8], NOSE));
    M.ell(add(fz, [0, 3, 0]), [1.6, 0.8 + eyes, 0.8], MAW);
    M.ell(add(fz, [-4.5, 1.5, -0.5]), [1.4, 0.9, 0.6], mat(0xe8a0a0));
    M.ell(add(fz, [4.5, 1.5, -0.5]), [1.4, 0.9, 0.6], mat(0xe8a0a0));
    // 작은 팔
    M.cap(add(st, [-7, 0, 3]), add(st, [-11, 4 + eyes * -6, 4]), 1.6, 1.3, STEM).cap(add(st, [7, 0, 3]), add(st, [11, 4 + eyes * -6, 4]), 1.6, 1.3, STEM);
    // 갓: 아래 주름 + 점박이 갓
    const cp = add(st, rot2([0, -12 + sq * 6, 0], lean));
    M.ell(add(cp, [0, 3, 0]), [16, 3, 13], GILL, lean);
    M.ell(cp, [17 * (1 + sq * 0.4), 8 * (1 - sq), 14 * (1 + sq * 0.3)], CAP, lean);
    // 포자 구름
    if (spores) for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU + k;
      M.sphere(add(cp, [Math.cos(a) * (14 + spores * 8), Math.sin(a) * (6 + spores * 5) - 4, 8]), 2 - (i % 3) * 0.4, i % 2 ? SPORE : SPORED);
    }
  },
};

// ════ 사냥꾼 망령 ════
export const hunterWraith = {
  fw: 60, fh: 66, w: 12, h: 28,
  anims: { idle: [6, 6], move: [6, 8], draw: [5, 8, !1], shoot: [3, 14, !1], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 62, cx = 26;
    let bob = Math.sin((k / Math.max(1, n)) * TAU) * 1.5, pull = 0, recoil = 0, lean = 0.05, sway = Math.sin((k / Math.max(1, n)) * TAU);
    if (nm === "move") ((lean = 0.25), (sway = Math.sin((k / n) * TAU) * 1.4));
    if (nm === "draw") ((pull = ease((k + 1) / n)), (lean = -0.1));
    if (nm === "shoot") ((recoil = [1, 0.5, 0][k]), (lean = -0.15));
    if (nm === "hurt") ((lean = -0.35), (sway = 2));
    const b = [cx, G - 26 + bob, 0];
    // 연기처럼 흩어지는 아래 자락 (다리 없음)
    for (let i = 0; i < 5; i++) {
      const t = i / 4;
      M.ell(add(b, [-2 - t * 6 - sway * t * 2, 8 + t * 12, -1]), [6 - t * 3.5, 4.5, 4 - t * 2], i % 2 ? WRAITH : WRAITHD, 0.3 + t * 0.3);
    }
    // 너덜너덜한 망토 띠
    for (let i = 0; i < 3; i++) M.cap(add(b, [-4, -6 + i * 2, -3]), add(b, [-12 - i * 2 - sway, 6 + i * 4, -4]), 1.6, 0.5, WRAITHD);
    // 몸통
    M.ell(add(b, rot2([0, -4], lean)), [6.5, 9, 5], WRAITH, lean);
    // 두건 + 그 속 어둠 + 빛나는 두 눈
    const h = add(b, rot2([1.5, -15, 0], lean));
    M.ell(add(h, [-2, -1, -2]), [7, 7.5, 6], WRAITHD, lean - 0.2);
    M.cap(add(h, [-3, -6, -2]), add(h, [-10, -8 - sway, -3]), 3, 0.6, WRAITHD);
    M.ell(add(h, [1.5, 1, 3]), [4.2, 4.6, 3.4], HOODIN, lean);
    M.sphere(add(h, [1.2, 0.5, 6]), 1.2, SPECT).sphere(add(h, [3.6, 0.5, 4.6]), 1, SPECT);
    // 유령 활
    const sh = add(b, rot2([3, -8, 4], lean));
    const bowC = add(sh, [13 - recoil * 2, 1, 4]);
    const top = add(bowC, [-3, -14, 0]), bot = add(bowC, [-3, 14, 0]);
    M.cap(top, add(bowC, [1.5, -6, 0]), 1.1, 1.4, WRAITH).cap(add(bowC, [1.5, -6, 0]), add(bowC, [1.5, 6, 0]), 1.4, 1.4, WRAITH).cap(add(bowC, [1.5, 6, 0]), bot, 1.4, 1.1, WRAITH);
    const nock = add(bowC, [-3 - pull * 11, 0, 0]);
    M.cap(top, nock, 0.4, 0.4, SPECT).cap(nock, bot, 0.4, 0.4, SPECT);
    M.cap(sh, add(bowC, [1, 0, -1]), 1.8, 1.4, WRAITH);
    M.cap(add(sh, [-1, 0, -2]), nock, 1.8, 1.4, WRAITHD);
    pull > 0.2 && (M.cap(nock, add(nock, [17, 0, 0]), 0.6, 0.6, SPECT), M.sphere(add(nock, [18, 0, 0.5]), 1.6, EYEW));
  },
};

// ════ 가시 고슴도치 ════
export const thornHog = {
  fw: 56, fh: 44, w: 18, h: 16,
  anims: { idle: [6, 6], move: [6, 10], curl: [3, 10, !1], roll: [6, 18], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 42, cx = 26;
    const quills = (c, R, rot, roll) => {
      for (let i = 0; i < 16; i++) {
        const a = roll ? (i / 16) * TAU + rot : -PI * 0.95 + (i / 15) * PI * 1.0;
        const z = roll ? (i % 3 - 1) * 4 : (i % 3 - 1) * 4.5;
        const base = add(c, [Math.cos(a) * R * 0.8, Math.sin(a) * R * 0.75, z]);
        const tip = add(c, [Math.cos(a) * (R + 7), Math.sin(a) * (R + 6), z * 1.2]);
        M.cap(base, tip, 1.6, 0.3, QUILL);
        M.sphere(tip, 0.6, QUILLT);
      }
    };
    if (nm === "roll" || (nm === "curl" && k === 2)) {
      const c = [cx, G - 10, 0], rot = nm === "roll" ? (k / n) * TAU : 0;
      M.sphere(c, 9, HOG);
      quills(c, 9, rot, 1);
      return;
    }
    let bob = 0, ph = 0, curl = 0, nose = 0;
    if (nm === "idle") ((bob = Math.sin((k / n) * TAU) * 0.5), (nose = Math.sin((k / n) * TAU * 2)));
    if (nm === "move") ((ph = (k / n) * TAU), (bob = Math.abs(Math.sin(ph)) * 1.5));
    if (nm === "curl") curl = (k + 1) / 3;
    if (nm === "hurt") bob = -1;
    const b = [cx, G - 9 - bob, 0];
    // 다리
    for (const [dx, z, o] of [[-6, -3, PI], [5, -3, 0], [-6, 3, 0], [5, 3, PI]]) {
      const s = Math.sin(ph + o) * 2;
      M.cap(add(b, [dx, 3, z]), [b[0] + dx + s, G - 1, z], 1.6, 1.3, z < 0 ? mat(0x5a4636) : HOG);
    }
    // 몸 + 가시
    M.ell(b, [11 - curl * 2, 7 + curl, 8], HOG);
    quills(add(b, [-1, -1, 0]), 8, 0, 0);
    // 얼굴: 뾰족한 주둥이 + 반짝이는 눈
    const h = add(b, [10 - curl * 4, 2 + curl * 2, 2]);
    M.ell(h, [5, 4, 4], mat(0xb89a7a));
    M.cap(add(h, [3, 1, 1]), add(h, [8 + nose * 0.5, 2, 1.5]), 2.2, 1, mat(0xb89a7a));
    M.sphere(add(h, [8.5 + nose * 0.5, 2, 1.8]), 1.3, NOSE);
    M.sphere(add(h, [2, -1, 3.8]), 1.1, NOSE).sphere(add(h, [2.3, -1.3, 4.6]), 0.4, EYEW);
  },
};

// ════ [정예] 거목 수호자 ════
export const elderTreant = {
  fw: 96, fh: 100, w: 30, h: 58,
  anims: { idle: [6, 5], move: [8, 6], wind: [4, 7, !1], slam: [3, 14, !1], rec: [3, 6, !1], summon: [4, 8, !1], hurt: [2, 10, !1], bidle: [6, 5], bmove: [8, 6] },
  model(M, nm, k, n) {
    const G = 98, cx = 46;
    const bloom = nm[0] === "b";
    const base = bloom ? nm.slice(1) : nm;
    let bob = 0, ph = 0, armN = [2.0, 0.5], armF = [1.7, 0.3], lean = 0.05, headT = 0, crouch = 0;
    if (base === "idle") ((bob = Math.sin((k / n) * TAU) * 1), (armN = [2.0 + Math.sin((k / n) * TAU) * 0.08, 0.5]));
    if (base === "move") ((ph = (k / n) * TAU), (bob = Math.abs(Math.cos(ph)) * 2), (lean = 0.1 + Math.sin(ph) * 0.04), (armN = [1.9 + Math.sin(ph) * 0.25, 0.5]), (armF = [1.6 - Math.sin(ph) * 0.25, 0.4]));
    if (base === "wind") {
      const t = ease((k + 1) / n);
      ((armN = [lerp(2.0, -1.9, t), lerp(0.5, -0.7, t)]), (lean = -0.12 * t), (headT = -0.15 * t), (crouch = t * 2));
    }
    if (base === "slam") ((armN = [[-0.5, -0.2], [0.8, 0.4], [1.1, 0.6]][k]), (lean = [0.2, 0.4, 0.42][k]), (crouch = [2, 6, 7][k]));
    if (base === "rec") ((armN = [1.2 + k * 0.2, 0.5]), (lean = 0.35 - k * 0.1), (crouch = 5 - k * 2));
    if (base === "summon") ((armN = [-1.6, -0.5]), (armF = [-1.4, -0.4]), (lean = -0.15), (headT = -0.25), (bob = -k));
    if (base === "hurt") ((lean = -0.2), (headT = -0.3));
    const hip = [cx, G - 30 + bob * 0.4 + crouch, 0];
    // 뿌리 다리 (짧고 굵은)
    const s = Math.sin(ph) * 5;
    for (const [z, sg, m] of [[-7, -1, BARKD], [7, 1, BARK]]) {
      const kn = add(hip, [sg * s * 0.5 + 1, 14, z]), ft = [cx + sg * s, G - 2, z];
      M.cap(add(hip, [0, 0, z]), kn, 7, 6, m).cap(kn, ft, 6, 7, m);
      for (let i = 0; i < 3; i++) M.cap(ft, add(ft, [-4 + i * 4, 2, (i - 1) * 3]), 2.4, 0.8, BARKD);
    }
    // 몸통: 굵은 줄기 (아래 넓고 위로 갈수록 기울어짐)
    const chest = add(hip, rot2([0, -24], lean));
    M.ell(add(hip, rot2([0, -6], lean)), [15, 13, 12], BARK, lean);
    M.ell(chest, [17, 15, 13], BARK, lean);
    // 뒷팔 (가지)
    const shF = add(chest, rot2([-2, -8, -12], lean));
    const [, hf] = arm(M, shF, armF[0], 18, armF[1], 16, 6, 4.5, BARKD);
    for (let i = 0; i < 3; i++) M.cap(hf, add(hf, [Math.cos(armF[0] + armF[1] + (i - 1) * 0.5) * 7, Math.sin(armF[0] + armF[1] + (i - 1) * 0.5) * 7, (i - 1) * 2]), 1.8, 0.5, BARKD);
    // 얼굴: 깊은 옹이 눈 + 빈 입 + 이끼 수염 (3/4)
    const face = add(chest, rot2([5, -4, 10], lean + headT));
    M.ell(add(face, [-4, -3, 0]), [3.4, 3.8, 2.2], MAW, headT).ell(add(face, [5, -3, -1]), [3, 3.4, 2], MAW, headT);
    M.sphere(add(face, [-3.6, -3, 1.6]), 1.7, bloom ? FLOWERC : EYEG).sphere(add(face, [5.2, -3, 0.8]), 1.4, bloom ? FLOWERC : EYEG);
    M.ell(add(face, [0.5, 5, 0]), [4, 2.5 + (base === "summon" ? 2 : 0), 2], MAW, headT);
    for (let i = 0; i < 6; i++) M.cap(add(face, [-6 + i * 2.6, 8, -1]), add(face, [-7 + i * 2.6 + Math.sin(k + i), 20 + (i % 3) * 3, 1]), 2.2, 0.8, i % 2 ? MOSS : MOSSL);
    // 머리 위 가지 왕관 + 잎 덩어리
    const crown = add(chest, rot2([0, -20, 0], lean + headT));
    for (let i = 0; i < 5; i++) {
      const a = -PI / 2 + (i - 2) * 0.45, tip = add(crown, [Math.cos(a) * 18, Math.sin(a) * 15, (i - 2) * 3]);
      M.cap(add(crown, [0, 6, 0]), tip, 3.6, 1.4, BARKD);
      M.ell(tip, [9, 7, 8], i % 2 ? LEAF : LEAFL);
      bloom && (M.sphere(add(tip, [3, -2, 6]), 2.2, FLOWER), M.sphere(add(tip, [-4, 2, 6]), 1.8, FLOWER), M.sphere(add(tip, [3, -2, 7.5]), 0.9, FLOWERC));
    }
    bloom && (M.sphere(add(chest, rot2([-8, 4, 12], lean)), 2.4, FLOWER), M.sphere(add(chest, rot2([10, 8, 11], lean)), 2, FLOWER));
    // 앞팔 (가지 + 잔가지 손가락)
    const shN = add(chest, rot2([2, -8, 12], lean));
    M.ell(shN, [7, 6, 6], MOSS, lean);
    const [, hn] = arm(M, shN, armN[0], 19, armN[1], 17, 6.5, 5, BARK);
    const ga = armN[0] + armN[1];
    for (let i = 0; i < 4; i++) M.cap(hn, add(hn, [Math.cos(ga + (i - 1.5) * 0.45) * 8, Math.sin(ga + (i - 1.5) * 0.45) * 8, (i - 1.5) * 2]), 2, 0.5, BARK);
    M.ell(add(hn, [0, 0, 2]), [5.5, 5, 5], BARK);
  },
};

// ════ [정예] 안개 쌍둥이 마녀 (언니 a = idle/move…, 동생 b_…) ════
export const mistTwins = {
  fw: 64, fh: 74, w: 16, h: 36,
  anims: { idle: [6, 6], move: [6, 8], cast: [4, 10, !1], tele: [3, 10, !1], hurt: [2, 10, !1], b_idle: [6, 6], b_move: [6, 8], b_cast: [4, 10, !1], b_tele: [3, 10, !1] },
  model(M, nm, k, n) {
    const G = 72, cx = 30;
    const young = nm.startsWith("b_"), base = young ? nm.slice(2) : nm;
    const sc = young ? 0.86 : 1;
    let bob = Math.sin((k / Math.max(1, n)) * TAU) * 1.5, armA = 1.3, lean = 0.05, fade = 1, orb = 1;
    if (base === "move") lean = 0.18;
    if (base === "cast") ((armA = [-1.0, -1.6, 0.0, 0.3][k]), (lean = [-0.1, -0.15, 0.15, 0.1][k]), (orb = k < 2 ? 1 + k * 0.6 : 0));
    if (base === "tele") fade = 1 - (k + 1) / 3.2;
    if (base === "hurt") ((lean = -0.3), (armA = 2.4));
    const s = (v) => v * sc;
    const b = [cx, G - s(16) + bob, 0];
    // 흩날리는 로브 자락 (떠 있다)
    const RB = young ? ROBEB : ROBE;
    for (let i = 0; i < 4; i++) {
      const t = i / 3;
      M.ell(add(b, [-t * 4, s(4 + t * 9) * fade, -1]), [s(9 - t * 2), s(5), s(6 - t)], RB, 0.15 + t * 0.15);
    }
    // 몸통
    const ch = add(b, rot2([0, s(-9)], lean));
    M.ell(ch, [s(6), s(9), s(5)], RB, lean);
    cape(M, add(ch, [-2, s(-6), 0]), s(26), s(9), lean, young ? mat(0x3e3048, { tex: cloth(0.7) }) : VEIL, k, -6);
    // 얼굴
    const h = add(ch, rot2([s(2), s(-12), 0], lean));
    if (young) {
      M.ell(add(h, [-1, -1, -2]), [s(6.5), s(6.5), s(5.5)], ROBEB, lean);
      M.ell(add(h, [s(1.6), s(0.5), s(3.4)]), [s(4), s(4.6), s(2)], MASK, lean);
      M.ell(add(h, [s(0.5), 0, s(5.2)]), [s(0.9), s(0.5), s(0.5)], NOSE).ell(add(h, [s(3.2), 0, s(4.6)]), [s(0.8), s(0.5), s(0.5)], NOSE);
      M.sphere(add(h, [s(0.5), 0, s(5.6)]), 0.6, POIS).sphere(add(h, [s(3.2), 0, s(5)]), 0.5, POIS);
      for (let i = 0; i < 3; i++) M.cap(add(h, [s(-3), s(-4), 0]), add(h, [s(-9 - i * 2), s(-1 + i * 4), s(-1)]), 1.4, 0.5, mat(0xd0d8e0));
    } else {
      M.ell(h, [s(4.5), s(5), s(4.4)], PALE, lean);
      M.sphere(add(h, [s(1.6), s(-0.5), s(4.2)]), 0.9, POIS).sphere(add(h, [s(3.6), s(-0.5), s(2.8)]), 0.8, POIS);
      M.ell(add(h, [s(2), s(3), s(3)]), [s(1.2), s(0.5), s(0.6)], MAW);
      // 뾰족 모자 + 베일
      M.ell(add(h, [0, s(-4), 0]), [s(10), s(1.6), s(8)], VEIL, lean);
      M.cap(add(h, [0, s(-5), 0]), add(h, [s(-6), s(-18), s(-2)]), s(5), 0.8, VEIL);
      for (let i = 0; i < 4; i++) M.cap(add(h, [s(-6 + i * 3), s(-3), s(-3)]), add(h, [s(-7 + i * 3), s(6), s(-4)]), 0.8, 0.5, VEIL);
    }
    // 팔 + 지팡이(언니) / 손거울(동생)
    const sh = add(ch, rot2([s(2), s(-5), s(5)], lean));
    const hand = add(sh, [Math.cos(armA) * s(9), Math.sin(armA) * s(9), 1]);
    M.cap(sh, hand, s(2), s(1.6), RB);
    if (!young) {
      M.cap(add(hand, [0, s(12), 0]), add(hand, [0, s(-16), 0]), 1.1, 1.1, STAFF);
      orb && (M.sphere(add(hand, [0, s(-18), 1]), 2.6 * orb, POIS), M.sphere(add(hand, [-0.6, s(-18.8), 2.4]), 1.1 * orb, POISD));
    } else {
      M.cap(hand, add(hand, [s(2), s(5), 0]), 0.8, 0.8, STAFF);
      M.ell(add(hand, [s(3), s(-2), 1]), [s(3.2), s(4), 1], mat(0xb8c8d0, { spec: 0.8, shin: 50, rim: 0.8, rimCol: 0xffffff }));
    }
  },
};

// ════ [보스] 안개뿔 엘크하른 ════
export const elkharn = {
  boss: !0, fw: 156, fh: 124, w: 52, h: 64,
  anims: { idle: [4, 5], move: [6, 9], stagger: [1, 1], lower: [1, 1], charge: [2, 12], rear: [1, 1], stomp: [1, 1], shoot: [1, 1], roar: [1, 1] },
  model(M, nm, k, n) {
    const G = 121, cx = 74;
    let bob = 0, ph = 0, tilt = 0, headA = -0.25, neckL = 1, rear = 0, crouch = 0, jaw = 0, run = 0;
    if (nm === "idle") ((bob = Math.sin((k / n) * TAU) * 1), (headA = -0.25 + Math.sin((k / n) * TAU) * 0.04));
    if (nm === "move") ((ph = (k / n) * TAU), (bob = Math.abs(Math.cos(ph)) * 2.5));
    if (nm === "stagger") ((crouch = 12), (headA = 0.6), (tilt = 0.1));
    if (nm === "lower") ((headA = 0.85), (crouch = 4), (tilt = 0.05));
    if (nm === "charge") ((ph = k * PI), (run = 1), (headA = 0.95), (tilt = 0.08), (bob = 2));
    if (nm === "rear") ((rear = 1), (tilt = -0.55), (headA = -0.6), (jaw = 0.6));
    if (nm === "stomp") ((tilt = 0.18), (crouch = 6), (headA = 0.3));
    if (nm === "shoot") ((headA = -0.75), (jaw = 0.4));
    if (nm === "roar") ((headA = -0.5), (jaw = 1), (tilt = -0.1));
    const b = [cx - 6, G - 52 - bob + crouch * 0.6 - rear * 8, 0];
    const front = add(b, rot2([20, -2], tilt)), back = add(b, rot2([-20, 0], tilt));
    // 다리 (길고 가는 사슴 다리 + 발굽)
    const leg4 = (hip, o, near, isBack) => {
      const p = ph + o;
      let ft;
      if (rear && !isBack) {
        const kn = add(hip, [8, 12, 0]);
        ft = add(kn, [6, 10 - k, 0]);
        M.cap(hip, kn, 5, 3.6, near ? ELK : ELKD).cap(kn, ft, 3.4, 2.4, near ? ELK : ELKD);
      } else {
        const sw = Math.sin(p) * (run ? 0.7 : 0.45);
        const a1 = PI / 2 - sw + (isBack ? 0.2 : -0.05);
        const a2 = isBack ? -0.7 - Math.max(0, Math.cos(p)) * 0.5 : 0.25 + Math.max(0, Math.cos(p)) * 0.7;
        const [kn, f2] = chain(hip, a1, 25, a2, 25 - crouch * 0.4);
        M.cap(hip, kn, isBack ? 9 : 7, 4.4, near ? ELK : ELKD).cap(kn, f2, 4.2, 3, near ? ELK : ELKD);
        ft = f2;
      }
      M.ell(add(ft, [1.5, 0, 0]), [3, 2.2, 2.6], HOOF);
    };
    leg4(add(front, [0, 6, -7]), PI, 0, 0);
    leg4(add(back, [0, 6, -7]), PI * 0.4, 0, 1);
    // 몸통
    M.ell(back, [17, 16, 13], ELK, tilt);
    M.ell(b, [24, 15, 13.5], ELK, tilt);
    M.ell(add(b, rot2([2, 8, 3], tilt)), [17, 5, 9], mat(0x9a8470), tilt);
    M.ell(front, [17, 17, 14], ELK, tilt - 0.1);
    // 꼬리
    M.ell(add(back, rot2([-14, -4, 0], tilt)), [4, 3, 3], mat(0xe0d8c8), tilt - 0.4);
    leg4(add(front, [1, 7, 7]), 0, 1, 0);
    leg4(add(back, [0, 7, 7]), PI * 1.4, 1, 1);
    // 목 + 안개 갈기
    const neck0 = add(front, rot2([8, -8, 1], tilt));
    const hA = tilt + headA;
    const head = add(neck0, rot2([14, -10, 2], hA * 0.6 + tilt * 0.4));
    M.cap(neck0, head, 10, 7, ELK);
    for (let i = 0; i < 7; i++) {
      const t = i / 6, p = [lerp(neck0[0], head[0], t) - 3, lerp(neck0[1], head[1], t) - 6 + Math.sin(k + i) , -2];
      M.cap(p, add(p, [-10 - t * 4, 8 + Math.sin(i + k) * 2, -2]), 5, 1, MANE);
    }
    for (let i = 0; i < 5; i++) M.cap(add(neck0, [0 + i * 3, 6, 7]), add(neck0, [-2 + i * 3, 20 + i * 2, 8]), 3.6, 0.8, MANE);
    // 머리: 긴 주둥이 + 빛나는 눈 (3/4)
    M.ell(head, [9.5, 8.5, 8], ELK, hA);
    const muz = add(head, rot2([12, 3, 2], hA));
    M.cap(add(head, rot2([3, 1, 1], hA)), muz, 5.4, 3.6, ELK);
    M.sphere(add(muz, rot2([1, -0.5, 1.5], hA)), 2.6, NOSE);
    jaw > 0 && M.cap(add(head, rot2([4, 5, 1], hA)), add(muz, rot2([-2, 3 + jaw * 4, 1], hA)), 3, 2, ELKD);
    M.sphere(add(head, rot2([4, -2.5, 6.5], hA)), 1.9, EYEC).sphere(add(head, rot2([6, -2.5, 2], hA)), 1.5, EYEC);
    M.cap(add(head, rot2([-3, -5, 5], hA)), add(head, rot2([-9, -9, 7], hA)), 2.4, 0.6, ELKD);
    // 거대한 뿔 (두 갈래, 가지 여러 개 + 늘어진 이끼)
    const antler = (z, near) => {
      const r0 = add(head, rot2([-2, -6, z], hA));
      let p = r0, a = (near ? -PI / 2 + 0.3 : -PI / 2 - 0.45) + hA * 0.25;
      const MA = near ? ANT : mat(0xc0b49c, { tex: rough(0.5, 0.5) });
      for (let i = 0; i < 5; i++) {
        a -= near ? 0.13 : 0.16;
        const q = add(p, [Math.cos(a) * 12, Math.sin(a) * 12, z * 0.15]);
        M.cap(p, q, 4.4 - i * 0.55, 3.8 - i * 0.55, MA);
        // 가지 (끝이 빛난다)
        const ta = a + (i % 2 ? 1.0 : -0.35);
        const tip = add(q, [Math.cos(ta) * (13 - i), Math.sin(ta) * (13 - i), z * 0.1]);
        M.cap(q, tip, 2.6 - i * 0.25, 0.7, MA);
        near && M.sphere(tip, 1.3, EYEC);
        // 늘어진 이끼
        M.cap(q, add(q, [1 + Math.sin(k + i), 12 + i * 2, 1]), 2, 0.6, i % 2 ? MOSSL : MOSS);
        p = q;
      }
      M.cap(p, add(p, [Math.cos(a - 0.3) * 10, Math.sin(a - 0.3) * 10, 0]), 1.8, 0.5, MA);
      near && M.sphere(add(p, [Math.cos(a - 0.3) * 10, Math.sin(a - 0.3) * 10, 0]), 1.4, EYEC);
    };
    antler(-6, 0);
    antler(6, 1);
    // 숨결 안개
    (nm === "roar" || nm === "shoot") && [0, 1, 2].forEach((i) => M.sphere(add(muz, rot2([5 + i * 4, -1 - i, 3], hA)), 3 - i * 0.6, MANE));
  },
};
