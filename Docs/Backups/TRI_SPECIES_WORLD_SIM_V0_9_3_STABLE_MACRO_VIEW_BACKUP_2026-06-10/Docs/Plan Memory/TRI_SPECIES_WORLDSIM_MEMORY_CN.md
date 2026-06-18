# Tri-Species WorldSim 项目记忆文件

> 用途：这是当前聊天的迁移记忆文件。  
> 目标：帮助在新聊天中继续讨论，不必重新解释整个三族世界模拟的脉络。  
> 建议新聊天主题：**基于 V0.8.3 三族世界模拟，设计 Macro World Layer / 世界解释层。**

---

## 0. 一句话概括

我们正在做一个 **40×25 单屏格子世界模拟原型**。它不是传统游戏关卡，也不是单纯细胞自动机，而是一个可长期运行的“世界底层”。

这个底层由三种单位和几种地表组成：

- **H = Human，人类**
- **B = Beast，兽**
- **S = Spirit，灵**

地表：

- `.` = EMPTY，空地
- `F` = FIELD，人类田地 / 聚落空间
- `W` = WILD，野地 / 自然恢复空间
- `M` = MARK，腐化 / 灵痕 / 死亡痕迹
- `#` = BLOCK，阻挡

当前目标已经从“修规则 bug”转向：

> **把这个底层模拟作为类似初版《塞尔达》的世界底子，并在其上识别宏观区域、事件和图标。**

---

## 1. 当前项目真正想做什么

这个项目不是要直接让玩家阅读底层的 H/B/S/F/W/M 格子。

更准确的结构应该是：

```text
底层模拟层 = 生态 / 历史 / 地表变化 / 种群运动
宏观解释层 = 聚落 / 兽径 / 灵灾 / 废墟 / 迁徙路线 / 地图图标
玩家可见层 = 类 Zelda 地图、区域 icon、传闻、地名、事件入口
```

底层负责让世界“活起来”。  
上层负责把这些变化翻译成玩家能理解的世界信息。

我们现在已经有了一个能长期维持的底层生态，但还需要一个 **Macro World Layer / 世界解释层** 来识别宏观模式。

---

## 2. 当前稳定版本：V0.8.3

当前版本可称为：

```text
TRI_SPECIES_WORLD_SIM_V0.8.3_BEAST_RELOCATION_SPIRIT_INCUBATION
```

它的核心修正包括：

1. **Spirit incubation**
   - S 出生后前几个 tick 是 dormant / incubating 状态。
   - dormant S 只是危险预兆，不能立刻感染人类。
   - 人类在这段时间有概率逃走或变成 crisis settler。
   - 兽可以更容易清理 dormant S。

2. **Beast relocation**
   - 兽被人类驱赶 / 围猎时，不再默认消失。
   - 优先 relocation 到附近 WILD / 高 fertility EMPTY。
   - 原地仍会变成 WILD 并净化周围。
   - 只有找不到迁移点时才真正 remove。

3. **Beast aura cleansing**
   - 兽不再必须踩到 M/S 才能清理。
   - 兽邻接 M/S 时也能产生净化效果。
   - 这让兽更像稳定的自然恢复力。

4. **降低 death -> Spirit 正反馈**
   - 人类死亡不再高概率生成 S。
   - 早期死亡受到保护，不会开局立刻爆灵灾。
   - 局部已有较多 S 时，新死亡更倾向只生成 M。

5. **移除或削弱直接 H -> S 的瞬发转化**
   - 之前 `applyPrimaryConflict()` 中存在绕过聚落抵抗机制的直接转换。
   - V0.8.3 的方向是：感染逻辑集中处理，不能让 S 一出生就瞬杀聚落。

---

## 3. 最近一次长 recording 的结果

最近上传的长 recording：

```text
tri_species_recording_ticks_0000_1581.json
```

结果概要：

```text
Initial:
H = 24
B = 18
S = 0

Terrains:
EMPTY = 774
FIELD = 47
WILD = 122
MARK = 37
BLOCK = 20

Final at tick 1581:
H = 45
B = 8
S = 0

Terrains:
EMPTY = 750
FIELD = 195
WILD = 18
MARK = 17
BLOCK = 20

Extinction:
H = null
B = null
S = 0
```

这说明：

- 人类没有灭绝。
- 兽没有灭绝。
- 灵不是常驻种群，而是阶段性事件。
- 世界能运行超过 1500 tick。
- FIELD 明显扩张。
- WILD 和 B 后期偏少。
- M 可以被控制在较低数量。
- 系统已经有了“涌现”的底子。

但也说明：

- 后期偏向人类田地扩张。
- 野地 / 兽的宏观存在感仍然偏弱。
- 宏观区域还不够清晰。
- 需要一个解释层把底层碎片读成“区域”和“事件”。

---

## 4. 当前三族定位

### 4.1 Human / 人类

当前定位：

```text
人类 = 高繁殖、高扩张、聚落形成、迁徙、土地消耗、秩序与风险并存
```

主要特征：

- 人类在 FIELD 上繁殖。
- FIELD 是人类组织过的土地，不是自然地表。
- 人类会形成聚落。
- 聚落强盛时会产生 prosperity settlers。
- 聚落遭遇 M/S 压力、土地贫瘠、过载时会产生 crisis settlers。
- settlers 会寻找高 fertility 的 WILD / EMPTY 并建立新 FIELD。
- 群体人类可以驱赶 / 捕猎兽。
- 孤立人类面对 S 或兽更危险。
- 人类死亡 / 聚落失衡可能生成 M 或 S。
- 人类既是世界扩张的力量，也是灵灾和腐化的来源。

理想画面：

```text
几个聚落逐渐扩张；
旧聚落消耗土地；
一部分人迁徙到新野地；
有些新聚落失败，有些成长；
人类前线和兽的恢复地发生冲突。
```

---

### 4.2 Beast / 兽

当前定位：

```text
兽 = 自然恢复力的移动代理，不是普通会老死的种群
```

主要特征：

- 兽默认 random walk。
- 兽没有自然死亡。
- 兽不会生成 Spirit。
- 兽能恢复 fertility。
- 兽能制造 / 维护 WILD。
- 兽能清理 M。
- 兽能压制 / 清理 S。
- 被人类围住时，不是“死亡变灵”，而是 dispersal / relocation。
- 兽被人类驱赶后，原地仍会净化，兽本体优先迁移到其他野地。
- 兽的数量不应爆炸，也不应轻易消失。

理想画面：

```text
兽像流动的自然净化力；
它不该成为常规敌人；
它不该无限繁殖；
它应该在地图上形成兽径、复苏地、野化边界。
```

当前潜在问题：

- 后期 B 可能偏少。
- WILD 后期可能被 FIELD 压缩。
- 兽的“净化事件”有了，但还需要被宏观解释层读出来。

---

### 4.3 Spirit / 灵

当前定位：

```text
灵 = 人类死亡 / 聚落失衡产生的短暂病灶，不是常驻种群
```

主要特征：

- S 主要来自人类死亡或腐化事件。
- S 不从 M 被动生成。
- S 出生后有 incubation。
- dormant S 不能立刻感染 / 扩散。
- 人类在 incubation 阶段可以逃走。
- 成熟 S 会移动，并可能留下 M。
- S 寿命短。
- S 会被兽清理。
- S 的作用不是占领地图，而是制造局部灾变和历史痕迹。

理想画面：

```text
某个聚落死亡 / 失衡；
出现灵灾预兆；
人类有机会逃走；
兽可能提前净化；
如果没被处理，S 成熟并留下腐化痕迹；
之后 M 被兽清理或自然衰退，成为遗址。
```

---

## 5. 版本演化脉络

### V0.1：对称三族细胞自动机

初始思路：

```text
人造田
兽造野
灵造印
人克兽
兽克灵
灵克人
```

结果：

- 人类快速灭绝。
- 灵和兽过强。
- 世界像三种细胞互相污染。
- 没有聚落感、迁徙感、生态感。

---

### V0.2：稳定化

尝试：

- 调整 tick 顺序。
- 减少 MARK 对人的直接压力。
- 增强 supported Humans 抵抗灵。
- 限制兽繁殖。

结果：

- 人能活一点，但世界进入静态小堡垒。
- 系统不够涌现。

---

### V0.3：非平衡耗尽地表方案

曾提出 DEPLETED terrain / 耗尽地表。

用户明确拒绝：

```text
耗尽的概念不符合直觉，对后续拓展来说很难。
```

结论：

- 不再使用 DEPLETED terrain。
- 后续改用 fertility level 0-4 表达土地状态。

---

### V0.4：Frontier Flow

核心想法：

```text
Interior stable; Frontier active.
```

尝试让边界活跃。

结果：

- 仍然容易形成静态领地。
- 缺少生命周期、迁徙和群体行为。

---

### V0.5：Lifecycle Groups

加入：

- age
- role
- 人类 settler
- 兽群游荡
- 灵短时显现

结果：

- 有动态，但变成全图 boom-bust。
- 人类或兽容易灭绝。
- 单位仍像细胞，不像群体。

---

### V0.6：Fertility Migration

用户提出关键方向：

```text
人类迁徙是否可以根据空地肥沃程度？
兽所在野地肥沃程度最高，不同空地肥沃程度不同。
```

这成为核心方向。

引入：

```text
fertilityLevel 0-4
0 荒芜
1 贫瘠
2 普通
3 肥沃
4 丰饶
```

结论：

- 0-100 肥沃度太细，属于假复杂度。
- 0-4 离散等级更适合规则设计和视觉阅读。

---

### V0.7：Rot / Migration Rebase

核心重构：

```text
死亡、腐化、灵、兽清理之间建立循环。
```

关键思路：

```text
死亡 -> Spirit
Spirit 移动 / 死亡 -> MARK
MARK 是被动残留，不再生成 Spirit
Beast 清理 S/M -> WILD + fertility
Human 使用 fertility 建聚落
```

结果：

- 方向正确。
- 但 S 仍可能太强，人类迁徙还不够稳定。

---

### V0.8：Asymmetric Ecology Rebase

关键思想：

```text
人、兽、灵不再是对称物种。
```

三者重新定义：

```text
Human = 高繁殖、高扩张、聚落/迁徙种群
Beast = 自然恢复力的移动代理
Spirit = 人类失败后的短暂病灶
```

结果：

- 模型方向正确。
- 但初版中兽繁殖过强，WILD 爆炸。

---

### V0.8.1：Migration and Beast Brake

修复：

- 人类 settler 不移动 / 不 founding。
- 兽繁殖太快。
- WILD 扩张太快。

结果：

- 兽爆炸被控制。
- 但人类迁徙仍有实现 bug。

---

### V0.8.2：Code Review Movement + Hunting Fix

通过审查 `sim.js` 发现关键 bug：

```text
settler role 名称不匹配。
settler 被普通 Human stay-in-FIELD 逻辑截断。
founding 识别不到带后缀的 settler role。
```

修复：

- 增加 `isSettlerRole(role)` 等 helper。
- settler movement 优先于普通 H stay 逻辑。
- founding 使用统一 role 判断。
- 人类不再普遍害怕兽：
  - 孤人避兽。
  - 群人可以接近 / 驱赶 / 捕猎兽。
- 兽繁殖和 WILD painting 降低。

结果：

- 迁徙终于跑起来。
- 新聚落开始出现。
- 但兽可能被消耗掉，S 仍有瞬发杀伤问题。

---

### V0.8.3：Beast Relocation + Spirit Incubation

修复：

- S 出生后有 incubation。
- dormant S 不能马上感染。
- 人类可以在预兆期间逃跑。
- 兽可以提前清理 dormant S。
- Beast dispersal 改为 relocation-first。
- 兽邻接 M/S 时也能清理，不必踩中。
- death -> Spirit 概率降低。
- 早期死亡不会立刻生成大规模 S。

结果：

- 长时间运行成立。
- 1581 tick 后 H/B 都未灭绝。
- 初版世界底层基本成型。

---

## 6. 目前不要再优先做什么

当前阶段不建议继续优先做：

```text
继续微调 H/B/S 的出生死亡概率
继续加新地表
继续加复杂资源系统
继续加建筑 / 经济 / 多屏地图
继续追求底层自动形成完美大城市或大森林
```

原因：

- 底层已经足够活。
- 继续修底层可能会破坏现在刚形成的平衡。
- 下一步真正缺的是“读懂世界”的解释层。

---

## 7. 下一阶段：Macro World Layer / 世界解释层

### 7.1 目的

把底层格子状态翻译成玩家能理解的世界结构。

底层数据：

```text
H/B/S 单位
F/W/M/. 地表
fertility
birth/death/conversion/migration events
recent tick history
```

上层识别：

```text
settlement
abandoned settlement
beast recovery zone
spirit outbreak
spirit scar / haunted ruin
migration route
human-beast frontier
wild restoration zone
overloaded farmland
new village
```

显示方式：

```text
地图 icon
区域边界
地名
传闻
事件入口
NPC 说明
任务 hook
```

---

## 8. 值得识别的宏观模式

### 8.1 Settlement / 人类聚落

识别条件初版：

```text
FIELD 连通块面积 >= 8
附近 H 数量 >= 3
过去 N tick 内 H/F 稳定存在
M/S 压力不高
```

可分状态：

```text
new_settlement
stable_settlement
growing_settlement
overloaded_settlement
declining_settlement
abandoned_settlement
```

指标：

```text
fieldArea
population
avgFieldFertility
recentBirths
recentDeaths
recentSettlerDepartures
nearbyMark
nearbySpirit
```

图标建议：

```text
小屋
村庄
城镇
破屋
营火
小旗
```

玩家功能：

```text
补给
交易
传闻
任务
安全区
人口变化反馈
```

---

### 8.2 Beast Recovery Zone / 兽恢复区

识别条件不应只看 B 数量，而应看兽的功能痕迹：

```text
最近 N tick 内：
beastAuraMarksCleaned 多
beastRelocations 多
WILD 增加
M 减少
fertility 上升
```

状态：

```text
beast_trail
active_recovery
wild_restoration
wild_frontier
beast_habitat
```

图标建议：

```text
兽爪
草芽
野草
兽径
树芽
```

玩家功能：

```text
恢复资源
野地探索
兽类事件
猎场
净化后的遗址
```

---

### 8.3 Spirit Outbreak / 灵灾

识别条件：

```text
最近 N tick 内：
spiritsCreatedByHumanDeath > 0
spiritTrailMarksCreated > 0
H_to_S > 0
humanDeathsToSpirit > 0
M 短时间增长
dormantSpirits 或 activeSpirits 出现
```

状态：

```text
warning
incubating
active_outbreak
contained
aftermath
scar
```

图标建议：

```text
紫雾
幽光
裂痕
警告符
祭痕
```

玩家功能：

```text
危险区
限时事件
救援
调查
遗物
腐化谜题
```

---

### 8.4 Abandoned Settlement / 废弃聚落

识别条件：

```text
FIELD 残留
H 很少或没有
M 较高
过去曾经是 settlement
```

状态：

```text
recently_abandoned
haunted_ruin
reclaimed_by_wild
resettled
```

图标建议：

```text
破屋
废墟
倒旗
枯井
```

玩家功能：

```text
探索
历史痕迹
灵灾线索
遗物
重新定居点
```

---

### 8.5 Migration Corridor / 迁徙路线

识别条件：

```text
recent settlerMoves 高频路径
settlementFoundings 沿线出现
旧聚落人口下降
新聚落人口上升
```

状态：

```text
active_route
old_route
dangerous_route
pilgrim_trail
```

图标建议：

```text
脚印
小旗
路标
临时营火
```

玩家功能：

```text
旅人 NPC
护送事件
迁徙队伍
补给点
路线风险
```

---

### 8.6 Human-Beast Frontier / 人兽边界

识别条件：

```text
FIELD/H 与 WILD/B 活动区邻近
beastDispersals / beastRelocations 较多
fieldTrampled 或 marksCleanedByBeast 较多
人类移动靠近 B
```

状态：

```text
hunting_ground
contested_frontier
grazing_edge
wild_border
```

图标建议：

```text
交叉旗
兽爪 + 田地
猎弓
边界桩
```

玩家功能：

```text
狩猎
冲突调停
资源采集
危险边界
开垦任务
```

---

## 9. 判断宏观模式是否值得显示的标准

### 9.1 空间连续性

必须形成可指认的区域、连通块或路径。

```text
玩家能说：这里是一片东西。
```

### 9.2 时间持续性

不能一帧出现一帧消失。

建议至少：

```text
持续 20-50 tick
或被记录为历史事件
```

### 9.3 功能差异

不同 icon 必须影响玩家行为。

例如：

```text
聚落 = 补给 / 传闻
灵灾 = 危险 / 调查
兽径 = 资源 / 野地
废村 = 探索 / 历史
迁徙路线 = 旅人 / 事件
```

### 9.4 状态变化

区域应有生命周期：

```text
新生 -> 稳定 -> 过载 -> 衰败 -> 废弃 -> 被自然恢复 -> 再定居
```

### 9.5 可命名性

如果一个区域不能被命名，它就还不够宏观。

例子：

```text
北田村
旧印地
兽走过的草原
南边废村
新开垦地
暮草径
```

---

## 10. Macro World Layer 的实现建议

### Step 1：区域识别 JSON

先不要急着做 UI，先输出 JSON：

```json
{
  "regions": [
    {
      "id": "settlement_01",
      "type": "settlement",
      "state": "stable",
      "center": [12, 8],
      "size": 24,
      "population": 9,
      "fieldArea": 31,
      "avgFertility": 2.3,
      "risk": "low"
    },
    {
      "id": "beast_recovery_01",
      "type": "beast_recovery_zone",
      "state": "active",
      "center": [28, 15],
      "recentCleanedMarks": 5,
      "wildGrowth": 12
    }
  ],
  "events": [
    {
      "type": "spirit_outbreak",
      "state": "contained",
      "center": [19, 11],
      "age": 17,
      "severity": "medium"
    }
  ]
}
```

---

### Step 2：图标层

一个区域只显示一个 icon，不要每格显示。

可选 icon 类型：

```text
settlement：房子
new_settlement：小旗
declining_settlement：破屋
abandoned_settlement：废墟
beast_recovery：草芽 / 兽爪
spirit_outbreak：紫雾
spirit_scar：裂痕
migration_route：脚印
frontier：交叉旗
```

---

### Step 3：历史记忆层

不要只看当前帧，还要保留区域历史：

```text
这个地方过去是不是聚落？
这里是否发生过灵灾？
这里是否曾被兽净化？
这里是否反复被人类定居？
```

这会让世界有“历史厚度”。

---

### Step 4：轻微反作用

等识别层稳定后，再让宏观状态轻微影响底层。

比如：

```text
稳定聚落：H 抵抗 S 稍强
兽恢复区：M 衰退稍快
废村：更容易出现传闻 / 遗物，不一定改变底层
迁徙路线：settler 稍微更容易沿旧路走
```

注意：

```text
不要让宏观层接管底层。
它应该是解释和轻微引导，不是硬脚本。
```

---

## 11. 下一步最适合给 Codex 的任务方向

不要叫：

```text
V0.9 rule tuning
```

而叫：

```text
V0.9 Macro World Layer
```

任务目标：

```text
在当前 V0.8.3 sim.js 基础上，新增宏观区域识别器。
不改底层生态规则。
每隔 N tick 扫描当前 world 和 recent events。
输出 regions/events JSON。
先显示简单 icon，后续再做 UI 美化。
```

Codex 应该做的第一版：

1. 新增 `macro.js` 或在 `sim.js` 里新增 macro functions。
2. 每 25 tick 运行一次 `analyzeMacroWorld(world, recentFrames)`。
3. 识别至少：
   - settlement
   - abandoned_settlement
   - beast_recovery_zone
   - spirit_outbreak / spirit_scar
   - migration_route
   - human_beast_frontier
4. 在 JSON export 中加入 `macroWorld` 字段。
5. 在 UI 上可选显示 icon overlay。

---

## 12. 当前项目文件脉络

已有重要文件包括：

### 规则 / 文档

```text
TRI_SPECIES_WORLD_SIM_RULES.md
TRI_SPECIES_WORLD_SIM_READABLE_CN.md
AGENTS.md
README_DOCS.md
```

### JSON 导出相关

```text
TRI_SPECIES_JSON_EXPORT_SPEC.md
CODEX_ADD_JSON_EXPORT_PROMPT.md
README_JSON_EXPORT_ADDON.md
```

### 重要 Codex prompt

```text
CODEX_V0_2_STABILIZATION_PROMPT.md
CODEX_V0_3_POPULATION_DYNAMICS_PROMPT.md
CODEX_V0_4_FRONTIER_FLOW_PROMPT.md
CODEX_V0_5_LIFECYCLE_GROUPS_PROMPT.md
CODEX_V0_6_FERTILITY_MIGRATION_PROMPT.md
CODEX_V0_7_ROT_MIGRATION_REBASE_PROMPT.md
CODEX_V0_7_1_ROT_CONTAINMENT_COMBINED_PROMPT.md
CODEX_V0_8_ASYMMETRIC_ECOLOGY_REBASE_PROMPT.md
CODEX_V0_8_1_MIGRATION_AND_BEAST_BRAKE_PROMPT.md
CODEX_V0_8_2_CODE_REVIEW_MOVEMENT_HUNTING_FIX_PROMPT.md
CODEX_V0_8_3_BEAST_RELOCATION_SPIRIT_INCUBATION_PROMPT.md
```

当前应该以 V0.8.3 为准，不要回到旧版本规则。

---

## 13. 给新聊天的启动文本

可以直接把下面这段复制到新聊天里：

```text
我正在做一个 40×25 单屏三族世界模拟原型，当前版本大约是 V0.8.3。它已经不是单纯细胞自动机，而是一个可长期运行的世界底层。

核心元素：

单位：
- H = Human，人类
- B = Beast，兽
- S = Spirit，灵

地表：
- . = EMPTY
- F = FIELD，人类田地 / 聚落空间
- W = WILD，野地 / 自然恢复空间
- M = MARK，腐化 / 灵痕 / 死亡痕迹
- # = BLOCK

当前稳定下来的系统定位：

1. 人类
- 高繁殖、高扩张。
- 会在 FIELD 上形成聚落。
- 聚落强盛或危机时会派出 settler。
- settler 会寻找高肥沃 WILD / EMPTY 建立新 FIELD。
- 人类群体可以驱赶 / 捕猎兽，孤立者较危险。
- 聚落会因为土地消耗、死亡、M/S 压力而衰落或迁徙。

2. 兽
- 不是普通会老死的种群，而是自然恢复力的移动代理。
- 默认 random walk。
- 被人类驱赶时优先 relocation，不直接消失。
- 会恢复 fertility、制造 / 维护 WILD。
- 会清理 M 和 S。
- 是稳定净化空间的力量。

3. 灵
- 主要来自人类死亡 / 聚落失衡。
- 不从 M 被动生成。
- S 出生后有 incubation，前几 tick 只是危险预兆，不能立刻感染人。
- 人类在 incubation 期间有机会逃走或迁徙。
- 成熟 S 会移动并留下 M，但寿命短，会被兽清理。
- 灵是短暂病灶，不是常驻种群。

最新长 recording 结果：
- 系统能跑到 1581 tick，H 和 B 都没有灭绝。
- 初始 H=24, B=18, S=0；最终 H=45, B=8, S=0。
- 初始 F=47, W=122, M=37；最终 F=195, W=18, M=17。
- 说明底层生态已经能维持，但后期偏向人类 FIELD 扩张，WILD 和兽较少。
- 系统出现了迁徙、新聚落、兽净化、短暂灵灾等涌现现象。

现在新的设计目标不是继续修 bug，而是设计 Macro World Layer：
- 从底层 H/B/S/F/W/M 格子中识别宏观区域。
- 例如：人类聚落、废弃聚落、兽恢复区、灵灾遗址、迁徙路线、人兽边界、野地复苏区。
- 然后用 icon、区域标签、地图事件、传闻、地名等方式把它们表现成类似初版《塞尔达》的动态世界地图。

我希望讨论：
1. 应该如何定义这些宏观模式？
2. 每种模式的识别标准是什么？
3. 哪些模式值得显示成地图 icon？
4. 如何避免底层噪声直接变成视觉噪声？
5. 宏观模式是否应该反过来轻微影响底层模拟？
```

---

## 14. 当前讨论的核心转折

这次聊天已经完成了一个重要阶段：

```text
从“怎样让三族不崩”转向“怎样把底层涌现读成世界”。
```

也就是说，接下来不再主要问：

```text
为什么人会死？
为什么兽会爆？
为什么灵太强？
```

而是问：

```text
哪里是一个地方？
哪里发生过事情？
哪些区域值得命名？
哪些事件值得玩家看见？
底层变化怎样变成地图语义？
```

这就是后续优化的主线。
