// 몬스터 그림을 별도 스레드에서 렌더한다
import { MODELS } from "./models.js";
import { renderSheet } from "./sheet.js";

self.onmessage = (ev) => {
  const { id } = ev.data;
  const spec = MODELS[id];
  if (!spec) return void self.postMessage({ id, error: "no model" });
  try {
    const s = renderSheet(spec, id);
    self.postMessage({ id, ...s }, [s.buf.buffer]);
  } catch (e) {
    self.postMessage({ id, error: String(e) });
  }
};
