// 그래스메어 몬스터 3D 모델 — 픽셀 아트 칠(cel: 4단계 명암 · 빛 쪽 가장자리 · 진한 외곽선)
// 굵은 덩어리 · 과장된 비율 · 빛나는 눈 · 재질 구분(가죽·쇠·천·털·키틴). 흙 갈색·풀 초록·햇빛 노랑 위에 강조색 하나씩.
import { mat, EYE, gait, leg, arm, PI, TAU, chain, add, rot2, ease, lerp, hash } from "./rig.js";

const CEL = { cel: 1, inner: 3, outline: 0x140c1a };
// 무늬(결 대신): 칸 무늬 반점 · 줄무늬
const spots = (k, th = 0.82, d = -1) => (u, v, w, s) => (hash(Math.floor(u * k + s), Math.floor(v * k), Math.floor(w * k)) > th ? d : 0);
const bands = (k, a = 1) => (u, v) => (Math.floor(v * k + 100) % 2 ? a : 0);
const C = (base, o = {}) => mat(base, { tones: 4, spec: 0, rim: 0, ...o });

// ── 재질 ──
const JELLY = C(0x4cc05a, { chi: 0xa8f078, clo: 0x2a8a56, cdeep: 0x175046, spec: 0.6, shin: 30, tex: spots(0.35, 0.86, -1), edge: 0.5 });
const JELLYL = C(0x7ade6a, { chi: 0xc8ff98, clo: 0x3aa65a, cdeep: 0x1e6a4c });
const LEAFH = C(0x2e8a3a, { chi: 0x6ad050, clo: 0x1e5a34, cdeep: 0x123a2c });
const WHITE = C(0xf4f4ec, { chi: 0xffffff, clo: 0xc8c8d8, cdeep: 0x8a8aa8 });
const PUPIL = C(0x1a1424, { chi: 0x3a2a4a });
const MAW = C(0x5a1830, { chi: 0x8a2a44, clo: 0x3a0c20, cdeep: 0x200818 });
const GLOSS = EYE(0xffffff);
const GEM = C(0x2ec870, { chi: 0x9affb8, clo: 0x16865a, cdeep: 0x0c4a40, spec: 0.8, shin: 20, edge: 0.6 });
const GEMH = EYE(0xd8ffe0);
const GSKIN = C(0x78b444, { chi: 0xbee070, clo: 0x4a7a3a, cdeep: 0x2a4a34 });
const GSKIND = C(0x5a8a3a, { chi: 0x8ab850, clo: 0x3a6034, cdeep: 0x22402e });
const LEATH = C(0x8a5634, { chi: 0xc08450, clo: 0x5a3426, cdeep: 0x341e1e, tex: spots(0.5, 0.9, -1) });
const LEATHD = C(0x5e3a26, { chi: 0x8a5634, clo: 0x3a2420, cdeep: 0x22141a });
const IRON = C(0x8e96a8, { chi: 0xd8e0f0, clo: 0x56607a, cdeep: 0x343a52, spec: 0.7, shin: 30, edge: 0.55 });
const IRONR = C(0x8e96a8, { chi: 0xd8e0f0, clo: 0x56607a, cdeep: 0x343a52, spec: 0.7, shin: 30, tex: spots(0.6, 0.9, 1) });
const RED = C(0xc4403a, { chi: 0xf07a50, clo: 0x82263a, cdeep: 0x4a1430 });
const BLADE = C(0xc8d0e0, { chi: 0xffffff, clo: 0x7a86a0, cdeep: 0x4a5270, spec: 0.8, shin: 20, edge: 0.7 });
const BOOT = C(0x4a2e22, { chi: 0x6e4430, clo: 0x2e1c18, cdeep: 0x1a0e12 });
const GEYE = EYE(0xffd640), TOOTH = C(0xf2ead2, { chi: 0xffffff, clo: 0xb8a888 });
const ROCK = C(0x8a8478, { chi: 0xc0b8a8, clo: 0x5a5450, cdeep: 0x3a3438 });
const WFUR = C(0x5e6478, { chi: 0x9aa2b8, clo: 0x3c4056, cdeep: 0x24263a });
const WFURD = C(0x444a5e, { chi: 0x6a7088, clo: 0x2c3044, cdeep: 0x1a1c2c });
const WRUFF = C(0xd8d4c6, { chi: 0xffffff, clo: 0xa09a9a, cdeep: 0x6a6478 });
const NOSE = C(0x1e1a24, { chi: 0x4a4458 });
const GUM = C(0x9a3a4a, { chi: 0xd06a6a, clo: 0x6a2238 });
const WEYE = EYE(0xffb630);
const CLAW = C(0xe8e0cc, { chi: 0xffffff, clo: 0xa89c88 });
const BHIDE = C(0x6a4232, { chi: 0x9a6448, clo: 0x442a26, cdeep: 0x281a1c });
const BHIDED = C(0x4a2e26, { chi: 0x6a4232, clo: 0x2e1c1c, cdeep: 0x1a1014 });
const BMANE = C(0xd0782e, { chi: 0xffb050, clo: 0x8a4424, cdeep: 0x52261e });
const SNOUT = C(0xc08a7a, { chi: 0xf0b8a0, clo: 0x8a5a54, cdeep: 0x5a3440 });
const TUSK = C(0xf2e6c4, { chi: 0xffffff, clo: 0xb8a47e, cdeep: 0x7a6a5a, edge: 0.6 });
const HOOF = C(0x2a2026, { chi: 0x4a3a40 });
const HOLE = C(0x1a0c12);
const BEYE = EYE(0xff5a2a), STAR = EYE(0xfff080);
const WY = C(0xf2bc22, { chi: 0xfff070, clo: 0xc0781e, cdeep: 0x7a3a1e, spec: 0.5, shin: 24 });
const WK = C(0x262030, { chi: 0x4a4260, clo: 0x18121e, cdeep: 0x0e0a12, spec: 0.6, shin: 20 });
const WING = C(0xcfe8f4, { chi: 0xffffff, clo: 0x8ab0cc, cdeep: 0x5a7a9a, tex: (u, v) => (Math.abs(Math.sin(u * 0.8 + v * 0.45)) < 0.12 ? -1 : 0) });
const VEYE = EYE(0xff3a3a), STING = C(0x3a2a3a, { chi: 0x8a7a9a, clo: 0x1e1622 });
const ROOT = C(0xb07a4a, { chi: 0xe0aa6a, clo: 0x7a4a34, cdeep: 0x4a2a28 });
const ROOTD = C(0x7a4e34, { chi: 0xa87050, clo: 0x4e3028, cdeep: 0x2e1a1e });
const LEAFM = C(0x46a03e, { chi: 0x9ade5a, clo: 0x2a6a3a, cdeep: 0x18402e });
const FLWR = C(0xb46ae0, { chi: 0xe8b0ff, clo: 0x7a3aa8, cdeep: 0x4a2470 });
const MEYE = EYE(0x7affd8);
const OSKIN = C(0x8a9a52, { chi: 0xc8d27a, clo: 0x5a6a42, cdeep: 0x353f34 });
const OSKIND = C(0x627242, { chi: 0x8a9a52, clo: 0x404c36, cdeep: 0x262e28 });
const OFUR = C(0x8a6440, { chi: 0xc09060, clo: 0x5a3e30, cdeep: 0x342422 });
const WOOD = C(0x8a5a34, { chi: 0xc08a50, clo: 0x5a3828, cdeep: 0x341e1e, tex: bands(0.5, -1) });
const OEYE = EYE(0xffe040);
const HORSE = C(0xa05a30, { chi: 0xe08c4c, clo: 0x6a3428, cdeep: 0x3e1e20 });
const HORSED = C(0x7a4026, { chi: 0xa05a30, clo: 0x4a2620, cdeep: 0x2a1418 });
const SOCK = C(0xece4d4, { chi: 0xffffff, clo: 0xb0a49a, cdeep: 0x7a6e78 });
const MANE = C(0x2e1c1a, { chi: 0x5a3a2e, clo: 0x1c1012 });
const HOOD = C(0x3a8a4a, { chi: 0x6ac06a, clo: 0x245a3e, cdeep: 0x15362e });
const HOODIN = C(0x10141a);
const SKIN = C(0xd8a070, { chi: 0xf8d0a0, clo: 0x9a6450, cdeep: 0x5e3a3a });
const BOWW = C(0x6a3e22, { chi: 0xa06838, clo: 0x42261c });
const STRING = EYE(0xe8e0d0), CEYE = EYE(0xa8ffe0), FLETCH = C(0xf0e8e0, { chi: 0xffffff, clo: 0xb0a8b0 });
const GOLD = C(0xe0b040, { chi: 0xfff090, clo: 0xa0702a, cdeep: 0x5a3a24, spec: 0.6, shin: 20 });

function qleg(M, hip, ph, len, w, m, foot, back, lift = 1, low = null) {
  const sw = Math.sin(ph) * 0.55;
  const a1 = PI / 2 + (back ? 0.15 : -0.1) - sw;
  const a2 = back ? -0.55 - Math.max(0, Math.cos(ph)) * 0.6 * lift : 0.35 + Math.max(0, Math.cos(ph)) * 0.6 * lift;
  const [kn, ft] = chain(hip, a1, len * 0.52, a2, len * 0.55);
  M.cap(hip, kn, w, w * 0.78, m).cap(kn, ft, w * 0.72, w * 0.6, low ?? m);
  M.ell(add(ft, [1.2, 0.4, 0]), [w * 0.85, w * 0.55, w * 0.75], foot);
  return ft;
}
const dirOf = (a, b) => {
  const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [(b[0] - a[0]) / d, (b[1] - a[1]) / d];
};
// 각진 잎·귀·털 판: 납작한 상자 (빛 받는 면이 딱 나뉜다)
const blade = (M, a, len, w, ang, m, th = 1.2) => M.box(add(a, [Math.cos(ang) * len * 0.5, Math.sin(ang) * len * 0.5, 0]), [len * 0.5, w, th], m, ang);

// ════ 풀잎 슬라임 ════ 넓적한 젤리 반구, 머리에 잎 뿔 둘, 큰 눈과 벌린 입
function slimeOf(s) {
  const fw = Math.round(68 * s), fh = Math.round(50 * s);
  return {
    fw, fh, w: Math.round(24 * s), h: Math.round(16 * s), render: CEL,
    anims: { idle: [4, 6], move: [6, 11], wind: [3, 8, !1], atk: [3, 14, !1], rec: [2, 8, !1], hurt: [2, 10, !1] },
    model(M, nm, k, n) {
      const G = fh - 3, cx = fw / 2;
      let sq = 1, lift = 0, lean = 0, mouth = 0.4;
      if (nm === "idle") sq = 1 + Math.sin((k / n) * TAU) * 0.05;
      if (nm === "move") ((sq = [0.8, 1.1, 1.18, 1.1, 0.95, 0.84][k]), (lift = [0, 5, 9, 9, 4, 0][k] * s), (lean = [0, 0.12, 0.08, 0, -0.08, 0][k]));
      if (nm === "wind") ((sq = [0.86, 0.74, 0.64][k]), (mouth = 0.6));
      if (nm === "atk") ((sq = [1.22, 1.15, 1][k]), (lift = [6, 10, 4][k] * s), (lean = [0.25, 0.2, 0][k]), (mouth = 1));
      if (nm === "rec") sq = [0.76, 0.95][k];
      if (nm === "hurt") ((sq = [0.7, 0.9][k]), (lean = -0.2), (mouth = 0.9));
      const rx = (22 * s) / Math.sqrt(sq), ry = 15 * s * sq, rz = rx * 0.7;
      const c = [cx + lean * 6 * s, G - ry * 0.82 - lift, 0];
      M.ell(c, [rx, ry, rz], JELLY, lean * 0.2);
      M.ell([c[0], c[1] + ry * 0.58, 0], [rx * 1.04, ry * 0.36, rz * 1.0], JELLY);
      M.ell([c[0] - rx * 0.9, c[1] + ry * 0.68, rz * 0.2], [rx * 0.28, ry * 0.22, rz * 0.5], JELLYL);
      const sf = (u, v, d = 0.3) => [c[0] + rx * u, c[1] + ry * v, rz * Math.sqrt(Math.max(0, 1 - u * u - v * v)) + d];
      M.ell(sf(-0.5, -0.5, 0.2), [2.4 * s, 1.6 * s, 0.6], GLOSS, -0.5);
      M.sphere(sf(-0.3, -0.72, 0.2), 1 * s, GLOSS);
      // 등에 박힌 초록 보석 결정 (각진 면)
      for (const [u, sz, ang, z] of [[-0.42, 5.4, -0.5, -1], [0.08, 4, 0.35, 2], [-0.12, 2.6, -0.1, 4]]) {
        const a = [c[0] + rx * u, c[1] - ry * 0.92 + sz * 0.3 * s, z * s];
        M.box(add(a, [0, -sz * 0.6 * s, 0]), [sz * 0.55 * s, sz * s, sz * 0.55 * s], GEM, ang, 0.785);
        M.box(add(a, [-sz * 0.12 * s, -sz * 0.75 * s, sz * 0.3 * s]), [sz * 0.22 * s, sz * 0.6 * s, 0.4], GEMH, ang, 0);
      }
      for (const [u, sc] of [[0.1, 1], [0.5, 0.86]]) {
        const e = sf(u, -0.18, 0.2);
        M.ell(e, [2.8 * s * sc, 3.4 * s * sc * Math.min(1.1, sq), 0.8], WHITE);
        M.ell(add(e, [0.8 * s, 0.5 * s, 0.6]), [1.5 * s * sc, 2.2 * s * sc, 0.6], PUPIL);
        M.sphere(add(e, [0.2 * s, -0.8 * s, 1.1]), 0.6 * s, GLOSS);
      }
      const mo = sf(0.32, 0.25, 0.2);
      M.ell(mo, [3.4 * s, (1 + mouth * 2.6) * s, 0.8], MAW);
      mouth > 0.5 && M.ell(add(mo, [0, -mouth * 1.2 * s, 0.5]), [2.6 * s, 0.7 * s, 0.4], WHITE);
    },
  };
}
export const gSlime = slimeOf(1);
export const gSlimeMini = slimeOf(0.6);

// ════ 고블린 정찰병 ════ 큰 머리 · 긴 귀 · 쇠 투구 · 붉은 목도리 · 가죽 갑옷 · 단검
export const goblin = {
  fw: 76, fh: 66, w: 16, h: 28, render: CEL,
  anims: { idle: [4, 6], move: [6, 12], wind: [3, 10, !1], atk: [3, 16, !1], rec: [2, 8, !1], hurt: [2, 10, !1], throw: [4, 12, !1], hop: [3, 10, !1] },
  model(M, nm, k, n) {
    const G = 63, cx = 32;
    let bob = 0, lean = 0.08, legs = gait(0, 0.08, 0), nA = [1.2, -0.7], fA = [1.9, 0.3], headT = 0, crouch = 0, grin = 0.4, rock = 0, scarf = 0;
    if (nm === "idle") ((bob = Math.sin((k / n) * TAU) * 0.7), (headT = Math.sin((k / n) * TAU) * 0.05), (scarf = Math.sin((k / n) * TAU)));
    if (nm === "move") {
      const ph = (k / n) * TAU;
      legs = gait(ph, 0.6, 1.1);
      bob = Math.abs(Math.cos(ph)) * 1.8;
      lean = 0.32;
      nA = [1.1 - Math.sin(ph) * 0.45, -0.5], fA = [1.8 + Math.sin(ph) * 0.45, 0.3];
      scarf = 2;
    }
    if (nm === "wind") {
      const t = ease((k + 1) / n);
      crouch = 5 * t, lean = lerp(0.08, -0.25, t), nA = [lerp(1.2, PI + 0.5, t), lerp(-0.7, 1.2, t)], fA = [lerp(1.9, 0.5, t), -0.2], grin = 1;
      legs = [[PI / 2 - 0.7 * t, 1.2 * t], [PI / 2 + 0.5 * t, 1 * t]];
    }
    if (nm === "atk") ((lean = [0.6, 0.78, 0.62][k]), (nA = [[0.3, -0.1], [0.02, 0], [0.08, 0]][k]), (fA = [2.5, 0.4]), (grin = 1), (crouch = 2), (scarf = 3), (legs = [[PI / 2 - 0.85, 0.3], [PI / 2 + 0.75, 0.2]]));
    if (nm === "rec") ((lean = 0.4 - k * 0.15), (nA = [0.8 + k * 0.3, -0.3]));
    if (nm === "hurt") ((lean = -0.35), (headT = -0.4), (nA = [-2.4, 0.4]), (fA = [2.8, 0.2]), (grin = 0.2));
    if (nm === "throw") ((rock = k < 2 ? 1 : 0), (nA = k < 2 ? [[-0.4, 1.4], [-2.4, 1.4]][k] : [[0.2, 0.1], [0.6, -0.2]][k - 2]), (lean = k < 2 ? -0.22 : 0.5), (grin = 1));
    if (nm === "hop") ((crouch = [3, -2, 0][k]), (legs = [[PI / 2 - 1, 1.7], [PI / 2 - 0.2, 1.5]]), (lean = -0.2), (bob = [0, 3, 1][k]));
    const hip = [cx + lean * 2, G - 12.5 + crouch + bob * 0.4, 0];
    leg(M, add(hip, [0, 0, -3.4]), legs[1][0], 6, legs[1][1], 6, 3.4, 3, GSKIND, BOOT, 3.8);
    const ch = add(hip, rot2([0, -9], lean));
    const fs = add(ch, rot2([-1, -4, -5], lean));
    const [, fh] = arm(M, fs, fA[0], 6, fA[1], 5.5, 2.2, 1.8, GSKIND);
    M.sphere(fh, 2.1, GSKIND);
    M.ell(add(hip, rot2([0, -3], lean)), [6, 5, 5], LEATHD, lean);
    M.ell(ch, [7.6, 7.4, 6.4], LEATH, lean);
    M.box(add(ch, rot2([1.6, -0.5, 4.6], lean)), [3.2, 4.2, 1], LEATHD, lean);
    M.cap(add(hip, rot2([-6, -2.4, 4.4], lean)), add(hip, rot2([6, -2.4, 4.6], lean)), 1.1, 1.1, LEATHD);
    M.sphere(add(hip, rot2([2.6, -2.4, 5.6], lean)), 1.2, GOLD);
    M.ell(add(hip, rot2([-4.6, 0.6, 4.4], lean)), [2.2, 2.6, 1.8], LEATH, lean);
    const ha = lean * 0.45 + headT, hd = add(ch, rot2([3.4, -12 + headT * 4, 1], lean * 0.6));
    // 먼 귀 (어둡게, 뒤로 뾰족)
    M.cap(add(hd, rot2([-4, -1, -4.6], ha)), add(hd, rot2([-15, -6, -5.4], ha)), 3, 0.5, GSKIND);
    // 머리 (크게) + 볼 · 턱
    M.ell(hd, [9.2, 8.4, 8], GSKIN, ha);
    M.ell(add(hd, rot2([2, 4.4, 2.4], ha)), [7, 3.6, 6.2], GSKIN, ha);
    // 가까운 귀 (크고 뾰족, 안쪽 분홍)
    M.cap(add(hd, rot2([-4, -1, 6], ha)), add(hd, rot2([-17, -7.4, 7.4], ha)), 3.4, 0.5, GSKIN);
    M.cap(add(hd, rot2([-6, -1.6, 7.6], ha)), add(hd, rot2([-14, -5.6, 8.4], ha)), 1.4, 0.3, GSKIND);
    // 코 (갈고리) · 눈두덩 · 빛나는 눈 · 이빨 웃음
    M.cap(add(hd, rot2([6, -0.4, 5], ha)), add(hd, rot2([11.4, 3, 5.4], ha)), 2.4, 1, GSKIN);
    M.box(add(hd, rot2([4.2, -3, 7.2], ha)), [4.4, 1, 0.8], GSKIND, ha + 0.2);
    M.ell(add(hd, rot2([3.6, -1.2, 7.6], ha)), [2, 1.5, 0.6], GEYE, ha);
    M.ell(add(hd, rot2([8.4, -1.2, 4.6], ha)), [1.5, 1.3, 0.6], GEYE, ha);
    M.box(add(hd, rot2([4.6, 4.2, 7.2], ha)), [4, 0.7 + grin * 0.9, 0.6], MAW, ha);
    for (const dx of [2.2, 4.6, 7]) M.box(add(hd, rot2([dx, 3.4, 7.8], ha)), [0.6, 1, 0.4], TOOTH, ha);
    // 작은 쇠 투구 (윗머리만, 리벳 줄) + 뾰족 끝
    M.ell(add(hd, rot2([-1.4, -5.6, 0], ha)), [8.4, 4, 8], IRONR, ha - 0.1);
    M.box(add(hd, rot2([0.4, -3.4, 0.6], ha)), [8.4, 0.9, 7.6], IRON, ha - 0.06);
    M.cap(add(hd, rot2([-2, -9.4, 0], ha)), add(hd, rot2([-3.4, -14, 0], ha - 0.3)), 1.4, 0.3, IRON);
    M.ell(add(ch, rot2([1, -6.4, 0.6], lean)), [6, 2.6, 6], RED, lean);
    M.box(add(ch, rot2([-7 - scarf, -5 + Math.sin(k * 1.7) * 0.8, -1], lean)), [4.4, 1.8, 0.8], RED, lean + 0.25 + scarf * 0.05);
    leg(M, add(hip, [0.6, 0, 3.6]), legs[0][0], 6, legs[0][1], 6, 3.6, 3.2, GSKIN, BOOT, 4);
    const ns = add(ch, rot2([1, -4.6, 5.4], lean));
    M.ell(add(ns, [0, 0.4, 0.6]), [3.6, 3, 3.4], IRON, lean);
    const [el, hn] = arm(M, ns, nA[0], 6, nA[1], 5.6, 2.8, 2.4, GSKIN);
    M.cap(add(el, [0, 0, 0.6]), add(hn, [0, 0, 0.6]), 2.8, 2.6, LEATHD);
    M.sphere(hn, 2.6, GSKIN);
    if (rock) M.sphere(add(hn, [0.6, -2, 1.2]), 3, ROCK);
    else if (nm !== "throw") {
      const d = dirOf(el, hn), ang = Math.atan2(d[1], d[0]);
      M.box(add(hn, [d[0] * 7.5, d[1] * 7.5, 1]), [6.4, 1.4, 0.6], BLADE, ang);
      M.box(add(hn, [d[0] * 1.6, d[1] * 1.6, 1.1]), [0.8, 2.6, 0.8], GOLD, ang);
    }
  },
};

// ════ 초원 회색늑대 ════ 푸른 잿빛 털, 하얀 목 갈기, 빛나는 호박색 눈, 길쭉한 주둥이와 큰 귀
export const plainsWolf = {
  fw: 96, fh: 62, w: 26, h: 18, render: CEL,
  anims: { idle: [6, 6], move: [6, 15], wind: [3, 9, !1], atk: [3, 14, !1], rec: [2, 8, !1], hurt: [2, 10, !1], howl: [4, 6, !1] },
  model(M, nm, k, n) {
    const G = 59, cx = 46;
    let bob = 0, ph = 0, stretch = 0, tilt = 0, crouch = 0, jaw = 0.1, headT = 0, tail = Math.sin((k / Math.max(1, n)) * TAU) * 0.25, legsUp = 0;
    if (nm === "idle") bob = Math.sin((k / n) * TAU) * 0.7;
    if (nm === "move") ((ph = (k / n) * TAU), (stretch = Math.sin(ph) * 4), (bob = Math.abs(Math.cos(ph)) * 3), (tilt = Math.sin(ph) * 0.07), (tail = -0.25));
    if (nm === "wind") ((crouch = (k + 1) * 2.8), (headT = 0.3), (jaw = 0.4), (tail = -0.5));
    if (nm === "atk") ((tilt = [-0.35, -0.2, 0.12][k]), (stretch = [8, 9, 3][k]), (jaw = [1, 1, 0.3][k]), (legsUp = [1, 1, 0.3][k]), (bob = [8, 6, 1][k]), (headT = -0.1));
    if (nm === "rec") ((crouch = 2 - k), (jaw = 0.3));
    if (nm === "hurt") ((tilt = 0.2), (headT = -0.4), (jaw = 0.7));
    if (nm === "howl") ((headT = [-0.5, -1, -1.1, -0.6][k]), (jaw = [0.3, 0.9, 1, 0.5][k]), (tilt = -0.12), (tail = 0.3));
    const b = [cx, G - 22 - bob + crouch * 0.6, 0];
    const front = add(b, rot2([13 + stretch * 0.5, -1], tilt)), rear = add(b, rot2([-13 - stretch * 0.5, 0], tilt));
    const t0 = add(rear, rot2([-7, -3, 0], tilt)), t1 = add(t0, [-9, -2 + tail * 7, -1]), t2 = add(t1, [-7, 1 + tail * 9, -1]);
    M.cap(t0, t1, 3.6, 5.2, WFURD).cap(t1, t2, 5.2, 2.4, WFUR);
    M.ell(t2, [3.6, 2.6, 2.6], WRUFF, -0.4);
    if (legsUp) {
      qleg(M, add(front, [0, 4, -5]), 0, 18, 3, WFURD, WFURD, !1, 0);
      M.cap(add(rear, [0, 4, -5]), add(rear, [-11 * legsUp, 11, -5]), 3.6, 2.4, WFURD);
    } else {
      qleg(M, add(front, [0, 4, -5]), ph + PI, 18 - crouch * 0.5, 3, WFURD, WFURD, !1);
      qleg(M, add(rear, [0, 4, -5]), ph + PI * 0.4, 19 - crouch * 0.5, 3.8, WFURD, WFURD, !0);
    }
    M.ell(rear, [9.6, 8.4, 7.6], WFUR, tilt);
    M.ell(b, [13, 6.6, 7], WFUR, tilt);
    M.ell(add(b, rot2([3, 5, 2], tilt)), [10, 2.6, 5.4], WRUFF, tilt);
    M.ell(front, [10.4, 10, 8.6], WFUR, tilt - 0.1);
    // 등: 짙은 털 안장 + 뒤로 눕는 뾰족한 털 다발
    M.ell(add(b, rot2([-2, -4, 0], tilt)), [13, 3.6, 6.4], WFURD, tilt);
    for (let i = 0; i < 7; i++) {
      const p = add(b, rot2([-18 + i * 5.2, -6.4 - Math.sin((i / 6) * PI) * 1.6, i % 2 ? 2 : -2], tilt));
      M.cap(p, add(p, rot2([-6, -3.6 - (i % 2) * 1.4, 0], tilt)), 2.6, 0.3, i % 3 === 1 ? WFUR : WFURD);
    }
    for (let i = 0; i < 4; i++) M.ell(add(front, rot2([3 - i * 2.4, 1 + i * 1.6, 3 - i], tilt)), [5.2, 6.6 - i * 0.6, 5], WRUFF, tilt + 0.4);
    if (legsUp) {
      M.cap(add(front, [1, 5, 5]), add(front, [14 * legsUp, 8, 5]), 3.4, 2.4, WFUR).ell(add(front, [15 * legsUp + 1, 8.5, 5]), [3, 1.8, 2.4], WFURD);
      for (let i = 0; i < 3; i++) M.cap(add(front, [15 * legsUp + 3, 8 + i * 0.8, 4 + i]), add(front, [15 * legsUp + 6, 9 + i, 4 + i]), 0.6, 0.2, CLAW);
      M.cap(add(rear, [0, 5, 5]), add(rear, [-12 * legsUp, 12, 5]), 4, 2.6, WFUR);
    } else {
      qleg(M, add(front, [1, 5, 5]), ph, 18 - crouch * 0.5, 3.3, WFUR, WFURD, !1);
      qleg(M, add(rear, [0, 5, 5]), ph + PI * 1.4, 19 - crouch * 0.5, 4.1, WFUR, WFURD, !0);
    }
    const neck = add(front, rot2([7, -6, 1], tilt));
    const ha = tilt + headT, head = add(neck, rot2([7, -2 + headT * 6, 2], ha));
    M.cap(front, neck, 7, 6, WFUR);
    M.ell(head, [8, 6.8, 7], WFUR, ha);
    M.ell(add(head, rot2([2.6, 3, 4], ha)), [5, 3, 3.4], WRUFF, ha);
    const sn = add(head, rot2([11.5, 1.6, 1.6], ha));
    M.cap(add(head, rot2([3.6, 0.4, 1.2], ha)), sn, 4.4, 2.6, WFUR);
    M.cap(add(head, rot2([4, 2, 3], ha)), add(sn, rot2([-1, 1.6, 1.6], ha)), 2.8, 1.8, WRUFF);
    M.box(add(head, rot2([7.4, -1.6, 1.4], ha)), [4.6, 1, 3], WFURD, ha + 0.12);
    M.sphere(add(sn, [1, -0.5, 0.8]), 1.8, NOSE);
    const jawE = add(head, rot2([10, 4.6 + jaw * 3, 1.6], ha + jaw * 0.35));
    M.cap(add(head, rot2([2.4, 3.4, 1.2], ha)), jawE, 2.6, 1.6, WFURD);
    if (jaw > 0.5) {
      M.ell(add(head, rot2([7, 3.8, 3.4], ha)), [3.6, 1.4 * jaw, 2.2], GUM, ha);
      M.cap(add(sn, rot2([-1.4, 1.6, 2.2], ha)), add(sn, rot2([-1.4, 4.2, 2.2], ha)), 0.8, 0.2, CLAW);
      M.cap(add(jawE, rot2([-1.4, -1, 2.2], ha)), add(jawE, rot2([-1.4, -3.6, 2.2], ha)), 0.8, 0.2, CLAW);
    }
    M.cap(add(head, rot2([-1.6, -4, -2.6], ha)), add(head, rot2([-4.6, -13, -3], ha)), 3, 0.3, WFURD);
    M.cap(add(head, rot2([-0.6, -4, 3.6], ha)), add(head, rot2([-3.4, -14, 4.4], ha)), 3.4, 0.3, WFUR);
    M.cap(add(head, rot2([-1, -5.6, 5.6], ha)), add(head, rot2([-3, -11, 6], ha)), 1.4, 0.3, GUM);
    M.ell(add(head, rot2([4.6, -1.6, 6.2], ha)), [2, 1.1, 0.6], WEYE, ha - 0.25);
    M.ell(add(head, rot2([7.2, -1.6, 2.4], ha)), [1.4, 1, 0.6], WEYE, ha - 0.25);
  },
};

// ════ 뿔멧돼지 ════ 거대한 어깨 혹 · 주황 갈기 · 휘어 오른 상아 엄니 · 빛나는 붉은 눈
export const tuskBoar = {
  fw: 100, fh: 66, w: 32, h: 26, render: CEL,
  anims: { idle: [4, 5], move: [6, 10], scrape: [4, 10, !1], charge: [4, 16], stun: [4, 6], hurt: [2, 10, !1], rec: [2, 8, !1] },
  model(M, nm, k, n) {
    const G = 63, cx = 44;
    let bob = 0, ph = 0, tilt = 0, headD = 0, paw = 0, stretch = 0, dizzy = 0;
    if (nm === "idle") bob = Math.sin((k / n) * TAU) * 0.7;
    if (nm === "move") ((ph = (k / n) * TAU), (bob = Math.abs(Math.cos(ph)) * 1.8));
    if (nm === "scrape") ((paw = [0.2, 1, 0.3, 1][k]), (headD = 1), (tilt = 0.08));
    if (nm === "charge") ((ph = (k / n) * TAU), (bob = Math.abs(Math.cos(ph)) * 3.4), (headD = 1.4), (stretch = 3 + Math.sin(ph) * 2), (tilt = 0.12));
    if (nm === "stun") ((dizzy = 1), (headD = 0.8), (tilt = Math.sin((k / n) * TAU) * 0.06), (bob = 1));
    if (nm === "hurt") ((tilt = -0.15), (headD = -0.4));
    if (nm === "rec") headD = 0.6 - k * 0.3;
    const b = [cx, G - 23 - bob, 0];
    const front = add(b, rot2([13 + stretch * 0.4, -2], tilt)), rear = add(b, rot2([-14, 0], tilt));
    const L = nm === "charge" ? 1.4 : 1;
    if (nm === "scrape") {
      qleg(M, add(front, [0, 7, -5]), PI, 13, 3.6, BHIDED, HOOF, !1);
      qleg(M, add(rear, [0, 6, -5]), PI * 1.4, 14, 4.4, BHIDED, HOOF, !0);
    } else {
      qleg(M, add(front, [0, 7, -5]), ph + PI, 13, 3.6, BHIDED, HOOF, !1, L);
      qleg(M, add(rear, [0, 6, -5]), ph + PI * 0.4, 14, 4.4, BHIDED, HOOF, !0, L);
    }
    const tA = add(rear, rot2([-10, -4, 0], tilt));
    M.cap(tA, add(tA, [-5, 1, 0]), 1.3, 1, BHIDED).ell(add(tA, [-6, -1, 0]), [1.8, 2.4, 1.4], BMANE);
    M.ell(rear, [12, 11, 10], BHIDE, tilt);
    M.ell(b, [16, 12, 11], BHIDE, tilt);
    M.ell(add(front, rot2([-3, -6], tilt)), [13, 12, 11], BHIDE, tilt + 0.2);
    M.ell(add(b, rot2([0, 8, 4], tilt)), [14, 3.4, 7], BHIDED, tilt);
    // 등 갈기: 주황 털 다발이 뒤로 뻗친다 (가운데가 가장 높다)
    for (let i = 0; i < 11; i++) {
      const u = i / 10, p = add(b, rot2([-17 + i * 3.6, -9.6 - Math.sin(u * PI) * 6.6, i % 2 ? 2.4 : -2.4], tilt));
      M.cap(p, add(p, rot2([-5 - Math.sin(u * PI) * 3, -5 - Math.sin(u * PI) * 5, 0], tilt)), 2.4, 0.3, i % 3 === 0 ? BHIDED : BMANE);
    }
    M.ell(add(b, rot2([-2, -7, 0], tilt)), [15, 4, 8], BHIDED, tilt);
    if (nm === "scrape") {
      M.cap(add(front, [1, 8, 5]), add(front, [-7 * paw + 2, 16, 5]), 3.8, 2.8, BHIDE).ell(add(front, [-7 * paw + 3, 16.5, 5]), [3, 1.8, 2.6], HOOF);
      qleg(M, add(rear, [0, 7, 5]), PI * 0.2, 14, 4.6, BHIDE, HOOF, !0);
    } else {
      qleg(M, add(front, [1, 8, 5]), ph, 13, 3.8, BHIDE, HOOF, !1, L);
      qleg(M, add(rear, [0, 7, 5]), ph + PI * 1.4, 14, 4.6, BHIDE, HOOF, !0, L);
    }
    const ha = tilt + headD * 0.35, head = add(front, rot2([10, 3 + headD * 3.5, 2], tilt));
    M.ell(head, [9.4, 8.4, 8], BHIDE, ha);
    M.box(add(head, rot2([2, -3.6, 4], ha)), [5.6, 1.4, 4.2], BHIDED, ha + 0.18);
    const sn = add(head, rot2([9.5, 2.6, 1.6], ha));
    M.cap(add(head, rot2([3.4, 1, 1.2], ha)), sn, 5.4, 4.2, BHIDE);
    M.ell(add(sn, rot2([1.8, 0, 1.2], ha)), [1.8, 3.8, 3.8], SNOUT, ha);
    M.sphere(add(sn, rot2([3, -1, 3.2], ha)), 0.9, HOLE);
    M.sphere(add(sn, rot2([3, 1.2, 3.2], ha)), 0.9, HOLE);
    for (const z of [5.4, -2.2]) {
      const a = add(sn, rot2([-2.6, 3.6, z], ha)), bq = add(a, rot2([5, -1.6, 0.8], ha)), c = add(bq, rot2([3, -8, 0.8], ha - 0.3));
      M.cap(a, bq, 2.4, 2, TUSK).cap(bq, c, 2, 0.4, TUSK);
    }
    blade(M, add(head, rot2([-3, -6, 5], ha)), 6, 2.2, -PI / 2 - 0.7 + ha, BHIDED, 1.6);
    blade(M, add(head, rot2([-3, -6, -3], ha)), 6, 2, -PI / 2 - 0.7 + ha, BHIDED, 1.4);
    M.ell(add(head, rot2([3.6, -2, 6.6], ha)), [1.6, 1.2, 0.6], BEYE, ha);
    if (dizzy) for (let i = 0; i < 3; i++) {
      const a = (k / n) * TAU + (i / 3) * TAU;
      M.sphere(add(head, [Math.cos(a) * 8, -14 + Math.sin(a) * 1.5, Math.sin(a) * 7]), 1.6, STAR);
    }
  },
};

// ════ 거대 말벌 ════ 각진 키틴 마디 · 빛나는 붉은 겹눈 · 독침 · 맥이 비치는 날개
export const giantWasp = {
  fw: 68, fh: 60, w: 18, h: 16, flying: !0, render: CEL,
  anims: { idle: [4, 20], wind: [3, 10, !1], atk: [3, 16, !1], rec: [2, 10, !1], hurt: [2, 12, !1] },
  model(M, nm, k, n) {
    const cx = 34, cy = 28;
    let curl = 0, pitch = 0, flap = k % 2, lunge = 0;
    if (nm === "wind") ((curl = (k + 1) / n), (pitch = -0.15 * curl));
    if (nm === "atk") ((curl = 1), (pitch = 0.35), (lunge = [5, 7, 3][k]));
    if (nm === "rec") ((curl = 0.5 - k * 0.25), (pitch = 0.1));
    if (nm === "hurt") ((pitch = -0.35), (curl = 0.2));
    const th = [cx + lunge, cy, 0];
    const wingA = flap ? -0.95 : -0.2;
    M.ell(add(th, rot2([-4, -9, -4], pitch)), [12, 3.6, 1], WING, pitch + wingA + 0.3);
    const ab = [];
    for (let i = 0; i < 4; i++) {
      const a = pitch + 0.35 + curl * (0.5 + i * 0.45);
      const prev = ab[i - 1] ?? add(th, rot2([-5, 1], pitch));
      ab.push(add(prev, [-Math.cos(a) * (i ? 5 : 4), Math.sin(a) * (i ? 5 : 4), 0]));
    }
    ab.forEach((p, i) => M.ell(p, [6 - i * 0.7, 5.4 - i * 0.8, 5.2 - i * 0.6], i % 2 ? WK : WY, pitch + curl * i * 0.4));
    const tipA = pitch + 0.35 + curl * 2.1, tip = ab[3], sting = add(tip, [-Math.cos(tipA) * 7, Math.sin(tipA) * 7, 0]);
    M.cap(tip, sting, 1.6, 0.2, STING);
    for (let i = 0; i < 3; i++) {
      const hp = add(th, [1.5 - i * 2.6, 4, i % 2 ? 2.6 : -2.6]);
      const kn = add(hp, [2.6 + i, 5, 0]), ft = add(kn, [-1 + i * 0.6, 5, 0]);
      M.cap(hp, kn, 1, 0.8, WK).cap(kn, ft, 0.8, 0.5, WY);
    }
    M.sphere(th, 5.8, WK);
    M.ell(add(th, [-1, -1.6, 4.4]), [3.4, 2.6, 1], WY, 0.2);
    const hd = add(th, rot2([7, -0.4, 1.6], pitch));
    M.sphere(hd, 4.4, WY);
    M.ell(add(hd, [1.4, -1.2, 3.2]), [2.6, 3.4, 1.4], VEYE, 0.2);
    M.ell(add(hd, [3, -1.2, -1.6]), [1.8, 2.6, 1], VEYE, 0.2);
    M.box(add(hd, [4, 2.6, 2]), [2.2, 0.8, 0.8], WK, 0.6);
    M.box(add(hd, [4, 2.6, -0.6]), [2.2, 0.8, 0.8], WK, 0.6);
    M.cap(add(hd, [1, -3.6, 1.4]), add(hd, [4.4, -8.6, 2]), 0.6, 0.4, WK).cap(add(hd, [4.4, -8.6, 2]), add(hd, [8.4, -9.6, 2]), 0.4, 0.3, WK);
    M.cap(add(hd, [0, -3.6, -1]), add(hd, [2.4, -8.6, -1.6]), 0.5, 0.3, WK);
    M.ell(add(th, rot2([-5, -8, 5], pitch)), [14, 4.2, 1], WING, pitch + wingA);
  },
};

// ════ 맨드레이크 ════ 나무뿌리 몸에 새긴 얼굴 · 빛나는 청록 눈 · 큰 잎 왕관 (숨으면 잎 무더기만)
export const mandrake = {
  fw: 60, fh: 64, w: 16, h: 22, render: CEL,
  anims: { hide: [2, 3], rise: [4, 12, !1], idle: [4, 8], move: [6, 12], scream: [4, 12, !1], burrow: [4, 12, !1], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 61, cx = 28;
    let pop = 1, arms = 0.2, mouth = 0.3, shake = 0, legsPh = -1, lean = 0;
    if (nm === "hide") pop = 0;
    if (nm === "rise") pop = ease((k + 1) / n);
    if (nm === "burrow") pop = 1 - ease((k + 1) / n);
    if (nm === "idle") ((shake = Math.sin((k / n) * TAU) * 0.6), (arms = 0.3 + Math.sin((k / n) * TAU) * 0.15));
    if (nm === "move") ((legsPh = (k / n) * TAU), (lean = 0.15), (shake = Math.sin(legsPh * 2) * 0.5));
    if (nm === "scream") ((mouth = [0.6, 1, 1, 0.8][k]), (arms = [0.6, 1.2, 1.3, 1][k]), (shake = [0, 1, -1, 0.6][k]));
    if (nm === "hurt") ((mouth = 0.8), (lean = -0.3), (arms = -0.3));
    const sway = Math.sin(k * 1.7) * 0.15, bodyH = 14 * pop;
    const top = [cx + shake + lean * 4, G - 5 - bodyH * 1.7, 0];
    for (let i = 0; i < 5; i++) {
      const a = -PI / 2 + (i - 2) * 0.45 + sway, len = i === 2 ? 14 : 11;
      const base = pop < 0.05 ? [cx, G - 1, 0] : add(top, [0, 1.5, 0]);
      blade(M, add(base, [0, 0, i % 2 ? 2 : -2]), len, 2.8 - Math.abs(i - 2) * 0.3, a, i % 2 ? LEAFM : LEAFH, 1.6);
    }
    if (pop < 0.05) {
      M.ell([cx, G, 0], [10, 2, 5], ROOTD);
      return;
    }
    pop > 0.6 && (M.sphere(add(top, [2, -10, 2]), 2.4, FLWR), M.sphere(add(top, [2, -10, 3.4]), 1, GOLD));
    const c = [cx + shake + lean * 2, G - 5 - bodyH, 0];
    M.ell(c, [8, bodyH, 6.6], ROOT, lean);
    M.ell(add(c, [-2, bodyH * 0.45, -2]), [5.4, bodyH * 0.45, 4], ROOTD, lean);
    for (let i = 0; i < 4; i++) M.box(add(c, [-4 + i * 2.6, -bodyH * 0.2 + (i % 2) * 4, 6]), [0.5, bodyH * 0.35, 0.5], ROOTD, 0.1 * (i - 1.5));
    for (let i = 0; i < 3; i++) {
      const sw = legsPh >= 0 ? Math.sin(legsPh + i * 2.1) * 3 : 0;
      const a = add(c, [-3 + i * 3, bodyH * 0.85, i === 1 ? 2 : -1]);
      M.cap(a, [a[0] + (i - 1) * 3 + sw, G - 0.5, a[2]], 1.8, 0.5, ROOTD);
    }
    for (const [z, m, d] of [[-3.6, ROOTD, -1], [4, ROOT, 1]]) {
      const sh = add(c, [d * 6, -bodyH * 0.15, z]);
      const el = add(sh, [d * 4, -arms * 6 + 1, 0]), hd = add(el, [d * 3, -arms * 5 - 0.5, 0]);
      M.cap(sh, el, 1.8, 1.3, m).cap(el, hd, 1.3, 0.5, m);
    }
    const fz = (u, v) => 6.6 * Math.sqrt(Math.max(0, 1 - u * u - v * v)) + 0.3;
    const fp = (dx, dy) => [c[0] + dx, c[1] + dy, fz(dx / 8, dy / bodyH)];
    M.ell(fp(0.6, -bodyH * 0.45), [1.8, 1.6, 0.6], HOLE).ell(fp(4.8, -bodyH * 0.45), [1.5, 1.5, 0.6], HOLE);
    M.ell(add(fp(0.8, -bodyH * 0.45), [0, 0, 0.3]), [0.9, 0.9, 0.4], MEYE).ell(add(fp(4.9, -bodyH * 0.45), [0, 0, 0.3]), [0.8, 0.8, 0.4], MEYE);
    M.box(add(fp(2.6, -bodyH * 0.62), [0, 0, 0.4]), [3.4, 0.7, 0.5], ROOTD, 0.1);
    M.ell(fp(2.6, -bodyH * 0.1 + mouth * 1.4), [2 + mouth * 1.4, 1 + mouth * 3, 0.6], HOLE);
  },
};

// ════ [정예] 초원 오우거 ════ 산 같은 어깨 · 쇠 어깨판 · 털 두르개 · 쇠테 두른 거대 몽둥이 · 작은 머리에 빛나는 눈
export const meadowOgre = {
  fw: 150, fh: 150, w: 40, h: 64, render: CEL,
  anims: { idle: [4, 5], move: [8, 8], wind: [4, 7, !1], atk: [3, 14, !1], rec: [3, 7, !1], hurt: [2, 10, !1], stomp: [4, 10, !1], roar: [4, 8, !1] },
  model(M, nm, k, n) {
    const G = 147, cx = 62;
    let bob = 0, legs = gait(0, 0.08, 0), nA = [1.5, -0.5], fA = [1.7, 0.4], lean = 0.05, headT = 0, jaw = 0.2, breath = 0, lift = 0;
    if (nm === "idle") ((breath = Math.sin((k / n) * TAU)), (bob = breath * 0.9));
    if (nm === "move") {
      const ph = (k / n) * TAU;
      legs = gait(ph, 0.42, 0.9);
      bob = Math.abs(Math.cos(ph)) * 3;
      nA = [1.45 - Math.sin(ph) * 0.2, -0.45], fA = [1.75 + Math.sin(ph) * 0.25, 0.4];
      lean = 0.12;
    }
    if (nm === "wind") {
      const t = ease((k + 1) / n);
      nA = [lerp(1.45, -1.9, t), lerp(-0.5, -0.9, t)], lean = lerp(0.05, -0.25, t), headT = -0.2 * t, jaw = 0.6, bob = -t * 2;
      legs = [[PI / 2 - 0.3 * t, 0.2], [PI / 2 + 0.35 * t, 0.3 * t]];
    }
    if (nm === "atk") ((nA = [[-0.6, -0.5], [0.55, 0.2], [0.85, 0.35]][k]), (lean = [0.2, 0.45, 0.5][k]), (jaw = 1), (bob = [0, 3, 4][k]), (legs = [[PI / 2 - 0.55, 0.5], [PI / 2 + 0.45, 0.2]]));
    if (nm === "rec") ((nA = [0.85 - k * 0.2, 0.3 - k * 0.2]), (lean = 0.45 - k * 0.12), (bob = 3 - k));
    if (nm === "hurt") ((lean = -0.25), (headT = -0.4), (jaw = 0.8));
    if (nm === "stomp") ((lift = [0.5, 1, 0, 0][k]), (lean = [-0.05, -0.1, 0.15, 0.1][k]), (fA = [1.2, 0.2]), (jaw = 0.8), (bob = k === 2 ? 3 : 0));
    if (nm === "roar") ((headT = [-0.3, -0.5, -0.5, -0.2][k]), (jaw = [0.6, 1.2, 1.2, 0.6][k]), (nA = [[-0.3, 0.2], [-0.6, 0.3], [-0.6, 0.3], [0.2, 0]][k]), (fA = [[2.6, 0.2], [3, 0.2], [3, 0.2], [2.2, 0.3]][k]), (lean = -0.15));
    const hip = [cx + lean * 3, G - 33 + bob * 0.4, 0];
    leg(M, add(hip, [-3, 0, -8]), legs[1][0], 15, legs[1][1], 15, 8, 6.8, OSKIND, BOOT, 7.6);
    const ch = add(hip, rot2([3, -32], lean)), fs = add(ch, rot2([-5, -8, -12], lean));
    const [, fh] = arm(M, fs, fA[0], 16, fA[1], 15, 6.8, 6, OSKIND);
    M.sphere(fh, 5.6, OSKIND);
    M.ell(add(hip, rot2([3, -16, 1], lean)), [20, 19, 16], OSKIN, lean);
    M.ell(ch, [19, 14, 16], OSKIN, lean);
    M.ell(add(ch, rot2([8, 6, 10], lean)), [7, 5, 4], OSKIND, lean - 0.3);
    M.ell(add(hip, rot2([2, -2, 0], lean)), [19, 7, 16], OFUR, lean);
    for (let i = 0; i < 6; i++) blade(M, add(hip, rot2([-14 + i * 5.6, 3, 14], lean)), 9 + (i % 2) * 3, 2.6, PI / 2 + (i - 2.5) * 0.08 + lean, i % 2 ? OFUR : LEATHD, 1.6);
    M.cap(add(ch, rot2([-13, -8, 13], lean)), add(ch, rot2([10, 18, 15], lean)), 2.2, 2.2, LEATHD);
    M.cap(add(hip, rot2([-17, -7, 13], lean)), add(hip, rot2([17, -8, 13], lean)), 2.4, 2.4, LEATHD);
    M.box(add(hip, rot2([3, -7.6, 15.4], lean)), [3.4, 3.2, 1], GOLD, lean);
    const nl = lift ? [PI / 2 - 1.1 * lift, 1.6 * lift] : legs[0];
    leg(M, add(hip, [4, 0, 8]), nl[0], 15, nl[1], 15, 8.6, 7.2, OSKIN, BOOT, 8);
    const ha = lean * 0.5 + headT, hd = add(ch, rot2([13, -16 + headT * 4, 5], lean * 0.5));
    M.ell(add(hd, rot2([-2, 6, 0], ha)), [7.4, 6, 7.4], OSKIN, ha);
    M.ell(hd, [9, 8.4, 8.4], OSKIN, ha);
    M.box(add(hd, rot2([3.6, -3.4, 5.6], ha)), [6.4, 1.6, 3], OSKIND, ha + 0.12);
    const jw = add(hd, rot2([4.6, 5 + jaw * 2.4, 3.6], ha + jaw * 0.15));
    M.ell(jw, [6.4, 3.2, 6.2], OSKIN, ha);
    jaw > 0.5 && M.box(add(hd, rot2([6, 3.4 + jaw, 6.6], ha)), [4.2, jaw * 1.6, 0.8], MAW, ha);
    M.cap(add(jw, rot2([1, -1.4, 5.8], ha)), add(jw, rot2([2, -7, 6.2], ha)), 1.6, 0.4, TUSK);
    M.cap(add(jw, rot2([5, -1.4, 3.6], ha)), add(jw, rot2([5.8, -6, 3.8], ha)), 1.3, 0.3, TUSK);
    M.cap(add(hd, rot2([6.6, -1.2, 6], ha)), add(hd, rot2([9.6, 1.4, 6.4], ha)), 2, 1.4, OSKIN);
    M.ell(add(hd, rot2([3.6, -1.6, 8.2], ha)), [1.6, 1.1, 0.6], OEYE, ha - 0.2);
    M.ell(add(hd, rot2([7.6, -1.6, 4.2], ha)), [1.3, 1, 0.6], OEYE, ha - 0.2);
    M.cap(add(hd, rot2([-3, -7.6, 0], ha)), add(hd, rot2([-9, -13, -1], ha - 0.4)), 2.6, 1, MANE);
    M.sphere(add(hd, rot2([-3, -7.6, 0], ha)), 2.2, GOLD);
    const ns = add(ch, rot2([2, -8, 13], lean));
    const [el, hn] = arm(M, ns, nA[0], 16, nA[1], 15, 7.6, 6.6, OSKIN);
    M.ell(add(ns, [-1, -1.4, 2]), [9.6, 7, 8.4], IRON, lean - 0.2);
    M.box(add(ns, [-1, 3.6, 4.4]), [8, 1.4, 4], IRONR, lean - 0.2);
    for (const dx of [-5, 0, 5]) M.cap(add(ns, [dx - 1, -6, 3]), add(ns, [dx - 1.6, -11, 3]), 1.4, 0.3, IRON);
    const d = dirOf(el, hn), Lc = 44, off = [-d[1], d[0]];
    M.cap(add(hn, [-d[0] * 5, -d[1] * 5, 1.4]), add(hn, [d[0] * Lc, d[1] * Lc, 1.4]), 3.2, 8.4, WOOD);
    for (const t of [0.45, 0.72, 0.95]) M.cap(add(hn, [d[0] * Lc * t - d[0] * 1.5, d[1] * Lc * t - d[1] * 1.5, 1.4]), add(hn, [d[0] * Lc * t + d[0] * 1.5, d[1] * Lc * t + d[1] * 1.5, 1.4]), 3.6 + t * 5.6, 3.6 + t * 5.6, IRON);
    for (let i = 0; i < 4; i++) {
      const t = 0.56 + i * 0.12, p = add(hn, [d[0] * Lc * t, d[1] * Lc * t, 1.4]), r = 4 + t * 5;
      for (const sg of [1, -1]) M.cap(add(p, [off[0] * r * sg, off[1] * r * sg, 2]), add(p, [off[0] * (r + 4) * sg, off[1] * (r + 4) * sg, 2.6]), 1.4, 0.2, IRON);
    }
    M.sphere(hn, 6, OSKIN);
  },
};

// ════ [정예] 켄타우로스 사냥꾼 ════ 초록 두건 아래 빛나는 눈 · 적갈색 말 몸에 가죽 가슴받이 · 금장식 · 긴 활
export const centaur = {
  fw: 134, fh: 116, w: 36, h: 56, render: CEL,
  anims: { idle: [6, 6], move: [8, 15], aim: [3, 8, !1], shoot: [3, 14, !1], rear: [4, 10, !1], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 113, cx = 64;
    let bob = 0, ph = 0, tilt = 0, draw = 0, bowUp = 0.15, rear = 0, tailS = Math.sin((k / Math.max(1, n)) * TAU), hairS = 0, headT = 0;
    if (nm === "idle") bob = Math.sin((k / n) * TAU) * 0.9;
    if (nm === "move") ((ph = (k / n) * TAU), (bob = Math.abs(Math.cos(ph)) * 3.6), (tilt = Math.sin(ph) * 0.05), (hairS = 1));
    if (nm === "aim") ((draw = (k + 1) / n), (bowUp = 0.05));
    if (nm === "shoot") bowUp = [0.02, 0.05, 0.1][k];
    if (nm === "rear") ((rear = [0.5, 1, 1, 0.3][k]), (tilt = -0.42 * rear));
    if (nm === "hurt") ((tilt = -0.12), (headT = -0.35));
    const b = [cx - 8, G - 40 - bob, 0];
    const chest = add(b, rot2([20, -1], tilt)), hind = add(b, rot2([-20, 0], tilt));
    if (rear) {
      qleg(M, add(hind, [0, 8, -6]), PI * 0.2, 34, 5.8, HORSED, HOOF, !0, 1, SOCK);
      const kn = add(chest, rot2([5, 11, -6], tilt)), ft = add(kn, rot2([10 * rear, -7 * rear + 7, 0], tilt));
      M.cap(add(chest, [0, 8, -6]), kn, 4.2, 3.2, HORSED).cap(kn, ft, 3, 2.4, SOCK).ell(add(ft, [1, 0, 0]), [3.2, 2.2, 2.6], HOOF);
    } else {
      qleg(M, add(chest, [0, 8, -6]), ph + PI, 34, 5.4, HORSED, HOOF, !1, 1.2, SOCK);
      qleg(M, add(hind, [0, 8, -6]), ph + PI * 0.55, 34, 5.8, HORSED, HOOF, !0, 1.2, SOCK);
    }
    const t0 = add(hind, rot2([-11, -5], tilt));
    for (let i = 0; i < 4; i++) M.cap(add(t0, [0, 0, i * 1.2 - 2]), add(t0, [-10 - i * 1.4, 15 + tailS * 2.6 + i * 2, i * 1.2 - 2]), 2.8, 1.2, MANE);
    M.ell(hind, [13, 12.6, 11], HORSE, tilt);
    M.ell(b, [21, 11, 11], HORSE, tilt);
    M.ell(chest, [11, 12.6, 10.6], HORSE, tilt);
    M.ell(add(b, rot2([0, 7.6, 4], tilt)), [17, 3.4, 7], HORSED, tilt);
    M.ell(add(chest, rot2([3, 1, 4], tilt)), [9, 10, 8.6], LEATH, tilt);
    M.sphere(add(chest, rot2([6, 0, 12], tilt)), 2.2, GOLD);
    M.cap(add(b, rot2([8, -11, 11], tilt)), add(b, rot2([8, 10, 11.6], tilt)), 1.8, 1.8, LEATHD);
    const qv = add(hind, rot2([5, -13, 6], tilt));
    M.cap(qv, add(qv, rot2([-9, -7, 0], tilt)), 2.8, 3.2, LEATHD);
    for (let i = 0; i < 3; i++) M.cap(add(qv, rot2([-9 + i * 0.8, -7 - i * 0.6, i - 1], tilt)), add(qv, rot2([-12 + i * 0.8, -10 - i * 0.6, i - 1], tilt)), 1.2, 0.4, FLETCH);
    if (rear) {
      qleg(M, add(hind, [0, 8, 6]), PI * 1.6, 34, 6.4, HORSE, HOOF, !0, 1, SOCK);
      const kn = add(chest, rot2([7, 10, 6], tilt)), ft = add(kn, rot2([12 * rear, -5 * rear + 8, 0], tilt));
      M.cap(add(chest, [1, 8, 6]), kn, 4.6, 3.4, HORSE).cap(kn, ft, 3.4, 2.6, SOCK).ell(add(ft, [1, 0, 0]), [3.4, 2.4, 2.8], HOOF);
    } else {
      qleg(M, add(chest, [1, 8, 6]), ph, 34, 5.8, HORSE, HOOF, !1, 1.2, SOCK);
      qleg(M, add(hind, [0, 8, 6]), ph + PI * 1.55, 34, 6.4, HORSE, HOOF, !0, 1.2, SOCK);
    }
    const ta = tilt + rear * 0.15, waist = add(chest, rot2([5, -10, 0], tilt)), tor = add(waist, rot2([2, -11, 1], ta));
    M.ell(waist, [8.4, 6, 7.6], LEATHD, ta);
    M.ell(tor, [8.4, 11, 7.6], LEATH, ta);
    M.box(add(tor, rot2([1, 2, 7], ta)), [4, 6, 1], LEATHD, ta);
    for (let i = 0; i < 4; i++) M.ell(add(tor, rot2([-6 - i * 2.4, -4 + i * 6, -3 - i], ta)), [6 - i * 0.6, 6, 4], HOOD, ta + 0.3 + i * 0.1);
    const fs = add(tor, rot2([1, -7, -6], ta)), bowA = -bowUp;
    const [, fh] = arm(M, fs, bowA, 11, bowA, 10, 2.8, 2.4, SKIN);
    const bowTop = add(fh, [-3 - draw * 2, -20, 1]), bowBot = add(fh, [-3 - draw * 2, 20, 1]), mid = add(fh, [2, 0, 1]);
    M.cap(bowTop, add(mid, [0, -9, 0]), 1.1, 1.6, BOWW).cap(add(mid, [0, -9, 0]), add(mid, [0, 9, 0]), 1.6, 1.6, BOWW).cap(add(mid, [0, 9, 0]), bowBot, 1.6, 1.1, BOWW);
    M.sphere(bowTop, 1.4, GOLD).sphere(bowBot, 1.4, GOLD);
    const nock = add(tor, rot2([2 - draw * 11, -7, 7], ta));
    M.cap(bowTop, nock, 0.4, 0.4, STRING).cap(nock, bowBot, 0.4, 0.4, STRING);
    draw > 0.3 && (M.cap(nock, add(fh, [6, 0, 2]), 0.6, 0.6, BOWW), M.box(add(fh, [7, 0, 2]), [2.4, 1, 0.6], BLADE, 0));
    const ha = ta * 0.5 + headT, hd = add(tor, rot2([2, -16, 2], ta));
    M.cap(add(tor, rot2([1, -9, 1], ta)), hd, 3, 2.8, SKIN);
    M.sphere(hd, 6.4, SKIN);
    M.ell(add(hd, rot2([-1.4, -1.4, 0], ha)), [8, 8, 7.8], HOOD, ha);
    M.ell(add(hd, rot2([3.2, 1, 4.6], ha)), [4.4, 5, 3], HOODIN, ha);
    M.ell(add(hd, rot2([4.6, 0, 6.6], ha)), [1.2, 0.9, 0.5], CEYE, ha);
    M.ell(add(hd, rot2([6.6, 0, 4.2], ha)), [1, 0.8, 0.5], CEYE, ha);
    M.cap(add(hd, rot2([-6, -4, -1], ha)), add(hd, rot2([-14 - hairS * 2, 3 + Math.sin(k) * hairS * 2, -2], ha)), 3, 1, HOOD);
    const ns = add(tor, rot2([1, -7, 7], ta)), nh = add(nock, [0, 0, 0.6]);
    const el = add(ns, rot2([-4 - draw * 3.6, 6 - draw * 3.6, 1], ta));
    M.cap(ns, el, 3, 2.6, SKIN).cap(el, nh, 2.8, 2.2, LEATHD);
    M.sphere(nh, 2.1, SKIN);
    M.ell(add(ns, [0, -0.4, 1.4]), [4, 3.4, 3.6], LEATH, ta);
  },
};
