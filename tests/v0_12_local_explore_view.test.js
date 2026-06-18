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

assert.ok(fs.readFileSync("index.html", "utf8").includes('value="explore"'), "view mode select should include Explore option");

const { sim } = loadSim();
assert.equal(sim.EXPLORE_CONFIG.cols * sim.EXPLORE_CONFIG.rows < 40 * 25, true, "Explore viewport should be smaller than full world");

let source = blankWorld(sim);
source[12][20].terrain = sim.TERRAIN.BLOCK;
source[12][21].terrain = sim.TERRAIN.BORDER;
const pois = [{ id: "poi_spring_test", type: sim.POI_TYPES.SPRING, x: 22, y: 12, radius: 3 }];

let player = sim.createPlayerObserverForTest(source, pois);
assert.ok(player.x >= 0 && player.x < 40 && player.y >= 0 && player.y < 25, "player initializes inside bounds");
assert.notEqual(source[Math.floor(player.y)][Math.floor(player.x)].terrain, sim.TERRAIN.BLOCK, "player initializes away from BLOCK");
assert.notEqual(source[Math.floor(player.y)][Math.floor(player.x)].terrain, sim.TERRAIN.BORDER, "player initializes away from BORDER");
assert.equal(sim.isExploreCellPassableForTest(source, player.x, player.y, pois), true, "player initializes on passable cell");

sim.setPlayerObserverForTest({ x: 19, y: 12, targetX: 19, targetY: 12, facing: "E", isMoving: false, isSleeping: false, lastInteraction: null });
let blockedMove = sim.movePlayerObserverForTest(1, 0, source, pois);
assert.equal(blockedMove.x, 19, "player cannot move into BLOCK");
blockedMove = sim.movePlayerObserverForTest(3, 0, source, pois);
assert.equal(blockedMove.x, 19, "player cannot move into hard POI blocker");

source[12][20].terrain = sim.TERRAIN.EMPTY;
let moved = sim.movePlayerObserverForTest(1, 0, source, []);
assert.ok(moved.x > 19, "player can move into passable terrain");
assert.equal(moved.y, 12, "player passable move keeps row");

const viewport = sim.getExploreViewportCellsForTest({ x: 0, y: 0 }, source);
assert.equal(viewport.cells.length, sim.EXPLORE_CONFIG.cols * sim.EXPLORE_CONFIG.rows, "Explore viewport returns fixed local cell count");
assert.equal(viewport.cells.length < 40 * 25, true, "Explore viewport does not return the full world");
assert.equal(Math.min(...viewport.cells.map((cell) => cell.worldX)), 0, "Explore viewport clamps at left edge");
assert.equal(Math.min(...viewport.cells.map((cell) => cell.worldY)), 0, "Explore viewport clamps at top edge");

sim.setPlayerObserverForTest({ x: 10, y: 10, targetX: 10, targetY: 10, facing: "S", isMoving: false, isSleeping: false, lastInteraction: null });
const villageTag = { label: "H village", type: "polity_village", source: "polity", sourceId: "human_village_001", category: "lineage", x: 10, y: 10.8, polityId: "human_polity_001", lineageId: "human_lineage_001", state: "active" };
const scarTag = { label: "S scar", type: "population_spirit", source: "population", sourceId: "population_spirit_001", category: "spirit", x: 10.2, y: 10.2 };
let target = sim.findExploreInteractionTargetForTest(source, [villageTag, scarTag], []);
assert.equal(target.label, "H village", "Space interaction should prefer higher-priority nearby traces");
target = sim.findExploreInteractionTargetForTest(source, [{ ...villageTag, x: 20, y: 20 }], []);
assert.equal(target, null, "Space interaction should ignore targets outside range");

assert.equal(sim.getPlayerObserverForTest().isSleeping, false, "player starts awake");
sim.toggleExploreSleepForTest();
assert.equal(sim.getPlayerObserverForTest().isSleeping, true, "E toggles player to sleeping");
const sleepingPosition = sim.getPlayerObserverForTest();
sim.movePlayerObserverForTest(1, 0, source, []);
assert.equal(sim.getPlayerObserverForTest().x, sleepingPosition.x, "movement is disabled while sleeping");
sim.toggleExploreSleepForTest();
assert.equal(sim.getPlayerObserverForTest().isSleeping, false, "E toggles player awake");

const validation = sim.validateHumanPolityOwnershipForTest(source);
assert.equal(validation.collapsedCurrentTags, 0, "collapsed current tag invariant should remain true");
assert.equal(validation.duplicateSeatOwners, 0, "duplicate authoritative source owners should remain zero");
const recording = sim.createRecordingExport();
assert.ok(recording.playerObserver, "recording export should include compact player observer state");

console.log("v0.12 local explore view tests passed");
