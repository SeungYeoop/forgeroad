// 포지로드 마법 이펙트·마법 동작·융합 합성
// 각 마법 = 전달 방식(del) + 착탄 효과(pay). 융합 마법은 A의 전달 방식에 B의 착탄 효과를 실어 하나로 나간다.
import * as IT from "./items.js";
import { PROJ as EPROJ } from "./interp.js";

let Z = null; // Phaser
let ADD = 1;
export function bindVfx(zt) {
  Z = zt;
  ADD = zt.BlendModes.ADD;
}

// ── 속성 색 ─────────────────────────────────────────
// [핵, 밝음, 본색, 어둠]
export const PAL = {
  fire: [0xffffff, 0xffe27a, 0xff7a1e, 0xb0200c],
  ice: [0xffffff, 0xd8f6ff, 0x68ccff, 0x2a62c8],
  lightning: [0xffffff, 0xfffbb0, 0xffe23a, 0x8a5cff],
  wind: [0xffffff, 0xe0fff2, 0x7af0bc, 0x2a9a74],
  earth: [0xfff2d8, 0xe8c080, 0xb07a40, 0x5a3a1c],
  poison: [0xf4ffc8, 0xc0f458, 0x6cc02c, 0x5a2a7a],
  light: [0xffffff, 0xfffbe6, 0xffe68a, 0xffb030],
  dark: [0xf0d8ff, 0xc088ff, 0x7a2ed8, 0x1c0830],
  none: [0xffffff, 0xf0f0ff, 0xc0c8e0, 0x606880],
};
const mixc = (a, b, t = 0.5) => {
  const f = (s) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return (f(16) << 16) | (f(8) << 8) | f(0);
};
export function parts(el) {
  if (!el) return ["none"];
  const E = IT.ELEMS[el];
  if (!E) return ["none"];
  return E.kind === "pure" ? [E.base] : E.parts;
}
// 순수 속성(같은 속성 2번)은 고유 색
export const PAL_PURE = {
  whiteflame: [0xffffff, 0xf4fbff, 0xc4e2ff, 0x5a8cff],
  absolute: [0xffffff, 0xf2feff, 0xb0f6ff, 0x30a8d8],
  thunder: [0xffffff, 0xf4e8ff, 0xc09cff, 0x6a30e8],
  vacuum: [0xffffff, 0xf2f6ff, 0xc8d4ee, 0x56678c],
  petrify: [0xf6f2ea, 0xccc4b4, 0x8c867a, 0x3c3832],
  venom: [0xf4ffd0, 0xc8ff3c, 0x9a3ae0, 0x2c0a48],
  radiance: [0xffffff, 0xfffff6, 0xfff6cc, 0xffd868],
  pitch: [0xd8c0ff, 0x7040b0, 0x260a3a, 0x050008],
};
export function palOf(el) {
  if (el && PAL_PURE[el]) return PAL_PURE[el];
  const ps = parts(el);
  if (ps.length === 1) return PAL[ps[0]];
  const a = PAL[ps[0]], b = PAL[ps[1]];
  return a.map((c, i) => mixc(c, b[i], 0.5));
}
const rnd = (a, b) => a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(rnd(a, b + 1));

// ── 텍스처 ───────────────────────────────────────────
export function bootVfx(sc, ht, lt) {
  const tex = sc.textures;
  const canvas = (key, w, h, draw) => {
    tex.exists(key) && tex.remove(key);
    const c = tex.createCanvas(key, w, h);
    draw(c.context, w, h);
    c.refresh();
  };
  const radial = (key, size, stops) =>
    canvas(key, size, size, (g, w) => {
      const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
      for (const [o, a] of stops) gr.addColorStop(o, `rgba(255,255,255,${a})`);
      g.fillStyle = gr;
      g.fillRect(0, 0, w, w);
    });
  radial("vx_soft", 16, [[0, 1], [0.35, 0.8], [1, 0]]);
  radial("vx_glow", 64, [[0, 0.9], [0.25, 0.45], [0.6, 0.12], [1, 0]]);
  radial("vx_core", 8, [[0, 1], [0.6, 1], [1, 0]]);
  canvas("vx_ring", 64, 64, (g) => {
    for (let i = 0; i < 4; i++) {
      g.strokeStyle = `rgba(255,255,255,${[0.15, 0.35, 1, 0.35][i]})`;
      g.lineWidth = [7, 4, 2, 1][i];
      g.beginPath();
      g.arc(32, 32, 28, 0, Math.PI * 2);
      g.stroke();
    }
  });
  canvas("vx_smoke", 24, 24, (g) => {
    for (let i = 0; i < 7; i++) {
      const x = 12 + rnd(-5, 5), y = 12 + rnd(-5, 5), r = rnd(4, 8);
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, "rgba(255,255,255,0.55)");
      gr.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = gr;
      g.fillRect(0, 0, 24, 24);
    }
  });
  canvas("vx_streak", 24, 3, (g) => {
    const gr = g.createLinearGradient(0, 0, 24, 0);
    gr.addColorStop(0, "rgba(255,255,255,0)");
    gr.addColorStop(0.7, "rgba(255,255,255,0.9)");
    gr.addColorStop(1, "rgba(255,255,255,1)");
    g.fillStyle = gr;
    g.fillRect(0, 1, 24, 1);
    g.fillStyle = "rgba(255,255,255,0.3)";
    g.fillRect(4, 0, 20, 3);
  });
  const px = (key, w, h, f) => {
    const b = new ht(w, h);
    f(b);
    lt(sc, key, b);
  };
  const Wc = 0xffffff, L = 0xd8d8d8, M = 0xa8a8a8, D = 0x707070;
  px("vx_px", 2, 2, (b) => b.rect(0, 0, 2, 2, Wc));
  px("vx_star", 9, 9, (b) => {
    b.line(4, 0, 4, 8, L);
    b.line(0, 4, 8, 4, L);
    b.rect(3, 3, 3, 3, Wc);
    b.px(2, 2, M); b.px(6, 6, M); b.px(6, 2, M); b.px(2, 6, M);
  });
  px("vx_shard", 9, 4, (b) => b.poly([[0, 2], [3, 0], [9, 2], [3, 4]], L) || b.line(1, 2, 8, 2, Wc));
  px("vx_leaf", 7, 4, (b) => (b.ellipse(3, 2, 3, 1.6, L), b.line(0, 2, 6, 2, M)));
  px("vx_rock", 5, 5, (b) => (b.poly([[0, 2], [2, 0], [5, 1], [4, 5], [1, 5]], M), b.px(2, 1, L), b.px(3, 2, L)));
  px("vx_drop", 3, 4, (b) => (b.rect(1, 0, 1, 1, L), b.rect(0, 1, 3, 3, L), b.px(1, 2, Wc)));
  px("vx_bubble", 7, 7, (b) => (b.ring(3, 3, 3, 1, L), b.px(2, 2, Wc)));
  // 투사체 몸체 (회색조, 속성색으로 물들임)
  px("vp_ball", 14, 14, (b) => (b.circle(7, 7, 6.5, M), b.circle(6, 6, 4.5, L), b.circle(5, 5, 2.5, Wc)));
  px("vp_flame", 20, 14, (b) => {
    b.poly([[0, 7], [8, 1], [16, 3], [20, 7], [16, 11], [8, 13]], D);
    b.poly([[4, 7], [10, 3], [16, 4], [19, 7], [16, 10], [10, 11]], M);
    b.ellipse(14, 7, 4, 3, L);
    b.ellipse(15, 7, 2, 1.5, Wc);
  });
  px("vp_spear", 26, 7, (b) => {
    b.poly([[0, 3], [16, 1], [26, 3], [16, 5]], M);
    b.poly([[4, 3], [17, 2], [25, 3], [17, 4]], L);
    b.line(6, 3, 25, 3, Wc);
    b.poly([[2, 0], [7, 3], [2, 6]], D);
  });
  px("vp_needle", 12, 3, (b) => (b.line(0, 1, 11, 1, L), b.px(11, 1, Wc), b.line(0, 0, 3, 0, M), b.line(0, 2, 3, 2, M)));
  px("vp_crescent", 16, 22, (b) => {
    for (let a = -1.3; a <= 1.3; a += 0.02) {
      const r = 10, x = 4 + Math.cos(a) * r, y = 11 + Math.sin(a) * r;
      const th = 3.2 * Math.cos(a * 1.1);
      b.circle(x, y, Math.max(0.5, th), a > -0.9 && a < 0.9 ? L : M);
    }
    for (let a = -0.9; a <= 0.9; a += 0.02) b.px(4 + Math.cos(a) * 11.5, 11 + Math.sin(a) * 11.5, Wc);
  });
  px("vp_boulder", 18, 18, (b) => {
    b.poly([[2, 8], [6, 2], [13, 1], [17, 7], [16, 14], [9, 17], [3, 14]], D);
    b.poly([[4, 8], [7, 3], [13, 3], [15, 8], [11, 12], [5, 12]], M);
    b.line(7, 6, 11, 9, D);
    b.px(8, 4, L); b.px(9, 4, L);
  });
  px("vp_orb", 18, 18, (b) => {
    b.ring(9, 9, 8, 1.5, M);
    b.circle(9, 9, 5.5, L);
    b.circle(8, 8, 3, Wc);
  });
  // 얼음벽, 손, 마법진, 먹구름
  px("vt_icewall", 22, 60, (b) => {
    b.poly([[2, 60], [4, 14], [11, 0], [18, 12], [20, 60]], M);
    b.poly([[6, 60], [7, 18], [11, 6], [15, 18], [16, 60]], L);
    b.line(11, 8, 11, 58, Wc);
    b.poly([[0, 60], [2, 40], [6, 60]], L);
    b.poly([[16, 60], [20, 44], [22, 60]], L);
  });
  px("vt_hand", 30, 38, (b) => {
    b.poly([[8, 38], [8, 18], [22, 18], [22, 38]], D);
    for (let i = 0; i < 4; i++) b.rect(7 + i * 4, 4 + Math.abs(i - 1.5) * 3, 3.5, 16, M);
    b.rect(22, 16, 6, 4, M);
    b.rect(26, 10, 3, 8, M);
    b.rect(9, 20, 12, 2, L);
  });
  px("vt_sigil", 40, 40, (b) => {
    b.ring(20, 20, 19, 1.4, L);
    b.ring(20, 20, 14, 1, M);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      b.line(20 + Math.cos(a) * 14, 20 + Math.sin(a) * 14, 20 + Math.cos(a + 2.1) * 14, 20 + Math.sin(a + 2.1) * 14, L);
      b.rect(20 + Math.cos(a) * 17 - 1, 20 + Math.sin(a) * 17 - 1, 3, 3, Wc);
    }
  });
  px("vt_cloud", 64, 22, (b) => {
    for (const [x, y, r] of [[12, 13, 9], [24, 9, 10], [38, 8, 11], [50, 12, 9], [32, 15, 10], [18, 16, 7], [46, 17, 7]]) b.circle(x, y, r, D);
    for (const [x, y, r] of [[24, 7, 6], [38, 6, 7]]) b.circle(x, y, r, M);
  });
  // 소환수·수정·묘비 (융합 마법 전용)
  px("vt_skel", 12, 18, (b) => {
    b.circle(6, 3.5, 3.2, L); b.px(5, 3, D); b.px(7, 3, D); b.rect(5, 5, 3, 1, M);
    b.rect(5, 7, 2, 6, L); b.line(3, 8, 9, 8, M); b.line(3, 10, 9, 10, M); b.line(3, 12, 9, 12, M);
    b.line(2, 8, 1, 13, L); b.line(10, 8, 11, 13, L); b.line(5, 13, 4, 17, L); b.line(7, 13, 8, 17, L);
    b.line(11, 4, 11, 13, Wc); b.px(11, 3, Wc);
  });
  px("vt_wraith", 14, 18, (b) => {
    b.circle(7, 6, 5.5, L); b.poly([[1.5, 6], [12.5, 6], [12, 15], [10, 13], [8, 17], [6, 13], [4, 16], [2, 13]], M);
    b.circle(7, 6, 4, Wc); b.rect(4, 5, 2, 2, D); b.rect(8, 5, 2, 2, D); b.rect(6, 9, 2, 1, D);
  });
  px("vt_crystal", 12, 26, (b) => {
    b.poly([[6, 0], [11, 8], [10, 26], [2, 26], [1, 8]], M);
    b.poly([[6, 2], [9, 9], [8, 25], [6, 25]], L); b.line(6, 2, 6, 25, Wc); b.line(3, 9, 3, 24, L);
  });
  px("vt_tomb", 14, 18, (b) => {
    b.poly([[1, 18], [1, 5], [3, 2], [7, 0], [11, 2], [13, 5], [13, 18]], M);
    b.poly([[3, 17], [3, 6], [7, 2], [11, 6], [11, 17]], L); b.rect(6, 5, 2, 8, D); b.rect(4, 7, 6, 2, D);
  });
  px("vt_sun", 24, 24, (b) => {
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; b.line(12 + Math.cos(a) * 8, 12 + Math.sin(a) * 8, 12 + Math.cos(a) * 11.5, 12 + Math.sin(a) * 11.5, i % 2 ? M : L); }
    b.circle(12, 12, 7.5, M); b.circle(12, 12, 6, L); b.circle(11, 11, 3.5, Wc);
  });
}

// ── 입자 발생기 (씬마다 재사용) ─────────────────────
const EM_CFG = {
  flame: (c) => ({ key: "vx_soft", speed: { min: 15, max: 70 }, gravityY: -150, lifespan: { min: 260, max: 560 }, scale: { start: 0.8, end: 0 }, alpha: { start: 0.9, end: 0.2 }, color: [c[1], c[2], c[3]], colorEase: "quad.out", blendMode: ADD }),
  ember: (c) => ({ key: "vx_px", speed: { min: 40, max: 170 }, gravityY: -60, lifespan: { min: 500, max: 1100 }, scale: { start: 1, end: 0.3 }, color: [c[1], c[2]], blendMode: ADD }),
  spark: (c) => ({ key: "vx_px", speed: { min: 90, max: 280 }, lifespan: { min: 140, max: 360 }, scale: { start: 1.4, end: 0 }, color: [c[0], c[1], c[2]], blendMode: ADD }),
  smoke: (c) => ({ key: "vx_smoke", speed: { min: 8, max: 40 }, gravityY: -28, lifespan: { min: 700, max: 1300 }, alpha: { start: 0.55, end: 0 }, scale: { start: 0.5, end: 1.8 }, color: [c[3], mixc(c[3], 0x202020, 0.6)] }),
  mist: (c) => ({ key: "vx_soft", speed: { min: 4, max: 34 }, lifespan: { min: 500, max: 1000 }, alpha: { start: 0.28, end: 0 }, scale: { start: 0.8, end: 2.6 }, color: [c[2], c[3]], blendMode: ADD }),
  shard: (c) => ({ key: "vx_shard", speed: { min: 90, max: 260 }, gravityY: 520, lifespan: { min: 450, max: 900 }, rotate: { min: 0, max: 360 }, scale: { start: 1.1, end: 0.5 }, color: [c[0], c[1], c[2]] }),
  leaf: (c) => ({ key: "vx_leaf", speed: { min: 60, max: 210 }, gravityY: 50, lifespan: { min: 600, max: 1200 }, rotate: { min: 0, max: 360 }, scale: { start: 1.1, end: 0.6 }, color: [c[1], c[2], c[3]] }),
  rock: (c) => ({ key: "vx_rock", speed: { min: 90, max: 260 }, gravityY: 760, lifespan: { min: 550, max: 1000 }, rotate: { min: 0, max: 360 }, scale: { start: 1.2, end: 0.8 }, color: [c[1], c[2], c[3]] }),
  drop: (c) => ({ key: "vx_drop", speed: { min: 40, max: 170 }, gravityY: 520, lifespan: { min: 400, max: 800 }, scale: { start: 1, end: 0.6 }, color: [c[0], c[1], c[2]] }),
  bubble: (c) => ({ key: "vx_bubble", speedY: { min: -60, max: -18 }, speedX: { min: -14, max: 14 }, lifespan: { min: 500, max: 1000 }, scale: { start: 0.5, end: 1.2 }, alpha: { start: 1, end: 0 }, color: [c[1], c[2]] }),
  star: (c) => ({ key: "vx_star", speed: { min: 20, max: 130 }, lifespan: { min: 350, max: 800 }, rotate: { min: 0, max: 90 }, scale: { start: 1.3, end: 0 }, color: [c[0], c[1], c[2]], blendMode: ADD }),
  wisp: (c) => ({ key: "vx_soft", speed: { min: 8, max: 50 }, gravityY: -24, lifespan: { min: 500, max: 1000 }, scale: { start: 0.7, end: 0 }, alpha: { start: 0.8, end: 0 }, color: [c[2], c[3]], blendMode: ADD }),
  dark: (c) => ({ key: "vx_smoke", speed: { min: 6, max: 30 }, gravityY: -12, lifespan: { min: 600, max: 1100 }, alpha: { start: 0.75, end: 0 }, scale: { start: 0.6, end: 1.6 }, color: [c[3], 0x080010] }),
  streak: (c) => ({ key: "vx_streak", speed: { min: 140, max: 320 }, lifespan: { min: 200, max: 420 }, scale: { start: 1.2, end: 0.2 }, alpha: { start: 0.9, end: 0 }, color: [c[0], c[1], c[2]], blendMode: ADD, rotate: { onEmit: (p) => (Math.atan2(p.velocityY, p.velocityX) * 180) / Math.PI, onUpdate: (p) => (Math.atan2(p.velocityY, p.velocityX) * 180) / Math.PI } }),
  glowp: (c) => ({ key: "vx_glow", speed: 0, lifespan: 260, scale: { start: 0.6, end: 1.4 }, alpha: { start: 0.8, end: 0 }, color: [c[1], c[2]], blendMode: ADD }),
};
function em(sc, type, el) {
  const V = sc.frv ?? (sc.frv = { ems: new Map(), ps: [], items: [] });
  const k = `${type}:${el ?? "none"}`;
  let e = V.ems.get(k);
  if (!e || !e.active) {
    const cfg = EM_CFG[type](palOf(el));
    const key = cfg.key;
    delete cfg.key;
    e = sc.add.particles(0, 0, key, { ...cfg, emitting: !1 }).setDepth(type === "smoke" || type === "dark" ? 27 : 29);
    V.ems.set(k, e);
  }
  return e;
}
export function puff(sc, type, el, x, y, n = 8) {
  em(sc, type, el).emitParticleAt(x, y, n);
}
// 속성별 흔적 입자
export function trailEl(sc, el, x, y) {
  for (const p of parts(el)) {
    switch (p) {
      case "fire": puff(sc, "flame", el, x, y, 2); Math.random() < 0.3 && puff(sc, "ember", el, x, y, 1); Math.random() < 0.15 && puff(sc, "smoke", el, x, y, 1); break;
      case "ice": puff(sc, "mist", el, x, y, 1); Math.random() < 0.4 && puff(sc, "star", el, x, y, 1); break;
      case "lightning": puff(sc, "spark", el, x + rnd(-4, 4), y + rnd(-4, 4), 2); break;
      case "wind": Math.random() < 0.5 && puff(sc, "leaf", el, x, y, 1); puff(sc, "mist", el, x, y, 1); break;
      case "earth": puff(sc, "smoke", el, x, y, 1); Math.random() < 0.3 && puff(sc, "rock", el, x, y, 1); break;
      case "poison": Math.random() < 0.5 && puff(sc, "drop", el, x, y, 1); puff(sc, "mist", el, x, y, 1); Math.random() < 0.3 && puff(sc, "bubble", el, x, y, 1); break;
      case "light": puff(sc, "star", el, x, y, 1); puff(sc, "mist", el, x, y, 1); break;
      case "dark": puff(sc, "dark", el, x, y, 1); puff(sc, "wisp", el, x, y, 1); break;
      default: puff(sc, "mist", el, x, y, 1);
    }
  }
}
// 속성별 착탄 폭발
export function impact(sc, el, x, y, s = 1) {
  const c = palOf(el);
  flash(sc, x, y, 26 * s, c[2]);
  if (s >= 0.5) {
    const st = track(sc, sc.add.image(x, y, "vx_star").setTint(c[0]).setBlendMode(ADD).setDepth(31).setScale(2.4 * s).setRotation(rnd(0, 1)));
    sc.tweens.add({ targets: st, scale: 0.3, angle: 60, alpha: 0, duration: 200, onComplete: () => st.destroy() });
  }
  ring(sc, x, y, 34 * s, c[1], 320);
  for (const p of parts(el)) {
    const n = Math.round(10 * s);
    switch (p) {
      case "fire": puff(sc, "flame", el, x, y, n * 2); puff(sc, "ember", el, x, y, n); puff(sc, "smoke", el, x, y - 6, Math.ceil(n / 2)); break;
      case "ice": puff(sc, "shard", el, x, y, n); puff(sc, "mist", el, x, y, n); puff(sc, "star", el, x, y, Math.ceil(n / 2)); break;
      case "lightning": puff(sc, "spark", el, x, y, n * 2); for (let i = 0; i < 3 + s * 2; i++) { const a = rnd(0, 6.28), r = rnd(20, 46) * s; bolt(sc, x, y, x + Math.cos(a) * r, y + Math.sin(a) * r, c, 2, 140); } break;
      case "wind": puff(sc, "streak", el, x, y, n); puff(sc, "leaf", el, x, y, n); spiral(sc, x, y, 30 * s, c[2]); break;
      case "earth": puff(sc, "rock", el, x, y, n); puff(sc, "smoke", el, x, y, n); break;
      case "poison": puff(sc, "drop", el, x, y, n); puff(sc, "bubble", el, x, y, Math.ceil(n / 2)); puff(sc, "mist", el, x, y, n); break;
      case "light": puff(sc, "star", el, x, y, n); rays(sc, x, y, 40 * s, c[1], 8); break;
      case "dark": implodeFx(sc, x, y, 34 * s, el); puff(sc, "dark", el, x, y, n); break;
      default: puff(sc, "spark", el, x, y, n);
    }
  }
}

// ── 그래픽 도우미 ───────────────────────────────────
export function track(sc, o, life = 3) {
  (sc.frv ?? (sc.frv = { ems: new Map(), ps: [], items: [] })).items.push({ o, life });
  return o;
}
export function flash(sc, x, y, r, col, dur = 220) {
  const g = track(sc, sc.add.image(x, y, "vx_glow").setTint(col).setBlendMode(ADD).setDepth(30).setScale(r / 24).setAlpha(0.6));
  sc.tweens.add({ targets: g, scale: (r / 24) * 1.5, alpha: 0, duration: dur, onComplete: () => g.destroy() });
}
export function ring(sc, x, y, r, col, dur = 340, w = 1) {
  const g = track(sc, sc.add.image(x, y, "vx_ring").setTint(col).setBlendMode(ADD).setDepth(30).setScale(0.1).setAlpha(1));
  sc.tweens.add({ targets: g, scale: r / 28, alpha: 0, duration: dur, ease: "Cubic.easeOut", onComplete: () => g.destroy() });
}
export function bolt(sc, x0, y0, x1, y1, c, w = 3, dur = 200, branch = !0) {
  const g = track(sc, sc.add.graphics().setDepth(31).setBlendMode(ADD));
  const pts = [[x0, y0]];
  const n = Math.max(3, Math.round(Math.hypot(x1 - x0, y1 - y0) / 14));
  for (let i = 1; i < n; i++) {
    const t = i / n;
    pts.push([x0 + (x1 - x0) * t + rnd(-9, 9), y0 + (y1 - y0) * t + rnd(-9, 9)]);
  }
  pts.push([x1, y1]);
  const stroke = (lw, col, a) => {
    g.lineStyle(lw, col, a).beginPath().moveTo(pts[0][0], pts[0][1]);
    for (const p of pts) g.lineTo(p[0], p[1]);
    g.strokePath();
  };
  stroke(w * 4, c[3] ?? c[2], 0.3);
  stroke(w * 2, c[2], 0.7);
  stroke(Math.max(1, w * 0.6), c[0], 1);
  if (branch)
    for (let i = 1; i < pts.length - 1; i++)
      if (Math.random() < 0.35) {
        const [bx, by] = pts[i];
        const a = rnd(0, 6.28), l = rnd(10, 24);
        g.lineStyle(1, c[1], 0.9).lineBetween(bx, by, bx + Math.cos(a) * l, by + Math.sin(a) * l);
      }
  sc.tweens.add({ targets: g, alpha: 0, duration: dur, ease: "Quad.easeIn", onComplete: () => g.destroy() });
}
export function beam(sc, x0, y0, x1, y1, c, w = 8, dur = 300) {
  const g = track(sc, sc.add.graphics().setDepth(31).setBlendMode(ADD));
  g.lineStyle(w * 3, c[3] ?? c[2], 0.25).lineBetween(x0, y0, x1, y1);
  g.lineStyle(w * 1.6, c[2], 0.7).lineBetween(x0, y0, x1, y1);
  g.lineStyle(w * 0.7, c[1], 1).lineBetween(x0, y0, x1, y1);
  g.lineStyle(Math.max(1, w * 0.25), c[0], 1).lineBetween(x0, y0, x1, y1);
  sc.tweens.add({ targets: g, alpha: 0, duration: dur, ease: "Quad.easeIn", onComplete: () => g.destroy() });
}
export function pillar(sc, x, y, c, w = 14, dur = 420, h = 320) {
  const g = track(sc, sc.add.graphics().setDepth(31).setBlendMode(ADD));
  g.fillStyle(c[3] ?? c[2], 0.25).fillRect(x - w * 1.2, y - h, w * 2.4, h);
  g.fillStyle(c[2], 0.6).fillRect(x - w / 2, y - h, w, h);
  g.fillStyle(c[1], 0.9).fillRect(x - w / 4, y - h, w / 2, h);
  g.fillStyle(c[0], 1).fillRect(x - w / 10, y - h, w / 5, h);
  g.fillStyle(c[1], 0.6).fillEllipse(x, y, w * 5, w * 1.2);
  sc.tweens.add({ targets: g, alpha: 0, duration: dur, ease: "Cubic.easeIn", onComplete: () => g.destroy() });
  flash(sc, x, y, w * 2.4, c[1]);
}
export function rays(sc, x, y, r, col, n = 8) {
  const g = track(sc, sc.add.graphics().setDepth(31).setBlendMode(ADD));
  const o = rnd(0, 1);
  for (let i = 0; i < n; i++) {
    const a = o + (i / n) * Math.PI * 2, l = r * (i % 2 ? 0.6 : 1.1);
    g.lineStyle(i % 2 ? 1 : 2, col, 0.9).lineBetween(x, y, x + Math.cos(a) * l, y + Math.sin(a) * l);
  }
  g.setScale(0.4);
  g.x = x * 0.6;
  g.y = y * 0.6;
  sc.tweens.add({ targets: g, scale: 1, x: 0, y: 0, alpha: 0, duration: 380, ease: "Cubic.easeOut", onComplete: () => g.destroy() });
}
export function spiral(sc, x, y, r, col) {
  const g = track(sc, sc.add.graphics().setDepth(31).setBlendMode(ADD));
  const o = { t: 0 };
  sc.tweens.add({
    targets: o, t: 1, duration: 420,
    onUpdate: () => {
      g.clear();
      for (let k = 0; k < 3; k++) {
        g.lineStyle(2, col, (1 - o.t) * 0.9).beginPath();
        for (let i = 0; i <= 20; i++) {
          const u = i / 20, a = k * 2.09 + u * 4 + o.t * 6, rr = r * u * (0.5 + o.t);
          i ? g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.6) : g.moveTo(x, y);
        }
        g.strokePath();
      }
    },
    onComplete: () => g.destroy(),
  });
}
export function implodeFx(sc, x, y, r, el) {
  const c = palOf(el);
  for (let i = 0; i < 14; i++) {
    const a = rnd(0, 6.28);
    const s = track(sc, sc.add.image(x + Math.cos(a) * r, y + Math.sin(a) * r, "vx_soft").setTint(i % 2 ? c[2] : c[1]).setBlendMode(ADD).setDepth(30).setScale(0.8));
    sc.tweens.add({ targets: s, x, y, scale: 0.1, duration: 260, ease: "Quad.easeIn", onComplete: () => s.destroy() });
  }
  sc.time.delayedCall(240, () => (ring(sc, x, y, r * 1.2, c[2], 300), flash(sc, x, y, r * 0.8, c[1])));
}

// ── 투사체 ───────────────────────────────────────────
// o: {spr, x, y, ang, speed, life, r, pierce, homing, grav, scale, el, spin, glow, onHit(t,x,y), onEnd(x,y), noTerrain}
export function proj(K, o) {
  const sc = K.sc;
  const c = palOf(o.el ?? K.el);
  const s = sc.add.image(o.x, o.y, o.spr).setTint(c[2]).setDepth(28).setScale(o.scale ?? 1);
  const core = sc.add.image(o.x, o.y, "vx_soft").setTint(c[1]).setBlendMode(ADD).setDepth(29).setScale((o.scale ?? 1) * 0.45).setAlpha(0.9);
  const glow = sc.add.image(o.x, o.y, "vx_glow").setTint(c[2]).setBlendMode(ADD).setDepth(27).setAlpha(0.35).setScale(((o.glow ?? 1) * (o.scale ?? 1)) / 2.2);
  const P = {
    K, s, core, glow, x: o.x, y: o.y,
    vx: Math.cos(o.ang) * o.speed, vy: Math.sin(o.ang) * o.speed,
    life: (o.life ?? 1.4) * (K.spec?.m?.long ? 1.6 : 1), r: o.r ?? 7, pierce: K.spec?.m?.pierce ? 99 : o.pierce ?? 0, homing: o.homing || (K.spec?.m?.homing ? 3 : 0), grav: o.grav ?? 0, spin: o.spin ?? 0,
    el: o.el ?? K.el, onHit: o.onHit, onEnd: o.onEnd, tick: o.tick, hits: new Set(), noTerrain: o.noTerrain, tt: 0, trail: o.trail ?? 1, speed: o.speed, dead: !1,
  };
  (sc.frv ?? (sc.frv = { ems: new Map(), ps: [], items: [] })).ps.push(P);
  K.focus || (K.focus = () => (P.dead ? null : { x: P.x, y: P.y }));
  return P;
}
export function endProj(P) {
  if (P.dead) return;
  P.dead = !0;
  P.onEnd?.(P.x, P.y);
  for (const o of [P.s, P.core, P.glow]) o.destroy();
}
export function updateVfx(sc, dt) {
  const V = sc.frv;
  if (!V) return;
  for (let i = V.ps.length - 1; i >= 0; i--) {
    const P = V.ps[i];
    if (P.dead) {
      V.ps.splice(i, 1);
      continue;
    }
    P.life -= dt;
    if (P.homing) {
      const t = P.K.near(P.x, P.y, 260, 1)[0];
      if (t) {
        const want = Math.atan2(t.body.y - t.body.h / 2 - P.y, t.body.x - P.x);
        let a = Math.atan2(P.vy, P.vx);
        let d = want - a;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        a += Math.max(-P.homing * dt, Math.min(P.homing * dt, d));
        P.vx = Math.cos(a) * P.speed;
        P.vy = Math.sin(a) * P.speed;
      }
    }
    P.vy += P.grav * dt;
    P.x += P.vx * dt;
    P.y += P.vy * dt;
    const rot = P.spin ? P.s.rotation + P.spin * dt : Math.atan2(P.vy, P.vx);
    P.s.setPosition(P.x, P.y).setRotation(rot);
    P.core.setPosition(P.x, P.y);
    P.glow.setPosition(P.x, P.y).setAlpha(0.3 + Math.sin(P.tt * 30) * 0.08);
    P.tt += dt;
    P.tick?.(P, dt);
    if (P.dead) continue;
    if (P.trail) trailEl(sc, P.el, P.x - P.vx * 0.012, P.y - P.vy * 0.012);
    for (const t of P.K.tin(P.x, P.y, P.r)) {
      if (P.hits.has(t)) continue;
      P.hits.add(t);
      P.onHit?.(t, P.x, P.y);
      if (P.pierce-- <= 0) break;
    }
    if (P.pierce < 0 || P.life <= 0 || (!P.noTerrain && sc.collider.solidAtPx(P.x, P.y))) endProj(P);
  }
  for (let i = V.items.length - 1; i >= 0; i--) {
    const it = V.items[i];
    it.life -= dt;
    if (!it.o.active || it.life <= 0) V.items.splice(i, 1);
  }
}
export function shiftVfx(sc, T) {
  const V = sc.frv;
  if (!V) return;
  for (const P of V.ps) P.x -= T;
  for (const it of V.items) it.o.active && it.o.x !== void 0 && (it.o.x -= T);
  for (const e of V.ems.values()) e.forEachAlive?.((p) => (p.x -= T));
}
export function clearVfx(sc) {
  const V = sc.frv;
  if (!V) return;
  for (const P of V.ps) for (const o of [P.s, P.core, P.glow]) o.destroy();
  sc.frv = null;
}

// ── 착탄 효과 (융합 재료) ───────────────────────────
// K: {sc, p, el, B, hit(t,mult,extra), tin(x,y,r), trect, near, gy(x,y), zone(z), applyEl, size}
export const PAY = {
  blast(K, x, y, s) {
    impact(K.sc, K.el, x, y, 1.2 * s);
    for (const t of K.tin(x, y, 42 * s * K.size)) K.hit(t, 1 * s, { knock: 220, stagger: 0.5, source: "aoe" });
    K.sc.fx.shake(2 + s * 2);
  },
  bigblast(K, x, y, s) {
    impact(K.sc, K.el, x, y, 2.2 * s);
    ring(K.sc, x, y, 90 * s, palOf(K.el)[1], 500);
    for (const t of K.tin(x, y, 76 * s * K.size)) K.hit(t, 1.5 * s, { knock: 300, knockUp: 180, stagger: 0.7, source: "aoe", heavy: !0 });
    K.zone({ kind: "pool", x, y: K.gy(x, y), r: 50 * s, t: 2.6, el: K.el, dmg: K.B * 0.25, tick: 0.4 });
    K.sc.fx.shake(6);
    K.sc.cameras.main.flash(110, 255, 210, 160);
  },
  shards(K, x, y, s) {
    const n = Math.round(5 * s + 1);
    for (let i = 0; i < n; i++)
      proj(K, { spr: "vx_shard", x, y, ang: -Math.PI / 2 + (i - (n - 1) / 2) * 0.45 + rnd(-0.1, 0.1), speed: 300, life: 0.55, r: 5, scale: 1.6, grav: 500, trail: 0, glow: 0.5,
        onHit: (t, xx, yy) => (K.hit(t, 0.35 * s, { knock: 60 }), puff(K.sc, "spark", K.el, xx, yy, 4)) });
  },
  freeze(K, x, y, s) {
    impact(K.sc, K.el, x, y, s);
    for (const t of K.tin(x, y, 50 * s * K.size)) {
      K.hit(t, 0.6 * s, { knock: 30 });
      t.statuses.apply({ type: "chill", chance: 1, dur: 3, power: 0.55 }, 0);
      t._frIce = (t._frIce ?? 0) + 3;
      K.sc.fx.anim("icespike", t.body.x, t.body.y - 16, { scale: 1.2, tint: palOf(K.el)[1] });
    }
  },
  shock(K, x, y, s) {
    const c = palOf(K.el);
    puff(K.sc, "spark", K.el, x, y, 14);
    let px = x, py = y;
    const seen = new Set();
    for (let i = 0; i < Math.round(2 + s * 2); i++) {
      const t = K.near(px, py, 130, 1, seen)[0];
      if (!t) break;
      seen.add(t);
      const tx = t.body.x, ty = t.body.y - t.body.h / 2;
      bolt(K.sc, px, py, tx, ty, c, 2, 180);
      K.hit(t, 0.55 * s, { knock: 40, stagger: 0.25 });
      ((px = tx), (py = ty));
    }
  },
  chain(K, x, y, s) {
    PAY.shock(K, x, y, s * 1.6);
  },
  lava(K, x, y, s) {
    impact(K.sc, K.el, x, y, s);
    K.zone({ kind: "pool", x, y: K.gy(x, y), r: 48 * s, t: 3, el: K.el, dmg: K.B * 0.3 * s, tick: 0.4 });
  },
  cloud(K, x, y, s) {
    K.zone({ kind: "cloud", x, y, r: 54 * s, t: 4, el: K.el, dmg: K.B * 0.16 * s, tick: 0.4 });
    puff(K.sc, "mist", K.el, x, y, 16);
  },
  pull(K, x, y, s) {
    implodeFx(K.sc, x, y, 60 * s, K.el);
    for (const t of K.tin(x, y, 110 * s)) t.kind !== "boss" && (t.body.x += (x - t.body.x) * 0.55);
    K.sc.time.delayedCall(260, () => {
      for (const t of K.tin(x, y, 40 * s)) K.hit(t, 0.8 * s, { knock: 10 });
    });
  },
  knock(K, x, y, s) {
    impact(K.sc, K.el, x, y, s);
    puff(K.sc, "streak", K.el, x, y, 16);
    for (const t of K.tin(x, y, 60 * s)) K.hit(t, 0.6 * s, { knock: 520, knockUp: 140, stagger: 0.5 });
  },
  knockup(K, x, y, s) {
    puff(K.sc, "streak", K.el, x, y, 10);
    spiral(K.sc, x, y, 36 * s, palOf(K.el)[2]);
    for (const t of K.tin(x, y, 50 * s)) K.hit(t, 0.6 * s, { knockUp: 380, knock: 20 });
  },
  rocks(K, x, y, s) {
    impact(K.sc, K.el, x, y, s);
    puff(K.sc, "rock", "earth", x, y, 14);
    const n = Math.round(3 + s * 2);
    for (let i = 0; i < n; i++)
      proj(K, { spr: "vx_rock", x, y: y - 4, ang: -Math.PI / 2 + rnd(-1.1, 1.1), speed: rnd(160, 260), life: 1, r: 5, scale: 2.2, grav: 700, trail: 0, glow: 0.3, spin: 10, onHit: (t) => K.hit(t, 0.35 * s, { knock: 90 }) });
  },
  spikes(K, x, y, s) {
    const gy = K.gy(x, y);
    for (let i = -1; i <= 1; i++) {
      const sx = x + i * 20;
      K.sc.time.delayedCall(Math.abs(i) * 70, () => {
        K.sc.fx.anim(parts(K.el)[0] === "ice" ? "icespike" : "rockspike", sx, gy - 16, { scale: 1.2 * s, tint: palOf(K.el)[1], depth: 24 });
        puff(K.sc, "rock", K.el, sx, gy, 4);
        for (const t of K.trect(sx - 12, sx + 12, gy - 44, gy + 4)) K.hit(t, 0.5 * s, { knockUp: 260 });
      });
    }
  },
  stun(K, x, y, s) {
    ring(K.sc, x, y, 50 * s, palOf(K.el)[1]);
    rays(K.sc, x, y, 44 * s, palOf(K.el)[0], 10);
    for (const t of K.tin(x, y, 50 * s)) (t.statuses.apply({ type: "stun", chance: 1, dur: 1.2 * s }, 0), K.hit(t, 0.4 * s, { knock: 0 }));
  },
  root(K, x, y, s) {
    const t = K.near(x, y, 60, 1)[0];
    const tx = t ? t.body.x : x, gy = K.gy(tx, t ? t.body.y - 4 : y);
    const hd = track(K.sc, K.sc.add.image(tx, gy + 30, "vt_hand").setOrigin(0.5, 1).setTint(palOf(K.el)[2]).setDepth(24));
    K.sc.tweens.add({ targets: hd, y: gy + 6, duration: 160, ease: "Back.easeOut", yoyo: !0, hold: 900, onComplete: () => hd.destroy() });
    puff(K.sc, "rock", K.el, tx, gy, 8);
    for (const u of K.tin(tx, gy - 12, 30)) (u.statuses.apply({ type: "stun", chance: 1, dur: 1.5 * s }, 0), K.hit(u, 0.5 * s, { knock: 0 }));
  },
  poison(K, x, y, s) {
    puff(K.sc, "drop", K.el, x, y, 12);
    puff(K.sc, "bubble", K.el, x, y, 6);
    for (const t of K.tin(x, y, 40 * s)) (t.statuses.apply({ type: "poison", chance: 1, dur: 5, power: 0.3 * s }, K.B), K.hit(t, 0.3 * s, { knock: 0 }));
  },
  armor(K, x, y, s) {
    const t = K.near(x, y, 50, 1)[0];
    if (!t) return;
    sigil(K, t, 1);
    t.statuses.apply({ type: "armorBreak", chance: 1, dur: 6, power: 0.35 }, 1);
    t.statuses.apply({ type: "poison", chance: 1, dur: 6, power: 0.3 * s }, K.B);
  },
  cross(K, x, y, s) {
    const c = palOf(K.el);
    beam(K.sc, x - 40 * s, y, x + 40 * s, y, c, 5, 300);
    beam(K.sc, x, y - 50 * s, x, y + 30 * s, c, 5, 300);
    rays(K.sc, x, y, 50 * s, c[0], 12);
    puff(K.sc, "star", K.el, x, y, 12);
    for (const t of K.tin(x, y, 44 * s)) K.hit(t, 0.8 * s, { knock: 120 });
  },
  pillar(K, x, y, s) {
    const gy = K.gy(x, y);
    pillar(K.sc, x, gy, palOf(K.el), 12 * s, 420);
    for (const t of K.trect(x - 16 * s, x + 16 * s, gy - 240, gy + 4)) K.hit(t, 0.9 * s, { knock: 60, stagger: 0.5 });
  },
  heal(K, x, y, s) {
    K.p.heal(K.p.maxHp * 0.04 * s, !0);
    puff(K.sc, "star", "light", K.p.cx, K.p.cy, 6);
  },
  implode(K, x, y, s) {
    implodeFx(K.sc, x, y, 50 * s, K.el);
    for (const t of K.tin(x, y, 80 * s)) t.kind !== "boss" && (t.body.x += (x - t.body.x) * 0.4);
    K.sc.time.delayedCall(250, () => {
      for (const t of K.tin(x, y, 46 * s)) K.hit(t, 0.9 * s, { knock: 200, source: "aoe" });
    });
  },
  drain(K, x, y, s) {
    const t = K.near(x, y, 60, 1)[0];
    if (!t) return;
    tether(K, t, 280);
    const d = K.hit(t, 0.5 * s, { knock: 0 });
    K.p.heal(d * 0.3, !1);
  },
  curse(K, x, y, s) {
    const t = K.near(x, y, 60, 1)[0];
    if (!t) return;
    sigil(K, t, 1.2);
    t.statuses.apply({ type: "curse", chance: 1, dur: 6, power: 0.3 * s }, 1);
  },
  burn(K, x, y, s) {
    puff(K.sc, "flame", K.el, x, y, 16);
    for (const t of K.tin(x, y, 40 * s)) (t.statuses.apply({ type: "burn", chance: 1, dur: 4, power: 0.35 * s }, K.B), K.hit(t, 0.3 * s, { knock: 30 }));
  },
  cut(K, x, y, s) {
    const c = palOf(K.el);
    beam(K.sc, x - 22, y - 22, x + 22, y + 22, c, 3, 200);
    beam(K.sc, x - 22, y + 22, x + 22, y - 22, c, 3, 200);
    puff(K.sc, "streak", K.el, x, y, 8);
    for (const t of K.tin(x, y, 30 * s)) (K.hit(t, 0.4 * s), t.statuses.apply({ type: "bleed", chance: 1, dur: 3, power: 0.22 }, K.B));
  },
  orbs(K, x, y, s) {
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      proj(K, { spr: "vp_ball", x, y, ang: a, speed: 160, life: 1.4, r: 6, scale: 0.7, homing: 4, onHit: (t, xx, yy) => (K.hit(t, 0.35 * s), impact(K.sc, K.el, xx, yy, 0.5)) });
    }
  },
};
export function sigil(K, t, s = 1) {
  const c = palOf(K.el);
  const sg = track(K.sc, K.sc.add.image(t.body.x, t.body.y - t.body.h - 14, "vt_sigil").setTint(c[1]).setBlendMode(ADD).setDepth(30).setScale(0.2 * s));
  K.sc.tweens.add({ targets: sg, scale: 0.8 * s, angle: 180, duration: 400, ease: "Back.easeOut" });
  K.sc.tweens.add({ targets: sg, alpha: 0, delay: 900, duration: 300, onComplete: () => sg.destroy() });
  puff(K.sc, "dark", K.el, t.body.x, t.body.y - t.body.h / 2, 8);
}
export function tether(K, t, dur) {
  const sc = K.sc, c = palOf(K.el);
  const g = track(sc, sc.add.graphics().setDepth(31).setBlendMode(ADD));
  const o = { k: 0 };
  sc.tweens.add({
    targets: o, k: 1, duration: dur,
    onUpdate: () => {
      g.clear();
      const x0 = t.body.x, y0 = t.body.y - t.body.h / 2, x1 = K.p.cx, y1 = K.p.cy;
      for (let w = 3; w >= 1; w--) {
        g.lineStyle(w * 2, w === 1 ? c[0] : c[2], 0.5 + (3 - w) * 0.2).beginPath().moveTo(x0, y0);
        for (let i = 1; i <= 12; i++) {
          const u = i / 12;
          g.lineTo(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u + Math.sin(u * 9 + o.k * 20) * 6 * (1 - u));
        }
        g.strokePath();
      }
    },
    onComplete: () => g.destroy(),
  });
  for (let i = 0; i < 10; i++) {
    const s = track(sc, sc.add.image(t.body.x + rnd(-8, 8), t.body.y - t.body.h / 2 + rnd(-8, 8), "vx_soft").setTint(c[1]).setBlendMode(ADD).setDepth(30));
    sc.tweens.add({ targets: s, x: K.p.cx, y: K.p.cy, scale: 0.2, duration: 260 + i * 30, ease: "Quad.easeIn", onComplete: () => s.destroy() });
  }
}

// ── 마법 34종: 전달 방식 + 기본 착탄 ───────────────
// pay: 이 마법을 융합 재료로 쓸 때 실리는 착탄 효과
export const MAGIC = {
  M01: { pay: "blast", del: "fireball" },
  M02: { pay: "burn", del: "flameRing" },
  M03: { pay: "burn", del: "breath" },
  M04: { pay: "bigblast", del: "meteor" },
  M05: { pay: "shards", del: "iceSpear" },
  M06: { pay: "freeze", del: "frostNova" },
  M07: { pay: "freeze", del: "iceWall" },
  M08: { pay: "freeze", del: "frostOrb" },
  M09: { pay: "shock", del: "boltLine" },
  M10: { pay: "pillar", del: "thunder" },
  M11: { pay: "chain", del: "chainBolt" },
  M12: { pay: "shock", del: "ballLightning" },
  M13: { pay: "cut", del: "windBlades" },
  M14: { pay: "pull", del: "tornado" },
  M15: { pay: "knock", del: "gust" },
  M16: { pay: "knockup", del: "updraft" },
  M17: { pay: "rocks", del: "boulder" },
  M18: { pay: "spikes", del: "spikeLine" },
  M19: { pay: "stun", del: "quake" },
  M20: { pay: "root", del: "earthHand" },
  M21: { pay: "poison", del: "needles" },
  M22: { pay: "cloud", del: "toxicCloud" },
  M23: { pay: "armor", del: "rot" },
  M24: { pay: "cloud", del: "bog" },
  M25: { pay: "cross", del: "lightSpear" },
  M26: { pay: "heal", del: "healLight" },
  M27: { pay: "stun", del: "flashBang" },
  M28: { pay: "pillar", del: "judgment" },
  M29: { pay: "implode", del: "shadowOrb" },
  M30: { pay: "drain", del: "soulDrain" },
  M31: { pay: "curse", del: "curseMark" },
  M32: { pay: "implode", del: "blackHole" },
  B04: { pay: "cloud", del: "plague" },
  B05: { pay: "bigblast", del: "heartNova" },
};

// 착탄 시 모든 착탄 효과 실행
function payAll(K, x, y) {
  for (const [k, s] of K.pays) k === "__emit" ? K.emitEnd?.(x, y) : PAY[k]?.(K, x, y, s);
}
const aimAng = (K) => K.ang ?? (K.p.facing > 0 ? 0 : Math.PI);
const handX = (K) => K.p.cx + K.p.facing * 10;
const handY = (K) => K.p.cy - 4;
function castFx(K) {
  const c = palOf(K.el);
  flash(K.sc, handX(K), handY(K), 14, c[1], 180);
  puff(K.sc, "spark", K.el, handX(K), handY(K), 6);
}

// 전달 방식들. K.pays에 착탄 효과 목록, K.evo면 진화(강화)
export const DEL = {
  fireball(K) {
    castFx(K);
    const n = K.evo ? 3 : 1;
    for (let i = 0; i < n; i++)
      proj(K, { spr: "vp_flame", x: handX(K), y: handY(K), ang: aimAng(K) + (i - (n - 1) / 2) * 0.16, speed: 360, life: 1.4, r: 8, scale: 1.5 * K.size, glow: 1.6,
        onHit: (t) => K.hit(t, 1, { knock: 120 }), onEnd: (x, y) => payAll(K, x, y) });
    K.snd("magic");
  },
  flameRing(K) {
    const c = palOf(K.el);
    const n = K.evo ? 8 : 6, R0 = 38 * K.size;
    const orbs = [];
    for (let i = 0; i < n; i++) orbs.push(K.sc.add.image(K.p.cx, K.p.cy, "vx_glow").setTint(c[2]).setBlendMode(ADD).setDepth(28).setScale(0.35));
    const ringG = K.sc.add.graphics().setDepth(27).setBlendMode(ADD);
    K.ent({ dur: 4, upd: (e, dt) => {
      e.a = (e.a ?? 0) + dt * 4.5;
      ringG.clear().lineStyle(3, c[2], 0.5).strokeEllipse(K.p.cx, K.p.cy, R0 * 2, R0 * 1.6).lineStyle(1, c[1], 0.8).strokeEllipse(K.p.cx, K.p.cy, R0 * 2, R0 * 1.6);
      orbs.forEach((o, i) => {
        const a = e.a + (i / n) * Math.PI * 2, x = K.p.cx + Math.cos(a) * R0, y = K.p.cy + Math.sin(a) * R0 * 0.8;
        o.setPosition(x, y);
        trailEl(K.sc, K.el, x, y);
      });
      e.tk = (e.tk ?? 0) - dt;
      if (e.tk <= 0) {
        e.tk = 0.5;
        for (const t of K.tin(K.p.cx, K.p.cy, R0 + 10)) (K.hit(t, 0.8, { knock: 120 }), K.payAt(t));
      }
    }, end: () => (orbs.forEach((o) => o.destroy()), ringG.destroy()) });
    K.snd("buff");
  },
  breath(K) {
    const n = K.evo ? 28 : 20, dur = 1.6;
    let i = 0;
    const tick = () => {
      if (K.p.dead) return;
      for (let k = 0; k < 12; k++) {
        const d = rnd(6, 104 * K.size);
        trailEl(K.sc, K.el, handX(K) + K.p.facing * d, handY(K) + rnd(-d * 0.28, d * 0.28));
      }
      i % 3 === 0 && flash(K.sc, handX(K) + K.p.facing * 8, handY(K), 12, palOf(K.el)[1], 120);
      for (const t of K.trect(K.p.cx, K.p.cx + K.p.facing * 104 * K.size, K.p.body.y - 36, K.p.body.y + 8)) (K.hit(t, 0.25, { knock: 20, stagger: 0.05, noCrit: !0 }), i % 5 === 0 && K.payAt(t, 0.5));
      ++i < n && K.sc.time.delayedCall((dur * 1000) / n, tick);
    };
    tick();
    K.snd("magic");
  },
  meteor(K) {
    const sc = K.sc, c = palOf(K.el);
    const n = K.evo ? 3 : 1;
    const ts = K.near(K.p.cx + K.p.facing * 120, K.p.cy, 380, n);
    for (let i = 0; i < n; i++) {
      const t = ts[i];
      const tx = t ? t.body.x : K.p.cx + K.p.facing * (150 + i * 60);
      const ty = K.gy(tx, (t ? t.body.y : K.p.body.y) - 10);
      const warn = track(sc, sc.add.image(tx, ty, "vt_sigil").setTint(c[2]).setBlendMode(ADD).setDepth(9).setScale(1.6 * K.size, 0.4 * K.size).setAlpha(0.6));
      sc.tweens.add({ targets: warn, angle: 360, duration: 900 });
      const P = proj(K, { spr: "vp_ball", x: tx - 160, y: ty - 320, ang: Math.atan2(320, 160), speed: 560, life: 2, r: 4, scale: 3.4 * K.size, glow: 3, noTerrain: !0, pierce: 99 });
      P.onEnd = null;
      const chk = () => {
        if (P.dead) return;
        if (P.y >= ty - 8) {
          endProj(P);
          warn.destroy();
          payAll(K, tx, ty - 10);
          for (const u of K.tin(tx, ty - 10, 70 * K.size)) K.hit(u, 1.2, { knock: 300, knockUp: 160, heavy: !0 });
        } else sc.time.delayedCall(16, chk);
        puff(sc, "smoke", K.el, P.x, P.y, 1);
      };
      sc.time.delayedCall(i * 200, chk);
    }
    K.snd("magic");
  },
  iceSpear(K) {
    castFx(K);
    const n = K.evo ? 3 : 1;
    for (let i = 0; i < n; i++)
      K.sc.time.delayedCall(i * 90, () =>
        proj(K, { spr: "vp_spear", x: handX(K), y: handY(K), ang: aimAng(K), speed: 520, life: 1, r: 7, pierce: 99, scale: 1.4 * K.size, glow: 1.2,
          onHit: (t, x, y) => (K.hit(t, 1, { knock: 90, frStacks: 2 }), K.payAt(t, 0.6)), onEnd: (x, y) => impact(K.sc, K.el, x, y, 0.6) }),
      );
    K.snd("ice");
  },
  frostNova(K) {
    const sc = K.sc, c = palOf(K.el), R0 = (K.evo ? 110 : 84) * K.size;
    ring(sc, K.p.cx, K.p.cy, R0, c[1], 420);
    ring(sc, K.p.cx, K.p.cy, R0 * 0.7, c[2], 520);
    flash(sc, K.p.cx, K.p.cy, R0 * 0.6, c[1]);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2, x = K.p.cx + Math.cos(a) * R0 * 0.75;
      sc.time.delayedCall(60 + i * 18, () => (sc.fx.anim(parts(K.el)[0] === "ice" ? "icespike" : "rockspike", x, K.gy(x, K.p.body.y - 10) - 16, { tint: c[1], depth: 24 }), puff(sc, "shard", K.el, x, K.p.body.y - 8, 3)));
    }
    puff(sc, "mist", K.el, K.p.cx, K.p.cy, 24);
    for (const t of K.tin(K.p.cx, K.p.cy, R0)) (K.hit(t, 1.5, { knock: 220, frStacks: 3 }), K.payAt(t, 0.6));
    sc.fx.shake(3);
    K.snd("ice");
  },
  iceWall(K) {
    const sc = K.sc, c = palOf(K.el);
    const x = K.p.cx + K.p.facing * 36, gy = K.gy(x, K.p.body.y - 4);
    const w = track(sc, sc.add.image(x, gy + 60, "vt_icewall").setOrigin(0.5, 1).setTint(c[1]).setDepth(24).setScale(K.size), 7);
    const gl = track(sc, sc.add.image(x, gy - 30, "vx_glow").setTint(c[2]).setBlendMode(ADD).setDepth(23).setScale(1.6, 2.6).setAlpha(0.4), 7);
    sc.tweens.add({ targets: w, y: gy + 2, duration: 180, ease: "Back.easeOut" });
    puff(sc, "shard", K.el, x, gy, 12);
    for (const t of K.trect(x - 20, x + 20, gy - 60, gy + 4)) (K.hit(t, 0.8, { knock: 360, knockUp: 160 }), K.payAt(t));
    K.zone({ kind: "wall", x, y: gy, r: 16, t: 5 * (K.evo ? 1.6 : 1), el: K.el, dmg: K.B * 0.3, tick: 0.5, h: 58, onEnd: () => (puff(sc, "shard", K.el, x, gy - 30, 18), w.destroy(), gl.destroy()) });
    K.snd("ice");
  },
  frostOrb(K) {
    const sc = K.sc, c = palOf(K.el);
    const P = proj(K, { spr: "vp_orb", x: handX(K), y: handY(K), ang: aimAng(K), speed: 110, life: 3.2, r: 10, pierce: 99, scale: 1.6 * K.size, glow: 2.4, noTerrain: !0, onEnd: (x, y) => payAll(K, x, y) });
    let tk = 0;
    const tick = () => {
      if (P.dead) return;
      ring(sc, P.x, P.y, 44 * K.size, c[1], 300);
      puff(sc, "star", K.el, P.x, P.y, 4);
      for (const t of K.tin(P.x, P.y, 48 * K.size)) K.hit(t, 0.5, { knock: 20, noCrit: !0, frStacks: 1 });
      ++tk < 9 && sc.time.delayedCall(350, tick);
    };
    tick();
    K.snd("magic");
  },
  boltLine(K) {
    const sc = K.sc, c = palOf(K.el);
    const ang = aimAng(K);
    const n = K.evo ? 3 : 1;
    for (let k = 0; k < n; k++) {
      const a = ang + (k - (n - 1) / 2) * 0.12;
      let x1 = handX(K) + Math.cos(a) * 380, y1 = handY(K) + Math.sin(a) * 380;
      let hit = null;
      for (let d = 10; d < 380; d += 8) {
        const x = handX(K) + Math.cos(a) * d, y = handY(K) + Math.sin(a) * d;
        const t = K.tin(x, y, 8)[0];
        if (t) { hit = t; x1 = x; y1 = y; break; }
        if (sc.collider.solidAtPx(x, y)) { x1 = x; y1 = y; break; }
      }
      bolt(sc, handX(K), handY(K), x1, y1, c, 3, 220);
      flash(sc, x1, y1, 22, c[1]);
      puff(sc, "spark", K.el, x1, y1, 16);
      hit && (K.hit(hit, 1, { knock: 80, stagger: 0.3 }), payAll(K, x1, y1));
    }
    sc.cameras.main.flash(40, 255, 255, 200);
    K.snd("lightning");
  },
  thunder(K) {
    const sc = K.sc, c = palOf(K.el);
    const n = K.evo ? 5 : 3;
    const ts = K.near(K.p.cx, K.p.cy, 380, n);
    for (let i = 0; i < n; i++) {
      const t = ts[i];
      const x = t ? t.body.x : K.p.cx + K.p.facing * (70 + i * 50);
      const gy = K.gy(x, (t ? t.body.y : K.p.body.y) - 8);
      const cl = track(sc, sc.add.image(x, gy - 170, "vt_cloud").setTint(0x302848).setDepth(26).setAlpha(0).setScale(0.8));
      sc.tweens.add({ targets: cl, alpha: 0.9, scale: 1, duration: 200 });
      sc.time.delayedCall(260 + i * 110, () => {
        bolt(sc, x + rnd(-10, 10), gy - 165, x, gy, c, 5, 260);
        bolt(sc, x + rnd(-20, 20), gy - 165, x + rnd(-8, 8), gy, c, 2, 200);
        pillar(sc, x, gy, c, 8, 260, 170);
        puff(sc, "spark", K.el, x, gy - 10, 20);
        for (const u of K.tin(x, gy - 16, 30 * K.size)) (K.hit(u, 1, { stagger: 0.5, knock: 80 }), K.payAt(u, 0.6));
        sc.fx.shake(3);
        sc.tweens.add({ targets: cl, alpha: 0, duration: 400, onComplete: () => cl.destroy() });
        K.snd("lightning");
      });
    }
  },
  chainBolt(K) {
    const sc = K.sc, c = palOf(K.el);
    let x = handX(K), y = handY(K);
    const seen = new Set();
    const n = K.evo ? 8 : 5;
    let i = 0;
    const jump = () => {
      const t = K.near(x, y, i ? 150 : 220, 1, seen)[0];
      if (!t) return void (i === 0 && bolt(sc, x, y, x + K.p.facing * 80, y - 6, c, 3, 200));
      seen.add(t);
      const tx = t.body.x, ty = t.body.y - t.body.h / 2;
      bolt(sc, x, y, tx, ty, c, 3, 240);
      flash(sc, tx, ty, 18, c[1]);
      puff(sc, "spark", K.el, tx, ty, 10);
      K.hit(t, 1.2, { knock: 60, stagger: 0.3 });
      K.payAt(t, 0.5);
      ((x = tx), (y = ty));
      ++i < n && sc.time.delayedCall(60, jump);
    };
    jump();
    K.snd("lightning");
  },
  ballLightning(K) {
    const sc = K.sc, c = palOf(K.el);
    const t0 = K.near(K.p.cx + K.p.facing * 80, K.p.cy, 220, 1)[0];
    const x = t0 ? t0.body.x : K.p.cx + K.p.facing * 80, y = (t0 ? t0.body.y - t0.body.h : K.p.cy) - 30;
    const core = track(sc, sc.add.image(x, y, "vp_orb").setTint(c[2]).setDepth(28).setScale(1.8 * K.size), 7);
    const gl = track(sc, sc.add.image(x, y, "vx_glow").setTint(c[2]).setBlendMode(ADD).setDepth(27).setScale(2), 7);
    K.ent({ dur: K.evo ? 7 : 5, x, upd: (e, dt) => {
      const xx = e.x;
      core.setX(xx).setRotation(core.rotation + dt * 6);
      gl.setX(xx).setAlpha(0.5 + Math.random() * 0.3);
      puff(sc, "spark", K.el, xx + rnd(-8, 8), y + rnd(-8, 8), 1);
      e.tk = (e.tk ?? 0) - dt;
      if (e.tk <= 0) {
        e.tk = 0.45;
        for (const t of K.tin(xx, y, 80 * K.size).slice(0, 3)) {
          bolt(sc, xx, y, t.body.x, t.body.y - t.body.h / 2, c, 2, 160);
          K.hit(t, 0.4, { knock: 20, noCrit: !0 });
        }
      }
    }, end: (e) => (core.destroy(), gl.destroy(), payAll(K, e.x, y)) });
    K.snd("lightning");
  },
  windBlades(K) {
    castFx(K);
    const n = K.evo ? 4 : 2;
    for (let i = 0; i < n; i++)
      K.sc.time.delayedCall(i * 110, () =>
        proj(K, { spr: "vp_crescent", x: handX(K), y: handY(K) + (i % 2 ? 6 : -6), ang: aimAng(K), speed: 560, life: 0.8, r: 10, pierce: 3, scale: 1.3 * K.size, glow: 1.2, noTerrain: !0,
          onHit: (t, x, y) => (K.hit(t, 1.2, { knock: 160 }), K.payAt(t, 0.5)) }),
      );
    K.snd("dash");
  },
  tornado(K) {
    const sc = K.sc, c = palOf(K.el);
    const x0 = K.p.cx + K.p.facing * 24;
    const g = sc.add.graphics().setDepth(27).setBlendMode(ADD);
    const vx = K.p.facing * 110;
    K.ent({ dur: K.evo ? 3.6 : 2.6, x: x0, upd: (e, dt) => {
      e.x += vx * dt;
      e.t2 = (e.t2 ?? 0) + dt;
      const gy = K.gy(e.x, K.p.body.y - 20);
      g.clear();
      const H = 70 * K.size;
      for (let k = 0; k < 9; k++) {
        const u = k / 9, yy = gy - u * H, w = 6 + u * 22 * K.size, a = e.t2 * 14 + k;
        g.lineStyle(2, k % 2 ? c[1] : c[2], 0.65).strokeEllipse(e.x + Math.sin(a * 0.5) * 3, yy, w * 2, 6 + u * 4);
      }
      for (let k = 0; k < 3; k++) {
        const u = Math.random();
        trailEl(sc, K.el, e.x + rnd(-1, 1) * (6 + u * 20), gy - u * H);
      }
      for (const t of K.tin(e.x, gy - 30, 70)) t.kind !== "boss" && ((t.body.vx += Math.sign(e.x - t.body.x) * 900 * dt), Math.abs(t.body.x - e.x) < 18 && (t.body.vy = Math.min(t.body.vy, -120)));
      e.tk = (e.tk ?? 0) - dt;
      if (e.tk <= 0) {
        e.tk = 0.3;
        for (const t of K.tin(e.x, gy - 30, 40 * K.size)) (K.hit(t, 0.5, { knock: 20, noCrit: !0 }), Math.random() < 0.3 && K.payAt(t, 0.4));
      }
      e.gy = gy;
    }, end: (e) => (g.destroy(), payAll(K, e.x, (e.gy ?? K.p.body.y) - 20)) });
    K.snd("dash");
  },
  gust(K) {
    const sc = K.sc, c = palOf(K.el), d = K.p.facing, w = 130 * K.size;
    for (let i = 0; i < 26; i++) {
      const e = em(sc, "streak", K.el);
      const y = handY(K) + rnd(-26, 20);
      e.emitParticleAt(handX(K) + rnd(0, 20) * d, y, 1);
    }
    for (let i = 0; i < 12; i++) puff(sc, "leaf", K.el, handX(K) + d * rnd(10, w), handY(K) + rnd(-24, 16), 1);
    spiral(sc, handX(K) + d * 40, handY(K), 40, c[2]);
    for (const t of K.trect(K.p.cx, K.p.cx + d * w, K.p.body.y - 56, K.p.body.y + 8)) (K.hit(t, 1, { knock: 600, knockUp: 140, stagger: 0.5 }), K.payAt(t, 0.6));
    K.clearProj(K.p.cx, K.p.cx + d * w, K.p.body.y - 60, K.p.body.y + 10);
    K.snd("dash");
  },
  updraft(K) {
    const sc = K.sc, c = palOf(K.el);
    K.p.body.vy = K.evo ? -680 : -580;
    const gy = K.p.body.y;
    for (let i = 0; i < 20; i++) {
      const s = track(sc, sc.add.image(K.p.cx + rnd(-30, 30), gy - rnd(0, 20), "vx_streak").setTint(i % 2 ? c[1] : c[2]).setBlendMode(ADD).setDepth(29).setAngle(-90).setScale(1.4));
      sc.tweens.add({ targets: s, y: s.y - rnd(80, 160), alpha: 0, duration: rnd(300, 600), onComplete: () => s.destroy() });
    }
    spiral(sc, K.p.cx, gy - 10, 50, c[2]);
    for (const t of K.tin(K.p.cx, gy - 10, 56 * K.size)) (K.hit(t, 0.8, { knockUp: 400, knock: 20 }), K.payAt(t));
    K.snd("jump");
  },
  boulder(K) {
    castFx(K);
    const d = K.p.facing;
    const n = K.evo ? 2 : 1;
    for (let i = 0; i < n; i++)
      proj(K, { spr: "vp_boulder", x: handX(K), y: handY(K) - 4, ang: d > 0 ? -0.5 - i * 0.2 : Math.PI + 0.5 + i * 0.2, speed: 330, life: 2.4, r: 10, grav: 620, scale: 1.4 * K.size, glow: 0.6, spin: 9 * d, pierce: 2,
        onHit: (t) => K.hit(t, 1.2, { knock: 260, stagger: 0.6 }), onEnd: (x, y) => payAll(K, x, y) });
    K.snd("swingHeavy");
  },
  spikeLine(K) {
    const sc = K.sc, c = palOf(K.el), d = K.p.facing;
    const n = K.evo ? 9 : 6;
    const seen = new Set();
    for (let i = 0; i < n; i++)
      sc.time.delayedCall(i * 60, () => {
        const x = K.p.cx + d * (24 + i * 22);
        const gy = K.gy(x, K.p.body.y - 16);
        sc.fx.anim(parts(K.el)[0] === "ice" ? "icespike" : "rockspike", x, gy - 16, { scale: 1.3 * K.size, tint: c[1], depth: 24 });
        puff(sc, "rock", K.el, x, gy, 5);
        puff(sc, "smoke", K.el, x, gy, 2);
        for (const t of K.trect(x - 14, x + 14, gy - 46, gy + 4, seen)) (seen.add(t), K.hit(t, 0.7, { knockUp: 260, knock: 50 }), K.payAt(t, 0.5));
      });
    sc.fx.shake(3);
    K.snd("thud");
  },
  quake(K) {
    const sc = K.sc, c = palOf(K.el);
    sc.fx.shake(9, 500);
    sc.cameras.main.flash(90, 200, 160, 100);
    const g = track(sc, sc.add.graphics().setDepth(25));
    const gy = K.p.body.y;
    for (const dir of [-1, 1]) {
      let x = K.p.cx, y = gy;
      g.lineStyle(2, c[2], 1).beginPath().moveTo(x, y);
      for (let i = 0; i < 22; i++) ((x += dir * rnd(10, 18)), (y = gy + rnd(-3, 3)), g.lineTo(x, y));
      g.strokePath();
    }
    sc.tweens.add({ targets: g, alpha: 0, delay: 400, duration: 500, onComplete: () => g.destroy() });
    for (let i = 0; i < 16; i++) {
      const x = K.p.cx + rnd(-320, 320);
      sc.time.delayedCall(rnd(0, 300), () => (puff(sc, "rock", K.el, x, K.gy(x, gy - 30), 5), puff(sc, "smoke", K.el, x, K.gy(x, gy - 30), 3)));
    }
    for (const t of K.trect(K.p.cx - 330, K.p.cx + 330, gy - 150, gy + 120)) t.def?.flying || (K.hit(t, 1, { knockUp: 220, stagger: 0.7, frStacks: 2 }), K.payAt(t, 0.4));
    K.snd("explosion");
  },
  earthHand(K) {
    const t = K.near(K.p.cx, K.p.cy, 300, K.evo ? 3 : 1);
    if (!t.length) t.push(null);
    for (const u of t) {
      const x = u ? u.body.x : K.p.cx + K.p.facing * 80;
      PAY.root({ ...K, pays: [] }, x, u ? u.body.y - 10 : K.p.cy, 1.3);
      u && (K.hit(u, 1.5), K.payAt(u));
    }
    K.snd("thud");
  },
  needles(K) {
    castFx(K);
    const n = K.evo ? 5 : 3;
    for (let i = 0; i < n; i++)
      proj(K, { spr: "vp_needle", x: handX(K), y: handY(K), ang: aimAng(K) + (i - (n - 1) / 2) * 0.1, speed: 540, life: 0.9, r: 5, scale: 1.4 * K.size, glow: 0.6,
        onHit: (t, x, y) => (K.hit(t, 0.6, { knock: 40, frStacks: 1 }), puff(K.sc, "drop", K.el, x, y, 6), K.payAt(t, 0.4)) });
    K.snd("shoot");
  },
  toxicCloud(K) {
    const t = K.near(K.p.cx + K.p.facing * 90, K.p.cy, 260, 1)[0];
    const x = t ? t.body.x : K.p.cx + K.p.facing * 90, y = t ? t.body.y - t.body.h / 2 : K.p.cy;
    K.zone({ kind: "cloud", x, y, r: (K.evo ? 90 : 66) * K.size, t: 6, el: K.el, dmg: K.B * 0.18, tick: 0.5, pay: !0 });
    for (let i = 0; i < 4; i++) puff(K.sc, "mist", K.el, x + rnd(-30, 30), y + rnd(-20, 20), 8);
    K.snd("magic");
  },
  rot(K) {
    const ts = K.near(K.p.cx, K.p.cy, 300, K.evo ? 3 : 1);
    for (const t of ts) {
      PAY.armor({ ...K, pays: [] }, t.body.x, t.body.y - t.body.h / 2, 1);
      K.hit(t, 1);
      K.payAt(t);
      puff(K.sc, "bubble", K.el, t.body.x, t.body.y - t.body.h / 2, 10);
    }
    K.snd("magic");
  },
  bog(K) {
    const x = K.p.cx + K.p.facing * 50, y = K.gy(x, K.p.body.y - 4);
    K.zone({ kind: "pool", x, y, r: (K.evo ? 110 : 84) * K.size, t: 8, el: K.el, dmg: K.B * 0.12, tick: 0.5, slow: 1, bubbles: 1, pay: !0 });
    puff(K.sc, "drop", K.el, x, y - 6, 18);
    K.snd("magic");
  },
  plague(K) {
    DEL.bog(K);
    DEL.toxicCloud(K);
  },
  lightSpear(K) {
    castFx(K);
    const n = K.evo ? 3 : 1;
    for (let i = 0; i < n; i++)
      proj(K, { spr: "vp_spear", x: handX(K), y: handY(K), ang: aimAng(K) + (i - (n - 1) / 2) * 0.1, speed: 560, life: 1, r: 8, pierce: 99, scale: 1.6 * K.size, glow: 1.6,
        onHit: (t, x, y) => (K.hit(t, 1.1, { knock: 140 }), PAY.cross({ ...K, pays: [] }, x, y, 0.5), K.payAt(t, 0.5)) });
    K.snd("magic");
  },
  healLight(K) {
    const sc = K.sc, c = palOf(K.el ?? "light");
    K.p.heal(K.p.maxHp * (K.evo ? 0.32 : 0.2));
    K.p.statuses.clear("poison");
    K.p.statuses.clear("burn");
    pillar(sc, K.p.cx, K.p.body.y, c, 20, 600);
    ring(sc, K.p.cx, K.p.body.y - 4, 70, c[1], 500);
    for (let i = 0; i < 14; i++) {
      const s = track(sc, sc.add.image(K.p.cx + rnd(-20, 20), K.p.body.y - rnd(0, 10), "vx_star").setTint(c[1]).setBlendMode(ADD).setDepth(30));
      sc.tweens.add({ targets: s, y: s.y - rnd(40, 90), alpha: 0, angle: 90, duration: rnd(500, 900), onComplete: () => s.destroy() });
    }
    for (const t of K.tin(K.p.cx, K.p.cy, 130)) (K.applyEl(t, "light"), K.payAt(t, 0.5));
    K.snd("heal");
  },
  flashBang(K) {
    const sc = K.sc, c = palOf(K.el ?? "light");
    sc.cameras.main.flash(300, 255, 255, 240);
    rays(sc, K.p.cx, K.p.cy, 200, c[1], 16);
    flash(sc, K.p.cx, K.p.cy, 120, c[1], 400);
    const cam = sc.cameras.main;
    for (const t of K.trect(cam.scrollX, cam.scrollX + 640, -9999, 9999)) (t.statuses.apply({ type: "stun", chance: 1, dur: K.evo ? 2.2 : 1.5 }, 0), K.hit(t, 0.5, { knock: 0 }), K.payAt(t, 0.4));
    K.snd("levelup");
  },
  judgment(K) {
    const sc = K.sc, c = palOf(K.el);
    const n = K.evo ? 6 : 4;
    const ts = K.near(K.p.cx, K.p.cy, 360, n);
    for (let i = 0; i < n; i++) {
      const t = ts[i];
      const x = t ? t.body.x : K.p.cx + K.p.facing * (50 + i * 40);
      const gy = K.gy(x, (t ? t.body.y : K.p.body.y) - 8);
      const warn = track(sc, sc.add.image(x, gy, "vt_sigil").setTint(c[1]).setBlendMode(ADD).setDepth(9).setScale(0.9, 0.25).setAlpha(0.8));
      sc.tweens.add({ targets: warn, angle: 180, duration: 400 + i * 120 });
      sc.time.delayedCall(360 + i * 120, () => {
        warn.destroy();
        pillar(sc, x, gy, c, 14 * K.size, 480);
        rays(sc, x, gy - 10, 40, c[0], 8);
        puff(sc, "star", K.el, x, gy - 20, 12);
        for (const u of K.trect(x - 18 * K.size, x + 18 * K.size, gy - 220, gy + 4)) (K.hit(u, 1.5, { stagger: 0.5, knock: 60 }), K.payAt(u, 0.5));
        sc.fx.shake(3);
        K.snd("lightning", 0.8);
      });
    }
  },
  shadowOrb(K) {
    castFx(K);
    const n = K.evo ? 3 : 1;
    for (let i = 0; i < n; i++)
      proj(K, { spr: "vp_orb", x: handX(K), y: handY(K), ang: aimAng(K) + (i - (n - 1) / 2) * 0.5, speed: 220, life: 2.6, r: 9, homing: 3, scale: 1.4 * K.size, glow: 1.8, noTerrain: !0, spin: 6,
        onHit: (t) => K.hit(t, 1.2, { knock: 60 }), onEnd: (x, y) => payAll(K, x, y) });
    K.snd("magic");
  },
  soulDrain(K) {
    const ts = K.near(K.p.cx, K.p.cy, 260, K.evo ? 3 : 1);
    for (const t of ts) {
      tether(K, t, 420);
      const d = K.hit(t, 1.5, { stagger: 0.4 });
      K.p.heal(d * 0.3);
      K.payAt(t);
    }
    K.snd("magic");
  },
  curseMark(K) {
    const ts = K.near(K.p.cx, K.p.cy, 320, K.evo ? 3 : 1);
    for (const t of ts) {
      PAY.curse({ ...K, pays: [] }, t.body.x, t.body.y - t.body.h / 2, K.evo ? 1.6 : 1.35);
      K.payAt(t);
    }
    K.snd("magic");
  },
  blackHole(K) {
    const sc = K.sc, c = palOf(K.el);
    const t0 = K.near(K.p.cx + K.p.facing * 110, K.p.cy, 260, 1)[0];
    const x = t0 ? t0.body.x : K.p.cx + K.p.facing * 110, y = t0 ? t0.body.y - t0.body.h / 2 : K.p.cy - 10;
    const core = track(sc, sc.add.circle(x, y, 9 * K.size, 0x000000).setDepth(29), 6);
    const halo = track(sc, sc.add.image(x, y, "vx_ring").setTint(c[2]).setBlendMode(ADD).setDepth(28).setScale(0.6 * K.size), 6);
    const R0 = 100 * K.size;
    K.ent({ dur: K.evo ? 4 : 3, upd: (e, dt) => {
      halo.setRotation(halo.rotation + dt * 4).setScale((0.6 + Math.sin(sc.time.now / 90) * 0.06) * K.size);
      for (let k = 0; k < 3; k++) {
        const a = rnd(0, 6.28), r = rnd(40, R0);
        const s = sc.add.image(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.7, "vx_soft").setTint(k % 2 ? c[1] : c[2]).setBlendMode(ADD).setDepth(28).setScale(0.6);
        sc.tweens.add({ targets: s, x, y, scale: 0.1, duration: 380, ease: "Quad.easeIn", onComplete: () => s.destroy() });
      }
      for (const t of K.tin(x, y, R0)) t.kind !== "boss" && (t.body.vx += Math.sign(x - t.body.x) * 1000 * dt);
      e.tk = (e.tk ?? 0) - dt;
      if (e.tk <= 0) {
        e.tk = 0.5;
        for (const t of K.tin(x, y, 40 * K.size)) K.hit(t, 0.6, { knock: 0, noCrit: !0 });
      }
    }, end: () => (core.destroy(), halo.destroy(), payAll(K, x, y)) });
    K.snd("magic");
  },
  heartNova(K) {
    const c = Math.round(K.p.maxHp * 0.15);
    K.p.hp = Math.max(1, K.p.hp - c);
    K.sc.fx.number(K.p.cx, K.p.body.y - 30, `-${c}`, "#ff5a4a");
    payAll(K, K.p.cx, K.p.cy);
    for (const t of K.tin(K.p.cx, K.p.cy, 120)) K.hit(t, 4, { knock: 400, heavy: !0 });
    K.snd("explosion");
  },
};

// ── 마법 시전 진입점 ────────────────────────────────
// ids: 섞인 마법 id 목록 (첫째가 전달 방식). 같은 id 두 개면 진화.
export function castMagic(K, ids) {
  const first = ids[0];
  const D = MAGIC[first];
  if (!D) return;
  K.evo = ids.length > 1 && ids.every((x) => x === first);
  const uniq = [...new Set(ids)];
  const s = uniq.length > 1 ? 0.85 : K.evo ? 1.35 : 1;
  K.pays = uniq.map((id) => [MAGIC[id].pay, id === first ? s : 0.9]);
  // 착탄 효과를 맞은 적 위치에 실행 (스로틀)
  const extra = uniq.slice(1).map((id) => MAGIC[id].pay);
  let budget = 6;
  K.payAt = (t, m = 1) => {
    if (!extra.length || budget <= 0 || !t || t.dead) return;
    budget--;
    for (const k of extra) PAY[k]?.({ ...K, pays: [] }, t.body.x, t.body.y - t.body.h / 2, 0.6 * m);
  };
  const S = K.spec;
  if (S && S.emit && S.emit !== first) {
    // 설명대로: 언제, 어떤 모양으로 재료 마법이 섞이는지
    const em = S.emit;
    K.pays = [[D.pay, s]];
    const fire = (x, y, m = 1) => budget-- > 0 && emitFx(K, em, x, y, aimAng(K), S.pat, S.n, S.m, m);
    if (S.when === "end" || S.when === "kill") K.pays.push(["__emit", 1]);
    K.payAt = S.when === "hit" || S.when === "tick" || S.when === "during" ? (t, m = 1) => t && !t.dead && fire(t.body.x, t.body.y - t.body.h / 2, 0.8 * m) : () => {};
    K.emitEnd = (x, y) => fire(x, y, 1);
    if (S.when === "start") fire(handX(K), handY(K), 1);
    S.when === "during" && S.pat === "forward" && (S.pat = "target");
    if (S.when === "during" || S.when === "tick")
      for (let i = 1; i <= (S.n ? 1 : 5); i++)
        K.sc.time.delayedCall(i * 420, () => {
          const f = K.focus?.();
          f && !K.p.dead && fire(f.x, f.y, 0.7);
        });
  }
  DEL[D.del](K);
}
// 스킬·무기에 마법 착탄을 싣는 용도
export function payloadOf(magicId) {
  return MAGIC[magicId]?.pay ?? null;
}

// ── 설명 해석 결과로 마법 형태를 뿜기 ───────────────
function orbitEmit(K, mid, n, dur) {
  const P = EPROJ[mid];
  const c = palOf(K.el);
  const orbs = [];
  for (let i = 0; i < n; i++) orbs.push(K.sc.add.image(K.p.cx, K.p.cy, P?.spr && !P.bolt ? P.spr : "vp_orb").setTint(c[2]).setDepth(28).setScale(1.1));
  const glows = orbs.map(() => K.sc.add.image(K.p.cx, K.p.cy, "vx_glow").setTint(c[2]).setBlendMode(ADD).setDepth(27).setAlpha(0.35).setScale(0.6));
  const cd = new Map();
  K.ent({ dur, upd: (e, dt) => {
    e.a = (e.a ?? 0) + dt * 5;
    orbs.forEach((o, i) => {
      const a = e.a + (i / n) * Math.PI * 2, x = K.p.cx + Math.cos(a) * 40, y = K.p.cy + Math.sin(a) * 32;
      o.setPosition(x, y).setRotation(a + Math.PI / 2);
      glows[i].setPosition(x, y);
      trailEl(K.sc, K.el, x, y);
      for (const t of K.tin(x, y, 11)) {
        if ((cd.get(t) ?? 0) > 0) continue;
        cd.set(t, 0.4);
        K.hit(t, 0.45, { knock: 90 });
      }
    });
    for (const [k, v] of cd) cd.set(k, v - dt);
  }, end: () => (orbs.forEach((o) => o.destroy()), glows.forEach((o) => o.destroy())) });
}
export function emitFx(K, mid, x, y, ang, pat, n, m = {}, scale = 1) {
  if (!mid || !MAGIC[mid]) return;
  const sc = K.sc;
  const c = palOf(K.el);
  if (pat === "orbit") return orbitEmit(K, mid, n ?? 3, 3);
  const P = EPROJ[mid];
  if (P) {
    const N = n ?? (pat === "radial" ? 6 : pat === "fan" || pat === "down" ? 3 : 1);
    for (let i = 0; i < N; i++) {
      let a = ang, sx = x, sy = y, life = m.long ? 1.4 : 0.9;
      const homing = P.homing || m.homing || pat === "homing" ? 3 : 0;
      if (pat === "target") {
        const t = K.near(x, y, 160, N)[i % Math.max(1, K.near(x, y, 160, N).length)];
        t && (a = Math.atan2(t.body.y - t.body.h / 2 - y, t.body.x - x));
      } else if (pat === "radial") a = (i / N) * Math.PI * 2 + ang;
      else if (pat === "fan") a = ang + (i - (N - 1) / 2) * 0.24;
      else if (pat === "down") ((a = Math.PI / 2 + (i - (N - 1) / 2) * 0.3), (sy = y - 40));
      else if (pat === "up") {
        sx = x + (i - (N - 1) / 2) * 18;
        sy = K.gy(sx, y) + 6;
        a = -Math.PI / 2;
        life = 0.35;
        sc.fx.anim(parts(K.el)[0] === "ice" ? "icespike" : "rockspike", sx, sy - 22, { tint: c[1], depth: 24 });
      }
      if (P.bolt) {
        const t = P.chain ? K.near(sx, sy, 200, 1)[0] : null;
        let x1 = sx + Math.cos(a) * 200, y1 = sy + Math.sin(a) * 200, hit = t;
        if (!hit) {
          for (let d = 10; d < 200; d += 8) {
            const u = K.tin(sx + Math.cos(a) * d, sy + Math.sin(a) * d, 8)[0];
            if (u) {
              hit = u;
              x1 = u.body.x;
              y1 = u.body.y - u.body.h / 2;
              break;
            }
          }
        } else ((x1 = t.body.x), (y1 = t.body.y - t.body.h / 2));
        bolt(sc, sx, sy, x1, y1, c, 2, 200);
        puff(sc, "spark", K.el, x1, y1, 8);
        hit && (K.hit(hit, 0.5 * scale, { knock: 60, stagger: 0.25 }), P.chain && PAY.shock(K, x1, y1, 0.6));
        continue;
      }
      const go = () =>
        proj(K, {
          spr: P.spr, x: sx, y: sy, ang: a, speed: P.speed, life, r: 7, pierce: P.pierce || m.pierce ? 99 : 0, homing, grav: P.grav ?? 0, scale: 1.15, glow: 1,
          noTerrain: pat === "up",
          onHit: (t, xx, yy) => {
            K.hit(t, 0.5 * scale, { knock: 80, frStacks: P.ice ? 2 : 0 });
            P.poison && t.statuses.apply({ type: "poison", chance: 1, dur: 4, power: 0.25 }, K.B);
            m.freeze && (t._frIce = (t._frIce ?? 0) + 3);
            puff(sc, "spark", K.el, xx, yy, 5);
          },
          onEnd: P.boom ? (xx, yy) => PAY.blast(K, xx, yy, 0.55 * scale) : (xx, yy) => impact(sc, K.el, xx, yy, 0.4),
        });
      pat === "forward" && i > 0 ? sc.time.delayedCall(i * 90, go) : go();
    }
    return;
  }
  const key = MAGIC[mid].pay;
  if (pat === "leave" && (mid === "M12" || mid === "M22" || mid === "M24" || mid === "M02")) {
    if (mid === "M12") ballAt(K, x, y);
    else K.zone({ kind: mid === "M24" ? "pool" : "cloud", x, y: mid === "M24" ? K.gy(x, y) : y, r: 60, t: 4, el: K.el, dmg: K.B * 0.18, tick: 0.45, slow: mid === "M24" });
    return;
  }
  if (pat === "radial" && (n ?? 1) > 1) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      PAY[key]?.(K, x + Math.cos(a) * 44, y + Math.sin(a) * 30, 0.55 * scale);
    }
    return;
  }
  PAY[key]?.(K, x, y, 0.8 * scale);
}
function ballAt(K, x, y) {
  const sc = K.sc, c = palOf(K.el);
  const core = track(sc, sc.add.image(x, y - 20, "vp_orb").setTint(c[2]).setDepth(28).setScale(1.6), 6);
  K.ent({ dur: 4, upd: (e, dt) => {
    core.setRotation(core.rotation + dt * 6);
    puff(sc, "spark", K.el, x + rnd(-8, 8), y - 20 + rnd(-8, 8), 1);
    e.tk = (e.tk ?? 0) - dt;
    if (e.tk <= 0) {
      e.tk = 0.45;
      for (const t of K.tin(x, y - 20, 80).slice(0, 3)) (bolt(sc, x, y - 20, t.body.x, t.body.y - t.body.h / 2, c, 2, 160), K.hit(t, 0.35, { knock: 20, noCrit: !0 }));
    }
  }, end: () => core.destroy() });
}

// ── 베기 궤적 ───────────────────────────────────────
export function slash(sc, x, y, r, a0, a1, el, w = 7, dur = 200) {
  const c = el ? palOf(el) : [0xffffff, 0xf4f0ff, 0xc8c8f0, 0x5a5878];
  const g = track(sc, sc.add.graphics().setDepth(30).setBlendMode(ADD).setPosition(x, y));
  const n = 22;
  const W = w * 1.6;
  const band = (rr, ww, col, alpha, taper = 1) => {
    for (let i = 0; i < n; i++) {
      const u0 = i / n, u1 = (i + 1) / n;
      const t0 = a0 + (a1 - a0) * u0, t1 = a0 + (a1 - a0) * u1;
      const k = Math.pow(Math.sin(u1 * Math.PI * 0.92 + 0.08), taper);
      const w0 = ww * Math.pow(Math.sin(u0 * Math.PI * 0.92 + 0.08), taper), w1 = ww * k;
      g.fillStyle(col, alpha * (0.25 + u1 * 0.75));
      g.fillPoints([
        { x: Math.cos(t0) * rr, y: Math.sin(t0) * rr },
        { x: Math.cos(t1) * rr, y: Math.sin(t1) * rr },
        { x: Math.cos(t1) * (rr - w1), y: Math.sin(t1) * (rr - w1) },
        { x: Math.cos(t0) * (rr - w0), y: Math.sin(t0) * (rr - w0) },
      ], !0);
    }
  };
  band(r + W * 0.35, W * 1.9, c[3], 0.28, 0.7); // 바깥 번짐
  band(r, W, c[2], 0.85); // 본체
  band(r - W * 0.12, W * 0.55, c[1], 0.95, 1.3); // 밝은 심
  g.lineStyle(2, c[0], 1).beginPath();
  for (let i = 0; i <= n; i++) {
    const t = a0 + ((a1 - a0) * i) / n;
    i ? g.lineTo(Math.cos(t) * r, Math.sin(t) * r) : g.moveTo(Math.cos(t) * r, Math.sin(t) * r);
  }
  g.strokePath();
  sc.tweens.add({ targets: g, alpha: 0, scaleX: 1.08, scaleY: 1.08, duration: dur * 1.25, ease: "Quad.easeIn", onComplete: () => g.destroy() });
  // 궤적 끝으로 튀는 불티
  const e = em(sc, "streak", el);
  for (let i = 0; i < 6; i++) {
    const t = a0 + (a1 - a0) * (0.4 + i * 0.1);
    e.emitParticleAt(x + Math.cos(t) * r, y + Math.sin(t) * r, 1);
  }
  const ex = x + Math.cos(a1) * r, ey = y + Math.sin(a1) * r;
  puff(sc, "spark", el, ex, ey, 6);
  el && trailEl(sc, el, ex, ey);
}
export function trail(sc, el, x, y) {
  trailEl(sc, el, x, y);
}
