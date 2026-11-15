// 멈춤 탐지 봇: 오류·긴 프레임을 기록하며 오른쪽으로 계속 달리고 싸운다.
// 앞에 window.__SEC = 초; 를 붙여 실행. 결과: 오류 목록, 긴 프레임(무엇을 하던 중이었는지)
const w = (ms) => new Promise((r) => setTimeout(r, ms));
const g = window.__game;
const errs = [], longs = [];
window.addEventListener("error", (e) => errs.push((e.message || "") + " @ " + (e.filename || "").split("/").pop() + ":" + e.lineno));
window.addEventListener("unhandledrejection", (e) => errs.push("rejection: " + (e.reason?.message ?? e.reason)));
const ce = console.error;
console.error = (...a) => (errs.push("console.error: " + a.map(String).join(" ").slice(0, 200)), ce(...a));
g.scene.getScenes(true).forEach((s) => s.scene.key !== "Run" && s.scene.stop());
g.scene.start("Run");
await w(3500);
const r = window.__run, p = r.player;
p.maxHp = p.hp = 1e7;
// 긴 프레임 기록: 그 순간 상태
let last = performance.now(), stuckSince = 0, lastDist = 0;
const mark = { chunk: -1 };
const tick = () => {
  const now = performance.now(), dt = now - last;
  last = now;
  if (dt > 250) longs.push({ ms: Math.round(dt), dist: Math.round(r.dist), chunk: r.world?.chunkOfLocal?.(p.x), region: r.regionIdx, enemies: r.enemies.length, modal: !!r.hud?.()?.modalOpen, boss: !!r.boss });
  requestAnimationFrame(tick);
};
requestAnimationFrame(tick);
const SEC = window.__SEC ?? 60;
const t0 = performance.now();
let k = 0, frozen = [];
while (performance.now() - t0 < SEC * 1000) {
  k++;
  // 오른쪽으로 달리기 + 공격 (키 입력 흉내 대신 몸을 직접 민다)
  const hud = r.hud?.();
  if (hud?.modalOpen) {
    // 카드·선택 창이 뜨면 첫 번째를 고른다 (2초 잠금 이후)
    if (hud.cardMode && performance.now() % 1000 < 400) hud.pickCard(0);
    else if (!hud.cardMode) hud.cancelModal?.();
  }
  if (!r.boss) p.body.x += 9;
  p.iframes = 0.5;
  p.hp = p.maxHp;
  // 가까운 적은 바로 처치 (레벨업·드롭·부활 경로 시험)
  for (const e of r.enemies) if (!e.dead && Math.abs(e.cx - p.cx) < 60 && Math.random() < 0.15) e.receive(e.maxHp * 0.6, 0, { dir: 1, knock: 50, stagger: 0.3 });
  if (r.boss && !r.boss.dead && Math.random() < 0.05) r.boss.receive(r.boss.maxHp * 0.08, 0, { stagger: 0.2 });
  // 상자 열기
  r.evm?.nearest && Math.random() < 0.3 && r.evm.interact();
  // 진행이 멈췄는지 (논리가 안 돌면 거리가 안 늘어난다)
  if (Math.abs(r.dist - lastDist) < 0.01 && !r.boss && !hud?.modalOpen) stuckSince = stuckSince || performance.now();
  else stuckSince = 0;
  stuckSince && performance.now() - stuckSince > 3000 && (frozen.push({ dist: Math.round(r.dist), paused: !g.scene.isActive("Run"), modal: !!hud?.modalOpen, hitstop: r.fx?.hitstop, timeScale: r.timeScale, dying: r.dying }), (stuckSince = 0));
  lastDist = r.dist;
  // 가끔 하늘·지하로 순간이동
  if (k % 150 === 75) p.body.y -= 600;
  await w(50);
}
return { dist: Math.round(r.dist), region: r.regionIdx, errs: [...new Set(errs)].slice(0, 20), longs: longs.slice(0, 30), longCount: longs.length, frozen: frozen.slice(0, 10) };
