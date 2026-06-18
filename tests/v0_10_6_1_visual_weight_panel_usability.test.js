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
  constructor(tagName = "div") {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.style = {};
    this.dataset = {};
    this.textContent = "";
    this.title = "";
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

function loadSim({ viewMode = "macro" } = {}) {
  const elements = new Map();
  const document = {
    body: new FakeElement("body"),
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, new FakeElement());
      return elements.get(id);
    },
    createElement(tagName) {
      return new FakeElement(tagName);
    },
    addEventListener() {},
  };

  for (const [id, value] of Object.entries({
    speed: "180",
    humanCount: "30",
    beastCount: "20",
    spiritCount: "0",
    fieldPatchCount: "5",
    wildPatchCount: "6",
    markPatchCount: "3",
    blockCount: "18",
    randomSeed: "1037746564",
    presetSelect: "balanced",
    overcrowding: "6",
    keyframeEvery: "25",
    viewMode,
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
  return context.window.__triSpeciesSim;
}

function runTicks(sim, ticks) {
  for (let i = 0; i < ticks; i += 1) sim.stepWorld();
}

const indexHtml = fs.readFileSync("index.html", "utf8");
const styleCss = fs.readFileSync("style.css", "utf8");

const requiredIds = [
  "playPause",
  "step",
  "reset",
  "randomize",
  "applyInitialSettings",
  "presetSelect",
  "speed",
  "movementToggle",
  "macroOverlayToggle",
  "viewMode",
  "interventionUnit",
  "humanCount",
  "beastCount",
  "spiritCount",
  "fieldPatchCount",
  "wildPatchCount",
  "markPatchCount",
  "blockCount",
  "randomSeed",
  "overcrowding",
  "keyframeEvery",
  "exportSnapshot",
  "startRecording",
  "stopRecording",
  "exportRecording",
  "clearRecording",
  "startMacroTimeline",
  "stopMacroTimeline",
  "exportMacroTimeline",
  "clearMacroTimeline",
];

for (const id of requiredIds) {
  assert.ok(indexHtml.includes(`id="${id}"`), `index.html should preserve #${id}`);
}

for (const label of ["Initial Settings", "Recording", "Macro Timeline", "Legend", "Advanced / Debug"]) {
  assert.ok(new RegExp(`<summary>\\s*${label}\\s*</summary>`).test(indexHtml), `${label} should be a collapsible details group`);
}

const firstDetailsIndex = indexHtml.indexOf("<details");
for (const coreId of ["playPause", "step", "reset", "randomize", "viewMode", "interventionUnit", "speed", "movementToggle"]) {
  assert.ok(indexHtml.indexOf(`id="${coreId}"`) < firstDetailsIndex, `core control #${coreId} should remain above collapsible low-frequency groups`);
}
assert.ok(indexHtml.indexOf('id="statsList"') < firstDetailsIndex, "stats summary should remain visible above collapsible groups");
assert.ok(indexHtml.indexOf('id="recordingState"') > indexHtml.indexOf("<details"), "recording status should move into a collapsible group");

assert.ok(/\.sim-shell\s*\{[^}]*position:\s*sticky/s.test(styleCss), "desktop sim shell should stay visible with sticky positioning");
assert.ok(/\.panel\s*\{[^}]*max-height:\s*calc\(100vh - [^)]+\)/s.test(styleCss), "desktop panel should have viewport max-height");
assert.ok(/\.panel\s*\{[^}]*overflow-y:\s*auto/s.test(styleCss), "desktop panel should scroll internally");
assert.ok(/@media\s*\(max-width:\s*900px\)[\s\S]*\.sim-shell\s*\{[\s\S]*position:\s*relative/s.test(styleCss), "mobile layout should disable sticky sim shell");

for (const oldMacroRegionColor of ["#5d5530", "#244f3a", "#463557"]) {
  assert.ok(!styleCss.includes(oldMacroRegionColor), `Macro View should not keep loud V0.10.6 region color ${oldMacroRegionColor}`);
}
assert.ok(/\.grid\.macro-view \.region-basin\s*\{[^}]*--region-base:\s*#ebe0c7/s.test(styleCss), "Macro basin undertone should stay quiet");
assert.ok(/\.grid\.macro-view \.region-refuge\s*\{[^}]*--region-base:\s*#dce8dd/s.test(styleCss), "Macro refuge undertone should stay quiet");
assert.ok(/\.grid\.macro-view \.region-hollow\s*\{[^}]*--region-base:\s*#e3ddea/s.test(styleCss), "Macro hollow undertone should stay quiet");
assert.ok(/\.grid\.macro-view \.macro-cell-settlement\s*\{[^}]*--eco-overlay:/s.test(styleCss), "Macro settlement overlay should remain as an ecological enhancement");
assert.ok(/\.grid\.macro-view \.macro-cell-wild\s*\{[^}]*--eco-overlay:/s.test(styleCss), "Macro wild overlay should remain as an ecological enhancement");
assert.ok(/\.grid\.macro-view \.macro-cell-scar\s*\{[^}]*--eco-overlay:/s.test(styleCss), "Macro scar overlay should remain as an ecological enhancement");

const sim = loadSim({ viewMode: "substrateMacro" });
runTicks(sim, 30);
const masks = sim.buildMacroDisplayMasks(sim.getMacroDisplayWorldForTest(), "substrateMacro");
const maskClasses = masks.cellClasses.flat().join(" ");
assert.ok(/\bmacro-cell-(settlement|wild|scar|abandoned)\b/.test(maskClasses), "Substrate + Macro View should keep macro ecological classes");

sim.clearMacroTimeline();
sim.startMacroTimeline();
runTicks(sim, 10);
sim.stopMacroTimeline();
const timeline = sim.createMacroTimelineExport();
assert.deepEqual(Object.keys(timeline.frames[0]).sort(), ["counts", "maskCounts", "maskRows", "macroSummary", "regionBiasCounts", "tick"].sort(), "macro timeline frame shape should remain unchanged");

sim.clearRecording();
sim.startRecording();
runTicks(sim, 2);
sim.stopRecording();
const recording = sim.createRecordingExport();
assert.ok(recording.frames.every((frame) => !("terrainRows" in frame) && !("unitRows" in frame) && !("visualClassRows" in frame)), "recording compact frame shape should remain unchanged");

console.log("v0.10.6.1 visual weight / panel usability tests passed");
