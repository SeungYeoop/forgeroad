// 도감: 가죽 장정 책 한 권. 왼쪽 쪽 = 지역 · 분류 · 목록, 오른쪽 쪽 = 표본 그림(움직임) + 기록
// 분류: 지형(구조) · 몬스터(일반·정예) · 보스 · 전리품
import REGIONS from "./regions.json";
import ITEMS from "./items.json";
import * as PAPER from "./paper.js";
import { FR_REGIONS, FR_MONSTERS, FR_ELITES, FR_BOSSES } from "./world.js";
import { paintPreview } from "./terrain.js";
import { SPECS, preloadRegion } from "./foes/core.js";

export const HOOKS = {};

// ── 이름표 ──
const CATS = ["지형", "몬스터", "보스", "전리품"];
const PAT_KO = {
  flat: ["평지", "넓고 고른 땅. 마음 놓고 칼을 휘두를 수 있는 몇 안 되는 곳."],
  steps: ["계단", "한 칸씩 오르내리는 턱. 높은 쪽을 잡으면 싸움이 쉬워진다."],
  hill: ["언덕", "완만하게 솟은 땅. 꼭대기에서 내려다보면 적이 먼저 보인다."],
  gap: ["낭떠러지", "발밑이 뚫린 틈. 떨어지면 아래층 길로 이어진다."],
  platforms: ["발판", "허공에 걸린 나무 발판. 아래에서 뛰어올라 탈 수 있다."],
  pillar: ["기둥", "길을 가로막고 선 돌기둥. 뛰어넘거나 돌아가야 한다."],
  ruins: ["폐허", "무너진 담과 벽. 높이가 들쭉날쭉해 숨을 곳이 많다."],
  crumble: ["무너지는 발판", "밟으면 금이 가 곧 떨어진다. 오래 서 있지 말 것."],
  spikes: ["가시 함정", "구덩이 바닥에 박힌 가시. 떨어지면 크게 다친다."],
  bumps: ["둔덕", "울퉁불퉁한 땅. 돌진하는 적이 자주 걸려 넘어진다."],
  poison: ["독 웅덩이", "썩은 물이 고인 구덩이. 서 있으면 독이 오른다."],
  ledges: ["절벽 턱", "높은 턱에서 아래로 뚝 떨어지는 길. 되돌아오기 어렵다."],
  valley: ["골짜기", "움푹 꺼진 땅. 적이 양쪽에서 내려온다."],
  battlement: ["성벽", "톱니 모양 흉벽이 있는 성벽. 위에서는 화살이 날아온다."],
  firetrap: ["화염 분사구", "바닥 틈에서 주기적으로 불길이 솟는다. 박자를 보고 지나갈 것."],
  ice: ["빙판", "미끄러운 얼음 바닥. 멈추려 해도 몇 걸음 더 미끄러진다."],
  dunes: ["모래 언덕", "바람이 쌓은 물결 모양 언덕. 걸음이 무겁다."],
  quicksand: ["유사", "발을 붙잡아 끌어당기는 모래. 계속 뛰어야 빠져나온다."],
  runes: ["마법 룬", "바닥에 새겨진 룬. 밟으면 비전 폭발이 일어난다."],
  floating: ["떠 있는 섬", "허공에 뜬 바위섬. 단단하니 위에 올라서도 된다."],
  voidpool: ["공허 웅덩이", "빛을 삼키는 웅덩이. 닿으면 정신이 빠져나간다."],
};
const HAZ_KO = { crumble: "무너지는 발판", spikes: "가시", poison: "독 웅덩이", stalactite: "종유석 낙하", quicksand: "유사", fireJet: "화염 분사", arrowTrap: "화살 함정", ice: "빙판", arcaneRune: "비전 룬", voidPool: "공허 웅덩이" };
const ANIM_KO = {
  idle: "대기", move: "이동", wind: "준비", atk: "공격", atk2: "연타", rec: "회복", hurt: "피격", throw: "던지기", slam: "내려찍기", grab: "움켜쥐기",
  cast: "시전", shoot: "사격", draw: "시위", fire: "발사", aim: "조준", spit: "뱉기", s1: "베기 1", s2: "베기 2", s3: "베기 3", smoke: "연막",
  bind: "속박", swim: "잠행", rise: "솟구침", bite: "물기", chest: "의태", open: "정체", snipe: "저격", punch: "주먹", disperse: "흩어짐",
  form: "재결집", tsunami: "해일", claw: "할퀴기", sting: "독침", slide: "미끄러짐", blink: "순간이동", scoop: "눈 퍼기", hang: "매달림",
  fly: "비행", drop: "급강하", roll: "구르기", swell: "부풀기", hide: "숨기", spin: "회전", breath: "숨결", raise: "들어올림",
  barrier: "방벽", plant: "꽂기", flag: "군기", stagger: "경직", roar: "포효", dash: "돌진", cut1: "베기", cut2: "올려베기", stomp: "발구르기",
  hot: "과열", swap: "자세 전환", sidle: "방패 자세", smove: "방패 전진", block: "막기", counter: "반격", thrust: "찌르기", dive: "급강하",
  rear: "몸 젖힘", wing: "날갯짓", tail: "꼬리", emerge: "출현", submerge: "잠수", pounce: "덮치기", inhale: "들이마심", exhale: "내뿜기",
  shard: "결정", fin: "잠행", tongue: "혀", burp: "트림", jump: "도약", land: "착지", summon: "소환", latch: "흡착", pulse: "파동",
  inject: "주사", pile: "더미", rise2: "일어섬", tele: "순간이동", lower: "뿔 숙임", charge: "돌진", combo: "연격", plunge: "내리꽂기", spit2: "뱉기",
};
const KIND_KO = { weapon: "무기", armor: "방어구", skill: "스킬", magic: "마법" };
const RAR_CSS = { common: "#4a3a2a", rare: "#1d4f9a", epic: "#6a2a9a", legendary: "#9a5a00" };

// ── 지형 표본 격자 (32칸 × 10줄) ──
const ROWS = 10;
function patGrid(name, ceiling) {
  const g = new Array(32 * ROWS).fill(0);
  const set = (x, y, v = 1) => x >= 0 && x < 32 && y >= 0 && y < ROWS && (g[y * 32 + x] = v);
  const col = (x, top) => { for (let y = top; y < ROWS; y++) set(x, y); };
  const H = (x) => {
    switch (name) {
      case "steps": return x < 8 ? 7 : x < 11 ? 6 : x < 14 ? 5 : x < 18 ? 4 : x < 21 ? 5 : x < 24 ? 6 : 7;
      case "hill": return x < 6 || x > 26 ? 7 : 7 - Math.round(3 * Math.sin(((x - 6) / 20) * Math.PI));
      case "gap": return x >= 13 && x <= 18 ? 99 : 7;
      case "platforms": return 8;
      case "crumble": return x >= 11 && x <= 21 ? 99 : 7;
      case "spikes": case "poison": case "quicksand": case "voidpool": return x >= 13 && x <= 18 ? 8 : 7;
      case "bumps": return 7 - ([5, 6, 12, 13, 19, 25, 26].includes(x) ? 1 : 0);
      case "ledges": return x < 13 ? 4 : 7;
      case "valley": return x >= 10 && x <= 22 ? 9 : 7;
      case "dunes": return 7 - Math.round(1.4 + 1.4 * Math.sin(x * 0.42));
      case "floating": return 8;
      default: return 7;
    }
  };
  for (let x = 0; x < 32; x++) H(x) < 99 && col(x, H(x));
  if (name === "platforms") for (const [a, b, y] of [[5, 9, 5], [13, 18, 3], [22, 26, 5]]) for (let x = a; x <= b; x++) set(x, y, 2);
  if (name === "crumble") for (let x = 12; x <= 20; x++) set(x, 6, 2);
  if (name === "pillar") for (let x = 14; x <= 16; x++) for (let y = 2; y < 7; y++) set(x, y);
  if (name === "ruins") for (const [a, b, t] of [[7, 8, 4], [11, 12, 5], [17, 19, 3], [24, 24, 5]]) for (let x = a; x <= b; x++) for (let y = t; y < 7; y++) (x !== 18 || y > 4) && set(x, y);
  if (name === "battlement") for (let x = 10; x <= 21; x++) { for (let y = 4; y < 7; y++) set(x, y); x % 2 === 0 && set(x, 3); }
  if (name === "floating") for (let x = 12; x <= 19; x++) for (let y = 3; y <= 4; y++) (y === 3 || (x > 12 && x < 19)) && set(x, y);
  if (ceiling >= 0.5) for (let x = 0; x < 32; x++) { set(x, 0); (x % 5 !== 2) && set(x, 1); }
  return g;
}
// 함정 표시 (그림 위에 덧그림)
const HAZ_DRAW = {
  spikes: (G, x, y, w) => { G.fillStyle(0xd8d0c8); for (let i = 0; i < w; i += 5) G.fillTriangle(x + i, y, x + i + 2.5, y - 6, x + i + 5, y); },
  poison: (G, x, y, w) => { G.fillStyle(0x7ad040, 0.85).fillRect(x, y - 5, w, 5); G.fillStyle(0xc8ff80).fillRect(x + 3, y - 5, 4, 1).fillRect(x + w - 9, y - 4, 3, 1); },
  quicksand: (G, x, y, w) => { G.fillStyle(0xd8a860, 0.95).fillRect(x, y - 5, w, 5); G.fillStyle(0x9a7040).fillRect(x + w / 2 - 2, y - 3, 4, 1); },
  voidpool: (G, x, y, w) => { G.fillStyle(0x3a1a6a, 0.95).fillRect(x, y - 5, w, 5); G.fillStyle(0xc0a0ff).fillRect(x + 4, y - 5, 2, 1).fillRect(x + w - 8, y - 4, 2, 1); },
  firetrap: (G, x, y, w) => { for (const fx of [x + w * 0.3, x + w * 0.7]) { G.fillStyle(0x4a2a1a).fillRect(fx - 3, y - 2, 6, 2); G.fillStyle(0xff8a30).fillTriangle(fx - 3, y - 2, fx, y - 16, fx + 3, y - 2); G.fillStyle(0xffe080).fillTriangle(fx - 1.5, y - 2, fx, y - 9, fx + 1.5, y - 2); } },
  ice: (G, x, y, w) => { G.fillStyle(0xb8ecff, 0.75).fillRect(x, y - 2, w, 2); G.fillStyle(0xffffff).fillRect(x + 6, y - 2, 6, 1).fillRect(x + w - 20, y - 2, 4, 1); },
  runes: (G, x, y, w) => { for (const fx of [x + w * 0.25, x + w * 0.5, x + w * 0.75]) { G.lineStyle(1, 0xc8a0ff).strokeCircle(fx, y - 2, 4); G.fillStyle(0xe8d0ff).fillRect(fx - 1, y - 3, 2, 2); } },
};

export function drawCodex(P, K) {
  const { A, note, pin, R, q, j, SAVE, describe, itemIcon, mkItem, X0, Y0, X1, Y1 } = K;
  const sc = P.scene, T = SAVE.data;
  const S = (P.cx = P.cx ?? { ri: Math.max(0, FR_REGIONS.findIndex((r, i) => (FR_REGIONS[i + 1]?.start ?? 1e9) > (T.best ?? 0))), cat: 1, sel: 0, pat: null, anim: null, item: null });
  const ri = S.ri, REG = FR_REGIONS[ri], DOC = REGIONS[ri];
  const kills = (id) => (id.startsWith("frb") ? T.bossKills?.[id] : T.codex?.[id]) ?? 0;
  const tx = (x, y, s, st = "small", col = q.text, o = {}) => P.t(x, y, s, st, col, o).setDepth(206);
  const wrapW = (w) => ({ wordWrap: { width: w, useAdvancedWrap: !0 } });
  const click = (o, fn) => (o.setInteractive({ useHandCursor: !0 }).on("pointerdown", () => (j.play("click"), fn(), P.render())), o);
  const rect = (x, y, w, h, col, a = 1, d = 204) => A(P, sc.add.rectangle(x, y, w, h, col, a).setOrigin(0), d);
  const frameBox = (x, y, w, h, d = 205) => (A(P, sc.add.rectangle(x - 1, y - 1, w + 2, h + 2).setStrokeStyle(2, 0x3a2414).setOrigin(0), d), A(P, sc.add.rectangle(x - 3, y - 3, w + 6, h + 6).setStrokeStyle(1, 0x8a6a40, 0.8).setOrigin(0), d));
  const stamp = (x, y, txt = "미조사", col = 0xa02818, css = "#a02818") => {
    A(P, sc.add.circle(x, y, 13).setStrokeStyle(2, col, 0.8), 209).setRotation(-0.25);
    tx(x, y - 5, txt, "tiny", css).setOrigin(0.5, 0).setRotation(-0.25).setDepth(210);
  };
  P._anims = [];
  P._pend = [];

  // ── 가죽 표지 + 두 쪽 ──
  const BX = X0 + 4, BY = Y0 + 2, BW = X1 - X0 - 8, BH = Y1 - Y0 - 4;
  A(P, sc.add.image(BX, BY, PAPER.woodKey(sc, BW, BH, { base: 0x5a2a1a, dark: 0x2a1008, hi: 0x8a4a2a, plank: 40 })).setOrigin(0), 202);
  A(P, sc.add.rectangle(BX + 3, BY + 3, BW - 6, BH - 6).setStrokeStyle(1, 0xc8a050, 0.6).setOrigin(0), 203);
  const PW = (BW - 30) / 2, PH = BH - 14, LX = BX + 10, RX = LX + PW + 10, PY = BY + 7;
  A(P, sc.add.image(LX + PW / 2, PY + PH / 2, PAPER.noteKey(sc, PW, PH, 70)), 203);
  A(P, sc.add.image(RX + PW / 2, PY + PH / 2, PAPER.noteKey(sc, PW, PH, 71)), 203);
  // 가운데 접힌 자국 (책등 그늘)
  rect(LX + PW - 6, PY, 6, PH, 0x3a2010, 0.18, 204);
  rect(RX, PY, 6, PH, 0x3a2010, 0.18, 204);
  rect(LX + PW, PY - 2, 10, PH + 4, 0x2a1008, 1, 203);

  // ── 왼쪽 쪽: 지역 책갈피 ──
  const n = FR_REGIONS.length, cw = Math.floor((PW - 16) / n);
  FR_REGIONS.forEach((r, i) => {
    const x = LX + 8 + i * cw, on = i === ri, seen = (T.best ?? 0) >= r.start;
    const pal = r.pal;
    const b = rect(x, PY + 5, cw - 2, on ? 15 : 12, on ? pal.accent : pal.near, 1, 205);
    click(b, () => Object.assign(S, { ri: i, sel: 0, pat: null, anim: null, item: null, lp: 0 }));
    tx(x + (cw - 2) / 2, PY + 6, String(i + 1), "tiny", on ? "#1a0e06" : seen ? "#f2e6c4" : "#a89d82").setOrigin(0.5, 0);
  });
  // 제목
  const reached = (T.best ?? 0) >= REG.start;
  tx(LX + 10, PY + 24, `지역 ${ri + 1}`, "tiny", q.textDim);
  const ttl = tx(LX + 38, PY + 21, REG.name, "big", q.text);
  tx(LX + PW - 10, PY + 24, `${REG.start}m ~ ${REG.end}m`, "tiny", q.textDim).setOrigin(1, 0);
  reached || stamp(LX + 38 + ttl.width + 18, PY + 29, "미답");
  // 분류 쪽지
  CATS.forEach((c, i) => {
    const x = LX + 8 + i * ((PW - 16) / 4), w = (PW - 16) / 4 - 4, on = i === S.cat;
    const nt = A(P, sc.add.image(x + w / 2, PY + 70, PAPER.noteKey(sc, w, 16, 80 + i)), 205);
    on || nt.setTint(0xc8b490);
    click(nt, () => Object.assign(S, { cat: i, sel: 0, anim: null }));
    tx(x + w / 2, PY + 64, c, "small", on ? q.text : q.textDim).setOrigin(0.5, 0).setDepth(207);
    on && pin(P, x + 6, PY + 64, 0xc83a2a);
  });
  rect(LX + 10, PY + 82, PW - 20, 1, 0x7a5434, 0.7, 205);
  const CY = PY + 88; // 왼쪽 내용 시작

  // ── 표본 그림: 지역 배경 + 그 지역 땅 위에 선 몬스터(움직임) ──
  const ground = () => paintPreview(sc, `cx_flat_${REG.id}`, patGrid("flat", 0), REG);
  const bgKey = `bg_${REG.id}`;
  !sc.textures.exists(bgKey + "_sky") && HOOKS.bg?.(sc, REG);
  preloadRegion(sc, ri);
  function scenery(x, y, w, h, groundH = 18) {
    // 하늘: 지역 색 그라데이션 → 배경 그림이 준비되면 덮는다
    const top = REG.pal.sky[0], bot = REG.pal.sky[1];
    const G = A(P, sc.add.graphics(), 204);
    G.fillGradientStyle(top, top, bot, bot, 1).fillRect(x, y, w, h);
    const bgs = [];
    const putBg = () => {
      if (!sc.textures.exists(bgKey + "_sky") || bgs.length) return;
      const sky = sc.textures.get(bgKey + "_sky").getSourceImage();
      bgs.push(A(P, sc.add.image(x, y, bgKey + "_sky").setOrigin(0).setDisplaySize(w, h), 204));
      for (const l of [0, 1, 2]) {
        const k = `${bgKey}_${l}`;
        if (!sc.textures.exists(k)) continue;
        const im = sc.textures.get(k).getSourceImage();
        const s = w / im.width, vh = (h / w) * im.width, cropTop = Math.max(0, Math.min(im.height - vh, 120 + l * 10));
        const o = A(P, sc.add.image(x, y - cropTop * s, k).setOrigin(0).setScale(s), 204);
        o.setCrop(0, cropTop, im.width, vh);
        bgs.push(o);
      }
    };
    putBg();
    // 땅: 지역 재질 그대로 그린 평지 한 줄
    if (groundH > 0) {
      const gk = ground(), gs = (w + 8) / 512;
      const gi = A(P, sc.add.image(x - 4, y + h - groundH - 7 * 16 * gs + 4, gk).setOrigin(0).setScale(gs), 205);
      gi.setCrop(0, 7 * 16 - 6, 512, Math.max(1, (groundH - 3) / gs));
    }
    frameBox(x, y, w, h);
    return { putBg, gy: y + h - groundH + 4 };
  }
  function specimen(x, y, w, h, id, o = {}) {
    const sv = scenery(x, y, w, h, o.groundH ?? 18);
    const spec = SPECS[id];
    const isFoe = !!spec?.model;
    const key = (spec?.boss || id.startsWith("frb") ? "b_" : "e_") + id;
    const spr = A(P, sc.add.sprite(x + w / 2, sv.gy, "__DEFAULT").setOrigin(0.5, 1).setVisible(!1), 206);
    const wait = tx(x + w / 2, y + h / 2 - 6, "그리는 중…", "tiny", "#f2e6c4", { stroke: "#140a04", strokeThickness: 3 }).setOrigin(0.5);
    const st = { spr, id, spec, key, isFoe, ready: !1, names: [], cur: null, t: 0, frames: [], fps: 6, loop: !0, hold: 0, order: 0, mode: null, sv, box: [x, y, w, h], wait, cb: o.onReady };
    P._anims.push(st);
    tryReady(st);
    return st;
  }
  function tryReady(st) {
    st.sv.putBg();
    if (st.ready) return;
    const { spec, key, isFoe } = st;
    if (isFoe ? !spec._fi || !sc.textures.exists(key) : !sc.textures.exists(key)) return;
    st.ready = !0;
    st.wait.setVisible(!1);
    const tex = sc.textures.get(key), f0 = tex.get(0);
    const fw = f0.width, fh = f0.height, [x, y, w, h] = st.box;
    let s = Math.min((h - 14) / fh, (w - 10) / fw);
    s = s >= 2 ? 2 : s >= 1 ? 1 : Math.max(0.35, Math.round(s * 10) / 10);
    st.spr.setTexture(key, 0).setScale(s).setVisible(!0);
    // 움직임 목록
    if (isFoe) st.names = Object.keys(spec.anims).filter((nm) => spec._fi[nm]?.length);
    else st.names = ["idle", "move"].filter((nm) => sc.anims.exists(`${key}_${nm}`));
    st.names.length || (st.names = ["idle"]);
    play(st, st.mode && st.names.includes(st.mode) ? st.mode : st.names[0]);
    st.cb?.(st);
  }
  function play(st, nm) {
    st.cur = nm;
    st.t = 0;
    st.hold = 0;
    if (st.isFoe) {
      const a = st.spec.anims[nm];
      st.frames = st.spec._fi[nm] ?? [0];
      st.fps = a?.[1] ?? 6;
      st.loop = a?.[2] ?? !0;
    } else {
      const an = sc.anims.get(`${st.key}_${nm}`);
      st.frames = an ? an.frames.map((f) => f.textureFrame) : [0];
      st.fps = an?.frameRate ?? 6;
      st.loop = !0;
    }
    st.label?.setText(`${ANIM_KO[nm] ?? nm}`);
  }
  // 움직임 고르는 단추 (전체 = 차례로 자동 재생)
  function animChips(st, x, y, w) {
    const draw = () => {
      st.chips?.forEach((c) => c.destroy());
      st.chips = [];
      const list = ["전체", ...st.names];
      let cx = x, cy = y;
      for (const nm of list) {
        const lab = nm === "전체" ? "▶ 전체" : ANIM_KO[nm] ?? nm;
        const on = (nm === "전체" && !S.anim) || nm === S.anim;
        const t = P.t(0, 0, lab, "tiny", on ? "#f2e6c4" : q.text).setDepth(208);
        const bw = t.width + 8;
        cx + bw > x + w && ((cx = x), (cy += 13));
        const bg = A(P, sc.add.rectangle(cx, cy, bw, 11, on ? 0x5a3418 : 0xe8d4a8, 1).setOrigin(0).setStrokeStyle(1, 0x5a3418, 0.8), 207);
        t.setPosition(cx + 4, cy + 1);
        bg.setInteractive({ useHandCursor: !0 }).on("pointerdown", () => {
          j.play("click");
          S.anim = nm === "전체" ? null : nm;
          st.mode = S.anim;
          play(st, S.anim ?? st.names[0]);
          st.order = 0;
          draw();
        });
        st.chips.push(bg, t);
        cx += bw + 3;
      }
    };
    st.drawChips = draw;
    st.ready ? draw() : (st.cb = () => draw());
  }
  // 한 타이머로 모든 표본을 움직인다
  P._timer = sc.time.addEvent({
    delay: 1000 / 30, loop: !0,
    callback: () => {
      // 아직 그려지지 않았던 초상이 준비되면 쪽을 다시 그린다
      if (P._pend.length && (P._pt = (P._pt ?? 0) + 1) % 15 === 0 && P._pend.some((id) => SPECS[id]?._fi && sc.textures.exists("e_" + id))) return void P.render();
      for (const st of P._anims) {
        if (!st.ready) { tryReady(st); continue; }
        if (!st.spr.active) continue;
        st.t += 1 / 30;
        const n = st.frames.length, k = Math.floor(st.t * st.fps);
        let f;
        if (st.loop) f = st.frames[k % n];
        else {
          f = st.frames[Math.min(n - 1, k)];
          k >= n && (st.hold += 1 / 30);
        }
        st.spr.setFrame(f ?? 0);
        // 전체 보기: 반복 동작은 두 바퀴, 한 번 동작은 끝나고 잠깐 멈춘 뒤 다음으로
        if (!st.mode && st.names.length > 1) {
          const dur = st.loop ? Math.max(1.4, (2 * n) / st.fps) : n / st.fps + 0.5;
          if (st.t >= dur) ((st.order = (st.order + 1) % st.names.length), play(st, st.names[st.order]));
        } else if (!st.loop && st.hold > 0.6) ((st.t = 0), (st.hold = 0));
      }
    },
  });

  // ══ 분류별 ══
  const W = PW - 20, RXc = RX + 10;
  if (S.cat === 0) {
    // ── 지형: 왼쪽 = 풍경화 + 지역 정보, 오른쪽 = 지형 구조 표본 ──
    const sv = scenery(LX + 10, CY, W, 108, 0);
    P._anims.push({ ready: !1, sv, spec: {}, key: "__none__", isFoe: !1, wait: { setVisible() {} }, box: [] });
    let y = CY + 116;
    const row = (k, v, col = q.text) => {
      tx(LX + 12, y, k, "tiny", q.textDim);
      const t = tx(LX + 64, y, v, "tiny", col, wrapW(W - 56));
      y += Math.max(12, t.height + 3);
    };
    row("원소", DOC.element);
    row("지형 특징", DOC.gimmick);
    row("위험 요소", REG.hazards.map((h) => HAZ_KO[h] ?? h).join(" · "));
    row("하늘", REG.ceiling >= 0.5 ? "막힌 동굴 천장" : REG.ceiling > 0.15 ? "낮게 드리운 천장과 처마" : "탁 트인 하늘");
    row("빛깔", DOC.colors ?? "-");
    // 오른쪽
    const pats = Object.entries(REG.patterns).sort((a, b) => b[1] - a[1]);
    const cur = S.pat && REG.patterns[S.pat] ? S.pat : (pats.find(([p]) => p !== "flat") ?? pats[0])[0];
    tx(RXc, PY + 8, "지형 구조", "big", q.text);
    tx(RX + PW - 10, PY + 12, "실제 지역 재질로 그린 단면", "tiny", q.textDim).setOrigin(1, 0);
    const px = RXc, py = PY + 30, pw = W, ph = Math.round(pw * (ROWS * 16) / 512);
    const sv2 = scenery(px, py, pw, ph, 0);
    P._anims.push({ ready: !1, sv: sv2, spec: {}, key: "__none__", isFoe: !1, wait: { setVisible() {} }, box: [] });
    const k = paintPreview(sc, `cx_${cur}_${REG.id}_${REG.ceiling >= 0.5 ? 1 : 0}`, patGrid(cur, REG.ceiling), REG);
    A(P, sc.add.image(px, py, k).setOrigin(0).setScale(pw / 512), 205);
    const hz = HAZ_DRAW[cur];
    if (hz) {
      const G = A(P, sc.add.graphics(), 206), s = pw / 512;
      cur === "ice" || cur === "runes" || cur === "firetrap" ? hz(G, px + 9 * 16 * s, py + 7 * 16 * s, 14 * 16 * s) : hz(G, px + 13 * 16 * s, py + 8 * 16 * s, 6 * 16 * s);
    }
    frameBox(px, py, pw, ph);
    tx(px, py + ph + 5, `${PAT_KO[cur]?.[0] ?? cur}`, "small", q.text);
    tx(px, py + ph + 18, PAT_KO[cur]?.[1] ?? "", "tiny", q.textDim, wrapW(pw));
    // 출현 비율
    let yy = py + ph + 44;
    const tot = pats.reduce((a, [, v]) => a + v, 0);
    tx(px, yy, "이 지역에서 만나는 지형 (출현 비율)", "tiny", q.textDim);
    yy += 12;
    pats.forEach(([p, v], i) => {
      const x = px + (i % 2) * (pw / 2), y2 = yy + Math.floor(i / 2) * 13, on = p === cur;
      const hit = rect(x, y2 - 1, pw / 2 - 6, 12, on ? 0x5a3418 : 0x000000, on ? 0.15 : 0.001, 205);
      click(hit, () => (S.pat = p));
      tx(x + 2, y2, PAT_KO[p]?.[0] ?? p, "tiny", on ? q.red : q.text);
      rect(x + 62, y2 + 3, ((pw / 2 - 74) * v) / pats[0][1], 5, REG.pal.accent, 0.9, 206);
      tx(x + pw / 2 - 8, y2, `${Math.round((v / tot) * 100)}%`, "tiny", q.textDim).setOrigin(1, 0);
    });
  } else if (S.cat === 1) {
    // ── 몬스터: 일반 6 + 정예 2 ──
    const list = [...FR_MONSTERS.filter((m) => m.region === ri), ...FR_ELITES.filter((m) => m.region === ri)];
    const cols = 4, cwid = Math.floor(W / cols), chgt = 84;
    list.forEach((m, i) => {
      const x = LX + 10 + (i % cols) * cwid, y = CY + Math.floor(i / cols) * (chgt + 4), on = i === S.sel;
      const elite = m.id.includes("_e");
      const card = rect(x + 1, y, cwid - 4, chgt, on ? 0xfff2cc : 0xe8d4a8, 1, 205).setStrokeStyle(on ? 2 : 1, on ? 0xa02818 : 0x7a5434);
      click(card, () => Object.assign(S, { sel: i, anim: null }));
      // 초상: 첫 동작의 첫 장
      const spec = SPECS[m.id], key = "e_" + m.id, ok = spec?.model ? spec._fi && sc.textures.exists(key) : sc.textures.exists(key);
      const bx = x + 4, by = y + 4, bw = cwid - 12, bh = 50;
      const tp = REG.pal.sky[0], bt = REG.pal.sky[1];
      A(P, sc.add.graphics(), 206).fillGradientStyle(tp, tp, bt, bt, 1).fillRect(bx, by, bw, bh);
      if (ok) {
        const f = sc.textures.get(key).get(0), s = Math.min(1.2, (bh - 2) / f.height * 1.25, (bw - 2) / f.width * 1.25);
        const im = A(P, sc.add.image(bx + bw / 2, by + bh + 2, key, 0).setOrigin(0.5, 1).setScale(s), 207);
        kills(m.id) || im.setTint(0x6a5a4a);
        im.setCrop(0, 0, f.width, Math.min(f.height, (bh + 2) / s));
      } else (tx(bx + bw / 2, by + bh / 2 - 5, "?", "big", q.textDim).setOrigin(0.5, 0), P._pend.push(m.id));
      A(P, sc.add.rectangle(bx, by, bw, bh).setStrokeStyle(1, 0x3a2414).setOrigin(0), 207);
      elite && (rect(x + 1, y, 22, 10, 0xa02818, 1, 208), tx(x + 4, y, "정예", "tiny", "#f2e6c4").setDepth(209));
      tx(x + cwid / 2 - 1, y + 57, m.name, "tiny", q.text, { ...wrapW(cwid - 8), align: "center" }).setOrigin(0.5, 0);
      kills(m.id) && tx(bx + bw - 2, by + bh - 10, `×${kills(m.id)}`, "tiny", "#f2e6c4", { stroke: "#140a04", strokeThickness: 3 }).setOrigin(1, 0).setDepth(208);
    });
    // 오른쪽: 표본
    const m = list[Math.min(S.sel, list.length - 1)];
    if (m) {
      const elite = m.id.includes("_e");
      const doc = elite ? DOC.elites[+m.id.split("_e")[1]] : DOC.monsters[+m.id.split("_")[1]];
      const st = specimen(RXc, PY + 8, W, 130, m.id);
      kills(m.id) || stamp(RXc + W - 18, PY + 26);
      let y = PY + 150;
      tx(RXc, y, m.name, "big", q.text);
      tx(RX + PW - 10, y + 4, elite ? "정예" : doc?.type ?? m.type ?? "", "tiny", elite ? q.red : q.textDim).setOrigin(1, 0);
      y += 19;
      const stat = (k, v, col) => (tx(RXc, y, k, "tiny", q.textDim), tx(RXc + 34, y, v, "tiny", col ?? q.text));
      stat("체력", `${doc?.hp ?? m.hp}`);
      doc?.weak && (tx(RXc + 80, y, "약점", "tiny", q.textDim), tx(RXc + 104, y, doc.weak, "tiny", q.green));
      doc?.resist && (tx(RXc + 150, y, "내성", "tiny", q.textDim), tx(RXc + 174, y, doc.resist, "tiny", q.red));
      doc?.count > 1 && tx(RXc + 80, y, `출현 ${doc.count}마리`, "tiny", q.textDim);
      y += 14;
      tx(RXc, y, "행동 기록", "tiny", q.textDim);
      const pt = tx(RXc, y + 11, doc?.pattern ?? m.pattern ?? "", "tiny", q.text, wrapW(W));
      y += 14 + pt.height;
      if (doc?.tip) {
        tx(RXc, y, "공략", "tiny", q.orange);
        const t = tx(RXc + 28, y, doc.tip, "tiny", q.text, wrapW(W - 28));
        y += t.height + 3;
      }
      y < PY + PH - 12 && (tx(RXc, y, "전리품", "tiny", q.textDim), tx(RXc + 40, y, doc?.drop ?? m.drop ?? "-", "tiny", q.gold, wrapW(W - 40)));
    }
  } else if (S.cat === 2) {
    // ── 보스 ──
    const b = FR_BOSSES[ri];
    const st = specimen(LX + 10, CY, W, 138, b.id, { groundH: 16 });
    kills(b.id) || stamp(LX + W - 8, CY + 18, "미토벌");
    let y = CY + 145;
    tx(LX + 10, y, b.name, "big", q.text);
    y += 17;
    tx(LX + 10, y, `「${b.title}」`, "tiny", q.orange);
    tx(LX + PW - 10, y, kills(b.id) ? `토벌 ${kills(b.id)}회` : "", "tiny", q.green).setOrigin(1, 0);
    // 오른쪽: 기록
    const bd = DOC.boss;
    tx(RXc, PY + 8, "토벌 기록", "big", q.text);
    let r = PY + 30;
    tx(RXc, r, "체력", "tiny", q.textDim), tx(RXc + 30, r, `${bd.hp}`, "tiny", q.text);
    tx(RXc + 80, r, "약점", "tiny", q.textDim), tx(RXc + 104, r, bd.weak, "tiny", q.green);
    tx(RXc + 150, r, "내성", "tiny", q.textDim), tx(RXc + 174, r, bd.resist, "tiny", q.red);
    r += 14;
    tx(RXc, r, "무대", "tiny", q.textDim);
    const sg = tx(RXc + 30, r, bd.stage, "tiny", q.text, wrapW(W - 30));
    r += sg.height + 6;
    bd.phases.forEach((ph, i) => {
      const bh = 12 + ph.patterns.length * 10;
      rect(RXc, r, W, bh, i ? 0x8a2a1a : 0x5a3418, 0.1, 205).setStrokeStyle(1, i ? 0xa02818 : 0x7a5434, 0.6);
      tx(RXc + 4, r + 2, `${i + 1}단계 · 체력 ${ph.range}`, "tiny", i ? q.red : q.text);
      ph.patterns.forEach((p, k) => tx(RXc + 10, r + 12 + k * 10, `· ${p}`, "tiny", q.text));
      r += bh + 3;
    });
    // 유물
    const relic = bd.relic && mkItem(bd.relic);
    if (relic && r < PY + PH - 30) {
      tx(RXc, r, "토벌 전리품 (유물)", "tiny", q.textDim);
      r += 11;
      const ic = A(P, sc.add.image(RXc + 12, r + 12, itemIcon(sc, relic)).setScale(1), 206);
      kills(b.id) || ic.setTint(0x6a5a4a);
      tx(RXc + 28, r + 2, relic.name, "small", q.gold);
      const raw = ITEMS.find((x) => x.id === bd.relic);
      tx(RXc + 28, r + 14, raw?.desc ?? "", "tiny", q.text, wrapW(W - 30));
    }
  } else {
    // ── 전리품: 이 지역에서 나오는 장비·스킬·마법·유물 ──
    const items = ITEMS.filter((x) => x.region === ri);
    const groups = [["weapon", "무기"], ["armor", "방어구"], ["skill", "스킬"], ["magic", "마법"]];
    // 줄 단위로 배치한 뒤 쪽을 나눈다 (쪽 아래로 넘치지 않게, ◀ ▶ 로 넘김)
    const sz = 22, per = Math.floor(W / (sz + 4)), lines = [], flat = [];
    for (const [kd, ko] of groups) {
      const L = items.filter((x) => x.kind === kd && !x.relic);
      if (!L.length) continue;
      lines.push({ h: 12, head: ko, col: q.textDim });
      for (let i = 0; i < L.length; i += per) lines.push({ h: sz + 4, row: L.slice(i, i + per) });
    }
    const relics = items.filter((x) => x.relic);
    if (relics.length) {
      lines.push({ h: 12, head: "유물 (보스)", col: q.orange });
      for (let i = 0; i < relics.length; i += per) lines.push({ h: sz + 4, row: relics.slice(i, i + per), relic: 1 });
    }
    for (const ln of lines) ln.row && flat.push(...ln.row.map((r) => r.id));
    const avail = PY + PH - 20 - CY, pages = [[]];
    let acc = 0;
    for (const ln of lines) {
      if (acc + ln.h > avail && pages[pages.length - 1].length) (pages.push([]), (acc = 0));
      // 머리글만 쪽 끝에 남지 않게
      pages[pages.length - 1].push(ln);
      acc += ln.h;
    }
    const pg = Math.min(S.lp ?? 0, pages.length - 1);
    let y = CY;
    for (const ln of pages[pg]) {
      if (ln.head) tx(LX + 10, y, ln.head, "tiny", ln.col);
      else
        ln.row.forEach((raw, i) => {
          const it = mkItem(raw.id);
          if (!it) return;
          const x = LX + 10 + i * (sz + 4), on = S.item === raw.id || (!S.item && raw.id === flat[0]);
          const bg = rect(x, y, sz, sz, on ? 0xfff2cc : ln.relic ? 0x8a5a10 : 0x3a2414, on ? 1 : ln.relic ? 0.25 : 0.2, 205).setStrokeStyle(on ? 2 : 1, on ? 0xa02818 : ln.relic ? 0xc89a40 : 0x7a5434);
          click(bg, () => (S.item = raw.id));
          A(P, sc.add.image(x + sz / 2, y + sz / 2, itemIcon(sc, it)).setScale((0.9 * sz) / 24), 206);
        });
      y += ln.h;
    }
    if (pages.length > 1) {
      const ny = PY + PH - 16;
      const prev = rect(LX + 10, ny, 18, 12, 0x5a3418, pg > 0 ? 1 : 0.3, 206);
      const next = rect(LX + PW - 28, ny, 18, 12, 0x5a3418, pg < pages.length - 1 ? 1 : 0.3, 206);
      pg > 0 && click(prev, () => (S.lp = pg - 1));
      pg < pages.length - 1 && click(next, () => (S.lp = pg + 1));
      tx(LX + 19, ny + 1, "◀", "tiny", "#f2e6c4").setOrigin(0.5, 0).setDepth(207);
      tx(LX + PW - 19, ny + 1, "▶", "tiny", "#f2e6c4").setOrigin(0.5, 0).setDepth(207);
      tx(LX + PW / 2, ny + 1, `${pg + 1} / ${pages.length}쪽 · 전리품 ${flat.length}종`, "tiny", q.textDim).setOrigin(0.5, 0);
    }
    let descEnd = PY + 70;
    const cur = S.item ?? flat[0];
    const raw = ITEMS.find((x) => x.id === cur), it = cur && mkItem(cur);
    if (it) {
      tx(RXc, PY + 8, "전리품 기록", "big", q.text);
      A(P, sc.add.rectangle(RXc, PY + 30, 34, 34, 0x3a2414, 0.25).setOrigin(0).setStrokeStyle(1, 0x7a5434), 205);
      A(P, sc.add.image(RXc + 17, PY + 47, itemIcon(sc, it)).setScale(1.3), 206);
      tx(RXc + 42, PY + 30, it.name, "small", raw?.relic ? q.gold : q.text);
      tx(RXc + 42, PY + 44, `${KIND_KO[raw?.kind] ?? ""}${raw?.relic ? " · 유물" : ""}${raw?.boss ? ` · ${raw.boss}` : ""}`, "tiny", q.textDim, wrapW(W - 44));
      try { descEnd = describe(P, it, RXc, PY + 70, W); } catch (e) { descEnd = PY + 70 + tx(RXc, PY + 70, raw?.desc ?? "", "tiny", q.text, wrapW(W)).height; }
    }
    // 몬스터 전리품 표 (오른쪽 아래)
    const drops = [...DOC.monsters, ...DOC.elites].slice(0, 8);
    const bottom = PY + PH - 8, fit = Math.floor((bottom - (descEnd + 18)) / 11);
    let r = Math.max(descEnd + 8, bottom - 11 - Math.min(fit, drops.length) * 11);
    fit >= 2 && (rect(RXc, r - 4, W, 1, 0x7a5434, 0.6, 205), tx(RXc, r, "몬스터가 떨어뜨리는 것", "tiny", q.textDim));
    r += 11;
    drops.slice(0, Math.max(0, fit)).forEach((d, i) => {
      const name = (i < 6 ? FR_MONSTERS.find((m) => m.id === `fr${ri}_${i}`) : FR_ELITES.find((m) => m.id === `fr${ri}_e${i - 6}`))?.name ?? d.name;
      tx(RXc, r, name, "tiny", q.text);
      tx(RX + PW - 10, r, d.drop ?? "-", "tiny", q.gold).setOrigin(1, 0);
      r += 11;
    });
  }
}
export function stopCodex(P) {
  P._timer?.remove();
  P._timer = null;
  P._anims = [];
}
