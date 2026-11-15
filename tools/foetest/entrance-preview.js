const scene = window.__run, game = window.__game, world = scene.world;
await new Promise(resolve => setTimeout(resolve, 2500));
let chunk = 3;
while (!world.gen.get(chunk).ug?.entrances?.length && chunk < 200) chunk++;
scene.debugTeleport(chunk * 32 + 10);
const data = world.gen.get(chunk), entrance = data.ug.entrances[0];
scene.player.body.x = world.lx(chunk * 32 + entrance.x + 1) + 8;
scene.player.body.y = entrance.top * 16 + 40;
scene.player.body.vx = scene.player.body.vy = 0;
scene.player.weapons.load();
scene.player.syncSprite();
await new Promise(resolve => setTimeout(resolve, 1500));
game.loop.stop();
scene.cameras.main.setScroll(world.lx(chunk * 32 + entrance.x) - 300, entrance.top * 16 - 80);
scene.cameras.main.resetFX();
// Isolate terrain rendering from unrelated enemy atlas frames in this preview.
const broken = game.scene.scenes.flatMap(s => (s.children?.list ?? []).filter(o => o.visible && o.frame && !o.frame.source));
for (const object of broken) object.setVisible(false);
window.__FG.parallax(scene, 0);
const loaded = world.loaded.get(chunk), entry = scene._frTerr.get(loaded.rt);
const wall = entry.ctxW.getImageData(0, 0, 512, data.grid.length / 32 * 16).data;
let gaps = 0, checked = 0;
for (let col = entrance.x; col < entrance.x + entrance.w; col++)
  for (let y = entrance.top * 16; y < data.grid.length / 32 * 16; y++)
    for (let x = col * 16; x < (col + 1) * 16; x++) { checked++; if (wall[(y * 512 + x) * 4 + 3] !== 255) gaps++; }
scene.sys.displayList.depthSort();
game.renderer.preRender(); game.scene.render(game.renderer); game.renderer.postRender();
return { passed: gaps === 0 && checked > 0, chunk, entrance, gaps, checked, excludedEnemySprites: broken.length };
