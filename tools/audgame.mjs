// 게임 속 소리 확인: 클릭(소리 켜기) → 탐험 시작 → 구역 이동 → 소리 상태·오류·프레임 간격
//   node tools/audgame.mjs [구역id]
const url = process.env.TEST_URL || "http://localhost:5173/";
const zid = process.argv[2] || "g1_0";
const created = await (await fetch("http://127.0.0.1:9333/json/new?" + encodeURIComponent(url), { method: "PUT" })).json();
const ws = new WebSocket(created.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pend = new Map(), errors = [];
ws.onmessage = (ev) => {
  const d = JSON.parse(ev.data);
  if (d.id) (pend.get(d.id)?.(d), pend.delete(d.id));
  else if (d.method === "Runtime.exceptionThrown") errors.push(d.params.exceptionDetails.exception?.description?.slice(0, 300));
};
const send = (m, p = {}) => new Promise((r) => { const k = ++id; pend.set(k, r); ws.send(JSON.stringify({ id: k, method: m, params: p })); });
const ev = async (e) => (await send("Runtime.evaluate", { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const state = () => ev(`(() => { const a = window.__audio; if (!a || !a.ctx) return "no ctx"; return JSON.stringify({ st: a.ctx.state, key: a.currentKey, where: a.track && a.track.where(), amb: a.amb && a.amb.type, space: a.space, tracks: a.tracks.length }); })()`);
try {
  await send("Runtime.enable");
  await send("Page.bringToFront");
  for (let i = 0; i < 160 && !(await ev("!!window.__game")); i++) await sleep(500);
  await sleep(3000);
  for (const type of ["mousePressed", "mouseReleased"]) await send("Input.dispatchMouseEvent", { type, x: 300, y: 200, button: "left", clickCount: 1 });
  await ev("window.__audio && window.__audio.resume()");
  await sleep(1000);
  console.log("title:", await state());
  await ev('window.__game.scene.start("Run")');
  for (let i = 0; i < 160 && !(await ev("!!window.__run?.world")); i++) await sleep(500);
  await sleep(4000);
  console.log("run:", await state());
  await ev(`(() => { const sc = window.__run; sc.player.hp = sc.player.maxHp; sc.player.iframes = 1e9; window.__FG.travel(sc, ${JSON.stringify(zid)}, "L"); })()`);
  await sleep(Number(process.env.TRAVEL_WAIT || 25000));
  console.log("zone:", await state());
  // 땅속으로 순간이동 → 동굴 울림
  const C0 = (await import("../src/forge/zones.js")).ZONES.find((q) => q.id === zid).c0;
  for (const y of [6650, 5856, 1200]) {
    await ev(`window.__run.travelTo(${C0} * 32 + Math.floor(3000 / 16), 1, null, ${y})`);
    await sleep(3500);
    console.log("y", y, await state());
  }
  // 효과음 몇 개
  await ev(`["hit","coin","coin","coin","swing","explosion","jump","magic"].forEach((n, i) => setTimeout(() => window.__audio.play(n), i * 120))`);
  await ev(`(() => { window.__ft = []; let last = performance.now(); const f = (t) => { window.__ft.push(t - last); last = t; window.__ftOn && requestAnimationFrame(f); }; window.__ftOn = true; requestAnimationFrame(f); })()`);
  await sleep(8000);
  const ft = await ev(`(() => { window.__ftOn = false; return window.__ft.slice(1); })()`);
  const s = [...ft].sort((a, b) => a - b);
  console.log("frames", ft.length, "p50", Math.round(s[s.length >> 1]), "p95", Math.round(s[Math.floor(s.length * 0.95)]), "max", Math.round(s[s.length - 1]));
  console.log("after:", await state());
} finally {
  console.log(JSON.stringify({ errors }));
  ws.close();
  await fetch("http://127.0.0.1:9333/json/close/" + created.id).catch(() => {});
}
