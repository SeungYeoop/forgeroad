// 하늘 오르기 진단: ascend 출발점·실패 이유
globalThis.__sky = 1;
const { ZONES, upChunk, downChunk } = await import("../src/forge/zones.js");
const { makePlan } = await import("../src/forge/natgen.js");
const z = ZONES.find((q) => q.id === process.argv[2]);
makePlan(z, { seed: 1, Ft: 528, up: upChunk(z), down: downChunk(z), fe: 1, ze: 0, noRepair: true }, 0);
