// 6지역 보스 「서리비늘 크리오스」 — 협곡 꼭대기에 둥지를 튼 얼음 와이번. 화로의 불이 꺼지길 기다려 왔다.
// 1단계: 서리 숨결 · 급강하 할퀴기 · 고드름 비
// 2단계: 다리 얼리기 · 날개 눈보라 · 꼬리 휩쓸기 · 얼음 감옥 · 절대영도
import { frameOf } from "./core.js";

const ICEC = 0x9ad8ff, SNOWC = 0xe8f4ff;
const F = (nm, k = 0) => frameOf("frb5", nm, k);
const CHILL = (p = 0.45, d = 3) => ({ type: "chill", chance: 1, dur: d, power: p });
const STUN = (d) => ({ type: "stun", chance: 1, dur: d });
const zoneIce = (b, x, w, t) => {
  const host = b.host;
  host._foeZones = host._foeZones ?? [];
  host._foeZones.push({ x, y: b.groundY, w, t, mult: 0.15, el: "ice", st: CHILL(0.5, 2), atk: b.atk, cd: 0, kind: "ice", fxT: 0 });
};

export async function bossRun5(b, name, R) {
  const host = b.host, fx = host.fx, Rb = b.body, p = b.pl(), P2 = b.phase === 2, j = R.j;
  b.faceP();
  const map = { legFreeze: "frostBreath", wingBlizzard: "icicleRain", tailSweep: "diveClaw", icePrison: "frostBreath", absoluteZero: "diveClaw" };
  !P2 && map[name] && (name = map[name]);
  if (P2 && !b._p2) ((b._p2 = 1), (name = "absoluteZero"));
  switch (name) {
    case "frostBreath": {
      // 목을 뒤로 젖혀 숨을 들이켰다가 → 앞을 훑는 서리 숨결, 지나간 바닥이 얼어붙는다
      b.faceP();
      b.frame(F("rear"));
      j.play("bossRoar", 0.6);
      b.warnBar(b.cx + b.facing * 130, 220, 0.8);
      await b.wait(0.8);
      j.play("magic", 1);
      for (let t = 0; t < 1.6 && !b.dead; t += 0.08) {
        b.frame(F("breath", Math.floor(t * 12) % 2));
        const reach = 60 + Math.min(1, t / 0.5) * 180;
        for (let i = 0; i < 3; i++) fx.burst("glow", b.cx + b.facing * (60 + Math.random() * reach), Rb.y - 50 + Math.random() * 50, 1, i ? ICEC : SNOWC);
        Math.floor(t / 0.08) % 3 === 0 && b.hitRect(b.facing > 0 ? b.cx + 40 : b.cx - 40 - reach, Rb.y - 80, reach, 80, 0.45, "ice", CHILL());
        await b.wait(0.08);
      }
      for (let x = 70; x < 250; x += 60) zoneIce(b, b.clampX(b.cx + b.facing * x, 20), 60, 4);
      b.frame(F("idle"));
      await b.wait(0.8);
      break;
    }
    case "diveClaw": {
      // 날아올라 하늘을 돌다가 → 플레이어 자리로 급강하, 날개 손톱으로 할퀸다
      for (let r = 0; r < (P2 ? 2 : 1); r++) {
        b.frame(F("fly", 0));
        j.play("jump", 1.2);
        Rb.vy = -760;
        for (let t = 0; t < 0.9 && !b.dead; t += 0.05) {
          b.frame(F("fly", Math.floor(t * 12) % 4));
          t > 0.4 && (Rb.vy = Math.min(Rb.vy, -10));
          Rb.vx = (b.clampX(p.cx, 60) - b.cx) * 1.5;
          await b.wait(0.05);
        }
        const tx = b.clampX(p.cx, 60);
        b.warnCircle(tx, b.groundY - 10, 80, 0.6);
        for (let t = 0; t < 0.6 && !b.dead; t += 0.05) (b.frame(F("fly", Math.floor(t * 12) % 4)), (Rb.vy = -10), (Rb.vx = (tx - b.cx) * 2), await b.wait(0.05));
        b.frame(F("dive"));
        j.play("dash", 1.4);
        Rb.vy = 1300;
        let t = 0;
        while (!Rb.onGround && !b.dead && t < 1.2) (await b.wait(0.02), (t += 0.02));
        Rb.vx = 0;
        b.frame(F("claw", 1));
        fx.shake(9);
        j.play("thud", 1.6);
        fx.anim("fx_smash", b.cx, b.groundY - 14, { scale: 2.8, tint: ICEC });
        fx.burst("chunk", b.cx, b.groundY - 6, 16, 0xd8f0ff);
        b.hitCircle(b.cx, b.groundY - 20, 80, 1.6, "ice", CHILL());
        P2 && (b.wave(-1, 0.8, 260, ICEC), b.wave(1, 0.8, 260, ICEC));
        await b.wait(0.8);
      }
      b.frame(F("idle"));
      await b.wait(0.3);
      break;
    }
    case "icicleRain": {
      // 포효로 협곡 천장을 울린다 → 고드름이 떨어진다 (경고 자리)
      b.frame(F("roar"));
      j.play("bossRoar", 1);
      fx.shake(6);
      await b.wait(0.4);
      const n = P2 ? 12 : 9;
      for (let i = 0; i < n && !b.dead; i++) {
        const x = b.clampX(i % 3 === 0 ? p.cx : b.arenaL + Math.random() * (b.arenaR - b.arenaL), 20);
        b.warnBar(x, 26, 0.7);
        host.time.delayedCall(700 / b.speedMul, () => {
          if (b.dead) return;
          b.shoot({ sprite: "p_icicle", speed: 700, life: 0.6, radius: 6 }, x, b.groundY - 260, Math.PI / 2, 0.9, "ice", CHILL(0.35, 2), { tint: 0xd0f4ff, scale: 2 });
          host.time.delayedCall(330, () => !b.dead && (fx.burst("chunk", x, b.groundY - 4, 6, 0xd8f0ff), b.hitRect(x - 14, b.groundY - 50, 28, 50, 0.9, "ice", CHILL(0.35, 2))));
        });
        await b.wait(0.18);
      }
      b.frame(F("idle"));
      await b.wait(1.2);
      break;
    }
    case "legFreeze": {
      // 발을 구르면 서리가 바닥을 따라 번진다 → 서 있으면 발이 얼어붙는다 (뛰어서 피함)
      b.frame(F("rear"));
      await b.wait(0.4);
      b.frame(F("claw", 1));
      fx.shake(7);
      j.play("ice", 1);
      for (let i = 0; i < 7 && !b.dead; i++) {
        for (const d of [-1, 1]) {
          const x = b.cx + d * (40 + i * 45);
          if (x < b.arenaL || x > b.arenaR) continue;
          b.warnBar(x, 44, 0.25);
          host.time.delayedCall(250 / b.speedMul, () => {
            if (b.dead) return;
            fx.burst("chunk", x, b.groundY - 4, 5, 0xd8f0ff);
            for (let q = 0; q < 3; q++) fx.burst("glow", x + (Math.random() - 0.5) * 40, b.groundY - Math.random() * 14, 1, ICEC);
            if (p.body.onGround && b.hitRect(x - 22, b.groundY - 20, 44, 20, 0.6, "ice", CHILL())) p.statuses.apply(STUN(1.2), 0);
            zoneIce(b, x, 44, 3);
          });
        }
        await b.wait(0.12);
      }
      b.frame(F("idle"));
      await b.wait(0.9);
      break;
    }
    case "wingBlizzard": {
      // 날개를 크게 퍼덕여 눈보라: 플레이어를 밀어내며 얼음 조각이 날아온다
      b.faceP();
      j.play("bossRoar", 0.8);
      host._blindT = Math.max(host._blindT ?? 0, 3);
      b.wind = b.facing * 60;
      for (let t = 0; t < 3 && !b.dead; t += 0.12) {
        b.frame(F("wing", Math.floor(t * 8) % 2));
        for (let i = 0; i < 3; i++) fx.burst("glow", b.cx + b.facing * Math.random() * 400, b.groundY - Math.random() * 120, 1, SNOWC);
        if (Math.floor(t / 0.12) % 3 === 0) {
          const oy = b.groundY - 20 - Math.random() * 80;
          b.shoot({ sprite: "p_icicle", speed: 340, life: 1.6, radius: 4 }, b.cx + b.facing * 40, oy, b.facing > 0 ? 0 : Math.PI, 0.6, "ice", CHILL(0.3, 2), { tint: 0xd0f4ff });
        }
        await b.wait(0.12);
      }
      b.wind = 0;
      b.frame(F("idle"));
      await b.wait(0.8);
      break;
    }
    case "tailSweep": {
      // 몸을 비틀어 꼬리를 끌어당겼다가 → 바닥을 낮게 휩쓴다 (뛰어서 피함)
      b.faceP();
      b.frame(F("tail", 0));
      b.warnBar(b.cx, 300, 0.7, b.groundY - 4);
      j.play("warn", 0.6);
      await b.wait(0.7);
      b.frame(F("tail", 1));
      j.play("swingHeavy", 1.3);
      fx.shake(5);
      for (let i = 0; i < 10; i++) fx.burst("glow", b.cx + (Math.random() - 0.5) * 300, b.groundY - Math.random() * 20, 1, SNOWC);
      b.hitRect(b.cx - 150, b.groundY - 30, 300, 30, 1.5, "ice", CHILL());
      await b.wait(0.4);
      b.wave(-1, 0.8, 300, ICEC), b.wave(1, 0.8, 300, ICEC);
      b.frame(F("idle"));
      await b.wait(0.8);
      break;
    }
    case "icePrison": {
      // 얼음 감옥: 플레이어 자리에 서리 고리 → 늦게 빠져나오면 얼음 기둥에 갇힌다
      b.frame(F("roar"));
      j.play("magic", 0.9);
      for (let r = 0; r < 2 && !b.dead; r++) {
        const tx = p.cx, ty = p.body.y;
        b.warnCircle(tx, ty - 20, 50, 0.9);
        await b.wait(0.9);
        fx.anim("ring", tx, ty - 20, { scale: 2, tint: ICEC });
        const col = host.add.rectangle(tx, ty, 50, 80, 0xb8ecff, 0.75).setOrigin(0.5, 1).setDepth(28).setStrokeStyle(2, 0xffffff, 0.9);
        host.tweens.add({ targets: col, alpha: 0, delay: 1400, duration: 300, onComplete: () => col.destroy() });
        fx.burst("chunk", tx, ty - 30, 12, 0xd8f0ff);
        j.play("ice", 1);
        if (Math.abs(p.cx - tx) < 26 && Math.abs(p.body.y - ty) < 40) (b.dmg(1.2, !1, "ice", CHILL(0.6, 4)), p.statuses.apply(STUN(1.5), 0));
        await b.wait(0.5);
      }
      b.frame(F("idle"));
      await b.wait(0.6);
      break;
    }
    case "absoluteZero": {
      // 절대영도: 높이 날아올라 냉기를 모은다. 얼음 벽 뒤에 숨어야 산다
      b.frame(F("roar"));
      j.play("bossRoar", 1.2);
      host.cameras.main.flash(250, 200, 240, 255);
      await b.wait(0.5);
      // 아레나 가장자리로 물러나 날아오른다
      const side = b.cx < (b.arenaL + b.arenaR) / 2 ? -1 : 1;
      await b.walkTo(side < 0 ? b.arenaL + 50 : b.arenaR - 50, 200, 1.2);
      b.facing = -side;
      Rb.vy = -600;
      const wx = (b.arenaL + b.arenaR) / 2 + (Math.random() - 0.5) * 80;
      const wall = host.add.rectangle(wx, b.groundY, 26, 110, 0xb8ecff, 0.85).setOrigin(0.5, 1).setDepth(28).setStrokeStyle(2, 0xffffff, 0.9);
      fx.anim("fx_smash", wx, b.groundY - 14, { scale: 2, tint: ICEC });
      j.play("ice", 1);
      for (let t = 0; t < 3 && !b.dead; t += 0.05) {
        b.frame(F("fly", Math.floor(t * 12) % 4));
        Rb.vy = t > 0.4 ? -10 : Rb.vy;
        Rb.vx = 0;
        Math.random() < 0.6 && fx.burst("glow", b.cx + (Math.random() - 0.5) * 80, Rb.y - 40 + (Math.random() - 0.5) * 60, 1, ICEC);
        Math.floor(t / 0.5) !== Math.floor((t - 0.05) / 0.5) && j.play("warn", 0.4 + t * 0.15);
        await b.wait(0.05);
      }
      b.frame(F("breath", 0));
      host.cameras.main.flash(400, 230, 250, 255);
      fx.shake(12);
      j.play("explosion", 1.6);
      const safe = Math.sign(p.cx - wx) === -Math.sign(b.cx - wx) && Math.abs(p.cx - wx) < 70;
      if (!safe) (b.dmg(2.4, !1, "ice", CHILL(0.7, 5)), p.statuses.apply(STUN(1), 0));
      for (let x = b.arenaL + 30; x < b.arenaR; x += 60) zoneIce(b, x, 60, 3);
      host.tweens.add({ targets: wall, alpha: 0, delay: 600, duration: 300, onComplete: () => wall.destroy() });
      Rb.vy = 400;
      await b.wait(0.8);
      b.frame(F("stagger"));
      await b.wait(1.2);
      break;
    }
    default:
      await b.wait(0.5);
  }
}
