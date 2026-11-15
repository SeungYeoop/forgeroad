// 1지역 보스 「타다 남은 기사 그레이번」
// 화로를 지키던 기사단의 단장. 불타는 갑옷 안에서 지금도 맹세를 지키고 있다.
// 1단계(100~50%): 3연 베기 · 돌진 찌르기 · 검 꽂기(불기둥)   2단계(50~0%): 화염 회전베기 · 낙하 강타 · 잔불 기사 소환
import { register, frameOf } from "./core.js";
import { mat, veins, plates, cloth, cape, EYE, gait, leg, arm, PI, TAU, add, rot2, ease, lerp, noise3 } from "./rig.js";

const EMBER = 0xff8a30;
const ARM = mat(0x403a4a, { spec: 0.3, shin: 44, tex: veins(0.16, 0xff6a18, 0xffd060, 0.4), rim: 0.6, rimCol: 0xff9a50 });
const ARMP = mat(0x544e60, { spec: 0.35, shin: 48, tex: plates(0.22), rim: 0.5, rimCol: 0xffa060 });
const DARK = mat(0x1e1820, { spec: 0.3 });
const GOLD = mat(0xc89a40, { spec: 0.9, shin: 34 });
const CAPE = mat(0x8a1e1c, { tex: cloth(0.4), rim: 0.3 });
const STEEL = mat(0xc4bed2, { spec: 0.6, shin: 60, hi: 0xffffff, rim: 0.4 });
const HOTS = mat(0xe8a868, { spec: 1, shin: 50, tex: (u, v, w) => (Math.abs(v) > 1.2 ? 1.2 : 0.2), rim: 0.8, rimCol: 0xffd080 });
const LEATH = mat(0x5a2a1a);
const HORN = mat(0x2a2228, { spec: 0.4 });
const EMB = EYE(0xffa040), EMBR = EYE(0xff5a20), HOT = EYE(0xffe080);
function flame(M, p, h, k, s = 1) {
  for (let i = 0; i < 5; i++) {
    const t = i / 5, sw = Math.sin(k * 1.9 + i * 1.2) * 1.6 * t * s;
    M.sphere([p[0] + sw, p[1] - t * h, p[2] + 1], (4 - t * 3) * s, i < 2 ? (i === 0 ? HOT : EMB) : EMBR);
  }
}
// 대검: 손에서 각도 ang으로
function sword(M, hand, ang, hot, len = 50) {
  const c = Math.cos(ang), s = Math.sin(ang);
  M.box(add(hand, [c * (len / 2 + 6), s * (len / 2 + 6), 2]), [len / 2, 3.4, 1.2], STEEL, ang, 0.7);
  M.cap(add(hand, [c * 8, s * 8, 3.3]), add(hand, [c * (len + 2), s * (len + 2), 3.3]), 0.7, 0.4, hot ? mat(0xffb060, { emit: 0xffa040 }) : mat(0xe8e4f4, { spec: 0.6, shin: 60 }));
  M.box(add(hand, [c * 5, s * 5, 2]), [1.6, 8, 2.4], GOLD, ang);
  M.cap(add(hand, [-c * 4, -s * 4, 2]), add(hand, [c * 3, s * 3, 2]), 1.8, 1.8, LEATH);
  M.sphere(add(hand, [-c * 6, -s * 6, 2]), 2.4, GOLD);
}
export const grayburn = {
  boss: !0, fw: 132, fh: 112, w: 36, h: 62,
  anims: { idle: [4, 5], move: [6, 8], stagger: [1, 1], wind: [1, 1], cut1: [1, 1], cut2: [1, 1], pull: [1, 1], thrust: [1, 1], plant: [1, 1], spin: [2, 12], leap: [1, 1], land: [1, 1], summon: [1, 1] },
  model(M, nm, k, n) {
    const G = 110, cx = 58;
    let bob = 0, lean = 0, crouch = 0, legs = gait(0, 0.12, 0), sA = 1.25, hand = [16, 4], air = 0, hot = !1, cp = 0;
    if (nm === "idle") bob = Math.sin((k / n) * TAU) * 1;
    if (nm === "move") ((legs = gait((k / n) * TAU, 0.38, 0.6)), (bob = Math.abs(Math.cos((k / n) * TAU)) * 2.5));
    const P = {
      stagger: () => ((crouch = 12), (lean = 0.4), (sA = 1.45), (hand = [12, 12]), (legs = [[PI / 2 - 1.1, 1.7], [PI / 2 + 0.2, 1.1]])),
      wind: () => ((lean = -0.15), (sA = -2.4), (hand = [2, -18]), (legs = [[PI / 2 - 0.3, 0.2], [PI / 2 + 0.3, -0.2]])),
      cut1: () => ((lean = 0.3), (sA = 0.7), (hand = [26, 12]), (cp = 4), (hot = !0), (legs = [[PI / 2 - 0.6, 0.4], [PI / 2 + 0.45, -0.2]])),
      cut2: () => ((lean = 0.22), (sA = -0.9), (hand = [24, -6]), (cp = 3), (hot = !0), (legs = [[PI / 2 - 0.5, 0.3], [PI / 2 + 0.4, -0.2]])),
      pull: () => ((lean = -0.2), (sA = 0.05), (hand = [-6, 4]), (legs = [[PI / 2 - 0.2, 0.3], [PI / 2 + 0.5, -0.3]])),
      thrust: () => ((lean = 0.45), (sA = 0.02), (hand = [30, 2]), (cp = 6), (hot = !0), (legs = [[PI / 2 - 0.8, 0.5], [PI / 2 + 0.6, -0.2]])),
      plant: () => ((crouch = 10), (lean = 0.25), (sA = PI / 2), (hand = [18, 8]), (legs = [[PI / 2 - 0.9, 1.3], [PI / 2 + 0.3, 0.8]])),
      spin: () => ((lean = 0.1), (sA = k ? PI : 0), (hand = k ? [-20, 4] : [22, 4]), (hot = !0), (cp = 5)),
      leap: () => ((air = 10), (sA = -2.0), (hand = [6, -16]), (legs = [[PI / 2 - 1.0, 1.4], [PI / 2 - 0.2, 1.2]])),
      land: () => ((crouch = 11), (lean = 0.4), (sA = 1.0), (hand = [28, 14]), (hot = !0), (legs = [[PI / 2 - 0.9, 1.0], [PI / 2 + 0.5, 0.4]])),
      summon: () => ((lean = -0.1), (sA = -PI / 2), (hand = [12, -24]), (hot = !0)),
    };
    P[nm] && P[nm]();
    const hip = [cx, G - 40 + bob * 0.4 + crouch - air, 0];
    const chest = add(hip, rot2([0, -20], lean));
    // 망토 (뒤)
    const cw = Math.sin(k * 0.9) * 2;
    void cw;
    cape(M, add(chest, rot2([-4 - cp, -12, 0], lean)), 52, 16, lean + cp * 0.05, CAPE, k, -10);
    // 다리
    leg(M, add(hip, [-2, 0, -8]), legs[1][0], 18, legs[1][1], 19, 6.5, 5.6, ARMP, DARK, 7);
    leg(M, add(hip, [2, 0, 8]), legs[0][0], 18, legs[0][1], 19, 7, 6, ARM, DARK, 7);
    // 허리 + 흉갑
    M.ell(add(hip, rot2([0, -4], lean)), [12.5, 6.5, 10.5], ARMP, lean);
    M.ell(add(hip, rot2([0, -2, 10], lean)), [5, 4, 2], GOLD, lean);
    M.ell(chest, [16, 16, 13], ARM, lean);
    M.ell(add(chest, rot2([2, -2, 9], lean)), [11, 13, 5], ARMP, lean);
    M.ell(add(chest, rot2([1, -4, 13], lean)), [3, 6, 2], GOLD, lean);
    // 뒤 어깨 + 뒷팔
    const shB = add(chest, rot2([0, -11, -13], lean));
    M.ell(shB, [9, 6.5, 7.5], ARMP, lean - 0.3);
    flame(M, add(shB, [0, -6, 0]), 10, k + 1, 1);
    // 투구: 뿔 + 불타는 눈구멍
    const head = add(chest, rot2([2, -22, 0], lean));
    M.ell(head, [9, 10, 9], ARMP, lean);
    M.ell(add(head, rot2([4.5, 1.5, 5], lean)), [4.4, 1.9, 4.6], DARK, lean);
    M.ell(add(head, rot2([5, 6, 4], lean)), [3.6, 3.2, 5], ARM, lean + 0.3);
    M.sphere(add(head, rot2([6.5, 1.5, 8], lean)), 1.8, HOT).sphere(add(head, rot2([8.5, 1.5, 4], lean)), 1.5, EMB);
    M.cap(add(head, rot2([-3, -6, 7], lean)), add(head, rot2([-9, -18, 9], lean)), 3, 0.6, HORN);
    M.cap(add(head, rot2([-3, -6, -7], lean)), add(head, rot2([-9, -18, -9], lean)), 3, 0.6, HORN);
    flame(M, add(head, [0, -10, 0]), 12, k + 3, 1.2);
    // 앞 어깨 + 대검을 쥔 팔
    const shF = add(chest, rot2([2, -11, 13], lean));
    const hd = add(chest, rot2([hand[0], hand[1], 15], lean * 0.5));
    M.cap(shF, hd, 6.5, 5.5, ARM);
    M.ell(shF, [9.5, 7, 8], ARMP, lean + 0.3);
    flame(M, add(shF, [0, -7, 0]), 11, k, 1);
    M.cap(add(shB, [2, 6, 2]), add(hd, [-3, 2, -4]), 5.5, 4.6, ARMP);
    sword(M, hd, sA, hot);
  },
};
register("frb0", grayburn);

// ── 보스 행동 (엔진 보스 도구 사용: wait / warnBar / warnCircle / hitRect / wave / summon / clampX) ──
const F = (nm, k = 0) => frameOf("frb0", nm, k);
export async function bossRun(b, name, R) {
  const host = b.host, fx = host.fx, Rb = b.body, p = b.pl(), P2 = b.phase === 2;
  const j = R.j;
  b.faceP();
  // 1단계에서 2단계 기술이 뽑히면 1단계 기술로
  const map = { spin: "combo3", plunge: "thrust", summon: "plant" };
  !P2 && map[name] && (name = map[name]);
  // 2단계 첫 행동: 잔불 기사 소환 (분노)
  if (P2 && !b._p2) ((b._p2 = 1), (name = "summon"));
  const ember = (x, y, n = 8) => fx.burst("spark", x, y, n, EMBER);
  const fwd = (d) => b.cx + b.facing * d;
  switch (name) {
    case "combo3": {
      // 다가와서 세 번 벤다. 마지막은 내려찍어 불꽃 파도
      if (Math.abs(p.cx - b.cx) > 70) await b.walkTo(b.clampX(p.cx - b.facing * 50), 110, 1.2);
      b.faceP();
      b.frame(F("wind")), b.warnBar(fwd(40), 90, 0.5);
      await b.wait(0.5);
      const cuts = [["cut1", 1.0], ["cut2", 1.0], ["cut1", 1.4]];
      for (let k = 0; k < 3; k++) {
        b.faceP();
        b.frame(F(cuts[k][0]));
        Rb.vx = b.facing * 140;
        b.hitRect(b.facing > 0 ? b.cx : b.cx - 80, Rb.y - 60, 80, 60, cuts[k][1], "fire");
        fx.anim(k === 2 ? "fx_heavy" : "fx_slash", fwd(36), Rb.y - 30, { flip: b.facing < 0, scale: k === 2 ? 2.2 : 1.8, tint: 0xffa050 });
        j.play(k === 2 ? "swingHeavy" : "swing", 1);
        if (k === 2) (fx.shake(6), ember(fwd(40), Rb.y - 4, 18), b.wave(b.facing, 0.8, 260, 0xff8040));
        await b.wait(k === 2 ? 0.35 : 0.24);
        Rb.vx = 0;
      }
      b.frame(F("cut1"));
      await b.wait(0.6);
      break;
    }
    case "thrust": {
      // 뒤로 당겼다가 아레나를 가로지르는 돌진 찌르기
      b.frame(F("pull"));
      const end = b.facing > 0 ? b.arenaR - 30 : b.arenaL + 30;
      b.warnBar((b.cx + end) / 2, Math.abs(end - b.cx), 0.65);
      j.play("warn");
      await b.wait(0.65);
      b.frame(F("thrust"));
      j.play("dash", 1.2);
      let t = 0, hit = !1;
      while (t < 0.9 && !b.dead) {
        Rb.vx = b.facing * 520;
        !hit && b.hitRect(Rb.x - Rb.w / 2 - 10, Rb.y - 44, Rb.w + 40, 30, 1.3, "fire") && (hit = !0);
        Math.random() < 0.6 && fx.burst("glow", b.cx - b.facing * 20, Rb.y - 30, 2, EMBER);
        if ((b.facing > 0 && Rb.x > b.arenaR - Rb.w) || (b.facing < 0 && Rb.x < b.arenaL + Rb.w)) break;
        await b.wait(0.03), (t += 0.03);
      }
      Rb.vx = 0;
      fx.shake(4);
      b.frame(F("cut1"));
      await b.wait(0.7);
      break;
    }
    case "plant": {
      // 검을 땅에 꽂으면 불기둥이 양옆으로 퍼져 나간다 (꽂혀 있는 동안이 빈틈)
      b.frame(F("wind"));
      await b.wait(0.35);
      b.frame(F("plant"));
      fx.shake(5);
      j.play("thud", 1.3);
      ember(fwd(16), Rb.y - 2, 20);
      const n = P2 ? 6 : 4;
      for (let k = 1; k <= n; k++) {
        for (const dir of [-1, 1]) {
          const x = b.cx + dir * k * 48;
          if (x < b.arenaL + 10 || x > b.arenaR - 10) continue;
          b.warnBar(x, 30, 0.45);
          host.time.delayedCall(450 / b.speedMul, () => {
            if (b.dead) return;
            for (let q = 0; q < 6; q++) fx.burst("rise", x + (Math.random() - 0.5) * 20, b.groundY - Math.random() * 50, 2, EMBER);
            fx.anim("explode", x, b.groundY - 20, { scale: 1, tint: 0xff8040 });
            b.hitRect(x - 15, b.groundY - 70, 30, 70, 1.1, "fire", { type: "burn", chance: 0.6, dur: 3, power: 0.25 });
            j.play("explosion", 0.5);
          });
        }
        await b.wait(0.18);
      }
      await b.wait(1.1);
      break;
    }
    case "spin": {
      // 화염 회전베기: 불꽃을 두르고 플레이어를 쫓으며 계속 벤다
      b.frame(F("wind"));
      await b.wait(0.5);
      let t = 0, tick = 0;
      while (t < 2 && !b.dead) {
        b.frame(F("spin", Math.floor(t * 12) % 2));
        Rb.vx = Math.sign(p.cx - b.cx) * 120 * b.speedMul;
        if ((tick -= 0.03) <= 0) {
          tick = 0.22;
          b.hitRect(b.cx - 56, Rb.y - 50, 112, 50, 0.6, "fire");
          fx.anim("fx_spin", b.cx, Rb.y - 28, { scale: 2.4, tint: 0xff8040 });
          j.play("swing", 0.7);
        }
        fx.burst("glow", b.cx + (Math.random() - 0.5) * 100, Rb.y - Math.random() * 40, 1, EMBER);
        await b.wait(0.03), (t += 0.03);
      }
      Rb.vx = 0;
      b.frame(F("stagger"));
      await b.wait(1);
      break;
    }
    case "plunge": {
      // 높이 뛰어올라 플레이어 위치로 내려찍기 → 양옆 불꽃 파도
      b.frame(F("leap"));
      const tx = b.clampX(p.cx, 40);
      b.warnCircle(tx, b.groundY - 10, 46, 0.9);
      Rb.vy = -760;
      j.play("jump", 1.2);
      let t = 0;
      while (t < 0.75 && !b.dead) {
        Rb.vx = (tx - Rb.x) * 3;
        await b.wait(0.03), (t += 0.03);
      }
      Rb.vy = 900;
      while (!Rb.onGround && !b.dead && t < 1.6) await b.wait(0.02), (t += 0.02);
      Rb.vx = 0;
      b.frame(F("land"));
      fx.shake(9);
      j.play("thud", 1.6);
      fx.anim("fx_smash", b.cx, b.groundY - 14, { scale: 2.6, tint: 0xffa050 });
      ember(b.cx, b.groundY - 4, 30);
      b.hitRect(b.cx - 60, b.groundY - 50, 120, 50, 1.5, "fire");
      b.wave(-1, 0.8, 300, 0xff8040), b.wave(1, 0.8, 300, 0xff8040);
      await b.wait(0.9);
      break;
    }
    case "summon": {
      // 검을 들어 맹세를 외치면 잔불 기사(녹은 갑옷)가 일어난다
      b.frame(F("summon"));
      host.cameras.main.flash(200, 255, 120, 60);
      j.play("bossRoar");
      await b.wait(0.6);
      await b.summon("fr0_5", 2, 3);
      await b.wait(0.8);
      break;
    }
    default:
      await b.wait(0.5);
  }
}
