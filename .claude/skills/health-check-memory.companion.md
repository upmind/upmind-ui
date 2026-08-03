> Companion to the upmind-agent skill /health-check-memory (was /memory-cleanup) — Upmind-monorepo-specific bindings/overrides.

## Phase 7 — graphify output directory binding

This repo already runs graphify: its knowledge graph lives at **`graphify-out/`** (repo root, gitignored), and the `graphify-gate` hook cites that directory. Wherever the base skill says "graphify's output directory", read `graphify-out/`:

- **`.graphifyignore`** — exclude the tool's own output so the graph never indexes itself. Add:
  ```
  graphify-out/
  **/graphify-out/
  ```
- **`.gitignore`** — add `graphify-out/` (alongside `entities.json`).
- **Verify step** — check `graphify-out/GRAPH_REPORT.md`, `graphify-out/graph.html`, `graphify-out/graph.json`; open `graphify-out/graph.html` for the interactive view.

## Phase 7 — repo-specific `.graphifyignore` exclusions

In addition to the base always-exclude list, exclude this repo's Firebase build output:

```
.firebase/
```
