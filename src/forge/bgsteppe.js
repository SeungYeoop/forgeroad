// 그린스텝 배경: 구름 바다 위로 솟은 붉은 사암 탁상 고원(테푸이)들
//   원경: 높은 새털구름 · 안개에 묻힌 먼 고원 실루엣(가는 폭포) · 구름 바다
//   중경: 가까운 고원 (층층 사암·세로 골·초록 윗면·폭포와 물보라) · 떠 있는 바위 · 더 가까운 구름 바다
//   근경: 화면 아래 큰 뭉게구름 꼭대기
//   빛은 왼쪽 위(아침 해), 멀수록 하늘색에 묻힌다. 가로 W 주기로 끝없이 이어진다
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
// 1D 값 잡음 (주기 W)
const pn = (x, sc, seed) => {
  const n = Math.max(1, Math.round(W / sc)), fx = x / sc, i = Math.floor(fx), f = fx - i, u = f * f * (3 - 2 * f);
  const a = hash(((i % n) + n) % n, seed), b = hash((((i + 1) % n) + n) % n, seed);
  return a + (b - a) * u;
};
const BANDS = [0, 0.08, -0.05, 0.05, -0.1, 0.03, -0.03];

// 탁상 고원 하나: 평평한 윗면(풀), 거의 곧은 절벽(아래로 조금 벌어짐), 가로 지층·세로 골, 왼쪽 밝고 오른쪽 그늘
function tepui(B, cx, base, w, h, o) {
  const { rock, top, skyC, haze = 0, seed = 1, falls = [] } = o;
  const topY = Math.round(base - h);
  for (let y = topY; y < B.h; y++) {
    const t = (y - topY) / h;
    const hw = (w / 2) * (1 + Math.max(0, t) ** 2 * 0.22) + (pn(y * 3, 11, seed) - 0.5) * 3;
    const l = cx - hw, r = cx + hw;
    for (let x = Math.floor(l); x <= Math.ceil(r); x++) {
      const u = (x - l) / Math.max(1, r - l);
      // 윗면 풀 (가장자리에서 조금 처진다)
      const capN = 2 + Math.floor(pn(x * 2, 9, seed + 4) * 3) + (u < 0.05 || u > 0.95 ? 2 : 0);
      let c;
      if (y - topY < capN) c = y === topY ? sh(top, 0.25) : y - topY < 2 ? top : sh(top, -0.18);
      else {
        const band = Math.floor((y - topY + pn(x, 40, seed) * 5) / 6);
        c = sh(rock, BANDS[((band % 7) + 7) % 7]);
        // 세로 골 (풍화된 홈)
        if ((x + Math.floor(pn(y, 30, seed + 2) * 6) + seed) % 9 === 0 && u > 0.1 && u < 0.92) c = sh(c, -0.14);
        // 빛: 왼쪽 가장자리 밝게, 오른쪽 그늘
        c = u < 0.1 ? sh(c, 0.14) : u > 0.66 ? sh(c, -0.12 - (u - 0.66) * 0.7) : c;
        // 윗면 바로 밑 붉은 흙 띠
        y - topY < capN + 2 && (c = mix(c, 0x6a3424, 0.35));
      }
      B.put(x, y, mix(c, skyC, haze));
    }
  }
  // 폭포: 윗면 가장자리 근처에서 아래로 (흰 줄 + 흔들림), 아래 물보라
  for (const fx of falls) {
    const x0 = cx + fx * w * 0.5;
    for (let y = topY + 1; y < B.h; y++) {
      const sx = x0 + Math.round(Math.sin(y * 0.08 + seed) * 0.6);
      B.put(sx, y, mix(0xffffff, skyC, haze * 0.7), 220);
      B.put(sx + 1, y, mix(0xd8f0ff, skyC, haze * 0.7), 140);
    }
  }
}
// 구름 바다: 뭉게구름 꼭대기를 줄지어 놓고 그 아래는 구름 몸통으로 메운다
function cloudSea(B, top, s0, s1, light, shade, R, h, seed, n = 12) {
  for (let i = 0; i < n; i++) {
    const x = ((i + h.next() * 0.6) * W) / n, y = top + R(-6, 6), s = s0 + h.next() * (s1 - s0);
    G.cloud(B, x, y, s, light, shade, 255, seed + i);
  }
  const body = mix(light, shade, 0.35);
  for (let y = top + Math.round(8 * s0); y < B.h; y++) for (let x = 0; x < W; x++) B.has(x, y) || B.put(x, y, mix(body, shade, Math.min(1, (y - top) / 90) * 0.5));
}

export function paintSteppe(T, S, E, h) {
  const B = G.buffer(W, T.h ?? 360);
  const skyC = E.sky[1], seed = h.int(1, 9999);
  const R = (a, b) => h.int(a, b);
  const rock = E.rock, top = E.top;
  const light = mix(skyC, 0xffffff, 0.82), shade = mix(E.sky[0], skyC, 0.62);
  if (S === 0) {
    // 새털구름 (가로로 긴 옅은 줄)
    for (let i = 0; i < 16; i++) {
      const x = R(0, W), y = R(16, 140), L = R(40, 150);
      for (let k = 0; k < L; k++) {
        const a = Math.round(90 * (1 - Math.abs(k - L / 2) / (L / 2)));
        B.put(x + k, y + Math.round(Math.sin((x + k) * 0.02) * 2), light, a);
        hash(i, k, seed) > 0.6 && B.put(x + k, y + 1, light, a >> 1);
      }
    }
    // 먼 고원들 (안개에 묻힌 분홍빛)
    const far = mix(E.far, rock, 0.25);
    for (let i = 0; i < 5; i++) {
      const cx = ((i + 0.3 + h.next() * 0.4) * W) / 5, w = R(50, 130), hh = R(45, 120);
      tepui(B, cx, 300, w, hh, { rock: far, top: mix(top, far, 0.45), skyC, haze: 0.5, seed: seed + i, falls: i % 2 ? [-0.6] : [] });
    }
    cloudSea(B, 292, 0.8, 1.3, light, shade, R, h, seed + 20, 14);
    B.toHt(T);
    return;
  }
  if (S === 1) {
    // 가까운 고원 (붉은 사암)
    for (let i = 0; i < 3; i++) {
      const cx = ((i + 0.2 + h.next() * 0.6) * W) / 3, w = R(110, 200), hh = R(110, 190);
      tepui(B, cx, 335, w, hh, { rock: mix(rock, E.far, 0.15), top, skyC, haze: 0.22, seed: seed + 40 + i, falls: i === 1 ? [-0.7, 0.55] : [0.6] });
    }
    // 떠 있는 바위
    for (let i = 0; i < 4; i++) {
      const x = R(0, W), y = R(90, 200), w = R(18, 40);
      G.island(B, x, y, w, top, rock, (c) => mix(c, skyC, 0.3), seed + 60 + i);
    }
    cloudSea(B, 318, 1.2, 1.9, light, shade, R, h, seed + 80, 10);
    B.toHt(T);
    return;
  }
  // ── 근경: 큰 뭉게구름 꼭대기 ──
  cloudSea(B, 342, 2, 3, mix(light, 0xffffff, 0.3), mix(shade, light, 0.15), R, h, seed + 100, 7);
  B.toHt(T);
}
