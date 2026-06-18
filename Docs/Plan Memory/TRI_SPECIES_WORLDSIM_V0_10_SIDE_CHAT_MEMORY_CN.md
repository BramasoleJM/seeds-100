# TRI_SPECIES_WORLDSIM V0.10 侧聊记忆与新阶段规划

日期：2026-06-11

用途：这份文件记录一次关于项目下一阶段方向的侧聊脉络，用于带到新窗口继续规划或交给执行者 Codex。它不是当前规则源文件；真正改规则时仍应先更新 `TRI_SPECIES_WORLD_SIM_RULES.md`。

---

## 1. 当前阶段判断

当前项目已经完成到 `TRI_SPECIES_WORLD_SIM_V0.9.3_MACRO_VIEW_STABILITY`。

已有阶段可以概括为：

1. `V0.8.3`：三物种生态底层成型。
   - Human 会迁徙、扩张、制造 `FIELD`。
   - Beast 会制造 `WILD`、清理 `MARK` / `Spirit`，作为生态恢复力量存在。
   - Spirit 不是稳定种族，而是由 Human 失败、死亡、压力触发的短期爆发与痕迹。
   - 地形包含 `EMPTY`、`FIELD`、`WILD`、`MARK`、`BORDER`、`BLOCK`。

2. `V0.8.4`：为宏观可读性做了底层调形。
   - 目标不是增加剧情，而是让 Human settlement、Beast recovery、Spirit scar 等模式更容易被肉眼看见。

3. `V0.9`：加入 Macro World Layer。
   - 宏观层开始识别 settlement、abandoned field、beast recovery、spirit outbreak、spirit scar、migration route、frontier 等模式。
   - Macro view 的职责是把底层格子噪点归纳成更连续、更可解释的区域。

4. `V0.9.1` 到 `V0.9.3`：Macro view 稳定性和美观修正。
   - 废弃田地不再永久保留为田地色。
   - Beast recovery 在 macro view 中的闪现问题被关注并部分稳定。
   - 早期 debug 标记需要隐藏或清理，避免破坏美观。

当前结论：

项目已经适合进入一个新阶段，但这个阶段不应该直接跳到完整 Zelda-style multi-screen overworld。更稳妥的下一步是：

```text
V0.10 Regional Substrate Prototype
```

也就是在单屏 cellular world 中加入 Zelda-like 的地理基底和区域倾向。

---

## 2. Zelda 初代地图带来的启发

用户提供了一张《塞尔达传说》初代 overworld 地图作为最终目标参考。

这张地图的关键启发不是“马上复刻多屏地图”，而是：

1. 世界需要硬地理骨架。
   - 山脉、河流、湖泊、海岸、墙体、洞口、桥、狭窄通道等。
   - 这些结构决定移动路径和区域边界。

2. 世界需要大块材料区域。
   - 沙地、森林、墓地、山地、湖泊、荒地、草地等不是散点，而是一团一团的可读形状。

3. 世界需要兴趣点和痕迹。
   - 洞穴、入口、墓碑、雕像、秘密点、怪物聚集区等。
   - 对当前项目来说，未来可对应 monument、ruin、scar、settlement 等。

4. 当前项目的生态系统应该适配到这种世界骨架中。
   - Human 在可居住空间留下 `FIELD` / 聚落痕迹。
   - Beast 在野地区域留下 `WILD` / 恢复痕迹。
   - Spirit 在失败、死亡、废弃区域留下 `MARK` / 灵痕废墟。

重要限制：

V0.10 仍然不要做多屏 Zelda 世界，不要做 NPC、任务、剧情、经济、建筑系统或最终美术。

---

## 3. 关于“想要的画面能否精准涌现”的判断

用户提出一种目标画面：

```text
一个山谷里形成聚落
河对岸形成兽恢复区
狭窄通道成为人兽边界
被封闭角落成为灵痕废墟
```

讨论后的判断：

这个画面可以作为方向，但不应该被硬脚本精准生成。

原因：

1. 如果完全靠底层随机涌现，很难稳定形成如此具体的构图。
2. 如果完全写死，又会失去这个项目最重要的生态涌现感。
3. 正确方法应该是软约束：
   - 地理结构提供倾向。
   - 区域 buff 提供概率偏置。
   - 生态规则仍允许成功、失败、迁徙、崩塌和反转。
   - Macro layer 再根据结果解释区域意义。

因此，V0.10 的目标不是：

```text
强制山谷必定形成聚落。
强制河对岸必定形成兽区。
强制通道必定成为边界。
强制封闭角落必定成为废墟。
```

而是：

```text
山谷更容易形成聚落。
河对岸的野地更容易恢复 Beast / WILD。
狭窄通道更容易形成 frontier。
封闭角落更容易保留 MARK / scar。
```

---

## 4. 三种区域 buff 的设计

用户希望区域 buff 数量不要太多，先做三种，并希望其中一两种能作为防止世界死局的保底措施。

建议 V0.10 只做三种 region bias：

```text
basin
refuge
hollow
```

中文名：

```text
Settlement Basin / 聚落盆地
Wild Refuge / 野地庇护区
Scar Hollow / 灵痕洼地
```

此外可以有默认区域：

```text
none
```

### 4.1 Settlement Basin / 聚落盆地

定位：

让 Human 更容易形成聚落，但不保证成功。

初始倾向：

- 更容易出现 Human。
- 更容易出现 `FIELD`。
- fertility 可以略高或更稳定。
- 空间形状应偏开放、可居住。

持续 buff：

- `FIELD` decay 稍慢。
- Human reproduction / survival 可以有极轻微优势。
- Human 仍然会消耗 fertility，因此盆地仍可能衰败。

保底机制：

- 当全图 Human 数量极低，例如 `H <= 2`；
- 且 basin 中仍有 `FIELD`、old field 或适宜 fertility；
- 且附近没有强 Spirit pressure；
- 则极低概率生成 1 个 Human。

解释：

这不是“人类凭空复活”，而是残民、迁入者、避难者、重新定居者的抽象。

限制：

- 概率必须低。
- 不应该让 Human 永远稳定无脑扩张。
- 不应该覆盖 Human 失败带来的废墟和灵痕。

### 4.2 Wild Refuge / 野地庇护区

定位：

让 Beast / WILD 更容易形成可见的恢复区。

初始倾向：

- 更容易出现 Beast。
- 更容易出现 `WILD`。
- fertility 可以偏高，适合自然恢复。
- 空间可以位于河对岸、山后、边缘地带或被阻隔的区域。

持续 buff：

- `WILD` decay 更慢。
- Beast relocation 可以轻微偏向 refuge。
- EMPTY fertility recovery 可以略好。
- Beast 对 MARK / Spirit 的清理仍按原有生态逻辑发生。

保底机制：

- 当全图 Beast 数量极低，例如 `B <= 2`；
- 且 refuge 中仍有足够 `WILD` 或高 fertility；
- 且 Human pressure 不高；
- 则极低概率生成 1 个 Beast。

解释：

这代表野性残存、隐蔽种群、生态恢复点。

限制：

- 不应该让 Beast 永远压倒 Human。
- 不应该把 Beast 做成普通刷怪点。

### 4.3 Scar Hollow / 灵痕洼地

定位：

让 Spirit / MARK 的痕迹更容易被看见，但不让 Spirit 成为常驻种族。

初始倾向：

- 可以有少量 `MARK`。
- 可以有 old field 或低 fertility。
- 空间可以是封闭角落、废弃盆地、死路、被山河包围的小区域。

持续 buff：

- `MARK` decay 更慢。
- Human 在这里的稳定性略差。
- Spirit outbreak 后的痕迹更持久。
- Beast 可以逐渐清理这里，但需要时间。

保底机制：

- 不直接生成 Spirit。
- 当全图 `MARK` 很少；
- 且 hollow 中存在 old field、recent death history、低 fertility 或废弃痕迹；
- 则极低概率生成 1 个 `MARK`。

解释：

Scar Hollow 保存的是“发生过失败的地形记忆”，不是凭空刷 Spirit。

限制：

- Spirit 仍应主要来自 Human 失败、死亡、压力。
- 不要让 hollow 变成永久鬼区。

---

## 5. 区域韧性 Regional Resilience

这次讨论中提出了一个重要设计名词：

```text
Regional Resilience / 区域韧性
```

含义：

区域 buff 不只是初始 bias，也可以承担轻度保底，让世界不容易陷入彻底死局。

但区域韧性不能写成强制复活机制。

好的区域韧性：

```text
当某种生态力量几乎消失时，如果世界中仍存在适合它的区域痕迹，就有很低概率重新出现一个种子。
```

坏的区域韧性：

```text
每隔固定时间强制刷出一个种族。
不管环境如何都复活。
复活概率过高，导致灭绝和废墟失去意义。
```

V0.10 推荐：

- basin 为 Human 提供低强度韧性。
- refuge 为 Beast 提供低强度韧性。
- hollow 为 MARK 提供低强度韧性。
- hollow 不直接为 Spirit 提供韧性。

---

## 6. 建议实现方式

### 6.1 新增隐藏 substrate / regionBias 层

每个 cell 除了现有数据外，可以增加一个隐藏区域标记：

```text
regionBias: none | basin | refuge | hollow
```

这层不一定在 normal view 中显示。

Macro view 或新的 hybrid view 可以显示它的轮廓。

### 6.2 单屏模板生成

V0.10 不需要复杂程序地图生成。可以先做一个或几个固定模板。

模板可以包含：

- 一个较开放的 basin。
- 一个被河流或阻隔分开的 refuge。
- 一个半封闭的 hollow。
- 一两个狭窄通道。
- 若干 `BLOCK` 作为山脉、河流、墙体或不可通行边界。

注意：

V0.10 可以继续使用 `BLOCK` 表示不可通行阻隔，不必立刻拆分 mountain / river。

### 6.3 初始化接入 regionBias

初始化时：

- basin 更容易出现 Human / FIELD。
- refuge 更容易出现 Beast / WILD。
- hollow 更容易出现 MARK / old FIELD。

这些应是概率倾向，不是绝对结果。

### 6.4 规则接入 regionBias

只做轻量接入：

- basin：FIELD decay 稍慢，Human 稳定性略高。
- refuge：WILD decay 稍慢，Beast relocation / fertility recovery 略有优势。
- hollow：MARK decay 稍慢，Human 稳定性略差，Spirit 痕迹更持久。

不要在 V0.10 大幅重写 Human / Beast / Spirit 的核心规则。

### 6.5 Macro view 接入

Macro view 应该能显示：

- basin 是否形成 settlement。
- refuge 是否形成 beast recovery。
- hollow 是否形成 spirit scar / ruin。
- 狭窄通道是否形成 frontier。

可以考虑新增一个显示模式：

```text
Normal View
Macro View
Substrate + Macro View
```

第三种模式用于观察：

```text
地理基底如何影响生态涌现。
```

---

## 7. 不要在 V0.10 加入的内容

V0.10 仍然不要加入：

```text
Zelda-style multi-screen map
screen-to-screen propagation
tarot mechanics
NPCs
quests
story events
resource economy
village buildings
specific race names
final art
save/load
network calls
external libraries
```

如果需要加入新视觉元素，也应先抽象为规则和 grid behavior。

例如：

好的方向：

```text
BLOCK 形成通道。
basin 更容易保留 FIELD。
refuge 更容易保留 WILD。
hollow 更容易保留 MARK。
```

不适合当前阶段：

```text
村庄大厅。
商店 NPC。
神庙剧情。
装备系统。
任务链。
```

---

## 8. 文档整理建议

建议冻结 V0.9.3 作为旧阶段完成点。

可以归档的文件：

```text
Docs/Tasks/CODEX_CRASH_FIX_PROMPT.md
Docs/Tasks/CODEX_V0_2_*.md
Docs/Tasks/CODEX_V0_3_*.md
Docs/Tasks/CODEX_V0_4_*.md
Docs/Tasks/CODEX_V0_5_*.md
Docs/Tasks/CODEX_V0_6_*.md
Docs/Tasks/CODEX_V0_7_*.md
Docs/Tasks/CODEX_V0_8_*.md
Docs/Tasks/CODEX_V0_8_2_*.md
Docs/Tasks/CODEX_V0_8_3_*.md
```

近期任务先保留为活跃历史：

```text
Docs/Tasks/CODEX_V0_8_4_READABLE_MACRO_PATTERNS_PROMPT.md
Docs/Tasks/CODEX_V0_9_MACRO_WORLD_LAYER_PROMPT.md
Docs/Tasks/CODEX_V0_9_1_MACRO_VIEW_FIELD_DECAY_PROMPT.md
Docs/Tasks/CODEX_V0_9_2_INFLUENCE_MACRO_VIEW_PROMPT.md
Docs/Tasks/CODEX_V0_9_3_MACRO_VIEW_STABILITY_PROMPT.md
```

建议更新的文件：

```text
AGENTS.md
Docs/AGENTS.md
TRI_SPECIES_WORLD_SIM_RULES.md
Docs/TRI_SPECIES_WORLD_SIM_RULES.md
TRI_SPECIES_WORLD_SIM_READABLE_CN.md
Docs/TRI_SPECIES_WORLD_SIM_READABLE_CN.md
README.md
Docs/Plan Memory/TRI_SPECIES_WORLDSIM_MEMORY_CN.md
```

建议新增：

```text
Docs/Tasks/CODEX_V0_10_REGIONAL_SUBSTRATE_PROMPT.md
Docs/TRI_SPECIES_WORLD_SIM_V0_10_STAGE_PLAN_CN.md
Docs/Plan Memory/TRI_SPECIES_WORLDSIM_V0_10_REGIONAL_SUBSTRATE_MEMORY_CN.md
```

---

## 9. 给新窗口的执行原则

新窗口开始时应明确：

1. 当前不是要做完整 Zelda 世界。
2. 当前要做的是单屏 Regional Substrate。
3. 所有新机制必须先写入 `TRI_SPECIES_WORLD_SIM_RULES.md`。
4. 修改代码前必须读 `TRI_SPECIES_WORLD_SIM_RULES.md`。
5. 每个新规则必须能在 grid 上直接看见。
6. 抽象概念必须翻译成直接可见行为。

例如：

抽象说法：

```text
这里是古老废墟。
```

应翻译为：

```text
hollow 区域 MARK decay 更慢。
old FIELD 更容易转成 MARK。
Human 在 hollow 中稳定性略低。
Beast 可以缓慢清理 MARK。
```

抽象说法：

```text
这里是野性恢复区。
```

应翻译为：

```text
refuge 区域 WILD decay 更慢。
Beast relocation 略偏向 refuge。
EMPTY fertility recovery 略高。
```

---

## 10. 推荐 V0.10 任务一句话

```text
在不进入多屏 Zelda 世界的前提下，为当前单屏三物种 cellular world 添加 Regional Substrate：三种隐藏区域 bias、轻量区域 buff、低强度生态韧性保底，并让 macro view 能更清楚地显示这些区域如何影响 Human / Beast / Spirit 的宏观图案。
```

---

## 11. 推荐 V0.10 验收标准

运行到 300 / 700 ticks 后观察：

1. Human 不应该总是灭绝。
2. Beast 不应该总是灭绝。
3. Spirit 不应该成为稳定常驻种族。
4. basin 应该经常形成聚落，但允许失败。
5. refuge 应该经常形成 `WILD` / Beast 恢复区。
6. hollow 应该经常保留 `MARK` / scar / ruin 感。
7. 狭窄通道附近应该有机会形成 frontier。
8. Macro view 应该呈现一团一团的连续区域，而不是散点噪声。
9. 区域韧性事件应该稀少、可解释、可记录。

---

## 12. 推荐给执行者 Codex 的提醒

执行者应避免：

- 把 region bias 写成硬脚本剧情。
- 因为想要漂亮画面而破坏生态模拟。
- 添加过多 region 类型。
- 直接引入 mountain / river / village / monument 等最终系统。
- 把 Spirit 当作稳定刷新的第三种普通种群。

执行者应优先：

- 保持规则简单。
- 保持视觉可读。
- 保持单屏。
- 让地理结构提供倾向，而不是命令结果。
- 让 macro view 解释生态结果，而不是替生态结果造假。

