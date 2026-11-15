// 3지역 보스 「광맥 포식자 그라우크」 — 광부들이 너무 깊이 파서 깨운 것. 광석째 바위를 삼킨다.
// 1단계: 솟구침 · 바위 토하기 · 몸통 휩쓸기   2단계: 낙석 · 흡입 · 빛나는 광석 폭발
import { frameOf } from "./core.js";

const ORE = 0x5af0d8, ROCKC = 0x8a7a6a;
const F = (nm, k = 0) => frameOf("frb2", nm, k);

export async function bossRun2(b, name, R) {
  const host = b.host, fx = host.fx, Rb = b.body, p = b.pl(), P2 = b.phase === 2, j = R.j;
  b.faceP();
  const map = { rockfall: "erupt", inhale: "spit", oreBurst: "sweep" };
  !P2 && map[name] && (name = map[name]);
  if (P2 && !b._p2) ((b._p2 = 1), (name = "rockfall"));
  const dust = (x, n = 8) => fx.burst("dust", x, b.groundY - 2, n, 0xa09080);
  switch (name) {
    case "erupt": {
      // 땅속으로 파고들어 플레이어 발밑에서 솟구친다 (두세 번)
      for (let r = 0; r < (P2 ? 3 : 2); r++) {
        b.frame(F("dive", 0));
        await b.wait(0.2);
        b.frame(F("dive", 1));
        await b.wait(0.2);
        b.frame(F("hide"));
        b.hidden = !0;
        j.play("thud", 0.8);
        // 흙먼지가 플레이어를 쫓는다
        for (let t = 0; t < 0.9; t += 0.05) {
          Rb.x += (b.clampX(p.cx, 40) - Rb.x) * 0.25;
          dust(b.cx, 2);
          await b.wait(0.05);
        }
        b.warnBar(b.cx, 70, 0.5);
        await b.wait(0.5);
        b.hidden = !1;
        b.frame(F("rise"));
        fx.shake(8);
        j.play("explosion", 0.8);
        fx.burst("chunk", b.cx, b.groundY - 6, 22, ROCKC);
        b.hitRect(b.cx - 36, b.groundY - 110, 72, 110, 1.4, "earth");
        await b.wait(0.7);
      }
      b.frame(F("idle"));
      await b.wait(0.5);
      break;
    }
    case "spit": {
      // 바위를 포물선으로 토한다 (부채꼴 세 개 × 두 번)
      for (let r = 0; r < 2; r++) {
        b.faceP();
        b.frame(F("roar"));
        j.play("bossRoar", 0.5);
        await b.wait(0.45);
        b.frame(F("spit"));
        const ox = b.cx + b.facing * 30, oy = Rb.y - Rb.h;
        for (let i = 0; i < 3; i++) {
          const tx = b.clampX(p.cx + (i - 1) * 50, 20), T = 0.9 + i * 0.1;
          b.ballistic({ sprite: "p_rock", speed: 240, life: 3, radius: 7, aoe: 32 }, tx, b.groundY - 10, T, 1.1, "earth");
        }
        j.play("shoot", 1);
        await b.wait(0.6);
      }
      await b.wait(0.4);
      break;
    }
    case "sweep": {
      // 몸을 낮게 눕혀 바닥을 휩쓴다 (점프로 피하기)
      b.frame(F("roar"));
      b.warnBar(b.cx + b.facing * 70, 150, 0.6);
      await b.wait(0.6);
      for (let k = 0; k < 2; k++) {
        b.frame(F("sweep", k));
        b.hitRect(b.facing > 0 ? b.cx : b.cx - 150, b.groundY - 28, 150, 28, 1.3, "earth");
        dust(b.cx + b.facing * 70, 14);
        j.play("swingHeavy", 1);
        fx.shake(4);
        await b.wait(0.25);
      }
      await b.wait(0.7);
      break;
    }
    case "rockfall": {
      // 포효로 천장을 울려 낙석이 쏟아진다
      b.frame(F("roar"));
      j.play("bossRoar", 1);
      fx.shake(10);
      host.cameras.main.flash(200, 200, 180, 150);
      for (let i = 0; i < 10 && !b.dead; i++) {
        const x = b.clampX(i % 3 === 0 ? p.cx : b.arenaL + Math.random() * (b.arenaR - b.arenaL), 16);
        b.warnBar(x, 26, 0.6);
        host.time.delayedCall(600 / b.speedMul, () => {
          if (b.dead) return;
          const r = host.add.image(x, b.groundY - 240, "p_rock").setDepth(14).setScale(2.6);
          host.tweens.add({ targets: r, y: b.groundY - 8, duration: 300, ease: "Quad.easeIn", onComplete: () => (r.destroy(), fx.burst("chunk", x, b.groundY - 4, 10, ROCKC), b.hitRect(x - 13, b.groundY - 40, 26, 40, 1, "earth")) });
        });
        await b.wait(0.18);
      }
      await b.wait(1);
      break;
    }
    case "inhale": {
      // 크게 입을 벌려 빨아들인다 → 가까이 끌려오면 깨문다
      b.faceP();
      b.frame(F("inhale", 0));
      j.play("magic", 0.8);
      for (let t = 0; t < 1.8 && !b.dead; t += 0.05) {
        b.frame(F("inhale", Math.floor(t * 10) % 2));
        b.wind = -b.facing * 130;
        fx.burst("dust", b.cx + b.facing * (60 + Math.random() * 120), Rb.y - 30 - Math.random() * 30, 1, 0xc8b8a0);
        if (Math.abs(p.cx - (b.cx + b.facing * 40)) < 30) break;
        await b.wait(0.05);
      }
      b.wind = 0;
      b.frame(F("spit"));
      fx.shake(5);
      j.play("thud", 1.4);
      b.hitRect(b.facing > 0 ? b.cx : b.cx - 70, Rb.y - 80, 70, 80, 1.6, "earth");
      await b.wait(0.8);
      break;
    }
    case "oreBurst": {
      // 등의 광석이 빛나며 결정 파편을 사방으로 쏜다
      b.frame(F("roar"));
      for (let i = 0; i < 12; i++) fx.burst("glow", b.cx + (Math.random() - 0.5) * 60, Rb.y - Rb.h * Math.random(), 1, ORE);
      j.play("warn", 0.8);
      await b.wait(0.6);
      for (let w = 0; w < 2; w++) {
        const ox = b.cx, oy = Rb.y - Rb.h * 0.8;
        for (let i = 0; i < 10; i++) b.shoot({ sprite: "p_icicle", speed: 240, life: 2.6, radius: 5 }, ox, oy, (i / 10) * Math.PI * 2 + w * 0.3, 0.8, "earth", null, { tint: ORE, scale: 1.5 });
        j.play("ice", 0.8);
        await b.wait(0.5);
      }
      await b.wait(0.6);
      break;
    }
    default:
      await b.wait(0.5);
  }
}
