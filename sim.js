"use strict";

const WIDTH = 40;
const HEIGHT = 25;
const EXPLORE_VIEWPORT_COLS = 15;
const EXPLORE_VIEWPORT_ROWS = 11;
const EXPLORE_INTERACT_RANGE = 2.25;
const EXPLORE_PLAYER_SPEED_CELLS_PER_SECOND = 5.0;
const EXPLORE_PLAYER_RADIUS = 0.32;
const EXPLORE_SLEEP_TICK_MS = 140;
const EXPLORE_SLEEP_TICKS_PER_REST = 30;
const MAP_SEED_VERSION = "0.13.1";
const PLACE_MEMORY_VERSION = "0.14B";
const PROTO_CULTURE_EXPORT_VERSION = "0.14B.2";
const PLACE_STATE_STATUSES = new Set(["emerging", "active", "expanding", "shrinking", "contested", "corrupted", "recovering", "abandoned", "remnant", "stable"]);
const PLACE_STATE_TRENDS = new Set(["growing", "declining", "holding", "unstable", "silent"]);
const PLACE_PRESSURES = new Set(["human", "beast", "spirit", "rot", "water", "forest", "mixed", "none"]);
const PLACE_CHANGE_CATEGORIES = new Set(["human_expanded", "human_shrank", "village_emerged", "village_lost", "seat_moved", "polity_split", "polity_collapsed", "polity_recovered", "ownership_changed", "rot_spread", "rot_receded", "forest_expanded", "forest_thinned", "water_recovered_land", "poi_contested", "no_significant_change"]);
const PLACE_CHANGE_SUBJECTS = new Set(["human", "polity", "lineage", "village", "seat", "poi", "rot", "forest", "water", "mixed"]);
const PLACE_CHANGE_DIRECTIONS = new Set(["growing", "declining", "holding", "unstable", "moved", "split", "collapsed", "recovered", "none"]);
const PROTO_CULTURE_MEMORY_VERSION = "0.14B";
const PROTO_CULTURE_SUMMARY_VERSION = "0.14B.1";
const SEMANTIC_TRAITS = Object.freeze({
  RIVER_ADJACENT: "river_adjacent",
  RIVER_CENTER: "river_center",
  RIVER_CROSSING: "river_crossing",
  SPRING_FED: "spring_fed",
  GREAT_FOREST_NEARBY: "great_forest_nearby",
  ROT_SOURCE_NEARBY: "rot_source_nearby",
  MONUMENT_SHADOWED: "monument_shadowed",
  MOUNTAIN_BLOCKED: "mountain_blocked",
  HUMAN_SETTLED: "human_settled",
  HUMAN_SEAT: "human_seat",
  HUMAN_OLD_SEAT: "human_old_seat",
  HUMAN_OUTPOST: "human_outpost",
  HUMAN_REMNANT: "human_remnant",
  HUMAN_DOMAIN: "human_domain",
  POLITY_OWNED: "polity_owned",
  LINEAGE_CONTINUITY: "lineage_continuity",
  SPLIT_POLITY: "split_polity",
  SEATLESS_POLITY: "seatless_polity",
  PRESSURED_POLITY: "pressured_polity",
  BEAST_PRESSURE: "beast_pressure",
  BEAST_HABITAT: "beast_habitat",
  WILD_RECOVERING: "wild_recovering",
  SPIRIT_PRESSURE: "spirit_pressure",
  SPIRIT_SCARRED: "spirit_scarred",
  MARK_CORRODED: "mark_corroded",
  FIELD_DECLINING: "field_declining",
  FERTILITY_RECOVERING: "fertility_recovering",
  FERTILITY_EXHAUSTED: "fertility_exhausted",
  MIXED_PRESSURE: "mixed_pressure",
  RECENTLY_CHANGED: "recently_changed",
  LONG_STABLE: "long_stable",
  RECENTLY_ABANDONED: "recently_abandoned",
  INHERITED_MEMORY: "inherited_memory",
  COLLAPSED_MEMORY: "collapsed_memory",
  WATCHED_BY_PLAYER: "watched_by_player",
});
const PLACE_ARCHETYPES = Object.freeze({
  RIVER_VILLAGE: "river_village",
  RIVER_CROSSING: "river_crossing",
  FOREST_EDGE_SETTLEMENT: "forest_edge_settlement",
  SETTLED_VILLAGE: "settled_village",
  BEAST_RANGE: "beast_range",
  SPIRIT_SCAR: "spirit_scar",
  HAUNTED_REMNANT: "haunted_remnant",
  PRESSURED_SEAT: "pressured_seat",
  OLD_SEAT: "old_seat",
  SEATLESS_POLITY_CENTER: "seatless_polity_center",
  FRONTIER_OUTPOST: "frontier_outpost",
  FERTILE_REFUGE: "fertile_refuge",
  CONTESTED_POI: "contested_poi",
  ORDINARY_PLACE: "ordinary_place",
});
const PROTO_CULTURE_HINTS = Object.freeze({
  RIVER_BOUND: "river_bound",
  FOREST_EDGE: "forest_edge",
  MEMORY_BOUND: "memory_bound",
  SCAR_BOUND: "scar_bound",
  FRONTIER_ADAPTED: "frontier_adapted",
  MONUMENT_CENTERED: "monument_centered",
  SPRING_REFUGE: "spring_refuge",
  SPLIT_LINEAGE: "split_lineage",
  SEATLESS_DRIFT: "seatless_drift",
});
const RIVER_FERTILITY_RESTORE_CHANCE = 0.10;
const RIVER_FERTILITY_MAX = 3;
const MIN_TICK_SPEED_MS = 100;
const MAX_RECORDED_FRAMES = 2000;
const MACRO_ANALYSIS_INTERVAL = 25;
const MACRO_DISPLAY_INTERVAL = 5;
const MACRO_TIMELINE_SAMPLE_INTERVAL = 5;
const MAX_MACRO_RECENT_FRAMES = 150;
const MAX_MACRO_FRAMES = 500;
const MAX_MACRO_ICONS = 12;
const MAX_VISIBLE_RECOVERY_REGIONS = 8;
const MAX_HEAVY_SCREEN_ARCHETYPES = 3;
const POPULATION_EVOLUTION_MEMORY_TICKS = 35;
const POPULATION_EVOLUTION_MAX_MEMORY_CELLS = 120;
const POPULATION_EVOLUTION_MIN_AREA = {
  human: 8,
  beast: 8,
  spirit: 5,
};
const MACRO_MEMORY_VERSION = "0.10.9.1";
const MACRO_MEMORY_DECAY = 0.99;
const MACRO_MEMORY_TERRAIN_GAIN = 0.016;
const MACRO_MEMORY_SHAPE_BODY_GAIN = 0.022;
const MACRO_MEMORY_SHAPE_CORE_GAIN = 0.038;
const MACRO_MEMORY_POI_GAIN = 0.020;
const MACRO_MEMORY_CONFLICT_GAIN = 0.026;
const MACRO_MEMORY_OVERLAP_HINT_GAIN = 0.004;
const MACRO_MEMORY_FAINT_THRESHOLD = 0.36;
const MACRO_MEMORY_STRONG_THRESHOLD = 0.72;
const MACRO_MEMORY_POI_WARMUP_TICK = 50;
const MACRO_MEMORY_POI_WARMUP_TOTAL = 0.20;
const HUMAN_LINEAGE_VERSION = "0.11.5";
const HUMAN_LINEAGE_MAX_PATH = 24;
const HUMAN_LINEAGE_MAX_AREA_HISTORY = 24;
const HUMAN_LINEAGE_MAX_ACTIVE_CELLS = 80;
const HUMAN_LINEAGE_MAX_MEMORY_CELLS = 120;
const HUMAN_LINEAGE_MAX_EVENTS = 80;
const HUMAN_LINEAGE_COLLAPSE_MISSES = 3;
const HUMAN_LINEAGE_SAME_MAX_DISTANCE = 8;
const HUMAN_LINEAGE_DESCENDANT_MAX_DISTANCE = 10;
const HUMAN_SEAT_MIN_DOMAIN_AREA = 20;
const HUMAN_SEAT_MIN_CONFIDENCE = 0.55;
const HUMAN_SEAT_STABILITY_SAMPLES = 3;
const HUMAN_SEAT_SAME_DISTANCE = 3;
const HUMAN_SEAT_WARN_MISSES = 2;
const HUMAN_SEAT_ABANDON_MISSES = 5;
const HUMAN_SEAT_MARK_ABANDON_MISSES = 2;
const HUMAN_OUTPOST_MAX = 12;
const HUMAN_OUTPOST_MIN_AREA = 15;
const HUMAN_OUTPOST_MIN_CONFIDENCE = 0.5;
const HUMAN_OUTPOST_FAR_DISTANCE = 8;
const HUMAN_OUTPOST_ACTIVE_SAMPLES = 2;
const HUMAN_OUTPOST_PROMOTION_SAMPLES = 5;
const HUMAN_OUTPOST_PROMOTION_AREA = 24;
const HUMAN_OUTPOST_PROMOTION_CONFIDENCE = 0.6;
const HUMAN_OUTPOST_SAME_DISTANCE = 4;
const HUMAN_POLITY_VERSION = "0.11.15";
const HUMAN_POLITY_MAX = 12;
const HUMAN_POLITY_MAX_EVENTS = 80;
const HUMAN_POLITY_MAX_LINEAGES = 12;
const HUMAN_POLITY_MAX_OLD_SEATS = 6;
const HUMAN_VILLAGE_MAX = 24;
const HUMAN_VILLAGE_VISIBLE_MAX = 6;
const HUMAN_VILLAGE_MAX_PER_POLITY = 3;
const HUMAN_VILLAGE_MIN_SUPPORT = 8;
const HUMAN_VILLAGE_MIN_SEAT_DISTANCE = 3;
const HUMAN_VILLAGE_MIN_DISTANCE = 5;
const HUMAN_VILLAGE_MIN_LIFETIME_TICKS = 40;
const HUMAN_VILLAGE_MISSING_GRACE_SAMPLES = 3;
const HUMAN_VILLAGE_REUSE_DISTANCE = 4;
const HUMAN_VILLAGE_MOVE_SMOOTHING_DISTANCE = 2;
const HUMAN_VILLAGE_EVENT_COOLDOWN_TICKS = 25;
const HUMAN_POLITY_SPLIT_DISTANCE = 12;
const HUMAN_ANCESTRY_MAX_IDS = 8;
const HUMAN_SEAT_ANCESTRY_MAX = 6;
const HUMAN_POLITY_SPLIT_COOLDOWN_TICKS = 100;
const HUMAN_POLITY_PRESSURED_MAX_SAMPLES = 8;
const HUMAN_POLITY_SEATLESS_DECLINE_SAMPLES = 4;
const HUMAN_POLITY_DECLINE_COLLAPSE_SAMPLES = 8;
const HUMAN_POLITY_MAX_COLLAPSED_RETAINED = 6;
const HUMAN_DOMAIN_OWNERSHIP_SEAT_DISTANCE = 8;
const HUMAN_DOMAIN_OWNERSHIP_VILLAGE_DISTANCE = 5;
const HUMAN_DOMAIN_OWNERSHIP_OUTPOST_DISTANCE = 6;
const HUMAN_REMNANT_VISIBLE_MAX = 2;
const MAX_SEMANTIC_TAGS = 24;
const MAX_POPULATION_TAGS_PER_SPECIES = 2;
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
const REGION_BIAS = {
  NONE: "none",
  BASIN: "basin",
  REFUGE: "refuge",
  HOLLOW: "hollow",
};
const REGION_BIAS_SYMBOL = {
  none: ".",
  basin: "b",
  refuge: "r",
  hollow: "h",
};
const POI_TYPES = {
  MONUMENT: "monument",
  ROT_SOURCE: "rot_source",
  SPRING: "spring",
  GREAT_FOREST: "great_forest",
};
const POI_EFFECTS = {
  DEFAULT_RADIUS: 4,
  MIN_CENTER_DISTANCE: 5,
  MONUMENT_FIELD_DECAY_MULTIPLIER: 0.5,
  MONUMENT_HAUNTED_FIELD_MULTIPLIER: 0.5,
  MONUMENT_FERTILITY_CHANCE: 0.12,
  MONUMENT_FERTILITY_CAP: 3,
  GREAT_FOREST_RADIUS: 5,
  GREAT_FOREST_CORE_RADIUS: 2,
  GREAT_FOREST_WILD_DECAY_MULTIPLIER: 0.35,
  GREAT_FOREST_FERTILITY_CHANCE: 0.12,
  GREAT_FOREST_BEAST_SPAWN_CHANCE: 0.04,
  GREAT_FOREST_BEAST_LOCAL_CAP: 3,
  GREAT_FOREST_BEAST_TOTAL_CAP: 85,
  ROT_SOURCE_INNER_RADIUS: 1,
  ROT_MARK_RADIUS_ONE_CHANCE: 0.45,
  ROT_FIELD_TO_MARK_RADIUS_THREE_CHANCE: 0.12,
  ROT_MARK_DECAY_MULTIPLIER: 0.5,
  ROT_FERTILITY_LOSS_CHANCE: 0.1,
  SPRING_FERTILITY_CHANCE: 0.18,
  SPRING_FIELD_FERTILITY_CAP: 3,
  SPRING_NEUTRAL_FERTILITY_CAP: 3,
  SPRING_WILD_FERTILITY_CAP: 4,
};
const SUBSTRATE_LAYOUT_COLUMNS = 4;
const SUBSTRATE_LAYOUT_ROWS = 3;
const SUBSTRATE_ROW_HEIGHTS = [8, 8, 9];
const SUBSTRATE_ARCHETYPES = {
  open_basin: REGION_BIAS.BASIN,
  field_basin: REGION_BIAS.BASIN,
  wild_refuge: REGION_BIAS.REFUGE,
  deep_refuge: REGION_BIAS.REFUGE,
  scar_hollow: REGION_BIAS.HOLLOW,
  closed_hollow: REGION_BIAS.HOLLOW,
  plain: REGION_BIAS.NONE,
  choke_pass: REGION_BIAS.NONE,
  barrier_edge: REGION_BIAS.NONE,
};

let world = [];
let tick = 0;
let playing = false;
let timerId = null;
let sleepWasPlayingBefore = false;
let sleepTimerId = null;
let exploreAnimationFrameId = null;
let exploreLastFrameTime = null;
const explorePressedKeys = new Set();

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
const lineageToggle = document.getElementById("lineageToggle");
const viewModeSelect = document.getElementById("viewMode");
const interventionUnitSelect = document.getElementById("interventionUnit");
const mapSeedBrushSelect = document.getElementById("mapSeedBrush");
const mapSeedJsonEl = document.getElementById("mapSeedJson");
const exportMapSeedBtn = document.getElementById("exportMapSeed");
const importMapSeedBtn = document.getElementById("importMapSeed");
const applyMapSeedBtn = document.getElementById("applyMapSeed");
const resetFromMapSeedBtn = document.getElementById("resetFromMapSeed");
const generateMapSeedPresetBtn = document.getElementById("generateMapSeedPreset");
const clearMapSeedBtn = document.getElementById("clearMapSeed");
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
const inspectCurrentPlacesBtn = document.getElementById("inspectCurrentPlaces");
const exportProtoCultureSummaryBtn = document.getElementById("exportProtoCultureSummary");
const clearRecordingBtn = document.getElementById("clearRecording");
const startMacroTimelineBtn = document.getElementById("startMacroTimeline");
const stopMacroTimelineBtn = document.getElementById("stopMacroTimeline");
const exportMacroTimelineBtn = document.getElementById("exportMacroTimeline");
const clearMacroTimelineBtn = document.getElementById("clearMacroTimeline");
const recordingStateEl = document.getElementById("recordingState");
const recordedFramesEl = document.getElementById("recordedFrames");
const recordedKeyframesEl = document.getElementById("recordedKeyframes");
const macroTimelineStateEl = document.getElementById("macroTimelineState");
const macroTimelineFramesEl = document.getElementById("macroTimelineFrames");
const macroTimelineAnalysisFramesEl = document.getElementById("macroTimelineAnalysisFrames");
const lineageTotalEl = document.getElementById("lineageTotal");
const lineageActiveEl = document.getElementById("lineageActive");
const lineageCollapsedEl = document.getElementById("lineageCollapsed");
const lineageDescendantsEl = document.getElementById("lineageDescendants");
const lineageDominantEl = document.getElementById("lineageDominant");
const lineageRecentEventEl = document.getElementById("lineageRecentEvent");
const polityTotalEl = document.getElementById("polityTotal");
const polityActiveEl = document.getElementById("polityActive");
const polityPressuredEl = document.getElementById("polityPressured");
const politySeatlessEl = document.getElementById("politySeatless");
const polityVillagesEl = document.getElementById("polityVillages");
const polityOutpostsEl = document.getElementById("polityOutposts");
const polityDominantEl = document.getElementById("polityDominant");
const polityRecentEventEl = document.getElementById("polityRecentEvent");
const playingStateEl = document.getElementById("playingState");
const gridSizeEl = document.getElementById("gridSize");
const statusMessageEl = document.getElementById("statusMessage");
const macroOverlayEl = document.getElementById("macroOverlay");
const semanticTagInfoPanelEl = document.getElementById("semanticTagInfoPanel");

let recording = createEmptyRecording();
let macroTimeline = createEmptyMacroTimeline();
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
let macroDisplayWorld = null;
let currentSemanticTags = [];
let selectedSemanticTag = null;
let macroDisplayFrame = null;
let macroDisplayMaskCache = { source: null, macroTick: null, populationSerial: null, memorySerial: null, lineageSerial: null, politySerial: null, lineageVisible: null, mode: null, masks: null };
let populationEvolutionState = createEmptyPopulationEvolutionState();
let populationEvolutionFrame = null;
let populationEvolutionSerial = 0;
let macroMemory = createEmptyMacroMemory();
let macroMemorySerial = 0;
let humanLineageMemory = createEmptyHumanLineageMemory();
let humanLineageSerial = 0;
let humanPolityMemory = createEmptyHumanPolityMemory();
let humanPolitySerial = 0;
let playerObserver = null;
let worldPOIs = [];
let activeMapSeed = null;
let mapFeatures = createEmptyMapFeatures();
let placeMemory = createEmptyPlaceMemory();
let currentSleepObservation = null;
let sleepTicksRemaining = 0;
let mapSeedPointerPainting = false;
let lastPaintedSeedCellKey = null;
let interventionLog = [];
let currentRegionalSubstrate = null;
let reachableRadiusCache = { source: null, map: new Map() };
let reachableRadiusCacheEnabled = false;
let localNeighborhoodCacheEnabled = false;
let neighborUnitCache = { source: null, map: new Map() };
let neighborTerrainCache = { source: null, map: new Map() };
let localCellStateCache = { source: null, map: new Map() };
let reachableVisitStamp = 1;
const reachableVisited = new Uint16Array(WIDTH * HEIGHT);
const reachableQueueX = new Int16Array(WIDTH * HEIGHT);
const reachableQueueY = new Int16Array(WIDTH * HEIGHT);
const reachableQueueDistance = new Int16Array(WIDTH * HEIGHT);
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

function createCell(terrain = TERRAIN.EMPTY, unit = null, age = 0, role = "normal", fertility = null, terrainAge = 0, maxAge = null, regionBias = REGION_BIAS.NONE) {
  return {
    terrain,
    unit,
    age: unit ? age : 0,
    role: unit ? role : null,
    terrainAge,
    maxAge: unit === UNIT.SPIRIT ? (maxAge || spiritMaxAge()) : null,
    fertility: clampFertility(fertility ?? fertilityForTerrain(terrain)),
    regionBias: regionBias || REGION_BIAS.NONE,
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

function cloneWorld(source, options = {}) {
  const next = new Array(HEIGHT);
  for (let y = 0; y < HEIGHT; y += 1) {
    const row = new Array(WIDTH);
    next[y] = row;
    for (let x = 0; x < WIDTH; x += 1) {
      const cell = source[y][x];
      const unit = cell.unit;
      row[x] = {
        terrain: cell.terrain,
        unit,
        age: unit ? cell.age || 0 : 0,
        role: unit ? cell.role || "normal" : null,
        terrainAge: cell.terrainAge || 0,
        maxAge: cell.maxAge || null,
        fertility: cell.fertility ?? fertilityForTerrain(cell.terrain),
        regionBias: cell.regionBias || REGION_BIAS.NONE,
      };
    }
  }
  if (options.includeMetadata) {
    if (source.regionalSubstrate) next.regionalSubstrate = cloneRegionalSubstrateLayout(source.regionalSubstrate);
    if (source.pointsOfInterest) next.pointsOfInterest = clonePOIs(source.pointsOfInterest);
    if (source.mapSeed) next.mapSeed = normalizeMapSeed(source.mapSeed);
    if (source.mapFeatures) next.mapFeatures = cloneMapFeatures(source.mapFeatures);
  }
  return next;
}

function clonePOIs(pois = worldPOIs) {
  return (pois || []).map((poi) => ({ ...poi }));
}

function createEmptyMapFeatures() {
  return { rivers: [] };
}

function cloneMapFeatures(features = mapFeatures) {
  return {
    rivers: (features?.rivers || []).map((cell) => ({
      x: Math.floor(cell.x),
      y: Math.floor(cell.y),
    })),
  };
}

function createEmptyPlaceMemory() {
  return {
    version: PLACE_MEMORY_VERSION,
    anchors: [],
    nextId: 1,
    awakeCycleInspectedAnchorIds: [],
    wakeReports: [],
  };
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

function createEmptyMacroTimeline() {
  return {
    isRecording: false,
    startTick: null,
    endTick: null,
    params: null,
    frames: [],
    analysisFrames: [],
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

function pointKey(x, y) {
  return `${Math.floor(x)},${Math.floor(y)}`;
}

function normalizePoint(point) {
  const x = Math.floor(Number(point?.x));
  const y = Math.floor(Number(point?.y));
  if (!inBounds(x, y)) return null;
  return { x, y };
}

function normalizePointList(items = []) {
  const seen = new Set();
  const result = [];
  for (const item of items || []) {
    const point = normalizePoint(item);
    if (!point) continue;
    const key = pointKey(point.x, point.y);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(point);
  }
  return result;
}

function normalizeSeedUnits(units = []) {
  return (units || [])
    .map((unit) => {
      const point = normalizePoint(unit);
      if (!point || !Object.values(UNIT).includes(unit?.type)) return null;
      return { type: unit.type, x: point.x, y: point.y };
    })
    .filter(Boolean);
}

function normalizeSeedPOIs(pois = []) {
  return (pois || [])
    .map((poi, index) => {
      const point = normalizePoint(poi);
      if (!point || !Object.values(POI_TYPES).includes(poi?.type)) return null;
      return {
        id: poi.id || `seed_poi_${index + 1}`,
        type: poi.type,
        x: point.x,
        y: point.y,
        radius: Number.isFinite(Number(poi.radius)) ? Math.max(1, Math.floor(Number(poi.radius))) : undefined,
        strength: Number.isFinite(Number(poi.strength)) ? Number(poi.strength) : undefined,
        state: poi.state || "active",
      };
    })
    .filter(Boolean);
}

function createDefaultMapSeed() {
  return {
    version: MAP_SEED_VERSION,
    name: "Untitled seed",
    width: WIDTH,
    height: HEIGHT,
    units: [],
    mountains: [],
    rivers: [],
    pois: [],
  };
}

function normalizeMapSeed(seed = activeMapSeed || createDefaultMapSeed()) {
  return {
    version: seed.version || MAP_SEED_VERSION,
    name: seed.name || "Untitled seed",
    width: WIDTH,
    height: HEIGHT,
    units: normalizeSeedUnits(seed.units),
    mountains: normalizePointList(seed.mountains),
    rivers: normalizePointList(seed.rivers),
    pois: normalizeSeedPOIs(seed.pois),
  };
}

function serializeMapSeed(seed = activeMapSeed || createDefaultMapSeed()) {
  return JSON.stringify(normalizeMapSeed(seed), null, 2);
}

function parseMapSeedJson(text) {
  return normalizeMapSeed(JSON.parse(text || "{}"));
}

function isRiverCell(x, y, features = mapFeatures) {
  return (features?.rivers || []).some((river) => river.x === x && river.y === y);
}

function getNeighbors(x, y) {
  return NEIGHBORS[y][x];
}

function countNeighborUnits(source, x, y) {
  const cacheKey = y * WIDTH + x;
  if (localNeighborhoodCacheEnabled) {
    if (neighborUnitCache.source !== source) neighborUnitCache = { source, map: new Map() };
    const cached = neighborUnitCache.map.get(cacheKey);
    if (cached) return cached;
  }
  const counts = { H: 0, B: 0, S: 0 };
  for (const n of getNeighbors(x, y)) {
    const unit = source[n.y][n.x].unit;
    if (unit) counts[unit] += 1;
  }
  if (localNeighborhoodCacheEnabled) neighborUnitCache.map.set(cacheKey, counts);
  return counts;
}

function countNeighborTerrains(source, x, y) {
  const cacheKey = y * WIDTH + x;
  if (localNeighborhoodCacheEnabled) {
    if (neighborTerrainCache.source !== source) neighborTerrainCache = { source, map: new Map() };
    const cached = neighborTerrainCache.map.get(cacheKey);
    if (cached) return cached;
  }
  const counts = { ".": 0, F: 0, W: 0, M: 0, X: 0, "#": 0 };
  for (const n of getNeighbors(x, y)) {
    counts[source[n.y][n.x].terrain] += 1;
  }
  if (localNeighborhoodCacheEnabled) neighborTerrainCache.map.set(cacheKey, counts);
  return counts;
}

function countLocalCellState(source, x, y) {
  const cacheKey = y * WIDTH + x;
  if (localNeighborhoodCacheEnabled) {
    if (localCellStateCache.source !== source) localCellStateCache = { source, map: new Map() };
    const cached = localCellStateCache.map.get(cacheKey);
    if (cached) return cached;
  }
  const units = countNeighborUnits(source, x, y);
  const terrains = countNeighborTerrains(source, x, y);
  let emptyUnitNeighbors = 0;
  for (const n of getNeighbors(x, y)) {
    const cell = source[n.y][n.x];
    if (!cell.unit && cell.terrain !== TERRAIN.BLOCK && cell.terrain !== TERRAIN.BORDER) {
      emptyUnitNeighbors += 1;
    }
  }

  const result = {
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
  if (localNeighborhoodCacheEnabled) localCellStateCache.map.set(cacheKey, result);
  return result;
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

function countRegionBias(source) {
  const counts = { none: 0, basin: 0, refuge: 0, hollow: 0 };
  for (const row of source) {
    for (const cell of row) {
      const bias = cell.regionBias || REGION_BIAS.NONE;
      counts[bias] = (counts[bias] || 0) + 1;
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

function isSensingPassable(source, x, y) {
  return !isCellBlockedForMovement(source, x, y);
}

function reachableCellsInRadius(source, x, y, radius, options = {}) {
  const includeOrigin = options.includeOrigin !== false;
  const canUseCache = reachableRadiusCacheEnabled && includeOrigin;
  const cacheKey = (y * WIDTH + x) * 10 + radius;
  if (canUseCache && reachableRadiusCache.source === source) {
    const cached = reachableRadiusCache.map.get(cacheKey);
    if (cached) return cached;
  } else if (canUseCache && reachableRadiusCache.source !== source) {
    reachableRadiusCache = { source, map: new Map() };
  }
  const maxSteps = Math.max(0, radius);
  reachableVisitStamp += 1;
  if (reachableVisitStamp >= 65000) {
    reachableVisited.fill(0);
    reachableVisitStamp = 1;
  }
  let queueStart = 0;
  let queueEnd = 1;
  const cells = [];
  reachableQueueX[0] = x;
  reachableQueueY[0] = y;
  reachableQueueDistance[0] = 0;
  reachableVisited[y * WIDTH + x] = reachableVisitStamp;

  while (queueStart < queueEnd) {
    const currentX = reachableQueueX[queueStart];
    const currentY = reachableQueueY[queueStart];
    const currentDistance = reachableQueueDistance[queueStart];
    queueStart += 1;
    if (includeOrigin || currentX !== x || currentY !== y) cells.push({ x: currentX, y: currentY });
    if (currentDistance >= maxSteps) continue;
    for (const n of getNeighbors(currentX, currentY)) {
      const index = n.y * WIDTH + n.x;
      if (reachableVisited[index] === reachableVisitStamp) continue;
      if (!isSensingPassable(source, n.x, n.y)) continue;
      reachableVisited[index] = reachableVisitStamp;
      reachableQueueX[queueEnd] = n.x;
      reachableQueueY[queueEnd] = n.y;
      reachableQueueDistance[queueEnd] = currentDistance + 1;
      queueEnd += 1;
    }
  }

  if (canUseCache) reachableRadiusCache.map.set(cacheKey, cells);
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

function countReachableUnitInRadius(source, x, y, unit, radius, limit = Infinity) {
  if (Number.isFinite(limit)) {
    let count = 0;
    reachableVisitStamp += 1;
    if (reachableVisitStamp >= 65000) {
      reachableVisited.fill(0);
      reachableVisitStamp = 1;
    }
    let queueStart = 0;
    let queueEnd = 1;
    reachableQueueX[0] = x;
    reachableQueueY[0] = y;
    reachableQueueDistance[0] = 0;
    reachableVisited[y * WIDTH + x] = reachableVisitStamp;
    while (queueStart < queueEnd) {
      const currentX = reachableQueueX[queueStart];
      const currentY = reachableQueueY[queueStart];
      const currentDistance = reachableQueueDistance[queueStart];
      queueStart += 1;
      if ((currentX !== x || currentY !== y) && source[currentY][currentX].unit === unit) {
        count += 1;
        if (count >= limit) return count;
      }
      if (currentDistance >= radius) continue;
      for (const n of getNeighbors(currentX, currentY)) {
        const index = n.y * WIDTH + n.x;
        if (reachableVisited[index] === reachableVisitStamp) continue;
        if (!isSensingPassable(source, n.x, n.y)) continue;
        reachableVisited[index] = reachableVisitStamp;
        reachableQueueX[queueEnd] = n.x;
        reachableQueueY[queueEnd] = n.y;
        reachableQueueDistance[queueEnd] = currentDistance + 1;
        queueEnd += 1;
      }
    }
    return count;
  }
  let count = 0;
  for (const cell of reachableCellsInRadius(source, x, y, radius)) {
    if (cell.x === x && cell.y === y) continue;
    if (source[cell.y][cell.x].unit === unit) {
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

function countReachableTerrainInRadius(source, x, y, terrain, radius, limit = Infinity) {
  if (Number.isFinite(limit)) {
    let count = 0;
    reachableVisitStamp += 1;
    if (reachableVisitStamp >= 65000) {
      reachableVisited.fill(0);
      reachableVisitStamp = 1;
    }
    let queueStart = 0;
    let queueEnd = 1;
    reachableQueueX[0] = x;
    reachableQueueY[0] = y;
    reachableQueueDistance[0] = 0;
    reachableVisited[y * WIDTH + x] = reachableVisitStamp;
    while (queueStart < queueEnd) {
      const currentX = reachableQueueX[queueStart];
      const currentY = reachableQueueY[queueStart];
      const currentDistance = reachableQueueDistance[queueStart];
      queueStart += 1;
      if ((currentX !== x || currentY !== y) && source[currentY][currentX].terrain === terrain) {
        count += 1;
        if (count >= limit) return count;
      }
      if (currentDistance >= radius) continue;
      for (const n of getNeighbors(currentX, currentY)) {
        const index = n.y * WIDTH + n.x;
        if (reachableVisited[index] === reachableVisitStamp) continue;
        if (!isSensingPassable(source, n.x, n.y)) continue;
        reachableVisited[index] = reachableVisitStamp;
        reachableQueueX[queueEnd] = n.x;
        reachableQueueY[queueEnd] = n.y;
        reachableQueueDistance[queueEnd] = currentDistance + 1;
        queueEnd += 1;
      }
    }
    return count;
  }
  let count = 0;
  for (const cell of reachableCellsInRadius(source, x, y, radius)) {
    if (cell.x === x && cell.y === y) continue;
    if (source[cell.y][cell.x].terrain === terrain) {
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
  const refugeBonus = cell.regionBias === REGION_BIAS.REFUGE ? -0.18 : 0;
  if (cell.terrain === TERRAIN.WILD && cell.fertility >= 4) return 1 + refugeBonus;
  if (cell.terrain === TERRAIN.WILD && cell.fertility >= 3) return 2 + refugeBonus;
  if (cell.terrain === TERRAIN.EMPTY && cell.fertility >= 4) return 3 + refugeBonus;
  if (cell.terrain === TERRAIN.EMPTY && cell.fertility >= 3) return 4 + refugeBonus;
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
  reachableVisitStamp += 1;
  if (reachableVisitStamp >= 65000) {
    reachableVisited.fill(0);
    reachableVisitStamp = 1;
  }
  let queueStart = 0;
  let queueEnd = 1;
  reachableQueueX[0] = x;
  reachableQueueY[0] = y;
  reachableQueueDistance[0] = 0;
  reachableVisited[y * WIDTH + x] = reachableVisitStamp;

  while (queueStart < queueEnd) {
    const nx = reachableQueueX[queueStart];
    const ny = reachableQueueY[queueStart];
    const currentDistance = reachableQueueDistance[queueStart];
    queueStart += 1;
    if (nx !== x || ny !== y) {
      const cell = source[ny][nx];
      if (cell.unit === UNIT.SPIRIT || (cell.terrain === TERRAIN.MARK && countNeighborTerrains(source, nx, ny).M >= 2)) {
        const distance = Math.hypot(nx - x, ny - y);
        if (distance < bestDistance) {
          best = { x: nx, y: ny };
          bestDistance = distance;
        }
      }
    }
    if (currentDistance >= radius) continue;
    for (const n of getNeighbors(nx, ny)) {
      const index = n.y * WIDTH + n.x;
      if (reachableVisited[index] === reachableVisitStamp) continue;
      if (!isSensingPassable(source, n.x, n.y)) continue;
      reachableVisited[index] = reachableVisitStamp;
      reachableQueueX[queueEnd] = n.x;
      reachableQueueY[queueEnd] = n.y;
      reachableQueueDistance[queueEnd] = currentDistance + 1;
      queueEnd += 1;
    }
  }
  return best;
}

function findReachableNearestRot(source, x, y, radius) {
  return findNearestRot(source, x, y, radius);
}

function cachedNearestRot(source, x, y, radius) {
  if (!movementRotCache) return findNearestRot(source, x, y, radius);
  const key = (y * WIDTH + x) * 10 + radius;
  if (!movementRotCache.has(key)) {
    const hasNearbyRot = countUnitInRadius(source, x, y, UNIT.SPIRIT, radius, 1) > 0 ||
      countTerrainInRadius(source, x, y, TERRAIN.MARK, radius, 1) > 0;
    movementRotCache.set(key, hasNearbyRot ? findNearestRot(source, x, y, radius) : null);
  }
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
  if (cell.unit || isCellBlockedForMovement(source, x, y)) return false;
  if (cell.terrain === TERRAIN.MARK && !allowMark) return false;
  return true;
}

function findSettlerTarget(source, x, y) {
  let best = null;
  reachableVisitStamp += 1;
  if (reachableVisitStamp >= 65000) {
    reachableVisited.fill(0);
    reachableVisitStamp = 1;
  }
  let queueStart = 0;
  let queueEnd = 1;
  reachableQueueX[0] = x;
  reachableQueueY[0] = y;
  reachableQueueDistance[0] = 0;
  reachableVisited[y * WIDTH + x] = reachableVisitStamp;

  while (queueStart < queueEnd) {
    const nx = reachableQueueX[queueStart];
    const ny = reachableQueueY[queueStart];
    const currentDistance = reachableQueueDistance[queueStart];
    queueStart += 1;
    if (nx !== x || ny !== y) {
      const cell = source[ny][nx];
      if (!cell.unit && cell.terrain !== TERRAIN.BLOCK && cell.terrain !== TERRAIN.BORDER && cell.terrain !== TERRAIN.MARK) {
        const rank = settlerTargetRank(cell);
        if (Number.isFinite(rank)) {
          const units = countNeighborUnits(source, nx, ny);
          const danger = units.S * 100 + Math.max(0, units.B - 1) * 8;
          const distance = Math.hypot(nx - x, ny - y);
          const score = rank * 100 + danger + distance;
          if (!best || score < best.score) best = { x: nx, y: ny, score };
        }
      }
    }
    if (currentDistance >= 6) continue;
    for (const n of getNeighbors(nx, ny)) {
      const index = n.y * WIDTH + n.x;
      if (reachableVisited[index] === reachableVisitStamp) continue;
      if (!isSensingPassable(source, n.x, n.y)) continue;
      reachableVisited[index] = reachableVisitStamp;
      reachableQueueX[queueEnd] = n.x;
      reachableQueueY[queueEnd] = n.y;
      reachableQueueDistance[queueEnd] = currentDistance + 1;
      queueEnd += 1;
    }
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
  if (cell.unit || isCellBlockedForMovement(source, toX, toY)) return false;
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
  if (isCellBlockedForMovement(source, toX, toY)) return -1;
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
  if (unit === UNIT.HUMAN && source[y][x].terrain === TERRAIN.FIELD && local.h >= 1 && !onFrontier) {
    const visibleBeastForHunt = local.h >= 2 &&
      countUnitInRadius(source, x, y, UNIT.BEAST, 2, 1) > 0 &&
      countReachableUnitInRadius(source, x, y, UNIT.BEAST, 2, 1) > 0;
    if (!visibleBeastForHunt) {
      if (Math.random() < SCOUT_CHANCE) return chooseScoutMove(source, unit, x, y);
      return { x, y };
    }
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
  reachableRadiusCacheEnabled = true;
  reachableRadiusCache = { source, map: new Map() };
  localNeighborhoodCacheEnabled = true;
  neighborUnitCache = { source, map: new Map() };
  neighborTerrainCache = { source, map: new Map() };
  localCellStateCache = { source, map: new Map() };
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
      const key = target.y * WIDTH + target.x;
      if (!targetMap.has(key)) targetMap.set(key, []);
      targetMap.get(key).push(plan);
    }
  }

  const next = cloneWorld(source);
  for (const row of next) {
    for (const cell of row) cell.unit = null;
  }

  for (const plan of plans) {
    const key = plan.toY * WIDTH + plan.toX;
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
  reachableRadiusCacheEnabled = false;
  localNeighborhoodCacheEnabled = false;
  neighborUnitCache = { source: null, map: new Map() };
  neighborTerrainCache = { source: null, map: new Map() };
  localCellStateCache = { source: null, map: new Map() };
  return next;
}

// terrain rewrite
function applyTerrainRewrite(source, pois = worldPOIs) {
  const next = cloneWorld(source);
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const cell = next[y][x];
      if (cell.terrain === TERRAIN.BLOCK) continue;
      if (!cell.unit) continue;
      const units = countNeighborUnits(source, x, y);

      const makeField = () => {
        if (cell.terrain === TERRAIN.FIELD || cell.terrain === TERRAIN.MARK || cell.terrain === TERRAIN.BLOCK || cell.terrain === TERRAIN.BORDER) return false;
        if (cell.terrain === TERRAIN.WILD && hasGreatForestCore(x, y, pois)) return false;
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
                !(neighbor.terrain === TERRAIN.WILD && hasGreatForestCore(n.x, n.y, pois)) &&
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

      if (cell.unit === UNIT.BEAST &&
        !hasGreatForestInfluence(x, y) &&
        units.B === 0 &&
        countAreaTerrain(source, x, y, new Set([TERRAIN.WILD, TERRAIN.FIELD, TERRAIN.MARK])) === 0) {
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
        const basinFactor = cell.regionBias === REGION_BIAS.BASIN ? 0.75 : 1;
        const hollowFactor = cell.regionBias === REGION_BIAS.HOLLOW ? 1.25 : 1;
        const collapseDeathChance = HUMAN_COLLAPSE_DEATH_CHANCE * basinFactor * hollowFactor;
        const markStressDeathChance = MARK_HUMAN_STRESS_DEATH_CHANCE * basinFactor * hollowFactor;
        dies = (age >= HUMAN_MAX_AGE && Math.random() < HUMAN_OLD_AGE_DEATH_CHANCE) ||
          (age >= 8 && Math.random() < HUMAN_BASELINE_DEATH_CHANCE) ||
          (local.condition === "collapse" && Math.random() < collapseDeathChance) ||
          (terrains.M >= 2 && units.S > 0 && units.H < 2 && Math.random() < markStressDeathChance);
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
        if (cell.regionBias === REGION_BIAS.REFUGE && cell.fertility < 3 && Math.random() < 0.04) target.fertility = clampFertility(cell.fertility + 1);
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

function activePOIsOfType(type, pois = worldPOIs) {
  return (pois || []).filter((poi) => poi.type === type && poi.state === "active");
}

function applyRiverFertility(source, rivers = mapFeatures.rivers, options = {}) {
  if (!rivers || rivers.length === 0) return source;
  const next = cloneWorld(source);
  for (const river of rivers) {
    for (const n of getNeighbors(river.x, river.y)) {
      const cell = next[n.y][n.x];
      if (!cell || cell.terrain === TERRAIN.BLOCK || isRiverCell(n.x, n.y, { rivers })) continue;
      if (cell.fertility >= RIVER_FERTILITY_MAX) continue;
      if (options.force || Math.random() < RIVER_FERTILITY_RESTORE_CHANCE) {
        cell.fertility = Math.min(RIVER_FERTILITY_MAX, clampFertility((cell.fertility || 0) + 1));
      }
    }
  }
  return next;
}

function isInsidePOI(poi, x, y, radius = poi.radius) {
  return distance(poi, { x, y }) <= radius;
}

function isPOIHardBlocker(x, y, pois = worldPOIs) {
  return (pois || []).some((poi) =>
    poi.state === "active" &&
    poi.type === POI_TYPES.SPRING &&
    poi.x === x &&
    poi.y === y
  );
}

function isCellBlockedForMovement(source, x, y, pois = worldPOIs) {
  const terrain = source[y][x].terrain;
  return terrain === TERRAIN.BLOCK || terrain === TERRAIN.BORDER || isPOIHardBlocker(x, y, pois) || isRiverCell(x, y);
}

function getExploreCellBlockerReason(source, x, y, pois = worldPOIs) {
  const cellX = Math.floor(x);
  const cellY = Math.floor(y);
  if (!inBounds(cellX, cellY)) return "edge";
  const cell = source?.[cellY]?.[cellX];
  if (!cell) return "edge";
  if (cell.terrain === TERRAIN.BLOCK) return "BLOCK";
  if (cell.terrain === TERRAIN.BORDER) return "BORDER";
  if (isRiverCell(cellX, cellY)) return "river";
  if (isPOIHardBlocker(cellX, cellY, pois)) return "spring";
  return null;
}

function createDefaultPlayerObserver() {
  return {
    x: Math.floor(WIDTH / 2),
    y: Math.floor(HEIGHT / 2),
    vx: 0,
    vy: 0,
    facing: "S",
    isSleeping: false,
    lastInteraction: null,
  };
}

function isExploreCellPassable(source, x, y, pois = worldPOIs) {
  return getExploreCellBlockerReason(source, x, y, pois) === null;
}

function createPlayerObserver(source = world, pois = worldPOIs) {
  if (!source?.length) return createDefaultPlayerObserver();
  const center = { x: Math.floor(WIDTH / 2), y: Math.floor(HEIGHT / 2) };
  let best = null;
  let bestDistance = Infinity;
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      if (!isExploreCellPassable(source, x, y, pois)) continue;
      const emptyBias = source[y][x].unit ? 4 : 0;
      const d = Math.hypot(x - center.x, y - center.y) + emptyBias;
      if (d < bestDistance) {
        best = { x, y };
        bestDistance = d;
      }
    }
  }
  if (!best) best = { x: 0, y: 0 };
  return { ...createDefaultPlayerObserver(), x: best.x + 0.5, y: best.y + 0.5 };
}

function ensurePlayerObserver(source = world, pois = worldPOIs) {
  if (!playerObserver || !isExploreCellPassable(source, playerObserver.x, playerObserver.y, pois)) {
    playerObserver = createPlayerObserver(source, pois);
  }
  return playerObserver;
}

function playerDirectionForDelta(dx, dy) {
  if (Math.abs(dx) >= Math.abs(dy) && dx !== 0) return dx > 0 ? "E" : "W";
  if (dy !== 0) return dy > 0 ? "S" : "N";
  return playerObserver?.facing || "S";
}

function collidesExplorePosition(source, x, y, pois = worldPOIs) {
  const samples = [
    { x, y },
    { x: x - EXPLORE_PLAYER_RADIUS, y: y - EXPLORE_PLAYER_RADIUS },
    { x: x + EXPLORE_PLAYER_RADIUS, y: y - EXPLORE_PLAYER_RADIUS },
    { x: x - EXPLORE_PLAYER_RADIUS, y: y + EXPLORE_PLAYER_RADIUS },
    { x: x + EXPLORE_PLAYER_RADIUS, y: y + EXPLORE_PLAYER_RADIUS },
  ];
  return samples.some((point) => !isExploreCellPassable(source, point.x, point.y, pois));
}

function updatePlayerObserverContinuous(deltaSeconds, input = {}, source = world, pois = worldPOIs) {
  const player = ensurePlayerObserver(source, pois);
  if (player.isSleeping) return player;
  let dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  if (dx !== 0 || dy !== 0) {
    const length = Math.hypot(dx, dy);
    dx /= length;
    dy /= length;
    player.facing = playerDirectionForDelta(dx, dy);
  }
  const speed = EXPLORE_PLAYER_SPEED_CELLS_PER_SECOND;
  const nextX = player.x + dx * speed * deltaSeconds;
  const nextY = player.y + dy * speed * deltaSeconds;
  if (!collidesExplorePosition(source, nextX, player.y, pois)) player.x = nextX;
  if (!collidesExplorePosition(source, player.x, nextY, pois)) player.y = nextY;
  player.vx = dx * speed;
  player.vy = dy * speed;
  return player;
}

function movePlayerObserver(dx, dy, source = world, pois = worldPOIs) {
  const input = { left: dx < 0, right: dx > 0, up: dy < 0, down: dy > 0 };
  const deltaSeconds = Math.max(0.02, Math.min(0.2, Math.hypot(dx, dy) / EXPLORE_PLAYER_SPEED_CELLS_PER_SECOND));
  const before = { ...ensurePlayerObserver(source, pois) };
  const moved = updatePlayerObserverContinuous(deltaSeconds, input, source, pois);
  if (Math.abs(dx) >= 1 || Math.abs(dy) >= 1) {
    moved.x = Math.round(moved.x);
    moved.y = Math.round(moved.y);
    if (collidesExplorePosition(source, moved.x, moved.y, pois)) {
      moved.x = before.x;
      moved.y = before.y;
    }
  }
  return moved;
}

function exploreInputStateFromKeys() {
  return {
    up: explorePressedKeys.has("KeyW") || explorePressedKeys.has("ArrowUp"),
    left: explorePressedKeys.has("KeyA") || explorePressedKeys.has("ArrowLeft"),
    down: explorePressedKeys.has("KeyS") || explorePressedKeys.has("ArrowDown"),
    right: explorePressedKeys.has("KeyD") || explorePressedKeys.has("ArrowRight"),
  };
}

function hasExploreMovementInput() {
  const input = exploreInputStateFromKeys();
  return input.up || input.left || input.down || input.right;
}

function stopExploreAnimationLoop() {
  if (exploreAnimationFrameId !== null && typeof cancelAnimationFrame === "function") cancelAnimationFrame(exploreAnimationFrameId);
  exploreAnimationFrameId = null;
  exploreLastFrameTime = null;
}

function exploreAnimationStep(timestamp) {
  exploreAnimationFrameId = null;
  const player = ensurePlayerObserver(world, worldPOIs);
  if (viewModeSelect?.value !== "explore" || player.isSleeping || !hasExploreMovementInput()) {
    stopExploreAnimationLoop();
    return;
  }
  const last = exploreLastFrameTime ?? timestamp;
  const deltaSeconds = Math.max(0.001, Math.min(0.05, (timestamp - last) / 1000));
  exploreLastFrameTime = timestamp;
  updatePlayerObserverContinuous(deltaSeconds, exploreInputStateFromKeys(), world, worldPOIs);
  renderWorld();
  if (typeof requestAnimationFrame === "function") exploreAnimationFrameId = requestAnimationFrame(exploreAnimationStep);
}

function startExploreAnimationLoop() {
  if (exploreAnimationFrameId !== null || typeof requestAnimationFrame !== "function") return;
  exploreLastFrameTime = null;
  exploreAnimationFrameId = requestAnimationFrame(exploreAnimationStep);
}

function exploreViewportBounds(player = ensurePlayerObserver()) {
  const cols = EXPLORE_VIEWPORT_COLS;
  const rows = EXPLORE_VIEWPORT_ROWS;
  const maxStartX = Math.max(0, WIDTH - cols);
  const maxStartY = Math.max(0, HEIGHT - rows);
  const startX = Math.max(0, Math.min(maxStartX, Math.round(player.x - Math.floor(cols / 2))));
  const startY = Math.max(0, Math.min(maxStartY, Math.round(player.y - Math.floor(rows / 2))));
  return { startX, startY, cols, rows };
}

function getExploreViewportCells(player = ensurePlayerObserver(), source = world) {
  const bounds = exploreViewportBounds(player);
  const cells = [];
  for (let row = 0; row < bounds.rows; row += 1) {
    for (let col = 0; col < bounds.cols; col += 1) {
      const worldX = bounds.startX + col;
      const worldY = bounds.startY + row;
      cells.push({ col, row, worldX, worldY, cell: source[worldY][worldX] });
    }
  }
  return { ...bounds, cells };
}

function getExploreViewportRenderModel(player = ensurePlayerObserver(), source = world) {
  const viewport = getExploreViewportCells(player, source);
  const macroMasks = buildMacroDisplayMasks(source, "macro");
  const cells = viewport.cells.map((entry) => {
    const cell = entry.cell;
    const macroClass = macroMasks.cellClasses[entry.worldY]?.[entry.worldX] || "";
    const poiCenter = worldPOIs.some((poi) => poi.state === "active" && poi.x === entry.worldX && poi.y === entry.worldY);
    const riverClass = isRiverCell(entry.worldX, entry.worldY) ? " map-river" : "";
    const blockerReason = getExploreCellBlockerReason(source, entry.worldX, entry.worldY, worldPOIs);
    const blockerClass = blockerReason ? ` explore-blocker explore-blocker-${blockerReason.toLowerCase()}` : "";
    return {
      ...entry,
      terrain: cell.terrain,
      unit: cell.unit || "",
      fertility: cell.fertility || 0,
      macroClass,
      blockerReason,
      className: `cell ${terrainClass(cell.terrain)} ${fertilityClass(cell.fertility)}${riverClass}${macroClass ? ` ${macroClass}` : ""}${poiCenter ? " poi-center" : ""}${blockerClass}`,
    };
  });
  return {
    ...viewport,
    gridClasses: ["macro-view", "explore-view"],
    player: {
      x: player.x,
      y: player.y,
      leftPercent: ((player.x - viewport.startX) / viewport.cols) * 100,
      topPercent: ((player.y - viewport.startY) / viewport.rows) * 100,
      facing: player.facing,
    },
    cells,
  };
}

function exploreInteractionPriority(target) {
  const label = target?.label || "";
  if (target?.source === "poi" || ["Rot Source", "Spring", "Great Forest", "Monument"].includes(label)) return 10;
  if (label === "H seat" || label === "H pressured seat") return 20;
  if (label === "H old seat") return 30;
  if (label === "H village") return 40;
  if (label === "H outpost") return 50;
  if (label === "H remnant") return 60;
  if (label === "S scar") return 70;
  if (label === "B range") return 80;
  if (label === "H domain") return 90;
  return 120;
}

function poiToSemanticTag(poi) {
  const label = poiTagLabel(poi.type);
  return {
    type: `poi_${poi.type}`,
    label,
    x: poi.x,
    y: poi.y,
    source: "poi",
    sourceId: poi.id || null,
    category: poiTagCategory(poi.type),
    priority: 12,
  };
}

function humanVillageExploreTargets() {
  return (humanPolityMemory.villages || []).flatMap((village) => {
    if (isRiverCell(village.x, village.y)) return [];
    if (village.state === "fading") return [];
    const polity = findHumanPolityById(village.polityId || village.previousPolityId);
    if (polity?.state === "collapsed" && village.state !== "remnant") return [];
    return [{
      type: village.state === "remnant" ? "polity_remnant" : "polity_village",
      label: village.state === "remnant" ? "H remnant" : "H village",
      x: village.x,
      y: village.y,
      source: "polity",
      sourceId: village.id,
      category: village.state === "remnant" ? "remnant" : "lineage",
      ...humanPolityTagFields(polity, village, village.lineageId, village.state),
      previousPolityId: village.previousPolityId || null,
      inheritedFromPolityId: village.inheritedFromPolityId || null,
      memorySeed: village.memorySeed || null,
    }];
  });
}

function humanSeatExploreTargets() {
  const targets = [];
  for (const polity of humanPolityMemory.polities || []) {
    if (polity.state === "collapsed") continue;
    if (polity.currentSeat) {
      targets.push({
        type: "polity_seat",
        label: polity.currentSeat.state === "pressured" || polity.currentSeat.state === "corrupted" ? "H pressured seat" : "H seat",
        x: polity.currentSeat.x,
        y: polity.currentSeat.y,
        source: "polity",
        sourceId: `${polity.id}_seat`,
        category: "lineage",
        ...humanPolityTagFields(polity, polity.currentSeat, polity.currentSeat.lineageId, polity.currentSeat.state || polity.state),
      });
    }
    for (const oldSeat of polity.oldSeats || []) {
      targets.push({
        type: "polity_old_seat",
        label: "H old seat",
        x: oldSeat.x,
        y: oldSeat.y,
        source: "polity",
        sourceId: `${polity.id}_old_${oldSeat.x}_${oldSeat.y}`,
        category: "lineage",
        ...humanPolityTagFields(polity, oldSeat, oldSeat.lineageId, "old"),
        reason: oldSeat.reason || null,
        abandonedTick: oldSeat.abandonedTick,
      });
    }
  }
  return targets;
}

function humanOutpostExploreTargets() {
  return (humanLineageMemory.humanOutposts || []).flatMap((outpost) => {
    if (outpost.state === "fading") return [];
    const polity = outpost.polityId ? findHumanPolityById(outpost.polityId) : findHumanPolityForLineage(humanLineageById(outpost.lineageId));
    if (polity?.state === "collapsed") return [];
    return [{
      type: "lineage_outpost",
      label: "H outpost",
      x: outpost.x,
      y: outpost.y,
      source: "lineage",
      sourceId: outpost.id,
      category: "lineage",
      ...humanPolityTagFields(polity, outpost, outpost.lineageId, outpost.state),
    }];
  });
}

function dedupeExploreTargets(targets) {
  const seen = new Set();
  const result = [];
  for (const target of targets) {
    const key = `${target.label}|${target.sourceId || ""}|${Math.round(target.x * 10)},${Math.round(target.y * 10)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(target);
  }
  return result;
}

function collectExploreInteractionTargets(source = world, tags = createSemanticTags(source, { mode: "macro" }), pois = worldPOIs) {
  const player = ensurePlayerObserver(source, pois);
  const viewport = exploreViewportBounds(player);
  const visibleTags = (tags || []).filter((tag) => tag.x >= viewport.startX && tag.x < viewport.startX + viewport.cols && tag.y >= viewport.startY && tag.y < viewport.startY + viewport.rows);
  const visibleRivers = (mapFeatures.rivers || [])
    .filter((river) => river.x >= viewport.startX && river.x < viewport.startX + viewport.cols && river.y >= viewport.startY && river.y < viewport.startY + viewport.rows)
    .map((river) => ({
      label: "River",
      type: "river",
      source: "river",
      sourceId: `river_${river.x}_${river.y}`,
      category: "map",
      x: river.x,
      y: river.y,
      placeType: "river",
    }));
  return dedupeExploreTargets([
    ...visibleTags,
    ...(pois || []).filter((poi) => poi.state !== "inactive").map(poiToSemanticTag),
    ...visibleRivers,
    ...humanVillageExploreTargets(),
    ...humanSeatExploreTargets(),
    ...humanOutpostExploreTargets(),
  ]);
}

function findExploreInteractionTarget(source = world, tags = createSemanticTags(source, { mode: "macro" }), pois = worldPOIs) {
  const player = ensurePlayerObserver(source, pois);
  const candidates = collectExploreInteractionTargets(source, tags, pois)
    .map((target) => ({ ...target, distance: Math.hypot(target.x - player.x, target.y - player.y) }))
    .filter((target) => target.distance <= EXPLORE_INTERACT_RANGE)
    .sort((a, b) => exploreInteractionPriority(a) - exploreInteractionPriority(b) || a.distance - b.distance);
  return candidates[0] || null;
}

function inspectNearbyExploreTrace() {
  const source = macroDisplayWorld || world;
  const tags = createSemanticTags(source, { mode: "macro" });
  const target = findExploreInteractionTarget(source, tags, worldPOIs);
  if (!target) {
    ensurePlayerObserver().lastInteraction = null;
    showStatus("No nearby trace");
    return null;
  }
  const mutableTarget = JSON.parse(JSON.stringify(target));
  inspectPlaceTarget(mutableTarget, source);
  ensurePlayerObserver().lastInteraction = JSON.parse(JSON.stringify(mutableTarget));
  showSemanticTagInfo(mutableTarget);
  return mutableTarget;
}

function beginSleepObservation() {
  const anchorIds = placeMemory.awakeCycleInspectedAnchorIds.slice();
  currentSleepObservation = {
    startedAtTick: tick,
    anchorIds,
    beforeSnapshots: Object.fromEntries(anchorIds.map((id) => {
      const anchor = placeMemory.anchors.find((item) => item.id === id);
      return [id, anchor?.currentSnapshot ? JSON.parse(JSON.stringify(anchor.currentSnapshot)) : null];
    })),
  };
}

function completeSleepObservation(source = world) {
  if (!currentSleepObservation) return null;
  const entries = [];
  for (const id of currentSleepObservation.anchorIds) {
    const anchor = placeMemory.anchors.find((item) => item.id === id);
    if (!anchor) continue;
    const before = currentSleepObservation.beforeSnapshots[id] || anchor.currentSnapshot;
    const after = snapshotPlace(anchor, source);
    anchor.previousSnapshot = anchor.currentSnapshot;
    anchor.currentSnapshot = after;
    updateRememberedHumanIdentity(anchor, anchor.currentSnapshot);
    if (anchor.rememberedHumanIdentity && !anchor.currentSnapshot.rememberedHumanIdentity) {
      anchor.currentSnapshot.rememberedHumanIdentity = JSON.parse(JSON.stringify(anchor.rememberedHumanIdentity));
      anchor.currentSnapshot.protoCultureHints = deriveProtoCultureHints(anchor.currentSnapshot, anchor.currentSnapshot.semanticTraits, anchor.currentSnapshot.placeArchetype, anchor);
    }
    anchor.protoCultureMemory = updateProtoCultureMemory(anchor.protoCultureMemory, anchor.currentSnapshot.protoCultureHints || [], tick);
    const updatedChange = computePlaceChange(anchor, before, after);
    anchor.changeSinceLastSleep = updatedChange;
    anchor.lastSleepObservedTick = tick;
    if (!updatedChange.visibleToPlayer) continue;
    entries.push({
      anchorId: anchor.id,
      displayName: anchor.displayName,
      type: anchor.type,
      position: anchor.position,
      playerText: updatedChange.playerText,
      llmContext: updatedChange.llmContext,
    });
  }
  const report = {
    version: PLACE_MEMORY_VERSION,
    startedAtTick: currentSleepObservation.startedAtTick,
    wokeAtTick: tick,
    entries,
    message: entries.length ? "While you slept, remembered places kept changing." : currentSleepObservation.anchorIds.length ? "No watched place showed a meaningful change while you slept." : "While you slept, no inspected places were being watched.",
  };
  placeMemory.wakeReports.push(report);
  placeMemory.awakeCycleInspectedAnchorIds = [];
  currentSleepObservation = null;
  return report;
}

function showWakeReport(report) {
  if (!report) return;
  const lines = ["While You Slept"];
  if (report.entries.length === 0) {
    lines.push(report.message);
  } else {
    for (const entry of report.entries) {
      lines.push(`${entry.displayName}: ${entry.playerText[0] || ""}`.trim());
    }
  }
  if (semanticTagInfoPanelEl) {
    semanticTagInfoPanelEl.className = "semantic-tag-info-panel visible";
    setElementAttribute(semanticTagInfoPanelEl, "aria-hidden", "false");
    semanticTagInfoPanelEl.innerHTML = "";
    semanticTagInfoPanelEl.textContent = lines.join("\n");
  }
}

function updateExploreSleepAfterStep() {
  const player = playerObserver;
  if (!player?.isSleeping || sleepTicksRemaining <= 0) return;
  sleepTicksRemaining -= 1;
  if (sleepTicksRemaining <= 0) wakeExploreSleep();
}

function runExploreSleepTick() {
  if (!playerObserver?.isSleeping) return;
  runStepSafely();
}

function startExploreSleepTimer() {
  if (sleepTimerId !== null || timerId !== null) return;
  sleepTimerId = setInterval(runExploreSleepTick, EXPLORE_SLEEP_TICK_MS);
}

function stopExploreSleepTimer() {
  if (sleepTimerId !== null) {
    clearInterval(sleepTimerId);
    sleepTimerId = null;
  }
}

function enterExploreSleep({ wasPlaying = playing } = {}) {
  const player = ensurePlayerObserver();
  if (player.isSleeping) return player;
  sleepWasPlayingBefore = Boolean(wasPlaying);
  player.isSleeping = true;
  sleepTicksRemaining = EXPLORE_SLEEP_TICKS_PER_REST;
  beginSleepObservation();
  explorePressedKeys.clear();
  stopExploreAnimationLoop();
  if (viewModeSelect) viewModeSelect.value = "explore";
  if (!sleepWasPlayingBefore && timerId === null) startExploreSleepTimer();
  analyzeMacroWorldNow();
  refreshMacroDisplayFrame({ force: true, mode: "macro" });
  showStatus("Sleeping - world is changing, press E to wake");
  renderWorld();
  return player;
}

function wakeExploreSleep() {
  const player = ensurePlayerObserver();
  player.isSleeping = false;
  stopExploreSleepTimer();
  sleepTicksRemaining = 0;
  const report = completeSleepObservation();
  if (viewModeSelect) viewModeSelect.value = "explore";
  showStatus(report?.entries?.length ? "Woke up - remembered places have a report." : "Explore: WASD move, Space inspect, E sleep/wake");
  showWakeReport(report);
  renderWorld();
  return player;
}

function toggleExploreSleep() {
  return ensurePlayerObserver().isSleeping ? wakeExploreSleep() : enterExploreSleep();
}

function hasPOIInfluence(type, x, y, radius = POI_EFFECTS.DEFAULT_RADIUS, pois = worldPOIs) {
  return activePOIsOfType(type, pois).some((poi) => isInsidePOI(poi, x, y, radius));
}

function hasGreatForestCore(x, y, pois = worldPOIs) {
  return activePOIsOfType(POI_TYPES.GREAT_FOREST, pois)
    .some((poi) => isInsidePOI(poi, x, y, poi.coreRadius || POI_EFFECTS.GREAT_FOREST_CORE_RADIUS));
}

function hasGreatForestInfluence(x, y, pois = worldPOIs) {
  return hasPOIInfluence(POI_TYPES.GREAT_FOREST, x, y, POI_EFFECTS.GREAT_FOREST_RADIUS, pois);
}

function poiAdjustedFieldDecayChance(baseChance, x, y, kind = "decay", pois = worldPOIs) {
  if (!hasPOIInfluence(POI_TYPES.MONUMENT, x, y, POI_EFFECTS.DEFAULT_RADIUS, pois)) return baseChance;
  const multiplier = kind === "haunted" ? POI_EFFECTS.MONUMENT_HAUNTED_FIELD_MULTIPLIER : POI_EFFECTS.MONUMENT_FIELD_DECAY_MULTIPLIER;
  return baseChance * multiplier;
}

function poiAdjustedMarkDecayChance(baseChance, x, y, pois = worldPOIs) {
  if (!hasPOIInfluence(POI_TYPES.ROT_SOURCE, x, y, POI_EFFECTS.DEFAULT_RADIUS, pois)) return baseChance;
  return baseChance * POI_EFFECTS.ROT_MARK_DECAY_MULTIPLIER;
}

function poiAdjustedWildDecayChance(baseChance, x, y, pois = worldPOIs) {
  if (!hasGreatForestInfluence(x, y, pois)) return baseChance;
  return baseChance * POI_EFFECTS.GREAT_FOREST_WILD_DECAY_MULTIPLIER;
}

function springFertilityCap(source, x, y, terrain) {
  if (terrain === TERRAIN.FIELD) return POI_EFFECTS.SPRING_FIELD_FERTILITY_CAP;
  const local = countLocalCellState(source, x, y);
  if (terrain === TERRAIN.WILD || local.w > 0 || local.b > 0) return POI_EFFECTS.SPRING_WILD_FERTILITY_CAP;
  return POI_EFFECTS.SPRING_NEUTRAL_FERTILITY_CAP;
}

function canGreatForestSpawnBeast(source, x, y, totalBeasts = countWorld(source).units.B) {
  const cell = source[y][x];
  if (cell.unit || cell.terrain === TERRAIN.BLOCK || cell.terrain === TERRAIN.BORDER || cell.terrain === TERRAIN.MARK) return false;
  if (cell.terrain !== TERRAIN.WILD && cell.terrain !== TERRAIN.EMPTY) return false;
  const local = countLocalCellState(source, x, y);
  if (local.b >= POI_EFFECTS.GREAT_FOREST_BEAST_LOCAL_CAP) return false;
  if (totalBeasts >= POI_EFFECTS.GREAT_FOREST_BEAST_TOTAL_CAP) return false;
  return true;
}

function applyPOIEffects(source, pois = worldPOIs, options = {}) {
  const random = options.random || Math.random;
  const mutate = options.mutate === true;
  const next = mutate ? source : cloneWorld(source);
  const totalBeasts = countWorld(source).units.B;
  const terrainSnapshot = mutate ? new Map() : null;
  if (terrainSnapshot) {
    for (const poi of pois || []) {
      if (poi.state !== "active") continue;
      for (const offset of RADIUS_OFFSETS[poi.radius || POI_EFFECTS.DEFAULT_RADIUS]) {
        const x = poi.x + offset.dx;
        const y = poi.y + offset.dy;
        if (inBounds(x, y)) terrainSnapshot.set(y * WIDTH + x, source[y][x].terrain);
      }
    }
  }
  for (const poi of pois || []) {
    if (poi.state !== "active") continue;
    for (const offset of RADIUS_OFFSETS[poi.radius || POI_EFFECTS.DEFAULT_RADIUS]) {
      const x = poi.x + offset.dx;
      const y = poi.y + offset.dy;
      if (!inBounds(x, y)) continue;
      const sourceTerrain = terrainSnapshot ? terrainSnapshot.get(y * WIDTH + x) : source[y][x].terrain;
      const target = next[y][x];
      if (sourceTerrain === TERRAIN.BLOCK) continue;
      const distanceFromCenter = Math.hypot(offset.dx, offset.dy);

      if (poi.type === POI_TYPES.MONUMENT) {
        if ((sourceTerrain === TERRAIN.FIELD || sourceTerrain === TERRAIN.EMPTY) &&
          target.fertility < POI_EFFECTS.MONUMENT_FERTILITY_CAP &&
          random() < POI_EFFECTS.MONUMENT_FERTILITY_CHANCE) {
          target.fertility = clampFertility(target.fertility + 1);
        }
      } else if (poi.type === POI_TYPES.ROT_SOURCE) {
        const innerRadius = poi.innerRadius || POI_EFFECTS.ROT_SOURCE_INNER_RADIUS;
        if (distanceFromCenter <= innerRadius && sourceTerrain !== TERRAIN.BORDER) {
          target.terrain = TERRAIN.MARK;
          target.terrainAge = 0;
        } else if (distanceFromCenter <= 3 &&
          sourceTerrain === TERRAIN.FIELD &&
          target.unit !== UNIT.HUMAN &&
          random() < POI_EFFECTS.ROT_FIELD_TO_MARK_RADIUS_THREE_CHANCE) {
          target.terrain = TERRAIN.MARK;
          target.terrainAge = 0;
        }
        const lossChance = distanceFromCenter <= 3 ? POI_EFFECTS.ROT_FERTILITY_LOSS_CHANCE : POI_EFFECTS.ROT_FERTILITY_LOSS_CHANCE * 0.55;
        if (sourceTerrain !== TERRAIN.BORDER && target.fertility > 0 && random() < lossChance) {
          target.fertility = clampFertility(target.fertility - 1);
        }
      } else if (poi.type === POI_TYPES.SPRING) {
        if (sourceTerrain !== TERRAIN.MARK && sourceTerrain !== TERRAIN.BORDER &&
          random() < POI_EFFECTS.SPRING_FERTILITY_CHANCE) {
          const cap = springFertilityCap(source, x, y, sourceTerrain);
          if (target.fertility < cap) target.fertility = clampFertility(target.fertility + 1);
        }
      } else if (poi.type === POI_TYPES.GREAT_FOREST) {
        const coreRadius = poi.coreRadius || POI_EFFECTS.GREAT_FOREST_CORE_RADIUS;
        if (distanceFromCenter <= coreRadius && sourceTerrain !== TERRAIN.BORDER && !target.unit) {
          if (sourceTerrain === TERRAIN.FIELD && countNeighborUnits(source, x, y).H < 2) {
            target.terrain = TERRAIN.WILD;
            target.terrainAge = 0;
          } else if (sourceTerrain === TERRAIN.EMPTY && random() < 0.22) {
            target.terrain = TERRAIN.WILD;
            target.terrainAge = 0;
          }
        }
        if ((sourceTerrain === TERRAIN.WILD || sourceTerrain === TERRAIN.EMPTY) &&
          target.fertility < 4 &&
          random() < POI_EFFECTS.GREAT_FOREST_FERTILITY_CHANCE) {
          target.fertility = clampFertility(target.fertility + 1);
        }
        if (totalBeasts < POI_EFFECTS.GREAT_FOREST_BEAST_TOTAL_CAP &&
          canGreatForestSpawnBeast(source, x, y, totalBeasts) &&
          random() < POI_EFFECTS.GREAT_FOREST_BEAST_SPAWN_CHANCE) {
          target.unit = UNIT.BEAST;
          target.age = 0;
          target.role = "pack";
          target.maxAge = null;
        }
      }
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
          const baseHauntedChance = cell.regionBias === REGION_BIAS.BASIN ? HAUNTED_FIELD_TO_MARK_CHANCE * 0.75 : HAUNTED_FIELD_TO_MARK_CHANCE;
          const hauntedChance = poiAdjustedFieldDecayChance(baseHauntedChance, x, y, "haunted");
          if (Math.random() < hauntedChance) {
            next[y][x].terrain = TERRAIN.MARK;
            next[y][x].terrainAge = 0;
            currentTickEvents.fieldDecayed += 1;
            currentTickEvents.marksCreatedBySpirit += 1;
          }
        } else if (humansRadius2 === 0 && cell.fertility <= 1 && (cell.terrainAge || 0) > ABANDONED_FIELD_MIN_AGE) {
          const baseFieldDecayChance = cell.regionBias === REGION_BIAS.BASIN ? ABANDONED_FIELD_DECAY_CHANCE * 0.6 : ABANDONED_FIELD_DECAY_CHANCE;
          const fieldDecayChance = poiAdjustedFieldDecayChance(baseFieldDecayChance, x, y, "decay");
          if (Math.random() < fieldDecayChance) {
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
        if (cell.regionBias === REGION_BIAS.HOLLOW) markDecayChance *= 0.42;
        markDecayChance = poiAdjustedMarkDecayChance(markDecayChance, x, y);
        const age = cell.terrainAge || 0;
        const ageDecay = age > MARK_MIN_LIFETIME && Math.random() < markDecayChance;
        const lowFertilityChance = cell.regionBias === REGION_BIAS.HOLLOW ? 0.025 : 0.08;
        const lowFertilityDecay = !isClusteredMark && cell.fertility <= 1 && age >= 10 && Math.random() < lowFertilityChance;
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
        let decayChance = wildCount >= 5 && avgWildFertility >= 3 ? 0.003 : 0.015;
        if (cell.regionBias === REGION_BIAS.REFUGE) decayChance *= 0.72;
        decayChance = poiAdjustedWildDecayChance(decayChance, x, y);
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

function cloneRegionalSubstrateLayout(source = currentRegionalSubstrate) {
  return source ? JSON.parse(JSON.stringify(source)) : null;
}

function screenCellBounds(gridX, gridY) {
  const minX = gridX * Math.floor(WIDTH / SUBSTRATE_LAYOUT_COLUMNS);
  const maxX = gridX === SUBSTRATE_LAYOUT_COLUMNS - 1 ? WIDTH - 1 : minX + Math.floor(WIDTH / SUBSTRATE_LAYOUT_COLUMNS) - 1;
  const minY = SUBSTRATE_ROW_HEIGHTS.slice(0, gridY).reduce((sum, value) => sum + value, 0);
  const maxY = minY + SUBSTRATE_ROW_HEIGHTS[gridY] - 1;
  return { minX, minY, maxX, maxY };
}

function screenCellCenter(cell) {
  return {
    x: Math.round((cell.bounds.minX + cell.bounds.maxX) / 2),
    y: Math.round((cell.bounds.minY + cell.bounds.maxY) / 2),
  };
}

function shuffleArray(items, rng) {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function archetypeForBias(bias, rng) {
  if (bias === REGION_BIAS.BASIN) return rng() < 0.55 ? "open_basin" : "field_basin";
  if (bias === REGION_BIAS.REFUGE) return rng() < 0.55 ? "wild_refuge" : "deep_refuge";
  if (bias === REGION_BIAS.HOLLOW) return rng() < 0.55 ? "scar_hollow" : "closed_hollow";
  const roll = rng();
  if (roll < 0.62) return "plain";
  if (roll < 0.82) return "choke_pass";
  return "barrier_edge";
}

function isHeavyScreenArchetype(archetype) {
  return archetype === "choke_pass" || archetype === "barrier_edge";
}

function isMostlyOpenScreenArchetype(archetype) {
  return archetype === "plain" || archetype === "open_basin" || archetype === "field_basin" || archetype === "wild_refuge";
}

function rebalanceScreenCellArchetypes(cells) {
  let heavyCount = cells.filter((cell) => isHeavyScreenArchetype(cell.archetype)).length;
  for (const cell of cells) {
    if (heavyCount <= MAX_HEAVY_SCREEN_ARCHETYPES) break;
    if (!isHeavyScreenArchetype(cell.archetype)) continue;
    cell.archetype = "plain";
    heavyCount -= 1;
  }

  let openCount = cells.filter((cell) => isMostlyOpenScreenArchetype(cell.archetype)).length;
  for (const cell of cells) {
    if (openCount >= 3) break;
    if (isMostlyOpenScreenArchetype(cell.archetype)) continue;
    cell.archetype = cell.regionBias === REGION_BIAS.BASIN ? "open_basin" :
      cell.regionBias === REGION_BIAS.REFUGE ? "wild_refuge" : "plain";
    openCount += 1;
  }
}

function sharedExitValue(rng, forcePassage = false) {
  if (forcePassage) return rng() < 0.45 ? "narrow" : "open";
  const roll = rng();
  if (roll < 0.48) return "open";
  if (roll < 0.78) return "narrow";
  return "blocked";
}

function createScreenCellLayout(rng) {
  const positions = [];
  for (let gridY = 0; gridY < SUBSTRATE_LAYOUT_ROWS; gridY += 1) {
    for (let gridX = 0; gridX < SUBSTRATE_LAYOUT_COLUMNS; gridX += 1) positions.push({ gridX, gridY });
  }

  const shuffled = shuffleArray(positions, rng);
  const basinCount = randomInt(rng, 1, 3);
  const refugeCount = randomInt(rng, 1, 3);
  const hollowCount = randomInt(rng, 1, 2);
  const assignments = new Map();
  let cursor = 0;
  for (let i = 0; i < basinCount; i += 1) assignments.set(`${shuffled[cursor].gridX},${shuffled[cursor++].gridY}`, REGION_BIAS.BASIN);
  for (let i = 0; i < refugeCount; i += 1) assignments.set(`${shuffled[cursor].gridX},${shuffled[cursor++].gridY}`, REGION_BIAS.REFUGE);
  for (let i = 0; i < hollowCount; i += 1) assignments.set(`${shuffled[cursor].gridX},${shuffled[cursor++].gridY}`, REGION_BIAS.HOLLOW);

  const cells = [];
  for (const pos of positions) {
    const regionBias = assignments.get(`${pos.gridX},${pos.gridY}`) || REGION_BIAS.NONE;
    cells.push({
      id: `screen_${pos.gridX}_${pos.gridY}`,
      gridX: pos.gridX,
      gridY: pos.gridY,
      bounds: screenCellBounds(pos.gridX, pos.gridY),
      archetype: archetypeForBias(regionBias, rng),
      regionBias,
      exits: {
        north: pos.gridY === 0 ? "blocked" : null,
        south: pos.gridY === SUBSTRATE_LAYOUT_ROWS - 1 ? "blocked" : null,
        west: pos.gridX === 0 ? "blocked" : null,
        east: pos.gridX === SUBSTRATE_LAYOUT_COLUMNS - 1 ? "blocked" : null,
      },
    });
  }
  rebalanceScreenCellArchetypes(cells);

  const byPos = new Map(cells.map((cell) => [`${cell.gridX},${cell.gridY}`, cell]));
  for (const cell of cells) {
    const east = byPos.get(`${cell.gridX + 1},${cell.gridY}`);
    if (east) {
      const forcePassage = cell.gridX === 1 || rng() < 0.35;
      const value = sharedExitValue(rng, forcePassage);
      cell.exits.east = value;
      east.exits.west = value;
    }
    const south = byPos.get(`${cell.gridX},${cell.gridY + 1}`);
    if (south) {
      const forcePassage = cell.gridY === 0 || rng() < 0.35;
      const value = sharedExitValue(rng, forcePassage);
      cell.exits.south = value;
      south.exits.north = value;
    }
  }

  for (const cell of cells) {
    const openSides = ["north", "south", "west", "east"].filter((side) => cell.exits[side] !== "blocked");
    if (openSides.length === 0) {
      const neighborSide = cell.gridX < SUBSTRATE_LAYOUT_COLUMNS - 1 ? "east" : "west";
      const neighbor = byPos.get(`${cell.gridX + (neighborSide === "east" ? 1 : -1)},${cell.gridY}`);
      cell.exits[neighborSide] = "narrow";
      neighbor.exits[neighborSide === "east" ? "west" : "east"] = "narrow";
    }
  }

  return {
    version: "0.10.1",
    layout: {
      columns: SUBSTRATE_LAYOUT_COLUMNS,
      rows: SUBSTRATE_LAYOUT_ROWS,
      cells,
    },
  };
}

function setBlock(target, x, y) {
  if (!inBounds(x, y)) return;
  const cell = target[y][x];
  if (cell.unit) return;
  cell.terrain = TERRAIN.BLOCK;
  cell.fertility = 0;
}

function carvePassage(target, x, y) {
  if (!inBounds(x, y)) return;
  const cell = target[y][x];
  if (cell.terrain !== TERRAIN.BLOCK) return;
  cell.terrain = TERRAIN.EMPTY;
  cell.fertility = Math.max(cell.fertility, 2);
}

function exitOpeningSet(min, max, exitValue) {
  if (exitValue === "blocked") return new Set();
  const center = Math.round((min + max) / 2);
  const halfWidth = exitValue === "open" ? 2 : 1;
  const open = new Set();
  for (let value = center - halfWidth; value <= center + halfWidth; value += 1) {
    if (value >= min && value <= max) open.add(value);
  }
  return open;
}

function shouldPaintBoundaryBlock(exitValue, x, y, salt = 0) {
  if (exitValue === "blocked") return true;
  if (exitValue === "narrow") return ((x * 3 + y * 5 + salt) % 4) !== 0;
  return ((x * 3 + y * 5 + salt) % 5) === 0;
}

function paintVerticalScreenBoundary(target, leftCell) {
  if (leftCell.gridX >= SUBSTRATE_LAYOUT_COLUMNS - 1) return;
  const x = leftCell.bounds.maxX;
  const open = exitOpeningSet(leftCell.bounds.minY + 1, leftCell.bounds.maxY - 1, leftCell.exits.east);
  for (let y = leftCell.bounds.minY; y <= leftCell.bounds.maxY; y += 1) {
    if (open.has(y)) continue;
    if (!shouldPaintBoundaryBlock(leftCell.exits.east, x, y, leftCell.gridX + leftCell.gridY)) continue;
    setBlock(target, x, y);
  }
}

function paintHorizontalScreenBoundary(target, topCell) {
  if (topCell.gridY >= SUBSTRATE_LAYOUT_ROWS - 1) return;
  const y = topCell.bounds.maxY;
  const open = exitOpeningSet(topCell.bounds.minX + 1, topCell.bounds.maxX - 1, topCell.exits.south);
  for (let x = topCell.bounds.minX; x <= topCell.bounds.maxX; x += 1) {
    if (open.has(x)) continue;
    if (!shouldPaintBoundaryBlock(topCell.exits.south, x, y, topCell.gridX + topCell.gridY + 7)) continue;
    setBlock(target, x, y);
  }
}

function paintCellRegion(target, screenCell) {
  for (let y = screenCell.bounds.minY; y <= screenCell.bounds.maxY; y += 1) {
    for (let x = screenCell.bounds.minX; x <= screenCell.bounds.maxX; x += 1) {
      const cell = target[y][x];
      cell.regionBias = screenCell.regionBias;
      if (cell.regionBias === REGION_BIAS.BASIN) cell.fertility = Math.max(cell.fertility, 2);
      if (cell.regionBias === REGION_BIAS.REFUGE) cell.fertility = Math.max(cell.fertility, 3);
      if (cell.regionBias === REGION_BIAS.HOLLOW) cell.fertility = Math.min(cell.fertility, 2);
    }
  }
}

function paintInternalScreenCellShape(target, screenCell, rng) {
  const { minX, minY, maxX, maxY } = screenCell.bounds;
  const cx = Math.round((minX + maxX) / 2);
  const cy = Math.round((minY + maxY) / 2);
  const placeShortRidge = (horizontal, length, offset) => {
    for (let i = -Math.floor(length / 2); i <= Math.floor(length / 2); i += 1) {
      if (rng() < 0.16) continue;
      const jitter = rng() < 0.35 ? (rng() < 0.5 ? -1 : 1) : 0;
      const x = horizontal ? cx + i : cx + offset + jitter;
      const y = horizontal ? cy + offset + jitter : cy + i;
      if (x > minX && x < maxX && y > minY && y < maxY) setBlock(target, x, y);
    }
  };
  const stampCluster = (x, y, radius, density) => {
    for (let yy = Math.max(minY + 1, y - radius); yy <= Math.min(maxY - 1, y + radius); yy += 1) {
      for (let xx = Math.max(minX + 1, x - radius); xx <= Math.min(maxX - 1, x + radius); xx += 1) {
        if (Math.hypot(xx - x, yy - y) <= radius + randomRange(rng, -0.25, 0.35) && rng() < density) setBlock(target, xx, yy);
      }
    }
  };

  if (screenCell.archetype === "open_basin") {
    if (rng() < 0.45) stampCluster(minX + 2, rng() < 0.5 ? minY + 2 : maxY - 2, 1, 0.55);
    if (rng() < 0.28) placeShortRidge(rng() < 0.5, 3, rng() < 0.5 ? -3 : 3);
  } else if (screenCell.archetype === "field_basin") {
    if (rng() < 0.42) placeShortRidge(true, 3, rng() < 0.5 ? -2 : 2);
    if (rng() < 0.35) stampCluster(maxX - 2, minY + 2, 1, 0.5);
  } else if (screenCell.archetype === "deep_refuge") {
    placeShortRidge(false, 5, rng() < 0.5 ? -2 : 2);
    stampCluster(minX + 2, maxY - 2, 1, 0.52);
    if (rng() < 0.42) stampCluster(maxX - 2, minY + 2, 1, 0.48);
  } else if (screenCell.archetype === "wild_refuge") {
    if (rng() < 0.5) placeShortRidge(true, 4, rng() < 0.5 ? -1 : 1);
    if (rng() < 0.52) stampCluster(randomInt(rng, minX + 2, maxX - 2), randomInt(rng, minY + 2, maxY - 2), 1, 0.45);
  } else if (screenCell.archetype === "scar_hollow" || screenCell.archetype === "closed_hollow") {
    for (let x = minX + 2; x <= Math.min(maxX - 1, minX + 5); x += 1) if (rng() < 0.58) setBlock(target, x, minY + 2);
    for (let y = minY + 2; y <= Math.min(maxY - 1, minY + 5); y += 1) if (rng() < 0.58) setBlock(target, minX + 2, y);
    stampCluster(maxX - 2, maxY - 2, 1, 0.48);
    if (screenCell.archetype === "closed_hollow" && rng() < 0.55) placeShortRidge(false, 4, 2);
  } else if (screenCell.archetype === "choke_pass") {
    const horizontal = rng() < 0.5;
    placeShortRidge(horizontal, 6, -1);
    placeShortRidge(horizontal, 6, 2);
    carvePassage(target, cx, cy);
    carvePassage(target, horizontal ? cx + 1 : cx, horizontal ? cy : cy + 1);
  } else if (screenCell.archetype === "barrier_edge") {
    placeShortRidge(rng() < 0.5, 7, rng() < 0.5 ? -2 : 2);
    if (rng() < 0.45) stampCluster(rng() < 0.5 ? minX + 2 : maxX - 2, randomInt(rng, minY + 2, maxY - 2), 1, 0.5);
  }
}

function updateRegionalSubstrateBlockCounts(target, substrate = currentRegionalSubstrate) {
  if (!substrate?.layout?.cells) return;
  for (const screenCell of substrate.layout.cells) {
    let blockCount = 0;
    for (let y = screenCell.bounds.minY; y <= screenCell.bounds.maxY; y += 1) {
      for (let x = screenCell.bounds.minX; x <= screenCell.bounds.maxX; x += 1) {
        if (target[y][x].terrain === TERRAIN.BLOCK) blockCount += 1;
      }
    }
    screenCell.blockCount = blockCount;
  }
}

function generateRegionalSubstrate(target, rng) {
  const substrate = createScreenCellLayout(rng);
  substrate.version = "0.10.4";
  for (const screenCell of substrate.layout.cells) paintCellRegion(target, screenCell);
  for (const screenCell of substrate.layout.cells) {
    paintVerticalScreenBoundary(target, screenCell);
    paintHorizontalScreenBoundary(target, screenCell);
  }
  for (const screenCell of substrate.layout.cells) paintInternalScreenCellShape(target, screenCell, rng);
  updateRegionalSubstrateBlockCounts(target, substrate);
  currentRegionalSubstrate = substrate;
  return substrate;
}

function substrateCentersForBias(source, bias) {
  const centers = [];
  for (const screenCell of currentRegionalSubstrate?.layout?.cells || []) {
    if (screenCell.regionBias !== bias) continue;
    const center = screenCellCenter(screenCell);
    if (source[center.y]?.[center.x]?.terrain !== TERRAIN.BLOCK) centers.push(center);
    else {
      const candidates = [];
      for (let y = Math.max(0, center.y - 3); y <= Math.min(HEIGHT - 1, center.y + 3); y += 1) {
        for (let x = Math.max(0, center.x - 3); x <= Math.min(WIDTH - 1, center.x + 3); x += 1) {
          if (source[y][x].terrain !== TERRAIN.BLOCK) candidates.push({ x, y, distance: Math.hypot(x - center.x, y - center.y) });
        }
      }
      candidates.sort((a, b) => a.distance - b.distance || a.y - b.y || a.x - b.x);
      if (candidates.length) centers.push({ x: candidates[0].x, y: candidates[0].y });
    }
  }
  if (centers.length) return centers;

  const cells = [];
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      if (source[y][x].regionBias === bias && source[y][x].terrain !== TERRAIN.BLOCK) cells.push({ x, y });
    }
  }
  if (!cells.length) return [];
  const center = centroid(cells);
  return [{ x: Math.round(center.x), y: Math.round(center.y) }];
}

function applySubstrateInitialBias(target, rng, settings) {
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const cell = target[y][x];
      if (cell.terrain === TERRAIN.BLOCK) continue;
      if (settings.initialFieldPatches > 0 && cell.regionBias === REGION_BIAS.BASIN && cell.terrain === TERRAIN.EMPTY && rng() < 0.05) {
        cell.terrain = TERRAIN.FIELD;
        cell.terrainAge = randomInt(rng, 0, 8);
        cell.fertility = Math.max(cell.fertility, randomInt(rng, 2, 3));
      }
      if (settings.initialWildPatches > 0 && cell.regionBias === REGION_BIAS.REFUGE && cell.terrain === TERRAIN.EMPTY && rng() < 0.07) {
        cell.terrain = TERRAIN.WILD;
        cell.terrainAge = randomInt(rng, 0, 8);
        cell.fertility = Math.max(cell.fertility, randomInt(rng, 3, 4));
      }
      if ((settings.initialMarkPatches > 0 || settings.initialFieldPatches > 0) && cell.regionBias === REGION_BIAS.HOLLOW && cell.terrain === TERRAIN.EMPTY) {
        if (rng() < 0.04) {
          if (settings.initialMarkPatches <= 0) continue;
          cell.terrain = TERRAIN.MARK;
          cell.terrainAge = randomInt(rng, 8, 24);
          cell.fertility = Math.min(cell.fertility, 2);
        } else if (settings.initialFieldPatches > 0 && rng() < 0.025) {
          cell.terrain = TERRAIN.FIELD;
          cell.terrainAge = randomInt(rng, 16, 30);
          cell.fertility = 1;
        }
      }
    }
  }
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
    if (countNeighborTerrains(target, x, y)["#"] === 0 && rng() < 0.82) continue;
    target[y][x].terrain = TERRAIN.BLOCK;
    target[y][x].fertility = 0;
    placed += 1;
  }
}

function generateRiverPath(rng, options = {}) {
  const source = options.source || null;
  const blockedKeys = new Set((options.blockedPoints || []).map((point) => pointKey(point.x, point.y)));
  const startY = options.startY ?? 1;
  const endY = options.endY ?? HEIGHT - 2;
  const minX = options.minX ?? 2;
  const maxX = options.maxX ?? WIDTH - 3;
  let riverX = options.startX ?? randomInt(rng, Math.max(minX, 8), Math.min(maxX, WIDTH - 9));
  const path = [];
  const used = new Set();

  for (let y = startY; y <= endY; y += 1) {
    riverX = Math.max(minX, Math.min(maxX, riverX + randomInt(rng, -1, 1)));
    const offsets = [0, -1, 1, -2, 2, -3, 3, -4, 4];
    let chosenX = riverX;
    for (const offset of offsets) {
      const candidateX = Math.max(minX, Math.min(maxX, riverX + offset));
      const key = pointKey(candidateX, y);
      const isBlocked = blockedKeys.has(key) || source?.[y]?.[candidateX]?.terrain === TERRAIN.BLOCK;
      if (!isBlocked) {
        chosenX = candidateX;
        break;
      }
    }
    riverX = chosenX;
    const key = pointKey(chosenX, y);
    if (!used.has(key)) {
      used.add(key);
      path.push({ x: chosenX, y });
    }
  }

  return normalizePointList(path);
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
  const blockedUnitPlacementKeys = new Set((options.blockedPoints || []).map((point) => pointKey(point.x, point.y)));

  while (placed < count) {
    let placedThisPass = false;
    for (const center of useCenters) {
      if (placed >= count) break;
      const candidates = shuffledNeighborsNear(center, options.radius || 4, rng);
      for (const candidate of candidates) {
        if (blockedUnitPlacementKeys.has(pointKey(candidate.x, candidate.y))) continue;
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

function createPOI(id, type, x, y) {
  const poi = {
    id,
    type,
    x,
    y,
    radius: type === POI_TYPES.GREAT_FOREST ? POI_EFFECTS.GREAT_FOREST_RADIUS : POI_EFFECTS.DEFAULT_RADIUS,
    strength: "strong",
    state: "active",
    createdAtTick: 0,
  };
  if (type === POI_TYPES.GREAT_FOREST) poi.coreRadius = POI_EFFECTS.GREAT_FOREST_CORE_RADIUS;
  if (type === POI_TYPES.ROT_SOURCE) poi.innerRadius = POI_EFFECTS.ROT_SOURCE_INNER_RADIUS;
  if (type === POI_TYPES.SPRING) poi.blocksMovement = true;
  return poi;
}

function terrainSignalScore(cell, type) {
  if (type === POI_TYPES.MONUMENT) {
    return (cell.terrain === TERRAIN.FIELD ? 5 : 0) +
      (cell.unit === UNIT.HUMAN ? 4 : 0) +
      (cell.regionBias === REGION_BIAS.BASIN ? 3 : 0);
  }
  if (type === POI_TYPES.ROT_SOURCE) {
    return (cell.terrain === TERRAIN.MARK ? 6 : 0) +
      (cell.unit === UNIT.SPIRIT ? 4 : 0) +
      (cell.regionBias === REGION_BIAS.HOLLOW ? 3 : 0);
  }
  if (type === POI_TYPES.GREAT_FOREST) {
    return (cell.terrain === TERRAIN.WILD ? 6 : 0) +
      (cell.unit === UNIT.BEAST ? 5 : 0) +
      (cell.regionBias === REGION_BIAS.REFUGE ? 4 : 0) +
      (cell.fertility >= 3 ? 1 : 0) -
      (cell.terrain === TERRAIN.FIELD ? 4 : 0) -
      (cell.terrain === TERRAIN.MARK ? 4 : 0);
  }
  return (cell.regionBias === REGION_BIAS.REFUGE ? 3 : 0) +
    (cell.terrain === TERRAIN.WILD ? 3 : 0) +
    (cell.terrain === TERRAIN.EMPTY ? 2 : 0) +
    (cell.fertility >= 3 ? 1 : 0) -
    (cell.terrain === TERRAIN.MARK ? 5 : 0);
}

function nearbyPOISignalScore(source, x, y, type) {
  let score = 0;
  for (const offset of RADIUS_OFFSETS[4]) {
    const nx = x + offset.dx;
    const ny = y + offset.dy;
    if (!inBounds(nx, ny)) continue;
    const weight = Math.max(0.2, 1 - Math.hypot(offset.dx, offset.dy) / 5);
    score += terrainSignalScore(source[ny][nx], type) * weight;
  }
  return score;
}

function validPOICenter(source, x, y, type, placed) {
  if (!inBounds(x, y)) return false;
  const cell = source[y][x];
  if (cell.terrain === TERRAIN.BLOCK) return false;
  if (type === POI_TYPES.SPRING && (cell.terrain === TERRAIN.MARK || cell.unit)) return false;
  if (type === POI_TYPES.GREAT_FOREST && cell.terrain === TERRAIN.MARK) return false;
  return !placed.some((poi) => distance(poi, { x, y }) < POI_EFFECTS.MIN_CENTER_DISTANCE);
}

function selectPOICenter(source, type, placed) {
  const candidates = [];
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      if (!validPOICenter(source, x, y, type, placed)) continue;
      let score = nearbyPOISignalScore(source, x, y, type);
      if (type === POI_TYPES.SPRING) {
        const rotSource = placed.find((poi) => poi.type === POI_TYPES.ROT_SOURCE);
        if (rotSource) score += Math.min(8, distance(rotSource, { x, y }) * 0.25);
      } else if (type === POI_TYPES.GREAT_FOREST) {
        const monument = placed.find((poi) => poi.type === POI_TYPES.MONUMENT);
        if (monument) score += Math.min(6, distance(monument, { x, y }) * 0.18);
      }
      candidates.push({ x, y, score });
    }
  }
  if (!candidates.length) {
    for (let y = 0; y < HEIGHT; y += 1) {
      for (let x = 0; x < WIDTH; x += 1) {
        const cell = source[y][x];
        if (cell.terrain === TERRAIN.BLOCK) continue;
        if (type === POI_TYPES.SPRING && (cell.terrain === TERRAIN.MARK || cell.unit)) continue;
        if (type === POI_TYPES.GREAT_FOREST && cell.terrain === TERRAIN.MARK) continue;
        candidates.push({ x, y, score: terrainSignalScore(cell, type) });
      }
    }
  }
  candidates.sort((a, b) => b.score - a.score || a.y - b.y || a.x - b.x);
  return candidates[0] || { x: Math.floor(WIDTH / 2), y: Math.floor(HEIGHT / 2) };
}

function createInitialPOIs(source) {
  const placed = [];
  const ids = {
    [POI_TYPES.MONUMENT]: "poi_monument_001",
    [POI_TYPES.ROT_SOURCE]: "poi_rot_source_002",
    [POI_TYPES.SPRING]: "poi_spring_003",
    [POI_TYPES.GREAT_FOREST]: "poi_great_forest_004",
  };
  for (const type of [POI_TYPES.MONUMENT, POI_TYPES.ROT_SOURCE, POI_TYPES.SPRING, POI_TYPES.GREAT_FOREST]) {
    const center = selectPOICenter(source, type, placed);
    placed.push(createPOI(ids[type], type, center.x, center.y));
  }
  return placed;
}

function createInitialWorld(settings = getInitialSettings()) {
  currentPlacementWarnings = [];
  const rng = createSeededRandom(settings.randomSeed);
  const next = createBaseFertilityWorld(rng);
  const regionalSubstrate = generateRegionalSubstrate(next, rng);

  const basinCenters = substrateCentersForBias(next, REGION_BIAS.BASIN);
  const refugeCenters = substrateCentersForBias(next, REGION_BIAS.REFUGE);
  const hollowCenters = substrateCentersForBias(next, REGION_BIAS.HOLLOW);
  const fieldCenters = choosePatchCenters(settings.initialFieldPatches, rng, basinCenters.length ? basinCenters : [{ x: 10, y: 13 }, { x: 13, y: 9 }, { x: 8, y: 17 }]);
  const wildCenters = choosePatchCenters(settings.initialWildPatches, rng, refugeCenters.length ? refugeCenters : [{ x: 30, y: 13 }, { x: 27, y: 8 }, { x: 33, y: 18 }]);
  const markCenters = choosePatchCenters(settings.initialMarkPatches, rng, hollowCenters.length ? hollowCenters : [{ x: 20, y: 19 }, { x: 17, y: 15 }, { x: 23, y: 16 }]);

  for (const center of fieldCenters) paintInitialPatch(next, center, TERRAIN.FIELD, randomInt(rng, 2, 4), 0.68, rng, 2, 3);
  for (const center of wildCenters) paintInitialPatch(next, center, TERRAIN.WILD, randomInt(rng, 1, 3), 0.6, rng, 3, 4);
  for (const center of markCenters) paintInitialPatch(next, center, TERRAIN.MARK, randomInt(rng, 2, 4), 0.62, rng, 2, 3);
  applySubstrateInitialBias(next, rng, settings);

  addFertilityHotspots(next, rng);
  if (settings.initialWildPatches > 0) {
    addScatteredWild(next, rng, randomInt(rng, 60, 120));
  }
  addInitialBlocks(next, settings.initialBlockCount, rng);
  updateRegionalSubstrateBlockCounts(next, regionalSubstrate);
  const generatedRivers = generateRiverPath(rng, { source: next });

  placeInitialUnits(next, UNIT.HUMAN, settings.initialHumans, fieldCenters, {
    role: "normal",
    fallbackTerrain: settings.initialFieldPatches > 0 ? TERRAIN.FIELD : TERRAIN.EMPTY,
    radius: 4,
    fertilityMin: 2,
    fertilityMax: 3,
    label: "Humans",
    blockedPoints: generatedRivers,
  }, rng);
  placeInitialUnits(next, UNIT.BEAST, settings.initialBeasts, wildCenters, {
    role: "pack",
    fallbackTerrain: TERRAIN.WILD,
    radius: 6,
    fertilityMin: 3,
    fertilityMax: 4,
    label: "Beasts",
    blockedPoints: generatedRivers,
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
    blockedPoints: generatedRivers,
  }, rng);

  currentInitialSettings = { ...settings };
  next.regionalSubstrate = cloneRegionalSubstrateLayout(regionalSubstrate);
  next.pointsOfInterest = createInitialPOIs(next);
  const generatedMountains = [];
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      if (next[y][x].terrain === TERRAIN.BLOCK) generatedMountains.push({ x, y });
    }
  }
  next.mapFeatures = { rivers: generatedRivers.map((point) => ({ ...point })) };
  next.mapSeed = normalizeMapSeed({
    version: MAP_SEED_VERSION,
    name: `Generated world ${settings.randomSeed}`,
    width: WIDTH,
    height: HEIGHT,
    units: [],
    mountains: generatedMountains,
    rivers: generatedRivers,
    pois: next.pointsOfInterest.map((poi) => ({
      id: poi.id,
      type: poi.type,
      x: poi.x,
      y: poi.y,
      radius: poi.radius,
      state: poi.state,
      strength: poi.strength,
    })),
  });
  return next;
}

function createDefaultWorld() {
  return createInitialWorld(getInitialSettings());
}

function randomizeWorld() {
  return createInitialWorld(getInitialSettings({ forceNewSeed: true }));
}

function createSeedPOI(poi) {
  const radius = poi.radius || (
    poi.type === POI_TYPES.GREAT_FOREST ? POI_EFFECTS.GREAT_FOREST_RADIUS :
    poi.type === POI_TYPES.ROT_SOURCE ? POI_EFFECTS.DEFAULT_RADIUS :
    POI_EFFECTS.DEFAULT_RADIUS
  );
  return {
    id: poi.id,
    type: poi.type,
    x: poi.x,
    y: poi.y,
    radius,
    state: poi.state || "active",
    strength: poi.strength ?? 1,
    innerRadius: poi.type === POI_TYPES.GREAT_FOREST ? POI_EFFECTS.GREAT_FOREST_CORE_RADIUS : 1,
    blocksMovement: poi.type === POI_TYPES.SPRING,
    source: "map_seed",
  };
}

function applyMapSeedToWorld(seed = activeMapSeed || createDefaultMapSeed(), options = {}) {
  const normalized = normalizeMapSeed(seed);
  const next = options.baseWorld ? cloneWorld(options.baseWorld, { includeMetadata: true }) : createEmptyWorld();
  for (const point of normalized.mountains) {
    next[point.y][point.x] = createCell(TERRAIN.BLOCK, null, 0, "normal", 0);
  }
  const mountainKeys = new Set(normalized.mountains.map((point) => pointKey(point.x, point.y)));
  const riverKeys = new Set(normalized.rivers.map((point) => pointKey(point.x, point.y)));
  for (const unit of normalized.units) {
    if (mountainKeys.has(pointKey(unit.x, unit.y)) || riverKeys.has(pointKey(unit.x, unit.y))) continue;
    const terrain = unit.type === UNIT.HUMAN ? TERRAIN.FIELD : unit.type === UNIT.BEAST ? TERRAIN.WILD : TERRAIN.MARK;
    next[unit.y][unit.x] = createCell(terrain, unit.type, 0, unit.type === UNIT.BEAST ? "pack" : unit.type === UNIT.SPIRIT ? "manifestation" : "normal", unit.type === UNIT.BEAST ? 3 : 2);
  }
  activeMapSeed = normalized;
  mapFeatures = { rivers: normalized.rivers.map((point) => ({ ...point })) };
  worldPOIs = normalized.pois.map(createSeedPOI);
  next.pointsOfInterest = clonePOIs(worldPOIs);
  next.mapSeed = normalizeMapSeed(activeMapSeed);
  next.mapFeatures = cloneMapFeatures(mapFeatures);
  if (options.setAsCurrent !== false) {
    world = cloneWorld(next, { includeMetadata: true });
    currentInitialWorld = cloneWorld(next, { includeMetadata: true });
    playerObserver = createPlayerObserver(world, worldPOIs);
    placeMemory = createEmptyPlaceMemory();
    currentSleepObservation = null;
    sleepTicksRemaining = 0;
    tick = 0;
  }
  return next;
}

function refreshMapSeedTextarea() {
  if (mapSeedJsonEl) mapSeedJsonEl.value = serializeMapSeed(activeMapSeed || createDefaultMapSeed());
}

function preservePlayerAfterMapSeedApply(oldPlayer) {
  if (!oldPlayer) {
    playerObserver = createPlayerObserver(world, worldPOIs);
    return;
  }
  if (isExploreCellPassable(world, oldPlayer.x, oldPlayer.y, worldPOIs)) {
    playerObserver = { ...oldPlayer };
  } else {
    playerObserver = createPlayerObserver(world, worldPOIs);
  }
}

function applyActiveMapSeedLive({ preservePlayer = true, shouldRender = true } = {}) {
  const oldPlayer = playerObserver ? JSON.parse(JSON.stringify(playerObserver)) : null;
  const next = applyMapSeedToWorld(activeMapSeed || createDefaultMapSeed(), { setAsCurrent: false });
  world = cloneWorld(next, { includeMetadata: true });
  currentInitialWorld = cloneWorld(next, { includeMetadata: true });
  currentInitialWorld.mapSeed = normalizeMapSeed(activeMapSeed || createDefaultMapSeed());
  currentInitialWorld.mapFeatures = cloneMapFeatures(mapFeatures);
  currentInitialWorld.pointsOfInterest = clonePOIs(worldPOIs);
  if (preservePlayer) preservePlayerAfterMapSeedApply(oldPlayer);
  else playerObserver = createPlayerObserver(world, worldPOIs);
  macroDisplayMaskCache = { source: null, macroTick: null, populationSerial: null, memorySerial: null, lineageSerial: null, politySerial: null, lineageVisible: null, mode: null, masks: null };
  macroDisplayWorld = null;
  refreshMapSeedTextarea();
  if (shouldRender) {
    analyzeMacroWorldNow();
    refreshMacroDisplayFrame({ force: true, mode: viewModeSelect?.value === "explore" ? "macro" : viewModeSelect?.value || "macro" });
    renderWorld();
    updateStats();
  }
  return next;
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

function regionBiasClass(regionBias) {
  return {
    basin: "region-basin",
    refuge: "region-refuge",
    hollow: "region-hollow",
  }[regionBias] || "region-none";
}

function fertilityClass(fertility) {
  return `fertility-${clampFertility(fertility ?? 0)}`;
}

function screenCellBoundaryClass(x, y) {
  const layout = currentRegionalSubstrate?.layout;
  if (!layout) return "";
  const cell = layout.cells.find((item) =>
    x >= item.bounds.minX &&
    x <= item.bounds.maxX &&
    y >= item.bounds.minY &&
    y <= item.bounds.maxY
  );
  if (!cell) return "";
  const classes = [];
  if (x === cell.bounds.minX) classes.push("screen-edge-west");
  if (x === cell.bounds.maxX) classes.push("screen-edge-east");
  if (y === cell.bounds.minY) classes.push("screen-edge-north");
  if (y === cell.bounds.maxY) classes.push("screen-edge-south");
  return classes.length ? ` ${classes.join(" ")}` : "";
}

function createWorldRows(source) {
  const terrainRows = [];
  const unitRows = [];
  const ageRows = [];
  const roles = [];
  const fertilityRows = [];
  const terrainAgeRows = [];
  const regionBiasRows = [];
  for (const row of source) {
    terrainRows.push(row.map((cell) => cell.terrain).join(""));
    unitRows.push(row.map((cell) => cell.unit || ".").join(""));
    ageRows.push(row.map((cell) => (cell.unit ? cell.age || 0 : null)));
    roles.push(row.map((cell) => (cell.unit ? cell.role || "normal" : ".")));
    fertilityRows.push(row.map((cell) => String(clampFertility(cell.fertility || 0))).join(""));
    terrainAgeRows.push(row.map((cell) => cell.terrainAge || 0));
    regionBiasRows.push(row.map((cell) => REGION_BIAS_SYMBOL[cell.regionBias || REGION_BIAS.NONE] || ".").join(""));
  }
  return { terrainRows, unitRows, ageRows, roles, fertilityRows, terrainAgeRows, regionBiasRows };
}

// V0.9 Macro World Layer: observer-only analysis over the existing ecology.
function createEmptyMacroWorld() {
  return {
    version: "0.9",
    ecologyVersion: "0.8.3",
    readabilityPatchVersion: "0.8.4",
    macroViewPatchVersion: "0.9.2",
    macroViewStabilityPatchVersion: "0.9.3",
    regionalSubstrateVersion: "0.10.2",
    performancePatchVersion: "0.10.3",
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
    viewModes: ["cell", "macro", "substrateMacro"],
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
  if (type === "settlement") return state === "new_settlement" ? "H+" : "H domain";
  if (type === "abandoned_settlement") return "H old";
  if (type === "beast_recovery_zone") return "W range";
  if (type === "spirit_outbreak") return "S wave";
  if (type === "spirit_scar") return "S scar";
  if (type === "migration_route") return "route";
  if (type === "human_beast_frontier") return "edge";
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
  const candidates = buildWildRecoveryInfluenceComponents(source)
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
  const retained = [];
  for (const candidate of candidates.sort((a, b) => b.confidence - a.confidence || b.size - a.size)) {
    const overlapsExisting = retained.some((item) => distance(item.center, candidate.center) < 4);
    if (overlapsExisting && candidate.confidence < 0.7) continue;
    retained.push(candidate);
    if (retained.length >= MAX_VISIBLE_RECOVERY_REGIONS) break;
  }
  return retained;
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

function addMacroCellClass(mask, x, y, className) {
  if (!inBounds(x, y)) return;
  const classes = new Set((mask.cellClasses[y][x] || "").split(/\s+/).filter(Boolean));
  classes.add(className);
  mask.cellClasses[y][x] = Array.from(classes).join(" ");
}

function hasMacroCellClass(mask, x, y, className) {
  if (!inBounds(x, y)) return false;
  return (mask.cellClasses[y][x] || "").split(/\s+/).includes(className);
}

function softenMacroMaskEdges(mask, source) {
  const influenceTypes = [
    { active: "macro-cell-settlement", fringe: "macro-fringe-settlement" },
    { active: "macro-cell-abandoned", fringe: "macro-fringe-abandoned" },
    { active: "macro-cell-wild", fringe: "macro-fringe-wild" },
    { active: "macro-cell-scar", fringe: "macro-fringe-scar" },
  ];

  for (const type of influenceTypes) {
    const active = Array.from({ length: HEIGHT }, (_, y) =>
      Array.from({ length: WIDTH }, (_, x) => hasMacroCellClass(mask, x, y, type.active))
    );
    const fringe = [];

    for (let y = 0; y < HEIGHT; y += 1) {
      for (let x = 0; x < WIDTH; x += 1) {
        const cell = source[y]?.[x];
        if (cell?.terrain === TERRAIN.BLOCK) continue;
        if (active[y][x]) {
          let sameNeighbors = 0;
          for (const n of getNeighbors(x, y)) {
            if (active[n.y][n.x]) sameNeighbors += 1;
          }
          addMacroCellClass(mask, x, y, sameNeighbors >= 5 ? "macro-soft-core" : "macro-soft-edge");
          continue;
        }
        if (getNeighbors(x, y).some((n) => active[n.y][n.x])) fringe.push({ x, y });
      }
    }

    for (const cell of fringe) {
      addMacroCellClass(mask, cell.x, cell.y, "macro-soft-fringe");
      addMacroCellClass(mask, cell.x, cell.y, type.fringe);
    }
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

function createEmptyPopulationEvolutionState() {
  return {
    nextIds: { human: 1, beast: 1, spirit: 1 },
    shapes: [],
  };
}

function nextPopulationEvolutionId(type) {
  const value = populationEvolutionState.nextIds[type] || 1;
  populationEvolutionState.nextIds[type] = value + 1;
  return `population_${type}_${String(value).padStart(3, "0")}`;
}

function maskFromPopulationSignals(source, type) {
  if (type === "human") {
    const fieldMask = buildBooleanMask(source, (cell) => cell?.terrain === TERRAIN.FIELD);
    const humanMask = buildBooleanMask(source, (cell) => cell?.unit === UNIT.HUMAN);
    const fieldInfluence = dilateMask(fieldMask, 1);
    const humanInfluence = dilateMask(humanMask, 1);
    return Array.from({ length: HEIGHT }, (_, y) =>
      Array.from({ length: WIDTH }, (_, x) => {
        const cell = source[y][x];
        if (cell.terrain === TERRAIN.BLOCK) return false;
        return fieldMask[y][x] || humanMask[y][x] || (fieldInfluence[y][x] && humanInfluence[y][x]);
      })
    );
  }

  if (type === "beast") {
    const wildMask = buildBooleanMask(source, (cell) => cell?.terrain === TERRAIN.WILD);
    const beastMask = buildBooleanMask(source, (cell) => cell?.unit === UNIT.BEAST);
    const wildInfluence = dilateMask(wildMask, 1);
    const beastInfluence = dilateMask(beastMask, 2);
    return Array.from({ length: HEIGHT }, (_, y) =>
      Array.from({ length: WIDTH }, (_, x) => {
        const cell = source[y][x];
        if (cell.terrain === TERRAIN.BLOCK) return false;
        const fertileRecoveryGround = cell.terrain === TERRAIN.EMPTY && cell.fertility >= 3;
        return wildMask[y][x] || beastMask[y][x] || (beastInfluence[y][x] && (wildInfluence[y][x] || fertileRecoveryGround));
      })
    );
  }

  const markMask = buildBooleanMask(source, (cell) => cell?.terrain === TERRAIN.MARK);
  const spiritMask = buildBooleanMask(source, (cell) => cell?.unit === UNIT.SPIRIT);
  const clusteredMarkMask = Array.from({ length: HEIGHT }, () => Array.from({ length: WIDTH }, () => false));
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      if (!markMask[y][x] && !spiritMask[y][x]) continue;
      let nearbySignals = 0;
      for (const n of getNeighbors(x, y)) {
        if (markMask[n.y][n.x] || spiritMask[n.y][n.x]) nearbySignals += 1;
      }
      clusteredMarkMask[y][x] = nearbySignals >= 1 || spiritMask[y][x];
    }
  }
  const corrosionInfluence = dilateMask(clusteredMarkMask, 1);
  return Array.from({ length: HEIGHT }, (_, y) =>
    Array.from({ length: WIDTH }, (_, x) => {
      const cell = source[y][x];
      if (cell.terrain === TERRAIN.BLOCK) return false;
      return markMask[y][x] || spiritMask[y][x] || corrosionInfluence[y][x];
    })
  );
}

function smoothPopulationMask(mask, source, type) {
  return Array.from({ length: HEIGHT }, (_, y) =>
    Array.from({ length: WIDTH }, (_, x) => {
      const cell = source[y][x];
      if (cell.terrain === TERRAIN.BLOCK) return false;
      if (mask[y][x]) return true;
      let activeNeighbors = 0;
      for (const n of getNeighbors(x, y)) {
        if (mask[n.y][n.x]) activeNeighbors += 1;
      }
      const threshold = type === "spirit" ? 4 : 5;
      return activeNeighbors >= threshold;
    })
  );
}

function countPopulationEvidence(source, cells, type) {
  if (type === "human") {
    return componentTerrainCount(source, cells, TERRAIN.FIELD) + componentUnitCount(source, cells, UNIT.HUMAN) * 2;
  }
  if (type === "beast") {
    return componentTerrainCount(source, cells, TERRAIN.WILD) + componentUnitCount(source, cells, UNIT.BEAST) * 2;
  }
  return componentTerrainCount(source, cells, TERRAIN.MARK) + componentUnitCount(source, cells, UNIT.SPIRIT) * 2;
}

function classifyPopulationShapeCells(component, componentSet) {
  const coreCells = [];
  const bodyCells = [];
  const edgeCells = [];
  for (const cell of component) {
    let sameNeighbors = 0;
    let touchesOutside = false;
    for (const n of getNeighbors(cell.x, cell.y)) {
      if (componentSet.has(getCellKey(n.x, n.y))) sameNeighbors += 1;
      else touchesOutside = true;
    }
    if (sameNeighbors >= 7 && !touchesOutside) coreCells.push(cell);
    else if (sameNeighbors >= 5) bodyCells.push(cell);
    else edgeCells.push(cell);
  }
  if (!coreCells.length && bodyCells.length) coreCells.push(bodyCells.shift());
  if (!bodyCells.length && edgeCells.length > 2) bodyCells.push(edgeCells.shift());
  return { coreCells, bodyCells, edgeCells };
}

function populationShapeState(type, confidence) {
  if (type === "human") return confidence >= 0.72 ? "settled" : "forming";
  if (type === "beast") return confidence >= 0.72 ? "habitat" : "roaming";
  return confidence >= 0.72 ? "corrosion" : "trace";
}

function buildPopulationEvolutionShapes(source) {
  const shapes = [];
  for (const type of ["human", "beast", "spirit"]) {
    const rawMask = maskFromPopulationSignals(source, type);
    const mask = smoothPopulationMask(rawMask, source, type);
    const minArea = POPULATION_EVOLUTION_MIN_AREA[type];
    for (const component of connectedMaskComponents(mask)) {
      const evidence = countPopulationEvidence(source, component, type);
      const minEvidence = type === "spirit" ? 3 : 5;
      if (component.length < minArea || evidence < minEvidence) continue;
      const componentSet = new Set(component.map((cell) => getCellKey(cell.x, cell.y)));
      const { coreCells, bodyCells, edgeCells } = classifyPopulationShapeCells(component, componentSet);
      const confidence = Math.min(0.95, 0.35 + evidence / Math.max(14, component.length * 1.8) + component.length / 80);
      shapes.push({
        type,
        state: populationShapeState(type, confidence),
        age: 0,
        firstSeenTick: tick,
        lastSeenTick: tick,
        confidence: Number(confidence.toFixed(3)),
        coreCells,
        bodyCells,
        edgeCells,
        memoryCells: [],
        center: centroid(component),
        bounds: boundsForCells(component),
        area: component.length,
        previousArea: 0,
        trend: "expanding",
      });
    }
  }
  return shapes.sort((a, b) => b.area - a.area || b.confidence - a.confidence);
}

function populationShapeCells(shape, includeMemory = false) {
  const cells = [
    ...(shape.coreCells || []),
    ...(shape.bodyCells || []),
    ...(shape.edgeCells || []),
  ];
  if (includeMemory) cells.push(...(shape.memoryCells || []));
  return cells;
}

function populationShapeOverlap(a, b) {
  const aCells = new Set(populationShapeCells(a, true).map((cell) => getCellKey(cell.x, cell.y)));
  let overlap = 0;
  for (const cell of populationShapeCells(b, true)) {
    if (aCells.has(getCellKey(cell.x, cell.y))) overlap += 1;
  }
  return overlap;
}

function matchPreviousPopulationShape(candidate, usedIds) {
  let best = null;
  let bestScore = -Infinity;
  for (const previous of populationEvolutionState.shapes) {
    if (previous.type !== candidate.type || usedIds.has(previous.id)) continue;
    const overlap = populationShapeOverlap(candidate, previous);
    const centerDistance = distance(candidate.center, previous.center);
    if (overlap <= 0 && centerDistance > 7) continue;
    const score = overlap * 4 - centerDistance + Math.min(candidate.area, previous.area) * 0.05;
    if (score > bestScore) {
      best = previous;
      bestScore = score;
    }
  }
  return best;
}

function populationShapeTrend(area, previousArea) {
  if (!previousArea) return "expanding";
  if (area > previousArea * 1.18) return "expanding";
  if (area < previousArea * 0.82) return "contracting";
  return "stable";
}

function materializePopulationShape(candidate, previous) {
  const id = previous?.id || nextPopulationEvolutionId(candidate.type);
  const firstSeenTick = previous?.firstSeenTick ?? tick;
  const previousArea = previous?.area || 0;
  return {
    ...candidate,
    id,
    firstSeenTick,
    lastSeenTick: tick,
    age: tick - firstSeenTick,
    previousArea,
    trend: populationShapeTrend(candidate.area, previousArea),
  };
}

function retainPopulationMemoryShape(previous) {
  const unseenTicks = Math.max(1, tick - previous.lastSeenTick);
  if (unseenTicks > POPULATION_EVOLUTION_MEMORY_TICKS) return null;
  const memoryCells = populationShapeCells(previous, true).slice(0, POPULATION_EVOLUTION_MAX_MEMORY_CELLS);
  if (!memoryCells.length) return null;
  const confidence = Math.max(0.05, Number((previous.confidence * (1 - unseenTicks / (POPULATION_EVOLUTION_MEMORY_TICKS + 1))).toFixed(3)));
  return {
    ...previous,
    state: "fading",
    age: tick - previous.firstSeenTick,
    confidence,
    coreCells: [],
    bodyCells: [],
    edgeCells: [],
    memoryCells,
    area: memoryCells.length,
    previousArea: previous.area,
    trend: "fading",
  };
}

function refreshPopulationEvolutionFrame({ source = world, mode = "macro", force = false } = {}) {
  if (!force && populationEvolutionFrame && tick - populationEvolutionFrame.tick < MACRO_DISPLAY_INTERVAL) {
    return populationEvolutionFrame;
  }
  const candidates = buildPopulationEvolutionShapes(source);
  const usedIds = new Set();
  const nextShapes = [];
  for (const candidate of candidates) {
    const previous = matchPreviousPopulationShape(candidate, usedIds);
    const shape = materializePopulationShape(candidate, previous);
    usedIds.add(shape.id);
    nextShapes.push(shape);
  }
  for (const previous of populationEvolutionState.shapes) {
    if (usedIds.has(previous.id)) continue;
    const retained = retainPopulationMemoryShape(previous);
    if (!retained) continue;
    usedIds.add(retained.id);
    nextShapes.push(retained);
  }
  populationEvolutionState.shapes = nextShapes;
  populationEvolutionFrame = {
    tick,
    mode,
    shapes: nextShapes,
    summary: {
      human: nextShapes.filter((shape) => shape.type === "human").length,
      beast: nextShapes.filter((shape) => shape.type === "beast").length,
      spirit: nextShapes.filter((shape) => shape.type === "spirit").length,
      fading: nextShapes.filter((shape) => shape.state === "fading").length,
    },
  };
  populationEvolutionSerial += 1;
  macroDisplayMaskCache = { source: null, macroTick: null, populationSerial: null, memorySerial: null, lineageSerial: null, politySerial: null, lineageVisible: null, mode: null, masks: null };
  return populationEvolutionFrame;
}

function buildPopulationEvolutionDisplayMasks(source, mode = "macro") {
  const frame = populationEvolutionFrame || refreshPopulationEvolutionFrame({ source, mode, force: true });
  const mask = {
    cellClasses: Array.from({ length: HEIGHT }, () => Array.from({ length: WIDTH }, () => "")),
  };
  for (const shape of frame.shapes) {
    const prefix = `population-${shape.type}`;
    const layers = shape.state === "fading" ?
      [{ cells: shape.memoryCells || [], className: `${prefix}-memory` }] :
      [
        { cells: shape.coreCells || [], className: `${prefix}-core` },
        { cells: shape.bodyCells || [], className: `${prefix}-body` },
        { cells: shape.edgeCells || [], className: `${prefix}-edge` },
        { cells: shape.memoryCells || [], className: `${prefix}-memory` },
      ];
    for (const layer of layers) {
      for (const cell of layer.cells) addMacroCellClass(mask, cell.x, cell.y, layer.className);
    }
  }
  return mask;
}

function mergePopulationEvolutionMasks(mask, source, mode) {
  const populationMask = buildPopulationEvolutionDisplayMasks(source, mode);
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const classes = populationMask.cellClasses[y][x];
      if (!classes) continue;
      for (const className of classes.split(/\s+/).filter(Boolean)) {
        addMacroCellClass(mask, x, y, className);
      }
    }
  }
}

function poiClassForType(type) {
  if (type === POI_TYPES.MONUMENT) return "poi-monument";
  if (type === POI_TYPES.ROT_SOURCE) return "poi-rot-source";
  if (type === POI_TYPES.SPRING) return "poi-spring";
  if (type === POI_TYPES.GREAT_FOREST) return "poi-great-forest";
  return "poi-unknown";
}

function markPOICells(mask, source, pois = worldPOIs) {
  for (const poi of pois || []) {
    if (poi.state !== "active") continue;
    const typeClass = poiClassForType(poi.type);
    for (const offset of RADIUS_OFFSETS[poi.radius || POI_EFFECTS.DEFAULT_RADIUS]) {
      const x = poi.x + offset.dx;
      const y = poi.y + offset.dy;
      if (!inBounds(x, y)) continue;
      if (source[y][x].terrain === TERRAIN.BLOCK) continue;
      const distanceFromCenter = Math.hypot(offset.dx, offset.dy);
      addMacroCellClass(mask, x, y, "poi-influence");
      addMacroCellClass(mask, x, y, typeClass);
      const cell = source[y][x];
      if (poi.type === POI_TYPES.GREAT_FOREST && distanceFromCenter <= (poi.coreRadius || POI_EFFECTS.GREAT_FOREST_CORE_RADIUS)) {
        addMacroCellClass(mask, x, y, "poi-great-forest-core");
      }
      if (poi.type === POI_TYPES.ROT_SOURCE) {
        const innerRadius = poi.innerRadius || POI_EFFECTS.ROT_SOURCE_INNER_RADIUS;
        if (distanceFromCenter === 0) {
          addMacroCellClass(mask, x, y, "poi-rot-core");
          addMacroCellClass(mask, x, y, "poi-rot-hardened");
        } else if (distanceFromCenter <= innerRadius) {
          addMacroCellClass(mask, x, y, "poi-rot-inner");
          addMacroCellClass(mask, x, y, "poi-rot-hardened");
        } else {
          addMacroCellClass(mask, x, y, "poi-rot-outer");
        }
        if (cell.unit === UNIT.HUMAN || cell.terrain === TERRAIN.FIELD) addMacroCellClass(mask, x, y, "poi-contested-human");
        if (cell.unit === UNIT.BEAST || cell.terrain === TERRAIN.WILD) addMacroCellClass(mask, x, y, "poi-contested-beast");
        if (cell.unit === UNIT.SPIRIT || cell.terrain === TERRAIN.MARK) addMacroCellClass(mask, x, y, "poi-contested-spirit");
      }
    }
    if (inBounds(poi.x, poi.y) && source[poi.y][poi.x].terrain !== TERRAIN.BLOCK) {
      addMacroCellClass(mask, poi.x, poi.y, "poi-center");
      addMacroCellClass(mask, poi.x, poi.y, typeClass);
      if (poi.type === POI_TYPES.ROT_SOURCE) {
        addMacroCellClass(mask, poi.x, poi.y, "poi-rot-core");
        addMacroCellClass(mask, poi.x, poi.y, "poi-rot-hardened");
      }
      if (poi.type === POI_TYPES.GREAT_FOREST) addMacroCellClass(mask, poi.x, poi.y, "poi-great-forest-core");
    }
  }
}

function createPopulationEvolutionSummary(frame = populationEvolutionFrame) {
  const empty = { shapes: 0, activeArea: 0, memoryArea: 0, dominantId: null, trend: "none" };
  const summary = {
    human: { ...empty },
    beast: { ...empty },
    spirit: { ...empty },
  };
  if (!frame?.shapes) return summary;

  for (const type of ["human", "beast", "spirit"]) {
    const shapes = frame.shapes.filter((shape) => shape.type === type);
    let dominant = null;
    let activeArea = 0;
    let memoryArea = 0;
    for (const shape of shapes) {
      const shapeActiveArea = (shape.coreCells?.length || 0) + (shape.bodyCells?.length || 0) + (shape.edgeCells?.length || 0);
      const shapeMemoryArea = shape.memoryCells?.length || 0;
      activeArea += shapeActiveArea;
      memoryArea += shapeMemoryArea;
      const shapeArea = shapeActiveArea + shapeMemoryArea;
      if (!dominant || shapeArea > ((dominant.coreCells?.length || 0) + (dominant.bodyCells?.length || 0) + (dominant.edgeCells?.length || 0) + (dominant.memoryCells?.length || 0))) {
        dominant = shape;
      }
    }
    summary[type] = {
      shapes: shapes.length,
      activeArea,
      memoryArea,
      dominantId: dominant?.id || null,
      trend: dominant?.trend || "none",
    };
  }
  return summary;
}

function createEmptyHumanLineageMemory() {
  return {
    version: HUMAN_LINEAGE_VERSION,
    tick: 0,
    nextId: 1,
    nextEventId: 1,
    nextOutpostId: 1,
    lineages: [],
    humanOutposts: [],
    events: [],
  };
}

function nextHumanLineageId() {
  const id = `human_lineage_${String(humanLineageMemory.nextId).padStart(3, "0")}`;
  humanLineageMemory.nextId += 1;
  return id;
}

function nextHumanLineageEventId() {
  const id = `human_lineage_event_${String(humanLineageMemory.nextEventId).padStart(3, "0")}`;
  humanLineageMemory.nextEventId += 1;
  return id;
}

function nextHumanOutpostId() {
  const id = `human_outpost_${String(humanLineageMemory.nextOutpostId || 1).padStart(3, "0")}`;
  humanLineageMemory.nextOutpostId = (humanLineageMemory.nextOutpostId || 1) + 1;
  return id;
}

function roundPoint(point) {
  if (!point) return null;
  return {
    x: Number(point.x.toFixed(2)),
    y: Number(point.y.toFixed(2)),
  };
}

function cappedCells(cells, limit) {
  const seen = new Set();
  const result = [];
  for (const cell of cells || []) {
    if (!inBounds(cell.x, cell.y)) continue;
    const key = getCellKey(cell.x, cell.y);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ x: cell.x, y: cell.y });
    if (result.length >= limit) break;
  }
  return result;
}

function mergeCellsCapped(groups, limit) {
  const merged = [];
  for (const group of groups) {
    merged.push(...(group || []));
  }
  return cappedCells(merged, limit);
}

function humanLineageShapeCells(shape) {
  return cappedCells(populationShapeCells(shape, false), HUMAN_LINEAGE_MAX_ACTIVE_CELLS);
}

function cellsToSet(cells) {
  return new Set((cells || []).map((cell) => getCellKey(cell.x, cell.y)));
}

function overlapCellCount(a, b) {
  const set = cellsToSet(a);
  let count = 0;
  for (const cell of b || []) {
    if (set.has(getCellKey(cell.x, cell.y))) count += 1;
  }
  return count;
}

function nearestDistanceToCells(point, cells) {
  if (!point || !cells?.length) return Infinity;
  let best = Infinity;
  for (const cell of cells) {
    best = Math.min(best, distance(point, cell));
  }
  return best;
}

function nearestDistanceToPath(point, path) {
  if (!point || !path?.length) return Infinity;
  let best = Infinity;
  for (const step of path) {
    best = Math.min(best, distance(point, step));
  }
  return best;
}

function scoreHumanLineageMatch(lineage, shape, activeCells) {
  const centerDistance = distance(lineage.centroid || lineage.origin, shape.center);
  const activeOverlap = overlapCellCount(lineage.activeCells, activeCells);
  const memoryOverlap = overlapCellCount(lineage.memoryCells, activeCells);
  const previousArea = lineage.areaHistory[lineage.areaHistory.length - 1]?.area || lineage.activeCells.length || 1;
  const areaSimilarity = Math.min(previousArea, shape.area) / Math.max(previousArea, shape.area, 1);
  const nearMemory = nearestDistanceToCells(shape.center, lineage.memoryCells);
  const distanceScore = Math.max(0, HUMAN_LINEAGE_SAME_MAX_DISTANCE - centerDistance) * 1.5;
  const memoryScore = Number.isFinite(nearMemory) ? Math.max(0, 5 - nearMemory) : 0;
  return activeOverlap * 5 + memoryOverlap * 3 + distanceScore + areaSimilarity * 3 + memoryScore;
}

function findBestHumanLineageMatch(shape, activeCells, usedLineageIds) {
  let best = null;
  let bestScore = -Infinity;
  for (const lineage of humanLineageMemory.lineages) {
    if (usedLineageIds.has(lineage.id) || lineage.state === "collapsed") continue;
    const score = scoreHumanLineageMatch(lineage, shape, activeCells);
    const centerDistance = distance(lineage.centroid || lineage.origin, shape.center);
    const overlaps = overlapCellCount(lineage.activeCells, activeCells) + overlapCellCount(lineage.memoryCells, activeCells);
    if (score < 5 && overlaps <= 0 && centerDistance > HUMAN_LINEAGE_SAME_MAX_DISTANCE) continue;
    if (score > bestScore) {
      best = lineage;
      bestScore = score;
    }
  }
  return best ? { lineage: best, score: bestScore } : null;
}

function findHumanLineageParent(shape, activeCells) {
  let best = null;
  let bestScore = -Infinity;
  for (const lineage of humanLineageMemory.lineages) {
    if (lineage.state !== "collapsed" && lineage.state !== "declining") continue;
    const memoryOverlap = overlapCellCount(lineage.memoryCells, activeCells);
    const pathDistance = nearestDistanceToPath(shape.center, lineage.centroidPath);
    const memoryDistance = nearestDistanceToCells(shape.center, lineage.memoryCells);
    const nearDistance = Math.min(pathDistance, memoryDistance);
    const score = memoryOverlap * 4 + Math.max(0, HUMAN_LINEAGE_DESCENDANT_MAX_DISTANCE - nearDistance) * 1.4;
    if (score < 4 || nearDistance > HUMAN_LINEAGE_DESCENDANT_MAX_DISTANCE) continue;
    if (score > bestScore) {
      best = lineage;
      bestScore = score;
    }
  }
  return best;
}

function addHumanLineageEvent(type, lineage, parentId = lineage.parentId, point = lineage.centroid) {
  const last = humanLineageMemory.events[humanLineageMemory.events.length - 1];
  if (last && last.tick === tick && last.type === type && last.lineageId === lineage.id) return;
  const event = {
    id: nextHumanLineageEventId(),
    tick,
    type,
    lineageId: lineage.id,
    parentId: parentId || null,
    confidence: Number((lineage.confidence || 0).toFixed(3)),
    x: point ? Number(point.x.toFixed(2)) : null,
    y: point ? Number(point.y.toFixed(2)) : null,
  };
  humanLineageMemory.events.push(event);
  if (humanLineageMemory.events.length > HUMAN_LINEAGE_MAX_EVENTS) {
    humanLineageMemory.events = humanLineageMemory.events.slice(-HUMAN_LINEAGE_MAX_EVENTS);
  }
  lineage.eventIds.push(event.id);
  if (lineage.eventIds.length > HUMAN_LINEAGE_MAX_EVENTS) lineage.eventIds = lineage.eventIds.slice(-HUMAN_LINEAGE_MAX_EVENTS);
}

function addHumanOutpostEvent(type, outpost, point = outpost) {
  const last = humanLineageMemory.events[humanLineageMemory.events.length - 1];
  if (last && last.type === type && last.outpostId === outpost.id && last.tick === tick) return;
  const lineage = humanLineageMemory.lineages.find((item) => item.id === outpost.lineageId);
  const event = {
    id: nextHumanLineageEventId(),
    tick,
    type,
    lineageId: outpost.lineageId || null,
    outpostId: outpost.id,
    confidence: Number((outpost.confidence || 0).toFixed(3)),
    x: point ? Number(point.x.toFixed(2)) : null,
    y: point ? Number(point.y.toFixed(2)) : null,
  };
  humanLineageMemory.events.push(event);
  if (humanLineageMemory.events.length > HUMAN_LINEAGE_MAX_EVENTS) {
    humanLineageMemory.events = humanLineageMemory.events.slice(-HUMAN_LINEAGE_MAX_EVENTS);
  }
  if (lineage) {
    lineage.eventIds.push(event.id);
    if (lineage.eventIds.length > HUMAN_LINEAGE_MAX_EVENTS) lineage.eventIds = lineage.eventIds.slice(-HUMAN_LINEAGE_MAX_EVENTS);
  }
}

function deriveHumanLineageState(lineage, shape) {
  const previousArea = lineage.areaHistory[lineage.areaHistory.length - 1]?.area || 0;
  const previousCenter = lineage.centroid;
  const moved = previousCenter ? distance(previousCenter, shape.center) : 0;
  if (lineage.areaHistory.length < 2) return "forming";
  if (moved >= 2.5) return "migrating";
  if (previousArea && shape.area > previousArea * 1.18) return "expanding";
  if (previousArea && shape.area < previousArea * 0.75) return "declining";
  return "stable";
}

function eventTypeForHumanLineageState(state) {
  if (state === "expanding") return "expanded";
  if (state === "migrating") return "migrated";
  if (state === "declining") return "declined";
  if (state === "collapsed") return "collapsed";
  return null;
}

function createEmptySeatFields(shape) {
  return {
    domainId: shape?.id || null,
    domainCells: [],
    currentSeat: null,
    seatHistory: [],
    pendingSeatCandidate: null,
    seatMissingSamples: 0,
  };
}

function humanSeatSupportAt(source, x, y) {
  let support = 0;
  let pressure = 0;
  for (let yy = y - 2; yy <= y + 2; yy += 1) {
    for (let xx = x - 2; xx <= x + 2; xx += 1) {
      if (!inBounds(xx, yy)) continue;
      const cell = source[yy][xx];
      if (cell.terrain === TERRAIN.FIELD) support += 1;
      if (cell.unit === UNIT.HUMAN) support += 2;
      if (cell.fertility >= 3) support += 0.35;
      if (cell.terrain === TERRAIN.MARK) pressure += 1;
      if (cell.unit === UNIT.SPIRIT) pressure += 2;
    }
  }
  return {
    support: Number(support.toFixed(2)),
    pressure: Number(pressure.toFixed(2)),
  };
}

function isBlockedForHumanSeat(source, x, y) {
  if (!inBounds(x, y)) return true;
  const cell = source[y][x];
  if (cell.terrain !== TERRAIN.FIELD) return true;
  if (cell.terrain === TERRAIN.MARK || cell.terrain === TERRAIN.BLOCK || cell.terrain === TERRAIN.BORDER) return true;
  if (isPOIHardBlocker(x, y, worldPOIs)) return true;
  for (const poi of worldPOIs || []) {
    if (poi.type !== POI_TYPES.ROT_SOURCE) continue;
    const innerRadius = poi.innerRadius || POI_EFFECTS.ROT_SOURCE_INNER_RADIUS;
    if (Math.hypot(poi.x - x, poi.y - y) <= innerRadius) return true;
  }
  return false;
}

function chooseHumanSeatCandidate(source, shape) {
  if (!shape || shape.area < HUMAN_SEAT_MIN_DOMAIN_AREA || (shape.confidence || 0) < HUMAN_SEAT_MIN_CONFIDENCE) return null;
  const preferred = shape.coreCells?.length ? shape.coreCells : shape.bodyCells || [];
  const fallback = [...(shape.bodyCells || []), ...(shape.edgeCells || [])];
  const candidates = [...preferred, ...fallback];
  let best = null;
  let bestScore = -Infinity;
  for (const cell of candidates) {
    if (isBlockedForHumanSeat(source, cell.x, cell.y)) continue;
    const stats = humanSeatSupportAt(source, cell.x, cell.y);
    if (stats.support < 8 || stats.pressure >= stats.support * 0.7) continue;
    const centerDistance = distance(shape.center, cell);
    const score = stats.support - stats.pressure * 2 - centerDistance * 0.45 + ((source[cell.y][cell.x].fertility || 0) * 0.4);
    if (score > bestScore) {
      best = { x: cell.x, y: cell.y, support: stats.support, pressure: stats.pressure };
      bestScore = score;
    }
  }
  return best;
}

function chooseHumanOutpostCandidate(source, shape) {
  if (!shape || shape.area < HUMAN_OUTPOST_MIN_AREA || (shape.confidence || 0) < HUMAN_OUTPOST_MIN_CONFIDENCE) return null;
  const candidates = [...(shape.coreCells || []), ...(shape.bodyCells || []), ...(shape.edgeCells || [])];
  let best = null;
  let bestScore = -Infinity;
  for (const cell of candidates) {
    if (isBlockedForHumanSeat(source, cell.x, cell.y)) continue;
    const stats = humanSeatSupportAt(source, cell.x, cell.y);
    if (stats.support < 6) continue;
    const centerDistance = distance(shape.center, cell);
    const score = stats.support - stats.pressure * 0.8 - centerDistance * 0.35 + ((source[cell.y][cell.x].fertility || 0) * 0.25);
    if (score > bestScore) {
      best = { x: cell.x, y: cell.y, support: stats.support, pressure: stats.pressure };
      bestScore = score;
    }
  }
  return best;
}

function isSeatSupported(lineage, source) {
  const seat = lineage.currentSeat;
  if (!seat || !inBounds(seat.x, seat.y)) return { supported: false, reason: "lost_domain", support: 0, pressure: 0 };
  const cell = source[seat.y][seat.x];
  if (cell.terrain === TERRAIN.MARK) {
    const stats = humanSeatSupportAt(source, seat.x, seat.y);
    return { supported: false, reason: "rot_pressure", ...stats };
  }
  if (isBlockedForHumanSeat(source, seat.x, seat.y)) return { supported: false, reason: "lost_domain", support: 0, pressure: 0 };
  const nearDomain = nearestDistanceToCells(seat, lineage.activeCells) <= 3;
  const stats = humanSeatSupportAt(source, seat.x, seat.y);
  if (!nearDomain) return { supported: false, reason: "lost_domain", ...stats };
  if (stats.pressure >= Math.max(8, stats.support * 0.75)) return { supported: false, reason: "rot_pressure", ...stats };
  if (stats.support < 6) return { supported: false, reason: "low_support", ...stats };
  return { supported: true, reason: null, ...stats };
}

function abandonHumanSeat(lineage, reason = "lost_domain") {
  if (!lineage.currentSeat) return;
  const seat = lineage.currentSeat;
  lineage.seatHistory.push({
    x: seat.x,
    y: seat.y,
    establishedTick: seat.establishedTick,
    abandonedTick: tick,
    reason,
  });
  if (lineage.seatHistory.length > 12) lineage.seatHistory = lineage.seatHistory.slice(-12);
  lineage.currentSeat = null;
  lineage.pendingSeatCandidate = null;
  lineage.seatMissingSamples = 0;
  addHumanLineageEvent("seat_abandoned", lineage, lineage.parentId, seat);
}

function markHumanSeatUnsupported(lineage, reason = "lost_domain") {
  if (!lineage.currentSeat) return;
  lineage.seatMissingSamples = (lineage.seatMissingSamples || 0) + 1;
  const abandonWindow = reason === "rot_pressure" ? HUMAN_SEAT_MARK_ABANDON_MISSES : HUMAN_SEAT_ABANDON_MISSES;
  if (lineage.seatMissingSamples >= abandonWindow || reason === "lineage_collapsed") {
    abandonHumanSeat(lineage, reason);
  } else if (reason === "rot_pressure" || lineage.seatMissingSamples >= HUMAN_SEAT_WARN_MISSES) {
    lineage.currentSeat.state = "warned";
  }
}

function promoteHumanSeatCandidate(lineage, candidate, relocated = false) {
  lineage.currentSeat = {
    x: candidate.x,
    y: candidate.y,
    establishedTick: tick,
    lastStableTick: tick,
    state: "active",
    support: candidate.support,
    pressure: candidate.pressure,
  };
  lineage.pendingSeatCandidate = null;
  lineage.seatMissingSamples = 0;
  addHumanLineageEvent("seat_established", lineage, lineage.parentId, candidate);
  if (relocated) addHumanLineageEvent("seat_relocated", lineage, lineage.parentId, candidate);
}

function compactHumanOutpost(outpost) {
  return {
    id: outpost.id,
    lineageId: outpost.lineageId || null,
    x: outpost.x,
    y: outpost.y,
    state: outpost.state,
    area: outpost.area,
    confidence: Number((outpost.confidence || 0).toFixed(3)),
    stableSamples: outpost.stableSamples || 0,
    promotedToSeat: Boolean(outpost.promotedToSeat),
    support: Number((outpost.support || 0).toFixed(2)),
    pressure: Number((outpost.pressure || 0).toFixed(2)),
  };
}

function activeHumanSeatLineages() {
  return humanLineageMemory.lineages.filter((lineage) => lineage.currentSeat);
}

function nearestActiveHumanSeatDistance(point) {
  let best = Infinity;
  for (const lineage of activeHumanSeatLineages()) {
    best = Math.min(best, distance(point, lineage.currentSeat));
  }
  return best;
}

function findMatchingHumanOutpost(lineage, candidate) {
  let best = null;
  let bestDistance = Infinity;
  for (const outpost of humanLineageMemory.humanOutposts || []) {
    if (outpost.promotedToSeat) continue;
    const d = distance(outpost, candidate);
    if (d > HUMAN_OUTPOST_SAME_DISTANCE) continue;
    const sameLineage = outpost.lineageId === lineage.id;
    const usableTransfer = !sameLineage && (outpost.state === "active" || outpost.state === "promotable" || outpost.state === "fading");
    if (!sameLineage && !usableTransfer) continue;
    if (d < bestDistance) {
      best = outpost;
      bestDistance = d;
    }
  }
  return best;
}

function outpostPromotionReady(outpost) {
  return (
    (outpost.stableSamples || 0) >= HUMAN_OUTPOST_PROMOTION_SAMPLES &&
    outpost.area >= HUMAN_OUTPOST_PROMOTION_AREA &&
    (outpost.confidence || 0) >= HUMAN_OUTPOST_PROMOTION_CONFIDENCE &&
    (outpost.support || 0) >= 10 &&
    (outpost.pressure || 0) < Math.max(6, (outpost.support || 0) * 0.45)
  );
}

function updateHumanOutpostForShape(lineage, shape, source, candidate) {
  if (!candidate) return { outpost: null, shouldGateSeat: false };
  if (!shape || shape.area < HUMAN_OUTPOST_MIN_AREA || (shape.confidence || 0) < HUMAN_OUTPOST_MIN_CONFIDENCE) {
    return { outpost: null, shouldGateSeat: false };
  }
  const nearestSeatDistance = nearestActiveHumanSeatDistance(candidate);
  const existing = findMatchingHumanOutpost(lineage, candidate);
  const shouldBeOutpost = Boolean(existing) || Number.isFinite(nearestSeatDistance) && nearestSeatDistance >= HUMAN_OUTPOST_FAR_DISTANCE;
  if (!shouldBeOutpost) return { outpost: null, shouldGateSeat: false };

  let outpost = existing;
  const previousState = outpost?.state || null;
  if (!outpost) {
    outpost = {
      id: nextHumanOutpostId(),
      lineageId: lineage.id,
      x: candidate.x,
      y: candidate.y,
      firstSeenTick: tick,
      lastSeenTick: tick,
      state: "forming",
      confidence: shape.confidence || 0,
      area: shape.area,
      support: candidate.support,
      pressure: candidate.pressure,
      stableSamples: 0,
      missingSamples: 0,
      promotedToSeat: false,
    };
    humanLineageMemory.humanOutposts.push(outpost);
    addHumanOutpostEvent("outpost_found", outpost, candidate);
  }

  outpost.lineageId = lineage.id;
  outpost.x = Math.round((outpost.x + candidate.x) / 2);
  outpost.y = Math.round((outpost.y + candidate.y) / 2);
  outpost.lastSeenTick = tick;
  outpost.confidence = Number((shape.confidence || 0).toFixed(3));
  outpost.area = shape.area;
  outpost.support = candidate.support;
  outpost.pressure = candidate.pressure;
  outpost.stableSamples = (outpost.stableSamples || 0) + 1;
  outpost.missingSamples = 0;

  if (outpostPromotionReady(outpost)) outpost.state = "promotable";
  else if (outpost.stableSamples >= HUMAN_OUTPOST_ACTIVE_SAMPLES) outpost.state = "active";
  else outpost.state = "forming";

  if (previousState !== "active" && previousState !== "promotable" && (outpost.state === "active" || outpost.state === "promotable")) {
    addHumanOutpostEvent("outpost_stabilized", outpost, candidate);
  }

  humanLineageMemory.humanOutposts = humanLineageMemory.humanOutposts
    .sort((a, b) => {
      const aActive = a.state === "active" || a.state === "promotable";
      const bActive = b.state === "active" || b.state === "promotable";
      return Number(bActive) - Number(aActive) || (b.lastSeenTick || 0) - (a.lastSeenTick || 0) || (b.stableSamples || 0) - (a.stableSamples || 0);
    })
    .slice(0, HUMAN_OUTPOST_MAX);

  return { outpost, shouldGateSeat: true };
}

function markUnseenHumanOutposts(seenOutpostIds) {
  for (const outpost of humanLineageMemory.humanOutposts || []) {
    if (seenOutpostIds.has(outpost.id) || outpost.promotedToSeat) continue;
    outpost.missingSamples = (outpost.missingSamples || 0) + 1;
    if (outpost.missingSamples >= 2 && outpost.state !== "fading") {
      outpost.state = "fading";
      addHumanOutpostEvent("outpost_faded", outpost, outpost);
    }
  }
}

function updateHumanLineageSeat(lineage, shape, source) {
  lineage.domainId = shape?.id || lineage.domainId || null;
  lineage.domainCells = cappedCells(populationShapeCells(shape, false), HUMAN_LINEAGE_MAX_MEMORY_CELLS);

  if (lineage.currentSeat) {
    const status = isSeatSupported(lineage, source);
    lineage.currentSeat.support = status.support;
    lineage.currentSeat.pressure = status.pressure;
    if (status.supported) {
      lineage.currentSeat.state = "active";
      lineage.currentSeat.lastStableTick = tick;
      lineage.seatMissingSamples = 0;
      return null;
    }
    markHumanSeatUnsupported(lineage, status.reason);
    if (lineage.currentSeat) return null;
  }

  const candidate = chooseHumanSeatCandidate(source, shape);
  if (!candidate) {
    const outpostCandidate = chooseHumanOutpostCandidate(source, shape);
    const outpostUpdate = updateHumanOutpostForShape(lineage, shape, source, outpostCandidate);
    if (outpostUpdate.outpost) {
      lineage.pendingSeatCandidate = null;
      return outpostUpdate.outpost.id;
    }
    lineage.pendingSeatCandidate = null;
    return null;
  }
  const outpostUpdate = updateHumanOutpostForShape(lineage, shape, source, candidate);
  if (outpostUpdate.outpost) {
    if (outpostUpdate.outpost.state === "promotable" && !lineage.currentSeat && activeHumanSeatLineages().length === 0) {
      promoteHumanSeatCandidate(lineage, outpostUpdate.outpost, lineage.seatHistory.length > 0);
      outpostUpdate.outpost.promotedToSeat = true;
      addHumanOutpostEvent("outpost_promoted_to_seat", outpostUpdate.outpost, outpostUpdate.outpost);
      return outpostUpdate.outpost.id;
    }
    if (outpostUpdate.shouldGateSeat) {
      lineage.pendingSeatCandidate = null;
      return outpostUpdate.outpost.id;
    }
  }
  const pending = lineage.pendingSeatCandidate;
  if (pending && distance(pending, candidate) <= HUMAN_SEAT_SAME_DISTANCE) {
    pending.x = Math.round((pending.x + candidate.x) / 2);
    pending.y = Math.round((pending.y + candidate.y) / 2);
    pending.supportSamples += 1;
    pending.support = candidate.support;
    pending.pressure = candidate.pressure;
  } else {
    lineage.pendingSeatCandidate = {
      x: candidate.x,
      y: candidate.y,
      firstSeenTick: tick,
      supportSamples: 1,
      support: candidate.support,
      pressure: candidate.pressure,
    };
  }
  if (lineage.pendingSeatCandidate.supportSamples >= HUMAN_SEAT_STABILITY_SAMPLES) {
    promoteHumanSeatCandidate(lineage, lineage.pendingSeatCandidate, lineage.seatHistory.length > 0);
  }
  return null;
}

function createHumanLineageFromShape(shape, parent = null, source = world) {
  const activeCells = humanLineageShapeCells(shape);
  const id = nextHumanLineageId();
  const lineage = {
    id,
    parentId: parent?.id || null,
    generation: parent ? parent.generation + 1 : 0,
    originTick: tick,
    lastSeenTick: tick,
    state: parent ? "descendant" : "forming",
    confidence: Number((shape.confidence || 0.5).toFixed(3)),
    origin: roundPoint(shape.center),
    centroid: roundPoint(shape.center),
    centroidPath: [roundPoint(shape.center)],
    areaHistory: [{ tick, area: shape.area }],
    activeCells,
    memoryCells: [],
    descendantIds: [],
    eventIds: [],
    missingSamples: 0,
    ...createEmptySeatFields(shape),
  };
  if (parent && !parent.descendantIds.includes(id)) parent.descendantIds.push(id);
  humanLineageMemory.lineages.push(lineage);
  addHumanLineageEvent(parent ? "descended_from" : "founded", lineage, parent?.id || null, shape.center);
  const outpostId = updateHumanLineageSeat(lineage, shape, source);
  if (outpostId) lineage.lastOutpostId = outpostId;
  return lineage;
}

function updateMatchedHumanLineage(lineage, shape, activeCells, score, source = world) {
  const oldState = lineage.state;
  const wasCollapsedLike = oldState === "declining" || oldState === "collapsed";
  const state = wasCollapsedLike ? "stable" : deriveHumanLineageState(lineage, shape);
  lineage.lastSeenTick = tick;
  lineage.state = state;
  lineage.confidence = Number(Math.min(0.98, (shape.confidence || 0.5) + Math.max(0, score) / 80).toFixed(3));
  lineage.centroid = roundPoint(shape.center);
  lineage.centroidPath.push(roundPoint(shape.center));
  lineage.centroidPath = lineage.centroidPath.slice(-HUMAN_LINEAGE_MAX_PATH);
  lineage.areaHistory.push({ tick, area: shape.area });
  lineage.areaHistory = lineage.areaHistory.slice(-HUMAN_LINEAGE_MAX_AREA_HISTORY);
  lineage.memoryCells = mergeCellsCapped([lineage.activeCells, lineage.memoryCells], HUMAN_LINEAGE_MAX_MEMORY_CELLS);
  lineage.activeCells = activeCells;
  lineage.domainId = shape.id || lineage.domainId || null;
  lineage.domainCells = cappedCells(activeCells, HUMAN_LINEAGE_MAX_MEMORY_CELLS);
  lineage.missingSamples = 0;
  const outpostId = updateHumanLineageSeat(lineage, shape, source);
  if (outpostId) lineage.lastOutpostId = outpostId;
  if (wasCollapsedLike) addHumanLineageEvent("reappeared", lineage, lineage.parentId, shape.center);
  else if (state !== oldState) {
    const eventType = eventTypeForHumanLineageState(state);
    if (eventType) addHumanLineageEvent(eventType, lineage, lineage.parentId, shape.center);
  }
}

function markUnseenHumanLineage(lineage) {
  if (lineage.state === "collapsed") return;
  lineage.missingSamples = (lineage.missingSamples || 0) + 1;
  lineage.memoryCells = mergeCellsCapped([lineage.activeCells, lineage.memoryCells], HUMAN_LINEAGE_MAX_MEMORY_CELLS);
  lineage.activeCells = [];
  markHumanSeatUnsupported(lineage, lineage.missingSamples >= HUMAN_LINEAGE_COLLAPSE_MISSES ? "lineage_collapsed" : "lost_domain");
  const nextState = lineage.missingSamples >= HUMAN_LINEAGE_COLLAPSE_MISSES ? "collapsed" : "declining";
  if (nextState !== lineage.state) {
    lineage.state = nextState;
    addHumanLineageEvent(eventTypeForHumanLineageState(nextState), lineage, lineage.parentId, lineage.centroid);
  }
}

function updateHumanLineageMemory(source = world, { force = false, mode = "macro" } = {}) {
  if (!force && humanLineageMemory && tick - humanLineageMemory.tick < MACRO_DISPLAY_INTERVAL) return humanLineageMemory;
  if (source.pointsOfInterest) worldPOIs = clonePOIs(source.pointsOfInterest);
  const frame = refreshPopulationEvolutionFrame({ source, mode, force: true });
  const candidates = (frame.shapes || [])
    .filter((shape) => shape.type === "human" && shape.state !== "fading")
    .sort((a, b) => b.area - a.area || b.confidence - a.confidence);
  const usedLineageIds = new Set();
  const seenOutpostIds = new Set();

  for (const shape of candidates) {
    const activeCells = humanLineageShapeCells(shape);
    const match = findBestHumanLineageMatch(shape, activeCells, usedLineageIds);
    if (match) {
      updateMatchedHumanLineage(match.lineage, shape, activeCells, match.score, source);
      if (match.lineage.lastOutpostId) seenOutpostIds.add(match.lineage.lastOutpostId);
      usedLineageIds.add(match.lineage.id);
      continue;
    }
    const parent = findHumanLineageParent(shape, activeCells);
    const lineage = createHumanLineageFromShape(shape, parent, source);
    if (lineage.lastOutpostId) seenOutpostIds.add(lineage.lastOutpostId);
    usedLineageIds.add(lineage.id);
  }

  for (const lineage of humanLineageMemory.lineages) {
    if (usedLineageIds.has(lineage.id)) continue;
    markUnseenHumanLineage(lineage);
  }
  markUnseenHumanOutposts(seenOutpostIds);

  humanLineageMemory.tick = tick;
  humanLineageSerial += 1;
  macroDisplayMaskCache = { source: null, macroTick: null, populationSerial: null, memorySerial: null, lineageSerial: null, politySerial: null, lineageVisible: null, mode: null, masks: null };
  return humanLineageMemory;
}

function humanLineageById(id) {
  return humanLineageMemory.lineages.find((lineage) => lineage.id === id) || null;
}

function lineageAncestryIds(lineage) {
  const ids = [];
  const seen = new Set();
  let cursor = lineage;
  while (cursor && ids.length < HUMAN_ANCESTRY_MAX_IDS && !seen.has(cursor.id)) {
    ids.push(cursor.id);
    seen.add(cursor.id);
    cursor = cursor.parentId ? humanLineageById(cursor.parentId) : null;
  }
  return ids;
}

function lineageRootAncestorId(lineage) {
  const ids = lineageAncestryIds(lineage);
  return ids[ids.length - 1] || lineage?.id || null;
}

function compactSeatAncestryForLineage(lineage) {
  const ancestry = lineageAncestryIds(lineage)
    .map(humanLineageById)
    .filter(Boolean);
  const seats = [];
  for (const item of ancestry) {
    if (item.currentSeat) {
      seats.push({
        x: item.currentSeat.x,
        y: item.currentSeat.y,
        establishedTick: item.currentSeat.establishedTick,
        abandonedTick: null,
        reason: null,
        polityId: item.polityId || null,
        lineageId: item.id,
      });
    }
    for (const seat of item.seatHistory || []) {
      seats.push({
        x: seat.x,
        y: seat.y,
        establishedTick: seat.establishedTick,
        abandonedTick: seat.abandonedTick,
        reason: seat.reason || null,
        polityId: item.polityId || null,
        lineageId: item.id,
      });
    }
  }
  return seats
    .sort((a, b) => (b.abandonedTick ?? b.establishedTick ?? 0) - (a.abandonedTick ?? a.establishedTick ?? 0))
    .slice(0, HUMAN_SEAT_ANCESTRY_MAX);
}

function compactHumanLineage(lineage) {
  const ancestryIds = lineageAncestryIds(lineage);
  return {
    id: lineage.id,
    parentId: lineage.parentId,
    generation: lineage.generation,
    lineageAncestryIds: ancestryIds,
    rootAncestorId: ancestryIds[ancestryIds.length - 1] || lineage.id,
    ancestorDepth: Math.max(0, ancestryIds.length - 1),
    originTick: lineage.originTick,
    lastSeenTick: lineage.lastSeenTick,
    state: lineage.state,
    confidence: Number((lineage.confidence || 0).toFixed(3)),
    origin: lineage.origin,
    centroid: lineage.centroid,
    centroidPath: lineage.centroidPath.slice(-HUMAN_LINEAGE_MAX_PATH),
    areaHistory: lineage.areaHistory.slice(-HUMAN_LINEAGE_MAX_AREA_HISTORY),
    activeCellCount: lineage.activeCells.length,
    memoryCellCount: lineage.memoryCells.length,
    domainId: lineage.domainId || null,
    domainArea: lineage.domainCells?.length || lineage.activeCells.length,
    currentSeat: lineage.currentSeat ? { ...lineage.currentSeat } : null,
    oldSeatCount: lineage.seatHistory?.length || 0,
    seatHistory: (lineage.seatHistory || []).slice(-6),
    seatAncestry: compactSeatAncestryForLineage(lineage),
    descendantIds: lineage.descendantIds.slice(),
    eventIds: lineage.eventIds.slice(-12),
  };
}

function dominantHumanLineage() {
  let best = null;
  let bestScore = -Infinity;
  for (const lineage of humanLineageMemory.lineages) {
    if (lineage.state === "collapsed") continue;
    const area = lineage.activeCells.length || lineage.memoryCells.length * 0.3;
    const score = area + (lineage.confidence || 0) * 10 + (lineage.state === "descendant" ? 2 : 0);
    if (score > bestScore) {
      best = lineage;
      bestScore = score;
    }
  }
  return best || humanLineageMemory.lineages[humanLineageMemory.lineages.length - 1] || null;
}

function createHumanLineageSummary() {
  const lineages = humanLineageMemory.lineages.map(compactHumanLineage);
  const outposts = (humanLineageMemory.humanOutposts || []).map(compactHumanOutpost);
  const activeLineages = humanLineageMemory.lineages.filter((lineage) => lineage.state !== "collapsed").length;
  const collapsedLineages = humanLineageMemory.lineages.filter((lineage) => lineage.state === "collapsed").length;
  const descendantLinks = humanLineageMemory.lineages.filter((lineage) => lineage.parentId).length;
  const currentSeatCount = humanLineageMemory.lineages.filter((lineage) => lineage.currentSeat).length;
  const oldSeatCount = humanLineageMemory.lineages.reduce((sum, lineage) => sum + (lineage.seatHistory?.length || 0), 0);
  const recentSeatEvents = humanLineageMemory.events.filter((event) => event.type && event.type.startsWith("seat_")).slice(-12);
  const recentOutpostEvents = humanLineageMemory.events.filter((event) => event.type && event.type.startsWith("outpost_")).slice(-12);
  return {
    version: HUMAN_LINEAGE_VERSION,
    tick: humanLineageMemory.tick,
    lineages,
    outposts,
    activeLineages,
    collapsedLineages,
    descendantLinks,
    currentSeatCount,
    oldSeatCount,
    activeOutposts: outposts.filter((outpost) => outpost.state === "active" || outpost.state === "promotable").length,
    promotableOutposts: outposts.filter((outpost) => outpost.state === "promotable").length,
    dominantLineageId: dominantHumanLineage()?.id || null,
    events: humanLineageMemory.events.slice(-HUMAN_LINEAGE_MAX_EVENTS),
    recentEvents: humanLineageMemory.events.slice(-12),
    recentSeatEvents,
    recentOutpostEvents,
  };
}

function createEmptyHumanPolityMemory() {
  return {
    version: HUMAN_POLITY_VERSION,
    tick: 0,
    nextId: 1,
    nextVillageId: 1,
    nextEventId: 1,
    polities: [],
    villages: [],
    events: [],
    splitCooldowns: {},
  };
}

function nextHumanPolityId() {
  const id = `human_polity_${String(humanPolityMemory.nextId || 1).padStart(3, "0")}`;
  humanPolityMemory.nextId = (humanPolityMemory.nextId || 1) + 1;
  return id;
}

function nextHumanVillageId() {
  const id = `human_village_${String(humanPolityMemory.nextVillageId || 1).padStart(3, "0")}`;
  humanPolityMemory.nextVillageId = (humanPolityMemory.nextVillageId || 1) + 1;
  return id;
}

function nextHumanPolityEventId() {
  const id = `human_polity_event_${String(humanPolityMemory.nextEventId || 1).padStart(3, "0")}`;
  humanPolityMemory.nextEventId = (humanPolityMemory.nextEventId || 1) + 1;
  return id;
}

function hasRecentHumanPolityEvent(type, { polityId = null, lineageId = null, villageId = null, point = null, radius = 0, cooldown = HUMAN_VILLAGE_EVENT_COOLDOWN_TICKS } = {}) {
  return (humanPolityMemory.events || []).some((event) => {
    if (event.type !== type || tick - event.tick > cooldown) return false;
    if (polityId && event.polityId !== polityId) return false;
    if (lineageId && event.lineageId !== lineageId) return false;
    if (villageId && event.villageId !== villageId) return false;
    if (point && event.x !== null && Math.hypot(event.x - point.x, event.y - point.y) > radius) return false;
    return true;
  });
}

function addHumanPolityEvent(type, polity, point = polity?.currentSeat || null, extra = {}) {
  if (!polity) return;
  const last = humanPolityMemory.events[humanPolityMemory.events.length - 1];
  if (last && last.tick === tick && last.type === type && last.polityId === polity.id && last.villageId === extra.villageId) return;
  if (type === "village_found" && hasRecentHumanPolityEvent(type, { polityId: polity.id, lineageId: extra.lineageId || null, point, radius: HUMAN_VILLAGE_REUSE_DISTANCE })) return;
  if (type === "village_faded" && hasRecentHumanPolityEvent(type, { villageId: extra.villageId || null })) return;
  const splitKey = extra.splitKey || polity.splitKey || null;
  if (type === "polity_split" && splitKey && humanPolityMemory.events.some((event) => event.type === "polity_split" && event.splitKey === splitKey)) return;
  const event = {
    id: nextHumanPolityEventId(),
    tick,
    type,
    polityId: polity.id,
    splitFromPolityId: extra.splitFromPolityId || polity.splitFromPolityId || null,
    splitKey,
    villageId: extra.villageId || null,
    lineageId: extra.lineageId || null,
    outpostId: extra.outpostId || null,
    x: point ? Number(point.x.toFixed(2)) : null,
    y: point ? Number(point.y.toFixed(2)) : null,
  };
  humanPolityMemory.events.push(event);
  if (humanPolityMemory.events.length > HUMAN_POLITY_MAX_EVENTS) humanPolityMemory.events = humanPolityMemory.events.slice(-HUMAN_POLITY_MAX_EVENTS);
  polity.recentEvents.push(event.type);
  if (polity.recentEvents.length > 12) polity.recentEvents = polity.recentEvents.slice(-12);
}

function ancestryLocationKey(point) {
  if (!point) return "unknown";
  return `${Math.round(point.x / 3)},${Math.round(point.y / 3)}`;
}

function splitKeyForPolityCandidate(parentPolity, lineage, point, outpostId = null) {
  const rootLineageId = lineageRootAncestorId(lineage) || lineage?.id || "unknown_lineage";
  const seatOrOutpostId = outpostId || ancestryLocationKey(point);
  return `${parentPolity?.id || "no_parent"}|${rootLineageId}|${seatOrOutpostId}`;
}

function splitCooldownKey(parentPolity, lineage) {
  const rootLineageId = lineageRootAncestorId(lineage) || lineage?.id || "unknown_lineage";
  return `${parentPolity?.id || "no_parent"}|${rootLineageId}`;
}

function recordHumanPolitySplitCooldown(parentPolity, lineage, point, outpostId, splitKey) {
  const key = splitCooldownKey(parentPolity, lineage);
  humanPolityMemory.splitCooldowns = humanPolityMemory.splitCooldowns || {};
  humanPolityMemory.splitCooldowns[key] = {
    tick,
    x: point?.x ?? null,
    y: point?.y ?? null,
    outpostId: outpostId || null,
    splitKey,
  };
}

function splitCooldownBlocks(parentPolity, lineage, point, outpostId) {
  const record = (humanPolityMemory.splitCooldowns || {})[splitCooldownKey(parentPolity, lineage)];
  if (!record || tick - record.tick >= HUMAN_POLITY_SPLIT_COOLDOWN_TICKS) return false;
  if (outpostId && record.outpostId && outpostId !== record.outpostId && point && record.x !== null) {
    return distance(point, { x: record.x, y: record.y }) < HUMAN_POLITY_SPLIT_DISTANCE;
  }
  return true;
}

function findReusableSplitPolity(parentPolity, lineage, point, outpostId, splitKey) {
  const rootLineageId = lineageRootAncestorId(lineage) || lineage?.id || null;
  for (const polity of humanPolityMemory.polities) {
    if (polity.state === "collapsed") continue;
    if (parentPolity && polity.id === parentPolity.id) continue;
    if (splitKey && polity.splitKey === splitKey) return polity;
    if (outpostId && (polity.outpostIds || []).includes(outpostId)) return polity;
    if (rootLineageId && polity.rootLineageId === rootLineageId && polity.currentSeat && point && distance(polity.currentSeat, point) <= HUMAN_SEAT_SAME_DISTANCE) return polity;
  }
  return null;
}

function createHumanPolity(rootLineage, { splitFromPolityId = null, currentSeat = null, outpostId = null, splitKey = null } = {}) {
  const rootLineageId = lineageRootAncestorId(rootLineage) || rootLineage?.id || null;
  const explicitSeat = currentSeat
    ? {
        ...currentSeat,
        lineageId: currentSeat.lineageId || rootLineage?.id || null,
        outpostId: currentSeat.outpostId || outpostId || null,
        seatSource: currentSeat.seatSource || (outpostId ? "outpost" : rootLineage?.id ? "lineage" : null),
        sourceId: currentSeat.sourceId || outpostId || rootLineage?.id || null,
      }
    : null;
  const polity = {
    id: nextHumanPolityId(),
    createdTick: tick,
    state: splitFromPolityId ? "split" : "forming",
    rootLineageId,
    lineageIds: rootLineage?.id ? [rootLineage.id] : [],
    currentSeat: explicitSeat,
    oldSeats: [],
    outpostIds: outpostId ? [outpostId] : [],
    villageIds: [],
    colorIndex: (humanPolityMemory.nextId || 1) % 8,
    splitFromPolityId,
    splitKey,
    createdBySplitKey: splitKey,
    missingSamples: 0,
    recentEvents: [],
  };
  humanPolityMemory.polities.push(polity);
  if (rootLineage) rootLineage.polityId = polity.id;
  addHumanPolityEvent(splitFromPolityId ? "polity_split" : "polity_founded", polity, currentSeat || rootLineage?.centroid || null, { splitFromPolityId, lineageId: rootLineage?.id || null, outpostId, splitKey });
  return polity;
}

function findHumanPolityById(id) {
  return humanPolityMemory.polities.find((polity) => polity.id === id) || null;
}

function findHumanPolityForLineage(lineage) {
  if (!lineage) return null;
  if (lineage.polityId) {
    const owned = findHumanPolityById(lineage.polityId);
    if (owned && owned.state !== "collapsed") return owned;
  }
  let cursor = lineage.parentId ? humanLineageMemory.lineages.find((item) => item.id === lineage.parentId) : null;
  while (cursor) {
    if (cursor.polityId) {
      const parentPolity = findHumanPolityById(cursor.polityId);
      if (parentPolity && parentPolity.state !== "collapsed") return parentPolity;
    }
    cursor = cursor.parentId ? humanLineageMemory.lineages.find((item) => item.id === cursor.parentId) : null;
  }
  return null;
}

function assignLineageToPolity(lineage, polity) {
  if (!lineage || !polity) return;
  lineage.polityId = polity.id;
  if (!polity.lineageIds.includes(lineage.id)) polity.lineageIds.push(lineage.id);
  polity.lineageIds = polity.lineageIds.slice(-HUMAN_POLITY_MAX_LINEAGES);
}

function deriveSeatPolityState(seat) {
  if (!seat) return null;
  if (seat.state === "warned" || seat.state === "corrupted") return "corrupted";
  if ((seat.pressure || 0) >= Math.max(8, (seat.support || 0) * 0.25)) return "pressured";
  return "active";
}

function activeLineageSeatForPolitySeat(seat) {
  if (!seat) return null;
  for (const lineage of humanLineageMemory.lineages || []) {
    if (!lineage.currentSeat || lineage.state === "collapsed") continue;
    if ((lineage.currentSeat.state === "warned" || lineage.currentSeat.state === "corrupted") && (lineage.currentSeat.pressure || 0) <= 0) continue;
    if (seat.lineageId && lineage.id !== seat.lineageId) continue;
    const samePlace = lineage.currentSeat.x === seat.x && lineage.currentSeat.y === seat.y;
    if (samePlace || distance(lineage.currentSeat, seat) <= 1) return { lineage, seat: lineage.currentSeat };
  }
  return null;
}

function lineageSeatForPolitySeat(seat) {
  const match = activeLineageSeatForPolitySeat(seat);
  if (!match) return null;
  return {
    ...match.seat,
    state: deriveSeatPolityState(match.seat),
    lineageId: match.lineage.id,
    seatSource: "lineage",
    sourceId: match.lineage.id,
  };
}

function promotedOutpostSeatForPolitySeat(seat, polity) {
  if (!seat || !polity) return null;
  for (const outpost of humanLineageMemory.humanOutposts || []) {
    const seatOutpostId = seat.outpostId || (seat.seatSource === "outpost" ? seat.sourceId : null);
    if (seatOutpostId && outpost.id !== seatOutpostId) continue;
    if (outpost.polityId !== polity.id && !(polity.outpostIds || []).includes(outpost.id)) continue;
    if (!outpost.promotedToSeat && outpost.state !== "promotable") continue;
    if (outpost.state === "fading") continue;
    if (distance(outpost, seat) <= 1) return outpost;
  }
  return null;
}

function outpostSeatForPolitySeat(seat, polity) {
  const outpost = promotedOutpostSeatForPolitySeat(seat, polity);
  if (!outpost) return null;
  return {
    ...outpost,
    state: outpost.state === "promotable" ? "active" : outpost.state,
    lineageId: outpost.lineageId || seat.lineageId || polity.rootLineageId || null,
    outpostId: outpost.id,
    seatSource: "outpost",
    sourceId: outpost.id,
  };
}

function authoritativeSeatForPolity(polity) {
  if (!polity?.currentSeat || polity.state === "collapsed") return null;
  const seat = polity.currentSeat;
  if (seat.seatSource === "lineage") return lineageSeatForPolitySeat(seat);
  if (seat.seatSource === "outpost") return outpostSeatForPolitySeat(seat, polity);
  return lineageSeatForPolitySeat(seat) || outpostSeatForPolitySeat(seat, polity);
}

function authoritativeSeatKey(polity) {
  const seat = polity?.currentSeat;
  if (!seat) return null;
  const authoritative = authoritativeSeatForPolity(polity);
  if (authoritative) {
    polity.currentSeat = authoritative;
    return `${authoritative.seatSource}:${authoritative.sourceId}`;
  }
  if (seat.seatSource && seat.sourceId) return `${seat.seatSource}:${seat.sourceId}`;
  if (seat.outpostId) return `outpost:${seat.outpostId}`;
  if (seat.lineageId) return `lineage:${seat.lineageId}`;
  return `loc:${Math.round(seat.x)},${Math.round(seat.y)}`;
}

function staleAuthoritativeSeatReason(seat) {
  if (seat?.seatSource === "outpost" || seat?.outpostId) return "stale_outpost_seat";
  if (seat?.seatSource === "lineage" || seat?.lineageId) return "stale_lineage_seat";
  return "stale_authoritative_seat";
}

function movePolitySeatToOld(polity, reason = "stale_seat") {
  if (!polity?.currentSeat) return;
  const seat = polity.currentSeat;
  if (!polity.oldSeats.some((old) => old.x === seat.x && old.y === seat.y && old.lineageId === seat.lineageId && old.reason === reason)) {
    polity.oldSeats.push({
      x: seat.x,
      y: seat.y,
      establishedTick: seat.establishedTick,
      abandonedTick: tick,
      reason,
      support: seat.support,
      pressure: seat.pressure,
      lineageId: seat.lineageId || null,
      seatSource: seat.seatSource || null,
      sourceId: seat.sourceId || null,
      outpostId: seat.outpostId || null,
    });
    polity.oldSeats = polity.oldSeats.slice(-HUMAN_POLITY_MAX_OLD_SEATS);
  }
  polity.currentSeat = null;
}

function clearCollapsedPolitySeat(polity) {
  if (!polity || polity.state !== "collapsed" || !polity.currentSeat) return;
  movePolitySeatToOld(polity, "polity_collapsed");
}

function syncPolityAuthoritativeSeat(polity) {
  if (!polity?.currentSeat) return;
  const authoritative = authoritativeSeatForPolity(polity);
  if (authoritative) {
    polity.currentSeat = authoritative;
    return;
  }
  const reason = staleAuthoritativeSeatReason(polity.currentSeat);
  movePolitySeatToOld(polity, reason);
  if (polity.state !== "seatless" && polity.state !== "declining" && polity.state !== "collapsed") addHumanPolityEvent("polity_seat_lost", polity, null);
  polity.state = "seatless";
  polity.seatlessSamples = Math.max(1, polity.seatlessSamples || 0);
  polity.pressuredSamples = 0;
}

function politySeatOwnerScore(polity, source = null) {
  let score = 0;
  if (source?.kind === "lineage") {
    if (source.lineage?.polityId === polity.id) score += 1000;
    if ((polity.lineageIds || []).includes(source.lineage?.id)) score += 100;
    if (polity.rootLineageId === source.lineage?.id) score += 60;
  }
  if (source?.kind === "outpost") {
    if (source.outpost?.polityId === polity.id) score += 1000;
    if ((polity.outpostIds || []).includes(source.outpost?.id)) score += 180;
    if ((polity.lineageIds || []).includes(source.outpost?.lineageId)) score += 40;
  }
  score += (polity.villageIds?.length || 0) * 6;
  score += (polity.outpostIds?.length || 0) * 3;
  score -= (polityAncestryIds(polity).length - 1) * 4;
  if (polity.state === "active" || polity.state === "split") score += 20;
  if (polity.state === "pressured") score += 10;
  score -= (polity.createdTick || 0) * 0.01;
  return score;
}

function enforceUniqueLineageSeatOwners() {
  const groups = new Map();
  for (const polity of humanPolityMemory.polities || []) {
    if (!polity.currentSeat || polity.state === "collapsed") continue;
    const key = authoritativeSeatKey(polity);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(polity);
  }
  for (const [key, owners] of groups.entries()) {
    if (owners.length <= 1) continue;
    const [kind, sourceId] = key.split(":");
    const source = kind === "outpost"
      ? { kind, outpost: (humanLineageMemory.humanOutposts || []).find((outpost) => outpost.id === sourceId) || null }
      : kind === "lineage"
        ? { kind, lineage: humanLineageById(sourceId) }
        : { kind };
    const winner = owners.slice().sort((a, b) => politySeatOwnerScore(b, source) - politySeatOwnerScore(a, source))[0];
    for (const polity of owners) {
      if (polity.id === winner.id) continue;
      movePolitySeatToOld(polity, "ownership_conflict");
      if (polity.state !== "seatless" && polity.state !== "declining" && polity.state !== "collapsed") addHumanPolityEvent("polity_seat_lost", polity, null);
      polity.state = (polity.villageIds?.length || polity.outpostIds?.length) ? "seatless" : "declining";
      polity.seatlessSamples = Math.max(1, polity.seatlessSamples || 0);
    }
  }
}

function cleanupCollapsedPolityOwnership() {
  for (const polity of humanPolityMemory.polities || []) {
    if (polity.state !== "collapsed") continue;
    clearCollapsedPolitySeat(polity);
  }
}

function cleanupStaleLineageSeats() {
  for (const polity of humanPolityMemory.polities || []) {
    if (!polity.currentSeat) continue;
    if (polity.state === "collapsed") {
      clearCollapsedPolitySeat(polity);
      continue;
    }
    const authoritative = authoritativeSeatForPolity(polity);
    if (authoritative) {
      polity.currentSeat = authoritative;
      continue;
    }
    const reason = staleAuthoritativeSeatReason(polity.currentSeat);
    movePolitySeatToOld(polity, reason);
    if (polity.state !== "seatless" && polity.state !== "declining") addHumanPolityEvent("polity_seat_lost", polity, null);
    polity.state = (polity.villageIds?.length || polity.outpostIds?.length) ? "seatless" : "declining";
    polity.seatlessSamples = Math.max(1, polity.seatlessSamples || 0);
  }
}

function finalizeHumanPolityOwnershipInvariants() {
  cleanupCollapsedPolityOwnership();
  cleanupStaleLineageSeats();
  enforceUniqueLineageSeatOwners();
  cleanupCollapsedPolityOwnership();
}

function findSuccessorPolityForLineageSeat(lineage) {
  if (!lineage?.currentSeat) return null;
  const seat = lineage.currentSeat;
  const rootLineageId = lineageRootAncestorId(lineage) || lineage.id || null;
  let best = null;
  let bestScore = -Infinity;
  for (const polity of humanPolityMemory.polities || []) {
    if (polity.state === "collapsed") continue;
    let score = 0;
    if ((polity.lineageIds || []).includes(lineage.id)) score += 120;
    if (rootLineageId && polity.rootLineageId === rootLineageId) score += 60;
    if (polity.currentSeat) score += Math.max(0, 80 - distance(polity.currentSeat, seat) * 8);
    for (const outpostId of polity.outpostIds || []) {
      const outpost = (humanLineageMemory.humanOutposts || []).find((item) => item.id === outpostId);
      if (outpost && outpost.state !== "fading") score += Math.max(0, 50 - distance(outpost, seat) * 6);
    }
    for (const village of humanPolityMemory.villages || []) {
      if (village.polityId === polity.id && village.state !== "fading" && village.state !== "remnant") {
        score += Math.max(0, 40 - distance(village, seat) * 5);
      }
    }
    if (score > bestScore) {
      best = polity;
      bestScore = score;
    }
  }
  return bestScore >= 40 ? best : null;
}

function syncPolitiesFromLineages() {
  for (const lineage of humanLineageMemory.lineages) {
    if (!lineage.currentSeat) continue;
    let polity = findHumanPolityForLineage(lineage);
    const collapsedOwnerId = lineage.polityId && findHumanPolityById(lineage.polityId)?.state === "collapsed" ? lineage.polityId : null;
    if (!polity) {
      polity = findSuccessorPolityForLineageSeat(lineage);
      if (!polity) {
        polity = createHumanPolity(lineage, { splitFromPolityId: collapsedOwnerId, currentSeat: lineage.currentSeat });
        if (collapsedOwnerId) addHumanPolityEvent("polity_successor_founded", polity, lineage.currentSeat, { splitFromPolityId: collapsedOwnerId, lineageId: lineage.id });
      }
    }
    assignLineageToPolity(lineage, polity);
    const oldSeat = polity.currentSeat;
    polity.currentSeat = { ...lineage.currentSeat, state: deriveSeatPolityState(lineage.currentSeat), lineageId: lineage.id, seatSource: "lineage", sourceId: lineage.id };
    const alreadySameSeat =
      oldSeat &&
      oldSeat.x === lineage.currentSeat.x &&
      oldSeat.y === lineage.currentSeat.y &&
      oldSeat.lineageId === lineage.id &&
      oldSeat.seatSource === "lineage" &&
      oldSeat.sourceId === lineage.id;
    if (polity.state !== "collapsed" && (!oldSeat || !alreadySameSeat)) addHumanPolityEvent("polity_seat_established", polity, polity.currentSeat, { lineageId: lineage.id });
    for (const seat of lineage.seatHistory || []) {
      if (!polity.oldSeats.some((old) => old.x === seat.x && old.y === seat.y && old.abandonedTick === seat.abandonedTick)) {
        polity.oldSeats.push({ ...seat, lineageId: lineage.id });
      }
    }
    polity.oldSeats = polity.oldSeats.slice(-HUMAN_POLITY_MAX_OLD_SEATS);
  }
}

function syncPolitiesFromOutposts() {
  for (const outpost of humanLineageMemory.humanOutposts || []) {
    if (outpost.promotedToSeat || outpost.state !== "promotable") continue;
    const lineage = humanLineageMemory.lineages.find((item) => item.id === outpost.lineageId);
    let parentPolity = findHumanPolityForLineage(lineage);
    const nearestActive = nearestActiveHumanPolitySeat(outpost);
    if (!parentPolity && nearestActive && nearestActive.distance >= HUMAN_POLITY_SPLIT_DISTANCE) parentPolity = nearestActive.polity;
    if (!parentPolity) parentPolity = createHumanPolity(lineage, { outpostId: outpost.id });
    assignLineageToPolity(lineage, parentPolity);
    if (!parentPolity.outpostIds.includes(outpost.id)) parentPolity.outpostIds.push(outpost.id);
    outpost.polityId = parentPolity.id;
    const parentSeat = parentPolity.currentSeat;
    const splitDistance = parentSeat ? distance(parentSeat, outpost) : Infinity;
    if (parentSeat && parentPolity.state !== "collapsed" && splitDistance >= HUMAN_POLITY_SPLIT_DISTANCE) {
      const splitKey = splitKeyForPolityCandidate(parentPolity, lineage, outpost, outpost.id);
      const reusable = findReusableSplitPolity(parentPolity, lineage, outpost, outpost.id, splitKey);
      if (reusable) {
        assignLineageToPolity(lineage, reusable);
        if (!reusable.outpostIds.includes(outpost.id)) reusable.outpostIds.push(outpost.id);
        outpost.polityId = reusable.id;
        continue;
      }
      if (splitCooldownBlocks(parentPolity, lineage, outpost, outpost.id)) continue;
      const split = createHumanPolity(lineage, { splitFromPolityId: parentPolity.id, currentSeat: { ...outpost, state: "active", lineageId: outpost.lineageId, outpostId: outpost.id, seatSource: "outpost", sourceId: outpost.id }, outpostId: outpost.id, splitKey });
      split.state = "split";
      outpost.polityId = split.id;
      recordHumanPolitySplitCooldown(parentPolity, lineage, outpost, outpost.id, splitKey);
    }
  }
}

function matchingLineageForHumanShape(shape) {
  let best = null;
  let bestScore = -Infinity;
  const cells = humanLineageShapeCells(shape);
  for (const lineage of humanLineageMemory.lineages) {
    const overlap = overlapCellCount(lineage.activeCells, cells);
    const d = distance(lineage.centroid || lineage.origin || shape.center, shape.center);
    const score = overlap * 3 + Math.max(0, 8 - d);
    if (score > bestScore) {
      best = lineage;
      bestScore = score;
    }
  }
  return bestScore > 0 ? best : null;
}

function nearestPolityForPoint(point) {
  let best = null;
  let bestDistance = Infinity;
  for (const polity of humanPolityMemory.polities) {
    if (polity.state === "collapsed") continue;
    if (!polity.currentSeat) continue;
    const d = distance(point, polity.currentSeat);
    if (d < bestDistance && d <= 12) {
      best = polity;
      bestDistance = d;
    }
  }
  if (best) return best;
  for (const outpost of humanLineageMemory.humanOutposts || []) {
    if (!outpost.polityId) continue;
    const d = distance(point, outpost);
    if (d <= 8) return findHumanPolityById(outpost.polityId);
  }
  return null;
}

function nearestOutpostPolityForPoint(point) {
  let best = null;
  let bestDistance = Infinity;
  for (const outpost of humanLineageMemory.humanOutposts || []) {
    if (!outpost.polityId || outpost.state === "fading") continue;
    const polity = activePolityById(outpost.polityId);
    if (!polity) continue;
    const d = distance(point, outpost);
    if (d < bestDistance && d <= 10) {
      best = polity;
      bestDistance = d;
    }
  }
  return best;
}

function choosePolityForVillageShape(shape, lineage, previousVillages) {
  const nearestSeat = nearestPolityForPoint(shape.center);
  if (nearestSeat) return nearestSeat;
  const nearestOutpost = nearestOutpostPolityForPoint(shape.center);
  if (nearestOutpost) return nearestOutpost;
  const previous = (previousVillages || [])
    .filter((village) => village.state !== "fading")
    .map((village) => ({ village, polity: activePolityById(village.polityId), d: distance(shape.center, village) }))
    .filter((item) => item.polity && item.d <= 8)
    .sort((a, b) => a.d - b.d)[0];
  if (previous?.polity) return previous.polity;
  const lineagePolity = findHumanPolityForLineage(lineage);
  if (lineagePolity?.state !== "collapsed") {
    const lineagePoint = lineage?.centroid || lineage?.origin || lineagePolity?.currentSeat;
    if (!lineagePoint || distance(shape.center, lineagePoint) <= 12) return lineagePolity;
  }
  return nearestSeat || nearestOutpost || lineagePolity || null;
}

function nearestActiveHumanPolitySeat(point) {
  let best = null;
  let bestDistance = Infinity;
  for (const polity of humanPolityMemory.polities) {
    if (!polity.currentSeat || polity.state === "collapsed") continue;
    const d = distance(point, polity.currentSeat);
    if (d < bestDistance) {
      best = polity;
      bestDistance = d;
    }
  }
  return best ? { polity: best, distance: bestDistance } : null;
}

function activePolityById(id) {
  const polity = findHumanPolityById(id);
  return polity && polity.state !== "collapsed" ? polity : null;
}

function inferHumanDomainPolity(shape) {
  const lineage = matchingLineageForHumanShape(shape);
  if (lineage?.polityId) {
    const polity = activePolityById(lineage.polityId);
    const cells = humanLineageShapeCells(shape);
    const overlap = overlapCellCount(lineage.activeCells, cells);
    const d = distance(lineage.centroid || lineage.origin || shape.center, shape.center);
    if (polity && (overlap > 0 || d <= 4)) return { polity, lineage };
  }

  const candidates = new Map();
  function addCandidate(polity, score, candidateLineage = null) {
    if (!polity || polity.state === "collapsed") return;
    const existing = candidates.get(polity.id);
    if (!existing || score > existing.score) candidates.set(polity.id, { polity, lineage: candidateLineage, score });
  }

  for (const polity of humanPolityMemory.polities || []) {
    if (polity.state === "collapsed") continue;
    if (polity.currentSeat) {
      const d = distance(shape.center, polity.currentSeat);
      if (d <= HUMAN_DOMAIN_OWNERSHIP_SEAT_DISTANCE) addCandidate(polity, 100 - d * 5, lineage);
    }
  }
  for (const village of humanPolityMemory.villages || []) {
    if (village.state === "fading") continue;
    const d = distance(shape.center, village);
    if (d <= HUMAN_DOMAIN_OWNERSHIP_VILLAGE_DISTANCE) addCandidate(activePolityById(village.polityId), 70 - d * 4, humanLineageById(village.lineageId));
  }
  for (const outpost of humanLineageMemory.humanOutposts || []) {
    if (!outpost.polityId || outpost.state === "fading") continue;
    const d = distance(shape.center, outpost);
    if (d <= HUMAN_DOMAIN_OWNERSHIP_OUTPOST_DISTANCE) addCandidate(activePolityById(outpost.polityId), 65 - d * 4, humanLineageById(outpost.lineageId));
  }

  const ranked = Array.from(candidates.values()).sort((a, b) => b.score - a.score);
  if (ranked.length === 0) return { polity: null, lineage };
  if (ranked.length > 1 && ranked[0].score - ranked[1].score < 12) return { polity: null, lineage };
  return ranked[0];
}

function isVillageSupportedAsRemnant(village, source) {
  if (!village || !inBounds(village.x, village.y)) return false;
  const cell = source?.[village.y]?.[village.x];
  if (!cell || cell.terrain === TERRAIN.MARK || cell.terrain === TERRAIN.BLOCK || cell.terrain === TERRAIN.BORDER) return false;
  if (cell.terrain !== TERRAIN.FIELD && cell.unit !== UNIT.HUMAN) return false;
  return (village.support || humanSeatSupportAt(source, village.x, village.y).support || 0) >= HUMAN_VILLAGE_MIN_SUPPORT;
}

function villageInheritanceScore(village, oldPolity, candidate) {
  if (!candidate || candidate.state === "collapsed") return -Infinity;
  if (!["active", "split", "pressured"].includes(candidate.state)) return -Infinity;
  let score = 0;
  const candidateAncestry = polityAncestryIds(candidate);
  const oldRoot = rootPolityId(oldPolity);
  if (candidateAncestry.includes(oldPolity.id)) score += 80;
  if (oldRoot && rootPolityId(candidate) === oldRoot) score += 30;
  const villageLineageIds = lineageAncestrySnapshot(village.lineageId).lineageAncestryIds;
  if ((candidate.lineageIds || []).some((id) => villageLineageIds.includes(id))) score += 30;
  let near = false;
  if (candidate.currentSeat) {
    const d = distance(village, candidate.currentSeat);
    if (d <= 12) {
      score += 60 - d * 3;
      near = true;
    }
  }
  for (const owned of humanPolityMemory.villages || []) {
    if (owned.polityId !== candidate.id || owned.id === village.id || owned.state === "fading") continue;
    const d = distance(village, owned);
    if (d <= 8) {
      score += 34 - d * 2;
      near = true;
    }
  }
  for (const outpost of humanLineageMemory.humanOutposts || []) {
    if (outpost.polityId !== candidate.id || outpost.state === "fading") continue;
    const d = distance(village, outpost);
    if (d <= 8) {
      score += 30 - d * 2;
      near = true;
    }
  }
  if (!near) return -Infinity;
  if (candidate.state === "active" || candidate.state === "split") score += 10;
  return score;
}

function findVillageInheritancePolity(village, oldPolity) {
  const ranked = (humanPolityMemory.polities || [])
    .filter((polity) => polity.id !== oldPolity?.id)
    .map((polity) => ({ polity, score: villageInheritanceScore(village, oldPolity, polity) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
  if (!ranked.length) return null;
  if (ranked.length > 1 && ranked[0].score - ranked[1].score < 10) return null;
  return ranked[0].polity;
}

function resolveCollapsedPolityVillage(village, oldPolity, source) {
  if (!oldPolity || oldPolity.state !== "collapsed") return null;
  const heir = findVillageInheritancePolity(village, oldPolity);
  if (heir) {
    const inherited = {
      ...village,
      polityId: heir.id,
      previousPolityId: village.previousPolityId || oldPolity.id,
      inheritedFromPolityId: oldPolity.id,
      state: village.state === "fading" ? "active" : "inherited",
      missingSamples: 0,
      lastSeenTick: tick,
    };
    addHumanPolityEvent("village_inherited", heir, inherited, { villageId: inherited.id, lineageId: inherited.lineageId });
    return inherited;
  }
  if (!isVillageSupportedAsRemnant(village, source)) {
    if (village.state === "fading") return null;
    return { ...village, state: "fading", previousPolityId: village.previousPolityId || oldPolity.id, polityId: null, missingSamples: (village.missingSamples || 0) + 1 };
  }
  const remnant = {
    ...village,
    previousPolityId: village.previousPolityId || oldPolity.id,
    polityId: null,
    state: "remnant",
    missingSamples: 0,
    lastSeenTick: tick,
  };
  addHumanPolityEvent("village_became_remnant", oldPolity, remnant, { villageId: remnant.id, lineageId: remnant.lineageId });
  return remnant;
}

function isValidHumanVillageCell(source, x, y) {
  if (!inBounds(x, y)) return false;
  if (isRiverCell(x, y)) return false;
  if (isBlockedForHumanSeat(source, x, y)) return false;
  return source[y][x].terrain === TERRAIN.FIELD;
}

function chooseVillageCandidatesForShape(source, shape, polity, lineage) {
  const cells = [...(shape.coreCells || []), ...(shape.bodyCells || []), ...(shape.edgeCells || [])];
  return cells
    .filter((cell) => isValidHumanVillageCell(source, cell.x, cell.y))
    .map((cell) => {
      const stats = humanSeatSupportAt(source, cell.x, cell.y);
      return { x: cell.x, y: cell.y, support: stats.support, pressure: stats.pressure, area: shape.area, polityId: polity.id, lineageId: lineage?.id || null, domainId: shape.id || null };
    })
    .filter((cell) => cell.support >= HUMAN_VILLAGE_MIN_SUPPORT && (!polity.currentSeat || distance(cell, polity.currentSeat) >= HUMAN_VILLAGE_MIN_SEAT_DISTANCE))
    .sort((a, b) => (b.support - b.pressure) - (a.support - a.pressure));
}

function activeVillagePolity(village) {
  const polity = findHumanPolityById(village?.polityId);
  return polity && polity.state !== "collapsed" ? polity : null;
}

function findReusableVillageForCandidate(candidate, previousVillages, usedVillageIds = new Set()) {
  const reusable = (previousVillages || []).filter((village) => !usedVillageIds.has(village.id) && village.state !== "remnant");
  const samePolityLineage = reusable
    .filter((village) => village.polityId === candidate.polityId && village.lineageId === candidate.lineageId && distance(village, candidate) <= HUMAN_VILLAGE_REUSE_DISTANCE)
    .sort((a, b) => distance(a, candidate) - distance(b, candidate))[0];
  if (samePolityLineage) return samePolityLineage;
  const samePolity = reusable
    .filter((village) => village.polityId === candidate.polityId && distance(village, candidate) <= HUMAN_VILLAGE_REUSE_DISTANCE)
    .sort((a, b) => distance(a, candidate) - distance(b, candidate))[0];
  if (samePolity) return samePolity;
  return reusable
    .filter((village) => village.lineageId === candidate.lineageId && activeVillagePolity(village) && distance(village, candidate) <= HUMAN_VILLAGE_MOVE_SMOOTHING_DISTANCE)
    .sort((a, b) => distance(a, candidate) - distance(b, candidate))[0] || null;
}

function buildVillageFromCandidate(candidate, polity, previous = null) {
  const state = candidate.pressure >= Math.max(6, candidate.support * 0.35) ? "pressured" : "active";
  const village = {
    id: previous?.id || nextHumanVillageId(),
    polityId: previous?.polityId && activeVillagePolity(previous) && distance(previous, candidate) <= HUMAN_VILLAGE_REUSE_DISTANCE ? previous.polityId : polity.id,
    lineageId: previous?.lineageId || candidate.lineageId,
    domainId: candidate.domainId,
    x: candidate.x,
    y: candidate.y,
    firstSeenTick: previous?.firstSeenTick ?? tick,
    lastSeenTick: tick,
    state,
    area: candidate.area,
    support: candidate.support,
    pressure: candidate.pressure,
    missingSamples: 0,
    previousPolityId: previous?.previousPolityId || null,
    inheritedFromPolityId: previous?.inheritedFromPolityId || null,
  };
  village.memorySeed = previous?.memorySeed || `${village.id}|${village.polityId}|${village.lineageId || "none"}|${village.firstSeenTick}`;
  return village;
}

function supportedVillageState(source, village) {
  const stats = humanSeatSupportAt(source, village.x, village.y);
  if (stats.support < HUMAN_VILLAGE_MIN_SUPPORT) return null;
  return {
    state: stats.pressure >= Math.max(6, stats.support * 0.35) ? "pressured" : "active",
    support: stats.support,
    pressure: stats.pressure,
  };
}

function updateHumanVillages(source, mode) {
  const frame = populationEvolutionFrame || refreshPopulationEvolutionFrame({ source, mode, force: true });
  const previousVillages = humanPolityMemory.villages || [];
  const nextVillages = [];
  const usedPreviousVillageIds = new Set();
  const perPolity = new Map();
  for (const shape of (frame.shapes || []).filter((item) => item.type === "human" && item.state !== "fading").sort((a, b) => b.area - a.area)) {
    const lineage = matchingLineageForHumanShape(shape);
    const polity = choosePolityForVillageShape(shape, lineage, previousVillages);
    if (!polity || polity.state === "collapsed") continue;
    const candidates = chooseVillageCandidatesForShape(source, shape, polity, lineage);
    for (const candidate of candidates) {
      if ((perPolity.get(polity.id) || 0) >= HUMAN_VILLAGE_MAX_PER_POLITY) break;
      if (nextVillages.some((village) => distance(village, candidate) < HUMAN_VILLAGE_MIN_DISTANCE)) continue;
      const previous = findReusableVillageForCandidate(candidate, previousVillages, usedPreviousVillageIds);
      const village = buildVillageFromCandidate(candidate, polity, previous);
      nextVillages.push(village);
      if (previous) usedPreviousVillageIds.add(previous.id);
      perPolity.set(polity.id, (perPolity.get(polity.id) || 0) + 1);
      if (!previous) addHumanPolityEvent("village_found", polity, village, { villageId: village.id, lineageId: village.lineageId });
      if (nextVillages.length >= HUMAN_VILLAGE_MAX) break;
    }
    if (nextVillages.length >= HUMAN_VILLAGE_MAX) break;
  }
  for (const oldVillage of previousVillages) {
    if (nextVillages.some((village) => village.id === oldVillage.id)) continue;
    if (isRiverCell(oldVillage.x, oldVillage.y)) continue;
    const oldPolity = findHumanPolityById(oldVillage.polityId || oldVillage.previousPolityId);
    if (oldVillage.state === "remnant") {
      if (isVillageSupportedAsRemnant(oldVillage, source)) {
        nextVillages.push({ ...oldVillage, polityId: null, state: "remnant", lastSeenTick: tick, missingSamples: 0 });
      } else if ((oldVillage.missingSamples || 0) < 1) {
        nextVillages.push({ ...oldVillage, polityId: null, state: "fading", missingSamples: (oldVillage.missingSamples || 0) + 1 });
      }
      if (nextVillages.length >= HUMAN_VILLAGE_MAX) break;
      continue;
    }
    if (oldPolity?.state === "collapsed") {
      const resolved = resolveCollapsedPolityVillage(oldVillage, oldPolity, source);
      if (resolved) nextVillages.push(resolved);
      if (nextVillages.length >= HUMAN_VILLAGE_MAX) break;
      continue;
    }
    const age = tick - (oldVillage.firstSeenTick ?? tick);
    const supported = oldPolity?.state !== "collapsed" ? supportedVillageState(source, oldVillage) : null;
    if (age < HUMAN_VILLAGE_MIN_LIFETIME_TICKS && supported) {
      nextVillages.push({
        ...oldVillage,
        state: supported.state,
        support: supported.support,
        pressure: supported.pressure,
        missingSamples: (oldVillage.missingSamples || 0) + 1,
      });
      if (nextVillages.length >= HUMAN_VILLAGE_MAX) break;
      continue;
    }
    if ((oldVillage.missingSamples || 0) < HUMAN_VILLAGE_MISSING_GRACE_SAMPLES) {
      const enteringFading = oldVillage.state !== "fading";
      const fading = { ...oldVillage, state: "fading", missingSamples: (oldVillage.missingSamples || 0) + 1 };
      nextVillages.push(fading);
      const polity = findHumanPolityById(fading.polityId);
      if (enteringFading && polity) addHumanPolityEvent("village_faded", polity, fading, { villageId: fading.id, lineageId: fading.lineageId });
    }
    if (nextVillages.length >= HUMAN_VILLAGE_MAX) break;
  }
  humanPolityMemory.villages = nextVillages.slice(0, HUMAN_VILLAGE_MAX);
  for (const polity of humanPolityMemory.polities) {
    polity.villageIds = humanPolityMemory.villages.filter((village) => village.polityId === polity.id && village.state !== "fading" && village.state !== "remnant").map((village) => village.id);
  }
}

function updateHumanPolityStates() {
  cleanupCollapsedPolityOwnership();
  for (const polity of humanPolityMemory.polities) syncPolityAuthoritativeSeat(polity);
  enforceUniqueLineageSeatOwners();
  for (const polity of humanPolityMemory.polities) {
    if (polity.state === "collapsed") continue;
    const activeVillages = humanPolityMemory.villages.filter((village) => village.polityId === polity.id && village.state !== "fading").length;
    const supportedVillages = humanPolityMemory.villages.filter((village) => village.polityId === polity.id && village.state !== "remnant").length;
    const activeOutposts = (humanLineageMemory.humanOutposts || []).filter((outpost) => (outpost.polityId === polity.id || (polity.outpostIds || []).includes(outpost.id)) && outpost.state !== "fading").length;
    if (polity.currentSeat) {
      const seatState = polity.currentSeat.state;
      const pressured = seatState === "pressured" || seatState === "corrupted";
      polity.pressuredSamples = pressured ? (polity.pressuredSamples || 0) + 1 : 0;
      polity.seatlessSamples = 0;
      polity.decliningSamples = 0;
      if (seatState === "corrupted" && polity.pressuredSamples >= HUMAN_POLITY_PRESSURED_MAX_SAMPLES) {
        movePolitySeatToOld(polity, "corrupted_persisted");
        addHumanPolityEvent("polity_seat_lost", polity, null);
        polity.state = "seatless";
        polity.seatlessSamples = 1;
        continue;
      }
      const nextState = pressured ? "pressured" : polity.splitFromPolityId && polity.state === "split" ? "split" : "active";
      if (nextState === "pressured" && polity.state !== "pressured") addHumanPolityEvent("polity_pressured", polity, polity.currentSeat);
      polity.state = nextState;
      polity.missingSamples = 0;
    } else if (activeVillages > 0 || supportedVillages > 0 || activeOutposts > 0) {
      polity.seatlessSamples = (polity.seatlessSamples || 0) + 1;
      polity.decliningSamples = polity.seatlessSamples >= HUMAN_POLITY_SEATLESS_DECLINE_SAMPLES ? (polity.decliningSamples || 0) + 1 : 0;
      if (polity.state !== "seatless" && polity.state !== "declining") addHumanPolityEvent("polity_seat_lost", polity, null);
      polity.state = polity.seatlessSamples >= HUMAN_POLITY_SEATLESS_DECLINE_SAMPLES ? "declining" : "seatless";
      polity.missingSamples = polity.seatlessSamples;
    } else {
      polity.seatlessSamples = (polity.seatlessSamples || 0) + 1;
      polity.decliningSamples = (polity.decliningSamples || 0) + 1;
      polity.missingSamples = polity.seatlessSamples;
      if (polity.state !== "declining" && polity.state !== "collapsed") polity.state = "declining";
      if (polity.decliningSamples >= HUMAN_POLITY_DECLINE_COLLAPSE_SAMPLES && polity.state !== "collapsed") {
        addHumanPolityEvent("polity_collapsed", polity, null);
        polity.state = "collapsed";
        clearCollapsedPolitySeat(polity);
      }
    }
  }
  finalizeHumanPolityOwnershipInvariants();
  const activeAncestorIds = new Set();
  for (const polity of humanPolityMemory.polities) {
    if (polity.state !== "collapsed") {
      for (const id of polityAncestryIds(polity)) activeAncestorIds.add(id);
    }
  }
  humanPolityMemory.polities = humanPolityMemory.polities
    .sort((a, b) => {
      const aActive = a.state !== "collapsed";
      const bActive = b.state !== "collapsed";
      if (aActive !== bActive) return Number(bActive) - Number(aActive);
      const aKeep = activeAncestorIds.has(a.id) || (a.oldSeats?.length || 0) > 0;
      const bKeep = activeAncestorIds.has(b.id) || (b.oldSeats?.length || 0) > 0;
      if (aKeep !== bKeep) return Number(bKeep) - Number(aKeep);
      return (b.villageIds?.length || 0) - (a.villageIds?.length || 0) || (b.createdTick || 0) - (a.createdTick || 0);
    })
    .slice(0, HUMAN_POLITY_MAX);
  const activePolities = humanPolityMemory.polities.filter((polity) => polity.state !== "collapsed");
  const collapsedPolities = humanPolityMemory.polities.filter((polity) => polity.state === "collapsed").slice(0, HUMAN_POLITY_MAX_COLLAPSED_RETAINED);
  humanPolityMemory.polities = activePolities.concat(collapsedPolities).slice(0, HUMAN_POLITY_MAX);
}

function updateHumanPolityMemory(source = world, { force = false, mode = "macro" } = {}) {
  if (!force && humanPolityMemory && tick - humanPolityMemory.tick < MACRO_DISPLAY_INTERVAL) return humanPolityMemory;
  if (source.pointsOfInterest) worldPOIs = clonePOIs(source.pointsOfInterest);
  syncPolitiesFromLineages();
  syncPolitiesFromOutposts();
  updateHumanVillages(source, mode);
  updateHumanPolityStates();
  finalizeHumanPolityOwnershipInvariants();
  humanPolityMemory.tick = tick;
  humanPolitySerial += 1;
  macroDisplayMaskCache = { source: null, macroTick: null, populationSerial: null, memorySerial: null, lineageSerial: null, politySerial: null, lineageVisible: null, mode: null, masks: null };
  return humanPolityMemory;
}

function polityAncestryIds(polity) {
  const ids = [];
  const seen = new Set();
  let cursor = polity;
  while (cursor && ids.length < HUMAN_ANCESTRY_MAX_IDS && !seen.has(cursor.id)) {
    ids.push(cursor.id);
    seen.add(cursor.id);
    cursor = cursor.splitFromPolityId ? findHumanPolityById(cursor.splitFromPolityId) : null;
  }
  return ids;
}

function rootPolityId(polity) {
  const ids = polityAncestryIds(polity);
  return ids[ids.length - 1] || polity?.id || null;
}

function lineageAncestrySnapshot(lineageId) {
  const lineage = humanLineageById(lineageId);
  if (!lineage) return { lineageAncestryIds: [], rootLineageId: null };
  const lineageAncestry = lineageAncestryIds(lineage);
  return {
    lineageAncestryIds: lineageAncestry,
    rootLineageId: lineageAncestry[lineageAncestry.length - 1] || lineage.id,
  };
}

function polityAncestrySnapshot(polityId) {
  const polity = findHumanPolityById(polityId);
  if (!polity) return { polityAncestryIds: [], rootPolityId: null };
  const polityAncestry = polityAncestryIds(polity);
  return {
    polityAncestryIds: polityAncestry,
    rootPolityId: polityAncestry[polityAncestry.length - 1] || polity.id,
  };
}

function compactHumanPolity(polity) {
  const ancestryIds = polityAncestryIds(polity);
  const currentSeat = polity.state === "collapsed" ? null : polity.currentSeat ? { ...polity.currentSeat } : null;
  return {
    id: polity.id,
    createdTick: polity.createdTick,
    state: polity.state,
    rootLineageId: polity.rootLineageId || null,
    splitFromPolityId: polity.splitFromPolityId || null,
    polityAncestryIds: ancestryIds,
    rootPolityId: ancestryIds[ancestryIds.length - 1] || polity.id,
    splitDepth: Math.max(0, ancestryIds.length - 1),
    splitKey: polity.splitKey || null,
    pressuredSamples: polity.pressuredSamples || 0,
    seatlessSamples: polity.seatlessSamples || 0,
    decliningSamples: polity.decliningSamples || 0,
    lineageIds: (polity.lineageIds || []).slice(-HUMAN_POLITY_MAX_LINEAGES),
    currentSeat,
    oldSeats: (polity.oldSeats || []).slice(-HUMAN_POLITY_MAX_OLD_SEATS),
    seatAncestry: (polity.oldSeats || []).slice(-HUMAN_SEAT_ANCESTRY_MAX).map((seat) => ({ ...seat })),
    outpostIds: (polity.outpostIds || []).slice(-HUMAN_OUTPOST_MAX),
    villageIds: (polity.villageIds || []).slice(-HUMAN_VILLAGE_MAX),
    colorIndex: polity.colorIndex || 0,
    recentEvents: (polity.recentEvents || []).slice(-8),
  };
}

function compactHumanVillage(village) {
  const lineageSnapshot = lineageAncestrySnapshot(village.lineageId);
  const politySnapshot = polityAncestrySnapshot(village.polityId || village.previousPolityId);
  return {
    id: village.id,
    polityId: village.polityId || null,
    previousPolityId: village.previousPolityId || null,
    inheritedFromPolityId: village.inheritedFromPolityId || null,
    lineageId: village.lineageId || null,
    lineageAncestryIds: lineageSnapshot.lineageAncestryIds,
    polityAncestryIds: politySnapshot.polityAncestryIds,
    rootLineageId: lineageSnapshot.rootLineageId,
    rootPolityId: politySnapshot.rootPolityId,
    memorySeed: village.memorySeed || `${village.id}|${village.polityId || "none"}|${village.lineageId || "none"}|${village.firstSeenTick}`,
    x: village.x,
    y: village.y,
    firstSeenTick: village.firstSeenTick,
    lastSeenTick: village.lastSeenTick,
    state: village.state,
    missingSamples: village.missingSamples || 0,
    area: village.area,
    support: Number((village.support || 0).toFixed(2)),
    pressure: Number((village.pressure || 0).toFixed(2)),
  };
}

function dominantHumanPolity() {
  let best = null;
  let bestScore = -Infinity;
  for (const polity of humanPolityMemory.polities) {
    const score =
      (polity.currentSeat ? 20 : 0) +
      (polity.state === "active" ? 10 : polity.state === "pressured" ? 8 : polity.state === "split" ? 7 : 0) +
      (polity.villageIds?.length || 0) * 3 +
      (polity.outpostIds?.length || 0);
    if (score > bestScore) {
      best = polity;
      bestScore = score;
    }
  }
  return best;
}

function createHumanPolitySummary() {
  const polities = humanPolityMemory.polities.map(compactHumanPolity);
  const villages = humanPolityMemory.villages.map(compactHumanVillage);
  return {
    version: HUMAN_POLITY_VERSION,
    tick: humanPolityMemory.tick,
    polities,
    activePolities: polities.filter((polity) => polity.state === "active" || polity.state === "split").length,
    pressuredPolities: polities.filter((polity) => polity.state === "pressured").length,
    seatlessPolities: polities.filter((polity) => polity.state === "seatless" || polity.state === "declining").length,
    collapsedPolities: polities.filter((polity) => polity.state === "collapsed").length,
    villages,
    activeVillages: villages.filter((village) => village.state === "active" || village.state === "pressured").length,
    activeRemnants: villages.filter((village) => village.state === "remnant").length,
    inheritedVillages: villages.filter((village) => village.inheritedFromPolityId).length,
    dominantPolityId: dominantHumanPolity()?.id || null,
    recentEvents: humanPolityMemory.events.slice(-12),
  };
}

function validateHumanPolityOwnership(source = macroDisplayWorld || world) {
  const collapsedWithCurrentSeat = (humanPolityMemory.polities || []).filter((polity) => polity.state === "collapsed" && polity.currentSeat).length;
  const duplicateSeatOwners = Array.from((humanPolityMemory.polities || []).reduce((map, polity) => {
    if (polity.state === "collapsed" || !polity.currentSeat) return map;
    const key = authoritativeSeatKey(polity);
    if (!key) return map;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(polity.id);
    return map;
  }, new Map()).values()).filter((owners) => owners.length > 1).length;
  const staleLineageSeats = (humanPolityMemory.polities || []).filter((polity) => {
    if (polity.state === "collapsed" || !polity.currentSeat) return false;
    return !authoritativeSeatForPolity(polity);
  }).length;
  const outpostDerivedValidSeatsIncorrectlyCleared = (humanLineageMemory.humanOutposts || []).filter((outpost) => {
    if (!outpost.polityId || outpost.state === "fading") return false;
    if (!outpost.promotedToSeat && outpost.state !== "promotable") return false;
    const polity = findHumanPolityById(outpost.polityId);
    if (!polity || polity.state === "collapsed") return false;
    return !(polity.currentSeat && (polity.currentSeat.outpostId === outpost.id || polity.currentSeat.sourceId === outpost.id) && distance(polity.currentSeat, outpost) <= 1);
  }).length;
  const collapsedCurrentTags = createSemanticTags(source, { mode: viewModeSelect?.value || "macro" })
    .filter((tag) => tag.polityId && isCurrentHumanTag(tag.label) && findHumanPolityById(tag.polityId)?.state === "collapsed").length;
  return {
    collapsedWithCurrentSeat,
    collapsedCurrentTags,
    duplicateSeatOwners,
    staleLineageSeats,
    outpostDerivedValidSeatsIncorrectlyCleared,
  };
}

function updateHumanPolityStatus(summary = createHumanPolitySummary()) {
  if (!polityTotalEl) return;
  const recent = summary.recentEvents?.[summary.recentEvents.length - 1] || null;
  polityTotalEl.textContent = String(summary.polities.length);
  polityActiveEl.textContent = String(summary.activePolities);
  polityPressuredEl.textContent = String(summary.pressuredPolities);
  politySeatlessEl.textContent = String(summary.seatlessPolities);
  polityVillagesEl.textContent = String(summary.activeVillages);
  polityOutpostsEl.textContent = String(createHumanLineageSummary().activeOutposts);
  polityDominantEl.textContent = summary.dominantPolityId || "-";
  polityRecentEventEl.textContent = recent ? recent.type : "-";
}

function updateHumanLineageStatus(summary = createHumanLineageSummary()) {
  if (!lineageTotalEl) return;
  const recent = summary.recentEvents?.[summary.recentEvents.length - 1] || summary.events?.[summary.events.length - 1] || null;
  lineageTotalEl.textContent = String(summary.lineages.length);
  lineageActiveEl.textContent = String(summary.activeLineages);
  lineageCollapsedEl.textContent = String(summary.collapsedLineages);
  lineageDescendantsEl.textContent = String(summary.descendantLinks);
  lineageDominantEl.textContent = summary.dominantLineageId || "-";
  lineageRecentEventEl.textContent = recent ? recent.type : "-";
}

function shouldShowHumanLineage() {
  return Boolean(lineageToggle?.checked);
}

function addHumanLineageDisplayClasses(mask) {
  if (!shouldShowHumanLineage()) return;
  const lineage = dominantHumanLineage();
  if (!lineage) return;
  for (const cell of lineage.memoryCells) addMacroCellClass(mask, cell.x, cell.y, "lineage-human-memory");
  for (const point of lineage.centroidPath) addMacroCellClass(mask, Math.round(point.x), Math.round(point.y), "lineage-human-path");
  if (lineage.parentId) {
    const parent = humanLineageMemory.lineages.find((item) => item.id === lineage.parentId);
    if (parent?.centroid) addMacroCellClass(mask, Math.round(parent.centroid.x), Math.round(parent.centroid.y), "lineage-human-descendant-link");
    if (lineage.centroid) addMacroCellClass(mask, Math.round(lineage.centroid.x), Math.round(lineage.centroid.y), "lineage-human-descendant-link");
  }
  if (lineage.origin) addMacroCellClass(mask, Math.round(lineage.origin.x), Math.round(lineage.origin.y), "lineage-human-origin");
  if (lineage.centroid) addMacroCellClass(mask, Math.round(lineage.centroid.x), Math.round(lineage.centroid.y), "lineage-human-current");
}

function validTagCell(source, x, y, { allowBlocked = false } = {}) {
  if (!inBounds(x, y)) return false;
  if (!allowBlocked && source?.[y]?.[x]?.terrain === TERRAIN.BLOCK) return false;
  return true;
}

function nearestCellToPoint(cells, point, source, options = {}) {
  if (!point) return null;
  let best = null;
  let bestDistance = Infinity;
  for (const cell of cells || []) {
    if (!validTagCell(source, cell.x, cell.y, options)) continue;
    const d = distance(point, cell);
    if (d < bestDistance) {
      best = { x: cell.x, y: cell.y };
      bestDistance = d;
    }
  }
  return best;
}

function representativeCellForTag({ center, preferredCells = [], fallbackCells = [], source = world, allowBlocked = false }) {
  const preferred = nearestCellToPoint(preferredCells, center, source, { allowBlocked });
  if (preferred) return preferred;
  const fallback = nearestCellToPoint(fallbackCells, center, source, { allowBlocked });
  if (fallback) return fallback;
  if (!center) return null;
  const rounded = { x: Math.round(center.x), y: Math.round(center.y) };
  return validTagCell(source, rounded.x, rounded.y, { allowBlocked }) ? rounded : null;
}

function addSemanticTag(tags, tag) {
  if (!tag || tags.length >= MAX_SEMANTIC_TAGS) return;
  if (!inBounds(tag.x, tag.y)) return;
  const normalized = {
    type: tag.type,
    label: tag.label,
    x: tag.x,
    y: tag.y,
    source: tag.source,
    sourceId: tag.sourceId || null,
    category: tag.category || "neutral",
    priority: tag.priority || 100,
  };
  for (const key of ["polityId", "previousPolityId", "inheritedFromPolityId", "memorySeed", "polityState", "polityColorIndex", "lineageId", "state", "support", "pressure", "splitFromPolityId", "lineageAncestryIds", "polityAncestryIds", "rootLineageId", "rootPolityId", "seatSource", "seatSourceId", "outpostId", "abandonedTick", "reason"]) {
    if (tag[key] !== undefined && tag[key] !== null) normalized[key] = tag[key];
  }
  normalized.title = tag.title || semanticTagTitle(normalized);
  tags.push(normalized);
}

function compactNumber(value) {
  return Number((value || 0).toFixed(2));
}

function semanticTagTitle(tag) {
  if (!tag.polityId) return `${tag.label}: ${tag.source}`;
  const lines = [tag.label, `Polity: ${tag.polityId}`];
  if (tag.polityState) lines.push(`Polity state: ${tag.polityState}`);
  if (tag.lineageId) lines.push(`Lineage: ${tag.lineageId}`);
  if (tag.rootLineageId) lines.push(`Root lineage: ${tag.rootLineageId}`);
  if (tag.rootPolityId) lines.push(`Root polity: ${tag.rootPolityId}`);
  if (tag.seatSource) lines.push(`Seat source: ${tag.seatSource}${tag.seatSourceId ? ` ${tag.seatSourceId}` : ""}`);
  if (tag.state) lines.push(`${tag.label.includes("seat") ? "Seat state" : "State"}: ${tag.state}`);
  if (tag.support !== undefined) lines.push(`Support: ${compactNumber(tag.support)}`);
  if (tag.pressure !== undefined) lines.push(`Pressure: ${compactNumber(tag.pressure)}`);
  if (tag.reason) lines.push(`Reason: ${tag.reason}`);
  if (tag.abandonedTick !== undefined) lines.push(`Abandoned tick: ${tag.abandonedTick}`);
  if (tag.splitFromPolityId) lines.push(`Split from: ${tag.splitFromPolityId}`);
  return lines.join("\n");
}

function readableValue(value, fallback = "not assigned") {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : String(compactNumber(value));
  return String(value);
}

function setElementAttribute(el, name, value) {
  if (!el) return;
  if (typeof el.setAttribute === "function") el.setAttribute(name, value);
  else el[name] = value;
}

function semanticTagPosition(tag) {
  return `(${readableValue(tag.x, "?")}, ${readableValue(tag.y, "?")})`;
}

function semanticTagInfoRow(label, value, fallback) {
  return { label, value: readableValue(value, fallback) };
}

function ancestryRowValue(ids) {
  return Array.isArray(ids) && ids.length ? ids.join(" <- ") : "";
}

function appendAncestryRows(rows, tag) {
  if (Array.isArray(tag.lineageAncestryIds) && tag.lineageAncestryIds.length) rows.push(semanticTagInfoRow("Lineage chain", ancestryRowValue(tag.lineageAncestryIds)));
  if (Array.isArray(tag.polityAncestryIds) && tag.polityAncestryIds.length) rows.push(semanticTagInfoRow("Polity chain", ancestryRowValue(tag.polityAncestryIds)));
  if (tag.rootLineageId) rows.push(semanticTagInfoRow("Root lineage", tag.rootLineageId));
  if (tag.rootPolityId) rows.push(semanticTagInfoRow("Root polity", tag.rootPolityId));
}

function semanticTagPOIRole(tag) {
  const label = tag.label || "";
  const type = tag.type || tag.sourceId || "";
  if (label === "Rot Source" || type.includes("rot")) return "persistent rot / corruption anchor";
  if (label === "Spring" || type.includes("spring")) return "fertility support, blocked center";
  if (label === "Great Forest" || type.includes("forest")) return "Beast / WILD habitat and origin";
  if (label === "Monument" || type.includes("monument")) return "Human / FIELD memory support";
  return "major macro point of interest";
}

function humanSeatInterpretation(tag) {
  const state = tag.state || tag.polityState || "";
  if (state.includes("corrupt") || state.includes("unstable")) return "corrupted / unstable capital";
  if (tag.label === "H pressured seat" || state.includes("pressured")) return "capital under pressure";
  return "stable capital";
}

function humanOutpostInterpretation(tag) {
  if (tag.splitFromPolityId) return "split-polity frontier";
  if (tag.state === "promotable") return "possible future seat";
  return "distant Human outpost";
}

function placeAnchorTypeForTarget(target = {}) {
  if (target.placeType) return target.placeType;
  if (target.source === "poi") return "poi";
  if (target.source === "river") return "river";
  if (target.label === "H village") return "village";
  if (target.label === "H seat" || target.label === "H pressured seat") return "seat";
  if (target.label === "H old seat") return "old_seat";
  if (target.label === "H outpost") return "outpost";
  if (target.label === "H remnant") return "remnant";
  if (target.label === "S scar") return "scar";
  if (target.label === "B range") return "beast_range";
  if (target.label === "H domain") return "domain";
  return "place";
}

function placeSourceRefForTarget(target = {}) {
  const type = placeAnchorTypeForTarget(target);
  const id = target.sourceId || target.id || `${type}_${Math.round(target.x)}_${Math.round(target.y)}`;
  return { kind: type, id };
}

function placeAnchorIdForRef(ref) {
  return `${ref.kind}:${ref.id}`;
}

function displayNameForPlaceTarget(target = {}) {
  return target.label || target.name || placeAnchorTypeForTarget(target);
}

function normalizedPlaceType(anchorOrTarget = {}) {
  return anchorOrTarget.type || anchorOrTarget.placeType || anchorOrTarget.sourceRef?.kind || placeAnchorTypeForTarget(anchorOrTarget);
}

function normalizeSettlementKind(kind) {
  if (kind === "old_seat" || kind === "remnant" || kind === "outpost" || kind === "domain" || kind === "seat" || kind === "village") return kind;
  if (kind === "polity_old_seat" || kind === "lineage_old_seat") return "old_seat";
  if (kind === "polity_remnant") return "remnant";
  if (kind === "lineage_outpost") return "outpost";
  if (kind === "polity_seat" || kind === "lineage_seat" || kind === "polity_pressured_seat") return "seat";
  if (kind === "polity_village") return "village";
  if (kind === "population_human") return "domain";
  return null;
}

function normalizeSettlementState(state, kind = null) {
  if (state === "lost" || state === "abandoned" || state === "absorbed" || state === "remnant" || state === "fading") return state;
  if (state === "old") return "lost";
  if (state === "collapsed") return kind === "remnant" ? "remnant" : "lost";
  if (state === "inherited" || state === "pressured" || state === "active" || state === "split" || state === "seatless" || state === "declining" || state === "promotable") return "active";
  return kind === "remnant" ? "remnant" : "active";
}

function findHumanVillageForPlace(target = {}) {
  const id = target.sourceRef?.id || target.sourceId || target.id;
  if (id) {
    const found = (humanPolityMemory.villages || []).find((village) => village.id === id);
    if (found) return found;
  }
  const x = Math.round(target.x ?? target.position?.x ?? -1);
  const y = Math.round(target.y ?? target.position?.y ?? -1);
  return (humanPolityMemory.villages || []).find((village) => village.x === x && village.y === y) || null;
}

function ancestryIdsFromTargetOrPolity(target, polity) {
  if (Array.isArray(target.polityAncestryIds)) return target.polityAncestryIds.slice(0, HUMAN_ANCESTRY_MAX_IDS);
  return polity ? polityAncestryIds(polity) : [];
}

function ancestryIdsFromTargetOrLineage(target, lineage) {
  if (Array.isArray(target.lineageAncestryIds)) return target.lineageAncestryIds.slice(0, HUMAN_ANCESTRY_MAX_IDS);
  return lineage ? lineageAncestryIds(lineage) : [];
}

function inferContinuityReason(target = {}, kind = null, polity = null) {
  if (target.reason === "seat_moved" || target.reason === "stale_lineage_seat" || target.reason === "stale_outpost_seat" || kind === "old_seat") return "seat_moved";
  if (target.inheritedFromPolityId) return "recovered";
  if (target.previousPolityId && !target.polityId) return "collapse";
  if (polity?.splitFromPolityId) return "polity_split";
  if (target.previousPolityId && target.polityId && target.previousPolityId !== target.polityId) return "absorbed";
  return "unknown";
}

function compactRememberedHumanIdentityFromMemory(humanMemory = null, source = "current_snapshot") {
  const polityId = humanMemory?.polity?.id || null;
  const lineageId = humanMemory?.lineage?.id || null;
  const rootPolityId = humanMemory?.polity?.rootPolityId || polityId || null;
  const rootLineageId = humanMemory?.lineage?.rootLineageId || lineageId || null;
  if (!polityId && !lineageId && !rootPolityId && !rootLineageId) return null;
  return {
    polityId,
    polityState: humanMemory?.polity?.state || null,
    lineageId,
    rootPolityId,
    rootLineageId,
    polityAncestryIds: Array.isArray(humanMemory?.polity?.ancestryIds) ? humanMemory.polity.ancestryIds.slice(0, HUMAN_ANCESTRY_MAX_IDS) : [],
    lineageAncestryIds: Array.isArray(humanMemory?.lineage?.ancestryIds) ? humanMemory.lineage.ancestryIds.slice(0, HUMAN_ANCESTRY_MAX_IDS) : [],
    rememberedAtTick: tick,
    source,
  };
}

function normalizeRememberedHumanIdentity(identity = null) {
  if (!identity) return null;
  const polityId = identity.polityId || null;
  const lineageId = identity.lineageId || null;
  const rootPolityId = identity.rootPolityId || polityId || null;
  const rootLineageId = identity.rootLineageId || lineageId || null;
  if (!polityId && !lineageId && !rootPolityId && !rootLineageId) return null;
  return {
    polityId,
    polityState: identity.polityState || null,
    lineageId,
    rootPolityId,
    rootLineageId,
    polityAncestryIds: Array.isArray(identity.polityAncestryIds) ? identity.polityAncestryIds.slice(0, HUMAN_ANCESTRY_MAX_IDS) : [],
    lineageAncestryIds: Array.isArray(identity.lineageAncestryIds) ? identity.lineageAncestryIds.slice(0, HUMAN_ANCESTRY_MAX_IDS) : [],
    rememberedAtTick: identity.rememberedAtTick ?? null,
    source: identity.source || "place_memory",
  };
}

function updateRememberedHumanIdentity(anchor, snapshot) {
  if (!anchor || !snapshot?.humanMemory) return;
  const remembered = compactRememberedHumanIdentityFromMemory(snapshot.humanMemory);
  if (remembered) anchor.rememberedHumanIdentity = remembered;
}

function buildHumanMemory(anchorOrTarget = {}) {
  const type = normalizedPlaceType(anchorOrTarget);
  const kind = normalizeSettlementKind(type);
  if (!kind && !anchorOrTarget.polityId && !anchorOrTarget.lineageId && !anchorOrTarget.previousPolityId) return null;
  const village = kind === "village" || kind === "remnant" ? findHumanVillageForPlace(anchorOrTarget) : null;
  const sourceId = anchorOrTarget.sourceRef?.id || anchorOrTarget.sourceId || anchorOrTarget.id || village?.id || null;
  const polityId = anchorOrTarget.polityId || village?.polityId || anchorOrTarget.previousPolityId || village?.previousPolityId || null;
  const lineageId = anchorOrTarget.lineageId || village?.lineageId || null;
  const polity = findHumanPolityById(polityId);
  const lineage = humanLineageById(lineageId);
  const polityAncestry = ancestryIdsFromTargetOrPolity(anchorOrTarget, polity);
  const lineageAncestry = ancestryIdsFromTargetOrLineage(anchorOrTarget, lineage);
  const seat = polity?.currentSeat || null;
  const x = Number(anchorOrTarget.x ?? anchorOrTarget.position?.x ?? village?.x ?? seat?.x ?? 0);
  const y = Number(anchorOrTarget.y ?? anchorOrTarget.position?.y ?? village?.y ?? seat?.y ?? 0);
  const distanceToSeat = seat ? Number(distance({ x, y }, seat).toFixed(2)) : null;
  const settlementKind = kind || (seat && distance({ x, y }, seat) <= 1 ? "seat" : "domain");
  const settlementState = normalizeSettlementState(anchorOrTarget.state || village?.state || polity?.state, settlementKind);
  return {
    settlement: {
      id: sourceId,
      kind: settlementKind,
      state: settlementState,
      foundedTick: village?.firstSeenTick ?? polity?.createdTick ?? lineage?.firstSeenTick ?? null,
      lastActiveTick: village?.lastSeenTick ?? lineage?.lastSeenTick ?? null,
      support: Number((anchorOrTarget.support ?? village?.support ?? 0).toFixed ? (anchorOrTarget.support ?? village?.support ?? 0).toFixed(2) : anchorOrTarget.support ?? village?.support ?? 0),
      area: Number((anchorOrTarget.area ?? village?.area ?? 0).toFixed ? (anchorOrTarget.area ?? village?.area ?? 0).toFixed(2) : anchorOrTarget.area ?? village?.area ?? 0),
      connectedToSeat: distanceToSeat !== null ? distanceToSeat <= 12 : false,
      distanceToSeat,
    },
    polity: {
      id: polityId,
      displayName: polityId,
      state: polity?.state || anchorOrTarget.polityState || null,
      rootPolityId: anchorOrTarget.rootPolityId || polityAncestry[polityAncestry.length - 1] || polityId || null,
      parentPolityId: polity?.splitFromPolityId || anchorOrTarget.splitFromPolityId || null,
      ancestryIds: polityAncestry,
      branchDepth: Math.max(0, polityAncestry.length - 1),
      foundedTick: polity?.createdTick ?? null,
      collapsedTick: polity?.collapsedTick ?? null,
    },
    lineage: {
      id: lineageId,
      rootLineageId: anchorOrTarget.rootLineageId || lineageAncestry[lineageAncestry.length - 1] || lineage?.rootLineageId || lineageId || null,
      parentLineageId: lineage?.parentId || lineage?.parentLineageId || null,
      ancestryIds: lineageAncestry,
      branchDepth: Math.max(0, lineageAncestry.length - 1),
      firstSeenTick: lineage?.firstSeenTick ?? null,
      lastSeenTick: lineage?.lastSeenTick ?? null,
    },
    continuity: {
      previousPlaceId: anchorOrTarget.previousPolityId || village?.previousPolityId || null,
      successorPlaceId: null,
      transferReason: inferContinuityReason(anchorOrTarget, settlementKind, polity),
    },
  };
}

function createPlaceState({ ecology, fertility, poi, humanMemory }) {
  const field = ecology.fieldCells || 0;
  const wild = ecology.wildCells || 0;
  const mark = ecology.markCells || 0;
  const humans = ecology.humanUnits || 0;
  const beasts = ecology.beastUnits || 0;
  const spirits = ecology.spiritUnits || 0;
  const riverCells = ecology.riverCells || 0;
  const mixedHumanSpirit = (field > 0 && mark > 0) || (humans > 0 && spirits > 0);
  const signalStrength = Math.max(field + humans, wild + beasts, mark + spirits, riverCells);
  let status = "stable";
  let trend = "silent";
  let dominantPressure = "none";
  if (poi?.type === POI_TYPES.ROT_SOURCE || mark >= 4 || spirits >= 2) {
    status = "corrupted";
    trend = "unstable";
    dominantPressure = poi?.type === POI_TYPES.ROT_SOURCE ? "rot" : "spirit";
  } else if (mixedHumanSpirit || (field > 0 && wild > 0 && mark > 0)) {
    status = "contested";
    trend = "unstable";
    dominantPressure = "mixed";
  } else if (humanMemory?.settlement?.state === "remnant") {
    status = "remnant";
    trend = "silent";
    dominantPressure = "human";
  } else if (humanMemory?.settlement && (field > 0 || humans > 0)) {
    status = "active";
    trend = "holding";
    dominantPressure = "human";
  } else if (riverCells > 0 && (fertility.average || 0) >= 2) {
    status = "recovering";
    trend = "growing";
    dominantPressure = "water";
  } else if (poi?.type === POI_TYPES.GREAT_FOREST || (wild > 0 && beasts > 0)) {
    status = "active";
    trend = "holding";
    dominantPressure = poi?.type === POI_TYPES.GREAT_FOREST ? "forest" : "beast";
  } else if (wild > field && wild > mark) {
    status = "active";
    trend = "holding";
    dominantPressure = "beast";
  }
  if (humanMemory?.settlement?.state === "lost" || humanMemory?.settlement?.state === "abandoned") {
    status = "abandoned";
    trend = "declining";
  }
  const intensity = signalStrength >= 8 ? "high" : signalStrength >= 3 ? "medium" : "low";
  return {
    status: PLACE_STATE_STATUSES.has(status) ? status : "stable",
    trend: PLACE_STATE_TRENDS.has(trend) ? trend : "silent",
    dominantPressure: PLACE_PRESSURES.has(dominantPressure) ? dominantPressure : "none",
    intensity,
    confidence: signalStrength >= 5 ? 0.8 : signalStrength >= 2 ? 0.6 : 0.4,
    visible: true,
  };
}

function pushSemanticTrait(traits, trait) {
  if (trait && !traits.includes(trait)) traits.push(trait);
}

function placeTypeHint(anchorOrTarget = {}) {
  return normalizedPlaceType(anchorOrTarget);
}

function hasAnyTrait(traits, ids) {
  return ids.some((id) => traits.includes(id));
}

function nearbyPOITypesForPlace(x, y, radius = 2) {
  const types = [];
  for (const poi of worldPOIs || []) {
    if (poi.state && poi.state !== "active") continue;
    if (Math.hypot((poi.x || 0) - x, (poi.y || 0) - y) <= radius) pushSemanticTrait(types, poi.type);
  }
  return types;
}

function deriveSemanticTraits(snapshot, anchorOrTarget = null) {
  const traits = [];
  const type = placeTypeHint(anchorOrTarget || {});
  const ecology = snapshot?.ecology || {};
  const fertility = snapshot?.fertility || {};
  const placeState = snapshot?.placeState || {};
  const humanMemory = snapshot?.humanMemory || null;
  const nearbyPOITypes = snapshot?.nearbyPOITypes || [];
  const settlementKind = humanMemory?.settlement?.kind || normalizeSettlementKind(type);
  const settlementState = humanMemory?.settlement?.state || anchorOrTarget?.state || null;
  const polityState = humanMemory?.polity?.state || anchorOrTarget?.polityState || null;
  const rememberedHumanIdentity = normalizeRememberedHumanIdentity(snapshot?.rememberedHumanIdentity || anchorOrTarget?.rememberedHumanIdentity || null);
  const hasCurrentHumanIdentity = Boolean(humanMemory?.polity?.id || humanMemory?.lineage?.id || humanMemory?.lineage?.rootLineageId);

  if (snapshot?.center?.isRiver) pushSemanticTrait(traits, SEMANTIC_TRAITS.RIVER_CENTER);
  if ((ecology.riverCells || 0) > 0) pushSemanticTrait(traits, SEMANTIC_TRAITS.RIVER_ADJACENT);
  if (type === "river" || (ecology.riverCells || 0) >= 2) pushSemanticTrait(traits, SEMANTIC_TRAITS.RIVER_CROSSING);
  if (snapshot?.poi?.type === POI_TYPES.SPRING || nearbyPOITypes.includes(POI_TYPES.SPRING)) pushSemanticTrait(traits, SEMANTIC_TRAITS.SPRING_FED);
  if (snapshot?.poi?.type === POI_TYPES.GREAT_FOREST || nearbyPOITypes.includes(POI_TYPES.GREAT_FOREST)) pushSemanticTrait(traits, SEMANTIC_TRAITS.GREAT_FOREST_NEARBY);
  if (snapshot?.poi?.type === POI_TYPES.ROT_SOURCE || nearbyPOITypes.includes(POI_TYPES.ROT_SOURCE)) pushSemanticTrait(traits, SEMANTIC_TRAITS.ROT_SOURCE_NEARBY);
  if (snapshot?.poi?.type === POI_TYPES.MONUMENT || nearbyPOITypes.includes(POI_TYPES.MONUMENT)) pushSemanticTrait(traits, SEMANTIC_TRAITS.MONUMENT_SHADOWED);
  if ((snapshot?.terrain?.["#"] || 0) > 0 || (snapshot?.nearbyBlockCells || 0) > 0) pushSemanticTrait(traits, SEMANTIC_TRAITS.MOUNTAIN_BLOCKED);

  if (settlementKind === "seat") pushSemanticTrait(traits, SEMANTIC_TRAITS.HUMAN_SEAT);
  if (settlementKind === "old_seat") pushSemanticTrait(traits, SEMANTIC_TRAITS.HUMAN_OLD_SEAT);
  if (settlementKind === "outpost") pushSemanticTrait(traits, SEMANTIC_TRAITS.HUMAN_OUTPOST);
  if (settlementKind === "remnant") pushSemanticTrait(traits, SEMANTIC_TRAITS.HUMAN_REMNANT);
  if (settlementKind === "domain") pushSemanticTrait(traits, SEMANTIC_TRAITS.HUMAN_DOMAIN);
  if (settlementKind === "village" || (ecology.humanUnits || 0) > 0 || (ecology.fieldCells || 0) >= 4) pushSemanticTrait(traits, SEMANTIC_TRAITS.HUMAN_SETTLED);
  if (humanMemory?.polity?.id) pushSemanticTrait(traits, SEMANTIC_TRAITS.POLITY_OWNED);
  if (humanMemory?.lineage?.id || humanMemory?.lineage?.rootLineageId) pushSemanticTrait(traits, SEMANTIC_TRAITS.LINEAGE_CONTINUITY);
  if (humanMemory?.polity?.parentPolityId || (humanMemory?.polity?.branchDepth || 0) > 0) pushSemanticTrait(traits, SEMANTIC_TRAITS.SPLIT_POLITY);
  if (polityState === "seatless" || polityState === "declining") pushSemanticTrait(traits, SEMANTIC_TRAITS.SEATLESS_POLITY);
  if (polityState === "pressured" || polityState === "declining" || settlementState === "pressured" || settlementState === "corrupted") pushSemanticTrait(traits, SEMANTIC_TRAITS.PRESSURED_POLITY);

  if ((ecology.beastUnits || 0) > 0) pushSemanticTrait(traits, SEMANTIC_TRAITS.BEAST_PRESSURE);
  if (type === "beast_range" || (ecology.wildCells || 0) >= 4 || placeState.dominantPressure === "beast" || placeState.dominantPressure === "forest") pushSemanticTrait(traits, SEMANTIC_TRAITS.BEAST_HABITAT);
  if ((ecology.wildCells || 0) >= 3 && (fertility.average || 0) >= 2.5) pushSemanticTrait(traits, SEMANTIC_TRAITS.WILD_RECOVERING);
  if ((ecology.spiritUnits || 0) > 0 || placeState.dominantPressure === "spirit" || placeState.dominantPressure === "rot") pushSemanticTrait(traits, SEMANTIC_TRAITS.SPIRIT_PRESSURE);
  if (type === "scar" || (ecology.markCells || 0) >= 3) pushSemanticTrait(traits, SEMANTIC_TRAITS.SPIRIT_SCARRED);
  if (snapshot?.center?.terrain === TERRAIN.MARK || (ecology.markCells || 0) >= 3 || traits.includes(SEMANTIC_TRAITS.ROT_SOURCE_NEARBY)) pushSemanticTrait(traits, SEMANTIC_TRAITS.MARK_CORRODED);
  if ((ecology.fieldCells || 0) > 0 && (placeState.trend === "declining" || (fertility.average || 0) <= 1.25)) pushSemanticTrait(traits, SEMANTIC_TRAITS.FIELD_DECLINING);
  if (placeState.status === "recovering" || ((traits.includes(SEMANTIC_TRAITS.RIVER_ADJACENT) || traits.includes(SEMANTIC_TRAITS.SPRING_FED)) && (fertility.average || 0) >= 2.5)) pushSemanticTrait(traits, SEMANTIC_TRAITS.FERTILITY_RECOVERING);
  if ((fertility.average || 0) <= 1.25) pushSemanticTrait(traits, SEMANTIC_TRAITS.FERTILITY_EXHAUSTED);
  const activePressureKinds = [
    (ecology.humanUnits || 0) > 0 || (ecology.fieldCells || 0) > 0,
    (ecology.beastUnits || 0) > 0 || (ecology.wildCells || 0) > 0,
    (ecology.spiritUnits || 0) > 0 || (ecology.markCells || 0) > 0,
  ].filter(Boolean).length;
  if (placeState.dominantPressure === "mixed" || activePressureKinds >= 2) pushSemanticTrait(traits, SEMANTIC_TRAITS.MIXED_PRESSURE);

  if (settlementState === "lost" || settlementState === "abandoned" || settlementState === "remnant") pushSemanticTrait(traits, SEMANTIC_TRAITS.RECENTLY_ABANDONED);
  if (humanMemory?.continuity?.transferReason && humanMemory.continuity.transferReason !== "unknown") pushSemanticTrait(traits, SEMANTIC_TRAITS.INHERITED_MEMORY);
  if (polityState === "collapsed" || humanMemory?.polity?.collapsedTick !== null && humanMemory?.polity?.collapsedTick !== undefined) pushSemanticTrait(traits, SEMANTIC_TRAITS.COLLAPSED_MEMORY);
  if (!hasCurrentHumanIdentity && rememberedHumanIdentity) pushSemanticTrait(traits, SEMANTIC_TRAITS.INHERITED_MEMORY);
  if (!hasCurrentHumanIdentity && rememberedHumanIdentity?.polityState === "collapsed") pushSemanticTrait(traits, SEMANTIC_TRAITS.COLLAPSED_MEMORY);
  if (anchorOrTarget?.lastInspectedAtTick !== null && anchorOrTarget?.lastInspectedAtTick !== undefined) pushSemanticTrait(traits, SEMANTIC_TRAITS.WATCHED_BY_PLAYER);

  return traits.slice(0, 12);
}

function derivePlaceArchetype(snapshot, semanticTraits = [], anchorOrTarget = null) {
  const traits = semanticTraits || [];
  const type = placeTypeHint(anchorOrTarget || {});
  const poiTarget = type === "poi" || Boolean(snapshot?.poi);
  const humanPlace = hasAnyTrait(traits, [SEMANTIC_TRAITS.HUMAN_SETTLED, SEMANTIC_TRAITS.HUMAN_SEAT, SEMANTIC_TRAITS.HUMAN_DOMAIN]);
  const strongContestSignal = hasAnyTrait(traits, [
    SEMANTIC_TRAITS.MIXED_PRESSURE,
    SEMANTIC_TRAITS.MARK_CORRODED,
    SEMANTIC_TRAITS.SPIRIT_PRESSURE,
    SEMANTIC_TRAITS.SPIRIT_SCARRED,
    SEMANTIC_TRAITS.PRESSURED_POLITY,
  ]) || (
    traits.includes(SEMANTIC_TRAITS.FIELD_DECLINING) &&
    (humanPlace || traits.includes(SEMANTIC_TRAITS.MONUMENT_SHADOWED))
  ) || ["contested", "corrupted"].includes(snapshot?.placeState?.status);
  if (
    traits.includes(SEMANTIC_TRAITS.HUMAN_SEAT) &&
    hasAnyTrait(traits, [SEMANTIC_TRAITS.SPIRIT_PRESSURE, SEMANTIC_TRAITS.MARK_CORRODED, SEMANTIC_TRAITS.PRESSURED_POLITY, SEMANTIC_TRAITS.BEAST_PRESSURE])
  ) return PLACE_ARCHETYPES.PRESSURED_SEAT;
  if (
    hasAnyTrait(traits, [SEMANTIC_TRAITS.HUMAN_REMNANT, SEMANTIC_TRAITS.HUMAN_OLD_SEAT, SEMANTIC_TRAITS.COLLAPSED_MEMORY]) &&
    hasAnyTrait(traits, [SEMANTIC_TRAITS.SPIRIT_SCARRED, SEMANTIC_TRAITS.MARK_CORRODED, SEMANTIC_TRAITS.SPIRIT_PRESSURE])
  ) return PLACE_ARCHETYPES.HAUNTED_REMNANT;
  if (traits.includes(SEMANTIC_TRAITS.HUMAN_OLD_SEAT)) return PLACE_ARCHETYPES.OLD_SEAT;
  if (traits.includes(SEMANTIC_TRAITS.SEATLESS_POLITY)) return PLACE_ARCHETYPES.SEATLESS_POLITY_CENTER;
  if (traits.includes(SEMANTIC_TRAITS.RIVER_ADJACENT) && humanPlace) return PLACE_ARCHETYPES.RIVER_VILLAGE;
  if (humanPlace && hasAnyTrait(traits, [SEMANTIC_TRAITS.GREAT_FOREST_NEARBY, SEMANTIC_TRAITS.BEAST_HABITAT])) return PLACE_ARCHETYPES.FOREST_EDGE_SETTLEMENT;
  if (traits.includes(SEMANTIC_TRAITS.HUMAN_OUTPOST) && hasAnyTrait(traits, [SEMANTIC_TRAITS.BEAST_PRESSURE, SEMANTIC_TRAITS.SPIRIT_PRESSURE, SEMANTIC_TRAITS.MIXED_PRESSURE])) return PLACE_ARCHETYPES.FRONTIER_OUTPOST;
  if (poiTarget && strongContestSignal) return PLACE_ARCHETYPES.CONTESTED_POI;
  if (hasAnyTrait(traits, [SEMANTIC_TRAITS.SPIRIT_SCARRED, SEMANTIC_TRAITS.MARK_CORRODED])) return PLACE_ARCHETYPES.SPIRIT_SCAR;
  if (traits.includes(SEMANTIC_TRAITS.HUMAN_SETTLED) && hasAnyTrait(traits, [SEMANTIC_TRAITS.POLITY_OWNED, SEMANTIC_TRAITS.LINEAGE_CONTINUITY])) return PLACE_ARCHETYPES.SETTLED_VILLAGE;
  if (traits.includes(SEMANTIC_TRAITS.BEAST_HABITAT) || type === "beast_range") return PLACE_ARCHETYPES.BEAST_RANGE;
  if (hasAnyTrait(traits, [SEMANTIC_TRAITS.RIVER_CENTER, SEMANTIC_TRAITS.RIVER_CROSSING])) return PLACE_ARCHETYPES.RIVER_CROSSING;
  if (hasAnyTrait(traits, [SEMANTIC_TRAITS.FERTILITY_RECOVERING, SEMANTIC_TRAITS.SPRING_FED]) && !hasAnyTrait(traits, [SEMANTIC_TRAITS.SPIRIT_PRESSURE, SEMANTIC_TRAITS.MARK_CORRODED])) return PLACE_ARCHETYPES.FERTILE_REFUGE;
  return PLACE_ARCHETYPES.ORDINARY_PLACE;
}

function derivePlaceInterpretationHints(snapshot, semanticTraits = [], placeArchetype = PLACE_ARCHETYPES.ORDINARY_PLACE) {
  const traits = semanticTraits || [];
  const hints = [];
  const add = (condition, text) => {
    if (condition && !hints.includes(text) && hints.length < 5) hints.push(text);
  };
  add(traits.includes(SEMANTIC_TRAITS.RIVER_ADJACENT), "river stabilizes nearby fertility");
  add(traits.includes(SEMANTIC_TRAITS.SPRING_FED), "spring supports local recovery");
  add(traits.includes(SEMANTIC_TRAITS.GREAT_FOREST_NEARBY), "great forest anchors wild habitat");
  add(traits.includes(SEMANTIC_TRAITS.ROT_SOURCE_NEARBY), "rot source keeps local corruption pressure");
  add(traits.includes(SEMANTIC_TRAITS.MONUMENT_SHADOWED), "monument preserves human field memory");
  add(traits.includes(SEMANTIC_TRAITS.LINEAGE_CONTINUITY), "human identity persists through lineage memory");
  add(traits.includes(SEMANTIC_TRAITS.POLITY_OWNED), "polity ownership is visible but observer-only");
  add(placeArchetype === PLACE_ARCHETYPES.PRESSURED_SEAT || traits.includes(SEMANTIC_TRAITS.PRESSURED_POLITY), "seat is under pressure");
  add(traits.includes(SEMANTIC_TRAITS.HUMAN_OUTPOST), "outpost marks distant human domain");
  add(traits.includes(SEMANTIC_TRAITS.HUMAN_OLD_SEAT), "old seat remains as memory");
  add(traits.includes(SEMANTIC_TRAITS.SPIRIT_SCARRED) || traits.includes(SEMANTIC_TRAITS.MARK_CORRODED), "spirit scar pressure remains visible");
  add(traits.includes(SEMANTIC_TRAITS.BEAST_HABITAT), "beast habitat is active nearby");
  add(traits.includes(SEMANTIC_TRAITS.FIELD_DECLINING), "field material is thinning");
  add(traits.includes(SEMANTIC_TRAITS.FERTILITY_RECOVERING), "fertility is recovering");
  add(traits.includes(SEMANTIC_TRAITS.FERTILITY_EXHAUSTED), "fertility is exhausted");
  add(traits.includes(SEMANTIC_TRAITS.RECENTLY_CHANGED), "place changed since last inspection");
  add(traits.includes(SEMANTIC_TRAITS.LONG_STABLE), "place is stable since last inspection");
  if (!hints.length && snapshot?.placeState?.dominantPressure && snapshot.placeState.dominantPressure !== "none") {
    hints.push(`${snapshot.placeState.dominantPressure} pressure is visible`);
  }
  return hints.slice(0, 5);
}

function protoCultureStrengthForScore(score) {
  if (score >= 0.65) return "strong";
  if (score >= 0.35) return "emerging";
  return "weak";
}

function isHumanRelatedPlaceSnapshot(snapshot, semanticTraits = snapshot?.semanticTraits || []) {
  const traits = semanticTraits || [];
  return hasAnyTrait(traits, [
    SEMANTIC_TRAITS.HUMAN_SETTLED,
    SEMANTIC_TRAITS.HUMAN_SEAT,
    SEMANTIC_TRAITS.HUMAN_OLD_SEAT,
    SEMANTIC_TRAITS.HUMAN_OUTPOST,
    SEMANTIC_TRAITS.HUMAN_REMNANT,
    SEMANTIC_TRAITS.HUMAN_DOMAIN,
    SEMANTIC_TRAITS.POLITY_OWNED,
    SEMANTIC_TRAITS.LINEAGE_CONTINUITY,
  ]) || Boolean(snapshot?.humanMemory || snapshot?.rememberedHumanIdentity);
}

function compactProtoCultureSourceTraits(sourceTraits = []) {
  const compact = [];
  for (const trait of sourceTraits) {
    if (trait && !compact.includes(trait)) compact.push(trait);
    if (compact.length >= 5) break;
  }
  return compact;
}

function normalizeProtoCultureHint(hint) {
  if (!hint || !Object.values(PROTO_CULTURE_HINTS).includes(hint.id)) return null;
  const score = Number(Math.min(1, Math.max(0, hint.score || 0)).toFixed(2));
  return {
    id: hint.id,
    score,
    strength: protoCultureStrengthForScore(score),
    sourceTraits: compactProtoCultureSourceTraits(hint.sourceTraits || []),
    sourceArchetype: hint.sourceArchetype || PLACE_ARCHETYPES.ORDINARY_PLACE,
    reason: hint.reason || "Human place has compact proto-culture signals.",
  };
}

function deriveProtoCultureHints(snapshot, semanticTraits = snapshot?.semanticTraits || [], placeArchetype = snapshot?.placeArchetype || PLACE_ARCHETYPES.ORDINARY_PLACE, target = null) {
  const traits = semanticTraits || [];
  if (!isHumanRelatedPlaceSnapshot(snapshot, traits)) return [];
  const hints = [];
  const has = (trait) => traits.includes(trait);
  const addHint = (id, score, sourceTraits, reason) => {
    if (score <= 0) return;
    const normalized = normalizeProtoCultureHint({
      id,
      score,
      sourceTraits: sourceTraits.filter((trait) => traits.includes(trait)),
      sourceArchetype: placeArchetype,
      reason,
    });
    if (normalized) hints.push(normalized);
  };
  const remembered = normalizeRememberedHumanIdentity(snapshot?.rememberedHumanIdentity || target?.rememberedHumanIdentity || null);
  const polityAncestryDepth = Math.max(
    snapshot?.humanMemory?.polity?.branchDepth || 0,
    Array.isArray(snapshot?.humanMemory?.polity?.ancestryIds) ? snapshot.humanMemory.polity.ancestryIds.length - 1 : 0,
    Array.isArray(remembered?.polityAncestryIds) ? remembered.polityAncestryIds.length - 1 : 0
  );
  const lineageAncestryDepth = Math.max(
    snapshot?.humanMemory?.lineage?.branchDepth || 0,
    Array.isArray(snapshot?.humanMemory?.lineage?.ancestryIds) ? snapshot.humanMemory.lineage.ancestryIds.length - 1 : 0,
    Array.isArray(remembered?.lineageAncestryIds) ? remembered.lineageAncestryIds.length - 1 : 0
  );

  addHint(
    PROTO_CULTURE_HINTS.RIVER_BOUND,
    (placeArchetype === PLACE_ARCHETYPES.RIVER_VILLAGE ? 0.45 : 0) +
      (hasAnyTrait(traits, [SEMANTIC_TRAITS.RIVER_ADJACENT, SEMANTIC_TRAITS.RIVER_CENTER, SEMANTIC_TRAITS.RIVER_CROSSING]) ? 0.25 : 0) +
      (has(SEMANTIC_TRAITS.POLITY_OWNED) ? 0.15 : 0) +
      (has(SEMANTIC_TRAITS.LINEAGE_CONTINUITY) ? 0.15 : 0) +
      (placeArchetype === PLACE_ARCHETYPES.SETTLED_VILLAGE ? 0.1 : 0),
    [SEMANTIC_TRAITS.RIVER_ADJACENT, SEMANTIC_TRAITS.RIVER_CENTER, SEMANTIC_TRAITS.RIVER_CROSSING, SEMANTIC_TRAITS.HUMAN_SETTLED, SEMANTIC_TRAITS.POLITY_OWNED, SEMANTIC_TRAITS.LINEAGE_CONTINUITY],
    "Human place is settled beside local river signals."
  );
  addHint(
    PROTO_CULTURE_HINTS.FOREST_EDGE,
    (placeArchetype === PLACE_ARCHETYPES.FOREST_EDGE_SETTLEMENT ? 0.45 : 0) +
      (has(SEMANTIC_TRAITS.GREAT_FOREST_NEARBY) ? 0.25 : 0) +
      (has(SEMANTIC_TRAITS.BEAST_HABITAT) ? 0.2 : 0) +
      (has(SEMANTIC_TRAITS.HUMAN_SETTLED) ? 0.1 : 0),
    [SEMANTIC_TRAITS.GREAT_FOREST_NEARBY, SEMANTIC_TRAITS.BEAST_HABITAT, SEMANTIC_TRAITS.HUMAN_SETTLED],
    "Human place is shaped by nearby forest or WILD habitat signals."
  );
  addHint(
    PROTO_CULTURE_HINTS.MEMORY_BOUND,
    (hasAnyTrait(traits, [SEMANTIC_TRAITS.HUMAN_OLD_SEAT, SEMANTIC_TRAITS.HUMAN_REMNANT]) ? 0.35 : 0) +
      (remembered ? 0.3 : 0) +
      (hasAnyTrait(traits, [SEMANTIC_TRAITS.COLLAPSED_MEMORY, SEMANTIC_TRAITS.INHERITED_MEMORY]) ? 0.2 : 0) +
      (has(SEMANTIC_TRAITS.LINEAGE_CONTINUITY) ? 0.15 : 0) +
      ([PLACE_ARCHETYPES.OLD_SEAT, PLACE_ARCHETYPES.HAUNTED_REMNANT].includes(placeArchetype) ? 0.1 : 0),
    [SEMANTIC_TRAITS.HUMAN_OLD_SEAT, SEMANTIC_TRAITS.HUMAN_REMNANT, SEMANTIC_TRAITS.LINEAGE_CONTINUITY, SEMANTIC_TRAITS.INHERITED_MEMORY, SEMANTIC_TRAITS.COLLAPSED_MEMORY],
    "Human identity persists through lineage, old seat, or remnant memory."
  );
  addHint(
    PROTO_CULTURE_HINTS.SCAR_BOUND,
    (hasAnyTrait(traits, [SEMANTIC_TRAITS.MARK_CORRODED, SEMANTIC_TRAITS.SPIRIT_SCARRED]) ? 0.35 : 0) +
      (hasAnyTrait(traits, [SEMANTIC_TRAITS.SPIRIT_PRESSURE, SEMANTIC_TRAITS.ROT_SOURCE_NEARBY]) ? 0.25 : 0) +
      ([PLACE_ARCHETYPES.HAUNTED_REMNANT, PLACE_ARCHETYPES.PRESSURED_SEAT, PLACE_ARCHETYPES.SPIRIT_SCAR].includes(placeArchetype) ? 0.15 : 0),
    [SEMANTIC_TRAITS.SPIRIT_PRESSURE, SEMANTIC_TRAITS.SPIRIT_SCARRED, SEMANTIC_TRAITS.MARK_CORRODED, SEMANTIC_TRAITS.ROT_SOURCE_NEARBY],
    "Human place is repeatedly observed with Spirit, MARK, or rot pressure."
  );
  addHint(
    PROTO_CULTURE_HINTS.FRONTIER_ADAPTED,
    (has(SEMANTIC_TRAITS.HUMAN_OUTPOST) ? 0.35 : 0) +
      (placeArchetype === PLACE_ARCHETYPES.FRONTIER_OUTPOST ? 0.25 : 0) +
      (hasAnyTrait(traits, [SEMANTIC_TRAITS.MIXED_PRESSURE, SEMANTIC_TRAITS.BEAST_PRESSURE, SEMANTIC_TRAITS.SPIRIT_PRESSURE, SEMANTIC_TRAITS.PRESSURED_POLITY]) ? 0.2 : 0),
    [SEMANTIC_TRAITS.HUMAN_OUTPOST, SEMANTIC_TRAITS.MIXED_PRESSURE, SEMANTIC_TRAITS.BEAST_PRESSURE, SEMANTIC_TRAITS.SPIRIT_PRESSURE, SEMANTIC_TRAITS.PRESSURED_POLITY],
    "Human place is repeatedly observed at a pressure frontier."
  );
  addHint(
    PROTO_CULTURE_HINTS.MONUMENT_CENTERED,
    (has(SEMANTIC_TRAITS.MONUMENT_SHADOWED) ? 0.35 : 0) +
      (hasAnyTrait(traits, [SEMANTIC_TRAITS.HUMAN_SETTLED, SEMANTIC_TRAITS.HUMAN_SEAT, SEMANTIC_TRAITS.LINEAGE_CONTINUITY, SEMANTIC_TRAITS.POLITY_OWNED]) ? 0.3 : 0),
    [SEMANTIC_TRAITS.MONUMENT_SHADOWED, SEMANTIC_TRAITS.HUMAN_SETTLED, SEMANTIC_TRAITS.HUMAN_SEAT, SEMANTIC_TRAITS.LINEAGE_CONTINUITY, SEMANTIC_TRAITS.POLITY_OWNED],
    "Human place is observed with monument memory context."
  );
  addHint(
    PROTO_CULTURE_HINTS.SPRING_REFUGE,
    (placeArchetype === PLACE_ARCHETYPES.FERTILE_REFUGE ? 0.35 : 0) +
      (has(SEMANTIC_TRAITS.SPRING_FED) ? 0.3 : 0) +
      (has(SEMANTIC_TRAITS.FERTILITY_RECOVERING) ? 0.25 : 0),
    [SEMANTIC_TRAITS.SPRING_FED, SEMANTIC_TRAITS.FERTILITY_RECOVERING],
    "Human place is observed near fertility recovery or spring support."
  );
  addHint(
    PROTO_CULTURE_HINTS.SPLIT_LINEAGE,
    (has(SEMANTIC_TRAITS.SPLIT_POLITY) ? 0.35 : 0) +
      (has(SEMANTIC_TRAITS.LINEAGE_CONTINUITY) ? 0.15 : 0) +
      (polityAncestryDepth > 1 ? 0.2 : polityAncestryDepth > 0 ? 0.1 : 0) +
      (lineageAncestryDepth > 1 ? 0.2 : lineageAncestryDepth > 0 ? 0.1 : 0) +
      (remembered && (remembered.polityId || remembered.lineageId) ? 0.15 : 0),
    [SEMANTIC_TRAITS.SPLIT_POLITY, SEMANTIC_TRAITS.LINEAGE_CONTINUITY, SEMANTIC_TRAITS.INHERITED_MEMORY],
    "Human identity shows split or inherited polity/lineage signals."
  );
  addHint(
    PROTO_CULTURE_HINTS.SEATLESS_DRIFT,
    (has(SEMANTIC_TRAITS.SEATLESS_POLITY) ? 0.35 : 0) +
      (has(SEMANTIC_TRAITS.HUMAN_OLD_SEAT) ? 0.25 : 0) +
      (has(SEMANTIC_TRAITS.RECENTLY_ABANDONED) ? 0.2 : 0) +
      ([PLACE_ARCHETYPES.SEATLESS_POLITY_CENTER, PLACE_ARCHETYPES.OLD_SEAT].includes(placeArchetype) ? 0.15 : 0),
    [SEMANTIC_TRAITS.SEATLESS_POLITY, SEMANTIC_TRAITS.HUMAN_OLD_SEAT, SEMANTIC_TRAITS.RECENTLY_ABANDONED],
    "Human identity is observed without a stable current seat."
  );

  return hints
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, 9);
}

function summarizeProtoCultureMemory(memory) {
  if (!memory?.signals || typeof memory.signals !== "object") return null;
  const entries = Object.entries(memory.signals)
    .filter(([id, signal]) => Object.values(PROTO_CULTURE_HINTS).includes(id) && signal && (signal.score || 0) >= 0.15)
    .map(([id, signal]) => [id, {
      score: Number(Math.min(1, Math.max(0, signal.score || 0)).toFixed(2)),
      samples: Math.max(0, Math.floor(signal.samples || 0)),
      firstSeenTick: signal.firstSeenTick ?? null,
      lastSeenTick: signal.lastSeenTick ?? null,
      sourceTraits: compactProtoCultureSourceTraits(signal.sourceTraits || []),
    }])
    .sort((a, b) => b[1].score - a[1].score || a[0].localeCompare(b[0]))
    .slice(0, 8);
  const signals = Object.fromEntries(entries);
  const activeHints = entries.filter(([, signal]) => signal.score >= 0.35).map(([id]) => id);
  const stableHints = entries.filter(([, signal]) => signal.score >= 0.65 && signal.samples >= 2).map(([id]) => id);
  const primaryHint = stableHints[0] || activeHints[0] || null;
  if (!entries.length && !primaryHint) return null;
  return {
    version: PROTO_CULTURE_MEMORY_VERSION,
    primaryHint,
    stableHints,
    activeHints,
    signals,
  };
}

function updateProtoCultureMemory(memory, protoCultureHints = [], currentTick = tick) {
  const nextSignals = {};
  if (memory?.signals && typeof memory.signals === "object") {
    for (const [id, signal] of Object.entries(memory.signals)) {
      if (!Object.values(PROTO_CULTURE_HINTS).includes(id)) continue;
      const decayedScore = Number(Math.min(1, Math.max(0, (signal?.score || 0) * 0.85)).toFixed(2));
      if (decayedScore < 0.15) continue;
      nextSignals[id] = {
        score: decayedScore,
        samples: Math.max(0, Math.floor(signal?.samples || 0)),
        firstSeenTick: signal?.firstSeenTick ?? null,
        lastSeenTick: signal?.lastSeenTick ?? null,
        sourceTraits: compactProtoCultureSourceTraits(signal?.sourceTraits || []),
      };
    }
  }
  for (const hint of protoCultureHints || []) {
    const normalized = normalizeProtoCultureHint(hint);
    if (!normalized) continue;
    const existing = nextSignals[normalized.id] || {
      score: 0,
      samples: 0,
      firstSeenTick: currentTick,
      lastSeenTick: null,
      sourceTraits: [],
    };
    nextSignals[normalized.id] = {
      score: Number(Math.min(1, Math.max(0, existing.score + normalized.score * 0.35)).toFixed(2)),
      samples: existing.samples + 1,
      firstSeenTick: existing.firstSeenTick ?? currentTick,
      lastSeenTick: currentTick,
      sourceTraits: compactProtoCultureSourceTraits([...(existing.sourceTraits || []), ...normalized.sourceTraits]),
    };
  }
  return summarizeProtoCultureMemory({
    version: PROTO_CULTURE_MEMORY_VERSION,
    signals: nextSignals,
  });
}

function sortedCountObject(counts = {}) {
  return Object.fromEntries(
    Object.entries(counts)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  );
}

function incrementSummaryCount(counts, key) {
  if (!key) return;
  counts[key] = (counts[key] || 0) + 1;
}

function createEmptyProtoCultureSummary() {
  return {
    version: PROTO_CULTURE_SUMMARY_VERSION,
    totalAnchors: 0,
    anchorsWithHints: 0,
    anchorsWithMemory: 0,
    primaryHintCounts: {},
    stableHintCounts: {},
    activeHintCounts: {},
    anchorTypeCounts: {},
    anchorTypeWithHintCounts: {},
    nonHumanAnchorWithHints: 0,
    nonHumanAnchorExamples: [],
    strongestExamplesByHint: Object.fromEntries(Object.values(PROTO_CULTURE_HINTS).map((id) => [id, []])),
  };
}

function isHumanRelatedAnchorType(anchorType) {
  return ["village", "seat", "old_seat", "outpost", "remnant", "domain"].includes(anchorType);
}

function getAnchorProtoCultureScores(anchor = {}) {
  const scores = {};
  const signals = anchor.protoCultureMemory?.signals || {};
  if (signals && typeof signals === "object") {
    for (const [id, signal] of Object.entries(signals)) {
      if (!Object.values(PROTO_CULTURE_HINTS).includes(id)) continue;
      const score = Number(Math.min(1, Math.max(0, signal?.score || 0)).toFixed(2));
      if (score > 0) scores[id] = Math.max(scores[id] || 0, score);
    }
  }
  for (const hint of anchor.currentSnapshot?.protoCultureHints || []) {
    if (!Object.values(PROTO_CULTURE_HINTS).includes(hint?.id)) continue;
    const score = Number(Math.min(1, Math.max(0, hint.score || 0)).toFixed(2));
    if (score > 0 && scores[hint.id] === undefined) scores[hint.id] = score;
  }
  return scores;
}

function hasAnchorProtoCulture(anchor = {}) {
  const hints = anchor.currentSnapshot?.protoCultureHints || [];
  const signals = anchor.protoCultureMemory?.signals || {};
  return (Array.isArray(hints) && hints.length > 0) ||
    Boolean(signals && typeof signals === "object" && Object.keys(signals).length > 0);
}

function strongestProtoCultureScore(anchor = {}) {
  const scores = Object.values(getAnchorProtoCultureScores(anchor));
  return scores.length ? Math.max(...scores) : 0;
}

function getNonHumanAnchorProtoCultureReason(anchor = {}) {
  const traits = anchor.currentSnapshot?.semanticTraits || [];
  if (hasAnyTrait(traits, [
    SEMANTIC_TRAITS.HUMAN_SETTLED,
    SEMANTIC_TRAITS.HUMAN_SEAT,
    SEMANTIC_TRAITS.HUMAN_OLD_SEAT,
    SEMANTIC_TRAITS.HUMAN_OUTPOST,
    SEMANTIC_TRAITS.HUMAN_REMNANT,
    SEMANTIC_TRAITS.HUMAN_DOMAIN,
    SEMANTIC_TRAITS.POLITY_OWNED,
    SEMANTIC_TRAITS.LINEAGE_CONTINUITY,
  ])) {
    return "Human semantic traits were present in the sampled place.";
  }
  if (anchor.currentSnapshot?.rememberedHumanIdentity || anchor.rememberedHumanIdentity) {
    return "Remembered Human identity was present.";
  }
  if (anchor.currentSnapshot?.humanMemory) {
    return "Human memory was attached to this anchor.";
  }
  return "Proto-culture memory was attached to this anchor.";
}

function compactProtoCultureExampleAnchor(anchor = {}) {
  return {
    anchorId: anchor.id || null,
    anchorType: anchor.type || anchor.sourceRef?.kind || "place",
    displayName: anchor.displayName || anchor.type || "place",
    primaryHint: anchor.protoCultureMemory?.primaryHint || null,
    activeHints: Array.isArray(anchor.protoCultureMemory?.activeHints) ? anchor.protoCultureMemory.activeHints.slice() : [],
    stableHints: Array.isArray(anchor.protoCultureMemory?.stableHints) ? anchor.protoCultureMemory.stableHints.slice() : [],
    reason: getNonHumanAnchorProtoCultureReason(anchor),
  };
}

function summarizeProtoCultureForPlaceMemory(memory = placeMemory) {
  const summary = createEmptyProtoCultureSummary();
  const anchors = Array.isArray(memory?.anchors) ? memory.anchors : [];
  const primaryHintCounts = {};
  const stableHintCounts = {};
  const activeHintCounts = {};
  const anchorTypeCounts = {};
  const anchorTypeWithHintCounts = {};
  const nonHumanExamples = [];
  const examplesByHint = Object.fromEntries(Object.values(PROTO_CULTURE_HINTS).map((id) => [id, []]));

  summary.totalAnchors = anchors.length;
  for (const anchor of anchors) {
    const anchorType = anchor?.type || anchor?.sourceRef?.kind || "place";
    const hasHints = Array.isArray(anchor?.currentSnapshot?.protoCultureHints) && anchor.currentSnapshot.protoCultureHints.length > 0;
    const hasMemory = Boolean(anchor?.protoCultureMemory?.signals && typeof anchor.protoCultureMemory.signals === "object" && Object.keys(anchor.protoCultureMemory.signals).length > 0);
    const hasProtoCulture = hasAnchorProtoCulture(anchor);
    const primaryHint = anchor?.protoCultureMemory?.primaryHint || null;
    const stableHints = Array.isArray(anchor?.protoCultureMemory?.stableHints) ? anchor.protoCultureMemory.stableHints : [];
    const activeHints = Array.isArray(anchor?.protoCultureMemory?.activeHints) ? anchor.protoCultureMemory.activeHints : [];
    const scores = getAnchorProtoCultureScores(anchor);

    incrementSummaryCount(anchorTypeCounts, anchorType);
    if (hasHints) summary.anchorsWithHints += 1;
    if (hasMemory) summary.anchorsWithMemory += 1;
    if (hasProtoCulture) incrementSummaryCount(anchorTypeWithHintCounts, anchorType);
    if (Object.values(PROTO_CULTURE_HINTS).includes(primaryHint)) incrementSummaryCount(primaryHintCounts, primaryHint);
    for (const id of stableHints) {
      if (Object.values(PROTO_CULTURE_HINTS).includes(id)) incrementSummaryCount(stableHintCounts, id);
    }
    for (const id of activeHints) {
      if (Object.values(PROTO_CULTURE_HINTS).includes(id)) incrementSummaryCount(activeHintCounts, id);
    }

    if (hasProtoCulture && !isHumanRelatedAnchorType(anchorType)) {
      summary.nonHumanAnchorWithHints += 1;
      nonHumanExamples.push(anchor);
    }

    for (const id of Object.values(PROTO_CULTURE_HINTS)) {
      if (scores[id] === undefined) continue;
      examplesByHint[id].push({
        anchorId: anchor?.id || null,
        anchorType,
        displayName: anchor?.displayName || anchorType,
        primaryHint,
        score: scores[id],
        stable: stableHints.includes(id),
      });
    }
  }

  summary.primaryHintCounts = sortedCountObject(primaryHintCounts);
  summary.stableHintCounts = sortedCountObject(stableHintCounts);
  summary.activeHintCounts = sortedCountObject(activeHintCounts);
  summary.anchorTypeCounts = sortedCountObject(anchorTypeCounts);
  summary.anchorTypeWithHintCounts = sortedCountObject(anchorTypeWithHintCounts);
  summary.nonHumanAnchorExamples = nonHumanExamples
    .sort((a, b) => strongestProtoCultureScore(b) - strongestProtoCultureScore(a) || String(a?.id || "").localeCompare(String(b?.id || "")))
    .slice(0, 8)
    .map(compactProtoCultureExampleAnchor);
  summary.strongestExamplesByHint = Object.fromEntries(
    Object.entries(examplesByHint).map(([id, examples]) => [id, examples
      .sort((a, b) => b.score - a.score ||
        Number(b.primaryHint === id) - Number(a.primaryHint === id) ||
        Number(b.stable) - Number(a.stable) ||
        String(a.anchorId || "").localeCompare(String(b.anchorId || "")))
      .slice(0, 3)])
  );
  return summary;
}

function snapshotPlace(anchorOrTarget = {}, source = world, radius = 2) {
  const x = Math.round(anchorOrTarget.x ?? anchorOrTarget.position?.x ?? 0);
  const y = Math.round(anchorOrTarget.y ?? anchorOrTarget.position?.y ?? 0);
  const terrain = { ".": 0, F: 0, W: 0, M: 0, X: 0, "#": 0 };
  const units = { H: 0, B: 0, S: 0 };
  let fertilityTotal = 0;
  let fertilityMin = 4;
  let fertilityMax = 0;
  let cells = 0;
  let riverCells = 0;
  let nearbyBlockCells = 0;
  for (let yy = y - radius; yy <= y + radius; yy += 1) {
    for (let xx = x - radius; xx <= x + radius; xx += 1) {
      if (!inBounds(xx, yy) || Math.hypot(xx - x, yy - y) > radius) continue;
      const cell = source[yy][xx];
      terrain[cell.terrain] = (terrain[cell.terrain] || 0) + 1;
      if (cell.unit) units[cell.unit] += 1;
      const fertility = clampFertility(cell.fertility || 0);
      fertilityTotal += fertility;
      fertilityMin = Math.min(fertilityMin, fertility);
      fertilityMax = Math.max(fertilityMax, fertility);
      if (isRiverCell(xx, yy)) riverCells += 1;
      if (cell.terrain === TERRAIN.BLOCK) nearbyBlockCells += 1;
      cells += 1;
    }
  }
  const poi = worldPOIs.find((item) => item.x === x && item.y === y) || null;
  const nearbyPOITypes = nearbyPOITypesForPlace(x, y, radius);
  const humanMemory = buildHumanMemory(anchorOrTarget);
  const rememberedHumanIdentity = normalizeRememberedHumanIdentity(anchorOrTarget.rememberedHumanIdentity || null);
  const ecology = {
    cells,
    riverCells,
    fieldCells: terrain.F,
    wildCells: terrain.W,
    markCells: terrain.M,
    humanUnits: units.H,
    beastUnits: units.B,
    spiritUnits: units.S,
  };
  const fertility = {
    average: cells ? Number((fertilityTotal / cells).toFixed(2)) : 0,
    min: cells ? fertilityMin : 0,
    max: cells ? fertilityMax : 0,
  };
  const centerCell = inBounds(x, y) ? source[y][x] : null;
  const placeState = createPlaceState({ ecology, fertility, poi, humanMemory });
  const snapshot = {
    tick,
    position: { x, y },
    center: centerCell ? { terrain: centerCell.terrain, unit: centerCell.unit || null, isRiver: isRiverCell(x, y) } : null,
    terrain,
    units,
    fertility,
    poi: poi ? { id: poi.id, type: poi.type, state: poi.state } : null,
    nearbyPOITypes,
    nearbyBlockCells,
    human: {
      polityId: anchorOrTarget.polityId || null,
      lineageId: anchorOrTarget.lineageId || null,
      state: anchorOrTarget.state || anchorOrTarget.polityState || null,
    },
    ecology,
    placeState,
    ...(humanMemory ? { humanMemory } : {}),
    ...(rememberedHumanIdentity ? { rememberedHumanIdentity } : {}),
  };
  snapshot.semanticTraits = deriveSemanticTraits(snapshot, anchorOrTarget);
  snapshot.placeArchetype = derivePlaceArchetype(snapshot, snapshot.semanticTraits, anchorOrTarget);
  snapshot.interpretationHints = derivePlaceInterpretationHints(snapshot, snapshot.semanticTraits, snapshot.placeArchetype);
  snapshot.protoCultureHints = deriveProtoCultureHints(snapshot, snapshot.semanticTraits, snapshot.placeArchetype, anchorOrTarget);
  return snapshot;
}

function computePlaceChange(anchor, previousSnapshot, currentSnapshot) {
  const previous = previousSnapshot || currentSnapshot;
  const metricsDelta = {
    fieldCellsDelta: (currentSnapshot.ecology?.fieldCells || 0) - (previous.ecology?.fieldCells || 0),
    wildCellsDelta: (currentSnapshot.ecology?.wildCells || 0) - (previous.ecology?.wildCells || 0),
    markCellsDelta: (currentSnapshot.ecology?.markCells || 0) - (previous.ecology?.markCells || 0),
    humanUnitsDelta: (currentSnapshot.ecology?.humanUnits || 0) - (previous.ecology?.humanUnits || 0),
    beastUnitsDelta: (currentSnapshot.ecology?.beastUnits || 0) - (previous.ecology?.beastUnits || 0),
    spiritUnitsDelta: (currentSnapshot.ecology?.spiritUnits || 0) - (previous.ecology?.spiritUnits || 0),
    fertilityAverageDelta: Number(((currentSnapshot.fertility?.average || 0) - (previous.fertility?.average || 0)).toFixed(2)),
    settlementAreaDelta: Number(((currentSnapshot.humanMemory?.settlement?.area || 0) - (previous.humanMemory?.settlement?.area || 0)).toFixed(2)),
    settlementSupportDelta: Number(((currentSnapshot.humanMemory?.settlement?.support || 0) - (previous.humanMemory?.settlement?.support || 0)).toFixed(2)),
    polityAreaDelta: 0,
    distanceToSeatDelta: currentSnapshot.humanMemory?.settlement?.distanceToSeat !== null && previous.humanMemory?.settlement?.distanceToSeat !== null
      ? Number(((currentSnapshot.humanMemory?.settlement?.distanceToSeat || 0) - (previous.humanMemory?.settlement?.distanceToSeat || 0)).toFixed(2))
      : 0,
    connectedToSeatChanged: Boolean(currentSnapshot.humanMemory?.settlement && previous.humanMemory?.settlement && currentSnapshot.humanMemory.settlement.connectedToSeat !== previous.humanMemory.settlement.connectedToSeat),
  };
  metricsDelta.fieldCells = metricsDelta.fieldCellsDelta;
  metricsDelta.wildCells = metricsDelta.wildCellsDelta;
  metricsDelta.markCells = metricsDelta.markCellsDelta;
  metricsDelta.humanUnits = metricsDelta.humanUnitsDelta;
  metricsDelta.beastUnits = metricsDelta.beastUnitsDelta;
  metricsDelta.spiritUnits = metricsDelta.spiritUnitsDelta;
  metricsDelta.fertilityAverage = metricsDelta.fertilityAverageDelta;

  const previousHuman = previous.humanMemory || {};
  const currentHuman = currentSnapshot.humanMemory || {};
  const ownershipChanged = Boolean(
    previousHuman.polity?.id !== currentHuman.polity?.id ||
    previousHuman.lineage?.id !== currentHuman.lineage?.id
  );
  const stateChanged = Boolean(
    previous.placeState?.status !== currentSnapshot.placeState?.status ||
    previousHuman.settlement?.state !== currentHuman.settlement?.state
  );
  let category = "no_significant_change";
  let subject = "mixed";
  let direction = "none";
  const text = [];
  if (ownershipChanged) {
    category = "ownership_changed";
    subject = currentHuman.polity?.id ? "polity" : "lineage";
    direction = "unstable";
    text.push("Human ownership has changed here.");
  } else if (currentHuman.polity?.state === "collapsed" && previousHuman.polity?.state !== "collapsed") {
    category = "polity_collapsed";
    subject = "polity";
    direction = "collapsed";
    text.push("The remembered polity has collapsed.");
  } else if (currentHuman.polity?.parentPolityId && currentHuman.polity.parentPolityId !== previousHuman.polity?.parentPolityId) {
    category = "polity_split";
    subject = "polity";
    direction = "split";
    text.push("This polity now continues from a split branch.");
  } else if (currentHuman.settlement && (metricsDelta.fieldCellsDelta >= 2 || metricsDelta.humanUnitsDelta >= 1 || metricsDelta.settlementAreaDelta >= 2 || metricsDelta.settlementSupportDelta >= 1)) {
    category = currentHuman.settlement.kind === "village" && !previousHuman.settlement?.id ? "village_emerged" : "human_expanded";
    subject = currentHuman.settlement.kind === "seat" ? "seat" : currentHuman.settlement.kind === "village" ? "village" : "human";
    direction = "growing";
    text.push(currentHuman.settlement.kind === "village" ? "This village has expanded since your last visit." : "Human influence has expanded around this place.");
  } else if (currentHuman.settlement && (metricsDelta.fieldCellsDelta <= -2 || metricsDelta.humanUnitsDelta <= -1 || metricsDelta.settlementAreaDelta <= -2 || metricsDelta.settlementSupportDelta <= -1)) {
    category = currentHuman.settlement.kind === "village" && currentHuman.settlement.state !== "active" ? "village_lost" : "human_shrank";
    subject = currentHuman.settlement.kind === "seat" ? "seat" : currentHuman.settlement.kind === "village" ? "village" : "human";
    direction = "declining";
    text.push(currentHuman.settlement.kind === "seat" ? "This seat has weakened since your last visit." : "Human influence has shrunk around this place.");
  } else if (currentSnapshot.center?.terrain === TERRAIN.MARK && previous.center?.terrain !== TERRAIN.MARK) {
    category = currentSnapshot.poi?.type === POI_TYPES.ROT_SOURCE ? "rot_spread" : "poi_contested";
    subject = currentSnapshot.poi?.type === POI_TYPES.ROT_SOURCE ? "rot" : "mixed";
    direction = "unstable";
    text.push(currentSnapshot.poi?.type === POI_TYPES.ROT_SOURCE ? "Rot pressure has spread around this place." : "This place is more contested by mark pressure.");
  } else if (metricsDelta.markCellsDelta >= 2 || metricsDelta.spiritUnitsDelta >= 1) {
    category = currentSnapshot.poi?.type === POI_TYPES.ROT_SOURCE ? "rot_spread" : "poi_contested";
    subject = currentSnapshot.poi?.type === POI_TYPES.ROT_SOURCE ? "rot" : "mixed";
    direction = "unstable";
    text.push(currentSnapshot.poi?.type === POI_TYPES.ROT_SOURCE ? "Rot pressure has spread around this place." : "This place is more contested by mark pressure.");
  } else if (metricsDelta.markCellsDelta <= -2 || metricsDelta.spiritUnitsDelta <= -1) {
    category = "rot_receded";
    subject = "rot";
    direction = "recovered";
    text.push("Mark pressure has receded around this place.");
  } else if (metricsDelta.wildCellsDelta >= 2 || metricsDelta.beastUnitsDelta >= 1) {
    category = "forest_expanded";
    subject = currentSnapshot.placeState?.dominantPressure === "forest" ? "forest" : "mixed";
    direction = "growing";
    text.push("Wild pressure has grown around this place.");
  } else if (metricsDelta.wildCellsDelta <= -2 || metricsDelta.beastUnitsDelta <= -1) {
    category = "forest_thinned";
    subject = "forest";
    direction = "declining";
    text.push("Wild pressure has thinned around this place.");
  } else if (metricsDelta.fertilityAverageDelta >= 0.25 && (currentSnapshot.ecology?.riverCells || 0) > 0) {
    category = "water_recovered_land";
    subject = "water";
    direction = "recovered";
    text.push("Water has helped the ground recover here.");
  } else if (stateChanged && currentSnapshot.placeState?.status !== "stable") {
    category = "poi_contested";
    subject = "mixed";
    direction = currentSnapshot.placeState?.trend || "unstable";
    text.push("The visible state of this place has shifted.");
  }

  const visibleToPlayer = category !== "no_significant_change";
  const playerText = visibleToPlayer ? text : [];
  const contextTraits = (Array.isArray(currentSnapshot.semanticTraits)
    ? currentSnapshot.semanticTraits.slice()
    : deriveSemanticTraits(currentSnapshot, anchor));
  pushSemanticTrait(contextTraits, visibleToPlayer ? SEMANTIC_TRAITS.RECENTLY_CHANGED : SEMANTIC_TRAITS.LONG_STABLE);
  const contextArchetype = derivePlaceArchetype(currentSnapshot, contextTraits, anchor);
  const contextHints = derivePlaceInterpretationHints(currentSnapshot, contextTraits, contextArchetype);
  const protoCultureHints = Array.isArray(currentSnapshot.protoCultureHints)
    ? currentSnapshot.protoCultureHints.slice()
    : deriveProtoCultureHints(currentSnapshot, currentSnapshot.semanticTraits || contextTraits, currentSnapshot.placeArchetype || contextArchetype, anchor);
  const protoCultureMemory = summarizeProtoCultureMemory(anchor?.protoCultureMemory || null);
  const normalizedCategory = PLACE_CHANGE_CATEGORIES.has(category) ? category : "no_significant_change";
  const normalizedSubject = PLACE_CHANGE_SUBJECTS.has(subject) ? subject : "mixed";
  const normalizedDirection = PLACE_CHANGE_DIRECTIONS.has(direction) ? direction : "none";
  return {
    visibleToPlayer,
    category: normalizedCategory,
    subject: normalizedSubject,
    direction: normalizedDirection,
    intensity: visibleToPlayer && (Math.abs(metricsDelta.fieldCellsDelta) >= 4 || Math.abs(metricsDelta.markCellsDelta) >= 4 || Math.abs(metricsDelta.wildCellsDelta) >= 4) ? "high" : visibleToPlayer ? "medium" : "low",
    fromTick: previous.tick ?? null,
    toTick: currentSnapshot.tick ?? null,
    metricsDelta,
    deterministicSummary: playerText[0] || "",
    playerText,
    llmContext: {
      anchorId: anchor?.id || null,
      type: anchor?.type || null,
      displayName: anchor?.displayName || null,
      position: anchor?.position || currentSnapshot.position,
      category: normalizedCategory,
      subject: normalizedSubject,
      direction: normalizedDirection,
      metricsDelta,
      placeState: currentSnapshot.placeState || null,
      humanMemory: currentSnapshot.humanMemory || null,
      rememberedHumanIdentity: currentSnapshot.rememberedHumanIdentity || anchor?.rememberedHumanIdentity || null,
      placeArchetype: contextArchetype,
      semanticTraits: contextTraits.slice(0, 12),
      interpretationHints: contextHints,
      protoCultureHints,
      protoCultureMemory,
      visibleToPlayer,
    },
  };
}

function inspectPlaceTarget(target, source = world) {
  if (!target) return null;
  const type = placeAnchorTypeForTarget(target);
  const sourceRef = placeSourceRefForTarget(target);
  const id = placeAnchorIdForRef(sourceRef);
  let anchor = placeMemory.anchors.find((item) => item.id === id);
  if (!anchor) {
    anchor = {
      id,
      type,
      displayName: displayNameForPlaceTarget(target),
      position: { x: Math.round(target.x), y: Math.round(target.y) },
      sourceRef,
      discoveredAtTick: tick,
      lastInspectedAtTick: null,
      lastSleepObservedTick: null,
      currentSnapshot: null,
      previousSnapshot: null,
      changeSinceLastInspect: null,
      changeSinceLastSleep: null,
      rememberedHumanIdentity: null,
      protoCultureMemory: null,
    };
    placeMemory.anchors.push(anchor);
  }
  anchor.previousSnapshot = anchor.currentSnapshot ? JSON.parse(JSON.stringify(anchor.currentSnapshot)) : null;
  anchor.currentSnapshot = snapshotPlace({ ...target, position: anchor.position, rememberedHumanIdentity: anchor.rememberedHumanIdentity }, source);
  updateRememberedHumanIdentity(anchor, anchor.currentSnapshot);
  if (anchor.rememberedHumanIdentity && !anchor.currentSnapshot.rememberedHumanIdentity) {
    anchor.currentSnapshot.rememberedHumanIdentity = JSON.parse(JSON.stringify(anchor.rememberedHumanIdentity));
    anchor.currentSnapshot.protoCultureHints = deriveProtoCultureHints(anchor.currentSnapshot, anchor.currentSnapshot.semanticTraits, anchor.currentSnapshot.placeArchetype, anchor);
  }
  anchor.protoCultureMemory = updateProtoCultureMemory(anchor.protoCultureMemory, anchor.currentSnapshot.protoCultureHints || [], tick);
  anchor.lastInspectedAtTick = tick;
  if (anchor.previousSnapshot) anchor.changeSinceLastInspect = computePlaceChange(anchor, anchor.previousSnapshot, anchor.currentSnapshot);
  if (!placeMemory.awakeCycleInspectedAnchorIds.includes(anchor.id)) placeMemory.awakeCycleInspectedAnchorIds.push(anchor.id);
  target.placeMemoryInfo = formatPlaceMemoryInfo(anchor);
  return anchor;
}

function formatPlaceMemoryInfo(anchor) {
  const snapshot = anchor.currentSnapshot || {};
  const humanMemory = snapshot.humanMemory;
  const placeState = snapshot.placeState;
  const lines = [
    anchor.displayName,
    `Place memory: ${anchor.type} at ${anchor.position.x},${anchor.position.y}`,
  ];
  if (humanMemory?.settlement) {
    if (humanMemory.settlement.kind === "seat" && humanMemory.polity?.id) lines.push(`Seat of ${humanMemory.polity.id}.`);
    else if (humanMemory.settlement.kind === "village" && humanMemory.polity?.id) lines.push(`Belongs to ${humanMemory.polity.id}.`);
    else if (humanMemory.polity?.id) lines.push(`Human polity: ${humanMemory.polity.id}.`);
    if (humanMemory.lineage?.id) {
      const root = humanMemory.lineage.rootLineageId && humanMemory.lineage.rootLineageId !== humanMemory.lineage.id
        ? `, rooted in ${humanMemory.lineage.rootLineageId}`
        : "";
      lines.push(`Lineage: ${humanMemory.lineage.id}${root}.`);
    }
    if (humanMemory.polity?.parentPolityId) lines.push(`This polity split from ${humanMemory.polity.parentPolityId}.`);
    if (humanMemory.continuity?.previousPlaceId && humanMemory.continuity.transferReason !== "unknown") {
      lines.push(`Continuity: ${humanMemory.continuity.transferReason} from ${humanMemory.continuity.previousPlaceId}.`);
    }
  }
  if (!humanMemory?.polity?.id && anchor.rememberedHumanIdentity?.polityId) {
    lines.push(`Remembered polity: ${anchor.rememberedHumanIdentity.polityId}.`);
  }
  if (placeState) {
    const pressure = placeState.dominantPressure && placeState.dominantPressure !== "none" ? ` under ${placeState.dominantPressure} pressure` : "";
    lines.push(`Current state: ${placeState.status}${pressure}.`);
  }
  const change = anchor.changeSinceLastInspect;
  if (change?.visibleToPlayer && change.playerText?.length) lines.push(...change.playerText);
  return lines;
}

function formatSemanticTagInfo(tag) {
  const normalized = tag || {};
  if (normalized.placeMemoryInfo) {
    return {
      title: normalized.placeMemoryInfo[0] || normalized.label || "Place",
      subtitle: normalized.placeMemoryInfo[1] || `Place at ${semanticTagPosition(normalized)}`,
      rows: normalized.placeMemoryInfo.slice(2).map((line, index) => semanticTagInfoRow(`Memory ${index + 1}`, line)),
      interpretation: "inspected place memory",
    };
  }
  const label = normalized.label || "Semantic tag";
  const rows = [];
  let subtitle = `${label} at ${semanticTagPosition(normalized)}`;
  let interpretation = "observer-only macro annotation";

  if (label === "H seat" || label === "H pressured seat") {
    subtitle = `Human polity center at ${semanticTagPosition(normalized)}`;
    rows.push(
      semanticTagInfoRow("Polity", normalized.polityId),
      semanticTagInfoRow("Polity state", normalized.polityState),
      semanticTagInfoRow("Lineage", normalized.lineageId),
      semanticTagInfoRow("Seat state", normalized.state),
      semanticTagInfoRow("Support", normalized.support, "0"),
      semanticTagInfoRow("Pressure", normalized.pressure, "0")
    );
    if (normalized.splitFromPolityId) rows.push(semanticTagInfoRow("Split from", normalized.splitFromPolityId));
    appendAncestryRows(rows, normalized);
    rows.push(semanticTagInfoRow("Position", semanticTagPosition(normalized)));
    interpretation = humanSeatInterpretation(normalized);
  } else if (label === "H village") {
    subtitle = `Local settlement at ${semanticTagPosition(normalized)}`;
    rows.push(
      semanticTagInfoRow("Polity", normalized.polityId),
      semanticTagInfoRow("Polity state", normalized.polityState),
      semanticTagInfoRow("Lineage", normalized.lineageId),
      semanticTagInfoRow("Village state", normalized.state),
      semanticTagInfoRow("Support", normalized.support, "0"),
      semanticTagInfoRow("Pressure", normalized.pressure, "0")
    );
    appendAncestryRows(rows, normalized);
    if (normalized.previousPolityId) rows.push(semanticTagInfoRow("Previous polity", normalized.previousPolityId));
    if (normalized.inheritedFromPolityId) rows.push(semanticTagInfoRow("Inherited from", normalized.inheritedFromPolityId));
    rows.push(semanticTagInfoRow("Position", semanticTagPosition(normalized)));
    interpretation = normalized.inheritedFromPolityId ? "local settlement inherited from a collapsed polity" : "local settlement inside polity domain";
  } else if (label === "H remnant") {
    subtitle = `Remnant settlement at ${semanticTagPosition(normalized)}`;
    rows.push(
      semanticTagInfoRow("Previous polity", normalized.previousPolityId),
      semanticTagInfoRow("Lineage", normalized.lineageId),
      semanticTagInfoRow("Support", normalized.support, "0"),
      semanticTagInfoRow("Pressure", normalized.pressure, "0")
    );
    appendAncestryRows(rows, normalized);
    rows.push(semanticTagInfoRow("Position", semanticTagPosition(normalized)));
    interpretation = "remnant settlement left after polity collapse";
  } else if (label === "H outpost") {
    subtitle = `Distant Human settlement at ${semanticTagPosition(normalized)}`;
    rows.push(
      semanticTagInfoRow("Polity", normalized.polityId),
      semanticTagInfoRow("Polity state", normalized.polityState),
      semanticTagInfoRow("Lineage", normalized.lineageId),
      semanticTagInfoRow("Outpost state", normalized.state),
      semanticTagInfoRow("Support", normalized.support, "0"),
      semanticTagInfoRow("Pressure", normalized.pressure, "0")
    );
    if (normalized.splitFromPolityId) rows.push(semanticTagInfoRow("Split from", normalized.splitFromPolityId));
    appendAncestryRows(rows, normalized);
    rows.push(semanticTagInfoRow("Position", semanticTagPosition(normalized)));
    interpretation = humanOutpostInterpretation(normalized);
  } else if (label === "H old seat") {
    subtitle = `Abandoned Human seat at ${semanticTagPosition(normalized)}`;
    rows.push(
      semanticTagInfoRow("Polity", normalized.polityId),
      semanticTagInfoRow("Polity state", normalized.polityState),
      semanticTagInfoRow("Lineage", normalized.lineageId),
      semanticTagInfoRow("Reason abandoned", normalized.reason, "unknown"),
      semanticTagInfoRow("Abandoned tick", normalized.abandonedTick, "unknown")
    );
    if (normalized.splitFromPolityId) rows.push(semanticTagInfoRow("Split from", normalized.splitFromPolityId));
    appendAncestryRows(rows, normalized);
    rows.push(semanticTagInfoRow("Position", semanticTagPosition(normalized)));
    interpretation = "abandoned former capital";
  } else if (label === "H domain") {
    subtitle = `Human population domain at ${semanticTagPosition(normalized)}`;
    rows.push(
      semanticTagInfoRow("Source shape id", normalized.sourceId, "unknown"),
      semanticTagInfoRow("Polity", normalized.polityId),
      semanticTagInfoRow("Lineage", normalized.lineageId)
    );
    appendAncestryRows(rows, normalized);
    rows.push(semanticTagInfoRow("Position", semanticTagPosition(normalized)));
    interpretation = normalized.polityId ? "Human-controlled domain of this polity" : "current Human-controlled macro region";
  } else if (normalized.source === "poi" || ["Rot Source", "Spring", "Great Forest", "Monument"].includes(label)) {
    const role = semanticTagPOIRole(normalized);
    subtitle = `Point of Interest at ${semanticTagPosition(normalized)}`;
    rows.push(
      semanticTagInfoRow("Id", normalized.sourceId, "unknown"),
      semanticTagInfoRow("Type", normalized.type, "unknown"),
      semanticTagInfoRow("Role", role),
      semanticTagInfoRow("Position", semanticTagPosition(normalized))
    );
    interpretation = role;
  } else if (label === "B range" || label === "S scar") {
    subtitle = `Population macro shape at ${semanticTagPosition(normalized)}`;
    rows.push(
      semanticTagInfoRow("Source shape id", normalized.sourceId, "unknown"),
      semanticTagInfoRow("Position", semanticTagPosition(normalized))
    );
    interpretation = label === "B range" ? "Beast activity range" : "persistent Spirit / MARK scar";
  } else {
    rows.push(
      semanticTagInfoRow("Source", normalized.source, "unknown"),
      semanticTagInfoRow("Source shape id", normalized.sourceId, "unknown"),
      semanticTagInfoRow("Position", semanticTagPosition(normalized))
    );
  }

  return { title: label, subtitle, rows, interpretation };
}

function hideSemanticTagInfo() {
  selectedSemanticTag = null;
  if (!semanticTagInfoPanelEl) return;
  semanticTagInfoPanelEl.className = "semantic-tag-info-panel";
  setElementAttribute(semanticTagInfoPanelEl, "aria-hidden", "true");
  semanticTagInfoPanelEl.innerHTML = "";
  semanticTagInfoPanelEl.textContent = "";
}

function showSemanticTagInfo(tag) {
  if (!semanticTagInfoPanelEl || !tag) return;
  selectedSemanticTag = JSON.parse(JSON.stringify(tag));
  const info = formatSemanticTagInfo(selectedSemanticTag);
  const polityClass = Number.isInteger(selectedSemanticTag.polityColorIndex) ? ` polity-color-${selectedSemanticTag.polityColorIndex}` : "";
  const textLines = [
    info.title,
    info.subtitle,
    ...info.rows.map((row) => `${row.label}: ${row.value}`),
    `Interpretation: ${info.interpretation}`,
  ];
  semanticTagInfoPanelEl.className = `semantic-tag-info-panel visible${polityClass}`;
  setElementAttribute(semanticTagInfoPanelEl, "aria-hidden", "false");
  semanticTagInfoPanelEl.innerHTML = "";
  semanticTagInfoPanelEl.textContent = textLines.join("\n");
  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "semantic-tag-info-close";
  closeButton.textContent = "Close";
  closeButton.addEventListener("click", hideSemanticTagInfo);
  semanticTagInfoPanelEl.appendChild(closeButton);
}

function humanPolityTagFields(polity, item = {}, lineageId = null, state = item.state || polity?.state || "active") {
  if (!polity) return {};
  const lineageSnapshot = lineageAncestrySnapshot(lineageId || item.lineageId || polity.rootLineageId);
  const politySnapshot = polityAncestrySnapshot(polity.id);
  return {
    polityId: polity.id,
    polityState: polity.state,
    polityColorIndex: polity.colorIndex || 0,
    lineageId: lineageId || item.lineageId || polity.rootLineageId || null,
    lineageAncestryIds: lineageSnapshot.lineageAncestryIds,
    polityAncestryIds: politySnapshot.polityAncestryIds,
    rootLineageId: lineageSnapshot.rootLineageId || polity.rootLineageId || null,
    rootPolityId: politySnapshot.rootPolityId || polity.id,
    seatSource: item.seatSource || null,
    seatSourceId: item.sourceId || item.outpostId || null,
    outpostId: item.outpostId || null,
    state,
    support: item.support,
    pressure: item.pressure,
    splitFromPolityId: polity.splitFromPolityId || null,
  };
}

function semanticTagPriority(tag) {
  if (tag.label === "H pressured seat") return 4;
  if (tag.label === "H seat") return 5;
  if (tag.label === "Rot Source") return 10;
  if (tag.label === "Spring") return 12;
  if (tag.label === "Great Forest") return 14;
  if (tag.label === "Monument") return 16;
  if (tag.label === "H old seat") return 20;
  if (tag.label === "H outpost") return 25;
  if (tag.label === "H village") return 28;
  if (tag.label === "H remnant") return 29;
  if (tag.label === "H domain") return 30;
  if (tag.label === "S scar") return 40;
  if (tag.label === "B range") return 45;
  return tag.priority || 100;
}

function areMajorPOITags(a, b) {
  return a.source === "poi" && b.source === "poi";
}

function declutterSemanticTags(candidates) {
  const sorted = candidates
    .map((tag) => ({ ...tag, priority: semanticTagPriority(tag) }))
    .sort((a, b) => a.priority - b.priority || a.y - b.y || a.x - b.x);
  const visible = [];
  for (const tag of sorted) {
    const collides = visible.some((kept) => {
      const d = Math.hypot(kept.x - tag.x, kept.y - tag.y);
      if (d === 0) return true;
      if (d <= 1.25 && !areMajorPOITags(kept, tag)) return true;
      return false;
    });
    if (!collides) visible.push(tag);
    if (visible.length >= MAX_SEMANTIC_TAGS) break;
  }
  return visible.map(({ priority, ...tag }) => tag);
}

function populationTagLabel(type) {
  if (type === "human") return "H domain";
  if (type === "beast") return "B range";
  return "S scar";
}

function populationTagCategory(type) {
  if (type === "human") return "human";
  if (type === "beast") return "beast";
  return "spirit";
}

function humanDomainTagCell(shape, source, ownership) {
  const cells = [...(shape.coreCells || []), ...(shape.bodyCells || []), ...(shape.edgeCells || [])]
    .filter((cell) => validTagCell(source, cell.x, cell.y));
  const anchors = [];
  if (ownership?.polity?.currentSeat) anchors.push(ownership.polity.currentSeat);
  for (const village of humanPolityMemory.villages || []) {
    if (!ownership?.polity || village.polityId === ownership.polity.id) anchors.push(village);
  }
  if (cells.length && anchors.length) {
    const sorted = cells
      .map((cell) => ({
        cell,
        anchorDistance: Math.min(...anchors.map((anchor) => distance(cell, anchor))),
        centerDistance: distance(cell, shape.center),
      }))
      .sort((a, b) => b.anchorDistance - a.anchorDistance || a.centerDistance - b.centerDistance);
    const clear = sorted.find((item) => item.anchorDistance > 2);
    if (clear) return { x: clear.cell.x, y: clear.cell.y };
  }
  return representativeCellForTag({
    center: shape.center,
    preferredCells: shape.coreCells?.length ? shape.coreCells : shape.bodyCells,
    fallbackCells: [...(shape.bodyCells || []), ...(shape.edgeCells || [])],
    source,
  });
}

function addPopulationSemanticTags(tags, source, mode) {
  const frame = refreshPopulationEvolutionFrame({ source, mode, force: true });
  for (const type of ["human", "beast", "spirit"]) {
    const cap = type === "human" ? 2 : 1;
    const shapes = (frame.shapes || [])
      .filter((shape) => shape.type === type && shape.state !== "fading")
      .sort((a, b) => b.confidence - a.confidence || b.area - a.area)
      .slice(0, Math.min(MAX_POPULATION_TAGS_PER_SPECIES, cap));
    for (const shape of shapes) {
      if ((shape.confidence || 0) < 0.55) continue;
      const humanOwnership = type === "human" ? inferHumanDomainPolity(shape) : null;
      const cell = type === "human" ? humanDomainTagCell(shape, source, humanOwnership) : representativeCellForTag({
        center: shape.center,
        preferredCells: shape.coreCells?.length ? shape.coreCells : shape.bodyCells,
        fallbackCells: [...(shape.bodyCells || []), ...(shape.edgeCells || [])],
        source,
      });
      if (!cell) continue;
      addSemanticTag(tags, {
        type: `population_${type}`,
        label: populationTagLabel(type),
        x: cell.x,
        y: cell.y,
        source: "population",
        sourceId: shape.id || null,
        category: populationTagCategory(type),
        priority: type === "human" ? 30 : type === "spirit" ? 40 : 45,
        ...(humanOwnership?.polity ? humanPolityTagFields(humanOwnership.polity, shape, humanOwnership.lineage?.id || humanOwnership.polity.rootLineageId, "domain") : {}),
      });
    }
  }
}

function addHumanLineageSemanticTags(tags, source) {
  if (!shouldShowHumanLineage()) return;
  const lineage = dominantHumanLineage();
  if (!lineage) return;
  const seatLineage = lineage.currentSeat ? lineage : humanLineageMemory.lineages.find((item) => item.currentSeat) || lineage;
  if (seatLineage.currentSeat) {
    const polity = findHumanPolityForLineage(seatLineage);
    addSemanticTag(tags, {
      type: "lineage_seat",
      label: "H seat",
      x: seatLineage.currentSeat.x,
      y: seatLineage.currentSeat.y,
      source: "lineage",
      sourceId: seatLineage.id,
      category: "lineage",
      priority: 5,
      ...humanPolityTagFields(polity, seatLineage.currentSeat, seatLineage.id, seatLineage.currentSeat.state || "active"),
    });
  }
  const mainlineIds = new Set();
  let cursor = lineage;
  while (cursor) {
    mainlineIds.add(cursor.id);
    cursor = cursor.parentId ? humanLineageMemory.lineages.find((item) => item.id === cursor.parentId) : null;
  }
  const recentOldSeats = humanLineageMemory.lineages
    .filter((item) => mainlineIds.has(item.id))
    .flatMap((item) => (item.seatHistory || []).map((seat) => ({ ...seat, lineageId: item.id })))
    .slice(-2);
  for (const oldSeat of recentOldSeats) {
    const oldLineage = humanLineageMemory.lineages.find((item) => item.id === oldSeat.lineageId);
    const polity = findHumanPolityForLineage(oldLineage);
    addSemanticTag(tags, {
      type: "lineage_old_seat",
      label: "H old seat",
      x: oldSeat.x,
      y: oldSeat.y,
      source: "lineage",
      sourceId: oldSeat.lineageId,
      category: "lineage",
      priority: 20,
      ...humanPolityTagFields(polity, oldSeat, oldSeat.lineageId, "old"),
      reason: oldSeat.reason || null,
      abandonedTick: oldSeat.abandonedTick,
    });
  }
  const visibleOutposts = (humanLineageMemory.humanOutposts || [])
    .filter((outpost) => !outpost.promotedToSeat && (outpost.state === "active" || outpost.state === "promotable"))
    .sort((a, b) => b.stableSamples - a.stableSamples || b.area - a.area)
    .slice(0, 2);
  for (const outpost of visibleOutposts) {
    const polity = outpost.polityId ? findHumanPolityById(outpost.polityId) : findHumanPolityForLineage(humanLineageMemory.lineages.find((item) => item.id === outpost.lineageId));
    if (polity?.state === "collapsed") continue;
    addSemanticTag(tags, {
      type: "lineage_outpost",
      label: "H outpost",
      x: outpost.x,
      y: outpost.y,
      source: "lineage",
      sourceId: outpost.id,
      category: "lineage",
      priority: 25,
      ...humanPolityTagFields(polity, outpost, outpost.lineageId, outpost.state),
    });
  }
}

function addHumanPolitySemanticTags(tags, source) {
  if (!shouldShowHumanLineage()) return;
  const visiblePolities = (humanPolityMemory.polities || [])
    .filter((polity) => polity.currentSeat && polity.state !== "collapsed")
    .sort((a, b) => {
      const aScore = (a.state === "active" || a.state === "pressured" ? 10 : 0) + (a.villageIds?.length || 0);
      const bScore = (b.state === "active" || b.state === "pressured" ? 10 : 0) + (b.villageIds?.length || 0);
      return bScore - aScore;
    })
    .slice(0, 3);
  for (const polity of visiblePolities) {
    if (polity.currentSeat?.state !== "pressured" && polity.currentSeat?.state !== "corrupted") continue;
    addSemanticTag(tags, {
      type: "polity_pressured_seat",
      label: "H pressured seat",
      x: polity.currentSeat.x,
      y: polity.currentSeat.y,
      source: "polity",
      sourceId: polity.id,
      category: "lineage",
      priority: 4,
      ...humanPolityTagFields(polity, polity.currentSeat, polity.currentSeat.lineageId, polity.currentSeat.state || "pressured"),
    });
  }

  const villages = (humanPolityMemory.villages || [])
    .filter((village) => village.state === "active" || village.state === "pressured" || village.state === "inherited")
    .filter((village) => !isRiverCell(village.x, village.y))
    .filter((village) => findHumanPolityById(village.polityId)?.state !== "collapsed")
    .sort((a, b) => b.support - b.pressure - (a.support - a.pressure))
    .slice(0, HUMAN_VILLAGE_VISIBLE_MAX);
  for (const village of villages) {
    addSemanticTag(tags, {
      type: "polity_village",
      label: "H village",
      x: village.x,
      y: village.y,
      source: "polity",
      sourceId: village.id,
      category: "lineage",
      priority: 28,
      ...humanPolityTagFields(findHumanPolityById(village.polityId), village, village.lineageId, village.state),
      previousPolityId: village.previousPolityId || null,
      inheritedFromPolityId: village.inheritedFromPolityId || null,
      memorySeed: village.memorySeed || null,
    });
  }

  const remnants = (humanPolityMemory.villages || [])
    .filter((village) => village.state === "remnant")
    .filter((village) => !isRiverCell(village.x, village.y))
    .sort((a, b) => (b.support || 0) - (a.support || 0))
    .slice(0, HUMAN_REMNANT_VISIBLE_MAX);
  for (const village of remnants) {
    const previousPolity = findHumanPolityById(village.previousPolityId);
    addSemanticTag(tags, {
      type: "polity_remnant",
      label: "H remnant",
      x: village.x,
      y: village.y,
      source: "polity",
      sourceId: village.id,
      category: "remnant",
      priority: 29,
      previousPolityId: village.previousPolityId || null,
      memorySeed: village.memorySeed || null,
      lineageId: village.lineageId,
      lineageAncestryIds: lineageAncestrySnapshot(village.lineageId).lineageAncestryIds,
      polityAncestryIds: polityAncestrySnapshot(village.previousPolityId).polityAncestryIds,
      rootLineageId: lineageAncestrySnapshot(village.lineageId).rootLineageId,
      rootPolityId: previousPolity ? rootPolityId(previousPolity) : null,
      state: "remnant",
      support: village.support,
      pressure: village.pressure,
    });
  }
}

function isCurrentHumanTag(label) {
  return label === "H seat" || label === "H pressured seat" || label === "H village" || label === "H outpost" || label === "H domain";
}

function removeCollapsedCurrentTags(tags) {
  return tags.filter((tag) => {
    if (!tag.polityId || !isCurrentHumanTag(tag.label)) return true;
    return findHumanPolityById(tag.polityId)?.state !== "collapsed";
  });
}

function poiTagLabel(type) {
  if (type === POI_TYPES.MONUMENT) return "Monument";
  if (type === POI_TYPES.ROT_SOURCE) return "Rot Source";
  if (type === POI_TYPES.SPRING) return "Spring";
  if (type === POI_TYPES.GREAT_FOREST) return "Great Forest";
  return "POI";
}

function poiTagCategory(type) {
  if (type === POI_TYPES.ROT_SOURCE) return "spirit";
  if (type === POI_TYPES.GREAT_FOREST) return "beast";
  if (type === POI_TYPES.MONUMENT) return "human";
  return "poi";
}

function addPOISemanticTags(tags, source, pois = worldPOIs) {
  for (const poi of pois || []) {
    if (poi.state && poi.state !== "active") continue;
    if (!validTagCell(source, poi.x, poi.y, { allowBlocked: true })) continue;
    addSemanticTag(tags, {
      type: `poi_${poi.type}`,
      label: poiTagLabel(poi.type),
      x: poi.x,
      y: poi.y,
      source: "poi",
      sourceId: poi.id || poi.type,
      category: poiTagCategory(poi.type),
      priority: semanticTagPriority({ label: poiTagLabel(poi.type) }),
    });
  }
}

function createSemanticTags(source = macroDisplayWorld || world, { mode = viewModeSelect?.value || "macro", pois = worldPOIs } = {}) {
  const tags = [];
  addHumanPolitySemanticTags(tags, source);
  addHumanLineageSemanticTags(tags, source);
  addPOISemanticTags(tags, source, pois);
  addPopulationSemanticTags(tags, source, mode);
  return declutterSemanticTags(removeCollapsedCurrentTags(tags));
}

function createZeroTrace() {
  return Array.from({ length: HEIGHT }, () => Array.from({ length: WIDTH }, () => 0));
}

function createEmptyMacroMemory() {
  return {
    version: MACRO_MEMORY_VERSION,
    tick: 0,
    updatedEvery: MACRO_DISPLAY_INTERVAL,
    traces: {
      human: createZeroTrace(),
      beast: createZeroTrace(),
      rot: createZeroTrace(),
      fertility: createZeroTrace(),
      conflict: createZeroTrace(),
    },
    poiStates: [],
  };
}

function clampTrace(value) {
  return Math.max(0, Math.min(1, value));
}

function roundTrace(value) {
  return Number((value || 0).toFixed(3));
}

function addTrace(channel, x, y, amount) {
  if (!macroMemory.traces[channel] || !inBounds(x, y)) return;
  macroMemory.traces[channel][y][x] = clampTrace(macroMemory.traces[channel][y][x] + amount);
}

function decayMacroMemory() {
  for (const trace of Object.values(macroMemory.traces)) {
    for (let y = 0; y < HEIGHT; y += 1) {
      for (let x = 0; x < WIDTH; x += 1) {
        trace[y][x] = clampTrace(trace[y][x] * MACRO_MEMORY_DECAY);
      }
    }
  }
}

function addShapeTrace(shape, channel) {
  for (const cell of shape.coreCells || []) addTrace(channel, cell.x, cell.y, MACRO_MEMORY_SHAPE_CORE_GAIN);
  for (const cell of shape.bodyCells || []) addTrace(channel, cell.x, cell.y, MACRO_MEMORY_SHAPE_BODY_GAIN);
  for (const cell of shape.edgeCells || []) addTrace(channel, cell.x, cell.y, MACRO_MEMORY_TERRAIN_GAIN);
}

function addPOITraceSignals(source, pois = worldPOIs) {
  for (const poi of pois || []) {
    if (poi.state !== "active") continue;
    for (const offset of RADIUS_OFFSETS[poi.radius || POI_EFFECTS.DEFAULT_RADIUS]) {
      const x = poi.x + offset.dx;
      const y = poi.y + offset.dy;
      if (!inBounds(x, y)) continue;
      const cell = source[y][x];
      if (cell.terrain === TERRAIN.BLOCK) continue;
      const distanceFromCenter = Math.hypot(offset.dx, offset.dy);
      if (poi.type === POI_TYPES.ROT_SOURCE) {
        const innerRadius = poi.innerRadius || POI_EFFECTS.ROT_SOURCE_INNER_RADIUS;
        if (distanceFromCenter <= innerRadius) addTrace("rot", x, y, MACRO_MEMORY_POI_GAIN);
        else if (cell.unit === UNIT.HUMAN || cell.unit === UNIT.BEAST || cell.terrain === TERRAIN.FIELD || cell.terrain === TERRAIN.WILD) {
          addTrace("conflict", x, y, MACRO_MEMORY_CONFLICT_GAIN);
        }
      } else if (poi.type === POI_TYPES.SPRING) {
        addTrace("fertility", x, y, MACRO_MEMORY_POI_GAIN);
      } else if (poi.type === POI_TYPES.MONUMENT && distanceFromCenter <= (poi.radius || POI_EFFECTS.DEFAULT_RADIUS)) {
        addTrace("human", x, y, MACRO_MEMORY_POI_GAIN * 0.55);
      } else if (poi.type === POI_TYPES.GREAT_FOREST && distanceFromCenter <= (poi.coreRadius || POI_EFFECTS.GREAT_FOREST_CORE_RADIUS)) {
        addTrace("beast", x, y, MACRO_MEMORY_POI_GAIN);
      }
    }
  }
}

function hasCurrentHumanBeastPressure(source, x, y) {
  const cell = source[y][x];
  if (cell.unit === UNIT.HUMAN && countUnitInRadius(source, x, y, UNIT.BEAST, 1, 1) > 0) return true;
  if (cell.unit === UNIT.BEAST && countUnitInRadius(source, x, y, UNIT.HUMAN, 1, 1) > 0) return true;
  const nearbyHumans = countUnitInRadius(source, x, y, UNIT.HUMAN, 1, 0);
  const nearbyBeasts = countUnitInRadius(source, x, y, UNIT.BEAST, 1, 0);
  return nearbyHumans > 0 && nearbyBeasts > 0;
}

function updateMacroMemory(source = world, { force = false, mode = "macro" } = {}) {
  if (!force && macroMemory && tick - macroMemory.tick < MACRO_DISPLAY_INTERVAL) return macroMemory;
  decayMacroMemory();
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const cell = source[y][x];
      if (cell.terrain === TERRAIN.BLOCK) {
        for (const trace of Object.values(macroMemory.traces)) trace[y][x] = 0;
        continue;
      }
      if (cell.terrain === TERRAIN.FIELD || cell.unit === UNIT.HUMAN) addTrace("human", x, y, MACRO_MEMORY_TERRAIN_GAIN);
      if (cell.terrain === TERRAIN.WILD || cell.unit === UNIT.BEAST) addTrace("beast", x, y, MACRO_MEMORY_TERRAIN_GAIN);
      if (cell.terrain === TERRAIN.MARK || cell.unit === UNIT.SPIRIT) addTrace("rot", x, y, MACRO_MEMORY_TERRAIN_GAIN);
      if (cell.fertility >= 3) addTrace("fertility", x, y, MACRO_MEMORY_TERRAIN_GAIN);
      if (cell.terrain === TERRAIN.BORDER) addTrace("conflict", x, y, MACRO_MEMORY_CONFLICT_GAIN);
      else if (hasCurrentHumanBeastPressure(source, x, y)) addTrace("conflict", x, y, MACRO_MEMORY_CONFLICT_GAIN);
    }
  }

  const frame = populationEvolutionFrame || refreshPopulationEvolutionFrame({ source, mode, force: true });
  for (const shape of frame.shapes || []) {
    if (shape.type === "human") addShapeTrace(shape, "human");
    else if (shape.type === "beast") addShapeTrace(shape, "beast");
    else if (shape.type === "spirit") addShapeTrace(shape, "rot");
  }

  addPOITraceSignals(source, worldPOIs);

  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const cell = source[y][x];
      if (cell.terrain === TERRAIN.BLOCK) continue;
      if (macroMemory.traces.human[y][x] >= MACRO_MEMORY_FAINT_THRESHOLD &&
        macroMemory.traces.beast[y][x] >= MACRO_MEMORY_FAINT_THRESHOLD) {
        const nearConflict = source[y][x].terrain === TERRAIN.BORDER || hasCurrentHumanBeastPressure(source, x, y);
        if (nearConflict) addTrace("conflict", x, y, MACRO_MEMORY_CONFLICT_GAIN);
        else if (macroMemory.traces.conflict[y][x] >= MACRO_MEMORY_FAINT_THRESHOLD * 0.85) addTrace("conflict", x, y, MACRO_MEMORY_OVERLAP_HINT_GAIN);
      }
    }
  }

  macroMemory.tick = tick;
  macroMemory.poiStates = derivePOIStates(source, worldPOIs);
  macroMemorySerial += 1;
  macroDisplayMaskCache = { source: null, macroTick: null, populationSerial: null, memorySerial: null, lineageSerial: null, politySerial: null, lineageVisible: null, mode: null, masks: null };
  return macroMemory;
}

function traceAveragesAroundPOI(poi, source, radius = poi.radius || POI_EFFECTS.DEFAULT_RADIUS) {
  const sums = { human: 0, beast: 0, rot: 0, fertility: 0, conflict: 0 };
  const maxes = { humanMax: 0, beastMax: 0, rotMax: 0, fertilityMax: 0, conflictMax: 0 };
  let count = 0;
  let markCount = 0;
  let fieldCount = 0;
  let wildCount = 0;
  for (const offset of RADIUS_OFFSETS[radius]) {
    const x = poi.x + offset.dx;
    const y = poi.y + offset.dy;
    if (!inBounds(x, y) || source[y][x].terrain === TERRAIN.BLOCK) continue;
    count += 1;
    for (const channel of Object.keys(sums)) {
      const value = macroMemory.traces[channel][y][x];
      sums[channel] += value;
      maxes[`${channel}Max`] = Math.max(maxes[`${channel}Max`], value);
    }
    if (source[y][x].terrain === TERRAIN.MARK) markCount += 1;
    if (source[y][x].terrain === TERRAIN.FIELD) fieldCount += 1;
    if (source[y][x].terrain === TERRAIN.WILD) wildCount += 1;
  }
  const averages = {};
  for (const [key, value] of Object.entries(sums)) averages[key] = count ? value / count : 0;
  const totalMemory = averages.human + averages.beast + averages.rot + averages.fertility + averages.conflict;
  return { ...averages, ...maxes, totalMemory, markCount, fieldCount, wildCount, count };
}

function poiMemoryLabel(poi, stats) {
  const warmingUp = tick < MACRO_MEMORY_POI_WARMUP_TICK || stats.totalMemory < MACRO_MEMORY_POI_WARMUP_TOTAL;
  if (warmingUp) {
    if (poi.type === POI_TYPES.SPRING) return "neutral";
    return "forming";
  }
  if (poi.type === POI_TYPES.MONUMENT) {
    if (stats.rot >= 0.48) return "haunted";
    if (stats.conflict >= 0.38 || stats.beast >= stats.human + 0.12) return "pressured";
    if (stats.human >= 0.35 && stats.fieldCount >= 4) return "prosperous";
    return "fallen";
  }
  if (poi.type === POI_TYPES.GREAT_FOREST) {
    if (stats.conflict >= 0.38 || stats.human >= stats.beast + 0.12) return "contested";
    if (stats.beast >= 0.40 && stats.wildCount >= 5 && stats.conflict < 0.28) return "flourishing";
    if (stats.beast >= 0.24) return "guarded";
    return "shrinking";
  }
  if (poi.type === POI_TYPES.ROT_SOURCE) {
    if (stats.conflict >= 0.34 || stats.conflictMax >= MACRO_MEMORY_STRONG_THRESHOLD || (stats.human >= 0.28 && stats.beast >= 0.28)) return "contested";
    if (stats.rot >= 0.48 && stats.markCount >= 4) return "dominant";
    if (stats.rot >= 0.24) return "spreading";
    return "contained";
  }
  if (poi.type === POI_TYPES.SPRING) {
    if (stats.rot >= 0.50 || stats.rotMax >= MACRO_MEMORY_STRONG_THRESHOLD) return "corrupted";
    if (stats.beast > stats.human + 0.12) return "wild_fed";
    if (stats.human > stats.beast + 0.12) return "field_fed";
    return "neutral";
  }
  return "active";
}

function derivePOIStates(source = world, pois = worldPOIs) {
  return (pois || []).map((poi) => {
    const stats = traceAveragesAroundPOI(poi, source);
    return {
      id: poi.id || null,
      type: poi.type,
      state: poiMemoryLabel(poi, stats),
      human: roundTrace(stats.human),
      beast: roundTrace(stats.beast),
      rot: roundTrace(stats.rot),
      fertility: roundTrace(stats.fertility),
      conflict: roundTrace(stats.conflict),
    };
  });
}

function createMacroMemorySummary(memory = macroMemory) {
  const activeCells = { human: 0, beast: 0, rot: 0, fertility: 0, conflict: 0 };
  const strongCells = { human: 0, beast: 0, rot: 0, fertility: 0, conflict: 0 };
  const activePct = { human: 0, beast: 0, rot: 0, fertility: 0, conflict: 0 };
  const strongPct = { human: 0, beast: 0, rot: 0, fertility: 0, conflict: 0 };
  const worldCounts = countWorld(world);
  const nonBlockCells = Math.max(1, WIDTH * HEIGHT - worldCounts.terrains["#"]);
  let strongest = "none";
  let strongestCount = 0;
  for (const channel of Object.keys(activeCells)) {
    const trace = memory.traces[channel];
    for (let y = 0; y < HEIGHT; y += 1) {
      for (let x = 0; x < WIDTH; x += 1) {
        if (trace[y][x] >= MACRO_MEMORY_FAINT_THRESHOLD) activeCells[channel] += 1;
        if (trace[y][x] >= MACRO_MEMORY_STRONG_THRESHOLD) strongCells[channel] += 1;
      }
    }
    if (strongCells[channel] > strongestCount) {
      strongest = channel;
      strongestCount = strongCells[channel];
    }
    activePct[channel] = Number((activeCells[channel] / nonBlockCells).toFixed(3));
    strongPct[channel] = Number((strongCells[channel] / nonBlockCells).toFixed(3));
  }
  return {
    strongest,
    nonBlockCells,
    activeCells,
    strongCells,
    coverage: {
      activePct,
      strongPct,
    },
  };
}

function addMacroMemoryDisplayClasses(mask, source) {
  const channelToClass = { human: "human", beast: "beast", rot: "rot", fertility: "fertile" };
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      if (source[y][x].terrain === TERRAIN.BLOCK) continue;
      const conflictValue = macroMemory.traces.conflict[y][x];
      const overlapConflict = macroMemory.traces.human[y][x] >= MACRO_MEMORY_FAINT_THRESHOLD &&
        macroMemory.traces.beast[y][x] >= MACRO_MEMORY_FAINT_THRESHOLD;
      if (conflictValue >= MACRO_MEMORY_STRONG_THRESHOLD) {
        addMacroCellClass(mask, x, y, "memory-conflict-strong");
      } else if (conflictValue >= MACRO_MEMORY_FAINT_THRESHOLD || (overlapConflict && conflictValue >= MACRO_MEMORY_FAINT_THRESHOLD * 0.85)) {
        addMacroCellClass(mask, x, y, "memory-conflict-faint");
      }

      let strongest = null;
      let strongestValue = 0;
      for (const channel of ["human", "beast", "rot", "fertility"]) {
        const value = macroMemory.traces[channel][y][x];
        if (value > strongestValue) {
          strongest = channel;
          strongestValue = value;
        }
      }
      if (!strongest || strongestValue < MACRO_MEMORY_FAINT_THRESHOLD) continue;
      const intensity = strongestValue >= MACRO_MEMORY_STRONG_THRESHOLD ? "strong" : "faint";
      addMacroCellClass(mask, x, y, `memory-${channelToClass[strongest]}-${intensity}`);
    }
  }
}

function createPOISummary(pois = worldPOIs) {
  const byType = { monument: 0, rot_source: 0, spring: 0, great_forest: 0 };
  for (const poi of pois || []) {
    if (poi.type in byType) byType[poi.type] += 1;
  }
  return {
    total: (pois || []).length,
    byType,
  };
}

function buildMacroDisplayMasks(source, mode = "macro", pois = worldPOIs) {
  const macroTick = macroWorld?.tick ?? 0;
  const useCache = pois === worldPOIs;
  const lineageVisible = shouldShowHumanLineage();
  if (
    useCache &&
    macroDisplayMaskCache.source === source &&
    macroDisplayMaskCache.macroTick === macroTick &&
    macroDisplayMaskCache.populationSerial === populationEvolutionSerial &&
    macroDisplayMaskCache.memorySerial === macroMemorySerial &&
    macroDisplayMaskCache.lineageSerial === humanLineageSerial &&
    macroDisplayMaskCache.politySerial === humanPolitySerial &&
    macroDisplayMaskCache.lineageVisible === lineageVisible &&
    macroDisplayMaskCache.mode === mode &&
    macroDisplayMaskCache.masks
  ) {
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

  softenMacroMaskEdges(mask, source);
  addMacroMemoryDisplayClasses(mask, source);
  addHumanLineageDisplayClasses(mask);
  mergePopulationEvolutionMasks(mask, source, mode);
  markPOICells(mask, source, pois);
  if (useCache) macroDisplayMaskCache = { source, macroTick, populationSerial: populationEvolutionSerial, memorySerial: macroMemorySerial, lineageSerial: humanLineageSerial, politySerial: humanPolitySerial, lineageVisible, mode, masks: mask };
  return mask;
}

function macroMaskRows(mask) {
  const keys = {
    settlement: "macro-cell-settlement",
    abandoned: "macro-cell-abandoned",
    wildRecovery: "macro-cell-wild",
    scar: "macro-cell-scar",
    frontier: "macro-cell-frontier",
    route: "macro-cell-route",
  };
  const rows = {};
  for (const [name, className] of Object.entries(keys)) {
    rows[name] = mask.cellClasses.map((row) =>
      row.map((classes) => classes.split(/\s+/).includes(className) ? "1" : ".").join("")
    );
  }
  return rows;
}

function createMacroDisplayFrame(source = world, mode = "macro") {
  const masks = buildMacroDisplayMasks(source, mode);
  return {
    tick,
    counts: countWorld(source),
    regionBiasCounts: countRegionBias(source),
    maskCounts: { ...masks.counts },
    maskRows: macroMaskRows(masks),
    macroSummary: macroSummary(),
  };
}

function refreshMacroDisplayFrame({ force = false, mode = "macro" } = {}) {
  if (!force && macroDisplayFrame && tick - macroDisplayFrame.tick < MACRO_DISPLAY_INTERVAL) return macroDisplayFrame;
  macroDisplayWorld = cloneWorld(world);
  refreshPopulationEvolutionFrame({ source: macroDisplayWorld, mode, force: true });
  updateMacroMemory(macroDisplayWorld, { force: true, mode });
  updateHumanLineageMemory(macroDisplayWorld, { force: true, mode });
  updateHumanPolityMemory(macroDisplayWorld, { force: true, mode });
  macroDisplayMaskCache = { source: null, macroTick: null, populationSerial: null, memorySerial: null, lineageSerial: null, politySerial: null, lineageVisible: null, mode: null, masks: null };
  macroDisplayFrame = createMacroDisplayFrame(macroDisplayWorld, mode);
  updateHumanLineageStatus(macroDisplayFrame.macroSummary.humanLineage);
  updateHumanPolityStatus(macroDisplayFrame.macroSummary.humanPolity);
  return macroDisplayFrame;
}

function createMacroDisplaySummary(source) {
  const masks = buildMacroDisplayMasks(source);
  return {
    viewModes: ["cell", "macro", "substrateMacro"],
    masks: { ...masks.counts },
  };
}

function createMacroDisplaySummaryFromObjects(worldState) {
  return {
    viewModes: ["cell", "macro", "substrateMacro"],
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
  macroDisplayWorld = cloneWorld(world);
  macroDisplayMaskCache = { source: null, macroTick: null, populationSerial: null, memorySerial: null, lineageSerial: null, politySerial: null, lineageVisible: null, mode: null, masks: null };
  macroFrames.push({ tick, regions: macroWorld.regions.length, events: macroWorld.events.length, routes: macroWorld.routes.length, visibleIcons: macroWorld.visibleIcons.length });
  if (macroFrames.length > MAX_MACRO_FRAMES) macroFrames = macroFrames.slice(-MAX_MACRO_FRAMES);
  recordMacroAnalysisFrame();
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
    populationEvolution: createPopulationEvolutionSummary(),
    poiSummary: createPOISummary(),
    macroMemory: createMacroMemorySummary(),
    humanLineage: createHumanLineageSummary(),
    humanPolity: createHumanPolitySummary(),
    semanticTags: createSemanticTags(macroDisplayWorld || world, { mode: viewModeSelect?.value === "explore" ? "macro" : viewModeSelect?.value || "macro" }),
    poiStates: macroMemory.poiStates.length ? macroMemory.poiStates.slice() : derivePOIStates(macroDisplayWorld || world, worldPOIs),
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
  macroDisplayWorld = null;
  macroDisplayFrame = null;
  macroDisplayMaskCache = { source: null, macroTick: null, populationSerial: null, memorySerial: null, lineageSerial: null, politySerial: null, lineageVisible: null, mode: null, masks: null };
  populationEvolutionState = createEmptyPopulationEvolutionState();
  populationEvolutionFrame = null;
  populationEvolutionSerial = 0;
  macroMemory = createEmptyMacroMemory();
  macroMemorySerial = 0;
  humanLineageMemory = createEmptyHumanLineageMemory();
  humanLineageSerial = 0;
  humanPolityMemory = createEmptyHumanPolityMemory();
  humanPolitySerial = 0;
  updateHumanLineageStatus();
  updateHumanPolityStatus();
}

function pushMacroRecentFrame(events, diagnostics) {
  macroRecentFrames.push({
    tick,
    counts: countWorld(world),
    events: cloneEvents(events),
    diagnostics: cloneDiagnostics(diagnostics),
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

function compactPlayerObserver() {
  const player = ensurePlayerObserver(world, worldPOIs);
  return {
    x: player.x,
    y: player.y,
    facing: player.facing,
    isSleeping: Boolean(player.isSleeping),
  };
}

function compactPlaceMemory() {
  return JSON.parse(JSON.stringify({
    version: placeMemory.version,
    anchors: placeMemory.anchors,
    wakeReports: placeMemory.wakeReports,
    protoCultureSummary: summarizeProtoCultureForPlaceMemory(placeMemory),
  }));
}

function compactProtoCultureSignals(signals = {}) {
  const entries = Object.entries(signals || {})
    .filter(([id]) => Object.values(PROTO_CULTURE_HINTS).includes(id))
    .sort((a, b) => (b[1]?.score || 0) - (a[1]?.score || 0) || a[0].localeCompare(b[0]))
    .slice(0, 8);
  return Object.fromEntries(entries.map(([id, signal]) => [id, {
    score: Number(Math.min(1, Math.max(0, signal?.score || 0)).toFixed(2)),
    samples: Math.max(0, Math.floor(signal?.samples || 0)),
    firstSeenTick: signal?.firstSeenTick ?? null,
    lastSeenTick: signal?.lastSeenTick ?? null,
    sourceTraits: compactProtoCultureSourceTraits(signal?.sourceTraits || []),
  }]));
}

function compactProtoCultureAnchor(anchor = {}) {
  const memory = anchor.protoCultureMemory || {};
  return {
    anchorId: anchor.id || null,
    anchorType: anchor.type || anchor.sourceRef?.kind || "place",
    displayName: anchor.displayName || anchor.type || "place",
    position: anchor.position ? { x: anchor.position.x, y: anchor.position.y } : { x: anchor.currentSnapshot?.position?.x ?? null, y: anchor.currentSnapshot?.position?.y ?? null },
    placeArchetype: anchor.currentSnapshot?.placeArchetype || null,
    primaryHint: memory.primaryHint || null,
    stableHints: Array.isArray(memory.stableHints) ? memory.stableHints.slice(0, 8) : [],
    activeHints: Array.isArray(memory.activeHints) ? memory.activeHints.slice(0, 8) : [],
    signals: compactProtoCultureSignals(memory.signals || {}),
    currentHints: Array.isArray(anchor.currentSnapshot?.protoCultureHints)
      ? anchor.currentSnapshot.protoCultureHints.slice(0, 8).map(normalizeProtoCultureHint).filter(Boolean)
      : [],
  };
}

function createProtoCultureSummaryExport() {
  const compactAnchors = (placeMemory.anchors || [])
    .filter((anchor) => hasAnchorProtoCulture(anchor))
    .sort((a, b) => strongestProtoCultureScore(b) - strongestProtoCultureScore(a) || String(a.id || "").localeCompare(String(b.id || "")))
    .slice(0, 48)
    .map(compactProtoCultureAnchor);
  return JSON.parse(JSON.stringify({
    type: "tri_species_proto_culture_summary",
    version: PROTO_CULTURE_EXPORT_VERSION,
    createdAt: new Date().toISOString(),
    tick,
    sourceRecordingRange: {
      startTick: recording.startTick ?? tick,
      endTick: recording.endTick ?? tick,
    },
    placeMemory: {
      protoCultureSummary: summarizeProtoCultureForPlaceMemory(placeMemory),
      compactAnchors,
    },
  }));
}

function exportProtoCultureSummaryJson() {
  const data = createProtoCultureSummaryExport();
  downloadJson(
    `tri_species_proto_culture_summary_tick_${padTick(data.tick)}.json`,
    data
  );
}

function collectCurrentPlaceReviewTargets(source = world) {
  refreshMacroDisplayFrame({ force: true, mode: "macro" });
  const semanticTargets = createSemanticTags(macroDisplayWorld || source, { mode: "macro" })
    .filter((tag) => ["H village", "H seat", "H pressured seat", "H old seat", "H outpost", "H remnant", "H domain", "B range", "S scar", "Rot Source", "Spring", "Great Forest", "Monument"].includes(tag.label));
  const poiTargets = (worldPOIs || [])
    .filter((poi) => poi.state !== "inactive")
    .map(poiToSemanticTag);
  return dedupeExploreTargets([
    ...humanVillageExploreTargets(),
    ...humanSeatExploreTargets(),
    ...humanOutpostExploreTargets(),
    ...semanticTargets,
    ...poiTargets,
    ...humanFallbackAuditTargets(source),
  ]).sort((a, b) => exploreInteractionPriority(a) - exploreInteractionPriority(b) ||
    semanticTagPriority(a) - semanticTagPriority(b) ||
    String(a.sourceId || "").localeCompare(String(b.sourceId || "")) ||
    (a.y - b.y) ||
    (a.x - b.x));
}

function compactCurrentPlaceReviewItem(anchor = {}) {
  const snapshot = anchor.currentSnapshot || {};
  const memory = anchor.protoCultureMemory || {};
  return {
    anchorId: anchor.id || null,
    anchorType: anchor.type || "unknown",
    displayName: anchor.displayName || "Place",
    position: anchor.position ? { x: anchor.position.x, y: anchor.position.y } : null,
    placeArchetype: snapshot.placeArchetype || null,
    primaryHint: memory.primaryHint || null,
    activeHints: Array.isArray(memory.activeHints) ? memory.activeHints.slice(0, 6) : [],
    stableHints: Array.isArray(memory.stableHints) ? memory.stableHints.slice(0, 6) : [],
  };
}

function summarizeCurrentPlaceReviewItems(items = []) {
  const byType = {};
  const primaryHints = {};
  let withProtoCulture = 0;
  for (const item of items) {
    incrementSummaryCount(byType, item.anchorType || "unknown");
    if (item.primaryHint) incrementSummaryCount(primaryHints, item.primaryHint);
    if (item.primaryHint || item.activeHints.length || item.stableHints.length) withProtoCulture += 1;
  }
  return {
    scanned: items.length,
    withProtoCulture,
    byType: sortedCountObject(byType),
    primaryHints: sortedCountObject(primaryHints),
  };
}

function formatCompactCountList(counts = {}, fallback = "none") {
  const entries = Object.entries(counts || {});
  if (!entries.length) return fallback;
  return entries.map(([key, value]) => `${key} ${value}`).join(", ");
}

function showCurrentPlaceReviewPanel(review) {
  if (!semanticTagInfoPanelEl || !review) return;
  const examples = review.items
    .filter((item) => item.primaryHint || item.activeHints.length || item.stableHints.length)
    .slice(0, 12)
    .map((item) => {
      const pos = item.position ? `${item.position.x},${item.position.y}` : "?,?";
      const hint = item.primaryHint || item.activeHints[0] || item.stableHints[0] || "no proto-culture hint";
      return `${item.displayName} (${item.anchorType}) @ ${pos}: ${hint}`;
    });
  const textLines = [
    "Current Tick Places",
    `Tick: ${review.tick}`,
    `Scanned: ${review.summary.scanned}`,
    `With proto-culture memory: ${review.summary.withProtoCulture}`,
    `Place types: ${formatCompactCountList(review.summary.byType)}`,
    `Primary hints: ${formatCompactCountList(review.summary.primaryHints)}`,
    "Examples:",
    ...(examples.length ? examples : ["none yet"]),
  ];
  semanticTagInfoPanelEl.className = "semantic-tag-info-panel visible";
  setElementAttribute(semanticTagInfoPanelEl, "aria-hidden", "false");
  semanticTagInfoPanelEl.innerHTML = "";
  semanticTagInfoPanelEl.textContent = textLines.join("\n");
  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "semantic-tag-info-close";
  closeButton.textContent = "Close";
  closeButton.addEventListener("click", hideSemanticTagInfo);
  semanticTagInfoPanelEl.appendChild(closeButton);
}

function inspectCurrentTickPlaces(options = {}) {
  const maxTargets = Number.isFinite(options.maxTargets) ? Math.max(1, Math.floor(options.maxTargets)) : 96;
  const targets = collectCurrentPlaceReviewTargets(world).slice(0, maxTargets);
  const items = [];
  for (const target of targets) {
    const anchor = inspectPlaceTarget(target, world);
    if (anchor) items.push(compactCurrentPlaceReviewItem(anchor));
  }
  const review = {
    type: "tri_species_current_tick_place_review",
    version: PROTO_CULTURE_EXPORT_VERSION,
    tick,
    scannedTargets: targets.length,
    summary: summarizeCurrentPlaceReviewItems(items),
    items,
    placeMemory: {
      protoCultureSummary: summarizeProtoCultureForPlaceMemory(placeMemory),
    },
  };
  showCurrentPlaceReviewPanel(review);
  showStatus(`Inspected ${items.length} current places at tick ${tick}.`);
  return JSON.parse(JSON.stringify(review));
}

function mergeCountObjects(target, source) {
  for (const [key, value] of Object.entries(source || {})) {
    target[key] = (target[key] || 0) + value;
  }
}

function aggregateStrongestExamples(target, source) {
  for (const id of Object.values(PROTO_CULTURE_HINTS)) {
    const combined = [...(target[id] || []), ...(source?.[id] || [])];
    target[id] = combined
      .sort((a, b) => (b.score || 0) - (a.score || 0) ||
        Number(b.primaryHint === id) - Number(a.primaryHint === id) ||
        Number(b.stable) - Number(a.stable) ||
        String(a.anchorId || "").localeCompare(String(b.anchorId || "")))
      .slice(0, 5);
  }
}

function humanFallbackAuditTargets(source = world) {
  const cells = [];
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      if (source[y][x].unit === UNIT.HUMAN) cells.push({ x, y });
    }
  }
  if (!cells.length) return [];
  const cx = Math.round(cells.reduce((sum, cell) => sum + cell.x, 0) / cells.length);
  const cy = Math.round(cells.reduce((sum, cell) => sum + cell.y, 0) / cells.length);
  return [{
    type: "polity_village",
    label: "H village",
    x: cx,
    y: cy,
    source: "audit",
    sourceId: `audit_human_cluster_${cx}_${cy}`,
    category: "lineage",
    state: "active",
    support: cells.length,
    area: cells.length,
  }];
}

function collectProtoCultureAuditTargets(source = world, maxTargets = 24) {
  refreshMacroDisplayFrame({ force: true, mode: "macro" });
  const tags = createSemanticTags(macroDisplayWorld || source, { mode: "macro" })
    .filter((tag) => ["H village", "H seat", "H pressured seat", "H old seat", "H outpost", "H remnant", "H domain"].includes(tag.label));
  const poiTargets = (worldPOIs || [])
    .filter((poi) => poi.state !== "inactive")
    .map(poiToSemanticTag);
  const targets = dedupeExploreTargets([
    ...humanVillageExploreTargets(),
    ...humanSeatExploreTargets(),
    ...humanOutpostExploreTargets(),
    ...tags,
    ...poiTargets,
    ...humanFallbackAuditTargets(source),
  ]);
  return targets
    .sort((a, b) => exploreInteractionPriority(a) - exploreInteractionPriority(b) ||
      String(a.sourceId || "").localeCompare(String(b.sourceId || "")) ||
      (a.y - b.y) ||
      (a.x - b.x))
    .slice(0, Math.max(1, maxTargets));
}

function inspectProtoCultureAuditTargets(source = world, maxTargets = 24) {
  const targets = collectProtoCultureAuditTargets(source, maxTargets);
  const inspected = [];
  for (const target of targets) {
    const anchor = inspectPlaceTarget(target, source);
    if (!anchor) continue;
    inspected.push({
      anchorId: anchor.id,
      anchorType: anchor.type,
      displayName: anchor.displayName,
      primaryHint: anchor.protoCultureMemory?.primaryHint || null,
      activeHints: Array.isArray(anchor.protoCultureMemory?.activeHints) ? anchor.protoCultureMemory.activeHints.slice(0, 6) : [],
      stableHints: Array.isArray(anchor.protoCultureMemory?.stableHints) ? anchor.protoCultureMemory.stableHints.slice(0, 6) : [],
    });
  }
  return inspected;
}

function runWithSeededMathRandom(seed, fn) {
  const originalRandom = Math.random;
  const rng = createSeededRandom(seed || 1);
  Math.random = rng;
  try {
    return fn();
  } finally {
    Math.random = originalRandom;
  }
}

function runProtoCultureSummaryAuditForSeedsForTest(options = {}) {
  const seeds = Array.isArray(options.seeds) && options.seeds.length ? options.seeds.map((seed) => Math.floor(seed)) : [31401, 31402, 31403];
  const ticksToRun = Math.max(0, Math.floor(options.ticks ?? 200));
  const inspectEvery = Math.max(1, Math.floor(options.inspectEvery ?? 25));
  const maxTargets = Math.max(1, Math.floor(options.maxTargets ?? 24));
  const savedState = {
    tick,
    world: cloneWorld(world, { includeMetadata: true }),
    currentInitialWorld: currentInitialWorld ? cloneWorld(currentInitialWorld, { includeMetadata: true }) : null,
    currentInitialSettings: currentInitialSettings ? { ...currentInitialSettings } : null,
    activeMapSeed: normalizeMapSeed(activeMapSeed || createDefaultMapSeed()),
    mapFeatures: cloneMapFeatures(),
    worldPOIs: clonePOIs(),
    placeMemory: JSON.parse(JSON.stringify(placeMemory)),
    recording: JSON.parse(JSON.stringify(recording)),
    macroTimeline: JSON.parse(JSON.stringify(macroTimeline)),
    currentRegionalSubstrate: cloneRegionalSubstrateLayout(),
    macroWorld: cloneMacroWorldSnapshot(macroWorld),
    macroDisplayWorld: macroDisplayWorld ? cloneWorld(macroDisplayWorld, { includeMetadata: true }) : null,
    macroDisplayFrame: macroDisplayFrame ? JSON.parse(JSON.stringify(macroDisplayFrame)) : null,
    macroFrames: JSON.parse(JSON.stringify(macroFrames)),
    macroHistory: JSON.parse(JSON.stringify(macroHistory)),
    macroRecentFrames: JSON.parse(JSON.stringify(macroRecentFrames)),
    macroMemory: JSON.parse(JSON.stringify(macroMemory)),
    humanLineageMemory: JSON.parse(JSON.stringify(humanLineageMemory)),
    humanPolityMemory: JSON.parse(JSON.stringify(humanPolityMemory)),
    randomSeedInputValue: randomSeedInput?.value,
  };

  const runs = [];
  const aggregate = {
    runCount: seeds.length,
    primaryHintCounts: {},
    stableHintCounts: {},
    activeHintCounts: {},
    anchorTypeWithHintCounts: {},
    nonHumanAnchorWithHints: 0,
    strongestExamplesByHint: Object.fromEntries(Object.values(PROTO_CULTURE_HINTS).map((id) => [id, []])),
  };

  try {
    for (const seed of seeds) {
      const run = runWithSeededMathRandom(seed, () => {
        const settings = { ...getInitialSettings(), randomSeed: seed };
        if (randomSeedInput) randomSeedInput.value = String(seed);
        const nextWorld = createInitialWorld(settings);
        currentInitialWorld = cloneWorld(nextWorld, { includeMetadata: true });
        currentInitialSettings = { ...settings };
        resetWorld(currentInitialWorld);
        placeMemory = createEmptyPlaceMemory();
        recording = createEmptyRecording();
        const startTick = tick;
        const inspectionLog = [];

        for (let elapsed = 0; elapsed <= ticksToRun; elapsed += 1) {
          if (elapsed % inspectEvery === 0 || elapsed === ticksToRun) {
            const inspected = inspectProtoCultureAuditTargets(world, maxTargets);
            inspectionLog.push({
              tick,
              inspected: inspected.length,
              anchorsWithHints: inspected.filter((item) => item.primaryHint || item.activeHints.length || item.stableHints.length).length,
            });
          }
          if (elapsed < ticksToRun) stepWorld();
        }

        const protoCultureSummary = summarizeProtoCultureForPlaceMemory(placeMemory);
        return {
          seed,
          startTick,
          endTick: tick,
          inspectedAnchors: placeMemory.anchors.length,
          protoCultureSummary,
          strongestExamplesByHint: protoCultureSummary.strongestExamplesByHint,
          finalCounts: countWorld(world),
          inspectionLog,
        };
      });
      runs.push(run);
      mergeCountObjects(aggregate.primaryHintCounts, run.protoCultureSummary.primaryHintCounts);
      mergeCountObjects(aggregate.stableHintCounts, run.protoCultureSummary.stableHintCounts);
      mergeCountObjects(aggregate.activeHintCounts, run.protoCultureSummary.activeHintCounts);
      mergeCountObjects(aggregate.anchorTypeWithHintCounts, run.protoCultureSummary.anchorTypeWithHintCounts);
      aggregate.nonHumanAnchorWithHints += run.protoCultureSummary.nonHumanAnchorWithHints || 0;
      aggregateStrongestExamples(aggregate.strongestExamplesByHint, run.protoCultureSummary.strongestExamplesByHint);
    }
    aggregate.primaryHintCounts = sortedCountObject(aggregate.primaryHintCounts);
    aggregate.stableHintCounts = sortedCountObject(aggregate.stableHintCounts);
    aggregate.activeHintCounts = sortedCountObject(aggregate.activeHintCounts);
    aggregate.anchorTypeWithHintCounts = sortedCountObject(aggregate.anchorTypeWithHintCounts);
    return JSON.parse(JSON.stringify({
      version: PROTO_CULTURE_EXPORT_VERSION,
      ticks: ticksToRun,
      inspectEvery,
      runs,
      aggregate,
    }));
  } finally {
    tick = savedState.tick;
    world = cloneWorld(savedState.world, { includeMetadata: true });
    currentInitialWorld = savedState.currentInitialWorld ? cloneWorld(savedState.currentInitialWorld, { includeMetadata: true }) : null;
    currentInitialSettings = savedState.currentInitialSettings;
    activeMapSeed = normalizeMapSeed(savedState.activeMapSeed);
    mapFeatures = cloneMapFeatures(savedState.mapFeatures);
    worldPOIs = clonePOIs(savedState.worldPOIs);
    placeMemory = JSON.parse(JSON.stringify(savedState.placeMemory));
    recording = JSON.parse(JSON.stringify(savedState.recording));
    macroTimeline = JSON.parse(JSON.stringify(savedState.macroTimeline));
    currentRegionalSubstrate = savedState.currentRegionalSubstrate ? cloneRegionalSubstrateLayout(savedState.currentRegionalSubstrate) : null;
    macroWorld = JSON.parse(JSON.stringify(savedState.macroWorld));
    macroDisplayWorld = savedState.macroDisplayWorld ? cloneWorld(savedState.macroDisplayWorld, { includeMetadata: true }) : null;
    macroDisplayFrame = savedState.macroDisplayFrame ? JSON.parse(JSON.stringify(savedState.macroDisplayFrame)) : null;
    macroDisplayMaskCache = { source: null, macroTick: null, populationSerial: null, memorySerial: null, lineageSerial: null, politySerial: null, lineageVisible: null, mode: null, masks: null };
    macroFrames = JSON.parse(JSON.stringify(savedState.macroFrames));
    macroHistory = JSON.parse(JSON.stringify(savedState.macroHistory));
    macroRecentFrames = JSON.parse(JSON.stringify(savedState.macroRecentFrames));
    macroMemory = JSON.parse(JSON.stringify(savedState.macroMemory));
    humanLineageMemory = JSON.parse(JSON.stringify(savedState.humanLineageMemory));
    humanPolityMemory = JSON.parse(JSON.stringify(savedState.humanPolityMemory));
    if (randomSeedInput) randomSeedInput.value = savedState.randomSeedInputValue;
    updateRecordingStatus();
    updateMacroTimelineStatus();
    refreshMapSeedTextarea();
  }
}

function createSnapshotExport() {
  const rows = createWorldRows(world);
  const analyzedMacroWorld = ensureMacroAnalysis();
  refreshMacroDisplayFrame({ force: true, mode: viewModeSelect?.value || "macro" });
  const regionalSubstrate = cloneRegionalSubstrateLayout();
  return {
    type: "tri_species_snapshot",
    version: "0.1",
    createdAt: new Date().toISOString(),
    tick,
    params: getParams(),
    initialSettings: getExportInitialSettings(),
    counts: countWorld(world),
    regionBiasCounts: countRegionBias(world),
    world: rows,
    roles: rows.roles,
    fertility: calculateFertilityStats(world),
    interventions: interventionLog.slice(),
    pointsOfInterest: clonePOIs(),
    mapSeed: normalizeMapSeed(activeMapSeed || createDefaultMapSeed()),
    mapFeatures: cloneMapFeatures(),
    placeMemory: compactPlaceMemory(),
    playerObserver: compactPlayerObserver(),
    regionalSubstrate,
    humanLineageMemorySummary: createHumanLineageSummary(),
    humanPolitySummary: createHumanPolitySummary(),
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
  const player = ensurePlayerObserver(world, worldPOIs);
  gridSizeEl.textContent = viewModeSelect?.value === "explore" && !player.isSleeping ? `${EXPLORE_VIEWPORT_COLS} x ${EXPLORE_VIEWPORT_ROWS} local` : `${WIDTH} x ${HEIGHT}`;
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
    regionBiasCounts: countRegionBias(world),
    fertility: calculateFertilityStats(world),
    events: cloneEvents(events),
    diagnostics: cloneDiagnostics(diagnostics),
    interventions: interventionLog.filter((entry) => entry.tick === tick),
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
    regionalSubstrate: cloneRegionalSubstrateLayout(),
    pointsOfInterest: clonePOIs(),
    mapSeed: normalizeMapSeed(activeMapSeed || createDefaultMapSeed()),
    mapFeatures: cloneMapFeatures(),
    placeMemory: compactPlaceMemory(),
    playerObserver: compactPlayerObserver(),
    macroMemorySummary: createMacroMemorySummary(),
    humanLineageMemorySummary: createHumanLineageSummary(),
    humanPolitySummary: createHumanPolitySummary(),
    macroWorld: cloneMacroWorldSnapshot(analyzedMacroWorld),
    macroFrames: macroFrames.slice(),
    interventions: interventionLog.slice(),
  };
}

function exportRecordingJson() {
  const data = createRecordingExport();
  downloadJson(
    `tri_species_recording_ticks_${padTick(data.startTick)}_${padTick(data.endTick)}.json`,
    data
  );
}

function updateMacroTimelineStatus() {
  macroTimelineStateEl.textContent = macroTimeline.isRecording ? "ON" : "OFF";
  macroTimelineFramesEl.textContent = String(macroTimeline.frames.length);
  macroTimelineAnalysisFramesEl.textContent = String(macroTimeline.analysisFrames.length);
}

function shouldRecordMacroTimelineFrame() {
  return macroTimeline.frames.length === 0 || tick % MACRO_TIMELINE_SAMPLE_INTERVAL === 0;
}

function recordMacroAnalysisFrame() {
  if (!macroTimeline.isRecording) return;
  const lastFrame = macroTimeline.analysisFrames[macroTimeline.analysisFrames.length - 1];
  if (lastFrame && lastFrame.tick === tick) return;
  macroTimeline.analysisFrames.push({
    tick,
    macroWorld: cloneMacroWorldSnapshot(macroWorld),
  });
}

function recordMacroTimelineFrame({ force = false, mode = "macro" } = {}) {
  if (!macroTimeline.isRecording) return;
  if (!force && !shouldRecordMacroTimelineFrame()) return;
  if (macroTimeline.frames.length >= MAX_RECORDED_FRAMES) {
    macroTimeline.isRecording = false;
    showStatus("Macro Timeline stopped: max frame limit reached.");
    updateMacroTimelineStatus();
    return;
  }
  if (macroTimeline.startTick === null) {
    macroTimeline.startTick = tick;
    macroTimeline.params = getParams();
  }
  const displayFrame = refreshMacroDisplayFrame({ force: true, mode });
  macroTimeline.endTick = tick;
  macroTimeline.frames.push(JSON.parse(JSON.stringify(displayFrame)));
  updateMacroTimelineStatus();
}

function startMacroTimeline() {
  if (macroTimeline.isRecording) return;
  macroTimeline.isRecording = true;
  if (macroTimeline.startTick === null) {
    macroTimeline.startTick = tick;
    macroTimeline.params = getParams();
  }
  if (!macroWorld || macroWorld.tick !== tick) analyzeMacroWorldNow();
  else recordMacroAnalysisFrame();
  recordMacroTimelineFrame({ force: macroTimeline.frames.length === 0, mode: viewModeSelect?.value || "macro" });
  updateMacroTimelineStatus();
}

function stopMacroTimeline() {
  macroTimeline.isRecording = false;
  updateMacroTimelineStatus();
}

function clearMacroTimeline() {
  macroTimeline = createEmptyMacroTimeline();
  updateMacroTimelineStatus();
}

function createMacroTimelineExport() {
  if (macroTimeline.isRecording) {
    recordMacroTimelineFrame({ mode: viewModeSelect?.value || "macro" });
    if (!macroTimeline.analysisFrames.some((frame) => frame.tick === macroWorld.tick)) recordMacroAnalysisFrame();
  }
  const firstFrame = macroTimeline.frames[0] || refreshMacroDisplayFrame({ force: true, mode: viewModeSelect?.value || "macro" });
  const lastFrame = macroTimeline.frames[macroTimeline.frames.length - 1] || firstFrame;
  return {
    type: "tri_species_macro_timeline",
    version: "0.1",
    createdAt: new Date().toISOString(),
    startTick: macroTimeline.startTick ?? firstFrame.tick,
    endTick: macroTimeline.endTick ?? lastFrame.tick,
    sampleEvery: MACRO_TIMELINE_SAMPLE_INTERVAL,
    analysisEvery: MACRO_ANALYSIS_INTERVAL,
    grid: { width: WIDTH, height: HEIGHT },
    initialSettings: getExportInitialSettings(),
    regionalSubstrate: cloneRegionalSubstrateLayout(),
    pointsOfInterest: clonePOIs(),
    frames: macroTimeline.frames.slice(),
    analysisFrames: macroTimeline.analysisFrames.slice(),
    interventions: interventionLog.slice(),
  };
}

function exportMacroTimelineJson() {
  const data = createMacroTimelineExport();
  downloadJson(
    `tri_species_macro_timeline_ticks_${padTick(data.startTick)}_${padTick(data.endTick)}.json`,
    data
  );
}

function placeInterventionUnit(x, y, unit = interventionUnitSelect?.value || "") {
  if (!unit) return false;
  if (!Object.values(UNIT).includes(unit) || !inBounds(x, y)) return false;
  const cell = world[y][x];
  if (cell.terrain === TERRAIN.BLOCK) {
    showStatus("Intervention rejected: BLOCK cell.");
    return false;
  }
  if (isPOIHardBlocker(x, y)) {
    showStatus("Intervention rejected: POI source cell.");
    return false;
  }
  const replaced = cell.unit || null;
  cell.unit = unit;
  cell.age = 0;
  cell.role = unit === UNIT.BEAST ? "pack" : unit === UNIT.SPIRIT ? "manifestation" : "normal";
  cell.maxAge = unit === UNIT.SPIRIT ? spiritMaxAge() : null;
  interventionLog.push({ tick, x, y, unit, replaced });
  analyzeMacroWorldNow();
  refreshMacroDisplayFrame({ force: true, mode: viewModeSelect?.value || "macro" });
  if (macroTimeline.isRecording) recordMacroTimelineFrame({ force: true, mode: viewModeSelect?.value || "macro" });
  renderWorld();
  updateStats();
  showStatus(`Placed ${unit} at ${x},${y}.`);
  return true;
}

function removeSeedEntriesAt(seed, x, y) {
  const key = pointKey(x, y);
  seed.units = seed.units.filter((unit) => pointKey(unit.x, unit.y) !== key);
  seed.mountains = seed.mountains.filter((point) => pointKey(point.x, point.y) !== key);
  seed.rivers = seed.rivers.filter((point) => pointKey(point.x, point.y) !== key);
  seed.pois = seed.pois.filter((poi) => pointKey(poi.x, poi.y) !== key);
}

function brushDisplayName(brush) {
  return {
    H: "Human",
    B: "Beast",
    S: "Spirit",
    mountain: "Mountain",
    river: "River",
    spring: "Spring",
    rot_source: "Rot Source",
    great_forest: "Great Forest",
    monument: "Monument",
    erase: "Erase",
  }[brush] || brush;
}

function applyMapSeedBrush(x, y, brush = mapSeedBrushSelect?.value || "") {
  if (!brush) return false;
  const seed = normalizeMapSeed(activeMapSeed || createDefaultMapSeed());
  removeSeedEntriesAt(seed, x, y);
  if (brush === "erase") {
    activeMapSeed = normalizeMapSeed(seed);
    applyActiveMapSeedLive();
    showStatus(`Erased seed item at ${x},${y}.`);
    return { painted: true, x, y, brush };
  }
  if (["H", "B", "S"].includes(brush)) seed.units.push({ type: brush, x, y });
  else if (brush === "mountain") seed.mountains.push({ x, y });
  else if (brush === "river") seed.rivers.push({ x, y });
  else if (Object.values(POI_TYPES).includes(brush)) seed.pois.push({ id: `seed_${brush}_${x}_${y}`, type: brush, x, y });
  else return false;
  activeMapSeed = normalizeMapSeed(seed);
  applyActiveMapSeedLive();
  showStatus(`Painted ${brushDisplayName(brush)} at ${x},${y}.`);
  return { painted: true, x, y, brush };
}

function applyMapSeedFromTextarea() {
  try {
    const seed = parseMapSeedJson(mapSeedJsonEl?.value || serializeMapSeed(activeMapSeed || createDefaultMapSeed()));
    const next = applyMapSeedToWorld(seed, { setAsCurrent: false });
    resetWorld(next);
    currentInitialWorld = cloneWorld(next, { includeMetadata: true });
    activeMapSeed = seed;
    refreshMapSeedTextarea();
    showStatus("Map seed applied.");
  } catch (err) {
    console.error(err);
    showStatus("Map seed import failed: invalid JSON.");
  }
}

function resetFromMapSeed() {
  const next = applyMapSeedToWorld(activeMapSeed || createDefaultMapSeed(), { setAsCurrent: false });
  resetWorld(next);
  currentInitialWorld = cloneWorld(next, { includeMetadata: true });
  showStatus("Reset from map seed.");
}

function addSeedUnitCluster(seed, type, cx, cy, radius = 1) {
  for (let y = cy - radius; y <= cy + radius; y += 1) {
    for (let x = cx - radius; x <= cx + radius; x += 1) {
      if (!inBounds(x, y) || Math.hypot(x - cx, y - cy) > radius + 0.2) continue;
      seed.units.push({ type, x, y });
    }
  }
}

function createRandomMapSeedPreset() {
  const baseSeed = Number(randomSeedInput?.value) || randomSeedValue();
  const rng = createSeededRandom(baseSeed + tick + 1311);
  const seed = createDefaultMapSeed();
  seed.name = `Editable preset ${baseSeed}`;

  const ridgeY = randomInt(rng, 5, 10);
  for (let x = 3; x < WIDTH - 3; x += 1) {
    const y = Math.max(1, Math.min(HEIGHT - 2, ridgeY + Math.round(Math.sin(x * 0.55) * 2) + randomInt(rng, -1, 1)));
    if (rng() < 0.72) seed.mountains.push({ x, y });
    if (rng() < 0.28 && inBounds(x, y + 1)) seed.mountains.push({ x, y: y + 1 });
  }

  seed.rivers = generateRiverPath(rng, { blockedPoints: seed.mountains });
  const springRiverAnchor = seed.rivers[Math.min(3, Math.max(0, seed.rivers.length - 1))] || { x: WIDTH / 2, y: 4 };

  seed.pois.push(
    { id: "seed_spring_random", type: POI_TYPES.SPRING, x: Math.max(2, Math.min(WIDTH - 3, springRiverAnchor.x - 2)), y: springRiverAnchor.y },
    { id: "seed_rot_source_random", type: POI_TYPES.ROT_SOURCE, x: WIDTH - 7, y: HEIGHT - 6 },
    { id: "seed_great_forest_random", type: POI_TYPES.GREAT_FOREST, x: WIDTH - 8, y: 7 },
    { id: "seed_monument_random", type: POI_TYPES.MONUMENT, x: 7, y: HEIGHT - 7 }
  );

  addSeedUnitCluster(seed, UNIT.HUMAN, 7, 12, 1);
  addSeedUnitCluster(seed, UNIT.BEAST, WIDTH - 8, 12, 1);
  seed.units.push({ type: UNIT.SPIRIT, x: WIDTH - 9, y: HEIGHT - 7 });

  return normalizeMapSeed(seed);
}

function generateRandomMapSeedPreset() {
  activeMapSeed = createRandomMapSeedPreset();
  applyActiveMapSeedLive({ preservePlayer: true });
  showStatus("Generated random editable seed preset.");
  return activeMapSeed;
}

function clearMapSeed() {
  activeMapSeed = createDefaultMapSeed();
  applyActiveMapSeedLive({ preservePlayer: true });
  showStatus("Cleared map seed.");
  return activeMapSeed;
}

function exportMapSeedJson() {
  downloadJson(`tri_species_map_seed_tick_${padTick(tick)}.json`, normalizeMapSeed(activeMapSeed || createDefaultMapSeed()));
}

function cellWorldPositionFromElement(cellEl, fallbackIndex) {
  const x = Number(cellEl?.dataset?.worldX);
  const y = Number(cellEl?.dataset?.worldY);
  if (Number.isFinite(x) && Number.isFinite(y) && inBounds(x, y)) return { x, y };
  return {
    x: fallbackIndex % WIDTH,
    y: Math.floor(fallbackIndex / WIDTH),
  };
}

function isDraggableMapSeedBrush(brush) {
  return ["mountain", "river", "erase", "H", "B", "S"].includes(brush);
}

function paintMapSeedCellFromElement(index, cellEl, brush = mapSeedBrushSelect?.value || "") {
  if (!brush) return false;
  const { x, y } = cellWorldPositionFromElement(cellEl, index);
  const key = pointKey(x, y);
  if (lastPaintedSeedCellKey === key) return false;
  lastPaintedSeedCellKey = key;
  return applyMapSeedBrush(x, y, brush);
}

function handleGridCellClick(index, cellEl = null) {
  const { x, y } = cellWorldPositionFromElement(cellEl, index);
  if (applyMapSeedBrush(x, y)) return;
  const unit = interventionUnitSelect?.value || "";
  if (!unit) return;
  placeInterventionUnit(x, y, unit);
}

function handleGridPointerDown(index, cellEl, event = {}) {
  const brush = mapSeedBrushSelect?.value || "";
  if (!brush) return;
  if (event.preventDefault) event.preventDefault();
  lastPaintedSeedCellKey = null;
  paintMapSeedCellFromElement(index, cellEl, brush);
  mapSeedPointerPainting = isDraggableMapSeedBrush(brush);
}

function handleGridPointerEnter(index, cellEl) {
  const brush = mapSeedBrushSelect?.value || "";
  if (!mapSeedPointerPainting || !isDraggableMapSeedBrush(brush)) return;
  paintMapSeedCellFromElement(index, cellEl, brush);
}

function stopMapSeedPointerPainting() {
  mapSeedPointerPainting = false;
  lastPaintedSeedCellKey = null;
}

function buildGrid(cols = WIDTH, rows = HEIGHT) {
  gridEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  gridEl.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  gridEl.innerHTML = "";
  gridEl.dataset.cols = String(cols);
  gridEl.dataset.rows = String(rows);
  for (let i = 0; i < cols * rows; i += 1) {
    const cell = document.createElement("div");
    cell.className = "cell terrain-empty";
    cell.dataset.index = String(i);
    cell.addEventListener("click", (event) => {
      if (mapSeedBrushSelect?.value) return;
      handleGridCellClick(i, event.currentTarget);
    });
    cell.addEventListener("pointerdown", (event) => handleGridPointerDown(i, event.currentTarget, event));
    cell.addEventListener("pointerenter", (event) => handleGridPointerEnter(i, event.currentTarget));
    gridEl.appendChild(cell);
  }
}

function ensureGridSize(cols, rows) {
  if (gridEl.dataset.cols === String(cols) && gridEl.dataset.rows === String(rows) && gridEl.children.length === cols * rows) return;
  buildGrid(cols, rows);
}

function renderExploreOverlay(viewport) {
  if (!macroOverlayEl) return;
  macroOverlayEl.innerHTML = "";
  currentSemanticTags = [];
  if (!macroOverlayToggle || macroOverlayToggle.checked) {
    const source = macroDisplayWorld || world;
    const tags = createSemanticTags(source, { mode: "macro" })
      .filter((tag) => tag.x >= viewport.startX && tag.x < viewport.startX + viewport.cols && tag.y >= viewport.startY && tag.y < viewport.startY + viewport.rows);
    currentSemanticTags = tags.map((tag) => JSON.parse(JSON.stringify(tag)));
    tags.forEach((tag, index) => {
      const el = document.createElement("div");
      const polityClass = Number.isInteger(tag.polityColorIndex) ? ` polity-color-${tag.polityColorIndex}` : "";
      el.className = `semantic-tag semantic-tag-${tag.category}${polityClass}`;
      el.textContent = tag.label;
      el.title = tag.title || `${tag.label}: ${tag.source}`;
      el.dataset.tagIndex = String(index);
      if (tag.polityId) el.dataset.polityId = tag.polityId;
      setElementAttribute(el, "role", "button");
      setElementAttribute(el, "tabindex", "0");
      el.addEventListener("click", (event) => {
        if (event?.stopPropagation) event.stopPropagation();
        showSemanticTagInfo(currentSemanticTags[index]);
      });
      el.style.left = `${((tag.x - viewport.startX + 0.5) / viewport.cols) * 100}%`;
      el.style.top = `${((tag.y - viewport.startY + 0.5) / viewport.rows) * 100}%`;
      macroOverlayEl.appendChild(el);
    });
  }
  const player = ensurePlayerObserver();
  const marker = document.createElement("div");
  marker.className = `explore-player-marker facing-${String(player.facing || "S").toLowerCase()}`;
  marker.textContent = player.facing || "S";
  marker.style.left = `${((player.x - viewport.startX) / viewport.cols) * 100}%`;
  marker.style.top = `${((player.y - viewport.startY) / viewport.rows) * 100}%`;
  macroOverlayEl.appendChild(marker);
}

function renderExploreWorld() {
  const player = ensurePlayerObserver(world, worldPOIs);
  const model = getExploreViewportRenderModel(player, macroDisplayWorld || world);
  const viewport = model;
  ensureGridSize(viewport.cols, viewport.rows);
  if (gridEl.classList) {
    gridEl.classList.toggle("macro-view", true);
    gridEl.classList.toggle("substrate-view", false);
    gridEl.classList.toggle("explore-view", true);
  }
  const cells = gridEl.children;
  model.cells.forEach((entry, index) => {
    const el = cells[index];
    const unit = "";
    const nextClassName = entry.className;
    el.dataset.worldX = String(entry.worldX);
    el.dataset.worldY = String(entry.worldY);
    el.dataset.terrain = entry.terrain;
    el.dataset.regionBias = entry.cell.regionBias || REGION_BIAS.NONE;
    if (el.className !== nextClassName) el.className = nextClassName;
    if (el.dataset.unit !== unit) {
      el.dataset.unit = unit;
      el.textContent = unit;
    }
    const fertilityLabel = String(Math.round(entry.fertility || 0));
    if (el.dataset.fertility !== fertilityLabel) {
      el.dataset.fertility = fertilityLabel;
      el.title = `(${entry.worldX}, ${entry.worldY}) fertility level ${fertilityLabel}`;
    }
  });
  renderExploreOverlay(viewport);
}

function renderMacroOverlay() {
  if (!macroOverlayEl) return;
  macroOverlayEl.innerHTML = "";
  currentSemanticTags = [];
  if (macroOverlayToggle && !macroOverlayToggle.checked) return;
  const selectedViewMode = viewModeSelect?.value || "cell";
  const sleepExplore = selectedViewMode === "explore" && ensurePlayerObserver().isSleeping;
  if (selectedViewMode !== "macro" && selectedViewMode !== "substrateMacro" && !sleepExplore) return;
  const source = macroDisplayWorld || world;
  const tags = createSemanticTags(source, { mode: sleepExplore ? "macro" : viewModeSelect?.value || "macro" });
  currentSemanticTags = tags.map((tag) => JSON.parse(JSON.stringify(tag)));
  tags.forEach((tag, index) => {
    const el = document.createElement("div");
    const polityClass = Number.isInteger(tag.polityColorIndex) ? ` polity-color-${tag.polityColorIndex}` : "";
    el.className = `semantic-tag semantic-tag-${tag.category}${polityClass}`;
    el.textContent = tag.label;
    el.title = tag.title || `${tag.label}: ${tag.source}`;
    el.dataset.tagIndex = String(index);
    if (tag.polityId) el.dataset.polityId = tag.polityId;
    if (tag.polityColorIndex !== undefined) el.dataset.polityColor = String(tag.polityColorIndex);
    if (tag.lineageId) el.dataset.lineageId = tag.lineageId;
    if (tag.state) el.dataset.tagState = tag.state;
    setElementAttribute(el, "role", "button");
    setElementAttribute(el, "tabindex", "0");
    el.addEventListener("click", (event) => {
      if (event?.stopPropagation) event.stopPropagation();
      showSemanticTagInfo(currentSemanticTags[index]);
    });
    el.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.code === "Enter" || event.key === " " || event.code === "Space") {
        if (event.preventDefault) event.preventDefault();
        showSemanticTagInfo(currentSemanticTags[index]);
      }
    });
    el.style.left = `${(tag.x / Math.max(1, WIDTH - 1)) * 100}%`;
    el.style.top = `${(tag.y / Math.max(1, HEIGHT - 1)) * 100}%`;
    macroOverlayEl.appendChild(el);
  });
}

// rendering
function renderWorld() {
  const selectedViewMode = viewModeSelect?.value || "cell";
  const player = ensurePlayerObserver(world, worldPOIs);
  if (selectedViewMode === "explore" && !player.isSleeping) {
    renderExploreWorld();
    return;
  }
  ensureGridSize(WIDTH, HEIGHT);
  const cells = gridEl.children;
  const viewMode = selectedViewMode === "substrateMacro" ? "substrateMacro" : selectedViewMode === "macro" ? "macro" : "cell";
  const sleepView = selectedViewMode === "explore" && player.isSleeping;
  const effectiveViewMode = sleepView ? "macro" : viewMode;
  const usesMacroMasks = effectiveViewMode === "macro" || effectiveViewMode === "substrateMacro";
  if (gridEl.classList) {
    gridEl.classList.toggle("macro-view", usesMacroMasks);
    gridEl.classList.toggle("substrate-view", effectiveViewMode === "substrateMacro");
    gridEl.classList.toggle("explore-view", false);
  }
  const macroMasks = usesMacroMasks ? buildMacroDisplayMasks(macroDisplayWorld || world, effectiveViewMode) : null;
  if (cells.length > 0 && !("classList" in cells[0])) {
    return;
  }
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const cell = world[y][x];
      const el = cells[y * WIDTH + x];
      const unit = cell.unit || "";
      const macroClass = macroMasks ? macroMasks.cellClasses[y][x] : "";
      const substrateClass = effectiveViewMode === "substrateMacro" ? ` ${regionBiasClass(cell.regionBias)}` : "";
      const screenClass = effectiveViewMode === "substrateMacro" ? screenCellBoundaryClass(x, y) : "";
      const riverClass = isRiverCell(x, y) ? " map-river" : "";
      const nextClassName = `cell ${terrainClass(cell.terrain)} ${fertilityClass(cell.fertility)}${riverClass}${substrateClass}${screenClass}${macroClass ? ` ${macroClass}` : ""}`;
      if (el.dataset.worldX !== String(x)) el.dataset.worldX = String(x);
      if (el.dataset.worldY !== String(y)) el.dataset.worldY = String(y);
      if (el.dataset.terrain !== cell.terrain) el.dataset.terrain = cell.terrain;
      if (el.dataset.regionBias !== (cell.regionBias || REGION_BIAS.NONE)) el.dataset.regionBias = cell.regionBias || REGION_BIAS.NONE;
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
  const poiWorld = applyPOIEffects(fertilityWorld, worldPOIs, { mutate: true });
  const riverWorld = applyRiverFertility(poiWorld);
  const decayWorld = applyTerrainDecay(riverWorld);
  updateStateDiagnostics(decayWorld, recording.isRecording);
  finalizeDiagnostics();
  lastTickEvents = currentTickEvents;
  lastTickDiagnostics = currentTickDiagnostics;
  world = decayWorld;
  tick += 1;
  const viewMode = viewModeSelect?.value || "cell";
  const usesMacroView = viewMode === "macro" || viewMode === "substrateMacro" || (viewMode === "explore" && ensurePlayerObserver().isSleeping);
  const shouldTrackMacroNow = recording.isRecording || macroTimeline.isRecording || usesMacroView;
  if (shouldTrackMacroNow) pushMacroRecentFrame(lastTickEvents, lastTickDiagnostics);
  const shouldUpdateMacroNow = shouldTrackMacroNow;
  if (shouldUpdateMacroNow && tick % MACRO_ANALYSIS_INTERVAL === 0) analyzeMacroWorldNow();
  if ((usesMacroView || macroTimeline.isRecording || recording.isRecording) && tick % MACRO_DISPLAY_INTERVAL === 0) {
    refreshMacroDisplayFrame({ force: true, mode: viewMode === "explore" ? "macro" : viewMode });
  }
  const canRenderGrid = hasRenderableGrid();
  if (canRenderGrid) {
    renderWorld();
    updateStats();
  }
  if (recording.isRecording) recordFrame(lastTickEvents, lastTickDiagnostics);
  if (macroTimeline.isRecording) recordMacroTimelineFrame({ mode: viewMode });
  updateExploreSleepAfterStep();
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
  stopExploreSleepTimer();
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
  updatePerformanceStatus();
}

function start() {
  if (timerId !== null) return;
  stopExploreSleepTimer();
  playing = true;
  playPauseBtn.textContent = "Pause";
  timerId = setInterval(runStepSafely, getTickSpeedMs());
  updatePerformanceStatus();
}

function resetWorld(nextWorld) {
  stop();
  hideSemanticTagInfo();
  tick = 0;
  currentRegionalSubstrate = nextWorld.regionalSubstrate ? cloneRegionalSubstrateLayout(nextWorld.regionalSubstrate) : currentRegionalSubstrate;
  world = cloneWorld(nextWorld);
  worldPOIs = clonePOIs(nextWorld.pointsOfInterest || []);
  activeMapSeed = normalizeMapSeed(nextWorld.mapSeed || activeMapSeed || createDefaultMapSeed());
  mapFeatures = cloneMapFeatures(nextWorld.mapFeatures || { rivers: activeMapSeed.rivers || [] });
  placeMemory = createEmptyPlaceMemory();
  currentSleepObservation = null;
  sleepTicksRemaining = 0;
  playerObserver = createPlayerObserver(world, worldPOIs);
  interventionLog = [];
  currentTickEvents = createEmptyEvents();
  lastTickEvents = createEmptyEvents();
  currentTickDiagnostics = createEmptyDiagnostics();
  lastTickDiagnostics = createEmptyDiagnostics();
  resetMacroWorld();
  pushMacroRecentFrame(lastTickEvents, lastTickDiagnostics);
  analyzeMacroWorldNow();
  refreshMacroDisplayFrame({ force: true, mode: viewModeSelect?.value || "macro" });
  renderWorld();
  updateStats();
  refreshMapSeedTextarea();
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
  currentInitialWorld = cloneWorld(nextWorld, { includeMetadata: true });
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
if (inspectCurrentPlacesBtn) inspectCurrentPlacesBtn.addEventListener("click", () => inspectCurrentTickPlaces());
exportProtoCultureSummaryBtn.addEventListener("click", exportProtoCultureSummaryJson);
clearRecordingBtn.addEventListener("click", clearRecording);
if (exportMapSeedBtn) exportMapSeedBtn.addEventListener("click", exportMapSeedJson);
if (importMapSeedBtn) importMapSeedBtn.addEventListener("click", () => {
  if (mapSeedJsonEl) mapSeedJsonEl.value = serializeMapSeed(activeMapSeed || createDefaultMapSeed());
  showStatus("Map seed JSON loaded into editor.");
});
if (applyMapSeedBtn) applyMapSeedBtn.addEventListener("click", applyMapSeedFromTextarea);
if (resetFromMapSeedBtn) resetFromMapSeedBtn.addEventListener("click", resetFromMapSeed);
if (generateMapSeedPresetBtn) generateMapSeedPresetBtn.addEventListener("click", generateRandomMapSeedPreset);
if (clearMapSeedBtn) clearMapSeedBtn.addEventListener("click", clearMapSeed);
startMacroTimelineBtn.addEventListener("click", startMacroTimeline);
stopMacroTimelineBtn.addEventListener("click", stopMacroTimeline);
exportMacroTimelineBtn.addEventListener("click", exportMacroTimelineJson);
clearMacroTimelineBtn.addEventListener("click", clearMacroTimeline);
if (macroOverlayToggle) macroOverlayToggle.addEventListener("change", renderMacroOverlay);
if (lineageToggle) {
  lineageToggle.addEventListener("change", () => {
    macroDisplayMaskCache = { source: null, macroTick: null, populationSerial: null, memorySerial: null, lineageSerial: null, politySerial: null, lineageVisible: null, mode: null, masks: null };
    updateHumanLineageStatus();
    renderWorld();
  });
}
if (viewModeSelect) {
  viewModeSelect.addEventListener("change", () => {
    const mode = viewModeSelect.value;
    ensurePlayerObserver(world, worldPOIs);
    if (mode === "macro" || mode === "substrateMacro" || mode === "explore") analyzeMacroWorldNow();
    if (mode === "macro" || mode === "substrateMacro" || mode === "explore") refreshMacroDisplayFrame({ force: true, mode: mode === "explore" ? "macro" : mode });
    if (mode === "explore") showStatus("Explore: WASD move, Space inspect, E sleep/wake");
    updatePerformanceStatus();
    renderWorld();
  });
}
if (document.addEventListener) {
  document.addEventListener("pointerup", stopMapSeedPointerPainting);
  document.addEventListener("pointercancel", stopMapSeedPointerPainting);
  document.addEventListener("pointerleave", stopMapSeedPointerPainting);
  document.addEventListener("keydown", (event) => {
    const exploreMode = viewModeSelect?.value === "explore";
    if (exploreMode && (event.key === "e" || event.key === "E" || event.code === "KeyE")) {
      if (event.preventDefault) event.preventDefault();
      toggleExploreSleep();
      return;
    }
    if (exploreMode && ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight"].includes(event.code)) {
      if (event.preventDefault) event.preventDefault();
      explorePressedKeys.add(event.code);
      startExploreAnimationLoop();
      return;
    }
    if (event.code === "Space") {
      if (event.preventDefault) event.preventDefault();
      if (exploreMode) {
        inspectNearbyExploreTrace();
        return;
      }
      if (playing) stop();
      else start();
    }
    if (event.code === "Escape" || event.key === "Escape") {
      hideSemanticTagInfo();
      stop();
    }
  });
  document.addEventListener("keyup", (event) => {
    if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight"].includes(event.code)) {
      explorePressedKeys.delete(event.code);
      if (!hasExploreMovementInput()) stopExploreAnimationLoop();
    }
  });
}

buildGrid();
activeMapSeed = createDefaultMapSeed();
refreshMapSeedTextarea();
applyInitialSettings({ statusPrefix: "" });
refreshMapSeedTextarea();
updateRecordingStatus();
updateMacroTimelineStatus();

window.__triSpeciesSim = {
  TERRAIN,
  UNIT,
  REGION_BIAS,
  POI_TYPES,
  POI_EFFECTS,
  SEMANTIC_TRAITS,
  PLACE_ARCHETYPES,
  PROTO_CULTURE_HINTS,
  EXPLORE_CONFIG: {
    cols: EXPLORE_VIEWPORT_COLS,
    rows: EXPLORE_VIEWPORT_ROWS,
    interactRange: EXPLORE_INTERACT_RANGE,
    playerSpeed: EXPLORE_PLAYER_SPEED_CELLS_PER_SECOND,
    playerRadius: EXPLORE_PLAYER_RADIUS,
    sleepTicksPerRest: EXPLORE_SLEEP_TICKS_PER_REST,
  },
  createDefaultWorld,
  randomizeWorld,
  createInitialWorld,
  createInitialPOIs,
  getInitialSettings,
  applyInitialSettings,
  resetToCurrentInitialWorld,
  applyPresetToInputs,
  cloneWorld,
  createCell,
  createPlayerObserverForTest(source = world, pois = worldPOIs) {
    return JSON.parse(JSON.stringify(createPlayerObserver(source, pois)));
  },
  createDefaultMapSeedForTest() {
    return JSON.parse(JSON.stringify(createDefaultMapSeed()));
  },
  getActiveMapSeedForTest() {
    return JSON.parse(JSON.stringify(normalizeMapSeed(activeMapSeed || createDefaultMapSeed())));
  },
  getWorldForTest() {
    return cloneWorld(world, { includeMetadata: true });
  },
  serializeMapSeedForTest(seed = activeMapSeed || createDefaultMapSeed()) {
    return serializeMapSeed(seed);
  },
  parseMapSeedForTest(text) {
    return JSON.parse(JSON.stringify(parseMapSeedJson(text)));
  },
  applyMapSeedToWorldForTest(seed, options = {}) {
    const next = applyMapSeedToWorld(seed, { ...options, setAsCurrent: options.setAsCurrent !== false });
    return cloneWorld(next, { includeMetadata: true });
  },
  paintMapSeedBrushForTest(x, y, brush) {
    const result = applyMapSeedBrush(x, y, brush);
    return result ? JSON.parse(JSON.stringify(result)) : result;
  },
  clearMapSeedForTest() {
    return JSON.parse(JSON.stringify(clearMapSeed()));
  },
  generateRandomMapSeedPresetForTest() {
    return JSON.parse(JSON.stringify(generateRandomMapSeedPreset()));
  },
  cellWorldPositionFromElementForTest(cellEl, fallbackIndex) {
    return cellWorldPositionFromElement(cellEl, fallbackIndex);
  },
  handleGridCellClickForTest(index, cellEl = null) {
    return handleGridCellClick(index, cellEl);
  },
  paintMapSeedDragSequenceForTest(points, brush) {
    let painted = 0;
    lastPaintedSeedCellKey = null;
    mapSeedPointerPainting = isDraggableMapSeedBrush(brush);
    for (const point of points || []) {
      const result = paintMapSeedCellFromElement(point.y * WIDTH + point.x, { dataset: { worldX: String(point.x), worldY: String(point.y) } }, brush);
      if (result?.painted) painted += 1;
    }
    stopMapSeedPointerPainting();
    return painted;
  },
  getMapFeaturesForTest() {
    return JSON.parse(JSON.stringify(cloneMapFeatures()));
  },
  applyRiverFertilityForTest(source, rivers = mapFeatures.rivers, options = {}) {
    return applyRiverFertility(source, rivers, options);
  },
  isValidHumanVillageCellForTest(source = world, x, y) {
    return isValidHumanVillageCell(source, x, y);
  },
  updateHumanVillagesForTest(source = world, mode = "macro") {
    updateHumanVillages(source, mode);
    return JSON.parse(JSON.stringify(humanPolityMemory.villages || []));
  },
  getPlaceMemoryForTest() {
    return JSON.parse(JSON.stringify(placeMemory));
  },
  setPlaceMemoryForTest(nextMemory) {
    placeMemory = {
      ...createEmptyPlaceMemory(),
      ...JSON.parse(JSON.stringify(nextMemory || {})),
    };
    return JSON.parse(JSON.stringify(placeMemory));
  },
  completeSleepObservationForTest(observation, source = world) {
    currentSleepObservation = JSON.parse(JSON.stringify(observation || {
      startedAtTick: tick,
      anchorIds: placeMemory.awakeCycleInspectedAnchorIds.slice(),
      beforeSnapshots: {},
    }));
    return JSON.parse(JSON.stringify(completeSleepObservation(source)));
  },
  inspectPlaceTargetForTest(target, source = world) {
    const mutableTarget = target ? JSON.parse(JSON.stringify(target)) : null;
    const anchor = inspectPlaceTarget(mutableTarget, source);
    return anchor ? JSON.parse(JSON.stringify(anchor)) : null;
  },
  snapshotPlaceForTest(anchorOrTarget, source = world) {
    return JSON.parse(JSON.stringify(snapshotPlace(anchorOrTarget, source)));
  },
  computePlaceChangeForTest(anchor, previousSnapshot, currentSnapshot) {
    return JSON.parse(JSON.stringify(computePlaceChange(anchor, previousSnapshot, currentSnapshot)));
  },
  deriveSemanticTraitsForTest(snapshot, anchorOrTarget = null) {
    return JSON.parse(JSON.stringify(deriveSemanticTraits(snapshot, anchorOrTarget)));
  },
  derivePlaceArchetypeForTest(snapshot, semanticTraits = [], anchorOrTarget = null) {
    return JSON.parse(JSON.stringify(derivePlaceArchetype(snapshot, semanticTraits, anchorOrTarget)));
  },
  derivePlaceInterpretationHintsForTest(snapshot, semanticTraits = [], placeArchetype = PLACE_ARCHETYPES.ORDINARY_PLACE) {
    return JSON.parse(JSON.stringify(derivePlaceInterpretationHints(snapshot, semanticTraits, placeArchetype)));
  },
  deriveProtoCultureHintsForTest(snapshot, semanticTraits = snapshot?.semanticTraits || [], placeArchetype = snapshot?.placeArchetype || PLACE_ARCHETYPES.ORDINARY_PLACE, target = null) {
    return JSON.parse(JSON.stringify(deriveProtoCultureHints(snapshot, semanticTraits, placeArchetype, target)));
  },
  updateProtoCultureMemoryForTest(memory, protoCultureHints = [], currentTick = tick) {
    return JSON.parse(JSON.stringify(updateProtoCultureMemory(memory, protoCultureHints, currentTick)));
  },
  summarizeProtoCultureForPlaceMemoryForTest(memory) {
    return JSON.parse(JSON.stringify(summarizeProtoCultureForPlaceMemory(memory)));
  },
  createProtoCultureSummaryExport,
  exportProtoCultureSummaryJson,
  inspectCurrentTickPlacesForTest: inspectCurrentTickPlaces,
  collectCurrentPlaceReviewTargetsForTest(source = world) {
    return JSON.parse(JSON.stringify(collectCurrentPlaceReviewTargets(source)));
  },
  runProtoCultureSummaryAuditForSeedsForTest,
  getLastWakeReportForTest() {
    const report = placeMemory.wakeReports[placeMemory.wakeReports.length - 1] || null;
    return report ? JSON.parse(JSON.stringify(report)) : null;
  },
  getPlayerObserverForTest() {
    return JSON.parse(JSON.stringify(ensurePlayerObserver(world, worldPOIs)));
  },
  setPlayerObserverForTest(nextPlayer) {
    playerObserver = { ...createDefaultPlayerObserver(), ...JSON.parse(JSON.stringify(nextPlayer || {})) };
    return JSON.parse(JSON.stringify(playerObserver));
  },
  isExploreCellPassableForTest(source = world, x, y, pois = worldPOIs) {
    return isExploreCellPassable(source, x, y, pois);
  },
  getExploreCellBlockerReasonForTest(source = world, x, y, pois = worldPOIs) {
    return getExploreCellBlockerReason(source, x, y, pois);
  },
  movePlayerObserverForTest(dx, dy, source = world, pois = worldPOIs) {
    return JSON.parse(JSON.stringify(movePlayerObserver(dx, dy, source, pois)));
  },
  updatePlayerObserverContinuousForTest(deltaSeconds, input = {}, source = world, pois = worldPOIs) {
    return JSON.parse(JSON.stringify(updatePlayerObserverContinuous(deltaSeconds, input, source, pois)));
  },
  getExploreViewportCellsForTest(player = ensurePlayerObserver(), source = world) {
    return JSON.parse(JSON.stringify(getExploreViewportCells(player, source)));
  },
  getExploreViewportRenderModelForTest(player = ensurePlayerObserver(), source = world) {
    return JSON.parse(JSON.stringify(getExploreViewportRenderModel(player, source)));
  },
  findExploreInteractionTargetForTest(source = world, tags = createSemanticTags(source, { mode: "macro" }), pois = worldPOIs) {
    const target = findExploreInteractionTarget(source, tags, pois);
    return target ? JSON.parse(JSON.stringify(target)) : null;
  },
  toggleExploreSleepForTest() {
    return JSON.parse(JSON.stringify(toggleExploreSleep()));
  },
  enterExploreSleepForTest(options = {}) {
    return JSON.parse(JSON.stringify(enterExploreSleep(options)));
  },
  runExploreSleepStepForTest() {
    runStepSafely();
    return tick;
  },
  wakeExploreSleepForTest() {
    return JSON.parse(JSON.stringify(wakeExploreSleep()));
  },
  getExploreSleepStateForTest() {
    return { sleepTimerActive: sleepTimerId !== null, sleepWasPlayingBefore, playing, tick, isSleeping: Boolean(playerObserver?.isSleeping), sleepTicksRemaining };
  },
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
  applyPOIEffects,
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
  startMacroTimeline,
  stopMacroTimeline,
  clearMacroTimeline,
  recordMacroTimelineFrame,
  createMacroTimelineExport,
  exportMacroTimelineJson,
  downloadJson,
  createEmptyMacroWorld,
  analyzeMacroWorldNow,
  ensureMacroAnalysis,
  macroSummary,
  buildMacroDisplayMasks,
  createSemanticTags,
  formatSemanticTagInfo,
  buildPopulationEvolutionShapes,
  buildPopulationEvolutionDisplayMasks,
  MACRO_MEMORY_CONFIG: {
    version: MACRO_MEMORY_VERSION,
    decay: MACRO_MEMORY_DECAY,
    terrainGain: MACRO_MEMORY_TERRAIN_GAIN,
    shapeBodyGain: MACRO_MEMORY_SHAPE_BODY_GAIN,
    shapeCoreGain: MACRO_MEMORY_SHAPE_CORE_GAIN,
    poiGain: MACRO_MEMORY_POI_GAIN,
    conflictGain: MACRO_MEMORY_CONFLICT_GAIN,
    faintThreshold: MACRO_MEMORY_FAINT_THRESHOLD,
    strongThreshold: MACRO_MEMORY_STRONG_THRESHOLD,
  },
  updateMacroMemoryForTest(source = world, options = {}) {
    if (source.pointsOfInterest) worldPOIs = clonePOIs(source.pointsOfInterest);
    return JSON.parse(JSON.stringify(updateMacroMemory(source, { force: options.force !== false, mode: options.mode || "macro" })));
  },
  getMacroMemoryForTest() {
    return JSON.parse(JSON.stringify(macroMemory));
  },
  HUMAN_LINEAGE_CONFIG: {
    version: HUMAN_LINEAGE_VERSION,
    maxPath: HUMAN_LINEAGE_MAX_PATH,
    maxAreaHistory: HUMAN_LINEAGE_MAX_AREA_HISTORY,
    maxActiveCells: HUMAN_LINEAGE_MAX_ACTIVE_CELLS,
    maxMemoryCells: HUMAN_LINEAGE_MAX_MEMORY_CELLS,
    maxEvents: HUMAN_LINEAGE_MAX_EVENTS,
  },
  updateHumanLineageMemoryForTest(source = world, options = {}) {
    return JSON.parse(JSON.stringify(updateHumanLineageMemory(source, { force: options.force !== false, mode: options.mode || "macro" })));
  },
  getHumanLineageMemoryForTest() {
    return JSON.parse(JSON.stringify(humanLineageMemory));
  },
  setHumanLineageMemoryForTest(nextMemory) {
    humanLineageMemory = {
      ...createEmptyHumanLineageMemory(),
      ...JSON.parse(JSON.stringify(nextMemory || {})),
    };
    humanLineageSerial += 1;
    return JSON.parse(JSON.stringify(humanLineageMemory));
  },
  createHumanLineageSummaryForTest() {
    return JSON.parse(JSON.stringify(createHumanLineageSummary()));
  },
  updateHumanPolityMemoryForTest(source = world, options = {}) {
    return JSON.parse(JSON.stringify(updateHumanPolityMemory(source, { force: options.force !== false, mode: options.mode || "macro" })));
  },
  getHumanPolityMemoryForTest() {
    return JSON.parse(JSON.stringify(humanPolityMemory));
  },
  setHumanPolityMemoryForTest(nextMemory) {
    humanPolityMemory = {
      ...createEmptyHumanPolityMemory(),
      ...JSON.parse(JSON.stringify(nextMemory || {})),
    };
    humanPolitySerial += 1;
    return JSON.parse(JSON.stringify(humanPolityMemory));
  },
  createHumanPolitySummaryForTest() {
    return JSON.parse(JSON.stringify(createHumanPolitySummary()));
  },
  validateHumanPolityOwnershipForTest(source = macroDisplayWorld || world) {
    return JSON.parse(JSON.stringify(validateHumanPolityOwnership(source)));
  },
  updateHumanLineageStatusForTest() {
    updateHumanLineageStatus();
    return {
      total: lineageTotalEl?.textContent || "",
      active: lineageActiveEl?.textContent || "",
      collapsed: lineageCollapsedEl?.textContent || "",
      descendants: lineageDescendantsEl?.textContent || "",
      dominant: lineageDominantEl?.textContent || "",
      recentEvent: lineageRecentEventEl?.textContent || "",
    };
  },
  getMacroDisplayFrameForTest() {
    return JSON.parse(JSON.stringify(macroDisplayFrame || refreshMacroDisplayFrame({ force: true })));
  },
  createMacroDisplayFrameForTest(source = world, mode = "macro") {
    return JSON.parse(JSON.stringify(createMacroDisplayFrame(source, mode)));
  },
  getSemanticTagsForTest(source = macroDisplayWorld || world, options = {}) {
    if (source.pointsOfInterest) worldPOIs = clonePOIs(source.pointsOfInterest);
    return JSON.parse(JSON.stringify(createSemanticTags(source, { mode: options.mode || "macro", pois: worldPOIs })));
  },
  renderMacroOverlayForTest() {
    renderMacroOverlay();
    return true;
  },
  getPopulationEvolutionFrameForTest() {
    return JSON.parse(JSON.stringify(populationEvolutionFrame || refreshPopulationEvolutionFrame({ force: true, mode: viewModeSelect?.value || "macro" })));
  },
  refreshPopulationEvolutionFrameForTest(source = world, options = {}) {
    return JSON.parse(JSON.stringify(refreshPopulationEvolutionFrame({ source, mode: options.mode || "macro", force: true })));
  },
  getMacroRecentFramesForTest() {
    return macroRecentFrames.map((frame) => JSON.parse(JSON.stringify(frame)));
  },
  getMacroDisplayWorldForTest() {
    return macroDisplayWorld || world;
  },
  getWorldPOIsForTest() {
    return JSON.parse(JSON.stringify(worldPOIs));
  },
  applyPOIEffectsForTest(source, pois, options = {}) {
    return applyPOIEffects(source, pois, options);
  },
  applyTerrainRewriteForTest(source, pois = worldPOIs) {
    return applyTerrainRewrite(source, pois);
  },
  isPOIHardBlockerForTest(x, y, pois = worldPOIs) {
    return isPOIHardBlocker(x, y, pois);
  },
  isCellBlockedForMovementForTest(source, x, y, pois = worldPOIs) {
    return isCellBlockedForMovement(source, x, y, pois);
  },
  countRegionBias,
  reachableCellsInRadius,
  countReachableUnitInRadius,
  countReachableTerrainInRadius,
  findReachableNearestRot,
  findSettlerTarget,
  placeInterventionUnit,
};
