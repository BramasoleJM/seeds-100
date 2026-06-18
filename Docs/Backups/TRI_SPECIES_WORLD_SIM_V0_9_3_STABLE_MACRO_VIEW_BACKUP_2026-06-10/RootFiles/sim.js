"use strict";

const WIDTH = 40;
const HEIGHT = 25;
const MIN_TICK_SPEED_MS = 100;
const MAX_RECORDED_FRAMES = 2000;
const MACRO_ANALYSIS_INTERVAL = 25;
const MAX_MACRO_RECENT_FRAMES = 150;
const MAX_MACRO_FRAMES = 500;
const MAX_MACRO_ICONS = 12;
const ABANDONED_FIELD_MIN_AGE = 20;
const ABANDONED_FIELD_DECAY_CHANCE = 0.08;
const HAUNTED_FIELD_TO_MARK_CHANCE = 0.04;
const MIN_EMPTY_NEIGHBORS_FOR_BIRTH = 3;
const MAX_LOCAL_UNITS_FOR_BIRTH = 4;
const SCOUT_CHANCE = 0.06;
const BORDER_FORMATION_CHANCE = 0.2;
const HUMAN_MAX_AGE = 100;
const HUMAN_OLD_AGE_DEATH_CHANCE = 0.1;
const HUMAN_BASELINE_DEATH_CHANCE = 0.001;
const HUMAN_BIRTH_CHANCE = 0.22;
const HUMAN_SURPLUS_BIRTH_CHANCE = 0.18;
const HUMAN_BALANCED_BIRTH_CHANCE = 0.07;
const HUMAN_PRESSURED_BIRTH_CHANCE = 0.015;
const HUMAN_COLLAPSE_DEATH_CHANCE = 0.03;
const MARK_HUMAN_STRESS_DEATH_CHANCE = 0.03;
const BEAST_MAX_AGE = 90;
const BEAST_OLD_AGE_DEATH_CHANCE = 0.08;
const BEAST_BASELINE_DEATH_CHANCE = 0.001;
const BEAST_BIRTH_CHANCE = 0.003;
const BEAST_RESTORE_CHANCE = 0.18;
const BEAST_TRAMPLE_FIELD_CHANCE = 0.08;
const SPIRIT_MIN_MAX_AGE = 4;
const SPIRIT_MAX_MAX_AGE = 7;
const SPIRIT_INCUBATION_TICKS = 3;
const MARK_MIN_LIFETIME = 15;
const MARK_PASSIVE_DECAY_CHANCE = 0.04;
const SETTLER_PRESSURED_DEPARTURE_CHANCE = 0.06;
const SETTLER_COLLAPSE_DEPARTURE_CHANCE = 0.18;
const SETTLER_MIN_AGE = 2;
const TERRAIN = {
  EMPTY: ".",
  FIELD: "F",
  WILD: "W",
  MARK: "M",
  BORDER: "X",
  BLOCK: "#",
};
const UNIT = {
  HUMAN: "H",
  BEAST: "B",
  SPIRIT: "S",
};

let world = [];
let tick = 0;
let playing = false;
let timerId = null;

const gridEl = document.getElementById("grid");
const statsEl = document.getElementById("statsList");
const playPauseBtn = document.getElementById("playPause");
const stepBtn = document.getElementById("step");
const resetBtn = document.getElementById("reset");
const randomizeBtn = document.getElementById("randomize");
const applyInitialSettingsBtn = document.getElementById("applyInitialSettings");
const presetSelect = document.getElementById("presetSelect");
const speedInput = document.getElementById("speed");
const movementToggle = document.getElementById("movementToggle");
const macroOverlayToggle = document.getElementById("macroOverlayToggle");
const viewModeSelect = document.getElementById("viewMode");
const humanCountInput = document.getElementById("humanCount");
const beastCountInput = document.getElementById("beastCount");
const spiritCountInput = document.getElementById("spiritCount");
const fieldPatchCountInput = document.getElementById("fieldPatchCount");
const wildPatchCountInput = document.getElementById("wildPatchCount");
const markPatchCountInput = document.getElementById("markPatchCount");
const blockCountInput = document.getElementById("blockCount");
const randomSeedInput = document.getElementById("randomSeed");
const overcrowdingInput = document.getElementById("overcrowding");
const keyframeEveryInput = document.getElementById("keyframeEvery");
const exportSnapshotBtn = document.getElementById("exportSnapshot");
const startRecordingBtn = document.getElementById("startRecording");
const stopRecordingBtn = document.getElementById("stopRecording");
const exportRecordingBtn = document.getElementById("exportRecording");
const clearRecordingBtn = document.getElementById("clearRecording");
const recordingStateEl = document.getElementById("recordingState");
const recordedFramesEl = document.getElementById("recordedFrames");
const recordedKeyframesEl = document.getElementById("recordedKeyframes");
const playingStateEl = document.getElementById("playingState");
const gridSizeEl = document.getElementById("gridSize");
const statusMessageEl = document.getElementById("statusMessage");
const macroOverlayEl = document.getElementById("macroOverlay");

let recording = createEmptyRecording();
let currentTickEvents = createEmptyEvents();
let lastTickEvents = createEmptyEvents();
let currentTickDiagnostics = createEmptyDiagnostics();
let lastTickDiagnostics = createEmptyDiagnostics();
let currentInitialWorld = null;
let currentInitialSettings = null;
let currentPlacementWarnings = [];
let movementRotCache = null;
let macroWorld = createEmptyMacroWorld();
let macroHistory = createEmptyMacroHistory();
let macroRecentFrames = [];
let macroFrames = [];
let macroDisplayMaskCache = { source: null, tick: null, masks: null };
const NEIGHBORS = buildNeighborTable();
const RADIUS_OFFSETS = buildRadiusOffsets(8);

function fertilityForTerrain(terrain) {
  const ranges = {
    ".": [1, 2],
    F: [2, 3],
    W: [3, 4],
    M: [2, 3],
    X: [1, 2],
    "#": [0, 0],
  };
  const [min, max] = ranges[terrain] || ranges["."];
  return min + Math.floor(Math.random() * (max - min + 1));
}

function clampFertility(value) {
  return Math.max(0, Math.min(4, Math.round(value)));
}

function spiritMaxAge() {
  return SPIRIT_MIN_MAX_AGE + Math.floor(Math.random() * (SPIRIT_MAX_MAX_AGE - SPIRIT_MIN_MAX_AGE + 1));
}

function createCell(terrain = TERRAIN.EMPTY, unit = null, age = 0, role = "normal", fertility = null, terrainAge = 0, maxAge = null) {
  return {
    terrain,
    unit,
    age: unit ? age : 0,
    role: unit ? role : null,
    terrainAge,
    maxAge: unit === UNIT.SPIRIT ? (maxAge || spiritMaxAge()) : null,
    fertility: clampFertility(fertility ?? fertilityForTerrain(terrain)),
  };
}

function isSettlerRole(role) {
  return typeof role === "string" && role.startsWith("settler");
}

function isRestingSettlerRole(role) {
  return typeof role === "string" && role.startsWith("settler_resting");
}

function isSeekingSettlerRole(role) {
  return typeof role === "string" && role.startsWith("settler_seeking");
}

function isProsperitySettlerRole(role) {
  return typeof role === "string" && role.includes("prosperity");
}

function isCrisisSettlerRole(role) {
  return typeof role === "string" && role.includes("crisis");
}

function isDormantSpirit(cell) {
  return cell.unit === UNIT.SPIRIT && (cell.age || 0) < SPIRIT_INCUBATION_TICKS;
}

function isActiveSpirit(cell) {
  return cell.unit === UNIT.SPIRIT && (cell.age || 0) >= SPIRIT_INCUBATION_TICKS;
}

function isNoSpiritControlMode() {
  return currentInitialSettings?.presetName === "No Spirit Control";
}

function createEmptyWorld() {
  return Array.from({ length: HEIGHT }, () =>
    Array.from({ length: WIDTH }, () => createCell())
  );
}

function cloneWorld(source) {
  return source.map((row) => row.map((cell) => ({
    terrain: cell.terrain,
    unit: cell.unit,
    age: cell.unit ? cell.age || 0 : 0,
    role: cell.unit ? cell.role || "normal" : null,
    terrainAge: cell.terrainAge || 0,
    maxAge: cell.maxAge || null,
    fertility: cell.fertility ?? fertilityForTerrain(cell.terrain),
  })));
}

function createEmptyRecording() {
  return {
    isRecording: false,
    startTick: null,
    endTick: null,
    params: null,
    frames: [],
    keyframes: [],
  };
}

function createEmptyEvents() {
  return {
    births: { H: 0, B: 0, S: 0 },
    deaths: { H: 0, B: 0, S: 0 },
    naturalDeaths: { H: 0, B: 0, S: 0 },
    conflictDeaths: { H: 0, B: 0, S: 0 },
    conversions: { H_to_S: 0 },
    settlerSpawns: 0,
    spiritManifestations: 0,
    settlerDepartures: 0,
    settlerMoves: 0,
    settlerRestStops: 0,
    settlerForcedExplorationMoves: 0,
    settlerRestTicks: 0,
    settlersLeavingRest: 0,
    settlersLostRoleWithoutFounding: 0,
    settlerBlockedByOccupied: 0,
    settlerBlockedByNoTarget: 0,
    settlerBlockedByDanger: 0,
    settlerBlockedByTerrain: 0,
    settlerBlockedByNoValidStep: 0,
    settlementFoundings: 0,
    terrainChanges: {},
    spiritDeaths: { S: 0 },
    spiritsCreatedByDeath: 0,
    spiritsCreatedByHumanDeath: 0,
    spiritsCreatedByBeastDeath: 0,
    spiritsCreatedByConversion: 0,
    humanDeathsToSpirit: 0,
    humanDeathsToMark: 0,
    spiritKillsHumanToMark: 0,
    spiritTrailMarksCreated: 0,
    spiritDiedIntoMark: 0,
    marksCreatedByDeath: 0,
    marksCreatedBySpirit: 0,
    marksCleanedByBeast: 0,
    marksDecayed: 0,
    beastDispersals: 0,
    beastDispersalWildCreated: 0,
    beastDispersalMarksCleaned: 0,
    beastDispersalSpiritsSuppressed: 0,
    fieldCreated: 0,
    fieldDecayed: 0,
    fieldTrampled: 0,
    beastRandomMoves: 0,
    beastFleeMoves: 0,
    beastAttractedMoves: 0,
    beastBlockedMoves: 0,
    beastStallBreakMoves: 0,
    beastBirthsBlockedByDensity: 0,
    beastBirthsBlockedBySoftBrake: 0,
    wildCreatedByBeast: 0,
    wildDecayedToEmpty: 0,
    humanNormalMoves: 0,
    prosperitySettlerDepartures: 0,
    prosperitySettlerBirths: 0,
    crisisSettlerDepartures: 0,
    spiritBlockedByCoreSettlement: 0,
    humanRetreatsFromSpirit: 0,
    spiritSpawnsFromMark: 0,
    spiritSpreadActions: 0,
    spiritSuppressedByBeast: 0,
    spiritWarningFlees: 0,
    spiritSpawnBlockedByLocalDensity: 0,
    spiritSpawnBlockedByEarlyGrace: 0,
    beastRelocations: 0,
    beastDispersalRemovals: 0,
    beastAuraSpiritCleansed: 0,
    beastAuraMarksCleaned: 0,
    dormantSpiritSuppressedByBeast: 0,
    activeSpiritSuppressedByBeast: 0,
    beastRecoveryPatchCreated: 0,
  };
}

function createEmptyDiagnostics() {
  return {
    birthCandidates: { H: 0, B: 0, S: 0 },
    actualBirths: { H: 0, B: 0, S: 0 },
    deathCandidates: { H: 0, B: 0, S: 0 },
    actualDeaths: { H: 0, B: 0, S: 0 },
    moveCandidates: { H: 0, B: 0, S: 0 },
    actualMoves: { H: 0, B: 0, S: 0 },
    frontierUnits: { H: 0, B: 0, S: 0 },
    borderCandidates: 0,
    actualBordersCreated: 0,
    humanLocalConditions: { surplus: 0, balanced: 0, pressured: 0, collapse: 0 },
    activeSettlers: 0,
    activeRestingSettlers: 0,
    activeProsperitySettlers: 0,
    activeCrisisSettlers: 0,
    activeSettlersWithValidMove: 0,
    activeSettlersWithFoundingOpportunity: 0,
    activeSettlersBlocked: 0,
    coreHumans: 0,
    edgeHumans: 0,
    isolatedHumans: 0,
    totalHumanSupport: 0,
    totalHumanDemand: 0,
    humanSupportSamples: 0,
    avgHumanSupport: 0,
    avgHumanDemand: 0,
    markCellsNearHumans: 0,
    spiritCellsNearHumans: 0,
    humansAdjacentToSpirit: 0,
    humansAdjacentToMark: 0,
    beastVisibleMarkTargets: 0,
    beastVisibleSpiritTargets: 0,
    beastStalledCount: 0,
    markCellsWithNearbyBeast: 0,
    clusteredMarkTargets: 0,
    beastNeighborStats: { isolated: 0, smallGroup: 0, clustered: 0 },
    scatteredWildCells: 0,
    largestWildClusterSize: 0,
    beastBirthEligibleCells: 0,
    beastLocalDensityBlockedCells: 0,
    totalBeasts: 0,
    totalWild: 0,
    dormantSpirits: 0,
    activeSpirits: 0,
    humansAdjacentToDormantSpirit: 0,
    humansAdjacentToActiveSpirit: 0,
    beastsAdjacentToSpirit: 0,
    beastsAdjacentToMark: 0,
  };
}

function cloneDiagnostics(diagnostics) {
  return {
    birthCandidates: { ...diagnostics.birthCandidates },
    actualBirths: { ...diagnostics.actualBirths },
    deathCandidates: { ...diagnostics.deathCandidates },
    actualDeaths: { ...diagnostics.actualDeaths },
    moveCandidates: { ...diagnostics.moveCandidates },
    actualMoves: { ...diagnostics.actualMoves },
    frontierUnits: { ...diagnostics.frontierUnits },
    borderCandidates: diagnostics.borderCandidates,
    actualBordersCreated: diagnostics.actualBordersCreated,
    humanLocalConditions: { ...(diagnostics.humanLocalConditions || { surplus: 0, balanced: 0, pressured: 0, collapse: 0 }) },
    activeSettlers: diagnostics.activeSettlers || 0,
    activeRestingSettlers: diagnostics.activeRestingSettlers || 0,
    activeProsperitySettlers: diagnostics.activeProsperitySettlers || 0,
    activeCrisisSettlers: diagnostics.activeCrisisSettlers || 0,
    activeSettlersWithValidMove: diagnostics.activeSettlersWithValidMove || 0,
    activeSettlersWithFoundingOpportunity: diagnostics.activeSettlersWithFoundingOpportunity || 0,
    activeSettlersBlocked: diagnostics.activeSettlersBlocked || 0,
    coreHumans: diagnostics.coreHumans || 0,
    edgeHumans: diagnostics.edgeHumans || 0,
    isolatedHumans: diagnostics.isolatedHumans || 0,
    avgHumanSupport: diagnostics.avgHumanSupport || 0,
    avgHumanDemand: diagnostics.avgHumanDemand || 0,
    markCellsNearHumans: diagnostics.markCellsNearHumans || 0,
    spiritCellsNearHumans: diagnostics.spiritCellsNearHumans || 0,
    humansAdjacentToSpirit: diagnostics.humansAdjacentToSpirit || 0,
    humansAdjacentToMark: diagnostics.humansAdjacentToMark || 0,
    beastVisibleMarkTargets: diagnostics.beastVisibleMarkTargets || 0,
    beastVisibleSpiritTargets: diagnostics.beastVisibleSpiritTargets || 0,
    beastStalledCount: diagnostics.beastStalledCount || 0,
    markCellsWithNearbyBeast: diagnostics.markCellsWithNearbyBeast || 0,
    clusteredMarkTargets: diagnostics.clusteredMarkTargets || 0,
    beastNeighborStats: { ...(diagnostics.beastNeighborStats || { isolated: 0, smallGroup: 0, clustered: 0 }) },
    scatteredWildCells: diagnostics.scatteredWildCells || 0,
    largestWildClusterSize: diagnostics.largestWildClusterSize || 0,
    beastBirthEligibleCells: diagnostics.beastBirthEligibleCells || 0,
    beastLocalDensityBlockedCells: diagnostics.beastLocalDensityBlockedCells || 0,
    totalBeasts: diagnostics.totalBeasts || 0,
    totalWild: diagnostics.totalWild || 0,
    dormantSpirits: diagnostics.dormantSpirits || 0,
    activeSpirits: diagnostics.activeSpirits || 0,
    humansAdjacentToDormantSpirit: diagnostics.humansAdjacentToDormantSpirit || 0,
    humansAdjacentToActiveSpirit: diagnostics.humansAdjacentToActiveSpirit || 0,
    beastsAdjacentToSpirit: diagnostics.beastsAdjacentToSpirit || 0,
    beastsAdjacentToMark: diagnostics.beastsAdjacentToMark || 0,
  };
}

function cloneEvents(events) {
  return {
    births: { ...events.births },
    deaths: { ...events.deaths },
    naturalDeaths: { ...events.naturalDeaths },
    conflictDeaths: { ...events.conflictDeaths },
    conversions: { ...events.conversions },
    settlerSpawns: events.settlerSpawns,
    spiritManifestations: events.spiritManifestations,
    settlerDepartures: events.settlerDepartures,
    settlerMoves: events.settlerMoves || 0,
    settlerRestStops: events.settlerRestStops || 0,
    settlerForcedExplorationMoves: events.settlerForcedExplorationMoves || 0,
    settlerRestTicks: events.settlerRestTicks || 0,
    settlersLeavingRest: events.settlersLeavingRest || 0,
    settlersLostRoleWithoutFounding: events.settlersLostRoleWithoutFounding || 0,
    settlerBlockedByOccupied: events.settlerBlockedByOccupied || 0,
    settlerBlockedByNoTarget: events.settlerBlockedByNoTarget || 0,
    settlerBlockedByDanger: events.settlerBlockedByDanger || 0,
    settlerBlockedByTerrain: events.settlerBlockedByTerrain || 0,
    settlerBlockedByNoValidStep: events.settlerBlockedByNoValidStep || 0,
    settlementFoundings: events.settlementFoundings,
    terrainChanges: { ...(events.terrainChanges || {}) },
    spiritDeaths: { ...(events.spiritDeaths || { S: 0 }) },
    spiritsCreatedByDeath: events.spiritsCreatedByDeath || 0,
    spiritsCreatedByHumanDeath: events.spiritsCreatedByHumanDeath || 0,
    spiritsCreatedByBeastDeath: events.spiritsCreatedByBeastDeath || 0,
    spiritsCreatedByConversion: events.spiritsCreatedByConversion || 0,
    humanDeathsToSpirit: events.humanDeathsToSpirit || 0,
    humanDeathsToMark: events.humanDeathsToMark || 0,
    spiritKillsHumanToMark: events.spiritKillsHumanToMark || 0,
    spiritTrailMarksCreated: events.spiritTrailMarksCreated || 0,
    spiritDiedIntoMark: events.spiritDiedIntoMark || 0,
    marksCreatedByDeath: events.marksCreatedByDeath || 0,
    marksCreatedBySpirit: events.marksCreatedBySpirit || 0,
    marksCleanedByBeast: events.marksCleanedByBeast || 0,
    marksDecayed: events.marksDecayed || 0,
    beastDispersals: events.beastDispersals || 0,
    beastDispersalWildCreated: events.beastDispersalWildCreated || 0,
    beastDispersalMarksCleaned: events.beastDispersalMarksCleaned || 0,
    beastDispersalSpiritsSuppressed: events.beastDispersalSpiritsSuppressed || 0,
    fieldCreated: events.fieldCreated || 0,
    fieldDecayed: events.fieldDecayed || 0,
    fieldTrampled: events.fieldTrampled || 0,
    beastRandomMoves: events.beastRandomMoves || 0,
    beastFleeMoves: events.beastFleeMoves || 0,
    beastAttractedMoves: events.beastAttractedMoves || 0,
    beastBlockedMoves: events.beastBlockedMoves || 0,
    beastStallBreakMoves: events.beastStallBreakMoves || 0,
    beastBirthsBlockedByDensity: events.beastBirthsBlockedByDensity || 0,
    beastBirthsBlockedBySoftBrake: events.beastBirthsBlockedBySoftBrake || 0,
    wildCreatedByBeast: events.wildCreatedByBeast || 0,
    wildDecayedToEmpty: events.wildDecayedToEmpty || 0,
    humanNormalMoves: events.humanNormalMoves || 0,
    prosperitySettlerDepartures: events.prosperitySettlerDepartures || 0,
    prosperitySettlerBirths: events.prosperitySettlerBirths || 0,
    crisisSettlerDepartures: events.crisisSettlerDepartures || 0,
    spiritBlockedByCoreSettlement: events.spiritBlockedByCoreSettlement || 0,
    humanRetreatsFromSpirit: events.humanRetreatsFromSpirit || 0,
    spiritSpawnsFromMark: events.spiritSpawnsFromMark || 0,
    spiritSpreadActions: events.spiritSpreadActions || 0,
    spiritSuppressedByBeast: events.spiritSuppressedByBeast || 0,
    spiritWarningFlees: events.spiritWarningFlees || 0,
    spiritSpawnBlockedByLocalDensity: events.spiritSpawnBlockedByLocalDensity || 0,
    spiritSpawnBlockedByEarlyGrace: events.spiritSpawnBlockedByEarlyGrace || 0,
    beastRelocations: events.beastRelocations || 0,
    beastDispersalRemovals: events.beastDispersalRemovals || 0,
    beastAuraSpiritCleansed: events.beastAuraSpiritCleansed || 0,
    beastAuraMarksCleaned: events.beastAuraMarksCleaned || 0,
    dormantSpiritSuppressedByBeast: events.dormantSpiritSuppressedByBeast || 0,
    activeSpiritSuppressedByBeast: events.activeSpiritSuppressedByBeast || 0,
    beastRecoveryPatchCreated: events.beastRecoveryPatchCreated || 0,
  };
}

function trackBirth(unit) {
  currentTickEvents.births[unit] += 1;
  currentTickDiagnostics.actualBirths[unit] += 1;
}

function trackDeath(unit, kind = "conflict") {
  currentTickDiagnostics.deathCandidates[unit] += 1;
  currentTickEvents.deaths[unit] += 1;
  if (kind === "natural") currentTickEvents.naturalDeaths[unit] += 1;
  else currentTickEvents.conflictDeaths[unit] += 1;
  currentTickDiagnostics.actualDeaths[unit] += 1;
}

function trackConversion(fromUnit, toUnit) {
  if (fromUnit === UNIT.HUMAN && toUnit === UNIT.SPIRIT) currentTickEvents.conversions.H_to_S += 1;
}

function buildNeighborTable() {
  const table = [];
  for (let y = 0; y < HEIGHT; y += 1) {
    const row = [];
    for (let x = 0; x < WIDTH; x += 1) {
      const neighbors = [];
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < WIDTH && ny >= 0 && ny < HEIGHT) neighbors.push({ x: nx, y: ny });
        }
      }
      row.push(neighbors);
    }
    table.push(row);
  }
  return table;
}

function buildRadiusOffsets(maxRadius) {
  const result = {};
  for (let radius = 1; radius <= maxRadius; radius += 1) {
    const offsets = [];
    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        if (Math.hypot(dx, dy) <= radius) offsets.push({ dx, dy });
      }
    }
    result[radius] = offsets;
  }
  return result;
}

function inBounds(x, y) {
  return x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT;
}

function getNeighbors(x, y) {
  return NEIGHBORS[y][x];
}

function countNeighborUnits(source, x, y) {
  const counts = { H: 0, B: 0, S: 0 };
  for (const n of getNeighbors(x, y)) {
    const unit = source[n.y][n.x].unit;
    if (unit) counts[unit] += 1;
  }
  return counts;
}

function countNeighborTerrains(source, x, y) {
  const counts = { ".": 0, F: 0, W: 0, M: 0, X: 0, "#": 0 };
  for (const n of getNeighbors(x, y)) {
    counts[source[n.y][n.x].terrain] += 1;
  }
  return counts;
}

function countLocalCellState(source, x, y) {
  const units = countNeighborUnits(source, x, y);
  const terrains = countNeighborTerrains(source, x, y);
  let emptyUnitNeighbors = 0;
  for (const n of getNeighbors(x, y)) {
    const cell = source[n.y][n.x];
    if (!cell.unit && cell.terrain !== TERRAIN.BLOCK && cell.terrain !== TERRAIN.BORDER) {
      emptyUnitNeighbors += 1;
    }
  }

  return {
    h: units.H,
    b: units.B,
    s: units.S,
    f: terrains.F,
    w: terrains.W,
    m: terrains.M,
    emptyTerrain: terrains["."],
    emptyUnitNeighbors,
    localUnitCount: units.H + units.B + units.S,
  };
}

function hasBirthRoom(local, minEmptyNeighbors = MIN_EMPTY_NEIGHBORS_FOR_BIRTH, maxLocalUnits = MAX_LOCAL_UNITS_FOR_BIRTH) {
  return local.emptyUnitNeighbors >= minEmptyNeighbors && local.localUnitCount <= maxLocalUnits;
}

function homeTerrainForUnit(unit) {
  return {
    H: TERRAIN.FIELD,
    B: TERRAIN.WILD,
    S: TERRAIN.MARK,
  }[unit];
}

function hasFrontierUnitSignal(unit, local) {
  if (unit === UNIT.HUMAN) return local.b > 0 || local.s > 0;
  if (unit === UNIT.BEAST) return local.h > 0 || local.s > 0;
  if (unit === UNIT.SPIRIT) return local.h > 0;
  return false;
}

function isUnitOnFrontier(source, x, y) {
  const unit = source[y][x].unit;
  if (!unit) return false;
  const local = countLocalCellState(source, x, y);
  if (hasFrontierUnitSignal(unit, local)) return true;
  if (local.emptyTerrain >= 2) return true;

  const homeTerrain = homeTerrainForUnit(unit);
  return getNeighbors(x, y).some((n) => {
    const terrain = source[n.y][n.x].terrain;
    return terrain !== homeTerrain && terrain !== TERRAIN.EMPTY && terrain !== TERRAIN.BLOCK;
  });
}

function hasBirthFrontierSignal(unit, local) {
  if (unit === UNIT.HUMAN) {
    return local.emptyTerrain >= 1 || local.w >= 1 || local.m >= 1 || local.b >= 1 || local.s >= 1;
  }
  if (unit === UNIT.BEAST) {
    return local.emptyTerrain >= 1 || local.f >= 1 || local.m >= 1 || local.h >= 1 || local.s >= 1;
  }
  if (unit === UNIT.SPIRIT) {
    return local.emptyTerrain >= 1 || local.f >= 1 || local.h >= 1;
  }
  return false;
}

function countWorld(source) {
  const counts = {
    units: { H: 0, B: 0, S: 0 },
    terrains: { ".": 0, F: 0, W: 0, M: 0, X: 0, "#": 0 },
  };

  for (const row of source) {
    for (const cell of row) {
      if (cell.unit) counts.units[cell.unit] += 1;
      counts.terrains[cell.terrain] += 1;
    }
  }

  return counts;
}

function countAreaTerrain(source, x, y, terrainSet) {
  let count = terrainSet.has(source[y][x].terrain) ? 1 : 0;
  for (const n of getNeighbors(x, y)) {
    if (terrainSet.has(source[n.y][n.x].terrain)) count += 1;
  }
  return count;
}

function localAverageFertility(source, x, y) {
  let total = source[y][x].fertility || 0;
  let count = 1;
  for (const n of getNeighbors(x, y)) {
    total += source[n.y][n.x].fertility || 0;
    count += 1;
  }
  return total / count;
}

function localSupportFertility(source, x, y) {
  let total = 0;
  let count = 0;
  for (const n of getNeighbors(x, y)) {
    total += source[n.y][n.x].fertility || 0;
    count += 1;
  }
  return (source[y][x].fertility || 0) + (count ? total / count : 0);
}

function cellsInRadius(x, y, radius) {
  const cells = [];
  for (const offset of RADIUS_OFFSETS[radius]) {
    const nx = x + offset.dx;
    const ny = y + offset.dy;
    if (inBounds(nx, ny)) cells.push({ x: nx, y: ny });
  }
  return cells;
}

function countUnitInRadius(source, x, y, unit, radius, limit = Infinity) {
  let count = 0;
  for (const offset of RADIUS_OFFSETS[radius]) {
    const nx = x + offset.dx;
    const ny = y + offset.dy;
    if (!inBounds(nx, ny)) continue;
    if (source[ny][nx].unit === unit) {
      count += 1;
      if (count >= limit) return count;
    }
  }
  return count;
}

function countTerrainInRadius(source, x, y, terrain, radius, limit = Infinity) {
  let count = 0;
  for (const offset of RADIUS_OFFSETS[radius]) {
    const nx = x + offset.dx;
    const ny = y + offset.dy;
    if (!inBounds(nx, ny)) continue;
    if (source[ny][nx].terrain === terrain) {
      count += 1;
      if (count >= limit) return count;
    }
  }
  return count;
}

function averageTerrainFertilityInRadius(source, x, y, terrain, radius) {
  let total = 0;
  let count = 0;
  for (const offset of RADIUS_OFFSETS[radius]) {
    const nx = x + offset.dx;
    const ny = y + offset.dy;
    if (!inBounds(nx, ny)) continue;
    const cell = source[ny][nx];
    if (cell.terrain !== terrain) continue;
    total += cell.fertility || 0;
    count += 1;
  }
  return count ? total / count : 0;
}

function countActiveSpiritNeighbors(source, x, y) {
  let count = 0;
  for (const n of getNeighbors(x, y)) {
    if (isActiveSpirit(source[n.y][n.x])) count += 1;
  }
  return count;
}

function countDormantSpiritNeighbors(source, x, y) {
  let count = 0;
  for (const n of getNeighbors(x, y)) {
    if (isDormantSpirit(source[n.y][n.x])) count += 1;
  }
  return count;
}

function humanLocalCondition(source, x, y) {
  let support = 0;
  let demand = 0;
  let markCells = 0;
  let fieldCount = 0;
  let fieldFertility = 0;
  for (const offset of RADIUS_OFFSETS[2]) {
    const nx = x + offset.dx;
    const ny = y + offset.dy;
    if (!inBounds(nx, ny)) continue;
    const cell = source[ny][nx];
    if (cell.unit === UNIT.HUMAN) demand += 2;
    if (cell.terrain === TERRAIN.FIELD) {
      support += 2 * (cell.fertility || 0);
      fieldCount += 1;
      fieldFertility += cell.fertility || 0;
    }
    if (cell.terrain === TERRAIN.MARK) {
      support -= 3;
      markCells += 1;
    }
    if (cell.unit === UNIT.SPIRIT) support -= 5;
    if (cell.terrain === TERRAIN.WILD || cell.terrain === TERRAIN.EMPTY) support += (cell.fertility || 0) * 0.35;
  }
  const safeDemand = Math.max(1, demand);
  let condition = "collapse";
  if (support >= safeDemand * 1.25) condition = "surplus";
  else if (support >= safeDemand * 0.8) condition = "balanced";
  else if (support >= safeDemand * 0.5) condition = "pressured";
  const averageFieldFertility = fieldCount ? fieldFertility / fieldCount : 0;
  if (condition === "surplus" && (fieldCount < 3 || averageFieldFertility < 2)) condition = "balanced";
  return { support, demand, condition, markCells };
}

function humanExposureClass(source, x, y) {
  const units = countNeighborUnits(source, x, y);
  const terrains = countNeighborTerrains(source, x, y);
  if (units.H >= 3 && terrains.F >= 3) return "core";
  if (units.H >= 1 || terrains.F >= 1) return "edge";
  return "isolated";
}

function canFoundSettlementHere(source, x, y) {
  const cell = source[y][x];
  if (cell.unit !== UNIT.HUMAN) return false;
  if (!isSettlerRole(cell.role)) return false;
  if (cell.terrain !== TERRAIN.WILD && cell.terrain !== TERRAIN.EMPTY) return false;
  if (cell.fertility < 3) return false;
  if (cell.terrain === TERRAIN.MARK || cell.terrain === TERRAIN.BLOCK || cell.terrain === TERRAIN.BORDER) return false;
  if (countNeighborUnits(source, x, y).S > 0) return false;
  if ((cell.age || 0) < SETTLER_MIN_AGE) return false;
  return true;
}

function trackHumanCondition(info) {
  currentTickDiagnostics.humanLocalConditions[info.condition] += 1;
  currentTickDiagnostics.totalHumanSupport += info.support;
  currentTickDiagnostics.totalHumanDemand += info.demand;
  currentTickDiagnostics.humanSupportSamples += 1;
}

function finalizeDiagnostics() {
  const samples = currentTickDiagnostics.humanSupportSamples || 0;
  currentTickDiagnostics.avgHumanSupport = samples ? Number((currentTickDiagnostics.totalHumanSupport / samples).toFixed(2)) : 0;
  currentTickDiagnostics.avgHumanDemand = samples ? Number((currentTickDiagnostics.totalHumanDemand / samples).toFixed(2)) : 0;
}

function computeLargestWildClusterSize(source) {
  const visited = Array.from({ length: HEIGHT }, () => Array.from({ length: WIDTH }, () => false));
  let largest = 0;
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      if (visited[y][x] || source[y][x].terrain !== TERRAIN.WILD) continue;
      let size = 0;
      const stack = [{ x, y }];
      visited[y][x] = true;
      while (stack.length) {
        const pos = stack.pop();
        size += 1;
        for (const n of getNeighbors(pos.x, pos.y)) {
          if (visited[n.y][n.x] || source[n.y][n.x].terrain !== TERRAIN.WILD) continue;
          visited[n.y][n.x] = true;
          stack.push(n);
        }
      }
      if (size > largest) largest = size;
    }
  }
  return largest;
}

function updateStateDiagnostics(source, includeNearbyDiagnostics = false) {
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const cell = source[y][x];
      if (isDormantSpirit(cell)) currentTickDiagnostics.dormantSpirits += 1;
      if (isActiveSpirit(cell)) currentTickDiagnostics.activeSpirits += 1;
      if (cell.unit === UNIT.HUMAN) {
        if (isSettlerRole(cell.role)) currentTickDiagnostics.activeSettlers += 1;
        if (isRestingSettlerRole(cell.role)) currentTickDiagnostics.activeRestingSettlers += 1;
        if (isProsperitySettlerRole(cell.role)) currentTickDiagnostics.activeProsperitySettlers += 1;
        if (isCrisisSettlerRole(cell.role)) currentTickDiagnostics.activeCrisisSettlers += 1;
        if (!includeNearbyDiagnostics) continue;
        const exposure = humanExposureClass(source, x, y);
        if (exposure === "core") currentTickDiagnostics.coreHumans += 1;
        else if (exposure === "edge") currentTickDiagnostics.edgeHumans += 1;
        else currentTickDiagnostics.isolatedHumans += 1;
        const adjacentTerrains = countNeighborTerrains(source, x, y);
        const adjacentUnits = countNeighborUnits(source, x, y);
        if (adjacentTerrains.M > 0) currentTickDiagnostics.humansAdjacentToMark += 1;
        if (adjacentUnits.S > 0) currentTickDiagnostics.humansAdjacentToSpirit += 1;
        if (countDormantSpiritNeighbors(source, x, y) > 0) currentTickDiagnostics.humansAdjacentToDormantSpirit += 1;
        if (countActiveSpiritNeighbors(source, x, y) > 0) currentTickDiagnostics.humansAdjacentToActiveSpirit += 1;
        for (const offset of RADIUS_OFFSETS[2]) {
          const nx = x + offset.dx;
          const ny = y + offset.dy;
          if (!inBounds(nx, ny) || (nx === x && ny === y)) continue;
          const nearby = source[ny][nx];
          if (nearby.terrain === TERRAIN.MARK) currentTickDiagnostics.markCellsNearHumans += 1;
          if (nearby.unit === UNIT.SPIRIT) currentTickDiagnostics.spiritCellsNearHumans += 1;
        }
      }
      if (cell.unit === UNIT.BEAST) currentTickDiagnostics.totalBeasts += 1;
      if (cell.terrain === TERRAIN.WILD) currentTickDiagnostics.totalWild += 1;
      if (includeNearbyDiagnostics && cell.terrain === TERRAIN.MARK && countNeighborUnits(source, x, y).B > 0) {
        currentTickDiagnostics.markCellsWithNearbyBeast += 1;
      }
      if (includeNearbyDiagnostics && cell.unit === UNIT.BEAST) {
        const b = countNeighborUnits(source, x, y).B;
        if (b === 0) currentTickDiagnostics.beastNeighborStats.isolated += 1;
        else if (b <= 2) currentTickDiagnostics.beastNeighborStats.smallGroup += 1;
        else currentTickDiagnostics.beastNeighborStats.clustered += 1;
        const adjacent = countNeighborUnits(source, x, y);
        const terrains = countNeighborTerrains(source, x, y);
        if (adjacent.S > 0) currentTickDiagnostics.beastsAdjacentToSpirit += 1;
        if (terrains.M > 0) currentTickDiagnostics.beastsAdjacentToMark += 1;
      }
      if (includeNearbyDiagnostics && cell.terrain === TERRAIN.WILD) {
        if (countNeighborTerrains(source, x, y).W <= 2) currentTickDiagnostics.scatteredWildCells += 1;
      }
    }
  }
  if (includeNearbyDiagnostics) {
    currentTickDiagnostics.largestWildClusterSize = computeLargestWildClusterSize(source);
  }
}

function createMarkAt(target, x, y, fertilityDrop = 0, countAsDeath = false) {
  const cell = target[y][x];
  if (cell.terrain === TERRAIN.BLOCK) return;
  cell.terrain = TERRAIN.MARK;
  cell.terrainAge = 0;
  cell.fertility = clampFertility((cell.fertility || 0) - fertilityDrop);
  if (countAsDeath) currentTickEvents.marksCreatedByDeath += 1;
}

function createSpiritFromDeathAt(target, x, y, deadUnit) {
  const cell = target[y][x];
  if (cell.terrain === TERRAIN.BLOCK) return;
  cell.unit = UNIT.SPIRIT;
  cell.age = 0;
  cell.role = "manifestation";
  cell.maxAge = spiritMaxAge();
  currentTickEvents.spiritsCreatedByDeath += 1;
  if (deadUnit === UNIT.HUMAN) currentTickEvents.spiritsCreatedByHumanDeath += 1;
  if (deadUnit === UNIT.BEAST) currentTickEvents.spiritsCreatedByBeastDeath += 1;
}

function resolveHumanDeathAt(target, x, y, cause = "natural") {
  let spiritChance = cause === "spirit" ? 0.25 : cause === "natural" ? 0.05 : 0.10;
  if (isNoSpiritControlMode()) spiritChance = 0;
  if (countUnitInRadius(target, x, y, UNIT.SPIRIT, 4, 3) >= 3) {
    spiritChance = 0;
    currentTickEvents.spiritSpawnBlockedByLocalDensity += 1;
  }
  if (tick < 10 && cause !== "spirit") {
    spiritChance = 0;
    currentTickEvents.spiritSpawnBlockedByEarlyGrace += 1;
  }
  if (Math.random() < spiritChance) {
    createSpiritFromDeathAt(target, x, y, UNIT.HUMAN);
    currentTickEvents.humanDeathsToSpirit += 1;
  } else {
    createMarkAt(target, x, y, cause === "spirit" ? 1 : 0);
    currentTickEvents.humanDeathsToMark += 1;
  }
}

function beastRelocationRank(cell) {
  if (cell.terrain === TERRAIN.WILD && cell.fertility >= 4) return 1;
  if (cell.terrain === TERRAIN.WILD && cell.fertility >= 3) return 2;
  if (cell.terrain === TERRAIN.EMPTY && cell.fertility >= 4) return 3;
  if (cell.terrain === TERRAIN.EMPTY && cell.fertility >= 3) return 4;
  return Infinity;
}

function findBeastRelocationTarget(source, x, y) {
  let best = null;
  for (const offset of RADIUS_OFFSETS[8]) {
    const nx = x + offset.dx;
    const ny = y + offset.dy;
    if (!inBounds(nx, ny) || (nx === x && ny === y)) continue;
    const cell = source[ny][nx];
    if (cell.unit || cell.terrain === TERRAIN.BLOCK || cell.terrain === TERRAIN.BORDER || cell.terrain === TERRAIN.MARK) continue;
    const rank = beastRelocationRank(cell);
    if (!Number.isFinite(rank)) continue;
    const units = countNeighborUnits(source, nx, ny);
    if (units.H >= 2 || units.B >= 2) continue;
    const distance = Math.hypot(offset.dx, offset.dy);
    const wildClusterBonus = countTerrainInRadius(source, nx, ny, TERRAIN.WILD, 2);
    const score = rank * 100 + units.H * 30 + units.B * 20 - wildClusterBonus * 6 - distance;
    if (!best || score < best.score) best = { x: nx, y: ny, score };
  }
  return best;
}

function tryCreateSmallWildRecoveryPatch(target, source, x, y) {
  if (countTerrainInRadius(target, x, y, TERRAIN.WILD, 2) >= 7) return false;
  const candidates = getNeighbors(x, y).filter((n) => {
    const sourceCell = source[n.y][n.x];
    const targetCell = target[n.y][n.x];
    if (targetCell.unit || targetCell.terrain === TERRAIN.BLOCK || targetCell.terrain === TERRAIN.BORDER) return false;
    return sourceCell.terrain === TERRAIN.EMPTY || sourceCell.terrain === TERRAIN.MARK;
  });
  candidates.sort((a, b) => {
    const aWild = countNeighborTerrains(source, a.x, a.y).W;
    const bWild = countNeighborTerrains(source, b.x, b.y).W;
    if (bWild !== aWild) return bWild - aWild;
    const aMark = source[a.y][a.x].terrain === TERRAIN.MARK ? 1 : 0;
    const bMark = source[b.y][b.x].terrain === TERRAIN.MARK ? 1 : 0;
    return bMark - aMark;
  });
  for (const candidate of candidates) {
    const sourceCell = source[candidate.y][candidate.x];
    const chance = sourceCell.terrain === TERRAIN.MARK ? 0.35 : 0.18;
    if (Math.random() >= chance) continue;
    const targetCell = target[candidate.y][candidate.x];
    targetCell.terrain = TERRAIN.WILD;
    targetCell.terrainAge = 0;
    targetCell.fertility = clampFertility((targetCell.fertility || 0) + 1);
    currentTickEvents.beastRecoveryPatchCreated += 1;
    currentTickEvents.wildCreatedByBeast += 1;
    return true;
  }
  return false;
}

function disperseBeastAt(target, source, x, y) {
  const sourceCell = source[y][x];
  const cell = target[y][x];
  cell.unit = null;
  cell.age = 0;
  cell.role = null;
  cell.maxAge = null;
  if (cell.terrain !== TERRAIN.BLOCK) {
    cell.terrain = TERRAIN.WILD;
    cell.terrainAge = 0;
    cell.fertility = 4;
    currentTickEvents.beastDispersalWildCreated += 1;
  }
  currentTickEvents.beastDispersals += 1;
  for (const n of getNeighbors(x, y)) {
    const targetCell = target[n.y][n.x];
    const sourceCell = source[n.y][n.x];
    if (targetCell.terrain === TERRAIN.BLOCK) continue;
    if (sourceCell.terrain === TERRAIN.MARK && Math.random() < 0.5) {
      targetCell.terrain = TERRAIN.WILD;
      targetCell.terrainAge = 0;
      targetCell.fertility = clampFertility(targetCell.fertility + 1);
      currentTickEvents.beastDispersalMarksCleaned += 1;
      currentTickEvents.marksCleanedByBeast += 1;
      tryCreateSmallWildRecoveryPatch(target, source, n.x, n.y);
    }
    if (sourceCell.unit === UNIT.SPIRIT && Math.random() < 0.7) {
      targetCell.unit = null;
      targetCell.age = 0;
      targetCell.role = null;
      targetCell.maxAge = null;
      targetCell.terrain = TERRAIN.WILD;
      targetCell.terrainAge = 0;
      targetCell.fertility = clampFertility(targetCell.fertility + 1);
      currentTickEvents.beastDispersalSpiritsSuppressed += 1;
      currentTickEvents.spiritSuppressedByBeast += 1;
      tryCreateSmallWildRecoveryPatch(target, source, n.x, n.y);
    }
  }
  const relocation = findBeastRelocationTarget(source, x, y);
  if (relocation && !target[relocation.y][relocation.x].unit) {
    const relocated = target[relocation.y][relocation.x];
    relocated.unit = UNIT.BEAST;
    relocated.age = sourceCell.age || 0;
    relocated.role = "pack";
    relocated.maxAge = null;
    currentTickEvents.beastRelocations += 1;
  } else {
    currentTickEvents.beastDispersalRemovals += 1;
  }
}

function driftToward(value, target, amount) {
  if (value < target) return Math.min(target, value + amount);
  if (value > target) return Math.max(target, value - amount);
  return value;
}

function hasHumanInArea(source, x, y) {
  if (source[y][x].unit === UNIT.HUMAN) return true;
  return getNeighbors(x, y).some((n) => source[n.y][n.x].unit === UNIT.HUMAN);
}

function hasAbandonedFieldNearby(source, x, y) {
  return getNeighbors(x, y).some((n) => {
    const cell = source[n.y][n.x];
    return cell.terrain === TERRAIN.FIELD && !hasHumanInArea(source, n.x, n.y);
  });
}

function calculateFertilityStats(source) {
  const totals = { ".": 0, F: 0, W: 0, M: 0 };
  const counts = { ".": 0, F: 0, W: 0, M: 0 };
  const levels = { "0": 0, "1": 0, "2": 0, "3": 0, "4": 0 };

  for (const row of source) {
    for (const cell of row) {
      const fertility = clampFertility(cell.fertility || 0);
      levels[String(fertility)] += 1;
      if (cell.terrain in totals) {
        totals[cell.terrain] += fertility;
        counts[cell.terrain] += 1;
      }
    }
  }

  return {
    levels,
    avgByTerrain: {
      ".": counts["."] ? Number((totals["."] / counts["."]).toFixed(2)) : 0,
      F: counts.F ? Number((totals.F / counts.F).toFixed(2)) : 0,
      W: counts.W ? Number((totals.W / counts.W).toFixed(2)) : 0,
      M: counts.M ? Number((totals.M / counts.M).toFixed(2)) : 0,
    },
  };
}

function hasHumanAdjacent(source, x, y) {
  return countNeighborUnits(source, x, y).H > 0;
}

function adjacentToHuman(source, x, y) {
  return getNeighbors(x, y).some((n) => source[n.y][n.x].unit === UNIT.HUMAN);
}

function findNearestRot(source, x, y, radius) {
  let best = null;
  let bestDistance = Infinity;
  for (const offset of RADIUS_OFFSETS[radius]) {
    const nx = x + offset.dx;
    const ny = y + offset.dy;
    if (!inBounds(nx, ny)) continue;
    const cell = source[ny][nx];
    if (cell.unit !== UNIT.SPIRIT && !(cell.terrain === TERRAIN.MARK && countNeighborTerrains(source, nx, ny).M >= 2)) continue;
    const distance = Math.hypot(offset.dx, offset.dy);
    if (distance < bestDistance) {
      best = { x: nx, y: ny };
      bestDistance = distance;
    }
  }
  return best;
}

function cachedNearestRot(source, x, y, radius) {
  if (!movementRotCache) return findNearestRot(source, x, y, radius);
  const key = `${x},${y},${radius}`;
  if (!movementRotCache.has(key)) movementRotCache.set(key, findNearestRot(source, x, y, radius));
  return movementRotCache.get(key);
}

function settlerReturnRole(role) {
  return isProsperitySettlerRole(role) ? "settler_seeking_prosperity" : "settler_seeking_crisis";
}

function settlerTargetRank(cell) {
  if (cell.terrain === TERRAIN.WILD && cell.fertility >= 4) return 1;
  if (cell.terrain === TERRAIN.WILD && cell.fertility >= 3) return 2;
  if (cell.terrain === TERRAIN.EMPTY && cell.fertility >= 4) return 3;
  if (cell.terrain === TERRAIN.EMPTY && cell.fertility >= 3) return 4;
  if (cell.terrain === TERRAIN.EMPTY && cell.fertility >= 2) return 5;
  return Infinity;
}

function isValidSettlerStep(source, x, y, allowMark = false) {
  const cell = source[y][x];
  if (cell.unit || cell.terrain === TERRAIN.BLOCK || cell.terrain === TERRAIN.BORDER) return false;
  if (cell.terrain === TERRAIN.MARK && !allowMark) return false;
  return true;
}

function findSettlerTarget(source, x, y) {
  let best = null;
  for (const offset of RADIUS_OFFSETS[8]) {
    const nx = x + offset.dx;
    const ny = y + offset.dy;
    if (!inBounds(nx, ny) || (nx === x && ny === y)) continue;
    const cell = source[ny][nx];
    if (cell.unit || cell.terrain === TERRAIN.BLOCK || cell.terrain === TERRAIN.BORDER || cell.terrain === TERRAIN.MARK) continue;
    const rank = settlerTargetRank(cell);
    if (!Number.isFinite(rank)) continue;
    const units = countNeighborUnits(source, nx, ny);
    const danger = units.S * 100 + Math.max(0, units.B - 1) * 8;
    const distance = Math.hypot(offset.dx, offset.dy);
    const score = rank * 100 + danger + distance;
    if (!best || score < best.score) best = { x: nx, y: ny, score };
  }
  return best;
}

function chooseStepTowardTarget(source, x, y, target, allowMark = false) {
  const currentDistance = Math.hypot(x - target.x, y - target.y);
  let bestScore = Infinity;
  let bestTargets = [];
  for (const n of getNeighbors(x, y)) {
    if (!isValidSettlerStep(source, n.x, n.y, allowMark)) continue;
    const distance = Math.hypot(n.x - target.x, n.y - target.y);
    if (distance > currentDistance && !allowMark) continue;
    const cell = source[n.y][n.x];
    const units = countNeighborUnits(source, n.x, n.y);
    const terrainScore = ({ W: 0, ".": 2, F: 6, M: 30 }[cell.terrain] ?? 20);
    const danger = units.S * 100 + Math.max(0, units.B - 1) * 10;
    const score = distance * 10 + terrainScore + danger - (cell.fertility || 0);
    if (score < bestScore) {
      bestScore = score;
      bestTargets = [n];
    } else if (score === bestScore) {
      bestTargets.push(n);
    }
  }
  if (!bestTargets.length) return null;
  return bestTargets[Math.floor(Math.random() * bestTargets.length)];
}

function chooseSettlerExplorationMove(source, x, y) {
  const current = source[y][x];
  let bestScore = -Infinity;
  let bestTargets = [];
  for (const n of getNeighbors(x, y)) {
    if (!isValidSettlerStep(source, n.x, n.y, false)) continue;
    const cell = source[n.y][n.x];
    if (cell.terrain !== TERRAIN.WILD && cell.terrain !== TERRAIN.EMPTY && cell.terrain !== TERRAIN.FIELD) continue;
    const units = countNeighborUnits(source, n.x, n.y);
    const terrains = countNeighborTerrains(source, n.x, n.y);
    const score = (cell.fertility || 0) * 10 + ({ W: 12, ".": 8, F: 2 }[cell.terrain] ?? 0) -
      units.S * 100 -
      Math.max(0, units.B - 1) * 8 -
      units.H * 2 -
      terrains.M * 4 +
      Math.random();
    if (score > bestScore) {
      bestScore = score;
      bestTargets = [n];
    } else if (score === bestScore) {
      bestTargets.push(n);
    }
  }
  if (!bestTargets.length) return null;
  const target = bestTargets[Math.floor(Math.random() * bestTargets.length)];
  if ((source[target.y][target.x].fertility || 0) < (current.fertility || 0) && bestScore < 0) return null;
  return target;
}

function chooseSettlerMove(source, x, y) {
  const role = source[y][x].role || "normal";
  const cell = source[y][x];
  if (canFoundSettlementHere(source, x, y)) {
    currentTickDiagnostics.activeSettlersWithFoundingOpportunity += 1;
    return { x, y };
  }

  if (isRestingSettlerRole(role)) {
    if (tick % 3 !== 0) {
      currentTickEvents.settlerRestTicks += 1;
      return { x, y };
    }
    currentTickEvents.settlersLeavingRest += 1;
    return { x, y, role: settlerReturnRole(role) };
  }

  const target = findSettlerTarget(source, x, y);
  if (target) {
    const step = chooseStepTowardTarget(source, x, y, target, false) || chooseStepTowardTarget(source, x, y, target, true);
    if (step) {
      currentTickDiagnostics.activeSettlersWithValidMove += 1;
      return step;
    }
    currentTickEvents.settlerBlockedByNoValidStep += 1;
    currentTickDiagnostics.activeSettlersBlocked += 1;
    return { x, y };
  }

  currentTickEvents.settlerBlockedByNoTarget += 1;
  const exploration = chooseSettlerExplorationMove(source, x, y);
  if (exploration) {
    currentTickEvents.settlerForcedExplorationMoves += 1;
    currentTickDiagnostics.activeSettlersWithValidMove += 1;
    return exploration;
  }

  if (cell.terrain === TERRAIN.EMPTY && cell.fertility >= 1 && cell.fertility <= 2) {
    currentTickEvents.settlerRestStops += 1;
    return { x, y, role: isProsperitySettlerRole(role) ? "settler_resting_prosperity" : "settler_resting_crisis" };
  }

  currentTickEvents.settlerBlockedByNoValidStep += 1;
  currentTickDiagnostics.activeSettlersBlocked += 1;
  return { x, y };
}

function sameSpeciesNeighborsAtTarget(source, unit, fromX, fromY, toX, toY) {
  let count = 0;
  for (const n of getNeighbors(toX, toY)) {
    if (n.x === fromX && n.y === fromY) continue;
    if (source[n.y][n.x].unit === unit) count += 1;
  }
  return count;
}

function isSafeScoutTarget(source, unit, fromX, fromY, toX, toY) {
  const cell = source[toY][toX];
  if (cell.unit || cell.terrain === TERRAIN.BLOCK || cell.terrain === TERRAIN.BORDER) return false;
  const threshold = Number(overcrowdingInput.value) || 6;
  return sameSpeciesNeighborsAtTarget(source, unit, fromX, fromY, toX, toY) < threshold - 1;
}

function chooseScoutMove(source, unit, x, y) {
  const preferences = {
    H: [TERRAIN.EMPTY, TERRAIN.WILD],
    B: [TERRAIN.EMPTY, TERRAIN.WILD],
    S: [TERRAIN.EMPTY, TERRAIN.MARK],
  }[unit];

  for (const terrain of preferences) {
    const targets = getNeighbors(x, y).filter((n) =>
      source[n.y][n.x].terrain === terrain && isSafeScoutTarget(source, unit, x, y, n.x, n.y)
    );
    if (targets.length > 0) return targets[Math.floor(Math.random() * targets.length)];
  }

  return { x, y };
}

function movementScore(source, unit, fromX, fromY, toX, toY) {
  const terrain = source[toY][toX].terrain;
  if (terrain === TERRAIN.BLOCK || terrain === TERRAIN.BORDER) return -1;
  const threshold = Number(overcrowdingInput.value) || 6;
  if (sameSpeciesNeighborsAtTarget(source, unit, fromX, fromY, toX, toY) >= threshold - 1) return -1;
  const targetUnits = countNeighborUnits(source, toX, toY);
  const currentUnits = countNeighborUnits(source, fromX, fromY);
  const role = source[fromY][fromX].role || "normal";
  const fertility = source[toY][toX].fertility || 0;

  if (unit === UNIT.HUMAN) {
    if (terrain === TERRAIN.MARK) return -1;
    if (targetUnits.S >= 1 && targetUnits.H < 1) return -1;
    if (isSettlerRole(role)) {
      if (targetUnits.S > 0 || countNeighborTerrains(source, toX, toY).M > 0) return -1;
      let score = ({ W: 30, ".": 24, F: 4 }[terrain] ?? -1);
      if (score < 0) return -1;
      score += fertility * 20;
      if (targetUnits.B >= 2) score -= 18;
      return score;
    }
    let beastScore = 0;
    if (targetUnits.B >= 1) {
      if (currentUnits.H <= 1) beastScore -= 20;
      else if (currentUnits.H === 2) beastScore += 22;
      else beastScore += 28;
      if (source[fromY][fromX].terrain === TERRAIN.FIELD && terrain !== TERRAIN.FIELD) beastScore += 8;
      if (terrain === TERRAIN.WILD) beastScore += 16;
    }
    if (terrain !== TERRAIN.FIELD && source[fromY][fromX].terrain === TERRAIN.FIELD && !(targetUnits.B >= 1 && currentUnits.H >= 2)) return -1;
    return (({ F: 30, ".": 20, W: 10 }[terrain] ?? -1) + beastScore);
  }

  if (unit === UNIT.BEAST) {
    if (currentUnits.H >= 2 && targetUnits.H >= currentUnits.H) return -1;
    if (currentUnits.H >= 2) return (({ W: 35, ".": 30, M: 24, F: 6 }[terrain] ?? -1) + fertility * 3) - targetUnits.H * 15;
    const visibleRot = cachedNearestRot(source, fromX, fromY, 4);
    if (visibleRot && Math.random() < (source[visibleRot.y][visibleRot.x].unit === UNIT.SPIRIT ? 0.5 : 0.4)) {
      const distance = Math.hypot(toX - visibleRot.x, toY - visibleRot.y);
      return 100 - distance * 12 + ({ M: 20, W: 8, ".": 6, F: 1 }[terrain] ?? -1);
    }
    const beastNeighbors = sameSpeciesNeighborsAtTarget(source, unit, fromX, fromY, toX, toY);
    if (beastNeighbors >= 3) return -1;
    return ({ W: 30, ".": 30, M: 12, F: 8 }[terrain] ?? -1) + Math.random() * 12 - beastNeighbors * 8;
  }

  if (unit === UNIT.SPIRIT) {
    if (isDormantSpirit(source[fromY][fromX])) return -1;
    if (targetUnits.B >= 2) return -1;
    const humanBonus = adjacentToHuman(source, toX, toY) ? 50 : 0;
    const isolatedHumanBonus = targetUnits.H === 1 ? 30 : 0;
    const markEdgeBonus = countNeighborTerrains(source, toX, toY).M > 0 && terrain !== TERRAIN.MARK ? 25 : 0;
    return humanBonus + isolatedHumanBonus + markEdgeBonus + ({ F: 35, ".": 20, W: 12, M: 8 }[terrain] ?? -1);
  }

  return -1;
}

function chooseMove(source, x, y) {
  const unit = source[y][x].unit;
  const role = source[y][x].role || "normal";
  if (unit === UNIT.SPIRIT && isDormantSpirit(source[y][x])) {
    return { x, y };
  }
  if (unit === UNIT.HUMAN && isSettlerRole(role)) {
    return chooseSettlerMove(source, x, y);
  }
  const local = countLocalCellState(source, x, y);
  const onFrontier = isUnitOnFrontier(source, x, y);
  const visibleBeastForHunt = unit === UNIT.HUMAN && local.h >= 2 && countUnitInRadius(source, x, y, UNIT.BEAST, 2, 1) > 0;
  if (unit === UNIT.HUMAN && source[y][x].terrain === TERRAIN.FIELD && local.h >= 1 && !onFrontier && !visibleBeastForHunt) {
    if (Math.random() < SCOUT_CHANCE) return chooseScoutMove(source, unit, x, y);
    return { x, y };
  }
  if (unit === UNIT.SPIRIT && source[y][x].terrain === TERRAIN.MARK && local.s >= 1 && !onFrontier) {
    if (Math.random() < SCOUT_CHANCE) return chooseScoutMove(source, unit, x, y);
    return { x, y };
  }

  let bestScore = -1;
  let bestTargets = [];
  for (const n of getNeighbors(x, y)) {
    if (source[n.y][n.x].unit) continue;
    const score = movementScore(source, unit, x, y, n.x, n.y);
    if (score > bestScore) {
      bestScore = score;
      bestTargets = [n];
    } else if (score === bestScore && score >= 0) {
      bestTargets.push(n);
    }
  }

  if (bestScore < 0 || bestTargets.length === 0) return { x, y };
  return bestTargets[Math.floor(Math.random() * bestTargets.length)];
}

// movement
function planMovements(source) {
  if (!movementToggle.checked) return cloneWorld(source);

  movementRotCache = new Map();
  const plans = [];
  const targetMap = new Map();
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const unit = source[y][x].unit;
      if (!unit) continue;
      if (isUnitOnFrontier(source, x, y)) currentTickDiagnostics.frontierUnits[unit] += 1;
      const target = chooseMove(source, x, y);
      if (target.x !== x || target.y !== y) currentTickDiagnostics.moveCandidates[unit] += 1;
      const plan = {
        fromX: x,
        fromY: y,
        toX: target.x,
        toY: target.y,
        unit,
        age: source[y][x].age || 0,
        role: target.role || source[y][x].role || "normal",
        originalRole: source[y][x].role || "normal",
        moveMode: null,
      };
      if (unit === UNIT.BEAST && (target.x !== x || target.y !== y)) {
        const localUnits = countNeighborUnits(source, x, y);
        if (localUnits.H >= 2) plan.moveMode = "beastFlee";
        else if (cachedNearestRot(source, x, y, 4)) plan.moveMode = "beastAttracted";
        else plan.moveMode = "beastRandom";
      }
      plans.push(plan);
      const key = `${target.x},${target.y}`;
      if (!targetMap.has(key)) targetMap.set(key, []);
      targetMap.get(key).push(plan);
    }
  }

  const next = cloneWorld(source);
  for (const row of next) {
    for (const cell of row) cell.unit = null;
  }

  for (const plan of plans) {
    const key = `${plan.toX},${plan.toY}`;
    const contested = targetMap.get(key).length > 1;
    const finalX = contested ? plan.fromX : plan.toX;
    const finalY = contested ? plan.fromY : plan.toY;
    const didMove = finalX !== plan.fromX || finalY !== plan.fromY;
    if (didMove) currentTickDiagnostics.actualMoves[plan.unit] += 1;
    if (didMove && plan.unit === UNIT.SPIRIT && !isDormantSpirit(source[plan.fromY][plan.fromX]) && next[plan.fromY][plan.fromX].terrain !== TERRAIN.BLOCK) {
      next[plan.fromY][plan.fromX].terrain = TERRAIN.MARK;
      next[plan.fromY][plan.fromX].terrainAge = 0;
      currentTickEvents.spiritTrailMarksCreated += 1;
      currentTickEvents.marksCreatedBySpirit += 1;
    }
    if (didMove && plan.unit === UNIT.BEAST) {
      if (plan.moveMode === "beastFlee") currentTickEvents.beastFleeMoves += 1;
      else if (plan.moveMode === "beastAttracted") currentTickEvents.beastAttractedMoves += 1;
      else currentTickEvents.beastRandomMoves += 1;
    }
    if (didMove && plan.unit === UNIT.HUMAN) {
      if (isSettlerRole(plan.role)) currentTickEvents.settlerMoves += 1;
      else currentTickEvents.humanNormalMoves += 1;
    }
    if (!didMove && (plan.toX !== plan.fromX || plan.toY !== plan.fromY)) {
      if (plan.unit === UNIT.BEAST) currentTickEvents.beastBlockedMoves += 1;
      if (plan.unit === UNIT.HUMAN && isSettlerRole(plan.role)) {
        currentTickEvents.settlerBlockedByOccupied += 1;
        currentTickDiagnostics.activeSettlersBlocked += 1;
      }
    }
    next[finalY][finalX].unit = plan.unit;
    next[finalY][finalX].age = plan.age;
    next[finalY][finalX].role = plan.role;
    next[finalY][finalX].maxAge = source[plan.fromY][plan.fromX].maxAge || null;
  }

  movementRotCache = null;
  return next;
}

// terrain rewrite
function applyTerrainRewrite(source) {
  const next = cloneWorld(source);
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const cell = next[y][x];
      if (cell.terrain === TERRAIN.BLOCK) continue;
      if (!cell.unit) continue;
      const units = countNeighborUnits(source, x, y);

      const makeField = () => {
        if (cell.terrain === TERRAIN.FIELD || cell.terrain === TERRAIN.MARK || cell.terrain === TERRAIN.BLOCK || cell.terrain === TERRAIN.BORDER) return false;
        if (cell.fertility <= 1) return false;
        cell.terrain = TERRAIN.FIELD;
        cell.terrainAge = 0;
        cell.fertility = cell.fertility === 2 ? 1 : clampFertility(cell.fertility - 1);
        currentTickEvents.fieldCreated += 1;
        return true;
      };

      if (cell.unit === UNIT.HUMAN) {
        const isSettler = isSettlerRole(cell.role);
        if (isSettler && canFoundSettlementHere(source, x, y)) {
          if (makeField()) {
            cell.role = "normal";
            currentTickEvents.settlementFoundings += 1;
            const seedTargets = getNeighbors(x, y).filter((n) => {
              const neighbor = next[n.y][n.x];
              return !neighbor.unit &&
                (neighbor.terrain === TERRAIN.EMPTY || neighbor.terrain === TERRAIN.WILD) &&
                neighbor.fertility >= 2 &&
                countNeighborUnits(source, n.x, n.y).S === 0;
            });
            let seeded = 0;
            for (const seedTarget of seedTargets) {
              if (seeded >= 2) break;
              if (Math.random() < 0.6) {
                const seedCell = next[seedTarget.y][seedTarget.x];
                seedCell.terrain = TERRAIN.FIELD;
                seedCell.terrainAge = 0;
                seedCell.fertility = Math.max(clampFertility(seedCell.fertility - 1), 1);
                currentTickEvents.fieldCreated += 1;
                seeded += 1;
              }
            }
          }
        } else if (!isSettler && (cell.terrain === TERRAIN.EMPTY || cell.terrain === TERRAIN.WILD)) {
          makeField();
        }
      }

      if (cell.unit === UNIT.BEAST) {
        if (cell.terrain === TERRAIN.MARK) {
          cell.terrain = TERRAIN.WILD;
          cell.terrainAge = 0;
          cell.fertility = clampFertility(cell.fertility + 2);
          currentTickEvents.marksCleanedByBeast += 1;
          tryCreateSmallWildRecoveryPatch(next, source, x, y);
        } else if (cell.terrain === TERRAIN.FIELD && Math.random() < BEAST_TRAMPLE_FIELD_CHANCE) {
          cell.terrain = TERRAIN.WILD;
          cell.terrainAge = 0;
          cell.fertility = clampFertility(cell.fertility + 1);
          currentTickEvents.fieldTrampled += 1;
        } else if (cell.terrain === TERRAIN.EMPTY || cell.terrain === TERRAIN.WILD) {
          if (Math.random() < BEAST_RESTORE_CHANCE) {
            cell.fertility = clampFertility(cell.fertility + 1);
          }
          if (cell.terrain === TERRAIN.EMPTY) {
            const wildChance = cell.fertility >= 4 ? 0.05 : cell.fertility >= 3 ? 0.015 : 0;
            if (Math.random() < wildChance) {
              cell.terrain = TERRAIN.WILD;
              cell.terrainAge = 0;
              currentTickEvents.wildCreatedByBeast += 1;
            }
          }
        }
      }

      // V0.7.1: Spirit leaves MARK when it moves away or dies, not merely by standing still.
    }
  }
  return next;
}

function applyPrimaryConflict(source) {
  const next = cloneWorld(source);
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const cell = source[y][x];
      if (!cell.unit) continue;
      const units = countNeighborUnits(source, x, y);
      const terrains = countNeighborTerrains(source, x, y);

      if (cell.unit === UNIT.BEAST && units.H >= 3) {
        disperseBeastAt(next, source, x, y);
      }

      if (cell.unit === UNIT.BEAST && units.H >= 2 && units.H < 3 && !hasBeastEscapeCell(source, x, y, units.H) && Math.random() < 0.35) {
        disperseBeastAt(next, source, x, y);
      }

      if (cell.unit === UNIT.SPIRIT && units.B >= 2) {
        next[y][x].unit = null;
        next[y][x].age = 0;
        next[y][x].role = null;
        next[y][x].maxAge = null;
        if (isDormantSpirit(cell)) {
          next[y][x].terrain = TERRAIN.WILD;
          next[y][x].terrainAge = 0;
          next[y][x].fertility = clampFertility(next[y][x].fertility + 1);
          currentTickEvents.dormantSpiritSuppressedByBeast += 1;
        } else {
          createMarkAt(next, x, y, 0);
          currentTickEvents.spiritDiedIntoMark += 1;
          currentTickEvents.activeSpiritSuppressedByBeast += 1;
        }
        trackDeath(UNIT.SPIRIT, "conflict");
        currentTickEvents.spiritDeaths.S += 1;
        currentTickEvents.spiritSuppressedByBeast += 1;
      }
    }
  }
  return next;
}

function applyIsolationDeath(source) {
  const next = cloneWorld(source);
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const cell = source[y][x];
      if (!cell.unit) continue;
      const units = countNeighborUnits(source, x, y);

      if (cell.unit === UNIT.HUMAN && units.H === 0 && countAreaTerrain(source, x, y, new Set([TERRAIN.FIELD])) === 0 && cell.fertility < 3) {
        next[y][x].unit = null;
        next[y][x].role = null;
        next[y][x].age = 0;
        trackDeath(UNIT.HUMAN, "conflict");
        resolveHumanDeathAt(next, x, y, "conflict");
      }

      if (cell.unit === UNIT.BEAST && units.B === 0 && countAreaTerrain(source, x, y, new Set([TERRAIN.WILD, TERRAIN.FIELD, TERRAIN.MARK])) === 0) {
        disperseBeastAt(next, source, x, y);
      }

      // V0.7.1 Spirit is an active short-lived wave and does not need MARK support to exist.
    }
  }
  return next;
}

function applyOvercrowdingDeath(source) {
  const threshold = Number(overcrowdingInput.value) || 6;
  const next = cloneWorld(source);
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const unit = source[y][x].unit;
      if (!unit) continue;
      const units = countNeighborUnits(source, x, y);
      const terrains = countNeighborTerrains(source, x, y);
      const isGenerallyCrowded = units[unit] >= threshold;
      const isBeastCrowdedWithoutTargets = unit === UNIT.BEAST && units.B >= 5 && terrains.F === 0 && terrains.M === 0;
      const isSpiritCrowdedWithoutTargets = unit === UNIT.SPIRIT && units.S >= 5 && units.H === 0 && terrains.F === 0;
      if (isGenerallyCrowded || isBeastCrowdedWithoutTargets || isSpiritCrowdedWithoutTargets) {
        next[y][x].unit = null;
        next[y][x].role = null;
        next[y][x].age = 0;
        if (unit === UNIT.HUMAN) resolveHumanDeathAt(next, x, y, "conflict");
        if (unit === UNIT.HUMAN) trackDeath(unit, "conflict");
        else if (unit === UNIT.BEAST) disperseBeastAt(next, source, x, y);
        else {
          trackDeath(unit, "conflict");
          createMarkAt(next, x, y, 0);
          currentTickEvents.spiritDeaths.S += 1;
          currentTickEvents.spiritDiedIntoMark += 1;
        }
      }
    }
  }
  return next;
}

// conflict, conversion, isolation death, and overcrowding death
function applyConflict(source) {
  const conflictWorld = applyPrimaryConflict(source);
  const isolationWorld = applyIsolationDeath(conflictWorld);
  return applyOvercrowdingDeath(isolationWorld);
}

function applyBeastAuraCleansing(source) {
  const next = cloneWorld(source);
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const cell = source[y][x];
      if (cell.unit !== UNIT.BEAST) continue;
      const spiritTargets = getNeighbors(x, y).filter((n) => source[n.y][n.x].unit === UNIT.SPIRIT);
      if (spiritTargets.length > 0) {
        const target = spiritTargets[Math.floor(Math.random() * spiritTargets.length)];
        const sourceSpirit = source[target.y][target.x];
        const targetSpirit = next[target.y][target.x];
        const dormant = isDormantSpirit(sourceSpirit);
        const removeChance = dormant ? 0.7 : 0.35;
        if (!dormant) targetSpirit.age = (targetSpirit.age || 0) + 2;
        if (Math.random() < removeChance) {
          targetSpirit.unit = null;
          targetSpirit.age = 0;
          targetSpirit.role = null;
          targetSpirit.maxAge = null;
          targetSpirit.terrain = TERRAIN.WILD;
          targetSpirit.terrainAge = 0;
          targetSpirit.fertility = clampFertility(targetSpirit.fertility + 1);
          currentTickEvents.spiritSuppressedByBeast += 1;
          currentTickEvents.beastAuraSpiritCleansed += 1;
          if (dormant) currentTickEvents.dormantSpiritSuppressedByBeast += 1;
          else currentTickEvents.activeSpiritSuppressedByBeast += 1;
          tryCreateSmallWildRecoveryPatch(next, source, target.x, target.y);
        }
        continue;
      }

      const markTargets = getNeighbors(x, y).filter((n) => source[n.y][n.x].terrain === TERRAIN.MARK);
      if (markTargets.length > 0) {
        const target = markTargets[Math.floor(Math.random() * markTargets.length)];
        const targetMark = next[target.y][target.x];
        if (Math.random() < 0.45) {
          targetMark.terrain = TERRAIN.WILD;
          targetMark.terrainAge = 0;
          targetMark.fertility = clampFertility(targetMark.fertility + 1);
          currentTickEvents.marksCleanedByBeast += 1;
          currentTickEvents.beastAuraMarksCleaned += 1;
          tryCreateSmallWildRecoveryPatch(next, source, target.x, target.y);
        }
      }
    }
  }
  return next;
}

function hasBeastEscapeCell(source, x, y, currentHumanNeighbors) {
  return getNeighbors(x, y).some((n) => {
    const cell = source[n.y][n.x];
    if (cell.unit || (cell.terrain !== TERRAIN.WILD && cell.terrain !== TERRAIN.EMPTY)) return false;
    return countNeighborUnits(source, n.x, n.y).H < currentHumanNeighbors;
  });
}

function applyLifecycleDeath(source) {
  const next = cloneWorld(source);
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const cell = source[y][x];
      if (!cell.unit) continue;
      const age = (cell.age || 0) + 1;
      next[y][x].age = age;
      const units = countNeighborUnits(source, x, y);
      const terrains = countNeighborTerrains(source, x, y);
      let dies = false;
      let fertilityDrop = 0;

      if (cell.unit === UNIT.HUMAN) {
        const local = humanLocalCondition(source, x, y);
        trackHumanCondition(local);
        dies = (age >= HUMAN_MAX_AGE && Math.random() < HUMAN_OLD_AGE_DEATH_CHANCE) ||
          (age >= 8 && Math.random() < HUMAN_BASELINE_DEATH_CHANCE) ||
          (local.condition === "collapse" && Math.random() < HUMAN_COLLAPSE_DEATH_CHANCE) ||
          (terrains.M >= 2 && units.H < 2 && Math.random() < MARK_HUMAN_STRESS_DEATH_CHANCE);
        const activeSpiritNeighbors = countActiveSpiritNeighbors(source, x, y);
        if (activeSpiritNeighbors > 0 && !dies) {
          const exposure = humanExposureClass(source, x, y);
          let infectionChance = exposure === "core" ? 0 : exposure === "edge" ? 0.06 : 0.24;
          if (isSettlerRole(cell.role) && units.H === 0) infectionChance = 0.2;
          if (isSettlerRole(cell.role) && units.H >= 1) infectionChance *= 0.5;
          if (local.condition === "surplus" || local.condition === "balanced") infectionChance *= 0.5;
          if (local.condition === "collapse") infectionChance *= 1.5;
          infectionChance = Math.min(0.3, infectionChance);
          if (exposure === "core") {
            currentTickEvents.spiritBlockedByCoreSettlement += 1;
            currentTickEvents.humanRetreatsFromSpirit += 1;
          }
          if (Math.random() < infectionChance) {
            next[y][x].terrain = TERRAIN.MARK;
            next[y][x].terrainAge = 0;
            next[y][x].fertility = clampFertility(next[y][x].fertility - 1);
            currentTickEvents.marksCreatedBySpirit += 1;
            if (!isNoSpiritControlMode() && Math.random() < 0.3) {
              next[y][x].unit = UNIT.SPIRIT;
              next[y][x].age = 0;
              next[y][x].role = "manifestation";
              next[y][x].maxAge = spiritMaxAge();
              trackConversion(UNIT.HUMAN, UNIT.SPIRIT);
              currentTickEvents.spiritsCreatedByConversion += 1;
            } else {
              next[y][x].unit = null;
              next[y][x].age = 0;
              next[y][x].role = null;
              next[y][x].maxAge = null;
              trackDeath(UNIT.HUMAN, "natural");
              currentTickEvents.spiritKillsHumanToMark += 1;
              currentTickEvents.humanDeathsToMark += 1;
            }
            continue;
          }
        }
      }

      if (cell.unit === UNIT.BEAST) dies = false;

      if (cell.unit === UNIT.SPIRIT) {
        const maxAge = cell.maxAge || spiritMaxAge();
        next[y][x].maxAge = maxAge;
        const dormant = age < SPIRIT_INCUBATION_TICKS;
        if (dormant && units.B >= 1 && Math.random() < 0.7) {
          dies = true;
          currentTickEvents.spiritSuppressedByBeast += 1;
          currentTickEvents.dormantSpiritSuppressedByBeast += 1;
        } else {
          const adjustedAge = age + (!dormant && units.B >= 1 ? 2 : 0);
          next[y][x].age = adjustedAge;
          dies = units.B >= 2 || adjustedAge >= maxAge;
          if (dies && !dormant && units.B >= 1) currentTickEvents.activeSpiritSuppressedByBeast += 1;
          if (units.B >= 2) currentTickEvents.spiritSuppressedByBeast += 1;
        }
      }

      if (dies) {
        next[y][x].unit = null;
        next[y][x].age = 0;
        next[y][x].role = null;
        next[y][x].maxAge = null;
        trackDeath(cell.unit, "natural");
        if (cell.unit === UNIT.HUMAN) resolveHumanDeathAt(next, x, y, "natural");
        else if (cell.unit === UNIT.BEAST) disperseBeastAt(next, source, x, y);
        else {
          if (cell.unit === UNIT.SPIRIT && isDormantSpirit(cell) && units.B >= 1) {
            next[y][x].terrain = TERRAIN.WILD;
            next[y][x].terrainAge = 0;
            next[y][x].fertility = clampFertility(next[y][x].fertility + 1);
          } else {
            createMarkAt(next, x, y, 0);
            currentTickEvents.spiritDiedIntoMark += 1;
          }
          currentTickEvents.spiritDeaths.S += 1;
        }
      }
    }
  }
  return next;
}

// reproduction
function applyReproduction(source) {
  const next = cloneWorld(source);
  const totalBeasts = countWorld(source).units.B;
  let effectiveBeastBirthChance = BEAST_BIRTH_CHANCE;
  if (totalBeasts >= 50) effectiveBeastBirthChance *= 0.25;
  if (totalBeasts >= 80) effectiveBeastBirthChance *= 0.05;
  if (totalBeasts >= 120) effectiveBeastBirthChance = 0;
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const cell = source[y][x];
      if (cell.unit || cell.terrain === TERRAIN.BLOCK || cell.terrain === TERRAIN.BORDER) continue;
      const units = countNeighborUnits(source, x, y);
      const terrains = countNeighborTerrains(source, x, y);
      const local = countLocalCellState(source, x, y);

      if (
        cell.terrain === TERRAIN.FIELD &&
        cell.fertility >= 2 &&
        (units.H === 2 || units.H === 3) &&
        units.B <= 1 &&
        units.S === 0
      ) {
        const localHuman = humanLocalCondition(source, x, y);
        let chance = localHuman.condition === "surplus" ? HUMAN_SURPLUS_BIRTH_CHANCE :
          localHuman.condition === "balanced" ? HUMAN_BALANCED_BIRTH_CHANCE :
            localHuman.condition === "pressured" ? HUMAN_PRESSURED_BIRTH_CHANCE : 0;
        if (countNeighborTerrains(source, x, y).F < 3) chance *= 0.35;
        if (Math.random() < chance) {
          currentTickDiagnostics.birthCandidates.H += 1;
          next[y][x].unit = UNIT.HUMAN;
          next[y][x].age = 0;
          next[y][x].role = "normal";
          trackBirth(UNIT.HUMAN);
        }
      }

      if ((cell.terrain === TERRAIN.WILD || cell.terrain === TERRAIN.EMPTY) && cell.fertility >= 3 && units.B >= 1) {
        const radius3Beasts = countUnitInRadius(source, x, y, UNIT.BEAST, 3, 4);
        const radius5Beasts = countUnitInRadius(source, x, y, UNIT.BEAST, 5, 7);
        if (units.B !== 1 || radius3Beasts > 3 || radius5Beasts > 6 || local.localUnitCount > 4) {
          currentTickEvents.beastBirthsBlockedByDensity += 1;
          currentTickDiagnostics.beastLocalDensityBlockedCells += 1;
        } else if (units.H === 0) {
          currentTickDiagnostics.beastBirthEligibleCells += 1;
          currentTickDiagnostics.birthCandidates.B += 1;
          if (effectiveBeastBirthChance <= 0) {
            currentTickEvents.beastBirthsBlockedBySoftBrake += 1;
          } else if (Math.random() < effectiveBeastBirthChance) {
            next[y][x].unit = UNIT.BEAST;
            next[y][x].age = 0;
            next[y][x].role = "pack";
            trackBirth(UNIT.BEAST);
          } else if (totalBeasts >= 50) {
            currentTickEvents.beastBirthsBlockedBySoftBrake += 1;
          }
        }
      }

      // V0.7.1: MARK is passive residue. It does not normally spawn Spirit.
    }
  }
  return next;
}

function applySettlerSpawns(source) {
  const next = cloneWorld(source);
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const cell = source[y][x];
      if (cell.unit !== UNIT.HUMAN) continue;
      const units = countNeighborUnits(source, x, y);
      const terrains = countNeighborTerrains(source, x, y);
      const local = humanLocalCondition(source, x, y);
      let localFieldTotal = 0;
      let localFieldCount = 0;
      for (const offset of RADIUS_OFFSETS[2]) {
        const nx = x + offset.dx;
        const ny = y + offset.dy;
        if (!inBounds(nx, ny)) continue;
        const nearby = source[ny][nx];
        if (nearby.terrain === TERRAIN.FIELD) {
          localFieldTotal += nearby.fertility || 0;
          localFieldCount += 1;
        }
      }
      const averageFieldFertility = localFieldCount ? localFieldTotal / localFieldCount : 0;
      const rotPressure = terrains.M >= 2 || units.S >= 1;
      const dormantSpiritPressure = countDormantSpiritNeighbors(source, x, y) > 0;
      const exposure = dormantSpiritPressure ? humanExposureClass(source, x, y) : null;
      const warningChance = exposure === "isolated" ? 0.45 : exposure === "edge" ? 0.25 : exposure === "core" ? 0.08 : 0;
      const prosperityPressure = local.condition === "surplus" && units.H >= 4 && localFieldCount >= 5 && averageFieldFertility >= 2;
      const localHumanCount = countUnitInRadius(source, x, y, UNIT.HUMAN, 2);
      const depletedCrowdingPressure = localHumanCount >= 8 && localFieldCount >= 6 && averageFieldFertility <= 1.5;
      const crisisPressure = local.condition === "pressured" || local.condition === "collapse" || cell.fertility <= 1 || averageFieldFertility <= 1.5 || rotPressure || depletedCrowdingPressure;
      const warningDeparture = dormantSpiritPressure && Math.random() < warningChance;
      const departurePressure = prosperityPressure || crisisPressure || warningDeparture;
      const baseChance = prosperityPressure ? 0.06 : rotPressure ? 0.1 : local.condition === "collapse" ? SETTLER_COLLAPSE_DEPARTURE_CHANCE : SETTLER_PRESSURED_DEPARTURE_CHANCE;
      const chance = depletedCrowdingPressure ? Math.max(baseChance, 0.14) : baseChance;
      if (!departurePressure || isSettlerRole(cell.role)) continue;
      if (!warningDeparture && Math.random() >= chance) continue;

      next[y][x].role = prosperityPressure && !warningDeparture ? "settler_seeking_prosperity" : "settler_seeking_crisis";
      currentTickEvents.settlerDepartures += 1;
      if (warningDeparture) currentTickEvents.spiritWarningFlees += 1;
      if (prosperityPressure && !warningDeparture) currentTickEvents.prosperitySettlerDepartures += 1;
      else currentTickEvents.crisisSettlerDepartures += 1;
    }
  }
  return next;
}

function applyBorderFormation(source) {
  const next = cloneWorld(source);
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const cell = source[y][x];
      if (cell.unit || cell.terrain === TERRAIN.BLOCK || cell.terrain === TERRAIN.BORDER) continue;
      const units = countNeighborUnits(source, x, y);
      const presentTypes = Object.entries(units).filter(([, count]) => count >= 2);
      if (presentTypes.length >= 2) {
        currentTickDiagnostics.borderCandidates += 1;
        if (Math.random() < BORDER_FORMATION_CHANCE) {
          next[y][x].terrain = TERRAIN.BORDER;
          currentTickDiagnostics.actualBordersCreated += 1;
        }
      }
    }
  }
  return next;
}

function applyFertilityDynamics(source) {
  const next = cloneWorld(source);

  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const cell = source[y][x];
      const target = next[y][x];
      target.terrainAge = (cell.terrainAge || 0) + 1;

      if (cell.terrain === TERRAIN.BLOCK) {
        target.fertility = 0;
      } else if (cell.terrain === TERRAIN.EMPTY) {
        const nearWild = countAreaTerrain(source, x, y, new Set([TERRAIN.WILD])) > 0 || countNeighborUnits(source, x, y).B > 0;
        if (cell.fertility > 2 && !nearWild && Math.random() < 0.02) target.fertility = clampFertility(cell.fertility - 1);
        if (cell.fertility < 1 && Math.random() < 0.04) target.fertility = 1;
      } else if (cell.terrain === TERRAIN.FIELD) {
        if (hasHumanInArea(source, x, y) && Math.random() < 0.04) target.fertility = clampFertility(cell.fertility - 1);
      } else if (cell.terrain === TERRAIN.WILD) {
        if (cell.fertility < 3 && Math.random() < 0.05) target.fertility = clampFertility(cell.fertility + 1);
      } else if (cell.terrain === TERRAIN.MARK) {
        target.fertility = cell.fertility || 0;
      }
    }
  }

  for (const row of next) {
    for (const cell of row) {
      cell.fertility = cell.terrain === TERRAIN.BLOCK ? 0 : clampFertility(cell.fertility);
    }
  }

  return next;
}

// terrain decay
function applyTerrainDecay(source) {
  const next = cloneWorld(source);
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const cell = source[y][x];
      if (cell.terrain === TERRAIN.BLOCK || cell.unit) continue;
      const units = countNeighborUnits(source, x, y);

      if (cell.terrain === TERRAIN.FIELD) {
        const humansRadius1 = countUnitInRadius(source, x, y, UNIT.HUMAN, 1);
        const humansRadius2 = countUnitInRadius(source, x, y, UNIT.HUMAN, 2);
        const nearbyMark = countTerrainInRadius(source, x, y, TERRAIN.MARK, 2);
        if (humansRadius1 > 0) {
          // Active FIELD remains visually active.
        } else if (humansRadius2 === 0 && nearbyMark >= 2) {
          if (Math.random() < HAUNTED_FIELD_TO_MARK_CHANCE) {
            next[y][x].terrain = TERRAIN.MARK;
            next[y][x].terrainAge = 0;
            currentTickEvents.fieldDecayed += 1;
            currentTickEvents.marksCreatedBySpirit += 1;
          }
        } else if (humansRadius2 === 0 && cell.fertility <= 1 && (cell.terrainAge || 0) > ABANDONED_FIELD_MIN_AGE) {
          if (Math.random() < ABANDONED_FIELD_DECAY_CHANCE) {
            next[y][x].terrain = TERRAIN.EMPTY;
            next[y][x].terrainAge = 0;
            currentTickEvents.fieldDecayed += 1;
          }
        } else if (humansRadius2 === 0 && cell.fertility === 0) {
          next[y][x].terrain = TERRAIN.EMPTY;
          next[y][x].terrainAge = 0;
          currentTickEvents.fieldDecayed += 1;
        }
      }

      if (cell.terrain === TERRAIN.MARK && units.S === 0) {
        const neighboringMarks = countNeighborTerrains(source, x, y).M;
        const isIsolatedMark = neighboringMarks <= 1;
        const isClusteredMark = neighboringMarks >= 3;
        let markDecayChance = MARK_PASSIVE_DECAY_CHANCE;
        if (isIsolatedMark) markDecayChance = 0.10;
        if (isClusteredMark) markDecayChance = 0.015;
        const age = cell.terrainAge || 0;
        const ageDecay = age > MARK_MIN_LIFETIME && Math.random() < markDecayChance;
        const lowFertilityDecay = !isClusteredMark && cell.fertility <= 1 && age >= 10 && Math.random() < 0.08;
        if (ageDecay || lowFertilityDecay) {
          next[y][x].terrain = TERRAIN.EMPTY;
          next[y][x].terrainAge = 0;
          currentTickEvents.marksDecayed += 1;
        }
      }

      if (cell.terrain === TERRAIN.BORDER) {
        const kinds = new Set();
        for (const n of getNeighbors(x, y)) {
          const unit = source[n.y][n.x].unit;
          if (unit) kinds.add(unit);
        }
        if (kinds.size < 2) next[y][x].terrain = TERRAIN.EMPTY;
      }

      if (
        cell.terrain === TERRAIN.WILD &&
        countUnitInRadius(source, x, y, UNIT.BEAST, 2, 1) === 0 &&
        (cell.terrainAge || 0) > 30
      ) {
        const wildCount = countTerrainInRadius(source, x, y, TERRAIN.WILD, 2);
        const avgWildFertility = averageTerrainFertilityInRadius(source, x, y, TERRAIN.WILD, 2);
        const decayChance = wildCount >= 5 && avgWildFertility >= 3 ? 0.003 : 0.015;
        if (Math.random() < decayChance) {
          next[y][x].terrain = TERRAIN.EMPTY;
          next[y][x].terrainAge = 0;
          next[y][x].fertility = Math.max(clampFertility(cell.fertility - 1), 2);
          currentTickEvents.wildDecayedToEmpty += 1;
        }
      }
    }
  }
  return next;
}

function placeUnitCluster(target, cx, cy, unit, terrain, count, radius) {
  let placed = 0;
  let attempts = 0;
  while (placed < count && attempts < count * 80) {
    attempts += 1;
    const x = Math.max(1, Math.min(WIDTH - 2, cx + Math.floor((Math.random() * 2 - 1) * radius)));
    const y = Math.max(1, Math.min(HEIGHT - 2, cy + Math.floor((Math.random() * 2 - 1) * radius)));
    if (target[y][x].terrain === TERRAIN.BLOCK || target[y][x].unit) continue;
    target[y][x].unit = unit;
    target[y][x].age = Math.floor(Math.random() * 12);
    target[y][x].role = unit === UNIT.BEAST ? "pack" : unit === UNIT.SPIRIT ? "manifestation" : "normal";
    target[y][x].terrain = terrain;
    target[y][x].fertility = fertilityForTerrain(terrain);
    placed += 1;
  }
}

function paintTerrainPatch(target, cx, cy, terrain, radius, density) {
  for (let y = Math.max(0, cy - radius); y <= Math.min(HEIGHT - 1, cy + radius); y += 1) {
    for (let x = Math.max(0, cx - radius); x <= Math.min(WIDTH - 1, cx + radius); x += 1) {
      const distance = Math.hypot(x - cx, y - cy);
      if (distance <= radius && Math.random() < density && target[y][x].terrain !== TERRAIN.BLOCK) {
        target[y][x].terrain = terrain;
        target[y][x].fertility = fertilityForTerrain(terrain);
      }
    }
  }
}

function addBlocks(target, count) {
  for (let i = 0; i < count; i += 1) {
    const x = 2 + Math.floor(Math.random() * (WIDTH - 4));
    const y = 2 + Math.floor(Math.random() * (HEIGHT - 4));
    if (!target[y][x].unit) {
      target[y][x].terrain = TERRAIN.BLOCK;
      target[y][x].fertility = 0;
    }
  }
}

const INITIAL_PRESETS = {
  balanced: {
    presetName: "Balanced Asymmetric Ecology Test",
    initialHumans: 32,
    initialBeasts: 18,
    initialSpirits: 0,
    initialFieldPatches: 3,
    initialWildPatches: 5,
    initialMarkPatches: 1,
    initialBlockCount: 20,
  },
  noSpirit: {
    presetName: "No Spirit Control",
    initialHumans: 24,
    initialBeasts: 18,
    initialSpirits: 0,
    initialFieldPatches: 3,
    initialWildPatches: 5,
    initialMarkPatches: 0,
    initialBlockCount: 20,
  },
  humanExpansion: {
    presetName: "Human Expansion Test",
    initialHumans: 36,
    initialBeasts: 14,
    initialSpirits: 0,
    initialFieldPatches: 3,
    initialWildPatches: 6,
    initialMarkPatches: 0,
    initialBlockCount: 20,
  },
  beastDispersion: {
    presetName: "Beast Dispersion Test",
    initialHumans: 0,
    initialBeasts: 30,
    initialSpirits: 0,
    initialFieldPatches: 0,
    initialWildPatches: 8,
    initialMarkPatches: 0,
    initialBlockCount: 20,
  },
  spiritOutbreak: {
    presetName: "Spirit Outbreak Test",
    initialHumans: 36,
    initialBeasts: 12,
    initialSpirits: 2,
    initialFieldPatches: 4,
    initialWildPatches: 4,
    initialMarkPatches: 2,
    initialBlockCount: 20,
  },
  humanMigration: {
    presetName: "Human Migration Test",
    initialHumans: 36,
    initialBeasts: 10,
    initialSpirits: 0,
    initialFieldPatches: 2,
    initialWildPatches: 6,
    initialMarkPatches: 1,
    initialBlockCount: 20,
  },
  emptyControl: {
    presetName: "Empty Control",
    initialHumans: 0,
    initialBeasts: 0,
    initialSpirits: 0,
    initialFieldPatches: 0,
    initialWildPatches: 0,
    initialMarkPatches: 0,
    initialBlockCount: 0,
  },
};

function clampInteger(value, min, max, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function createSeededRandom(seed) {
  let state = Math.max(1, Math.floor(seed) % 2147483647);
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function randomRange(rng, min, max) {
  return min + rng() * (max - min);
}

function randomInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

function randomSeedValue() {
  return Math.floor(Math.random() * 2147483646) + 1;
}

function getSelectedPresetName() {
  const selected = presetSelect.value;
  return INITIAL_PRESETS[selected]?.presetName || "Custom";
}

function getInitialSettings({ refreshBlankSeed = false, forceNewSeed = false } = {}) {
  const defaultPreset = INITIAL_PRESETS.balanced;
  let seed = Number.parseInt(randomSeedInput.value, 10);
  if (forceNewSeed || Number.isNaN(seed) || seed <= 0 || refreshBlankSeed) {
    seed = randomSeedValue();
    randomSeedInput.value = String(seed);
  }

  return {
    initialHumans: clampInteger(humanCountInput.value, 0, 300, defaultPreset.initialHumans),
    initialBeasts: clampInteger(beastCountInput.value, 0, 300, defaultPreset.initialBeasts),
    initialSpirits: clampInteger(spiritCountInput.value, 0, 200, defaultPreset.initialSpirits),
    initialFieldPatches: clampInteger(fieldPatchCountInput.value, 0, 20, defaultPreset.initialFieldPatches),
    initialWildPatches: clampInteger(wildPatchCountInput.value, 0, 20, defaultPreset.initialWildPatches),
    initialMarkPatches: clampInteger(markPatchCountInput.value, 0, 20, defaultPreset.initialMarkPatches),
    initialBlockCount: clampInteger(blockCountInput.value, 0, 120, defaultPreset.initialBlockCount),
    randomSeed: seed,
    presetName: getSelectedPresetName(),
  };
}

function applyPresetToInputs(presetKey) {
  const preset = INITIAL_PRESETS[presetKey] || INITIAL_PRESETS.balanced;
  presetSelect.value = INITIAL_PRESETS[presetKey] ? presetKey : "balanced";
  humanCountInput.value = String(preset.initialHumans);
  beastCountInput.value = String(preset.initialBeasts);
  spiritCountInput.value = String(preset.initialSpirits);
  fieldPatchCountInput.value = String(preset.initialFieldPatches);
  wildPatchCountInput.value = String(preset.initialWildPatches);
  markPatchCountInput.value = String(preset.initialMarkPatches);
  blockCountInput.value = String(preset.initialBlockCount);
}

function createBaseFertilityWorld(rng) {
  return Array.from({ length: HEIGHT }, () =>
    Array.from({ length: WIDTH }, () => createCell(TERRAIN.EMPTY, null, 0, "normal", randomInt(rng, 1, 2)))
  );
}

function choosePatchCenters(count, rng, preferred = null) {
  const centers = [];
  for (let i = 0; i < count; i += 1) {
    const base = preferred?.[i % preferred.length];
    const x = base
      ? Math.max(2, Math.min(WIDTH - 3, base.x + randomInt(rng, -3, 3)))
      : randomInt(rng, 3, WIDTH - 4);
    const y = base
      ? Math.max(2, Math.min(HEIGHT - 3, base.y + randomInt(rng, -3, 3)))
      : randomInt(rng, 3, HEIGHT - 4);
    centers.push({ x, y });
  }
  return centers;
}

function paintInitialPatch(target, center, terrain, radius, density, rng, fertilityMin, fertilityMax) {
  for (let y = Math.max(0, center.y - radius); y <= Math.min(HEIGHT - 1, center.y + radius); y += 1) {
    for (let x = Math.max(0, center.x - radius); x <= Math.min(WIDTH - 1, center.x + radius); x += 1) {
      const distance = Math.hypot(x - center.x, y - center.y);
      if (distance <= radius && rng() < density && target[y][x].terrain !== TERRAIN.BLOCK) {
        target[y][x].terrain = terrain;
        target[y][x].fertility = randomInt(rng, fertilityMin, fertilityMax);
      }
    }
  }
}

function addFertilityHotspots(target, rng) {
  const count = randomInt(rng, 2, 5);
  for (let i = 0; i < count; i += 1) {
    const center = { x: randomInt(rng, 3, WIDTH - 4), y: randomInt(rng, 3, HEIGHT - 4) };
    const radius = randomInt(rng, 4, 8);
    for (let y = Math.max(0, center.y - radius); y <= Math.min(HEIGHT - 1, center.y + radius); y += 1) {
      for (let x = Math.max(0, center.x - radius); x <= Math.min(WIDTH - 1, center.x + radius); x += 1) {
        const distance = Math.hypot(x - center.x, y - center.y);
        if (distance > radius || target[y][x].terrain === TERRAIN.BLOCK) continue;
        if (target[y][x].terrain === TERRAIN.EMPTY || target[y][x].terrain === TERRAIN.WILD) {
          target[y][x].fertility = Math.max(target[y][x].fertility, randomInt(rng, 3, 4));
        }
      }
    }
  }
}

function addScatteredWild(target, rng, count) {
  let placed = 0;
  let attempts = 0;
  while (placed < count && attempts < count * 20) {
    attempts += 1;
    const x = randomInt(rng, 1, WIDTH - 2);
    const y = randomInt(rng, 1, HEIGHT - 2);
    const cell = target[y][x];
    if (cell.terrain === TERRAIN.BLOCK || cell.terrain === TERRAIN.FIELD || cell.terrain === TERRAIN.MARK) continue;
    if (countNeighborTerrains(target, x, y).W >= 3) continue;
    cell.terrain = TERRAIN.WILD;
    cell.terrainAge = 0;
    cell.fertility = randomInt(rng, 3, 4);
    placed += 1;
  }
}

function addInitialBlocks(target, count, rng) {
  let placed = 0;
  let attempts = 0;
  while (placed < count && attempts < count * 20 + 200) {
    attempts += 1;
    const x = randomInt(rng, 1, WIDTH - 2);
    const y = randomInt(rng, 1, HEIGHT - 2);
    if (target[y][x].unit || target[y][x].terrain === TERRAIN.BLOCK) continue;
    target[y][x].terrain = TERRAIN.BLOCK;
    target[y][x].fertility = 0;
    placed += 1;
  }
}

function shuffledNeighborsNear(center, radius, rng) {
  const cells = [];
  for (let y = Math.max(0, center.y - radius); y <= Math.min(HEIGHT - 1, center.y + radius); y += 1) {
    for (let x = Math.max(0, center.x - radius); x <= Math.min(WIDTH - 1, center.x + radius); x += 1) {
      cells.push({ x, y, distance: Math.hypot(x - center.x, y - center.y) });
    }
  }
  cells.sort((a, b) => a.distance - b.distance || rng() - 0.5);
  return cells;
}

function placeInitialUnits(target, unit, count, centers, options, rng) {
  let placed = 0;
  const role = options.role || "normal";
  const fallbackTerrain = options.fallbackTerrain || TERRAIN.EMPTY;
  const fertilityMin = options.fertilityMin ?? 45;
  const fertilityMax = options.fertilityMax ?? 70;
  const useCenters = centers.length > 0 ? centers : choosePatchCenters(Math.max(1, Math.ceil(count / 6)), rng);

  while (placed < count) {
    let placedThisPass = false;
    for (const center of useCenters) {
      if (placed >= count) break;
      const candidates = shuffledNeighborsNear(center, options.radius || 4, rng);
      for (const candidate of candidates) {
        const cell = target[candidate.y][candidate.x];
        if (cell.unit || cell.terrain === TERRAIN.BLOCK) continue;
        if (unit === UNIT.SPIRIT && cell.terrain !== TERRAIN.MARK) {
          cell.terrain = TERRAIN.MARK;
          cell.fertility = randomInt(rng, 2, 3);
        } else if (cell.terrain === TERRAIN.EMPTY && fallbackTerrain !== TERRAIN.EMPTY && rng() < 0.5) {
          cell.terrain = fallbackTerrain;
          cell.fertility = randomInt(rng, fertilityMin, fertilityMax);
        } else {
          cell.fertility = Math.max(cell.fertility || 0, randomInt(rng, fertilityMin, fertilityMax));
        }
        cell.unit = unit;
        cell.age = randomInt(rng, 0, 6);
        cell.role = role;
        placed += 1;
        placedThisPass = true;
        break;
      }
    }
    if (!placedThisPass) break;
  }

  if (placed < count) currentPlacementWarnings.push(`Could only place ${placed} / ${count} ${options.label}`);
  return placed;
}

function createInitialWorld(settings = getInitialSettings()) {
  currentPlacementWarnings = [];
  const rng = createSeededRandom(settings.randomSeed);
  const next = createBaseFertilityWorld(rng);

  const fieldCenters = choosePatchCenters(settings.initialFieldPatches, rng, [{ x: 10, y: 13 }, { x: 13, y: 9 }, { x: 8, y: 17 }]);
  const wildCenters = choosePatchCenters(settings.initialWildPatches, rng, [{ x: 30, y: 13 }, { x: 27, y: 8 }, { x: 33, y: 18 }]);
  const markCenters = choosePatchCenters(settings.initialMarkPatches, rng, [{ x: 20, y: 19 }, { x: 17, y: 15 }, { x: 23, y: 16 }]);

  for (const center of fieldCenters) paintInitialPatch(next, center, TERRAIN.FIELD, randomInt(rng, 2, 4), 0.68, rng, 2, 3);
  for (const center of wildCenters) paintInitialPatch(next, center, TERRAIN.WILD, randomInt(rng, 1, 3), 0.6, rng, 3, 4);
  for (const center of markCenters) paintInitialPatch(next, center, TERRAIN.MARK, randomInt(rng, 2, 4), 0.62, rng, 2, 3);

  addFertilityHotspots(next, rng);
  if (settings.initialWildPatches > 0) {
    addScatteredWild(next, rng, randomInt(rng, 60, 120));
  }
  addInitialBlocks(next, settings.initialBlockCount, rng);

  placeInitialUnits(next, UNIT.HUMAN, settings.initialHumans, fieldCenters, {
    role: "normal",
    fallbackTerrain: settings.initialFieldPatches > 0 ? TERRAIN.FIELD : TERRAIN.EMPTY,
    radius: 4,
    fertilityMin: 2,
    fertilityMax: 3,
    label: "Humans",
  }, rng);
  placeInitialUnits(next, UNIT.BEAST, settings.initialBeasts, wildCenters, {
    role: "pack",
    fallbackTerrain: TERRAIN.WILD,
    radius: 6,
    fertilityMin: 3,
    fertilityMax: 4,
    label: "Beasts",
  }, rng);

  let spiritCenters = markCenters;
  if (settings.initialSpirits > 0 && spiritCenters.length === 0) {
    spiritCenters = choosePatchCenters(Math.max(1, Math.ceil(settings.initialSpirits / 3)), rng, [{ x: 20, y: 18 }]);
    for (const center of spiritCenters) paintInitialPatch(next, center, TERRAIN.MARK, 1, 1, rng, 2, 3);
  }
  placeInitialUnits(next, UNIT.SPIRIT, settings.initialSpirits, spiritCenters, {
    role: "manifestation",
    fallbackTerrain: TERRAIN.MARK,
    radius: 4,
    fertilityMin: 2,
    fertilityMax: 3,
    label: "Spirits",
  }, rng);

  currentInitialSettings = { ...settings };
  return next;
}

function createDefaultWorld() {
  return createInitialWorld(getInitialSettings());
}

function randomizeWorld() {
  return createInitialWorld(getInitialSettings({ forceNewSeed: true }));
}

function terrainClass(terrain) {
  return {
    ".": "terrain-empty",
    F: "terrain-field",
    W: "terrain-wild",
    M: "terrain-mark",
    X: "terrain-border",
    "#": "terrain-block",
  }[terrain];
}

function createWorldRows(source) {
  const terrainRows = [];
  const unitRows = [];
  const ageRows = [];
  const roles = [];
  const fertilityRows = [];
  const terrainAgeRows = [];
  for (const row of source) {
    terrainRows.push(row.map((cell) => cell.terrain).join(""));
    unitRows.push(row.map((cell) => cell.unit || ".").join(""));
    ageRows.push(row.map((cell) => (cell.unit ? cell.age || 0 : null)));
    roles.push(row.map((cell) => (cell.unit ? cell.role || "normal" : ".")));
    fertilityRows.push(row.map((cell) => String(clampFertility(cell.fertility || 0))).join(""));
    terrainAgeRows.push(row.map((cell) => cell.terrainAge || 0));
  }
  return { terrainRows, unitRows, ageRows, roles, fertilityRows, terrainAgeRows };
}

// V0.9 Macro World Layer: observer-only analysis over the existing ecology.
function createEmptyMacroWorld() {
  return {
    version: "0.9",
    ecologyVersion: "0.8.3",
    readabilityPatchVersion: "0.8.4",
    macroViewPatchVersion: "0.9.2",
    macroViewStabilityPatchVersion: "0.9.3",
    tick: 0,
    analyzedEvery: MACRO_ANALYSIS_INTERVAL,
    regions: [],
    routes: [],
    events: [],
    memories: [],
    visibleIcons: [],
    display: createEmptyMacroDisplaySummary(),
  };
}

function createEmptyMacroDisplaySummary() {
  return {
    viewModes: ["cell", "macro"],
    masks: {
      settlements: 0,
      abandoned: 0,
      wildRecovery: 0,
      spiritScars: 0,
      frontiers: 0,
      routes: 0,
    },
  };
}

function createEmptyMacroHistory() {
  return {
    nextIds: {},
    objects: {},
    settlerPositionSamples: [],
  };
}

function getCellKey(x, y) {
  return `${x},${y}`;
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function centroid(cells) {
  if (!cells.length) return { x: 0, y: 0 };
  const total = cells.reduce((acc, cell) => ({ x: acc.x + cell.x, y: acc.y + cell.y }), { x: 0, y: 0 });
  return { x: Number((total.x / cells.length).toFixed(2)), y: Number((total.y / cells.length).toFixed(2)) };
}

function boundsForCells(cells) {
  return cells.reduce((bounds, cell) => ({
    minX: Math.min(bounds.minX, cell.x),
    minY: Math.min(bounds.minY, cell.y),
    maxX: Math.max(bounds.maxX, cell.x),
    maxY: Math.max(bounds.maxY, cell.y),
  }), { minX: WIDTH, minY: HEIGHT, maxX: 0, maxY: 0 });
}

function floodFillCells(source, predicate) {
  const visited = new Set();
  const components = [];
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const key = getCellKey(x, y);
      if (visited.has(key) || !predicate(source[y][x], x, y)) continue;
      const stack = [{ x, y }];
      const cells = [];
      visited.add(key);
      while (stack.length) {
        const pos = stack.pop();
        cells.push(pos);
        for (const n of getNeighbors(pos.x, pos.y)) {
          const nKey = getCellKey(n.x, n.y);
          if (visited.has(nKey) || !predicate(source[n.y][n.x], n.x, n.y)) continue;
          visited.add(nKey);
          stack.push(n);
        }
      }
      components.push(cells);
    }
  }
  return components;
}

function cellsWithinRadius(cells, radius) {
  const seen = new Set();
  const result = [];
  for (const cell of cells) {
    for (const offset of RADIUS_OFFSETS[radius]) {
      const x = cell.x + offset.dx;
      const y = cell.y + offset.dy;
      if (!inBounds(x, y)) continue;
      const key = getCellKey(x, y);
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({ x, y });
    }
  }
  return result;
}

function countUnitsNear(source, cells, radius) {
  const counts = { H: 0, B: 0, S: 0 };
  for (const pos of cellsWithinRadius(cells, radius)) {
    const unit = source[pos.y][pos.x].unit;
    if (unit) counts[unit] += 1;
  }
  return counts;
}

function countTerrainNear(source, cells, radius) {
  const counts = { ".": 0, F: 0, W: 0, M: 0, X: 0, "#": 0 };
  for (const pos of cellsWithinRadius(cells, radius)) {
    counts[source[pos.y][pos.x].terrain] += 1;
  }
  return counts;
}

function avgFertilityForCells(source, cells) {
  if (!cells.length) return 0;
  const total = cells.reduce((sum, cell) => sum + (source[cell.y][cell.x].fertility || 0), 0);
  return Number((total / cells.length).toFixed(2));
}

function recentMacroEventTotals() {
  const totals = createEmptyEvents();
  for (const frame of macroRecentFrames) {
    const events = frame.events || {};
    for (const key of Object.keys(totals)) {
      if (typeof totals[key] === "number") totals[key] += events[key] || 0;
    }
    if (events.births) {
      totals.births.H += events.births.H || 0;
      totals.births.B += events.births.B || 0;
      totals.births.S += events.births.S || 0;
    }
    if (events.deaths) {
      totals.deaths.H += events.deaths.H || 0;
      totals.deaths.B += events.deaths.B || 0;
      totals.deaths.S += events.deaths.S || 0;
    }
    if (events.conversions) totals.conversions.H_to_S += events.conversions.H_to_S || 0;
  }
  return totals;
}

function macroIconFor(type, state) {
  if (type === "settlement") return state === "new_settlement" ? "S+" : "S";
  if (type === "abandoned_settlement") return "R";
  if (type === "beast_recovery_zone") return "W";
  if (type === "spirit_outbreak") return "!";
  if (type === "spirit_scar") return "*";
  if (type === "migration_route") return "->";
  if (type === "human_beast_frontier") return "F";
  return "?";
}

function nextMacroId(type) {
  macroHistory.nextIds[type] = (macroHistory.nextIds[type] || 0) + 1;
  return `${type}_${String(macroHistory.nextIds[type]).padStart(3, "0")}`;
}

function isMacroMatch(previous, candidate) {
  if (previous.type !== candidate.type) return false;
  if (candidate.type === "spirit_outbreak") return distance(previous.center, candidate.center) <= 6;
  if (distance(previous.center, candidate.center) <= 6) return true;
  if (!previous.bounds || !candidate.bounds) return false;
  return previous.bounds.minX <= candidate.bounds.maxX &&
    previous.bounds.maxX >= candidate.bounds.minX &&
    previous.bounds.minY <= candidate.bounds.maxY &&
    previous.bounds.maxY >= candidate.bounds.minY;
}

function materializeMacroObject(candidate, collection, seenIds) {
  const previous = Object.values(macroHistory.objects)
    .filter((object) => !seenIds.has(object.id))
    .find((object) => isMacroMatch(object, candidate));
  const id = previous?.id || nextMacroId(candidate.type);
  const firstSeenTick = previous?.firstSeenTick ?? tick;
  if (candidate.type === "settlement") {
    candidate = { ...candidate, state: settlementState(candidate.metrics, firstSeenTick) };
  }
  const stateChanged = previous && previous.state !== candidate.state;
  const history = previous?.history ? previous.history.slice(-8) : [];
  if (!previous || stateChanged) history.push({ tick, state: candidate.state });
  const object = {
    ...candidate,
    id,
    age: tick - firstSeenTick,
    firstSeenTick,
    lastSeenTick: tick,
    displayIcon: candidate.displayIcon || macroIconFor(candidate.type, candidate.state),
    history,
  };
  object.visible = object.confidence >= 0.55 && (object.age >= 25 || object.type === "spirit_outbreak");
  macroHistory.objects[id] = object;
  seenIds.add(id);
  collection.push(object);
  return object;
}

function settlementState(metrics, firstSeenTick) {
  if (tick - firstSeenTick <= 75) return "new_settlement";
  if (metrics.recentDeaths > metrics.recentBirths || metrics.nearbyMark + metrics.nearbySpirit >= 6) return "declining";
  if (metrics.avgFieldFertility <= 1.5 || metrics.recentSettlerDepartures >= 4) return "overloaded";
  if (metrics.population >= 5 && metrics.fieldArea >= 12) return "stable";
  return "growing";
}

function detectSettlementCandidates(source, recentTotals) {
  return floodFillCells(source, (cell) => cell.terrain === TERRAIN.FIELD)
    .filter((cells) => cells.length >= 8)
    .map((cells) => {
      const nearUnits = countUnitsNear(source, cells, 2);
      if (nearUnits.H < 3) return null;
      const nearTerrains = countTerrainNear(source, cells, 2);
      const center = centroid(cells);
      const metrics = {
        population: nearUnits.H,
        fieldArea: cells.length,
        avgFieldFertility: avgFertilityForCells(source, cells),
        nearbyMark: nearTerrains.M,
        nearbySpirit: nearUnits.S,
        recentBirths: recentTotals.births.H,
        recentDeaths: recentTotals.deaths.H,
        recentSettlerDepartures: recentTotals.settlerDepartures,
        recentSettlementFoundings: recentTotals.settlementFoundings,
      };
      return {
        type: "settlement",
        state: settlementState(metrics, tick),
        center,
        bounds: boundsForCells(cells),
        cells: cells.slice(0, 40),
        size: cells.length,
        confidence: Math.min(0.95, 0.5 + cells.length / 40 + nearUnits.H / 30),
        metrics,
      };
    })
    .filter(Boolean);
}

function detectAbandonedSettlementCandidates(source) {
  return floodFillCells(source, (cell) => cell.terrain === TERRAIN.FIELD)
    .filter((cells) => cells.length >= 5)
    .map((cells) => {
      const nearUnits = countUnitsNear(source, cells, 2);
      const nearTerrains = countTerrainNear(source, cells, 2);
      const avgFieldFertility = avgFertilityForCells(source, cells);
      if (nearUnits.H > 1 || (nearTerrains.M < 2 && avgFieldFertility > 1.5)) return null;
      const state = nearTerrains.M >= 2 || nearUnits.S > 0 ? "haunted_ruin" : "recently_abandoned";
      return {
        type: "abandoned_settlement",
        state,
        center: centroid(cells),
        bounds: boundsForCells(cells),
        cells: cells.slice(0, 30),
        size: cells.length,
        confidence: 0.66,
        metrics: { fieldArea: cells.length, population: nearUnits.H, nearbyMark: nearTerrains.M, avgFieldFertility },
      };
    })
    .filter(Boolean);
}

function detectBeastRecoveryCandidates(source, recentTotals) {
  const recentRecovery = recentTotals.beastRecoveryPatchCreated +
    recentTotals.marksCleanedByBeast +
    recentTotals.beastAuraMarksCleaned +
    recentTotals.beastAuraSpiritCleansed;
  return buildWildRecoveryInfluenceComponents(source)
    .map(({ cells, metrics }) => {
      const recoveryScore = beastRecoveryScore(metrics, recentTotals);
      const evidenceCells = metrics.wildCells + metrics.beastCount;
      const evidenceDensity = evidenceCells / Math.max(1, cells.length);
      if (cells.length < 18 || (metrics.beastCount < 2 && metrics.wildCells < 6 && recentRecovery <= 0)) return null;
      if (cells.length > WIDTH * HEIGHT * 0.55 && (evidenceCells < 18 || evidenceDensity < 0.03)) return null;
      if (recoveryScore < 16) return null;
      const state = recoveryScore >= 26 ? "active_recovery" :
        recentRecovery + recentTotals.beastRelocations > 0 ? "quiet_habitat" :
          metrics.nearbyField > 0 ? "wild_frontier" : "beast_habitat";
      return {
        type: "beast_recovery_zone",
        state,
        center: centroid(cells),
        bounds: boundsForCells(cells),
        cells: cells.slice(0, 40),
        size: cells.length,
        confidence: Math.min(0.92, 0.42 + recoveryScore / 70 + metrics.beastCount / 18 + metrics.wildCells / 100),
        metrics: {
          influenceArea: cells.length,
          wildCells: metrics.wildCells,
          beastCount: metrics.beastCount,
          avgFertility: metrics.avgFertility,
          nearbyMark: metrics.nearbyMark,
          nearbyField: metrics.nearbyField,
          recentRecovery,
          recentRelocations: recentTotals.beastRelocations,
          recoveryScore: Number(recoveryScore.toFixed(2)),
        },
      };
    })
    .filter(Boolean);
}

function beastRecoveryScore(metrics, recentTotals) {
  const recentRecovery = (recentTotals.beastRecoveryPatchCreated || 0) +
    (recentTotals.marksCleanedByBeast || 0) +
    (recentTotals.beastAuraMarksCleaned || 0) +
    (recentTotals.beastAuraSpiritCleansed || 0);
  return metrics.wildCells * 1.2 +
    metrics.beastCount * 8 +
    recentRecovery * 0.12 +
    (recentTotals.beastRelocations || 0) * 0.08 -
    Math.max(0, metrics.nearbyField - 80) * 0.04;
}

function detectSpiritCandidates(source, recentTotals) {
  const events = [];
  const spiritCells = [];
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      if (source[y][x].unit === UNIT.SPIRIT) spiritCells.push({ x, y });
    }
  }
  if (spiritCells.length > 0) {
    const dormant = spiritCells.filter((cell) => isDormantSpirit(source[cell.y][cell.x])).length;
    const active = spiritCells.length - dormant;
    events.push({
      type: "spirit_outbreak",
      state: active > 0 ? "active_outbreak" : "warning",
      center: centroid(spiritCells),
      bounds: boundsForCells(spiritCells),
      size: spiritCells.length,
      severity: active > 1 || spiritCells.length >= 3 ? "high" : "medium",
      confidence: 0.82,
      metrics: {
        dormantSpirits: dormant,
        activeSpirits: active,
        humanDeathsToSpirit: recentTotals.humanDeathsToSpirit,
        marksCreated: recentTotals.marksCreatedBySpirit + recentTotals.spiritTrailMarksCreated,
        spiritWarningFlees: recentTotals.spiritWarningFlees,
      },
    });
  }
  for (const cells of floodFillCells(source, (cell) => cell.terrain === TERRAIN.MARK).filter((component) => component.length >= 5)) {
    const nearUnits = countUnitsNear(source, cells, 2);
    if (nearUnits.S > 0) continue;
    events.push({
      type: "spirit_scar",
      state: "scar",
      center: centroid(cells),
      bounds: boundsForCells(cells),
      size: cells.length,
      severity: cells.length >= 12 ? "medium" : "low",
      confidence: Math.min(0.8, 0.45 + cells.length / 30),
      metrics: { markArea: cells.length, nearbyHumans: nearUnits.H, nearbyBeasts: nearUnits.B },
    });
  }
  return events;
}

function collectSettlerSamples(source) {
  const cells = [];
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const cell = source[y][x];
      if (cell.unit === UNIT.HUMAN && isSettlerRole(cell.role)) cells.push({ x, y, role: cell.role });
    }
  }
  macroHistory.settlerPositionSamples = macroHistory.settlerPositionSamples.filter((sample) => tick - sample.tick <= 150).slice(-40);
  if (cells.length > 0) {
    macroHistory.settlerPositionSamples.push({ tick, cells: cells.slice(0, 80) });
  }
}

function routeHasDanger(source, path) {
  return path.some((cell) =>
    countTerrainInRadius(source, cell.x, cell.y, TERRAIN.MARK, 2, 1) > 0 ||
    countUnitInRadius(source, cell.x, cell.y, UNIT.SPIRIT, 2, 1) > 0
  );
}

function detectMigrationRouteCandidates(recentTotals) {
  const recentCells = macroHistory.settlerPositionSamples.flatMap((sample) => sample.cells);
  if (recentCells.length < 4) return [];
  const lastSampleTick = macroHistory.settlerPositionSamples.reduce((latest, sample) => Math.max(latest, sample.tick), 0);
  const inactiveTicks = tick - lastSampleTick;
  const path = recentCells.filter((_, index) => index % Math.max(1, Math.floor(recentCells.length / 20)) === 0).slice(0, 20);
  const totalHumans = countWorld(world).units.H;
  const recentSettlerMoves = recentTotals.settlerMoves;
  let state = inactiveTicks > 75 || recentSettlerMoves === 0 ? "old_route" : "active_route";
  if (routeHasDanger(world, path)) state = "dangerous_route";
  if (totalHumans === 0) state = "abandoned_route";
  let confidence = Math.min(0.82, 0.45 + recentCells.length / 40);
  if (inactiveTicks > 150) confidence *= 0.35;
  else if (inactiveTicks > 75) confidence *= 0.65;
  return [{
    type: "migration_route",
    state,
    center: centroid(recentCells),
    bounds: boundsForCells(recentCells),
    path,
    confidence,
    metrics: { recentSettlerSamples: recentCells.length, inactiveTicks, recentSettlerMoves, recentFoundings: recentTotals.settlementFoundings },
  }];
}

function detectHumanBeastFrontierCandidates(source, recentTotals) {
  const frontierCells = [];
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const cell = source[y][x];
      if (cell.terrain !== TERRAIN.FIELD && cell.unit !== UNIT.HUMAN) continue;
      const terrains = countNeighborTerrains(source, x, y);
      const units = countNeighborUnits(source, x, y);
      if ((terrains.W > 0 || units.B > 0) && (terrains.F > 0 || units.H > 0)) frontierCells.push({ x, y });
    }
  }
  if (frontierCells.length < 4 && recentTotals.beastRelocations + recentTotals.beastDispersals + recentTotals.fieldTrampled < 1) return [];
  if (!frontierCells.length) return [];
  return [{
    type: "human_beast_frontier",
    state: recentTotals.beastDispersals + recentTotals.beastRelocations > 0 ? "hunting_ground" : "wild_border",
    center: centroid(frontierCells),
    bounds: boundsForCells(frontierCells),
    cells: frontierCells.slice(0, 40),
    size: frontierCells.length,
    confidence: Math.min(0.8, 0.45 + frontierCells.length / 50),
    metrics: {
      frontierCells: frontierCells.length,
      recentBeastDispersals: recentTotals.beastDispersals,
      recentBeastRelocations: recentTotals.beastRelocations,
      recentFieldTrampled: recentTotals.fieldTrampled,
    },
  }];
}

function buildVisibleMacroIcons(worldState) {
  const candidates = [...worldState.regions, ...worldState.routes, ...worldState.events]
    .filter((item) => item.visible)
    .sort((a, b) => macroIconPriority(b) - macroIconPriority(a) || b.confidence - a.confidence);
  const icons = [];
  for (const item of candidates) {
    if (icons.length >= MAX_MACRO_ICONS) break;
    const tooCloseIndex = icons.findIndex((icon) => distance(icon.center, item.center) < 4);
    if (tooCloseIndex >= 0 && item.type !== "spirit_outbreak") continue;
    icons.push({ id: item.id, type: item.type, state: item.state, center: item.center, icon: item.displayIcon, confidence: item.confidence });
  }
  return icons;
}

function macroIconPriority(item) {
  if (item.type === "spirit_outbreak" && (item.state === "active_outbreak" || item.state === "warning")) return 100;
  if (item.type === "settlement") return 80;
  if (item.type === "abandoned_settlement" || item.type === "spirit_scar") return 65;
  if (item.type === "beast_recovery_zone" && item.state === "active_recovery") return 55;
  if (item.type === "human_beast_frontier") return 45;
  if (item.type === "migration_route") return item.state === "active_route" ? 50 : 30;
  return 10;
}

function createEmptyMacroDisplayMasks() {
  return {
    cellClasses: Array.from({ length: HEIGHT }, () => Array.from({ length: WIDTH }, () => "")),
    counts: {
      settlements: 0,
      abandoned: 0,
      wildRecovery: 0,
      spiritScars: 0,
      frontiers: 0,
      routes: 0,
    },
  };
}

function markMacroCells(mask, cells, className) {
  for (const cell of cells) {
    if (!inBounds(cell.x, cell.y)) continue;
    const existing = mask.cellClasses[cell.y][cell.x];
    mask.cellClasses[cell.y][cell.x] = existing ? `${existing} ${className}` : className;
  }
}

function cellsFromMacroRegion(region, fallbackRadius = 4) {
  if (Array.isArray(region.cells) && region.cells.length > 0) return region.cells.filter((cell) => inBounds(cell.x, cell.y));
  const center = region.center || {
    x: region.bounds ? (region.bounds.minX + region.bounds.maxX) / 2 : 0,
    y: region.bounds ? (region.bounds.minY + region.bounds.maxY) / 2 : 0,
  };
  const cells = [];
  if (region.bounds) {
    const minX = Math.max(0, Math.floor(region.bounds.minX));
    const maxX = Math.min(WIDTH - 1, Math.ceil(region.bounds.maxX));
    const minY = Math.max(0, Math.floor(region.bounds.minY));
    const maxY = Math.min(HEIGHT - 1, Math.ceil(region.bounds.maxY));
    const radius = Math.max(fallbackRadius, Math.ceil(Math.max(maxX - minX, maxY - minY) / 2));
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        if (distance({ x, y }, center) <= radius) cells.push({ x, y });
      }
    }
    return cells.slice(0, 180);
  }
  const cx = Math.round(center.x);
  const cy = Math.round(center.y);
  for (const offset of RADIUS_OFFSETS[fallbackRadius]) {
    const x = cx + offset.dx;
    const y = cy + offset.dy;
    if (inBounds(x, y)) cells.push({ x, y });
  }
  return cells;
}

function buildBooleanMask(source, predicate) {
  return Array.from({ length: HEIGHT }, (_, y) =>
    Array.from({ length: WIDTH }, (_, x) => Boolean(predicate(source[y]?.[x], x, y)))
  );
}

function dilateMask(mask, radius = 1) {
  const next = Array.from({ length: HEIGHT }, () => Array.from({ length: WIDTH }, () => false));
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      if (!mask[y][x]) continue;
      for (const offset of RADIUS_OFFSETS[radius]) {
        const nx = x + offset.dx;
        const ny = y + offset.dy;
        if (inBounds(nx, ny)) next[ny][nx] = true;
      }
    }
  }
  return next;
}

function connectedMaskComponents(mask) {
  const visited = Array.from({ length: HEIGHT }, () => Array.from({ length: WIDTH }, () => false));
  const components = [];
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      if (visited[y][x] || !mask[y][x]) continue;
      const stack = [{ x, y }];
      const cells = [];
      visited[y][x] = true;
      while (stack.length) {
        const pos = stack.pop();
        cells.push(pos);
        for (const n of getNeighbors(pos.x, pos.y)) {
          if (visited[n.y][n.x] || !mask[n.y][n.x]) continue;
          visited[n.y][n.x] = true;
          stack.push(n);
        }
      }
      components.push(cells);
    }
  }
  return components;
}

function componentTerrainCount(source, cells, terrain) {
  return cells.reduce((count, cell) => count + (source[cell.y][cell.x].terrain === terrain ? 1 : 0), 0);
}

function componentUnitCount(source, cells, unit) {
  return cells.reduce((count, cell) => count + (source[cell.y][cell.x].unit === unit ? 1 : 0), 0);
}

function componentAverageFertility(source, cells) {
  if (!cells.length) return 0;
  const total = cells.reduce((sum, cell) => sum + (source[cell.y][cell.x].fertility || 0), 0);
  return Number((total / cells.length).toFixed(2));
}

function buildHumanInfluenceComponents(source) {
  const fieldMask = buildBooleanMask(source, (cell) => cell?.terrain === TERRAIN.FIELD);
  const humanMask = buildBooleanMask(source, (cell) => cell?.unit === UNIT.HUMAN);
  const fieldInfluence = dilateMask(fieldMask, 1);
  const humanInfluence = dilateMask(humanMask, 1);
  const base = Array.from({ length: HEIGHT }, () => Array.from({ length: WIDTH }, () => false));
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      base[y][x] = fieldMask[y][x] || humanMask[y][x] || (fieldInfluence[y][x] && humanInfluence[y][x]);
    }
  }
  return connectedMaskComponents(base);
}

function buildWildRecoveryInfluenceComponents(source) {
  const wildMask = buildBooleanMask(source, (cell) => cell?.terrain === TERRAIN.WILD);
  const beastMask = buildBooleanMask(source, (cell) => cell?.unit === UNIT.BEAST);
  const wildInfluence = dilateMask(wildMask, 2);
  const beastInfluence = dilateMask(beastMask, 2);
  const base = Array.from({ length: HEIGHT }, () => Array.from({ length: WIDTH }, () => false));
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const cell = source[y][x];
      base[y][x] = wildMask[y][x] ||
        beastMask[y][x] ||
        (beastInfluence[y][x] && ((cell.terrain === TERRAIN.EMPTY && cell.fertility >= 3) || wildInfluence[y][x]));
    }
  }
  const dilated = dilateMask(base, 1);
  return connectedMaskComponents(dilated).map((cells) => {
    const nearTerrains = countTerrainNear(source, cells, 2);
    const nearUnits = countUnitsNear(source, cells, 2);
    return {
      cells,
      metrics: {
        influenceArea: cells.length,
        wildCells: componentTerrainCount(source, cells, TERRAIN.WILD),
        beastCount: nearUnits.B,
        avgFertility: componentAverageFertility(source, cells),
        nearbyField: nearTerrains.F,
        nearbyMark: nearTerrains.M,
      },
    };
  });
}

function buildSpiritScarInfluenceComponents(source) {
  const markMask = buildBooleanMask(source, (cell) => cell?.terrain === TERRAIN.MARK);
  const clusteredMarkMask = Array.from({ length: HEIGHT }, () => Array.from({ length: WIDTH }, () => false));
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      if (markMask[y][x] && countNeighborTerrains(source, x, y).M >= 1) clusteredMarkMask[y][x] = true;
    }
  }
  const clusteredInfluence = dilateMask(clusteredMarkMask, 1);
  const base = Array.from({ length: HEIGHT }, () => Array.from({ length: WIDTH }, () => false));
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      base[y][x] = markMask[y][x] || clusteredInfluence[y][x];
    }
  }
  return connectedMaskComponents(base).map((cells) => ({
    cells,
    markCells: componentTerrainCount(source, cells, TERRAIN.MARK),
  }));
}

function buildMacroDisplayMasks(source) {
  if (macroDisplayMaskCache.source === source && macroDisplayMaskCache.tick === tick && macroDisplayMaskCache.masks) {
    return macroDisplayMaskCache.masks;
  }
  const mask = createEmptyMacroDisplayMasks();

  for (const cells of buildHumanInfluenceComponents(source)) {
    const nearUnits = countUnitsNear(source, cells, 2);
    const fieldCells = componentTerrainCount(source, cells, TERRAIN.FIELD);
    if (cells.length >= 12 && nearUnits.H >= 3) {
      markMacroCells(mask, cells, "macro-cell-settlement");
      mask.counts.settlements += 1;
    } else if (fieldCells >= 5 && cells.length >= 8 && nearUnits.H <= 1) {
      markMacroCells(mask, cells, "macro-cell-abandoned");
      mask.counts.abandoned += 1;
    }
  }

  for (const { cells, metrics } of buildWildRecoveryInfluenceComponents(source)) {
    if (cells.length < 18 || (metrics.beastCount < 2 && metrics.wildCells < 6)) continue;
    markMacroCells(mask, cells, "macro-cell-wild");
    mask.counts.wildRecovery += 1;
  }

  let visibleRecoveryRegions = 0;
  for (const region of macroWorld?.regions || []) {
    if (region.type !== "beast_recovery_zone" || !region.visible) continue;
    const cells = cellsFromMacroRegion(region, 4);
    if (!cells.length) continue;
    markMacroCells(mask, cells, "macro-cell-wild");
    visibleRecoveryRegions += 1;
  }
  if (visibleRecoveryRegions > mask.counts.wildRecovery) mask.counts.wildRecovery = visibleRecoveryRegions;

  for (const { cells, markCells } of buildSpiritScarInfluenceComponents(source)) {
    if (markCells >= 5 || (cells.length >= 10 && markCells >= 3)) {
      markMacroCells(mask, cells, "macro-cell-scar");
      mask.counts.spiritScars += 1;
    }
  }

  const frontierCells = [];
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const cell = source[y][x];
      if (cell.terrain !== TERRAIN.FIELD && cell.unit !== UNIT.HUMAN) continue;
      if (countTerrainInRadius(source, x, y, TERRAIN.WILD, 2, 1) > 0 || countUnitInRadius(source, x, y, UNIT.BEAST, 2, 1) > 0) {
        frontierCells.push({ x, y });
      }
    }
  }
  if (frontierCells.length >= 4) {
    markMacroCells(mask, frontierCells, "macro-cell-frontier");
    mask.counts.frontiers = 1;
  }

  for (const route of macroWorld?.routes || []) {
    if (!route.path || (route.confidence || 0) < 0.45) continue;
    markMacroCells(mask, route.path, "macro-cell-route");
    mask.counts.routes += 1;
  }

  macroDisplayMaskCache = { source, tick, masks: mask };
  return mask;
}

function createMacroDisplaySummary(source) {
  const masks = buildMacroDisplayMasks(source);
  return {
    viewModes: ["cell", "macro"],
    masks: { ...masks.counts },
  };
}

function createMacroDisplaySummaryFromObjects(worldState) {
  return {
    viewModes: ["cell", "macro"],
    masks: {
      settlements: worldState.regions.filter((item) => item.type === "settlement").length,
      abandoned: worldState.regions.filter((item) => item.type === "abandoned_settlement").length,
      wildRecovery: worldState.regions.filter((item) => item.type === "beast_recovery_zone").length,
      spiritScars: worldState.events.filter((item) => item.type === "spirit_scar").length,
      frontiers: worldState.regions.filter((item) => item.type === "human_beast_frontier").length,
      routes: worldState.routes.filter((item) => item.path && (item.confidence || 0) >= 0.45).length,
    },
  };
}

function retainBeastRecoveryRegion(object) {
  const inactiveTicks = tick - object.lastSeenTick;
  if (inactiveTicks > 100) return null;
  const state = inactiveTicks <= 50 ? "quiet_habitat" : "fading_recovery";
  const confidence = Math.max(0.35, object.confidence * (inactiveTicks <= 50 ? 0.85 : 0.65));
  const history = object.history ? object.history.slice(-8) : [];
  if (object.state !== state) history.push({ tick, state });
  const retained = {
    ...object,
    state,
    age: tick - object.firstSeenTick,
    confidence,
    metrics: { ...(object.metrics || {}), inactiveTicks },
    history,
  };
  retained.visible = retained.confidence >= 0.45;
  retained.displayIcon = macroIconFor(retained.type, retained.state);
  macroHistory.objects[retained.id] = retained;
  return retained;
}

function analyzeMacroWorldNow() {
  collectSettlerSamples(world);
  const recentTotals = recentMacroEventTotals();
  const seenIds = new Set();
  const nextMacroWorld = createEmptyMacroWorld();
  nextMacroWorld.tick = tick;

  const regionCandidates = [
    ...detectSettlementCandidates(world, recentTotals),
    ...detectAbandonedSettlementCandidates(world),
    ...detectBeastRecoveryCandidates(world, recentTotals),
    ...detectHumanBeastFrontierCandidates(world, recentTotals),
  ];
  for (const candidate of regionCandidates) materializeMacroObject(candidate, nextMacroWorld.regions, seenIds);

  for (const candidate of detectMigrationRouteCandidates(recentTotals)) materializeMacroObject(candidate, nextMacroWorld.routes, seenIds);
  for (const candidate of detectSpiritCandidates(world, recentTotals)) materializeMacroObject(candidate, nextMacroWorld.events, seenIds);

  for (const object of Object.values(macroHistory.objects)) {
    if (seenIds.has(object.id) || tick - object.lastSeenTick > 100) continue;
    if (object.type === "beast_recovery_zone") {
      const retained = retainBeastRecoveryRegion(object);
      if (retained) nextMacroWorld.regions.push(retained);
      continue;
    }
    if (object.type === "spirit_outbreak") {
      const cx = Math.round(object.center.x);
      const cy = Math.round(object.center.y);
      const clusteredMark = inBounds(cx, cy) ? countTerrainInRadius(world, cx, cy, TERRAIN.MARK, 3) : 0;
      const nearbySpirit = inBounds(cx, cy) ? countUnitInRadius(world, cx, cy, UNIT.SPIRIT, 3, 1) : 0;
      if (nearbySpirit === 0 && clusteredMark >= 3) {
        const inactiveTicks = tick - object.lastSeenTick;
        nextMacroWorld.events.push({
          ...object,
          state: inactiveTicks >= 75 ? "scar" : "aftermath",
          lastSeenTick: object.lastSeenTick,
          age: tick - object.firstSeenTick,
          confidence: Math.max(0.35, object.confidence * (inactiveTicks >= 75 ? 0.55 : 0.75)),
          metrics: { ...(object.metrics || {}), inactiveTicks, clusteredMark },
          visible: object.confidence >= 0.55,
        });
      }
      continue;
    }
    if (object.type === "settlement") {
      nextMacroWorld.memories.push({
        id: `memory_${object.id}`,
        type: "former_settlement",
        center: object.center,
        sourceRegionId: object.id,
        createdTick: object.lastSeenTick,
        lastUpdatedTick: tick,
        summary: "Former settlement persisted in macro memory after dropping below detection threshold.",
      });
    }
  }

  nextMacroWorld.visibleIcons = buildVisibleMacroIcons(nextMacroWorld);
  macroWorld = nextMacroWorld;
  nextMacroWorld.display = createMacroDisplaySummaryFromObjects(nextMacroWorld);
  macroWorld = nextMacroWorld;
  macroFrames.push({ tick, regions: macroWorld.regions.length, events: macroWorld.events.length, routes: macroWorld.routes.length, visibleIcons: macroWorld.visibleIcons.length });
  if (macroFrames.length > MAX_MACRO_FRAMES) macroFrames = macroFrames.slice(-MAX_MACRO_FRAMES);
  return macroWorld;
}

function ensureMacroAnalysis() {
  if (!macroWorld || macroWorld.tick !== tick) analyzeMacroWorldNow();
  return macroWorld;
}

function macroSummary() {
  return {
    tick: macroWorld.tick,
    regions: macroWorld.regions.length,
    events: macroWorld.events.length,
    routes: macroWorld.routes.length,
    memories: macroWorld.memories.length,
    visibleIcons: macroWorld.visibleIcons.length,
  };
}

function cloneMacroWorldSnapshot(source = macroWorld) {
  return JSON.parse(JSON.stringify(source));
}

function resetMacroWorld() {
  macroWorld = createEmptyMacroWorld();
  macroHistory = createEmptyMacroHistory();
  macroRecentFrames = [];
  macroFrames = [];
  macroDisplayMaskCache = { source: null, tick: null, masks: null };
}

function pushMacroRecentFrame(events, diagnostics) {
  macroRecentFrames.push({
    tick,
    counts: countWorld(world),
    events: cloneEvents(events),
    diagnostics: cloneDiagnostics(diagnostics),
    ...createWorldRows(world),
  });
  if (macroRecentFrames.length > MAX_MACRO_RECENT_FRAMES) macroRecentFrames = macroRecentFrames.slice(-MAX_MACRO_RECENT_FRAMES);
}

function getParams() {
  return {
    gridWidth: WIDTH,
    gridHeight: HEIGHT,
    tickSpeedMs: getTickSpeedMs(),
    overcrowdingThreshold: Number(overcrowdingInput.value),
    movementEnabled: Boolean(movementToggle.checked),
  };
}

function getTickSpeedMs() {
  const clamped = Math.max(MIN_TICK_SPEED_MS, Number(speedInput.value) || MIN_TICK_SPEED_MS);
  if (Number(speedInput.value) !== clamped) speedInput.value = String(clamped);
  return clamped;
}

function showStatus(message) {
  statusMessageEl.textContent = message;
}

function padTick(value) {
  return String(value).padStart(4, "0");
}

function downloadJson(filename, data) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function getExportInitialSettings() {
  return currentInitialSettings ? { ...currentInitialSettings } : getInitialSettings();
}

function createSnapshotExport() {
  const rows = createWorldRows(world);
  const analyzedMacroWorld = ensureMacroAnalysis();
  return {
    type: "tri_species_snapshot",
    version: "0.1",
    createdAt: new Date().toISOString(),
    tick,
    params: getParams(),
    initialSettings: getExportInitialSettings(),
    counts: countWorld(world),
    world: rows,
    roles: rows.roles,
    fertility: calculateFertilityStats(world),
    macroWorld: cloneMacroWorldSnapshot(analyzedMacroWorld),
  };
}

function exportSnapshotJson() {
  downloadJson(`tri_species_snapshot_tick_${padTick(tick)}.json`, createSnapshotExport());
}

function getKeyframeEvery() {
  return Math.max(1, Number(keyframeEveryInput.value) || 25);
}

function shouldRecordKeyframe() {
  const keyframeEvery = getKeyframeEvery();
  return recording.frames.length === 0 || tick % keyframeEvery === 0;
}

function updateRecordingStatus() {
  recordingStateEl.textContent = recording.isRecording ? "ON" : "OFF";
  recordedFramesEl.textContent = String(recording.frames.length);
  recordedKeyframesEl.textContent = String(recording.keyframes.length);
}

function updatePerformanceStatus() {
  playingStateEl.textContent = String(playing);
  gridSizeEl.textContent = `${WIDTH} x ${HEIGHT}`;
}

function recordFrame(events = lastTickEvents, diagnostics = lastTickDiagnostics) {
  if (recording.frames.length >= MAX_RECORDED_FRAMES) {
    recording.isRecording = false;
    showStatus("Recording stopped: max frame limit reached.");
    updateRecordingStatus();
    return;
  }

  if (recording.startTick === null) {
    recording.startTick = tick;
    recording.params = getParams();
  }

  recording.endTick = tick;
  recording.frames.push({
    tick,
    counts: countWorld(world),
    fertility: calculateFertilityStats(world),
    events: cloneEvents(events),
    diagnostics: cloneDiagnostics(diagnostics),
    macro: macroSummary(),
  });

  if (shouldRecordKeyframe()) {
    recording.keyframes.push({
      tick,
      ...createWorldRows(world),
      macroWorld: cloneMacroWorldSnapshot(macroWorld),
    });
  }

  updateRecordingStatus();
}

function startRecording() {
  if (recording.isRecording) return;
  recording.isRecording = true;
  ensureMacroAnalysis();
  if (recording.frames.length === 0) recordFrame(createEmptyEvents(), createEmptyDiagnostics());
  updateRecordingStatus();
}

function stopRecording() {
  recording.isRecording = false;
  updateRecordingStatus();
}

function clearRecording() {
  recording = createEmptyRecording();
  lastTickEvents = createEmptyEvents();
  lastTickDiagnostics = createEmptyDiagnostics();
  updateRecordingStatus();
}

function findExtinctionTick(unit) {
  for (const frame of recording.frames) {
    if (frame.counts.units[unit] === 0) return frame.tick;
  }
  return null;
}

function createRecordingExport() {
  const analyzedMacroWorld = ensureMacroAnalysis();
  const firstFrame = recording.frames[0] || { tick, counts: countWorld(world) };
  const lastFrame = recording.frames[recording.frames.length - 1] || firstFrame;

  return {
    type: "tri_species_recording",
    version: "0.1",
    createdAt: new Date().toISOString(),
    params: recording.params || getParams(),
    startTick: recording.startTick ?? tick,
    endTick: recording.endTick ?? tick,
    sampleEvery: 1,
    keyframeEvery: getKeyframeEvery(),
    summary: {
      initialCounts: firstFrame.counts,
      finalCounts: lastFrame.counts,
      initialSettings: getExportInitialSettings(),
      extinctionTick: {
        H: findExtinctionTick(UNIT.HUMAN),
        B: findExtinctionTick(UNIT.BEAST),
        S: findExtinctionTick(UNIT.SPIRIT),
      },
    },
    frames: recording.frames.slice(),
    keyframes: recording.keyframes.slice(),
    macroWorld: cloneMacroWorldSnapshot(analyzedMacroWorld),
    macroFrames: macroFrames.slice(),
  };
}

function exportRecordingJson() {
  const data = createRecordingExport();
  downloadJson(
    `tri_species_recording_ticks_${padTick(data.startTick)}_${padTick(data.endTick)}.json`,
    data
  );
}

function buildGrid() {
  gridEl.style.gridTemplateColumns = `repeat(${WIDTH}, 1fr)`;
  gridEl.style.gridTemplateRows = `repeat(${HEIGHT}, 1fr)`;
  gridEl.innerHTML = "";
  for (let i = 0; i < WIDTH * HEIGHT; i += 1) {
    const cell = document.createElement("div");
    cell.className = "cell terrain-empty";
    gridEl.appendChild(cell);
  }
}

function renderMacroOverlay() {
  if (!macroOverlayEl) return;
  macroOverlayEl.innerHTML = "";
  if (macroOverlayToggle && !macroOverlayToggle.checked) return;
  const icons = macroWorld?.visibleIcons || [];
  for (const icon of icons) {
    const el = document.createElement("div");
    el.className = `macro-icon macro-${icon.type}`;
    el.textContent = icon.icon;
    el.title = `${icon.type}: ${icon.state}`;
    el.style.left = `${(icon.center.x / Math.max(1, WIDTH - 1)) * 100}%`;
    el.style.top = `${(icon.center.y / Math.max(1, HEIGHT - 1)) * 100}%`;
    macroOverlayEl.appendChild(el);
  }
}

// rendering
function renderWorld() {
  const cells = gridEl.children;
  const viewMode = viewModeSelect?.value === "macro" ? "macro" : "cell";
  if (gridEl.classList) gridEl.classList.toggle("macro-view", viewMode === "macro");
  const macroMasks = viewMode === "macro" ? buildMacroDisplayMasks(world) : null;
  if (cells.length > 0 && !("classList" in cells[0])) {
    renderMacroOverlay();
    return;
  }
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const cell = world[y][x];
      const el = cells[y * WIDTH + x];
      const unit = cell.unit || "";
      const macroClass = macroMasks ? macroMasks.cellClasses[y][x] : "";
      const nextClassName = `cell ${terrainClass(cell.terrain)}${macroClass ? ` ${macroClass}` : ""}`;
      if (el.dataset.terrain !== cell.terrain) el.dataset.terrain = cell.terrain;
      if (el.className !== nextClassName) el.className = nextClassName;
      if (el.dataset.unit !== unit) {
        el.dataset.unit = unit;
        el.textContent = unit;
      }
      const fertilityLabel = String(Math.round(cell.fertility || 0));
      if (el.dataset.fertility !== fertilityLabel) {
        el.dataset.fertility = fertilityLabel;
        el.title = `fertility level ${fertilityLabel}`;
      }
    }
  }
  renderMacroOverlay();
}

function hasRenderableGrid() {
  const first = gridEl.children[0];
  return !first || "classList" in first;
}

function calculateStats() {
  const counts = countWorld(world);
  return {
    tick,
    Human: counts.units.H,
    Beast: counts.units.B,
    Spirit: counts.units.S,
    FIELD: counts.terrains.F,
    WILD: counts.terrains.W,
    MARK: counts.terrains.M,
    BORDER: counts.terrains.X,
  };
}

function updateStats() {
  const stats = calculateStats();
  statsEl.innerHTML = Object.entries(stats)
    .map(([key, value]) => `<dt>${key}</dt><dd>${value}</dd>`)
    .join("");
}

function stepWorld() {
  currentTickEvents = createEmptyEvents();
  currentTickDiagnostics = createEmptyDiagnostics();
  const movementWorld = planMovements(world);
  const lifecycleWorld = applyLifecycleDeath(movementWorld);
  const conflictWorld = applyConflict(lifecycleWorld);
  const cleansedWorld = applyBeastAuraCleansing(conflictWorld);
  const terrainWorld = applyTerrainRewrite(cleansedWorld);
  const borderWorld = applyBorderFormation(terrainWorld);
  const reproductionWorld = applyReproduction(borderWorld);
  const settlerWorld = applySettlerSpawns(reproductionWorld);
  const fertilityWorld = applyFertilityDynamics(settlerWorld);
  const decayWorld = applyTerrainDecay(fertilityWorld);
  updateStateDiagnostics(decayWorld, recording.isRecording);
  finalizeDiagnostics();
  lastTickEvents = cloneEvents(currentTickEvents);
  lastTickDiagnostics = cloneDiagnostics(currentTickDiagnostics);
  world = decayWorld;
  tick += 1;
  pushMacroRecentFrame(lastTickEvents, lastTickDiagnostics);
  if (tick % MACRO_ANALYSIS_INTERVAL === 0) analyzeMacroWorldNow();
  renderWorld();
  if (hasRenderableGrid()) updateStats();
  if (recording.isRecording) recordFrame(lastTickEvents, lastTickDiagnostics);
}

function runStepSafely() {
  try {
    stepWorld();
  } catch (err) {
    stop();
    console.error(err);
    showStatus("Simulation paused due to error. Check console.");
  }
}

function stop() {
  playing = false;
  playPauseBtn.textContent = "Play";
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
  updatePerformanceStatus();
}

function start() {
  if (timerId !== null) return;
  playing = true;
  playPauseBtn.textContent = "Pause";
  timerId = setInterval(runStepSafely, getTickSpeedMs());
  updatePerformanceStatus();
}

function resetWorld(nextWorld) {
  stop();
  tick = 0;
  world = cloneWorld(nextWorld);
  currentTickEvents = createEmptyEvents();
  lastTickEvents = createEmptyEvents();
  currentTickDiagnostics = createEmptyDiagnostics();
  lastTickDiagnostics = createEmptyDiagnostics();
  resetMacroWorld();
  pushMacroRecentFrame(lastTickEvents, lastTickDiagnostics);
  analyzeMacroWorldNow();
  renderWorld();
  updateStats();
  showStatus("");
  updatePerformanceStatus();
}

function showPlacementWarnings(prefix = "") {
  if (currentPlacementWarnings.length > 0) {
    showStatus(`${prefix}${currentPlacementWarnings.join(" ")}`);
  } else {
    showStatus(prefix.trim());
  }
}

function storeAndResetInitial(nextWorld, settings, statusPrefix = "") {
  currentInitialWorld = cloneWorld(nextWorld);
  currentInitialSettings = { ...settings };
  resetWorld(currentInitialWorld);
  showPlacementWarnings(statusPrefix);
}

function applyInitialSettings({ randomizeSeed = false, statusPrefix = "Initial settings applied. " } = {}) {
  const settings = getInitialSettings({ forceNewSeed: randomizeSeed });
  const nextWorld = createInitialWorld(settings);
  storeAndResetInitial(nextWorld, settings, statusPrefix);
}

function resetToCurrentInitialWorld() {
  if (!currentInitialWorld) {
    applyInitialSettings({ statusPrefix: "Initial settings applied. " });
    return;
  }
  resetWorld(currentInitialWorld);
  showStatus("Reset to last initial state.");
}

playPauseBtn.addEventListener("click", () => {
  if (playing) stop();
  else start();
});

stepBtn.addEventListener("click", () => {
  stop();
  runStepSafely();
});

resetBtn.addEventListener("click", resetToCurrentInitialWorld);
randomizeBtn.addEventListener("click", () => applyInitialSettings({ randomizeSeed: true, statusPrefix: "Randomized from current settings. " }));
applyInitialSettingsBtn.addEventListener("click", () => applyInitialSettings({ statusPrefix: "Initial settings applied. " }));
presetSelect.addEventListener("change", () => {
  applyPresetToInputs(presetSelect.value);
  applyInitialSettings({ statusPrefix: `${getSelectedPresetName()} applied. ` });
});
speedInput.addEventListener("input", () => {
  getTickSpeedMs();
  if (playing) {
    stop();
    start();
  }
});
exportSnapshotBtn.addEventListener("click", exportSnapshotJson);
startRecordingBtn.addEventListener("click", startRecording);
stopRecordingBtn.addEventListener("click", stopRecording);
exportRecordingBtn.addEventListener("click", exportRecordingJson);
clearRecordingBtn.addEventListener("click", clearRecording);
if (macroOverlayToggle) macroOverlayToggle.addEventListener("change", renderMacroOverlay);
if (viewModeSelect) viewModeSelect.addEventListener("change", renderWorld);
if (document.addEventListener) {
  document.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
      event.preventDefault();
      if (playing) stop();
      else start();
    }
    if (event.code === "Escape") stop();
  });
}

buildGrid();
applyInitialSettings({ statusPrefix: "" });
updateRecordingStatus();

window.__triSpeciesSim = {
  TERRAIN,
  UNIT,
  createDefaultWorld,
  randomizeWorld,
  createInitialWorld,
  getInitialSettings,
  applyInitialSettings,
  resetToCurrentInitialWorld,
  applyPresetToInputs,
  cloneWorld,
  createCell,
  getNeighbors,
  countNeighborUnits,
  countNeighborTerrains,
  countWorld,
  planMovements,
  applyTerrainRewrite,
  applyLifecycleDeath,
  applyConflict,
  applyBeastAuraCleansing,
  applyReproduction,
  applySettlerSpawns,
  applyTerrainDecay,
  stepWorld,
  runStepSafely,
  calculateStats,
  resetWorld,
  createSnapshotExport,
  exportSnapshotJson,
  startRecording,
  stopRecording,
  clearRecording,
  recordFrame,
  createRecordingExport,
  exportRecordingJson,
  downloadJson,
  createEmptyMacroWorld,
  analyzeMacroWorldNow,
  ensureMacroAnalysis,
  macroSummary,
  buildMacroDisplayMasks,
};
