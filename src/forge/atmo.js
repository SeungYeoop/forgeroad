// 지역 분위기 연출: 안개·빛줄기·번개·오로라·생물·전경 실루엣
import { undergroundState, CAVE_STYLES } from "./underground.js";
import { FT } from "./natgen.js";
let Z = null, ADD = 1, R = null;
export function bindAtmo(refs) {
  R = refs;
  Z = refs.zt;
  ADD = Z.BlendModes.ADD;
}
const W = 640, H = 360;
const rnd = (a, b) => a + Math.random() * (b - a);

export function bootAtmo(sc) {
  const tex = sc.textures;
  const cv = (key, w, h, f) => {
    tex.exists(key) && tex.remove(key);
    const c = tex.createCanvas(key, w, h);
    f(c.context, w, h);
    c.refresh();
  };
  cv("at_fog", 512, 80, (g, w, h) => {
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * w, y = h * 0.5 + (Math.random() - 0.5) * h * 0.5, r = 18 + Math.random() * 30;
      for (const dx of [-w, 0, w]) {
        const gr = g.createRadialGradient(x + dx, y, 0, x + dx, y, r);
        gr.addColorStop(0, "rgba(255,255,255,0.22)");
        gr.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = gr;
        g.fillRect(0, 0, w, h);
      }
    }
  });
  cv("at_ray", 48, 300, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, "rgba(255,255,255,0.5)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(w * 0.35, 0);
    g.lineTo(w * 0.65, 0);
    g.lineTo(w, h);
    g.lineTo(0, h);
    g.closePath();
    g.fill();
  });
  const px = (key, w, h, frames, f) => {
    const list = [];
    for (let i = 0; i < frames; i++) {
      const b = new R.ht(w, h);
      f(b, i);
      list.push(b);
    }
    R.Et(sc, key, list, w, h);
  };
  const K = 0x1a1418;
  px("at_bird", 9, 5, 2, (b, i) => {
    b.rect(3, 2, 3, 2, K);
    i ? (b.line(0, 4, 3, 2, K), b.line(8, 4, 5, 2, K)) : (b.line(0, 0, 3, 2, K), b.line(8, 0, 5, 2, K));
  });
  px("at_bat", 9, 5, 2, (b, i) => {
    b.rect(4, 1, 1, 3, K);
    i ? (b.poly([[0, 1], [4, 2], [2, 4]], K), b.poly([[8, 1], [4, 2], [6, 4]], K)) : (b.poly([[0, 4], [4, 2], [2, 1]], K), b.poly([[8, 4], [4, 2], [6, 1]], K));
  });
  px("at_fly", 7, 5, 2, (b, i) => {
    b.rect(3, 2, 1, 2, 0xffffff);
    i ? (b.ellipse(1.5, 1.5, 1.5, 1, 0xffffff), b.ellipse(5.5, 1.5, 1.5, 1, 0xffffff)) : (b.ellipse(1.5, 3, 1.5, 1, 0xffffff), b.ellipse(5.5, 3, 1.5, 1, 0xffffff));
  });
  for (const k of ["at_bird", "at_bat", "at_fly"]) {
    sc.anims.exists(k + "_a") && sc.anims.remove(k + "_a");
    sc.anims.create({ key: k + "_a", frames: [{ key: k, frame: 0 }, { key: k, frame: 1 }], frameRate: k === "at_fly" ? 14 : 7, repeat: -1 });
  }
}

// 전경 실루엣 텍스처 (지역별, 640x40 하단 / 640x48 상단)
function fgTex(sc, key, kind, col, top) {
  if (sc.textures.exists(key)) return key;
  const b = new R.ht(W, top ? 48 : 40);
  const h = top ? 48 : 40;
  const rs = (s) => {
    let x = s;
    return () => ((x = (x * 9301 + 49297) % 233280), x / 233280);
  };
  const r = rs(key.length * 77 + 13);
  if (!top) {
    for (let x = 0; x < W; x += 1) {
      const hh = 4 + Math.round(Math.sin(x * 0.02) * 2 + Math.sin(x * 0.07) * 1.5);
      b.rect(x, h - hh, 1, hh, col);
    }
    for (let i = 0; i < 70; i++) {
      const x = Math.floor(r() * W), hh = 6 + r() * 24;
      if (kind === "grass") (b.line(x, h, x - 2 + r() * 4, h - hh, col), b.line(x + 1, h, x + 3, h - hh * 0.7, col));
      else if (kind === "reeds") (b.line(x, h, x, h - hh, col), r() < 0.4 && b.ellipse(x, h - hh, 1, 3, col));
      else if (kind === "rubble") b.poly([[x - 6, h], [x - 2, h - hh * 0.4], [x + 4, h - hh * 0.5], [x + 8, h]], col);
      else if (kind === "crystal") b.poly([[x - 3, h], [x, h - hh], [x + 3, h]], col);
      else if (kind === "ice") b.poly([[x - 4, h], [x - 1, h - hh * 0.8], [x + 4, h]], col);
      else if (kind === "spikes") (b.rect(x, h - hh, 2, hh, col), b.poly([[x - 1, h - hh], [x + 1, h - hh - 5], [x + 3, h - hh]], col));
      else b.poly([[x - 5, h], [x, h - hh * 0.6], [x + 5, h]], col);
    }
  } else {
    for (let i = 0; i < 40; i++) {
      const x = Math.floor(r() * W), hh = 8 + r() * 38;
      if (kind === "vines") for (let y = 0; y < hh; y++) b.px(x + Math.round(Math.sin(y * 0.3) * 1.5), y, col);
      else if (kind === "stalac") b.poly([[x - 4, 0], [x, hh], [x + 4, 0]], col);
      else if (kind === "chains") for (let y = 0; y < hh; y += 4) b.ellipse(x, y + 2, 1.5, 2, col);
      else if (kind === "icicle") b.poly([[x - 2, 0], [x, hh * 0.7], [x + 2, 0]], col);
    }
    b.rect(0, 0, W, 3, col);
  }
  R.lt(sc, key, b);
  return key;
}

const CFG = {
  _: 0,
  grassmere: { fg: "grass", critter: ["at_bird", 0x2a3a52, 1], rays: 0xfff4d0, sun: 0xfff2c8 },
  ashvillage: { fg: "rubble", critter: ["at_bird", 0x1a1418, 0.6], fog: [0x8a7a70, 0.25], glow: 0xff7a30, smoke: 1 },
  mistwood: { dark: 0.22, fg: "grass", top: "vines", critter: ["at_fly", 0xf0e870, 1], fog: [0xd8f4ec, 0.45], rays: 0xfff8d0 },
  echomine: { dark: 0.6, fg: "rubble", top: "stalac", critter: ["at_bat", 0x101018, 0.8], rays: 0x60e0d0, motes: 1 },
  rotmarsh: { dark: 0.38, fg: "reeds", top: "vines", critter: ["at_fly", 0xa8f040, 1], fog: [0x90c060, 0.4] },
  blazefort: { fg: "spikes", top: "chains", critter: ["at_bird", 0x200808, 0.5], glow: 0xff4010, flashes: 0xff8030 },
  frostgorge: { fg: "ice", top: "icicle", critter: ["at_bird", 0x30405a, 0.5], aurora: 1, fog: [0xffffff, 0.2] },
  glassdesert: { fg: "rubble", critter: ["at_bird", 0x4a3020, 0.4], sun: 0xfff0b0, glints: 1 },
  thunderspire: { dark: 0.32, fg: "spikes", top: "chains", critter: ["at_bat", 0x181428, 0.5], lightning: 1, rain: 1 },
  crystalsanctum: { fg: "crystal", critter: ["at_fly", 0xffc0f0, 1], rays: 0xffe0ff, glints: 1 },
  skyruins: { fg: "grass", critter: ["at_bird", 0x405070, 1.2], rays: 0xfff8e0, sun: 0xfffbe0 },
  shadowcapital: { dark: 0.55, fg: "spikes", critter: ["at_bat", 0x0c0814, 1], fog: [0x8070c0, 0.35], rays: 0xc8d0ff },
  forgeheart: { fg: "rubble", top: "chains", critter: ["at_bat", 0x200a04, 0.4], glow: 0xff6010, flashes: 0xffd070 },
};

export function regionFx(sc, reg) {
  clear(sc);
  const id = reg.look ?? reg.bgId ?? reg.id;
  const c = CFG[id];
  if (!c) return;
  const A = (sc.frAtmo = { objs: [], t: 0, c, reg, critT: 0, flashT: rnd(2, 5) });
  const add = (o) => (A.objs.push(o), o);
  const dark = (col, f) => {
    const r = (col >> 16) & 255, g = (col >> 8) & 255, b = col & 255;
    return (Math.round(r * f) << 16) | (Math.round(g * f) << 8) | Math.round(b * f);
  };
  const near = reg.pal.near;
  // 전경 실루엣
  if (c.fg && !1) A.fg = add(sc.add.tileSprite(W / 2, H - 20, W, 40, fgTex(sc, `fg_${id}`, c.fg, dark(near, 0.45))).setScrollFactor(0).setDepth(44).setAlpha(0.95));
  if (c.top) A.top = add(sc.add.tileSprite(W / 2, 24, W, 48, fgTex(sc, `fgt_${id}`, c.top, dark(near, 0.5), !0)).setScrollFactor(0).setDepth(44).setAlpha(0.9));
  // 안개 띠
  if (c.fog) {
    A.fog = A.lowFog = [
        add(sc.add.tileSprite(W / 2, H * 0.7, W, 80, "at_fog").setScrollFactor(0).setDepth(-96).setTint(c.fog[0]).setAlpha(c.fog[1]).setData("y0", H * 0.7)),
        add(sc.add.tileSprite(W / 2, H * 0.86, W, 80, "at_fog").setScrollFactor(0).setDepth(43).setTint(c.fog[0]).setAlpha(c.fog[1] * 0.6).setData("y0", H * 0.86)),
    ];
  }
  // 빛줄기
  if (c.rays) {
    A.rays = [];
    for (let i = 0; i < 4; i++) A.rays.push(add(sc.add.image(rnd(60, W - 60), -10, "at_ray").setOrigin(0.5, 0).setScrollFactor(0).setDepth(-95).setTint(c.rays).setBlendMode(ADD).setAlpha(0.18).setScale(rnd(0.8, 1.6), rnd(0.9, 1.2)).setAngle(rnd(-18, -8))));
  }
  // 아래쪽 열기
  if (c.glow) {
    const g = add(sc.add.graphics().setScrollFactor(0).setDepth(-95).setBlendMode(ADD));
    for (let i = 0; i < 20; i++) g.fillStyle(c.glow, 0.012 * i).fillRect(0, H - 120 + i * 6, W, 6);
    A.glow = g;
  }
  if (c.sun) {
    const s = add(sc.add.image(W * 0.82, 50, "vx_glow").setScrollFactor(0).setDepth(-98).setTint(c.sun).setBlendMode(ADD).setScale(4).setAlpha(0.55));
    A.sun = s;
  }
  if (c.aurora) A.aur = add(sc.add.graphics().setScrollFactor(0).setDepth(-98).setBlendMode(ADD));
  if (c.lightning) A.light = add(sc.add.graphics().setScrollFactor(0).setDepth(-96).setBlendMode(ADD));
  if (c.rain) A.rain = add(sc.add.particles(0, 0, "vx_streak", { x: { min: -40, max: W + 40 }, y: -10, speedY: { min: 420, max: 560 }, speedX: { min: -90, max: -60 }, lifespan: 900, frequency: 14, alpha: { start: 0.35, end: 0.1 }, scale: { start: 0.8, end: 0.8 }, rotate: 100, tint: 0xb0b8ff }).setScrollFactor(0).setDepth(42));
  if (c.motes) add(sc.add.particles(0, 0, "vx_soft", { x: { min: 0, max: W }, y: { min: 0, max: H }, speedY: { min: -6, max: 6 }, speedX: { min: -6, max: 6 }, lifespan: 4000, frequency: 120, alpha: { start: 0, end: 0.5 }, scale: { start: 0.25, end: 0.1 }, tint: 0x80f0e0, blendMode: ADD }).setScrollFactor(0).setDepth(-94));
  if (c.glints) add(sc.add.particles(0, 0, "vx_star", { x: { min: 0, max: W }, y: { min: 40, max: H - 40 }, lifespan: 700, frequency: 160, scale: { start: 0, end: 1.2 }, alpha: { start: 1, end: 0 }, tint: [0xffffff, 0xc0f8ff, 0xffd0f0], blendMode: ADD }).setScrollFactor(0).setDepth(-94));
  if (c.smoke) add(sc.add.particles(0, 0, "vx_smoke", { x: { min: 0, max: W }, y: H + 10, speedY: { min: -30, max: -14 }, speedX: { min: 4, max: 16 }, lifespan: 9000, frequency: 260, alpha: { start: 0.35, end: 0 }, scale: { start: 2, end: 6 }, tint: 0x3a3030 }).setScrollFactor(0).setDepth(-95));
  // 어두운 지역 조명
  if (c.dark) {
    A.rt = add(sc.add.renderTexture(0, 0, W, H).setOrigin(0).setScrollFactor(0).setDepth(42));
    A.stamp = sc.make.image({ key: "vx_glow", add: !1 }).setOrigin(0.5);
    A.objs.push(A.stamp);
  }
  // 처음부터 생물 몇 마리
  for (let i = 0; i < 4; i++) critter(sc, A, !0);
}
function critter(sc, A, anywhere) {
  const [key, col, rate] = A.c.critter ?? [];
  if (!key) return;
  const fly = key === "at_fly";
  const dir = Math.random() < 0.5 ? 1 : -1;
  const n = fly ? 1 : Math.random() < 0.5 ? Math.floor(rnd(3, 7)) : 1;
  const x0 = anywhere ? rnd(40, W - 40) : dir > 0 ? -20 : W + 20;
  const y0 = fly ? rnd(H * 0.3, H * 0.8) : rnd(30, H * 0.45);
  const depth = fly ? 41 : -96; // 새는 배경 (지형 앞으로 날지 않게)
  const sc2 = fly ? 1 : depth < 0 ? rnd(0.7, 1) : rnd(1.2, 1.6);
  for (let i = 0; i < n; i++) {
    const s = sc.add.sprite(x0 - dir * i * rnd(8, 14), y0 + rnd(-10, 10) + (i % 2) * 6, key).setScrollFactor(0).setDepth(depth).setTint(col).setScale(sc2).play(key + "_a").setFlipX(dir < 0);
    fly && s.setBlendMode(ADD);
    A.objs.push(s);
    const o = { s, vx: dir * (fly ? rnd(10, 30) : rnd(40, 80)) * (depth < 0 ? 0.6 : 1), ph: rnd(0, 6), fly, life: fly ? rnd(6, 12) : 30 };
    (A.crit ?? (A.crit = [])).push(o);
  }
}
export function update(sc, dt) {
  const underground = updateUnderground(sc, dt);
  surfaceVisibility(sc.ambient, underground);
  const A = sc.frAtmo;
  if (!A) return;
  for (const object of A.objs) surfaceVisibility(object, underground);
  if (underground) return;
  A.t += dt;
  const c = A.c;
  if (A.fog) (A.fog[0].tilePositionX += dt * 8, A.fog[1].tilePositionX += dt * 16);
  if (A.rt) {
    const cam = sc.cameras.main, p = sc.player;
    A.rt.clear().fill(0x05030c, c.dark);
    const er = (x, y, s) => (A.stamp.setScale(s), A.rt.erase(A.stamp, x - cam.scrollX, y - cam.scrollY));
    if (p) (er(p.cx, p.cy, 3.6 + Math.sin(A.t * 3) * 0.08), er(p.cx, p.cy, 2.2));
    for (const P of sc.frv?.ps ?? []) P.dead || er(P.x, P.y, 1.4);
    for (const z of sc.fr?.zones ?? []) er(z.x, z.y, 1.2);
    for (const k of sc.fr?.pickups ?? []) er(k.x, k.y, 0.8);
  }
  if (A.rays) A.rays.forEach((r, i) => r.setAlpha(0.12 + Math.sin(A.t * 0.6 + i * 1.7) * 0.07));
  if (A.glow) A.glow.setAlpha(0.8 + Math.sin(A.t * 2.3) * 0.2);
  if (A.aur) {
    const g = A.aur;
    g.clear();
    for (let k = 0; k < 3; k++) {
      const col = [0x60ffb0, 0x80c0ff, 0xc080ff][k];
      for (let x = 0; x < W; x += 6) {
        const y = 50 + k * 14 + Math.sin(x * 0.012 + A.t * 0.5 + k) * 18 + Math.sin(x * 0.03 - A.t * 0.8) * 6;
        g.fillStyle(col, 0.08 + 0.05 * Math.sin(x * 0.02 + A.t + k)).fillRect(x, y, 6, 30 + Math.sin(x * 0.05 + A.t) * 10);
      }
    }
  }
  // 번개 섬광
  if (c.lightning || c.flashes) {
    A.flashT -= dt;
    if (A.flashT <= 0) {
      A.flashT = rnd(2.5, 6);
      if (c.lightning && A.light) {
        const g = A.light;
        g.clear();
        let x = rnd(60, W - 60), y = 0;
        g.lineStyle(3, 0xd0c0ff, 0.9).beginPath().moveTo(x, y);
        while (y < H * 0.55) ((x += rnd(-16, 16)), (y += rnd(10, 24)), g.lineTo(x, y));
        g.strokePath();
        g.setAlpha(1);
        sc.tweens.add({ targets: g, alpha: 0, duration: 260 });
        sc.cameras.main.flash(90, 160, 150, 255, !1);
        R.j.play("lightning", 0.25);
      } else if (c.flashes) {
        const f = sc.add.image(rnd(40, W - 40), rnd(H * 0.4, H * 0.7), "vx_glow").setScrollFactor(0).setDepth(-96).setTint(c.flashes).setBlendMode(ADD).setScale(rnd(1.5, 3)).setAlpha(0.7);
        sc.tweens.add({ targets: f, alpha: 0, scale: f.scale * 1.6, duration: 500, onComplete: () => f.destroy() });
      }
    }
  }
  // 생물
  A.critT -= dt;
  if (A.critT <= 0) {
    A.critT = rnd(2, 5) / (c.critter?.[2] ?? 1);
    critter(sc, A, !1);
  }
  if (A.crit)
    for (let i = A.crit.length - 1; i >= 0; i--) {
      const o = A.crit[i];
      o.life -= dt;
      o.s.x += o.vx * dt;
      o.s.y += Math.sin(A.t * (o.fly ? 3 : 2) + o.ph) * (o.fly ? 14 : 8) * dt;
      o.fly && o.s.setAlpha(0.5 + Math.sin(A.t * 5 + o.ph) * 0.5);
      if (o.life <= 0 || o.s.x < -60 || o.s.x > W + 60) (o.s.destroy(), A.crit.splice(i, 1));
    }
}
export function parallax(sc, C, up = 0) {
  const A = sc.frAtmo;
  if (!A) return;
  A.glow && (A.glow.y = Math.min(160, up));
  A.fg && ((A.fg.tilePositionX = C * 1.3), (A.fg.y = H - 20 + Math.min(80, up * 1.3)), A.fg.setVisible(up < 70));
  if (A.lowFog) for (const f of A.lowFog) (f.y = f.getData("y0") + Math.min(H, up * 1.1));
  A.top && (A.top.tilePositionX = C * 1.15);
}
export function clear(sc) {
  const A = sc.frAtmo;
  if (!A) return;
  for (const o of A.objs) o.scene && o.destroy();
  sc.frAtmo = null;
}

function surfaceVisibility(object, hidden) {
  if (!object?.scene || object._frUndergroundHidden === hidden) return;
  object._frUndergroundHidden = hidden;
  object.setVisible(!hidden);
  if (object.type === "ParticleEmitter") {
    if (hidden) object.killAll();
    object.setActive(!hidden);
  }
}

function clearUnderground(sc) {
  for (const object of sc._ugFx?.objects ?? []) if (object.scene) object.destroy();
  sc._ugFx = null;
}

function updateUnderground(sc, dt) {
  const { amount, biome } = undergroundState(sc);
  if (!amount) {
    if (sc._ugFx) clearUnderground(sc);
    return false;
  }
  if (!sc._ugFxBound) {
    sc._ugFxBound = true;
    sc.events.once("shutdown", () => { clearUnderground(sc); sc._ugFxBound = false; });
  }
  if (sc._ugFx?.biome !== biome) {
    clearUnderground(sc);
    const style = CAVE_STYLES[biome] ?? CAVE_STYLES.drip;
    const D = sc._ugFx = { biome, objects: [], fog: [], t: 0, dripT: 0, style };
    const add = object => (D.objects.push(object), object);
    for (let i = 0; i < 2; i++) D.fog.push(add(sc.add.tileSprite(W / 2, H * (0.65 + i * 0.24), W, 90, "at_fog").setScrollFactor(0).setDepth(i ? 7 : -0.7).setTint(style.fog)));
    D.motes = add(sc.add.particles(0, 0, style.crystal ? "vx_star" : "vx_px", {
      x: { min: 0, max: W }, y: { min: 20, max: H },
      speedX: { min: -8, max: 8 }, speedY: style.rise ? { min: -24, max: -8 } : { min: -5, max: 7 },
      lifespan: 5000, frequency: 100, maxAliveParticles: 38,
      alpha: { start: 0.65, end: 0 }, scale: style.crystal ? { start: 0.6, end: 0 } : { start: 1, end: 0.3 },
      tint: style.particles, blendMode: ADD,
    }).setScrollFactor(0).setDepth(8));
    D.motes.emitParticle(12);
    if (style.drips) D.drops = add(sc.add.particles(0, 0, "vx_px", {
      emitting: false, speedY: 35, gravityY: 100, lifespan: 1200,
      scaleX: 0.7, scaleY: { start: 2, end: 0.5 }, alpha: { start: 0.7, end: 0 },
      tint: 0x9dcbdc, maxAliveParticles: 12,
    }).setDepth(8));
  }
  const D = sc._ugFx, cam = sc.cameras.main;
  D.t += dt;
  D.motes.setAlpha(amount * 0.8);
  D.fog.forEach((fog, i) => fog.setAlpha(amount * (i ? 0.12 : 0.22)).setTilePosition(cam.scrollX * (0.12 + i * 0.12) + D.t * (3 + i * 3), 0));
  if (D.drops && (D.dripT -= dt) <= 0) {
    D.dripT = rnd(0.25, 0.65);
    const world = sc.world, col = world.gtx(cam.scrollX + rnd(16, W - 16));
    const first = Math.max(0, Math.floor(cam.scrollY / 16) - 1), last = Math.min(FT - 2, Math.ceil((cam.scrollY + H) / 16));
    for (let row = first; row < last; row++) {
      if (world.code(col, row) !== 1 || world.code(col, row + 1) !== 0) continue;
      let floor = row + 2;
      while (floor < FT && world.code(col, floor) === 0) floor++;
      const fall = Math.max(0, (floor - row - 1) * 16 - 4);
      D.drops.setParticleLifespan(Math.min(2200, 1000 * (Math.sqrt(35 * 35 + 200 * fall) - 35) / 100));
      D.drops.emitParticleAt(world.lx(col) + 8, (row + 1) * 16 + 1);
      break;
    }
  }
  return true;
}

// 허브: 화로 마을 분위기
export function hubFx(sc, gy, width) {
  // 재와 불씨
  sc.add.particles(0, 0, "vx_px", { x: { min: 0, max: W }, y: -6, speedY: { min: 14, max: 34 }, speedX: { min: 4, max: 20 }, lifespan: 12000, frequency: 90, alpha: { start: 0.8, end: 0.3 }, tint: 0xb8aca4 }).setScrollFactor(0).setDepth(50);
  sc.add.particles(0, 0, "vx_soft", { x: { min: 0, max: width }, y: gy + 4, speedY: { min: -40, max: -14 }, speedX: { min: -10, max: 10 }, lifespan: 4000, frequency: 110, scale: { start: 0.3, end: 0 }, alpha: { start: 1, end: 0 }, tint: [0xffc060, 0xff7a30], blendMode: ADD }).setDepth(5);
  // 아래쪽 따뜻한 빛
  const g = sc.add.graphics().setScrollFactor(0).setDepth(-95).setBlendMode(ADD);
  for (let i = 0; i < 20; i++) g.fillStyle(0xff7a30, 0.01 * i).fillRect(0, H - 140 + i * 7, W, 7);
  sc.tweens.add({ targets: g, alpha: 0.6, duration: 1600, yoyo: !0, repeat: -1, ease: "Sine.easeInOut" });
  // 등불 줄
  const posts = [80, 262, 460, 660, 860, 1060, 1300];
  const lg = sc.add.graphics().setDepth(1.5);
  for (let i = 0; i + 1 < posts.length; i++) {
    const x0 = posts[i], x1 = posts[i + 1], y0 = gy - 92;
    lg.lineStyle(1, 0x2a1e1a, 1).beginPath().moveTo(x0, y0);
    for (let k = 1; k <= 20; k++) {
      const u = k / 20;
      lg.lineTo(x0 + (x1 - x0) * u, y0 + Math.sin(u * Math.PI) * 22);
    }
    lg.strokePath();
    for (let k = 1; k < 6; k++) {
      const u = k / 6, x = x0 + (x1 - x0) * u, y = y0 + Math.sin(u * Math.PI) * 22 + 4;
      const col = [0xffc060, 0xff8a3a, 0xffe090][k % 3];
      sc.add.rectangle(x, y, 3, 4, col).setDepth(1.6);
      const gl = sc.add.image(x, y, "vx_glow").setTint(col).setBlendMode(ADD).setScale(0.4).setAlpha(0.6).setDepth(1.6);
      sc.tweens.add({ targets: gl, alpha: 0.3, duration: 600 + Math.random() * 900, yoyo: !0, repeat: -1 });
    }
  }
  // 생물 (박쥐)
  const A = (sc.frAtmo = { objs: [], t: 0, c: { critter: ["at_bat", 0x140c10, 0.5] }, critT: 1, flashT: 99 });
  sc.events.on("update", (_, d) => sc.frAtmo === A && update(sc, d / 1000));
}
