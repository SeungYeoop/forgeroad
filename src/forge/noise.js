// 시드 고정 잡음 (지형 생성용). 같은 시드 → 항상 같은 값.
// 브라우저마다 결과가 달라지지 않도록 sin·cos·pow·exp 같은 근사 함수는 쓰지 않는다 (사칙연산·floor·sqrt만).

export const hash2 = (a, b) => {
  let x = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
};
export const strHash = (s) => {
  let h = 2166136261 >>> 0;
  for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995) >>> 0;
  return (h ^ (h >>> 15)) >>> 0;
};
// 작은 난수 생성기 (mulberry32)
export function rng(seed) {
  let s = seed >>> 0 || 0x9e3779b9;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.range = (a, b) => a + (b - a) * next();
  next.int = (a, b) => a + Math.floor(next() * (b - a + 1));
  next.pick = (arr) => arr[Math.floor(next() * arr.length)];
  next.chance = (p) => next() < p;
  return next;
}

const F2 = 0.5 * (Math.sqrt(3) - 1), G2 = (3 - Math.sqrt(3)) / 6;
// 12방향 기울기 (2D에선 앞 두 성분만 쓴다 — 길이가 고르게 섞인다)
const GX = new Float64Array([1, -1, 1, -1, 1, -1, 1, -1, 0, 0, 0, 0, 0.7071, -0.7071, 0.7071, -0.7071]);
const GY = new Float64Array([1, 1, -1, -1, 0, 0, 0, 0, 1, -1, 1, -1, 0.7071, 0.7071, -0.7071, -0.7071]);

// 시드 하나로 만든 잡음 묶음: n2(x,y) 심플렉스, n1(x) 1차원 기울기 잡음. 둘 다 대략 [-1, 1]
export function makeNoise(seed) {
  const R = rng(seed);
  const perm = new Uint8Array(512), pg = new Uint8Array(512);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(R() * (i + 1));
    const t = p[i];
    p[i] = p[j];
    p[j] = t;
  }
  for (let i = 0; i < 512; i++) ((perm[i] = p[i & 255]), (pg[i] = perm[i] & 15));
  const g1 = new Float64Array(256);
  for (let i = 0; i < 256; i++) g1[i] = R() * 2 - 1;

  function n2(xin, yin) {
    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s), j = Math.floor(yin + s);
    const t = (i + j) * G2;
    const x0 = xin - (i - t), y0 = yin - (j - t);
    const i1 = x0 > y0 ? 1 : 0, j1 = 1 - i1;
    const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
    const ii = i & 255, jj = j & 255;
    let n = 0;
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 > 0) {
      const g = pg[ii + perm[jj]];
      t0 *= t0;
      n += t0 * t0 * (GX[g] * x0 + GY[g] * y0);
    }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 > 0) {
      const g = pg[ii + i1 + perm[jj + j1]];
      t1 *= t1;
      n += t1 * t1 * (GX[g] * x1 + GY[g] * y1);
    }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 > 0) {
      const g = pg[ii + 1 + perm[jj + 1]];
      t2 *= t2;
      n += t2 * t2 * (GX[g] * x2 + GY[g] * y2);
    }
    return 70 * n;
  }
  function n1(x) {
    const i = Math.floor(x), f = x - i;
    const a = g1[i & 255] * f, b = g1[(i + 1) & 255] * (f - 1);
    const u = f * f * f * (f * (f * 6 - 15) + 10);
    return 2 * (a + (b - a) * u);
  }
  // 여러 겹 (fBm). 진폭 합으로 나눠 [-1, 1] 근처에 둔다
  function fbm2(x, y, oct = 4, lac = 2, gain = 0.5) {
    let a = 1, f = 1, s = 0, n = 0;
    for (let o = 0; o < oct; o++) {
      s += a * n2(x * f + o * 17.31, y * f - o * 9.17);
      n += a;
      a *= gain;
      f *= lac;
    }
    return s / n;
  }
  function fbm1(x, oct = 4, lac = 2, gain = 0.5) {
    let a = 1, f = 1, s = 0, n = 0;
    for (let o = 0; o < oct; o++) {
      s += a * n1(x * f + o * 31.7);
      n += a;
      a *= gain;
      f *= lac;
    }
    return s / n;
  }
  // 능선 잡음: 봉우리가 뾰족하다 (0 … 1)
  function ridge1(x, oct = 3) {
    let a = 1, f = 1, s = 0, n = 0, w = 1;
    for (let o = 0; o < oct; o++) {
      let v = 1 - Math.abs(n1(x * f + o * 13.1));
      v *= v * w;
      w = Math.min(1, v * 1.6);
      s += a * v;
      n += a;
      a *= 0.5;
      f *= 2.1;
    }
    return s / n;
  }
  return { n2, n1, fbm2, fbm1, ridge1 };
}

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
export const sstep = (a, b, x) => smooth((x - a) / (b - a));
