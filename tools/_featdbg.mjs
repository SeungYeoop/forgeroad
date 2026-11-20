// 지표 구조물 디버그: 함정·못 닿는 곳 묶음 + 구역 ASCII (R 닿음, n 못 닿음, T 함정)
import { ZONES, upChunk, downChunk } from "../src/forge/zones.js";
import { makePlan } from "../src/forge/natgen.js";
import { biomeOf } from "../src/forge/terrprof.js";
globalThis.__sky = 1;
const [id = "gm1_0", sd = "1"] = process.argv.slice(2);
const z = ZONES.find((q) => q.id === id);
const o = { seed: +sd, Ft: 528, up: upChunk(z), down: downChunk(z), fe: 1, ze: 0, biome: biomeOf(z), noRepair: 1, patterns: z.y === 0 ? z.reg?.patterns : null };
const P = makePlan(z, o, 0), A = P.A, F = P.F;
console.log("check", JSON.stringify(P.check));
const T = new Set((P.check.trapsAt ?? A.traps ?? []).map?.((t) => (typeof t === "number" ? t : t.n)) ?? []);
const cl = {};
for (const t of A.traps ?? []) { const n = typeof t === "number" ? t : t.n ?? t; const x = A.nC[n] * 8, y = A.nY[n]; const k = Math.round(y / 160) * 160 + ":" + Math.round(x / 200) * 200; cl[k] = (cl[k] ?? 0) + 1; }
console.log("traps", Object.entries(cl).map(([k, v]) => k + "×" + v).join(" "));
const nodeAt = {};
const trapSet = new Set((A.traps ?? []).map((t) => (typeof t === "number" ? t : t.n ?? t)));
for (let n = 0; n < A.NN; n++) nodeAt[A.nC[n] + ":" + Math.round(A.nY[n] / 16)] = trapSet.has(n) ? "T" : A.reach[n] ? "R" : "n";
const X0 = +process.env.X0 || 800, X1 = +process.env.X1 || 1300, Y0 = +process.env.Y0 || 4150, Y1 = +process.env.Y1 || 4830;
for (let y = Y0; y < Y1; y += 16) { let row = ""; for (let x = X0; x < X1; x += 8) row += nodeAt[Math.floor(x / 8) + ":" + Math.round(y / 16)] ?? (F.solid(x, y) ? "#" : "."); console.log(y, row); }
