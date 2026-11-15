const moduleAt = async name => {
  const entry = performance.getEntriesByType('resource').find(entry => new URL(entry.name).pathname === '/src/forge/' + name + '.js');
  return entry ? import(entry.name) : null;
};
const atmo = await moduleAt('atmo') ?? {update: window.__FG.update, regionFx: window.__FG.regionFx};
const depth = await moduleAt('depth') ?? {update: scene => window.__FG.parallax(scene, 0)};
const sc = window.__run, game = window.__game, world = sc.world;
game.loop.stop();
const spots = new Map();
for (let chunk = 3; chunk < 400 && spots.size < 5; chunk++) {
  const data = world.gen.get(chunk);
  if (data.ug?.biome && !spots.has(data.ug.biome)) spots.set(data.ug.biome, chunk);
}
const checks = [];
function tick() { atmo.update(sc, 1 / 60); depth.update(sc); }
function place(chunk) {
  sc.debugTeleport(chunk * 32 + 10);
  const data = world.gen.get(chunk);
  let col = 16, floor = -1;
  for (let row = data.ug.top + 4; row < 115; row++) if (data.grid[row * 32 + col] === 0 && [1, 4, 5].includes(data.grid[(row + 1) * 32 + col])) { floor = row + 1; break; }
  if (floor < 0) throw Error('No cave floor: ' + data.ug.biome);
  sc.player.body.x = world.lx(chunk * 32 + col) + 8;
  sc.player.body.y = floor * 16 - 0.1;
  sc.player.sprite.setPosition(sc.player.body.x, sc.player.body.y);
  sc.cameras.main.setScroll(sc.player.cx - 320, Math.min(1496, sc.player.cy - 180));
  tick();
  return data;
}
for (const [biome, chunk] of spots) {
  const data = place(chunk), gridBefore = JSON.stringify(data.grid);
  for (const weather of ['snow', 'drips']) {
    sc.ambient.destroy();
    sc.ambient = sc.makeAmbient({...data.region, particle: weather});
    atmo.regionFx(sc, {...data.region, bgId: weather === 'snow' ? 'frostgorge' : 'thunderspire'});
    sc.ambient.emitParticle(5);
    tick();
    const hidden = !sc.ambient.visible && !sc.ambient.active && sc.ambient.getAliveParticleCount() === 0;
    const surfaceHidden = sc.frAtmo.objs.every(object => !object.scene || !object.visible);
    const effects = sc._ugFx?.biome === biome && sc._ugFx.motes.active && sc._ugFx.fog.length === 2 && sc._ugFx.objects.every(object => !object.texture || object.texture.key !== '__MISSING');
    const loaded = world.loaded.get(chunk), entry = sc._frTerr.get(loaded.rt);
    const wall = sc._dp.walls.get(loaded.rt), faces = sc._dp.backs.get(loaded.rt);
    const wallPixels = entry.ctxW.getImageData(0,0,512,1856).data;
    let opaqueWallPixels = 0;
    for (let i = 3; i < wallPixels.length; i += 4) if (wallPixels[i]) opaqueWallPixels++;
    const layers = wall.visible && wall.depth < faces[0].depth && faces.every(face => face.visible && face.depth < loaded.rt.depth);
    for (let i = 0; i < 20; i++) tick();
    checks.push({biome, weather, hidden, surfaceHidden, effects, layers, opaqueWallPixels, collisionUnchanged: gridBefore === JSON.stringify(data.grid)});
    sc.player.body.y = (data.ug.top - 10) * 16;
    tick();
    const restored = sc.ambient.visible && sc.ambient.active && !sc._ugFx && sc.frAtmo.objs.filter(object => object.scene).every(object => object.visible);
    checks.push({biome, weather, surfaceRestored: restored});
    place(chunk);
  }
}
place(spots.get('geode') ?? spots.values().next().value);
sc.player.weapons.load();
sc.player.body.onGround = true;
sc.player.body.vx = sc.player.body.vy = 0;
sc.player.syncSprite();
sc.game.loop.start();
await new Promise(resolve => setTimeout(resolve, 400));
sc.game.loop.stop();
sc.cameras.main.resetFX();
sc.sys.displayList.depthSort();
const brokenFrames = game.scene.scenes.flatMap(scene => (scene.children?.list ?? []).filter(object => object.visible && object.frame && !object.frame.source).map(object => ({scene: scene.scene.key, type: object.type, key: object.texture?.key, depth: object.depth})));
if (brokenFrames.length) return {passed: false, brokenFrames, checks};
game.renderer.preRender(); game.scene.render(game.renderer); game.renderer.postRender();
return {passed: spots.size === 5 && checks.every(check => check.surfaceRestored ?? (check.hidden && check.surfaceHidden && check.effects && check.layers && check.opaqueWallPixels > 0 && check.collisionUnchanged)), checks};
