const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

class FakeElement {
  constructor() {
    this.children = [];
    this.style = {};
    this.dataset = {};
    this.textContent = "";
    this.title = "";
    this.value = "";
    this.checked = true;
    this.listeners = {};
    this._innerHTML = "";
    this.className = "";
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
  const intervalCalls = [];
  const clearCalls = [];
  let nextIntervalId = 1;

  function el(id) {
    if (!elements.has(id)) elements.set(id, new FakeElement());
    return elements.get(id);
  }

  const context = {
    console,
    document: {
      body: new FakeElement(),
      getElementById: el,
      createElement: () => new FakeElement(),
      addEventListener(name, fn) {
        this.body.addEventListener(name, fn);
      },
    },
    window: {},
    Blob: class Blob {
      constructor(parts, options) {
        this.parts = parts;
        this.options = options;
      }
    },
    URL: {
      createObjectURL() {
        return "blob:test";
      },
      revokeObjectURL() {},
    },
    setInterval(fn, ms) {
      const id = nextIntervalId++;
      intervalCalls.push({ id, fn, ms });
      return id;
    },
    clearInterval(id) {
      clearCalls.push(id);
    },
    Math,
    Date,
    performance,
  };

  context.window = context;
  el("speed").value = "40";
  el("movementToggle").checked = true;
  el("humanCount").value = "32";
  el("beastCount").value = "32";
  el("spiritCount").value = "24";
  el("overcrowding").value = "6";
  el("keyframeEvery").value = "1";

  vm.createContext(context);
  vm.runInContext(fs.readFileSync("sim.js", "utf8"), context, { filename: "sim.js" });

  return {
    sim: context.window.__triSpeciesSim,
    elements,
    intervalCalls,
    clearCalls,
  };
}

const loaded = loadSim();
const sim = loaded.sim;
const grid = loaded.elements.get("grid");

assert.equal(grid.children.length, 40 * 25, "default grid should be capped to 40 x 25");
assert.equal(loaded.elements.get("playPause").textContent, "Play", "page should open paused");
assert.equal(loaded.intervalCalls.length, 0, "page load should not start an interval");

loaded.elements.get("playPause").click();
assert.equal(loaded.intervalCalls.length, 1, "first Play should create one interval");
assert.equal(loaded.intervalCalls[0].ms, 100, "tick speed should clamp to 100ms minimum");
loaded.elements.get("playPause").click();
assert.equal(loaded.clearCalls.length, 1, "second click should pause the interval");

sim.resetWorld(sim.createDefaultWorld());
const startedAt = performance.now();
for (let i = 0; i < 300; i += 1) sim.stepWorld();
const elapsed = performance.now() - startedAt;
assert.equal(sim.calculateStats().tick, 300);
assert.ok(elapsed < 5000, `300 ticks should finish quickly enough in tests, got ${elapsed}ms`);

sim.clearRecording();
sim.startRecording();
for (let i = 0; i < 2100; i += 1) sim.recordFrame();
const recording = sim.createRecordingExport();
assert.equal(recording.frames.length, 2000, "recording should cap frames at 2000");
assert.equal(recording.keyframes.length <= 2000, true);

console.log("safety tests passed");
