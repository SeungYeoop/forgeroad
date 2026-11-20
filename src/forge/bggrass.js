// 초원 배경 (그래스메어): 맑은 하늘의 뭉게구름 · 멀리 눈 덮인 푸른 산맥 · 아득한 하늘섬 · 숲 띠
//   중경: 겹겹의 풀 언덕(풀밭 얼룩·결) + 나무 무리 · 근경: 진한 언덕 위 풀잎·들꽃·덤불
//   빛은 왼쪽 위, 멀수록 하늘색에 묻힌다. 가로 W 주기로 끝없이 이어진다
import * as G from "./bg3d.js";
const W = 640;
const mix = (a, b, t) => {
  t = Math.max(0, Math.min(1, t));
  const g = (s) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return (g(16) << 16) | (g(8) << 8) | g(0);
};
const sh = (c, f) => {
  const g = (s) => {
    const v = (c >> s) & 255;
    return Math.max(0, Math.min(255, Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f))));
  };
  return (g(16) << 16) | (g(8) << 8) | g(0);
};
const hash = (a, b, c = 0) => {
  let x = (a * 374761393 + b * 668265263 + c * 1274126177) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
};
const pn = (x, sc, seed) => {
  const n = Math.max(1, Math.round(W / sc)), fx = x / sc, i = Math.floor(fx), f = fx - i, u = f * f * (3 - 2 * f);
  const a = hash(((i % n) + n) % n, seed), b = hash((((i + 1) % n) + n) % n, seed);
  return a + (b - a) * u;
};
const pn2 = (x, y, sx, sy, seed) => {
  const n = Math.max(1, Math.round(W / sx)), fx = x / sx, fy = y / sy, ix = Math.floor(fx), iy = Math.floor(fy), u0 = fx - ix, v0 = fy - iy;
  const u = u0 * u0 * (3 - 2 * u0), v = v0 * v0 * (3 - 2 * v0);
  const H2 = (a, b) => hash(((a % n) + n) % n, b, seed);
  const a = H2(ix, iy), b = H2(ix + 1, iy), c = H2(ix, iy + 1), d = H2(ix + 1, iy + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};

// 풀 언덕: 비탈 방향으로 명암, 큰 얼룩(풀밭 색 차이), 잔결, 아래로 갈수록 살짝 어둡게, 꼭대기 1px 밝은 테
function meadow(B, o) {
  const { base, amp, col, skyC, haze = 0, seed = 1, sc = 120 } = o;
  const f = (x) => base - amp * (pn(x, sc, seed) * 0.7 + pn(x, sc / 3, seed + 3) * 0.3);
  const G5 = G.ramp5(col), alt = G.ramp5(o.alt ?? sh(col, 0.08));
  for (let x = 0; x < W; x++) {
    const y0 = Math.round(f(x)), slope = f(x + 2) - f(x - 2);
    for (let y = y0; y < B.h; y++) {
      const t = y - y0;
      // 비탈 명암은 능선 근처만 (아래까지 세로 띠가 생기지 않게), 깊을수록 디더링으로 조금씩 어둡게
      const rim = t < 10 + hash(x, 3, seed) * 6;
      let L = rim && slope < -0.35 ? 1 : rim && slope > 0.35 ? 3 : 2;
      if (t === 0) L = 0;
      else if (t < 2) L = Math.max(0, L - 1);
      const p = pn2(x, y * 2.2, 150, 60, seed + 11) + (hash(x, y, seed + 2) - 0.5) * 0.08;
      const R5 = p > 0.6 ? alt : G5;
      p < 0.26 && t > 3 && (L = Math.min(4, L + 1));
      t > 2 && hash(x, y, seed) > 0.93 && (L = Math.min(4, L + 1));
      t > 2 && hash(x, y, seed + 1) < 0.04 && (L = Math.max(0, L - 1));
      t > 40 + hash(x, y, seed + 5) * 30 && (L = Math.min(4, L + 1));
      t > 120 + hash(x, y, seed + 6) * 30 && (L = 4);
      B.put(x, y, mix(R5[L], skyC, haze * (1 - Math.min(1, t / 160) * 0.35)));
    }
  }
  return f;
}
// 먼 숲 띠: 둥근 나무 꼭대기가 이어진 낮은 띠
function treeline(B, base, col, skyC, seed) {
  const R5 = G.ramp5(col);
  for (let x = 0; x < W; x++) {
    const crown = 5 + 5 * pn(x, 7, seed) + 3 * pn(x, 23, seed + 1);
    const y0 = Math.round(base - crown);
    for (let y = y0; y < B.h; y++) {
      const t = y - y0;
      let L = t === 0 ? 1 : t < 3 && pn(x, 7, seed) > 0.55 ? 1 : t > 8 ? 3 : 2;
      B.put(x, y, mix(R5[L], skyC, 0.35));
    }
  }
}
function trees(B, f, n, sz, leaf, trunk, haze, skyC, R, seed) {
  for (let g = 0; g < n; g++) {
    const x0 = R(0, W), k = R(1, 3);
    for (let i = 0; i < k; i++) {
      const x = x0 + i * R(10, 18) * sz, gy = Math.round(f(((x % W) + W) % W)) + 3;
      const kind = hash(g, i, seed) < 0.18 ? "pine" : "round";
      [-W, 0, W].forEach((dx) => G.tree(B, x + dx, gy, sz * (0.8 + hash(g, i, seed + 1) * 0.6), kind === "pine" ? sh(leaf, -0.2) : leaf, trunk, kind, haze, skyC));
    }
  }
}

export function paintGrass(T, S, E, h) {
  const B = G.buffer(W, T.h ?? 360);
  const skyC = E.sky[1], seed = h.int(1, 9999);
  const R = (a, b) => h.int(a, b);
  const each = (x, fn) => [-W, 0, W].forEach((dx) => fn(x + dx));
  const grass = E.top, deep = mix(E.top, E.near, 0.45), trunk = 0x6a4a30;
  if (S === 0) {
    // 뭉게구름 (크고 둥글게, 아래는 하늘빛 그늘)
    const light = mix(skyC, 0xffffff, 0.88), shade = mix(E.sky[0], skyC, 0.62);
    for (let i = 0; i < 5; i++) {
      const x = R(0, W), y = R(46, 150), s = 1 + h.next() * 0.9;
      each(x, (xx) => G.cloud(B, xx, y, s, light, shade, 245, seed + i));
    }
    // 아득한 하늘섬 (이 구역 위 하늘섬이 멀리 보이는 느낌)
    for (let i = 0; i < 2; i++) {
      const x = R(0, W), y = R(120, 175), w = R(24, 40);
      each(x, (xx) => G.island(B, xx, y, w, grass, E.rock, (c) => mix(c, skyC, 0.68), seed + 70 + i));
    }
    G.mountains(B, { base: 304, amp: 165, col: E.far, skyC, haze: 0.5, snow: 1, seed, sc: 130 });
    G.mountains(B, { base: 320, amp: 92, col: mix(E.far, E.mid, 0.4), skyC, haze: 0.34, snow: 0, seed: seed + 50, sc: 80 });
    treeline(B, 332, mix(E.mid, E.far, 0.3), skyC, seed + 9);
    B.toHt(T);
    return;
  }
  if (S === 1) {
    const fb = meadow(B, { base: 322, amp: 48, col: mix(grass, E.far, 0.28), alt: mix(sh(grass, 0.1), E.far, 0.28), skyC, haze: 0.26, seed: seed + 3, sc: 160 });
    trees(B, fb, 4, 0.8, mix(deep, E.far, 0.3), trunk, 0.32, skyC, R, seed + 4);
    const ff = meadow(B, { base: 344, amp: 42, col: grass, alt: sh(grass, 0.12), skyC, haze: 0.1, seed: seed + 5, sc: 110 });
    trees(B, ff, 6, 1.25, deep, trunk, 0.1, skyC, R, seed + 6);
    B.toHt(T);
    return;
  }
  // ── 근경 ──
  const f = meadow(B, { base: 356, amp: 26, col: mix(grass, E.near, 0.35), alt: mix(sh(grass, 0.06), E.near, 0.3), skyC, haze: 0, seed: seed + 7, sc: 90 });
  // 덤불
  for (let i = 0; i < 12; i++) {
    const x = R(0, W), gy = Math.round(f(x)) + 4, r = R(6, 12), L5 = G.ramp5(mix(grass, E.near, 0.15));
    each(x, (xx) => (G.ball(B, xx, gy - r * 0.5, r, L5), G.ball(B, xx + r * 0.8, gy - r * 0.2, Math.round(r * 0.7), L5)));
  }
  // 작은 바위
  for (let i = 0; i < 4; i++) {
    const x = R(0, W), gy = Math.round(f(x)) + 3, r = R(3, 6);
    each(x, (xx) => G.ball(B, xx, gy - r * 0.4, r, G.ramp5(E.rock)));
  }
  // 풀잎 (능선 위로 1~4px)
  const blade = [sh(grass, 0.25), grass, E.topHi ?? sh(grass, 0.4)];
  for (let x = 0; x < W; x++) {
    if (hash(x, 5, seed) < 0.45) continue;
    const y0 = Math.round(f(x)), hgt = 1 + Math.floor(hash(x, 6, seed) * 4);
    for (let k = 1; k <= hgt; k++) B.put(x + (k > 2 && hash(x, 7, seed) > 0.5 ? 1 : 0), y0 - k, blade[k === hgt ? 2 : hash(x, k, seed) > 0.5 ? 0 : 1]);
  }
  // 들꽃
  const FL = [0xffffff, 0xffe070, 0xff9ab8, 0xc8a8ff, 0xffb060];
  for (let i = 0; i < 70; i++) {
    const x = R(0, W), y = Math.round(f(x)) + R(1, 9), c = FL[i % FL.length];
    each(x, (xx) => (B.put(xx, y, c), B.put(xx, y + 1, sh(grass, -0.3)), hash(i, 9, seed) > 0.6 && B.put(xx + 1, y, sh(c, -0.15))));
  }
  B.toHt(T);
}
