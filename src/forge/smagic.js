// 마법 기술(스킬 + 마법) 768종: 스킬 동작에 설명이 말하는 순간·위치로 진짜 마법 모양을 얹는다.
const PI = Math.PI;
const near = (S, x, y, r = 240) => S.T(1, r, x, y)[0];
const angTo = (S, x, y, t) => (t ? Math.atan2(t.body.y - t.body.h / 2 - y, t.body.x - x) : S.p.facing > 0 ? 0 : PI);

// 마법 하나를 한 지점에 (작은 규모)
const EMIT = {
  M01: (S, x, y, o) => S.shot({ spr: "flame", x, y, ang: o.ang, speed: 380, scale: 1.4, m: 0.8, end: (ex, ey) => S.boom(ex, ey, 36, 0.8) }),
  M02: (S, x, y, o) => S.aura({ at: !o.self, x, y, R: 36, dur: 2.5, m: 0.4, st: { burn: 1 } }),
  M03: (S, x, y, o) => S.stream({ from: () => ({ x, y }), ang: o.ang, len: 80, dur: 0.6, n: 8, m: 0.2, st: { burn: 0.6 } }),
  M04: (S, x, y, o) => S.drop(o.t ? o.t.body.x : x, { y: o.t ? o.t.body.y - 8 : y + 10, scale: 1.8, r: 44, m: 1.4, h: 260 }),
  M05: (S, x, y, o) => S.shot({ spr: "spear", x, y, ang: o.ang, speed: 520, pierce: 99, scale: 1.3, m: 0.8, st: { chill: 2 } }),
  M06: (S, x, y) => S.nova(x, y, 70, 0.6, { st: { chill: 2 } }),
  M07: (S, x, y) => S.wall(x, { y, dur: 4, sy: 0.8, m: 0.4 }),
  M08: (S, x, y, o) => S.shot({ spr: "orb", x, y, ang: o.ang, speed: 120, life: 2.4, pierce: 99, noTerrain: 1, scale: 1.4, m: 0.4, st: { chill: 1 }, tick: (P) => S.K.tin(P.x, P.y, 40).forEach((t) => Math.random() < 0.05 && S.st(t, { chill: 1 })) }),
  M09: (S, x, y, o) => { const t = o.t ?? near(S, x, y, 260); const [tx, ty] = t ? S.tp(t) : [x + Math.cos(o.ang) * 200, y + Math.sin(o.ang) * 200]; S.bolt(x, y, tx, ty, void 0, 3, 200); t && S.hit(t, 0.9, { kb: 80 }); S.snd("lightning", 0.6); },
  M10: (S, x, y, o) => { const t = o.t ?? near(S, x, y, 200); S.strike(t ? t.body.x : x, { y: t ? t.body.y - 8 : y + 10, cloud: 0, delay: 80, m: 1.1 }); },
  M11: (S, x, y) => S.chain(x, y, 4, { m: 0.6, r: 160 }),
  M12: (S, x, y) => S.turret(x, y - 10, { spr: "orb", scale: 1.2, dur: 3, every: 0.45, fn: (cx, cy) => S.T(2, 80, cx, cy).forEach((t) => (S.bolt(cx, cy, ...S.tp(t), void 0, 2, 150), S.hit(t, 0.3, { kb: 0, noCrit: 1 }))) }),
  M13: (S, x, y, o) => S.shot({ spr: "blade", x, y, ang: o.ang, speed: 540, life: 0.7, pierce: 3, scale: 1.2, noTerrain: 1, m: 0.8 }),
  M14: (S, x) => S.tornado(x, { vx: 0, dur: 2, scale: 1, m: 0.35 }),
  M15: (S, x, y) => S.gust({ x, y, w: 110, m: 0.6, kb: 500 }),
  M16: (S, x, y, o) => S.updraft({ x, gy: S.gy(x, y), self: o.self ? 1 : 0, vy: -560, m: 0.5, r: 50 }),
  M17: (S, x, y, o) => S.shot({ spr: "rock", x, y, ang: Math.cos(o.ang) >= 0 ? -0.4 : PI + 0.4, speed: 340, grav: 620, scale: 1.3, spin: 9, m: 1, end: (ex, ey) => S.boom(ex, ey, 34, 0.7, { el: "earth" }) }),
  M18: (S, x, y) => S.spikes(x - S.d * 20, S.d, 3, { y, m: 0.6 }),
  M19: (S, x, y) => (S.shake(5, 300), S.fissure(x, S.gy(x, y), 90), S.area(x, y, 110, 0.7, { up: 200, st: { stun: 0.4 } })),
  M20: (S, x, y, o) => S.hand(o.t ? o.t.body.x : x, { t: o.t, y, m: 0.6, grab: 1.6 }),
  M21: (S, x, y, o) => S.fan(3, 0.12, { spr: "needle", x, y, ang: o.ang, speed: 520, life: 0.8, scale: 1.2, m: 0.4, st: { poison: 2 } }),
  M22: (S, x, y) => S.cloud(x, y, 50, 4, { m: 0.12, st: { poison: 1 } }),
  M23: (S, x, y, o) => { const t = o.t ?? near(S, x, y, 160); t && (S.st(t, { rot: 0.3 }), S.puff("bubble", ...S.tp(t), 10)); },
  M24: (S, x, y) => S.pool(x, 50, 5, { y, m: 0.12, slow: 1, st: { poison: 1 }, fx: "bubble" }),
  M25: (S, x, y, o) => S.shot({ spr: "spear", x, y, ang: o.ang, speed: 560, pierce: 99, scale: 1.4, m: 0.9, undead: 2 }),
  M26: (S, x, y) => (S.healAmt(S.p.maxHp * 0.04), S.puff("star", S.p.cx, S.p.cy, 6), S.K.tin(x, y, 80).forEach((t) => S.st(t, { mark: 1 }))),
  M27: (S, x, y) => S.flashAll({ x, y, r: 100, stun: 1.2, m: 0.3, ms: 140 }),
  M28: (S, x, y, o) => S.pillar(o.t ? o.t.body.x : x, { y: o.t ? o.t.body.y - 8 : y + 10, delay: 220, w: 12, m: 1.1 }),
  M29: (S, x, y, o) => S.shot({ spr: "orb", x, y, ang: o.ang, speed: 220, homing: 3, life: 2.2, noTerrain: 1, scale: 1.2, spin: 6, m: 0.9 }),
  M30: (S, x, y, o) => { const t = o.t ?? near(S, x, y, 200); t && S.hit(t, 0.8, { kb: 0, drain: 0.3, drainFx: 1 }); },
  M31: (S, x, y, o) => { const t = o.t ?? near(S, x, y, 200); t && S.st(t, { curse: 0.4, curseDur: 6 }); },
  M32: (S, x, y) => S.vortex(x, y, { dur: 1.8, r: 100, m: 0.3, force: 1100 }),
};
const POINTY = new Set(["M02", "M04", "M06", "M07", "M10", "M12", "M14", "M16", "M18", "M19", "M20", "M22", "M24", "M26", "M27", "M28", "M32"]);

function parse(d) {
  let when = "start";
  if (/처치|처형한|죽은|쓰러뜨린/.test(d)) when = "kill";
  else if (/경로|지나간|자리마다|길에|궤적|따라오|따라다/.test(d)) when = "path";
  else if (/맞은 적|닿은|부딪힌|벤 적|띄운 적|처형 대상|꽂힌|적중|붙잡힌|묶인|끌려온|끌어온 적|공격자/.test(d)) when = "hit";
  else if (/끝나|끝에|끝날|마지막|착지|도착|멈춘|떨어진 자리|박힌 자리|박힌다|맺혀|남긴다|남는다|후 |뒤 |성공 시/.test(d)) when = "end";
  else if (/동안|하며|하는 중|중 |마다|함께/.test(d)) when = "during";
  const cnt = d.match(/(\d+)\s*(개|발|번|갈래|체|방향)/);
  const every = d.match(/(\d+)\s*(회|번|타)마다/);
  const spread = /사방|원형|둘레|주변|네 방향|양옆|양쪽/.test(d);
  const fan = /부채꼴/.test(d);
  const self = /나를|몸을|몸 주위|내 주위|머리 위|나는|내가/.test(d);
  return { when, n: cnt ? Math.min(8, Number(cnt[1])) : 0, every: every ? Number(every[1]) : 0, spread, fan, self };
}

export function runSM(S, it) {
  const mid = it.secondary, sid = it.primary;
  const E = EMIT[mid];
  const P = parse(it.desc ?? "");
  const MOVING = new Set(["S02", "S05", "S10", "S14", "S21", "S23", "S24", "S06"]);
  if (P.when === "path" && !MOVING.has(sid)) P.when = "during";
  let budget = P.when === "path" ? 10 : 8;
  let lastT = 0;
  const seen = new Set();
  const fire = (x, y, o = {}) => {
    if (!E || budget <= 0) return;
    const n = Math.max(1, o.n ?? 1);
    for (let i = 0; i < n && budget > 0; i++) {
      budget--;
      let ex = x, ey = y, ang = o.ang ?? angTo(S, x, y, o.t ?? near(S, x, y, 260));
      if (n > 1) {
        if (P.fan) ang = (S.p.facing > 0 ? 0 : PI) + (i - (n - 1) / 2) * 0.3;
        else if (POINTY.has(mid)) ex = x + Math.cos((i / n) * PI * 2) * (40 + n * 6);
        else ang = (i / n) * PI * 2;
      }
      E(S, ex, ey, { ang, t: n > 1 ? null : o.t, self: P.self });
    }
  };
  const many = (P.n > 1 ? P.n : P.spread ? 4 : 1);
  const H = {
    start: () => P.when === "start" && fire(S.p.cx + S.p.facing * 10, S.p.cy - 4, { n: many }),
    tick: (x, y, i = 0) => {
      if (P.when !== "during" && P.when !== "path") return;
      if (P.every ? (i + 1) % P.every !== 0 : S.sc.time.now - lastT < 260) return;
      lastT = S.sc.time.now;
      fire(x, y, { n: P.every ? many : 1 });
    },
    path: (x, y) => {
      if (P.when !== "path" && P.when !== "during") return;
      if (S.sc.time.now - lastT < (P.when === "path" ? 90 : 260)) return;
      lastT = S.sc.time.now;
      fire(x, y);
    },
    hit: (t) => {
      if (!t) return;
      if (P.when === "kill") return void (t.dead && !seen.has(t) && (seen.add(t), fire(...S.tp(t), { t })));
      if (P.when !== "hit" || seen.has(t)) return;
      seen.add(t);
      fire(...S.tp(t), { t });
    },
    end: (x, y) => P.when === "end" && fire(x, y, { n: many }),
  };
  const run = SKILL[sid];
  if (!run) return void fire(S.p.cx, S.p.cy);
  H.start();
  run(S, H);
}

// 스킬 동작 + 마법을 얹을 지점
const SKILL = {
  S01: (S, H) => S.spin({ each: (x, y, i) => H.tick(x, y, i), hit: H.hit, end: H.end }),
  S02: (S, H) => S.dash({ path: [0.06, (x, y) => H.path(x, y - 12)], hit: H.hit, end: (x, y) => H.end(x, y - 12) }),
  S03: (S, H) => S.slam({ falling: (x, y) => H.tick(x, y), hit: H.hit, land: (x, y) => H.end(x, y - 10) }),
  S04: (S, H) => (S.launch({ hit: H.hit }), H.tick(S.p.cx + S.d * 20, S.p.cy), H.end(S.p.cx + S.d * 30, S.p.cy - 10)),
  S05: (S, H) => S.wave({ hit: H.hit, drip: [0.08, (x, y) => H.path(x, y)], end: (x, y) => H.end(x, y) }),
  S06: (S, H) => S.rapid({ each: (i, x, y) => (H.tick(x, y, i), H.path(S.p.cx, S.p.body.y - 8)), hit: H.hit, end: (x, y) => H.end(S.p.cx + S.p.facing * 40, y) }),
  S07: (S, H) => S.tele({ arrive: (t) => (H.hit(t), H.end(S.p.cx, S.p.cy)), none: (x, y) => H.end(x, y - 12) }),
  S08: (S, H) => (H.tick(S.p.cx + S.d * 40, S.p.cy), S.iaido({ hit: H.hit, cut: (ts, x1, y1) => (ts.forEach((t, i) => H.path(...S.tp(t))), H.end(x1, y1)) })),
  S09: (S, H) => S.parry({ block: (at) => (at ? (H.hit(at), H.end(...S.tp(at))) : H.end(S.p.cx, S.p.cy)) }),
  S10: (S, H) => S.leap({ hit: H.hit, apex: (x, y) => (H.tick(x, y), H.path(x, y)), land: (x, y) => H.end(x, y - 10) }),
  S11: (S, H) => { const t = S.hook({ pulled: (u) => (H.hit(u), H.end(...S.tp(u))) }); t || H.end(S.p.cx + S.p.facing * 120, S.p.cy); },
  S12: (S, H) => { S.shout({ hit: H.hit }); S.rep(6, 1200, () => H.tick(S.p.cx, S.p.cy - 20)); H.end(S.p.cx, S.p.cy); },
  S13: (S, H) => { S.focus(3); S.rep(4, 800, () => H.tick(S.p.cx, S.p.cy - 10)); S.later(3000, () => H.end(S.p.cx, S.p.cy)); },
  S14: (S, H) => { let lx = S.p.cx, ly = S.p.cy; S.crack({ each: (x, gy, i) => (H.tick(x, gy - 12, i), H.path(x, gy - 12), (lx = x), (ly = gy - 12)), hit: H.hit }); S.later(420, () => H.end(lx, ly)); },
  S15: (S, H) => S.daggers({ hit: H.hit, end: (x, y) => H.end(x, y) }),
  S16: (S, H) => S.kick({ each: (x, y, i) => H.tick(x, y, i), hit: H.hit, end: H.end }),
  S17: (S, H) => { S.afterimages({}); [-22, 0, 22].forEach((dx, i) => S.later(200 + i * 120, () => { H.tick(S.p.cx + dx, S.p.cy, i); S.K.tin(S.p.cx + dx + S.p.facing * 26, S.p.cy, 30).forEach(H.hit); })); S.later(900, () => H.end(S.p.cx, S.p.cy)); },
  S18: (S, H) => S.snipe({ hit: H.hit, end: () => H.end(S.p.cx + S.p.facing * 300, S.p.cy - 4) }),
  S19: (S, H) => S.fanShot({ hit: H.hit, end: (x, y) => H.end(x, y) }),
  S20: (S, H) => { const x = S.p.cx + S.p.facing * 20; H.tick(x, S.gy(x) - 16); S.trap(x, { trigger: (z, ts) => (ts.forEach(H.hit), H.end(z.x, z.y - 12)) }); },
  S21: (S, H) => S.bash({ path: [0.04, (x, y) => H.path(x, y - 12)], hit: (t) => (H.hit(t), S.later(500, () => t.dead || H.end(...S.tp(t)))), end: (x, y) => H.end(x + S.p.facing * 20, y - 12) }),
  S22: (S, H) => { const ts = S.execute({ kill: H.hit }); ts.forEach(H.hit); H.end(S.p.cx + S.p.facing * 30, S.p.cy); },
  S23: (S, H) => S.frenzy({ each: (t, i, ox, oy) => (H.tick(...S.tp(t), i), H.path(ox, oy), H.hit(t)), end: H.end }),
  S24: (S, H) => S.boomer({ hit: H.hit, tick: (P) => H.path(P.x, P.y), out: (x, y) => H.end(x, y) }),
};
