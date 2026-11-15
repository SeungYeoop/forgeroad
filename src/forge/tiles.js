// 지형 타일 전면 재작업: 덩어리 돌블록 + 윗면 + 측면으로 입체감을 주는 하이엔드 픽셀 타일 (16x16 × 16종)
// 0-1 윗면, 2-3 채움, 4 깊은 채움, 5-6 윗모서리, 7-8 옆면, 9 밑면, 10-12 발판, 13 뒷벽, 14 채움 변형, 15 부서지는 블록
const H = (a, b, c) => {
  let x = (a * 374761393 + b * 668265263 + c * 1274126177) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
};
const sh = (c, f) => {
  const g = (s) => {
    const v = (c >> s) & 255;
    return Math.max(0, Math.min(255, Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f))));
  };
  return (g(16) << 16) | (g(8) << 8) | g(0);
};
const mix = (a, b, t) => {
  const g = (s) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return (g(16) << 16) | (g(8) << 8) | g(0);
};

// 재질 설정: 블록 크기·쌓기 방식·윗면 종류
const MAT = {
  plains: { bw: 8, bh: 5, bond: 4, cap: "grass", round: 1, plat: "stone" },
  forest: { bw: 7, bh: 6, bond: 3, cap: "moss", round: 2, plat: "wood" },
  cave: { bw: 16, bh: 4, bond: 5, cap: "rock", round: 1, plat: "wood", strata: 1 },
  desert: { bw: 8, bh: 4, bond: 4, cap: "sand", round: 0, plat: "stone" },
  snow: { bw: 8, bh: 6, bond: 4, cap: "snow", round: 2, plat: "ice" },
  fortress: { bw: 8, bh: 4, bond: 4, cap: "ledge", round: 0, plat: "metal" },
  kingdom: { bw: 8, bh: 8, bond: 4, cap: "ledge", round: 0, plat: "stone" },
  abyss: { bw: 6, bh: 5, bond: 3, cap: "rock", round: 1, plat: "stone" },
};

// 돌 블록 하나: 모서리 빛·그늘, 안쪽 명암, 잡티, 금
function block(b, x0, y0, w, h, base, seed, depth, M) {
  const v = (H(x0, y0, seed) - 0.5) * 0.16;
  const c = sh(base, v - depth * 0.22);
  const hi = sh(c, 0.32), lo = sh(c, -0.34), mid = sh(c, 0.12);
  const r = M.round;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const X = x0 + x, Y = y0 + y;
      if (X < 0 || Y < 0 || X > 15 || Y > 15) continue;
      // 둥근 모서리
      const cx = Math.min(x, w - 1 - x), cy = Math.min(y, h - 1 - y);
      if (r && cx + cy < r) continue;
      let col = c;
      if (y === 0 || x === 0) col = y === 0 && x === 0 ? hi : y === 0 ? hi : mid;
      else if (y === h - 1 || x === w - 1) col = lo;
      else if (y === 1 && x < w - 2) col = sh(c, 0.14);
      else {
        // 위→아래 명암 + 잡티
        const g = (y / h) * -0.12 + (H(X, Y, seed + 3) - 0.5) * 0.1;
        col = sh(c, g);
        H(X, Y, seed + 7) > 0.93 && (col = sh(c, -0.22));
        H(X, Y, seed + 9) > 0.96 && (col = sh(c, 0.2));
      }
      b.px(X, Y, col);
    }
  // 금
  if (H(x0, y0, seed + 11) > 0.72 && w > 4 && h > 3) {
    let cx = x0 + 2 + Math.floor(H(x0, y0, seed + 12) * (w - 4)), cy = y0 + 1;
    for (let i = 0; i < h - 2; i++) {
      cx += H(cx, cy, seed) > 0.5 ? 1 : 0;
      cy++;
      cx >= 0 && cx < 16 && cy < 16 && b.px(cx, cy, sh(c, -0.42));
    }
  }
}
// 채움 영역: 줄눈 위에 블록들
function fill(b, P, M, seed, depth = 0, y0 = 0) {
  const mortar = sh(P.soilDark, -0.35 - depth * 0.15);
  b.rect(0, y0, 16, 16 - y0, mortar);
  const base = M.strata ? P.soil : P.rock;
  for (let row = -1; row * M.bh < 16; row++) {
    const yy = y0 + row * M.bh;
    const off = ((row + 8) % 2) * M.bond;
    for (let x = -M.bw; x < 16 + M.bw; x += M.bw) {
      const bx = x + off - (M.bw - 0);
      const col = M.strata ? sh(base, row % 2 ? -0.06 : 0.06) : (row + Math.floor(bx / M.bw)) % 3 === 0 ? mix(base, P.soil, 0.35) : base;
      block(b, bx, yy, M.bw - 1, M.bh - 1, col, seed, depth + yy / 16 * 0.15, M);
    }
  }
  // 아래로 갈수록 은은한 그늘
  for (let y = y0; y < 16; y++) for (let x = 0; x < 16; x++) if ((y * 7 + x * 3) % 13 === 0 && depth > 0.5) b.px(x, y, sh(mortar, -0.2));
}
// 윗면: 밝은 상판 + 늘어진 테두리 + 그늘
function cap(b, P, M, seed, open = { l: 0, r: 0 }) {
  const top = P.top, hi = P.topHi;
  const kind = M.cap;
  const lipBase = kind === "ledge" ? 4 : 5;
  // 윗면 그늘 (덮개 아래 블록에 지는 그림자)
  for (let x = 0; x < 16; x++) for (let y = lipBase; y < lipBase + 3; y++) b.px(x, y, sh(b.get?.(x, y) ?? P.soilDark, -0.35 + (y - lipBase) * 0.12));
  for (let x = 0; x < 16; x++) {
    // 늘어지는 길이
    const drip = kind === "ledge" ? 0 : Math.floor(H(x, seed, 2) * 3) + (H(x, seed, 5) > 0.82 ? 2 : 0);
    const bottom = lipBase + drip;
    for (let y = 1; y < bottom; y++) {
      let col;
      if (y === 1) col = hi;
      else if (y === 2) col = sh(hi, -0.08);
      else if (y < lipBase - 1) col = top;
      else if (y === bottom - 1) col = sh(top, -0.38);
      else col = sh(top, -0.18);
      if (kind === "ledge") col = y === 1 ? hi : y === lipBase - 1 ? sh(top, -0.4) : y === 2 ? sh(hi, -0.1) : top;
      b.px(x, y, col);
    }
    // 윗선 질감
    if (kind === "grass" || kind === "moss") {
      H(x, seed, 7) > 0.45 && b.px(x, 0, sh(hi, 0.1));
      H(x, seed, 9) > 0.8 && b.px(x, 2, sh(top, -0.15));
    } else if (kind === "snow") {
      b.px(x, 0, H(x, seed, 3) > 0.3 ? 0xffffff : sh(hi, -0.05));
    } else if (kind === "sand") {
      H(x, seed, 4) > 0.7 && b.px(x, 3, sh(top, -0.12));
    } else if (kind === "rock") {
      H(x, seed, 6) > 0.75 && b.px(x, 3, sh(top, -0.25));
    } else b.px(x, 0, sh(hi, -0.2));
  }
  // 풀잎·꽃·조약돌 장식
  if (kind === "grass" || kind === "moss") {
    for (let i = 0; i < 4; i++) {
      const x = Math.floor(H(i, seed, 13) * 16);
      b.px(x, 0, sh(hi, 0.2));
      H(i, seed, 14) > 0.7 && b.px(x, 1, P.accent);
    }
  }
  if (kind === "ledge") {
    b.rect(0, lipBase, 16, 1, sh(top, -0.55));
    for (let x = 3; x < 16; x += 8) b.px(x, 2, sh(hi, 0.2));
  }
  // 열린 모서리
  if (open.l) for (let y = 0; y < 16; y++) for (let x = 0; x < 3 - Math.min(2, y); x++) b.clearPx(x, y);
  if (open.r) for (let y = 0; y < 16; y++) for (let x = 0; x < 3 - Math.min(2, y); x++) b.clearPx(15 - x, y);
}
// 옆면: 바깥쪽에 깊이감 있는 측벽
function side(b, P, left) {
  for (let y = 0; y < 16; y++)
    for (let k = 0; k < 3; k++) {
      const x = left ? k : 15 - k;
      const c = sh(P.rock, -0.15 - k * 0.12 + (y % 5 === 0 ? -0.15 : 0));
      b.px(x, y, k === 0 ? sh(P.soilDark, -0.5) : c);
    }
  for (let y = 2; y < 16; y += 5) b.px(left ? 1 : 14, y, sh(P.rock, 0.15));
}
// 밑면: 울퉁불퉁 매달린 바위
function underside(b, P, M, seed) {
  fill(b, P, M, seed, 0.6);
  for (let x = 0; x < 16; x++) {
    const d = 9 + Math.floor(H(x >> 1, seed, 10) * 4) + (H(x >> 2, seed, 11) > 0.7 ? 2 : 0);
    for (let y = d; y < 16; y++) b.clearPx(x, y);
    b.px(x, d - 1, sh(P.soilDark, -0.5));
    d - 2 >= 0 && b.px(x, d - 2, sh(P.rock, -0.45));
  }
  // 고드름처럼 매달린 돌
  for (const x of [3, 10]) {
    const L = 3 + Math.floor(H(x, seed, 9) * 3);
    for (let i = 0; i < L; i++) b.px(x, 11 + i, sh(P.rock, -0.35 - i * 0.05));
    b.px(x + 1, 11, sh(P.rock, -0.4));
  }
}
// 떠 있는 발판: 윗판 + 두께 + 아랫그늘
function plat(b, P, M, pos) {
  const kind = M.plat;
  const top = kind === "wood" ? 0xb07a48 : kind === "ice" ? 0xc8ecff : kind === "metal" ? 0x9aa0b0 : P.top;
  const face = kind === "wood" ? 0x7a4a28 : kind === "ice" ? 0x7ab0e0 : kind === "metal" ? 0x5a6070 : P.rock;
  const x0 = pos === 0 ? 1 : 0, x1 = pos === 2 ? 14 : 15;
  for (let x = x0; x <= x1; x++) {
    const endL = pos === 0 && x === x0, endR = pos === 2 && x === x1;
    b.px(x, 0, sh(top, 0.35));
    b.px(x, 1, sh(top, 0.15));
    b.px(x, 2, top);
    b.px(x, 3, sh(top, -0.2));
    for (let y = 4; y < 9; y++) {
      let c = sh(face, -(y - 4) * 0.07);
      if (kind === "wood" && (x + (y > 6 ? 3 : 0)) % 6 === 0) c = sh(face, -0.35);
      if (kind !== "wood" && x % 8 === (y > 6 ? 4 : 0)) c = sh(face, -0.32);
      if (y === 4) c = sh(face, 0.18);
      b.px(x, y, endL || endR ? sh(c, -0.25) : c);
    }
    b.px(x, 9, sh(face, -0.6));
    if (kind === "wood" && (x === 3 || x === 12) && pos !== 1) for (let y = 10; y < 13; y++) b.px(x, y, sh(face, -0.4));
  }
  if (kind === "ice") for (let x = x0 + 2; x < x1; x += 5) b.px(x, 1, 0xffffff);
  if (kind === "metal") for (let x = x0 + 2; x < x1; x += 6) b.px(x, 6, sh(face, 0.4));
}
// 뒷벽: 하늘색으로 물든 먼 벽돌
function backwall(b, P) {
  const w = mix(P.rock, P.sky[1], 0.5);
  b.rect(0, 0, 16, 16, sh(w, -0.3));
  for (let row = 0; row < 4; row++) {
    const off = (row % 2) * 4;
    for (let x = -8; x < 16; x += 8) {
      const bx = x + off;
      for (let y = row * 4; y < row * 4 + 3; y++) for (let xx = Math.max(0, bx); xx < Math.min(16, bx + 7); xx++) b.px(xx, y, y === row * 4 ? sh(w, 0.12) : sh(w, -0.08));
    }
  }
}
function breakable(b, P, M) {
  block(b, 0, 0, 16, 16, sh(P.rock, 0.05), 77, 0, { round: 1 });
  for (const [x0, y0, x1, y1] of [[4, 2, 7, 8], [7, 8, 5, 14], [11, 2, 9, 7], [9, 7, 13, 12], [7, 8, 9, 7]]) b.line(x0, y0, x1, y1, sh(P.rock, -0.6));
  b.px(3, 3, sh(P.rock, 0.5));
  b.px(12, 11, sh(P.rock, 0.45));
}

export function makeTiles(ht, theme, P) {
  const M = MAT[theme] ?? MAT.plains;
  const out = [];
  for (let i = 0; i < 16; i++) {
    const b = new ht(16, 16);
    b.get = (x, y) => {
      const p = b.buf[y * 16 + x];
      return p >>> 24 ? ((p & 255) << 16) | (((p >> 8) & 255) << 8) | ((p >> 16) & 255) : null;
    };
    switch (i) {
      case 0: fill(b, P, M, 1), cap(b, P, M, 1); break;
      case 1: fill(b, P, M, 2), cap(b, P, M, 2); break;
      case 2: fill(b, P, M, 3, 0.15); break;
      case 3: fill(b, P, M, 4, 0.25); break;
      case 4: fill(b, P, M, 5, 0.7); break;
      case 5: fill(b, P, M, 6), side(b, P, !0), cap(b, P, M, 6, { l: 1 }); break;
      case 6: fill(b, P, M, 7), side(b, P, !1), cap(b, P, M, 7, { r: 1 }); break;
      case 7: fill(b, P, M, 8, 0.3), side(b, P, !0); break;
      case 8: fill(b, P, M, 9, 0.3), side(b, P, !1); break;
      case 9: underside(b, P, M, 10); break;
      case 10: plat(b, P, M, 0); break;
      case 11: plat(b, P, M, 1); break;
      case 12: plat(b, P, M, 2); break;
      case 13: backwall(b, P); break;
      case 14: fill(b, P, M, 12, 0.4); break;
      case 15: breakable(b, P, M); break;
    }
    out.push(b);
  }
  return out;
}
