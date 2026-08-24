---
name: bump-version
description: Bump every workspace package.json in the monorepo to one release version using npm pkg set. Use when asked to "bump versions", "set the version to X", "sync package versions", or when cutting a release/hotfix branch that needs its version applied across the tree. Excludes packages/types and packages/ui, which are independently versioned.
---

# bump-version

```bash
.claude/scripts/bump-version.sh <semver>
```

Wraps `pnpm -r --include-workspace-root --filter='!…types' --filter='!…upmind-ui' exec npm pkg set version=<semver>`, runs from the repo root wherever you invoke it, and prints the diffstat. Rejects a non-semver argument with exit 2.

## Steps

1. Run it. Exit 0 = done; 12 files in the monorepo plus the two submodules.
2. Read the diffstat it prints and show the operator.
3. Do NOT commit unless asked — the bump usually rides an existing release commit.
4. Bump the `apps/hosting` and `apps/velia` submodules in their own repos; those commits belong to them, not the monorepo.

## Covers

Root plus all 14 workspace members (`docs`, `packages/*`, `playgrounds/*`, `apps/*`), minus the two exempt.

## Exempt

`@upmind-automation/types` (0.0.x) and `@upmind/ui` (0.0.x) track their own versions — never pull them onto the release train.

## Do not use `npm version` / `pnpm version`

`pnpm version` is a passthrough to `npm version`, and npm rejects pnpm's workspace protocol:

```
npm error EUNSUPPORTEDPROTOCOL  Unsupported URL Type "workspace:": workspace:*
```

It fails on every package that depends on `client-vue`/`headless`/`types` — and it **writes the version before failing**, leaving a dirty tree on a non-zero exit. `npm pkg set` is the surgical equivalent: it sets the field with no dependency resolution.

## Known side effect

`npm pkg set` re-serialises the file, so it sorts `dependencies` alphabetically. Harmless (key order is meaningless) but it can add reorder noise to an otherwise one-line diff — `playgrounds/labs` reorders 5 workspace deps. Accepted.
