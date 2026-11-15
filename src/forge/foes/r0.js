// 1지역 「잿빛 마을」 — 화로가 떨어지던 날 불타버린 마을. 회색 재가 눈처럼 끝없이 내린다.
// 마을 사람들은 재가 되어 일어났고, 기사단은 불타는 갑옷 속에서 아직도 맹세를 지킨다.
// 그림은 m0.js (3D 모델), 여기서는 행동.
import { register, frameOf } from "./core.js";
import { ghoul, rat, archer, scarecrow, crow, husk, warden, ringer } from "./m0.js";

const EMBER = 0xff8a30;
const R0 = { j: null };
export const bindR0 = (j) => (R0.j = j);
const DT = 1 / 60;

// ════════ 잿더미 좀비 ════════ 느리게 걸어와 두 번 할퀴기. 쓰러진 뒤 절반은 3초 뒤 다시 일어난다.
register("fr0_0", {
  ...ghoul, speed: 34, sight: 220,
  init(e) {
    e.opts.revived && (e.fz.mem.rise = 1);
  },
  *brain(e, A) {
    if (e.fz.mem.rise) {
      A.burst("glow", 0, -6, 10, EMBER);
      yield A.once("rise");
      e.fz.mem.rise = 0;
    }
    for (;;) {
      if (!e.aggro) {
        A.play("move", 6);
        A.walk(e.fz.mem.wd ?? 1, 14);
        Math.random() < 0.006 && (e.fz.mem.wd = -(e.fz.mem.wd ?? 1));
        yield 0;
        continue;
      }
      if (Math.abs(A.dx) > 28 || Math.abs(A.dy) > 30) {
        A.play("move");
        A.walk(Math.sign(A.dx), e.speed);
        yield 0;
        continue;
      }
      // 크게 몸을 젖혀 팔을 치켜들고 → 두 번 할퀴기
      A.stop(1), A.face();
      A.tele(0.45);
      yield A.once("wind", 9);
      yield 0.12;
      A.once("atk", 16);
      yield 0.06;
      e.body.vx = e.facing * 110;
      A.melee(30, 28, 0.9);
      A.fxSlash(16, -16, 0.9, 0xffc090);
      A.sound("swing", 0.6);
      yield 0.12;
      A.melee(30, 28, 0.9);
      A.fxSlash(14, -12, 0.8, 0xffc090);
      yield 0.12;
      yield A.once("rec");
      A.play("idle");
      yield 0.4;
    }
  },
  die(e) {
    if (e.opts.revived || e.opts.summoned || Math.random() > 0.5) return;
    // 재 무더기로 남았다가 다시 일어난다
    const host = e.host, x = e.cx, y = e.body.y, id = e.def.id;
    const pile = host.add.sprite(x, y, `e_${id}`, frameOf(id, "pile", 1)).setOrigin(0.5, 1).setDepth(9).setFlipX(e.facing < 0);
    host.time.delayedCall(3000, () => {
      pile.destroy();
      if (host.dying) return;
      const z = host.spawnEnemy(id, x, y, { revived: !0, summoned: !0, noGold: !0 });
      z && (z.aggro = !0);
    });
  },
});

// ════════ 불씨 쥐 ════════ 무리. 맴돌다 달려들어 물고 빠진다. 죽을 때 작은 불길을 남긴다.
register("fr0_1", {
  ...rat, speed: 150, sight: 240,
  *brain(e, A) {
    for (;;) {
      if (!e.aggro) {
        A.play("idle"), A.stop();
        yield 0.2;
        continue;
      }
      if (Math.abs(A.dx) > 90) {
        A.play("move"), A.walk(Math.sign(A.dx), e.speed);
        yield 0;
        continue;
      }
      // 몸을 낮췄다가 → 튀어 물기 → 뒤로 빠지기
      A.face(), A.stop(1);
      A.tele(0.3);
      yield A.once("wind", 10);
      A.once("atk");
      e.body.vx = e.facing * 330;
      e.body.vy = -130;
      A.sound("dash", 0.5);
      let hit = !1;
      for (let t = 0; t < 0.32; t += DT) {
        !hit && A.melee(14, 12, 0.7) && ((hit = !0), A.burst("spark", 6, -6, 6, EMBER));
        yield 0;
      }
      A.once("back");
      e.body.vx = -e.facing * 220;
      e.body.vy = -170;
      yield 0.35;
      A.play("move");
      const away = -Math.sign(A.dx) || 1;
      for (let t = 0; t < 0.4 + Math.random() * 0.6; t += DT) (A.walk(away, e.speed * 0.8), yield 0);
    }
  },
  die(e, A) {
    A.zone(e.cx, e.body.y, 22, 2, 0.25, { st: { type: "burn", chance: 0.5, dur: 2, power: 0.2 } });
  },
});

// ════════ 그을린 해골 궁수 ════════ 2초마다 불화살. 가까이 오면 뒤로 공중제비.
register("fr0_2", {
  ...archer, speed: 60, sight: 300,
  *brain(e, A) {
    const M = e.fz.mem;
    M.cd = 1;
    M.hop = 0;
    for (;;) {
      M.cd -= DT, M.hop -= DT;
      if (!e.aggro) {
        A.play("idle"), A.stop();
        yield 0.2;
        continue;
      }
      const d = Math.abs(A.dx);
      A.face();
      if (d < 70 && M.hop <= 0 && A.ground) {
        M.hop = 1.6;
        A.once("hop", 9);
        e.body.vx = -e.facing * 230;
        e.body.vy = -340;
        A.sound("jump", 0.5);
        yield 0.5;
        continue;
      }
      if (d > 230) {
        A.play("move"), A.walk(Math.sign(A.dx), e.speed);
        yield 0;
        continue;
      }
      if (d < 110 && M.hop > 0) (A.play("move"), A.walk(-Math.sign(A.dx), e.speed * 0.8, { climb: !1 }), A.face());
      else (A.stop(0.5), A.play("idle"));
      if (M.cd <= 0) {
        M.cd = 2;
        A.stop(1), A.face();
        // 시위를 끝까지 당겼다가 (화살촉이 달아오름) → 쏘고 활이 튄다
        A.tele(0.6);
        yield A.once("draw", 8);
        yield 0.1;
        A.once("shoot");
        const p = A.p, ox = e.cx + e.facing * 16, oy = e.body.y - 34;
        A.shoot({ sprite: "p_arrow", speed: 520, gravity: 120, life: 1.6, radius: 5, trail: EMBER }, ox, oy, Math.atan2(p.cy - oy, p.cx - ox), 1, { el: "fire", st: { type: "burn", chance: 0.4, dur: 2, power: 0.2 }, opts: { tint: 0xffb070 } });
        A.sound("bow", 0.7);
        yield 0.35;
      }
      yield 0;
    }
  },
});

// ════════ 타다 남은 허수아비 ════════ 제자리. 가까이 가면 불붙은 팔을 크게 휘두른다. 멀면 불씨를 뱉는다.
register("fr0_3", {
  ...scarecrow, speed: 1, sight: 200, heavy: 1,
  *brain(e, A) {
    const M = e.fz.mem;
    M.cd = 0;
    M.spit = 2;
    for (;;) {
      M.cd -= DT, M.spit -= DT;
      e.body.vx = 0;
      A.play("idle");
      const d = Math.abs(A.dx), dy = Math.abs(A.dy);
      if (e.aggro && d < 68 && dy < 44 && M.cd <= 0) {
        M.cd = 1.4;
        A.face();
        // 팔을 치켜들면 불길이 커진다 → 크게 휘두르기
        A.tele(0.55, { bar: [e.cx + e.facing * 30, 60] });
        A.sound("magic", 0.4);
        yield A.once("wind", 7);
        yield 0.1;
        A.once("atk");
        yield 0.07;
        A.melee(62, 46, 1.2, { st: { type: "burn", chance: 0.7, dur: 3, power: 0.25 }, el: "fire", knock: 1.5 });
        A.fxHeavy(24, -26, 1.5, 0xff9040);
        A.burst("spark", 26, -22, 14, EMBER);
        A.sound("swingHeavy", 0.7);
        A.shake(2);
        yield 0.2;
        A.chance(0.5) && A.zone(e.cx + e.facing * 30, e.body.y, 30, 2.2, 0.25, { st: { type: "burn", chance: 0.4, dur: 2, power: 0.2 } });
        yield A.once("rec");
        yield 0.3;
        continue;
      }
      if (e.aggro && d >= 68 && d < 170 && M.spit <= 0) {
        M.spit = 3.2;
        A.face();
        A.once("spit");
        yield 0.25;
        const p = A.p, ox = e.cx + e.facing * 4, oy = e.body.y - 52, T = 0.9;
        A.shoot({ sprite: "p_fire", speed: 230, gravity: 420, life: 3, radius: 5, aoe: 30 }, ox, oy, 0, 0.9, { el: "fire", opts: { vx: (p.cx - ox) / T, vy: (p.body.y - 10 - oy - 0.5 * 420 * T * T) / T } });
        yield 0.4;
      }
      yield 0;
    }
  },
});

// ════════ 재 까마귀 ════════ 머리 위를 맴돌다 울고 → 급강하로 쪼기.
register("fr0_4", {
  ...crow, speed: 110, sight: 280,
  *brain(e, A) {
    const M = e.fz.mem;
    M.cd = 1.5 + Math.random();
    M.ph = Math.random() * 6.28;
    for (;;) {
      M.cd -= DT, M.ph += DT;
      A.play("idle");
      if (!e.aggro) {
        A.flyTo(e.homeX + Math.cos(M.ph) * 60, e.body.y, 60);
        yield 0;
        continue;
      }
      const p = A.p;
      A.flyTo(p.cx + Math.cos(M.ph * 1.2) * 90, p.body.y - 95 + Math.sin(M.ph * 2.4) * 14, e.speed);
      if (M.cd <= 0 && Math.abs(A.dx) < 140) {
        M.cd = 2.6;
        A.face();
        e.body.vx *= 0.2, e.body.vy *= 0.2;
        A.tele(0.45);
        A.sound("warn", 0.4);
        yield A.once("cry", 7);
        const tx = p.cx, ty = p.body.y - 8, dd = Math.hypot(tx - e.cx, ty - e.body.y) || 1;
        const vx = ((tx - e.cx) / dd) * 390, vy = ((ty - e.body.y) / dd) * 390;
        A.play("dive");
        let hit = !1;
        for (let t = 0; t < 0.55; t += DT) {
          e.body.vx = vx, e.body.vy = vy;
          !hit && e.playerInRect(e.cx - 9, e.body.y - 14, 18, 14) && ((hit = !0), e.hit(0.9, !0), A.burst("spark", 0, -6, 8, 0xffffff));
          Math.random() < 0.4 && A.burst("glow", -8, -8, 1, EMBER);
          yield 0;
        }
        A.once("up");
        for (let t = 0; t < 0.4; t += DT) ((e.body.vy = -200), (e.body.vx *= 0.95), yield 0);
      }
      yield 0;
    }
  },
});

// ════════ 녹은 갑옷 ════════ 앞은 단단하고 등은 약하다(피해 2배). 철퇴 내려찍기 · 어깨 돌진.
register("fr0_5", {
  ...husk, speed: 30, sight: 220, heavy: 0.8, hpMul: 1.1,
  damage(e, dmg, C) {
    if (C.dir === e.facing) return (e.host.fx.burst("spark", e.cx, e.cy, 8, 0xffd84a), dmg * 2);
    if (C.dir === -e.facing && e.fz?.mem.state !== "swing") return (e.host.fx.burst("spark", e.cx + e.facing * 8, e.cy, 4, 0xd0d8ff), dmg * 0.6);
    return dmg;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    M.charge = 2;
    for (;;) {
      M.charge -= DT;
      M.state = "";
      if (!e.aggro) {
        A.play("idle"), A.stop();
        yield 0.2;
        continue;
      }
      const d = Math.abs(A.dx);
      if (d > 90 && d < 190 && M.charge <= 0 && Math.abs(A.dy) < 30) {
        M.charge = 4;
        A.face(), A.stop(1);
        // 어깨를 낮추고 발을 구른다 → 돌진
        A.tele(0.5, { bar: [e.cx + e.facing * 90, 180] });
        yield A.once("charge", 6);
        yield 0.1;
        A.play("dash");
        A.sound("dash", 0.7);
        let hit = !1;
        for (let t = 0; t < 0.45; t += DT) {
          e.body.vx = e.facing * 300;
          !hit && A.melee(14, 30, 1.1, { knock: 2 }) && ((hit = !0), A.shake(3));
          Math.random() < 0.5 && A.burst("dust", -10, -2, 1, 0x9a9090);
          yield 0;
        }
        A.stop(1);
        yield A.once("rec");
        yield 0.4;
        continue;
      }
      if (d > 36) {
        A.play("move"), A.walk(Math.sign(A.dx), e.speed);
        yield 0;
        continue;
      }
      // 철퇴를 머리 위로 → 내려찍기
      A.stop(1), A.face();
      M.state = "swing";
      A.tele(0.6, { bar: [e.cx + e.facing * 28, 60] });
      yield A.once("wind", 6.5);
      yield 0.12;
      A.once("slam");
      yield 0.07;
      A.melee(46, 36, 1.4, { el: "fire", knock: 1.6 });
      A.shake(4);
      A.sound("thud", 1);
      A.burst("chunk", 28, -2, 10, 0x8a7a6a);
      A.burst("spark", 28, -4, 10, EMBER);
      e.host.fx.anim("fx_smash", e.cx + e.facing * 28, e.body.y - 10, { scale: 1.2, tint: 0xffa060 });
      A.zone(e.cx + e.facing * 28, e.body.y, 28, 1.5, 0.2, { st: { type: "burn", chance: 0.5, dur: 2, power: 0.2 } });
      yield 0.3;
      M.state = "";
      yield A.once("rec");
      yield 0.5;
    }
  },
});

// ════════ [정예] 잿불 파수꾼 ════════ 방패로 정면을 막고, 3연타 뒤 방패 내려찍기(그 뒤 1초 무릎). 체력 절반 아래면 방패에 불이 붙어 막을 때마다 반격.
register("fr0_e0", {
  ...warden, speed: 46, sight: 260, heavy: 0.85,
  tick(e, A) {
    const M = e.fz.mem;
    M.fire = e.hp < e.maxHp * 0.5;
    M.fire && Math.random() < 0.5 && A.burst("glow", 14, -18 - Math.random() * 22, 1, EMBER);
    M.fire && !M.lit && ((M.lit = 1), A.burst("spark", 14, -24, 20, EMBER));
  },
  blocks(e, S) {
    const M = e.fz?.mem;
    if (!M || M.open || e.stunT > 0) return !1;
    const b = S.dir === -e.facing;
    if (b) {
      e.host.fx.burst("spark", e.cx + e.facing * 14, e.cy, 6, 0xffe0b0);
      R0.j?.play("block", 0.5);
      M.fire && e.host.time.delayedCall(100, () => !e.dead && (e.fA.zone(e.cx + e.facing * 22, e.body.y, 30, 1.2, 0.3), e.fA.melee(36, 36, 0.6, { el: "fire" }), e.fA.burst("spark", 18, -18, 10, EMBER)));
    }
    return b;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    for (;;) {
      M.open = !1;
      if (!e.aggro) {
        A.play("idle"), A.stop();
        yield 0.2;
        continue;
      }
      if (Math.abs(A.dx) > 42) {
        A.play("move"), A.walk(Math.sign(A.dx), e.speed);
        yield 0;
        continue;
      }
      // 3연타
      A.stop(1), A.face();
      M.open = !0;
      A.tele(0.4);
      yield A.once("wind", 8);
      yield 0.08;
      for (const nm of ["s1", "s2", "s3"]) {
        A.face();
        A.once(nm);
        yield 0.05;
        e.body.vx = e.facing * 100;
        A.melee(44, 38, 0.9, { el: M.fire ? "fire" : "phys" });
        A.fxSlash(22, -22, 1.15, M.fire ? 0xff9040 : 0xffffff);
        A.sound("swing", 0.8);
        yield nm === "s3" ? 0.32 : 0.2;
      }
      // 방패를 들어올렸다가 → 내려찍기 → 무릎 꿇은 빈틈
      A.tele(0.5, { bar: [e.cx + e.facing * 30, 70] });
      yield A.once("bash", 6);
      A.once("slam");
      yield 0.06;
      A.melee(50, 32, 1.4, { knock: 2 });
      A.shake(5);
      A.sound("thud", 1.2);
      A.burst("chunk", 28, -2, 12, 0x8a7a6a);
      e.host.fx.anim("fx_smash", e.cx + e.facing * 28, e.body.y - 10, { scale: 1.4 });
      M.fire && A.zone(e.cx + e.facing * 30, e.body.y, 40, 2, 0.3);
      yield 0.2;
      A.play("stun");
      yield 1.1;
      M.open = !1;
      yield 0.2;
    }
  },
});

// ════════ [정예] 부서진 종지기 ════════ 종을 울려 주변 적을 빠르게 하고, 세 번째 종소리마다 잿더미 좀비 2체. 정면 공격은 종이 대신 맞고, 종(체력 80)이 부서지면 소환이 멈춘다.
register("fr0_e1", {
  ...ringer, speed: 34, sight: 260,
  damage(e, dmg, C) {
    const M = e.fz?.mem;
    if (!M || M.bell <= 0) return dmg;
    if (C.dir === -e.facing || Math.random() < 0.4) {
      M.bell -= dmg;
      R0.j?.play("block", 0.4);
      e.host.fx.burst("spark", e.cx + e.facing * 16, e.body.y - 16, 5, 0xe0b060);
      if (M.bell <= 0) {
        e.host.fx.burst("chunk", e.cx + e.facing * 16, e.body.y - 16, 22, 0xb08840);
        e.host.fx.shake(4);
        R0.j?.play("explosion", 0.6);
      }
      return dmg * 0.3;
    }
    return dmg;
  },
  init(e) {
    e.fz.mem.bell = 80;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    M.ring = 1.5;
    M.count = 0;
    for (;;) {
      M.ring -= DT;
      const nb = M.bell <= 0;
      if (!e.aggro) {
        A.play(nb ? "nidle" : "idle"), A.stop();
        yield 0.2;
        continue;
      }
      if (!nb && M.ring <= 0) {
        M.ring = 3.6;
        A.stop(1), A.face();
        A.once("ring", 11);
        for (let k = 0; k < 2; k++) {
          yield 0.22;
          A.sound("record", 0.5);
          e.host.fx.anim("ring", e.cx, e.body.y - 22, { scale: 3.5, tint: 0xffd890 });
        }
        yield 0.12;
        M.count++;
        for (const o of e.host.enemies)
          if (o !== e && !o.dead && Math.abs(o.cx - e.cx) < 220) {
            o.buffT = 5;
            o._spd0 = o._spd0 ?? o.speed;
            o.speed = o._spd0 * 1.5;
            e.host.time.delayedCall(5000, () => o._spd0 && (o.speed = o._spd0));
          }
        if (M.count % 3 === 0)
          for (let k = 0; k < 2; k++) {
            const z = e.host.spawnEnemy("fr0_0", e.cx + (k ? 40 : -40), e.body.y, { summoned: !0, noGold: !0, revived: !0 });
            z && ((z.aggro = !0), e.host.fx.burst("glow", z.cx, z.cy, 12, EMBER));
          }
        continue;
      }
      if (Math.abs(A.dx) > 38) {
        A.play(nb ? "nmove" : "move");
        A.walk(Math.sign(A.dx), nb ? e.speed * 1.6 : e.speed);
        yield 0;
        continue;
      }
      A.stop(1), A.face();
      if (!nb) {
        // 종을 머리 위로 → 내려치기
        A.tele(0.6, { bar: [e.cx + e.facing * 24, 60] });
        yield A.once("wind", 7);
        yield 0.1;
        A.once("smash");
        yield 0.08;
        A.melee(48, 42, 1.5, { knock: 2 });
        A.shake(4);
        A.sound("thud", 1);
        e.host.fx.anim("ring", e.cx + e.facing * 24, e.body.y - 6, { scale: 1.6, tint: 0xffd890 });
        yield 0.2;
        yield A.once("rec");
        yield 0.3;
      } else {
        A.tele(0.3);
        yield A.once("natk");
        A.melee(32, 30, 1);
        A.fxSlash(18, -20, 0.9, 0xe0b060);
        yield 0.45;
      }
    }
  },
});
