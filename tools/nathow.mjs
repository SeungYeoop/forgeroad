// 두 점 사이 움직임 검사: nathow <id> xa ya xb yb
import { ZONES, upChunk, downChunk } from "../src/forge/zones.js";
import { makePlan } from "../src/forge/natgen.js";
const [id, xa, ya, xb, yb] = process.argv.slice(2);
const z = ZONES.find((q) => q.id === id);
const P = makePlan(z, { seed: 1, Ft: 528, up: upChunk(z), down: downChunk(z), fe: 1, ze: 0, noRepair: true }, 0);
const A = P.A;
const ca = Math.floor(+xa / 8) & ~1, cb = Math.floor(+xb / 8) & ~1;
for (let m = 0; m < 5; m++) console.log("mode", m, A.tryMode(ca, +ya, cb, +yb, m));
for (let y = +yb - 40; y <= +yb + 4; y += 4) console.log("col b", y, A.bodyAir(cb, y), P.F.solid(cb * 8 + 1, y + 2));
const VX = 135, GU = 1500, GD = 1725, VMAX = 720, J1 = 475, J2 = 415;
const T1 = J1 / GU, H1 = (J1 * J1) / (2 * GU), T2 = J2 / GU, TV = VMAX / GD;
const fallD = (w) => (w <= TV ? 0.5 * GD * w * w : 0.5 * VMAX * TV + VMAX * (w - TV));
const hRun = (t) => { if (t <= T1) return J1 * t - 0.5 * GU * t * t; const u = t - T1; if (u <= T2) return H1 + J2 * u - 0.5 * GU * u * u; return H1 + (J2*J2)/(2*GU) - fallD(u - T2); };
const dir = cb > ca ? 1 : -1, n = (cb - ca) * dir;
for (let k = 1; k <= n; k++) { const y = Math.round(+ya - hRun((k * 8) / VX)); console.log("k", k, "x", (ca + k * dir) * 8, "y", y, A.bodyAir(ca + k * dir, y), A.airD(ca + k * dir, y - 22, y - 9), A.airC(ca + k * dir, y - 22, y - 1)); }
for (let y = 3856; y <= 3912; y += 4) { let row = ""; for (let x = 4690; x <= 4740; x += 2) row += P.F.solid(x, y) ? "#" : "."; console.log(y, row); }
const Cc = A.C;
for (const c of [588, 589, 590]) { const o = []; for (let k = Cc.dvS[c]; k < Cc.dvS[c + 1]; k++) Cc.dbot[k] > 3700 && Cc.dtop[k] < 4000 && o.push(Cc.dtop[k] + "-" + Cc.dbot[k]); const o2 = []; for (let k = Cc.ivS[c]; k < Cc.ivS[c + 1]; k++) Cc.bot[k] > 3700 && Cc.top[k] < 4000 && o2.push(Cc.top[k] + "-" + Cc.bot[k]); console.log(c, "D", o.join(" "), "C", o2.join(" ")); }
