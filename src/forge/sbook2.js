// 스킬 융합서 2 — 받아치기·도약베기·갈고리·함성·집중·지면 강타·단검·발차기·잔상·사격·덫·박치기·처형·난무·투척, 반격 스킬(SA)
const PI = Math.PI;
const fwd = (S) => (S.p.facing > 0 ? 0 : PI);
const low = (S, r = 360) => S.T(8, r).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
const air = (S, r = 320) => S.T(8, r).find((t) => !t.body.onGround || t.def?.flying) ?? S.T(1, r)[0];
const dirTo = (S, t) => (t ? Math.sign(t.body.x - S.p.cx) || S.p.facing : S.p.facing);
const angTo = (S, t, x = S.p.cx, y = S.p.cy) => (t ? Math.atan2(t.body.y - t.body.h / 2 - y, t.body.x - x) : fwd(S));

export const SBOOK2 = {
  // ── 받아치기 ──
  "S09+S09": (S) => S.parry({ dur: 0.7, n: 2, m: 3 }),
  "S09+S10": (S) => S.parry({ dur: 0.6, counter: 0, block: (at) => at && ((S.p.facing = dirTo(S, at)), S.leap({ vx: 380, vy: -420, apex: () => ((S.p.facing *= -1), S.slashAt(S.p.cx, S.p.cy, 34, -1.5, 1.5), S.hit(at, 3, { heavy: 1 })) })) }),
  "S09+S11": (S) => S.parry({ dur: 0.6, counter: 0, block: (at) => at && (S.hook({ t: at, m: 1 }), at.statuses.apply({ type: "stun", chance: 1, dur: 1.5 }, 0)) }),
  "S09+S12": (S) => S.parry({ dur: 0.6, n: 3, block: () => S.shout({ dur: 8 }) }),
  "S09+S13": (S) => S.parry({ dur: 0.6, block: () => S.focus(5) }),
  "S09+S14": (S) => S.parry({ dur: 0.6, block: () => S.crack({ n: 8, m: 1.4 }) }),
  "S09+S15": (S) => { let n = 0; S.parry({ dur: 0.8, n: 4, counter: 0, block: (at) => (n++, S.daggers({ n: 1, ang: angTo(S, at), homing: 6, m: 1.2 })) }); },
  "S09+S16": (S) => S.parry({ dur: 0.6, counter: 0, block: (at) => at && ((S.p.facing = dirTo(S, at)), S.kick({ n: 4, m: 0.9, up: 460, r: 50 })) }),
  "S09+S17": (S) => S.parry({ dur: 0.6, counter: 0, block: (at) => { if (!at) return; const [x, y] = S.tp(at); [-30, 30, 0].forEach((dx, k) => { S.ghost(x + dx, at.body.y - (k === 2 ? 40 : 0), dx > 0, 500); S.later(80, () => (S.slashAt(x, y, 22, -2 + k, 1 + k), S.hit(at, 1.2, { kb: 40 }))); }); } }),
  "S09+S18": (S) => S.parry({ dur: 0.6, counter: 0, block: (at) => S.snipe({ aim: 0, ang: angTo(S, at), m: 4.5 }) }),
  "S09+S19": (S) => S.parry({ dur: 0.7, n: 3, counter: 0, block: (at) => S.fanShot({ n: 5, ang: angTo(S, at), m: 1 }) }) || S.K.ent({ dur: 0.7, upd: () => S.sc.projectiles.list.forEach((q) => q.active && q.owner === "enemy" && Math.abs(q.x - S.p.cx) < 30 && Math.abs(q.y - S.p.cy) < 30 && (S.sc.projectiles.kill(q), S.fanShot({ n: 5, ang: angTo(S, S.T(1, 400)[0]), m: 0.8 }))) }),
  "S09+S20": (S) => S.parry({ dur: 0.6, block: (at) => at && S.trap(at.body.x, { y: at.body.y - 8, max: 6 }) }),
  "S09+S21": (S) => S.parry({ dur: 0.6, counter: 0, block: (at) => ((S.p.facing = dirTo(S, at)), S.bash({ m: 2, ho: { st: { stun: 1.5 } } })) }),
  "S09+S22": (S) => S.parry({ dur: 0.6, block: (at) => at && S.tryExec(at, 0.3, 1) }),
  "S09+S23": (S) => S.parry({ dur: 0.6, counter: 0, block: () => S.frenzy({ dur: 1.5, n: 9 }) }),
  "S09+S24": (S) => S.parry({ dur: 0.7, counter: 0, block: (at, dmg) => S.boomer({ ang: angTo(S, at), m: 1.8 + dmg / Math.max(1, S.B) * 0.5 }) }),

  // ── 도약베기 ──
  "S10+S10": (S) => S.leap({ apex: () => S.rep(2, 260, () => ((S.p.body.vy = -380), S.slashAt(S.p.cx + S.p.facing * 12, S.p.cy, 40, S.d > 0 ? -1.4 : PI + 1.4, S.d > 0 ? 1.2 : PI - 1.2), S.area(S.p.cx + S.p.facing * 20, S.p.cy, 44, 1.6))) }),
  "S10+S11": (S) => { const t = S.T(1, 300)[0]; t && (S.p.facing = dirTo(S, t)); const tx = t ? t.body.x : S.px + S.d * 160; S.bolt(S.p.cx, S.p.cy, tx, (t ? t.body.y - t.body.h : S.py - 80), "none", 1, 300); S.leap({ vx: Math.min(520, Math.abs(tx - S.p.cx) * 2.2), vy: -460, m: 2.4 }); },
  "S10+S12": (S) => S.leap({ vy: -520, apex: (x) => S.K.trect(x - 200, x + 200, S.p.cy, S.p.cy + 300).forEach((t) => S.fear(t, 2.5)) || S.shout({ r: 40, fear: 0 }) }),
  "S10+S13": (S) => { S.sc.fr.timeSlowT = 1; S.leap({ crit: 1, vy: -460 }); S.K.T?.(); S.T(8, 260).forEach((t) => t.statuses.apply({ type: "chill", chance: 1, dur: 1, power: 0.7 }, 0)); },
  "S10+S14": (S) => S.leap({ land: (x) => [-1, 1].forEach((d) => S.crack({ x, dir: d, n: 5 })) }),
  "S10+S15": (S) => S.leap({ apex: (x, y) => S.daggers({ n: 3, x, y, ang: S.d > 0 ? 1 : PI - 1, spread: 0.25, m: 0.8 }) }),
  "S10+S16": (S) => S.leap({ apex: () => ((S.p.body.vy = -260), S.kick({ n: 4, m: 0.8, up: 520 })) }),
  "S10+S17": (S) => { const x0 = S.px, y0 = S.fy, d = S.d; S.leap({ path: 1, m: 1.6 }); [1, 2].forEach((k) => S.later(k * 220, () => { let t = 0; const seen = new Set(); S.K.ent({ dur: 0.5, upd: (e, dt) => { t += dt; const gx = x0 + d * 320 * t, gy = y0 - 420 * t + 600 * t * t; S.ghost(gx, gy, d < 0, 160); S.K.tin(gx, gy - 14, 26).forEach((u) => seen.has(u) || (seen.add(u), S.hit(u, 1.2))); } }); })); },
  "S10+S18": (S) => S.leap({ vy: -500, vx: 120, apex: () => { S.K.ent({ dur: 0.6, upd: () => (S.p.body.vy = 0) }); S.snipe({ aim: 0.25, m: 4 }); } }),
  "S10+S19": (S) => S.leap({ vy: -500, apex: (x, y) => S.fanShot({ n: 7, x, y, ang: PI / 2 + (S.d > 0 ? -0.3 : 0.3), spread: 0.2, m: 0.8 }) }),
  "S10+S20": (S) => (S.trap(S.px, { max: 6 }), S.leap({})),
  "S10+S21": (S) => S.leap({ vy: -500, apex: () => S.bash({ m: 1.8, vy: 0, hit: (t) => t.kind !== "boss" && ((t.body.vy = 600), t.def?.flying && t.statuses.apply({ type: "stun", chance: 1, dur: 2 }, 0)) }) }),
  "S10+S22": (S) => S.leap({ path: 1, m: 1.4, hit: (t) => S.tryExec(t, 0.25, 0.5) }),
  "S10+S23": (S) => S.frenzy({ dur: 2.6, n: 16, air: 1 }),
  "S10+S24": (S) => S.leap({ vy: -500, apex: (x, y) => { const t = S.T(1, 200)[0]; S.shot({ spr: "p_blade", x, y, ang: angTo(S, t, x, y), speed: 600, scale: 1.8, pierce: 99, m: 2, life: 0.8 }); } }),

  // ── 갈고리 사슬 ──
  "S11+S11": (S) => { const ts = S.T(2, 300); ts.forEach((t) => S.hook({ t, m: 0.8 })); ts.length === 2 && S.later(160, () => { const [a, b] = ts; S.boom((a.body.x + b.body.x) / 2, a.body.y - 14, 30, 1.4, { el: S.el ?? "none" }); a.statuses.apply({ type: "stun", chance: 1, dur: 1.2 }, 0); b.statuses.apply({ type: "stun", chance: 1, dur: 1.2 }, 0); }); },
  "S11+S12": (S) => S.hook({ pulled: (t) => S.fear(t, 3) }),
  "S11+S13": (S) => S.hook({ pulled: () => S.focus(3) }),
  "S11+S14": (S) => S.hook({ pulled: (t) => S.later(150, () => { t.kind !== "boss" && (t.body.vy = 500); S.hit(t, 2, { kb: 0, heavy: 1 }); S.crack({ x: t.body.x, n: 6, m: 1 }); }) }),
  "S11+S15": (S) => { const t = S.T(1, 280)[0]; t && S.rep(5, 50, () => !t.dead && (S.slashAt(...S.tp(t), 16, -2, 1), S.hit(t, 0.4, { kb: 0 }))); S.hook({ t }); },
  "S11+S16": (S) => S.hook({ pulled: (t) => { if (t.kind === "boss") return; const C = { x: 0, y: 0 }; S.K.ent({ dur: 0.8, a: 0, upd: (e, dt) => { e.a += dt * 12; t.body.x = S.p.cx + Math.cos(e.a) * 40; t.body.y = S.p.body.y - 10 + Math.sin(e.a) * 16; S.K.tin(t.body.x, t.body.y - 10, 24).forEach((u) => u !== t && S.hit(u, 0.5, { kb: 300 })); }, end: () => ((t.body.vx = S.p.facing * 600), S.hit(t, 1.5, { kb: 400 })) }); } }),
  "S11+S17": (S) => S.T(4, 320).forEach((t, i) => S.later(i * 70, () => (i && S.ghost(S.p.cx + (i - 2) * 18, S.p.body.y, S.p.facing < 0, 500), S.hook({ t, m: 0.8 })))),
  "S11+S18": (S) => S.snipe({ aim: 0.4, m: 3.6, end: (ts) => S.later(150, () => ts.forEach((t, i) => t.kind !== "boss" && !t.dead && S.hook({ t, m: 0.3, toX: S.p.cx + S.p.facing * (22 + i * 16) }))) }),
  "S11+S19": (S) => S.K.trect(S.px, S.px + S.d * 220, S.fy - 90, S.fy + 10).forEach((t, i) => S.later(i * 40, () => S.hook({ t, m: 0.7, toX: S.p.cx + S.p.facing * (22 + i * 14) }))),
  "S11+S20": (S) => S.trap(S.px + S.d * 60, { max: 6, trigger: (z, ts) => ts.forEach((t) => S.hook({ t, m: 0.6 })) }),
  "S11+S21": (S) => S.hook({ pulled: (t) => S.later(120, () => S.bash({ m: 1.6, ho: { st: { stun: 2 } } })) }),
  "S11+S22": (S) => S.hook({ pulled: (t) => S.later(120, () => S.tryExec(t, 0.25, 1.5)) }),
  "S11+S23": (S) => S.frenzy({ dur: 2.4, n: 14, each: (t, i, ox, oy) => S.bolt(ox, oy, ...S.tp(t), "none", 1, 160) }),
  "S11+S24": (S) => S.boomer({ m: 1.8, hit: (t) => t.kind !== "boss" && (t._frHooked = 1), back: () => S.T(6, 400).filter((t) => t._frHooked).forEach((t) => ((t._frHooked = 0), S.hook({ t, m: 0.4 }))) }),

  // ── 전투 함성 ──
  "S12+S12": (S) => S.shout({ atk: 0.5, dur: 12, r: 120 }),
  "S12+S13": (S) => (S.shout({ dur: 8 }), S.focus(5)),
  "S12+S14": (S) => { const ts = S.shout({ fear: 2 }); S.later(200, () => (S.crack({ n: 7, m: 1.2 }), ts.forEach((t) => t.statuses.apply({ type: "stun", chance: 1, dur: 2 }, 0)))); },
  "S12+S15": (S) => (S.shout({}), S.daggers({ n: 3, m: 0.8, ho: { st: { fear: 2.5 } } })),
  "S12+S16": (S) => (S.shout({}), S.kick({ n: 4, m: 0.8, ho: { st: { armor: 0.5 } } })),
  "S12+S17": (S) => { S.shout({ atk: 0.6, dur: 8, r: 140 }); [-24, 24, 0].forEach((dx) => S.ghost(S.px + dx, S.fy, S.d < 0, 800, 0xff8060)); },
  "S12+S18": (S) => S.snipe({ aim: 0.4, m: 4, ho: { st: { fear: 3 } } }),
  "S12+S19": (S) => S.fanShot({ n: 5, m: 0.9, ho: { st: { fear: 3 } } }),
  "S12+S20": (S) => S.shout({ fear: 2.5 }).forEach((t, i) => S.later(300, () => !t.dead && S.trap(t.body.x + Math.sign(t.body.x - S.p.cx) * 60, { max: 6, y: t.body.y - 8 }))),
  "S12+S21": (S) => (S.shout({ r: 50 }), S.bash({ m: 1.6, ho: { st: { fear: 2.5 } } })),
  "S12+S22": (S) => S.execute({ kill: () => S.T(10, 220).forEach((t) => S.fear(t, 3)) }),
  "S12+S23": (S) => (S.shout({ dur: 8 }), S.frenzy({ dur: 2.6 })),
  "S12+S24": (S) => (S.p.buff("atk", 6, 0.4, "berserk", "도전"), S.boomer({ m: 1.8, hit: (t) => (t.statuses.apply({ type: "armorBreak", chance: 1, dur: 4, power: 0.3 }, 1), S.text(t.body.x, t.body.y - t.body.h - 12, "도발", "#ff8060")) })),

  // ── 집중 ──
  "S13+S13": (S) => (S.focus(6), S.p.buff("crit", 10, 0.3, "crit", "명경")),
  "S13+S14": (S) => S.crack({ n: 8, m: 1.2, ho: { crit: 1 } }),
  "S13+S15": (S) => { const t = S.T(1, 320)[0]; S.daggers({ n: 3, seq: 0.08, spread: 0, ang: angTo(S, t), homing: 8, m: 1, ho: { crit: 1 } }); },
  "S13+S16": (S) => S.kick({ n: 4, m: 0.9, crit: () => 1 }),
  "S13+S17": (S) => (S.focus(3), S.afterimages({ n: 3, hits: 9, m: 0.6, ho: { crit: 1 } })),
  "S13+S18": (S) => S.snipe({ aim: 0, m: 4.5, crit: 1 }),
  "S13+S19": (S) => S.fanShot({ n: 5, m: 1, crit: 1 }),
  "S13+S20": (S) => S.trap(S.px + S.d * 50, { max: 6, trigger: (z, ts) => ts.forEach((t) => ((t._frVoid = Date.now() + 3000), S.text(t.body.x, t.body.y - t.body.h - 12, "급소 노출", "#ffd84a"), S.focus(3))) }),
  "S13+S21": (S) => S.bash({ hit: () => S.focus(1) }),
  "S13+S22": (S) => S.execute({ th: 0.35, crit: 1 }),
  "S13+S23": (S) => S.frenzy({ crit: 1 }),
  "S13+S24": (S) => { const t = low(S); S.boomer({ ang: angTo(S, t), m: 2, crit: 1, stopOut: (P) => t && !t.dead && Math.hypot(P.x - t.body.x, P.y - t.body.y + t.body.h / 2) < 14 }); },

  // ── 지면 강타 ──
  "S14+S14": (S) => [-1, 1].forEach((d) => S.crack({ dir: d, n: 14, m: 1.1 })),
  "S14+S15": (S) => { S.crack({ n: 3, m: 0.8 }); S.later(200, () => { for (let i = 0; i < 6; i++) S.shot({ spr: "pebble", el: "earth", ang: fwd(S) + (i - 2.5) * 0.12, speed: 480, scale: 2.2, m: 0.7, life: 0.9, spin: 10 }); }); },
  "S14+S16": (S) => S.kick({ n: 4, m: 0.7, end: (x) => S.spikeRing(x, 50, 10, { el: S.el ?? "earth", m: 0.8, st: { stun: 0.6 } }) }),
  "S14+S17": (S) => S.rep(4, 260, (k) => { S.ghost(S.p.cx + (k - 1.5) * 20, S.p.body.y, S.p.facing < 0, 400); S.crack({ x: S.p.cx + S.p.facing * 20, n: 7, m: 0.9 }); S.shake(3); }),
  "S14+S18": (S) => (S.crack({ n: 12, m: 0.8, ho: { gap: 26 } }), S.snipe({ aim: 0.3, y: S.fy - 8, m: 3, w: 6 })),
  "S14+S19": (S) => [-0.5, -0.25, 0, 0.25, 0.5].forEach((a, k) => S.rep(6, 55, (i) => { const x = S.p.cx + S.p.facing * (24 + i * 24) * Math.cos(a) + 0 * k; const y = S.p.body.y - 8 + Math.sin(a) * i * 10; S.spikes(x, 1, 1, { y, el: S.el, m: 0.6, st: { stun: 0.5 } }); })),
  "S14+S20": (S) => S.crack({ n: 7, m: 1, each: (x, gy, i) => i === 6 && S.trap(x + S.p.facing * 20, { y: gy - 8, max: 6, root: 3 }) }),
  "S14+S21": (S) => S.bash({ dur: 0.2, path: [0.04, (x) => S.spikes(x, 1, 1, { el: S.el, m: 0.6, st: { stun: 0.5 } })] }),
  "S14+S22": (S) => S.crack({ n: 7, m: 1, hit: (t) => S.tryExec(t, 0.25, 0) }),
  "S14+S23": (S) => S.frenzy({ each: (t) => S.spikes(t.body.x, 1, 1, { el: S.el, y: t.body.y - 8, m: 0.4 }) }),
  "S14+S24": (S) => S.boomer({ noReturn: 1, dist: 160, ang: S.d > 0 ? 0.3 : PI - 0.3, out: (x, y) => { const gy = S.gy(x, y); S.spikeRing(x, 70, 10, { el: S.el, m: 0.9, y: gy - 8 }); [-1, 1].forEach((d) => S.crack({ x, dir: d, n: 4, y: gy - 8 })); } }),

  // ── 단검 투척 ──
  "S15+S15": (S) => S.daggers({ n: 9, spread: 0.16 }),
  "S15+S16": (S) => S.kick({ n: 2, m: 0.6, end: () => S.daggers({ n: 3, spin: 20, speed: 520, m: 1, pierce: 3 }) }),
  "S15+S17": (S) => { S.daggers({ n: 3 }); [-1, 1, 2].forEach((k) => { const ox = k * 18, oy = k === 2 ? -16 : 0; S.ghost(S.px + ox, S.fy + oy, S.d < 0, 600); S.daggers({ n: 3, x: S.px + ox, y: S.py + oy, m: 0.5 }); }); },
  "S15+S18": (S) => S.daggers({ n: 3, pierce: 99, life: 1.6, speed: 600, noTerrain: 1, m: 0.9 }),
  "S15+S19": (S) => S.daggers({ n: 8, spread: 0.14, m: 0.6 }),
  "S15+S20": (S) => S.daggers({ n: 3, ang: fwd(S) + S.d * 0.35, spread: 0.2, m: 0.6, end: (x, y) => S.trap(x, { y, max: 6 }) }),
  "S15+S21": (S) => S.bash({ hit: (t) => S.later(120, () => S.daggers({ n: 3, spread: 0.1, ang: angTo(S, t), m: 0.8 })) }),
  "S15+S22": (S) => S.daggers({ n: 3, m: 0.8, hit: (t) => S.tryExec(t, 0.25, 0) }),
  "S15+S23": (S) => S.frenzy({ each: (t, i, ox, oy) => S.daggers({ n: 1, x: ox, y: oy, ang: angTo(S, t, ox, oy), m: 0.5 }) }),
  "S15+S24": (S) => (S.boomer({ m: 1.8 }), S.daggers({ n: 6, spread: 0.18, m: 0.6 })),

  // ── 회오리 발차기 ──
  "S16+S16": (S) => S.kick({ n: 8, m: 0.7, pull: 1, r: 50 }),
  "S16+S17": (S) => { S.kick({ n: 4 }); [-60, 60, S.d * 110].forEach((dx) => { const x = S.px + dx, y = S.py; S.ghost(x, S.fy, S.d < 0, 600); S.kick({ n: 4, m: 0.5, at: () => ({ x, y }) }); }); },
  "S16+S18": (S) => S.kick({ n: 4, m: 0.6, end: () => [0, PI / 2, PI, -PI / 2].forEach((a) => S.snipe({ aim: 0, ang: a, m: 2, len: 300, w: 6 })) }),
  "S16+S19": (S) => S.kick({ n: 4, m: 0.6, each: (x, y, i) => S.fanShot({ n: 6, x, y, ang: i * 0.5, spread: PI / 3, m: 0.4 }) }),
  "S16+S20": (S) => S.kick({ n: 4, m: 0.7, up: 420, hit: (t) => S.later(500, () => !t.dead && S.trap(t.body.x, { max: 6 })) }),
  "S16+S21": (S) => S.dash({ dur: 0.35, spd: 420, m: 1, ho: { up: 420 }, path: [0.08, (x, y) => S.slashAt(S.p.cx, S.p.cy, 30, Math.random() * 6, Math.random() * 6 + 4)] }),
  "S16+S22": (S) => S.kick({ n: 4, m: 0.6, end: (x, y) => S.K.tin(x, y, 50).forEach((t) => S.tryExec(t, 0.25, 0.8)) }),
  "S16+S23": (S) => S.frenzy({ end: () => S.kick({ n: 5, r: 110, m: 1, up: 600 }) }),
  "S16+S24": (S) => S.kick({ n: 2, m: 0.5, end: () => S.boomer({ m: 2, scale: 2.2 }) }),

  // ── 잔상 연격 ──
  "S17+S17": (S) => S.afterimages({ n: 6, hits: 16, m: 0.5 }),
  "S17+S18": (S) => [-0.25, 0, 0.25].forEach((a, k) => { S.ghost(S.px - S.d * 20, S.fy - k * 20, S.d < 0, 900); S.snipe({ aim: 0.4, x: S.px, y: S.py - 20 + k * 20, ang: fwd(S) + a, m: 2.6 }); }),
  "S17+S19": (S) => [0, 1, 2].forEach((k) => { const x = S.px + (k - 1) * 30, y = S.py - (k === 1 ? 24 : 0); S.ghost(x, y + 9, S.d < 0, 800); S.later(k * 100, () => S.fanShot({ n: 5, x, y, m: 0.6 })); }),
  "S17+S20": (S) => S.afterimages({ n: 3, hits: 9 }) || [-22, 0, 22].forEach((dx) => S.later(900, () => S.trap(S.px + dx, { max: 6 }))),
  "S17+S21": (S) => [0, 1, 2].forEach((k) => S.later(k * 180, () => { S.ghost(S.p.cx, S.p.body.y, S.p.facing < 0, 300); S.K.trect(S.p.cx, S.p.cx + S.p.facing * 60, S.p.body.y - 40, S.p.body.y + 4).forEach((t) => S.hit(t, 1.2, { kb: 420 + k * 200 })); S.snd("dash"); })),
  "S17+S22": (S) => S.T(4, 360).filter((t) => t.hp / t.maxHp <= 0.25).slice(0, 3).forEach((t, i) => S.later(i * 120, () => { S.ghost(t.body.x - 14, t.body.y, !1, 400); S.tryExec(t, 0.25, 1.5, { reset: 0 }); })) ?? S.afterimages({}),
  "S17+S23": (S) => S.frenzy({ dur: 2.8, n: 18, each: (t) => { S.ghost(t.body.x + 16, t.body.y, !0, 300); S.later(80, () => S.hit(t, 0.3, { kb: 0 })); } }),
  "S17+S24": (S) => [-0.3, -0.1, 0.1, 0.3].forEach((a) => S.boomer({ ang: fwd(S) + a, m: 1.2, scale: 1.5 })),

  // ── 관통 사격 ──
  "S18+S18": (S) => S.snipe({ aim: 0.5, m: 4, end: () => S.later(120, () => S.snipe({ aim: 0, m: 4 })) }),
  "S18+S19": (S) => { S.fanShot({ n: 5, m: 0.8 }); S.later(300, () => [-0.3, -0.15, 0, 0.15, 0.3].forEach((a) => S.snipe({ aim: 0, ang: fwd(S) + a, m: 1.4, w: 5 }))); },
  "S18+S20": (S) => S.snipe({ aim: 0.5, m: 4, end: () => [1, 2, 3, 4].forEach((k) => S.trap(S.p.cx + S.p.facing * k * 50, { max: 6 })) }),
  "S18+S21": (S) => S.snipe({ aim: 0.5, m: 4, end: () => S.dash({ dir: -S.p.facing, dur: 0.14, spd: 520, m: 1.4, kb: 300 }) }),
  "S18+S22": (S) => S.snipe({ aim: 0.5, m: 4, hit: (t) => S.tryExec(t, 0.25, 0) }),
  "S18+S23": (S) => { let last = S.p.facing; S.frenzy({ each: () => { S.p.facing !== last && S.snipe({ aim: 0, m: 1.2, w: 5, len: 400 }); last = S.p.facing; } }); },
  "S18+S24": (S) => S.boomer({ dist: 600, speed: 800, m: 3, scale: 2, spin: 0 }),

  // ── 부채꼴 사격 ──
  "S19+S19": (S) => S.fanShot({ n: 11, spread: 0.28 }),
  "S19+S20": (S) => S.fanShot({ n: 5, ang: fwd(S) + S.d * 0.3, m: 0.8, end: (x, y) => S.trap(x, { y, max: 6 }) }),
  "S19+S21": (S) => S.bash({ end: () => S.fanShot({ n: 5, m: 1 }) }),
  "S19+S22": (S) => S.fanShot({ n: 5, m: 0.9, hit: (t) => S.tryExec(t, 0.2, 0) }),
  "S19+S23": (S) => S.frenzy({ each: (t, i) => i % 2 === 0 && S.fanShot({ n: 5, m: 0.4, ang: angTo(S, t) }) }),
  "S19+S24": (S) => S.boomer({ noReturn: 1, dist: 140, out: (x, y) => S.fanShot({ n: 5, x, y, m: 1 }) }),

  // ── 덫 설치 ──
  "S20+S20": (S) => S.trap(S.px + S.d * 20, { max: 6, root: 4 }),
  "S20+S21": (S) => S.bash({ m: 1.4, hit: (t) => { const tr = S.sc.fr.zones.filter((z) => z.kind === "trap" && z.armed !== !1).sort((a, b) => Math.abs(a.x - t.body.x) - Math.abs(b.x - t.body.x))[0]; tr ? t.kind !== "boss" && (t.body.x = tr.x) : S.trap(t.body.x + S.p.facing * 40, { max: 6 }); } }),
  "S20+S22": (S) => S.trap(S.px + S.d * 20, { max: 6, trigger: (z, ts) => ts.forEach((t) => S.tryExec(t, 0.3, 0)) }),
  "S20+S23": (S) => S.frenzy({ each: (t, i, ox) => i % 3 === 0 && S.trap(ox, { max: 6 }) }),
  "S20+S24": (S) => S.boomer({ noReturn: 1, ang: S.d > 0 ? 0.35 : PI - 0.35, dist: 140, out: (x, y) => S.trap(x, { y, max: 6 }) }),

  // ── 어깨 박치기 ──
  "S21+S21": (S) => { let k = 0; const go = () => S.bash({ m: 1.5 + k * 0.3, ho: k === 2 ? { st: { stun: 2 } } : {}, end: () => ++k < 3 && S.later(120, go) }); go(); },
  "S21+S22": (S) => S.bash({ hit: (t) => S.later(150, () => S.tryExec(t, 0.25, 1)) }),
  "S21+S23": (S) => { let k = 0; const go = () => { const t = S.T(1, 400)[0]; t && (S.p.facing = dirTo(S, t)); S.bash({ m: 1.2, kb: 900, end: () => ++k < 8 && go() }); }; go(); },
  "S21+S24": (S) => S.bash({ hit: (t) => S.later(120, () => S.boomer({ ang: angTo(S, t), m: 1.8 })) }),

  // ── 처형 ──
  "S22+S22": (S) => S.execute({ th: 0.35, kill: () => S.healAmt(S.p.maxHp * 0.05) }),
  "S22+S23": (S) => S.frenzy({ each: (t) => S.tryExec(t, 0.25, 0, { reset: 0 }) }),
  "S22+S24": (S) => { const t = low(S); S.boomer({ ang: angTo(S, t), m: 1.4, hit: (u) => S.tryExec(u, 0.25, 0.6) }); },

  // ── 질풍난무 ──
  "S23+S23": (S) => S.frenzy({ dur: 4, n: 25, end: (x) => S.tornado(x, { vx: 0, dur: 3, scale: 1.3, el: S.el ?? "wind", m: 0.4 }) }),
  "S23+S24": (S) => S.frenzy({ dur: 2.6, n: 14, each: (t, i) => i % 3 === 0 && S.boomer({ dist: 120, m: 0.8, scale: 1.3 }) }),

  // ── 무기 투척 ──
  "S24+S24": (S) => { S.boomer({ ang: fwd(S) - 0.35 * S.d, m: 1.6, tick: (P, dt) => (P.vy += 260 * dt) }); S.boomer({ ang: fwd(S) + 0.35 * S.d, m: 1.6, tick: (P, dt) => (P.vy -= 260 * dt) }); },

  // ── 반격 스킬 (스킬 + 방어구) ──
  "S09+A11": (S) => S.parry({ dur: 0.8, n: 6, m: 2, block: (at, dmg) => at && S.hit(at, 1 + dmg / Math.max(1, S.B), { kb: 300 }) }),
  "S21+A10": (S) => S.dash({ dur: 0.3, spd: 560, m: 1.8, kb: 500, clear: 1 }) || S.parry({ dur: 0.35, n: 5, counter: 0 }),
  "S07+A07": (S) => S.tele({ arrive: () => { S.p.iframes = Math.max(S.p.iframes, 2); S.p.sprite?.setAlpha?.(0.3); S.later(2000, () => S.p.sprite?.setAlpha?.(1)); S.text(S.p.cx, S.p.body.y - 34, "은신", "#c090ff"); } }),
  "S01+A09": (S) => (S.parry({ dur: 0.6, n: 5, m: 1.5 }), S.spin({ n: 5, m: 0.6 })),
  "S13+A14": (S) => { S.focus(3); S.parry({ dur: 5, n: 3, counter: 0, block: () => (S.ghost(S.p.body.x, S.p.body.y, S.p.facing < 0, 300, 0xa0ffe0), S.text(S.p.cx, S.p.body.y - 34, "회피", "#c8ffe0")) }); },
  "S12+A03": (S) => (S.shout({ dur: 6 }), S.p.buff("dmgReduce", 6, 0.3, "shield", "강철 의지"), (S.p.iframes = Math.max(S.p.iframes, 0.2))),
  "S10+A19": (S) => S.leap({ vy: -500, apex: () => S.K.ent({ dur: 1.4, tk: 0, upd: (e, dt) => { S.p.body.vy = Math.min(S.p.body.vy, 60); S.p.body.vx = S.p.facing * 200; (e.tk -= dt) <= 0 && ((e.tk = 0.2), S.shot({ spr: "leaf", el: S.el ?? "wind", x: S.p.cx, y: S.p.cy + 8, ang: PI / 2, speed: 420, scale: 2.4, m: 0.6, life: 0.6 })); } }) }),
  "S14+A20": (S) => S.rep(6, 500, () => (S.ring(S.p.cx, S.p.body.y - 4, 70, S.el ?? "earth"), S.area(S.p.cx, S.p.body.y - 6, 70, 0.8, { kb: 300, up: 120 }), S.shake(3), S.p.buff("dmgReduce", 0.6, 0.1, "shield", "골렘"))),
  "S22+A13": (S) => S.execute({ kill: (t) => S.summon(t.body.x, t.body.y, "skel", 10) }),
  "S20+A18": (S) => { const z = S.trap(S.px + S.d * 30, { max: 6, trigger: (zz, ts) => { const els = ["fire", "ice", "lightning", "poison", "dark"]; S.boom(zz.x, zz.y - 10, 50, 1.4, { el: S.el ?? "transmute" }); ts.forEach((t) => els.forEach((e) => S.K.applyEl(t, e))); } }); },
  "S23+A06": (S) => S.frenzy({ end: () => { const p = S.p; const old = p.stats.dashCd; p.stats.dashCd = 0.05; S.later(5000, () => (p.stats.dashCd = old)); S.text(p.cx, p.body.y - 34, "대시 무제한", "#c8ffe0"); } }),
  "S08+A02": (S) => S.iaido({ m: 5 }),
  "S09+A08": (S) => S.parry({ dur: 0.6, m: 2.5, block: (at) => at && (at.kind !== "boss" && (at.body.vx = S.p.facing * 700), at.statuses.apply({ type: "stun", chance: 1, dur: 1 }, 0)) }),
  "S06+A12": (S) => (S.p.buff("dmgReduce", 1.6, 0.5, "shield", "비늘"), S.rapid({ n: 12, dur: 1.6 })),
  "S11+A15": (S) => { const t = S.T(1, 300)[0]; const tx = t ? t.body.x : S.px + S.d * 200, ty = t ? t.body.y - 40 : S.py - 120; S.bolt(S.p.cx, S.p.cy, tx, ty, "none", 1, 300); S.p.body.vx = (tx - S.p.cx) * 3.5; S.p.body.vy = -460; S.p.iframes = Math.max(S.p.iframes, 0.4); S.snd("dash"); },
  "S16+A16": (S) => S.kick({ n: 4, m: 0.8, end: (x, y) => S.cloud(x, y, 90, 3, { el: "blizzard", m: 0.12, st: { chill: 1 }, fx: "star", fxEl: "ice" }) }),
};
