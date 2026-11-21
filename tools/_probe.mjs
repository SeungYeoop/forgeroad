// 지정한 칸(x, 행) 근처 마디가 닿았는지: node --import ./tools/json-hook.mjs tools/_probe.mjs g1_m1 "x,y;x,y"
import { ZONES, upChunk, downChunk } from "../src/forge/zones.js";
import { makePlan } from "../src/forge/natgen.js";
const [id, pts] = process.argv.slice(2);
const z = ZONES.find((q) => q.id === id);
const P = makePlan(z, { seed: 1, Ft: 528, up: upChunk(z), down: downChunk(z), noRepair: 1 }, 0), A = P.A;
for (const s of pts.split(";")) {
  const [cx, cy] = s.split(",").map(Number);
  const near = [];
  for (let n = 0; n < A.NN; n++) {
    const x = A.nC[n] * 8 + 4, y = A.nY[n];
    if (Math.abs(x - cx * 8) <= 24 && Math.abs(y - cy * 8) <= 24) near.push(`${Math.round(x / 8)},${(y / 8).toFixed(1)}:${A.reach[n] ? "O" : "x"}`);
  }
  console.log(s, near.slice(0, 10).join(" ") || "(마디 없음)");
}
