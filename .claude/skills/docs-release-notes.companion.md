> Companion to the upmind-agent skill /docs-release-notes — Upmind-monorepo-specific bindings/overrides.

Binds the base skill's generic placeholders (issue tracker, git host, issue-ID pattern, app/tag names, `<NOISE_EXCLUDE>`, output directory) to this repo's concrete values. The base doctrine is authoritative; this file only supplies the values.

## Tracker binding

- **Issue tracker:** Linear (MCP connector `claude.ai Linear`). Wherever the base says "the tracker's ... MCP tool":
  - get-issue → `mcp__claude_ai_Linear__get_issue`
  - list-comments → `mcp__claude_ai_Linear__list_comments`
  - list-issues (label search) → `mcp__claude_ai_Linear__list_issues`
- **Releases surface (base Step 7 publishing):** Linear carries releases and release notes.
  - find the release for a tag → `mcp__claude_ai_Linear__list_releases` (filter by `version`, or `query` on the version stem)
  - attach notes → `mcp__claude_ai_Linear__save_release_note`
  - cart pipeline → `Cart v2` (slug `test`, id `6ea69f37-022f-4461-9c95-e3e51f81d787`)
  - Releases are usually created by whoever cut the tag and sit with `releaseNotes: []`. **Attach to the existing release; never create one, never advance its stage.** Linear auto-links `FE-NNNN` in the body, so the footer needs no special handling.
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

## House format (overrides the base Step 5 template)

The house format is the authority. Past entries are in the Linear releases surface; `docs/release-notes/` was removed from the monorepo (MR !566) — release notes are not repo artefacts. It differs from the base template:

- H1 is `# Release Notes — Cart vX.Y.Z`, followed by a one-line `>` blockquote summary.
- Section headings are `## ✨ New Features`, `## 🐛 Bug Fixes`, `## 🔧 Under the hood` — **`Under the hood`, not the base's `Improvements`**. Features and fixes carry `###` sub-headings with a prose paragraph; under-the-hood is a plain bullet list.
- Footer is `*Hotfix on top of vX.Y.Z. References: FE-NNNN.*` — not the base's `*[N] changes across [areas].*`. Drop the "Hotfix on top of" clause for a non-hotfix release.
- Prose, not bullets, for customer-facing entries; no internal symbol or file names.

## Output (base Step 7) — Linear, not the repo

Release notes live in **Linear**, never in the monorepo. Attach the generated notes to the matching Linear release via the Linear MCP (`save_release_note`), so they sit beside the release they describe.

`docs/release-notes/` was deleted in MR !566: a release note is a published statement about a version, not source that ships with it, so it has no business in git history.

Example untracked-change module paths in this repo look like `packages/client-vue/src/modules/billing/` and `packages/headless/src/modules/basket/`.
