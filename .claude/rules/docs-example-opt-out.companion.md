---
id: docs-example-opt-out
paths:
  - '**/*.md'
---
# Upmind binding

The gate is `docs/corpus/gates/gate-examples.mjs`. It type-checks every `ts`, `tsx`, `js`, `jsx`, `vue`, `typescript` and `javascript` fence against the real workspace packages. The opt-out marker is the line immediately before the fence:

```markdown
<!-- corpus-example: skip — <reason> -->
```
