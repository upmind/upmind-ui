> Companion to the upmind-agent skill /story-status — Upmind-monorepo-specific bindings/overrides.

## Tracker binding

- The issue tracker is **Linear**. Use the Linear MCP plugin — no API key or scripts needed.
- Concrete tool calls for step 1:
  - Update: `linear__update_issue(id: "<issue-uuid>", state: "In Review")`
  - Resolve identifier → UUID first when you only have the identifier: `linear__get_issue(id: "FE-2229")`, then update using the UUID from the response.
- Issue identifier format: `FE-xxxx` (e.g., `FE-2229`).

## Status strings

This repo's Linear is configured with exactly these state names — send them verbatim:

| State | When to Use |
|-------|-------------|
| `In Progress` | Started working on the story |
| `In Review` | Ready for code review |
| `Needs Review` | Ready for non-code review (plans, docs) |
| `Done` | Story complete and merged |
| `Cancelled` | Story abandoned |
