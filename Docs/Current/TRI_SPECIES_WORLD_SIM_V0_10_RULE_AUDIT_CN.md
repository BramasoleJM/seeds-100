# TRI_SPECIES_WORLD_SIM V0.10 Rule Audit

## 目的

V0.10.5 审计 V0.10.3 / V0.10.4 的性能与回归修复，确认哪些改动只是显示、导出或性能结构，哪些改动确实影响地图生成或生态规则。

本次补丁不新增地表、种族、世界观机制、多屏地图、保存读取或外部依赖。

## Display / Export Only

- V0.10.3 将 recording frames 改为紧凑格式，完整 `terrainRows` / `unitRows` 只保留在 keyframes 和 snapshot。
- `regionalSubstrate` 在 recording 中只导出一次，不再每帧重复。
- Macro View / Substrate + Macro View 的 masks 缓存属于显示层，不改变格子状态。
- V0.10.5 新增 Macro Timeline JSON，属于独立导出层，不改变模拟规则。
- V0.10.5 lightweight macro display frame 每 5 tick 刷新一次，仅影响可视化连续性。

## Performance Only

- V0.10.3 将 heavy `macroWorld` analysis 限制为 `MACRO_ANALYSIS_INTERVAL = 25`。
- V0.10.3 / V0.10.4 保留 reachable scan cache，避免同一 tick 内重复 flood fill。
- V0.10.4 中 Beast rot attraction 先做 cheap nearby rot check，再按需进行 BLOCK-aware reachable search。
- V0.10.5 不恢复 every-tick heavy macro analysis，避免重新引入性能问题。

## Map Generation Behavior

- BLOCK density target 被收紧为默认生成约 120-170 个 BLOCK，并避免常规超过 180。
- `choke_pass` / `barrier_edge` 合计限制为最多 3 个 logical screen cells。
- 至少 3 个 logical screen cells 应保持 mostly open。
- 至少一个 basin 和一个 refuge 应保持较宽敞内部空间。
- 这些改动会影响初始地图形状，但目标是恢复 V0.10.2 的可走性和可读性，而不是新增地形类型。

## Ecology Behavior

- Refuge WILD decay protection 被保留但软化，避免 refuge 过度放大 Beast / WILD 优势。
- Refuge Beast relocation bonus 被降低，保留生态倾向但减少单一区域吸附。
- Hollow MARK persistence 被略增强，让 scar 在 Beast cleanup 后更可见。
- Settler target search 使用半径 6 reachable search，影响迁徙可达范围但保留 BLOCK-aware 意图。
- Beast rot sensing 仍然 BLOCK-aware，但通过 cheap check 降低热路径成本。
- V0.10.5 本身不改变 H / B / S 繁衍、死亡、移动、转化或地表改写常量。

## Macro Interpretation Behavior

- Macro recovery filtering 会过滤低置信、重叠、显示价值低的 Beast recovery regions。
- V0.10.4 保留有价值的 recovery zones，避免 Macro View 变空。
- Heavy macro analysis throttling 意味着 stable ids、routes、memories、events 只在分析 cadence 更新。
- V0.10.5 新增 lightweight display layer，使 on-screen masks 更连续，但 stable macro ids 仍来自 heavy analysis。

## Kept

- Compact recording。
- BLOCK-aware strategic sensing。
- Screen-cell substrate。
- Runtime intervention。
- V0.10.4 overblocking repair。
- Heavy macro analysis throttling。
- Useful macro recovery visibility。

## Reverted Or Softened

- V0.10.4 已软化 refuge Beast / WILD 增益，避免 refuge 过强。
- V0.10.4 已降低 heavy archetype 过度出现，避免地图太堵。
- V0.10.5 没有进一步改生态或生成常量。

## Known Remaining Risks

- Lightweight macro display frame 是视觉摘要，不保存 stable place ids。
- Routes 和 retained memories 仍依赖最近一次 heavy macroWorld，因此路线语义可能每 25 tick 才更新。
- Default BLOCK target 是生成指导，不是所有自定义参数下的硬性保证。
- Fake-DOM 性能测试不能完全代表真实浏览器帧率。
