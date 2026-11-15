// 융합 마법 주문서 1 — 화염구·불꽃 고리·화염 방사·유성·얼음 창 계열
const PI = Math.PI;
const tgt = (A, t) => (t ? [t.body.x, t.body.y - t.body.h / 2] : [A.px + A.d * 100, A.py]);
const stuckBoom = (A, t, ms, fn) => {
  const s = A.img("glow", ...A.tp(t), { add: 1, scale: 0.7, el: "fire", alpha: 0.85 });
  A.K.ent({ dur: ms / 1000, upd: () => t.dead || s.setPosition(t.body.x, t.body.y - t.body.h / 2), end: () => { const x = s.x, y = s.y; s.destroy(); fn(x, y); } });
};
const shatter = (A, t, x, y, m = 2.5) => {
  if (!t.statuses.has("freeze")) return !1;
  t.statuses.clear("freeze");
  A.hit(t, m, { kb: 160 });
  A.sc.fx.anim("iceburst", x, y, { scale: 1.5 });
  A.text(x, y - 18, "파쇄!", "#c0f0ff");
  A.puff("shard", x, y, 18, "ice");
  return !0;
};

export const BOOK1 = {
  // ── 화염구 ──
  "M01+M01": (A) => A.shot({ spr: "flame", scale: 4.2, r: 16, speed: 300, m: 1.2, glow: 4, end: (x, y) => (A.boom(x, y, 96, 2.4, { cam: 1 }), A.pool(x, 90, 2, { y, m: 0.3, st: { burn: 1 } })) }),
  "M01+M02": (A) => {
    const P = A.shot({ spr: "flame", scale: 1.8, m: 1, end: (x, y) => (A.boom(x, y, 52, 1.3), A.aura({ at: 1, x, y, R: 46, dur: 4, m: 0.5, st: { burn: 1 } })) });
    A.orbit(5, { spr: "ball", el: "fire", scale: 0.6, R: 16, spd: 9, m: 0.3, dur: 2, center: (e) => (P.dead && (e.t = 0), { x: P.x, y: P.y }) });
  },
  "M01+M03": (A) => A.shot({ spr: "flame", scale: 2.4, speed: 300, life: 1.5, m: 1.2, pierce: 3, tick: (P) => (A.puff("flame", P.x - P.vx * 0.03, P.y, 4), A.puff("ember", P.x, P.y, 1, "fire")), drip: [0.12, (x, y) => A.pool(x, 24, 3, { y, m: 0.15, st: { burn: 1 } })], end: (x, y) => A.boom(x, y, 50, 1.2) }),
  "M01+M04": (A) =>
    A.shot({ spr: "flame", ang: -PI / 2 + A.d * 0.2, speed: 460, life: 0.42, scale: 2, noTerrain: 1, m: 0, end: (x, y) => {
      A.flash(x, y, 40); A.ring(x, y, 50); A.snd("explosion", 0.6);
      A.TX(3, 400, 70).forEach(({ x: tx, y: ty }, i) => A.drop(tx, { y: ty, delay: 200 + i * 160, scale: 2.4, r: 60, m: 1.6, trailFx: "flame", trailEl: "fire" }));
    } }),
  "M01+M05": (A) =>
    A.shot({ spr: "spear", el: "ice", speed: 540, scale: 1.6, m: 1, st: { chill: 2 }, tick: (P) => A.puff("flame", P.x, P.y, 1, "fire"),
      hit: (t) => stuckBoom(A, t, 600, (x, y) => (A.boom(x, y, 64, 2, { st: { burn: 1, chill: 2 } }), A.puff("mist", x, y, 24, "steam"), A.cloud(x, y, 40, 1.5, { m: 0.1 }))) }),
  "M01+M06": (A) => A.shot({ spr: "flame", scale: 2, m: 0.6, end: (x, y) => (A.boom(x, y, 80, 4, { cam: 1 }), A.nova(x, y, 80, 0, { snd: 0, el: "ice" }), A.cloud(x, y, 70, 3, { m: 0.15, st: { chill: 1 } })) }),
  "M01+M07": (A) => {
    const wx = A.px + A.d * 44;
    const W = A.wall(wx, { dur: 3, m: 0.4 });
    A.shot({ spr: "flame", scale: 1.8, speed: 280, delay: 250, m: 1, tick: (P) => (P.x - W.x) * A.d >= 0 && !W.broken && A.end(P), end: () => {
      W.z && (W.z.t = 0);
      A.boom(W.x, W.gy - 30, 60, 1.8, { st: { chill: 2 } });
      A.mover({ x: W.x, y: W.gy - 24, vx: 380, dur: 0.55, r: 40, m: 1.2, fx: "mist", fxEl: "steam", dens: 8, kb: 300, st: { burn: 1, chill: 1 } });
      A.cam(80, 240, 240, 255);
    } });
  },
  "M01+M08": (A) => A.shot({ spr: "orb", speed: 130, life: 3, scale: 2, pierce: 99, noTerrain: 1, m: 0.5, glow: 2.6, tick: (P) => (A.puff("flame", P.x, P.y, 1, "fire"), A.puff("mist", P.x, P.y, 1, "ice")), drip: [0.3, (x, y) => A.cloud(x, y, 34, 3, { m: 0.12, st: { chill: 1, burn: 1 } })], end: (x, y) => A.boom(x, y, 60, 1.4) }),
  "M01+M09": (A) => A.shot({ spr: "flame", speed: 900, scale: 1.6, m: 1, tick: (P) => A.puff("spark", P.x, P.y, 2, "lightning"), end: (x, y, P) => (A.boom(x, y, 50, 1.4), A.beam(x, y, Math.atan2(P.vy, P.vx), 420, { m: 1.4, w: 8 })) }),
  "M01+M10": (A) =>
    A.TX(3, 380, 50).forEach(({ x, y }, i) =>
      A.strike(x, { y, delay: 220 + i * 110, m: 1, then: (sx, gy, hs) => hs.forEach((u) => (A.text(u.body.x, u.body.y - u.body.h - 14, "낙인", "#ffb060"), stuckBoom(A, u, 1000, (bx, by) => A.boom(bx, by, 52, 1.6, { el: "fire" })))) })),
  "M01+M11": (A) => A.shot({ spr: "flame", scale: 1.7, m: 1, end: (x, y) => (A.boom(x, y, 46, 1.1), A.chain(x, y, 5, { m: 0.4, gap: 140, r: 200, each: (t, tx, ty) => A.boom(tx, ty, 40, 1) })) }),
  "M01+M12": (A) => {
    const a = A.aim(90);
    A.turret(a.x, A.py - 56, { spr: "sun", el: "plasma", scale: 1.2, dur: 5, every: 0.45, spin: 2, fn: (x, y) => {
      const t = A.T(1, 240, x, y)[0];
      t && A.shot({ spr: "flame", x, y, ang: Math.atan2(t.body.y - t.body.h / 2 - y, t.body.x - x), speed: 380, scale: 1, m: 0.55, end: (ex, ey) => A.boom(ex, ey, 28, 0.4, { snd: "hit" }) });
      A.bolt(x, y, x + Math.random() * 30 - 15, y + Math.random() * 30 - 15, "lightning", 1, 120);
    } });
  },
  "M01+M13": (A) => A.fan(2, 0, { spr: "blade", el: "heatwave", seq: 110, speed: 560, pierce: 3, life: 0.8, scale: 1.5, noTerrain: 1, m: 1.1, st: { burn: 1.2 }, hit: (t, x, y) => (A.ring(x, y, 70, "fire"), A.area(x, y, 70, 0.2, { kb: 0, st: { burn: 1 } })) }),
  "M01+M14": (A) => A.shot({ spr: "flame", scale: 1.8, m: 1, end: (x) => (A.boom(x, A.py, 40, 0.8), A.tornado(x, { vx: 0, dur: 3, scale: 1.2, force: 1300, m: 0.4, fx: "flame", fxEl: "fire", st: { burn: 1 } })) }),
  "M01+M15": (A) => {
    A.gust({ m: 0.3, w: 60, kb: 300 });
    A.shot({ spr: "flame", speed: 1080, scale: 1.8, m: 1.4, kb: 900, up: 200, tick: (P) => A.puff("streak", P.x, P.y, 2, "wind"),
      hit: (t) => A.K.ent({ dur: 1, tk: 0, upd: (e, dt) => { if (t.dead) return; A.puff("flame", t.body.x, t.body.y - t.body.h / 2, 2, "fire"); (e.tk -= dt) <= 0 && ((e.tk = 0.2), A.area(t.body.x, t.body.y - 10, 40, 0.15, { kb: 0, st: { burn: 1 } })); } }),
      end: (x, y) => A.boom(x, y, 46, 1) });
  },
  "M01+M16": (A) => {
    A.updraft({ vy: -680, fx: "flame", fxEl: "fire", m: 1, st: { burn: 1.5 }, each: (t) => A.later(300, () => t.dead || (A.ring(t.body.x, t.body.y - 10, 60, "fire"), A.area(t.body.x, t.body.y - 10, 60, 0.2, { kb: 0, st: { burn: 1 } }))) });
    A.pillar(A.px, { delay: 0, warn: 0, w: 16, m: 0.6, el: "fire", h: 200, snd: "explosion", fx: "flame" });
  },
  "M01+M17": (A) => A.roll({ spr: "rock", el: "lava", scale: 1.8, vx: 200, dur: 2.8, m: 0.9, fx: "flame", fxEl: "fire", st: { burn: 1 }, drip: [0.15, (x) => A.pool(x, 22, 3, { m: 0.15, st: { burn: 1 } })], end: (x, gy) => A.boom(x, gy - 10, 50, 1.2) }),
  "M01+M18": (A) => A.shot({ spr: "flame", scale: 1.8, m: 1, end: (x, y) => (A.boom(x, y, 44, 1), A.spikes(x - A.d * 44, A.d, 5, { gap: 22, step: 110, el: "lava", m: 0.8, st: { burn: 1 }, y, each: (sx, gy) => (A.puff("flame", sx, gy - 16, 10, "fire"), A.puff("ember", sx, gy - 10, 6, "fire")) })) }),
  "M01+M19": (A) =>
    A.shot({ spr: "flame", scale: 2, ang: A.d > 0 ? -0.35 : PI + 0.35, speed: 380, grav: 600, m: 1, end: (x, y) => {
      const gy = A.gy(x, y);
      A.boom(x, gy - 8, 50, 1.2);
      A.crack(x, gy, 140, "lava");
      A.shake(5, 600);
      [-3, -1.5, 0, 1.5, 3].forEach((k, i) => A.pillar(x + k * 28, { gy, delay: 200 + i * 120, w: 9, h: 110, m: 0.9, el: "lava", st: { burn: 1 }, fx: "flame", snd: "explosion", warn: 0 }));
    } }),
  "M01+M20": (A) => A.TX(2, 300, 60).forEach(({ t, x }) => A.hand(x, { t, scale: 1.3, tint: 0xff6a20, fx: "flame", m: 1.2, st: { burn: 2 }, grab: 2, then: (hx, gy) => (A.pool(hx, 30, 2, { m: 0.2, st: { burn: 1 } }), A.rep(4, 400, () => A.puff("flame", hx, gy - 20, 12, "fire"))) })),
  "M01+M21": (A) => A.fan(3, 0.1, { spr: "needle", el: "poison", speed: 540, life: 0.9, scale: 1.4, m: 0.6, st: { poison: 2 }, tick: (P) => A.puff("ember", P.x, P.y, 1, "fire"), hit: (t, x, y) => A.boom(x, y, 34, 0.7, { el: "sulfur", st: { burn: 1, poison: 1 } }) }),
  "M01+M22": (A) => A.shot({ spr: "ball", scale: 2, ang: A.d > 0 ? -0.4 : PI + 0.4, speed: 340, grav: 520, m: 0.6, spin: 8, tick: (P) => A.puff("smoke", P.x, P.y, 1, "poison"), end: (x, y) => (A.boom(x, y, 70, 2.2, { st: { burn: 1, poison: 2 } }), A.cloud(x, y - 10, 70, 5, { m: 0.18, st: { poison: 1 } })) }),
  "M01+M23": (A) => {
    const t = A.T(1, 320)[0];
    t && (A.st(t, { rot: 0.3 }), A.puff("bubble", ...A.tp(t), 12, "poison"));
    A.later(200, () => A.shot({ spr: "flame", scale: 1.8, homing: 6, speed: 340, life: 2, m: 1.2, end: (x, y) => (A.boom(x, y, 56, 1.5, { st: { burn: 1 } }), A.cloud(x, y, 70, 4, { m: 0.15, st: { poison: 1.5 }, fx: "smoke", fxEl: "poison" })) }));
  },
  "M01+M24": (A) => {
    const x = A.px + A.d * 60;
    A.pool(x, 84, 8, { m: 0.2, slow: 1, st: { poison: 1, burn: 1 }, fx: "flame", fxEl: "fire", frame: (z, dt) => Math.random() < dt * 10 && A.puff("smoke", z.x + (Math.random() - 0.5) * z.r * 1.6, z.y - 6, 1, "sulfur") });
    A.later(300, () => A.boom(x, A.gy(x) - 8, 60, 0.8, { el: "fire" }));
  },
  "M01+M25": (A) =>
    A.turret(A.px, A.py - 44, { spr: "sun", follow: 1, oy: -42, scale: 1.3, gs: 2.4, dur: 10, every: 0.7, spin: 1.5, fn: (x, y) => {
      const t = A.T(1, 200, x, y)[0];
      if (!t) return;
      const [tx, ty] = A.tp(t);
      A.beam(x, y, Math.atan2(ty - y, tx - x), Math.hypot(tx - x, ty - y) + 6, { m: 0.6, w: 4, fade: 180, snd: "magic", st: { burn: 0.6, mark: 1 } });
      A.imp(tx, ty, 0.5);
    } }),
  "M01+M26": (A) => A.turret(A.px, A.py - 44, { spr: "sun", follow: 1, oy: -42, scale: 1.1, dur: 8, every: 1, fn: (x, y) => (A.healAmt(A.p.maxHp * 0.025), A.puff("star", A.p.cx, A.p.cy, 4, "light"), A.ring(x, y + 30, 90, "fire", 500), A.area(A.p.cx, A.p.cy, 90, 0.3, { kb: 0, st: { burn: 1 } })) }),
  "M01+M27": (A) => A.shot({ spr: "flame", scale: 1.8, m: 1, end: (x, y) => (A.boom(x, y, 64, 1.5, { st: { burn: 1.2, stun: 1 } }), A.flashAll({ x, y, r: 110, stun: 1, m: 0, ms: 200 })) }),
  "M01+M28": (A) => A.TX(4, 360, 40).forEach(({ x, y }, i) => A.pillar(x, { y, delay: 340 + i * 120, w: 15, m: 1.4, undead: 2, st: { burn: 1.2 }, fx: "flame", then: (px, gy) => (A.puff("flame", px, gy - 10, 18, "fire"), A.pool(px, 22, 1.5, { m: 0.15 })) })),
  "M01+M29": (A) => A.shot({ spr: "flame", homing: 7, speed: 300, life: 4, noTerrain: 1, scale: 1.8, m: 1.4, st: { burn: 1.2, eternal: 1 }, tick: (P) => A.puff("dark", P.x, P.y, 1, "dark"), end: (x, y) => A.boom(x, y, 40, 0.8) }),
  "M01+M30": (A) => A.T(2, 280).forEach((t) => (A.hit(t, 1.6, { drain: 0.35, drainFx: 1, st: { burn: 1.2, eternal: 1 } }), A.puff("flame", ...A.tp(t), 16))),
  "M01+M31": (A) =>
    A.T(3, 320).forEach((t) => {
      A.st(t, { curse: 0.4, curseDur: 4 });
      const g = A.img("glow", ...A.tp(t), { add: 1, scale: 0.5, el: "hellfire" });
      A.K.ent({ dur: 4, upd: () => { if (!t.dead) { g.setPosition(t.body.x, t.body.y - t.body.h / 2); Math.random() < 0.3 && A.puff("ember", g.x, g.y, 1, "fire"); } }, end: () => { g.destroy(); A.boom(g.x, g.y, 70, 2.4, { cam: 1 }); } });
    }),
  "M01+M32": (A) => {
    const a = A.aim(110);
    A.vortex(a.x, a.y - 10, { dur: 3, r: 120, coreCol: 0x200008, core: 12, m: 0.35, st: { burn: 1 }, boom: 100, bm: 3, frame: (e) => A.puff("flame", e.x + (Math.random() - 0.5) * 20, e.y + (Math.random() - 0.5) * 20, 1, "hellfire") });
  },

  // ── 불꽃 고리 ──
  "M02+M02": (A) => (A.aura({ R: 80, layers: 3, dur: 6, m: 0.6, every: 0.45, st: { burn: 1 } }), A.orbit(9, { spr: "ball", scale: 0.6, R: 80, dur: 6, m: 0.3, spd: 3 }), A.snd("buff")),
  "M02+M03": (A) =>
    A.aura({ R: 40, dur: 4, m: 0.4, every: 0.2, st: { burn: 1 },
      frame: (e, dt, C) => { for (let k = 0; k < 4; k++) { const a = e.a * 0.7 + k * PI / 2; for (let j = 0; j < 3; j++) { const r = 40 + Math.random() * 70; A.trail(C.x + Math.cos(a) * r, C.y + Math.sin(a) * r * 0.8); } } },
      fn: (C, R, ts, e) => { const seen = new Set(); for (let k = 0; k < 4; k++) { const a = e.a * 0.7 + k * PI / 2; for (let r = 40; r <= 110; r += 16) A.K.tin(C.x + Math.cos(a) * r, C.y + Math.sin(a) * r * 0.8, 14, seen).forEach((t) => seen.add(t)); } seen.forEach((t) => A.hit(t, 0.3, { kb: 40, noCrit: 1, st: { burn: 0.6 } })); } }),
  "M02+M04": (A) => { const a = A.aim(150); A.drop(a.x, { gy: a.gy, scale: 3.4, r: 70, m: 2, big: 1, then: (x, gy) => A.aura({ at: 1, x, y: gy - 14, R: 54, dur: 4, m: 0.5, st: { burn: 1 } }) }); },
  "M02+M05": (A) =>
    A.aura({ R: 44, dur: 4, m: 0.4, every: 0.6, st: { burn: 1 }, fn: (C, R, ts, e) => {
      for (let i = 0; i < 6; i++) { const a = e.a + (i * PI) / 3; A.shot({ spr: "spear", el: "ice", x: C.x + Math.cos(a) * R, y: C.y + Math.sin(a) * R * 0.75, ang: a, speed: 420, life: 0.5, scale: 1.2, pierce: 2, m: 0.5, st: { chill: 1 }, end: (x, y) => (A.puff("mist", x, y, 10, "steam"), A.area(x, y, 30, 0.4, { kb: 60 }), A.flash(x, y, 20, "steam")) }); }
    } }),
  "M02+M06": (A) => { const x = A.px, y = A.py; A.rep(6, 330, (i) => { A.nova(x, y, 100, 0.5, { el: i % 2 ? "ice" : "fire", st: i % 2 ? { chill: 2 } : { burn: 1 }, snd: i % 2 ? "ice" : "magic" }); i > 0 && A.T(2, 100, x, y).forEach((t) => A.boom(...A.tp(t), 36, 0.6, { el: "steam" })); }); },
  "M02+M07": (A) => {
    const x = A.px;
    [-1, 1].forEach((s) => A.wall(x + s * 42, { dur: 1.6, m: 0.5, el: "ice", end: (wx, gy) => A.puff("mist", wx, gy - 30, 30, "steam") }));
    A.aura({ R: 36, dur: 1.6, m: 0.4, st: { burn: 1 } });
    A.later(1500, () => { A.cloud(x, A.py - 6, 70, 5, { m: 0.1, st: { blind: 1 }, fx: "mist", fxEl: "steam", frame: (z) => A.K.clearProj(z.x - z.r, z.x + z.r, z.y - 60, z.y + 40) }); A.text(x, A.py - 40, "증기 장막", "#f0f0ff"); });
  },
  "M02+M08": (A) => (A.aura({ R: 46, dur: 4, m: 0.3, st: { burn: 1 } }), A.orbit(3, { spr: "orb", el: "ice", R: 46, dur: 4, spd: 3, scale: 1, m: 0.4, cd: 0.6, touch: (t, x, y) => A.boom(x, y, 34, 0.8, { el: "steam" }) })),
  "M02+M09": (A) => A.aura({ R: 48, dur: 4, m: 0.4, every: 0.4, st: { burn: 1 }, touch: (t, C, R) => { const [tx, ty] = A.tp(t); const a = Math.atan2(ty - C.y, tx - C.x); A.bolt(C.x + Math.cos(a) * R * 1.6, C.y + Math.sin(a) * R, tx, ty, "plasma", 3, 200); A.hit(t, 0.6, { kb: 80 }); A.puff("spark", tx, ty, 8, "lightning"); } }),
  "M02+M10": (A) => A.aura({ R: 70, dur: 5, m: 0.3, every: 1, st: { burn: 1 }, layers: 2, touch: (t) => A.strike(t.body.x, { delay: 60, cloud: 0, y: t.body.y - 8, m: 1, r: 20 }) }),
  "M02+M11": (A) => A.aura({ R: 52, dur: 4, m: 0.3, every: 0.35, st: { burn: 1 }, fn: (C, R, ts) => { for (let i = 0; i < ts.length - 1; i++) (A.bolt(...A.tp(ts[i]), ...A.tp(ts[i + 1]), "plasma", 2, 200), A.hit(ts[i + 1], 0.35, { kb: 20 })); ts.length === 1 && A.bolt(C.x, C.y, ...A.tp(ts[0]), "plasma", 2, 180); } }),
  "M02+M12": (A) => {
    A.aura({ R: 50, dur: 5, m: 0.3, st: { burn: 1 } });
    A.orbit(2, { spr: "orb", el: "lightning", R: 50, dur: 5, spd: 3.5, rev: 1, scale: 1.4, m: 0.5, cd: 0.3, frame: (e) => e.pos.forEach((q) => { if (!q) return; const t = A.T(1, 70, q.x, q.y)[0]; t && Math.random() < 0.15 && (A.bolt(q.x, q.y, ...A.tp(t), "lightning", 2, 150), A.hit(t, 0.25, { kb: 10, noCrit: 1 })); }) });
  },
  "M02+M13": (A) => A.aura({ at: 1, x: A.hx, y: A.hy, R: 30, dur: 1.3, m: 0.55, every: 0.15, st: { burn: 1 }, kb: 200, frame: (e, dt) => ((e.x += A.d * 400 * dt), A.puff("streak", e.x, e.y, 2, "wind")), end: (C) => A.boom(C.x, C.y, 40, 0.8) }),
  "M02+M14": (A) => A.tornado(A.px + A.d * 24, { vx: 120, dur: 3.2, scale: 1.3, fx: "flame", fxEl: "fire", m: 0.5, st: { burn: 1.2 }, each: (t) => Math.random() < 0.3 && A.area(t.body.x, t.body.y - 10, 50, 0.1, { kb: 0, st: { burn: 1 } }) }),
  "M02+M15": (A) => A.aura({ R: (e) => 30 + (1.2 - e.t) * 110, dur: 1.2, every: 0.12, m: 0.5, push: 1, once: 1, st: { burn: 1 }, touch: (t) => A.later(250, () => t.dead || (A.ring(t.body.x, t.body.y - 10, 50, "fire"), A.area(t.body.x, t.body.y - 10, 50, 0.15, { kb: 0, st: { burn: 1 } }))) }),
  "M02+M16": (A) => (A.updraft({ vy: -640, m: 0.6, fx: "flame", fxEl: "fire" }), A.aura({ R: 46, dur: 4, m: 0.5, every: 0.4, st: { burn: 1 } })),
  "M02+M17": (A) => {
    A.aura({ R: 44, dur: 2.2, m: 0.3, st: { burn: 1 } });
    A.orbit(3, { spr: "rock", el: "lava", R: 44, dur: 1.8, scale: 1.2, spd: 4, m: 0.4, release: (x, y, i) => A.later(i * 200, () => {
      const t = A.T(1, 320, x, y)[0];
      A.shot({ spr: "rock", el: "lava", x, y, ang: t ? Math.atan2(t.body.y - t.body.h / 2 - y, t.body.x - x) : A.ang, speed: 420, scale: 1.4, spin: 10, m: 1, end: (ex, ey) => (A.boom(ex, ey, 40, 1, { st: { burn: 1 } }), A.pool(ex, 22, 2, { m: 0.15, y: ey })) });
    }) });
  },
  "M02+M18": (A) => (A.aura({ R: 56, dur: 3, m: 0.3, st: { burn: 1 } }), A.rep(3, 900, () => A.spikeRing(A.p.cx, 56, 8, { el: "lava", m: 0.7, st: { burn: 1 }, y: A.p.body.y - 8 }))),
  "M02+M19": (A) => {
    A.aura({ R: 70, dur: 5, m: 0.3, st: { burn: 1 }, layers: 2 });
    A.pool(A.px, 80, 5, { m: 0.25, st: { burn: 1 }, fx: "flame", fxEl: "fire", frame: (z, dt) => Math.random() < dt * 5 && A.pillar(z.x + (Math.random() - 0.5) * z.r * 1.6, { gy: z.y, warn: 0, delay: 0, w: 5, h: 50, m: 0.3, el: "lava", snd: "thud", fx: "flame" }) });
    A.shake(4, 400);
  },
  "M02+M20": (A) => { const seen = new Set(); A.aura({ R: 60, dur: 5, m: 0.3, every: 0.4, st: { burn: 1 }, touch: (t) => { if (seen.has(t)) return; seen.add(t); A.hand(t.body.x, { t, tint: 0xff6a20, m: 0.8, grab: 2.5, st: { burn: 1.2 }, fx: "flame" }); } }); },
  "M02+M21": (A) => A.aura({ R: 44, dur: 4, m: 0.3, every: 0.7, st: { burn: 1 }, fn: (C, R, ts, e) => { for (let i = 0; i < 8; i++) { const a = e.a + (i * PI) / 4; A.shot({ spr: "needle", el: "poison", x: C.x + Math.cos(a) * R, y: C.y + Math.sin(a) * R * 0.75, ang: a, speed: 460, life: 0.6, scale: 1.2, m: 0.35, st: { poison: 1 }, hit: (t, x, y) => A.boom(x, y, 26, 0.4, { el: "sulfur", st: { burn: 1 } }) }); } } }),
  "M02+M22": (A) => {
    const x = A.px, y = A.py;
    A.aura({ R: 44, dur: 2, m: 0.3, st: { burn: 1 } });
    const z = A.cloud(x, y, 80, 1.4, { m: 0.15, el: "poison", st: { poison: 1 } });
    A.later(1300, () => { z.t = 0; A.cam(100, 255, 200, 120); [[0, 0], [-50, -10], [50, -10], [-25, 20], [25, 20]].forEach(([dx, dy], i) => A.later(i * 60, () => A.boom(x + dx, y + dy, 48, 1.2, { el: "sulfur", st: { burn: 1, poison: 2 } }))); });
  },
  "M02+M23": (A) => A.aura({ R: 56, dur: 5, m: 0.35, every: 0.5, st: { burn: 1, poison: 1, armor: 0.3 }, frame: (e, dt, C, R) => Math.random() < 0.4 && A.puff("bubble", C.x + (Math.random() - 0.5) * R * 2, C.y + 10, 1, "poison") }),
  "M02+M24": (A) => (A.aura({ R: 50, dur: 6, m: 0.3, st: { burn: 1 } }), A.pool(A.px, 70, 6, { m: 0.25, slow: 1, st: { burn: 1, poison: 1 }, fx: "flame", fxEl: "fire", frame: (z, dt) => Math.random() < dt * 10 && A.puff("smoke", z.x + (Math.random() - 0.5) * z.r * 1.6, z.y - 4, 1, "sulfur") })),
  "M02+M25": (A) => A.aura({ R: 44, dur: 4, m: 0.3, every: 1, st: { burn: 1 }, fn: (C, R, ts, e) => { for (let i = 0; i < 4; i++) { const a = e.a + (i * PI) / 2; A.shot({ spr: "spear", el: "solar", x: C.x + Math.cos(a) * R, y: C.y + Math.sin(a) * R * 0.75, ang: a, speed: 520, life: 0.8, scale: 1.4, pierce: 99, m: 0.8, undead: 2, hit: (t, x, y) => A.rays(x, y, 30) }); } } }),
  "M02+M26": (A) => {
    const x = A.px, y = A.py;
    A.aura({ at: 1, x, y, R: 56, dur: 6, m: 0.3, every: 0.5, st: { burn: 1 }, fn: (C, R) => Math.abs(A.p.cx - C.x) < R && Math.abs(A.p.cy - C.y) < 40 && (A.healAmt(A.p.maxHp * 0.02), A.puff("star", A.p.cx, A.p.cy, 3, "light")) });
    A.pool(x, 24, 6, { m: 0, fx: "flame", fxEl: "fire" });
  },
  "M02+M27": (A) => A.aura({ R: 48, dur: 3, m: 0.4, st: { burn: 1 }, end: () => A.flashAll({ x: A.p.cx, y: A.p.cy, r: 150, stun: 1.8, m: 0.8, ms: 220 }) }),
  "M02+M28": (A) => { const x = A.px, y = A.py; A.aura({ at: 1, x, y, R: 70, dur: 4.5, m: 0.3, st: { burn: 1 } }); A.rep(3, 1400, () => [-70, -30, 30, 70].forEach((dx, i) => A.pillar(x + dx, { delay: 200 + i * 80, w: 12, m: 1, el: "solar", st: { burn: 1 }, fx: "flame" }))); },
  "M02+M29": (A) => {
    A.aura({ R: 44, dur: 5, m: 0.3, st: { burn: 1 } });
    A.orbit(3, { spr: "flame", el: "hellfire", R: 44, dur: 5, spd: 4, m: 0.3, frame: (e) => e.pos.forEach((q, i) => {
      if (!q) return;
      const t = A.T(1, 100, q.x, q.y)[0];
      if (!t) return;
      e.kill(i);
      A.shot({ spr: "flame", el: "hellfire", x: q.x, y: q.y, ang: Math.atan2(t.body.y - q.y, t.body.x - q.x), homing: 6, speed: 280, life: 2.5, scale: 1.5, m: 1.2, st: { burn: 1.2, eternal: 1 }, end: (x, y) => A.boom(x, y, 36, 0.6) });
    }) });
  },
  "M02+M30": (A) => A.aura({ R: 64, dur: 5, m: 0.35, every: 1, st: { burn: 1 }, touch: (t) => A.hit(t, 0.3, { kb: 0, drain: 0.5, drainFx: 1 }) }),
  "M02+M31": (A) => { const s = new Set(); A.aura({ R: 50, dur: 5, m: 0.35, st: { burn: 1 }, touch: (t) => s.has(t) || (s.add(t), A.st(t, { curse: 0.4, burn: 1.2, eternal: 1 })) }); },
  "M02+M32": (A) => {
    const x = A.px + A.d * 30, y = A.py;
    A.aura({ at: 1, x, y, R: (e) => 10 + (e.t / 2.2) * 110, dur: 2.2, every: 0.25, m: 0.35, st: { burn: 1 }, frame: (e, dt, C, R) => A.K.tin(C.x, C.y, R + 30).forEach((t) => t.kind !== "boss" && (t.body.vx += Math.sign(C.x - t.body.x) * 1400 * dt)), end: (C) => A.boom(C.x, C.y, 60, 2, { el: "hellfire", cam: 1 }) });
  },

  // ── 화염 방사 ──
  "M03+M03": (A) => A.stream({ len: 210, dur: 1.8, n: 24, m: 0.3, st: { burn: 0.8 }, fx: "ember", fxEl: "fire", end: () => A.shot({ spr: "flame", x: A.p.cx + A.p.facing * 10, y: A.p.cy - 4, ang: A.p.facing > 0 ? 0 : PI, speed: 500, life: 0.5, scale: 3, m: 1, end: (ex, ey) => A.boom(ex, ey, 90, 2.6, { cam: 1, st: { burn: 1.5 } }) }) }),
  "M03+M04": (A) => {
    A.stream({ ang: -PI / 2 + A.d * 0.15, len: 150, dur: 1, n: 12, m: 0.2 });
    A.later(2000, () => A.TX(5, 400, 50).forEach(({ x, y }, i) => A.drop(x + (Math.random() - 0.5) * 40, { y, delay: i * 150, scale: 2.2, r: 50, m: 1.3, trailFx: "flame", trailEl: "fire" })));
  },
  "M03+M05": (A) => (A.stream({ len: 110, dur: 1, n: 12, m: 0.22, st: { burn: 0.6 }, pel: "fire" }), A.later(300, () => A.shot({ spr: "spear", el: "ice", speed: 420, life: 0.45, scale: 1.5, pierce: 99, m: 0.8, st: { chill: 2 }, end: (x, y) => (A.boom(x, y, 70, 2, { el: "steam" }), A.puff("mist", x, y, 30, "steam"), A.cloud(x, y, 50, 2, { m: 0.1 })) }))),
  "M03+M06": (A) => { const x0 = A.px, d = A.d; A.stream({ len: 130, dur: 1.4, n: 16, m: 0.22, st: { burn: 0.5, chill: 1 }, fx: "mist", fxEl: "ice" }); A.cloud(x0 + d * 70, A.py, 80, 3, { m: 0.12, st: { chill: 1 } }); A.later(1200, () => A.rep(5, 120, (i) => A.boom(x0 + d * (30 + i * 30), A.py + (Math.random() - 0.5) * 20, 40, 0.9, { el: "steam" }))); },
  "M03+M07": (A) => { const W = A.wall(A.px + A.d * 40, { dur: 1.3, m: 0.5, el: "ice" }); A.later(200, () => A.stream({ len: 44, dur: 1, n: 10, m: 0.2, pel: "fire" })); A.later(1100, () => { W.z && (W.z.t = 0); A.mover({ x: W.x, y: W.gy - 26, vx: 300, dur: 0.9, r: 44, m: 0.6, every: 0.15, fx: "mist", fxEl: "steam", dens: 10, kb: 260, st: { burn: 1, chill: 1 } }); }); },
  "M03+M08": (A) => (A.stream({ len: 100, dur: 1, n: 12, m: 0.22, st: { burn: 0.6 }, pel: "fire" }), A.later(1000, () => A.roll({ spr: "orb", el: "ice", x: A.p.cx + A.p.facing * 100, scale: 1.6, vx: 120, dur: 3, m: 0.4, fx: "mist", fxEl: "steam", drip: [0.3, (x, gy) => A.cloud(x, gy - 18, 36, 2.5, { m: 0.1, st: { chill: 1 } })], end: (x, gy) => A.boom(x, gy - 12, 50, 1.2, { el: "steam" }) }))),
  "M03+M09": (A) => { A.p.body.vx = 0; A.beam(A.hx, A.hy, A.ang, 640, { dur: 2, every: 0.1, follow: 1, m: 0.32, w: 9, fade: 130, st: { burn: 0.4 } }); A.shake(2, 2000); },
  "M03+M10": (A) => { const cd = new Set(); A.stream({ len: 110, dur: 1.6, n: 20, m: 0.24, st: { burn: 0.6 }, each: (t) => { if (cd.has(t)) return; cd.add(t); A.strike(t.body.x, { delay: 120, y: t.body.y - 8, m: 1, r: 22 }); A.later(800, () => cd.delete(t)); } }); },
  "M03+M11": (A) => A.rep(5, 300, () => A.chain(A.p.cx + A.p.facing * 10, A.p.cy - 4, 4, { m: 0.5, w: 5, r: 180, gap: 40, el: "plasma", st: { burn: 0.8 }, each: (t, tx, ty, i, cx, cy) => { for (let k = 0; k < 6; k++) A.trail(cx + ((tx - cx) * k) / 6, cy + ((ty - cy) * k) / 6, "fire"); } })),
  "M03+M12": (A) => {
    const a = A.aim(90);
    A.turret(a.x, a.gy - 80, { spr: "orb", el: "lightning", scale: 1.6, dur: 5, every: 0.12,
      fn: (x, y, i) => { for (let k = 0; k < 6; k++) A.trail(x + (Math.random() - 0.5) * (10 + k * 5), y + 10 + k * 12, "plasma"); i % 4 === 0 && A.bolt(x, y, x + (Math.random() - 0.5) * 30, y + 70, "lightning", 1, 120); A.rect(x - 22, x + 22, y, y + 90, 0.12, { kb: 0, noCrit: 1, st: { burn: 0.3 } }); },
      move: (e, dt) => { const t = A.T(1, 200, e.x, e.y + 60)[0]; t && (e.x += Math.sign(t.body.x - e.x) * Math.min(60 * dt, Math.abs(t.body.x - e.x))); } });
  },
  "M03+M13": (A) => A.fan(2, 0, { spr: "blade", el: "heatwave", seq: 130, speed: 600, life: 1.2, pierce: 5, scale: 1.7, noTerrain: 1, m: 1.2, st: { burn: 1 }, tick: (P) => A.puff("flame", P.x, P.y, 2, "fire") }),
  "M03+M14": (A) => (A.stream({ len: 90, dur: 0.8, n: 10, m: 0.22, st: { burn: 0.6 } }), A.later(700, () => A.tornado(A.p.cx + A.p.facing * 60, { vx: 110, dur: 3, scale: 1.3, fx: "flame", fxEl: "fire", m: 0.45, st: { burn: 1 } }))),
  "M03+M15": (A) => A.stream({ len: 310, dur: 1.6, n: 20, m: 0.24, st: { burn: 1 }, fx: "streak", fxEl: "wind", each: (t, i) => i % 5 === 0 && A.area(t.body.x, t.body.y - 10, 50, 0.08, { kb: 0, st: { burn: 0.6 } }) }),
  "M03+M16": (A) => { const x = A.px, gy = A.fy; A.updraft({ vy: -620, m: 0.5, fx: "flame", fxEl: "fire" }); A.rep(10, 100, () => { for (let k = 0; k < 8; k++) A.trail(x + (Math.random() - 0.5) * 30, gy - Math.random() * 90, "fire"); A.rect(x - 30, x + 30, gy - 100, gy + 4, 0.18, { kb: 0, noCrit: 1, st: { burn: 0.6 } }); }); A.pool(x, 40, 3, { m: 0.15 }); },
  "M03+M17": (A) => { A.stream({ len: 80, dur: 0.6, n: 8, m: 0.2, pel: "lava" }); for (let i = 0; i < 4; i++) A.shot({ spr: "rock", el: "lava", delay: i * 90, ang: (A.d > 0 ? -0.5 : PI + 0.5) + (Math.random() - 0.5) * 0.3, speed: 260 + i * 30, grav: 700, scale: 1.2, spin: 9, m: 0.6, end: (x, y) => (A.boom(x, y, 30, 0.6, { el: "lava" }), A.pool(x, 30, 4, { m: 0.22, st: { burn: 1 }, y })) }); },
  "M03+M18": (A) => (A.stream({ len: 120, dur: 1.2, n: 14, m: 0.22, st: { burn: 0.6 } }), A.spikes(A.px + A.d * 24, A.d, 6, { step: 150, gap: 20, el: "lava", m: 0.7, st: { burn: 1 }, each: (x, gy) => A.puff("flame", x, gy - 16, 10, "fire") })),
  "M03+M19": (A) => (A.stream({ ang: A.d > 0 ? 0.55 : PI - 0.55, len: 100, dur: 1.2, n: 14, m: 0.2 }), A.later(400, () => { for (let i = 0; i < 5; i++) A.pool(A.px + A.d * (30 + i * 40), 26, 5, { m: 0.25, st: { burn: 1 } }); }), A.shake(4, 600)),
  "M03+M20": (A) => A.TX(2, 300, 60).forEach(({ t, x }) => A.hand(x, { t, tint: 0xff6a20, scale: 1.2, m: 0.8, grab: 2.2, fx: "flame", then: (hx, gy) => A.rep(10, 200, () => { for (let k = 0; k < 8; k++) A.trail(hx + (Math.random() - 0.5) * 20, gy - 10 - Math.random() * 60, "fire"); A.rect(hx - 20, hx + 20, gy - 70, gy + 4, 0.2, { kb: 0, noCrit: 1, st: { burn: 0.6 } }); }) })),
  "M03+M21": (A) => A.stream({ len: 110, dur: 1.6, n: 20, m: 0.22, st: { burn: 0.6 }, fn: (x, y, i) => i % 2 === 0 && A.shot({ spr: "needle", el: "poison", x: A.p.cx + A.p.facing * 10, y: A.p.cy - 4 + (Math.random() - 0.5) * 14, ang: (A.p.facing > 0 ? 0 : PI) + (Math.random() - 0.5) * 0.3, speed: 520, life: 0.4, scale: 1.1, trail: 0, m: 0.25, st: { poison: 1, burn: 0.5 } }) }),
  "M03+M22": (A) => { const cd = new Set(); A.stream({ len: 120, dur: 1.6, n: 20, m: 0.2, st: { burn: 0.5, poison: 1 }, fx: "smoke", fxEl: "poison", each: (t) => { if (cd.has(t)) return; cd.add(t); A.boom(...A.tp(t), 34, 0.8, { el: "sulfur" }); A.later(500, () => cd.delete(t)); } }); },
  "M03+M23": (A) => {
    A.T(3, 200).forEach((t) => A.st(t, { rot: 0.3 }));
    const done = new Set();
    A.stream({ len: 110, dur: 1.4, n: 16, m: 0.24, st: { burn: 0.6 }, each: (t) => { if (done.has(t) || !(t._frRot > Date.now())) return; done.add(t); const [x, y] = A.tp(t); A.boom(x, y, 50, 1.2, { el: "poison", st: { poison: 2 } }); A.puff("bubble", x, y, 16, "poison"); A.cloud(x, y, 40, 3, { m: 0.12, st: { poison: 1 } }); } });
  },
  "M03+M24": (A) => {
    const x = A.px + A.d * 70;
    A.pool(x, 100, 10, { m: 0.22, slow: 1, el: "poison", st: { poison: 1 }, fx: "bubble", fxEl: "poison" });
    A.later(250, () => A.stream({ ang: A.d > 0 ? 0.35 : PI - 0.35, len: 90, dur: 0.6, n: 8, m: 0.2 }));
    A.later(800, () => { A.boom(x, A.gy(x) - 10, 50, 0.8, { el: "sulfur" }); A.pool(x, 100, 9, { m: 0.18, st: { burn: 1 }, fx: "flame", fxEl: "fire", frame: (z, dt) => Math.random() < dt * 8 && A.puff("smoke", z.x + (Math.random() - 0.5) * z.r * 1.6, z.y - 6, 1, "sulfur") }); });
  },
  "M03+M25": (A) => { A.p.body.vx = 0; A.flash(A.hx, A.hy, 30, "solar"); A.later(250, () => { A.beam(A.p.cx + A.p.facing * 10, A.p.cy - 4, A.p.facing > 0 ? 0 : PI, 640, { m: 3, w: 14, fade: 420, undead: 2, st: { burn: 1.2 } }); A.cam(120, 255, 240, 180); A.shake(5); }); },
  "M03+M26": (A) => A.stream({ len: 110, dur: 2, n: 24, m: 0.24, st: { burn: 0.8 }, fn: (x, y, i) => i % 3 === 0 && (A.healAmt(A.p.maxHp * 0.012), A.puff("star", A.p.cx, A.p.cy, 2, "light")) }),
  "M03+M27": (A) => A.stream({ len: 110, dur: 1.6, n: 20, m: 0.24, st: { burn: 0.7 }, end: (x, y) => { const mx = (A.p.cx + x) / 2; A.flash(mx, y, 80, "light", 300); A.cam(200, 255, 255, 230); A.rays(mx, y, 90, "light"); A.K.trect(A.p.cx, A.p.cx + A.p.facing * 130, A.p.body.y - 50, A.p.body.y + 10).forEach((t) => (A.st(t, { stun: 2 }), A.hit(t, 0.8))); } }),
  "M03+M28": (A) => A.TX(4, 340, 45).forEach(({ x, y }, i) => A.pillar(x, { y, delay: 300 + i * 130, w: 13, m: 1.1, st: { burn: 1 }, fx: "flame", then: (px, gy) => A.rep(8, 90, () => { for (let k = 0; k < 6; k++) A.trail(px + (Math.random() - 0.5) * 24, gy - Math.random() * 120, "fire"); A.rect(px - 16, px + 16, gy - 120, gy + 4, 0.12, { kb: 0, noCrit: 1, st: { burn: 0.4 } }); }) })),
  "M03+M29": (A) => A.stream({ len: 120, dur: 1.8, n: 22, m: 0.26, st: { burn: 1, eternal: 1 }, fx: "dark", fxEl: "dark" }),
  "M03+M30": (A) => A.stream({ len: 110, dur: 1.8, n: 22, m: 0.26, drain: 0.25, st: { burn: 0.8 }, fx: "wisp", fxEl: "dark", fn: (x, y, i) => i % 4 === 0 && A.puff("wisp", A.p.cx, A.p.cy, 3, "dark") }),
  "M03+M31": (A) => { const s = new Set(); A.stream({ len: 110, dur: 1.6, n: 20, m: 0.24, st: { burn: 1, eternal: 1 }, each: (t) => s.has(t) || (s.add(t), A.st(t, { curse: 0.4 })) }); },
  "M03+M32": (A) => { const x = A.px + A.d * 70, y = A.py; A.vortex(x, y, { dur: 2, r: 130, m: 0.2, force: 1400 }); A.later(300, () => A.stream({ len: 110, dur: 1.6, n: 20, m: 0.3, st: { burn: 1, eternal: 1 }, pel: "hellfire", fx: "dark", fxEl: "dark" })); },

  // ── 유성 낙하 ──
  "M04+M04": (A) => { const a = A.aim(160); A.dark(1300, 0.55); A.text(a.x, a.gy - 60, "!!", "#ff6040"); A.drop(a.x, { gy: a.gy, delay: 700, speed: 420, scale: 7, glow: 6, r: 130, m: 10, big: 1, trailFx: "flame", trailEl: "fire", then: (x, gy) => (A.shake(12, 700), A.pool(x, 110, 3, { m: 0.3 }), A.nova(x, gy - 10, 170, 0, { snd: 0 })) }); },
  "M04+M05": (A) => { const a = A.aim(150); A.drop(a.x, { gy: a.gy, scale: 3.2, r: 80, m: 2.2, trailFx: "mist", trailEl: "ice", land: (x, gy) => (A.boom(x, gy - 10, 80, 2.4, { el: "steam", cam: 1, st: { chill: 2, burn: 1 } }), A.puff("mist", x, gy - 20, 40, "steam"), A.cloud(x, gy - 20, 80, 3, { m: 0.12 })) }); },
  "M04+M06": (A) => { const a = A.aim(150); A.drop(a.x, { gy: a.gy, scale: 3.2, r: 70, m: 2, then: (x, gy) => (A.nova(x, gy - 10, 130, 0.8, { el: "ice", st: { chill: 3 } }), A.cloud(x, gy - 20, 110, 4, { m: 0.12, fx: "mist", fxEl: "steam" })) }); },
  "M04+M07": (A) => { const a = A.aim(120); A.drop(a.x, { gy: a.gy, spr: "wall", el: "ice", scale: 1.3, speed: 600, r: 60, trailFx: "flame", trailEl: "fire", land: (x, gy) => (A.boom(x, gy - 20, 70, 2, { el: "steam", cam: 1 }), A.puff("mist", x, gy - 30, 30, "steam"), A.wall(x, { dur: 6, m: 0.4, hitUp: 0, el: "ice" })) }); },
  "M04+M08": (A) => A.TX(6, 400, 40).forEach(({ x, y }, i) => A.drop(x + (Math.random() - 0.5) * 30, { y, delay: i * 140, scale: 1.6, r: 40, m: 1, trailFx: "mist", trailEl: "ice", then: (lx, gy) => A.cloud(lx, gy - 16, 40, 2, { m: 0.1, st: { chill: 1 }, fx: "mist", fxEl: "steam" }) })),
  "M04+M09": (A) => { const h = A.boltShot({ m: 1 }); A.drop(h.x, { y: h.y, speed: 1400, scale: 3, r: 70, m: 2, warn: 0, big: 1 }); },
  "M04+M10": (A) => A.TX(3, 380, 50).forEach(({ x, y }, i) => A.strike(x, { y, delay: 200 + i * 110, m: 0.9, then: (sx, gy) => A.drop(sx, { gy, delay: 250, scale: 1.8, r: 46, m: 1.3 }) })),
  "M04+M11": (A) => { const a = A.aim(150); A.drop(a.x, { gy: a.gy, scale: 3, r: 70, m: 2, then: (x, gy) => A.chain(x, gy - 20, 5, { m: 0.5, el: "plasma", each: (t, tx, ty) => A.boom(tx, ty, 34, 0.8) }) }); },
  "M04+M12": (A) => { const a = A.aim(150); A.drop(a.x, { gy: a.gy, scale: 3, r: 70, m: 2, then: (x, gy) => A.turret(x, gy - 14, { spr: "ball", el: "plasma", scale: 1.4, dur: 5, every: 0.45, fn: (cx, cy) => A.T(3, 90, cx, cy).forEach((t) => (A.bolt(cx, cy, ...A.tp(t), "lightning", 2, 160), A.hit(t, 0.4, { kb: 20, noCrit: 1 }))) }) }); },
  "M04+M13": (A) => { const a = A.aim(150); A.drop(a.x, { gy: a.gy, scale: 3, r: 70, m: 2, then: (x, gy) => [0, PI].forEach((ang) => A.fan(3, 0.15, { spr: "blade", el: "heatwave", x, y: gy - 14, ang, speed: 520, life: 0.8, pierce: 4, scale: 1.3, noTerrain: 1, m: 0.7, st: { burn: 1 } })) }); },
  "M04+M14": (A) => { const a = A.aim(150); A.drop(a.x, { gy: a.gy, scale: 3, r: 70, m: 2, then: (x) => A.tornado(x, { vx: 0, dur: 3.5, scale: 1.5, force: 1400, fx: "flame", fxEl: "fire", m: 0.45, st: { burn: 1 } }) }); },
  "M04+M15": (A) => A.drop(A.px + A.d * 60, { dx: -A.d * 240, h: 200, scale: 3, r: 50, m: 1.4, land: (lx, gy) => (A.boom(lx, gy - 10, 50, 1.2), A.roll({ x: lx, spr: "ball", el: "fire", scale: 3, vx: 260, dur: 1.6, m: 0.9, fx: "flame", fxEl: "fire", st: { burn: 1.2 }, drip: [0.12, (rx) => A.pool(rx, 20, 2, { m: 0.12 })], end: (ex, egy) => A.boom(ex, egy - 12, 50, 1) })) }),
  "M04+M16": (A) => { const a = A.aim(130); A.drop(a.x, { gy: a.gy, scale: 3, r: 66, m: 1.8, then: (x, gy) => (A.updraft({ x, gy, self: 0, m: 0.5, r: 60 }), A.later(700, () => A.drop(x + A.d * 60, { scale: 3, r: 70, m: 2, dx: -A.d * 60, h: 200, big: 1 }))) }); },
  "M04+M17": (A) => { const a = A.aim(130); A.drop(a.x, { gy: a.gy, scale: 3, r: 60, m: 1.8, land: (x, gy) => (A.boom(x, gy - 10, 60, 1.8), A.roll({ x, spr: "ball", el: "lava", scale: 2.6, vx: 170, dur: 2.6, m: 0.7, fx: "flame", fxEl: "fire", st: { burn: 1 }, drip: [0.14, (rx) => A.pool(rx, 22, 3, { m: 0.15, st: { burn: 1 } })] })) }); },
  "M04+M18": (A) => { const a = A.aim(150); A.drop(a.x, { gy: a.gy, scale: 3, r: 70, m: 2, then: (x, gy) => A.spikeRing(x, 70, 10, { el: "lava", m: 0.7, st: { burn: 1 }, y: gy - 8 }) }); },
  "M04+M19": (A) => {
    const a = A.aim(120), x = a.x, gy = a.gy;
    A.shake(6, 1200);
    A.pool(x, 80, 5, { m: 0.25, st: { burn: 1 } });
    A.rep(5, 300, () => { const px = x + (Math.random() - 0.5) * 100; A.pillar(px, { gy, delay: 0, warn: 0, w: 12, h: 180, m: 1.1, el: "lava", fx: "flame", snd: "explosion", st: { burn: 1 } }); for (let k = 0; k < 4; k++) A.shot({ spr: "rock", el: "lava", x: px, y: gy - 20, ang: -PI / 2 + (Math.random() - 0.5) * 1.4, speed: 240 + Math.random() * 120, grav: 700, scale: 0.9, spin: 10, m: 0.4 }); });
  },
  "M04+M20": (A) => A.TX(2, 320, 60).forEach(({ t, x, y }, i) => (A.hand(x, { t, scale: 1.2, m: 0.8, grab: 2.5, hold: 1400 }), A.drop(x, { y, delay: 500 + i * 200, scale: 3, r: 60, m: 2.2 }))),
  "M04+M21": (A) => A.TX(5, 400, 45).forEach(({ x, y }, i) => A.drop(x + (Math.random() - 0.5) * 30, { y, delay: i * 150, scale: 1.6, r: 44, el: "sulfur", m: 1.1, trailFx: "smoke", trailEl: "poison", ho: { st: { burn: 1, poison: 2 } } })),
  "M04+M22": (A) => { const a = A.aim(150); A.drop(a.x, { gy: a.gy, scale: 3.4, r: 100, m: 2.2, speed: 420, trailFx: "mist", trailEl: "poison", ho: { st: { poison: 2, burn: 1 } }, then: (x, gy) => (A.cloud(x, gy - 20, 120, 5, { m: 0.15, st: { poison: 1 } }), A.nova(x, gy - 14, 150, 0.4, { el: "poison", st: { poison: 1 } })) }); },
  "M04+M23": (A) => A.TX(2, 360, 60).forEach(({ t, x, y }, i) => (t && A.st(t, { rot: 0.3 }), A.drop(x, { y, delay: 300 + i * 250, scale: 2.6, r: 60, m: 1.8, then: (lx, gy) => (A.cloud(lx, gy - 20, 70, 4, { m: 0.15, st: { poison: 1.5 } }), A.area(lx, gy - 20, 90, 0.1, { kb: 0, st: { poison: 2 } })) }))),
  "M04+M24": (A) => { const a = A.aim(150); A.drop(a.x, { gy: a.gy, scale: 3, r: 70, m: 2, then: (x) => A.pool(x, 80, 8, { m: 0.22, slow: 1, st: { burn: 1, poison: 1 }, fx: "flame", fxEl: "fire", frame: (z, dt) => Math.random() < dt * 10 && A.puff("smoke", z.x + (Math.random() - 0.5) * z.r * 1.6, z.y - 6, 1, "sulfur") }) }); },
  "M04+M25": (A) => { const a = A.aim(160); const sx = a.x - A.d * 220, sy = a.gy - 260; const L = Math.hypot(a.x - sx, a.gy - sy); A.shot({ spr: "spear", el: "solar", x: sx, y: sy, ang: Math.atan2(a.gy - sy, a.x - sx), speed: 760, life: L / 760, noTerrain: 1, pierce: 99, scale: 3, r: 14, glow: 3, m: 2, undead: 2, st: { burn: 1 }, tick: (P) => A.puff("flame", P.x, P.y, 2, "fire"), end: (x, y) => A.boom(x, y, 60, 1.5) }); },
  "M04+M26": (A) => { const a = A.aim(120); A.drop(a.x, { gy: a.gy, scale: 2.8, r: 60, m: 1.8, el: "solar", then: (x) => A.pool(x, 60, 8, { m: 0.18, st: { burn: 1 }, heal: 0.01, fx: "star", fxEl: "light" }) }); },
  "M04+M27": (A) => { const a = A.aim(150); A.drop(a.x, { gy: a.gy, scale: 3.2, r: 70, m: 2, then: (x, gy) => A.flashAll({ x, y: gy - 20, stun: 1.6, m: 0.5 }) }); },
  "M04+M28": (A) => { const a = A.aim(150); [-90, -45, 45, 90].forEach((dx, i) => A.pillar(a.x + dx, { y: a.gy - 8, delay: 200 + i * 120, w: 12, m: 1.2 })); A.drop(a.x, { gy: a.gy, delay: 900, scale: 4.4, r: 100, m: 3.2, big: 1, el: "solar", then: (x, gy) => A.rays(x, gy - 20, 120, void 0, 16) }); },
  "M04+M29": (A) => {
    const t = A.screen().filter((u) => !u.dead).sort((a, b) => b.hp - a.hp)[0];
    const tx = t ? t.body.x : A.px + A.d * 150;
    const sx = tx - A.d * 150, sy = (t ? t.body.y : A.fy) - 320;
    A.shot({ spr: "ball", el: "dark", x: sx, y: sy, ang: Math.atan2(320, A.d * 150), speed: 460, life: 3, noTerrain: 1, scale: 3.4, glow: 3, r: 14, m: 0,
      tick: (P, dt) => {
        A.puff("dark", P.x, P.y, 2, "dark");
        if (t && !t.dead) {
          const w = Math.atan2(t.body.y - t.body.h / 2 - P.y, t.body.x - P.x); let a = Math.atan2(P.vy, P.vx), df = w - a;
          while (df > PI) df -= 2 * PI; while (df < -PI) df += 2 * PI;
          a += Math.max(-3 * dt, Math.min(3 * dt, df)); P.vx = Math.cos(a) * P.speed; P.vy = Math.sin(a) * P.speed;
          Math.hypot(P.x - t.body.x, P.y - (t.body.y - t.body.h / 2)) < 20 && A.end(P);
        }
        P.y >= A.gy(P.x, P.y - 30) - 6 && A.end(P);
      },
      end: (x, y) => A.boom(x, y, 80, 2.6, { cam: 1, el: "dark" }) });
  },
  "M04+M30": (A) => { const a = A.aim(150); A.drop(a.x, { gy: a.gy, scale: 3, r: 70, m: 2, ho: { drain: 0.25, drainFx: 1, st: { burn: 1 } } }); },
  "M04+M31": (A) => A.TX(2, 360, 60).forEach(({ t, x, y }, i) => (t && A.st(t, { curse: 0.4 }), A.drop(x, { y, delay: 400 + i * 250, scale: 2.8, r: 60, m: 2, el: "hellfire", ho: { st: { burn: 1.2, eternal: 1 } } }))),
  "M04+M32": (A) => { const a = A.aim(150); A.drop(a.x, { gy: a.gy, scale: 3, r: 60, m: 1.6, then: (x, gy) => A.vortex(x, gy - 24, { dur: 3, r: 140, m: 0.3, force: 1300, boom: 110, bm: 3 }) }); },

  // ── 얼음 창 ──
  "M05+M05": (A) => A.shot({ spr: "spear", speed: 640, life: 1.2, scale: 3.2, r: 14, pierce: 99, noTerrain: 1, glow: 3, m: 2, st: { chill: 5 }, tick: (P) => A.puff("shard", P.x, P.y, 1), end: (x, y) => A.imp(x, y, 1) }),
  "M05+M06": (A) => A.shot({ spr: "spear", speed: 540, scale: 1.6, m: 1.2, st: { chill: 2 }, end: (x, y) => A.nova(x, y, 90, 0.8, { st: { chill: 3 } }) }),
  "M05+M07": (A) => A.fan(3, 0.12, { spr: "spear", speed: 520, scale: 1.5, pierce: 99, m: 1, st: { chill: 2 }, hit: (t) => A.wall(t.body.x + A.d * 16, { dur: 4, sy: 0.6, m: 0.3, hitUp: 0 }), end: (x, y) => A.wall(x, { y, dur: 4, sy: 0.6, m: 0.3 }) }),
  "M05+M08": (A) => A.turret(A.hx, A.hy, { spr: "orb", scale: 1.6, dur: 4, every: 0.9, first: 0.2, vx: A.d * 45, fn: (x, y) => (A.puff("star", x, y, 6), A.shot({ spr: "spear", x, y, ang: A.d > 0 ? 0 : PI, speed: 520, pierce: 99, scale: 1.3, m: 0.8, st: { chill: 2 } })), frame: (e) => A.K.tin(e.x, e.y, 44).forEach((t) => Math.random() < 0.05 && A.st(t, { chill: 1 })) }),
  "M05+M09": (A) => A.fan(3, 0, { spr: "shard", seq: 90, speed: 1000, scale: 2, m: 1, r: 6, st: { chill: 2 }, tick: (P) => A.puff("spark", P.x, P.y, 1, "lightning"), hit: (t, x, y) => shatter(A, t, x, y, 3) }),
  "M05+M10": (A) => A.TX(3, 380, 50).forEach(({ x, y }, i) => A.drop(x, { y, spr: "spear", el: "crystal", delay: i * 140, speed: 900, scale: 2, r: 30, m: 1.6, trailFx: "spark", trailEl: "lightning", land: (lx, gy) => (A.boom(lx, gy - 12, 34, 1.4, { st: { chill: 2 } }), A.bolt(lx, gy - 160, lx, gy, "lightning", 3, 200), A.fade(A.img("spear", lx, gy - 10, { el: "ice" }).setRotation(PI / 2), 1500, 900)) })),
  "M05+M11": (A) => { let n = 0; A.shot({ spr: "spear", speed: 560, scale: 1.6, pierce: 99, m: 1, st: { chill: 2 }, hit: (t, x, y) => n++ < 2 && A.chain(x, y, 4, { m: 0.6, el: "crystal", st: { chill: 1 }, each: (u, ux, uy) => shatter(A, u, ux, uy) }) }); },
  "M05+M12": (A) =>
    A.shot({ spr: "spear", speed: 540, scale: 1.6, m: 1, st: { chill: 2 }, end: (x, y) => {
      const s = A.img("spear", x, y, { el: "ice" }).setRotation(A.ang);
      A.turret(x, y, { spr: 0, dur: 3, every: 0.25, fn: (cx, cy, i) => { const a = Math.random() * 6.28; A.bolt(cx + Math.cos(a) * 50, cy + Math.sin(a) * 40, cx, cy, "lightning", 2, 150); A.flash(cx, cy, 10 + i * 2, "crystal"); },
        end: (cx, cy) => (s.destroy(), A.boom(cx, cy, 60, 2, { el: "crystal" }), A.radial(10, { spr: "shard", el: "crystal", x: cx, y: cy, speed: 380, life: 0.6, scale: 1.6, m: 0.5, st: { chill: 1 } })) });
    } }),
  "M05+M13": (A) => [-1, 1].forEach((s, i) => A.shot({ spr: "spear", el: "blizzard", delay: i * 100, ang: A.ang - s * 0.35, speed: 480, life: 1.3, pierce: 99, scale: 1.5, m: 1, st: { chill: 2 }, tick: (P, dt) => { const a = Math.atan2(P.vy, P.vx) + s * 1.1 * dt * A.d; P.vx = Math.cos(a) * P.speed; P.vy = Math.sin(a) * P.speed; }, drip: [0.15, (x, y) => A.cloud(x, y, 26, 2.5, { m: 0.08, st: { chill: 1 }, fx: "star", fxEl: "ice" })] })),
  "M05+M14": (A) => A.tornado(A.px + A.d * 24, { vx: 100, dur: 3, scale: 1.3, fx: "shard", fxEl: "ice", m: 0.35, st: { chill: 1 }, fn: (x, gy, ts) => ts.forEach((t) => { const s = Math.random() < 0.5 ? -1 : 1; A.shot({ spr: "spear", el: "ice", x: t.body.x + s * 30, y: t.body.y - t.body.h / 2, ang: s > 0 ? PI : 0, speed: 400, life: 0.15, scale: 1, m: 0.35, trail: 0, st: { chill: 1 } }); }) }),
  "M05+M15": (A) => (A.gust({ w: 60, m: 0.2, kb: 300, fx: "star", fxEl: "ice" }), A.shot({ spr: "spear", speed: 1300, life: 0.6, scale: 1.8, pierce: 99, m: 1.4, kb: 1100, st: { chill: 3 }, tick: (P) => A.puff("streak", P.x, P.y, 2, "wind"), hit: (t) => A.later(400, () => t.dead || A.st(t, { freeze: 2 })) })),
  "M05+M16": (A) => (A.updraft({ self: 0, m: 0.8, r: 70, up: 460, el: "ice", each: (t) => A.K.ent({ dur: 1.2, tk: 0, upd: (e, dt) => (e.tk -= dt) <= 0 && !t.dead && ((e.tk = 0.3), A.st(t, { chill: 1 }), A.puff("star", ...A.tp(t), 3, "ice")) }) }), A.spikeRing(A.px, 40, 6, { ice: 1, m: 0.6, up: 420, st: { chill: 2 } })),
  "M05+M17": (A) => A.roll({ spr: "rock", el: "permafrost", scale: 1.8, vx: 200, dur: 2.6, m: 0.8, fx: "shard", fxEl: "ice", st: { chill: 2 }, drip: [0.15, (x) => A.pool(x, 26, 4, { m: 0.05, el: "ice", fx: "star", fxEl: "ice", each: (t) => (t.kind !== "boss" && (t.body.vx += (Math.random() < 0.5 ? -1 : 1) * 260), A.st(t, { chill: 1, stun: 0.3 })) })] }),
  "M05+M18": (A) => A.spikes(A.px + A.d * 24, A.d, 7, { ice: 1, m: 0.8, st: { chill: 2 }, hit: (t) => A.encase(t, 2) }),
  "M05+M19": (A) => (A.crack(A.px, A.fy, 220, "ice", A.d), A.shake(5, 400), A.spikes(A.px + A.d * 20, A.d, 9, { ice: 1, gap: 22, step: 45, m: 0.8, s: 1.6, st: { chill: 2 } })),
  "M05+M20": (A) => A.TX(2, 320, 60).forEach(({ t, x }) => A.hand(x, { t, tint: 0xa0e0ff, m: 0.6, grab: 2, st: { chill: 3 }, then: (hx, gy, hs) => hs.forEach((u) => A.later(300, () => A.shot({ spr: "spear", el: "ice", ang: Math.atan2(u.body.y - u.body.h / 2 - A.p.cy, u.body.x - A.p.cx), speed: 600, scale: 1.6, pierce: 99, m: 1.3, st: { chill: 2 } }))) })),
  "M05+M21": (A) => A.shot({ spr: "spear", el: "frostbite", speed: 540, scale: 1.6, pierce: 99, m: 1.1, st: { frost: 1, poison: 2, chill: 2 }, tick: (P) => A.puff("drop", P.x, P.y, 1, "poison") }),
  "M05+M22": (A) => A.shot({ spr: "spear", el: "frostbite", speed: 540, scale: 1.6, m: 1.1, st: { chill: 2 }, end: (x, y) => (A.imp(x, y, 1), A.cloud(x, y, 70, 5, { m: 0.16, st: { poison: 1, chill: 1 }, fx: "star", fxEl: "ice" })) }),
  "M05+M23": (A) => (A.T(2, 300).forEach((t) => A.st(t, { rot: 0.3 })), A.later(150, () => A.shot({ spr: "spear", el: "frostbite", speed: 560, scale: 1.7, pierce: 99, m: 1.2, bonusSt: 0.3, st: { chill: 3, poison: 2, rot: 0.4 } }))),
  "M05+M24": (A) => A.shot({ spr: "spear", el: "frostbite", ang: A.d > 0 ? 0.25 : PI - 0.25, speed: 520, scale: 1.6, m: 1, st: { chill: 2 }, end: (x, y) => A.pool(x, 80, 7, { y, m: 0.15, slow: 1, st: { poison: 1, chill: 1 }, fx: "star", fxEl: "ice", each: (t) => Math.random() < 0.25 && A.st(t, { root: 0.8 }) }) }),
  "M05+M25": (A) => { let n = 0; A.shot({ spr: "spear", el: "aurora", speed: 560, scale: 1.8, pierce: 99, m: 1.2, life: 1.2, st: { chill: 2 }, tick: (P) => A.puff("star", P.x, P.y, 1, "light"), hit: () => n++, end: () => n > 0 && A.shield(0.06 * n, 8, "aurora") }); },
  "M05+M26": (A) => {
    A.heal(0.15);
    A.pillar(A.px, { delay: 0, warn: 0, w: 16, m: 0, el: "aurora", h: 200, snd: "heal" });
    const ts = A.T(4, 260);
    for (let i = 0; i < 4; i++) { const t = ts[i % Math.max(1, ts.length)]; A.shot({ spr: "spear", el: "aurora", delay: i * 80, ang: t ? Math.atan2(t.body.y - t.body.h / 2 - A.py, t.body.x - A.px) : -PI / 2 + (i - 1.5) * 0.5, speed: 520, scale: 1.4, pierce: 99, m: 0.9, st: { chill: 2 } }); }
  },
  "M05+M27": (A) => A.flashAll({ el: "aurora", stun: 1.5, m: 0.3, each: (t) => A.later(250 + Math.random() * 300, () => t.dead || A.shot({ spr: "spear", el: "ice", x: t.body.x - A.d * 80, y: t.body.y - t.body.h / 2 - 60, ang: Math.atan2(60, A.d * 80), speed: 600, life: 0.4, noTerrain: 1, pierce: 99, scale: 1.4, m: 1, st: { chill: 2 } })) }),
  "M05+M28": (A) => A.TX(4, 340, 45).forEach(({ x, y }, i) => A.drop(x, { y, spr: "wall", el: "aurora", delay: 200 + i * 130, speed: 800, scale: 1, r: 36, m: 1.4, ho: { st: { chill: 2 } }, then: (lx, gy) => {
    A.puff("shard", lx, gy - 30, 20, "ice");
    const s = A.img("shard", lx, gy - 20, { el: "aurora", add: 1, scale: 2 });
    A.sc.tweens.add({ targets: s, x: A.p.cx, y: A.p.cy, duration: 500, delay: 300, ease: "Quad.easeIn", onComplete: () => (s.destroy(), A.shield(0.05, 8, "aurora")) });
  } })),
  "M05+M29": (A) => A.fan(2, 0.3, { spr: "spear", el: "abyssice", speed: 420, homing: 5, life: 2.2, noTerrain: 1, scale: 1.6, m: 1.3, st: { chill: 3, raise: "wraith" }, tick: (P) => A.puff("dark", P.x, P.y, 1, "dark") }),
  "M05+M30": (A) => A.shot({ spr: "spear", el: "abyssice", speed: 540, scale: 1.7, pierce: 99, m: 1.4, drain: 0.1, st: { chill: 2, raise: "wraith" } }),
  "M05+M31": (A) => A.TX(3, 320, 50).forEach(({ t }, i) => { if (!t) return; A.st(t, { curse: 0.4, curseDur: 4 }); A.shot({ spr: "needle", el: "abyssice", delay: 200 + i * 80, ang: Math.atan2(t.body.y - t.body.h / 2 - A.py, t.body.x - A.px), speed: 640, scale: 1.6, homing: 6, m: 0.6, hit: (u) => (u === t ? A.encase(u, 4) : A.st(u, { chill: 2 })) }); }),
  "M05+M32": (A) => { const a = A.aim(110); A.vortex(a.x, a.y, { dur: 1.6, r: 140, m: 0.3, force: 1500, end: (x, y) => { const ts = A.K.tin(x, y, 60); A.boom(x, y, 50, 1.2, { el: "abyssice", kb: 0, up: 0 }); ts.forEach((t) => (A.encase(t, 3.5), A.st(t, { chill: 3 }))); A.fade(A.img("wall", x, y + 30, { el: "ice", alpha: 0.6, origin: [0.5, 1], depth: 31 }).setScale(2.4, 1.2), 3500, 2500); } }); },
};
export const _tgt = tgt;
