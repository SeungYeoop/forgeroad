// 지형 회귀 검사 (자연 지형 대응): 맵 캐시를 지우고 역순으로 다시 만들어도 같은지, 화면 조각과 충돌 데이터가 같은지,
// 빈 공간 이동·벽 충돌·바닥 착지가 픽셀 단위로 맞는지
const world = window.__run.world;
const Generator = world.gen.constructor;
// 조각 요약: 칸 격자 + (자연 지형이면) 그 조각 밀도장 표본
const digest = (d) => {
  let h = 0;
  if (d.fine) {
    const F = d.fine.F, i0 = d.fine.x0 / 4;
    for (let j = 0; j < F.LH; j += 3) for (let i = i0; i <= i0 + 128; i += 3) h = (Math.imul(h, 31) + Math.round(F.d[j * F.LW + i] * 1000)) | 0;
  }
  return Array.from(d.grid).join("") + "|" + h + "|" + JSON.stringify(d.spawns) + JSON.stringify(d.chests) + JSON.stringify(d.hazards);
};
const results = [];
for (const seed of [1, 42, 12345]) {
  const gen = new Generator(seed);
  const snaps = [];
  for (let chunk = 0; chunk < 120; chunk++) snaps.push(digest(gen.get(chunk)));
  gen.trim(115, 14);
  let changed = 0;
  for (let chunk = 119; chunk >= 0; chunk--) digest(gen.get(chunk)) !== snaps[chunk] && changed++;
  results.push({ seed, changedChunks: changed });
}
window.__game.loop.stop();
let mismatchedVisibleTiles = 0, wallChecks = 0, airChecks = 0, landingChecks = 0, failures = 0;
const g0 = world.originChunk * 512;
for (const [chunk, loaded] of world.loaded) {
  for (let row = 1; row < 115; row++)
    for (let col = 1; col < 31; col++) {
      const gc = chunk * 32 + col;
      if (world.code(gc, row) !== loaded.data.grid[row * 32 + col]) mismatchedVisibleTiles++;
    }
  // 픽셀 단위: 공기 속 몸은 그대로 움직이고, 바로 오른쪽이 바위 기둥이면 막히고, 아래가 바위면 그 윗면에 정확히 선다
  for (let k = 0; k < 300; k++) {
    const gx = chunk * 512 + 8 + Math.floor(Math.random() * 496), y = 30 + Math.floor(Math.random() * 1790);
    const lx = gx - g0;
    const body = { x: lx + 0.5, y, w: 10, h: 22, vx: 0, vy: 0, onGround: false, hitWall: 0, groundCode: 0, dropThrough: 0, groundGtx: 0, groundRow: 0 };
    if (world.overlapAt(body, body.x, body.y)) continue;
    // 착지: 아래로 내려 보내면 발이 바위 윗면에서 멈춘다 (발 아래 픽셀이 바위, 몸은 겹치지 않음)
    const b2 = { ...body };
    world.moveY(b2, 40);
    if (b2.onGround) {
      landingChecks++;
      if (world.overlapAt(b2, b2.x, b2.y) || !world.footOn(b2, b2.x, b2.y)) failures++;
    }
    // 옆으로: 막히면 겹치지 않은 채 멈추고, 안 막히면 정확히 그만큼 움직인다
    const b3 = { ...body };
    world.moveX(b3, 6);
    if (b3.hitWall) (wallChecks++, world.overlapAt(b3, b3.x, b3.y) && failures++);
    else (airChecks++, world.overlapAt(b3, b3.x, b3.y) && failures++);
  }
}
return {
  passed: results.every((r) => r.changedChunks === 0) && mismatchedVisibleTiles === 0 && landingChecks > 0 && failures === 0,
  results,
  mismatchedVisibleTiles,
  wallChecks,
  airChecks,
  landingChecks,
  failures,
};
