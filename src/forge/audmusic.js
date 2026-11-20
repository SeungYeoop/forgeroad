// 작곡기: 지역마다 곡 성격(악기·리듬·화음 진행) + 구간 전개(도입 → 주제 A → 주제 B → 쉼 → …)
//   주제 선율은 곡마다 한 번 만들어 되풀이한다 (동기 → 반복·모방 → 대조 → 마침). 구역(키)마다 선율·진행이 다르다.
import { Rnd, hashStr, gainN, panN, filt } from "./audcore.js";
import * as V from "./audvoice.js";

export const SC = {
  ION: [0, 2, 4, 5, 7, 9, 11],
  DOR: [0, 2, 3, 5, 7, 9, 10],
  PHR: [0, 1, 3, 5, 7, 8, 10],
  LYD: [0, 2, 4, 6, 7, 9, 11],
  MIX: [0, 2, 4, 5, 7, 9, 10],
  AEO: [0, 2, 3, 5, 7, 8, 10],
  HARM: [0, 2, 3, 5, 7, 8, 11],
  PHRD: [0, 1, 4, 5, 7, 8, 10],
  WT: [0, 2, 4, 6, 8, 10],
};
const POLY = new Set(["pad", "choir", "drone"]);
const HP_V = new Set(["pad", "choir", "strings", "brass"]);

// ── 곡 성격 ──
//  progA/progB: 마디마다 화음(음계 도수 0~6) 4개짜리 진행 후보
//  pad·pad2·bass·arp·lead·lead2·counter: { v: 악기, o: 악기 옵션, oct: 중심 음높이, g: 크기, verb/delay: 울림 보냄, pan }
//  drums: 타악 표, fill: 구간 끝 채우기, crash/rev: 구간 시작 심벌·거꾸로 심벌, amb: 환경음
const AMBIENT_PLAN = ["intro", "A", "break", "B", "A2", "break2"];
const STY = {
  // 그래스메어: 햇살 좋은 초원. 느리고 잔잔하게 — 부드러운 패드, 느린 하프, 낮은 피리, 북은 거의 없음
  meadow: {
    tempo: 76, root: 55, scale: SC.ION, maxE: 2, gain: 0.9,
    progA: [[0, 3, 0, 4], [0, 5, 3, 4], [0, 3, 5, 4], [0, 4, 5, 3]],
    progB: [[3, 4, 0, 5], [5, 3, 0, 4], [3, 0, 4, 4]],
    pad: { v: "pad", o: { wave: "warm", cut: 950, a: 2, r: 2.4, g: 0.12, det: 5 }, oct: 60, g: 0.85, verb: 0.45 },
    bass: { v: "bass", o: { kind: "upright", g: 0.28, decay: 0.8 }, pat: "ambient2", oct: 43 },
    arp: { v: "pluck", o: { wave: "soft", bright: 3.5, decay: 1, g: 0.2, atk: 0.12 }, pat: "up8", brk: "quarter", oct: 60, g: 0.75, verb: 0.42, delay: 0.1, pan: -0.25 },
    lead: { v: "flute", o: { g: 0.13, breath: 0.12, vib: 8, a: 0.1, r: 0.25 }, oct: 69, dens: 0.3, orn: 0.08, legato: 1, verb: 0.45, delay: 0.12, pan: 0.12 },
    lead2: { v: "strings", o: { g: 0.09, bright: 3, a: 0.35, r: 0.6 }, oct: 69, dens: 0.3, legato: 1, verb: 0.48, pan: 0.1 },
    counter: { v: "strings", o: { g: 0.06, a: 0.7, r: 1, bright: 2.6 }, oct: 60, verb: 0.48, pan: -0.15 },
    drums: "meadow", drumG: 0.55, amb: "meadow",
  },
  // 재의 마을·재의 들판: 쓸쓸하지만 발걸음을 재촉하는 민속풍 모험
  folk: {
    tempo: 96, root: 57, scale: SC.AEO,
    progA: [[0, 5, 2, 6], [0, 5, 3, 4], [0, 3, 5, 6], [0, 6, 5, 6]],
    progB: [[5, 6, 0, 0], [3, 4, 5, 6], [5, 2, 3, 6], [3, 0, 6, 4]],
    pad: { v: "pad", o: { wave: "warm", cut: 1300, a: 1.2, r: 1.6, g: 0.15 }, oct: 57, g: 0.9, verb: 0.35 },
    bass: { v: "bass", o: { kind: "upright", g: 0.42 }, pat: "folk", oct: 45, g: 1 },
    arp: { v: "pluck", o: { wave: "soft", bright: 7, decay: 0.55, g: 0.34 }, pat: "broken8", oct: 57, g: 0.8, verb: 0.3, delay: 0.1, pan: -0.28 },
    lead: { v: "flute", o: { g: 0.2 }, oct: 76, dens: 0.48, orn: 0.18, legato: 1, g: 1, verb: 0.32, delay: 0.16, pan: 0.12 },
    lead2: { v: "strings", o: { g: 0.13, bright: 4.5, a: 0.12 }, oct: 72, legato: 1, g: 1, verb: 0.35, delay: 0.08, pan: 0.1 },
    counter: { v: "strings", o: { g: 0.1, a: 0.4, r: 0.6 }, oct: 64, g: 0.9, verb: 0.35, pan: -0.15 },
    drums: "folk", fill: "hand", amb: "village",
  },
  // 안개 숲: 반딧불 밤숲의 3박자 왈츠 (첼레스타·허밍 합창·피리)
  forest: {
    gain: 0.9, tempo: 100, root: 57, scale: SC.DOR, beats: 3,
    progA: [[0, 3, 0, 6], [0, 6, 3, 4], [0, 1, 3, 0], [0, 3, 6, 6]],
    progB: [[3, 4, 0, 0], [5, 6, 3, 4], [2, 3, 6, 4], [3, 6, 0, 4]],
    pad: { v: "choir", o: { vowel: "u", g: 0.36, a: 1.3, r: 1.6 }, oct: 60, g: 0.9, verb: 0.5 },
    bass: { v: "bass", o: { kind: "upright", g: 0.4 }, pat: "waltz", oct: 45 },
    arp: { v: "bell", o: { ratio: 4, index: 1.4, decay: 0.7, g: 0.09 }, pat: "waltz3", oct: 69, g: 0.9, verb: 0.4, delay: 0.22, pan: 0.3 },
    lead: { v: "flute", o: { g: 0.19 }, oct: 74, dens: 0.42, orn: 0.3, legato: 1, verb: 0.4, delay: 0.2, pan: -0.1 },
    lead2: { v: "pluck", o: { wave: "soft", bright: 6, decay: 0.8, g: 0.36 }, oct: 74, verb: 0.4, delay: 0.25, pan: -0.1 },
    counter: { v: "strings", o: { g: 0.1, a: 0.5 }, oct: 62, verb: 0.4, pan: 0.15 },
    drums: "forest", amb: "forest",
  },
  // 광맥 동굴: 물방울 울림 같은 칼림바, 낮게 깔린 소리, 드문 북
  cave: {
    gain: 1.1, tempo: 78, root: 52, scale: SC.PHR, plan: AMBIENT_PLAN, maxE: 2,
    progA: [[0, 0, 1, 0], [0, 6, 1, 0], [0, 5, 6, 0]],
    progB: [[5, 6, 1, 0], [3, 1, 0, 0], [5, 1, 6, 0]],
    pad: { v: "drone", o: { cut: 420, g: 0.2 }, oct: 40, g: 0.9, verb: 0.4 },
    pad2: { v: "pad", o: { wave: "hollow", cut: 900, a: 2.5, r: 3, g: 0.1 }, oct: 62, g: 0.8, verb: 0.6 },
    bass: { v: "bass", o: { kind: "sub", g: 0.36 }, pat: "ambient", oct: 33 },
    arp: { v: "mallet", o: { kal: 1, decay: 0.5, g: 0.2 }, pat: "sparse", brk: "sparse", oct: 64, verb: 0.5, delay: 0.42, pan: 0.35 },
    lead: { v: "mallet", o: { kal: 1, decay: 0.6, g: 0.24 }, oct: 72, dens: 0.24, verb: 0.55, delay: 0.38, pan: -0.2 },
    lead2: { v: "bell", o: { ratio: 3.5, decay: 1.6, g: 0.09 }, oct: 76, verb: 0.6, delay: 0.3, pan: -0.2 },
    drums: "cave", amb: "cave",
  },
  // 검은 늪: 흐느적거리는 패드, 낮은 클라리넷, 둔탁한 북
  swamp: {
    gain: 1.12, tempo: 84, root: 50, scale: SC.PHR, swing: 0.12,
    progA: [[0, 1, 0, 6], [0, 3, 1, 0], [0, 6, 5, 1]],
    progB: [[3, 1, 5, 6], [5, 1, 6, 0], [3, 6, 1, 0]],
    pad: { v: "pad", o: { wave: "hollow", cut: 820, det: 13, a: 1.6, g: 0.15, wob: 16 }, oct: 55, g: 0.9, verb: 0.4 },
    bass: { v: "bass", o: { kind: "upright", decay: 0.45, g: 0.42 }, pat: "swamp", oct: 40 },
    arp: { v: "mallet", o: { decay: 0.32, g: 0.2 }, pat: "broken8", oct: 52, g: 0.8, verb: 0.3, delay: 0.18, pan: 0.3 },
    lead: { v: "reed", o: { g: 0.15 }, oct: 64, dens: 0.4, orn: 0.15, legato: 1, verb: 0.35, delay: 0.12, pan: -0.1 },
    lead2: { v: "reed", o: { g: 0.13, bright: 4.5 }, oct: 69, dens: 0.4, legato: 1, verb: 0.4, delay: 0.15 },
    counter: { v: "strings", o: { g: 0.1, a: 0.5 }, oct: 55, verb: 0.35, pan: 0.15 },
    drums: "swamp", amb: "swamp",
  },
  // 용암 요새: 행진하는 북과 금관, 짧게 끊는 현악
  march: {
    gain: 1.12, tempo: 120, root: 50, scale: SC.AEO,
    progA: [[0, 5, 6, 0], [0, 3, 6, 2], [0, 6, 5, 6], [0, 5, 3, 6]],
    progB: [[5, 6, 0, 0], [3, 6, 2, 5], [5, 3, 6, 6]],
    pad: { v: "pad", o: { type: "sawtooth", cut: 2000, a: 0.45, r: 0.8, g: 0.09 }, oct: 57, g: 0.85, verb: 0.3 },
    bass: { v: "bass", o: { kind: "synth", g: 0.36, bright: 0.8 }, pat: "march", oct: 38 },
    arp: { v: "strings", o: { stac: 1, g: 0.13 }, pat: "ost8", oct: 57, g: 0.9, verb: 0.2, pan: -0.25 },
    lead: { v: "brass", o: { g: 0.15 }, oct: 67, dens: 0.42, legato: 1, verb: 0.35, delay: 0.06, pan: 0.15 },
    lead2: { v: "brass", o: { g: 0.15, bright: 1.15 }, oct: 72, dens: 0.42, legato: 1, verb: 0.38, delay: 0.06, pan: 0.15 },
    counter: { v: "choir", o: { vowel: "a", g: 0.3, a: 0.5 }, oct: 60, verb: 0.45 },
    drums: "march", fill: "snare", crash: 1, amb: "fire",
  },
  // 서리 절벽: 오르골·높은 현악, 맑고 차가운 리디안
  snow: {
    gain: 1.19, tempo: 84, root: 62, scale: SC.LYD,
    progA: [[0, 1, 0, 1], [0, 1, 5, 4], [0, 4, 5, 1]],
    progB: [[5, 3, 1, 4], [3, 4, 5, 1], [5, 1, 3, 4]],
    pad: { v: "pad", o: { wave: "warm", cut: 2400, a: 1.6, r: 2, g: 0.11, shimmer: 0.25 }, oct: 64, g: 0.9, verb: 0.55 },
    bass: { v: "bass", o: { kind: "sub", g: 0.34 }, pat: "ambient2", oct: 38 },
    arp: { v: "bell", o: { ratio: 5, index: 1.2, decay: 0.8, g: 0.08 }, pat: "up8", oct: 76, verb: 0.45, delay: 0.3, pan: 0.3 },
    lead: { v: "strings", o: { g: 0.13, a: 0.25 }, oct: 72, dens: 0.38, legato: 1, verb: 0.45, delay: 0.1, pan: -0.1 },
    lead2: { v: "flute", o: { g: 0.18 }, oct: 79, dens: 0.38, legato: 1, verb: 0.45, delay: 0.2, pan: -0.1 },
    counter: { v: "bell", o: { ratio: 3.5, decay: 1.4, g: 0.07 }, oct: 72, verb: 0.55, delay: 0.2, pan: 0.2 },
    drums: "snow", amb: "snow",
  },
  // 유리 모래톱: 우드(현)와 네이(피리), 다르부카 장단, 프리지안 도미넌트
  desert: {
    tempo: 100, root: 55, scale: SC.PHRD,
    progA: [[0, 1, 0, 6], [0, 1, 6, 0], [0, 5, 1, 0]],
    progB: [[3, 1, 0, 0], [5, 6, 1, 0], [3, 5, 1, 0]],
    pad: { v: "drone", o: { cut: 600, g: 0.15, fifth: 0.8 }, oct: 43, g: 0.9, verb: 0.35, pedal: 1 },
    pad2: { v: "pad", o: { wave: "warm", cut: 1100, a: 1.4, g: 0.08 }, oct: 60, g: 0.7, verb: 0.4 },
    bass: { v: "bass", o: { kind: "upright", g: 0.4 }, pat: "desert", oct: 43 },
    arp: { v: "pluck", o: { wave: "bright", bright: 10, q: 3, decay: 0.35, twang: 1, g: 0.28 }, pat: "broken8", oct: 57, g: 0.85, verb: 0.25, delay: 0.12, pan: -0.3 },
    lead: { v: "flute", o: { g: 0.2, breath: 0.55, vib: 16 }, oct: 74, dens: 0.5, orn: 0.4, legato: 1, verb: 0.38, delay: 0.15, pan: 0.15 },
    lead2: { v: "pluck", o: { wave: "bright", bright: 9, q: 2.5, decay: 0.5, twang: 1, g: 0.38 }, oct: 69, dens: 0.5, orn: 0.3, verb: 0.3, delay: 0.18, pan: 0.15 },
    counter: { v: "strings", o: { g: 0.09, a: 0.4 }, oct: 62, verb: 0.4, pan: -0.15 },
    drums: "desert", fill: "darbuka", amb: "desert",
  },
  // 뇌운 첨탑: 몰아치는 신스 베이스·현악 오스티나토·금관, 꽉 찬 드럼
  storm: {
    gain: 1.25, tempo: 132, root: 54, scale: SC.AEO,
    progA: [[0, 5, 2, 6], [0, 6, 5, 6], [0, 3, 5, 6]],
    progB: [[5, 6, 0, 2], [3, 4, 5, 6], [5, 3, 6, 4]],
    pad: { v: "pad", o: { type: "sawtooth", cut: 1800, a: 0.3, r: 0.6, g: 0.09 }, oct: 60, g: 0.85, verb: 0.3 },
    bass: { v: "bass", o: { kind: "synth", g: 0.36 }, pat: "pulse8", oct: 38 },
    arp: { v: "pluck", o: { wave: "bright", bright: 12, decay: 0.22, g: 0.24 }, pat: "up16", oct: 64, g: 0.85, verb: 0.2, delay: 0.24, pan: 0.3 },
    lead: { v: "brass", o: { g: 0.15 }, oct: 69, dens: 0.5, legato: 1, verb: 0.3, delay: 0.08, pan: -0.1 },
    lead2: { v: "strings", o: { g: 0.14, bright: 6, a: 0.08 }, oct: 74, dens: 0.5, legato: 1, verb: 0.35, delay: 0.1, pan: -0.1 },
    counter: { v: "strings", o: { g: 0.1, a: 0.3 }, oct: 62, verb: 0.3, pan: 0.2 },
    drums: "storm", fill: "toms", crash: 1, rev: 1, amb: "storm",
  },
  // 빛의 정원·수정 성소: 합창과 종, 하프 — 고요하고 성스러운
  sacred: {
    tempo: 76, root: 64, scale: SC.ION, plan: AMBIENT_PLAN, maxE: 2,
    progA: [[0, 4, 5, 3], [0, 3, 0, 4], [0, 5, 3, 4]],
    progB: [[3, 4, 2, 5], [5, 3, 0, 4], [3, 0, 4, 4]],
    pad: { v: "choir", o: { vowel: "a", g: 0.4, a: 1.5, r: 2 }, oct: 60, g: 0.9, verb: 0.6 },
    bass: { v: "bass", o: { kind: "sub", g: 0.32 }, pat: "ambient", oct: 40 },
    arp: { v: "pluck", o: { wave: "soft", bright: 6, decay: 0.9, g: 0.3 }, pat: "up8", brk: "quarter", oct: 60, verb: 0.45, delay: 0.15, pan: -0.25 },
    lead: { v: "bell", o: { ratio: 3.5, decay: 1.3, g: 0.11 }, oct: 79, dens: 0.3, verb: 0.55, delay: 0.25, pan: 0.15 },
    lead2: { v: "strings", o: { g: 0.12, a: 0.35 }, oct: 72, dens: 0.32, legato: 1, verb: 0.5, delay: 0.1, pan: 0.1 },
    counter: { v: "strings", o: { g: 0.09, a: 0.6 }, oct: 64, verb: 0.5, pan: -0.15 },
    drums: "sacred", rev: 1, amb: "sanctum",
  },
  // 구름 섬·하늘 폐허: 탁 트인 하늘, 하프 16분음표와 피리, 가벼운 북
  sky: {
    tempo: 112, root: 62, scale: SC.ION,
    progA: [[0, 4, 5, 3], [0, 2, 3, 4], [3, 4, 0, 5], [0, 5, 3, 4]],
    progB: [[3, 4, 5, 0], [5, 3, 0, 4], [3, 0, 4, 5], [1, 4, 0, 5]],
    pad: { v: "pad", o: { wave: "warm", cut: 2200, a: 0.8, g: 0.12 }, oct: 60, g: 0.85, verb: 0.4 },
    bass: { v: "bass", o: { kind: "upright", g: 0.4 }, pat: "sync", oct: 43 },
    arp: { v: "pluck", o: { wave: "soft", bright: 8, decay: 0.6, g: 0.26 }, pat: "harp16", oct: 60, g: 0.85, verb: 0.35, delay: 0.1, pan: -0.25 },
    lead: { v: "flute", o: { g: 0.2 }, oct: 76, dens: 0.52, orn: 0.12, legato: 1, verb: 0.35, delay: 0.15, pan: 0.12 },
    lead2: { v: "strings", o: { g: 0.14, a: 0.12 }, oct: 74, dens: 0.52, legato: 1, verb: 0.38, delay: 0.08, pan: 0.12 },
    counter: { v: "brass", o: { g: 0.09, bright: 0.7, a: 0.12 }, oct: 62, verb: 0.4, pan: -0.15 },
    drums: "sky", fill: "toms", crash: 1, amb: "sky",
  },
  // 그림자 심연: 낮은 허밍 합창, 드문 피아노, 심장 고동 같은 북
  abyss: {
    gain: 0.92, tempo: 70, root: 48, scale: SC.PHR, plan: AMBIENT_PLAN, maxE: 2,
    progA: [[0, 0, 1, 0], [0, 5, 1, 0], [0, 6, 5, 1]],
    progB: [[5, 1, 0, 0], [3, 1, 6, 0], [5, 6, 1, 1]],
    pad: { v: "choir", o: { vowel: "u", g: 0.34, a: 2, r: 2.5 }, oct: 55, g: 0.9, verb: 0.6 },
    pad2: { v: "drone", o: { cut: 300, g: 0.16 }, oct: 36, g: 0.9, verb: 0.3 },
    bass: { v: "bass", o: { kind: "sub", g: 0.36 }, pat: "heart", oct: 36 },
    arp: { v: "ep", o: { g: 0.13 }, pat: "sparse", brk: "sparse", oct: 64, verb: 0.5, delay: 0.4, pan: 0.3 },
    lead: { v: "ep", o: { g: 0.15 }, oct: 72, dens: 0.26, verb: 0.55, delay: 0.3, pan: -0.15 },
    lead2: { v: "strings", o: { g: 0.11, a: 0.4 }, oct: 67, dens: 0.3, legato: 1, verb: 0.5, pan: -0.1 },
    counter: { v: "strings", o: { g: 0.09, a: 0.6 }, oct: 55, verb: 0.45, pan: 0.15 },
    drums: "abyss", rev: 1, amb: "abyss",
  },
  // 용암 핵·재련의 심장: 하모닉 마이너, 합창·금관·현악 오스티나토·타이코
  epic: {
    gain: 0.9, tempo: 136, root: 53, scale: SC.HARM,
    progA: [[0, 5, 3, 4], [0, 3, 4, 0], [0, 5, 1, 4], [0, 3, 5, 4]],
    progB: [[5, 3, 4, 4], [3, 5, 1, 4], [5, 4, 0, 4]],
    pad: { v: "choir", o: { vowel: "a", g: 0.36, a: 0.5 }, oct: 60, g: 0.9, verb: 0.45 },
    pad2: { v: "pad", o: { type: "sawtooth", cut: 2000, g: 0.07, a: 0.4 }, oct: 52, g: 0.8, verb: 0.3 },
    bass: { v: "bass", o: { kind: "synth", g: 0.36 }, pat: "pulse8", oct: 38 },
    arp: { v: "strings", o: { stac: 1, g: 0.13 }, pat: "ost16", oct: 57, g: 0.9, verb: 0.22, pan: -0.25 },
    lead: { v: "brass", o: { g: 0.15 }, oct: 67, dens: 0.48, legato: 1, verb: 0.35, delay: 0.06, pan: 0.12 },
    lead2: { v: "brass", o: { g: 0.15, bright: 1.15 }, oct: 72, dens: 0.48, legato: 1, verb: 0.38, delay: 0.06, pan: 0.12 },
    counter: { v: "strings", o: { g: 0.1, a: 0.2 }, oct: 74, verb: 0.35, pan: -0.2 },
    drums: "epic", fill: "taiko", crash: 1, rev: 1, amb: "forge",
  },
  // 보스: 지역 조성을 그대로, 질주하는 베이스·타이코·금관·합창
  boss: {
    tempo: 140, plan: ["intro", "A", "B", "A2", "B2"], minE: 2, introBars: 2, fadeIn: 0.15, introFx: "boss",
    progA: [[0, 5, 6, 0], [0, 6, 5, 4], [0, 1, 0, 6], [0, 5, 3, 4]],
    progB: [[5, 6, 0, 0], [3, 4, 5, 6], [5, 3, 6, 4]],
    pad: { v: "choir", o: { vowel: "a", g: 0.34, a: 0.4 }, oct: 60, g: 0.9, verb: 0.4 },
    pad2: { v: "pad", o: { type: "sawtooth", cut: 1800, g: 0.07, a: 0.3 }, oct: 52, g: 0.8, verb: 0.25 },
    bass: { v: "bass", o: { kind: "synth", g: 0.36 }, pat: "gallop", oct: 38 },
    arp: { v: "strings", o: { stac: 1, g: 0.13 }, pat: "ost16", oct: 57, g: 0.9, verb: 0.2, pan: -0.25 },
    lead: { v: "brass", o: { g: 0.16 }, oct: 67, dens: 0.5, legato: 1, verb: 0.32, delay: 0.06, pan: 0.12 },
    lead2: { v: "brass", o: { g: 0.16, bright: 1.2 }, oct: 72, dens: 0.5, legato: 1, verb: 0.35, delay: 0.06, pan: 0.12 },
    counter: { v: "strings", o: { g: 0.1, a: 0.15 }, oct: 74, verb: 0.3, pan: -0.2 },
    drums: "boss", fill: "taiko", crash: 1, rev: 1, amb: "keep",
  },
  // 거점(대장간 마을): 포근한 전자 피아노, 걷는 베이스, 살짝 튀는 리듬, 가끔 모루 소리
  hub: {
    tempo: 88, root: 62, scale: SC.ION, swing: 0.14, lush: 1, chromatic: 1, plan: ["intro", "A", "B", "A2", "break"],
    progA: [[0, 5, 1, 4], [0, 3, 4, 0], [0, 2, 3, 4], [0, 5, 3, 4]],
    progB: [[3, 4, 2, 5], [3, 0, 1, 4], [5, 3, 1, 4]],
    pad: { v: "pad", o: { wave: "warm", cut: 1100, a: 1.2, g: 0.09 }, oct: 60, g: 0.8, verb: 0.3 },
    bass: { v: "bass", o: { kind: "upright", g: 0.4, decay: 0.6 }, pat: "walk", oct: 43 },
    arp: { v: "ep", o: { g: 0.12 }, pat: "comp", brk: "comp", oct: 60, g: 0.9, verb: 0.25, delay: 0.05, pan: -0.2 },
    lead: { v: "pluck", o: { wave: "soft", bright: 5, decay: 0.75, g: 0.36 }, oct: 72, dens: 0.45, orn: 0.1, verb: 0.3, delay: 0.12, pan: 0.15 },
    lead2: { v: "flute", o: { g: 0.18 }, oct: 76, dens: 0.45, legato: 1, verb: 0.32, delay: 0.14, pan: 0.15 },
    drums: "hub", amb: "hub",
  },
  // 결과 화면: 느린 피아노와 현악
  result: {
    tempo: 70, root: 57, scale: SC.AEO, plan: ["A", "B", "A2", "B2"], loopTo: 0, maxE: 1,
    progA: [[0, 5, 3, 4], [0, 6, 5, 4]],
    progB: [[5, 3, 0, 4], [3, 6, 2, 5]],
    pad: { v: "pad", o: { wave: "warm", cut: 1200, a: 1.5, g: 0.11 }, oct: 60, g: 0.85, verb: 0.45 },
    bass: { v: "bass", o: { kind: "sub", g: 0.3 }, pat: "ambient", oct: 40 },
    arp: { v: "ep", o: { g: 0.12 }, pat: "quarter", oct: 60, verb: 0.4, delay: 0.1, pan: -0.2 },
    lead: { v: "ep", o: { g: 0.15 }, oct: 72, dens: 0.3, verb: 0.45, delay: 0.15, pan: 0.15 },
    lead2: { v: "strings", o: { g: 0.12, a: 0.3 }, oct: 72, dens: 0.3, legato: 1, verb: 0.45, pan: 0.1 },
    drums: null, amb: null,
  },
  // 변이의 길(끝없는 길): 온음음계의 몽롱함 + 옛 게임기 소리
  rift: {
    gain: 1.35, scale: SC.WT,
    progA: [[0, 1, 0, 5], [0, 2, 1, 0], [0, 4, 3, 1]],
    progB: [[3, 4, 1, 0], [2, 1, 5, 4]],
    pad: { v: "pad", o: { type: "sawtooth", cut: 1200, wob: 22, g: 0.09 }, oct: 60, g: 0.85, verb: 0.4 },
    bass: { v: "bass", o: { kind: "synth", g: 0.34 }, pat: "pulse8", oct: 38 },
    arp: { v: "chip", o: { g: 0.07 }, pat: "up16", oct: 64, verb: 0.25, delay: 0.3, pan: 0.3 },
    lead: { v: "chip", o: { g: 0.09 }, oct: 72, dens: 0.5, legato: 1, verb: 0.3, delay: 0.2, pan: -0.1 },
    lead2: { v: "bell", o: { ratio: 3.5, decay: 1, g: 0.11 }, oct: 76, dens: 0.45, verb: 0.45, delay: 0.25 },
    counter: { v: "strings", o: { g: 0.09, a: 0.3 }, oct: 62, verb: 0.35, pan: 0.2 },
    drums: "rift", crash: 1, amb: "rift",
  },
};
export const STYLES = STY;
// 원래 지역 → 곡 성격
export const REGION_STYLE = {
  grassmere: "meadow", ashvillage: "folk", mistwood: "forest", echomine: "cave", rotmarsh: "swamp", blazefort: "march", frostgorge: "snow",
  glassdesert: "desert", thunderspire: "storm", crystalsanctum: "sacred", skyruins: "sky", shadowcapital: "abyss", forgeheart: "epic",
};
const MOOD_STYLE = { 0: "folk", 1: "forest", 2: "cave", 3: "desert", 4: "snow", 5: "march", 6: "abyss", 7: "storm", 8: "rift", 9: "hub", 10: "result" };
export function styleKey(key, spec = {}) {
  if (key === "hub") return "hub";
  if (key === "result") return "result";
  if (spec.boss || /^boss/.test(key)) return "boss";
  const id = spec.region ?? key.replace(/^region_/, "");
  if (REGION_STYLE[id]) return REGION_STYLE[id];
  if (/endless/.test(id)) return "rift";
  return MOOD_STYLE[spec.mood] ?? "folk";
}

// ── 패턴 ──
// 베이스: [칸, 길이, 음(r 근음·5 5도·8 옥타브·3 3도·a 다음 화음으로 이끄는 음), 세기]
const BP = {
  folk: [[0, 6, "r", 1], [6, 2, "5", 0.6], [8, 6, "r", 0.85], [14, 2, "a", 0.6]],
  waltz: [[0, 8, "r", 1], [8, 4, "5", 0.55]],
  ambient: [[0, 16, "r", 0.9]],
  ambient2: [[0, 8, "r", 0.9], [8, 8, "5", 0.7]],
  swamp: [[0, 4, "r", 1], [6, 2, "5", 0.6], [8, 4, "r", 0.8], [14, 2, "a", 0.6]],
  march: [[0, 3, "r", 1], [4, 3, "5", 0.75], [8, 3, "r", 0.9], [12, 2, "5", 0.7], [14, 2, "a", 0.7]],
  pulse8: [0, 2, 4, 6, 8, 10, 12, 14].map((s, i) => [s, 2, i === 6 ? "5" : i === 3 ? "8" : "r", i % 2 ? 0.62 : 0.95]),
  gallop: [0, 4, 8, 12].flatMap((b) => [[b, 1, "r", 1], [b + 1, 1, "r", 0.62], [b + 2, 2, "r", 0.8]]),
  walk: [[0, 4, "r", 1], [4, 4, "3", 0.8], [8, 4, "5", 0.85], [12, 4, "a", 0.8]],
  desert: [[0, 3, "r", 1], [3, 3, "r", 0.6], [6, 2, "5", 0.7], [8, 4, "r", 0.9], [12, 4, "5", 0.6]],
  heart: [[0, 2, "r", 1], [3, 3, "r", 0.7]],
  sync: [[0, 3, "r", 1], [3, 3, "5", 0.7], [6, 2, "8", 0.65], [8, 4, "r", 0.9], [12, 2, "5", 0.6], [14, 2, "a", 0.65]],
};
// 펼침화음: r=칸 간격, q=화음 사다리 번호(0 근음,1 3도,2 5도,3 옥타브…)
const AP = {
  broken8: { r: 2, q: [0, 2, 3, 4, 3, 2, 1, 2] },
  up8: { r: 2, q: [0, 1, 2, 3, 4, 3, 2, 1] },
  up16: { r: 1, q: [0, 1, 2, 3, 4, 3, 2, 1, 0, 1, 2, 3, 4, 5, 4, 3] },
  harp16: { r: 1, q: [0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1, 2, 3, 4, 5] },
  ost16: { r: 1, q: [0, 0, 3, 0, 0, 4, 0, 3, 0, 0, 3, 0, 5, 4, 3, 2], stac: 1 },
  ost8: { r: 2, q: [0, 3, 0, 3, 0, 4, 0, 3], stac: 1 },
  waltz3: { r: 2, q: [0, 2, 3, 4, 3, 2] },
  quarter: { r: 4, q: [0, 2, 3, 2] },
  comp: { chord: [[2, 2], [6, 1], [10, 2], [14, 1]] },
  sparse: { sparse: 1 },
};
// 타악 표: 세기 x=1 o=0.6 -=0.3 . 쉼. 문자열 길이가 마디 칸 수의 n배면 n마디 무늬
const VEL = { x: 1, o: 0.6, "-": 0.3 };
const DT = {
  meadow: [null, {}, { sh: "-...-...-...-..." }, { sh: "o.-.o.-.o.-.o.-.", rim: "........-......." }],
  folk: [null, { k: "x.......x.......", sh: "..o...o...o...o." }, { k: "x.....o.x.......", sh: "o-o-o-o-o-o-o-o-", t1: "....x.......x..." }, { k: "x.....o.x.....o.", sh: "o-o-o-o-o-o-o-o-", t1: "....x..o....x.o.", riq: "....x.......x..." }],
  forest: [null, { sh: "o...o...o..." }, { k: "x...........", sh: "o.o-o.o-o.o-", rim: "........o..." }, { k: "x.......o...", sh: "o-o-o-o-o-o-", rim: "....o...o...", t1: "..........o." }],
  cave: [null, { t2: "x...............................", clk: "...........o..................-." }, { t2: "x.........o.....x...............", k: "x.......................x.......", clk: "...o.......o..........o........." }, { t2: "x.........o.....x.........o.....", k: "x.......x...............x.......", clk: "...o.......o..........o........." }],
  swamp: [null, { k: "x.......x.......", sh: "..o...o...o...o." }, { k: "x.......x..o....", sh: "..o-..o-..o-..o-", t2: "......o.......o." }, { k: "x.......x..o....", sh: "..o-..o-..o-..o-", t2: "......o.......o.", rim: "....o.......o..." }],
  march: [null, { s: "....x.......x...", k: "x.......x......." }, { s: "-...x..--...x.--", k: "x.......x.......", tk: "x.....x.x.......", h: "o.o.o.o.o.o.o.o." }, { s: "-.--x.--.-.-x.--", k: "x...x...x...x...", tk: "x..x..x.x..x..x.", h: "o.o.o.o.o.o.o.o." }],
  snow: [null, { sh: "o...o...o...o..." }, { k: "x.......x.......", sh: "o.o-o.o-o.o-o.o-" }, { k: "x.......x.......", sh: "o-o-o-o-o-o-o-o-", rim: "....o.......o..." }],
  desert: [null, { dum: "x.......x.......", tek: "..o...o.....o..." }, { dum: "x.......x.......", tek: "..o.o.o...o.o.o.", riq: "o-o-o-o-o-o-o-o-" }, { dum: "x..x....x.......", tek: "..o.o.oo..o.o.oo", riq: "o-o-o-o-o-o-o-o-", k: "x.......x......." }],
  storm: [null, { k: "x...x...x...x...", h: "..o...o...o...o." }, { k: "x...x...x...x...", s: "....x.......x...", h: "-o-o-o-o-o-o-o-o" }, { k: "x...x...x...x.o.", s: "....x.......x...", h: "-o-x-o-o-o-x-o-o", oh: "..............x." }],
  sacred: [null, {}, { tim: "o..............................." }, { tim: "o...............o..............." }],
  sky: [null, { k: "x.........x.....", sh: "o.o.o.o.o.o.o.o." }, { k: "x.........x.....", s: "....o.......o...", sh: "o-o-o-o-o-o-o-o-", t1: "..............o." }, { k: "x.....x...x.....", s: "....x.......x...", h: "-o-o-o-o-o-o-o-o", t1: "...........o..o." }],
  abyss: [null, { k: "o..-............" }, { k: "o..-............", tk: "x..............................." }, { k: "o..-............", tk: "x...............x.........o.....", t2: "..........o..o.." }],
  epic: [null, { tk: "x.....x.x......." }, { k: "x.......x.......", s: "....x.......x...", tk: "x..x..x...x.x...", h: ".o.o.o.o.o.o.o.o" }, { k: "x..x..x.x..x..x.", s: "....x.......x...", tk: "x..x..x.x.x.x...", h: "-o-o-o-o-o-o-o-o" }],
  boss: [null, { k: "x.......x.......", tk: "x.....x.x......." }, { k: "x..x..x.x..x..x.", s: "....x.......x...", tk: "x.....x.....x...", h: "-o-o-o-o-o-o-o-o" }, { k: "x.xx..x.x.xx..x.", s: "....x..-....x.--", tk: "x..x..x.x..x.x..", h: "-o-o-o-o-o-o-o-o" }],
  hub: [null, { sh: "o-o-o-o-o-o-o-o-", k: "x.........x....." }, { k: "x.........x.....", rim: "....o.......o...", sh: "o-o-o-o-o-o-o-o-", anv: "..............................................................o." }, { k: "x.........x.....", rim: "....o.......o...", sh: "o-o-o-o-o-o-o-o-", h: "..-...-...-...-.", anv: "..............................................................o." }],
  rift: [null, { k: "x...x...x...x...", h: "..o...o...o...o." }, { k: "x...x...x...x...", clap: "....x.......x...", h: "-o-o-o-o-o-o-o-o" }, { k: "x...x...x...x.x.", clap: "....x.......x...", h: "-o-x-o-o-o-x-o-o", oh: "..............x." }],
};
// 구간 끝 채우기 (마디 뒤 절반)
const FILL = {
  hand: { t1: "........x.x.x.xx" },
  snare: { s: "........x-x-xxxx" },
  toms: { t1: "........x.x.....", t2: "............x.xx" },
  taiko: { tk: "........x..x.xxx", s: "............x-xx" },
  darbuka: { tek: "........xxxxxxxx", dum: "........x...x..." },
};

// ── 선율 만들기 ──
const CELL4 = [[[[0, 4]], 1], [[[0, 2], [2, 2]], 2], [[[0, 3], [3, 1]], 2], [[[0, 2], [2, 1], [3, 1]], 3], [[[0, 1], [1, 1], [2, 2]], 3], [[[2, 2]], 1], [[], 0]];
const CELL8 = [[[[0, 8]], 1], [[[0, 6], [6, 2]], 2], [[[0, 3], [3, 3], [6, 2]], 3], [[[0, 2], [2, 4], [6, 2]], 3], [[[0, 6]], 1]];
function rhythmBar(R, spb, dens, endLong) {
  const out = [];
  let s = 0;
  while (s < spb) {
    const left = spb - s;
    if (endLong && left <= 8) {
      const opts = left >= 8 ? [[[0, 8]], [[0, 6]], [[0, 4], [4, 4]], [[0, 2], [2, 6]]] : [[[0, left]], [[0, Math.max(2, left - 1)]]];
      for (const [a, d] of R.pick(opts)) out.push([s + a, d]);
      break;
    }
    const use8 = left >= 8 && s % 8 === 0 && R.chance(0.5 - dens * 0.35);
    const lib = use8 ? CELL8 : CELL4;
    const cell = R.wpick(lib.map(([c, busy]) => [c, busy === 0 ? 0.25 * (1 - dens) : Math.max(0.05, 1 + (busy - 1.6) * (dens - 0.45) * 2.4)]));
    for (const [a, d] of cell) out.push([s + a, d]);
    s += use8 ? 8 : 4;
  }
  if (out.length && out[0][0] !== 0 && R.chance(0.65)) out.unshift([0, out[0][0]]);
  return out;
}
function cadenceBar(R, spb) {
  return R.pick(
    spb === 12
      ? [[[0, 4], [4, 8]], [[0, 2], [2, 2], [4, 8]], [[0, 12]]]
      : [[[0, 4], [4, 4], [8, 8]], [[0, 2], [2, 2], [4, 12]], [[0, 6], [6, 2], [8, 8]], [[0, 8], [8, 8]]],
  );
}
// 8마디 주제: 동기(1~2) → 모방(3~4) → 대조·절정(5~6) → 동기 재현(7) → 마침(8)
//   음은 '음계 칸 번호' d (0 = 으뜸음). 센박·긴 음은 화음 구성음에 맞춘다.
function genTheme(R, L, chords, spb, dens) {
  const LO = -3, HI = L + 4;
  const ct = (d, g) => {
    const r = (((d - g) % L) + L) % L;
    return r === 0 || r === 2 || r === 4;
  };
  const snap = (d, g, dir = 1) => {
    if (ct(d, g)) return d;
    for (let k = 1; k < L; k++) for (const x of dir >= 0 ? [d + k, d - k] : [d - k, d + k]) if (x >= LO && x <= HI && ct(x, g)) return x;
    return d;
  };
  const strongAt = (s, dur) => s % (spb === 12 ? 4 : 8) === 0 || dur >= 4;
  let lastLeap = 0;
  const phrase = (bars, start, tgt) => {
    const out = [], total = bars.reduce((a, b) => a + b.r.length, 0);
    let prev = null, rep = 0, i = 0;
    for (const { bar, r } of bars)
      for (const [s, dur] of r) {
        const g = chords[bar], strong = strongAt(s, dur), want = tgt(i / Math.max(1, total - 1));
        let d;
        if (prev == null) d = snap(start, g);
        else {
          const c = [];
          for (let k = -4; k <= 4; k++) {
            const x = prev + k;
            if (x < LO || x > HI) continue;
            let w = [0.5, 3, 1.6, 0.7, 0.25][Math.abs(k)];
            if (k === 0 && rep >= 1) w *= 0.2;
            if (k && Math.sign(k) === Math.sign(want - prev)) w *= 1.8;
            if (Math.abs(lastLeap) >= 3 && k && Math.sign(k) === -Math.sign(lastLeap) && Math.abs(k) <= 2) w *= 2.6;
            if (strong) w *= ct(x, g) ? 3.2 : 0.1;
            else if (dur >= 3 && !ct(x, g)) w *= 0.45;
            c.push([x, w]);
          }
          d = c.length ? R.wpick(c) : prev;
        }
        if (prev != null) ((rep = d === prev ? rep + 1 : 0), (lastLeap = d - prev));
        out.push({ bar, s, dur, d, v: strong ? 1 : 0.84 });
        prev = d;
        i++;
      }
    return out;
  };
  const moveTo = (notes, bar0, bar1) => {
    let best = 0, bs = 1e9;
    for (let sh = -3; sh <= 3; sh++) {
      let sc = Math.abs(sh) * 0.15;
      for (const n of notes) {
        const x = n.d + sh, g = chords[n.bar - bar0 + bar1];
        if (x < LO || x > HI) sc += 4;
        if (strongAt(n.s, n.dur) && !ct(x, g)) sc += 1;
      }
      if (sc < bs) ((bs = sc), (best = sh));
    }
    return notes.map((n) => {
      const bar = n.bar - bar0 + bar1;
      let d = n.d + best;
      if (strongAt(n.s, n.dur)) d = snap(d, chords[bar]);
      return { ...n, bar, d };
    });
  };
  const mid = Math.round((LO + HI) / 2) - 1;
  const arch = (a, p, b) => (u) => (u < 0.6 ? a + (p - a) * (u / 0.6) : p + (b - p) * ((u - 0.6) / 0.4));
  const p1 = phrase([{ bar: 0, r: rhythmBar(R, spb, dens, false) }, { bar: 1, r: rhythmBar(R, spb, dens, true) }], mid, arch(mid, mid + 3, mid));
  const p2 = moveTo(p1, 0, 2);
  if (p2.length) {
    const z = p2[p2.length - 1];
    z.d = snap(z.d + (R.chance(0.5) ? 1 : -1), chords[3]);
  }
  const top = Math.min(HI, Math.max(...p1.map((n) => n.d), mid) + R.int(1, 2));
  const p3 = phrase([{ bar: 4, r: rhythmBar(R, spb, Math.min(0.9, dens + 0.12), false) }, { bar: 5, r: rhythmBar(R, spb, dens, true) }], p2.length ? p2[p2.length - 1].d : mid, arch(mid + 1, top, mid + 1));
  const p4 = moveTo(p1.filter((n) => n.bar === 0), 0, 6);
  const rc = cadenceBar(R, spb), g7 = chords[7], from = p4.length ? p4[p4.length - 1].d : mid;
  let goal = from, gb = 1e9;
  for (let x = LO; x <= HI; x++) {
    const sc = Math.abs(x - from) + Math.abs(x - mid) * 0.5;
    if ((((x - g7) % L) + L) % L === 0 && sc < gb) ((gb = sc), (goal = x));
  }
  const p5 = rc.map(([s, dur], i) => {
    const left = rc.length - 1 - i;
    return { bar: 7, s, dur, d: goal + Math.sign(from - goal) * Math.min(Math.abs(from - goal), left), v: left ? 0.85 : 0.95 };
  });
  return [...p1, ...p2, ...p3, ...p4, ...p5];
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const DEFAULT_PLAN = ["intro", "A", "B", "A2", "break", "B2"];

// ── 곡 하나 (재생 중인 트랙) ──
export class Track {
  constructor(E, key, spec, t0) {
    this.E = E;
    this.key = key;
    const sk = (this.sk = styleKey(key, spec));
    const st = (this.st = STY[sk]);
    const R = (this.R = new Rnd(hashStr(key) ^ ((spec.seed ?? 0) * 7919)));
    let root = st.root ?? spec.root ?? 57, scale = st.scale ?? spec.scale ?? SC.AEO, tempo = st.tempo ?? spec.tempo ?? 112;
    if (sk === "boss") {
      // 보스: 그 지역 조성(장조면 단조로)과 빠른 박자
      const base = STY[REGION_STYLE[spec.region]] ?? STY[MOOD_STYLE[spec.mood]] ?? STY.folk;
      root = base.root ?? spec.root ?? 57;
      scale = base.scale === SC.ION || base.scale === SC.LYD || base.scale === SC.MIX ? SC.AEO : base.scale === SC.WT ? SC.PHR : base.scale ?? SC.AEO;
      tempo = clamp((base.tempo ?? spec.tempo ?? 110) + 22, 128, 156);
    }
    if (sk === "rift") ((root = spec.root ?? 53), (tempo = spec.tempo ?? 120));
    while (root > 64) root -= 12;
    while (root < 48) root += 12;
    Object.assign(this, { root, scale, tempo, L: scale.length, beats: st.beats ?? 4 });
    this.spb = this.beats * 4;
    this.sd = 60 / tempo / 4;
    this.progA = R.pick(st.progA);
    this.progB = R.pick(st.progB);
    const ctx = E.ctx;
    // 트랙 출력 3갈래(마른 소리·홀 울림·딜레이): 같이 키우고 같이 줄인다
    this.out = [gainN(ctx, 0), gainN(ctx, 0), gainN(ctx, 0)];
    this.out[0].connect(E.musicIn);
    this.out[1].connect(E.verbIn);
    this.out[2].connect(E.delayIn);
    this.lvl = st.gain ?? 1;
    for (const o of this.out) {
      o.gain.setValueAtTime(0, t0);
      o.gain.linearRampToValueAtTime(this.lvl, t0 + (st.fadeIn ?? 1.2));
    }
    this.strip = {};
    for (const p of ["pad", "pad2", "bass", "arp", "lead", "lead2", "counter"]) if (st[p]) this.strip[p] = this.mkStrip(st[p]);
    this.strip.drums = this.mkStrip({ g: st.drumG ?? 1, verb: st.drumVerb ?? 0.1 });
    this.strip.perc = this.mkStrip({ g: st.drumG ?? 1, verb: 0.38 });
    const dens = st.lead ? st.lead.dens : 0.4, chords = (p) => Array.from({ length: 8 }, (_, b) => p[b % p.length]);
    this.themeA = genTheme(R, this.L, chords(this.progA), this.spb, dens);
    this.themeB = genTheme(R, this.L, chords(this.progB), this.spb, Math.min(0.85, dens * 1.15));
    this.plan = st.plan ?? DEFAULT_PLAN;
    this.secI = 0;
    this.sec = null;
    this.bar = 0;
    this.step = 0;
    this.t = t0 + 0.05;
    this.prevV = null;
    this.nSec = 0;
  }
  mkStrip(d) {
    const ctx = this.E.ctx, inp = gainN(ctx, d.g ?? 1);
    let n = inp;
    // 저음이 필요 없는 악기는 채널에서 한 번만 저역을 깎는다 (음마다 거르지 않게)
    if (HP_V.has(d.v)) {
      const h = filt(ctx, "highpass", d.v === "pad" || d.v === "choir" ? 130 : 110, 0.6);
      inp.connect(h);
      n = h;
    }
    if (d.pan) {
      const p = panN(ctx, d.pan);
      n.connect(p);
      n = p;
    }
    n.connect(this.out[0]);
    for (const [k, i] of [["verb", 1], ["delay", 2]])
      if (d[k]) {
        const s = gainN(ctx, d[k]);
        n.connect(s);
        s.connect(this.out[i]);
      }
    return inp;
  }
  // 음계 칸 → 반음 (으뜸음 기준)
  semis(i) {
    const L = this.L;
    return this.scale[((i % L) + L) % L] + 12 * Math.floor(i / L);
  }
  nearOct(p, c) {
    while (p > c + 5) p -= 12;
    while (p < c - 6) p += 12;
    return p;
  }
  // 화음 자리바꿈: 앞 화음에서 가장 적게 움직이는 배치
  voicing(deg, center, lush) {
    const pcs = [0, 2, 4, ...(lush ? [6] : [])].map((k) => (this.root + this.semis(deg + k)) % 12);
    let best = null, bs = 1e9;
    const rec = (i, acc) => {
      if (i === pcs.length) {
        const s = [...acc].sort((a, b) => a - b);
        if (s[s.length - 1] - s[0] > 16) return;
        let sc = 0;
        if (this.prevV && this.prevV.length === s.length) for (let k = 0; k < s.length; k++) sc += Math.abs(s[k] - this.prevV[k]);
        else sc = Math.abs(s.reduce((a, b) => a + b, 0) / s.length - center) * 2;
        sc += Math.abs(s.reduce((a, b) => a + b, 0) / s.length - center) * 0.3;
        if (sc < bs) ((bs = sc), (best = s));
        return;
      }
      for (let p = pcs[i] + 12 * Math.floor((center - 9) / 12); p <= center + 10; p += 12) if (p >= center - 9) rec(i + 1, [...acc, p]);
    };
    rec(0, []);
    best = best ?? pcs.map((p) => this.nearOct(p + 60, center));
    this.prevV = best;
    return best;
  }
  bassNote(deg, nxt, typ, oct) {
    const r = this.nearOct(this.root + this.semis(deg), oct);
    if (typ === "5") return r + this.semis(deg + 4) - this.semis(deg);
    if (typ === "3") return r + this.semis(deg + 2) - this.semis(deg);
    if (typ === "8") return r + 12;
    if (typ === "a") {
      const nr = this.nearOct(this.root + this.semis(nxt), oct);
      if (nxt === deg) return r + this.semis(deg + 4) - this.semis(deg);
      if (this.st.chromatic) return nr + (nr > r ? -1 : 1);
      return this.nearOct(this.root + this.semis(nxt + (nr > r ? -1 : 1)), nr);
    }
    return r;
  }
  ladder(deg, oct) {
    const b = this.nearOct(this.root + this.semis(deg), oct), i1 = this.semis(deg + 2) - this.semis(deg), i2 = this.semis(deg + 4) - this.semis(deg);
    return [b, b + i1, b + i2, b + 12, b + 12 + i1, b + 12 + i2, b + 24];
  }
  buildSection(name) {
    const st = this.st, R = this.R, spb = this.spb, sd = this.sd;
    const kind = name.replace(/\d$/, ""), second = /2$/.test(name);
    const bars = kind === "intro" ? st.introBars ?? 4 : 8;
    const energy = clamp({ intro: 1, A: 2, B: 3, break: 1 }[kind], st.minE ?? 0, st.maxE ?? 3);
    const prog = kind === "B" ? this.progB : this.progA;
    const chords = Array.from({ length: bars }, (_, b) => (kind === "break" ? prog[(b >> 1) % prog.length] : prog[b % prog.length]));
    const ev = new Map(), barDur = spb * sd;
    const add = (bar, step, e) => {
      const k = bar * spb + step;
      ev.has(k) ? ev.get(k).push(e) : ev.set(k, [e]);
    };
    // 화음 깔개
    for (const pk of ["pad", "pad2"]) {
      const d = st[pk];
      if (!d || (pk === "pad2" && kind === "intro")) continue;
      for (let b = 0; b < bars; ) {
        let e = b + 1;
        while (e < bars && (d.pedal || chords[e] === chords[b])) e++;
        const ms = d.v === "drone" ? [this.nearOct(this.root + (d.pedal ? 0 : this.semis(chords[b])), d.oct ?? 40)] : this.voicing(chords[b], d.oct ?? 60, st.lush);
        add(b, 0, { p: pk, ms, dur: (e - b) * barDur - 0.03, v: kind === "break" ? 0.85 : 1 });
        b = e;
      }
    }
    // 베이스
    if (st.bass && kind !== "intro") {
      const pat = BP[kind === "break" ? "ambient" : st.bass.pat];
      for (let b = 0; b < bars; b++)
        for (const [s, d, typ, vel] of pat) {
          if (s >= spb) continue;
          add(b, s, { p: "bass", m: this.bassNote(chords[b], chords[(b + 1) % bars], typ, st.bass.oct ?? 40), dur: Math.min(d, spb - s) * sd * 0.92, v: vel });
        }
    }
    // 펼침화음
    const apk = kind === "break" ? st.arp?.brk : st.arp?.pat;
    if (st.arp && apk) {
      const pat = AP[apk];
      for (let b = 0; b < bars; b++) {
        const lad = this.ladder(chords[b], st.arp.oct ?? 60), sc = kind === "intro" ? 0.8 : 1;
        if (pat.sparse) {
          for (let k = R.int(1, 3); k > 0; k--) add(b, R.int(0, spb / 2 - 1) * 2, { p: "arp", m: lad[R.int(0, 5)], dur: sd * 6, v: R.range(0.6, 0.95) * sc });
        } else if (pat.chord) {
          for (const [s, d] of pat.chord) s < spb && add(b, s, { p: "arp", ms: lad.slice(1, 4), dur: d * sd * 0.9, v: (s % 4 === 2 ? 0.85 : 0.7) * sc });
        } else
          for (let i = 0; i < pat.q.length; i++) {
            const s = i * pat.r;
            if (s >= spb) break;
            add(b, s, { p: "arp", m: lad[pat.q[i]], dur: pat.r * sd * (pat.stac ? 0.6 : 1.7), v: (s % 4 === 0 ? 1 : 0.72) * sc });
          }
      }
    }
    // 주선율 (두 번째로 나올 땐 다른 악기)
    if (st.lead && (kind === "A" || kind === "B")) {
      const th = kind === "A" ? this.themeA : this.themeB, ins = second && st.lead2 ? "lead2" : "lead", d = st[ins];
      const base = this.nearOct(this.root, d.oct ?? 72);
      let prev = null;
      for (const n of th) {
        const m = base + this.semis(n.d), at = n.bar * spb + n.s, leg = d.legato && prev && prev.end === at;
        add(n.bar, n.s, { p: ins, m, dur: n.dur * sd * (d.legato ? 0.97 : 0.85), v: n.v * (0.85 + 0.05 * energy), from: leg ? prev.m : null, grace: (d.orn ?? st.lead.orn) && n.dur >= 3 && R.chance(d.orn ?? st.lead.orn) ? base + this.semis(n.d + 1) : null });
        prev = { m, end: at + n.dur };
      }
    }
    // 쉼 구간: 주제 A의 긴 음만 희미하게
    if (kind === "break" && st.lead2 && R.chance(0.6)) {
      const d = st.lead2, base = this.nearOct(this.root, d.oct ?? 72);
      for (const n of this.themeA) if (n.dur >= 4 && n.bar % 2 === 0) add(n.bar, n.s, { p: "lead2", m: base + this.semis(n.d), dur: n.dur * sd, v: 0.6 });
    }
    // 대선율: 긴 음으로 화음을 따라 부드럽게
    if (st.counter && (kind === "B" || (kind === "A" && second))) {
      let prev = null;
      const c = st.counter.oct ?? 60;
      for (let b = 0; b < bars; b++) {
        const tones = [];
        for (const k of [0, 2, 4]) for (const o of [-12, 0, 12]) tones.push(this.nearOct(this.root + this.semis(chords[b] + k), c) + o);
        const cand = tones.filter((p) => p >= c - 7 && p <= c + 7);
        const m = prev == null ? cand.reduce((a, p) => (Math.abs(p - c) < Math.abs(a - c) ? p : a), cand[0]) : cand.reduce((a, p) => (Math.abs(p - prev) + (p === prev ? 0.5 : 0) < Math.abs(a - prev) + (a === prev ? 0.5 : 0) ? p : a), cand[0]);
        add(b, 0, { p: "counter", m, dur: barDur * 0.98, v: 0.8 });
        prev = m;
      }
    }
    // 타악
    const dt = st.drums && DT[st.drums][energy];
    if (dt)
      for (let b = 0; b < bars; b++) {
        const fill = b === bars - 1 && energy >= 2 && st.fill && kind !== "break" ? FILL[st.fill] : null;
        for (const [k, str] of Object.entries(dt)) {
          const n = Math.max(1, Math.round(str.length / spb));
          for (let s = 0; s < spb; s++) {
            if (fill && fill[k] && s >= spb / 2) continue;
            const v = VEL[str[((b % n) * spb + s) % str.length]];
            v && add(b, s, { p: "drum", k, v });
          }
        }
        if (fill)
          for (const [k, str] of Object.entries(fill))
            for (let s = spb / 2; s < spb; s++) {
              const v = VEL[str[s]];
              v && add(b, s, { p: "drum", k, v: v * (0.6 + (0.4 * (s - spb / 2)) / (spb / 2 - 1)) });
            }
      }
    if (st.crash && energy >= 2 && kind !== "intro" && kind !== "break") add(0, 0, { p: "drum", k: "cr", v: 0.8 });
    if (st.rev && (kind === "intro" || kind === "break" || energy >= 3)) add(bars - 1, spb / 2, { p: "fx", k: "rev", len: barDur / 2, v: st.maxE && st.maxE < 3 ? 0.4 : 0.7 });
    // 보스 등장: 첫 박에 팀파니·타이코·심벌 + 금관 화음, 둘째 마디는 팀파니 연타로 몰아간다
    if (kind === "intro" && st.introFx === "boss") {
      add(0, 0, { p: "drum", k: "cr", v: 1 });
      add(0, 0, { p: "drum", k: "tk", v: 1 });
      add(0, 0, { p: "drum", k: "tim", v: 1 });
      add(0, 0, { p: "lead", ms: this.voicing(chords[0], 62), dur: barDur * 0.6, v: 1 });
      for (let s = 0; s < spb; s += 1) add(bars - 1, s, { p: "drum", k: "tim", v: 0.35 + (0.6 * s) / spb });
    }
    this.nSec++;
    return { name, kind, bars, energy, ev };
  }
  fire(e, t) {
    const E = this.E, st = this.st;
    if (E.mute && (E.mute.has(e.p) || (e.p === "drum" && E.mute.has("d_" + e.k)))) return;
    if (e.p === "drum") return void this.drum(e.k, t, e.v);
    if (e.p === "fx") return void V.DR.rev(E, this.strip.perc, t + e.len, e.len, e.v);
    const d = st[e.p], fn = d && V[d.v], out = this.strip[e.p];
    if (!fn || !out) return;
    const o = d.o ?? {}, vv = e.v * (0.9 + 0.2 * this.R.f());
    if (e.ms) {
      if (POLY.has(d.v)) fn(E, out, t, e.ms, e.dur, vv, o);
      else e.ms.forEach((m, i) => fn(E, out, t + i * 0.012, m, e.dur, vv * 0.8, o));
      return;
    }
    if (POLY.has(d.v)) return void fn(E, out, t, [e.m], e.dur, vv, o);
    if (e.grace != null) fn(E, out, t - 0.06, e.grace, 0.05, vv * 0.55, o);
    fn(E, out, t, e.m, e.dur, vv, e.from != null ? { ...o, from: e.from } : o);
  }
  drum(k, t, v) {
    const E = this.E, D = V.DR, s = this.strip.drums, p = this.strip.perc;
    if (k === "t1") return D.tom(E, s, t, v, 210);
    if (k === "t2") return D.tom(E, s, t, v, 118);
    if (k === "tim") return D.timp(E, p, t, v, this.nearOct(this.root, 40));
    const fn = { k: D.kick, s: D.snare, h: D.hat, oh: D.ohat, sh: D.shaker, tk: D.taiko, rim: D.rim, clap: D.clap, cr: D.crash, dum: D.dum, tek: D.tek, riq: D.riq, anv: D.anvil, clk: D.clink }[k];
    fn && fn(E, k === "tk" || k === "cr" || k === "anv" || k === "clk" ? p : s, t, v);
  }
  advance() {
    this.t += this.sd;
    if (++this.step >= this.spb) {
      this.step = 0;
      if (++this.bar >= this.sec.bars) {
        this.bar = 0;
        this.sec = null;
        this.secI = this.secI + 1 >= this.plan.length ? this.st.loopTo ?? 1 : this.secI + 1;
      }
    }
  }
  // tEnd 전까지 음을 예약. 화면 스레드가 멈췄다 깨어나 늦었으면 소리 없이 따라잡는다
  scheduleUntil(tEnd, now = 0) {
    let guard = 0;
    while (this.t < now - 0.05 && guard++ < 4000) {
      if (!this.sec) this.sec = this.buildSection(this.plan[this.secI]);
      this.advance();
    }
    while (this.t < tEnd && guard++ < 8000) {
      if (!this.sec) this.sec = this.buildSection(this.plan[this.secI]);
      const evs = this.sec.ev.get(this.bar * this.spb + this.step);
      if (evs) {
        const sw = this.st.swing && this.step % 4 === 2 ? this.st.swing * 2 * this.sd : 0;
        for (const e of evs) this.fire(e, Math.max(now, this.t + sw + (this.R.f() - 0.5) * (e.p === "drum" ? 0.004 : 0.012)));
      }
      this.advance();
    }
  }
  fadeOut(t, len) {
    if (this.stopAt) return;
    for (const o of this.out) {
      const v = o.gain.value;
      o.gain.cancelScheduledValues(t);
      o.gain.setValueAtTime(v, t);
      o.gain.linearRampToValueAtTime(0, t + len);
    }
    this.stopAt = t + len;
    this.doneAt = t + len + 4;
  }
  dispose() {
    for (const o of this.out)
      try {
        o.disconnect();
      } catch (e) {}
  }
  // 실험실 표시용
  where() {
    return { style: this.sk, section: this.sec ? this.sec.name : "-", bar: this.bar + 1, bars: this.sec ? this.sec.bars : 0, tempo: this.tempo };
  }
}
