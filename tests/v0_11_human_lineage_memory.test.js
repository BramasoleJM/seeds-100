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

function loadSim({ viewMode = "macro", showLineage = false } = {}) {
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
  document.getElementById("lineageToggle").checked = showLineage;

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

function humanClusterWorld(sim, cx, cy, radius = 1) {
  const world = blankWorld(sim, 2);
  for (let y = cy - radius; y <= cy + radius; y += 1) {
    for (let x = cx - radius; x <= cx + radius; x += 1) {
      world[y][x] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 0, "normal", 3);
    }
  }
  return world;
}

function updateLineage(sim, source) {
  sim.refreshPopulationEvolutionFrameForTest(source, { force: true, mode: "macro" });
  return sim.updateHumanLineageMemoryForTest(source, { force: true, mode: "macro" });
}

let { sim } = loadSim();
let initial = sim.getHumanLineageMemoryForTest();
assert.equal(initial.version, "0.11.5", "human lineage memory should initialize with current lineage observer version");
assert.ok(Array.isArray(initial.lineages), "human lineage memory should expose a lineage array");
sim.resetWorld(blankWorld(sim));

let stableWorld = humanClusterWorld(sim, 10, 10);
let firstMemory = updateLineage(sim, stableWorld);
assert.equal(firstMemory.lineages.length, 1, "first stable Human shape should create one lineage");
const stableId = firstMemory.lineages[0].id;
let secondMemory = updateLineage(sim, stableWorld);
assert.equal(secondMemory.lineages[0].id, stableId, "stable Human macro shape should keep the same lineage id");
assert.ok(secondMemory.events.some((event) => event.type === "founded"), "lineage should emit a founded event");

let nearbyWorld = humanClusterWorld(sim, 14, 10);
let nearbyMemory = updateLineage(sim, nearbyWorld);
assert.ok(
  nearbyMemory.lineages.some((lineage) => lineage.id === stableId && ["migrating", "stable", "expanding"].includes(lineage.state)),
  "nearby moving or reforming Human shape should preserve the lineage"
);

let blank = blankWorld(sim);
let decliningMemory = updateLineage(sim, blank);
assert.equal(decliningMemory.lineages.find((lineage) => lineage.id === stableId).state, "declining", "missing Human shape should decline before collapse");
let collapsedMemory = decliningMemory;
for (let i = 0; i < 5; i += 1) collapsedMemory = updateLineage(sim, blank);
assert.equal(collapsedMemory.lineages.find((lineage) => lineage.id === stableId).state, "collapsed", "missing Human shape should collapse after a grace window");

let descendantWorld = humanClusterWorld(sim, 13, 11);
let descendantMemory = updateLineage(sim, descendantWorld);
const descendant = descendantMemory.lineages.find((lineage) => lineage.parentId === stableId);
assert.ok(descendant, "nearby Human shape after collapse should become a descendant lineage");
assert.equal(descendant.generation, 1, "descendant generation should increment from parent");
assert.ok(descendantMemory.events.some((event) => event.type === "descended_from"), "descendant relation should emit an event");

({ sim } = loadSim());
sim.resetWorld(blankWorld(sim));
let oldWorld = humanClusterWorld(sim, 8, 8);
let oldMemory = updateLineage(sim, oldWorld);
const oldId = oldMemory.lineages[0].id;
for (let i = 0; i < 6; i += 1) oldMemory = updateLineage(sim, blankWorld(sim));
let farWorld = humanClusterWorld(sim, 31, 18);
let farMemory = updateLineage(sim, farWorld);
const farLineage = farMemory.lineages.find((lineage) => lineage.id !== oldId && lineage.lastSeenTick === farMemory.tick);
assert.ok(farLineage, "far new Human shape should create a new lineage");
assert.equal(farLineage.parentId, null, "far new Human lineage should not be marked as descendant");

({ sim } = loadSim());
sim.resetWorld(blankWorld(sim));
let movingMemory = null;
for (let i = 0; i < 40; i += 1) {
  movingMemory = updateLineage(sim, humanClusterWorld(sim, 5 + (i % 12), 8 + Math.floor(i / 12)));
}
const cappedLineage = movingMemory.lineages[0];
assert.ok(cappedLineage.centroidPath.length <= 24, "centroid path should be capped");
assert.ok(cappedLineage.areaHistory.length <= 24, "area history should be capped");
assert.ok(cappedLineage.activeCells.length <= 80, "active cells should be capped");
assert.ok(cappedLineage.memoryCells.length <= 120, "memory cells should be capped");
assert.ok(movingMemory.events.length <= 80, "event history should be capped");

({ sim } = loadSim({ showLineage: true }));
sim.resetWorld(blankWorld(sim));
let exportWorld = humanClusterWorld(sim, 10, 10);
sim.resetWorld(exportWorld);
updateLineage(sim, exportWorld);
sim.startRecording();
sim.recordFrame();
sim.stopRecording();
const snapshot = sim.createSnapshotExport();
const recording = sim.createRecordingExport();
assert.ok(snapshot.humanLineageMemorySummary, "snapshot should include compact humanLineageMemorySummary");
assert.ok(recording.humanLineageMemorySummary, "recording should include compact humanLineageMemorySummary");
assert.ok(!("activeCells" in snapshot.humanLineageMemorySummary.lineages[0]), "snapshot lineage summary should not export full active cell arrays");
assert.ok(recording.macroMemorySummary, "macro memory export should remain compatible");
assert.ok(recording.macroWorld, "macro world export should remain compatible");

sim.clearMacroTimeline();
sim.startMacroTimeline();
sim.recordMacroTimelineFrame({ force: true, mode: "macro" });
sim.stopMacroTimeline();
const timeline = sim.createMacroTimelineExport();
assert.deepEqual(Object.keys(timeline.frames[0]).sort(), ["counts", "maskCounts", "maskRows", "macroSummary", "regionBiasCounts", "tick"].sort(), "macro timeline frame top-level keys should remain stable");
assert.ok(timeline.frames[0].macroSummary.humanLineage, "macro timeline macroSummary should include human lineage summary");
assert.ok(!("activeCells" in timeline.frames[0].macroSummary.humanLineage.lineages[0]), "timeline lineage summary should stay compact");

const masks = sim.buildMacroDisplayMasks(exportWorld, "macro", []);
const flattenedClasses = masks.cellClasses.flat().join(" ");
assert.ok(flattenedClasses.includes("lineage-human-origin"), "lineage display should emit origin class when enabled");
assert.ok(flattenedClasses.includes("lineage-human-current"), "lineage display should emit current centroid class when enabled");
assert.ok(flattenedClasses.includes("lineage-human-path"), "lineage display should emit path class when enabled");
assert.ok(fs.readFileSync("index.html", "utf8").includes("Show Human Lineage"), "UI should expose Show Human Lineage control");
assert.ok(fs.readFileSync("style.css", "utf8").includes("lineage-human-descendant-link"), "lineage CSS classes should be defined");

console.log("v0.11 human lineage memory tests passed");
