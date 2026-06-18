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

  click() {
    if (this.listeners.click) this.listeners.click({ preventDefault() {} });
    if (this.listeners.change) this.listeners.change({ preventDefault() {} });
  }

  set innerHTML(value) {
    this._innerHTML = value;
    if (value === "") this.children = [];
  }

  get innerHTML() {
    return this._innerHTML;
  }
}

function loadSim({ viewMode = "macro", showLineage = true } = {}) {
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
  document.getElementById("lineageToggle").checked = showLineage;

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

function humanClusterWorld(sim, cx, cy, radius = 1) {
  const world = blankWorld(sim, 2);
  for (let y = cy - radius; y <= cy + radius; y += 1) {
    for (let x = cx - radius; x <= cx + radius; x += 1) {
      world[y][x] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 0, "normal", 3);
    }
  }
  return world;
}

function updateLineage(sim, source) {
  sim.refreshPopulationEvolutionFrameForTest(source, { force: true, mode: "macro" });
  return sim.updateHumanLineageMemoryForTest(source, { force: true, mode: "macro" });
}

const html = fs.readFileSync("index.html", "utf8");
assert.ok(html.includes('id="lineageToggle"'), "Human Lineage toggle should exist");
assert.ok(
  html.indexOf('id="lineageToggle"') < html.indexOf("<summary>Advanced / Debug</summary>"),
  "Human Lineage control should be visible before Advanced / Debug"
);
assert.ok(html.includes('id="lineageStatus"'), "Human Lineage status readout should exist");

const { sim, document } = loadSim({ showLineage: true });
sim.resetWorld(blankWorld(sim));
const source = humanClusterWorld(sim, 10, 10);
sim.resetWorld(source);
updateLineage(sim, source);
sim.updateHumanLineageStatusForTest();

assert.equal(document.getElementById("lineageToggle").checked, true, "visible Human Lineage control can enable the overlay");
assert.match(document.getElementById("lineageTotal").textContent, /^[1-9]/, "status should render lineage count");
assert.match(document.getElementById("lineageActive").textContent, /^[1-9]/, "status should render active count");
assert.ok(document.getElementById("lineageDominant").textContent.includes("human_lineage_"), "status should render dominant lineage id");
assert.notEqual(document.getElementById("lineageRecentEvent").textContent, "-", "status should render recent lineage event");

const summary = sim.createHumanLineageSummaryForTest();
assert.equal(document.getElementById("lineageTotal").textContent, String(summary.lineages.length), "status should use compact lineage summary totals");
assert.equal(document.getElementById("lineageDescendants").textContent, String(summary.descendantLinks), "status should use compact lineage descendant count");

const masks = sim.buildMacroDisplayMasks(source, "macro", []);
const classes = masks.cellClasses.flat().join(" ");
for (const className of ["lineage-human-origin", "lineage-human-current", "lineage-human-path"]) {
  assert.ok(classes.includes(className), `enabled overlay should emit ${className}`);
}
const emittedLineageClasses = classes.split(/\s+/).filter((className) => className.startsWith("lineage-human-"));
assert.ok(new Set(emittedLineageClasses).size >= 3, "normal fixture should show multiple lineage visual classes");

const poiWorld = humanClusterWorld(sim, 10, 10);
poiWorld.pointsOfInterest = [{ id: "test_spring", type: "spring", x: 10, y: 10, radius: 4, strength: "strong", state: "active", createdAtTick: 0, blocksMovement: true }];
sim.resetWorld(poiWorld);
updateLineage(sim, poiWorld);
const poiMasks = sim.buildMacroDisplayMasks(poiWorld, "macro");
assert.ok(poiMasks.cellClasses[10][10].includes("poi-center"), "POI center class should remain present with lineage overlay");

const css = fs.readFileSync("style.css", "utf8");
assert.ok(css.indexOf(".grid.macro-view .lineage-human-current") < css.indexOf(".grid.macro-view .terrain-block"), "terrain-block CSS priority should remain after lineage CSS");
assert.ok(css.includes("lineage-status"), "lineage status should have compact styling");

console.log("v0.11.1 human lineage visibility tests passed");
