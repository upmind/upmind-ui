> Companion to the upmind-agent skill /runner (the bounded fan-out standard inside `/start`'s staged route — was `/code-workflow`) — Upmind-monorepo-specific bindings/overrides.

Additive. Binds where the docs-corpus refresh sits in a runner. Repo wins on any conflict.

## Docs-corpus refresh is the runner's FINAL step (replaces the removed PostToolUse hook, FE-2752)

The FE-2752 PostToolUse `docs-corpus-refresh` hook was removed — keeping the corpus in sync is a **runner responsibility** (a deterministic final step), not a per-tool trigger. After the fan-out completes and before the change-request step, if the run touched `packages/*/src` or `docs/`, the runner runs the refresh and commits the result as its final commit:

```bash
graphify update .                    # AST-only graph refresh (no API cost)
pnpm --filter docs corpus:refresh    # corpus:build (corpus.json) && corpus:emit
```

This is the determinism guarantee the removed hook used to provide, now owned by the runner. The `corpus:emit` half writes into the `docs/published-docs` submodule; committing/pushing that tree and re-enabling the (currently paused) docs-corpus CI are gated on the mintlify-docs bot PAT (FE-2949). Until then the refresh keeps `docs/corpus/corpus.json` current in-repo.
