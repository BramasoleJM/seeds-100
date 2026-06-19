# Human Identity States

Human identity is observer-only. It interprets Human population shapes and memory without changing H/B/S movement, conflict, reproduction, terrain rewrite, fertility, POI behavior, or decay.

## Lineage States

Current lineages live in `humanLineageMemory.lineages`.
Common states include active and collapsed. Lineages keep origin, centroid, path, active cells, memory cells, currentSeat, seatHistory, descendants, and events.
Lineage ancestry uses `parentId`, `rootLineageId`, `lineageAncestryIds`, `rootAncestorId`, and capped seat ancestry in summaries.
Simplification: lineage continuity is spatial and heuristic.

## Polity States

Human polities live in `humanPolityMemory.polities`.
States include active, pressured, seatless, declining, and collapsed.
Polities keep root lineage, lineage ids, currentSeat, oldSeats, outpost ids, village ids, split ancestry, color index, and recent events.
Split and inheritance use fields such as `splitFromPolityId`, `polityAncestryIds`, `rootPolityId`, `splitDepth`, and `splitKey`.
Simplification: polity is not a civilization, AI, faction, or resource system.

## Seat / Old Seat / Pressured Seat

Current seats are observer anchors owned by active non-collapsed polities.
Old seats are compact historical records retained after movement, pressure, stale ownership, or collapse.
Pressured seats are current seats whose state or local conditions indicate pressure.
Ownership invariant: collapsed polities must not own current seats or current Human tags.
Simplification: a seat is not a building and has no gameplay action.

## Outpost States

Human outposts live in `humanLineageMemory.humanOutposts`.
States include active, promotable, fading, and promoted-to-seat references.
Outposts can support remote Human domain interpretation and may become a polity seat only through observer memory rules already present.
Simplification: outpost is a compact marker, not a building.

## Village States

Human villages live in `humanPolityMemory.villages`.
States include active, pressured/inherited where applicable, fading, and remnant.
Villages reuse nearby prior ids, keep `memorySeed`, and preserve first/last seen ticks.
River guard: active villages cannot be created, reused, or preserved on river cells.
Simplification: village is an observer marker, not a population economy.

## Remnant Behavior

Remnants are compact Human memory left by collapsed or lost places when enough local support remains.
They may keep previous polity and lineage references.
Current collapsed polity tags are filtered; remnant tags are historical.
Simplification: remnant memory can fade and is capped for display clarity.

## Ownership Invariants

Collapsed polity current seat count should be zero.
Current semantic tags owned by collapsed polities should be zero.
Duplicate authoritative current seat owners are repaired.
Lineage-source seats must be backed by active lineage currentSeat.
Outpost-source seats must be backed by a valid owned outpost.

## V0.14A Relation

Place Memory snapshots read Human identity into `humanMemory`.
Semantic traits derive `human_settled`, `human_seat`, `human_old_seat`, `human_outpost`, `human_remnant`, `human_domain`, `polity_owned`, `lineage_continuity`, `split_polity`, `seatless_polity`, and `pressured_polity`.
These traits do not feed back into Human identity detection.

## V0.14B Relation

Proto-culture hints may read Human identity snapshots as observer-only interpretation input.

They must not affect lineage, polity, village, outpost, seat, old seat, remnant, or ownership detection. Remembered Human identity may contribute to memory-oriented hints, but it must not create current ownership.
