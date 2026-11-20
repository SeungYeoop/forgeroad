// 몬스터 크기 비교: 발밑을 맞춰 한 줄로 (맨 왼쪽 막대 = 플레이어 키 35px)
//   node tools/pxlineup.mjs out.png 배율
import { savePNG } from "./png.mjs";
const [out = "lineup.png", scS = "4"] = process.argv.slice(2), sc = +scS;
const pg0 = await import("../src/forge/foes/pg0.js"), pgob = await import("../src/forge/foes/pgob.js"), pgm = await import("../src/forge/foes/pgm.js"), pgl = await import("../src/forge/foes/pgl.js");
const list = [pg0.slimeFrame({ scale: 0.62 }), pg0.slimeFrame({}), pgm.mandrakeFrame(), pgob.goblinFrame(), pgm.waspFrame(), pgm.wolfFrame(), pgm.boarFrame(), pgl.centaurFrame({ k: 0.7 }), pgl.ogreFrame({ k: 0.66 })];
const gap = 6, Hm = Math.max(...list.map((c) => c.H)), W = 20 + list.reduce((a, c) => a + c.W + gap, 0), H = Hm + 8;
const img = new Uint8Array(W * sc * H * sc * 4);
const put = (x, y, r, g, b) => { for (let j = 0; j < sc; j++) for (let i = 0; i < sc; i++) { const k = ((y * sc + j) * W * sc + x * sc + i) * 4; img[k] = r; img[k + 1] = g; img[k + 2] = b; img[k + 3] = 255; } };
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const c = ((x >> 2) + (y >> 2)) % 2 ? 60 : 68; put(x, y, c, c + 2, c + 8); }
const base = H - 4;
for (let x = 0; x < W; x++) put(x, base, 110, 84, 56);
for (let y = base - 35; y < base; y++) for (let x = 6; x < 10; x++) put(x, y, 200, 70, 70);
let ox = 20;
for (const C of list) {
  for (let y = 0; y < C.H; y++) for (let x = 0; x < C.W; x++) { const c = C.d[y * C.W + x]; if (c >= 0) put(ox + x, base - C.H + y, (c >> 16) & 255, (c >> 8) & 255, c & 255); }
  ox += C.W + gap;
}
savePNG(out, W * sc, H * sc, img);
console.log("ok", out);
