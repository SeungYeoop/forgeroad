// 격자 지도 — 7×7 칸, 가운데가 거점. 칸 하나 = 구역 하나.
// 세로는 높이: 위 3줄은 하늘(높을수록 높은 하늘), 아래 3줄은 지하(낮을수록 깊은 땅속), 가운데 줄은 지상.
// 가로는 바이옴: 지상 줄은 칸마다 다른 땅이고, 하늘·지하 줄도 그 아래(위) 지상 땅의 색과 몬스터가 섞인다.
// 구역 안에서: 왼쪽 끝 출구 = 서쪽 칸, 오른쪽 끝 = 동쪽 칸, ▲ 문 = 위 칸(하늘 쪽), ▼ 문 = 아래 칸(지하 쪽).
// 엔진은 "거리 줄" 하나로 돌아가므로, 칸마다 줄 위에 [숨은 던전 5조각][구역 8조각] 자리를 따로 잡아 둔다.
// 난이도는 줄 위치가 아니라 거점에서 떨어진 칸 수(고리)로 정한다 (diffDist).
import { FR_REGIONS } from "./world.js";

const VT = 32, ME = 6, POCKET = 5, ZLEN = 8, N = 3;
// 원래 지역(그림 재료) 번호
const ART = { ash: 0, mist: 1, mine: 2, marsh: 3, fort: 4, frost: 5, glass: 6, spire: 7, crystal: 8, sky: 9, shadow: 10, core: 11 };
// 지상 줄: x → [그림, 이름, 형용사]
const GROUND = {
  "-3": [ART.frost, "서리 절벽", "서리"],
  "-2": [ART.marsh, "검은 늪지", "늪지"],
  "-1": [ART.mist, "이끼 숲", "이끼"],
  1: [ART.ash, "재의 들판", "잿빛"],
  2: [ART.glass, "유리 모래톱", "유리"],
  3: [ART.fort, "용암 요새", "불꽃"],
};
// 하늘·지하 줄: y → [그림, 이름, 층 이름]
const LAYER = {
  "-3": [ART.spire, "뇌운 첨탑", "높은 하늘"],
  "-2": [ART.crystal, "빛의 정원", "구름 위"],
  "-1": [ART.sky, "구름 섬", "낮은 하늘"],
  1: [ART.mine, "광맥 동굴", "얕은 지하"],
  2: [ART.shadow, "그림자 심연", "깊은 지하"],
  3: [ART.core, "용암 핵", "땅의 핵"],
};
export const LAYER_NAME = (y) => (y === 0 ? "지상" : LAYER[y][2]);
// 보스가 사는 칸 (그림 지역마다 한 곳)
const BOSS_AT = { "1,0": ART.ash, "-1,0": ART.mist, "2,0": ART.glass, "-2,0": ART.marsh, "3,0": ART.fort, "-3,0": ART.frost, "3,-1": ART.sky, "-3,-2": ART.crystal, "0,-3": ART.spire, "-3,1": ART.mine, "3,2": ART.shadow, "0,3": ART.core };

export const DANGER = [
  null,
  { name: "파랑", label: "위험 낮음", color: 0x4a90ff, css: "#6aa8ff" },
  { name: "노랑", label: "위험", color: 0xffc83a, css: "#ffd060" },
  { name: "빨강", label: "매우 위험", color: 0xff4a3a, css: "#ff7060" },
  { name: "검정", label: "숨은 던전", color: 0x9a5ad8, css: "#c090ff" },
];
export const HUB_ID = "hub";
export const ZONES = []; // 줄 위 순서 (던전·구역 모두)
export const BY_ID = {};
export const CELLS = {}; // "x,y" → 구역
export const FR_WORLD = []; // 엔진 지역 목록 (칸마다 하나: 던전 + 구역)

const key = (x, y) => `${x},${y}`;
const lerp = (a, b, t) => {
  const c = (s) => [(s >> 16) & 255, (s >> 8) & 255, s & 255];
  const [r1, g1, b1] = c(a), [r2, g2, b2] = c(b);
  return (Math.round(r1 + (r2 - r1) * t) << 16) | (Math.round(g1 + (g2 - g1) * t) << 8) | Math.round(b1 + (b2 - b1) * t);
};
function mixPal(a, b, t) {
  const o = {};
  for (const k of Object.keys(a)) o[k] = Array.isArray(a[k]) ? a[k].map((v, i) => lerp(v, b[k]?.[i] ?? v, t)) : typeof a[k] === "number" ? lerp(a[k], b[k] ?? a[k], t) : a[k];
  return o;
}
const hash = (...a) => {
  let h = 2166136261 >>> 0;
  for (const v of a) for (const ch of String(v)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995) >>> 0;
  return (h ^ (h >>> 15)) >>> 0;
};
export const roll = (...a) => hash(...a) / 4294967296;

// ── 만들기 ──────────────────────────────────────────
(function build() {
  const cells = [];
  for (let y = -N; y <= N; y++) for (let x = -N; x <= N; x++) (x || y) && cells.push([x, y]);
  // 줄 위 순서: 안쪽 고리부터
  const ring = ([x, y]) => Math.max(Math.abs(x), Math.abs(y));
  cells.sort((a, b) => ring(a) - ring(b) || Math.atan2(a[1], a[0]) - Math.atan2(b[1], b[0]));
  let c = 2; // 0~1 조각은 비워 둔다 (탐험 시작 직후 잠깐 서 있는 자리)
  for (const [x, y] of cells) {
    const r = ring([x, y]);
    // 고리 안 세부 난이도 0~11 (드롭 등급·재료·적 세기 기준)
    const lvl = Math.min(11, (r - 1) * 4 + Math.min(3, Math.abs(x) + Math.abs(y) - r));
    const g = GROUND[x], L = LAYER[y];
    const artI = y === 0 ? g[0] : L[0];
    const art = FR_REGIONS[artI];
    const colArt = g ? FR_REGIONS[g[0]] : null;
    const name = y === 0 ? g[1] : x === 0 ? L[1] : `${g[2]} ${L[1]}`;
    const bossArt = BOSS_AT[key(x, y)];
    const id = `g${x}_${y}`.replace(/-/g, "m");
    const d = { id: `d_${id}`, kind: "dungeon", x, y, ring: r, lvl, c0: c, c1: c + POCKET, name: `${name} 숨은 던전`, short: "숨은 던전" };
    const z = { id, kind: "zone", x, y, ring: r, lvl, c0: c + POCKET, c1: c + POCKET + ZLEN, name, short: name, boss: bossArt != null, art: artI };
    c += POCKET + ZLEN;
    ZONES.push(d, z);
    CELLS[key(x, y)] = z;
    // 엔진용 지역
    const enemies = [...art.enemies];
    colArt && colArt !== art && enemies.push(...colArt.enemies.slice(0, 4).map((e) => ({ id: e.id, w: Math.max(1, e.w - 1) })));
    const reg = {
      ...art,
      id: `w_${id}`,
      bgId: art.id,
      src: art.id,
      srcIdx: artI,
      name,
      sub: "",
      start: d.c0 * VT - ME,
      end: z.c1 * VT - ME,
      boss: bossArt != null ? FR_REGIONS[bossArt].boss : null,
      enemies,
      pal: colArt && y !== 0 ? mixPal(art.pal, colArt.pal, 0.35) : art.pal,
      idx: lvl,
      ceiling: y > 0 ? Math.max(0.75, art.ceiling ?? 0) : y < 0 ? 0 : art.ceiling,
      patterns: y < 0 ? { ...art.patterns, floating: (art.patterns.floating ?? 0) + 4, platforms: (art.patterns.platforms ?? 0) + 2 } : art.patterns,
      density: 2.3 + lvl * 0.07,
      eliteChance: 0.06 + lvl * 0.008,
      zone: z,
    };
    FR_WORLD.push(reg);
    z.reg = d.reg = reg;
  }
  for (const z of ZONES) BY_ID[z.id] = z;
})();

// ── 찾기 ────────────────────────────────────────────
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
export const dangerOf = (z) => DANGER[z.kind === "dungeon" ? 4 : z.ring];
export const cell = (x, y) => (x === 0 && y === 0 ? HUB_ID : CELLS[key(x, y)] ?? null);
export const pocketOf = (z) => BY_ID[`d_${z.id}`];
export const zoneOfPocket = (d) => BY_ID[d.id.slice(2)];
// 난이도용 거리: 고리 안 세부 난이도(lvl) → 원래 지역 구간의 거리
export function diffDist(A) {
  const z = zoneAtTile(Math.floor(A) + ME);
  if (!z) return A;
  const R = FR_REGIONS[z.lvl], reg = z.reg;
  const f = Math.max(0, Math.min(1, (A - reg.start) / Math.max(1, reg.end - reg.start)));
  return R.start + f * (R.end - R.start) + (z.kind === "dungeon" ? 150 : 0);
}

// ── 문 ──────────────────────────────────────────────
// 위·아래 문은 구역 3분의 1, 3분의 2 지점 조각에
export const upChunk = (z) => z.c0 + 2;
export const downChunk = (z) => z.c1 - 4;
// 이번 탐험의 무작위 내용물
let RUN_SEED = 0;
export const setRunSeed = (s) => (RUN_SEED = s >>> 0);
// 숨은 던전: 바깥 고리일수록 잘 나온다
export const hasDungeon = (z) => z.kind === "zone" && roll(RUN_SEED, "dg", z.id) < 0.12 + z.ring * 0.06;
// 숨은 던전 입구는 위·아래 문 사이 조각에
export const dungeonChunk = (z) => z.c0 + 3;
export const packChunk = (z) => (z.kind === "zone" && roll(RUN_SEED, "pk", z.id) < 0.35 ? z.c0 + 1 + (hash(RUN_SEED, "pkc", z.id) % (ZLEN - 3)) : -1);
export const waystoneOk = (z) => z?.kind === "zone" && z.ring >= 2 && roll(RUN_SEED, "ws", z.id) < 0.5;
export function chestRoll(c, k, tier) {
  const z = zoneAtChunk(c);
  if (!z) return tier;
  if (z.kind === "dungeon") return Math.max(1, tier);
  if (roll(RUN_SEED, "ch", c, k) < 0.3) return null;
  const q = roll(RUN_SEED, "ct", c, k) + (z.ring - 1) * 0.06;
  return q > 0.95 ? 2 : q > 0.68 ? 1 : 0;
}
// 구역의 출구 목록: [{at: "L"|"R"|"U"|"D"|"DG", to: 구역 id | HUB_ID, back: 도착할 자리}]
export function exitList(z) {
  if (z.kind === "dungeon") {
    const host = zoneOfPocket(z);
    return [{ at: "L", to: host.id, back: "DG" }, { at: "R", to: host.id, back: "DG" }];
  }
  const out = [];
  const W = cell(z.x - 1, z.y), E = cell(z.x + 1, z.y), U = cell(z.x, z.y - 1), D = cell(z.x, z.y + 1);
  W && out.push({ at: "L", to: W.id ?? W, back: "R" });
  E && out.push({ at: "R", to: E.id ?? E, back: "L" });
  U && out.push({ at: "U", to: U.id ?? U, back: "D" });
  D && out.push({ at: "D", to: D.id ?? D, back: "U" });
  hasDungeon(z) && out.push({ at: "DG", to: pocketOf(z).id, back: "L" });
  return out;
}

// ── 지도 그리기 (Hud 위에 겹친다) ─────────────────────
export function drawMap(hud, R, cur, seen, extra = {}) {
  const { ot: W, xt: H, ct } = R;
  const objs = [];
  const add = (o, d = 0) => (objs.push(o), o.setScrollFactor?.(0), o.setDepth(460 + d), o);
  add(hud.add.rectangle(0, 0, W, H, 0x06050a, 0.95).setOrigin(0).setInteractive());
  add(hud.add.rectangle(10, 10, W - 20, H - 20).setOrigin(0).setStrokeStyle(1, 0x7a5434));
  add(ct(hud, 20, 14, "구역 지도", "big", "#f2e6c4"));
  add(ct(hud, W - 20, 18, "[M] 닫기", "tiny", "#a89070").setOrigin(1, 0));
  const CW = 66, CH = 38, CX = W / 2 + 30, CY = H / 2 + 8;
  const P = (x, y) => [CX + x * CW, CY + y * CH];
  const g = add(hud.add.graphics(), 1);
  const here = cur?.kind === "dungeon" ? zoneOfPocket(cur) : cur;
  // 층 이름 (왼쪽)
  for (let y = -N; y <= N; y++) {
    const [, py] = P(-N, y);
    add(ct(hud, CX - N * CW - CW / 2 - 8, py - 5, LAYER_NAME(y), "tiny", y < 0 ? "#9cc8ff" : y > 0 ? "#d0a070" : "#c8e090").setOrigin(1, 0), 2);
  }
  // 칸
  for (let y = -N; y <= N; y++)
    for (let x = -N; x <= N; x++) {
      const [px, py] = P(x, y);
      const w = CW - 6, h = CH - 6;
      if (!x && !y) {
        g.fillStyle(0x4a3418, 1).fillRect(px - w / 2, py - h / 2, w, h);
        g.lineStyle(2, 0xffe08a, 1).strokeRect(px - w / 2, py - h / 2, w, h);
        add(ct(hud, px, py - 6, "거점", "small", "#ffe08a").setOrigin(0.5, 0), 2);
        continue;
      }
      const z = CELLS[key(x, y)], D = dangerOf(z), s = seen[z.id];
      g.fillStyle(D.color, s ? 0.55 : 0.18).fillRect(px - w / 2, py - h / 2, w, h);
      g.lineStyle(1, D.color, s ? 1 : 0.5).strokeRect(px - w / 2, py - h / 2, w, h);
      z.boss && (g.fillStyle(0x140e18, 1).fillRect(px + w / 2 - 9, py - h / 2 + 2, 7, 7), g.fillStyle(0xff6050, 1).fillRect(px + w / 2 - 8, py - h / 2 + 3, 5, 5));
      extra.dungeons?.includes(z.id) && g.fillStyle(DANGER[4].color, 1).fillTriangle(px - w / 2 + 3, py - h / 2 + 10, px - w / 2 + 11, py - h / 2 + 10, px - w / 2 + 7, py - h / 2 + 3);
      const nm = s || here === z ? z.short : "?";
      const two = nm.length > 6 && nm.includes(" ");
      add(ct(hud, px, py, two ? nm.replace(" ", "\n") : nm, "tiny", s ? "#f2e6c4" : "#8a7a6a", { align: "center", stroke: "#140e18", strokeThickness: 2 }).setOrigin(0.5, 0.5), 2);
      if (here === z) {
        const ring = add(hud.add.rectangle(px, py, w + 4, h + 4).setStrokeStyle(2, 0xffffff), 3);
        hud.tweens.add({ targets: ring, alpha: 0.2, duration: 600, yoyo: !0, repeat: -1 });
      }
    }
  // 범례
  let lx = 20;
  for (const D of DANGER.slice(1)) {
    g.fillStyle(D.color, 1).fillRect(lx, H - 27, 8, 8);
    const t = add(ct(hud, lx + 12, H - 30, `${D.name} · ${D.label}`, "tiny", D.css), 2);
    lx += t.width + 24;
  }
  add(ct(hud, W - 20, H - 30, "■ 보스  ▲ 숨은 던전", "tiny", "#a89070").setOrigin(1, 0), 2);
  cur && add(ct(hud, 20, 36, `현재: ${cur.name} · ${LAYER_NAME(cur.y)} · ${dangerOf(cur).name} ${dangerOf(cur).label}`, "small", dangerOf(cur).css), 2);
  return objs;
}
