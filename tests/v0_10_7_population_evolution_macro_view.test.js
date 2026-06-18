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
    humanCount: "0",
    beastCount: "0",
    spiritCount: "0",
    fieldPatchCount: "0",
    wildPatchCount: "0",
    markPatchCount: "0",
    blockCount: "0",
    randomSeed: "1037746564",
    presetSelect: "custom",
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

function paintRect(world, sim, { x0, y0, w, h, terrain, unitEvery = null, fertility = 3 }) {
  for (let y = y0; y < y0 + h; y += 1) {
    for (let x = x0; x < x0 + w; x += 1) {
      const placeUnit = unitEvery && ((x - x0) + (y - y0)) % unitEvery === 0;
      world[y][x] = sim.createCell(terrain, placeUnit ? unitForTerrain(sim, terrain) : null, 8, "normal", fertility, 4, null, sim.REGION_BIAS.NONE);
    }
  }
}

function unitForTerrain(sim, terrain) {
  if (terrain === sim.TERRAIN.FIELD) return sim.UNIT.HUMAN;
  if (terrain === sim.TERRAIN.WILD) return sim.UNIT.BEAST;
  if (terrain === sim.TERRAIN.MARK) return sim.UNIT.SPIRIT;
  return null;
}

function shapeByType(frame, type) {
  return frame.shapes.find((shape) => shape.type === type && shape.state !== "fading");
}

function classNames(document) {
  return document.getElementById("grid").children.map((cell) => cell.className);
}

let loaded = loadSim({ viewMode: "macro" });
let { sim, document } = loaded;
let world = makeBlankWorld(sim);
paintRect(world, sim, { x0: 3, y0: 3, w: 5, h: 4, terrain: sim.TERRAIN.FIELD, unitEvery: 3, fertility: 3 });
paintRect(world, sim, { x0: 18, y0: 4, w: 5, h: 5, terrain: sim.TERRAIN.WILD, unitEvery: 4, fertility: 4 });
paintRect(world, sim, { x0: 30, y0: 14, w: 3, h: 3, terrain: sim.TERRAIN.MARK, unitEvery: 4, fertility: 1 });
world[23][1] = sim.createCell(sim.TERRAIN.MARK, null, 0, "normal", 1, 0, null, sim.REGION_BIAS.NONE);

sim.resetWorld(world);
let frame = sim.getPopulationEvolutionFrameForTest();
assert.ok(frame && Array.isArray(frame.shapes), "population evolution frame should exist");
assert.equal(frame.tick, 0, "frame should be tied to the current tick");

const humanShape = shapeByType(frame, "human");
const beastShape = shapeByType(frame, "beast");
const spiritShape = shapeByType(frame, "spirit");
assert.ok(humanShape, "FIELD/H cluster should create a human population shape");
assert.ok(beastShape, "WILD/B cluster should create a beast population shape");
assert.ok(spiritShape, "MARK/S cluster should create a spirit corrosion shape");
for (const shape of [humanShape, beastShape, spiritShape]) {
  assert.ok(shape.id && shape.id.includes(shape.type), `${shape.type} shape should have a stable typed id`);
  assert.ok(shape.area >= 6, `${shape.type} shape should merge cells into a readable area`);
  assert.ok(shape.confidence > 0.35, `${shape.type} shape should expose confidence`);
  assert.ok(Array.isArray(shape.coreCells), `${shape.type} shape should expose coreCells`);
  assert.ok(Array.isArray(shape.bodyCells), `${shape.type} shape should expose bodyCells`);
  assert.ok(Array.isArray(shape.edgeCells), `${shape.type} shape should expose edgeCells`);
  assert.ok(shape.center && shape.bounds, `${shape.type} shape should expose center and bounds`);
}
assert.ok(!frame.shapes.some((shape) => shape.type === "spirit" && shape.area <= 2), "isolated MARK noise should not become a population shape");

let renderedClasses = classNames(document);
assert.ok(renderedClasses.some((name) => name.includes("population-human-")), "Macro View should render human population classes");
assert.ok(renderedClasses.some((name) => name.includes("population-beast-")), "Macro View should render beast population classes");
assert.ok(renderedClasses.some((name) => name.includes("population-spirit-")), "Macro View should render spirit population classes");
assert.ok(!renderedClasses.some((name) => /region-(basin|refuge|hollow|none)/.test(name)), "Macro View should not require regional substrate classes for population readability");

const initialIds = Object.fromEntries(frame.shapes.map((shape) => [shape.type, shape.id]));
world[3][8] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 8, "normal", 3, 3, null, sim.REGION_BIAS.NONE);
world[8][23] = sim.createCell(sim.TERRAIN.WILD, sim.UNIT.BEAST, 8, "normal", 4, 3, null, sim.REGION_BIAS.NONE);
world[17][32] = sim.createCell(sim.TERRAIN.MARK, null, 0, "normal", 1, 3, null, sim.REGION_BIAS.NONE);
frame = sim.refreshPopulationEvolutionFrameForTest(world, { mode: "macro" });
assert.equal(shapeByType(frame, "human").id, initialIds.human, "human shape id should persist across slight growth");
assert.equal(shapeByType(frame, "beast").id, initialIds.beast, "beast shape id should persist across slight growth");
assert.equal(shapeByType(frame, "spirit").id, initialIds.spirit, "spirit shape id should persist across slight growth");
assert.ok(["expanding", "stable"].includes(shapeByType(frame, "human").trend), "human trend should summarize area continuity");

const emptyWorld = makeBlankWorld(sim);
frame = sim.refreshPopulationEvolutionFrameForTest(emptyWorld, { mode: "macro" });
const fadingHuman = frame.shapes.find((shape) => shape.type === "human" && shape.state === "fading");
assert.ok(fadingHuman, "population memory should keep a fading human shape after raw signal disappears");
assert.equal(fadingHuman.id, initialIds.human, "fading memory should preserve the previous shape id");
assert.ok(fadingHuman.memoryCells.length > 0, "fading memory should expose memoryCells");
assert.ok(fadingHuman.confidence < humanShape.confidence, "fading memory should reduce confidence");

loaded = loadSim({ viewMode: "substrateMacro" });
sim = loaded.sim;
document = loaded.document;
world = makeBlankWorld(sim);
paintRect(world, sim, { x0: 4, y0: 4, w: 5, h: 4, terrain: sim.TERRAIN.FIELD, unitEvery: 3, fertility: 3 });
world[4][4].regionBias = sim.REGION_BIAS.BASIN;
sim.resetWorld(world);
renderedClasses = classNames(document);
assert.ok(renderedClasses.some((name) => name.includes("region-basin")), "Substrate + Macro View should keep regional substrate classes");
assert.ok(renderedClasses.some((name) => name.includes("population-human-")), "Substrate + Macro View should softly keep population shape classes");

sim.clearMacroTimeline();
sim.startMacroTimeline();
for (let i = 0; i < 10; i += 1) sim.stepWorld();
sim.stopMacroTimeline();
const timeline = sim.createMacroTimelineExport();
assert.deepEqual(Object.keys(timeline.frames[0]).sort(), ["counts", "maskCounts", "maskRows", "macroSummary", "regionBiasCounts", "tick"].sort(), "macro timeline frame shape should remain compatible");

sim.clearRecording();
sim.startRecording();
for (let i = 0; i < 2; i += 1) sim.stepWorld();
sim.stopRecording();
const recording = sim.createRecordingExport();
assert.ok(recording.frames.every((recordedFrame) => !("populationEvolution" in recordedFrame)), "recording frame shape should remain compatible");

console.log("v0.10.7 population evolution macro view tests passed");
