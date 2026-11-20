// 그래스메어 몬스터 행동 (그림은 mg0.js). 정통 RPG 들판의 적 — 세기가 천차만별:
//   슬라임(아주 약함) · 맨드레이크(약함, 비명으로 굳게 함) · 고블린(약함, 빠름) · 말벌(보통, 독) · 늑대(보통, 무리)
//   · 멧돼지(강함, 돌진) · [정예] 오우거(매우 강함) · [정예] 켄타우로스(매우 강함, 원거리)
import { register } from "./core.js";
import { gSlime, gSlimeMini, goblin, plainsWolf, tuskBoar, giantWasp, mandrake, meadowOgre, centaur } from "./mg0.js";

const DT = 1 / 60;
const POIS = (p = 0.15, d = 3) => ({ type: "poison", chance: 1, dur: d, power: p });
const SLIME = 0x7ae060;
// 땅 위에서 통 튀어 오르기 (방향, 가로 속도, 세로 속도)
const hop = (e, dir, vx, vy) => ((e.body.vy = -vy), (e.body.vx = dir * vx), (e.facing = dir));
const near = (e, A, w, h) => Math.abs(A.dx) < w && Math.abs(A.dy) < h;

// ════ 풀잎 슬라임 ════ 통통 튀어 다가와 몸통 박치기. 큰 것은 터지면 작은 슬라임 둘로 갈라진다
function slimeBrain(mini) {
  return function* (e, A) {
    const M = e.fz.mem;
    M.cd = 0.5 + Math.random() * 0.6;
    for (;;) {
      M.cd -= DT;
      if (!e.aggro) {
        A.play("idle");
        A.stop(0.15);
        if (A.ground && Math.random() < 0.006) (A.once("move"), hop(e, Math.random() < 0.5 ? -1 : 1, 40, 170));
        yield 0;
        continue;
      }
      if (A.ground && near(e, A, mini ? 46 : 64, 40) && M.cd <= 0) {
        // 몸을 납작하게 웅크렸다가 → 앞으로 뛰어들어 박치기
        A.face(), A.stop(1);
        A.tele(mini ? 0.25 : 0.35);
        yield A.once("wind");
        A.once("atk");
        hop(e, e.facing, mini ? 170 : 200, mini ? 240 : 280);
        A.sound("jump", 0.4);
        for (let t = 0; t < 0.5; t += DT) {
          if (A.melee(mini ? 14 : 20, mini ? 12 : 18, 1, { knock: 0.6 })) break;
          yield 0;
        }
        while (!A.ground) yield 0;
        A.burst("dust", 0, -2, 4, SLIME);
        yield A.once("rec");
        M.cd = 1.2 + Math.random() * 0.6;
        continue;
      }
      if (A.ground) {
        A.face();
        A.once("move");
        hop(e, Math.sign(A.dx) || 1, e.speed, mini ? 190 : 230);
        yield mini ? 0.42 : 0.55;
        A.ground && A.burst("dust", 0, -2, 2, SLIME);
      } else yield 0;
    }
  };
}
register("gm_slime", {
  atkMul: 0.7,
  ...gSlime, speed: 70, sight: 200,
  brain: slimeBrain(!1),
  die(e) {
    if (e.opts.summoned) return;
    const host = e.host, x = e.cx, y = e.body.y;
    host.fx.burst("glow", x, y - 8, 10, SLIME);
    for (const d of [-1, 1]) {
      const z = host.spawnEnemy("gm_slime_mini", x + d * 10, y - 4, { summoned: !0, noGold: !0 });
      z && ((z.aggro = !0), (z.body.vx = d * 120), (z.body.vy = -200));
    }
  },
});
register("gm_slime_mini", {
  atkMul: 0.5, ...gSlimeMini, speed: 85, sight: 220, brain: slimeBrain(!0) });

// ════ 고블린 정찰병 ════ 멀면 돌팔매, 가까우면 단검으로 재빨리 찌르고 뒤로 깡충
register("gm_goblin", {
  atkMul: 0.9,
  ...goblin, speed: 105, sight: 240,
  *brain(e, A) {
    const M = e.fz.mem;
    M.cd = 0.4;
    M.tcd = 1 + Math.random();
    for (;;) {
      M.cd -= DT, M.tcd -= DT;
      if (!e.aggro) {
        A.play("move", 8);
        A.walk(M.wd ?? 1, 30);
        Math.random() < 0.008 && (M.wd = -(M.wd ?? 1));
        yield 0;
        continue;
      }
      const d = Math.abs(A.dx);
      if (d > 140 && d < 300 && M.tcd <= 0) {
        // 돌팔매: 팔을 크게 젖혔다가 던진다 (포물선)
        A.face(), A.stop(1);
        A.tele(0.35);
        yield A.once("throw", 10) * 0.5;
        const p = A.p, ox = e.cx + e.facing * 6, oy = e.body.y - 22, T = 0.75;
        A.shoot({ sprite: "p_rock", speed: 240, gravity: 520, life: 2.2, radius: 5 }, ox, oy, 0, 0.7, { el: "earth", opts: { vx: (p.cx - ox) / T, vy: (p.body.y - 10 - oy - 0.5 * 520 * T * T) / T, scale: 1.3 } });
        A.sound("swing", 0.4);
        yield 0.35;
        M.tcd = 2.6 + Math.random();
        continue;
      }
      if (d < 46 && Math.abs(A.dy) < 30 && M.cd <= 0) {
        A.face(), A.stop(1);
        A.tele(0.3);
        yield A.once("wind");
        A.once("atk");
        e.body.vx = e.facing * 230;
        A.sound("swing", 0.6);
        for (let t = 0; t < 0.18; t += DT) {
          A.melee(28, 22, 1);
          yield 0;
        }
        A.fxSlash(16, -16, 0.7, 0xffffff);
        // 뒤로 깡충
        A.once("hop");
        hop(e, -e.facing, 170, 240);
        e.facing = -e.facing; // 뒤로 뛰어도 얼굴은 플레이어 쪽
        yield 0.45;
        M.cd = 1 + Math.random() * 0.5;
        continue;
      }
      if (d > 40) (A.play("move"), A.walk(Math.sign(A.dx), e.speed));
      else (A.play("idle"), A.stop(), A.face());
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
