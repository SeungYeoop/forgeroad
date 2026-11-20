// 2D 픽셀 그림판: 몬스터를 픽셀 화면에 직접 그린다 (3D 도형을 굽지 않는다)
//   덩어리(타원·다각형·선)를 정한 색으로 찍고, 명암은 4단계 색 묶음(램프)으로 손수 나누고, 외곽선은 마지막에 한 줄
//   색: 0xRRGGBB 숫자. 0은 빈칸.
export function canvas(W, H) {
  const d = new Int32Array(W * H).fill(-1);
  const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const C = {
    W, H, d,
    px(x, y, c) {
      x = Math.round(x), y = Math.round(y);
      inb(x, y) && (d[y * W + x] = c);
      return C;
    },
    get(x, y) {
      return inb(x, y) ? d[y * W + x] : -1;
    },
    // 이미 칠한 칸에만 (명암·무늬를 덩어리 안에만 얹을 때)
    over(x, y, c) {
      x = Math.round(x), y = Math.round(y);
      inb(x, y) && d[y * W + x] >= 0 && (d[y * W + x] = c);
      return C;
    },
    rect(x, y, w, h, c) {
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) C.px(x + i, y + j, c);
      return C;
    },
    // 채운 타원 (중심·반지름, 픽셀 격자에 맞춰)
    ell(cx, cy, rx, ry, c, onlyOver = false) {
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
        for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
          const u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry;
          u * u + v * v <= 1 && (onlyOver ? C.over(x, y, c) : C.px(x, y, c));
        }
      return C;
    },
    // 타원에 4단계 명암 (빛: 왼쪽 위). ramp = [가장 어두움, 어두움, 기본, 밝음]
    shade(cx, cy, rx, ry, ramp, o = {}) {
      const lx = o.lx ?? -0.62, ly = o.ly ?? -0.78, t = o.t ?? [0.45, -0.05, -0.55];
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
        for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
          const u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry, r2 = u * u + v * v;
          if (r2 > 1) continue;
          const nz = Math.sqrt(1 - r2), dl = u * lx + v * ly + nz * 0.35;
          const k = dl > t[0] ? 3 : dl > t[1] ? 2 : dl > t[2] ? 1 : 0;
          o.over ? C.over(x, y, ramp[k]) : C.px(x, y, ramp[k]);
        }
      return C;
    },
    // 채운 다각형 [[x,y],...]
    poly(pts, c, onlyOver = false) {
      const ys = pts.map((p) => p[1]), y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
      for (let y = y0; y <= y1; y++) {
        const yc = y + 0.5, xs = [];
        for (let i = 0; i < pts.length; i++) {
          const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
          if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) xs.push(ax + ((yc - ay) / (by - ay)) * (bx - ax));
        }
        xs.sort((a, b) => a - b);
        for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.round(xs[i]); x < Math.round(xs[i + 1]); x++) onlyOver ? C.over(x, y, c) : C.px(x, y, c);
      }
      return C;
    },
    // 선 (두께 w)
    line(x0, y0, x1, y1, c, w = 1) {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
      for (let k = 0; k <= n; k++) {
        const x = x0 + ((x1 - x0) * k) / n, y = y0 + ((y1 - y0) * k) / n;
        if (w <= 1) C.px(x, y, c);
        else C.ell(x, y, w / 2, w / 2, c);
      }
      return C;
    },
    // 끝이 가늘어지는 뿔·귀·꼬리: a(굵기 wa) → b(굵기 wb)
    taper(ax, ay, bx, by, wa, wb, c) {
      const n = Math.ceil(Math.hypot(bx - ax, by - ay) * 2);
      for (let k = 0; k <= n; k++) {
        const t = k / n, r = (wa + (wb - wa) * t) / 2;
        C.ell(ax + (bx - ax) * t, ay + (by - ay) * t, Math.max(0.5, r), Math.max(0.5, r), c);
      }
      return C;
    },
    // 바깥 외곽선 한 줄 (4방향)
    outline(c) {
      const add = [];
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          if (d[y * W + x] >= 0) continue;
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (C.get(x + dx, y + dy) >= 0 && C.get(x + dx, y + dy) !== c) { add.push(y * W + x); break; }
        }
      for (const i of add) d[i] = c;
      return C;
    },
    // 다른 캔버스를 위에 덮기 (빈칸은 건너뜀), 좌우 뒤집기 가능
    blit(src, ox, oy, flip = false) {
      for (let y = 0; y < src.H; y++)
        for (let x = 0; x < src.W; x++) {
          const c = src.d[y * src.W + (flip ? src.W - 1 - x : x)];
          c >= 0 && C.px(ox + x, oy + y, c);
        }
      return C;
    },
    // RGBA 버퍼 (r3d 시트와 같은 방식: 바이트 순서 R,G,B,A)
    rgba() {
      const out = new Uint32Array(W * H);
      for (let i = 0; i < W * H; i++) {
        const c = d[i];
        if (c < 0) continue;
        out[i] = (0xff000000 | ((c & 255) << 16) | (c & 0xff00) | ((c >> 16) & 255)) >>> 0;
      }
      return out;
    },
  };
  return C;
}
