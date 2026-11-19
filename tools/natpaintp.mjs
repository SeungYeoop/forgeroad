// natpaint.mjs를 여러 프로세스로 나눠 그린다 (조각마다 따로) — 구역 전체 그림을 빨리
//   node tools/natpaintp.mjs <구역id> <시드> <출력.png> [x0 y0 w h]   (NOREP·DOWN·MARK 그대로, JOBS=프로세스 수)
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { savePNG } from "./png.mjs";
import { ZONES, upChunk, downChunk } from "../src/forge/zones.js";
import { planOf, packPlan } from "../src/forge/natgen.js";
import v8 from "node:v8";
const [id = "g1_0", seed = "1", out = "paint.png", ...crop] = process.argv.slice(2);
const z = ZONES.find((q) => q.id === id);
const n = Number(process.env.JOBS || Math.min(6, Math.max(2, os.cpus().length >> 1)));
const t0 = performance.now();
const tmp = path.join(os.tmpdir(), `natp_${process.pid}`);
// 설계는 한 번만 (natpaint.mjs와 같은 설정)
{
  const o = { seed: Number(seed), Ft: 528, up: z.kind === "zone" ? upChunk(z) : -1, down: z.kind === "zone" ? downChunk(z) : -1, fe: 1, ze: 0, biome: null, noRepair: !!process.env.NOREP };
  const CAVE_BIO = (x, y) => (y === 3 ? "magma" : y === 2 ? "deep" : x === -1 ? "lush" : Math.abs(x) % 2 ? "geode" : "drip");
  const GROUND_BIO = { "-3": "drip", "-2": "deep", "-1": "lush", 1: "drip", 2: "geode", 3: "magma" };
  o.biome = z.y > 0 ? CAVE_BIO(z.x, z.y) : GROUND_BIO[z.x] ?? "drip";
  o.patterns = z.y === 0 ? z.reg?.patterns : null;
  const t = performance.now();
  const P = planOf(z, o);
  console.log("plan", Math.round(performance.now() - t) + "ms", JSON.stringify(P.check));
  fs.writeFileSync(tmp + ".plan", v8.serialize(packPlan(P).data));
  process.env.PLANFILE = tmp + ".plan";
}
const here = path.dirname(fileURLToPath(import.meta.url));
await Promise.all(
  Array.from({ length: n }, (_, k) =>
    new Promise((res, rej) => {
      const p = spawn(process.execPath, ["--import", "./tools/json-hook.mjs", path.join(here, "natpaint.mjs"), id, seed, `${tmp}_${k}`, ...crop], { env: { ...process.env, PART: `${k}/${n}` }, stdio: ["ignore", "ignore", "inherit"] });
      p.on("exit", (c) => (c ? rej(new Error("part " + k + " exit " + c)) : res()));
    }),
  ),
);
const WP = (z.c1 - z.c0) * 512;
const [cx = 0, cy = 0, W = WP, H = 528 * 16] = crop.map(Number);
const parts = Array.from({ length: n }, (_, k) => fs.readFileSync(`${tmp}_${k}.raw`));
const img = new Uint8Array(W * H * 4);
for (let x = 0; x < W; x++) {
  const k = Math.floor((cx + x) / 512) % n, src = parts[k];
  for (let y = 0; y < H; y++) {
    const q = (y * W + x) * 4;
    img[q] = src[q]; img[q + 1] = src[q + 1]; img[q + 2] = src[q + 2]; img[q + 3] = 255;
  }
}
parts.forEach((_, k) => fs.unlinkSync(`${tmp}_${k}.raw`));
const DN = Number(process.env.DOWN || 1);
if (DN > 1) {
  const w2 = Math.floor(W / DN), h2 = Math.floor(H / DN), o2 = new Uint8Array(w2 * h2 * 4);
  for (let y = 0; y < h2; y++)
    for (let x = 0; x < w2; x++) {
      let r = 0, g = 0, b = 0;
      for (let j = 0; j < DN; j++) for (let i = 0; i < DN; i++) { const q = ((y * DN + j) * W + x * DN + i) * 4; r += img[q]; g += img[q + 1]; b += img[q + 2]; }
      const q = (y * w2 + x) * 4, m = DN * DN;
      o2[q] = r / m; o2[q + 1] = g / m; o2[q + 2] = b / m; o2[q + 3] = 255;
    }
  savePNG(out, w2, h2, o2);
} else savePNG(out, W, H, img);
console.log(`${id}: ${n} jobs, ${Math.round(performance.now() - t0)}ms → ${out}`);
