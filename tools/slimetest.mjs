// 그래스메어 몬스터 시험: 탐험 시작 후 몬스터를 하나씩 플레이어 앞에 소환해 싸우는 모습을 찍는다 (오류·경고 수집)
//   node --import ./tools/json-hook.mjs tools/gmfight.mjs [폴더] [id,id,...]
import fs from "node:fs";
const url = process.env.TEST_URL || "http://localhost:5173/";
const out = process.argv[2] || "shots/gmfight";
const ids = ["gm_slime"];
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
  else if (d.method === "Runtime.consoleAPICalled" && (d.params.type === "warning" || d.params.type === "error")) errors.push(d.params.args.map((a) => a.value ?? a.description).join(" ").slice(0, 200));
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
  // 평평한 들판 끝(입구)으로: 주변 적은 치운다
  await ev(`(() => { const sc = window.__run; sc.player.iframes = 1e9; sc.player.maxHp = sc.player.hp = 1e6; for (const e of sc.enemies) e.remove?.(); })()`);
  // 슬라임을 플레이어 앞에 두고 확대 연속 촬영 (자세·이펙트·바닥 붙음 확인), 마지막엔 때려서 죽인다
  const shot = async (name) => {
    const c = await ev("(() => { const sc = window.__run, e = window.__tf, cam = sc.cameras.main, z = cam.zoom; const x = e && !e.dead ? e.cx : sc.player.cx + 80, y = e && !e.dead ? e.body.y : sc.player.body.y; const rc = sc.game.canvas.getBoundingClientRect(), k = rc.width / sc.scale.width; return JSON.stringify({ x: rc.left + (x - cam.worldView.x) * z * k, y: rc.top + (y - cam.worldView.y) * z * k, a: e && e.fz ? e.fz.anim.name : \"-\" }); })()");
    const o = JSON.parse(c);
    const W = 300, H = 150, x = Math.max(0, Math.min(1280 - W, o.x - W / 2)), y = Math.max(0, Math.min(720 - H, o.y - H * 0.7));
    const s = await send("Page.captureScreenshot", { format: "png", clip: { x, y, width: W, height: H, scale: 3 } });
    fs.writeFileSync(out + "/" + name + ".png", Buffer.from(s.result.data, "base64"));
    return o.a;
  };
  const r = await ev(`(() => { const sc = window.__run, p = sc.player; for (const e of sc.enemies) e.remove?.(); const e = sc.spawnEnemy("gm_slime", p.cx + Number(${process.env.DIST || 120}), p.body.y - 4); if (!e) return "fail"; window.__tf = e; return JSON.stringify({ hp: e.hp, atk: e.atk }); })()`);
  console.log(r);
  const N = Number(process.env.N || 24), STEP = Number(process.env.STEP || 160);
  for (let i = 0; i < N; i++) {
    if (i === 3) await ev("window.__tf.aggro = !0");
    const a = await shot("s" + String(i).padStart(2, "0"));
    console.log(i, a);
    await sleep(STEP);
  }
  await ev("(() => { const e = window.__tf; e.receive(e.hp + 5, null, { knock: 1, dir: 1, stagger: 0.3 }); })()");
  for (let i = 0; i < 6; i++) { await sleep(120); console.log("d" + i, await shot("d" + i)); }
  await ev("window.__tf = window.__run.enemies.find((z) => !z.dead && z.def.id === \"gm_slime_mini\")");
  for (let i = 0; i < 8; i++) { await sleep(200); console.log("m" + i, await shot("m" + i)); }
} finally {
  console.log(JSON.stringify({ errors: errors.slice(0, 20) }));
  ws.close();
  await fetch("http://127.0.0.1:9333/json/close/" + created.id).catch(() => {});
}
