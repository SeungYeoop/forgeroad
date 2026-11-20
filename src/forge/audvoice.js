// 합성 악기: 음 하나(또는 화음 하나)를 시각 t에 예약한다. 모두 (E, out, t, 음높이, 길이초, 세기, 옵션) → 끝 시각
//   E: 엔진 (ctx, waves, noiseSrc, rnd)   out: 보낼 노드
import { mtof, envPerc, envADSR, gainN, filt, panN } from "./audcore.js";

function glide(o, f0, f1, t, d = 0.05) {
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + d);
}
// 비브라토: delay 뒤에 서서히 깊어진다 (cents)
function vibrato(E, xs, t, rate, cents, delay, end) {
  const ctx = E.ctx, l = ctx.createOscillator(), g = ctx.createGain();
  l.frequency.value = rate * (0.94 + 0.12 * E.rnd());
  g.gain.setValueAtTime(0, t);
  g.gain.setValueAtTime(0, t + delay);
  g.gain.linearRampToValueAtTime(cents, t + delay + 0.35);
  l.connect(g);
  for (const x of xs) g.connect(x.detune);
  l.start(t);
  l.stop(end);
}
const sine = (ctx, f, t) => {
  const o = ctx.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(f, t);
  return o;
};

// ── 뜯는 소리 (하프·기타·우드): 밝게 시작해 어두워지는 거름 ──
export function pluck(E, out, t, m, dur, v, o = {}) {
  // 거름 자동화 없이: 몸통(어두운 파형, 길게) + 튕기는 순간(밝은 파형, 아주 짧게) 두 겹
  const ctx = E.ctx, f = mtof(m), dec = o.decay ?? 0.55, pk = v * (o.g ?? 0.4), wv = o.wave ?? "soft";
  const mk = (w) => {
    const x = ctx.createOscillator();
    x.setPeriodicWave(E.waves[w]);
    if (o.twang) glide(x, f * 1.018, f, t, 0.035);
    else x.frequency.setValueAtTime(f, t);
    return x;
  };
  const a = mk(wv), ga = gainN(ctx);
  let end = envPerc(ga.gain, t, 0.002, pk, dec, dec * 4.2);
  if (o.damp) {
    ga.gain.setTargetAtTime(0, t + Math.max(0.03, dur), 0.05);
    end = Math.min(end, t + dur + 0.35);
  }
  if (wv === "soft") a.connect(ga);
  else {
    const lp = filt(ctx, "lowpass", Math.min(12000, f * (o.sus ?? 3)), o.q ?? 0.9);
    a.connect(lp);
    lp.connect(ga);
  }
  ga.connect(out);
  const b = mk("bright"), lb = filt(ctx, "lowpass", Math.min(15000, f * (o.bright ?? 7)), o.q ?? 0.9), gb = gainN(ctx);
  const eb = envPerc(gb.gain, t, 0.001, pk * 0.55, o.fdec ?? 0.05, 0.3);
  b.connect(lb);
  lb.connect(gb);
  gb.connect(out);
  a.start(t);
  a.stop(end);
  b.start(t);
  b.stop(eb);
  return end;
}

// ── 패드 (화음): 좌우로 갈라진 톱니 묶음 + 천천히 열리는 거름 ──
export function pad(E, out, t, ms, dur, v, o = {}) {
  const ctx = E.ctx, A = o.a ?? 1.0, cut = o.cut ?? 1400;
  const g = gainN(ctx);
  const end = envADSR(g.gain, t, dur, A, 0, 1, o.r ?? 1.5, (v * (o.g ?? 0.16)) / Math.sqrt(ms.length));
  const hp = g;
  g.connect(out);
  const det = o.det ?? 7, xs = [];
  for (const side of [-1, 1]) {
    const lp = filt(ctx, "lowpass", cut * 0.5, o.q ?? 0.6);
    lp.frequency.setValueAtTime(cut * 0.5, t);
    lp.frequency.linearRampToValueAtTime(cut, t + A * 1.3);
    if (o.swell) lp.frequency.linearRampToValueAtTime(cut * 1.7, t + Math.max(A * 1.3 + 0.1, dur));
    const pn = panN(ctx, side * (o.width ?? 0.5));
    lp.connect(pn);
    pn.connect(hp);
    for (const m of ms) {
      const x = ctx.createOscillator();
      if (o.type) x.type = o.type;
      else x.setPeriodicWave(E.waves[o.wave ?? "warm"]);
      x.frequency.setValueAtTime(mtof(m), t);
      x.detune.setValueAtTime(side * det + (E.rnd() - 0.5) * 5, t);
      x.connect(lp);
      xs.push(x);
    }
  }
  if (o.wob) vibrato(E, xs, t, 0.22 + E.rnd() * 0.15, o.wob, 0, end);
  if (o.shimmer) {
    // 한 옥타브 위 사인 (얇게 반짝)
    const sg = gainN(ctx, o.shimmer);
    sg.connect(hp);
    for (const m of ms) {
      const x = sine(ctx, mtof(m + 12), t);
      x.detune.setValueAtTime((E.rnd() - 0.5) * 10, t);
      x.connect(sg);
      xs.push(x);
    }
  }
  for (const x of xs) {
    x.start(t);
    x.stop(end);
  }
  return end;
}

// ── 현악 (한 음): 톱니 셋을 어긋나게 + 활 긋는 듯 열리는 거름 + 비브라토. stac=짧게 끊는 연주 ──
export function strings(E, out, t, m, dur, v, o = {}) {
  const ctx = E.ctx, f = mtof(m), st = !!o.stac;
  const br = Math.min(9000, f * (o.bright ?? 5) + 300), a = o.a ?? 0.16;
  const lp = filt(ctx, "lowpass", br, 0.5), g = gainN(ctx);
  const peak = v * (o.g ?? 0.15) * (st ? 1.5 : 1);
  const end = st ? envADSR(g.gain, t, Math.min(dur, 0.09), 0.004, 0.06, 0.4, 0.08, peak) : envADSR(g.gain, t, dur, a, 0.4, 0.82, o.r ?? 0.38, peak);
  if (!st) {
    lp.frequency.setValueAtTime(f * 1.5 + 200, t);
    lp.frequency.linearRampToValueAtTime(br, t + a * 1.4);
  }
  const xs = (st ? [-6] : [-11, 2, 10]).map((d) => {
    const x = ctx.createOscillator();
    x.type = "sawtooth";
    if (o.from != null) glide(x, mtof(o.from), f, t, 0.06);
    else x.frequency.setValueAtTime(f, t);
    x.detune.setValueAtTime(d, t);
    x.connect(lp);
    return x;
  });
  if (!st && dur > 0.3) vibrato(E, xs, t, 5.3, 9, 0.22, end);
  lp.connect(g);
  g.connect(out);
  for (const x of xs) {
    x.start(t);
    x.stop(end);
  }
  return end;
}

// ── 금관 (호른·트럼펫): 소리가 커지며 밝아지는 거름, 시작음이 살짝 아래서 올라온다 ──
export function brass(E, out, t, m, dur, v, o = {}) {
  const ctx = E.ctx, f = mtof(m), sw = o.swell ?? 0.07;
  const top = Math.min(12000, f * (2 + 4.5 * v) * (o.bright ?? 1));
  const lp = filt(ctx, "lowpass", f, o.q ?? 1.4), g = gainN(ctx);
  lp.frequency.setValueAtTime(f * 0.8, t);
  lp.frequency.linearRampToValueAtTime(top, t + sw);
  const td = Math.max(dur, sw + 0.02);
  lp.frequency.linearRampToValueAtTime(top * 0.6, t + Math.min(td, sw + 0.4));
  lp.frequency.setValueAtTime(top * 0.6, t + td);
  lp.frequency.linearRampToValueAtTime(f * 0.8, t + td + 0.15);
  const end = envADSR(g.gain, t, dur, o.a ?? 0.03, 0.25, 0.78, o.r ?? 0.14, v * (o.g ?? 0.16));
  const xs = [-5, 5].map((d) => {
    const x = ctx.createOscillator();
    x.type = "sawtooth";
    if (o.from != null) {
      glide(x, mtof(o.from), f, t, 0.05);
      x.detune.setValueAtTime(d, t);
    } else {
      x.frequency.setValueAtTime(f, t);
      x.detune.setValueAtTime(d - 28, t);
      x.detune.linearRampToValueAtTime(d, t + 0.05);
    }
    x.connect(lp);
    return x;
  });
  if (dur > 0.35) vibrato(E, xs, t, 5, 7, 0.28, end);
  lp.connect(g);
  g.connect(out);
  for (const x of xs) {
    x.start(t);
    x.stop(end);
  }
  return end;
}

// ── 피리 (플루트·네이): 부드러운 파형 + 숨소리 + 늦게 오는 비브라토 ──
export function flute(E, out, t, m, dur, v, o = {}) {
  const ctx = E.ctx, f = mtof(m), peak = v * (o.g ?? 0.2);
  const x = ctx.createOscillator();
  x.setPeriodicWave(E.waves.flute);
  if (o.from != null) glide(x, mtof(o.from), f, t, 0.045);
  else {
    x.frequency.setValueAtTime(f, t);
    x.detune.setValueAtTime(-20, t);
    x.detune.linearRampToValueAtTime(0, t + 0.06);
  }
  const lp = filt(ctx, "lowpass", Math.min(12000, f * 6), 0.4), g = gainN(ctx);
  const end = envADSR(g.gain, t, dur, o.a ?? (o.from != null ? 0.02 : 0.055), 0.2, 0.8, o.r ?? 0.12, peak);
  x.connect(lp);
  lp.connect(g);
  g.connect(out);
  const n = E.noiseSrc(t, end), bp = filt(ctx, "bandpass", Math.min(11000, f * 2.2), 0.8), ng = gainN(ctx), br = o.breath ?? 0.3;
  ng.gain.setValueAtTime(0, t);
  ng.gain.linearRampToValueAtTime(peak * br, t + 0.025);
  ng.gain.setTargetAtTime(peak * br * 0.25, t + 0.03, 0.07);
  ng.gain.setTargetAtTime(0, t + Math.max(dur, 0.05), 0.03);
  n.connect(bp);
  bp.connect(ng);
  ng.connect(out);
  if (dur > 0.28) vibrato(E, [x], t, 5.1, o.vib ?? 12, 0.2, end);
  x.start(t);
  x.stop(end);
  return end;
}

// ── 리드 (클라리넷): 홀수 배음 + 따뜻한 거름 ──
export function reed(E, out, t, m, dur, v, o = {}) {
  const ctx = E.ctx, f = mtof(m), peak = v * (o.g ?? 0.15);
  const x = ctx.createOscillator();
  x.setPeriodicWave(E.waves.reed);
  if (o.from != null) glide(x, mtof(o.from), f, t, 0.05);
  else {
    x.frequency.setValueAtTime(f, t);
    x.detune.setValueAtTime(-15, t);
    x.detune.linearRampToValueAtTime(0, t + 0.05);
  }
  const lp = filt(ctx, "lowpass", Math.min(9000, f * (o.bright ?? 3.5)), 1.1), g = gainN(ctx);
  const end = envADSR(g.gain, t, dur, 0.045, 0.2, 0.85, 0.1, peak);
  x.connect(lp);
  lp.connect(g);
  g.connect(out);
  const n = E.noiseSrc(t, end), bp = filt(ctx, "bandpass", Math.min(9000, f * 3), 1.2), ng = gainN(ctx);
  ng.gain.setValueAtTime(0, t);
  ng.gain.linearRampToValueAtTime(peak * 0.12, t + 0.03);
  ng.gain.setTargetAtTime(0, t + Math.max(dur, 0.05), 0.04);
  n.connect(bp);
  bp.connect(ng);
  ng.connect(out);
  if (dur > 0.3) vibrato(E, [x], t, 4.6, 8, 0.3, end);
  x.start(t);
  x.stop(end);
  return end;
}

// ── 옛 게임기 소리 (펄스파 둘): 변이의 길에서만 ──
export function chip(E, out, t, m, dur, v, o = {}) {
  const ctx = E.ctx, f = mtof(m), peak = v * (o.g ?? 0.09);
  const lp = filt(ctx, "lowpass", 6500, 0.5), g = gainN(ctx);
  const end = envADSR(g.gain, t, dur, 0.004, 0.12, 0.65, 0.06, peak);
  const xs = [0, 9].map((d, i) => {
    const x = ctx.createOscillator();
    x.setPeriodicWave(E.waves.pulse);
    if (o.from != null) glide(x, mtof(o.from), f, t, 0.04);
    else x.frequency.setValueAtTime(f, t);
    x.detune.setValueAtTime(d, t);
    const xg = gainN(ctx, i ? 0.55 : 1);
    x.connect(xg);
    xg.connect(lp);
    return x;
  });
  if (dur > 0.22) vibrato(E, xs, t, 6, 14, 0.14, end);
  lp.connect(g);
  g.connect(out);
  for (const x of xs) {
    x.start(t);
    x.stop(end);
  }
  return end;
}

// ── 종 (FM): ratio 3.5=교회 종, 4=첼레스타, 5~7=오르골 ──
export function bell(E, out, t, m, dur, v, o = {}) {
  const ctx = E.ctx, f = mtof(m), r = o.ratio ?? 3.5, dec = o.decay ?? 1.1;
  const c = sine(ctx, f, t), mo = sine(ctx, f * r, t), mg = gainN(ctx), g = gainN(ctx);
  mg.gain.setValueAtTime(f * (o.index ?? 2.5), t);
  mg.gain.setTargetAtTime(f * (o.index1 ?? 0.15), t, dec * 0.3);
  mo.connect(mg);
  mg.connect(c.frequency);
  const end = envPerc(g.gain, t, 0.0015, v * (o.g ?? 0.14), dec);
  c.connect(g);
  g.connect(out);
  c.start(t);
  mo.start(t);
  c.stop(end);
  mo.stop(end);
  return end;
}

// ── 전자 피아노 (FM 1:1 + 높은 쇳소리 살짝) ──
export function ep(E, out, t, m, dur, v, o = {}) {
  const ctx = E.ctx, f = mtof(m), dec = o.decay ?? Math.max(0.45, 1.5 - (m - 50) * 0.025), peak = v * (o.g ?? 0.16);
  const c = sine(ctx, f, t), mo = sine(ctx, f, t), mg = gainN(ctx), g = gainN(ctx);
  mo.detune.setValueAtTime(3, t);
  mg.gain.setValueAtTime(f * (0.6 + 1.6 * v), t);
  mg.gain.setTargetAtTime(f * 0.18, t, 0.35);
  mo.connect(mg);
  mg.connect(c.frequency);
  let end = envPerc(g.gain, t, 0.002, peak, dec);
  if (dur < dec * 3) {
    g.gain.setTargetAtTime(0, t + Math.max(0.05, dur), 0.14);
    end = Math.min(end, t + dur + 0.8);
  }
  c.connect(g);
  g.connect(out);
  const ti = sine(ctx, f * 7.02, t), tg = gainN(ctx);
  envPerc(tg.gain, t, 0.001, peak * 0.07, 0.03, 0.2);
  ti.connect(tg);
  tg.connect(out);
  c.start(t);
  mo.start(t);
  ti.start(t);
  c.stop(end);
  mo.stop(end);
  ti.stop(t + 0.25);
  return end;
}

// ── 나무 건반 (마림바·칼림바) ──
export function mallet(E, out, t, m, dur, v, o = {}) {
  const ctx = E.ctx, f = mtof(m), dec = o.decay ?? 0.4, peak = v * (o.g ?? 0.2);
  const P = o.kal ? [[1, 1, 1], [5.4, 0.22, 0.2], [8.9, 0.06, 0.08]] : [[1, 1, 1], [3.99, 0.3, 0.28], [9.2, 0.07, 0.08]];
  let end = t;
  for (const [r, a, d] of P) {
    if (f * r > 16000) continue;
    const x = sine(ctx, f * r, t), g = gainN(ctx);
    const e = envPerc(g.gain, t, 0.0015, peak * a, dec * d);
    x.connect(g);
    g.connect(out);
    x.start(t);
    x.stop(e);
    end = Math.max(end, e);
  }
  return end;
}

// ── 낮게 깔리는 소리 (동굴·심연): 근음+5도, 아주 느리게 숨쉬는 거름 ──
export function drone(E, out, t, ms, dur, v, o = {}) {
  const ctx = E.ctx, root = ms[0], cut = o.cut ?? 420;
  const lp = filt(ctx, "lowpass", cut, 0.8), g = gainN(ctx);
  const end = envADSR(g.gain, t, dur, o.a ?? 2, 0, 1, o.r ?? 2.5, v * (o.g ?? 0.18));
  const lfo = ctx.createOscillator(), lg = gainN(ctx, cut * 0.45);
  lfo.frequency.value = 0.05 + E.rnd() * 0.05;
  lfo.connect(lg);
  lg.connect(lp.frequency);
  const xs = [];
  for (const [m, d, a] of [[root, -6, 1], [root, 6, 1], [root + 7, 0, o.fifth ?? 0.6], [root - 12, 0, 0.5]]) {
    const x = ctx.createOscillator();
    x.type = "sawtooth";
    x.frequency.setValueAtTime(mtof(m), t);
    x.detune.setValueAtTime(d, t);
    const xg = gainN(ctx, a);
    x.connect(xg);
    xg.connect(lp);
    xs.push(x);
  }
  lp.connect(g);
  g.connect(out);
  for (const x of [...xs, lfo]) {
    x.start(t);
    x.stop(end);
  }
  return end;
}

// ── 합창 (화음): 톱니 → 모음 꼴 거름(3개) → 부드럽게 ──
const VOW = {
  a: [[730, 1, 9], [1090, 0.5, 11], [2440, 0.22, 16]],
  o: [[450, 1, 8], [800, 0.45, 10], [2830, 0.12, 16]],
  u: [[325, 1, 7], [700, 0.3, 9], [2530, 0.08, 14]],
  e: [[530, 1, 8], [1840, 0.4, 12], [2480, 0.2, 16]],
};
export function choir(E, out, t, ms, dur, v, o = {}) {
  const ctx = E.ctx, A = o.a ?? 0.6;
  const src = gainN(ctx, 1), sum = gainN(ctx, 1), g = gainN(ctx);
  const end = envADSR(g.gain, t, dur, A, 0, 1, o.r ?? 1.0, (v * (o.g ?? 0.45)) / Math.sqrt(ms.length));
  const xs = [];
  for (const m of ms)
    for (const d of [-8, 7]) {
      const x = ctx.createOscillator();
      x.type = "sawtooth";
      x.frequency.setValueAtTime(mtof(m), t);
      x.detune.setValueAtTime(d + (E.rnd() - 0.5) * 6, t);
      x.connect(src);
      xs.push(x);
    }
  vibrato(E, xs, t, 4.8, 7, 0.3, end);
  for (const [fq, gg, q] of VOW[o.vowel ?? "a"]) {
    const bp = filt(ctx, "bandpass", fq, q), bg = gainN(ctx, gg * 3.4);
    src.connect(bp);
    bp.connect(bg);
    bg.connect(sum);
  }
  const lp = filt(ctx, "lowpass", 3800, 0.5);
  sum.connect(lp);
  lp.connect(g);
  g.connect(out);
  for (const x of xs) {
    x.start(t);
    x.stop(end);
  }
  return end;
}

// ── 베이스: upright(뜯는 콘트라베이스) / synth(필터 쓸리는 신스) / sub(낮은 사인) ──
export function bass(E, out, t, m, dur, v, o = {}) {
  // 거름은 고정, 밝기 변화는 짧은 "튕김" 겹으로 (거름 자동화가 무거워서)
  const ctx = E.ctx, f = mtof(m), k = o.kind ?? "upright", peak = v * (o.g ?? 0.4);
  const g = gainN(ctx), xs = [];
  const osc = (type, fr, wave) => {
    const x = ctx.createOscillator();
    if (wave) x.setPeriodicWave(E.waves[wave]);
    else x.type = type;
    x.frequency.setValueAtTime(fr, t);
    xs.push(x);
    return x;
  };
  let end;
  if (k === "sub") {
    const lp = filt(ctx, "lowpass", 260, 0.7), bg = gainN(ctx, 0.25);
    end = envADSR(g.gain, t, dur, 0.02, 0, 1, 0.15, peak);
    osc("sine", f).connect(lp);
    osc("triangle", f).connect(bg);
    bg.connect(lp);
    lp.connect(g);
  } else if (k === "synth") {
    const lp = filt(ctx, "lowpass", (240 + f * 1.5) * (o.bright ?? 1), o.q ?? 3), bg = gainN(ctx, 0.6);
    end = envADSR(g.gain, t, dur, 0.003, 0.25, 0.6, 0.05, peak * 0.8);
    osc("sawtooth", f).connect(lp);
    osc("square", f / 2).connect(bg);
    bg.connect(lp);
    lp.connect(g);
    const hb = filt(ctx, "lowpass", (700 + 1500 * v) * (o.bright ?? 1), 2), hg = gainN(ctx);
    envPerc(hg.gain, t, 0.002, peak * 0.45, 0.035, 0.2);
    osc("sawtooth", f).connect(hb);
    hb.connect(hg);
    hg.connect(out);
  } else {
    end = envPerc(g.gain, t, 0.004, peak, o.decay ?? 0.5);
    g.gain.setTargetAtTime(0, t + Math.max(0.05, dur), 0.05);
    end = Math.min(end, t + dur + 0.3);
    osc(null, f, "soft").connect(g);
    osc("sine", f).connect(g);
    const hb = filt(ctx, "lowpass", Math.min(4000, f * 7), 0.8), hg = gainN(ctx);
    envPerc(hg.gain, t, 0.002, peak * 0.4, 0.03, 0.18);
    osc(null, f, "bright").connect(hb);
    hb.connect(hg);
    hg.connect(out);
  }
  g.connect(out);
  for (const x of xs) {
    x.start(t);
    x.stop(end);
  }
  return end;
}

// ── 팀파니 ──
export function timp(E, out, t, m, dur, v, o = {}) {
  const ctx = E.ctx, f = mtof(m), peak = v * (o.g ?? 0.5);
  let end = t;
  for (const [r, a, d] of [[1, 1, 0.55], [1.5, 0.45, 0.32], [1.98, 0.25, 0.22], [2.44, 0.12, 0.15]]) {
    const x = ctx.createOscillator(), g = gainN(ctx);
    x.type = "sine";
    glide(x, f * r * 1.025, f * r, t, 0.12);
    const e = envPerc(g.gain, t, 0.002, peak * a, d);
    x.connect(g);
    g.connect(out);
    x.start(t);
    x.stop(e);
    end = Math.max(end, e);
  }
  const n = E.noiseSrc(t, t + 0.2), lp = filt(ctx, "lowpass", 500, 0.7), ng = gainN(ctx);
  envPerc(ng.gain, t, 0.001, peak * 0.5, 0.035, 0.18);
  n.connect(lp);
  lp.connect(ng);
  ng.connect(out);
  return end;
}

// ── 타악기 ──
function noiseHit(E, out, t, v, type, f, q, a, dec, len) {
  const ctx = E.ctx, n = E.noiseSrc(t, t + len), b = filt(ctx, type, f, q), g = gainN(ctx);
  envPerc(g.gain, t, a, v, dec, len);
  n.connect(b);
  b.connect(g);
  g.connect(out);
  return b;
}
function toneHit(E, out, t, v, f0, f1, ft, dec, type = "sine") {
  const ctx = E.ctx, x = ctx.createOscillator(), g = gainN(ctx);
  x.type = type;
  x.frequency.setValueAtTime(f0, t);
  x.frequency.exponentialRampToValueAtTime(f1, t + ft);
  const e = envPerc(g.gain, t, 0.002, v, dec);
  x.connect(g);
  g.connect(out);
  x.start(t);
  x.stop(e);
}
export const DR = {
  kick(E, out, t, v) {
    toneHit(E, out, t, v * 0.75, 150, 48, 0.08, 0.1);
    noiseHit(E, out, t, v * 0.2, "highpass", 2800, 0.7, 0.0005, 0.005, 0.03);
  },
  snare(E, out, t, v) {
    noiseHit(E, out, t, v * 0.42, "highpass", 1300, 0.7, 0.001, 0.055, 0.32);
    noiseHit(E, out, t, v * 0.16, "bandpass", 5200, 1.2, 0.001, 0.03, 0.15);
    toneHit(E, out, t, v * 0.38, 190, 150, 0.06, 0.04, "triangle");
  },
  hat(E, out, t, v) {
    const b = noiseHit(E, out, t, v * 0.2, "highpass", 7200, 0.8, 0.0005, 0.012, 0.07);
    b.Q.value = 0.9;
  },
  ohat(E, out, t, v) {
    noiseHit(E, out, t, v * 0.16, "highpass", 6800, 0.8, 0.001, 0.09, 0.45);
  },
  shaker(E, out, t, v) {
    noiseHit(E, out, t, v * 0.15, "bandpass", 6200, 1.3, 0.012, 0.025, 0.12);
  },
  tom(E, out, t, v, f = 140) {
    toneHit(E, out, t, v * 0.6, f * 1.5, f, 0.2, 0.13);
    noiseHit(E, out, t, v * 0.15, "lowpass", 1400, 0.7, 0.001, 0.02, 0.1);
  },
  taiko(E, out, t, v) {
    toneHit(E, out, t, v * 0.9, 92, 54, 0.35, 0.21);
    toneHit(E, out, t, v * 0.2, 180, 110, 0.15, 0.09, "triangle");
    noiseHit(E, out, t, v * 0.32, "lowpass", 900, 0.8, 0.001, 0.03, 0.15);
  },
  timp(E, out, t, v, m = 40) {
    timp(E, out, t, m, 1, v * 0.8);
  },
  rim(E, out, t, v) {
    toneHit(E, out, t, v * 0.14, 1700, 1650, 0.02, 0.012);
    noiseHit(E, out, t, v * 0.16, "bandpass", 2600, 3, 0.0005, 0.01, 0.05);
  },
  clap(E, out, t, v) {
    for (let i = 0; i < 3; i++) noiseHit(E, out, t + i * 0.011, v * 0.22, "bandpass", 1250, 1.1, 0.0005, 0.006, 0.03);
    noiseHit(E, out, t + 0.03, v * 0.2, "bandpass", 1150, 0.9, 0.001, 0.06, 0.3);
  },
  crash(E, out, t, v) {
    noiseHit(E, out, t, v * 0.2, "highpass", 4300, 0.6, 0.001, 0.55, 2.6);
    noiseHit(E, out, t, v * 0.1, "bandpass", 8800, 0.7, 0.001, 0.35, 1.8);
  },
  // 거꾸로 감은 심벌: tEnd에 가장 커지고 뚝 끊긴다 (다음 구간을 끌어당김)
  rev(E, out, tEnd, len, v) {
    const ctx = E.ctx, t0 = tEnd - len, n = E.noiseSrc(t0, tEnd + 0.05), b = filt(ctx, "highpass", 3200, 0.6), g = gainN(ctx);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v * 0.2, tEnd);
    g.gain.setTargetAtTime(0, tEnd, 0.008);
    n.connect(b);
    b.connect(g);
    g.connect(out);
  },
  dum(E, out, t, v) {
    toneHit(E, out, t, v * 0.7, 120, 82, 0.15, 0.12);
    noiseHit(E, out, t, v * 0.14, "lowpass", 500, 0.7, 0.001, 0.02, 0.1);
  },
  tek(E, out, t, v) {
    noiseHit(E, out, t, v * 0.32, "bandpass", 3600, 2.4, 0.0005, 0.016, 0.09);
    toneHit(E, out, t, v * 0.1, 950, 900, 0.02, 0.012);
  },
  riq(E, out, t, v) {
    noiseHit(E, out, t, v * 0.12, "highpass", 6500, 0.7, 0.002, 0.04, 0.2);
    for (const f of [5200, 6900, 8150]) toneHit(E, out, t + E.rnd() * 0.006, v * 0.025, f, f * 1.01, 0.05, 0.05);
  },
  anvil(E, out, t, v) {
    for (const [r, a, d] of [[1, 0.3, 0.5], [2.76, 0.2, 0.35], [5.4, 0.12, 0.2], [8.93, 0.06, 0.12]]) toneHit(E, out, t, v * a, 523 * r, 523 * r, 0.1, d);
    noiseHit(E, out, t, v * 0.2, "highpass", 3000, 0.7, 0.0005, 0.006, 0.04);
  },
  clink(E, out, t, v) {
    for (const [r, a, d] of [[1, 0.12, 0.12], [2.7, 0.07, 0.07]]) toneHit(E, out, t, v * a, 2200 * r, 2200 * r, 0.1, d);
  },
};
