// 소리 엔진 계산량 재기: 오프라인 렌더에 걸린 시간 ÷ 소리 길이 (1보다 작아야 실시간으로 돈다. 작을수록 가볍다)
//   node tools/audtime.mjs [base,empty,region_ashvillage,boss_frb4,...]
const url = (process.env.TEST_URL || "http://localhost:5173/") + "sound-lab.html";
const created = await (await fetch("http://127.0.0.1:9333/json/new?" + encodeURIComponent(url), { method: "PUT" })).json();
const ws = new WebSocket(created.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pend = new Map();
ws.onmessage = (ev) => {
  const d = JSON.parse(ev.data);
  if (d.id) (pend.get(d.id)?.(d), pend.delete(d.id));
};
const send = (m, p = {}) => new Promise((r) => { const k = ++id; pend.set(k, r); ws.send(JSON.stringify({ id: k, method: m, params: p })); });
const ev = async (e) => {
  const r = await send("Runtime.evaluate", { expression: e, awaitPromise: true, returnByValue: true });
  return r.result?.result?.value ?? r.result?.exceptionDetails?.exception?.description;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  await send("Page.bringToFront");
  for (let i = 0; i < 120 && !(await ev("!!window.__lab")); i++) await sleep(250);
  const sec = +(process.env.SEC || 10);
  for (const c of (process.argv[2] || "base,empty,region_ashvillage,boss_frb4").split(",")) {
    const r = await ev(`(async () => {
      const A = await import("/src/forge/audio.js");
      const sec = ${sec}, c = ${JSON.stringify(c)};
      let t0 = performance.now(), tb = 0;
      if (c === "base") {
        const ctx = new OfflineAudioContext(2, 44100 * sec, 44100);
        for (let i = 0; i < 40; i++) { const o = ctx.createOscillator(); o.connect(ctx.destination); o.start(); }
        await ctx.startRendering();
      } else if (c === "empty") await A.renderOffline({ seconds: sec });
      else {
        const T = window.__lab.tracks.find((t) => t.key === c);
        await A.renderOffline({ seconds: sec, music: T.key, spec: T.spec, mute: ${JSON.stringify(process.env.MUTE ? process.env.MUTE.split("+") : null)} });
      }
      return ((performance.now() - t0) / 1000 / sec).toFixed(3);
    })()`);
    console.log(c.padEnd(24), "x realtime:", r);
  }
} finally {
  ws.close();
  await fetch("http://127.0.0.1:9333/json/close/" + created.id).catch(() => {});
}
