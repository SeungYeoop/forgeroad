// 융합 마법 주문서 3 — 바람 칼날·회오리·돌풍·상승 기류·바위·가시·지진·대지의 손 계열
const PI = Math.PI;
const tailwind = (A) => (x, y) => A.pool(x, 22, 5, { y, m: 0, fx: "leaf", fxEl: "wind", frame: (z) => Math.abs(A.p.cx - z.x) < z.r && Math.abs(A.p.body.y - z.y) < 30 && !A.p._frTw && ((A.p._frTw = 1), A.haste(1.2, 0.4), A.later(1000, () => (A.p._frTw = 0))) });
const BL = (o) => ({ spr: "blade", speed: 560, life: 0.8, pierce: 3, scale: 1.4, noTerrain: 1, m: 1, ...o });
const lob = (A) => (A.d > 0 ? -0.4 : PI + 0.4);
const cen = (T0, A, dy = 34) => () => ({ x: T0.x, y: (T0.gy ?? A.fy) - dy });

export const BOOK3 = {
  // ── 바람 칼날 ──
  "M13+M13": (A) => A.fan(5, 0.16, BL({ m: 1.1 })),
  "M13+M14": (A) => A.tornado(A.px + A.d * 24, { vx: 100, dur: 3, scale: 1.3, m: 0.4, fn: (x, gy) => { for (let k = 0; k < 3; k++) A.shot(BL({ x, y: gy - 20 - Math.random() * 40, ang: Math.random() * 6.28, speed: 420, life: 0.6, pierce: 2, scale: 1.1, m: 0.45 })); } }),
  "M13+M15": (A) => (A.gust({ w: 120, m: 0.5 }), A.fan(2, 0, BL({ seq: 100, speed: 640, pierce: 4, scale: 1.6, kb: 700, up: 160 }))),
  "M13+M16": (A) => { A.rep(3, 90, (i) => A.shot(BL({ x: A.px + A.d * (10 + i * 24), y: A.fy - 4, ang: -PI / 2, speed: 520, pierce: 5, scale: 1.6, up: 300 }))); A.updraft({ self: 0, m: 0, r: 10 }); },
  "M13+M17": (A) => A.fan(2, 0.06, BL({ el: "sandstorm", seq: 110, speed: 520, scale: 1.5, m: 1.1, st: { blind: 3 }, tick: (P) => A.puff("rock", P.x, P.y, 1, "earth") })),
  "M13+M18": (A) => A.fan(2, 0, BL({ el: "sandstorm", seq: 110, speed: 440, life: 0.9, y: A.fy - 14, drip: [0.08, (x, y) => A.spikes(x, 1, 1, { el: "sandstorm", y, s: 1, m: 0.4, st: { blind: 3 } })] })),
  "M13+M19": (A) => (A.shot(BL({ el: "sandstorm", y: A.fy - 12, speed: 420, life: 1, pierce: 99, scale: 2, m: 1.3, st: { blind: 2 }, drip: [0.05, (x, y) => (A.puff("smoke", x, y + 8, 3, "earth"), A.puff("rock", x, y + 8, 1, "earth"))] })), A.crack(A.px, A.fy, 300, "sandstorm", A.d), A.shake(3)),
  "M13+M20": (A) => A.TX(3, 300, 50).forEach(({ t, x }) => A.hand(x, { t, el: "sandstorm", m: 1, grab: 1, st: { blind: 3 }, fx: "smoke", then: (hx, gy) => (A.slash(hx, gy - 20, 22, -2.4, -0.6, "sandstorm", 6, 200), A.slash(hx, gy - 20, 22, -2.6, -0.4, "sandstorm", 6, 240)) })),
  "M13+M21": (A) => A.fan(2, 0, BL({ el: "miasma", seq: 110, st: { poison: 2 }, hit: (t, x, y) => (A.ring(x, y, 60, "poison"), A.area(x, y, 60, 0.15, { kb: 0, st: { poison: 1 } }), A.puff("mist", x, y, 10, "poison")) })),
  "M13+M22": (A) => { const a = A.aim(90); A.cloud(a.x, a.y, 50, 1, { m: 0.1, el: "poison", st: { poison: 1 } }); A.later(400, () => A.fan(3, 0.25, BL({ el: "miasma", x: a.x - A.d * 40, y: a.y, speed: 420, life: 0.9, pierce: 4, scale: 1.3, m: 0.8, st: { poison: 1 }, drip: [0.15, (x, y) => A.cloud(x, y, 30, 3, { m: 0.1, el: "poison", st: { poison: 1 } })] }))); },
  "M13+M23": (A) => A.fan(2, 0, BL({ el: "miasma", seq: 110, st: { rot: 0.3, poison: 2 }, hit: (t, x, y) => A.mover({ x, y, vx: 120, dur: 1, r: 26, m: 0.1, fx: "mist", fxEl: "poison", dens: 3, kb: 0, st: { poison: 1 } }) })),
  "M13+M24": (A) => { const x = A.px + A.d * 40; A.pool(x, 70, 6, { m: 0.14, slow: 1, el: "poison", st: { poison: 1 }, fx: "bubble", fxEl: "poison" }); A.later(300, () => { A.fan(2, 0, BL({ el: "miasma", y: A.fy - 14, seq: 120, speed: 520, life: 0.9, pierce: 4, m: 0.9, st: { poison: 1 } })); A.mover({ x, y: A.fy - 20, vx: 200, dur: 1.4, r: 50, m: 0.2, fx: "mist", fxEl: "poison", dens: 8, kb: 60, st: { poison: 1.5 } }); }); },
  "M13+M25": (A) => A.shot({ spr: "spear", el: "divinewind", speed: 620, life: 1, pierce: 99, scale: 1.6, m: 1.2, undead: 2, drip: [0.08, tailwind(A)] }),
  "M13+M26": (A) => (A.heal(0.15), A.haste(5, 0.3), A.spiral(A.px, A.py, 60, "divinewind"), A.gust({ w: 90, m: 0.4, kb: 200 })),
  "M13+M27": (A) => (A.fan(2, 0, BL({ el: "divinewind", seq: 100, speed: 600, scale: 1.5, st: { stun: 1.2 }, hit: (t, x, y) => A.flash(x, y, 30, "light") })), A.haste(2, 0.5)),
  "M13+M28": (A) => { const x = A.px; [50, 170].forEach((dx, i) => A.pillar(x + A.d * dx, { delay: 200 + i * 100, w: 13, m: 1, el: "divinewind" })); A.later(400, () => A.rep(4, 120, () => A.shot(BL({ el: "divinewind", x: x + A.d * 50, y: A.fy - 14 - Math.random() * 40, ang: A.d > 0 ? 0 : PI, speed: 500, life: 0.25, pierce: 5, scale: 1.3, m: 0.6 })))); A.haste(5, 0.3); },
  "M13+M29": (A) => { A.dark(500, 0.35); A.rays(A.px, A.py, 160, "wraithwind", 14); A.ring(A.px, A.py, 200, "wraithwind", 600); for (let i = 0; i < 12; i++) A.shot({ spr: "wraith", el: "dark", x: A.px, y: A.py, ang: (i * PI) / 6, speed: 200, life: 1, m: 0, scale: 1, noTerrain: 1 }); A.screen().forEach((t) => (A.hit(t, 0.4, { kb: 0 }), A.fear(t, 3))); A.snd("magic"); },
  "M13+M30": (A) => A.fan(2, 0.05, BL({ el: "wraithwind", seq: 110, st: { fear: 2 }, drain: 0.3, drainFx: 1 })),
  "M13+M31": (A) => A.fan(2, 0.05, BL({ el: "wraithwind", seq: 110, st: { curse: 0.4, fear: 2.5 } })),
  "M13+M32": (A) => { const a = A.aim(110); const C = { x: a.x, y: a.y }; A.vortex(a.x, a.y, { dur: 3, r: 140, m: 0.25, force: 1300, el: "wraithwind" }); A.orbit(5, { spr: "blade", el: "wraithwind", R: 36, dur: 3, spd: 6, scale: 1.2, m: 0.4, cd: 0.25, center: () => C }); },

  // ── 회오리 ──
  "M14+M14": (A) => A.tornado(A.px + A.d * 30, { vx: 170, dur: 4, scale: 2, force: 1800, m: 0.55 }),
  "M14+M15": (A) => (A.gust({ w: 80, m: 0.3 }), A.tornado(A.px + A.d * 20, { vx: 330, dur: 2, scale: 1.4, force: 2000, m: 0.45, each: (t, e) => t.kind !== "boss" && (t.body.x += (e.x - t.body.x) * 0.3) })),
  "M14+M16": (A) => A.tornado(A.px + A.d * 40, { vx: 60, dur: 2.6, scale: 1.3, hgrow: 1.2, force: 1400, lift: -500, m: 0.4, end: (x, gy) => A.K.trect(x - 60, x + 60, gy - 400, gy).forEach((t) => ((t.body.vy = 700), A.later(300, () => t.dead || A.hit(t, 1.4, { kb: 80, heavy: 1 })))) }),
  "M14+M17": (A) => { const T0 = A.tornado(A.px + A.d * 24, { vx: 90, dur: 3, scale: 1.3, el: "sandstorm", fx: "rock", fxEl: "earth", m: 0.4 }); A.orbit(4, { spr: "rock", el: "earth", R: 28, dur: 3, spd: 7, scale: 0.9, m: 0.4, cd: 0.3, center: cen(T0, A) }); },
  "M14+M18": (A) => A.tornado(A.px + A.d * 24, { vx: 90, dur: 3, scale: 1.3, el: "sandstorm", fx: "smoke", fxEl: "earth", m: 0.35, st: { blind: 2 }, every: 0.35, fn: (x, gy) => A.spikes(x + (Math.random() - 0.5) * 30, 1, 1, { el: "sandstorm", y: gy - 8, m: 0.4, st: { blind: 3 } }) }),
  "M14+M19": (A) => { const T0 = A.tornado(A.px + A.d * 30, { vx: 60, dur: 4, scale: 1.6, el: "sandstorm", fx: "smoke", fxEl: "earth", m: 0.35, st: { blind: 3 } }); A.cloud(A.px + A.d * 30, A.py - 20, 110, 4, { m: 0, el: "earth", fx: "smoke", fxEl: "earth", st: { blind: 2 }, frame: (z) => (z.x = T0.x) }); },
  "M14+M20": (A) => { const T0 = A.tornado(A.px + A.d * 40, { vx: 40, dur: 4, scale: 1.4, el: "sandstorm", fx: "smoke", fxEl: "earth", m: 0.4 }); A.T(3, 260).forEach((t, i) => A.later(i * 150, () => A.hand(t.body.x, { t, el: "sandstorm", m: 0.5, grab: 0.5, then: (hx, gy, hs) => hs.forEach((u) => (u.kind !== "boss" && (u.body.x = T0.x), A.st(u, { root: 3, blind: 3 }))) }))); },
  "M14+M21": (A) => { const T0 = A.tornado(A.px + A.d * 24, { vx: 90, dur: 3, scale: 1.3, el: "miasma", m: 0.3, st: { poison: 1 } }); A.orbit(6, { spr: "needle", el: "poison", R: 30, dur: 3, spd: 8, scale: 1.2, m: 0.25, cd: 0.2, st: { poison: 1 }, center: cen(T0, A, 30) }); },
  "M14+M22": (A) => A.tornado(A.px + A.d * 24, { vx: 100, dur: 3.5, scale: 1.4, el: "miasma", fx: "mist", fxEl: "poison", m: 0.35, st: { poison: 1 }, every: 0.5, fn: (x, gy) => { A.cloud(x, gy - 30, 36, 3, { m: 0.1, el: "poison", st: { poison: 1 } }); for (let k = 0; k < 3; k++) A.shot({ spr: "soft", el: "poison", x, y: gy - 40, ang: Math.random() * 6.28, speed: 200, life: 0.6, scale: 1.4, m: 0.2, st: { poison: 1 } }); } }),
  "M14+M23": (A) => A.tornado(A.px + A.d * 24, { vx: 90, dur: 3.2, scale: 1.4, el: "miasma", fx: "bubble", fxEl: "poison", m: 0.4, st: { armor: 0.4, rot: 0.25, poison: 1 }, each: (t) => Math.random() < 0.2 && A.area(t.body.x, t.body.y - 10, 50, 0.08, { kb: 0, st: { poison: 1 } }) }),
  "M14+M24": (A) => { const x = A.px + A.d * 60; A.pool(x, 70, 6, { m: 0.12, slow: 1, el: "poison", st: { poison: 1 }, fx: "bubble", fxEl: "poison" }); A.tornado(x, { vx: 0, dur: 4, scale: 1.4, el: "bog", fx: "drop", fxEl: "poison", m: 0.35, st: { poison: 1 }, every: 0.3, fn: (tx, gy) => { for (let k = 0; k < 3; k++) A.shot({ spr: "soft", el: "bog", x: tx, y: gy - 50, ang: -PI / 2 + (Math.random() - 0.5) * 2.4, speed: 200 + Math.random() * 80, grav: 500, life: 1.2, scale: 1.4, m: 0.2, st: { poison: 1 }, end: (ex, ey) => A.puff("drop", ex, ey, 4, "poison") }); } }); },
  "M14+M25": (A) => { const T0 = A.tornado(A.px + A.d * 24, { vx: 90, dur: 3.2, scale: 1.4, el: "divinewind", m: 0.35 }); A.orbit(3, { spr: "spear", el: "light", R: 30, dur: 3.2, spd: 6, scale: 1.2, m: 0.5, cd: 0.3, undead: 2, center: cen(T0, A) }); A.haste(5, 0.3); },
  "M14+M26": (A) => (A.tornado(A.px, { follow: 1, dur: 4, scale: 1.2, el: "divinewind", fx: "star", fxEl: "light", force: 0, m: 0.3, every: 0.5, fn: () => A.healAmt(A.p.maxHp * 0.015) }), A.haste(4, 0.35)),
  "M14+M27": (A) => A.tornado(A.px + A.d * 24, { vx: 100, dur: 2.8, scale: 1.3, el: "divinewind", m: 0.4, end: (x, gy) => A.flashAll({ x, y: gy - 30, r: 110, stun: 2, m: 1, el: "light" }) }),
  "M14+M28": (A) => (A.tornado(A.px + A.d * 24, { vx: 100, dur: 3.2, scale: 1.4, el: "divinewind", force: 1300, m: 0.4, every: 0.45, fn: (x, gy) => A.pillar(x, { gy, delay: 0, warn: 0, w: 10, h: 140, m: 0.5, el: "light", snd: "magic" }) }), A.haste(5, 0.3)),
  "M14+M29": (A) => { const T0 = A.tornado(A.px + A.d * 24, { vx: 90, dur: 3.2, scale: 1.4, el: "wraithwind", fx: "wisp", fxEl: "dark", m: 0.35 }); A.orbit(3, { spr: "orb", el: "dark", R: 28, dur: 3.2, spd: 5, scale: 1, m: 0.3, cd: 0.8, st: { fear: 1.5 }, center: cen(T0, A, 36) }); },
  "M14+M30": (A) => A.tornado(A.px + A.d * 24, { vx: 90, dur: 3.2, scale: 1.4, el: "wraithwind", m: 0.4, drain: 0.25, end: (x, gy) => A.K.tin(x, gy - 30, 90).forEach((t) => A.hit(t, 1, { kb: 0, drain: 0.4, drainFx: 1 })) }),
  "M14+M31": (A) => { const s = new Set(); A.tornado(A.px + A.d * 24, { vx: 90, dur: 3, scale: 1.4, el: "wraithwind", m: 0.4, each: (t) => s.has(t) || (s.add(t), A.st(t, { curse: 0.4 })), end: () => s.forEach((t) => t.dead || A.fear(t, 2.5)) }); },
  "M14+M32": (A) => A.tornado(A.px + A.d * 80, { vx: 0, dur: 2.5, scale: 1.6, el: "wraithwind", fx: "dark", fxEl: "dark", force: 1800, m: 0.4, end: (tx, gy) => A.K.tin(tx, gy - 30, 110).forEach((t) => { t.kind !== "boss" && ((t.body.vx = (Math.random() < 0.5 ? -1 : 1) * 700), (t.body.vy = -400)); A.hit(t, 1, { kb: 0 }); A.fear(t, 2.5); }) }),

  // ── 돌풍 ──
  "M15+M15": (A) => A.rep(3, 260, (i) => A.gust({ x: A.p.cx, y: A.p.cy, w: i < 2 ? 150 : 640, m: i < 2 ? 0.8 : 1.2, kb: i < 2 ? 500 : 1400 })),
  "M15+M16": (A) => (A.gust({ w: 150, m: 0.9, kb: 500, up: 420 }), (A.p.body.vy = -480), (A.p.body.vx = A.d * 420), A.haste(1, 0.3)),
  "M15+M17": (A) => (A.gust({ w: 200, m: 0.8, fx: "smoke", fxEl: "earth", st: { blind: 5 } }), A.mover({ x: A.px + A.d * 20, y: A.py - 10, vx: 180, dur: 1.6, r: 56, m: 0.2, fx: "smoke", fxEl: "earth", dens: 8, kb: 200, st: { blind: 5 } })),
  "M15+M18": (A) => { const ts = A.gust({ w: 150, m: 0.7, kb: 520, up: 60, fx: "smoke", fxEl: "earth" }); A.later(350, () => ts.forEach((t) => t.dead || A.spikes(t.body.x, 1, 1, { el: "sandstorm", y: t.body.y - 8, m: 1, st: { blind: 3 } }))); A.spikes(A.px + A.d * 150, A.d, 4, { el: "sandstorm", gap: 24, step: 50, m: 0.6, st: { blind: 3 } }); },
  "M15+M19": (A) => { A.quake({ el: "sandstorm", m: 0.6, shake: 6 }); A.later(300, () => { A.mover({ x: A.p.cx + A.d * 10, y: A.fy - 20, vx: 240, dur: 1.6, r: 60, m: 0.5, fx: "smoke", fxEl: "earth", dens: 10, kb: 300, st: { blind: 3, stun: 0.5 } }); for (let i = 0; i < 16; i++) A.shot({ spr: "pebble", el: "earth", x: A.p.cx + A.d * (20 + Math.random() * 80), y: A.fy - 60 - Math.random() * 40, ang: A.d > 0 ? 0.3 : PI - 0.3, speed: 260 + Math.random() * 140, grav: 400, scale: 1.6, m: 0.2, trail: 0 }); }); },
  "M15+M20": (A) => A.TX(2, 300, 60).forEach(({ t, x }) => A.hand(x, { t, el: "sandstorm", m: 0.6, grab: 0.4, hold: 300, then: (hx, gy, hs) => A.later(350, () => hs.forEach((u) => {
    if (u.dead) return;
    u.kind !== "boss" && ((u.body.vx = A.d * 650), (u.body.vy = -420));
    const land = () => (A.boom(u.body.x, u.body.y - 8, 50, 1, { el: "sandstorm", st: { blind: 3 } }), A.cloud(u.body.x, u.body.y - 14, 50, 3, { m: 0, el: "earth", fx: "smoke", fxEl: "earth", st: { blind: 2 } }));
    A.K.ent({ dur: 1.2, upd: (e) => !u.dead && u.body.onGround && e.t < 0.9 && !e.done && ((e.done = 1), land()), end: (e) => e.done || u.dead || land() });
  })) })),
  "M15+M21": (A) => (A.gust({ w: 140, m: 0.5, fx: "drop", fxEl: "poison" }), A.fan(9, 0.12, { spr: "needle", el: "miasma", speed: 560, life: 0.9, scale: 1.3, m: 0.45, st: { poison: 1.5 } })),
  "M15+M22": (A) => (A.gust({ w: 120, m: 0.5, fx: "mist", fxEl: "poison", st: { poison: 1 } }), A.mover({ x: A.px + A.d * 20, y: A.py - 6, vx: 150, dur: 2.2, r: 60, m: 0.15, fx: "mist", fxEl: "poison", dens: 8, kb: 40, every: 0.3, st: { poison: 1.5 }, drip: [0.4, (x, y) => A.cloud(x, y, 50, 4, { m: 0.12, el: "poison", st: { poison: 1 } })] })),
  "M15+M23": (A) => A.gust({ w: 150, m: 0.8, kb: 700, up: 200, st: { rot: 0.3, poison: 1 } }).forEach((t) => A.K.ent({ dur: 1.2, acc: 0, upd: (e, dt) => !t.dead && (e.acc -= dt) <= 0 && ((e.acc = 0.12), A.cloud(t.body.x, t.body.y - t.body.h / 2, 26, 3, { m: 0.1, el: "poison", st: { poison: 1 } })) })),
  "M15+M24": (A) => (A.pool(A.px + A.d * 30, 50, 4, { m: 0.12, slow: 1, el: "poison", st: { poison: 1 }, fx: "bubble", fxEl: "poison" }), A.mover({ x: A.px + A.d * 30, y: A.fy - 14, ground: 14, vx: 220, dur: 1.8, r: 40, m: 0.5, fx: "drop", fxEl: "poison", dens: 10, kb: 400, st: { poison: 2 }, drip: [0.15, (x) => A.pool(x, 24, 3, { m: 0.1, el: "poison", st: { poison: 1 }, fx: "bubble", fxEl: "poison" })] })),
  "M15+M25": (A) => (A.gust({ w: 80, m: 0.3, kb: 300 }), A.shot({ spr: "spear", el: "divinewind", speed: 900, life: 0.7, pierce: 99, scale: 1.8, m: 1.3, undead: 2, drip: [0.06, tailwind(A)] })),
  "M15+M26": (A) => (A.gust({ w: 140, m: 0.8, fx: "star", fxEl: "light" }), A.heal(0.12)),
  "M15+M27": (A) => (A.gust({ w: 150, m: 0.8, fx: "star", fxEl: "light", st: { stun: 1.2 } }), A.flash(A.px + A.d * 60, A.py, 60, "light"), A.haste(5, 0.3)),
  "M15+M28": (A) => { const a = A.aim(90); A.pillar(a.x, { gy: a.gy, delay: 250, w: 16, m: 1.4, el: "divinewind", then: (x, gy) => { [-1, 1].forEach((s) => A.gust({ x, y: gy - 24, dir: s, w: 120, m: 0.6 })); Math.abs(A.p.cx - x) < 200 && (A.haste(5, 0.3), A.p.buff("atk", 5, 0.2, "atk", "천상의 축복")); } }); },
  "M15+M29": (A) => A.gust({ w: 150, m: 0.8, fx: "wisp", fxEl: "dark", st: { fear: 2.5 } }),
  "M15+M30": (A) => A.gust({ w: 150, m: 0.8, fx: "wisp", fxEl: "dark", st: { fear: 2.5 } }).forEach((t) => A.rep(3, 500, () => t.dead || A.hit(t, 0.3, { kb: 0, drain: 0.5, drainFx: 1 }))),
  "M15+M31": (A) => A.gust({ w: 150, m: 0.8, fx: "wisp", fxEl: "dark", st: { curse: 0.4, fear: 2.5 } }),
  "M15+M32": (A) => A.vortex(A.px + A.d * 70, A.py, { dur: 1.4, r: 150, m: 0.2, force: 1600, end: (vx, vy) => A.gust({ x: vx - A.d * 40, y: vy, w: 160, m: 1, kb: 900, up: 250, st: { fear: 2.5 } }) }),

  // ── 상승 기류 ──
  "M16+M16": (A) => A.rep(3, 260, () => { A.p.body.vy = -560; A.p.body.vx = A.d * 180; A.updraft({ self: 0, x: A.p.cx, gy: A.p.body.y + 10, m: 0.4, r: 40 }); }),
  "M16+M17": (A) => {
    const x = A.px + A.d * 30, top = A.fy - 150;
    A.updraft({ x, self: 0, m: 0.3, r: 40 });
    const s = A.img("rock", x, A.fy - 10, { el: "earth", scale: 2.4 });
    A.sc.tweens.add({ targets: s, y: top, angle: 180, duration: 700, ease: "Quad.easeOut", onComplete: () => { const t = A.T(1, 300, s.x, A.fy)[0]; const tx = t ? t.body.x : x + A.d * 100; s.destroy(); A.drop(tx, { y: t ? t.body.y - 8 : void 0, spr: "rock", el: "sandstorm", dx: x - tx, h: 150, speed: 600, scale: 2.4, spin: 8, r: 56, m: 2, ho: { st: { blind: 3, stun: 0.6 } } }); } });
  },
  "M16+M18": (A) => A.spikes(A.px + A.d * 24, A.d, 6, { el: "sandstorm", gap: 24, step: 60, s: 1.6, m: 0.8, up: 560, st: { blind: 2 }, each: (x, gy) => A.puff("streak", x, gy - 20, 4, "wind") }),
  "M16+M19": (A) => { const x = A.px + A.d * 70, gy = A.gy(x); A.rep(8, 150, () => { A.updraft({ x: x + (Math.random() - 0.5) * 60, gy, self: 0, m: 0.3, r: 44, up: 460, fx: "smoke", fxEl: "earth", st: { blind: 3 } }); for (let k = 0; k < 5; k++) A.shot({ spr: "pebble", el: "earth", x: x + (Math.random() - 0.5) * 40, y: gy - 4, ang: -PI / 2 + (Math.random() - 0.5) * 0.8, speed: 260 + Math.random() * 120, grav: 600, scale: 1.4, m: 0, trail: 0 }); }); A.cloud(x, A.py - 30, 80, 4, { m: 0, el: "earth", fx: "smoke", fxEl: "earth", st: { blind: 2 } }); },
  "M16+M20": (A) => A.TX(3, 300, 50).forEach(({ t, x }) => A.hand(x, { t, el: "sandstorm", m: 0.7, grab: 0.3, hold: 250, then: (hx, gy, hs) => A.later(300, () => hs.forEach((u) => { if (u.dead) return; u.kind !== "boss" && (u.body.vy = -800); A.updraft({ x: u.body.x, gy: u.body.y, self: 0, m: 0, r: 10 }); A.later(900, () => u.dead || A.hit(u, 1.3, { kb: 60, heavy: 1, st: { blind: 2 } })); })) })),
  "M16+M21": (A) => (A.updraft({ self: 0, m: 0.3, r: 50, fx: "drop", fxEl: "poison" }), A.rep(4, 90, (i) => A.fan(3, 0.25, { spr: "needle", el: "miasma", x: A.px + (i - 1.5) * 14, y: A.fy - 6, ang: -PI / 2, speed: 520, life: 0.9, scale: 1.3, m: 0.5, st: { poison: 1.5 } }))),
  "M16+M22": (A) => { const x = A.px + A.d * 60, gy = A.gy(x); A.updraft({ x, gy, self: 0, m: 0.3, r: 40, fx: "mist", fxEl: "poison" }); [0, 50, 100, 150].forEach((h, i) => A.later(i * 120, () => A.cloud(x, gy - 30 - h, 40, 5, { m: 0.14, el: "poison", st: { poison: 1 } }))); },
  "M16+M23": (A) => A.updraft({ x: A.px + A.d * 40, self: 0, m: 0.6, r: 70, up: 520, st: { rot: 0.3, poison: 1 } }).forEach((t) => A.K.ent({ dur: 1.6, acc: 0, upd: (e, dt) => !t.dead && (e.acc -= dt) <= 0 && ((e.acc = 0.2), A.shot({ spr: "soft", el: "poison", x: t.body.x, y: t.body.y, ang: PI / 2 + (Math.random() - 0.5) * 1.6, speed: 160, grav: 300, life: 1, scale: 1.3, m: 0.2, st: { poison: 1 }, end: (x, y) => A.puff("drop", x, y, 4, "poison") })) })),
  "M16+M24": (A) => { const x = A.px + A.d * 60; A.pool(x, 80, 6, { m: 0.14, slow: 1, el: "poison", st: { poison: 1 }, fx: "bubble", fxEl: "poison", frame: (z, dt) => Math.random() < dt * 4 && A.cloud(z.x + (Math.random() - 0.5) * z.r, z.y - 40 - Math.random() * 60, 30, 2, { m: 0.08, el: "poison", st: { poison: 1 } }) }); A.updraft({ x, self: 0, m: 0.3, r: 60, fx: "mist", fxEl: "poison" }); },
  "M16+M25": (A) => { A.p.body.vy = -640; A.updraft({ self: 0, m: 0.3, r: 30 }); A.later(350, () => A.fan(3, 0.25, { spr: "spear", el: "divinewind", x: A.p.cx, y: A.p.cy, ang: PI / 2 + A.d * 0.15, speed: 700, life: 1, pierce: 99, scale: 1.6, m: 1.2, undead: 2, end: (x, y) => (A.boom(x, y, 36, 0.8, { el: "light" }), A.rays(x, y, 40)) })); A.haste(2, 0.4); },
  "M16+M26": (A) => (A.haste(8, 0.3), A.turret(A.px, A.py, { spr: 0, follow: 1, oy: 0, dur: 8, every: 1, fn: () => (A.healAmt(A.p.maxHp * 0.02), A.puff("leaf", A.p.cx, A.p.cy, 4, "wind"), A.puff("star", A.p.cx, A.p.cy, 2, "light")) }), A.updraft({ self: 0, m: 0, r: 10 })),
  "M16+M27": (A) => {
    A.p.body.vy = -620;
    const w = [-1, 1].map(() => A.img("glow", A.p.cx, A.p.cy, { add: 1, el: "light", shade: 1, alpha: 0.8 }).setScale(1.6, 0.5));
    A.K.ent({ dur: 2, upd: (e) => w.forEach((s, i) => s.setPosition(A.p.cx + (i ? 8 : -8), A.p.cy - 8).setRotation((i ? 1 : -1) * (0.5 + Math.sin(A.sc.time.now / 90) * 0.3)).setAlpha(Math.min(0.8, e.t))), end: () => w.forEach((s) => s.destroy()) });
    A.later(150, () => A.flashAll({ x: A.p.cx, y: A.p.cy, r: 160, stun: 1.5, m: 0.7, el: "light" }));
  },
  "M16+M28": (A) => (A.pillar(A.px, { delay: 0, warn: 0, w: 20, m: 1, el: "divinewind", up: 480, dur: 700 }), (A.p.body.vy = -720), A.updraft({ self: 0, m: 0.4, r: 60, up: 480 }), A.haste(5, 0.3)),
  "M16+M29": (A) => { const ts = A.updraft({ x: A.px + A.d * 40, self: 0, m: 0.6, r: 80, up: 500 }); A.later(200, () => A.rep(6, 200, () => { const al = ts.filter((u) => !u.dead); const t = al[Math.floor(Math.random() * al.length)]; t && A.shot({ spr: "orb", el: "wraithwind", x: A.p.cx, y: A.p.cy - 20, ang: Math.atan2(t.body.y - A.p.cy, t.body.x - A.p.cx), speed: 320, homing: 8, life: 1.2, noTerrain: 1, scale: 1.1, m: 0.5, st: { fear: 2 } }); })); },
  "M16+M30": (A) => { const ts = A.updraft({ x: A.px + A.d * 40, self: 0, m: 0.6, r: 80, up: 500 }); A.later(300, () => ts.forEach((t) => { if (t.dead) return; const [x, y] = A.tp(t); const s = A.img("wraith", x, y, { tint: 0xd0c0ff, add: 1, alpha: 0.8 }); A.sc.tweens.add({ targets: s, y: y - 60, alpha: 0, duration: 700, onComplete: () => s.destroy() }); A.hit(t, 1, { kb: 0, drain: 0.5, drainFx: 1 }); })); },
  "M16+M31": (A) => { const ts = A.updraft({ x: A.px + A.d * 40, self: 0, m: 0.6, r: 80, up: 500, st: { curse: 0.4 } }); A.later(500, () => ts.forEach((t) => t.dead || A.fear(t, 2.5))); },
  "M16+M32": (A) => { const x = A.px + A.d * 60; A.updraft({ x, self: 0, m: 0.5, r: 80, up: 520 }); A.vortex(x, A.fy - 90, { dur: 3.5, r: 130, m: 0.3, force: 1200, lift: 1, el: "wraithwind" }); },

  // ── 바위 투척 ──
  "M17+M17": (A) => A.roll({ spr: "rock", el: "earth", scale: 3, grow: 0.6, vx: 170, dur: 3, m: 1.2, every: 0.3, end: (x, gy, s) => { A.boom(x, gy - 20, 40 + s * 14, 2.4, { cam: 1 }); for (let i = 0; i < 10; i++) A.shot({ spr: "rock", el: "earth", x, y: gy - 20, ang: -PI / 2 + (Math.random() - 0.5) * 2.4, speed: 200 + Math.random() * 180, grav: 700, scale: 1 + Math.random(), spin: 10, m: 0.4 }); } }),
  "M17+M18": (A) => A.roll({ spr: "rock", el: "earth", scale: 2, vx: 180, dur: 2.6, m: 0.9, drip: [0.18, (x) => A.spikes(x, 1, 1, { el: "earth", m: 0.5 })] }),
  "M17+M19": (A) => (A.quake({ m: 1, el: "earth" }), A.later(600, () => A.TX(5, 340, 50).forEach(({ x, y }, i) => A.drop(x + (Math.random() - 0.5) * 20, { y, spr: "rock", el: "earth", delay: i * 140, scale: 2.4, spin: 6, speed: 650, r: 46, m: 1.4 })))),
  "M17+M20": (A) => {
    const x = A.px + A.d * 20, gy = A.fy;
    const hd = A.img("vt_hand", x, gy + 30, { el: "earth", depth: 24, origin: [0.5, 1] }).setScale(1.4);
    const rk = A.img("rock", x, gy - 30, { el: "earth", scale: 2.4 });
    A.sc.tweens.add({ targets: hd, y: gy + 4, duration: 200, ease: "Back.easeOut" });
    A.later(450, () => {
      rk.destroy();
      A.sc.tweens.add({ targets: hd, y: gy + 40, alpha: 0, duration: 300, onComplete: () => hd.destroy() });
      const t = A.T(1, 420)[0];
      const tx = t ? t.body.x : x + A.d * 200, ty = t ? t.body.y - t.body.h / 2 : A.py;
      const sx = x, sy = gy - 36, T = 0.7, g = 700, vx = (tx - sx) / T, vy = (ty - sy - 0.5 * g * T * T) / T;
      A.shot({ spr: "rock", el: "earth", x: sx, y: sy, ang: Math.atan2(vy, vx), speed: Math.hypot(vx, vy), grav: g, life: 1.4, scale: 2.4, spin: 9, r: 12, m: 2, kb: 300, end: (ex, ey) => A.boom(ex, ey, 56, 1.4, { el: "earth" }) });
    });
  },
  "M17+M21": (A) => A.shot({ spr: "rock", el: "bog", ang: A.d > 0 ? -0.45 : PI + 0.45, speed: 340, grav: 620, scale: 1.8, spin: 9, m: 1.2, end: (x, y) => { A.boom(x, y, 40, 1, { el: "bog" }); for (let i = 0; i < 10; i++) A.shot({ spr: "pebble", el: "poison", x, y: y - 6, ang: -PI / 2 + (Math.random() - 0.5) * 2.6, speed: 220 + Math.random() * 160, grav: 600, scale: 1.6, m: 0.35, st: { poison: 1.5 } }); } }),
  "M17+M22": (A) => A.roll({ spr: "rock", el: "bog", scale: 2, vx: 160, dur: 3, m: 0.8, fx: "mist", fxEl: "poison", st: { poison: 1 }, drip: [0.3, (x, gy) => A.cloud(x, gy - 20, 34, 3, { m: 0.1, el: "poison", st: { poison: 1 } })] }),
  "M17+M23": (A) => A.shot({ spr: "rock", el: "bog", ang: A.d > 0 ? -0.3 : PI + 0.3, speed: 400, grav: 500, scale: 1.8, spin: 9, m: 1.4, st: { rot: 0.3, stun: 2 }, hit: (t) => (A.text(t.body.x, t.body.y - t.body.h - 24, "석화", "#c0a080"), A.encase(t, 2, "earth")), end: (x, y) => A.boom(x, y, 36, 0.6, { el: "bog" }) }),
  "M17+M24": (A) => A.shot({ spr: "rock", el: "bog", ang: lob(A), speed: 340, grav: 620, scale: 2, spin: 9, m: 1.3, end: (x, y) => (A.boom(x, y, 46, 1.2, { el: "earth" }), A.crack(x, A.gy(x, y), 60, "bog"), A.pool(x, 80, 8, { y, m: 0.14, slow: 1, el: "poison", st: { poison: 1 }, fx: "bubble", fxEl: "poison" })) }),
  "M17+M25": (A) => A.shot({ spr: "spear", el: "crystalE", speed: 560, scale: 1.8, m: 1.5, end: (x, y) => (A.imp(x, y, 0.8), A.crystal(x, { y, dur: 7 })) }),
  "M17+M26": (A) => A.roll({ spr: "rock", el: "crystalE", shade: 1, scale: 1.8, vx: 150, dur: 1.8, m: 0.8, fx: "star", fxEl: "light", end: (x, gy) => (A.crystal(x, { y: gy - 8, dur: 8, m: 0.2 }), A.pool(x, 60, 8, { y: gy - 8, m: 0, heal: 0.015, fx: "star", fxEl: "light" })) }),
  "M17+M27": (A) => A.shot({ spr: "rock", el: "crystalE", ang: A.d > 0 ? -0.35 : PI + 0.35, speed: 380, grav: 560, scale: 1.8, spin: 9, m: 1.2, end: (x, y) => (A.flashAll({ x, y, r: 110, stun: 1.4, m: 0.6, el: "light" }), A.puff("shard", x, y, 24, "crystalE"), [-30, 30].forEach((dx) => A.crystal(x + dx, { y, dur: 6, scale: 0.7 }))) }),
  "M17+M28": (A) => A.TX(4, 320, 45).forEach(({ x, y }, i) => A.drop(x, { y, spr: "crystal", el: "crystalE", delay: i * 140, speed: 900, scale: 1.4, r: 36, m: 1.5, then: (lx, gy) => A.crystal(lx, { y: gy - 8, dur: 7 }) })),
  "M17+M29": (A) => A.shot({ spr: "tomb", el: "grave", ang: A.d > 0 ? -0.35 : PI + 0.35, speed: 400, grav: 560, scale: 1.6, spin: 7, m: 1.6, st: { raise: "skel" }, end: (x, y) => (A.boom(x, y, 40, 0.8, { el: "grave", st: { raise: "skel" } }), A.puff("dark", x, y, 12, "dark")) }),
  "M17+M30": (A) => A.shot({ spr: "tomb", el: "grave", ang: A.d > 0 ? -0.35 : PI + 0.35, speed: 400, grav: 560, scale: 1.6, spin: 7, m: 1.3, hit: (t) => (A.st(t, { stun: 2 }), A.rep(4, 400, () => t.dead || A.hit(t, 0.35, { kb: 0, drain: 0.5, drainFx: 1 }))), end: (x, y) => A.fade(A.img("tomb", x, A.gy(x, y), { el: "grave", origin: [0.5, 1], scale: 1.4 }), 2000, 1400) }),
  "M17+M31": (A) => { const a = A.aim(120); A.drop(a.x, { gy: a.gy, spr: "tomb", el: "grave", dx: 0, speed: 700, scale: 2, r: 40, m: 1.4, then: (x, gy) => { A.fade(A.img("tomb", x, gy + 2, { el: "grave", origin: [0.5, 1], scale: 2 }), 4000, 3000); A.ring(x, gy - 20, 100, "curse", 500); A.K.tin(x, gy - 20, 100).forEach((t) => A.st(t, { curse: 0.4, raise: "skel" })); } }); },
  "M17+M32": (A) => A.shot({ spr: "rock", el: "grave", ang: lob(A), speed: 360, grav: 600, scale: 1.8, spin: 8, m: 1.2, end: (x, y) => { const gy = A.gy(x, y); A.boom(x, gy - 10, 40, 1, { el: "earth" }); A.crack(x, gy, 50, "grave"); A.vortex(x, gy - 6, { dur: 3, r: 120, m: 0.4, force: 1100, el: "grave", each: (t) => A.st(t, { raise: "skel" }) }); } }),

  // ── 가시 돌기 ──
  "M18+M18": (A) => (A.spikes(A.px + A.d * 22, A.d, 12, { gap: 22, s: 1.4, m: 0.7 }), A.spikes(A.px + A.d * 33, A.d, 12, { gap: 22, step: 60, s: 1.1, m: 0.5, multi: 1 })),
  "M18+M19": (A) => (A.crack(A.px, A.fy, 260, "earth", A.d), A.shake(5, 400), A.spikes(A.px + A.d * 20, A.d, 11, { gap: 22, step: 45, s: 1.5, m: 0.8, st: { stun: 0.4 } })),
  "M18+M20": (A) => A.TX(3, 300, 50).forEach(({ t, x }) => A.hand(x, { t, el: "earth", scale: 1.2, m: 1, grab: 2, then: (hx, gy, hs) => (A.spikeRing(hx, 18, 3, { el: "earth", y: gy - 8, m: 0.5 }), A.rep(3, 400, () => hs.forEach((u) => u.dead || A.hit(u, 0.4, { kb: 0 })))) })),
  "M18+M21": (A) => A.spikes(A.px + A.d * 22, A.d, 8, { el: "bog", m: 0.7, st: { poison: 2, root: 1.5 }, each: (x, gy) => A.puff("drop", x, gy - 20, 6, "poison") }),
  "M18+M22": (A) => { const x0 = A.px + A.d * 22; A.spikes(x0, A.d, 7, { el: "bog", m: 0.6, st: { poison: 1 } }); A.later(300, () => A.cloud(x0 + A.d * 66, A.fy - 20, 80, 5, { m: 0.14, el: "poison", st: { poison: 1 }, each: (t) => (t.kind !== "boss" && (t.body.vx *= 0.1), Math.random() < 0.3 && A.st(t, { root: 0.6 })) })); },
  "M18+M23": (A) => A.spikes(A.px + A.d * 22, A.d, 8, { el: "bog", m: 0.8, st: { rot: 0.35, armor: 0.4, poison: 1 } }),
  "M18+M24": (A) => A.pool(A.px + A.d * 70, 90, 7, { m: 0.12, slow: 1, el: "poison", st: { poison: 1 }, fx: "bubble", fxEl: "poison", tick: 0.7, onTick: (z, ts) => ts.forEach((t) => A.spikes(t.body.x, 1, 1, { el: "bog", y: z.y - 8, m: 0.6, st: { poison: 1 } })) }),
  "M18+M25": (A) => A.spikes(A.px + A.d * 22, A.d, 6, { el: "crystalE", gap: 26, s: 1.5, m: 1, each: (x, gy, i) => i % 2 === 0 && A.crystal(x, { y: gy - 8, dur: 6, scale: 0.8 }) }),
  "M18+M26": (A) => A.spikes(A.px + A.d * 22, A.d, 6, { el: "crystalE", gap: 26, s: 1.4, m: 0.9, each: (x, gy, i) => i % 2 === 0 && (A.crystal(x, { y: gy - 8, dur: 7, scale: 0.8 }), A.pool(x, 30, 7, { y: gy - 8, m: 0, heal: 0.01, fx: "star", fxEl: "light" })) }),
  "M18+M27": (A) => A.spikes(A.px + A.d * 22, A.d, 7, { el: "crystalE", gap: 24, s: 1.4, m: 1, st: { stun: 0.5 }, each: (x, gy, i) => (A.flash(x, gy - 20, 20, "light"), i % 2 === 1 && A.crystal(x, { y: gy - 8, dur: 7, scale: 0.8 })) }),
  "M18+M28": (A) => { const x = A.px; A.spikeRing(x, 60, 8, { el: "crystalE", m: 0.8 }); [-60, 60].forEach((dx) => A.crystal(x + dx, { dur: 8, scale: 1.3 })); A.pillar(x, { delay: 200, w: 24, m: 0, el: "crystalE", snd: "heal" }); A.shield(0.15, 8, "crystalE"); A.p.buff("dmgReduce", 8, 0.25, "shield", "수정 신전"); },
  "M18+M29": (A) => A.spikes(A.px + A.d * 22, A.d, 7, { el: "grave", tint: 0xf0e8d0, m: 0.9, st: { raise: "skel" } }),
  "M18+M30": (A) => A.spikes(A.px + A.d * 22, A.d, 7, { el: "grave", m: 0.9, drain: 0.25, drainFx: 1 }),
  "M18+M31": (A) => A.spikes(A.px + A.d * 22, A.d, 7, { el: "grave", m: 0.8, st: { curse: 0.4, raise: "skel" } }),
  "M18+M32": (A) => { const a = A.aim(110); A.vortex(a.x, a.y, { dur: 1.6, r: 150, m: 0.25, force: 1500, el: "grave", end: (x) => (A.spikeRing(x, 50, 10, { el: "grave", m: 1, step: 25, s: 1.8 }), A.later(300, () => A.spikes(x, 1, 1, { el: "grave", s: 2.4, m: 1.5 }))) }); },

  // ── 지진 ──
  "M19+M19": (A) => A.rep(2, 600, (i) => A.quake({ m: 1.2, shake: 12, st: i ? { stun: 2 } : {}, each: (t) => (A.K.applyEl(t, "earth"), A.K.applyEl(t, "earth")) })),
  "M19+M20": (A) => A.quake({ m: 0.8 }).slice(0, 8).forEach((t, i) => A.later(150 + i * 90, () => A.hand(t.body.x, { t, el: "earth", m: 0.6, grab: 2 }))),
  "M19+M21": (A) => A.quake({ m: 0.7, el: "bog" }).forEach((t, i) => A.later(200 + i * 60, () => { for (let k = 0; k < 3; k++) A.shot({ spr: "needle", el: "poison", x: t.body.x + (k - 1) * 8, y: A.gy(t.body.x, t.body.y - 8) + 4, ang: -PI / 2, speed: 500, life: 0.25, scale: 1.3, m: 0.35, st: { poison: 1.5 }, noTerrain: 1 }); })),
  "M19+M22": (A) => { A.quake({ m: 0.8, el: "bog" }); for (let i = 0; i < 6; i++) { const x = A.px + (i - 2.5) * 100; A.later(200 + i * 80, () => (A.cloud(x, A.gy(x) - 30, 50, 5, { m: 0.14, el: "poison", st: { poison: 1 } }), A.updraft({ x, gy: A.gy(x), self: 0, m: 0.2, r: 30, fx: "mist", fxEl: "poison" }))); } },
  "M19+M23": (A) => { A.quake({ m: 0.9, el: "bog", st: { rot: 0.3 } }); for (let i = -3; i <= 3; i++) A.pool(A.px + i * 90, 44, 6, { m: 0.08, el: "poison", fx: "bubble", fxEl: "poison", each: (t) => A.st(t, { armor: Math.min(0.6, (t._frAc = (t._frAc || 0) + 0.05)) }) }); },
  "M19+M24": (A) => { A.quake({ m: 0.9, el: "bog" }); for (let i = -3; i <= 3; i++) { const x = A.px + i * 90 + (Math.random() - 0.5) * 30; A.later(200 + Math.abs(i) * 80, () => (A.crack(x, A.gy(x), 40, "bog"), A.pool(x, 46, 7, { m: 0.12, slow: 1, el: "poison", st: { poison: 1 }, fx: "bubble", fxEl: "poison" }))); } },
  "M19+M25": (A) => A.quake({ m: 0.8, el: "crystalE" }).slice(0, 6).forEach((t, i) => A.later(150 + i * 70, () => (A.spikes(t.body.x, 1, 1, { el: "crystalE", y: t.body.y - 8, s: 1.6, m: 1 }), i < 3 && A.crystal(t.body.x, { y: t.body.y - 8, dur: 6, scale: 0.8 })))),
  "M19+M26": (A) => (A.quake({ m: 0.9, el: "crystalE" }), A.rep(6, 250, () => (A.pillar(A.p.cx + (Math.random() - 0.5) * 30, { delay: 0, warn: 0, w: 6, h: 80, m: 0, el: "light", snd: "heal" }), A.healAmt(A.p.maxHp * 0.02)))),
  "M19+M27": (A) => A.rep(3, 400, () => { A.quake({ m: 0.5, el: "crystalE", shake: 4, st: { stun: 1 } }); for (let k = 0; k < 8; k++) { const x = A.p.cx + (Math.random() - 0.5) * 600; A.flash(x, A.gy(x) - 4, 20, "crystalE", 300); A.puff("shard", x, A.gy(x) - 4, 4, "crystalE"); } }),
  "M19+M28": (A) => (A.quake({ m: 0.9, el: "crystalE" }), A.TX(4, 320, 60).forEach(({ x, y }, i) => A.later(250 + i * 120, () => (A.spikes(x, 1, 1, { el: "crystalE", y, s: 2, m: 1.2 }), A.crystal(x, { y, dur: 7, scale: 1.3 }))))),
  "M19+M29": (A) => { A.quake({ m: 0.8, el: "grave", st: { raise: "skel" } }); for (let i = 0; i < 5; i++) { const x = A.px + (i - 2) * 80; A.later(200 + i * 80, () => A.shot({ spr: "wraith", el: "dark", x, y: A.gy(x) - 10, ang: -PI / 2, speed: 160, homing: 6, life: 2.4, noTerrain: 1, scale: 1.2, m: 0.9, st: { raise: "skel" } })); } },
  "M19+M30": (A) => A.quake({ m: 1.2, el: "grave", st: { raise: "skel" } }),
  "M19+M31": (A) => A.quake({ m: 0.9, el: "grave", st: { curse: 0.4, raise: "skel" } }),
  "M19+M32": (A) => { const a = A.aim(110), x = a.x, gy = a.gy; A.crack(x, gy, 70, "grave"); A.vortex(x, gy - 10, { dur: 1.5, r: 140, m: 0.2, force: 1400, el: "grave", end: () => { A.spikeRing(x, 36, 8, { el: "grave", s: 2, m: 0.5, step: 20 }); A.later(160, () => (A.shake(8), A.K.tin(x, gy - 16, 50).forEach((t) => A.hit(t, 3.2, { kb: 200, up: 300, st: { raise: "skel" } })))); } }); },

  // ── 대지의 손 ──
  "M20+M20": (A) => { const ts = A.T(3, 300); const x = ts.length ? ts.reduce((s, t) => s + t.body.x, 0) / ts.length : A.px + A.d * 90; ts.forEach((t) => t.kind !== "boss" && (t.body.x += (x - t.body.x) * 0.7)); A.hand(x, { scale: 3, el: "earth", m: 1, grab: 1.4, hold: 600, then: (hx, gy) => A.later(700, () => (A.boom(hx, gy - 10, 70, 2.6, { el: "earth", cam: 1, up: 0, kb: 300 }), A.crack(hx, gy, 120, "earth"))) }); },
  "M20+M21": (A) => A.TX(3, 300, 50).forEach(({ t, x }) => A.hand(x, { t, el: "bog", m: 1, grab: 2.5, st: { poison: 2.5 }, fx: "drop" })),
  "M20+M22": (A) => A.TX(2, 300, 60).forEach(({ t, x }) => A.hand(x, { t, el: "bog", m: 0.8, grab: 2.5, then: (hx, gy) => A.cloud(hx, gy - 24, 46, 4, { m: 0.14, el: "poison", st: { poison: 1 }, each: (u) => A.st(u, { root: 0.5 }) }) })),
  "M20+M23": (A) => A.TX(2, 300, 60).forEach(({ t, x }) => A.hand(x, { t, el: "bog", m: 0.9, grab: 4, hold: 2400, st: { rot: 0.35, armor: 0.4 }, fx: "bubble" })),
  "M20+M24": (A) => { const x = A.px + A.d * 70; A.pool(x, 120, 7, { m: 0.15, root: 1, el: "poison", st: { poison: 1 }, fx: "bubble", fxEl: "poison" }); A.rep(5, 1200, () => { const t = A.K.tin(x, A.gy(x) - 10, 120)[0]; t && A.hand(t.body.x, { t, el: "bog", m: 0.4, grab: 1, tint: 0x5a7a3a }); }); },
  "M20+M25": (A) => A.TX(2, 300, 60).forEach(({ t, x }) => A.hand(x, { t, el: "crystalE", tint: 0xc0f0ff, m: 1, grab: 2.5, hold: 1800, then: (hx, gy) => A.crystal(hx, { y: gy - 8, dur: 2.5, scale: 0.7 }) })),
  "M20+M26": (A) => { [-14, 14].forEach((dx) => { const hd = A.img("vt_hand", A.px + dx, A.fy + 30, { el: "crystalE", depth: 31, origin: [0.5, 1] }).setFlipX(dx > 0); A.sc.tweens.add({ targets: hd, y: A.fy + 4, duration: 200, ease: "Back.easeOut", yoyo: !0, hold: 2000, onComplete: () => hd.destroy() }); }); A.heal(0.2); A.shield(0.15, 6, "crystalE"); A.p.buff("dmgReduce", 3, 0.5, "shield", "대지의 손"); },
  "M20+M27": (A) => A.TX(2, 300, 60).forEach(({ t, x }) => A.hand(x, { t, el: "crystalE", tint: 0xfff4c0, m: 1, grab: 2, then: (hx, gy) => A.flashAll({ x: hx, y: gy - 20, r: 100, stun: 1.5, m: 0.4, el: "light", ms: 120 }) })),
  "M20+M28": (A) => { const px = A.px + A.d * 120; A.pillar(px, { delay: 800, w: 20, m: 2.4, el: "crystalE", undead: 2 }); A.T(2, 300).forEach((t) => A.hand(t.body.x, { t, scale: 1.6, el: "crystalE", tint: 0xc0f0ff, m: 0.6, grab: 1.5, then: () => A.later(350, () => { if (t.dead || t.kind === "boss") return; A.puff("shard", t.body.x, t.body.y - 10, 10, "crystalE"); t.body.x = px + (Math.random() - 0.5) * 10; A.st(t, { stun: 1 }); }) })); },
  "M20+M29": (A) => A.TX(3, 300, 50).forEach(({ t, x }) => A.hand(x, { t, el: "grave", tint: 0xf0e8d0, m: 1, grab: 2, st: { raise: "skel" }, fx: "dark" })),
  "M20+M30": (A) => A.TX(2, 300, 60).forEach(({ t, x }) => A.hand(x, { t, el: "grave", tint: 0x8070a0, m: 0.6, grab: 2.4, hold: 1800, then: (hx, gy, hs) => A.rep(4, 450, () => hs.forEach((u) => u.dead || A.hit(u, 0.35, { kb: 0, drain: 0.5, drainFx: 1 }))) })),
  "M20+M31": (A) => A.TX(3, 300, 50).forEach(({ t, x }) => A.hand(x, { t, el: "grave", tint: 0x9060c0, m: 0.9, grab: 2, st: { curse: 0.4, raise: "skel" } })),
  "M20+M32": (A) => A.TX(2, 300, 60).forEach(({ t, x }) => A.hand(x, { t, el: "grave", tint: 0x302040, m: 0.6, grab: 2, then: (hx, gy, hs) => (A.vortex(hx, gy - 6, { dur: 1.6, r: 80, m: 0.3, force: 900, el: "grave" }), A.later(1500, () => hs.forEach((u) => u.dead || (A.hit(u, 2.6, { kb: 0, st: { raise: "skel" } }), A.puff("rock", u.body.x, u.body.y, 14, "earth"))))) })),
};
