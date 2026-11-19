// 자연 지형 그림 — 밀도장(4px 격자)을 픽셀마다 보간해 윤곽 그대로 그린다.
// 칸 단위 사각형·삼각형을 칠하지 않는다. 충돌(finephys)과 같은 식·같은 계산 순서로 바위/공기를 정하므로
// 보이는 윤곽과 밟는 윤곽이 1px까지 같다.
//
// - 둥근 돌 무늬(세계 좌표) + 공기와의 거리로 안쪽 어둠
// - 위를 향한 면: 윤곽을 따라 풀·이끼·눈·모래 덮개(두께가 바뀌고 아래로 흘러내림) + 그 밑 흙층
// - 옆면·밑면: 바깥 방향(장의 기울기)으로 왼쪽 위 빛 → 밝은 테두리 / 그늘, 밑면엔 매달린 돌·뿌리
// - 지층이 있는 지역은 가로 결(층)과 납작한 돌
// - 장식(풀·버섯·수정·종유석·덩굴)은 실제 윤곽 픽셀에 붙는다
import { H, sh, mix, pack, CAP, ramp, BIOMES, lvq } from "./terrpal.js";

const T = 16, COLS = 32, PW = COLS * T;
export const FMARG = 8; // 좌우 여유 (격자 칸) = 32px
const MP = FMARG * 4;

// 조각 하나의 격자(좌우 여유 포함)를 잘라 낸다 — 작업 스레드로 보낸다
// band: 세로 띠 번호 (BANDH px씩). 위아래 BMARG px 여유를 붙여 잘라 낸다 (그늘·테두리가 띠 경계에서 끊기지 않게)
export const BANDH = 768, BMARG = 64;
export function fineSlice(ch, band = -1) {
  const f = ch.fine, F = f.F, LW = F.LW, LHf = F.LH, HPf = (LHf - 1) * 4;
  const n = PW / 4 + 2 * FMARG + 1, i0 = f.x0 / 4 - FMARG;
  let y0 = 0, y1 = HPf, cropTop = 0, cropH = HPf;
  if (band >= 0) {
    const a = band * BANDH, b = Math.min(HPf, a + BANDH);
    y0 = Math.max(0, a - BMARG);
    y1 = Math.min(HPf, b + BMARG);
    cropTop = a - y0;
    cropH = b - a;
  }
  const j0 = y0 / 4, LH = (y1 - y0) / 4 + 1;
  const d = new Float32Array(n * LH);
  for (let j = 0; j < LH; j++) {
    const o = (j0 + j) * LW, p = j * n;
    for (let k = 0; k < n; k++) {
      let i = i0 + k;
      i = i < 0 ? 0 : i > LW - 1 ? LW - 1 : i;
      d[p + k] = F.d[o + i];
    }
  }
  return { d, LW: n, LH, y0, cropTop, cropH, render: f.render, kind: f.kind, pkey: f.pkey, mats: f.mats, walls: f.walls, spec: f.spec, ox: f.ox };
}
// 그린 결과에서 띠 부분만 (여유 줄 빼기)
export function cropBand(res, top, h) {
  const { img, front, wall } = res;
  const W = img.width;
  if (top === 0 && h === img.height) return res;
  const o = top * W * 4, m = h * W * 4;
  const im = mkImage(W, h);
  im.data.set(img.data.subarray(o, o + m));
  return { img: im, front: front.slice(o, o + m), wall: wall.slice(o, o + m) };
}

const mkImage = (w, h) => (typeof ImageData !== "undefined" ? new ImageData(w, h) : { data: new Uint8ClampedArray(w * h * 4), width: w, height: h });

export function* pixFine(ch, base, region, S) {
  const { d, LW, LH } = S;
  const PH = (LH - 1) * 4, EW = (LW - 1) * 4;
  const P = region.pal ?? { rock: 0x9a8a7a, soil: 0x8a6a50, soilDark: 0x4a3428, top: 0x7cc04a, topHi: 0xc4f070, accent: 0xffe060 };
  const th = region.theme ?? "plains";
  const cap = CAP[th] ?? "grass";
  const rh = S.render ?? { stone: 14, strata: 0.3, soil: 8, pebble: 0.3 };
  const img = mkImage(PW, PH);
  const buf = new Uint32Array(img.data.buffer);
  const ug = ch.ug ?? { top: LH, biome: null };
  const BI = ug.biome ? BIOMES[ug.biome] : null;
  const isUG = (r) => r >= ug.top;
  const put = (x, y, c) => x >= 0 && y >= 0 && x < PW && y < PH && (buf[y * PW + x] = pack(c));
  const empty = (x, y) => x >= 0 && y >= 0 && x < PW && y < PH && buf[y * PW + x] === 0;
  const X0 = base * T; // 조각 왼쪽 끝의 세계 x
  const OY = S.y0 ?? 0; // 이 조각(띠) 맨 위의 세계 y

  // ── 1) 바위/공기 (충돌과 같은 식) ──
  const M = new Uint8Array(EW * PH);
  for (let j = 0; j < LH - 1; j++) {
    for (let i = 0; i < LW - 1; i++) {
      const k = j * LW + i;
      const a = d[k], b = d[k + 1], c = d[k + LW], e = d[k + LW + 1];
      const x0 = i * 4, y0 = j * 4;
      if (a > 0 && b > 0 && c > 0 && e > 0) {
        for (let yy = 0; yy < 4; yy++) {
          const o = (y0 + yy) * EW + x0;
          M[o] = M[o + 1] = M[o + 2] = M[o + 3] = 1;
        }
      } else if (a > 0 || b > 0 || c > 0 || e > 0) {
        for (let xx = 0; xx < 4; xx++) {
          const fu = (xx + 0.5) / 4;
          const A = a + (b - a) * fu, B = c + (e - c) * fu;
          for (let yy = 0; yy < 4; yy++) {
            const fv = (yy + 0.5) / 4;
            M[(y0 + yy) * EW + x0 + xx] = A + (B - A) * fv > 0 ? 1 : 0;
          }
        }
      }
    }
  }
  yield;
  // ── 2) 거리 (모따기 3·4): 바위 안 → 공기까지, 공기 → 바위까지 ──
  const D = new Uint8Array(EW * PH), DA = new Uint8Array(EW * PH);
  for (let k = 0; k < D.length; k++) M[k] ? ((D[k] = 255), (DA[k] = 0)) : ((D[k] = 0), (DA[k] = 255));
  const chamfer = (A, on) => {
    for (let y = 0; y < PH; y++)
      for (let x = 0, k = y * EW; x < EW; x++, k++) {
        if (M[k] !== on) continue;
        let v = A[k];
        if (x > 0 && A[k - 1] + 3 < v) v = A[k - 1] + 3;
        if (y > 0) {
          if (A[k - EW] + 3 < v) v = A[k - EW] + 3;
          if (x > 0 && A[k - EW - 1] + 4 < v) v = A[k - EW - 1] + 4;
          if (x < EW - 1 && A[k - EW + 1] + 4 < v) v = A[k - EW + 1] + 4;
        }
        A[k] = v;
      }
    for (let y = PH - 1; y >= 0; y--)
      for (let x = EW - 1, k = y * EW + EW - 1; x >= 0; x--, k--) {
        if (M[k] !== on) continue;
        let v = A[k];
        if (x < EW - 1 && A[k + 1] + 3 < v) v = A[k + 1] + 3;
        if (y < PH - 1) {
          if (A[k + EW] + 3 < v) v = A[k + EW] + 3;
          if (x < EW - 1 && A[k + EW + 1] + 4 < v) v = A[k + EW + 1] + 4;
          if (x > 0 && A[k + EW - 1] + 4 < v) v = A[k + EW - 1] + 4;
        }
        A[k] = v;
      }
  };
  chamfer(D, 1);
  yield;
  chamfer(DA, 0);
  yield;
  // ── 3) 세로줄마다 바위 구간 [시작, 끝) ──
  const runOff = new Int32Array(EW + 1), runA = [];
  for (let x = 0; x < EW; x++) {
    runOff[x] = runA.length;
    let s = -1;
    for (let y = 0; y < PH; y++) {
      const m = M[y * EW + x];
      if (m && s < 0) s = y;
      else if (!m && s >= 0) (runA.push(s, y), (s = -1));
    }
    s >= 0 && runA.push(s, PH);
  }
  runOff[EW] = runA.length;
  const RUN = Int32Array.from(runA);
  // 옆 줄에서 y0와 가장 가까운 윗면 (없으면 -1)
  const topNear = (x, y0, lim = 18) => {
    if (x < 0 || x >= EW) return -1;
    let best = -1, bd = lim + 1;
    for (let q = runOff[x]; q < runOff[x + 1]; q += 2) {
      const s = RUN[q];
      if (s <= 0) continue;
      const dd = Math.abs(s - y0);
      dd < bd && ((bd = dd), (best = s));
    }
    return best;
  };
  // 장의 기울기 → 바깥(공기) 방향
  const normal = (ex, y) => {
    const u = (ex + 0.5) / 4, v = (y + 0.5) / 4;
    const i = Math.min(LW - 2, u | 0), j = Math.min(LH - 2, v | 0), fu = u - i, fv = v - j, k = j * LW + i;
    const gx = (d[k + 1] - d[k]) * (1 - fv) + (d[k + LW + 1] - d[k + LW]) * fv;
    const gy = (d[k + LW] - d[k]) * (1 - fu) + (d[k + LW + 1] - d[k + 1]) * fu;
    const L = Math.sqrt(gx * gx + gy * gy);
    return L < 1e-4 ? null : [-gx / L, -gy / L];
  };

  // ── 재질 ──
  const RAMP = {};
  const rampOf = (b) => (RAMP[b] = RAMP[b] ?? ramp(b));
  const regionBase = {
    plains: mix(P.rock, P.soil, 0.3), forest: mix(mix(P.rock, 0x4a6a44, 0.3), P.soil, 0.2), cave: mix(P.rock, P.soil, 0.45),
    desert: mix(P.soil, P.rock, 0.35), snow: mix(P.rock, 0xa8d0f0, 0.45), fortress: mix(P.rock, 0x8a5a48, 0.25),
    kingdom: mix(P.rock, 0xf0ecf4, 0.4), abyss: P.rock,
  }[th] ?? mix(P.rock, P.soil, 0.3);
  const ugBase = BI ? BI.rock : mix(regionBase, 0x3a3448, 0.35);
  const SOIL = rampOf(mix(P.soilDark ?? sh(P.soil, -0.4), P.soil, 0.55));
  const G = rh.stone ?? 14;
  const strata = rh.strata ?? 0.3;
  const soilT = rh.soil ?? 8;
  // 값 잡음 (부드러운 2D)
  const vn2 = (x, y, s) => {
    const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = H(i, j, s), b = H(i + 1, j, s), c = H(i, j + 1, s), e = H(i + 1, j + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + e) * u * v;
  };
  const vn1 = (x, s) => {
    const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    return H(i, s, 5) * (1 - u) + H(i + 1, s, 5) * u;
  };
  // 지표 높이 (4px마다, 지상 구역만)
  const SP = ug.surfPx;
  const surfAt = (x) => {
    if (!SP) return ug.top <= 0 ? -1e9 : 1e9;
    const u = (x + 0.5) / 4, i = Math.max(0, Math.min(SP.length - 2, u | 0)), f = Math.max(0, Math.min(1, u - i));
    return SP[i] + (SP[i + 1] - SP[i]) * f;
  };
  // 땅속 암석이 시작하는 깊이: 지표를 따라가며 들쭉날쭉 (한 줄로 곧게 바뀌지 않는다)
  const ugTopPx = ug.top * T;
  const matY = new Float32Array(PW + 32);
  for (let x = -16; x < PW + 16; x++) {
    const wx = X0 + x;
    const base0 = SP ? Math.max(ugTopPx - 40, surfAt(x) + 88) : ugTopPx;
    matY[x + 16] = base0 + (vn1(wx / 70, 61) - 0.5) * 48 + (vn1(wx / 17, 62) - 0.5) * 12;
  }
  const isUGp = (x, y) => (ug.top <= 0 ? !0 : ug.top * T >= OY + PH ? !1 : y + OY >= matY[Math.max(0, Math.min(PW + 31, x + 16))]);
  // 지층 띠 (세계 좌표, 완만하게 휜다)
  const bandWarp = (wx) => (vn1(wx / 64, 77) * 14 + vn1(wx / 256, 78) * 10);
  const BH = 22;
  // 돌 무늬: 큰 돌·보통 돌·작은 돌이 섞이고, 돌 틈이 모두 같은 굵기의 선이 되지 않게
  const stoneL = (wx, y, ugc, layered) => {
    const G0 = ugc && BI ? 15 : G;
    const sel = vn2(wx / 96, y / 72, 63) + (H(wx >> 1, y >> 1, 64) - 0.5) * 0.12;
    const Gs = sel > 0.64 ? Math.round(G0 * 1.6) : sel < 0.3 ? Math.max(7, Math.round(G0 * 0.62)) : G0;
    const sx = layered ? 0.82 : 1;
    let L = lvq(wx * sx + (Gs * 97) % 1000, y, Gs);
    if (L === 5 && H(wx >> 2, y >> 2, 95) < 0.3) L = 4;
    return L;
  };

  // ── 재질 구역 (나무줄기·잎·벽돌·버섯): 세계 좌표 사각형 → 이 조각의 픽셀 지도 ──
  const MATC = { wood: 1, leaf: 2, brick: 3, stem: 4, cap: 5, rock: 6, ice: 7, jelly: 8 };
  let MM = null;
  const MX = S.ox ?? X0; // 재질·뒷벽 사각형은 구역 기준 좌표
  if (S.mats && S.mats.length) {
    MM = new Uint8Array(PW * PH);
    for (const r of S.mats) {
      const c = MATC[r.m] ?? 0;
      const x0 = Math.max(0, Math.floor(r.x0 - MX)), x1 = Math.min(PW, Math.ceil(r.x1 - MX));
      const y0 = Math.max(0, Math.floor(r.y0 - OY)), y1 = Math.min(PH, Math.ceil(r.y1 - OY));
      for (let y = y0; y < y1; y++) MM.fill(c, y * PW + x0, Math.max(y * PW + x0, y * PW + x1));
    }
  }
  const BARK = rampOf(mix(0x6e4628, P.soil, 0.25)), LEAF = rampOf(mix(P.top, 0x2e6a30, 0.3)), BRICK = rampOf(mix(P.rock, 0xc0b098, 0.45));
  const STEM = rampOf(0xe0d4b8), CAPR = rampOf(mix(P.accent ?? 0xd04040, 0xc83838, 0.55));
  const ICE = rampOf(0xa8dcf4), JELLY = rampOf(0xe070c0);
  const matCol = (m, x, y, wx, yw, dd, ex) => {
    let L, R6;
    if (m === 1) {
      // 나무껍질: 세로 결 + 옹이
      R6 = BARK;
      const g = (wx + Math.floor(vn1(yw / 19, 41) * 5)) % 7;
      L = g < 1 ? 3 : g < 3 ? 2 : 1;
      if (H(wx >> 3, yw >> 4, 42) > 0.93) L = 4;
    } else if (m === 2) {
      // 잎: 뭉친 덩어리 (돌 무늬를 잎 크기로)
      R6 = LEAF;
      L = lvq(wx + 500, yw, 9);
      L = L === 5 ? 3 : L;
      if (H(wx, yw, 43) > 0.95) L = 0;
    } else if (m === 3) {
      R6 = BRICK;
      const row = Math.floor(yw / 8), off = row & 1 ? 8 : 0;
      L = yw % 8 === 7 || (wx + off) % 16 === 15 ? 4 : H((wx + off) >> 4, row, 44) > 0.7 ? 2 : 1;
      if (H(wx >> 1, yw >> 1, 45) > 0.96) L = 3;
    } else if (m === 4) {
      R6 = STEM;
      L = (wx % 5 === 0 ? 2 : 1) + (H(wx, yw >> 2, 46) > 0.9 ? 1 : 0);
    } else if (m === 5) {
      R6 = CAPR;
      L = H(wx >> 3, yw >> 3, 47) > 0.9 && (wx & 7) > 1 && (yw & 7) > 1 ? -1 : 1 + ((wx >> 2) % 3 === 0 ? 1 : 0);
      if (L < 0) return 0xfff4e0;
    } else if (m === 7) {
      // 얼음: 밝은 하늘색, 비스듬한 반짝임 줄
      R6 = ICE;
      L = (wx - yw * 2) % 23 === 0 || (wx - yw * 2) % 23 === 1 ? 0 : H(wx >> 2, yw >> 2, 48) > 0.8 ? 2 : 1;
    } else if (m === 8) {
      // 튕김 버섯(젤리): 분홍, 점무늬, 윗줄 밝게
      R6 = JELLY;
      L = H(wx >> 2, yw >> 2, 49) > 0.82 ? 0 : (yw & 7) < 2 ? 1 : 2;
    } else return null;
    // 테두리·빛
    if (dd <= 3) L = 5;
    else if (dd <= 7) {
      const n = normal(ex, y);
      if (n) {
        const lit = n[0] * -0.6 + n[1] * -0.8;
        lit > 0.4 ? (L = Math.max(0, L - 1)) : lit < -0.3 && (L = Math.min(4, L + 1));
      }
    }
    return R6[L];
  };

  // ── 4) 바위 칠하기 ──
  for (let x = 0; x < PW; x++) {
    if ((x & 15) === 0) yield;
    const ex = x + MP, wx = X0 + x;
    const bw = strata > 0 ? bandWarp(wx) : 0;
    for (let q = runOff[ex]; q < runOff[ex + 1]; q += 2) {
      const s = RUN[q], e = RUN[q + 1];
      const realTop = s > 0;
      // 윗면 기울기 (양옆 3px 줄의 윗면 높이로)
      let up = 0;
      if (realTop) {
        const l = topNear(ex - 3, s), r = topNear(ex + 3, s);
        const sl = l >= 0 && r >= 0 ? (r - l) / 6 : l >= 0 ? (s - l) / 3 : r >= 0 ? (r - s) / 3 : 0;
        up = 1 / Math.sqrt(1 + sl * sl);
      }
      const ugTop = isUGp(x, s);
      const capT = ugTop ? (BI?.cap ? "moss" : "rock") : cap;
      const cTop = capT === "moss" ? BI.cap[0] : capT === "snow" ? 0xeef6ff : capT === "sand" ? P.topHi : P.top;
      const cHi = capT === "moss" ? BI.cap[1] : capT === "snow" ? 0xffffff : capT === "sand" ? 0xfff6d0 : P.topHi;
      const CR = rampOf(cTop);
      const soft = capT === "grass" || capT === "moss" || capT === "snow" || capT === "sand";
      const sw = s + OY;
      const capN = soft ? (capT === "snow" ? 6 : capT === "sand" ? 4 : 5) + Math.floor(H(wx >> 1, sw, 11) * 3) - (up < 0.75 ? 1 : 0) : 3;
      const drip = soft ? Math.floor(H(wx >> 1, sw >> 2, 12) * 3) + (H(wx >> 2, sw >> 2, 13) > 0.82 ? 3 : 0) : 0;
      const hasCap = realTop && up > (soft ? 0.5 : 0.42);
      const soilN = hasCap && soft && !ugTop && soilT > 0 ? soilT + Math.floor((vn1(wx / 40, 14) - 0.5) * 10) : 0;
      const RT = rampOf(ugTop ? ugBase : regionBase);
      for (let y = s; y < e; y++) {
        const k = y * EW + ex, dd = D[k], yw = y + OY;
        if (MM && MM[y * PW + x]) {
          const mc = matCol(MM[y * PW + x], x, y, wx, yw, dd, ex);
          if (mc !== null) {
            put(x, y, mc);
            continue;
          }
        }
        const ugc = isUGp(x, y);
        const R5 = ugc ? rampOf(ugBase) : rampOf(regionBase);
        const dt = realTop ? y - s : 9999;
        let col;
        if (hasCap && dt < capN + drip) {
          // 덮개 (윤곽을 따라)
          if (soft) {
            if (dt === 0) col = CR[5];
            else if (dt === 1) col = cHi;
            else if (dt < 3) col = (wx + yw) % 3 === 0 && H(wx, yw, 15) > 0.5 ? cHi : mix(cHi, cTop, 0.45);
            else if (dt < capN - 1) col = cTop;
            else if (dt < capN) col = CR[3];
            else col = dt === capN + drip - 1 ? CR[5] : CR[4];
            // 덮개 옆(낭떠러지 끝)은 테두리
            dd <= 3 && dt > 0 && (col = CR[5]);
          } else col = dt === 0 ? RT[5] : dt === 1 ? RT[1] : RT[2];
          put(x, y, col);
          continue;
        }
        let L, ramp5 = R5;
        if (hasCap && dt < capN + drip + soilN) {
          // 흙층: 작은 자갈, 위쪽은 풀뿌리 그늘
          ramp5 = SOIL;
          L = lvq(wx * 1.3 + 900, yw * 1.3, 6);
          L = L === 5 ? (H(wx, yw, 96) < 0.5 ? 4 : 5) : Math.min(4, L + 1);
          dt < capN + drip + 2 && (L = Math.min(4, L + 1));
        } else {
          // 바위: 지층 지역은 결 따라 납작해지고 층 사이 금이 간다
          const layered = strata > 0 && !(ugc && BI);
          L = stoneL(wx, yw, ugc, layered && H(Math.floor((yw + bw) / BH), 91) < strata * 0.55);
          if (layered && L < 5) {
            // 층 사이 금은 군데군데 끊기고, 띠 밝기는 일부만 다르다 (벽돌 줄처럼 보이지 않게)
            const f = (yw + bw) / BH, band = Math.floor(f), fr = f - band;
            if (fr < 1 / BH && H(wx >> 3, band, 92) < strata * 0.6) L = Math.min(4, L + 2);
            else if (H(band, 93) < strata * 0.35) L = Math.max(0, L - 1);
          }
        }
        // 안쪽일수록 어둡게 (띠가 생기지 않게 점점이 섞이며 넘어간다)
        const dpx = dd / 3;
        if (L < 5 && dpx > 10) {
          const t = (dpx - 10) / 30, hv = H(wx, yw, 97);
          L = Math.min(4, L + (hv < t ? 1 : 0) + (hv < t - 0.55 ? 1 : 0));
        }
        // 테두리 + 바깥 방향에 따른 빛(왼쪽 위)과 그늘
        if (dd <= 3) L = 5;
        else if (dd <= 9) {
          const n = normal(ex, y);
          if (n) {
            const lit = n[0] * -0.6 + n[1] * -0.8, near = dd <= 6;
            const hi = ugc ? 1 : near ? 2 : 1;
            if (lit > 0.5) L = Math.max(0, L - hi);
            else if (lit > 0.2 && near) L = Math.max(0, L - 1);
            else if (lit < -0.45) L = Math.min(4, L + (near ? 2 : 1));
            else if (lit < -0.1 && near) L = Math.min(4, L + 1);
          }
        }
        col = ramp5[L];
        // 용암 지대: 틈새가 빛난다
        if (BI && ugc && ug.biome === "magma" && L === 5 && dd > 3 && H(wx >> 3, yw >> 3, 51) > 0.7) col = mix(0xff6a20, 0xffd060, H(wx, yw, 52) * 0.5);
        put(x, y, col);
      }
    }
  }
  // ── 5) 밑면에 매달린 돌·뿌리·덩굴·고드름 ──
  for (let ex = MP - 4; ex < MP + PW + 4; ex++) {
    if ((ex & 15) === 0) yield;
    const x = ex - MP, wx = X0 + x;
    for (let q = runOff[ex]; q < runOff[ex + 1]; q += 2) {
      const e = RUN[q + 1];
      if (e >= PH) continue;
      // 재질 구역(나무·벽돌 등) 밑면엔 돌 고드름이 없다
      if (MM && x >= 0 && x < PW && e > 0 && MM[(e - 1) * PW + x]) continue;
      const ew = e + OY, r = ew >> 4, ugc = isUGp(x, e);
      const R5 = ugc ? rampOf(ugBase) : rampOf(regionBase);
      const hv = H(wx >> 2, ew >> 2, 9);
      if (hv > 0.62) {
        const L = Math.floor(H(wx >> 2, ew >> 2, 10) * 6) + 2 - Math.abs((wx & 3) - 1.5) * 1.6;
        for (let k = 0; k < L; k++) {
          if (!empty(x, e + k)) break;
          const edge = k >= Math.floor(L) - 1 || (wx & 3) === 0;
          put(x, e + k, edge ? R5[5] : (wx & 3) === 1 ? R5[3] : R5[4]);
        }
      }
      if (!ugc && H(wx, r, 61) > 0.93) {
        // 섬 밑동의 뿌리
        const L2 = 8 + Math.floor(H(wx, r, 62) * 26);
        for (let k = 0; k < L2; k++) {
          const xx = ((k >> 2) + (wx & 1)) % 3 === 0 ? 1 : 0;
          empty(x + xx, e + k) && put(x + xx, e + k, k % 6 === 5 ? 0x7ab04a : k % 2 ? 0x5a3a22 : 0x6e4a2c);
        }
      } else if (!ugc && (th === "forest" || th === "kingdom") && H(wx, r, 31) > 0.88) {
        const L2 = 6 + Math.floor(H(wx, r, 32) * 22);
        for (let k = 0; k < L2; k++) {
          const xx = x + ((k >> 2) & 1 ? 1 : 0) - ((k >> 3) & 1 ? 1 : 0);
          empty(xx, e + k) && put(xx, e + k, k % 5 === 4 ? sh(P.top, 0.2) : sh(P.top, -0.35 + (k % 2) * 0.1));
        }
      } else if (!ugc && th === "snow" && H(wx >> 1, r, 33) > 0.72) {
        const L2 = 3 + Math.floor(H(wx >> 1, r, 34) * 10) - Math.abs((wx & 1) - 0.5) * 2;
        for (let k = 0; k < L2; k++) empty(x, e + k) && put(x, e + k, k < 2 ? 0xffffff : mix(0xc8ecff, 0x7ab8e8, k / L2));
      }
    }
  }
  // ── 5b) 특수 블럭: 나무판·구름(한쪽만 막는 발판), 물(반투명) ──
  if (S.spec && S.spec.length) {
    const MX2 = S.ox ?? X0;
    const PL = rampOf(mix(0xa07040, P.soil, 0.2)), CL = rampOf(0xf4f8ff), WA = mix(0x3a8ad8, P.sky ? P.sky[0] ?? 0x3a8ad8 : 0x3a8ad8, 0.25);
    for (const r of S.spec) {
      const x0 = Math.max(0, Math.floor(r.x0 - MX2)), x1 = Math.min(PW, Math.ceil(r.x1 - MX2));
      const y0 = Math.max(0, Math.floor(r.y0 - OY) - (r.t === 2 ? 6 : 0)), y1 = Math.min(PH, Math.ceil(r.y1 - OY));
      if (x0 >= x1 || y0 >= y1) continue;
      for (let x = x0; x < x1; x++) {
        const wx = MX2 + x;
        for (let y = y0; y < y1; y++) {
          const yw = OY + y, dy = yw - r.y0, dx = wx - r.x0, dr = r.x1 - 1 - wx;
          if (r.t === 1) {
            // 나무판: 윗줄 밝게, 판 이음매, 아랫줄 그늘
            const seam = (wx - r.x0) % 24 === 23;
            const L = dy === 0 ? 0 : dy === r.y1 - r.y0 - 1 || dx === 0 || dr === 0 ? 5 : seam ? 4 : dy % 8 === 4 ? 3 : (wx >> 3) % 2 ? 1 : 2;
            put(x, y, PL[L]);
          } else if (r.t === 2) {
            // 구름: 위로 볼록한 뭉게 (8px마다 높이가 다른 혹), 아래는 평평
            const bump = 2 + Math.floor(H(wx >> 3, r.y0, 71) * 5);
            if (dy < -bump) continue;
            const edge = dy === -bump || dx === 0 || dr === 0 || dy === r.y1 - r.y0 - 1;
            const L = edge ? 3 : dy < -bump + 3 ? 0 : dy > 10 ? 2 : 1;
            put(x, y, CL[L]);
          } else if (r.t === 3) {
            // 물: 반투명 파랑, 수면은 밝은 줄
            const k = y * PW + x;
            if (buf[k] && dy > 0) continue;
            const c = dy < 2 ? mix(WA, 0xffffff, 0.55) : dy < 4 ? mix(WA, 0xffffff, 0.25) : H(wx >> 2, yw >> 1, 72) > 0.97 ? mix(WA, 0xffffff, 0.3) : WA;
            const al = dy < 2 ? 230 : 150;
            buf[k] = ((al << 24) | ((c & 255) << 16) | (c & 0xff00) | ((c >> 16) & 255)) >>> 0;
          }
        }
      }
    }
  }
  // 입체 레이어용: 밟을 수 있는 것만 담은 그림
  const front = new Uint8ClampedArray(img.data);
  const wall = new Uint8ClampedArray(img.data.length);
  const wallBuf = new Uint32Array(wall.buffer);
  yield;
  // ── 6) 지하 뒷벽: 지표 아래, 위가 바위로 덮인 공기에만 (바위 가까이는 더 어둡게) ──
  if (ug.top * T < OY + PH) {
    const wallBase = BI ? BI.wall : mix(regionBase, 0x0e0a14, 0.7);
    const WR = rampOf(sh(wallBase, 0.08));
    for (let x = 0; x < PW; x++) {
      if ((x & 31) === 0) yield;
      const ex = x + MP, wx = X0 + x;
      const wallTop = SP ? surfAt(x) + 2 - OY : -1;
      // 지표에서 이만큼 아래는 땅속 (굴 입구처럼 위가 뚫려 있어도 뒷벽이 보인다)
      const deep = SP ? surfAt(x) + 26 - OY : -1;
      let prevEnd = -1;
      const n = runOff[ex + 1];
      for (let q = runOff[ex]; q <= n; q += 2) {
        const a = prevEnd, b = q < n ? RUN[q] : PH;
        // 공기 구간 [a, b): 위가 바위로 덮였거나 지표보다 충분히 깊은 곳만 (하늘이 뚫린 곳은 배경이 보인다)
        // 띠 맨 위부터 공기인 동굴(지표 없음)은 위가 바위로 덮여 있다고 본다
        const y0 = a > 0 ? Math.max(a, Math.ceil(wallTop)) : SP ? Math.max(0, Math.ceil(deep)) : OY > 0 && ug.top <= 0 ? 0 : PH;
        if (y0 < b)
          for (let y = y0; y < b && (a <= 0 || y - a < 960); y++) {
            const L0 = lvq(wx * 0.8 + 3000, (y + OY) * 0.8, 18);
            let L = L0 >= 5 ? 5 : L0 >= 3 ? 4 : 3;
            const da = DA[y * EW + ex];
            da <= 9 ? (L = 5) : da <= 18 && (L = Math.min(5, L + 1));
            wallBuf[y * PW + x] = pack(WR[L]);
          }
        prevEnd = q < n ? RUN[q + 1] : PH;
      }
    }
  }
  // ── 6b) 정해진 뒷벽 구역: 공기에만 ──
  if (S.walls && S.walls.length) {
    const WC = {
      wood: rampOf(mix(0x3a2416, P.soil, 0.2)),
      brick: rampOf(mix(mix(P.rock, 0xc0b098, 0.45), 0x1a1420, 0.6)),
      rock: rampOf(mix(regionBase, 0x2a2430, 0.45)),
      stem: rampOf(0xd8ccb0),
    };
    for (const r of S.walls) {
      const R6 = WC[r.m] ?? WC.rock;
      const x0 = Math.max(0, Math.floor(r.x0 - MX)), x1 = Math.min(PW, Math.ceil(r.x1 - MX));
      const y0 = Math.max(0, Math.floor(r.y0 - OY)), y1 = Math.min(PH, Math.ceil(r.y1 - OY));
      for (let y = y0; y < y1; y++)
        for (let x = x0; x < x1; x++) {
          const ex = x + MP;
          if (M[y * EW + ex] || wallBuf[y * PW + x]) continue;
          const wx = X0 + x, yw = y + OY;
          let L;
          if (r.m === "stem") L = (wx % 5 === 0 ? 2 : 1);
          else if (r.m === "wood") L = (wx + Math.floor(vn1(yw / 19, 41) * 5)) % 7 < 2 ? 4 : 3;
          else if (r.m === "brick") L = yw % 8 === 7 || (wx + (Math.floor(yw / 8) & 1 ? 8 : 0)) % 16 === 15 ? 5 : 3;
          else {
            const L0 = lvq(wx * 0.8 + 3000, yw * 0.8, 18);
            L = L0 >= 5 ? 4 : L0 >= 3 ? 3 : 2;
          }
          const da = DA[y * EW + ex];
          da <= 9 && (L = Math.min(5, L + 1));
          wallBuf[y * PW + x] = pack(R6[L]);
        }
    }
  }
  // ── 7) 장식 (실제 윤곽에) ──
  const decoFloor = (x, y, wx, r) => {
    const h = H(wx, r, 21);
    if (isUGp(x, y) && BI) {
      switch (ug.biome) {
        case "lush":
          if (h > 0.93) {
            const L = 4 + Math.floor(H(wx, 71) * 6);
            for (let k = 1; k <= L; k++) empty(x, y - k) && put(x, y - k, 0x3a7a2a);
            for (let dx = -3; dx <= 3; dx++) empty(x + dx, y - L - 1) && put(x + dx, y - L - 1, Math.abs(dx) === 3 ? 0x2a5a1e : 0x6ac040);
            for (let dx = -2; dx <= 2; dx++) empty(x + dx, y - L - 2) && put(x + dx, y - L - 2, 0x9ae060);
          } else if (h > 0.88) {
            for (let dy = 1; dy <= 4; dy++) for (let dx = -3; dx <= 3; dx++) Math.abs(dx) + dy < 6 && empty(x + dx, y - dy) && put(x + dx, y - dy, H(wx + dx, dy, 72) > 0.75 ? 0xf080c0 : dy > 2 ? 0x4a8a34 : 0x3a6a2a);
          } else if (h > 0.5) {
            const L = 1 + Math.floor(H(wx, 22) * 3);
            for (let k = 1; k <= L; k++) empty(x, y - k) && put(x, y - k, k === L ? 0xa8e070 : 0x5a9a3a);
          }
          break;
        case "drip":
          if (h > 0.92) {
            const L = 4 + Math.floor(H(wx, 73) * 12), w = 1 + Math.floor(L / 6);
            for (let k = 1; k <= L; k++) {
              const ww = Math.max(0, Math.round(w * (1 - k / L)));
              for (let dx = -ww; dx <= ww; dx++) empty(x + dx, y - k) && put(x + dx, y - k, dx < 0 ? 0xd8b088 : dx > 0 ? 0x6a4a30 : 0xa8845e);
            }
          }
          break;
        case "geode":
          if (h > 0.92) {
            const L = 3 + Math.floor(H(wx, 74) * 8);
            for (let k = 1; k <= L; k++) for (const dx of [-1, 0, 1]) (dx === 0 || k < L - 1) && empty(x + dx, y - k) && put(x + dx, y - k, dx < 0 ? 0xe0b0ff : dx > 0 ? 0x5a2a90 : 0x9a5ae0);
            empty(x, y - L - 1) && put(x, y - L - 1, 0xffffff);
          } else if (h > 0.84) for (let dx = -1; dx <= 1; dx++) empty(x + dx, y - 1) && put(x + dx, y - 1, 0xf0f0f8);
          break;
        case "deep":
          if (h > 0.72) {
            const w = 2 + Math.floor(H(wx, 75) * 4);
            for (let dx = 0; dx < w; dx++) put(x + dx, y, H(wx + dx, 76) > 0.6 ? 0x40fff0 : 0x0e6a6a);
            h > 0.95 && (put(x, y - 1, 0x0e6a6a), put(x, y - 2, 0x40fff0), put(x - 1, y - 2, 0x0e6a6a), put(x + 1, y - 2, 0x0e6a6a));
          }
          break;
        case "magma":
          if (h > 0.86) {
            put(x, y, 0xff8030);
            empty(x, y - 1) && put(x, y - 1, 0xffd060);
          }
          break;
      }
      return;
    }
    if (th === "forest" && h > 0.985) {
      const red = H(wx, 41) > 0.5;
      for (let k = 1; k <= 3; k++) empty(x, y - k) && put(x, y - k, 0xe8dcc0);
      for (const dx of [-2, -1, 0, 1, 2]) empty(x + dx, y - 4) && put(x + dx, y - 4, red ? 0xd8323a : 0xe0a040);
      for (const dx of [-1, 0, 1]) empty(x + dx, y - 5) && put(x + dx, y - 5, red ? 0xff6a5a : 0xffd070);
      empty(x, y - 4) && put(x, y - 4, 0xffffff);
    } else if ((th === "cave" || th === "kingdom") && h > 0.975) {
      const L = 3 + Math.floor(H(wx, 42) * 5);
      for (let k = 1; k <= L; k++) for (const dx of [0, 1]) empty(x + dx, y - k) && put(x + dx, y - k, dx ? mix(P.accent, 0x000000, 0.25) : mix(P.accent, 0xffffff, 0.35));
      empty(x, y - L - 1) && put(x, y - L - 1, 0xffffff);
    } else if (th === "desert" && h > 0.985) {
      for (let k = 1; k <= 5; k++) empty(x, y - k) && put(x, y - k, 0x5a9a3a);
      empty(x - 1, y - 3) && put(x - 1, y - 3, 0x5a9a3a);
      empty(x + 1, y - 4) && put(x + 1, y - 4, 0x5a9a3a);
    } else if (cap === "grass" && h > 0.5) {
      const L = 2 + Math.floor(H(wx, 22) * 4);
      for (let k = 1; k <= L; k++) empty(x, y - k) && put(x, y - k, k === L ? P.topHi : k > L / 2 ? P.top : sh(P.top, -0.25));
      h > 0.965 && (empty(x, y - L - 1) && put(x, y - L - 1, P.accent), empty(x - 1, y - L) && put(x - 1, y - L, P.accent), empty(x + 1, y - L) && put(x + 1, y - L, P.accent));
    } else if (cap === "snow" && h > 0.9) empty(x, y - 1) && put(x, y - 1, 0xffffff);
  };
  const decoCeil = (x, y, wx, r) => {
    if (!(isUGp(x, y) && BI)) return;
    const h = H(wx, r, 81);
    switch (ug.biome) {
      case "lush":
        if (h > 0.9) {
          const L = 8 + Math.floor(H(wx, r, 82) * 40);
          for (let k = 0; k < L; k++) {
            const xx = x + (((k >> 2) + wx) & 1 ? 1 : 0) - (((k >> 3) + wx) & 1 ? 1 : 0);
            if (!empty(xx, y + k)) break;
            put(xx, y + k, k % 2 ? 0x3a7a2a : 0x4e9a34);
            k % 7 === 5 && (put(xx + 1, y + k, 0xffb040), put(xx + 1, y + k + 1, 0xffe080));
          }
        } else if (h > 0.86) {
          for (const [dx, dy] of [[0, 0], [-1, 1], [1, 1], [0, 1], [-2, 2], [2, 2], [0, 2]]) empty(x + dx, y + dy) && put(x + dx, y + dy, dy === 2 ? 0xff70b0 : 0x6a9a3a);
        }
        break;
      case "drip":
      case "geode":
        if (h > 0.84) {
          const L = 5 + Math.floor(H(wx, r, 83) * 18), w = 1 + Math.floor(L / 7);
          const geo = ug.biome === "geode";
          for (let k = 0; k < L; k++) {
            const ww = Math.max(0, Math.round(w * (1 - k / L)));
            for (let dx = -ww; dx <= ww; dx++) empty(x + dx, y + k) && put(x + dx, y + k, geo ? (dx < 0 ? 0xe0b0ff : dx > 0 ? 0x5a2a90 : 0x9a5ae0) : dx < 0 ? 0xd8b088 : dx > 0 ? 0x6a4a30 : 0xa8845e);
          }
        }
        break;
      case "deep":
        h > 0.9 && [0, 1, 2].forEach((k) => empty(x, y + k) && put(x, y + k, k === 2 ? 0x40fff0 : 0x0e3a3a));
        break;
      case "magma":
        h > 0.9 && [0, 1, 2, 3].forEach((k) => empty(x, y + k) && put(x, y + k, k > 1 ? 0xff8030 : 0x3a1a10));
        break;
    }
  };
  for (let ex = MP - 6; ex < MP + PW + 6; ex++) {
    if ((ex & 15) === 0) yield;
    const x = ex - MP, wx = X0 + x;
    for (let q = runOff[ex]; q < runOff[ex + 1]; q += 2) {
      const s = RUN[q], e = RUN[q + 1];
      if (s > 0) {
        const l = topNear(ex - 3, s), r = topNear(ex + 3, s);
        const sl = l >= 0 && r >= 0 ? (r - l) / 6 : 9;
        // 완만한 윗면에만 (가파른 비탈·벼랑 끝엔 안 자란다)
        Math.abs(sl) < 1.1 && decoFloor(x, s, wx, (s + OY) >> 4);
      }
      e < PH && decoCeil(x, e, wx, (e + OY) >> 4);
    }
  }
  return { img, front, wall };
}
