// 모든 몬스터 3D 모델 (id → 모델). 워커와 본 스레드가 같이 쓴다.
// 옛 지역 몬스터 모델은 지웠다. 보스(1~7지역)만 남는다
import { grayburn } from "./boss0.js";
import { elkharn } from "./m1.js";
import { grauk } from "./m2.js";
import { globrak } from "./m3.js";
import { ignar } from "./m4.js";
import { kryos } from "./m5.js";
import { sahar } from "./m6.js";
import { pxSlime, pxSlimeMini } from "./pg0.js";
import { pxGoblin } from "./pgob.js";
import { pxWolf, pxBoar, pxWasp, pxMandrake } from "./pgm2.js";
import { pxOgre, pxCentaur } from "./pgl.js";

import { NEW_MODELS } from "./newmodels.js";

export const MODELS = {
  frb0: grayburn, frb1: elkharn, frb2: grauk, frb3: globrak, frb4: ignar, frb5: kryos, frb6: sahar,
  gm_slime: pxSlime, gm_slime_mini: pxSlimeMini, gm_goblin: pxGoblin, gm_wolf: pxWolf, gm_boar: pxBoar, gm_wasp: pxWasp, gm_mandrake: pxMandrake, gm_ogre: pxOgre, gm_centaur: pxCentaur,
  ...NEW_MODELS,
};
