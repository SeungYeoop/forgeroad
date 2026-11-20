// 함정 자리 수 보기: node --import ./tools/json-hook.mjs tools/nathz.mjs g1_0
const { ZONES, upChunk, downChunk } = await import("../src/forge/zones.js");
const { makePlan } = await import("../src/forge/natgen.js");
const z = ZONES.find((q) => q.id === (process.argv[2] || "g1_0"));
const P = makePlan(z, { seed: 1, Ft: 528, up: upChunk(z), down: downChunk(z) }, 0);
const s = P.h.length;
const surf = (x) => P.h[Math.max(0, Math.min(s - 1, Math.round(x / 4)))];
console.log("hzSpots", P.hzSpots.length, JSON.stringify(P.hzSpots.map((h) => ({ x0: h.x0, x1: h.x1, y: h.y, d: h.dungeon ? 1 : 0, surf: Math.abs(h.y - surf(h.x0 * 16)) < 30 ? 1 : 0 }))));
