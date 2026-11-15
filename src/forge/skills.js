// 스킬 융합 전용 동작 — 스킬끼리(SS)·스킬+방어구(SA) 316종을 설명대로.
// 각 레시피는 (S) => {...}. S는 주문 도구(spells.mkA)에 스킬 동작을 더한 묶음.
import * as V from "./vfx.js";
import { mkA } from "./spells.js";
import { SBOOK1 } from "./sbook1.js";
import { SBOOK2 } from "./sbook2.js";
import { runSM } from "./smagic.js";

const PI = Math.PI;
const rnd = (a, b) => a + Math.random() * (b - a);
const BOOK = { ...SBOOK1, ...SBOOK2 };
export function skillOf(it) {
  if (it?.cat === "SM" && it.primary?.startsWith("S") && it.secondary?.startsWith("M")) return (S) => runSM(S, it);
  if (!it || (it.cat !== "SS" && it.cat !== "SA")) return null;
  return BOOK[[it.primary, it.secondary].join("+")] ?? BOOK[[it.secondary, it.primary].join("+")] ?? null;
}
export function runSkill(K, fn) {
  const S = mkS(K);
  try {
    fn(S);
  } catch (e) {
    console.warn("skill error", e);
  }
}
export const SCOUNT = () => Object.keys(BOOK).length;

function mkS(K) {
  const S = mkA(K);
  const { sc, p } = S;
  const el = K.el;
  const tint = el ? V.palOf(el)[2] : void 0;
  const fx = sc.fx;
  const fr = sc.fr;
  S.tint = tint;
  S.dir = () => p.facing;
  S.feet = () => p.body.y;
  // 잔상 (내 모습 복사본)
  S.ghost = (x, y, flip = p.facing < 0, dur = 600, col = 0x8090ff) => {
    const sp = p.sprite;
    if (!sp) return null;
    const g = V.track(sc, sc.add.image(x, y, sp.texture.key, sp.frame.name).setOrigin(sp.originX, sp.originY).setFlipX(flip).setTint(col).setAlpha(0.6).setDepth(sp.depth ?? 20).setBlendMode(1), dur / 1000 + 1);
    sc.tweens.add({ targets: g, alpha: 0, delay: dur * 0.6, duration: dur * 0.4, onComplete: () => g.destroy() });
    return g;
  };
  S.slashAt = (x, y, r = 30, a0 = -2.2, a1 = 0.9, w = 8, dur = 220) => A_slash(S, x, y, r, a0, a1, w, dur);
  // 회전베기
  S.spin = (o = {}) => {
    const n = o.n ?? 5, r = (o.r ?? 46) * K.size;
    let i = 0;
    const tick = () => {
      if (p.dead) return;
      const c = o.at ? o.at() : { x: p.cx, y: p.cy };
      fx.anim(o.kick ? "fx_spin" : "fx_spin", c.x, c.y, { scale: (1.3 * r) / 46, tint, blend: !!el });
      S.slash(c.x, c.y - 2, r * 0.9, i * 2.1, i * 2.1 + 4.4, el, 8, 220);
      o.pull && K.tin(c.x, c.y, r * 2).forEach((t) => t.kind !== "boss" && (t.body.vx += Math.sign(c.x - t.body.x) * 260));
      const ts = K.tin(c.x, c.y, r);
      for (const t of ts) (S.hit(t, o.m ?? 0.6, { kb: o.kb ?? 90, stag: 0.2, up: o.up ?? 0, crit: o.crit?.(i), ...o.ho }), o.hit?.(t, i));
      o.each?.(c.x, c.y, i, ts);
      o.move && (p.body.vx = p.facing * o.move);
      S.snd("swing", 1.1);
      ++i < n ? sc.time.delayedCall(o.gap ?? 110, tick) : o.end?.(c.x, c.y);
    };
    tick();
    o.at || (p.iframes = Math.max(p.iframes, 0.11 * n));
  };
  // 돌진 (빠르게 이동하며 지나친 적 타격)
  S.dash = (o = {}) => {
    const dir = o.dir ?? p.facing, spd = o.spd ?? 720, dur = o.dur ?? 0.24;
    const hits = new Set();
    p.iframes = Math.max(p.iframes, dur + 0.1);
    p.weapons?.interrupt?.();
    fx.burst("glow", p.cx, p.cy, 10, tint ?? 0xd0e0ff);
    S.snd("dash");
    let acc = 0;
    K.ent({ dur, upd: (e, dt) => {
      p.body.vx = dir * spd;
      p.body.vy = o.vy ?? 0;
      p.facing = dir;
      p.spawnAfterimage?.();
      el && S.trail(p.cx, p.cy);
      fx.burst("glow", p.cx, p.cy, 1, tint ?? 0xd0e0ff);
      for (const t of K.tin(p.cx + dir * 6, p.cy, 18)) {
        if (hits.has(t)) continue;
        hits.add(t);
        S.hit(t, o.m ?? 2, { kb: o.kb ?? 180, stag: 0.5, dir, ...o.ho });
        fx.anim("fx_thrust", t.body.x, t.body.y - t.body.h / 2, { tint, flip: dir < 0 });
        o.hit?.(t);
        o.stopOnHit && (e.t = 0);
      }
      o.clear && K.clearProj(p.cx - 20, p.cx + 20, p.cy - 30, p.cy + 30);
      if (o.path) ((acc -= dt), acc <= 0 && ((acc = o.path[0]), o.path[1](p.cx, p.body.y)));
    }, end: () => ((p.body.vx = dir * 140), o.end?.(p.cx, p.body.y, hits)) });
  };
  // 짧은 박치기
  S.bash = (o = {}) => S.dash({ dur: 0.13, spd: 640, m: 1.5, kb: 360, clear: 1, ...o });
  // 뛰어올라 내려찍기
  S.slam = (o = {}) => {
    (p.body.onGround || o.force) && (p.body.vy = o.vy ?? -380);
    let t = 0;
    S.snd("jump");
    K.ent({ dur: o.max ?? 2.2, upd: (e, dt) => {
      t += dt;
      if (!e.ap && (p.body.vy >= 0 || t > 0.35)) ((e.ap = 1), (e.hang = o.hang ?? 0), o.apex?.(p.cx, p.cy));
      if (e.hang > 0) return void ((e.hang -= dt), (p.body.vy = 0), (p.body.vx = 0));
      t > (o.delay ?? 0.18) && (p.body.vy = Math.max(p.body.vy, o.fall ?? 700));
      o.falling?.(p.cx, p.cy, dt);
      t > 0.22 && p.body.onGround && (e.t = 0);
    }, end: () => {
      const r = (o.r ?? 60) * K.size, x = p.cx, gy = p.body.y;
      fx.anim("fx_smash", x, gy - 12, { scale: 1.6 * (r / 60), tint });
      S.ring(x, gy - 4, r, el, 380);
      fx.burst("chunk", x, gy, 12, 0xa89878);
      fx.shake(o.big ? 9 : 5);
      el && S.imp(x, gy - 10, r / 50);
      S.snd("thud");
      for (const u of K.tin(x, gy - 6, r)) (S.hit(u, o.m ?? 3.5, { kb: o.kb ?? 260, up: o.up ?? 200, stag: 0.7, heavy: 1, crit: o.crit, ...o.ho }), o.hit?.(u));
      o.land?.(x, gy);
    } });
  };
  // 도약베기
  S.leap = (o = {}) => {
    const dir = o.dir ?? p.facing;
    p.body.vy = o.vy ?? -420;
    p.body.vx = dir * (o.vx ?? 320);
    S.snd("jump");
    let t = 0;
    const seen = new Set();
    K.ent({ dur: o.max ?? 1.6, upd: (e, dt) => {
      t += dt;
      o.keep && (p.body.vx = dir * (o.vx ?? 320));
      if (o.path) for (const u of K.tin(p.cx, p.cy, 28)) seen.has(u) || (seen.add(u), S.hit(u, o.m ?? 2, { kb: 160, ...o.ho }), o.hit?.(u));
      if (!e.ap && t > 0.24) {
        e.ap = 1;
        if (!o.path) {
          fx.anim("fx_heavy", p.cx + dir * 16, p.cy + 6, { flip: dir < 0, tint, scale: 1.4 * K.size });
          S.slash(p.cx, p.cy, 40 * K.size, dir > 0 ? -1.4 : PI + 1.4, dir > 0 ? 1.2 : PI - 1.2, el, 10, 260);
          for (const u of K.tin(p.cx + dir * 20, p.cy + 8, 44 * K.size)) (S.hit(u, o.m ?? 2, { kb: 200, stag: 0.5, crit: o.crit, ...o.ho }), o.hit?.(u));
          S.snd("swingHeavy");
        }
        o.apex?.(p.cx, p.cy);
      }
      t > 0.3 && p.body.onGround && (e.t = 0);
    }, end: () => o.land?.(p.cx, p.body.y) });
  };
  // 올려베기
  S.launch = (o = {}) => {
    const dir = o.dir ?? p.facing, x0 = o.x ?? p.cx, w = (o.w ?? 46) * K.size;
    fx.anim("fx_heavy", x0 + dir * 18, p.cy - 8, { flip: dir < 0, tint, scale: 1.3 * K.size });
    S.slash(x0, p.cy, 34 * K.size, dir > 0 ? 1.2 : PI - 1.2, dir > 0 ? -1.6 : PI + 1.6, el, 9, 260);
    const ts = K.trect(x0, x0 + dir * w, p.body.y - (o.h ?? 50), p.body.y + 6);
    for (const t of ts) (S.hit(t, o.m ?? 1.8, { up: o.up ?? 360, kb: 40, stag: 0.6, crit: o.crit, ...o.ho }), o.hit?.(t));
    S.snd("swingHeavy");
    fx.shake(2);
    return ts;
  };
  // 검기
  S.wave = (o = {}) => S.shot({ spr: o.spr ?? "blade", speed: o.speed ?? 430, life: o.life ?? 1.1, pierce: o.pierce ?? 99, scale: o.scale ?? 1.6, noTerrain: 1, m: o.m ?? 2.2, glow: 1.2, ang: o.ang, x: o.x, y: o.y, el, ...o });
  // 연속찌르기
  S.rapid = (o = {}) => {
    const n = o.n ?? 12, dur = o.dur ?? 1.6, w = (o.w ?? 44) * K.size;
    let i = 0;
    const tick = () => {
      if (p.dead) return;
      const ang = o.ang ? o.ang(i) : p.facing > 0 ? 0 : PI;
      const x0 = o.at ? o.at().x : p.cx, y0 = (o.at ? o.at().y : p.cy) - 6 + rnd(-8, 8);
      const x1 = x0 + Math.cos(ang) * w, y1 = y0 + Math.sin(ang) * w;
      fx.anim("fx_thrust", x0 + Math.cos(ang) * 20, y0 + Math.sin(ang) * 20, { flip: Math.cos(ang) < 0, tint });
      V.beam(sc, x0 + Math.cos(ang) * 6, y0, x1, y1, V.palOf(el), 2, 120);
      const ts = [];
      for (let dd = 8; dd <= w; dd += 10) for (const t of K.tin(x0 + Math.cos(ang) * dd, y0 + Math.sin(ang) * dd, 12)) ts.includes(t) || ts.push(t);
      for (const t of ts) (S.hit(t, (o.m ?? 0.3) * (o.mult?.(i, t) ?? 1), { kb: 30, stag: 0.12, crit: o.crit?.(i), ...o.ho }), o.hit?.(t, i));
      o.each?.(i, x1, y1, ts);
      i % 2 === 0 && S.snd("swing", 1.3);
      const gap = o.accel ? Math.max(25, ((dur * 1000) / n) * (1 - i / n * 0.7)) : (dur * 1000) / n;
      ++i < n ? sc.time.delayedCall(gap, tick) : o.end?.(x0, y0);
    };
    tick();
  };
  // 순간이동
  S.tele = (o = {}) => {
    const t = o.t ?? K.near(p.cx, p.cy, o.r ?? 260, 1)[0];
    fx.burst("glow", p.cx, p.cy, 14, tint ?? 0x9060d0);
    S.ghost(p.body.x, p.body.y, p.facing < 0, 400, 0x9060d0);
    const ox = p.cx, oy = p.body.y;
    if (!t) return void o.none?.(ox, oy);
    const s = o.front ? -Math.sign(t.body.x - p.cx) || 1 : t.body.x > p.cx ? 1 : -1;
    let nx = t.body.x + s * (t.body.w / 2 + 10), ny = Math.min(p.body.y, t.body.y);
    if (o.above) ((nx = t.body.x), (ny = t.body.y - t.body.h - 40));
    if (o.above || !sc.collider.solidAtPx(nx, t.body.y - 8)) ((p.body.x = nx), (p.body.y = ny), (p.body.vy = o.above ? 0 : p.body.vy));
    p.facing = -s;
    p.iframes = Math.max(p.iframes, 0.3);
    S.snd("dash");
    if (o.m !== 0) {
      S.hit(t, o.m ?? 1.5, { stag: 0.6, kb: 160, dir: -s, crit: o.crit, ...o.ho });
      fx.anim("fx_heavy", t.body.x, t.body.y - t.body.h / 2, { flip: s > 0, tint: tint ?? 0xb080ff });
      S.slash(t.body.x, t.body.y - t.body.h / 2, 26, -2.4, 0.8, el ?? "dark", 8, 240);
    }
    o.arrive?.(t, ox, oy);
    return t;
  };
  // 발도 (자세 후 일섬)
  S.iaido = (o = {}) => {
    p.iframes = Math.max(p.iframes, (o.delay ?? 0.38) + 0.1);
    p.weapons?.interrupt?.();
    p.body.vx = 0;
    fx.burst("glow", p.cx, p.cy, 8, tint ?? 0xfff0d0);
    S.later((o.delay ?? 0.38) * 1000, () => {
      const dir = o.dir ?? p.facing, w = (o.w ?? 170) * K.size;
      const ang = o.ang ?? (dir > 0 ? 0 : PI);
      const x1 = p.cx + Math.cos(ang) * w, y1 = p.cy - 4 + Math.sin(ang) * w;
      V.beam(sc, p.cx, p.cy - 4, x1, y1, el ? V.palOf(el) : [0xffffff, 0xfff8e0, 0xfff0d0, 0x908060], 5, 300);
      const ts = new Set();
      for (let dd = 0; dd <= w; dd += 10) K.tin(p.cx + Math.cos(ang) * dd, p.cy - 4 + Math.sin(ang) * dd, 18 + (o.thick ?? 0)).forEach((t) => ts.add(t));
      for (const t of ts) (S.hit(t, o.m ?? 5, { stag: 0.9, kb: 260, heavy: 1, crit: o.crit, ...o.ho }), o.hit?.(t));
      o.move !== 0 && (p.body.x += Math.cos(ang) * Math.min(w * 0.6, 90));
      fx.stop?.(0.12);
      fx.shake(4);
      sc.cameras.main.flash(90, 255, 255, 255);
      S.snd("crit");
      o.cut?.([...ts], x1, y1);
    });
  };
  // 받아치기 (막기 자세)
  S.parry = (o = {}) => {
    const dur = o.dur ?? 0.45;
    p.iframes = Math.max(p.iframes, 0.05);
    fr.sparry = { until: Date.now() + dur * 1000, n: o.n ?? 1, cb: (at, dmg) => {
      fx.burst("spark", p.cx + p.facing * 8, p.cy, 14, 0xd0e0ff);
      S.text(p.cx, p.body.y - 36, "막기!", "#d0e0ff");
      S.snd("block");
      at && !at.dead && o.counter !== 0 && S.hit(at, o.m ?? 3, { kb: 260, stag: 0.8, heavy: 1 });
      o.block?.(at, dmg);
    } };
    const g = S.img("vx_ring", p.cx, p.cy, { add: 1, tint: 0xd0e0ff, scale: 0.9, alpha: 0.7 });
    K.ent({ dur, upd: () => g.setPosition(p.cx, p.cy).setAlpha(0.4 + Math.random() * 0.3), end: () => (g.destroy(), fr.sparry?.until <= Date.now() + 5 && (fr.sparry = null), o.end?.()) });
    S.snd("block");
  };
  // 갈고리 사슬
  S.hook = (o = {}) => {
    const t = o.t ?? K.near(p.cx + p.facing * 60, p.cy, o.r ?? 280, 1)[0];
    if (!t) return void (S.bolt(p.cx, p.cy, p.cx + p.facing * 120, p.cy, "none", 1, 200), S.snd("swing"));
    const [tx, ty] = S.tp(t);
    chainFx(S, p.cx, p.cy, tx, ty);
    if (t.kind === "boss" || o.selfPull) ((p.body.x = t.body.x - Math.sign(t.body.x - p.cx) * (t.body.w / 2 + 12)), (p.body.vy = -120));
    else t.body.x = (o.toX ?? p.cx + p.facing * 22);
    S.hit(t, o.m ?? 1, { stag: 0.8, kb: 30, ...o.ho });
    S.snd("swing");
    o.pulled?.(t);
    return t;
  };
  // 전투 함성
  S.shout = (o = {}) => {
    p.buff("atk", o.dur ?? 8, o.atk ?? 0.3, "berserk", "전투 함성");
    const ts = K.tin(o.x ?? p.cx, o.y ?? p.cy, o.r ?? 100);
    for (const t of ts) (o.fear !== 0 && S.fear(t, o.fear ?? 1), o.hit?.(t));
    S.ring(o.x ?? p.cx, o.y ?? p.cy, o.r ?? 100, el ?? "fire");
    S.rays(o.x ?? p.cx, o.y ?? p.cy, o.r ?? 100, el ?? "fire", 12);
    fx.shake(3);
    S.snd("buff");
    return ts;
  };
  // 집중 (다음 공격 N회 치명)
  S.focus = (n = 3) => {
    fr.focus = n;
    p.buff("critNext", 30, 1, "crit", "집중");
    fx.burst("rise", p.cx, p.cy, 16, 0xffd84a);
    S.snd("buff");
  };
  S.fissure = S.crack;
  // 지면 강타 균열
  S.crack = (o = {}) => S.spikes(o.x ?? p.cx + (o.dir ?? p.facing) * 20, o.dir ?? p.facing, o.n ?? 7, { gap: 22, step: 55, m: o.m ?? 1, el, st: { stun: o.stun ?? 0.8, ...(o.st ?? {}) }, up: 240, y: o.y, hit: o.hit, each: o.each, ...o.ho });
  // 단검
  S.daggers = (o = {}) => {
    const n = o.n ?? 3, sp = o.spread ?? 0.22, base = o.ang ?? (p.facing > 0 ? 0 : PI);
    for (let i = 0; i < n; i++) S.shot({ spr: "p_blade", x: o.x, y: o.y, ang: o.angs?.[i] ?? base + (n > 1 ? (i - (n - 1) / 2) * sp : 0), speed: o.speed ?? 420, life: o.life ?? 1, scale: o.scale ?? 1.3, m: o.m ?? 0.7, pierce: o.pierce ?? 0, homing: o.homing ?? 0, noTerrain: o.noTerrain, delay: o.seq ? i * o.seq : 0, spin: o.spin ?? 0, glow: 0.6, trail: el ? 1 : 0, el, hit: o.hit, end: o.end, ...(o.ho ? { st: o.ho.st, crit: o.ho.crit } : {}) });
    S.snd("shoot");
  };
  // 회오리 발차기
  S.kick = (o = {}) => S.spin({ n: o.n ?? 4, r: o.r ?? 40, m: o.m ?? 0.8, up: o.up ?? 220, kick: 1, ...o });
  // 관통 사격
  S.snipe = (o = {}) => {
    const go = () => {
      const x = o.x ?? p.cx + p.facing * 10, y = o.y ?? p.cy - 4;
      const ang = o.ang ?? (p.facing > 0 ? 0 : PI);
      const ts = S.beam(x, y, ang, o.len ?? 640, { m: o.m ?? 4, w: o.w ?? 8, kb: 220, fade: 360, el, crit: o.crit, ...o.ho });
      fx.shake(4);
      o.hit && ts.forEach((t) => o.hit(t));
      o.end?.(ts);
    };
    if (o.aim === 0) return go();
    p.body.vx = 0;
    fx.burst("glow", p.cx + p.facing * 10, p.cy, 10, tint ?? 0xfff0a0);
    S.snd("charge");
    S.later((o.aim ?? 0.6) * 1000, go);
  };
  // 부채꼴 사격
  S.fanShot = (o = {}) => {
    const n = o.n ?? 5, sp = o.spread ?? 0.16, base = o.ang ?? (p.facing > 0 ? 0 : PI);
    for (let i = 0; i < n; i++) S.shot({ spr: "p_arrow", x: o.x, y: o.y, ang: base + (i - (n - 1) / 2) * sp, speed: o.speed ?? 520, life: o.life ?? 1, scale: 1.2, m: o.m ?? 0.9, pierce: o.pierce ?? 0, glow: 0.5, trail: el ? 1 : 0, el, hit: o.hit, end: o.end, crit: o.crit, ...(o.ho ?? {}) });
    S.snd("shoot");
  };
  // 덫
  S.trap = (x, o = {}) => {
    const gy = S.gy(x, o.y);
    fr.zones = fr.zones.filter((z) => z.kind !== "trap" || fr.zones.filter((q) => q.kind === "trap").length <= (o.max ?? 3) - 1 || (z.g.destroy(), !1));
    return K.zone({ kind: "trap", x, y: gy, r: 18, t: o.dur ?? 12, el, dmg: K.B * (o.m ?? 3), tick: 0.1, stunDur: o.root ?? 2, onTrigger: o.trigger });
  };
  // 처형
  S.execute = (o = {}) => {
    const dir = p.facing, x1 = (o.x ?? p.cx) + dir * (o.w ?? 50);
    fx.anim("fx_heavy", (o.x ?? p.cx) + dir * 18, p.cy, { flip: dir < 0, tint: 0xff4040, scale: 1.3 });
    S.slash(o.x ?? p.cx, p.cy - 4, 44, dir > 0 ? -2 : PI + 2, dir > 0 ? 1.4 : PI - 1.4, el ?? "fire", 12, 300);
    const ts = o.ts ?? K.trect(o.x ?? p.cx, x1, p.body.y - 40, p.body.y + 6);
    for (const t of ts) S.tryExec(t, o.th ?? 0.25, o.m ?? 2.5, o);
    S.snd("crit");
    return ts;
  };
  S.tryExec = (t, th = 0.25, m = 2.5, o = {}) => {
    if (!t || t.dead) return !1;
    const low = t.hp / t.maxHp <= th;
    if (low && t.kind !== "boss" && !t.isElite) {
      t.receive(t.hp + 1, !0, { knock: 120, dir: p.facing, stagger: 1 });
      S.text(t.body.x, t.body.y - t.body.h - 10, "처형", "#ff4040");
      fx.anim("explode", t.body.x, t.body.y - t.body.h / 2, { scale: 1, tint: 0xff4040, blend: !0 });
    } else S.hit(t, m * (low ? 3 : 1), { stag: 0.7, heavy: 1, crit: o.crit });
    if (t.dead) (o.kill?.(t), o.reset !== 0 && K.resetCd?.());
    return t.dead;
  };
  // 질풍난무 (적 사이를 오가며)
  S.frenzy = (o = {}) => {
    const dur = o.dur ?? 2.4, n = o.n ?? 15;
    p.iframes = Math.max(p.iframes, dur + 0.2);
    let i = 0;
    const tick = () => {
      if (p.dead) return;
      const t = pickOf(K.near(p.cx, p.cy, o.r ?? 320, 6));
      if (t) {
        let s = Math.random() < 0.5 ? -1 : 1;
        const ox = p.cx, oy = p.cy;
        p.spawnAfterimage?.();
        // 벽 속으로 들어가지 않는 쪽을 고른다 (양쪽 다 막히면 적 바로 위치)
        const W = sc.world, free = (x) => { if (!W?.solidAtPx) return !0; const y = p.body.y; for (let yy = y - p.body.h + 2; yy < y; yy += 8) for (const xx of [x - p.body.w / 2 + 1, x + p.body.w / 2 - 1]) if (W.solidAtPx(xx, yy)) return !1; return !0; };
        !free(t.body.x + s * 14) && (s = -s);
        p.body.x = free(t.body.x + s * 14) ? t.body.x + s * 14 : t.body.x;
        o.air && (p.body.y = t.body.y - t.body.h - 10);
        p.body.vy = o.air ? -60 : p.body.vy;
        p.facing = -s;
        fx.anim("fx_slash", t.body.x, t.body.y - t.body.h / 2, { flip: Math.random() < 0.5, tint: tint ?? 0xd0f0ff });
        const ra = Math.random() * 6.28;
        S.slash(t.body.x, t.body.y - t.body.h / 2, 24, ra, ra + 2.6, el, 6, 180);
        o.tele && S.ghost(ox, oy + 9, s > 0, 300, 0x9060d0);
        S.hit(t, (o.m ?? 0.4) * (o.mult?.(t) ?? 1), { kb: 40, stag: 0.15, crit: o.crit, ...o.ho });
        o.each?.(t, i, ox, oy);
        i % 2 === 0 && S.snd("swing", 1.2);
      }
      ++i < n ? sc.time.delayedCall((dur * 1000) / n, tick) : o.end?.(p.cx, p.cy);
    };
    tick();
  };
  // 무기 투척 (던졌다 회수)
  S.boomer = (o = {}) => {
    const ang = o.ang ?? (p.facing > 0 ? 0 : PI);
    const dist = o.dist ?? 200, sp = o.speed ?? 420;
    let back = !1;
    const P = S.shot({ spr: o.spr ?? "p_blade", x: o.x, y: o.y, ang, speed: sp, life: 5, pierce: 99, noTerrain: 1, scale: o.scale ?? 1.8, spin: 18, m: o.m ?? 1.8, glow: 0.8, trail: 1, el, hit: o.hit, crit: o.crit, ...(o.ho ?? {}),
      tick: (P, dt) => {
        P.tt2 = (P.tt2 ?? 0) + dt;
        o.tick?.(P, dt);
        if (!back && (P.tt2 * sp >= dist || o.stopOut?.(P))) {
          back = !0;
          P.hits.clear();
          o.out?.(P.x, P.y, P);
          if (o.noReturn) return void S.end(P);
        }
        if (back) {
          const a = Math.atan2(p.cy - P.y, p.cx - P.x);
          P.vx = Math.cos(a) * sp * 1.2;
          P.vy = Math.sin(a) * sp * 1.2;
          Math.hypot(p.cx - P.x, p.cy - P.y) < 14 && (S.end(P), o.back?.(p.cx, p.cy));
        }
      } });
    S.snd("swing");
    return P;
  };
  // 잔상 연격
  S.afterimages = (o = {}) => {
    const n = o.n ?? 3, hits = o.hits ?? 8;
    for (let k = 0; k < n; k++) {
      const off = (k - (n - 1) / 2) * 22;
      S.later(k * 60, () => {
        const gx = p.cx + off, g = S.ghost(gx, p.body.y, p.facing < 0, 900);
        for (let i = 0; i < Math.ceil(hits / n); i++) S.later(i * 90, () => {
          const tx = gx + p.facing * 26;
          S.slash(tx, p.cy - 4, 22, rnd(-3, 0), rnd(0, 3), el, 6, 160);
          K.tin(tx, p.cy, 26).forEach((t) => S.hit(t, o.m ?? 0.5, { kb: 40, stag: 0.15, ...o.ho }));
        });
      });
    }
    S.snd("swing");
  };
  return S;
}
function pickOf(a) {
  return a[Math.floor(Math.random() * a.length)];
}
function A_slash(S, x, y, r, a0, a1, w, dur) {
  S.slash(x, y, r, a0, a1, S.K.el, w, dur);
}
function chainFx(S, x0, y0, x1, y1) {
  const sc = S.sc;
  const g = V.track(sc, sc.add.graphics().setDepth(31));
  g.lineStyle(2, 0xb0b0c0, 1).lineBetween(x0, y0, x1, y1);
  for (let i = 0; i <= 8; i++) g.fillStyle(0xe0e0f0, 1).fillCircle(x0 + ((x1 - x0) * i) / 8, y0 + ((y1 - y0) * i) / 8, 1.5);
  sc.tweens.add({ targets: g, alpha: 0, duration: 300, onComplete: () => g.destroy() });
}
