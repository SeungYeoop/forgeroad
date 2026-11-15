// 인벤토리 그림: 가죽 배낭, 장비 소켓, 돌 융합 제단, 판매 궤짝
const hex = (c) => "#" + (c & 0xffffff).toString(16).padStart(6, "0");
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
function cv(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d");
  const r = (a, b, ww, hh, col, al = 1) => ((x.globalAlpha = al), (x.fillStyle = hex(col)), x.fillRect(Math.round(a), Math.round(b), Math.round(ww), Math.round(hh)), (x.globalAlpha = 1));
  draw(r, x);
  return c;
}
// 둥근 사각형 안인지
const inRR = (x, y, w, h, rad) => {
  const cx = Math.min(Math.max(x, rad), w - 1 - rad), cy = Math.min(Math.max(y, rad), h - 1 - rad);
  return (x - cx) ** 2 + (y - cy) ** 2 <= rad * rad;
};
const leather = (r, x0, y0, w, h, base, rad, seed) => {
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (!inRR(x, y, w, h, rad)) continue;
      const e = Math.min(x, y, w - 1 - x, h - 1 - y);
      let c = sh(base, (H(x >> 1, y >> 1, seed) - 0.5) * 0.12 - (y / h) * 0.18);
      e < 1 ? (c = sh(base, -0.6)) : e < 2 ? (c = sh(base, y < h / 2 ? 0.2 : -0.3)) : 0;
      // 바느질
      e === 4 && (x + y) % 4 < 2 && (c = 0xe8d0a0);
      r(x0 + x, y0 + y, 1, 1, c);
    }
};

export function makeInvArt(scene) {
  const add = (k, c) => scene.textures.exists(k) || scene.textures.addCanvas(k, c);
  // 배낭 (윗덮개가 젖혀진 가죽 가방)
  add("inv_pack", cv(200, 190, (r) => {
    // 젖혀진 덮개 (뒤쪽)
    leather(r, 30, 0, 140, 40, 0x5a3418, 14, 3);
    r(70, 30, 6, 12, 0xc8a050), r(124, 30, 6, 12, 0xc8a050);
    // 어깨끈
    for (const x of [8, 182]) for (let y = 30; y < 170; y++) (r(x, y, 10, 1, sh(0x6a4020, (H(x, y) - 0.5) * 0.15)), r(x, y, 1, 1, 0x2a160a), r(x + 9, y, 1, 1, 0x2a160a));
    // 몸통
    leather(r, 14, 26, 172, 160, 0x8a5a30, 20, 7);
    // 입구 (안쪽 그림자)
    for (let y = 0; y < 116; y++)
      for (let x = 0; x < 148; x++) inRR(x, y, 148, 116, 10) && r(26 + x, 36 + y, 1, 1, mix(0x1a0c04, 0x3a2210, y / 116));
    r(26, 36, 148, 3, 0x0a0402, 0.8);
    // 앞주머니와 버클
    leather(r, 60, 156, 80, 26, 0x7a4c28, 6, 11);
    r(94, 152, 12, 14, 0xc8a050), r(97, 155, 6, 8, 0x5a3418), r(94, 152, 12, 1, 0xffe8a0);
  }));
  // 가죽 주머니 칸
  const pocket = (sel) => cv(38, 36, (r) => {
    leather(r, 0, 0, 38, 36, sel ? 0xb07a40 : 0x6a4224, 5, sel ? 5 : 9);
    for (let y = 6; y < 30; y++) for (let x = 6; x < 32; x++) r(x, y, 1, 1, mix(sel ? 0x4a2a10 : 0x22120a, sel ? 0x6a3c18 : 0x341c0c, (y - 6) / 24));
    sel && (r(1, 1, 36, 1, 0xffe0a0), r(1, 34, 36, 1, 0xffe0a0));
  });
  add("inv_pocket", pocket(0));
  add("inv_pocket_hi", pocket(1));
  // 장비 소켓 (쇠 테두리)
  const socket = (sel, big) => {
    const s = big ? 38 : 32;
    return cv(s, s, (r) => {
      const c = s / 2 - 0.5;
      for (let y = 0; y < s; y++)
        for (let x = 0; x < s; x++) {
          const d = Math.hypot(x - c, y - c);
          if (d > s / 2) continue;
          let col;
          if (d > s / 2 - 1.2) col = 0x1a1418;
          else if (d > s / 2 - 4.5) col = sel ? (y < c ? 0xffe090 : 0xc08020) : y < c ? 0xb8b0b8 : 0x6a6470;
          else if (d > s / 2 - 5.5) col = 0x1a1418;
          else col = mix(0x2a2230, 0x120e16, d / (s / 2));
          r(x, y, 1, 1, col);
        }
      for (const [x, y] of [[c, 2], [c, s - 3], [2, c], [s - 3, c]]) r(x - 1, y - 1, 2, 2, sel ? 0xfff0b0 : 0xd8d0d8);
    });
  };
  add("inv_socket", socket(0, 0));
  add("inv_socket_hi", socket(1, 0));
  add("inv_socket_big", socket(0, 1));
  add("inv_socket_big_hi", socket(1, 1));
  // 제단 위 돌 홈
  const stoneSlot = (sel) => cv(36, 36, (r) => {
    for (let y = 0; y < 36; y++)
      for (let x = 0; x < 36; x++) {
        const d = Math.hypot(x - 17.5, y - 17.5);
        if (d > 18) continue;
        let col = d > 16.5 ? 0x1e1a22 : d > 13 ? sh(0x8a8494, (y < 18 ? 0.15 : -0.2) + (H(x, y) - 0.5) * 0.1) : d > 12 ? 0x1e1a22 : mix(0x3a3444, 0x1a161e, d / 12);
        sel && d > 12 && d < 16.5 && (col = mix(col, 0x80d0ff, 0.45));
        r(x, y, 1, 1, col);
      }
  });
  add("inv_stone", stoneSlot(0));
  add("inv_stone_hi", stoneSlot(1));
  // 융합 제단
  add("inv_altar", cv(200, 110, (r) => {
    // 다리
    for (const x of [26, 150]) for (let y = 50; y < 110; y++) r(x, y, 24, 1, sh(0x6a6474, (x > 100 ? -0.2 : 0) + (y % 9 === 0 ? -0.3 : 0)));
    r(60, 70, 80, 40, 0x4a4454);
    for (let y = 70; y < 110; y += 8) r(60, y, 80, 1, 0x34303c);
    // 상판
    for (let y = 30; y < 60; y++)
      for (let x = 4; x < 196; x++) {
        const top = y < 38;
        let c = top ? sh(0xa8a2b4, (H(x >> 2, y, 3) - 0.5) * 0.12) : sh(0x7a7488, (H(x >> 2, y, 4) - 0.5) * 0.14 - (y - 38) * 0.012);
        y === 30 && (c = 0xd8d2e4);
        y === 38 && (c = 0x5a5464);
        (x === 4 || x === 195) && (c = 0x2a2630);
        r(x, y, 1, 1, c);
      }
    // 앞면 문양
    for (let i = 0; i < 9; i++) r(30 + i * 18, 46, 8, 2, 0x4a90c0, 0.7);
    r(4, 59, 192, 1, 0x1e1a22);
    // 화로 그릇 (양쪽)
    for (const x of [0, 176]) (r(x, 18, 24, 12, 0x3a3440), r(x + 2, 16, 20, 3, 0x5a5464), r(x + 8, 30, 8, 2, 0x2a2630));
  }));
  // 마법진 고리
  add("inv_ring", cv(96, 40, (r) => {
    for (let a = 0; a < 360; a += 1) {
      const t = (a * Math.PI) / 180;
      r(48 + Math.cos(t) * 46, 20 + Math.sin(t) * 18, 1, 1, 0x80d0ff, 0.9);
      r(48 + Math.cos(t) * 38, 20 + Math.sin(t) * 14, 1, 1, 0x80d0ff, 0.5);
    }
    for (let k = 0; k < 8; k++) {
      const t = (k / 8) * Math.PI * 2;
      r(48 + Math.cos(t) * 42 - 1, 20 + Math.sin(t) * 16 - 1, 3, 3, 0xd0f0ff);
    }
  }));
  // 판매 궤짝
  add("inv_crate", cv(120, 46, (r) => {
    for (let y = 0; y < 46; y++)
      for (let x = 0; x < 120; x++) {
        let c = sh(0x9a6a3a, (H(x >> 3, y, 1) - 0.5) * 0.14 + (y % 11 === 0 ? -0.35 : 0) + (y % 11 === 1 ? 0.15 : 0));
        (x < 3 || x > 116) && (c = 0x4a2c16);
        (y < 2 || y > 43) && (c = 0x3a2010);
        r(x, y, 1, 1, c);
      }
    for (let i = 0; i < 116; i += 2) r(3 + i, 4 + i * 0.32, 2, 2, 0x5a3a1e);
    r(0, 0, 120, 46, 0x000000, 0);
  }));
}
