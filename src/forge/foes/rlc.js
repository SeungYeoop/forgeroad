// 리프크라운 몬스터 12종 행동 (그림은 px_lc.js)
import { register } from "./core.js";
import * as X from "./px_lc.js";
import { DT, POIS, CHILL, STUN, BLEED, hop, near, dirTo, ready, cool, land, wander, hover, notice, approach, melee, slam, lob, shoot, dive, charge, summon, lurk, groundY } from "./bkit.js";

// ════ 실 타는 애벌레 ════ 가지(집)에 실을 걸고 매달려 있다가, 바로 아래로 오면 실을 풀어 내려와 물고 다시 올라간다
register("lc_larva", {
  ...X.pxLarva, speed: 60, sight: 200, atkMul: 0.8,
  *brain(e, A) {
    const top = () => e._hy ?? e.body.y;
    for (;;) {
      // 집 높이로 되감기
      if (Math.abs(top() - e.body.y) > 3 || Math.abs(e.homeX - e.cx) > 3) {
        A.play("climb");
        A.flyTo(e.homeX, top(), 70);
        yield 0;
        continue;
      }
      e.body.vx = e.body.vy = 0;
      A.play("idle");
      if (e.aggro && Math.abs(A.dx) < 26 && A.dy > 8 && A.dy < 150 && ready(e, "drop")) {
        A.tele(0.3, { bar: [e.cx, 24] });
        yield 0.3;
        A.play("drop");
        const ty = A.p.body.y - 12;
        for (let t = 0; t < 1 && e.body.y < ty; t += DT) (e.body.vy = 380, e.body.vx = 0, yield 0);
        e.body.vy = 0;
        A.once("atk");
        A.sound("punch", 0.4);
        e.playerInRect(e.cx - 10, e.body.y - 6, 20, 24) && e.hit(0.9, !0, "poison", POIS(0.1, 2.5), 0.3);
        yield 0.4;
        cool(e, "drop", 1.5, 2.5);
        continue;
      }
      yield 0.05;
    }
  },
});

// ════ 잎 카멜레온 ════ 몸을 감춰 거의 안 보인다(덜 아프다). 가까이 오면 드러나 긴 혀로 낚아 끌어당긴다
register("lc_chameleon", {
  ...X.pxChameleon, speed: 50, sight: 200, atkMul: 1,
  damage(e, dmg) {
    return e.fz?.mem.hidden ? dmg * 0.5 : dmg;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    M.hidden = 1;
    for (;;) {
      if (!e.aggro) {
        M.hidden = 1;
        A.play("hide"), A.stop(1);
        yield 0.1;
        continue;
      }
      const d = Math.abs(A.dx);
      if (ready(e, "tongue") && d < 150 && Math.abs(A.dy) < 30) {
        A.face(), A.stop(1);
        M.hidden = 0;
        A.tele(0.45, { bar: [e.cx + e.facing * 70, 130] });
        yield A.once("wind");
        A.once("atk");
        A.sound("swing", 0.5);
        yield 0.12;
        const p = A.p;
        if (Math.sign(p.cx - e.cx) === e.facing && Math.abs(p.cx - e.cx) < 150 && Math.abs(p.body.y - e.body.y) < 30) (e.hit(0.8, !0, "phys", void 0, 0), (p.body.vx = -e.facing * 440), (p.body.vy = -140));
        yield A.once("rec");
        cool(e, "tongue", 2.4, 3.2);
        continue;
      }
      if (near(A, 30, 20) && ready(e, "bite")) {
        M.hidden = 0;
        yield* melee(e, A, { tele: 0.3, dash: 120, fw: 18, fh: 12, mult: 0.8, knock: 0.6 });
        cool(e, "bite", 1.2, 1.8);
        continue;
      }
      // 숨은 채 천천히 다가간다
      M.hidden = d > 70 ? 1 : 0;
      yield* approach(e, A, { lo: 40, hi: 110, move: "move", idle: M.hidden ? "hide" : "idle" });
    }
  },
});

// ════ 가시 고슴도치 ════ 몸을 말아 가시를 사방으로 쏘고, 공처럼 굴러 들이받는다
register("lc_hedgehog", {
  ...X.pxHedgehog, speed: 70, sight: 220, atkMul: 0.9,
  damage(e, dmg) {
    return e.fz?.mem.curl ? dmg * 0.6 : dmg;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    cool(e, "quills", 1, 2), cool(e, "roll", 2, 3);
    for (;;) {
      if (!e.aggro) {
        M.curl = 0;
        yield* wander(e, A, { speed: 18, range: 50 });
        continue;
      }
      if (ready(e, "quills") && Math.abs(A.dx) < 160) {
        M.curl = 1;
        A.stop(1);
        A.tele(0.5);
        yield A.once("wind");
        A.once("atk");
        A.sound("shoot", 0.5);
        for (let k = 0; k < 8; k++) A.shoot({ sprite: "p_thorn", speed: 200, life: 1.2, radius: 4 }, e.cx, e.cy - 2, -Math.PI + (k / 7) * Math.PI, 0.45, { el: "phys", st: BLEED(0.06, 2), opts: { scale: 0.7 } });
        yield A.once("rec");
        M.curl = 0;
        cool(e, "quills", 3, 4);
        continue;
      }
      if (A.ground && ready(e, "roll") && Math.abs(A.dx) < 200 && Math.abs(A.dy) < 24) {
        M.curl = 1;
        yield* charge(e, A, { wind: "wind", run: "roll", tele: 0.5, v: 240, dur: 1, mult: 0.9, knock: 1.2, fw: 18, fh: 16, stun: !1, stopOnHit: !0 });
        M.curl = 0;
        cool(e, "roll", 2.5, 3.5);
        continue;
      }
      yield* approach(e, A, { lo: 50, hi: 100 });
    }
  },
});

// ════ [정예] 수관 거미 ════ 거미줄 덩이를 던져 덫을 놓고(밟으면 크게 느려짐) · 독 거미줄 세 갈래 · 뛰어 덮쳐 문다
register("lc_spider", {
  ...X.pxSpider, speed: 90, sight: 300, atkMul: 1.6, heavy: 0.7,
  *brain(e, A) {
    cool(e, "web", 1.5, 2.5), cool(e, "spray", 3, 4), cool(e, "pounce", 2.5, 3.5);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 20, range: 60 });
        continue;
      }
      yield* notice(e, A, { anim: "wind", sound: "warn" });
      const d = Math.abs(A.dx);
      if (ready(e, "web") && d > 60 && d < 260) {
        yield* lob(e, A, {
          wind: "web", atk: "web", release: 0.15, sprite: "sl_glob", g: 420, ox: -20, oy: 24, mult: 0.3, el: "phys", tele: 0.4, sound: "blub", scale: 1.3,
          onDone: (pr) => {
            const gy = groundY(e, pr.x);
            e.host.fx.burst("glow", pr.x, gy - 4, 8, 0xf0f8ff);
            !e.dead && A.zone(pr.x, gy, 56, 5, 0.02, { el: "phys", st: CHILL(0.7, 1.2), kind: "slime" });
          },
        });
        cool(e, "web", 4, 5);
        continue;
      }
      if (ready(e, "spray") && d < 200) {
        yield* shoot(e, A, { wind: "wind", atk: "atk", sprite: "sl_glob", n: 3, spread: 0.25, speed: 220, mult: 0.5, el: "poison", st: POIS(0.14, 3), ox: 14, oy: 16, tele: 0.45, sound: "blub", scale: 0.8 });
        cool(e, "spray", 3.5, 5);
        continue;
      }
      if (A.ground && ready(e, "pounce") && d < 200) {
        A.face();
        A.tele(0.5);
        yield A.once("wind");
        A.once("atk");
        hop(e, dirTo(A), Math.min(300, d * 1.8), 360);
        A.sound("dash", 0.6);
        let hit = !1;
        for (let t = 0; t < 1.4 && !(t > 0.15 && A.ground); t += DT) {
          !hit && A.melee(34, 22, 1.3, { st: POIS(0.18, 3), knock: 1 }) && (hit = !0);
          yield 0;
        }
        yield A.once("rec");
        cool(e, "pounce", 3.5, 5);
        continue;
      }
      if (near(A, 50, 24) && ready(e, "bite")) {
        yield* melee(e, A, { tele: 0.4, dash: 160, fw: 30, fh: 18, mult: 1.2, st: POIS(0.16, 3), knock: 0.9, fx: "slash", tint: 0xd0ff90 });
        cool(e, "bite", 1.4, 2);
        continue;
      }
      yield* approach(e, A, { lo: 40, hi: 90 });
    }
  },
});

// ════ 까치 도둑 ════ 덮쳐서 반짝이는 것(골드)을 낚아채고 달아난다. 달아나는 동안 잡으면 훔친 것을 떨어뜨린다
register("lc_magpie", {
  ...X.pxMagpie, speed: 140, sight: 280, atkMul: 0.6,
  die(e) {
    e.fz?.mem.loot && e.host.dropGold?.(e.cx, e.cy, 120);
  },
  *brain(e, A) {
    const M = e.fz.mem;
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 60, speed: 50 });
        continue;
      }
      if (M.loot) {
        // 훔친 것을 물고 집 쪽으로 달아난다
        A.play("flee");
        A.flyTo(e.homeX + Math.sin(e.life) * 40, (e._hy ?? e.body.y) - 40, e.speed);
        if ((M.fleeT = (M.fleeT ?? 0) + DT) > 6) (M.loot = 0), (M.fleeT = 0);
        yield 0;
        continue;
      }
      if (ready(e, "snatch") && Math.abs(A.dx) < 200) {
        let hit = !1;
        yield* dive(e, A, { tele: 0.35, v: 400, dur: 0.5, mult: 0.6, fw: 16, fh: 14, onHit: () => (hit = !0) });
        if (hit) {
          M.loot = 1, M.fleeT = 0;
          e.host.fx.burst("glow", e.cx, e.cy, 8, 0xffd040);
          A.sound("coin", 0.6);
        }
        cool(e, "snatch", 2, 3);
        continue;
      }
      yield* approach(e, A, { keep: 100, alt: 70 });
    }
  },
});

// ════ 최면 나비 ════ 날개 가루를 뿌린다: 가까이 있으면 잠깐 눈앞이 어지럽고(시야 좁아짐) 느려진다
register("lc_butterfly", {
  ...X.pxButterfly, speed: 60, sight: 240, atkMul: 0.6,
  *brain(e, A) {
    cool(e, "dust", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 40, ry: 14, speed: 30 });
        continue;
      }
      if (ready(e, "dust") && Math.hypot(A.dx, A.dy) < 110) {
        A.tele(0.5);
        yield A.once("wind");
        A.once("atk");
        A.sound("magic", 0.4);
        e.host.fx.anim("ring", e.cx, e.cy, { scale: 2.4, tint: 0xd8a0ff });
        e.host.fx.burst("glow", e.cx, e.cy + 10, 12, 0xf0d8ff);
        Math.hypot(A.dx, A.dy) < 100 && (A.blind(1.4), A.afflict(CHILL(0.5, 1.5)), e.hit(0.3, !1, "arcane", void 0, 0));
        yield A.once("rec");
        cool(e, "dust", 3.5, 5);
        continue;
      }
      yield* approach(e, A, { keep: 60, alt: 50 });
    }
  },
});

// ════ 아기새 떼 ════ 둥지에서 우르르 뛰쳐나와 쪼아 댄다. 약하지만 셋이 번갈아
register("lc_chick", {
  ...X.pxChicks, speed: 90, sight: 200, atkMul: 0.5,
  *brain(e, A) {
    for (;;) {
      if (!e.aggro) {
        A.play("idle"), A.stop(1);
        yield 0.1;
        continue;
      }
      if (near(A, 26, 16) && ready(e, "peck")) {
        yield* melee(e, A, { tele: 0.25, dash: 100, fw: 18, fh: 12, mult: 0.45, knock: 0.3, spark: !1 });
        cool(e, "peck", 0.7, 1.2);
        continue;
      }
      if (A.ground && Math.abs(A.dx) > 20) {
        A.play("move");
        hop(e, dirTo(A), 90, 150);
        yield* land(e, A);
        continue;
      }
      A.play("idle"), A.face();
      yield 0;
    }
  },
});

// ════ [정예] 거대 어미새 ════ 깃털 탄막 · 날개로 돌풍(멀리 밀려남) · 아기새를 부른다 · 발톱 급강하
register("lc_mother", {
  ...X.pxMother, speed: 120, sight: 330, atkMul: 1.6,
  *brain(e, A) {
    cool(e, "volley", 1.5, 2.5), cool(e, "gust", 4, 5), cool(e, "call", 3, 4), cool(e, "dive", 3, 4);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 70 });
        continue;
      }
      yield* notice(e, A, { anim: "call", sound: "bossRoar", vol: 0.3 });
      const d = Math.abs(A.dx);
      if (ready(e, "call")) {
        const did = yield* summon(e, A, { id: "lc_chick", n: 1, max: 2, anim: "call", col: 0xf8d050, dy: -20 });
        cool(e, "call", did ? 10 : 3, did ? 13 : 4);
        continue;
      }
      if (ready(e, "volley") && d < 280) {
        yield* shoot(e, A, { wind: "wind", atk: "volley", sprite: "p_thorn", n: 5, spread: 0.2, speed: 240, mult: 0.55, el: "wind", ox: 20, oy: 26, tele: 0.45, sound: "shoot", scale: 0.9 });
        cool(e, "volley", 2.6, 3.6);
        continue;
      }
      if (ready(e, "gust") && d < 220) {
        A.face();
        A.tele(0.45);
        yield A.once("gust") * 0.5;
        A.sound("dash", 0.6);
        for (let t = 0; t < 0.7; t += DT) {
          Math.abs(A.dx) < 240 && Math.abs(A.dy) < 90 && (A.p.body.vx += e.facing * 950 * DT);
          Math.random() < 0.5 && e.host.fx.burst("dust", e.cx + e.facing * (30 + Math.random() * 130), e.body.y + (Math.random() - 0.5) * 40, 1, 0xf0fff0);
          yield 0;
        }
        cool(e, "gust", 5, 7);
        continue;
      }
      if (ready(e, "dive") && d < 220) {
        yield* dive(e, A, { tele: 0.5, v: 380, dur: 0.6, mult: 1.3, fw: 30, fh: 26, st: BLEED(0.12, 2.5) });
        cool(e, "dive", 3.5, 5);
        continue;
      }
      yield* approach(e, A, { keep: 120, alt: 90 });
    }
  },
});

// ════ 호박 정령 ════ 끈적한 수액 덩이를 던진다: 맞으면 잠깐 굳고, 떨어진 자리는 끈끈해서 느려진다
register("lc_amber", {
  ...X.pxAmber, speed: 50, sight: 260, atkMul: 0.8,
  *brain(e, A) {
    cool(e, "resin", 0.8, 1.6);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 24, ry: 8, speed: 18 });
        continue;
      }
      if (ready(e, "resin") && Math.abs(A.dx) < 240) {
        yield* lob(e, A, {
          sprite: "sl_glob", g: 420, ox: 8, oy: 22, mult: 0.6, el: "earth", st: STUN(0.6), tele: 0.45, sound: "blub", scale: 1.2,
          onDone: (pr) => {
            const gy = groundY(e, pr.x);
            e.host.fx.burst("glow", pr.x, gy - 4, 8, 0xf0a028);
            !e.dead && A.zone(pr.x, gy, 40, 3.5, 0.02, { el: "earth", st: CHILL(0.6, 1), kind: "sand" });
          },
        });
        cool(e, "resin", 2.4, 3.4);
        continue;
      }
      yield* approach(e, A, { keep: 120, alt: 60 });
    }
  },
});

// ════ 나뭇잎 요정 궁수 ════ 가지 사이에서 덩굴 활로 화살을 쏘고, 붙으면 뒤로 깡충 물러난다
register("lc_archer", {
  ...X.pxArcher, speed: 90, sight: 300, atkMul: 0.9,
  *brain(e, A) {
    cool(e, "shot", 0.6, 1.4);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 20 });
        continue;
      }
      const d = Math.abs(A.dx);
      if (d < 70 && A.ground && ready(e, "hopback")) {
        A.face();
        hop(e, -e.facing, 170, 260);
        yield* land(e, A);
        e.facing = dirTo(A);
        cool(e, "hopback", 1.5, 2.5);
        continue;
      }
      if (ready(e, "shot") && d < 300 && Math.abs(A.dy) < 120) {
        yield* shoot(e, A, { sprite: "p_arrow", speed: 320, mult: 0.75, el: "phys", ox: 12, oy: 22, tele: 0.45, sound: "bow", recK: 0.5 });
        cool(e, "shot", 1.8, 2.6);
        continue;
      }
      yield* approach(e, A, { lo: 120, hi: 200 });
    }
  },
});

// ════ 딱따구리 기사 ════ 송곳 부리로 쉴 새 없이 쪼는 연타 (네 번), 끝에 세게 한 번
register("lc_woodpecker", {
  ...X.pxWoodpecker, speed: 80, sight: 230, atkMul: 1,
  *brain(e, A) {
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 20 });
        continue;
      }
      yield* notice(e, A, { anim: "wind", sound: "warn" });
      if (near(A, 40, 24) && ready(e, "flurry")) {
        A.face(), A.stop(1);
        A.tele(0.4);
        yield A.once("wind");
        A.play("atk");
        for (let k = 0; k < 5; k++) {
          e.body.vx = e.facing * 50;
          A.melee(26, 16, k === 4 ? 0.9 : 0.35, { knock: k === 4 ? 1.2 : 0.15 }) && A.burst("chunk", 22, -14, 2, 0x7a5434);
          A.sound("punch", 0.25);
          yield 0.11;
        }
        yield A.once("rec");
        cool(e, "flurry", 1.6, 2.4);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 30 });
    }
  },
});

// ════ [정예] 고목 수호 정령 ════ 가지 팔 내려치기(넓게) · 발밑 뿌리 솟구치기(셋, 예고 뒤) · 잎 폭풍(사방으로 잎 + 밀어냄)
register("lc_guardian", {
  ...X.pxGuardian, speed: 34, sight: 300, atkMul: 1.7, heavy: 1,
  *brain(e, A) {
    cool(e, "roots", 2, 3), cool(e, "storm", 5, 6);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 10, range: 30 });
        continue;
      }
      yield* notice(e, A, { anim: "roots", sound: "bossRoar", vol: 0.3 });
      const d = Math.abs(A.dx);
      if (ready(e, "storm") && d < 200) {
        A.stop(1);
        A.tele(0.6);
        A.play("storm");
        A.sound("magic", 0.6);
        for (let t = 0, k = 0; t < 2; t += DT) {
          if (t > k * 0.25) {
            k++;
            for (let j = 0; j < 3; j++) A.shoot({ sprite: "p_thorn", speed: 180, life: 1.4, radius: 4 }, e.cx, e.cy - 10, k * 0.9 + j * 2.1, 0.4, { el: "wind", opts: { scale: 0.8 } });
          }
          Math.abs(A.dx) < 160 && (A.p.body.vx += Math.sign(A.dx) * 300 * DT);
          yield 0;
        }
        cool(e, "storm", 7, 9);
        continue;
      }
      if (ready(e, "roots") && d < 260) {
        A.face(), A.stop(1);
        yield A.once("roots") * 0.5;
        for (let k = 0; k < 3; k++) {
          const x = A.p.cx + (A.p.body.vx ?? 0) * 0.2, gy = groundY(e, x);
          A.tele(0.45, { bar: [x, 34] });
          yield 0.45;
          e.host.fx.burst("chunk", x, gy - 6, 8, 0x5a3e28);
          e.host.fx.anim("ring", x, gy - 4, { scale: 1.2, tint: 0xc8f090 });
          A.sound("punch", 0.5);
          e.playerInRect(x - 14, gy - 40, 28, 40) && (e.hit(1, !0, "earth", void 0, 0.4), (A.p.body.vy = -420));
          yield 0.2;
        }
        cool(e, "roots", 4.5, 6);
        continue;
      }
      if (near(A, 80, 50) && ready(e, "whip")) {
        yield* slam(e, A, { r: 64, fwd: 30, mult: 1.5, tele: 0.65, shake: 3, chunk: 0x6a4a30, tint: 0xd8f0a0 });
        cool(e, "whip", 2, 3);
        continue;
      }
      yield* approach(e, A, { lo: 30, hi: 60 });
    }
  },
});
