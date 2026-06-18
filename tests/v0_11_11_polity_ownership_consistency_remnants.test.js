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
  appendChild(child) {
    this.children.push(child);
    return child;
  }
  addEventListener(name, fn) {
    this.listeners[name] = fn;
  }
  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }
  set innerHTML(value) {
    this._innerHTML = value;
    if (value === "") this.children = [];
  }
  get innerHTML() {
    return this._innerHTML;
  }
}

function loadSim() {
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
    addEventListener(name, fn) {
      this.body.addEventListener(name, fn);
    },
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
    viewMode: "macro",
    interventionUnit: "H",
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
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("sim.js", "utf8"), context, { filename: "sim.js" });
  return { sim: context.window.__triSpeciesSim };
}

function blankWorld(sim, fertility = 1) {
  return Array.from({ length: 25 }, () =>
    Array.from({ length: 40 }, () => sim.createCell(sim.TERRAIN.EMPTY, null, 0, "normal", fertility, 0, null, sim.REGION_BIAS.NONE))
  );
}

function fieldPatchWorld(sim, x, y) {
  const source = blankWorld(sim, 2);
  for (let yy = y - 2; yy <= y + 2; yy += 1) {
    for (let xx = x - 2; xx <= x + 2; xx += 1) {
      if (xx < 0 || xx >= 40 || yy < 0 || yy >= 25) continue;
      source[yy][xx] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 0, "normal", 3);
    }
  }
  return source;
}

const { sim } = loadSim();
const source = fieldPatchWorld(sim, 10, 10);
const farSupport = fieldPatchWorld(sim, 33, 20);
for (let y = 0; y < 25; y += 1) {
  for (let x = 0; x < 40; x += 1) {
    if (farSupport[y][x].terrain !== sim.TERRAIN.EMPTY || farSupport[y][x].unit) source[y][x] = farSupport[y][x];
  }
}
const seat = { x: 10, y: 10, establishedTick: 0, lastStableTick: 0, state: "active", support: 40, pressure: 0, lineageId: "human_lineage_001" };

sim.setHumanLineageMemoryForTest({
  tick: 0,
  nextId: 2,
  nextEventId: 1,
  nextOutpostId: 1,
  lineages: [{
    id: "human_lineage_001",
    parentId: null,
    generation: 0,
    originTick: 0,
    lastSeenTick: 0,
    state: "stable",
    confidence: 0.9,
    origin: { x: 10, y: 10 },
    centroid: { x: 10, y: 10 },
    centroidPath: [{ x: 10, y: 10 }],
    areaHistory: [{ tick: 0, area: 25 }],
    activeCells: [{ x: 10, y: 10 }],
    memoryCells: [],
    domainCells: [{ x: 10, y: 10 }],
    descendantIds: [],
    eventIds: [],
    missingSamples: 0,
    polityId: "human_polity_001",
    currentSeat: seat,
    seatHistory: [],
    pendingSeatCandidate: null,
    seatMissingSamples: 0,
  }, {
    id: "human_lineage_002",
    parentId: "human_lineage_001",
    generation: 1,
    originTick: 0,
    lastSeenTick: 0,
    state: "stable",
    confidence: 0.85,
    origin: { x: 14, y: 10 },
    centroid: { x: 14, y: 10 },
    centroidPath: [{ x: 14, y: 10 }],
    areaHistory: [{ tick: 0, area: 18 }],
    activeCells: [{ x: 14, y: 10 }],
    memoryCells: [],
    domainCells: [{ x: 14, y: 10 }],
    descendantIds: [],
    eventIds: [],
    missingSamples: 0,
    polityId: "human_polity_004",
    currentSeat: { x: 14, y: 10, establishedTick: 3, lastStableTick: 3, state: "active", support: 30, pressure: 0, lineageId: "human_lineage_002" },
    seatHistory: [],
    pendingSeatCandidate: null,
    seatMissingSamples: 0,
  }],
  humanOutposts: [
    { id: "human_outpost_001", lineageId: "human_lineage_001", polityId: "human_polity_002", x: 12, y: 10, state: "active", stableSamples: 4, area: 20, confidence: 0.8, support: 20, pressure: 0 },
    { id: "human_outpost_002", lineageId: "human_lineage_002", polityId: "human_polity_003", x: 30, y: 20, state: "active", stableSamples: 4, area: 18, confidence: 0.8, support: 18, pressure: 0 },
  ],
  events: [],
});

sim.setHumanPolityMemoryForTest({
  tick: 0,
  nextId: 5,
  nextVillageId: 5,
  nextEventId: 1,
  splitCooldowns: {},
  polities: [
    { id: "human_polity_001", createdTick: 0, state: "active", rootLineageId: "human_lineage_001", splitFromPolityId: null, lineageIds: ["human_lineage_001"], currentSeat: { ...seat }, oldSeats: [], outpostIds: [], villageIds: ["human_village_001"], colorIndex: 1, recentEvents: [] },
    { id: "human_polity_002", createdTick: 1, state: "active", rootLineageId: "human_lineage_001", splitFromPolityId: null, lineageIds: ["human_lineage_001"], currentSeat: { ...seat }, oldSeats: [], outpostIds: ["human_outpost_001"], villageIds: ["human_village_002"], colorIndex: 2, recentEvents: [] },
    { id: "human_polity_003", createdTick: 2, state: "collapsed", rootLineageId: "human_lineage_001", splitFromPolityId: null, lineageIds: ["human_lineage_001"], currentSeat: null, oldSeats: [{ x: 8, y: 8, establishedTick: 0, abandonedTick: 3, reason: "test", lineageId: "human_lineage_001" }], outpostIds: ["human_outpost_002"], villageIds: ["human_village_003", "human_village_004"], colorIndex: 3, recentEvents: [] },
    { id: "human_polity_004", createdTick: 3, state: "active", rootLineageId: "human_lineage_002", splitFromPolityId: "human_polity_003", lineageIds: ["human_lineage_002"], currentSeat: { x: 14, y: 10, establishedTick: 3, lastStableTick: 3, state: "active", support: 30, pressure: 0, lineageId: "human_lineage_002" }, oldSeats: [], outpostIds: [], villageIds: [], colorIndex: 4, recentEvents: [] },
  ],
  villages: [
    { id: "human_village_001", polityId: "human_polity_001", lineageId: "human_lineage_001", x: 9, y: 10, firstSeenTick: 0, lastSeenTick: 0, state: "active", area: 20, support: 18, pressure: 0, memorySeed: "seed-1" },
    { id: "human_village_002", polityId: "human_polity_002", lineageId: "human_lineage_001", x: 12, y: 10, firstSeenTick: 0, lastSeenTick: 0, state: "active", area: 20, support: 18, pressure: 0, memorySeed: "seed-2" },
    { id: "human_village_003", polityId: "human_polity_003", lineageId: "human_lineage_002", x: 14, y: 10, firstSeenTick: 0, lastSeenTick: 0, state: "active", area: 20, support: 18, pressure: 0, memorySeed: "seed-3" },
    { id: "human_village_004", polityId: "human_polity_003", lineageId: "human_lineage_001", x: 33, y: 20, firstSeenTick: 0, lastSeenTick: 0, state: "active", area: 12, support: 18, pressure: 0, memorySeed: "seed-4" },
  ],
  events: [],
});

sim.updateHumanPolityMemoryForTest(source, { force: true, mode: "macro" });
const summary = sim.createHumanPolitySummaryForTest();

const activeSeatOwners = summary.polities.filter((polity) => polity.state !== "collapsed" && polity.currentSeat?.lineageId === "human_lineage_001");
assert.equal(activeSeatOwners.length, 1, "same lineage currentSeat should have one active owner");
assert.equal(activeSeatOwners[0].id, "human_polity_001", "lineage.polityId should win seat ownership conflict");
const losingPolity = summary.polities.find((polity) => polity.id === "human_polity_002");
assert.ok(!losingPolity.currentSeat, "losing duplicate seat polity should clear currentSeat");
assert.ok(losingPolity.state === "seatless" || losingPolity.state === "declining", "losing duplicate seat polity should become seatless/declining");

const inherited = summary.villages.find((village) => village.id === "human_village_003");
assert.equal(inherited.polityId, "human_polity_004", "near collapsed village should inherit into active descendant polity");
assert.equal(inherited.previousPolityId, "human_polity_003", "inherited village should preserve previousPolityId");
assert.equal(inherited.inheritedFromPolityId, "human_polity_003", "inherited village should preserve inheritedFromPolityId");

const remnant = summary.villages.find((village) => village.id === "human_village_004");
assert.equal(remnant.state, "remnant", "far collapsed village should become remnant");
assert.equal(remnant.polityId, null, "remnant should not have current polity owner");
assert.equal(remnant.previousPolityId, "human_polity_003", "remnant should preserve previous polity");
assert.ok(remnant.memorySeed, "remnant should preserve memorySeed");

const tags = sim.getSemanticTagsForTest(source, { mode: "macro" });
assert.ok(!tags.some((tag) => tag.polityId === "human_polity_003" && ["H village", "H outpost", "H domain"].includes(tag.label)), "collapsed polity should not emit normal current tags");
const remnantTags = tags.filter((tag) => tag.label === "H remnant");
assert.ok(remnantTags.length >= 1, "remnant should emit H remnant tag");
assert.ok(remnantTags.length <= 2, "H remnant tags should be capped");
assert.ok(remnantTags[0].previousPolityId, "remnant tag should include previous polity");
assert.ok(remnantTags[0].memorySeed, "remnant tag should include memorySeed");

const blank = blankWorld(sim);
sim.updateHumanPolityMemoryForTest(blank, { force: true, mode: "macro" });
sim.updateHumanPolityMemoryForTest(blank, { force: true, mode: "macro" });
const fadedSummary = sim.createHumanPolitySummaryForTest();
assert.ok(!fadedSummary.villages.some((village) => village.id === "human_village_004" && village.state === "remnant"), "remnant should fade when support disappears");

console.log("v0.11.11 polity ownership consistency / remnants tests passed");
