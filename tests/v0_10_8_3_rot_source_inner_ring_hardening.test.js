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

function loadSim({ viewMode = "macro", random = Math.random } = {}) {
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
    Math: Object.create(Math),
    Date,
    performance,
  };
  context.Math.random = random;
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

function ruleBlock(styleCss, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = styleCss.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, "s"));
  assert.ok(match, `${selector} should exist`);
  return match[1];
}

let { sim } = loadSim({ random: () => 0.99 });
let world = blankWorld(sim, 2);
const rotSource = { type: "rot_source", x: 10, y: 10, radius: 4, innerRadius: 1, strength: "strong", state: "active", createdAtTick: 0 };
world[10][10] = sim.createCell(sim.TERRAIN.WILD, null, 3, "normal", 2);
world[10][11] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 4, "normal", 2);
world[10][9] = sim.createCell(sim.TERRAIN.WILD, sim.UNIT.BEAST, 5, "pack", 2);
world[9][10] = sim.createCell(sim.TERRAIN.BLOCK, null, 0, "normal", 0);
world[11][10] = sim.createCell(sim.TERRAIN.BORDER, null, 0, "normal", 2);
world[10][12] = sim.createCell(sim.TERRAIN.EMPTY, null, 0, "normal", 2);
world[10][13] = sim.createCell(sim.TERRAIN.FIELD, null, 0, "normal", 2);
world[10][14] = sim.createCell(sim.TERRAIN.EMPTY, null, 0, "normal", 2);

let next = sim.applyPOIEffectsForTest(world, [rotSource], { random: () => 0.99 });
assert.equal(next[10][10].terrain, sim.TERRAIN.MARK, "rot source center should deterministically become MARK");
assert.equal(next[10][11].terrain, sim.TERRAIN.MARK, "rot source radius 1 FIELD/Human cell should deterministically become MARK");
assert.equal(next[10][11].unit, sim.UNIT.HUMAN, "rot source radius 1 should keep Human unit intact");
assert.equal(next[10][9].terrain, sim.TERRAIN.MARK, "rot source radius 1 WILD/Beast cell should deterministically become MARK");
assert.equal(next[10][9].unit, sim.UNIT.BEAST, "rot source radius 1 should keep Beast unit intact");
assert.equal(next[9][10].terrain, sim.TERRAIN.BLOCK, "rot source radius 1 should not convert BLOCK");
assert.equal(next[11][10].terrain, sim.TERRAIN.BORDER, "rot source radius 1 should not convert BORDER");
assert.notEqual(next[10][12].terrain, sim.TERRAIN.MARK, "rot source radius 2 should not be forced entirely to MARK");
assert.equal(next[10][13].terrain, sim.TERRAIN.FIELD, "rot source radius 3 FIELD pressure should stay probabilistic");
assert.notEqual(next[10][14].terrain, sim.TERRAIN.MARK, "rot source radius 4 should not be forced entirely to MARK");

world.pointsOfInterest = [rotSource];
sim.resetWorld(world);
const mask = sim.buildMacroDisplayMasks(world, "macro", [rotSource]);
assert.ok(mask.cellClasses[10][10].includes("poi-rot-core"), "Macro View center should have poi-rot-core");
assert.ok(mask.cellClasses[10][10].includes("poi-rot-hardened"), "Macro View center should have hardened rot identity");
assert.ok(mask.cellClasses[10][11].includes("poi-rot-inner"), "Macro View radius 1 should have poi-rot-inner");
assert.ok(mask.cellClasses[10][11].includes("poi-rot-hardened"), "Macro View radius 1 should have hardened rot identity");
assert.ok(mask.cellClasses[10][12].includes("poi-rot-outer"), "Macro View outer ring should still be present");
assert.equal(mask.cellClasses[10][12].includes("poi-rot-hardened"), false, "Macro View outer ring should remain distinct from hardened inner ring");

const styleCss = fs.readFileSync("style.css", "utf8");
const hardenedRule = ruleBlock(styleCss, ".grid.macro-view .poi-rot-hardened");
assert.ok(/background-image|box-shadow|outline/.test(hardenedRule), "hardened rot ring should have dedicated visual styling");
assert.ok(
  styleCss.indexOf(".grid.macro-view .poi-rot-hardened") > styleCss.indexOf(".grid.macro-view .poi-contested-beast"),
  "hardened rot styling should come after ordinary contested classes"
);
assert.notEqual(
  ruleBlock(styleCss, ".grid.macro-view .poi-rot-outer"),
  ruleBlock(styleCss, ".grid.macro-view .poi-rot-inner"),
  "rot outer ring should remain visually distinct from inner ring"
);

({ sim } = loadSim({ random: () => 0 }));
const snapshot = sim.createSnapshotExport();
const exportedRotSource = snapshot.pointsOfInterest.find((poi) => poi.type === "rot_source");
assert.equal(snapshot.pointsOfInterest.length, 4, "snapshot should still export four compact POIs");
assert.equal(exportedRotSource.innerRadius, 1, "rot source export may include compact innerRadius metadata");
sim.clearMacroTimeline();
sim.startMacroTimeline();
sim.stepWorld();
sim.stopMacroTimeline();
const timeline = sim.createMacroTimelineExport();
assert.equal(timeline.pointsOfInterest.length, 4, "macro timeline should still export four compact POIs");
assert.deepEqual(Object.keys(timeline.frames[0]).sort(), ["counts", "maskCounts", "maskRows", "macroSummary", "regionBiasCounts", "tick"].sort(), "macro timeline frame top-level keys should remain stable");

console.log("v0.10.8.3 rot source inner ring hardening tests passed");
