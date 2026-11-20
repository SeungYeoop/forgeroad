// 모든 몬스터 3D 모델 (id → 모델). 워커와 본 스레드가 같이 쓴다.
import { ghoul, rat, archer, scarecrow, crow, husk, warden, ringer } from "./m0.js";
import { grayburn } from "./boss0.js";
import { mossWolf, mistFairy, rootVine, sporeShroom, hunterWraith, thornHog, elderTreant, mistTwins, elkharn } from "./m1.js";
import { skelMiner, oreWorm, batSwarm, bombGoblin, crystalSpider, veinSpirit, cartKnight, stoneGolem, grauk } from "./m2.js";
import { leech, bloater, toadWarrior, dragonfly, swampHag, fungalColony, mossTroll, plagueDoctor, globrak } from "./m3.js";
import { flameInfantry, artillerist, salamander, furnaceSpirit, chainTorturer, bannerBearer, siegeGolem, guardCaptain, ignar } from "./m4.js";
import { snowWolf, iceSpirit, frostYeti, frozenSoldier, icicleBat, snowmanBomber, glacierTurtle, frostMaiden, kryos } from "./m5.js";
import { sandScorpion, desertRaider, sandSpirit, mummy, glassSerpent, mirageMerchant, mirageSorcerer, duneColossus, sahar } from "./m6.js";
import { pxSlime, pxSlimeMini } from "./pg0.js";
import { goblin, plainsWolf, tuskBoar, giantWasp, mandrake, meadowOgre, centaur } from "./mg0.js";

export const MODELS = {
  fr0_0: ghoul, fr0_1: rat, fr0_2: archer, fr0_3: scarecrow, fr0_4: crow, fr0_5: husk, fr0_e0: warden, fr0_e1: ringer, frb0: grayburn,
  fr1_0: mossWolf, fr1_1: mistFairy, fr1_2: rootVine, fr1_3: sporeShroom, fr1_4: hunterWraith, fr1_5: thornHog, fr1_e0: elderTreant, fr1_e1: mistTwins, frb1: elkharn,
  fr2_0: skelMiner, fr2_1: oreWorm, fr2_2: batSwarm, fr2_3: bombGoblin, fr2_4: crystalSpider, fr2_5: veinSpirit, fr2_e0: cartKnight, fr2_e1: stoneGolem, frb2: grauk,
  fr3_0: leech, fr3_1: bloater, fr3_2: toadWarrior, fr3_3: dragonfly, fr3_4: swampHag, fr3_5: fungalColony, fr3_e0: mossTroll, fr3_e1: plagueDoctor, frb3: globrak,
  fr4_0: flameInfantry, fr4_1: artillerist, fr4_2: salamander, fr4_3: furnaceSpirit, fr4_4: chainTorturer, fr4_5: bannerBearer, fr4_e0: siegeGolem, fr4_e1: guardCaptain, frb4: ignar,
  fr5_0: snowWolf, fr5_1: iceSpirit, fr5_2: frostYeti, fr5_3: frozenSoldier, fr5_4: icicleBat, fr5_5: snowmanBomber, fr5_e0: glacierTurtle, fr5_e1: frostMaiden, frb5: kryos,
  fr6_0: sandScorpion, fr6_1: desertRaider, fr6_2: sandSpirit, fr6_3: mummy, fr6_4: glassSerpent, fr6_5: mirageMerchant, fr6_e0: mirageSorcerer, fr6_e1: duneColossus, frb6: sahar,
  gm_slime: pxSlime, gm_slime_mini: pxSlimeMini, gm_goblin: goblin, gm_wolf: plainsWolf, gm_boar: tuskBoar, gm_wasp: giantWasp, gm_mandrake: mandrake, gm_ogre: meadowOgre, gm_centaur: centaur,
};
