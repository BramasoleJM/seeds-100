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
    randomSeed: "15015",
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

function humanMemory({ polityId = "human_polity_v015", lineageId = "human_lineage_v015", rootPolityId = polityId, rootLineageId = lineageId, polityState = "active", kind = "village", split = false } = {}) {
  return {
    settlement: { id: `${kind}_${polityId || lineageId}`, kind, state: polityState, support: 12, area: 16, connectedToSeat: true, distanceToSeat: 2 },
    polity: polityId ? {
      id: polityId,
      state: polityState,
      rootPolityId,
      parentPolityId: split ? "human_polity_root" : null,
      ancestryIds: split ? [polityId, "human_polity_root"] : [polityId],
      branchDepth: split ? 1 : 0,
    } : null,
    lineage: lineageId ? {
      id: lineageId,
      rootLineageId,
      ancestryIds: rootLineageId !== lineageId ? [lineageId, rootLineageId] : [lineageId],
      branchDepth: rootLineageId !== lineageId ? 1 : 0,
    } : null,
    continuity: { previousPlaceId: null, successorPlaceId: null, transferReason: split ? "polity_split" : "unknown" },
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

function cultureAnchor({ id, type, hints, memory = null, remembered = null, traits = [], archetype = "settled_village", poiType = null, samples = 4, stable = true, active = true }) {
  const hintIds = Object.keys(hints);
  const signals = Object.fromEntries(hintIds.map((hintId) => [hintId, {
    score: hints[hintId],
    samples,
    firstSeenTick: 1,
    lastSeenTick: 40,
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

function ownerById(summary, ownerId) {
  return [...summary.byPolity, ...summary.byLineage].find((owner) => owner.ownerId === ownerId);
}

const sim = loadSim();
const H = sim.PROTO_CULTURE_HINTS;
const STAGE = sim.CIVILIZATION_CANDIDATE_MATURITY_STAGES;

assert.equal(typeof sim.summarizeHumanCultureCandidatesForPlaceMemoryForTest, "function", "summary helper should exist");
assert.equal(typeof sim.runCivilizationMaturityAuditForSeedsForTest, "function", "V0.15 maturity audit helper should exist");

const selectivePolityId = "human_polity_v015_selective";
const selectiveLineageId = "human_lineage_v015_selective";
const selectiveSummary = summaryFor(sim, [
  cultureAnchor({
    id: "selective_seat",
    type: "seat",
    hints: { [H.RIVER_BOUND]: 0.88, [H.FOREST_EDGE]: 0.58 },
    memory: humanMemory({ polityId: selectivePolityId, lineageId: selectiveLineageId, kind: "seat" }),
    traits: ["human_seat", "river_adjacent", "forest_edge"],
  }),
  cultureAnchor({
    id: "selective_village",
    type: "village",
    hints: { [H.RIVER_BOUND]: 0.84, [H.FOREST_EDGE]: 0.58 },
    memory: humanMemory({ polityId: selectivePolityId, lineageId: selectiveLineageId }),
    traits: ["human_settled", "river_adjacent", "forest_edge"],
  }),
], { [selectivePolityId]: "active" }, { [selectiveLineageId]: "active" });
const selectiveOwner = ownerById(selectiveSummary, selectivePolityId);
assert.equal(selectiveOwner.dominantCandidate, "river_bound_polity", "strong river direction should dominate");
assert.ok([STAGE.READY, STAGE.RIPE].includes(selectiveOwner.candidateSignals.river_bound_polity.maturityStage), "dominant candidate should mature");
assert.equal(selectiveOwner.candidateSignals.forest_edge_polity.maturityStage, STAGE.NOT_READY, "secondary candidate should remain not_ready");
assert.ok(selectiveOwner.readyCandidates.length + selectiveOwner.ripeCandidates.length < Object.keys(selectiveOwner.candidateSignals).length, "not all candidates should become ready");

const readyPolityId = "human_polity_v015_ready";
const ripePolityId = "human_polity_v015_ripe";
const readyRipeSummary = summaryFor(sim, [
  cultureAnchor({
    id: "ready_seat",
    type: "seat",
    hints: { [H.RIVER_BOUND]: 0.78 },
    memory: humanMemory({ polityId: readyPolityId, lineageId: "human_lineage_v015_ready", kind: "seat" }),
    samples: 2,
    traits: ["human_seat", "river_adjacent"],
  }),
  cultureAnchor({
    id: "ready_village",
    type: "village",
    hints: { [H.RIVER_BOUND]: 0.78 },
    memory: humanMemory({ polityId: readyPolityId, lineageId: "human_lineage_v015_ready" }),
    samples: 2,
    traits: ["human_settled", "river_adjacent"],
  }),
  cultureAnchor({
    id: "ripe_seat",
    type: "seat",
    hints: { [H.RIVER_BOUND]: 0.96 },
    memory: humanMemory({ polityId: ripePolityId, lineageId: "human_lineage_v015_ripe", kind: "seat" }),
    samples: 5,
    traits: ["human_seat", "river_adjacent"],
  }),
  cultureAnchor({
    id: "ripe_village",
    type: "village",
    hints: { [H.RIVER_BOUND]: 0.95 },
    memory: humanMemory({ polityId: ripePolityId, lineageId: "human_lineage_v015_ripe" }),
    samples: 5,
    traits: ["human_settled", "river_adjacent"],
  }),
  cultureAnchor({
    id: "ripe_domain",
    type: "domain",
    hints: { [H.RIVER_BOUND]: 0.94 },
    memory: humanMemory({ polityId: ripePolityId, lineageId: "human_lineage_v015_ripe", kind: "domain" }),
    samples: 5,
    traits: ["human_domain", "river_adjacent"],
  }),
], { [readyPolityId]: "active", [ripePolityId]: "active" });
assert.equal(ownerById(readyRipeSummary, readyPolityId).candidateSignals.river_bound_polity.maturityStage, STAGE.READY, "two-anchor evidence should be ready but not ripe");
assert.equal(ownerById(readyRipeSummary, ripePolityId).candidateSignals.river_bound_polity.maturityStage, STAGE.RIPE, "stronger evidence should become ripe");
assert.ok((readyRipeSummary.maturityStageCounts[STAGE.RIPE] || 0) <= ((readyRipeSummary.maturityStageCounts[STAGE.READY] || 0) + (readyRipeSummary.maturityStageCounts[STAGE.RIPE] || 0)), "ripe should remain a subset of mature candidates");

const contextOnlySummary = summaryFor(sim, [
  cultureAnchor({
    id: "context_spring",
    type: "poi",
    hints: { [H.RIVER_BOUND]: 0.98 },
    traits: ["spring_fed", "river_adjacent"],
    archetype: "fertile_refuge",
    poiType: sim.POI_TYPES.SPRING,
  }),
  cultureAnchor({
    id: "context_beast",
    type: "beast_range",
    hints: { [H.FOREST_EDGE]: 0.96 },
    traits: ["forest_edge"],
    archetype: "forest_edge",
  }),
]);
assert.equal(contextOnlySummary.byPolity.length, 0, "context-only evidence should not create polity owners");
assert.equal(contextOnlySummary.byLineage.length, 0, "context-only evidence should not create lineage owners");
assert.equal(contextOnlySummary.maturityStageCounts[STAGE.READY] || 0, 0, "context-only evidence cannot become ready");
assert.equal(contextOnlySummary.maturityStageCounts[STAGE.RIPE] || 0, 0, "context-only evidence cannot become ripe");
assert.ok(contextOnlySummary.contextOnlySignals.every((item) => item.ignoredAsOwner), "context signals should be visible but ignored as owners");

const legacyLineageId = "human_lineage_v015_legacy";
const legacySummary = summaryFor(sim, [
  cultureAnchor({
    id: "legacy_old_seat",
    type: "old_seat",
    hints: { [H.MEMORY_BOUND]: 0.96 },
    memory: humanMemory({ polityId: "human_polity_v015_dead", lineageId: legacyLineageId, kind: "old_seat" }),
    samples: 5,
    traits: ["human_old_seat", "lineage_continuity"],
  }),
  cultureAnchor({
    id: "legacy_domain",
    type: "domain",
    hints: { [H.MEMORY_BOUND]: 0.94 },
    memory: humanMemory({ polityId: "human_polity_v015_dead", lineageId: legacyLineageId, kind: "domain" }),
    samples: 5,
    traits: ["human_domain", "lineage_continuity"],
  }),
], {}, { [legacyLineageId]: "collapsed" });
const legacyOwner = ownerById(legacySummary, legacyLineageId);
assert.equal(legacyOwner.ownerLifecycleClass, "legacy", "collapsed lineage should be legacy");
assert.equal(legacyOwner.candidateSignals.memory_bound_lineage.maturityStage, STAGE.LEGACY_SEED, "legacy owner should become legacy_seed");
assert.equal(legacyOwner.ripeCandidates.length, 0, "legacy owner should not become active ripe");

const ambiguousPolityId = "human_polity_v015_ambiguous";
const ambiguousSummary = summaryFor(sim, [
  cultureAnchor({
    id: "ambiguous_seat",
    type: "seat",
    hints: { [H.RIVER_BOUND]: 0.92, [H.MONUMENT_CENTERED]: 0.92 },
    memory: humanMemory({ polityId: ambiguousPolityId, lineageId: "human_lineage_v015_ambiguous", kind: "seat" }),
    samples: 5,
    traits: ["human_seat", "river_adjacent", "monument_shadowed"],
  }),
  cultureAnchor({
    id: "ambiguous_village",
    type: "village",
    hints: { [H.RIVER_BOUND]: 0.92, [H.MONUMENT_CENTERED]: 0.92 },
    memory: humanMemory({ polityId: ambiguousPolityId, lineageId: "human_lineage_v015_ambiguous" }),
    samples: 5,
    traits: ["human_settled", "river_adjacent", "monument_shadowed"],
  }),
], { [ambiguousPolityId]: "active" });
const ambiguousOwner = ownerById(ambiguousSummary, ambiguousPolityId);
assert.equal(ambiguousOwner.candidateDominance.ambiguous, true, "equal strong candidates should be ambiguous");
assert.equal(ambiguousOwner.ripeCandidates.length, 0, "ambiguous owner should not become ripe");
assert.ok(Object.values(ambiguousOwner.candidateSignals).some((signal) => signal.maturityBlockers.includes("ambiguous_owner")), "ambiguity should be explicit in blockers");

const frontierPolityId = "human_polity_v015_frontier";
const volatileSummary = summaryFor(sim, [
  cultureAnchor({
    id: "frontier_outpost",
    type: "outpost",
    hints: { [H.FRONTIER_ADAPTED]: 0.96 },
    memory: humanMemory({ polityId: frontierPolityId, lineageId: "human_lineage_v015_frontier", kind: "outpost", polityState: "declining" }),
    samples: 5,
    traits: ["human_outpost", "mixed_pressure"],
    archetype: "frontier_outpost",
  }),
  cultureAnchor({
    id: "frontier_domain",
    type: "domain",
    hints: { [H.FRONTIER_ADAPTED]: 0.94 },
    memory: humanMemory({ polityId: frontierPolityId, lineageId: "human_lineage_v015_frontier", kind: "domain", polityState: "declining" }),
    samples: 5,
    traits: ["human_domain", "mixed_pressure"],
    archetype: "frontier_outpost",
  }),
  cultureAnchor({
    id: "frontier_village",
    type: "village",
    hints: { [H.FRONTIER_ADAPTED]: 0.93 },
    memory: humanMemory({ polityId: frontierPolityId, lineageId: "human_lineage_v015_frontier", polityState: "declining" }),
    samples: 5,
    traits: ["human_settled", "mixed_pressure"],
    archetype: "frontier_outpost",
  }),
], { [frontierPolityId]: "declining" });
const volatileOwner = ownerById(volatileSummary, frontierPolityId);
assert.equal(volatileOwner.ownerLifecycleClass, "at_risk", "declining owner should be at_risk");
assert.equal(volatileOwner.candidateSignals.frontier_outpost_polity.maturityStage, STAGE.VOLATILE_RIPE, "strong at-risk direction should be volatile_ripe");
assert.equal(volatileOwner.ripeCandidates.length, 0, "at-risk ripe should not be stable ripe");

const before = JSON.stringify(readyRipeSummary);
assert.doesNotThrow(() => JSON.stringify(readyRipeSummary), "summary should be JSON stringifiable");
assert.equal(JSON.stringify(readyRipeSummary), before, "stringifying summary should not mutate maturity exports");
assert.equal(JSON.stringify(readyRipeSummary).includes("terrainRows"), false, "maturity summary should not add full terrain rows");
assert.equal(JSON.stringify(readyRipeSummary).includes("unitRows"), false, "maturity summary should not add full unit rows");
assert.equal(typeof selectiveOwner.maturitySummary.reason, "string", "owner should expose compact maturity reason");
assert.equal(typeof selectiveOwner.candidateSignals.river_bound_polity.maturityScore, "number", "candidate should expose maturityScore");
assert.ok(Array.isArray(selectiveOwner.candidateSignals.river_bound_polity.maturityReasons), "candidate should expose compact reasons");
assert.ok(Array.isArray(selectiveOwner.candidateSignals.river_bound_polity.maturityBlockers), "candidate should expose compact blockers");

const audit = sim.runCivilizationMaturityAuditForSeedsForTest({ seeds: [15015], ticks: 5, inspectEvery: 5, maxTargets: 6 });
assert.equal(audit.version, "0.15", "maturity audit helper should expose V0.15 version");
assert.ok(audit.aggregate.maturityStageCounts, "multi-seed audit should include maturityStageCounts");
assert.ok(audit.aggregate.maturityByCandidateType, "multi-seed audit should include maturityByCandidateType");
assert.ok(audit.aggregate.ownerLifecycleMaturityCounts, "multi-seed audit should include ownerLifecycleMaturityCounts");
assert.ok(audit.aggregate.ambiguousMaturityCounts, "multi-seed audit should include ambiguousMaturityCounts");
assert.ok(audit.civilizationCandidateMaturitySummary.maturityStageCounts, "nested maturity summary should include stage counts");
assert.doesNotThrow(() => JSON.stringify(audit), "maturity audit should remain JSON stringifiable");

console.log("v0.15 civilization candidate maturity gates tests passed");
