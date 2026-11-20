// 몬스터 행동 단위 검사 (브라우저 없이): 가짜 장면에서 brain을 여러 상황으로 돌려 오류를 찾는다
//   node --import ./tools/json-hook.mjs tools/foestep.mjs id1,id2,...   (없으면 등록된 새 몬스터 전부)
await import("../src/forge/foes/regions.js");
const core = await import("../src/forge/foes/core.js");
core.bindFoes({ j: { play() {} }, zt: { BlendModes: { ADD: 1 } } });
const { NEW_MODELS } = await import("../src/forge/foes/newmodels.js");
const ids = process.argv[2] ? process.argv[2].split(",") : Object.keys(NEW_MODELS);
let bad = 0;
for (const id of ids) {
  const S = core.SPECS[id];
  if (!S?.brain) { console.log("NO BRAIN", id); bad++; continue; }
  const errs = [];
  for (const sc of [{ dx: 30, dy: 0 }, { dx: 120, dy: 0 }, { dx: 250, dy: -60 }, { dx: -60, dy: 0 }, { dx: 20, dy: -90 }]) {
    const fx = { burst() {}, anim() {}, shake() {}, number() {}, text() {} };
    const player = { cx: 0, body: { x: 0, y: 0, vx: 0, vy: 0, onGround: !0 }, dead: !1, facing: 1, statuses: { apply() {} } };
    const host = {
      player, fx, enemies: [], time: { now: 0 }, add: { image: () => ({ setOrigin() { return this; }, setDepth() { return this; }, setDisplaySize() { return this; }, setAlpha() { return this; }, setBlendMode() { return this; }, setTint() { return this; }, setScale() { return this; }, destroy() {} }) },
      tweens: { add() {} }, time2: 0, projectiles: { spawn() {} }, hurtPlayer() {},
      world: { ledgeAhead: () => !1, wallAhead: () => !1, gtx: (x) => Math.floor(x / 16), standable: () => !0, solidAtPx: (x, y) => y > 0 },
      spawnEnemy: () => null,
    };
    host.time = { now: 0, delayedCall: (ms, f) => f() };
    const e = { host, def: { id, flying: !!S.flying }, body: { x: sc.dx * -1 + 0, y: sc.dy * -1, vx: 0, vy: 0, w: 10, h: 10, onGround: !S.flying }, facing: 1, life: 0, hp: 50, maxHp: 100, opts: { camp: null, layer: "x" }, aggro: !0, speed: S.speed ?? 80, atk: 10, homeX: 0, _hy: 0, sinceHit: 9, stunT: 0, dead: !1,
      get cx() { return this.body.x; }, get cy() { return this.body.y - 5; },
      hit() {}, playerInRect: () => !1, clearWarn() {}, die() { this.dead = !0; }, remove() {}, sprite: { setFrame() {}, setVisible() {}, setTint() {}, clearTint() {}, setAlpha() {}, anims: { isPlaying: !1, stop() {} } } };
    player.cx = 0;
    e.body.x = -sc.dx, e.body.y = -sc.dy;
    try {
      for (let k = 0; k < 900; k++) {
        e.life += 1 / 60;
        core.think(e, 1 / 60);
        core.anim(e);
        e.body.x += e.body.vx / 60, e.body.y = Math.min(e.body.y + e.body.vy / 60, S.flying ? 1e9 : 0);
        k === 450 && (e.aggro = !1);
        k === 600 && (e.aggro = !0, e.hp = 20);
      }
    } catch (err) { errs.push(String(err.stack ?? err).split("\n").slice(0, 3).join(" | ")); }
  }
  // 동작 이름 검사: brain이 부르는 이름이 그림에 있는가
  const src = S.brain.toString(), used = [...src.matchAll(/(?:once|play)\("([a-z0-9]+)"/g)].map((m) => m[1]);
  const miss = [...new Set([...used, "idle", "move", "wind", "atk", "rec", "hurt"])].filter((n) => !S.anims[n]);
  errs.length || miss.length ? (bad++, console.log("FAIL", id, errs[0] ?? "", miss.length ? "missing anims: " + miss.join(",") : "")) : console.log("ok", id);
}
console.log(bad ? `${bad} problems` : "all ok");
