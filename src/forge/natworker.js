// 구역 지형 설계(natgen planOf)를 게임 밖 스레드에서: 큰 구역은 몇 초씩 걸려 화면이 멈추지 않게
import { planOf, packPlan } from "./natgen.js";
import { BY_ID } from "./zones.js";

self.onmessage = (ev) => {
  const { id, z, o } = ev.data;
  try {
    // 지역 정보(색·테마)가 있는 진짜 구역으로 (나무·구조물 종류가 지역마다 다르다)
    const P = planOf(BY_ID[z.id] ?? z, o);
    const { data, transfer } = packPlan(P);
    self.postMessage({ id, data }, transfer);
  } catch (e) {
    self.postMessage({ id, error: String(e?.stack ?? e) });
  }
};
