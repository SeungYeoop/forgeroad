// 3D → 픽셀 렌더러
// 몬스터를 3D 도형(구·타원체·원뿔원기둥·상자)으로 만들고, 정사영으로 픽셀마다 가장 가까운 면을 찾아
// 빛(왼쪽 위 앞)·감싸는 빛·테두리 역광·반사광·주변광 차폐·외곽선으로 칠한다. 재질마다 색 단계(톤)와 표면 결.
// 좌표: x 오른쪽, y 아래, z 보는 사람 쪽. 단위 = 픽셀.

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const mix = (a, b, t) => {
  t = clamp(t, 0, 1);
  const g = (s) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return (g(16) << 16) | (g(8) << 8) | g(0);
};
const lum = (c) => (((c >> 16) & 255) * 0.3 + ((c >> 8) & 255) * 0.59 + (c & 255) * 0.11) / 255;
export const hash = (a, b, c = 0) => {
  let x = (a * 374761393 + b * 668265263 + c * 1274126177) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
};
// 3차원 값 잡음 (표면 결)
export function noise3(x, y, z, s = 1) {
  x *= s, y *= s, z *= s;
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z), fx = x - ix, fy = y - iy, fz = z - iz;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
  const h = (a, b, c) => hash(ix + a, iy + b, iz + c);
  const l = (a, b, t) => a + (b - a) * t;
  return l(l(l(h(0, 0, 0), h(1, 0, 0), u), l(h(0, 1, 0), h(1, 1, 0), u), v), l(l(h(0, 0, 1), h(1, 0, 1), u), l(h(0, 1, 1), h(1, 1, 1), u), v), w);
}

// ── 재질 ──
// base: 기본색, hi: 빛 쪽으로 섞을 색, lo: 그늘 쪽 색(보라빛), tones: 단계 수, spec: 반사광, shin: 반사 날카로움,
// rim: 테두리 역광 세기, emit: 스스로 빛남, tex(u,v,w,seed,n) → 명암 보정(-1~1) 또는 {emit:색}
export function mat(base, o = {}) {
  return {
    base,
    hi: o.hi ?? mix(base, 0xfff4dc, 0.55),
    lo: o.lo ?? mix(mix(base, 0x000000, 0.62), 0x2a1840, 0.35),
    deep: o.deep ?? mix(mix(base, 0x000000, 0.82), 0x140a24, 0.45),
    tones: o.tones ?? 8,
    spec: o.spec ?? 0.15,
    shin: o.shin ?? 18,
    rim: o.rim ?? 0.45,
    rimCol: o.rimCol ?? 0xffe0c0,
    emit: o.emit ?? null,
    tex: o.tex ?? null,
    out: o.out ?? mix(mix(base, 0x000000, 0.8), 0x1a0a20, 0.5),
  };
}

// ── 모델 ──
export function model() {
  const P = [];
  let seed = 1;
  const M = {
    prims: P,
    sphere(c, r, m) {
      P.push({ t: 0, c, r, m, s: seed++ });
      return M;
    },
    // 타원체: rot = z축 회전(라디안), tilt = x축 기울기
    ell(c, rad, m, rot = 0, tilt = 0) {
      P.push({ t: 1, c, rad, m, rot, tilt, s: seed++ });
      return M;
    },
    // 원뿔원기둥 (끝이 둥근): a→b, 반지름 ra→rb
    cap(a, b, ra, rb, m) {
      const n = Math.max(2, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / Math.max(0.6, Math.min(ra, rb) * 0.5)));
      const s = seed++;
      for (let k = 0; k <= n; k++) {
        const t = k / n;
        P.push({ t: 0, c: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t], r: ra + (rb - ra) * t, m, s, cap: 1, ct: t, ax: [b[0] - a[0], b[1] - a[1], b[2] - a[2]] });
      }
      return M;
    },
    // 상자: half = [hx,hy,hz], rot = z축 회전, ry = y축 회전
    box(c, half, m, rot = 0, ry = 0) {
      P.push({ t: 2, c, half, m, rot, ry, s: seed++ });
      return M;
    },
  };
  return M;
}

// 회전 도우미
const rotZ = (x, y, a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];

// ── 렌더 ── W×H 버퍼에 그린다. 반환: Uint32 RGBA
export function render(M, W, H, o = {}) {
  const N = W * H;
  const Z = new Float32Array(N).fill(-1e9), NX = new Float32Array(N), NY = new Float32Array(N), NZ = new Float32Array(N);
  const U = new Float32Array(N), V = new Float32Array(N), Wl = new Float32Array(N);
  const MI = new Int16Array(N).fill(-1), SD = new Int32Array(N);
  const mats = [];
  const mid = (m) => {
    let i = mats.indexOf(m);
    return i < 0 ? (mats.push(m), mats.length - 1) : i;
  };
  const write = (i, z, nx, ny, nz, m, s, u, v, w) => {
    if (z <= Z[i]) return;
    Z[i] = z, NX[i] = nx, NY[i] = ny, NZ[i] = nz, MI[i] = m, SD[i] = s, U[i] = u, V[i] = v, Wl[i] = w;
  };
  for (const p of M.prims) {
    const m = mid(p.m);
    if (p.t === 0) {
      const [cx, cy, cz] = p.c, r = p.r;
      const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(W - 1, Math.ceil(cx + r)), y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(H - 1, Math.ceil(cy + r));
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++) {
          const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d2 = dx * dx + dy * dy;
          if (d2 > r * r) continue;
          const dz = Math.sqrt(r * r - d2);
          // 원기둥 조각이면 결 좌표를 축 방향으로
          if (p.cap) write(y * W + x, cz + dz, dx / r, dy / r, dz / r, m, p.s, p.ct * 10, Math.atan2(dy, dz) * 3, 0);
          else write(y * W + x, cz + dz, dx / r, dy / r, dz / r, m, p.s, dx, dy, dz);
        }
    } else if (p.t === 1) {
      const [cx, cy, cz] = p.c, [rx, ry, rz] = p.rad, R0 = Math.max(rx, ry, rz);
      const ca = Math.cos(p.rot), sa = Math.sin(p.rot), ct = Math.cos(p.tilt), st = Math.sin(p.tilt);
      const x0 = Math.max(0, Math.floor(cx - R0)), x1 = Math.min(W - 1, Math.ceil(cx + R0)), y0 = Math.max(0, Math.floor(cy - R0)), y1 = Math.min(H - 1, Math.ceil(cy + R0));
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++) {
          // 광선 (x, y, +∞) → (0,0,-1). 지역 좌표: z회전 역, x기울기 역
          let ox = x + 0.5 - cx, oy = y + 0.5 - cy, oz = 1000, dx = 0, dy = 0, dz = -1;
          [ox, oy] = [ox * ca + oy * sa, -ox * sa + oy * ca];
          [oy, oz] = [oy * ct + oz * st, -oy * st + oz * ct];
          [dy, dz] = [dy * ct + dz * st, -dy * st + dz * ct];
          const ax = ox / rx, ay = oy / ry, az = oz / rz, bx = dx / rx, by = dy / ry, bz = dz / rz;
          const A = bx * bx + by * by + bz * bz, B = 2 * (ax * bx + ay * by + az * bz), C = ax * ax + ay * ay + az * az - 1;
          const D = B * B - 4 * A * C;
          if (D < 0) continue;
          const t = (-B - Math.sqrt(D)) / (2 * A);
          const px = ox + dx * t, py = oy + dy * t, pz = oz + dz * t;
          let nx = px / (rx * rx), ny = py / (ry * ry), nz = pz / (rz * rz);
          // 지역 → 세계
          [ny, nz] = [ny * ct - nz * st, ny * st + nz * ct];
          [nx, ny] = [nx * ca - ny * sa, nx * sa + ny * ca];
          const l = Math.hypot(nx, ny, nz) || 1;
          let wy = py, wz = pz;
          [wy, wz] = [wy * ct - wz * st, wy * st + wz * ct];
          write(y * W + x, cz + wz, nx / l, ny / l, nz / l, p.pick ? mid(p.pick(px, py, pz)) : m, p.s, px, py, pz);
        }
    } else {
      const [cx, cy, cz] = p.c, [hx, hy, hz] = p.half, R0 = Math.hypot(hx, hy, hz);
      const ca = Math.cos(p.rot), sa = Math.sin(p.rot), cb = Math.cos(p.ry), sb = Math.sin(p.ry);
      const x0 = Math.max(0, Math.floor(cx - R0)), x1 = Math.min(W - 1, Math.ceil(cx + R0)), y0 = Math.max(0, Math.floor(cy - R0)), y1 = Math.min(H - 1, Math.ceil(cy + R0));
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++) {
          let ox = x + 0.5 - cx, oy = y + 0.5 - cy, oz = 1000, dx = 0, dy = 0, dz = -1;
          [ox, oy] = [ox * ca + oy * sa, -ox * sa + oy * ca];
          [ox, oz] = [ox * cb - oz * sb, ox * sb + oz * cb];
          [dx, dz] = [dx * cb - dz * sb, dx * sb + dz * cb];
          let tn = -1e9, tf = 1e9, ax = -1;
          const sl = (o_, d_, h_, k) => {
            if (Math.abs(d_) < 1e-6) return o_ >= -h_ && o_ <= h_;
            let t1 = (-h_ - o_) / d_, t2 = (h_ - o_) / d_;
            if (t1 > t2) [t1, t2] = [t2, t1];
            t1 > tn && ((tn = t1), (ax = k * (d_ > 0 ? -1 : 1)));
            tf = Math.min(tf, t2);
            return tn <= tf;
          };
          if (!sl(ox, dx, hx, 1) || !sl(oy, dy, hy, 2) || !sl(oz, dz, hz, 3) || tn > tf) continue;
          let nx = Math.abs(ax) === 1 ? Math.sign(ax) : 0, ny = Math.abs(ax) === 2 ? Math.sign(ax) : 0, nz = Math.abs(ax) === 3 ? Math.sign(ax) : 0;
          const px = ox + dx * tn, py = oy + dy * tn, pz = oz + dz * tn;
          // 모서리를 살짝 둥글게 (모서리 근처 법선 섞기)
          const ex = Math.abs(px) / hx, ey = Math.abs(py) / hy, ez = Math.abs(pz) / hz;
          const rb = p.round ?? 0.55, rk = 1.6 / (1 - rb);
          nx += ex > rb ? Math.sign(px) * (ex - rb) * rk : 0;
          ny += ey > rb ? Math.sign(py) * (ey - rb) * rk : 0;
          nz += ez > rb ? Math.sign(pz) * (ez - rb) * rk : 0;
          [nx, nz] = [nx * cb + nz * sb, -nx * sb + nz * cb];
          [nx, ny] = [nx * ca - ny * sa, nx * sa + ny * ca];
          const l = Math.hypot(nx, ny, nz) || 1;
          let wx = px, wz = pz;
          [wx, wz] = [wx * cb + wz * sb, -wx * sb + wz * cb];
          write(y * W + x, cz + wz, nx / l, ny / l, nz / l, m, p.s, px, py, pz);
        }
    }
  }
  // ── 칠하기 ──
  const out = new Uint32Array(N);
  const Lx = -0.52, Ly = -0.72, Lz = 0.46, Ll = Math.hypot(Lx, Ly, Lz);
  const lx = Lx / Ll, ly = Ly / Ll, lz = Lz / Ll;
  const hxv = lx, hyv = ly, hzv = lz + 1, hl = Math.hypot(hxv, hyv, hzv);
  const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const pack = (c) => (0xff000000 | ((c & 255) << 16) | (c & 0xff00) | ((c >> 16) & 255)) >>> 0;
  const cols = new Uint32Array(N);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (MI[i] < 0) continue;
      const m = mats[MI[i]];
      const nx = NX[i], ny = NY[i], nz = NZ[i];
      let tx = 0, emit = m.emit;
      if (m.tex) {
        const r = m.tex(U[i], V[i], Wl[i], SD[i], nx, ny, nz);
        if (typeof r === "number") tx = r;
        else if (r && r.emit) emit = r.emit;
      }
      if (emit != null) {
        cols[i] = emit;
        continue;
      }
      // 주변광 차폐: 주변이 더 앞에 있으면 어둡게
      let occ = 0;
      for (const [ddx, ddy] of [[-2, 0], [2, 0], [0, -2], [0, 2], [-3, -3], [3, 3], [3, -3], [-3, 3]]) {
        const xx = x + ddx, yy = y + ddy;
        if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        const j = yy * W + xx;
        MI[j] >= 0 && Z[j] > Z[i] + 1.5 && (occ += Math.min(1, (Z[j] - Z[i] - 1.5) / 5));
      }
      occ = Math.min(1, occ / 4);
      const nl = nx * lx + ny * ly + nz * lz;
      if (o.cel) {
        // ── 픽셀 아트 칠하기: 4단계로 딱 끊고(디더링 없음), 결은 무늬로만, 반사광은 작은 점 ──
        const R = m._cel ?? (m._cel = [m.cdeep ?? mix(mix(m.base, 0x000000, 0.56), 0x2a1450, 0.32), m.clo ?? mix(mix(m.base, 0x000000, 0.3), 0x3a2060, 0.18), m.base, m.chi ?? mix(m.base, 0xfff2c8, 0.36)]);
        let L = nl > 0.5 ? 3 : nl > 0.02 ? 2 : nl > -0.42 ? 1 : 0;
        occ > 0.45 && (L = Math.max(0, L - 1));
        tx > 0.45 ? (L = Math.min(3, L + 1)) : tx < -0.45 && (L = Math.max(0, L - 1));
        let c = R[L];
        if (m.spec > 0.3) {
          const sp = Math.pow(clamp((nx * hxv + ny * hyv + nz * hzv) / hl, 0, 1), m.shin) * m.spec * 4;
          sp > 1.1 && (c = mix(R[3], 0xffffff, 0.55));
        }
        // 빛 쪽(왼쪽 위) 가장자리 한 줄 밝게: 바로 위·왼쪽이 비었거나 훨씬 뒤면
        if (nl > -0.1) {
          let ed = !1;
          for (const [ddx, ddy] of [[-1, 0], [0, -1]]) {
            const xx = x + ddx, yy = y + ddy;
            if (xx < 0 || yy < 0) continue;
            const j = yy * W + xx;
            (MI[j] < 0 || Z[i] - Z[j] > (o.inner ?? 4)) && (ed = !0);
          }
          ed && (c = mix(R[3], 0xffffff, m.edge ?? 0.3));
        }
        cols[i] = c;
        continue;
      }
      const wrap = clamp((nl + 0.45) / 1.45, 0, 1);
      let t = 0.04 + 0.96 * Math.pow(wrap, 1.15) + tx * 0.1 - occ * 0.5;
      // 단계로 끊고 경계는 살짝 디더링
      const steps = m.tones - 1;
      t = clamp(t, 0, 1) * steps + (BAY[(y & 3) * 4 + (x & 3)] / 16 - 0.5) * 0.3;
      const q = clamp(Math.round(t), 0, steps) / steps;
      let c = q < 0.25 ? mix(m.deep, m.lo, q / 0.25) : q < 0.6 ? mix(m.lo, m.base, (q - 0.25) / 0.35) : mix(m.base, m.hi, (q - 0.6) / 0.4);
      // 테두리 역광 (오른쪽 뒤 가장자리)
      const rim = Math.pow(1 - clamp(nz, 0, 1), 3) * clamp(nx * 0.8 + 0.25 - ny * 0.2, 0, 1) * m.rim;
      rim > 0.18 && (c = mix(c, m.rimCol, Math.min(0.75, rim)));
      // 반사광
      if (m.spec > 0) {
        const sp = Math.pow(clamp((nx * hxv + ny * hyv + nz * hzv) / hl, 0, 1), m.shin) * m.spec * 4;
        sp > 0.7 && (c = mix(c, mix(m.hi, 0xffffff, 0.5), Math.min(0.85, sp - 0.3)));
      }
      cols[i] = c;
    }
  // ── 외곽선: 바깥 실루엣 + 안쪽 깊이 경계 ──
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (MI[i] >= 0) {
        let edge = !1;
        for (const [ddx, ddy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const xx = x + ddx, yy = y + ddy;
          if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
          const j = yy * W + xx;
          if (MI[j] >= 0 && Z[j] - Z[i] > (o.inner ?? 4)) edge = !0;
        }
        const m = mats[MI[i]];
        out[i] = pack(edge && m.emit == null ? mix(cols[i], o.cel ? o.outline ?? 0x150c1c : m.out, o.cel ? 0.82 : 0.75) : cols[i]);
      } else {
        let best = -1;
        for (const [ddx, ddy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const xx = x + ddx, yy = y + ddy;
          if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
          const j = yy * W + xx;
          MI[j] >= 0 && (best = j);
        }
        if (best >= 0) {
          const m = mats[MI[best]];
          out[i] = pack(o.cel ? (m.emit != null ? mix(m.emit, 0x150c1c, 0.55) : o.outline ?? 0x150c1c) : m.emit != null ? mix(m.emit, 0x3a1008, 0.5) : m.out);
        }
      }
    }
  return out;
}

// ── 뼈대 도우미 ──
// 2관절 팔다리: 시작점에서 각도 a1로 l1, 이어서 a2(누적)로 l2
export function chain(p, a1, l1, a2, l2) {
  const j1 = [p[0] + Math.cos(a1) * l1, p[1] + Math.sin(a1) * l1, p[2]];
  const j2 = [j1[0] + Math.cos(a1 + a2) * l2, j1[1] + Math.sin(a1 + a2) * l2, p[2]];
  return [j1, j2];
}
export const add = (p, d) => [p[0] + d[0], p[1] + d[1], p[2] + (d[2] ?? 0)];
export const rot2 = (d, a) => {
  const [x, y] = rotZ(d[0], d[1], a);
  return [x, y, d[2] ?? 0];
};
export const ease = (t) => t * t * (3 - 2 * t);
export const lerp = (a, b, t) => a + (b - a) * t;
