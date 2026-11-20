// 고품질 절차 오디오 엔진 (음원 파일 없이 WebAudio로 합성)
//   음악: 트랙(작곡기) → 홀 잔향 + 핑퐁 딜레이 → 덕킹(큰 효과음 때 살짝 줄임) → 글루 압축 → 음악 크기
//   효과음: 여러 겹 합성 → 룸 잔향(동굴이면 더 울림) → 효과음 크기
//   환경음: 지역마다 바람·새·물방울… (동굴에선 동굴 울림으로 바뀜) → 효과음 크기를 따른다
//   모두 → 마스터 → 리미터(찢어짐 방지)
//   옛 Dn과 같은 API: init · resume · setVolumes · play · playMusic · stopMusic   (+ setSpace)
import { mulberry, makeWaves, makeNoise, makeIR, driveCurve, gainN, filt } from "./audcore.js";
import { Track, styleKey, STYLES } from "./audmusic.js";
import { SFX, GAP, LVL } from "./audsfx.js";
import { Ambience } from "./audamb.js";

const MUSIC_K = 0.5, SFX_K = 1.0, AMB_K = 1.5, LOOK = 0.3;

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.sfxVol = 0.7;
    this.musicVol = 0.5;
    this.last = {};
    this.tracks = [];
    this.track = null;
    this.currentKey = "";
    this.timer = null;
    this.amb = null;
    this.cave = null;
    this.space = 0;
    this.rnd = mulberry(20261120);
  }
  init() {
    if (this.ctx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.attach(new AC({ latencyHint: "interactive" }));
      this.timer = window.setInterval(() => this.tick(), 25);
    } catch (e) {
      this.ctx = null;
    }
  }
  // 소리 그래프 만들기 (실시간·오프라인 공용)
  attach(ctx) {
    this.ctx = ctx;
    this.waves = makeWaves(ctx);
    this.noiseM = makeNoise(ctx, 2, 1);
    this.noiseS = makeNoise(ctx, 4, 2);
    this.brownS = makeNoise(ctx, 5, 2, "brown");
    this.pinkS = makeNoise(ctx, 4, 2, "pink");
    const g = (v) => gainN(ctx, v);
    // 마스터 → 리미터
    this.master = g(0.9);
    const lim = ctx.createDynamicsCompressor();
    lim.threshold.value = -4;
    lim.knee.value = 0;
    lim.ratio.value = 20;
    lim.attack.value = 0.002;
    lim.release.value = 0.12;
    this.master.connect(lim);
    lim.connect(ctx.destination);
    this.limiter = lim;
    // 음악 버스
    this.musicBus = g(this.musicVol * MUSIC_K);
    this.musicBus.connect(this.master);
    const glue = ctx.createDynamicsCompressor();
    glue.threshold.value = -18;
    glue.knee.value = 8;
    glue.ratio.value = 2.5;
    glue.attack.value = 0.015;
    glue.release.value = 0.25;
    glue.connect(this.musicBus);
    this.duckG = g(1);
    this.duckG.connect(glue);
    this.musicIn = g(1);
    // 마스터링 EQ: 저역 정리 · 존재감(3kHz) · 공기감(7kHz)
    const lowcut = filt(ctx, "highpass", 32, 0.7), ls = filt(ctx, "lowshelf", 160, 0.7), pk = filt(ctx, "peaking", 2800, 0.8), hs = filt(ctx, "highshelf", 6500, 0.7);
    ls.gain.value = -2;
    pk.gain.value = -1.5;
    hs.gain.value = -3;
    this.musicIn.connect(lowcut);
    lowcut.connect(ls);
    ls.connect(pk);
    pk.connect(hs);
    hs.connect(this.duckG);
    // 잔향 하나를 음악·효과음이 같이 쓴다 (잔향은 계산이 무거워서): 보내는 쪽에서 각자 크기를 곱하고, 모노로 접어 한 번만 컨볼루션
    //   → 오른쪽만 12ms 늦춰 좌우로 벌린다
    this.verbIn = g(1);
    this.verbMV = g(this.musicVol * MUSIC_K);
    this.duckV = g(1);
    this.verbIn.connect(this.duckV);
    this.duckV.connect(this.verbMV);
    this.sfxSend = g(1);
    this.verbSV = g(this.sfxVol * SFX_K);
    this.sfxSend.connect(this.verbSV);
    const vsum = g(1), vhp = filt(ctx, "highpass", 170, 0.7), conv = ctx.createConvolver();
    for (const n of [vsum, vhp, conv]) ((n.channelCount = 1), (n.channelCountMode = "explicit"));
    conv.buffer = makeIR(ctx, 1.9, { t60: 1.7, pre: 0.02, bright: 0.22, dark: 0.86, ch: 1 });
    this.verbMV.connect(vsum);
    this.verbSV.connect(vsum);
    vsum.connect(vhp);
    vhp.connect(conv);
    const vR = ctx.createDelay(0.05), vm = ctx.createChannelMerger(2), vret = g(0.6);
    vR.delayTime.value = 0.012;
    conv.connect(vm, 0, 0);
    conv.connect(vR);
    vR.connect(vm, 0, 1);
    vm.connect(vret);
    vret.connect(this.master);
    // 핑퐁 딜레이 (점8분음표)
    this.delayIn = g(1);
    const dl = ctx.createDelay(2), dr = ctx.createDelay(2), fb = g(0.36), dlp = filt(ctx, "lowpass", 3200, 0.5), mg = ctx.createChannelMerger(2), wet = g(0.45), dv = g(0.3);
    this.delayIn.connect(dl);
    dl.connect(dr);
    dl.connect(mg, 0, 0);
    dr.connect(mg, 0, 1);
    dr.connect(dlp);
    dlp.connect(fb);
    fb.connect(dl);
    mg.connect(wet);
    wet.connect(this.duckG);
    wet.connect(dv);
    dv.connect(this.verbIn);
    this.dl = dl;
    this.dr = dr;
    this.setDelay(100);
    // 효과음 버스 + 룸 잔향 + 찌그러짐
    this.sfxBus = g(this.sfxVol * SFX_K);
    this.sfxBus.connect(this.master);
    this.sfxIn = g(1);
    this.sfxIn.connect(this.sfxBus);
    this.drive = ctx.createWaveShaper();
    this.drive.curve = driveCurve(2.4);
    this.drive.oversample = "2x";
    const dg = g(0.7);
    this.drive.connect(dg);
    dg.connect(this.sfxIn);
    // 환경음 버스
    this.ambBus = g(this.sfxVol * AMB_K);
    this.ambBus.connect(this.master);
  }
  noiseSrc(t, end, buf = this.noiseM) {
    const s = this.ctx.createBufferSource();
    s.buffer = buf;
    s.loop = true;
    s.start(t, this.rnd() * (buf.duration - 0.2));
    s.stop(end);
    return s;
  }
  setDelay(tempo) {
    const d = Math.min(1.2, (0.75 * 60) / tempo), t = this.ctx.currentTime;
    this.dl.delayTime.setTargetAtTime(d, t, 0.05);
    this.dr.delayTime.setTargetAtTime(d, t, 0.05);
  }
  resume() {
    this.init();
    this.ctx && this.ctx.state === "suspended" && this.ctx.resume();
  }
  setVolumes(m, s) {
    this.musicVol = m;
    this.sfxVol = s;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.musicBus.gain.setTargetAtTime(m * MUSIC_K, t, 0.05);
    this.sfxBus.gain.setTargetAtTime(s * SFX_K, t, 0.05);
    this.verbMV.gain.setTargetAtTime(m * MUSIC_K, t, 0.05);
    this.verbSV.gain.setTargetAtTime(s * SFX_K, t, 0.05);
    this.ambBus.gain.setTargetAtTime(s * AMB_K, t, 0.05);
  }
  // 큰 효과음 때 음악을 잠깐 줄인다
  duck(amt, t, len) {
    for (const p of [this.duckG.gain, this.duckV.gain]) {
      p.cancelScheduledValues(t);
      p.setTargetAtTime(1 - amt, t, 0.02);
      p.setTargetAtTime(1, t + len, 0.35);
    }
  }
  play(name, amt = 1, at) {
    if (!this.ctx || this.sfxVol <= 0) return;
    const fn = SFX[name];
    if (!fn) return;
    const now = this.ctx.currentTime;
    if (at == null) {
      if (this.last[name] && now - this.last[name] < (GAP[name] ?? 0.025)) return;
      this.last[name] = now;
    }
    try {
      fn(this, at ?? now + 0.004, Math.min(1.5, amt ?? 1) * (LVL[name] ?? 1), 0.94 + this.rnd() * 0.12);
    } catch (e) {}
  }
  playMusic(key, spec) {
    if (!this.ctx || this.currentKey === key) return;
    this.currentKey = key;
    const now = this.ctx.currentTime, sk = styleKey(key, spec || {});
    for (const tr of this.tracks) tr.fadeOut(now, sk === "boss" ? 0.5 : 1.8);
    const tr = new Track(this, key, spec || {}, now + (sk === "boss" ? 0.02 : 0.25));
    this.tracks.push(tr);
    this.track = tr;
    this.setDelay(tr.tempo);
    const amb = STYLES[sk].amb;
    amb !== "keep" && this.setAmbience(amb ?? null);
    this.tick();
  }
  stopMusic() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (const tr of this.tracks) tr.fadeOut(now, 0.5);
    this.track = null;
    this.currentKey = "";
  }
  setAmbience(type) {
    if (!this.ctx || (this.amb ? this.amb.type : null) === type) return;
    const now = this.ctx.currentTime;
    this.amb && this.amb.stop(now);
    this.oldAmb = this.amb;
    this.amb = type ? new Ambience(this, type, now + 0.05, 1 - 0.85 * this.space) : null;
  }
  // 공간: 0 = 트인 곳, 1 = 땅속·굴 안 (효과음이 더 울리고, 환경음이 동굴 소리로 바뀐다)
  setSpace(v) {
    if (!this.ctx) return;
    v = Math.max(0, Math.min(1, v));
    if (Math.abs(v - this.space) < 0.05) return;
    this.space = v;
    const t = this.ctx.currentTime;
    this.sfxSend.gain.setTargetAtTime(1 + 2.2 * v, t, 0.4);
    const caveAmb = this.amb && this.amb.type === "cave";
    if (!caveAmb) {
      this.amb && this.amb.setLevel(1 - 0.85 * v, t);
      if (v > 0.05 && !this.cave) this.cave = new Ambience(this, "cave", t + 0.05, 0);
      this.cave && this.cave.setLevel(v * 0.9, t);
    }
  }
  tick() {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== "running") return;
    const now = ctx.currentTime, t1 = now + LOOK;
    this.tracks = this.tracks.filter((tr) => {
      if (tr.doneAt && now > tr.doneAt) return void tr.dispose();
      tr.scheduleUntil(Math.min(t1, tr.stopAt ?? 1e9), now);
      return true;
    });
    this.amb && this.amb.scheduleUntil(t1, now);
    this.cave && this.cave.scheduleUntil(t1, now);
    if (this.cave && this.space < 0.05 && !this.cave.dead) {
      this.cave.stop(now);
      this.caveOld = this.cave;
      this.cave = null;
    }
  }
}

// ── 오프라인 렌더 (실험실·측정 도구용): 음악/효과음/환경음을 seconds초 버퍼로 ──
export async function renderOffline({ seconds = 20, sampleRate = 44100, music = null, spec = {}, sfx = [], amb = null, space = 0, musicVol = 0.5, sfxVol = 0.7, mute = null }) {
  const ctx = new OfflineAudioContext(2, Math.ceil(seconds * sampleRate), sampleRate);
  const E = new AudioEngine();
  E.musicVol = musicVol;
  E.sfxVol = sfxVol;
  E.attach(ctx);
  E.mute = mute ? new Set(mute) : null;
  // 게임처럼 조금씩 앞서 예약한다 (0.25초마다 멈춰서 LOOK만큼): 한꺼번에 예약하면 노드가 너무 많이 쌓인다
  let info = null, tr = null, a = null;
  const secs = [];
  if (music) {
    tr = new Track(E, music, spec, 0.05);
    E.setDelay(tr.tempo);
    info = { style: tr.sk, tempo: tr.tempo, root: tr.root, sections: secs, progA: tr.progA, progB: tr.progB };
  }
  if (amb) a = new Ambience(E, amb, 0, 1);
  if (space) E.sfxSend.gain.value = 1 + 2.2 * space;
  const pend = [...sfx].sort((x, y) => x.t - y.t);
  let last = null;
  const step = (t) => {
    if (tr) {
      tr.scheduleUntil(Math.min(seconds, t + LOOK), t);
      const w = tr.sec ? tr.sec.name : null;
      if (w && w !== last) ((last = w), secs.push([+t.toFixed(2), w]));
    }
    a && a.scheduleUntil(t + LOOK, t);
    while (pend.length && pend[0].t < t + LOOK) {
      const q = pend.shift();
      E.play(q.name, q.amt ?? 1, q.t);
    }
  };
  step(0);
  for (let t = 0.25; t < seconds - 0.05; t += 0.25)
    ctx.suspend(t).then(() => {
      step(t);
      ctx.resume();
    });
  const buf = await ctx.startRendering();
  return { buf, info };
}
