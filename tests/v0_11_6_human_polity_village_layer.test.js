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
  set innerHTML(value) {
    this._innerHTML = value;
    if (value === "") this.children = [];
  }
  get innerHTML() {
    return this._innerHTML;
  }
}

function loadSim({ viewMode = "macro", showLineage = true, showTags = true } = {}) {
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
    addEventListener() {},
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
    viewMode,
    interventionUnit: "H",
  })) document.getElementById(id).value = value;
  document.getElementById("movementToggle").checked = true;
  document.getElementById("lineageToggle").checked = showLineage;
  document.getElementById("macroOverlayToggle").checked = showTags;

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

function humanDomainWorld(sim, cx, cy, radius = 3) {
  const source = blankWorld(sim, 2);
  for (let y = cy - radius; y <= cy + radius; y += 1) {
    for (let x = cx - radius; x <= cx + radius; x += 1) {
      if (x < 0 || x >= 40 || y < 0 || y >= 25) continue;
      source[y][x] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 0, "normal", 3);
    }
  }
  return source;
}

function mergeWorlds(sim, ...sources) {
  const merged = blankWorld(sim, 2);
  for (const source of sources) {
    for (let y = 0; y < 25; y += 1) {
      for (let x = 0; x < 40; x += 1) {
        if (source[y][x].terrain !== sim.TERRAIN.EMPTY || source[y][x].unit) merged[y][x] = source[y][x];
      }
    }
  }
  return merged;
}

function updateAll(sim, source) {
  sim.refreshPopulationEvolutionFrameForTest(source, { force: true, mode: "macro" });
  sim.updateHumanLineageMemoryForTest(source, { force: true, mode: "macro" });
  return sim.updateHumanPolityMemoryForTest(source, { force: true, mode: "macro" });
}

function activeSeats(memory) {
  return memory.lineages.filter((lineage) => lineage.currentSeat);
}

let { sim } = loadSim();
const clean = humanDomainWorld(sim, 10, 10);
sim.resetWorld(clean);
let lineage = null;
let polity = null;
for (let i = 0; i < 3; i += 1) {
  sim.refreshPopulationEvolutionFrameForTest(clean, { force: true, mode: "macro" });
  lineage = sim.updateHumanLineageMemoryForTest(clean, { force: true, mode: "macro" });
}
polity = sim.updateHumanPolityMemoryForTest(clean, { force: true, mode: "macro" });
assert.equal(polity.version, "0.11.6", "polity memory should use V0.11.6");
assert.ok(polity.polities.length >= 1, "valid Human seat should create a Human polity");
assert.ok(polity.polities[0].currentSeat, "polity should own the current seat");
assert.ok(polity.polities[0].lineageIds.includes(activeSeats(lineage)[0].id), "seated lineage should be assigned to polity");

let summary = sim.createHumanPolitySummaryForTest();
assert.ok(summary.activePolities >= 1, "summary should count active polities");
assert.ok(summary.villages.some((village) => village.polityId), "villages should know their polity");
assert.ok(summary.villages.every((village) => clean[village.y][village.x].terrain === sim.TERRAIN.FIELD), "villages should sit on FIELD cells");
assert.ok(summary.villages.every((village) => village.state === "active" || village.state === "pressured"), "fresh villages should be active or pressured");

const remote = humanDomainWorld(sim, 30, 15);
const splitWorld = mergeWorlds(sim, clean, remote);
for (let i = 0; i < 5; i += 1) updateAll(sim, splitWorld);
summary = sim.createHumanPolitySummaryForTest();
assert.ok(summary.polities.length >= 2, "mature far outpost with live parent seat should create a split polity");
assert.ok(summary.recentEvents.some((event) => event.type === "polity_split"), "split should emit polity_split event");

const blank = blankWorld(sim);
for (let i = 0; i < 6; i += 1) updateAll(sim, blank);
for (let i = 0; i < 5; i += 1) updateAll(sim, remote);
summary = sim.createHumanPolitySummaryForTest();
assert.ok(summary.polities.some((item) => item.currentSeat && item.state !== "collapsed"), "seatless or collapsed polity can receive a mature outpost seat");

const pressured = humanDomainWorld(sim, 12, 9);
sim.resetWorld(pressured);
for (let i = 0; i < 3; i += 1) {
  sim.refreshPopulationEvolutionFrameForTest(pressured, { force: true, mode: "macro" });
  sim.updateHumanLineageMemoryForTest(pressured, { force: true, mode: "macro" });
}
let seat = activeSeats(sim.getHumanLineageMemoryForTest())[0].currentSeat;
for (let y = seat.y - 2; y <= seat.y + 2; y += 1) {
  for (let x = seat.x - 2; x <= seat.x + 2; x += 1) {
    if (x === seat.x && y === seat.y) continue;
    if ((x + y) % 2 === 0) pressured[y][x] = sim.createCell(sim.TERRAIN.MARK, null, 0, "normal", 1);
  }
}
polity = updateAll(sim, pressured);
summary = sim.createHumanPolitySummaryForTest();
assert.ok(summary.polities.some((item) => item.state === "pressured"), "polity should expose pressured state");
assert.ok(summary.polities.some((item) => item.currentSeat?.state === "pressured"), "seat should expose pressured state");
const pressuredTags = sim.getSemanticTagsForTest(pressured, { mode: "macro" });
assert.ok(pressuredTags.some((tag) => tag.label === "H pressured seat"), "semantic tags should include H pressured seat where appropriate");

const blocked = humanDomainWorld(sim, 18, 10, 4);
blocked[10][18] = sim.createCell(sim.TERRAIN.MARK, sim.UNIT.SPIRIT, 5, "manifestation", 1);
blocked[9][18] = sim.createCell(sim.TERRAIN.BLOCK, null, 0, "normal", 0);
blocked[11][18] = sim.createCell(sim.TERRAIN.BORDER, null, 0, "normal", 0);
blocked.pointsOfInterest = [{ id: "poi_rot", type: "rot_source", x: 18, y: 10, radius: 4, innerRadius: 1, state: "active", createdAtTick: 0 }];
sim.resetWorld(blocked);
for (let i = 0; i < 3; i += 1) updateAll(sim, blocked);
summary = sim.createHumanPolitySummaryForTest();
assert.ok(summary.villages.length <= 24, "village export should be capped");
assert.ok(summary.villages.every((village) => ![sim.TERRAIN.MARK, sim.TERRAIN.BLOCK, sim.TERRAIN.BORDER].includes(blocked[village.y][village.x].terrain)), "villages should avoid invalid terrain");
assert.ok(summary.villages.every((village) => Math.hypot(village.x - 18, village.y - 10) > 1), "villages should avoid rot-source inner ring hard blocker");

const tags = sim.getSemanticTagsForTest(blocked, { mode: "macro" });
assert.ok(tags.filter((tag) => tag.label === "H village").length <= 6, "H village tags should be capped");
assert.ok(tags.some((tag) => tag.label === "H village"), "semantic tags should include H village");

const recording = sim.createRecordingExport();
assert.ok(recording.humanPolitySummary, "recording should export humanPolitySummary");
assert.ok(recording.humanPolitySummary.villages.every((village) => !("domainCells" in village)), "village export should stay compact");

sim.clearMacroTimeline();
sim.startMacroTimeline();
sim.recordMacroTimelineFrame({ force: true, mode: "macro" });
sim.stopMacroTimeline();
const timeline = sim.createMacroTimelineExport();
assert.ok(timeline.frames[0].macroSummary.humanPolity, "macro timeline should include compact humanPolity summary");

console.log("v0.11.6 human polity / village layer tests passed");
