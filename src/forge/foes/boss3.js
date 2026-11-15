// 4지역 보스 「부패의 왕 글로브락」 — 늪의 썩은 것들을 모두 삼키고 부풀어 오른 두꺼비 왕.
// 1단계: 혀 채찍 · 압살 점프 · 올챙이(거머리) 소환   2단계: 독가스 트림 · 거머리 폭포 · 역병 대폭발
import { frameOf } from "./core.js";

const POISON = 0x9aff60;
const F = (nm, k = 0) => frameOf("frb3", nm, k);
const POIS = (p = 0.25, d = 3) => ({ type: "poison", chance: 1, dur: d, power: p });

export async function bossRun3(b, name, R) {
  const host = b.host, fx = host.fx, Rb = b.body, p = b.pl(), P2 = b.phase === 2, j = R.j;
  b.faceP();
  const map = { gasBurp: "tongueWhip", leechRain: "tadpoles", plagueBlast: "crushJump" };
  !P2 && map[name] && (name = map[name]);
  if (P2 && !b._p2) ((b._p2 = 1), (name = "plagueBlast"));
  switch (name) {
    case "tongueWhip": {
      // 혀를 쭉 뻗어 앞을 훑는다 → 걸리면 끌어와서 삼켰다 뱉음
      for (let r = 0; r < (P2 ? 2 : 1); r++) {
        b.faceP();
        b.frame(F("roar"));
        const len = 150;
        b.warnBar(b.cx + b.facing * (40 + len / 2), len, 0.55, Rb.y - 30);
        await b.wait(0.55);
        let caught = !1;
        for (let k = 0; k < 3; k++) {
          b.frame(F("tongue", k));
          !caught && b.hitRect(b.facing > 0 ? b.cx + 30 : b.cx - 30 - len, Rb.y - 46, len, 26, 1.1, "poison", POIS()) && (caught = !0);
          await b.wait(0.09);
        }
        j.play("dash", 1);
        if (caught) {
          for (let t = 0; t < 0.35; t += 0.03) ((p.body.x += (b.cx + b.facing * 40 - p.body.x) * 0.3), (p.body.vx = 0), await b.wait(0.03));
          b.frame(F("burp", 0));
          fx.shake(5);
          b.dmg(1.2, !0, "poison", POIS(0.3, 4), 2.5);
          j.play("punch", 1.2);
        }
        b.frame(F("idle"));
        await b.wait(0.6);
      }
      break;
    }
    case "crushJump": {
      // 높이 뛰어 플레이어 위로 → 깔아뭉개기 + 독물 튀김
      for (let r = 0; r < (P2 ? 2 : 1); r++) {
        b.frame(F("land"));
        await b.wait(0.3);
        b.frame(F("jump"));
        const tx = b.clampX(p.cx, 60);
        b.warnCircle(tx, b.groundY - 10, 70, 0.95);
        Rb.vy = -820;
        j.play("jump", 1.4);
        let t = 0;
        while (t < 0.8 && !b.dead) ((Rb.vx = (tx - Rb.x) * 3), await b.wait(0.03), (t += 0.03));
        Rb.vy = 1000;
        while (!Rb.onGround && !b.dead && t < 1.8) (await b.wait(0.02), (t += 0.02));
        Rb.vx = 0;
        b.frame(F("land"));
        fx.shake(10);
        j.play("thud", 1.8);
        fx.anim("fx_smash", b.cx, b.groundY - 14, { scale: 2.8, tint: 0xb8e070 });
        fx.burst("glow", b.cx, b.groundY - 6, 24, POISON);
        b.hitRect(b.cx - 70, b.groundY - 50, 140, 50, 1.5, "poison", POIS());
        b.wave(-1, 0.8, 260, 0x9ad060), b.wave(1, 0.8, 260, 0x9ad060);
        await b.wait(0.7);
      }
      break;
    }
    case "tadpoles": {
      // 배를 부풀려 거머리 떼를 낳는다
      b.frame(F("summon"));
      j.play("bossRoar", 0.6);
      await b.wait(0.5);
      await b.summon("fr3_0", P2 ? 4 : 3, 6);
      await b.wait(0.7);
      break;
    }
    case "gasBurp": {
      // 독가스 트림: 앞쪽 바닥에 독 구름이 번진다
      b.faceP();
      for (let k = 0; k < 2; k++) {
        b.frame(F("burp", k));
        j.play("magic", 0.9);
        for (let i = 0; i < 4; i++) {
          const x = b.cx + b.facing * (60 + i * 45 + k * 20);
          if (x < b.arenaL || x > b.arenaR) continue;
          host._foeZones = host._foeZones ?? [];
          host._foeZones.push({ x, y: b.groundY, w: 44, t: 4, mult: 0.22, el: "poison", st: POIS(0.25, 3), atk: b.atk, cd: 0, kind: "poison", fxT: 0 });
          fx.burst("glow", x, b.groundY - 20, 12, POISON);
        }
        await b.wait(0.5);
      }
      await b.wait(0.6);
      break;
    }
    case "leechRain": {
      // 거머리 폭포: 하늘에서 거머리가 떨어진다
      b.frame(F("roar"));
      j.play("bossRoar", 0.9);
      for (let i = 0; i < 5 && !b.dead; i++) {
        const x = b.clampX(i === 0 ? p.cx : b.arenaL + Math.random() * (b.arenaR - b.arenaL), 20);
        b.warnBar(x, 24, 0.6);
        host.time.delayedCall(600 / b.speedMul, () => {
          if (b.dead) return;
          const l = host.spawnEnemy("fr3_0", x, b.groundY - 200, { summoned: !0, noGold: !0 });
          l && ((l.aggro = !0), (l.body.vy = 300));
          b.hitRect(x - 12, b.groundY - 40, 24, 40, 0.8, "poison", POIS());
        });
        await b.wait(0.25);
      }
      await b.wait(1);
      break;
    }
    case "plagueBlast": {
      // 역병 대폭발: 몸이 부풀어 오르다 터진다 → 멀리 떨어져야 산다
      b.frame(F("swell", 0));
      j.play("bossRoar", 1);
      host.cameras.main.flash(200, 160, 255, 120);
      b.warnCircle(b.cx, Rb.y - 30, 150, 2);
      for (let t = 0; t < 2; t += 0.1) {
        b.frame(F("swell", Math.floor(t * 6) % 2));
        fx.burst("glow", b.cx + (Math.random() - 0.5) * 80, Rb.y - Math.random() * 60, 1, POISON);
        await b.wait(0.1);
      }
      fx.anim("explode", b.cx, Rb.y - 30, { scale: 5, tint: POISON });
      fx.shake(14);
      j.play("explosion", 2);
      b.hitCircle(b.cx, Rb.y - 30, 150, 2, "poison", POIS(0.4, 5));
      b.frame(F("stagger"));
      await b.wait(1.2);
      break;
    }
    default:
      await b.wait(0.5);
  }
}
