// 환경음: 지역마다 바람·불꽃 튀는 소리·새·풀벌레·개구리·물방울·먼 천둥·종소리·속삭임…
//   계속 깔리는 층(바람·웅웅거림)은 잡음을 거르고, 가끔 나는 소리는 무작위 시각에 예약한다.
import { gainN, filt, panN, mulberry } from "./audcore.js";

export const AMB = {
  village: { wind: [0.09, 220, 650], crackle: [2, 0.02], birds: [0.05] },
  forest: { wind: [0.05, 300, 900], crickets: [1.4], owl: [0.04] },
  cave: { rumble: [0.1], drips: [0.7], clink: [0.05] },
  swamp: { wind: [0.05, 200, 500], frogs: [0.6], bubbles: [0.5], crickets: [0.5] },
  fire: { crackle: [9, 0.04], roar: [0.06], clank: [0.06] },
  snow: { wind: [0.11, 350, 1500], whistle: [0.02], sparkle: [0.12] },
  desert: { wind: [0.07, 900, 3200, "bandpass", "white"], wind2: [0.05, 200, 520] },
  storm: { wind: [0.09, 300, 1200], thunder: [0.035] },
  sanctum: { air: [0.012], chimes: [0.12] },
  sky: { wind: [0.11, 450, 1800], whistle: [0.022], birds: [0.04] },
  abyss: { drone: [0.022], whisper: [0.025], rumble: [0.04] },
  forge: { crackle: [11, 0.04], roar: [0.07], rumble: [0.05], clank: [0.08] },
  hub: { crackle: [5, 0.04], roar: [0.035], wind: [0.035, 200, 500] },
  rift: { wind: [0.05, 300, 800], whisper: [0.022], drone: [0.01] },
};
export const AMB_NAMES = Object.keys(AMB);
const PENTA = [0, 2, 4, 7, 9];

export class Ambience {
  constructor(E, type, t0, lvl = 1) {
    this.E = E;
    this.type = type;
    this.t0 = t0;
    const ctx = E.ctx, d = (this.def = AMB[type] ?? {});
    this.R = mulberry((t0 * 1000) ^ type.length);
    this.out = gainN(ctx, 0);
    this.out.connect(E.ambBus);
    this.room = gainN(ctx, type === "cave" ? 0.9 : 0.25);
    this.out.connect(this.room);
    this.room.connect(E.sfxSend);
    this.out.gain.setValueAtTime(0, t0);
    this.out.gain.linearRampToValueAtTime(lvl, t0 + 2.5);
    this.srcs = [];
    this.next = {};
    this.lv = {};
    const nx = (k, dt = 0.3) => (this.next[k] = t0 + dt + this.R() * 1.5);
    for (const [k, w] of [["wind", d.wind], ["wind2", d.wind2]])
      if (w) {
        const [lvl, lo, hi, type = "lowpass", src = "brown"] = w;
        const s = this.loop(src === "white" ? E.noiseS : E.brownS), f = filt(ctx, type, (lo + hi) / 2, type === "bandpass" ? 0.6 : 0.5), g = gainN(ctx, lvl * 0.7);
        s.connect(f);
        f.connect(g);
        g.connect(this.out);
        this.lv[k] = { f, g, lvl, lo, hi };
        nx(k + "_g", 0);
      }
    if (d.whistle) {
      const s = this.loop(E.noiseS), f = filt(ctx, "bandpass", 800, 14), g = gainN(ctx, 0);
      s.connect(f);
      f.connect(g);
      g.connect(this.out);
      this.lv.whistle = { f, g, lvl: d.whistle[0] * 3 };
      nx("whistle_g", 0);
    }
    if (d.rumble) this.bed(E.brownS, "lowpass", 110, 0.7, d.rumble[0] * 1.4);
    if (d.roar) this.bed(E.pinkS, "lowpass", 340, 0.6, d.roar[0] * 1.6);
    if (d.air) {
      for (const [f, p] of [[1318.5, -0.4], [1975.5, 0.4], [2637, 0]]) {
        const o = ctx.createOscillator(), g = gainN(ctx, d.air[0]), pn = panN(ctx, p), l = ctx.createOscillator(), lg = gainN(ctx, d.air[0] * 0.8);
        o.frequency.value = f * (1 + (this.R() - 0.5) * 0.003);
        l.frequency.value = 0.07 + this.R() * 0.08;
        l.connect(lg);
        lg.connect(g.gain);
        o.connect(g);
        g.connect(pn);
        pn.connect(this.out);
        o.start(t0);
        l.start(t0);
        this.srcs.push(o, l);
      }
      this.bed(E.noiseS, "highpass", 4500, 0.7, d.air[0] * 0.6);
    }
    if (d.drone) {
      for (const [f, a] of [[41.2, 1], [41.9, 1], [82.4, 0.5], [123.6, 0.18]]) {
        const o = ctx.createOscillator(), g = gainN(ctx, d.drone[0] * a);
        o.frequency.value = f;
        o.connect(g);
        g.connect(this.out);
        o.start(t0);
        this.srcs.push(o);
      }
    }
    if (d.whisper) {
      const s = this.loop(E.noiseS), g = gainN(ctx, 0), pn = panN(ctx, 0);
      const f1 = filt(ctx, "bandpass", 800, 6), f2 = filt(ctx, "bandpass", 2000, 7);
      s.connect(f1);
      s.connect(f2);
      f1.connect(g);
      f2.connect(g);
      g.connect(pn);
      pn.connect(this.out);
      this.lv.whisper = { f1, f2, g, pn, lvl: d.whisper[0] * 4 };
      nx("whisper_g", 0);
    }
    for (const k of ["crackle", "birds", "crickets", "owl", "frogs", "bubbles", "drips", "thunder", "chimes", "sparkle", "clank", "clink"]) d[k] && nx(k, 0.5 + this.R() * 2);
  }
  loop(buf) {
    const s = this.E.ctx.createBufferSource();
    s.buffer = buf;
    s.loop = true;
    s.start(this.t0, this.R() * (buf.duration - 0.5));
    this.srcs.push(s);
    return s;
  }
  bed(buf, type, f, q, lvl) {
    const s = this.loop(buf), b = filt(this.E.ctx, type, f, q), g = gainN(this.E.ctx, lvl);
    s.connect(b);
    b.connect(g);
    g.connect(this.out);
  }
  gap(k) {
    const R = this.R, d = this.def;
    if (k.endsWith("_g")) return k === "whisper_g" ? 0.6 + R() * 1.4 : k === "whistle_g" ? 1.5 + R() * 2.5 : 2 + R() * 3;
    const rate = d[k][0];
    return Math.max(0.02, -Math.log(1 - R() * 0.999) / rate);
  }
  scheduleUntil(t1, now = 0) {
    if (this.dead) return;
    for (const k in this.next) {
      if (this.next[k] < now - 0.3) this.next[k] = now + this.gap(k);
      let guard = 0;
      while (this.next[k] < t1 && guard++ < 60) {
        const t = this.next[k];
        this.ev(k, t);
        this.next[k] = t + this.gap(k);
      }
    }
  }
  setLevel(v, t) {
    this.out.gain.cancelScheduledValues(t);
    this.out.gain.setTargetAtTime(v, t, 0.5);
  }
  stop(t) {
    this.out.gain.cancelScheduledValues(t);
    this.out.gain.setTargetAtTime(0, t, 0.6);
    this.dead = t + 4;
    for (const s of this.srcs)
      try {
        s.stop(t + 4);
      } catch (e) {}
  }
  // 잠깐 나는 소리 하나 (음높이 f0→f1, 붙고 사라짐)
  blip(t, f0, f1, ft, a, g, dec, pan, type = "sine", dst = this.out) {
    const ctx = this.E.ctx, o = ctx.createOscillator(), gg = gainN(ctx), pn = panN(ctx, pan);
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    f1 !== f0 && o.frequency.exponentialRampToValueAtTime(f1, t + ft);
    gg.gain.setValueAtTime(0, t);
    gg.gain.linearRampToValueAtTime(g, t + a);
    gg.gain.setTargetAtTime(0, t + a, dec);
    o.connect(gg);
    gg.connect(pn);
    pn.connect(dst);
    o.start(t);
    o.stop(t + a + dec * 6);
    return gg;
  }
  grain(t, type, f, q, g, dur, pan) {
    const ctx = this.E.ctx, s = this.E.noiseSrc(t, t + dur + 0.05), b = filt(ctx, type, f, q), gg = gainN(ctx), pn = panN(ctx, pan);
    gg.gain.setValueAtTime(0, t);
    gg.gain.linearRampToValueAtTime(g, t + Math.min(0.002, dur / 3));
    gg.gain.setTargetAtTime(0, t + Math.min(0.002, dur / 3), dur / 4);
    s.connect(b);
    b.connect(gg);
    gg.connect(pn);
    pn.connect(this.out);
    return gg;
  }
  ev(k, t) {
    const R = this.R, P = () => (R() - 0.5) * 1.4, d = this.def, ctx = this.E.ctx;
    switch (k) {
      case "wind_g":
      case "wind2_g": {
        const w = this.lv[k.slice(0, -2)], u = R();
        w.f.frequency.setTargetAtTime(w.lo + (w.hi - w.lo) * u * u, t, 1.2 + R() * 1.5);
        w.g.gain.setTargetAtTime(w.lvl * (0.45 + 0.55 * R()), t, 1 + R());
        break;
      }
      case "whistle_g": {
        const w = this.lv.whistle;
        w.f.frequency.setTargetAtTime(500 + R() * 800, t, 1.5);
        w.g.gain.setTargetAtTime(w.lvl * R() * R(), t, 1.2);
        break;
      }
      case "whisper_g": {
        const w = this.lv.whisper;
        w.f1.frequency.setTargetAtTime(500 + R() * 900, t, 0.3);
        w.f2.frequency.setTargetAtTime(1600 + R() * 1200, t, 0.3);
        w.g.gain.setTargetAtTime(R() < 0.4 ? w.lvl * R() : 0, t, 0.35);
        w.pn.pan && w.pn.pan.setTargetAtTime(P(), t, 0.8);
        break;
      }
      case "crackle": {
        const g = d.crackle[1] * (0.3 + R() * 0.7);
        if (R() < 0.12) this.grain(t, "bandpass", 700 + R() * 600, 1, g * 1.6, 0.02, P());
        else this.grain(t, "highpass", 1500 + R() * 3500, 0.7, g, 0.003 + R() * 0.012, P());
        break;
      }
      case "birds": {
        const n = 2 + Math.floor(R() * 4), f = 2400 + R() * 1800, pan = P();
        for (let i = 0; i < n; i++) {
          const tt = t + i * (0.08 + R() * 0.08), up = R() < 0.5;
          this.blip(tt, f * (up ? 0.85 : 1.2), f * (up ? 1.25 : 0.8), 0.06 + R() * 0.05, 0.01, 0.02 + R() * 0.015, 0.03, pan);
        }
        break;
      }
      case "crickets": {
        const f = 4500 + R() * 700, pan = P(), reps = 2 + Math.floor(R() * 2);
        for (let i = 0; i < reps; i++) {
          const tt = t + i * 0.3, vca = gainN(ctx, 0), am = ctx.createOscillator(), amg = gainN(ctx, 0.5);
          am.type = "square";
          am.frequency.value = 28 + R() * 8;
          am.connect(amg);
          amg.connect(vca.gain);
          vca.gain.setValueAtTime(0.5, tt);
          vca.connect(this.out);
          const g = this.blip(tt, f, f, 0.1, 0.01, 0.012, 0.04, pan, "sine", vca);
          am.start(tt);
          am.stop(tt + 0.3);
          void g;
        }
        break;
      }
      case "owl": {
        const pan = P(), dst = gainN(ctx, 1), lp = filt(ctx, "lowpass", 900, 0.7);
        dst.connect(lp);
        lp.connect(this.out);
        this.blip(t, 390, 370, 0.25, 0.05, 0.03, 0.06, pan, "sine", dst);
        this.blip(t + 0.42, 400, 360, 0.5, 0.06, 0.035, 0.1, pan, "sine", dst);
        break;
      }
      case "frogs": {
        const f = 100 + R() * 50, pan = P(), reps = 1 + Math.floor(R() * 3);
        for (let i = 0; i < reps; i++) {
          const tt = t + i * (0.35 + R() * 0.2), vca = gainN(ctx, 0), am = ctx.createOscillator(), amg = gainN(ctx, 0.5), bp = filt(ctx, "bandpass", 450, 3);
          am.type = "square";
          am.frequency.value = 20 + R() * 8;
          am.connect(amg);
          amg.connect(vca.gain);
          vca.gain.setValueAtTime(0.5, tt);
          bp.connect(vca);
          vca.connect(this.out);
          this.blip(tt, f, f * 0.92, 0.3, 0.02, 0.05, 0.06, pan, "square", bp);
          am.start(tt);
          am.stop(tt + 0.5);
        }
        break;
      }
      case "bubbles": {
        const n = 1 + Math.floor(R() * 4), pan = P();
        for (let i = 0; i < n; i++) {
          const f = 250 + R() * 250;
          this.blip(t + i * (0.05 + R() * 0.1), f, f * 1.8, 0.04, 0.003, 0.03, 0.012, pan);
        }
        break;
      }
      case "drips": {
        const f = 900 + R() * 800;
        this.blip(t, f, f * 1.5, 0.03, 0.002, 0.035, 0.012, P());
        break;
      }
      case "thunder": {
        const s = this.E.noiseSrc(t, t + 6, this.E.brownS), b = filt(ctx, "lowpass", 160, 0.7), g = gainN(ctx), pn = panN(ctx, P());
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.25, t + 0.4 + R() * 0.4);
        g.gain.setTargetAtTime(0, t + 0.9, 1.1);
        s.connect(b);
        b.connect(g);
        g.connect(pn);
        pn.connect(this.out);
        break;
      }
      case "chimes": {
        const n = 1 + Math.floor(R() * 3), pan = P();
        for (let i = 0; i < n; i++) {
          const m = 84 + PENTA[Math.floor(R() * 5)] + (R() < 0.3 ? 12 : 0), f = 440 * Math.pow(2, (m - 69) / 12);
          this.fmb(t + i * (0.25 + R() * 0.2), f, 3.5, 1.8, 0.018, pan);
        }
        break;
      }
      case "sparkle":
        this.fmb(t, 3000 + R() * 2000, 4, 0.3, 0.012, P());
        break;
      case "clank": {
        const f = 300 + R() * 300, pan = P(), dst = gainN(ctx, 1), lp = filt(ctx, "lowpass", 2000, 0.7), far = gainN(ctx, 0.9);
        dst.connect(lp);
        lp.connect(this.out);
        lp.connect(far);
        far.connect(this.E.sfxSend);
        for (const [r, a, dd] of [[1, 0.02, 0.3], [2.76, 0.012, 0.2], [5.4, 0.006, 0.1]]) this.blip(t, f * r, f * r, 0.1, 0.001, a, dd, pan, "sine", dst);
        break;
      }
      case "clink":
        this.fmb(t, 1800 + R() * 1200, 2.7, 0.25, 0.014, P());
        break;
    }
  }
  fmb(t, f, r, dec, g, pan) {
    const ctx = this.E.ctx, c = ctx.createOscillator(), m = ctx.createOscillator(), mg = gainN(ctx), gg = gainN(ctx), pn = panN(ctx, pan);
    c.frequency.value = f;
    m.frequency.value = f * r;
    mg.gain.setValueAtTime(f * 2, t);
    mg.gain.setTargetAtTime(f * 0.1, t, dec * 0.3);
    m.connect(mg);
    mg.connect(c.frequency);
    gg.gain.setValueAtTime(0, t);
    gg.gain.linearRampToValueAtTime(g, t + 0.002);
    gg.gain.setTargetAtTime(0, t + 0.002, dec);
    c.connect(gg);
    gg.connect(pn);
    pn.connect(this.out);
    c.start(t);
    m.start(t);
    c.stop(t + dec * 6);
    m.stop(t + dec * 6);
  }
}
