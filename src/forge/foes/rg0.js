// 그래스메어 몬스터 행동 (그림은 mg0.js). 정통 RPG 들판의 적 — 세기가 천차만별:
//   슬라임(아주 약함) · 맨드레이크(약함, 비명으로 굳게 함) · 고블린(약함, 빠름) · 말벌(보통, 독) · 늑대(보통, 무리)
//   · 멧돼지(강함, 돌진) · [정예] 오우거(매우 강함) · [정예] 켄타우로스(매우 강함, 원거리)
import { register } from "./core.js";
import { pxSlime, pxSlimeMini } from "./pg0.js";
import { slimeFx, splash, puddle, groundBelow } from "./slimefx.js";
import { pxGoblin } from "./pgob.js";
import { plainsWolf, tuskBoar, giantWasp, mandrake, meadowOgre, centaur } from "./mg0.js";

const DT = 1 / 60;
const POIS = (p = 0.15, d = 3) => ({ type: "poison", chance: 1, dur: d, power: p });
const SLIME = 0x7ae060;
// 땅 위에서 통 튀어 오르기 (방향, 가로 속도, 세로 속도)
const hop = (e, dir, vx, vy) => ((e.body.vy = -vy), (e.body.vx = dir * vx), (e.facing = dir));
const near = (e, A, w, h) => Math.abs(A.dx) < w && Math.abs(A.dy) < h;

// ════ 풀잎 슬라임 ════ 통통 튀어 다가와 덮친다. 큰 것은 산성 덩이를 뱉고(맞은 자리엔 끈적한 웅덩이 = 느려짐),
//   덮치고 착지하면 주변이 출렁 철퍽. 체력이 줄면 더 빨라지고, 큰 것은 터지면 작은 슬라임 둘로 갈라진다
//   한 번 뛸 때: 웅크림(예비) → 공중(늘어남, 방울 뚝뚝) → 착지(납작 출렁 + 방울 튐)
function slimeBrain(mini) {
  const S = mini ? 0.62 : 1;
  return function* (e, A) {
    const M = e.fz.mem, host = e.host;
    const rage = () => e.hp < e.maxHp * 0.4;
    const now = () => e.life;
    M.atkT = now() + 0.6 + Math.random() * 0.6;
    M.spitT = now() + 0.4 + Math.random() * 0.8;
    e.opts?.summoned && (M.seen = 1); // 갈라져 나온 것은 바로 덤빈다
    // 한 번 뛰기 (o.atk: 덮치기 자세 · o.skip: 웅크림 생략 · o.during: 공중에서 매 프레임 · o.land: 착지 순간)
    function* jump(dir, vx, vy, o = {}) {
      A.face(dir);
      if (!o.skip) {
        A.stop(1);
        yield A.once("crouch", rage() ? 26 : void 0);
      }
      if (!A.ground) return;
      hop(e, dir, vx, vy);
      A.play(o.atk ? "atk" : "air");
      splash(host, e.cx, e.body.y, Math.round(2 + 2 * S));
      A.sound("jump", 0.25 * S);
      yield 0.06;
      for (let t = 0; !A.ground && t < 2.5; t += DT) {
        o.during && o.during();
        yield 0;
      }
      // 착지: 납작 → 출렁
      A.once("land");
      splash(host, e.cx, e.body.y, Math.round(3 + 4 * S), { dust: Math.round(2 + 3 * S) });
      A.sound("splat", 0.35 * S);
      o.land && o.land();
      A.stop(0.85);
      yield o.wait ?? 0.14;
    }
    for (;;) {
      // ── 평소: 숨쉬며 가끔 어슬렁 한 번 ──
      if (!e.aggro) {
        A.play("idle");
        A.stop(0.15);
        if (A.ground && Math.random() < 0.005) yield* jump(Math.random() < 0.5 ? -1 : 1, 35, 150, { wait: 0.3 });
        yield 0;
        continue;
      }
      // ── 처음 알아챔: 눈을 부릅뜨고 제자리에서 움찔 뛴다 ──
      if (!M.seen) {
        M.seen = 1;
        A.face(), A.stop(1);
        A.once("alert");
        yield 0.08;
        A.ground && hop(e, e.facing, 0, 150 * (mini ? 0.9 : 1));
        A.sound("blub", 0.3);
        yield 0.06;
        for (let t = 0; !A.ground && t < 1.5; t += DT) yield 0;
        splash(host, e.cx, e.body.y, 3);
        yield 0.28;
        continue;
      }
      if (!A.ground) {
        A.play("air");
        yield 0;
        continue;
      }
      const ax = Math.abs(A.dx), ay = Math.abs(A.dy), fast = rage() ? 1.35 : 1;
      // ── 덮치기: 몸을 바짝 웅크렸다가 앞으로 날아들고, 착지하면 양옆으로 철퍽 ──
      if (ax < (mini ? 52 : 76) && ay < 40 && now() >= M.atkT) {
        A.face(), A.stop(1);
        A.tele(mini ? 0.25 : 0.34);
        yield A.once("wind");
        M.hit = 0;
        yield* jump(e.facing, (mini ? 185 : 235) * Math.min(1.2, fast), mini ? 205 : 245, {
          atk: 1,
          skip: 1,
          wait: 0.05,
          during: () => !M.hit && A.melee(mini ? 16 : 22, mini ? 14 : 20, 1, { knock: 0.7 }) && (M.hit = 1),
          land: () => {
            const R = mini ? 22 : 36;
            splash(host, e.cx, e.body.y, mini ? 6 : 12, { ring: mini ? 0.8 : 1.4, dust: mini ? 3 : 6, glow: mini ? 2 : 4 });
            A.shake(mini ? 0.6 : 1.4);
            A.sound("thud", 0.3 * S);
            !mini && puddle(host, e.cx, e.body.y, { scale: 0.9, dur: 1.6 });
            !M.hit && e.playerInRect(e.cx - R, e.body.y - 14, R * 2, 14) && ((M.hit = 1), e.hit(0.5, !0, void 0, void 0, 0.6));
          },
        });
        yield A.once("rec", rage() ? 18 : void 0);
        M.atkT = now() + (1.1 + Math.random() * 0.6) / fast;
        continue;
      }
      // ── 산성 뱉기 (큰 것만): 앞쪽이 부풀어 모았다가 퉤! → 포물선 → 맞은 자리에 끈적한 웅덩이 ──
      if (!mini && ax > 90 && ax < 230 && ay < 90 && now() >= M.spitT) {
        A.face(), A.stop(1);
        A.once("spit");
        A.sound("blub", 0.35);
        yield 4 / 14;
        const p = A.p, ox = e.cx + e.facing * 15, oy = e.body.y - 12;
        const tx = p.cx + (p.body.vx ?? 0) * 0.35, g = 520, T = Math.max(0.45, Math.min(0.85, Math.abs(tx - ox) / 220));
        const vx = (tx - ox) / T, vy = (p.body.y - 6 - oy - 0.5 * g * T * T) / T;
        splash(host, ox, oy, 2);
        A.shoot({ sprite: "sl_glob", speed: 0, gravity: g, life: 3, radius: 5, trail: 0x8ee048 }, ox, oy, Math.atan2(vy, vx), 0.6, {
          el: "poison",
          st: { type: "chill", chance: 1, dur: 1.5, power: 0.4 },
          opts: {
            vx, vy,
            onDone: (pr) => {
              const gy = groundBelow(host, pr.x, pr.y, 48);
              splash(host, pr.x, gy ?? pr.y, 8, { glow: 3 });
              A.sound("splat", 0.4);
              if (gy == null || e.dead) return;
              puddle(host, pr.x, gy, { scale: 1.1, dur: 3.2 });
              A.zone(pr.x, gy, 34, 3.2, 0.08, { el: "poison", st: { type: "chill", chance: 1, dur: 1.2, power: 0.4 }, kind: "slime" });
            },
          },
        });
        yield 2 / 14 + 0.25;
        M.spitT = now() + (2.8 + Math.random() * 1.6) / fast;
        M.atkT = Math.max(M.atkT, now() + 0.4);
        continue;
      }
      // ── 쫓아가기: 크고 작은 뜀을 섞어서 (가끔 크게 한 번) ──
      const big = Math.random() < 0.22, r = 0.85 + Math.random() * 0.3;
      yield* jump(Math.sign(A.dx) || 1, e.speed * fast * r * (big ? 1.25 : 1), (mini ? 185 : 220) * r * (big ? 1.3 : 1), { wait: (0.08 + Math.random() * 0.18) / fast });
    }
  };
}
const slimeArt = (spec) => ({
  ...spec,
  // 공중에 있을 때 방울이 뚝뚝
  tick(e, A, dt) {
    !e.body.onGround && Math.random() < dt * 7 && slimeFx(e.host).burst("sl_fine", e.cx + (Math.random() - 0.5) * 14 * (spec.fw / 64), e.body.y - 2, 1, 0xffffff);
  },
  // 맞으면 젤리가 튄다
  damage(e, dmg) {
    splash(e.host, e.cx, e.body.y - spec.h * 0.6, spec.fw > 50 ? 6 : 4);
    e.fA?.sound("splat", 0.3);
    return dmg;
  },
});
register("gm_slime", {
  atkMul: 0.7,
  ...slimeArt(pxSlime), speed: 70, sight: 200,
  brain: slimeBrain(!1),
  die(e, A) {
    const host = e.host, x = e.cx, y = e.body.y;
    splash(host, x, y - 8, 16, { ring: 1.6, dust: 6, glow: 8 });
    puddle(host, x, y, { scale: 1.2, dur: 5 });
    A.sound("splat", 0.6);
    if (e.opts.summoned) return;
    for (const d of [-1, 1]) {
      const z = host.spawnEnemy("gm_slime_mini", x + d * 10, y - 4, { summoned: !0, noGold: !0 });
      z && ((z.aggro = !0), (z.body.vx = d * 120), (z.body.vy = -200));
    }
  },
});
register("gm_slime_mini", {
  atkMul: 0.5, ...slimeArt(pxSlimeMini), speed: 85, sight: 220,
  brain: slimeBrain(!0),
  die(e, A) {
    splash(e.host, e.cx, e.body.y - 5, 9, { ring: 0.9, glow: 4 });
    puddle(e.host, e.cx, e.body.y, { scale: 0.6, dur: 3.5 });
    A.sound("splat", 0.4);
  },
});

// ════ 고블린 정찰병 ════ 약하고 날랜 정통 RPG 고블린. 혼자 어슬렁거리다 알아채면 펄쩍 뛰고,
//   멀면 돌팔매(가끔 두 번 연속), 가까우면 칼 젖혔다 돌진 찌르기 → 가끔 내려베기 연타 → 뒤로 깡충 빠지고 낄낄 비웃는다.
//   체력이 바닥나면 한 번 도망쳤다가 다시 돌을 던진다
const DUST = 0xc8c0a0;
register("gm_goblin", {
  atkMul: 0.9,
  ...pxGoblin, speed: 105, sight: 240,
  *brain(e, A) {
    const M = e.fz.mem, now = () => e.life;
    M.atkT = now() + 0.5;
    M.thT = now() + 0.8 + Math.random();
    M.dustT = 0;
    const puff = (n = 2) => A.burst("dust", -5, -1, n, DUST);
    // 착지할 때까지 기다리며 공중 자세 유지
    function* land() {
      yield 0.06;
      for (let t = 0; !A.ground && t < 2; t += DT) yield 0;
      puff(3);
      A.sound("land", 0.3);
    }
    for (;;) {
      // ── 평소: 어슬렁 걷다가 멈춰서 두리번 ──
      if (!e.aggro) {
        if (M.lookT > 0) {
          M.lookT -= DT;
          A.play("idle"), A.stop(0.3);
          Math.random() < 0.012 && (e.facing = -e.facing);
        } else {
          A.play("walk");
          A.walk(M.wd ?? 1, 32);
          Math.random() < 0.006 && (M.wd = -(M.wd ?? 1));
          Math.random() < 0.004 && (M.lookT = 1 + Math.random() * 1.5);
        }
        yield 0;
        continue;
      }
      // ── 처음 알아챔: 펄쩍 뛰며 놀라고, 가끔 낄낄 ──
      if (!M.seen) {
        M.seen = 1;
        A.face(), A.stop(1);
        A.once("alert");
        yield 1 / 12;
        A.ground && hop(e, e.facing, 0, 210);
        A.sound("jump", 0.4);
        yield* land();
        yield 0.15;
        if (Math.random() < 0.4) (A.play("laugh"), yield 0.6);
        continue;
      }
      const d = Math.abs(A.dx), ay = Math.abs(A.dy);
      // ── 체력이 바닥나면 한 번 도망 ──
      if (!M.fled && e.hp < e.maxHp * 0.35) {
        M.fled = 1;
        const dir = -Math.sign(A.dx) || 1;
        A.once("hop");
        A.ground && hop(e, dir, 200, 230);
        e.facing = -dir;
        yield* land();
        for (let t = 0; t < 0.9; t += DT) {
          A.play("move"), A.walk(dir, e.speed * 1.25);
          (M.dustT -= DT) <= 0 && ((M.dustT = 0.18), puff(1));
          yield 0;
        }
        M.thT = Math.min(M.thT, now() + 0.2);
        continue;
      }
      // ── 가까우면: 칼 젖혔다가 돌진 찌르기 (+ 가끔 내려베기 연타) → 뒤로 깡충 ──
      if (d < 54 && ay < 30 && now() >= M.atkT && A.ground) {
        A.face(), A.stop(1);
        A.tele(0.28);
        yield A.once("wind");
        A.once("atk");
        e.body.vx = e.facing * 260;
        puff(3);
        A.sound("swing", 0.6);
        let hit = !1;
        for (let t = 0; t < 0.2; t += DT) {
          !hit && A.melee(26, 22, 1, { knock: 0.8 }) && ((hit = !0), A.burst("spark", 18, -16, 6, 0xfff0c0));
          yield 0;
        }
        A.fxSlash(14, -16, 0.7, 0xf0f0e0);
        A.stop(0.6);
        if (Math.random() < 0.4) {
          // 연타: 칼을 머리 위로 → 내려베기
          A.face();
          yield A.once("wind2");
          A.once("atk2");
          e.body.vx = e.facing * 150;
          A.sound("swing", 0.7);
          hit = !1;
          for (let t = 0; t < 0.16; t += DT) {
            !hit && A.melee(30, 30, 1.15, { knock: 1.1 }) && ((hit = !0), A.burst("spark", 18, -12, 8, 0xfff0c0), A.shake(1));
            yield 0;
          }
          A.fxHeavy(14, -14, 0.6, 0xf0f0e0);
          yield 0.12;
        }
        yield A.once("rec") * 0.6;
        // 뒤로 깡충 (얼굴은 플레이어 쪽)
        A.once("hop");
        A.ground && hop(e, -e.facing, 170, 240);
        e.facing = -e.facing;
        puff(2);
        yield* land();
        e.facing = A.dx > 0 ? 1 : -1;
        if (Math.random() < 0.35) (A.play("laugh"), yield 0.7);
        M.atkT = now() + 0.9 + Math.random() * 0.7;
        continue;
      }
      // ── 멀면: 돌팔매 (가끔 두 번) ──
      if (d > 110 && d < 300 && ay < 120 && now() >= M.thT && A.ground) {
        A.face(), A.stop(1);
        const n = Math.random() < 0.3 ? 2 : 1;
        for (let k = 0; k < n; k++) {
          k === 0 && A.tele(0.3);
          A.once("throw");
          yield 3 / 15;
          const p = A.p, ox = e.cx + e.facing * 4, oy = e.body.y - 26, g = 560;
          const tx = p.cx + (p.body.vx ?? 0) * 0.3 + (k ? (Math.random() - 0.5) * 30 : 0);
          const T = Math.max(0.5, Math.min(0.95, Math.abs(tx - ox) / 260));
          A.shoot({ sprite: "p_rock", speed: 0, gravity: g, life: 2.4, radius: 5 }, ox, oy, 0, 0.7, {
            el: "earth",
            opts: {
              vx: (tx - ox) / T, vy: (p.body.y - 10 - oy - 0.5 * g * T * T) / T, scale: 1.2,
              onDone: (pr) => (e.host.fx.burst("chunk", pr.x, pr.y, 4, 0x8a8478), e.host.fx.burst("dust", pr.x, pr.y, 2, DUST)),
            },
          });
          A.sound("swing", 0.45);
          yield 3 / 15 + (k < n - 1 ? 0.05 : 0.2);
        }
        M.thT = now() + 2.3 + Math.random();
        continue;
      }
      // ── 쫓기 / 너무 붙으면 살짝 물러남 ──
      if (d > 46) {
        A.play("move"), A.walk(Math.sign(A.dx), e.speed);
        (M.dustT -= DT) <= 0 && A.ground && ((M.dustT = 0.22), puff(1));
      } else if (d < 26) {
        A.play("walk"), A.walk(-Math.sign(A.dx) || 1, e.speed * 0.5), A.face();
      } else (A.play("idle"), A.stop(), A.face());
      yield 0;
    }
  },
});

// ════ 초원 회색늑대 ════ 처음 보면 울부짖어 근처 늑대를 깨운다. 거리를 두고 맴돌다 낮게 웅크려 덮친다
register("gm_wolf", {
  atkMul: 1.1,
  ...plainsWolf, speed: 150, sight: 260,
  *brain(e, A) {
    const M = e.fz.mem;
    M.cd = 0.8 + Math.random();
    M.side = Math.random() < 0.5 ? -1 : 1;
    for (;;) {
      M.cd -= DT;
      if (!e.aggro) {
        A.play("idle"), A.stop();
        yield 0.15;
        continue;
      }
      if (!M.howled) {
        M.howled = 1;
        A.stop(1), A.face();
        yield A.once("howl");
        A.sound("warn", 0.4);
        for (const o of e.host.enemies) o !== e && !o.dead && o.def.id === "gm_wolf" && Math.abs(o.cx - e.cx) < 360 && ((o.aggro = !0), o.fz && (o.fz.mem.howled = 1));
        yield 0.2;
      }
      const d = Math.abs(A.dx);
      if (d < 130 && Math.abs(A.dy) < 40 && M.cd <= 0 && A.ground) {
        // 덮치기: 낮게 웅크림(경고선) → 높이 뛰어 물기
        A.face(), A.stop(1);
        A.tele(0.4, { bar: [e.cx + e.facing * 70, 110] });
        yield A.once("wind");
        A.once("atk");
        hop(e, e.facing, 270, 250);
        A.sound("dash", 0.5);
        for (let t = 0; t < 0.5; t += DT) {
          if (A.melee(26, 22, 1.1, { knock: 1.2 })) {
            A.fxSlash(18, -14, 0.8, 0xffe0c0);
            break;
          }
          yield 0;
        }
        while (!A.ground) yield 0;
        yield A.once("rec");
        // 물고 뒤로 빠졌다가 다시 맴돈다
        A.play("move");
        for (let t = 0; t < 0.45; t += DT) (A.walk(-Math.sign(A.dx) || 1, e.speed), yield 0);
        M.cd = 1.4 + Math.random() * 0.8;
        M.side = -M.side;
        continue;
      }
      // 맴돌기: 플레이어 앞뒤 120px 언저리를 오가며 틈을 본다
      const want = A.p.cx + M.side * 115, dx = want - e.cx;
      if (Math.abs(dx) > 14) (A.play("move"), A.walk(Math.sign(dx), d > 220 ? e.speed : e.speed * 0.6));
      else (A.play("idle"), A.stop(), A.face(), Math.random() < 0.02 && (M.side = -M.side));
      yield 0;
    }
  },
});

// ════ 뿔멧돼지 ════ 앞발로 땅을 긁고(경고선) 일직선 돌진. 벽에 박으면 어지러워 피해를 1.5배 받는다
register("gm_boar", {
  atkMul: 1.5,
  ...tuskBoar, speed: 55, sight: 260, heavy: 1,
  damage(e, dmg) {
    return e.fz?.mem.dizzy ? dmg * 1.5 : dmg;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    M.cd = 1;
    for (;;) {
      M.cd -= DT;
      if (!e.aggro) {
        A.play("move", 6);
        A.walk(M.wd ?? 1, 20);
        Math.random() < 0.006 && (M.wd = -(M.wd ?? 1));
        yield 0;
        continue;
      }
      const d = Math.abs(A.dx);
      if (d < 280 && Math.abs(A.dy) < 40 && M.cd <= 0) {
        A.face(), A.stop(1);
        A.tele(0.8, { bar: [e.cx + e.facing * 140, 260] });
        yield A.once("scrape");
        yield A.once("scrape");
        A.play("charge");
        A.sound("dash", 0.7);
        const dir = e.facing;
        let wall = !1;
        for (let t = 0; t < 1.6; t += DT) {
          e.body.vx = dir * 310;
          e.facing = dir;
          Math.random() < 0.4 && A.burst("dust", -14, -2, 1, 0x8a7058);
          if (A.melee(26, 24, 1.5, { knock: 2.2 })) {
            A.shake(4);
            break;
          }
          if (e.body.hitWall) {
            wall = !0;
            break;
          }
          yield 0;
        }
        A.stop(1);
        if (wall) {
          // 벽에 박치기: 어지러움 (빈틈)
          A.shake(5);
          A.sound("thud", 1);
          A.burst("spark", 16, -14, 8, 0xfff080);
          M.dizzy = 1;
          A.play("stun");
          yield 1.8;
          M.dizzy = 0;
        } else {
          A.play("idle");
          yield 0.7;
        }
        M.cd = 2.2 + Math.random();
        continue;
      }
      if (d > 50) (A.play("move"), A.walk(Math.sign(A.dx), e.speed));
      else (A.play("idle"), A.stop(), A.face());
      yield 0;
    }
  },
});

// ════ 거대 말벌 ════ 플레이어 위를 맴돌다 배를 말고(예고) 독침 급강하. 맞으면 중독
register("gm_wasp", {
  atkMul: 1,
  ...giantWasp, speed: 120, sight: 280,
  *brain(e, A) {
    const M = e.fz.mem;
    M.cd = 1.5 + Math.random();
    M.ph = Math.random() * 6;
    for (;;) {
      M.cd -= DT, M.ph += DT;
      A.play("idle");
      if (!e.aggro) {
        A.flyTo(e.homeX + Math.sin(M.ph * 0.8) * 50, e.homeY ?? e.body.y, 40);
        yield 0;
        continue;
      }
      const p = A.p;
      A.flyTo(p.cx - (Math.sign(A.dx) || 1) * 80 + Math.sin(M.ph * 1.3) * 26, p.body.y - 80 + Math.cos(M.ph * 2) * 12, e.speed);
      if (M.cd <= 0 && Math.abs(A.dx) < 160) {
        A.face();
        e.body.vx *= 0.2, e.body.vy *= 0.2;
        A.tele(0.45);
        yield A.once("wind");
        A.once("atk");
        A.sound("dash", 0.4);
        const tx = p.cx, ty = p.body.y - 10, dx = tx - e.cx, dy = ty - e.body.y, L = Math.hypot(dx, dy) || 1;
        for (let t = 0; t < 0.45; t += DT) {
          e.body.vx = (dx / L) * 360;
          e.body.vy = (dy / L) * 360;
          if (A.melee(18, 18, 1, { st: POIS(), knock: 0.6 })) break;
          yield 0;
        }
        yield A.once("rec");
        M.cd = 2.4 + Math.random();
      }
      yield 0;
    }
  },
});

// ════ 맨드레이크 ════ 풀잎 무더기로 숨어 있다가 다가오면 튀어나와 비명 (가까우면 잠깐 굳는다). 도망치다 다시 숨는다
register("gm_mandrake", {
  atkMul: 0.6,
  ...mandrake, speed: 70, sight: 160,
  damage(e, dmg) {
    return e.fz?.mem.hidden ? dmg * 0.3 : dmg;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    for (;;) {
      e.body.vx = 0;
      M.hidden = 1;
      A.play("hide");
      if (!(e.aggro && near(e, A, 96, 50))) {
        yield 0.1;
        continue;
      }
      M.hidden = 0;
      A.burst("dust", 0, -2, 8, 0x8a6a40);
      yield A.once("rise");
      A.face();
      A.tele(0.5);
      yield 0.5;
      A.once("scream");
      A.sound("bossRoar", 0.25);
      const host = e.host;
      host.fx.anim("ring", e.cx, e.body.y - 14, { scale: 2.4, tint: 0xe8d0ff });
      host.fx.anim("ring", e.cx, e.body.y - 14, { scale: 1.4, tint: 0xffffff });
      if (near(e, A, 120, 70)) (e.hit(0.6, !1, "wind"), A.afflict({ type: "stun", chance: 1, dur: 0.9 }));
      yield 0.6;
      // 반대로 종종걸음 → 땅속으로
      A.play("move");
      for (let t = 0; t < 1.4; t += DT) (A.walk(-Math.sign(A.dx) || 1, e.speed), yield 0);
      A.stop(1);
      yield A.once("burrow");
      M.hidden = 1;
      yield 2.5;
    }
  },
});

// ════ [정예] 초원 오우거 ════ 몽둥이 내려찍기(양옆으로 땅울림) · 발구르기(가까우면 굳음) · 체력 절반에 포효하고 빨라짐
register("gm_ogre", {
  atkMul: 1.9,
  ...meadowOgre, speed: 40, sight: 280, heavy: 1,
  *brain(e, A) {
    const M = e.fz.mem;
    M.cd = 1.2;
    for (;;) {
      M.cd -= DT * (M.rage ? 1.35 : 1);
      if (!e.aggro) {
        A.play("idle"), A.stop();
        yield 0.2;
        continue;
      }
      if (!M.rage && e.hp < e.maxHp * 0.5) {
        M.rage = 1;
        A.stop(1), A.face();
        yield A.once("roar");
        A.sound("bossRoar", 0.6);
        A.shake(6);
        e.speed *= 1.4;
        yield 0.3;
      }
      const d = Math.abs(A.dx);
      if (d < 86 && Math.abs(A.dy) < 60 && M.cd <= 0) {
        A.face(), A.stop(1);
        if (d < 50 && Math.random() < 0.45) {
          // 발구르기: 한 발을 들었다가 쿵 → 가까우면 굳음
          A.tele(0.55, { bar: [e.cx, 200] });
          yield A.once("stomp", 6) * 0.5;
          A.once("stomp", 10);
          yield 0.2;
          A.shake(7);
          A.sound("explosion", 0.5);
          A.burst("dust", 0, -2, 14, 0x9a8a6a);
          if (near(e, A, 100, 40) && A.p.body.onGround) (e.hit(0.9, !1, "earth"), A.afflict({ type: "stun", chance: 1, dur: 0.6 }));
          yield 0.6;
        } else {
          // 몽둥이 내려찍기: 머리 위로 크게 들었다가 → 쾅 + 양옆으로 땅울림 파도
          A.tele(0.8, { bar: [e.cx + e.facing * 46, 90] });
          yield A.once("wind");
          yield 0.15;
          A.once("atk");
          yield 0.08;
          A.melee(70, 80, 1.7, { knock: 2.4 });
          A.fxHeavy(44, -20, 1.4, 0xd8c090);
          A.shake(8);
          A.sound("explosion", 0.7);
          A.burst("dust", 46, -2, 16, 0x9a8a6a);
          for (const dir of [-1, 1]) A.shoot({ sprite: "p_wave", speed: 230, life: 1, radius: 10 }, e.cx + e.facing * 46, e.body.y - 10, dir > 0 ? 0 : Math.PI, 0.6, { el: "earth", opts: { tint: 0xc8b080 } });
          yield 0.25;
          yield A.once("rec");
        }
        A.play("idle");
        M.cd = 1.6 + Math.random() * 0.6;
        continue;
      }
      if (d > 60) (A.play("move"), A.walk(Math.sign(A.dx), e.speed));
      else (A.play("idle"), A.stop(), A.face());
      yield 0;
    }
  },
});

// ════ [정예] 켄타우로스 사냥꾼 ════ 거리를 두고 화살 세 발 · 바짝 붙으면 앞발로 짓밟기 · 가끔 들판을 가로질러 돌진
register("gm_centaur", {
  atkMul: 1.4,
  ...centaur, speed: 150, sight: 340,
  *brain(e, A) {
    const M = e.fz.mem;
    M.cd = 1;
    M.n = 0;
    for (;;) {
      M.cd -= DT;
      if (!e.aggro) {
        A.play("idle"), A.stop();
        yield 0.2;
        continue;
      }
      const d = Math.abs(A.dx);
      if (d < 64 && Math.abs(A.dy) < 50 && M.cd <= 0) {
        // 앞발 들어 짓밟기
        A.face(), A.stop(1);
        A.tele(0.45, { bar: [e.cx + e.facing * 40, 80] });
        yield A.once("rear", 7);
        A.melee(52, 50, 1.4, { knock: 2.2 });
        A.shake(5);
        A.sound("thud", 0.8);
        A.burst("dust", 30, -2, 10, 0x9a8a6a);
        yield 0.35;
        M.cd = 1;
        continue;
      }
      if (M.cd <= 0 && M.n >= 2 && d < 300) {
        // 돌진: 플레이어를 지나쳐 반대편으로 (지나가며 짓밟는다)
        M.n = 0;
        A.face(), A.stop(1);
        A.tele(0.6, { bar: [e.cx + e.facing * 140, 280] });
        yield 0.6;
        A.play("move", 20);
        A.sound("dash", 0.8);
        const dir = e.facing;
        let hit = !1;
        for (let t = 0; t < 1.1; t += DT) {
          e.body.vx = dir * 330;
          e.facing = dir;
          !hit && (hit = A.melee(34, 44, 1.3, { knock: 1.8 }));
          Math.random() < 0.4 && A.burst("dust", -20, -2, 1, 0x9a8a6a);
          if (e.body.hitWall) break;
          yield 0;
        }
        A.stop(1);
        M.cd = 1.4;
        continue;
      }
      if (d >= 150 && d < 360 && M.cd <= 0) {
        // 화살 세 발
        A.face(), A.stop(1);
        A.tele(0.55);
        yield A.once("aim");
        const p = A.p;
        for (let i = 0; i < 3; i++) {
          A.once("shoot");
          const ox = e.cx + e.facing * 22, oy = e.body.y - 54, ang = Math.atan2(p.cy - oy, p.cx - ox) + (i - 1) * 0.05;
          A.shoot({ sprite: "p_arrow", speed: 560, gravity: 60, life: 1.6, radius: 5 }, ox, oy, ang, 0.9, { opts: { tint: 0xffffff } });
          A.sound("bow", 0.6);
          yield 0.2;
        }
        M.n++;
        M.cd = 1.6 + Math.random() * 0.5;
        continue;
      }
      // 거리 유지: 너무 가까우면 물러나고, 멀면 다가간다
      if (d < 150) (A.play("move"), A.walk(-Math.sign(A.dx) || 1, e.speed * 0.8));
      else if (d > 330) (A.play("move"), A.walk(Math.sign(A.dx), e.speed));
      else (A.play("idle"), A.stop(), A.face());
      yield 0;
    }
  },
});

export const GM_IDS = ["gm_slime", "gm_slime_mini", "gm_goblin", "gm_wolf", "gm_boar", "gm_wasp", "gm_mandrake", "gm_ogre", "gm_centaur"];
