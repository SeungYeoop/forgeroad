// 그래스메어 몬스터 시험: 탐험 시작 후 몬스터를 하나씩 플레이어 앞에 소환해 싸우는 모습을 찍는다 (오류·경고 수집)
//   node --import ./tools/json-hook.mjs tools/gmfight.mjs [폴더] [id,id,...]
import fs from "node:fs";
const url = process.env.TEST_URL || "http://localhost:5173/";
const out = process.argv[2] || "shots/gmfight";
const ids = (process.argv[3] || "gm_slime,gm_goblin,gm_wolf,gm_boar,gm_wasp,gm_mandrake,gm_ogre,gm_centaur").split(",");
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
  for (const fid of ids) {
    const r = await ev(`(() => { const sc = window.__run, p = sc.player; for (const e of sc.enemies) e.remove?.(); const fly = /wasp/.test(${JSON.stringify(fid)}); const e = sc.spawnEnemy(${JSON.stringify(fid)}, p.cx + 150, p.body.y - (fly ? 80 : 4)); if (!e) return "spawn failed"; e.aggro = !0; window.__tf = e; return JSON.stringify({ hp: e.hp, atk: Math.round(e.atk), name: e.def.name, elite: !!e.isElite }); })()`);
    console.log(fid, r);
    const seen = new Set();
    for (const t of [700, 1600, 2600]) {
      await sleep(t - (seen.size ? [...seen].pop() : 0));
      seen.add(t);
      const anim = await ev(`window.__tf && window.__tf.fz ? window.__tf.fz.anim.name : "?"`);
      const s = await send("Page.captureScreenshot", { format: "png", clip: process.env.FULL ? { x: 0, y: 0, width: 1280, height: 720, scale: 1 } : { x: 240, y: 120, width: 800, height: 480, scale: 1 } });
      fs.writeFileSync(`${out}/${fid}_${t}.png`, Buffer.from(s.result.data, "base64"));
      console.log("  ", t, anim);
    }
  }
} finally {
  console.log(JSON.stringify({ errors: errors.slice(0, 20) }));
  ws.close();
  await fetch("http://127.0.0.1:9333/json/close/" + created.id).catch(() => {});
}
