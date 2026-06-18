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

function humanDomainWorld(sim, cx, cy, radius = 2) {
  const source = blankWorld(sim, 2);
  for (let y = cy - radius; y <= cy + radius; y += 1) {
    for (let x = cx - radius; x <= cx + radius; x += 1) {
      source[y][x] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 0, "normal", 3);
    }
  }
  return source;
}

function updateLineage(sim, source) {
  sim.refreshPopulationEvolutionFrameForTest(source, { force: true, mode: "macro" });
  return sim.updateHumanLineageMemoryForTest(source, { force: true, mode: "macro" });
}

function activeSeats(memory) {
  return memory.lineages.filter((lineage) => lineage.currentSeat);
}

let { sim } = loadSim();
sim.resetWorld(blankWorld(sim));
const markedDomain = humanDomainWorld(sim, 10, 10);
markedDomain[10][10] = sim.createCell(sim.TERRAIN.MARK, sim.UNIT.HUMAN, 0, "normal", 1);
let memory = null;
for (let i = 0; i < 3; i += 1) memory = updateLineage(sim, markedDomain);
assert.notDeepEqual(activeSeats(memory)[0]?.currentSeat && { x: activeSeats(memory)[0].currentSeat.x, y: activeSeats(memory)[0].currentSeat.y }, { x: 10, y: 10 }, "seat candidate should be rejected on MARK");

const clean = humanDomainWorld(sim, 10, 10);
sim.resetWorld(clean);
for (let i = 0; i < 3; i += 1) memory = updateLineage(sim, clean);
const seatedId = activeSeats(memory)[0].id;
const seat = activeSeats(memory)[0].currentSeat;
const corrupted = humanDomainWorld(sim, 10, 10);
corrupted[seat.y][seat.x] = sim.createCell(sim.TERRAIN.MARK, sim.UNIT.HUMAN, 0, "normal", 1);
memory = updateLineage(sim, corrupted);
assert.equal(memory.lineages.find((lineage) => lineage.id === seatedId).currentSeat.state, "warned", "seat on MARK should warn immediately");
memory = updateLineage(sim, corrupted);
assert.equal(memory.lineages.find((lineage) => lineage.id === seatedId).currentSeat, null, "seat on sustained MARK should abandon quickly");
assert.ok(memory.events.some((event) => event.type === "seat_abandoned" && event.lineageId === seatedId), "corrupted seat should emit abandonment");

const blocked = humanDomainWorld(sim, 16, 10);
blocked[10][16] = sim.createCell(sim.TERRAIN.BLOCK, null, 0, "normal", 0);
blocked.pointsOfInterest = [{ id: "poi_rot", type: "rot_source", x: 16, y: 10, radius: 4, innerRadius: 1, state: "active", createdAtTick: 0 }];
sim.resetWorld(blocked);
for (let i = 0; i < 3; i += 1) memory = updateLineage(sim, blocked);
assert.notDeepEqual(activeSeats(memory)[0]?.currentSeat && { x: activeSeats(memory)[0].currentSeat.x, y: activeSeats(memory)[0].currentSeat.y }, { x: 16, y: 10 }, "seat should reject BLOCK / rot inner ring");

sim.resetWorld(clean);
for (let i = 0; i < 3; i += 1) memory = updateLineage(sim, clean);
const remote = humanDomainWorld(sim, 28, 15);
for (let i = 0; i < 2; i += 1) memory = updateLineage(sim, remote);
let summary = sim.createHumanLineageSummaryForTest();
assert.ok(summary.activeOutposts >= 1, "far Human shape should become H outpost");
assert.ok(summary.currentSeatCount >= 1, "far Human shape should not directly replace existing H seat");
assert.ok(summary.outposts.some((outpost) => outpost.state === "active"), "outpost should require stable samples before active");

for (let i = 0; i < 4; i += 1) memory = updateLineage(sim, blankWorld(sim));
for (let i = 0; i < 5; i += 1) memory = updateLineage(sim, remote);
summary = sim.createHumanLineageSummaryForTest();
assert.ok(summary.currentSeatCount >= 1, "mature outpost can promote when current seat is absent or abandoned");
assert.ok(summary.recentOutpostEvents.some((event) => event.type === "outpost_promoted_to_seat"), "promotion should emit outpost event");

const pressured = humanDomainWorld(sim, 30, 7);
for (let y = 5; y <= 9; y += 1) {
  for (let x = 28; x <= 32; x += 1) {
    if ((x + y) % 2 === 0) pressured[y][x] = sim.createCell(sim.TERRAIN.MARK, sim.UNIT.SPIRIT, 5, "manifestation", 1);
  }
}
sim.resetWorld(clean);
for (let i = 0; i < 3; i += 1) memory = updateLineage(sim, clean);
for (let i = 0; i < 6; i += 1) memory = updateLineage(sim, pressured);
summary = sim.createHumanLineageSummaryForTest();
assert.equal(summary.outposts.some((outpost) => outpost.state === "promotable" && outpost.pressure >= outpost.support), false, "pressured outpost should not promote");

const tags = sim.getSemanticTagsForTest(pressured, { mode: "macro" });
assert.ok(tags.filter((tag) => tag.label === "H outpost").length <= 2, "H outpost tags should be capped");
for (const hidden of ["H now", "H origin", "H path", "H descendant"]) {
  assert.equal(tags.some((tag) => tag.label === hidden), false, `${hidden} should not return to default tags`);
}

const recording = sim.createRecordingExport();
assert.ok(recording.humanLineageMemorySummary.outposts, "recording should include compact outpost list");
assert.ok(!("domainCells" in (recording.humanLineageMemorySummary.outposts[0] || {})), "outpost export should not include full cells");
assert.ok("activeOutposts" in recording.humanLineageMemorySummary, "recording should include activeOutposts count");
assert.ok("promotableOutposts" in recording.humanLineageMemorySummary, "recording should include promotableOutposts count");

console.log("v0.11.5 human outpost / seat promotion tests passed");
