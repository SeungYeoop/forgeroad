const r = window.__run; const p = r.player;
const out = [];
for (const id of ["fr0_0","fr0_1","fr0_2","fr0_3","fr0_4","fr0_5","fr0_e0","fr0_e1"]) {
  const e = r.spawnEnemy(id, p.cx + 60, p.body.y - (id==="fr0_4"?60:0), {}); e.aggro = true;
  try { for (let i = 0; i < 90; i++) e.update(1/60); out.push(id + " ok " + e.fz?.anim?.name + " dead=" + e.dead); }
  catch (err) { out.push(id + " ERR " + err.message + " | " + (err.stack || "").split("\n").slice(0, 3).join(" / ")); }
}
return out;
