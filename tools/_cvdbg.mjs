import { ZONES, upChunk, downChunk } from "../src/forge/zones.js";
import { makePlan } from "../src/forge/natgen.js";
import { biomeOf } from "../src/forge/terrprof.js";
globalThis.__dbg = 1;
const [id = "g1_1", sd = "1"] = process.argv.slice(2);
const z = ZONES.find((q) => q.id === id);
const o = { seed: +sd, Ft: 528, up: upChunk(z), down: downChunk(z), fe: 1, ze: 0, biome: biomeOf(z), noRepair: 1, patterns: z.y === 0 ? z.reg?.patterns : null };
const P = makePlan(z, o, 0);
console.log("check", JSON.stringify(P.check), "peak", JSON.stringify(P.peak), "deep", JSON.stringify(P.deep));
const F = P.F;
for (const x of [4300, 4360, 4420]) { const col = []; for (let y = 2500; y < 2960; y += 8) col.push(F.solid(x, y) ? "#" : "."); console.log(x, col.join("")); }
const A = P.A, un = [];
for (let n = 0; n < A.NN; n++) if (!A.reach[n]) un.push([A.nC[n] * 8, A.nY[n]]);
const cl = {};
for (const [x, y] of un) { const k = Math.round(y / 160) * 160 + ":" + Math.round(x / 400) * 400; cl[k] = (cl[k] ?? 0) + 1; }
console.log("unreached", un.length, Object.entries(cl).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([k, v]) => k + "×" + v).join(" "));
import { BLUEPRINTS } from "../src/forge/natbp.js";
const rs = [];
for (const q of BLUEPRINTS[id].caves ?? []) {
  let r = 0, t = 0;
  for (let n = 0; n < A.NN; n++) { const x = A.nC[n] * 8, y = A.nY[n]; if (x > q.x0 + 40 && x < q.x1 - 40 && y > q.fy - q.h && y < q.fy + 90) (t++, A.reach[n] && r++); }
  rs.push(`${q.id}:${t ? Math.round((100 * r) / t) : "-"}`);
}
console.log(rs.join(" "));
// 비탈 굴 하나 (EL-D1) 단면: x마다 바닥 높이
const prof = [];
for (let x = 900; x <= 1880; x += 40) { let y = 4100; while (y < 4900 && !F.solid(x, y)) y += 4; let yt = y - 4; while (yt > 3900 && !F.solid(x, yt)) yt -= 4; prof.push(`${x}:${y}/${y - yt}`); }
console.log(prof.join(" "));
{
  const out = [];
  for (let x = 900; x <= 1880; x += 40) {
    // 아래(4900)에서 위로 훑어 공기 구간들
    const segs = []; let inAir = false, s0 = 0;
    for (let y = 4900; y >= 4000; y -= 4) { const a = !F.solid(x, y); if (a && !inAir) (inAir = true, s0 = y); if (!a && inAir) (inAir = false, segs.push(`${y + 4}-${s0}`)); }
    out.push(`${x}[${segs.join(",")}]`);
  }
  console.log(out.join(" "));
}
{ const out=[]; for (let y=2700;y<3560;y+=16){ let row=''; for (let x=3880;x<4400;x+=8) row+=F.solid(x,y)?'#':'.'; out.push(y+' '+row);} console.log(out.join('\n')); }
{ const out=[]; const nodeAt={}; for(let n=0;n<A.NN;n++){ nodeAt[(A.nC[n])+':'+(Math.round(A.nY[n]/16))]=A.reach[n]?'R':'n'; }
for (let y=+process.env.Y0||4200;y<(+process.env.Y1||4740);y+=16){ let row=""; for (let x=+process.env.X0||3800;x<(+process.env.X1||4400);x+=8){ const k=Math.floor(x/8)+':'+Math.round(y/16); row+= nodeAt[k] ?? (F.solid(x,y)?'#':'.'); } out.push(y+' '+row);} console.log(out.join('\n')); }
{ let s=''; for (let y=2860;y<2900;y++) s+=F.solid(4360,y)?'#':'.'; console.log('floor@4360', s);
  const ns=[]; for(let n=0;n<A.NN;n++){ const x=A.nC[n]*8+4; if (Math.abs(x-4360)<40 && Math.abs(A.nY[n]-2880)<60) ns.push(x+','+A.nY[n]+(A.reach[n]?'R':'n')); } console.log('nodes', ns.join(' ')); }
{ const D = BLUEPRINTS[id].dungeon; if (D) { const GX=Math.round(D.x0/8), GY=Math.round(D.y0/8); const lines=[];
  for (let s=0;s<D.stories;s++){ let l='s'+s+' '; for(let c=0;c<D.cols;c++){ const x0=(GX+c*64)*8, x1=x0+512, y1=(GY+(s+1)*48)*8, y0=y1-384; let r=0,t=0; for(let n=0;n<A.NN;n++){const x=A.nC[n]*8, y=A.nY[n]; if(x>x0&&x<x1&&y>y0&&y<=y1)(t++,A.reach[n]&&r++);} l+=(t?String(Math.round(100*r/t)).padStart(4):'   -'); } lines.push(l);} console.log(lines.join('\n')); } }
