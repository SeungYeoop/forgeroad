// 루트홀로우 몬스터 12종 행동 (그림은 px_rh.js)
import { register } from "./core.js";
import * as X from "./px_rh.js";
import { DT, POIS, CHILL, STUN, BLEED, hop, near, dirTo, ready, cool, land, wander, hover, notice, approach, melee, slam, lob, shoot, dive, charge, summon, lurk, groundY } from "./bkit.js";

// 발밑에서 뿌리가 솟는다 (예고 바 → 솟음): 정예 둘이 같이 쓴다
function* rootSpikes(e, A, n = 3, o = {}) {
  for (let k = 0; k < n; k++) {
    const x = A.p.cx + (A.p.body.vx ?? 0) * 0.2 + (o.spread ? (Math.random() - 0.5) * o.spread : 0), gy = groundY(e, x);
    A.tele(o.tele ?? 0.45, { bar: [x, 34] });
    yield o.tele ?? 0.45;
    e.host.fx.burst("chunk", x, gy - 6, 8, 0x6a4a30);
    e.host.fx.anim("ring", x, gy - 4, { scale: 1.2, tint: 0xa0f0b0 });
    A.sound("punch", 0.5);
    e.playerInRect(x - 14, gy - 42, 28, 42) && (e.hit(o.mult ?? 1, !0, "earth", void 0, 0.4), (A.p.body.vy = -420));
    yield o.gap ?? 0.15;
  }
}

// ════ 뿌리 손 ════ 땅속에 숨어 있다가 솟아 붙잡는다: 잡히면 잠깐 묶이고 끌려온다 (움직이지 않음)
register("rh_hand", {
  ...X.pxRootHand, speed: 0, sight: 160, atkMul: 0.8, heavy: 1,
  damage(e, dmg) {
    return e.fz?.mem.hidden ? dmg * 0.3 : dmg;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    M.hidden = 1;
    for (;;) {
      A.stop(1);
      if (M.hidden) {
        A.play("hide");
        e.aggro && near(A, 90, 50) && ((M.hidden = 0), A.sound("thud", 0.4), yield A.once("rise"));
        yield 0.08;
        continue;
      }
      if (!e.aggro || !near(A, 150, 70)) {
        M.hidden = 1;
        continue;
      }
      if (near(A, 46, 30) && ready(e, "grab")) {
        A.face();
        A.tele(0.45);
        yield A.once("wind");
        A.once("atk");
        A.sound("swing", 0.5);
        yield 0.1;
        if (e.playerInRect(e.cx - 4 + (e.facing > 0 ? 0 : -26), e.body.y - 34, 30, 34)) {
          e.hit(0.6, !0, "earth", STUN(0.8), 0);
          A.p.body.vx = -e.facing * 140;
        }
        yield A.once("rec");
        cool(e, "grab", 2.4, 3.2);
        continue;
      }
      A.play("idle"), A.face();
      yield 0.05;
    }
  },
});

// ════ 노움 도둑 ════ 몰래 다가와 재료를 훔쳐 달아난다. 쓰러뜨리면 훔친 재료를 돌려받는다
register("rh_gnome", {
  ...X.pxGnome, speed: 110, sight: 230, atkMul: 0.5,
  die(e) {
    const M = e.fz?.mem, fr = e.host.fr;
    if (!M?.stolen || !fr) return;
    fr.mats = fr.mats ?? {};
    fr.mats[M.stolen.id] = (fr.mats[M.stolen.id] ?? 0) + M.stolen.n;
    e.host.fx.text?.(e.cx, e.cy - 20, `재료 ${M.stolen.n}개를 되찾았다`, "#ffd060");
    e.host.fx.burst("glow", e.cx, e.cy, 12, 0xffd060);
  },
  *brain(e, A) {
    const M = e.fz.mem;
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 24, range: 60 });
        continue;
      }
      if (M.stolen) {
        // 집 쪽으로 줄행랑 (6초 뒤 다시 숨는다)
        A.play("flee");
        A.walk(Math.sign(e.cx - A.p.cx) || 1, e.speed * 1.2);
        (M.fleeT = (M.fleeT ?? 0) + DT) > 6 && (M.fleeT = 0);
        yield 0;
        continue;
      }
      if (near(A, 30, 18) && ready(e, "steal")) {
        let hit = !1;
        yield* melee(e, A, { tele: 0.3, dash: 140, fw: 16, fh: 14, mult: 0.3, knock: 0.1, spark: !1, onHit: () => (hit = !0) });
        const fr = e.host.fr;
        if (hit && fr?.mats) {
          const have = Object.entries(fr.mats).filter(([, n]) => n > 0);
          if (have.length) {
            const [id, n] = have[Math.floor(Math.random() * have.length)], take = Math.min(n, 1 + (Math.random() < 0.4 ? 1 : 0));
            fr.mats[id] -= take;
            M.stolen = { id, n: take };
            e.host.fx.text?.(e.cx, e.cy - 20, "재료를 훔쳤다!", "#ff9070");
            A.sound("coin", 0.6);
          }
        }
        cool(e, "steal", 1.5, 2.5);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 20 });
    }
  },
});

// ════ 뿌리 벌레 떼 ════ 뿌리 속에서 우르르 기어 나와 갉는다
register("rh_grub", {
  ...X.pxGrubs, speed: 70, sight: 200, atkMul: 0.5,
  *brain(e, A) {
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 16, range: 50 });
        continue;
      }
      if (near(A, 30, 14) && ready(e, "gnaw")) {
        A.face(), A.tele(0.25);
        yield A.once("wind");
        A.play("atk");
        for (let k = 0; k < 3; k++) (A.melee(20, 10, 0.3, { knock: 0.1 }), A.sound("punch", 0.2), yield 0.13);
        yield A.once("rec");
        cool(e, "gnaw", 1, 1.6);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 22 });
    }
  },
});

// ════ [정예] 뿌리 갑옷 곰 ════ 앞발 연타 · 일어서서 내려찍기(넓게) · 포효하면 둘레에서 뿌리가 솟구친다
register("rh_bear", {
  ...X.pxRootBear, speed: 70, sight: 290, atkMul: 1.8, heavy: 1,
  *brain(e, A) {
    cool(e, "roar", 3, 4), cool(e, "stand", 2, 3);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 18, range: 50 });
        continue;
      }
      yield* notice(e, A, { anim: "roar", sound: "bossRoar", vol: 0.4 });
      const d = Math.abs(A.dx);
      if (ready(e, "roar") && d < 240) {
        A.face(), A.stop(1);
        yield A.once("roar");
        A.sound("bossRoar", 0.5), A.shake(2);
        yield* rootSpikes(e, A, 3, { tele: 0.4, spread: 60, mult: 1 });
        cool(e, "roar", 6, 8);
        continue;
      }
      if (ready(e, "stand") && near(A, 80, 40)) {
        A.face(), A.stop(1);
        A.tele(0.6, { bar: [e.cx + e.facing * 34, 140] });
        yield A.once("stand");
        A.once("slam");
        yield 0.12;
        const x = e.cx + e.facing * 34, y = e.body.y;
        e.host.fx.anim("ring", x, y - 4, { scale: 3.2, tint: 0xb0e090 });
        e.host.fx.burst("chunk", x, y - 4, 12, 0x6a4a30);
        A.shake(3.5), A.sound("thud", 0.9);
        e.playerInRect(x - 70, y - 34, 140, 34) && e.hit(1.6, !0, "earth", STUN(0.4), 1.6);
        yield A.once("rec");
        cool(e, "stand", 3.5, 5);
        continue;
      }
      if (near(A, 50, 34) && ready(e, "paw")) {
        for (let k = 0; k < 2; k++) yield* melee(e, A, { tele: k ? 0 : 0.4, dash: 140, fw: 34, fh: 30, mult: 1.2, st: BLEED(0.12, 3), knock: k ? 1.4 : 0.6, fx: "slash", tint: 0xe8d8b0, fxS: 0.9, recK: k ? 1 : 0.2 });
        cool(e, "paw", 1.6, 2.4);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 44 });
    }
  },
});

// ════ 발광 버섯 꼬마 ════ 빛나는 포자를 퍼뜨린다 (그 자리에 머무르면 중독). 붙으면 아장아장 도망친다
register("rh_shroom", {
  ...X.pxShroomKid, speed: 70, sight: 220, atkMul: 0.5,
  *brain(e, A) {
    cool(e, "spore", 0.8, 1.6);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 18, range: 50 });
        continue;
      }
      const d = Math.abs(A.dx);
      if (d < 50) {
        A.play("move"), A.walk(-dirTo(A), e.speed);
        yield 0;
        continue;
      }
      if (ready(e, "spore") && d < 180) {
        yield* lob(e, A, {
          sprite: "sl_glob", g: 380, ox: 4, oy: 22, mult: 0.35, el: "poison", st: POIS(0.08, 2), tele: 0.4, sound: "blub", scale: 0.8,
          onDone: (pr) => {
            const gy = groundY(e, pr.x);
            e.host.fx.burst("glow", pr.x, gy - 4, 8, 0x7af0d0);
            !e.dead && A.zone(pr.x, gy, 40, 3, 0.06, { el: "poison", st: POIS(0.08, 2), kind: "slime" });
          },
        });
        cool(e, "spore", 2.6, 3.6);
        continue;
      }
      yield* approach(e, A, { lo: 80, hi: 150 });
    }
  },
});

// ════ 포자 풍선 ════ 둥둥 떠서 다가와 부풀었다 터진다 (독 구름을 남기고 사라진다)
register("rh_balloon", {
  ...X.pxBalloon, speed: 45, sight: 220, atkMul: 0.9,
  *brain(e, A) {
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 30, ry: 10, speed: 16 });
        continue;
      }
      if (Math.hypot(A.dx, A.dy) < 44) {
        A.stop(1);
        e.body.vx = e.body.vy = 0;
        A.tele(0.6);
        yield A.once("wind");
        A.once("atk");
        A.sound("splat", 0.8);
        e.host.fx.anim("ring", e.cx, e.cy, { scale: 2.6, tint: 0xd8b8f0 });
        e.host.fx.burst("glow", e.cx, e.cy, 16, 0xc8a0e8);
        Math.hypot(A.dx, A.dy) < 56 && e.hit(1.1, !1, "poison", POIS(0.15, 3), 0.6);
        A.zone(e.cx, groundY(e, e.cx), 70, 4, 0.1, { el: "poison", st: POIS(0.12, 2.5), kind: "slime" });
        e.hp = 0;
        e.die?.();
        return;
      }
      const p = A.p;
      A.play("move");
      A.flyTo(p.cx, p.body.y - 14, e.speed);
      yield 0;
    }
  },
});

// ════ 균사 사슴 ════ 균 뿔을 낮추고 돌진한다. 가끔 몸을 털어 둘레에 포자를 흩뿌린다
register("rh_deer", {
  ...X.pxMycoDeer, speed: 90, sight: 260, atkMul: 1.2,
  *brain(e, A) {
    cool(e, "charge", 1, 2), cool(e, "shake", 2, 3);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 22, range: 60 });
        continue;
      }
      yield* notice(e, A, { anim: "shake", sound: "warn" });
      if (ready(e, "shake") && near(A, 70, 40)) {
        A.stop(1);
        A.tele(0.4);
        yield A.once("shake");
        e.host.fx.burst("glow", e.cx, e.cy, 14, 0x9affe0);
        A.zone(e.cx, e.body.y, 90, 3, 0.08, { el: "poison", st: POIS(0.1, 2), kind: "slime" });
        cool(e, "shake", 4, 5.5);
        continue;
      }
      if (A.ground && ready(e, "charge") && Math.abs(A.dx) < 230 && Math.abs(A.dy) < 30) {
        yield* charge(e, A, { tele: 0.6, v: 280, dur: 1.1, mult: 1.2, knock: 1.8, fw: 26, fh: 22, stunT: 1.2 });
        cool(e, "charge", 2.5, 3.5);
        continue;
      }
      yield* approach(e, A, { lo: 60, hi: 110 });
    }
  },
});

// ════ [정예] 버섯 왕 ════ 버섯 꼬마를 불러내고 · 포자 비(예고된 자리에 독 웅덩이) · 거대한 갓으로 내려찍기
register("rh_king", {
  ...X.pxMushKing, speed: 34, sight: 300, atkMul: 1.6, heavy: 1,
  *brain(e, A) {
    cool(e, "call", 1.5, 2.5), cool(e, "rain", 3, 4);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 10, range: 30 });
        continue;
      }
      yield* notice(e, A, { anim: "call", sound: "bossRoar", vol: 0.3 });
      if (ready(e, "call")) {
        const did = yield* summon(e, A, { id: "rh_shroom", n: 2, max: 3, anim: "call", col: 0x9affe0, dx: 34 });
        cool(e, "call", did ? 8 : 3, did ? 11 : 4);
        continue;
      }
      if (ready(e, "rain") && Math.abs(A.dx) < 260) {
        A.stop(1);
        A.play("rain");
        A.sound("magic", 0.6);
        for (let k = 0; k < 4; k++) {
          const x = A.p.cx + (Math.random() - 0.5) * 120, gy = groundY(e, x);
          A.tele(0.5, { bar: [x, 50] });
          yield 0.3;
          e.host.fx.burst("glow", x, gy - 30, 8, 0x9affe0);
          A.zone(x, gy, 50, 3, 0.1, { el: "poison", st: POIS(0.12, 2.5), kind: "slime" });
          e.playerInRect(x - 25, gy - 40, 50, 40) && e.hit(0.6, !1, "poison", POIS(0.12, 2.5), 0.2);
        }
        cool(e, "rain", 6, 8);
        continue;
      }
      if (near(A, 80, 44) && ready(e, "cap")) {
        yield* slam(e, A, { r: 66, fwd: 30, mult: 1.6, tele: 0.7, shake: 3, chunk: 0x48c8b0, tint: 0x9affe0 });
        cool(e, "cap", 2.5, 3.5);
        continue;
      }
      yield* approach(e, A, { lo: 40, hi: 70 });
    }
  },
});

// ════ 흙덩이 정령 ════ 흙 주먹을 휘두른다. 다른 흙덩이와 만나면 합쳐져 다시 튼튼해지고 세진다
register("rh_clod", {
  ...X.pxClod, speed: 40, sight: 200, atkMul: 1,
  *brain(e, A) {
    const M = e.fz.mem;
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 12, range: 40 });
        continue;
      }
      // 가까운 흙덩이 하나를 흡수
      const mate = !M.merged && e.host.enemies.find((q) => q !== e && !q.dead && q.def.id === "rh_clod" && !q.fz?.mem.merged && Math.hypot(q.cx - e.cx, q.cy - e.cy) < 50);
      if (mate) {
        M.merged = 1;
        mate.fz && (mate.fz.mem.merged = 1);
        A.stop(1);
        e.host.fx.burst("chunk", mate.cx, mate.cy, 10, 0x6a5038);
        mate.remove?.(), (mate.dead = !0);
        yield A.once("grow");
        e.maxHp = Math.round(e.maxHp * 1.6), e.hp = e.maxHp, e.atk *= 1.4;
        e.host.fx.burst("glow", e.cx, e.cy, 12, 0xc8ff90);
        A.sound("thud", 0.6);
        continue;
      }
      if (near(A, 44, 30) && ready(e, "punch")) {
        yield* melee(e, A, { tele: 0.5, dash: 80, fw: 26, fh: 24, mult: 1.1, knock: 1, fx: "heavy", tint: 0xc8b090, sound: "punch" });
        cool(e, "punch", 1.4, 2);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 32 });
    }
  },
});

// ════ 썩은 뿌리 망령 ════ 뿌리 사이로 사라졌다(맞지 않는다) 등 뒤에 나타나 할퀸다 (출혈)
register("rh_wraith", {
  ...X.pxWraith, speed: 60, sight: 260, atkMul: 1.1,
  damage(e, dmg) {
    return e.fz?.mem.gone ? 0 : dmg;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    cool(e, "blink", 1.5, 2.5);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 26, ry: 4, speed: 16 });
        continue;
      }
      if (ready(e, "blink")) {
        M.gone = 1;
        yield A.once("fade");
        e.sprite.setVisible(!1);
        yield 0.6;
        const p = A.p, back = -(p.facing ?? 1) || 1;
        e.body.x = p.cx + back * 34, e.body.y = p.body.y - 6, e.body.vx = e.body.vy = 0;
        e.facing = -back;
        e.sprite.setVisible(!0);
        yield A.once("appear");
        M.gone = 0;
        yield* melee(e, A, { tele: 0.4, fw: 24, fh: 26, mult: 1.1, st: BLEED(0.12, 3), knock: 0.8, fx: "slash", tint: 0xd890ff });
        cool(e, "blink", 3, 4.5);
        continue;
      }
      const p = A.p;
      A.play("move");
      A.flyTo(p.cx - dirTo(A) * 70, p.body.y - 10, e.speed);
      A.face();
      yield 0;
    }
  },
});

// ════ 돌껍질 달팽이 ════ 산성 점액을 뱉고, 기어간 자리엔 미끄러운 점액을 남긴다. 맞으면 껍질에 숨는다 (덜 아프다)
register("rh_snail", {
  ...X.pxSnail, speed: 24, sight: 220, atkMul: 0.9,
  damage(e, dmg) {
    return e.fz?.mem.hide ? dmg * 0.3 : dmg;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    cool(e, "spit", 1, 2);
    for (;;) {
      if (!e.aggro) {
        M.hide = 0;
        yield* wander(e, A, { speed: 8, range: 40 });
        continue;
      }
      if (e.sinceHit < 0.2 && ready(e, "shell")) {
        M.hide = 1;
        A.play("hide"), A.stop(1);
        yield 1.4;
        M.hide = 0;
        cool(e, "shell", 3, 4);
        continue;
      }
      if (ready(e, "spit") && Math.abs(A.dx) < 200) {
        yield* lob(e, A, { sprite: "sl_glob", g: 420, ox: 14, oy: 10, mult: 0.7, el: "poison", st: POIS(0.15, 3), tele: 0.45, sound: "blub" });
        cool(e, "spit", 2.6, 3.4);
        continue;
      }
      // 점액 자국
      ready(e, "trail") && Math.abs(e.body.vx) > 4 && (A.zone(e.cx - e.facing * 10, e.body.y, 28, 3, 0.01, { el: "poison", st: CHILL(0.45, 1), kind: "slime" }), cool(e, "trail", 1.2));
      yield* approach(e, A, { lo: 60, hi: 140 });
    }
  },
});

// ════ [정예] 고대 뿌리 심장 ════ 움직이지 않는다. 발밑 뿌리 촉수(넷) · 맥박 충격파(둘레를 크게 밀어냄) · 뿌리 손을 불러낸다
register("rh_heart", {
  ...X.pxRootHeart, speed: 0, sight: 320, atkMul: 1.7, heavy: 1,
  *brain(e, A) {
    cool(e, "pulse", 2, 3), cool(e, "spikes", 1, 2), cool(e, "hands", 5, 6);
    for (;;) {
      A.stop(1);
      if (!e.aggro) {
        A.play("idle");
        yield 0.1;
        continue;
      }
      const d = Math.hypot(A.dx, A.dy);
      if (ready(e, "pulse") && d < 140) {
        A.tele(0.7);
        yield A.once("wind");
        A.play("pulse");
        for (let k = 0; k < 2; k++) {
          A.sound("thud", 0.8), A.shake(2.5);
          e.host.fx.anim("ring", e.cx, e.cy, { scale: 4.2, tint: 0x8af0a0 });
          Math.hypot(A.dx, A.dy) < 130 && (e.hit(1, !1, "earth", void 0, 0), (A.p.body.vx = Math.sign(A.dx) * 520), (A.p.body.vy = -260));
          yield 0.35;
        }
        cool(e, "pulse", 4.5, 6);
        continue;
      }
      if (ready(e, "hands")) {
        const did = yield* summon(e, A, { id: "rh_hand", n: 2, max: 2, anim: "wind", col: 0x8af0a0, dx: 60, tele: 0.3 });
        cool(e, "hands", did ? 10 : 4, did ? 13 : 5);
        continue;
      }
      if (ready(e, "spikes") && d < 320) {
        yield A.once("atk") * 0.5;
        yield* rootSpikes(e, A, 4, { tele: 0.4, gap: 0.1, mult: 1.2 });
        cool(e, "spikes", 3, 4);
        continue;
      }
      A.play("idle"), A.face();
      yield 0.05;
    }
  },
});
