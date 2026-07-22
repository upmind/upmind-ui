> Companion to the upmind-agent skill /story-start — Upmind-monorepo-specific bindings/overrides.

## Issue tracker binding (Option B, Background Mode, Common Steps)

The issue tracker is Linear (MCP `linear__*` tools). Issue IDs use the `FE-XXXX` format on team `FE`. Substitute this ID wherever the base says `<ISSUE-ID>` — branch `feature/FE-XXXX`, commit `feat(FE-XXXX): [description]`.

- Fetch one issue (Background Mode step 1, Option B step 3): `linear__get_issue(id: "FE-XXXX")`
- List your Todo stories by priority (Option B step 1): `linear__list_issues(assignee: "me", team: "FE", state: "Todo")`
- Mark In Progress (Background Mode step 2, Common step 4): `linear__save_issue(id: "<issue-uuid>", state: "In Progress")`

## Local story files binding (Option A)

`<stories-dir>` is `.agent/stories/`. Initiatives live there as per-initiative `*.json` files; each file has an `epic` field and an array of stories keyed by `id`.

Discover:

```bash
cd .agent/stories && for f in *.json; do epic=$(cat "$f" 2>/dev/null | grep -o '"epic"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*: *"//;s/"$//'); count=$(cat "$f" 2>/dev/null | grep -c '"id":'); echo "  $f - $epic ($count stories)"; done
```

Load selected: `cat .agent/stories/[SELECTED_FILE]`
