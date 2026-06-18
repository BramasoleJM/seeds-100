# Tri-Species WorldSim V0.9.3 阶段总结

> 用途：记录当前可封存版本，作为下一阶段设计和新聊天窗口的接力资料。
> 当前阶段目标：完成单屏三族生态底层、宏观解释层、Macro View 的第一轮稳定化。

---

## 1. 当前可封存版本

```text
Rules version: TRI_SPECIES_WORLD_SIM_V0.9.3_MACRO_VIEW_STABILITY
Date: 2026-06-10
Status: 可作为当前阶段稳定备份
```

当前版本拆分：

```text
Ecology base: TRI_SPECIES_WORLD_SIM_V0.8.3_BEAST_RELOCATION_SPIRIT_INCUBATION
Readability patch: TRI_SPECIES_WORLD_SIM_V0.8.4_READABLE_MACRO_PATTERNS
Macro layer: TRI_SPECIES_WORLD_SIM_V0.9_MACRO_WORLD_LAYER
Display patch: TRI_SPECIES_WORLD_SIM_V0.9.1_MACRO_VIEW_FIELD_DECAY
Influence view patch: TRI_SPECIES_WORLD_SIM_V0.9.2_INFLUENCE_MACRO_VIEW
Stability patch: TRI_SPECIES_WORLD_SIM_V0.9.3_MACRO_VIEW_STABILITY
```

---

## 2. 当前项目定位

这是一个 40x25 单屏三族世界模拟原型。

它已经不只是细胞自动机，而是一个可以作为动态世界底层的模拟器。

当前三族定位：

```text
Human = 扩张、聚落、繁殖、迁徙、土地消耗。
Beast = 移动的自然恢复 / 净化力量。
Spirit = 人类失败或死亡引发的短暂灾变。
```

当前地表含义：

```text
. = EMPTY，空地
F = FIELD，人类组织过的土地 / 聚落空间
W = WILD，自然恢复空间
M = MARK，死亡 / 灵灾 / 腐化痕迹
X = BORDER，边界冲突残留
# = BLOCK，固定阻挡
```

---

## 3. 当前阶段已经完成的能力

### 3.1 底层生态

```text
人类可以形成 FIELD 聚落。
聚落会因肥力、拥挤、MARK / Spirit 压力产生迁徙。
Settler 可以寻找 EMPTY / WILD 高肥力区域并建立新 FIELD。
兽不会作为普通死亡种群运作，而是移动恢复 / 清理力量。
兽可以 relocation，可以清理 MARK / Spirit，并留下 WILD 恢复痕迹。
Spirit 是短暂 outbreak，不是常驻种群。
Spirit 有 incubation，出生后不会立刻感染。
MARK 不再被动生成 Spirit，而是作为残留 / scar 存在。
```

### 3.2 宏观解释层

V0.9 增加了 `macroWorld`：

```text
settlement
abandoned_settlement
beast_recovery_zone
spirit_outbreak
spirit_scar
migration_route
human_beast_frontier
```

导出 JSON 包含：

```text
macroWorld
macroFrames
frames[n].macro
keyframes[n].macroWorld
```

### 3.3 Macro View

当前 UI 有两种视图：

```text
Cell View = 低层格子细节视图，用于调试模拟规则。
Macro View = 宏观地图视图，用于阅读区域、路线、边界和恢复区。
```

V0.9.3 后：

```text
Beast recovery zone 使用软评分，不再被整体平均肥力硬过滤。
曾经出现的 Beast recovery zone 会短暂保留为 quiet_habitat / fading_recovery。
Macro View 主要靠区域色块、边界、路线显示。
旧字母/符号图标已经变成 Show Macro Debug Icons，默认关闭。
```

---

## 4. 最近一次验收结果

最近验收文件：

```text
tri_species_recording_ticks_0000_0508.json
```

结果概要：

```text
Initial:
H = 24
B = 18
S = 0
FIELD = 50
WILD = 121
MARK = 17

Final at tick 508:
H = 105
B = 25
S = 0
FIELD = 286
WILD = 43
MARK = 11
```

这说明：

```text
人类没有灭绝。
兽没有灭绝。
Spirit 仍然是阶段性事件。
MacroWorld 能识别 settlement、beast_recovery_zone、frontier、route。
Macro View 的 wildRecovery 已经可以出现。
Debug icons 默认关闭。
```

当前可接受的问题：

```text
FIELD 仍然偏强。
WILD 仍然不是大森林式成片，而更像 Beast influence / recovery 区。
Macro View 仍是第一版地图阅读模式，不是最终 UI。
区域命名、传闻、地点说明尚未实现。
```

---

## 5. 当前阶段不建议继续优先做的事

```text
继续微调 H/B/S 出生死亡概率。
继续追求底层自动形成完美城市 / 森林。
新增地表类型。
新增资源经济。
新增建筑 / NPC / 任务。
新增多屏 Zelda 地图。
让 macro 层反向强控制底层生态。
```

当前底层已经足够作为下一阶段输入。

---

## 6. 下一大阶段建议

建议新阶段名称：

```text
V1.0 World Presentation Layer / 玩家可读世界层
```

目标：

```text
把 macroWorld 翻译成玩家能读懂的动态地图信息。
```

重点不是继续调格子，而是设计：

```text
地名
区域摘要
聚落状态
废墟记忆
兽恢复区说明
灵灾遗痕说明
迁徙路线说明
人兽边界事件
地图提示 / 传闻 / 事件入口
```

第一版建议仍然不加 NPC、任务、经济，只做：

```text
点击 macro region -> 显示区域信息面板
导出 JSON -> 包含 readableSummary
Macro View -> 可以看懂哪里是什么地方
```

---

## 7. 新聊天启动文本

可以复制下面这段到新窗口：

```text
我正在做一个 40x25 单屏三族世界模拟原型，当前阶段稳定版本是 V0.9.3 Macro View Stability。

底层生态已经基本稳定：
- Human = 扩张、聚落、迁徙。
- Beast = 移动的自然恢复 / 净化力量。
- Spirit = 人类失败或死亡引发的短暂灾变。
- FIELD = 人类组织过的土地。
- WILD = 自然恢复空间。
- MARK = 死亡 / 灵灾 / 腐化痕迹。

当前已经实现：
- V0.8.3 Beast relocation + Spirit incubation。
- V0.8.4 Readable macro pattern shaping。
- V0.9 Macro World Layer，导出 macroWorld。
- V0.9.1 Macro View + abandoned FIELD decay。
- V0.9.2 Influence Macro View。
- V0.9.3 Macro View Stability，Beast recovery 使用软评分和 fading/quiet 状态，旧 debug icons 默认关闭。

最近验收 recording 跑到 tick 508：
- H 24 -> 105
- B 18 -> 25
- S 0 -> 0
- FIELD 50 -> 286
- WILD 121 -> 43
- MARK 17 -> 11

当前判断：
这个版本可以作为阶段成果备份。
下一阶段建议做 V1.0 World Presentation Layer / 玩家可读世界层。

我希望讨论：
1. 如何把 macroWorld 区域翻译成玩家能读懂的区域面板？
2. 如何给 settlement / ruin / beast recovery / spirit scar / migration route 命名？
3. 如何生成简短传闻或地图提示？
4. 哪些信息应该显示在 Macro View，哪些应该隐藏在详情面板？
5. 第一版是否只做 UI/文本解释，不反向改底层生态？
```

---

## 8. 备份位置

当前阶段备份建议目录：

```text
Docs/Backups/TRI_SPECIES_WORLD_SIM_V0_9_3_STABLE_MACRO_VIEW_BACKUP_2026-06-10
```

备份 zip：

```text
Docs/Backups/TRI_SPECIES_WORLD_SIM_V0_9_3_STABLE_MACRO_VIEW_BACKUP_2026-06-10.zip
```
