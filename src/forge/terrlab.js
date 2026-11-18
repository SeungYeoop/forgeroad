// 지형 실험실 (terrain-lab.html): 한 구역을 여러 시드로 만들어 실제 게임 그림·길찾기 구조를 나란히 비교한다
import { ZONES, upChunk, downChunk } from "./zones.js";
import { planOf, drawChunk, FLOOR, FT } from "./natgen.js";
import { pixFine, fineSlice } from "./terrfine.js";
import { PROFILES, profileKey, biomeOf } from "./terrprof.js";

const $ = (s) => document.querySelector(s);
const q = new URLSearchParams(location.search);
const LAYER = (z) => (z.kind === "dungeon" ? "숨은 던전" : z.y < 0 ? "하늘" : z.y > 0 ? "지하" : "지상");
// 구역 고르기 (층별로 묶어서)
{
  const sel = $("#zone");
  const groups = {};
  for (const z of ZONES) (groups[LAYER(z)] ??= []).push(z);
  for (const name of ["지상", "하늘", "지하", "숨은 던전"]) {
    const g = document.createElement("optgroup");
    g.label = name;
    for (const z of groups[name] ?? []) {
      const o = document.createElement("option");
      o.value = z.id;
      o.textContent = `${z.name} (${z.x},${z.y}) · ${PROFILES[profileKey(z)].name}${z.boss ? " · 보스" : ""}`;
      g.appendChild(o);
    }
    sel.appendChild(g);
  }
  sel.value = q.get("zone") ?? "g1_0";
  // 시드를 주지 않으면 게임 저장의 세계 시드 (게임에서 보는 지형과 같은 모양)
  let mySeed = null;
  try {
    mySeed = JSON.parse(localStorage.getItem("forgeroad_save") ?? "null")?.fr?.worldSeed ?? null;
  } catch {}
  if (q.get("seeds")) $("#seeds").value = q.get("seeds");
  else if (mySeed != null) $("#seeds").value = String(mySeed >>> 0);
  q.get("view") && ($("#view").value = q.get("view"));
  q.get("scale") && ($("#scale").value = q.get("scale"));
}
const frame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));

function paintZone(P, z, o) {
  const cv = document.createElement("canvas");
  cv.width = P.WP;
  cv.height = P.HP;
  const ctx = cv.getContext("2d");
  const sky = ctx.createLinearGradient(0, 0, 0, P.HP);
  sky.addColorStop(0, "#5a8fd8");
  sky.addColorStop(0.6, "#9cc8f0");
  sky.addColorStop(1, "#d8ecf8");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, P.WP, P.HP);
  const tmp = document.createElement("canvas");
  tmp.width = 512;
  tmp.height = P.HP;
  const tc = tmp.getContext("2d");
  const region = { pal: z.reg.pal, theme: z.reg.theme };
  for (let S = z.c0; S < z.c1; S++) {
    const r = new Uint8Array(32 * FT), l = new Array(32), s = new Array(32);
    const ch = drawChunk(P, z, S, r, l, s, { ...o, fe: 1, ze: 0, arena: !1 });
    const g = pixFine({ ug: ch.ug }, S * 32, region, fineSlice(ch));
    let st;
    do st = g.next(); while (!st.done);
    const { img, wall } = st.value;
    const x = (S - z.c0) * 512;
    tc.putImageData(new ImageData(wall, 512, P.HP), 0, 0);
    ctx.drawImage(tmp, x, 0);
    tc.putImageData(img, 0, 0);
    ctx.drawImage(tmp, x, 0);
  }
  return cv;
}
function graphZone(P) {
  const cv = document.createElement("canvas");
  cv.width = P.WP;
  cv.height = P.HP;
  const ctx = cv.getContext("2d");
  const im = ctx.createImageData(P.WP, P.HP), d = im.data;
  const rock = P.kind === "cave" ? [106, 96, 112] : P.kind === "sky" ? [154, 138, 122] : [138, 106, 80];
  for (let y = 0; y < P.HP; y++)
    for (let x = 0; x < P.WP; x++) {
      const k = (y * P.WP + x) * 4, s = P.F.solid(x, y);
      const c = s ? rock : P.kind === "cave" ? [24, 20, 30] : [200, 222, 240];
      d[k] = c[0];
      d[k + 1] = c[1];
      d[k + 2] = c[2];
      d[k + 3] = 255;
    }
  ctx.putImageData(im, 0, 0);
  const A = P.A;
  for (let n = 0; n < A.NN; n++) {
    ctx.fillStyle = !A.reach[n] ? "#888" : A.co[n] ? "#2fd05a" : "#ff3ad0";
    ctx.fillRect(A.nC[n] * 8 + 1, A.nY[n] - 4, 6, 4);
  }
  const dot = (x, y, c) => ((ctx.fillStyle = c), ctx.fillRect(x - 8, y - 16, 16, 16));
  dot(44, FLOOR * 16, "#3060ff");
  dot(P.WP - 56, FLOOR * 16, "#ff3030");
  P.peak && dot(P.peak.x, P.peak.y, "#ffe030");
  P.deep && dot(P.deep.x, P.deep.y, "#ff8a20");
  return cv;
}
// 윗면 경사 분포 (8px마다 이웃 바닥과의 기울기): 예전 칸 지형은 0°·45° 두 가지뿐이었다
function slopeHist(P) {
  const C = P.A.C, bins = new Array(7).fill(0);
  for (let c = 0; c < C.NC - 1; c++)
    for (let k = C.ivS[c]; k < C.ivS[c + 1]; k++) {
      const t = C.top[k];
      if (t <= 0) continue;
      let best = 1e9;
      for (let m = C.ivS[c + 1]; m < C.ivS[c + 2]; m++) {
        const dy = C.top[m] - t;
        Math.abs(dy) < Math.abs(best) && (best = dy);
      }
      if (Math.abs(best) > 16) continue;
      const deg = (Math.atan2(Math.abs(best), 8) * 180) / Math.PI;
      bins[Math.min(6, Math.floor((deg + 5) / 10))]++;
    }
  return bins;
}
async function run() {
  const z = ZONES.find((v) => v.id === $("#zone").value);
  const seeds = $("#seeds").value.split(",").map((s) => parseInt(s.trim(), 10)).filter(Number.isFinite);
  const view = $("#view").value, scale = Number($("#scale").value);
  history.replaceState(null, "", `?zone=${z.id}&seeds=${seeds.join(",")}&view=${view}&scale=${scale}`);
  const out = $("#out");
  out.innerHTML = "";
  const o = { Ft: FT, up: z.kind === "zone" ? upChunk(z) : -1, down: z.kind === "zone" ? downChunk(z) : -1, biome: biomeOf(z), patterns: z.y === 0 ? z.reg?.patterns : null };
  for (const seed of seeds) {
    $("#busy").textContent = `시드 ${seed} 만드는 중…`;
    await frame();
    const t0 = performance.now();
    const P = planOf(z, { ...o, seed });
    const ms = performance.now() - t0;
    const full = view === "paint" ? paintZone(P, z, { ...o, seed }) : graphZone(P);
    const card = document.createElement("div");
    card.className = "card";
    const prof = PROFILES[P.pkey];
    const ch = P.check;
    const reach = P.A.reach.reduce((s, v) => s + v, 0);
    card.innerHTML = `<h2>시드 ${seed} <span class="tag">${z.name} · ${LAYER(z)} · ${prof.name}</span></h2>`;
    const vc = document.createElement("canvas");
    vc.width = Math.round(P.WP * scale);
    vc.height = Math.round(P.HP * scale);
    const vx = vc.getContext("2d");
    vx.imageSmoothingEnabled = scale < 1;
    vx.drawImage(full, 0, 0, vc.width, vc.height);
    vc.onclick = () => {
      const zm = $("#zoom");
      zm.innerHTML = "";
      zm.appendChild(full);
      zm.style.display = "block";
    };
    card.appendChild(vc);
    const st = document.createElement("div");
    st.className = "stats";
    const goal = (id, label) => (P.A.goals.some((g) => g.id === id) ? `<span class="${ch.miss.includes(id) ? "bad" : "ok"}">${label} ${ch.miss.includes(id) ? "못 닿음" : "닿음"}</span>` : "");
    st.innerHTML = `<span>만든 시간 <b>${ms.toFixed(0)}ms</b>${P.tries.length > 1 ? ` (설계 ${P.tries.length}번)` : ""}</span>
      <span>자연스럽게 고친 곳 <b>${P.repairs}</b></span>
      ${goal("R", "▶ 출구")} ${goal("U", "▲ 문")} ${goal("D", "▼ 문")}
      <span class="${ch.traps ? "bad" : "ok"}">갇히는 곳 ${ch.traps}</span>
      <span>바닥 마디 <b>${P.A.NN}</b> · 갈 수 있음 <b>${Math.round((100 * reach) / Math.max(1, P.A.NN))}%</b></span>
      <span>섬 <b>${P.islands.length}</b></span>`;
    card.appendChild(st);
    const bins = slopeHist(P), mx = Math.max(...bins, 1);
    const hw = document.createElement("div");
    hw.className = "histwrap";
    hw.innerHTML = `<div class="stats" style="padding-bottom:2px">윗면 경사 분포 (예전 칸 지형: 0°·45° 두 가지뿐)</div><div class="hist">${bins
      .map((b, i) => `<div style="height:${Math.max(2, (b / mx) * 36)}px" title="${b}"><span>${i === 6 ? "55°+" : `${i * 10}°`}</span></div>`)
      .join("")}</div>`;
    card.appendChild(hw);
    out.appendChild(card);
  }
  $("#busy").textContent = "";
}
$("#go").onclick = run;
$("#zoom").onclick = () => ($("#zoom").style.display = "none");
run();
