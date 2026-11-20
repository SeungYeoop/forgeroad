// 새 지역 몬스터 그림 (id → 2D 픽셀 스펙). 워커와 본 스레드가 같이 쓴다 (models.js)
import { pxGoat, pxQueen, pxShaman, pxMole } from "./pgm3.js";
export const NEW_MODELS = {
  gm_goat: pxGoat, gm_queen: pxQueen, gm_shaman: pxShaman, gm_mole: pxMole,
};
