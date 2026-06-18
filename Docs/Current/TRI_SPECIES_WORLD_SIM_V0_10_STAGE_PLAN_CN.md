# Tri-Species WorldSim V0.10 阶段计划

> 用途：记录当前下一阶段的执行方向。  
> 状态：计划中，尚未实现。  
> 规则源文件仍然是根目录 `TRI_SPECIES_WORLD_SIM_RULES.md`。

---

## 1. 阶段名称

```text
V0.10 Regional Substrate Prototype
```

中文说明：

```text
单屏区域基底原型
```

---

## 2. 阶段目标

在不进入多屏 Zelda-style overworld 的前提下，为当前 `40 x 25` 单屏三族 cellular world 增加一层隐藏地理基底。

这层基底不是剧情脚本，也不是最终地形系统。它只提供软倾向，让底层生态更容易形成可读的大块区域。

核心目标：

```text
地理结构提供倾向。
区域 buff 提供轻量概率偏置。
生态规则仍允许成功、失败、迁徙、崩塌和反转。
Macro View 负责解释最终出现的图案。
```

---

## 3. 推荐新增区域类型

V0.10 只建议加入三种 `regionBias`，外加默认 `none`：

```text
none
basin
refuge
hollow
```

中文含义：

```text
basin  = Settlement Basin / 聚落盆地
refuge = Wild Refuge / 野地庇护区
hollow = Scar Hollow / 灵痕洼地
none   = 普通区域
```

---

## 4. 各区域职责

### 4.1 basin

让 Human / FIELD 更容易形成聚落，但不保证成功。

可见行为应该是：

```text
basin 中更容易初始化 Human / FIELD。
basin 中 FIELD decay 稍慢。
Human 在 basin 中有极轻微稳定性优势。
Human 仍然会消耗 fertility，聚落仍可能失败。
```

### 4.2 refuge

让 Beast / WILD 更容易形成恢复区。

可见行为应该是：

```text
refuge 中更容易初始化 Beast / WILD。
refuge 中 WILD decay 稍慢。
Beast relocation 略偏向 refuge。
EMPTY fertility recovery 略好。
```

### 4.3 hollow

让 MARK / spirit scar 的痕迹更容易被看见，但不让 Spirit 成为常驻种群。

可见行为应该是：

```text
hollow 中更容易初始化少量 MARK 或 old FIELD。
hollow 中 MARK decay 稍慢。
Human 在 hollow 中稳定性略差。
Beast 仍然可以清理 hollow，但需要时间。
```

---

## 5. 区域韧性

V0.10 可以加入低强度 Regional Resilience，但不能写成强制复活。

允许方向：

```text
当 Human 极低时，如果 basin 中仍有适宜痕迹，极低概率生成 1 个 Human。
当 Beast 极低时，如果 refuge 中仍有 WILD / 高 fertility，极低概率生成 1 个 Beast。
当 MARK 极少时，如果 hollow 中存在失败痕迹，极低概率生成 1 个 MARK。
```

禁止方向：

```text
固定时间刷种族。
无视环境强制复活。
让 Spirit 直接从 hollow 稳定刷新。
让区域 buff 覆盖底层生态失败。
```

---

## 6. 推荐实现顺序

1. 先更新 `TRI_SPECIES_WORLD_SIM_RULES.md`，写入 V0.10 规则。
2. 为 cell 增加 `regionBias` 字段。
3. 增加一个单屏 substrate 模板。
4. 初始化时让 basin/refuge/hollow 影响 FIELD/WILD/MARK 与单位分布。
5. 轻量接入 terrain decay、fertility dynamics、Beast relocation。
6. 让 Macro View 或新 view mode 显示 substrate 轮廓。
7. 更新 JSON export 和测试。

---

## 7. 不要在 V0.10 加入

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

---

## 8. 验收标准

运行到 300 / 700 ticks 后观察：

```text
Human 不应该总是灭绝。
Beast 不应该总是灭绝。
Spirit 不应该成为稳定常驻种族。
basin 应该经常形成 settlement，但允许失败。
refuge 应该经常形成 WILD / Beast recovery 区。
hollow 应该经常保留 MARK / scar / ruin 感。
狭窄通道附近应该有机会形成 frontier。
Macro View 应该呈现连续区域，而不是散点噪声。
区域韧性事件应该稀少、可解释、可记录。
```

