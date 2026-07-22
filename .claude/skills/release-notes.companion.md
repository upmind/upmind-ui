> Companion to the upmind-agent skill /release-notes — Upmind-monorepo-specific bindings/overrides.

Binds the base skill's generic placeholders (issue tracker, git host, issue-ID pattern, app/tag names, `<NOISE_EXCLUDE>`, output directory) to this repo's concrete values. The base doctrine is authoritative; this file only supplies the values.

## Tracker binding

- **Issue tracker:** Linear (MCP connector `claude.ai Linear`). Wherever the base says "the tracker's ... MCP tool":
  - get-issue → `mcp_linear-mcp-server_get_issue`
  - list-comments → `mcp_linear-mcp-server_list_comments`
  - list-issues (label search) → `mcp_linear-mcp-server_list_issues`
- **Issue-ID pattern:** `FE-XXXX` / `fe-XXXX` (i.e. `FE-\d+`, case-insensitive). Use this when extracting issue IDs from commit messages (base Steps 2b + Notes) and when parsing user input (base Step 1).
- **Label ↔ tag alignment:** Linear labels are kept one-to-one with git tags — label `cart-v0.17.0` matches tag `cart-v0.17.0`.

## Git host binding

- **Git host:** GitLab. The base "git host's MCP for diffs" is the GitLab MCP.

## App / tag names

The apps in this monorepo carry these tag prefixes (base `<app>-v<semver>`):

- `cart` → e.g. `cart-v0.17.0`
- `headless` → e.g. `headless-v1.2.3`

Branches drop the prefix: `release/<semver>`, `hotfix/<semver>`.

## Working directory (git commands)

Base git commands assume they run in the repo root; in this setup they are invoked from the parent directory, so prefix each with `cd monorepo &&`. E.g. the base tag search becomes:

```bash
cd monorepo && git tag --sort=-version:refname | head -20
```

## `<NOISE_EXCLUDE>` glob (base Steps 2c + 3)

```
tests/|\.lock|submodule|locales/
```

## Output directory (base Step 7)

Save release notes to `docs/release-notes/` in the monorepo. Example untracked-change module paths in this repo look like `packages/client-vue/src/modules/billing/` and `packages/headless/src/modules/basket/`.
