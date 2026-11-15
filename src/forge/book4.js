// 융합 마법 주문서 4 — 독침·독구름·부패·독 늪·빛의 창·치유·섬광·심판·그림자·흡혼·저주·어둠 계열
const PI = Math.PI;
const NDL = (o) => ({ spr: "needle", speed: 540, life: 0.9, scale: 1.4, m: 0.6, ...o });
const transmute = (A, t, m) => {
  const n = A.stCount(t);
  if (!n) return 0;
  A.hit(t, m * n, { kb: 0, noCrit: 1 });
  A.text(t.body.x, t.body.y - t.body.h - 16, `변성 ×${n}`, "#ffe080");
  return n;
};
const once = () => { const s = new Set(); return (t) => (s.has(t) ? !1 : (s.add(t), !0)); };

export const BOOK4 = {
  // ── 독침 ──
  "M21+M21": (A) => A.TX(3, 360, 50).forEach(({ x, y }, k) => { for (let i = 0; i < 3; i++) A.drop(x + (i - 1) * 16 + (Math.random() - 0.5) * 8, { y, spr: "needle", el: "poison", dx: -A.d * 40, h: 240, delay: k * 90 + i * 60, speed: 900, scale: 1.6, r: 14, warn: 0, glow: 0.6, land: (lx, gy) => (A.area(lx, gy - 10, 18, 0.6, { kb: 0, st: { poison: 3 } }), A.puff("drop", lx, gy - 4, 6, "poison")) }); }),
  "M21+M22": (A) => { const a = A.aim(100); const C = { x: a.x, y: a.y }; A.cloud(a.x, a.y, 80, 5, { m: 0.12, st: { poison: 1 }, frame: (z) => ((z.x = C.x), (z.y = C.y)) }); A.orbit(8, { spr: "needle", el: "poison", R: (e) => 40 + Math.sin(e.a * 2) * 25, dur: 5, spd: 6, scale: 1.2, m: 0.3, cd: 0.3, st: { poison: 1 }, center: () => { const t = A.T(1, 140, C.x, C.y)[0]; t && ((C.x += (t.body.x - C.x) * 0.03), (C.y += (t.body.y - t.body.h / 2 - C.y) * 0.03)); return C; } }); },
  "M21+M23": (A) => A.fan(3, 0.1, NDL({ el: "poison", st: { rot: 0.3, poison: 3 } })),
  "M21+M24": (A) => A.fan(3, 0.12, NDL({ el: "bog", ang: A.ang + A.d * 0.25, speed: 480, grav: 300, life: 1.2, st: { poison: 2 }, end: (x, y) => A.pool(x, 30, 5, { y, m: 0.12, slow: 1, el: "poison", st: { poison: 1 }, fx: "bubble", fxEl: "poison" }) })),
  "M21+M25": (A) => A.fan(3, 0.1, NDL({ el: "transmute", speed: 560, scale: 1.5, m: 0.7, bonusSt: 0.35, st: { gold: 1 }, hit: (t, x, y) => A.puff("star", x, y, 6, "light") })),
  "M21+M26": (A) => { const n = A.cleanse(); A.heal(0.08 + n * 0.03); A.text(A.px, A.fy - 40, "해독", "#c0ffa0"); A.fan(3, 0.1, NDL({ el: "transmute", st: { poison: 3 } })); },
  "M21+M27": (A) => A.fan(3, 0.1, NDL({ el: "transmute", m: 0.5, st: { poison: 1 }, hit: (t, x, y) => (A.flash(x, y, 40, "light", 260), A.rays(x, y, 40, "light"), A.area(x, y, 40, 0.5, { kb: 60, bonusSt: 0.6, st: { stun: 0.6 } })) })),
  "M21+M28": (A) => A.TX(4, 340, 45).forEach(({ x, y }, i) => A.pillar(x, { y, delay: 300 + i * 120, w: 14, m: 0.8, el: "transmute", then: (px, gy, ts) => ts.forEach((t) => transmute(A, t, 0.6) && ["burn", "poison", "chill", "bleed"].forEach((k) => t.statuses.clear?.(k))) })),
  "M21+M29": (A) => A.fan(3, 0.3, NDL({ el: "curse", speed: 380, homing: 7, life: 2, noTerrain: 1, scale: 1.6, m: 0.7, st: { poison: 2, maxhp: 0.15 } })),
  "M21+M30": (A) => A.T(3, 280).forEach((t) => (A.st(t, { poison: 2 }), A.hit(t, 1, { kb: 0, drain: 0.35, drainFx: 1, st: { maxhp: 0.12 } }))),
  "M21+M31": (A) => A.fan(3, 0.1, NDL({ el: "curse", scale: 1.5, m: 0.7, st: { maxhp: 0.2, poison: 2, curse: 0.3 } })),
  "M21+M32": (A) => { const a = A.aim(110); A.vortex(a.x, a.y, { dur: 2.4, r: 140, m: 0.2, force: 1400, el: "curse", every: 0.2, fn: (x, y) => A.shot(NDL({ el: "poison", x: x + (Math.random() - 0.5) * 80, y: y - 90, ang: PI / 2 + (Math.random() - 0.5) * 0.4, speed: 600, life: 0.3, scale: 1.3, m: 0.3, noTerrain: 1, st: { poison: 1, maxhp: 0.15 } })) }); },

  // ── 독구름 ──
  "M22+M22": (A) => { const a = A.aim(90); A.cloud(a.x, a.y, 140, 10, { m: 0.18, st: { poison: 1 } }); },
  "M22+M23": (A) => { const a = A.aim(90); A.cloud(a.x, a.y, 80, 6, { m: 0.15, st: { rot: 0.3, poison: 1 }, fx: "bubble", fxEl: "poison", each: (t) => A.st(t, { armor: Math.min(0.6, (t._frAc = (t._frAc || 0) + 0.04)) }) }); },
  "M22+M24": (A) => { const x = A.px + A.d * 70; A.pool(x, 90, 7, { m: 0.12, slow: 1, root: 1, st: { poison: 1 }, fx: "bubble", fxEl: "poison" }); A.cloud(x, A.gy(x) - 40, 90, 7, { m: 0.12, st: { poison: 1 } }); },
  "M22+M25": (A) => { const a = A.aim(90); A.cloud(a.x, a.y, 70, 5, { m: 0.14, st: { poison: 1 }, el: "transmute" }); A.later(400, () => A.shot({ spr: "spear", el: "transmute", speed: 620, pierce: 99, scale: 1.8, m: 1, hit: (t) => transmute(A, t, 0.5) })); },
  "M22+M26": (A) => A.cloud(A.px, A.py, 90, 6, { m: 0.08, el: "transmute", st: { poison: 1 }, heal: 0.012, fx: "star", fxEl: "light", each: (t) => A.hit(t, 0.12 * A.stCount(t), { kb: 0, noCrit: 1 }) }),
  "M22+M27": (A) => { const a = A.aim(90); A.cloud(a.x, a.y, 100, 7, { m: 0.15, el: "transmute", st: { poison: 1, gold: 1 }, fx: "star", fxEl: "light" }); A.flash(a.x, a.y, 60, "light"); },
  "M22+M28": (A) => { const a = A.aim(90); A.pillar(a.x, { gy: a.gy, delay: 200, w: 18, m: 1, el: "transmute" }); A.later(400, () => A.rep(20, 100, () => A.shot({ spr: "soft", el: "transmute", x: a.x + (Math.random() - 0.5) * 160, y: a.gy - 200, ang: PI / 2, speed: 420, life: 0.7, scale: 1, m: 0.15, st: { poison: 1 }, hit: (t) => A.stCount(t) > 1 && transmute(A, t, 0.15) }))); },
  "M22+M29": (A) => { const a = A.aim(90); A.cloud(a.x, a.y, 60, 7, { m: 0.15, el: "curse", st: { poison: 1, maxhp: 0.15 }, fx: "dark", fxEl: "dark", frame: (z, dt) => { const t = A.T(1, 260, z.x, z.y)[0]; t && ((z.x += Math.sign(t.body.x - z.x) * Math.min(70 * dt, Math.abs(t.body.x - z.x))), (z.y += (t.body.y - t.body.h / 2 - z.y) * dt * 2)); } }); },
  "M22+M30": (A) => { const a = A.aim(90); A.cloud(a.x, a.y, 90, 6, { m: 0.15, el: "curse", st: { poison: 1, maxhp: 0.1 }, tick: 0.6, each: (t) => A.hit(t, 0.12, { kb: 0, drain: 0.6, noCrit: 1 }), onTick: (z, ts) => ts.length && A.bolt(z.x, z.y, A.p.cx, A.p.cy, "curse", 1, 200) }); },
  "M22+M31": (A) => { const a = A.aim(90); const f = once(); A.cloud(a.x, a.y, 90, 6, { m: 0.15, el: "curse", st: { poison: 1, maxhp: 0.2 }, fx: "dark", fxEl: "dark", each: (t) => f(t) && A.st(t, { curse: 0.4 }) }); },
  "M22+M32": (A) => { const a = A.aim(100); A.cloud(a.x, a.y, 130, 2.5, { m: 0.12, el: "curse", st: { poison: 1 }, frame: (z, dt) => (z.r = Math.max(30, z.r - 40 * dt)) }); A.vortex(a.x, a.y, { dur: 2.5, r: 140, m: 0.2, force: 1300, el: "curse", end: (x, y) => (A.boom(x, y, 60, 1.6, { el: "curse", st: { poison: 4, curse: 0.5, maxhp: 0.2 } }), A.cloud(x, y, 50, 5, { m: 0.25, el: "curse", st: { poison: 2 } })) }); },

  // ── 부패 ──
  "M23+M23": (A) => A.T(2, 320).forEach((t) => { A.st(t, { rot: 0.6, armor: 0.6 }); A.hit(t, 1, { kb: 0 }); A.puff("bubble", ...A.tp(t), 16, "poison"); A.K.ent({ dur: 6, tk: 1, upd: (e, dt) => !t.dead && (e.tk -= dt) <= 0 && ((e.tk = 1), A.K.tin(...A.tp(t), 70).forEach((u) => u !== t && !(u._frRot > Date.now()) && (A.st(u, { rot: 0.6, armor: 0.6 }), A.bolt(...A.tp(t), ...A.tp(u), "poison", 1, 200)))) }); }),
  "M23+M24": (A) => A.pool(A.px + A.d * 60, 40, 8, { m: 0.14, slow: 1, st: { poison: 1 }, fx: "bubble", fxEl: "poison", frame: (z, dt) => (z.r = Math.min(150, z.r + 14 * dt)), each: (t) => t._frRot > Date.now() || A.st(t, { rot: 0.3 }) }),
  "M23+M25": (A) => { A.T(2, 300).forEach((t) => A.st(t, { rot: 0.3 })); A.later(150, () => A.shot({ spr: "spear", el: "transmute", speed: 600, pierce: 99, scale: 1.8, m: 1.2, hit: (t, x, y) => { if (!(t._frRot > Date.now())) return; t._frRot = 0; A.hit(t, 1.5, { kb: 0, st: { gold: 1 } }); A.text(x, y - 20, "황금 변성", "#ffe080"); A.puff("star", x, y, 14, "light"); A.sc.dropGold?.(x, y, 6); } })); },
  "M23+M26": (A) => A.T(3, 320).forEach((t, i) => A.later(i * 120, () => { if (t.dead) return; const [x, y] = A.tp(t); const n = A.stCount(t); A.pillar(x, { y: t.body.y - 8, delay: 0, warn: 0, w: 10, h: 160, m: 0, el: "transmute", snd: "magic" }); A.hit(t, 0.8 + 0.6 * n, { kb: 0, st: { gold: 1 } }); n && A.text(x, y - 24, `변성 ×${n}`, "#ffe080"); })),
  "M23+M27": (A) => A.flashAll({ el: "transmute", stun: 1, m: 0.4, each: (t) => { const n = A.stCount(t); for (let k = 0; k < n; k++) A.later(120 + k * 120, () => t.dead || A.boom(...A.tp(t), 24, 0.5, { el: "transmute", snd: "hit" })); } }),
  "M23+M28": (A) => A.T(3, 340).forEach((t, i) => (A.st(t, { rot: 0.3 }), A.pillar(t.body.x, { y: t.body.y - 8, delay: 400 + i * 120, w: 15, m: 0.8, el: "transmute", then: (x, gy, ts) => ts.forEach((u) => transmute(A, u, 0.5)) }))),
  "M23+M29": (A) => A.fan(2, 0.4, { spr: "wraith", el: "curse", speed: 220, homing: 5, life: 2.6, noTerrain: 1, scale: 1.2, m: 1, st: { rot: 0.3, curse: 0.4 } }),
  "M23+M30": (A) => A.T(2, 300).forEach((t) => (A.st(t, { rot: 0.3, maxhp: 0.15 }), A.rep(3, 300, () => t.dead || A.hit(t, 0.6, { kb: 0, drain: 0.4, drainFx: 1 })))),
  "M23+M31": (A) => A.T(2, 320).forEach((t) => { A.st(t, { rot: 0.3, armor: 0.4, curse: 0.4, maxhp: 0.15 }); A.hit(t, 0.8, { kb: 0 }); const [x, y] = A.tp(t); A.ring(x, y, 30, "curse"); A.ring(x, y, 40, "poison", 500); }),
  "M23+M32": (A) => { const a = A.aim(110); A.vortex(a.x, a.y, { dur: 3, r: 140, m: 0.25, force: 1300, el: "curse", every: 0.6, fn: (x, y, ts) => { for (let i = 0; i < ts.length; i++) { const n = ts[(i + 1) % ts.length]; n !== ts[i] && A.bolt(...A.tp(ts[i]), ...A.tp(n), "poison", 1, 200); A.st(ts[i], { rot: 0.3, maxhp: 0.15, poison: 1 }); } } }); },

  // ── 독 늪 ──
  "M24+M24": (A) => A.pool(A.px + A.d * 60, 200, 8, { m: 0.12, slow: 1, st: { poison: 1 }, fx: "bubble", fxEl: "poison", each: (t) => (t.kind !== "boss" && (t.body.vx *= 0.1), A.st(t, { chill: 1 })) }),
  "M24+M25": (A) => { const x = A.px + A.d * 70; A.pool(x, 90, 8, { m: 0.12, slow: 1, st: { poison: 1 }, fx: "bubble", fxEl: "poison" }); A.later(500, () => A.drop(x, { spr: "spear", el: "transmute", dx: 0, speed: 900, scale: 2, r: 30, m: 1, land: (lx, gy) => (A.boom(lx, gy - 10, 40, 1, { el: "transmute" }), A.pool(lx, 90, 7.5, { m: 0, el: "transmute", fx: "star", fxEl: "light", tick: 0.6, each: (t) => transmute(A, t, 0.15) })) })); },
  "M24+M26": (A) => A.pool(A.px, 100, 8, { m: 0.14, slow: 1, st: { poison: 1 }, heal: 0.012, fx: "bubble", fxEl: "poison", frame: (z, dt) => Math.random() < dt * 6 && A.puff("star", A.p.cx, A.p.body.y - 4, 1, "light") }),
  "M24+M27": (A) => A.pool(A.px + A.d * 60, 100, 8, { m: 0.14, slow: 1, el: "transmute", st: { poison: 1, gold: 1 }, fx: "star", fxEl: "light" }),
  "M24+M28": (A) => { const x = A.px + A.d * 70; A.pool(x, 110, 8, { m: 0.1, slow: 1, st: { poison: 1 }, fx: "bubble", fxEl: "poison", tick: 0.6, each: (t) => transmute(A, t, 0.12) }); [-100, -40, 40, 100].forEach((dx, i) => (A.pillar(x + dx, { delay: 200 + i * 100, w: 10, m: 0.8, el: "transmute" }), A.fade(A.img("glow", x + dx, A.gy(x + dx) - 60, { add: 1, el: "transmute", alpha: 0.4 }).setScale(0.35, 3), 8000, 7000))); },
  "M24+M29": (A) => { const x = A.px + A.d * 60; A.pool(x, 90, 7, { m: 0.12, slow: 1, st: { poison: 1 }, fx: "bubble", fxEl: "poison" }); A.rep(5, 1000, () => A.shot({ spr: "wraith", el: "curse", x: x + (Math.random() - 0.5) * 120, y: A.gy(x) - 8, ang: -PI / 2, speed: 150, homing: 5, life: 3, noTerrain: 1, scale: 1.2, m: 0.7, st: { maxhp: 0.12 } })); },
  "M24+M30": (A) => A.pool(A.px + A.d * 60, 100, 7, { m: 0.12, slow: 1, st: { poison: 1 }, fx: "wisp", fxEl: "dark", tick: 0.7, each: (t) => A.hit(t, 0.15, { kb: 0, drain: 0.6, noCrit: 1 }), onTick: (z, ts) => ts.length && A.bolt(z.x, z.y - 4, A.p.cx, A.p.cy, "curse", 1, 200) }),
  "M24+M31": (A) => { const f = once(); A.pool(A.px + A.d * 60, 100, 7, { m: 0.12, slow: 1, el: "curse", st: { poison: 1, maxhp: 0.15 }, fx: "dark", fxEl: "dark", each: (t) => f(t) && A.st(t, { curse: 0.4 }) }); },
  "M24+M32": (A) => { const x = A.px + A.d * 70, gy = A.gy(x); A.pool(x, 110, 5, { m: 0.12, slow: 1, st: { poison: 1 }, fx: "bubble", fxEl: "poison" }); A.crack(x, gy, 60, "bog"); A.vortex(x, gy - 6, { dur: 4, r: 150, m: 0.3, force: 1200, el: "curse", st: { maxhp: 0.15 }, each: (t) => A.st(t, { root: 0.4 }) }); },

  // ── 빛의 창 ──
  "M25+M25": (A) => A.shot({ spr: "spear", speed: 620, life: 1.1, pierce: 99, noTerrain: 1, scale: 4, r: 22, glow: 4, m: 2.6, undead: 3, tick: (P) => (A.puff("star", P.x, P.y, 2), Math.random() < 0.2 && A.rays(P.x, P.y, 30, void 0, 6)), end: (x, y) => A.boom(x, y, 60, 1.4) }),
  "M25+M26": (A) => A.shot({ spr: "spear", speed: 580, life: 1.2, pierce: 99, scale: 1.8, m: 1.3, undead: 2, hit: () => (A.healAmt(A.p.maxHp * 0.04), A.puff("star", A.p.cx, A.p.cy, 5, "light")) }),
  "M25+M27": (A) => A.shot({ spr: "spear", speed: 580, scale: 1.8, m: 1.4, undead: 2, end: (x, y) => A.flashAll({ x, y, r: 110, stun: 1.6, m: 0.6, ms: 160 }) }),
  "M25+M28": (A) => A.TX(8, 380, 30).forEach(({ x, y }, i) => A.drop(x + (Math.random() - 0.5) * 10, { y, spr: "spear", dx: 0, delay: i * 90, speed: 1000, scale: 2, r: 26, m: 1.2, ho: { undead: 2 }, then: (lx, gy) => (A.rays(lx, gy - 10, 40), A.fade(A.img("spear", lx, gy - 14, { add: 1 }).setRotation(PI / 2), 900, 300)) })),
  "M25+M29": (A) => A.shot({ spr: "spear", el: "void", speed: 600, life: 1.2, pierce: 99, scale: 2, m: 1.6, true: 1, undead: 2, tick: (P) => (A.puff("star", P.x, P.y, 1, "light"), A.puff("dark", P.x, P.y, 1, "dark")) }),
  "M25+M30": (A) => A.shot({ spr: "spear", el: "void", speed: 600, life: 1.2, pierce: 99, scale: 2, m: 1.4, true: 1, drain: 0.35, drainFx: 1 }),
  "M25+M31": (A) => A.shot({ spr: "spear", el: "void", speed: 600, life: 1.2, pierce: 99, scale: 2, m: 1.3, true: 1, st: { void: 10 } }),
  "M25+M32": (A) => { const a = A.aim(130); A.vortex(a.x, a.y, { dur: 1.4, r: 150, m: 0.2, force: 1600, el: "void", end: (x, y) => (A.shot({ spr: "spear", el: "void", x: x - A.d * 160, y, ang: A.d > 0 ? 0 : PI, speed: 900, life: 0.6, pierce: 99, noTerrain: 1, scale: 3, r: 16, glow: 3, m: 3, true: 1 }), A.cam(80, 240, 230, 255)) }); },

  // ── 치유의 빛 ──
  "M26+M26": (A) => (A.heal(0.4), A.pillar(A.px, { delay: 0, warn: 0, w: 24, m: 0, el: "light", snd: "heal" }), A.ring(A.px, A.fy - 4, 140, "light", 600), A.K.tin(A.px, A.py, 140).forEach((t) => A.st(t, { mark: 2 }))),
  "M26+M27": (A) => { const ts = A.flashAll({ el: "light", stun: 1.5, m: 0.5 }); A.heal(0.05 + 0.04 * ts.length); },
  "M26+M28": (A) => A.pillar(A.px, { delay: 200, w: 20, m: 1, el: "light", then: (px, gy) => (A.pool(px, 40, 8, { y: gy - 8, m: 0, heal: 0.02, fx: "star", fxEl: "light" }), A.fade(A.img("glow", px, gy - 80, { add: 1, el: "light", alpha: 0.35 }).setScale(0.6, 4), 8000, 7000)) }),
  "M26+M29": (A) => A.fan(2, 0.4, { spr: "orb", el: "void", speed: 220, homing: 3, life: 2.6, noTerrain: 1, scale: 1.4, spin: 6, m: 1.2, true: 1, onDmg: (t, dm) => (A.healAmt(dm), A.puff("star", A.p.cx, A.p.cy, 4, "light")) }),
  "M26+M30": (A) => A.T(2, 280).forEach((t) => A.hit(t, 1.4, { kb: 0, true: 1, drain: 0.6, drainFx: 1 })),
  "M26+M31": (A) => { const n = A.cleanse(); A.pillar(A.px, { delay: 0, warn: 0, w: 18, m: 0, el: "void", snd: "heal" }); A.T(Math.max(1, n), 260).forEach((t) => (A.st(t, { void: 8 }), A.hit(t, 0.6, { kb: 0, true: 1 }))); A.text(A.px, A.fy - 44, `정화 ${n}`, "#e0d0ff"); },
  "M26+M32": (A) => { const a = A.aim(100); A.vortex(a.x, a.y, { dur: 3, r: 140, m: 0.35, true: 1, force: 1200, el: "void", coreCol: 0x302040, onDmg: (t, dm) => A.healAmt(dm * 0.5) }); },

  // ── 섬광 ──
  "M27+M27": (A) => (A.flashAll({ stun: 3, m: 0.5 }), A.later(500, () => A.flashAll({ stun: 3, m: 0.5 }))),
  "M27+M28": (A) => A.flashAll({ stun: 1.6, m: 0.4 }).slice(0, 8).forEach((t, i) => A.pillar(t.body.x, { y: t.body.y - 8, delay: 300 + i * 90, w: 14, m: 1.6, undead: 2 })),
  "M27+M29": (A) => A.fan(2, 0.4, { spr: "orb", el: "void", speed: 240, homing: 3, life: 2.6, noTerrain: 1, scale: 1.4, m: 0.4, end: (x, y) => (A.flash(x, y, 70, "light", 300), A.rays(x, y, 70, "light", 14), A.area(x, y, 70, 1.6, { kb: 120, true: 1, st: { stun: 1 } })) }),
  "M27+M30": (A) => A.flashAll({ el: "void", stun: 1.2, m: 0.5, true: 1, drain: 0.3, each: (t) => A.bolt(...A.tp(t), A.p.cx, A.p.cy, "void", 1, 260) }),
  "M27+M31": (A) => A.flashAll({ el: "void", stun: 1.2, m: 0.4, st: { void: 8 } }),
  "M27+M32": (A) => { const x = A.px + A.d * 60, y = A.py - 20; A.dark(1400, 0.75); A.vortex(x, y, { dur: 1.5, r: 180, m: 0, force: 1500, el: "void", core: 14, end: (vx, vy) => (A.flashAll({ x: vx, y: vy, r: 140, stun: 1.2, m: 0 }), A.area(vx, vy, 140, 3, { kb: 240, true: 1 }), A.ring(vx, vy, 160, "light", 600)) }); },

  // ── 심판의 기둥 ──
  "M28+M28": (A) => { const cam = A.sc.cameras.main; const ts = A.screen(); for (let i = 0; i < 9; i++) { const t = ts[i]; A.pillar(t ? t.body.x : cam.scrollX + 40 + i * 70, { y: t ? t.body.y - 8 : void 0, delay: 300 + i * 100, w: 15, m: 1.6, undead: 2 }); } },
  "M28+M29": (A) => A.TX(4, 360, 45).forEach(({ x, y }, i) => A.pillar(x, { y, delay: 300 + i * 120, w: 15, m: 1.6, el: "void", true: 1, fx: "dark" })),
  "M28+M30": (A) => A.TX(4, 360, 45).forEach(({ x, y }, i) => A.pillar(x, { y, delay: 300 + i * 120, w: 14, m: 1.3, el: "void", drain: 0.25, then: (px, gy, ts) => ts.forEach(() => A.bolt(px, gy - 200, A.p.cx, A.p.cy, "void", 1, 240)) })),
  "M28+M31": (A) => A.T(4, 360).forEach((t, i) => (A.st(t, { curse: 0.4 }), A.pillar(t.body.x, { y: t.body.y - 8, delay: 400 + i * 120, w: 15, m: 1.8, el: "void", true: 1 }))),
  "M28+M32": (A) => {
    const a = A.aim(120), gx = a.x, gyy = a.y - 10;
    const g = A.img("vx_ring", gx, gyy, { add: 1, el: "void", alpha: 0.9 }).setScale(0.9, 1.8);
    const g2 = A.img("glow", gx, gyy, { add: 1, el: "void", alpha: 0.6 }).setScale(1.2, 2.4);
    A.vortex(gx, gyy, { dur: 3, r: 200, m: 0.5, true: 1, force: 1700, hs: 0, frame: () => { g.setRotation(Math.sin(A.sc.time.now / 200) * 0.1); g2.setAlpha(0.4 + Math.random() * 0.3); for (const q of A.sc.projectiles.list) q.active && q.owner === "enemy" && Math.abs(q.x - gx) < 200 && A.sc.projectiles.kill(q); }, end: (x, y) => (g.destroy(), g2.destroy(), A.boom(x, y, 80, 2.4, { el: "void", true: 1, cam: 1 })) });
  },

  // ── 그림자 구체 ──
  "M29+M29": (A) => { const ts = A.T(5, 400); for (let i = 0; i < 5; i++) { const t = ts[i % Math.max(1, ts.length)]; A.shot({ spr: "orb", delay: i * 60, ang: A.ang + (i - 2) * 0.3, speed: 240, life: 3, noTerrain: 1, scale: 1.3, spin: 6, m: 1, tick: (P, dt) => { if (!t || t.dead) return; const w = Math.atan2(t.body.y - t.body.h / 2 - P.y, t.body.x - P.x); let a = Math.atan2(P.vy, P.vx), df = w - a; while (df > PI) df -= 2 * PI; while (df < -PI) df += 2 * PI; a += Math.max(-4 * dt, Math.min(4 * dt, df)); P.vx = Math.cos(a) * P.speed; P.vy = Math.sin(a) * P.speed; }, end: (x, y) => A.implode(x, y, 30) }); } },
  "M29+M30": (A) => A.fan(2, 0.4, { spr: "orb", el: "dark", speed: 240, homing: 4, life: 2.6, noTerrain: 1, scale: 1.4, m: 1.3, onDmg: (t, dm) => { const s = A.img("glow", ...A.tp(t), { add: 1, el: "dark", shade: 1, scale: 0.6 }); A.sc.tweens.add({ targets: s, x: A.p.cx, y: A.p.cy, duration: 500, ease: "Quad.easeIn", onComplete: () => (s.destroy(), A.healAmt(dm * 0.5), A.puff("wisp", A.p.cx, A.p.cy, 8, "dark")) }); } }),
  "M29+M31": (A) => { const seen = new Set(); const go = (x, y, t, n) => { if (!t || n <= 0) return; A.shot({ spr: "orb", el: "curse", x, y, ang: Math.atan2(t.body.y - t.body.h / 2 - y, t.body.x - x), speed: 280, homing: 8, life: 2, noTerrain: 1, scale: 1.3, spin: 6, m: 0.9, st: { curse: 0.4 }, hit: (u, hx, hy) => (seen.add(u), A.later(150, () => go(hx, hy, A.T(1, 240, hx, hy, seen)[0], n - 1))) }); }; const t0 = A.T(1, 380)[0]; t0 ? go(A.hx, A.hy, t0, 5) : A.shot({ spr: "orb", el: "curse", speed: 240, life: 2, scale: 1.3, m: 1 }); },
  "M29+M32": (A) => A.shot({ spr: "orb", speed: 240, homing: 2, life: 1.2, noTerrain: 1, scale: 1.5, spin: 6, m: 0.8, end: (x, y) => A.vortex(x, y, { dur: 3, r: 130, m: 0.4, force: 1200 }) }),

  // ── 흡혼·저주·어둠 ──
  "M30+M30": (A) => A.T(3, 280).forEach((t) => (A.hit(t, 1.5, { kb: 0, drain: 0.6, drainFx: 1 }), A.puff("wisp", ...A.tp(t), 10))),
  "M30+M31": (A) => A.T(2, 280).forEach((t) => (A.st(t, { curse: 0.4 }), A.hit(t, 1.5, { kb: 0, drain: 0.6, drainFx: 1 }))),
  "M30+M32": (A) => { const a = A.aim(100); A.vortex(a.x, a.y, { dur: 3, r: 140, m: 0.4, force: 1300, drain: 0.5, fn: (x, y, ts) => ts.length && A.bolt(x, y, A.p.cx, A.p.cy, "dark", 2, 260) }); },
  "M31+M31": (A) => A.T(3, 340).forEach((t) => { A.st(t, { curse: 0.8, curseDur: 20 }); const [x, y] = A.tp(t); A.ring(x, y, 40, "dark", 500); A.puff("dark", x, y, 14, "dark"); }),
  "M31+M32": (A) => { const t = A.T(1, 340)[0]; if (!t) return; A.st(t, { curse: 0.4 }); const [x, y] = A.tp(t); const f = once(); A.later(300, () => A.vortex(t.dead ? x : t.body.x, t.dead ? y : t.body.y - t.body.h / 2, { dur: 3, r: 140, m: 0.4, force: 1300, each: (u) => f(u) && A.st(u, { curse: 0.3 }) })); },
  "M32+M32": (A) => { const a = A.aim(140); A.vortex(a.x, a.y, { dur: 6, r: 320, hr: 60, core: 16, m: 0.5, force: 1400, hs: 1.8 }); },
};
