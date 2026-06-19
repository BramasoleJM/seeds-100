const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

class FakeClassList {
  constructor(owner) { this.owner = owner; }
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
    this.href = "";
    this.download = "";
  }
  appendChild(child) { this.children.push(child); return child; }
  addEventListener(name, fn) { this.listeners[name] = fn; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  click() {}
  set innerHTML(value) { this._innerHTML = value; if (value === "") this.children = []; }
  get innerHTML() { return this._innerHTML; }
}

function loadSim() {
  const elements = new Map();
  const document = {
    body: new FakeElement("body"),
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, new FakeElement());
      return elements.get(id);
    },
    createElement(tagName) { return new FakeElement(tagName); },
    addEventListener(name, fn) { this.body.addEventListener(name, fn); },
  };
  for (const [id, value] of Object.entries({
    speed: "180",
    humanCount: "18",
    beastCount: "12",
    spiritCount: "0",
    fieldPatchCount: "3",
    wildPatchCount: "4",
    markPatchCount: "1",
    blockCount: "12",
    randomSeed: "14003",
    presetSelect: "balanced",
    overcrowding: "6",
    keyframeEvery: "25",
    viewMode: "macro",
    interventionUnit: "H",
    mapSeedBrush: "",
    mapSeedJson: "",
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
    requestAnimationFrame() { return 1; },
    cancelAnimationFrame() {},
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("sim.js", "utf8"), context, { filename: "sim.js" });
  return context.window.__triSpeciesSim;
}

function humanMemory({ polityId = "human_polity_014c", lineageId = "human_lineage_014c", rootPolityId = polityId, rootLineageId = lineageId, split = false, kind = "village" } = {}) {
  return {
    settlement: { id: `${kind}_${polityId}`, kind, state: "active", support: 12, area: 16, connectedToSeat: true, distanceToSeat: 2 },
    polity: {
      id: polityId,
      state: "active",
      rootPolityId,
      parentPolityId: split ? "human_polity_root" : null,
      ancestryIds: split ? [polityId, "human_polity_root"] : [polityId],
      branchDepth: split ? 1 : 0,
    },
    lineage: {
      id: lineageId,
      rootLineageId,
      ancestryIds: rootLineageId !== lineageId ? [lineageId, rootLineageId] : [lineageId],
      branchDepth: rootLineageId !== lineageId ? 1 : 0,
    },
    continuity: { previousPlaceId: null, successorPlaceId: null, transferReason: split ? "polity_split" : "unknown" },
  };
}

function anchor({ id, type, hintId, score = 0.78, samples = 3, stable = true, active = true, memory, remembered, traits = [], archetype = "settled_village", poiType = null }) {
  const signal = { score, samples, firstSeenTick: 1, lastSeenTick: 20, sourceTraits: traits.slice(0, 5) };
  return {
    id: `${type}:${id}`,
    type,
    displayName: type,
    position: { x: 10, y: 10 },
    sourceRef: { kind: type, id },
    currentSnapshot: {
      semanticTraits: traits,
      placeArchetype: archetype,
      ...(poiType ? { poi: { id, type: poiType, state: "active" } } : {}),
      ...(memory ? { humanMemory: memory } : {}),
      ...(remembered ? { rememberedHumanIdentity: remembered } : {}),
      protoCultureHints: [{ id: hintId, score, strength: score >= 0.65 ? "strong" : "emerging", sourceTraits: traits, sourceArchetype: archetype, reason: "test" }],
    },
    ...(remembered ? { rememberedHumanIdentity: remembered } : {}),
    protoCultureMemory: {
      version: "0.14B",
      primaryHint: hintId,
      stableHints: stable ? [hintId] : [],
      activeHints: active ? [hintId] : [],
      signals: { [hintId]: signal },
    },
  };
}

function fullLineage(id, options = {}) {
  return {
    id,
    parentId: options.parentId || null,
    rootLineageId: options.rootLineageId || id,
    lineageAncestryIds: options.parentId ? [id, options.parentId] : [id],
    originTick: 0,
    firstSeenTick: 0,
    lastSeenTick: 20,
    state: options.state || "active",
    confidence: 1,
    origin: { x: 10, y: 10 },
    centroid: { x: 10, y: 10 },
    centroidPath: [{ tick: 0, x: 10, y: 10 }],
    areaHistory: [{ tick: 0, area: 12 }],
    activeCells: [],
    memoryCells: [],
    domainCells: [],
    currentSeat: options.currentSeat || null,
    seatHistory: [],
    descendantIds: [],
    eventIds: [],
  };
}

const sim = loadSim();
assert.equal(typeof sim.summarizeHumanCultureCandidatesForPlaceMemoryForTest, "function", "V0.14C summary helper should exist");
assert.equal(typeof sim.resolveCultureOwnerIdsForAnchorForTest, "function", "V0.14C owner resolver test hook should exist");

const polityMemory = {
  polities: [{
    id: "human_polity_river",
    state: "active",
    rootLineageId: "human_lineage_river",
    rootPolityId: "human_polity_river",
    lineageIds: ["human_lineage_river"],
    polityAncestryIds: ["human_polity_river"],
  }, {
    id: "human_polity_split",
    state: "active",
    rootLineageId: "human_lineage_split_root",
    rootPolityId: "human_polity_root",
    splitFromPolityId: "human_polity_root",
    lineageIds: ["human_lineage_split"],
    polityAncestryIds: ["human_polity_split", "human_polity_root"],
  }, {
    id: "human_polity_frontier",
    state: "pressured",
    rootLineageId: "human_lineage_frontier",
    rootPolityId: "human_polity_frontier",
    lineageIds: ["human_lineage_frontier"],
  }],
  villages: [],
};
const lineageMemory = {
  lineages: [
    fullLineage("human_lineage_river"),
    fullLineage("human_lineage_memory", { state: "collapsed" }),
    fullLineage("human_lineage_split", { parentId: "human_lineage_split_root", rootLineageId: "human_lineage_split_root" }),
    fullLineage("human_lineage_frontier"),
  ],
  humanOutposts: [],
  events: [],
};

const riverMemory = humanMemory({ polityId: "human_polity_river", lineageId: "human_lineage_river", kind: "seat" });
const riverPlaceMemory = {
  version: "0.14B",
  anchors: [
    anchor({ id: "human_polity_river_seat", type: "seat", hintId: sim.PROTO_CULTURE_HINTS.RIVER_BOUND, memory: riverMemory, traits: ["river_adjacent", "human_seat", "polity_owned"], archetype: "river_village" }),
    anchor({ id: "human_village_river", type: "village", hintId: sim.PROTO_CULTURE_HINTS.RIVER_BOUND, memory: humanMemory({ polityId: "human_polity_river", lineageId: "human_lineage_river" }), traits: ["river_adjacent", "human_settled", "polity_owned"], archetype: "river_village" }),
    anchor({ id: "poi_spring_river", type: "poi", hintId: sim.PROTO_CULTURE_HINTS.SPRING_REFUGE, score: 0.7, memory: null, traits: ["spring_fed", "fertility_recovering"], archetype: "fertile_refuge", poiType: sim.POI_TYPES.SPRING }),
  ],
  wakeReports: [],
};
const riverSummary = sim.summarizeHumanCultureCandidatesForPlaceMemoryForTest(riverPlaceMemory, polityMemory, lineageMemory);
assert.equal(riverSummary.version, "0.14C", "summary should use V0.14C version");
const riverOwner = riverSummary.byPolity.find((owner) => owner.ownerId === "human_polity_river");
assert.ok(riverOwner, "river polity should be summarized");
assert.equal(riverOwner.candidateSignals.river_bound_polity.status, "candidate", "seat + village river evidence should produce a candidate");
assert.ok(riverOwner.candidateSignals.river_bound_polity.contextEvidenceAnchors.includes("poi:poi_spring_river"), "Spring context should support but not own the candidate");

const unownedHumanContextSummary = sim.summarizeHumanCultureCandidatesForPlaceMemoryForTest({
  version: "0.14B",
  anchors: [
    ...riverPlaceMemory.anchors,
    anchor({ id: "audit_human_cluster_unowned", type: "village", hintId: sim.PROTO_CULTURE_HINTS.SPRING_REFUGE, score: 0.92, traits: ["human_settled", "river_adjacent"], archetype: "river_village" }),
  ],
}, polityMemory, lineageMemory);
const unownedRiverOwner = unownedHumanContextSummary.byPolity.find((owner) => owner.ownerId === "human_polity_river");
assert.equal(
  unownedRiverOwner.candidateSignals.river_bound_polity.contextEvidenceAnchors.includes("village:audit_human_cluster_unowned"),
  false,
  "unowned Human-looking anchors should not provide context bonus to another polity"
);

const contextOnly = {
  version: "0.14B",
  anchors: [anchor({ id: "poi_spring_alone", type: "poi", hintId: sim.PROTO_CULTURE_HINTS.SPRING_REFUGE, score: 0.9, traits: ["spring_fed"], archetype: "fertile_refuge", poiType: sim.POI_TYPES.SPRING })],
};
const contextSummary = sim.summarizeHumanCultureCandidatesForPlaceMemoryForTest(contextOnly, polityMemory, lineageMemory);
assert.equal(contextSummary.politiesWithCandidates, 0, "POI context alone must not create polity candidates");
assert.equal(contextSummary.lineagesWithCandidates, 0, "POI context alone must not create lineage candidates");
assert.ok(contextSummary.contextOnlySignals.length === 1, "context-only signals should be retained for audit");
assert.equal(contextSummary.contextOnlySignals[0].ignoredAsOwner, true, "context-only signals should explicitly say they were ignored as owners");

const rememberedIdentity = {
  polityId: "human_polity_lost",
  polityState: "collapsed",
  lineageId: "human_lineage_memory",
  rootPolityId: "human_polity_lost",
  rootLineageId: "human_lineage_memory",
  polityAncestryIds: ["human_polity_lost"],
  lineageAncestryIds: ["human_lineage_memory"],
  rememberedAtTick: 18,
  source: "test",
};
const memorySummary = sim.summarizeHumanCultureCandidatesForPlaceMemoryForTest({
  version: "0.14B",
  anchors: [
    anchor({ id: "human_old_seat_memory", type: "old_seat", hintId: sim.PROTO_CULTURE_HINTS.MEMORY_BOUND, remembered: rememberedIdentity, traits: ["human_old_seat", "collapsed_memory"], archetype: "old_seat" }),
    anchor({ id: "human_domain_memory", type: "domain", hintId: sim.PROTO_CULTURE_HINTS.MEMORY_BOUND, memory: humanMemory({ polityId: "human_polity_lost", lineageId: "human_lineage_memory", kind: "domain" }), traits: ["human_domain", "lineage_continuity"], archetype: "settled_village" }),
  ],
}, polityMemory, lineageMemory);
const memoryLineage = memorySummary.byLineage.find((owner) => owner.ownerId === "human_lineage_memory");
assert.ok(memoryLineage, "memory-bound lineage should be summarized");
assert.equal(memoryLineage.candidateSignals.memory_bound_lineage.status, "candidate", "old seat + domain memory should produce lineage candidate");

const splitSummary = sim.summarizeHumanCultureCandidatesForPlaceMemoryForTest({
  version: "0.14B",
  anchors: [
    anchor({ id: "human_split_seat", type: "seat", hintId: sim.PROTO_CULTURE_HINTS.SPLIT_LINEAGE, memory: humanMemory({ polityId: "human_polity_split", lineageId: "human_lineage_split", rootPolityId: "human_polity_root", rootLineageId: "human_lineage_split_root", split: true, kind: "seat" }), traits: ["human_seat", "split_polity", "lineage_continuity"], archetype: "settled_village" }),
    anchor({ id: "human_split_village", type: "village", hintId: sim.PROTO_CULTURE_HINTS.SPLIT_LINEAGE, memory: humanMemory({ polityId: "human_polity_split", lineageId: "human_lineage_split", rootPolityId: "human_polity_root", rootLineageId: "human_lineage_split_root", split: true }), traits: ["human_settled", "split_polity", "lineage_continuity"], archetype: "settled_village" }),
  ],
}, polityMemory, lineageMemory);
const splitOwner = splitSummary.byPolity.find((owner) => owner.ownerId === "human_polity_split");
assert.ok(["emerging", "candidate"].includes(splitOwner.candidateSignals.split_lineage_polity.status), "split ancestry evidence should produce split_lineage_polity status");

const frontierSummary = sim.summarizeHumanCultureCandidatesForPlaceMemoryForTest({
  version: "0.14B",
  anchors: [
    anchor({ id: "human_frontier_outpost", type: "outpost", hintId: sim.PROTO_CULTURE_HINTS.FRONTIER_ADAPTED, memory: humanMemory({ polityId: "human_polity_frontier", lineageId: "human_lineage_frontier", kind: "outpost" }), traits: ["human_outpost", "mixed_pressure"], archetype: "frontier_outpost" }),
    anchor({ id: "human_frontier_domain", type: "domain", hintId: sim.PROTO_CULTURE_HINTS.FRONTIER_ADAPTED, memory: humanMemory({ polityId: "human_polity_frontier", lineageId: "human_lineage_frontier", kind: "domain" }), traits: ["human_domain", "mixed_pressure"], archetype: "frontier_outpost" }),
  ],
}, polityMemory, lineageMemory);
const frontierOwner = frontierSummary.byPolity.find((owner) => owner.ownerId === "human_polity_frontier");
assert.equal(frontierOwner.candidateSignals.frontier_outpost_polity.status, "candidate", "outpost plus frontier support should produce frontier candidate");

const before = JSON.stringify(riverPlaceMemory);
const polityBefore = JSON.stringify(polityMemory);
const lineageBefore = JSON.stringify(lineageMemory);
sim.summarizeHumanCultureCandidatesForPlaceMemoryForTest(riverPlaceMemory, polityMemory, lineageMemory);
assert.equal(JSON.stringify(riverPlaceMemory), before, "summary helper must not mutate placeMemory");
assert.equal(JSON.stringify(polityMemory), polityBefore, "summary helper must not mutate humanPolityMemory input");
assert.equal(JSON.stringify(lineageMemory), lineageBefore, "summary helper must not mutate humanLineageMemory input");
assert.doesNotThrow(() => JSON.stringify(riverSummary), "summary should be JSON stringifiable");

sim.setHumanPolityMemoryForTest(polityMemory);
sim.setHumanLineageMemoryForTest(lineageMemory);
sim.setPlaceMemoryForTest(riverPlaceMemory);
const recording = sim.createRecordingExport();
assert.ok(recording.placeMemory.humanCultureCandidateSummary, "recording export should include humanCultureCandidateSummary");
const snapshot = sim.createSnapshotExport();
assert.ok(snapshot.placeMemory.humanCultureCandidateSummary, "snapshot export should include humanCultureCandidateSummary");
const lightweight = sim.createProtoCultureSummaryExport();
assert.ok(lightweight.placeMemory.humanCultureCandidateSummary, "lightweight proto-culture export should include humanCultureCandidateSummary");

const review = sim.inspectCurrentTickPlacesForTest({ maxTargets: 8 });
assert.ok(review.placeMemory.humanCultureCandidateSummary, "current place review should include humanCultureCandidateSummary");

const audit = sim.runProtoCultureSummaryAuditForSeedsForTest({ seeds: [14003], ticks: 10, inspectEvery: 5, maxTargets: 8 });
assert.ok(audit.runs[0].humanCultureCandidateSummary, "multi-seed audit run should include humanCultureCandidateSummary");
assert.ok(audit.aggregate.humanCultureCandidateTotals, "multi-seed audit aggregate should include candidate totals");
assert.doesNotThrow(() => JSON.stringify(audit), "multi-seed audit should remain JSON stringifiable");

console.log("v0.14C human culture candidate rollup tests passed");
