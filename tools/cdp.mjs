// usage: node cdp.mjs <script.js>  — evaluates script (async fn body) in the page on port 9333
import fs from "fs";
const code = fs.readFileSync(process.argv[2], "utf8");
const list = await (await fetch("http://127.0.0.1:9333/json")).json();
const pg = list.find((t) => t.type === "page");
const ws = new WebSocket(pg.webSocketDebuggerUrl);
let id = 0; const pend = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } else if (d.method === "Runtime.consoleAPICalled" && process.env.LOG) console.log("[console]", d.params.args.map(a=>a.value).join(" ")); else if (d.method === "Runtime.exceptionThrown") console.log("[exception]", d.params.exceptionDetails.exception?.description?.slice(0,400)); };
await new Promise((r) => (ws.onopen = r));
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send("Runtime.enable");
const r = await send("Runtime.evaluate", { expression: `(async()=>{${code}})()`, awaitPromise: true, returnByValue: true });
console.log(JSON.stringify(r.result?.result?.value ?? r.result?.exceptionDetails?.exception?.description ?? r, null, 1));
if (process.argv[3]) { const shot = await send("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(process.argv[3], Buffer.from(shot.result.data, "base64")); }
ws.close();
