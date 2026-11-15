const terrainUrl = performance.getEntriesByType('resource').find(entry => new URL(entry.name).pathname === '/src/forge/terrain.js')?.name;
const terrain = await import(terrainUrl || '/src/forge/terrain.js');
if (terrain._wkState !== window.__FG._wkState) throw new Error('Terrain test must use the running game module');
const game = window.__game;
game.loop.stop();
const cycles = [];
for (let cycle = 0; cycle < 8; cycle++) {
  let sc = window.__run;
  const previousSeed = sc.world.gen.seed;
  const ch = sc.world.gen.get(5);
  terrain.prepaint(sc, ch, 160, (c, r) => sc.world.rawCode(c, r), ch.region);
  const waitForWorker = cycle % 2 === 0;
  if (waitForWorker) {
    for (let i = 0; i < 500 && terrain._wkState().jobs; i++) await new Promise(r => setTimeout(r, 10));
    terrain.prepaintStep(10000);
  }
  const oldKeys = Object.keys(sc.textures.list).filter(key => key.startsWith('frterr'));
  sc.cleanup();
  game.scene.stop('Run');
  game.scene.stop('Hud');
  const afterStop = {...terrain._wkState(), textures: sc._frTerr?.size ?? 0};
  const leakedTextures = oldKeys.filter(key => sc.textures.exists(key)).length;
  game.scene.start('Run');
  sc = window.__run;
  // Consume a completed old prepaint on even cycles; on odd cycles let its late reply arrive.
  for (let i = 0; i < 500 && terrain._wkState().jobs; i++) await new Promise(r => setTimeout(r, 10));
  terrain.prepaintStep(10000);
  sc.world.loadChunk(4);
  sc.world.loadChunk(5);
  let mismatchedPixels = 0;
  for (const chunk of [4, 5]) {
    const loaded = sc.world.loaded.get(chunk);
    const entry = sc._frTerr.get(loaded.rt);
    const g = terrain.pixSteps(loaded.data, chunk * 32, (c,r) => sc.world.rawCode(c,r), loaded.data.region);
    let result;
    do result = g.next(); while (!result.done);
    const actual = entry.ctx.getImageData(0, 0, 512, entry.cv.height).data;
    const expected = result.value.img.data;
    for (let i = 0; i < actual.length; i += 4) if (actual[i] !== expected[i] || actual[i+1] !== expected[i+1] || actual[i+2] !== expected[i+2] || actual[i+3] !== expected[i+3]) mismatchedPixels++;
  }
  cycles.push({cycle, waitForWorker, previousSeed, newSeed: sc.world.gen.seed, stalePrepaints: afterStop.pre, staleJobs: afterStop.jobs, stalePoolEntries: afterStop.textures, leakedTextures, mismatchedPixels});
}
return {passed: cycles.every(c => c.stalePrepaints === 0 && c.staleJobs === 0 && c.stalePoolEntries === 0 && c.leakedTextures === 0 && c.mismatchedPixels === 0), cycles};
