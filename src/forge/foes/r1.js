// 2지역 「안개 숲」 행동 (그림은 m1.js)
// 화로가 떨어질 때 튀어나간 증기가 식어 숲 전체에 짙은 안개로 남았다. 숲의 것들은 안개 속에서 사냥한다.
import { register } from "./core.js";
import { mossWolf, mistFairy, rootVine, sporeShroom, hunterWraith, thornHog, elderTreant, mistTwins } from "./m1.js";

const DT = 1 / 60, MIST = 0xc8fff0, POISON = 0x9aff60;
const POIS = (p = 0.2, d = 3) => ({ type: "poison", chance: 1, dur: d, power: p });

// ════════ 이끼 늑대 ════════ 2~3마리가 양쪽에서 포위. 도약 물기.
register("fr1_0", {
  ...mossWolf, speed: 120, sight: 260,
  *brain(e, A) {
    const M = e.fz.mem;
    M.side = Math.random() < 0.5 ? -1 : 1; // 왼쪽·오른쪽 중 어느 쪽으로 돌아갈지
    for (;;) {
      if (!e.aggro) {
        A.play("idle"), A.stop();
        yield 0.2;
        continue;
      }
      // 무리 중 내 순번에 따라 반대편으로 돌아 들어간다
      const pack = e.host.enemies.filter((o) => o.def.id === e.def.id && !o.dead && o.aggro);
      const idx = pack.indexOf(e);
      const side = idx % 2 ? -M.side : M.side;
      const tx = A.p.cx + side * 58;
      if (Math.abs(e.cx - tx) > 14 && Math.abs(A.dx) > 30) {
        A.play("move"), A.walk(Math.sign(tx - e.cx), e.speed);
        yield 0;
        continue;
      }
      // 낮게 웅크렸다가 → 도약 물기
      A.face(), A.stop(1);
      A.tele(0.35);
      yield A.once("wind", 9);
      A.once("atk");
      e.body.vx = e.facing * 300;
      e.body.vy = -260;
      A.sound("dash", 0.5);
      let hit = !1;
      for (let t = 0; t < 0.4; t += DT) {
        !hit && A.melee(18, 16, 1, { knock: 1.2 }) && ((hit = !0), A.burst("spark", 10, -10, 6, 0xffffff));
        yield 0;
      }
      yield A.once("rec");
      M.side = -M.side;
      yield 0.5 + Math.random() * 0.5;
    }
  },
});

// ════════ 안개 요정 ════════ 플레이어 주변에 안개탄. 맞으면 3초간 시야가 좁아진다.
register("fr1_1", {
  ...mistFairy, speed: 80, sight: 260,
  *brain(e, A) {
    const M = e.fz.mem;
    M.cd = 1.5;
    M.ph = Math.random() * 6;
    for (;;) {
      M.cd -= DT, M.ph += DT;
      A.play("idle");
      if (!e.aggro) {
        A.flyTo(e.homeX + Math.sin(M.ph) * 30, e.body.y + Math.cos(M.ph * 2) * 0.3, 30);
        yield 0;
        continue;
      }
      const p = A.p;
      A.flyTo(p.cx - Math.sign(A.dx || 1) * 110 + Math.sin(M.ph) * 20, p.body.y - 70 + Math.cos(M.ph * 1.7) * 10, e.speed);
      if (M.cd <= 0) {
        M.cd = 3.2;
        A.face();
        e.body.vx *= 0.3, e.body.vy *= 0.3;
        A.tele(0.5);
        yield A.once("wind", 6);
        A.once("cast");
        // 안개탄: 직접 날려서 맞으면 시야 축소
        const host = e.host, ox = e.cx + e.facing * 8, oy = e.body.y - 14;
        const tx = p.cx, ty = p.cy, T = 0.8;
        const orb = host.add.image(ox, oy, "vx_glow").setTint(MIST).setScale(0.45).setDepth(14);
        for (let t = 0; t < T; t += DT) {
          const u = t / T;
          orb.setPosition(ox + (tx - ox) * u, oy + (ty - oy) * u - Math.sin(u * Math.PI) * 30);
          Math.random() < 0.5 && host.fx.burst("glow", orb.x, orb.y, 1, MIST);
          if (Math.abs(p.cx - orb.x) < 12 && Math.abs(p.cy - orb.y) < 16) break;
          yield 0;
        }
        host.fx.anim("ring", orb.x, orb.y, { scale: 1.6, tint: MIST });
        host.fx.burst("glow", orb.x, orb.y, 14, MIST);
        Math.abs(p.cx - orb.x) < 30 && Math.abs(p.cy - orb.y) < 30 && (A.blind(3), e.hit(0.5, !1, "wind"));
        orb.destroy();
        yield 0.3;
      }
      yield 0;
    }
  },
});

// ════════ 뿌리 덩굴 ════════ 땅속에 숨어 있다가 덩굴 채찍. 맞으면 1초 속박.
register("fr1_2", {
  ...rootVine, speed: 1, sight: 160, heavy: 1,
  damage(e, dmg) {
    // 숨어 있을 때는 새싹만 맞는다
    return e.fz?.mem.hidden ? dmg * 0.3 : dmg;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    for (;;) {
      e.body.vx = 0;
      M.hidden = !0;
      A.play("hide");
      if (!(e.aggro && Math.abs(A.dx) < 74 && Math.abs(A.dy) < 50)) {
        yield 0.1;
        continue;
      }
      // 솟구친다
      A.burst("dust", 0, -2, 8, 0x6a5040);
      A.sound("thud", 0.5);
      M.hidden = !1;
      yield A.once("emerge");
      for (let n = 0; n < 2 + (Math.random() < 0.5 ? 1 : 0); n++) {
        A.face();
        A.tele(0.4);
        yield A.once("wind", 8);
        yield 0.06;
        A.once("atk");
        yield 0.06;
        if (A.melee(56, 50, 1, { knock: 0.5 })) A.afflict({ type: "stun", chance: 1, dur: 1 });
        A.fxSlash(26, -36, 1.3, 0xa0d060);
        A.sound("swing", 0.7);
        yield 0.15;
        yield A.once("rec");
        A.play("idle");
        yield 0.5;
      }
      yield A.once("sink");
      yield 1.2;
    }
  },
});

// ════════ 포자 버섯 ════════ 공격받으면 독포자를 뿜는다. 주변 적에게도 중독.
register("fr1_3", {
  ...sporeShroom, speed: 14, sight: 200,
  damage(e, dmg) {
    e.fz && (e.fz.mem.puffNow = !0);
    return dmg;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    M.cd = 0;
    M.auto = 3;
    for (;;) {
      M.cd -= DT, M.auto -= DT;
      if ((M.puffNow && M.cd <= 0) || (e.aggro && Math.abs(A.dx) < 60 && M.auto <= 0)) {
        M.puffNow = !1;
        M.cd = 1.2;
        M.auto = 4;
        A.stop(1);
        A.once("puff");
        yield 0.25;
        // 독포자 구름: 플레이어 + 주변 적 모두 중독
        A.zone(e.cx, e.body.y, 64, 3, 0.15, { el: "poison", st: POIS(0.2, 3), kind: "poison" });
        e.host.fx.anim("ring", e.cx, e.body.y - 20, { scale: 2.5, tint: POISON });
        A.burst("glow", 0, -24, 20, POISON);
        for (const o of e.host.enemies) o !== e && !o.dead && Math.hypot(o.cx - e.cx, o.cy - e.cy) < 64 && o.statuses.apply(POIS(0.3, 3), 0);
        A.sound("magic", 0.4);
        yield 0.5;
        continue;
      }
      // 느릿느릿 어슬렁
      if (e.aggro && Math.abs(A.dx) > 50) (A.play("move"), A.walk(Math.sign(A.dx), e.speed));
      else (A.play("idle"), A.stop());
      yield 0;
    }
  },
});

// ════════ 사냥꾼 망령 ════════ 나무 위에서 숨은 채 활을 쏜다. 쏠 때만 모습이 보인다.
register("fr1_4", {
  ...hunterWraith, speed: 50, sight: 320, flying: !0,
  tick(e) {
    // 모습: 숨으면 거의 투명, 쏠 때 드러남
    const M = e.fz.mem, want = M.show ? 1 : 0.12;
    M.alpha = (M.alpha ?? 0.12) + (want - (M.alpha ?? 0.12)) * 0.15;
    e.sprite.setAlpha(M.alpha);
  },
  damage(e, dmg) {
    return e.fz?.mem.show ? dmg : dmg * 0.5;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    M.cd = 1.5;
    M.y0 = e.body.y - 40; // 나무 높이쯤 떠 있는다
    for (;;) {
      M.cd -= DT;
      const p = A.p;
      if (!e.aggro) {
        A.play("idle");
        A.flyTo(e.homeX, M.y0, 30);
        yield 0;
        continue;
      }
      // 거리 200 안팎을 유지하며 높이 떠 있다
      const want = p.cx - Math.sign(A.dx || 1) * 200;
      A.play(Math.abs(e.cx - want) > 20 ? "move" : "idle");
      A.flyTo(want, Math.min(M.y0, p.body.y - 50), e.speed);
      A.face();
      if (M.cd <= 0) {
        M.cd = 2.6;
        M.show = !0;
        e.body.vx *= 0.2, e.body.vy *= 0.2;
        A.tele(0.6);
        yield A.once("draw", 8);
        yield 0.08;
        A.once("shoot");
        const ox = e.cx + e.facing * 16, oy = e.body.y - 28;
        A.shoot({ sprite: "p_arrow", speed: 560, gravity: 60, life: 1.6, radius: 5, trail: MIST }, ox, oy, Math.atan2(p.cy - oy, p.cx - ox), 1.1, { el: "wind", opts: { tint: 0xa8fff0 } });
        A.sound("bow", 0.7);
        yield 0.5;
        M.show = !1;
      }
      yield 0;
    }
  },
});

// ════════ 가시 고슴도치 ════════ 몸을 말고 굴러온다. 구르는 중 정면 공격은 튕겨낸다.
register("fr1_5", {
  ...thornHog, speed: 40, sight: 220,
  blocks(e, S) {
    const r = e.fz?.mem.rolling && S.dir === -e.facing;
    r && e.host.fx.burst("spark", e.cx + e.facing * 8, e.cy, 6, 0xffe0a0);
    return !!r;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    M.cd = 1;
    for (;;) {
      M.cd -= DT;
      M.rolling = !1;
      if (!e.aggro) {
        A.play("idle"), A.stop();
        yield 0.2;
        continue;
      }
      const d = Math.abs(A.dx);
      if (d < 170 && M.cd <= 0 && Math.abs(A.dy) < 30) {
        // 몸을 말아 → 굴러 들이받기
        A.face(), A.stop(1);
        A.tele(0.45, { bar: [e.cx + e.facing * 80, 160] });
        yield A.once("curl", 7);
        M.rolling = !0;
        A.play("roll");
        A.sound("dash", 0.6);
        let dir = e.facing, hit = !1;
        for (let t = 0; t < 1.6; t += DT) {
          e.body.vx = dir * 240;
          e.facing = dir;
          if (e.body.hitWall) ((dir = -dir), A.shake(2), A.burst("spark", 8, -8, 6, 0xffe0a0));
          !hit && A.melee(16, 18, 1.1, { knock: 1.6 }) && ((hit = !0), (dir = -dir));
          Math.random() < 0.3 && A.burst("dust", -6, -2, 1, 0x8a7058);
          yield 0;
        }
        M.rolling = !1;
        A.stop(1);
        A.play("idle");
        M.cd = 2.5;
        yield 0.9; // 어지러움 (빈틈)
        continue;
      }
      if (d > 60) (A.play("move"), A.walk(Math.sign(A.dx), e.speed));
      else (A.play("idle"), A.stop());
      yield 0;
    }
  },
});

// ════════ [정예] 거목 수호자 ════════ 느린 팔 강타 · 뿌리 기둥 3개가 차례로 솟음 · 체력 30% 이하에서 꽃이 피고 매초 회복.
register("fr1_e0", {
  ...elderTreant, speed: 26, sight: 260, heavy: 1,
  tick(e, A) {
    const M = e.fz.mem;
    if (e.hp < e.maxHp * 0.3) {
      !M.bloom && ((M.bloom = 1), A.burst("glow", 0, -60, 24, 0xffa8d0));
      M.healT = (M.healT ?? 0) + DT;
      M.healT >= 1 && ((M.healT = 0), (e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.02)), A.burst("rise", 0, -40, 4, 0xffa8d0));
    }
  },
  *brain(e, A) {
    const M = e.fz.mem;
    M.roots = 3;
    for (;;) {
      M.roots -= DT;
      const B = M.bloom ? "b" : "";
      if (!e.aggro) {
        A.play(B + "idle"), A.stop();
        yield 0.2;
        continue;
      }
      const d = Math.abs(A.dx);
      // 뿌리 기둥: 플레이어 쪽으로 세 개가 차례로 솟는다
      if (M.roots <= 0 && d < 220) {
        M.roots = 5;
        A.stop(1), A.face();
        yield A.once("summon", 6);
        const host = e.host, gy = e.body.y;
        for (let i = 0; i < 3; i++) {
          const x = e.cx + e.facing * (40 + i * 34);
          const warn = host.add.image(x, gy, "warn").setOrigin(0.5, 1).setDepth(29).setDisplaySize(26, 6).setAlpha(0.85);
          host.time.delayedCall(450, () => {
            warn.destroy();
            if (e.dead) return;
            host.fx.anim("tentacle_up", x, gy, { scale: 1.4, tint: 0x8a6a40 });
            host.fx.burst("chunk", x, gy - 4, 8, 0x6a4a32);
            A.shake(2);
            const P = host.player;
            !P.dead && Math.abs(P.cx - x) < 15 && Math.abs(P.body.y - gy) < 10 && e.hit(1.2, !1, "earth", null, 1.6);
          });
          yield 0.28;
        }
        yield 0.6;
        continue;
      }
      if (d > 50) {
        A.play(B + "move"), A.walk(Math.sign(A.dx), e.speed);
        yield 0;
        continue;
      }
      // 느린 팔 강타
      A.stop(1), A.face();
      A.tele(0.75, { bar: [e.cx + e.facing * 36, 70] });
      yield A.once("wind", 5.5);
      yield 0.15;
      A.once("slam");
      yield 0.07;
      A.melee(64, 56, 1.5, { el: "earth", knock: 2 });
      A.shake(5);
      A.sound("thud", 1.2);
      A.burst("chunk", 36, -2, 14, 0x6a4a32);
      e.host.fx.anim("fx_smash", e.cx + e.facing * 36, e.body.y - 10, { scale: 1.6, tint: 0xa0d060 });
      yield 0.3;
      yield A.once("rec");
      yield 0.5;
    }
  },
});

// ════════ [정예] 안개 쌍둥이 마녀 ════════ 언니는 순간이동하며 독 구슬, 동생은 분신 셋. 한 명이 죽으면 5초 뒤 다른 한 명이 되살린다.
register("fr1_e1", {
  ...mistTwins, speed: 60, sight: 280, flying: !0,
  init(e) {
    const M = e.fz.mem;
    M.young = e.opts.twin === "b";
    // 언니가 나타나면 동생을 데려온다
    if (!M.young && !e.opts.summoned) {
      const s = e.host.spawnEnemy(e.def.id, e.cx + 50, e.body.y, { twin: "b", traits: e.traits?.length ? [e.traits[0]] : [] });
      s && ((s.aggro = e.aggro), (s.fz || {}), (e._twin = s), (s._twin = e));
    }
  },
  die(e) {
    const o = e._twin, host = e.host;
    if (!o || o.dead || (e.opts.revives ?? 0) >= 2) return;
    // 5초 뒤 남은 한 명이 되살린다
    const x = e.cx, y = e.body.y, twin = e.opts.twin, n = (e.opts.revives ?? 0) + 1;
    host.time.delayedCall(5000, () => {
      if (o.dead || host.dying) return;
      host.fx.anim("ring", o.cx, o.cy, { scale: 3, tint: POISON });
      const r = host.spawnEnemy(e.def.id, x, y, { twin, revives: n, summoned: !0, noGold: !0, traits: e.traits });
      r && ((r.aggro = !0), (r._twin = o), (o._twin = r), host.fx.burst("glow", x, y - 20, 24, POISON));
    });
  },
  *brain(e, A) {
    const M = e.fz.mem, P = M.young ? "b_" : "";
    M.cd = 1 + Math.random();
    M.ph = Math.random() * 6;
    for (;;) {
      M.cd -= DT, M.ph += DT;
      const p = A.p;
      if (!e.aggro) {
        A.play(P + "idle");
        A.flyTo(e.homeX, e.homeY ?? e.body.y, 20);
        yield 0.05;
        continue;
      }
      A.play(P + "idle");
      A.flyTo(p.cx + Math.cos(M.ph * 0.8) * 120, p.body.y - 30 + Math.sin(M.ph * 1.3) * 16, e.speed);
      A.face();
      if (M.cd > 0) {
        yield 0;
        continue;
      }
      M.cd = M.young ? 4.5 : 2.6;
      if (!M.young) {
        // 언니: 안개 속으로 사라졌다가 다른 곳에서 나타나 독 구슬 셋
        yield A.once("tele", 9);
        A.burst("glow", 0, -20, 14, MIST);
        e.body.x = p.cx + (Math.random() < 0.5 ? -1 : 1) * (90 + Math.random() * 40);
        e.body.y = p.body.y - 20;
        A.face();
        A.burst("glow", 0, -20, 14, MIST);
        A.tele(0.4);
        yield A.once("cast", 8);
        for (let i = -1; i <= 1; i++) {
          const ox = e.cx + e.facing * 10, oy = e.body.y - 36;
          A.shoot({ sprite: "p_orb", speed: 200, life: 2.4, radius: 6, aoe: 22, trail: POISON }, ox, oy, Math.atan2(p.cy - oy, p.cx - ox) + i * 0.25, 0.8, { el: "poison", st: POIS(0.25, 3), opts: { tint: 0x9aff60 } });
        }
        A.sound("magic", 0.6);
        yield 0.6;
      } else {
        // 동생: 분신 셋 (닿으면 독, 맞으면 사라짐)
        A.tele(0.5);
        yield A.once("b_cast", 7);
        const host = e.host;
        for (let i = 0; i < 3; i++) {
          const x = p.cx + (i - 1) * 70, y = p.body.y - 16;
          const c = host.add.sprite(e.cx, e.body.y, `e_${e.def.id}`, e.sprite.frame.name).setOrigin(0.5, 1).setDepth(10).setAlpha(0.65).setTint(0xc0ffe8);
          host.tweens.add({ targets: c, x, y, duration: 500, ease: "Sine.easeOut" });
          let life = 4;
          const tk = host.time.addEvent({
            delay: 100, repeat: 40,
            callback: () => {
              life -= 0.1;
              const P = host.player;
              if (!c.active) return;
              c.x += Math.sign(P.cx - c.x) * 4;
              if (Math.abs(P.cx - c.x) < 12 && Math.abs(P.cy - (c.y - 18)) < 20) (e.hit(0.6, !1, "poison", POIS(0.2, 2)), host.fx.burst("glow", c.x, c.y - 18, 10, POISON), c.destroy());
              else if (P.attackingNear?.(c.x) || life <= 0) (host.fx.burst("glow", c.x, c.y - 18, 8, MIST), c.destroy());
            },
          });
          void tk;
        }
        yield 0.8;
      }
    }
  },
});
