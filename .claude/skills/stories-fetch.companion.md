> Companion to the upmind-agent skill /stories-fetch — Upmind-monorepo-specific bindings/overrides.

## Issue tracker binding

- The issue tracker is **Linear**. Use the Linear MCP tool `linear__list_issues` — no API key or scripts needed.
- Default team: `FE`.

Worked call:

```
linear__list_issues(assignee: "me", team: "FE", state: "In Progress")
```

## Status values

The concrete Linear workflow states in this repo:

- `Backlog`
- `Todo`
- `In Progress`
- `In Review`
- `Done`
- `Cancelled`
