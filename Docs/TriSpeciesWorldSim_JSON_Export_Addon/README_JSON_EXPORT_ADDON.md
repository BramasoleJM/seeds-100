# JSON Export Add-on

This folder contains two files:

```text
TRI_SPECIES_JSON_EXPORT_SPEC.md
```

Design / implementation specification for exporting simulation JSON.

```text
CODEX_ADD_JSON_EXPORT_PROMPT.md
```

Prompt to paste into Codex after the first demo is implemented.

## Purpose

The export feature lets the designer send back a `.json` file for analysis.

A useful report should include:

```text
- recording JSON
- tick range
- parameters
- what looked wrong visually
```

Example:

```text
ticks 0-300
default params
problem: Spirit dies out too quickly around tick 180
```
