const w = (ms) => new Promise(r => setTimeout(r, ms));
const r = window.__run; const p = r.player; p.hp = p.maxHp = 99999;
r.enemies.forEach(e => e.remove()); r.enemies = [];
const ids = ["fr0_0","fr0_2","fr0_5","fr0_e0","fr0_e1","fr0_3"];
ids.forEach((id, k) => { const e = r.spawnEnemy(id, p.cx + 60 + k * 40, p.body.y, {}); e && (e.aggro = true); });
const res = [];
for (let i = 0; i < 4; i++) { await w(600); res.push(r.enemies.filter(e => !e.dead && !e.removed).map(e => e.def.id.slice(3) + "@" + Math.round(e.cx - p.cx) + ":" + (e.fz ? e.fz.anim.name : "-")).join(",")); }
return res;
