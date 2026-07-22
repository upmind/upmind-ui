> Companion to the upmind-agent skill /health-check-claude-setup — Upmind-monorepo-specific bindings/overrides.

## Knowledge-graph location binding (audit checklist item 1)

This repo's knowledge graph lives under `graphify-out/`. Bind the generic "raw graph JSON" doctrine to these exact paths:

- **Read-deny by name:** the `permissions.deny` proposal MUST name `graphify-out/graph.json` specifically —

  ```json
  { "permissions": { "deny": ["Read(./graphify-out/graph.json)"] } }
  ```

  This is the raw knowledge-graph JSON: a large generated artifact, never a config source, never opened directly (not even to check its size or shape).
- **Read instead:** `graphify-out/GRAPH_REPORT.md` (god nodes + community structure) and navigate `graphify-out/wiki/index.md` rather than raw files.
- **Binding authority:** the repo's own CLAUDE.md rule — "read graphify-out/GRAPH_REPORT.md for god nodes and community structure" / "navigate graphify-out/wiki/index.md instead of reading raw files". This is why `graphify-out/graph.json` is named explicitly in the deny list rather than left as a generic placeholder.
