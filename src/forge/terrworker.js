// 지형 픽셀 계산 전용 작업 스레드 (terrain.js pixSteps를 그대로 돌린다)
import { pixSteps } from "./terrain.js";

self.onmessage = (ev) => {
  const { id, codes, CW, ROWS, margin, base, ch, region } = ev.data;
  try {
    const raw = (wc, r) => {
      const c = Math.max(0, Math.min(CW - 1, wc - base + margin));
      return codes[r * CW + c];
    };
    const g = pixSteps({ grid: { length: ch.n }, ug: ch.ug, clouds: ch.clouds, pools: ch.pools }, base, raw, region);
    let s;
    do s = g.next(); while (!s.done);
    const { img, front, wall } = s.value;
    self.postMessage({ id, h: img.height, img: img.data.buffer, front: front.buffer, wall: wall.buffer }, [img.data.buffer, front.buffer, wall.buffer]);
  } catch (e) {
    self.postMessage({ id, error: String(e) });
  }
};
