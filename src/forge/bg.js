// 포지로드 지역 전용 배경 (원경 0 · 중경 1 · 근경 2). 640x360 픽셀 버퍼에 그린다.
// H: 엔진 도우미 { Jt(seed, base, amps) → x→y, jt(buf, fn, col, top), It(draw, x, margin), di(buf,x,y,h,col,type), st(col, f), Ke(a,b,t) }
const W = 640,
  HH = 360;

function smoke(T, H, x, base, h, col, alpha, seed) {
  for (let i = 0; i < h; i += 3) {
    const k = i / h;
    const r = 4 + k * 22;
    T.ellipse(x + Math.sin(i * 0.05 + seed) * (6 + k * 18), base - i, r, r * 0.7, col, Math.round(alpha * (1 - k)));
  }
}
function glowDot(T, x, y, r, col, a = 60) {
  T.circle(x, y, r * 2.2, col, Math.round(a * 0.4));
  T.circle(x, y, r * 1.4, col, Math.round(a * 0.8));
  T.circle(x, y, r * 0.7, col, 230);
}

export const FRBG = {
  ashvillage(T, S, m, t, E, h, R, H) {
    if (S === 0) {
      H.jt(T, H.Jt(R, 236, [16, 9, 5]), m, t);
      // 지평선 잔불
      for (let i = 0; i < 70; i++) T.px(h.int(0, W), h.int(200, 300), E.accent, h.int(60, 200));
      for (let i = 0; i < 4; i++) {
        const x = h.int(0, W);
        H.It((xx) => smoke(T, H, xx, 250, 170, H.Ke(m, E.sky[1], 0.35), 120, i), x, 60);
      }
    } else if (S === 1) {
      const gy = 268;
      T.rect(0, gy, W, HH - gy, m);
      const dark = H.st(m, -0.25);
      for (let i = 0; i < 8; i++) {
        const x = h.int(0, W),
          w = h.int(34, 60),
          hh = h.int(26, 48),
          broken = h.chance(0.5);
        H.It(
          (xx) => {
            T.rect(xx, gy - hh, w, hh, m);
            if (broken) {
              T.poly([[xx - 4, gy - hh], [xx + w * 0.45, gy - hh - 22], [xx + w * 0.55, gy - hh - 8], [xx + w * 0.4, gy - hh]], m);
              T.thickLine(xx + w * 0.55, gy - hh - 6, xx + w + 6, gy - hh - 16, 2, dark);
            } else T.poly([[xx - 4, gy - hh], [xx + w / 2, gy - hh - 24], [xx + w + 4, gy - hh]], m);
            T.rect(xx + w - 12, gy - hh - 20, 6, 16, m);
            for (let k = 0; k < 2 + (w > 46 ? 1 : 0); k++) {
              const wx = xx + 6 + k * 14,
                wy = gy - hh + 10;
              if (h.chance(0.7)) {
                T.circle(wx + 2, wy + 3, 8, E.accent, 30);
                T.rect(wx, wy, 5, 7, E.accent, 210);
                T.rect(wx, wy + 3, 5, 1, dark);
              } else T.rect(wx, wy, 5, 7, dark);
            }
            T.rect(xx + w / 2 - 4, gy - 12, 8, 12, dark);
          },
          x,
          80,
        );
      }
      // 종탑
      const bx = h.int(60, W - 60);
      H.It(
        (xx) => {
          T.rect(xx, gy - 120, 22, 120, m);
          T.poly([[xx - 6, gy - 120], [xx + 11, gy - 156], [xx + 28, gy - 120]], m);
          T.rect(xx + 6, gy - 108, 10, 14, dark);
          T.circle(xx + 11, gy - 98, 4, H.st(E.accent, -0.3));
          T.rect(xx + 10, gy - 168, 2, 14, m);
          T.rect(xx + 6, gy - 164, 10, 2, m);
        },
        bx,
        60,
      );
    } else {
      const f = H.Jt(R, 324, [6, 4, 2]);
      H.jt(T, f, m, t);
      for (let i = 0; i < 9; i++) {
        const x = h.int(0, W);
        H.It((xx) => H.di(T, xx, f(x) + 2, h.int(30, 52), m, "dead"), x);
      }
      for (let i = 0; i < 12; i++) {
        const x = h.int(0, W);
        H.It((xx) => {
          const y = f(x);
          T.rect(xx, y - 14, 3, 16, m);
          T.rect(xx + 10, y - 12, 3, 14, m);
          T.rect(xx - 2, y - 10, 18, 2, m);
        }, x);
      }
      for (let x = 0; x < W; x += 2) h.chance(0.1) && T.px(x, Math.round(f(x)) + h.int(1, 6), E.accent, h.int(120, 255));
    }
  },

  rotmarsh(T, S, m, t, E, h, R, H) {
    if (S === 0) {
      const f = H.Jt(R, 240, [10, 6, 4]);
      H.jt(T, f, m, t);
      for (let i = 0; i < 30; i++) {
        const x = h.int(0, W);
        H.It((xx) => H.di(T, xx, f(x) + 4, h.int(40, 80), m, h.chance(0.5) ? "dead" : "round"), x);
      }
    } else if (S === 1) {
      const wy = 296;
      for (let i = 0; i < 6; i++) {
        const x = h.int(0, W),
          hh = h.int(110, 170),
          w = h.int(10, 16);
        H.It(
          (xx) => {
            for (let y = 0; y < hh; y++) {
              const ww = w * (1 - y / hh) * 0.6 + w * 0.4 + (y < 14 ? (14 - y) * 0.9 : 0);
              T.rect(xx + Math.sin(y * 0.04 + i) * 6 - ww / 2, wy - y, ww, 1, m);
            }
            const tx = xx + Math.sin(hh * 0.04 + i) * 6;
            T.ellipse(tx, wy - hh, 34, 16, m);
            T.ellipse(tx - 22, wy - hh + 8, 20, 10, m);
            T.ellipse(tx + 24, wy - hh + 6, 22, 11, m);
            for (let k = 0; k < 7; k++) {
              const mx = tx - 30 + k * 10,
                ml = h.int(12, 40);
              T.rect(mx, wy - hh + 6, 1, ml, H.st(E.accent, -0.45), 200);
            }
          },
          x,
          70,
        );
      }
      T.rect(0, wy, W, HH - wy, H.st(m, -0.2));
      for (let i = 0; i < 40; i++) T.rect(h.int(0, W), h.int(wy + 3, HH - 4), h.int(6, 26), 1, E.accent, h.int(30, 90));
    } else {
      const f = H.Jt(R, 330, [5, 3]);
      H.jt(T, f, m, t);
      for (let i = 0; i < 60; i++) {
        const x = h.int(0, W),
          hh = h.int(14, 40);
        H.It((xx) => {
          const y = f(x);
          T.line(xx, y, xx + h.int(-3, 3), y - hh, m);
          h.chance(0.4) && T.ellipse(xx, y - hh, 1.5, 4, H.st(m, -0.3));
        }, x, 10);
      }
    }
  },

  thunderspire(T, S, m, t, E, h, R, H) {
    if (S === 0) {
      for (let i = 0; i < 9; i++) T.ellipse(h.int(0, W), h.int(30, 110), h.int(60, 130), h.int(10, 22), H.Ke(E.sky[0], m, 0.5), 160);
      const cx = h.int(240, 400);
      H.It(
        (xx) => {
          for (let y = 30; y < 300; y++) {
            const w = 6 + (y - 30) * 0.09;
            T.rect(xx - w, y, w * 2, 1, m);
          }
          for (const y of [90, 150, 210]) T.ellipse(xx, y, 26 + y * 0.06, 4, m);
          glowDot(T, xx, 26, 6, E.accent, 120);
          for (let k = 0; k < 4; k++) T.line(xx, 26, xx + h.int(-50, 50), 26 + h.int(-20, 30), E.accent, 120);
        },
        cx,
        120,
      );
      H.jt(T, H.Jt(R, 292, [8, 5]), m, t);
    } else if (S === 1) {
      const gy = 286;
      T.rect(0, gy, W, HH - gy, m);
      const tops = [];
      for (let i = 0; i < 6; i++) {
        const x = h.int(0, W),
          hh = h.int(90, 180),
          w = h.int(14, 24);
        tops.push([x + w / 2, gy - hh]);
        H.It(
          (xx) => {
            T.rect(xx, gy - hh, w, hh, m);
            T.poly([[xx - 3, gy - hh], [xx + w / 2, gy - hh - 18], [xx + w + 3, gy - hh]], m);
            for (let k = 0; k < 3; k++) T.ring(xx + w / 2, gy - hh + 20 + k * 8, w * 0.75, 1.2, E.accent, 150);
            for (let k = 0; k < hh / 24; k++) T.rect(xx + w / 2 - 1, gy - hh + 40 + k * 22, 3, 5, E.accent, 120);
          },
          x,
          60,
        );
      }
      tops.sort((a, b) => a[0] - b[0]);
      for (let i = 0; i + 1 < tops.length; i++) {
        const [x0, y0] = tops[i],
          [x1, y1] = tops[i + 1];
        for (let k = 0; k <= 30; k++) {
          const u = k / 30;
          T.px(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u + Math.sin(u * Math.PI) * 18 + 4, m);
        }
      }
    } else {
      const f = H.Jt(R, 326, [5, 3]);
      H.jt(T, f, m, t);
      for (let i = 0; i < 6; i++) {
        const x = h.int(0, W),
          r = h.int(14, 26);
        H.It((xx) => {
          const y = f(x) - r * 0.4;
          T.circle(xx, y, r, m);
          for (let k = 0; k < 10; k++) {
            const a = (k / 10) * Math.PI * 2;
            T.rect(xx + Math.cos(a) * (r + 2) - 2, y + Math.sin(a) * (r + 2) - 2, 5, 5, m);
          }
          T.circle(xx, y, r * 0.35, H.st(m, 0.12));
        }, x, 40);
      }
      T.rect(0, 306, W, 4, m);
      for (let x = 0; x < W; x += 48) T.rect(x, 303, 6, 10, m);
    }
  },

  crystalsanctum(T, S, m, t, E, h, R, H) {
    const crystal = (x, y, w, hh, col, lean = 0) => {
      T.poly([[x - w, y], [x - w * 0.6 + lean, y - hh * 0.8], [x + lean, y - hh], [x + w * 0.6 + lean, y - hh * 0.8], [x + w, y]], col);
      T.poly([[x + lean * 0.5, y], [x + lean, y - hh], [x + w * 0.6 + lean, y - hh * 0.8], [x + w, y]], H.st(col, 0.22));
    };
    if (S === 0) {
      H.jt(T, H.Jt(R, 250, [18, 10, 6]), m, t);
      for (let i = 0; i < 6; i++) {
        const x = h.int(0, W);
        H.It((xx) => crystal(xx, 270, h.int(8, 16), h.int(90, 170), H.Ke(m, E.accent, 0.12), h.int(-10, 10)), x, 40);
      }
      for (let i = 0; i < 60; i++) T.px(h.int(0, W), h.int(20, 240), 0xffffff, h.int(80, 220));
    } else if (S === 1) {
      const gy = 288;
      T.rect(0, gy, W, HH - gy, m);
      for (let i = 0; i < 4; i++) {
        const x = h.int(0, W);
        H.It(
          (xx) => {
            for (let k = 0; k < 4; k++) {
              T.rect(xx + k * 30, gy - 92, 9, 92, m);
              T.rect(xx + k * 30 - 3, gy - 96, 15, 5, m);
            }
            for (let k = 0; k < 3; k++)
              for (let j = 0; j <= 12; j++) {
                const u = j / 12;
                T.rect(xx + 6 + k * 30 + u * 24, gy - 92 - Math.sin(u * Math.PI) * 14, 3, 5, m);
              }
            T.rect(xx - 4, gy - 112, 112, 8, m);
          },
          x,
          120,
        );
      }
      for (let i = 0; i < 4; i++) {
        const x = h.int(0, W),
          y = h.int(60, 160);
        H.It((xx) => {
          T.rect(xx - 10, y, 20, gy - y, E.accent, 22);
          crystal(xx, y + 12, 8, 40, H.Ke(m, E.accent, 0.3), 0);
          T.poly([[xx - 8, y + 12], [xx, y + 34], [xx + 8, y + 12]], H.Ke(m, E.accent, 0.2));
        }, x, 40);
      }
    } else {
      const f = H.Jt(R, 326, [6, 3]);
      H.jt(T, f, m, t);
      for (let i = 0; i < 14; i++) {
        const x = h.int(0, W);
        H.It((xx) => {
          const y = f(x) + 3;
          for (let k = 0; k < 3; k++) crystal(xx + k * 9 - 9, y, h.int(4, 7), h.int(14, 34), H.Ke(m, E.accent, 0.25), h.int(-6, 6));
        }, x, 30);
      }
    }
  },

  skyruins(T, S, m, t, E, h, R, H) {
    const island = (x, y, w, col, ruins) => {
      T.rect(x - w, y - 4, w * 2, 6, col);
      T.poly([[x - w, y + 2], [x - w * 0.4, y + w * 0.9], [x + w * 0.2, y + w * 0.6], [x + w, y + 2]], H.st(col, -0.18));
      T.rect(x - w, y - 5, w * 2, 2, H.st(col, 0.25));
      if (ruins) {
        T.rect(x - w * 0.5, y - 26, 5, 22, col);
        T.rect(x + w * 0.3, y - 30, 5, 26, col);
        for (let j = 0; j <= 10; j++) {
          const u = j / 10;
          T.rect(x - w * 0.5 + 2 + u * (w * 0.8), y - 30 - Math.sin(u * Math.PI) * 8, 3, 4, col);
        }
      }
    };
    if (S === 0) {
      const cloud = H.Ke(E.sky[1], 0xffffff, 0.6);
      for (let i = 0; i < 22; i++) T.ellipse(h.int(0, W), h.int(300, 360), h.int(40, 90), h.int(14, 30), cloud, 230);
      for (let i = 0; i < 5; i++) {
        const x = h.int(0, W),
          y = h.int(120, 230);
        H.It((xx) => island(xx, y, h.int(14, 26), m, h.chance(0.6)), x, 40);
      }
    } else if (S === 1) {
      for (let i = 0; i < 4; i++) {
        const x = h.int(0, W),
          y = h.int(150, 250),
          w = h.int(36, 60);
        H.It(
          (xx) => {
            island(xx, y, w, m, !0);
            const fx = xx + h.int(-w / 2, w / 2);
            for (let k = 0; k < HH - y; k += 1) T.rect(fx, y + w * 0.5 + k, 4, 1, 0xd8f0ff, Math.max(0, 180 - k * 1.2));
            for (let k = 0; k < 5; k++) T.rect(xx - w + k * (w / 2.5), y + 2, 1, h.int(10, 30), H.st(E.accent, -0.5), 180);
          },
          x,
          80,
        );
      }
    } else {
      const cloud = H.Ke(E.sky[1], 0xffffff, 0.75);
      for (let i = 0; i < 26; i++) T.ellipse(h.int(0, W), h.int(320, 372), h.int(40, 80), h.int(16, 30), cloud, 245);
    }
  },

  shadowcapital(T, S, m, t, E, h, R, H) {
    if (S === 0) {
      for (let i = 0; i < 90; i++) T.px(h.int(0, W), h.int(0, 220), 0xffffff, h.int(50, 200));
      const mx = h.int(380, 520);
      T.circle(mx, 80, 40, 0xe8ecff, 40);
      T.circle(mx, 80, 30, 0xeef0ff);
      T.circle(mx - 8, 72, 6, 0xd0d4ec);
      T.circle(mx + 10, 90, 4, 0xd0d4ec);
      const gy = 262;
      T.rect(0, gy, W, HH - gy, m);
      const cx = h.int(100, 260);
      H.It(
        (xx) => {
          T.rect(xx, gy - 70, 120, 70, m);
          for (const [dx, hh, w] of [[0, 120, 16], [24, 90, 12], [52, 150, 20], [84, 100, 12], [106, 130, 16]]) {
            T.rect(xx + dx, gy - hh, w, hh, m);
            T.poly([[xx + dx - 2, gy - hh], [xx + dx + w / 2, gy - hh - w * 1.8], [xx + dx + w + 2, gy - hh]], m);
            T.rect(xx + dx + w / 2 - 1, gy - hh + 12, 2, 4, 0xe8ecff, 160);
          }
        },
        cx,
        140,
      );
    } else if (S === 1) {
      const gy = 286;
      T.rect(0, gy, W, HH - gy, m);
      for (let i = 0; i < 9; i++) {
        const x = h.int(0, W),
          w = h.int(26, 44),
          hh = h.int(60, 120);
        H.It(
          (xx) => {
            T.rect(xx, gy - hh, w, hh, m);
            T.poly([[xx - 3, gy - hh], [xx + w / 2, gy - hh - w], [xx + w + 3, gy - hh]], m);
            for (let k = 0; k < Math.floor(hh / 28); k++)
              if (h.chance(0.55)) {
                const wx = xx + w / 2 - 3,
                  wy = gy - hh + 14 + k * 26;
                T.rect(wx, wy + 3, 6, 8, E.accent, 170);
                T.circle(wx + 3, wy + 3, 3, E.accent, 170);
              }
          },
          x,
          60,
        );
      }
      for (let i = 0; i < 5; i++) {
        const x = h.int(0, W);
        H.It((xx) => {
          T.rect(xx, gy - 40, 2, 40, m);
          T.rect(xx - 3, gy - 42, 8, 3, m);
          glowDot(T, xx + 1, gy - 46, 2, 0xffe080, 80);
        }, x, 20);
      }
    } else {
      const f = H.Jt(R, 328, [4, 2]);
      H.jt(T, f, m, t);
      for (let x = 0; x < W; x += 9) {
        const y = f(x);
        T.rect(x, y - 30, 2, 30, m);
        T.poly([[x - 2, y - 30], [x + 1, y - 37], [x + 4, y - 30]], m);
      }
      for (let x = 0; x < W; x++) (T.px(x, Math.round(f(x)) - 24, m), T.px(x, Math.round(f(x)) - 10, m));
    }
  },

  forgeheart(T, S, m, t, E, h, R, H) {
    if (S === 0) {
      const ax = h.int(220, 420);
      H.It(
        (xx) => {
          T.rect(xx - 90, 150, 180, 26, m);
          T.poly([[xx + 90, 150], [xx + 150, 156], [xx + 90, 170]], m);
          T.rect(xx - 50, 176, 100, 40, m);
          T.rect(xx - 80, 216, 160, 20, m);
          T.rect(xx - 90, 150, 180, 2, E.accent, 120);
          for (const dx of [-70, 70]) for (let y = 0; y < 150; y += 6) T.ellipse(xx + dx, y, 3, 4, m);
        },
        ax,
        160,
      );
      for (let y = 280; y < HH; y++) T.rect(0, y, W, 1, H.Ke(E.accent, 0xff5010, (y - 280) / 80), 200);
      H.jt(T, H.Jt(R, 268, [10, 6]), m, t);
      for (let i = 0; i < 90; i++) T.px(h.int(0, W), h.int(120, 300), E.accent, h.int(80, 220));
    } else if (S === 1) {
      const gy = 290;
      T.rect(0, gy, W, HH - gy, m);
      for (let i = 0; i < 6; i++) {
        const x = h.int(0, W),
          hh = h.int(120, 220);
        H.It(
          (xx) => {
            T.rect(xx, gy - hh, 18, hh, m);
            T.rect(xx - 4, gy - hh, 26, 6, m);
            for (let y = gy - hh + 10; y < gy; y++) T.px(xx + 8 + Math.round(Math.sin(y * 0.15) * 2), y, E.accent, 200);
            glowDot(T, xx + 9, gy - hh - 6, 4, 0xff9030, 90);
          },
          x,
          60,
        );
      }
      for (let i = 0; i < 5; i++) {
        const x = h.int(0, W),
          l = h.int(40, 140);
        H.It((xx) => {
          for (let y = 0; y < l; y += 6) T.ellipse(xx, y, 2, 3, m);
          T.thickLine(xx, l, xx + 6, l + 8, 2, m);
        }, x, 20);
      }
    } else {
      const f = H.Jt(R, 324, [6, 4, 2]);
      H.jt(T, f, m, t);
      for (let i = 0; i < 18; i++) {
        let x = h.int(0, W),
          y = f(x) + h.int(4, 20);
        for (let k = 0; k < 8; k++) {
          const nx = x + h.int(-6, 6),
            ny = y + h.int(2, 6);
          T.line(x, y, nx, ny, E.accent, 220);
          ((x = nx), (y = ny));
        }
      }
      for (let x = 0; x < W; x += 3) h.chance(0.12) && T.px(x, Math.round(f(x)) - 1, 0xffd070, 220);
    }
  },
};

// 지역별 장식 (지형 위 소품)
export const FRDECOR = {
  ashvillage: ["d_rock", "d_barrel", "d_bones", "d_torch", "d_rock", "d_bannerpole"],
  rotmarsh: ["d_mushroom", "d_glowshroom", "d_tendril", "d_bones", "d_darktree", "d_mushroom"],
  echomine: ["d_crystal", "d_stalag", "d_rock", "d_torch", "d_barrel", "d_crystal"],
  glassdesert: ["d_cactus", "d_crystal", "d_bones", "d_pillar_sand", "d_rock", "d_crystal"],
  thunderspire: ["d_lamp_arcane", "d_column", "d_barrel", "d_lamp_arcane", "d_rock"],
  crystalsanctum: ["d_crystal", "d_statue", "d_crystal", "d_lamp_arcane", "d_column", "d_flower"],
  skyruins: ["d_column", "d_statue", "d_grass", "d_flower", "d_grass", "d_pillar_sand"],
  shadowcapital: ["d_statue", "d_lamp_arcane", "d_voidcrystal", "d_column", "d_tendril", "d_bones"],
  forgeheart: ["d_torch", "d_barrel", "d_crystal", "d_voidcrystal", "d_bannerpole", "d_torch"],
};

// ── 추가 지역 배경 ──
Object.assign(FRBG, {
  mistwood(T, S, m, t, E, h, R, H) {
    if (S === 0) {
      H.jt(T, H.Jt(R, 210, [14, 8, 5]), m, t);
      for (let i = 0; i < 34; i++) {
        const x = h.int(0, W);
        H.It((xx) => H.di(T, xx, 230 + h.int(-6, 10), h.int(90, 150), m, "pine"), x);
      }
      for (let y = 180; y < 300; y += 3) T.rect(0, y, W, 3, E.fog, Math.round(40 * Math.sin(((y - 180) / 120) * Math.PI)));
    } else if (S === 1) {
      for (let i = 0; i < 5; i++) {
        const x = h.int(0, W), w = h.int(16, 26);
        H.It((xx) => {
          for (let y = 0; y < HH; y++) {
            const ww = w + (y > HH - 50 ? (y - (HH - 50)) * 0.6 : 0);
            T.rect(xx - ww / 2 + Math.sin(y * 0.02 + i) * 3, y, ww, 1, m);
          }
          for (let k = 0; k < 4; k++) {
            const by = h.int(40, 200), d = h.chance(0.5) ? 1 : -1;
            T.thickLine(xx, by, xx + d * h.int(30, 60), by - h.int(10, 30), 3, m);
          }
          for (let k = 0; k < 3; k++) glowDot(T, xx + h.int(-14, 14), HH - h.int(8, 30), 2, E.accent, 70);
        }, x, 80);
      }
      for (let i = 0; i < 18; i++) {
        const x = h.int(0, W), y = h.int(20, 120);
        H.It((xx) => T.ellipse(xx, y, h.int(30, 60), h.int(14, 26), m), x, 60);
      }
    } else {
      const f = H.Jt(R, 326, [6, 4]);
      H.jt(T, f, m, t);
      for (let i = 0; i < 14; i++) {
        const x = h.int(0, W);
        H.It((xx) => {
          const y = f(x);
          T.rect(xx, y - 8, 2, 8, m);
          T.ellipse(xx + 1, y - 9, 5, 3, m);
          T.px(xx - 1, y - 10, E.accent, 200);
          T.px(xx + 3, y - 9, E.accent, 200);
        }, x, 20);
      }
      for (let i = 0; i < 40; i++) {
        const x = h.int(0, W);
        H.It((xx) => T.line(xx, f(x), xx + h.int(-3, 3), f(x) - h.int(8, 18), m), x, 10);
      }
    }
  },
  echomine(T, S, m, t, E, h, R, H) {
    if (S === 0) {
      T.rect(0, 0, W, 40, m);
      for (let x = 0; x < W; x += 6) T.poly([[x, 40], [x + 3, 40 + h.int(6, 40)], [x + 6, 40]], m);
      H.jt(T, H.Jt(R, 260, [16, 8]), m, t);
      for (let i = 0; i < 14; i++) {
        const x = h.int(0, W), y = h.int(80, 250);
        H.It((xx) => {
          T.poly([[xx - 4, y + 6], [xx, y - 10], [xx + 4, y + 6]], E.accent, 200);
          T.circle(xx, y, 10, E.accent, 30);
        }, x, 20);
      }
    } else if (S === 1) {
      const gy = 290;
      T.rect(0, gy, W, HH - gy, m);
      for (let x = 0; x < W; x += 90) {
        T.rect(x, 150, 8, gy - 150, m);
        T.rect(x + 70, 150, 8, gy - 150, m);
        T.rect(x - 4, 146, 90, 8, m);
        T.thickLine(x + 8, 154, x + 30, 176, 3, m);
        T.thickLine(x + 70, 154, x + 48, 176, 3, m);
        T.rect(x + 36, 154, 2, 14, m);
        glowDot(T, x + 37, 172, 3, 0xffc060, 90);
      }
      T.rect(0, gy - 6, W, 2, H.st(m, 0.15));
      for (let x = 0; x < W; x += 12) T.rect(x, gy - 4, 6, 3, m);
      for (let i = 0; i < 2; i++) {
        const x = h.int(0, W);
        H.It((xx) => {
          T.rect(xx, gy - 26, 34, 18, m);
          T.circle(xx + 8, gy - 6, 5, m);
          T.circle(xx + 26, gy - 6, 5, m);
          T.poly([[xx + 4, gy - 26], [xx + 12, gy - 36], [xx + 24, gy - 34], [xx + 30, gy - 26]], H.st(m, -0.2));
        }, x, 40);
      }
    } else {
      const f = H.Jt(R, 324, [7, 4]);
      H.jt(T, f, m, t);
      for (let i = 0; i < 10; i++) {
        const x = h.int(0, W);
        H.It((xx) => {
          const y = f(x);
          for (let k = 0; k < 3; k++) T.poly([[xx + k * 6 - 3, y], [xx + k * 6, y - h.int(8, 22)], [xx + k * 6 + 3, y]], H.Ke(m, E.accent, 0.35));
        }, x, 20);
      }
    }
  },
  blazefort(T, S, m, t, E, h, R, H) {
    if (S === 0) {
      for (let y = 220; y < HH; y++) T.rect(0, y, W, 1, E.accent, Math.round(((y - 220) / 140) * 90));
      H.jt(T, H.Jt(R, 250, [12, 7]), m, t);
      const cx = h.int(200, 440);
      H.It((xx) => {
        T.rect(xx - 70, 150, 140, 100, m);
        for (const [dx, hh, w] of [[-80, 140, 24], [-20, 180, 30], [50, 150, 24]]) {
          T.rect(xx + dx, 250 - hh, w, hh, m);
          for (let k = 0; k < w; k += 6) T.rect(xx + dx + k, 246 - hh, 4, 5, m);
          T.rect(xx + dx + w / 2 - 2, 270 - hh, 4, 6, E.accent, 220);
        }
        for (let k = 0; k < 4; k++) smoke(T, H, xx + h.int(-60, 60), 150, 120, 0x3a1810, 140, k);
      }, cx, 160);
    } else if (S === 1) {
      const gy = 270;
      T.rect(0, gy, W, HH - gy, m);
      for (let x = 0; x < W; x += 16) T.rect(x, gy - 8, 10, 8, m);
      for (let i = 0; i < 4; i++) {
        const x = h.int(0, W);
        H.It((xx) => {
          T.rect(xx, gy - 70, 26, 70, m);
          T.poly([[xx - 4, gy - 70], [xx + 13, gy - 92], [xx + 30, gy - 70]], m);
          T.rect(xx + 12, gy - 110, 2, 20, m);
          T.poly([[xx + 14, gy - 110], [xx + 30, gy - 104], [xx + 14, gy - 98]], 0x9a2a1a);
        }, x, 50);
      }
      for (let i = 0; i < 10; i++) {
        const x = h.int(0, W);
        H.It((xx) => {
          for (let k = 0; k < 6; k++) T.poly([[xx - 6 + k * 2, gy], [xx - 3 + k * 2, gy - h.int(10, 26)], [xx + k * 2, gy]], k % 2 ? 0xff9030 : 0xff5010, 200);
          T.circle(xx, gy - 10, 16, E.accent, 30);
        }, x, 30);
      }
    } else {
      const f = H.Jt(R, 326, [5, 3]);
      H.jt(T, f, m, t);
      for (let i = 0; i < 8; i++) {
        const x = h.int(0, W);
        H.It((xx) => {
          const y = f(x);
          T.thickLine(xx, y, xx + 14, y - 30, 3, m);
          T.thickLine(xx + 20, y, xx + 6, y - 30, 3, m);
        }, x, 30);
      }
    }
  },
  frostgorge(T, S, m, t, E, h, R, H) {
    if (S === 0) {
      for (let i = 0; i < 8; i++) {
        const x = h.int(0, W), hh = h.int(120, 220);
        H.It((xx) => {
          T.poly([[xx - 70, 290], [xx, 290 - hh], [xx + 70, 290]], m);
          T.poly([[xx, 290 - hh], [xx + 70, 290], [xx + 20, 290]], H.st(m, -0.08));
          T.poly([[xx - 18, 290 - hh + 40], [xx, 290 - hh], [xx + 18, 290 - hh + 40], [xx + 6, 290 - hh + 32], [xx - 6, 290 - hh + 44]], 0xffffff);
        }, x, 100);
      }
      T.rect(0, 286, W, HH - 286, m);
    } else if (S === 1) {
      const gy = 286;
      T.rect(0, gy, W, HH - gy, m);
      for (let i = 0; i < 3; i++) {
        const x = h.int(0, W);
        H.It((xx) => {
          T.rect(xx - 50, 120, 44, gy - 120, m);
          T.rect(xx + 30, 140, 50, gy - 140, m);
          for (let y = 126; y < gy; y++) T.rect(xx - 6 + Math.sin(y * 0.1) * 2, y, 36, 1, H.Ke(m, 0xd8f4ff, 0.4 + Math.sin(y * 0.05) * 0.1));
          for (let k = 0; k < 10; k++) T.poly([[xx - 6 + k * 4, 126], [xx - 4 + k * 4, 126 + h.int(8, 20)], [xx - 2 + k * 4, 126]], 0xe8f8ff);
        }, x, 100);
      }
      for (let i = 0; i < 12; i++) {
        const x = h.int(0, W);
        H.It((xx) => H.di(T, xx, gy + 2, h.int(40, 70), m, "pine"), x);
      }
    } else {
      const f = H.Jt(R, 326, [6, 3]);
      H.jt(T, f, m, t);
      for (let x = 0; x < W; x++) T.px(x, Math.round(f(x)), 0xffffff);
      for (let i = 0; i < 12; i++) {
        const x = h.int(0, W);
        H.It((xx) => {
          const y = f(x);
          T.poly([[xx - 4, y], [xx - 1, y - h.int(10, 24)], [xx + 3, y]], H.Ke(m, 0xc8f0ff, 0.4));
        }, x, 20);
      }
    }
  },
  glassdesert(T, S, m, t, E, h, R, H) {
    if (S === 0) {
      T.circle(500, 90, 40, 0xfff4c0, 60);
      T.circle(500, 90, 28, 0xfffbe0, 230);
      for (let k = 0; k < 3; k++) H.jt(T, H.Jt(R + k, 236 + k * 22, [20, 9]), H.Ke(m, E.sky[1], 0.3 - k * 0.1), t);
      for (let i = 0; i < 4; i++) {
        const x = h.int(0, W);
        H.It((xx) => {
          T.poly([[xx - 10, 270], [xx - 4, 150], [xx + 4, 150], [xx + 10, 270]], m);
          T.poly([[xx - 4, 150], [xx, 136], [xx + 4, 150]], E.accent, 220);
          T.line(xx, 152, xx, 268, H.Ke(m, E.accent, 0.4));
        }, x, 40);
      }
    } else if (S === 1) {
      H.jt(T, H.Jt(R, 290, [14, 6]), m, t);
      for (let i = 0; i < 4; i++) {
        const x = h.int(0, W);
        H.It((xx) => {
          T.rect(xx, 220, 10, 70, m);
          T.rect(xx + 50, 230, 10, 60, m);
          for (let j = 0; j <= 14; j++) {
            const u = j / 14;
            T.rect(xx + 4 + u * 52, 220 - Math.sin(u * Math.PI) * 22, 4, 7, m);
          }
        }, x, 80);
      }
      for (let i = 0; i < 16; i++) {
        const x = h.int(0, W), y = h.int(250, 300);
        H.It((xx) => (T.poly([[xx - 4, y], [xx, y - h.int(10, 30)], [xx + 4, y]], H.Ke(m, E.accent, 0.5)), T.px(xx, y - 8, 0xffffff)), x, 20);
      }
    } else {
      const f = H.Jt(R, 326, [8, 4]);
      H.jt(T, f, m, t);
      for (let i = 0; i < 10; i++) {
        const x = h.int(0, W);
        H.It((xx) => {
          const y = f(x);
          T.rect(xx, y - 18, 4, 18, m);
          T.rect(xx - 5, y - 12, 5, 3, m);
          T.rect(xx - 5, y - 16, 2, 4, m);
          T.rect(xx + 4, y - 10, 5, 3, m);
          T.rect(xx + 7, y - 15, 2, 5, m);
        }, x, 20);
      }
    }
  },
  hubforge(T, S, m, t, E, h, R, H) {
    if (S === 0) {
      for (let i = 0; i < 50; i++) T.px(h.int(0, W), h.int(0, 120), 0xffffff, h.int(40, 140));
      H.jt(T, H.Jt(R, 220, [18, 10, 5]), m, t);
      const cx = 320, dk = H.st(m, -0.15);
      T.poly([[cx - 90, 300], [cx - 60, 150], [cx + 60, 150], [cx + 90, 300]], dk);
      T.rect(cx - 70, 140, 140, 14, dk);
      T.rect(cx - 30, 60, 60, 82, dk);
      T.rect(cx - 36, 54, 72, 8, dk);
      T.circle(cx, 220, 44, E.accent, 40);
      T.circle(cx, 220, 30, E.accent, 90);
      T.ellipse(cx, 230, 26, 34, 0xffd070, 230);
      T.ellipse(cx, 236, 16, 22, 0xfff4c0, 240);
      for (let k = 0; k < 6; k++) smoke(T, H, cx + h.int(-16, 16), 56, 60, 0x40302a, 120, k);
      for (let i = 0; i < 60; i++) T.px(cx + h.int(-120, 120), h.int(20, 200), E.accent, h.int(80, 230));
    } else if (S === 1) {
      const gy = 276;
      T.rect(0, gy, W, HH - gy, m);
      for (let i = 0; i < 9; i++) {
        const x = h.int(0, W), w = h.int(30, 50), hh = h.int(30, 50);
        H.It((xx) => {
          T.rect(xx, gy - hh, w, hh, m);
          T.poly([[xx - 4, gy - hh], [xx + w / 2, gy - hh - 20], [xx + w + 4, gy - hh]], m);
          T.rect(xx + w - 10, gy - hh - 22, 5, 16, m);
          T.rect(xx + 6, gy - hh + 10, 5, 6, 0xffc060, 220);
          T.circle(xx + 8, gy - hh + 13, 7, 0xffa040, 40);
        }, x, 60);
      }
    } else {
      const f = H.Jt(R, 326, [4, 2]);
      H.jt(T, f, m, t);
      for (let x = 0; x < W; x += 3) h.chance(0.08) && T.px(x, Math.round(f(x)) + 2, E.accent, 200);
    }
  },
});
FRDECOR.grassmere = [];
for (const k of ["mossbark", "greenstep", "stonebridge", "leafcrown", "ironvein", "dripstone", "roothollow"]) FRDECOR[k] = [];
FRDECOR.mistwood = ["d_mushroom", "d_glowshroom", "d_darktree", "d_grass", "d_glowshroom", "d_flower"];
FRDECOR.blazefort = ["d_torch", "d_barrel", "d_bannerpole", "d_torch", "d_bones"];
FRDECOR.frostgorge = ["d_pine", "d_snowrock", "d_crystal", "d_pine", "d_snowrock"];
