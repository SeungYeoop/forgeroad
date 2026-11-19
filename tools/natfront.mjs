// 지표 근처 도달 경계 찾기
import { ZONES, upChunk, downChunk } from "../src/forge/zones.js";
import { makePlan } from "../src/forge/natgen.js";
const [id = "g1_0"] = process.argv.slice(2);
const z = ZONES.find((q) => q.id === id);
const P = makePlan(z, { seed: 1, Ft: 528, up: upChunk(z), down: downChunk(z), fe: 1, ze: 0, noRepair: true }, 0);
const A = P.A, { nC, nY, NN, reach } = A;
const ymax = Number(process.argv[3] ?? 4810);
let best = -1;
for (let n = 0; n < NN; n++) if (reach[n] && nY[n] <= ymax && (best < 0 || nC[n] > nC[best])) best = n;
console.log("frontier", nC[best] * 8 + 4, nY[best]);
// 경계 오른쪽 300px 안 마디들의 높이
const xs = [];
for (let n = 0; n < NN; n++) { const x = nC[n] * 8 + 4; if (x > nC[best] * 8 && x < nC[best] * 8 + 400 && nY[n] < ymax) xs.push([x, nY[n], reach[n]]); }
xs.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
console.log(xs.map((q) => q.join(",")).join(" "));
// 지표 높이 h 
if (P.h) { const s = []; for (let x = 0; x < 4400; x += 64) s.push(x + ":" + Math.round(P.h[Math.round(x / (P.WP / (P.h.length - 1)))] ?? -1)); console.log("h", P.h.length, s.join(" ")); }
