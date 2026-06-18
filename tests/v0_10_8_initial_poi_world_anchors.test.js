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

function loadSim({ viewMode = "macro" } = {}) {
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
  document.getElementById("macroOverlayToggle").checked = false;

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

function makeBlankWorld(sim) {
  return Array.from({ length: 25 }, () =>
    Array.from({ length: 40 }, () => sim.createCell(sim.TERRAIN.EMPTY, null, 0, "normal", 2, 0, null, sim.REGION_BIAS.NONE))
  );
}

function classNames(document) {
  return document.getElementById("grid").children.map((cell) => cell.className);
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function ruleBlock(selector, css) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, "s"));
  assert.ok(match, `${selector} should exist`);
  return match[1];
}

const styleCss = fs.readFileSync("style.css", "utf8");
const indexHtml = fs.readFileSync("index.html", "utf8");

let loaded = loadSim({ viewMode: "macro" });
let { sim, document } = loaded;
let pois = sim.getWorldPOIsForTest();
assert.equal(pois.length, 4, "initialization should create exactly four POIs");
assert.deepEqual(pois.map((poi) => poi.type).sort(), ["great_forest", "monument", "rot_source", "spring"], "initial POI types should be monument, rot_source, spring, great_forest");
for (const poi of pois) {
  assert.equal(poi.radius, poi.type === "great_forest" ? 5 : 4, `${poi.type} should use its configured radius`);
  assert.equal(poi.strength, "strong", `${poi.type} should use strong strength`);
  assert.equal(poi.state, "active", `${poi.type} should start active`);
  assert.equal(poi.createdAtTick, 0, `${poi.type} should be created at tick 0`);
  const cell = sim.getMacroDisplayWorldForTest()[poi.y][poi.x];
  assert.notEqual(cell.terrain, sim.TERRAIN.BLOCK, `${poi.type} center should not be BLOCK`);
}
for (let i = 0; i < pois.length; i += 1) {
  for (let j = i + 1; j < pois.length; j += 1) {
    assert.ok(distance(pois[i], pois[j]) >= 5, "POI centers should be separated when possible");
  }
}

const effects = sim.POI_EFFECTS;
assert.equal(effects.MONUMENT_FIELD_DECAY_MULTIPLIER, 0.5, "monument should expose FIELD decay protection multiplier");
assert.equal(effects.MONUMENT_HAUNTED_FIELD_MULTIPLIER, 0.5, "monument should expose haunted FIELD protection multiplier");

let world = makeBlankWorld(sim);
world[10][10] = sim.createCell(sim.TERRAIN.EMPTY, null, 0, "normal", 3);
world[10][11] = sim.createCell(sim.TERRAIN.EMPTY, null, 0, "normal", 3);
world[13][10] = sim.createCell(sim.TERRAIN.EMPTY, null, 0, "normal", 3);
let next = sim.applyPOIEffectsForTest(world, [{ type: "rot_source", x: 10, y: 10, radius: 4, strength: "strong", state: "active", createdAtTick: 0 }], { random: () => 0 });
assert.equal(next[10][10].terrain, sim.TERRAIN.MARK, "rot_source should keep center MARK");
assert.equal(next[10][11].terrain, sim.TERRAIN.MARK, "rot_source should spread MARK within radius 1 when probability succeeds");
assert.ok(next[13][10].fertility < world[13][10].fertility, "rot_source should lower fertility within radius 4");

world = makeBlankWorld(sim);
world[5][5] = sim.createCell(sim.TERRAIN.EMPTY, null, 0, "normal", 1);
next = sim.applyPOIEffectsForTest(world, [{ type: "spring", x: 5, y: 5, radius: 4, strength: "strong", state: "active", createdAtTick: 0 }], { random: () => 0 });
assert.equal(next[5][5].terrain, sim.TERRAIN.EMPTY, "spring should not directly change terrain");
assert.equal(next[5][5].fertility, 2, "spring should restore fertility within radius 4");

world = makeBlankWorld(sim);
world[6][6] = sim.createCell(sim.TERRAIN.FIELD, null, 0, "normal", 1);
world[6][7] = sim.createCell(sim.TERRAIN.EMPTY, null, 0, "normal", 1);
next = sim.applyPOIEffectsForTest(world, [{ type: "monument", x: 6, y: 6, radius: 4, strength: "strong", state: "active", createdAtTick: 0 }], { random: () => 0 });
assert.equal(next[6][6].terrain, sim.TERRAIN.FIELD, "monument should not directly create or remove FIELD");
assert.equal(next[6][6].fertility, 2, "monument should increase FIELD fertility up to cap 3");
assert.equal(next[6][7].fertility, 2, "monument should increase EMPTY fertility up to cap 3");

let renderedClasses = classNames(document);
assert.ok(renderedClasses.some((name) => name.includes("poi-center")), "Macro View should render POI center classes");
assert.ok(renderedClasses.some((name) => name.includes("poi-influence")), "Macro View should render POI influence classes");
assert.ok(renderedClasses.some((name) => name.includes("poi-monument")), "Macro View should render monument class");
assert.ok(renderedClasses.some((name) => name.includes("poi-rot-source")), "Macro View should render rot source class");
assert.ok(renderedClasses.some((name) => name.includes("poi-spring")), "Macro View should render spring class");
assert.ok(renderedClasses.some((name) => name.includes("poi-great-forest")), "Macro View should render great forest class");

loaded = loadSim({ viewMode: "substrateMacro" });
sim = loaded.sim;
document = loaded.document;
renderedClasses = classNames(document);
assert.ok(renderedClasses.some((name) => name.includes("poi-center")), "Substrate + Macro View should render POI center classes");
assert.ok(renderedClasses.some((name) => name.includes("poi-influence")), "Substrate + Macro View should render POI influence classes");

assert.ok(/Points of Interest/.test(indexHtml), "Legend should include Points of Interest");
assert.ok(/monument/.test(indexHtml), "Legend should name monument");
assert.ok(/rot source/.test(indexHtml), "Legend should name rot source");
assert.ok(/spring/.test(indexHtml), "Legend should name spring");
assert.ok(/great forest/.test(indexHtml), "Legend should name great forest");
assert.ok(/MARK\/scar texture|MARK scar texture/.test(indexHtml), "Legend should explain MARK/scar texture");

const routeBlock = ruleBlock(".grid.macro-view .macro-cell-route", styleCss);
assert.ok(!/radial-gradient/.test(routeBlock), "Macro route styling should no longer use dense dotted markers");
assert.ok(/border|box-shadow|linear-gradient/.test(routeBlock), "Macro route styling should remain a thin route aid");

const snapshot = sim.createSnapshotExport();
assert.ok(Array.isArray(snapshot.pointsOfInterest) && snapshot.pointsOfInterest.length === 4, "snapshot should export compact pointsOfInterest");
sim.clearRecording();
sim.startRecording();
sim.stepWorld();
sim.stopRecording();
const recording = sim.createRecordingExport();
assert.ok(Array.isArray(recording.pointsOfInterest) && recording.pointsOfInterest.length === 4, "recording should export compact pointsOfInterest");
sim.clearMacroTimeline();
sim.startMacroTimeline();
sim.stepWorld();
sim.stopMacroTimeline();
const timeline = sim.createMacroTimelineExport();
assert.ok(Array.isArray(timeline.pointsOfInterest) && timeline.pointsOfInterest.length === 4, "macro timeline should export compact pointsOfInterest");
assert.deepEqual(Object.keys(timeline.frames[0]).sort(), ["counts", "maskCounts", "maskRows", "macroSummary", "regionBiasCounts", "tick"].sort(), "macro timeline frame top-level keys should remain stable");
assert.deepEqual(timeline.frames[0].macroSummary.poiSummary, {
  total: 4,
  byType: { monument: 1, rot_source: 1, spring: 1, great_forest: 1 },
}, "macro summary should include compact POI summary");
assert.ok(!("influenceRows" in timeline.frames[0].macroSummary.poiSummary), "POI summary should stay compact");

console.log("v0.10.8 initial POI world anchors tests passed");
