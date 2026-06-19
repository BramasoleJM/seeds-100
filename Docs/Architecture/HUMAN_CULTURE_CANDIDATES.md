# Human Culture Candidates

V0.14C adds observer-only Human culture candidate summaries.

This is not a civilization module. It does not add civilization gameplay, unlocks, factions, AI, resources, buildings, NPCs, quests, story events, myth events, tarot mechanics, terrain, units, save/load, network calls, or a multi-screen map.

## Scope

`humanCultureCandidateSummary` rolls up place-level `protoCultureMemory` and current / remembered Human identity into compact Human polity and lineage candidate signals.

Only Human polity or Human lineage owners can own candidate signals.

Context places can support evidence, but cannot own candidates:

```text
POIs
scars
rivers
springs
forests
Beast ranges
ordinary places
```

## Statuses

Only these statuses exist:

```text
emerging
candidate
```

There is no ripe, unlocked, active civilization, or gameplay effect status.

## Export Shape

Exports may include:

```js
humanCultureCandidateSummary: {
  version: "0.14C",
  totalPolities: 0,
  totalLineages: 0,
  politiesWithCandidates: 0,
  lineagesWithCandidates: 0,
  candidateTypeCounts: {},
  byPolity: [],
  byLineage: [],
  contextOnlySignals: []
}
```

The summary is derived at export / review time. It is not live mutable simulation state and must not feed back into proto-culture scoring, Human identity, ecology, movement, terrain, fertility, POI behavior, river blockers, Explore movement, tick order, or wake report visibility.

## Candidate Types

V0.14C allows only:

```text
river_bound_polity
memory_bound_lineage
monument_centered_polity
forest_edge_polity
frontier_outpost_polity
split_lineage_polity
```

These are audit signals for future review only.

## Owner Resolution

Candidate signals can be owned only by Human polity or Human lineage ids already present in existing observer memory.

The resolver reads, in priority order:

```text
current snapshot Human polity id
current snapshot Human lineage id
snapshot remembered Human polity / lineage id
anchor remembered Human polity / lineage id
clear Human village / outpost source references
clear Human polity / lineage source ids
```

It must not invent ids. If no Human owner can be resolved, the anchor cannot own a candidate.

## Evidence Roles

Subject evidence can create a Human owner candidate only when it resolves to a Human polity or lineage:

```text
seat
village
domain
outpost
old_seat
remnant
```

Context evidence can support an existing Human owner candidate but cannot own one:

```text
poi
scar
beast_range
river
ordinary_place
```

Human-looking anchors without a resolved owner are kept in `contextOnlySignals` for audit visibility, but they do not provide context bonus to another owner.

## Scoring

Scoring is deterministic and compact.

The helper reads the top Human subject scores from the candidate type's allowed proto-culture hints, then applies small bonuses:

```text
coverage bonus for multiple Human subject anchors
stable bonus for at least one stable Human subject signal
context bonus from valid context anchors only when subject evidence exists
```

Status thresholds:

```text
emerging: score >= 0.35 and at least 1 Human subject evidence anchor
candidate: score >= 0.65, at least 2 Human subject evidence anchors, and at least 1 stable Human subject signal
```

Context-only evidence never creates `emerging` or `candidate`.

## Export Integration

`humanCultureCandidateSummary` is included in:

```text
snapshot.placeMemory
recording.placeMemory
lightweight proto-culture summary export placeMemory
current tick place review placeMemory
multi-seed proto-culture audit runs and aggregate candidate totals
```

The object stays compact: owner summaries, candidate signals, evidence anchor ids, aggregate counts, and context-only audit signals. It does not include full anchors, full snapshots, frames, terrain rows, or unit rows.

## Future Path

Future civilization modules may read these summaries as candidate gate input, but V0.14C itself does not unlock or activate any civilization variant.

The system may say:

```text
This Human polity is becoming a river-bound candidate.
```

It must not say:

```text
This Human polity has unlocked River Civilization.
```
