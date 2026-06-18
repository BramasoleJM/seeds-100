const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

class FakeElement {
  constructor() {
    this.children = [];
    this.style = {};
    this.dataset = {};
    this.textContent = "";
    this.value = "";
    this.checked = true;
    this.listeners = {};
    this._innerHTML = "";
    this.className = "";
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  addEventListener(name, fn) {
    this.listeners[name] = fn;
  }

  set innerHTML(value) {
    this._innerHTML = value;
    if (value === "") this.children = [];
  }

  get innerHTML() {
    return this._innerHTML;
  }
}

function loadSim() {
  const elements = new Map();
  const document = {
    body: new FakeElement(),
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, new FakeElement());
      return elements.get(id);
    },
    createElement() {
      return new FakeElement();
    },
    addEventListener() {},
  };

  for (const [id, value] of Object.entries({
    speed: "180",
    humanCount: "32",
    beastCount: "18",
    spiritCount: "0",
    fieldPatchCount: "3",
    wildPatchCount: "5",
    markPatchCount: "1",
    blockCount: "20",
    randomSeed: "900",
    presetSelect: "balanced",
    overcrowding: "6",
    keyframeEvery: "1",
  })) {
    document.getElementById(id).value = value;
  }
  document.getElementById("movementToggle").checked = false;
  document.getElementById("macroOverlayToggle").checked = true;

  const context = {
    console,
    document,
    window: {},
    Blob: class Blob {},
    URL: {
      createObjectURL() {
        return "blob:test";
      },
      revokeObjectURL() {},
    },
    setInterval() {
      return 1;
    },
    clearInterval() {},
    Math,
    Date,
    performance,
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("sim.js", "utf8"), context, { filename: "sim.js" });
  return { sim: context.window.__triSpeciesSim, document };
}

function emptyWorld(sim, fertility = 3) {
  return Array.from({ length: 25 }, () =>
    Array.from({ length: 40 }, () => sim.createCell(sim.TERRAIN.EMPTY, null, 0, "normal", fertility))
  );
}

const loaded = loadSim();
const sim = loaded.sim;
const world = emptyWorld(sim, 3);

for (let y = 8; y <= 11; y += 1) {
  for (let x = 8; x <= 11; x += 1) {
    world[y][x] = sim.createCell(sim.TERRAIN.FIELD, null, 0, "normal", 3);
  }
}
world[9][9].unit = sim.UNIT.HUMAN;
world[9][10].unit = sim.UNIT.HUMAN;
world[10][9].unit = sim.UNIT.HUMAN;
world[10][10].unit = sim.UNIT.HUMAN;

for (let y = 15; y <= 18; y += 1) {
  for (let x = 25; x <= 28; x += 1) {
    world[y][x] = sim.createCell(sim.TERRAIN.WILD, null, 0, "normal", 4);
  }
}
world[16][26].unit = sim.UNIT.BEAST;
world[16][27].terrain = sim.TERRAIN.MARK;
world[5][25] = sim.createCell(sim.TERRAIN.MARK, sim.UNIT.SPIRIT, 1, "manifestation", 3);

sim.resetWorld(world);
let snapshot = sim.createSnapshotExport();
assert.equal(snapshot.macroWorld.version, "0.9", "snapshot should export macroWorld");
assert.ok(snapshot.macroWorld.regions.some((r) => r.type === "settlement"), "macroWorld should detect settlement regions");
assert.ok(snapshot.macroWorld.regions.some((r) => r.type === "beast_recovery_zone"), "macroWorld should detect Beast recovery zones");
assert.ok(snapshot.macroWorld.events.some((e) => e.type === "spirit_outbreak"), "macroWorld should detect Spirit outbreak events");

const settlementId = snapshot.macroWorld.regions.find((r) => r.type === "settlement").id;
sim.analyzeMacroWorldNow();
snapshot = sim.createSnapshotExport();
assert.equal(snapshot.macroWorld.regions.find((r) => r.type === "settlement").id, settlementId, "settlement id should persist across analyses");

sim.clearRecording();
sim.startRecording();
sim.stepWorld();
sim.stopRecording();
const recording = sim.createRecordingExport();
assert.ok(recording.macroWorld && Array.isArray(recording.macroFrames), "recording export should include macroWorld and macroFrames");
assert.ok(recording.frames[0].macro, "recording frames should include compact macro summary");

console.log("v0.9 macro world layer tests passed");
