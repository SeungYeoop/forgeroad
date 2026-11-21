// 덩굴 그네 실게임 검사: 그네 옆으로 순간이동 → 위 키로 잡기 → 오른쪽 키로 구르기 → 점프로 놓기, 위치를 기록
//   (Vite 5198 · 크롬 9333) node --import ./tools/json-hook.mjs tools/swingtest.mjs <폴더> gm1_m1 <그네 x칸> <그네 y칸> <길이칸>
import fs from "node:fs";
import { ZONES } from "../src/forge/zones.js";
const url = process.env.TEST_URL || "http://localhost:5198/";
const [outDir = ".", zid = "gm1_m1", ax = "318", ay = "950", len = "40"] = process.argv.slice(2);
const C0 = ZONES.find((q) => q.id === zid).c0;
fs.mkdirSync(outDir, { recursive: true });
const created = await (await fetch("http://127.0.0.1:9333/json/new?" + encodeURIComponent(url), { method: "PUT" })).json();
const ws = new WebSocket(created.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pend = new Map(), errors = [];
ws.onmessage = (e) => {
  const d = JSON.parse(e.data);
  if (d.id) (pend.get(d.id)?.(d), pend.delete(d.id));
  else if (d.method === "Runtime.exceptionThrown") errors.push(d.params.exceptionDetails.exception?.description?.slice(0, 300));
};
const send = (method, params = {}) => new Promise((r) => { const k = ++id; pend.set(k, r); ws.send(JSON.stringify({ id: k, method, params })); });
const ev = async (expr) => {
  const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description);
  return r.result?.result?.value;
};
const key = (type, k, code, vk) => send("Input.dispatchKeyEvent", { type, key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const st = () => ev(`(() => { const p = window.__run.player; return { x: Math.round(p.body.x), y: Math.round(p.body.y), sw: p.swing ? +p.swing.a.toFixed(2) : null, vx: Math.round(p.body.vx), vy: Math.round(p.body.vy) }; })()`);
try {
  await send("Runtime.enable");
  for (let i = 0; i < 160 && !(await ev("!!window.__game")); i++) await sleep(500);
  await sleep(4000);
  await ev('window.__game.scene.start("Run")');
  for (let i = 0; i < 160 && !(await ev("!!window.__run?.world")); i++) await sleep(500);
  await sleep(5000);
  await ev(`(() => { const sc = window.__run; sc.player.hp = sc.player.maxHp; sc.player.iframes = 1e9; window.__FG.travel(sc, ${JSON.stringify(zid)}, "L"); })()`);
  await sleep(6000);
  // 그네 바로 옆 서쪽 땅으로
  const gx = +ax * 8 - 60, gy = (+ay + +len + 10) * 8;
  await ev(`(() => { const sc = window.__run; sc.travelTo(${C0} * 32 + Math.floor(${gx} / 16), 1, null, ${gy}); })()`);
  await sleep(25000);
  const log = [];
  log.push(["선 자리", await st()]);
  // 그네 줄 높이로 올려놓고 위 키
  log.push(["줄 옆으로", await ev(`(() => { const sc = window.__run, p = sc.player, W = p.host?.world ?? p.host?.collider ?? sc.world;
    const zx = W.devAt(p.body).zx, off = zx - p.body.x;
    p.body.x = ${+ax * 8 + 4} - off; p.body.y = ${(+ay + +len - 2) * 8 + 25}; p.body.vy = 0; p.body.vx = 0;
    return { off: Math.round(off), zx2: Math.round(W.devAt(p.body).zx), swingAt: !!W.devAt(p.body).swing }; })()`)]);
  await key("keyDown", "w", "KeyW", 87);
  await sleep(300);
  log.push(["잡음", await st()]);
  await key("keyUp", "w", "KeyW", 87);
  await key("keyDown", "d", "KeyD", 68);
  for (let i = 0; i < 6; i++) (await sleep(250), log.push(["구르기", await st()]));
  await key("keyUp", "d", "KeyD", 68);
  await key("keyDown", " ", "Space", 32);
  await sleep(120);
  await key("keyUp", " ", "Space", 32);
  for (let i = 0; i < 4; i++) (await sleep(200), log.push(["놓은 뒤", await st()]));
  const s = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(`${outDir}/swing.png`, Buffer.from(s.result.data, "base64"));
  for (const [n, v] of log) console.log(n, JSON.stringify(v));
} finally {
  console.log(JSON.stringify({ errors }, null, 1));
  ws.close();
  await fetch("http://127.0.0.1:9333/json/close/" + created.id).catch(() => {});
}
