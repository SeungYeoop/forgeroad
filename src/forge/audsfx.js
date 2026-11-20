// 효과음: 소리마다 여러 겹 (때리는 순간 + 몸통 + 꼬리) + 공간 울림. 이름은 옛 엔진과 같다.
//   SFX[name](E, t, amt, h): t 시각에, amt 세기(0~1.5), h 음높이 흔들림(0.94~1.06)
import { gainN, filt, panN } from "./audcore.js";

// 소리 하나의 출구: 크기·좌우·울림(공간)·찌그러짐
function out(E, g = 1, o = {}) {
  const ctx = E.ctx, n = gainN(ctx, g);
  let tail = n;
  if (o.pan) {
    const p = panN(ctx, o.pan);
    n.connect(p);
    tail = p;
  }
  tail.connect(o.drive ? E.drive : E.sfxIn);
  if (o.verb) {
    const s = gainN(ctx, o.verb);
    tail.connect(s);
    s.connect(E.sfxSend);
  }
  return n;
}
// 음: 주파수 f0 → f1 (지수), 짧게 붙고 지수로 사라짐
function tn(E, dst, t, o) {
  const ctx = E.ctx, x = ctx.createOscillator(), g = gainN(ctx), a = o.a ?? 0.003, dur = o.dur;
  if (o.wave) x.setPeriodicWave(E.waves[o.wave]);
  else x.type = o.w ?? "sine";
  x.frequency.setValueAtTime(o.f0, t);
  if (o.f1 && o.f1 !== o.f0) x.frequency.exponentialRampToValueAtTime(o.f1, t + (o.ft ?? dur));
  if (o.det) x.detune.setValueAtTime(o.det, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(o.g, t + a);
  if (o.hold) g.gain.setValueAtTime(o.g, t + a + o.hold);
  g.gain.setTargetAtTime(0, t + a + (o.hold ?? 0), o.dec ?? Math.max(0.004, (dur - a) / 5));
  let n = x;
  if (o.lp || o.bp) {
    const b = filt(ctx, o.lp ? "lowpass" : "bandpass", o.lp ?? o.bp, o.q ?? 0.8);
    b.frequency.setValueAtTime(o.lp ?? o.bp, t);
    if (o.lp1) b.frequency.exponentialRampToValueAtTime(o.lp1, t + dur);
    x.connect(b);
    n = b;
  }
  n.connect(g);
  g.connect(dst);
  x.start(t);
  x.stop(t + a + (o.hold ?? 0) + (o.dec ? o.dec * 6 : dur * 1.3) + 0.02);
  return x;
}
// 거른 잡음: 거름 주파수 f0 → f1 (f1m: 중간을 거쳐 감)
function nz(E, dst, t, o) {
  const ctx = E.ctx, dur = o.dur, a = o.a ?? 0.003, len = a + (o.hold ?? 0) + (o.dec ? o.dec * 6 : dur * 1.3);
  const s = E.noiseSrc(t, t + len + 0.02), b = filt(ctx, o.type ?? "bandpass", o.f0, o.q ?? 1), g = gainN(ctx);
  b.frequency.setValueAtTime(o.f0, t);
  if (o.fm) {
    b.frequency.exponentialRampToValueAtTime(o.fm, t + (o.fmt ?? dur * 0.5));
    b.frequency.exponentialRampToValueAtTime(o.f1 ?? o.f0, t + dur);
  } else if (o.f1 && o.f1 !== o.f0) b.frequency.exponentialRampToValueAtTime(o.f1, t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(o.g, t + a);
  if (o.hold) g.gain.setValueAtTime(o.g, t + a + o.hold);
  g.gain.setTargetAtTime(0, t + a + (o.hold ?? 0), o.dec ?? Math.max(0.003, (dur - a) / 5));
  s.connect(b);
  b.connect(g);
  g.connect(dst);
  return b;
}
// FM 종소리 (금속성 ratio, 밝기 index가 점점 줄어든다)
function fm(E, dst, t, o) {
  const ctx = E.ctx, c = ctx.createOscillator(), m = ctx.createOscillator(), mg = gainN(ctx), g = gainN(ctx), dur = o.dur;
  c.frequency.setValueAtTime(o.f, t);
  m.frequency.setValueAtTime(o.f * (o.r ?? 3.5), t);
  if (o.f1) {
    c.frequency.exponentialRampToValueAtTime(o.f1, t + dur);
    m.frequency.exponentialRampToValueAtTime(o.f1 * (o.r ?? 3.5), t + dur);
  }
  mg.gain.setValueAtTime(o.f * (o.i0 ?? 2), t);
  mg.gain.setTargetAtTime(o.f * (o.i1 ?? 0.05), t, dur * 0.25);
  m.connect(mg);
  mg.connect(c.frequency);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(o.g, t + (o.a ?? 0.002));
  g.gain.setTargetAtTime(0, t + (o.a ?? 0.002), dur / 5);
  c.connect(g);
  g.connect(dst);
  c.start(t);
  m.start(t);
  c.stop(t + dur * 1.3 + 0.03);
  m.stop(t + dur * 1.3 + 0.03);
}
const sideR = (E, k = 0.2) => (E.rnd() - 0.5) * 2 * k;
const NOTE = (m) => 440 * Math.pow(2, (m - 69) / 12);

export const SFX = {
  // ── 근접 공격 ──
  swing(E, t, a, h) {
    const o = out(E, 1, { pan: sideR(E, 0.15), verb: 0.06 });
    nz(E, o, t, { dur: 0.17, a: 0.035, g: 0.34 * a, f0: 600 * h, fm: 2900 * h, fmt: 0.08, f1: 900, q: 1.4 });
    nz(E, o, t + 0.02, { type: "highpass", dur: 0.08, a: 0.02, g: 0.05 * a, f0: 5200 });
  },
  swingHeavy(E, t, a, h) {
    const o = out(E, 1, { pan: sideR(E, 0.12), verb: 0.08 });
    nz(E, o, t, { dur: 0.3, a: 0.06, g: 0.4 * a, f0: 300 * h, fm: 1500 * h, fmt: 0.15, f1: 250, q: 1.1 });
    tn(E, o, t, { f0: 110 * h, f1: 55, dur: 0.24, a: 0.04, g: 0.2 * a });
  },
  punch(E, t, a, h) {
    const o = out(E, 1, { verb: 0.05 });
    tn(E, o, t, { f0: 170 * h, f1: 55, dur: 0.12, a: 0.002, g: 0.5 * a });
    nz(E, o, t, { type: "lowpass", dur: 0.05, g: 0.3 * a, f0: 1800, f1: 400, q: 0.7 });
    nz(E, o, t, { dur: 0.03, g: 0.12 * a, f0: 2500, q: 2 });
  },
  hit(E, t, a, h) {
    const o = out(E, 1, { verb: 0.08 }), d = out(E, 0.9, { drive: 1 });
    nz(E, o, t, { type: "highpass", dur: 0.012, a: 0.0005, g: 0.25 * a, f0: 3000 });
    tn(E, d, t, { w: "triangle", f0: 240 * h, f1: 80, dur: 0.09, g: 0.3 * a });
    nz(E, d, t, { dur: 0.08, g: 0.3 * a, f0: 1600 * h, f1: 700, q: 1.2 });
    tn(E, o, t, { f0: 90 * h, f1: 45, dur: 0.1, g: 0.24 * a });
  },
  crit(E, t, a, h) {
    const o = out(E, 1, { verb: 0.2 }), d = out(E, 0.9, { drive: 1 });
    nz(E, o, t, { type: "highpass", dur: 0.014, a: 0.0005, g: 0.3 * a, f0: 2800 });
    tn(E, d, t, { w: "triangle", f0: 280 * h, f1: 70, dur: 0.12, g: 0.36 * a });
    nz(E, d, t, { dur: 0.1, g: 0.34 * a, f0: 2000 * h, f1: 600, q: 1 });
    tn(E, o, t, { f0: 85, f1: 38, dur: 0.22, g: 0.36 * a });
    fm(E, o, t + 0.005, { f: 1250 * h, r: 2.41, i0: 3, i1: 0, dur: 0.42, g: 0.11 * a });
    tn(E, o, t + 0.02, { f0: 2600 * h, f1: 3400 * h, dur: 0.12, g: 0.045 * a });
  },
  block(E, t, a, h) {
    const o = out(E, 1, { verb: 0.25, pan: sideR(E, 0.1) });
    const f = 620 * h;
    [[1, 0.17, 0.35], [1.48, 0.11, 0.28], [2.21, 0.085, 0.2], [2.95, 0.06, 0.16], [3.71, 0.04, 0.12]].forEach(([r, g, d]) => tn(E, o, t, { f0: f * r, dur: d, g: g * a }));
    nz(E, o, t, { type: "highpass", dur: 0.02, a: 0.0005, g: 0.25 * a, f0: 2000 });
  },
  thud(E, t, a, h) {
    const o = out(E, 1, { verb: 0.06 });
    tn(E, o, t, { f0: 95 * h, f1: 38, dur: 0.22, g: 0.42 * a });
    nz(E, o, t, { type: "lowpass", dur: 0.16, g: 0.22 * a, f0: 500, f1: 120, q: 0.7 });
    nz(E, o, t + 0.03, { dur: 0.06, g: 0.06 * a, f0: 900, q: 0.8 });
  },
  playerHurt(E, t, a, h) {
    const o = out(E, 1, { verb: 0.1 });
    nz(E, o, t, { dur: 0.1, g: 0.3 * a, f0: 1200, f1: 500, q: 1 });
    tn(E, o, t, { w: "sawtooth", f0: 260 * h, f1: 140, dur: 0.14, g: 0.14 * a, lp: 900, q: 3 });
    tn(E, o, t, { f0: 120, f1: 60, dur: 0.12, g: 0.3 * a });
    tn(E, o, t + 0.01, { f0: 1800, f1: 1200, dur: 0.08, g: 0.04 * a });
  },
  // ── 움직임 ──
  jump(E, t, a, h) {
    const o = out(E, 1);
    nz(E, o, t, { dur: 0.09, a: 0.01, g: 0.1 * a, f0: 700 * h, f1: 1800 * h, q: 1.2 });
    tn(E, o, t, { f0: 240 * h, f1: 420 * h, dur: 0.07, g: 0.07 * a });
  },
  land(E, t, a, h) {
    const o = out(E, 1);
    nz(E, o, t, { type: "lowpass", dur: 0.08, g: 0.2 * a, f0: 700, f1: 150, q: 0.7 });
    tn(E, o, t, { f0: 130 * h, f1: 60, dur: 0.07, g: 0.18 * a });
  },
  dash(E, t, a, h) {
    const d = E.rnd() < 0.5 ? -1 : 1, o = out(E, 1, { verb: 0.1 }), p = E.ctx.createStereoPanner ? E.ctx.createStereoPanner() : null;
    let dst = o;
    if (p) {
      p.pan.setValueAtTime(-0.35 * d, t);
      p.pan.linearRampToValueAtTime(0.35 * d, t + 0.22);
      p.connect(o);
      dst = p;
    }
    nz(E, dst, t, { dur: 0.22, a: 0.02, g: 0.28 * a, f0: 900 * h, fm: 4200 * h, fmt: 0.1, f1: 1500, q: 1.3 });
    tn(E, dst, t, { f0: 500 * h, f1: 1300 * h, dur: 0.12, g: 0.035 * a });
  },
  charge(E, t, a, h) {
    const o = out(E, 1, { verb: 0.2 });
    tn(E, o, t, { w: "sawtooth", f0: 180 * h, f1: 540 * h, dur: 0.5, a: 0.08, hold: 0.25, dec: 0.06, g: 0.05 * a, lp: 1500, q: 2 });
    tn(E, o, t, { f0: 180 * h, f1: 540 * h, dur: 0.5, a: 0.08, hold: 0.25, dec: 0.06, g: 0.07 * a });
    nz(E, o, t, { dur: 0.5, a: 0.1, hold: 0.25, dec: 0.06, g: 0.04 * a, f0: 800, f1: 3000, q: 2 });
  },
  // ── 돈·보상 ──
  coin(E, t, a, h) {
    // 빠르게 연달아 주우면 한 음씩 올라간다
    const now = t, k = now - (E._coinT ?? -9) < 0.45 ? Math.min(6, (E._coinK ?? 0) + 1) : 0;
    E._coinT = now;
    E._coinK = k;
    const up = Math.pow(2, [0, 2, 4, 7, 9, 12, 14][k] / 12), o = out(E, 1, { verb: 0.15, pan: sideR(E, 0.1) });
    fm(E, o, t, { f: 1975 * up, r: 3, i0: 1.2, i1: 0, dur: 0.18, g: 0.1 * a });
    fm(E, o, t + 0.055, { f: 2637 * up, r: 3, i0: 1, i1: 0, dur: 0.36, g: 0.09 * a });
  },
  coinBig(E, t, a, h) {
    const o = out(E, 1, { verb: 0.3 });
    [84, 88, 91, 96, 100].forEach((m, i) => fm(E, o, t + i * 0.045, { f: NOTE(m), r: 3, i0: 1.5, i1: 0, dur: 0.5, g: 0.085 * a }));
    nz(E, o, t + 0.05, { type: "highpass", dur: 0.4, a: 0.05, g: 0.03 * a, f0: 7000 });
  },
  buy(E, t, a, h) {
    const o = out(E, 1, { verb: 0.2 });
    for (let i = 0; i < 3; i++) fm(E, o, t + i * 0.03, { f: 2200 + E.rnd() * 1100, r: 3, i0: 1, i1: 0, dur: 0.16, g: 0.06 * a });
    nz(E, o, t, { dur: 0.04, g: 0.15 * a, f0: 900, q: 2 });
    tn(E, o, t, { f0: 300, f1: 200, dur: 0.05, g: 0.1 * a });
    fm(E, o, t + 0.09, { f: 1568, r: 3, i0: 1.4, i1: 0, dur: 0.5, g: 0.085 * a });
  },
  chest(E, t, a, h) {
    const o = out(E, 1, { verb: 0.3 });
    tn(E, o, t, { w: "sawtooth", f0: 90, f1: 70, dur: 0.22, a: 0.03, g: 0.05 * a, bp: 700, q: 6 });
    nz(E, o, t + 0.1, { type: "highpass", dur: 0.015, a: 0.0005, g: 0.15 * a, f0: 3000 });
    [79, 83, 86, 91].forEach((m, i) => fm(E, o, t + 0.12 + i * 0.05, { f: NOTE(m), r: 3, i0: 1.2, i1: 0, dur: 0.45, g: 0.07 * a }));
  },
  // ── 적 ──
  enemyDie(E, t, a, h) {
    const o = out(E, 1, { verb: 0.2 });
    nz(E, o, t, { type: "lowpass", dur: 0.35, a: 0.005, g: 0.28 * a, f0: 3000, f1: 200, q: 0.8 });
    tn(E, o, t, { f0: 140 * h, f1: 45, dur: 0.18, g: 0.3 * a });
    [1200, 900, 700].forEach((f, i) => tn(E, o, t + 0.06 + i * 0.05, { f0: f * h, f1: f * 0.8 * h, dur: 0.08, g: 0.045 * a }));
  },
  bossRoar(E, t, a, h) {
    const o = out(E, 1, { verb: 0.35, drive: 1 }), ctx = E.ctx;
    // 으르렁: 톱니 둘 + 28Hz 떨림 + 모음 꼴 거름
    const am = ctx.createOscillator(), amg = gainN(ctx, 0.45), vca = gainN(ctx, 0.55);
    am.frequency.value = 28;
    am.connect(amg);
    amg.connect(vca.gain);
    vca.connect(o);
    tn(E, vca, t, { w: "sawtooth", f0: 82, f1: 55, dur: 1.2, a: 0.08, hold: 0.5, dec: 0.18, g: 0.3 * a, lp: 900, lp1: 380, q: 1.5 });
    tn(E, vca, t, { w: "sawtooth", f0: 123, f1: 80, dur: 1.1, a: 0.1, hold: 0.45, dec: 0.16, g: 0.16 * a, lp: 1100, q: 1.5, det: 12 });
    am.start(t);
    am.stop(t + 1.8);
    nz(E, o, t, { dur: 1.1, a: 0.1, hold: 0.4, dec: 0.15, g: 0.18 * a, f0: 650, f1: 350, q: 4 });
    nz(E, o, t, { type: "lowpass", dur: 1.3, a: 0.15, hold: 0.4, dec: 0.25, g: 0.3 * a, f0: 180, q: 0.7 });
    E.duck(0.5, t, 1.2);
  },
  warn(E, t, a, h) {
    const o = out(E, 1, { verb: 0.15 });
    fm(E, o, t, { f: 880, r: 2, i0: 1, i1: 0.2, dur: 0.14, g: 0.11 * a });
    fm(E, o, t + 0.12, { f: 659, r: 2, i0: 1, i1: 0.2, dur: 0.2, g: 0.11 * a });
    tn(E, o, t, { f0: 220, dur: 0.22, a: 0.01, g: 0.07 * a });
  },
  explosion(E, t, a, h) {
    const o = out(E, 1, { verb: 0.3 }), d = out(E, 0.8, { drive: 1 });
    tn(E, o, t, { f0: 75 * h, f1: 28, dur: 0.7, g: 0.55 * a });
    nz(E, o, t, { type: "lowpass", dur: 1, a: 0.004, g: 0.45 * a, f0: 2400, f1: 90, q: 0.7 });
    nz(E, d, t, { dur: 0.25, g: 0.25 * a, f0: 800, q: 0.7 });
    for (let i = 0; i < 8; i++) nz(E, o, t + 0.05 + E.rnd() * 0.45, { type: "highpass", dur: 0.01 + E.rnd() * 0.02, a: 0.0005, g: (0.04 + E.rnd() * 0.06) * a, f0: 2500 });
    E.duck(0.6 * Math.min(1, a), t, 0.5);
  },
  // ── 마법·원거리 ──
  shoot(E, t, a, h) {
    const o = out(E, 1, { verb: 0.12 });
    fm(E, o, t, { f: 900 * h, f1: 420 * h, r: 1.5, i0: 2, i1: 0, dur: 0.12, g: 0.1 * a });
    nz(E, o, t, { type: "highpass", dur: 0.05, g: 0.07 * a, f0: 4000 });
  },
  bow(E, t, a, h) {
    const o = out(E, 1, { verb: 0.08 });
    tn(E, o, t, { w: "triangle", f0: 210 * h, f1: 190 * h, dur: 0.12, g: 0.18 * a });
    tn(E, o, t, { f0: 420 * h, f1: 380 * h, dur: 0.08, g: 0.06 * a });
    nz(E, o, t + 0.02, { dur: 0.14, g: 0.12 * a, f0: 3200, f1: 1600, q: 1.4 });
  },
  magic(E, t, a, h) {
    const o = out(E, 1, { verb: 0.35, pan: sideR(E, 0.12) });
    [660, 990, 1320].forEach((f, i) => tn(E, o, t + i * 0.03, { f0: f * h, f1: f * 1.5 * h, dur: 0.3, a: 0.03, g: 0.055 * a }));
    fm(E, o, t, { f: 2400 * h, r: 1.41, i0: 2, i1: 0, dur: 0.25, g: 0.035 * a });
    nz(E, o, t, { dur: 0.3, a: 0.04, g: 0.05 * a, f0: 3000, f1: 6000, q: 2 });
  },
  ice(E, t, a, h) {
    const o = out(E, 1, { verb: 0.35 });
    fm(E, o, t, { f: 1900 * h, r: 3.6, i0: 3, i1: 0, dur: 0.45, g: 0.075 * a });
    fm(E, o, t + 0.03, { f: 2850 * h, r: 2.7, i0: 2, i1: 0, dur: 0.35, g: 0.05 * a });
    for (let i = 0; i < 5; i++) nz(E, o, t + E.rnd() * 0.2, { type: "highpass", dur: 0.015, a: 0.0005, g: 0.05 * a, f0: 5000 });
    nz(E, o, t, { dur: 0.3, a: 0.02, g: 0.06 * a, f0: 6000, f1: 2500, q: 2 });
  },
  lightning(E, t, a, h) {
    const o = out(E, 1, { verb: 0.3 }), d = out(E, 0.8, { drive: 1 });
    nz(E, d, t, { type: "highpass", dur: 0.06, a: 0.001, g: 0.5 * a, f0: 2500 });
    tn(E, o, t, { w: "sawtooth", f0: 1800, f1: 120, dur: 0.15, g: 0.07 * a, bp: 1500, q: 1 });
    nz(E, o, t + 0.03, { type: "lowpass", dur: 0.9, a: 0.02, g: 0.32 * a, f0: 400, f1: 80, q: 0.7 });
    tn(E, o, t, { f0: 60, f1: 35, dur: 0.4, g: 0.3 * a });
    E.duck(0.35, t, 0.3);
  },
  heal(E, t, a, h) {
    const o = out(E, 1, { verb: 0.4 });
    [72, 76, 79, 84].forEach((m, i) => fm(E, o, t + i * 0.06, { f: NOTE(m), r: 2, i0: 0.8, i1: 0, dur: 0.6, g: 0.075 * a }));
    tn(E, o, t, { f0: NOTE(72), dur: 0.6, a: 0.15, g: 0.035 * a });
    tn(E, o, t, { f0: NOTE(79), dur: 0.6, a: 0.15, g: 0.03 * a });
    nz(E, o, t, { type: "highpass", dur: 0.5, a: 0.1, g: 0.02 * a, f0: 7000 });
  },
  buff(E, t, a, h) {
    const o = out(E, 1, { verb: 0.3 });
    tn(E, o, t, { w: "sawtooth", f0: 220, f1: 880, dur: 0.35, a: 0.02, g: 0.065 * a, lp: 400, lp1: 4000, q: 4 });
    fm(E, o, t + 0.25, { f: 659, r: 2, i0: 1, i1: 0, dur: 0.4, g: 0.065 * a });
    fm(E, o, t + 0.25, { f: 988, r: 2, i0: 1, i1: 0, dur: 0.4, g: 0.055 * a });
  },
  // ── 화면 ──
  click(E, t, a, h) {
    const o = out(E, 1);
    tn(E, o, t, { f0: 1500, dur: 0.025, a: 0.001, g: 0.08 * a });
    nz(E, o, t, { type: "highpass", dur: 0.008, a: 0.0005, g: 0.05 * a, f0: 6000 });
  },
  open(E, t, a, h) {
    const o = out(E, 1, { verb: 0.15 });
    nz(E, o, t, { dur: 0.12, a: 0.03, g: 0.06 * a, f0: 600, f1: 2400, q: 1.2 });
    fm(E, o, t, { f: 1318, r: 2, i0: 0.8, i1: 0, dur: 0.2, g: 0.055 * a });
    fm(E, o, t + 0.05, { f: 1975, r: 2, i0: 0.8, i1: 0, dur: 0.25, g: 0.05 * a });
  },
  close(E, t, a, h) {
    const o = out(E, 1, { verb: 0.12 });
    fm(E, o, t, { f: 988, r: 2, i0: 0.8, i1: 0, dur: 0.15, g: 0.055 * a });
    fm(E, o, t + 0.05, { f: 659, r: 2, i0: 0.8, i1: 0, dur: 0.2, g: 0.05 * a });
    nz(E, o, t, { dur: 0.1, a: 0.02, g: 0.05 * a, f0: 2000, f1: 600, q: 1.2 });
  },
  error(E, t, a, h) {
    const o = out(E, 1);
    tn(E, o, t, { w: "triangle", f0: 330, f1: 310, dur: 0.09, g: 0.13 * a, lp: 1200 });
    tn(E, o, t + 0.1, { w: "triangle", f0: 247, f1: 233, dur: 0.14, g: 0.13 * a, lp: 1200 });
  },
  levelup(E, t, a, h) {
    const o = out(E, 1, { verb: 0.35 });
    [72, 76, 79, 84].forEach((m, i) => {
      const last = i === 3;
      tn(E, o, t + i * 0.08, { w: "sawtooth", f0: NOTE(m), dur: last ? 0.6 : 0.14, a: 0.015, hold: last ? 0.25 : 0, dec: last ? 0.12 : 0.03, g: 0.06 * a, lp: NOTE(m) * 4, q: 1 });
    });
    tn(E, o, t + 0.24, { w: "sawtooth", f0: NOTE(76), dur: 0.6, a: 0.02, hold: 0.25, dec: 0.12, g: 0.04 * a, lp: 2000 });
    tn(E, o, t + 0.24, { w: "sawtooth", f0: NOTE(79), dur: 0.6, a: 0.02, hold: 0.25, dec: 0.12, g: 0.04 * a, lp: 2200 });
    fm(E, o, t + 0.24, { f: NOTE(96), r: 3, i0: 1.2, i1: 0, dur: 0.6, g: 0.05 * a });
    nz(E, o, t + 0.1, { type: "highpass", dur: 0.6, a: 0.2, g: 0.035 * a, f0: 6000 });
  },
  record(E, t, a, h) {
    const o = out(E, 1, { verb: 0.4 });
    tn(E, o, t, { f0: 66, f1: 64, dur: 1.2, g: 0.4 * a });
    nz(E, o, t, { type: "lowpass", dur: 0.08, g: 0.3 * a, f0: 600 });
    [60, 64, 67, 72].forEach((m) => tn(E, o, t, { w: "sawtooth", f0: NOTE(m), dur: 0.9, a: 0.03, hold: 0.4, dec: 0.15, g: 0.045 * a, lp: 2400, q: 1 }));
    [84, 88, 91, 96, 100].forEach((m, i) => fm(E, o, t + 0.1 + i * 0.07, { f: NOTE(m), r: 3, i0: 1.4, i1: 0, dur: 0.6, g: 0.06 * a }));
    nz(E, o, t, { type: "highpass", dur: 1.8, a: 0.002, g: 0.12 * a, f0: 5000, dec: 0.4 });
    E.duck(0.5, t, 1.2);
  },
  death(E, t, a, h) {
    const o = out(E, 1, { verb: 0.5 });
    tn(E, o, t, { f0: 80, f1: 30, dur: 1, g: 0.4 * a });
    tn(E, o, t, { w: "sawtooth", f0: 440, f1: 110, dur: 1.2, g: 0.08 * a, lp: 1500, lp1: 300 });
    tn(E, o, t, { w: "sawtooth", f0: 466, f1: 117, dur: 1.2, g: 0.07 * a, lp: 1500, lp1: 300 });
    nz(E, o, t, { type: "lowpass", dur: 1, g: 0.15 * a, f0: 800, f1: 100, q: 0.7 });
  },
  portal(E, t, a, h) {
    const o = out(E, 1, { verb: 0.5 }), ctx = E.ctx;
    const b = nz(E, o, t, { dur: 0.9, a: 0.15, hold: 0.3, dec: 0.12, g: 0.12 * a, f0: 400, f1: 2400, q: 3 });
    const l = ctx.createOscillator(), lg = gainN(ctx, 300);
    l.frequency.value = 4;
    l.connect(lg);
    lg.connect(b.frequency);
    l.start(t);
    l.stop(t + 1.2);
    tn(E, o, t, { f0: 200, f1: 800, dur: 0.8, a: 0.1, g: 0.05 * a });
    tn(E, o, t, { f0: 300, f1: 1200, dur: 0.8, a: 0.1, g: 0.045 * a });
    fm(E, o, t + 0.6, { f: 1568, r: 2, i0: 1, i1: 0, dur: 0.5, g: 0.045 * a });
    fm(E, o, t + 0.66, { f: 2093, r: 2, i0: 1, i1: 0, dur: 0.5, g: 0.04 * a });
  },
};
// 같은 소리를 너무 촘촘히 내지 않는 최소 간격 (초)
export const GAP = { coin: 0.035, hit: 0.03, thud: 0.04, explosion: 0.06, magic: 0.04, swing: 0.03, click: 0.02 };
// 소리별 크기 보정 (측정해서 맞춤: 자주 나는 작은 소리도 묻히지 않게)
export const LVL = { swing: 2.5, jump: 2, dash: 2.8, coin: 2.5, magic: 3.2, open: 2, close: 2, ice: 2, buff: 1.8, portal: 2.2, charge: 1.6, warn: 1.8, swingHeavy: 1.4, heal: 1.4, levelup: 1.4, coinBig: 1.4, buy: 1.4, chest: 1.4, error: 1.25, block: 1.4, hit: 0.9, crit: 0.9, lightning: 0.8 };
export const SFX_NAMES = Object.keys(SFX);
