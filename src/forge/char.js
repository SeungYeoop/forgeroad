// 플레이어 캐릭터 리메이크: 32x32 프레임 24장. 원본 포즈 데이터(As)를 그대로 쓰고 그림만 새로 그린다.
const sh = (c, f) => {
  const g = (s) => {
    const v = (c >> s) & 255;
    return Math.max(0, Math.min(255, Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f))));
  };
  return (g(16) << 16) | (g(8) << 8) | g(0);
};
const SKIN = 0xdcb090, SKIN_D = 0xa87a62, HAIR = 0x1a1220, HAIR_H = 0x3c2e4a, EYE = 0x0a0610, OUT = 0x07040a;
const HAND = {
  down: [1, 7], low: [3, 6], fwd: [6, 2], back: [-4, 5], up: [2, -6], reach: [7, -1], cast: [7, -3],
};

function leg(b, hx, hy, fx, fy, pants, boot) {
  b.thickLine(hx, hy, fx, fy - 2, 3, pants);
  b.line(hx + 1, hy, fx + 1, fy - 2, sh(pants, 0.15));
  b.rect(fx - 1, fy - 2, 4, 3, boot);
  b.rect(fx + 2, fy - 1, 1, 2, boot);
  b.rect(fx - 1, fy - 2, 4, 1, sh(boot, 0.3));
}
function arm(b, sx, sy, pose, sleeve, back) {
  const [dx, dy] = HAND[pose] ?? HAND.down;
  const hx = sx + dx, hy = sy + dy;
  const c = back ? sh(sleeve, -0.3) : sleeve;
  b.thickLine(sx, sy, (sx + hx) / 2, (sy + hy) / 2, 3, c);
  b.thickLine((sx + hx) / 2, (sy + hy) / 2, hx, hy, 2.4, back ? sh(c, -0.05) : sh(c, 0.06));
  b.rect(hx - 1, hy - 1, 2, 2, back ? SKIN_D : SKIN);
}
function scarf(b, x, y, wave, col) {
  // 어깨에서 흘러내리는 해진 망토
  const L = 13 + (5 - Math.min(5, wave)) * 0.6;
  for (let k = 0; k < 4; k++) {
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const u = i / 8;
      pts.push([x - 1 - k * 1.6 - u * (4 + wave * 1.3), y + u * L * (1 - k * 0.06) + Math.sin(u * 5 + wave + k) * 1.2]);
    }
    const c = k === 0 ? sh(col, 0.12) : k === 3 ? sh(col, -0.35) : k % 2 ? sh(col, -0.12) : col;
    for (let i = 0; i < pts.length - 1; i++) b.thickLine(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 2.6 - i * 0.12, c);
    const e = pts[pts.length - 1];
    b.px(e[0], e[1] + 1, sh(col, -0.45));
  }
  b.line(x - 1, y, x - 4 - wave, y + L * 0.7, sh(col, 0.3));
}
function head(b, cx, cy, L, id) {
  // 뒷머리
  b.poly([[cx - 6, cy - 3], [cx - 1, cy - 6], [cx + 4, cy - 5], [cx + 2, cy + 3], [cx - 6, cy + 5], [cx - 8, cy + 2]], HAIR);
  // 얼굴
  b.ellipse(cx + 1, cy + 1, 5.2, 4.8, SKIN);
  b.rect(cx - 2, cy + 3, 6, 2, SKIN);
  b.px(cx - 2, cy + 4, SKIN_D);
  // 눈: 가늘고 날카롭게, 눈썹 그늘
  b.rect(cx - 1, cy - 1, 7, 1, sh(SKIN_D, -0.25));
  b.rect(cx + 1, cy + 1, 2, 1, EYE);
  b.rect(cx + 4, cy + 1, 1, 1, EYE);
  b.px(cx + 2, cy + 1, 0xe8f0ff);
  b.px(cx + 1, cy + 2, sh(SKIN_D, -0.1));
  b.rect(cx - 3, cy + 2, 2, 3, SKIN_D);
  b.px(cx + 3, cy + 4, sh(SKIN_D, -0.2));
  // 앞머리
  b.poly([[cx - 4, cy - 2], [cx - 2, cy - 6], [cx + 3, cy - 6], [cx + 6, cy - 3], [cx + 6, cy - 1], [cx + 4, cy - 2], [cx + 3, cy], [cx + 1, cy - 2], [cx - 1, cy - 1]], HAIR);
  b.line(cx - 1, cy - 5, cx + 3, cy - 5, HAIR_H);
  b.px(cx + 4, cy - 4, HAIR_H);
  const helm = L.helm;
  if (helm === "hood") {
    b.poly([[cx - 7, cy + 4], [cx - 6, cy - 4], [cx - 1, cy - 8], [cx + 4, cy - 7], [cx + 7, cy - 3], [cx + 6, cy - 1], [cx + 3, cy - 4], [cx - 2, cy - 3], [cx - 3, cy + 5]], L.body);
    b.line(cx - 1, cy - 7, cx + 4, cy - 6, sh(L.body, 0.25));
  } else if (helm === "helm" || helm === "helmet" || id === "steel" || id === "guardian") {
    b.poly([[cx - 6, cy - 1], [cx - 5, cy - 6], [cx, cy - 8], [cx + 5, cy - 6], [cx + 6, cy - 2], [cx - 6, cy - 1]], sh(L.body, 0.1));
    b.rect(cx - 6, cy - 2, 13, 2, L.trim);
    b.line(cx - 3, cy - 7, cx + 3, cy - 7, sh(L.body, 0.5));
    id === "guardian" && b.poly([[cx, cy - 8], [cx - 2, cy - 12], [cx + 3, cy - 10]], 0xd04030);
  } else if (helm === "bandana") {
    b.rect(cx - 5, cy - 3, 11, 2, L.trim);
    b.poly([[cx - 6, cy - 3], [cx - 10, cy - 1], [cx - 8, cy + 1]], L.trim);
  } else if (helm === "horns" || id === "berserker") {
    b.poly([[cx - 4, cy - 5], [cx - 7, cy - 10], [cx - 3, cy - 6]], 0xe8dcc0);
    b.poly([[cx + 4, cy - 5], [cx + 7, cy - 10], [cx + 3, cy - 6]], 0xe8dcc0);
  }
  if (id === "abyss") (b.px(cx + 1, cy + 1, L.glow ?? 0xb070ff), b.px(cx + 4, cy + 1, L.glow ?? 0xb070ff));
}
function torso(b, x, y, h, L, id) {
  const c = L.body;
  b.rect(x, y, 9, h, c);
  b.rect(x, y, 2, h, sh(c, -0.22));
  b.rect(x + 7, y, 2, h, sh(c, 0.14));
  b.rect(x + 1, y, 7, 1, sh(c, 0.25));
  b.rect(x, y + h - 3, 9, 2, L.trim);
  b.px(x + 5, y + h - 3, 0xf0d070);
  b.px(x + 5, y + h - 2, 0xa07020);
  switch (id) {
    case "chain":
      for (let yy = 1; yy < h - 3; yy++) for (let xx = yy % 2; xx < 9; xx += 2) b.px(x + xx, y + yy, sh(c, -0.18));
      break;
    case "steel":
    case "guardian":
      b.rect(x + 3, y + 1, 3, h - 5, sh(c, 0.3));
      b.ellipse(x + 1, y + 1, 3, 2, sh(c, 0.15));
      b.ellipse(x + 8, y + 1, 3, 2, sh(c, 0.35));
      break;
    case "leather":
      b.line(x + 1, y, x + 7, y + h - 4, sh(c, -0.4));
      b.px(x + 4, y + 3, 0xd0b080);
      break;
    case "mage":
      b.rect(x + 4, y, 1, h, L.trim);
      b.circle(x + 4.5, y + 3, 1.2, L.glow ?? 0x90c0ff);
      break;
    case "thorns":
      for (const [dx, dy] of [[1, 0], [8, 0], [0, 3]]) b.poly([[x + dx, y + dy], [x + dx - 2, y + dy - 2], [x + dx + 1, y + dy - 1]], 0xd8c8a0);
      break;
    case "vampire":
      b.poly([[x - 1, y - 2], [x + 2, y + 2], [x + 2, y - 1]], sh(c, -0.3));
      b.poly([[x + 10, y - 2], [x + 7, y + 2], [x + 7, y - 1]], sh(c, -0.3));
      b.rect(x + 3, y, 3, 3, 0xe8d8e0);
      break;
    case "berserker":
      b.ellipse(x + 1, y + 1, 3.5, 2.5, 0x8a6a4a);
      b.ellipse(x + 8, y + 1, 3.5, 2.5, 0xa88060);
      b.line(x + 2, y + 3, x + 6, y + 6, 0x3a2010);
      break;
    case "abyss":
      b.rect(x + 3, y + 2, 3, 3, L.glow ?? 0xb070ff);
      b.px(x + 4, y + 3, 0xffffff);
      break;
    case "cloth":
      b.rect(x + 3, y, 3, 2, L.trim);
      break;
  }
  if (L.skirt || id === "mage") {
    b.poly([[x - 1, y + h - 1], [x + 10, y + h - 1], [x + 11, y + h + 4], [x - 2, y + h + 4]], sh(c, -0.12));
    b.line(x - 2, y + h + 4, x + 11, y + h + 4, L.trim);
  }
}

function frame(b, P, L, id) {
  if (P.lying) {
    const y = 27;
    L.cape !== void 0 && b.rect(8, y, 12, 2, L.cape ?? 0xc83a2a);
    b.rect(10, y - 4, 10, 5, L.body);
    b.rect(10, y, 10, 1, L.trim);
    b.rect(20, y - 3, 5, 4, L.dark);
    b.ellipse(7, y - 2, 4, 3.5, SKIN);
    b.poly([[3, y - 5], [9, y - 6], [8, y - 1], [3, y]], HAIR);
    if (P.lying === 2) for (let i = 0; i < b.buf.length; i++) {
      const r = b.buf[i];
      if (r >>> 24) {
        const k = 0.72;
        b.buf[i] = ((255 << 24) | (Math.round(((r >> 16) & 255) * k) << 16) | (Math.round(((r >> 8) & 255) * k) << 8) | Math.round((r & 255) * k)) >>> 0;
      }
    }
    return;
  }
  const dy = P.dy, sq = P.squash ?? 0;
  const tx = 12 + P.lean;
  const hipY = 23 + dy;
  const pants = L.dark ?? 0x2a2a3a, boot = sh(pants, -0.35);
  const scarfC = L.cape ?? 0x7a1a1e;
  // 뒤쪽: 목도리, 뒷팔, 뒷다리
  scarf(b, tx + 2, 15 + dy, P.cape ?? 0, scarfC);
  arm(b, tx + 1, 16 + dy, P.barm, L.body, !0);
  leg(b, tx + 2, hipY, 13 + P.bl[0], 31 - P.bl[1], sh(pants, -0.2), sh(boot, -0.2));
  // 몸
  torso(b, tx, 15 + dy + sq, 9 - sq, L, id);
  // 앞다리
  leg(b, tx + 6, hipY, 17 + P.fl[0], 31 - P.fl[1], pants, boot);
  // 목도리 앞부분
  b.rect(tx + 1, 14 + dy, 8, 2, scarfC);
  b.rect(tx + 1, 14 + dy, 8, 1, sh(scarfC, 0.25));
  // 머리
  head(b, tx + 4, 9 + dy + sq, L, id);
  // 앞팔 + 어깨 갑옷
  arm(b, tx + 7, 16 + dy, P.arm, L.body, !1);
  b.ellipse(tx + 7, 15.5 + dy, 2.6, 2, sh(L.trim ?? 0x6a5a4a, -0.1));
  b.line(tx + 5, 14 + dy, tx + 9, 14 + dy, sh(L.trim ?? 0x6a5a4a, 0.35));
}

export function makePlayer(scene, ht, Et, As, le) {
  for (const A of le) {
    const L = { ...A.look };
    L.dark = sh(L.dark ?? 0x2a2a3a, -0.25);
    L.body = sh(L.body, -0.2);
    L.trim = sh(L.trim ?? 0x6a5a4a, -0.1);
    L.cape = sh(L.cape ?? 0x8a1e22, -0.15);
    const frames = [];
    for (let i = 0; i < As.length; i++) {
      const b = new ht(32, 32);
      frame(b, As[i], L, A.id);
      b.outline(OUT);
      b.rimLight(0xc8d8ff, 0.32);
      frames.push(b);
    }
    Et(scene, `player_${A.id}`, frames, 32, 32);
  }
}

export function makeNpc(scene, ht, Et, As, key, look) {
  const L = { dark: 0x2a2a3a, ...look };
  const frames = [];
  for (let i = 0; i < 4; i++) {
    const b = new ht(32, 32);
    frame(b, As[i], L, "npc");
    b.outline(OUT);
    b.rimLight(0xfff0d8, 0.18);
    frames.push(b);
  }
  Et(scene, key, frames, 32, 32);
}
