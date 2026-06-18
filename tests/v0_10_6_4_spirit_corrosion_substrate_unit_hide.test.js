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

function cells(document) {
  return document.getElementById("grid").children;
}

function ruleBlock(selector, css) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, "s"));
  assert.ok(match, `${selector} should exist`);
  return match[1];
}

function alphaFor(block, variableName) {
  const escaped = variableName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = block.match(new RegExp(`${escaped}:\\s*rgba\\([^,]+,\\s*[^,]+,\\s*[^,]+,\\s*([0-9.]+)\\)`));
  assert.ok(match, `${variableName} should use rgba`);
  return Number(match[1]);
}

const styleCss = fs.readFileSync("style.css", "utf8");

const macroMarkBlock = ruleBlock(".grid.macro-view .terrain-mark", styleCss);
const macroFieldAlpha = alphaFor(ruleBlock(".grid.macro-view .terrain-field", styleCss), "--terrain-material");
const macroWildAlpha = alphaFor(ruleBlock(".grid.macro-view .terrain-wild", styleCss), "--terrain-material");
const macroMarkAlpha = alphaFor(macroMarkBlock, "--terrain-material");
assert.ok(macroMarkAlpha > macroFieldAlpha && macroMarkAlpha > macroWildAlpha, "Macro MARK should be more direct than FIELD/WILD material");
assert.ok(/background-image:\s*[\s\S]*(radial-gradient|repeating-linear-gradient|linear-gradient)/.test(macroMarkBlock), "Macro MARK should have direct corrosive background treatment");

const substrateMarkBlock = ruleBlock(".grid.substrate-view .terrain-mark", styleCss);
assert.ok(alphaFor(substrateMarkBlock, "--terrain-material") >= 0.72, "Substrate + Macro MARK should stay clearly purple over substrate");
assert.ok(/background-image:\s*[\s\S]*(radial-gradient|repeating-linear-gradient|linear-gradient)/.test(substrateMarkBlock), "Substrate + Macro MARK should keep a corrosion pattern");

const scarBlock = ruleBlock(".grid.macro-view .macro-cell-scar", styleCss);
assert.ok(/--eco-overlay:/.test(scarBlock), "macro-cell-scar should remain a macro recognition class");
assert.ok(/box-shadow:/.test(scarBlock), "macro-cell-scar should use a crisp edge / marker");
assert.ok(/radial-gradient|repeating-linear-gradient|linear-gradient/.test(scarBlock), "macro-cell-scar should add a corrosion marker rather than only soft fill");

const scarFringeAlpha = alphaFor(ruleBlock(".grid.macro-view .macro-fringe-scar", styleCss), "--eco-overlay");
const settlementFringeAlpha = alphaFor(ruleBlock(".grid.macro-view .macro-fringe-settlement", styleCss), "--eco-overlay");
const wildFringeAlpha = alphaFor(ruleBlock(".grid.macro-view .macro-fringe-wild", styleCss), "--eco-overlay");
assert.ok(scarFringeAlpha < settlementFringeAlpha && scarFringeAlpha < wildFringeAlpha, "Spirit scar fringe should be weaker than FIELD/WILD soft transitions");

assert.ok(/\.grid\.macro-view \.macro-cell-settlement\.macro-soft-edge/.test(styleCss), "FIELD soft edge should remain available");
assert.ok(/\.grid\.macro-view \.macro-cell-wild\.macro-soft-edge/.test(styleCss), "WILD soft edge should remain available");

const substrateUnitBlock = ruleBlock(".grid.substrate-view .cell[data-unit]", styleCss);
assert.ok(/color:\s*transparent/.test(substrateUnitBlock), "Substrate + Macro View should hide unit letters visually");
assert.ok(/text-shadow:\s*none/.test(substrateUnitBlock), "Substrate + Macro View should also remove unit letter shadow");
assert.ok(/\.cell\[data-unit="H"\]\s*\{[^}]*color:\s*var\(--human\)/s.test(styleCss), "Cell View should still show Human letters");
assert.ok(/\.cell\[data-unit="B"\]\s*\{[^}]*color:\s*var\(--beast\)/s.test(styleCss), "Cell View should still show Beast letters");
assert.ok(/\.cell\[data-unit="S"\]\s*\{[^}]*color:\s*var\(--spirit\)/s.test(styleCss), "Cell View should still show Spirit letters");

let loaded = loadSim({ viewMode: "substrateMacro" });
let renderedCells = cells(loaded.document);
const substrateUnitCell = renderedCells.find((cell) => cell.dataset.unit);
assert.ok(substrateUnitCell, "test world should render at least one unit in Substrate + Macro View");
assert.ok(substrateUnitCell.dataset.unit, "Substrate + Macro View should preserve dataset.unit");
assert.ok(substrateUnitCell.textContent, "Substrate + Macro View should preserve text content for data/export neutrality");
assert.ok(loaded.document.getElementById("grid").className.includes("substrate-view"), "Substrate + Macro View should set substrate-view class for CSS hiding");

loaded = loadSim({ viewMode: "cell" });
renderedCells = cells(loaded.document);
const cellViewUnit = renderedCells.find((cell) => cell.dataset.unit);
assert.ok(cellViewUnit?.textContent, "Cell View should keep unit letters");
assert.ok(!loaded.document.getElementById("grid").className.includes("substrate-view"), "Cell View should not use substrate-view unit hiding");

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
assert.ok(snapshot.world.unitRows, "snapshot should preserve unitRows");
assert.ok(!("visualClassRows" in snapshot.world), "snapshot should not add visual class rows");

console.log("v0.10.6.4 spirit corrosion / substrate unit hide tests passed");
