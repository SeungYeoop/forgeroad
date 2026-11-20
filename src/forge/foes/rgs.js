// 그린스텝 몬스터 12종 행동 (그림은 px_gs.js). 하늘 입문 지역이라 공격 예고를 넉넉히
import { register } from "./core.js";
import * as X from "./px_gs.js";
import { DT, POIS, CHILL, STUN, hop, near, dirTo, ready, cool, land, wander, hover, notice, approach, melee, slam, lob, shoot, dive, charge, summon, groundY } from "./bkit.js";

// ════ 솜털 구름양 ════ 풀을 뜯다 알아채면 솜털을 부풀렸다 들이받아 민다
register("gs_sheep", {
  ...X.pxSheep, speed: 60, sight: 200, atkMul: 0.7,
  *brain(e, A) {
    cool(e, "butt", 0.8, 1.6);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 16, range: 50 });
        continue;
      }
      yield* notice(e, A, { anim: "wind", sound: "warn", vol: 0.25 });
      if (A.ground && ready(e, "butt") && Math.abs(A.dx) < 130 && Math.abs(A.dy) < 24) {
        yield* charge(e, A, { tele: 0.6, v: 190, dur: 0.7, mult: 0.8, knock: 1.8, fw: 20, fh: 16, stun: !1, stopOnHit: !0, dust: 0xf0ecf4 });
        e.host.fx.burst("glow", e.cx, e.cy, 6, 0xffffff);
        cool(e, "butt", 1.8, 2.8);
        continue;
      }
      yield* approach(e, A, { lo: 40, hi: 80 });
    }
  },
});

// ════ 풀섬 토끼 ════ 깡충깡충 다가와 몸을 돌려 뒷발로 걷어찬다. 겁나면 높이 뛰어 달아난다
register("gs_rabbit", {
  ...X.pxRabbit, speed: 100, sight: 220, atkMul: 0.7,
  *brain(e, A) {
    const M = e.fz.mem;
    for (;;) {
      if (!e.aggro) {
        A.play("idle"), A.stop(1);
        Math.random() < 0.012 && A.ground && (A.play("hop"), hop(e, Math.random() < 0.5 ? -1 : 1, 70, 200), yield* land(e, A));
        yield 0.05;
        continue;
      }
      if (!M.fled && e.hp < e.maxHp * 0.4 && A.ground) {
        M.fled = 1;
        A.play("hop");
        hop(e, -dirTo(A), 220, 460);
        yield* land(e, A);
        continue;
      }
      if (near(A, 34, 20) && ready(e, "kick")) {
        // 등을 돌리고 뒷발 차기
        e.facing = -dirTo(A);
        A.tele(0.35);
        yield A.once("wind");
        A.once("atk");
        A.sound("punch", 0.4);
        yield 0.08;
        e.playerInRect(e.cx - (e.facing > 0 ? 30 : 0), e.body.y - 18, 30, 18) && e.hit(0.9, !0, "phys", void 0, 1.6);
        yield A.once("rec");
        cool(e, "kick", 1, 1.6);
        continue;
      }
      if (A.ground && Math.abs(A.dx) > 24) {
        A.play("hop");
        hop(e, dirTo(A), 120, 220);
        yield* land(e, A);
        yield 0.1;
        continue;
      }
      A.play("idle"), A.face();
      yield 0;
    }
  },
});

// ════ 새싹 정령 ════ 땅에 뿌리박고(움직이지 않는다) 씨앗을 세 발씩 쏜다
register("gs_sprout", {
  ...X.pxSprout, speed: 0, sight: 240, atkMul: 0.6, heavy: 1,
  *brain(e, A) {
    cool(e, "seed", 0.6, 1.4);
    for (;;) {
      A.stop(1);
      if (e.aggro && ready(e, "seed") && Math.abs(A.dx) < 230 && Math.abs(A.dy) < 100) {
        yield* shoot(e, A, { sprite: "p_thorn", n: 3, spread: 0.22, speed: 190, mult: 0.55, el: "earth", ox: 4, oy: 22, tele: 0.45, sound: "shoot", scale: 0.7 });
        cool(e, "seed", 2, 3);
        continue;
      }
      A.play("idle"), e.aggro && A.face();
      yield 0.05;
    }
  },
});

// ════ [정예] 숫양 대장 ════ 앞발을 두 번 구르고 길게 돌진 · 가까우면 뿔로 걷어 올린다 · 구름양을 불러 모은다
register("gs_ram", {
  ...X.pxRam, speed: 70, sight: 280, atkMul: 1.5, heavy: 0.8,
  *brain(e, A) {
    cool(e, "charge", 1, 2), cool(e, "call", 3, 5);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 18, range: 60 });
        continue;
      }
      yield* notice(e, A, { anim: "wind", sound: "bossRoar", vol: 0.3 });
      if (ready(e, "call")) {
        const did = yield* summon(e, A, { id: "gs_sheep", n: 2, max: 2, anim: "wind", col: 0xffffff, dx: 34 });
        cool(e, "call", did ? 10 : 3, did ? 13 : 4);
        continue;
      }
      if (near(A, 44, 26) && ready(e, "toss")) {
        A.face(), A.tele(0.4);
        yield 0.3;
        A.once("toss");
        A.sound("punch", 0.6);
        if (e.playerInRect(e.cx + (e.facing > 0 ? 0 : -40), e.body.y - 30, 40, 30)) (e.hit(1.1, !0, "phys", void 0, 0.6), (A.p.body.vy = -520), (A.p.body.vx = e.facing * 160));
        yield 0.4;
        cool(e, "toss", 1.6, 2.4);
        continue;
      }
      if (A.ground && ready(e, "charge") && Math.abs(A.dx) < 260 && Math.abs(A.dy) < 30) {
        yield* charge(e, A, { tele: 0.75, v: 300, dur: 1.4, mult: 1.3, knock: 2.4, fw: 28, fh: 24, stunT: 1.6 });
        cool(e, "charge", 2.6, 3.6);
        continue;
      }
      yield* approach(e, A, { lo: 50, hi: 90 });
    }
  },
});

// ════ 참새 떼 ════ 우르르 몰려와 번갈아 쪼고 흩어진다
register("gs_sparrow", {
  ...X.pxSparrows, speed: 130, sight: 240, atkMul: 0.6,
  *brain(e, A) {
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 40, speed: 40 });
        continue;
      }
      if (ready(e, "peck") && Math.abs(A.dx) < 160) {
        for (let k = 0; k < 2; k++) yield* dive(e, A, { tele: k ? 0.15 : 0.35, v: 320, dur: 0.35, mult: 0.5, fw: 18, fh: 16, recK: 0.4 });
        cool(e, "peck", 1.8, 2.8);
        continue;
      }
      yield* approach(e, A, { keep: 70, alt: 50 });
    }
  },
});

// ════ 꽃 해파리 ════ 둥실둥실 떠다니다 꽃가루 침을 아래로 흩뿌린다 (중독)
register("gs_jelly", {
  ...X.pxJelly, speed: 45, sight: 240, atkMul: 0.7,
  *brain(e, A) {
    cool(e, "pollen", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 26, ry: 12, speed: 18 });
        continue;
      }
      if (ready(e, "pollen") && Math.abs(A.dx) < 180) {
        yield* shoot(e, A, { sprite: "p_thorn", n: 4, spread: 0.28, speed: 150, mult: 0.45, el: "poison", st: POIS(0.1, 2.5), ox: 0, oy: -4, tele: 0.5, sound: "magic", scale: 0.6 });
        cool(e, "pollen", 2.4, 3.4);
        continue;
      }
      yield* approach(e, A, { keep: 60, alt: 80 });
    }
  },
});

// ════ 민들레 기사 ════ 민들레 창을 겨누고 찌른다. 홀씨를 타고 날아올라 내려찍는다
register("gs_knight", {
  ...X.pxKnight, speed: 85, sight: 230, atkMul: 0.9,
  *brain(e, A) {
    cool(e, "float", 2, 4);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 24 });
        continue;
      }
      yield* notice(e, A, { anim: "wind", jump: 160 });
      if (near(A, 60, 20) && ready(e, "thrust")) {
        yield* melee(e, A, { tele: 0.4, dash: 200, fw: 34, fh: 12, up: 6, mult: 0.9, knock: 0.9, fx: "slash", tint: 0xfff080, fxX: 18, fxY: -16 });
        cool(e, "thrust", 1.1, 1.7);
        continue;
      }
      if (A.ground && ready(e, "float") && Math.abs(A.dx) < 200) {
        A.face();
        A.play("float");
        hop(e, dirTo(A), Math.min(140, Math.abs(A.dx)), 420);
        A.sound("jump", 0.4);
        // 천천히 떠 오르다 플레이어 위에서 내려찍기
        for (let t = 0; t < 1.6; t += DT) {
          e.body.vy = Math.min(e.body.vy, 50);
          e.body.vx += (Math.sign(A.dx) * 140 - e.body.vx) * 0.05;
          if (t > 0.5 && Math.abs(A.dx) < 16 && A.dy > 10) break;
          yield 0;
        }
        A.tele(0.2, { bar: [e.cx, 30] });
        yield 0.2;
        A.once("atk");
        e.body.vy = 460, e.body.vx = 0;
        let hit = !1;
        for (let t = 0; t < 1 && !A.ground; t += DT) {
          !hit && e.playerInRect(e.cx - 10, e.body.y - 6, 20, 30) && ((hit = !0), e.hit(1.2, !0, "wind", void 0, 0.8));
          yield 0;
        }
        A.burst("dust", 0, -1, 6, 0xf8f8f0);
        yield A.once("rec");
        cool(e, "float", 4, 6);
        continue;
      }
      yield* approach(e, A, { lo: 30, hi: 50 });
    }
  },
});

// ════ [정예] 거대 무당벌레 ════ 딱지를 펴고 날아올라 몸통 박치기 · 딱지 닫고 웅크려 막기(맞을 때) · 굴러 돌진
register("gs_ladybug", {
  ...X.pxLadybug, speed: 70, sight: 270, atkMul: 1.4, heavy: 0.7,
  damage(e, dmg) {
    return e.fz?.mem.guard ? dmg * 0.25 : dmg;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    cool(e, "slam", 1.5, 2.5), cool(e, "roll", 2, 3);
    for (;;) {
      if (!e.aggro) {
        M.guard = 0;
        yield* wander(e, A, { speed: 16, range: 50 });
        continue;
      }
      yield* notice(e, A, { anim: "wind", sound: "buff" });
      if (e.sinceHit < 0.25 && ready(e, "guard")) {
        M.guard = 1;
        A.play("guard"), A.stop(1);
        A.sound("block", 0.5);
        yield 1.2;
        M.guard = 0;
        cool(e, "guard", 4, 5);
        continue;
      }
      if (A.ground && ready(e, "slam") && Math.abs(A.dx) < 220) {
        A.face();
        A.tele(0.5);
        yield A.once("wind");
        A.play("fly");
        hop(e, dirTo(A), Math.min(260, Math.abs(A.dx) * 1.4), 420);
        A.sound("dash", 0.5);
        let hit = !1;
        for (let t = 0; t < 1.5 && !(t > 0.15 && A.ground); t += DT) {
          !hit && A.melee(30, 26, 1.2, { knock: 1.6 }) && ((hit = !0), A.shake(1.5));
          yield 0;
        }
        A.burst("dust", 0, -1, 8, 0xd8c0a0);
        yield A.once("rec");
        cool(e, "slam", 3, 4);
        continue;
      }
      if (A.ground && ready(e, "roll") && Math.abs(A.dx) < 200 && Math.abs(A.dy) < 30) {
        M.guard = 1;
        yield* charge(e, A, { wind: "guard", run: "guard", tele: 0.55, v: 230, dur: 1.1, mult: 1.1, knock: 1.6, fw: 26, fh: 20, stunT: 1.2, stunAnim: "hurt" });
        M.guard = 0;
        cool(e, "roll", 3.5, 4.5);
        continue;
      }
      yield* approach(e, A, { lo: 40, hi: 80 });
    }
  },
});

// ════ 하늘 매 ════ 높이 맴돌다 날개를 접고 날카롭게 내리꽂힌다
register("gs_hawk", {
  ...X.pxHawk, speed: 140, sight: 320, atkMul: 1,
  *brain(e, A) {
    cool(e, "stoop", 1.5, 2.5);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 90, ry: 14, speed: 60 });
        continue;
      }
      if (ready(e, "stoop") && Math.abs(A.dx) < 200) {
        yield* dive(e, A, { tele: 0.4, v: 470, dur: 0.55, mult: 1, fw: 18, fh: 16, sound: "dash" });
        cool(e, "stoop", 2.2, 3.2);
        continue;
      }
      yield* approach(e, A, { keep: 130, alt: 130 });
    }
  },
});

// ════ 비구름 정령 ════ 머리 위로 따라와 비를 뿌린다 (그 아래에선 느려짐). 가끔 작은 번개가 떨어진다
register("gs_raincloud", {
  ...X.pxRainCloud, speed: 60, sight: 280, atkMul: 0.7,
  *brain(e, A) {
    cool(e, "rain", 1, 2), cool(e, "zap", 3, 4);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 50, speed: 25 });
        continue;
      }
      const p = A.p;
      A.flyTo(p.cx, p.body.y - 96, e.speed);
      if (ready(e, "zap") && Math.abs(A.dx) < 20) {
        A.tele(0.45, { bar: [e.cx, 30] });
        yield A.once("zap");
        A.sound("explosion", 0.3);
        e.host.fx.burst("spark", e.cx, groundY(e, e.cx) - 6, 10, 0xfff070);
        e.playerInRect(e.cx - 14, e.body.y, 28, 140) && e.hit(0.8, !1, "lightning", STUN(0.3), 0.3);
        cool(e, "zap", 4, 6);
        continue;
      }
      if (ready(e, "rain")) {
        A.play("atk");
        const gy = groundY(e, e.cx);
        A.zone(e.cx, gy, 60, 2.4, 0.03, { el: "ice", st: CHILL(0.4, 1.2), kind: "ice" });
        cool(e, "rain", 2.6, 3.4);
      } else A.play("idle");
      yield 0;
    }
  },
});

// ════ 바람개비 요정 ════ 거리를 두고 바람개비를 힘껏 돌려 돌풍을 일으킨다 (멀리 밀려남 · 섬 밖으로 조심)
register("gs_pinwheel", {
  ...X.pxPinwheel, speed: 70, sight: 260, atkMul: 0.6,
  *brain(e, A) {
    cool(e, "gust", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 40, speed: 30 });
        continue;
      }
      if (ready(e, "gust") && Math.abs(A.dx) < 200 && Math.abs(A.dy) < 70) {
        A.face();
        A.tele(0.5);
        yield A.once("wind");
        A.play("atk");
        A.sound("dash", 0.5);
        for (let t = 0; t < 0.9; t += DT) {
          if (Math.abs(A.dx) < 220 && Math.abs(A.dy) < 80 && Math.sign(A.dx) === e.facing) A.p.body.vx += e.facing * 820 * DT;
          Math.random() < 0.5 && e.host.fx.burst("dust", e.cx + e.facing * (20 + Math.random() * 120), e.cy + (Math.random() - 0.5) * 30, 1, 0xe8f8ff);
          yield 0;
        }
        yield A.once("rec");
        cool(e, "gust", 3, 4.5);
        continue;
      }
      yield* approach(e, A, { keep: 110, alt: 30 });
    }
  },
});

// ════ [정예] 구름 고래 새끼 ════ 하늘을 헤엄치다 몸통 박치기 · 숨구멍 물줄기(물방울 셋, 느려짐) · 가까우면 꼬리 내리치기
register("gs_whale", {
  ...X.pxWhale, speed: 80, sight: 320, atkMul: 1.5,
  *brain(e, A) {
    cool(e, "spout", 1.5, 2.5), cool(e, "ram", 3, 4);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 80, ry: 12, speed: 30 });
        continue;
      }
      yield* notice(e, A, { anim: "spout", sound: "blub" });
      if (ready(e, "spout") && Math.abs(A.dx) < 260) {
        yield* lob(e, A, { wind: "wind", atk: "spout", release: 0.2, sprite: "sl_glob", g: 380, ox: 8, oy: 40, n: 3, spread: 60, mult: 0.6, el: "ice", st: CHILL(0.4, 1.6), scale: 1.3, tele: 0.45, sound: "blub", lead: 0.1 });
        cool(e, "spout", 3, 4);
        continue;
      }
      if (ready(e, "ram") && Math.abs(A.dx) < 240) {
        yield* dive(e, A, { tele: 0.55, v: 300, dur: 0.7, mult: 1.3, fw: 40, fh: 30, ty: 0, knock: 1.8 });
        cool(e, "ram", 3.5, 5);
        continue;
      }
      if (near(A, 70, 50) && ready(e, "tail")) {
        A.tele(0.4);
        yield A.once("tail") * 0.5;
        A.sound("splat", 0.6);
        e.playerInRect(e.cx - 70, e.body.y - 30, 140, 50) && e.hit(1.1, !0, "phys", void 0, 1.8);
        yield 0.3;
        cool(e, "tail", 2.2, 3);
        continue;
      }
      yield* approach(e, A, { keep: 110, alt: 70 });
    }
  },
});
