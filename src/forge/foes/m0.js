// 1지역 몬스터 3D 모델 (잿빛 마을)
import { mat, veins, rough, plates, cloth, cape, EYE, gait, leg, arm, PI, TAU, chain, add, rot2, ease, lerp, noise3 } from "./rig.js";

// ── 재질 ──
const ASH = mat(0x8c827a, { tex: veins(0.22, 0xff7a20, 0xffd070, 1.1), rim: 0.5, rimCol: 0xffb070 });
const ASHD = mat(0x6a625c, { tex: rough(0.4, 1.2) });
const BONE = mat(0xe4d8bc, { tex: rough(0.6, 0.6), spec: 0.25, shin: 14 });
const CHAR = mat(0x5a4c40, { tex: rough(0.5, 1) });
const CLAW = mat(0xf0e6d4, { spec: 0.5, shin: 24 });
const EMB = EYE(0xffa040), EMBR = EYE(0xff5a20), HOT = EYE(0xffe080);
const FUR = mat(0x8a4a2a, { tex: (u, v, w, s) => (noise3(u * 0.9 + s, v * 0.25, w * 0.9) - 0.5) * 1.6, rim: 0.6, rimCol: 0xffc080 });
const FURL = mat(0xb07048, { tex: rough(0.6, 0.8) });
const NOSE = mat(0x3a2020, { spec: 0.6 });
const RAG = mat(0x6a2a2a, { tex: cloth(0.7) });
const WOOD = mat(0x7a5232, { tex: (u, v, w, s) => Math.sin(v * 1.6 + noise3(u * 0.3, v * 0.1, w + s) * 6) * 0.5 });
const BOW = mat(0x6a3e1e, { spec: 0.2, tex: (u) => Math.sin(u * 2) * 0.3 });
const STRING = mat(0xe8e0d0, { emit: 0xe0d8c8 });
const BURLAP = mat(0xc4a46a, { tex: (u, v, w, s) => ((Math.floor(u * 0.8) + Math.floor(v * 0.8)) % 2 ? 0.35 : -0.25) + (noise3(u * 0.4, v * 0.4, s) - 0.5) });
const STRAW = mat(0xe0c060, { tex: (u, v) => Math.sin(u * 3) * 0.6 });
const HAT = mat(0x3e2e24, { tex: rough(0.5, 1) });
const FEATH = mat(0x2e2a34, { tex: (u, v, w, s) => (Math.sin(u * 1.4 + v * 0.3) > 0.6 ? -0.8 : 0.2) + (noise3(u, v, w + s) - 0.5) * 0.4, rim: 0.7, rimCol: 0xff9a50, spec: 0.3, shin: 20 });
const BEAK = mat(0xd8902e, { spec: 0.4 });
const IRON = mat(0x7a7486, { spec: 0.3, shin: 40, tex: veins(0.2, 0xff7020, 0xffd060, 0.3), rim: 0.55, rimCol: 0xffa060 });
const IRONP = mat(0x8e889a, { spec: 0.35, shin: 44, tex: plates(0.3) });
const DARKM = mat(0x2a2430, { spec: 0.3 });
const MACE = mat(0x5a5a66, { spec: 0.4, shin: 44 });
const BLADE = mat(0xc8c2d4, { spec: 0.9, shin: 40, rim: 0.3, hi: 0xffffff });
const BLADEH = mat(0xe0a060, { spec: 0.9, shin: 40, tex: (u, v) => (Math.abs(v) > 0.8 ? 1 : 0) });
const CAPE = mat(0x8a2420, { tex: cloth(0.5) });
const SHIELD = mat(0x4e4860, { spec: 0.3, shin: 40, tex: (u, v) => (Math.abs(u) > 2.4 ? 0.8 : 0) });
const ROBE = mat(0x56485a, { tex: cloth(0.4) });
const BRONZE = mat(0xb48a42, { spec: 0.8, shin: 30, rim: 0.4, tex: (u, v, w, s) => (Math.abs(noise3(u * 0.18 + s, v * 0.18, w * 0.18) - 0.5) < 0.02 ? -2 : 0) });
const CHAIN = mat(0x8a8a94, { spec: 0.7, tex: (u) => (Math.floor(u * 2) % 2 ? 0.6 : -0.6) });

// 불꽃 (빛나는 작은 덩어리들 — 프레임마다 흔들림)
function flame(M, p, h, k, s = 1) {
  for (let i = 0; i < 4; i++) {
    const t = i / 4, sw = Math.sin(k * 1.7 + i * 1.3) * 1.2 * t * s;
    M.sphere([p[0] + sw, p[1] - t * h, p[2] + 1], (3.2 - t * 2.4) * s, i < 2 ? (i === 0 ? HOT : EMB) : EMBR);
  }
}

// ════ 잿더미 좀비 ════
export const ghoul = {
  fw: 64, fh: 62, w: 16, h: 30,
  anims: { idle: [6, 6], move: [8, 9], wind: [4, 9, !1], atk: [5, 16, !1], rec: [3, 8, !1], hurt: [2, 10, !1], pile: [2, 4], rise: [5, 8, !1] },
  model(M, nm, k, n) {
    const G = 60, cx = 30;
    if (nm === "pile") {
      M.ell([cx, G - 3, 0], [13, 4, 8], ASHD).ell([cx - 4, G - 6, 2], [6, 3, 5], ASH);
      M.sphere([cx + 6, G - 5, 3], 3, ASHD);
      k && (M.sphere([cx - 2, G - 6, 6], 1.2, EMB), M.sphere([cx + 4, G - 4, 6], 1, EMB));
      return;
    }
    let bob = 0, lean = 0.55, legs = gait(0, 0.1, 0), nearA = [1.9, 0.5], farA = [1.7, 0.4], headT = 0, jaw = 0, rise = 1, tw = 0;
    if (nm === "idle") ((bob = Math.sin((k / n) * TAU) * 0.8), (nearA = [1.9 + Math.sin((k / n) * TAU) * 0.1, 0.5]), (headT = Math.sin((k / n) * TAU) * 0.08));
    if (nm === "move") {
      const ph = (k / n) * TAU;
      legs = gait(ph, 0.45, 0.8);
      bob = Math.abs(Math.cos(ph)) * 2;
      tw = Math.sin(ph) * 0.08;
      nearA = [1.75 + Math.sin(ph) * 0.35, 0.6], farA = [1.6 - Math.sin(ph) * 0.35, 0.5];
    }
    if (nm === "wind") {
      const t = ease((k + 1) / n);
      lean = lerp(0.55, -0.1, t), nearA = [lerp(1.9, -2.3, t), lerp(0.5, -1.4, t)], farA = [lerp(1.7, 2.6, t), 0.4], headT = -0.3 * t, jaw = t, bob = -t * 2;
      legs = [[PI / 2 - 0.35 * t, 0.2], [PI / 2 + 0.3 * t, -0.3 * t]];
    }
    if (nm === "atk") {
      const f = [0.2, 1, 1, 0.6, 0.2][k];
      lean = 0.55 + f * 0.5, nearA = k < 2 ? [-1.2 + k * 1.4, -0.6 + k * 0.5] : [0.6, 0.2], farA = k >= 2 ? [-0.6 + (k - 2) * 0.6, 0.3] : [2.2, 0.4];
      jaw = 1, bob = f * 2, headT = 0.2 * f;
      legs = [[PI / 2 - 0.55, 0.3], [PI / 2 + 0.4, -0.2]];
    }
    if (nm === "rec") ((lean = 0.75 - k * 0.07), (nearA = [1.2 + k * 0.25, 0.4]));
    if (nm === "hurt") ((lean = 0.1 - k * 0.1), (headT = -0.5), (nearA = [-2.6, 0.5]), (farA = [2.8, 0.2]));
    if (nm === "rise") rise = lerp(0.2, 1, ease((k + 1) / n));
    const hip = [cx - 1 + lean * 2, G - 22 * rise + bob * 0.4, 0];
    // 다리
    leg(M, add(hip, [0, 0, -4]), legs[1][0], 11, legs[1][1], 11, 3.4, 2.8, ASHD, ASHD, 3);
    leg(M, add(hip, [1, 0, 4]), legs[0][0], 11, legs[0][1], 11, 3.6, 3, ASH, ASHD, 3);
    // 몸통: 굽은 등 (골반 → 가슴)
    const chest = add(hip, rot2([0, -13], lean + tw));
    M.ell(add(hip, rot2([0, -5], lean)), [7, 7, 6], ASH, lean);
    M.ell(chest, [10, 9, 8], ASH, lean + tw);
    M.ell(add(chest, rot2([-3, -4, 0], lean)), [6, 5, 6], ASHD, lean);
    // 뒷팔
    const shF = add(chest, rot2([3, -4, -7], lean)), shN = add(chest, rot2([3, -4, 7], lean));
    const [, hf] = arm(M, shF, farA[0], 10, farA[1], 11, 3, 2.6, ASHD);
    // 머리: 앞으로 처진 채 빛나는 눈
    const head = add(chest, rot2([9, -8, 1], lean * 0.6 + headT));
    M.ell(head, [6.5, 6, 6], ASH, headT);
    M.ell(add(head, [3, 4 + jaw * 2, 0]), [4, 2.5 + jaw, 4], ASHD, 0.3);
    jaw > 0.3 && M.ell(add(head, [4, 3.5, 2]), [2, 1.2 * jaw, 2], EMBR);
    M.sphere(add(head, [3.5, -1, 4]), 1.4, EMB);
    M.sphere(add(head, [4.5, -1, -2]), 1.1, EMB);
    // 앞팔 + 발톱
    const [, hn] = arm(M, shN, nearA[0], 11, nearA[1], 12, 3.6, 3, ASH);
    const ca = nearA[0] + nearA[1];
    for (let i = -1; i <= 1; i++) M.cap(hn, add(hn, [Math.cos(ca + i * 0.35) * 5, Math.sin(ca + i * 0.35) * 5, i * 1.5]), 1.1, 0.3, CLAW);
    for (let i = -1; i <= 1; i += 2) M.cap(hf, add(hf, [Math.cos(farA[0] + farA[1] + i * 0.3) * 4, Math.sin(farA[0] + farA[1] + i * 0.3) * 4, 0]), 1, 0.3, CLAW);
  },
};

// ════ 불씨 쥐 ════
export const rat = {
  fw: 48, fh: 30, w: 16, h: 11,
  anims: { idle: [4, 8], move: [6, 16], wind: [3, 12, !1], atk: [3, 18, !1], back: [2, 10, !1], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 28, cx = 22;
    let st = 0, up = 0, lunge = 0, mouth = 0, ph = 0, tail = Math.sin(k * 1.4) * 0.4, crouch = 0;
    if (nm === "idle") up = Math.sin((k / n) * TAU) * 0.6;
    if (nm === "move") ((ph = (k / n) * TAU), (st = Math.sin(ph) * 2.5), (up = Math.abs(Math.cos(ph)) * 2));
    if (nm === "wind") ((crouch = (k + 1) * 1.2), (tail = 0.8));
    if (nm === "atk") ((lunge = [4, 7, 5][k]), (st = 3), (mouth = 1), (up = 2));
    if (nm === "back") ((lunge = -3), (up = 3));
    if (nm === "hurt") up = -1;
    const b = [cx + lunge, G - 8 - up + crouch * 0.5, 0];
    // 꼬리 + 끝 불씨
    const t1 = add(b, [-9, -1, 0]), t2 = add(t1, [-6, -4 + tail * 4, 0]), t3 = add(t2, [-4, -3 + tail * 3, 0]);
    M.cap(t1, t2, 1.6, 1.1, FURL).cap(t2, t3, 1.1, 0.8, FURL);
    flame(M, t3, 6, k, 0.7);
    // 다리
    const lp = Math.sin(ph) * 4;
    for (const [dx, z, sgn] of [[-5, -3, 1], [5, -3, -1], [-5, 3, -1], [5, 3, 1]]) M.cap(add(b, [dx, 2, z]), [b[0] + dx + lp * sgn, G - 1, z], 1.4, 1, z < 0 ? FURL : FUR);
    // 몸통 + 등의 불씨
    M.ell(b, [9 + Math.max(0, st), 5 - crouch * 0.2, 5], FUR, -0.05);
    for (let i = -4; i <= 4; i += 2) M.sphere(add(b, [i, -4.5 + Math.abs(i) * 0.15, 0]), 1.4, i % 4 ? EMB : HOT);
    // 머리
    const h = add(b, [10 + Math.max(0, st) * 0.8, -1 + crouch * 0.3, 0]);
    M.ell(h, [5, 4, 4], FUR, 0.15);
    M.ell(add(h, [4, 1, 0]), [3, 2.2, 2.5], FURL, 0.2);
    M.sphere(add(h, [7, 1, 0]), 1.1, NOSE);
    M.ell(add(h, [-2, -4, -2]), [1.6, 2.6, 1], FURL, -0.3).ell(add(h, [-1, -4, 2]), [1.8, 2.8, 1], FURL, -0.2);
    M.sphere(add(h, [2, -1, 3]), 1.1, EMBR);
    mouth && (M.ell(add(h, [5, 3, 0]), [2.5, 1.5, 2], NOSE), M.sphere(add(h, [6, 2.5, 1.5]), 0.8, CLAW));
  },
};

// ════ 그을린 해골 궁수 ════
export const archer = {
  fw: 60, fh: 64, w: 13, h: 30,
  anims: { idle: [6, 6], move: [8, 10], draw: [5, 9, !1], shoot: [3, 14, !1], hop: [4, 10, !1], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 62, cx = 26;
    let bob = 0, lean = 0.05, legs = gait(0, 0.08, 0), pull = 0, aim = 0, recoil = 0, air = 0;
    if (nm === "idle") bob = Math.sin((k / n) * TAU) * 0.6;
    if (nm === "move") ((legs = gait((k / n) * TAU, 0.4, 0.7)), (bob = Math.abs(Math.cos((k / n) * TAU)) * 1.5));
    if (nm === "draw") ((pull = ease((k + 1) / n)), (lean = -0.08 * pull), (legs = [[PI / 2 - 0.3, 0.1], [PI / 2 + 0.25, -0.1]]));
    if (nm === "shoot") ((recoil = [1, 0.5, 0][k]), (lean = -0.15 + k * 0.05), (legs = [[PI / 2 - 0.3, 0.1], [PI / 2 + 0.25, -0.1]]));
    if (nm === "hop") ((air = [3, 8, 6, 1][k]), (lean = -0.3), (legs = [[PI / 2 - 1.0, 1.6], [PI / 2 - 0.4, 1.2]]));
    if (nm === "hurt") ((lean = -0.3), (bob = 1));
    const hip = [cx, G - 21 - air + bob * 0.3, 0];
    leg(M, add(hip, [0, 0, -3]), legs[1][0], 10, legs[1][1], 10, 1.6, 1.4, BONE, BONE, 2.5);
    leg(M, add(hip, [0, 0, 3]), legs[0][0], 10, legs[0][1], 10, 1.7, 1.5, BONE, BONE, 2.5);
    // 망토 (뒤)
    const chest = add(hip, rot2([0, -11], lean));
    M.ell(add(chest, rot2([-4, 4, -5], lean)), [6, 12, 3], RAG, lean + 0.15);
    // 골반·척추·갈비
    M.ell(hip, [4, 2.5, 3.5], BONE);
    M.cap(hip, chest, 1.4, 1.4, BONE);
    for (let i = 0; i < 4; i++) M.ell(add(chest, rot2([0.5, -2 + i * 2.4, 0], lean)), [5 - i * 0.5, 1.1, 4.5 - i * 0.4], BONE, lean);
    // 두개골 + 두건
    const head = add(chest, rot2([1.5, -9, 0], lean));
    M.ell(add(head, [-3, -1.5, -4]), [7, 7, 5], RAG, -0.2);
    M.cap(add(head, [-2, -6, -2]), add(head, [-8, -10, -3]), 3, 0.8, RAG);
    M.ell(head, [5.5, 5.5, 5], BONE);
    M.ell(add(head, [2.5, 3.5, 0]), [3, 2, 3.5], BONE, 0.2);
    M.sphere(add(head, [3, -0.5, 3]), 1.8, CHAR).sphere(add(head, [3.4, -0.5, 3.6]), 1, EMBR);
    M.sphere(add(head, [3.8, -0.5, -1.5]), 1.4, CHAR);
    // 활 (앞) + 시위 + 화살
    const sh = add(chest, rot2([2, -3, 4], lean));
    const bowC = add(sh, [13 - recoil * 2, 2, 5]);
    const top = add(bowC, [-3, -13, 0]), bot = add(bowC, [-3, 13, 0]);
    M.cap(top, add(bowC, [1, -6, 0]), 1.2, 1.4, BOW).cap(add(bowC, [1, -6, 0]), add(bowC, [1, 6, 0]), 1.4, 1.4, BOW).cap(add(bowC, [1, 6, 0]), bot, 1.4, 1.2, BOW);
    const nock = add(bowC, [-3 - pull * 10, 0, 0]);
    M.cap(top, nock, 0.45, 0.45, STRING).cap(nock, bot, 0.45, 0.45, STRING);
    arm(M, sh, -0.05, 7, 0, 6, 1.4, 1.2, BONE);
    arm(M, add(sh, [0, 0, -2]), PI - 0.2 + pull * 0.2, 4 + (1 - pull) * 3, -PI + 0.4, 5, 1.4, 1.2, BONE);
    if (pull > 0.2) {
      M.cap(nock, add(nock, [17, 0, 0]), 0.6, 0.6, WOOD);
      M.sphere(add(nock, [18, 0, 0.5]), 1.6, pull > 0.8 ? HOT : EMB);
    }
  },
};

// ════ 타다 남은 허수아비 ════
export const scarecrow = {
  fw: 72, fh: 74, w: 15, h: 40,
  anims: { idle: [6, 5], wind: [4, 8, !1], atk: [4, 16, !1], rec: [3, 7, !1], spit: [3, 8, !1], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 72, cx = 34;
    let a = Math.sin((k / n) * TAU) * 0.06, raise = 0, fl = 6, lean = 0, headT = 0;
    if (nm === "wind") ((raise = ease((k + 1) / n)), (fl = 6 + raise * 8), (lean = -0.12 * raise), (headT = -0.15 * raise));
    if (nm === "atk") ((a = [-0.6, 0.6, 1.4, 1.7][k]), (fl = 12), (lean = [0.05, 0.2, 0.3, 0.25][k]), (headT = 0.15));
    if (nm === "rec") ((a = 1.3 - k * 0.4), (lean = 0.15 - k * 0.05));
    if (nm === "spit") ((headT = [-0.25, 0.2, 0.1][k]), (lean = [-0.1, 0.1, 0.05][k]));
    if (nm === "hurt") ((lean = -0.15), (a = -0.3));
    // 기둥 + 받침
    M.cap([cx, G, -2], [cx, G - 46, -2], 2, 2, WOOD);
    M.ell([cx, G - 1, 0], [8, 2, 6], WOOD);
    const sh = add([cx, G - 44, 0], rot2([0, 0], lean));
    // 팔 (가로대): 오른팔은 휘두르는 팔
    const L = 18;
    const angR = raise ? -0.2 - raise * 1.6 : a, angL = PI + a * 0.4 - lean;
    const rEnd = add(sh, [Math.cos(angR) * L, Math.sin(angR) * L, 3]), lEnd = add(sh, [Math.cos(angL) * L, Math.sin(angL) * L, -3]);
    M.cap(add(sh, [0, 0, -3]), lEnd, 2.8, 2.2, BURLAP);
    flame(M, lEnd, 7, k, 0.8);
    // 몸통: 짚을 채운 옷
    M.ell(add(sh, rot2([0, 9, 0], lean)), [8, 11, 6], BURLAP, lean);
    for (let i = -2; i <= 2; i++) M.cap(add(sh, rot2([i * 3, 18, 2], lean)), add(sh, rot2([i * 3.5, 23 + (i % 2) * 2, 2], lean)), 0.8, 0.5, STRAW);
    M.cap(add(sh, [0, 0, 3]), rEnd, 3, 2.4, BURLAP);
    flame(M, rEnd, fl, k + 1, 1.1);
    // 머리: 꿰맨 자루 + 빛나는 세모 눈 + 웃음
    const head = add(sh, rot2([1, -9, 0], lean + headT));
    M.ell(head, [7, 7.5, 6.5], BURLAP, headT);
    M.sphere(add(head, [-2, -1, 6]), 1.5, HOT).sphere(add(head, [3, -1, 5.5]), 1.5, HOT);
    for (let i = -3; i <= 3; i++) M.sphere(add(head, [i * 1.2, 3 + (i % 2 ? 0.6 : 0), 6.2]), 0.6, nm === "spit" && k === 1 ? EMB : HAT);
    // 모자 + 꼭대기 불꽃
    M.ell(add(head, [0, -6, 0]), [11, 1.6, 9], HAT, headT);
    M.cap(add(head, [0, -6, 0]), add(head, [2, -13, 0]), 5, 2.5, HAT);
    flame(M, add(head, [2, -14, 0]), 6, k + 2, 0.7);
  },
};

// ════ 재 까마귀 ════
export const crow = {
  fw: 64, fh: 48, w: 16, h: 14, flying: !0,
  anims: { idle: [6, 12], cry: [3, 8, !1], dive: [2, 10], up: [3, 10, !1], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const cx = 32, cy = 24;
    let flap = Math.sin((k / n) * TAU), tilt = 0, beak = 0, tuck = 0;
    if (nm === "cry") ((flap = 0.6), (beak = 1), (tilt = -0.15));
    if (nm === "dive") ((tuck = 1), (tilt = 0.55));
    if (nm === "up") ((flap = [-1, 0, 1][k]), (tilt = -0.3));
    if (nm === "hurt") ((flap = -0.5), (tilt = -0.4));
    const b = [cx, cy, 0];
    // 날개 하나: 어깨 → 팔꿈치 → 깃 끝, 깃털 여러 장
    const wing = (z, m, dir) => {
      const up = tuck ? 0.3 : flap;
      const sh = add(b, [1, -2, z]);
      const el = add(sh, [-7, -up * 9 - 2, z * 0.6]), tip = add(el, [-11 + tuck * 6, -up * 6 + tuck * 2, z * 0.4]);
      M.cap(sh, el, 3, 2.2, m).cap(el, tip, 2.2, 1.2, m);
      for (let i = 0; i < 5; i++) {
        const t = i / 4, base = [lerp(sh[0], tip[0], 0.3 + t * 0.7), lerp(sh[1], tip[1], 0.3 + t * 0.7), z];
        const end = add(base, [-3 - t * 2, 6 + (1 - Math.abs(up)) * 2 - tuck * 5, 0]);
        M.cap(base, end, 1.6, 0.7, m);
        i > 2 && M.sphere(end, 0.9, i % 2 ? EMB : HOT);
      }
    };
    wing(-5, FEATH, -1);
    // 꼬리 + 몸통
    M.ell(add(b, rot2([-10, 2, 0], tilt)), [6, 1.8, 4], FEATH, tilt + 0.2);
    M.ell(b, [8.5, 5.5, 5.5], FEATH, tilt);
    // 머리 + 부리
    const h = add(b, rot2([8, -3, 0], tilt));
    M.ell(h, [4.5, 4, 4], FEATH, tilt);
    M.cap(add(h, [3, 0, 0]), add(h, rot2([10, 1 + beak, 0], tilt)), 1.8, 0.4, BEAK);
    beak && M.cap(add(h, [3, 1.5, 0]), add(h, rot2([8, 4, 0], tilt)), 1.2, 0.3, BEAK);
    M.sphere(add(h, [2, -1.5, 3.5]), 1.1, EMBR);
    wing(5, FEATH, 1);
  },
};

// ════ 녹은 갑옷 ════
export const husk = {
  fw: 72, fh: 72, w: 18, h: 34,
  anims: { idle: [6, 5], move: [8, 7], wind: [4, 7, !1], slam: [4, 16, !1], rec: [3, 6, !1], charge: [3, 10, !1], dash: [2, 10], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 70, cx = 32;
    let bob = 0, lean = 0, legs = gait(0, 0.08, 0), mA = [0.9, 0.6], crouch = 0;
    if (nm === "idle") bob = Math.sin((k / n) * TAU) * 0.6;
    if (nm === "move") ((legs = gait((k / n) * TAU, 0.35, 0.55)), (bob = Math.abs(Math.cos((k / n) * TAU)) * 1.6), (lean = 0.05));
    if (nm === "wind") {
      const t = ease((k + 1) / n);
      ((mA = [lerp(0.9, -2.0, t), lerp(0.6, -0.9, t)]), (lean = -0.12 * t), (crouch = 2 * t), (legs = [[PI / 2 - 0.3, 0.2], [PI / 2 + 0.3, -0.2]]));
    }
    if (nm === "slam") ((mA = [[-0.8, -0.2], [0.6, 0.3], [0.9, 0.5], [0.95, 0.5]][k]), (lean = [0.15, 0.35, 0.4, 0.38][k]), (crouch = [0, 4, 5, 4][k]), (legs = [[PI / 2 - 0.5, 0.4], [PI / 2 + 0.4, -0.2]]));
    if (nm === "rec") ((mA = [0.9, 0.5]), (lean = 0.3 - k * 0.1), (crouch = 3 - k));
    if (nm === "charge") ((lean = 0.1 + k * 0.12), (crouch = k * 1.5), (mA = [2.4, 0.3]), (legs = [[PI / 2 - 0.4, 0.5], [PI / 2 + 0.5, -0.3]]));
    if (nm === "dash") ((lean = 0.45), (mA = [2.5, 0.3]), (legs = gait(k * PI, 0.6, 0.8)));
    if (nm === "hurt") ((lean = -0.2), (bob = 1));
    const hip = [cx, G - 24 + bob * 0.3 + crouch, 0];
    leg(M, add(hip, [-1, 0, -5]), legs[1][0], 11, legs[1][1], 12, 4.2, 3.6, IRONP, DARKM, 4);
    leg(M, add(hip, [1, 0, 5]), legs[0][0], 11, legs[0][1], 12, 4.4, 3.8, IRON, DARKM, 4);
    // 몸통: 흉갑 (상자 + 둥근 가슴)
    const chest = add(hip, rot2([0, -13], lean));
    M.ell(add(hip, rot2([0, -3], lean)), [7.5, 4.5, 6.5], IRONP, lean);
    M.ell(chest, [10, 10, 8], IRON, lean);
    M.ell(add(chest, rot2([1, -1, 5], lean)), [6.5, 7.5, 3.5], IRONP, lean);
    // 녹아 흘러내리는 쇳물
    for (let i = 0; i < 3; i++) M.cap(add(chest, rot2([-5 + i * 5, 8, 6], lean)), add(chest, rot2([-5 + i * 5, 11 + ((k + i) % 3) * 2, 6], lean)), 1, 0.7, i % 2 ? EMB : HOT);
    // 어깨받이
    M.ell(add(chest, rot2([-1, -7, -8], lean)), [6, 4.5, 5], IRONP, lean - 0.3);
    // 투구: 빈 눈구멍 속 불꽃
    const head = add(chest, rot2([1, -13, 0], lean));
    M.ell(head, [6, 6.5, 6], IRONP, lean);
    M.ell(add(head, rot2([3, 0.5, 4], lean)), [3.2, 1.4, 3.2], DARKM, lean);
    M.ell(add(head, rot2([0, -6, 0], lean)), [3, 1.5, 4], IRON, lean);
    M.sphere(add(head, rot2([4, 0.5, 6], lean)), 1.3, HOT).sphere(add(head, rot2([5.5, 0.5, 3], lean)), 1.1, EMB);
    flame(M, add(head, [0, -7, 0]), 6, k, 0.8);
    // 철퇴를 든 앞팔
    const sh = add(chest, rot2([1, -7, 8], lean));
    M.ell(sh, [6.5, 5, 5.5], IRONP, lean + 0.3);
    const [, hd] = arm(M, sh, mA[0], 10, mA[1], 10, 3.6, 3.2, IRON);
    const ang = mA[0] + mA[1], hdEnd = add(hd, [Math.cos(ang) * 12, Math.sin(ang) * 12, 0]);
    M.cap(hd, hdEnd, 1.2, 1.2, WOOD);
    M.sphere(hdEnd, 5, MACE);
    for (let i = 0; i < 6; i++) M.cap(hdEnd, add(hdEnd, [Math.cos(i * 1.05) * 7.5, Math.sin(i * 1.05) * 7.5, 0]), 1.4, 0.3, IRONP);
    (nm === "wind" && k >= 2) || (nm === "slam" && k < 2) ? M.sphere(add(hdEnd, [0, 0, 5]), 1.8, HOT) : 0;
  },
};

// ════ [정예] 잿불 파수꾼 ════
export const warden = {
  fw: 84, fh: 80, w: 22, h: 40,
  anims: { idle: [6, 5], move: [8, 8], wind: [3, 9, !1], s1: [3, 18, !1], s2: [3, 18, !1], s3: [3, 16, !1], bash: [3, 7, !1], slam: [2, 14, !1], stun: [2, 3], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 78, cx = 38;
    let bob = 0, lean = 0, legs = gait(0, 0.1, 0), sA = [-0.4, -1.0], shD = [9, 0], kneel = 0;
    if (nm === "idle") bob = Math.sin((k / n) * TAU) * 0.6;
    if (nm === "move") ((legs = gait((k / n) * TAU, 0.38, 0.6)), (bob = Math.abs(Math.cos((k / n) * TAU)) * 1.5));
    if (nm === "wind") ((sA = [lerp(-0.4, -2.4, ease((k + 1) / n)), -0.8]), (lean = -0.1));
    if (nm === "s1") ((sA = [[-2.2, -0.6], [-0.4, 0.2], [0.4, 0.3]][k]), (lean = 0.15 + k * 0.08), (legs = [[PI / 2 - 0.45, 0.3], [PI / 2 + 0.35, -0.2]]));
    if (nm === "s2") ((sA = [[0.6, 0.4], [-0.6, -0.8], [-1.6, -0.8]][k]), (lean = 0.2), (legs = [[PI / 2 - 0.45, 0.3], [PI / 2 + 0.35, -0.2]]));
    if (nm === "s3") ((sA = [[-2.6, -0.4], [-0.2, 0.3], [0.7, 0.4]][k]), (lean = 0.25 + k * 0.08), (legs = [[PI / 2 - 0.55, 0.4], [PI / 2 + 0.45, -0.2]]));
    if (nm === "bash") ((shD = [6 - k * 2, -6 - k * 5]), (lean = -0.1 - k * 0.05), (sA = [1.2, 0.4]));
    if (nm === "slam") ((shD = [13, 6]), (lean = 0.35), (kneel = 2 + k * 2), (sA = [1.4, 0.3]), (legs = [[PI / 2 - 0.6, 0.7], [PI / 2 + 0.5, -0.4]]));
    if (nm === "stun") ((kneel = 9), (lean = 0.45 + k * 0.03), (shD = [10, 9]), (sA = [1.7, 0.2]), (legs = [[PI / 2 - 1.1, 1.8], [PI / 2 + 0.2, 1.2]]));
    if (nm === "hurt") ((lean = -0.2), (bob = 1));
    const hip = [cx, G - 26 + bob * 0.3 + kneel, 0];
    // 망토
    const chest = add(hip, rot2([0, -14], lean));
    cape(M, add(chest, rot2([-3, -8, 0], lean)), 30, 10, lean, CAPE, k, -7);
    leg(M, add(hip, [-1, 0, -5]), legs[1][0], 12, legs[1][1], 12, 4.4, 3.8, IRONP, DARKM, 4.5);
    leg(M, add(hip, [1, 0, 5]), legs[0][0], 12, legs[0][1], 12, 4.6, 4, IRON, DARKM, 4.5);
    M.ell(add(hip, rot2([0, -3], lean)), [8.5, 4.5, 7.5], IRONP, lean);
    M.ell(chest, [11, 11, 9], IRON, lean);
    M.ell(add(chest, rot2([1, 0, 6], lean)), [7.5, 8.5, 3.5], IRONP, lean);
    M.ell(add(chest, rot2([-2, -8, -8], lean)), [7, 5, 5], IRONP, lean - 0.3);
    // 투구 + 붉은 볏
    const head = add(chest, rot2([1, -14, 0], lean));
    M.ell(head, [6.5, 7, 6.5], IRONP, lean);
    M.ell(add(head, rot2([3, 0.5, 4], lean)), [3.4, 1.4, 3.4], DARKM, lean);
    M.sphere(add(head, rot2([4, 0.5, 6.2], lean)), 1.3, HOT);
    for (let i = 0; i < 5; i++) M.sphere(add(head, rot2([-1 - i * 2, -7 + i * 0.8, 0], lean)), 2.6 - i * 0.3, mat(0xb02a24, { tex: cloth(0.9) }));
    // 검을 든 팔 (뒤쪽 = 오른손)
    const shB = add(chest, rot2([1, -7, -8], lean));
    const [, hd] = arm(M, shB, sA[0], 10, sA[1], 9, 3.6, 3.2, IRONP);
    const ang = sA[0] + sA[1];
    M.box(add(hd, [Math.cos(ang) * 14, Math.sin(ang) * 14, -1]), [12, 1.8, 0.8], ["s1", "s2", "s3"].includes(nm) && k > 0 ? BLADEH : BLADE, ang, 0.6);
    M.box(add(hd, [Math.cos(ang) * 2, Math.sin(ang) * 2, -1]), [1, 5, 1.5], mat(0x7a6a40, { spec: 0.6 }), ang);
    // 탑 방패 (앞) + 잿불 문장
    const shF = add(chest, rot2([2, -6, 9], lean));
    const sc = add(shF, [shD[0], 8 + shD[1], 3]);
    M.ell(shF, [7, 5, 5], IRONP, lean + 0.3);
    M.ell(sc, [3.5, 16, 10], SHIELD, lean * 0.5);
    M.ell(add(sc, [0, 13, 0]), [2.5, 5, 6], SHIELD, lean * 0.5);
    M.ell(add(sc, [2, -1, 4]), [1.5, 4, 2.5], EMB);
    M.ell(add(sc, [1, -12, 0]), [3.6, 1.2, 9], IRONP);
  },
};

// ════ [정예] 부서진 종지기 ════
export const ringer = {
  fw: 84, fh: 84, w: 24, h: 42,
  anims: { idle: [6, 5], move: [8, 7], ring: [6, 12, !1], wind: [4, 8, !1], smash: [3, 16, !1], rec: [3, 6, !1], hurt: [2, 10, !1], nidle: [4, 5], nmove: [6, 10], natk: [3, 14, !1] },
  model(M, nm, k, n) {
    const G = 82, cx = 36;
    const noBell = nm[0] === "n";
    let bob = 0, ph = 0, bell = [14, -2], sw = 0, lean = 0.35;
    if (nm.endsWith("idle")) bob = Math.sin((k / n) * TAU) * 0.8;
    if (nm.endsWith("move")) ((ph = (k / n) * TAU), (bob = Math.abs(Math.cos(ph)) * 1.6));
    if (nm === "ring") ((bell = [[16, -16], [4, -24], [-14, -18], [4, -24], [16, -16], [10, -10]][k]), (sw = [0.5, 0, -0.5, 0, 0.5, 0.2][k]), (lean = 0.2));
    if (nm === "wind") ((bell = [lerp(14, 2, ease((k + 1) / n)), lerp(-2, -44, ease((k + 1) / n))]), (lean = lerp(0.35, 0.05, ease((k + 1) / n))));
    if (nm === "smash") ((bell = [[14, -30], [22, -4], [22, 4]][k]), (lean = [0.4, 0.6, 0.6][k]));
    if (nm === "rec") ((bell = [20, 2 - k * 2]), (lean = 0.5 - k * 0.05));
    if (nm === "natk") lean = [0.3, 0.6, 0.5][k];
    if (nm === "hurt") lean = 0.1;
    const legs = nm.endsWith("move") ? gait(ph, 0.3, 0.5) : gait(0, 0.1, 0);
    const hip = [cx, G - 22 + bob * 0.3, 0];
    leg(M, add(hip, [0, 0, -4]), legs[1][0], 10, legs[1][1], 11, 3, 2.6, ROBE, CHAR, 3.5);
    leg(M, add(hip, [0, 0, 4]), legs[0][0], 10, legs[0][1], 11, 3.2, 2.8, ROBE, CHAR, 3.5);
    // 로브: 넓은 자락 + 굽은 등 + 뾰족 두건
    M.ell(add(hip, [0, 5, 0]), [11, 9, 8], ROBE, 0);
    const chest = add(hip, rot2([0, -13], lean));
    M.ell(chest, [12, 11, 9], ROBE, lean);
    M.ell(add(chest, rot2([-4, -3, 0], lean)), [8, 7, 8], ROBE, lean);
    const head = add(chest, rot2([6, -10, 0], lean));
    M.ell(head, [7.5, 7.5, 7], ROBE, lean);
    M.cap(add(head, [-2, -4, 0]), add(head, [-8, -12, 0]), 4.5, 1, ROBE);
    M.ell(add(head, [3, 1, 3]), [4, 5, 3.5], DARKM);
    M.sphere(add(head, [4.5, 0, 6]), 1.3, HOT);
    // 줄로 묶은 허리
    M.ell(add(hip, rot2([0, -3, 0], lean)), [9, 1.4, 8], mat(0x8a6a40));
    // 팔: 사슬을 쥐고
    const sh = add(chest, rot2([4, -4, 7], lean));
    if (!noBell) {
      const bc = add(hip, [bell[0], bell[1] + 4, 4]);
      const hand = add(sh, [(bc[0] - sh[0]) * 0.45, (bc[1] - 10 - sh[1]) * 0.45, 2]);
      M.cap(sh, hand, 3.4, 2.8, ROBE);
      const top = add(bc, [0, -11, 0]);
      const nl = Math.ceil(Math.hypot(top[0] - hand[0], top[1] - hand[1]) / 3);
      for (let i = 0; i <= nl; i++) M.sphere([lerp(hand[0], top[0], i / nl), lerp(hand[1], top[1], i / nl), 6], 1.1, CHAIN);
      // 종: 아래로 벌어지는 청동 (타원체 여러 겹)
      for (let i = 0; i < 6; i++) {
        const t = i / 5;
        M.ell(add(bc, rot2([0, -9 + t * 15, 0], sw)), [4.5 + 8 * Math.pow(t, 1.3), 2.6, 4.5 + 8 * Math.pow(t, 1.3)], BRONZE, sw);
      }
      M.ell(add(bc, rot2([0, 7, 0], sw)), [13.5, 2, 13.5], BRONZE, sw);
      M.sphere(add(bc, rot2([sw * 6, 10, 2], sw)), 2.4, mat(0x5a4628, { spec: 0.6 }));
    } else {
      const hand = add(sh, [9, nm === "natk" ? [0, 6, 8][k] : 6, 2]);
      M.cap(sh, hand, 3.4, 2.8, ROBE);
      M.box(add(hand, [4, 0, 0]), [5, 3, 1], BRONZE, nm === "natk" ? [-0.6, 0.5, 0.8][k] : 0.4);
    }
  },
};
