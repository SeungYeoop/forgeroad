// 자연 지형 위 큰 장식(나무·폐허 기둥·버섯·선인장·수정): 픽셀 그림을 RGBA 버퍼로 그린다
// 키 하나 = 그림 하나:  nt:<종류>:<크기 0~2>:<변형>:<잎색>:<바위색>:<강조색>
// 게임(glue.js natDecorTex)과 확인 도구(natpaint)가 같은 그림을 쓴다

// 지역 → 쓸 종류 (가중치 반복)
export function decoKinds(reg) {
  const id = reg?.bgId ?? reg?.id ?? "";
  const th = reg?.theme ?? "plains";
  if (id === "mistwood") return ["willow", "willow", "oak", "pine"];
  if (id === "rotmarsh") return ["dead", "shroom", "shroom", "willow"];
  if (id === "crystalsanctum") return ["crystal", "crystal", "pale", "pillar"];
  if (id === "skyruins") return ["oak", "oak", "pillar", "arch", "pale"];
  if (th === "desert") return ["cactus", "cactus", "dead", "pillar"];
  if (th === "snow") return ["pine", "pine", "pine", "dead"];
  if (th === "fortress") return ["pillar", "dead", "arch", "dead"];
  if (th === "forest") return ["oak", "pine", "willow"];
  return ["oak", "oak", "dead", "pine", "pillar"];
}
export const decoKey = (kind, s, v, pal) => `nt:${kind}:${s}:${v}:${pal.top}:${pal.rock}:${pal.accent}`;
// 크기별 대략 높이 (자리 고를 때 위 공간 검사용)
export const decoHeight = (kind, s) => (kind === "arch" ? [70, 100, 130] : kind === "pillar" ? [60, 96, 140] : kind === "cactus" ? [50, 80, 110] : [96, 150, 220])[s];
export const decoWidth = (kind, s) => (kind === "arch" ? [90, 130, 170] : kind === "pillar" || kind === "cactus" ? [30, 40, 50] : kind === "pine" ? [56, 80, 110] : [80, 120, 170])[s];

function hash(a, b, c) {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const mix = (a, b, t) => {
  const r = ((a >> 16) & 255) + (((b >> 16) & 255) - ((a >> 16) & 255)) * t;
  const g = ((a >> 8) & 255) + (((b >> 8) & 255) - ((a >> 8) & 255)) * t;
  const bl = (a & 255) + ((b & 255) - (a & 255)) * t;
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(bl);
};
const sh = (c, k) => (k < 0 ? mix(c, 0, -k) : mix(c, 0xffffff, k));

// 그림 하나 그리기 → { w, h, data(RGBA) }. 밑동 가운데가 (w/2, h-1)
export function paintDeco(key) {
  const [, kind, sS, vS, topS, rockS, accS] = key.split(":");
  const s = +sS, v = +vS, top = +topS, rock = +rockS, acc = +accS;
  const W = decoWidth(kind, s) + 8, H = decoHeight(kind, s) + 8;
  const data = new Uint8ClampedArray(W * H * 4);
  const cell = new Int32Array(W * H).fill(-1);
  const put = (x, y, c) => {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    cell[y * W + x] = c;
  };
  const rect = (x0, y0, x1, y1, f) => {
    for (let y = Math.floor(y0); y < y1; y++) for (let x = Math.floor(x0); x < x1; x++) put(x, y, typeof f === "function" ? f(x, y) : f);
  };
  const R = (k) => hash(v * 31 + s, k, kind.length * 7);
  const cx = W / 2, by = H - 1;
  // 잎 덩어리: 4px 칸으로 끊은 울퉁불퉁한 덩이 (왼위 밝게, 오른아래 어둡게, 점무늬)
  const leafC = kind === "pale" ? mix(top, 0xffffff, 0.5) : kind === "willow" ? sh(top, -0.25) : top;
  const blob = (bx, bY, rx, ry, seed) => {
    for (let y = Math.floor(bY - ry - 4); y <= bY + ry + 4; y++)
      for (let x = Math.floor(bx - rx - 4); x <= bx + rx + 4; x++) {
        const qx = Math.floor(x / 4) * 4 + 2, qy = Math.floor(y / 4) * 4 + 2;
        const dx = (qx - bx) / rx, dy = (qy - bY) / ry;
        const d = dx * dx + dy * dy + (hash(qx >> 2, qy >> 2, seed) - 0.5) * 0.5;
        if (d > 1) continue;
        const lt = -dx * 0.5 - dy * 0.7;
        let c = lt > 0.35 ? sh(leafC, 0.22) : lt < -0.4 ? sh(leafC, -0.3) : leafC;
        if (hash(x, y, seed + 5) > 0.93) c = sh(c, 0.15);
        put(x, y, c);
      }
  };
  const bark = mix(0x5a3a22, rock, 0.25), barkD = sh(bark, -0.35), barkL = sh(bark, 0.18);
  const trunk = (x, y0, y1, w0, w1, c = bark) => {
    for (let y = Math.floor(y0); y <= y1; y++) {
      const t = (y - y0) / Math.max(1, y1 - y0), w = w0 + (w1 - w0) * t;
      for (let k = -w / 2; k < w / 2; k++) {
        const e = (k + w / 2) / w;
        put(x + k, y, e < 0.25 ? sh(c, 0.18) : e > 0.72 ? sh(c, -0.35) : hash(x + k, y >> 2, 3) > 0.85 ? sh(c, -0.15) : c);
      }
    }
  };
  const branch = (x0, y0, x1, y1, w, c = bark) => {
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, ww = w * (1 - t * 0.5);
      for (let k = -ww / 2; k < ww / 2; k++) put(x + k, y, k < 0 ? sh(c, 0.1) : sh(c, -0.2));
    }
  };
  const Hh = decoHeight(kind, s), Ww = decoWidth(kind, s);
  if (kind === "oak" || kind === "pale") {
    const tw = 6 + s * 4, th = Hh * 0.5;
    trunk(cx, by - th - 10, by, tw * 0.8, tw * 1.25);
    // 뿌리
    rect(cx - tw, by - 3, cx + tw, by + 1, (x) => (x < cx ? barkL : barkD));
    branch(cx, by - th * 0.75, cx - Ww * 0.25, by - th - 6, 4 + s);
    branch(cx, by - th * 0.85, cx + Ww * 0.22, by - th - 12, 4 + s);
    const cr = Ww * 0.42, cy = by - th - Hh * 0.22;
    blob(cx - cr * 0.45, cy + cr * 0.1, cr * 0.55, cr * 0.42, 11);
    blob(cx + cr * 0.48, cy + cr * 0.05, cr * 0.5, cr * 0.4, 12);
    blob(cx, cy - cr * 0.25, cr * 0.62, cr * 0.5, 13);
    R(1) > 0.4 && blob(cx + (R(2) - 0.5) * cr * 0.6, cy - cr * 0.55, cr * 0.38, cr * 0.3, 14);
    // 꽃·열매 점
    if (R(3) > 0.5) for (let k = 0; k < 6 + s * 4; k++) put(cx + (R(10 + k) - 0.5) * cr * 1.6, cy + (R(30 + k) - 0.6) * cr, acc);
  } else if (kind === "willow") {
    const tw = 6 + s * 3, th = Hh * 0.62;
    trunk(cx, by - th, by, tw * 0.7, tw * 1.3);
    const cr = Ww * 0.42, cy = by - th - 4;
    blob(cx, cy - cr * 0.15, cr, cr * 0.42, 21);
    // 늘어진 잎 줄기
    for (let x = cx - cr + 4; x < cx + cr - 4; x += 4) {
      const len = (0.4 + R(x) * 0.8) * th * 0.7 * (1 - Math.abs(x - cx) / cr * 0.5);
      for (let y = cy; y < cy + len; y++) {
        const c = y > cy + len - 4 ? sh(leafC, 0.15) : (x >> 2) % 2 ? leafC : sh(leafC, -0.2);
        put(x, y, c);
        put(x + 1, y, c);
      }
    }
  } else if (kind === "pine") {
    const tw = 4 + s * 2;
    trunk(cx, by - Hh * 0.3, by, tw, tw * 1.3);
    const tiers = 3 + s;
    const snow = mix(top, 0xffffff, 0.75);
    for (let k = 0; k < tiers; k++) {
      const yb = by - Hh * 0.18 - k * (Hh * 0.78) / tiers, ht = (Hh * 0.95) / tiers, hw = (Ww / 2) * (1 - k / (tiers + 0.6));
      for (let y = Math.floor(yb - ht); y <= yb; y++) {
        const t = (y - (yb - ht)) / ht, w = Math.floor((hw * t) / 4) * 4 + 4;
        for (let x = -w; x <= w; x++) {
          let c = x < -w * 0.3 ? sh(top, -0.05) : x > w * 0.4 ? sh(top, -0.35) : sh(top, -0.18);
          if (y >= yb - 1 && hash(x, k, 9) > 0.3) c = sh(c, -0.25);
          put(cx + x, y, c);
        }
        // 눈 덮인 윗면 (흰 잎색 지역)
        if (((top >> 16) & 255) > 200 && t < 0.3) for (let x = -w; x <= w; x++) put(cx + x, y, snow);
      }
    }
  } else if (kind === "dead") {
    const tw = 5 + s * 3, th = Hh * 0.95;
    const c = mix(0x4a3a30, rock, 0.35);
    trunk(cx, by - th * 0.7, by, tw * 0.6, tw * 1.3, c);
    const arms = 3 + s * 2;
    for (let k = 0; k < arms; k++) {
      const y0 = by - th * (0.35 + 0.35 * (k / arms)), d = k % 2 ? 1 : -1, len = Ww * (0.25 + R(k) * 0.25);
      const x1 = cx + d * len, y1 = y0 - len * (0.5 + R(k + 9) * 0.6);
      branch(cx, y0, x1, y1, 3 + s, c);
      branch(x1, y1, x1 + d * len * 0.3, y1 - len * 0.35, 2, c);
    }
    branch(cx, by - th * 0.7, cx + (R(5) - 0.5) * 20, by - th, 3 + s, c);
  } else if (kind === "shroom") {
    const sw = 8 + s * 5, th = Hh * 0.62;
    trunk(cx, by - th, by, sw, sw * 1.4, 0xd8ccb0);
    const cr = Ww * 0.46, cc = R(1) > 0.5 ? acc : mix(top, 0x8040a0, 0.5);
    for (let y = Math.floor(by - th - cr * 0.6); y <= by - th + 6; y++) {
      const t = (y - (by - th - cr * 0.6)) / (cr * 0.6 + 6), w = Math.floor((cr * Math.sqrt(Math.min(1, t * 1.4))) / 4) * 4 + 4;
      for (let x = -w; x <= w; x++) put(cx + x, y, y > by - th + 2 ? sh(cc, -0.4) : x < -w * 0.4 ? sh(cc, 0.15) : x > w * 0.5 ? sh(cc, -0.25) : cc);
    }
    for (let k = 0; k < 5 + s * 3; k++) {
      const x = cx + (R(20 + k) - 0.5) * cr * 1.4, y = by - th - R(40 + k) * cr * 0.45;
      rect(x, y, x + 3, y + 3, 0xfff4dc);
    }
  } else if (kind === "cactus") {
    const g = mix(0x4a8a3a, top, 0.3), cw = 10 + s * 4;
    const col = (x0, y0, x1, y1) => rect(x0, y0, x1, y1, (x) => ((x - x0) / (x1 - x0) < 0.3 ? sh(g, 0.18) : (x - x0) / (x1 - x0) > 0.7 ? sh(g, -0.3) : (x - x0) % 4 === 1 ? sh(g, -0.12) : g));
    col(cx - cw / 2, by - Hh, cx + cw / 2, by + 1);
    const a1 = by - Hh * (0.4 + R(1) * 0.2), a2 = by - Hh * (0.55 + R(2) * 0.2);
    col(cx - cw * 1.6, a1, cx - cw / 2, a1 + 8);
    col(cx - cw * 1.6, a1 - Hh * 0.3, cx - cw * 1.6 + cw * 0.8, a1 + 8);
    R(3) > 0.3 && (col(cx + cw / 2, a2, cx + cw * 1.5, a2 + 8), col(cx + cw * 1.5 - cw * 0.8, a2 - Hh * 0.25, cx + cw * 1.5, a2 + 8));
    R(4) > 0.5 && rect(cx - 3, by - Hh - 4, cx + 3, by - Hh, acc);
  } else if (kind === "pillar" || kind === "arch") {
    const st = mix(rock, 0xd8d0c0, 0.35), stD = sh(st, -0.3), stL = sh(st, 0.2);
    const brick = (x0, y0, x1, y1) =>
      rect(x0, y0, x1, y1, (x, y) => {
        const row = Math.floor((y - y0) / 8), off = row % 2 ? 6 : 0;
        if ((y - y0) % 8 === 7 || (x - x0 + off) % 12 === 11) return stD;
        if (x - x0 < 2) return stL;
        if (x1 - x < 3) return sh(st, -0.18);
        return hash(x >> 1, y >> 1, 77) > 0.94 ? sh(st, -0.12) : st;
      });
    if (kind === "pillar") {
      const pw = 14 + s * 6, ph = Hh * (0.6 + R(1) * 0.4);
      brick(cx - pw / 2 - 4, by - 8, cx + pw / 2 + 4, by + 1);
      brick(cx - pw / 2, by - ph, cx + pw / 2, by - 8);
      // 부서진 윗면
      for (let x = Math.floor(cx - pw / 2); x < cx + pw / 2; x += 4) {
        const d = Math.floor(R(x) * 3) * 4;
        rect(x, by - ph, x + 4, by - ph + d, -1);
      }
      ph > Hh * 0.85 && brick(cx - pw / 2 - 4, by - ph - 6, cx + pw / 2 + 4, by - ph);
      // 덩굴
      for (let y = by - ph + 6; y < by - 10; y++) hash(3, y >> 2, v) > 0.45 && put(cx - pw / 2 + 2 + Math.floor(hash(y, 1, v) * 3), y, sh(top, -0.1));
    } else {
      const pw = 14 + s * 4, aw = Ww - 8, ah = Hh;
      brick(cx - aw / 2, by - ah, cx - aw / 2 + pw, by + 1);
      const broken = R(1) > 0.5;
      brick(cx + aw / 2 - pw, by - (broken ? ah * 0.55 : ah), cx + aw / 2, by + 1);
      // 아치 윗부분 (계단식 블록)
      const span = aw - pw * 2, steps = 4;
      for (let k = 0; k < steps; k++) {
        const x0 = cx - aw / 2 + pw + (k * span) / (2 * steps), x1 = cx + aw / 2 - pw - (k * span) / (2 * steps);
        if (broken) brick(x0, by - ah, Math.min(x1, cx - span * 0.05), by - ah + 10 + (steps - k) * 6);
        else brick(x0, by - ah, x1, by - ah + 10 + (steps - k) * 6);
      }
      brick(cx - aw / 2 - 4, by - ah - 8, broken ? cx : cx + aw / 2 + 4, by - ah);
    }
  } else if (kind === "crystal") {
    const n = 3 + s * 2;
    for (let k = 0; k < n; k++) {
      const x0 = cx + (k - (n - 1) / 2) * (Ww / (n + 1)) + (R(k) - 0.5) * 8;
      const hh = Hh * (0.35 + R(k + 5) * 0.6) * (1 - Math.abs(k - (n - 1) / 2) / n), w = 8 + s * 3 + R(k + 2) * 6;
      const c = k % 2 ? acc : mix(acc, 0xffffff, 0.35);
      for (let y = Math.floor(by - hh); y <= by; y++) {
        const t = (y - (by - hh)) / hh, ww = Math.max(2, Math.floor((w * Math.min(1, t * 2.2)) / 2) * 2);
        for (let x = -ww / 2; x < ww / 2; x++) put(x0 + x, y, x < -ww * 0.15 ? sh(c, 0.35) : x > ww * 0.2 ? sh(c, -0.3) : c);
      }
    }
  }
  // 바깥 테두리 (어두운 선)
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const c = cell[y * W + x], k = (y * W + x) * 4;
      if (c >= 0) {
        data[k] = c >> 16;
        data[k + 1] = (c >> 8) & 255;
        data[k + 2] = c & 255;
        data[k + 3] = 255;
      } else {
        const n = (x > 0 && cell[y * W + x - 1] >= 0) || (x < W - 1 && cell[y * W + x + 1] >= 0) || (y > 0 && cell[(y - 1) * W + x] >= 0) || (y < H - 1 && cell[(y + 1) * W + x] >= 0);
        if (n) {
          const o = mix(rock, 0x10100c, 0.8);
          data[k] = o >> 16;
          data[k + 1] = (o >> 8) & 255;
          data[k + 2] = o & 255;
          data[k + 3] = 255;
        }
      }
    }
  return { w: W, h: H, data };
}
