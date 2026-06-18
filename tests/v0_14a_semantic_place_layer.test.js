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
    randomSeed: "1401",
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

function createSemanticFixture(sim) {
  const seed = {
    version: "0.14A",
    name: "semantic place fixture",
    width: 40,
    height: 25,
    units: [],
    mountains: [{ x: 17, y: 10 }],
    rivers: [{ x: 10, y: 10 }, { x: 10, y: 11 }],
    pois: [
      { type: "spring", x: 8, y: 10, id: "poi_spring_semantic" },
      { type: "great_forest", x: 16, y: 10, id: "poi_forest_semantic" },
      { type: "rot_source", x: 24, y: 12, id: "poi_rot_semantic" },
    ],
  };
  const world = sim.applyMapSeedToWorldForTest(seed);
  for (let y = 8; y <= 12; y += 1) {
    for (let x = 8; x <= 12; x += 1) {
      if (world[y][x].terrain !== sim.TERRAIN.BLOCK) {
        world[y][x].terrain = sim.TERRAIN.FIELD;
        world[y][x].fertility = 3;
      }
    }
  }
  for (const [x, y] of [[9, 10], [9, 11], [11, 10], [11, 11], [12, 10]]) {
    world[y][x].unit = sim.UNIT.HUMAN;
  }
  for (let y = 11; y <= 13; y += 1) {
    for (let x = 23; x <= 25; x += 1) {
      world[y][x].terrain = sim.TERRAIN.MARK;
      world[y][x].fertility = 1;
    }
  }
  world[12][24].unit = sim.UNIT.SPIRIT;
  world[12][25].unit = sim.UNIT.SPIRIT;
  sim.setHumanLineageMemoryForTest({
    tick: 0,
    nextId: 2,
    nextOutpostId: 1,
    nextEventId: 1,
    lineages: [{
      id: "human_lineage_001",
      parentId: null,
      generation: 0,
      originTick: 0,
      firstSeenTick: 0,
      lastSeenTick: 12,
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
    tick: 12,
    nextId: 2,
    nextVillageId: 2,
    nextEventId: 1,
    polities: [{
      id: "human_polity_001",
      createdTick: 0,
      state: "active",
      rootLineageId: "human_lineage_001",
      splitFromPolityId: "human_polity_000",
      lineageIds: ["human_lineage_001"],
      currentSeat: { x: 10, y: 10, state: "active", lineageId: "human_lineage_001", seatSource: "lineage", sourceId: "human_lineage_001" },
      oldSeats: [],
      outpostIds: [],
      villageIds: ["human_village_001"],
      colorIndex: 1,
      recentEvents: [],
    }],
    villages: [{
      id: "human_village_001",
      polityId: "human_polity_001",
      lineageId: "human_lineage_001",
      x: 10,
      y: 10,
      firstSeenTick: 0,
      lastSeenTick: 12,
      state: "active",
      support: 12,
      pressure: 0,
      area: 14,
      memorySeed: "human_village_001|semantic",
    }],
    events: [],
  });
  return world;
}

const sim = loadSim();

assert.equal(typeof sim.deriveSemanticTraitsForTest, "function", "semantic trait test hook should exist");
assert.equal(typeof sim.derivePlaceArchetypeForTest, "function", "place archetype test hook should exist");
assert.equal(typeof sim.derivePlaceInterpretationHintsForTest, "function", "interpretation hint test hook should exist");

const world = createSemanticFixture(sim);
const villageTarget = {
  label: "H village",
  placeType: "village",
  x: 10,
  y: 10,
  source: "polity",
  sourceId: "human_village_001",
  polityId: "human_polity_001",
  lineageId: "human_lineage_001",
  state: "active",
  support: 12,
  pressure: 0,
  lineageAncestryIds: ["human_lineage_001"],
  polityAncestryIds: ["human_polity_001", "human_polity_000"],
  rootLineageId: "human_lineage_001",
  rootPolityId: "human_polity_001",
};
const villageSnapshot = sim.snapshotPlaceForTest(villageTarget, world);
assert.ok(Array.isArray(villageSnapshot.semanticTraits), "snapshotPlace should include semanticTraits array");
assert.equal(typeof villageSnapshot.placeArchetype, "string", "snapshotPlace should include placeArchetype string");
assert.ok(Array.isArray(villageSnapshot.interpretationHints), "snapshotPlace should include interpretationHints array");
assert.ok(villageSnapshot.semanticTraits.includes("river_adjacent"), "river-adjacent Human place should derive river_adjacent");
assert.ok(
  villageSnapshot.semanticTraits.includes("human_settled") || villageSnapshot.semanticTraits.includes("human_domain"),
  "river-adjacent Human place should derive a Human settlement/domain trait"
);
assert.equal(villageSnapshot.placeArchetype, "river_village", "river-adjacent Human place should derive river_village");
assert.ok(villageSnapshot.semanticTraits.includes("polity_owned"), "Human village should derive polity_owned");
assert.ok(villageSnapshot.semanticTraits.includes("lineage_continuity"), "Human village with ancestry should derive lineage_continuity");

const seatSnapshot = sim.snapshotPlaceForTest({ ...villageTarget, label: "H seat", placeType: "seat" }, world);
assert.ok(seatSnapshot.semanticTraits.includes("human_seat"), "Human seat snapshot should derive human_seat");
assert.ok(seatSnapshot.semanticTraits.includes("polity_owned"), "Human seat snapshot should preserve polity ownership trait");

const spiritTarget = { label: "S scar", placeType: "scar", x: 25, y: 12, source: "population", sourceId: "spirit_scar_test" };
const spiritSnapshot = sim.snapshotPlaceForTest(spiritTarget, world);
assert.ok(
  spiritSnapshot.semanticTraits.includes("spirit_pressure") || spiritSnapshot.semanticTraits.includes("mark_corroded"),
  "MARK / Spirit-heavy place should derive spirit pressure traits"
);
assert.ok(["spirit_scar", "haunted_remnant"].includes(spiritSnapshot.placeArchetype), "MARK / Spirit-heavy place should derive a scar archetype");

const changedSnapshot = JSON.parse(JSON.stringify(villageSnapshot));
changedSnapshot.ecology.markCells += 3;
changedSnapshot.terrain.M += 3;
changedSnapshot.semanticTraits = sim.deriveSemanticTraitsForTest(changedSnapshot, villageTarget);
changedSnapshot.placeArchetype = sim.derivePlaceArchetypeForTest(changedSnapshot, changedSnapshot.semanticTraits, villageTarget);
changedSnapshot.interpretationHints = sim.derivePlaceInterpretationHintsForTest(changedSnapshot, changedSnapshot.semanticTraits, changedSnapshot.placeArchetype);
const change = sim.computePlaceChangeForTest({ id: "village:human_village_001", type: "village", displayName: "H Village", position: { x: 10, y: 10 } }, villageSnapshot, changedSnapshot);
assert.ok(Array.isArray(change.llmContext.semanticTraits), "computePlaceChange llmContext should include semanticTraits");
assert.equal(typeof change.llmContext.placeArchetype, "string", "computePlaceChange llmContext should include placeArchetype");
assert.ok(Array.isArray(change.llmContext.interpretationHints), "computePlaceChange llmContext should include interpretationHints");
assert.equal(change.llmContext.visibleToPlayer, change.visibleToPlayer, "llmContext should expose visibleToPlayer");
assert.equal(change.llmContext.displayName, "H Village", "llmContext should expose displayName");

const sameChange = sim.computePlaceChangeForTest({ id: "village:human_village_001", type: "village", displayName: "H Village" }, villageSnapshot, villageSnapshot);
assert.equal(sameChange.category, "no_significant_change", "unchanged snapshots should remain no_significant_change");
assert.equal(sameChange.visibleToPlayer, false, "no_significant_change should remain hidden");
assert.deepEqual(sameChange.playerText, [], "no_significant_change should remain quiet");
sim.setPlaceMemoryForTest({
  version: "0.14A",
  anchors: [{
    id: "village:human_village_001",
    type: "village",
    displayName: "H Village",
    position: { x: 10, y: 10 },
    sourceRef: { kind: "village", id: "human_village_001" },
    discoveredAtTick: 0,
    lastInspectedAtTick: 0,
    lastSleepObservedTick: null,
    currentSnapshot: villageSnapshot,
    previousSnapshot: null,
    changeSinceLastInspect: null,
    changeSinceLastSleep: null,
  }],
  awakeCycleInspectedAnchorIds: ["village:human_village_001"],
  wakeReports: [],
});
const unchangedReport = sim.completeSleepObservationForTest({
  startedAtTick: 1,
  anchorIds: ["village:human_village_001"],
  beforeSnapshots: { "village:human_village_001": villageSnapshot },
}, world);
assert.equal(unchangedReport.entries.length, 0, "wake report should remain sparse for unchanged watched places");

sim.inspectPlaceTargetForTest(villageTarget, world);
const recording = sim.createRecordingExport();
const exportedAnchor = recording.placeMemory.anchors.find((anchor) => anchor.id === "village:human_village_001");
assert.ok(exportedAnchor.currentSnapshot.semanticTraits.includes("river_adjacent"), "recording export should include semanticTraits in placeMemory snapshots");
assert.equal(exportedAnchor.currentSnapshot.placeArchetype, "river_village", "recording export should include placeArchetype in placeMemory snapshots");
JSON.stringify(recording);

const worldBefore = JSON.stringify(world);
const countsBefore = JSON.stringify(sim.countWorld(world));
const mapFeaturesBefore = JSON.stringify(sim.getMapFeaturesForTest());
const poisBefore = JSON.stringify(sim.getWorldPOIsForTest());
const tickBefore = sim.getExploreSleepStateForTest().tick;
sim.deriveSemanticTraitsForTest(villageSnapshot, villageTarget);
sim.derivePlaceArchetypeForTest(villageSnapshot, villageSnapshot.semanticTraits, villageTarget);
sim.derivePlaceInterpretationHintsForTest(villageSnapshot, villageSnapshot.semanticTraits, villageSnapshot.placeArchetype);
assert.equal(JSON.stringify(world), worldBefore, "semantic derivation must not mutate world cells");
assert.equal(JSON.stringify(sim.countWorld(world)), countsBefore, "semantic derivation must not mutate H/B/S counts or terrain counts");
assert.equal(JSON.stringify(sim.getMapFeaturesForTest()), mapFeaturesBefore, "semantic derivation must not mutate rivers");
assert.equal(JSON.stringify(sim.getWorldPOIsForTest()), poisBefore, "semantic derivation must not mutate POIs");
assert.equal(sim.getExploreSleepStateForTest().tick, tickBefore, "semantic derivation must not mutate tick");

console.log("v0.14A semantic place layer tests passed");
