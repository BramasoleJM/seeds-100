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
    viewMode: "explore",
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
    requestAnimationFrame() { return 1; },
    cancelAnimationFrame() {},
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("sim.js", "utf8"), context, { filename: "sim.js" });
  return { sim: context.window.__triSpeciesSim, document };
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
humanPatch(source, sim, 10, 10, 3);

sim.refreshPopulationEvolutionFrameForTest(source, { force: true, mode: "macro" });
const renderModel = sim.getExploreViewportRenderModelForTest({ x: 10, y: 10, isSleeping: false }, source);
assert.equal(renderModel.gridClasses.includes("macro-view"), true, "Explore render model should use macro-view styling");
assert.equal(renderModel.gridClasses.includes("explore-view"), true, "Explore render model should keep explore-view styling");
assert.ok(renderModel.cells.some((cell) => cell.macroClass && cell.macroClass.length > 0), "local Explore viewport should include macro mask classes");

sim.setPlayerObserverForTest({ x: 10, y: 10, vx: 0, vy: 0, facing: "S", isSleeping: false, lastInteraction: null });
let moved = sim.updatePlayerObserverContinuousForTest(0.1, { up: true, right: true }, source, []);
assert.notEqual(Number.isInteger(moved.x), true, "continuous movement may produce non-integer x");
assert.notEqual(Number.isInteger(moved.y), true, "continuous movement may produce non-integer y");
assert.equal(moved.facing, "E", "continuous movement updates facing");

source[10][11].terrain = sim.TERRAIN.BLOCK;
sim.setPlayerObserverForTest({ x: 10.65, y: 10, vx: 0, vy: 0, facing: "E", isSleeping: false, lastInteraction: null });
let blocked = sim.updatePlayerObserverContinuousForTest(0.2, { right: true }, source, []);
assert.ok(blocked.x < 11 - sim.EXPLORE_CONFIG.playerRadius, "continuous movement should not cross into BLOCK");
source[10][11].terrain = sim.TERRAIN.EMPTY;
const pois = [{ id: "poi_spring_test", type: sim.POI_TYPES.SPRING, x: 11, y: 10, radius: 3, state: "active" }];
blocked = sim.updatePlayerObserverContinuousForTest(0.2, { right: true }, source, pois);
assert.ok(blocked.x < 11 - sim.EXPLORE_CONFIG.playerRadius, "continuous movement should not cross into hard POI blocker");

sim.setPlayerObserverForTest({ x: 5.1, y: 5.1, isSleeping: false, lastInteraction: null });
let target = sim.findExploreInteractionTargetForTest(source, [], [{ id: "poi_monument_test", type: sim.POI_TYPES.MONUMENT, x: 5, y: 5, radius: 3, state: "active" }]);
assert.equal(target.label, "Monument", "interaction should find raw POI center even without semantic tags");

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
    currentSeat: { x: 9, y: 5, state: "active", lineageId: "human_lineage_001", seatSource: "lineage", sourceId: "human_lineage_001" },
    oldSeats: [{ x: 9, y: 6, reason: "lost_domain", lineageId: "human_lineage_001", abandonedTick: 10 }],
    outpostIds: [],
    villageIds: ["human_village_001"],
    colorIndex: 1,
    recentEvents: [],
  }],
  villages: [{ id: "human_village_001", polityId: "human_polity_001", lineageId: "human_lineage_001", x: 5, y: 5, firstSeenTick: 0, lastSeenTick: 0, state: "active", support: 12, pressure: 0, memorySeed: "village-seed" }],
  events: [],
});
sim.setPlayerObserverForTest({ x: 5, y: 5, isSleeping: false, lastInteraction: null });
target = sim.findExploreInteractionTargetForTest(source, [], []);
assert.equal(target.label, "H village", "interaction should find raw Human village from memory");
assert.equal(target.polityId, "human_polity_001", "raw village target should include polityId");
assert.equal(target.lineageId, "human_lineage_001", "raw village target should include lineageId");
assert.equal(target.state, "active", "raw village target should include state");

const beforeTick = sim.calculateStats().tick;
sim.enterExploreSleepForTest({ wasPlaying: false });
assert.equal(sim.getExploreSleepStateForTest().sleepTimerActive, true, "sleep from stopped state should create sleep stepping");
sim.runExploreSleepStepForTest();
assert.ok(sim.calculateStats().tick > beforeTick, "sleep helper should advance world time");
sim.wakeExploreSleepForTest();
assert.equal(sim.getExploreSleepStateForTest().sleepTimerActive, false, "wake should stop sleep stepping created by sleep");

sim.enterExploreSleepForTest({ wasPlaying: true });
assert.equal(sim.getExploreSleepStateForTest().sleepTimerActive, false, "sleep during existing play should not create a second sleep timer");
sim.wakeExploreSleepForTest();

console.log("v0.12.1 explore view correction tests passed");
