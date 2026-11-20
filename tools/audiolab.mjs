// 소리 측정: 사운드 실험실 페이지에서 곡·효과음·환경음을 오프라인으로 렌더해 크기·주파수 분포를 재고 스펙트로그램을 저장한다
//   node tools/audiolab.mjs [music|sfx|amb|all] [초] [곡 키 걸러내기]
//   결과: shots/aud_<키>.png (위: 파형, 아래: 스펙트로그램, 노란 줄: 구간 경계), 표준 출력에 dB·대역 비율
import fs from "node:fs";
const url = (process.env.TEST_URL || "http://localhost:5173/") + "sound-lab.html";
const [what = "all", secS = "40", filt = ""] = process.argv.slice(2);
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
  if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? "eval error");
  return r.result?.result?.value;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const save = (name, png) => fs.writeFileSync(`shots/aud_${name.replace(/[^a-z0-9_]/gi, "_")}.png`, Buffer.from(png.split(",")[1], "base64"));
try {
  await send("Runtime.enable");
  for (let i = 0; i < 120 && !(await ev("!!window.__lab")); i++) await sleep(250);
  const out = {};
  if (what === "music" || what === "all") {
    const tracks = await ev("window.__lab.tracks");
    for (const T of tracks) {
      if (filt && !T.key.includes(filt)) continue;
      const r = await ev(`window.__lab.measure(${JSON.stringify(T.key)}, ${JSON.stringify(T.spec)}, ${+secS})`);
      save(T.key, r.png);
      out[T.key] = { peak: r.peakDb, rms: r.rmsDb, st: r.stMaxDb, bands: r.bands, style: r.info.style, tempo: r.info.tempo, secs: r.info.sections.map((s) => s.join("@")).join(" ") };
      console.log(T.key.padEnd(28), JSON.stringify(out[T.key]));
    }
  }
  if (what === "sfx" || what === "all") {
    const r = await ev("window.__lab.sfx()");
    save("sfx", r.png);
    console.log("sfx", JSON.stringify({ peak: r.peakDb, bands: r.bands }));
    console.log(Object.entries(r.per).map(([k, v]) => `${k}:${v[0]}/${v[1]}`).join("  "));
  }
  if (what === "amb" || what === "all") {
    for (const t of ["village", "forest", "cave", "swamp", "fire", "snow", "desert", "storm", "sanctum", "sky", "abyss", "forge", "hub", "rift"]) {
      if (filt && !t.includes(filt)) continue;
      const r = await ev(`window.__lab.amb(${JSON.stringify(t)}, 16)`);
      save("amb_" + t, r.png);
      console.log(("amb " + t).padEnd(16), JSON.stringify({ peak: r.peakDb, rms: r.rmsDb, bands: r.bands }));
    }
  }
} catch (e) {
  console.log("FAIL", e.message);
} finally {
  console.log(JSON.stringify({ errors }));
  ws.close();
  await fetch("http://127.0.0.1:9333/json/close/" + created.id).catch(() => {});
}
