# CODEX V0.11.6 Human Polity / Village Layer Task

## Summary

Implement V0.11.6 as an observer-only Human polity and village interpretation layer.

V0.11.5 introduced stricter Human seats and `H outpost`, which improved the feeling of Human civilization structure. However, the user observed that when one seat dies and another appears far away, the transition can feel abrupt unless the system explains whether this is:

```text
the same Human group relocating,
or a different / related Human group rising elsewhere.
```

This task introduces:

```text
Human polity = a macro-level Human faction / state / people-group identity.
H village = short-lived local Human settlement marker inside a domain / polity.
```

Both are observer-only. They do not affect simulation behavior.

Update the rules/version label to:

```text
TRI_SPECIES_WORLD_SIM_V0.11.6_HUMAN_POLITY_VILLAGE_LAYER
```

## Scope

Do not change core simulation rules:

- movement;
- lifecycle;
- conflict;
- conversion;
- terrain rewrite;
- reproduction;
- fertility;
- POI effects;
- terrain decay;
- counter-cycle rules.

Do not add:

- new species;
- new terrain;
- actual buildings;
- NPCs;
- quests;
- resource economy;
- save/load;
- external dependencies;
- multi-screen maps.

`Human polity`, `H village`, and polity ownership are interpretation / visualization / export concepts only.

## Current Problems

### 1. Seat Replacement Can Feel Like Teleportation

Example observed from a run:

```text
Human lineage A has a seat on the right.
That seat dies.
A new seat appears elsewhere.
```

The user cannot tell whether this means:

```text
same group migrated,
related branch inherited continuity,
or a separate Human group rose independently.
```

### 2. Seat Under Rot Pressure Needs Story State

A seat may survive a long time near / under purple pressure because support is high enough.

This can be a good story:

```text
a pressured / besieged Human capital
```

But the display currently looks like a normal `H seat`, so it reads as a bug.

### 3. Human Domain Needs Smaller Settlement Markers

Large bright Human regions can contain smaller local settlement points.

The user proposed:

```text
Village = local Human village marker generated from bright Human regions.
Village has no inheritance, but knows which Human group / polity it belongs to.
```

This is a good middle layer between:

```text
H domain
H outpost
H seat
```

## Concept Definitions

### Human Polity

A Human polity is an observer-only macro identity grouping Human lineage / seat / villages / outposts.

It is not a new unit, terrain, building, or gameplay actor.

It answers:

```text
Which Human group does this seat / village / outpost belong to?
```

Recommended neutral labels:

```text
Polity 1
Polity 2
Polity 3
```

Do not invent lore names.

### H Seat

A stable center of a polity.

Each active polity may have:

```text
0 or 1 current seat
```

If a polity has no current seat, it may be:

```text
seatless
declining
collapsed
```

### H Outpost

A distant Human domain associated with a polity, but not yet a polity seat.

An outpost may later:

```text
remain outpost
fade
promote to seat for its polity
split into a new polity if separation conditions are met
```

### H Village

A short-lived local settlement marker.

Village has no long-term inheritance and does not become a lineage by itself.

It is regenerated / refreshed from current Human macro shapes each macro update.

It should know:

```text
which polity it belongs to
which domain / shape it came from
```

## Human Polity Data Model

Add observer-only state:

```js
humanPolityMemory = {
  version: "0.11.6",
  tick,
  nextId,
  polities: [
    {
      id,
      createdTick,
      state,
      rootLineageId,
      lineageIds,
      currentSeat,
      oldSeats,
      outpostIds,
      villageIds,
      colorIndex,
      recentEvents
    }
  ],
  villages: [
    {
      id,
      polityId,
      lineageId,
      x,
      y,
      firstSeenTick,
      lastSeenTick,
      state,
      area,
      support,
      pressure
    }
  ],
  events: []
}
```

Keep all arrays capped.

Suggested caps:

```text
max polities: 12
max villages: 24
max events: 80
max lineageIds per polity export: 12
max oldSeats per polity export: 6
```

## Polity Creation Rules

### Root Polity

When a root Human lineage establishes a first valid seat:

```text
create a Human polity
assign lineage to polity
assign seat to polity
```

If a lineage exists before polity memory starts, create polity lazily when it first has a valid current seat.

### Inherited Polity

If a descendant lineage creates a seat near the parent / ancestor domain or after parent seat loss:

```text
assign descendant lineage to the parent polity
```

This reads as:

```text
same polity survives through descendant lineage
```

### Split / New Polity

If a descendant or outpost creates a seat while the parent polity still has a valid active seat, and it is far away / weakly connected:

```text
create a new polity
link it to parent polity as splitFromPolityId
```

Suggested split conditions:

```text
distance from parent current seat >= 12 cells
parent polity current seat is active
outpost stableSamples >= promotion threshold
domain overlap / path continuity with parent domain is low
```

Use simple deterministic heuristics. Document thresholds.

## Polity State

Each polity should expose:

```text
forming
active
pressured
seatless
declining
collapsed
split
```

Suggested meaning:

- `forming`: newly created, not enough history.
- `active`: has valid current seat and enough Human domain support.
- `pressured`: current seat exists but rot / Spirit / MARK pressure is high.
- `seatless`: no current seat, but villages/outposts/domain still exist.
- `declining`: seatless or shrinking for several macro samples.
- `collapsed`: no seat, no villages/outposts/domain for a grace period.
- `split`: optional event/state marker when a polity was created from another polity.

## Seat Pressure State

Add seat display state derived from support / pressure:

```text
active
pressured
corrupted
warned
```

Recommended:

```text
MARK on seat cell -> corrupted/warned, abandon quickly if persistent.
pressure >= 8 or pressure >= support * 0.25 -> pressured.
pressure >= support * 0.45 -> corrupted/warned.
```

Tune conservatively. The key visual goal:

```text
If a seat survives near purple pressure, show that it is pressured, not normal.
```

Semantic tag labels can be:

```text
H seat
H pressured seat
H old seat
```

Avoid too many labels if it clutters the map.

## Village Detection

Generate villages from current Human macro shapes / domains.

Village candidates:

```text
shape.type === human
candidate cell is FIELD
candidate cell is inside Human domain core/body/edge
nearby Human/FIELD support is enough
not MARK / BLOCK / BORDER
not POI hard blocker
not too close to H seat
not too close to another village
```

Suggested first-pass thresholds:

```text
min local support: 8
min distance from H seat: 3 cells
min distance between villages: 5 cells
max villages per polity: 3
max total visible villages: 8
```

Placement:

```text
pick representative FIELD cells with high support and low pressure
prefer cells inside the assigned polity domain
```

Village state:

```text
active
pressured
fading
```

Villages should be short-lived:

```text
If the candidate disappears, mark fading for a short grace window, then remove.
Do not create long-term village inheritance.
```

## Village Polity Assignment

Assign a village to a polity using this order:

1. If village is inside / near a lineage domain whose lineage already belongs to a polity, use that polity.
2. Else assign to nearest active polity seat within a reasonable distance.
3. Else assign to nearest active outpost's polity.
4. Else leave unassigned and do not display by default.

Suggested distance:

```text
nearest seat within 12 cells
nearest outpost within 8 cells
```

If multiple polities compete:

```text
prefer same lineage/domain
then nearest seat
then higher polity support
```

## Outpost / Seat Promotion With Polity

Extend V0.11.5 outpost promotion rules:

When an outpost becomes eligible for seat:

1. Determine parent polity.
2. If parent polity has no valid current seat:
   - promote outpost to new seat of same polity.
3. If parent polity has an active current seat and outpost is far / disconnected:
   - create new polity split.
4. If parent polity has pressured current seat and outpost is connected:
   - either keep as outpost or prepare relocation; choose the simpler deterministic rule.

Recommended first-pass simplification:

```text
No direct relocation while parent seat remains active.
Far mature outpost becomes new polity if parent seat is active.
Mature outpost becomes same polity seat only when parent polity is seatless / collapsed.
```

This should reduce sudden seat teleports.

## Semantic Tags

Default visible tags:

```text
H seat
H pressured seat
H old seat
H outpost
H village
H domain
major POIs
optional B range / S scar
```

Caps:

```text
H seat: max 1 per active visible polity, but cap total to 2-3
H old seat: max 1-2 from selected/dominant polity mainline
H outpost: max 2
H village: max 4-6
H domain: max 1-2
B range: max 1
S scar: max 1
```

If the map becomes too busy, lower village cap first.

Tag label options:

```text
H seat
H pressured seat
H old seat
H outpost
H village
```

Do not show polity ids directly on the map unless needed. Use status panel/export for ids.

## Status Readout

Add compact polity information to Human Lineage / status area.

Suggested fields:

```text
Human Polities
Active polities
Pressured polities
Seatless polities
Villages
Outposts
Dominant polity
Recent polity event
```

Example:

```text
Human Polity
Active 2
Villages 5
Outposts 1
Dominant human_polity_002
Recent split
```

Keep compact. Do not make the panel much longer.

## Export Requirements

Snapshot / Recording:

```text
humanPolitySummary
```

Suggested compact shape:

```js
{
  version: "0.11.6",
  tick,
  polities,
  activePolities,
  pressuredPolities,
  seatlessPolities,
  collapsedPolities,
  villages,
  activeVillages,
  dominantPolityId,
  recentEvents
}
```

Macro Timeline:

```text
macroSummary.humanPolity
```

Keep frame top-level keys stable.

Do not export full village/domain cell arrays.

Semantic tags may include `H village` and `H pressured seat`.

## Events

Add compact events:

```text
polity_founded
polity_split
polity_seat_lost
polity_seat_established
polity_pressured
polity_collapsed
village_found
village_faded
```

Emit only on state transitions or meaningful creation/loss.

Avoid event spam.

## Tests

Add:

```text
tests/v0_11_6_human_polity_village_layer.test.js
```

Cover:

1. A lineage with a valid seat creates / joins a Human polity.
2. Descendant seat near parent continuity inherits parent polity.
3. Far mature outpost with parent seat still active creates a new polity split instead of teleporting parent seat.
4. Mature outpost can become same polity seat when parent polity is seatless.
5. Seat under high pressure exposes pressured/corrupted state.
6. Village markers are generated inside Human domains on FIELD cells.
7. Villages do not appear on MARK / BLOCK / BORDER / hard POI blockers.
8. Villages know their `polityId`.
9. Village count is capped and villages do not overcrowd seats.
10. `humanPolitySummary` exports compact polities/villages.
11. `macroSummary.humanPolity` exists and remains compact.
12. Semantic tags include capped `H village` and `H pressured seat` where appropriate.
13. Existing V0.11.5 seat/outpost tests still pass or are updated if polity ownership changes expected output.

Regression run:

```text
node tests/safety.test.js
node tests/json-export.test.js
node tests/v0_10_7_population_evolution_macro_view.test.js
node tests/v0_10_7_1_macro_population_visual_primary.test.js
node tests/v0_10_9_macro_memory_slow_trace.test.js
node tests/v0_10_9_1_macro_memory_tuning.test.js
node tests/v0_11_human_lineage_memory.test.js
node tests/v0_11_1_human_lineage_visibility.test.js
node tests/v0_11_2_semantic_macro_tags.test.js
node tests/v0_11_3_human_seat_domain_anchors.test.js
node tests/v0_11_4_semantic_tag_declutter.test.js
node tests/v0_11_5_human_outpost_seat_promotion.test.js
node tests/v0_11_6_human_polity_village_layer.test.js
```

## Manual Verification

After implementation:

1. Run Macro View for 800-1000 ticks.
2. Enable Semantic Tags.
3. Confirm:
   - remote mature outposts become separate polity when parent seat still lives;
   - if old seat dies and new seat appears, status explains same polity relocation or new polity split;
   - pressured seats display pressure state rather than looking normal;
   - villages appear inside Human domains, not on corruption/blockers;
   - villages are sparse and visually secondary;
   - each village has a polity in export/status.
4. Export Recording and Macro Timeline.
5. Report:
   - active polity count;
   - dominant polity;
   - active village count;
   - active outpost count;
   - pressured seat/polity count;
   - recent polity/village events;
   - sample semantic tags.

## Expected Visual Difference

Before:

```text
A seat can disappear and another appears elsewhere with unclear meaning.
Large Human regions lack local settlement markers.
Seats under rot pressure look like normal seats.
```

After:

```text
Human civilization reads as polities:
each seat, outpost, and village belongs to a Human group.
Remote seats can be understood as new / split polities.
Villages make Human domains feel inhabited without adding gameplay mechanics.
Pressured seats visibly communicate that they are surviving under threat.
```

## Known Simplifications

Document in `README.md`:

- Human polity is observer-only, not an AI faction system.
- Villages are macro markers, not buildings.
- Villages do not inherit memory.
- Polity split / inheritance is heuristic.
- Only Human polity/village layer exists in V0.11.6.

## Executor Notes

Before editing code:

1. Read `TRI_SPECIES_WORLD_SIM_RULES.md`.
2. Inspect V0.11.5 seat/outpost implementation.
3. Inspect semantic tag generation and declutter logic.
4. Keep changes observer-only.
5. Avoid reintroducing hidden noisy tags by default.
6. Keep implementation plain HTML/CSS/JS.

After changes, report:

- files changed;
- how to run;
- which rule/doc sections were updated;
- known simplifications or deviations;
- test results;
- sample polity/village summary from a run or fixture.
