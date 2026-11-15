// usage: node tools/profile.mjs <script.js>  — runs the script under the CPU profiler and prints top self-time functions
import fs from "fs";
const code = fs.readFileSync(process.argv[2], "utf8");
const list = await (await fetch("http://127.0.0.1:9333/json")).json();
const ws = new WebSocket(list.find((t) => t.type === "page").webSocketDebuggerUrl);
let id = 0;
const pend = new Map();
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  d.id && pend.has(d.id) && (pend.get(d.id)(d), pend.delete(d.id));
};
await new Promise((r) => (ws.onopen = r));
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send("Profiler.enable");
await send("Profiler.setSamplingInterval", { interval: 200 });
await send("Profiler.start");
const r = await send("Runtime.evaluate", { expression: `(async()=>{${code}})()`, awaitPromise: true, returnByValue: true });
const { result } = await send("Profiler.stop");
const prof = result.profile, self = new Map(), byId = new Map(prof.nodes.map((n) => [n.id, n]));
const dt = prof.timeDeltas;
const counts = new Map();
prof.samples.forEach((s, i) => counts.set(s, (counts.get(s) ?? 0) + (dt[i] ?? 0)));
for (const [nid, t] of counts) {
  const n = byId.get(nid), cf = n.callFrame;
  const k = `${cf.functionName || "(anon)"} ${cf.url.split("/").pop()}:${cf.lineNumber + 1}:${cf.columnNumber + 1}`;
  self.set(k, (self.get(k) ?? 0) + t);
}
const tot = [...self.values()].reduce((a, b) => a + b, 0);
console.log("result:", JSON.stringify(r.result?.result?.value));
console.log("total ms:", Math.round(tot / 1000));
for (const [k, t] of [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25)) console.log(String(Math.round(t / 1000)).padStart(6), "ms ", k);
ws.close();
