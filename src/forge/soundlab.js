// 사운드 실험실: 배경 음악·효과음·환경음을 눌러서 들어 보는 페이지 (+ 측정 도구가 쓰는 오프라인 렌더)
import { AudioEngine, renderOffline } from "./audio.js";
import { STYLES, styleKey } from "./audmusic.js";
import { SFX_NAMES } from "./audsfx.js";
import { AMB_NAMES } from "./audamb.js";
import { FR_REGIONS } from "./world.js";

const STYLE_KO = { folk: "민속 모험", forest: "밤숲 왈츠 (3박자)", cave: "동굴 울림", swamp: "늪", march: "행진", snow: "서리", desert: "사막", storm: "폭풍", sacred: "성소", sky: "하늘", abyss: "심연", epic: "결전", boss: "보스", hub: "거점", result: "결과", rift: "변이" };
const SFX_KO = { swing: "휘두르기", swingHeavy: "묵직한 휘두르기", punch: "주먹", hit: "타격", crit: "치명타", block: "막기", thud: "쿵", playerHurt: "피격", jump: "점프", land: "착지", dash: "대시", charge: "기 모으기", coin: "동전", coinBig: "큰 돈", buy: "구매", chest: "상자", enemyDie: "적 처치", bossRoar: "보스 포효", warn: "경고", explosion: "폭발", shoot: "발사", bow: "활", magic: "마법", ice: "얼음", lightning: "번개", heal: "회복", buff: "강화", click: "클릭", open: "창 열기", close: "창 닫기", error: "실패", levelup: "레벨 업", record: "보스 격파", death: "죽음", portal: "포털" };
const AMB_KO = { village: "재의 마을", forest: "밤숲", cave: "동굴", swamp: "늪", fire: "요새", snow: "설원", desert: "사막", storm: "뇌운 첨탑", sanctum: "성소", sky: "하늘", abyss: "심연", forge: "용암 핵", hub: "거점", rift: "변이의 길" };

// 게임과 같은 곡 키·설정
const TRACKS = [
  { key: "hub", spec: { root: 62, scale: [0, 2, 4, 5, 7, 9, 11], tempo: 92, wave: "triangle", mood: 9, hub: true }, name: "거점", sub: "대장간 마을" },
  ...FR_REGIONS.map((r) => ({ key: `region_${r.id}`, spec: { ...r.music, region: r.id }, name: r.name, sub: r.id, boss: { key: `boss_${r.boss}`, spec: { ...r.music, tempo: r.music.tempo + 24, boss: true, wave: "sawtooth", seed: 7, region: r.id } } })),
  { key: "region_endless_0", spec: { root: 53, scale: [0, 2, 4, 6, 8, 10], tempo: 118, wave: "square", mood: 8 }, name: "변이의 길", sub: "끝없는 길" },
  { key: "result", spec: { root: 57, scale: [0, 2, 3, 5, 7, 8, 10], tempo: 70, wave: "triangle", mood: 10, hub: true }, name: "결과 화면", sub: "" },
];

let E = null, an = null, reroll = 0;
const $ = (id) => document.getElementById(id);
function eng() {
  if (!E) {
    E = new AudioEngine();
    E.init();
    E.setVolumes(+$("vm").value, +$("vs").value);
    an = E.ctx.createAnalyser();
    an.fftSize = 2048;
    E.limiter.connect(an);
    requestAnimationFrame(draw);
  }
  E.resume();
  return E;
}
function mark(btn) {
  for (const b of document.querySelectorAll("#music button.on")) b.classList.remove("on");
  btn && btn.classList.add("on");
}
function playTrack(key, spec, btn) {
  const e = eng();
  e.currentKey = "";
  e.playMusic(key, spec);
  mark(btn);
}
function build() {
  const M = $("music");
  for (const T of TRACKS) {
    const c = document.createElement("div");
    c.className = "card";
    const sk = styleKey(T.key, T.spec);
    c.innerHTML = `<div class="t">${T.name}</div><div class="s">${STYLE_KO[sk] ?? sk} · ${T.sub}</div>`;
    const row = document.createElement("div");
    row.className = "row";
    const b1 = document.createElement("button");
    b1.textContent = "▶ 곡";
    b1.onclick = () => playTrack(T.key, T.spec, b1);
    row.append(b1);
    if (T.key.startsWith("region_")) {
      const b2 = document.createElement("button");
      b2.textContent = "다른 선율";
      b2.onclick = () => playTrack(`${T.key}#${++reroll}`, T.spec, b2);
      row.append(b2);
    }
    if (T.boss) {
      const b3 = document.createElement("button");
      b3.textContent = "보스";
      b3.onclick = () => (eng().play("bossRoar"), playTrack(T.boss.key, T.boss.spec, b3));
      row.append(b3);
    }
    c.append(row);
    M.append(c);
  }
  const S = $("sfx");
  for (const n of SFX_NAMES) {
    const b = document.createElement("button");
    b.textContent = SFX_KO[n] ?? n;
    b.title = n;
    b.onclick = () => eng().play(n, 1);
    S.append(b);
  }
  const A = $("amb");
  for (const n of [...AMB_NAMES, null]) {
    const b = document.createElement("button");
    b.textContent = n ? AMB_KO[n] ?? n : "환경음 끄기";
    b.onclick = () => {
      for (const x of A.querySelectorAll("button.on")) x.classList.remove("on");
      n && b.classList.add("on");
      eng().setAmbience(n);
    };
    A.append(b);
  }
  $("vm").oninput = $("vs").oninput = () => E && E.setVolumes(+$("vm").value, +$("vs").value);
  $("sp").oninput = () => eng().setSpace(+$("sp").value);
  $("stop").onclick = () => {
    if (!E) return;
    E.stopMusic();
    E.setAmbience(null);
    mark(null);
  };
}
function draw() {
  requestAnimationFrame(draw);
  const cv = $("meter"), g = cv.getContext("2d"), W = cv.width, H = cv.height;
  g.fillStyle = "#0b0a10";
  g.fillRect(0, 0, W, H);
  if (!an) return;
  const fd = new Uint8Array(an.frequencyBinCount);
  an.getByteFrequencyData(fd);
  const n = 64;
  for (let i = 0; i < n; i++) {
    const f0 = 30 * Math.pow(16000 / 30, i / n), f1 = 30 * Math.pow(16000 / 30, (i + 1) / n), b0 = Math.floor((f0 / (E.ctx.sampleRate / 2)) * fd.length), b1 = Math.max(b0 + 1, Math.floor((f1 / (E.ctx.sampleRate / 2)) * fd.length));
    let m = 0;
    for (let k = b0; k < b1 && k < fd.length; k++) m = Math.max(m, fd[k]);
    const h = (m / 255) * (H - 4);
    g.fillStyle = `hsl(${40 + i * 3}, 70%, ${45 + (m / 255) * 25}%)`;
    g.fillRect((i * W) / n + 1, H - h - 2, W / n - 2, h);
  }
  const w = E.track ? E.track.where() : null;
  $("now").innerHTML = w ? `곡 성격 <b>${STYLE_KO[w.style] ?? w.style}</b> · 구간 <b>${w.section}</b> ${w.bar}/${w.bars}마디 · 빠르기 <b>${w.tempo}</b> · 압축 ${E.limiter.reduction.toFixed(1)}dB` : "음악 없음";
}
build();

// ── 측정 도구용 (오프라인 렌더 → 크기·주파수 분포·스펙트로그램 그림) ──
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) ([re[i], re[j]] = [re[j], re[i]]), ([im[i], im[j]] = [im[j], im[i]]);
  }
  for (let len = 2; len <= n; len <<= 1) {
    const a = (-2 * Math.PI) / len, wr = Math.cos(a), wi = Math.sin(a);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const ur = re[i + k], ui = im[i + k], vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci, vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
        re[i + k] = ur + vr;
        im[i + k] = ui + vi;
        re[i + k + len / 2] = ur - vr;
        im[i + k + len / 2] = ui - vi;
        const nr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = nr;
      }
    }
  }
}
function analyze(buf, marks = [], label = "") {
  const L = buf.getChannelData(0), R = buf.getChannelData(1), sr = buf.sampleRate, n = L.length;
  let pk = 0, ss = 0;
  const mono = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const v = (L[i] + R[i]) / 2;
    mono[i] = v;
    pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i]));
    ss += (L[i] * L[i] + R[i] * R[i]) / 2;
  }
  // 1초 창 RMS 최댓값
  let st = 0;
  for (let i = 0; i + sr <= n; i += sr / 2) {
    let s = 0;
    for (let k = i; k < i + sr; k++) s += mono[k] * mono[k];
    st = Math.max(st, Math.sqrt(s / sr));
  }
  const N = 2048, hop = Math.max(512, Math.floor(n / 1100 / 512) * 512 || 512), frames = Math.floor((n - N) / hop);
  const H = 220, W = frames, cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H + 40;
  const g = cv.getContext("2d"), img = g.createImageData(W, H);
  const band = { sub: 0, low: 0, lowmid: 0, mid: 0, high: 0, air: 0 }, edges = [[20, 60, "sub"], [60, 250, "low"], [250, 1000, "lowmid"], [1000, 4000, "mid"], [4000, 10000, "high"], [10000, 20000, "air"]];
  const win = new Float32Array(N).map((_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1)));
  const re = new Float32Array(N), im = new Float32Array(N);
  for (let f = 0; f < frames; f++) {
    for (let i = 0; i < N; i++) ((re[i] = mono[f * hop + i] * win[i]), (im[i] = 0));
    fft(re, im);
    for (let b = 1; b < N / 2; b++) {
      const p = (re[b] * re[b] + im[b] * im[b]) / (N * N), hz = (b * sr) / N;
      for (const [a, z, k] of edges) if (hz >= a && hz < z) band[k] += p;
    }
    for (let y = 0; y < H; y++) {
      const hz = 30 * Math.pow(16000 / 30, 1 - y / H), b = Math.min(N / 2 - 1, Math.round((hz * N) / sr));
      const p = (re[b] * re[b] + im[b] * im[b]) / (N * N), db = 10 * Math.log10(p + 1e-14), u = Math.max(0, Math.min(1, (db + 100) / 80));
      const o = (y * W + f) * 4;
      img.data[o] = Math.round(255 * Math.min(1, u * 1.6));
      img.data[o + 1] = Math.round(255 * Math.max(0, u * 1.4 - 0.45));
      img.data[o + 2] = Math.round(255 * (u < 0.5 ? u * 1.2 : Math.max(0, 1.4 - u * 1.2)));
      img.data[o + 3] = 255;
    }
  }
  g.fillStyle = "#000";
  g.fillRect(0, 0, W, H + 40);
  g.putImageData(img, 0, 40);
  // 파형 윤곽
  g.fillStyle = "#7fdc8a";
  for (let x = 0; x < W; x++) {
    let m = 0;
    for (let i = x * hop; i < Math.min(n, (x + 1) * hop); i++) m = Math.max(m, Math.abs(mono[i]));
    g.fillRect(x, 20 - m * 20, 1, Math.max(1, m * 40));
  }
  g.font = "11px sans-serif";
  for (const [t, name] of marks) {
    const x = Math.round((t * sr) / hop);
    g.fillStyle = "#e8c46a";
    g.fillRect(x, 0, 1, H + 40);
    g.fillText(name, x + 2, 50);
  }
  if (label) ((g.fillStyle = "#fff"), g.fillText(label, 4, 12));
  const tot = Object.values(band).reduce((a, b) => a + b, 0) || 1;
  const db = (v) => +(20 * Math.log10(v + 1e-9)).toFixed(1);
  return { peakDb: db(pk), rmsDb: db(Math.sqrt(ss / n)), stMaxDb: db(st), bands: Object.fromEntries(Object.entries(band).map(([k, v]) => [k, +((100 * v) / tot).toFixed(1)])), png: cv.toDataURL("image/png") };
}
window.__lab = {
  tracks: TRACKS.flatMap((T) => [{ key: T.key, spec: T.spec, name: T.name }, ...(T.boss ? [{ key: T.boss.key, spec: T.boss.spec, name: T.name + " 보스" }] : [])]),
  async measure(key, spec, seconds = 40) {
    const { buf, info } = await renderOffline({ seconds, music: key, spec });
    return { ...analyze(buf, info.sections, key), info };
  },
  async sfx(names = SFX_NAMES, each = 1.6) {
    const list = names.map((name, i) => ({ name, t: 0.1 + i * each }));
    const { buf } = await renderOffline({ seconds: 0.4 + names.length * each, sfx: list });
    const A = analyze(buf, list.map((s) => [s.t, s.name]), "sfx");
    // 소리마다 최대 크기
    const L = buf.getChannelData(0), sr = buf.sampleRate, per = {};
    for (const s of list) {
      let pk = 0, ss = 0;
      const a = Math.floor(s.t * sr), b = Math.min(L.length, Math.floor((s.t + each) * sr));
      for (let i = a; i < b; i++) ((pk = Math.max(pk, Math.abs(L[i]))), (ss += L[i] * L[i]));
      per[s.name] = [+(20 * Math.log10(pk + 1e-9)).toFixed(1), +(10 * Math.log10(ss / (b - a) + 1e-12)).toFixed(1)];
    }
    return { ...A, per };
  },
  async amb(type, seconds = 20) {
    const { buf } = await renderOffline({ seconds, amb: type });
    return analyze(buf, [], type);
  },
};
