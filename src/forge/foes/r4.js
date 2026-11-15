// 5지역 「불타는 요새」 행동 (그림은 m4.js)
// 화로의 불을 차지하려던 군대가 세운 요새. 군대는 불에 삼켜졌지만 아직도 성벽을 지킨다.
import { register } from "./core.js";
import { flameInfantry, artillerist, salamander, furnaceSpirit, chainTorturer, bannerBearer, siegeGolem, guardCaptain } from "./m4.js";

const DT = 1 / 60, FIRE = 0xff7a20, EMBER = 0xff8a30, SPARK = 0xffe0b0;
const BURN = (p = 0.25, d = 3) => ({ type: "burn", chance: 1, dur: d, power: p });

// 바닥 경고 (원하는 자리에)
function warnAt(e, x, y, w, dur) {
  const host = e.host;
  const im = host.add.image(x, y, "warn").setOrigin(0.5, 1).setDepth(29).setDisplaySize(w, 6).setAlpha(0.85);
  host.tweens.add({ targets: im, alpha: 0.25, duration: 110, yoyo: !0, repeat: -1 });
  host.time.delayedCall(dur * 1000, () => im.destroy());
  return im;
}
const near = (e, x, y, w, h) => e.playerInRect(x - w / 2, y - h, w, h);

// ════════ 화염 보병 ════════ 큰 방패로 앞을 막는다(정면 공격 막음). 찌를 때만 틈이 생긴다.
register("fr4_0", {
  ...flameInfantry, speed: 44, sight: 240,
  blocks(e, S) {
    const M = e.fz?.mem;
    if (!M || M.open || e.stunT > 0) return !1;
    const b = S.dir === -e.facing;
    b && (e.host.fx.burst("spark", e.cx + e.facing * 16, e.cy, 6, SPARK), e.fA.sound("block", 0.5));
    return b;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    for (;;) {
      M.open = 0;
      if (!e.aggro) {
        A.play("idle"), A.stop();
        yield 0.2;
        continue;
      }
      const d = Math.abs(A.dx);
      // 대열: 다른 보병 바로 뒤면 너무 붙지 않는다
      const mate = e.host.enemies.find((o) => o !== e && !o.dead && o.def?.id === "fr4_0" && Math.sign(o.cx - e.cx) === Math.sign(A.dx) && Math.abs(o.cx - e.cx) < 26);
      if (d > 50 && !mate) {
        A.play("move"), A.walk(Math.sign(A.dx), e.speed);
        yield 0;
        continue;
      }
      if (d > 62) {
        A.stop(0.5), A.play("idle"), A.face();
        yield 0.1;
        continue;
      }
      // 창을 뒤로 당겼다가 → 길게 찌르기 (이때 방패가 열린다)
      A.stop(1), A.face();
      A.tele(0.5, { bar: [e.cx + e.facing * 34, 60] });
      yield A.once("wind", 6);
      M.open = 1;
      A.once("thrust");
      yield 0.06;
      A.melee(62, 26, 1.2, { up: 8, knock: 1.4 });
      A.fxSlash(34, -24, 1.1, 0xffc080);
      A.sound("swing", 0.7);
      yield 0.2;
      yield A.once("rec");
      yield 0.7;
    }
  },
});

// ════════ 화약 포병 ════════ 박격포 → 붉은 원 경고 → 폭발. 가까이 오면 도망친다.
register("fr4_1", {
  ...artillerist, speed: 56, sight: 320,
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
      const d = Math.abs(A.dx), p = A.p, host = e.host;
      if (d < 100) (A.play("move"), A.walk(-Math.sign(A.dx), e.speed * 1.3, { climb: !1 }), A.face());
      else if (d > 280) (A.play("move"), A.walk(Math.sign(A.dx), e.speed));
      else (A.stop(0.5), A.play("idle"), A.face());
      if (M.cd <= 0 && d < 330 && d > 70) {
        M.cd = 3.4;
        A.stop(1), A.face();
        const tx = p.cx, ty = p.body.y;
        yield A.once("aim");
        warnAt(e, tx, ty, 64, 1.1);
        A.tele(0.3);
        yield 0.3;
        A.once("fire");
        A.sound("explosion", 0.4);
        A.burst("glow", 14, -40, 6, 0xc8b8b0);
        // 포탄이 높이 날아가 경고 자리에 떨어진다
        const ox = e.cx + e.facing * 12, oy = e.body.y - 46, T = 0.8;
        const sh = host.add.image(ox, oy, "vx_glow").setTint(0x4a4450).setScale(0.22).setDepth(14);
        host.tweens.addCounter({
          from: 0, to: 1, duration: T * 1000,
          onUpdate: (tw) => {
            const u = tw.getValue();
            sh.setPosition(ox + (tx - ox) * u, oy + (ty - 6 - oy) * u - Math.sin(u * Math.PI) * 140);
          },
          onComplete: () => {
            sh.destroy();
            if (e.dead && !host.scene?.isActive?.()) return;
            host.fx.anim("explode", tx, ty - 10, { scale: 1.6, tint: 0xffa040 });
            host.fx.burst("chunk", tx, ty - 4, 8, 0x5a3a2a);
            host.fx.shake(3);
            A.sound("explosion", 0.8);
            near(e, tx, ty + 4, 64, 44) && e.hit(1.3, !1, "fire", BURN(), 1.6);
          },
        });
        yield 0.6;
      }
      yield 0;
    }
  },
});

// ════════ 불도마뱀 ════════ 벽을 타고 오른다. 고개를 젖혔다가 불을 뱉는다.
register("fr4_2", {
  ...salamander, speed: 80, sight: 260,
  *brain(e, A) {
    const M = e.fz.mem;
    M.cd = 1;
    for (;;) {
      M.cd -= DT;
      if (!e.aggro) {
        A.play("idle"), A.stop();
        yield 0.2;
        continue;
      }
      const d = Math.abs(A.dx), p = A.p;
      if (M.cd <= 0 && d < 180 && d > 30) {
        M.cd = 2.6;
        A.stop(1), A.face();
        A.tele(0.45);
        yield A.once("wind");
        for (let i = 0; i < 3; i++) {
          A.once("spit", 16);
          const ox = e.cx + e.facing * 22, oy = e.body.y - 14;
          A.shoot({ sprite: "p_fire", speed: 240, gravity: 260, life: 1.6, radius: 5, aoe: 20 }, ox, oy, Math.atan2(p.cy - oy, p.cx - ox) - 0.2 + i * 0.12, 0.6, { el: "fire", st: BURN(0.2, 2) });
          A.sound("shoot", 0.4);
          yield 0.14;
        }
        yield 0.5;
        continue;
      }
      if (d > 60 || d < 30) {
        A.play("move"), A.walk(d < 30 ? -Math.sign(A.dx) : Math.sign(A.dx), e.speed);
        d < 30 && A.face();
        yield 0;
        continue;
      }
      A.stop(0.5), A.play("idle"), A.face();
      yield 0.1;
    }
  },
});

// ════════ 용광로 정령 ════════ 곁에 있으면 뜨겁다(열기 오라). 주먹을 들었다 내리친다.
register("fr4_3", {
  ...furnaceSpirit, speed: 40, sight: 230, heavy: 0.6,
  tick(e, A) {
    if (!e.aggro) return;
    const M = e.fz.mem, P = e.host.player;
    M.heat = (M.heat ?? 0) + DT;
    Math.random() < 0.25 && A.burst("rise", (Math.random() - 0.5) * 60, -Math.random() * 40, 1, EMBER);
    if (M.heat >= 0.8) {
      M.heat = 0;
      !P.dead && Math.abs(P.cx - e.cx) < 52 && Math.abs(P.body.y - e.body.y) < 50 && e.host.hurtPlayer({ dmg: e.atk * 0.18, element: "fire", knock: 0, dir: P.cx < e.cx ? -1 : 1, melee: !1, srcX: e.cx });
    }
  },
  *brain(e, A) {
    for (;;) {
      if (!e.aggro) {
        A.play("idle"), A.stop();
        yield 0.2;
        continue;
      }
      if (Math.abs(A.dx) > 44) {
        A.play("move"), A.walk(Math.sign(A.dx), e.speed);
        yield 0;
        continue;
      }
      A.stop(1), A.face();
      A.tele(0.6, { bar: [e.cx + e.facing * 30, 64] });
      yield A.once("wind", 5);
      A.once("atk");
      yield 0.08;
      A.melee(54, 50, 1.4, { el: "fire", st: BURN(), knock: 1.6 });
      A.fxHeavy(30, -24, 1.4, 0xffa040);
      A.zone(e.cx + e.facing * 30, e.body.y, 40, 2, 0.25, { el: "fire" });
      A.sound("thud", 1);
      A.shake(3);
      yield 0.2;
      yield A.once("rec");
      yield 0.8;
    }
  },
});

// ════════ 쇠사슬 고문관 ════════ 갈고리 사슬로 끌어당긴 뒤 → 가시 철퇴.
register("fr4_4", {
  ...chainTorturer, speed: 52, sight: 260,
  *brain(e, A) {
    const M = e.fz.mem;
    M.hook = 1;
    for (;;) {
      M.hook -= DT;
      if (!e.aggro) {
        A.play("idle"), A.stop();
        yield 0.2;
        continue;
      }
      const d = Math.abs(A.dx), p = A.p;
      if (M.hook <= 0 && d > 60 && d < 190 && Math.abs(A.dy) < 34) {
        M.hook = 4;
        A.stop(1), A.face();
        A.tele(0.5, { bar: [e.cx + e.facing * 100, 180] });
        yield 0.5;
        A.once("throw");
        A.sound("dash", 0.6);
        yield 0.1;
        const hit = Math.sign(p.cx - e.cx) === e.facing && Math.abs(p.cx - e.cx) < 200 && Math.abs(p.cy - (e.body.y - 30)) < 26 && !(p.dashT > 0);
        if (hit) {
          A.sound("punch", 0.6);
          for (let t = 0; t < 0.35; t += DT) {
            p.body.x += (e.cx + e.facing * 34 - p.body.x) * 0.22;
            p.body.vx = 0;
            yield 0;
          }
          yield A.once("wind", 12);
          A.once("atk");
          yield 0.05;
          A.melee(50, 50, 1.6, { knock: 2 });
          A.fxHeavy(26, -30, 1.5, 0xffc080);
          A.sound("thud", 1);
          A.shake(4);
          yield 0.2;
          yield A.once("rec");
          yield 0.7;
        } else yield 0.7;
        continue;
      }
      if (d > 44) {
        A.play("move"), A.walk(Math.sign(A.dx), e.speed);
        yield 0;
        continue;
      }
      A.stop(1), A.face();
      A.tele(0.55, { bar: [e.cx + e.facing * 26, 52] });
      yield A.once("wind", 7);
      A.once("atk");
      yield 0.06;
      A.melee(48, 50, 1.2, { knock: 1.6 });
      A.fxHeavy(26, -30, 1.2, 0xffc080);
      A.sound("swingHeavy", 0.8);
      yield 0.2;
      yield A.once("rec");
      yield 0.7;
    }
  },
});

// ════════ 깃발병 ════════ 군기를 꽂는다: 근처 적의 공격 속도 +30%. 꽂힌 군기는 부술 수 있다.
register("fr4_5", {
  ...bannerBearer, speed: 46, sight: 260,
  init(e) {
    if (e.opts.flag) ((e.fz.mem.flag = 1), (e.body.vx = 0));
  },
  *brain(e, A) {
    const M = e.fz.mem, host = e.host;
    // 꽂힌 군기
    if (M.flag) {
      A.play("flag");
      for (;;) {
        e.body.vx = 0;
        e.aggro = !1;
        for (const o of host.enemies) !o.dead && o !== e && Math.abs(o.cx - e.cx) < 140 && Math.abs(o.cy - e.cy) < 90 && ((o._rallyT = 0.5), Math.random() < 0.04 && host.fx.burst("rise", o.cx, o.cy, 1, EMBER));
        Math.random() < 0.15 && A.burst("glow", (Math.random() - 0.5) * 240, -Math.random() * 60, 1, 0xff5030);
        yield 0.1;
      }
    }
    M.planted = 0;
    for (;;) {
      if (!e.aggro) {
        A.play("idle"), A.stop();
        yield 0.2;
        continue;
      }
      const d = Math.abs(A.dx);
      const flagAlive = M.fl && !M.fl.dead && M.fl.active !== !1;
      if (!flagAlive && d < 220) {
        // 깃대를 높이 들었다가 땅에 꽂는다
        A.stop(1), A.face();
        A.tele(0.5);
        yield A.once("plant");
        A.sound("thud", 0.8);
        A.shake(2);
        A.burst("chunk", 10, -2, 8, 0x5a3a2a);
        host.fx.anim("ring", e.cx, e.body.y - 20, { scale: 2.6, tint: 0xff5030 });
        M.fl = host.spawnEnemy("fr4_5", e.cx + e.facing * 14, e.body.y - 2, { flag: 1, summoned: !0, noGold: !0 });
        M.fl && ((M.fl.maxHp = M.fl.hp = Math.round(e.maxHp * 0.6)), (M.fl.heavy = 1));
        yield 0.8;
        continue;
      }
      // 군기 곁을 지키며 뒤에 선다
      if (d < 90) (A.play("move"), A.walk(-Math.sign(A.dx), e.speed, { climb: !1 }), A.face());
      else if (d > 200) (A.play("move"), A.walk(Math.sign(A.dx), e.speed));
      else (A.stop(0.5), A.play("idle"), A.face());
      yield 0;
    }
  },
});

// ════════ [정예] 공성 골렘 ════════ 팔 대포 3연발 · 발 구르기 충격파 · 체력이 바닥나면 과열 → 5초 뒤 자폭.
register("fr4_e0", {
  ...siegeGolem, speed: 26, sight: 320, heavy: 1, hpMul: 1.1,
  damage(e, dmg) {
    const M = e.fz?.mem;
    // 과열 중에는 쓰러지지 않는다 (자폭까지 버틴다)
    if (M && !M.hot && e.hp - dmg <= e.maxHp * 0.2) ((M.hot = 1), (M.restart = 1));
    if (M?.hot) return Math.min(dmg, Math.max(0, e.hp - 1));
    return dmg;
  },
  *brain(e, A) {
    const M = e.fz.mem, host = e.host;
    M.cd = 1.5;
    M.stomp = 3;
    for (;;) {
      M.cd -= DT, M.stomp -= DT;
      if (M.hot) {
        // 과열: 균열이 번지며 다가온다 → 대폭발
        A.sound("warn", 0.8);
        for (let t = 0; t < 5 && !e.dead; t += DT) {
          A.play("hot", t > 3.5 ? 22 : 12);
          A.walk(Math.sign(A.dx) || 1, e.speed * 1.6, { jumpGaps: !0 });
          Math.random() < 0.3 && A.burst("glow", (Math.random() - 0.5) * 50, -Math.random() * 80, 1, FIRE);
          if (Math.floor(t * 2) !== Math.floor((t - DT) * 2)) (warnAt(e, e.cx, e.body.y, 220, 0.4), A.sound("warn", 0.4 + t * 0.1));
          yield 0;
        }
        host.fx.anim("explode", e.cx, e.cy, { scale: 4.5, tint: 0xffa040 });
        host.fx.burst("chunk", e.cx, e.cy, 20, 0x6a3a2e);
        A.shake(12);
        A.sound("explosion", 1.6);
        near(e, e.cx, e.body.y + 10, 220, 120) && e.hit(2.6, !1, "fire", BURN(0.4, 4), 3);
        e.hp = 0;
        e.die();
        return;
      }
      if (!e.aggro) {
        A.play("idle"), A.stop();
        yield 0.2;
        continue;
      }
      const d = Math.abs(A.dx), p = A.p;
      // 발 구르기: 가까우면
      if (M.stomp <= 0 && d < 90) {
        M.stomp = 4;
        A.stop(1), A.face();
        A.tele(0.7, { bar: [e.cx, 200] });
        yield A.once("wind", 4.5);
        A.once("stomp");
        A.shake(7);
        A.sound("thud", 1.6);
        host.fx.anim("fx_smash", e.cx + e.facing * 16, e.body.y - 12, { scale: 2.6, tint: 0xffa060 });
        A.melee(70, 40, 1.5, { back: -70, knock: 2.2 });
        for (const dir of [-1, 1]) {
          const ox = e.cx + dir * 30;
          A.shoot({ sprite: "p_wave", speed: 260, life: 1.1, radius: 10 }, ox, e.body.y - 10, dir > 0 ? 0 : Math.PI, 0.9, { el: "fire", opts: { tint: 0xffa040 } });
        }
        yield 0.9;
        continue;
      }
      // 대포 3연발
      if (M.cd <= 0 && d < 300) {
        M.cd = 4.2;
        A.stop(1), A.face();
        A.tele(0.6);
        yield A.once("aim");
        for (let i = 0; i < 3 && !M.hot; i++) {
          A.once("fire", 14);
          const ox = e.cx + e.facing * 46, oy = e.body.y - 56;
          A.shoot({ sprite: "p_bigrock", speed: 300, life: 2, radius: 9, aoe: 30 }, ox, oy, Math.atan2(p.cy - oy, p.cx - ox), 1, { el: "fire", st: BURN(0.2, 2), opts: { tint: 0x5a5060 } });
          A.burst("glow", 46, -56, 5, FIRE);
          A.sound("explosion", 0.55);
          A.shake(2);
          yield 0.38;
        }
        yield 0.6;
        continue;
      }
      if (d > 70) (A.play("move"), A.walk(Math.sign(A.dx), e.speed));
      else (A.stop(0.5), A.play("idle"), A.face());
      yield 0;
    }
  },
  tick(e) {
    const M = e.fz.mem;
    // 과열이 막 시작되면 하던 행동을 끊는다
    M.restart && ((M.restart = 0), (e.fz.gen = null), (e.fz.wait = 0));
  },
});

// ════════ [정예] 화염 근위대장 ════════ 대검 자세(넓은 3연베기) ↔ 방패 자세(막고 반격) 를 바꿔 가며 싸운다.
register("fr4_e1", {
  ...guardCaptain, speed: 54, sight: 280, heavy: 0.8,
  blocks(e, S) {
    const M = e.fz?.mem;
    if (!M || !M.shield || M.open || e.stunT > 0) return !1;
    const b = S.dir === -e.facing;
    if (b) {
      e.host.fx.burst("spark", e.cx + e.facing * 16, e.cy, 8, SPARK);
      e.fA.sound("block", 0.6);
      M.counter = 1;
    }
    return b;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    M.shield = 0;
    M.stance = 6;
    for (;;) {
      M.stance -= DT;
      M.open = 0;
      if (!e.aggro) {
        A.play(M.shield ? "sidle" : "idle"), A.stop();
        yield 0.2;
        continue;
      }
      // 자세 바꾸기
      if (M.stance <= 0) {
        M.stance = M.shield ? 7 : 5;
        A.stop(1);
        yield A.once("swap");
        M.shield = !M.shield;
        M.counter = 0;
        A.sound("block", 0.5);
        continue;
      }
      const d = Math.abs(A.dx);
      if (M.shield) {
        // 방패 자세: 천천히 다가오며 막는다. 막아내면 곧장 반격
        if (M.counter) {
          M.counter = 0;
          M.open = 1;
          A.face();
          A.once("counter");
          yield 0.08;
          A.melee(56, 44, 1.3, { knock: 1.8 });
          A.fxSlash(30, -26, 1.3, 0xffc080);
          A.sound("swing", 0.9);
          yield 0.5;
          continue;
        }
        A.face();
        if (d > 46) A.play("smove"), A.walk(Math.sign(A.dx), e.speed * 0.5);
        else A.stop(1), A.play("sidle");
        yield 0;
        continue;
      }
      // 대검 자세
      if (d > 56) {
        A.play("move"), A.walk(Math.sign(A.dx), e.speed);
        yield 0;
        continue;
      }
      A.stop(1), A.face();
      A.tele(0.6, { bar: [e.cx + e.facing * 40, 84] });
      yield A.once("wind", 6);
      M.open = 1;
      for (const [nm, w, m] of [["s1", 70, 1], ["s2", 70, 1], ["s3", 84, 1.5]]) {
        A.once(nm);
        e.body.vx = e.facing * 120;
        yield 0.06;
        A.melee(w, 56, m, { knock: nm === "s3" ? 2.2 : 1 });
        nm === "s3" ? (A.fxHeavy(34, -30, 1.8, 0xffb060), A.shake(4), A.sound("swingHeavy", 1)) : (A.fxSlash(32, -28, 1.4, 0xffc080), A.sound("swing", 0.8));
        A.stop(1);
        yield nm === "s3" ? 0.3 : 0.16;
      }
      yield 0.9;
    }
  },
});
