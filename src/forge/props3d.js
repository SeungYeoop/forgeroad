// 3D를 픽셀로 옮긴 작은 소품들: 상자·원기둥·구·뿔·덩어리 도형을 왼쪽 위 빛으로 5단계 명암을 주어 그린다.
// 게임 속 장식(나무·바위·횃불·깃발…)과 허브 소품(분수·노점·가로등…)을 이걸로 다시 그린다.
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
const H = (a, b, c = 0) => {
  let x = (a * 374761393 + b * 668265263 + c * 1274126177) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
};
export const ramp5 = (b) => [mix(sh(b, 0.42), 0xfff2d8, 0.18), sh(b, 0.17), b, mix(sh(b, -0.3), 0x3c2848, 0.2), mix(sh(b, -0.52), 0x24183a, 0.32), mix(sh(b, -0.74), 0x140c1e, 0.45)];
const lv = (I) => (I > 0.62 ? 0 : I > 0.22 ? 1 : I > -0.22 ? 2 : I > -0.6 ? 3 : 4);

// put(x, y, color) 를 받아 도형 도구를 만든다
export function prims(put) {
  const P = {
    // 각진 덩어리: 위 두 줄 밝게, 왼쪽 테두리 빛, 오른쪽·아래 그늘, 외곽선
    box(x, y, w, h, col, o = {}) {
      const R5 = ramp5(col);
      for (let j = 0; j < h; j++)
        for (let i = 0; i < w; i++) {
          let L = 2;
          if (j === 0 || i === 0 || i === w - 1 || j === h - 1) L = 5;
          else if (j === 1) L = 0;
          else if (j === 2 || i === 1) L = 1;
          else if (i >= w - 3) L = i === w - 2 ? 4 : 3;
          else if (j >= h - 3) L = 3;
          else if (o.tex && H(x + i, y + j, 5) > 0.9) L = 3;
          o.noOutline && L === 5 && (L = 4);
          put(x + i, y + j, R5[L]);
        }
    },
    // 세로 원기둥: 가로로 둥근 명암, 위 뚜껑은 밝은 타원
    cyl(x, y, w, h, col, o = {}) {
      const R5 = ramp5(col);
      for (let i = 0; i < w; i++) {
        const u = (i + 0.5) / w * 2 - 1, n = Math.sqrt(Math.max(0, 1 - u * u));
        const I = -u * 0.75 + n * 0.25 - 0.1;
        let L = i === 0 || i === w - 1 ? 5 : lv(I);
        for (let j = 0; j < h; j++) {
          let LL = L;
          o.bands && o.bands.includes(j) && (LL = Math.min(5, L + 2));
          j === h - 1 && (LL = 5);
          put(x + i, y + j, R5[LL]);
        }
      }
      if (o.cap) for (let i = 1; i < w - 1; i++) put(x + i, y, R5[i < w / 2 ? 0 : 1]);
    },
    // 구: 왼쪽 위가 밝다
    sphere(cx, cy, r, col, o = {}) {
      const R5 = ramp5(col);
      for (let j = -r; j <= r; j++)
        for (let i = -r; i <= r; i++) {
          const d = (i * i + j * j) / (r * r);
          if (d > 1) continue;
          const nz = Math.sqrt(1 - d), nx = i / r, ny = j / r;
          let L = lv(-nx * 0.55 - ny * 0.7 + nz * 0.35 - 0.15);
          d > 0.78 && (L = Math.min(5, L + 1));
          d > 0.92 && !o.noOutline && (L = 5);
          put(cx + i, cy + j, R5[L]);
        }
      o.shine && put(cx - Math.round(r * 0.45), cy - Math.round(r * 0.45), 0xffffff);
    },
    // 타원 덩어리 (바위·덤불)
    blob(cx, cy, rx, ry, col, seed = 1) {
      const R5 = ramp5(col);
      for (let j = -ry; j <= ry; j++)
        for (let i = -rx; i <= rx; i++) {
          const wob = 1 + (H(Math.floor((i + 40) / 3), seed, 2) - 0.5) * 0.25;
          const d = (i * i) / (rx * rx) + (j * j) / (ry * ry);
          if (d > wob) continue;
          const nz = Math.sqrt(Math.max(0, 1 - d)), nx = i / rx, ny = j / ry;
          let L = lv(-nx * 0.55 - ny * 0.75 + nz * 0.3 - 0.1);
          d > wob * 0.85 && (L = Math.min(5, L + 1));
          d > wob * 0.95 && (L = 5);
          H(cx + i, cy + j, seed) > 0.93 && (L = Math.min(4, L + 1));
          put(cx + i, cy + j, R5[L]);
        }
    },
    // 뿔·결정: 왼쪽 면은 밝고 오른쪽 면은 어둡다
    cone(cx, by, w, h, col, o = {}) {
      const R5 = ramp5(col);
      for (let j = 0; j < h; j++) {
        const half = (w / 2) * (j / h);
        for (let i = -Math.ceil(half); i <= Math.ceil(half); i++) {
          const edge = Math.abs(i) >= Math.ceil(half);
          let L = i < 0 ? (i < -half * 0.5 ? 1 : 0) : i === 0 ? 2 : i < half * 0.5 ? 3 : 4;
          o.flip && (L = 4 - L);
          edge && (L = 5);
          put(cx + i, by - h + j, R5[L]);
        }
      }
    },
    // 굵은 선 (줄기·가지)
    stick(x0, y0, x1, y1, t, col) {
      const R5 = ramp5(col);
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let k = 0; k <= n; k++) {
        const x = Math.round(x0 + ((x1 - x0) * k) / n), y = Math.round(y0 + ((y1 - y0) * k) / n);
        for (let i = 0; i < t; i++) put(x + i, y, R5[i === 0 ? 1 : i === t - 1 ? 4 : 2]);
      }
    },
  };
  return P;
}

// ── 게임 속 장식 다시 그리기 ──
function canvasPainter(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d");
  const img = x.createImageData(w, h);
  const buf = new Uint32Array(img.data.buffer);
  const put = (px, py, col) => {
    px = Math.round(px), py = Math.round(py);
    px >= 0 && py >= 0 && px < w && py < h && (buf[py * w + px] = (0xff000000 | ((col & 255) << 16) | (col & 0xff00) | ((col >> 16) & 255)) >>> 0);
  };
  const done = () => {
    // 바깥 외곽선 한 겹
    const out = buf.slice();
    for (let py = 0; py < h; py++)
      for (let px = 0; px < w; px++) {
        if (buf[py * w + px]) continue;
        const n = (px > 0 && buf[py * w + px - 1]) || (px < w - 1 && buf[py * w + px + 1]) || (py > 0 && buf[(py - 1) * w + px]) || (py < h - 1 && buf[(py + 1) * w + px]);
        n && (out[py * w + px] = 0xff1e1018);
      }
    buf.set(out);
    x.putImageData(img, 0, 0);
    return c;
  };
  return { put, done, P: prims(put) };
}
const DECOR = {
  d_grass: [12, 9, ({ P, put }) => {
    for (let k = 0; k < 6; k++) {
      const x = 1 + k * 2, hgt = 4 + ((k * 7) % 4);
      for (let j = 0; j < hgt; j++) put(x + (j > hgt - 2 && k % 2 ? 1 : 0), 8 - j, j > hgt - 2 ? 0xc4f070 : j > hgt / 2 ? 0x7cc04a : 0x4a8a34);
    }
  }],
  d_flower: [9, 12, ({ P, put }) => {
    P.stick(4, 11, 4, 5, 1, 0x4a8a34);
    put(5, 8, 0x6ab048), put(6, 7, 0x6ab048);
    P.sphere(4, 3, 3, 0xf0d040, { shine: 1 });
    put(4, 3, 0xd04a20);
  }],
  d_rock: [18, 11, ({ P }) => {
    P.blob(9, 6, 8, 4, 0x9a8a7a, 3);
    P.blob(5, 7, 3, 2, 0x8a7a6a, 5);
  }],
  d_ruin: [18, 32, ({ P }) => {
    P.box(3, 5, 11, 27, 0xa09080, { tex: 1 });
    P.box(1, 1, 15, 5, 0xb8a898);
    P.box(11, 0, 5, 3, 0xb8a898);
  }],
  d_tree: [40, 58, ({ P }) => {
    P.cyl(17, 28, 6, 30, 0x7a5030);
    P.stick(20, 34, 28, 26, 2, 0x6a4428);
    P.blob(20, 20, 15, 12, 0x4a9a3a, 1);
    P.blob(10, 27, 9, 7, 0x3e8a32, 2);
    P.blob(30, 27, 9, 7, 0x3e8a32, 3);
    P.blob(17, 12, 9, 7, 0x5aae44, 4);
    P.blob(25, 15, 7, 6, 0x5aae44, 5);
  }],
  d_darktree: [32, 66, ({ P }) => {
    P.cyl(13, 12, 7, 54, 0x3a2a24);
    P.stick(15, 24, 4, 10, 2, 0x3a2a24);
    P.stick(17, 18, 27, 6, 2, 0x3a2a24);
    P.blob(5, 9, 5, 4, 0x2a3a2a, 1);
    P.blob(26, 6, 6, 5, 0x2a3a2a, 2);
    P.blob(16, 8, 7, 5, 0x34483a, 3);
  }],
  d_mushroom: [14, 14, ({ P, put }) => {
    P.cyl(5, 7, 4, 7, 0xe8dcc0);
    P.sphere(7, 6, 6, 0xd8323a);
    put(5, 3, 0xffffff), put(9, 4, 0xffffff), put(7, 2, 0xffffff);
  }],
  d_glowshroom: [10, 12, ({ P, put }) => {
    P.cyl(4, 6, 3, 6, 0xc0d8c8);
    P.sphere(5, 5, 4, 0x40c8b0);
    put(4, 3, 0xe0fff8);
  }],
  d_crystal: [16, 20, ({ P }) => {
    P.cone(4, 20, 6, 13, 0x40c0e0);
    P.cone(10, 20, 8, 20, 0x60e0ff);
    P.cone(14, 20, 4, 8, 0x40a0d0);
  }],
  d_stalag: [14, 22, ({ P }) => P.cone(7, 22, 12, 22, 0x8a7a6a)],
  d_cactus: [18, 28, ({ P }) => {
    P.cyl(7, 4, 5, 24, 0x4a9a3a, { cap: 1 });
    P.cyl(2, 8, 4, 8, 0x4a9a3a, { cap: 1 });
    P.box(3, 13, 5, 3, 0x4a9a3a, { noOutline: 1 });
    P.cyl(12, 11, 4, 8, 0x4a9a3a, { cap: 1 });
    P.box(11, 16, 3, 3, 0x4a9a3a, { noOutline: 1 });
  }],
  d_bones: [18, 9, ({ P }) => {
    P.sphere(5, 5, 3, 0xe8dcc8);
    P.stick(8, 7, 16, 5, 2, 0xe0d4c0);
  }],
  d_pillar_sand: [16, 36, ({ P }) => {
    P.cyl(3, 4, 10, 29, 0xd8b078, { bands: [8, 16, 24] });
    P.box(1, 0, 14, 5, 0xe8c890);
    P.box(1, 32, 14, 4, 0xe8c890);
  }],
  d_pine: [26, 46, ({ P }) => {
    P.cyl(11, 36, 4, 10, 0x6a4a2a);
    for (let k = 0; k < 4; k++) P.cone(13, 40 - k * 9, 22 - k * 4, 14, 0x2e6a3a);
  }],
  d_snowrock: [20, 12, ({ P }) => {
    P.blob(10, 7, 9, 4, 0x8a96aa, 2);
    P.blob(10, 4, 7, 2, 0xf4f8ff, 3);
  }],
  d_torch: [10, 24, ({ P }) => {
    P.cyl(4, 9, 3, 15, 0x6a4a2a);
    P.box(2, 7, 6, 3, 0x6a6a74);
    P.sphere(5, 4, 3, 0xff9030, { noOutline: 1 });
    P.sphere(5, 4, 1, 0xfff0a0, { noOutline: 1 });
  }],
  d_bannerpole: [16, 42, ({ P, put }) => {
    P.cyl(2, 0, 3, 42, 0x4a3a2a, { cap: 1 });
    // 주름진 천: 세로 줄마다 빛/그늘이 번갈아
    const R5 = [0xd04a3a, 0xb03a2a, 0x9a2a22, 0x7a1e1a, 0x5a1414, 0x2a0a0a];
    for (let i = 0; i < 10; i++) {
      const L = [1, 0, 1, 2, 3, 2, 1, 2, 3, 4][i];
      const hgt = 20 - (i > 4 ? (i - 4) : 0) * 0.6;
      for (let j = 0; j < hgt; j++) put(5 + i, 2 + j, j === 0 ? R5[5] : i === 9 ? R5[5] : R5[L]);
    }
    P.sphere(10, 9, 2, 0xf0c040);
  }],
  d_barrel: [14, 16, ({ P }) => P.cyl(1, 1, 12, 15, 0x8a5a32, { bands: [3, 11], cap: 1 })],
  d_voidcrystal: [16, 24, ({ P }) => {
    P.cone(5, 24, 7, 16, 0x8a4ad0);
    P.cone(11, 24, 8, 24, 0xb070ff);
  }],
  d_tendril: [12, 28, ({ put }) => {
    for (let j = 0; j < 28; j++) {
      const w = 1 + Math.round((28 - j) / 8), cx = 6 + Math.round(Math.sin(j * 0.35) * 3);
      for (let i = 0; i < w; i++) put(cx + i, j, i === 0 ? 0x5a8a5a : i === w - 1 ? 0x1e3a24 : 0x3a6a42);
    }
  }],
  d_statue: [18, 38, ({ P }) => {
    P.box(2, 31, 14, 7, 0x9a9090);
    P.cyl(6, 13, 6, 18, 0xc8c0c0);
    P.sphere(9, 8, 4, 0xc8c0c0);
    P.stick(11, 15, 15, 6, 2, 0xc8c0c0);
  }],
  d_column: [16, 46, ({ P }) => {
    P.cyl(3, 4, 10, 37, 0xe0dcd0, { bands: [] });
    P.box(1, 0, 14, 5, 0xf0ece4);
    P.box(1, 41, 14, 5, 0xf0ece4);
  }],
  d_lamp_arcane: [12, 26, ({ P }) => {
    P.cyl(5, 9, 3, 17, 0x5a5a68);
    P.sphere(6, 5, 4, 0x6a8ad0, { noOutline: 1 });
    P.sphere(6, 5, 2, 0xd0f0ff, { noOutline: 1 });
  }],
};
export function remakeDecor(scene) {
  for (const [key, [w, h, draw]] of Object.entries(DECOR)) {
    try {
      const cp = canvasPainter(w, h);
      draw(cp);
      const c = cp.done();
      scene.textures.exists(key) && scene.textures.remove(key);
      scene.textures.addCanvas(key, c);
    } catch (e) {
      console.warn("decor", key, e);
    }
  }
}

// ── 보물상자 (닫힘 / 열림 두 장) ──
const CHESTS = { chest: [0x8a5a2a, 0x5a4a3a, 0xc0c0c0], chest_rare: [0x3a5aa0, 0xd8b040, 0x80e0ff], chest_epic: [0x6a2a8a, 0xffd040, 0xff70ff] };
export function remakeChests(scene) {
  for (const [key, [wood, metal, gem]] of Object.entries(CHESTS)) {
    try {
      const cp = canvasPainter(44, 18);
      const { P, put } = cp;
      for (let f = 0; f < 2; f++) {
        const ox = f * 22;
        // 몸통
        P.box(ox + 1, 8, 20, 10, wood, { tex: 1 });
        P.box(ox + 1, 8, 3, 10, metal, { noOutline: 1 });
        P.box(ox + 18, 8, 3, 10, metal, { noOutline: 1 });
        if (f === 0) {
          // 둥근 뚜껑: 위가 밝은 반원통
          const R5 = ramp5(wood);
          for (let j = 0; j < 7; j++)
            for (let i = 0; i < 20; i++) {
              const L = j === 0 ? 5 : j === 1 ? 0 : j === 2 ? 1 : j < 5 ? 2 : j === 5 ? 3 : 5;
              put(ox + 1 + i, 1 + j + (i === 0 || i === 19 ? 1 : 0), i === 0 || i === 19 ? R5[5] : R5[L]);
            }
          P.box(ox + 1, 1, 3, 7, metal, { noOutline: 1 });
          P.box(ox + 18, 1, 3, 7, metal, { noOutline: 1 });
          P.box(ox + 8, 5, 6, 6, metal);
          P.sphere(ox + 11, 8, 1, gem, { noOutline: 1 });
        } else {
          // 열린 뚜껑과 안쪽 빛
          P.box(ox + 3, 0, 18, 5, sh(wood, -0.25));
          for (let i = 0; i < 16; i++) for (let j = 0; j < 2; j++) put(ox + 3 + i, 7 + j, j === 0 ? 0xfff0b0 : 0xffc040);
          put(ox + 8, 6, 0xffffff), put(ox + 14, 6, 0xffffff), put(ox + 11, 5, gem);
        }
      }
      const c = cp.done();
      scene.textures.exists(key) && scene.textures.remove(key);
      const t = scene.textures.addCanvas(key, c);
      t.add(0, 0, 0, 0, 22, 18);
      t.add(1, 0, 22, 0, 22, 18);
    } catch (e) {
      console.warn("chest", key, e);
    }
  }
}
