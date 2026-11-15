// 거점 입체감: 원근 바닥(줄마다 다른 시차), 중경 집들, 전경 실루엣, 빛줄기, 깊이별 먼지, 접지 그림자
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
function cv(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d");
  x.imageSmoothingEnabled = !1;
  const r = (a, b, ww, hh, col, al = 1) => {
    x.globalAlpha = al;
    x.fillStyle = hex(col);
    x.fillRect(Math.round(a), Math.round(b), Math.round(ww), Math.round(hh));
    x.globalAlpha = 1;
  };
  return { c, x, r };
}

// ── 원근 바닥 ──
// 위(먼 쪽)는 작고 흐린 돌, 아래(가까운 쪽)는 크고 진한 돌. 줄마다 따로 잘라 다른 속도로 흐르게 한다.
const TILE = 256;
function floorRows(Hf) {
  const rows = [];
  let y = 0, k = 0;
  // 연석 (건물이 서는 선)
  rows.push({ y: 0, h: 5, kind: "curb", k: k++ });
  y = 5;
  while (y < Hf) {
    const t = y / Hf;
    const h = Math.max(3, Math.round(3 + t * t * 9 + t * 3));
    rows.push({ y, h: Math.min(h, Hf - y), kind: "stone", k: k++, t });
    y += h;
  }
  return rows;
}
function drawRow(row, Hf) {
  const { c, r } = cv(TILE, row.h);
  if (row.kind === "curb") {
    const n = 16, w = TILE / n;
    for (let i = 0; i < n; i++) {
      const col = sh(0xa89484, (H(i, 7) - 0.5) * 0.18);
      r(i * w, 0, w - 1, row.h, col);
      r(i * w, 0, w - 1, 1, sh(col, 0.35));
      r(i * w, row.h - 1, w - 1, 1, sh(col, -0.4));
      r(i * w + w - 1, 0, 1, row.h, 0x2a1e1c);
    }
    return c;
  }
  const t = row.t;
  // 먼 쪽은 노을빛 안개에 묻히고, 가까운 쪽은 진하다
  const haze = 0xb88070, base = 0x8a7266;
  r(0, 0, TILE, row.h, mix(0x241a1c, haze, (1 - t) * 0.35));
  const sw = row.h * (1.7 + H(row.k, 3) * 0.4);
  const n = Math.max(4, Math.round(TILE / sw)), w = TILE / n;
  const off = row.k % 2 ? w / 2 : 0;
  const R5b = (c) => [mix(sh(c, 0.42), 0xfff2d8, 0.18), sh(c, 0.17), c, mix(sh(c, -0.3), 0x3c2848, 0.2), mix(sh(c, -0.52), 0x24183a, 0.32), mix(sh(c, -0.74), 0x140c1e, 0.45)];
  for (let i = -1; i < n + 1; i++) {
    const x0 = Math.round(i * w + off), x1 = Math.round((i + 1) * w + off);
    const col = mix(mix(base, 0xa08878, H(i, row.k, 5)), haze, (1 - t) * 0.4);
    const P5 = R5b(sh(col, -t * 0.1));
    const sw = x1 - x0;
    for (let yy = 0; yy < row.h; yy++)
      for (let xx = 0; xx < sw; xx++) {
        // 둥근 돌: 가운데가 볼록, 왼쪽 위 빛
        const u = (xx + 0.5) / sw * 2 - 1, v = (yy + 0.5) / row.h * 2 - 1;
        const d = u * u * 0.8 + v * v;
        let L = d > 1.05 ? 5 : (-u * 0.5 - v * 0.8) > 0.45 ? 0 : (-u * 0.5 - v * 0.8) > 0.1 ? 1 : (-u * 0.5 - v * 0.8) > -0.35 ? 2 : (-u * 0.5 - v * 0.8) > -0.7 ? 3 : 4;
        (xx === 0 || yy === 0) && (L = 5);
        H(x0 + xx, yy, row.k) > 0.95 && L < 5 && (L = Math.min(4, L + 1));
        r(x0 + xx, yy, 1, 1, P5[L]);
      }
    H(i, row.k, 9) > 0.85 && r(x0 + 2, row.h - 2, Math.max(1, sw * 0.4), 1, 0x4a6a3a, 0.6);
  }
  // 이음새의 깊은 틈
  r(0, 0, TILE, 1, 0x1a1214, 0.8);
  // 끝으로 갈수록 TILE 너비가 정확히 이어지도록 오른쪽 끝 정리
  return c;
}

// ── 중경 집들 (시차 0.62): 벽은 왼쪽 빛·오른쪽 그늘, 기와는 줄마다 볼록 ──
const ramp5 = (b) => [mix(sh(b, 0.42), 0xfff2d8, 0.18), sh(b, 0.17), b, mix(sh(b, -0.3), 0x3c2848, 0.2), mix(sh(b, -0.52), 0x24183a, 0.32), mix(sh(b, -0.74), 0x140c1e, 0.45)];
function midHouses(W, Hh) {
  const { c, x, r } = cv(W, Hh);
  const shadeWall = (px, top, ww, h, wall) => {
    const R5 = ramp5(wall);
    for (let i = 0; i < ww; i++) r(px + i, top, 1, h, R5[i === 0 ? 5 : i === 1 ? 1 : i > ww - 3 ? 4 : i > ww - 7 ? 3 : 2]);
  };
  let px = 0, k = 0;
  while (px < W) {
    const w = 46 + Math.floor(H(k, 1) * 50), h = 60 + Math.floor(H(k, 2) * 50), top = Hh - h;
    const wall = mix(0x5a3a52, 0x7a4a4a, H(k, 3));
    const ww = Math.min(w, W - px);
    // 벽 (왼쪽 밝고 오른쪽 어두운 입체)
    shadeWall(px, top, ww, h, wall);
    // 목조 들보
    if (H(k, 8) > 0.4) {
      for (let yy = top + 14; yy < Hh - 6; yy += 22) r(px, yy, ww, 2, sh(wall, -0.45));
      r(px + ww / 2 - 1, top, 2, h, sh(wall, -0.45));
    }
    // 지붕: 두께 있는 박공
    const rh = 16 + Math.floor(H(k, 4) * 16), roof = mix(0x6a2a2a, 0x3a2a4a, H(k, 6));
    const RR = ramp5(roof);
    for (let j = 0; j < rh; j++) {
      const hw = (w / 2 + 5) * (j / rh), v = j % 4;
      const L = v === 0 ? 1 : v === 3 ? 4 : 2;
      r(px + w / 2 - hw, top - rh + j, hw, 1, RR[L]);
      r(px + w / 2, top - rh + j, hw, 1, RR[Math.min(4, L + 1)]);
      r(px + w / 2 - hw, top - rh + j, 1, 1, RR[5]);
      r(px + w / 2 + hw - 1, top - rh + j, 1, 1, RR[5]);
    }
    r(px - 5, top - 1, w + 10, 1, RR[1]);
    r(px - 5, top, w + 10, 2, RR[4]);
    r(px, top + 2, ww, 3, 0x140c1e, 0.3);
    // 굴뚝
    H(k, 5) > 0.45 && (r(px + w * 0.72, top - rh - 8, 7, rh, sh(wall, -0.2)), r(px + w * 0.72 - 1, top - rh - 9, 9, 2, sh(wall, -0.45)));
    // 창 (불빛)
    for (let wy = top + 8; wy < Hh - 14; wy += 18)
      for (let wx = px + 7; wx < px + ww - 10; wx += 14) {
        const lit = H(wx, wy, k) > 0.42;
        r(wx - 1, wy - 1, 8, 10, sh(wall, -0.5));
        r(wx, wy, 6, 8, lit ? (H(wx, wy) > 0.3 ? 0xffc060 : 0xff9040) : 0x2a2034);
        lit && (r(wx, wy, 6, 1, 0xfff0c0), r(wx + 2, wy, 1, 8, sh(wall, -0.5)));
        lit && (x.globalAlpha = 0.15, x.fillStyle = "#ffb050", x.fillRect(wx - 3, wy - 3, 12, 14), x.globalAlpha = 1);
      }
    // 문
    H(k, 7) > 0.5 && r(px + ww * 0.3, Hh - 14, 8, 14, 0x2a1810);
    px += w + 2 + Math.floor(H(k, 9) * 10);
    k++;
  }
  // 아래쪽 안개
  for (let i = 0; i < 30; i++) {
    x.globalAlpha = (i / 30) * 0.55;
    x.fillStyle = "#c06a6a";
    x.fillRect(0, Hh - 30 + i, W, 1);
  }
  x.globalAlpha = 1;
  return c;
}

// ── 전경 실루엣 (시차 1.55, 화면 맨 아래) ──
function foreground(W, Hh) {
  const { c, r } = cv(W, Hh);
  const D = 0x0c0812, RIM = 0xff9a50;
  let x = 0, k = 0;
  while (x < W) {
    const kind = H(k, 1);
    if (kind < 0.35) {
      // 풀 덤불
      const w = 30 + H(k, 2) * 40;
      for (let i = 0; i < w; i++) {
        const hh = 6 + Math.abs(Math.sin(i * 0.7 + k)) * 10 * (1 - Math.abs(i - w / 2) / w);
        r(x + i, Hh - hh, 1, hh, D);
        i % 3 === 0 && r(x + i, Hh - hh, 1, 1, RIM, 0.55);
      }
      x += w + 40 + H(k, 3) * 80;
    } else if (kind < 0.6) {
      // 울타리 기둥과 밧줄
      const hh = 20 + H(k, 4) * 12;
      r(x, Hh - hh, 6, hh, D);
      r(x, Hh - hh, 6, 1, RIM, 0.6);
      r(x + 5, Hh - hh, 1, hh, RIM, 0.25);
      x += 60 + H(k, 5) * 90;
    } else if (kind < 0.62) {
      // 나무 상자 더미
      const s = 16 + H(k, 6) * 8;
      r(x, Hh - s, s, s, D);
      r(x, Hh - s, s, 1, RIM, 0.5);
      r(x + s - 1, Hh - s, 1, s, RIM, 0.25);
      r(x + s * 0.6, Hh - s * 1.6, s * 0.7, s * 0.6, D);
      r(x + s * 0.6, Hh - s * 1.6, s * 0.7, 1, RIM, 0.5);
      x += s + 70 + H(k, 7) * 90;
    } else {
      // 가로등 기둥 아래쪽
      r(x, Hh - 34, 4, 34, D);
      r(x - 3, Hh - 8, 10, 8, D);
      r(x + 3, Hh - 34, 1, 26, RIM, 0.35);
      x += 120 + H(k, 8) * 100;
    }
    k++;
  }
  return c;
}

// 빛줄기 (세로 그라데이션 쐐기)
function rayCanvas() {
  const { c, x } = cv(64, 256);
  for (let y = 0; y < 256; y++) {
    const t = y / 255, half = 6 + t * 26;
    const g = x.createLinearGradient(32 - half, 0, 32 + half, 0);
    const a = (1 - t) * 0.9;
    g.addColorStop(0, "rgba(255,210,150,0)");
    g.addColorStop(0.5, `rgba(255,220,170,${a})`);
    g.addColorStop(1, "rgba(255,210,150,0)");
    x.fillStyle = g;
    x.fillRect(0, y, 64, 1);
  }
  return c;
}
// 부드러운 원 (보케·빛 웅덩이)
function softCanvas(s, col) {
  const { c, x } = cv(s, s);
  const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, col.replace("A", "1"));
  g.addColorStop(0.5, col.replace("A", "0.35"));
  g.addColorStop(1, col.replace("A", "0"));
  x.fillStyle = g;
  x.fillRect(0, 0, s, s);
  return c;
}

export function enhanceHub(sc, R, gy, out, opts) {
  const { ot: W, xt: Hh, zt } = R;
  const ADD = zt.BlendModes.ADD;
  const tex = (key, canvas) => (sc.textures.exists(key) || sc.textures.addCanvas(key, canvas), key);

  // 중경 집들
  const mid = midHouses(900, 150);
  const midT = sc.add.tileSprite(W / 2, gy - 75 + 2, W, 150, tex("h3_mid", mid)).setScrollFactor(0).setDepth(-94.5).setTint(0xe8c0c8);
  out.layers.push(midT.setData("f", 0.62));
  // 중경 앞 안개
  const fog = sc.add.graphics().setScrollFactor(0).setDepth(-94.2);
  for (let i = 0; i < 20; i++) fog.fillStyle(0xd08070, 0.018 * i).fillRect(0, gy - 50 + i * 2.5, W, 3);

  // 빛줄기
  const rk = tex("h3_ray", rayCanvas());
  out.rays = [];
  for (let i = 0; i < 5; i++) {
    const ray = sc.add.image(140 + i * 130, -10, rk).setOrigin(0.5, 0).setBlendMode(ADD).setScrollFactor(0.25 + i * 0.03, 0).setDepth(-93.5)
      .setRotation(0.42).setScale(1.2 + H(i, 4) * 1.2, 1.4).setAlpha(0.06 + H(i, 5) * 0.05).setTint(0xffc890);
    sc.tweens.add({ targets: ray, alpha: ray.alpha * 0.35, duration: 2600 + i * 700, yoyo: !0, repeat: -1, ease: "Sine.easeInOut" });
    out.rays.push(ray);
  }

  // 원근 바닥: 줄마다 따로 흐른다
  opts.street?.setVisible(!1);
  const Hf = Hh - gy + 4;
  out.floor = [];
  for (const row of floorRows(Hf)) {
    const key = `h3_floor_${row.k}`;
    const t = sc.add.tileSprite(W / 2, gy - 2 + row.y + row.h / 2, W, row.h, tex(key, drawRow(row, Hf))).setScrollFactor(0).setDepth(2);
    // 위(연석)=1.0 → 맨 아래 1.6
    const f = 1 + Math.pow(row.y / Hf, 1.15) * 0.6;
    t.setData("f", f);
    out.floor.push(t);
  }
  // 바닥 위 그늘: 먼 쪽 안개 + 가까운 쪽 어둠
  const fs = sc.add.graphics().setScrollFactor(0).setDepth(2.4);
  for (let i = 0; i < Hf; i++) {
    const t = i / Hf;
    t < 0.25 && fs.fillStyle(0xffa070, 0.1 * (1 - t / 0.25)).fillRect(0, gy - 2 + i, W, 1);
    t > 0.6 && fs.fillStyle(0x05030a, 0.25 * ((t - 0.6) / 0.4)).fillRect(0, gy - 2 + i, W, 1);
  }

  // 건물 접지 그림자 + 해 반대편으로 길게 드리운 그림자
  const shG = sc.add.graphics().setDepth(2.3);
  for (const b of opts.buildings) {
    const w = b.w * 0.82, x0 = b.x - w / 2;
    for (let i = 0; i < 8; i++) shG.fillStyle(0x0a0610, 0.07).fillRect(x0 + i * 2, gy - 2, w - i * 4, 2 + i * 1.2);
    shG.fillStyle(0x0a0610, 0.16).fillPoints([{ x: x0, y: gy - 1 }, { x: x0 + w, y: gy - 1 }, { x: x0 + w - 26, y: gy + 14 }, { x: x0 - 34, y: gy + 14 }], !0);
  }

  // 가로등 빛 웅덩이
  const pool = tex("h3_pool", softCanvas(64, "rgba(255,180,90,A)"));
  for (const x of opts.lamps) {
    const p = sc.add.image(x, gy + 8, pool).setBlendMode(ADD).setScale(1.5, 0.32).setAlpha(0.55).setDepth(2.5);
    sc.tweens.add({ targets: p, alpha: 0.35, duration: 1100 + H(x, 1) * 900, yoyo: !0, repeat: -1, ease: "Sine.easeInOut" });
  }

  // 깊이별 먼지: 먼 곳(작고 흐림) · 가까운 곳(크고 번짐)
  const bok = tex("h3_bokeh", softCanvas(32, "rgba(255,220,170,A)"));
  sc.add.particles(0, 0, "vx_px", {
    x: { min: 0, max: W }, y: { min: 80, max: gy - 10 }, speedX: { min: -6, max: 6 }, speedY: { min: -8, max: -2 },
    lifespan: 7000, frequency: 160, alpha: { start: 0, end: 0.7, ease: "Sine.easeInOut" }, scale: 0.6, tint: [0xffe0b0, 0xffb070], blendMode: ADD,
  }).setScrollFactor(0.5, 0).setDepth(-93);
  sc.add.particles(0, 0, bok, {
    x: { min: -40, max: W + 40 }, y: { min: 120, max: Hh }, speedX: { min: -10, max: 10 }, speedY: { min: -14, max: -4 },
    lifespan: 6000, frequency: 520, alpha: { start: 0, end: 0.22, ease: "Quad.easeOut" }, scale: { min: 0.6, max: 1.6 }, tint: [0xffd0a0, 0xffa060], blendMode: ADD,
  }).setScrollFactor(1.4, 0).setDepth(55);

  // 전경 실루엣
  const fg = sc.add.tileSprite(W / 2, Hh - 22, W, 44, tex("h3_fg", foreground(960, 44))).setScrollFactor(0).setDepth(56);
  fg.setData("f", 1.55).setVisible(!1);
  out.fg3 = fg;
  // 화면 가장자리 어둡게 (렌즈 비네트)
  const vg = sc.add.graphics().setScrollFactor(0).setDepth(57);
  for (let i = 0; i < 18; i++) {
    const a = 0.03;
    vg.fillStyle(0x05030a, a).fillRect(0, 0, 18 - i, Hh).fillRect(W - 18 + i, 0, 18 - i, Hh);
  }
}

export function hub3dUpdate(sc, out) {
  const sx = sc.cameras.main.scrollX;
  for (const t of out.floor ?? []) t.tilePositionX = sx * t.getData("f");
  out.fg3 && (out.fg3.tilePositionX = sx * out.fg3.getData("f"));
}
