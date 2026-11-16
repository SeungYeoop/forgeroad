// 허브 건물·소품, 타이틀 문장, 무기 다듬기
const sh = (c, f) => {
  const g = (s) => {
    const v = (c >> s) & 255;
    return Math.max(0, Math.min(255, Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f))));
  };
  return (g(16) << 16) | (g(8) << 8) | g(0);
};
const H = (a, b) => {
  let x = (a * 374761393 + b * 668265263) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
};
const OUT = 0x0c0810;
const WARM = 0xffc060;

function stoneWall(b, x, y, w, h, c) {
  b.rect(x, y, w, h, sh(c, -0.4));
  for (let r = 0; r * 5 < h; r++) {
    const off = r % 2 ? 4 : 0;
    for (let k = -1; k * 8 < w; k++) {
      const bx = x + k * 8 + off, by = y + r * 5;
      const x0 = Math.max(x, bx + 1), x1 = Math.min(x + w, bx + 8);
      if (x1 <= x0) continue;
      const tone = sh(c, (H(k + 9, r) - 0.5) * 0.22);
      b.rect(x0, by + 1, x1 - x0, Math.min(4, y + h - by - 1), tone);
      b.rect(x0, by + 1, x1 - x0, 1, sh(tone, 0.2));
    }
  }
}
function timberWall(b, x, y, w, h, plaster, beam) {
  b.rect(x, y, w, h, plaster);
  for (let i = 0; i < h; i += 3) b.rect(x, y + i, w, 1, sh(plaster, -0.04));
  b.rect(x, y, w, 2, beam);
  b.rect(x, y + h - 2, w, 2, beam);
  for (let i = 0; i <= w - 2; i += Math.max(10, Math.floor(w / 4))) b.rect(x + i, y, 2, h, beam);
  b.line(x + 2, y + 2, x + Math.min(w, 14), y + h - 2, beam);
}
function roof(b, x, y, w, h, c, peak = !0) {
  const pts = peak ? [[x - 4, y + h], [x + w / 2, y], [x + w + 4, y + h]] : [[x - 4, y + h], [x + 4, y], [x + w - 4, y], [x + w + 4, y + h]];
  b.poly(pts, sh(c, -0.35));
  for (let r = 0; r < h; r += 3) {
    const t = r / h;
    const half = peak ? (w / 2 + 4) * t : (w / 2) + 4 * t;
    const cx = x + w / 2;
    for (let s = -half; s < half; s += 5) b.rect(cx + s, y + r + 1, 4, 2, sh(c, (H(Math.floor(s), r) - 0.5) * 0.2 + (r < h / 2 ? 0.08 : -0.05)));
  }
  b.line(x - 4, y + h, x + w + 4, y + h, sh(c, -0.55));
  peak && b.line(x + w / 2, y, x + w / 2 + 1, y, sh(c, 0.5));
}
function windowLit(b, x, y, w, h) {
  b.rect(x - 1, y - 1, w + 2, h + 2, 0x3a2418);
  b.rect(x, y, w, h, WARM);
  b.rect(x, y, w, Math.ceil(h / 2), 0xffe0a0);
  b.rect(x + Math.floor(w / 2), y, 1, h, 0x3a2418);
  b.rect(x, y + Math.floor(h / 2), w, 1, 0x3a2418);
  b.circle(x + w / 2, y + h / 2, w * 1.3, WARM, 30);
}
function door(b, x, y, w, h, c = 0x5a3420) {
  b.rect(x - 1, y - 1, w + 2, h + 1, 0x2a1810);
  b.rect(x, y, w, h, c);
  for (let i = 2; i < w; i += 3) b.rect(x + i, y, 1, h, sh(c, -0.25));
  b.px(x + w - 2, y + h / 2, 0xe0b060);
  b.ellipse(x + w / 2, y, w / 2, 2, 0x2a1810);
}
function sign(b, x, y, w, h, icon) {
  b.rect(x, y - 3, 1, 3, 0x3a2418);
  b.rect(x + w - 1, y - 3, 1, 3, 0x3a2418);
  b.rect(x, y, w, h, 0x6a4428);
  b.rect(x, y, w, 1, 0x9a6a40);
  b.rect(x, y + h - 1, w, 1, 0x3a2418);
  icon(x + w / 2, y + h / 2);
}

const PAINT = {
  hub_forge(b, w, h) {
    const gy = h;
    // 굴뚝
    stoneWall(b, w * 0.7, 2, 12, h * 0.45, 0x6a6470);
    b.rect(w * 0.7 - 1, 2, 14, 3, 0x8a8490);
    b.circle(w * 0.7 + 6, 2, 5, 0xff8030, 60);
    stoneWall(b, 8, h * 0.44, w - 16, h * 0.56, 0x7a7068);
    roof(b, 8, h * 0.2, w - 16, h * 0.25, 0x7a3a2a);
    // 화덕 아치
    const ax = 18, ay = h * 0.62, aw = 32, ah = h * 0.38;
    b.rect(ax - 3, ay - 3, aw + 6, ah + 3, 0x3a3236);
    b.ellipse(ax + aw / 2, ay, aw / 2 + 3, 6, 0x3a3236);
    b.rect(ax, ay, aw, ah, 0x1a0a06);
    b.ellipse(ax + aw / 2, ay, aw / 2, 5, 0x1a0a06);
    for (let i = 0; i < 12; i++) b.ellipse(ax + aw / 2 + (H(i, 1) - 0.5) * aw * 0.7, gy - 4 - H(i, 2) * ah * 0.5, 3 + H(i, 3) * 3, 2 + H(i, 4) * 4, i % 3 ? 0xff7a20 : 0xffd060);
    b.circle(ax + aw / 2, gy - ah * 0.4, aw * 0.6, 0xff7a20, 40);
    windowLit(b, w * 0.62, h * 0.55, 10, 10);
    door(b, w * 0.78, h * 0.68, 12, h * 0.32);
    sign(b, w * 0.55, h * 0.4, 18, 10, (cx, cy) => (b.rect(cx - 5, cy - 1, 10, 3, 0x8a8a98), b.rect(cx - 2, cy + 2, 4, 2, 0x6a6a78)));
  },
  hub_armory(b, w, h) {
    timberWall(b, 6, h * 0.42, w - 12, h * 0.58, 0xd8c8a8, 0x5a3a24);
    roof(b, 6, h * 0.12, w - 12, h * 0.3, 0x3a5a7a);
    windowLit(b, w * 0.2, h * 0.55, 10, 10);
    windowLit(b, w * 0.62, h * 0.55, 10, 10);
    door(b, w * 0.42, h * 0.66, 14, h * 0.34);
    sign(b, w * 0.4, h * 0.44, 18, 12, (cx, cy) => (b.poly([[cx - 4, cy - 4], [cx + 4, cy - 4], [cx + 4, cy + 1], [cx, cy + 5], [cx - 4, cy + 1]], 0x8a96a8), b.rect(cx - 1, cy - 3, 2, 6, 0xc04030)));
  },
  hub_training(b, w, h) {
    for (let i = 0; i < 4; i++) b.rect(6 + i * ((w - 14) / 3), h * 0.35, 3, h * 0.65, 0x6a4428);
    roof(b, 2, h * 0.18, w - 4, h * 0.2, 0x8a3a2a, !1);
    b.rect(4, h * 0.82, w - 8, 3, 0x7a5434);
    b.rect(4, h * 0.6, w - 8, 2, 0x7a5434);
    for (let i = 0; i < 3; i++) {
      const x = 14 + i * (w - 28) / 2;
      b.rect(x, h * 0.42, 2, h * 0.16, 0x9a9aa8);
      b.circle(x + 1, h * 0.42, 2, 0x9a9aa8);
    }
    b.poly([[w * 0.8, h * 0.38], [w * 0.92, h * 0.4], [w * 0.88, h * 0.48], [w * 0.8, h * 0.5]], 0xc03030);
  },
  hub_magetower(b, w, h) {
    const tw = w * 0.5, tx = (w - tw) / 2;
    stoneWall(b, tx, h * 0.3, tw, h * 0.7, 0x6a6a88);
    b.rect(tx - 2, h * 0.3, tw + 4, 3, 0x8a8aa8);
    roof(b, tx - 2, 4, tw + 4, h * 0.27, 0x5a2a8a);
    b.circle(w / 2, 4, 3, 0xa0e0ff);
    b.circle(w / 2, 4, 7, 0xa0e0ff, 50);
    for (let i = 0; i < 3; i++) {
      const y = h * 0.4 + i * h * 0.17;
      b.rect(w / 2 - 3, y, 6, 9, 0x2a1838);
      b.rect(w / 2 - 2, y + 1, 4, 7, 0xb080ff);
      b.circle(w / 2, y + 4, 7, 0xb080ff, 30);
    }
    door(b, w / 2 - 6, h * 0.8, 12, h * 0.2, 0x3a2a5a);
  },
  hub_wardrobe(b, w, h) {
    timberWall(b, 6, h * 0.4, w - 12, h * 0.6, 0xe0d0b8, 0x6a4428);
    roof(b, 6, h * 0.1, w - 12, h * 0.3, 0x2a6a4a);
    for (let i = 0; i < w - 12; i += 6) b.poly([[6 + i, h * 0.42], [12 + i, h * 0.42], [9 + i, h * 0.5]], i % 12 ? 0xe8e0d0 : 0xc04040);
    windowLit(b, w * 0.18, h * 0.58, 12, 10);
    door(b, w * 0.6, h * 0.64, 14, h * 0.36);
    sign(b, w * 0.2, h * 0.76, 16, 9, (cx, cy) => (b.poly([[cx - 4, cy - 3], [cx - 1, cy - 3], [cx, cy - 2], [cx + 1, cy - 3], [cx + 4, cy - 3], [cx + 3, cy + 3], [cx - 3, cy + 3]], 0x4a7ac0)));
  },
  hub_board(b, w, h) {
    b.rect(3, h * 0.2, 3, h * 0.8, 0x5a3a24);
    b.rect(w - 6, h * 0.2, 3, h * 0.8, 0x5a3a24);
    b.rect(2, h * 0.15, w - 4, h * 0.55, 0x7a5434);
    b.rect(4, h * 0.18, w - 8, h * 0.49, 0x9a7048);
    b.rect(0, h * 0.12, w, 3, 0x4a2c18);
    for (let i = 0; i < 6; i++) {
      const x = 6 + (i % 3) * ((w - 16) / 3), y = h * 0.22 + Math.floor(i / 3) * h * 0.22;
      b.rect(x, y, (w - 16) / 3 - 2, h * 0.18, i === 4 ? 0xfff0a0 : 0xf0e8d0);
      b.px(x + 3, y + 1, 0xc03030);
      for (let k = 3; k < h * 0.16; k += 2) b.rect(x + 1, y + k, (w - 16) / 3 - 5, 1, 0xa09880);
    }
  },
  hub_gate(b, w, h) {
    stoneWall(b, 0, h * 0.12, w, h * 0.88, 0x7a7680);
    for (let i = 0; i < w; i += 10) b.rect(i, h * 0.06, 7, h * 0.07, 0x8a8690);
    const aw = w * 0.56, ax = (w - aw) / 2, ay = h * 0.34;
    b.rect(ax, ay, aw, h - ay, 0x140e10);
    b.ellipse(w / 2, ay, aw / 2, h * 0.1, 0x140e10);
    for (let i = 4; i < aw; i += 7) b.rect(ax + i, ay - 4, 2, h - ay + 4, 0x4a3a2a);
    for (let y = ay + 6; y < h; y += 9) b.rect(ax, y, aw, 2, 0x4a3a2a);
    b.circle(w / 2, h * 0.65, aw * 0.5, 0xffa040, 25);
    b.rect(w / 2 - 6, h * 0.16, 12, 8, 0x6a4428);
    b.poly([[w / 2 - 3, h * 0.2], [w / 2 + 3, h * 0.2], [w / 2, h * 0.17]], 0xf0d070);
    for (const x of [ax - 6, ax + aw + 3]) (b.rect(x, h * 0.3, 3, h * 0.3, 0xa02020), b.rect(x, h * 0.3, 3, 2, 0xf0d070));
  },
  hub_well(b, w, h) {
    b.rect(3, h * 0.25, 2, h * 0.5, 0x5a3a24);
    b.rect(w - 5, h * 0.25, 2, h * 0.5, 0x5a3a24);
    roof(b, 2, h * 0.06, w - 4, h * 0.22, 0x7a3a2a);
    b.line(w / 2, h * 0.28, w / 2, h * 0.55, 0x8a8478);
    b.rect(w / 2 - 2, h * 0.55, 4, 4, 0x6a4428);
    stoneWall(b, 1, h * 0.62, w - 2, h * 0.38, 0x8a8490);
    b.rect(0, h * 0.62, w, 2, 0xa8a4b0);
  },
  hub_crates(b, w, h) {
    const crate = (x, y, s) => {
      b.rect(x, y, s, s, 0x8a6038);
      b.rect(x, y, s, 1, 0xb88a54);
      b.rect(x, y, 1, s, 0x6a4428);
      b.rect(x + s - 1, y, 1, s, 0x5a3a20);
      b.rect(x, y + s - 1, s, 1, 0x5a3a20);
      b.line(x + 1, y + 1, x + s - 2, y + s - 2, 0x6a4428);
    };
    crate(1, h - 13, 12);
    crate(14, h - 11, 10);
    crate(6, h - 23, 10);
    b.ellipse(w - 6, h - 7, 5, 7, 0x6a4428);
    b.rect(w - 11, h - 10, 10, 1, 0x3a3a40);
    b.rect(w - 11, h - 4, 10, 1, 0x3a3a40);
  },
  hub_anvil(b, w, h) {
    b.rect(w / 2 - 5, h - 8, 10, 8, 0x6a4428);
    b.ellipse(w / 2, h - 8, 5, 2, 0x8a6038);
    b.poly([[2, h - 14], [w - 4, h - 14], [w - 1, h - 12], [w - 6, h - 10], [w / 2 + 3, h - 10], [w / 2 + 2, h - 8], [w / 2 - 3, h - 8], [w / 2 - 4, h - 10], [4, h - 11]], 0x4a4a56);
    b.rect(3, h - 14, w - 7, 1, 0x8a8a98);
    b.px(w / 2, h - 15, 0xffc060);
  },
  hub_armorstand(b, w, h) {
    b.rect(w / 2 - 1, h * 0.3, 2, h * 0.7, 0x6a4428);
    b.rect(w / 2 - 6, h - 2, 12, 2, 0x5a3a24);
    b.rect(w / 2 - 7, h * 0.32, 14, h * 0.32, 0x8a92a4);
    b.rect(w / 2 - 7, h * 0.32, 4, h * 0.32, 0x6a7284);
    b.rect(w / 2 - 2, h * 0.34, 4, h * 0.2, 0xb0b8c8);
    b.circle(w / 2, h * 0.24, 4, 0x8a92a4);
    b.rect(w / 2 - 4, h * 0.24, 8, 1, 0x4a5060);
  },
};

export function makeHubArt(scene, ht, lt) {
  for (const [key, paint] of Object.entries(PAINT)) {
    if (!scene.textures.exists(key)) continue;
    const f = scene.textures.get(key).get(0);
    const w = f.width, h = f.height;
    const b = new ht(w, h);
    try {
      paint(b, w, h);
    } catch (e) {}
    b.outline(OUT);
    b.rimLight(0xffe8c8, 0.15);
    lt(scene, key, b);
  }
}

// 무기 스프라이트 다듬기: 외곽선 + 윗면 빛
export function polishWeapon(buf) {
  buf.outline(OUT);
  buf.rimLight(0xffffff, 0.25);
  return buf;
}

// 타이틀 문장 (모루 + 망치 + 불꽃)
export function makeEmblem(scene, ht, lt) {
  const w = 96, h = 64, b = new ht(w, h);
  b.circle(48, 34, 30, 0x2a1810);
  b.ring(48, 34, 30, 2, 0xc89a5a);
  b.ring(48, 34, 26, 1, 0x6a4a28);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    b.rect(48 + Math.cos(a) * 28 - 1, 34 + Math.sin(a) * 28 - 1, 2, 2, 0xe0b878);
  }
  // 불꽃
  for (let k = 0; k < 3; k++) {
    const c = [0xd03010, 0xff8a20, 0xffe080][k], s = 1 - k * 0.28;
    b.poly([[48, 8 + k * 4], [58 * s + 48 * (1 - s), 26], [54, 34], [48, 30], [42, 34], [48 - 10 * s, 26]], c);
  }
  // 모루
  b.poly([[26, 38], [70, 38], [74, 42], [64, 44], [56, 44], [54, 50], [42, 50], [40, 44], [30, 44], [24, 41]], 0x4a4a58);
  b.rect(27, 38, 43, 2, 0x9a9aa8);
  b.rect(38, 50, 20, 4, 0x3a3a46);
  // 교차한 망치와 검
  b.thickLine(30, 20, 66, 56, 2, 0x8a6038);
  b.poly([[24, 14], [34, 12], [36, 22], [26, 24]], 0x8a8a98);
  b.thickLine(66, 20, 34, 54, 2, 0xc8d0e0);
  b.line(66, 20, 36, 52, 0xffffff);
  b.rect(60, 22, 8, 2, 0xc89a40);
  b.outline(OUT);
  lt(scene, "fr_emblem", b);
}
export function titleFx(sc, R) {
  const W = R.ot, Hh = R.xt;
  for (const o of sc.children.list.slice()) if (o.type === "Text" && o.text === "ENDLESS FRONTIER") o.setText("THE  FORGE  ROAD").setColor("#ffcf80");
  for (const o of sc.children.list.slice()) if (o.type === "Text" && o.text === "리포지") (o.setY(118), o.setDepth(12));
  for (const o of sc.children.list.slice()) if (o.type === "Text" && o.text === "THE  FORGE  ROAD") (o.setY(150), o.setDepth(12));
  for (const o of sc.children.list.slice()) if (o.type === "Text" && String(o.text).startsWith("최고 기록")) o.setY(170).setDepth(12);
  for (const o of sc.children.list.slice()) if (o.type === "Text" && String(o.text).startsWith("클릭")) o.setY(222).setDepth(12);
  const em = sc.add.image(W / 2, 62, "fr_emblem").setDepth(11).setScale(1.2);
  sc.tweens.add({ targets: em, y: 58, duration: 1800, yoyo: !0, repeat: -1, ease: "Sine.easeInOut" });
  const glow = sc.add.image(W / 2, 62, "vx_glow").setDepth(10).setTint(0xff8a30).setBlendMode(R.zt.BlendModes.ADD).setScale(3.4).setAlpha(0.5);
  sc.tweens.add({ targets: glow, alpha: 0.25, duration: 1400, yoyo: !0, repeat: -1 });
  for (let i = 0; i < 5; i++) {
    const r = sc.add.image(W / 2 + (i - 2) * 80, -10, "at_ray").setOrigin(0.5, 0).setDepth(5).setTint(0xffb060).setBlendMode(R.zt.BlendModes.ADD).setAlpha(0.12).setAngle((i - 2) * 8).setScale(1.6, 1.3);
    sc.tweens.add({ targets: r, alpha: 0.04, duration: 2000 + i * 300, yoyo: !0, repeat: -1 });
  }
  sc.add.particles(0, 0, "vx_soft", { x: { min: 0, max: W }, y: Hh + 6, speedY: { min: -60, max: -20 }, speedX: { min: -12, max: 12 }, lifespan: 6000, frequency: 60, scale: { start: 0.35, end: 0 }, alpha: { start: 1, end: 0 }, tint: [0xffc060, 0xff7a30, 0xffe0a0], blendMode: R.zt.BlendModes.ADD }).setDepth(9);
  sc.add.particles(0, 0, "vx_px", { x: { min: 0, max: W }, y: -6, speedY: { min: 14, max: 30 }, speedX: { min: 4, max: 16 }, lifespan: 14000, frequency: 120, alpha: { start: 0.7, end: 0.2 }, tint: 0xb8aca4 }).setDepth(9);
  const v = sc.add.graphics().setDepth(8);
  for (let i = 0; i < 30; i++) v.fillStyle(0x000000, 0.025 * i).fillRect(0, Hh - 60 + i * 2, W, 2);
}
