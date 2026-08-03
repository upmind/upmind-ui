> Companion to the upmind-agent skill /review — Upmind-monorepo-specific bindings/overrides.

Binds the base skill's generic placeholders to this repo's concrete systems. The base doctrine is authoritative; this file only supplies the values. Bare `/review` is the story-scoped working-diff review (the former `/story-review`); the `/review` door also routes to `code`, `verify`, `docs`, and `sdd` lanes by artifact.

## ID / branch / worktree format

- Story IDs use the `FE-` prefix on the `FE` team (e.g. `FE-2476`); everywhere the base says `<ID>`, use `FE-XXXX`.
- The feature/worktree branch is `feature/FE-XXXX` — so the base's `git worktree list | grep "feature/<ID>"` and `/resume <ID>` (worktree checkout now lives on the `/resume` door) bind to `feature/FE-XXXX` / `FE-XXXX`.
- `<integration-branch>` = `develop`; `<target-branch>` = `main`. So Step 1's comparison points are `origin/main` and `develop..HEAD` (worktree mode).

## Gate commands (Step 3, Worktree Auto-Detection)

- `<typecheck-cmd>` = `pnpm typecheck`
- `<lint-cmd>` = `pnpm lint`
- `<test-cmd>` = `pnpm test`

## Module path glob (Step 1b)

The base's `<module-path>` for the `stateMatches`/`machineMatches` grep binds to `packages/headless/src/modules/<module>/`.

## Legacy oracle + identity model (Step 2c)

- **Legacy codebase (the oracle source):** `repos/vue-app`. Every parity row citing a `legacy:` path is audited against that exact file in `repos/vue-app`.
- **Identity/scope retarget:** the base's "missing scope/identity retarget" is the `.for(actor, id)` call. A `Direct` row whose new code hardwires the caller's own id instead of `.for('client', id)` (or the correct actor) is the canonical silent parity lie — a BLOCKING mismatch.
- **Actor set:** the parity table's actor axis is `staff` / `client` / `guest`. A row on the wrong actor branch is a BLOCKING finding.

## Governance citation

- The actor × context grid the parity table is built on (base Step 2c / `parity.yaml`) is fixed by **ADR-001** (actor-model decision record). Cite it; the axis enumeration comes from there.
