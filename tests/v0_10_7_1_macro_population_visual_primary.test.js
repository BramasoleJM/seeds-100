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

function runTicks(sim, ticks) {
  for (let i = 0; i < ticks; i += 1) sim.stepWorld();
}

function classNames(document) {
  return document.getElementById("grid").children.map((cell) => cell.className);
}

function ruleBlock(selector, css) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, "s"));
  assert.ok(match, `${selector} should exist`);
  return match[1];
}

function ruleBlockContaining(selector, css) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`[^{}]*${escaped}[^{}]*\\{([^}]*)\\}`, "s"));
  assert.ok(match, `${selector} should exist in a CSS rule`);
  return match[1];
}

function alphaFor(block, variableName) {
  const escaped = variableName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = block.match(new RegExp(`${escaped}:\\s*rgba\\([^,]+,\\s*[^,]+,\\s*[^,]+,\\s*([0-9.]+)\\)`));
  assert.ok(match, `${variableName} should use rgba`);
  return Number(match[1]);
}

const styleCss = fs.readFileSync("style.css", "utf8");
const indexHtml = fs.readFileSync("index.html", "utf8");
const simJs = fs.readFileSync("sim.js", "utf8");

const macroCellBlock = ruleBlockContaining(".grid.macro-view .cell", styleCss);
assert.ok(
  macroCellBlock.indexOf("linear-gradient(var(--population-overlay)") <
    macroCellBlock.indexOf("linear-gradient(var(--eco-overlay)"),
  "Macro View population layer should render above old eco overlay"
);

const macroHideBlock = ruleBlockContaining(".grid.macro-view .cell[data-unit]", styleCss);
assert.ok(/color:\s*transparent/.test(macroHideBlock), "Macro View and Substrate + Macro View should hide unit text visually");
assert.ok(/text-shadow:\s*none/.test(macroHideBlock), "Macro View and Substrate + Macro View should hide unit shadows visually");
assert.ok(/\.cell\[data-unit="H"\]\s*\{[^}]*color:\s*var\(--human\)/s.test(styleCss), "Cell View should still define visible Human unit letters");

const humanCoreAlpha = alphaFor(ruleBlock(".grid.macro-view .population-human-core", styleCss), "--population-overlay");
const beastCoreAlpha = alphaFor(ruleBlock(".grid.macro-view .population-beast-core", styleCss), "--population-overlay");
const spiritCoreAlpha = alphaFor(ruleBlock(".grid.macro-view .population-spirit-core", styleCss), "--population-overlay");
const humanBodyAlpha = alphaFor(ruleBlock(".grid.macro-view .population-human-body", styleCss), "--population-overlay");
const fieldAlpha = alphaFor(ruleBlock(".grid.macro-view .terrain-field", styleCss), "--terrain-material");
const wildAlpha = alphaFor(ruleBlock(".grid.macro-view .terrain-wild", styleCss), "--terrain-material");
const markAlpha = alphaFor(ruleBlock(".grid.macro-view .terrain-mark", styleCss), "--terrain-material");
assert.ok(humanCoreAlpha >= 0.7 && beastCoreAlpha >= 0.7 && spiritCoreAlpha >= 0.7, "Macro population cores should be visually dominant");
assert.ok(humanBodyAlpha > fieldAlpha, "Human population body should be stronger than raw FIELD material");
assert.ok(fieldAlpha <= 0.28 && wildAlpha <= 0.28 && markAlpha <= 0.4, "Macro terrain material should be muted under population shapes");

for (const selector of [".grid.macro-view .macro-cell-settlement", ".grid.macro-view .macro-cell-wild", ".grid.macro-view .macro-cell-scar"]) {
  const alpha = alphaFor(ruleBlock(selector, styleCss), "--eco-overlay");
  assert.ok(alpha <= 0.04, `${selector} broad fill should be demoted in Macro View`);
}

let loaded = loadSim({ viewMode: "macro" });
let { sim, document } = loaded;
let renderedClasses = classNames(document);
assert.ok(renderedClasses.some((name) => name.includes("population-human-")), "Macro View should render population human classes");
assert.ok(renderedClasses.some((name) => name.includes("population-beast-")), "Macro View should render population beast classes");
assert.ok(renderedClasses.some((name) => name.includes("population-spirit-")), "Macro View should render population spirit classes");
assert.ok(!renderedClasses.some((name) => /region-(basin|refuge|hollow|none)/.test(name)), "Macro View should not attach regional substrate classes");
const macroUnitCell = document.getElementById("grid").children.find((cell) => cell.dataset.unit);
assert.ok(macroUnitCell?.dataset.unit, "Macro View should preserve dataset.unit");
assert.ok(macroUnitCell?.textContent, "Macro View should preserve unit textContent for data neutrality");

loaded = loadSim({ viewMode: "cell" });
const cellViewUnit = loaded.document.getElementById("grid").children.find((cell) => cell.dataset.unit);
assert.ok(cellViewUnit?.textContent, "Cell View should still keep unit letters");
assert.ok(!loaded.document.getElementById("grid").className.includes("macro-view"), "Cell View should not use macro-view unit hiding");

loaded = loadSim({ viewMode: "substrateMacro" });
sim = loaded.sim;
document = loaded.document;
renderedClasses = classNames(document);
assert.ok(renderedClasses.some((name) => name.includes("region-basin")), "Substrate + Macro View should keep basin classes");
assert.ok(renderedClasses.some((name) => name.includes("region-refuge")), "Substrate + Macro View should keep refuge classes");
assert.ok(renderedClasses.some((name) => name.includes("region-hollow")), "Substrate + Macro View should keep hollow classes");
assert.ok(renderedClasses.some((name) => name.includes("population-human-")), "Substrate + Macro View should keep soft population shape classes");

sim.clearMacroTimeline();
sim.startMacroTimeline();
runTicks(sim, 10);
sim.stopMacroTimeline();
const timeline = sim.createMacroTimelineExport();
assert.deepEqual(Object.keys(timeline.frames[0]).sort(), ["counts", "maskCounts", "maskRows", "macroSummary", "regionBiasCounts", "tick"].sort(), "macro timeline frame top-level keys should stay stable");
const populationEvolution = timeline.frames[0].macroSummary.populationEvolution;
assert.ok(populationEvolution, "macroSummary should include compact populationEvolution summary");
for (const type of ["human", "beast", "spirit"]) {
  assert.ok(Number.isInteger(populationEvolution[type].shapes), `${type} summary should include shape count`);
  assert.ok(Number.isInteger(populationEvolution[type].activeArea), `${type} summary should include active area`);
  assert.ok(Number.isInteger(populationEvolution[type].memoryArea), `${type} summary should include memory area`);
  assert.ok("dominantId" in populationEvolution[type], `${type} summary should include dominant id`);
  assert.ok("trend" in populationEvolution[type], `${type} summary should include trend`);
  assert.ok(!("coreCells" in populationEvolution[type]), `${type} summary should stay compact`);
}

assert.ok(/Population evolution/.test(indexHtml), "Legend should explain population evolution");
assert.ok(/Human settlement shape/.test(indexHtml), "Legend should describe Human population shapes");
assert.ok(/Beast wild range/.test(indexHtml), "Legend should describe Beast population shapes");
assert.ok(/Spirit corrosion/.test(indexHtml), "Legend should describe Spirit population shapes");
assert.ok(/Terrain material/.test(indexHtml), "Legend should separate low-level terrain material");
assert.ok(/Debug icons/.test(indexHtml), "Legend should explain debug icons");

for (const terse of ['"S+"', '"R"', '"*"', '"->"', '"F"']) {
  assert.ok(!simJs.includes(`return ${terse}`), `macro debug icons should avoid terse legacy label ${terse}`);
}

console.log("v0.10.7.1 macro population visual primary tests passed");
