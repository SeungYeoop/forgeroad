// 7지역 보스 「모래 고래 사하르」 — 유리가 된 사막의 모래 바다를 헤엄치는 고래. 등에는 유리 결정 숲이 자랐다.
// 1단계: 잠수 덮치기 · 모래 간헐천 · 지느러미 물결   2단계: 모래 폭풍 · 들이마시고 내뿜기 · 유리 파편
import { frameOf } from "./core.js";

const SANDC = 0xe0b870, GLASSC = 0x8afff0;
const F = (nm, k = 0) => frameOf("frb6", nm, k);

export async function bossRun6(b, name, R) {
  const host = b.host, fx = host.fx, Rb = b.body, p = b.pl(), P2 = b.phase === 2, j = R.j;
  const dust = (x, n = 3) => { for (let i = 0; i < n; i++) fx.burst("glow", x + (Math.random() - 0.5) * 60, b.groundY - Math.random() * 20, 1, SANDC); };
  b.faceP();
  const map = { sandstorm: "finWave", inhaleExhale: "sandGeyser", crystalShards: "pounce" };
  !P2 && map[name] && (name = map[name]);
  if (P2 && !b._p2) ((b._p2 = 1), (name = "sandstorm"));
  switch (name) {
    case "pounce": {
      // 모래 속으로 잠수 → 지느러미가 플레이어를 쫓는다 → 솟구쳐 덮친다
      for (let r = 0; r < (P2 ? 2 : 1); r++) {
        for (let k = 0; k < 3; k++) (b.frame(F("submerge", k)), dust(b.cx, 4), await b.wait(0.12));
        b.hidden = !0;
        j.play("thud", 0.8);
        for (let t = 0; t < 1.3; t += 0.05) {
          b.frame(F("fin", Math.floor(t * 10) % 4));
          Rb.x += (b.clampX(p.cx, 60) - Rb.x) * 0.12;
          dust(b.cx, 2);
          await b.wait(0.05);
        }
        b.warnBar(b.cx, 160, 0.6);
        await b.wait(0.6);
        b.hidden = !1;
        b.faceP();
        j.play("explosion", 0.9);
        fx.shake(9);
        for (let k = 0; k < 2; k++) {
          b.frame(F("pounce", k));
          k === 0 && (fx.burst("chunk", b.cx, b.groundY - 6, 24, SANDC), b.hitRect(b.cx - 80, b.groundY - 120, 160, 120, 1.6, "earth"));
          await b.wait(0.25);
        }
        b.frame(F("emerge", 2));
        fx.shake(6);
        b.wave(-1, 0.8, 240, SANDC), b.wave(1, 0.8, 240, SANDC);
        await b.wait(0.8);
      }
      b.frame(F("idle"));
      await b.wait(0.3);
      break;
    }
    case "sandGeyser": {
      // 고래가 숨을 뿜듯 모래 기둥이 차례로 솟는다
      b.frame(F("roar"));
      j.play("bossRoar", 0.8);
      await b.wait(0.4);
      const n = P2 ? 7 : 5;
      for (let i = 0; i < n && !b.dead; i++) {
        const x = b.clampX(i % 2 ? p.cx : b.arenaL + Math.random() * (b.arenaR - b.arenaL), 30);
        b.warnBar(x, 50, 0.7);
        host.time.delayedCall(700 / b.speedMul, () => {
          if (b.dead) return;
          for (let q = 0; q < 16; q++) fx.burst("glow", x + (Math.random() - 0.5) * 30, b.groundY - Math.random() * 160, 1, q % 2 ? SANDC : 0xfff0c8);
          fx.burst("chunk", x, b.groundY - 10, 10, SANDC);
          j.play("explosion", 0.4);
          if (b.hitRect(x - 25, b.groundY - 160, 50, 160, 1.1, "earth")) p.body.vy = -600;
        });
        await b.wait(0.35);
      }
      b.frame(F("idle"));
      await b.wait(1.1);
      break;
    }
    case "finWave": {
      // 꼬리를 크게 내리쳐 모래 물결 셋 (뛰어넘는다)
      b.faceP();
      for (let i = 0; i < 3 && !b.dead; i++) {
        b.frame(F("shard"));
        b.warnBar(b.cx + b.facing * 100, 160, 0.4, b.groundY - 4);
        await b.wait(0.4);
        b.frame(F("idle"));
        j.play("thud", 1.2);
        fx.shake(5);
        dust(b.cx + b.facing * 60, 8);
        b.wave(b.facing, 1, 260 + i * 30, SANDC);
        await b.wait(0.45);
      }
      await b.wait(0.6);
      break;
    }
    case "sandstorm": {
      // 모래 폭풍: 시야가 흐려지고 바람이 밀어낸다. 모래 속에서 유리 조각이 날아든다
      b.frame(F("roar"));
      j.play("bossRoar", 1.1);
      host.cameras.main.flash(250, 255, 220, 160);
      host._blindT = Math.max(host._blindT ?? 0, 5);
      const wdir = p.cx > b.cx ? 1 : -1;
      b.wind = wdir * 55;
      for (let t = 0; t < 4.5 && !b.dead; t += 0.15) {
        b.frame(F("idle", Math.floor(t * 6) % 4));
        for (let i = 0; i < 4; i++) fx.burst("glow", b.arenaL + Math.random() * (b.arenaR - b.arenaL), b.groundY - Math.random() * 180, 1, SANDC);
        if (Math.floor(t / 0.15) % 4 === 0) {
          const oy = b.groundY - 20 - Math.random() * 90, ox = wdir > 0 ? b.arenaL + 10 : b.arenaR - 10;
          b.shoot({ sprite: "p_icicle", speed: 320, life: 2.4, radius: 4 }, ox, oy, wdir > 0 ? 0 : Math.PI, 0.6, "earth", null, { tint: GLASSC });
        }
        await b.wait(0.15);
      }
      b.wind = 0;
      b.frame(F("idle"));
      await b.wait(0.6);
      break;
    }
    case "inhaleExhale": {
      // 크게 들이마신다(끌려온다) → 입 앞에서 모래를 내뿜는다 (멀어지거나 위로 피함)
      b.faceP();
      j.play("magic", 1);
      for (let t = 0; t < 2 && !b.dead; t += 0.05) {
        b.frame(F("inhale", Math.floor(t * 8) % 2));
        const dx = b.cx + b.facing * 60 - p.cx;
        Math.abs(dx) < 380 && p.body.onGround && (p.body.x += Math.sign(dx) * 2.4);
        fx.burst("glow", b.cx + b.facing * (100 + Math.random() * 200), b.groundY - Math.random() * 60, 1, SANDC);
        await b.wait(0.05);
      }
      b.warnBar(b.cx + b.facing * 110, 180, 0.3);
      await b.wait(0.3);
      j.play("explosion", 1.2);
      fx.shake(8);
      for (let t = 0; t < 1 && !b.dead; t += 0.08) {
        b.frame(F("exhale", Math.floor(t * 12) % 2));
        for (let i = 0; i < 4; i++) fx.burst("glow", b.cx + b.facing * (70 + Math.random() * 180), b.groundY - 20 - Math.random() * 60, 1, i % 2 ? SANDC : 0xfff0c8);
        Math.floor(t / 0.08) % 3 === 0 && b.hitRect(b.facing > 0 ? b.cx + 40 : b.cx - 240, b.groundY - 80, 200, 80, 0.7, "earth");
        await b.wait(0.08);
      }
      b.frame(F("idle"));
      await b.wait(0.8);
      break;
    }
    case "crystalShards": {
      // 등의 유리 결정을 흔들어 날려 보낸다 → 하늘에서 떨어져 바닥에 박힌다
      b.frame(F("shard"));
      j.play("ice", 1);
      fx.shake(4);
      await b.wait(0.4);
      for (let w = 0; w < 2 && !b.dead; w++) {
        for (let i = 0; i < 6; i++) {
          const x = b.clampX(p.cx + (i - 2.5) * 46 + (w ? 23 : 0), 20);
          b.warnBar(x, 22, 0.6);
          host.time.delayedCall(600 / b.speedMul, () => {
            if (b.dead) return;
            b.shoot({ sprite: "p_icicle", speed: 650, life: 0.6, radius: 6 }, x, b.groundY - 260, Math.PI / 2, 0.8, "earth", null, { tint: GLASSC, scale: 2 });
            host.time.delayedCall(330, () => !b.dead && (fx.burst("glow", x, b.groundY - 10, 6, GLASSC), b.hitRect(x - 12, b.groundY - 48, 24, 48, 0.9, "earth")));
          });
        }
        await b.wait(0.7);
      }
      b.frame(F("idle"));
      await b.wait(1);
      break;
    }
    default:
      await b.wait(0.5);
  }
}
