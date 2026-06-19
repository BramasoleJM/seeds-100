# Place Archetypes

V0.14A assigns one primary archetype per Place Snapshot. Archetypes are observer-only labels derived from semantic traits.

V0.14B `protoCultureHints` may read `placeArchetype` as one input signal, but V0.14B must not change archetype priority or derivation.

## Priority Order

1. `pressured_seat`
2. `haunted_remnant`
3. `old_seat`
4. `seatless_polity_center`
5. `river_village`
6. `forest_edge_settlement`
7. `frontier_outpost`
8. `contested_poi`
9. `spirit_scar`
10. `settled_village`
11. `beast_range`
12. `river_crossing`
13. `fertile_refuge`
14. `ordinary_place`

## Archetypes

`pressured_seat`
Derivation: `human_seat` plus `spirit_pressure`, `mark_corroded`, `pressured_polity`, or `beast_pressure`.
Example traits: `human_seat`, `polity_owned`, `mark_corroded`.
Player-facing label: pressured seat.
Future notes: no seat gameplay is added.

`haunted_remnant`
Derivation: `human_remnant`, `human_old_seat`, or `collapsed_memory` plus Spirit/MARK pressure.
Example traits: `human_remnant`, `collapsed_memory`, `spirit_scarred`.
Player-facing label: haunted remnant.
Future notes: memory only.

`old_seat`
Derivation: `human_old_seat`.
Example traits: `human_old_seat`, `lineage_continuity`.
Player-facing label: old seat.
Future notes: not a building.

`seatless_polity_center`
Derivation: `seatless_polity`.
Example traits: `polity_owned`, `seatless_polity`.
Player-facing label: seatless polity center.
Future notes: observer polity state only.

`river_village`
Derivation: `river_adjacent` plus `human_settled`, `human_seat`, or `human_domain`.
Example traits: `river_adjacent`, `human_settled`, `polity_owned`.
Player-facing label: river village.
Future notes: river still blocks movement; villages cannot occupy river cells.

`forest_edge_settlement`
Derivation: Human place plus `great_forest_nearby` or `beast_habitat`.
Example traits: `human_settled`, `great_forest_nearby`.
Player-facing label: forest-edge settlement.
Future notes: no new forest rules.

`frontier_outpost`
Derivation: `human_outpost` plus Beast, Spirit, or mixed pressure.
Example traits: `human_outpost`, `mixed_pressure`.
Player-facing label: frontier outpost.
Future notes: outpost remains observer-only.

`contested_poi`
Derivation: POI target or center plus strong conflict/corruption signals: mixed pressure, Spirit pressure, MARK corrosion, Spirit scarring, pressured polity, field decline around Human/Monument context, or contested/corrupted place state.
Example traits: `rot_source_nearby`, `mark_corroded`, `mixed_pressure`.
Player-facing label: contested POI.
Future notes: POI behavior is unchanged. Normal Beast habitat near Spring or Great Forest is not enough by itself.

`spirit_scar`
Derivation: `spirit_scarred` or `mark_corroded`.
Example traits: `spirit_scarred`, `mark_corroded`.
Player-facing label: spirit scar.
Future notes: no Spirit story layer.

`settled_village`
Derivation: `human_settled` plus `polity_owned` or `lineage_continuity`, when higher-priority Human, conflict, river, forest-edge, outpost, POI, and scar archetypes do not apply.
Example traits: `human_settled`, `polity_owned`, `lineage_continuity`.
Player-facing label: settled village.
Future notes: observer-only memory label; no village building or resource system is added.

`beast_range`
Derivation: `beast_habitat` or beast_range target.
Example traits: `beast_habitat`, `wild_recovering`.
Player-facing label: Beast range.
Future notes: no Beast faction layer.

`river_crossing`
Derivation: `river_center` or `river_crossing`.
Example traits: `river_center`, `river_crossing`.
Player-facing label: river crossing.
Future notes: no path network is added.

`fertile_refuge`
Derivation: `fertility_recovering` or `spring_fed` with low Beast and Spirit pressure.
Example traits: `spring_fed`, `fertility_recovering`.
Player-facing label: fertile refuge.
Future notes: no resource economy.

`ordinary_place`
Derivation: fallback.
Example traits: none, or low-priority context traits.
Player-facing label: ordinary place.
Future notes: safe fallback for exports.
