# Semantic Traits

V0.14A traits are deterministic, observer-only, and derived from existing Place Memory snapshots, targets, map features, POIs, `placeState`, and `humanMemory`.

V0.14A.1 allows Human place anchors to expose compact `rememberedHumanIdentity` after current polity / lineage identity disappears. Remembered identity may add memory traits such as `inherited_memory` or `collapsed_memory`, but it must not add `polity_owned` unless current `humanMemory.polity.id` exists.

| Trait id | Group | Meaning | Derivation signal | False-positive risk | Player-facing text | Observer-only note |
|---|---|---|---|---|---|---|
| river_adjacent | geography | River feature is in the sampled place radius. | `ecology.riverCells > 0` | A river edge may only touch the place. | yes | Does not change river behavior. |
| river_center | geography | The anchor center is a river feature cell. | `center.isRiver` | Center may be an inspection proxy. | yes | River remains mapFeature only. |
| river_crossing | geography | River is central or locally repeated. | river target or 2+ river cells | Repeated cells may not be a true crossing. | yes | No pathfinding change. |
| spring_fed | geography | Spring POI supports the local place. | center or nearby spring POI | POI radius is simplified. | yes | Existing POI effect only. |
| great_forest_nearby | geography | Great Forest POI is local context. | center or nearby great forest POI | Edge influence may be loose. | yes | Existing POI effect only. |
| rot_source_nearby | geography | Rot Source POI is local context. | center or nearby rot source POI | Nearby does not imply active spread. | yes | Existing POI effect only. |
| monument_shadowed | geography | Monument POI is local context. | center or nearby monument POI | Monument support may be weak. | yes | Existing POI effect only. |
| mountain_blocked | geography | BLOCK terrain is in the sampled place. | local BLOCK count | BLOCK may not be mountain-shaped. | yes | BLOCK rules unchanged. |
| human_settled | human identity | Human settlement or FIELD/H support is visible. | settlement kind village, Human units, FIELD count | FIELD can be abandoned. | yes | No Human behavior change. |
| human_seat | human identity | Place is a current Human seat. | target or humanMemory kind seat | Seat is heuristic. | yes | Seat is observer-only. |
| human_old_seat | human identity | Place is remembered as an old seat. | target or kind old_seat | Old-seat relevance is capped. | yes | Memory only. |
| human_outpost | human identity | Place is a Human outpost. | target or kind outpost | Outpost is heuristic. | yes | Not a building. |
| human_remnant | human identity | Place is a Human remnant. | target or kind remnant | Remnant can fade. | yes | Memory only. |
| human_domain | human identity | Place belongs to Human domain interpretation. | target or kind domain | Domain ownership can be ambiguous. | yes | Display only. |
| polity_owned | human identity | A Human polity id owns the place. | `humanMemory.polity.id` | Ownership is inferred. | yes | No faction logic. |
| lineage_continuity | human identity | A Human lineage identity continues here. | lineage id/root lineage id | Lineage is heuristic. | yes | No gameplay inheritance. |
| split_polity | human identity | Polity has split ancestry. | parent polity id or branch depth | Split dedup is heuristic. | yes | No civilization module. |
| seatless_polity | human identity | Polity is seatless or declining. | polity state | State can lag macro samples. | yes | No rule effect. |
| pressured_polity | human identity | Human polity or settlement is pressured. | polity/settlement state | Pressure is observer interpretation. | yes | No rule effect. |
| beast_pressure | ecology | Beast units are active nearby. | local Beast count | A single Beast may pass through. | yes | No Beast behavior change. |
| beast_habitat | ecology | WILD/Beast habitat dominates locally. | WILD count, forest/beast pressure, beast_range target | WILD may be old residue. | yes | Display only. |
| wild_recovering | ecology | WILD plus fertility suggests recovery. | WILD count and average fertility | Fertility can later fall. | yes | No fertility change. |
| spirit_pressure | ecology | Spirit or rot pressure is active. | Spirit units or spirit/rot dominant pressure | Rot POI may be the driver. | yes | No Spirit behavior change. |
| spirit_scarred | ecology | MARK or scar trace is visible. | scar target or MARK count | MARK may be temporary. | yes | Display only. |
| mark_corroded | ecology | Center or local area is strongly MARK/rot affected. | MARK center/count or rot source nearby | Rot source nearby may not cover all cells. | yes | No terrain rewrite change. |
| field_declining | ecology | FIELD support is thinning. | FIELD plus declining trend or low fertility | Snapshot can catch a temporary dip. | yes | No decay change. |
| fertility_recovering | ecology | Fertility looks supported. | recovering state, river or spring plus fertility | Recovery can reverse. | yes | No fertility boost added. |
| fertility_exhausted | ecology | Average fertility is low. | low average fertility | Local average hides cell variance. | yes | No death/birth change. |
| mixed_pressure | ecology | Multiple H/B/S terrain or unit signals overlap. | mixed placeState or 2+ pressure groups | Contact may be harmless. | yes | No conflict change. |
| recently_changed | history | Change context is meaningful. | `computePlaceChange` visible change | Not present on standalone snapshots. | yes | llmContext only when derived from change. |
| long_stable | history | Change context stayed quiet. | no-significant-change in `computePlaceChange` | Stable since last compare only. | yes | llmContext only. |
| recently_abandoned | history | Human place is lost/remnant/abandoned. | settlement state | Naming is compact, not exact timing. | yes | Memory only. |
| inherited_memory | history | Continuity was transferred or recovered. | continuity transfer reason | Reason is heuristic. | yes | Memory only. |
| collapsed_memory | history | Collapsed polity history is present. | collapsed polity state/tick | Collapsed memory is capped. | yes | Historical only. |
| watched_by_player | history | Anchor has been inspected before. | anchor `lastInspectedAtTick` | Imported anchors may lack ticks. | no | Player memory only. |
