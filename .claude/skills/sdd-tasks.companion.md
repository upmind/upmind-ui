> Companion to the upmind-agent skill /sdd-tasks — Upmind-monorepo-specific bindings/overrides.

## Reference repos

Verify design assumptions against these checkouts (Prerequisites; Step 2):

- `repos/monorepo`
- `repos/vue-app`

Task "Actions" write file paths in full from the reference repo root, e.g. `repos/monorepo/...`.

## Reference source glob (Step 2)

`<reference-source-glob>` = `repos/monorepo/packages/headless/src/modules`; source files are TypeScript (`*.ts`). Concrete Step 2 command:

```bash
find repos/monorepo/packages/headless/src/modules/[MODULE] -type f -name '*.ts' | sort
```

## Governing decision record

The "governing decision record" throughout /sdd-tasks is **ADR 021**:

- The Test-Skill Pairing Rule is per ADR 021.
- "The agent that writes code must NOT write its own assertions" is ADR 021 §Principles.

## Feature-file path (Prerequisites)

`sdd-bdd` writes feature files to `tests/Playwright/features/<flow>/*.feature`.

## e2e command (Reality Checks)

`<e2e-command>` = `pnpm test:e2e`. Reality Checks therefore run e.g. `pnpm test:e2e --grep "<scenario>"`.

## Issue tracker (Step 7)

The "issue tracker" that `docs/sdd/[STORY-ID]/review-notes.md` gaps mirror to (per the `/sdd` orchestrator) is **Linear**.
