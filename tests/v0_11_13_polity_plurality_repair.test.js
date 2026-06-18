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

function patch(source, sim, cx, cy, radius = 2) {
  for (let y = cy - radius; y <= cy + radius; y += 1) {
    for (let x = cx - radius; x <= cx + radius; x += 1) {
      if (x < 0 || x >= 40 || y < 0 || y >= 25) continue;
      source[y][x] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 0, "normal", 3);
    }
  }
}

const { sim } = loadSim();
const source = blankWorld(sim, 2);
patch(source, sim, 9, 10, 2);
patch(source, sim, 30, 15, 2);

const lineageSeat = { x: 9, y: 10, establishedTick: 0, lastStableTick: 0, state: "active", support: 40, pressure: 0, lineageId: "human_lineage_001", seatSource: "lineage", sourceId: "human_lineage_001" };
const outpostSeat = { x: 30, y: 15, establishedTick: 5, lastStableTick: 5, state: "active", support: 30, pressure: 0, lineageId: "human_lineage_001", outpostId: "human_outpost_010", seatSource: "outpost", sourceId: "human_outpost_010" };

sim.setHumanLineageMemoryForTest({
  tick: 0,
  nextId: 2,
  nextEventId: 1,
  nextOutpostId: 11,
  lineages: [{
    id: "human_lineage_001",
    parentId: null,
    generation: 0,
    originTick: 0,
    lastSeenTick: 0,
    state: "stable",
    confidence: 0.9,
    origin: { x: 9, y: 10 },
    centroid: { x: 9, y: 10 },
    centroidPath: [{ x: 9, y: 10 }],
    areaHistory: [{ tick: 0, area: 30 }],
    activeCells: [{ x: 9, y: 10 }],
    memoryCells: [],
    domainCells: [{ x: 9, y: 10 }],
    descendantIds: [],
    eventIds: [],
    missingSamples: 0,
    polityId: "human_polity_001",
    currentSeat: lineageSeat,
    seatHistory: [],
    pendingSeatCandidate: null,
    seatMissingSamples: 0,
  }],
  humanOutposts: [{
    id: "human_outpost_010",
    lineageId: "human_lineage_001",
    polityId: "human_polity_002",
    x: 30,
    y: 15,
    state: "promotable",
    promotedToSeat: true,
    stableSamples: 8,
    area: 26,
    confidence: 0.85,
    support: 30,
    pressure: 0,
  }],
  events: [],
});

sim.setHumanPolityMemoryForTest({
  tick: 0,
  nextId: 5,
  nextVillageId: 4,
  nextEventId: 1,
  splitCooldowns: {},
  polities: [
    { id: "human_polity_001", createdTick: 0, state: "active", rootLineageId: "human_lineage_001", splitFromPolityId: null, lineageIds: ["human_lineage_001"], currentSeat: { ...lineageSeat }, oldSeats: [], outpostIds: [], villageIds: ["human_village_001"], colorIndex: 1, recentEvents: [] },
    { id: "human_polity_002", createdTick: 1, state: "split", rootLineageId: "human_lineage_001", splitFromPolityId: "human_polity_001", lineageIds: ["human_lineage_001"], currentSeat: { ...outpostSeat }, oldSeats: [], outpostIds: ["human_outpost_010"], villageIds: ["human_village_002"], colorIndex: 2, recentEvents: [] },
    { id: "human_polity_003", createdTick: 2, state: "active", rootLineageId: "human_lineage_001", splitFromPolityId: "human_polity_001", lineageIds: ["human_lineage_001"], currentSeat: { ...outpostSeat }, oldSeats: [], outpostIds: ["human_outpost_010"], villageIds: [], colorIndex: 3, recentEvents: [] },
    { id: "human_polity_004", createdTick: 3, state: "seatless", rootLineageId: "human_lineage_001", splitFromPolityId: "human_polity_001", lineageIds: ["human_lineage_001"], currentSeat: null, oldSeats: [], outpostIds: ["human_outpost_010"], villageIds: ["human_village_003"], colorIndex: 4, recentEvents: [], seatlessSamples: 20, decliningSamples: 20 },
  ],
  villages: [
    { id: "human_village_001", polityId: "human_polity_001", lineageId: "human_lineage_001", x: 9, y: 10, firstSeenTick: 0, lastSeenTick: 0, state: "active", area: 20, support: 18, pressure: 0, memorySeed: "seed-1" },
    { id: "human_village_002", polityId: "human_polity_002", lineageId: "human_lineage_001", x: 30, y: 15, firstSeenTick: 0, lastSeenTick: 0, state: "active", area: 20, support: 18, pressure: 0, memorySeed: "seed-2" },
    { id: "human_village_003", polityId: "human_polity_004", lineageId: "human_lineage_001", x: 31, y: 16, firstSeenTick: 0, lastSeenTick: 0, state: "active", area: 18, support: 16, pressure: 0, memorySeed: "seed-3" },
  ],
  events: [],
});

sim.updateHumanPolityMemoryForTest(source, { force: true, mode: "macro" });
const summary = sim.createHumanPolitySummaryForTest();
const validation = sim.validateHumanPolityOwnershipForTest(source);

const lineageOwner = summary.polities.find((polity) => polity.id === "human_polity_001");
const outpostOwner = summary.polities.find((polity) => polity.id === "human_polity_002");
const duplicateOutpostOwner = summary.polities.find((polity) => polity.id === "human_polity_003");
const supportedSeatless = summary.polities.find((polity) => polity.id === "human_polity_004");

assert.ok(lineageOwner.currentSeat, "lineage-source polity should keep currentSeat");
assert.equal(lineageOwner.currentSeat.seatSource, "lineage", "lineage seat should carry seatSource");
assert.ok(outpostOwner.currentSeat, "outpost-derived polity should not be cleared as stale lineage seat");
assert.equal(outpostOwner.currentSeat.seatSource, "outpost", "outpost seat should carry seatSource");
assert.equal(outpostOwner.currentSeat.sourceId, "human_outpost_010", "outpost seat should carry sourceId");
assert.equal(duplicateOutpostOwner.currentSeat, null, "duplicate owner of same outpost source should lose currentSeat");
assert.ok(duplicateOutpostOwner.oldSeats.some((seat) => seat.reason === "ownership_conflict"), "duplicate outpost loser should record ownership_conflict");
assert.notEqual(supportedSeatless.state, "collapsed", "supported seatless polity should not collapse while it has active support");

const remoteVillage = summary.villages.find((village) => village.id === "human_village_002");
assert.equal(remoteVillage.polityId, "human_polity_002", "remote village should stay with spatially plausible outpost-derived polity");
assert.ok(summary.polities.filter((polity) => polity.state !== "collapsed").length >= 2, "deterministic fixture should preserve multiple non-collapsed polities");

assert.equal(validation.collapsedWithCurrentSeat, 0, "collapsed currentSeat invariant should hold");
assert.equal(validation.collapsedCurrentTags, 0, "collapsed current tag invariant should hold");
assert.equal(validation.duplicateSeatOwners, 0, "duplicate authoritative source owners should be zero");
assert.equal(validation.staleLineageSeats, 0, "stale authoritative seats should be zero");
assert.equal(validation.outpostDerivedValidSeatsIncorrectlyCleared, 0, "valid outpost-derived seats should not be incorrectly cleared");

const tags = sim.getSemanticTagsForTest(source, { mode: "macro" });
assert.ok(tags.some((tag) => tag.polityId === "human_polity_002" && (tag.label === "H outpost" || tag.label === "H village" || tag.label === "H domain")), "visible tags should preserve outpost-derived polity ownership");

const recording = sim.createRecordingExport();
const timeline = sim.createMacroTimelineExport();
const exportedOutpostSeat = recording.humanPolitySummary.polities.find((polity) => polity.id === "human_polity_002")?.currentSeat;
assert.equal(exportedOutpostSeat?.seatSource, "outpost", "recording should export outpost seatSource");
assert.equal(exportedOutpostSeat?.sourceId, "human_outpost_010", "recording should export outpost sourceId");
assert.equal(timeline.type, "tri_species_macro_timeline", "macro timeline export type should remain stable");
assert.ok(Array.isArray(timeline.frames), "macro timeline should export compact frames");

const activeVillagesByPolity = summary.villages.reduce((map, village) => {
  if (village.polityId && village.state !== "fading" && village.state !== "remnant") map[village.polityId] = (map[village.polityId] || 0) + 1;
  return map;
}, {});
const oldSeatReasons = summary.polities.flatMap((polity) => polity.oldSeats || []).reduce((map, seat) => {
  map[seat.reason || "unknown"] = (map[seat.reason || "unknown"] || 0) + 1;
  return map;
}, {});
const visibleHTagsByPolity = tags.filter((tag) => tag.polityId && tag.label.startsWith("H ")).reduce((map, tag) => {
  map[tag.polityId] = (map[tag.polityId] || 0) + 1;
  return map;
}, {});
console.log(JSON.stringify({
  activePolities: summary.activePolities,
  seatlessPolities: summary.seatlessPolities,
  collapsedPolities: summary.collapsedPolities,
  activeOutposts: sim.createHumanLineageSummaryForTest().activeOutposts,
  activeVillagesByPolity,
  oldSeatReasons,
  visibleHTagsByPolity,
  validation,
}));

console.log("v0.11.13 polity plurality repair tests passed");
