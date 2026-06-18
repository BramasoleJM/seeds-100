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

function fieldWorld(sim) {
  const source = blankWorld(sim, 2);
  for (let y = 8; y <= 12; y += 1) {
    for (let x = 8; x <= 14; x += 1) {
      source[y][x] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 0, "normal", 3);
    }
  }
  return source;
}

const { sim } = loadSim();
const source = fieldWorld(sim);
const authoritativeSeat = { x: 10, y: 10, establishedTick: 0, lastStableTick: 0, state: "active", support: 40, pressure: 0, lineageId: "human_lineage_001" };
const duplicateSeat = { ...authoritativeSeat };
const staleSeat = { x: 20, y: 20, establishedTick: 0, lastStableTick: 0, state: "active", support: 20, pressure: 0, lineageId: "human_lineage_003" };
const collapsedSeat = { x: 12, y: 10, establishedTick: 0, lastStableTick: 0, state: "active", support: 20, pressure: 0, lineageId: "human_lineage_002" };

sim.setHumanLineageMemoryForTest({
  tick: 0,
  nextId: 4,
  nextEventId: 1,
  nextOutpostId: 1,
  lineages: [
    {
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
      areaHistory: [{ tick: 0, area: 30 }],
      activeCells: [{ x: 10, y: 10 }],
      memoryCells: [],
      domainCells: [{ x: 10, y: 10 }],
      descendantIds: [],
      eventIds: [],
      missingSamples: 0,
      polityId: "human_polity_001",
      currentSeat: authoritativeSeat,
      seatHistory: [],
      pendingSeatCandidate: null,
      seatMissingSamples: 0,
    },
    {
      id: "human_lineage_002",
      parentId: "human_lineage_001",
      generation: 1,
      originTick: 0,
      lastSeenTick: 0,
      state: "collapsed",
      confidence: 0.5,
      origin: { x: 12, y: 10 },
      centroid: { x: 12, y: 10 },
      centroidPath: [{ x: 12, y: 10 }],
      areaHistory: [{ tick: 0, area: 4 }],
      activeCells: [],
      memoryCells: [],
      domainCells: [],
      descendantIds: [],
      eventIds: [],
      missingSamples: 3,
      polityId: "human_polity_003",
      currentSeat: null,
      seatHistory: [],
      pendingSeatCandidate: null,
      seatMissingSamples: 0,
    },
    {
      id: "human_lineage_003",
      parentId: null,
      generation: 0,
      originTick: 0,
      lastSeenTick: 0,
      state: "stable",
      confidence: 0.6,
      origin: { x: 5, y: 5 },
      centroid: { x: 5, y: 5 },
      centroidPath: [{ x: 5, y: 5 }],
      areaHistory: [{ tick: 0, area: 4 }],
      activeCells: [],
      memoryCells: [],
      domainCells: [],
      descendantIds: [],
      eventIds: [],
      missingSamples: 0,
      polityId: "human_polity_004",
      currentSeat: null,
      seatHistory: [],
      pendingSeatCandidate: null,
      seatMissingSamples: 0,
    },
  ],
  humanOutposts: [
    { id: "human_outpost_001", lineageId: "human_lineage_002", polityId: "human_polity_003", x: 12, y: 10, state: "active", stableSamples: 3, area: 12, confidence: 0.8, support: 12, pressure: 0 },
  ],
  events: [],
});

sim.setHumanPolityMemoryForTest({
  tick: 0,
  nextId: 5,
  nextVillageId: 3,
  nextEventId: 1,
  splitCooldowns: {},
  polities: [
    { id: "human_polity_001", createdTick: 0, state: "active", rootLineageId: "human_lineage_001", splitFromPolityId: null, lineageIds: ["human_lineage_001"], currentSeat: { ...authoritativeSeat }, oldSeats: [], outpostIds: [], villageIds: ["human_village_001"], colorIndex: 1, recentEvents: [] },
    { id: "human_polity_002", createdTick: 1, state: "active", rootLineageId: "human_lineage_001", splitFromPolityId: null, lineageIds: ["human_lineage_001"], currentSeat: { ...duplicateSeat }, oldSeats: [], outpostIds: [], villageIds: [], colorIndex: 2, recentEvents: [] },
    { id: "human_polity_003", createdTick: 2, state: "collapsed", rootLineageId: "human_lineage_002", splitFromPolityId: "human_polity_001", lineageIds: ["human_lineage_002"], currentSeat: { ...collapsedSeat }, oldSeats: [], outpostIds: ["human_outpost_001"], villageIds: ["human_village_002"], colorIndex: 3, recentEvents: [] },
    { id: "human_polity_004", createdTick: 3, state: "active", rootLineageId: "human_lineage_003", splitFromPolityId: null, lineageIds: ["human_lineage_003"], currentSeat: { ...staleSeat }, oldSeats: [], outpostIds: [], villageIds: [], colorIndex: 4, recentEvents: [] },
  ],
  villages: [
    { id: "human_village_001", polityId: "human_polity_001", lineageId: "human_lineage_001", x: 9, y: 10, firstSeenTick: 0, lastSeenTick: 0, state: "active", area: 12, support: 18, pressure: 0, memorySeed: "seed-1" },
    { id: "human_village_002", polityId: "human_polity_003", lineageId: "human_lineage_002", x: 12, y: 10, firstSeenTick: 0, lastSeenTick: 0, state: "active", area: 12, support: 18, pressure: 0, memorySeed: "seed-2" },
  ],
  events: [],
});

sim.updateHumanPolityMemoryForTest(source, { force: true, mode: "macro" });
let summary = sim.createHumanPolitySummaryForTest();
let validation = sim.validateHumanPolityOwnershipForTest(source);

assert.equal(validation.collapsedWithCurrentSeat, 0, "collapsed polities must clear currentSeat");
assert.equal(validation.collapsedCurrentTags, 0, "collapsed polities must not emit current tags");
assert.equal(validation.duplicateSeatOwners, 0, "duplicate active seat ownership must be resolved");
assert.equal(validation.staleLineageSeats, 0, "stale lineage seats must be cleared");

const collapsed = summary.polities.find((polity) => polity.id === "human_polity_003");
assert.equal(collapsed.currentSeat, null, "collapsed polity should export null currentSeat");
assert.ok(collapsed.oldSeats.some((seat) => seat.reason === "polity_collapsed"), "collapsed seat should be preserved as oldSeat");

const loser = summary.polities.find((polity) => polity.id === "human_polity_002");
assert.equal(loser.currentSeat, null, "duplicate loser should clear currentSeat");
assert.ok(loser.oldSeats.some((seat) => seat.reason === "ownership_conflict"), "duplicate loser should keep oldSeat reason ownership_conflict");

const stale = summary.polities.find((polity) => polity.id === "human_polity_004");
assert.equal(stale.currentSeat, null, "stale lineage seat owner should clear currentSeat");
assert.ok(stale.oldSeats.some((seat) => seat.reason === "stale_lineage_seat"), "stale seat should keep oldSeat reason stale_lineage_seat");

const tags = sim.getSemanticTagsForTest(source, { mode: "macro" });
assert.ok(!tags.some((tag) => tag.polityId === "human_polity_003" && ["H seat", "H pressured seat", "H village", "H outpost", "H domain"].includes(tag.label)), "collapsed polity should not emit current semantic tags");

const recording = sim.createRecordingExport();
assert.equal(recording.humanPolitySummary.polities.filter((polity) => polity.state === "collapsed" && polity.currentSeat).length, 0, "recording should not export collapsed currentSeat");

sim.clearMacroTimeline();
sim.startMacroTimeline();
sim.recordMacroTimelineFrame({ force: true, mode: "macro" });
sim.stopMacroTimeline();
const timeline = sim.createMacroTimelineExport();
const collapsedCurrentTags = timeline.frames.flatMap((frame) => frame.macroSummary.semanticTags || [])
  .filter((tag) => tag.polityId === "human_polity_003" && ["H seat", "H pressured seat", "H village", "H outpost", "H domain"].includes(tag.label));
assert.equal(collapsedCurrentTags.length, 0, "timeline should not export collapsed current tags");

validation = sim.validateHumanPolityOwnershipForTest(source);
assert.deepEqual(validation, {
  collapsedWithCurrentSeat: 0,
  collapsedCurrentTags: 0,
  duplicateSeatOwners: 0,
  staleLineageSeats: 0,
  outpostDerivedValidSeatsIncorrectlyCleared: 0,
}, "final ownership validation counts must all be zero");

console.log("v0.11.12 polity ownership hardening final tests passed");
