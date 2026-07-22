> Companion to the upmind-agent skill /sdd-requirements — Upmind-monorepo-specific bindings/overrides.

## Worktrees & paths

The base's generic worktree/path placeholders bind to:

- `<target-repo>` (the codebase under development): `repos/monorepo`
- `<legacy-app>` (the app being migrated from): `repos/vue-app`
- `<module-root>` (step 3 module discovery): `packages/headless/src/modules` — search the wider tree at `packages/headless/src/`
- Legacy search (step 3): grep `repos/vue-app/src/` with `--include='*.vue' --include='*.ts'`

## Issue tracker

The issue tracker is **Linear** (fetch via the Linear MCP). Story IDs look like `FE-2243`.

## Source branches

The base's "integration branch" / "release branch" bind to:

- Default / integration branch: `develop`
- Release work: `release/X.Y.Z` (the release branch for the target version)

## Parity Scope — the actor × context surface (step 8)

The base's generic "actor × context surface (per the project's architecture
decision record)" binds to:

- Decision record: **ADR-001 (Scope-Based Composable Architecture)**. Cite ADR-001; do not restate it.
- Actors: `staff`, `client`, `guest`
- Contexts: `self`, `on-behalf-of-client`

## Auth identity in scope read-backs (step 5)

The base's generic "auth identity (selected credential/token + on-behalf-of
headers)" binds to this repo's identity transport — the **session token**
selected and the **acting-as headers** sent for a `.for('client', id)` call. The
full read-back contract is homed in `reality-check.companion.md`; assert it, do
not restate it here.
