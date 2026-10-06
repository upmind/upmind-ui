---
id: docs-mod-dependants
paths:
  - '**/modules/**/docs/foundation.md'
---
# Upmind binding

- The import graph is `graphify-out/graph.json`. Use its cross-module import edges for the weights.
- Direction check: `grep -rl 'from "../<module>"' packages/headless/src/modules/<other>/`.
- Leave out `query` (transport), `routing` (navigation) and the UI-internal helpers `datamanager` and `client-vue`.
