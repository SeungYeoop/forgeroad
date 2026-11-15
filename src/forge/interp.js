// 레시피 설명 → 동작 명세. 설명에 적힌 대로 움직이게 하기 위한 해석기.
import * as IT from "./items.js";

// 마법별 이름 키워드 (이름·설명에서 재료 마법을 찾을 때)
export const MAGIC_KW = {
  M01: ["화염구", "불덩이", "불꽃 구", "화구"],
  M02: ["불꽃 고리", "고리", "업화"],
  M03: ["화염 방사", "불길", "화염을 뿜", "방사"],
  M04: ["유성", "낙하", "운석"],
  M05: ["얼음 창", "빙창"],
  M06: ["냉기 파동", "파동", "냉기"],
  M07: ["빙벽", "얼음벽", "얼음 벽"],
  M08: ["서리 구체", "눈송이", "눈덩이", "서리 구"],
  M09: ["번개 화살", "뇌시", "번개 화"],
  M10: ["낙뢰", "벼락"],
  M11: ["연쇄 번개", "전류", "번개가 튄", "번개가 튀"],
  M12: ["번개 구체", "구형 번개", "뇌구"],
  M13: ["바람 칼날", "풍인", "칼바람"],
  M14: ["회오리", "선풍"],
  M15: ["돌풍"],
  M16: ["상승 기류", "승천", "솟아올라", "상승"],
  M17: ["바위", "투석"],
  M18: ["가시"],
  M19: ["지진", "진동"],
  M20: ["대지의 손", "손이", "손아귀 대지"],
  M21: ["독침", "독바늘"],
  M22: ["독구름", "독무", "독안개"],
  M23: ["부패"],
  M24: ["독 늪", "늪"],
  M25: ["빛의 창", "광창", "빛 창"],
  M26: ["치유", "회복의 빛"],
  M27: ["섬광"],
  M28: ["빛의 기둥", "기둥", "판결", "심판"],
  M29: ["그림자 구체", "그림자 구"],
  M30: ["흡혼", "생명력"],
  M31: ["저주"],
  M32: ["어둠의 손아귀", "블랙홀", "끌어당", "어둠"],
};
// 투사체로 뿌릴 수 있는 마법
export const PROJ = {
  M01: { spr: "vp_flame", speed: 360, boom: 1 },
  M05: { spr: "vp_spear", speed: 520, pierce: 99, ice: 1 },
  M08: { spr: "vp_orb", speed: 160, slowAura: 1 },
  M09: { bolt: 1 },
  M13: { spr: "vp_crescent", speed: 540, pierce: 3 },
  M17: { spr: "vp_boulder", speed: 320, grav: 600, boom: 1 },
  M21: { spr: "vp_needle", speed: 540, poison: 1 },
  M25: { spr: "vp_spear", speed: 560, pierce: 99 },
  M29: { spr: "vp_orb", speed: 220, homing: 3 },
  M11: { bolt: 1, chain: 1 },
};

const num = (re, s) => {
  const m = s.match(re);
  return m ? Number(m[1]) : null;
};
// 마지막에 나온 키워드의 위치
function lastIndexOfKw(s, id) {
  let best = -1;
  for (const k of MAGIC_KW[id] ?? []) best = Math.max(best, s.lastIndexOf(k));
  return best;
}

// 공통 수식어
function mods(d) {
  const m = {};
  /얼린|얼어|빙결|얼음 망령/.test(d) && (m.freeze = 1);
  /관통|꿰뚫|꿰인/.test(d) && (m.pierce = 1);
  /화면 끝까지/.test(d) && ((m.pierce = 1), (m.long = 1));
  /띄운|띄워|띄우|공중으로/.test(d) && (m.knockup = 1);
  /끌어당|끌어온|끌어모|빨아들|빨려|안쪽으로/.test(d) && (m.pull = 1);
  /흡수|흡혈/.test(d) && (m.drain = 1);
  /방어가 깎|방어 감소|방어를 깎|방어 -/.test(d) && (m.armor = 1);
  /번개가 튄|번개가 튀|연쇄/.test(d) && (m.chain = 1);
  /화상|불태|태운|불이 붙/.test(d) && (m.burn = 1);
  /중독/.test(d) && (m.poison = num(/중독 (\d+)/, d) ?? 1);
  /냉각 (\d+)/.test(d) && (m.chill = num(/냉각 (\d+)/, d));
  /기절/.test(d) && (m.stun = num(/기절 ([\d.]+)초/, d) ?? 1);
  /날려|밀어|넉백/.test(d) && (m.knock = 1);
  /(\d+)배/.test(d) && (m.mult = Math.min(4, num(/(\d+)배/, d)));
  /쫓아|따라가|추적|유도/.test(d) && (m.homing = 1);
  /자세 시간이 없|즉시/.test(d) && (m.instant = 1);
  /체력 (\d+)% 이하/.test(d) && (m.exec = num(/체력 (\d+)% 이하/, d) / 100);
  /폭발/.test(d) && (m.boom = 1);
  /보호막/.test(d) && (m.shield = 1);
  /회복/.test(d) && (m.heal = 1);
  /(\d+)타마다/.test(d) && (m.every = num(/(\d+)타마다/, d));
  return m;
}
function pattern(d) {
  if (/몸 주위를 돌|주위를 돌|둘레를 돌/.test(d)) return "orbit";
  if (/사방|전방위|사방팔방|둥글게|원형/.test(d)) return "radial";
  if (/부채꼴/.test(d)) return "fan";
  if (/아래로|내리꽂|내리친|떨어/.test(d)) return "down";
  if (/솟|땅에서|바닥에서|위로/.test(d)) return "up";
  if (/쫓아|따라가|추적/.test(d)) return "homing";
  if (/남는|남긴|남아/.test(d)) return "leave";
  return "forward";
}
function countOf(d) {
  const m = d.match(/(\d+)\s*(개|발|겹|번|회|체|갈래|줄기|방향)/);
  return m ? Math.min(12, Number(m[1])) : null;
}

// 스킬·마법 동작 시점
function whenSkill(d) {
  if (/끝날 때|끝나면|끝난 자리|끝난 뒤|마무리|착지|착지점|내려찍은 자리|사라질 때/.test(d)) return "end";
  if (/죽은 적|처치한|처형한|쓰러뜨린|처치 시/.test(d)) return "kill";
  if (/맞은 적|적중|꿰뚫|관통한 적|막기 성공|박치기에 맞은|밟히면/.test(d)) return "hit";
  if (/마다/.test(d)) return "tick";
  if (/동안|하며|돌며|따라|함께|섞여/.test(d)) return "during";
  return "start";
}
function whenWeapon(d) {
  if (/마지막|막타|충전 공격|(\d+)타|특수|내려찍|마무리|콤보 끝/.test(d)) return "finisher";
  if (/휘두를 때|공격마다|베기마다|찌를 때마다|타격마다|휘두르면|칠 때마다|쏠 때마다|장전할 때마다/.test(d)) return "swing";
  if (/맞은 적|적중|맞힌|타격한/.test(d)) return "hit";
  if (/죽은 적|처치/.test(d)) return "kill";
  return "finisher";
}

// 재료 중 마법 (설명에 언급된 것 우선)
function magicMats(it) {
  return (it.mats ?? []).filter((x) => IT.BASE[x]?.kind === "magic");
}

export function interp(it) {
  if (!it || it.tier === 0) return null;
  if (it._spec) return it._spec;
  const d = it.desc ?? "";
  const name = it.name ?? "";
  const S = { m: mods(d), pat: pattern(d), n: countOf(d), raw: d };
  const mags = magicMats(it);
  switch (it.cat) {
    case "SM":
    case "SG":
      S.when = whenSkill(d);
      S.emit = mags[0] ?? null;
      break;
    case "MM": {
      // 이름에서 가장 뒤에 나온 마법 = 전달 방식
      const [a, b] = mags;
      if (a && b && a !== b) {
        const la = Math.max(lastIndexOfKw(name, a), -1), lb = Math.max(lastIndexOfKw(name, b), -1);
        const da = lastIndexOfKw(d, a), db = lastIndexOfKw(d, b);
        S.del = lb > la ? b : la > lb ? a : db >= 0 && (da < 0 || db < da) ? b : a;
        S.emit = S.del === a ? b : a;
      } else ((S.del = a), (S.emit = null));
      S.when = whenSkill(d);
      break;
    }
    case "WM":
    case "WG":
    case "WS":
      S.when = whenWeapon(d);
      S.emit = mags[0] ?? null;
      S.skill = (it.mats ?? []).find((x) => IT.BASE[x]?.kind === "skill") ?? null;
      break;
    case "SS":
    case "SA":
      S.when = whenSkill(d);
      break;
    default:
      S.when = whenSkill(d);
      S.emit = mags[0] ?? null;
  }
  if (String(it.id).startsWith("X-")) S.when = String(it.cat).startsWith("W") ? "finisher" : "hit";
  // 무기 콤보: "N연", "(각 N%)", "100/100/140%"
  const hits = num(/(\d+)\s*연(?:사|타|격| 베기| 찌르기| 콤보|속|발)?/, d);
  const each = num(/각 (\d+)%/, d);
  const list = d.match(/(\d+(?:\/\d+)+)%/);
  if (list) S.combo = list[1].split("/").map((x) => Number(x) / 100);
  else if (hits && each) S.combo = Array(Math.min(12, hits)).fill(each / 100);
  else if (hits && it.kind === "weapon") S.comboN = Math.min(12, hits);
  // 방어구 수치
  if (it.kind === "armor") {
    const A = {};
    const def = num(/방어 (\d+)/, d);
    def != null && (A.def = def);
    /막기 가능/.test(d) && (A.block = (num(/정면 피해 (\d+)% 감소/, d) ?? 60) / 100);
    const mv = d.match(/이동 속도 ([+-]\d+)%/);
    mv && (A.move = Number(mv[1]) / 100);
    const red = num(/(?:받는 )?피해 -(\d+)%/, d);
    red != null && (A.dmgRed = red / 100);
    /넉백 (면역|저항)/.test(d) && (A.kbImmune = 1);
    /반사/.test(d) && (A.reflectChance = 0.25);
    const he = num(/회복(?: 효과)? \+(\d+)%/, d);
    he != null && (A.healEff = he / 100);
    const mr = num(/마나 회복 \+(\d+)%/, d);
    mr != null && (A.manaRegen = mr / 100);
    const md = num(/마법 피해 \+(\d+)%/, d);
    md != null && (A.magicDmg = md / 100);
    const dc = num(/대시 쿨타임 -(\d+)%/, d);
    dc != null && (A.dashCd = -dc / 100);
    const er = num(/속성 피해 -(\d+)%/, d);
    er != null && (A.elemRed = er / 100);
    const pr = num(/투사체 피해 -(\d+)%/, d);
    pr != null && (A.projRed = pr / 100);
    /가시|반사 피해|되돌려/.test(d) && (A.thorns = (num(/(\d+)% 반사/, d) ?? 30) / 100);
    /피격 시/.test(d) && (A.onHurt = 1);
    S.armor = A;
  }
  it._spec = S;
  return S;
}
