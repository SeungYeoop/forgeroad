// 장치 (자연 지형 구역): 플레이어가 다루는 것과 살아 움직이는 지형
//   이동 (devMove — main.js 플레이어 update가 부른다):
//     사다리(6)·밧줄(7)·덩굴(8): 위·아래 키로 매달려 오르내린다, 점프(스페이스)로 뛰어내린다, 꼭대기에서 올라선다
//     짚라인(9): 줄 밑에서 위 키(W·↑)를 누르고 있으면 매달려 낮은 쪽으로 미끄러진다, 점프·아래 키로 놓는다
//     바람 기둥(10): 들어가면 떠오른다 (아래 키로 천천히 내려간다) · 물살(11·12): 물속에서 한쪽으로 떠밀린다
//   움직이는 지형 (update — 매 프레임, 화면 근처만):
//     무너지는 발판(13): 밟으면 흔들리다 떨어지고 잠시 뒤 다시 생긴다
//     금 간 벽(14): 때려서 부수면 숨은 길이 열린다 (그 판 동안)
//     승강기(15): 발판이 길 위아래 끝을 오가며 태워 나른다
//     떨어지는 종유석(16): 밑을 지나면 떨어져 다친다, 다시 자란다
//     간헐천(17): 몇 초마다 물기둥(포자)이 뿜어 높이 띄운다
let R = null;
export const bindDevices = (r) => (R = r);
const near = (v, t, d) => (v < t ? Math.min(t, v + d) : Math.max(t, v - d));

// ── 플레이어 이동 ──
export function devMove(pl, C, T, dt, spd, h) {
  const W = pl.host?.world ?? pl.host?.collider;
  if (!W || !W.devAt) return;
  const d = W.devAt(C);
  pl.zipT = Math.max(0, (pl.zipT ?? 0) - dt);
  // 짚라인
  if (pl.zip) {
    const r = pl.zip.r, lo = Math.min(r.ax, r.bx), hi = Math.max(r.ax, r.bx), zx = d.zx;
    const end = pl.zip.dir > 0 ? zx >= hi - 6 : zx <= lo + 6;
    if (end || (T.jump && pl.zipT <= 0) || T.down || C.hitWall || zx < lo - 20 || zx > hi + 20) {
      pl.zip = null;
      T.jump && pl.zipT <= 0 && (C.vy = -420);
      pl.airJumps = Math.max(pl.airJumps, 1);
    } else {
      const slope = hi > lo ? Math.abs(r.by - r.ay) / (hi - lo) : 0;
      pl.zip.v = Math.min(200 + slope * 260, pl.zip.v + (240 + slope * 500) * dt);
      const nx = zx + pl.zip.dir * pl.zip.v * dt;
      const ly = hi > lo ? r.ay + ((r.by - r.ay) * (nx - r.ax)) / (r.bx - r.ax) : r.ay;
      C.vx = pl.zip.dir * pl.zip.v;
      C.vy = (ly + (C.h ?? 22) + 3 - C.y) / Math.max(dt, 1 / 120);
      pl.facing = pl.zip.dir;
      pl.airJumps = 1 + (pl.run?.extraJumps ?? 0);
      return;
    }
  } else if (d.zip && T.up && !C.onGround) {
    const r = d.zip;
    const dir = r.ay === r.by ? (h || pl.facing || 1) : Math.sign((r.ay > r.by ? r.ax : r.bx) - (r.ay > r.by ? r.bx : r.ax));
    pl.zip = { r, dir, v: Math.max(120, Math.abs(C.vx)) };
    pl.zipT = 0.3;
    pl.climb = 0;
    R?.j.play("swing", 0.7);
    return;
  }
  // 매달리기
  const cl = d.sp === 6 || d.sp === 7 || d.sp === 8;
  if (pl.climb && !cl) {
    pl.climb = 0;
    // 꼭대기: 위로 살짝 뛰어 바닥에 올라선다
    T.up && C.vy <= 0 && (C.vy = -300);
  }
  if (!pl.climb && cl && (T.up || (T.down && !C.onGround) || (T.down && C.onGround))) {
    pl.climb = 1;
    C.vx *= 0.3;
  }
  if (pl.climb) {
    if (T.jump && !T.up) {
      pl.climb = 0;
      C.vy = -430;
      C.vx = h * spd;
      return;
    }
    const sp = d.sp === 8 ? 95 : 125;
    C.vy = T.up ? -sp : T.down ? sp + 15 : 0;
    C.vx = h * (d.sp === 8 ? 80 : 60);
    T.down && (C.dropThrough = 0.15);
    pl.airJumps = 1 + (pl.run?.extraJumps ?? 0);
    h && (pl.facing = h);
    return;
  }
  // 바람 기둥
  if (d.wind) {
    C.vy = near(C.vy, T.down ? 70 : -(d.wind.pow ?? 250), 1500 * dt);
    pl.airJumps = Math.max(pl.airJumps, 1);
  }
  // 물살
  if (d.cur && C.inWater) C.vx = Math.max(-spd - 110, Math.min(spd + 110, C.vx + d.cur * 560 * dt));
}

// ── 움직이는 지형 ──
function mkTex(sc) {
  if (sc.textures.exists("dv_plank")) return;
  const cv = (k, w, h, f) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    f(c.getContext("2d"), w, h);
    sc.textures.addCanvas(k, c);
  };
  // 무너지는 판: 금 간 나무판 (8px 높이, 8px 단위로 이어 붙인다)
  cv("dv_plank", 16, 8, (x) => {
    x.fillStyle = "#8a6038"; x.fillRect(0, 0, 16, 8);
    x.fillStyle = "#b08050"; x.fillRect(0, 0, 16, 2);
    x.fillStyle = "#5a3a20"; x.fillRect(0, 7, 16, 1); x.fillRect(15, 0, 1, 8);
    x.fillStyle = "#3a2414"; x.fillRect(5, 2, 1, 3); x.fillRect(6, 4, 2, 1); x.fillRect(11, 3, 1, 3);
  });
  // 금 간 벽 (16px 무늬): 밝은 금 + 부스러기
  cv("dv_crack", 16, 16, (x) => {
    x.fillStyle = "#6a6070"; x.fillRect(0, 0, 16, 16);
    x.fillStyle = "#7c7284"; x.fillRect(1, 1, 7, 6); x.fillRect(9, 8, 6, 7);
    x.fillStyle = "#4a4250"; x.fillRect(0, 7, 16, 1); x.fillRect(8, 0, 1, 16);
    x.fillStyle = "#e8d8a0"; x.fillRect(3, 3, 1, 1); x.fillRect(4, 4, 1, 2); x.fillRect(5, 6, 2, 1); x.fillRect(7, 7, 1, 2); x.fillRect(10, 9, 2, 1); x.fillRect(12, 10, 1, 2);
  });
  // 승강기 발판
  cv("dv_lift", 16, 10, (x) => {
    x.fillStyle = "#6a4a2c"; x.fillRect(0, 0, 16, 10);
    x.fillStyle = "#9a7048"; x.fillRect(0, 0, 16, 3);
    x.fillStyle = "#3a281a"; x.fillRect(0, 9, 16, 1);
    x.fillStyle = "#b0b0b8"; x.fillRect(0, 4, 16, 1);
  });
  cv("dv_cable", 2, 8, (x) => ((x.fillStyle = "#8a8a90"), x.fillRect(0, 0, 1, 8), (x.fillStyle = "#c0c0c8"), x.fillRect(1, 0, 1, 4)));
  // 종유석 (떨어지는 것): 위가 넓은 뾰족돌
  cv("dv_stal", 12, 28, (x) => {
    for (let y = 0; y < 28; y++) {
      const w = Math.max(1, Math.round(6 * (1 - y / 28)));
      x.fillStyle = y < 3 ? "#8a8494" : "#a8a0b0"; x.fillRect(6 - w, y, w * 2, 1);
      x.fillStyle = "#6a6474"; x.fillRect(6 + w - 1, y, 1, 1);
    }
  });
  cv("dv_px", 2, 2, (x) => ((x.fillStyle = "#fff"), x.fillRect(0, 0, 2, 2)));
}
const KEYGONE = new Set(); // 부서진 벽 (구역:자리) — 그 판 동안
function build(sc, src) {
  const A = { key: src.key, items: [], parts: [] };
  for (const r of src.P.spec ?? []) {
    if (r.t === 13) A.items.push({ k: "crumble", r, st: "solid", t: 0, spr: null });
    else if (r.t === 14) A.items.push({ k: "crack", r, hp: r.hp ?? 3, cd: 0, gone: KEYGONE.has(src.key + ":" + r.x0 + ":" + r.y0), spr: null });
    else if (r.t === 15) A.items.push({ k: "lift", r, y: r.y1 - 0, dir: -1, wait: 1, spr: null, cab: null });
    else if (r.t === 16) A.items.push({ k: "fall", r, st: "hang", y: r.y0, vy: 0, t: 0, spr: null });
    else if (r.t === 17) A.items.push({ k: "geyser", r, t: (r.x0 % 7) * 0.4, on: 0 });
  }
  return A;
}
function hide(it) {
  it.spr && it.spr.setVisible(false);
  it.cab && it.cab.setVisible(false);
}
export function update(sc, dt, src) {
  if (!R || !sc.world || !sc.player) return;
  const W = sc.world;
  if (!src) {
    if (sc._dv) for (const it of sc._dv.items) hide(it);
    W.dyn && (W.dyn.length = 0);
    return;
  }
  mkTex(sc);
  if (!sc._dv || sc._dv.key !== src.key || sc._dv.scene !== sc) {
    if (sc._dv) for (const it of sc._dv.items) (it.spr && it.spr.destroy(), it.cab && it.cab.destroy());
    sc._dv = build(sc, src);
    sc._dv.scene = sc;
  }
  const A = sc._dv, ox = src.ox;
  const pl = sc.player, B = pl.body, px = B.x - ox, py = B.y;
  const cam = sc.cameras.main, M = 400;
  const vx0 = cam.scrollX - ox - M, vx1 = cam.scrollX + cam.width / cam.zoom - ox + M, vy0 = cam.scrollY - M, vy1 = cam.scrollY + cam.height / cam.zoom + M;
  // 전역 픽셀 = 구역 좌표 + 구역 왼쪽 끝 전역 픽셀
  const GX = src.gx0;
  const dyn = (W.dyn ??= []);
  dyn.length = 0;
  const standing = (x0, x1, top) => B.onGround && px >= x0 - 3 && px <= x1 + 3 && Math.abs(py - top) <= 2;
  const atk = pl.weapons?.attacking?.() ?? false;
  for (const it of A.items) {
    const r = it.r, vis = r.x1 > vx0 && r.x0 < vx1 && r.y1 > vy0 && r.y0 < vy1;
    if (it.k === "crumble") {
      if (it.st === "solid" && standing(r.x0, r.x1, r.y0)) ((it.st = "shake"), (it.t = 0.55), R.j.play("block", 0.5));
      else if (it.st === "shake" && (it.t -= dt) <= 0) ((it.st = "gone"), (it.t = 3.2));
      else if (it.st === "gone" && (it.t -= dt) <= 0) {
        const inside = px > r.x0 - 8 && px < r.x1 + 8 && py > r.y0 && py - 24 < r.y1;
        inside ? (it.t = 0.5) : (it.st = "solid");
      }
      it.st !== "gone" && dyn.push({ on: 1, x0: GX + r.x0, x1: GX + r.x1, y0: r.y0, y1: r.y1 });
      if (!vis) { hide(it); continue; }
      it.spr ??= sc.add.tileSprite(0, 0, r.x1 - r.x0, r.y1 - r.y0, "dv_plank").setOrigin(0, 0).setDepth(2.4);
      const sh = it.st === "shake" ? (Math.random() - 0.5) * 2 : 0;
      it.spr.setVisible(it.st !== "gone").setPosition(ox + r.x0 + sh, r.y0 + (it.st === "shake" ? Math.random() : 0)).setAlpha(it.st === "gone" ? 0 : 1);
    } else if (it.k === "crack") {
      if (it.gone) { hide(it); continue; }
      it.cd = Math.max(0, it.cd - dt);
      dyn.push({ on: 1, x0: GX + r.x0, x1: GX + r.x1, y0: r.y0, y1: r.y1 });
      // 때리기: 공격 중이고 바라보는 쪽 40px 안
      if (atk && it.cd <= 0) {
        const f = pl.facing ?? 1, ex = f > 0 ? r.x0 - px : px - r.x1;
        if (ex > -6 && ex < 40 && py > r.y0 && py - 22 < r.y1) {
          it.hp--, (it.cd = 0.3);
          sc.fx?.burst?.("chunk", ox + (f > 0 ? r.x0 : r.x1), py - 12, 5, 0x9a90a0);
          sc.fx?.shake?.(2);
          R.j.play("block", 0.7);
          if (it.hp <= 0) {
            it.gone = true;
            KEYGONE.add(src.key + ":" + r.x0 + ":" + r.y0);
            for (let y = r.y0; y < r.y1; y += 16) sc.fx?.burst?.("chunk", ox + (r.x0 + r.x1) / 2, y + 8, 6, 0x8a8094);
            sc.fx?.shake?.(5);
            R.j.play("thud");
            sc.fx?.text?.(ox + (r.x0 + r.x1) / 2, r.y0 - 8, "숨은 길!", "#ffe080");
            hide(it);
            continue;
          }
        }
      }
      if (!vis) { hide(it); continue; }
      it.spr ??= sc.add.tileSprite(0, 0, r.x1 - r.x0, r.y1 - r.y0, "dv_crack").setOrigin(0, 0).setDepth(2.4);
      it.spr.setVisible(true).setPosition(ox + r.x0, r.y0).setAlpha(1).setTint(it.hp < (r.hp ?? 3) ? 0xffd8c8 : 0xffffff);
    } else if (it.k === "lift") {
      // 발판 윗면 it.y: r.y0(위 끝) ~ r.y1(아래 끝)
      const w = r.x1 - r.x0;
      let dy = 0;
      if (it.wait > 0) it.wait -= dt;
      else {
        const ny = it.y + it.dir * 95 * dt;
        if (ny <= r.y0) ((dy = r.y0 - it.y), (it.y = r.y0), (it.dir = 1), (it.wait = 1.4));
        else if (ny >= r.y1) ((dy = r.y1 - it.y), (it.y = r.y1), (it.dir = -1), (it.wait = 1.4));
        else ((dy = ny - it.y), (it.y = ny));
      }
      // 태우기: 서 있으면 같이 움직인다
      if (dy && B.onGround && px >= r.x0 - 3 && px <= r.x1 + 3 && Math.abs(py - (it.y - dy)) <= 3) B.y += dy;
      dyn.push({ on: 1, x0: GX + r.x0, x1: GX + r.x1, y0: Math.round(it.y), y1: Math.round(it.y) + 10 });
      if (!vis) { hide(it); continue; }
      it.spr ??= sc.add.tileSprite(0, 0, w, 10, "dv_lift").setOrigin(0, 0).setDepth(2.4);
      it.spr.setVisible(true).setPosition(ox + r.x0, Math.round(it.y));
      const top = (r.top ?? r.y0 - 60);
      it.cab ??= sc.add.tileSprite(0, 0, 2, 8, "dv_cable").setOrigin(0.5, 0).setDepth(2.3);
      it.cab.setVisible(true).setPosition(ox + (r.x0 + r.x1) / 2, top).setSize(2, Math.max(2, it.y - top));
    } else if (it.k === "fall") {
      if (it.st === "hang") {
        if (px > r.x0 - 10 && px < r.x1 + 10 && py > r.y0 && py < r.y1 + 20) ((it.st = "shake"), (it.t = 0.35));
      } else if (it.st === "shake") {
        (it.t -= dt) <= 0 && ((it.st = "drop"), (it.vy = 0));
      } else if (it.st === "drop") {
        it.vy = Math.min(900, it.vy + 1600 * dt);
        it.y += it.vy * dt;
        const cx = (r.x0 + r.x1) / 2;
        if (Math.abs(px - cx) < 10 && py > it.y && py - 24 < it.y + 28) {
          pl.hurt({ dmg: Math.max(4, Math.round(pl.maxHp * 0.12)), element: "phys", dir: px < cx ? -1 : 1, knock: 1 });
          it.st = "regrow", (it.t = 4), sc.fx?.burst?.("chunk", ox + cx, it.y + 20, 6, 0xa8a0b0);
        } else if (it.y + 28 >= r.y1) ((it.st = "regrow"), (it.t = 4), sc.fx?.burst?.("chunk", ox + cx, r.y1 - 2, 8, 0xa8a0b0), vis && R.j.play("thud", 0.5));
      } else if (it.st === "regrow" && (it.t -= dt) <= 0) ((it.st = "hang"), (it.y = r.y0));
      if (!vis || it.st === "regrow") { hide(it); continue; }
      it.spr ??= sc.add.image(0, 0, "dv_stal").setOrigin(0.5, 0).setDepth(2.4);
      it.spr.setVisible(true).setPosition(ox + (r.x0 + r.x1) / 2 + (it.st === "shake" ? (Math.random() - 0.5) * 2 : 0), it.y);
    } else if (it.k === "geyser") {
      // 간헐천: 2.2초 쉬고 1.4초 뿜는다 (뿜을 때 칸 안이면 높이 띄운다)
      it.t -= dt;
      if (it.t <= 0) ((it.on = !it.on), (it.t = it.on ? 1.4 : 2.2), it.on && vis && R.j.play("ice", 0.4));
      if (it.on && px > r.x0 && px < r.x1 && py > r.y0 && py - 20 < r.y1) ((B.vy = Math.min(B.vy, -(r.pow ?? 560))), (pl.airJumps = Math.max(pl.airJumps, 1)));
      if (vis && it.on && Math.random() < dt * 40) {
        const x = ox + r.x0 + Math.random() * (r.x1 - r.x0);
        sc.fx?.burst?.("glow", x, r.y1 - 4 - Math.random() * (r.y1 - r.y0) * 0.8, 1, r.tint ?? 0xa8e0ff);
      }
      if (vis && !it.on && it.t < 0.6 && Math.random() < dt * 10) sc.fx?.burst?.("dust", ox + (r.x0 + r.x1) / 2, r.y1 - 2, 1, r.tint ?? 0xa8e0ff);
    }
  }
  // 바람 기둥: 떠오르는 결 (화면 근처)
  for (const r of src.P.spec ?? []) {
    if (r.t !== 10 || r.x1 < vx0 || r.x0 > vx1 || r.y1 < vy0 || r.y0 > vy1) continue;
    if (Math.random() < dt * (r.x1 - r.x0) * 0.08) sc.fx?.burst?.("glow", ox + r.x0 + Math.random() * (r.x1 - r.x0), r.y0 + Math.random() * (r.y1 - r.y0), 1, r.tint ?? 0xe8f8ff);
  }
}
