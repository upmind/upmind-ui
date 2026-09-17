> Companion to the upmind-agent skill /runner (the bounded fan-out standard inside `/start`'s staged route) — Upmind-monorepo bindings.

## Docs-corpus and graph refresh is the runner's FINAL step

After the fan-out completes and before the change-request step, if the run touched `packages/*/src` or `docs/`, refresh and commit the result as the final commit:

```bash
pnpm graph                           # monorepo graph refresh with the cross-package resolver — never `graphify update .`
pnpm --filter docs corpus:refresh    # corpus:build (corpus.json) && corpus:emit
```

`corpus:emit` writes into the `docs/published-docs` submodule; committing that tree is gated on the mintlify-docs bot PAT (FE-2949).
