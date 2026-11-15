// 4지역 「썩은 늪」 행동 (그림은 m3.js)
// 광산에서 흘러나온 폐수가 고여 만들어진 늪. 무엇이든 썩어 다시 살아난다.
import { register } from "./core.js";
import { leech, bloater, toadWarrior, dragonfly, swampHag, fungalColony, mossTroll, plagueDoctor } from "./m3.js";

const DT = 1 / 60, POISON = 0x9aff60, MUDC = 0x6a7a4a;
const POIS = (p = 0.2, d = 3) => ({ type: "poison", chance: 1, dur: d, power: p });
// 늪에서 쓰러진 것들의 자리 (늪 마녀가 되살린다)
const corpses = (host) => (host._corpses = host._corpses ?? []);
const noteCorpse = (e) => !e.opts.summoned && corpses(e.host).push({ id: e.def.id, x: e.cx, y: e.body.y, t: e.host.time.now });

// ════════ 늪 거머리 ════════ 달라붙어 초당 흡혈. 대시로 떼어낸다.
register("fr3_0", {
  ...leech, speed: 60, sight: 220,
  die: noteCorpse,
  *brain(e, A) {
    const M = e.fz.mem;
    for (;;) {
      if (!e.aggro) {
        A.play("idle"), A.stop();
        yield 0.2;
        continue;
      }
      if (Math.abs(A.dx) > 40) {
        A.play("move"), A.walk(Math.sign(A.dx), e.speed);
        yield 0;
        continue;
      }
      // 고개를 쳐들었다가 → 덮쳐서 달라붙기
      A.face(), A.stop(1);
      A.tele(0.35);
      yield A.once("wind", 7);
      A.once("atk");
      e.body.vx = e.facing * 220;
      e.body.vy = -160;
      let caught = !1;
      for (let t = 0; t < 0.35; t += DT) {
        if (e.playerInRect(e.cx - 10, e.body.y - 12, 20, 12)) { caught = !0; break; }
        yield 0;
      }
      if (!caught) {
        yield 0.6;
        continue;
      }
      // 달라붙어 피를 빤다: 대시하면 떨어진다
      const p = A.p, side = e.cx < p.cx ? -1 : 1;
      A.play("latch");
      A.sound("punch", 0.5);
      let drain = 0;
      for (let t = 0; t < 4 && !e.dead; t += DT) {
        e.body.x = p.cx + side * 6;
        e.body.y = p.body.y - 2;
        e.body.vx = e.body.vy = 0;
        if ((drain += DT) >= 0.5) {
          drain = 0;
          e.host.hurtPlayer({ dmg: e.atk * 0.35, element: "phys", knock: 0, dir: side, melee: !0, srcX: e.cx });
          e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.06);
          A.burst("glow", 0, -8, 3, 0xd84a5a);
        }
        if (p.dashT > 0 || p.dead) break;
        yield 0;
      }
      // 떨어져 나간다
      e.body.vx = side * 160;
      e.body.vy = -200;
      A.play("idle");
      yield 1;
    }
  },
});

// ════════ 부풀은 시체 ════════ 매우 느리다. 죽으면 터져서 독 웅덩이 5초.
register("fr3_1", {
  ...bloater, speed: 18, sight: 200, heavy: 0.7, hpMul: 1.2,
  die(e, A) {
    noteCorpse(e);
    e.host.fx.anim("explode", e.cx, e.cy, { scale: 1.8, tint: POISON });
    A.burst("glow", 0, -20, 24, POISON);
    A.sound("explosion", 0.7);
    A.zone(e.cx, e.body.y, 70, 5, 0.2, { el: "poison", st: POIS(0.25, 3), kind: "poison" });
    A.melee(30, 40, 0.8, { el: "poison", st: POIS(0.3, 3), back: -30 });
  },
  *brain(e, A) {
    for (;;) {
      if (!e.aggro) {
        A.play("idle"), A.stop();
        yield 0.2;
        continue;
      }
      if (Math.abs(A.dx) > 34) {
        A.play("move"), A.walk(Math.sign(A.dx), e.speed);
        yield 0;
        continue;
      }
      // 배를 부풀렸다가 → 덮치기
      A.stop(1), A.face();
      A.tele(0.6, { bar: [e.cx + e.facing * 24, 54] });
      yield A.once("wind", 5);
      A.once("atk");
      yield 0.08;
      A.melee(40, 40, 1.2, { el: "poison", st: POIS(0.15, 2), knock: 1.8 });
      A.burst("glow", 20, -16, 8, POISON);
      A.sound("thud", 0.9);
      A.shake(2);
      yield 0.25;
      yield A.once("rec");
      yield 0.6;
    }
  },
});

// ════════ 두꺼비 전사 ════════ 혀로 끌어당긴 뒤 몽둥이로 내려찍는다.
register("fr3_2", {
  ...toadWarrior, speed: 60, sight: 240,
  die: noteCorpse,
  *brain(e, A) {
    const M = e.fz.mem;
    M.tongue = 1;
    for (;;) {
      M.tongue -= DT;
      if (!e.aggro) {
        A.play("idle"), A.stop();
        yield 0.2;
        continue;
      }
      const d = Math.abs(A.dx), p = A.p;
      if (d > 60 && d < 170 && Math.abs(A.dy) < 30 && M.tongue <= 0) {
        M.tongue = 3.5;
        A.stop(1), A.face();
        A.tele(0.45);
        yield 0.45;
        A.once("tongue");
        A.sound("dash", 0.5);
        yield 0.07;
        // 혀가 닿으면 끌어당긴다
        const hit = Math.sign(p.cx - e.cx) === e.facing && d < 170 && Math.abs(p.cy - (e.body.y - 26)) < 22;
        if (hit) {
          for (let t = 0; t < 0.3; t += DT) {
            p.body.x += (e.cx + e.facing * 26 - p.body.x) * 0.25;
            p.body.vx = 0;
            yield 0;
          }
          // 바로 내려찍기
          yield A.once("wind", 12);
          A.once("atk");
          yield 0.05;
          A.melee(40, 40, 1.4, { knock: 1.8 });
          A.burst("chunk", 24, -2, 8, MUDC);
          A.sound("thud", 1);
          A.shake(3);
          yield 0.6;
        } else yield 0.5;
        continue;
      }
      if (d > 36) {
        A.play("move"), A.walk(Math.sign(A.dx), e.speed);
        yield 0;
        continue;
      }
      A.stop(1), A.face();
      A.tele(0.45, { bar: [e.cx + e.facing * 24, 44] });
      yield A.once("wind", 8);
      A.once("atk");
      yield 0.06;
      A.melee(38, 36, 1.1, { knock: 1.3 });
      A.sound("swing", 0.8);
      yield 0.2;
      yield A.once("rec");
      yield 0.5;
    }
  },
});

// ════════ 독침 잠자리 ════════ 공중에서 독침 3연사.
register("fr3_3", {
  ...dragonfly, speed: 120, sight: 280,
  die: noteCorpse,
  *brain(e, A) {
    const M = e.fz.mem;
    M.cd = 1.5;
    M.ph = Math.random() * 6;
    for (;;) {
      M.cd -= DT, M.ph += DT;
      A.play("idle");
      const p = A.p;
      if (!e.aggro) {
        A.flyTo(e.homeX + Math.sin(M.ph * 1.5) * 40, e.body.y + Math.cos(M.ph * 3) * 0.4, 50);
        yield 0;
        continue;
      }
      // 빠르게 자리를 바꾸며 맴돈다
      A.flyTo(p.cx + Math.sin(M.ph * 0.9) * 120, p.body.y - 70 + Math.cos(M.ph * 2.3) * 16, e.speed);
      if (M.cd <= 0) {
        M.cd = 2.6;
        e.body.vx *= 0.1, e.body.vy *= 0.1;
        A.face();
        A.tele(0.35);
        yield A.once("wind", 6);
        for (let i = 0; i < 3; i++) {
          A.once("shoot", 16);
          const ox = e.cx - e.facing * 14, oy = e.body.y - 4;
          A.shoot({ sprite: "p_thorn", speed: 330, life: 1.8, radius: 4 }, ox, oy, Math.atan2(p.cy - oy, p.cx - ox), 0.6, { el: "poison", st: POIS(0.2, 3), opts: { tint: POISON } });
          A.sound("shoot", 0.4);
          yield 0.16;
        }
        yield 0.3;
      }
      yield 0;
    }
  },
});

// ════════ 늪 마녀 ════════ 저주 구슬을 던지고, 4초마다 쓰러진 적 하나를 되살린다.
register("fr3_4", {
  ...swampHag, speed: 40, sight: 260,
  *brain(e, A) {
    const M = e.fz.mem;
    M.cd = 1.5;
    M.raise = 4;
    for (;;) {
      M.cd -= DT, M.raise -= DT;
      if (!e.aggro) {
        A.play("idle"), A.stop();
        yield 0.2;
        continue;
      }
      const d = Math.abs(A.dx), host = e.host;
      // 되살리기: 가까운 시체 하나
      const list = corpses(host);
      const ci = list.findIndex((c) => Math.abs(c.x - e.cx) < 220 && host.time.now - c.t < 60000);
      if (M.raise <= 0 && ci >= 0) {
        M.raise = 4;
        const c = list.splice(ci, 1)[0];
        A.stop(1);
        A.tele(0.5);
        yield A.once("raise", 6);
        host.fx.anim("ring", c.x, c.y - 10, { scale: 2, tint: POISON });
        host.fx.burst("rise", c.x, c.y - 6, 14, POISON);
        const z = host.spawnEnemy(c.id, c.x, c.y, { summoned: !0, noGold: !0, revived: !0 });
        z && (z.aggro = !0);
        A.sound("magic", 0.6);
        yield 0.4;
        continue;
      }
      // 거리를 둔다
      if (d < 110) (A.play("move"), A.walk(-Math.sign(A.dx), e.speed, { climb: !1 }), A.face());
      else if (d > 230) (A.play("move"), A.walk(Math.sign(A.dx), e.speed));
      else (A.stop(0.5), A.play("idle"));
      if (M.cd <= 0 && d < 280) {
        M.cd = 2.8;
        A.stop(1), A.face();
        A.tele(0.45);
        yield A.once("cast", 8);
        const p = A.p, ox = e.cx + e.facing * 4, oy = e.body.y - 50;
        A.shoot({ sprite: "p_void", speed: 170, life: 3, radius: 6, homing: 1.2 }, ox, oy, Math.atan2(p.cy - oy, p.cx - ox), 0.9, { el: "dark", st: { type: "armorBreak", chance: 1, dur: 4, power: 0.3 }, opts: { tint: 0xb8ff70 } });
        A.sound("magic", 0.5);
        yield 0.4;
      }
      yield 0;
    }
  },
});

// ════════ 버섯 군락 ════════ 주변에 포자 구름. 구름 안의 적은 체력을 회복한다.
register("fr3_5", {
  ...fungalColony, speed: 1, sight: 200, heavy: 1,
  die: noteCorpse,
  *brain(e, A) {
    const M = e.fz.mem;
    M.cd = 1;
    for (;;) {
      M.cd -= DT;
      e.body.vx = 0;
      A.play("idle");
      if (e.aggro && M.cd <= 0) {
        M.cd = 3;
        A.once("pulse");
        yield 0.3;
        const host = e.host;
        host.fx.anim("ring", e.cx, e.body.y - 14, { scale: 3, tint: 0x60fff0 });
        for (let i = 0; i < 16; i++) host.fx.burst("glow", e.cx + (Math.random() - 0.5) * 140, e.body.y - Math.random() * 50, 1, i % 2 ? 0x60fff0 : 0xff70e8);
        for (const o of host.enemies) if (!o.dead && o !== e && Math.hypot(o.cx - e.cx, o.cy - e.cy) < 80) (o.hp = Math.min(o.maxHp, o.hp + o.maxHp * 0.08), host.fx.burst("rise", o.cx, o.cy, 3, 0x9affc0));
        const P = host.player;
        Math.abs(P.cx - e.cx) < 70 && Math.abs(P.body.y - e.body.y) < 50 && A.afflict(POIS(0.12, 2));
        yield 0.4;
      }
      yield 0;
    }
  },
});

// ════════ [정예] 이끼 트롤 ════════ 몽둥이 2연타 · 늪물을 퍼서 던진다(둔화) · 초당 체력 2% 재생.
register("fr3_e0", {
  ...mossTroll, speed: 40, sight: 260, heavy: 0.9,
  die: noteCorpse,
  tick(e, A) {
    const M = e.fz.mem;
    M.regen = (M.regen ?? 0) + DT;
    M.regen >= 1 && ((M.regen = 0), e.hp < e.maxHp && ((e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.02)), A.burst("rise", 0, -30, 2, 0x9affc0)));
  },
  *brain(e, A) {
    const M = e.fz.mem;
    M.mud = 2;
    for (;;) {
      M.mud -= DT;
      if (!e.aggro) {
        A.play("idle"), A.stop();
        yield 0.2;
        continue;
      }
      const d = Math.abs(A.dx);
      if (M.mud <= 0 && d > 80 && d < 260) {
        M.mud = 4;
        A.stop(1), A.face();
        A.tele(0.5);
        yield A.once("scoop", 6);
        yield A.once("throw", 12);
        const p = A.p, ox = e.cx + e.facing * 10, oy = e.body.y - 60, T = 0.8;
        A.shoot({ sprite: "p_snowball", speed: 250, gravity: 500, life: 3, radius: 8, aoe: 30 }, ox, oy, 0, 1, { el: "poison", st: { type: "chill", chance: 1, dur: 3, power: 0.5 }, opts: { vx: (p.cx - ox) / T, vy: (p.body.y - 10 - oy - 0.5 * 500 * T * T) / T, tint: 0x6a7a3a, scale: 1.6 } });
        A.sound("swingHeavy", 0.6);
        yield 0.5;
        continue;
      }
      if (d > 50) {
        A.play("move"), A.walk(Math.sign(A.dx), e.speed);
        yield 0;
        continue;
      }
      // 몽둥이 2연타
      A.stop(1), A.face();
      A.tele(0.55, { bar: [e.cx + e.facing * 34, 70] });
      yield A.once("wind", 7);
      yield 0.05;
      A.once("atk");
      yield 0.07;
      A.melee(60, 50, 1.3, { knock: 1.6 });
      A.burst("chunk", 34, -2, 10, MUDC);
      A.sound("thud", 1);
      A.shake(4);
      yield 0.25;
      A.once("atk2");
      yield 0.07;
      A.melee(60, 56, 1.1, { knock: 1.4 });
      A.fxHeavy(28, -30, 1.5, 0xc8e0a0);
      A.sound("swingHeavy", 0.8);
      yield 0.25;
      yield A.once("rec");
      yield 0.6;
    }
  },
});

// ════════ [정예] 역병 의사 ════════ 독 플라스크 셋 · 안개 속 순간이동 · 주변 적에게 강화 주사(공격력 +50%).
register("fr3_e1", {
  ...plagueDoctor, speed: 60, sight: 280,
  *brain(e, A) {
    const M = e.fz.mem;
    M.cd = 1.2;
    M.tele = 4;
    M.inject = 3;
    for (;;) {
      M.cd -= DT, M.tele -= DT, M.inject -= DT;
      if (!e.aggro) {
        A.play("idle"), A.stop();
        yield 0.2;
        continue;
      }
      const d = Math.abs(A.dx), host = e.host, p = A.p;
      // 강화 주사
      const ally = host.enemies.find((o) => o !== e && !o.dead && !o._buffed && Math.abs(o.cx - e.cx) < 160);
      if (M.inject <= 0 && ally) {
        M.inject = 5;
        A.face(Math.sign(ally.cx - e.cx) || 1);
        yield A.once("inject", 8);
        ally._buffed = 1;
        ally.atk *= 1.5;
        ally.buffT = 8;
        host.fx.anim("ring", ally.cx, ally.cy, { scale: 1.4, tint: POISON });
        host.time.delayedCall(8000, () => ((ally.atk /= 1.5), (ally._buffed = 0)));
        A.sound("buff", 0.5);
        yield 0.3;
        continue;
      }
      // 안개 속 순간이동 (가까이 붙으면)
      if (M.tele <= 0 && d < 70) {
        M.tele = 4;
        yield A.once("tele", 9);
        for (let i = 0; i < 10; i++) host.fx.burst("glow", e.cx + (Math.random() - 0.5) * 30, e.body.y - Math.random() * 40, 1, 0xa0c890);
        e.body.x = p.cx + (Math.random() < 0.5 ? -1 : 1) * 170;
        A.face();
        A.play("idle");
        yield 0.3;
        continue;
      }
      if (d < 120) (A.play("move"), A.walk(-Math.sign(A.dx), e.speed, { climb: !1 }), A.face());
      else if (d > 240) (A.play("move"), A.walk(Math.sign(A.dx), e.speed));
      else (A.stop(0.5), A.play("idle"));
      // 독 플라스크 셋 (떨어진 자리에 독 웅덩이)
      if (M.cd <= 0 && d < 280) {
        M.cd = 3;
        A.stop(1), A.face();
        A.tele(0.45);
        yield A.once("throw", 9);
        for (let i = 0; i < 3; i++) {
          const ox = e.cx + e.facing * 8, oy = e.body.y - 40, tx = p.cx + (i - 1) * 40, T = 0.7 + i * 0.08;
          const f = host.add.image(ox, oy, "vx_glow").setTint(POISON).setScale(0.3).setDepth(14);
          host.tweens.addCounter({
            from: 0, to: 1, duration: T * 1000,
            onUpdate: (tw) => {
              const u = tw.getValue();
              f.setPosition(ox + (tx - ox) * u, oy + (p.body.y - 6 - oy) * u - Math.sin(u * Math.PI) * 50);
            },
            onComplete: () => {
              f.destroy();
              host.fx.anim("explode", tx, p.body.y - 6, { scale: 1, tint: POISON });
              A.zone(tx, p.body.y, 36, 3, 0.2, { el: "poison", st: POIS(0.25, 3), kind: "poison" });
            },
          });
        }
        A.sound("shoot", 0.5);
        yield 0.4;
      }
      yield 0;
    }
  },
});
