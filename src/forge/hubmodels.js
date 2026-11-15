// 거점 건물 3D 모델 (몬스터와 같은 3D→픽셀 렌더러). 예전 2D 그림을 대신한다.
// 좌표: x 오른쪽, y 아래, z 보는 사람 쪽. B = 땅선
import { mat, model, render } from "./foes/r3d.js";

const H = (a, b, c = 0) => {
  let x = (a * 374761393 + b * 668265263 + c * 1274126177) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
};
// 여러 조각을 한 덩어리로 (조각 사이에 안쪽 외곽선이 생기지 않게)
let GS = 50000;
function grp(M, fn) {
  const n0 = M.prims.length, s = GS++;
  fn();
  for (let i = n0; i < M.prims.length; i++) M.prims[i].s = s;
}
function bake(w, h, build) {
  const M = model();
  const lights = [];
  build(M, lights);
  const buf = render(M, w, h, {});
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const img = new ImageData(w, h);
  new Uint32Array(img.data.buffer).set(buf);
  c.getContext("2d").putImageData(img, 0, 0);
  return { c, w, h, lights };
}
// 재질
const WOOD = mat(0x8a5a30, { tex: (u, v) => Math.sin(u * 0.9 + Math.sin(v * 0.3) * 2) * 0.35 + (H(Math.floor(u), 7) - 0.5) * 0.2, rim: 0.4 });
const WOODD = mat(0x5a3418, { tex: (u, v) => Math.sin(u * 0.9 + v * 0.2) * 0.3 });
const PLANK = mat(0xa87040, { tex: (u, v) => (Math.floor(u / 7) % 2 ? 0.18 : -0.12) + Math.sin(v * 0.8) * 0.1 });
const STONE = mat(0x8a8478, { tex: (u, v) => { const a = Math.floor(u / 9 + (Math.floor(v / 6) % 2) * 0.5), b = Math.floor(v / 6); return (H(a, b) - 0.5) * 0.7 + ((u + (b % 2) * 4.5) % 9 < 1 || v % 6 < 1 ? -0.6 : 0); } });
const STEEL = mat(0xc0c4d0, { spec: 0.8, shin: 60, hi: 0xffffff });
const GOLD = mat(0xd8b050, { spec: 0.7, shin: 40 });
const CLOTH = (c) => mat(c, { tex: (u, v) => Math.sin(u * 0.7) * 0.15 + Math.sin(v * 0.5) * 0.12, rim: 0.4 });
const GLOW = (c) => mat(c, { emit: c });
const SAND = mat(0xc8a070, { tex: (u, v) => (H(Math.floor(u), Math.floor(v)) - 0.5) * 0.4 });
const STRAW = mat(0xd8b060, { tex: (u, v) => Math.sin(u * 3 + v * 0.4) * 0.35 });

// ════ 장비 관리소: 줄무늬 큰 천막 ════
export function wardrobe3d() {
  return bake(180, 170, (M, L) => {
    const B = 165, cx = 90;
    const stripe = (a, b) => mat(a, { tex: (u, v, w) => (Math.floor(((Math.atan2(w, u) + Math.PI) / (Math.PI * 2)) * 18) % 2 ? 0.0 : 0.001), rim: 0.45, rimCol: 0xffe0b0 });
    const ST = (u, w) => Math.floor(((Math.atan2(w, u) + Math.PI) / (Math.PI * 2)) * 18) % 2;
    const GREEN = mat(0x2a7a5a, { rim: 0.45, rimCol: 0xffd8a0 }), CREAM = mat(0xe8d8b0, { rim: 0.45, rimCol: 0xffe0b0 });
    void stripe;
    // 줄무늬를 위해 각 원판을 두 재질의 조각(쐐기)으로: 각도별로 작은 타원을 촘촘히
    // 고리 하나 = 타원 한 개. 줄무늬는 점마다 각도로 재질을 고른다 (조각 없이 매끈하게)
    const SEED = { w: GS++, r: GS++ };
    const pick = (x, y, z) => (Math.floor(((Math.atan2(z, x) + Math.PI) / (Math.PI * 2)) * 18) % 2 ? GREEN : CREAM);
    const ring = (y, r, thick, part) => {
      M.ell([cx, y, 0], [r, thick, r * 0.7], CREAM, 0);
      const p = M.prims[M.prims.length - 1];
      p.pick = pick;
      p.s = SEED[part];
    };
    // 그림자 쪽 받침
    M.ell([cx, B - 1, 0], [74, 3, 40], mat(0x3a2a20));
    // 벽: 곧게 선 원통
    for (let y = B - 8; y > B - 56; y -= 1.5) ring(y, 66, 8, "w");
    // 처마 장식(물결 술)
    for (let i = 0; i < 22; i++) {
      const a = Math.PI * (0.05 + (i / 21) * 0.9), x = Math.cos(a) * 70, z = Math.sin(a) * 70 * 0.7;
      M.sphere([cx + x, B - 58, z + 2], 4, i % 2 ? GREEN : CREAM);
    }
    // 지붕: 꼭대기로 좁아지는 원뿔
    for (let k = 0; k <= 60; k++) {
      const t = k / 60, y = B - 62 - t * 76, r = 74 * (1 - t) ** 1.15 + 2;
      ring(y, r, 5, "r");
    }
    // 입구: 안에서 새는 따뜻한 빛 + 걷어 올린 천
    M.ell([cx, B - 26, 48], [14, 26, 2], GLOW(0xffc070));
    M.ell([cx, B - 18, 49], [10, 18, 2], GLOW(0xffe0a0));
    M.ell([cx - 16, B - 34, 50], [6, 30, 3], GREEN, 0.25);
    M.ell([cx + 16, B - 34, 50], [6, 30, 3], GREEN, -0.25);
    L.push([cx, B - 30, 50]);
    // 깃대 + 깃발
    M.cap([cx, B - 136, 0], [cx, B - 158, 0], 1.6, 1.4, WOODD);
    M.ell([cx + 8, B - 154, 0], [8, 4, 1], mat(0xd8b040), 0.1);
    // 옷걸이 (왼쪽): 나무 틀 + 걸린 옷 셋
    M.cap([12, B, 30], [12, B - 68, 30], 1.8, 1.6, WOOD).cap([40, B, 30], [40, B - 68, 30], 1.8, 1.6, WOOD).cap([10, B - 68, 30], [42, B - 68, 30], 1.6, 1.6, WOOD);
    [0xa83a3a, 0x3a6aa8, 0x6a8a3a].forEach((c, k) => {
      const x = 17 + k * 9;
      M.ell([x, B - 54, 31], [4, 12, 3], CLOTH(c));
      M.ell([x, B - 64, 31], [4.5, 2, 3], CLOTH(c));
    });
    // 궤짝 둘 (오른쪽, 비스듬히)
    for (const [x, z] of [[134, 36], [158, 26]]) {
      M.box([x, B - 9, z], [10, 9, 8], PLANK, 0, 0.35);
      M.box([x, B - 17, z], [10.5, 1.4, 8.5], GOLD, 0, 0.35);
      M.box([x, B - 9, z + 7], [2, 2, 1], GOLD, 0, 0.35);
    }
  });
}

// ════ 훈련소: 모래 마당, 울타리, 과녁, 짚 허수아비, 무기 거치대, 깃발 ════
export function training3d() {
  return bake(240, 150, (M, L) => {
    const B = 145;
    M.ell([120, B - 1, 0], [118, 3, 30], SAND);
    // 깃발 장대 (뒤)
    for (const [x, c] of [[30, 0xc83a2a], [118, 0x2a6ab8]]) {
      M.cap([x, B, -12], [x, B - 112, -12], 1.8, 1.4, WOODD);
      M.sphere([x, B - 113, -12], 2.2, GOLD);
      for (let i = 0; i < 6; i++) M.ell([x + 4 + i * 3.4, B - 96 + Math.sin(i * 0.9) * 1.5, -12], [2.2, 12 - i * 0.6, 1], CLOTH(c), 0.05);
    }
    // 울타리 (뒤쪽 줄)
    for (let x = 6; x < 236; x += 18) M.cap([x, B, -6], [x, B - 34, -6], 2.6, 2.4, WOOD);
    M.box([120, B - 28, -4], [116, 2, 1.6], PLANK);
    M.box([120, B - 14, -4], [116, 2, 1.6], PLANK);
    // 무기 거치대 + 칼·창
    M.box([78, B - 44, 4], [18, 1.6, 2], WOOD);
    M.cap([62, B, 4], [62, B - 44, 4], 1.6, 1.6, WOOD).cap([94, B, 4], [94, B - 44, 4], 1.6, 1.6, WOOD);
    for (let k = 0; k < 4; k++) {
      const x = 68 + k * 7;
      M.cap([x, B - 4, 6], [x, B - 54 + (k % 2) * 6, 6], 1, 0.4, k % 2 ? WOOD : STEEL);
      M.box([x, B - 40, 7], [3, 0.8, 1], GOLD);
    }
    // 짚 허수아비 (가운데)
    M.cap([142, B, 8], [142, B - 30, 8], 1.6, 1.6, WOODD);
    M.ell([142, B - 38, 8], [8, 11, 6], STRAW);
    M.cap([130, B - 44, 9], [154, B - 44, 9], 2.4, 2.4, STRAW);
    M.sphere([142, B - 54, 9], 6, mat(0xe8d8b0, { tex: (u, v) => Math.sin(u * 2 + v) * 0.15 }));
    M.cap([138, B - 50, 15], [146, B - 58, 15], 0.8, 0.8, mat(0x8a2a1a)).cap([138, B - 58, 15], [146, B - 50, 15], 0.8, 0.8, mat(0x8a2a1a));
    // 과녁 (오른쪽, 다리 셋)
    const T = mat(0xf0e8d8, { tex: (u, v) => (Math.floor(Math.hypot(u, v) / 3.2) % 2 ? 0.0 : 0.0001) });
    void T;
    M.cap([196, B, 4], [200, B - 66, 2], 1.8, 1.6, WOODD).cap([206, B, 4], [202, B - 66, 2], 1.8, 1.6, WOODD);
    for (let r = 5; r >= 1; r--) M.ell([200, B - 70, 6 + (5 - r) * 0.6], [r * 3.2, r * 3.2, 2], r % 2 ? mat(0xc83a2a) : mat(0xf0e8d8), 0);
    M.cap([206, B - 74, 12], [218, B - 80, 12], 0.7, 0.5, WOOD);
    M.ell([219, B - 81, 12], [2, 1, 1], mat(0xe0e0e0));
    // 통과 상자
    M.ell([172, B - 9, 18], [7, 9, 7], mat(0x7a4a26, { tex: (u, v) => (Math.abs(v) > 5 && Math.abs(v) < 6.5 ? -0.6 : Math.sin(u) * 0.2) }));
    M.box([186, B - 7, 22], [7, 7, 7], PLANK, 0, 0.4);
  });
}

// ════ 기술 도장: 돌 기단, 나무 벽, 이중 기와지붕, 창호지 문, 등롱 ════
export function dojo3d() {
  return bake(200, 210, (M, L) => {
    const B = 205, cx = 100;
    const TILE = mat(0x2a6a4a, { tex: (u, v) => (Math.floor(u / 5) % 2 ? 0.15 : -0.1) + (Math.floor(v / 3) % 2 ? -0.15 : 0.05), rim: 0.5, rimCol: 0xffc8a0 });
    M.box([cx, B - 11, 0], [88, 11, 30], STONE, 0, 0.12);
    // 벽 + 기둥
    M.box([cx, B - 58, 0], [78, 36, 24], PLANK, 0, 0.12);
    for (const x of [24, 64, 136, 176]) M.cap([x, B - 22, 27], [x, B - 96, 27], 3.4, 3.4, mat(0x7a2a1a));
    // 창호지 미닫이 문 (빛)
    const SHOJI = mat(0xfff0c8, { emit: 0xffe0a0, tex: (u, v) => ((((u % 7) + 7) % 7 < 1) || (((v % 9) + 9) % 9 < 1) ? -1 : 0) });
    for (let k = 0; k < 2; k++) M.box([cx - 13 + k * 26, B - 54, 26], [12, 32, 1], SHOJI);
    M.box([cx, B - 54, 26.5], [1.2, 33, 1.2], mat(0x5a2a1a));
    L.push([cx - 13, B - 40, 30], [cx + 13, B - 40, 30]);
    // 아래 지붕 (끝이 들린 처마)
    grp(M, () => { for (let k = 0; k < 9; k++) M.box([cx, B - 96 - k * 2.6, 4 - k * 0.5], [100 - k * 5.5, 1.8, 38 - k * 3], TILE); });
    M.cap([2, B - 100, 30], [-4, B - 112, 32], 3, 1, TILE).cap([198, B - 100, 30], [204, B - 112, 32], 3, 1, TILE);
    M.box([cx, B - 94, 40], [98, 1.6, 2], mat(0x1a3a2a));
    // 위층 회벽 + 창
    M.box([cx, B - 126, 0], [44, 12, 18], mat(0xe8dcc0, { tex: (u, v) => (H(Math.floor(u / 3), Math.floor(v / 3)) - 0.5) * 0.15 }));
    for (const x of [cx - 20, cx + 20]) M.box([x, B - 126, 18.5], [5, 5, 1], GLOW(0xffc070));
    // 위 지붕
    grp(M, () => { for (let k = 0; k < 10; k++) M.box([cx, B - 142 - k * 2.4, 2 - k * 0.4], [66 - k * 4.2, 1.7, 28 - k * 2.2], TILE); });
    M.cap([36, B - 146, 24], [30, B - 158, 26], 2.6, 0.8, TILE).cap([164, B - 146, 24], [170, B - 158, 26], 2.6, 0.8, TILE);
    M.cap([cx - 44, B - 163, 2], [cx + 44, B - 163, 2], 3, 3, mat(0x1a4a3a));
    M.sphere([cx - 46, B - 165, 2], 4, GOLD).sphere([cx + 46, B - 165, 2], 4, GOLD);
    // 현판
    M.box([cx, B - 104, 44], [16, 8, 1.6], mat(0x3a1a10));
    M.box([cx, B - 104, 45.5], [13, 6, 0.4], GOLD);
    // 등롱 둘
    for (const x of [32, 168]) {
      M.cap([x, B - 98, 32], [x, B - 90, 32], 0.6, 0.6, mat(0x2a1a10));
      M.ell([x, B - 82, 32], [6, 8, 6], GLOW(0xff7040));
      M.box([x, B - 74, 32], [3, 1, 3], mat(0x2a1a10));
      L.push([x, B - 82, 26, 0xff6030]);
    }
  });
}

// ════ 기록 게시판: 지붕 달린 코르크판, 쪽지, 등불 ════
export function board3d() {
  return bake(150, 130, (M, L) => {
    const B = 125;
    const CORK = mat(0xb88050, { tex: (u, v) => (H(Math.floor(u), Math.floor(v)) - 0.5) * 0.6 });
    const ROOF = mat(0x8a3a28, { tex: (u, v) => (Math.floor(u / 5) % 2 ? 0.12 : -0.1) + (Math.floor(v / 3) % 2 ? -0.12 : 0.05), rim: 0.5 });
    M.cap([17, B, 0], [17, B - 104, 0], 3, 3, WOOD).cap([133, B, 0], [133, B - 104, 0], 3, 3, WOOD);
    M.box([75, B - 108, 0], [72, 6, 12], ROOF, 0, 0);
    M.box([75, B - 116, -2], [60, 4, 9], ROOF);
    M.box([75, B - 66, 2], [57, 36, 3], WOODD);
    M.box([75, B - 66, 4], [53, 32, 1.6], CORK);
    const notes = [[40, 44, 13, 15], [72, 46, 15, 11], [106, 42, 15, 17], [42, 78, 11, 10], [76, 74, 14, 13], [108, 80, 12, 9]];
    notes.forEach(([x, y, w, h], i) => {
      const lines = mat([0xf4e8c8, 0xe8dcb8, 0xfff4d8][i % 3], { tex: (u, v) => ((((v % 4) + 4) % 4) < 0.8 && Math.abs(u) < w - 3 ? -0.45 : 0) });
      M.box([x, B - 125 + y + h, 6.5], [w, h, 0.6], lines, (H(i, 2) - 0.5) * 0.12);
      M.sphere([x, B - 125 + y + 3, 7.6], 1.6, mat([0xd03030, 0x3060d0, 0x30a040][i % 3], { spec: 0.6 }));
    });
    // 등불
    M.cap([141, B - 105, 4], [141, B - 76, 4], 1, 1, mat(0x2a2a30));
    M.box([141, B - 66, 4], [5, 7, 5], mat(0x3a3a40));
    M.box([141, B - 66, 9.5], [3.4, 5, 0.6], GLOW(0xffd070));
    L.push([141, B - 66, 30]);
  });
}

// ════ 노점: 줄무늬 차양, 진열대, 물건 ════
export function stall3d(c1, c2, goods) {
  return bake(84, 74, (M) => {
    const B = 70;
    const AWN = mat(c1, { tex: (u, v, w) => 0, rim: 0.5 });
    void AWN;
    M.cap([6, B, 0], [6, B - 58, 0], 1.8, 1.8, WOODD).cap([78, B, 0], [78, B - 58, 0], 1.8, 1.8, WOODD);
    // 차양: 앞으로 늘어진 줄무늬 천 (조각마다 처짐)
    for (let i = 0; i < 10; i++) {
      const x = 6 + i * 8 + 4, m = i % 2 ? CLOTH(c2) : CLOTH(c1);
      M.box([x, B - 58, 2], [4, 3, 10], m, 0, 0);
      M.ell([x, B - 53, 12], [4.2, 4, 2], m, 0);
    }
    // 진열대
    M.box([42, B - 24, 6], [38, 3, 10], mat(0xb8844c));
    M.box([42, B - 10, 14], [36, 10, 1.5], PLANK);
    for (let k = 0; k < 7; k++) {
      const x = 12 + k * 10;
      if (goods === "fruit") M.sphere([x, B - 30, 8 + (k % 2) * 4], 3.4, mat([0xd83a2a, 0xf0a020, 0x6ab03a][k % 3], { spec: 0.6, shin: 30 }));
      else (M.cap([x, B - 28, 8], [x, B - 36, 8], 2.4, 2.4, mat([0x6a5aa8, 0x2aa8a8, 0xd84a8a][k % 3], { spec: 0.7, shin: 50 })), M.cap([x, B - 37, 8], [x, B - 40, 8], 1, 1, mat(0xd8c8b0)));
    }
  });
}
