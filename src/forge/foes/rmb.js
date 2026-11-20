// 모스바크 몬스터 12종 행동 (그림은 px_mb.js)
import { register } from "./core.js";
import * as X from "./px_mb.js";
import { DT, POIS, CHILL, STUN, BLEED, hop, near, dirTo, ready, cool, land, wander, hover, notice, approach, melee, slam, lob, shoot, dive, charge, summon, lurk, groundY } from "./bkit.js";

// ════ 이끼 거북 ════ 껍질에 숨어 막고(덜 아프다), 껍질째 굴러 들이받는다. 벽에 박히면 뒤집혀 버둥거린다 (1.6배 피해)
register("mb_turtle", {
  ...X.pxTurtle, speed: 30, sight: 200, atkMul: 1.1, heavy: 0.7,
  damage(e, dmg) {
    const M = e.fz?.mem;
    return M?.dizzy ? dmg * 1.6 : M?.hide ? dmg * 0.3 : dmg;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    cool(e, "roll", 1, 2);
    for (;;) {
      if (!e.aggro) {
        M.hide = 0;
        yield* wander(e, A, { speed: 10, range: 40 });
        continue;
      }
      // 맞으면 잠깐 껍질 속으로
      if (e.sinceHit < 0.3 && ready(e, "shell")) {
        M.hide = 1;
        A.play("hide"), A.stop(1);
        yield 1.2;
        M.hide = 0;
        cool(e, "shell", 3, 4);
        continue;
      }
      if (A.ground && ready(e, "roll") && Math.abs(A.dx) < 200 && Math.abs(A.dy) < 30) {
        M.hide = 1;
        const hit = yield* charge(e, A, { wind: "wind", run: "atk", tele: 0.55, v: 240, dur: 1.3, mult: 1.1, knock: 1.4, fw: 24, fh: 18, stunAnim: "flip", stunT: 2, overLedge: !1 });
        M.hide = 0;
        void hit;
        cool(e, "roll", 2.5, 3.5);
        continue;
      }
      if (near(A, 34, 20) && ready(e, "bite")) {
        yield* melee(e, A, { wind: "rec", atk: "idle", rec: "idle", tele: 0.35, dash: 60, fw: 18, fh: 12, mult: 0.9, recK: 0.2 });
        cool(e, "bite", 1.2, 2);
        continue;
      }
      yield* approach(e, A, { lo: 60, hi: 100 });
    }
  },
});

// ════ 가시덩굴 ════ 덤불로 숨어 있다가(덜 아프다) 머리를 쳐들고 덩굴 채찍을 휘두른다. 가끔 바닥으로 가시 덩굴을 뻗는다
register("mb_thorn", {
  ...X.pxThorn, speed: 0, sight: 200, atkMul: 1, heavy: 1,
  damage(e, dmg) {
    return e.fz?.mem.hidden ? dmg * 0.4 : dmg;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    M.hidden = 1;
    for (;;) {
      A.stop(1);
      if (M.hidden) {
        A.play("hide");
        if (e.aggro && near(A, 100, 60)) (M.hidden = 0), A.sound("warn", 0.4), yield A.once("rise");
        yield 0.08;
        continue;
      }
      if (!e.aggro || !near(A, 160, 80)) {
        M.hidden = 1;
        continue;
      }
      if (near(A, 60, 36) && ready(e, "whip")) {
        yield* melee(e, A, { tele: 0.4, fw: 54, fh: 30, up: 6, mult: 1, st: BLEED(0.08, 2), knock: 0.9, fx: "slash", tint: 0xa0e070, fxX: 26, fxY: -20, fxS: 0.8 });
        cool(e, "whip", 1.3, 1.9);
        continue;
      }
      if (ready(e, "creep")) {
        A.face();
        A.tele(0.55, { bar: [e.cx + e.facing * 70, 120] });
        yield A.once("wind");
        A.once("atk");
        for (let k = 1; k <= 5; k++) {
          const x = e.cx + e.facing * (14 + k * 22), gy = groundY(e, x);
          e.host.fx.burst("chunk", x, gy - 4, 4, 0x3e7a32);
          e.playerInRect(x - 10, gy - 20, 20, 20) && e.hit(0.7, !0, "earth", BLEED(0.08, 2), 0.4);
          yield 0.08;
        }
        yield A.once("rec");
        cool(e, "creep", 3.5, 5);
        continue;
      }
      A.play("idle"), A.face();
      yield 0.05;
    }
  },
});

// ════ 사슴벌레 기사 ════ 큰턱으로 붙잡아 등 뒤로 내던진다. 멀면 딱지를 펴고 날아올라 덮친다
register("mb_beetle", {
  ...X.pxStag, speed: 70, sight: 230, atkMul: 1.2,
  *brain(e, A) {
    cool(e, "fly", 1.5, 3);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 22 });
        continue;
      }
      yield* notice(e, A, { anim: "wind", sound: "warn" });
      const d = Math.abs(A.dx);
      if (near(A, 40, 26) && ready(e, "grab")) {
        let hit = !1;
        yield* melee(e, A, { tele: 0.4, dash: 120, fw: 24, fh: 22, mult: 0.8, knock: 0, onHit: () => (hit = !0), recK: 0.2 });
        if (hit && !A.p.dead) {
          yield A.once("toss") * 0.5;
          const pb = A.p.body;
          pb.vx = -e.facing * 360, pb.vy = -420;
          e.hit(0.7, !0, "phys", void 0, 0);
          A.sound("punch", 0.6), A.shake(1.5);
          yield 0.3;
        }
        cool(e, "grab", 1.4, 2.2);
        continue;
      }
      if (A.ground && ready(e, "fly") && d > 70 && d < 200) {
        A.face();
        A.tele(0.4);
        yield 0.3;
        A.play("fly");
        hop(e, dirTo(A), Math.min(260, d * 1.6), 380);
        A.sound("dash", 0.4);
        let hit = !1;
        for (let t = 0; t < 1.6 && !(t > 0.15 && A.ground); t += DT) {
          !hit && A.melee(22, 22, 1, { knock: 1 }) && (hit = !0);
          yield 0;
        }
        A.burst("dust", 0, -1, 5, 0x8a6a40);
        cool(e, "fly", 3, 4.5);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 32 });
    }
  },
});

// ════ [정예] 이끼 트롤 ════ 통나무 내려찍기(넓게) · 바위 던지기 · 한동안 맞지 않으면 이끼로 상처를 메운다
register("mb_troll", {
  ...X.pxTroll, speed: 42, sight: 280, atkMul: 1.8, heavy: 1,
  *brain(e, A) {
    cool(e, "rock", 2, 3);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 14, range: 50 });
        continue;
      }
      yield* notice(e, A, { anim: "wind", sound: "bossRoar", vol: 0.3 });
      // 재생: 3초 넘게 안 맞았으면
      if (e.sinceHit > 3 && e.hp < e.maxHp * 0.95 && ready(e, "regen")) {
        A.play("regen"), A.stop(1);
        A.sound("buff", 0.4);
        for (let t = 0; t < 1.2 && e.sinceHit > 0.1; t += DT) {
          e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.05 * DT);
          Math.random() < 0.2 && e.host.fx.burst("glow", e.cx + (Math.random() - 0.5) * 30, e.cy, 1, 0xb0ff70);
          yield 0;
        }
        cool(e, "regen", 2, 3);
        continue;
      }
      const d = Math.abs(A.dx);
      if (near(A, 70, 40) && ready(e, "log")) {
        yield* slam(e, A, { r: 60, fwd: 34, mult: 1.5, tele: 0.65, shake: 3, chunk: 0x7a5432, tint: 0xd8f0a0 });
        cool(e, "log", 2, 3);
        continue;
      }
      if (ready(e, "rock") && d > 90 && d < 280) {
        yield* lob(e, A, { wind: "throw", atk: "throw", tele: 0.5, sprite: "p_bigrock", g: 520, ox: -10, oy: 60, mult: 1.3, el: "earth", scale: 1.4, sound: "swing" });
        cool(e, "rock", 4, 5.5);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 50 });
    }
  },
});

// ════ 숲 올빼미 ════ 가지(집)에 앉아 고개를 돌린다. 알아채면 소리 없이(예고 짧게) 급강하해 할퀴고, 몇 번 뒤 다시 앉는다
register("mb_owl", {
  ...X.pxOwl, speed: 120, sight: 260, atkMul: 1,
  *brain(e, A) {
    const M = e.fz.mem;
    M.perch = 1;
    for (;;) {
      if (M.perch) {
        const dy = (e._hy ?? e.body.y) - e.body.y;
        if (Math.abs(dy) > 4 || Math.abs(e.homeX - e.cx) > 4) A.play("move"), A.flyTo(e.homeX, e._hy ?? e.body.y, 70);
        else A.play("perch"), (e.body.vx = 0), (e.body.vy = 0);
        e.aggro && near(A, 200, 140) && ((M.perch = 0), (M.n = 0));
        yield 0.03;
        continue;
      }
      if (!e.aggro || M.n >= 3) {
        M.perch = 1;
        continue;
      }
      if (ready(e, "swoop") && Math.abs(A.dx) < 200) {
        yield* dive(e, A, { tele: 0.22, v: 380, dur: 0.5, mult: 1.1, st: BLEED(0.1, 2), fw: 18, fh: 18, sound: "swing" });
        M.n++;
        cool(e, "swoop", 1.4, 2.2);
        continue;
      }
      yield* approach(e, A, { keep: 100, alt: 90 });
    }
  },
});

// ════ 도토리 다람쥐 ════ 가지 위를 쪼르르 오가며 단단한 도토리를 던진다. 몰리면 깨문다
register("mb_squirrel", {
  ...X.pxSquirrel, speed: 120, sight: 240, atkMul: 0.7,
  *brain(e, A) {
    cool(e, "throw", 0.5, 1.2);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 40, range: 70 });
        continue;
      }
      const d = Math.abs(A.dx);
      if (d < 30 && Math.abs(A.dy) < 20 && ready(e, "bite")) {
        yield* melee(e, A, { tele: 0.2, dash: 140, fw: 14, fh: 12, mult: 0.7, knock: 0.4, fx: "slash", tint: 0xf0d8b0 });
        hop(e, -e.facing, 180, 220);
        yield* land(e, A);
        cool(e, "bite", 1, 1.6);
        continue;
      }
      if (d > 60 && d < 240 && ready(e, "throw")) {
        yield* lob(e, A, { wind: "wind", atk: "atk", release: 0.12, sprite: "p_rock", ox: 4, oy: 14, n: Math.random() < 0.4 ? 2 : 1, mult: 0.6, scale: 0.8, chunkC: 0x8a5a2a, tele: 0.25 });
        cool(e, "throw", 1.6, 2.4);
        continue;
      }
      // 거리 유지하며 깡충깡충
      if (A.ground && (d < 80 || d > 180)) {
        A.play("move");
        hop(e, d < 80 ? -dirTo(A) : dirTo(A), 120, 160);
        yield* land(e, A);
        e.facing = dirTo(A);
        continue;
      }
      A.play("idle"), A.face(), A.stop();
      yield 0;
    }
  },
});

// ════ 잎사귀 나방 ════ 머리 위를 맴돌며 날갯짓으로 인분을 뿌린다 (그 아래 바닥에 머무르면 느려지고 조금 아프다)
register("mb_moth", {
  ...X.pxMoth, speed: 70, sight: 240, atkMul: 0.7,
  *brain(e, A) {
    cool(e, "dust", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 50, speed: 30 });
        continue;
      }
      if (ready(e, "dust") && Math.abs(A.dx) < 70) {
        A.tele(0.4);
        yield A.once("wind");
        A.play("atk");
        A.sound("magic", 0.3);
        for (let t = 0; t < 1.2; t += DT) {
          Math.random() < 0.4 && e.host.fx.burst("rise", e.cx + (Math.random() - 0.5) * 30, e.cy + 10, 1, 0xe8e8a0);
          yield 0;
        }
        const gy = groundY(e, e.cx);
        A.zone(e.cx, gy, 70, 3, 0.05, { el: "poison", st: CHILL(0.45, 1.5), kind: "sand" });
        cool(e, "dust", 3.5, 5);
        continue;
      }
      // 플레이어 바로 위로
      const p = A.p;
      A.play("move");
      A.flyTo(p.cx + Math.sin(e.life * 1.6) * 20, p.body.y - 70, e.speed);
      A.face();
      yield 0;
    }
  },
});

// ════ [정예] 거대 사마귀 ════ 잎처럼 위장해 가만히 있다가(덜 아프다) 낫 두 자루로 연속 베기. 뒤로 뛰었다가 날아드는 베기
register("mb_mantis", {
  ...X.pxMantis, speed: 90, sight: 260, atkMul: 1.6,
  damage(e, dmg) {
    return e.fz?.mem.hidden ? dmg * 0.5 : dmg;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    M.hidden = 1;
    cool(e, "leap", 2, 3);
    for (;;) {
      if (M.hidden) {
        A.play("hide"), A.stop(1);
        if (e.aggro && near(A, 110, 50)) {
          M.hidden = 0;
          A.sound("warn", 0.5);
          yield* melee(e, A, { tele: 0.3, dash: 260, fw: 34, fh: 28, mult: 1.3, st: BLEED(0.12, 3), fx: "slash", tint: 0xe8ffc8, fxS: 0.8 });
        }
        yield 0.05;
        continue;
      }
      if (!e.aggro) {
        M.hidden = 1;
        continue;
      }
      if (near(A, 50, 34) && ready(e, "slash")) {
        for (let k = 0; k < 2; k++) yield* melee(e, A, { tele: k ? 0 : 0.4, dash: 160, fw: 32, fh: 28, mult: 1.1, st: BLEED(0.1, 2.5), fx: "slash", tint: 0xe8ffc8, fxS: 0.75, recK: k ? 1 : 0.25 });
        cool(e, "slash", 1.2, 1.8);
        continue;
      }
      if (A.ground && ready(e, "leap") && Math.abs(A.dx) < 220) {
        A.face();
        hop(e, -e.facing, 160, 260);
        yield* land(e, A);
        e.facing = dirTo(A);
        A.tele(0.4);
        yield A.once("wind");
        A.play("leap");
        hop(e, e.facing, Math.min(320, Math.abs(A.dx) * 2), 300);
        A.sound("dash", 0.6);
        let hit = !1;
        for (let t = 0; t < 1.4 && !(t > 0.15 && A.ground); t += DT) {
          !hit && A.melee(34, 28, 1.4, { knock: 1.2, st: BLEED(0.12, 3) }) && ((hit = !0), A.fxSlash(16, -16, 0.9, 0xe8ffc8));
          yield 0;
        }
        yield A.once("rec");
        cool(e, "leap", 4, 5.5);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 40 });
    }
  },
});

// ════ 독두꺼비 ════ 긴 혀로 멀리서 끌어당기고, 독 거품을 뱉는다. 깡충 뛰어 다닌다
register("mb_toad", {
  ...X.pxToad, speed: 80, sight: 220, atkMul: 0.9,
  *brain(e, A) {
    cool(e, "tongue", 1, 2), cool(e, "spit", 2, 3);
    for (;;) {
      if (!e.aggro) {
        A.play("idle"), A.stop(1);
        Math.random() < 0.01 && A.ground && (A.play("move"), hop(e, Math.random() < 0.5 ? -1 : 1, 60, 160), yield* land(e, A));
        yield 0.05;
        continue;
      }
      const d = Math.abs(A.dx);
      if (ready(e, "tongue") && d > 40 && d < 150 && Math.abs(A.dy) < 24) {
        A.face(), A.stop(1);
        A.tele(0.45, { bar: [e.cx + e.facing * 75, 140] });
        yield A.once("wind");
        A.once("atk");
        A.sound("swing", 0.5);
        yield 0.1;
        const p = A.p;
        if (Math.sign(p.cx - e.cx) === e.facing && Math.abs(p.cx - e.cx) < 150 && Math.abs(p.body.y - e.body.y) < 26) {
          e.hit(0.6, !0, "poison", POIS(0.1, 2), 0);
          p.body.vx = -e.facing * 420, p.body.vy = -120;
        }
        yield A.once("rec");
        cool(e, "tongue", 2.5, 3.5);
        continue;
      }
      if (ready(e, "spit") && d < 220) {
        yield* lob(e, A, { wind: "spit", atk: "spit", release: 0.2, sprite: "sl_glob", g: 420, ox: 12, oy: 12, mult: 0.6, el: "poison", st: POIS(0.14, 3), tele: 0.3, sound: "blub" });
        cool(e, "spit", 3, 4);
        continue;
      }
      if (A.ground && (d > 120 || d < 40)) {
        A.play("move");
        hop(e, d > 120 ? dirTo(A) : -dirTo(A), 110, 200);
        yield* land(e, A);
        e.facing = dirTo(A);
        yield 0.2;
        continue;
      }
      A.play("idle"), A.face();
      yield 0;
    }
  },
});

// ════ 반딧불 무리 ════ 흩어져 날다 한데 모여 눈부신 빛을 터뜨린다 (가까우면 한동안 시야가 좁아진다)
register("mb_firefly", {
  ...X.pxFirefly, speed: 80, sight: 240, atkMul: 0.6,
  *brain(e, A) {
    cool(e, "flash", 1.5, 2.5);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 40, ry: 14, speed: 30 });
        continue;
      }
      if (ready(e, "flash") && Math.hypot(A.dx, A.dy) < 130) {
        A.tele(0.6);
        yield A.once("wind");
        A.once("atk");
        A.sound("magic", 0.5);
        e.host.fx.anim("ring", e.cx, e.cy, { scale: 2.6, tint: 0xffffa0 });
        e.host.fx.burst("glow", e.cx, e.cy, 20, 0xffffa0);
        Math.hypot(A.dx, A.dy) < 120 && (A.blind(2.2), e.hit(0.4, !1, "light", void 0, 0.3));
        yield A.once("rec");
        cool(e, "flash", 4.5, 6);
        continue;
      }
      if (ready(e, "bump") && Math.abs(A.dx) < 120) {
        yield* dive(e, A, { tele: 0.3, v: 280, dur: 0.4, mult: 0.6, fw: 16, fh: 16 });
        cool(e, "bump", 1.6, 2.6);
        continue;
      }
      yield* approach(e, A, { keep: 70, alt: 40 });
    }
  },
});

// ════ 개울 가재 ════ 집게를 들고 옆걸음, 가까우면 집어서 출혈. 조금 멀면 물을 튀겨 쏜다 (느려짐)
register("mb_crayfish", {
  ...X.pxCrayfish, speed: 70, sight: 200, atkMul: 1,
  *brain(e, A) {
    cool(e, "squirt", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 20, range: 50 });
        continue;
      }
      const d = Math.abs(A.dx);
      if (near(A, 36, 22) && ready(e, "pinch")) {
        yield* melee(e, A, { tele: 0.35, dash: 120, fw: 20, fh: 16, up: 4, mult: 1, st: BLEED(0.1, 2.5), knock: 0.7, fx: "slash", tint: 0xffc0a0 });
        cool(e, "pinch", 1, 1.6);
        continue;
      }
      if (d > 50 && d < 170 && ready(e, "squirt")) {
        yield* shoot(e, A, { wind: "wind", atk: "squirt", sprite: "sl_glob", speed: 240, g: 300, mult: 0.5, el: "ice", st: CHILL(0.4, 1.5), ox: 14, oy: 14, tele: 0.3, sound: "blub", scale: 0.8 });
        cool(e, "squirt", 2.2, 3.2);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 30 });
    }
  },
});

// ════ [정예] 늪 두꺼비 왕 ════ 높이 뛰어 짓누르기 · 혀로 삼켰다 뱉기 · 새끼 독두꺼비를 토해낸다
register("mb_toadking", {
  ...X.pxToadKing, speed: 50, sight: 300, atkMul: 1.7, heavy: 1,
  *brain(e, A) {
    cool(e, "jump", 1.5, 2.5), cool(e, "brood", 4, 6), cool(e, "swallow", 3, 4);
    for (;;) {
      if (!e.aggro) {
        A.play("idle"), A.stop(1);
        yield 0.1;
        continue;
      }
      yield* notice(e, A, { anim: "wind", sound: "bossRoar", vol: 0.35 });
      const d = Math.abs(A.dx);
      if (ready(e, "brood")) {
        const did = yield* summon(e, A, { id: "mb_toad", n: 2, max: 2, anim: "spit", col: 0xc8d890, dx: 30 });
        cool(e, "brood", did ? 9 : 3, did ? 12 : 4);
        continue;
      }
      if (ready(e, "swallow") && d < 160 && Math.abs(A.dy) < 30) {
        A.face(), A.stop(1);
        A.tele(0.5, { bar: [e.cx + e.facing * 80, 150] });
        yield A.once("wind");
        A.once("swallow");
        A.sound("swing", 0.6);
        yield 0.12;
        const p = A.p;
        if (Math.sign(p.cx - e.cx) === e.facing && Math.abs(p.cx - e.cx) < 160 && Math.abs(p.body.y - e.body.y) < 34 && !p.dead) {
          // 삼킴: 입 앞에 붙잡혀 독에 젖었다가 멀리 뱉어진다
          for (let t = 0; t < 1; t += DT) {
            p.body.x = e.cx + e.facing * 22, p.body.y = e.body.y - 6, p.body.vx = 0, p.body.vy = 0;
            yield 0;
          }
          A.once("spit");
          A.sound("splat", 0.7);
          e.hit(1, !0, "poison", POIS(0.2, 3), 0);
          p.body.vx = e.facing * 480, p.body.vy = -300;
          yield 0.3;
        }
        yield A.once("rec");
        cool(e, "swallow", 5, 7);
        continue;
      }
      if (A.ground && ready(e, "jump") && d < 260) {
        A.face();
        A.tele(0.6, { bar: [A.p.cx, 140] });
        yield A.once("wind");
        A.play("air");
        hop(e, dirTo(A), Math.min(280, d * 1.4), 560);
        A.sound("jump", 0.7);
        yield* land(e, A, 3);
        A.once("atk");
        const x = e.cx, y = e.body.y;
        e.host.fx.anim("ring", x, y - 4, { scale: 3.4, tint: 0xc8d890 });
        e.host.fx.burst("dust", x, y - 2, 14, 0x8a8a5a);
        A.shake(3.5), A.sound("thud", 0.9);
        e.playerInRect(x - 74, y - 34, 148, 34) && e.hit(1.6, !0, "earth", STUN(0.4), 1.5);
        yield A.once("rec");
        cool(e, "jump", 3, 4);
        continue;
      }
      yield* approach(e, A, { lo: 30, hi: 70 });
    }
  },
});
