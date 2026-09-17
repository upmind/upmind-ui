> Companion to the upmind-agent skill /plan — Upmind-monorepo-specific bindings/overrides.

`/plan` routes depth (light vs full SDD) and carries the epic + draft modes. The light route is `story-plan` (see its companion); the full-depth route is the SDD chain (`sdd`, `sdd-requirements`, `sdd-design`, `sdd-bdd`, `sdd-tasks`). This file binds only the epic/draft-mode values.

## Issue tracker (Linear)

- Linear (`.claude/rules/linear-lifecycle.md`), including the epic-mode "Import to the Issue Tracker" tail.
- The base's generic `<tracker>_*` capabilities bind to the Linear MCP tools:
  - `get_team` — resolve the team
  - `list_projects` — list a team's projects
  - `save_project` — create a project when it doesn't exist
  - `save_issue` — create the epic, parent, and child issues; set `blockedBy` on it for dependency relations.

## Actor set (epic mode)

- Organize parent stories by this repo's actor set: **client**, **staff**, **guest**. Create one user-facing parent story per actor the initiative actually touches (skip actors it does not). The base's `USER`/`ADMIN` examples are placeholders; use these actor keys instead.

## Import defaults (epic mode)

- Default `team` for the stories JSON: **FE** (unless a story file's `team` field specifies otherwise).
- Default `labels`: **["frontend"]**.

## Draft mode

- Paste the generated markdown into the Linear issue's description field.
