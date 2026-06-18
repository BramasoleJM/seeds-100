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
    randomSeed: "1312",
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
  return { sim: context.window.__triSpeciesSim, document };
}

function createHumanVillageFixture(sim, { riverAtVillage = false } = {}) {
  const world = sim.createDefaultWorld();
  for (let y = 9; y <= 13; y += 1) {
    for (let x = 9; x <= 13; x += 1) {
      world[y][x].terrain = sim.TERRAIN.FIELD;
      world[y][x].fertility = 3;
    }
  }
  for (const [x, y] of [[10, 11], [11, 10], [11, 12], [12, 11], [10, 10], [12, 12]]) {
    world[y][x].unit = sim.UNIT.HUMAN;
  }
  const seed = {
    version: "0.13.1.2",
    name: "river village guard fixture",
    width: 40,
    height: 25,
    units: [],
    mountains: [],
    rivers: riverAtVillage ? [{ x: 11, y: 11 }] : [],
    pois: [],
  };
  sim.applyMapSeedToWorldForTest(seed);
  sim.setHumanLineageMemoryForTest({
    tick: 0,
    nextId: 3,
    lineages: [{
      id: "human_lineage_001",
      parentId: null,
      generation: 0,
      originTick: 0,
      firstSeenTick: 0,
      lastSeenTick: 10,
      state: "active",
      confidence: 1,
      origin: { x: 16, y: 16 },
      centroid: { x: 16, y: 16 },
      centroidPath: [{ tick: 0, x: 16, y: 16 }],
      areaHistory: [{ tick: 0, area: 8 }],
      activeCells: [],
      memoryCells: [],
      domainCells: [],
      seatHistory: [],
      descendantIds: ["human_lineage_002"],
      eventIds: [],
      currentSeat: { x: 16, y: 16, state: "active" },
    }, {
      id: "human_lineage_002",
      parentId: "human_lineage_001",
      generation: 1,
      originTick: 3,
      firstSeenTick: 3,
      lastSeenTick: 10,
      state: "active",
      confidence: 1,
      origin: { x: 11, y: 11 },
      centroid: { x: 11, y: 11 },
      centroidPath: [{ tick: 3, x: 11, y: 11 }],
      areaHistory: [{ tick: 3, area: 9 }],
      activeCells: [],
      memoryCells: [],
      domainCells: [],
      seatHistory: [],
      descendantIds: [],
      eventIds: [],
      currentSeat: null,
    }],
    humanOutposts: [],
    events: [],
  });
  sim.setHumanPolityMemoryForTest({
    tick: 10,
    nextId: 3,
    nextVillageId: 2,
    nextEventId: 1,
    polities: [{
      id: "human_polity_001",
      createdTick: 0,
      state: "active",
      rootLineageId: "human_lineage_001",
      splitFromPolityId: null,
      lineageIds: ["human_lineage_001", "human_lineage_002"],
      currentSeat: { x: 16, y: 16, state: "active", lineageId: "human_lineage_001", seatSource: "lineage", sourceId: "human_lineage_001" },
      oldSeats: [],
      outpostIds: [],
      villageIds: ["human_village_001"],
      colorIndex: 1,
      recentEvents: [],
    }],
    villages: [{
      id: "human_village_001",
      polityId: "human_polity_001",
      lineageId: "human_lineage_002",
      x: 11,
      y: 11,
      firstSeenTick: 0,
      lastSeenTick: 10,
      state: "active",
      support: 12,
      pressure: 0,
      area: 9,
      memorySeed: "human_village_001|human_polity_001|human_lineage_002|0",
    }],
    events: [],
  });
  return world;
}

const allowedPlaceStatuses = new Set(["emerging", "active", "expanding", "shrinking", "contested", "corrupted", "recovering", "abandoned", "remnant", "stable"]);
const allowedDominantPressures = new Set(["human", "beast", "spirit", "rot", "water", "forest", "mixed", "none"]);

const { sim } = loadSim();

const riverWorld = createHumanVillageFixture(sim, { riverAtVillage: true });
assert.equal(sim.isValidHumanVillageCellForTest(riverWorld, 11, 11), false, "FIELD plus river must not be a valid Human village cell");

sim.updateHumanPolityMemoryForTest(riverWorld, { force: true, mode: "macro" });
const villagesAfterRiverUpdate = sim.getHumanPolityMemoryForTest().villages || [];
assert.equal(
  villagesAfterRiverUpdate.some((village) => village.x === 11 && village.y === 11 && village.state !== "fading" && village.state !== "remnant"),
  false,
  "Human village reuse/grace must not keep an active village on a river cell"
);

const stableWorld = createHumanVillageFixture(sim, { riverAtVillage: false });
const villageTarget = {
  label: "H village",
  placeType: "village",
  x: 11,
  y: 11,
  source: "polity",
  sourceId: "human_village_001",
  polityId: "human_polity_001",
  lineageId: "human_lineage_002",
  state: "active",
  support: 12,
  pressure: 0,
  lineageAncestryIds: ["human_lineage_002", "human_lineage_001"],
  polityAncestryIds: ["human_polity_001"],
  rootLineageId: "human_lineage_001",
  rootPolityId: "human_polity_001",
};
const snapshot = sim.snapshotPlaceForTest(villageTarget, stableWorld);
assert.ok(snapshot.placeState, "place snapshot should include structured placeState");
assert.ok(allowedPlaceStatuses.has(snapshot.placeState.status), "placeState status should be an allowed value");
assert.ok(allowedDominantPressures.has(snapshot.placeState.dominantPressure), "placeState dominantPressure should be an allowed value");
assert.equal(snapshot.humanMemory.settlement.kind, "village", "Human village snapshot should include settlement kind");
assert.equal(snapshot.humanMemory.polity.id, "human_polity_001", "Human village snapshot should include polity id");
assert.equal(snapshot.humanMemory.lineage.id, "human_lineage_002", "Human village snapshot should include lineage id");
assert.ok(Array.isArray(snapshot.humanMemory.polity.ancestryIds), "polity ancestry should be an array");
assert.ok(Array.isArray(snapshot.humanMemory.lineage.ancestryIds), "lineage ancestry should be an array");

const sameChange = sim.computePlaceChangeForTest({ id: "place:village", type: "village" }, snapshot, snapshot);
assert.equal(sameChange.category, "no_significant_change", "unchanged snapshots should produce no_significant_change category");
assert.equal(sameChange.visibleToPlayer, false, "no_significant_change should be hidden from the player");
assert.deepEqual(sameChange.playerText, [], "no_significant_change should have no player text");

const expandedSnapshot = JSON.parse(JSON.stringify(snapshot));
expandedSnapshot.ecology.fieldCells += 3;
expandedSnapshot.terrain.F += 3;
expandedSnapshot.humanMemory.settlement.area += 3;
expandedSnapshot.humanMemory.settlement.support += 2;
const expansionChange = sim.computePlaceChangeForTest({ id: "place:village", type: "village" }, snapshot, expandedSnapshot);
assert.ok(expansionChange.metricsDelta.fieldCellsDelta >= 2 || expansionChange.metricsDelta.settlementAreaDelta >= 2, "meaningful Human expansion should keep numeric deltas");
assert.ok(["human_expanded", "village_emerged"].includes(expansionChange.category), "Human expansion should use a Human structured category");
assert.equal(expansionChange.visibleToPlayer, true, "meaningful Human expansion should be visible");
assert.ok(expansionChange.playerText.length >= 1, "meaningful Human expansion should produce player text");

sim.setPlaceMemoryForTest({
  version: "0.13.1",
  anchors: [{
    id: "village:human_village_001",
    type: "village",
    displayName: "H Village",
    position: { x: 11, y: 11 },
    sourceRef: { kind: "village", id: "human_village_001" },
    discoveredAtTick: 0,
    lastInspectedAtTick: 0,
    lastSleepObservedTick: null,
    currentSnapshot: snapshot,
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
  beforeSnapshots: { "village:human_village_001": snapshot },
}, stableWorld);
assert.equal(unchangedReport.entries.length, 0, "wake report should omit unchanged watched places");
assert.equal(unchangedReport.message, "No watched place showed a meaningful change while you slept.", "wake report should use the unchanged fallback");

const inspectedAnchor = sim.inspectPlaceTargetForTest(villageTarget, stableWorld);
const recording = sim.createRecordingExport();
const exportedAnchor = recording.placeMemory.anchors.find((anchor) => anchor.id === inspectedAnchor.id);
assert.ok(exportedAnchor.currentSnapshot.placeState, "recording placeMemory anchors should include placeState");
assert.ok(exportedAnchor.currentSnapshot.humanMemory, "Human recording placeMemory anchors should include humanMemory");
assert.deepEqual(
  Object.keys(sim.createMacroTimelineExport().frames[0] || {
    tick: 0,
    counts: {},
    regionBiasCounts: {},
    maskCounts: {},
    maskRows: [],
    macroSummary: {},
  }).sort(),
  ["counts", "macroSummary", "maskCounts", "maskRows", "regionBiasCounts", "tick"].sort(),
  "macro timeline frame top-level keys should remain stable"
);

console.log("v0.13.1.2 place memory semantics and river village guard tests passed");
