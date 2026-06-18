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

function blankWorld(sim, fertility = 1) {
  return Array.from({ length: 25 }, () =>
    Array.from({ length: 40 }, () => sim.createCell(sim.TERRAIN.EMPTY, null, 0, "normal", fertility, 0, null, sim.REGION_BIAS.NONE))
  );
}

function repeatMemory(sim, world, count) {
  let frame = null;
  for (let i = 0; i < count; i += 1) {
    frame = sim.updateMacroMemoryForTest(world, { force: true, mode: "macro" });
  }
  return frame;
}

function ruleBlock(styleCss, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = styleCss.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, "s"));
  assert.ok(match, `${selector} should exist`);
  return match[1];
}

function traceValue(memory, channel, x, y) {
  return memory.traces[channel][y][x];
}

let { sim } = loadSim({ viewMode: "macro" });
assert.equal(typeof sim.getMacroMemoryForTest, "function", "macro memory should expose a test getter");
assert.equal(typeof sim.updateMacroMemoryForTest, "function", "macro memory should expose a test updater");

let memory = sim.getMacroMemoryForTest();
assert.ok(memory.version.startsWith("0.10.9"), "macroMemory should expose the V0.10.9 series version");
assert.deepEqual(Object.keys(memory.traces).sort(), ["beast", "conflict", "fertility", "human", "rot"].sort(), "macroMemory should include five trace channels");
for (const channel of Object.keys(memory.traces)) {
  assert.equal(memory.traces[channel].length, 25, `${channel} trace should have grid rows`);
  assert.equal(memory.traces[channel][0].length, 40, `${channel} trace should have grid columns`);
}

let humanWorld = blankWorld(sim, 1);
humanWorld[10][10] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 0, "normal", 2);
let oneFrame = repeatMemory(sim, humanWorld, 1);
assert.ok(traceValue(oneFrame, "human", 10, 10) > 0, "one Human/FIELD sample should start human trace");
assert.ok(traceValue(oneFrame, "human", 10, 10) < sim.MACRO_MEMORY_CONFIG.faintThreshold, "one-frame signal should stay below visible memory threshold");

let repeatedHuman = repeatMemory(sim, humanWorld, 25);
assert.ok(traceValue(repeatedHuman, "human", 10, 10) >= sim.MACRO_MEMORY_CONFIG.faintThreshold, "repeated Human/FIELD signal should become visible memory");
assert.ok(traceValue(repeatedHuman, "human", 10, 10) <= 1, "human trace should clamp to 1");
let strongHumanMemory = repeatMemory(sim, humanWorld, 40);
assert.ok(traceValue(strongHumanMemory, "human", 10, 10) >= sim.MACRO_MEMORY_CONFIG.strongThreshold, "long repeated Human/FIELD signal should become strong memory");

let emptyWorld = blankWorld(sim, 1);
let decayedHuman = repeatMemory(sim, emptyWorld, 8);
assert.ok(traceValue(decayedHuman, "human", 10, 10) < traceValue(strongHumanMemory, "human", 10, 10), "old human trace should decay when signal disappears");
assert.ok(traceValue(decayedHuman, "human", 10, 10) > 0, "old human trace should fade gradually rather than vanish instantly");

let beastWorld = blankWorld(sim, 1);
beastWorld[11][11] = sim.createCell(sim.TERRAIN.WILD, sim.UNIT.BEAST, 0, "pack", 3);
let beastMemory = repeatMemory(sim, beastWorld, 65);
assert.ok(traceValue(beastMemory, "beast", 11, 11) >= sim.MACRO_MEMORY_CONFIG.strongThreshold, "long repeated WILD/Beast signal should become strong beast memory");

let rotWorld = blankWorld(sim, 1);
rotWorld[8][8] = sim.createCell(sim.TERRAIN.MARK, sim.UNIT.SPIRIT, 0, "manifestation", 2);
rotWorld.pointsOfInterest = [{ id: "test_rot", type: "rot_source", x: 8, y: 8, radius: 4, innerRadius: 1, strength: "strong", state: "active", createdAtTick: 0 }];
sim.resetWorld(rotWorld);
let rotMemory = repeatMemory(sim, rotWorld, 20);
assert.ok(traceValue(rotMemory, "rot", 8, 8) >= sim.MACRO_MEMORY_CONFIG.faintThreshold, "repeated MARK/rot source signal should become visible rot memory");

let fertileWorld = blankWorld(sim, 1);
fertileWorld[7][7] = sim.createCell(sim.TERRAIN.EMPTY, null, 0, "normal", 4);
fertileWorld.pointsOfInterest = [{ id: "test_spring", type: "spring", x: 7, y: 7, radius: 4, strength: "strong", state: "active", createdAtTick: 0, blocksMovement: true }];
sim.resetWorld(fertileWorld);
let fertilityMemory = repeatMemory(sim, fertileWorld, 20);
assert.ok(traceValue(fertilityMemory, "fertility", 7, 7) >= sim.MACRO_MEMORY_CONFIG.faintThreshold, "high fertility / spring signal should become fertility memory");

let conflictWorld = blankWorld(sim, 1);
conflictWorld[12][12] = sim.createCell(sim.TERRAIN.BORDER, null, 0, "normal", 1);
let conflictMemory = repeatMemory(sim, conflictWorld, 20);
assert.ok(traceValue(conflictMemory, "conflict", 12, 12) >= sim.MACRO_MEMORY_CONFIG.faintThreshold, "repeated BORDER signal should become conflict memory");

let blockWorld = blankWorld(sim, 1);
blockWorld[6][6] = sim.createCell(sim.TERRAIN.BLOCK, null, 0, "normal", 0);
sim.resetWorld(blockWorld);
repeatMemory(sim, blockWorld, 25);
let mask = sim.buildMacroDisplayMasks(blockWorld, "macro", []);
assert.equal(/memory-/.test(mask.cellClasses[6][6]), false, "memory display classes should not be applied to BLOCK");

sim.resetWorld(rotWorld);
repeatMemory(sim, rotWorld, 25);
mask = sim.buildMacroDisplayMasks(rotWorld, "macro", rotWorld.pointsOfInterest);
assert.ok(mask.cellClasses[8][8].includes("poi-center"), "memory should not replace POI center class");
assert.ok(mask.cellClasses[8][8].includes("poi-rot-core"), "memory should not replace rot source core class");
assert.ok(/memory-rot-(faint|strong)/.test(mask.cellClasses[8][8]), "strong rot memory should render as a secondary memory class");

const poiStates = sim.macroSummary().poiStates;
assert.ok(Array.isArray(poiStates), "macroSummary should include compact poiStates");
const rotState = poiStates.find((poi) => poi.type === "rot_source");
assert.ok(rotState, "poiStates should include rot source");
assert.ok(["forming", "dominant", "spreading", "contested", "contained"].includes(rotState.state), "rot source state label should be deterministic and compact");
for (const key of ["human", "beast", "rot", "fertility", "conflict"]) {
  assert.equal(typeof rotState[key], "number", `poi state ${key} value should be compact numeric`);
}

sim.clearMacroTimeline();
sim.startMacroTimeline();
repeatMemory(sim, rotWorld, 10);
sim.recordMacroTimelineFrame({ force: true, mode: "macro" });
sim.stopMacroTimeline();
const timeline = sim.createMacroTimelineExport();
assert.deepEqual(Object.keys(timeline.frames[0]).sort(), ["counts", "maskCounts", "maskRows", "macroSummary", "regionBiasCounts", "tick"].sort(), "macro timeline frame top-level keys should remain stable");
assert.ok(timeline.frames[0].macroSummary.macroMemory, "macro timeline macroSummary should include macroMemory");
assert.ok(timeline.frames[0].macroSummary.poiStates, "macro timeline macroSummary should include poiStates");
assert.ok(!("traces" in timeline.frames[0].macroSummary.macroMemory), "timeline frames should not export full trace rows");
assert.ok(!("traceRows" in timeline.frames[0].macroSummary.macroMemory), "timeline frames should not export trace rows");
assert.ok(timeline.frames[0].macroSummary.macroMemory.coverage, "timeline compact memory summary may include coverage percentages");

sim.clearRecording();
sim.startRecording();
repeatMemory(sim, rotWorld, 10);
sim.recordFrame();
sim.stopRecording();
const recording = sim.createRecordingExport();
assert.ok(recording.macroMemorySummary, "recording export should include top-level compact macroMemorySummary");
assert.ok(!("traces" in recording.macroMemorySummary), "recording macroMemorySummary should stay compact");
assert.equal(recording.pointsOfInterest.length, 1, "custom fixture pointsOfInterest export should stay compact");
assert.ok(!("traceRows" in recording.pointsOfInterest[0]), "pointsOfInterest should not gain per-cell memory rows");

const styleCss = fs.readFileSync("style.css", "utf8");
for (const selector of [
  ".grid.macro-view .memory-human-faint",
  ".grid.macro-view .memory-human-strong",
  ".grid.macro-view .memory-beast-faint",
  ".grid.macro-view .memory-beast-strong",
  ".grid.macro-view .memory-rot-faint",
  ".grid.macro-view .memory-rot-strong",
  ".grid.macro-view .memory-fertile-faint",
  ".grid.macro-view .memory-fertile-strong",
  ".grid.macro-view .memory-conflict-faint",
  ".grid.macro-view .memory-conflict-strong",
]) {
  assert.ok(/--memory-overlay/.test(ruleBlock(styleCss, selector)), `${selector} should set a secondary memory overlay`);
}

console.log("v0.10.9 macro memory slow trace tests passed");
