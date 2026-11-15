// 3지역 「울림 광산」 행동 (그림은 m2.js)
// 화로의 파편을 캐기 위해 파 들어간 광산. 광부들은 너무 깊이 팠고, 깊은 곳의 것들이 올라왔다.
import { register } from "./core.js";
import { skelMiner, oreWorm, batSwarm, bombGoblin, crystalSpider, veinSpirit, cartKnight, stoneGolem } from "./m2.js";

const DT = 1 / 60, ORE = 0x5af0d8, ROCKC = 0x8a7a6a, FIRE = 0xff8a30;

// 천장에서 바위가 떨어진다 (경고 후 낙하)
function rockfall(e, A, x, delay = 0.6) {
  const host = e.host, gy = host.player.body.y;
  const warn = host.add.image(x, gy, "warn").setOrigin(0.5, 1).setDepth(29).setDisplaySize(22, 6).setAlpha(0.85);
  host.tweens.add({ targets: warn, alpha: 0.3, duration: 100, yoyo: !0, repeat: -1 });
  host.time.delayedCall(delay * 1000, () => {
    warn.destroy();
    if (e.dead && !e.opts.boss) return;
    const r = host.add.image(x, gy - 220, "p_rock").setDepth(14).setScale(2.2);
    host.tweens.add({
      targets: r, y: gy - 6, duration: 320, ease: "Quad.easeIn",
      onComplete: () => {
        r.destroy();
        host.fx.burst("chunk", x, gy - 4, 10, ROCKC);
        host.fx.shake(2);
        const P = host.player;
        !P.dead && Math.abs(P.cx - x) < 14 && Math.abs(P.body.y - gy) < 30 && host.hurtPlayer({ dmg: e.atk * 1.1, element: "earth", knock: 1, dir: P.cx < x ? -1 : 1, melee: !1, srcX: x });
      },
    });
  });
}

// ════════ 해골 광부 ════════ 곡괭이 내려찍기. 천장을 찍어 낙석을 떨어뜨리기도 한다.
register("fr2_0", {
  ...skelMiner, speed: 46, sight: 230,
  *brain(e, A) {
    const M = e.fz.mem;
    M.ceil = 3;
    for (;;) {
      M.ceil -= DT;
      if (!e.aggro) {
        A.play("move", 6), A.walk(M.wd ?? 1, 16);
        Math.random() < 0.006 && (M.wd = -(M.wd ?? 1));
        yield 0;
        continue;
      }
      const d = Math.abs(A.dx);
      // 천장 찍기 → 플레이어 머리 위로 낙석 셋
      if (M.ceil <= 0 && d < 180) {
        M.ceil = 5;
        A.stop(1), A.face();
        yield A.once("ceil", 8);
        A.sound("thud", 0.8);
        A.shake(2);
        A.burst("chunk", 6, -56, 6, ROCKC);
        for (let i = 0; i < 3; i++) rockfall(e, A, A.p.cx + (i - 1) * 34 + (Math.random() - 0.5) * 10, 0.6 + i * 0.15);
        yield 0.6;
        continue;
      }
      if (d > 30) {
        A.play("move"), A.walk(Math.sign(A.dx), e.speed);
        yield 0;
        continue;
      }
      A.stop(1), A.face();
      A.tele(0.5, { bar: [e.cx + e.facing * 22, 44] });
      yield A.once("wind", 8);
      yield 0.08;
      A.once("atk");
      yield 0.06;
      A.melee(36, 32, 1.1, { el: "earth", knock: 1.3 });
      A.burst("chunk", 22, -2, 6, ROCKC);
      A.sound("thud", 0.7);
      A.shake(2);
      yield 0.2;
      yield A.once("rec");
      yield 0.4;
    }
  },
});

// ════════ 광석 벌레 ════════ 땅속으로 다니다가 플레이어 발밑에서 튀어나온다 (흙먼지 예고).
register("fr2_1", {
  ...oreWorm, speed: 90, sight: 240, heavy: 0.6,
  damage(e, dmg) {
    return e.fz?.mem.under ? 0 : dmg;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    for (;;) {
      M.under = !0;
      A.play("hide");
      if (!e.aggro) {
        yield 0.2;
        continue;
      }
      // 땅속으로 플레이어 발밑까지 (흙먼지 줄)
      for (let t = 0; t < 2.5 && Math.abs(A.dx) > 8; t += DT) {
        A.walk(Math.sign(A.dx), e.speed);
        Math.random() < 0.35 && A.burst("dust", 0, -2, 1, 0x8a7a6a);
        yield 0;
      }
      A.stop(1);
      // 예고: 발밑이 들썩인다
      A.tele(0.55, { bar: [e.cx, 30] });
      for (let t = 0; t < 0.55; t += DT) (Math.random() < 0.6 && A.burst("dust", (Math.random() - 0.5) * 16, -2, 1, 0x9a8a7a), yield 0);
      M.under = !1;
      A.once("emerge");
      A.sound("thud", 0.8);
      A.shake(3);
      A.burst("chunk", 0, -4, 12, ROCKC);
      yield 0.05;
      A.melee(18, 50, 1.3, { el: "earth", knock: 1.2, back: 9 });
      A.melee(18, 50, 1.3, { el: "earth", knock: 1.2, back: -9 });
      yield 0.25;
      // 한 번 더 물어뜯고
      A.face();
      yield A.once("atk", 14);
      A.melee(32, 40, 0.9);
      yield 0.6;
      yield A.once("sink");
      yield 0.6;
    }
  },
});

// ════════ 동굴 박쥐 떼 ════════ 떼로 몰려와 휩쓸고 지나간다. 한 마리씩은 약하다.
register("fr2_2", {
  ...batSwarm, speed: 120, sight: 300, hpMul: 1.4,
  *brain(e, A) {
    const M = e.fz.mem;
    M.cd = 1 + Math.random();
    M.ph = Math.random() * 6;
    for (;;) {
      M.cd -= DT, M.ph += DT;
      A.play("idle");
      if (!e.aggro) {
        A.flyTo(e.homeX + Math.sin(M.ph) * 50, e.body.y, 40);
        yield 0;
        continue;
      }
      const p = A.p;
      A.flyTo(p.cx - Math.sign(A.dx || 1) * 130, p.body.y - 80 + Math.sin(M.ph * 2) * 12, e.speed);
      if (M.cd <= 0) {
        M.cd = 3;
        // 휩쓸기: 플레이어를 가로질러 반대편으로
        A.face();
        A.sound("warn", 0.4);
        A.tele(0.35);
        yield 0.35;
        A.play("dive");
        const dir = e.facing, y0 = e.body.y;
        let hit = !1;
        for (let t = 0; t < 0.8; t += DT) {
          e.body.vx = dir * 330;
          e.body.vy = (p.body.y - 16 - y0) * 2.2 * Math.cos((t / 0.8) * Math.PI);
          !hit && e.playerInRect(e.cx - 18, e.body.y - 22, 36, 22) && ((hit = !0), e.hit(0.8, !0));
          yield 0;
        }
      }
      yield 0;
    }
  },
});

// ════════ 폭약 고블린 ════════ 폭탄을 포물선으로 던진다. 체력이 낮으면 달려와서 자폭.
register("fr2_3", {
  ...bombGoblin, speed: 70, sight: 280,
  *brain(e, A) {
    const M = e.fz.mem;
    M.cd = 1.2;
    for (;;) {
      M.cd -= DT;
      if (!e.aggro) {
        A.play("idle"), A.stop();
        yield 0.2;
        continue;
      }
      const d = Math.abs(A.dx);
      // 체력이 낮으면 폭탄을 치켜들고 돌진 → 자폭
      if (e.hp < e.maxHp * 0.35) {
        A.play("run");
        A.sound("warn", 0.6);
        for (let t = 0; t < 2.5; t += DT) {
          A.walk(Math.sign(A.dx), e.speed * 2.2, { jumpGaps: !0 });
          Math.random() < 0.4 && A.burst("glow", 4, -30, 1, 0xffe080);
          if (Math.abs(A.dx) < 18) break;
          yield 0;
        }
        e.host.fx.anim("explode", e.cx, e.cy, { scale: 2, tint: 0xffa040 });
        A.shake(6);
        A.sound("explosion", 1);
        A.melee(30, 40, 2.2, { el: "fire", knock: 2.5, back: -30 });
        e.hp = 0;
        e.die();
        return;
      }
      if (d < 90) (A.play("move"), A.walk(-Math.sign(A.dx), e.speed, { climb: !1 }), A.face());
      else if (d > 220) (A.play("move"), A.walk(Math.sign(A.dx), e.speed));
      else (A.stop(0.5), A.play("idle"));
      if (M.cd <= 0 && d < 260) {
        M.cd = 2.4;
        A.stop(1), A.face();
        A.tele(0.45);
        yield A.once("wind", 7);
        A.once("throw");
        const p = A.p, ox = e.cx + e.facing * 6, oy = e.body.y - 30, T = 0.85;
        A.shoot({ sprite: "p_bomb", speed: 230, gravity: 600, life: 3, radius: 5, aoe: 34 }, ox, oy, 0, 1.2, { el: "fire", opts: { vx: (p.cx - ox) / T, vy: (p.body.y - 8 - oy - 0.5 * 600 * T * T) / T } });
        A.sound("shoot", 0.6);
        yield 0.4;
      }
      yield 0;
    }
  },
});

// ════════ 수정 거미 ════════ 천장에 매달려 있다가 내려온다. 거미줄로 2초 둔화.
register("fr2_4", {
  ...crystalSpider, speed: 90, sight: 240,
  *brain(e, A) {
    const M = e.fz.mem;
    M.cd = 1;
    // 처음에는 위에 매달려 기다린다
    if (!M.dropped) {
      e.body.y -= 60;
      for (;;) {
        e.body.vy = 0;
        e.body.vx = 0;
        A.play("hang");
        if (e.aggro && Math.abs(A.dx) < 70) break;
        yield 0;
      }
      M.dropped = 1;
      A.sound("warn", 0.4);
    }
    for (;;) {
      M.cd -= DT;
      const d = Math.abs(A.dx);
      if (M.cd <= 0 && d < 200) {
        M.cd = 2.6;
        A.stop(1), A.face();
        A.tele(0.4);
        yield A.once("wind", 8);
        A.once("spit");
        // 거미줄: 맞으면 둔화
        const p = A.p, ox = e.cx + e.facing * 12, oy = e.body.y - 10;
        A.shoot({ sprite: "p_ebolt", speed: 320, life: 1.6, radius: 6, trail: 0xe0f0ff }, ox, oy, Math.atan2(p.cy - oy, p.cx - ox), 0.6, { el: "phys", st: { type: "chill", chance: 1, dur: 2, power: 0.55 }, opts: { tint: 0xe8f4ff, scale: 1.4 } });
        yield 0.35;
        continue;
      }
      if (d > 40) (A.play("move"), A.walk(Math.sign(A.dx), e.speed));
      else {
        // 가까우면 물기
        A.face(), A.stop(1);
        yield A.once("wind", 10);
        A.melee(24, 16, 0.9, { el: "earth" });
        yield 0.5;
      }
      yield 0;
    }
  },
});

// ════════ 광맥 정령 ════════ 다른 적에게 돌 갑옷을 씌운다 (피해 -50%, 5초).
register("fr2_5", {
  ...veinSpirit, speed: 50, sight: 260,
  *brain(e, A) {
    const M = e.fz.mem;
    M.cd = 1.5;
    M.ph = Math.random() * 6;
    for (;;) {
      M.cd -= DT, M.ph += DT;
      A.play("idle");
      const allies = e.host.enemies.filter((o) => o !== e && !o.dead && Math.abs(o.cx - e.cx) < 220);
      // 동료 뒤쪽에 머문다 (플레이어와 거리 유지)
      const p = A.p, ax = allies[0]?.cx ?? e.homeX;
      A.flyTo(ax - Math.sign(A.dx || 1) * 40, (allies[0]?.body.y ?? e.body.y) - 50 + Math.sin(M.ph * 2) * 8, e.speed);
      if (M.cd <= 0 && allies.length) {
        M.cd = 4;
        A.tele(0.4);
        yield A.once("cast", 8);
        for (const o of allies.slice(0, 3)) {
          o._stoneUntil = e.host.time.now + 5000;
          e.host.fx.burst("chunk", o.cx, o.cy, 8, ROCKC);
          e.host.fx.anim("ring", o.cx, o.cy, { scale: 1.2, tint: 0xc8b090 });
          const shell = e.host.add.image(o.cx, o.cy, "vx_glow").setTint(0xc8a878).setScale(0.9).setAlpha(0.45).setDepth(11);
          e.host.tweens.add({ targets: shell, alpha: 0.2, duration: 400, yoyo: !0, repeat: 5, onUpdate: () => shell.setPosition(o.cx, o.cy), onComplete: () => shell.destroy() });
        }
        A.sound("magic", 0.5);
        yield 0.4;
      }
      yield 0;
    }
  },
});

// ════════ [정예] 광차 기사 ════════ 광차를 타고 돌진 · 내려서 곡괭이창 3연 찌르기 · 광차를 발로 차 날려 보낸다.
register("fr2_e0", {
  ...cartKnight, speed: 50, sight: 280, heavy: 0.8,
  *brain(e, A) {
    const M = e.fz.mem;
    M.riding = !0;
    for (;;) {
      if (!e.aggro) {
        A.play(M.riding ? "ride" : "idle"), A.stop();
        yield 0.2;
        continue;
      }
      if (M.riding) {
        // 광차 돌진 (두 번 왕복)
        for (let r = 0; r < 2; r++) {
          A.face();
          A.tele(0.6, { bar: [e.cx + e.facing * 110, 220] });
          A.play("ride");
          yield 0.6;
          A.play("rush");
          A.sound("dash", 0.8);
          let hit = !1;
          for (let t = 0; t < 1.1; t += DT) {
            e.body.vx = e.facing * 330;
            !hit && A.melee(24, 34, 1.3, { knock: 2.2 }) && ((hit = !0), A.shake(3));
            Math.random() < 0.5 && A.burst("spark", -16, -2, 1, 0xffd080);
            if (e.body.hitWall) break;
            yield 0;
          }
          A.stop(1);
          yield 0.4;
        }
        M.riding = !1;
        A.burst("dust", 0, -2, 10, 0x8a7a6a);
        continue;
      }
      const d = Math.abs(A.dx);
      // 광차 발로 차기 (광차가 굴러간다)
      if (d > 70 && d < 220 && !M.kicked) {
        M.kicked = !0;
        A.face();
        A.tele(0.4);
        yield A.once("kick", 8);
        const host = e.host, dir = e.facing, gy = e.body.y;
        const cart = host.add.image(e.cx + dir * 24, gy - 10, "vx_glow").setVisible(!1);
        let x = e.cx + dir * 24;
        const spr = host.add.sprite(x, gy, `e_${e.def.id}`, e.sprite.frame.name).setOrigin(0.5, 1).setDepth(10).setCrop(56, 50, 34, 30).setFlipX(dir < 0);
        for (let t = 0; t < 1.4; t += DT) {
          x += dir * 340 * DT;
          spr.setPosition(x - dir * 30, gy);
          const P = host.player;
          if (!P.dead && Math.abs(P.cx - x) < 16 && Math.abs(P.body.y - gy) < 30) {
            host.hurtPlayer({ dmg: e.atk * 1.3, element: "phys", knock: 2, dir, melee: !1, srcX: x });
            break;
          }
          yield 0;
        }
        host.fx.burst("chunk", x, gy - 10, 12, 0x6a4a30);
        spr.destroy();
        cart.destroy();
        continue;
      }
      if (d > 50) {
        A.play("move"), A.walk(Math.sign(A.dx), e.speed);
        yield 0;
        continue;
      }
      // 곡괭이창 3연 찌르기
      A.stop(1), A.face();
      A.tele(0.45);
      yield A.once("wind", 8);
      for (let i = 0; i < 3; i++) {
        A.once("thrust");
        yield 0.05;
        e.body.vx = e.facing * 80;
        A.melee(58, 20, 0.9, { up: 14 });
        A.fxSlash(30, -26, 1, 0xffffff);
        A.sound("swing", 0.7);
        yield 0.22;
      }
      A.play("idle");
      yield 0.8;
    }
  },
});

// ════════ [정예] 돌 골렘 ════════ 바위 투척 · 몸통 박치기 · 죽으면 작은 골렘 셋으로 갈라진다.
register("fr2_e1", {
  ...stoneGolem, speed: 30, sight: 260, heavy: 1,
  init(e) {
    // 작은 골렘
    if (e.opts.mini) {
      e.sprite.setScale(0.5);
      e.body.w *= 0.5;
      e.body.h *= 0.5;
      e.maxHp = e.hp = Math.max(20, Math.round(e.maxHp * 0.25));
    }
  },
  die(e) {
    if (e.opts.mini) return;
    for (let i = 0; i < 3; i++) {
      const g = e.host.spawnEnemy(e.def.id, e.cx + (i - 1) * 24, e.body.y, { mini: !0, summoned: !0, noGold: !0 });
      g && ((g.aggro = !0), (g.body.vy = -260), (g.body.vx = (i - 1) * 120));
    }
    e.host.fx.burst("chunk", e.cx, e.cy, 24, ROCKC);
  },
  *brain(e, A) {
    const M = e.fz.mem;
    M.throw = 1.5;
    M.dash = 3;
    for (;;) {
      M.throw -= DT, M.dash -= DT;
      if (!e.aggro) {
        A.play("idle"), A.stop();
        yield 0.2;
        continue;
      }
      const d = Math.abs(A.dx), mini = e.opts.mini;
      if (!mini && M.throw <= 0 && d > 90 && d < 280) {
        M.throw = 3.5;
        A.stop(1), A.face();
        A.tele(0.55);
        yield A.once("wind", 6);
        A.once("throw");
        const p = A.p, ox = e.cx + e.facing * 10, oy = e.body.y - 70, T = 0.9;
        A.shoot({ sprite: "p_rock", speed: 240, gravity: 520, life: 2.5, radius: 7, aoe: 30 }, ox, oy, 0, 1.4, { el: "earth", opts: { vx: (p.cx - ox) / T, vy: (p.body.y - 10 - oy - 0.5 * 520 * T * T) / T, scale: 2.4 } });
        A.sound("swingHeavy", 0.6);
        yield 0.5;
        continue;
      }
      if (M.dash <= 0 && d < 160) {
        M.dash = mini ? 2 : 4;
        A.stop(1), A.face();
        A.tele(0.5, { bar: [e.cx + e.facing * 70, 140] });
        yield A.once("slam", 6);
        A.play("dash");
        A.sound("dash", 0.7);
        let hit = !1;
        for (let t = 0; t < 0.5; t += DT) {
          e.body.vx = e.facing * (mini ? 260 : 300);
          !hit && A.melee(18, 46, mini ? 0.7 : 1.4, { knock: 2.2 }) && ((hit = !0), A.shake(4));
          yield 0;
        }
        A.stop(1);
        A.play("idle");
        yield 0.7;
        continue;
      }
      if (d > 40) (A.play("move"), A.walk(Math.sign(A.dx), mini ? e.speed * 2 : e.speed));
      else (A.play("idle"), A.stop());
      yield 0;
    }
  },
});
