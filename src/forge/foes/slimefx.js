// 슬라임 이펙트: 튀는 젤리 방울(중력) · 고운 물보라 · 바닥에 퍼지는 물결 · 남는 젤리 자국 · 산성 덩이
//   그림은 pg0.js slimeFxArt (손으로 찍은 픽셀). 입자는 fx.emitters에 등록해서 화면 이동(shift)도 함께 따라간다
import { slimeFxArt } from "./pg0.js";

function tex(scene, key, cv) {
  if (scene.textures.exists(key)) return;
  const c = document.createElement("canvas");
  c.width = cv.W;
  c.height = cv.H;
  const g = c.getContext("2d"), img = g.createImageData(cv.W, cv.H);
  new Uint32Array(img.data.buffer).set(cv.rgba());
  g.putImageData(img, 0, 0);
  scene.textures.addCanvas(key, c);
}
// 장면마다 한 번: 그림 → 텍스처, 입자 발생기 등록
export function slimeFx(host) {
  const fx = host.fx, sc = fx.scene;
  if (fx.emitters.sl_drop && sc.textures.exists("sl_glob")) return fx;
  const art = slimeFxArt();
  tex(sc, "sl_drop", art.drop);
  tex(sc, "sl_drop2", art.drop2);
  tex(sc, "sl_pud", art.puddle);
  tex(sc, "sl_glob", art.glob);
  const reg = (name, key, cfg, depth) => {
    fx.emitters[name]?.destroy?.();
    const m = sc.add.particles(0, 0, key, { emitting: !1, ...cfg });
    m.setDepth(depth);
    fx.emitters[name] = m;
  };
  // 굵은 방울: 위로 튀었다가 떨어진다
  reg("sl_drop", "sl_drop", { speed: { min: 80, max: 190 }, angle: { min: 210, max: 330 }, gravityY: 1000, lifespan: { min: 260, max: 420 }, scale: { start: 1, end: 0.6 }, alpha: { start: 1, end: 0.5 }, maxAliveParticles: 200 }, 36);
  // 고운 물보라
  reg("sl_fine", "sl_drop2", { speed: { min: 30, max: 110 }, angle: { min: 195, max: 345 }, gravityY: 650, lifespan: { min: 200, max: 380 }, alpha: { start: 1, end: 0 }, maxAliveParticles: 240 }, 36);
  return fx;
}
// 철퍽: 방울 n개 + 물보라 (+ 흙먼지, 바닥 물결)
export function splash(host, x, y, n = 6, o = {}) {
  const fx = slimeFx(host);
  fx.burst("sl_drop", x, y - 3, n, 0xffffff);
  fx.burst("sl_fine", x, y - 2, Math.ceil(n * 1.4), 0xffffff);
  o.dust && fx.burst("dust", x, y, o.dust, 0xb8c8a0);
  o.ring && fx.anim("ring", x, y - 1, { scale: o.ring, scaleY: o.ring * 0.3, tint: 0x9ae860, depth: 9 });
  o.glow && fx.burst("glow", x, y - 4, o.glow, 0x7ad040);
}
// 바닥에 남는 젤리 자국: 옆으로 쫙 퍼졌다가 천천히 사라진다
export function puddle(host, x, y, o = {}) {
  const sc = slimeFx(host).scene, s = o.scale ?? 1, dur = o.dur ?? 3;
  const im = sc.add.image(Math.round(x), Math.round(y) + 1, "sl_pud").setOrigin(0.5, 1).setDepth(9).setScale(s * 0.25, s).setAlpha(0.95);
  sc.tweens.add({ targets: im, scaleX: s, duration: 180, ease: "Quad.easeOut" });
  sc.tweens.add({ targets: im, alpha: 0, scaleX: s * 0.8, delay: Math.max(0, dur * 1000 - 700), duration: 700, onComplete: () => im.destroy() });
  return im;
}
// 바로 아래 땅 높이 (없으면 null)
export function groundBelow(host, x, y, range = 64) {
  const W = host.world;
  if (!W?.solidAtPx) return null;
  for (let k = -6; k < range; k++) if (W.solidAtPx(x, y + k)) return Math.floor(y + k);
  return null;
}
