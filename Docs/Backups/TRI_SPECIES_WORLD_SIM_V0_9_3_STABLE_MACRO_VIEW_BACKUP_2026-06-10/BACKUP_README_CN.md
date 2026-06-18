# V0.9.3 Stable Macro View Backup

创建日期：2026-06-10

这是三族单屏细胞世界模拟在 `V0.9.3_MACRO_VIEW_STABILITY` 阶段的稳定备份。

## 备份定位

这一版可以先视为“当前宏观视图阶段的可保留成果”：

- Macro View 已经能显示 settlement / wild recovery / frontier / route 等宏观结构。
- Debug 标记默认关闭，画面比前几轮更干净。
- Beast / wild recovery 的宏观显示已经比 V0.9.2 更稳定。
- 这一版还不是最终世界表达层，只是适合作为下一阶段之前的冻结点。

## 目录说明

```text
RootFiles/
```

当前可运行原型的根目录文件备份，包括 `index.html`、`style.css`、`sim.js`、`README.md`、规则文件和导出说明。

```text
Docs/
```

项目说明、阶段总结、规则副本和中文可读说明。

```text
Docs/Tasks/
```

历次给执行者 Codex 的任务文件。

```text
Docs/Plan Memory/
```

项目长期记忆文件。

```text
tests/
```

当前测试脚本备份。

```text
Recordings/
```

本阶段用于判断“可以先这样”的录制结果：

```text
tri_species_recording_ticks_0000_0508.json
```

## 如何运行备份版

直接打开：

```text
RootFiles/index.html
```

如果需要把备份版恢复成主项目版本，可以把 `RootFiles/` 里的文件复制回项目根目录。

## 下一阶段入口

建议新窗口先读：

```text
Docs/TRI_SPECIES_WORLD_SIM_V0_9_3_STAGE_SUMMARY_CN.md
```

下一阶段建议命名为：

```text
V1.0 World Presentation Layer / 玩家可读世界层
```

核心目标不是继续无限微调底层生态，而是让玩家更容易看懂世界正在发生什么。
