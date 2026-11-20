// 그래스메어 추가 4종 행동: 하늘 염소 · [정예] 말벌 여왕 · 고블린 주술사 · 굴파기 두더지 (그림은 pgm3.js)
import { register } from "./core.js";
import { pxGoat, pxQueen, pxShaman, pxMole } from "./pgm3.js";
import { DT, POIS, BURN, hop, dirTo, ready, cool, land, wander, hover, notice, approach, melee, lob, shoot, dive, charge, summon, groundY } from "./bkit.js";

// ════ 하늘 염소 ════ 턱에서 턱으로 뛰어오르고, 섬 가장자리에서 뿔을 낮추고 들이받아 밀어낸다 (넉백 아주 큼)
register("gm_goat", {
  ...pxGoat, speed: 95, sight: 260, atkMul: 1.1,
  *brain(e, A) {
    const M = e.fz.mem;
    cool(e, "ram", 0.8, 1.4);
    for (;;) {
      if (!e.aggro) {
        Math.random() < 0.004 && (M.lookT = 2);
        yield* wander(e, A, { speed: 26, idle: M.chew ? "chew" : "idle" });
        Math.random() < 0.003 && (M.chew = !M.chew);
        continue;
      }
      yield* notice(e, A, { anim: "wind", sound: "warn" });
      const d = Math.abs(A.dx);
      // 플레이어가 높은 턱 위: 펄쩍 뛰어오른다
      if (A.ground && A.dy < -40 && d < 120 && ready(e, "leap")) {
        A.face();
        yield A.once("leap") * 0.3;
        hop(e, dirTo(A), Math.min(220, d * 2.2), 520);
        A.sound("jump", 0.4);
        yield* land(e, A);
        A.burst("dust", 0, -1, 4, 0xd8d0c0);
        cool(e, "leap", 1.2, 2);
        continue;
      }
      // 들이받기: 뿔을 낮추고 짧게 돌진 (아주 멀리 날려 보낸다)
      if (A.ground && d < 150 && Math.abs(A.dy) < 30 && ready(e, "ram")) {
        yield* charge(e, A, { tele: 0.55, v: 250, dur: 0.75, mult: 1.1, knock: 2.6, fw: 24, fh: 20, stun: !1, stopOnHit: !0, dust: 0xe0d8c8 });
        cool(e, "ram", 1.6, 2.4);
        continue;
      }
      yield* approach(e, A, { lo: 40, hi: 70 });
    }
  },
});

// ════ [정예] 말벌 여왕 ════ 공중에서 말벌을 불러내고, 독침을 부채꼴로 쏟아붓는다. 체력이 줄면 급강하 찌르기가 잦아진다
register("gm_queen", {
  ...pxQueen, speed: 110, sight: 320, atkMul: 1.5,
  *brain(e, A) {
    cool(e, "call", 1.5, 2.5), cool(e, "volley", 2.5, 3.5), cool(e, "dive", 3, 4);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 60 });
        continue;
      }
      yield* notice(e, A, { anim: "call", sound: "bossRoar", vol: 0.25 });
      const rage = e.hp < e.maxHp * 0.5;
      if (ready(e, "call")) {
        const did = yield* summon(e, A, { id: "gm_wasp", n: 2, max: rage ? 4 : 3, anim: "call", col: 0xffd040, dy: 10 });
        cool(e, "call", did ? 7 : 2, did ? 9 : 3);
        continue;
      }
      if (ready(e, "volley") && Math.abs(A.dx) < 260) {
        yield* shoot(e, A, { wind: "wind", atk: "volley", rec: "rec", sprite: "p_thorn", n: rage ? 7 : 5, spread: 0.2, speed: 230, mult: 0.55, st: POIS(0.12, 2.5), ox: -6, oy: 4, tele: 0.45, sound: "shoot" });
        cool(e, "volley", rage ? 2.2 : 3.2, rage ? 3 : 4.2);
        continue;
      }
      if (ready(e, "dive") && Math.abs(A.dx) < 200) {
        yield* dive(e, A, { v: 380, mult: 1.3, st: POIS(0.2, 3), fw: 22, fh: 22 });
        cool(e, "dive", rage ? 1.6 : 3.2, rage ? 2.4 : 4.5);
        continue;
      }
      yield* approach(e, A, { keep: 110, alt: 95 });
    }
  },
});

// ════ 고블린 주술사 ════ 무리 뒤에 숨어 불덩이를 던지고(맞은 자리에 불길), 가끔 북을 쳐 주변 고블린을 빠르게 한다. 붙으면 물러난다
register("gm_shaman", {
  ...pxShaman, speed: 80, sight: 280, atkMul: 0.9,
  *brain(e, A) {
    cool(e, "fire", 0.8, 1.6), cool(e, "drum", 2, 4);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 20 });
        continue;
      }
      yield* notice(e, A, { anim: "drum", sound: "magic" });
      const d = Math.abs(A.dx);
      // 북: 반경 150 안 고블린(자기 빼고) 5초 동안 빠르게
      if (ready(e, "drum")) {
        const pals = e.host.enemies.filter((q) => q !== e && !q.dead && /goblin|shaman/.test(q.def.id) && Math.hypot(q.cx - e.cx, q.cy - e.cy) < 150);
        if (pals.length) {
          A.face(), A.stop(1);
          yield A.once("drum");
          A.sound("buff", 0.5);
          e.host.fx.anim("ring", e.cx, e.body.y - 10, { scale: 2.2, tint: 0xffb040 });
          for (const q of pals) (q._rallyT = 5), e.host.fx.burst("glow", q.cx, q.cy, 8, 0xffb040);
          cool(e, "drum", 8, 11);
          continue;
        }
        cool(e, "drum", 2, 3);
      }
      // 너무 붙으면 뒤로 물러난다
      if (d < 70 && A.ground) {
        A.play("move"), A.walk(-dirTo(A), e.speed * 1.1);
        yield 0;
        continue;
      }
      if (d < 280 && Math.abs(A.dy) < 140 && ready(e, "fire")) {
        yield* lob(e, A, {
          sprite: "p_fire", g: 420, ox: 8, oy: 22, mult: 0.75, el: "fire", st: BURN(0.12, 2), tele: 0.4, scale: 1, sound: "magic",
          onDone: (pr) => {
            const gy = groundY(e, pr.x);
            e.host.fx.burst("glow", pr.x, gy - 4, 10, 0xff8a2a);
            !e.dead && A.zone(pr.x, gy, 30, 2.2, 0.12, { el: "fire", kind: "fire" });
          },
        });
        cool(e, "fire", 2.2, 3);
        continue;
      }
      yield* approach(e, A, { lo: 110, hi: 200 });
    }
  },
});

// ════ 굴파기 두더지 ════ 땅속(흙 둔덕)으로 파고들어 발밑으로 다가와 솟구치며 할퀸다. 땅 위에선 흙을 뿌려 시야를 가리고 발톱질
register("gm_mole", {
  ...pxMole, speed: 70, sight: 230, atkMul: 1,
  damage(e, dmg) {
    return e.fz?.mem.under ? dmg * 0.2 : dmg;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    cool(e, "dig", 1, 2), cool(e, "dirt", 1.5, 3);
    for (;;) {
      if (!e.aggro) {
        M.under = 0;
        yield* wander(e, A, { speed: 18 });
        continue;
      }
      yield* notice(e, A, { anim: "wind", sound: "warn" });
      const d = Math.abs(A.dx);
      // 땅속으로 → 발밑까지 → 솟구치기
      if (A.ground && ready(e, "dig") && d > 50) {
        A.stop(1);
        yield A.once("burrow");
        M.under = 1;
        A.sound("thud", 0.3);
        for (let t = 0; t < 2.4 && Math.abs(A.dx) > 10; t += DT) {
          A.play("under");
          A.walk(dirTo(A), e.speed * 1.5, { climb: !1 });
          Math.random() < 0.2 && A.burst("dust", 0, -1, 1, 0x8a6a40);
          yield 0;
        }
        A.stop(1);
        A.tele(0.35, { bar: [e.cx, 40] });
        yield 0.35;
        M.under = 0;
        A.once("rise");
        e.body.vy = -260;
        A.sound("punch", 0.5);
        e.host.fx.burst("chunk", e.cx, e.body.y - 4, 8, 0x7a5a3a);
        let hit = !1;
        for (let t = 0; t < 0.3; t += DT) {
          !hit && e.playerInRect(e.cx - 18, e.body.y - 30, 36, 30) && ((hit = !0), e.hit(1.15, !0, "earth", void 0, 1.2));
          yield 0;
        }
        yield* land(e, A);
        cool(e, "dig", 3, 4.5);
        continue;
      }
      // 흙 뿌리기 (맞은 자리 가까이 있으면 잠깐 시야가 좁아진다)
      if (d < 160 && d > 50 && ready(e, "dirt")) {
        yield* lob(e, A, { wind: "dirt", atk: "dirt", sprite: "p_rock", g: 500, ox: 10, oy: 8, n: 3, spread: 40, mult: 0.35, scale: 0.7, tele: 0.25, sound: "swing", chunkC: 0x7a5a3a, onDone: (pr) => (e.host.fx.burst("dust", pr.x, pr.y, 4, 0x8a6a40), Math.hypot(A.p.cx - pr.x, A.p.body.y - pr.y) < 30 && A.blind(1)) });
        cool(e, "dirt", 3, 4.5);
        continue;
      }
      if (d < 40 && Math.abs(A.dy) < 24 && ready(e, "claw")) {
        yield* melee(e, A, { tele: 0.3, dash: 140, fw: 20, fh: 16, mult: 1, knock: 0.8, fx: "slash", tint: 0xe8d8c0 });
        cool(e, "claw", 0.9, 1.5);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 34 });
    }
  },
});
