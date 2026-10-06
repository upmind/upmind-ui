---
id: q-reuse-existing
paths:
  - '**/*.ts'
  - '**/*.tsx'
  - '**/*.vue'
  - '**/*.js'
  - '**/*.mjs'
---
# Upmind monorepo bindings

- Search with the graphify MCP first: `query_graph`, or `get_node` on the name.
- The plugin's `graphify-gate.sh` denies a write that declares an exported type name the repo already has. Its message names where that type lives.
- When two modules need one type, move it to `@upmind-automation/types`.
- A module may export a per-module convention name that another module also exports. The gate reads that list from `_gate-bindings/code-quality.companion.md`.
