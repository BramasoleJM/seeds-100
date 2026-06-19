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
    this.href = "";
    this.download = "";
    this.clicked = false;
  }
  appendChild(child) { this.children.push(child); return child; }
  addEventListener(name, fn) { this.listeners[name] = fn; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  click() { this.clicked = true; }
  set innerHTML(value) { this._innerHTML = value; if (value === "") this.children = []; }
  get innerHTML() { return this._innerHTML; }
}

function loadSim() {
  const elements = new Map();
  const document = {
    body: new FakeElement("body"),
    createdElements: [],
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, new FakeElement());
      return elements.get(id);
    },
    createElement(tagName) {
      const element = new FakeElement(tagName);
      this.createdElements.push(element);
      return element;
    },
    addEventListener(name, fn) { this.body.addEventListener(name, fn); },
  };
  for (const [id, value] of Object.entries({
    speed: "180",
    humanCount: "24",
    beastCount: "18",
    spiritCount: "0",
    fieldPatchCount: "3",
    wildPatchCount: "5",
    markPatchCount: "2",
    blockCount: "20",
    randomSeed: "31401",
    presetSelect: "balanced",
    overcrowding: "6",
    keyframeEvery: "25",
    viewMode: "explore",
    interventionUnit: "",
    mapSeedBrush: "",
    mapSeedJson: "",
  })) document.getElementById(id).value = value;
  document.getElementById("movementToggle").checked = true;
  document.getElementById("lineageToggle").checked = true;
  document.getElementById("macroOverlayToggle").checked = true;
  let lastBlobText = "";
  const context = {
    console,
    document,
    window: {},
    Blob: class Blob {
      constructor(parts) { lastBlobText = (parts || []).join(""); }
    },
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
  context.__lastDownloadedJsonForTest = () => lastBlobText;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("sim.js", "utf8"), context, { filename: "sim.js" });
  return { sim: context.window.__triSpeciesSim, document, context };
}

function pointsConnectedEnough(points) {
  const keys = new Set(points.map((point) => `${point.x},${point.y}`));
  let linked = 0;
  for (const point of points) {
    const hasNeighbor = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ].some(([dx, dy]) => keys.has(`${point.x + dx},${point.y + dy}`));
    if (hasNeighbor) linked += 1;
  }
  return linked >= Math.max(4, Math.floor(points.length * 0.85));
}

const { sim, document, context } = loadSim();

const seed = {
  version: "0.14B.2",
  name: "explore blocker fixture",
  width: 40,
  height: 25,
  units: [{ type: "H", x: 6, y: 5 }],
  mountains: [{ x: 8, y: 5 }, { x: 8, y: 6 }, { x: 8, y: 7 }],
  rivers: [{ x: 12, y: 5 }, { x: 12, y: 6 }, { x: 12, y: 7 }],
  pois: [{ type: "spring", x: 15, y: 5, id: "poi_spring_collision" }],
};
const world = sim.applyMapSeedToWorldForTest(seed);
assert.equal(sim.isExploreCellPassableForTest(world, 8.5, 5.5), false, "BLOCK/mountain should block Explore movement");
assert.equal(sim.isExploreCellPassableForTest(world, 12.5, 6.5), false, "river feature should block Explore movement");
assert.equal(sim.isExploreCellPassableForTest(world, 15.5, 5.5), false, "Spring center should block Explore movement");
assert.equal(sim.isExploreCellPassableForTest(world, 7.5, 5.5), true, "ordinary adjacent terrain should stay passable");
assert.equal(sim.isExploreCellPassableForTest(world, 6.5, 5.5), true, "H/B/S units should not block Explore movement");

assert.equal(typeof sim.getExploreCellBlockerReasonForTest, "function", "compact Explore blocker reason helper should exist");
assert.equal(sim.getExploreCellBlockerReasonForTest(world, 8, 5), "BLOCK", "BLOCK helper reason should be explicit");
assert.equal(sim.getExploreCellBlockerReasonForTest(world, 12, 6), "river", "river helper reason should be explicit");
assert.equal(sim.getExploreCellBlockerReasonForTest(world, 15, 5), "spring", "Spring helper reason should be explicit");
assert.equal(sim.getExploreCellBlockerReasonForTest(world, 7, 5), null, "passable cells should not report blocker reason");

sim.setPlayerObserverForTest({ x: 7.45, y: 5.5, facing: "E", isSleeping: false });
const slid = sim.updatePlayerObserverContinuousForTest(0.16, { right: true, down: true }, world);
assert.ok(slid.x < 7.7, "diagonal movement into a vertical wall should not tunnel through the wall");
assert.ok(slid.y > 5.5, "diagonal movement into a wall should slide along the free axis");

const renderModel = sim.getExploreViewportRenderModelForTest({ x: 8.5, y: 6.5, facing: "S", isSleeping: false }, world);
const mountainCell = renderModel.cells.find((cell) => cell.worldX === 8 && cell.worldY === 6);
const riverCell = renderModel.cells.find((cell) => cell.worldX === 12 && cell.worldY === 6);
const springCell = renderModel.cells.find((cell) => cell.worldX === 15 && cell.worldY === 5);
assert.ok(mountainCell.className.includes("terrain-block"), "Explore mountain cell should carry terrain-block class");
assert.ok(mountainCell.className.includes("explore-blocker"), "Explore blocker cells should carry an explicit blocker class");
assert.ok(riverCell.className.includes("map-river"), "Explore river cell should carry map-river class");
assert.ok(riverCell.className.includes("explore-blocker"), "Explore river blockers should carry blocker class");
assert.ok(springCell.className.includes("poi-center"), "Spring center should be visibly marked");
assert.ok(springCell.className.includes("explore-blocker"), "Spring center blocker should carry blocker class");

const css = fs.readFileSync("style.css", "utf8");
assert.match(css, /--block:\s*#0{3,6}\b/i, "BLOCK base variable should be pure or near-pure black");
assert.match(css, /\.grid\.explore-view \.terrain-block[\s\S]*background[^;]*#0{3,6}/i, "Explore BLOCK styling should force a black base");
assert.match(css, /\.grid\.macro-view \.terrain-block[\s\S]*background[^;]*#0{3,6}/i, "Macro BLOCK styling should force a black base");
assert.match(css, /\.grid\.substrate-view \.terrain-block[\s\S]*background[^;]*#0{3,6}/i, "Substrate Macro BLOCK styling should force a black base");
assert.match(css, /terrain-block\.poi-influence[\s\S]*#0{3,6}/i, "BLOCK overlay rules should keep POI influence from lightening mountains");

sim.applyInitialSettings({ randomizeSeed: true, statusPrefix: "test " });
const randomizedExport = sim.createSnapshotExport();
assert.ok(randomizedExport.mapFeatures.rivers.length > 0, "randomized generated worlds should export river map features");
assert.ok(pointsConnectedEnough(randomizedExport.mapFeatures.rivers), "generated rivers should be continuous-ish paths");
for (const river of randomizedExport.mapFeatures.rivers) {
  assert.notEqual(randomizedExport.world.terrainRows[river.y][river.x], "#", "generated rivers should avoid mountains where practical");
}
assert.equal(sim.isExploreCellPassableForTest(sim.getWorldForTest(), randomizedExport.mapFeatures.rivers[0].x + 0.5, randomizedExport.mapFeatures.rivers[0].y + 0.5), false, "generated river cells should remain Explore blockers");

const preset = sim.generateRandomMapSeedPresetForTest();
assert.ok(preset.rivers.length > 0, "editable random map seed preset should still include rivers");
assert.ok(pointsConnectedEnough(preset.rivers), "editable random map seed preset river should remain connected");

assert.equal(typeof sim.createProtoCultureSummaryExport, "function", "lightweight proto-culture export helper should exist");
assert.equal(typeof sim.exportProtoCultureSummaryJson, "function", "proto-culture download helper should exist");
assert.ok(document.getElementById("exportProtoCultureSummary").listeners.click, "Recording panel button should be wired");

const memory = {
  version: "0.14B",
  anchors: [{
    id: "village:compact_export",
    type: "village",
    displayName: "H village",
    position: { x: 10, y: 10 },
    currentSnapshot: {
      placeArchetype: "river_village",
      protoCultureHints: [{ id: "river_bound", score: 0.78, strength: "strong", sourceTraits: ["river_adjacent", "human_settled"], sourceArchetype: "river_village", reason: "test" }],
    },
    protoCultureMemory: {
      version: "0.14B",
      primaryHint: "river_bound",
      stableHints: ["river_bound"],
      activeHints: ["river_bound"],
      signals: {
        river_bound: { score: 0.82, samples: 3, firstSeenTick: 10, lastSeenTick: 30, sourceTraits: ["river_adjacent", "human_settled"] },
      },
    },
  }],
  awakeCycleInspectedAnchorIds: [],
  wakeReports: [],
};
sim.setPlaceMemoryForTest(memory);
const beforeMemory = JSON.stringify(sim.getPlaceMemoryForTest());
const summaryExport = sim.createProtoCultureSummaryExport();
const afterMemory = JSON.stringify(sim.getPlaceMemoryForTest());
assert.equal(summaryExport.type, "tri_species_proto_culture_summary", "summary export should use the lightweight export type");
assert.equal(summaryExport.version, "0.14B.2", "summary export should use the V0.14B.2 version");
assert.ok(summaryExport.placeMemory.protoCultureSummary.primaryHintCounts.river_bound >= 1, "summary export should include protoCultureSummary");
assert.equal(summaryExport.placeMemory.compactAnchors.length, 1, "summary export should include compact anchors");
assert.deepEqual(Object.keys(summaryExport.placeMemory.compactAnchors[0]).sort(), [
  "activeHints",
  "anchorId",
  "anchorType",
  "currentHints",
  "displayName",
  "placeArchetype",
  "position",
  "primaryHint",
  "signals",
  "stableHints",
].sort(), "compact anchors should keep only the lightweight proto-culture fields");
assert.equal("frames" in summaryExport, false, "summary export should not include recording frames");
assert.equal("keyframes" in summaryExport, false, "summary export should not include recording keyframes");
assert.equal(JSON.stringify(summaryExport).includes("terrainRows"), false, "summary export should not include full terrain rows");
assert.equal(afterMemory, beforeMemory, "summary export should not mutate place memory");
assert.doesNotThrow(() => JSON.stringify(summaryExport), "summary export should be JSON stringifiable");
sim.exportProtoCultureSummaryJson();
assert.ok(context.__lastDownloadedJsonForTest().includes("tri_species_proto_culture_summary"), "download helper should serialize the compact export");

assert.equal(typeof sim.runProtoCultureSummaryAuditForSeedsForTest, "function", "multi-seed proto-culture audit helper should exist");
const auditOptions = { seeds: [31401, 31402], ticks: 40, inspectEvery: 10, maxTargets: 12 };
const audit = sim.runProtoCultureSummaryAuditForSeedsForTest(auditOptions);
assert.equal(audit.version, "0.14B.2", "audit helper should report V0.14B.2");
assert.equal(audit.runs.length, 2, "audit helper should return one run per seed");
assert.equal(audit.aggregate.runCount, 2, "audit aggregate should count runs");
assert.ok(audit.runs.every((run) => run.protoCultureSummary && typeof run.protoCultureSummary.totalAnchors === "number"), "each run should include protoCultureSummary");
assert.ok(audit.runs.some((run) => run.protoCultureSummary.anchorsWithMemory > 0), "short audit runs should produce non-empty proto-culture memory");
assert.ok(Object.keys(audit.aggregate.primaryHintCounts).length > 0 || Object.keys(audit.aggregate.activeHintCounts).length > 0, "audit aggregate should include hint counts");
assert.equal(JSON.stringify(audit).includes('"frames"'), false, "audit helper should not return full recordings");
assert.ok(JSON.stringify(audit).length < 250000, "audit helper should stay compact");
const auditAgain = sim.runProtoCultureSummaryAuditForSeedsForTest(auditOptions);
assert.deepEqual(audit.aggregate, auditAgain.aggregate, "audit aggregate should be deterministic for the same seed list");

console.log("v0.14B.2 Explore / River / Proto-Culture audit usability tests passed");
