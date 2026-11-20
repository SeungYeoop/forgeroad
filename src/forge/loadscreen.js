// 로딩 화면: 구역 이름 · 층 · 위험도, 그 구역 색으로 칠한 시차 실루엣(지상=산과 언덕, 하늘=떠 있는 섬, 지하=동굴),
// 떠오르는 빛 알갱이, 진행 막대. 게임 장면(Run) 위에 화면 고정으로 덮는다 (HUD는 그동안 숨긴다)
const W = 640, H = 360, LW = 320; // 실루엣은 320폭으로 그려 2배로 (픽셀 느낌)

const mix = (a, b, t) => {
  t = Math.max(0, Math.min(1, t));
  const g = (s) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return (g(16) << 16) | (g(8) << 8) | g(0);
};
const css = (c, a = 1) => `rgba(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255},${a})`;
const hash = (a, b) => {
  let x = (a * 374761393 + b * 668265263) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
};
// 가로로 이어지는 잡음 (LW 주기)
const pn = (x, sc, seed) => {
  const n = Math.max(1, Math.round(LW / sc)), fx = x / sc, i = Math.floor(fx), f = fx - i, u = f * f * (3 - 2 * f);
  const a = hash(((i % n) + n) % n, seed), b = hash((((i + 1) % n) + n) % n, seed);
  return a + (b - a) * u;
};

// 하늘 그라데이션 (디더링 띠)
function skyTex(sc, key, top, mid, bot, sun) {
  if (sc.textures.exists(key)) return key;
  const cv = document.createElement("canvas");
  cv.width = W / 2;
  cv.height = H / 2;
  const g = cv.getContext("2d"), sx = W * 0.36, sy = H * 0.2;
  for (let y = 0; y < H / 2; y++)
    for (let x = 0; x < W / 2; x++) {
      const d = (((x * 7 + y * 13) % 16) / 16 - 0.5) / 14, t = y / (H / 2 - 1) + d;
      let c = t < 0.6 ? mix(top, mid, t / 0.6) : mix(mid, bot, (t - 0.6) / 0.4);
      const r = Math.hypot(x - sx, (y - sy) * 1.3) / 120 + d * 0.8;
      r < 1 && (c = mix(c, sun, 0.75 * Math.pow(1 - r, 2.4)));
      Math.hypot(x - sx, y - sy) < 9 && (c = mix(sun, 0xffffff, 0.35));
      g.fillStyle = css(c);
      g.fillRect(x, y, 1, 1);
    }
  sc.textures.addCanvas(key, cv);
  return key;
}
// 실루엣 띠 하나 (LW × h, 위는 투명)
function stripTex(sc, key, h, draw) {
  if (sc.textures.exists(key)) return key;
  const cv = document.createElement("canvas");
  cv.width = LW;
  cv.height = h;
  draw(cv.getContext("2d"), h);
  sc.textures.addCanvas(key, cv);
  return key;
}
const col = (g, x, y0, y1, c) => {
  g.fillStyle = css(c);
  g.fillRect(x, Math.round(y0), 1, Math.max(0, Math.round(y1) - Math.round(y0)));
};
// 능선 + 꼭대기 1px 밝은 테두리
function ridge(g, h, f, c, hi) {
  for (let x = 0; x < LW; x++) {
    const y = Math.round(f(x));
    col(g, x, y, h, c);
    col(g, x, y, y + 1, hi);
  }
}
function island(g, cx, y, w, c, hi, seed) {
  const hh = Math.round(w * 0.55);
  for (let i = 0; i < w; i++) {
    const u = i / (w - 1) - 0.5, bot = y + 3 + hh * Math.pow(1 - Math.abs(u) * 2, 0.8) * (0.75 + 0.25 * hash(i, seed));
    col(g, cx + i - (w >> 1), y, bot, c);
    col(g, cx + i - (w >> 1), y, y + 1, hi);
    hash(i, seed + 3) > 0.85 && col(g, cx + i - (w >> 1), bot, bot + 2 + hash(i, seed + 4) * 8, c);
  }
}
function tree(g, x, gy, s, c) {
  g.fillStyle = css(c);
  g.fillRect(x, gy - 4 * s, 1, 4 * s);
  for (const [dx, dy, r] of [[0, -6, 3.2], [-2.2, -4.5, 2.4], [2.4, -4.6, 2.5]]) {
    const R = r * s;
    for (let j = -R; j <= R; j++)
      for (let i = -R; i <= R; i++) i * i + j * j <= R * R && g.fillRect(Math.round(x + dx * s + i), Math.round(gy + dy * s + j), 1, 1);
  }
}

// 구역마다 실루엣 세 겹 (먼 → 가까운)
function strips(sc, z, pal) {
  const layer = z.y < 0 ? "sky" : z.y > 0 ? "cave" : "ground";
  const k = `ld_${layer}_${pal.far}_${pal.near}`;
  const dusk = mix(pal.sky?.[0] ?? 0x202040, 0x0a0814, 0.5), warm = mix(pal.accent ?? 0xffc080, 0xff9a60, 0.4);
  const C = [mix(mix(pal.far, dusk, 0.55), warm, 0.12), mix(pal.mid, 0x0a0814, 0.66), mix(pal.near, 0x05040a, 0.82)];
  const HI = [mix(C[0], warm, 0.35), mix(C[1], warm, 0.3), mix(C[2], warm, 0.25)];
  const out = [];
  if (layer === "ground") {
    out.push(stripTex(sc, k + "_0", 110, (g, h) => ridge(g, h, (x) => 86 - 78 * (pn(x, 60, 1) * 0.55 + pn(x, 20, 2) * 0.3 + Math.abs(pn(x, 7, 3) - 0.5) * 0.3), C[0], HI[0])));
    out.push(stripTex(sc, k + "_1", 80, (g, h) => {
      const f = (x) => 34 - 22 * (pn(x, 90, 5) * 0.75 + pn(x, 30, 6) * 0.25) + 8;
      ridge(g, h, f, C[1], HI[1]);
      for (let i = 0; i < 9; i++) {
        const x = Math.floor(hash(i, 7) * LW);
        tree(g, x, f(x) + 2, 0.8 + hash(i, 8) * 0.6, C[1]);
      }
    }));
    out.push(stripTex(sc, k + "_2", 50, (g, h) => {
      const f = (x) => 24 - 12 * (pn(x, 60, 9) * 0.8 + pn(x, 15, 10) * 0.2) + 6;
      ridge(g, h, f, C[2], HI[2]);
      for (let x = 0; x < LW; x += 2) hash(x, 11) > 0.45 && col(g, x, f(x) - 1 - hash(x, 12) * 3, f(x), C[2]);
    }));
  } else if (layer === "sky") {
    out.push(stripTex(sc, k + "_0", 150, (g) => {
      for (let i = 0; i < 6; i++) island(g, Math.floor(hash(i, 21) * LW), 20 + hash(i, 22) * 70, 18 + hash(i, 23) * 22, C[0], HI[0], i);
    }));
    out.push(stripTex(sc, k + "_1", 140, (g) => {
      for (let i = 0; i < 4; i++) island(g, Math.floor(hash(i, 31) * LW), 30 + hash(i, 32) * 60, 34 + hash(i, 33) * 30, C[1], HI[1], i + 9);
    }));
    out.push(stripTex(sc, k + "_2", 40, (g, h) => {
      // 아래 구름 바다
      for (let x = 0; x < LW; x++) {
        const y = 14 - 10 * (pn(x, 20, 41) * 0.7 + pn(x, 7, 42) * 0.3);
        col(g, x, y, h, mix(pal.sky?.[1] ?? 0xffffff, 0xffffff, 0.3));
        col(g, x, y, y + 1, 0xffffff);
      }
    }));
  } else {
    out.push(stripTex(sc, k + "_0", 180, (g, h) => {
      // 먼 동굴 벽: 위 종유석 + 아래 석순
      for (let x = 0; x < LW; x++) {
        const t = 20 + 16 * pn(x, 25, 51) + (hash(x >> 2, 52) > 0.8 ? 18 * hash(x >> 2, 53) : 0);
        col(g, x, 0, t, C[0]);
        const b = h - 22 - 18 * pn(x, 30, 54);
        col(g, x, b, h, C[0]);
        col(g, x, b, b + 1, HI[0]);
      }
    }));
    out.push(stripTex(sc, k + "_1", 180, (g, h) => {
      for (let x = 0; x < LW; x++) {
        const t = 8 + 10 * pn(x, 40, 61) + (hash(x >> 1, 62) > 0.86 ? 26 * hash(x >> 1, 63) : 0);
        col(g, x, 0, t, C[1]);
        const b = h - 12 - 12 * pn(x, 45, 64);
        col(g, x, b, h, C[1]);
        col(g, x, b, b + 1, HI[1]);
      }
    }));
    out.push(stripTex(sc, k + "_2", 40, (g, h) => ridge(g, h, (x) => 22 - 12 * pn(x, 26, 71) + 6, C[2], HI[2])));
  }
  return { keys: out, layer };
}

export function showLoad(sc, z, R, o = {}) {
  const reg = z.reg ?? {}, pal = reg.pal ?? { sky: [0x1c1834, 0x4a4070], far: 0x3a3658, mid: 0x2a2644, near: 0x18142a, accent: 0xffe060 };
  const D = 10000, objs = [];
  const add = (x) => (objs.push(x), x.setScrollFactor(0).setDepth(D + objs.length * 0.01), x);
  const cave = z.y > 0, warm = mix(pal.accent ?? 0xffc080, 0xff9a60, 0.4);
  const top = mix(pal.sky[0], 0x05040a, 0.78), mid = mix(mix(pal.sky[0], pal.far, 0.5), 0x0a0814, 0.45), bot = cave ? mix(pal.far, 0x05040a, 0.6) : mix(warm, pal.sky[1], 0.35);
  add(sc.add.image(W / 2, H / 2, skyTex(sc, `ld_sky_${z.y > 0 ? 1 : 0}_${pal.sky[0]}_${pal.sky[1]}`, top, mid, bot, cave ? mix(pal.accent ?? 0xffe0a0, 0x000000, 0.5) : mix(warm, 0xfff0c0, 0.4))).setScale(2));
  const S = strips(sc, z, pal);
  // 실루엣 띠: 아래 끝을 맞춘다 (먼 띠는 높이, 가까운 띠는 낮게)
  const hs = S.layer === "sky" ? [150, 140, 40] : S.layer === "cave" ? [180, 180, 40] : [110, 80, 50];
  const bots = S.layer === "sky" ? [H * 0.62, H * 0.86, H] : S.layer === "cave" ? [H, H, H] : [H - 52, H - 18, H];
  const layers = S.keys.map((k, i) => add(sc.add.tileSprite(W / 2, bots[i], LW, hs[i], k).setScale(2).setOrigin(0.5, 1)));
  const speed = [4, 9, 20];
  // 떠오르는 빛 알갱이
  const motes = Array.from({ length: 36 }, (_, i) => ({ x: Math.random() * W, y: Math.random() * H, v: 6 + Math.random() * 14, ph: Math.random() * 6.28, s: Math.random() < 0.3 ? 2 : 1 }));
  const fx = add(sc.add.graphics());
  // 글자
  const D0 = R.dangerOf ? R.dangerOf(z) : null;
  // 글자 뒤 은은한 어둠 (위아래로 흐려짐)
  const shade = add(sc.add.graphics());
  for (let i = 0; i < 12; i++) shade.fillStyle(0x05040a, 0.05).fillRect(0, H / 2 - 70 + i * 4, W, 100 - i * 8);
  const name = add(R.ct(sc, W / 2, H / 2 - 40, z.name ?? "", "title", "#f6ecd2", { stroke: "#140c1e", strokeThickness: 4 }).setOrigin(0.5));
  const orn = add(sc.add.graphics());
  const sub = add(R.ct(sc, W / 2, H / 2 + 6, [R.layerName ? R.layerName(z.y) : "", D0 ? `${D0.name} · ${D0.label}` : ""].filter(Boolean).join("   ·   "), "small", D0?.css ?? "#c8bca0").setOrigin(0.5));
  const status = add(R.ct(sc, W / 2 - 132, H - 44, "지형을 설계하는 중", "small", "#d8ccb0").setOrigin(0, 0.5));
  const pct = add(R.ct(sc, W / 2 + 132, H - 44, "0%", "small", "#f6ecd2").setOrigin(1, 0.5));
  const bar = add(sc.add.graphics());
  const L = {
    stage: "plan",
    t: 0,
    shown: 0,
    alpha: o.instant ? 1 : 0,
    want: 1,
    p: 0,
    shownP: 0,
    done: null,
    onOpaque: [],
    painted: 0,
    total: 1,
    setP(p) {
      L.p = Math.max(L.p, Math.min(1, p));
    },
    update(dt) {
      L.t += dt;
      L.alpha += Math.sign(L.want - L.alpha) * Math.min(Math.abs(L.want - L.alpha), dt / (L.want ? 0.22 : 0.4));
      if (L.alpha >= 1 && L.onOpaque.length) for (const f of L.onOpaque.splice(0)) f();
      // 설계 중엔 정보가 없으니 천천히 차오르게(55%까지), 그리는 중엔 실제 띠 수로
      if (L.stage === "plan") L.setP(0.55 * (1 - Math.exp(-L.t / 2.2)));
      else if (L.stage === "paint") L.setP(0.55 + 0.45 * (L.painted / Math.max(1, L.total)));
      L.shownP += (L.p - L.shownP) * Math.min(1, dt * 6);
      for (const x of objs) x.setAlpha(L.alpha);
      const hud = sc.hud?.();
      hud?.cameras?.main && hud.cameras.main.setAlpha(1 - L.alpha);
      layers.forEach((t, i) => (t.tilePositionX += speed[i] * dt * 0.5));
      fx.clear();
      for (const m of motes) {
        m.y -= m.v * dt;
        m.ph += dt * 2;
        if (m.y < -4) ((m.y = H + 4), (m.x = Math.random() * W));
        fx.fillStyle(pal.accent ?? 0xffe0a0, 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(m.ph))).fillRect(Math.round(m.x + Math.sin(m.ph * 0.7) * 6), Math.round(m.y), m.s, m.s);
      }
      // 이름 아래 장식선 (가운데 마름모가 천천히 빛난다)
      const nw = Math.min(260, name.width + 60), cy = H / 2 - 14, a = 0.6 + 0.4 * Math.sin(L.t * 3);
      orn.clear().fillStyle(pal.accent ?? 0xffe0a0, 0.7).fillRect(W / 2 - nw / 2, cy, nw / 2 - 8, 1).fillRect(W / 2 + 8, cy, nw / 2 - 8, 1);
      orn.fillStyle(pal.accent ?? 0xffe0a0, a).fillTriangle(W / 2 - 5, cy, W / 2, cy - 5, W / 2 + 5, cy).fillTriangle(W / 2 - 5, cy + 1, W / 2, cy + 6, W / 2 + 5, cy + 1);
      // 진행 막대: 4px 칸, 채워진 칸은 강조색→흰색, 맨 끝 칸이 깜빡
      const bx = W / 2 - 132, by = H - 30, bw = 264, n = 44, fill = L.shownP * n;
      bar.clear().fillStyle(0x05040a, 0.8).fillRect(bx - 3, by - 3, bw + 6, 12).lineStyle(1, mix(pal.accent ?? 0xffe0a0, 0x000000, 0.3), 0.9).strokeRect(bx - 3.5, by - 3.5, bw + 7, 13);
      for (let i = 0; i < n; i++) {
        const on = i < Math.floor(fill), edge = i === Math.floor(fill);
        if (!on && !edge) continue;
        bar.fillStyle(mix(pal.accent ?? 0xffe0a0, 0xffffff, i / n * 0.6), edge ? 0.35 + 0.35 * Math.sin(L.t * 10) : 1).fillRect(bx + i * 6, by, 5, 6);
      }
      pct.setText(`${Math.round(L.shownP * 100)}%`);
      const dots = ".".repeat(1 + (Math.floor(L.t * 3) % 3));
      status.setText((L.stage === "plan" ? "지형을 설계하는 중" : L.stage === "paint" ? "땅을 그리는 중" : "준비 완료") + (L.stage === "ready" ? "" : dots));
      if (L.closing && L.alpha <= 0) L.destroy();
    },
    close(cb) {
      L.stage = "ready";
      L.setP(1);
      L.closing = 1;
      L.want = 0;
      cb && cb();
    },
    destroy() {
      if (L.dead) return;
      L.dead = 1;
      for (const x of objs) x.destroy();
      const hud = sc.hud?.();
      hud?.cameras?.main && hud.cameras.main.setAlpha(1);
    },
  };
  for (const x of objs) x.setAlpha(L.alpha);
  return L;
}
