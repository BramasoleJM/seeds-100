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
    randomSeed: "14031",
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

function humanMemory({ polityId, lineageId, polityState = "active", kind = "village", split = false } = {}) {
  return {
    settlement: { id: `${kind}_${polityId || lineageId}`, kind, state: polityState, support: 12, area: 16, connectedToSeat: true, distanceToSeat: 1 },
    polity: polityId ? {
      id: polityId,
      state: polityState,
      rootPolityId: split ? "human_polity_root" : polityId,
      parentPolityId: split ? "human_polity_root" : null,
      ancestryIds: split ? [polityId, "human_polity_root"] : [polityId],
      branchDepth: split ? 1 : 0,
    } : null,
    lineage: lineageId ? {
      id: lineageId,
      rootLineageId: lineageId,
      ancestryIds: [lineageId],
      branchDepth: 0,
    } : null,
    continuity: { previousPlaceId: null, successorPlaceId: null, transferReason: split ? "polity_split" : "unknown" },
  };
}

function cultureAnchor({ id, type, hints, memory = null, remembered = null, traits = [], archetype = "settled_village", poiType = null, samples = 3, stable = true, active = true }) {
  const hintIds = Object.keys(hints);
  const signals = Object.fromEntries(hintIds.map((hintId) => [hintId, {
    score: hints[hintId],
    samples,
    firstSeenTick: 1,
    lastSeenTick: 20,
    sourceTraits: traits.slice(0, 5),
  }]));
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
      protoCultureHints: hintIds.map((hintId) => ({
        id: hintId,
        score: hints[hintId],
        strength: hints[hintId] >= 0.65 ? "strong" : "emerging",
        sourceTraits: traits,
        sourceArchetype: archetype,
        reason: "test",
      })),
    },
    ...(remembered ? { rememberedHumanIdentity: remembered } : {}),
    protoCultureMemory: {
      version: "0.14B",
      primaryHint: hintIds[0] || null,
      stableHints: stable ? hintIds : [],
      activeHints: active ? hintIds : [],
      signals,
    },
  };
}

function fullLineage(id, state = "active") {
  return {
    id,
    parentId: null,
    rootLineageId: id,
    lineageAncestryIds: [id],
    firstSeenTick: 0,
    lastSeenTick: 20,
    state,
    confidence: 1,
    origin: { x: 10, y: 10 },
    centroid: { x: 10, y: 10 },
    centroidPath: [{ tick: 0, x: 10, y: 10 }],
    areaHistory: [{ tick: 0, area: 12 }],
    activeCells: [],
    memoryCells: [],
    domainCells: [],
    currentSeat: null,
    seatHistory: [],
    descendantIds: [],
    eventIds: [],
  };
}

function summaryFor(sim, anchors, polityStates = {}, lineageStates = {}) {
  const polityMemory = {
    polities: Object.entries(polityStates).map(([id, state]) => ({
      id,
      state,
      rootPolityId: id,
      rootLineageId: id.replace("polity", "lineage"),
      lineageIds: [id.replace("polity", "lineage")],
      polityAncestryIds: [id],
    })),
    villages: [],
  };
  const lineageMemory = {
    lineages: Object.entries(lineageStates).map(([id, state]) => fullLineage(id, state)),
    humanOutposts: [],
    events: [],
  };
  return sim.summarizeHumanCultureCandidatesForPlaceMemoryForTest({ version: "0.14B", anchors, wakeReports: [] }, polityMemory, lineageMemory);
}

const sim = loadSim();
assert.equal(typeof sim.summarizeHumanCultureCandidatesForPlaceMemoryForTest, "function", "V0.14C summary helper should exist");

const activePolityId = "human_polity_active_014c1";
const activeLineageId = "human_lineage_active_014c1";
const activeAnchors = [
  cultureAnchor({
    id: "active_seat",
    type: "seat",
    hints: { river_bound: 0.95, monument_centered: 0.95 },
    memory: humanMemory({ polityId: activePolityId, lineageId: activeLineageId, kind: "seat" }),
    traits: ["river_adjacent", "human_seat", "polity_owned", "monument_shadowed"],
    archetype: "river_village",
  }),
  cultureAnchor({
    id: "active_village",
    type: "village",
    hints: { river_bound: 0.95, monument_centered: 0.95 },
    memory: humanMemory({ polityId: activePolityId, lineageId: activeLineageId }),
    traits: ["river_adjacent", "human_settled", "polity_owned", "monument_shadowed"],
    archetype: "river_village",
  }),
];
const activeSummary = summaryFor(sim, activeAnchors, { [activePolityId]: "active" }, { [activeLineageId]: "active" });
const activeOwner = activeSummary.byPolity.find((owner) => owner.ownerId === activePolityId);
assert.ok(activeOwner.dominantCandidate, "owner should expose one dominant candidate");
assert.ok(Array.isArray(activeOwner.secondaryCandidates), "owner should expose secondaryCandidates");
assert.ok(activeOwner.secondaryCandidates.length <= 3, "secondaryCandidates should be capped");
assert.equal(activeOwner.secondaryCandidates.includes(activeOwner.dominantCandidate), false, "secondaryCandidates should not repeat dominantCandidate");
assert.equal(activeOwner.candidateDominance.dominant.id, activeOwner.dominantCandidate, "dominance detail should match dominantCandidate");
assert.ok(activeOwner.topCandidates.length <= 4, "topCandidates should be capped to four");

const decliningPolityId = "human_polity_declining_014c1";
const collapsedPolityId = "human_polity_collapsed_014c1";
const lifecycleSummary = summaryFor(sim, [
  ...activeAnchors,
  cultureAnchor({
    id: "declining_outpost",
    type: "outpost",
    hints: { frontier_adapted: 0.9 },
    memory: humanMemory({ polityId: decliningPolityId, lineageId: "human_lineage_declining_014c1", polityState: "declining", kind: "outpost" }),
    traits: ["human_outpost", "mixed_pressure"],
    archetype: "frontier_outpost",
  }),
  cultureAnchor({
    id: "declining_domain",
    type: "domain",
    hints: { frontier_adapted: 0.9 },
    memory: humanMemory({ polityId: decliningPolityId, lineageId: "human_lineage_declining_014c1", polityState: "declining", kind: "domain" }),
    traits: ["human_domain", "mixed_pressure"],
    archetype: "frontier_outpost",
  }),
  cultureAnchor({
    id: "collapsed_seat",
    type: "seat",
    hints: { monument_centered: 0.9 },
    memory: humanMemory({ polityId: collapsedPolityId, lineageId: "human_lineage_collapsed_014c1", polityState: "collapsed", kind: "seat" }),
    traits: ["human_seat", "polity_owned", "monument_shadowed"],
  }),
  cultureAnchor({
    id: "collapsed_village",
    type: "village",
    hints: { monument_centered: 0.9 },
    memory: humanMemory({ polityId: collapsedPolityId, lineageId: "human_lineage_collapsed_014c1", polityState: "collapsed" }),
    traits: ["human_settled", "polity_owned", "monument_shadowed"],
  }),
], {
  [activePolityId]: "active",
  [decliningPolityId]: "declining",
  [collapsedPolityId]: "collapsed",
}, {
  [activeLineageId]: "active",
  human_lineage_declining_014c1: "declining",
  human_lineage_collapsed_014c1: "collapsed",
});
const decliningOwner = lifecycleSummary.byPolity.find((owner) => owner.ownerId === decliningPolityId);
const collapsedOwner = lifecycleSummary.byPolity.find((owner) => owner.ownerId === collapsedPolityId);
assert.equal(activeOwner.ownerLifecycleClass, "active", "active owner lifecycle should be active");
assert.equal(Object.values(activeOwner.candidateSignals)[0].candidateUse, "active_candidate", "active owner signal should use active_candidate");
assert.equal(decliningOwner.ownerLifecycleClass, "at_risk", "declining owner lifecycle should be at_risk");
assert.equal(decliningOwner.candidateSignals.frontier_outpost_polity.candidateUse, "at_risk_candidate", "declining owner signal should use at_risk_candidate");
assert.equal(collapsedOwner.ownerLifecycleClass, "legacy", "collapsed owner lifecycle should be legacy");
assert.equal(collapsedOwner.candidateSignals.monument_centered_polity.candidateUse, "legacy_candidate", "collapsed owner signal should use legacy_candidate");

const legacyLineageId = "human_lineage_memory_014c1";
const highScoreEmergingSummary = summaryFor(sim, [
  cultureAnchor({
    id: "single_old_seat",
    type: "old_seat",
    hints: { memory_bound: 1 },
    memory: humanMemory({ lineageId: legacyLineageId, kind: "old_seat" }),
    traits: ["human_old_seat", "collapsed_memory"],
    archetype: "old_seat",
    samples: 6,
  }),
], {}, { [legacyLineageId]: "collapsed" });
const memoryOwner = highScoreEmergingSummary.byLineage.find((owner) => owner.ownerId === legacyLineageId);
const memorySignal = memoryOwner.candidateSignals.memory_bound_lineage;
assert.equal(memoryOwner.ownerLifecycleClass, "legacy", "collapsed lineage should be legacy");
assert.equal(memorySignal.candidateUse, "legacy_candidate", "collapsed lineage signal should use legacy_candidate");
assert.equal(memorySignal.status, "emerging", "single strong anchor should remain emerging");
assert.ok(/only one|not enough/i.test(memorySignal.maturityReason), "high-score emerging should explain the narrow evidence");
assert.ok(highScoreEmergingSummary.highScoreEmergingCount >= 1, "summary should count high-score emerging signals");

for (const signal of Object.values(activeOwner.candidateSignals)) {
  assert.equal(typeof signal.evidenceSummary.uniqueSubjectAnchorCount, "number", "evidenceSummary should include uniqueSubjectAnchorCount");
  assert.equal(typeof signal.evidenceSummary.uniqueContextAnchorCount, "number", "evidenceSummary should include uniqueContextAnchorCount");
  assert.equal(typeof signal.evidenceSummary.stableSubjectAnchorCount, "number", "evidenceSummary should include stableSubjectAnchorCount");
  assert.equal(typeof signal.evidenceSummary.activeSubjectAnchorCount, "number", "evidenceSummary should include activeSubjectAnchorCount");
  assert.equal(signal.evidenceSummary.displayedSubjectAnchorCount, signal.subjectEvidenceAnchors.length, "displayed subject count should match exported array");
  assert.equal(signal.evidenceSummary.displayedContextAnchorCount, signal.contextEvidenceAnchors.length, "displayed context count should match exported array");
  assert.equal(typeof signal.dominanceScore, "number", "signal should include dominanceScore");
  assert.ok(signal.maturityReason, "signal should include maturityReason");
}
assert.ok(activeSummary.dominantCandidateTypeCounts, "summary should include dominantCandidateTypeCounts");
assert.ok(activeSummary.secondaryCandidateTypeCounts, "summary should include secondaryCandidateTypeCounts");
assert.ok(activeSummary.candidateUseCounts, "summary should include candidateUseCounts");
assert.ok(activeSummary.ownerLifecycleCounts, "summary should include ownerLifecycleCounts");
assert.equal(typeof activeSummary.ambiguousOwnerCount, "number", "summary should include ambiguousOwnerCount");
assert.equal(typeof activeSummary.highScoreEmergingCount, "number", "summary should include highScoreEmergingCount");

const contextOnlySummary = summaryFor(sim, [
  cultureAnchor({
    id: "poi_context_only",
    type: "poi",
    hints: { spring_refuge: 0.95 },
    traits: ["spring_fed", "fertility_recovering"],
    archetype: "fertile_refuge",
    poiType: sim.POI_TYPES.SPRING,
  }),
  cultureAnchor({
    id: "beast_context_only",
    type: "beast_range",
    hints: { forest_edge: 0.95 },
    traits: ["beast_habitat"],
    archetype: "beast_range",
  }),
]);
assert.equal(contextOnlySummary.byPolity.length, 0, "context-only anchors should not create polity owners");
assert.equal(contextOnlySummary.byLineage.length, 0, "context-only anchors should not create lineage owners");
assert.ok(contextOnlySummary.contextOnlySignals.length >= 1, "context-only signals should remain visible for audit");
assert.ok(contextOnlySummary.contextOnlySignals.every((item) => item.ignoredAsOwner), "context-only signals should be ignored as owners");

sim.setPlaceMemoryForTest({ version: "0.14B", anchors: activeAnchors, awakeCycleInspectedAnchorIds: [], wakeReports: [] });
sim.setHumanPolityMemoryForTest({
  polities: [{ id: activePolityId, state: "active", rootPolityId: activePolityId, rootLineageId: activeLineageId, lineageIds: [activeLineageId] }],
  villages: [],
});
sim.setHumanLineageMemoryForTest({ lineages: [fullLineage(activeLineageId, "active")], humanOutposts: [], events: [] });
const snapshotExport = sim.createSnapshotExport();
const protoExport = sim.createProtoCultureSummaryExport();
assert.ok(snapshotExport.placeMemory.humanCultureCandidateSummary.byPolity[0].dominantCandidate, "snapshot export should include dominance fields");
assert.doesNotThrow(() => JSON.stringify(snapshotExport), "snapshot export should remain JSON stringifiable");
assert.doesNotThrow(() => JSON.stringify(protoExport), "proto-culture summary export should remain JSON stringifiable");
assert.equal(JSON.stringify(protoExport).includes("terrainRows"), false, "lightweight proto-culture export should not include full terrain rows");
assert.equal(JSON.stringify(protoExport).includes("unitRows"), false, "lightweight proto-culture export should not include full unit rows");

const audit = sim.runProtoCultureSummaryAuditForSeedsForTest({ seeds: [14031], ticks: 5, inspectEvery: 5, maxTargets: 6 });
assert.ok(audit.aggregate.dominantCandidateTypeCounts, "multi-seed aggregate should include dominantCandidateTypeCounts");
assert.ok(audit.aggregate.secondaryCandidateTypeCounts, "multi-seed aggregate should include secondaryCandidateTypeCounts");
assert.ok(audit.aggregate.candidateUseCounts, "multi-seed aggregate should include candidateUseCounts");
assert.ok(audit.aggregate.ownerLifecycleCounts, "multi-seed aggregate should include ownerLifecycleCounts");
assert.equal(typeof audit.aggregate.ambiguousOwnerCount, "number", "multi-seed aggregate should include ambiguousOwnerCount");
assert.equal(typeof audit.aggregate.highScoreEmergingCount, "number", "multi-seed aggregate should include highScoreEmergingCount");
assert.ok(audit.aggregate.humanCultureCandidateTotals.dominantCandidateTypeCounts, "nested candidate totals should include dominant counts too");

console.log("v0.14C.1 culture candidate maturity dominance tests passed");
