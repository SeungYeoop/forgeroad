// 설계 길·구멍 실패 보기 (시드): node --import ./tools/json-hook.mjs tools/natdbgs.mjs g1_0 26
globalThis.__dbg = 1;
const { ZONES, upChunk, downChunk } = await import("../src/forge/zones.js");
const { makePlan } = await import("../src/forge/natgen.js");
const z = ZONES.find((q) => q.id === process.argv[2]);
makePlan(z, { seed: Number(process.argv[3] ?? 1), Ft: 528, up: upChunk(z), down: downChunk(z), fe: 1, ze: 0, noRepair: true }, 0);
