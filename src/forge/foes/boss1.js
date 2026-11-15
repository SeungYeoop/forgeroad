// 2지역 보스 「안개뿔 엘크하른」 — 안개 숲의 주인. 숲을 덮은 안개는 그의 숨결이다.
// 1단계: 뿔 돌진 · 안개 잠행 · 발굽 충격파   2단계: 환영 사슴 · 뿔가지 사격 · 안개 폭풍
import { frameOf } from "./core.js";

const MIST = 0xc8fff0, ANT = 0xe8dcc0;
const F = (nm, k = 0) => frameOf("frb1", nm, k);

export async function bossRun1(b, name, R) {
  const host = b.host, fx = host.fx, Rb = b.body, p = b.pl(), P2 = b.phase === 2, j = R.j;
  b.faceP();
  const map = { phantoms: "antlerCharge", antlerShot: "hoofQuake", mistStorm: "mistStealth" };
  !P2 && map[name] && (name = map[name]);
  if (P2 && !b._p2) ((b._p2 = 1), (name = "mistStorm"));
  const fwd = (d) => b.cx + b.facing * d;
  const dust = (x, n = 8) => fx.burst("dust", x, b.groundY - 2, n, 0xa09080);
  switch (name) {
    case "antlerCharge": {
      // 머리를 숙이고 발을 구른 뒤 → 아레나 끝까지 뿔 돌진
      b.frame(F("lower"));
      const end = b.facing > 0 ? b.arenaR - 30 : b.arenaL + 30;
      b.warnBar((b.cx + end) / 2, Math.abs(end - b.cx), 0.75);
      for (let i = 0; i < 3; i++) (dust(b.cx - b.facing * 20, 4), await b.wait(0.25));
      j.play("dash", 1.3);
      let t = 0, hit = !1;
      while (t < 1.2 && !b.dead) {
        b.frame(F("charge", Math.floor(t * 12) % 2));
        Rb.vx = b.facing * 480 * b.speedMul;
        !hit && b.hitRect(Rb.x + (b.facing > 0 ? 0 : -Rb.w), Rb.y - 50, Rb.w + 30, 50, 1.4, "phys", null) && (hit = !0);
        Math.random() < 0.5 && dust(b.cx - b.facing * 30, 2);
        if ((b.facing > 0 && Rb.x > b.arenaR - Rb.w / 2 - 6) || (b.facing < 0 && Rb.x < b.arenaL + Rb.w / 2 + 6)) {
          fx.shake(8);
          j.play("thud", 1.6);
          fx.burst("chunk", fwd(30), Rb.y - 40, 16, 0x8a7a6a);
          break;
        }
        await b.wait(0.03), (t += 0.03);
      }
      Rb.vx = 0;
      b.frame(F("stagger"));
      b.staggerT = Math.max(b.staggerT, P2 ? 0.5 : 0.9);
      await b.wait(0.8);
      break;
    }
    case "mistStealth": {
      // 안개 속으로 사라졌다가 플레이어 뒤에서 뿔로 들이받는다
      b.frame(F("roar"));
      j.play("magic", 0.8);
      for (let i = 0; i < 18; i++) fx.burst("glow", b.cx + (Math.random() - 0.5) * 120, Rb.y - Math.random() * 80, 1, MIST);
      host.tweens.add({ targets: b.sprite, alpha: 0.08, duration: 500 });
      b.hidden = !0;
      await b.wait(0.9);
      const side = Math.random() < 0.5 ? -1 : 1;
      Rb.x = b.clampX(p.cx + side * 90, 50);
      b.faceP();
      b.warnBar(b.cx + b.facing * 50, 120, 0.45);
      await b.wait(0.45);
      host.tweens.add({ targets: b.sprite, alpha: 1, duration: 150 });
      b.hidden = !1;
      b.frame(F("charge", 0));
      Rb.vx = b.facing * 360;
      for (let t = 0; t < 0.35 && !b.dead; t += 0.03) (b.hitRect(Rb.x + (b.facing > 0 ? 0 : -Rb.w - 20), Rb.y - 50, Rb.w + 40, 50, 1.2), await b.wait(0.03));
      Rb.vx = 0;
      b.frame(F("idle"));
      await b.wait(0.6);
      break;
    }
    case "hoofQuake": {
      // 앞발을 치켜들었다가 → 내려찍어 양쪽으로 충격파
      b.frame(F("rear"));
      b.warnBar(b.cx, 200, 0.7);
      j.play("bossRoar", 0.6);
      await b.wait(0.7);
      b.frame(F("stomp"));
      fx.shake(9);
      j.play("thud", 1.6);
      fx.anim("fx_smash", fwd(36), b.groundY - 14, { scale: 2.4, tint: 0xc8ffd8 });
      dust(fwd(36), 20);
      b.hitRect(b.cx - 80, b.groundY - 40, 160, 40, 1.3);
      b.wave(-1, 0.9, 260, 0xc8fff0), b.wave(1, 0.9, 260, 0xc8fff0);
      if (P2) (await b.wait(0.4), b.wave(-1, 0.9, 340, 0xc8fff0), b.wave(1, 0.9, 340, 0xc8fff0));
      await b.wait(0.8);
      break;
    }
    case "phantoms": {
      // 환영 사슴: 높이가 다른 세 줄을 차례로 가로지른다
      b.frame(F("roar"));
      j.play("bossRoar", 0.8);
      await b.wait(0.5);
      for (let i = 0; i < 3; i++) {
        const dir = i % 2 ? -1 : 1, x0 = dir > 0 ? b.arenaL : b.arenaR, y = b.groundY;
        b.warnBar((b.arenaL + b.arenaR) / 2, b.arenaR - b.arenaL, 0.6, y);
        host.time.delayedCall(600 / b.speedMul, () => {
          if (b.dead) return;
          const g = host.add.sprite(x0, y, `b_frb1`, F("charge", 0)).setOrigin(0.5, 1).setDepth(11).setFlipX(dir < 0).setAlpha(0.55).setTint(0xb8fff0);
          host.tweens.add({
            targets: g, x: dir > 0 ? b.arenaR : b.arenaL, duration: 650,
            onUpdate: () => {
              Math.random() < 0.4 && fx.burst("glow", g.x, y - 30, 1, MIST);
              const P = b.pl();
              !P.dead && P.iframes <= 0 && Math.abs(P.cx - g.x) < 26 && Math.abs(P.body.y - y) < 40 && b.dmg(1.1, !0, "wind");
            },
            onComplete: () => g.destroy(),
          });
          j.play("dash", 0.8);
        });
        await b.wait(0.75);
      }
      await b.wait(0.6);
      break;
    }
    case "antlerShot": {
      // 고개를 쳐들어 뿔가지를 부채꼴로 쏜다 (두 번)
      for (let r = 0; r < 2; r++) {
        b.faceP();
        b.frame(F("shoot"));
        j.play("warn", 0.6);
        await b.wait(0.45);
        const ox = b.cx + b.facing * 20, oy = Rb.y - Rb.h - 10;
        const base = Math.atan2(p.cy - oy, p.cx - ox);
        for (let i = -3; i <= 3; i++) b.shoot({ sprite: "p_thorn", speed: 300, life: 2.4, radius: 5 }, ox, oy, base + i * 0.16, 0.8, "wind", null, { tint: ANT, scale: 1.6 });
        j.play("shoot", 1);
        await b.wait(0.5);
      }
      await b.wait(0.4);
      break;
    }
    case "mistStorm": {
      // 안개 폭풍: 시야가 좁아지고 바람이 플레이어를 밀며, 안개 회오리가 바닥을 훑는다
      b.frame(F("roar"));
      j.play("bossRoar", 1);
      host.cameras.main.flash(250, 200, 255, 240);
      host._blindT = Math.max(host._blindT ?? 0, 4.5);
      const wdir = Math.random() < 0.5 ? -1 : 1;
      b.wind = wdir * 45;
      for (let i = 0; i < 5 && !b.dead; i++) {
        const x = b.clampX(b.arenaL + Math.random() * (b.arenaR - b.arenaL), 20);
        b.warnBar(x, 36, 0.5);
        host.time.delayedCall(500 / b.speedMul, () => {
          if (b.dead) return;
          for (let q = 0; q < 10; q++) fx.burst("glow", x + (Math.random() - 0.5) * 30, b.groundY - Math.random() * 70, 1, MIST);
          fx.anim("ring", x, b.groundY - 30, { scale: 1.8, tint: MIST });
          b.hitRect(x - 18, b.groundY - 70, 36, 70, 0.9, "wind");
        });
        await b.wait(0.45);
      }
      await b.wait(1.2);
      b.wind = 0;
      break;
    }
    default:
      await b.wait(0.5);
  }
}
