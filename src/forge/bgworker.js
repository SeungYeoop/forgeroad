// 지역 배경을 별도 스레드에서 그린다 (그리는 동안 게임이 멈추지 않도록)
import { paintLayer3d, paintSky3d } from "./bgnew.js";

const rgba = (c, a) => ((a & 255) << 24) | ((c & 255) << 16) | (((c >> 8) & 255) << 8) | ((c >> 16) & 255);
// 엔진 픽셀 버퍼(ht)와 같은 방식으로 섞어 칠하는 가짜 버퍼
function fake(w, h) {
  const buf = new Uint32Array(w * h);
  return {
    w, h, buf,
    px(x, y, c, a = 255) {
      x = Math.round(x), y = Math.round(y);
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      const i = y * w + x;
      if (a >= 255) return void (buf[i] = rgba(c, 255) >>> 0);
      const o0 = buf[i], oa = (o0 >>> 24) & 255;
      if (oa === 0) return void (buf[i] = rgba(c, a) >>> 0);
      const t = a / 255;
      const r = Math.round((o0 & 255) * (1 - t) + ((c >> 16) & 255) * t), g = Math.round(((o0 >> 8) & 255) * (1 - t) + ((c >> 8) & 255) * t), b = Math.round(((o0 >> 16) & 255) * (1 - t) + (c & 255) * t);
      buf[i] = (((Math.min(255, oa + a) & 255) << 24) | (b << 16) | (g << 8) | r) >>> 0;
    },
  };
}
function rng(seed) {
  let s = seed >>> 0 || 1;
  const next = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return { next, int: (a, b) => a + Math.floor(next() * (b - a + 1)), range: (a, b) => a + next() * (b - a), chance: (p) => next() < p };
}
self.onmessage = (ev) => {
  const { key, kind, layer, pal, id, w, h, seed } = ev.data;
  const T = fake(w, h);
  try {
    if (kind === "sky") paintSky3d(T, pal, w, h);
    else paintLayer3d(T, layer, pal, rng(seed), id);
  } catch (e) {
    self.postMessage({ key, error: String(e) });
    return;
  }
  self.postMessage({ key, w, h, buf: T.buf }, [T.buf.buffer]);
};
