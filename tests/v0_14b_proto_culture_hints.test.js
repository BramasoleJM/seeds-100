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
    randomSeed: "1420",
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
      id: "human_lineage_014b",
      parentId: "human_lineage_root",
      rootLineageId: "human_lineage_root",
      lineageAncestryIds: ["human_lineage_014b", "human_lineage_root"],
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
      id: "human_polity_014b",
      createdTick: 0,
      state: "active",
      rootLineageId: "human_lineage_root",
      splitFromPolityId: "human_polity_root",
      polityAncestryIds: ["human_polity_014b", "human_polity_root"],
      lineageIds: ["human_lineage_014b"],
      currentSeat: { x: 10, y: 10, state: "active", lineageId: "human_lineage_014b", seatSource: "lineage", sourceId: "human_lineage_014b" },
      oldSeats: [],
      outpostIds: [],
      villageIds: ["human_village_014b"],
      colorIndex: 2,
      recentEvents: [],
    }],
    villages: [{
      id: "human_village_014b",
      polityId: "human_polity_014b",
      lineageId: "human_lineage_014b",
      x: 10,
      y: 10,
      firstSeenTick: 0,
      lastSeenTick: 20,
      state: "active",
      support: 10,
      pressure: 0,
      area: 12,
      memorySeed: "human_village_014b|proto",
    }],
    events: [],
  });
}

function createRiverVillageFixture(sim) {
  const seed = {
    version: "0.14B",
    name: "proto culture river fixture",
    width: 40,
    height: 25,
    units: [],
    mountains: [],
    rivers: [{ x: 9, y: 10 }, { x: 9, y: 11 }],
    pois: [{ type: "spring", x: 12, y: 10, id: "poi_spring_proto" }],
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
assert.equal(typeof sim.deriveProtoCultureHintsForTest, "function", "proto-culture hint test hook should exist");
assert.equal(typeof sim.updateProtoCultureMemoryForTest, "function", "proto-culture memory test hook should exist");

const riverWorld = createRiverVillageFixture(sim);
const riverTarget = {
  label: "H village",
  placeType: "village",
  sourceId: "human_village_014b",
  x: 10,
  y: 10,
  polityId: "human_polity_014b",
  lineageId: "human_lineage_014b",
  rootPolityId: "human_polity_root",
  rootLineageId: "human_lineage_root",
  polityAncestryIds: ["human_polity_014b", "human_polity_root"],
  lineageAncestryIds: ["human_lineage_014b", "human_lineage_root"],
};
const countsBefore = JSON.stringify(sim.countWorld(riverWorld));
const riverSnapshot = sim.snapshotPlaceForTest(riverTarget, riverWorld);
const riverHint = riverSnapshot.protoCultureHints.find((hint) => hint.id === "river_bound");
assert.ok(Array.isArray(riverSnapshot.protoCultureHints), "PlaceSnapshot should include protoCultureHints array");
assert.ok(riverHint, "river village should derive river_bound");
assert.ok(riverHint.score >= 0.6, "river_bound should score at least 0.6 for an owned river village");
assert.ok(["emerging", "strong"].includes(riverHint.strength), "river_bound should be emerging or strong");
JSON.stringify(riverSnapshot);
assert.equal(JSON.stringify(sim.countWorld(riverWorld)), countsBefore, "proto-culture derivation must not change world counts");

const nonHumanWorld = sim.applyMapSeedToWorldForTest({
  version: "0.14B",
  name: "non human proto gate fixture",
  width: 40,
  height: 25,
  units: [],
  mountains: [],
  rivers: [],
  pois: [{ type: "spring", x: 20, y: 12, id: "poi_spring_gate" }],
});
for (let y = 11; y <= 13; y += 1) {
  for (let x = 19; x <= 21; x += 1) {
    nonHumanWorld[y][x].terrain = sim.TERRAIN.WILD;
    nonHumanWorld[y][x].fertility = 4;
  }
}
const nonHumanSnapshot = sim.snapshotPlaceForTest({ label: "Spring", placeType: "poi", x: 20, y: 12 }, nonHumanWorld);
assert.deepEqual(nonHumanSnapshot.protoCultureHints, [], "non-Human places should not derive proto-culture hints");

const hauntedWorld = sim.createDefaultWorld();
for (let y = 15; y <= 17; y += 1) {
  for (let x = 24; x <= 26; x += 1) {
    hauntedWorld[y][x].terrain = sim.TERRAIN.MARK;
    hauntedWorld[y][x].fertility = 1;
  }
}
hauntedWorld[16][25].unit = sim.UNIT.SPIRIT;
sim.setHumanLineageMemoryForTest({ tick: 30, lineages: [] });
sim.setHumanPolityMemoryForTest({ tick: 30, polities: [], villages: [] });
const hauntedSnapshot = sim.snapshotPlaceForTest({
  label: "H old seat",
  placeType: "old_seat",
  x: 25,
  y: 16,
  rememberedHumanIdentity: {
    polityId: "human_polity_lost",
    polityState: "collapsed",
    lineageId: "human_lineage_lost",
    rootPolityId: "human_polity_lost",
    rootLineageId: "human_lineage_lost",
    polityAncestryIds: ["human_polity_lost", "human_polity_root"],
    lineageAncestryIds: ["human_lineage_lost"],
    rememberedAtTick: 29,
    source: "test",
  },
}, hauntedWorld);
assert.ok(hauntedSnapshot.protoCultureHints.some((hint) => hint.id === "memory_bound"), "haunted old seat should derive memory_bound");
assert.ok(hauntedSnapshot.protoCultureHints.some((hint) => hint.id === "scar_bound"), "haunted old seat should derive scar_bound");
assert.ok(!hauntedSnapshot.semanticTraits.includes(sim.SEMANTIC_TRAITS.POLITY_OWNED), "remembered identity must not create false current polity ownership");

sim.setPlaceMemoryForTest({
  version: "0.14B",
  anchors: [],
  awakeCycleInspectedAnchorIds: [],
  wakeReports: [],
});
const memoryRiverWorld = createRiverVillageFixture(sim);
const firstAnchor = sim.inspectPlaceTargetForTest(riverTarget, memoryRiverWorld);
const secondAnchor = sim.inspectPlaceTargetForTest(riverTarget, memoryRiverWorld);
assert.ok(secondAnchor.protoCultureMemory, "anchor should accumulate protoCultureMemory");
assert.ok(secondAnchor.protoCultureMemory.signals.river_bound.samples >= 2, "river_bound samples should accumulate");
assert.ok(secondAnchor.protoCultureMemory.activeHints.includes("river_bound"), "river_bound should become active");
assert.equal(secondAnchor.protoCultureMemory.primaryHint, "river_bound", "river_bound should become primary hint");
if (secondAnchor.protoCultureMemory.signals.river_bound.score >= 0.65) {
  assert.ok(secondAnchor.protoCultureMemory.stableHints.includes("river_bound"), "stable river_bound should be listed as stable");
}

sim.setPlaceMemoryForTest({
  version: "0.14B",
  anchors: [secondAnchor],
  awakeCycleInspectedAnchorIds: [secondAnchor.id],
  wakeReports: [],
});
const unchangedReport = sim.completeSleepObservationForTest({
  startedAtTick: 1,
  anchorIds: [secondAnchor.id],
  beforeSnapshots: { [secondAnchor.id]: secondAnchor.currentSnapshot },
}, memoryRiverWorld);
assert.equal(unchangedReport.entries.length, 0, "wake report should remain sparse when only protoCultureMemory updates");

const exported = sim.createRecordingExport();
const exportedAnchor = exported.placeMemory.anchors.find((anchor) => anchor.id === secondAnchor.id);
assert.ok(Array.isArray(exportedAnchor.currentSnapshot.protoCultureHints), "recording export should include snapshot protoCultureHints");
assert.ok(exportedAnchor.protoCultureMemory, "recording export should include protoCultureMemory when hints exist");
JSON.stringify(exported);

console.log("v0.14B proto-culture hints tests passed");
