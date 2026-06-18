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
const parentWorld = humanDomainWorld(sim, 10, 10, 3);
sim.resetWorld(parentWorld);
for (let i = 0; i < 4; i += 1) updateAll(sim, parentWorld);

const splitWorld = mergeWorlds(sim, parentWorld, humanDomainWorld(sim, 31, 15, 3));
for (let i = 0; i < 14; i += 1) updateAll(sim, splitWorld);

const lineageSummary = sim.createHumanLineageSummaryForTest();
const politySummary = sim.createHumanPolitySummaryForTest();

assert.ok(lineageSummary.lineages.length >= 1, "lineage summary should include lineages");
for (const lineage of lineageSummary.lineages) {
  assert.ok(Array.isArray(lineage.lineageAncestryIds), "lineage should export lineageAncestryIds");
  assert.equal(lineage.lineageAncestryIds[0], lineage.id, "lineage ancestry should start with self");
  assert.ok(lineage.lineageAncestryIds.length <= 8, "lineage ancestry should be capped");
  assert.ok(lineage.rootAncestorId, "lineage should export rootAncestorId");
  assert.equal(typeof lineage.ancestorDepth, "number", "lineage should export ancestorDepth");
  assert.ok(!lineage.lineageAncestryIds.some((ancestor) => typeof ancestor === "object"), "lineage ancestry should stay compact");
}

assert.ok(politySummary.polities.length >= 2, "far mature outpost should still create one split polity");
for (const polity of politySummary.polities) {
  assert.ok(Array.isArray(polity.polityAncestryIds), "polity should export polityAncestryIds");
  assert.equal(polity.polityAncestryIds[0], polity.id, "polity ancestry should start with self");
  assert.ok(polity.polityAncestryIds.length <= 8, "polity ancestry should be capped");
  assert.ok(polity.rootPolityId, "polity should export rootPolityId");
  assert.equal(typeof polity.splitDepth, "number", "polity should export splitDepth");
  assert.ok(!("domainCells" in polity), "polity export should stay compact");
}

const splitPolities = politySummary.polities.filter((polity) => polity.splitFromPolityId);
assert.ok(splitPolities.length >= 1, "split polity should be present");
const splitKeys = splitPolities.map((polity) => polity.splitKey).filter(Boolean);
assert.equal(new Set(splitKeys).size, splitKeys.length, "split keys should be unique among split polities");
for (const key of splitKeys) {
  assert.equal(splitPolities.filter((polity) => polity.splitKey === key).length, 1, "same splitKey should not create duplicate polities");
}
const splitEvents = politySummary.recentEvents.filter((event) => event.type === "polity_split");
const splitEventKeys = splitEvents.map((event) => event.splitKey).filter(Boolean);
assert.equal(new Set(splitEventKeys).size, splitEventKeys.length, "polity_split events should be deduped by splitKey");

assert.ok(politySummary.villages.length >= 1, "village summary should include villages");
const village = politySummary.villages.find((item) => item.polityId && item.lineageId);
assert.ok(village, "at least one village should have polity and lineage ownership");
assert.ok(Array.isArray(village.lineageAncestryIds), "village should snapshot lineage ancestry");
assert.ok(Array.isArray(village.polityAncestryIds), "village should snapshot polity ancestry");
assert.ok(village.rootLineageId, "village should snapshot root lineage");
assert.ok(village.rootPolityId, "village should snapshot root polity");
assert.equal(village.memorySeed, `${village.id}|${village.polityId}|${village.lineageId}|${village.firstSeenTick}`, "village memorySeed should be stable and deterministic");

const tags = sim.getSemanticTagsForTest(splitWorld, { mode: "macro" });
const humanTag = tags.find((tag) => tag.polityId && tag.lineageId);
assert.ok(humanTag, "human semantic tag should include ownership");
assert.ok(Array.isArray(humanTag.lineageAncestryIds), "human semantic tag should include lineage ancestry");
assert.ok(Array.isArray(humanTag.polityAncestryIds), "human semantic tag should include polity ancestry");
assert.ok(humanTag.rootLineageId, "human semantic tag should include rootLineageId");
assert.ok(humanTag.rootPolityId, "human semantic tag should include rootPolityId");
assert.ok(!("ancestorLineages" in humanTag), "semantic tag should not export full ancestor objects");

const recording = sim.createRecordingExport();
assert.ok(recording.humanLineageMemorySummary.lineages[0].lineageAncestryIds, "recording should include lineage ancestry");
assert.ok(recording.humanPolitySummary.polities[0].polityAncestryIds, "recording should include polity ancestry");
assert.ok(recording.humanPolitySummary.villages[0].memorySeed, "recording should include village memorySeed");

console.log("v0.11.9 ancestry chain / polity split dedup tests passed");
