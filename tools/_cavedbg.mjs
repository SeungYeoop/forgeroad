// 동굴 구역 이동 디버그: 새 탭 → 탐험 시작 → 로딩 끝 → 구역 이동 → 5초마다 상태 (콘솔 경고·오류도)
//   TEST_URL=http://localhost:5198/ node tools/_cavedbg.mjs g1_1 [shot.png]
import fs from "node:fs";
const url = process.env.TEST_URL || "http://localhost:5198/";
const [zid = "g1_1", shotOut = ""] = process.argv.slice(2);
const created = await (await fetch("http://127.0.0.1:9333/json/new?" + encodeURIComponent(url), { method: "PUT" })).json();
const ws = new WebSocket(created.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pend = new Map();
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pend.has(d.id)) (pend.get(d.id)(d), pend.delete(d.id));
  else if (d.method === "Runtime.consoleAPICalled" && ["warning", "error"].includes(d.params.type)) console.log("[console." + d.params.type + "]", d.params.args.map((a) => a.value ?? a.description).join(" ").slice(0, 600));
  else if (d.method === "Runtime.exceptionThrown") console.log("[exception]", d.params.exceptionDetails.exception?.description?.slice(0, 600));
};
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (e) => { const r = await send("Runtime.evaluate", { expression: e, awaitPromise: true, returnByValue: true }); return r.result?.result?.value ?? r.result?.exceptionDetails?.exception?.description; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await send("Runtime.enable");
for (let i = 0; i < 160 && !(await ev("!!window.__game")); i++) await sleep(500);
await sleep(3000);
await ev('window.__game.scene.start("Run")');
for (let i = 0; i < 200 && !(await ev("!!window.__run?.world && !window.__run.frLoad")); i++) await sleep(500);
console.log("run ready", await ev("JSON.stringify({ z: window.__FG.zoneOfPlayer(window.__run)?.id })"));
await ev(`(() => { const sc = window.__run; sc.player.hp = sc.player.maxHp; sc.player.iframes = 999; window.__FG.travel(sc, ${JSON.stringify(zid)}, "L"); })()`);
const t0 = Date.now();
for (let k = 0; k < 40; k++) {
  await sleep(5000);
  const st = await ev(`JSON.stringify((() => { const sc = window.__run, L = sc.frLoad; return { t: ${"Math.round((Date.now() - " + t0 + ") / 1000)"}, busy: sc.zoneBusy, load: L ? { stage: L.stage, t: Math.round(L.t), painted: L.painted, total: L.total, dead: L.dead, closing: L.closing } : null, z: window.__FG.zoneOfPlayer(sc)?.id, x: Math.round(sc.player.x), y: Math.round(sc.player.y), wk: window.__FG._wkState?.(), hud: !!sc.hud?.() }; })())`);
  console.log(st);
  if (st && st.includes('"busy":0') && st.includes('"load":null')) break;
}
// 도착 뒤: 보이는 띠가 다 그려질 때까지 (최대 240초)
for (let k = 0; k < 48; k++) {
  const pend = await ev(`(() => { let p = 0, n = 0; for (const ch of window.__run.world.loaded?.values() ?? []) for (const B of ch.bands?.values() ?? []) (n++, B.rt && B.rt._frJob && p++); return p + "/" + n; })()`);
  console.log("bands pending", pend);
  if (String(pend).startsWith("0/")) break;
  await sleep(5000);
}
if (process.env.MOVE) await ev(`(() => { const [x, y] = ${JSON.stringify((process.env.MOVE || "0,0").split(",").map(Number))}; const sc = window.__run, z = window.__FG.zoneOfPlayer(sc); sc.player.body.x += x; sc.player.body.y += y; })()`);
if (shotOut) { await sleep(1500); const s = await send("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(shotOut, Buffer.from(s.result.data, "base64")); console.log("shot", shotOut); }
await fetch("http://127.0.0.1:9333/json/close/" + created.id);
process.exit(0);
