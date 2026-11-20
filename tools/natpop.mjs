// 순간이동 뒤 보이는 지형이 다 그려지기까지 걸린 시간 (작업 스레드 줄이 빌 때까지)
//   node --import ./tools/json-hook.mjs tools/natpop.mjs [구역id] "x,y;x,y"
import { ZONES } from "../src/forge/zones.js";
const url = process.env.TEST_URL || "http://localhost:5173/";
const [zid = "g1_0", spec = "900,6650;4700,5856;3500,2160;2600,4790"] = process.argv.slice(2);
const C0 = ZONES.find((q) => q.id === zid).c0;
const created = await (await fetch("http://127.0.0.1:9333/json/new?" + encodeURIComponent(url), { method: "PUT" })).json();
const ws = new WebSocket(created.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pend = new Map();
ws.onmessage = (ev) => { const d = JSON.parse(ev.data); d.id && (pend.get(d.id)?.(d), pend.delete(d.id)); };
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
  await ev(`(() => { const sc = window.__run; sc.player.iframes = 1e9; window.__FG.travel(sc, ${JSON.stringify(zid)}, "L"); })()`);
  await sleep(Number(process.env.TRAVEL_WAIT || 30000));
  for (const s of spec.split(";")) {
    const [x, y] = s.split(",").map(Number);
    await ev(`(() => { const sc = window.__run; sc.player.hp = sc.player.maxHp; sc.travelTo(${C0} * 32 + Math.floor(${x} / 16), 1, null, ${y}); })()`);
    const t0 = Date.now();
    await sleep(300);
    let st = null;
    // 화면 띠 중 아직 그림을 기다리는 띠가 없을 때까지
    for (let i = 0; i < 160; i++) {
      st = await ev("(() => { let n = 0, m = 0; for (const ch of window.__run.world.loaded.values()) for (const B of ch.bands?.values() ?? []) { m++; B.rt && B.rt._frJob && n++; } return JSON.stringify({ pending: n, bands: m, wk: window.__FG._wkState() }); })()");
      const o = st && JSON.parse(st);
      if (o && o.bands > 0 && o.pending === 0) break;
      await sleep(250);
    }
    console.log(s, "drawn after", ((Date.now() - t0) / 1000).toFixed(1), "s", st);
  }
} finally {
  ws.close();
  await fetch("http://127.0.0.1:9333/json/close/" + created.id).catch(() => {});
}
