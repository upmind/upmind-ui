> Companion to the upmind-agent skill /worktree — Upmind-monorepo-specific bindings/overrides.

Binds the base skill's generic `<ID>` and `<trunk>` placeholders to this repo's concrete values.

## ID and branch format

- Story IDs use the `FE-` prefix on the `FE` team (e.g. `FE-2476`). Everywhere the base says `<ID>`, use `FE-XXXX`.
- The feature branch is therefore `feature/FE-XXXX` — this is what the `list`/`review`/`checkout`/`cleanup` branch matching resolves to.

## Trunk branch

- `<trunk>` is **`develop`** — background story branches are cut from and diffed against `develop`, not `main`. Do NOT auto-detect; use `develop`.
- So the `review` diff commands bind to:

```bash
git -C [worktree-path] log --oneline develop..HEAD
git -C [worktree-path] diff develop..HEAD --stat
```

## Dev-server command (checkout → Next steps)

The base's "Start the dev server to test" step is `pnpm dev` in this repo.
