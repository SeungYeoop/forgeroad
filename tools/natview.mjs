// 실제 게임에서 구역의 정한 자리들로 순간이동해 화면을 찍는다 (헤드리스 크롬 원격 제어, natcheck.mjs와 같은 준비)
//   node tools/natview.mjs <스크린샷 폴더> <구역id> "x,y,이름;x,y,이름;…" [ZOOM=0.6]
//   x·y = 구역 안 px (y = 발 높이)
import fs from "node:fs";
import { ZONES } from "../src/forge/zones.js";
const url = process.env.TEST_URL || "http://localhost:5198/";
const [outDir = ".", zid = "g1_0", spec = ""] = process.argv.slice(2);
const zoom = Number(process.env.ZOOM || 1);
const C0 = ZONES.find((q) => q.id === zid).c0;
const points = spec.split(";").filter(Boolean).map((s) => { const [x, y, n] = s.split(","); return { x: Number(x), y: Number(y), n: n || `${x}_${y}` }; });
fs.mkdirSync(outDir, { recursive: true });
const created = await (await fetch("http://127.0.0.1:9333/json/new?" + encodeURIComponent(url), { method: "PUT" })).json();
const ws = new WebSocket(created.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pend = new Map(), errors = [];
ws.onmessage = (ev) => {
  const d = JSON.parse(ev.data);
  if (d.id) (pend.get(d.id)?.(d), pend.delete(d.id));
  else if (d.method === "Runtime.exceptionThrown") errors.push(d.params.exceptionDetails.exception?.description?.slice(0, 300));
  else if (d.method === "Runtime.consoleAPICalled" && d.params.type === "error") errors.push(d.params.args.map((a) => a.value ?? a.description).join(" ").slice(0, 300));
};
const send = (method, params = {}) => new Promise((r) => { const k = ++id; pend.set(k, r); ws.send(JSON.stringify({ id: k, method, params })); });
const ev = async (expr) => {
  const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description);
  return r.result?.result?.value;
};
const shot = async (file) => {
  const s = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(file, Buffer.from(s.result.data, "base64"));
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  await send("Runtime.enable");
  for (let i = 0; i < 160 && !(await ev("!!window.__game")); i++) await sleep(500);
  await sleep(4000);
  await ev('window.__game.scene.start("Run")');
  for (let i = 0; i < 160 && !(await ev("!!window.__run?.world")); i++) await sleep(500);
  await sleep(5000);
  await ev(`(() => { const sc = window.__run; sc.player.hp = sc.player.maxHp; sc.player.iframes = 1e9; (window.__devUnlock = 1), window.__FG.travel(sc, ${JSON.stringify(zid)}, "L"); })()`);
  await sleep(6000);
  for (const p of points) {
    const info = await ev(`(() => { const sc = window.__run;
      sc.player.hp = sc.player.maxHp; sc.player.iframes = 1e9;
      sc.travelTo(${C0} * 32 + Math.floor(${p.x} / 16), 1, null, ${p.y});
      const z = window.__FG.zoneOfPlayer(sc) ?? { id: "?" };
      ${zoom !== 1 ? `sc.cameras.main.setZoom(${zoom});` : ""}
      return { zone: z.id, x: Math.round(sc.player.x), y: Math.round(sc.player.y) }; })()`);
    await sleep(Number(process.env.WAIT || 2800));
    await shot(`${outDir}/${zid}_${p.n}.png`);
    console.log(p.n, JSON.stringify(info));
  }
} finally {
  console.log(JSON.stringify({ errors }, null, 1));
  ws.close();
  await fetch("http://127.0.0.1:9333/json/close/" + created.id).catch(() => {});
}
