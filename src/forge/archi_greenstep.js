// ══════════════════════════════════════════════════════════════
// 그린스텝 「떠 있는 고원」 — 3×3 구역, 덩어리마다 속을 여러 층으로 채운다
//   지도 = 칸(8px) 1024 × 1056 · 기초 땅 길 줄 1000 (좌우 출구) · ▲ 출구 = 정상 종 사원 꼭대기 x 544
//   위 절반: 속이 빈 떠 있는 섬 (섬마다 1~4층 방 · 칸막이 · 기둥 · 다락 · 층 사이 계단/사다리/밧줄/덩굴)
//   아래 절반: 고원 몸통 (윗면 = 마을 언덕 · 가운데 산 · 동쪽 들) 속에
//     3가 벼랑 마을 굴 6층 (나무 집·물레·양 우리, 층 사이 사다리·밧줄·폭포·바람 굴뚝·비탈 굴)
//     3나 물에 잠긴 지하 묘지 6층 (무덤방·물길) + 위 산속 굴 3단
//     3다 수도원 탑 건물 (층마다 방 · 기둥 회랑 · 계단 · 승강기 통로 둘)
//   맨 밑 기초 땅 길이 세 구역을 꿰뚫는다 (장터 · 묘지 문 · 수도원 1층)
// ══════════════════════════════════════════════════════════════

// ── 고정 씨앗 난수 (지도 모양이 시드마다 같도록) ──
let R = Math.random;
const mk = (seed) => {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const RI = (a, b) => a + Math.floor(R() * (b - a + 1));
const RP = (arr) => arr[Math.floor(R() * arr.length)];
const N1 = (v, s) => Math.sin(v * 0.21 + s) * 0.6 + Math.sin(v * 0.067 + s * 1.7) * 1.0 + Math.sin(v * 0.43 + s * 0.3) * 0.35;

// ── 기본 조각 ──
function mesa(K, o) {
  const { x0, x1, top, body, belly } = o, s = o.seed ?? 1, jit = o.jit ?? 1.2, lip = o.lip ?? 1;
  for (let y = top; y < body; y++) {
    const ov = y - top < 2 ? lip : 0;
    K.rock(Math.round(x0 + N1(y, s) * jit) - ov, y, Math.round(x1 + N1(y, s + 5) * jit) + ov, y + 1);
  }
  const w = x1 - x0;
  for (let y = body; y < belly; y++) {
    const u = (y - body) / Math.max(1, belly - body);
    const a = Math.round(u * u * w * 0.47 + (N1(y * 1.7, s + 9) + 1.8) * 2.2 * u);
    const b = Math.round(u * u * w * 0.47 + (N1(y * 1.7, s + 13) + 1.8) * 2.2 * u);
    x0 + a < x1 - b && K.rock(x0 + a, y, x1 - b, y + 1);
  }
}
function hall(K, x0, x1, f, h, m = "brick") {
  K.air(x0, f - h, x1, f);
  K.wall(x0, f - h, x1, f, m);
  K.mat(x0 - 2, f - h - 2, x1 + 2, f + 2, m);
}
function cave(K, x0, x1, f, h, m = "rock") {
  K.air(x0, f - h, x1, f);
  K.wall(x0, f - h, x1, f, m);
}
function ncave(K, x0, x1, f, h, s = 1, e = 9, m = "rock") {
  const w = x1 - x0;
  for (let x = x0; x < x1; x++) {
    const c = Math.sin((Math.PI * (x - x0 + 0.5)) / w);
    K.air(x, f - Math.max(e, Math.round(e + (h - e) * Math.pow(c, 0.7) + N1(x * 1.3, s) * 1.1)), x + 1, f);
  }
  K.wall(x0, f - h - 2, x1, f, m);
}
function shaft(K, x0, x1, y0, y1, m = "rock") {
  K.air(x0, y0, x1, y1);
  K.wall(x0, y0, x1, y1, m);
}
function partition(K, x0, x1, f, h, m = "brick") {
  K.rock(x0, f - h, x1, f - 8);
  K.mat(x0, f - h, x1, f - 8, m);
}
function stair(K, xa, fa, xb, fb, h = 8, m = "brick") {
  K.ramp(xa, fa, xb, fb, h);
  const n = Math.abs(xb - xa), dir = Math.sign(xb - xa) || 1;
  for (let i = 0; i <= n; i += 2) {
    const x = xa + i * dir, f = Math.round(fa + ((fb - fa) * i) / Math.max(1, n));
    K.wall(x - 1, f - h, x + 2, f, m);
    K.mat(x - 1, f - h - 2, x + 2, f + 2, m);
  }
}
// 방 안 걸린 계단 (낮은 끝은 바닥보다 6줄 위 → 계단 밑으로 바닥이 이어진다)
function steps(K, xa, fa, xb, fb, h = 5, m = "brick") {
  stair(K, xa, fa, xb, fb, h, m);
  K.stairway(xa, fa, xb, fb, 2, m);
}
function hatch(K, x, fu, fd, k = "ladder", m = "rock") {
  K.air(x - 1, fu, x + 2, fd);
  K.wall(x - 1, fu, x + 2, fd, m);
  K.plank(x - 1, x + 2, fu);
  K.ladder(x, fu, fd, k);
}
function hut(K, x0, x1, f, h = 14, m = "wood") {
  const top = f - h;
  K.rock(x0, top, x0 + 1, f - 7), K.rock(x1 - 1, top, x1, f - 7);
  for (let k = 0; k < 4; k++) K.rock(x0 - 3 + k * 2, top - 1 - k, x1 + 3 - k * 2, top - k);
  K.mat(x0 - 3, top - 4, x1 + 3, f, m);
  K.wall(x0 + 1, top, x1 - 1, f, m);
}
function ledge(K, x0, x1, f, t = 3, m) {
  K.rock(x0, f, x1, f + t);
  m && K.mat(x0, f, x1, f + t, m);
}

// ── 주제 (재질 · 소품 · 층 잇는 장치) ──
const TH = {
  rock: { m: "rock", wall: "rock", natural: true, props: ["p_bones", "p_boulder", "p_rubble", "p_nest", "p_cairn", "p_urn"], links: ["vine", "rope", "ladder", "stair"] },
  wood: { m: "wood", wall: "wood", props: ["p_crates", "p_hay", "p_wool", "p_loom", "p_shelf", "p_cheese", "p_urn", "p_sheep"], links: ["ladder", "rope", "stair", "ladder"] },
  brick: { m: "brick", wall: "brick", props: ["p_shelf", "p_lectern", "p_candles", "p_urn", "p_statue", "p_crates", "p_rack"], links: ["stair", "ladder", "rope", "stair"] },
  temple: { m: "brick", wall: "brick", props: ["p_candles", "p_statue", "p_altar", "p_lectern", "p_bell", "p_urn", "p_shelf"], links: ["stair", "stair", "ladder", "rope"] },
  tomb: { m: "brick", wall: "brick", props: ["p_sarcoph", "p_skulls", "p_bones", "p_candles", "p_urn"], links: ["ladder", "stair", "rope"] },
};

// ── 여러 층 속 짜기: 층마다 방 나누기 · 방 꾸밈 (기둥·다락) · 층 사이 잇기 (계단·사다리·밧줄·덩굴) ──
function floors(K, o) {
  const T = o.th, rooms = [], parts = [], used = [], linkFl = new Map();
  o.fl.forEach((f, i) => {
    const h = o.hs[i];
    if (T.natural) ncave(K, o.x0, o.x1, f, h, RI(1, 999), Math.max(9, h - 6), T.wall);
    else hall(K, o.x0, o.x1, f, h, T.m);
    const w = o.x1 - o.x0, rw = o.roomW ?? [20, 34], n = Math.max(1, Math.round(w / RI(rw[0], rw[1])));
    const kept = [];
    for (let k = 1; k < n; k++) {
      const x = Math.round(o.x0 + (w * k) / n + RI(-3, 3));
      if (T.natural && R() < 0.55) continue;
      if (!T.natural && h >= 15 && R() < (o.arcade ?? 0.3)) {
        for (let c = x - 3; c <= x + 3; c += 3) K.wall(c, f - h, c + 1, f, "stem");
        continue;
      }
      partition(K, x, x + 2, f, h, T.m);
      kept.push(x);
    }
    parts.push(kept);
    const bs = [o.x0];
    for (const x of kept) bs.push(x, x + 2);
    bs.push(o.x1);
    for (let k = 0; k + 1 < bs.length; k += 2) rooms.push({ x0: bs[k], x1: bs[k + 1], f, h, i });
  });
  for (const r of rooms) {
    const w = r.x1 - r.x0;
    if (!T.natural && w >= 18 && r.h >= 14 && R() < (o.cols ?? 0.35)) for (let c = r.x0 + 5; c < r.x1 - 4; c += RI(6, 9)) K.wall(c, r.f - r.h, c + 2, r.f, "stem");
    if (r.h >= 28 && w >= 30) {
      // 두 층 높이 큰 홀: 양쪽 회랑 + 사다리
      const pw = Math.round(w * 0.28), py = r.f - Math.round(r.h * 0.5);
      K.plank(r.x0, r.x0 + pw, py), K.ladder(r.x0 + pw + 1, py, r.f, "ladder");
      K.plank(r.x1 - pw, r.x1, py), K.ladder(r.x1 - pw - 2, py, r.f, "ladder");
      r.mez = { a: r.x0 - 3, b: r.x1 + 3, py };
    } else if (r.h >= 17 && w >= 20 && R() < 0.45) {
      const left = R() < 0.5, pw = Math.round(w * (0.38 + R() * 0.2)), py = r.f - Math.round(r.h * 0.52);
      const a = left ? r.x0 : r.x1 - pw, b = left ? r.x0 + pw : r.x1;
      K.plank(a, b, py);
      K.ladder(left ? b + 1 : a - 2, py, r.f, T.natural ? "vine" : "ladder");
      r.mez = { a: a - 3, b: b + 3, py };
    }
    const np = Math.max(1, Math.round(w / 13));
    for (let k = 0; k < np; k++) K.prop(Math.round(r.x0 + 3 + ((k + 0.5) * (w - 6)) / np), r.f, RP(T.props), { v: RI(0, 3) });
  }
  const nearPart = (x, i, d) => (parts[i] ?? []).some((p) => Math.abs(p - x) < d);
  const inMez = (x0, x1, i) => rooms.some((r) => r.mez && r.i === i && r.mez.b >= x0 && r.mez.a <= x1);
  for (let i = 0; i + 1 < o.fl.length; i++) {
    const fu = o.fl[i], fd = o.fl[i + 1], hd = o.hs[i + 1];
    const want = o.x1 - o.x0 > 70 ? 2 : 1;
    for (let t = 0, made = 0; t < 60 && made < want; t++) {
      const x = RI(o.x0 + 4, o.x1 - 5);
      if (nearPart(x, i, 5) || nearPart(x, i + 1, 5) || used.some((u) => Math.abs(u - x) < 9) || inMez(x - 3, x + 3, i) || inMez(x - 3, x + 3, i + 1)) continue;
      const kind = RP(T.links);
      if (kind === "stair") {
        const dy = fd - 6 - fu, dir = R() < 0.5 ? 1 : -1, xe = x + dir * dy;
        const lo = Math.min(x, xe) - 3, hi = Math.max(x, xe) + 3;
        if (hd < 14 || lo < o.x0 + 1 || hi > o.x1 - 1) continue;
        if ([...parts[i], ...parts[i + 1]].some((p) => p >= lo - 2 && p <= hi + 2) || inMez(lo, hi, i) || inMez(lo, hi, i + 1) || used.some((u) => u >= lo - 6 && u <= hi + 6)) continue;
        steps(K, x, fd - 6, xe, fu, 5, T.m);
        used.push(x, xe, (x + xe) >> 1), linkFl.set(x, i);
      } else if (kind === "ladder") {
        hatch(K, x, fu, fd, "ladder", T.wall);
        used.push(x), linkFl.set(x, i);
      } else {
        shaft(K, x - 1, x + 2, fu, fd, T.wall);
        kind === "rope" ? K.rope(x, fu - 3, fd) : K.vine(x - 1, x + 2, fu - 3, fd);
        used.push(x), linkFl.set(x, i);
      }
      made++;
    }
    // 하나도 못 이었으면 칸막이만 피해 사다리 하나는 꼭 둔다
    if (!used.some((u) => u >= o.x0 && u <= o.x1 && linkFl.get(u) === i)) {
      for (let t = 0; t < 200; t++) {
        const x = RI(o.x0 + 3, o.x1 - 4);
        if (nearPart(x, i, 4) || nearPart(x, i + 1, 4)) continue;
        hatch(K, x, fu, fd, "ladder", T.wall);
        break;
      }
    }
  }
  return { rooms, parts, used };
}
// 방에 역할 주기 (보물 n · 나머지 일부 전투)
function assign(K, rooms, o = {}) {
  const rs = rooms.filter((r) => r.x1 - r.x0 >= 10).sort(() => R() - 0.5);
  let t = o.treasure ?? 1;
  for (const r of rs) {
    if (o.rest) {
      K.tag(r.x0, r.f - r.h, r.x1, r.f, "rest");
      continue;
    }
    if (t > 0) {
      K.tag(r.x0, r.f - r.h, r.x1, r.f, "treasure", o.tex);
      t--;
    } else if (R() < (o.arena ?? 0.5)) K.tag(r.x0, r.f - r.h, r.x1, r.f, "arena");
  }
}

// ── 윗면 꾸밈: 망루 (속에 방, 양쪽 문, 지붕 성가퀴 · 뚜껑 사다리) · 작은 언덕 ──
function turret(K, x0, x1, top, h, m) {
  K.rock(x0, top - h, x1, top);
  K.mat(x0, top - h - 3, x1, top, m);
  for (let c = x0; c < x1; c += 4) K.rock(c, top - h - 3, Math.min(x1, c + 2), top - h);
  hall(K, x0 + 2, x1 - 2, top, h - 3, m);
  cave(K, x0, x0 + 2, top, 8, m), cave(K, x1 - 2, x1, top, 8, m);
  hatch(K, x0 + ((x1 - x0) >> 1), top - h, top, "ladder", m);
}
function mound(K, x0, x1, top) {
  const c = (x0 + x1) / 2, hw = (x1 - x0) / 2, H = Math.min(7, Math.floor(hw * 0.4));
  for (let x = x0; x < x1; x++) {
    const h = Math.round(H * (1 - ((x + 0.5 - c) / hw) ** 2));
    h > 0 && K.rock(x, top - h, x + 1, top);
  }
}
// ── 속이 빈 떠 있는 섬: 모양 bowl 그릇 · tower 탑 (좁고 높고 배 짧음) · slab 납작 (배 짧음) · keel 깊은 배 ──
//   층 n (방·칸막이·기둥·다락·계단) · 배 속 동굴 (덩굴 구멍으로 아래층과 잇는다) · 윗면 망루/오두막/언덕
function isle(K, o) {
  const T = TH[o.th], nF = o.nF, st = o.style ?? "bowl", w = o.x1 - o.x0;
  const hs = Array.from({ length: nF }, () => RI(o.hmin ?? 13, o.hmax ?? 19));
  const fl = [];
  let y = o.top + 3;
  for (const h of hs) ((y += h), fl.push(y), (y += 3));
  const body = fl[nF - 1] + 3;
  const bd = o.belly ?? Math.round(w * (st === "keel" ? 0.62 : st === "tower" ? 0.22 : st === "slab" ? 0.16 : 0.38));
  const belly = body + bd;
  mesa(K, { x0: o.x0, x1: o.x1, top: o.top, body, belly, seed: RI(1, 999), jit: st === "tower" ? 1 : 0.7, lip: 1 });
  T.natural || K.mat(o.x0 - 1, o.top + 2, o.x1 + 1, body, T.m);
  const ix0 = o.x0 + 3, ix1 = o.x1 - 3;
  const F = floors(K, { x0: ix0, x1: ix1, fl, hs, th: T });
  if (!T.natural) fl.forEach((f, i) => R() < 0.7 && hs[i] >= 13 && (K.air(o.x0 - 2, f - hs[i] + 3, ix0, f - hs[i] + 6), K.air(ix1, f - hs[i] + 3, o.x1 + 2, f - hs[i] + 6)));
  // 배 속 동굴
  if ((st === "keel" || st === "bowl") && bd >= 22) {
    let prevF = fl[nF - 1], prevBy = body;
    const n = st === "keel" ? 2 : 1;
    for (let k = 0; k < n; k++) {
      const by = body + Math.round(bd * (k === 0 ? (n === 1 ? 0.5 : 0.42) : 0.74));
      const u = (by - body) / bd, shrink = Math.round(u * u * w * 0.47 + 6);
      const bx0 = o.x0 + shrink + 3, bx1 = o.x1 - shrink - 3, ch = Math.min(15, by - prevBy - 3);
      if (bx1 - bx0 < 14 || ch < 8) break;
      ncave(K, bx0, bx1, by, ch, RI(1, 999), Math.max(7, ch - 6), "rock");
      const lx = RI(bx0 + 3, bx1 - 4);
      shaft(K, lx - 1, lx + 2, prevF, by, "rock"), K.vine(lx - 1, lx + 2, prevF - 3, by);
      K.prop(Math.round((bx0 + bx1) / 2) + RI(-4, 4), by, RP(["p_bones", "p_nest", "p_urn", "p_rubble"]));
      bx1 - bx0 >= 16 && K.tag(bx0, by - ch, bx1, by, k === n - 1 && st === "keel" ? "treasure" : "arena");
      (prevF = by), (prevBy = by);
    }
  }
  // 윗면 → 1층 뚜껑 (꾸밈보다 먼저 자리를 잡는다)
  let hx = null;
  for (let t = 0; t < 120 && hx == null; t++) {
    const x = RI(ix0 + 4, ix1 - 5);
    if (F.parts[0].some((q) => Math.abs(q - x) < 5) || F.used.some((u) => Math.abs(u - x) < 6) || F.rooms.some((r) => r.mez && r.i === 0 && x >= r.mez.a && x <= r.mez.b)) continue;
    if ([...(o.keep ?? []), ...(o.avoid ?? [])].some((k) => Math.abs(k - x) < 6)) continue;
    hx = x;
  }
  hx ??= Math.round((ix0 + ix1) / 2);
  hatch(K, hx, o.top, fl[0], T.natural ? "vine" : "ladder", T.wall);
  // 윗면 꾸밈
  const keep = [...(o.keep ?? []), ...(o.avoid ?? []), hx], placed = [];
  const free = (a, b2) => !keep.some((k) => k >= a - 6 && k <= b2 + 6) && !placed.some((q) => a < q[1] + 5 && b2 > q[0] - 5);
  for (const t of o.tops ?? []) {
    for (let tr = 0; tr < 60; tr++) {
      const tw = t.w ?? RI(14, 22), x = RI(o.x0 + 5, o.x1 - 5 - tw);
      if (!free(x, x + tw)) continue;
      const m = T.m === "rock" ? (t.k === "hut" ? "wood" : "brick") : T.m;
      if (t.k === "turret") (turret(K, x, x + tw, o.top, t.h ?? RI(16, 24), m), R() < 0.5 && K.tag(x + 2, o.top - 16, x + tw - 2, o.top, "arena"));
      else if (t.k === "hut") hut(K, x, x + tw, o.top, t.h ?? 13, m);
      else mound(K, x, x + tw, o.top);
      placed.push([x, x + tw]);
      break;
    }
  }
  const doors = {};
  for (const d of o.doors ?? []) {
    const f = fl[d.fi];
    if (d.side === "L") (cave(K, o.x0 - 3, ix0 + 1, f, 9, T.wall), ledge(K, o.x0 - 9, o.x0 - 1, f, 2, T.m), (doors.L = { x: o.x0 - 10, f }));
    else (cave(K, ix1 - 1, o.x1 + 3, f, 9, T.wall), ledge(K, o.x1 + 1, o.x1 + 9, f, 2, T.m), (doors.R = { x: o.x1 + 10, f }));
  }
  for (const q of o.topProps ?? []) placed.some((r) => q[0] >= r[0] - 2 && q[0] <= r[1] + 2) || K.prop(q[0], o.top, q[1], q[2] ?? {});
  assign(K, F.rooms, { treasure: o.treasure ?? 1, tex: o.tex, rest: o.rest, arena: o.arena });
  K.struct(o.name, o.role ?? "전투·보물고", o.x0, o.top - 26, o.x1, belly);
  return { ...o, fl, hs, body, belly, doors };
}

// ── 건물 덩어리: 아래(ybot)부터 층을 쌓고 방을 나눈다 · 승강기 통로 ──
function building(K, o) {
  const T = TH[o.th], fl = [], hs = [];
  let f = o.ybot;
  for (;;) {
    const h = R() < (o.tall ?? 0) ? RI(30, 40) : RI(o.hmin ?? 16, o.hmax ?? 23);
    if (f - h < o.ytop + 3) break;
    fl.unshift(f), hs.unshift(h);
    f -= h + 3;
  }
  K.mat(o.x0, o.ytop, o.x1, o.ybot + 3, T.m);
  const F = floors(K, { x0: o.x0 + 3, x1: o.x1 - 3, fl, hs, th: T, roomW: o.roomW, arcade: o.arcade, cols: o.cols });
  for (const lx of o.lifts ?? []) {
    shaft(K, lx, lx + 8, fl[0] - hs[0], o.ybot, "wood");
    K.lift(lx, lx + 8, fl[0], o.ybot, fl[0] - hs[0] + 1);
  }
  return { fl, hs, rooms: F.rooms };
}

// ── 굴 층 여러 줄: 물결치는 긴 굴 · 굴 속 큰 방 · 웅덩이 · 층 사이 세로 굴 (사다리·밧줄·덩굴·폭포·바람·비탈) ──
function layers(K, o) {
  const Ls = o.bases.map((b, j) => ({
    j, b, a1: 2 + R() * 3, k1: 0.025 + R() * 0.03, p1: R() * 6.28, a2: 0.8 + R() * 1.2, k2: 0.08 + R() * 0.05, p2: R() * 6.28,
    h: o.hmin + RI(0, 3), x0: o.x0 + RI(0, o.rag ?? 0), x1: o.x1 - RI(0, o.rag ?? 0), ch: [],
  }));
  const fAt = (L, x) => Math.round(L.b + L.a1 * Math.sin(x * L.k1 + L.p1) + L.a2 * Math.sin(x * L.k2 + L.p2));
  const hAt = (L, x) => {
    let h = L.h + Math.round(1.5 * Math.sin(x * 0.09 + L.p2));
    for (const c of L.ch) {
      const u = (x - c.c) / (c.w / 2);
      if (Math.abs(u) < 1) h = Math.max(h, Math.round(L.h + c.e * (c.flat ? Math.min(1, (1 - Math.abs(u)) / 0.22) : Math.pow(Math.cos((u * Math.PI) / 2), 0.8))));
    }
    return h;
  };
  for (const L of Ls) {
    const n = RI(2, 4), len = L.x1 - L.x0;
    for (let k = 0; k < n; k++) L.ch.push({ c: Math.round(L.x0 + ((k + 0.5) * len) / n + RI(-10, 10)), w: RI(24, 56), e: RI(8, 24), flat: R() < 0.45 });
    for (let x = L.x0; x < L.x1; x++) {
      const f = fAt(L, x), h = hAt(L, x);
      K.air(x, f - h, x + 1, f);
      (x - L.x0) % 4 === 0 && K.wall(x, f - h - 1, x + 4, f + 1, o.wallM ?? "rock");
    }
  }
  const pool = (L, c, half) => {
    let lo = 1e9, hi = -1e9;
    for (let x = c - half; x < c + half; x++) ((lo = Math.min(lo, fAt(L, x))), (hi = Math.max(hi, fAt(L, x))));
    K.air(c - half, lo, c + half, hi + 3), K.wall(c - half, lo, c + half, hi + 3, "rock"), K.water(c - half, lo, c + half, hi + 3);
  };
  const out = { Ls, fAt, hAt, rooms: [] };
  for (const L of Ls)
    for (const c of L.ch) {
      const f = fAt(L, c.c), x0 = c.c - (c.w >> 1) + 4, x1 = c.c + (c.w >> 1) - 4;
      const role = RP(["arena", "arena", "treasure", "none", "arena"]);
      role !== "none" && K.tag(x0, f - L.h - c.e + 2, x1, f, role);
      o.room && o.room(c, f, L, role);
      out.rooms.push({ c: c.c, f, L, role });
      if (!o.dry && R() < 0.3 && L.j + 1 < Ls.length) pool(L, c.c + RI(-8, 8), RI(5, 9));
    }
  for (let j = 0; j + 1 < Ls.length; j++) {
    const A = Ls[j], B = Ls[j + 1], lo = Math.max(A.x0, B.x0) + 6, hi = Math.min(A.x1, B.x1) - 6;
    const xs = [];
    for (let t = 0; t < 80 && xs.length < (o.links ?? 4); t++) {
      const x = RI(lo, hi);
      xs.some((q) => Math.abs(q - x) < 26) || xs.push(x);
    }
    xs.forEach((x, k) => {
      const fu = fAt(A, x), fd = fAt(B, x), kind = k === 0 && o.ramps ? "ramp" : RP(o.linkKinds);
      if (kind === "ramp") {
        const atEnd = R() < 0.5, xs0 = atEnd ? A.x1 - 2 : A.x0 + 1, dir = atEnd ? -1 : 1;
        let dx = Math.ceil((fAt(B, xs0) - fAt(A, xs0)) / 0.8);
        dx = Math.ceil((fAt(B, xs0 + dir * dx) - fAt(A, xs0)) / 0.8);
        const xe = xs0 + dir * dx;
        if (xe < B.x0 + 2 || xe > B.x1 - 2) return;
        K.wiggle([[xs0, fAt(A, xs0)], [xe, fAt(B, xe)]], 9, 0, o.wallM ?? "rock");
      } else if (kind === "fall") {
        K.fallw(x - 3, fu - 5, x + 3, fd), K.wall(x - 3, fu - 5, x + 3, fd, "rock");
        pool(B, x, 8);
      } else if (kind === "wind") {
        shaft(K, x - 2, x + 2, fu, fd), K.wind(x - 2, x + 2, fu - 8, fd);
      } else if (kind === "ladder") hatch(K, x, fu, fd, "ladder", o.wallM ?? "rock");
      else {
        shaft(K, x - 2, x + 2, fu, fd);
        kind === "rope" ? K.rope(x, fu - 3, fd) : K.vine(x - 2, x + 2, fu - 3, fd);
      }
    });
  }
  return out;
}

// ── 고원 윗면 (조각 직선, 기울기 ≤ 0.92) ──
const SURF = [[0, 594], [60, 594], [88, 572], [130, 572], [150, 560], [200, 560], [220, 572], [260, 572], [290, 588], [376, 588], [404, 566], [442, 534], [472, 508], [500, 484], [522, 464], [558, 464], [580, 484], [608, 508], [638, 534], [676, 566], [704, 588], [760, 588], [770, 580], [840, 580], [850, 590], [940, 590], [948, 584], [1024, 584]];
const S = (x) => {
  for (let k = 0; k + 1 < SURF.length; k++) {
    const [xa, ya] = SURF[k], [xb, yb] = SURF[k + 1];
    if (x >= xa && x <= xb) return Math.round(ya + ((yb - ya) * (x - xa)) / Math.max(1, xb - xa));
  }
  return 584;
};

export function greenstep(K, o) {
  R = mk(0x6e3e57);
  const BF = Math.round(o.base / 8);
  for (let x = 0; x < 1024; x++) K.rock(x, S(x), x + 1, BF + 4);
  const I = {};
  sky1A(K, I), sky1B(K, I), sky1C(K, I);
  sky2A(K, I, BF), mountain2B(K, I), sky2C(K, I);
  const A3 = caves3A(K, BF), B3 = tombs3B(K, BF), C3 = monastery3C(K, BF);
  baseRoad(K, BF);
  joins(K, A3, B3, C3, BF);
}

// ═══ 1가 독수리 봉우리 섬들 ═══
function sky1A(K, I) {
  I.a1 = isle(K, { x0: 14, x1: 110, top: 46, nF: 2, th: "rock", name: "독수리 왕 바위", style: "keel", tops: [{ k: "mound", w: 26 }], keep: [114], role: "정예·보물고", tex: { big: 1, elite: 1 }, topProps: [[40, "p_nest", { sc: 1.8 }], [80, "p_flags", { s: 2 }]] });
  I.a2 = isle(K, { x0: 136, x1: 230, top: 70, nF: 2, th: "wood", name: "사냥꾼 바위", style: "slab", tops: [{ k: "hut", w: 22 }], keep: [226], topProps: [[150, "p_rack"], [214, "p_dead", { sc: 0.8 }]] });
  I.a3 = isle(K, { x0: 266, x1: 334, top: 40, nF: 1, th: "brick", name: "봉화 바위", style: "tower", nF: 3, keep: [270, 330], role: "전망·보물고", topProps: [[300, "p_brazier", { sc: 1.4 }], [318, "p_flags"]] });
  I.a4 = isle(K, { x0: 10, x1: 122, top: 176, nF: 3, th: "rock", name: "바람 굴 바위", style: "bowl", tops: [{ k: "mound", w: 30 }, { k: "turret", w: 16 }], keep: [114, 118], topProps: [[30, "p_cairn"], [100, "p_boulder"]] });
  I.a5 = isle(K, { x0: 150, x1: 246, top: 206, nF: 2, th: "wood", name: "매 사냥터 바위", style: "slab", tops: [{ k: "turret", w: 18 }], keep: [234, 244], topProps: [[170, "p_dead", { sc: 0.9 }]] });
  I.a6 = isle(K, { x0: 266, x1: 336, top: 150, nF: 2, th: "rock", name: "까치 바위", style: "keel", keep: [270], topProps: [[290, "p_nest"]] });
  K.rope(114, 43, 176);
  K.rope(234, 67, 206);
  K.zip(330, 37, 416, 61);
}
// ═══ 1나 정상 종 사원 (4층 사원 섬, 꼭대기 ▲) · 종지기 바위 ═══
function sky1B(K, I) {
  I.c0 = isle(K, { x0: 410, x1: 650, top: 64, nF: 4, th: "temple", hmin: 13, hmax: 16, belly: 60, name: "정상 종 사원", tops: [{ k: "turret", w: 22, h: 26 }, { k: "turret", w: 18, h: 20 }], keep: [416, 646], role: "정예·보물고·출구", tex: { big: 1, elite: 1 }, treasure: 2, doors: [{ side: "L", fi: 3 }, { side: "R", fi: 3 }], avoid: [544], topProps: [[470, "p_menhir", { sc: 1.3 }], [500, "p_bell", { sc: 1.3 }], [590, "p_menhir", { sc: 1.6 }], [620, "p_flags", { s: 2 }]] });
  K.peak(544, 64);
  K.tag(530, 40, 560, 64, "rest");
  I.n1 = isle(K, { x0: 348, x1: 398, top: 120, nF: 1, th: "brick", name: "종지기 바위", style: "tower", nF: 2, keep: [395], topProps: [[372, "p_bell"]] });
  const L = I.c0.doors.L, Rr = I.c0.doors.R;
  K.rope(399, L.f - 3, 250);
  K.rope(661, Rr.f - 3, 362);
  K.rope(402, 117, 250);
}
// ═══ 1다 구름 목초지 섬들 ═══
function sky1C(K, I) {
  I.d1 = isle(K, { x0: 700, x1: 788, top: 56, nF: 1, th: "wood", name: "까마귀 둥지 바위", style: "slab", tops: [{ k: "hut", w: 20 }], keep: [704, 784], topProps: [[720, "p_nest"], [770, "p_flags"]] });
  I.d2 = isle(K, { x0: 812, x1: 910, top: 84, nF: 2, th: "brick", name: "무너진 종탑 바위", style: "tower", nF: 3, tops: [{ k: "turret", w: 20, h: 28 }], keep: [906], tex: { big: 1 }, topProps: [[840, "p_brokencol"], [880, "p_bell"]] });
  I.d3 = isle(K, { x0: 934, x1: 1016, top: 40, nF: 2, th: "wood", name: "하늘 목동 바위", style: "keel", keep: [938], topProps: [[950, "p_brazier"], [1000, "p_sheep"]] });
  I.d4 = isle(K, { x0: 704, x1: 824, top: 190, nF: 3, th: "wood", name: "구름 목초지 바위", style: "bowl", tops: [{ k: "hut", w: 24 }, { k: "mound", w: 24 }], keep: [792, 820], topProps: [[720, "p_sheep"], [740, "p_hay", { s: 1 }], [800, "p_fence"]] });
  I.d5 = isle(K, { x0: 852, x1: 1012, top: 212, nF: 2, th: "wood", name: "치즈 바위", style: "slab", tops: [{ k: "hut", w: 22 }, { k: "hut", w: 18 }, { k: "mound", w: 22 }], keep: [914, 930, 856], topProps: [[880, "p_sheep", { v: 1 }], [990, "p_wool"]] });
  K.rope(792, 53, 190);
  K.rope(914, 81, 212);
  K.rope(930, 37, 212);
  K.plank(824, 852, 212);
  K.zip(704, 53, 646, 61);
}
// ═══ 2가 양치기 하늘 집 섬들 + 언덕 마을 (윗면) ═══
function sky2A(K, I, BF) {
  I.a7 = isle(K, { x0: 22, x1: 146, top: 330, nF: 3, th: "wood", name: "양치기 하늘 집", style: "bowl", tops: [{ k: "hut", w: 24 }, { k: "mound", w: 20 }], keep: [130, 140], topProps: [[40, "p_sheep"], [60, "p_hay"], [110, "p_wool"]] });
  I.a8 = isle(K, { x0: 176, x1: 304, top: 352, nF: 2, th: "brick", name: "물레 바위", style: "bowl", tops: [{ k: "turret", w: 18 }, { k: "mound", w: 22 }], keep: [180, 256, 300], topProps: [[200, "p_flags"], [280, "p_cairn"]] });
  I.a9 = isle(K, { x0: 236, x1: 330, top: 470, nF: 1, th: "wood", name: "건초 바위", style: "slab", tops: [{ k: "hut", w: 20 }], keep: [308], topProps: [[260, "p_hay", { s: 1 }], [300, "p_hay"]] });
  K.wind(151, 159, 322, 560);
  K.rope(172, 349, 560);
  K.rope(308, 349, 470);
  K.wind(126, 134, 168, 328);
  K.wind(252, 260, 32, 350);
  hut(K, 92, 128, 572, 14), hut(K, 222, 258, 572, 13);
  K.heal(162, 190, 554, 560), K.prop(176, 560, "p_font", { sc: 1.2 });
  for (const [x, k, s] of [[300, "p_fence", 0], [312, "p_sheep", 0], [324, "p_sheep", 1], [340, "p_fence", 0], [352, "p_hay", 1], [30, "p_flags", 1], [204, "p_flowers", 0]]) K.prop(x, S(x), k, { s, v: s });
  K.tag(150, 534, 200, 560, "rest");
  K.struct("언덕 마을", "거점", 60, 540, 376, 594);
}
// ═══ 2나 수도원 섬들 + 산 (속 산속 굴 3단, 꼭대기 감실) ═══
function mountain2B(K, I) {
  I.n3 = isle(K, { x0: 356, x1: 468, top: 250, nF: 2, th: "brick", name: "서고 바위", style: "bowl", tops: [{ k: "turret", w: 20 }], keep: [399, 402, 466] });
  I.n4 = isle(K, { x0: 500, x1: 620, top: 240, nF: 3, th: "brick", name: "숙소 바위", style: "tower", keep: [504, 616] });
  I.n6 = isle(K, { x0: 376, x1: 496, top: 384, nF: 2, th: "rock", name: "호수 바위", style: "keel", tops: [{ k: "mound", w: 28 }], keep: [472, 492] });
  I.n7 = isle(K, { x0: 562, x1: 684, top: 362, nF: 2, th: "brick", name: "필사실 바위", style: "slab", tops: [{ k: "turret", w: 22 }, { k: "hut", w: 18 }], keep: [661, 624, 566] });
  K.rope(472, 247, 384);
  K.plank(468, 500, 250);
  K.rope(624, 237, 362);
  K.rope(500, 381, S(500));
  K.rope(558, 359, S(558));
  ncave(K, 456, 624, 560, 24, 31, 10);
  ncave(K, 498, 582, 516, 18, 33, 9);
  ncave(K, 526, 554, 486, 13, 35, 8);
  shaft(K, 504, 509, 516, 560), K.vine(504, 509, 513, 560);
  shaft(K, 568, 571, 516, 560), K.rope(570, 513, 560);
  shaft(K, 538, 542, 486, 516), K.rope(540, 483, 516);
  hatch(K, 532, 464, 486, "ladder", "rock");
  K.wiggle([[456, 560], [404, 560]], 9, 0, "rock");
  K.wiggle([[624, 560], [678, 560]], 9, 0, "rock");
  K.prop(540, 464, "p_bell", { sc: 1.2 }), K.prop(526, 464, "p_flags"), K.prop(556, 464, "p_cairn");
  for (const x of [470, 520, 600]) K.prop(x, 560, RP(["p_boulder", "p_bones", "p_rubble"]));
  K.prop(510, 516, "p_altar"), K.prop(560, 516, "p_candles"), K.prop(540, 486, "p_statue", { sc: 0.8 });
  K.tag(462, 538, 620, 560, "arena"), K.tag(500, 500, 580, 516, "treasure"), K.tag(528, 474, 552, 486, "rest");
  K.struct("산속 굴", "전투·보물고·이동로", 404, 464, 678, 560);
}
// ═══ 2다 바람 사당 섬들 (시련) ═══
function sky2C(K, I) {
  I.d6 = isle(K, { x0: 708, x1: 836, top: 352, nF: 2, th: "rock", name: "바람 굴 섬", style: "keel", tops: [{ k: "mound", w: 30 }], keep: [828, 832] });
  I.d7 = isle(K, { x0: 870, x1: 1012, top: 330, nF: 3, th: "brick", name: "바람 사당", style: "bowl", tops: [{ k: "turret", w: 24, h: 24 }], keep: [874], tex: { safe: 1 }, topProps: [[900, "p_bell", { sc: 1.3 }], [990, "p_flags", { s: 2 }]] });
  I.d8 = isle(K, { x0: 760, x1: 900, top: 474, nF: 1, th: "rock", name: "시련 문 바위", style: "slab", tops: [{ k: "turret", w: 16 }], keep: [853, 896], topProps: [[780, "p_flags"], [880, "p_cairn"]] });
  I.d9 = isle(K, { x0: 930, x1: 1016, top: 482, nF: 1, th: "wood", name: "바람개비 바위", style: "tower", nF: 2, keep: [934], topProps: [[950, "p_flags", { s: 1 }], [990, "p_flags", { s: 2 }]] });
  K.wind(904, 912, 466, 590);
  K.rope(926, 479, 590);
  K.wind(844, 862, 322, 472);
  K.rope(828, 187, 352);
  for (const [x, k] of [[790, "p_flags"], [820, "p_cairn"], [870, "p_sheep"], [890, "p_sheep"], [960, "p_hay"], [1000, "p_flowers"]]) K.prop(x, S(x), k, { v: x & 1 });
}

// ═══ 3가 벼랑 마을 굴 6층 ═══
function caves3A(K, BF) {
  const out = layers(K, {
    x0: 4, x1: 334, bases: [640, 696, 752, 808, 864, 922], hmin: 10, rag: 18, links: 4, ramps: 1,
    linkKinds: ["ladder", "rope", "fall", "wind", "vine", "ladder"],
    room: (c, f, L) => {
      K.wall(c.c - (c.w >> 1), f - L.h - c.e, c.c + (c.w >> 1), f, "wood");
      const k = RP([["p_wheel", "p_crates"], ["p_sheep", "p_hay"], ["p_loom", "p_wool"], ["p_cheese", "p_urn"], ["p_brazier", "p_rack"]]);
      K.prop(c.c - 6, f, k[0], { sc: k[0] === "p_wheel" ? 1.1 : 1 }), K.prop(c.c + 8, f, k[1]);
      if (L.h + c.e >= 26 && c.w >= 34) (K.plank(c.c - 14, c.c, f - 13), K.ladder(c.c + 1, f - 13, f));
    },
  });
  const L0 = out.Ls[0];
  K.wiggle([[34, S(34)], [34 + Math.ceil((out.fAt(L0, 92) - S(34)) / 0.8), out.fAt(L0, 92)]], 9, 0, "rock");
  hatch(K, 176, 560, out.fAt(L0, 176), "ladder", "brick");
  K.struct("벼랑 마을 굴", "거점·전투·보물고·이동로", 4, 600, 334, 930);
  return out;
}
// ═══ 3나 물에 잠긴 지하 묘지 6층 ═══
function tombs3B(K, BF) {
  const out = layers(K, {
    x0: 346, x1: 684, bases: [650, 706, 764, 822, 878, 936], hmin: 11, rag: 14, links: 4, ramps: 1, wallM: "brick",
    linkKinds: ["ladder", "rope", "fall", "fall", "ladder"],
    room: (c, f, L) => {
      K.prop(c.c - 8, f, "p_sarcoph"), K.prop(c.c + 6, f, RP(["p_skulls", "p_candles", "p_bones"]));
      for (let x = c.c - (c.w >> 1) + 5; x < c.c + (c.w >> 1) - 4; x += 9) K.wall(x, f - L.h - 4, x + 2, f, "stem");
    },
  });
  for (const L of out.Ls) {
    const Nx = out.Ls[L.j + 1];
    for (let x = L.x0 + 30; x < L.x1 - 30; x += RI(60, 90)) {
      const f = out.fAt(L, x), floor = f + 17;
      if (Nx) {
        let ok = true;
        for (let q = x - 14; q <= x + 14; q++) if (out.fAt(Nx, q) - out.hAt(Nx, q) < floor + 4) ok = false;
        if (!ok) continue;
      }
      const hw = RI(7, 16), th = RI(9, 13), kind = R();
      hall(K, x - hw, x + hw, floor, th, "brick");
      if (kind < 0.35 && hw >= 12) partition(K, x + RI(-3, 3), x + RI(-3, 3) + 2, floor, th, "brick");
      if (kind > 0.75) hall(K, x + hw, x + hw + RI(8, 12), floor, th - 3, "brick");
      hatch(K, x - hw + 3, f, floor, "ladder", "brick");
      K.prop(x - 2, floor, "p_sarcoph"), K.prop(x + hw - 4, floor, RP(["p_urn", "p_skulls", "p_candles"]));
      K.tag(x - hw + 1, floor - th, x + hw - 1, floor, R() < 0.5 ? "treasure" : "arena");
    }
  }
  const L0 = out.Ls[0];
  const xe = 356 + Math.ceil((out.fAt(L0, 430) - S(356)) / 0.8);
  K.wiggle([[356, S(356)], [xe, out.fAt(L0, xe)]], 9, 0, "rock");
  shaft(K, 598, 602, 560, out.fAt(L0, 600)), K.rope(600, 557, out.fAt(L0, 600));
  K.struct("물에 잠긴 지하 묘지", "전투·보물고·이동로", 346, 610, 684, 950);
  return out;
}
// ═══ 3다 수도원 (층 높이가 다른 세 채: 서쪽 높은 홀 채 · 가운데 낮은 방 채 · 동쪽 탑 채) ═══
function monastery3C(K, BF) {
  const W = [
    building(K, { x0: 700, x1: 806, ytop: 612, ybot: BF, th: "brick", lifts: [744], hmin: 20, hmax: 28, tall: 0.45, roomW: [36, 60], arcade: 0.15, cols: 0.4 }),
    building(K, { x0: 806, x1: 922, ytop: 620, ybot: BF, th: "brick", lifts: [], hmin: 13, hmax: 17, tall: 0.08, roomW: [18, 30], arcade: 0.08, cols: 0.12 }),
    building(K, { x0: 922, x1: 1020, ytop: 606, ybot: BF, th: "temple", lifts: [956], hmin: 16, hmax: 22, tall: 0.2, roomW: [26, 44], arcade: 0.2, cols: 0.2 }),
  ];
  // 채 사이 벽 (4칸) · 바닥 높이가 비슷한 층끼리 문 (비탈)
  K.rock(804, 606, 808, BF - 16), K.rock(920, 606, 924, BF - 16);
  for (const [A, B, x] of [[W[0], W[1], 806], [W[1], W[2], 922]])
    for (const fa of A.fl) {
      const fb = B.fl.sort((p, q) => Math.abs(p - fa) - Math.abs(q - fa))[0];
      fa < BF - 4 && fb < BF - 4 && Math.abs(fb - fa) <= 6 && (K.ramp(x - 6, fa, x + 6, fb, 8), K.wall(x - 6, Math.min(fa, fb) - 9, x + 6, Math.max(fa, fb), "brick"));
    }
  // 가운데 채 → 두 이웃 채 (사다리 굴): 이어진 문이 없으면 서로 승강기 채로 건너간다
  hut(K, 708, 750, 588, 16, "brick");
  hatch(K, 728, 588, W[0].fl[0], "ladder", "brick");
  hatch(K, 862, S(862), W[1].fl[0], "ladder", "brick");
  shaft(K, 978, 982, S(980), W[2].fl[0]), K.rope(980, S(980) - 3, W[2].fl[0]);
  for (const B of W) assign(K, B.rooms.filter((r) => r.f < BF - 4), { treasure: 2, arena: 0.55 });
  K.struct("수도원", "정예·전투·보물고·이동로", 700, 588, 1020, BF);
  return { fl: W[0].fl };
}
// ═══ 기초 땅 길 (줄 1000, 좌우 출구) ═══
function baseRoad(K, BF) {
  K.air(0, BF - 16, 1024, BF);
  K.wall(0, BF - 16, 1024, BF, "brick");
  for (let x = 40; x < 1000; x += RI(26, 44)) K.wall(x, BF - 16, x + 2, BF, "stem");
  K.heal(40, 60, BF - 6, BF), K.prop(50, BF, "p_font"), K.heal(970, 990, BF - 6, BF), K.prop(980, BF, "p_font");
  for (const [x, k] of [[90, "p_crates"], [120, "p_cheese"], [150, "p_hay"], [200, "p_urn"], [260, "p_loom"], [420, "p_sarcoph"], [500, "p_candles"], [600, "p_statue"], [760, "p_crates"], [880, "p_shelf"]]) K.prop(x, BF, k, { s: 3 });
  K.tag(20, BF - 16, 100, BF, "rest"), K.tag(940, BF - 16, 1010, BF, "rest");
  K.struct("기초 땅 길", "거점·이동로", 0, BF - 16, 1024, BF);
}
// ═══ 구역 사이 잇기 ═══
function joins(K, A3, B3, C3, BF) {
  for (const LA of A3.Ls) {
    const fa = A3.fAt(LA, LA.x1 - 2);
    let best = null;
    for (const LB of B3.Ls) {
      const fb = B3.fAt(LB, LB.x0 + 2);
      Math.abs(fb - fa) <= 18 && (!best || Math.abs(fb - fa) < Math.abs(best[1] - fa)) && (best = [LB, fb]);
    }
    if (best) K.wiggle([[LA.x1 - 4, fa], [best[0].x0 + 4, best[1]]], 9, 0, "rock");
  }
  for (const LB of B3.Ls) {
    const fb = B3.fAt(LB, LB.x1 - 2);
    const fm = C3.fl.filter((f) => f < BF - 4).sort((p, q) => Math.abs(p - fb) - Math.abs(q - fb))[0];
    if (fm != null && Math.abs(fm - fb) <= 16) K.wiggle([[LB.x1 - 4, fb], [706, fm]], 9, 0, "brick");
  }
  for (const [O, xs] of [[A3, [60, 250]], [B3, [420, 620]]]) {
    const L = O.Ls[O.Ls.length - 1];
    for (const x of xs) {
      const f = O.fAt(L, x);
      R() < 0.5 ? hatch(K, x, f, BF, "ladder", "rock") : (shaft(K, x - 2, x + 2, f, BF), K.rope(x, f - 3, BF));
    }
  }
}
