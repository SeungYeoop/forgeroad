// 그래스메어 몬스터 3D 모델 — 정통 RPG 들판의 적들. 스토리 없이 생김새·동작으로 개성을 낸다.
// 색: 맑은 초원 (풀 초록 · 흙 갈색 · 햇빛 노랑), 몬스터마다 실루엣·재질·고유 동작이 다르다.
import { mat, rough, cloth, EYE, gait, leg, arm, PI, TAU, chain, add, rot2, ease, lerp, noise3, hash } from "./rig.js";

// ── 재질 ──
const JELLY = mat(0x5ec84a, { spec: 0.75, shin: 46, rim: 0.95, rimCol: 0xeaffc0, hi: 0xd8ffa8, lo: 0x1c5a38, tones: 7, tex: (u, v, w, s) => (noise3(u * 0.22 + s, v * 0.22, w * 0.22) - 0.5) * 0.5 });
const JELLYD = mat(0x3a9a3e, { spec: 0.5, shin: 40, rim: 0.6, rimCol: 0xc8ffa0 });
const BUB = mat(0xc8ffb0, { spec: 0.9, shin: 60, rim: 0.2 });
const INK = mat(0x15181c, { spec: 0.6, shin: 60 });
const GLINT = EYE(0xffffff);
const LEAF = mat(0x3e8a2e, { tex: rough(0.8, 0.8), rim: 0.5, rimCol: 0xd8ff9a });
const LEAFL = mat(0x6ab844, { tex: rough(1, 0.8), rim: 0.5, rimCol: 0xe8ffb0 });
const PETAL = mat(0xff8ab8, { rim: 0.5, rimCol: 0xffe0f0 });
const POLLEN = EYE(0xffe060);
// 고블린
const GSKIN = mat(0x86b04a, { tex: rough(0.5, 0.5), rim: 0.55, rimCol: 0xf0ffc0 });
const GSKIND = mat(0x5e8236, { tex: rough(0.5, 0.5) });
const LEATH = mat(0x7a5232, { tex: rough(0.6, 0.6), spec: 0.2, shin: 20 });
const LEATHD = mat(0x553621, { tex: rough(0.6, 0.6) });
const CLOTH = mat(0x8a3a2a, { tex: cloth(0.6) });
const BOOT = mat(0x3e2a1c, { spec: 0.2 });
const BLADE = mat(0xc8c4cc, { spec: 0.9, shin: 44, rim: 0.3, hi: 0xffffff });
const RUST = mat(0x9a6a3a, { tex: rough(0.8, 1) });
const EYEY = EYE(0xffd040), MOUTH = mat(0x2a0e10), TOOTH = mat(0xf0e8d0, { spec: 0.4 });
const ROCK = mat(0x8a8478, { tex: rough(0.8, 0.8) });
// 늑대
const WFUR = mat(0x8a8478, { tex: (u, v, w, s) => (noise3(u * 0.8 + s, v * 0.3, w * 0.8) - 0.5) * 1.4, rim: 0.55, rimCol: 0xfff0d8 });
const WFURD = mat(0x5a544e, { tex: rough(0.7, 1) });
const WRUFF = mat(0xc8bca8, { tex: (u, v, w, s) => (noise3(u * 1.1 + s, v * 0.5, w * 1.1) - 0.5) * 1.6, rim: 0.6, rimCol: 0xffffff });
const NOSE = mat(0x1e1a1c, { spec: 0.5, shin: 40 });
const FANG = mat(0xf0ecdc, { spec: 0.4, shin: 40 });
const GUM = mat(0x8a3a44);
const EYEA = EYE(0xffc040);
// 멧돼지
const BFUR = mat(0x5a3e2c, { tex: (u, v, w, s) => (noise3(u * 1.2 + s, v * 0.4, w * 1.2) - 0.5) * 1.6, rim: 0.5, rimCol: 0xffd8b0 });
const BFURD = mat(0x3c281c, { tex: rough(0.8, 1) });
const BRISTLE = mat(0x2a1e18, { spec: 0.2 });
const SNOUT = mat(0xb07a6a, { spec: 0.3, shin: 24 });
const TUSK = mat(0xf2e8cc, { spec: 0.55, shin: 40, rim: 0.4 });
const HOOF = mat(0x241a16, { spec: 0.3 });
const EYER = EYE(0xff7040), STAR = EYE(0xfff080);
// 말벌
const WASPY = mat(0xf2c020, { spec: 0.6, shin: 40, rim: 0.6, rimCol: 0xfff4c0 });
const WASPK = mat(0x1e1a1e, { spec: 0.6, shin: 50, rim: 0.4, rimCol: 0xffe080 });
const WING = mat(0xd8eef8, { rim: 1, rimCol: 0xffffff, hi: 0xffffff, lo: 0x6a8aa8, tones: 5, tex: (u, v) => (Math.abs(Math.sin(u * 0.9 + v * 0.5)) < 0.1 ? -1.4 : 0.15) });
const CEYE = mat(0x8a1a1e, { spec: 0.9, shin: 60, rim: 0.3, tex: (u, v) => ((Math.floor(u * 1.4) + Math.floor(v * 1.4)) % 2 ? 0.25 : -0.25) });
const STING = mat(0x2a2024, { spec: 0.6, shin: 50 });
// 맨드레이크
const ROOT = mat(0xd8b88a, { tex: (u, v, w, s) => Math.sin(v * 1.6 + noise3(u * 0.3 + s, v * 0.2, w * 0.3) * 4) * 0.4, rim: 0.5, rimCol: 0xfff0d0 });
const ROOTD = mat(0xa8865c, { tex: rough(0.8, 0.8) });
const HOLE = mat(0x1a0c0a);
const FLOWERP = mat(0xb06ad8, { rim: 0.6, rimCol: 0xf0d8ff });
// 오우거
const OSKIN = mat(0x8a9a5e, { tex: rough(0.35, 0.6), rim: 0.5, rimCol: 0xf0ffd0, spec: 0.2, shin: 22 });
const OSKIND = mat(0x5e6c3e, { tex: rough(0.35, 0.6) });
const OFUR = mat(0x7a5a3a, { tex: (u, v, w, s) => (noise3(u * 1.1 + s, v * 0.6, w * 1.1) - 0.5) * 1.6 });
const STRAP = mat(0x4a3020, { spec: 0.2 });
const WOODC = mat(0x7a5232, { tex: (u, v, w, s) => Math.sin(v * 1.2 + noise3(u * 0.3, v * 0.1, w + s) * 6) * 0.5, rim: 0.4 });
const IRON = mat(0x7a7880, { spec: 0.6, shin: 44 });
const OEYE = EYE(0xffe060);
// 켄타우로스
const HORSE = mat(0x9a5a30, { tex: (u, v, w, s) => (noise3(u * 0.3 + s, v * 0.3, w * 0.3) - 0.5) * 0.6, spec: 0.35, shin: 30, rim: 0.55, rimCol: 0xffe0c0 });
const HORSED = mat(0x6a3c20, { tex: rough(0.4, 0.5), spec: 0.2 });
const SOCK = mat(0xf0e8dc, { tex: rough(0.6, 0.4) });
const MANE = mat(0x3a2418, { tex: (u) => Math.sin(u * 2.2) * 0.5, rim: 0.4 });
const SKIN = mat(0xd8a47a, { rim: 0.55, rimCol: 0xfff0e0 });
const SKIND = mat(0xa87452);
const HAIR = mat(0x4a2c1e, { tex: (u) => Math.sin(u * 2) * 0.5, rim: 0.4 });
const VEST = mat(0x5a6a3a, { tex: cloth(0.5) });
const BOWW = mat(0x6a3e1e, { spec: 0.25, tex: (u) => Math.sin(u * 2) * 0.3 });
const STRING = mat(0xe8e0d0, { emit: 0xe0d8c8 });
const FLETCH = mat(0xe8e0d0);
const EYEB = EYE(0x6ad0ff);

// 네발 다리 (짐승): ph 걸음 위상, back 뒷다리, sock 아랫마디 재질
function qleg(M, hip, ph, len, w, m, foot, back, lift = 1, low = null) {
  const sw = Math.sin(ph) * 0.55;
  const a1 = PI / 2 + (back ? 0.15 : -0.1) - sw;
  const a2 = back ? -0.55 - Math.max(0, Math.cos(ph)) * 0.6 * lift : 0.35 + Math.max(0, Math.cos(ph)) * 0.6 * lift;
  const [kn, ft] = chain(hip, a1, len * 0.52, a2, len * 0.55);
  M.cap(hip, kn, w, w * 0.75, m).cap(kn, ft, w * 0.75, w * 0.55, low ?? m);
  M.ell(add(ft, [1.2, 0, 0]), [w * 0.8, w * 0.5, w * 0.7], foot);
  return ft;
}
const dirOf = (a, b) => {
  const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [(b[0] - a[0]) / d, (b[1] - a[1]) / d];
};

// ════ 풀잎 슬라임 (큰 것 · 작은 것) ════ 통통 튀며 다가와 몸통 박치기. 큰 것은 죽으면 둘로 갈라진다
function slimeOf(s) {
  const fw = Math.round(48 * s), fh = Math.round(40 * s);
  return {
    fw, fh, w: Math.round(18 * s), h: Math.round(14 * s),
    anims: { idle: [4, 6], move: [6, 11], wind: [3, 8, !1], atk: [3, 14, !1], rec: [2, 8, !1], hurt: [2, 10, !1] },
    model(M, nm, k, n) {
      const G = fh - 3, cx = fw / 2 - 2 * s;
      let sq = 1, lift = 0, lean = 0, mouth = 0.2;
      if (nm === "idle") sq = 1 + Math.sin((k / n) * TAU) * 0.06;
      if (nm === "move") ((sq = [0.78, 1.12, 1.2, 1.12, 0.95, 0.82][k]), (lift = [0, 5, 9, 9, 4, 0][k] * s), (lean = [0, 0.15, 0.1, 0, -0.1, 0][k]));
      if (nm === "wind") ((sq = [0.85, 0.72, 0.62][k]), (mouth = 0.5));
      if (nm === "atk") ((sq = [1.3, 1.22, 1][k]), (lift = [6, 10, 4][k] * s), (lean = [0.3, 0.25, 0][k]), (mouth = 1));
      if (nm === "rec") sq = [0.75, 0.95][k];
      if (nm === "hurt") ((sq = [0.68, 0.9][k]), (lean = [-0.25, -0.1][k]), (mouth = 0.7));
      const rx = (15 * s) / Math.sqrt(sq), ry = 11 * s * sq, rz = rx * 0.85;
      const c = [cx + lean * 6 * s, G - ry - lift, 0];
      // 땅에 닿을 때 바닥에 번진 젤리
      lift < 1 && M.ell([cx, G - 1, 0], [rx * 1.05, 1.4 * s, rz * 1.02], JELLYD);
      M.ell(c, [rx, ry, rz], JELLY, lean * 0.3);
      // 속 거품 (겉에 살짝 비침)
      // 몸 겉면 위 점 (u: x 비율, v: y 비율) → 앞쪽 표면 z
      const surf = (u, v, d = 0.4) => [c[0] + rx * u, c[1] + ry * v, rz * Math.sqrt(Math.max(0, 1 - u * u - v * v)) + d];
      M.sphere(surf(-0.45, 0.3, -0.6), 1.6 * s, BUB);
      M.sphere(surf(0.05, 0.55, -0.5), 1.1 * s, BUB);
      M.sphere(surf(-0.3, -0.55, -0.4), 2 * s, GLINT);
      // 눈 (3/4: 보는 쪽 표면) + 입
      for (const [u, sc] of [[0.12, 1], [0.5, 0.82]]) {
        const e = surf(u, -0.2, 0.2);
        M.ell(e, [1.5 * s * sc, 2.6 * s * sq * sc, 0.8], INK);
        M.sphere(add(e, [-0.4 * s, -1 * s, 0.6]), 0.7 * s, GLINT);
      }
      M.ell(surf(0.32, 0.22, 0.2), [2.6 * s, (0.7 + mouth * 1.8) * s, 0.8], INK);
      // 머리 위 새싹 + (큰 것만) 꽃
      const top = [c[0] - 1 * s, c[1] - ry + 1, 0];
      M.cap(top, add(top, [0, -4 * s, 0]), 0.8 * s, 0.6 * s, LEAF);
      M.ell(add(top, [-2.6 * s, -4.5 * s, 1]), [3.2 * s, 1.3 * s, 1.8 * s], LEAFL, -0.5);
      M.ell(add(top, [2.6 * s, -5 * s, -1]), [3.2 * s, 1.3 * s, 1.8 * s], LEAF, 0.5);
      if (s >= 1) {
        const f = add(top, [0.5, -7.5, 1]);
        for (let i = 0; i < 5; i++) M.ell(add(f, [Math.cos((i / 5) * TAU) * 2, Math.sin((i / 5) * TAU) * 1.4, 0]), [1.6, 1.2, 1], PETAL);
        M.sphere(add(f, [0, 0, 1]), 1, POLLEN);
      }
    },
  };
}
export const gSlime = slimeOf(1);
export const gSlimeMini = slimeOf(0.62);

// ════ 고블린 정찰병 ════ 녹슨 단검으로 재빠르게 찌르고 빠지며, 돌을 던진다
export const goblin = {
  fw: 58, fh: 54, w: 14, h: 24,
  anims: { idle: [4, 6], move: [6, 12], wind: [3, 10, !1], atk: [3, 16, !1], rec: [2, 8, !1], hurt: [2, 10, !1], throw: [4, 12, !1], hop: [3, 10, !1] },
  model(M, nm, k, n) {
    const G = 51, cx = 26;
    let bob = 0, lean = 0.1, legs = gait(0, 0.08, 0), nA = [1.2, -0.6], fA = [1.9, 0.3], headT = 0, crouch = 0, grin = 0.3, rock = 0;
    if (nm === "idle") ((bob = Math.sin((k / n) * TAU) * 0.6), (headT = Math.sin((k / n) * TAU) * 0.06));
    if (nm === "move") {
      const ph = (k / n) * TAU;
      legs = gait(ph, 0.55, 1);
      bob = Math.abs(Math.cos(ph)) * 1.6;
      lean = 0.3;
      nA = [1.1 - Math.sin(ph) * 0.4, -0.5], fA = [1.8 + Math.sin(ph) * 0.4, 0.3];
    }
    if (nm === "wind") {
      const t = ease((k + 1) / n);
      crouch = 4 * t, lean = lerp(0.1, -0.2, t), nA = [lerp(1.2, PI + 0.5, t), lerp(-0.6, 1.2, t)], fA = [lerp(1.9, 0.6, t), -0.2], grin = 1;
      legs = [[PI / 2 - 0.6 * t, 1.1 * t], [PI / 2 + 0.5 * t, 0.9 * t]];
    }
    if (nm === "atk") {
      lean = [0.6, 0.75, 0.6][k], nA = [[0.3, -0.1], [0.05, 0], [0.1, 0]][k], fA = [2.4, 0.4], grin = 1, crouch = 1;
      legs = [[PI / 2 - 0.8, 0.3], [PI / 2 + 0.7, 0.2]];
    }
    if (nm === "rec") ((lean = 0.4 - k * 0.15), (nA = [0.8 + k * 0.3, -0.3]));
    if (nm === "hurt") ((lean = -0.35), (headT = -0.4), (nA = [-2.4, 0.4]), (fA = [2.8, 0.2]), (grin = 0));
    if (nm === "throw") {
      const t = [0.3, 1, 0.2, 0][k];
      rock = k < 2 ? 1 : 0;
      nA = k < 2 ? [lerp(1.2, -2.2, t), 1.4] : [[0.2, 0.1], [0.6, -0.2]][k - 2], lean = k < 2 ? -0.2 : 0.5, grin = 1;
    }
    if (nm === "hop") ((crouch = [3, -2, 0][k]), (legs = [[PI / 2 - 0.9, 1.6], [PI / 2 - 0.2, 1.4]]), (lean = -0.2), (bob = [0, 3, 1][k]));
    const hip = [cx + lean * 2, G - 13 + crouch + bob * 0.4, 0];
    leg(M, add(hip, [0, 0, -3]), legs[1][0], 7, legs[1][1], 7, 2.4, 2, GSKIND, BOOT, 2.6);
    // 몸통 (조끼 + 배)
    const ch = add(hip, rot2([0, -8], lean));
    M.ell(add(hip, rot2([0, -4], lean)), [5, 5, 4.5], CLOTH, lean);
    M.ell(ch, [5.6, 6.4, 5], LEATH, lean);
    M.ell(add(ch, rot2([2, 1.5, 2.5], lean)), [3.4, 4, 3], GSKIN, lean);
    M.cap(add(ch, rot2([-4, -4, 3], lean)), add(ch, rot2([3, 4, 4.6], lean)), 0.7, 0.7, LEATHD);
    // 먼 팔 (어둡게)
    const fs = add(ch, rot2([-1, -4, -4], lean));
    const [, fh] = arm(M, fs, fA[0], 5.5, fA[1], 5, 1.7, 1.4, GSKIND);
    M.sphere(fh, 1.6, GSKIND);
    // 머리: 큰 머리 · 갈고리 코 · 긴 귀 · 가죽 모자
    const hd = add(ch, rot2([3, -10 + headT * 4, 1], lean * 0.6));
    const ha = lean * 0.5 + headT;
    M.cap(add(hd, rot2([-3, -1, -4], ha)), add(hd, rot2([-13, -6, -4], ha - 0.2)), 2.2, 0.4, GSKIND);
    M.ell(hd, [6.6, 6, 6], GSKIN, ha);
    M.cap(add(hd, rot2([4, -0.5, 3], ha)), add(hd, rot2([8.5, 2.5, 3.6], ha)), 1.8, 0.8, GSKIN);
    M.cap(add(hd, rot2([-3, -1, 4], ha)), add(hd, rot2([-13, -7, 5], ha - 0.25)), 2.4, 0.4, GSKIN);
    M.sphere(add(hd, rot2([3.2, -1.8, 5.2], ha)), 1.2, EYEY);
    M.sphere(add(hd, rot2([6, -1.8, 2.2], ha)), 1, EYEY);
    M.ell(add(hd, rot2([3.6, -3.6, 5], ha)), [2, 0.7, 1], GSKIND, ha + 0.25);
    M.ell(add(hd, rot2([3.8, 2.8, 4.4], ha)), [2.8, 0.6 + grin * 0.9, 1], MOUTH, ha);
    grin > 0.5 && (M.sphere(add(hd, rot2([2.6, 2.6, 5.2], ha)), 0.6, TOOTH), M.sphere(add(hd, rot2([4.8, 2.6, 5], ha)), 0.6, TOOTH));
    M.ell(add(hd, rot2([-1, -4.2, 0], ha)), [6.4, 3.2, 6.4], LEATH, ha - 0.1);
    M.ell(add(hd, rot2([3, -2.8, 1], ha)), [4.6, 0.9, 5.6], LEATHD, ha);
    M.cap(add(hd, rot2([-4, -6, -1], ha)), add(hd, rot2([-9, -12, -2], ha - 0.4)), 0.9, 0.3, CLOTH);
    // 앞 다리
    leg(M, add(hip, [0.5, 0, 3]), legs[0][0], 7, legs[0][1], 7, 2.6, 2.1, GSKIN, BOOT, 2.8);
    // 가까운 팔 + 녹슨 단검 (또는 돌)
    const ns = add(ch, rot2([1, -4, 4.5], lean));
    const [el, hn] = arm(M, ns, nA[0], 5.5, nA[1], 5, 1.9, 1.5, GSKIN);
    M.sphere(hn, 1.7, GSKIN);
    if (rock) M.sphere(add(hn, [0.5, -1.5, 1]), 2.4, ROCK);
    else if (nm !== "throw") {
      const d = dirOf(el, hn), tip = add(hn, [d[0] * 10, d[1] * 10, 0.5]);
      M.box(add(hn, [d[0] * 5.5, d[1] * 5.5, 0.5]), [4.6, 0.9, 0.5], BLADE, Math.atan2(d[1], d[0]));
      M.cap(add(hn, [d[0] * 3, d[1] * 3, 0.6]), add(hn, [d[0] * 6, d[1] * 6, 0.6]), 0.6, 0.5, RUST);
      M.box(add(hn, [d[0] * 1.2, d[1] * 1.2, 0.5]), [0.6, 2, 0.6], LEATHD, Math.atan2(d[1], d[0]));
      void tip;
    }
  },
};

// ════ 초원 회색늑대 ════ 목둘레 갈기가 풍성한 들늑대. 낮게 웅크렸다가 덮쳐 문다. 울부짖어 무리를 깨운다
export const plainsWolf = {
  fw: 78, fh: 52, w: 22, h: 16,
  anims: { idle: [6, 6], move: [6, 15], wind: [3, 9, !1], atk: [3, 14, !1], rec: [2, 8, !1], hurt: [2, 10, !1], howl: [4, 6, !1] },
  model(M, nm, k, n) {
    const G = 49, cx = 36;
    let bob = 0, ph = 0, stretch = 0, tilt = 0, crouch = 0, jaw = 0.12, headT = 0, tail = Math.sin((k / Math.max(1, n)) * TAU) * 0.25, legsUp = 0;
    if (nm === "idle") bob = Math.sin((k / n) * TAU) * 0.7;
    if (nm === "move") ((ph = (k / n) * TAU), (stretch = Math.sin(ph) * 3.4), (bob = Math.abs(Math.cos(ph)) * 2.6), (tilt = Math.sin(ph) * 0.07), (tail = -0.2));
    if (nm === "wind") ((crouch = (k + 1) * 2.4), (headT = 0.3), (jaw = 0.35), (tail = -0.5));
    if (nm === "atk") ((tilt = [-0.35, -0.2, 0.12][k]), (stretch = [7, 8, 3][k]), (jaw = [1, 1, 0.3][k]), (legsUp = [1, 1, 0.3][k]), (bob = [7, 5, 1][k]), (headT = -0.1));
    if (nm === "rec") ((crouch = 2 - k), (jaw = 0.3));
    if (nm === "hurt") ((tilt = 0.2), (headT = -0.4), (jaw = 0.7));
    if (nm === "howl") ((headT = [-0.5, -1, -1.1, -0.6][k]), (jaw = [0.3, 0.9, 1, 0.5][k]), (tilt = -0.12), (tail = 0.3));
    const b = [cx, G - 18 - bob + crouch * 0.6, 0];
    const front = add(b, rot2([11 + stretch * 0.5, -1], tilt)), rear = add(b, rot2([-11 - stretch * 0.5, 0], tilt));
    // 꼬리 (풍성하게, 끝이 밝다)
    const t0 = add(rear, rot2([-6, -2, 0], tilt)), t1 = add(t0, [-7, -2 + tail * 6, -1]), t2 = add(t1, [-6, 0 + tail * 8, -1]);
    M.cap(t0, t1, 3, 4, WFUR).cap(t1, t2, 4, 2.2, WFUR).sphere(t2, 2.2, WRUFF);
    if (legsUp) {
      qleg(M, add(front, [0, 3, -4]), 0, 15, 2.5, WFURD, WFURD, !1, 0);
      M.cap(add(rear, [0, 3, -4]), add(rear, [-9 * legsUp, 9, -4]), 3, 2, WFURD);
    } else {
      qleg(M, add(front, [0, 3, -4]), ph + PI, 15 - crouch * 0.5, 2.5, WFURD, WFURD, !1);
      qleg(M, add(rear, [0, 3, -4]), ph + PI * 0.4, 16 - crouch * 0.5, 3.2, WFURD, WFURD, !0);
    }
    M.ell(rear, [8, 7, 6.5], WFUR, tilt);
    M.ell(b, [11, 6, 6.2], WFUR, tilt);
    M.ell(add(b, rot2([2, 4, 2], tilt)), [9, 2.6, 5], WRUFF, tilt);
    M.ell(front, [8.5, 8.4, 7.2], WFUR, tilt - 0.1);
    // 목 갈기 (풍성한 목둘레 털)
    for (let i = 0; i < 5; i++) M.ell(add(front, rot2([2 - i * 2.2, -3 + Math.abs(i - 2) * 1.4, 2 - i * 0.8], tilt)), [4.6, 6, 5.5], i % 2 ? WRUFF : WFUR, tilt + 0.3);
    if (legsUp) {
      M.cap(add(front, [1, 4, 4]), add(front, [12 * legsUp, 7, 4]), 2.8, 2, WFUR).ell(add(front, [13 * legsUp + 1, 7.5, 4]), [2.4, 1.4, 2], WFURD);
      M.cap(add(rear, [0, 4, 4]), add(rear, [-10 * legsUp, 10, 4]), 3.4, 2.2, WFUR);
    } else {
      qleg(M, add(front, [1, 4, 4]), ph, 15 - crouch * 0.5, 2.7, WFUR, WFURD, !1);
      qleg(M, add(rear, [0, 4, 4]), ph + PI * 1.4, 16 - crouch * 0.5, 3.4, WFUR, WFURD, !0);
    }
    const neck = add(front, rot2([6, -5, 1], tilt));
    const ha = tilt + headT, head = add(neck, rot2([6, -2 + headT * 5, 2], ha));
    M.cap(front, neck, 6, 5, WFUR);
    M.ell(head, [7, 6, 6.2], WFUR, ha);
    M.ell(add(head, rot2([2, 2.6, 3.6], ha)), [4.4, 2.8, 3], WRUFF, ha);
    const sn = add(head, rot2([9.5, 1.4, 1.5], ha));
    M.cap(add(head, rot2([3, 0.5, 1], ha)), sn, 3.8, 2.4, WFUR);
    M.sphere(add(sn, [0.8, -0.4, 0.6]), 1.5, NOSE);
    const jawE = add(head, rot2([8.5, 4 + jaw * 2.4, 1.5], ha + jaw * 0.35));
    M.cap(add(head, rot2([2, 3, 1], ha)), jawE, 2.3, 1.5, WFURD);
    jaw > 0.5 && (M.ell(add(head, rot2([6, 3.2, 3], ha)), [3, 1.2 * jaw, 2], GUM), M.cap(add(sn, rot2([-1, 1.5, 2], ha)), add(sn, rot2([-1, 3.6, 2], ha)), 0.7, 0.2, FANG), M.cap(add(jawE, rot2([-1, -1, 2], ha)), add(jawE, rot2([-1, -3, 2], ha)), 0.7, 0.2, FANG));
    M.cap(add(head, rot2([-1, -4, 3], ha)), add(head, rot2([-3, -11, 3], ha - 0.1)), 2.2, 0.4, WFUR);
    M.cap(add(head, rot2([-2, -4, -2], ha)), add(head, rot2([-4, -10, -2], ha - 0.1)), 2, 0.4, WFURD);
    M.ell(add(head, rot2([3.5, -2.2, 5.6], ha)), [2.2, 1.3, 1], WFURD, ha - 0.3);
    M.sphere(add(head, rot2([3.8, -2, 6.3], ha)), 1.3, EYEA);
    M.sphere(add(head, rot2([5.6, -2, 2], ha)), 1, EYEA);
    // 얼굴 흉터
    M.cap(add(head, rot2([1, -5, 5.6], ha)), add(head, rot2([4, 0, 6], ha)), 0.4, 0.4, WRUFF);
  },
};

// ════ 뿔멧돼지 ════ 앞발로 땅을 긁고 일직선 돌진. 벽이나 바위에 부딪히면 잠깐 어지러워한다
export const tuskBoar = {
  fw: 80, fh: 54, w: 28, h: 22,
  anims: { idle: [4, 5], move: [6, 10], scrape: [4, 10, !1], charge: [4, 16], stun: [4, 6], hurt: [2, 10, !1], rec: [2, 8, !1] },
  model(M, nm, k, n) {
    const G = 51, cx = 36;
    let bob = 0, ph = 0, tilt = 0, headD = 0, paw = 0, stretch = 0, dizzy = 0;
    if (nm === "idle") bob = Math.sin((k / n) * TAU) * 0.6;
    if (nm === "move") ((ph = (k / n) * TAU), (bob = Math.abs(Math.cos(ph)) * 1.6));
    if (nm === "scrape") ((paw = [0.2, 1, 0.3, 1][k]), (headD = 1), (tilt = 0.08));
    if (nm === "charge") ((ph = (k / n) * TAU), (bob = Math.abs(Math.cos(ph)) * 3), (headD = 1.4), (stretch = 3 + Math.sin(ph) * 2), (tilt = 0.12));
    if (nm === "stun") ((dizzy = 1), (headD = 0.8), (tilt = Math.sin((k / n) * TAU) * 0.06), (bob = 1));
    if (nm === "hurt") ((tilt = -0.15), (headD = -0.4));
    if (nm === "rec") headD = 0.6 - k * 0.3;
    const b = [cx, G - 18 - bob, 0];
    const front = add(b, rot2([10 + stretch * 0.4, -1], tilt)), rear = add(b, rot2([-11, 0], tilt));
    // 뒤쪽 다리
    if (nm === "scrape") {
      qleg(M, add(front, [0, 5, -4]), PI, 11, 3, BFURD, HOOF, !1);
      qleg(M, add(rear, [0, 4, -4]), PI * 1.4, 12, 3.6, BFURD, HOOF, !0);
    } else {
      qleg(M, add(front, [0, 5, -4]), ph + PI, 11, 3, BFURD, HOOF, !1, nm === "charge" ? 1.4 : 1);
      qleg(M, add(rear, [0, 4, -4]), ph + PI * 0.4, 12, 3.6, BFURD, HOOF, !0, nm === "charge" ? 1.4 : 1);
    }
    // 가는 꼬리 (끝이 말림)
    const tA = add(rear, rot2([-8, -3, 0], tilt));
    M.cap(tA, add(tA, [-4, 1, 0]), 1, 0.8, BFURD).cap(add(tA, [-4, 1, 0]), add(tA, [-5, -2, 0]), 0.8, 0.6, BRISTLE);
    // 통 같은 몸 + 어깨 혹
    M.ell(rear, [10, 9.5, 8.5], BFUR, tilt);
    M.ell(b, [14, 10, 9], BFUR, tilt);
    M.ell(add(front, rot2([-2, -5], tilt)), [10, 8, 8.5], BFUR, tilt + 0.2);
    M.ell(add(b, rot2([0, 6, 3], tilt)), [12, 3, 6], BFURD, tilt);
    // 등 갈기 (뻣뻣한 털)
    for (let i = 0; i < 9; i++) {
      const p = add(b, rot2([-12 + i * 3.4, -9 - Math.sin((i / 8) * PI) * 4, 0], tilt));
      M.cap(p, add(p, rot2([-1.5, -4 - Math.sin((i / 8) * PI) * 2, 0], tilt - 0.3)), 1.3, 0.3, BRISTLE);
    }
    // 앞쪽 다리
    if (nm === "scrape") {
      M.cap(add(front, [1, 6, 4]), add(front, [-6 * paw + 2, 13, 4]), 3.2, 2.4, BFUR).ell(add(front, [-6 * paw + 3, 13.5, 4]), [2.6, 1.6, 2.2], HOOF);
      qleg(M, add(rear, [0, 5, 4]), PI * 0.2, 12, 3.8, BFUR, HOOF, !0);
    } else {
      qleg(M, add(front, [1, 6, 4]), ph, 11, 3.2, BFUR, HOOF, !1, nm === "charge" ? 1.4 : 1);
      qleg(M, add(rear, [0, 5, 4]), ph + PI * 1.4, 12, 3.8, BFUR, HOOF, !0, nm === "charge" ? 1.4 : 1);
    }
    // 머리 (낮게 숙이면 엄니가 앞으로)
    const ha = tilt + headD * 0.35, head = add(front, rot2([8, 2 + headD * 3, 2], tilt));
    M.ell(head, [8, 7, 6.6], BFUR, ha);
    const sn = add(head, rot2([8, 2.5, 1.5], ha));
    M.cap(add(head, rot2([3, 1, 1], ha)), sn, 4.4, 3.4, BFUR);
    M.ell(add(sn, rot2([1.4, 0, 1], ha)), [1.6, 3.2, 3.2], SNOUT, ha);
    M.sphere(add(sn, rot2([2.4, -0.8, 2.6], ha)), 0.7, HOLE);
    M.sphere(add(sn, rot2([2.4, 1, 2.6], ha)), 0.7, HOLE);
    // 엄니 (두 마디로 휘어 올라간다)
    for (const [z, mt] of [[4.4, TUSK], [-1.6, TUSK]]) {
      const a = add(sn, rot2([-2, 3, z], ha)), bq = add(a, rot2([3, -1, 0.4], ha)), c = add(bq, rot2([2, -4.5, 0.4], ha - 0.3));
      M.cap(a, bq, 1.5, 1.2, mt).cap(bq, c, 1.2, 0.3, mt);
    }
    M.cap(add(head, rot2([-3, -5, 4], ha)), add(head, rot2([-6, -9, 4.5], ha - 0.3)), 2, 0.5, BFURD);
    M.cap(add(head, rot2([-3, -5, -3], ha)), add(head, rot2([-6, -9, -3], ha - 0.3)), 1.8, 0.5, BFURD);
    M.sphere(add(head, rot2([3, -2.6, 5.4], ha)), 1.1, EYER);
    M.ell(add(head, rot2([3, -4, 5.2], ha)), [2.2, 0.7, 1], BFURD, ha + 0.3);
    // 어지러움: 머리 위 도는 별
    if (dizzy) for (let i = 0; i < 3; i++) {
      const a = (k / n) * TAU + (i / 3) * TAU;
      M.sphere(add(head, [Math.cos(a) * 7, -11 + Math.sin(a) * 1.5, Math.sin(a) * 6]), 1.3, STAR);
    }
  },
};

// ════ 거대 말벌 ════ 하늘에서 맴돌다 배를 앞으로 말고 독침 급강하
export const giantWasp = {
  fw: 54, fh: 48, w: 16, h: 14, flying: !0,
  anims: { idle: [4, 20], wind: [3, 10, !1], atk: [3, 16, !1], rec: [2, 10, !1], hurt: [2, 12, !1] },
  model(M, nm, k, n) {
    const cx = 27, cy = 22;
    let curl = 0, pitch = 0, flap = k % 2, lunge = 0;
    if (nm === "wind") ((curl = (k + 1) / n), (pitch = -0.15 * curl));
    if (nm === "atk") ((curl = 1), (pitch = 0.35), (lunge = [4, 6, 3][k]));
    if (nm === "rec") ((curl = 0.5 - k * 0.25), (pitch = 0.1));
    if (nm === "hurt") ((pitch = -0.35), (curl = 0.2));
    const th = [cx + lunge, cy, 0];
    // 뒤 날개 (먼 쪽)
    const wingA = flap ? -0.9 : -0.25;
    M.ell(add(th, rot2([-3, -7, -3], pitch)), [9, 3, 1], WING, pitch + wingA + 0.25);
    // 배: 노랑·검정 마디, 독침 (예고 때 앞으로 말린다)
    const ab = [];
    for (let i = 0; i < 4; i++) {
      const a = pitch + 0.35 + curl * (0.5 + i * 0.45);
      const prev = ab[i - 1] ?? add(th, rot2([-4, 1], pitch));
      ab.push(add(prev, [-Math.cos(a) * (i ? 4 : 3), Math.sin(a) * (i ? 4 : 3), 0]));
    }
    ab.forEach((p, i) => M.ell(p, [4.6 - i * 0.5, 4.2 - i * 0.6, 4.2 - i * 0.5], i % 2 ? WASPK : WASPY, pitch + curl * i * 0.4));
    const tipA = pitch + 0.35 + curl * 2.1, tip = ab[3], sting = add(tip, [-Math.cos(tipA) * 5, Math.sin(tipA) * 5, 0]);
    M.cap(tip, sting, 1.2, 0.2, STING);
    // 가슴 + 다리 (늘어뜨린 세 쌍)
    for (let i = 0; i < 3; i++) {
      const hp = add(th, [1 - i * 2, 3, i % 2 ? 2 : -2]);
      const kn = add(hp, [2 + i, 4, 0]), ft = add(kn, [-1 + i * 0.6, 4, 0]);
      M.cap(hp, kn, 0.8, 0.6, WASPK).cap(kn, ft, 0.6, 0.4, WASPY);
    }
    M.sphere(th, 4.6, WASPK);
    M.ell(add(th, [-1, -1, 3.5]), [2.6, 2, 1], WASPY);
    // 머리: 큰 겹눈 · 턱 · 더듬이
    const hd = add(th, rot2([5.5, -0.5, 1.5], pitch));
    M.sphere(hd, 3.4, WASPY);
    M.ell(add(hd, [1.2, -1, 2.6]), [2, 2.6, 1.6], CEYE, 0.2);
    M.ell(add(hd, [2.4, -1, -1.4]), [1.6, 2.2, 1.2], CEYE, 0.2);
    M.cap(add(hd, [3, 1.6, 1.5]), add(hd, [5, 3.4, 2]), 0.6, 0.3, WASPK);
    M.cap(add(hd, [3, 1.6, -0.5]), add(hd, [5, 3.4, -0.5]), 0.6, 0.3, WASPK);
    M.cap(add(hd, [1, -3, 1]), add(hd, [4, -7, 1.5]), 0.4, 0.3, WASPK).cap(add(hd, [4, -7, 1.5]), add(hd, [7, -8, 1.5]), 0.3, 0.2, WASPK);
    M.cap(add(hd, [0, -3, -1]), add(hd, [2, -7, -1.5]), 0.4, 0.3, WASPK);
    // 앞 날개 (가까운 쪽, 빠르게 퍼덕)
    M.ell(add(th, rot2([-4, -6, 4], pitch)), [11, 3.4, 1], WING, pitch + wingA);
  },
};

// ════ 맨드레이크 ════ 풀잎 무더기인 척 숨어 있다가 튀어나와 비명 (가까이 있으면 잠깐 굳는다). 다시 땅으로 숨는다
export const mandrake = {
  fw: 46, fh: 52, w: 14, h: 18,
  anims: { hide: [2, 3], rise: [4, 12, !1], idle: [4, 8], move: [6, 12], scream: [4, 12, !1], burrow: [4, 12, !1], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 49, cx = 22;
    let pop = 1, arms = 0.2, mouth = 0.3, shake = 0, legsPh = -1, lean = 0;
    if (nm === "hide") pop = 0;
    if (nm === "rise") pop = ease((k + 1) / n);
    if (nm === "burrow") pop = 1 - ease((k + 1) / n);
    if (nm === "idle") ((shake = Math.sin((k / n) * TAU) * 0.6), (arms = 0.3 + Math.sin((k / n) * TAU) * 0.15));
    if (nm === "move") ((legsPh = (k / n) * TAU), (lean = 0.15), (shake = Math.sin(legsPh * 2) * 0.5));
    if (nm === "scream") ((mouth = [0.6, 1, 1, 0.8][k]), (arms = [0.6, 1.2, 1.3, 1][k]), (shake = [0, 1, -1, 0.6][k]));
    if (nm === "hurt") ((mouth = 0.8), (lean = -0.3), (arms = -0.3));
    // 잎 무더기: 숨었을 때는 이것만
    const sway = Math.sin(k * 1.7) * 0.15;
    const bodyH = 11 * pop;
    const top = [cx + shake + lean * 4, G - 6 - bodyH * 1.6, 0];
    for (let i = 0; i < 5; i++) {
      const a = -PI / 2 + (i - 2) * 0.42 + sway, L = i === 2 ? 9 : 7;
      const base = pop < 0.05 ? [cx, G - 1, 0] : add(top, [0, 1, 0]);
      M.ell(add(base, [Math.cos(a) * L * 0.6, Math.sin(a) * L * 0.6, (i % 2 ? 1.5 : -1.5)]), [L * 0.6, 1.8, 2.2], i % 2 ? LEAFL : LEAF, a);
    }
    if (pop < 0.05) {
      M.ell([cx, G, 0], [8, 1.6, 4], ROOTD);
      return;
    }
    pop > 0.6 && M.sphere(add(top, [1, -7, 1]), 1.6, FLOWERP);
    // 뿌리 몸 (위가 얼굴)
    const c = [cx + shake + lean * 2, G - 4 - bodyH, 0];
    M.ell(c, [6.2, bodyH, 5.4], ROOT, lean);
    M.ell(add(c, [-1, bodyH * 0.5, -2]), [4, bodyH * 0.4, 3], ROOTD, lean);
    // 잔뿌리 다리 (걸을 때 꼼지락)
    for (let i = 0; i < 3; i++) {
      const sw = legsPh >= 0 ? Math.sin(legsPh + i * 2.1) * 2.5 : 0;
      const a = add(c, [-2 + i * 2, bodyH * 0.8, i === 1 ? 2 : -1]);
      M.cap(a, [a[0] + (i - 1) * 2.5 + sw, G - 0.5, a[2]], 1.4, 0.5, ROOTD);
    }
    // 팔 (가는 뿌리)
    for (const [z, m, d] of [[-3, ROOTD, -1], [3.5, ROOT, 1]]) {
      const sh = add(c, [d * 4.5, -bodyH * 0.2, z]);
      const el = add(sh, [d * 3, -arms * 5 + 1, 0]), hd = add(el, [d * 2.4, -arms * 4 - 0.5, 0]);
      M.cap(sh, el, 1.3, 1, m).cap(el, hd, 1, 0.4, m);
    }
    // 얼굴: 패인 눈 · 비명 지르는 입
    const fz = (u, v) => 5.4 * Math.sqrt(Math.max(0, 1 - u * u - v * v)) + 0.3;
    const fp = (dx, dy) => [c[0] + dx, c[1] + dy, fz(dx / 6.2, dy / bodyH)];
    M.ell(fp(0.4, -bodyH * 0.45), [1.1, 1.4, 0.6], HOLE).ell(fp(3.8, -bodyH * 0.45), [1, 1.3, 0.6], HOLE);
    M.ell(fp(2, -bodyH * 0.12 + mouth), [1.6 + mouth * 1.2, 0.8 + mouth * 2.4, 0.6], HOLE);
  },
};

// ════ [정예] 초원 오우거 ════ 쇠못 박힌 몽둥이로 내려찍어 땅을 울린다. 화나면 발구르기로 충격파
export const meadowOgre = {
  fw: 128, fh: 126, w: 34, h: 52,
  anims: { idle: [4, 5], move: [8, 8], wind: [4, 7, !1], atk: [3, 14, !1], rec: [3, 7, !1], hurt: [2, 10, !1], stomp: [4, 10, !1], roar: [4, 8, !1] },
  model(M, nm, k, n) {
    const G = 123, cx = 50;
    let bob = 0, legs = gait(0, 0.08, 0), nA = [1.5, -0.5], fA = [1.7, 0.4], lean = 0.05, headT = 0, jaw = 0.2, breath = 0, lift = 0, club = 1;
    if (nm === "idle") ((breath = Math.sin((k / n) * TAU)), (bob = breath * 0.8));
    if (nm === "move") {
      const ph = (k / n) * TAU;
      legs = gait(ph, 0.42, 0.9);
      bob = Math.abs(Math.cos(ph)) * 2.6;
      nA = [1.45 - Math.sin(ph) * 0.2, -0.45], fA = [1.75 + Math.sin(ph) * 0.25, 0.4];
      lean = 0.12;
    }
    if (nm === "wind") {
      const t = ease((k + 1) / n);
      nA = [lerp(1.45, -1.9, t), lerp(-0.5, -0.9, t)], lean = lerp(0.05, -0.25, t), headT = -0.2 * t, jaw = 0.6, bob = -t * 2;
      legs = [[PI / 2 - 0.3 * t, 0.2], [PI / 2 + 0.35 * t, 0.3 * t]];
    }
    if (nm === "atk") {
      nA = [[-0.6, -0.5], [0.55, 0.2], [0.85, 0.35]][k], lean = [0.2, 0.45, 0.5][k], jaw = 1, bob = [0, 3, 4][k];
      legs = [[PI / 2 - 0.55, 0.5], [PI / 2 + 0.45, 0.2]];
    }
    if (nm === "rec") ((nA = [0.85 - k * 0.2, 0.3 - k * 0.2]), (lean = 0.45 - k * 0.12), (bob = 3 - k));
    if (nm === "hurt") ((lean = -0.25), (headT = -0.4), (jaw = 0.8));
    if (nm === "stomp") ((lift = [0.5, 1, 0, 0][k]), (lean = [-0.05, -0.1, 0.15, 0.1][k]), (fA = [1.2, 0.2]), (jaw = 0.8), (bob = k === 2 ? 3 : 0));
    if (nm === "roar") ((headT = [-0.3, -0.5, -0.5, -0.2][k]), (jaw = [0.6, 1.2, 1.2, 0.6][k]), (nA = [[-0.3, 0.2], [-0.6, 0.3], [-0.6, 0.3], [0.2, 0]][k]), (fA = [[2.6, 0.2], [3, 0.2], [3, 0.2], [2.2, 0.3]][k]), (lean = -0.15));
    const hip = [cx + lean * 3, G - 27 + bob * 0.4, 0];
    // 먼 다리
    leg(M, add(hip, [-2, 0, -7]), legs[1][0], 13, legs[1][1], 13, 6.6, 5.6, OSKIND, OSKIND, 6);
    // 먼 팔
    const ch = add(hip, rot2([2, -26], lean)), fs = add(ch, rot2([-3, -6, -10], lean));
    const [, fh] = arm(M, fs, fA[0], 13, fA[1], 12, 5.4, 4.8, OSKIND);
    M.sphere(fh, 4.4, OSKIND);
    // 몸: 큰 배 · 가슴 · 가죽 끈 · 털 허리 두르개
    M.ell(add(hip, rot2([2, -14, 1], lean)), [17, 16, 14], OSKIN, lean);
    M.ell(ch, [15, 11, 13], OSKIN, lean);
    M.ell(add(hip, rot2([6, -12 + breath * 0.6, 7], lean)), [9, 9, 5], OSKIN, lean);
    M.cap(add(ch, rot2([-10, -6, 11], lean)), add(ch, rot2([8, 14, 13], lean)), 1.6, 1.6, STRAP);
    M.ell(add(hip, rot2([1, -2, 0], lean)), [16, 6, 14], OFUR, lean);
    for (let i = 0; i < 5; i++) M.ell(add(hip, rot2([-10 + i * 5, 4 + (i % 2) * 2, 12], lean)), [3, 5, 1.6], OFUR, lean + (i - 2) * 0.1);
    M.cap(add(hip, rot2([-14, -6, 11], lean)), add(hip, rot2([14, -7, 11], lean)), 1.8, 1.8, STRAP);
    // 앞 다리
    const nl = lift ? [[PI / 2 - 1.1 * lift, 1.6 * lift]] : [legs[0]];
    leg(M, add(hip, [3, 0, 7]), nl[0][0], 13, nl[0][1], 13, 7, 6, OSKIN, OSKIND, 6.4);
    // 머리: 작고 대머리, 아래턱이 튀어나와 엄니가 위로
    const ha = lean * 0.5 + headT, hd = add(ch, rot2([10, -13 + headT * 4, 4], lean * 0.5));
    M.ell(add(hd, rot2([-2, 5, 0], ha)), [6, 5, 6], OSKIN, ha);
    M.ell(hd, [7.4, 7, 7], OSKIN, ha);
    M.ell(add(hd, rot2([3, -3, 4.5], ha)), [5, 1.8, 3], OSKIND, ha);
    const jw = add(hd, rot2([4, 4 + jaw * 2, 3], ha + jaw * 0.15));
    M.ell(jw, [5, 2.6, 5], OSKIN, ha);
    jaw > 0.5 && M.ell(add(hd, rot2([5, 2.6 + jaw, 5], ha)), [3.4, jaw * 1.4, 1], MOUTH, ha);
    M.cap(add(jw, rot2([1, -1, 4.6], ha)), add(jw, rot2([1.6, -5, 5], ha)), 1.2, 0.4, TUSK);
    M.cap(add(jw, rot2([4, -1, 3], ha)), add(jw, rot2([4.6, -4.5, 3.2], ha)), 1, 0.3, TUSK);
    M.cap(add(hd, rot2([5.5, -1, 5], ha)), add(hd, rot2([8, 1, 5.2], ha)), 1.6, 1.2, OSKIN);
    M.sphere(add(hd, rot2([3, -1.6, 6.6], ha)), 1.1, OEYE);
    M.sphere(add(hd, rot2([6.2, -1.6, 3], ha)), 0.9, OEYE);
    M.cap(add(hd, rot2([-3, -6, 0], ha)), add(hd, rot2([-7, -11, -1], ha - 0.4)), 2, 0.8, MANE);
    M.cap(add(hd, rot2([-4, -1, 6], ha)), add(hd, rot2([-6, -3, 7], ha)), 1.6, 0.8, OSKIND);
    // 가까운 팔 + 쇠못 몽둥이
    const ns = add(ch, rot2([1, -6, 11], lean));
    const [el, hn] = arm(M, ns, nA[0], 13, nA[1], 12, 6, 5.2, OSKIN);
    M.sphere(add(ns, [0, 0, 1]), 6.4, OSKIN);
    if (club) {
      const d = dirOf(el, hn), L = 34, end = add(hn, [d[0] * L, d[1] * L, 1]);
      M.cap(add(hn, [-d[0] * 4, -d[1] * 4, 1]), end, 2.4, 6.4, WOODC);
      for (let i = 0; i < 5; i++) {
        const t = 0.5 + i * 0.11, p = add(hn, [d[0] * L * t, d[1] * L * t, 1]), off = [-d[1], d[0]];
        M.cap(add(p, [off[0] * 4, off[1] * 4, 2]), add(p, [off[0] * 8, off[1] * 8, 3]), 1.2, 0.2, IRON);
        M.cap(add(p, [-off[0] * 4, -off[1] * 4, 2]), add(p, [-off[0] * 8, -off[1] * 8, 2.4]), 1.2, 0.2, IRON);
      }
      M.cap(add(hn, [d[0] * 6, d[1] * 6, 1]), add(hn, [d[0] * 8, d[1] * 8, 1]), 3.2, 3.2, STRAP);
    }
    M.sphere(hn, 4.8, OSKIN);
  },
};

// ════ [정예] 켄타우로스 사냥꾼 ════ 거리를 두고 활 세 발, 가까우면 앞발로 짓밟고 들판을 가로질러 돌진
export const centaur = {
  fw: 106, fh: 92, w: 32, h: 46,
  anims: { idle: [6, 6], move: [8, 15], aim: [3, 8, !1], shoot: [3, 14, !1], rear: [4, 10, !1], hurt: [2, 10, !1] },
  model(M, nm, k, n) {
    const G = 89, cx = 50;
    let bob = 0, ph = 0, tilt = 0, draw = 0, bowUp = 0.15, rear = 0, tailS = Math.sin((k / Math.max(1, n)) * TAU), hairS = 0, headT = 0;
    if (nm === "idle") bob = Math.sin((k / n) * TAU) * 0.8;
    if (nm === "move") ((ph = (k / n) * TAU), (bob = Math.abs(Math.cos(ph)) * 3), (tilt = Math.sin(ph) * 0.05), (hairS = 1));
    if (nm === "aim") ((draw = (k + 1) / n), (bowUp = 0.05));
    if (nm === "shoot") ((draw = [0, 0, 0][k]), (bowUp = [0.02, 0.05, 0.1][k]));
    if (nm === "rear") ((rear = [0.5, 1, 1, 0.3][k]), (tilt = -0.42 * [0.5, 1, 1, 0.3][k]));
    if (nm === "hurt") ((tilt = -0.12), (headT = -0.35));
    const b = [cx - 6, G - 31 - bob, 0];
    const chest = add(b, rot2([16, -1], tilt)), hind = add(b, rot2([-16, 0], tilt));
    // 뒤쪽 다리 (어둡게, 흰 양말)
    if (rear) {
      qleg(M, add(hind, [0, 6, -5]), PI * 0.2, 27, 3.8, HORSED, HOOF, !0, 1, SOCK);
      const kn = add(chest, rot2([4, 9, -5], tilt)), ft = add(kn, rot2([8 * rear, -6 * rear + 6, 0], tilt));
      M.cap(add(chest, [0, 6, -5]), kn, 3.4, 2.6, HORSED).cap(kn, ft, 2.6, 2, SOCK).ell(add(ft, [1, 0, 0]), [2.6, 1.8, 2.2], HOOF);
    } else {
      qleg(M, add(chest, [0, 6, -5]), ph + PI, 27, 3.4, HORSED, HOOF, !1, 1.2, SOCK);
      qleg(M, add(hind, [0, 6, -5]), ph + PI * 0.55, 27, 3.8, HORSED, HOOF, !0, 1.2, SOCK);
    }
    // 꼬리 (흘러내리는 털)
    const t0 = add(hind, rot2([-9, -4], tilt));
    for (let i = 0; i < 4; i++) M.cap(add(t0, [0, 0, i - 1.5]), add(t0, [-8 - i, 12 + tailS * 2 + i * 1.5, i - 1.5]), 2.2, 1, MANE);
    // 말 몸통
    M.ell(hind, [10, 10, 9], HORSE, tilt);
    M.ell(b, [17, 9, 9], HORSE, tilt);
    M.ell(chest, [9, 10, 8.6], HORSE, tilt);
    M.ell(add(b, rot2([0, 6, 3], tilt)), [14, 3, 6], HORSED, tilt);
    // 안장 대신 가죽 띠 + 화살통
    M.cap(add(b, rot2([6, -9, 9], tilt)), add(b, rot2([6, 8, 9.5], tilt)), 1.4, 1.4, LEATH);
    const qv = add(hind, rot2([4, -11, 5], tilt));
    M.cap(qv, add(qv, rot2([-6, -10, 0], tilt - 0.3)), 2.6, 2.8, LEATHD);
    for (let i = 0; i < 3; i++) M.ell(add(qv, rot2([-7 + i * 1.2, -12 - i * 0.5, i - 1], tilt - 0.3)), [1.2, 2.6, 1], FLETCH, tilt - 0.5);
    // 앞쪽 다리
    if (rear) {
      qleg(M, add(hind, [0, 6, 5]), PI * 1.6, 27, 4.2, HORSE, HOOF, !0, 1, SOCK);
      const kn = add(chest, rot2([6, 8, 5], tilt)), ft = add(kn, rot2([10 * rear, -4 * rear + 7, 0], tilt));
      M.cap(add(chest, [1, 6, 5]), kn, 3.8, 2.8, HORSE).cap(kn, ft, 2.8, 2.2, SOCK).ell(add(ft, [1, 0, 0]), [2.8, 2, 2.4], HOOF);
    } else {
      qleg(M, add(chest, [1, 6, 5]), ph, 27, 3.8, HORSE, HOOF, !1, 1.2, SOCK);
      qleg(M, add(hind, [0, 6, 5]), ph + PI * 1.55, 27, 4.2, HORSE, HOOF, !0, 1.2, SOCK);
    }
    // 사람 몸 (말 가슴에서 솟는다)
    const ta = tilt + rear * 0.15, waist = add(chest, rot2([4, -8, 0], tilt)), tor = add(waist, rot2([2, -9, 1], ta));
    M.ell(waist, [7, 5, 6.5], SKIN, ta);
    M.ell(tor, [7, 9, 6.4], SKIN, ta);
    M.ell(add(tor, rot2([0.5, 1, 1], ta)), [7.4, 8, 6.6], VEST, ta);
    M.ell(add(tor, rot2([1, -6, 5], ta)), [4.6, 3.2, 3], LEATH, ta - 0.2);
    // 먼 팔: 활을 앞으로 내민다
    const fs = add(tor, rot2([1, -6, -5], ta)), bowA = -bowUp;
    const [, fh] = arm(M, fs, bowA, 9, bowA, 8, 2.4, 2, SKIND);
    // 활 (위아래로 휜 막대 + 시위)
    const bowTop = add(fh, [-2 - draw * 1.5, -15, 1]), bowBot = add(fh, [-2 - draw * 1.5, 15, 1]), mid = add(fh, [1.5, 0, 1]);
    M.cap(bowTop, add(mid, [0, -7, 0]), 0.9, 1.3, BOWW).cap(add(mid, [0, -7, 0]), add(mid, [0, 7, 0]), 1.3, 1.3, BOWW).cap(add(mid, [0, 7, 0]), bowBot, 1.3, 0.9, BOWW);
    const nock = add(tor, rot2([2 - draw * 9, -6, 6], ta));
    M.cap(bowTop, nock, 0.3, 0.3, STRING).cap(nock, bowBot, 0.3, 0.3, STRING);
    if (draw > 0.3) M.cap(nock, add(fh, [5, 0, 2]), 0.5, 0.5, BOWW).cap(add(fh, [4, -0.8, 2]), add(fh, [7, 0, 2]), 1, 0.2, BLADE);
    // 머리: 머리띠 · 뒤로 날리는 꽁지머리
    const ha = ta * 0.5 + headT, hd = add(tor, rot2([2, -14, 2], ta));
    M.cap(add(tor, rot2([1, -8, 1], ta)), hd, 2.6, 2.4, SKIN);
    M.sphere(hd, 5.4, SKIN);
    M.ell(add(hd, rot2([-1, -2.4, 0], ha)), [5.8, 3.6, 5.8], HAIR, ha);
    M.cap(add(hd, rot2([-4, -1, 0], ha)), add(hd, rot2([-12 - hairS * 2, 4 + Math.sin(k) * hairS * 2, -1], ha)), 2.2, 0.8, HAIR);
    M.cap(add(hd, rot2([-5, -2.2, 4.4], ha)), add(hd, rot2([4, -2.6, 4.4], ha)), 0.7, 0.7, CLOTH);
    M.sphere(add(hd, rot2([2.6, -0.6, 4.6], ha)), 0.9, EYEB);
    M.sphere(add(hd, rot2([4.8, -0.6, 1.6], ha)), 0.7, EYEB);
    M.cap(add(hd, rot2([4, 0, 3], ha)), add(hd, rot2([6, 1.6, 3], ha)), 1, 0.7, SKIN);
    // 가까운 팔: 시위를 당긴다
    const ns = add(tor, rot2([1, -6, 6], ta));
    const nh = add(nock, [0, 0, 0.5]);
    const el = add(ns, rot2([-3 - draw * 3, 5 - draw * 3, 1], ta));
    M.cap(ns, el, 2.6, 2.2, SKIN).cap(el, nh, 2.2, 1.8, SKIN);
    M.sphere(nh, 1.8, SKIN);
    M.sphere(add(ns, [0, 0, 1]), 3, LEATH);
  },
};
