// 2D 픽셀 그림 보기: node tools/pxview.mjs out.png 배율 모듈 함수 [자세 JSON 배열]
//   예) node tools/pxview.mjs shots/px.png 8 pg0 goblinFrame '[{},{"bob":1}]'
import { savePNG } from "./png.mjs";
const [out = "px.png", scS = "8", mod = "pg0", fn = "goblinFrame", poses = "[{}]"] = process.argv.slice(2);
const M = await import(`../src/forge/foes/${mod}.js`);
const list = JSON.parse(poses).map((p) => M[fn](p));
const sc = +scS, W0 = list[0].W, H0 = list[0].H, W = (W0 * sc + 8) * list.length, H = H0 * sc + 8;
const img = new Uint8Array(W * H * 4);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4, c = ((x >> 4) + (y >> 4)) % 2 ? 60 : 70; img[i] = c; img[i + 1] = c + 2; img[i + 2] = c + 8; img[i + 3] = 255; }
list.forEach((C, k) => {
  for (let y = 0; y < C.H * sc; y++)
    for (let x = 0; x < C.W * sc; x++) {
      const c = C.d[Math.floor(y / sc) * C.W + Math.floor(x / sc)];
      if (c < 0) continue;
      const i = ((4 + y) * W + 4 + k * (W0 * sc + 8) + x) * 4;
      img[i] = (c >> 16) & 255; img[i + 1] = (c >> 8) & 255; img[i + 2] = c & 255;
    }
});
savePNG(out, W, H, img);
console.log("ok", out);
