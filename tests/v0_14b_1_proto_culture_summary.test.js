const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

class FakeClassList {
  constructor(owner) { this.owner = owner; }
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
    this.attributes = {};
    this.textContent = "";
    this.title = "";
    this.value = "";
    this.checked = false;
    this.listeners = {};
    this._innerHTML = "";
    this.className = "";
    this.classList = new FakeClassList(this);
  }
  appendChild(child) { this.children.push(child); return child; }
  addEventListener(name, fn) { this.listeners[name] = fn; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  click() {}
  set innerHTML(value) { this._innerHTML = value; if (value === "") this.children = []; }
  get innerHTML() { return this._innerHTML; }
}

function loadSim() {
  const elements = new Map();
  const document = {
    body: new FakeElement("body"),
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, new FakeElement());
      return elements.get(id);
    },
    createElement(tagName) { return new FakeElement(tagName); },
    addEventListener(name, fn) { this.body.addEventListener(name, fn); },
  };
  for (const [id, value] of Object.entries({
    speed: "180",
    humanCount: "0",
    beastCount: "0",
    spiritCount: "0",
    fieldPatchCount: "0",
    wildPatchCount: "0",
    markPatchCount: "0",
    blockCount: "0",
    randomSeed: "1421",
    presetSelect: "balanced",
    overcrowding: "6",
    keyframeEvery: "25",
    viewMode: "explore",
    interventionUnit: "H",
    mapSeedBrush: "",
    mapSeedJson: "",
  })) document.getElementById(id).value = value;
  document.getElementById("movementToggle").checked = true;
  document.getElementById("lineageToggle").checked = true;
  document.getElementById("macroOverlayToggle").checked = true;
  const context = {
    console,
    document,
    window: {},
    Blob: class Blob {},
    URL: { createObjectURL() { return "blob:test"; }, revokeObjectURL() {} },
    setInterval() { return 1; },
    clearInterval() {},
    Math,
    Date,
    performance,
    requestAnimationFrame() { return 1; },
    cancelAnimationFrame() {},
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("sim.js", "utf8"), context, { filename: "sim.js" });
  return context.window.__triSpeciesSim;
}

function setHumanMemory(sim) {
  sim.setHumanLineageMemoryForTest({
    tick: 0,
    nextId: 3,
    nextOutpostId: 1,
    nextEventId: 1,
    lineages: [{
      id: "human_lineage_014b1",
      parentId: "human_lineage_root",
      rootLineageId: "human_lineage_root",
      lineageAncestryIds: ["human_lineage_014b1", "human_lineage_root"],
      firstSeenTick: 0,
      lastSeenTick: 20,
      state: "active",
      confidence: 1,
      origin: { x: 10, y: 10 },
      centroid: { x: 10, y: 10 },
      centroidPath: [{ tick: 0, x: 10, y: 10 }],
      areaHistory: [{ tick: 0, area: 12 }],
      activeCells: [],
      memoryCells: [],
      domainCells: [],
      seatHistory: [],
      descendantIds: [],
      eventIds: [],
      currentSeat: { x: 10, y: 10, state: "active" },
    }],
    humanOutposts: [],
    events: [],
  });
  sim.setHumanPolityMemoryForTest({
    tick: 20,
    nextId: 3,
    nextVillageId: 2,
    nextEventId: 1,
    polities: [{
      id: "human_polity_014b1",
      createdTick: 0,
      state: "active",
      rootLineageId: "human_lineage_root",
      splitFromPolityId: "human_polity_root",
      polityAncestryIds: ["human_polity_014b1", "human_polity_root"],
      lineageIds: ["human_lineage_014b1"],
      currentSeat: { x: 10, y: 10, state: "active", lineageId: "human_lineage_014b1", seatSource: "lineage", sourceId: "human_lineage_014b1" },
      oldSeats: [],
      outpostIds: [],
      villageIds: ["human_village_014b1"],
      colorIndex: 2,
      recentEvents: [],
    }],
    villages: [{
      id: "human_village_014b1",
      polityId: "human_polity_014b1",
      lineageId: "human_lineage_014b1",
      x: 10,
      y: 10,
      firstSeenTick: 0,
      lastSeenTick: 20,
      state: "active",
      support: 10,
      pressure: 0,
      area: 12,
      memorySeed: "human_village_014b1|summary",
    }],
    events: [],
  });
}

function createRiverVillageFixture(sim) {
  const seed = {
    version: "0.14B.1",
    name: "proto culture summary river fixture",
    width: 40,
    height: 25,
    units: [],
    mountains: [],
    rivers: [{ x: 9, y: 10 }, { x: 9, y: 11 }],
    pois: [{ type: "spring", x: 12, y: 10, id: "poi_spring_proto_summary" }],
  };
  const world = sim.applyMapSeedToWorldForTest(seed);
  for (let y = 8; y <= 12; y += 1) {
    for (let x = 8; x <= 12; x += 1) {
      world[y][x].terrain = sim.TERRAIN.FIELD;
      world[y][x].fertility = 3;
    }
  }
  for (const [x, y] of [[10, 10], [10, 11], [11, 10], [11, 11]]) {
    world[y][x].unit = sim.UNIT.HUMAN;
  }
  setHumanMemory(sim);
  return world;
}

const sim = loadSim();
assert.equal(typeof sim.summarizeProtoCultureForPlaceMemoryForTest, "function", "proto-culture summary test hook should exist");

const riverTarget = {
  label: "H village",
  placeType: "village",
  sourceId: "human_village_014b1",
  x: 10,
  y: 10,
  polityId: "human_polity_014b1",
  lineageId: "human_lineage_014b1",
  rootPolityId: "human_polity_root",
  rootLineageId: "human_lineage_root",
  polityAncestryIds: ["human_polity_014b1", "human_polity_root"],
  lineageAncestryIds: ["human_lineage_014b1", "human_lineage_root"],
};

sim.setPlaceMemoryForTest({
  version: "0.14B",
  anchors: [],
  awakeCycleInspectedAnchorIds: [],
  wakeReports: [],
});
const riverWorld = createRiverVillageFixture(sim);
sim.inspectPlaceTargetForTest(riverTarget, riverWorld);
const riverAnchor = sim.inspectPlaceTargetForTest(riverTarget, riverWorld);
assert.ok(riverAnchor.protoCultureMemory, "fixture should create protoCultureMemory");

const recording = sim.createRecordingExport();
const recordingSummary = recording.placeMemory.protoCultureSummary;
assert.ok(recordingSummary, "recording export should include placeMemory.protoCultureSummary");
assert.equal(recordingSummary.version, "0.14B.1", "summary should use V0.14B.1 version");
assert.equal(typeof recordingSummary.totalAnchors, "number", "summary totalAnchors should be numeric");
assert.equal(typeof recordingSummary.anchorsWithHints, "number", "summary anchorsWithHints should be numeric");
assert.equal(typeof recordingSummary.anchorsWithMemory, "number", "summary anchorsWithMemory should be numeric");

const snapshot = sim.createSnapshotExport();
assert.deepEqual(
  Object.keys(snapshot.placeMemory.protoCultureSummary),
  Object.keys(recordingSummary),
  "snapshot and recording exports should share summary shape"
);

assert.ok(recordingSummary.primaryHintCounts.river_bound >= 1, "river_bound should be counted as a primary hint");
assert.ok(recordingSummary.activeHintCounts.river_bound >= 1, "river_bound should be counted as an active hint");
if (riverAnchor.protoCultureMemory.signals.river_bound.score >= 0.65) {
  assert.ok(recordingSummary.stableHintCounts.river_bound >= 1, "stable river_bound should be counted when it reaches the stable threshold");
}

const nonHumanWorld = sim.applyMapSeedToWorldForTest({
  version: "0.14B.1",
  name: "non human proto summary gate fixture",
  width: 40,
  height: 25,
  units: [],
  mountains: [],
  rivers: [],
  pois: [{ type: "spring", x: 20, y: 12, id: "poi_spring_summary_gate" }],
});
for (let y = 11; y <= 13; y += 1) {
  for (let x = 19; x <= 21; x += 1) {
    nonHumanWorld[y][x].terrain = sim.TERRAIN.WILD;
    nonHumanWorld[y][x].fertility = 4;
  }
}
const nonHumanSnapshot = sim.snapshotPlaceForTest({ label: "Spring", placeType: "poi", x: 20, y: 12 }, nonHumanWorld);
assert.deepEqual(nonHumanSnapshot.protoCultureHints, [], "non-Human places should still not derive proto-culture hints");

const auditMemory = {
  version: "0.14B",
  anchors: [{
    id: "beast_range:population_beast_014b1",
    type: "beast_range",
    displayName: "B range",
    sourceRef: { kind: "beast_range", id: "population_beast_014b1" },
    currentSnapshot: {
      protoCultureHints: [{ id: "forest_edge", score: 0.72, strength: "strong", sourceTraits: ["human_settled", "beast_habitat"], sourceArchetype: "forest_edge_settlement", reason: "test" }],
      semanticTraits: ["human_settled", "beast_habitat"],
    },
    protoCultureMemory: {
      version: "0.14B",
      primaryHint: "forest_edge",
      stableHints: ["forest_edge"],
      activeHints: ["forest_edge"],
      signals: {
        forest_edge: { score: 0.8, samples: 2, firstSeenTick: 1, lastSeenTick: 2, sourceTraits: ["human_settled", "beast_habitat"] },
      },
    },
  }],
  wakeReports: [],
};
const auditSummary = sim.summarizeProtoCultureForPlaceMemoryForTest(auditMemory);
assert.ok(auditSummary.nonHumanAnchorWithHints >= 1, "non-Human-labeled anchors with hints should be counted for audit");
assert.ok(auditSummary.nonHumanAnchorExamples.length >= 1, "non-Human audit examples should be exported compactly");

assert.ok(recordingSummary.strongestExamplesByHint.river_bound, "strongest examples should include a river_bound bucket");
assert.ok(recordingSummary.strongestExamplesByHint.river_bound.length >= 1, "river_bound should include at least one strong example");
for (const field of ["anchorId", "anchorType", "displayName", "score", "stable"]) {
  assert.ok(Object.prototype.hasOwnProperty.call(recordingSummary.strongestExamplesByHint.river_bound[0], field), `strongest example should include ${field}`);
}

const before = JSON.stringify(auditMemory);
sim.summarizeProtoCultureForPlaceMemoryForTest(auditMemory);
const after = JSON.stringify(auditMemory);
assert.equal(after, before, "summary derivation should not mutate place memory");

assert.doesNotThrow(() => JSON.stringify(recording), "recording export should remain JSON stringifiable");

console.log("v0.14B.1 proto-culture summary tests passed");
