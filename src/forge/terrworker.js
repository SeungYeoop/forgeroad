// 지형 픽셀 계산 전용 작업 스레드 (칸 지형은 terrain.js pixSteps, 자연 지형은 terrfine.js pixFine)
import { pixSteps } from "./terrain.js";
import { pixFine, cropBand } from "./terrfine.js";

self.onmessage = (ev) => {
  const { id, codes, CW, ROWS, margin, base, ch, region, fine, bandTop, bandH } = ev.data;
  try {
    let g;
    if (fine) g = pixFine(ch, base, region, fine);
    else {
      const raw = (wc, r) => {
        const c = Math.max(0, Math.min(CW - 1, wc - base + margin));
        return codes[r * CW + c];
      };
      g = pixSteps({ grid: { length: ch.n }, ug: ch.ug, clouds: ch.clouds, pools: ch.pools }, base, raw, region);
    }
    let s;
    do s = g.next(); while (!s.done);
    // 띠 부분만 (자연 지형은 위아래 여유 줄, 칸 지형은 전체에서 띠)
    const { img, front, wall } = fine ? cropBand(s.value, fine.cropTop, fine.cropH) : cropBand(s.value, bandTop ?? 0, bandH ?? s.value.img.height);
    self.postMessage({ id, h: img.height, img: img.data.buffer, front: front.buffer, wall: wall.buffer }, [img.data.buffer, front.buffer, wall.buffer]);
  } catch (e) {
    self.postMessage({ id, error: String(e) });
  }
};
