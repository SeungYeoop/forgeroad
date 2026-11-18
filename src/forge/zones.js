// 구역 지도 — 끝없는 거리 줄을 "구역" 칸으로 잘라 쓴다.
// 지역(0~11)마다 맡은 거리 구간 = [숨은 던전 5조각] + [구역 2~3개]. 구역 끝은 절벽 벽으로 막히고,
// 출구(왼쪽·오른쪽 끝)와 관문(구역 중간)으로 지도상 이웃 구역에 순간이동한다.
// 거점을 가운데 두고 동·북·남·서 네 갈래로 뻗으며, 바깥 고리일수록 위험하다.
const VT = 32, ME = 6, POCKET = 5;
export const ARMS = [
  { name: "동쪽", dx: 1, dy: 0, px: 0, py: -1 },
  { name: "북쪽", dx: 0, dy: -1, px: -1, py: 0 },
  { name: "남쪽", dx: 0, dy: 1, px: 1, py: 0 },
  { name: "서쪽", dx: -1, dy: 0, px: 0, py: 1 },
];
// 고리 순서 (지도에서 이웃한 갈래): 동 → 북 → 서 → 남 → 동
const CYCLE = [0, 1, 3, 2];
export const DANGER = [
  { name: "파랑", label: "위험 낮음", color: 0x4a90ff, css: "#6aa8ff" },
  { name: "노랑", label: "위험", color: 0xffc83a, css: "#ffd060" },
  { name: "빨강", label: "매우 위험", color: 0xff4a3a, css: "#ff7060" },
  { name: "검정", label: "숨은 던전", color: 0x9a5ad8, css: "#c090ff" },
];
const ROMAN = ["Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ"];

export const ZONES = []; // 거리 순서
export const BY_ID = {};
const START = []; // 갈래별 첫 구역 id
const regionZones = []; // 지역별 일반 구역 id 목록
export const HUB_ID = "hub";

const hash = (...a) => {
  let h = 2166136261 >>> 0;
  for (const v of a) for (const ch of String(v)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995) >>> 0;
  return (h ^ (h >>> 15)) >>> 0;
};
export const roll = (...a) => hash(...a) / 4294967296;

export function buildZones(regions) {
  if (ZONES.length) return;
  regions.slice(0, 12).forEach((reg, r) => {
    const c0 = Math.floor((ME + reg.start) / VT), c1 = Math.floor((ME + reg.end) / VT);
    const ring = Math.floor(r / 4), arm = r % 4;
    const dz = { id: `d${r}`, r, ring, arm, kind: "dungeon", c0, c1: c0 + POCKET, name: `${reg.name} 숨은 던전`, short: "숨은 던전", region: reg, L: null, R: null, gates: [] };
    ZONES.push(dz);
    const len = c1 - (c0 + POCKET), n = Math.max(1, Math.round(len / 8));
    const ids = [];
    let a = c0 + POCKET;
    for (let i = 0; i < n; i++) {
      const b = i === n - 1 ? c1 : a + Math.floor(len / n);
      const boss = i === n - 1;
      const branch = n === 3 && i === 1;
      const z = { id: `z${r}_${i}`, r, ring, arm, i, kind: "zone", c0: a, c1: b, boss, branch, region: reg, L: null, R: null, gates: [] };
      z.name = `${reg.name} ${ROMAN[i]}${boss ? " · 보스" : branch ? " · 외곽" : ""}`;
      z.short = `${reg.name} ${ROMAN[i]}`;
      ZONES.push(z);
      ids.push(z.id);
      a = b;
    }
    regionZones[r] = ids;
  });
  for (const z of ZONES) BY_ID[z.id] = z;
  // 연결
  const link = (a, sa, b, sb) => {
    const put = (z, side, other) => {
      if (side === "L" || side === "R") z[side] = { to: other };
      else z.gates.push({ to: other });
    };
    put(a, sa, b.id ?? b), b.id && put(b, sb, a.id);
  };
  const freeSide = (z) => (!z.R ? "R" : "G");
  for (let d = 0; d < 4; d++) {
    let prevBoss = null;
    for (let ring = 0; ring < 3; ring++) {
      const r = ring * 4 + d;
      const zs = regionZones[r].map((id) => BY_ID[id]);
      const z0 = zs[0], last = zs[zs.length - 1];
      if (ring === 0) ((z0.L = { to: HUB_ID }), (START[d] = z0.id));
      else link(prevBoss, "R", z0, "L");
      if (zs.length === 3) (link(z0, "R", last, "L"), link(z0, "G", zs[1], "L"));
      else if (zs.length === 2) link(z0, "R", last, "L");
      prevBoss = last;
    }
  }
  // 고리 연결: 갈래의 외곽(없으면 첫 구역) → 다음 갈래의 첫 구역
  for (let ring = 0; ring < 3; ring++)
    for (let k = 0; k < 4; k++) {
      const d = CYCLE[k], e = CYCLE[(k + 1) % 4];
      const zs = regionZones[ring * 4 + d].map((id) => BY_ID[id]);
      const from = zs.length === 3 ? zs[1] : zs[0];
      const to = BY_ID[regionZones[ring * 4 + e][0]];
      link(from, freeSide(from), to, "G");
    }
  // 지도 위치
  for (let d = 0; d < 4; d++) {
    const A = ARMS[d];
    let s = 1;
    for (let ring = 0; ring < 3; ring++) {
      const zs = regionZones[ring * 4 + d].map((id) => BY_ID[id]);
      zs[0].pos = [A.dx * s, A.dy * s];
      if (zs.length === 3) ((zs[1].pos = [A.dx * s + A.px, A.dy * s + A.py]), (zs[2].pos = [A.dx * (s + 1), A.dy * (s + 1)]), (s += 2));
      else if (zs.length === 2) ((zs[1].pos = [A.dx * (s + 1), A.dy * (s + 1)]), (s += 2));
      else s += 1;
    }
  }
}
export const startZone = (arm) => BY_ID[START[arm]];
export const dangerOf = (z) => DANGER[z.kind === "dungeon" ? 3 : z.ring];

// 조각 번호 → 구역
export function zoneAtChunk(c) {
  let lo = 0, hi = ZONES.length - 1;
  while (lo <= hi) {
    const m = (lo + hi) >> 1, z = ZONES[m];
    if (c < z.c0) hi = m - 1;
    else if (c >= z.c1) lo = m + 1;
    else return z;
  }
  return null;
}
export const zoneAtTile = (t) => zoneAtChunk(Math.floor(t / VT));
export const isFirst = (c) => zoneAtChunk(c)?.c0 === c;
export const isLast = (c) => zoneAtChunk(c)?.c1 - 1 === c;
export const isPocket = (c) => zoneAtChunk(c)?.kind === "dungeon";

// 관문 자리: 구역 중간 조각들에 고르게. k = 관문 번호, 마지막 칸은 숨은 던전 입구용
export function gateChunk(z, k, total) {
  const n = z.c1 - z.c0;
  return z.c0 + 1 + Math.floor(((n - 3) * (k + 1)) / (total + 1));
}
// 도착 위치 (타일 x). side: "L" | "R" | gate 번호
export function arriveTile(z, side) {
  if (side === "L") return z.c0 * VT + 5;
  if (side === "R") return z.c1 * VT - 6;
  if (side === "D") return dungeonChunk(z) * VT + 22;
  return gateChunk(z, side, gateCount(z)) * VT + 16;
}
// 이번 탐험의 숨은 던전 입구: 지역마다 45% 확률로 한 구역에
let RUN_SEED = 0;
export const setRunSeed = (s) => (RUN_SEED = s >>> 0);
export const runSeed = () => RUN_SEED;
export function dungeonHost(r) {
  if (roll(RUN_SEED, "dg", r) > 0.45) return null;
  const ids = regionZones[r];
  return BY_ID[ids[hash(RUN_SEED, "dgz", r) % ids.length]];
}
export const hasDungeon = (z) => z.kind === "zone" && dungeonHost(z.r) === z;
export const dungeonChunk = (z) => z.c0 + 1 + (hash(RUN_SEED, "dgc", z.id) % Math.max(1, z.c1 - z.c0 - 3));
export const gateCount = (z) => z.gates.length;
// 떠도는 정예 무리 (구역마다 35%)
export const packChunk = (z) => (z.kind === "zone" && roll(RUN_SEED, "pk", z.id) < 0.35 ? z.c0 + 1 + (hash(RUN_SEED, "pkc", z.id) % Math.max(1, z.c1 - z.c0 - 2)) : -1);
// 귀환 표석: 바깥 고리(노랑·빨강) 구역에서 절반 확률
export const waystoneOk = (z) => z?.kind === "zone" && z.ring >= 1 && roll(RUN_SEED, "ws", z.id) < 0.5;
// 상자: 이번 탐험마다 있을지·등급이 바뀐다
export function chestRoll(c, k, tier) {
  const z = zoneAtChunk(c);
  if (!z) return tier;
  const p = roll(RUN_SEED, "ch", c, k);
  if (z.kind === "dungeon") return Math.max(1, tier);
  if (p < 0.3) return null;
  const q = roll(RUN_SEED, "ct", c, k) + z.ring * 0.06;
  return q > 0.95 ? 2 : q > 0.68 ? 1 : 0;
}

// ── 지도 그리기 (Hud 위에 겹친다) ─────────────────────
export function drawMap(hud, R, cur, seen, extra = {}) {
  const { ot: W, xt: H, ct } = R;
  const objs = [];
  const add = (o, d = 160) => (objs.push(o), o.setScrollFactor?.(0), o.setDepth(d + 300), o);
  add(hud.add.rectangle(0, 0, W, H, 0x06050a, 0.95).setOrigin(0).setInteractive());
  add(hud.add.rectangle(10, 10, W - 20, H - 20).setOrigin(0).setStrokeStyle(1, 0x7a5434));
  add(ct(hud, 20, 14, "구역 지도", "big", "#f2e6c4"));
  add(ct(hud, W - 20, 18, "[M] 닫기", "tiny", "#a89070").setOrigin(1, 0));
  const SX = 36, SY = 23, CX = W / 2, CY = H / 2 + 4;
  const P = (z) => [CX + z.pos[0] * SX, CY + z.pos[1] * SY];
  const g = add(hud.add.graphics(), 161);
  // 선
  const drawn = new Set();
  for (const z of ZONES) {
    if (z.kind !== "zone") continue;
    const outs = [z.L, z.R, ...z.gates].filter(Boolean);
    for (const l of outs) {
      const key = [z.id, l.to].sort().join("-");
      if (drawn.has(key)) continue;
      drawn.add(key);
      const [x1, y1] = P(z);
      const [x2, y2] = l.to === HUB_ID ? [CX, CY] : P(BY_ID[l.to]);
      const known = seen[z.id] || seen[l.to];
      g.lineStyle(1, known ? 0xc8a878 : 0x4a3e34, known ? 0.8 : 0.5).lineBetween(x1, y1, x2, y2);
    }
  }
  // 거점
  g.fillStyle(0xffe08a, 1).fillCircle(CX, CY, 7);
  g.lineStyle(2, 0x2a1408, 1).strokeCircle(CX, CY, 7);
  add(ct(hud, CX - 10, CY - 10, "거점", "tiny", "#ffe08a", { stroke: "#140e18", strokeThickness: 3 }).setOrigin(1, 1), 163);
  for (const z of ZONES) {
    if (z.kind !== "zone") continue;
    const [x, y] = P(z);
    const D = dangerOf(z);
    const s = seen[z.id], here = cur && cur.id === z.id;
    const r = z.boss ? 6 : 5;
    g.fillStyle(D.color, s ? 1 : 0.35);
    z.boss ? g.fillRect(x - r, y - r, r * 2, r * 2) : g.fillCircle(x, y, r);
    g.lineStyle(1, 0x140e18, 1);
    z.boss ? g.strokeRect(x - r, y - r, r * 2, r * 2) : g.strokeCircle(x, y, r);
    if (here) {
      const ring = add(hud.add.circle(x, y, 10).setStrokeStyle(2, 0xffffff), 164);
      hud.tweens.add({ targets: ring, scale: 1.5, alpha: 0.2, duration: 700, repeat: -1 });
    }
    // 이번 탐험에서 알게 된 숨은 던전
    if (extra.dungeons?.includes(z.id)) {
      g.fillStyle(DANGER[3].color, 1).fillTriangle(x + 6, y - 9, x + 11, y - 2, x + 1, y - 2);
    }
    const side = z.pos[0] === 0;
    const up = !side && Math.abs(z.pos[0]) % 2 === 0;
    if (s || here) add(ct(hud, side ? x + 9 : x, side ? y - 5 : up ? y - 7 : y + 7, z.short, "tiny", here ? "#ffffff" : "#d8c8a8", { stroke: "#140e18", strokeThickness: 2 }).setOrigin(side ? 0 : 0.5, up ? 1 : 0), 163);
  }
  // 범례
  let lx = 20;
  for (const D of DANGER) {
    g.fillStyle(D.color, 1).fillCircle(lx + 5, H - 24, 4);
    const t = add(ct(hud, lx + 12, H - 30, `${D.name} · ${D.label}`, "tiny", D.css), 163);
    lx += t.width + 26;
  }
  add(ct(hud, W - 20, H - 30, "■ 보스 구역  · ▲ 숨은 던전", "tiny", "#a89070").setOrigin(1, 0), 163);
  cur && add(ct(hud, 20, 36, `현재: ${cur.name} · ${dangerOf(cur).name} ${dangerOf(cur).label}`, "small", dangerOf(cur).css), 163);
  return objs;
}
