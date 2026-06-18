const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

class FakeClassList {
  constructor(owner) {
    this.owner = owner;
  }

  toggle(name, force) {
    const classes = new Set((this.owner.className || "").split(/\s+/).filter(Boolean));
    if (force) classes.add(name);
    else classes.delete(name);
    this.owner.className = Array.from(classes).join(" ");
  }
}

class FakeElement {
  constructor() {
    this.children = [];
    this.style = {};
    this.dataset = {};
    this.textContent = "";
    this.value = "";
    this.checked = false;
    this.listeners = {};
    this._innerHTML = "";
    this.className = "";
    this.classList = new FakeClassList(this);
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  addEventListener(name, fn) {
    this.listeners[name] = fn;
  }

  click() {
    if (this.listeners.click) this.listeners.click({ target: this, preventDefault() {} });
  }

  set innerHTML(value) {
    this._innerHTML = value;
    if (value === "") this.children = [];
  }

  get innerHTML() {
    return this._innerHTML;
  }
}

function loadSim(seed = "10010") {
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
    humanCount: "24",
    beastCount: "18",
    spiritCount: "0",
    fieldPatchCount: "3",
    wildPatchCount: "5",
    markPatchCount: "2",
    blockCount: "20",
    randomSeed: seed,
    presetSelect: "balanced",
    overcrowding: "6",
    keyframeEvery: "1",
    viewMode: "substrateMacro",
    interventionUnit: "H",
  })) {
    document.getElementById(id).value = value;
  }
  document.getElementById("movementToggle").checked = true;
  document.getElementById("macroOverlayToggle").checked = false;

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
  return { sim: context.window.__triSpeciesSim, document, context };
}

function settings(seed) {
  return {
    initialHumans: 24,
    initialBeasts: 18,
    initialSpirits: 0,
    initialFieldPatches: 3,
    initialWildPatches: 5,
    initialMarkPatches: 2,
    initialBlockCount: 20,
    randomSeed: seed,
    presetName: "Balanced Asymmetric Ecology Test",
  };
}

function emptyWorld(sim) {
  return Array.from({ length: 25 }, () =>
    Array.from({ length: 40 }, () => sim.createCell(sim.TERRAIN.EMPTY, null, 0, "normal", 2))
  );
}

const indexHtml = fs.readFileSync("index.html", "utf8");
assert.match(indexHtml, /<option value="substrateMacro">Substrate \+ Macro View<\/option>/, "view mode should expose Substrate + Macro View");
assert.match(indexHtml, /id="interventionUnit"/, "runtime intervention unit selector should exist");

let loaded = loadSim("10010");
let sim = loaded.sim;
const worldA = sim.createInitialWorld(settings(10010));
const worldB = sim.createInitialWorld(settings(10010));
const worldC = sim.createInitialWorld(settings(10011));

assert.ok(worldA.every((row) => row.every((cell) => cell.regionBias)), "every cell should have a regionBias field");

sim.resetWorld(worldA);
let snapshotA = sim.createSnapshotExport();
sim.resetWorld(worldB);
let snapshotB = sim.createSnapshotExport();
sim.resetWorld(worldC);
let snapshotC = sim.createSnapshotExport();

assert.deepEqual(snapshotA.world.regionBiasRows, snapshotB.world.regionBiasRows, "same seed should generate identical substrate rows");
assert.notDeepEqual(snapshotA.world.regionBiasRows, snapshotC.world.regionBiasRows, "different seeds should vary substrate rows");
assert.ok(snapshotA.world.regionBiasRows.length === 25, "regionBiasRows should export one row per grid row");
assert.ok(snapshotA.world.regionBiasRows.every((row) => /^[.brh]{40}$/.test(row)), "regionBiasRows should use only compact substrate symbols");
assert.ok(snapshotA.regionBiasCounts.basin > 0, "substrate should include basin cells");
assert.ok(snapshotA.regionBiasCounts.refuge > 0, "substrate should include refuge cells");
assert.ok(snapshotA.regionBiasCounts.hollow > 0, "substrate should include hollow cells");
assert.ok(snapshotA.macroWorld.display.viewModes.includes("substrateMacro"), "macro display export should include substrateMacro view mode");

loaded = loadSim("10012");
sim = loaded.sim;
const custom = emptyWorld(sim);
custom[0][0] = sim.createCell(sim.TERRAIN.BLOCK, null, 0, "normal", 0);
sim.resetWorld(custom);
loaded.document.getElementById("interventionUnit").value = "H";
loaded.document.getElementById("grid").children[1].click();
let snapshot = sim.createSnapshotExport();
assert.equal(snapshot.world.unitRows[0][1], "H", "click intervention should place selected unit on non-BLOCK cell");
assert.equal(snapshot.interventions.length, 1, "snapshot should record successful intervention metadata");

loaded.document.getElementById("interventionUnit").value = "B";
loaded.document.getElementById("grid").children[0].click();
snapshot = sim.createSnapshotExport();
assert.equal(snapshot.world.unitRows[0][0], ".", "click intervention should not place a unit on BLOCK");
assert.equal(snapshot.interventions.length, 1, "rejected BLOCK click should not create a successful intervention record");

sim.clearRecording();
sim.startRecording();
loaded.document.getElementById("interventionUnit").value = "S";
loaded.document.getElementById("grid").children[2].click();
sim.recordFrame();
const recording = sim.createRecordingExport();
assert.ok(recording.keyframes[0].regionBiasRows, "recording keyframes should include regionBiasRows");
assert.ok(recording.interventions.length >= 1, "recording export should include intervention metadata");

console.log("v0.10 regional substrate tests passed");
