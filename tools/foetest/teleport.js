const w = (ms) => new Promise(r => setTimeout(r, ms));
const r = window.__run; r.player.iframes = 999; r.player.hp = r.player.maxHp = 99999;
r.debugTeleport(window.__D); await w(2500);
const reg = r.currentRegion?.();
return { name: reg?.name ?? reg?.id, camY: r.cameras.main.scrollY };
