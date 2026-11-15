const world = window.__run.world;
const Generator = world.gen.constructor;
const results = [];
for (const seed of [1, 42, 12345, 987654321]) {
  const gen = new Generator(seed);
  const snapshots = [];
  for (let chunk = 0; chunk < 220; chunk++) snapshots.push(JSON.stringify(gen.get(chunk)));
  gen.trim(215, 14);
  let changedChunks = 0, changedTiles = 0;
  for (const chunk of Array.from({length: 200}, (_, i) => 199 - i)) {
    const data = gen.get(chunk);
    if (snapshots[chunk] !== JSON.stringify(data)) changedChunks++;
    const original = JSON.parse(snapshots[chunk]).grid;
    changedTiles += Array.from(data.grid).filter((value, index) => value !== original[index]).length;
  }
  results.push({seed, changedChunks, changedTiles});
}
// Exercise the actual world collider after eviction while its displayed chunks stay loaded.
window.__game.loop.stop();
const displayed = Array.from(world.loaded.entries());
for (let chunk = 0; chunk < 80; chunk++) world.gen.get(chunk);
world.gen.trim(75, 14);
let mismatchedVisibleTiles = 0, movementChecks = 0, airChecks = 0, landingChecks = 0, movementFailures = 0;
for (const [chunk, loaded] of displayed) {
  for (let row = 1; row < 115; row++) for (let col = 1; col < 31; col++) {
    const globalCol = chunk * 32 + col;
    const expected = loaded.data.grid[row * 32 + col];
    if (world.code(globalCol, row) !== expected) mismatchedVisibleTiles++;
    if (expected !== 0) continue;
    const makeBody = () => ({x: world.lx(globalCol) + 8, y: row * 16 + 14, w: 8, h: 8, vx: 20, vy: 20, hitWall: 0});
    const neighbor = loaded.data.grid[row * 32 + col + 1];
    if (neighbor === 0 || neighbor === 1) {
      const body = makeBody(), startX = body.x;
      world.moveX(body, 8);
      if (neighbor === 1) {
        movementChecks++;
        if (body.hitWall !== 1 || body.x + body.w / 2 > world.lx(globalCol + 1)) movementFailures++;
      } else {
        airChecks++;
        if (body.hitWall !== 0 || body.x !== startX + 8) movementFailures++;
      }
    }
    if (loaded.data.grid[(row + 1) * 32 + col] === 1) {
      const body = makeBody();
      world.moveY(body, 8);
      landingChecks++;
      if (!body.onGround || body.y !== (row + 1) * 16) movementFailures++;
    }
  }
}
return {passed: results.every(r => r.changedChunks === 0) && mismatchedVisibleTiles === 0 && movementChecks > 0 && airChecks > 0 && landingChecks > 0 && movementFailures === 0, results, mismatchedVisibleTiles, movementChecks, airChecks, landingChecks, movementFailures};
