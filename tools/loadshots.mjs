// 로딩 화면 확인: 탐험 시작 직후와 구역 이동 중 화면을 시간별로 찍고, 로딩 중 움직임이 막히는지 본다
//   node --import ./tools/json-hook.mjs tools/loadshots.mjs [폴더]
import fs from "node:fs";
const url = process.env.TEST_URL || "http://localhost:5173/";
const out = process.argv[2] || "shots/load";
fs.mkdirSync(out, { recursive: true });
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
const shot = async (name) => {
  const s = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(`${out}/${name}.png`, Buffer.from(s.result.data, "base64"));
};
const st = () => ev(`(() => { const sc = window.__run; if (!sc || !sc.player) return "no run"; const L = sc.frLoad; return JSON.stringify({ load: L ? { stage: L.stage, p: +L.p.toFixed(2), a: +L.alpha.toFixed(2) } : null, x: Math.round(sc.player.cx), y: Math.round(sc.player.cy), busy: sc.zoneBusy }); })()`);
try {
  await send("Runtime.enable");
  await send("Page.bringToFront");
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  for (let i = 0; i < 160 && !(await ev("!!window.__game")); i++) await sleep(500);
  await sleep(3000);
  await ev('window.__game.scene.start("Run")');
  const t0 = Date.now();
  for (const at of [400, 1500, 3000]) {
    await sleep(at - (Date.now() - t0));
    await shot(`start_${at}`);
    console.log("start", at, await st());
  }
  // 로딩 중 오른쪽 키를 눌러도 움직이지 않아야 한다
  const x0 = await st();
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "d", code: "KeyD", windowsVirtualKeyCode: 68 });
  await sleep(600);
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "d", code: "KeyD", windowsVirtualKeyCode: 68 });
  console.log("key during load", x0, "→", await st());
  for (let i = 0; i < 120; i++) {
    const s = JSON.parse(await st());
    if (!s.load) break;
    await sleep(250);
  }
  console.log("loaded after", Date.now() - t0, "ms", await st());
  await sleep(1200);
  await shot("start_done");
  // 구역 이동 (동쪽 이웃)
  await ev(`(() => { const sc = window.__run; sc.player.iframes = 1e9; window.__FG.travel(sc, "g2_0", "L"); })()`);
  const t1 = Date.now();
  for (const at of [150, 700]) {
    await sleep(at - (Date.now() - t1));
    await shot(`travel_${at}`);
    console.log("travel", at, await st());
  }
  for (let i = 0; i < 160; i++) {
    const s = JSON.parse(await st());
    if (!s.load) break;
    await sleep(250);
  }
  console.log("travel loaded after", Date.now() - t1, "ms", await st());
  await sleep(1000);
  await shot("travel_done");
} finally {
  console.log(JSON.stringify({ errors }));
  ws.close();
  await fetch("http://127.0.0.1:9333/json/close/" + created.id).catch(() => {});
}
