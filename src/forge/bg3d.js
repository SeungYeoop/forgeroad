// 배경 전면 리메이크: 3D를 픽셀로 옮긴 원경·중경·근경
// 모든 도형은 왼쪽 위 빛으로 5단계 명암을 주고, 멀수록 하늘색에 묻힌다(대기 원근). 가로로 끝없이 이어지도록(W 주기) 그린다.
const sh = (c, f) => {
  const g = (s) => {
    const v = (c >> s) & 255;
    return Math.max(0, Math.min(255, Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f))));
  };
  return (g(16) << 16) | (g(8) << 8) | g(0);
};
const mix = (a, b, t) => {
  t = Math.max(0, Math.min(1, t));
  const g = (s) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return (g(16) << 16) | (g(8) << 8) | g(0);
};
const hash = (a, b, c = 0) => {
  let x = (a * 374761393 + b * 668265263 + c * 1274126177) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
};
export const ramp5 = (b) => [mix(sh(b, 0.42), 0xfff2d8, 0.18), sh(b, 0.17), b, mix(sh(b, -0.3), 0x3c2848, 0.2), mix(sh(b, -0.52), 0x24183a, 0.32), mix(sh(b, -0.74), 0x140c1e, 0.45)];
const lv = (I) => (I > 0.6 ? 0 : I > 0.2 ? 1 : I > -0.22 ? 2 : I > -0.6 ? 3 : 4);

// ── 버퍼 ──
export function buffer(w, h, wrap = !0) {
  const col = new Uint32Array(w * h), al = new Uint8Array(w * h);
  const B = {
    w, h, col, al,
    put(x, y, c, a = 255) {
      x = Math.round(x), y = Math.round(y);
      if (y < 0 || y >= h) return;
      if (wrap) x = ((x % w) + w) % w;
      else if (x < 0 || x >= w) return;
      const i = y * w + x;
      if (a >= 255 || al[i] === 0) ((col[i] = c), (al[i] = Math.max(al[i], a)));
      else ((col[i] = mix(col[i], c, a / 255)), (al[i] = Math.min(255, al[i] + a)));
    },
    has(x, y) {
      if (y < 0 || y >= h) return !1;
      x = wrap ? ((Math.round(x) % w) + w) % w : Math.round(x);
      return x >= 0 && x < w && al[y * w + x] > 0;
    },
    // 엔진 픽셀 버퍼로 옮기기
    toHt(T) {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; al[i] && T.px(x, y, col[i], al[i]); }
    },
    toCanvas() {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const x = c.getContext("2d"), img = x.createImageData(w, h);
      for (let i = 0; i < w * h; i++) {
        const v = col[i];
        img.data[i * 4] = (v >> 16) & 255;
        img.data[i * 4 + 1] = (v >> 8) & 255;
        img.data[i * 4 + 2] = v & 255;
        img.data[i * 4 + 3] = al[i];
      }
      x.putImageData(img, 0, 0);
      return c;
    },
  };
  return B;
}
// 주기 잡음 (가로 period 마다 반복)
const pn = (x, sc, period, seed) => {
  const n = Math.max(1, Math.round(period / sc)), fx = x / sc, i = Math.floor(fx), f = fx - i, u = f * f * (3 - 2 * f);
  const a = hash(((i % n) + n) % n, seed), b = hash((((i + 1) % n) + n) % n, seed);
  return a + (b - a) * u;
};
const pn2 = (x, y, sx, sy, period, seed) => {
  const n = Math.max(1, Math.round(period / sx)), fx = x / sx, fy = y / sy, ix = Math.floor(fx), iy = Math.floor(fy), u0 = fx - ix, v0 = fy - iy;
  const u = u0 * u0 * (3 - 2 * u0), v = v0 * v0 * (3 - 2 * v0);
  const H2 = (a, b) => hash(((a % n) + n) % n, b, seed);
  const a = H2(ix, iy), b = H2(ix + 1, iy), c = H2(ix, iy + 1), d = H2(ix + 1, iy + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};

// ── 하늘 그라데이션 (디더링으로 띠 없이) ──
export function sky(B, top, bot, mid) {
  for (let y = 0; y < B.h; y++) {
    const t = y / (B.h - 1);
    for (let x = 0; x < B.w; x++) {
      const d = ((x * 7 + y * 13) % 16) / 16 / 24;
      const c = mid ? (t < 0.55 ? mix(top, mid, (t + d) / 0.55) : mix(mid, bot, (t - 0.55 + d) / 0.45)) : mix(top, bot, t + d);
      B.put(x, y, c);
    }
  }
}
// ── 뭉게구름: 구 여러 개의 합집합, 구의 법선으로 명암 ──
export function cloud(B, x, y, s, light, shade, a = 255, seed = 1) {
  const R5 = [0xffffff, mix(light, 0xffffff, 0.55), light, mix(light, shade, 0.5), shade];
  const puffs = [];
  const n = 6 + Math.floor(hash(seed, 9) * 4);
  for (let k = 0; k < n; k++) {
    const u = (k / (n - 1)) * 2 - 1;
    puffs.push([u * 34 * s, -Math.cos(u * 1.4) * 12 * s - hash(seed, k) * 8 * s, (10 + (1 - Math.abs(u)) * 12 + hash(k, seed) * 5) * s]);
  }
  const x0 = Math.floor(-48 * s), x1 = Math.ceil(48 * s), y0 = Math.floor(-40 * s), y1 = Math.ceil(14 * s);
  for (let j = y0; j <= y1; j++)
    for (let i = x0; i <= x1; i++) {
      if (j > 8 * s) continue; // 바닥은 평평
      let best = -1, nx = 0, ny = 0, nz = 0;
      for (const [cx, cy, r] of puffs) {
        const dx = i - cx, dy = j - cy, d2 = (dx * dx + dy * dy) / (r * r);
        if (d2 < 1) {
          const z = Math.sqrt(1 - d2) * r;
          if (z + cy * -0.1 > best) ((best = z + cy * -0.1), (nx = dx / r), (ny = dy / r), (nz = Math.sqrt(1 - d2)));
        }
      }
      if (best < 0) continue;
      let L = lv(-nx * 0.5 - ny * 0.75 + nz * 0.25 + 0.15);
      j > 4 * s && (L = Math.max(L, 3));
      B.put(x + i, y + j, R5[Math.min(4, L)], a);
    }
}
// ── 면이 깎인 산맥: 능선 + 안쪽 주름(빛 면/그늘 면) + 눈 + 안개 ──
export function mountains(B, o) {
  const { base, amp, col, skyC, haze = 0.3, snow = 0, seed = 1, sc = 90, light = 0.2 } = o;
  const W = B.w;
  const f = (x) => base - amp * (pn(x, sc, W, seed) * 0.62 + pn(x, sc / 3, W, seed + 1) * 0.28 + Math.abs(pn(x, sc / 9, W, seed + 2) - 0.5) * 0.2);
  const R5 = ramp5(col), S5 = ramp5(0xeef4ff);
  const top = base - amp;
  for (let x = 0; x < W; x++) {
    const y0 = Math.round(f(x));
    for (let y = y0; y < B.h; y++) {
      // 주름: 기울어진 잡음의 좌우 변화로 면 방향
      const g = (xx) => pn2(xx + (y - y0) * 0.9, y * 0.35, 38, 44, W, seed + 5) + pn2(xx - (y - y0) * 0.6, y * 0.5, 16, 20, W, seed + 6) * 0.15;
      const d = g(x + 1) - g(x - 1);
      let L = d > 0.022 ? 1 : d > -0.008 ? 2 : d > -0.035 ? 3 : 4;
      y === y0 && (L = Math.max(0, L - 1));
      const depthK = (y - y0) / (B.h - top);
      depthK > 0.5 && (L = Math.min(4, L + 1));
      const snowLine = top + amp * 0.35 + (pn(x, 14, W, seed + 7) - 0.5) * 14;
      let c = snow && y < snowLine && y - y0 < 26 ? S5[Math.min(4, L)] : R5[L];
      c = mix(c, skyC, haze * (0.65 + 0.35 * Math.min(1, (y - top) / (B.h - top))));
      B.put(x, y, c);
    }
  }
  return f;
}
// ── 언덕 (중경·근경): 둥근 등성이, 위는 풀 ──
export function hills(B, o) {
  const { base, amp, col, top: grass, skyC, haze = 0, seed = 1, sc = 120 } = o;
  const W = B.w;
  const f = (x) => base - amp * (pn(x, sc, W, seed) * 0.7 + pn(x, sc / 3, W, seed + 3) * 0.3);
  const R5 = ramp5(col), G5 = grass ? ramp5(grass) : null;
  for (let x = 0; x < W; x++) {
    const y0 = Math.round(f(x)), slope = f(x + 2) - f(x - 2);
    for (let y = y0; y < B.h; y++) {
      const t = y - y0;
      let c;
      if (G5 && t < 7) c = t === 0 ? G5[1] : t < 3 ? G5[slope > 0 ? 1 : 2] : t < 6 ? G5[slope > 0 ? 2 : 3] : G5[4];
      else {
        // 둥근 돌 덩어리 결
        const n = pn2(x, y, 11, 8, W, seed + 9), n2 = pn2(x + 3, y + 2, 11, 8, W, seed + 9);
        let L = n - n2 > 0.04 ? 1 : n - n2 < -0.06 ? 3 : 2;
        t > 30 && (L = Math.min(4, L + 1));
        c = R5[L];
      }
      B.put(x, y, mix(c, skyC, haze));
    }
  }
  return f;
}
// ── 둥근 잎 덩어리 나무 / 침엽수 / 마른 나무 ──
export function tree(B, x, gy, s, leaf, trunk, kind = "round", haze = 0, skyC = 0) {
  const T5 = ramp5(trunk), L5 = ramp5(leaf), hz = (c) => (haze ? mix(c, skyC, haze) : c);
  const tw = Math.max(2, Math.round(3 * s));
  for (let j = 0; j < 20 * s; j++) for (let i = 0; i < tw; i++) B.put(x - tw / 2 + i, gy - j, hz(T5[i === 0 ? 1 : i === tw - 1 ? 4 : 2]));
  if (kind === "pine") {
    for (let k = 0; k < 4; k++) {
      const by = gy - 12 * s - k * 9 * s, w = (15 - k * 3) * s, hh = 15 * s;
      for (let j = 0; j < hh; j++) {
        const half = w * (j / hh);
        for (let i = -Math.ceil(half); i <= Math.ceil(half); i++) {
          const L = Math.abs(i) >= Math.ceil(half) ? 5 : i < -half * 0.4 ? 1 : i < 0 ? 2 : i < half * 0.5 ? 3 : 4;
          B.put(x + i, by - hh + j, hz(L5[j === hh - 1 && L < 5 ? Math.min(4, L + 1) : L]));
        }
      }
    }
    return;
  }
  if (kind === "dead") {
    const st = (x0, y0, x1, y1, t) => {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let k = 0; k <= n; k++) for (let i = 0; i < t; i++) B.put(x0 + ((x1 - x0) * k) / n + i, y0 + ((y1 - y0) * k) / n, hz(T5[i === 0 ? 1 : 3]));
    };
    st(x, gy, x, gy - 34 * s, 3), st(x, gy - 20 * s, x - 12 * s, gy - 30 * s, 2), st(x, gy - 26 * s, x + 10 * s, gy - 38 * s, 2);
    return;
  }
  const C = [[0, -30, 14], [-11, -21, 10], [11, -22, 11], [-5, -40, 9], [7, -37, 9]];
  for (const [dx, dy, r] of C) ball(B, x + dx * s, gy + dy * s, r * s, L5, hz);
}
// 구 하나 (잎 덩어리, 과일, 바위 등)
export function ball(B, cx, cy, r, R5, hz = (c) => c) {
  for (let j = -r; j <= r; j++)
    for (let i = -r; i <= r; i++) {
      const d = (i * i + j * j) / (r * r);
      if (d > 1) continue;
      const nz = Math.sqrt(1 - d);
      let L = lv(-(i / r) * 0.55 - (j / r) * 0.7 + nz * 0.3 - 0.1);
      d > 0.82 && (L = Math.min(5, L + 1));
      // 잎의 결 (작은 얼룩)
      hash(Math.round(cx + i), Math.round(cy + j), 3) > 0.9 && (L = Math.min(4, L + 1));
      B.put(cx + i, cy + j, hz(R5[L]));
    }
}
// 각진 덩어리 (탑·벽)
export function box(B, x, y, w, h, col, hz = (c) => c, o = {}) {
  const R5 = ramp5(col);
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      let L = 2;
      if (i === 0 || i === w - 1) L = 5;
      else if (i < Math.max(2, w * 0.3)) L = 1;
      else if (i > w * 0.75) L = 3;
      if (o.bricks && (j % 6 === 0 || (j % 12 < 6 ? i % 8 === 0 : i % 8 === 4))) L = Math.min(5, L + 1);
      B.put(x + i, y + j, hz(R5[L]));
    }
}
// 뿔 (지붕·수정·첨탑)
export function cone(B, cx, by, w, h, col, hz = (c) => c) {
  const R5 = ramp5(col);
  for (let j = 0; j < h; j++) {
    const half = (w / 2) * (j / h);
    for (let i = -Math.ceil(half); i <= Math.ceil(half); i++) {
      const L = Math.abs(i) >= Math.ceil(half) ? 5 : i < -half * 0.45 ? 0 : i < 0 ? 1 : i < half * 0.5 ? 3 : 4;
      B.put(cx + i, by - h + j, hz(R5[L]));
    }
  }
}
// 탑: 벽 + 원뿔 지붕 + 빛나는 창
export function tower(B, x, gy, w, h, col, roof, glow, hz = (c) => c) {
  box(B, x, gy - h, w, h, col, hz, { bricks: w > 10 });
  for (let i = -2; i < w + 2; i++) B.put(x + i, gy - h, hz(ramp5(col)[i < w / 2 ? 1 : 4]));
  cone(B, x + w / 2, gy - h, w + 6, Math.round(w * 1.1), roof, hz);
  for (let yy = gy - h + 8; yy < gy - 6; yy += 13) {
    for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) B.put(x + w / 2 - 1 + i, yy + j, j === 0 ? sh(glow, 0.4) : glow);
    for (let j = -2; j < 7; j++) for (let i = -2; i < 5; i++) B.put(x + w / 2 - 1 + i, yy + j, glow, 22);
  }
}
// 떠 있는 섬: 풀판 + 둥근 돌 몸통 + 뿌리 (지형과 같은 질감)
export function island(B, x, y, w, grass, rock, hz = (c) => c, seed = 1) {
  const R5 = ramp5(rock), G5 = ramp5(grass);
  const hgt = Math.round(w * 0.6);
  for (let i = 0; i < w; i++) {
    const u = i / (w - 1) - 0.5;
    const bot = Math.round(y + 6 + hgt * Math.pow(1 - Math.abs(u) * 2, 0.8) * (0.8 + 0.2 * Math.sin(i * 0.5 + seed)));
    for (let yy = y; yy <= bot; yy++) {
      const t = yy - y;
      let c;
      if (t < 5) c = t === 0 ? G5[5] : t === 1 ? G5[0] : t < 4 ? G5[1] : G5[3];
      else {
        const n = pn2(i * 1.0 + seed * 50, yy, 7, 5, 4096, seed), n2 = pn2(i + 2 + seed * 50, yy + 1, 7, 5, 4096, seed);
        let L = n - n2 > 0.05 ? 1 : n - n2 < -0.07 ? 3 : 2;
        u < -0.3 && (L = Math.max(0, L - 1));
        u > 0.25 && (L = Math.min(4, L + 1));
        t > hgt * 0.6 && (L = Math.min(4, L + 1));
        (i === 0 || i === w - 1 || yy === bot) && (L = 5);
        c = R5[L];
      }
      B.put(x + i, yy, hz(c));
    }
    // 뿌리
    if (hash(i, seed, 4) > 0.86) {
      const L = 4 + Math.floor(hash(i, seed, 5) * 14);
      for (let k = 0; k < L; k++) B.put(x + i + Math.round(Math.sin(k * 0.4 + i) * 1), bot + 1 + k, hz(k % 2 ? 0x5a3a22 : 0x7a5a32));
    }
  }
}
// 수정 기둥
export function crystal(B, cx, gy, w, h, col, hz = (c) => c) {
  const R5 = ramp5(col);
  for (let j = 0; j < h; j++) {
    const tip = j < w * 0.8 ? (j / (w * 0.8)) : 1, half = (w / 2) * tip;
    for (let i = -Math.ceil(half); i <= Math.ceil(half); i++) {
      const L = Math.abs(i) >= Math.ceil(half) ? 5 : i < -half * 0.3 ? 0 : i < 0.5 ? 1 : i < half * 0.6 ? 3 : 4;
      B.put(cx + i, gy - h + j, hz(R5[L]));
    }
  }
  for (let j = 0; j < h; j += 2) B.put(cx - Math.floor(w * 0.25), gy - h + w + j, 0xffffff, 120);
}
// 모래언덕
export function dunes(B, base, amp, col, skyC, haze, seed) {
  const W = B.w, R5 = ramp5(col);
  const f = (x) => base - amp * (pn(x, 160, W, seed) * 0.7 + pn(x, 50, W, seed + 1) * 0.3);
  for (let x = 0; x < W; x++) {
    const y0 = Math.round(f(x)), slope = f(x + 1) - f(x - 1);
    for (let y = y0; y < B.h; y++) {
      const t = y - y0;
      let L = slope > 0.15 ? 1 : slope < -0.15 ? 3 : 2;
      t === 0 && (L = Math.max(0, L - 1));
      (y + Math.round(Math.sin(x * 0.05) * 3)) % 9 === 0 && (L = Math.min(4, L + 1));
      t > 40 && (L = Math.min(4, L + 1));
      B.put(x, y, mix(R5[L], skyC, haze));
    }
  }
  return f;
}
// 별
export function stars(B, n, maxY, seed) {
  for (let i = 0; i < n; i++) {
    const x = hash(i, seed) * B.w, y = hash(seed, i) * maxY, b = hash(i, i, seed);
    B.put(x, y, 0xffffff, 120 + b * 135);
    b > 0.92 && (B.put(x - 1, y, 0xffffff, 90), B.put(x + 1, y, 0xffffff, 90), B.put(x, y - 1, 0xffffff, 90), B.put(x, y + 1, 0xffffff, 90));
  }
}
