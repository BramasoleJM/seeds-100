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
  click() {
    if (this.listeners.click) this.listeners.click({ preventDefault() {}, stopPropagation() {} });
  }
  dispatchKey(code) {
    if (this.listeners.keydown) this.listeners.keydown({ code, key: code, preventDefault() {}, stopPropagation() {} });
  }
  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }
  getAttribute(name) {
    return this.attributes[name];
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
  return { sim: context.window.__triSpeciesSim, elements, document };
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
  source.pointsOfInterest = [{ id: "poi_monument", type: "monument", x: 4, y: 4, radius: 3, state: "active", createdAtTick: 0 }];
  return source;
}

function updateAll(sim, source) {
  sim.refreshPopulationEvolutionFrameForTest(source, { force: true, mode: "macro" });
  sim.updateHumanLineageMemoryForTest(source, { force: true, mode: "macro" });
  sim.updateHumanPolityMemoryForTest(source, { force: true, mode: "macro" });
}

const { sim, elements, document } = loadSim();
const world = humanDomainWorld(sim, 12, 10);
sim.resetWorld(world);
for (let i = 0; i < 3; i += 1) updateAll(sim, world);
sim.renderMacroOverlayForTest();

const overlay = elements.get("macroOverlay");
const panel = elements.get("semanticTagInfoPanel");
assert.equal(panel.className.includes("visible"), false, "info panel should start hidden");

const villageEl = overlay.children.find((child) => child.textContent === "H village");
assert.ok(villageEl, "fixture should render H village tag");
assert.equal(villageEl.getAttribute("role"), "button", "semantic tags should be exposed as buttons");
assert.equal(villageEl.getAttribute("tabindex"), "0", "semantic tags should be keyboard focusable");

villageEl.click();
assert.ok(panel.className.includes("visible"), "clicking H village should open info panel");
assert.ok(panel.textContent.includes("H village"), "panel should show tag title");
assert.ok(panel.textContent.includes("Polity"), "panel should show polity row");
assert.ok(panel.textContent.includes("Lineage"), "panel should show lineage row");
assert.ok(panel.textContent.includes("Village state"), "panel should show village state");
assert.ok(panel.textContent.includes("Support"), "panel should show support");
assert.ok(panel.textContent.includes("Pressure"), "panel should show pressure");
assert.ok(panel.textContent.includes("local settlement"), "panel should include interpretation");
assert.ok(panel.className.includes(`polity-color-${villageEl.dataset.polityColor}`), "panel should use polity color accent");

const seatEl = overlay.children.find((child) => child.textContent === "H seat" || child.textContent === "H pressured seat");
assert.ok(seatEl, "fixture should render seat tag");
seatEl.dispatchKey("Enter");
assert.ok(panel.textContent.includes("Human polity center"), "keyboard Enter on seat should open seat panel");
assert.ok(panel.textContent.includes("Seat state"), "seat panel should show seat state");

const poiEl = overlay.children.find((child) => child.textContent === "Monument");
assert.ok(poiEl, "fixture should render a POI tag");
poiEl.click();
assert.ok(panel.textContent.includes("Point of Interest"), "POI panel should show POI subtitle");
assert.ok(panel.textContent.includes("Human / FIELD memory support"), "POI panel should explain monument role");

const closeButton = panel.children.find((child) => child.tagName === "BUTTON");
assert.ok(closeButton, "panel should include a close button");
closeButton.click();
assert.equal(panel.className.includes("visible"), false, "close button should hide panel");

villageEl.click();
document.body.dispatchKey("Escape");
assert.equal(panel.className.includes("visible"), false, "Escape should hide panel");

const frame = sim.createMacroDisplayFrameForTest(world, "macro");
const exportedVillage = frame.macroSummary.semanticTags.find((tag) => tag.label === "H village");
assert.ok(exportedVillage.polityId, "semantic tag exports should remain compact and include polity fields");
assert.equal("rows" in exportedVillage, false, "semantic tag export should not include rendered panel rows");

console.log("v0.11.8 clickable tag info panel tests passed");
