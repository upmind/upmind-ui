> Companion to the upmind-agent skill /sdd-design — Upmind-monorepo-specific bindings/overrides.

Read alongside `/sdd-design`. These bindings fill the placeholders and repo-specific
mechanics the base skill defers to the working repo.

## Reference repos (Prerequisites, step 3)

- `<PRIMARY_REPO>` = `repos/monorepo` — the primary working repo.
- `<ORACLE_SRC>` = `repos/vue-app/src` — the legacy Vue app; this is the parity **oracle**.
  Search it with `--include='*.vue' --include='*.ts'`.

## Issue tracker (step 2)

The issue tracker is **Linear**. Read the story's Linear ticket to determine the
source/target branch.

## Branches (steps 2 & 10)

- **Default integration branch** (`<DEFAULT_BRANCH>`) = `develop`. Always restore the
  worktree to `develop` when planning completes.
- **Milestone** → its release branch (e.g. `release/0.15.0`).
- **Project** → its target branch.

## Worktree switch (step 2) — read-only + submodules + `.agent` exclusion

The monorepo worktree is kept read-only and uses submodules; use these exact commands
instead of the base skill's two-line checkout:

```bash
# Make writable for checkout
chmod -R u+w repos/monorepo

# Fetch and checkout the source branch
git -C repos/monorepo fetch origin [BRANCH] --recurse-submodules
git -C repos/monorepo checkout --detach origin/[BRANCH]
# Update submodules (skip .agent — same repo we're already in)
git -C repos/monorepo submodule update --init --recursive -- $(git -C repos/monorepo submodule--helper list | awk '{print $2}' | grep -v '\.agent')

# Restore read-only
chmod -R a-w repos/monorepo
```

## Worktree restore (step 10)

```bash
chmod -R u+w repos/monorepo
git -C repos/monorepo checkout --detach origin/develop
chmod -R a-w repos/monorepo
```

## Module root & file conventions (step 3a/3b/3d)

- `<MODULE_ROOT>` = `repos/monorepo/packages/headless/src/modules`.
- Per-module files: `[MODULE].machine.ts` (state machine), `use[Module].ts` (composable),
  `[MODULE].types.ts` (types), services alongside.

## Parity axes (step 3g)

The actor decision record is **ADR-001**. For the Capability Parity Table:

- **Actors** = `guest` / `client` / `staff`.
- **Acting contexts** = `self` / `on-behalf-of-client` / … (as the requirements' Parity
  Scope declares).

Cross ADR-001 actors × acting contexts to enumerate the cells; the on-behalf-of-client
retarget is expressed in legacy via `.for('client', id)`.
