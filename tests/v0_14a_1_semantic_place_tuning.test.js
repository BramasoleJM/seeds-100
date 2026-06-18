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
    randomSeed: "1411",
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

const sim = loadSim();
const traits = sim.SEMANTIC_TRAITS;
const archetypes = sim.PLACE_ARCHETYPES;

const springTraits = [traits.SPRING_FED, traits.FERTILITY_RECOVERING, traits.BEAST_HABITAT];
const springArchetype = sim.derivePlaceArchetypeForTest(
  { poi: { id: "poi_spring", type: "spring" }, placeState: { status: "recovering" } },
  springTraits,
  { placeType: "poi" }
);
assert.notEqual(springArchetype, archetypes.CONTESTED_POI, "normal Spring beast habitat should not become contested_poi");
assert.ok([archetypes.FERTILE_REFUGE, archetypes.BEAST_RANGE].includes(springArchetype), "normal Spring ecology should stay refuge/range-like");

const forestTraits = [traits.GREAT_FOREST_NEARBY, traits.BEAST_HABITAT, traits.WILD_RECOVERING];
const forestArchetype = sim.derivePlaceArchetypeForTest(
  { poi: { id: "poi_forest", type: "great_forest" }, placeState: { status: "active" } },
  forestTraits,
  { placeType: "poi" }
);
assert.notEqual(forestArchetype, archetypes.CONTESTED_POI, "normal Great Forest beast habitat should not become contested_poi");
assert.ok([archetypes.BEAST_RANGE, archetypes.FERTILE_REFUGE, archetypes.ORDINARY_PLACE].includes(forestArchetype), "Great Forest ecology should remain non-contested");

const corruptedPoiArchetype = sim.derivePlaceArchetypeForTest(
  { poi: { id: "poi_marked", type: "monument" }, placeState: { status: "corrupted" } },
  [traits.MONUMENT_SHADOWED, traits.MARK_CORRODED],
  { placeType: "poi" }
);
assert.equal(corruptedPoiArchetype, archetypes.CONTESTED_POI, "corrupted or marked POIs can still become contested_poi");

const spiritPoiArchetype = sim.derivePlaceArchetypeForTest(
  { poi: { id: "poi_spirit", type: "spring" }, placeState: { status: "stable" } },
  [traits.SPRING_FED, traits.SPIRIT_PRESSURE],
  { placeType: "poi" }
);
assert.equal(spiritPoiArchetype, archetypes.CONTESTED_POI, "spirit-pressured POIs can still become contested_poi");

const settledVillageArchetype = sim.derivePlaceArchetypeForTest(
  { placeState: { status: "active" } },
  [traits.HUMAN_SETTLED, traits.POLITY_OWNED, traits.LINEAGE_CONTINUITY],
  { placeType: "village" }
);
assert.equal(settledVillageArchetype, archetypes.SETTLED_VILLAGE, "ordinary owned Human villages should become settled_village");

const world = sim.createDefaultWorld();
for (let y = 4; y <= 6; y += 1) {
  for (let x = 4; x <= 6; x += 1) {
    world[y][x].terrain = sim.TERRAIN.FIELD;
    world[y][x].fertility = 3;
  }
}
world[5][5].unit = sim.UNIT.HUMAN;

sim.setHumanLineageMemoryForTest({
  tick: 0,
  nextId: 2,
  lineages: [{
    id: "human_lineage_900",
    parentId: null,
    rootLineageId: "human_lineage_900",
    firstSeenTick: 0,
    lastSeenTick: 10,
    state: "active",
    origin: { x: 5, y: 5 },
    centroid: { x: 5, y: 5 },
  }],
});
sim.setHumanPolityMemoryForTest({
  tick: 10,
  nextId: 2,
  nextVillageId: 2,
  polities: [{
    id: "human_polity_900",
    createdTick: 0,
    state: "active",
    rootLineageId: "human_lineage_900",
    splitFromPolityId: "human_polity_800",
    lineageIds: ["human_lineage_900"],
    currentSeat: { x: 5, y: 5, state: "active", lineageId: "human_lineage_900" },
  }],
  villages: [{
    id: "human_village_900",
    polityId: "human_polity_900",
    lineageId: "human_lineage_900",
    x: 5,
    y: 5,
    firstSeenTick: 0,
    lastSeenTick: 10,
    state: "active",
    support: 6,
    pressure: 0,
    area: 9,
  }],
});

const identifiedTarget = {
  label: "H village",
  placeType: "village",
  sourceId: "human_village_900",
  x: 5,
  y: 5,
  polityId: "human_polity_900",
  lineageId: "human_lineage_900",
  rootPolityId: "human_polity_900",
  rootLineageId: "human_lineage_900",
  polityAncestryIds: ["human_polity_900", "human_polity_800"],
  lineageAncestryIds: ["human_lineage_900"],
};
const firstAnchor = sim.inspectPlaceTargetForTest(identifiedTarget, world);
assert.equal(firstAnchor.rememberedHumanIdentity.polityId, "human_polity_900", "anchor should remember last-known polity id");
assert.equal(firstAnchor.currentSnapshot.rememberedHumanIdentity.polityId, "human_polity_900", "snapshot should expose remembered identity");

sim.setHumanLineageMemoryForTest({ tick: 11, lineages: [] });
sim.setHumanPolityMemoryForTest({ tick: 11, polities: [], villages: [] });
const anonymousTarget = {
  label: "H village",
  placeType: "village",
  sourceId: "human_village_900",
  x: 5,
  y: 5,
};
const secondAnchor = sim.inspectPlaceTargetForTest(anonymousTarget, world);
assert.equal(secondAnchor.currentSnapshot.humanMemory.polity.id, null, "current snapshot should not pretend remembered polity is current");
assert.equal(secondAnchor.currentSnapshot.humanMemory.lineage.id, null, "current snapshot should not pretend remembered lineage is current");
assert.equal(secondAnchor.rememberedHumanIdentity.polityId, "human_polity_900", "anchor should preserve remembered polity after current identity disappears");
assert.equal(secondAnchor.currentSnapshot.rememberedHumanIdentity.polityId, "human_polity_900", "snapshot should expose remembered identity after current identity disappears");
assert.ok(secondAnchor.changeSinceLastInspect.llmContext.rememberedHumanIdentity, "change context should expose remembered identity");
assert.ok(!secondAnchor.currentSnapshot.semanticTraits.includes(traits.POLITY_OWNED), "remembered identity must not create false current ownership trait");
JSON.stringify(sim.createRecordingExport());

console.log("v0.14A.1 semantic place tuning tests passed");
