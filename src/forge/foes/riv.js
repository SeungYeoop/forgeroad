// 아이언베인 몬스터 12종 행동 (그림은 px_iv.js). 지하 입문 지역이라 예고를 넉넉히
import { register } from "./core.js";
import * as X from "./px_iv.js";
import { DT, POIS, BURN, BLEED, STUN, hop, near, dirTo, ready, cool, land, wander, hover, notice, approach, melee, slam, lob, shoot, dive, charge, summon, lurk, groundY } from "./bkit.js";

// ════ 광석 쥐 떼 ════ 우르르 몰려와 갉아 대고, 맞으면 잠깐 흩어졌다 다시 모인다
register("iv_rat", {
  ...X.pxRats, speed: 125, sight: 220, atkMul: 0.6,
  *brain(e, A) {
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 36, range: 70 });
        continue;
      }
      if (e.sinceHit < 0.15 && ready(e, "scatter")) {
        for (let t = 0; t < 0.5; t += DT) (A.play("move"), A.walk(-dirTo(A), e.speed), yield 0);
        cool(e, "scatter", 2, 3);
        continue;
      }
      if (near(A, 30, 16) && ready(e, "gnaw")) {
        A.face(), A.tele(0.25);
        yield A.once("wind");
        A.play("atk");
        for (let k = 0; k < 3; k++) {
          A.melee(18, 12, 0.35, { knock: 0.1 }) && A.burst("spark", 8, -4, 2, 0xd88a8a);
          A.sound("punch", 0.2);
          yield 0.12;
        }
        yield A.once("rec");
        cool(e, "gnaw", 1, 1.6);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 22 });
    }
  },
});

// ════ 곡괭이 코볼트 ════ 곡괭이를 머리 위로 들었다 내려찍는다. 멀면 광석 덩이를 던진다
register("iv_kobold", {
  ...X.pxKobold, speed: 85, sight: 230, atkMul: 0.9,
  *brain(e, A) {
    cool(e, "throw", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 22 });
        continue;
      }
      yield* notice(e, A, { anim: "wind", sound: "warn", jump: 160 });
      const d = Math.abs(A.dx);
      if (near(A, 40, 26) && ready(e, "pick")) {
        yield* melee(e, A, { tele: 0.45, dash: 100, fw: 24, fh: 26, up: 4, mult: 1, knock: 0.9, fx: "heavy", tint: 0xd8d8e0, sound: "punch" });
        cool(e, "pick", 1.1, 1.7);
        continue;
      }
      if (d > 80 && d < 240 && ready(e, "throw")) {
        yield* lob(e, A, { wind: "throw", atk: "throw", release: 0.2, sprite: "p_rock", ox: -6, oy: 20, mult: 0.7, scale: 1.1, tele: 0.35, chunkC: 0x6a6460 });
        cool(e, "throw", 2.4, 3.4);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 32 });
    }
  },
});

// ════ 램프 나방 ════ 불빛을 쫓아 몰려와 몸으로 부딪친다. 몸에 불씨가 붙어 있어 맞으면 화상
register("iv_moth", {
  ...X.pxLampMoth, speed: 110, sight: 240, atkMul: 0.7,
  *brain(e, A) {
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 40, ry: 16, speed: 40 });
        continue;
      }
      if (ready(e, "ram") && Math.abs(A.dx) < 160) {
        yield* dive(e, A, { tele: 0.35, v: 300, dur: 0.45, mult: 0.7, st: BURN(0.1, 2), el: "fire", fw: 14, fh: 14 });
        cool(e, "ram", 1.4, 2.2);
        continue;
      }
      // 플레이어 머리(등불) 둘레를 맴돈다
      yield* approach(e, A, { keep: 50, alt: 40 });
    }
  },
});

// ════ [정예] 코볼트 십장 ════ 긴 채찍(출혈) · 호루라기로 코볼트를 부르고 독려 · 다이너마이트 던지기 (떨어진 자리에서 잠시 뒤 폭발)
register("iv_foreman", {
  ...X.pxForeman, speed: 60, sight: 280, atkMul: 1.5, heavy: 0.6,
  *brain(e, A) {
    cool(e, "whistle", 1, 2), cool(e, "dyn", 3, 4);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 18, range: 60 });
        continue;
      }
      yield* notice(e, A, { anim: "whistle", sound: "warn" });
      const d = Math.abs(A.dx);
      if (ready(e, "whistle")) {
        A.face(), A.stop(1);
        yield A.once("whistle");
        A.sound("buff", 0.6);
        e.host.fx.anim("ring", e.cx, e.body.y - 30, { scale: 2.6, tint: 0xffd060 });
        for (const q of e.host.enemies) !q.dead && q !== e && /iv_kobold|iv_rat/.test(q.def.id) && Math.hypot(q.cx - e.cx, q.cy - e.cy) < 220 && ((q._rallyT = 6), (q.aggro = !0), e.host.fx.burst("glow", q.cx, q.cy, 6, 0xffd060));
        yield* summon(e, A, { id: "iv_kobold", n: 1, max: 2, anim: "whistle", col: 0xffd060, tele: 0 });
        cool(e, "whistle", 9, 12);
        continue;
      }
      if (ready(e, "dyn") && d > 70 && d < 260) {
        yield* lob(e, A, {
          wind: "dyn", atk: "dyn", release: 0.25, sprite: "p_bomb", g: 500, ox: -8, oy: 50, mult: 0.2, tele: 0.45, sound: "swing",
          onDone: (pr) => {
            const x = pr.x, gy = groundY(e, x);
            e.host.fx.burst("spark", x, gy - 4, 6, 0xffd060);
            e.host.time.delayedCall(700, () => {
              if (!e.host.world) return;
              e.host.fx.anim("ring", x, gy - 8, { scale: 3, tint: 0xff8a30 });
              e.host.fx.burst("chunk", x, gy - 6, 10, 0x6a6460);
              e.host.fx.burst("glow", x, gy - 8, 14, 0xff8a30);
              e.host.fx.shake?.(3);
              A.sound("explosion", 0.7);
              const p = A.p;
              !p.dead && Math.hypot(p.cx - x, p.body.y - gy) < 60 && e.hit(1.6, !1, "fire", BURN(0.15, 2), 1.8);
            });
          },
        });
        cool(e, "dyn", 5, 6.5);
        continue;
      }
      if (near(A, 64, 30) && ready(e, "whip")) {
        yield* melee(e, A, { tele: 0.45, dash: 60, fw: 52, fh: 20, up: 8, mult: 1.2, st: BLEED(0.12, 3), knock: 1, fx: "slash", tint: 0xd8b080, fxX: 30, fxY: -22, fxS: 0.9, sound: "swing" });
        cool(e, "whip", 1.3, 2);
        continue;
      }
      yield* approach(e, A, { lo: 30, hi: 56 });
    }
  },
});

// ════ 쇠껍질 공벌레 ════ 몸을 말아 쇠공처럼 굴러 돌진. 말린 동안은 단단하다 (벽에 박으면 풀려서 어지러움)
register("iv_pillbug", {
  ...X.pxPillbug, speed: 50, sight: 200, atkMul: 1,
  damage(e, dmg) {
    const M = e.fz?.mem;
    return M?.dizzy ? dmg * 1.4 : M?.curl ? dmg * 0.25 : dmg;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    cool(e, "roll", 1, 2);
    for (;;) {
      if (!e.aggro) {
        M.curl = 0;
        yield* wander(e, A, { speed: 14, range: 60 });
        continue;
      }
      if (A.ground && ready(e, "roll") && Math.abs(A.dx) < 220 && Math.abs(A.dy) < 30) {
        M.curl = 1;
        yield* charge(e, A, { wind: "wind", run: "atk", tele: 0.5, v: 260, dur: 1.4, mult: 1, knock: 1.4, fw: 20, fh: 18, stunT: 1.2 });
        M.curl = 0;
        cool(e, "roll", 2, 3);
        continue;
      }
      // 맞으면 잠깐 말아서 버틴다
      if (e.sinceHit < 0.2) {
        M.curl = 1;
        A.play("wind");
        yield 0.8;
        M.curl = 0;
        continue;
      }
      yield* approach(e, A, { lo: 40, hi: 90 });
    }
  },
});

// ════ 녹 먹는 벌레 ════ 달라붙어 갑옷을 갉는다 (맞으면 잠깐 방어가 깎인다). 떼로 다닌다
register("iv_rustbug", {
  ...X.pxRustbug, speed: 95, sight: 200, atkMul: 0.6,
  *brain(e, A) {
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 26, range: 60 });
        continue;
      }
      if (near(A, 26, 14) && ready(e, "gnaw")) {
        let hit = !1;
        yield* melee(e, A, { tele: 0.3, dash: 160, fw: 14, fh: 10, mult: 0.5, knock: 0.2, spark: !1, onHit: () => (hit = !0) });
        if (hit) {
          A.afflict({ type: "armorBreak", chance: 1, dur: 4 });
          e.host.fx.burst("chunk", A.p.cx, A.p.cy, 5, 0xb8642e);
          A.sound("punch", 0.3);
        }
        cool(e, "gnaw", 1.2, 1.8);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 18 });
    }
  },
});

// ════ 꼬마 광석 골렘 ════ 광석 박힌 주먹으로 내려친다. 부서지면 광석 조각이 사방으로 튄다
register("iv_oregolem", {
  ...X.pxOreGolem, speed: 36, sight: 200, atkMul: 1.2, heavy: 0.7,
  die(e) {
    e.host.fx.burst("chunk", e.cx, e.cy, 14, 0x6a6460);
    e.host.fx.burst("glow", e.cx, e.cy, 8, 0xd8803a);
  },
  *brain(e, A) {
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 12, range: 40 });
        continue;
      }
      if (near(A, 48, 30) && ready(e, "punch")) {
        yield* slam(e, A, { r: 36, fwd: 16, mult: 1.2, tele: 0.55, shake: 1.6, chunk: 0x6a6460, tint: 0xd8c8b0 });
        cool(e, "punch", 1.4, 2.2);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 34 });
    }
  },
});

// ════ [정예] 증기 굴착 기계 ════ 드릴을 앞세운 돌진(연속 타격) · 증기 뿜어 밀어내기 · 바닥을 뚫고 들어갔다 발밑에서 솟아오르기
register("iv_drill", {
  ...X.pxDrill, speed: 50, sight: 300, atkMul: 1.6, heavy: 1,
  damage(e, dmg) {
    return e.fz?.mem.under ? dmg * 0.15 : dmg;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    cool(e, "drill", 1.5, 2.5), cool(e, "burrow", 5, 6), cool(e, "steam", 3, 4);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 14, range: 50 });
        continue;
      }
      yield* notice(e, A, { anim: "steam", sound: "explosion", vol: 0.3 });
      const d = Math.abs(A.dx);
      if (ready(e, "burrow") && A.ground && d > 80) {
        A.stop(1);
        yield A.once("burrow");
        M.under = 1;
        A.sound("thud", 0.6), A.shake(2);
        for (let t = 0; t < 2.2 && Math.abs(A.dx) > 12; t += DT) {
          A.play("under");
          A.walk(dirTo(A), e.speed * 2.2, { climb: !1 });
          Math.random() < 0.3 && e.host.fx.burst("chunk", e.cx, e.body.y - 2, 1, 0x6a6460);
          yield 0;
        }
        A.stop(1);
        A.tele(0.5, { bar: [e.cx, 80] });
        yield 0.5;
        M.under = 0;
        A.once("rise");
        A.sound("explosion", 0.6), A.shake(3);
        e.host.fx.burst("chunk", e.cx, e.body.y - 6, 14, 0x6a6460);
        e.playerInRect(e.cx - 40, e.body.y - 50, 80, 50) && (e.hit(1.5, !0, "earth", void 0, 1.4), (A.p.body.vy = -460));
        yield 0.6;
        cool(e, "burrow", 7, 9);
        continue;
      }
      if (ready(e, "steam") && d < 120 && Math.abs(A.dy) < 50) {
        A.face();
        A.tele(0.45);
        yield A.once("steam");
        A.sound("dash", 0.6);
        for (let t = 0; t < 0.6; t += DT) {
          Math.sign(A.dx) === e.facing && Math.abs(A.dx) < 140 && (A.p.body.vx += e.facing * 900 * DT);
          Math.random() < 0.6 && e.host.fx.burst("dust", e.cx + e.facing * (30 + Math.random() * 80), e.body.y - 20 - Math.random() * 20, 1, 0xf0f0f0);
          yield 0;
        }
        Math.abs(A.dx) < 100 && e.hit(0.5, !1, "fire", BURN(0.1, 2), 0.6);
        cool(e, "steam", 4, 5.5);
        continue;
      }
      if (A.ground && ready(e, "drill") && d < 240 && Math.abs(A.dy) < 30) {
        A.face(), A.stop(1);
        A.tele(0.65, { bar: [e.cx + e.facing * 80, 160] });
        yield A.once("wind");
        A.play("atk");
        A.sound("dash", 0.7);
        const W = e.host.world;
        for (let t = 0, k = 0; t < 1.2; t += DT) {
          e.body.vx = e.facing * 230;
          if (t > k * 0.18 && A.melee(36, 26, 0.55, { knock: 0.5 })) (k = t / 0.18 + 1), A.burst("spark", 40, -16, 4, 0xffe0a0), A.shake(0.8);
          if (A.ground && W.wallAhead(e.body, e.facing)) break;
          Math.random() < 0.3 && A.burst("chunk", 44, -10, 1, 0x6a6460);
          yield 0;
        }
        A.stop(1);
        yield A.once("rec");
        cool(e, "drill", 3, 4);
        continue;
      }
      yield* approach(e, A, { lo: 50, hi: 100 });
    }
  },
});

// ════ 폭발 가스 버섯 ════ 움직이지 않는다. 가까이 오면 가스 주머니를 부풀렸다 터뜨린다 (독 구름). 불로 맞으면 크게 폭발
register("iv_gasshroom", {
  ...X.pxGasShroom, speed: 0, sight: 160, atkMul: 0.8, heavy: 1,
  damage(e, dmg, C) {
    const el = C?.element ?? C?.el;
    if (el === "fire" && !e.fz?.mem.boom) {
      e.fz && (e.fz.mem.boom = 1);
      const host = e.host, x = e.cx, y = e.body.y;
      host.fx.anim("ring", x, y - 10, { scale: 3.4, tint: 0xffa040 });
      host.fx.burst("glow", x, y - 10, 18, 0xffa040);
      host.fx.shake?.(3);
      e.fA?.sound("explosion", 0.8);
      const p = host.player;
      !p.dead && Math.hypot(p.cx - x, p.body.y - y) < 70 && e.hit(1.4, !1, "fire", BURN(0.15, 2), 1.6);
      for (const q of host.enemies) q !== e && !q.dead && Math.hypot(q.cx - x, q.cy - y) < 70 && q.receive(q.maxHp * 0.5, 0, { knock: 1, dir: Math.sign(q.cx - x) || 1, stagger: 0.4 });
      return dmg * 4;
    }
    return dmg;
  },
  *brain(e, A) {
    for (;;) {
      A.stop(1);
      if (e.aggro && near(A, 60, 40) && ready(e, "puff")) {
        A.tele(0.6, { bar: [e.cx, 110] });
        yield A.once("wind");
        A.once("atk");
        A.sound("splat", 0.6);
        e.host.fx.burst("glow", e.cx, e.cy, 16, 0xc8e070);
        A.zone(e.cx, e.body.y, 90, 3.5, 0.12, { el: "poison", st: POIS(0.12, 3), kind: "slime" });
        yield A.once("rec");
        cool(e, "puff", 4, 5.5);
        continue;
      }
      A.play("idle");
      yield 0.06;
    }
  },
});

// ════ 유령 광부 ════ 벽 속으로 사라졌다(맞지 않는다) 플레이어 곁에서 나타나 곡괭이를 내려찍는다
register("iv_ghost", {
  ...X.pxGhostMiner, speed: 60, sight: 260, atkMul: 1.1,
  damage(e, dmg) {
    return e.fz?.mem.gone ? 0 : dmg;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    cool(e, "phase", 1.5, 2.5);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 30, ry: 4, speed: 18 });
        continue;
      }
      if (ready(e, "phase")) {
        M.gone = 1;
        yield A.once("fade");
        e.sprite.setVisible(!1);
        yield 0.8;
        const p = A.p, side = Math.random() < 0.5 ? -1 : 1;
        e.body.x = p.cx + side * 34, e.body.y = p.body.y - 6, e.body.vx = e.body.vy = 0;
        e.facing = -side;
        e.sprite.setVisible(!0);
        yield A.once("appear");
        M.gone = 0;
        yield* melee(e, A, { tele: 0.5, fw: 26, fh: 30, mult: 1.2, knock: 0.9, fx: "heavy", tint: 0xa0d8f0, sound: "punch" });
        cool(e, "phase", 3, 4);
        continue;
      }
      const p = A.p;
      A.play("move");
      A.flyTo(p.cx - dirTo(A) * 60, p.body.y - 10, e.speed);
      A.face();
      yield 0;
    }
  },
});

// ════ 수정 전갈 ════ 수정 꼬리로 높이 찌르고(중독), 집게로 붙잡는다 (출혈)
register("iv_scorpion", {
  ...X.pxCrystalScorp, speed: 80, sight: 220, atkMul: 1.2,
  *brain(e, A) {
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 20, range: 60 });
        continue;
      }
      if (near(A, 54, 34) && ready(e, "sting")) {
        yield* melee(e, A, { tele: 0.5, fw: 30, fh: 34, up: 6, mult: 1.2, st: POIS(0.16, 3), knock: 0.8, fx: "slash", tint: 0xe0a0ff, fxY: -26 });
        cool(e, "sting", 1.6, 2.4);
        continue;
      }
      if (near(A, 36, 20) && ready(e, "pinch")) {
        yield* melee(e, A, { wind: "wind", atk: "pinch", tele: 0.35, dash: 120, fw: 20, fh: 14, mult: 0.9, st: BLEED(0.1, 2.5), knock: 0.6 });
        cool(e, "pinch", 1, 1.6);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 40 });
    }
  },
});

// ════ [정예] 광산 웜 ════ 땅속을 헤엄쳐 다가와(거의 맞지 않는다) 솟구치고, 바위를 토해낸 뒤 다시 파고든다
register("iv_worm", {
  ...X.pxMineWorm, speed: 70, sight: 320, atkMul: 1.7, heavy: 1,
  damage(e, dmg) {
    return e.fz?.mem.under ? dmg * 0.15 : dmg;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    cool(e, "dive", 2, 3), cool(e, "spit", 1.5, 2.5);
    for (;;) {
      if (!e.aggro) {
        A.play("idle"), A.stop(1);
        yield 0.1;
        continue;
      }
      yield* notice(e, A, { anim: "wind", sound: "bossRoar", vol: 0.3 });
      if (ready(e, "spit") && Math.abs(A.dx) < 260) {
        yield* lob(e, A, { wind: "wind", atk: "spit", release: 0.15, sprite: "p_bigrock", g: 480, ox: 14, oy: 54, n: 3, spread: 70, mult: 0.9, el: "earth", scale: 1.2, tele: 0.5, sound: "explosion" });
        cool(e, "spit", 3, 4);
        continue;
      }
      if (ready(e, "dive") && A.ground) {
        yield A.once("dive");
        M.under = 1;
        A.sound("thud", 0.6);
        for (let t = 0; t < 2.6 && Math.abs(A.dx) > 14; t += DT) {
          A.play("under");
          A.walk(dirTo(A), e.speed * 2, { climb: !1 });
          Math.random() < 0.3 && e.host.fx.burst("chunk", e.cx, e.body.y - 2, 1, 0x6a5040);
          yield 0;
        }
        A.stop(1);
        A.tele(0.55, { bar: [e.cx, 70] });
        yield 0.55;
        M.under = 0;
        A.once("rise");
        A.sound("explosion", 0.7), A.shake(3.5);
        e.host.fx.burst("chunk", e.cx, e.body.y - 8, 16, 0x6a5040);
        e.playerInRect(e.cx - 34, e.body.y - 60, 68, 60) && (e.hit(1.7, !0, "earth", STUN(0.4), 1.2), (A.p.body.vy = -520));
        yield A.once("rec");
        cool(e, "dive", 5, 7);
        continue;
      }
      if (near(A, 60, 50) && ready(e, "bite")) {
        yield* melee(e, A, { tele: 0.5, fw: 34, fh: 40, up: 20, mult: 1.4, knock: 1.2, fx: "heavy", tint: 0xf0d8c8 });
        cool(e, "bite", 1.8, 2.6);
        continue;
      }
      A.play("idle"), A.face();
      yield 0.05;
    }
  },
});
