// 하늘에서 가장 높이 닿은 마디들 + 그 위 가까운 못 닿은 마디
import { ZONES, upChunk, downChunk } from "../src/forge/zones.js";
import { makePlan } from "../src/forge/natgen.js";
const z = ZONES.find((q) => q.id === process.argv[2]);
const P = makePlan(z, { seed: 1, Ft: 528, up: upChunk(z), down: downChunk(z), fe: 1, ze: 0, noRepair: true }, 0);
const A = P.A, { nC, nY, NN, reach } = A;
const top = [];
for (let n = 0; n < NN; n++) if (reach[n] && nY[n] < 4500) top.push(n);
top.sort((a, b) => nY[a] - nY[b]);
const seen = new Set();
for (const n of top) {
  const key = Math.round(nC[n] / 30) + ":" + Math.round(nY[n] / 40);
  if (seen.has(key)) continue;
  seen.add(key);
  // 가까운 위쪽 못 닿은 마디
  let best = null;
  for (let m = 0; m < NN; m++) if (!reach[m] && nY[m] < nY[n] && nY[n] - nY[m] < 200 && Math.abs(nC[m] - nC[n]) * 8 < 260) { const d = Math.abs(nC[m] - nC[n]) * 8 + (nY[n] - nY[m]); (!best || d < best[0]) && (best = [d, nC[m] * 8 + 4, nY[m]]); }
  console.log("reached", nC[n] * 8 + 4, nY[n], "nearest above unreached", best ? best.slice(1).join(",") : "-");
  if (seen.size > 12) break;
}
