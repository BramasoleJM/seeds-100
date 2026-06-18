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

function ruleBlock(selector, css) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, "s"));
  assert.ok(match, `${selector} should exist`);
  return match[1];
}

function hexFromProperty(block, propertyName) {
  const escaped = propertyName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = block.match(new RegExp(`${escaped}:\\s*(#[0-9a-fA-F]{6})`));
  assert.ok(match, `${propertyName} should be a hex color`);
  return match[1];
}

function luminance(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function alphaFor(block, variableName) {
  const escaped = variableName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = block.match(new RegExp(`${escaped}:\\s*rgba\\([^,]+,\\s*[^,]+,\\s*[^,]+,\\s*([0-9.]+)\\)`));
  assert.ok(match, `${variableName} should use rgba`);
  return Number(match[1]);
}

const styleCss = fs.readFileSync("style.css", "utf8");

for (const selector of [
  ".grid.macro-view .region-none",
  ".grid.macro-view .region-basin",
  ".grid.macro-view .region-refuge",
  ".grid.macro-view .region-hollow",
]) {
  const base = hexFromProperty(ruleBlock(selector, styleCss), "--region-base");
  assert.ok(luminance(base) >= 205, `${selector} should use a pale high-luminance base, got ${base}`);
}

for (const terrain of ["field", "wild"]) {
  const alpha = alphaFor(ruleBlock(`.grid.macro-view .terrain-${terrain}`, styleCss), "--terrain-material");
  assert.ok(alpha <= 0.28, `Macro terrain-${terrain} should be muted below population shapes`);
}
assert.ok(alphaFor(ruleBlock(".grid.macro-view .terrain-mark", styleCss), "--terrain-material") <= 0.4, "Macro terrain-mark should be muted while staying sharper than FIELD/WILD");
assert.ok(alphaFor(ruleBlock(".grid.macro-view .terrain-border", styleCss), "--terrain-material") >= 0.74, "BORDER should remain a crisp macro aid");

for (const selector of [
  ".grid.macro-view .macro-cell-settlement",
  ".grid.macro-view .macro-cell-wild",
  ".grid.macro-view .macro-cell-scar",
]) {
  const block = ruleBlock(selector, styleCss);
  assert.ok(/--eco-overlay:/.test(block), `${selector} should keep a macro recognition overlay`);
  assert.ok(alphaFor(block, "--eco-overlay") <= 0.14, `${selector} should identify without broad repainting`);
  assert.ok(/box-shadow:/.test(block), `${selector} should use a crisp recognition aid`);
}

for (const selector of [
  ".grid.macro-view .macro-fringe-settlement",
  ".grid.macro-view .macro-fringe-abandoned",
  ".grid.macro-view .macro-fringe-wild",
  ".grid.macro-view .macro-fringe-scar",
]) {
  assert.ok(alphaFor(ruleBlock(selector, styleCss), "--eco-overlay") <= 0.04, `${selector} should be nearly invisible in Macro View`);
}

for (const terrain of ["field", "wild", "mark"]) {
  assert.ok(
    new RegExp(`\\.grid\\.substrate-view \\.terrain-${terrain}\\s*\\{[^}]*--terrain-material:`, "s").test(styleCss),
    `Substrate + Macro View should keep terrain-${terrain} material`
  );
}

assert.ok(/background:\s*[\s\S]*#25272a/.test(ruleBlock(".grid.macro-view .terrain-block", styleCss)), "Macro BLOCK should still override layered background");

let loaded = loadSim({ viewMode: "macro" });
let classes = classNames(loaded.document);
for (const terrain of ["field", "wild", "mark"]) {
  assert.ok(classes.some((name) => name.includes(`terrain-${terrain}`)), `Macro View should render terrain-${terrain} cells`);
}
assert.ok(!classes.some((name) => /\bregion-(basin|refuge|hollow|none)\b/.test(name)), "Macro View should omit region classes so population shapes stay primary");

loaded = loadSim({ viewMode: "substrateMacro" });
classes = classNames(loaded.document);
assert.ok(classes.some((name) => /\bregion-(basin|refuge|hollow|none)\b/.test(name)), "Substrate + Macro View should keep region classes");
assert.ok(classes.some((name) => /\bscreen-edge-(north|south|west|east)\b/.test(name)), "Substrate + Macro View should keep screen-cell structure");

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

console.log("v0.10.6.3 pale base macro ecology readability tests passed");
