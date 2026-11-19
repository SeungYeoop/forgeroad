// 실제 게임 끊김 재기: 구역 안을 순간이동하며(새 지형 띠를 계속 불러오게) 프레임 간격을 기록한다
//   node --import ./tools/json-hook.mjs tools/natperf.mjs [구역id] [걸음 수]
//   결과: 프레임 수, 95% 간격, 최대 간격, 50ms·100ms 넘은 프레임 수 (헤드리스는 원래 느려서 절대값보다 비교용)
import { ZONES } from "../src/forge/zones.js";
const url = process.env.TEST_URL || "http://localhost:5173/";
const [zid = "g1_0", nS = "24"] = process.argv.slice(2);
const C0 = ZONES.find((q) => q.id === zid).c0;
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
const send = (method, params = {}) => new Promise((r) => { const k = ++id; pend.set(k, r); ws.send(JSON.stringify({ id: k, method, params })); });
const ev = async (expr) => (await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  await send("Runtime.enable");
  for (let i = 0; i < 160 && !(await ev("!!window.__game")); i++) await sleep(500);
  await sleep(4000);
  await ev('window.__game.scene.start("Run")');
  for (let i = 0; i < 160 && !(await ev("!!window.__run?.world")); i++) await sleep(500);
  await sleep(5000);
  await ev(`(() => { const sc = window.__run; sc.player.hp = sc.player.maxHp; sc.player.iframes = 1e9; window.__FG.travel(sc, ${JSON.stringify(zid)}, "L"); })()`);
  await sleep(Number(process.env.TRAVEL_WAIT || 30000));
  // 프레임 간격 기록 시작
  await ev(`(() => { window.__ft = []; let last = performance.now(); const f = (t) => { window.__ft.push(t - last); last = t; window.__ftOn && requestAnimationFrame(f); }; window.__ftOn = true; requestAnimationFrame(f); })()`);
  const pts = [];
  const N = +nS;
  for (let k = 0; k < N; k++) {
    // 지표·섬·동굴 높이를 번갈아: 매번 새 띠가 불린다
    const x = 200 + Math.round((k / (N - 1)) * 7700), y = [4790, 3440, 6650, 2160, 5856, 1200][k % 6];
    pts.push([x, y]);
  }
  for (const [x, y] of pts) {
    await ev(`(() => { const sc = window.__run; sc.player.hp = sc.player.maxHp; sc.travelTo(${C0} * 32 + Math.floor(${x} / 16), 1, null, ${y}); })()`);
    await sleep(700);
  }
  await sleep(1500);
  const ft = await ev(`(() => { window.__ftOn = false; return window.__ft.slice(1); })()`);
  const s = [...ft].sort((a, b) => a - b), q = (p) => Math.round(s[Math.min(s.length - 1, Math.floor(s.length * p))]);
  console.log(JSON.stringify({ frames: ft.length, p50: q(0.5), p95: q(0.95), max: Math.round(s[s.length - 1]), over50: ft.filter((v) => v > 50).length, over100: ft.filter((v) => v > 100).length, over200: ft.filter((v) => v > 200).length }));
} finally {
  console.log(JSON.stringify({ errors }));
  ws.close();
  await fetch("http://127.0.0.1:9333/json/close/" + created.id).catch(() => {});
}
