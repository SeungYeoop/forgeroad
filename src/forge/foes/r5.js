// 6지역 「서리 협곡」 행동 (그림은 m5.js)
// 화로의 열이 닿지 않는 협곡. 모든 것이 얼어붙은 채 숨을 쉰다.
import { register } from "./core.js";
import { snowWolf, iceSpirit, frostYeti, frozenSoldier, icicleBat, snowmanBomber, glacierTurtle, frostMaiden } from "./m5.js";

const DT = 1 / 60, ICEC = 0x9ad8ff, SNOWC = 0xe8f4ff;
const CHILL = (p = 0.4, d = 3) => ({ type: "chill", chance: 1, dur: d, power: p });

function warnAt(e, x, y, w, dur) {
  const host = e.host;
  const im = host.add.image(x, y, "warn").setOrigin(0.5, 1).setDepth(29).setDisplaySize(w, 6).setAlpha(0.85);
  host.tweens.add({ targets: im, alpha: 0.25, duration: 110, yoyo: !0, repeat: -1 });
  host.time.delayedCall(dur * 1000, () => im.destroy());
}
const near = (e, x, y, w, h) => e.playerInRect(x - w / 2, y - h, w, h);
// 바닥에서 솟는 얼음 가시 (경고 → 솟음)
function iceSpike(e, x, y, delay, mult = 1) {
  const host = e.host;
  warnAt(e, x, y, 30, delay);
  host.time.delayedCall(delay * 1000, () => {
    if (!host.sys?.isActive?.()) return;
    host.fx.anim("fx_smash", x, y - 12, { scale: 1.2, tint: ICEC });
    host.fx.burst("chunk", x, y - 6, 6, 0xc8f0ff);
    for (let i = 0; i < 4; i++) host.fx.burst("glow", x + (Math.random() - 0.5) * 16, y - Math.random() * 40, 1, ICEC);
    near(e, x, y + 2, 30, 44) && e.hit(mult, !1, "ice", CHILL(), 1.2);
  });
}

// ════════ 설원 늑대 ════════ 무리로 다닌다(하나가 알아채면 모두). 멀면 얼음 위를 미끄러지듯 돌진해 문다.
register("fr5_0", {
  ...snowWolf, speed: 96, sight: 260,
  *brain(e, A) {
    const M = e.fz.mem, host = e.host;
    M.slide = 1 + Math.random();
    for (;;) {
      M.slide -= DT;
      if (!e.aggro) {
        A.play("idle"), A.stop();
        yield 0.2;
        continue;
      }
      // 무리 부르기
      if (!M.howl) {
        M.howl = 1;
        for (const o of host.enemies) !o.dead && o.def?.id === "fr5_0" && Math.abs(o.cx - e.cx) < 300 && (o.aggro = !0);
      }
      const d = Math.abs(A.dx);
      if (M.slide <= 0 && d > 90 && d < 260 && Math.abs(A.dy) < 40) {
        M.slide = 3 + Math.random();
        A.stop(1), A.face();
        A.tele(0.4);
        yield A.once("wind", 8);
        // 미끄러지며 다가온다 (몸을 낮추고 다리를 쭉)
        A.play("slide");
        let bit = !1;
        for (let t = 0; t < 0.6 && !e.dead; t += DT) {
          e.body.vx = e.facing * 360 * (1 - t);
          Math.random() < 0.5 && A.burst("glow", -14, -2, 1, SNOWC);
          if (!bit && Math.abs(A.dx) < 34) {
            A.once("atk");
            bit = A.melee(40, 30, 1.1, { el: "ice", st: CHILL(0.3, 2), knock: 1.2 });
            A.sound("punch", 0.6);
          }
          yield 0;
        }
        A.stop(1);
        yield 0.5;
        continue;
      }
      // 무리 사이에서 위치를 바꾸며 들어온다
      if (d > 40) {
        A.play("move"), A.walk(Math.sign(A.dx), e.speed);
        yield 0;
        continue;
      }
      A.stop(1), A.face();
      A.tele(0.35, { bar: [e.cx + e.facing * 22, 40] });
      yield A.once("wind", 9);
      A.once("atk");
      e.body.vx = e.facing * 200;
      e.body.vy = -160;
      yield 0.07;
      A.melee(40, 30, 1, { el: "ice", st: CHILL(0.3, 2) });
      A.sound("punch", 0.6);
      yield 0.2;
      yield A.once("rec");
      e.body.vx = -e.facing * 150;
      yield 0.6;
    }
  },
});

// ════════ 얼음 정령 ════════ 순간이동으로 자리를 바꾸고, 발밑에서 얼음 가시 셋을 연달아 솟게 한다.
register("fr5_1", {
  ...iceSpirit, speed: 70, sight: 280,
  *brain(e, A) {
    const M = e.fz.mem, host = e.host;
    M.cd = 1.2;
    M.blink = 3;
    M.ph = Math.random() * 6;
    for (;;) {
      M.cd -= DT, M.blink -= DT, M.ph += DT;
      const p = A.p;
      if (!e.aggro) {
        A.play("idle");
        A.flyTo(e.homeX + Math.sin(M.ph) * 30, e.body.y + Math.cos(M.ph * 2) * 0.3, 30);
        yield 0;
        continue;
      }
      A.play("idle");
      A.flyTo(p.cx - Math.sign(A.dx || 1) * 120 + Math.sin(M.ph) * 20, p.body.y - 60, e.speed);
      if (M.blink <= 0) {
        M.blink = 4.5;
        yield A.once("blink");
        for (let i = 0; i < 8; i++) host.fx.burst("glow", e.cx + (Math.random() - 0.5) * 24, e.cy + (Math.random() - 0.5) * 24, 1, ICEC);
        e.body.x = p.cx + (Math.random() < 0.5 ? -1 : 1) * (110 + Math.random() * 50);
        e.body.y = p.body.y - 70;
        e.body.vx = e.body.vy = 0;
        A.face();
        A.sound("magic", 0.4);
        yield 0.3;
        continue;
      }
      if (M.cd <= 0 && Math.abs(A.dx) < 260) {
        M.cd = 3.4;
        e.body.vx *= 0.1, e.body.vy *= 0.1;
        A.face();
        A.tele(0.4);
        yield A.once("wind");
        A.once("cast");
        A.sound("magic", 0.6);
        // 플레이어 쪽으로 이어지는 얼음 가시 셋
        const gy = p.body.y, dir = Math.sign(p.cx - e.cx) || 1;
        for (let i = 0; i < 3; i++) iceSpike(e, p.cx + dir * (i - 1) * 34, gy, 0.55 + i * 0.22, 0.9);
        yield 0.8;
      }
      yield 0;
    }
  },
});

// ════════ 서리 예티 ════════ 눈을 퍼 던진다(둔화). 붙으면 움켜쥐고 집어던진다.
register("fr5_2", {
  ...frostYeti, speed: 46, sight: 280, heavy: 0.85, hpMul: 1.2,
  *brain(e, A) {
    const M = e.fz.mem;
    M.ball = 1.5;
    M.grab = 2;
    for (;;) {
      M.ball -= DT, M.grab -= DT;
      if (!e.aggro) {
        A.play("idle"), A.stop();
        yield 0.2;
        continue;
      }
      const d = Math.abs(A.dx), p = A.p;
      if (M.ball <= 0 && d > 100 && d < 300) {
        M.ball = 3.6;
        A.stop(1), A.face();
        A.tele(0.5);
        yield A.once("scoop", 7);
        yield A.once("throw", 12) * 0.4;
        const ox = e.cx + e.facing * 10, oy = e.body.y - 70, T = 0.75;
        A.shoot({ sprite: "p_snowball", speed: 250, gravity: 520, life: 3, radius: 10, aoe: 36 }, ox, oy, 0, 1.2, { el: "ice", st: CHILL(0.5, 3), opts: { vx: (p.cx - ox) / T, vy: (p.body.y - 10 - oy - 0.5 * 520 * T * T) / T, scale: 2.2 } });
        A.sound("swingHeavy", 0.7);
        yield 0.7;
        continue;
      }
      if (d > 50) {
        A.play("move"), A.walk(Math.sign(A.dx), e.speed);
        yield 0;
        continue;
      }
      A.stop(1), A.face();
      if (M.grab <= 0) {
        // 움켜쥐기: 두 팔을 벌렸다가 → 덥석
        M.grab = 4.5;
        A.tele(0.55, { bar: [e.cx + e.facing * 28, 50] });
        yield 0.55;
        A.once("grab");
        yield 0.1;
        const got = near(e, e.cx + e.facing * 26, e.body.y, 50, 70) && !(p.dashT > 0);
        if (got) {
          A.sound("punch", 0.8);
          for (let t = 0; t < 0.6 && !e.dead; t += DT) {
            p.body.x = e.cx + e.facing * 24;
            p.body.y = e.body.y - 46;
            p.body.vx = p.body.vy = 0;
            yield 0;
          }
          // 뒤로 집어던진다
          yield A.once("slam", 12) * 0.6;
          p.body.vx = -e.facing * 420;
          p.body.vy = -380;
          e.hit(1.5, !0, "ice", CHILL(0.5, 3), 2.2);
          A.shake(5);
          A.sound("thud", 1.2);
          yield 0.9;
        } else yield 0.7;
        continue;
      }
      // 두 주먹 내려찍기
      A.tele(0.6, { bar: [e.cx + e.facing * 32, 70] });
      yield A.once("wind", 5);
      A.once("slam");
      yield 0.14;
      A.melee(64, 56, 1.4, { knock: 1.8 });
      A.burst("chunk", 34, -2, 10, 0xe8f4ff);
      A.fxHeavy(32, -24, 1.5, 0xc8f0ff);
      A.sound("thud", 1.1);
      A.shake(4);
      yield 1;
    }
  },
});

// ════════ 얼어붙은 병사 ════════ 얼음 화살. 불에 맞으면 얼음이 녹아 빨라진다.
register("fr5_3", {
  ...frozenSoldier, speed: 40, sight: 320,
  damage(e, dmg, C) {
    if (C?.element === "fire" && e.fz) {
      e.fz.mem.thaw = 6;
      e.host.fx.burst("rise", e.cx, e.cy, 8, 0xc8f0ff);
    }
    return dmg;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    M.cd = 1;
    M.thaw = 0;
    for (;;) {
      M.cd -= DT;
      M.thaw > 0 && ((M.thaw -= DT), Math.random() < 0.15 && A.burst("rise", 0, -30, 1, 0xc8f0ff));
      const fast = M.thaw > 0 ? 1.7 : 1;
      if (!e.aggro) {
        A.play("idle"), A.stop();
        yield 0.2;
        continue;
      }
      const d = Math.abs(A.dx), p = A.p;
      if (d < 120) (A.play("move", 8 * fast), A.walk(-Math.sign(A.dx), e.speed * fast, { climb: !1 }), A.face());
      else if (d > 260) (A.play("move", 8 * fast), A.walk(Math.sign(A.dx), e.speed * fast));
      else (A.stop(0.5), A.play("idle"), A.face());
      if (M.cd <= 0 && d < 320) {
        M.cd = 2.6 / fast;
        A.stop(1), A.face();
        A.tele(0.45 / fast);
        yield A.once("draw", 8 * fast);
        A.once("shoot");
        const ox = e.cx + e.facing * 16, oy = e.body.y - 30;
        A.shoot({ sprite: "p_icicle", speed: 380, life: 1.6, radius: 4 }, ox, oy, Math.atan2(p.cy - oy, p.cx - ox), 0.9, { el: "ice", st: CHILL(0.35, 2), opts: { tint: 0xc8f0ff } });
        A.sound("bow", 0.6);
        yield 0.4 / fast;
      }
      yield 0;
    }
  },
});

// ════════ 고드름 박쥐 ════════ 천장에 거꾸로 매달려 있다가, 밑을 지나가면 고드름을 떨어뜨리고 날아든다.
register("fr5_4", {
  ...icicleBat, speed: 120, sight: 240,
  init(e) {
    const W = e.host.world, Rb = e.body;
    // 위쪽 천장(막힌 칸)까지 올라가 매달린다
    const col = W.gtx(Rb.x);
    const row = Math.floor(Rb.y / 16);
    e.fz.mem.hangY = Rb.y - 40;
    for (let k = 0; k < 12; k++) if (W.standable(col, row - k - 1)) { e.fz.mem.hangY = (row - k) * 16 + 18; break; }
    e.fz.mem.hang = 1;
  },
  *brain(e, A) {
    const M = e.fz.mem, host = e.host;
    M.cd = 2;
    M.ph = Math.random() * 6;
    for (;;) {
      const p = A.p;
      if (M.hang) {
        A.play("hang");
        e.body.vx = e.body.vy = 0;
        e.body.y += (M.hangY - e.body.y) * 0.2;
        // 바로 밑을 지나가면: 고드름 투하
        if (Math.abs(A.dx) < 50 && p.body.y > e.body.y) {
          M.hang = 0;
          A.tele(0.3);
          yield 0.3;
          for (let i = 0; i < 2; i++) A.shoot({ sprite: "p_icicle", speed: 60, gravity: 900, life: 2, radius: 5 }, e.cx + (i - 0.5) * 14, e.body.y + 10, Math.PI / 2, 1, { el: "ice", st: CHILL(0.4, 2), opts: { tint: 0xc8f0ff, scale: 1.4 } });
          A.sound("shoot", 0.5);
          e.aggro = !0;
          yield 0.2;
        }
        yield 0;
        continue;
      }
      M.cd -= DT, M.ph += DT;
      A.play("fly");
      A.flyTo(p.cx + Math.sin(M.ph * 1.3) * 90, p.body.y - 80 + Math.cos(M.ph * 2) * 12, e.speed);
      if (M.cd <= 0 && Math.abs(A.dx) < 140) {
        // 급강하 할퀴기
        M.cd = 3;
        A.face();
        A.tele(0.35);
        yield 0.35;
        A.once("drop");
        const tx = p.cx, ty = p.body.y - 14;
        for (let t = 0; t < 0.5 && !e.dead; t += DT) {
          A.flyTo(tx, ty, 340);
          if (near(e, e.cx, e.body.y + 10, 30, 30)) {
            e.hit(0.9, !0, "ice", CHILL(0.3, 2), 1);
            break;
          }
          yield 0;
        }
        e.body.vy = -200;
        yield 0.5;
      }
      yield 0;
    }
  },
});

// ════════ 눈사람 폭탄병 ════════ 몸을 말아 굴러온다. 구를수록 커진다. 닿거나 멈추면 터져 서리 3중첩.
register("fr5_5", {
  ...snowmanBomber, speed: 36, sight: 260,
  die(e) {
    e.sprite?.setScale?.(1);
  },
  *brain(e, A) {
    const host = e.host;
    for (;;) {
      if (!e.aggro) {
        A.play("idle"), A.stop();
        yield 0.2;
        continue;
      }
      const d = Math.abs(A.dx);
      if (d > 220) {
        A.play("move"), A.walk(Math.sign(A.dx), e.speed);
        yield 0;
        continue;
      }
      // 도화선에 불을 붙이고 → 굴러온다
      A.stop(1), A.face();
      A.tele(0.5);
      A.sound("warn", 0.5);
      yield 0.5;
      let sc = 1;
      for (let t = 0; t < 3 && !e.dead; t += DT) {
        A.play("roll");
        A.walk(Math.sign(A.dx) || e.facing, 150 + t * 40, { jumpGaps: !0 });
        sc = Math.min(1.7, 1 + t * 0.25);
        e.sprite.setScale(sc);
        Math.random() < 0.4 && A.burst("glow", -10, -4, 1, SNOWC);
        if (Math.abs(A.dx) < 20 + sc * 8 && Math.abs(A.dy) < 40) break;
        yield 0;
      }
      // 부풀었다 터진다
      A.stop(1);
      A.play("swell");
      yield 0.35;
      host.fx.anim("explode", e.cx, e.cy, { scale: 1.6 * sc, tint: 0xd8f4ff });
      host.fx.burst("chunk", e.cx, e.cy, 16, 0xf0f8ff);
      A.shake(5);
      A.sound("explosion", 0.9);
      if (near(e, e.cx, e.body.y + 10, 70 * sc, 70 * sc)) {
        e.hit(1.3 * sc, !1, "ice", CHILL(0.5, 4), 2);
        A.afflict(CHILL(0.5, 4)), A.afflict(CHILL(0.5, 4));
      }
      e.hp = 0;
      e.die();
      return;
    }
  },
});

// ════════ [정예] 빙하 거북 ════════ 등딱지 속으로 숨어 벽에 튕기며 회전 · 서리 숨결 · 지나간 바닥이 얼어붙는다.
register("fr5_e0", {
  ...glacierTurtle, speed: 22, sight: 300, heavy: 1, hpMul: 1.2,
  damage(e, dmg) {
    // 숨어 있을 때는 단단하다
    return e.fz?.mem.shell ? dmg * 0.3 : dmg;
  },
  *brain(e, A) {
    const M = e.fz.mem, host = e.host;
    M.spin = 2;
    M.breath = 1.5;
    for (;;) {
      M.spin -= DT, M.breath -= DT;
      M.shell = 0;
      if (!e.aggro) {
        A.play("idle"), A.stop();
        yield 0.2;
        continue;
      }
      const d = Math.abs(A.dx), p = A.p;
      if (M.spin <= 0 && d < 260) {
        M.spin = 6;
        A.stop(1), A.face();
        A.tele(0.6);
        yield A.once("hide");
        M.shell = 1;
        A.sound("dash", 0.8);
        let dir = e.facing, bounces = 0, hitCd = 0;
        for (let t = 0; t < 3.2 && !e.dead && bounces < 4; t += DT) {
          A.play("spin");
          hitCd -= DT;
          e.body.vx = dir * 300;
          if (host.world.wallAhead(e.body, dir) || Math.abs(e.cx - e.homeX) > 260) ((dir = -dir), bounces++, A.shake(3), A.sound("thud", 0.7), (e.body.vy = -200));
          if (hitCd <= 0 && near(e, e.cx, e.body.y + 4, 60, 44)) ((hitCd = 0.6), e.hit(1.2, !0, "ice", CHILL(0.4, 2), 2));
          // 지나간 자리가 얼어붙는다
          Math.floor(t * 5) !== Math.floor((t - DT) * 5) && A.zone(e.cx, e.body.y, 40, 3, 0.12, { el: "ice", st: CHILL(0.5, 2), kind: "ice" });
          yield 0;
        }
        A.stop(1);
        M.shell = 0;
        yield 0.8;
        continue;
      }
      if (M.breath <= 0 && d < 150) {
        M.breath = 4;
        A.stop(1), A.face();
        A.tele(0.6, { bar: [e.cx + e.facing * 90, 120] });
        yield A.once("wind", 5);
        A.sound("magic", 0.7);
        for (let t = 0; t < 1.4 && !e.dead; t += 0.1) {
          A.play("breath");
          for (let i = 0; i < 3; i++) A.burst("glow", 70 + Math.random() * 70, -14 - Math.random() * 30, 1, i ? ICEC : SNOWC);
          Math.floor(t * 10) % 4 === 0 && A.melee(130, 50, 0.4, { back: 40, el: "ice", st: CHILL(0.5, 3), knock: 0.3 });
          yield 0.1;
        }
        A.zone(e.cx + e.facing * 90, e.body.y, 100, 4, 0.12, { el: "ice", st: CHILL(0.5, 2), kind: "ice" });
        yield 0.8;
        continue;
      }
      if (d > 80) (A.play("move"), A.walk(Math.sign(A.dx), e.speed));
      else (A.stop(0.5), A.play("idle"), A.face());
      yield 0;
    }
  },
});

// ════════ [정예] 서리 처녀 ════════ 거울 분신 둘 · 얼음 방벽(잠시 무적, 끝나면 파편) · 얼음 창 비.
register("fr5_e1", {
  ...frostMaiden, speed: 40, sight: 300,
  init(e) {
    // 분신: 체력이 매우 낮고, 쓰러지면 산산조각
    if (e.opts.clone) ((e.fz.mem.clone = 1), (e.maxHp = e.hp = Math.max(1, Math.round(e.maxHp * 0.08))), e.sprite.setAlpha(0.75));
  },
  damage(e, dmg) {
    return e.fz?.mem.barrier ? (e.host.fx.burst("spark", e.cx, e.cy, 4, 0xd0f4ff), 0) : dmg;
  },
  die(e) {
    e.host.fx.burst("chunk", e.cx, e.cy, 12, 0xd0f4ff);
    e.fz?.mem.clone && e.host.fx.anim("ring", e.cx, e.cy, { scale: 1.2, tint: ICEC });
  },
  *brain(e, A) {
    const M = e.fz.mem, host = e.host;
    M.cd = 1.5;
    M.mirror = M.clone ? 99 : 2;
    M.barrierCd = 6;
    M.rain = 4;
    for (;;) {
      M.cd -= DT, M.mirror -= DT, M.barrierCd -= DT, M.rain -= DT;
      if (!e.aggro) {
        A.play("idle"), A.stop();
        yield 0.2;
        continue;
      }
      const d = Math.abs(A.dx), p = A.p;
      // 거울 분신
      if (M.mirror <= 0) {
        M.mirror = 12;
        A.stop(1);
        A.tele(0.5);
        yield A.once("raise");
        host.cameras.main.flash(120, 200, 240, 255);
        for (const s of [-1, 1]) {
          const c = host.spawnEnemy("fr5_e1", e.cx + s * 70, e.body.y - 4, { clone: 1, summoned: !0, noGold: !0 });
          c && (c.aggro = !0);
          host.fx.anim("ring", e.cx + s * 70, e.body.y - 30, { scale: 1.4, tint: ICEC });
        }
        A.sound("magic", 0.8);
        yield 0.5;
        continue;
      }
      // 얼음 방벽: 다가오면 감싸고, 풀릴 때 파편이 사방으로
      if (!M.clone && M.barrierCd <= 0 && d < 90) {
        M.barrierCd = 9;
        M.barrier = 1;
        A.stop(1);
        A.sound("ice", 0.7);
        host.fx.anim("ring", e.cx, e.cy, { scale: 2, tint: ICEC });
        for (let t = 0; t < 2 && !e.dead; t += 0.1) {
          A.play("barrier");
          for (let i = 0; i < 2; i++) {
            const a = Math.random() * Math.PI * 2;
            host.fx.burst("glow", e.cx + Math.cos(a) * 30, e.cy + Math.sin(a) * 36, 1, ICEC);
          }
          yield 0.1;
        }
        M.barrier = 0;
        for (let i = 0; i < 8; i++) A.shoot({ sprite: "p_icicle", speed: 260, life: 1.2, radius: 4 }, e.cx, e.cy, (i / 8) * Math.PI * 2, 0.7, { el: "ice", st: CHILL(0.3, 2), opts: { tint: 0xd0f4ff } });
        A.sound("explosion", 0.5);
        yield 0.4;
        continue;
      }
      // 얼음 창 비
      if (!M.clone && M.rain <= 0 && d < 300) {
        M.rain = 7;
        A.stop(1), A.face();
        yield A.once("raise");
        A.sound("magic", 0.7);
        for (let i = 0; i < 6; i++) {
          const x = p.cx + (i - 2.5) * 34 + (Math.random() - 0.5) * 10;
          const delay = 0.7 + i * 0.12;
          warnAt(e, x, p.body.y, 24, delay);
          host.time.delayedCall(delay * 1000, () => {
            if (!host.sys?.isActive?.()) return;
            A.shoot({ sprite: "p_icicle", speed: 520, life: 1, radius: 5 }, x, p.body.y - 200, Math.PI / 2, 0.9, { el: "ice", st: CHILL(0.35, 2), opts: { tint: 0xd0f4ff, scale: 1.6 } });
          });
        }
        yield 1.4;
        continue;
      }
      // 거리를 두고 얼음 구슬
      if (d < 110) (A.play("move"), A.walk(-Math.sign(A.dx), e.speed, { climb: !1 }), A.face());
      else if (d > 240) (A.play("move"), A.walk(Math.sign(A.dx), e.speed));
      else (A.stop(0.5), A.play("idle"), A.face());
      if (M.cd <= 0 && d < 300) {
        M.cd = M.clone ? 3.4 : 2.4;
        A.stop(1), A.face();
        A.tele(0.4);
        yield A.once("cast");
        const ox = e.cx + e.facing * 16, oy = e.body.y - 60;
        A.shoot({ sprite: "p_orb", speed: 230, life: 2.4, radius: 6, homing: 0.8 }, ox, oy, Math.atan2(p.cy - oy, p.cx - ox), M.clone ? 0.3 : 0.9, { el: "ice", st: CHILL(0.4, 2), opts: { tint: 0xb8ecff } });
        A.sound("magic", 0.4);
        yield 0.4;
      }
      yield 0;
    }
  },
});
