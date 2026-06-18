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
    randomSeed: "131",
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

const { sim } = loadSim();

const seed = {
  version: "0.13.1",
  name: "test seeded map",
  width: 40,
  height: 25,
  units: [
    { type: "H", x: 4, y: 4 },
    { type: "B", x: 14, y: 5 },
    { type: "S", x: 20, y: 8 },
  ],
  mountains: [{ x: 7, y: 7 }],
  rivers: [{ x: 8, y: 8 }, { x: 8, y: 9 }],
  pois: [{ type: "spring", x: 5, y: 5, id: "poi_spring_seed" }],
};

const parsedSeed = sim.parseMapSeedForTest(sim.serializeMapSeedForTest(seed));
assert.equal(parsedSeed.units.length, 3, "map seed JSON should preserve seeded units");
assert.equal(parsedSeed.rivers.length, 2, "map seed JSON should preserve river features");
assert.equal(parsedSeed.pois[0].id, "poi_spring_seed", "map seed JSON should preserve POI ids");

const seededWorld = sim.applyMapSeedToWorldForTest(seed);
assert.equal(seededWorld[7][7].terrain, sim.TERRAIN.BLOCK, "mountain brush should create BLOCK terrain");
assert.equal(seededWorld[4][4].unit, sim.UNIT.HUMAN, "seeded Human should be placed");
assert.equal(seededWorld[5][14].unit, sim.UNIT.BEAST, "seeded Beast should be placed");
assert.equal(seededWorld[8][20].unit, sim.UNIT.SPIRIT, "seeded Spirit should be placed");
assert.notEqual(seededWorld[8][8].terrain, "WATER", "river is a map feature, not a new terrain");
assert.equal(sim.getMapFeaturesForTest().rivers.length, 2, "river cells should be stored as map features");
assert.equal(sim.isCellBlockedForMovementForTest(seededWorld, 8, 8, []), true, "river cells should block simulation movement");
assert.equal(sim.isExploreCellPassableForTest(seededWorld, 8.5, 8.5, []), false, "river cells should block Explore movement");

seededWorld[8][9].fertility = 1;
const restoredWorld = sim.applyRiverFertilityForTest(seededWorld, [{ x: 8, y: 8 }], { force: true });
assert.ok(restoredWorld[8][9].fertility > 1, "river should weakly restore nearby fertility");
assert.ok(restoredWorld[8][9].fertility <= 3, "river restore should cap fertility at level 3");

sim.setPlayerObserverForTest({ x: 5, y: 6, facing: "N", isSleeping: false, lastInteraction: null });
const poiTarget = sim.findExploreInteractionTargetForTest(seededWorld, [], sim.getWorldPOIsForTest());
const poiAnchor = sim.inspectPlaceTargetForTest(poiTarget, seededWorld);
assert.equal(poiAnchor.type, "poi", "inspecting a POI should create a POI place-memory anchor");
assert.ok(poiAnchor.currentSnapshot.ecology, "place-memory anchor should store a stable ecology snapshot");
assert.equal(sim.getPlaceMemoryForTest().anchors.length, 1, "inspected place should be retained in place memory");

sim.setHumanPolityMemoryForTest({
  tick: 0,
  nextId: 2,
  nextVillageId: 2,
  nextEventId: 1,
  polities: [{
    id: "human_polity_001",
    createdTick: 0,
    state: "active",
    rootLineageId: "human_lineage_001",
    lineageIds: ["human_lineage_001"],
    currentSeat: { x: 18, y: 18, state: "active", lineageId: "human_lineage_001", seatSource: "lineage", sourceId: "human_lineage_001" },
    oldSeats: [],
    outpostIds: [],
    villageIds: ["human_village_001"],
    colorIndex: 1,
    recentEvents: [],
  }],
  villages: [{ id: "human_village_001", polityId: "human_polity_001", lineageId: "human_lineage_001", x: 12, y: 12, firstSeenTick: 0, lastSeenTick: 0, state: "active", support: 12, pressure: 0, memorySeed: "village-seed" }],
  events: [],
});
sim.setPlayerObserverForTest({ x: 12, y: 12, facing: "S", isSleeping: false, lastInteraction: null });
const villageTarget = sim.findExploreInteractionTargetForTest(seededWorld, [], sim.getWorldPOIsForTest());
const villageAnchor = sim.inspectPlaceTargetForTest(villageTarget, seededWorld);
assert.equal(villageAnchor.type, "village", "inspecting a Human village should create a village anchor");
assert.equal(villageAnchor.sourceRef.id, "human_village_001", "village anchor should preserve its source id");

const before = sim.snapshotPlaceForTest(villageAnchor, seededWorld);
seededWorld[12][12].unit = null;
seededWorld[12][12].terrain = sim.TERRAIN.MARK;
const after = sim.snapshotPlaceForTest(villageAnchor, seededWorld);
const change = sim.computePlaceChangeForTest(villageAnchor, before, after);
assert.ok(change.playerText.length > 0, "place changes should produce deterministic player-facing text");
assert.ok(change.llmContext.metricsDelta, "place changes should keep numeric deltas in llmContext");
assert.equal(/\b[+-]\d/.test(change.playerText.join(" ")), false, "player-facing change text should not expose raw deltas by default");

sim.enterExploreSleepForTest({ wasPlaying: false });
for (let i = 0; i < sim.EXPLORE_CONFIG.sleepTicksPerRest; i += 1) {
  sim.runExploreSleepStepForTest();
}
const sleepState = sim.getExploreSleepStateForTest();
assert.equal(sleepState.isSleeping, false, "sleep should auto-wake after the fixed rest duration");
const report = sim.getLastWakeReportForTest();
assert.ok(report, "wake should create a report");
assert.ok(report.entries.length >= 1, "wake report should include inspected places");
assert.equal(report.entries.some((entry) => entry.anchorId === "never_inspected"), false, "wake report should only include inspected places");

const recording = sim.createRecordingExport();
assert.ok(recording.mapSeed, "recording export should include the active map seed");
assert.ok(recording.mapFeatures.rivers.length > 0, "recording export should include compact river features");
assert.ok(recording.placeMemory.anchors.length > 0, "recording export should include place memory");

console.log("v0.13.1 map seed, place memory, and wake report tests passed");
