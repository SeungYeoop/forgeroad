// 지역 설계 코드: 지역마다 지도 전체를 그 지역만의 뼈대로 꽉 채운다 (방 몇 개를 굴로 잇는 대신)
//   칸 = 8px 블록 (C.cell: 1 바위, -1 공기). 장치(사다리·승강기·짚라인…)는 P.specReq로 (natgen SPEC)
//   ARCHI[구역 id](K) — K는 아래 kit: 파기·채우기·비탈 굴·장치·뒷벽·재질·방 역할
import { rng } from "./noise.js";

export function kit(P, C) {
  const { cell, NX, NY } = C;
  const R = rng((P.seed ^ 0xa4c41) >>> 0);
  const inb = (x, y) => x >= 1 && y >= 1 && x < NX - 1 && y < NY - 1;
  const set = (x, y, v) => inb(x, y) && (cell[y * NX + x] = v);
  const get = (x, y) => (inb(x, y) ? cell[y * NX + x] : 1);
  const K = {
    P, C, NX, NY, R, set, get,
    // [x0, x1) × [y0, y1) 칸
    air(x0, y0, x1, y1) {
      for (let y = Math.max(1, y0 | 0); y < Math.min(NY - 1, y1); y++) for (let x = Math.max(0, x0 | 0); x < Math.min(NX, x1); x++) cell[y * NX + x] = -1;
    },
    rock(x0, y0, x1, y1) {
      for (let y = Math.max(1, y0 | 0); y < Math.min(NY - 1, y1); y++) for (let x = Math.max(0, x0 | 0); x < Math.min(NX, x1); x++) cell[y * NX + x] = 1;
    },
    // 굴 한 줄: 바닥 f(그 칸은 바위), 높이 h칸
    hall(x0, x1, f, h) {
      K.air(Math.min(x0, x1), f - h, Math.max(x0, x1), f);
    },
    // 비탈 굴: (xa, fa) → (xb, fb), 기울기 1 이하 (걸어서 오르내린다)
    ramp(xa, fa, xb, fb, h = 7) {
      const n = Math.abs(xb - xa), dir = Math.sign(xb - xa) || 1;
      for (let i = 0; i <= n; i++) {
        const x = xa + i * dir, f = Math.round(fa + ((fb - fa) * i) / Math.max(1, n));
        K.air(x, f - h, x + 1, f);
      }
    },
    // 굽은 굴 (사인 곡선으로 흔들리며): 바닥 높이를 점들로
    wiggle(pts, h = 7, amp = 0) {
      for (let k = 0; k + 1 < pts.length; k++) {
        const [xa, fa] = pts[k], [xb, fb] = pts[k + 1];
        const n = Math.abs(xb - xa), dir = Math.sign(xb - xa) || 1;
        for (let i = 0; i <= n; i++) {
          const x = xa + i * dir, f = Math.round(fa + ((fb - fa) * i) / Math.max(1, n) + (amp ? Math.sin((x * 0.13) + k) * amp : 0));
          K.air(x, f - h, x + 1, f);
        }
      }
    },
    // 초타원 (p가 클수록 네모에 가깝다): 바닥이 넓은 대공동
    sell(cx, cy, rx, ry, p = 3, v = -1, rough = 0) {
      for (let y = Math.floor(cy - ry - 2); y <= cy + ry + 2; y++)
        for (let x = Math.floor(cx - rx - 2); x <= cx + rx + 2; x++) {
          const dx = Math.abs((x - cx) / rx), dy = Math.abs((y - cy) / ry), rr = 1 + (rough ? (Math.sin(x * 0.37 + y * 0.21) + Math.sin(y * 0.29 - x * 0.17)) * rough : 0);
          dx ** p + dy ** p < rr && set(x, y, v);
        }
    },
    ell(cx, cy, rx, ry, v = -1, rough = 0) {
      for (let y = Math.floor(cy - ry - 2); y <= cy + ry + 2; y++)
        for (let x = Math.floor(cx - rx - 2); x <= cx + rx + 2; x++) {
          const dx = (x - cx) / rx, dy = (y - cy) / ry, rr = 1 + (rough ? (Math.sin(x * 0.7 + y * 0.3) + Math.sin(y * 0.9 - x * 0.4)) * rough : 0);
          dx * dx + dy * dy < rr * rr && set(x, y, v);
        }
    },
    // 장치 (칸 좌표). 사다리는 위 바닥 fu보다 3칸 위부터 아래 바닥 fd까지 (가운데 cx, 폭 2칸)
    ladder(cx, fu, fd, k = "ladder") {
      P.specReq.push({ x0: cx - 1, x1: cx + 1, y0: fu - 3, y1: fd, k });
    },
    rope(cx, y0, fd) {
      P.specReq.push({ x0: cx - 1, x1: cx + 1, y0, y1: fd, k: "rope" });
    },
    vine(x0, x1, y0, y1) {
      P.specReq.push({ x0, x1, y0, y1, k: "vine" });
    },
    plank(x0, x1, f) {
      P.specReq.push({ x0, x1, y0: f, y1: f + 1, k: "plank" });
    },
    crumble(x0, x1, f) {
      P.specReq.push({ x0, x1, y0: f, y1: f + 1, k: "crumble" });
    },
    crack(x0, y0, x1, y1) {
      K.air(x0, y0, x1, y1);
      P.specReq.push({ x0, x1, y0, y1, k: "crack" });
    },
    water(x0, y0, x1, y1, k = "water") {
      P.specReq.push({ x0, x1, y0, y1, k });
    },
    // 폭포 (세로 물기둥): 헤엄쳐 오른다
    fallw(x0, y0, x1, y1) {
      K.air(x0, y0, x1, y1);
      P.specReq.push({ x0, x1, y0, y1, k: "water", ex: { fallw: 1 } });
    },
    wind(x0, x1, y0, y1, pow) {
      P.specReq.push({ x0, x1, y0, y1, k: "wind", ex: pow ? { pow } : null });
    },
    geyser(x0, x1, y0, f, ex) {
      P.specReq.push({ x0, x1, y0, y1: f, k: "geyser", ex });
    },
    fall(x0, x1, y0, f) {
      P.specReq.push({ x0, x1, y0, y1: f, k: "fall" });
    },
    // 승강기: 길 [x0, x1), 발판 윗면이 위 바닥 fu ~ 아래 바닥 fd를 오간다 (줄은 top칸부터)
    lift(x0, x1, fu, fd, top) {
      P.specReq.push({ x0, x1, y0: fu, y1: fd, k: "lift", ex: { top: (top ?? fu - 8) * 8 } });
    },
    // 짚라인: 칸 좌표 끝점 (줄 높이) — 높은 쪽에서 낮은 쪽으로
    zip(ax, ay, bx, by) {
      P.specReq.push({ x0: Math.min(ax, bx) - 1, x1: Math.max(ax, bx) + 1, y0: Math.min(ay, by) - 1, y1: Math.max(ay, by) + 1, k: "zip", ex: { ax: ax * 8, ay: ay * 8, bx: bx * 8, by: by * 8 } });
    },
    wall(x0, y0, x1, y1, m) {
      P.walls.push({ x0: x0 * 8, y0: y0 * 8, x1: x1 * 8, y1: y1 * 8, m });
    },
    mat(x0, y0, x1, y1, m) {
      P.mats.push({ x0: x0 * 8, y0: y0 * 8, x1: x1 * 8, y1: y1 * 8, m });
    },
    tag(x0, y0, x1, y1, role) {
      (P.roomTags ??= []).push({ x0: x0 * 8, x1: x1 * 8, y0: y0 * 8, y1: y1 * 8 + 8, role });
    },
    peak(cx, f) {
      P.peak = { x: Math.round((cx * 8 - 8) / 16) * 16 + 8, y: f * 8 };
    },
    deep(cx, f) {
      P.deep = { x: Math.round((cx * 8 - 8) / 16) * 16 + 8, y: f * 8 };
    },
  };
  return K;
}

// ══════════════════════════════════════════════════════════════
// 그물 생성기: 지도 전체에 크기·종류가 제각각인 방을 빽빽이 흩뿌리고, 이웃끼리 여러 갈래로 잇는다
//   o.fixed: 꼭 있어야 할 방 (입구·▲▼·요새 문) · o.reserve: 비워 둘 곳 · o.pick(): 방 종류·크기
//   o.shape(K, r): 방 파기 · o.link(K, a, b, kind): 두 문 잇기 ("v" 위아래 겹침 · "h" 비탈 · "s" 가파름) · o.inside(K, r): 방 속 꾸밈
// ══════════════════════════════════════════════════════════════
export function network(K, o) {
  const { NX, NY, R } = K;
  const rooms = o.fixed.map((r) => ({ ...r, fixed: 1 }));
  const M = o.margin ?? 8;
  const hit = (a, b, m) => a.x0 - m < b.x1 && b.x0 - m < a.x1 && a.f - a.h - m < b.f + 2 && b.f - b.h - m < a.f + 2;
  const top = o.top ?? 40, bot = o.bot ?? NY - 30;
  for (let t = 0; t < (o.tries ?? 8000) && rooms.length < (o.n ?? 160); t++) {
    const q = o.pick();
    const w = q.w, h = q.h;
    const x0 = 6 + Math.floor(R() * (NX - 12 - w)), f = top + h + Math.floor(R() * Math.max(1, bot - top - h));
    const r = { ...q, x0, x1: x0 + w, f, h };
    if (rooms.some((b) => hit(r, b, M)) || (o.reserve ?? []).some((b) => hit(r, b, 4))) continue;
    rooms.push(r);
  }
  for (const r of rooms) (r.cx = (r.x0 + r.x1) / 2), (r.cy = r.f - r.h / 2), (r.deg = 0);
  // 잇기: 가장 짧은 나무(모두 이어짐) + 가까운 이웃 몇 개 더 (고리)
  const dist = (a, b) => Math.hypot(a.cx - b.cx, (a.cy - b.cy) * (o.vw ?? 1.5));
  const E = [];
  for (let i = 0; i < rooms.length; i++) for (let j = i + 1; j < rooms.length; j++) E.push([dist(rooms[i], rooms[j]), i, j]);
  E.sort((p, q) => p[0] - q[0]);
  const par = rooms.map((_, i) => i), find = (i) => (par[i] === i ? i : (par[i] = find(par[i])));
  const used = new Set(), links = [];
  for (const [, i, j] of E) if (find(i) !== find(j)) ((par[find(i)] = find(j)), used.add(i + ":" + j), links.push([i, j]));
  for (let i = 0; i < rooms.length; i++) {
    let k = 0;
    for (const [dd, a, b] of E) {
      if (k >= (o.extra ?? 2) || dd > (o.maxLen ?? 130)) break;
      if (a !== i && b !== i) continue;
      const key = a + ":" + b;
      if (used.has(key)) continue;
      k++;
      R() < (o.loopP ?? 0.7) && (used.add(key), links.push([a, b]));
    }
  }
  for (const [i, j] of links) (rooms[i].deg++, rooms[j].deg++);
  for (const r of rooms) o.shape(K, r);
  for (const [i, j] of links) route(K, rooms[i], rooms[j], o);
  for (const r of rooms) o.inside && o.inside(K, r);
  return rooms;
}
// 두 방 잇기: 위아래로 겹치면 세로 굴, 아니면 옆문끼리 (높이 차가 작으면 비탈, 크면 세로 굴을 끼운다)
function route(K, a, b, o) {
  const ox0 = Math.max(a.x0, b.x0), ox1 = Math.min(a.x1, b.x1);
  if (ox1 - ox0 >= 8) {
    const [U, L] = a.f < b.f ? [a, b] : [b, a];
    const mx = Math.round(ox0 + 3 + K.R() * (ox1 - ox0 - 6));
    o.link(K, { x: mx, f: U.f, r: U }, { x: mx, f: L.f, r: L }, "v");
    return;
  }
  const [A, B] = a.cx < b.cx ? [a, b] : [b, a];
  const pa = { x: A.x1 - 1, f: A.f, r: A }, pb = { x: B.x0 + 1, f: B.f, r: B };
  o.link(K, pa, pb, Math.abs(pb.f - pa.f) <= pb.x - pa.x - 6 ? "h" : "s");
}
// 비탈 이음 (평평 → 비탈 → 평평, 비탈 자리는 제각각)
function slopeLink(K, a, b, h) {
  const dy = b.f - a.f, run = b.x - a.x - Math.abs(dy), xr = a.x + Math.floor(K.R() * Math.max(1, run));
  K.hall(a.x, xr + 1, a.f, h);
  K.ramp(xr, a.f, xr + Math.abs(dy), b.f, h);
  K.hall(xr + Math.abs(dy), b.x + 1, b.f, h);
}

// ══════════════════════════════════════════════════════════════
// 아이언베인 「광산 요새」: 지도 전체가 얽힌 갱도망 (그물 생성기 + 광산 규칙)
//   꼭대기 가운데 벽돌 요새(층마다 방·사다리, 맨 위 망루 = ▲)에서 사방으로 갱도가 뻗어 내려간다
//   방 종류: 채굴방(층층 나무 발판·사다리·짚라인) · 광맥 굴 · 갱도 작업장(긴 굴, 버팀목) · 물 찬 집수정
//            · 무너진 굴(무너지는 판·떨어지는 바위) · 금 간 벽 뒤 보석 금고(막다른 방) · 환기 수갱(바람)
//   잇기: 높이 차가 작으면 비탈 갱도, 크면 사다리 수갱(아주 크면 승강기) — 세로 굴은 위 바닥에 판자 뚜껑
// ══════════════════════════════════════════════════════════════
function ironvein(K) {
  const { NX, R } = K;
  const EN = 600;
  // ── 요새 (벽돌) ──
  const KX0 = 462, KX1 = 628, KF = [70, 102, 134, 166, 198];
  K.mat(KX0 - 4, 30, KX1 + 4, 206, "brick");
  for (let s = 0; s < KF.length; s++) {
    const f = KF[s], h = s === 0 ? 20 : 24;
    K.hall(KX0 + 4, KX1 - 4, f, h);
    K.wall(KX0 + 4, f - h, KX1 - 4, f, "brick");
    const parts = [[502, 506], [560, 564], [596, 600]].filter((_, i) => (s + i) % 3 !== 0);
    for (const [a, b] of parts) (K.rock(a, f - h, b, f - 7), K.mat(a, f - h, b, f - 7, "brick"));
    K.tag(KX0 + 4, f - h, KX1 - 4, f, s === 0 ? "rest" : s === 2 ? "treasure" : "arena");
  }
  const LX = [[480, 610], [530], [490, 580], [612]];
  for (let s = 0; s < KF.length - 1; s++) for (const x of LX[s]) (K.air(x - 1, KF[s], x + 2, KF[s + 1] - 24), K.plank(x - 1, x + 2, KF[s]), K.ladder(x, KF[s], KF[s + 1]));
  K.hall(530, 560, 44, 12);
  K.wall(530, 32, 560, 44, "brick");
  K.mat(526, 30, 564, 46, "brick");
  K.air(553, 44, 556, 71), K.plank(553, 556, 44), K.ladder(554, 44, 70);
  K.peak(544, 44);
  for (const f of [134, 198]) (K.air(KX0 - 4, f - 7, KX0 + 4, f), K.air(KX1 - 4, f - 7, KX1 + 4, f));
  // ── 그물 ──
  const fixed = [
    { id: "EL", x0: 0, x1: 34, f: EN, h: 9, type: "door" },
    { id: "ER", x0: NX - 34, x1: NX, f: EN, h: 9, type: "door" },
    { id: "KW1", x0: KX0 - 30, x1: KX0 - 3, f: 134, h: 8, type: "door" },
    { id: "KE1", x0: KX1 + 3, x1: KX1 + 30, f: 134, h: 8, type: "door" },
    { id: "KW2", x0: KX0 - 30, x1: KX0 - 3, f: 198, h: 8, type: "door" },
    { id: "KE2", x0: KX1 + 3, x1: KX1 + 30, f: 198, h: 8, type: "door" },
    { id: "DP", x0: 396, x1: 436, f: 1010, h: 12, type: "work" },
  ];
  const TYPES = [
    ["stope", 5, [34, 64], [22, 34]], ["pocket", 4, [14, 24], [10, 16]], ["work", 6, [40, 90], [8, 11]],
    ["sump", 2, [30, 50], [12, 16]], ["collapse", 3, [30, 52], [12, 18]], ["vault", 2, [14, 20], [8, 10]], ["vent", 2, [8, 10], [36, 56]],
  ];
  const tot = TYPES.reduce((a, t) => a + t[1], 0);
  const pick = () => {
    let u = R() * tot;
    for (const [type, w, [w0, w1], [h0, h1]] of TYPES) if ((u -= w) <= 0) return { type, w: w0 + Math.floor(R() * (w1 - w0)), h: h0 + Math.floor(R() * (h1 - h0)) };
    return { type: "work", w: 50, h: 9 };
  };
  const rooms = network(K, {
    fixed, n: 230, margin: 5, top: 30, bot: 1030, vw: 1.6, extra: 2, maxLen: 110, loopP: 0.75, tries: 14000,
    reserve: [{ x0: KX0 - 6, x1: KX1 + 6, f: 210, h: 186 }],
    pick,
    shape(K, r) {
      if (r.type === "pocket") {
        K.ell(r.cx, r.f - r.h / 2, r.x1 - r.cx, r.h / 2 + 1, -1, 0.08);
        K.rock(r.x0 - 3, r.f, r.x1 + 3, r.f + 4);
        K.air(r.x0 + 2, r.f - 7, r.x1 - 2, r.f);
        return;
      }
      K.air(r.x0, r.f - r.h, r.x1, r.f);
      // 천장 울퉁불퉁 (바닥은 평평)
      if (r.type !== "door" && r.type !== "vent")
        for (let x = r.x0; x < r.x1; x++) {
          const v = Math.round(Math.sin(x * 0.31 + r.f) * 1.3 + Math.sin(x * 0.11 + r.x0) * 1.6);
          v > 0 ? K.air(x, r.f - r.h - v, x + 1, r.f - r.h) : K.rock(x, r.f - r.h, x + 1, r.f - r.h - v);
        }
    },
    link(K, a, b, kind) {
      const h = 7 + (K.R() < 0.3 ? 1 : 0);
      if (kind === "v") {
        // 위 방 바닥에서 아래 방 바닥까지 사다리 수갱 (아주 길면 승강기)
        if (b.f - a.f > 64 && K.R() < 0.6) {
          K.air(a.x - 4, a.f - 2, a.x + 4, b.f);
          K.wall(a.x - 4, a.f - 2, a.x + 4, b.f, "wood");
          K.lift(a.x - 3, a.x + 3, a.f, b.f);
        } else {
          K.air(a.x - 1, a.f, a.x + 2, b.f);
          K.plank(a.x - 1, a.x + 2, a.f);
          K.ladder(a.x, a.f, b.f);
        }
        return;
      }
      if (kind === "h") {
        slopeLink(K, a, b, h);
        K.R() < 0.35 && K.wall(a.x, Math.min(a.f, b.f) - h - 1, b.x, Math.max(a.f, b.f), "wood");
        return;
      }
      // 가파르면: 옆 굴 → 사다리 수갱 → 옆 굴 (수갱 자리 가운데쯤)
      const mx = a.x + 3 + Math.floor(K.R() * Math.max(1, b.x - a.x - 6));
      const [up, lo] = a.f < b.f ? [a, b] : [b, a];
      K.hall(a.x, mx + 3, a.f, h);
      K.hall(mx - 2, b.x + 1, b.f, h);
      K.air(mx - 1, up.f, mx + 2, lo.f);
      K.plank(mx - 1, mx + 2, up.f);
      K.ladder(mx, up.f, lo.f);
    },
    inside(K, r) {
      const R = K.R;
      if (r.type === "stope") {
        // 층층 나무 발판 + 사다리, 넓으면 짚라인
        K.wall(r.x0, r.f - r.h, r.x1, r.f, "wood");
        let y = r.f - 8, side = R() < 0.5;
        while (y > r.f - r.h + 7) {
          const w = Math.min(r.x1 - r.x0 - 10, 12 + Math.floor(R() * 14)), x0 = side ? r.x0 + 1 : r.x1 - 1 - w;
          K.plank(x0, x0 + w, y);
          K.ladder(side ? x0 + w - 3 : x0 + 3, y, y + 8);
          y -= 8, (side = !side);
        }
        r.x1 - r.x0 > 44 && K.zip(r.x0 + 4, r.f - r.h + 4, r.x1 - 4, r.f - 6);
        K.tag(r.x0, r.f - r.h, r.x1, r.f, R() < 0.3 ? "treasure" : "arena");
      } else if (r.type === "work") {
        K.wall(r.x0, r.f - r.h - 1, r.x1, r.f, "wood");
        for (let x = r.x0 + 10; x < r.x1 - 10; x += 22 + Math.floor(R() * 20)) R() < 0.4 && K.fall(x, x + 3, r.f - r.h, r.f);
        K.tag(r.x0, r.f - r.h, r.x1, r.f, R() < 0.5 ? "arena" : "rest");
      } else if (r.type === "sump") {
        K.air(r.x0 + 5, r.f, r.x1 - 5, r.f + 5);
        K.water(r.x0 + 5, r.f, r.x1 - 5, r.f + 5, R() < 0.5 ? "curL" : "curR");
        K.tag(r.x0, r.f - r.h, r.x1, r.f, "rest");
      } else if (r.type === "collapse") {
        const a = r.x0 + 8, b = r.x1 - 8;
        K.air(a, r.f, b, r.f + 6);
        for (let x = a; x < b; x += 16) K.crumble(x, Math.min(b, x + 10), r.f);
        for (let x = r.x0 + 6; x < r.x1 - 6; x += 14) R() < 0.5 && K.fall(x, x + 3, r.f - r.h, r.f);
        K.tag(r.x0, r.f - r.h, r.x1, r.f, "arena");
      } else if (r.type === "vault") {
        K.wall(r.x0, r.f - r.h, r.x1, r.f, "brick");
        if (r.deg === 1) (K.crack(r.x0, r.f - 7, r.x0 + 3, r.f), K.crack(r.x1 - 3, r.f - 7, r.x1, r.f));
        K.tag(r.x0, r.f - r.h, r.x1, r.f, "treasure");
      } else if (r.type === "vent") {
        K.wind(r.x0 + 1, r.x1 - 1, r.f - r.h + 2, r.f);
      } else if (r.type === "pocket") K.tag(r.x0, r.f - r.h, r.x1, r.f, R() < 0.4 ? "treasure" : "rest");
    },
  });
  K.deep(416, 1010);
  return rooms;
}


// 둥근 방 (평평한 바닥 띠를 끝까지 — 옆문이 바닥에 닿게)
function roundRoom(K, r, rough = 0.1) {
  K.ell(r.cx, r.f - r.h * 0.5, (r.x1 - r.x0) / 2, r.h * 0.55, -1, rough);
  K.rock(r.x0 - 3, r.f, r.x1 + 3, r.f + 5);
  K.air(r.x0, r.f - 8, r.x1, r.f);
}
// 종류 고르기 표: [종류, 무게, [폭], [높이]]
function picker(R, TYPES) {
  const tot = TYPES.reduce((a, t) => a + t[1], 0);
  return () => {
    let u = R() * tot;
    for (const [type, w, [w0, w1], [h0, h1]] of TYPES) if ((u -= w) <= 0) return { type, w: w0 + Math.floor(R() * (w1 - w0)), h: h0 + Math.floor(R() * (h1 - h0)) };
    const t = TYPES[0];
    return { type: t[0], w: t[2][0], h: t[3][0] };
  };
}
// 구불구불한 관: 가운데 점을 흔들되 기울기는 넘지 않게
function tube(K, a, b, h, amp = 1.5) {
  const dx = b.x - a.x, dy = b.f - a.f, room = Math.max(0, 0.85 * dx / 2 - Math.abs(dy) / 2);
  const mid = [Math.round((a.x + b.x) / 2), Math.round((a.f + b.f) / 2 + (K.R() * 2 - 1) * Math.min(room, 10))];
  K.wiggle([[a.x, a.f], mid, [b.x + 1, b.f]], h, amp);
}

// ══════════════════════════════════════════════════════════════
// 루트홀로우 「뿌리 속」: 지도 가운데를 위에서 아래까지 꿰뚫는 거대한 속 빈 고목 + 그 둘레 뿌리 굴 미로
//   고목 속: 층마다 자리·폭이 다른 방(왼쪽·오른쪽·통째), 뿌리 밧줄과 덩굴 벽으로 오른다, 맨 위 = ▲
//   뿌리 굴: 둥근 굴방을 구불구불한 관이 잇는다 (세로는 뿌리 밧줄, 가끔 포자 분출구)
//   방 종류: 굴방(늘어진 덩굴) · 밧줄 숲(천장에서 뿌리가 빽빽이) · 포자 분출구(뿜어야 닿는 높은 턱)
//            · 뿌리 웅덩이 · 썩은 둥지(무너지는 뿌리 판·떨어지는 가시) · 뿌리 벽 뒤 숨은 굴
// ══════════════════════════════════════════════════════════════
function roothollow(K) {
  const { NX, R } = K;
  const EN = 600, TX0 = 486, TX1 = 602;
  K.mat(TX0 - 6, 24, TX1 + 6, 748, "wood");
  // 고목 속 방: [바닥, 0 통째 · 1 왼쪽 · 2 오른쪽]
  const FL = [[70, 0], [126, 1], [180, 2], [238, 0], [292, 1], [356, 2], [418, 0], [478, 1], [540, 2], [600, 0], [664, 1], [728, 2]];
  const span = (k) => (k === 0 ? [TX0 + 6, TX1 - 6] : k === 1 ? [TX0 + 6, TX0 + 76] : [TX1 - 76, TX1 - 6]);
  let prevF = 30;
  const fixed = [];
  FL.forEach(([f, k], i) => {
    const [a, b] = span(k), h = f - prevF - 5;
    K.air(a, f - h, b, f);
    K.wall(a, f - h, b, f, "wood");
    // 덩굴 벽 (한쪽 안벽을 타고 오른다)
    i > 0 && K.vine(i % 2 ? a : b - 3, i % 2 ? a + 3 : b, f - h, f);
    K.tag(a, f - h, b, f, i === 0 ? "rest" : i % 4 === 2 ? "treasure" : "arena");
    // 중간 선반 (높은 방)
    if (h > 34) {
      const sx = k === 2 ? a + 4 : b - 22;
      K.plank(sx, sx + 18, f - Math.floor(h / 2));
      K.rope(k === 2 ? sx + 16 : sx + 2, f - Math.floor(h / 2) - 2, f);
    }
    // 위층과 잇는 뿌리 밧줄 (두 방이 겹치는 자리)
    if (i > 0) {
      const [pa, pb] = span(FL[i - 1][1]), x = Math.round((Math.max(a, pa) + Math.min(b, pb)) / 2) + (i % 3) * 4 - 4;
      K.air(x - 2, prevF, x + 2, f - h + 1);
      K.plank(x - 2, x + 2, prevF);
      K.rope(x, prevF - 3, f);
    }
    // 바깥으로 난 가지 문 (서·동 번갈아)
    if (i >= 1 && i <= 10) {
      const west = i % 2 === 1;
      if (west && k !== 2) (K.air(TX0 - 7, f - 8, TX0 + 7, f), fixed.push({ id: "BW" + i, x0: TX0 - 36, x1: TX0 - 7, f, h: 9, type: "door" }));
      if (!west && k !== 1) (K.air(TX1 - 7, f - 8, TX1 + 7, f), fixed.push({ id: "BE" + i, x0: TX1 + 7, x1: TX1 + 36, f, h: 9, type: "door" }));
    }
    prevF = f;
  });
  K.peak(544, 70);
  fixed.push({ id: "EL", x0: 0, x1: 34, f: EN, h: 9, type: "door" }, { id: "ER", x0: NX - 34, x1: NX, f: EN, h: 9, type: "door" }, { id: "DP", x0: 396, x1: 436, f: 1012, h: 12, type: "bulb" });
  network(K, {
    fixed, n: 240, margin: 5, top: 30, bot: 1032, vw: 1.3, extra: 2, maxLen: 100, loopP: 0.8, tries: 14000,
    reserve: [{ x0: TX0 - 8, x1: TX1 + 8, f: 752, h: 732 }],
    pick: picker(R, [["bulb", 7, [20, 48], [14, 26]], ["hall", 4, [40, 90], [10, 14]], ["grove", 2, [30, 56], [32, 46]], ["spore", 2, [22, 34], [26, 36]], ["pond", 2, [30, 56], [14, 20]], ["nest", 2, [28, 44], [14, 20]], ["hollow", 2, [12, 18], [9, 11]]]),
    shape(K, r) {
      if (r.type === "door") return void K.air(r.x0, r.f - r.h, r.x1, r.f);
      roundRoom(K, r, r.type === "hall" ? 0.05 : 0.12);
    },
    link(K, a, b, kind) {
      if (kind === "h") return void tube(K, a, b, 8, 1.5);
      const vert = (x, up, lo) => {
        // 짧은 세로 굴은 가끔 포자 분출구 (뿜을 때 타고 오른다), 아니면 뿌리 밧줄
        if (lo - up < 80 && K.R() < 0.3) {
          K.air(x - 3, up - 1, x + 3, lo);
          K.geyser(x - 3, x + 3, up - 4, lo, { tint: 0xb8ff80, pow: 520 });
        } else {
          K.air(x - 2, up, x + 2, lo);
          K.plank(x - 2, x + 2, up);
          K.rope(x, up - 3, lo);
        }
      };
      if (kind === "v") return void vert(a.x, a.f, b.f);
      const mx = a.x + 3 + Math.floor(K.R() * Math.max(1, b.x - a.x - 6));
      K.wiggle([[a.x, a.f], [mx + 4, a.f]], 8, 1);
      K.wiggle([[mx - 3, b.f], [b.x + 1, b.f]], 8, 1);
      vert(mx, Math.min(a.f, b.f), Math.max(a.f, b.f));
    },
    inside(K, r) {
      const R = K.R, top = r.f - Math.round(r.h * 1.05);
      if (r.type === "bulb" || r.type === "hall") {
        R() < 0.5 && r.h > 14 && K.vine(Math.round(r.cx) - 1, Math.round(r.cx) + 1, top + 2, r.f - 3);
        K.tag(r.x0, r.f - r.h, r.x1, r.f, R() < 0.25 ? "treasure" : R() < 0.5 ? "rest" : "arena");
      } else if (r.type === "grove") {
        // 천장에서 늘어진 뿌리 밧줄 숲 + 높은 선반
        for (let x = r.x0 + 5; x < r.x1 - 4; x += 8 + Math.floor(R() * 6)) {
          let y = r.f - 8;
          while (y > 2 && K.get(x, y - 1) === -1) y--;
          K.rope(x, y, r.f - 3 - Math.floor(R() * 8));
        }
        const sx = R() < 0.5 ? r.x0 + 3 : r.x1 - 14;
        K.plank(sx, sx + 11, r.f - r.h + 8);
        K.tag(sx, r.f - r.h, sx + 11, r.f - r.h + 8, "treasure");
        K.tag(r.x0, r.f - r.h, r.x1, r.f, "arena");
      } else if (r.type === "spore") {
        const cx = Math.round(r.cx);
        K.geyser(cx - 3, cx + 3, top + 4, r.f, { tint: 0xc8ff90, pow: 560 });
        const left = R() < 0.5, sx = left ? cx - 15 : cx + 4;
        K.rock(sx, r.f - r.h + 10, sx + 11, r.f - r.h + 13);
        K.tag(sx, r.f - r.h, sx + 11, r.f - r.h + 10, "treasure");
      } else if (r.type === "pond") {
        K.air(r.x0 + 6, r.f, r.x1 - 6, r.f + 5);
        K.water(r.x0 + 6, r.f, r.x1 - 6, r.f + 5);
        K.tag(r.x0, r.f - r.h, r.x1, r.f, "rest");
      } else if (r.type === "nest") {
        const a = r.x0 + 7, b = r.x1 - 7;
        K.air(a, r.f, b, r.f + 6);
        for (let x = a; x < b; x += 15) K.crumble(x, Math.min(b, x + 9), r.f);
        for (let x = r.x0 + 6; x < r.x1 - 6; x += 12) R() < 0.5 && K.fall(x, x + 3, top + 2, r.f);
        K.tag(r.x0, r.f - r.h, r.x1, r.f, "arena");
      } else if (r.type === "hollow") {
        K.wall(r.x0, r.f - r.h, r.x1, r.f, "wood");
        if (r.deg === 1) (K.crack(r.x0, r.f - 7, r.x0 + 3, r.f), K.crack(r.x1 - 3, r.f - 7, r.x1, r.f));
        K.tag(r.x0, r.f - r.h, r.x1, r.f, "treasure");
      }
    },
  });
  K.deep(416, 1012);
}

// ══════════════════════════════════════════════════════════════
// 드립스톤 「수몰 사원」: 거대한 공동 여러 개 — 공동마다 종유석 바위 턱이 빽빽한 정글짐
//   가운데 대공동: 호수 위에 선 물에 잠긴 사원 (층 사이를 세로 물길로 헤엄쳐 오른다), 사원 탑 꼭대기 = ▲
//   방 종류: 대공동(바위 턱 그물·떨어지는 종유석·바닥 웅덩이·간헐천) · 석회 굴 · 지하 호수(섬 턱)
//            · 폭포 굴뚝(세로 물기둥으로 헤엄쳐 오르면 높은 턱) · 긴 회랑
//   잇기: 넓은 비탈 굴, 세로는 폭포(헤엄쳐 오른다) 또는 물기둥 간헐천
// ══════════════════════════════════════════════════════════════
function ledges(K, x0, x1, f, top, R, n) {
  // 바위 턱 덤불: 바닥에서 시작해 이미 놓인 턱 위로 가지 치듯 자란다 (한 번 뛰어 닿는 거리) — 줄 맞춘 격자가 아니다
  const L = [{ x: x0 + (x1 - x0) * 0.25, w: 0, y: f }, { x: x0 + (x1 - x0) * 0.7, w: 0, y: f }];
  const want = n ?? Math.round(((x1 - x0) * (f - top)) / 260);
  const fits = (x, y, w) => {
    if (x < x0 || x + w > x1 || y < top + 4) return false;
    for (let yy = y - 6; yy < y + 4; yy++) for (let xx = x - 2; xx < x + w + 2; xx++) if (K.get(xx, yy) !== -1) return false;
    return true;
  };
  for (let t = 0; t < want * 30 && L.length < want + 2; t++) {
    const b = L[Math.floor(R() * L.length)];
    const w = 8 + Math.floor(R() * 12), dy = 5 + Math.floor(R() * 4);
    const side = R() < 0.5 ? -1 : 1, gap = Math.floor(R() * 10) - 3;
    const x = Math.round(side < 0 ? b.x - gap - w : b.x + b.w + gap), y = b.y - dy;
    if (!fits(x, y, w)) continue;
    // 두께: 넓은 턱은 아래로 처진 종유 바위
    K.rock(x, y, x + w, y + 2);
    w >= 14 && K.rock(x + 3, y + 2, x + w - 3, y + 3 + Math.floor(R() * 2));
    L.push({ x, w, y });
  }
}
function dripstone(K) {
  const { NX, R } = K;
  const EN = 600;
  // ── 가운데 대공동 + 사원 ──
  const CX0 = 372, CX1 = 716, CT = 236, CF = 800;
  K.sell((CX0 + CX1) / 2, (CT + CF) / 2, (CX1 - CX0) / 2, (CF - CT) / 2, 4, -1, 0.03);
  K.air(CX0 + 14, CF - 10, CX1 - 14, CF);
  K.rock(CX0, CF, CX1, CF + 6);
  // 호수
  K.air(420, CF - 2, 668, CF + 22), K.rock(420, CF + 22, 668, CF + 26);
  K.water(420, CF, 668, CF + 22);
  // 사원 (벽돌): 탑 + 6층, 아래 두 층은 물에 잠김
  const TX0 = 484, TX1 = 604, TF = [330, 404, 474, 544, 614, 684, 754];
  K.rock(TX0, 300, TX1, CF + 22);
  K.mat(TX0, 280, TX1, CF + 22, "brick");
  K.rock(TX0 + 34, 280, TX1 - 34, 300);
  for (let i = 1; i < TF.length; i++) {
    const f = TF[i], h = f - TF[i - 1] - 8;
    K.air(TX0 + 6, f - h, TX1 - 6, f);
    K.wall(TX0 + 6, f - h, TX1 - 6, f, "brick");
    for (let x = TX0 + 18; x < TX1 - 14; x += 22) K.wall(x, f - h, x + 3, f, "stem");
    i >= 5 && K.water(TX0 + 6, f - (i === 6 ? h - 2 : 6), TX1 - 6, f);
    K.tag(TX0 + 6, f - h, TX1 - 6, f, i === 3 ? "treasure" : i === 1 ? "rest" : "arena");
    // 층 사이 세로 물길 (번갈아 양쪽) — 헤엄쳐 오른다
    const x = i === 1 ? 530 : i % 2 ? TX0 + 12 : TX1 - 16;
    K.fallw(x, TF[i - 1] - 2, x + 4, f);
    K.plank(x, x + 4, TF[i - 1]);
  }
  // 탑 꼭대기 방 (▲)
  K.air(TX0 + 36, 310, TX1 - 36, 330), K.wall(TX0 + 36, 310, TX1 - 36, 330, "brick");
  K.peak(544, 330);
  // 사원 양옆 문 (3·5층) → 대공동 바위 턱
  for (const f of [TF[3], TF[5]]) {
    K.air(TX0 - 2, f - 8, TX0 + 7, f), K.air(TX1 - 7, f - 8, TX1 + 2, f);
    // 문 밖 발코니 턱
    K.rock(TX0 - 16, f, TX0, f + 3), K.rock(TX1, f, TX1 + 16, f + 3);
    K.mat(TX0 - 16, f, TX0, f + 3, "brick"), K.mat(TX1, f, TX1 + 16, f + 3, "brick");
  }
  // 대공동 바위 턱 (사원 양옆)
  ledges(K, CX0 + 8, TX0 - 4, CF, CT + 30, R);
  ledges(K, TX1 + 4, CX1 - 8, CF, CT + 30, R);
  for (const x of [400, 440, 640, 690]) K.fall(x, x + 3, CT + 20, CF);
  // 대공동 옆문: 서·동 벽 네 높이
  const fixed = [];
  for (const [i, f] of [[0, 360], [1, 480], [2, 620], [3, 760]]) {
    const w = (CX1 - CX0) / 2, dy = (f - (CT + CF) / 2) / ((CF - CT) / 2), half = Math.round(w * Math.sqrt(Math.max(0, 1 - dy * dy)));
    const xl = Math.round((CX0 + CX1) / 2 - half), xr = Math.round((CX0 + CX1) / 2 + half);
    K.air(xl - 6, f - 9, xl + 14, f), K.rock(xl - 6, f, xl + 14, f + 3);
    K.air(xr - 14, f - 9, xr + 6, f), K.rock(xr - 14, f, xr + 6, f + 3);
    fixed.push({ id: "CW" + i, x0: xl - 34, x1: xl - 6, f, h: 10, type: "door" }, { id: "CE" + i, x0: xr + 6, x1: xr + 34, f, h: 10, type: "door" });
  }
  fixed.push({ id: "EL", x0: 0, x1: 34, f: EN, h: 10, type: "door" }, { id: "ER", x0: NX - 34, x1: NX, f: EN, h: 10, type: "door" }, { id: "DP", x0: 392, x1: 440, f: 1012, h: 14, type: "grotto" });
  network(K, {
    fixed, n: 80, margin: 9, top: 30, bot: 1032, vw: 1.3, extra: 2, maxLen: 150, loopP: 0.8,
    reserve: [{ x0: CX0 - 8, x1: CX1 + 8, f: CF + 30, h: CF - CT + 40 }],
    pick: picker(R, [["cavern", 3, [90, 170], [50, 90]], ["grotto", 7, [18, 40], [11, 18]], ["lake", 2, [60, 110], [22, 32]], ["chimney", 2, [14, 20], [50, 80]], ["gallery", 3, [50, 100], [12, 16]]]),
    shape(K, r) {
      if (r.type === "door") return void K.air(r.x0, r.f - r.h, r.x1, r.f);
      if (r.type === "chimney") {
        K.air(r.x0, r.f - r.h, r.x1, r.f);
        for (let y = r.f - r.h; y < r.f; y++) {
          const v = Math.round(Math.sin(y * 0.2 + r.x0) * 1.5);
          v > 0 ? K.air(r.x1, y, r.x1 + v, y + 1) : K.rock(r.x1 + v, y, r.x1, y + 1);
        }
        return;
      }
      if (r.type === "cavern" || r.type === "lake") {
        K.sell(r.cx, r.f - r.h * 0.5, (r.x1 - r.x0) / 2, r.h * 0.52, 3.2, -1, 0.03);
        K.rock(r.x0 - 3, r.f, r.x1 + 3, r.f + 5);
        K.air(r.x0, r.f - 8, r.x1, r.f);
        return;
      }
      roundRoom(K, r, 0.12);
    },
    link(K, a, b, kind) {
      const h = 9 + Math.floor(K.R() * 3);
      if (kind === "h") return void tube(K, a, b, h, 1);
      const vert = (x, up, lo) => {
        if (lo - up < 70 && K.R() < 0.35) {
          K.air(x - 3, up - 1, x + 3, lo);
          K.geyser(x - 3, x + 3, up - 4, lo, { tint: 0xa8e0ff, pow: 560 });
        } else {
          K.fallw(x - 2, up - 2, x + 2, lo);
          K.plank(x - 2, x + 2, up);
        }
      };
      if (kind === "v") return void vert(a.x, a.f, b.f);
      const mx = a.x + 3 + Math.floor(K.R() * Math.max(1, b.x - a.x - 6));
      K.wiggle([[a.x, a.f], [mx + 4, a.f]], h, 1);
      K.wiggle([[mx - 3, b.f], [b.x + 1, b.f]], h, 1);
      vert(mx, Math.min(a.f, b.f), Math.max(a.f, b.f));
    },
    inside(K, r) {
      const R = K.R, top = r.f - Math.round(r.h * 1.05);
      if (r.type === "cavern") {
        ledges(K, r.x0 + 6, r.x1 - 6, r.f, top + 4, R);
        const pw = Math.round((r.x1 - r.x0) * 0.22), cx = Math.round(r.cx);
        K.air(cx - pw, r.f, cx + pw, r.f + 6), K.water(cx - pw, r.f, cx + pw, r.f + 6);
        for (let x = r.x0 + 12; x < r.x1 - 12; x += 24) R() < 0.4 && K.fall(x, x + 3, top + 3, r.f);
        R() < 0.5 && K.geyser(cx - 3, cx + 3, top + 10, r.f, { tint: 0xa8e0ff, pow: 600 });
        K.tag(r.x0, r.f - r.h, r.x1, r.f, R() < 0.5 ? "vista" : "arena");
      } else if (r.type === "lake") {
        const a = r.x0 + 6, b = r.x1 - 6;
        K.air(a, r.f, b, r.f + 10), K.water(a, r.f - 2, b, r.f + 10);
        // 물 위 섬 턱
        for (let x = a + 8; x < b - 10; x += 18 + Math.floor(R() * 8)) K.rock(x, r.f - 3, x + 7, r.f + 10);
        K.tag(r.x0, r.f - r.h, r.x1, r.f, "rest");
      } else if (r.type === "chimney") {
        // 폭포 굴뚝: 한쪽 세로 물기둥으로 헤엄쳐 오르면 꼭대기 턱
        K.fallw(r.x0 + 1, r.f - r.h + 6, r.x0 + 5, r.f);
        K.rock(r.x0 + 6, r.f - r.h + 8, r.x1, r.f - r.h + 11);
        K.tag(r.x0 + 6, r.f - r.h, r.x1, r.f - r.h + 8, "treasure");
      } else if (r.type === "grotto") {
        R() < 0.3 && r.deg === 1 && (K.crack(r.x0, r.f - 7, r.x0 + 3, r.f), K.crack(r.x1 - 3, r.f - 7, r.x1, r.f));
        K.tag(r.x0, r.f - r.h, r.x1, r.f, r.deg === 1 ? "treasure" : R() < 0.5 ? "rest" : "arena");
      } else if (r.type === "gallery") {
        for (let x = r.x0 + 8; x < r.x1 - 8; x += 18) R() < 0.35 && K.fall(x, x + 3, top + 2, r.f);
        K.tag(r.x0, r.f - r.h, r.x1, r.f, "arena");
      }
    },
  });
  K.deep(416, 1012);
}

export const ARCHI = { g0_1: ironvein, gm1_1: roothollow, g1_1: dripstone };
