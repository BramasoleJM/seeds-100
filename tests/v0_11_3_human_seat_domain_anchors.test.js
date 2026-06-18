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
  })) {
    document.getElementById(id).value = value;
  }
  document.getElementById("movementToggle").checked = true;
  document.getElementById("lineageToggle").checked = showLineage;
  document.getElementById("macroOverlayToggle").checked = showTags;

  const context = {
    console,
    document,
    window: {},
    Blob: class Blob {},
    URL: {
      createObjectURL() {
        return "blob:test";
      },
      revokeObjectURL() {},
    },
    setInterval() {
      return 1;
    },
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

function seatOf(memory) {
  const dominant = memory.lineages.find((lineage) => lineage.id === memory.lineages[0].id) || memory.lineages[0];
  return dominant.currentSeat;
}

let { sim } = loadSim();
sim.resetWorld(blankWorld(sim));
const stable = humanDomainWorld(sim, 10, 10);
let memory = updateLineage(sim, stable);
assert.equal(seatOf(memory), null, "seat should not establish from one macro sample");
memory = updateLineage(sim, stable);
assert.equal(seatOf(memory), null, "seat should wait for candidate stability");
memory = updateLineage(sim, stable);
let seat = seatOf(memory);
assert.ok(seat, "stable Human domain should establish a seat after enough samples");
assert.equal(seat.state, "active", "established seat should be active");
assert.ok(seat.support > seat.pressure, "seat should record stronger support than pressure");

const firstSeat = { x: seat.x, y: seat.y };
memory = updateLineage(sim, humanDomainWorld(sim, 11, 10));
seat = seatOf(memory);
assert.deepEqual({ x: seat.x, y: seat.y }, firstSeat, "seat should stay fixed while domain shifts slightly");

const blocked = humanDomainWorld(sim, 16, 10);
blocked[16][10] = blocked[10][16];
blocked[10][16] = sim.createCell(sim.TERRAIN.BLOCK, null, 0, "normal", 0);
sim.resetWorld(blocked);
for (let i = 0; i < 3; i += 1) memory = updateLineage(sim, blocked);
seat = seatOf(memory);
assert.notDeepEqual({ x: seat.x, y: seat.y }, { x: 16, y: 10 }, "seat should not be placed on BLOCK");

sim.resetWorld(stable);
for (let i = 0; i < 3; i += 1) memory = updateLineage(sim, stable);
const establishedLineageId = memory.lineages[0].id;
let blank = blankWorld(sim);
for (let i = 0; i < 6; i += 1) memory = updateLineage(sim, blank);
const oldLineage = memory.lineages.find((lineage) => lineage.id === establishedLineageId);
assert.equal(oldLineage.currentSeat, null, "seat should be abandoned after sustained loss of support");
assert.ok(oldLineage.seatHistory.length >= 1, "seatHistory should keep abandoned old seats");
assert.ok(oldLineage.seatHistory[0].reason, "abandoned seat should include a technical reason");
assert.ok(memory.events.some((event) => event.type === "seat_abandoned"), "seat abandonment should emit an event");

const newDomain = humanDomainWorld(sim, 26, 15);
for (let i = 0; i < 3; i += 1) memory = updateLineage(sim, newDomain);
const seated = memory.lineages.find((lineage) => lineage.currentSeat);
assert.ok(seated, "new stable Human domain should establish a new seat");
assert.ok(memory.events.some((event) => event.type === "seat_established"), "new seat should emit seat_established");

const summary = sim.createHumanLineageSummaryForTest();
assert.ok(summary.currentSeatCount >= 1, "summary should include current seat count");
assert.ok(summary.oldSeatCount >= 1, "summary should include old seat count");
assert.ok(summary.recentSeatEvents.length >= 1, "summary should include recent seat events");
assert.ok(summary.lineages.some((lineage) => "domainArea" in lineage && "oldSeatCount" in lineage), "compact lineages should include seat/domain fields");

const tags = sim.getSemanticTagsForTest(newDomain, { mode: "macro" });
assert.ok(tags.some((tag) => tag.label === "H domain") || tags.some((tag) => tag.label === "H seat"), "semantic tags should explain Human domain/seat without requiring both when decluttered");
assert.ok(tags.some((tag) => tag.label === "H seat"), "semantic tags should include H seat");
assert.ok(summary.oldSeatCount >= 1, "old seat data should remain in compact lineage summary even when side-branch labels are hidden");
assert.equal(tags.some((tag) => tag.label === "H core"), false, "H core should no longer be the primary Human tag");
assert.equal(tags.some((tag) => tag.label === "H path"), false, "H path should not clutter default semantic tags");

sim.clearRecording();
sim.startRecording();
sim.recordFrame();
sim.stopRecording();
const recording = sim.createRecordingExport();
assert.ok(recording.humanLineageMemorySummary.currentSeatCount >= 1, "recording should export current seat count");
assert.ok(recording.humanLineageMemorySummary.oldSeatCount >= 1, "recording should export old seat count");

sim.clearMacroTimeline();
sim.startMacroTimeline();
sim.recordMacroTimelineFrame({ force: true, mode: "macro" });
sim.stopMacroTimeline();
const timeline = sim.createMacroTimelineExport();
assert.ok(timeline.frames[0].macroSummary.humanLineage.currentSeatCount >= 1, "timeline humanLineage summary should include seat counts");
assert.ok(timeline.frames[0].macroSummary.semanticTags.some((tag) => tag.label === "H seat"), "timeline semantic tags should include H seat");

console.log("v0.11.3 human seat/domain anchor tests passed");
