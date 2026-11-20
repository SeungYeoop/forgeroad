// 하늘 설계 검사 (생성 전에): 디딤돌 길로 이을 수 있나 (가로 거리·오르내림), 섬끼리 겹침
//   node --import ./tools/json-hook.mjs tools/skycheck.mjs g0_m1
import { BLUEPRINTS } from "../src/forge/natbp.js";
const id = process.argv[2] || "g0_m1";
const bp = BLUEPRINTS[id], S = bp.sky, base = bp.skyBase ?? 4800;
const by = {};
for (const q of S.isles) {
  const x0 = q.cx - q.w / 2, x1 = q.cx + q.w / 2, hi = q.step ? q.top - q.step.dy : q.top, rz = q.step ? x0 + q.w * q.step.at : null;
  by[q.id] = { x0, x1, top: q.top, hi, rz, q };
}
const g = S.gate;
const edges = (k) => {
  // [{x, y, side}] 이을 수 있는 가장자리
  if (k.startsWith("g:")) { const x = +k.slice(2); return [{ x, y: base, s: 0 }]; }
  if (k === "G<" || k === "G>") { const m = g.inner.mouths.find((m) => m.side === (k === "G<" ? "W" : "E")); return [{ x: m.x + (m.side === "E" ? -8 : 8), y: m.F, s: m.side === "E" ? 1 : -1 }]; }
  if (k === "G") return [{ x: g.cx - g.w / 2 + 8, y: S.peakY + 16, s: -1 }, { x: g.cx + g.w / 2 - 8, y: S.peakY + 16, s: 1 }];
  const m = k.match(/^(.*?)([<>^]?)$/), I = by[m[1]];
  if (!I) return null;
  if (m[2] === "<" || m[2] === ">") { const mo = I.q.inner?.mouths?.find((v) => v.side === (m[2] === ">" ? "E" : "W")); if (!mo) return null; const ex = mo.edge ?? mo.x; return [{ x: ex + (mo.side === "E" ? -8 : 8), y: mo.F, s: mo.side === "E" ? 1 : -1 }]; }
  if (m[2] === "^") { const st = I.q.step; return st.hi === "L" ? [{ x: I.x0 + 8, y: I.hi + 16, s: -1 }, { x: I.rz - 8, y: I.hi + 16, s: 1 }] : [{ x: I.rz + 8, y: I.hi + 16, s: -1 }, { x: I.x1 - 8, y: I.hi + 16, s: 1 }]; }
  const lo = I.q.step ? (I.q.step.hi === "L" ? [{ x: I.x1 - 8, y: I.top + 16, s: 1 }] : [{ x: I.x0 + 8, y: I.top + 16, s: -1 }]) : [{ x: I.x0 + 8, y: I.top + 16, s: -1 }, { x: I.x1 - 8, y: I.top + 16, s: 1 }];
  return lo;
};
// 디딤돌 n개(0~4): 가로 Σ틈(44~92, n+1개) + Σ(돌폭-8)(44~108, n개), 한 번에 오르내림 ≤ 80 (n=0이면 92·가로 ≤ 92)
const can = (span, rise) => {
  for (let n = Math.max(0, Math.ceil(Math.abs(rise) / 80) - 1); n <= 4; n++) {
    const lo = 44 * (n + 1) + 44 * n, hi = 92 * (n + 1) + 108 * n;
    if (n === 0 ? span >= 44 && span <= 92 && Math.abs(rise) <= 92 : span >= lo && span <= hi && Math.abs(rise) <= 80 * (n + 1)) return n;
  }
  return -1;
};
const bad = [];
for (const [a, b] of S.links) {
  const A = edges(a), B = edges(b);
  if (!A || !B) { bad.push(`없는 섬 ${a}-${b}`); continue; }
  let best = null;
  for (const p of A) for (const q of B) {
    const d = q.x > p.x ? 1 : -1;
    if ((p.s && p.s !== d) || (q.s && q.s !== -d)) continue;
    const n = can(Math.abs(q.x - p.x), p.y - q.y);
    n >= 0 && (!best || n < best.n) && (best = { n, span: Math.abs(q.x - p.x), rise: p.y - q.y });
  }
  if (!best) {
    const p = A[0], q = B[0];
    bad.push(`길 불가 ${a}-${b}: 가로 ${Math.round(Math.abs(q.x - p.x))} 높이차 ${Math.round(p.y - q.y)}`);
  }
}
// 섬 겹침 (윗면~밑면 대충 top-60 ~ top+t)
const L = Object.entries(by);
for (let i = 0; i < L.length; i++)
  for (let j = i + 1; j < L.length; j++) {
    const [ia, A] = L[i], [ib, B] = L[j];
    if (A.x0 < B.x1 + 60 && B.x0 < A.x1 + 60 && A.hi - 140 < B.top + B.q.t && B.hi - 140 < A.top + A.q.t) bad.push(`섬 겹침 ${ia} ${ib}`);
  }
for (const [k, A] of L) {
  if (A.x0 < 20 || A.x1 > 8170) bad.push(`범위 밖 ${k}`);
  if (A.top + A.q.t > base - 150 && A.x1 > 0) bad.push(`땅에 너무 붙음 ${k}`);
  const gx0 = g.cx - g.w / 2, gx1 = g.cx + g.w / 2;
  if (A.x0 < gx1 + 60 && gx0 < A.x1 + 60 && A.hi - 140 < S.peakY + (g.tS ?? 1000) && S.peakY - 200 < A.top + A.q.t) bad.push(`▲섬과 겹침 ${k}`);
}
console.log(id, "섬", S.isles.length, "길", S.links.length, "기초 땅", base);
console.log(bad.length ? bad.join("\n") : "문제 없음");
