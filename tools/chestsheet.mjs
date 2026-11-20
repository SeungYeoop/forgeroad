// 상자 그림 모아 보기 → JSON (파이썬으로 PNG): node tools/chestsheet.mjs out.json
import fs from "node:fs";
import { chestFrame, CW, CH, FRAMES } from "../src/forge/chests.js";
const rows = [];
for (let t = 0; t < 4; t++) for (let f = 0; f < FRAMES; f++) rows.push({ t, f, px: Array.from(chestFrame(t, f)) });
fs.writeFileSync(process.argv[2] ?? "chests.json", JSON.stringify({ CW, CH, FRAMES, rows }));
