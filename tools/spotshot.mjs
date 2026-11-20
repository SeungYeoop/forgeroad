// 탐험 시작(로딩 끝까지 기다림) 뒤 구역 안 자리로 옮겨 다 그려지면 찍는다
//   node --import ./tools/json-hook.mjs tools/spotshot.mjs <폴더> "x,y,이름;..."
import fs from "node:fs";
import { ZONES } from "../src/forge/zones.js";
const url = process.env.TEST_URL || "http://localhost:5173/";
const [out = "shots/spot", spec = ""] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const C0 = ZONES.find((q) => q.id === "g1_0").c0;
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
try {
  await send("Runtime.enable");
  await send("Page.bringToFront");
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  for (let i = 0; i < 160 && !(await ev("!!window.__game")); i++) await sleep(500);
  await sleep(3000);
  await ev('window.__game.scene.start("Run")');
  for (let i = 0; i < 200; i++) {
    await sleep(300);
    if (await ev("!!(window.__run && window.__run.player && !window.__run.frLoad && window.__run.hud && window.__run.hud())")) break;
  }
  await sleep(1500);
  for (const p of spec.split(";").filter(Boolean)) {
    const [x, y, n] = p.split(",");
    await ev(`(() => { const sc = window.__run; sc.player.iframes = 1e9; sc.player.hp = sc.player.maxHp; for (const e of sc.enemies) e.remove?.(); sc.travelTo(${C0} * 32 + Math.floor(${x} / 16), 1, null, ${y}); })()`);
    // 띠가 다 그려질 때까지
    for (let i = 0; i < 60; i++) {
      await sleep(250);
      const pend2 = await ev(`(() => { let p = 0; for (const ch of window.__run.world.loaded.values()) for (const B of ch.bands.values()) B.rt && B.rt._frJob && p++; return p; })()`);
      if (pend2 === 0 && i > 4) break;
    }
    await sleep(1200);
    const s = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(`${out}/${n}.png`, Buffer.from(s.result.data, "base64"));
    console.log(n, await ev(`JSON.stringify({ x: Math.round(window.__run.player.cx), y: Math.round(window.__run.player.cy) })`));
  }
} finally {
  console.log(JSON.stringify({ errors }));
  ws.close();
  await fetch("http://127.0.0.1:9333/json/close/" + created.id).catch(() => {});
}
