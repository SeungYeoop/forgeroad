const w = (ms) => new Promise(r => setTimeout(r, ms));
const g = window.__game; const sc = g.scene.getScene("Title");
g.scene.getScenes(true).forEach(s => s.scene.key !== "Title" && s.scene.stop());
sc.add.rectangle(0, 0, 640, 360, 0x7a6a8a).setOrigin(0).setDepth(1000);
const FG = window.__FG;
let y = 2, x = 2, rowH = 0;
for (const [id, names, s2] of window.__LIST) {
  const key = (id.startsWith("frb") ? "b_" : "e_") + id;
  for (const nm of names) {
    FG.foeEnsure(sc, id);
    const f = FG.foeFrame(id, nm[0], nm[1] ?? 0);
    const fr = sc.textures.get(key).get(f);
    if (x + fr.width * s2 > 640) { x = 2; y += rowH + 1; rowH = 0; }
    sc.add.image(x, y, key, f).setOrigin(0).setScale(s2).setDepth(1001);
    x += fr.width * s2 * 0.75; rowH = Math.max(rowH, fr.height * s2);
  }
}
await w(500);
return "ok";
