> Companion to the upmind-agent skill /story-background — Upmind-monorepo-specific bindings/overrides.

## Issue tracker = Linear

The generic "issue tracker" steps bind to Linear MCP tools:

- **Step 1 — resolve by ID:** `linear__get_issue(id: "FE-XXXX")`
- **Step 1 — no ID given, list your Todo stories:** `linear__list_issues(assignee: "me", team: "FE", state: "Todo")`
- **Step 2 — mark In Progress:** `linear__save_issue(id: "<issue-uuid>", state: "In Progress")`
- **Handoff comment (Step 3 item 7 / template step 5):** post the `## 🤖 AI Session` comment (with the Agent-Chain block) to the story **on Linear**.

## ID and branch format

- Story IDs use the `FE-` prefix on the `FE` team (e.g. `FE-2476`).
- Everywhere the base says `<ID>`, use `FE-XXXX`; the feature branch is therefore `feature/FE-XXXX`.

## Repo coding conventions (template step 2)

When building the agent prompt, the "follow ALL project rules" instruction MUST enumerate this repo's conventions so the background agent honours them:

- Use Lodash for all array/object operations
- Follow import order conventions
- Follow XState v5 conventions
- Add JSDoc to all return properties
- Use `type` not `interface`
- Follow scoped composable patterns
