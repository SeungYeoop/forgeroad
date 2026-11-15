// 배경 전면 재작업: 입체 음영(빛 받는 면·그늘 면)·대기 원근·뭉게구름·떠 있는 섬. 640x360 버퍼, 원경 0 · 중경 1 · 근경 2
const W = 640, HH = 360;
const sh = (c, f) => {
  const g = (s) => {
    const v = (c >> s) & 255;
    return Math.max(0, Math.min(255, Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f))));
  };
  return (g(16) << 16) | (g(8) << 8) | g(0);
};
const mix = (a, b, t) => {
  const g = (s) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return (g(16) << 16) | (g(8) << 8) | g(0);
};
const THEME = {
  ashvillage: "plains", mistwood: "forest", echomine: "cave", rotmarsh: "marsh", blazefort: "fortress", frostgorge: "snow",
  glassdesert: "desert", thunderspire: "spire", crystalsanctum: "crystal", skyruins: "sky", shadowcapital: "abyss", forgeheart: "forge",
};
export const paintable = (id) => !!THEME[id] || /^fr_c_|^corr/.test(id ?? "");

// 뭉게구름: 그늘 → 몸통 → 윗면 빛
function cloud(T, x, y, s, E, a = 255) {
  const sky = E.sky[1], body = mix(sky, 0xffffff, 0.8), shade = mix(E.sky[0], 0xffffff, 0.45), hi = 0xffffff;
  const puffs = [[0, 0, 1], [-0.9, 0.25, 0.75], [0.95, 0.2, 0.8], [-0.4, -0.45, 0.7], [0.45, -0.5, 0.75], [1.7, 0.4, 0.55], [-1.6, 0.45, 0.5]];
  for (const [dx, dy, r] of puffs) T.circle(x + dx * 22 * s, y + dy * 18 * s + 5 * s, r * 20 * s, shade, a);
  for (const [dx, dy, r] of puffs) T.circle(x + dx * 22 * s, y + dy * 18 * s, r * 19 * s, body, a);
  for (const [dx, dy, r] of puffs) dy <= 0.25 && T.circle(x + dx * 22 * s - 4 * s, y + dy * 18 * s - 5 * s, r * 11 * s, hi, a);
  T.rect(x - 52 * s, y + 10 * s, 104 * s, 8 * s, shade, a);
}
// 능선: 빛 받는 경사는 밝게, 반대는 어둡게, 높은 곳 눈
function ridge(T, h, base, top, amp, col, light, snow, haze, sky) {
  const ph = [h.int(0, 999), h.int(0, 999), h.int(0, 999)];
  const f = (x) => base - amp * (0.55 * Math.sin((x / W) * Math.PI * 2 * 2 + ph[0]) * 0.5 + 0.5) - amp * 0.35 * (Math.sin((x / W) * Math.PI * 2 * 5 + ph[1]) * 0.5 + 0.5) - amp * 0.18 * Math.abs(Math.sin((x / W) * Math.PI * 2 * 11 + ph[2]));
  for (let x = 0; x < W; x++) {
    const y0 = Math.round(f(x)), slope = f(x + 1) - f(x - 1);
    const c = slope > 0.4 ? sh(col, light) : slope < -0.4 ? sh(col, -0.18) : col;
    for (let y = y0; y < HH; y++) {
      const k = Math.min(1, (y - y0) / 120);
      T.px(x, y, mix(mix(c, sh(col, -0.25), k), sky, haze * (1 - k * 0.5)));
    }
    snow && y0 < top + 18 && T.rect(x, y0, 1, Math.max(2, top + 22 - y0), slope > 0 ? 0xffffff : 0xd8e4f4);
    T.px(x, y0, sh(c, 0.3));
  }
  return f;
}
// 나무: 3단 음영 잎 + 줄기
function tree(T, x, gy, s, leaf, trunk, kind = "round") {
  T.rect(x - 2 * s, gy - 18 * s, 4 * s, 18 * s, trunk);
  T.rect(x - 2 * s, gy - 18 * s, 1.5 * s, 18 * s, sh(trunk, 0.2));
  if (kind === "pine") {
    for (let i = 0; i < 4; i++) {
      const y = gy - 14 * s - i * 9 * s, w = (16 - i * 3.2) * s;
      T.poly([[x - w, y], [x, y - 14 * s], [x + w, y]], sh(leaf, -0.2));
      T.poly([[x - w * 0.8, y - 1], [x, y - 14 * s], [x + w * 0.1, y - 1]], sh(leaf, 0.15));
    }
    return;
  }
  const C = [[0, -30, 15], [-11, -22, 11], [11, -22, 12], [-5, -38, 10], [6, -36, 10]];
  for (const [dx, dy, r] of C) T.circle(x + dx * s, gy + dy * s + 3 * s, r * s, sh(leaf, -0.3));
  for (const [dx, dy, r] of C) T.circle(x + dx * s, gy + dy * s, r * s, leaf);
  for (const [dx, dy, r] of C) T.circle(x + dx * s - 3 * s, gy + dy * s - 4 * s, r * 0.55 * s, sh(leaf, 0.28));
}
// 떠 있는 섬: 풀 윗면, 그늘진 바위 아랫면, 늘어진 뿌리
function island(T, x, y, w, E, h, grass, rock, depth = 0) {
  const d = (v) => mix(v, E.sky[1], depth);
  const hgt = w * 0.55;
  for (let i = 0; i <= w; i++) {
    const u = i / w - 0.5;
    const bot = y + hgt * (1 - Math.abs(u) * 2) * (0.75 + 0.25 * Math.sin(i * 0.4)) + 4;
    const c = u < -0.15 ? sh(rock, 0.12) : u > 0.2 ? sh(rock, -0.25) : rock;
    for (let yy = y + 4; yy < bot; yy++) {
      const k = (yy - y) / hgt;
      T.px(x - w / 2 + i, yy, d(sh(c, -k * 0.35 + ((Math.floor(yy / 5) + Math.floor(i / 7)) % 3 === 0 ? -0.1 : 0))));
    }
    T.px(x - w / 2 + i, bot, d(sh(rock, -0.5)));
  }
  T.ellipse(x, y + 3, w / 2 + 2, 6, d(sh(grass, -0.3)));
  T.ellipse(x, y, w / 2, 5, d(grass));
  T.ellipse(x - w * 0.08, y - 1.5, w * 0.36, 2.5, d(sh(grass, 0.3)));
  for (let k = 0; k < w / 10; k++) {
    const rx = x - w / 2 + h.int(4, w - 4), L = h.int(4, 14);
    T.thickLine(rx, y + 6, rx + h.int(-2, 2), y + 6 + L, 1, d(sh(grass, -0.45)));
  }
}
// 건물: 빛 면 + 그늘 면 + 빛나는 창
function tower(T, x, gy, w, hgt, col, roof, glow, E, depth = 0) {
  const d = (v) => mix(v, E.sky[1], depth);
  T.rect(x, gy - hgt, w, hgt, d(col));
  T.rect(x, gy - hgt, Math.ceil(w * 0.35), hgt, d(sh(col, 0.18)));
  T.rect(x + w - 2, gy - hgt, 2, hgt, d(sh(col, -0.3)));
  for (let yy = gy - hgt + 4; yy < gy; yy += 6) T.rect(x, yy, w, 1, d(sh(col, -0.12)));
  T.poly([[x - 3, gy - hgt], [x + w / 2, gy - hgt - w * 0.9], [x + w + 3, gy - hgt]], d(roof));
  T.poly([[x - 3, gy - hgt], [x + w / 2, gy - hgt - w * 0.9], [x + w / 2, gy - hgt]], d(sh(roof, 0.2)));
  for (let yy = gy - hgt + 8; yy < gy - 6; yy += 14) T.rect(x + w / 2 - 1.5, yy, 3, 5, glow);
}

export function paintLayer(T, S, E, h, id) {
  const th = THEME[id] ?? "sky";
  const sky = E.sky[1];
  if (S === 0) {
    // 원경: 구름 + 먼 산맥(대기 원근)
    if (th !== "cave") for (let i = 0; i < 7; i++) {
      const x = h.int(0, W), y = h.int(30, 150), s = 0.6 + Math.random() * 0.9;
      for (const dx of [-W, 0, W]) cloud(T, x + dx, y, s, E, 235);
    }
    const snow = th === "snow" || th === "plains" || th === "sky" || th === "spire";
    ridge(T, h, 270, 170, 90, E.far, 0.22, snow, 0.3, sky);
    if (th === "desert") for (let i = 0; i < 3; i++) {
      const x = h.int(40, W - 40), b = 262, s = h.int(30, 60);
      T.poly([[x - s, b], [x, b - s], [x + s, b]], mix(sh(E.far, -0.1), sky, 0.3));
      T.poly([[x - s, b], [x, b - s], [x, b]], mix(sh(E.far, 0.2), sky, 0.3));
    }
    // 지역 전용 먼 풍경
    const haze = (c, k = 0.35) => mix(c, sky, k);
    if (th === "forest" || th === "marsh") for (let i = 0; i < 6; i++) {
      const x = h.int(0, W), gy = 300, s = 2.2 + Math.random();
      for (const dx of [-W, 0, W]) tree(T, x + dx, gy, s, haze(sh(E.top, -0.35), 0.45), haze(sh(E.soil, -0.4), 0.45), th === "marsh" ? "pine" : "round");
    }
    if (th === "fortress" || th === "forge") {
      for (let y = 230; y < 300; y++) T.rect(0, y, W, 1, mix(E.accent, sky, 0.3 + (300 - y) / 100), Math.round(90 * (1 - (300 - y) / 70)));
      for (let i = 0; i < 5; i++) {
        const x = h.int(0, W), w = h.int(10, 18), hh = h.int(60, 120);
        for (const dx of [-W, 0, W]) {
          tower(T, x + dx, 290, w, hh, haze(sh(E.rock, -0.35), 0.3), haze(sh(E.rock, -0.5), 0.3), E.accent, E, 0);
          for (let k = 0; k < 18; k++) T.circle(x + dx + w / 2 + Math.sin(k * 0.6) * (4 + k), 290 - hh - w - k * 7, 5 + k * 0.8, haze(0x4a4048, 0.4), Math.round(150 * (1 - k / 18)));
        }
      }
    }
    if (th === "spire") for (let i = 0; i < 4; i++) {
      const x = h.int(20, W - 20), hh = h.int(120, 190);
      for (const dx of [-W, 0, W]) {
        tower(T, x + dx, 300, 12, hh, haze(E.rock, 0.3), haze(sh(E.accent, -0.4), 0.3), E.accent, E, 0);
        T.circle(x + dx + 6, 300 - hh - 16, 5, E.accent, 200);
        T.circle(x + dx + 6, 300 - hh - 16, 10, E.accent, 60);
      }
    }
    if (th === "crystal") for (let i = 0; i < 7; i++) {
      const x = h.int(0, W), hh = h.int(70, 160), w = h.int(10, 20);
      for (const dx of [-W, 0, W]) {
        T.poly([[x + dx - w, 300], [x + dx, 300 - hh], [x + dx + w, 300]], haze(sh(E.accent, -0.3), 0.35));
        T.poly([[x + dx - w, 300], [x + dx, 300 - hh], [x + dx, 300]], haze(sh(E.accent, 0.3), 0.35));
      }
    }
    if (th === "sky") for (let i = 0; i < 5; i++) {
      const x = h.int(0, W), y = h.int(150, 230), w = h.int(30, 60);
      for (const dx of [-W, 0, W]) island(T, x + dx, y, w, E, h, E.top, E.rock, 0.55);
    }
    if (th === "abyss") for (let i = 0; i < 4; i++) {
      const x = h.int(0, W), w = h.int(16, 26), hh = h.int(90, 170);
      for (const dx of [-W, 0, W]) tower(T, x + dx, 300, w, hh, sh(E.far, -0.35), sh(E.far, -0.5), E.accent, E, 0);
    }
    if (th === "snow") for (let i = 0; i < 14; i++) {
      const x = h.int(0, W);
      for (const dx of [-W, 0, W]) tree(T, x + dx, 296, 1.3, haze(0x2e5a5a, 0.4), haze(0x3a2a20, 0.4), "pine");
    }
    if (th === "cave" || th === "abyss") for (let x = 0; x < W; x += h.int(10, 26)) {
      const L = h.int(30, 110), w = h.int(6, 14);
      T.poly([[x, 0], [x + w / 2, L], [x + w, 0]], sh(E.far, -0.2));
      T.poly([[x, 0], [x + w / 2, L], [x + w / 2, 0]], sh(E.far, 0.05));
    }
    return;
  }
  if (S === 1) {
    // 중경: 테마 지형 + 떠 있는 섬 + 건물
    const f = ridge(T, h, 300, 230, 60, E.mid, 0.2, th === "snow", 0.22, sky);
    const grass = E.top, rock = E.rock;
    if (th === "sky" || th === "crystal" || th === "spire" || th === "plains" || th === "forest") for (let i = 0; i < 4; i++) {
      const x = h.int(40, W - 40), y = h.int(110, 200), w = h.int(40, 90);
      for (const dx of [-W, 0, W]) island(T, x + dx, y, w, E, h, grass, rock, 0.35);
    }
    const props = { plains: 5, forest: 9, marsh: 7, snow: 8, sky: 3, spire: 4, crystal: 5, fortress: 4, abyss: 5, forge: 4, desert: 3, cave: 6 }[th];
    for (let i = 0; i < props; i++) {
      const x = h.int(0, W), gy = Math.round(f(x)) + 4;
      const dep = 0.25;
      if (th === "forest" || th === "marsh") tree(T, x, gy, 1.3 + Math.random() * 0.5, mix(sh(E.top, -0.15), sky, dep), mix(sh(E.soil, -0.2), sky, dep));
      else if (th === "snow") tree(T, x, gy, 1.1, mix(0x2e6a5a, sky, dep), mix(0x4a3424, sky, dep), "pine");
      else if (th === "plains") (h.chance(0.5) ? tree(T, x, gy, 1, mix(E.top, sky, dep), mix(E.soil, sky, dep)) : tower(T, x, gy, 18, 30, mix(E.rock, 0xffffff, 0.15), sh(E.accent, -0.3), 0xffe8a0, E, dep));
      else if (th === "fortress" || th === "forge" || th === "spire" || th === "abyss" || th === "sky" || th === "crystal") tower(T, x, gy, h.int(14, 24), h.int(40, 90), mix(E.rock, th === "abyss" ? 0x000000 : 0xffffff, 0.15), th === "abyss" ? sh(E.rock, -0.4) : sh(E.accent, -0.35), E.accent, E, dep);
      else if (th === "desert") {
        const s = h.int(18, 34);
        T.poly([[x - s, gy], [x, gy - s * 1.1], [x + s, gy]], mix(sh(E.rock, -0.1), sky, dep));
        T.poly([[x - s, gy], [x, gy - s * 1.1], [x, gy]], mix(sh(E.rock, 0.2), sky, dep));
      } else if (th === "cave") {
        const s = h.int(10, 22);
        T.poly([[x - s * 0.4, gy], [x, gy - s * 2], [x + s * 0.4, gy]], mix(E.accent, E.mid, 0.4));
        T.poly([[x - s * 0.4, gy], [x, gy - s * 2], [x, gy]], mix(E.accent, 0xffffff, 0.3));
      }
    }
    return;
  }
  // 근경: 바닥 쪽 수풀·바위·소품 (채도 높게)
  const f = ridge(T, h, 330, 290, 30, mix(E.near, E.top, 0.35), 0.18, !1, 0.05, sky);
  for (let i = 0; i < 14; i++) {
    const x = h.int(0, W), gy = Math.round(f(x)) + 6;
    for (const dx of [-W, 0, W]) {
      if (th === "forest" || th === "marsh" || th === "plains" || th === "sky") {
        const r = h.int(8, 16), c = mix(sh(E.top, -0.25), E.near, 0.3);
        T.circle(x + dx, gy, r, sh(c, -0.25));
        T.circle(x + dx - 2, gy - 2, r * 0.85, c);
        T.circle(x + dx - 4, gy - 5, r * 0.45, sh(c, 0.25));
      } else {
        const r = h.int(6, 14), c = mix(E.rock, E.near, 0.4);
        T.poly([[x + dx - r, gy], [x + dx - r * 0.4, gy - r], [x + dx + r * 0.5, gy - r * 0.8], [x + dx + r, gy]], sh(c, -0.2));
        T.poly([[x + dx - r, gy], [x + dx - r * 0.4, gy - r], [x + dx, gy - r * 0.6], [x + dx - r * 0.2, gy]], sh(c, 0.2));
      }
    }
  }
}
