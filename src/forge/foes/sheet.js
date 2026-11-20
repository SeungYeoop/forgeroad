// 몬스터 시트 렌더 (순수 계산 — 워커와 본 스레드 모두에서 쓴다)
import { model, render } from "./r3d.js";

export function renderSheet(spec, key = "") {
  const names = Object.keys(spec.anims);
  const total = names.reduce((a, n) => a + spec.anims[n][0], 0);
  // 텍스처 폭은 2048 이하로 (모바일 한도): 넘치면 여러 줄로 감는다
  const fw = spec.fw, fh = spec.fh, cols = Math.max(1, Math.min(total, Math.floor(2048 / fw))), rows = Math.ceil(total / cols);
  const W = fw * cols, H = fh * rows;
  const buf = new Uint32Array(W * H);
  const fi = {};
  let f = 0;
  for (const nm of names) {
    const [n] = spec.anims[nm];
    fi[nm] = [];
    for (let k = 0; k < n; k++) {
      let fr;
      if (spec.px) {
        // 2D 픽셀로 직접 그린 그림
        fr = new Uint32Array(fw * fh);
        try {
          const cv = spec.px(nm, k, n), src = cv.rgba();
          for (let y = 0; y < Math.min(fh, cv.H); y++) fr.set(src.subarray(y * cv.W, y * cv.W + Math.min(fw, cv.W)), y * fw);
        } catch (e) {
          console.warn("foe px", key, nm, k, e);
        }
      } else {
        const M = model();
        try {
          spec.model(M, nm, k, n);
        } catch (e) {
          console.warn("foe model", key, nm, k, e);
        }
        fr = render(M, fw, fh, spec.render ?? {});
      }
      const ox = (f % cols) * fw, oy = Math.floor(f / cols) * fh;
      for (let y = 0; y < fh; y++) buf.set(fr.subarray(y * fw, y * fw + fw), (oy + y) * W + ox);
      fi[nm].push(f++);
    }
  }
  return { buf, fi, W, H, cols, fh, fw, total };
}
