// 몬스터 영역(추적 중단)·층별 몬스터·미니맵 확대 실게임 검사 (natview.mjs와 같은 준비)
//   TEST_URL=http://localhost:5198/ node --import ./tools/json-hook.mjs tools/leashtest.mjs <스크린샷 폴더>
import fs from "node:fs";
import { ZONES } from "../src/forge/zones.js";
const C0 = ZONES.find((q) => q.id === "g1_0").c0;
const url = process.env.TEST_URL || "http://localhost:5198/";
const outDir = process.argv[2] || ".";
fs.mkdirSync(outDir, { recursive: true });
const created = await (await fetch("http://127.0.0.1:9333/json/new?" + encodeURIComponent(url), { method: "PUT" })).json();
const ws = new WebSocket(created.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pend = new Map(), errors = [];
ws.onmessage = (ev) => {
  const d = JSON.parse(ev.data);
  if (d.id) (pend.get(d.id)?.(d), pend.delete(d.id));
  else if (d.method === "Runtime.exceptionThrown") errors.push(d.params.exceptionDetails.exception?.description?.slice(0, 400));
  else if (d.method === "Runtime.consoleAPICalled" && d.params.type === "error") errors.push(d.params.args.map((a) => a.value ?? a.description).join(" ").slice(0, 300));
};
const send = (method, params = {}) => new Promise((r) => { const k = ++id; pend.set(k, r); ws.send(JSON.stringify({ id: k, method, params })); });
const ev = async (expr) => {
  const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description);
  return r.result?.result?.value;
};
const shot = async (file) => fs.writeFileSync(file, Buffer.from((await send("Page.captureScreenshot", { format: "png" })).result.data, "base64"));
const key = async (k, code, vk) => {
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: k, code, windowsVirtualKeyCode: vk });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code, windowsVirtualKeyCode: vk });
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  await send("Runtime.enable");
  for (let i = 0; i < 160 && !(await ev("!!window.__game")); i++) await sleep(500);
  await sleep(5000);
  await ev('window.__game.scene.start("Run")');
  for (let i = 0; i < 160 && !(await ev("!!window.__run?.world")); i++) await sleep(500);
  await sleep(5000);
  await ev(`(() => { const sc = window.__run; sc.player.iframes = 1e9; window.__FG.travel(sc, "g1_0", "L"); })()`);
  await sleep(9000);
  const god = `const sc = window.__run; sc.player.hp = sc.player.maxHp; sc.player.iframes = 1e9;`;
  // 1) 층별 몬스터: 구역을 훑으며 불러온 적을 층마다 센다
  const seen = {};
  for (const fx of [900, 2000, 3000, 4200, 5200, 6300, 7300]) {
    for (const fy of [4700, 2400, 6800]) {
      await ev(`(() => { ${god} const z = { c0: ${C0} }; sc.travelTo(z.c0 * 32 + Math.floor(${fx} / 16), 1, null, ${fy}); })()`);
      await sleep(1500);
      const r = await ev(`(() => { const sc = window.__run; return sc.enemies.filter((e) => !e.dead).map((e) => [e.def.id, e.opts.layer ?? "-", e._terr?.lay ?? "?"]); })()`);
      for (const [d, l, t] of r) ((seen[l] ??= {})[d] = (seen[l][d] ?? 0) + 1), l !== "-" && t !== "?" && t !== l && errors.push(`layer mismatch ${d} ${l} ${t}`);
    }
  }
  console.log("monsters by layer (loaded)", JSON.stringify(seen));
  // 2) 추적 중단: 지표 몬스터 옆에 서서 알아채게 한 뒤, 영역 밖으로 / 하늘섬으로
  const pickExpr = `(() => { const sc = window.__run; const p = sc.player;
    const c = sc.enemies.filter((e) => !e.dead && e.opts.layer === "ground" && e.def.ai !== "golden").sort((a, b) => Math.abs(a.cx - p.x) - Math.abs(b.cx - p.x))[0];
    if (!c) return null; window.__TID = c.opts.spawnId; return { id: c.def.id, x: Math.round(c.cx), hx: Math.round(c.homeX) }; })()`;
  await ev(`(() => { ${god} const z = { c0: ${C0} }; sc.travelTo(z.c0 * 32 + 60, 1, null, 4700); })()`);
  await sleep(2000);
  let t = await ev(pickExpr);
  console.log("target", JSON.stringify(t));
  if (t) {
    const T = `(window.__run.enemies.find((q) => q.opts.spawnId === window.__TID && !q.removed))`;
    const st = `(() => { const e = ${T}, p = window.__run.player; return { aggro: e.aggro, home: !!e._home, state: e.state, ex: Math.round(e.cx), hx: Math.round(e.homeX), px: Math.round(p.x), hp: Math.round(e.hp) + "/" + e.maxHp, terr: e._terr ?? null, pl: window.__run._plL?.v ?? null }; })()`;
    const mv = (dx) => `(() => { ${god} const e = ${T}, b = sc.player.body, X = e.homeX + (${dx}); b.x = X; b.y = sc.surfaceYAt(X); b.vx = b.vy = 0; })()`;
    await ev(mv(-60));
    await sleep(3000);
    const a1 = await ev(st);
    console.log("near   ", JSON.stringify(a1));
    await shot(`${outDir}/leash_near.png`);
    // 영역 밖 (집에서 700px)
    await ev(`(() => { const e = ${T}; e.hp = Math.round(e.maxHp * 0.5); })()`);
    await ev(mv(-700));
    await sleep(600);
    const a2 = await ev(st);
    console.log("out 0.6s", JSON.stringify(a2));
    await sleep(4000);
    const a3 = await ev(st);
    console.log("out 4.6s", JSON.stringify(a3));
    (a1.aggro !== true) && errors.push("near: not aggro");
    (a2.aggro !== false) && errors.push("out: still aggro");
    Math.abs(a3.ex - a3.hx) > 30 && errors.push("did not return home");
  }
  // 3) 미니맵 확대·축소
  await ev(`(() => { ${god} const z = { c0: ${C0} }; sc.travelTo(z.c0 * 32 + Math.floor(3000 / 16), 1, null, 4700); })()`);
  await sleep(2500);
  const mz = () => ev(`window.__run.hud().frMini.zi`);
  await shot(`${outDir}/mini_z1.png`);
  await key("-", "Minus", 189); await sleep(500);
  console.log("zoom after -", await mz()); await shot(`${outDir}/mini_z2.png`);
  await key("-", "Minus", 189); await sleep(500);
  console.log("zoom after --", await mz()); await shot(`${outDir}/mini_z4.png`);
  await key("-", "Minus", 189); await sleep(300);
  console.log("zoom clamp", await mz());
  for (let i = 0; i < 3; i++) (await key("+", "Equal", 187), await sleep(300));
  console.log("zoom after +++", await mz()); await sleep(400); await shot(`${outDir}/mini_z05.png`);
  await key("-", "Minus", 189); await sleep(300);
  console.log("zoom reset", await mz());
  const fps = await ev(`Math.round(window.__game.loop.actualFps)`);
  console.log("fps", fps);
} finally {
  console.log(JSON.stringify({ errors }, null, 1));
  ws.close();
  await fetch("http://127.0.0.1:9333/json/close/" + created.id).catch(() => {});
}
