// 융합 마법 528종 전용 주문 — 설명에 적힌 그대로 움직이도록 하나하나 짠 연출.
// 각 주문은 (A) => {...}. A는 아래 mk()가 만드는 주문 도구 묶음.
import * as V from "./vfx.js";
import * as IT from "./items.js";
import { BOOK1 } from "./book1.js";
import { BOOK2 } from "./book2.js";
import { BOOK3 } from "./book3.js";
import { BOOK4 } from "./book4.js";

const ADD = 1;
const rnd = (a, b) => a + Math.random() * (b - a);
const now = () => Date.now();
const PI = Math.PI;
const SPR = { flame: "vp_flame", spear: "vp_spear", orb: "vp_orb", ball: "vp_ball", blade: "vp_crescent", rock: "vp_boulder", needle: "vp_needle", shard: "vx_shard", star: "vx_star", sun: "vt_sun", crystal: "vt_crystal", tomb: "vt_tomb", wall: "vt_icewall", soft: "vx_soft", glow: "vx_glow", skel: "vt_skel", wraith: "vt_wraith", leaf: "vx_leaf", pebble: "vx_rock" };
const sprOf = (k) => SPR[k] ?? k ?? "vp_orb";
const UNDEAD = /해골|망령|유령|좀비|망자|뼈|언데드|리치|구울|시체|미라|원혼|사령/;
export const isUndead = (t) => UNDEAD.test(t?.def?.name ?? "");

// ── 진입점 ───────────────────────────────────────────
const BOOK = { ...BOOK1, ...BOOK2, ...BOOK3, ...BOOK4 };
export function spellOf(it) {
  const a = it.primary, b = it.secondary;
  if (!a || !b) return null;
  return BOOK[[a, b].sort().join("+")] ?? null;
}
export function run(K, spell) {
  const A = mkA(K);
  try {
    spell(A);
  } catch (e) {
    console.warn("spell error", e);
  }
}
export const COUNT = () => Object.keys(BOOK).length;

// ── 엔진 고리 ────────────────────────────────────────
export function hurtHook(sc, player, S, C) {
  const fr = sc.fr;
  const at = S?.attacker;
  const pr = fr?.sparry;
  if (pr && pr.until > now() && C > 0) {
    pr.n--;
    pr.n <= 0 && (fr.sparry = null);
    pr.cb(at, C);
    return 0;
  }
  if (at && at._frBlind > now() && Math.random() < 0.5) {
    sc.fx.text(player.cx, player.body.y - 34, "빗나감", "#e0c080");
    return 0;
  }
  const ab = fr?.absorb;
  if (ab && ab.v > 0 && ab.until > now() && C > 0) {
    const take = Math.min(ab.v, C);
    ab.v -= take;
    C -= take;
    sc.fx.burst("glow", player.cx, player.cy, 6, ab.col ?? 0xc0f0ff);
    ab.v <= 0 && sc.fx.text(player.cx, player.body.y - 34, "보호막 파괴", "#c0f0ff");
  }
  if (fr?.crystals?.length && C > 0 && at && !at.dead) {
    const c = fr.crystals.find((q) => q.until > now() && Math.abs(q.x - player.cx) < 70);
    if (c) {
      C *= 0.7;
      c.reflect?.(at, C);
    }
  }
  return C;
}
export function takenHook(T) {
  let m = 1;
  if (T._frVoid > now()) m *= (100 + Math.max(0, T.defense?.() ?? 0)) / 100;
  if (T._frCurse2 > now()) m *= 1.4;
  return m;
}
export function killHook(sc, T) {
  const x = T.body.x, y = T.body.y - T.body.h / 2;
  if (T._frGold2 && sc.dropGold) sc.dropGold(x, y - 6, 8 + (sc.dist ?? 0) / 160);
  if (T._frRaise && T._frRaiseA && !T.opts?.summoned) T._frRaiseA.summon(x, T.body.y, T._frRaise, 9);
  T._frOnDeath?.(x, y);
}

// ── 주문 도구 ────────────────────────────────────────
export function mkA(K) {
  const sc = K.sc, p = K.p;
  const d = p.facing;
  const A = { K, sc, p, d, el: K.el, B: K.B };
  const KE = K.el && IT.ELEMS[K.el];
  // 순수 속성으로 강화된 주문이면, 재료 속성으로 적힌 색도 순수 속성 색으로
  A.E = (el) => (el === void 0 || el === null ? K.el : KE && KE.kind === "pure" && KE.base === el ? K.el : el);
  A.ang = K.ang ?? (d > 0 ? 0 : PI);
  A.hx = p.cx + d * 10;
  A.hy = p.cy - 4;
  A.px = p.cx;
  A.py = p.cy;
  A.fy = p.body.y;
  A.c = (el) => V.palOf(A.E(el));
  A.gy = (x, y) => K.gy(x, y ?? p.body.y - 8);
  A.T = (n = 1, r = 380, x = p.cx, y = p.cy, exc) => K.near(x, y, r, n, exc);
  A.tp = (t) => [t.body.x, t.body.y - t.body.h / 2];
  A.aim = (dist = 150, r = 320) => {
    const t = K.near(p.cx + d * dist * 0.5, p.cy, r, 1)[0];
    const x = t ? t.body.x : p.cx + d * dist;
    return { t, x, y: t ? t.body.y - t.body.h / 2 : p.cy, gy: K.gy(x, (t ? t.body.y : p.body.y) - 8) };
  };
  A.later = (ms, fn) => sc.time.delayedCall(ms, () => p.dead || fn());
  A.rep = (n, ms, fn) => {
    for (let i = 0; i < n; i++) i === 0 ? fn(0) : A.later(i * ms, () => fn(i));
  };
  A.snd = (k, v) => K.snd(k, v);
  A.shake = (n, ms) => sc.fx.shake(n, ms);
  A.cam = (ms = 90, r = 255, g = 255, b = 255) => sc.cameras.main.flash(ms, r, g, b);
  A.text = (x, y, s, col = "#ffffff") => sc.fx.text(x, y, s, col);
  A.puff = (type, x, y, n = 8, el) => V.puff(sc, type, A.E(el), x, y, n);
  A.imp = (x, y, s = 1, el) => V.impact(sc, A.E(el), x, y, s);
  A.ring = (x, y, r, el, dur = 360) => V.ring(sc, x, y, r, A.c(el)[1], dur);
  A.flash = (x, y, r, el, dur = 240) => V.flash(sc, x, y, r, A.c(el)[1], dur);
  A.rays = (x, y, r, el, n = 10) => V.rays(sc, x, y, r, A.c(el)[0], n);
  A.spiral = (x, y, r, el) => V.spiral(sc, x, y, r, A.c(el)[2]);
  A.implode = (x, y, r, el) => V.implodeFx(sc, x, y, r, A.E(el));
  A.bolt = (x0, y0, x1, y1, el, w = 3, dur = 220) => V.bolt(sc, x0, y0, x1, y1, A.c(el), w, dur);
  A.trail = (x, y, el) => V.trailEl(sc, A.E(el), x, y);
  A.slash = (x, y, r, a0, a1, el, w = 7, dur = 220) => V.slash(sc, x, y, r, a0, a1, A.E(el), w, dur);
  A.img = (key, x, y, o = {}) => {
    const s = V.track(sc, sc.add.image(x, y, sprOf(key)).setDepth(o.depth ?? 28), o.life ?? 12);
    o.tint !== 0 && s.setTint(o.tint ?? A.c(o.el)[o.shade ?? 2]);
    o.add && s.setBlendMode(ADD);
    o.scale && s.setScale(o.scale);
    o.alpha !== void 0 && s.setAlpha(o.alpha);
    o.origin && s.setOrigin(...o.origin);
    return s;
  };
  A.glow = (x, y, s = 1, el, a = 0.5) => A.img("glow", x, y, { add: 1, scale: s, alpha: a, el, shade: 2 });
  A.dark = (ms = 900, a = 0.55) => {
    const r = sc.add.rectangle(0, 0, 640, 360, 0x05020c, 0).setOrigin(0).setScrollFactor(0).setDepth(40);
    sc.tweens.add({ targets: r, fillAlpha: a, duration: 200, yoyo: !0, hold: ms, onComplete: () => r.destroy() });
  };
  A.screen = () => {
    const cam = sc.cameras.main;
    return K.trect(cam.scrollX - 10, cam.scrollX + 650, -9999, 9999);
  };
  A.half = () => {
    const cam = sc.cameras.main;
    return d > 0 ? K.trect(p.cx - 40, cam.scrollX + 650, -9999, 9999) : K.trect(cam.scrollX - 10, p.cx + 40, -9999, 9999);
  };

  // 피해 + 상태이상
  A.hit = (t, m = 1, o = {}) => {
    if (!t || t.dead) return 0;
    if (m <= 0) return void (o.st && A.st(t, o.st, 0)), 0;
    let mm = m;
    o.undead && isUndead(t) && (mm *= o.undead);
    o.bonusSt && (mm *= 1 + o.bonusSt * stCount(t));
    const ex = { knock: o.kb ?? 100, stagger: o.stag ?? 0.3 };
    o.up && (ex.knockUp = o.up);
    o.true && (ex.frTrue = !0);
    o.hel !== void 0 && (ex.el = o.hel);
    o.dir && (ex.dir = o.dir);
    o.heavy && (ex.heavy = !0);
    o.noCrit && (ex.noCrit = !0);
    o.crit && (ex.critBonus = 1);
    const dmg = K.hit(t, mm, ex);
    o.st && A.st(t, o.st, dmg);
    o.drain && dmg > 0 && p.heal(dmg * o.drain, !1);
    o.drainFx && dmg > 0 && V.tether(K, t, 260);
    o.onDmg?.(t, dmg);
    return dmg;
  };
  const stCount = (t) => {
    let n = 0;
    for (const k of ["burn", "poison", "chill", "freeze", "stun", "bleed", "armorBreak", "curse", "erode"]) t.statuses.has(k) && n++;
    return n;
  };
  A.stCount = stCount;
  const freeze = (t, dur) => {
    t.statuses.apply({ type: "freeze", chance: 1, dur }, 0);
    sc.fx.anim("iceburst", t.body.x, t.body.y - t.body.h / 2, { scale: 0.9 });
  };
  A.st = (t, S, dmg = 0) => {
    if (!t || t.dead || !S) return;
    const ss = t.statuses, B = K.B;
    const tx = t.body.x, ty = t.body.y - t.body.h - 12;
    if (S.frost) {
      t._frFrost > now() || A.text(tx, ty - 10, "동상", "#a0f0e0");
      t._frFrost = now() + 7000;
      ss.apply({ type: "chill", chance: 1, dur: 5, power: 0.5 }, 0);
    }
    if (S.rot) {
      t._frRot > now() || A.text(tx, ty - 10, "부패", "#a0e060");
      t._frRot = now() + 8000;
      ss.apply({ type: "armorBreak", chance: 1, dur: 8, power: S.rot }, 1);
    }
    S.burn && ss.apply({ type: "burn", chance: 1, dur: S.eternal ? 30 : 4, power: 0.3 * S.burn }, B);
    S.eternal && !t._frEt && ((t._frEt = 1), A.text(tx, ty, "꺼지지 않는 불", "#d070ff"));
    if (S.poison) ss.apply({ type: "poison", chance: 1, dur: 5, power: 0.14 * S.poison * (t._frFrost > now() ? 2 : 1) * (t._frRot > now() ? 2 : 1) }, B);
    if (S.chill) {
      ss.apply({ type: "chill", chance: 1, dur: S.chillDur ?? (S.long ? 20 : 3), power: Math.min(0.8, 0.25 + 0.1 * S.chill) }, 0);
      t._frIce = (t._frIce ?? 0) + S.chill;
      t._frIce >= 5 && ((t._frIce = 0), freeze(t, 1.5), A.text(tx, ty, "빙결", "#90e0ff"));
    }
    S.freeze && (freeze(t, S.freeze), A.text(tx, ty, "빙결", "#90e0ff"));
    S.stun && ss.apply({ type: "stun", chance: 1, dur: S.stun }, 0);
    if (S.para) {
      ss.apply({ type: "stun", chance: 1, dur: S.para }, 0);
      A.text(tx, ty, "마비", "#fff070");
      for (let i = 0; i < 3; i++) A.bolt(tx + rnd(-8, 8), ty + 6, tx + rnd(-10, 10), ty + 20, "lightning", 1, 160);
    }
    if (S.curse) {
      ss.apply({ type: "curse", chance: 1, dur: S.curseDur ?? 10, power: S.curse }, 1);
      V.sigil(K, t, 1);
    }
    S.armor && ss.apply({ type: "armorBreak", chance: 1, dur: 6, power: S.armor }, 1);
    S.erode && ss.apply({ type: "erode", chance: 1, dur: 5 }, 1);
    if (S.fear) fear(t, S.fear);
    if (S.blind) {
      t._frBlind = now() + S.blind * 1000;
      A.text(tx, ty, "실명", "#e0c080");
      A.puff("smoke", tx, ty + 8, 6, "earth");
    }
    if (S.maxhp && !t._frMaxCut) {
      t._frMaxCut = 1;
      if (t.kind !== "boss") {
        t.maxHp = Math.round(t.maxHp * (1 - S.maxhp));
        t.hp = Math.min(t.hp, t.maxHp);
      } else A.hit(t, 0.8, { kb: 0 });
      A.text(tx, ty, `최대 체력 -${Math.round(S.maxhp * 100)}%`, "#d070ff");
    }
    if (S.mark) for (let i = 0; i < S.mark; i++) K.applyEl(t, "light");
    if (S.void) {
      t._frVoid = now() + S.void * 1000;
      A.text(tx, ty, "공허 낙인", "#e0d0ff");
      V.sigil(K, t, 0.8);
    }
    S.gold && (t._frGold2 = 1);
    S.raise && ((t._frRaise = S.raise), (t._frRaiseA = A));
    if (S.root) {
      ss.apply({ type: "stun", chance: 1, dur: S.root }, 0);
      t.body.vx = 0;
    }
  };
  function fear(t, dur) {
    if (t.kind === "boss") return;
    t.statuses.apply({ type: "stun", chance: 1, dur }, 0);
    A.text(t.body.x, t.body.y - t.body.h - 12, "공포", "#c090ff");
    const away = Math.sign(t.body.x - p.cx) || 1;
    K.ent({ dur, upd: () => (t.dead ? 0 : ((t.body.vx = away * 150), Math.random() < 0.3 && A.puff("wisp", t.body.x, t.body.y - t.body.h, 1, "dark"))) });
  }
  A.fear = fear;

  // 범위 피해
  A.area = (x, y, r, m = 1, o = {}) => {
    const ts = K.tin(x, y, r * K.size);
    for (const t of ts) A.hit(t, m, { dir: t.body.x < x ? -1 : 1, ...o });
    return ts;
  };
  A.rect = (x0, x1, y0, y1, m = 1, o = {}) => {
    const ts = K.trect(x0, x1, y0, y1);
    for (const t of ts) A.hit(t, m, o);
    return ts;
  };
  A.boom = (x, y, r = 50, m = 1, o = {}) => {
    const el = A.E(o.el);
    const c = A.c(el), s = r / 40;
    V.impact(sc, el, x, y, Math.min(3, s));
    sc.fx.anim("explode", x, y, { scale: (r / 22) * 0.7, tint: c[1], blend: !0 });
    V.ring(sc, x, y, r * 1.25, c[1], 400);
    V.flash(sc, x, y, r * 1.1, c[2], 280);
    sc.fx.shake(Math.min(9, 1.5 + s * 2));
    o.cam && A.cam(110, 255, 220, 180);
    K.snd(o.snd ?? "explosion", 0.8);
    const ts = K.tin(x, y, r * K.size);
    for (const t of ts) A.hit(t, m, { kb: 240, up: 140, stag: 0.5, dir: t.body.x < x ? -1 : 1, ...o });
    return ts;
  };
  A.nova = (x, y, r = 90, m = 1, o = {}) => {
    const el = A.E(o.el);
    const c = A.c(el), dur = o.dur ?? 380;
    const R = r * K.size;
    V.ring(sc, x, y, R, c[1], dur);
    V.ring(sc, x, y, R * 0.75, c[2], dur + 140);
    V.flash(sc, x, y, R * 0.55, c[1]);
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * PI * 2;
      A.later((dur * 0.8) | 0, () => A.trail(x + Math.cos(a) * R * 0.9, y + Math.sin(a) * R * 0.55, el));
      A.later((dur * 0.4) | 0, () => A.trail(x + Math.cos(a) * R * 0.5, y + Math.sin(a) * R * 0.3, el));
    }
    const ts = K.tin(x, y, R);
    for (const t of ts) {
      const dd = Math.hypot(t.body.x - x, t.body.y - y) / R;
      m > 0 && A.later(dd * dur * 0.8, () => A.hit(t, m, { kb: o.push ? 380 : 120, dir: t.body.x < x ? -1 : 1, ...o }));
    }
    o.snd !== 0 && K.snd(o.snd ?? "ice", 0.7);
    return ts;
  };

  // 투사체
  A.shot = (o = {}) => {
    const go = () => {
      let acc = 0;
      const drip = o.drip;
      const P = V.proj(K, {
        spr: sprOf(o.spr ?? "orb"), x: o.x ?? A.hx, y: o.y ?? A.hy, ang: o.ang ?? A.ang, speed: o.speed ?? 360, life: o.life ?? 1.4, r: (o.r ?? 8) * K.size,
        pierce: o.pierce ?? 0, homing: o.homing ?? 0, grav: o.grav ?? 0, scale: (o.scale ?? 1.4) * K.size, glow: o.glow ?? 1.4, spin: o.spin ?? 0, el: o.el, noTerrain: o.noTerrain, trail: o.trail ?? 1,
        onHit: (t, x, y) => {
          o.m !== 0 && A.hit(t, o.m ?? 1, o);
          o.hit?.(t, x, y, P);
        },
        onEnd: (x, y) => o.end?.(x, y, P),
        tick: (P2, dt) => {
          o.tick?.(P2, dt);
          if (drip) {
            acc -= dt;
            if (acc <= 0) ((acc = drip[0]), drip[1](P2.x, P2.y, P2));
          }
        },
      });
      return P;
    };
    if (o.delay) return void A.later(o.delay, go);
    return go();
  };
  A.fan = (n, spread, o = {}) => {
    const base = o.ang ?? A.ang;
    for (let i = 0; i < n; i++) A.shot({ ...o, ang: base + (i - (n - 1) / 2) * spread, delay: o.seq ? i * o.seq : o.delay });
  };
  A.radial = (n, o = {}, off = 0) => {
    for (let i = 0; i < n; i++) A.shot({ ...o, ang: off + (i / n) * PI * 2 });
  };
  A.end = (P) => V.endProj(P);
  // 지면을 굴러가는 물체
  A.roll = (o = {}) => {
    const el = A.E(o.el);
    const c = A.c(el);
    const s = A.img(o.spr ?? "rock", o.x ?? p.cx + d * 16, A.gy(o.x ?? p.cx + d * 16) - 10, { scale: (o.scale ?? 1.6) * K.size, el, shade: o.shade ?? 2, life: 30 });
    const gl = A.glow(s.x, s.y, (o.scale ?? 1.6) * 0.5, el, 0.4);
    const vx = (o.vx ?? 180) * (o.dir ?? d);
    let sc0 = (o.scale ?? 1.6) * K.size;
    const cd = new Map();
    const e = { dur: o.dur ?? 2.6, x: s.x, y: s.y, acc: 0, onShift: () => {}, upd: (e, dt) => {
      e.x += vx * dt;
      sc0 += (o.grow ?? 0) * dt;
      const R = 9 * sc0 * 0.6;
      const gy = A.gy(e.x, e.y);
      e.y += (gy - R - e.y) * Math.min(1, dt * 10);
      s.setPosition(e.x, e.y).setScale(sc0).setRotation(s.rotation + (vx / Math.max(6, R)) * dt);
      gl.setPosition(e.x, e.y).setScale(sc0 * 0.5);
      Math.random() < 0.6 && A.puff(o.fx ?? "smoke", e.x - Math.sign(vx) * R, gy - 2, 1, o.fxEl ?? el);
      A.trail(e.x, e.y, el);
      for (const [k, v] of cd) cd.set(k, v - dt);
      for (const t of K.tin(e.x, e.y, R + 8)) {
        if ((cd.get(t) ?? 0) > 0) continue;
        cd.set(t, o.every ?? 0.35);
        A.hit(t, o.m ?? 0.7, { kb: 220, up: 140, dir: Math.sign(vx), ...o });
        o.hit?.(t, e.x, e.y);
      }
      if (o.drip) {
        e.acc -= dt;
        if (e.acc <= 0) ((e.acc = o.drip[0]), o.drip[1](e.x, gy));
      }
      sc.collider.solidAtPx(e.x + Math.sign(vx) * (R + 2), e.y) && (e.t = 0);
    }, end: (e) => (s.destroy(), gl.destroy(), o.end?.(e.x, A.gy(e.x, e.y), sc0)) };
    K.ent(e);
    return e;
  };

  // 하늘에서 떨어지는 것
  A.drop = (x, o = {}) => {
    const gy = o.gy ?? A.gy(x, o.y);
    const el = A.E(o.el);
    const c = A.c(el);
    const go = () => {
      const R = o.r ?? 70;
      const warn = o.warn === 0 ? null : A.img("vt_sigil", x, gy, { tint: c[2], add: 1, depth: 9, alpha: 0.7, life: 4 }).setScale((R / 40) * K.size, (R / 160) * K.size);
      warn && sc.tweens.add({ targets: warn, angle: 360, duration: 1200 });
      const dx = o.dx ?? (o.spr === "spear" || o.spr === "crystal" || o.spr === "wall" || o.spr === "tomb" ? 0 : -d * 150);
      const sx = x + dx, sy = gy - (o.h ?? 330);
      const P = V.proj(K, { spr: sprOf(o.spr ?? "ball"), x: sx, y: sy, ang: Math.atan2(gy - sy, x - sx), speed: o.speed ?? 560, life: 3, r: 4, scale: (o.scale ?? 3) * K.size, glow: o.glow ?? 3, noTerrain: !0, pierce: 99, el, spin: o.spin ?? 0, onHit: o.pass ? (t) => A.hit(t, o.pass, { kb: 60 }) : void 0 });
      o.trailFx && (P.tick = () => Math.random() < 0.7 && A.puff(o.trailFx, P.x, P.y, 2, o.trailEl ?? el));
      const chk = () => {
        if (P.dead) return;
        if (P.y >= gy - 8) {
          V.endProj(P);
          warn?.destroy();
          if (o.land) o.land(x, gy);
          else A.boom(x, gy - 10, R, o.m ?? 1.5, { cam: o.big, st: o.st, ...o.ho });
          o.then?.(x, gy);
        } else sc.time.delayedCall(16, chk);
        Math.random() < 0.5 && A.puff("smoke", P.x, P.y, 1, el);
      };
      chk();
    };
    o.delay ? A.later(o.delay, go) : go();
  };
  A.pillar = (x, o = {}) => {
    const el = A.E(o.el);
    const c = A.c(el);
    const gy = o.gy ?? A.gy(x, o.y);
    const w = (o.w ?? 14) * K.size, H = o.h ?? 320;
    const warn = o.warn === 0 ? null : A.img("vt_sigil", x, gy, { tint: c[1], add: 1, depth: 9, alpha: 0.8, life: 4 }).setScale(w / 16, w / 60);
    warn && sc.tweens.add({ targets: warn, angle: 180, duration: o.delay ?? 320 });
    A.later(o.delay ?? 320, () => {
      warn?.destroy();
      V.pillar(sc, x, gy, c, w, o.dur ?? 480, H);
      V.rays(sc, x, gy - 10, 44, c[0], 8);
      A.puff("star", x, gy - 20, 10, el);
      A.puff(o.fx ?? "glowp", x, gy - 30, 6, el);
      sc.fx.shake(3);
      K.snd(o.snd ?? "lightning", 0.7);
      const ts = K.trect(x - w * 1.2, x + w * 1.2, gy - H, gy + 4);
      ts.forEach((t) => A.hit(t, o.m ?? 1.2, { kb: 60, stag: 0.5, ...o }));
      o.then?.(x, gy, ts);
    });
  };
  A.strike = (x, o = {}) => {
    const el = A.E(o.el);
    const c = A.c(el);
    const gy = o.gy ?? A.gy(x, o.y);
    const cl = o.cloud === 0 ? null : A.img("vt_cloud", x, gy - 170, { tint: 0x302848, depth: 26, alpha: 0, scale: 0.8, life: 4 });
    cl && sc.tweens.add({ targets: cl, alpha: 0.9, scale: 1, duration: 160 });
    A.later(o.delay ?? 240, () => {
      A.bolt(x + rnd(-10, 10), gy - 168, x, gy, el, (o.w ?? 5) * K.size, 260);
      A.bolt(x + rnd(-20, 20), gy - 168, x + rnd(-8, 8), gy, el, 2, 200);
      V.pillar(sc, x, gy, c, (o.w ?? 5) * 1.6 * K.size, 260, 170);
      A.puff("spark", x, gy - 10, 20, el);
      const ts = K.tin(x, gy - 16, (o.r ?? 30) * K.size);
      ts.forEach((t) => A.hit(t, o.m ?? 1, { kb: 80, stag: 0.5, ...o }));
      sc.fx.shake(3);
      cl && sc.tweens.add({ targets: cl, alpha: 0, duration: 400, onComplete: () => cl.destroy() });
      K.snd("lightning");
      o.then?.(x, gy, ts);
    });
  };
  A.beam = (x, y, ang, len = 640, o = {}) => {
    const el = A.E(o.el);
    const c = A.c(el);
    const w = (o.w ?? 9) * K.size;
    const once = (bx, by, ba, m) => {
      let L = len;
      if (o.stop) for (let dd = 10; dd < len; dd += 8) if (sc.collider.solidAtPx(bx + Math.cos(ba) * dd, by + Math.sin(ba) * dd)) ((L = dd), (dd = len));
      const x1 = bx + Math.cos(ba) * L, y1 = by + Math.sin(ba) * L;
      V.beam(sc, bx, by, x1, y1, c, w, o.fade ?? 220);
      A.puff("spark", x1, y1, 4, el);
      const seen = new Set();
      for (let dd = 0; dd <= L; dd += 12) for (const t of K.tin(bx + Math.cos(ba) * dd, by + Math.sin(ba) * dd, w + 4, seen)) seen.add(t);
      for (const t of seen) (A.hit(t, m, { kb: o.kb ?? 60, stag: 0.2, ...o }), o.each?.(t));
      return seen;
    };
    if (!o.dur) {
      V.flash(sc, x, y, w * 2, c[1]);
      o.snd !== 0 && K.snd(o.snd ?? "lightning", 0.8);
      return once(x, y, ang, o.m ?? 1.5);
    }
    const n = Math.round(o.dur / (o.every ?? 0.1));
    K.snd(o.snd ?? "charge", 0.8);
    A.rep(n, (o.every ?? 0.1) * 1000, (i) => {
      const bx = o.follow ? p.cx + p.facing * 10 : x, by = o.follow ? p.cy - 4 : y;
      const ba = o.follow ? (p.facing > 0 ? 0 : PI) + (o.angOff ?? 0) : ang;
      once(bx, by, ba, o.m ?? 0.3);
      i % 3 === 0 && sc.fx.shake(1.5);
    });
  };
  A.chain = (x, y, n = 5, o = {}) => {
    const el = A.E(o.el);
    let cx = x, cy = y, last = null, i = 0;
    const seen = new Set();
    const jump = () => {
      const exc = o.repeat ? new Set(last ? [last] : []) : seen;
      const t = K.near(cx, cy, o.r ?? (i ? 160 : 240), 1, exc)[0];
      if (!t) return void o.done?.(cx, cy, i, last);
      seen.add(t);
      const [tx, ty] = A.tp(t);
      o.fx !== 0 && (A.bolt(cx, cy, tx, ty, el, o.w ?? 3, 240), V.flash(sc, tx, ty, 18, A.c(el)[1]), A.puff("spark", tx, ty, 10, el));
      A.hit(t, o.m ?? 1, { kb: 60, stag: 0.3, ...o });
      o.each?.(t, tx, ty, i, cx, cy);
      ((cx = tx), (cy = ty), (last = t));
      ++i < n ? A.later(o.gap ?? 70, jump) : o.done?.(cx, cy, i, t);
    };
    K.snd("lightning", 0.7);
    jump();
  };
  // 깔리는 지대: pool(바닥) · cloud(공중) · vortex
  A.zone = (kind, x, y, r, dur, o = {}) => {
    const el = A.E(o.el);
    const z = {
      kind, x, y: kind === "pool" ? A.gy(x, y) : y, r: r * K.size, t: dur, el, dmg: K.B * (o.m ?? 0.2), tick: o.tick ?? 0.45, slow: o.slow, pull: o.pull, heal: o.heal,
      float: o.float,
      onTick: (z, ts) => {
        for (const t of ts) {
          o.st && A.st(t, o.st);
          o.root && t.statuses.apply({ type: "stun", chance: 1, dur: (o.tick ?? 0.45) + 0.1 }, 0);
          o.each?.(t, z);
        }
        o.onTick?.(z, ts);
      },
      onFrame: (z, dt) => {
        const f = o.fx ?? (kind === "pool" ? null : null);
        if (f && Math.random() < dt * 16 * Math.max(1, z.r / 50)) A.puff(f, z.x + rnd(-0.85, 0.85) * z.r, (kind === "pool" ? z.y - 4 : z.y + rnd(-0.4, 0.4) * z.r), 1, o.fxEl ?? el);
        o.frame?.(z, dt);
      },
      onEnd: () => o.end?.(real.x, real.y, real),
    };
    const real = K.zone(z);
    return real;
  };
  A.pool = (x, r, dur, o = {}) => A.zone("pool", x, A.gy(x, o.y), r, dur, { fx: o.fx ?? "flame", ...o });
  A.cloud = (x, y, r, dur, o = {}) => A.zone("cloud", x, y, r, dur, { fx: o.fx ?? "mist", ...o });

  // 몸 주위를 도는 것
  A.orbit = (n, o = {}) => {
    const el = A.E(o.el);
    const c = A.c(el);
    const spr = sprOf(o.spr ?? "orb");
    const orbs = [], glows = [];
    for (let i = 0; i < n; i++) {
      orbs.push(A.img(spr, p.cx, p.cy, { scale: (o.scale ?? 1.1) * K.size, el, life: 30 }));
      glows.push(A.glow(p.cx, p.cy, 0.6 * (o.scale ?? 1.1), el, 0.4));
    }
    const ringG = o.ring ? V.track(sc, sc.add.graphics().setDepth(27).setBlendMode(ADD), 30) : null;
    const cd = new Map();
    const e = { dur: o.dur ?? 4, a: 0, tk: o.every ?? 1, k: 0, pos: [], gone: [], upd: (e, dt) => {
      e.a += dt * (o.spd ?? 4.5);
      const C = o.center ? o.center(e) : { x: p.cx, y: p.cy };
      const R = (typeof o.R === "function" ? o.R(e) : o.R ?? 42) * K.size;
      ringG && ringG.clear().lineStyle(3, c[2], 0.5).strokeEllipse(C.x, C.y, R * 2, R * 1.6).lineStyle(1, c[1], 0.9).strokeEllipse(C.x, C.y, R * 2, R * 1.6);
      orbs.forEach((s, i) => {
        if (!s.active || e.gone[i]) return;
        const a = e.a * (o.rev && i % 2 ? -1 : 1) + (i / n) * PI * 2 + (o.phase ?? 0);
        const x = C.x + Math.cos(a) * R, y = C.y + Math.sin(a) * R * 0.8;
        e.pos[i] = { x, y };
        s.setPosition(x, y).setRotation(a + PI / 2);
        glows[i].setPosition(x, y);
        A.trail(x, y, el);
        for (const t of K.tin(x, y, (o.hr ?? 12) * K.size)) {
          if ((cd.get(t) ?? 0) > 0) continue;
          cd.set(t, o.cd ?? 0.4);
          o.m !== 0 && A.hit(t, o.m ?? 0.5, { kb: 90, ...o });
          o.touch?.(t, x, y, i, e);
        }
      });
      for (const [k, v] of cd) cd.set(k, v - dt);
      if (o.fn) {
        e.tk -= dt;
        if (e.tk <= 0) ((e.tk = o.every ?? 1), o.fn(C, R, e.k++, e));
      }
      o.frame?.(e, dt, C, R);
    }, end: (e) => {
      if (o.release) orbs.forEach((s, i) => s.active && !e.gone[i] && o.release(s.x, s.y, i));
      orbs.forEach((s) => s.destroy());
      glows.forEach((s) => s.destroy());
      ringG?.destroy();
      o.end?.(e);
    } };
    e.kill = (i) => ((e.gone[i] = 1), (e.pos[i] = null), orbs[i]?.destroy(), glows[i]?.destroy());
    e.orbs = orbs;
    K.ent(e);
    return e;
  };
  // 떠 있는 구체 (포탑·태양·구름)
  A.turret = (x, y, o = {}) => {
    const el = A.E(o.el);
    const sc0 = (o.scale ?? 1.8) * K.size;
    const core = o.spr === 0 ? null : A.img(o.spr ?? "orb", x, y, { scale: sc0, el, life: 30, add: o.addSpr });
    const gl = A.glow(x, y, (o.gs ?? 1.8) * K.size, el, 0.5);
    const e = { dur: o.dur ?? 5, x, y, i: 0, el0: 0, tk: o.first ?? 0.3, upd: (e, dt) => {
      e.el0 += dt;
      o.grow && core?.setScale(sc0 + o.grow * e.el0);
      if (o.follow) {
        e.x += (p.cx + (o.ox ?? 0) * p.facing - e.x) * Math.min(1, dt * 6);
        e.y += (p.cy + (o.oy ?? -40) - e.y) * Math.min(1, dt * 6);
      }
      o.vx && (e.x += o.vx * dt);
      o.vy && (e.y += o.vy * dt);
      o.move?.(e, dt);
      const yy = e.y + Math.sin(sc.time.now / 260) * 2;
      core?.setPosition(e.x, yy).setRotation(core.rotation + dt * (o.spin ?? 3));
      gl.setPosition(e.x, yy).setAlpha(0.45 + Math.random() * 0.2);
      Math.random() < 0.7 && A.trail(e.x + rnd(-6, 6), yy + rnd(-6, 6), el);
      e.tk -= dt;
      if (e.tk <= 0) ((e.tk = o.every ?? 1), o.fn?.(e.x, yy, e.i++, e));
      o.frame?.(e, dt);
    }, end: (e) => (core?.destroy(), gl.destroy(), o.end?.(e.x, e.y, e)) };
    K.ent(e);
    return e;
  };
  // 불꽃 고리처럼 몸에 두르는 원
  A.aura = (o = {}) => {
    const el = A.E(o.el);
    const c = A.c(el);
    const g = V.track(sc, sc.add.graphics().setDepth(27).setBlendMode(ADD), 30);
    const e = { dur: o.dur ?? 4, a: 0, tk: 0, x: o.x, y: o.y, upd: (e, dt) => {
      e.a += dt * 4;
      const C = o.at ? { x: e.x, y: e.y } : { x: p.cx, y: p.cy };
      const R = (typeof o.R === "function" ? o.R(e) : o.R ?? 44) * K.size;
      e.R = R;
      e.C = C;
      g.clear();
      for (let k = 0; k < (o.layers ?? 1); k++) {
        const rr = R * (1 - k * 0.22);
        g.lineStyle(6, c[3] ?? c[2], 0.25).strokeEllipse(C.x, C.y, rr * 2, rr * 1.5);
        g.lineStyle(3, c[2], 0.7).strokeEllipse(C.x, C.y, rr * 2, rr * 1.5);
        g.lineStyle(1, c[0], 0.9).strokeEllipse(C.x, C.y, rr * 2, rr * 1.5);
      }
      for (let k = 0; k < 4; k++) {
        const a = e.a * (k % 2 ? -1 : 1) + rnd(0, PI * 2);
        A.trail(C.x + Math.cos(a) * R, C.y + Math.sin(a) * R * 0.75, el);
      }
      e.tk -= dt;
      if (e.tk <= 0) {
        e.tk = o.every ?? 0.5;
        let ts = K.tin(C.x, C.y, R + 8);
        if (o.once) ((e.seen = e.seen ?? new Set()), (ts = ts.filter((t) => !e.seen.has(t))), ts.forEach((t) => e.seen.add(t)));
        for (const t of ts) (o.m !== 0 && A.hit(t, o.m ?? 0.6, { kb: o.push ? 300 : 100, dir: t.body.x < C.x ? -1 : 1, ...o }), o.touch?.(t, C, R, e));
        o.fn?.(C, R, ts, e);
      }
      o.frame?.(e, dt, C, R);
    }, end: (e) => (g.destroy(), o.end?.(e.C ?? { x: p.cx, y: p.cy }, e.R ?? 40, e)) };
    K.ent(e);
    return e;
  };
  // 빙벽
  A.wall = (x, o = {}) => {
    const el = A.E(o.el);
    const c = A.c(el);
    const gy = A.gy(x, o.y);
    const sy = (o.sy ?? 1) * K.size;
    const w = A.img(o.spr ?? "wall", x, gy + 60 * sy, { tint: c[o.shade ?? 1], depth: 24, origin: [0.5, 1], life: 30 }).setScale(K.size * (o.sx ?? 1), sy);
    const gl = A.glow(x, gy - 30 * sy, 1.6, el, 0.4).setScale(1.6, 2.6 * sy);
    sc.tweens.add({ targets: w, y: gy + 2, duration: 180, ease: "Back.easeOut" });
    A.puff("shard", x, gy, 12, el);
    K.snd("ice");
    o.hitUp !== 0 && K.trect(x - 20, x + 20, gy - 60 * sy, gy + 4).forEach((t) => A.hit(t, o.m ?? 0.8, { kb: 360, up: 160, ...o }));
    const H = { x, gy, broken: !1 };
    const z = K.zone({ kind: "wall", x, y: gy, r: 16, t: o.dur ?? 5, el, dmg: 0, tick: 0.5, h: 58 * sy, onTick: (z, ts) => ts.forEach((t) => o.touch?.(t, H)), onEnd: () => {
      H.broken = !0;
      A.puff("shard", H.x, gy - 30, 18, el);
      V.flash(sc, H.x, gy - 30, 30, c[1]);
      w.destroy();
      gl.destroy();
      o.end?.(H.x, gy, H);
    } });
    H.z = z;
    const e = { dur: o.dur ?? 5, tk: o.every ?? 1, upd: (e, dt) => {
      if (o.vx) {
        H.x += o.vx * dt;
        z.x = H.x;
        w.x = H.x;
        gl.x = H.x;
        A.puff("shard", H.x, gy - 4, 1, el);
        for (const t of K.trect(H.x - 14, H.x + 14, gy - 60 * sy, gy + 4)) t.kind !== "boss" && (t.body.x = H.x + Math.sign(o.vx) * (16 + t.body.w / 2));
        sc.collider.solidAtPx(H.x + Math.sign(o.vx) * 14, gy - 10) && (o.vx = 0);
      }
      if (o.fn) {
        e.tk -= dt;
        e.tk <= 0 && ((e.tk = o.every ?? 1), o.fn(H.x, gy, H));
      }
    }, onShift: (T) => ((H.x -= T), (w.x -= T), (gl.x -= T)) };
    K.ent(e);
    return H;
  };
  // 바닥 가시
  A.spikes = (x0, dir, n = 6, o = {}) => {
    const el = A.E(o.el);
    const c = A.c(el);
    const seen = new Set();
    const ice = o.ice ?? V.parts(el).includes("ice");
    for (let i = 0; i < n; i++)
      A.later(i * (o.step ?? 60), () => {
        const x = x0 + dir * i * (o.gap ?? 22);
        const gy = A.gy(x, o.y);
        sc.fx.anim(ice ? "icespike" : "rockspike", x, gy - 16 * (o.s ?? 1.3), { scale: (o.s ?? 1.3) * K.size, tint: o.tint ?? c[1], depth: 24 });
        A.puff(ice ? "shard" : "rock", x, gy, 5, el);
        A.puff("smoke", x, gy, 2, el);
        for (const t of K.trect(x - 14, x + 14, gy - 46, gy + 4, o.multi ? null : seen)) (seen.add(t), A.hit(t, o.m ?? 0.7, { up: 260, kb: 50, ...o }), o.hit?.(t, x, gy));
        o.each?.(x, gy, i);
      });
    K.snd("thud");
  };
  A.spikeRing = (x, R, n = 8, o = {}) => {
    const xs = [];
    for (let i = 0; i < n; i++) xs.push(x + Math.cos((i / n) * PI * 2) * R);
    xs.sort((a, b) => Math.abs(a - x) - Math.abs(b - x));
    xs.forEach((xx, i) => A.later(i * (o.step ?? 40), () => A.spikes(xx, 1, 1, { ...o, step: 0 })));
  };
  // 땅에서 솟는 손
  A.hand = (x, o = {}) => {
    const el = A.E(o.el);
    const c = A.c(el);
    const t0 = o.t ?? K.near(x, p.cy, 70, 1)[0];
    const tx = t0 ? t0.body.x : x;
    const gy = A.gy(tx, t0 ? t0.body.y - 4 : o.y);
    const s = o.scale ?? 1;
    const hd = A.img("vt_hand", tx, gy + 30 * s, { tint: o.tint ?? c[2], depth: 24, origin: [0.5, 1], life: 6 }).setScale(s * K.size);
    sc.tweens.add({ targets: hd, y: gy + 6, duration: 160, ease: "Back.easeOut", yoyo: !0, hold: o.hold ?? 1000, onComplete: () => hd.destroy() });
    A.puff("rock", tx, gy, 8, el);
    A.puff(o.fx ?? "smoke", tx, gy - 10, 6, el);
    const ts = K.tin(tx, gy - 14 * s, 26 * s * K.size);
    for (const u of ts) (A.hit(u, o.m ?? 1, { kb: 0, st: { stun: o.grab ?? 2, ...(o.st ?? {}) } }), o.grab2?.(u, tx, gy));
    K.snd("thud");
    o.then?.(tx, gy, ts);
    return ts;
  };
  // 한 점으로 빨아들이는 어둠
  A.vortex = (x, y, o = {}) => {
    const el = A.E(o.el);
    const c = A.c(el);
    const R0 = (o.r ?? 100) * K.size;
    const core = V.track(sc, sc.add.circle(x, y, (o.core ?? 9) * K.size, o.coreCol ?? 0x000000).setDepth(29), 30);
    const halo = A.img("vx_ring", x, y, { tint: c[2], add: 1, scale: 0.6 * K.size, life: 30 });
    const e = { dur: o.dur ?? 3, x, y, tk: 0, upd: (e, dt) => {
      o.move?.(e, dt);
      core.setPosition(e.x, e.y);
      halo.setPosition(e.x, e.y).setRotation(halo.rotation + dt * 4).setScale((0.6 + Math.sin(sc.time.now / 90) * 0.06) * K.size * (o.hs ?? 1));
      for (let k = 0; k < 3; k++) {
        const a = rnd(0, 6.28), r = rnd(30, R0);
        const s = sc.add.image(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r * 0.7, "vx_soft").setTint(k % 2 ? c[1] : c[2]).setBlendMode(ADD).setDepth(28).setScale(0.6);
        sc.tweens.add({ targets: s, x: e.x, y: e.y, scale: 0.1, duration: 380, ease: "Quad.easeIn", onComplete: () => s.destroy() });
      }
      for (const t of K.tin(e.x, e.y, R0)) t.kind !== "boss" && ((t.body.vx += Math.sign(e.x - t.body.x) * (o.force ?? 1000) * dt), o.lift && (t.body.vy = Math.min(t.body.vy, (e.y - t.body.y) * 3)));
      e.tk -= dt;
      if (e.tk <= 0) {
        e.tk = o.every ?? 0.5;
        const ts = K.tin(e.x, e.y, (o.hr ?? 44) * K.size);
        for (const t of ts) (o.m !== 0 && A.hit(t, o.m ?? 0.5, { kb: 0, noCrit: !0, ...o }), o.each?.(t, e));
        o.fn?.(e.x, e.y, ts, e);
      }
      o.frame?.(e, dt);
    }, end: (e) => {
      core.destroy();
      halo.destroy();
      if (o.boom) A.boom(e.x, e.y, o.boom, o.bm ?? 1.6, { el, cam: 1 });
      o.end?.(e.x, e.y, e);
    } };
    K.ent(e);
    K.snd("magic");
    return e;
  };
  // 이동하는 회오리
  A.tornado = (x, o = {}) => {
    const el = A.E(o.el);
    const c = A.c(el);
    const g = V.track(sc, sc.add.graphics().setDepth(27).setBlendMode(ADD), 30);
    const vx = (o.vx ?? 110) * (o.dir ?? d);
    const sz = (o.scale ?? 1) * K.size;
    const e = { dur: o.dur ?? 2.8, x, t2: 0, tk: 0, upd: (e, dt) => {
      o.follow ? (e.x = p.cx) : (e.x += vx * dt);
      e.t2 += dt;
      const gy = A.gy(e.x, p.body.y - 20);
      e.gy = gy;
      const H = 70 * sz * (o.hgrow ? 1 + e.t2 * o.hgrow : 1);
      e.H = H;
      g.clear();
      for (let k = 0; k < 10; k++) {
        const u = k / 10, yy = gy - u * H, w = 6 + u * 22 * sz, a = e.t2 * 14 + k;
        g.lineStyle(2, k % 2 ? c[1] : c[2], 0.7).strokeEllipse(e.x + Math.sin(a * 0.5) * 3, yy, w * 2, 6 + u * 4);
      }
      for (let k = 0; k < 3; k++) {
        const u = Math.random();
        A.trail(e.x + rnd(-1, 1) * (6 + u * 20 * sz), gy - u * H, o.fxEl ?? el);
      }
      o.fx && Math.random() < 0.5 && A.puff(o.fx, e.x + rnd(-14, 14) * sz, gy - rnd(0, H), 1, o.fxEl ?? el);
      for (const t of K.tin(e.x, gy - 30, 70 * sz)) t.kind !== "boss" && ((t.body.vx += Math.sign(e.x - t.body.x) * (o.force ?? 900) * dt), Math.abs(t.body.x - e.x) < 18 * sz && (t.body.vy = Math.min(t.body.vy, o.lift ?? -120)));
      e.tk -= dt;
      if (e.tk <= 0) {
        e.tk = o.every ?? 0.3;
        const ts = K.tin(e.x, gy - 30, 40 * sz);
        for (const t of ts) (A.hit(t, o.m ?? 0.45, { kb: 20, noCrit: !0, ...o }), o.each?.(t, e));
        o.fn?.(e.x, gy, ts, e);
      }
    }, end: (e) => (g.destroy(), o.end?.(e.x, e.gy ?? p.body.y, e)) };
    K.ent(e);
    K.snd("dash");
    return e;
  };
  A.gust = (o = {}) => {
    const el = A.E(o.el);
    const dd = o.dir ?? p.facing, w = (o.w ?? 130) * K.size;
    const x0 = o.x ?? p.cx, y0 = o.y ?? p.cy;
    for (let i = 0; i < 30; i++) {
      const s = A.img("vx_streak", x0 + rnd(0, 24) * dd, y0 + rnd(-28, 18), { add: 1, el, shade: i % 2 ? 1 : 2, life: 2 }).setFlipX(dd < 0).setScale(rnd(1, 2.2), 1);
      sc.tweens.add({ targets: s, x: s.x + dd * rnd(w * 0.6, w * 1.1), alpha: 0, duration: rnd(260, 480), onComplete: () => s.destroy() });
    }
    for (let i = 0; i < 12; i++) A.puff(o.fx ?? "leaf", x0 + dd * rnd(10, w), y0 + rnd(-24, 16), 1, o.fxEl ?? el);
    A.spiral(x0 + dd * 40, y0, 40, el);
    const ts = K.trect(x0, x0 + dd * w, y0 - 56 + 6, y0 + 22);
    for (const t of ts) (A.hit(t, o.m ?? 1, { kb: o.kb ?? 600, up: o.up ?? 140, stag: 0.5, dir: dd, ...o }), o.each?.(t));
    o.clear !== 0 && K.clearProj(x0, x0 + dd * w, y0 - 60, y0 + 24);
    K.snd("dash");
    return ts;
  };
  A.updraft = (o = {}) => {
    const el = A.E(o.el);
    const x = o.x ?? p.cx, gy = o.gy ?? p.body.y;
    o.self !== 0 && (p.body.vy = o.vy ?? -600);
    for (let i = 0; i < 24; i++) {
      const s = A.img("vx_streak", x + rnd(-30, 30), gy - rnd(0, 20), { add: 1, el, shade: i % 2 ? 1 : 2, life: 2 }).setAngle(-90).setScale(1.6, 1);
      sc.tweens.add({ targets: s, y: s.y - rnd(90, 180), alpha: 0, duration: rnd(300, 600), onComplete: () => s.destroy() });
    }
    o.fx && A.rep(6, 50, () => A.puff(o.fx, x + rnd(-24, 24), gy - rnd(0, 60), 3, o.fxEl ?? el));
    A.spiral(x, gy - 10, 50, el);
    const ts = K.tin(x, gy - 14, (o.r ?? 58) * K.size);
    for (const t of ts) (A.hit(t, o.m ?? 0.8, { up: o.up ?? 420, kb: 20, ...o }), o.each?.(t));
    K.snd("jump");
    return ts;
  };
  A.quake = (o = {}) => {
    const el = A.E(o.el);
    const c = A.c(el);
    sc.fx.shake(o.shake ?? 9, 500);
    A.cam(90, 200, 160, 100);
    const g = V.track(sc, sc.add.graphics().setDepth(25));
    const gy = p.body.y;
    for (const dir of [-1, 1]) {
      let x = p.cx, y = gy;
      g.lineStyle(2, c[2], 1).beginPath().moveTo(x, y);
      for (let i = 0; i < 22; i++) ((x += dir * rnd(10, 18)), (y = gy + rnd(-3, 3)), g.lineTo(x, y));
      g.strokePath();
    }
    sc.tweens.add({ targets: g, alpha: 0, delay: 400, duration: 500, onComplete: () => g.destroy() });
    for (let i = 0; i < 16; i++) {
      const x = p.cx + rnd(-320, 320);
      A.later(rnd(0, 300), () => (A.puff("rock", x, A.gy(x, gy - 30), 5, el), A.puff(o.fx ?? "smoke", x, A.gy(x, gy - 30), 3, o.fxEl ?? el)));
    }
    const ts = K.trect(p.cx - 330, p.cx + 330, gy - 150, gy + 120).filter((t) => !t.def?.flying);
    for (const t of ts) (A.hit(t, o.m ?? 1, { up: 220, stag: 0.7, ...o }), o.each?.(t));
    K.snd("explosion");
    return ts;
  };
  A.flashAll = (o = {}) => {
    const el = A.E(o.el);
    const c = A.c(el);
    const x = o.x ?? p.cx, y = o.y ?? p.cy;
    A.cam(o.ms ?? 300, 255, 255, 240);
    V.rays(sc, x, y, 200, c[1], 16);
    V.flash(sc, x, y, 120, c[1], 400);
    const ts = o.r ? K.tin(x, y, o.r) : A.screen();
    for (const t of ts) (t.statuses.apply({ type: "stun", chance: 1, dur: o.stun ?? 1.5 }, 0), A.hit(t, o.m ?? 0.5, { kb: 0, ...o }), o.each?.(t));
    K.snd("levelup");
    return ts;
  };
  A.stream = (o = {}) => {
    const el = A.E(o.el);
    const n = o.n ?? 20, dur = o.dur ?? 1.6;
    const L = (o.len ?? 104) * K.size;
    let i = 0;
    const tick = () => {
      if (p.dead) return;
      const ang = o.ang !== void 0 ? (typeof o.ang === "function" ? o.ang(i) : o.ang) : p.facing > 0 ? 0 : PI;
      const x0 = o.from ? o.from().x : p.cx + p.facing * 10, y0 = o.from ? o.from().y : p.cy - 4;
      for (let k = 0; k < 12; k++) {
        const dd = rnd(6, L);
        A.trail(x0 + Math.cos(ang) * dd + rnd(-dd, dd) * 0.25 * Math.sin(ang), y0 + Math.sin(ang) * dd + rnd(-dd, dd) * 0.28 * Math.cos(ang), o.pel ?? el);
      }
      o.fx && A.puff(o.fx, x0 + Math.cos(ang) * rnd(10, L), y0 + Math.sin(ang) * rnd(10, L), 2, o.fxEl ?? el);
      i % 3 === 0 && V.flash(sc, x0 + Math.cos(ang) * 8, y0, 12, A.c(el)[1], 120);
      const seen = new Set();
      for (let dd = 8; dd <= L; dd += 14) for (const t of K.tin(x0 + Math.cos(ang) * dd, y0 + Math.sin(ang) * dd, 14 + dd * 0.18, seen)) seen.add(t);
      for (const t of seen) (A.hit(t, o.m ?? 0.25, { kb: 20, stag: 0.05, noCrit: !0, ...o }), o.each?.(t, i));
      o.fn?.(x0 + Math.cos(ang) * L, y0 + Math.sin(ang) * L, i, seen);
      ++i < n ? sc.time.delayedCall((dur * 1000) / n, tick) : o.end?.(x0 + Math.cos(ang) * L, y0 + Math.sin(ang) * L);
    };
    tick();
    K.snd("magic");
  };
  // 움직이는 덩어리 (파도·안개·모래)
  A.mover = (o = {}) => {
    const el = A.E(o.el);
    const e = { dur: o.dur ?? 2, x: o.x ?? p.cx + d * 20, y: o.y ?? p.cy, tk: 0, acc: 0, upd: (e, dt) => {
      e.x += (o.vx ?? 160) * (o.dir ?? d) * dt;
      e.y += (o.vy ?? 0) * dt;
      o.ground && (e.y = A.gy(e.x, e.y) - (o.ground ?? 0));
      const R = (o.r ?? 30) * K.size;
      for (let k = 0; k < (o.dens ?? 4); k++) A.puff(o.fx ?? "mist", e.x + rnd(-R, R), e.y + rnd(-R * 0.6, R * 0.4), 1, o.fxEl ?? el);
      A.trail(e.x, e.y, el);
      e.tk -= dt;
      if (e.tk <= 0) {
        e.tk = o.every ?? 0.25;
        const ts = K.tin(e.x, e.y, R);
        for (const t of ts) (A.hit(t, o.m ?? 0.4, { kb: o.kb ?? 120, dir: Math.sign(o.vx ?? 1) * (o.dir ?? d), ...o }), o.each?.(t, e));
      }
      if (o.drip) {
        e.acc -= dt;
        e.acc <= 0 && ((e.acc = o.drip[0]), o.drip[1](e.x, e.y, e));
      }
    }, end: (e) => o.end?.(e.x, e.y, e) };
    K.ent(e);
    return e;
  };

  // 나에게
  A.heal = (f) => {
    p.heal(p.maxHp * f, !0);
    A.puff("star", p.cx, p.cy, 10, "light");
    A.puff("glowp", p.cx, p.cy, 4, "light");
  };
  A.healAmt = (v) => v > 0 && p.heal(v, !1);
  A.shield = (f, dur = 8, el) => {
    const fr = sc.fr;
    const col = A.c(el)[1];
    fr.absorb = { v: p.maxHp * f + Math.max(0, fr.absorb?.until > now() ? fr.absorb.v : 0), until: now() + dur * 1000, col };
    p.buff("dmgReduce", Math.min(dur, 3), 0.1, "shield", "보호막");
    const bub = A.img("vx_ring", p.cx, p.cy, { tint: col, add: 1, scale: 1.1, alpha: 0.7, life: dur + 1 });
    K.ent({ dur, upd: () => (bub.setPosition(p.cx, p.cy).setAlpha(fr.absorb?.v > 0 ? 0.45 + Math.sin(sc.time.now / 120) * 0.15 : 0)), end: () => bub.destroy() });
    A.text(p.cx, p.body.y - 36, "보호막", "#c0f0ff");
  };
  A.haste = (dur = 5, pw = 0.3) => {
    p.buff("speed", dur, pw, "speed", "바람의 축복");
    p.buff("berserkSpd", dur, pw, "speed", "바람의 축복");
    A.puff("streak", p.cx, p.cy, 10, "wind");
    A.puff("leaf", p.cx, p.cy, 8, "wind");
  };
  A.cleanse = () => {
    let n = 0;
    for (const k of ["burn", "poison", "chill", "freeze", "stun", "bleed", "armorBreak", "curse"]) p.statuses.has?.(k) && (n++, p.statuses.clear(k));
    return n;
  };
  // 아군 소환 (해골·얼음 망령·그림자)
  A.summon = (x, y, kind = "skel", dur = 9) => {
    const fr = sc.fr;
    fr.summons = (fr.summons ?? []).filter((s) => s.t > 0);
    if (fr.summons.length >= 6) return;
    const el = kind === "wraith" ? "ice" : kind === "shade" ? "dark" : "earth";
    const tex = kind === "skel" ? "vt_skel" : "vt_wraith";
    const tint = kind === "wraith" ? 0xc8f0ff : kind === "shade" ? 0x9060d0 : 0xf0e8d0;
    const s = A.img(tex, x, y - 9, { tint, depth: 23, life: dur + 2 }).setAlpha(0);
    sc.tweens.add({ targets: s, alpha: kind === "skel" ? 1 : 0.85, duration: 300 });
    A.puff(kind === "skel" ? "rock" : "mist", x, y - 6, 10, el);
    A.text(x, y - 26, kind === "skel" ? "해골 부활" : kind === "wraith" ? "얼음 망령" : "그림자", kind === "wraith" ? "#c8f0ff" : "#e0d0b0");
    const e = { dur, x, y: y - 9, tk: 0.5, upd: (e, dt) => {
      const t = K.near(e.x, e.y, 220, 1)[0];
      const tx = t ? t.body.x - Math.sign(t.body.x - e.x) * 14 : p.cx - p.facing * 24;
      const fly = kind !== "skel";
      e.x += Math.max(-110 * dt, Math.min(110 * dt, tx - e.x));
      const ty = fly ? (t ? t.body.y - t.body.h - 6 : p.cy - 26) : A.gy(e.x, e.y) - 9;
      e.y += (ty - e.y) * Math.min(1, dt * (fly ? 3 : 10));
      s.setPosition(e.x, e.y + (fly ? Math.sin(sc.time.now / 200) * 2 : 0)).setFlipX(t ? t.body.x < e.x : p.facing < 0);
      fly && Math.random() < 0.4 && A.puff("wisp", e.x, e.y + 6, 1, el);
      e.tk -= dt;
      if (e.tk <= 0 && t) {
        e.tk = 0.8;
        if (fly) V.proj({ ...K, focus: K.focus }, { spr: "vx_shard", x: e.x, y: e.y, ang: Math.atan2(t.body.y - t.body.h / 2 - e.y, t.body.x - e.x), speed: 300, life: 1, r: 6, scale: 1.6, glow: 0.8, el, homing: 3, onHit: (u) => A.hit(u, 0.45, { kb: 60, hel: el }) });
        else if (Math.abs(t.body.x - e.x) < 30) (A.slash(e.x, e.y, 18, -1.2, 1.4, el, 5, 180), A.hit(t, 0.55, { kb: 80, hel: el }));
      }
    }, end: (e) => (A.puff(kind === "skel" ? "rock" : "mist", e.x, e.y, 8, el), s.destroy()) };
    K.ent(e);
    fr.summons.push(e);
  };
  // 피해 반사 수정
  A.crystal = (x, o = {}) => {
    const el = A.E(o.el);
    const c = A.c(el);
    const fr = sc.fr;
    const gy = A.gy(x, o.y);
    const dur = o.dur ?? 6;
    const s = A.img("vt_crystal", x, gy + 2, { tint: c[1], depth: 24, origin: [0.5, 1], life: dur + 1 }).setScale(0.2 * K.size, 0.2 * K.size);
    sc.tweens.add({ targets: s, scaleX: (o.scale ?? 1) * K.size, scaleY: (o.scale ?? 1) * K.size, duration: 220, ease: "Back.easeOut" });
    const gl = A.glow(x, gy - 14, 1, el, 0.4);
    A.puff("shard", x, gy - 8, 10, el);
    const q = { x, until: now() + dur * 1000, reflect: (at, C) => {
      const [tx, ty] = A.tp(at);
      A.beam(q.x, gy - 18, Math.atan2(ty - (gy - 18), tx - q.x), Math.hypot(tx - q.x, ty - gy + 18), { m: 0.5 + C / Math.max(1, K.B) * 0.3, w: 3, fade: 200, snd: "ice" });
      A.text(q.x, gy - 34, "반사", "#e0f8ff");
    } };
    fr.crystals = (fr.crystals ?? []).filter((c2) => c2.until > now());
    fr.crystals.push(q);
    K.ent({ dur, x, tk: 0, upd: (e, dt) => {
      q.x = e.x;
      gl.setAlpha(0.3 + Math.sin(sc.time.now / 150) * 0.15);
      for (const pr of sc.projectiles.list) if (pr.active && pr.owner === "enemy" && Math.abs(pr.x - e.x) < 18 && pr.y > gy - 40 && pr.y < gy + 4) {
        sc.projectiles.kill(pr);
        const t = K.near(e.x, gy - 16, 300, 1)[0];
        t && A.shot({ spr: "shard", x: e.x, y: gy - 20, ang: Math.atan2(t.body.y - t.body.h / 2 - gy + 20, t.body.x - e.x), speed: 420, life: 1, m: 0.6, scale: 1.8, homing: 2 });
      }
      e.tk -= dt;
      if (e.tk <= 0) {
        e.tk = 0.5;
        for (const t of K.trect(e.x - 14, e.x + 14, gy - 30, gy + 4)) A.hit(t, o.m ?? 0.4, { kb: 240 });
        o.fn?.(e.x, gy);
      }
    }, end: () => (A.puff("shard", q.x, gy - 10, 14, el), s.destroy(), gl.destroy(), (q.until = 0)) });
    return q;
  };
  // 붙잡아 가두기 (얼음 덩어리·관)
  A.encase = (t, dur = 3, el = "ice") => {
    if (!t || t.dead) return;
    t.statuses.apply({ type: "freeze", chance: 1, dur }, 0);
    const [x, y] = A.tp(t);
    const s = A.img("vt_icewall", x, t.body.y + 2, { tint: A.c(el)[1], depth: 31, origin: [0.5, 1], alpha: 0.55, life: dur + 1 }).setScale(Math.max(1, t.body.w / 18), Math.max(0.5, t.body.h / 50));
    A.puff("shard", x, y, 10, el);
    K.ent({ dur, upd: () => (t.dead ? (s.visible = !1) : s.setPosition(t.body.x, t.body.y + 2)), end: () => (A.puff("shard", t.body.x, t.body.y - t.body.h / 2, 14, el), s.destroy()) });
  };
  A.TX = (n = 1, r = 380, step = 50) => {
    const ts = K.near(p.cx, p.cy, r, n);
    const out = [];
    for (let i = 0; i < n; i++) {
      const t = ts[i];
      out.push(t ? { t, x: t.body.x, y: t.body.y - 8 } : { t: null, x: p.cx + d * (80 + i * step), y: void 0 });
    }
    return out;
  };
  A.fade = (o, ms = 600, delay = 0) => {
    sc.tweens.add({ targets: o, alpha: 0, delay, duration: delay ? Math.max(100, ms - delay) : ms, onComplete: () => o.destroy() });
    return o;
  };
  A.crack = (x, gy, len = 120, el, dir) => {
    const c = A.c(el);
    const g = V.track(sc, sc.add.graphics().setDepth(25).setBlendMode(ADD));
    for (const s of dir ? [dir] : [-1, 1]) {
      const pts = [[x, gy]];
      let cx = x;
      const n = Math.max(3, Math.round(len / 14));
      for (let i = 0; i < n; i++) ((cx += s * rnd(10, 18)), pts.push([cx, gy + rnd(-3, 3)]));
      for (const [w, col, a] of [[6, c[2], 0.3], [2, c[1], 1]]) {
        g.lineStyle(w, col, a).beginPath().moveTo(pts[0][0], pts[0][1]);
        for (const q of pts) g.lineTo(q[0], q[1]);
        g.strokePath();
      }
    }
    sc.tweens.add({ targets: g, alpha: 0, delay: 600, duration: 500, onComplete: () => g.destroy() });
  };
  A.boltShot = (o = {}) => {
    const el = A.E(o.el);
    const a = o.ang ?? (o.ground ? (d > 0 ? 0.45 : PI - 0.45) : A.ang);
    let x1 = A.hx + Math.cos(a) * 400, y1 = A.hy + Math.sin(a) * 400, hit = null;
    for (let dd = 10; dd < 400; dd += 8) {
      const x = A.hx + Math.cos(a) * dd, y = A.hy + Math.sin(a) * dd;
      const t = K.tin(x, y, 8)[0];
      if (t) { hit = t; x1 = x; y1 = y; break; }
      if (sc.collider.solidAtPx(x, y)) { x1 = x; y1 = y; break; }
    }
    A.bolt(A.hx, A.hy, x1, y1, el, 3, 220);
    V.flash(sc, x1, y1, 24, A.c(el)[1]);
    A.puff("spark", x1, y1, 16, el);
    A.cam(40, 255, 255, 200);
    K.snd("lightning");
    hit && A.hit(hit, o.m ?? 1, { kb: 80, stag: 0.3, ...o });
    return { x: x1, y: y1, t: hit };
  };
  return A;
}
