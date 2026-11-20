// 소리 공용 도구: 난수, 음높이, 파형표, 잡음, 잔향(임펄스) 만들기, 엔벨로프
export const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

export function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const hashStr = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};
export class Rnd {
  constructor(seed) {
    this.r = mulberry(seed);
  }
  f() {
    return this.r();
  }
  range(a, b) {
    return a + (b - a) * this.r();
  }
  int(a, b) {
    return a + Math.floor(this.r() * (b - a + 1));
  }
  pick(arr) {
    return arr[Math.floor(this.r() * arr.length)];
  }
  chance(p) {
    return this.r() < p;
  }
  // 무게대로 고르기: [[값, 무게], ...]
  wpick(list) {
    let s = 0;
    for (const [, w] of list) s += w;
    let x = this.r() * s;
    for (const [v, w] of list) if ((x -= w) <= 0) return v;
    return list[list.length - 1][0];
  }
}

// 파형표 (부드러운 톱니, 하프 몸통, 플루트, 리드, 펄스 등)
export function makeWaves(ctx) {
  const mk = (n, fn, cos = false) => {
    const re = new Float32Array(n + 1), im = new Float32Array(n + 1);
    for (let k = 1; k <= n; k++) (cos ? re : im)[k] = fn(k);
    return ctx.createPeriodicWave(re, im);
  };
  return {
    warm: mk(32, (k) => 1 / Math.pow(k, 1.35)),
    soft: mk(16, (k) => 1 / (k * k)),
    flute: mk(7, (k) => [0, 1, 0.34, 0.14, 0.07, 0.035, 0.018, 0.008][k]),
    reed: mk(21, (k) => (k % 2 ? 1 / k : 0.05 / k)),
    pulse: mk(40, (k) => (2 / (k * Math.PI)) * Math.sin(k * Math.PI * 0.25), true),
    organ: mk(8, (k) => [0, 1, 0.55, 0.3, 0.22, 0, 0.12, 0, 0.08][k]),
    bright: mk(40, (k) => (1 / k) * (k <= 3 ? 1 : 0.9)),
    hollow: mk(15, (k) => (k % 2 ? 1 / Math.pow(k, 1.6) : 0)),
  };
}

// 잡음 버퍼: white / pink / brown
export function makeNoise(ctx, sec, ch = 1, kind = "white") {
  const n = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(ch, n, ctx.sampleRate);
  for (let c = 0; c < ch; c++) {
    const d = b.getChannelData(c), r = mulberry(77 + c * 1013 + kind.length * 7);
    if (kind === "pink") {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < n; i++) {
        const w = r() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856;
        b4 = 0.55 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.016898;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
        b6 = w * 0.115926;
      }
    } else if (kind === "brown") {
      let l = 0;
      for (let i = 0; i < n; i++) {
        l = (l + 0.02 * (r() * 2 - 1)) / 1.02;
        d[i] = l * 3.5;
      }
    } else for (let i = 0; i < n; i++) d[i] = r() * 2 - 1;
    // 이음매 없이 돌게: 끝 20ms를 처음과 섞는다
    const m = Math.floor(ctx.sampleRate * 0.02);
    for (let i = 0; i < m; i++) {
      const u = i / m;
      d[n - m + i] = d[n - m + i] * (1 - u) + d[i] * u;
    }
  }
  return b;
}

// 잔향 임펄스: 처음 반사 몇 개 + 시간이 갈수록 어두워지는 꼬리 (좌우가 달라 넓게 들린다)
export function makeIR(ctx, sec, o = {}) {
  const sr = ctx.sampleRate, n = Math.floor(sr * sec), nc = o.ch ?? 2, b = ctx.createBuffer(nc, n, sr);
  const pre = Math.floor(sr * (o.pre ?? 0.015)), t60 = o.t60 ?? sec * 0.8, a0 = o.bright ?? 0.2, a1 = o.dark ?? 0.86;
  for (let c = 0; c < nc; c++) {
    const d = b.getChannelData(c), r = mulberry(c ? 9917 : 3313);
    let lp = 0;
    for (let i = pre; i < n; i++) {
      const t = (i - pre) / sr, u = (i - pre) / (n - pre);
      const env = Math.exp((-6.9 * t) / t60) * Math.min(1, t / 0.006) * (u > 0.9 ? (1 - u) * 10 : 1);
      const a = a0 + (a1 - a0) * Math.min(1, u * 1.3);
      lp = lp * a + (r() * 2 - 1) * (1 - a);
      d[i] = (lp * env) / Math.sqrt((1 - a) / (1 + a));
    }
    const ers = o.er ?? 8;
    for (let k = 0; k < ers; k++) {
      const i = pre + Math.floor(sr * (0.004 + r() * 0.06));
      if (i < n) d[i] += (r() < 0.5 ? -1 : 1) * (0.9 - k * 0.08) * (0.5 + 0.5 * r());
    }
  }
  return b;
}

export function driveCurve(k = 2.5, n = 2048) {
  const c = new Float32Array(n), m = Math.tanh(k);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    c[i] = Math.tanh(k * x) / m;
  }
  return c;
}

// 엔벨로프: 짧게 치고 지수로 사라짐 (끝 시각 반환)
export function envPerc(p, t, a, peak, dec, len = dec * 5.5) {
  p.setValueAtTime(0, t);
  p.linearRampToValueAtTime(peak, t + a);
  p.setTargetAtTime(0, t + a, dec);
  return t + a + len;
}
// ADSR: 붙고(a) 줄고(d → s) 버티다 dur 끝에서 풀린다(r)
export function envADSR(p, t, dur, a, d, s, r, peak) {
  p.setValueAtTime(0, t);
  p.linearRampToValueAtTime(peak, t + a);
  if (d > 0 && s < 1) p.setTargetAtTime(peak * s, t + a, d / 3);
  const tr = t + Math.max(dur, a + 0.005);
  p.setTargetAtTime(0, tr, r / 5);
  return tr + r * 1.2;
}
export const gainN = (ctx, v = 0) => {
  const g = ctx.createGain();
  g.gain.value = v;
  return g;
};
export const filt = (ctx, type, f, q = 0.7) => {
  const b = ctx.createBiquadFilter();
  b.type = type;
  b.frequency.value = f;
  b.Q.value = q;
  return b;
};
export const panN = (ctx, p) => {
  if (ctx.createStereoPanner) {
    const n = ctx.createStereoPanner();
    n.pan.value = Math.max(-1, Math.min(1, p));
    return n;
  }
  return gainN(ctx, 1);
};
