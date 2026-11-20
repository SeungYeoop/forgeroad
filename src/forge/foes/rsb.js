// 스톤브리지 몬스터 12종 행동 (그림은 px_sb.js)
import { register } from "./core.js";
import * as X from "./px_sb.js";
import { DT, BLEED, STUN, hop, near, dirTo, ready, cool, land, wander, hover, notice, approach, melee, slam, lob, shoot, dive, charge, lurk } from "./bkit.js";

// ════ 돌 도마뱀 ════ 재빠르게 기어 와 물고 빠진다. 체력이 바닥나면 꼬리를 끊고 줄행랑, 다시 덤빈다
register("sb_lizard", {
  ...X.pxLizard, speed: 120, sight: 220, atkMul: 0.9,
  *brain(e, A) {
    const M = e.fz.mem;
    cool(e, "bite", 0.4, 1);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 40, move: "move" });
        continue;
      }
      yield* notice(e, A, { anim: "wind", sound: "warn" });
      if (!M.shed && e.hp < e.maxHp * 0.4) {
        M.shed = 1;
        e.host.fx.burst("chunk", e.cx - e.facing * 12, e.body.y - 6, 6, 0x8c8a76);
        A.sound("thud", 0.4);
        const dir = -dirTo(A);
        for (let t = 0; t < 1.3; t += DT) (A.play("flee"), A.walk(dir, e.speed * 1.6), yield 0);
        continue;
      }
      if (near(A, 46, 22) && ready(e, "bite")) {
        yield* melee(e, A, { wind: "wind", atk: "atk", tele: 0.25, dash: 230, fw: 22, fh: 12, mult: 0.9, st: BLEED(0.1, 2.5), knock: 0.6, fx: "slash", tint: 0xe0d8c0 });
        // 물고 빠지기
        hop(e, -e.facing, 160, 160);
        yield* land(e, A);
        e.facing = dirTo(A);
        cool(e, "bite", 0.8, 1.3);
        continue;
      }
      yield* approach(e, A, { lo: 20, hi: 40, move: M.shed ? "flee" : "move" });
    }
  },
});

// ════ 이끼 석상 ════ 받침 위 석상인 척 (맞아도 덜 아프다). 다가오면 깨어나 돌주먹을 내려찍는다 (양옆 충격)
register("sb_statue", {
  ...X.pxStatue, speed: 34, sight: 150, atkMul: 1.3, heavy: 0.8,
  damage(e, dmg) {
    return e.fz?.mem.sleep !== 0 ? dmg * 0.35 : dmg;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    M.sleep = 1;
    for (;;) {
      if (M.sleep) {
        A.play("dormant"), A.stop(1);
        if (e.aggro && near(A, 80, 50)) {
          A.sound("thud", 0.5), A.shake(1);
          e.host.fx.burst("chunk", e.cx, e.body.y - 20, 8, 0xb0a690);
          yield A.once("wake");
          M.sleep = 0;
        }
        yield 0.05;
        continue;
      }
      if (!e.aggro) {
        yield* wander(e, A, { speed: 14, range: 40 });
        continue;
      }
      if (near(A, 52, 34) && ready(e, "slam")) {
        yield* slam(e, A, { r: 44, mult: 1.3, tele: 0.65, fwd: 14, shake: 2.5, chunk: 0xb0a690, tint: 0xd8f0ff });
        cool(e, "slam", 1.8, 2.6);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 36 });
    }
  },
});

// ════ 다리 장인 인형 ════ 망치를 휘두르고, 바닥을 두드려 발밑 돌을 흔든다 (가까우면 휘청)
register("sb_mason", {
  ...X.pxMason, speed: 60, sight: 220, atkMul: 1,
  *brain(e, A) {
    cool(e, "pound", 2, 3.5);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 22 });
        continue;
      }
      yield* notice(e, A, { anim: "wind", sound: "warn" });
      if (near(A, 110, 40) && ready(e, "pound")) {
        A.face(), A.stop(1);
        A.tele(0.5, { bar: [e.cx, 150] });
        yield 0.4;
        for (let k = 0; k < 3; k++) {
          A.once("pound");
          yield 0.14;
          A.sound("thud", 0.45), A.shake(1);
          e.host.fx.anim("ring", e.cx + e.facing * 12, e.body.y - 2, { scale: 1.6 + k * 0.6, tint: 0xd8c8a0 });
          e.host.fx.burst("dust", e.cx + e.facing * 12, e.body.y - 2, 6, 0xc8b898);
          const r = 40 + k * 22;
          A.ground && e.playerInRect(e.cx - r, e.body.y - 14, r * 2, 16) && A.p.body.onGround && (e.hit(0.55, !1, "earth", k === 2 ? STUN(0.5) : void 0, 0.4), (A.p.body.vy = -220));
          yield 0.16;
        }
        cool(e, "pound", 3.5, 5);
        continue;
      }
      if (near(A, 40, 26) && ready(e, "ham")) {
        yield* melee(e, A, { tele: 0.4, dash: 90, fw: 24, fh: 22, mult: 1.1, knock: 1, fx: "heavy", tint: 0xe8d8b0, sound: "punch" });
        cool(e, "ham", 1, 1.6);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 30 });
    }
  },
});

// ════ [정예] 석조 수문장 ════ 방패를 앞에 세우면 앞쪽 공격을 막는다. 방패 밀치기 · 높이 뛰어 내려찍기
register("sb_warden", {
  ...X.pxWarden, speed: 40, sight: 260, atkMul: 1.7, heavy: 1,
  blocks(e, S) {
    return !!e.fz?.mem.guard && e.stunT <= 0 && S.dir === -e.facing && !S.pierceShield;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    cool(e, "jump", 2, 3), cool(e, "bash", 0.6, 1.2);
    for (;;) {
      if (!e.aggro) {
        M.guard = 0;
        yield* wander(e, A, { speed: 14, range: 50 });
        continue;
      }
      yield* notice(e, A, { anim: "guard", sound: "block" });
      // 높이 뛰어 내려찍기
      if (ready(e, "jump") && Math.abs(A.dx) > 70 && Math.abs(A.dx) < 220 && A.ground) {
        M.guard = 0;
        A.face(), A.stop(1);
        A.tele(0.55, { bar: [A.p.cx, 110] });
        yield A.once("wind");
        A.once("jump");
        hop(e, dirTo(A), Math.min(260, Math.abs(A.dx) * 1.5), 470);
        A.sound("jump", 0.6);
        yield* land(e, A, 2.5);
        A.once("atk");
        const x = e.cx, y = e.body.y;
        e.host.fx.anim("ring", x, y - 4, { scale: 3, tint: 0xd8f0ff });
        e.host.fx.burst("chunk", x, y - 4, 10, 0xb0a690);
        A.shake(3), A.sound("thud", 0.8);
        e.playerInRect(x - 64, y - 30, 128, 30) && e.hit(1.5, !0, "earth", STUN(0.4), 1.4);
        yield A.once("rec");
        cool(e, "jump", 4.5, 6);
        continue;
      }
      if (near(A, 54, 30) && ready(e, "bash")) {
        M.guard = 0;
        yield* melee(e, A, { wind: "guard", atk: "bash", rec: "rec", tele: 0.4, dash: 200, fw: 26, fh: 36, mult: 1.2, knock: 2, sound: "block", spark: !0, tint: 0xd8f0ff });
        cool(e, "bash", 1.6, 2.4);
        continue;
      }
      // 방패를 세우고 천천히 다가간다
      M.guard = 1;
      A.play(Math.abs(A.dx) > 40 ? "move" : "guard");
      Math.abs(A.dx) > 40 ? A.walk(dirTo(A), e.speed) : A.stop();
      A.face();
      yield 0;
    }
  },
});

// ════ 바위 원숭이 ════ 턱을 뛰어다니며 바위를 던지고, 가까우면 할퀸다. 높은 곳의 플레이어에겐 뛰어오른다
register("sb_monkey", {
  ...X.pxMonkey, speed: 100, sight: 260, atkMul: 0.9,
  *brain(e, A) {
    cool(e, "throw", 0.6, 1.4);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 30 });
        continue;
      }
      yield* notice(e, A, { anim: "wind", jump: 200 });
      const d = Math.abs(A.dx);
      if (A.ground && A.dy < -50 && d < 140 && ready(e, "leap")) {
        A.face();
        yield A.once("leap") * 0.3;
        hop(e, dirTo(A), Math.min(220, d * 2), 540);
        yield* land(e, A);
        cool(e, "leap", 1.5, 2.5);
        continue;
      }
      if (d < 36 && Math.abs(A.dy) < 24 && ready(e, "claw")) {
        yield* melee(e, A, { tele: 0.25, dash: 150, fw: 20, fh: 18, mult: 0.9, fx: "slash", tint: 0xd8d0c8 });
        cool(e, "claw", 0.8, 1.4);
        continue;
      }
      if (d > 70 && d < 260 && ready(e, "throw")) {
        yield* lob(e, A, { wind: "throw", atk: "throw", release: 0.18, sprite: "p_rock", ox: 6, oy: 26, n: Math.random() < 0.35 ? 2 : 1, mult: 0.8, scale: 1.3, tele: 0.3 });
        cool(e, "throw", 2, 3);
        continue;
      }
      yield* approach(e, A, { lo: 90, hi: 170 });
    }
  },
});

// ════ 항아리 미믹 ════ 깨진 항아리인 척 (맞아도 덜 아프다). 가까이 오면 확 깨어나 덥석 문다. 한참 혼자면 다시 항아리로
register("sb_jar", {
  ...X.pxJar, speed: 80, sight: 160, atkMul: 1.2,
  damage(e, dmg) {
    return e.fz?.mem.hidden ? dmg * 0.3 : dmg;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    M.hidden = 1;
    for (;;) {
      if (M.hidden) {
        if (e.aggro && near(A, 60, 40)) {
          M.hidden = 0;
          A.sound("warn", 0.5);
          yield A.once("wake");
          yield* melee(e, A, { tele: 0.15, dash: 200, lift: 160, fw: 22, fh: 22, mult: 1.3, knock: 1, sound: "punch" });
          cool(e, "bite", 1, 1.5);
          M.alone = 0;
          continue;
        }
        yield* lurk(e, A, { anim: "hide" });
        continue;
      }
      if (!e.aggro) {
        M.alone = (M.alone ?? 0) + DT;
        if (M.alone > 4) M.hidden = 1;
        A.play("idle"), A.stop();
        yield 0;
        continue;
      }
      M.alone = 0;
      if (near(A, 40, 26) && ready(e, "bite")) {
        yield* melee(e, A, { tele: 0.3, dash: 180, lift: 140, fw: 22, fh: 22, mult: 1.1, knock: 0.9, sound: "punch" });
        cool(e, "bite", 1, 1.6);
        continue;
      }
      // 통통 튀며 다가간다
      if (A.ground && Math.abs(A.dx) > 30) {
        A.play("move");
        hop(e, dirTo(A), e.speed, 180);
        yield* land(e, A);
        yield 0.12;
        continue;
      }
      A.play("idle"), A.face();
      yield 0;
    }
  },
});

// ════ 칼날 제비 ════ 높이 맴돌다 날개를 접고 일직선으로 꿰뚫듯 돌진 (출혈)
register("sb_swallow", {
  ...X.pxSwallow, speed: 140, sight: 300, atkMul: 0.9,
  *brain(e, A) {
    cool(e, "dash", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 70, speed: 60 });
        continue;
      }
      if (ready(e, "dash") && Math.abs(A.dx) < 220) {
        yield* dive(e, A, { tele: 0.35, v: 460, dur: 0.55, mult: 0.9, st: BLEED(0.1, 2), fw: 20, fh: 12, ty: 14 });
        cool(e, "dash", 1.6, 2.6);
        continue;
      }
      yield* approach(e, A, { keep: 120, alt: 90 });
    }
  },
});

// ════ [정예] 그리폰 ════ 덮쳐 낚아채면 높이 끌고 올라갔다 떨어뜨린다 · 날개 바람으로 밀어내기 · 가까우면 앞발 연타
register("sb_griffin", {
  ...X.pxGriffin, speed: 120, sight: 320, atkMul: 1.6,
  *brain(e, A) {
    const M = e.fz.mem;
    cool(e, "grab", 2.5, 3.5), cool(e, "gust", 4, 5);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 70 });
        continue;
      }
      yield* notice(e, A, { anim: "gust", sound: "bossRoar", vol: 0.3 });
      // 낚아채기
      if (ready(e, "grab") && Math.abs(A.dx) < 200) {
        let caught = !1;
        yield* dive(e, A, { tele: 0.55, v: 400, dur: 0.6, mult: 0.8, fw: 24, fh: 22, onHit: () => (caught = !0) });
        if (caught && !A.p.dead) {
          A.play("carry");
          A.sound("dash", 0.5);
          for (let t = 0; t < 0.7 && !A.p.dead; t += DT) {
            e.body.vx = e.facing * 60, e.body.vy = -170;
            const pb = A.p.body;
            pb.x = e.cx + e.facing * 6, pb.y = e.body.y + 26, pb.vx = 0, pb.vy = 0;
            yield 0;
          }
          A.p.body.vy = 120;
          e.hit(0.6, !0, "phys", void 0, 0.3);
        }
        cool(e, "grab", 5, 6.5);
        continue;
      }
      // 날개 바람: 크게 밀어낸다
      if (ready(e, "gust") && Math.abs(A.dx) < 200) {
        A.face();
        A.tele(0.4);
        yield A.once("gust") * 0.5;
        A.sound("dash", 0.5);
        for (let t = 0; t < 0.6; t += DT) {
          if (Math.abs(A.dx) < 220 && Math.abs(A.dy) < 80) A.p.body.vx += e.facing * 900 * DT;
          Math.random() < 0.5 && e.host.fx.burst("dust", e.cx + e.facing * (30 + Math.random() * 120), e.body.y + (Math.random() - 0.5) * 40, 1, 0xe8f0ff);
          yield 0;
        }
        cool(e, "gust", 5, 7);
        continue;
      }
      if (near(A, 50, 40) && ready(e, "claw")) {
        for (let k = 0; k < 2; k++) yield* melee(e, A, { tele: k ? 0 : 0.35, dash: 120, fw: 28, fh: 26, mult: 1, fx: "slash", tint: 0xf8e8c0, recK: 0.4 });
        cool(e, "claw", 1.4, 2);
        continue;
      }
      yield* approach(e, A, { keep: 90, alt: 70 });
    }
  },
});

// ════ 룬 부유석 ════ 떠다니며 세 갈래 마력탄. 맞으면 잠깐 금이 가 멈춘다
register("sb_rune", {
  ...X.pxRune, speed: 50, sight: 300, atkMul: 0.9,
  *brain(e, A) {
    cool(e, "shot", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 20, ry: 6, speed: 20 });
        continue;
      }
      if (ready(e, "shot") && Math.abs(A.dx) < 280) {
        yield* shoot(e, A, { sprite: "p_orb", n: 3, spread: 0.32, speed: 170, mult: 0.65, el: "arcane", ox: 0, oy: 22, tele: 0.55, sound: "magic", scale: 0.9 });
        cool(e, "shot", 2.2, 3.2);
        continue;
      }
      yield* approach(e, A, { keep: 150, alt: 60 });
    }
  },
});

// ════ 가고일 ════ 석상처럼 앉아 있다가(맞아도 덜 아프다) 날개를 펴고 급습, 몇 번 덮치고 나면 다시 앉는다
register("sb_gargoyle", {
  ...X.pxGargoyle, speed: 110, sight: 220, atkMul: 1.2,
  damage(e, dmg) {
    return e.fz?.mem.perch ? dmg * 0.4 : dmg;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    M.perch = 1;
    for (;;) {
      if (M.perch) {
        A.play("perch");
        e.body.vx = 0, e.body.vy = 0;
        if (e.aggro && near(A, 130, 90)) {
          M.perch = 0;
          A.sound("warn", 0.5);
          e.host.fx.burst("chunk", e.cx, e.cy, 6, 0x8a8a90);
          yield A.once("wake");
          M.swoops = 0;
        }
        yield 0.05;
        continue;
      }
      if (!e.aggro || M.swoops >= 4) {
        // 집으로 돌아가 다시 앉는다
        A.play("move");
        A.flyTo(e.homeX, e._hy ?? e.body.y, e.speed);
        if (Math.hypot(e.homeX - e.cx, (e._hy ?? e.body.y) - e.body.y) < 10) (M.perch = 1), (M.swoops = 0);
        yield 0;
        continue;
      }
      if (ready(e, "swoop") && Math.abs(A.dx) < 200) {
        yield* dive(e, A, { tele: 0.45, v: 360, dur: 0.55, mult: 1.1, fw: 22, fh: 20 });
        M.swoops++;
        cool(e, "swoop", 1.4, 2.2);
        continue;
      }
      yield* approach(e, A, { keep: 90, alt: 80 });
    }
  },
});

// ════ 옛 병사 망령 ════ 미끄러지듯 다가와 녹슨 창으로 길게 찌른다. 맞으면 가끔 흐려져 뒤로 돌아 나타난다
register("sb_ghost", {
  ...X.pxGhost, speed: 70, sight: 260, atkMul: 1.1,
  damage(e, dmg) {
    return e.fz?.mem.fade ? 0 : dmg;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 30, ry: 4, speed: 20 });
        continue;
      }
      // 맞은 직후 가끔 흐려져 등 뒤로
      if (e.sinceHit < 0.2 && ready(e, "fade") && Math.random() < 0.5) {
        M.fade = 1;
        yield A.once("fade");
        const p = A.p;
        e.body.x = p.cx - (Math.sign(p.facing ?? 1) || 1) * 50;
        e.body.y = p.body.y - 10;
        M.fade = 0;
        e.facing = dirTo(A);
        cool(e, "fade", 4, 6);
        continue;
      }
      if (near(A, 70, 30) && ready(e, "thrust")) {
        yield* melee(e, A, { tele: 0.45, dash: 260, fw: 36, fh: 14, mult: 1.1, knock: 1, fx: "slash", tint: 0xa0f8ff, fxX: 20, fxY: -24, sound: "swing" });
        cool(e, "thrust", 1.2, 2);
        continue;
      }
      // 땅 위를 미끄러지듯 (높이는 플레이어 몸 높이)
      const p = A.p;
      A.play("move");
      A.flyTo(p.cx - dirTo(A) * 50, p.body.y - 8, e.speed);
      A.face();
      yield 0;
    }
  },
});

// ════ [정예] 번개 와이번 ════ 번개 숨결(앞으로 이어지는 번개 줄) · 급강하 할퀴기 · 가까우면 꼬리 가시
register("sb_wyvern", {
  ...X.pxWyvern, speed: 120, sight: 340, atkMul: 1.7,
  *brain(e, A) {
    cool(e, "breath", 2, 3), cool(e, "dive", 3.5, 4.5);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 80 });
        continue;
      }
      yield* notice(e, A, { anim: "wind", sound: "bossRoar", vol: 0.3 });
      if (ready(e, "breath") && Math.abs(A.dx) < 260) {
        A.face();
        e.body.vx *= 0.2, e.body.vy *= 0.2;
        A.tele(0.6);
        yield A.once("wind");
        A.play("breath");
        A.sound("magic", 0.6);
        for (let k = 0; k < 6; k++) {
          const p = A.p, ox = e.cx + e.facing * 34, oy = e.body.y - 18, ang = Math.atan2(p.body.y - 10 - oy, p.cx - ox) + (Math.random() - 0.5) * 0.15;
          A.shoot({ sprite: "p_ebolt", speed: 300, life: 1.4, radius: 6 }, ox, oy, ang, 0.45, { el: "lightning", st: { type: "stun", chance: 0.25, dur: 0.4 } });
          yield 0.09;
        }
        yield A.once("rec");
        cool(e, "breath", 3.5, 5);
        continue;
      }
      if (ready(e, "dive") && Math.abs(A.dx) < 220) {
        yield* dive(e, A, { tele: 0.5, v: 400, dur: 0.6, mult: 1.4, fw: 30, fh: 24 });
        cool(e, "dive", 3.5, 5);
        continue;
      }
      if (near(A, 60, 40) && ready(e, "tail")) {
        A.face();
        A.tele(0.35);
        yield A.once("tail") * 0.5;
        A.sound("swing", 0.6);
        e.playerInRect(e.cx - 60, e.body.y - 20, 120, 40) && e.hit(1.2, !0, "lightning", void 0, 1.6);
        cool(e, "tail", 2, 3);
        continue;
      }
      yield* approach(e, A, { keep: 130, alt: 90 });
    }
  },
});
