// 몬스터·보스 스프라이트 리메이크. 원본 프레임 구조를 그대로 지킨다.
// 몬스터 9프레임: 0-1 대기, 2-5 이동, 6 준비, 7 공격, 8 피격
// 보스 8프레임: 0-1 대기, 2-3 이동, 4 준비, 5 공격, 6 특수, 7 피격
const sh = (c, f) => {
  const g = (s) => {
    const v = (c >> s) & 255;
    return Math.max(0, Math.min(255, Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f))));
  };
  return (g(16) << 16) | (g(8) << 8) | g(0);
};
const OUT = 0x0c0810;
const mobPose = (f) => ({ f, idle: f < 2, move: f >= 2 && f < 6, wind: f === 6, atk: f === 7, hurt: f === 8, m: f >= 2 && f < 6 ? f - 2 : 0, b: f < 2 ? f : f >= 2 && f < 6 ? [0, 1, 0, -1][f - 2] : 0 });
const bossPose = (f) => ({ f, idle: f < 2, move: f === 2 || f === 3, wind: f === 4, atk: f === 5, sp: f === 6, hurt: f === 7, m: f === 2 ? 0 : f === 3 ? 2 : 0, b: f % 2 });

// 3단 음영 타원
function ball(b, x, y, rx, ry, c, light = 0.2) {
  b.ellipse(x, y, rx, ry, sh(c, -0.3));
  b.ellipse(x - rx * 0.12, y - ry * 0.12, rx * 0.86, ry * 0.84, c);
  b.ellipse(x - rx * 0.3, y - ry * 0.35, Math.max(0.8, rx * 0.4), Math.max(0.6, ry * 0.32), sh(c, light));
}
// 위협적인 눈: 가늘게 빛나는 눈, 흰 하이라이트 없이 핵만 밝게
function eyes(b, x, y, c, gap = 3, big = 1) {
  const glow = (c & 0xffffff) === 0 || ((c >> 16) & 255) + ((c >> 8) & 255) + (c & 255) < 120 ? 0xff3a2a : c;
  for (const ex of [x, x + gap]) {
    b.rect(ex - 1, y - 1, big + 3, 1, 0x0a0608);
    b.rect(ex, y, big + 1, 1, glow);
    b.px(ex + big, y, 0xffe8c0);
  }
}
function glowEye(b, x, y, c) {
  b.px(x, y, 0xffffff);
  b.px(x + 1, y, c);
  b.px(x - 1, y, sh(c, -0.3));
}
const L = (b, x0, y0, x1, y1, w, c) => (w <= 1 ? b.line(x0, y0, x1, y1, c) : b.thickLine(x0, y0, x1, y1, w, c));

// ── 무기 소품 ──
function prop(b, kind, x, y, ang, s, C) {
  const ca = Math.cos(ang), sa = Math.sin(ang);
  const P = (d, o = 0) => [x + ca * d - sa * o, y + sa * d + ca * o];
  const M = C.metal ?? 0xb8c0cc, W = 0x6a4428;
  switch (kind) {
    case "spear": case "pike": {
      const len = (kind === "pike" ? 16 : 12) * s;
      L(b, ...P(-3 * s), ...P(len), 1.6, W);
      b.poly([P(len - 1, -1.6 * s), P(len + 4 * s), P(len - 1, 1.6 * s)], M);
      break;
    }
    case "sword": case "scimitar": {
      L(b, ...P(-2 * s), ...P(1 * s), 1.6, 0x3a2418);
      L(b, ...P(0, -2 * s), ...P(0, 2 * s), 1.2, C.accent ?? 0xc8a040);
      const tip = kind === "scimitar" ? P(10 * s, -2.5 * s) : P(10 * s);
      L(b, ...P(1 * s), ...tip, 2 * Math.max(0.8, s * 0.8), M);
      L(b, ...P(1 * s, -0.6), ...tip, 1, sh(M, 0.5));
      break;
    }
    case "axe": {
      L(b, ...P(-3 * s), ...P(11 * s), 1.6, W);
      b.poly([P(7 * s, 0), P(6 * s, -5 * s), P(12 * s, -6 * s), P(11 * s, 1 * s)], M);
      L(b, ...P(6 * s, -5 * s), ...P(12 * s, -6 * s), 1, sh(M, 0.5));
      break;
    }
    case "staff": {
      L(b, ...P(-6 * s), ...P(10 * s), 1.4, W);
      const [ox, oy] = P(11 * s);
      b.circle(ox, oy, 2.2 * s, C.accent ?? 0x80c0ff, 120);
      b.circle(ox, oy, 1.4 * s, C.accent ?? 0x80c0ff);
      b.px(ox - 0.5, oy - 0.5, 0xffffff);
      break;
    }
    case "crossbow": {
      L(b, ...P(-2 * s), ...P(8 * s), 2, W);
      L(b, ...P(6 * s, -5 * s), ...P(6 * s, 5 * s), 1.4, 0x8a6a40);
      L(b, ...P(6 * s, -5 * s), ...P(1 * s), 1, 0xd0d0d0);
      L(b, ...P(6 * s, 5 * s), ...P(1 * s), 1, 0xd0d0d0);
      break;
    }
    case "sling": {
      L(b, ...P(0), ...P(5 * s, 2 * s), 1, 0x8a6a40);
      b.circle(...P(6 * s, 2 * s), 1.5, 0x8a8478);
      break;
    }
    case "bomb": {
      const [ox, oy] = P(3 * s);
      b.circle(ox, oy, 2.6 * s, 0x2a2a34);
      b.px(ox - 1, oy - 1, 0x6a6a7a);
      L(b, ox + 1, oy - 2.5 * s, ox + 2, oy - 4 * s, 1, 0xc8a060);
      b.px(ox + 2, oy - 4.5 * s, 0xffd040);
      b.px(ox + 3, oy - 5 * s, 0xff6020);
      break;
    }
    case "banner": {
      L(b, ...P(-6 * s), ...P(18 * s), 1.4, W);
      const [tx, ty] = P(18 * s);
      b.poly([[tx, ty], [tx + 9 * s, ty + 2 * s], [tx + 7 * s, ty + 5 * s], [tx + 9 * s, ty + 8 * s], [tx, ty + 8 * s]], C.accent ?? 0xc03030);
      b.px(tx + 3 * s, ty + 4 * s, 0xf0d070);
      break;
    }
    case "dagger": {
      L(b, ...P(0), ...P(6 * s), 1.4, M);
      b.px(...P(6 * s), 0xffffff);
      break;
    }
  }
}

// ── 인간형 ──
function humanoid(b, P, w, h, C) {
  const u = h / 24;
  const cx = w / 2 + (C.offx ?? 0);
  const bob = P.b * 0.6 * u + (P.wind ? 1 * u : 0);
  const lean = P.atk ? 2 * u : P.wind ? -1.5 * u : P.move ? 0.6 * u : 0;
  const foot = h - 1;
  const hipY = foot - 7 * u * (C.short ? 0.75 : 1);
  const stride = P.move ? [3, 1, -3, -1][P.m] * u * 0.8 : 0;
  const legW = Math.max(2, 2.4 * u * (C.bulk ?? 1));
  const pants = C.pants ?? sh(C.body, -0.35);
  // 망토
  if (C.cape) b.poly([[cx - 2 * u + lean, hipY - 8 * u + bob], [cx + 1 * u + lean, hipY - 8 * u + bob], [cx - 4 * u - stride * 0.3, foot - 1], [cx - 6 * u - stride * 0.4, foot - 3]], C.cape);
  // 다리
  if (!C.floaty) {
    L(b, cx - 1.5 * u + lean * 0.3, hipY + bob, cx - 1.5 * u - stride, foot - 1.5, legW, sh(pants, -0.2));
    b.rect(cx - 2.5 * u - stride, foot - 1.5, 3 * u, 2, sh(pants, -0.5));
    L(b, cx + 1.5 * u + lean * 0.3, hipY + bob, cx + 1.5 * u + stride, foot - 1.5, legW, pants);
    b.rect(cx + 0.5 * u + stride, foot - 1.5, 3.2 * u, 2, sh(pants, -0.45));
  } else {
    b.poly([[cx - 4 * u, hipY + bob], [cx + 4 * u, hipY + bob], [cx + 2 * u + Math.sin(P.f) * u, foot - 2], [cx - 3 * u, foot - 4]], sh(C.body, -0.2));
  }
  // 몸통
  const tw = 7 * u * (C.bulk ?? 1), th = 8 * u;
  const tx = cx - tw / 2 + lean, ty = hipY - th + bob;
  if (C.robe) b.poly([[tx, ty], [tx + tw, ty], [tx + tw + 2 * u, foot - 1], [tx - 2 * u, foot - 1]], sh(C.body, -0.08));
  b.rect(tx, ty, tw, th, C.body);
  b.rect(tx, ty, Math.max(1, tw * 0.25), th, sh(C.body, -0.25));
  b.rect(tx + tw * 0.75, ty, Math.max(1, tw * 0.25), th, sh(C.body, 0.15));
  b.rect(tx, ty + th - 2 * u, tw, Math.max(1, 1.2 * u), C.trim ?? sh(C.body, -0.45));
  if (C.armor) (b.rect(tx + tw * 0.3, ty + 1, tw * 0.4, th * 0.5, sh(C.body, 0.3)), b.ellipse(tx, ty + 1, 2.2 * u, 1.6 * u, sh(C.body, 0.2)), b.ellipse(tx + tw, ty + 1, 2.2 * u, 1.6 * u, sh(C.body, 0.35)));
  if (C.wraps) for (let i = 0; i < th; i += 2) b.line(tx, ty + i, tx + tw, ty + i + 1, sh(C.body, -0.2));
  // 뒷팔·방패
  const shY = ty + 1.5 * u;
  if (C.shield) {
    const sx = tx + tw * 0.2 - (P.atk ? 0 : 1 * u), sy = shY + 2 * u;
    b.poly([[sx - 3 * u, sy - 3 * u], [sx + 3 * u, sy - 3 * u], [sx + 3 * u, sy + 2 * u], [sx, sy + 5 * u], [sx - 3 * u, sy + 2 * u]], sh(C.shield, -0.3));
    b.poly([[sx - 2 * u, sy - 2 * u], [sx + 2 * u, sy - 2 * u], [sx + 2 * u, sy + 1.5 * u], [sx, sy + 3.8 * u], [sx - 2 * u, sy + 1.5 * u]], C.shield);
    b.px(sx, sy, C.accent ?? 0xf0d070);
  }
  // 머리
  const hr = 3.2 * u * (C.headScale ?? 1);
  const hx = cx + lean + 0.5 * u, hy = ty - hr + 0.6 * u;
  if (C.head === "skull") {
    ball(b, hx, hy, hr, hr * 0.95, 0xe8e0cc, 0.25);
    b.rect(hx - 1 * u, hy, 1.4 * u, 1.4 * u, 0x200810);
    b.rect(hx + 1.2 * u, hy, 1.4 * u, 1.4 * u, 0x200810);
    glowEye(b, hx + 1.6 * u, hy + 0.5 * u, C.eye ?? 0xff4020);
  } else {
    ball(b, hx, hy, hr, hr * 0.95, C.skin ?? 0xd8b090, 0.18);
    if (C.eyeGlow) (glowEye(b, hx + 0.6 * u, hy, C.eyeGlow), glowEye(b, hx + 2.2 * u, hy, C.eyeGlow));
    else eyes(b, hx + 0.2 * u, hy - 0.3 * u, C.eye ?? 0x1a0e18, Math.max(2, 2 * u), u > 1.2 ? 1 : 0);
  }
  switch (C.hat) {
    case "helm":
      b.poly([[hx - hr, hy], [hx - hr, hy - hr * 0.6], [hx, hy - hr * 1.15], [hx + hr, hy - hr * 0.6], [hx + hr, hy - 0.3]], C.metal ?? 0xa8b0c0);
      b.rect(hx - hr, hy - 0.5, hr * 2, 1, sh(C.metal ?? 0xa8b0c0, -0.4));
      b.line(hx - hr * 0.4, hy - hr * 0.9, hx + hr * 0.4, hy - hr * 0.9, 0xffffff);
      C.plume && b.poly([[hx, hy - hr * 1.1], [hx - hr * 1.6, hy - hr * 1.6], [hx - hr, hy - hr * 0.8]], C.plume);
      break;
    case "hood":
      b.poly([[hx - hr * 1.2, hy + hr * 0.8], [hx - hr * 1.1, hy - hr * 0.6], [hx, hy - hr * 1.3], [hx + hr * 1.1, hy - hr * 0.6], [hx + hr * 0.6, hy - 0.2], [hx - hr * 0.4, hy - hr * 0.3], [hx - hr * 0.6, hy + hr]], C.hood ?? C.body);
      break;
    case "turban":
      b.ellipse(hx, hy - hr * 0.6, hr * 1.1, hr * 0.6, C.hood ?? 0xe8e0c8);
      b.px(hx + hr * 0.3, hy - hr * 0.6, C.accent ?? 0xc03030);
      break;
    case "ears":
      b.poly([[hx - hr * 0.8, hy - hr * 0.4], [hx - hr * 1.8, hy - hr * 1.2], [hx - hr * 0.2, hy - hr * 0.8]], C.skin);
      b.poly([[hx + hr * 0.8, hy - hr * 0.4], [hx + hr * 1.8, hy - hr * 1.2], [hx + hr * 0.2, hy - hr * 0.8]], C.skin);
      break;
    case "horns":
      b.poly([[hx - hr * 0.6, hy - hr * 0.6], [hx - hr * 1.5, hy - hr * 1.8], [hx - hr * 0.1, hy - hr * 0.9]], 0xe8dcc0);
      b.poly([[hx + hr * 0.6, hy - hr * 0.6], [hx + hr * 1.5, hy - hr * 1.8], [hx + hr * 0.1, hy - hr * 0.9]], 0xe8dcc0);
      break;
    case "mask":
      b.ellipse(hx + 0.5 * u, hy, hr * 0.8, hr * 0.9, C.mask ?? 0xe8d8b0);
      b.rect(hx - 0.2 * u, hy - 0.5 * u, 1.2 * u, 1 * u, 0x1a0a10);
      b.rect(hx + 1.6 * u, hy - 0.5 * u, 1.2 * u, 1 * u, 0x1a0a10);
      break;
    case "bandana":
      b.rect(hx - hr, hy - hr * 0.5, hr * 2, Math.max(1, hr * 0.4), C.accent ?? 0xc03030);
      b.poly([[hx - hr, hy - hr * 0.5], [hx - hr * 2, hy], [hx - hr * 1.6, hy + hr * 0.3]], C.accent ?? 0xc03030);
      break;
  }
  // 앞팔 + 무기
  const ax = tx + tw * 0.75, ay = shY;
  const reach = P.atk ? 5 * u : P.wind ? -2 * u : 1 * u;
  const lift = P.wind ? -4 * u : P.atk ? 0 : 2 * u;
  const hx2 = ax + reach, hy2 = ay + 3 * u + lift;
  L(b, ax, ay, hx2, hy2, Math.max(1.6, 2 * u * (C.bulk ?? 1)), sh(C.body, 0.05));
  b.rect(hx2 - 1, hy2 - 1, 2, 2, C.skin ?? 0xd8b090);
  if (C.weapon) {
    const ang = P.atk ? (C.weapon === "spear" || C.weapon === "pike" || C.weapon === "crossbow" ? 0 : 0.3) : P.wind ? -2.2 : C.weapon === "staff" || C.weapon === "banner" ? -1.45 : -0.9;
    prop(b, C.weapon, hx2, hy2, ang, u * (C.wscale ?? 1), C);
  }
}

// ── 네발 짐승 ──
function quad(b, P, w, h, C) {
  const u = h / 14;
  const by = h - 5 * u + P.b * 0.5 * u - (P.atk ? 1 * u : 0);
  const bx = w / 2 + (P.atk ? 2 * u : P.wind ? -2 * u : 0);
  const blen = w * 0.34 * (C.long ?? 1), bh = 3 * u * (C.bulk ?? 1);
  const phase = P.move ? P.m : P.atk ? 1 : 0;
  // 다리 4개
  const legs = [[-0.7, 0], [-0.4, 2], [0.45, 1], [0.75, 3]];
  legs.forEach(([fx, ph], i) => {
    const sw = Math.sin(((phase + ph) / 4) * Math.PI * 2) * 2 * u * (P.move ? 1 : 0);
    const lx = bx + fx * blen;
    L(b, lx, by, lx + sw, h - 1.5, Math.max(1.6, 1.8 * u * (C.bulk ?? 1)), i % 2 ? C.body : sh(C.body, -0.3));
    b.rect(lx + sw - 1, h - 2, 2.4, 1.6, sh(C.body, -0.5));
  });
  // 꼬리
  C.tail && L(b, bx - blen, by - bh * 0.4, bx - blen - 4 * u, by - bh * (1.2 + P.b * 0.2), 1.6, sh(C.body, -0.15));
  // 몸
  if (C.shell) {
    ball(b, bx, by - bh * 0.6, blen * 1.05, bh * 1.6, C.shell, 0.25);
    for (let i = -1; i <= 1; i++) b.ring(bx + i * blen * 0.55, by - bh * 0.9, bh * 0.55, 1, sh(C.shell, -0.35));
  } else ball(b, bx, by - bh * 0.3, blen, bh, C.body, 0.18);
  C.mane && ball(b, bx + blen * 0.6, by - bh * 0.6, blen * 0.45, bh * 1.2, C.mane, 0.2);
  // 머리
  const hx = bx + blen + 1.5 * u, hy = by - bh * (C.shell ? 0.4 : 0.8) - (P.wind ? -1 * u : 0);
  const hr = 2.6 * u * (C.headScale ?? 1);
  ball(b, hx, hy, hr * 1.1, hr, C.head ?? C.body, 0.2);
  b.poly([[hx + hr * 0.6, hy - hr * 0.2], [hx + hr * 2, hy + (P.atk ? -0.2 : 0.3) * hr], [hx + hr * 0.6, hy + hr * 0.7]], sh(C.head ?? C.body, -0.1));
  if (P.atk || P.wind) for (let i = 0; i < 3; i++) b.px(hx + hr * (0.9 + i * 0.35), hy + hr * 0.45, 0xffffff);
  C.ears && b.poly([[hx - hr * 0.3, hy - hr * 0.7], [hx - hr * 0.1, hy - hr * 1.9], [hx + hr * 0.4, hy - hr * 0.8]], sh(C.body, -0.2));
  glowEye(b, hx + hr * 0.4, hy - hr * 0.2, C.eye ?? 0xffd040);
}

// ── 점액 ──
function blob(b, P, w, h, C) {
  const e = P.wind ? 3 : P.atk ? -3 : P.move ? [2, -2, 0, 1][P.m] : P.b;
  const rx = w * 0.4 + e * 0.6, ry = h * 0.34 - e * 0.5;
  const cy = h - 1 - ry;
  b.ellipse(w / 2, h - 1.5, rx * 0.9, 1.5, sh(C.body, -0.5));
  ball(b, w / 2, cy, rx, ry, C.body, 0.3);
  b.ellipse(w / 2 - rx * 0.4, cy - ry * 0.4, rx * 0.25, ry * 0.2, 0xffffff, 170);
  b.circle(w / 2 + rx * 0.2, cy + ry * 0.3, 1.2, sh(C.body, 0.4), 160);
  eyes(b, w / 2 + rx * 0.05, cy - ry * 0.15, 0x101018, 4, 1);
  P.atk && b.rect(w / 2 + 1, cy + ry * 0.3, 3, 1, 0x101018);
}

// ── 날짐승 ──
function flyer(b, P, w, h, C) {
  const cx = w / 2, cy = h / 2 + P.b + (P.atk ? 2 : 0);
  const flap = [1, 0.3, -0.6, 0.3][P.f % 4];
  const ww = w * 0.45;
  const wingC = C.wing ?? sh(C.body, -0.2);
  for (const s of [-1, 1]) {
    const tipY = cy - flap * h * 0.4;
    if (C.insect) {
      b.ellipse(cx + s * ww * 0.35, tipY, ww * 0.32, h * 0.12, 0xe8f8ff, 150);
      b.line(cx, cy - 1, cx + s * ww * 0.62, tipY, 0xffffff);
    } else {
      b.poly([[cx, cy - 1], [cx + s * ww * 0.5, tipY - 1], [cx + s * ww, tipY + 1], [cx + s * ww * 0.7, cy + 2], [cx + s * ww * 0.4, cy + 1], [cx + s * ww * 0.2, cy + 2]], wingC);
      L(b, cx, cy - 1, cx + s * ww, tipY + 1, 1, sh(wingC, 0.3));
    }
  }
  if (C.stripes) {
    ball(b, cx - 2, cy + 1, w * 0.18, h * 0.22, C.body, 0.25);
    for (let i = -1; i <= 1; i++) b.rect(cx - 2 + i * 2, cy - h * 0.15, 1, h * 0.35, 0x1a1410);
    b.poly([[cx - w * 0.3, cy + 1], [cx - w * 0.42, cy + 2], [cx - w * 0.3, cy + 3]], 0x1a1410);
  } else ball(b, cx, cy, w * 0.16 * (C.bulk ?? 1), h * 0.26 * (C.bulk ?? 1), C.body, 0.25);
  const hx = cx + w * 0.12, hy = cy - h * 0.16;
  ball(b, hx, hy, w * 0.11, h * 0.18, C.head ?? C.body, 0.2);
  C.ears && (b.poly([[hx - 2, hy - 1], [hx - 2, hy - 4], [hx, hy - 2]], C.body), b.poly([[hx + 1, hy - 1], [hx + 2, hy - 4], [hx + 2, hy - 1]], C.body));
  C.horns && (b.poly([[hx - 1, hy - 2], [hx - 3, hy - 5], [hx, hy - 3]], 0xd8d0c0), b.poly([[hx + 1, hy - 2], [hx + 3, hy - 5], [hx + 2, hy - 2]], 0xd8d0c0));
  glowEye(b, hx + 1, hy, C.eye ?? 0xff4040);
}

// ── 떠다니는 존재 ──
function floater(b, P, w, h, C) {
  const cx = w / 2, cy = h * 0.42 + P.b * 0.8 + (P.wind ? -1 : 0);
  const t = P.f;
  switch (C.kind) {
    case "wisp": {
      for (let i = 0; i < 5; i++) b.circle(cx - i * 0.6 + Math.sin(t + i) * 0.8, cy + i * 1.6 + 2, Math.max(0.6, 3 - i * 0.55), sh(C.body, -0.1 * i), 220 - i * 30);
      b.circle(cx, cy, w * 0.34, C.body, 90);
      ball(b, cx, cy, w * 0.26, w * 0.26, C.body, 0.5);
      b.circle(cx, cy, w * 0.12, 0xffffff, 220);
      b.rect(cx + 1, cy - 1, 1, 2, sh(C.body, -0.6));
      b.rect(cx + 3, cy - 1, 1, 2, sh(C.body, -0.6));
      break;
    }
    case "ghost": {
      b.poly([[cx - w * 0.3, cy], [cx + w * 0.3, cy], [cx + w * 0.32, h - 3], [cx + w * 0.1, h - 5 + Math.sin(t) ], [cx - w * 0.1, h - 3], [cx - w * 0.32, h - 5]], C.body, 210);
      ball(b, cx, cy, w * 0.3, h * 0.24, C.body, 0.3);
      b.rect(cx, cy - 1, 2, 3, 0x101018);
      b.rect(cx + 3, cy - 1, 2, 3, 0x101018);
      break;
    }
    case "djinn": {
      for (let i = 0; i < 8; i++) b.circle(cx - i * 0.8 + Math.sin(t * 0.8 + i * 0.7) * 1.5, h * 0.55 + i * 1.3, Math.max(0.8, 3.5 - i * 0.4), sh(C.body, -0.08 * i), 230);
      b.rect(cx - w * 0.2, cy - 1, w * 0.4, h * 0.22, C.body);
      b.rect(cx - w * 0.2, cy - 1, w * 0.12, h * 0.22, sh(C.body, -0.25));
      L(b, cx + w * 0.15, cy + 1, cx + w * 0.32 + (P.atk ? 3 : 0), cy + 4 - (P.wind ? 4 : 0), 2, C.body);
      L(b, cx - w * 0.15, cy + 1, cx - w * 0.32, cy + 4, 2, sh(C.body, -0.2));
      ball(b, cx + 1, cy - h * 0.12, w * 0.17, h * 0.13, C.body, 0.25);
      b.ellipse(cx + 1, cy - h * 0.22, w * 0.2, h * 0.07, C.hood ?? 0xe8d8a0);
      glowEye(b, cx + 2, cy - h * 0.12, C.eye ?? 0xffff80);
      break;
    }
    case "hooded": {
      b.poly([[cx - w * 0.3, cy - 2], [cx + w * 0.3, cy - 2], [cx + w * 0.38, h - 2], [cx + w * 0.1, h - 4 + Math.sin(t)], [cx - w * 0.1, h - 2], [cx - w * 0.38, h - 4]], C.body);
      b.poly([[cx - w * 0.3, cy - 2], [cx - w * 0.1, cy - 2], [cx - w * 0.2, h - 3]], sh(C.body, -0.25));
      b.poly([[cx - w * 0.28, cy], [cx - w * 0.24, cy - h * 0.25], [cx + w * 0.05, cy - h * 0.34], [cx + w * 0.3, cy - h * 0.2], [cx + w * 0.28, cy + 1]], sh(C.body, -0.1));
      b.ellipse(cx + 1, cy - h * 0.12, w * 0.14, h * 0.08, 0x080410);
      glowEye(b, cx, cy - h * 0.13, C.eye ?? 0xb070ff);
      glowEye(b, cx + 3, cy - h * 0.13, C.eye ?? 0xb070ff);
      const ox = cx + w * 0.34 + (P.atk ? 2 : 0), oy = cy + 2 - (P.wind ? 3 : 0);
      b.circle(ox, oy, 2.6, C.accent ?? 0xb070ff, 110);
      b.circle(ox, oy, 1.6, C.accent ?? 0xb070ff);
      b.px(ox, oy, 0xffffff);
      break;
    }
    case "orb": {
      b.ring(cx, cy, w * 0.44, 1, C.accent ?? 0xa0b8ff, 180);
      const a = t * 0.8;
      for (let i = 0; i < 3; i++) b.px(cx + Math.cos(a + i * 2.1) * w * 0.44, cy + Math.sin(a + i * 2.1) * w * 0.2, 0xffffff);
      ball(b, cx, cy, w * 0.3, w * 0.3, C.body, 0.35);
      b.circle(cx, cy, w * 0.12, C.accent ?? 0xa0b8ff, 240);
      b.px(cx, cy, 0xffffff);
      break;
    }
    case "eye": {
      for (let i = 0; i < 4; i++) {
        const a = Math.PI * 0.6 + i * 0.4;
        for (let k = 0; k < 6; k++) b.px(cx + Math.cos(a) * (w * 0.3 + k) + Math.sin(t + k * 0.6 + i) * 1, cy + Math.sin(a) * (h * 0.3 + k), sh(C.body, -0.2));
      }
      ball(b, cx, cy, w * 0.34, h * 0.34, C.body, 0.2);
      b.circle(cx + 1, cy, w * 0.22, 0xf0e8e0);
      b.circle(cx + 2, cy, w * 0.12, C.eye ?? 0xc02060);
      b.circle(cx + 2, cy, w * 0.05, 0x000000);
      b.px(cx, cy - 2, 0xffffff);
      if (P.wind || P.atk) b.ring(cx + 2, cy, w * 0.2, 1, C.eye ?? 0xc02060);
      break;
    }
  }
}

// ── 벌레 ──
function bug(b, P, w, h, C) {
  const by = h - 4 + P.b * 0.4;
  const cx = w / 2 + (P.atk ? 2 : 0);
  const phase = P.move ? P.m : 0;
  for (let i = 0; i < 3; i++)
    for (const s of [-1, 1]) {
      const lx = cx - w * 0.15 + i * w * 0.15;
      const sw = Math.sin(((phase + i) / 4) * Math.PI * 2) * 1.5;
      L(b, lx, by - 1, lx + s * 2 + sw, h - 1, 1, sh(C.body, -0.4));
    }
  if (C.kind === "scorpion") {
    const cur = P.wind ? 1.4 : P.atk ? -0.4 : 0.8;
    let x = cx - w * 0.25, y = by - 2;
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 - cur + i * 0.55;
      const nx = x + Math.cos(a) * 3, ny = y + Math.sin(a) * 3;
      ball(b, nx, ny, 1.8, 1.6, C.body, 0.25);
      ((x = nx), (y = ny));
    }
    b.poly([[x, y], [x + 3, y + 2], [x + 1, y + 3]], 0xffe0a0);
    ball(b, cx, by - 2, w * 0.24, h * 0.2, C.body, 0.25);
    for (const s of [0, 1]) {
      const px = cx + w * 0.28 + (P.atk ? 2 : 0), py = by - 1 - s * 2;
      b.poly([[px - 2, py], [px + 3, py - 2], [px + 4, py], [px + 1, py + 1]], sh(C.body, s ? 0.1 : -0.1));
    }
    glowEye(b, cx + w * 0.2, by - 4, 0x101010);
  } else {
    ball(b, cx, by - h * 0.22, w * 0.3, h * 0.26, C.body, 0.3);
    if (C.kind === "crystal") for (let i = -1; i <= 1; i++) b.poly([[cx + i * 4 - 2, by - h * 0.3], [cx + i * 4, by - h * 0.62 - (i === 0 ? 2 : 0)], [cx + i * 4 + 2, by - h * 0.3]], C.accent ?? 0x80f0ff);
    else b.line(cx, by - h * 0.45, cx, by - 2, sh(C.body, -0.4));
    ball(b, cx + w * 0.3, by - h * 0.15, w * 0.12, h * 0.14, sh(C.body, -0.15), 0.2);
    glowEye(b, cx + w * 0.34, by - h * 0.18, C.eye ?? 0xff6040);
  }
}

// ── 지렁이 (땅에서 솟음) ──
function worm(b, P, w, h, C) {
  const cx = w / 2;
  const n = 6;
  const sway = P.atk ? 3 : P.wind ? -2 : Math.sin(P.f) * 1.2;
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const x = cx + sway * u * u, y = h - 2 - u * (h - 8);
    ball(b, x, y, w * 0.32 * (1 - u * 0.25), h / (n * 1.4), i % 2 ? C.body : sh(C.body, -0.1), 0.2);
    b.line(x - w * 0.25, y + 1, x + w * 0.25, y + 1, sh(C.body, -0.35));
  }
  const tx = cx + sway, ty = 6;
  b.ellipse(tx, ty, w * 0.3, 4, sh(C.body, -0.2));
  b.ellipse(tx, ty + (P.atk ? 0 : 1), w * 0.2, P.atk ? 3 : 1.5, 0x3a0a10);
  for (let i = -2; i <= 2; i++) b.px(tx + i * 1.5, ty - 1, 0xf0e8d0);
}

// ── 식물 ──
function plant(b, P, w, h, C) {
  const cx = w / 2;
  if (C.kind === "mushroom") {
    const sq = P.wind ? 2 : P.atk ? -2 : P.b * 0.5;
    b.rect(cx - 3, h - 7 + sq, 6, 6 - sq, 0xe8dcc0);
    b.rect(cx - 3, h - 7 + sq, 2, 6 - sq, 0xc0b498);
    ball(b, cx, h - 8 + sq, w * 0.46, h * 0.3 - sq * 0.3, C.body, 0.25);
    for (const [dx, dy] of [[-4, -2], [2, -4], [5, -1], [-1, -5]]) b.circle(cx + dx, h - 8 + sq + dy, 1.2, 0xf0e8d0);
    eyes(b, cx - 1, h - 5 + sq, 0x1a0e10, 3, 0);
    if (P.atk) for (let i = 0; i < 6; i++) b.px(cx + Math.cos(i) * 8, h - 10 + Math.sin(i) * 5, C.accent ?? 0xa0ff60);
  } else {
    const sway = P.atk ? 5 : P.wind ? -3 : Math.sin(P.f * 0.9) * 1.5;
    for (let i = 0; i < 14; i++) {
      const u = i / 13;
      const x = cx + Math.sin(u * 2.4) * sway, y = h - 1 - u * (h - 3);
      b.circle(x, y, Math.max(1, (1 - u) * w * 0.28 + 0.8), i % 3 ? C.body : sh(C.body, -0.15));
      i % 3 === 1 && b.px(x + 1, y, C.accent ?? 0xffb0c0);
    }
  }
}

// ── 구조물 ──
function construct(b, P, w, h, C) {
  const cx = w / 2;
  if (C.kind === "ballista") {
    b.rect(cx - w * 0.4, h - 4, w * 0.8, 3, 0x5a3a20);
    b.circle(cx - w * 0.3, h - 2, 2, 0x3a2414);
    b.circle(cx + w * 0.3, h - 2, 2, 0x3a2414);
    b.rect(cx - w * 0.3, h - 9, w * 0.6, 5, 0x7a5030);
    b.rect(cx - w * 0.3, h - 9, w * 0.6, 1, 0xa87a48);
    const pull = P.wind ? -3 : 0;
    L(b, cx + w * 0.1, h - 13, cx + w * 0.1, h - 3, 1.6, 0x8a6a40);
    L(b, cx + w * 0.1, h - 13, cx - w * 0.2 + pull, h - 8, 1, 0xd8d8d8);
    L(b, cx + w * 0.1, h - 3, cx - w * 0.2 + pull, h - 8, 1, 0xd8d8d8);
    !P.atk && L(b, cx - w * 0.2 + pull, h - 8, cx + w * 0.45, h - 8, 1.4, 0xb8c0cc);
  } else {
    b.rect(cx - w * 0.36, h - 4, w * 0.72, 3, sh(C.body, -0.3));
    b.poly([[cx - w * 0.3, h - 4], [cx - w * 0.18, h * 0.2], [cx, h * 0.05], [cx + w * 0.18, h * 0.2], [cx + w * 0.3, h - 4]], C.body);
    b.poly([[cx, h * 0.05], [cx + w * 0.18, h * 0.2], [cx + w * 0.3, h - 4], [cx + w * 0.05, h - 4]], sh(C.body, 0.2));
    const ey = h * 0.42 + P.b;
    b.circle(cx, ey, 2.6, C.accent ?? 0xa0b8ff, P.wind || P.atk ? 255 : 160);
    b.px(cx, ey, 0xffffff);
    for (let i = 0; i < 3; i++) b.px(cx - 4 + i * 4, h * 0.7, C.accent ?? 0xa0b8ff);
  }
}

// ── 몬스터 설정 ──
const MOB = {
  slime: [blob, { body: 0x5ad06a }],
  hound: [quad, { body: 0x8a6a4a, head: 0x9a7a58, ears: 1, tail: 1, eye: 0xffd040 }],
  goblin: [humanoid, { body: 0x6a5a3a, skin: 0x7ab050, hat: "ears", weapon: "sling", short: 1, headScale: 1.2, eye: 0x101010 }],
  sentry: [humanoid, { body: 0x6a6a7a, metal: 0xb0b8c8, armor: 1, hat: "helm", shield: 0x8a5a2a, weapon: "spear", skin: 0xd8b090 }],
  sporecap: [plant, { kind: "mushroom", body: 0xa040a0, accent: 0xb0ff60 }],
  wasp: [flyer, { body: 0xf0c030, insect: 1, stripes: 1, eye: 0xff3030 }],
  shaman: [humanoid, { body: 0x5a7a3a, robe: 1, hat: "mask", mask: 0xe8d0a0, weapon: "staff", accent: 0x90ff60, skin: 0x8a6a4a }],
  rotbear: [quad, { body: 0x5a4a38, mane: 0x6a7a40, bulk: 1.5, long: 1.1, headScale: 1.1, eye: 0xc0ff40 }],
  bat: [flyer, { body: 0x4a3a5a, ears: 1, eye: 0xff4040 }],
  crawler: [bug, { kind: "crystal", body: 0x4a4a6a, accent: 0x80f0ff }],
  worm: [worm, { body: 0xb08060 }],
  kobold: [humanoid, { body: 0x8a5a3a, skin: 0xb07040, hat: "bandana", accent: 0xd04020, weapon: "bomb", short: 1, headScale: 1.15 }],
  scorpion: [bug, { kind: "scorpion", body: 0xc08040 }],
  raider: [humanoid, { body: 0x8a6a48, skin: 0xc89870, hat: "turban", hood: 0xd8c8a0, weapon: "scimitar", cape: 0x6a3a28, accent: 0xc03030 }],
  mummy: [humanoid, { body: 0xd8ccaa, skin: 0xd8ccaa, wraps: 1, eyeGlow: 0x60ff90, weapon: null }],
  scarab: [bug, { kind: "beetle", body: 0x2a6a6a, eye: 0xffd040 }],
  djinn: [floater, { kind: "djinn", body: 0x4a8ad8, hood: 0xe8d8a0 }],
  wolf: [quad, { body: 0xb8c8d8, head: 0xc8d8e8, mane: 0xe8f0f8, ears: 1, tail: 1, eye: 0x60c0ff }],
  wisp: [floater, { kind: "wisp", body: 0x80dcff }],
  yeti: [humanoid, { body: 0xe8eef8, skin: 0xa8b8c8, bulk: 1.6, hat: "horns", eyeGlow: 0x60c0ff, headScale: 0.9 }],
  tortoise: [quad, { body: 0x6a8a9a, shell: 0x9ad0e8, bulk: 1.1, headScale: 0.9, eye: 0x101010 }],
  pikeman: [humanoid, { body: 0x8a2a2a, metal: 0xb0b8c8, armor: 1, hat: "helm", plume: 0xd04020, shield: 0x6a6a7a, weapon: "pike" }],
  xbowman: [humanoid, { body: 0x6a4a3a, metal: 0xa0a8b8, hat: "helm", weapon: "crossbow", skin: 0xd8b090 }],
  ballista: [construct, { kind: "ballista" }],
  bomber: [humanoid, { body: 0x9a3a2a, skin: 0xd8a080, hat: "bandana", accent: 0x2a2a2a, weapon: "bomb" }],
  banner: [humanoid, { body: 0x8a2a2a, metal: 0xb0b8c8, armor: 1, hat: "helm", weapon: "banner", accent: 0xd8b040 }],
  tentacle: [plant, { kind: "tentacle", body: 0x6a3a7a, accent: 0xd890e0 }],
  voideye: [floater, { kind: "eye", body: 0x4a2a5a, eye: 0xd040a0 }],
  stalker: [humanoid, { body: 0x2a2038, skin: 0x2a2038, hat: "hood", hood: 0x1a1428, eyeGlow: 0xc070ff, weapon: "dagger", cape: 0x1a1428 }],
  caller: [floater, { kind: "hooded", body: 0x3a2a5a, accent: 0xb070ff, eye: 0xd090ff }],
  soul: [floater, { kind: "ghost", body: 0xc8d8ff }],
  sentinel: [construct, { kind: "crystal", body: 0x6a78a8, accent: 0xa0d0ff }],
  phantom: [humanoid, { body: 0x5a6a9a, metal: 0x8aa0d0, armor: 1, hat: "helm", eyeGlow: 0x80c0ff, floaty: 1, weapon: "sword", cape: 0x3a4a7a }],
  orb: [floater, { kind: "orb", body: 0x5a68b8, accent: 0xa0c0ff }],
  gargoyle: [flyer, { body: 0x7a7a80, horns: 1, bulk: 1.2, eye: 0xff8040 }],
  golden: [humanoid, { body: 0xd8a830, skin: 0x7ab050, hat: "ears", short: 1, headScale: 1.2, weapon: "bomb" }],
};

// ── 보스 ──
function bossDraw(id, b, P, w, h) {
  switch (id) {
    case "golem": {
      // 돌 거인
      const C = { body: 0x8a8478, skin: 0x8a8478, bulk: 2.2, eyeGlow: 0x60f0ff, headScale: 0.8 };
      humanoid(b, P, w, h, C);
      for (let i = 0; i < 6; i++) b.px(w * 0.35 + i * 4, h * 0.5 + (i % 2) * 6, 0x60f0ff);
      for (let i = 0; i < 4; i++) b.line(w * 0.3 + i * 6, h * 0.42, w * 0.33 + i * 6, h * 0.62, 0x5a564c);
      for (let i = 0; i < 7; i++) b.ellipse(w * 0.25 + i * 6, h * 0.36 + (i % 3) * 3, 3, 2, i % 2 ? 0x6a8a4a : 0x9a948a);
      break;
    }
    case "rotlord": {
      plant(b, { ...P, f: P.f }, w, h, { kind: "tentacle", body: 0x4a5a2a, accent: 0xa0ff40 });
      humanoid(b, P, w, h * 0.92, { body: 0x5a4a30, skin: 0x6a7a3a, robe: 1, hat: "horns", eyeGlow: 0xb0ff40, weapon: "staff", accent: 0xb0ff40, bulk: 1.5 });
      break;
    }
    case "devourer": worm(b, P, w, h, { body: 0x8a6a5a }); break;
    case "executioner": humanoid(b, P, w, h, { body: 0x5a2a2a, skin: 0x2a1a1a, hat: "hood", hood: 0x1a1010, eyeGlow: 0xff4020, weapon: "axe", wscale: 1.3, bulk: 1.6, cape: 0x3a1010 }); break;
    case "frostknight": humanoid(b, P, w, h, { body: 0x6a8ab8, metal: 0xd8f0ff, armor: 1, hat: "helm", plume: 0x80e0ff, eyeGlow: 0x80e0ff, weapon: "sword", wscale: 1.4, cape: 0x3a5a9a, bulk: 1.2 }); break;
    case "warlord": humanoid(b, P, w, h, { body: 0x7a2a1a, metal: 0xc8a050, armor: 1, hat: "helm", plume: 0xff6020, shield: 0x8a3020, weapon: "axe", wscale: 1.2, bulk: 1.6, cape: 0x5a1a10 }); break;
    case "matriarch": floater(b, P, w, h, { kind: "eye", body: 0x4a2a6a, eye: 0xe040a0 }); break;
    case "king": floater(b, P, w, h, { kind: "hooded", body: 0x3a2a6a, accent: 0xffd060, eye: 0x80a0ff }); b.poly([[w * 0.42, h * 0.18], [w * 0.45, h * 0.1], [w * 0.5, h * 0.16], [w * 0.55, h * 0.08], [w * 0.6, h * 0.16], [w * 0.64, h * 0.1], [w * 0.66, h * 0.2]], 0xffd060); break;
    case "warden": humanoid(b, P, w, h, { body: 0x2a2440, metal: 0x6a5a9a, armor: 1, hat: "helm", eyeGlow: 0xc070ff, weapon: "pike", wscale: 1.2, bulk: 1.5, cape: 0x1a1430, shield: 0x3a3060 }); break;
    default: humanoid(b, P, w, h, { body: 0x6a6a7a });
  }
}

// 입체 음영: 윗면 빛, 아래쪽·안쪽 테두리 그림자, 위→아래 명암, 질감 잡음
function volumize(b, strong) {
  const w = b.w, h = b.h, src = b.buf.slice();
  const A = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : src[y * w + x] >>> 24);
  const mul = (p, f) => {
    const r = p & 255, g = (p >> 8) & 255, bl = (p >> 16) & 255;
    const k = (v) => Math.max(0, Math.min(255, Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f))));
    return ((p & 0xff000000) | (k(bl) << 16) | (k(g) << 8) | k(r)) >>> 0;
  };
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const p = src[y * w + x];
      if (p >>> 24 < 200) continue;
      let f = (0.5 - y / h) * (strong ? 0.18 : 0.1);
      if (!A(x, y - 1) || !A(x - 1, y)) f += 0.22;
      else if (!A(x + 1, y + 1) || !A(x, y + 1)) f -= 0.28;
      else if (strong && (!A(x + 2, y + 2) || !A(x, y + 2))) f -= 0.12;
      else if (strong && (!A(x - 2, y - 2))) f += 0.08;
      if (strong) f += ((((x * 73856093) ^ (y * 19349663)) >>> 0) % 7 - 3) * 0.012;
      b.buf[y * w + x] = mul(p, f);
    }
}
// 어둡고 거친 색감: 밝게 빛나는 부분(눈·마력)은 그대로 둔다
function grit(b, dark = 0.2, desat = 0.25) {
  const n = b.buf.length;
  for (let i = 0; i < n; i++) {
    const p = b.buf[i];
    if (p >>> 24 < 10) continue;
    const r = p & 255, g = (p >> 8) & 255, bl = (p >> 16) & 255;
    const lum = (r * 0.3 + g * 0.59 + bl * 0.11) / 255;
    const sat = Math.max(r, g, bl) - Math.min(r, g, bl);
    if (lum > 0.82 || (sat > 150 && lum > 0.55)) continue;
    const gray = lum * 255;
    const k = 1 - dark * (1 - lum * 0.4);
    const f = (v) => Math.max(0, Math.min(255, Math.round((v + (gray - v) * desat) * k)));
    b.buf[i] = ((p & 0xff000000) | (f(bl) << 16) | (f(g) << 8) | f(r)) >>> 0;
  }
}
// ── 생성 ──
export function makeMobs(scene, ht, Et, Os, Mi, sizeOf, tint) {
  for (const d of Os) {
    const base = d.sprite ?? d.id;
    const M = MOB[base];
    if (!M) continue;
    const [w, h] = sizeOf("e", base);
    if (!w) continue;
    const frames = [];
    for (let f = 0; f < 9; f++) {
      const b = new ht(w, h);
      try {
        M[0](b, mobPose(f), w, h, M[1]);
      } catch (e) {}
      volumize(b, !0);
      b.outline(OUT);
      b.rimLight(0xd8e0ff, 0.22);
      frames.push(b);
    }
    d.sprite && tint(frames, d.tint, d.amt);
    Et(scene, `e_${d.id}`, frames, w, h);
  }
  for (const d of Mi) {
    const base = d.sprite ?? d.id;
    const [w, h] = sizeOf("b", base);
    if (!w) continue;
    const frames = [];
    for (let f = 0; f < 8; f++) {
      const b = new ht(w, h);
      try {
        bossDraw(base, b, bossPose(f), w, h);
      } catch (e) {}
      volumize(b, !0);
      b.outline(OUT);
      b.outline(sh(OUT, 0.15));
      b.rimLight(0xfff4e0, 0.18);
      frames.push(b);
    }
    d.sprite && tint(frames, d.tint, d.amt);
    Et(scene, `b_${d.id}`, frames, w, h);
  }
}
