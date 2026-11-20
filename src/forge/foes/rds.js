// 드립스톤 몬스터 12종 행동 (그림은 px_ds.js)
import { register } from "./core.js";
import * as X from "./px_ds.js";
import { DT, POIS, CHILL, STUN, hop, near, dirTo, ready, cool, land, wander, hover, notice, approach, melee, slam, lob, shoot, dive, charge, lurk, groundY, glowOn } from "./bkit.js";

// 머리 위 천장 찾기 (없으면 null)
const ceilOf = (e, x, y) => {
  const W = e.host.world;
  for (let yy = y - 16; yy > y - 280; yy -= 8) if (W.solidAtPx(x, yy)) return yy + 12;
  return null;
};
const floorOf = (e, x, y) => {
  const W = e.host.world;
  for (let yy = y; yy < y + 400; yy += 6) if (W.solidAtPx(x, yy)) return yy;
  return y;
};

// ════ 종유석 박쥐 ════ 천장에 거꾸로 매달려 쉬다가, 다가오면 초음파를 쏘고 내리꽂혀 문다
register("ds_bat", {
  ...X.pxCaveBat, speed: 130, sight: 240, atkMul: 0.8,
  *brain(e, A) {
    const M = e.fz.mem;
    M.ceil = ceilOf(e, e.homeX, e._hy ?? e.body.y);
    cool(e, "sonic", 0.5, 1.5), cool(e, "bite", 1.5, 2.5);
    for (;;) {
      if (!e.aggro) {
        if (M.ceil != null) {
          const dy = M.ceil - e.body.y;
          if (Math.abs(dy) > 4 || Math.abs(e.homeX - e.cx) > 4) A.play("move"), A.flyTo(e.homeX, M.ceil, 60);
          else A.play("hang"), (e.body.vx = 0), (e.body.vy = 0);
        } else yield* hover(e, A, { rx: 40 });
        yield 0;
        continue;
      }
      if (ready(e, "sonic") && Math.abs(A.dx) < 220) {
        yield* shoot(e, A, { wind: "wind", atk: "shriek", sprite: "p_wave", speed: 200, mult: 0.45, el: "wind", st: { type: "stun", chance: 0.3, dur: 0.35 }, oy: 18, tele: 0.4, sound: "magic" });
        cool(e, "sonic", 3, 4.5);
        continue;
      }
      if (ready(e, "bite") && Math.abs(A.dx) < 160) {
        yield* dive(e, A, { tele: 0.35, v: 340, dur: 0.45, mult: 0.9, fw: 16, fh: 14 });
        cool(e, "bite", 1.6, 2.6);
        continue;
      }
      yield* approach(e, A, { keep: 80, alt: 60 });
    }
  },
});

// ════ 석순 미믹 ════ 천장 석순인 척 매달려 있다가(맞아도 덜 아프다) 바로 아래로 떨어져 찌른다. 떨어진 뒤엔 기어 다니다 다시 천장으로
register("ds_mimic", {
  ...X.pxStalMimic, speed: 60, sight: 200, atkMul: 1.3,
  damage(e, dmg) {
    return e.fz?.mem.hidden ? dmg * 0.3 : dmg;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    M.ceil = ceilOf(e, e.homeX, e._hy ?? e.body.y) ?? (e._hy ?? e.body.y) - 90;
    M.hidden = 1;
    for (;;) {
      if (M.hidden) {
        // 천장으로 올라가 매달린다
        if (Math.abs(M.ceil - e.body.y) > 4 || Math.abs(e.homeX - e.cx) > 4) A.play("hide"), A.flyTo(e.homeX, M.ceil, 50);
        else A.play("hide"), (e.body.vx = 0), (e.body.vy = 0);
        if (e.aggro && Math.abs(A.dx) < 28 && A.dy > 0 && A.dy < 260) {
          A.play("wake");
          A.tele(0.35, { bar: [e.cx, 26] });
          A.sound("warn", 0.5);
          yield 0.35;
          A.play("atk");
          const fy = floorOf(e, e.cx, e.body.y);
          let hit = !1;
          for (let t = 0; t < 1.2 && e.body.y < fy - 8; t += DT) {
            e.body.vx = 0, e.body.vy = 560;
            !hit && e.playerInRect(e.cx - 10, e.body.y - 4, 20, 30) && ((hit = !0), e.hit(1.4, !0, "earth", void 0, 0.8));
            yield 0;
          }
          e.body.vy = 0;
          A.shake(1.5), A.sound("thud", 0.6);
          e.host.fx.burst("chunk", e.cx, e.body.y, 8, 0xc4c8bc);
          M.hidden = 0;
          M.ground = fy;
          cool(e, "climb", 6, 8);
        }
        yield 0.03;
        continue;
      }
      // 바닥에서 기어 다닌다 (바닥 높이 유지)
      const gy = (M.ground = floorOf(e, e.cx, e.body.y - 20) - 2);
      if (!e.aggro || ready(e, "climb")) {
        M.hidden = 1;
        A.sound("thud", 0.3);
        continue;
      }
      if (near(A, 30, 30) && ready(e, "stab")) {
        A.face(), A.tele(0.3);
        yield A.once("wind");
        A.once("atk");
        e.playerInRect(e.cx - 4 + e.facing * 6, e.body.y - 20, 22, 20) && e.hit(1, !0, "earth", void 0, 0.8);
        yield A.once("rec");
        cool(e, "stab", 1, 1.6);
        continue;
      }
      A.play("move");
      A.flyTo(A.p.cx, gy, e.speed);
      A.face();
      yield 0;
    }
  },
});

// ════ 물방울 정령 ════ 물방울을 튕겨 쏘고(맞으면 느려짐), 맞은 자리를 미끄럽게 적신다
register("ds_drop", {
  ...X.pxDrop, speed: 70, sight: 260, atkMul: 0.8,
  *brain(e, A) {
    cool(e, "shot", 0.8, 1.6);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 30, speed: 25 });
        continue;
      }
      if (ready(e, "shot") && Math.abs(A.dx) < 240) {
        yield* lob(e, A, {
          sprite: "sl_glob", g: 380, ox: 4, oy: 18, mult: 0.6, el: "ice", st: CHILL(0.35, 1.6), scale: 1.1, tele: 0.35, sound: "blub",
          onDone: (pr) => {
            const gy = groundY(e, pr.x);
            e.host.fx.burst("glow", pr.x, gy - 4, 8, 0x60e0f0);
            !e.dead && A.zone(pr.x, gy, 34, 3, 0.04, { el: "ice", st: CHILL(0.4, 1.2), kind: "ice" });
          },
        });
        cool(e, "shot", 1.8, 2.8);
        continue;
      }
      yield* approach(e, A, { keep: 120, alt: 50 });
    }
  },
});

// ════ [정예] 석회 거인 ════ 주먹을 내려치면 앞으로 석순이 차례로 솟는다 · 천장 종유석을 뽑아 던진다 · 가까우면 내려찍기
register("ds_giant", {
  ...X.pxLimeGiant, speed: 34, sight: 280, atkMul: 1.7, heavy: 1,
  *brain(e, A) {
    cool(e, "spikes", 1.5, 2.5), cool(e, "throw", 3, 4);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 12, range: 40 });
        continue;
      }
      yield* notice(e, A, { anim: "wind", sound: "bossRoar", vol: 0.3 });
      const d = Math.abs(A.dx);
      if (ready(e, "spikes") && d < 220 && Math.abs(A.dy) < 50) {
        A.face(), A.stop(1);
        A.tele(0.7, { bar: [e.cx + e.facing * 110, 200] });
        yield A.once("wind");
        A.once("atk");
        A.shake(2.5), A.sound("thud", 0.7);
        for (let k = 1; k <= 6; k++) {
          const x = e.cx + e.facing * (24 + k * 30), gy = groundY(e, x);
          e.host.fx.burst("chunk", x, gy - 6, 8, 0xc4c8bc);
          e.host.fx.anim("ring", x, gy - 4, { scale: 1.2, tint: 0xe8f0ff });
          e.playerInRect(x - 14, gy - 34, 28, 34) && (e.hit(1.1, !0, "earth", void 0, 0.6), (A.p.body.vy = -380));
          A.sound("punch", 0.35);
          yield 0.1;
        }
        yield A.once("rec");
        cool(e, "spikes", 3.5, 5);
        continue;
      }
      if (ready(e, "throw") && d > 90 && d < 260) {
        A.face(), A.stop(1);
        yield A.once("pull");
        e.host.fx.burst("chunk", e.cx - 10, e.body.y - 70, 6, 0xc4c8bc);
        yield* lob(e, A, { wind: "throw", atk: "throw", tele: 0.2, sprite: "p_icicle", g: 460, ox: -10, oy: 66, mult: 1.3, el: "earth", scale: 1.8, sound: "swing" });
        cool(e, "throw", 4.5, 6);
        continue;
      }
      if (near(A, 60, 40) && ready(e, "slam")) {
        yield* slam(e, A, { r: 56, mult: 1.4, tele: 0.6, fwd: 22, shake: 3, chunk: 0xc4c8bc, tint: 0xe8f0ff });
        cool(e, "slam", 2, 3);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 44 });
    }
  },
});

// ════ 동굴 도롱뇽 ════ 웅크려 숨어 있다(맞아도 덜 아프다) 튀어나와 물고, 미끄러지듯 뒤로 물러난다
register("ds_newt", {
  ...X.pxNewt, speed: 110, sight: 220, atkMul: 0.95,
  damage(e, dmg) {
    return e.fz?.mem.hidden ? dmg * 0.5 : dmg;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    for (;;) {
      if (!e.aggro) {
        M.hidden = 1;
        A.play("dive"), A.stop(1);
        yield 0.1;
        continue;
      }
      M.hidden = 0;
      if (near(A, 60, 24) && ready(e, "bite")) {
        yield* melee(e, A, { tele: 0.28, dash: 260, fw: 22, fh: 12, mult: 1, knock: 0.7, fx: "slash", tint: 0xc8f0f0 });
        // 미끄러지듯 물러남
        for (let t = 0; t < 0.4; t += DT) (A.play("move"), (e.body.vx = -e.facing * 170), yield 0);
        e.facing = dirTo(A);
        cool(e, "bite", 0.9, 1.6);
        continue;
      }
      yield* approach(e, A, { lo: 30, hi: 50 });
    }
  },
});

// ════ 호수 거머리 ════ 꿈틀대며 다가와 달라붙어 피를 빤다 (빠는 동안 자기는 회복). 때리면 떨어진다
register("ds_leech", {
  ...X.pxLeech, speed: 50, sight: 180, atkMul: 0.8,
  *brain(e, A) {
    const M = e.fz.mem;
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 14, range: 50 });
        continue;
      }
      if (near(A, 34, 20) && ready(e, "latch")) {
        let hit = !1;
        yield* melee(e, A, { tele: 0.3, dash: 160, lift: 120, fw: 16, fh: 12, mult: 0.6, knock: 0, spark: !1, onHit: () => (hit = !0) });
        if (hit && !A.p.dead) {
          const h0 = e.sinceHit;
          A.play("suck");
          A.sound("splat", 0.4);
          for (let t = 0, k = 0; t < 2.4 && !A.p.dead && (t < 0.1 || e.sinceHit > 0.06); t += DT) {
            const pb = A.p.body;
            e.body.x = A.p.cx - e.facing * 5, e.body.y = pb.y - 6, e.body.vx = 0, e.body.vy = 0;
            if (t > (k + 1) * 0.5) (k++, e.hit(0.28, !0, "poison", void 0, 0), (e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.08)), e.host.fx.burst("glow", e.cx, e.cy, 4, 0xc83040));
            yield 0;
          }
          void h0;
          hop(e, -e.facing, 120, 200);
          yield* land(e, A);
        }
        cool(e, "latch", 1.5, 2.5);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 26 });
    }
  },
});

// ════ 빛 이끼 덩이 ════ 움직이지 않는다. 주변 몬스터가 다치면 빛을 내뿜어 상처를 메우고, 붙으면 포자를 터뜨린다
register("ds_moss", {
  ...X.pxGlowMoss, speed: 0, sight: 200, atkMul: 0.6, heavy: 1,
  *brain(e, A) {
    cool(e, "heal", 1, 2);
    for (;;) {
      A.stop(1);
      if (!e.aggro) {
        A.play("idle");
        yield 0.1;
        continue;
      }
      const hurt = e.host.enemies.filter((q) => !q.dead && Math.hypot(q.cx - e.cx, q.cy - e.cy) < 160 && q.hp < q.maxHp * 0.95);
      if (ready(e, "heal") && hurt.length) {
        A.tele(0.4);
        yield A.once("wind");
        A.once("atk");
        A.sound("buff", 0.5);
        e.host.fx.anim("ring", e.cx, e.cy, { scale: 3, tint: 0x60f0c0 });
        for (const q of hurt) (q.hp = Math.min(q.maxHp, q.hp + q.maxHp * 0.18)), e.host.fx.burst("glow", q.cx, q.cy, 8, 0x60f0c0);
        yield A.once("rec");
        cool(e, "heal", 3, 4);
        continue;
      }
      if (near(A, 44, 30) && ready(e, "spore")) {
        A.tele(0.4);
        yield A.once("wind");
        A.once("atk");
        e.host.fx.burst("glow", e.cx, e.cy, 12, 0x60f0c0);
        A.zone(e.cx, e.body.y, 60, 2.5, 0.1, { el: "poison", st: POIS(0.1, 2), kind: "slime" });
        cool(e, "spore", 3, 4);
        continue;
      }
      A.play("idle"), A.face();
      yield 0.05;
    }
  },
});

// ════ [정예] 전기 뱀장어 ════ 낮게 떠 헤엄친다. 전기 파동(둘레 + 사방으로 번개) · 몸을 말아 전기 고리(닿으면 감전) · 물기
register("ds_eel", {
  ...X.pxEel, speed: 100, sight: 300, atkMul: 1.6,
  damage(e, dmg) {
    return e.fz?.mem.coil ? dmg * 0.5 : dmg;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    cool(e, "shock", 2, 3), cool(e, "coil", 5, 6);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 60, ry: 6, speed: 30 });
        continue;
      }
      yield* notice(e, A, { anim: "wind", sound: "magic" });
      if (ready(e, "shock") && Math.abs(A.dx) < 200) {
        A.face();
        e.body.vx = e.body.vy = 0;
        A.tele(0.7);
        yield A.once("wind");
        A.play("shock");
        A.sound("explosion", 0.4), A.shake(1.5);
        e.host.fx.anim("ring", e.cx, e.cy, { scale: 3.2, tint: 0x8af0ff });
        Math.hypot(A.dx, A.dy) < 80 && e.hit(1.3, !1, "lightning", STUN(0.4), 1);
        for (let k = 0; k < 8; k++) A.shoot({ sprite: "p_ebolt", speed: 210, life: 1.1, radius: 5 }, e.cx, e.cy, (k / 8) * Math.PI * 2, 0.5, { el: "lightning" });
        yield 0.5;
        yield A.once("rec");
        cool(e, "shock", 3.5, 5);
        continue;
      }
      if (ready(e, "coil") && Math.abs(A.dx) < 120) {
        M.coil = 1;
        A.play("coil");
        A.sound("magic", 0.5);
        for (let t = 0; t < 2.2; t += DT) {
          e.body.vx *= 0.9, e.body.vy *= 0.9;
          Math.random() < 0.3 && e.host.fx.burst("spark", e.cx + (Math.random() - 0.5) * 50, e.cy + (Math.random() - 0.5) * 30, 1, 0xc8ffff);
          if (Math.hypot(A.dx, A.dy) < 46 && ready(e, "zap")) (e.hit(0.6, !1, "lightning", void 0, 1.2), cool(e, "zap", 0.5));
          yield 0;
        }
        M.coil = 0;
        cool(e, "coil", 6, 8);
        continue;
      }
      if (near(A, 70, 40) && ready(e, "bite")) {
        yield* dive(e, A, { tele: 0.4, v: 300, dur: 0.4, mult: 1.2, fw: 26, fh: 20, ty: 6 });
        cool(e, "bite", 1.6, 2.4);
        continue;
      }
      yield* approach(e, A, { keep: 70, alt: 16 });
    }
  },
});

// ════ 바위 갑충 ════ 뿔을 숙이고 들이받는다. 벽에 박히면 뒤집혀 버둥거린다 (뒤집힌 동안 1.6배 피해)
register("ds_beetle", {
  ...X.pxRockBeetle, speed: 60, sight: 220, atkMul: 1.2, heavy: 0.6,
  damage(e, dmg) {
    return e.fz?.mem.dizzy ? dmg * 1.6 : dmg * 0.8;
  },
  *brain(e, A) {
    cool(e, "ram", 0.8, 1.5);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 16, range: 60 });
        continue;
      }
      if (A.ground && ready(e, "ram") && Math.abs(A.dx) < 220 && Math.abs(A.dy) < 30) {
        yield* charge(e, A, { tele: 0.6, v: 230, dur: 1.2, mult: 1.2, knock: 1.6, fw: 24, fh: 16, stunAnim: "flip", stunT: 1.8 });
        cool(e, "ram", 2.2, 3.2);
        continue;
      }
      yield* approach(e, A, { lo: 50, hi: 90 });
    }
  },
});

// ════ 메아리 정령 ════ 소리 고리를 세 번 퍼뜨린다 (고리에 걸리면 잠깐 휘청). 가끔 다른 자리로 울려 사라졌다 나타난다
register("ds_echo", {
  ...X.pxEcho, speed: 60, sight: 260, atkMul: 0.8,
  *brain(e, A) {
    cool(e, "ring", 1, 2), cool(e, "blink", 3, 5);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 30, speed: 20 });
        continue;
      }
      if (ready(e, "ring") && Math.hypot(A.dx, A.dy) < 160) {
        A.face();
        A.tele(0.5);
        yield A.once("wind");
        A.once("atk");
        A.sound("magic", 0.5);
        for (let k = 0; k < 3; k++) {
          const r = 40 + k * 32;
          e.host.fx.anim("ring", e.cx, e.cy, { scale: r / 22, tint: 0xa0d8ff });
          const d = Math.hypot(A.dx, A.dy);
          d < r && d > r - 36 && e.hit(0.45, !1, "wind", STUN(0.35), 0.5);
          yield 0.22;
        }
        yield A.once("rec");
        cool(e, "ring", 2.5, 3.5);
        continue;
      }
      if (ready(e, "blink")) {
        e.host.fx.burst("glow", e.cx, e.cy, 10, 0xa0d8ff);
        e.body.x = A.p.cx + (Math.random() < 0.5 ? -1 : 1) * (90 + Math.random() * 40);
        e.body.y = A.p.body.y - 40;
        e.host.fx.burst("glow", e.cx, e.cy, 10, 0xa0d8ff);
        cool(e, "blink", 4, 6);
        yield 0.2;
        continue;
      }
      yield* approach(e, A, { keep: 90, alt: 40 });
    }
  },
});

// ════ 굴뚝 지네 ════ 아주 빠르게 기어 와 독니로 물고, 몸을 틀어 살짝 물러난다
register("ds_centipede", {
  ...X.pxCentipede, speed: 150, sight: 240, atkMul: 0.9,
  *brain(e, A) {
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 40, range: 80 });
        continue;
      }
      if (near(A, 44, 18) && ready(e, "bite")) {
        yield* melee(e, A, { tele: 0.25, dash: 220, fw: 20, fh: 12, mult: 0.9, st: POIS(0.14, 3), knock: 0.5, fx: "slash", tint: 0xffd080 });
        for (let t = 0; t < 0.35; t += DT) (A.play("move"), A.walk(-e.facing, e.speed), yield 0);
        e.facing = dirTo(A);
        cool(e, "bite", 0.8, 1.3);
        continue;
      }
      yield* approach(e, A, { lo: 20, hi: 36 });
    }
  },
});

// ════ [정예] 협곡 바실리스크 ════ 눈빛을 모아 쏘면 앞에 선 자는 잠깐 굳는다 · 꼬리 휘두르기(양옆) · 독 이빨
register("ds_basilisk", {
  ...X.pxBasilisk, speed: 50, sight: 300, atkMul: 1.6, heavy: 0.8,
  *brain(e, A) {
    cool(e, "gaze", 2, 3), cool(e, "tail", 1.5, 2.5);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 16, range: 50 });
        continue;
      }
      yield* notice(e, A, { anim: "gaze", sound: "bossRoar", vol: 0.25 });
      const d = Math.abs(A.dx);
      if (ready(e, "gaze") && d < 240 && Math.abs(A.dy) < 70) {
        A.face(), A.stop(1);
        A.tele(0.8);
        A.play("gaze");
        A.sound("magic", 0.5);
        yield 0.8;
        // 앞쪽(바라보는 쪽)에 있으면 굳는다
        const p = A.p;
        if (Math.sign(p.cx - e.cx) === e.facing && Math.abs(p.cx - e.cx) < 240 && Math.abs(p.body.y - e.body.y) < 70) {
          e.host.fx.burst("glow", p.cx, p.cy, 14, 0xfff8d0);
          e.hit(0.5, !1, "earth", STUN(1.1), 0);
        }
        e.host.fx.anim("ring", e.cx + e.facing * 50, e.body.y - 20, { scale: 1.6, tint: 0xfff8d0 });
        yield A.once("rec");
        cool(e, "gaze", 4.5, 6);
        continue;
      }
      if (ready(e, "tail") && d < 70) {
        A.tele(0.45, { bar: [e.cx, 150] });
        yield 0.3;
        A.once("tail");
        A.sound("swing", 0.6);
        yield 0.12;
        e.playerInRect(e.cx - 75, e.body.y - 26, 150, 26) && e.hit(1.2, !0, "phys", void 0, 1.8);
        yield 0.3;
        cool(e, "tail", 2.5, 3.5);
        continue;
      }
      if (near(A, 70, 28) && ready(e, "bite")) {
        yield* melee(e, A, { tele: 0.45, dash: 200, fw: 30, fh: 18, mult: 1.3, st: POIS(0.2, 4), knock: 1, fx: "heavy", tint: 0xc8ff90 });
        cool(e, "bite", 1.5, 2.2);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 54 });
    }
  },
});
