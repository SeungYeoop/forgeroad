const { pixSteps } = await import('/src/forge/terrain.js');
const world = window.__run.world;
window.__game.loop.stop();
const checks = [];
for (let chunk = 3; chunk < 400 && new Set(checks.map(c => c.biome)).size < 5; chunk++) {
  const data = world.gen.get(chunk);
  if (!data.ug?.entrances?.length || checks.some(c => c.biome === data.ug.biome)) continue;
  const before = JSON.stringify(data.grid);
  const raw = (col, row) => world.gen.get(Math.floor(col / 32)).grid[row * 32 + ((col % 32) + 32) % 32];
  const painter = pixSteps(data, chunk * 32, raw, data.region);
  let result;
  do result = painter.next(); while (!result.done);
  const { wall } = result.value;
  let checked = 0, gaps = 0, aboveLip = 0;
  for (const entrance of data.ug.entrances) {
    for (let col = entrance.x; col < entrance.x + entrance.w; col++) {
      for (let row = entrance.top; row < data.grid.length / 32; row++) {
        for (let y = row * 16; y < (row + 1) * 16; y++) for (let x = col * 16; x < (col + 1) * 16; x++) {
          const alpha = (y * 512 + x) * 4 + 3;
          checked++;
          if (wall[alpha] !== 255) gaps++;
        }
      }
      if (entrance.top < data.ug.top - 2) {
        const alpha = (((entrance.top - 1) * 16 + 8) * 512 + col * 16 + 8) * 4 + 3;
        if (entrance.top <= data.ug.surface[col] && wall[alpha]) aboveLip++;
      }
    }
  }
  checks.push({ biome: data.ug.biome, chunk, checked, gaps, aboveLip, collisionUnchanged: before === JSON.stringify(data.grid) });
}
return { passed: checks.length === 5 && checks.every(c => c.checked > 0 && c.gaps === 0 && c.aboveLip === 0 && c.collisionUnchanged), checks };
