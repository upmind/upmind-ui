# graphify tooling

Cross-package knowledge-graph builder for the Upmind monorepo. Produces an
interactive HTML graph showing how files and modules import each other, plus
a module-level rollup that collapses files-into-modules for a navigable
architecture map.

Outputs live in the consuming repo's `graphify-out/` directory (gitignored).

## Files

| File | What it does |
| ---- | ------------ |
| `refresh.sh` | Pipeline runner — detect → AST → resolve → build → rollup. Supports `--check` for fast-exit. |
| `resolver.py` | Post-processes graphify's AST output to fix mangled cross-package and relative-import edges, and to handle Vue `<script>` blocks. |
| `module-rollup.py` | Collapses the file-level graph into a module-level graph (~2000 nodes → ~130 modules). |

## Usage

From the monorepo root:

```bash
pnpm graph              # refresh the graph (~3s, no LLM cost)
pnpm graph:check        # silent fast-exit if no source files changed
pnpm graph:open         # open the file-level interactive HTML
pnpm graph:open:modules # open the module-level rollup HTML
```

## Auto-refresh

A husky `post-merge` hook (in `.husky/post-merge`) calls `refresh.sh --check`
when changes land on `develop`. Feature-branch pulls/merges are skipped.

## Dependencies

The first run installs the `graphifyy` Python package automatically (uses
`pip install`, falling back to `--break-system-packages` if needed). If
installation fails the script exits silently so it doesn't break git operations.

## Configuration

Edit the `TARGETS` array in `refresh.sh` to add or remove packages/apps.
Edit `PACKAGE_ALIASES` in `resolver.py` if the monorepo's tsconfig path
aliases change.

## Why a custom resolver?

Graphify's AST extractor has three failure modes for our monorepo:

1. TS path aliases like `@upmind-automation/headless` get collapsed to bare
   `headless` (no such node exists → edge dropped).
2. Relative imports like `../system` get concatenated into the file's own
   directory path (wrong target → edge dropped).
3. Vue `<script>` blocks aren't always parsed.

Before the resolver, ~63% of extracted edges were dropped at graph-build
time, hiding all cross-package interconnections. After the resolver, drop
rate is ~8% and the cross-package picture is fully visible.

See `resolver.py` docstring for details.
