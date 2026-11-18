// 길찾기 그래프 ↔ 실제 충돌(finephys) 일치 검사
// 생성기가 "갈 수 있다"고 한 길(입구 → ▶·▲·▼)의 마디 사이를 실제 몸(10×22, 속도 150, 점프 500/2단 440, 중력 1500)으로
// 하나씩 움직여 본다. 걷기·여러 점프 방법 중 하나라도 되면 통과.
//   node --import ./tools/json-hook.mjs tools/natphys.mjs   (SEEDS=1,2 ZONES=g1_0,…)
import { ZONES, upChunk, downChunk, SKY_EDGE } from "../src/forge/zones.js";
import { planOf, FLOOR } from "../src/forge/natgen.js";
import { installFinePhysics } from "../src/forge/finephys.js";

class World {}
installFinePhysics(World.prototype, { gt: 16, vt: 32, Oe: 1856, fe: 1, ze: 0, plat: 2, SKY_EDGE, Ft: 116 });
function worldOf(P, z) {
  const W = new World();
  W.originChunk = z.c0;
  W.gates = new Set();
  const cache = new Map();
  W.gen = { get: (C) => cache.get(C) ?? cache.set(C, { fine: { F: P.F, x0: (C - z.c0) * 512 } }).get(C) };
  W.code = () => 0;
  W.touchCrumble = () => {};
  return W;
}
const body = (x, y) => ({ x, y, w: 10, h: 22, vx: 0, vy: 0, onGround: !1, hitWall: 0, groundCode: 0, dropThrough: 0, groundGtx: 0, groundRow: 0 });
// 길찾기가 인정한 움직임(mode)을 그대로 입력해 실제 충돌로 해 본다
//  walk: 걷기(막히면 작은 점프), 0: 달리며 1단, 1: 달리며 2단(꼭대기에서), 2: 제자리 2단 후 옆으로, 3: 제자리 1단 후 옆으로, 4: 걸어 나가 떨어지기
function replay(W, xa, ya, xb, yb, mode) {
  const dt = 1 / 60, dir = xb > xa ? 1 : -1;
  const b = body(xa, ya);
  for (let k = 0; k < 3; k++) ((b.vy = Math.min(720, b.vy + 1500 * dt)), W.move(b, dt));
  let phase = 0, air2 = 1;
  for (let t = 0; t < 3.5; t += dt) {
    const near = Math.abs(xb - b.x) < 3;
    let want = near ? 0 : Math.sign(xb - b.x);
    if (mode === 2 || mode === 3) {
      // 제자리에서 솟는 동안은 가로로 움직이지 않는다
      if (phase === 0) ((b.vy = -500), (phase = 1));
      if (mode === 2 && phase === 1 && b.vy >= 0) ((b.vy = -440), (phase = 2));
      const rising = mode === 2 ? phase < 2 || b.vy < 0 : b.vy < 0;
      rising && (want = 0);
    } else if (mode === 0 || mode === 1) {
      if (phase === 0 && b.onGround) ((b.vy = -500), (phase = 1));
      if (mode === 1 && phase === 1 && b.vy >= 0 && air2) ((b.vy = -440), air2--, (phase = 2));
    } else if (mode === "walk") {
      if (b.onGround && (W.wallAhead(b, dir) || b.hitWall === dir) && phase === 0) ((b.vy = -500), (phase = 1));
    }
    b.vx = want * (mode === "walk" ? 150 : 135);
    b.vy = Math.min(720, b.vy + 1500 * dt * (b.vy > 0 ? 1.15 : 1));
    W.move(b, dt);
    if (W.overlapAt(b, b.x, b.y)) return { ok: !1, why: "overlap" };
    if (t > 0.05 && b.onGround && Math.abs(b.x - xb) <= 10 && Math.abs(b.y - yb) <= 8) return { ok: !0 };
    if (b.y > yb + 260) break;
  }
  return { ok: !1, why: `end ${Math.round(b.x)},${Math.round(b.y)}` };
}
// 한 칸 이동을 실제로 해 본다 (인정된 움직임 그대로 → 안 되면 여러 방법)
function tryEdge(W, xa, ya, xb, yb, mode) {
  if (mode != null) {
    const r = replay(W, xa, ya, xb, yb, mode);
    if (r.ok) return { ok: !0, s: `mode ${mode}` };
  }
  const dt = 1 / 60;
  const strategies = ["run", "runLate", "up", "single", "walk", "back"];
  for (const s of strategies) {
    const b = body(xa, ya);
    // 자리 잡기
    for (let k = 0; k < 3; k++) ((b.vy = Math.min(720, b.vy + 1500 * dt)), W.move(b, dt));
    const dir = xb > xa ? 1 : -1;
    let air2 = 1, jumped = 0, t = 0, ok = !1;
    const startX = b.x;
    for (; t < 3.5; t += dt) {
      const dx = xb - b.x, near = Math.abs(dx) < 3;
      // 가로 움직임
      let want = near ? 0 : Math.sign(dx);
      if (s === "up" && jumped && b.vy < -120) want = 0;
      if (s === "back" && t < 0.25) want = -dir;
      if (s === "runLate" && !jumped && Math.abs(b.x - startX) < 6) want = dir;
      b.vx = want * 150;
      // 점프
      const rise = ya - yb;
      if (b.onGround) air2 = 1;
      const needJump = rise > 8 || Math.abs(xb - xa) > 24 || (b.onGround && W.wallAhead(b, dir));
      if (s !== "walk" && b.onGround && !jumped && needJump && (s !== "back" || t >= 0.25) && (s !== "runLate" || Math.abs(b.x - startX) >= 6)) ((b.vy = -500), (jumped = 1));
      else if (s !== "walk" && s !== "single" && !b.onGround && air2 && jumped && b.vy > -40 && b.y > yb - 30) ((b.vy = -440), air2--);
      b.vy = Math.min(720, b.vy + 1500 * dt * (b.vy > 0 ? 1.15 : 1));
      W.move(b, dt);
      if (W.overlapAt(b, b.x, b.y)) return { ok: !1, why: "overlap", s };
      if (b.onGround && Math.abs(b.x - xb) <= 10 && Math.abs(b.y - yb) <= 8) {
        ok = !0;
        break;
      }
      if (b.y > yb + 200) break;
    }
    if (ok) return { ok: !0, s, t: Math.round(t * 100) / 100 };
  }
  return { ok: !1 };
}
const seeds = (process.env.SEEDS || "1,2").split(",").map(Number);
const only = process.env.ZONES ? process.env.ZONES.split(",") : null;
let edges = 0, fails = 0;
const bad = [];
for (const seed of seeds)
  for (const z of ZONES) {
    if (only && !only.includes(z.id)) continue;
    const o = { seed, Ft: 116, up: z.kind === "zone" ? upChunk(z) : -1, down: z.kind === "zone" ? downChunk(z) : -1 };
    const P = planOf(z, o), A = P.A, W = worldOf(P, z);
    // 입구에서 각 목표까지 너비 우선 길 (부모 기록)
    const par = new Int32Array(A.NN).fill(-2);
    const q = [A.start];
    par[A.start] = -1;
    for (let h = 0; h < q.length; h++) for (const b of A.adj[q[h]] ?? []) par[b] < -1 && ((par[b] = q[h]), q.push(b));
    const X = (n) => A.nC[n] * 8 + 4;
    let zEdges = 0, zFails = 0;
    for (const g of A.goals) {
      if (g.n < 0 || par[g.n] < -1) continue;
      const path = [];
      for (let n = g.n; n >= 0; n = par[n]) path.push(n);
      path.reverse();
      for (let k = 0; k < path.length - 1; k++) {
        const a = path[k], b = path[k + 1];
        const mode = A.how(a, b);
        const r = tryEdge(W, X(a), A.nY[a], X(b), A.nY[b], mode);
        zEdges++;
        if (!r.ok) (zFails++, bad.push({ seed, zone: z.id, goal: g.id, mode, from: [X(a), A.nY[a]], to: [X(b), A.nY[b]], why: r.why }));
      }
    }
    edges += zEdges;
    fails += zFails;
    console.log(`${z.id} s${seed}: path edges ${zEdges}, physics failed ${zFails}`);
  }
console.log(`TOTAL edges ${edges}, failed ${fails} (${((100 * fails) / Math.max(1, edges)).toFixed(2)}%)`);
console.log(JSON.stringify(bad.slice(0, 25)));
