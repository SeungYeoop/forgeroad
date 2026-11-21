// 자연 지형 실제 게임 검사 (헤드리스 크롬 원격 제어)
//   1) node node_modules/vite/bin/vite.js --port 5198
//   2) chrome --headless=new --remote-debugging-port=9333 --user-data-dir=<임시> --use-angle=swiftshader --enable-unsafe-swiftshader --window-size=1280,720
//   3) node tools/natcheck.mjs <스크린샷 폴더> [구역id,…]
// 구역마다: 이동 → 불러온 조각의 충돌(바위 픽셀)과 그림(불투명 픽셀) 일치, 걷기·점프 봇이 구역을 가로지르는지,
//           몸이 지형에 박히는지, 화면 스크린샷
import fs from "node:fs";
const url = process.env.TEST_URL || "http://127.0.0.1:5198/";
const outDir = process.argv[2] || ".";
const zones = (process.argv[3] || "g1_0,gm1_0,gm3_0,g3_0,gm2_0,g2_0,g0_1,g0_2,g0_3,g0_m1,g0_m2,g0_m3").split(",");
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
const report = { zones: [], errors };
try {
  await send("Runtime.enable");
  for (let i = 0; i < 160 && !(await ev("!!window.__game")); i++) await sleep(500);
  await sleep(4000);
  await ev('window.__game.scene.start("Run")');
  for (let i = 0; i < 160 && !(await ev("!!window.__run?.world")); i++) await sleep(500);
  await sleep(5000);
  for (const zid of zones) {
    await ev(`(() => { const sc = window.__run; sc.player.hp = sc.player.maxHp; sc.player.iframes = 999; (window.__devUnlock = 1), window.__FG.travel(sc, ${JSON.stringify(zid)}, "L"); })()`);
    await sleep(Number(process.env.TRAVEL_WAIT || 3500));
    // 구역에 들어설 때까지 (설계가 오래 걸리면 늦게 들어선다)
    for (let i = 0; i < 20 && !(await ev("!!window.__FG.zoneOfPlayer(window.__run)")); i++) await sleep(500);
    process.env.DEBUG_POS && console.log(await ev("JSON.stringify({ x: Math.round(window.__run.player.x), y: Math.round(window.__run.player.y), oc: window.__run.world.originChunk, z: window.__FG.zoneOfPlayer(window.__run)?.id, busy: window.__run.zoneBusy, dying: window.__run.dying, wk: window.__FG._wkState?.() })"));
    // 화면: 도착 지점
    await shot(`${outDir}/${zid}_a.png`);
    const r = await ev(`(async () => {
      const sc = window.__run, W = sc.world, z = window.__FG.zoneOfPlayer(sc);
      const out = { zone: z?.id, kind: z?.y > 0 ? "cave" : z?.y < 0 ? "sky" : "ground" };
      // 1) 충돌 ↔ 그림: 바위 픽셀은 반드시 칠해져 있어야 한다 (장식은 칠해졌지만 바위가 아닐 수 있다)
      let solid = 0, solidHole = 0, air = 0, airPainted = 0, fineChunks = 0;
      for (const [C, L] of W.loaded) {
        if (!L.data.fine) continue;
        const ent = sc._frTerr?.get(L.rt);
        if (!ent) continue;
        fineChunks++;
        const img = ent.ctx.getImageData(0, 0, 512, ent.cv.height).data;
        for (let k = 0; k < 6000; k++) {
          const x = (Math.random() * 512) | 0, y = (Math.random() * ent.cv.height) | 0;
          const s = W.fsolid(C * 512 + x, y), a = img[(y * 512 + x) * 4 + 3];
          s ? (solid++, a === 0 && solidHole++) : (air++, a && airPainted++);
        }
      }
      Object.assign(out, { fineChunks, solid, solidHole, air, airPainted });
      // 2) 걷기·점프 봇: 왼쪽 출구에서 오른쪽으로 (몸 10×22, 속도 150, 점프 500, 2단 점프 440, 중력 1500)
      const g0 = z.c0 * 32 + 6;
      const b = { x: W.lx(g0) + 8, y: W.groundYAt(g0) - 1, w: 10, h: 22, vx: 0, vy: 0, onGround: !1, hitWall: 0, groundCode: 0, dropThrough: 0, groundGtx: 0, groundRow: 0 };
      const endX = W.lx(z.c1 * 32 - 8), dt = 1 / 60;
      let air2 = 1, maxX = b.x, lastProg = 0, stuckT = 0, overlaps = 0, jumps = 0, falls = 0, t = 0, dir = 1;
      for (; t < 150 && b.x < endX; t += dt) {
        b.vx = 150 * dir;
        const blocked = b.onGround && (W.wallAhead(b, dir) || b.hitWall === dir);
        if (b.onGround) air2 = 1;
        if (b.onGround && (blocked || (stuckT > 0.4 && Math.random() < 0.2))) ((b.vy = -500), jumps++);
        else if (!b.onGround && air2 && b.vy > -60 && (b.hitWall === dir || W.wallAhead(b, dir) || stuckT > 0.6)) ((b.vy = -440), air2--, jumps++);
        b.vy = Math.min(720, b.vy + 1500 * dt * (b.vy > 0 ? 1.15 : 1));
        W.move(b, dt);
        if (W.overlapAt(b, b.x, b.y)) overlaps++;
        if (b.y > 8448 + 60) { falls++; b.x = maxX - 40; const gy = sc.surfaceYAt(b.x); b.y = gy > 0 ? gy - 1 : 4800; b.vy = 0; }
        if (b.x > maxX + 1) ((maxX = b.x), (lastProg = t), (stuckT = 0));
        else stuckT = t - lastProg;
        // 오래 막히면 잠깐 뒤로 갔다 다시 (막다른 굴에서 빠져나오는 사람처럼)
        if (stuckT > 4) dir = -1;
        if (dir < 0 && stuckT > 5.5) ((dir = 1), (lastProg = t));
      }
      Object.assign(out, { bot: { reached: Math.round(((maxX - W.lx(g0)) / (endX - W.lx(g0))) * 100) + "%", t: Math.round(t), jumps, overlaps, falls } });
      // 3) 화면용: 구역 가운데쯤 지면으로 순간이동
      const mid = z.c0 * 32 + Math.floor((z.c1 - z.c0) * 32 * 0.45);
      sc.travelTo(mid, 1);
      return out;
    })()`);
    report.zones.push(r);
    console.log(JSON.stringify(r));
    await sleep(2500);
    await shot(`${outDir}/${zid}_b.png`);
  }
  // 성능: 지금 구역 안을 달리며 프레임 시간
  report.perf = await ev(`(async () => {
    const lat = window.__FG._wkState?.();
    return { worker: lat };
  })()`);
} finally {
  console.log(JSON.stringify({ errors: report.errors.slice(0, 20), perf: report.perf }, null, 1));
  fs.writeFileSync(`${outDir}/report.json`, JSON.stringify(report, null, 1));
  await send("Page.close");
  ws.close();
}
