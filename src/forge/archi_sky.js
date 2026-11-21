// 하늘 구역 공용 도구 (지역 설계 코드가 지도 전체를 짓는 하늘 구역: 그린스텝 · 스톤브리지 …)
//   자연 섬 몸통(nat) · 방 · 층 사이 통로 · 아래 섬까지 늘어뜨리기 · 출렁다리 · 섬 윤곽 안 뒷벽 채우기
// ── 모양 도구 (선 하나 = 점 목록) ──
export const PL = (pts) => (x) => {
  if (x <= pts[0][0]) return pts[0][1];
  for (let k = 0; k + 1 < pts.length; k++) {
    const [xa, ya] = pts[k], [xb, yb] = pts[k + 1];
    if (x <= xb) return ya + ((yb - ya) * (x - xa)) / Math.max(1e-9, xb - xa);
  }
  return pts[pts.length - 1][1];
};
// 울퉁불퉁 (사암 벼랑 결)
export const jag = (f, a, s) => (x) => f(x) + (Math.sin(x * 0.37 + s) * 0.5 + Math.sin(x * 0.11 + s * 1.7) * 0.8 + Math.sin(x * 0.83 + s * 3.1) * 0.3) * a;
// 2D 값 잡음 (0~1)
export const H2 = (i, j, s) => {
  let h = (i * 374761393 + j * 668265263 + s * 1274126177) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
export const vn = (x, y, s) => {
  const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = H2(i, j, s), b = H2(i + 1, j, s), c = H2(i, j + 1, s), d = H2(i + 1, j + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};
export const fbm = (x, y, s) => vn(x, y, s) * 0.55 + vn(x * 2.1 + 3.3, y * 2.1, s + 7) * 0.3 + vn(x * 4.4, y * 4.4 + 1.7, s + 13) * 0.15;
// 떠 있는 섬 몸통 (자연 바위): 윗면 top(x) ~ 밑면 bot(x)를 뼈대로
//   윗면: 완만히 구르고 양 끝 어깨가 둥글게 떨어진다 · 밑면·옆: 2D로 비틀고 깎아 처마·혹·패인 곳 · 밑으로 늘어진 바위 손가락
//   o.flat: 윗면을 그대로 (섬 길·출구) · o.roll 윗면 굴곡 · o.warp 비틀기 · o.rough 깎기 · o.fingers 손가락 수 · o.sh 어깨 폭
export function nat(K, x0, x1, top, bot, o = {}) {
  const s = o.seed ?? (x0 * 13 + x1 * 7) % 997, W = x1 - x0;
  const roll = o.flat ? 0 : o.roll ?? 1.6, warp = o.warp ?? Math.min(7, 2 + W / 40), rough = o.rough ?? 2.2, sh = o.flat ? o.sh ?? 0 : o.sh ?? Math.min(14, 4 + W / 16);
  const cl = (x) => Math.max(x0, Math.min(x1 - 1, x));
  let yMax = 0;
  for (let x = x0 - 8; x < x1 + 8; x++) {
    const d = Math.min(x - x0, x1 - 1 - x);
    let T = top(cl(x)) + (fbm(x / 26, 0.5, s) - 0.5) * 2 * roll;
    if (d < sh) T += ((sh - d) / Math.max(1, sh)) ** 2 * sh * 0.8;
    const t = Math.round(T);
    for (let y = t; y < t + 400; y++) {
      const wx = (fbm(x / 17, y / 17, s + 3) - 0.5) * 2 * warp, wy = (fbm(x / 17 + 9, y / 17, s + 5) - 0.5) * 1.2 * warp;
      const xw = x + wx * Math.min(1, (y - t) / 6);
      if (xw < x0 || xw >= x1) {
        if (y - t > 6) continue;
        break;
      }
      const B = bot(cl(Math.round(xw))) + wy + (fbm(x / 6, y / 6, s + 9) - 0.5) * 2 * rough;
      if (y >= B) break;
      K.set(x, y, 1), body(K, x, y), (yMax = Math.max(yMax, y));
    }
  }
  // 바위 손가락 (밑면에서 늘어진 뾰족 바위)
  const n = o.fingers ?? Math.max(1, Math.round(W / 34));
  for (let k = 0; k < n; k++) {
    const fx = Math.round(x0 + W * (0.15 + (0.7 * (k + 0.5)) / n) + (H2(k, 1, s) - 0.5) * W * 0.12);
    let y = Math.round(top(cl(fx)));
    while (y < K.NY - 2 && K.get(fx, y) === 1) y++;
    const L = Math.round(5 + H2(k, 2, s) * Math.min(22, W / 6)), w = 1.5 + H2(k, 3, s) * Math.min(4, W / 30);
    for (let j = -2; j < L && y + j < K.NY - 8; j++) {
      const hw = w * Math.pow(1 - Math.max(0, j) / L, 0.75), xc = fx + Math.sin(j * 0.33 + k) * 1.3;
      if (hw > 0.4) for (let xx = Math.round(xc - hw); xx < Math.round(xc + hw) + 1; xx++) K.set(xx, y + j, 1), body(K, xx, y + j);
    }
  }
}
// 둥근 속 빈 곳 (가장자리를 잡음으로 흔든다)
export function hollow(K, cx, cy, rx, ry, s, amt = 0.08) {
  for (let y = Math.floor(cy - ry * 1.2); y <= cy + ry * 1.2; y++)
    for (let x = Math.floor(cx - rx * 1.2); x <= cx + rx * 1.2; x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      dx * dx + dy * dy < (1 + (fbm(x / 9, y / 9, s) - 0.5) * 2 * amt) ** 2 && K.set(x, y, -1);
    }
}
// 방 (뒷벽 포함): [x0, x1) × [y0, y1), 바닥 = y1
export function room(K, x0, y0, x1, y1, m = "rock") {
  K.air(x0, y0, x1, y1);
  K.wall(x0, y0, x1, y1, m);
  // 바위 방은 위 모서리가 둥글다
  if (m === "rock" && y1 - y0 >= 9 && x1 - x0 >= 12) {
    const c = Math.min(4, Math.floor((y1 - y0) / 3));
    for (let k = 0; k < c; k++) K.rock(x0, y0 + k, x0 + c - k, y0 + k + 1), K.rock(x1 - c + k, y0 + k, x1, y0 + k + 1);
  }
  // 바위 방은 천장에 사암 덩이가 처진다 (높은 방만)
  if (m === "rock" && y1 - y0 >= 11)
    for (let x = x0 + 2; x < x1 - 2; x++) {
      const v = Math.round(Math.sin(x * 0.53 + y0) * 1.1 + Math.sin(x * 0.19 + x0) * 1.2 - 0.6);
      v > 0 && K.rock(x, y0, x + 1, y0 + v);
    }
}
// 윗면 찾기: 어림 줄 y 근처에서 그 세로줄의 바위 윗면
export function surf(K, x, y) {
  while (y < K.NY - 2 && K.get(x, y) !== 1) y++;
  while (y > 1 && K.get(x, y - 1) === 1) y--;
  return y;
}
// 층 사이 세로 통로 (가운데 x, 3칸 폭): 위 바닥 fu(윗면이면 어림)에 판자 뚜껑, 아래 바닥 fd까지
export function climb(K, x, fu, fd, k = "ladder", m = "rock") {
  fu = surf(K, x, fu);
  K.air(x - 1, fu, x + 2, fd);
  m && K.wall(x - 1, fu, x + 2, fd, m);
  K.plank(x - 1, x + 2, fu);
  hang(K, x, fu, fd, k);
}
export function hang(K, x, fu, fd, k) {
  k === "ladder" ? K.ladder(x, fu, fd) : k === "rope" ? K.rope(x, fu - 3, fd) : K.vine(x - 1, x + 2, fu - 3, fd);
}
// 섬 배를 뚫고 아래 섬 윗면까지 늘어뜨린다 (아래 섬이 먼저 지어져 있어야 한다)
export function dropTo(K, x, f, k = "rope") {
  let y = f;
  while (y < K.NY - 2 && K.get(x, y) === 1) y++;
  K.air(x - 1, f, x + 2, y);
  K.wall(x - 1, f, x + 2, y, "rock");
  K.plank(x - 1, x + 2, f);
  while (y < K.NY - 2 && K.get(x, y) !== 1) y++;
  hang(K, x, f, y, k);
  return y;
}
// 출렁다리: 판자를 4칸씩, 가운데가 sag만큼 처진다 (every번째마다 무너지는 판)
export function rope_bridge(K, xa, xb, f, sag, every = 0, off = 0) {
  for (let x = xa, i = 0; x < xb; x += 4, i++) {
    const t = (x + 2 - xa) / (xb - xa), y = f + Math.round(sag * Math.sin(Math.PI * t));
    every && (i + off) % every === every - 1 ? K.crumble(x, Math.min(xb, x + 4), y) : K.plank(x, Math.min(xb, x + 4), y);
  }
}
export const P_ = (K, x, f, k, o) => K.prop(x, surf(K, x, f), k, o);

// 섬 윤곽 기록 (몸통을 지을 때 바위가 된 칸): 다 지은 뒤 그 안 빈 곳에 뒷벽을 깐다
let BODY = null, MARK = false;
// 손으로 쌓은 바위(K.rock)도 섬 윤곽으로 기록할지
export const mark = (v) => (MARK = v);
const body = (K, x, y) => x >= 0 && y >= 0 && x < K.NX && y < K.NY && (BODY[y * K.NX + x] = 1);
// 일부러 뚫은 하늘 창 (아치 구멍): 뒷벽을 깔지 않는다
export function skyHole(K, cx, cy, rx, ry) {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++)
    for (let x = Math.floor(cx - rx); x <= cx + rx; x++) ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1 && x >= 0 && y >= 0 && x < K.NX && y < K.NY && (BODY[y * K.NX + x] = 0);
}
export function backfill(K, mat = "rock") {
  const { NX, NY } = K, cov = new Uint8Array(NX * NY);
  for (const w of K.P.walls) {
    const x0 = Math.max(0, Math.floor(w.x0 / 8)), x1 = Math.min(NX, Math.ceil(w.x1 / 8)), y0 = Math.max(0, Math.floor(w.y0 / 8)), y1 = Math.min(NY, Math.ceil(w.y1 / 8));
    for (let y = y0; y < y1; y++) cov.fill(1, y * NX + x0, y * NX + x1);
  }
  // 줄마다 빈 칸 구간 → 위 줄과 같은 구간이면 이어 붙인다 (뒷벽 사각형 수를 줄인다)
  let open = new Map();
  const flush = (keep) => {
    for (const [k, r] of open) if (!keep.has(k)) K.wall(r.a, r.y0, r.b, r.y1, mat);
  };
  for (let y = 1; y < NY - 1; y++) {
    const next = new Map();
    for (let x = 0; x < NX; ) {
      const i = y * NX + x;
      if (!BODY[i] || K.get(x, y) === 1 || cov[i]) { x++; continue; }
      const a = x;
      while (x < NX && BODY[y * NX + x] && K.get(x, y) !== 1 && !cov[y * NX + x]) x++;
      const k = a + ":" + x, r = open.get(k);
      next.set(k, r ? ((r.y1 = y + 1), r) : { a, b: x, y0: y, y1: y + 1 });
    }
    flush(next);
    open = next;
  }
  flush(new Map());
}

// 하늘 지도 짓기 시작·끝: 윤곽 기록을 켜고, 끝나면 윤곽 안 빈 곳에 뒷벽
let ROCK0 = null;
export function skyBegin(K) {
  BODY = new Uint8Array(K.NX * K.NY);
  MARK = false;
  ROCK0 = K.rock;
  K.rock = (x0, y0, x1, y1) => {
    ROCK0(x0, y0, x1, y1);
    if (MARK) for (let y = Math.max(0, y0 | 0); y < y1; y++) for (let x = Math.max(0, x0 | 0); x < x1; x++) body(K, x, y);
  };
}
export function skyEnd(K, mat) {
  backfill(K, mat);
  K.rock = ROCK0;
  MARK = false;
}

