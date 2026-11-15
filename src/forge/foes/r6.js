// 7지역 「유리 사막」 행동 (그림은 m6.js)
// 화로가 떨어질 때의 열기로 모래가 유리가 된 사막. 신기루가 사람을 홀린다.
import { register } from "./core.js";
import { sandScorpion, desertRaider, sandSpirit, mummy, glassSerpent, mirageMerchant, mirageSorcerer, duneColossus } from "./m6.js";

const DT = 1 / 60, SANDC = 0xe0b870, GLASSC = 0x8afff0;
const POIS = (p = 0.22, d = 4) => ({ type: "poison", chance: 1, dur: d, power: p });
const STUN = (d) => ({ type: "stun", chance: 1, dur: d });

function warnAt(e, x, y, w, dur) {
  const host = e.host;
  const im = host.add.image(x, y, "warn").setOrigin(0.5, 1).setDepth(29).setDisplaySize(w, 6).setAlpha(0.85);
  host.tweens.add({ targets: im, alpha: 0.25, duration: 110, yoyo: !0, repeat: -1 });
  host.time.delayedCall(dur * 1000, () => im.destroy());
}
const near = (e, x, y, w, h) => e.playerInRect(x - w / 2, y - h, w, h);
const dust = (e, x, y, n = 3) => { for (let i = 0; i < n; i++) e.host.fx.burst("glow", x + (Math.random() - 0.5) * 30, y - Math.random() * 20, 1, SANDC); };

// ════════ 모래 전갈 ════════ 집게 두 번 → 꼬리 독침(독 3중첩).
register("fr6_0", {
  ...sandScorpion, speed: 62, sight: 240,
  *brain(e, A) {
    for (;;) {
      if (!e.aggro) {
        A.play("idle"), A.stop();
        yield 0.2;
        continue;
      }
      if (Math.abs(A.dx) > 46) {
        A.play("move"), A.walk(Math.sign(A.dx), e.speed);
        yield 0;
        continue;
      }
      A.stop(1), A.face();
      A.tele(0.45, { bar: [e.cx + e.facing * 30, 50] });
      yield A.once("wind", 8);
      for (let i = 0; i < 2; i++) {
        A.once("claw");
        yield 0.06;
        A.melee(48, 30, 0.8, { knock: 0.6 });
        A.sound("punch", 0.5);
        yield 0.16;
      }
      // 꼬리를 치켜든 뒤 → 독침
      A.tele(0.3);
      yield 0.3;
      A.once("sting");
      yield 0.08;
      if (A.melee(50, 50, 1, { el: "poison", st: POIS(), knock: 1 })) (A.afflict(POIS()), A.afflict(POIS()));
      A.burst("glow", 30, -30, 6, 0xa0ff60);
      A.sound("swing", 0.7);
      yield 0.2;
      yield A.once("rec");
      yield 0.6;
    }
  },
});

// ════════ 사막 약탈자 ════════ 언월도 3연베기. 연막탄을 터뜨리고 등 뒤로 돌아간다.
register("fr6_1", {
  ...desertRaider, speed: 88, sight: 260,
  *brain(e, A) {
    const M = e.fz.mem, host = e.host;
    M.smoke = 2;
    for (;;) {
      M.smoke -= DT;
      if (!e.aggro) {
        A.play("idle"), A.stop();
        yield 0.2;
        continue;
      }
      const d = Math.abs(A.dx), p = A.p;
      if (M.smoke <= 0 && d < 200) {
        M.smoke = 5;
        A.stop(1), A.face();
        yield A.once("smoke");
        host.fx.anim("explode", e.cx, e.cy, { scale: 1.4, tint: 0x8a8070 });
        for (let i = 0; i < 14; i++) host.fx.burst("glow", e.cx + (Math.random() - 0.5) * 50, e.body.y - Math.random() * 50, 1, 0xa09888);
        A.sound("explosion", 0.4);
        e.sprite.setAlpha(0.15);
        yield 0.35;
        // 등 뒤로
        const side = p.facing ?? (Math.random() < 0.5 ? -1 : 1);
        e.body.x = p.cx - side * 36;
        e.body.vx = 0;
        e.sprite.setAlpha(1);
        A.face(side);
        for (let i = 0; i < 6; i++) host.fx.burst("glow", e.cx + (Math.random() - 0.5) * 30, e.body.y - Math.random() * 40, 1, 0xa09888);
        yield 0.15;
      } else if (d > 40) {
        A.play("move"), A.walk(Math.sign(A.dx), e.speed);
        yield 0;
        continue;
      }
      A.stop(1), A.face();
      A.tele(0.4, { bar: [e.cx + e.facing * 30, 56] });
      yield A.once("wind", 10);
      for (const [nm, m] of [["s1", 0.7], ["s2", 0.7], ["s3", 1.1]]) {
        A.once(nm);
        e.body.vx = e.facing * 140;
        yield 0.05;
        A.melee(50, 44, m, { knock: nm === "s3" ? 1.6 : 0.5 });
        A.fxSlash(26, -26, 1.1, 0xfff0c0);
        A.sound("swing", 0.7);
        A.stop(1);
        yield nm === "s3" ? 0.22 : 0.11;
      }
      yield 0.8;
    }
  },
});

// ════════ 모래 정령 ════════ 회오리 둘을 바닥으로 보낸다. 맞으면 하늘로 띄운다.
register("fr6_2", {
  ...sandSpirit, speed: 60, sight: 280,
  *brain(e, A) {
    const M = e.fz.mem, host = e.host;
    M.cd = 1.4;
    M.ph = Math.random() * 6;
    for (;;) {
      M.cd -= DT, M.ph += DT;
      const p = A.p;
      A.play("idle");
      if (!e.aggro) {
        A.flyTo(e.homeX + Math.sin(M.ph) * 30, e.body.y, 30);
        yield 0;
        continue;
      }
      A.flyTo(p.cx - Math.sign(A.dx || 1) * 130, p.body.y - 30 + Math.sin(M.ph * 2) * 10, e.speed);
      if (M.cd <= 0 && Math.abs(A.dx) < 280) {
        M.cd = 3.8;
        e.body.vx *= 0.1, e.body.vy *= 0.1;
        A.face();
        A.tele(0.5);
        yield A.once("wind");
        A.once("cast");
        A.sound("magic", 0.6);
        // 회오리 둘: 플레이어 쪽으로 바닥을 따라 간다
        const gy = p.body.y, dir = e.facing;
        for (let w = 0; w < 2; w++) {
          let x = e.cx + dir * (10 + w * 30), t = 0, hit = !1;
          const ev = host.time.addEvent({
            delay: 30, repeat: 80,
            callback: () => {
              t += 0.03;
              x += dir * (130 + w * 30) * 0.03;
              for (let i = 0; i < 3; i++) host.fx.burst("glow", x + Math.sin(t * 20 + i * 2) * (6 + i * 3), gy - i * 12 - Math.random() * 8, 1, i % 2 ? SANDC : 0xfff0c8);
              if (!hit && near(e, x, gy + 4, 26, 60)) {
                hit = !0;
                e.hit(0.8, !1, "wind", null, 0.3);
                const P = host.player;
                P.body.vy = -560;
                P.body.vx = dir * 60;
              }
              if (t > 2.3 || hit) ev.remove();
            },
          });
          yield 0.25;
        }
        yield 0.5;
      }
      yield 0;
    }
  },
});

// ════════ 붕대 미라 ════════ 붕대를 던져 1.5초 묶는다. 불에 약하다(피해 1.6배).
register("fr6_3", {
  ...mummy, speed: 32, sight: 240,
  damage(e, dmg, C) {
    if (C?.element === "fire") return (e.host.fx.burst("rise", e.cx, e.cy, 6, 0xff8a30), dmg * 1.6);
    return dmg;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    M.bind = 1.5;
    for (;;) {
      M.bind -= DT;
      if (!e.aggro) {
        A.play("idle"), A.stop();
        yield 0.2;
        continue;
      }
      const d = Math.abs(A.dx), p = A.p;
      if (M.bind <= 0 && d < 130 && Math.abs(A.dy) < 30) {
        M.bind = 5;
        A.stop(1), A.face();
        A.tele(0.5, { bar: [e.cx + e.facing * 65, 120] });
        yield A.once("wind", 7);
        A.once("bind");
        A.sound("dash", 0.5);
        yield 0.1;
        if (Math.sign(p.cx - e.cx) === e.facing && d < 135 && Math.abs(p.cy - (e.body.y - 30)) < 24 && !(p.dashT > 0)) {
          e.hit(0.6, !1, "phys", STUN(1.5), 0);
          A.afflict(STUN(1.5));
          // 끌어당긴다
          for (let t = 0; t < 0.4; t += DT) ((p.body.x += (e.cx + e.facing * 26 - p.body.x) * 0.15), yield 0);
        }
        yield 0.6;
        continue;
      }
      if (d > 36) {
        A.play("move"), A.walk(Math.sign(A.dx), e.speed);
        yield 0;
        continue;
      }
      A.stop(1), A.face();
      A.tele(0.5, { bar: [e.cx + e.facing * 22, 40] });
      yield A.once("wind", 7);
      A.once("bind", 14);
      yield 0.08;
      A.melee(38, 44, 1, { knock: 1 });
      A.sound("punch", 0.6);
      yield 0.9;
    }
  },
});

// ════════ 유리 뱀 ════════ 모래 속을 헤엄친다(거의 안 맞음). 발밑에서 솟아올라 문다.
register("fr6_4", {
  ...glassSerpent, speed: 110, sight: 260,
  damage(e, dmg) {
    return e.fz?.mem.under ? dmg * 0.2 : dmg;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    M.under = 1;
    for (;;) {
      if (!e.aggro) {
        A.play("swim", 6), A.stop();
        yield 0.2;
        continue;
      }
      // 모래 속 추격
      M.under = 1;
      for (let t = 0; t < 1.6 && Math.abs(A.dx) > 16; t += DT) {
        A.play("swim");
        A.walk(Math.sign(A.dx), e.speed, { climb: !1 });
        Math.random() < 0.3 && dust(e, e.cx, e.body.y, 1);
        yield 0;
      }
      A.stop(1);
      warnAt(e, e.cx, e.body.y, 50, 0.45);
      A.tele(0.45);
      yield 0.45;
      M.under = 0;
      A.face();
      A.once("rise");
      dust(e, e.cx, e.body.y, 10);
      A.sound("explosion", 0.4);
      near(e, e.cx, e.body.y + 2, 46, 60) && e.hit(1.1, !0, "earth", null, 1.4);
      yield 0.3;
      // 바로 앞을 문다
      A.once("bite");
      yield 0.08;
      A.melee(56, 50, 1.1, { up: 10, knock: 1.2 });
      A.sound("punch", 0.6);
      yield 0.5;
      A.play("idle");
      yield 1.2;
    }
  },
});

// ════════ 신기루 상인 ════════ 보물상자인 척한다. 열려고 다가오면 적 셋을 풀어놓고 달아난다.
register("fr6_5", {
  ...mirageMerchant, speed: 70, sight: 120,
  *brain(e, A) {
    const M = e.fz.mem, host = e.host;
    // 상자인 척
    for (;;) {
      A.play("chest");
      e.body.vx = 0;
      e.aggro = !1;
      if (Math.abs(A.dx) < 56 && Math.abs(A.dy) < 50 || e.hp < e.maxHp) break;
      yield 0.1;
    }
    yield A.once("open");
    host.fx.anim("ring", e.cx, e.body.y - 12, { scale: 2, tint: 0xffd860 });
    A.sound("buff", 0.6);
    for (const [i, id] of [["fr6_0"], ["fr6_1"], ["fr6_3"]].map((v, i) => [i, v[0]])) {
      const s = host.spawnEnemy(id, e.cx + (i - 1) * 30, e.body.y - 8, { summoned: !0, noGold: !0 });
      s && ((s.aggro = !0), (s.body.vy = -300));
    }
    yield 0.4;
    // 킬킬대며 달아난다
    e.aggro = !0;
    for (;;) {
      A.play("move");
      A.walk(-Math.sign(A.dx) || 1, e.speed, { climb: !0 });
      A.face(-Math.sign(A.dx) || 1);
      Math.random() < 0.05 && A.burst("glow", 0, -40, 2, 0xffd860);
      yield 0;
    }
  },
});

// ════════ [정예] 신기루 술사 ════════ 가짜 분신 다섯(한 대에 사라짐) · 긴 조준선 뒤 저격.
register("fr6_e0", {
  ...mirageSorcerer, speed: 44, sight: 340,
  init(e) {
    if (e.opts.fake) ((e.fz.mem.fake = 1), (e.maxHp = e.hp = 1), e.sprite.setAlpha(0.85));
  },
  die(e) {
    if (e.fz?.mem.fake) for (let i = 0; i < 8; i++) e.host.fx.burst("glow", e.cx + (Math.random() - 0.5) * 30, e.cy + (Math.random() - 0.5) * 40, 1, GLASSC);
  },
  *brain(e, A) {
    const M = e.fz.mem, host = e.host;
    M.cd = 2;
    M.fakes = M.fake ? 99 : 1.5;
    M.life = 9;
    for (;;) {
      M.cd -= DT, M.fakes -= DT;
      if (M.fake && (M.life -= DT) <= 0) {
        e.hp = 0;
        e.die();
        return;
      }
      if (!e.aggro) {
        A.play("idle"), A.stop();
        yield 0.2;
        continue;
      }
      const d = Math.abs(A.dx), p = A.p;
      if (M.fakes <= 0) {
        M.fakes = 13;
        A.stop(1);
        yield A.once("cast");
        host.cameras.main.flash(150, 255, 240, 200);
        A.sound("magic", 0.8);
        for (let i = 0; i < 5; i++) {
          const x = p.cx + (i - 2) * 70 + (i === 2 ? 140 : 0);
          const c = host.spawnEnemy("fr6_e0", x, e.body.y - 6, { fake: 1, summoned: !0, noGold: !0 });
          c && (c.aggro = !0);
          host.fx.anim("ring", x, e.body.y - 30, { scale: 1.2, tint: GLASSC });
        }
        // 본체도 자리를 바꿔 섞인다
        e.body.x = p.cx + (Math.random() < 0.5 ? -1 : 1) * 180;
        yield 0.4;
        continue;
      }
      if (d < 140) (A.play("move"), A.walk(-Math.sign(A.dx), e.speed, { climb: !1 }), A.face());
      else if (d > 300) (A.play("move"), A.walk(Math.sign(A.dx), e.speed));
      else (A.stop(0.5), A.play("idle"), A.face());
      if (M.cd <= 0 && d < 360) {
        M.cd = M.fake ? 3 : 3.6;
        A.stop(1), A.face();
        const ox = e.cx + e.facing * 20, oy = e.body.y - 44, ang = Math.atan2(p.cy - oy, p.cx - ox);
        A.once("snipe", 3);
        // 조준선 (점점 굵어짐)
        const g = host.add.image(ox, oy, "warn").setOrigin(0, 0.5).setDepth(29).setDisplaySize(420, 2).setRotation(ang).setAlpha(0.7);
        host.tweens.add({ targets: g, displayHeight: 6, duration: 800 });
        yield 0.9;
        g.destroy();
        A.once("snipe", 12);
        // 광선
        const L = 420, steps = 28;
        for (let i = 0; i < steps; i++) host.fx.burst("glow", ox + Math.cos(ang) * (L * i) / steps, oy + Math.sin(ang) * (L * i) / steps, 1, M.fake ? 0xb0c0c0 : GLASSC);
        A.sound("shoot", 0.8);
        if (!M.fake) {
          const P = host.player, vx = P.cx - ox, vy = P.cy - oy, along = vx * Math.cos(ang) + vy * Math.sin(ang), perp = Math.abs(-vx * Math.sin(ang) + vy * Math.cos(ang));
          along > 0 && along < L && perp < 14 && !(P.dashT > 0) && e.hit(1.8, !1, "light", null, 1.2);
        }
        yield 0.5;
      }
      yield 0;
    }
  },
});

// ════════ [정예] 모래 거상 ════════ 모래 주먹 · 흩어져 3초 무적(다가와서 다시 뭉침) · 모래 해일.
register("fr6_e1", {
  ...duneColossus, speed: 26, sight: 320, heavy: 1, hpMul: 1.2,
  damage(e, dmg) {
    return e.fz?.mem.sand ? (dust(e, e.cx, e.cy, 2), 0) : dmg;
  },
  *brain(e, A) {
    const M = e.fz.mem, host = e.host;
    M.disperse = 4;
    M.wave = 3;
    for (;;) {
      M.disperse -= DT, M.wave -= DT;
      if (!e.aggro) {
        A.play("idle"), A.stop();
        yield 0.2;
        continue;
      }
      const d = Math.abs(A.dx), p = A.p;
      if (M.disperse <= 0 && (e.hp < e.maxHp * 0.8 || d > 160)) {
        M.disperse = 9;
        A.stop(1);
        yield A.once("disperse");
        M.sand = 1;
        e.sprite.setAlpha(0.25);
        A.sound("magic", 0.6);
        for (let t = 0; t < 3 && !e.dead; t += DT) {
          A.walk(Math.sign(A.dx) || 1, 120, { jumpGaps: !0 });
          dust(e, e.cx, e.body.y, 2);
          if (Math.abs(A.dx) < 20) break;
          yield 0;
        }
        A.stop(1);
        warnAt(e, e.cx, e.body.y, 90, 0.4);
        yield 0.4;
        e.sprite.setAlpha(1);
        M.sand = 0;
        yield A.once("form", 14);
        A.melee(50, 90, 1.5, { back: -50, knock: 2 });
        e.hit && near(e, e.cx, e.body.y, 90, 90) && (host.player.body.vy = -420);
        A.shake(6);
        A.sound("thud", 1.2);
        yield 0.8;
        continue;
      }
      if (M.wave <= 0 && d < 300) {
        M.wave = 7;
        A.stop(1), A.face();
        A.tele(0.8, { bar: [e.cx + e.facing * 150, 280] });
        yield A.once("tsunami", 4);
        A.shake(7);
        A.sound("explosion", 1);
        // 모래 해일: 높은 모래벽이 앞으로 밀려간다
        const dir = e.facing, gy = e.body.y;
        let x = e.cx + dir * 30, hit = !1, t = 0;
        const ev = host.time.addEvent({
          delay: 30, repeat: 60,
          callback: () => {
            t += 0.03;
            x += dir * 230 * 0.03;
            for (let i = 0; i < 5; i++) host.fx.burst("glow", x + (Math.random() - 0.5) * 20, gy - i * 14 - Math.random() * 10, 1, i % 2 ? SANDC : 0xc89a58);
            if (!hit && near(e, x, gy + 4, 34, 80)) ((hit = !0), e.hit(1.6, !1, "earth", null, 2.6));
            if (t > 1.6 || e.dead) ev.remove();
          },
        });
        yield 1;
        continue;
      }
      if (d > 64) {
        A.play("move"), A.walk(Math.sign(A.dx), e.speed);
        yield 0;
        continue;
      }
      A.stop(1), A.face();
      A.tele(0.6, { bar: [e.cx + e.facing * 40, 80] });
      yield A.once("wind", 5);
      A.once("punch");
      yield 0.08;
      A.melee(80, 60, 1.6, { knock: 2.2 });
      A.fxHeavy(44, -40, 1.8, 0xfff0c0);
      dust(e, e.cx + e.facing * 60, e.body.y, 8);
      A.sound("thud", 1.1);
      A.shake(4);
      yield 1;
    }
  },
});
