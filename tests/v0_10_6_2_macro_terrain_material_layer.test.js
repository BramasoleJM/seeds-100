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
  return { sim: context.window.__triSpeciesSim, document };
}

function runTicks(sim, ticks) {
  for (let i = 0; i < ticks; i += 1) sim.stepWorld();
}

function classNames(document) {
  return document.getElementById("grid").children.map((cell) => cell.className);
}

function ruleBlock(selector, css) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, "s"));
  assert.ok(match, `${selector} should exist`);
  return match[1];
}

const styleCss = fs.readFileSync("style.css", "utf8");

assert.ok(styleCss.includes("--terrain-material"), "style.css should define a real terrain material layer");
assert.ok(
  /\.grid\.macro-view \.cell,\s*\.grid\.substrate-view \.cell\s*\{[\s\S]*background:\s*[\s\S]*linear-gradient\(var\(--eco-overlay\),\s*var\(--eco-overlay\)\)[\s\S]*linear-gradient\(var\(--terrain-material\),\s*var\(--terrain-material\)\)[\s\S]*linear-gradient\(var\(--fertility-tint\),\s*var\(--fertility-tint\)\)[\s\S]*var\(--region-base\)/.test(styleCss),
  "Macro/Substrate cell background should layer eco overlay above terrain material above fertility above region base"
);

for (const terrain of ["field", "wild", "mark", "border"]) {
  assert.ok(
    new RegExp(`\\.grid\\.macro-view \\.terrain-${terrain}\\s*\\{[^}]*--terrain-material:`, "s").test(styleCss),
    `Macro View terrain-${terrain} should set terrain material`
  );
  assert.ok(
    new RegExp(`\\.grid\\.substrate-view \\.terrain-${terrain}\\s*\\{[^}]*--terrain-material:`, "s").test(styleCss),
    `Substrate + Macro View terrain-${terrain} should set terrain material`
  );
}

assert.ok(/\.grid\.macro-view \.region-basin\s*\{[^}]*--region-base:\s*#ebe0c7/s.test(styleCss), "Macro basin should be a faint undertone");
assert.ok(/\.grid\.macro-view \.region-refuge\s*\{[^}]*--region-base:\s*#dce8dd/s.test(styleCss), "Macro refuge should be a faint undertone");
assert.ok(/\.grid\.macro-view \.region-hollow\s*\{[^}]*--region-base:\s*#e3ddea/s.test(styleCss), "Macro hollow should be a faint undertone");

for (const selector of [
  ".grid.macro-view .macro-cell-settlement",
  ".grid.macro-view .macro-cell-wild",
  ".grid.macro-view .macro-cell-scar",
  ".grid.substrate-view .macro-cell-settlement",
  ".grid.substrate-view .macro-cell-wild",
  ".grid.substrate-view .macro-cell-scar",
]) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  assert.ok(new RegExp(`${escaped}\\s*\\{[^}]*--eco-overlay:`, "s").test(styleCss), `${selector} should keep eco overlay as enhancement`);
}

assert.ok(/background:\s*[\s\S]*#25272a/.test(ruleBlock(".grid.macro-view .terrain-block", styleCss)), "Macro BLOCK should override layered background");
assert.ok(/background:\s*[\s\S]*#25272a/.test(ruleBlock(".grid.substrate-view .terrain-block", styleCss)), "Substrate BLOCK should override layered background");

let loaded = loadSim({ viewMode: "macro" });
let classes = classNames(loaded.document);
for (const terrain of ["field", "wild", "mark"]) {
  assert.ok(classes.some((name) => name.includes(`terrain-${terrain}`)), `Macro View should render terrain-${terrain} cells`);
}
assert.ok(classes.some((name) => name.includes("terrain-field") && !name.includes("macro-cell-settlement")), "FIELD should be readable even outside settlement masks");
assert.ok(classes.some((name) => name.includes("terrain-wild") && !name.includes("macro-cell-wild")), "WILD should be readable even outside wild masks");
assert.ok(/\.grid\.macro-view \.terrain-mark\s*\{[^}]*--terrain-material:/s.test(styleCss), "MARK should be readable through terrain material even outside scar masks");

loaded.sim.clearMacroTimeline();
loaded.sim.startMacroTimeline();
runTicks(loaded.sim, 10);
loaded.sim.stopMacroTimeline();
const timeline = loaded.sim.createMacroTimelineExport();
assert.deepEqual(Object.keys(timeline.frames[0]).sort(), ["counts", "maskCounts", "maskRows", "macroSummary", "regionBiasCounts", "tick"].sort(), "macro timeline frame shape should remain unchanged");

loaded.sim.clearRecording();
loaded.sim.startRecording();
runTicks(loaded.sim, 2);
loaded.sim.stopRecording();
const recording = loaded.sim.createRecordingExport();
assert.ok(recording.frames.every((frame) => !("terrainRows" in frame) && !("unitRows" in frame) && !("visualClassRows" in frame)), "recording compact frame shape should remain unchanged");

const snapshot = loaded.sim.createSnapshotExport();
assert.ok(snapshot.world.terrainRows, "snapshot should preserve terrainRows");
assert.ok(!("visualClassRows" in snapshot.world), "snapshot should not add visual class rows");

console.log("v0.10.6.2 macro terrain material layer tests passed");
