// 모바일 터치 조작: 가상 게임패드(이동·점프·대시·특수) + 가상 키(Q/E/R·막기·가방·일시정지)
// 엔진의 게임패드 클래스가 TOUCH.gp 를 실제 패드처럼 읽고, 키 버튼은 키보드 이벤트를 흉내 낸다.

export const TOUCH = { gp: null, attack: !1, active: !1 };

const KEYS = {
  Q: ["q", "KeyQ", 81],
  E: ["e", "KeyE", 69],
  R: ["r", "KeyR", 82],
  DOWN: ["ArrowDown", "ArrowDown", 40],
  TAB: ["Tab", "Tab", 9],
  ESC: ["Escape", "Escape", 27],
};
function sendKey(type, name) {
  const [key, code, kc] = KEYS[name];
  const e = new KeyboardEvent(type, { key, code, bubbles: !0, cancelable: !0 });
  Object.defineProperty(e, "keyCode", { get: () => kc });
  Object.defineProperty(e, "which", { get: () => kc });
  window.dispatchEvent(e);
}

function makePad() {
  return { id: "touch", connected: !0, buttons: Array.from({ length: 17 }, () => ({ pressed: !1, value: 0 })), axes: [0, 0, 0, 0] };
}

const CSS = `
#tc{position:fixed;inset:0;z-index:20;pointer-events:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;font-family:Galmuri11,monospace;display:none}
#tc.on{display:block}
#tc .b,#tc .zone{pointer-events:auto;touch-action:none}
#tc .b{position:absolute;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-direction:column;
  background:radial-gradient(circle at 50% 38%,rgba(70,56,44,.55),rgba(18,14,22,.55));border:2px solid rgba(232,200,130,.55);
  color:#f2e6c4;text-shadow:0 1px 0 #140e18,0 0 4px #140e18;box-shadow:0 2px 0 rgba(0,0,0,.35),inset 0 0 8px rgba(255,220,150,.12);
  transition:transform .05s,background .05s;line-height:1}
#tc .b small{font-size:.55em;opacity:.8;margin-top:.2em}
#tc .b.dn{transform:scale(.92);background:radial-gradient(circle at 50% 40%,rgba(255,210,120,.55),rgba(120,70,30,.6));border-color:#ffd84a}
#tc .b.atk{border-color:rgba(255,150,100,.7)}
#tc .b.sq{border-radius:22%}
#tc .zone{position:absolute;left:0;bottom:0;width:44vw;top:16vh}
#tc .base,#tc .knob{position:absolute;border-radius:50%;pointer-events:none;transform:translate(-50%,-50%)}
#tc .base{width:28vmin;height:28vmin;border:2px solid rgba(232,200,130,.35);background:rgba(18,14,22,.28)}
#tc .knob{width:13vmin;height:13vmin;background:radial-gradient(circle at 50% 38%,rgba(255,230,170,.7),rgba(150,110,60,.6));border:2px solid rgba(255,216,74,.7)}
#tc .idle{opacity:.45}
#tc.modal .play,#tc.hub .runonly{display:none}
#tc:not(.modal) .modalonly{display:none}
#tc.nocancel .modalonly{display:none}
#rot{position:fixed;inset:0;z-index:30;background:#0b0a10;color:#e8d9a8;display:none;align-items:center;justify-content:center;
  flex-direction:column;gap:14px;font-family:Galmuri11,monospace;font-size:18px;text-align:center}
#rot .ph{width:46px;height:78px;border:3px solid #e8d9a8;border-radius:8px;animation:rot 1.8s ease-in-out infinite}
@keyframes rot{0%,30%{transform:rotate(0)}60%,100%{transform:rotate(90deg)}}
@media (orientation:portrait){body.touch #rot{display:flex}}
`;

// 버튼 배치 (vmin 기준, 오른쪽 아래에서 잰 위치)
const SAFE_R = "env(safe-area-inset-right,0px)";
const SAFE_L = "env(safe-area-inset-left,0px)";
const BTN = [
  { id: "atk", label: "공격", r: 5, b: 7, s: 23, pad: 10, cls: "atk play", attack: !0 },
  { id: "jump", label: "점프", r: 31, b: 4, s: 17, pad: 0, cls: "play" },
  { id: "dash", label: "대시", r: 4, b: 33, s: 15, pad: 1, cls: "play" },
  { id: "spc", label: "특수", r: 21, b: 27, s: 13, pad: 3, cls: "play" },
  { id: "grd", label: "막기", r: 50, b: 4, s: 13, key: "DOWN", cls: "play runonly" },
  { id: "q", label: "Q", r: 39, b: 25, s: 13, key: "Q", cls: "play" },
  { id: "e", label: "E", sub: "상호작용", r: 31, b: 42, s: 13, key: "E", cls: "play" },
  { id: "r", label: "R", r: 15, b: 50, s: 13, key: "R", cls: "play" },
  { id: "bag", label: "가방", t: 3, r: 16, s: 11, key: "TAB", cls: "play runonly sq" },
  { id: "pause", label: "Ⅱ", t: 3, r: 3, s: 11, key: "ESC", cls: "play sq" },
  { id: "close", label: "✕", sub: "닫기", t: 3, r: 3, s: 12, key: "ESC", cls: "modalonly sq" },
];

export function initTouch(opts = {}) {
  if (typeof window === "undefined") return;
  const coarse = window.matchMedia?.("(pointer: coarse)")?.matches;
  const touchCap = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const st = document.createElement("style");
  st.textContent = CSS;
  document.head.appendChild(st);

  const rot = document.createElement("div");
  rot.id = "rot";
  rot.innerHTML = `<div class="ph"></div><div>화면을 가로로 돌려 주세요</div>`;
  document.body.appendChild(rot);

  const root = document.createElement("div");
  root.id = "tc";
  document.body.appendChild(root);

  const gp = makePad();
  const held = new Map(); // pointerId → btn
  let enabled = !1;

  const enable = () => {
    if (enabled) return;
    enabled = !0;
    TOUCH.active = !0;
    TOUCH.gp = gp;
    document.body.classList.add("touch");
  };

  // ── 조이스틱 ──
  const zone = document.createElement("div");
  zone.className = "zone play";
  const base = document.createElement("div");
  base.className = "base idle";
  const knob = document.createElement("div");
  knob.className = "knob idle";
  zone.append(base, knob);
  root.appendChild(zone);
  let stick = null;
  const stickHome = () => {
    const h = zone.clientHeight, v = Math.min(innerWidth, innerHeight) / 100;
    const x = 20 * v, y = h - 20 * v;
    for (const el of [base, knob]) (el.style.left = x + "px"), (el.style.top = y + "px"), el.classList.add("idle");
  };
  const stickSet = (cx, cy) => {
    const R = (Math.min(innerWidth, innerHeight) / 100) * 12;
    let dx = cx - stick.x, dy = cy - stick.y;
    const d = Math.hypot(dx, dy);
    if (d > R) (dx *= R / d), (dy *= R / d);
    knob.style.left = stick.x + dx + "px";
    knob.style.top = stick.y + dy + "px";
    gp.axes[0] = dx / R;
    gp.axes[1] = dy / R;
  };
  zone.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (stick) return;
    zone.setPointerCapture?.(e.pointerId);
    const r = zone.getBoundingClientRect();
    stick = { id: e.pointerId, x: e.clientX - r.left, y: e.clientY - r.top, r };
    for (const el of [base, knob]) (el.style.left = stick.x + "px"), (el.style.top = stick.y + "px"), el.classList.remove("idle");
    stickSet(stick.x, stick.y);
  });
  zone.addEventListener("pointermove", (e) => {
    if (!stick || e.pointerId !== stick.id) return;
    e.preventDefault();
    stickSet(e.clientX - stick.r.left, e.clientY - stick.r.top);
  });
  const stickEnd = (e) => {
    if (!stick || (e && e.pointerId !== stick.id)) return;
    stick = null;
    gp.axes[0] = gp.axes[1] = 0;
    stickHome();
  };
  zone.addEventListener("pointerup", stickEnd);
  zone.addEventListener("pointercancel", stickEnd);

  // ── 버튼 ──
  const els = [];
  const press = (B, on) => {
    B.el.classList.toggle("dn", on);
    if (B.pad !== void 0) (gp.buttons[B.pad].pressed = on), (gp.buttons[B.pad].value = on ? 1 : 0);
    if (B.attack) TOUCH.attack = on;
    if (B.key) sendKey(on ? "keydown" : "keyup", B.key);
    if (on) navigator.vibrate?.(8);
  };
  for (const B of BTN) {
    const el = document.createElement("div");
    el.className = "b " + B.cls;
    el.innerHTML = B.label + (B.sub ? `<small>${B.sub}</small>` : "");
    const u = (n) => `${n}vmin`;
    el.style.width = el.style.height = u(B.s);
    el.style.fontSize = `${Math.max(2.6, B.s * 0.26)}vmin`;
    el.style.right = `calc(${u(B.r)} + ${SAFE_R})`;
    if (B.t !== void 0) el.style.top = `calc(${u(B.t)} + env(safe-area-inset-top,0px))`;
    else el.style.bottom = u(B.b);
    B.el = el;
    els.push(B);
    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      el.setPointerCapture?.(e.pointerId);
      if ([...held.values()].includes(B)) return;
      held.set(e.pointerId, B);
      press(B, !0);
    });
    const up = (e) => {
      if (held.get(e.pointerId) !== B) return;
      held.delete(e.pointerId);
      press(B, !1);
    };
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("contextmenu", (e) => e.preventDefault());
    root.appendChild(el);
  }

  const releaseAll = () => {
    for (const [id, B] of held) press(B, !1), held.delete(id);
    stickEnd();
  };

  // ── 상태에 따라 보이기 ──
  let lastMode = "";
  const tick = () => {
    requestAnimationFrame(tick);
    if (!enabled) return;
    const g = window.__game, sm = g?.scene;
    let mode = "off", cancel = !0;
    if (sm) {
      const runOn = sm.isActive("Run") || sm.isPaused("Run");
      const hubOn = sm.isActive("Hub");
      const hud = sm.getScene("Hud"), hub = sm.getScene("Hub");
      if (runOn) {
        mode = hud?.modalOpen ? "modal" : sm.getScene("Run")?.dying ? "off" : "play";
        cancel = !hud?.cardMode;
      } else if (hubOn) mode = hub?.panelOpen ? "modal" : "hub";
    }
    if (mode !== lastMode) {
      releaseAll();
      lastMode = mode;
      root.className = mode === "off" ? "" : "on " + (mode === "modal" ? "modal" : mode === "hub" ? "hub" : "");
      stickHome();
    }
    root.classList.toggle("nocancel", !cancel);
  };
  requestAnimationFrame(tick);

  // ── 첫 터치: 전체 화면·가로 고정·소리 켜기 ──
  let fsTried = !1;
  const first = (e) => {
    if (e.pointerType !== "touch" && !coarse) return;
    enable();
    opts.resume?.();
    if (fsTried) return;
    fsTried = !0;
    const d = document.documentElement;
    if (!document.fullscreenElement && d.requestFullscreen)
      d.requestFullscreen({ navigationUI: "hide" }).then(() => screen.orientation?.lock?.("landscape").catch(() => {})).catch(() => {});
  };
  window.addEventListener("pointerdown", first, { capture: !0 });
  if (coarse && touchCap) enable();
  window.addEventListener("resize", () => setTimeout(stickHome, 50));
  window.addEventListener("blur", releaseAll);
  document.addEventListener("visibilitychange", () => document.hidden && releaseAll());
}
