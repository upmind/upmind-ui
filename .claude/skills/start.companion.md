> Companion to the upmind-agent skill /start — Upmind-monorepo-specific bindings/overrides.

`/start` sizes the ask and picks the route (single increment · staged · runner) and owns worktree **open**. It absorbs the retired `/story-start`, `/story-background` (now `/start --bg`), and the open half of `/worktree` (pause keeps · complete cleans · resume lists). This file consolidates their repo-specific bindings. The base doctrine is authoritative; this file only supplies the values.

## Issue-tracker binding (Linear)

The issue tracker is Linear (MCP `linear__*` tools). Issue IDs use the `FE-XXXX` format on team `FE`. Substitute this ID wherever the base says `<ISSUE-ID>` — branch `feature/FE-XXXX`, commit `feat(FE-XXXX): [description]`.

- Fetch one issue: `linear__get_issue(id: "FE-XXXX")`
- List your Todo stories by priority: `linear__list_issues(assignee: "me", team: "FE", state: "Todo")`
- Mark In Progress: `linear__save_issue(id: "<issue-uuid>", state: "In Progress")`

## Local story files binding (evolution/plan route)

`<stories-dir>` is `.agent/stories/`. Initiatives live there as per-initiative `*.json` files; each file has an `epic` field and an array of stories keyed by `id`.

Discover:

```bash
cd .agent/stories && for f in *.json; do epic=$(cat "$f" 2>/dev/null | grep -o '"epic"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*: *"//;s/"$//'); count=$(cat "$f" 2>/dev/null | grep -c '"id":'); echo "  $f - $epic ($count stories)"; done
```

Load selected: `cat .agent/stories/[SELECTED_FILE]`

## Worktree open + trunk (worktree lifecycle: open here, keep on `/pause`, clean on `/complete`, list on `/resume`)

- Story IDs use the `FE-` prefix on team `FE` (e.g. `FE-2476`); the feature branch is `feature/FE-XXXX` — what the `list`/`review`/`checkout`/`cleanup` branch matching resolves to.
- `<trunk>` is **`develop`** — background story branches are cut from and diffed against `develop`, not `main`. Do NOT auto-detect; use `develop`.
- Diff commands bind to:

```bash
git -C [worktree-path] log --oneline develop..HEAD
git -C [worktree-path] diff develop..HEAD --stat
```

- The base's "Start the dev server to test" step is `pnpm dev` in this repo.

## Background run (was `/story-background`, now `/start --bg`)

- Resolve by ID: `linear__get_issue(id: "FE-XXXX")`; no ID given, list Todo: `linear__list_issues(assignee: "me", team: "FE", state: "Todo")`; mark In Progress: `linear__save_issue(id: "<issue-uuid>", state: "In Progress")`.
- Post the `## 🤖 AI Session` handoff comment (with the Agent-Chain block) to the story on Linear.
- When building the background agent prompt, the "follow ALL project rules" instruction MUST enumerate this repo's conventions so the background agent honours them:
  - Use Lodash for all array/object operations
  - Follow import order conventions
  - Follow XState v5 conventions
  - Add JSDoc to all return properties
  - Use `type` not `interface`
  - Follow scoped composable patterns
