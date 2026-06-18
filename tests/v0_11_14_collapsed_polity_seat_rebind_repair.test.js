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

function blankWorld(sim, fertility = 2) {
  return Array.from({ length: 25 }, () =>
    Array.from({ length: 40 }, () => sim.createCell(sim.TERRAIN.EMPTY, null, 0, "normal", fertility, 0, null, sim.REGION_BIAS.NONE))
  );
}

function humanPatch(source, sim, cx, cy, radius = 2) {
  for (let y = cy - radius; y <= cy + radius; y += 1) {
    for (let x = cx - radius; x <= cx + radius; x += 1) {
      if (x < 0 || x >= 40 || y < 0 || y >= 25) continue;
      source[y][x] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 0, "normal", 3);
    }
  }
}

const { sim } = loadSim();
const source = blankWorld(sim);
humanPatch(source, sim, 5, 3, 2);

const lineageSeat = {
  x: 5,
  y: 3,
  establishedTick: 940,
  lastStableTick: 940,
  state: "active",
  support: 36.2,
  pressure: 8,
  lineageId: "human_lineage_036",
  seatSource: "lineage",
  sourceId: "human_lineage_036",
};

sim.setHumanLineageMemoryForTest({
  tick: 940,
  nextId: 37,
  nextEventId: 1,
  nextOutpostId: 1,
  lineages: [{
    id: "human_lineage_036",
    parentId: null,
    generation: 0,
    originTick: 900,
    lastSeenTick: 940,
    state: "stable",
    confidence: 0.92,
    origin: { x: 5, y: 3 },
    centroid: { x: 5, y: 3 },
    centroidPath: [{ x: 5, y: 3 }],
    areaHistory: [{ tick: 940, area: 22 }],
    activeCells: [{ x: 5, y: 3 }],
    memoryCells: [],
    domainCells: [{ x: 5, y: 3 }],
    descendantIds: [],
    eventIds: [],
    missingSamples: 0,
    polityId: "human_polity_004",
    currentSeat: lineageSeat,
    seatHistory: [],
    pendingSeatCandidate: null,
    seatMissingSamples: 0,
  }],
  humanOutposts: [],
  events: [],
});

sim.setHumanPolityMemoryForTest({
  tick: 940,
  nextId: 5,
  nextVillageId: 2,
  nextEventId: 1,
  splitCooldowns: {},
  polities: [{
    id: "human_polity_004",
    createdTick: 920,
    state: "collapsed",
    rootLineageId: "human_lineage_036",
    splitFromPolityId: null,
    lineageIds: ["human_lineage_036"],
    currentSeat: null,
    oldSeats: [{ x: 4, y: 3, abandonedTick: 935, reason: "lost_domain", lineageId: "human_lineage_036" }],
    outpostIds: [],
    villageIds: [],
    colorIndex: 4,
    recentEvents: [],
  }],
  villages: [],
  events: [],
});

sim.updateHumanPolityMemoryForTest(source, { force: true, mode: "macro" });
sim.updateHumanPolityMemoryForTest(source, { force: true, mode: "macro" });

const summary = sim.createHumanPolitySummaryForTest();
const lineageSummary = sim.createHumanLineageSummaryForTest();
const memory = sim.getHumanPolityMemoryForTest();
const collapsed = summary.polities.find((polity) => polity.id === "human_polity_004");
const successor = summary.polities.find((polity) => polity.state !== "collapsed" && polity.currentSeat?.sourceId === "human_lineage_036");
const lineage = sim.getHumanLineageMemoryForTest().lineages.find((item) => item.id === "human_lineage_036");

assert.equal(collapsed.currentSeat, null, "collapsed polity should remain historical and have no currentSeat");
assert.notEqual(lineage.polityId, "human_polity_004", "active lineage should rebind away from collapsed polity");
assert.ok(successor, "a non-collapsed polity should own the active lineage seat");
assert.ok(summary.activePolities >= 1, "successor polity should be active after seat sync");
assert.ok(successor.splitFromPolityId === "human_polity_004" || successor.polityAncestryIds.includes("human_polity_004"), "successor should preserve ancestry reference to collapsed polity");

const seatEstablishedEvents = memory.events.filter((event) => event.type === "polity_seat_established" && event.lineageId === "human_lineage_036");
assert.ok(seatEstablishedEvents.length <= 1, "same lineage seat should not emit repeated polity_seat_established events");
const successorEvents = memory.events.filter((event) => event.type === "polity_successor_founded" && event.lineageId === "human_lineage_036");
assert.ok(successorEvents.length <= 1, "successor founded event should not repeat");

const validation = sim.validateHumanPolityOwnershipForTest(source);
assert.equal(validation.collapsedWithCurrentSeat, 0, "collapsed currentSeat invariant should remain true");
assert.equal(validation.collapsedCurrentTags, 0, "collapsed current tag invariant should remain true");
assert.equal(validation.duplicateSeatOwners, 0, "duplicate authoritative source owners should remain zero");

const recording = sim.createRecordingExport();
const recordingCollapsed = recording.humanPolitySummary.polities.find((polity) => polity.id === "human_polity_004");
assert.ok(recording.humanPolitySummary.activePolities >= 1, "recording should export an active successor polity");
assert.ok(recording.humanPolitySummary.polities.some((polity) => polity.currentSeat?.sourceId === "human_lineage_036"), "recording should export the rebound lineage seat");
assert.equal(recordingCollapsed.currentSeat, null, "recording should keep collapsed polity currentSeat null");

const tags = sim.getSemanticTagsForTest(source, { mode: "macro" });
const visibleHTagsByPolity = tags.filter((tag) => tag.polityId && tag.label.startsWith("H ")).reduce((map, tag) => {
  map[tag.polityId] = (map[tag.polityId] || 0) + 1;
  return map;
}, {});
console.log(JSON.stringify({
  activePolities: summary.activePolities,
  seatlessPolities: summary.seatlessPolities,
  collapsedPolities: summary.collapsedPolities,
  lineageCurrentSeatCount: lineageSummary.currentSeatCount,
  polityCurrentSeatCountByState: summary.polities.reduce((map, polity) => {
    if (polity.currentSeat) map[polity.state] = (map[polity.state] || 0) + 1;
    return map;
  }, {}),
  recentSeatEstablishedEvents: seatEstablishedEvents,
  successorFoundedEvents: successorEvents,
  visibleHTagsByPolity,
  collapsedCurrentTagCount: validation.collapsedCurrentTags,
}));

console.log("v0.11.14 collapsed polity seat rebind repair tests passed");
