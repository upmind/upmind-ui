> Companion to the upmind-agent skill /story-docs — Upmind-monorepo-specific bindings/overrides.

## Bindings

- **Module source glob:** `^packages/headless/src/modules/`. Module name is the
  5th path segment, so append `| cut -d'/' -f5` before `sort -u` in Step 1.
- **Base branch** (worktree diff base): `develop`.
- **Issue-branch pattern** (worktree auto-detection grep): `feature/FE-XXXX`
  (issue-tracker ids of the form `FE-<n>`); e.g. `/story-docs FE-2476`.

## Bound commands

Step 1 — identify affected modules:

```bash
git diff --name-only HEAD~5 | grep -E "^packages/headless/src/modules/" | cut -d'/' -f5 | sort -u
```

Step 1 — worktree mode:

```bash
git -C [worktree-path] diff --name-only develop..HEAD | grep -E "^packages/headless/src/modules/" | cut -d'/' -f5 | sort -u
```

Worktree auto-detection:

```bash
git worktree list | grep "feature/FE-XXXX"
```
