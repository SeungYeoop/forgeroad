// 7지역 「유리 사막」 3D 모델 — 화로가 떨어질 때의 열기로 모래가 유리가 된 사막. 신기루가 사람을 홀린다.
// 색: 햇빛 모래 금색 · 유리 청록 · 붉은 사암 · 바랜 뼈 · 짙은 남색 그늘
import { mat, rough, cloth, cape, EYE, gait, leg, arm, PI, TAU, chain, add, rot2, ease, lerp, noise3, hash } from "./rig.js";

const SAND = mat(0xd8b070, { tex: rough(0.5, 0.6), rim: 0.6, rimCol: 0xfff0c0 });
const SANDD = mat(0x9a7448, { tex: rough(0.5, 0.7) });
const SANDS = mat(0xe8c888, { tex: (u, v, w, s) => Math.sin(u * 0.8 + v * 0.3 + s) * 0.4 + (noise3(u * 0.6, v * 0.6, w * 0.6) - 0.5) * 0.5, rim: 0.6, rimCol: 0xfff4d0 });
const GLASS = mat(0x6ad8d0, { spec: 1, shin: 80, hi: 0xffffff, rim: 0.9, rimCol: 0xe0fff8, tex: (u, v, w) => (noise3(u * 0.3, v * 0.3, w * 0.3) - 0.5) * 0.6 });
const GLASSD = mat(0x2a8a94, { spec: 0.9, shin: 70, rim: 0.7, rimCol: 0xc0fff4 });
const GLOWT = EYE(0x8afff0), GLOWG = EYE(0xffd860), GLOWR = EYE(0xff6a4a), EYEW = EYE(0xffffff);
const CHITIN = mat(0x8a4a2a, { spec: 0.6, shin: 50, tex: (u, v) => (Math.floor(u * 0.5) % 2 ? 0.25 : -0.15), rim: 0.6, rimCol: 0xffc890 });
const CHITIND = mat(0x5a2a1a, { spec: 0.5, shin: 40 });
const WRAP = mat(0xc8a878, { tex: cloth(0.9), rim: 0.5, rimCol: 0xfff0c8 });
const WRAPR = mat(0x8a3a2a, { tex: cloth(0.8), rim: 0.5, rimCol: 0xffb080 });
const WRAPB = mat(0x3a4a6a, { tex: cloth(0.8) });
const SKIN = mat(0x8a5a3a, { tex: rough(0.5, 0.4) });
const BLADE = mat(0xd0d8e0, { spec: 0.7, shin: 60, hi: 0xffffff });
const GOLD = mat(0xd8a840, { spec: 0.8, shin: 50, rim: 0.5, rimCol: 0xfff0a0 });
const BAND = mat(0xd8ccb0, { tex: (u, v, w) => (Math.floor(v * 0.9 + u * 0.25) % 2 ? 0.3 : -0.25) + (noise3(u * 0.5, v * 0.5, w * 0.5) - 0.5) * 0.4, rim: 0.4, rimCol: 0xfff0d0 });
const BANDD = mat(0x8a7a5a, { tex: (u, v) => (Math.floor(v * 0.9) % 2 ? 0.3 : -0.25) });
const DARK = mat(0x1a1218);
const WOOD = mat(0x6a4a2a, { tex: (u, v) => Math.sin(u * 2 + v * 0.3) * 0.5 });
const ROBE = mat(0x4a3a8a, { tex: cloth(0.7), rim: 0.6, rimCol: 0xb0a0ff });
const ROBED = mat(0x2a2050, { tex: cloth(0.7) });
const STONE = mat(0xb06a4a, { tex: (u, v) => (Math.floor(v * 0.35) % 2 ? 0.2 : -0.15) + (noise3(u * 0.4, v * 0.4, 0) - 0.5) * 0.5, rim: 0.5, rimCol: 0xffd0a0 });
const WHALE = mat(0x6a5a5a, { tex: (u, v, w, s) => (noise3(u * 0.2, v * 0.2, w * 0.2 + s) - 0.5) * 0.7 + Math.sin(v * 0.4) * 0.15, spec: 0.3, shin: 30, rim: 0.6, rimCol: 0xffe0b0 });
const WHALEB = mat(0xd8c0a0, { tex: (u, v) => (Math.floor(v * 0.5) % 2 ? 0.25 : -0.2) });
const BALEEN = mat(0x3a2a22, { tex: (u) => (Math.floor(u * 1.5) % 2 ? 0.4 : -0.4) });
const GUM = mat(0x8a3a3a);

const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
function shard(M, base, ang, len, w, m = GLASS) {
  const tip = add(base, [Math.cos(ang) * len, Math.sin(ang) * len, 0]);
  M.cap(base, tip, w, 0.3, m);
  return tip;
}
// 모래 둔덕 (몸을 반쯤 묻는다)
function dune(M, cx, G, w, h, k = 0, z = 0) {
  // 낮고 매끈한 모래 둔덕: 가운데가 높고 가장자리로 갈수록 낮다
  const RIP = mat(0xdcb878, { tex: (u, v, w2) => Math.sin(u * 0.35 + v * 0.15 + k) * 0.3 + (noise3(u * 0.4, v * 0.4, w2 * 0.4) - 0.5) * 0.3, rim: 0.5, rimCol: 0xfff0c8 });
  for (let i = 0; i <= 8; i++) {
    const f = 1 - Math.abs(i - 4) / 5;
    M.ell([cx - w + (i * w) / 4, G - h * 0.15 * f, z], [w * 0.34, h * 0.6 * f + 1.5, w * 0.4], RIP, 0);
  }
}

// ════ 모래 전갈 ════ (큰 두 집게, 머리 위로 말린 꼬리, 유리 독침)
export const sandScorpion = {
  fw: 84, fh: 58, w: 26, h: 18,
  anims: { idle: [6, 6], move: [6, 14], wind: [3, 9, !1], claw: [3, 16, !1], sting: [3, 16, !1], rec: [2, 8, !1], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 56, cx = 38;
    let ph = 0, bob = 0, cl = 0.2, pinch = 0.4, tailF = 0, lean = 0;
    if (nm === "idle") ((bob = Math.sin((k / n) * TAU) * 0.5), (pinch = 0.4 + Math.sin((k / n) * TAU * 2) * 0.2));
    if (nm === "move") ((ph = (k / n) * TAU), (bob = Math.abs(Math.sin(ph * 2)) * 0.8));
    if (nm === "wind") ((cl = -0.4 * ((k + 1) / 3)), (pinch = 1), (tailF = -0.3 * ((k + 1) / 3)), (lean = -0.08));
    if (nm === "claw") ((cl = [0.6, 1, 0.8][k]), (pinch = [1, 0, 0][k]), (lean = 0.12));
    if (nm === "sting") ((tailF = [0.5, 1, 0.8][k]), (lean = 0.1));
    if (nm === "rec") ((cl = 0.3), (tailF = 0.2));
    if (nm === "hurt") ((lean = -0.15), (cl = -0.3));
    const b = [cx - 4, G - 10 - bob, 0];
    // 다리 여덟 (먼 쪽 → 가까운 쪽)
    const legs = (z, m) => {
      for (let i = 0; i < 4; i++) {
        const hip = add(b, [-8 + i * 5, 2, z * 0.5]), s = Math.sin(ph + i * 1.3 + (z < 0 ? PI : 0)) * 3;
        const kn = add(hip, [s * 0.6 + (i - 1.5) * 2, -5, z * 0.9]), ft = [hip[0] + s + (i - 1.5) * 4, G - 1, z * 1.1];
        M.cap(hip, kn, 1.6, 1.2, m).cap(kn, ft, 1.2, 0.5, m);
      }
    };
    legs(-6, CHITIND);
    // 꼬리: 마디가 등 위로 크게 말린다
    let tp = add(b, [-12, -2, 0]);
    for (let i = 0; i < 6; i++) {
      const a = PI + 0.7 + i * (0.42 - tailF * 0.14) + tailF * (i / 6) * 1.6;
      const q = add(tp, [Math.cos(a) * -5.2 * -1, Math.sin(a) * 5.2, 0]);
      M.sphere(q, 3.4 - i * 0.25, i % 2 ? CHITIN : CHITIND);
      tp = q;
    }
    // 독침: 부풀어 오른 독주머니 + 유리 바늘
    M.ell(tp, [3.4, 3, 3], CHITIN, 0);
    const sa = 0.9 + tailF * 1.2;
    shard(M, add(tp, [1.5, 1, 0]), sa, 7, 1.5, GLASS);
    M.sphere(add(tp, [0, 0, 2.6]), 1, GLOWT);
    // 몸통 (마디 진 등판)
    for (let i = 0; i < 4; i++) M.ell(add(b, [-9 + i * 5, -1.5, 0]), [4, 4.6, 7], i % 2 ? CHITIN : CHITIND, lean);
    M.ell(add(b, [9, -2, 0]), [6.5, 5.4, 7], CHITIN, lean);
    M.sphere(add(b, [14, -3, 3.5]), 1, GLOWT).sphere(add(b, [14.6, -3, 1]), 0.9, GLOWT);
    legs(6, CHITIN);
    // 집게 둘: 팔을 들어 올린 채 앞으로, 큰 집게 (먼 쪽은 높이, 가까운 쪽은 낮게)
    for (const [z, m, o, dy] of [[-6, CHITIND, 0.25, -5], [7, CHITIN, 0, 0]]) {
      const sh = add(b, [11, -1, z]);
      const el = add(sh, [3 + cl * 4, -7 - cl * 2 + dy * 0.5, z * 0.3]);
      const wr = add(el, [7 + cl * 9, 1 + dy * 0.4 + cl * 3, 0]);
      M.cap(sh, el, 2.4, 2, m).cap(el, wr, 2, 2.6, m);
      const pal = add(wr, [4.5, 0, 0]);
      M.ell(pal, [5.5, 4.4, 3.6], m, -0.2);
      const op = pinch * 0.7 + o;
      // 위 집게(움직임) · 아래 집게(고정)
      M.cap(add(pal, [3, -2, 0]), add(pal, [7, -4 - op * 5, 0]), 2, 1.6, m).cap(add(pal, [7, -4 - op * 5, 0]), add(pal, [11, -2 - op * 3, 0]), 1.6, 0.4, m);
      M.cap(add(pal, [3, 2, 0]), add(pal, [8, 3 + op, 0]), 1.8, 1.4, m).cap(add(pal, [8, 3 + op, 0]), add(pal, [11, 1.5, 0]), 1.4, 0.4, m);
    }
  },
};

// ════ 사막 약탈자 ════ (터번 · 복면 · 휘어진 언월도, 허리에 연막탄)
export const desertRaider = {
  fw: 76, fh: 66, w: 16, h: 32,
  anims: { idle: [6, 6], move: [8, 11], wind: [3, 10, !1], s1: [2, 18, !1], s2: [2, 18, !1], s3: [3, 16, !1], smoke: [3, 12, !1], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 64, cx = 30;
    let bob = 0, lean = 0.12, legs = gait(0, 0.1, 0), sw = [1.9, 0.6], crouch = 0;
    if (nm === "idle") ((bob = Math.sin((k / n) * TAU) * 0.6), (sw = [1.7, -0.4]));
    if (nm === "move") ((legs = gait((k / n) * TAU, 0.5, 0.8)), (bob = Math.abs(Math.cos((k / n) * TAU)) * 1.8), (lean = 0.25), (sw = [2.3, 0.4]));
    if (nm === "wind") ((sw = [lerp(1.7, -2.4, ease((k + 1) / 3)), -0.6]), (lean = -0.05), (crouch = 2));
    if (nm === "s1") ((sw = [[-0.8, -0.3], [0.7, 0.3]][k]), (lean = 0.3), (legs = [[PI / 2 - 0.6, 0.5], [PI / 2 + 0.4, -0.2]]));
    if (nm === "s2") ((sw = [[1.2, 0.2], [-1.2, -0.3]][k]), (lean = 0.25), (legs = [[PI / 2 - 0.5, 0.4], [PI / 2 + 0.4, -0.2]]));
    if (nm === "s3") ((sw = [[-2.2, -0.4], [0.4, 0.3], [1, 0.4]][k]), (lean = [0, 0.4, 0.45][k]), (crouch = [3, 0, 0][k]), (legs = [[PI / 2 - 0.7, 0.6], [PI / 2 + 0.5, -0.2]]));
    if (nm === "smoke") ((sw = [1.4, 0.4]), (lean = -0.1), (crouch = [0, 3, 6][k]));
    if (nm === "hurt") ((lean = -0.25), (bob = 1));
    const hip = [cx, G - 21 + bob * 0.3 + crouch, 0];
    leg(M, add(hip, [0, 0, -4]), legs[1][0], 10, legs[1][1], 11, 2.6, 2.2, WRAPB, SKIN, 3.5);
    // 허리 천 (뒤로 펄럭)
    cape(M, add(hip, [-2, -4, 0]), 14, 6, 0.4 + lean, WRAPR, k, -2);
    leg(M, add(hip, [0, 0, 4]), legs[0][0], 10, legs[0][1], 11, 2.8, 2.4, WRAPB, SKIN, 3.5);
    const chest = add(hip, rot2([0, -11], lean));
    M.ell(add(hip, rot2([0, -1], lean)), [6, 3.6, 5.5], WRAPR, lean);
    M.ell(chest, [6.5, 7.5, 5.5], WRAP, lean);
    M.cap(add(chest, rot2([-5, -5, 5], lean)), add(chest, rot2([5, 5, 5], lean)), 1.2, 1.2, WRAPR);
    // 연막탄 둘
    M.sphere(add(hip, rot2([4, -3, 6], lean)), 1.8, DARK).sphere(add(hip, rot2([0, -3, 6.4], lean)), 1.6, DARK);
    // 뒷팔
    arm(M, add(chest, rot2([0, -5, -5], lean)), 2.2 - lean, 7, 0.5, 7, 2.2, 1.8, WRAP);
    // 머리: 터번 + 복면, 눈만 보인다
    const h = add(chest, rot2([2, -10, 0], lean));
    M.ell(h, [4.8, 5, 4.8], WRAPB, lean);
    M.ell(add(h, rot2([-0.5, -3, 0], lean)), [5.6, 3.4, 5.6], WRAP, lean);
    M.cap(add(h, rot2([-4, -2, -2], lean)), add(h, rot2([-12, 4, -3], lean)), 1.6, 0.8, WRAP);
    M.ell(add(h, rot2([2.6, -0.6, 3.8], lean)), [2.4, 1, 1], SKIN, lean);
    M.sphere(add(h, rot2([2.8, -0.6, 4.4], lean)), 0.7, GLOWG).sphere(add(h, rot2([4.6, -0.6, 2.6], lean)), 0.6, GLOWG);
    // 앞팔 + 언월도 (휘어진 칼날)
    const [, hd] = arm(M, add(chest, rot2([1, -5, 5], lean)), sw[0], 7, sw[1], 7, 2.2, 1.8, WRAP);
    const ga = sw[0] + sw[1];
    let pp = add(hd, [0, 0, 1]);
    for (let i = 0; i < 5; i++) {
      const a = ga - i * 0.13;
      const q = add(pp, [Math.cos(a) * 3.6, Math.sin(a) * 3.6, 0]);
      M.cap(pp, q, 1.5 - i * 0.12 + (i === 3 ? 0.3 : 0), 1.4 - i * 0.15, BLADE);
      pp = q;
    }
    M.cap(add(hd, [-Math.cos(ga) * 2, -Math.sin(ga) * 2, 1]), add(hd, [Math.cos(ga) * 1, Math.sin(ga) * 1, 1]), 1.4, 1.4, GOLD);
  },
};

// ════ 모래 정령 ════ (회오리 몸통 · 유리 가면 · 모래 팔 둘)
export const sandSpirit = {
  fw: 64, fh: 76, w: 18, h: 36, flying: !0,
  anims: { idle: [8, 14], wind: [3, 9, !1], cast: [3, 14, !1], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const cx = 30, top = 18;
    const sp = (k / Math.max(1, n)) * TAU;
    let armUp = 0, mask = 0, spin = 1;
    if (nm === "wind") ((armUp = (k + 1) / 3), (spin = 1.6));
    if (nm === "cast") ((armUp = [1.2, 0.4, 0.1][k]), (mask = 1), (spin = 2));
    if (nm === "hurt") ((mask = -0.3), (spin = 0.6));
    // 회오리 깔때기: 한 덩어리 원뿔에 비스듬한 줄무늬가 돌아간다 + 바깥을 도는 모래 띠
    const SW = mat(0xc89a58, { tex: (u, v, w) => (Math.sin(u * 0.45 + v * 0.8 + sp * 3) > 0.2 ? 0.55 : -0.45) + (noise3(u * 0.5, v * 0.5, w * 0.5) - 0.5) * 0.3, rim: 0.7, rimCol: 0xfff0c0 });
    const sx = Math.sin(sp) * 2;
    M.cap([cx + sx, top + 10, 0], [cx + sx * 0.4, top + 30, 0], 11, 6, SW);
    M.cap([cx + sx * 0.4, top + 30, 0], [cx - sx, top + 48, 0], 6, 1.5, SW);
    for (let i = 0; i < 3; i++) {
      const t = i / 2, a = sp * spin * 2 + i * 2.1, r = 13 - t * 7;
      M.ell([cx + Math.cos(a) * 2, top + 14 + t * 24, Math.sin(a) * 2], [r, 1.2, r * 0.8], SANDS, Math.sin(a) * 0.3);
    }
    for (let i = 0; i < 6; i++) {
      const a = sp * spin * 2 + i * 1.05, y = top + 10 + i * 6.5, r = 13 - i * 1.4;
      M.sphere([cx + Math.cos(a) * r, y, Math.sin(a) * r], 1, SANDD);
    }
    // 유리 가면 (얼굴)
    const h = [cx + 2, top - 1, 0];
    M.ell(add(h, [-2, -1, -1]), [7, 7.5, 6], SANDS, 0);
    M.ell(add(h, [2, 0, 3]), [5.5, 6.5, 2.6], GLASS, mask * 0.2);
    M.ell(add(h, [2.4, -1.5, 6]), [1.6, 0.8, 0.6], DARK).ell(add(h, [5.6, -1.5, 4.6]), [1.3, 0.8, 0.6], DARK);
    M.sphere(add(h, [2.4, -1.5, 6.4]), 0.7, GLOWT).sphere(add(h, [5.6, -1.5, 5]), 0.6, GLOWT);
    M.ell(add(h, [3.4, 3, 6]), [1.6, 0.6 + mask * 0.8, 0.5], DARK);
    // 머리 위 모래 깃털 (흩날림)
    for (let i = 0; i < 3; i++) M.cap(add(h, [-5, -3 + i * 4, -2]), add(h, [-16 - i * 2, 2 + i * 5 + Math.sin(sp + i) * 2, -3]), 2.2 - i * 0.4, 0.4, i % 2 ? SAND : SANDS);
    // 모래 팔 (끝이 손톱 모양 유리)
    for (const [z, m] of [[-8, SANDD], [8, SAND]]) {
      const sh = add(h, [-1, 9, z]);
      const el = add(sh, [5 + armUp * 2, 3 - armUp * 12, z * 0.2]);
      const hd = add(el, [6, 2 - armUp * 8, 0]);
      M.cap(sh, el, 3, 2.4, m).cap(el, hd, 2.4, 1.8, m);
      for (let i = 0; i < 3; i++) shard(M, hd, -0.5 + i * 0.5 - armUp * 0.8, 4, 1, GLASS);
    }
  },
};

// ════ 붕대 미라 ════ (풀린 붕대 자락 · 한쪽 눈만 빛남 · 금 목걸이)
export const mummy = {
  fw: 72, fh: 66, w: 18, h: 34,
  anims: { idle: [6, 5], move: [8, 7], wind: [3, 8, !1], bind: [3, 14, !1], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 64, cx = 30;
    let bob = 0, lean = 0.2, legs = gait(0, 0.1, 0), aN = [0.2, 0.3], aF = [0.3, 0.2], lash = 0, sway = Math.sin((k / Math.max(1, n)) * TAU);
    if (nm === "idle") ((bob = sway * 0.6), (aN = [0.5 + sway * 0.05, 0.6]), (aF = [0.6, 0.5]));
    if (nm === "move") ((legs = gait((k / n) * TAU, 0.25, 0.3)), (bob = Math.abs(Math.cos((k / n) * TAU)) * 1), (aN = [0.05, 0.1]), (aF = [0.15, 0.1]));
    if (nm === "wind") ((aN = [lerp(0.2, -2, ease((k + 1) / 3)), -0.3]), (lean = -0.05));
    if (nm === "bind") ((aN = [[-1, 0], [-0.2, 0], [0, 0]][k]), (lash = [0.3, 1, 1][k]), (lean = 0.3));
    if (nm === "hurt") ((lean = -0.2), (bob = 1));
    const hip = [cx, G - 22 + bob * 0.3, 0];
    leg(M, add(hip, [0, 0, -4]), legs[1][0], 10, legs[1][1], 11, 3, 2.6, BANDD, BANDD, 3.5);
    leg(M, add(hip, [0, 0, 4]), legs[0][0], 10, legs[0][1], 11, 3.2, 2.8, BAND, BANDD, 3.5);
    const chest = add(hip, rot2([0, -12], lean));
    // 뒷팔 (앞으로 쭉, 좀비처럼)
    arm(M, add(chest, rot2([0, -5, -5], lean)), aF[0], 8, aF[1], 8, 2.4, 2, BANDD);
    M.ell(add(hip, rot2([0, -2], lean)), [6.5, 4, 5.5], BAND, lean);
    M.ell(chest, [7, 8.5, 6], BAND, lean);
    // 늘어진 붕대 자락들
    for (let i = 0; i < 3; i++) {
      const s = add(chest, rot2([-5 + i * 3, 4 + i * 2, -3 + i * 3], lean));
      M.cap(s, add(s, [-4 - i * 2 + sway * 1.5, 9 + i * 2, 0]), 1.2, 0.6, BAND);
    }
    // 금 목걸이 + 풍뎅이
    M.ell(add(chest, rot2([1, -5, 3], lean)), [5.5, 1.4, 4], GOLD, lean);
    M.ell(add(chest, rot2([2, -2, 5.8], lean)), [1.8, 2, 1], GLASS, lean);
    // 머리: 붕대 틈으로 한쪽 눈
    const h = add(chest, rot2([2, -11, 0], lean));
    M.ell(h, [5, 5.6, 5], BAND, lean);
    M.ell(add(h, rot2([2.6, -0.6, 3.8], lean)), [2, 1, 1], DARK, lean);
    M.sphere(add(h, rot2([2.8, -0.6, 4.4], lean)), 0.9, GLOWT);
    M.ell(add(h, rot2([4.4, 2.4, 2.6], lean)), [1.6, 0.6, 1], DARK, lean);
    M.cap(add(h, rot2([-3, -2, -3], lean)), add(h, rot2([-8, 4 + sway, -4], lean)), 1.2, 0.5, BAND);
    // 왕의 두건 (금·청 줄무늬, 어깨까지 늘어짐) + 이마의 유리 코브라
    const NEM = mat(0xd8a840, { tex: (u, v) => (Math.floor(v * 0.6) % 2 ? 0.35 : -0.35), spec: 0.6, rim: 0.5, rimCol: 0xfff0a0 });
    M.ell(add(h, rot2([-1, -2.6, 0], lean)), [5.8, 3.4, 5.8], NEM, lean);
    for (const z of [-5, 5]) M.ell(add(h, rot2([-1.5, 4, z], lean)), [2.6, 5.5, 1.6], NEM, lean + 0.1);
    M.cap(add(h, rot2([4, -4, 2], lean)), add(h, rot2([5, -7, 2], lean)), 1, 0.8, GLASS);
    M.sphere(add(h, rot2([5.4, -7.4, 2], lean)), 1.1, GLASS);
    // 앞팔 + 날아가는 붕대 (속박)
    const [, hd] = arm(M, add(chest, rot2([1, -5, 5], lean)), aN[0], 8, aN[1], 8, 2.4, 2, BAND);
    if (lash) {
      let pp = hd;
      for (let i = 0; i < 8; i++) {
        const q = add(pp, [4 * lash, Math.sin(i * 1.3 + k) * 1.4, 0]);
        M.cap(pp, q, 1.3, 1.1, BAND);
        pp = q;
      }
    }
  },
};

// ════ 유리 뱀 ════ (모래 속을 헤엄친다: 등지느러미만 보임 / 솟아올라 문다. 유리 비늘)
export const glassSerpent = {
  fw: 96, fh: 72, w: 24, h: 20,
  anims: { idle: [6, 8], swim: [6, 12], rise: [3, 12, !1], bite: [3, 16, !1], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 70, cx = 44;
    const ph = (k / Math.max(1, n)) * TAU;
    if (nm === "swim") {
      // 모래 위로 등지느러미와 등 마디만
      dune(M, cx, G, 26, 4, ph);
      for (let i = 0; i < 5; i++) {
        const x = cx - 18 + i * 9, y = G - 4 - Math.max(0, Math.sin(ph + i * 0.9)) * 3;
        M.ell([x, y, 0], [5, 3, 4], i % 2 ? GLASS : GLASSD, 0);
        shard(M, [x, y - 2, 0], -PI / 2 - 0.4, 6 + (i === 1 ? 4 : 0), 1.8, GLASS);
      }
      for (let i = 0; i < 4; i++) M.sphere([cx - 20 + hash(k, i) * 40, G - 2 - hash(i, k) * 5, 3], 1, SANDD);
      return;
    }
    let rise = 1, jaw = 0.2, headA = 0, strike = 0;
    if (nm === "idle") headA = Math.sin(ph) * 0.06;
    if (nm === "rise") ((rise = (k + 1) / 3), (jaw = 0.4 * rise));
    if (nm === "bite") ((strike = [0.3, 1, 0.7][k]), (jaw = [1, 0.2, 0.1][k]), (headA = [-0.2, 0.25, 0.15][k]));
    if (nm === "hurt") ((headA = -0.4), (jaw = 0.6));
    // 모래에서 솟은 S자 몸
    const pts = [];
    for (let i = 0; i < 9; i++) {
      const t = i / 8;
      const x = cx - 14 + t * (14 + strike * 16) + Math.sin(t * 5 + ph) * 3 * (1 - t);
      const y = G - 2 - t * 38 * rise + Math.sin(t * PI) * 4 * (1 - strike);
      pts.push([x, y, Math.cos(t * 4 + ph) * 3]);
    }
    for (let i = 0; i < 9; i++) {
      M.sphere(pts[i], 5.4 - i * 0.25, i % 2 ? GLASS : GLASSD);
      M.ell(add(pts[i], [2.4, 0, 3]), [2.2, 3.4, 1.6], mat(0xc8f0e0, { spec: 0.6 }), 0);
      i % 2 === 0 && i < 7 && shard(M, add(pts[i], [-3, -2, 0]), PI + 0.6, 6, 1.6, GLASS);
    }
    dune(M, cx - 12, G, 18, 5, ph);
    // 머리: 넓적한 머리, 유리 뿔 둘, 빛나는 눈
    const ha = headA;
    const hd = add(pts[8], rot2([6, -1, 1], ha));
    M.ell(hd, [8, 5, 6], GLASSD, ha);
    M.ell(add(hd, rot2([3, 3 + jaw * 2, 1], ha + jaw * 0.5)), [6, 1.6 + jaw, 4.4], GLASS, ha + jaw * 0.5);
    jaw > 0.4 && (M.ell(add(hd, rot2([4, 2, 2], ha + jaw * 0.25)), [4.4, jaw * 1.6, 3], GUM, ha), M.cap(add(hd, rot2([6, 0.5, 3], ha)), add(hd, rot2([6, 4, 3], ha)), 0.8, 0.2, EYEW));
    shard(M, add(hd, rot2([-3, -4, 2], ha)), -2.4 + ha, 7, 1.6, GLASS);
    shard(M, add(hd, rot2([-3, -4, -2], ha)), -2.6 + ha, 6, 1.4, GLASSD);
    M.sphere(add(hd, rot2([3, -2, 5], ha)), 1.3, GLOWG).sphere(add(hd, rot2([5.6, -2, 2], ha)), 1, GLOWG);
  },
};

// ════ 신기루 상인 ════ (거대한 짐 보따리를 진 곱사등 상인 / 가짜 보물상자 chest)
export const mirageMerchant = {
  fw: 72, fh: 66, w: 18, h: 30,
  anims: { idle: [6, 6], move: [8, 10], chest: [4, 5], open: [3, 10, !1], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 64, cx = 30;
    if (nm === "chest" || nm === "open") {
      // 보물상자: 반짝이는 금테. 열리면 안에서 눈이 번뜩인다
      const lid = nm === "open" ? [0.4, 1, 1.3][k] : Math.sin((k / 4) * TAU) * 0.04;
      const c = [cx, G - 8, 0];
      M.box(c, [11, 7, 8], WOOD, 0);
      M.box(add(c, [0, -2, 0]), [11.4, 1.2, 8.4], GOLD, 0);
      M.box(add(c, [0, 4, 0]), [11.4, 1, 8.4], GOLD, 0);
      const hinge = add(c, [-11, -7, 0]);
      const lc = add(hinge, rot2([11, -3], -lid));
      M.box(lc, [11.5, 3.5, 8.4], WOOD, -lid);
      M.box(add(hinge, rot2([11, -6.5], -lid)), [11.6, 1, 8.6], GOLD, -lid);
      M.box(add(c, [11.4, -3, 0]), [1, 2.4, 2], GOLD, 0);
      lid > 0.3 && (M.ell(add(c, [2, -7, 0]), [8, 2, 6], DARK), M.sphere(add(c, [0, -8, 3]), 1.4, GLOWR), M.sphere(add(c, [5, -8, 2]), 1.2, GLOWR));
      // 반짝임
      M.sphere(add(c, [-6 + (k % 4) * 4, -9, 8]), 0.8 + (k % 2) * 0.4, GLOWG);
      return;
    }
    let bob = 0, lean = 0.35, legs = gait(0, 0.1, 0), aN = [1.2, 0.8];
    if (nm === "idle") ((bob = Math.sin((k / n) * TAU) * 0.6), (aN = [1.2 + Math.sin((k / n) * TAU) * 0.2, 0.8]));
    if (nm === "move") ((legs = gait((k / n) * TAU, 0.5, 0.7)), (bob = Math.abs(Math.cos((k / n) * TAU)) * 1.6), (lean = 0.45));
    if (nm === "hurt") ((lean = 0.1), (bob = 1));
    const hip = [cx, G - 18 + bob * 0.3, 0];
    leg(M, add(hip, [0, 0, -4]), legs[1][0], 8, legs[1][1], 9, 2.2, 1.8, WRAPB, SKIN, 3);
    leg(M, add(hip, [0, 0, 4]), legs[0][0], 8, legs[0][1], 9, 2.4, 2, WRAPB, SKIN, 3);
    const chest = add(hip, rot2([0, -9], lean));
    // 커다란 짐 보따리 (냄비 · 양탄자 두루마리 · 등불)
    const pack = add(chest, rot2([-9, -6, -2], lean));
    M.ell(pack, [10, 12, 8], WRAP, lean - 0.2);
    M.cap(add(pack, [-6, -12, 2]), add(pack, [8, -14, 2]), 3, 3, WRAPR);
    M.sphere(add(pack, [-4, 8, 6]), 3.5, GOLD);
    M.cap(add(pack, [2, -12, -3]), add(pack, [2, -18, -3]), 0.6, 0.6, WOOD);
    M.sphere(add(pack, [2, -19, -3]), 2, GLOWG);
    // 로브 몸통
    M.ell(chest, [6.5, 7, 6], ROBE, lean);
    M.ell(add(hip, rot2([0, 1], lean)), [7, 5, 6.5], ROBE, lean);
    // 큰 코 · 웃는 입 · 금니 · 두건
    const h = add(chest, rot2([5, -7, 1], lean * 0.6));
    M.ell(h, [5, 5, 5], SKIN, 0);
    M.ell(add(h, [-1, -2.4, 0]), [5.6, 3.6, 5.6], ROBED, 0);
    M.cap(add(h, [3.5, 0, 3.5]), add(h, [7.5, 2, 3.5]), 1.6, 1, SKIN);
    M.sphere(add(h, [2.6, -0.8, 4.2]), 0.8, GLOWG);
    M.ell(add(h, [3.5, 3, 3.6]), [2, 0.6, 1], DARK);
    M.sphere(add(h, [4.4, 2.8, 3.8]), 0.5, GOLD);
    // 앞손: 반짝이는 보석을 내밀어 꼬드긴다
    const [, hd] = arm(M, add(chest, rot2([1, -4, 5], lean)), aN[0] - lean, 6, aN[1] - 1.6, 6, 2, 1.6, ROBE);
    M.box(add(hd, [2, -2, 0]), [1.8, 1.8, 1.8], GLASS, 0.785, 0.6);
  },
};

// ════ [정예] 신기루 술사 ════ (베일 쓴 술사, 떠도는 유리 프리즘 셋)
export const mirageSorcerer = {
  fw: 76, fh: 84, w: 18, h: 40,
  anims: { idle: [8, 7], move: [8, 8], cast: [3, 10, !1], snipe: [4, 12, !1], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 82, cx = 32;
    const sw = Math.sin((k / Math.max(1, n)) * TAU), orb = (k / Math.max(1, n)) * TAU;
    let float = 3 + sw, lean = 0, aN = [1.8, 0.4], aim = 0, focus = 0;
    if (nm === "move") lean = 0.12;
    if (nm === "cast") ((aN = [lerp(1.8, -1.4, ease((k + 1) / 3)), -0.2]), (focus = (k + 1) / 3));
    if (nm === "snipe") ((aN = [-0.05, 0]), (aim = 1), (focus = [0.5, 1, 1, 0.3][k]), (lean = -0.05));
    if (nm === "hurt") ((lean = -0.25), (float = 1));
    const waist = [cx, G - 32 - float, 0];
    // 로브 자락 (모래빛 안감)
    const hem = add(waist, [-4 + Math.sin(k * 0.8) * 1.5, 26, 0]);
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      M.ell(lerp3(add(waist, [0, 1, 0]), hem, t), [4.5 + t * t * 6 + t * 2, 1.6, 4 + t * t * 5 + t * 2], i > 22 ? SANDD : ROBE, 0);
    }
    for (let i = 0; i < 3; i++) M.cap(add(waist, [-1 + i * 1.5, 4, 3]), add(hem, [-5 + i * 5, 0, 8.5 - Math.abs(i - 1) * 2]), 0.6, 1.4, ROBED);
    cape(M, add(waist, [-1, -14, -3]), 36, 10, 0.4, ROBED, k, -5);
    const chest = add(waist, rot2([0, -10], lean));
    arm(M, add(chest, rot2([0, -5, -5], lean)), 1.6, 8, 0.5, 8, 2, 1.6, ROBED);
    M.ell(chest, [6, 7.5, 5], ROBE, lean);
    M.cap(add(chest, rot2([-4, -5, 4.6], lean)), add(chest, rot2([4, 5, 4.6], lean)), 1, 1, GOLD);
    // 머리: 두건 + 얼굴을 가린 베일, 이마에 유리 눈
    const h = add(chest, rot2([2, -11, 0], lean));
    M.ell(h, [5.4, 6, 5.4], ROBED, lean);
    M.cap(add(h, [-1, -4, 0]), add(h, [-6, -11, 0]), 4.4, 0.8, ROBE);
    M.ell(add(h, rot2([2, 2, 3.8], lean)), [3.8, 3.6, 1.6], mat(0xe8d8b8, { tex: cloth(1.2) }), lean);
    M.ell(add(h, rot2([2.6, -2.4, 4.4], lean)), [1.8, 1.4, 1], GLASS, lean);
    M.sphere(add(h, rot2([2.8, -2.4, 5.2], lean)), 0.9 + focus * 0.5, GLOWT);
    // 떠도는 프리즘 셋 (조준하면 앞으로 늘어선다)
    for (let i = 0; i < 3; i++) {
      const a = orb + (i * TAU) / 3;
      const p = aim ? add(chest, [12 + i * 9, -4, 4]) : add(chest, [Math.cos(a) * 15, -6 + Math.sin(a) * 7, Math.sin(a) * 8]);
      M.box(p, [2.2, 3.6, 2.2], i % 2 ? GLASSD : GLASS, aim ? 0.785 : a, 0.5);
      focus > 0.6 && M.sphere(p, 1.2, GLOWT);
    }
    const [, hd] = arm(M, add(chest, rot2([1, -5, 5], lean)), aN[0], 8, aN[1], 8, 2, 1.6, ROBE);
    focus > 0 && M.sphere(add(hd, [2, 0, 1]), 1.5 + focus * 1.5, GLOWT);
  },
};

// ════ [정예] 모래 거상 ════ (모래와 유리로 된 거인, 가슴에 사암 핵 / 흩어졌다 다시 모인다)
export const duneColossus = {
  fw: 120, fh: 110, w: 36, h: 66,
  anims: { idle: [6, 5], move: [8, 6], wind: [3, 7, !1], punch: [3, 14, !1], disperse: [4, 10, !1], form: [4, 10, !1], tsunami: [3, 9, !1], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 108, cx = 54;
    let bob = 0, ph = 0, lean = 0.08, aN = [1.5, 0.3], aF = [1.6, 0.2], spread = 0, sink = 0;
    if (nm === "idle") bob = Math.sin((k / n) * TAU) * 1;
    if (nm === "move") ((ph = (k / n) * TAU), (bob = Math.abs(Math.cos(ph)) * 2), (aN = [1.5 + Math.sin(ph) * 0.3, 0.3]), (aF = [1.6 - Math.sin(ph) * 0.3, 0.2]));
    if (nm === "wind") ((aN = [lerp(1.5, -2.2, ease((k + 1) / 3)), -0.4]), (lean = -0.12));
    if (nm === "punch") ((aN = [[-0.6, -0.1], [0.05, 0], [0.1, 0]][k]), (lean = [0.2, 0.4, 0.38][k]));
    if (nm === "disperse") spread = (k + 1) / 4;
    if (nm === "form") spread = 1 - (k + 1) / 4;
    if (nm === "tsunami") ((aN = [lerp(1.5, -1.8, (k + 1) / 3), -0.2]), (aF = [lerp(1.6, -1.6, (k + 1) / 3), -0.2]), (lean = -0.1), (sink = k * 3));
    if (nm === "hurt") lean = -0.2;
    const S = (p, i) => (spread ? add(p, [Math.cos(i * 2.3) * spread * 26, Math.sin(i * 1.7) * spread * 14 + spread * 18, Math.sin(i * 3.1) * spread * 10]) : p);
    const R = (r) => r * (1 - spread * 0.55);
    const hip = [cx - 2, G - 34 + bob * 0.4 + sink, 0];
    // 다리: 모래 기둥, 발치에 흐르는 모래
    for (const [z, m, o] of [[-10, SANDD, PI], [10, SAND, 0]]) {
      const s = Math.sin(ph + o) * 6;
      M.cap(S(add(hip, [0, 2, z]), z), S([hip[0] + s, G - 6, z], z + 1), R(9), R(8), m);
      M.ell(S([hip[0] + s + 2, G - 3, z], z + 2), [R(11), R(4), R(8)], m);
    }
    const chest = add(hip, rot2([0, -26], lean));
    // 뒷팔
    const [, hF] = arm(M, S(add(chest, rot2([-2, -12, -16], lean)), 5), aF[0], 18, aF[1], 16, R(7.5), R(7), SANDD);
    M.ell(S(hF, 6), [R(8), R(7), R(7)], SANDD);
    // 몸통: 모래 덩어리 + 박힌 유리 결정 + 사암 핵
    M.ell(S(add(hip, rot2([0, -6], lean)), 7), [R(15), R(10), R(13)], SAND, lean);
    M.ell(S(chest, 8), [R(21), R(18), R(15)], SANDS, lean);
    for (let i = 0; i < 5; i++) shard(M, S(add(chest, rot2([-14 + i * 6, -14 + Math.abs(i - 2) * 2, -4 + (i % 2) * 8], lean)), 20 + i), -PI / 2 - 0.6 + i * 0.3, R(10 + (i % 2) * 6), R(3.4), i % 2 ? GLASSD : GLASS);
    M.box(S(add(chest, rot2([4, 0, 14], lean)), 30), [R(6), R(6), R(3)], STONE, 0.785 + lean, 0.3);
    M.sphere(S(add(chest, rot2([4, 0, 17], lean)), 30), R(3), GLOWG);
    // 머리: 모래 머리 + 유리 눈 틈
    const h = add(chest, rot2([6, -21, 2], lean));
    M.ell(S(h, 31), [R(8), R(8), R(8)], SAND, lean);
    M.ell(S(add(h, rot2([4, 0, 5], lean)), 32), [R(4), R(1.2), R(3)], GLOWT, lean);
    shard(M, S(add(h, rot2([-2, -6, 0], lean)), 33), -PI / 2 - 0.3, R(10), R(3), GLASS);
    // 앞팔: 거대한 주먹
    M.ell(S(add(chest, rot2([1, -12, 16], lean)), 34), [R(9), R(8), R(8)], SAND, lean);
    const [, hN] = arm(M, S(add(chest, rot2([1, -11, 16], lean)), 35), aN[0], 18, aN[1], 16, R(8), R(7.5), SAND);
    M.ell(S(hN, 36), [R(10), R(9), R(9)], SANDS);
    shard(M, S(add(hN, [2, -6, 3]), 37), -PI / 2 + 0.4, R(7), R(2.4), GLASS);
    // 흩어질 때 모래 알갱이
    spread > 0 && [0, 1, 2, 3, 4, 5].forEach((i) => M.sphere(add(chest, [Math.cos(i * 1.1 + k) * 34 * spread, 20 * spread - i * 4, 6]), 1.6, SANDS));
  },
};

// ════ 보스 「모래 고래 사하르」 ════ (모래 바다를 헤엄치는 고래: 등에 유리 결정 숲, 수염판 입)
export const sahar = {
  boss: !0, fw: 240, fh: 150, w: 90, h: 60,
  anims: { idle: [4, 5], move: [6, 7], stagger: [1, 1], submerge: [3, 10, !1], fin: [4, 10], emerge: [3, 12, !1], pounce: [2, 10], inhale: [2, 10], exhale: [2, 12], roar: [1, 1], shard: [1, 1] },
  model(M, nm, k, n) {
    const G = 147, cx = 116;
    const ph = (k / Math.max(1, n)) * TAU;
    if (nm === "fin") {
      // 모래 속을 헤엄친다: 등 결정과 지느러미만 모래 위로
      dune(M, cx, G, 70, 7, ph);
      for (let i = 0; i < 6; i++) shard(M, [cx - 40 + i * 14, G - 6 - Math.max(0, Math.sin(ph + i)) * 4, (i % 2) * 4 - 2], -PI / 2 - 0.3 + (i % 3) * 0.2, 14 + (i % 2) * 8, 4, i % 2 ? GLASSD : GLASS);
      M.cap([cx + 30, G - 6, 0], [cx + 16, G - 30, 0], 6, 1, WHALE);
      return;
    }
    let rise = 1, tilt = 0, jaw = 0.05, puff = 0, flukeA = 0.3, air = 0;
    if (nm === "idle") ((tilt = Math.sin(ph) * 0.03), (flukeA = 0.3 + Math.sin(ph) * 0.15));
    if (nm === "move") ((tilt = Math.sin(ph) * 0.06), (flukeA = 0.3 + Math.sin(ph) * 0.4));
    if (nm === "submerge") ((rise = 1 - (k + 1) / 3), (tilt = 0.25 * ((k + 1) / 3)));
    if (nm === "emerge") ((rise = [0.4, 1.1, 1][k]), (tilt = [-0.4, -0.3, -0.1][k]), (jaw = [0.3, 1, 0.5][k]));
    if (nm === "pounce") ((air = [40, 20][k]), (tilt = [-0.35, 0.3][k]), (jaw = [1, 0.8][k]), (flukeA = [0.9, -0.3][k]));
    if (nm === "inhale") ((jaw = 1), (tilt = -0.12), (puff = (k + 1) / 2));
    if (nm === "exhale") ((jaw = 0.8), (tilt = 0.05), (puff = 0.5 - k * 0.3));
    if (nm === "roar") ((jaw = 1), (tilt = -0.25));
    if (nm === "shard") ((tilt = 0.08), (jaw = 0.3), (flukeA = 0.8));
    if (nm === "stagger") ((tilt = 0.2), (jaw = 0.5), (rise = 0.85));
    const body = [cx - 6, G - 16 - rise * 18 - air + (1 - rise) * 34, 0];
    const F = (d) => add(body, rot2(d, tilt));
    // 꼬리 줄기 + 꼬리지느러미
    let tp = F([-40, 4, 0]);
    for (let i = 0; i < 4; i++) {
      const q = add(tp, rot2([-12, -2 - flukeA * 3 * i], tilt));
      M.cap(tp, q, 22 - i * 4.5, 18 - i * 4.5, WHALE);
      tp = q;
    }
    const fl = rot2([0, -1], tilt - flukeA);
    // 꼬리지느러미: 납작한 두 갈래 (옆에서 보면 얇다)
    M.ell(add(tp, [-8, -2 - flukeA * 6, -8]), [12, 3, 10], WHALE, 0.4 - flukeA * 0.8);
    M.ell(add(tp, [-8, -2 - flukeA * 6, 8]), [12, 3, 10], WHALE, 0.4 - flukeA * 0.8);
    // 먼 가슴지느러미
    M.ell(F([10, 20, -24]), [14, 5, 6], mat(0x4a3e3e), 0.5);
    // 몸: 긴 유선형, 배는 줄무늬
    M.ell(body, [52, 26, 26], WHALE, tilt);
    M.ell(F([10, 16, 8]), [44, 10, 18], WHALEB, tilt);
    // 등의 유리 결정 숲
    for (let i = 0; i < 8; i++) {
      const p = F([-34 + i * 9, -22 + Math.abs(i - 3.5) * 1.2, -6 + (i % 3) * 6]);
      shard(M, p, -PI / 2 - 0.4 + (i % 3) * 0.3 + tilt, 18 + (i % 2) * 12 - Math.abs(i - 4) * 1.5, 5 + (i % 2), i % 2 ? GLASSD : GLASS);
    }
    shard(M, F([-6, -24, 2]), -PI / 2 - 0.1 + tilt, 36, 8, GLASS);
    // 머리: 뭉툭한 이마 + 아래로 벌어지는 큰 입 (수염판)
    const hd = F([38, -2, 0]);
    M.ell(hd, [22 + puff * 4, 22 + puff * 6, 24 + puff * 4], WHALE, tilt);
    const ja = tilt + jaw * 0.5;
    const jawP = add(hd, rot2([4, 14, 0], ja));
    M.ell(jawP, [24, 7, 22], WHALEB, ja);
    if (jaw > 0.3) {
      M.ell(add(hd, rot2([8, 10, 4], (tilt + ja) / 2)), [17, jaw * 7, 18], mat(0x3a1a1c), (tilt + ja) / 2);
      for (let i = 0; i < 7; i++) M.cap(add(hd, rot2([0 + i * 3.2, 6, 14], tilt)), add(hd, rot2([0 + i * 3.2, 6 + jaw * 7, 14], tilt)), 0.9, 0.9, BALEEN);
    }
    // 눈 (작고 오래된 눈, 유리처럼 빛남)
    M.ell(add(hd, rot2([8, 2, 20], tilt)), [3, 2, 1.6], mat(0x3a2e2e), tilt);
    M.sphere(add(hd, rot2([8.6, 2, 21.4], tilt)), 1.6, GLOWT);
    // 이마의 따개비 같은 유리 혹
    for (let i = 0; i < 3; i++) M.sphere(add(hd, rot2([-2 + i * 6, -18 + i * 2, 10 - i * 3], tilt)), 2.4, GLASS);
    // 가까운 가슴지느러미
    M.ell(F([14, 22, 26]), [16, 5.5, 6], WHALE, 0.6 + Math.sin(ph) * 0.15);
    // 몸을 감싸는 모래 (묻힌 정도)
    rise < 1.2 && !air && (dune(M, cx, G, 84, 22 + (1 - rise) * 22, ph, 16), dune(M, cx - 20, G, 70, 16, ph + 2, -14));
    // 숨을 들이켤 때 모래 소용돌이
    puff > 0 && [0, 1, 2, 3, 4].forEach((i) => M.sphere(add(hd, rot2([30 + i * 8, 10 + Math.sin(i + k) * 6, 6], tilt)), 2 + i * 0.6, SANDS));
  },
};
