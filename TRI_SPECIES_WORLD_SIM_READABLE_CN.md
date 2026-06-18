# 三族世界模拟｜给设计者看的易懂说明

> 这是我们当前真正要先验证的最小版本。  
> 先不要做“塞尔达一代式多屏幕地图”。  
> 先只做一个单屏网格，观察三种生命体之间的基础互动是否成立。

---

## 1. 现在我们到底在验证什么？

我们要验证一个很小的动态世界：

```text
一个屏幕
很多格子
三种生命体
几种地表
每一轮自动演化
```

这不是最终游戏，也不是世界观设定。

当前只看：

```text
人、兽、灵三种生命体，
能不能在简单规则下形成有趣的扩张、压制、转化和边界。
```

---

## 2. 世界长什么样？

世界是一个二维格子，比如：

```text
60 × 40
```

每个格子有两层：

```text
地表
单位
```

比如：

```text
一个格子可以是“田地，上面站着人”
一个格子可以是“野地，上面没有单位”
一个格子可以是“印地，上面站着灵”
```

---

## 3. 当前有三种单位

### 人 H

人的基本行为是：

```text
开垦、定居、形成群体。
```

人会把脚下的地变成：

```text
田地 F
```

人克制：

```text
兽
```

但人害怕：

```text
灵 / 印地
```

特别是孤立的人，容易被灵转化。

---

### 兽 B

兽的基本行为是：

```text
游猎、破坏田地、把空间变回野地。
```

兽会把脚下的地变成：

```text
野地 W
```

兽克制：

```text
灵
```

但兽害怕：

```text
成群的人
```

---

### 灵 S

灵的基本行为是：

```text
标记空间、制造印地、转化孤立的人。
```

灵会把脚下的地变成：

```text
印地 M
```

灵克制：

```text
人
```

但灵害怕：

```text
兽
```

---

## 4. 三者的循环关系

最核心的循环是：

```text
人克兽
兽克灵
灵克人
```

也可以理解成：

```text
人能组织起来围猎兽。
兽能踏碎灵的印地。
灵能把孤立的人变成灵。
```

这就是这个系统的底层三角。

---

## 5. 当前地表

| 符号 | 地表 | 含义 |
|---|---|---|
| `.` | 空地 | 什么倾向都没有 |
| `F` | 田地 | 人制造的地 |
| `W` | 野地 | 兽制造的地 |
| `M` | 印地 | 灵制造的地 |
| `X` | 边界 | 冲突 / 僵持留下的格子 |
| `#` | 障碍 | 不变化、不能走 |

---

## 6. 每一轮发生什么？

每一轮按照这个顺序：

```text
移动
↓
单位改写脚下地表
↓
冲突 / 死亡 / 转化
↓
繁衍
↓
地表衰退
```

这样做的原因是：

```text
单位先行动，
然后改变空间，
然后和周围单位发生关系，
最后世界做一次自然整理。
```

---

## 7. 移动怎么理解？

### 人

人喜欢靠近田地。

```text
优先去田地
其次去空地
最后才成群进入野地
不进入印地和边界
```

所以人不会像怪物一样到处乱跑。  
人更像在扩张聚落边缘。

---

### 兽

兽喜欢冲击人的生产地，也会踏碎灵的印地。

```text
优先去田地
其次去印地
再去野地
最后去空地
```

所以兽会主动破坏人的田，也会压制灵。

---

### 灵

灵喜欢靠近人和田地。

```text
优先靠近人
其次去田地
再去空地 / 野地 / 印地
```

所以灵不会只是留在角落，它会向人类空间靠近。

---

## 8. 三种单位怎么改变地表？

### 人站在哪里，哪里变田

```text
空地 -> 田地
野地 -> 田地
```

### 兽站在哪里，哪里变野

```text
空地 -> 野地
田地 -> 野地
印地 -> 野地
```

### 灵站在哪里，哪里变印

```text
空地 -> 印地
田地 -> 印地
野地 -> 印地
```

这点很重要：  
世界变化不是文字描述，而是格子直接变颜色。

---

## 9. 冲突怎么发生？

### 人对兽

如果一个兽旁边有 2 个以上的人，而兽自己没有兽群支援：

```text
兽死亡
```

如果人很多，兽也很多：

```text
兽消失
当前格变成边界 X
```

---

### 兽对灵

如果一个灵旁边有 2 个以上的兽，而灵自己没有灵群支援：

```text
灵消失
当前格变成野地
```

如果兽很多，灵也很多：

```text
灵消失
当前格变成边界 X
```

---

### 灵对人

如果一个人周围的灵和印地压力很高，而且这个人没有同族支援：

```text
人变成灵
当前格变成印地
```

如果人有同族支援：

```text
人不会被直接转化
但会消失，并留下边界 X
```

---

## 10. 繁衍怎么发生？

### 人繁衍

需要：

```text
空格
地表是田地
周围有 2 或 3 个人
周围灵压力不高
```

结果：

```text
生成新人
```

---

### 兽繁衍

需要：

```text
空格
地表是野地
周围有 2 或 3 个兽
周围人压力不高
```

结果：

```text
生成新兽
```

---

### 灵繁衍

需要：

```text
空格
地表是印地
周围正好 2 个灵
周围兽压力不高
```

结果：

```text
生成新灵
```

灵的繁衍更严格，是为了防止它太快铺满地图。

---

## 11. 死亡怎么发生？

### 孤立死亡

如果一个单位既没有同族，也没有适合自己的地表支持，就会死或消失。

```text
孤立且没有田地支持的人会死。
孤立且没有野地 / 田地支持的兽会死。
孤立且没有印地支持的灵会消失。
```

### 过密死亡

如果一个单位周围同族太多：

```text
周围同族 >= 6
```

它会死亡。

这是为了避免一个族群无限堆满地图。

---

## 12. 地表会不会一直留下？

不会。

### 田地

如果附近没有人维护：

```text
田地 -> 空地
```

### 印地

如果附近没有灵维持：

```text
印地 -> 空地
```

### 野地

野地暂时默认保留。

这是因为我们先把野地当成比较自然的背景状态。

### 边界

如果边界附近不再有两种不同单位对峙：

```text
边界 -> 空地
```

所以边界不是永久墙。

---

## 13. 这个 demo 应该看什么？

第一版跑起来后，你主要看：

```text
人会不会形成一片田地聚落？
兽会不会冲击田地，并把田地变野？
灵会不会在印地附近扩散，并威胁孤立的人？
三者是否形成循环，而不是一边倒？
边界 X 是不是有用？
单位会不会卡住不动？
死亡和繁衍会不会太激烈？
```

---

## 14. 现在不要做什么？

暂时不要做：

```text
多屏幕地图
塞尔达式 screen 传播
塔罗牌
村庄建筑
具体种族名字
NPC
任务
战斗
资源
剧情
美术包装
```

先验证这个底层自动机有没有生命感。

---

## 15. 当前一句话总结

```text
人造田，兽造野，灵造印。
人克兽，兽克灵，灵克人。
单位移动、改写地表、冲突、繁衍、死亡。
我们先看这个单屏系统能不能自己产生有趣的动态边界。
```
---

## V0.2 stabilization patch

Rules version:

```text
TRI_SPECIES_WORLD_SIM_V0.2
```

V0.2 fixes the observed problem where Humans reliably disappeared around tick 24/25.

Changes:

```text
1. Tick order is now movement -> conflict/death/conversion -> terrain rewrite by surviving units -> reproduction -> terrain decay.
2. Dead raiders no longer rewrite terrain after being removed in conflict.
3. Supported Humans resist Spirit pressure instead of disappearing or creating BORDER.
4. Human conversion requires at least one neighboring Spirit; MARK alone cannot convert Humans.
5. Beast reproduction now requires exactly 3 neighboring Beasts.
6. WILD decays to EMPTY when there is no Beast in the current cell or 8-neighborhood.
```
---

## V0.3 population dynamics patch

Rules version:

```text
TRI_SPECIES_WORLD_SIM_V0.3_POPULATION_DYNAMICS
```

V0.3 rejects DEPLETED terrain. No new terrain type is added.

V0.3 only adjusts movement, reproduction, death / overcrowding, and JSON recording diagnostics.

Changes:

```text
1. Reproduction now requires local room and low local unit density.
2. Human reproduction remains slightly easier, but is blocked by heavy Beast pressure.
3. Beast reproduction requires exactly 3 neighboring Beasts, no neighboring Humans, enough empty space, and edge pressure from FIELD / MARK / EMPTY terrain.
4. Spirit reproduction requires exactly 2 neighboring Spirits, no neighboring Beasts, enough empty space, and edge pressure from Human / FIELD / EMPTY terrain.
5. Movement avoids targets that would create over-clumped same-species groups.
6. Beasts can stay on supported WILD when no FIELD or MARK target is nearby.
7. Spirits can stay on supported MARK when no Human or FIELD target is nearby.
8. Dense Beast groups without FIELD or MARK pressure collapse.
9. Dense Spirit groups without Human or FIELD pressure fade.
10. JSON recording frames now include births, deaths, and H_to_S conversion counters.
```
---

## V0.4 frontier-flow patch

Rules version:

```text
TRI_SPECIES_WORLD_SIM_V0.4_FRONTIER_FLOW
```

V0.4 rejects DEPLETED terrain. No new terrain type is added.

V0.4 only adjusts frontier sensing, movement, frontier reproduction, BORDER formation, and JSON diagnostics.

Changes:

```text
1. Units distinguish interior from frontier.
2. Interior units may stay; frontier units evaluate movement.
3. Interior units have a low scouting chance of 0.06.
4. Reproduction requires species-specific frontier signals.
5. Human births can refill FIELD edges.
6. Beast and Spirit births happen at active edges, not deep closed blobs.
7. Contested empty / F / W / M cells can become BORDER with borderFormationChance = 0.20.
8. JSON recording frames include anti-deadlock diagnostics:
   birthCandidates, actualBirths, actualDeaths, actualMoves, frontierUnits, borderCandidates, actualBordersCreated.
```
---

## V0.5 lifecycle + group-behavior redesign

Rules version:

```text
TRI_SPECIES_WORLD_SIM_V0.5_LIFECYCLE_GROUPS
```

V0.5 rejects DEPLETED terrain. No new terrain type is added.

V0.5 changes the simulation from pure individual flood-fill automata to lifecycle + group behavior.

Changes:

```text
1. Units now carry age and role.
2. Natural death prevents permanent saturation.
3. Humans reproduce inside supported FIELD settlements.
4. Crowded Human settlements can spawn settler Humans on EMPTY / FIELD edge cells.
5. Settlers prefer moving outward and avoid Beast / Spirit pressure.
6. Beasts behave as packs: rare reproduction, evasive movement near strong Human groups, probabilistic WILD spread.
7. Spirits are temporary manifestations: they appear on MARK near Human / FIELD pressure and fade elsewhere.
8. Spirit terrain spread is probabilistic / support-based instead of universal.
9. MARK can persist near Human / FIELD pressure even if Spirit manifestations fade.
10. JSON recording events now include naturalDeaths, conflictDeaths, settlerSpawns, and spiritManifestations.

---

## V0.6 fertility + migration experiment

Rules version:

```text
TRI_SPECIES_WORLD_SIM_V0.6_FERTILITY_MIGRATION
```

V0.6 不新增地表，不实现 DEPLETED，不做多屏地图，不加入世界观文本。

每个格子现在都有 `fertility` 数值，范围 0 到 100。它不是地表类型，只是格子的数值状态。

初始 fertility：

```text
EMPTY: 25-55
FIELD: 35-65
WILD: 65-95
MARK: 35-75
BORDER: 20-45
BLOCK: 0
```

每 tick 的 fertility 变化：

```text
EMPTY 向 45 缓慢回归。
FIELD 如果在 Human 附近，会逐步消耗 fertility。
WILD 会恢复 fertility。
MARK 向 50 缓慢回归。
BLOCK 永远为 0。
Beast 会恢复自身格子和邻近格子的 fertility。
```

Human 改动：

```text
Human 出生需要 fertile FIELD 支撑。
低 fertility 会增加 Human 自然死亡风险。
拥挤或贫瘠的 Human 会变成 settler 角色，但不会新增人口。
settler 会向更高 fertility 的 EMPTY / WILD / FIELD 移动。
settler 在 fertility 足够、且附近有人类支撑时建立 FIELD，并回到 normal。
Human 创建 FIELD 会消耗该格 fertility。
```

Beast 改动：

```text
Beast 是游走的 fertility 载体。
Beast 出生变低频，并要求 WILD / EMPTY 和较高 fertility。
Beast 可以把 FIELD / MARK 改回 WILD。
Beast 只有在 fertility 足够时才可能把 EMPTY 改成 WILD。
```

Spirit 改动：

```text
Spirit 是短暂显现。
Spirit 在 fertile MARK、FIELD 压力、人类附近或 abandoned FIELD 附近显现。
Spirit 离开 Human / FIELD / MARK 锚点会消散。
Spirit 可以把 FIELD 或 fertile EMPTY 改成 MARK，但不会新增地表类型。
```

JSON recording 新增：

```text
frame.fertility.avg / min / max / avgByTerrain
world.fertilityRows
events.settlerDepartures
events.settlementFoundings
events.spiritManifestations
```

### V0.6 initialization and presets

V0.6 初始化把主动单位和地表痕迹分开：

```text
Initial Spirits = 主动 Spirit 单位数量。
Initial MARK patches = 潜在 Spirit 痕迹。
Initial Spirits 可以是 0，同时 MARK patches 可以大于 0。
```

可编辑初始化参数：

```text
Initial Humans: 0-300
Initial Beasts: 0-300
Initial Spirits: 0-200
Initial FIELD patches: 0-20
Initial WILD patches: 0-20
Initial MARK patches: 0-20
Initial BLOCK count: 0-120
Random seed: 可编辑整数
```

默认 V0.6 初始化：

```text
Initial Humans = 24
Initial Beasts = 18
Initial Spirits = 0
Initial FIELD patches = 3
Initial WILD patches = 5
Initial MARK patches = 3
Initial BLOCK count = 20
```

Reset / Randomize 行为：

```text
Reset 精确恢复上一次生成并保存的初始状态。
Randomize 读取当前设置，写入新 seed，生成并保存新的初始状态。
Apply Initial Settings 用当前设置和当前 seed 重新生成并保存初始状态。
```

预设：

```text
Balanced Fertility Test
No Spirit Control
Spirit Dormant Test
Spirit Active Test
Human Migration Test
Beast Recovery Test
Empty Land Fertility Test
```

JSON 现在包含：

```text
snapshot.initialSettings
recording.summary.initialSettings
world.fertilityRows
```

V0.6 400 tick smoke run 观察：

```text
默认世界可以稳定运行 400 ticks。
Human 聚落会随着 FIELD fertility 降低而衰退或迁徙。
Beast 会维持高 fertility 的 WILD 区域。
Spirit 更像短暂现象，可能较早消散。
```

---

## V0.7 Rot-Migration Rebase

Rules version:

```text
TRI_SPECIES_WORLD_SIM_V0.7_ROT_MIGRATION_REBASE
```

V0.7 用更清晰的腐败-迁徙循环替换 V0.6 的连续 fertility 方向。

核心循环：

```text
WILD 高 fertility
-> Human 定居并创建 FIELD
-> FIELD 支撑人口但消耗土地
-> 低 support / MARK / Spirit 压力导致迁徙或死亡
-> H / B 死亡直接生成 MARK
-> MARK 产生短命 Spirit 波
-> Beast 被 MARK / Spirit 吸引并清理成 WILD
-> WILD 恢复 fertility
-> Human 以后可能迁徙回来
```

### Fertility levels 0-4

V0.7 不再使用 0-100 fertility 作为规则依据。

```text
0 = barren
1 = poor
2 = ordinary
3 = fertile
4 = abundant
```

`world.fertilityRows` 现在是 0-4 的字符串行。

### FIELD

```text
FIELD 不是固定肥沃值。
FIELD 继承原地 fertilityLevel。
Human 从 EMPTY / WILD 创建 FIELD 时，fertilityLevel 通常降低 1。
FIELD 2-3 支撑聚落。
FIELD 1 产生迁徙压力。
FIELD 0 会衰败或腐化。
```

### Death creates MARK

```text
Human death -> MARK
Beast death -> MARK
Spirit death 不额外生成 corpse overlay
不新增 corpse overlay
不新增地表
```

### Spirit

```text
Spirit 不是稳定繁殖种群。
Spirit 从 aged MARK 中短暂出现。
Spirit 会把接触地表改成 MARK。
Spirit 威胁孤立 Human。
Beast 会压制 Spirit。
```

### Beast

```text
Beast 默认 random walk。
遇到 2+ Human 邻居时逃离。
看到 MARK / Spirit 时向腐败目标移动。
进入 MARK 时把 MARK 清理成 WILD，并提高 fertilityLevel。
```

### Human support / demand

Human 使用局部 support / demand 判断聚落状态：

```text
surplus
balanced
pressured
collapse
```

只有 surplus FIELD 支持出生。pressured / collapse / MARK / Spirit 压力会让现有 Human 变成 `settler_seeking`，不会新增人口。

### V0.7 presets

```text
Balanced Rot Cycle Test
No Spirit Control
Rot Outbreak Test
Beast Cleansing Test
Human Migration Test
Empty Fertility Test
```

### V0.7 JSON diagnostics

```text
fertility.levels
fertility.avgByTerrain
world.fertilityRows
events.marksCreatedByDeath
events.marksCreatedBySpirit
events.marksCleanedByBeast
events.fieldCreated / fieldDecayed / fieldTrampled
events.beastRandomMoves / beastFleeMoves / beastAttractedMoves
events.spiritSpawnsFromMark / spiritSpreadActions / spiritSuppressedByBeast
diagnostics.humanLocalConditions
diagnostics.activeSettlers
diagnostics.avgHumanSupport / avgHumanDemand
```

---

## V0.7.1 Rot Containment Combined

Rules version:

```text
TRI_SPECIES_WORLD_SIM_V0.7.1_ROT_CONTAINMENT_COMBINED
```

V0.7.1 使用 combined prompt 作为唯一执行方案，覆盖 V0.7 的旧链条。

旧链条：

```text
death -> MARK -> Spirit -> more MARK -> more Spirit
```

新链条：

```text
death -> active Spirit
Spirit movement / death -> MARK trail
MARK = passive residue
```

规则变化：

```text
Human death 直接生成 active Spirit。
Beast death 直接生成 active Spirit。
死亡格地表暂时保持原样，直到 Spirit 移动或死亡。
Spirit 移动时，在离开的格子留下 MARK。
Spirit 死亡时，在死亡格留下 MARK。
MARK 不再默认生成 Spirit。
MARK 是被动残留：阻挡 Human，吸引 Beast，会衰减，也可被 Beast 清理。
```

诊断修复：

```text
markCellsNearHumans
spiritCellsNearHumans
humansAdjacentToSpirit
humansAdjacentToMark
settlerMoves 只统计实际 settler 移动
humanNormalMoves
beastRandomMoves / beastFleeMoves / beastAttractedMoves 只统计实际移动
```

新增事件：

```text
spiritsCreatedByDeath
spiritsCreatedByHumanDeath
spiritsCreatedByBeastDeath
spiritsCreatedByConversion
spiritKillsHumanToMark
spiritTrailMarksCreated
spiritDiedIntoMark
marksDecayed
```

---

## V0.8 Asymmetric Ecology Rebase

Rules version:

```text
TRI_SPECIES_WORLD_SIM_V0.8_ASYMMETRIC_ECOLOGY_REBASE
```

V0.8 rule summary:

```text
Human / Beast / Spirit are no longer symmetric populations.
Human is the expansion species: stronger settlement reproduction, prosperity settlers, and crisis migration.
Beast is a persistent WILD recovery agent: no natural death, no Spirit from Beast dispersal.
When dense Humans drive Beast away, Beast returns WILD, restores fertility, and can clean nearby MARK / suppress nearby Spirit.
Spirit mainly comes from Human death or failed Human stability.
Spirit threatens isolated and edge Humans, but supported settlement cores resist infection.
MARK stays passive residue and does not spawn Spirit by default.
WILD initialization and Beast placement are more scattered.
```

V0.8 presets:

```text
Balanced Asymmetric Ecology Test
No Spirit Control
Human Expansion Test
Human Migration Test
Beast Dispersion Test
Spirit Outbreak Test
```

V0.8 JSON diagnostics:

```text
humanDeathsToSpirit
humanDeathsToMark
beastDispersals
beastDispersalWildCreated
beastDispersalMarksCleaned
beastDispersalSpiritsSuppressed
prosperitySettlerDepartures
prosperitySettlerBirths
crisisSettlerDepartures
spiritBlockedByCoreSettlement
humanRetreatsFromSpirit
activeProsperitySettlers
activeCrisisSettlers
coreHumans
edgeHumans
isolatedHumans
beastNeighborStats
scatteredWildCells
largestWildClusterSize
```

---

## V0.8.2 Code Review Movement / Hunting Fix

Rules version:

```text
TRI_SPECIES_WORLD_SIM_V0.8.2_CODE_REVIEW_MOVEMENT_HUNTING_FIX
```

V0.8.2 is a targeted code-review fix, not a new conceptual rebase.

```text
Settler role suffixes are recognized consistently.
Settler movement runs before normal Human stay-in-FIELD behavior.
Founding conditions are relaxed so migration can close its loop.
Humans no longer universally fear Beasts: isolated Humans avoid, grouped Humans can hunt or drive Beasts.
Beast reproduction and EMPTY -> WILD painting are heavily braked.
Old WILD without Beast maintenance can slowly decay back to EMPTY.
```

V0.8.2 JSON diagnostics:

```text
settlerForcedExplorationMoves
settlerRestTicks
settlersLeavingRest
settlersLostRoleWithoutFounding
settlerBlockedByOccupied
settlerBlockedByNoTarget
settlerBlockedByDanger
settlerBlockedByTerrain
settlerBlockedByNoValidStep
beastBirthsBlockedByDensity
beastBirthsBlockedBySoftBrake
wildCreatedByBeast
wildDecayedToEmpty
activeSettlersWithValidMove
activeSettlersWithFoundingOpportunity
activeSettlersBlocked
beastBirthEligibleCells
beastLocalDensityBlockedCells
totalBeasts
totalWild
```

---

## V0.8.3 Beast Relocation / Spirit Incubation

Rules version:

```text
TRI_SPECIES_WORLD_SIM_V0.8.3_BEAST_RELOCATION_SPIRIT_INCUBATION
```

V0.8.3 is a focused patch, not a new conceptual rebase.

```text
New Spirit is dormant for 3 ticks.
Dormant Spirit cannot infect, chase, spread, or leave MARK trails.
Humans near dormant Spirit can flee as crisis settlers.
applyPrimaryConflict no longer directly converts Human to Spirit.
Human death creates Spirit less often, with early non-spirit death grace and local Spirit density caps.
Beast dispersal relocates Beasts when possible; removal only happens if no relocation target exists.
Beasts cleanse adjacent M/S, not only cells they step onto.
No Spirit Control disables death-to-Spirit and H-to-S conversion.
```

V0.8.3 JSON diagnostics:

```text
spiritWarningFlees
spiritSpawnBlockedByLocalDensity
spiritSpawnBlockedByEarlyGrace
beastRelocations
beastDispersalRemovals
beastAuraSpiritCleansed
beastAuraMarksCleaned
dormantSpiritSuppressedByBeast
activeSpiritSuppressedByBeast
dormantSpirits
activeSpirits
humansAdjacentToDormantSpirit
humansAdjacentToActiveSpirit
beastsAdjacentToSpirit
beastsAdjacentToMark
```

---

## V0.9 Macro World Layer / 宏观世界解释层

Rules version:

```text
TRI_SPECIES_WORLD_SIM_V0.9_MACRO_WORLD_LAYER
```

版本分层：

```text
Ecology rules: TRI_SPECIES_WORLD_SIM_V0.8.3_BEAST_RELOCATION_SPIRIT_INCUBATION
Macro layer: TRI_SPECIES_WORLD_SIM_V0.9_MACRO_WORLD_LAYER
```

V0.9 不重做底层生态规则。人、兽、灵的移动、死亡、繁衍、冲突、地表改写、肥沃度和衰退规则仍按 V0.8.3 执行。

V0.9 新增的是一个只读的宏观解释层：

```text
当前网格 + 最近事件记录 -> macroWorld JSON + 可选地图图标
```

它会尝试识别并记住：

```text
settlement              聚落
abandoned_settlement    废弃聚落
beast_recovery_zone     兽恢复区
spirit_outbreak         灵爆发事件
spirit_scar             灵留下的印痕区
migration_route         迁徙路线
human_beast_frontier    人兽边界
```

宏观对象会保留稳定 id、首次出现 tick、最后出现 tick、年龄、置信度、中心点、边界、指标和状态历史。

JSON 导出变化：

```text
Snapshot includes macroWorld.
Recording includes macroWorld, macroFrames, frames[n].macro, and keyframes[n].macroWorld.
```

界面上的 Show Macro Icons 只显示简单覆盖图标。它不新增地表，不改变模拟规则，也不是故事/NPC/任务系统。

---

## V0.8.4 Readable Macro Patterns / 可读宏观图案补丁

Patch version:

```text
TRI_SPECIES_WORLD_SIM_V0.8.4_READABLE_MACRO_PATTERNS
```

版本分层：

```text
Ecology base: TRI_SPECIES_WORLD_SIM_V0.8.3_BEAST_RELOCATION_SPIRIT_INCUBATION
Readability patch: TRI_SPECIES_WORLD_SIM_V0.8.4_READABLE_MACRO_PATTERNS
Macro layer: TRI_SPECIES_WORLD_SIM_V0.9_MACRO_WORLD_LAYER
```

V0.8.4 不是重做生态，也不是替换 V0.9 宏观层。它只让底层图案更容易读：

```text
Human birth 降低，并更依赖 FIELD 核心。
低肥沃、拥挤的 FIELD 更容易把现有人类推出为 crisis settler。
密集且肥沃的 WILD 更慢衰退，形成更稳定的 wild core。
Beast relocation 会轻微偏好已有 WILD 簇。
孤立 MARK 更快消失，成簇 MARK 更慢消失，读起来更像 scar。
废弃且低肥沃的 FIELD 靠近 MARK 时，会更容易留下 FIELD/MARK ruin residue。
migration_route 会从 active_route 老化为 old_route / abandoned_route。
spirit_outbreak 会从 active/warning 退到 aftermath/scar，而不是永久 active。
宏观图标会更偏向显示高优先级事件，减少近距离标签噪音。
```

它仍然不新增地表、不新增世界观机制、不做多屏地图、不添加资源/建筑/NPC/任务系统。

---

## V0.9.1 Macro View / Field Decay

Patch version:

```text
TRI_SPECIES_WORLD_SIM_V0.9.1_MACRO_VIEW_FIELD_DECAY
```

版本分层：

```text
Ecology base: TRI_SPECIES_WORLD_SIM_V0.8.3_BEAST_RELOCATION_SPIRIT_INCUBATION
Readability patch: TRI_SPECIES_WORLD_SIM_V0.8.4_READABLE_MACRO_PATTERNS
Macro layer: TRI_SPECIES_WORLD_SIM_V0.9_MACRO_WORLD_LAYER
Display patch: TRI_SPECIES_WORLD_SIM_V0.9.1_MACRO_VIEW_FIELD_DECAY
```

V0.9.1 解决三个可读性问题：

```text
1. 没有人类居住的旧 FIELD 会逐渐退成 EMPTY。
2. 靠近 MARK 的废弃 FIELD 可以短暂保留，或变成 MARK，读起来更像 ruin/scar residue。
3. Beast 清理 MARK / Spirit 时，可以留下少量 WILD recovery patch，让恢复区更可见。
```

新增 View Mode：

```text
Cell View  = 原来的细胞级调试视图。
Macro View = 降低零碎 cell 噪音，突出 settlement / abandoned / wild recovery / scar / frontier / route 的连续形状。
```

Macro View 只是显示模式，不是新的模拟层，不会改 world。

JSON 导出补充：

```text
macroWorld.display.viewModes = ["cell", "macro"]
macroWorld.display.masks 记录 settlement / abandoned / wildRecovery / spiritScars / frontiers / routes 的显示 mask 数量。
events.beastRecoveryPatchCreated 记录 Beast 清理后额外生成的小 WILD recovery patch。
```

---

## V0.9.2 Influence Macro View / 影响力宏观视图

Patch version:

```text
TRI_SPECIES_WORLD_SIM_V0.9.2_INFLUENCE_MACRO_VIEW
```

版本分层：

```text
Ecology base: TRI_SPECIES_WORLD_SIM_V0.8.3_BEAST_RELOCATION_SPIRIT_INCUBATION
Readability patch: TRI_SPECIES_WORLD_SIM_V0.8.4_READABLE_MACRO_PATTERNS
Macro layer: TRI_SPECIES_WORLD_SIM_V0.9_MACRO_WORLD_LAYER
Display patch: TRI_SPECIES_WORLD_SIM_V0.9.1_MACRO_VIEW_FIELD_DECAY
Macro View patch: TRI_SPECIES_WORLD_SIM_V0.9.2_INFLUENCE_MACRO_VIEW
```

V0.9.2 让 Macro View 不再只看纯地表碎片，而是看影响力区域：

```text
Human settlement influence = FIELD + Human + Human-on-FIELD 周围影响。
Beast / wild recovery influence = WILD + Beast + Beast 周围 fertile EMPTY + WILD/Beast 邻近压力。
Spirit scar influence = MARK + clustered MARK 周围影响。
```

关键变化：

```text
Beast recovery zone 不再依赖纯 WILD 连通块 >= 8。
即使 WILD 被切成小碎片，只要 Beast 活跃、肥沃地和 WILD/Beast 影响连成片，Macro View 也能显示绿色恢复区。
小 FIELD / WILD / MARK 碎片会被压低，不再主导 Macro View。
route 和 frontier 仍然显示在区域之上。
Cell View 保持原来的细胞级调试视图。
```

JSON 仍然使用已有 `macroWorld.display.masks`，但其中的 `wildRecovery` 现在代表 Beast/WILD influence regions，而不是纯 WILD 地表连通块。
---

## V0.9.3 Macro View Stability / 宏观视图稳定性

Patch version:

```text
TRI_SPECIES_WORLD_SIM_V0.9.3_MACRO_VIEW_STABILITY
```

版本分层：

```text
Ecology base: TRI_SPECIES_WORLD_SIM_V0.8.3_BEAST_RELOCATION_SPIRIT_INCUBATION
Readability patch: TRI_SPECIES_WORLD_SIM_V0.8.4_READABLE_MACRO_PATTERNS
Macro layer: TRI_SPECIES_WORLD_SIM_V0.9_MACRO_WORLD_LAYER
Display patch: TRI_SPECIES_WORLD_SIM_V0.9.1_MACRO_VIEW_FIELD_DECAY
Influence view patch: TRI_SPECIES_WORLD_SIM_V0.9.2_INFLUENCE_MACRO_VIEW
Stability patch: TRI_SPECIES_WORLD_SIM_V0.9.3_MACRO_VIEW_STABILITY
```

V0.9.3 不改变底层模拟规则，只稳定 Macro View：

```text
Beast recovery zone 不再因为整个 influence region 的平均 fertility 低于 2.5 就直接消失。
Beast/WILD 区域改用 soft score：WILD 数量、Beast 数量、最近净化/恢复事件和 relocation 都会增加分数。
曾经可见的 Beast recovery zone 如果暂时低于当前检测阈值，会保留最多 100 tick。
前 50 tick 以内状态为 quiet_habitat；之后进入 fading_recovery。
超过 100 tick 仍未重新检测到，就会消失。
Macro View 会用 retained macro region 绘制绿色恢复区，避免一闪一灭。
旧的 S / F / -> / * / R / W / ! 图标改成 debug-only。
Show Macro Debug Icons 默认关闭。
Macro View 的主要阅读方式是彩色区域、边界线和路线标记，而不是字母图标。
```
---

## V0.10 Regional Substrate / 单屏区域基底

Patch version:

```text
TRI_SPECIES_WORLD_SIM_V0.10_REGIONAL_SUBSTRATE
```

V0.10 给每个 cell 增加隐藏的 `regionBias`：

```text
none   = 普通区域
basin  = Settlement Basin，稍微偏向 Human / FIELD
refuge = Wild Refuge，稍微偏向 Beast / WILD
hollow = Scar Hollow，稍微偏向 MARK / scar
```

这不是新地表，也不是剧情层。它只提供软倾向：

```text
同一个 random seed 会生成同一张 substrate。
不同 seed 会生成不同 basin / refuge / hollow 分布。
basin 更容易初始化 FIELD / Human，FIELD decay 稍慢。
refuge 更容易初始化 WILD / Beast，WILD decay 稍慢，Beast relocation 略偏好 refuge。
hollow 更容易留下 MARK / old FIELD，MARK decay 稍慢，但不会直接生成 Spirit。
```

新增视图：

```text
Cell View
Macro View
Substrate + Macro View
```

`Substrate + Macro View` 用底色显示 basin / refuge / hollow，并继续叠加 settlement、wild recovery、scar、frontier、route 等宏观 mask。

新增 debug-only runtime intervention：

```text
选择 Off / H / B / S。
点击非 BLOCK 格子会放置或替换对应单位。
点击 BLOCK 会被拒绝。
没有 brush、undo/redo、save/load 或完整地图编辑器。
```

JSON 新增：

```text
world.regionBiasRows
regionBiasCounts
macroWorld.display.viewModes includes substrateMacro
snapshot / recording intervention metadata
```

---

## V0.10.1 Screen-Cell Regional Substrate / 单屏大格基底

Patch version:

```text
TRI_SPECIES_WORLD_SIM_V0.10.1_SCREEN_CELL_REGIONAL_SUBSTRATE
```

V0.10.1 修正 V0.10 的可读性问题：

```text
不再直接在 40 x 25 小格上画随机 blob。
先生成 4 x 3 的逻辑 screen-cell layout。
再把每个大格画回单屏 40 x 25 世界。
这仍然是单屏模拟，不是多屏地图。
```

每个逻辑大格导出：

```text
id
gridX / gridY
bounds
archetype
regionBias
exits: north / south / west / east
```

exits 使用：

```text
open
narrow
blocked
```

相邻大格的出口必须匹配，这样 BLOCK 边界、通道和 choke point 更容易被看懂。

可视差异：

```text
Substrate + Macro View 现在有更明显的 basin / refuge / hollow 底色。
大格边界会用细线显示。
BLOCK 颜色和轮廓比 EMPTY 更明显。
Macro mask 不应完全盖住 substrate 底色。
```

初始化修正：

```text
如果有多个 basin 大格，Human / FIELD 初始中心可以分布到多个 basin。
如果有多个 refuge 大格，Beast / WILD 初始中心可以分布到多个 refuge。
如果有多个 hollow 大格，MARK 痕迹可以分布到多个 hollow。
```

JSON 新增：

```text
regionalSubstrate.version = 0.10.1
regionalSubstrate.layout.columns = 4
regionalSubstrate.layout.rows = 3
regionalSubstrate.layout.cells[]
```

简化：

```text
4 x 3 大格只是生成器骨架。
25 高度不能被 3 整除，所以三行高度是 8 / 8 / 9。
BLOCK 仍然是抽象 hard barrier，不是最终山脉或河流类型。
```

---

## V0.10.2 Terrain Readability And Occlusion / 地形可读性与遮挡

Patch version:

```text
TRI_SPECIES_WORLD_SIM_V0.10.2_TERRAIN_READABILITY_AND_OCCLUSION
```

V0.10.2 是 V0.10.1 的修正补丁，重点不是新增玩法，而是让现有单屏地图更可信、更可读：

```text
Macro View 和 Substrate + Macro View 中，BLOCK 不再容易被 macro 色块盖住。
Substrate + Macro View 会保留大格边界、出口和 blocker/passages 的可读性。
screen-cell 的内部 BLOCK 形状更不规则，有 jittered ridge、corner mass、pocket 和 carved opening。
```

BLOCK-aware sensing：

```text
移动仍然不能进入 BLOCK。
相邻 8-neighborhood 的接触 / 冲突规则保持简单。
半径 2+ 的战略感知改用 reachable radius flood fill。
BLOCK 和 BORDER 会阻断这种可达性感知。
```

直接影响：

```text
Beast 不应被墙后的 MARK / Spirit 吸引。
Settler 不应把未连通墙后的高 fertility 目标当成近处目标。
Human 的中距离 hunt / pressure sensing 不应穿过完整 BLOCK 墙。
```

JSON / debug：

```text
regionalSubstrate.version = 0.10.2
regionalSubstrate.layout.cells[] 增加 blockCount
```

简化：

```text
当前不是几何 line-of-sight，而是半径内 flood-fill reachability。
只优先接入战略半径判断；本地邻接规则不改。
BLOCK 仍然只是抽象硬阻挡，不新增 mountain / river / wall 地表。
```
