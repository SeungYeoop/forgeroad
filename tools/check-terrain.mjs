import fs from 'node:fs';
const url = process.env.TEST_URL || 'http://127.0.0.1:5198/';
const created = await (await fetch('http://127.0.0.1:9333/json/new?' + encodeURIComponent(url), {method: 'PUT'})).json();
const ws = new WebSocket(created.webSocketDebuggerUrl);
await new Promise(resolve => ws.onopen = resolve);
let id = 0;
const pending = new Map();
ws.onmessage = event => { const result = JSON.parse(event.data); if (result.id) { pending.get(result.id)?.(result); pending.delete(result.id); } };
const send = (method, params = {}) => new Promise(resolve => { const key = ++id; pending.set(key, resolve); ws.send(JSON.stringify({id: key, method, params})); });
const evaluate = async expression => {
  const result = await send('Runtime.evaluate', {expression, awaitPromise: true, returnByValue: true});
  if (result.result?.exceptionDetails) throw new Error(result.result.exceptionDetails.exception?.description);
  return result.result?.result?.value;
};
try {
  if (process.env.DISABLE_WORKERS === '1') {
    await send('Page.addScriptToEvaluateOnNewDocument', {source: 'window.Worker = undefined;'});
    await send('Page.reload');
  }
  for (let i = 0; i < 120; i++) {
    if (await evaluate('!!window.__game')) break;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  await evaluate('window.__game.scene.start("Run")');
  for (let i = 0; i < 120; i++) {
    if (await evaluate('!!window.__run?.world')) break;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  const code = fs.readFileSync(process.argv[2], 'utf8');
  const report = await evaluate(`(async()=>{${code}})()`);
  console.log(JSON.stringify(report, null, 2));
  if (report?.passed !== true) process.exitCode = 1;
} finally { await send('Page.close'); ws.close(); }
