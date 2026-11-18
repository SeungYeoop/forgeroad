// 포지로드 월드 데이터: 지역 12곳, 몬스터·엘리트·보스.
// 원본 엔진(끝없는 경계)의 스프라이트·AI를 재사용하고 이름·수치·색은 기획서 기준.
import REGIONS from "./regions.json";

// 지역마다 적 체력 배율 (기획서 0-4). 엔진은 거리 배율을 따로 적용하므로 기준값을 나눠서 쓴다.
export const REGION_MULT = [1, 1.5, 2.2, 3.2, 4.6, 6.5, 9, 12.5, 17, 23, 31, 42];

const EL = { 화염: "fire", 냉기: "ice", 번개: "lightning", 바람: "wind", 대지: "earth", 독: "poison", 빛: "light", 어둠: "dark" };
const el = (s) => {
  if (!s) return null;
  for (const [k, v] of Object.entries(EL)) if (s.includes(k)) return v;
  return null;
};

// [이름, AI 원형, 스프라이트 원형, 색조, 색조 세기]
const MON = [
  [
    ["잿더미 좀비", "scorpion", "mummy", 0x8c8580, 0.55],
    ["불씨 쥐", "hound", "hound", 0xff7a30, 0.5],
    ["그을린 해골 궁수", "xbowman", "xbowman", 0x5e4e44, 0.5],
    ["타다 남은 허수아비", "sporecap", "banner", 0xc07038, 0.55],
    ["재 까마귀", "bat", "bat", 0x4a4448, 0.6],
    ["녹은 갑옷", "sentry", "sentry", 0xd06a30, 0.45],
  ],
  [
    ["이끼 늑대", "wolf", "wolf", 0x5a9a5a, 0.55],
    ["안개 요정", "wasp", "wisp", 0xc8fff0, 0.5],
    ["뿌리 덩굴", "tentacle", "tentacle", 0x5a8a3a, 0.6],
    ["포자 버섯", "sporecap", "sporecap", 0x60c0a0, 0.3],
    ["사냥꾼 망령", "xbowman", "phantom", 0x80e0c0, 0.55],
    ["가시 고슴도치", "scorpion", "crawler", 0x8a6a4a, 0.55],
  ],
  [
    ["해골 광부", "scorpion", "raider", 0xd8d0b8, 0.55],
    ["광석 벌레", "worm", "worm", 0x8a7060, 0.35],
    ["동굴 박쥐 떼", "bat", "bat", 0x504870, 0.3],
    ["폭약 고블린", "kobold", "kobold", 0x80a040, 0.3],
    ["수정 거미", "crawler", "crawler", 0x40e0d0, 0.45],
    ["광맥 정령", "shaman", "orb", 0x40e0c0, 0.55],
  ],
  [
    ["늪 거머리", "slime", "slime", 0x6a4a7a, 0.6],
    ["부풀은 시체", "rotbear", "rotbear", 0x8a9a5a, 0.5],
    ["두꺼비 전사", "scorpion", "yeti", 0x5a8a3a, 0.6],
    ["독침 잠자리", "wasp", "wasp", 0x90e060, 0.4],
    ["늪 마녀", "mummy", "shaman", 0x9a5aaa, 0.55],
    ["버섯 군락", "sporecap", "sporecap", 0xa070c0, 0.55],
  ],
  [
    ["화염 보병", "pikeman", "pikeman", 0xff5a30, 0.35],
    ["화약 포병", "bomber", "bomber", 0xff8040, 0.2],
    ["불도마뱀", "hound", "scorpion", 0xff5030, 0.55],
    ["용광로 정령", "scorpion", "djinn", 0xff8040, 0.6],
    ["쇠사슬 고문관", "xbowman", "xbowman", 0x803030, 0.55],
    ["깃발병", "banner", "banner", 0xff4020, 0.3],
  ],
  [
    ["설원 늑대", "wolf", "wolf", 0xc8e0ff, 0.2],
    ["얼음 정령", "wisp", "wisp", 0x90e0ff, 0.15],
    ["서리 예티", "yeti", "yeti", 0xe0f0ff, 0.2],
    ["얼어붙은 병사", "xbowman", "xbowman", 0x9ad0ff, 0.55],
    ["고드름 박쥐", "bat", "bat", 0xa0e0ff, 0.55],
    ["눈사람 폭탄병", "hound", "kobold", 0xffffff, 0.6],
  ],
  [
    ["모래 전갈", "scorpion", "scorpion", 0xf0b060, 0.2],
    ["사막 약탈자", "raider", "raider", 0xe0a050, 0.2],
    ["모래 정령", "djinn", "djinn", 0xffd080, 0.2],
    ["붕대 미라", "scorpion", "mummy", 0xf0e0b0, 0.3],
    ["유리 뱀", "worm", "worm", 0xa0f0ff, 0.6],
    ["신기루 상인", "banner", "caller", 0xf0c060, 0.55],
  ],
  [
    ["태엽 병사", "scorpion", "sentry", 0xc08a40, 0.55],
    ["피뢰 드론", "wasp", "orb", 0xb080ff, 0.5],
    ["전류 해파리", "voideye", "wisp", 0xc0a0ff, 0.6],
    ["자석 거미", "scorpion", "crawler", 0x707088, 0.55],
    ["코일 포탑", "sentinel", "ballista", 0x9a70ff, 0.5],
    ["수리 로봇", "shaman", "kobold", 0xc0a060, 0.55],
  ],
  [
    ["수정 기사", "phantom", "phantom", 0xffd0f0, 0.55],
    ["빛의 감시자", "voideye", "voideye", 0xfff0c0, 0.6],
    ["수정 고슴도치", "crawler", "crawler", 0xffb0e0, 0.55],
    ["순례자 망령", "shaman", "caller", 0xf8f0ff, 0.55],
    ["프리즘 나비", "wasp", "wasp", 0xff90ff, 0.55],
    ["거울 수도사", "stalker", "stalker", 0xe0e0ff, 0.6],
  ],
  [
    ["폭풍 하피", "wasp", "gargoyle", 0xa0c0ff, 0.5],
    ["천공 기사", "pikeman", "pikeman", 0xf0e0a0, 0.5],
    ["폭풍 정령", "djinn", "djinn", 0xa0d0ff, 0.6],
    ["부유석 골렘", "rotbear", "sentinel", 0xc0b080, 0.5],
    ["번개 매", "bat", "bat", 0xfff080, 0.6],
    ["구름 양", "shaman", "slime", 0xffffff, 0.65],
  ],
  [
    ["그림자 병사", "sentry", "sentry", 0x403058, 0.6],
    ["몽마", "voideye", "voideye", 0x8040a0, 0.4],
    ["그림자 사냥개", "hound", "hound", 0x302040, 0.65],
    ["근위 망령", "phantom", "phantom", 0x6050a0, 0.5],
    ["거울 인형", "stalker", "stalker", 0xc8c8e0, 0.55],
    ["등불지기", "banner", "caller", 0xffe080, 0.45],
  ],
  [
    ["화로 파편 정령", "djinn", "orb", 0xffe0a0, 0.55],
    ["실패작", "rotbear", "rotbear", 0xa06040, 0.55],
    ["잿불 대장장이", "shaman", "shaman", 0xff8040, 0.55],
    ["녹은 금속 슬라임", "slime", "slime", 0xffa040, 0.6],
    ["모루 거인", "yeti", "yeti", 0x606078, 0.6],
    ["풀무 박쥐", "bat", "bat", 0xff6020, 0.55],
  ],
];

// 엘리트 [이름, AI 원형, 스프라이트, 색조, 세기, 크기]
const ELI = [
  [["잿불 파수꾼", "sentry", "sentry", 0xff6030, 0.5, 1.5], ["부서진 종지기", "caller", "banner", 0x9a9088, 0.5, 1.5]],
  [["거목 수호자", "rotbear", "rotbear", 0x4a7a3a, 0.6, 1.4], ["안개 쌍둥이 마녀", "mummy", "shaman", 0xa0ffe0, 0.55, 1.5]],
  [["광차 기사", "raider", "raider", 0x8a6a4a, 0.5, 1.5], ["돌 골렘", "yeti", "yeti", 0x8a7a6a, 0.6, 1.35]],
  [["이끼 트롤", "yeti", "yeti", 0x5a7a3a, 0.6, 1.4], ["역병 의사", "caller", "caller", 0x6a8a4a, 0.6, 1.5]],
  [["공성 골렘", "tortoise", "tortoise", 0x803020, 0.6, 1.5], ["화염 근위대장", "pikeman", "pikeman", 0xff4020, 0.5, 1.5]],
  [["빙하 거북", "tortoise", "tortoise", 0xb0e8ff, 0.3, 1.6], ["서리 무녀", "caller", "wisp", 0xc0f0ff, 0.5, 1.7]],
  [["신기루 술사", "stalker", "djinn", 0xffd080, 0.5, 1.5], ["사구 거상", "yeti", "yeti", 0xd0a060, 0.6, 1.45]],
  [["뇌격 기사", "phantom", "phantom", 0xc0a0ff, 0.6, 1.45], ["톱니 파괴자", "rotbear", "rotbear", 0xa08040, 0.6, 1.4]],
  [["성소 수호상", "gargoyle", "gargoyle", 0xffffff, 0.6, 1.5], ["굴절의 사제", "caller", "caller", 0xffc0ff, 0.55, 1.5]],
  [["천둥새", "wasp", "gargoyle", 0xffff80, 0.6, 1.7], ["폐허의 수문장", "sentry", "sentry", 0xe0d090, 0.55, 1.6]],
  [["그림자 재판관", "phantom", "phantom", 0x302050, 0.65, 1.5], ["잊혀진 왕비", "caller", "caller", 0xa080c0, 0.55, 1.6]],
  [["쌍둥이 풀무", "orb", "orb", 0xff8020, 0.55, 1.6], ["첫 번째 도전자의 잔해", "stalker", "stalker", 0xffc080, 0.55, 1.5]],
];

// 보스: [원형(패턴·스프라이트), 색조, 세기, 패턴, 원소, 칭호]
const BOSS = [
  ["executioner", 0x9a8a80, 0.5, ["combo3", "thrust", "plant", "spin", "plunge", "summon"], "fire", "잿빛 마을의 맹세"],
  ["golem", 0x6aa088, 0.5, ["antlerCharge", "mistStealth", "hoofQuake", "phantoms", "antlerShot", "mistStorm"], "wind", "안개 숲의 주인"],
  ["devourer", 0x8a6a50, 0.3, ["erupt", "spit", "sweep", "rockfall", "inhale", "oreBurst"], "earth", "울림 광산의 포식자"],
  ["rotlord", 0x7a5a90, 0.4, ["tongueWhip", "crushJump", "tadpoles", "gasBurp", "leechRain", "plagueBlast"], "poison", "썩은 늪의 왕"],
  ["warlord", 0xff5020, 0.3, ["glaiveCombo", "bannerPlant", "flameDash", "artillery", "lavaMoat", "spearThrow"], "fire", "불타는 요새의 장군"],
  ["frostknight", 0xa0e0ff, 0.25, ["frostBreath", "diveClaw", "icicleRain", "legFreeze", "wingBlizzard", "tailSweep", "icePrison", "absoluteZero"], "ice", "서리 협곡의 용기사"],
  ["devourer", 0xf0c070, 0.55, ["pounce", "sandGeyser", "finWave", "sandstorm", "inhaleExhale", "crystalShards"], "earth", "유리 사막의 고래"],
  ["king", 0xc09050, 0.55, ["arcaneBarrage", "teleportSlam", "phantomSwords", "laserSweep"], "lightning", "뇌정 첨탑의 시계공"],
  ["golem", 0xffc8f0, 0.6, ["slam", "quake", "rockThrow", "iceSpears"], "light", "수정 성소의 거신"],
  ["matriarch", 0xc0e0ff, 0.55, ["laserSweep", "tornado", "teleport", "voidOrbs"], "wind", "하늘 폐허의 폭풍"],
  ["king", 0x2a1a40, 0.6, ["phantomSwords", "teleportSlam", "summonKnights", "voidOrbs"], "dark", "그림자 왕도의 군주"],
  ["warden", 0xffe8a0, 0.55, ["riftBeam", "mortar", "flameSweep", "iceSpears", "phantomSwords", "voidOrbs"], "fire", "화로의 주인"],
];

const PAL = [
  { sky: [0x6a5a86, 0xffc490], far: 0xa07c90, mid: 0x7c5c70, near: 0x4a344c, top: 0x96b24a, topHi: 0xdaea78, soil: 0x8c6c52, soilDark: 0x4a3428, soilHi: 0xb48c6a, rock: 0xa08e7c, accent: 0xff9a40, fog: 0xffd4a8 },
  { sky: [0x3c907e, 0xd0f6e0], far: 0x5ea88e, mid: 0x3c8068, near: 0x1e4e3e, top: 0x5cc44c, topHi: 0xb4f474, soil: 0x6c5c42, soilDark: 0x3a2e20, soilHi: 0x8e7e5a, rock: 0x84927e, accent: 0xffe060, fog: 0xe4fff2 },
  { sky: [0x18203e, 0x42548a], far: 0x34426a, mid: 0x263252, near: 0x161c32, top: 0xb88e62, topHi: 0xf0c890, soil: 0x7e6046, soilDark: 0x3c2c20, soilHi: 0x9e7e5c, rock: 0x9294aa, accent: 0x50f0d0, fog: 0x68d8c8 },
  { sky: [0x50407a, 0xa8c88a], far: 0x6e7e6e, mid: 0x4e5e4c, near: 0x2c3628, top: 0x7cae3c, topHi: 0xc4e464, soil: 0x6c5c42, soilDark: 0x362c1e, soilHi: 0x8c7c5a, rock: 0x767a6a, accent: 0xc4ff40, fog: 0xc4e494 },
  { sky: [0x641e16, 0xffa858], far: 0x903e26, mid: 0x6e2c1c, near: 0x3c160e, top: 0xa0908c, topHi: 0xdccac2, soil: 0x6e4c42, soilDark: 0x36201a, soilHi: 0x8e6e5e, rock: 0x928280, accent: 0xff8020, fog: 0xffa864 },
  { sky: [0x5aa0ec, 0xe8f8ff], far: 0xa4c4ec, mid: 0x7c9ed0, near: 0x44608e, top: 0xf4faff, topHi: 0xffffff, soil: 0x7488b0, soilDark: 0x3e4e74, soilHi: 0xa2b8d8, rock: 0x94aad4, accent: 0x80e0ff, fog: 0xffffff },
  { sky: [0xf4a050, 0xffe8b0], far: 0xe8aa68, mid: 0xcc8c4c, near: 0xa46c3a, top: 0xf4c474, topHi: 0xfff2b4, soil: 0xd49e5a, soilDark: 0x8c5c32, soilHi: 0xecbc74, rock: 0xbc9466, accent: 0x80f0ff, fog: 0xfff2c4 },
  { sky: [0x2c2c60, 0x9080c8], far: 0x5e5e90, mid: 0x44446e, near: 0x28284e, top: 0xc4a464, topHi: 0xf4dc94, soil: 0x7e6e5c, soilDark: 0x3c3228, soilHi: 0x9e8e7a, rock: 0xa09eb6, accent: 0xc4a4ff, fog: 0xb4a4ff },
  { sky: [0xdcc0e8, 0xfff2fa], far: 0xecd4ee, mid: 0xd4b4dc, near: 0xac8cbc, top: 0xfaf6ff, topHi: 0xffffff, soil: 0xccb4d4, soilDark: 0x8c72a4, soilHi: 0xe4cce8, rock: 0xd4c4e4, accent: 0xff94e4, fog: 0xffe4ff },
  { sky: [0x4290e4, 0xc4ecff], far: 0xe8f4ff, mid: 0xc4dcf4, near: 0x94b4dc, top: 0x7ccc4c, topHi: 0xc4f474, soil: 0xc4a474, soilDark: 0x846444, soilHi: 0xdcc494, rock: 0xccbc94, accent: 0xffe474, fog: 0xffffff },
  { sky: [0x1c1634, 0x5e4e92], far: 0x3e3864, mid: 0x2c264c, near: 0x18142c, top: 0x6e64a0, topHi: 0xa49cdc, soil: 0x4e4464, soilDark: 0x241e34, soilHi: 0x6e648e, rock: 0x6e688e, accent: 0xd4dcff, fog: 0x9484d4 },
  { sky: [0x6e2e12, 0xffc464], far: 0xa45e2c, mid: 0x7e441a, near: 0x44220e, top: 0xa48464, topHi: 0xffdc94, soil: 0x7e543a, soilDark: 0x3c2616, soilHi: 0xa47454, rock: 0x8e7464, accent: 0xfff4a4, fog: 0xffc474 },
];

const LOOK = [
  { id: "ashvillage", theme: "plains", particle: "ash", ceiling: 0, hazards: ["crumble", "spikes"],
    patterns: { flat: 5, steps: 3, hill: 3, gap: 2, platforms: 3, pillar: 1, ruins: 4, crumble: 2, spikes: 1 },
    events: { treasure: 3, altar: 2, ambush: 2, deal: 1, goldenGoblin: 3, eliteGround: 1, wagon: 2 },
    music: { root: 57, scale: [0, 2, 3, 5, 7, 8, 10], tempo: 100, wave: "square", mood: 0 } },
  { id: "mistwood", theme: "forest", particle: "fireflies", ceiling: 0, hazards: ["poison", "spikes"],
    patterns: { flat: 4, steps: 3, hill: 3, gap: 2, platforms: 4, pillar: 2, bumps: 3, poison: 2 },
    events: { treasure: 3, altar: 2, ambush: 2, deal: 1, goldenGoblin: 3, eliteGround: 1, spring: 2 },
    music: { root: 57, scale: [0, 2, 3, 5, 7, 9, 10], tempo: 92, wave: "triangle", mood: 1 } },
  { id: "echomine", theme: "cave", particle: "drips", ceiling: 0.85, hazards: ["stalactite", "crumble"],
    patterns: { flat: 3, steps: 4, gap: 4, platforms: 3, pillar: 2, ledges: 3, crumble: 2, valley: 2 },
    events: { treasure: 4, altar: 2, ambush: 2, deal: 1, goldenGoblin: 3, eliteGround: 1, oreVein: 3 },
    music: { root: 52, scale: [0, 1, 3, 5, 7, 8, 10], tempo: 84, wave: "triangle", mood: 2 } },
  { id: "rotmarsh", theme: "forest", particle: "spores", ceiling: 0, hazards: ["poison", "quicksand"],
    patterns: { flat: 4, steps: 2, gap: 3, platforms: 3, bumps: 3, poison: 4, valley: 2 },
    events: { treasure: 3, altar: 2, ambush: 3, deal: 2, goldenGoblin: 3, eliteGround: 1, spring: 1 },
    music: { root: 50, scale: [0, 1, 3, 5, 6, 8, 10], tempo: 80, wave: "triangle", mood: 1 } },
  { id: "blazefort", theme: "fortress", particle: "embers", ceiling: 0.3, hazards: ["fireJet", "arrowTrap", "spikes"],
    patterns: { flat: 3, steps: 3, battlement: 4, gap: 2, platforms: 3, pillar: 3, firetrap: 3, spikes: 2 },
    events: { treasure: 3, altar: 2, ambush: 4, deal: 2, goldenGoblin: 3, eliteGround: 2, armory: 2 },
    music: { root: 50, scale: [0, 2, 3, 5, 7, 8, 10], tempo: 126, wave: "sawtooth", mood: 5 } },
  { id: "frostgorge", theme: "snow", particle: "snow", ceiling: 0.1, hazards: ["ice", "stalactite"],
    patterns: { flat: 4, steps: 3, hill: 3, gap: 3, platforms: 3, pillar: 2, ice: 4, valley: 2 },
    events: { treasure: 3, altar: 2, ambush: 3, deal: 2, goldenGoblin: 3, eliteGround: 2, frozenHero: 2 },
    music: { root: 62, scale: [0, 2, 4, 6, 7, 9, 11], tempo: 88, wave: "sine", mood: 4 } },
  { id: "glassdesert", theme: "desert", particle: "glass", ceiling: 0, hazards: ["quicksand", "spikes"],
    patterns: { flat: 4, dunes: 5, gap: 2, platforms: 2, pillar: 2, ruins: 3, quicksand: 2, steps: 2 },
    events: { treasure: 3, altar: 2, ambush: 3, deal: 2, goldenGoblin: 3, eliteGround: 1, relic: 2 },
    music: { root: 55, scale: [0, 1, 4, 5, 7, 8, 10], tempo: 104, wave: "sawtooth", mood: 3 } },
  { id: "thunderspire", theme: "kingdom", particle: "sparks", ceiling: 0.15, hazards: ["arcaneRune", "spikes", "crumble"],
    patterns: { flat: 3, steps: 4, ruins: 2, gap: 3, platforms: 4, pillar: 4, runes: 3, floating: 2 },
    events: { treasure: 3, altar: 2, ambush: 3, deal: 2, goldenGoblin: 3, eliteGround: 2, runeVault: 2 },
    music: { root: 54, scale: [0, 2, 3, 6, 7, 9, 10], tempo: 132, wave: "square", mood: 7 } },
  { id: "crystalsanctum", theme: "kingdom", particle: "sparkles", ceiling: 0.1, hazards: ["arcaneRune", "crumble"],
    patterns: { flat: 4, steps: 3, ruins: 4, gap: 2, platforms: 3, pillar: 3, runes: 2, floating: 2 },
    events: { treasure: 3, altar: 3, ambush: 2, deal: 2, goldenGoblin: 3, eliteGround: 2, runeVault: 2 },
    music: { root: 64, scale: [0, 2, 4, 7, 9, 11], tempo: 96, wave: "sine", mood: 7 } },
  { id: "skyruins", theme: "kingdom", particle: "clouds", ceiling: 0, hazards: ["crumble"],
    patterns: { flat: 2, steps: 2, ruins: 3, gap: 5, platforms: 4, pillar: 2, floating: 5, crumble: 2 },
    events: { treasure: 3, altar: 2, ambush: 3, deal: 2, goldenGoblin: 3, eliteGround: 2, rift: 1 },
    music: { root: 62, scale: [0, 2, 4, 5, 7, 9, 11], tempo: 116, wave: "triangle", mood: 0 } },
  { id: "shadowcapital", theme: "abyss", particle: "motes", ceiling: 0.2, hazards: ["voidPool", "crumble", "spikes"],
    patterns: { flat: 3, steps: 3, ruins: 2, gap: 3, platforms: 3, pillar: 3, voidpool: 3, crumble: 2, floating: 2 },
    events: { treasure: 3, altar: 2, ambush: 3, deal: 3, goldenGoblin: 3, eliteGround: 2, rift: 2 },
    music: { root: 48, scale: [0, 1, 3, 5, 6, 8, 10], tempo: 76, wave: "square", mood: 6 } },
  { id: "forgeheart", theme: "fortress", particle: "embers", ceiling: 0.2, hazards: ["fireJet", "voidPool", "ice", "arcaneRune"],
    patterns: { flat: 3, steps: 3, battlement: 3, gap: 3, platforms: 3, pillar: 3, firetrap: 3, floating: 2, runes: 2 },
    events: { treasure: 3, altar: 3, ambush: 3, deal: 3, goldenGoblin: 3, eliteGround: 3, rift: 2 },
    music: { root: 53, scale: [0, 2, 3, 5, 7, 8, 11], tempo: 138, wave: "sawtooth", mood: 5 } },
];

export const FR_MONSTERS = []; // {id, name, tpl, sprite, tint, amt, hp, weak, resist, region, scale?}
export const FR_ELITES = [];
export const FR_BOSSES = [];
export const FR_REGIONS = [];

REGIONS.forEach((r, ri) => {
  const mult = REGION_MULT[ri];
  const enemies = [];
  MON[ri].forEach((m, k) => {
    const doc = r.monsters[k];
    const id = `fr${ri}_${k}`;
    FR_MONSTERS.push({
      id, name: m[0], tpl: m[1], sprite: m[2], tint: m[3], amt: m[4],
      hp: Math.max(8, Math.round((doc.hp / mult) * 0.85)),
      weak: el(doc.weak), resist: el(doc.resist), region: ri,
      pattern: doc.pattern, drop: doc.drop, type: doc.type,
    });
    const w = doc.type === "고정" || doc.type === "지원" || doc.type === "소환" ? 2 : doc.type === "공중" ? 3 : 4;
    enemies.push({ id, w });
  });
  if (ri > 0) MON[ri - 1].slice(0, 3).forEach((_, k) => enemies.push({ id: `fr${ri - 1}_${k}`, w: 1 }));
  const elites = [];
  ELI[ri].forEach((e, k) => {
    const doc = r.elites[k];
    const id = `fr${ri}_e${k}`;
    FR_ELITES.push({
      id, name: e[0], tpl: e[1], sprite: e[2], tint: e[3], amt: e[4], scale: e[5],
      hp: Math.round((doc.hp / mult) * 0.2), region: ri, pattern: doc.pattern, tip: doc.tip, drop: doc.drop,
    });
    elites.push(id);
  });
  const b = BOSS[ri];
  const bid = `frb${ri}`;
  FR_BOSSES.push({
    id: bid, base: b[0], tint: b[1], amt: b[2], patterns: b[3], element: b[4],
    name: r.boss.name, title: b[5], quote: "", hp: Math.round(r.boss.hp / mult * 0.45),
    weak: el(r.boss.weak), resist: el(r.boss.resist), relic: r.boss.relic, region: ri,
  });
  const L = LOOK[ri];
  FR_REGIONS.push({
    id: L.id, theme: L.theme, name: r.name, sub: "", start: r.start, end: r.end, boss: bid,
    enemies, elites, hazards: L.hazards, density: 2.3 + ri * 0.07, eliteChance: 0.06 + ri * 0.008,
    ceiling: L.ceiling, particle: L.particle, bg: L.theme, patterns: L.patterns, events: L.events,
    music: L.music, pal: PAL[ri], element: el(r.element), gimmick: r.gimmick, idx: ri,
  });
});

// ∞ 재련의 회랑: 지나온 지역이 뒤틀린 모습으로 반복 (색조 변이)
export const FR_ENDLESS = FR_REGIONS.map((r, i) => ({
  name: `재련의 회랑 · ${r.name}`,
  src: r.id,
  theme: r.id,
  mix: [r.id, FR_REGIONS[(i + 5) % 12].id],
  hazards: [...new Set([...r.hazards, ...FR_REGIONS[(i + 5) % 12].hazards])].slice(0, 3),
  particle: r.particle,
  tint: [0xff8040, 0x8040ff, 0x40ffc0, 0xff40a0, 0xffe040, 0x40a0ff][i % 6],
}));

// 격자 지도에서는 끝없는 회랑을 쓰지 않는다
export const ENDLESS_START = 1e9;
export const ENDLESS_LEN = 1000;
