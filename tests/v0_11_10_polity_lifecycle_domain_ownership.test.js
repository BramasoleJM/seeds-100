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
  appendChild(child) {
    this.children.push(child);
    return child;
  }
  addEventListener(name, fn) {
    this.listeners[name] = fn;
  }
  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }
  set innerHTML(value) {
    this._innerHTML = value;
    if (value === "") this.children = [];
  }
  get innerHTML() {
    return this._innerHTML;
  }
}

function loadSim() {
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
    addEventListener(name, fn) {
      this.body.addEventListener(name, fn);
    },
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

const { sim } = loadSim();

const home = humanDomainWorld(sim, 10, 10, 3);
sim.resetWorld(home);
for (let i = 0; i < 4; i += 1) updateAll(sim, home);
let summary = sim.createHumanPolitySummaryForTest();
const homePolity = summary.polities.find((polity) => polity.currentSeat);
assert.ok(homePolity, "setup should create a seated polity");

let tags = sim.getSemanticTagsForTest(home, { mode: "macro" });
let ownedDomain = tags.find((tag) => tag.label === "H domain" && tag.polityId === homePolity.id);
assert.ok(ownedDomain, "clear H domain near an active seat should carry polityId");
assert.ok(ownedDomain.rootPolityId, "owned H domain should carry rootPolityId");
assert.ok(Array.isArray(ownedDomain.polityAncestryIds), "owned H domain should carry polity ancestry");

const unclear = humanDomainWorld(sim, 32, 20, 2);
tags = sim.getSemanticTagsForTest(unclear, { mode: "macro" });
const unclearDomain = tags.find((tag) => tag.label === "H domain");
assert.ok(unclearDomain, "unclear world should still expose H domain tag");
assert.ok(!unclearDomain.polityId, "H domain should remain unassigned when no polity clearly owns it");

const lifecycleWorld = humanDomainWorld(sim, 12, 10, 3);
sim.resetWorld(lifecycleWorld);
for (let i = 0; i < 4; i += 1) updateAll(sim, lifecycleWorld);
summary = sim.createHumanPolitySummaryForTest();
const lifecyclePolityId = summary.polities.find((polity) => polity.currentSeat).id;

const blank = blankWorld(sim);
for (let i = 0; i < 2; i += 1) updateAll(sim, blank);
summary = sim.createHumanPolitySummaryForTest();
let stale = summary.polities.find((polity) => polity.id === lifecyclePolityId);
assert.ok(stale, "stale polity should remain compactly exported");
assert.equal(stale.currentSeat, null, "polity currentSeat should clear when lineage seat is gone");
assert.ok(summary.recentEvents.filter((event) => event.type === "polity_seat_lost" && event.polityId === lifecyclePolityId).length <= 1, "stale seat should record seat loss once");

for (let i = 0; i < 4; i += 1) updateAll(sim, blank);
summary = sim.createHumanPolitySummaryForTest();
stale = summary.polities.find((polity) => polity.id === lifecyclePolityId);
assert.ok(stale.state === "declining" || stale.state === "collapsed", "seatless polity should become declining after grace window");

for (let i = 0; i < 8; i += 1) updateAll(sim, blank);
summary = sim.createHumanPolitySummaryForTest();
stale = summary.polities.find((polity) => polity.id === lifecyclePolityId);
assert.equal(stale.state, "collapsed", "declining polity with no active support should collapse");
assert.ok(summary.collapsedPolities >= 1, "summary should count collapsed polities");

tags = sim.getSemanticTagsForTest(blank, { mode: "macro" });
assert.ok(!tags.some((tag) => tag.polityId === lifecyclePolityId && ["H seat", "H pressured seat", "H village", "H outpost", "H domain"].includes(tag.label)), "collapsed polity should not emit current visible tags");

for (let n = 0; n < 10; n += 1) {
  const world = humanDomainWorld(sim, 5 + (n % 5) * 7, 5 + Math.floor(n / 5) * 10, 2);
  sim.resetWorld(world);
  for (let i = 0; i < 4; i += 1) updateAll(sim, world);
  for (let i = 0; i < 14; i += 1) updateAll(sim, blankWorld(sim));
}
summary = sim.createHumanPolitySummaryForTest();
assert.ok(summary.polities.filter((polity) => polity.state === "collapsed").length <= 6, "collapsed polity retention should be capped");

console.log("v0.11.10 polity lifecycle / domain ownership tests passed");
