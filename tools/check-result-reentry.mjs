import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

// Exercise the production scene's lifecycle without booting the renderer.
const source = fs.readFileSync(new URL("../src/main.js", import.meta.url), "utf8");
const sceneSource = source.slice(source.indexOf("class Pr extends zt.Scene"), source.indexOf("window.__FG = FG;"));
let picks = 0;
let writes = 0;
let finish;
let eligible = true;
const save = { data: {}, write() { writes++; } };
const Result = vm.runInNewContext(`${sceneSource}\nPr;`, {
  zt: { Scene: class {} },
  Z: (object, key, value) => { object[key] = value; },
  it: save,
  FG: {
    resultPick(scene, result, done) {
      if (!eligible) return false;
      picks++;
      scene.frPicking = true;
      finish = () => { scene.frPicking = false; done(); };
      return true;
    },
  },
});
const scene = new Result();
scene.cameras = { main: { fadeOut() {} } };
scene.time = { delayedCall() {} };

for (let run = 1; run <= 3; run++) {
  const result = { run };
  scene.init({ result });
  assert.equal(scene.result, result);
  assert.equal(scene.frPicked, false, "Each result must allow a new shop selection");
  scene.leave();
  assert.equal(picks, run, "Shop selection must open again on consecutive returns");
  assert.equal(scene.leaving, false);
  scene.leave();
  assert.equal(picks, run, "Repeated input must not open a duplicate selection");
  finish(); // Both adding an item and skipping complete through this callback.
  assert.equal(scene.leaving, true);
  assert.equal(writes, run);
}

// Restarting the scene must also clear an interrupted selection.
scene.frPicking = true;
save.data.pendingResult = { run: 4 };
scene.init({});
assert.equal(scene.frPicking, false);
assert.equal(scene.result, save.data.pendingResult);
eligible = false;
scene.leave();
assert.equal(scene.leaving, true, "No eligible discoveries must still allow returning");
assert.equal(writes, 4);
console.log("PASS: consecutive returns, duplicate input, interrupted selection, pending result, and no eligible items");
