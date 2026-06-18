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
  return { sim: context.window.__triSpeciesSim, elements };
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

function updateAll(sim, source) {
  sim.refreshPopulationEvolutionFrameForTest(source, { force: true, mode: "macro" });
  sim.updateHumanLineageMemoryForTest(source, { force: true, mode: "macro" });
  sim.updateHumanPolityMemoryForTest(source, { force: true, mode: "macro" });
}

const { sim, elements } = loadSim();
const world = humanDomainWorld(sim, 12, 10);
sim.resetWorld(world);
for (let i = 0; i < 3; i += 1) updateAll(sim, world);

const tags = sim.getSemanticTagsForTest(world, { mode: "macro" });
const humanTags = tags.filter((tag) => tag.label.startsWith("H "));
assert.ok(humanTags.some((tag) => tag.label === "H village"), "fixture should produce H village tags");

for (const tag of humanTags.filter((tag) => tag.source === "polity" || tag.label === "H seat")) {
  assert.ok(tag.polityId, `${tag.label} should include polityId`);
  assert.ok("polityState" in tag, `${tag.label} should include polityState`);
  assert.ok(Number.isInteger(tag.polityColorIndex), `${tag.label} should include stable color index`);
  assert.ok(tag.lineageId, `${tag.label} should include lineageId`);
  assert.ok(tag.state, `${tag.label} should include state`);
  assert.ok("title" in tag && tag.title.includes("Polity:"), `${tag.label} should include detailed title`);
}

const village = tags.find((tag) => tag.label === "H village");
assert.ok("support" in village && "pressure" in village, "H village tag should export support and pressure");

const seat = tags.find((tag) => tag.label === "H seat" || tag.label === "H pressured seat");
assert.ok(seat, "fixture should produce a seat tag");
assert.ok("support" in seat && "pressure" in seat, "H seat tag should export support and pressure");

const frame = sim.createMacroDisplayFrameForTest(world, "macro");
const exportedVillage = frame.macroSummary.semanticTags.find((tag) => tag.label === "H village");
assert.equal(exportedVillage.polityId, village.polityId, "macroSummary semanticTags should preserve polity fields");

sim.renderMacroOverlayForTest();
const overlay = elements.get("macroOverlay");
const renderedVillage = overlay.children.find((child) => child.textContent === "H village");
assert.ok(renderedVillage, "rendered overlay should contain H village");
assert.equal(renderedVillage.dataset.polityId, village.polityId, "DOM tag should expose polity id");
assert.equal(renderedVillage.dataset.lineageId, village.lineageId, "DOM tag should expose lineage id");
assert.equal(renderedVillage.dataset.tagState, village.state, "DOM tag should expose tag state");
assert.equal(renderedVillage.dataset.polityColor, String(village.polityColorIndex), "DOM tag should expose polity color index");
assert.ok(renderedVillage.className.includes(`polity-color-${village.polityColorIndex}`), "DOM tag should include polity color class");
assert.ok(renderedVillage.title.includes("Polity:"), "DOM title should include polity detail");
assert.ok(renderedVillage.title.includes("Support:"), "DOM title should include support detail");

const poiTag = tags.find((tag) => tag.source === "poi");
if (poiTag) assert.equal("polityId" in poiTag, false, "POI tags do not need polity fields");

console.log("v0.11.7 polity visual identity tests passed");
