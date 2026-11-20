// 새 지역 몬스터 그림 (id → 2D 픽셀 스펙). 워커와 본 스레드가 같이 쓴다 (models.js)
import { pxGoat, pxQueen, pxShaman, pxMole } from "./pgm3.js";
import * as SB from "./px_sb.js";
import * as DS from "./px_ds.js";
export const NEW_MODELS = {
  gm_goat: pxGoat, gm_queen: pxQueen, gm_shaman: pxShaman, gm_mole: pxMole,
  // 스톤브리지
  sb_lizard: SB.pxLizard, sb_statue: SB.pxStatue, sb_mason: SB.pxMason, sb_warden: SB.pxWarden,
  sb_monkey: SB.pxMonkey, sb_jar: SB.pxJar, sb_swallow: SB.pxSwallow, sb_griffin: SB.pxGriffin,
  sb_rune: SB.pxRune, sb_gargoyle: SB.pxGargoyle, sb_ghost: SB.pxGhost, sb_wyvern: SB.pxWyvern,
  // 드립스톤
  ds_bat: DS.pxCaveBat, ds_mimic: DS.pxStalMimic, ds_drop: DS.pxDrop, ds_giant: DS.pxLimeGiant,
  ds_newt: DS.pxNewt, ds_leech: DS.pxLeech, ds_moss: DS.pxGlowMoss, ds_eel: DS.pxEel,
  ds_beetle: DS.pxRockBeetle, ds_echo: DS.pxEcho, ds_centipede: DS.pxCentipede, ds_basilisk: DS.pxBasilisk,
};
