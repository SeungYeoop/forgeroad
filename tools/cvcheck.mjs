// 손 설계 땅속 검사 (생성 전에): 방 겹침 · 던전과 겹침 · 비탈 굴 기하(가로 틈 ≥ 높이 차 + 48) · 굴 지나는 자리의 다른 방
//   · 굴끼리 교차 · 한 문(방 옆면)에 굴 둘 · 구멍 · 모든 방이 입구와 이어지나 (던전 동굴 문 포함)
//   node --import ./tools/json-hook.mjs tools/cvcheck.mjs g1_1
import { BLUEPRINTS } from "../src/forge/natbp.js";
const id = process.argv[2] || "g1_1";
const bp = BLUEPRINTS[id];
const C = bp.caves.map((q) => ({ ...q })), by = {};
for (const q of C) by[q.id] = q;
const bad = [];
// 던전: 동굴 문을 작은 방처럼
const D = bp.dungeon;
let dbox = null;
if (D) {
  const GX = Math.round(D.x0 / 8), GY = Math.round(D.y0 / 8), cols = D.cols ?? 6, st = D.stories ?? 8;
  const colX = (c) => GX + c * 64, floorR = (s) => GY + (s + 1) * 48 - 4;
  dbox = [D.x0 - 32, D.y0 - 16, colX(cols) * 8 + 32, (GY + st * 48) * 8 + 16];
  // 정문 탑: 그 열만 문 높이부터
  if (D.gate) { const gr = D.gate.row ?? 4800; C.push({ id: "정문탑", x0: (colX(D.gate.col) + 12) * 8, x1: (colX(D.gate.col) + 52) * 8, fy: D.y0, h: D.y0 - gr + 110, tower: 1 }); }
  const door = (id2, east, F) => {
    const x = east ? (colX(cols) + 3) * 8 : id2 === "VG" ? (colX(D.gate.col) + 12 - 3) * 8 : (colX(0) - 3) * 8;
    by[id2] = { id: id2, x0: x, x1: x, fy: F * 8, h: 96, door: 1, east };
  };
  if (D.gate?.cave) door("VG", 0, Math.round((D.gate.row ?? 4800) / 16) * 2);
  for (const r of D.rooms) r.cave === "E" ? door(r.id, 1, floorR(r.s)) : r.cave && door(r.id, 0, floorR(r.s));
  for (const t of D.towers ?? []) {
    for (const [k, e] of [[t.cave, 0], [t.caveE, 1]]) {
      if (!k) continue;
      k !== "down" && door(t.id, e, floorR(t.s));
      k !== "up" && door(k === "both" ? t.id + "_d" : t.id, e, floorR(t.s + 1));
    }
  }
}
const box = (q) => [q.x0, q.fy - q.h * 1.05, q.x1, q.fy + 40];
const isRoom = (q) => !q.tower;
for (let i = 0; i < C.length; i++) {
  for (let j = i + 1; j < C.length; j++) {
    const [a0, b0, a1, b1] = box(C[i]), [c0, d0, c1, d1] = box(C[j]);
    if ((C[i].tower && C[j].peak) || (C[j].tower && C[i].peak)) continue;
    if (a0 < c1 + 48 && c0 < a1 + 48 && b0 < d1 + 48 && d0 < b1 + 48) bad.push(`겹침 ${C[i].id} ${C[j].id}`);
  }
  if (dbox && isRoom(C[i])) { const [a0, b0, a1, b1] = box(C[i]); if (a0 < dbox[2] && dbox[0] < a1 && b0 < dbox[3] && dbox[1] < b1) bad.push(`던전과 겹침 ${C[i].id}`); }
}
for (const q of C.filter(isRoom)) if (q.x0 < 8 || q.x1 > 8120 || q.fy > 8320 || q.fy - q.h < 120) bad.push(`범위 밖 ${q.id}`);
const par = {};
const find = (a) => (par[a] == null || par[a] === a ? ((par[a] = a), a) : (par[a] = find(par[a])));
const uni = (a, b) => (par[find(a)] = find(b));
for (const q of C) q.entry && uni(q.id, "OUT");
if (D) {
  // 던전 안은 한 덩어리로 보고 정문은 바깥(오른쪽 입구)과 이어진다고 본다
  for (const k of Object.keys(by)) by[k].door && uni(k, "DUN");
  D.gate && uni("DUN", "OUT");
  // 정문 탑 꼭대기 복도 = ▲ 방
  D.gate && C.filter((q) => q.peak).forEach((q) => uni(q.id, "DUN"));
}
const side = {}, segs = [];
const use = (q, s2, lk) => { const k = q.id + s2; (side[k] ??= []).push(lk); };
for (const [a, b] of bp.links ?? []) {
  const A = by[a], B = by[b];
  if (!A || !B) { bad.push(`없는 방 ${a}-${b}`); continue; }
  const [L, R] = A.x1 <= B.x0 ? [A, B] : [B, A];
  const gap = R.x0 - L.x1, dy = Math.abs(R.fy - L.fy);
  if (L.x1 > R.x0) { bad.push(`비탈 불가(가로 겹침) ${a}-${b}`); continue; }
  if (gap < dy + 48) bad.push(`비탈 가파름 ${a}-${b} 틈 ${gap} 높이차 ${dy}`);
  else if (gap > 1700) bad.push(`비탈 너무 김 ${a}-${b} ${gap}`);
  for (const q of C) {
    if (q === L || q === R) continue;
    let hit = 0;
    for (let x = Math.max(L.x1, q.x0 - 16); x <= Math.min(R.x0, q.x1 + 16) && !hit; x += 16) {
      const lo = Math.max(Math.min(L.fy, R.fy), L.fy - (x - L.x1), R.fy - (R.x0 - x)), hi = Math.min(Math.max(L.fy, R.fy), L.fy + (x - L.x1), R.fy + (R.x0 - x));
      if (lo - 128 < q.fy + 40 && hi + 8 > q.fy - q.h) hit = 1;
    }
    hit && bad.push(`굴이 ${q.id}를 지남: ${a}-${b}`);
  }
  if (dbox && !L.door && !R.door) {
    const x0 = L.x1, x1 = R.x0, y0 = Math.min(L.fy, R.fy) - 130, y1 = Math.max(L.fy, R.fy);
    if (x0 < dbox[2] && dbox[0] < x1 && y0 < dbox[3] && dbox[1] < y1) bad.push(`굴이 던전을 지남: ${a}-${b}`);
  }
  use(L, "R", `${a}-${b}`), use(R, "L", `${a}-${b}`);
  segs.push([L.x1, L.fy, R.x0, R.fy, `${a}-${b}`]);
  uni(a, b);
}
for (const [k, v] of Object.entries(side)) v.length > 1 && bad.push(`한 문에 굴 ${v.length}개 (${k}): ${v.join(" ")}`);
// 굴 교차 (두 굴 중심선이 끝점 아닌 데서 만나거나 120px 안으로 붙음)
const cross = (p, q) => {
  const [x1, y1, x2, y2] = p, [x3, y3, x4, y4] = q;
  const lo = Math.max(x1, x3) + 24, hi = Math.min(x2, x4) - 24;
  if (lo >= hi) return 0;
  const yA = (x) => y1 + ((y2 - y1) * (x - x1)) / (x2 - x1 || 1), yB = (x) => y3 + ((y4 - y3) * (x - x3)) / (x4 - x3 || 1);
  for (let x = lo; x <= hi; x += 16) if (Math.abs(yA(x) - yB(x)) < 150) return 1;
  return 0;
};
for (let i = 0; i < segs.length; i++) for (let j = i + 1; j < segs.length; j++) cross(segs[i], segs[j]) && bad.push(`굴 교차 ${segs[i][4]} × ${segs[j][4]}`);
for (const [a, b] of bp.drops ?? []) {
  const U = by[a], Dn = by[b];
  if (!U || !Dn) { bad.push(`없는 방 구멍 ${a}-${b}`); continue; }
  const ov = Math.min(U.x1, Dn.x1) - Math.max(U.x0, Dn.x0), rock = Dn.fy - Dn.h - U.fy;
  if (ov < 200) bad.push(`구멍 겹침 부족 ${a}-${b}`);
  if (rock < 40 || rock > 600) bad.push(`구멍 바위 두께 ${a}-${b} ${Math.round(rock)}`);
}
const off = Object.keys(by).filter((k) => !by[k].tower && find(k) !== find("OUT"));
off.length && bad.push(`입구와 끊긴 방: ${off.join(",")}`);
const pk = C.find((q) => q.peak), dp = C.find((q) => q.deep);
!pk && bad.push("▲ 방 없음"), !dp && bad.push("▼ 방 없음");
pk && !(pk.x0 + 60 < 4352 && pk.x1 - 60 > 4352) && bad.push("▲ 방이 x 4352를 안 품음");
dp && !(dp.x0 + 60 < 3328 && dp.x1 - 60 > 3328) && bad.push("▼ 방이 x 3328을 안 품음");
console.log(id, "방", C.length, "길", (bp.links ?? []).length, "구멍", (bp.drops ?? []).length, D ? `던전 ${JSON.stringify(dbox)}` : "");
if (D) console.log("동굴 문", Object.values(by).filter((q) => q.door).map((q) => `${q.id}@${q.x0},${q.fy}`).join(" "));
console.log(bad.length ? bad.join("\n") : "문제 없음");
