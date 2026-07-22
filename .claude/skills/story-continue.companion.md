> Companion to the upmind-agent skill /story-continue — Upmind-monorepo-specific bindings/overrides.

The issue tracker is **Linear** (via the Linear MCP tools). Ticket IDs use the `FE-` prefix (e.g. `FE-2476`).

**Step 1 — fetch the issue and its comments:**

```
linear__get_issue(id: "FE-XXXX")
linear__list_comments(issueId: "<issue-uuid>")
```

`list_comments` is keyed by the issue's internal UUID returned from `get_issue`, not the human `FE-XXXX` id.

**Finding in-progress stories** (Step 1, no ticket given):

```
linear__list_issues(assignee: "me", team: "FE", state: "In Progress")
```
