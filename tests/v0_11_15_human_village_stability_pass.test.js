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

function baseMemories(sim, village, options = {}) {
  const seat = options.seat || { x: 4, y: 4, establishedTick: 0, lastStableTick: 0, state: "active", support: 40, pressure: 0, lineageId: "human_lineage_001", seatSource: "lineage", sourceId: "human_lineage_001" };
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
      origin: { x: 4, y: 4 },
      centroid: options.centroid || { x: 7, y: 6 },
      centroidPath: [options.centroid || { x: 7, y: 6 }],
      areaHistory: [{ tick: 0, area: 30 }],
      activeCells: [{ x: 7, y: 6 }],
      memoryCells: [],
      domainCells: [{ x: 7, y: 6 }],
      descendantIds: [],
      eventIds: [],
      missingSamples: 0,
      polityId: "human_polity_001",
      currentSeat: seat,
      seatHistory: [],
      pendingSeatCandidate: null,
      seatMissingSamples: 0,
    }],
    humanOutposts: [],
    events: [],
  });
  sim.setHumanPolityMemoryForTest({
    tick: 0,
    nextId: 2,
    nextVillageId: 2,
    nextEventId: 1,
    splitCooldowns: {},
    polities: [{
      id: "human_polity_001",
      createdTick: 0,
      state: "active",
      rootLineageId: "human_lineage_001",
      splitFromPolityId: null,
      lineageIds: ["human_lineage_001"],
      currentSeat: seat,
      oldSeats: [],
      outpostIds: [],
      villageIds: village ? [village.id] : [],
      colorIndex: 1,
      recentEvents: [],
    }],
    villages: village ? [village] : [],
    events: [],
  });
}

function village(id, x, y, extras = {}) {
  return {
    id,
    polityId: "human_polity_001",
    lineageId: "human_lineage_001",
    domainId: "human_shape_001",
    x,
    y,
    firstSeenTick: extras.firstSeenTick ?? -10,
    lastSeenTick: extras.lastSeenTick ?? -10,
    state: extras.state || "active",
    area: 20,
    support: extras.support ?? 18,
    pressure: extras.pressure ?? 0,
    missingSamples: extras.missingSamples || 0,
    memorySeed: extras.memorySeed || `${id}|human_polity_001|human_lineage_001|${extras.firstSeenTick ?? -10}`,
  };
}

let loaded = loadSim();
let sim = loaded.sim;
let source = blankWorld(sim);
humanPatch(source, sim, 8, 6, 2);
baseMemories(sim, village("human_village_001", 4, 6, { memorySeed: "stable-seed" }));
sim.updateHumanPolityMemoryForTest(source, { force: true, mode: "macro" });
let summary = sim.createHumanPolitySummaryForTest();
let reused = summary.villages.find((item) => item.id === "human_village_001");
assert.ok(reused, "locally moved village should be reused");
assert.equal(reused.memorySeed, "stable-seed", "locally moved village should keep memorySeed");
assert.ok(Math.hypot(reused.x - 5, reused.y - 6) <= 4, "reused village may drift only within reuse distance");
assert.equal(sim.getHumanPolityMemoryForTest().events.filter((event) => event.type === "village_found").length, 0, "reused village should not emit a second village_found event");

loaded = loadSim();
sim = loaded.sim;
source = blankWorld(sim);
humanPatch(source, sim, 15, 10, 2);
baseMemories(sim, village("human_village_001", 5, 6), { seat: { x: 12, y: 10, establishedTick: 0, lastStableTick: 0, state: "active", support: 40, pressure: 0, lineageId: "human_lineage_001", seatSource: "lineage", sourceId: "human_lineage_001" }, centroid: { x: 15, y: 10 } });
sim.updateHumanPolityMemoryForTest(source, { force: true, mode: "macro" });
summary = sim.createHumanPolitySummaryForTest();
assert.ok(summary.villages.some((item) => item.id !== "human_village_001" && Math.hypot(item.x - 15, item.y - 10) <= 4), "far candidate should create a new village id");

loaded = loadSim();
sim = loaded.sim;
source = blankWorld(sim);
humanPatch(source, sim, 8, 6, 1);
baseMemories(sim, village("human_village_001", 8, 6, { firstSeenTick: -5, lastSeenTick: -1, support: 12 }));
sim.updateHumanPolityMemoryForTest(source, { force: true, mode: "macro" });
summary = sim.createHumanPolitySummaryForTest();
let young = summary.villages.find((item) => item.id === "human_village_001");
assert.ok(young, "young village with nearby support should not be removed immediately");
assert.ok(young.missingSamples >= 1, "young unmatched village should increment missingSamples");
assert.ok(["active", "pressured", "fading"].includes(young.state), "young unmatched village should remain in a readable state");

loaded = loadSim();
sim = loaded.sim;
source = blankWorld(sim);
baseMemories(sim, village("human_village_001", 8, 6, { firstSeenTick: -100, lastSeenTick: -80, missingSamples: 0 }));
for (let i = 0; i < 4; i += 1) sim.updateHumanPolityMemoryForTest(source, { force: true, mode: "macro" });
summary = sim.createHumanPolitySummaryForTest();
assert.equal(summary.villages.some((item) => item.id === "human_village_001"), false, "old unsupported village should be removed after grace samples");
const fadedEvents = sim.getHumanPolityMemoryForTest().events.filter((event) => event.type === "village_faded" && event.villageId === "human_village_001");
assert.equal(fadedEvents.length, 1, "village_faded should emit once across consecutive fading frames");

const validation = sim.validateHumanPolityOwnershipForTest(source);
assert.equal(validation.collapsedWithCurrentSeat, 0, "collapsed currentSeat invariant should remain true");
assert.equal(validation.collapsedCurrentTags, 0, "collapsed current tag invariant should remain true");
assert.equal(validation.duplicateSeatOwners, 0, "duplicate authoritative source owners should remain zero");

console.log("v0.11.15 human village stability pass tests passed");
