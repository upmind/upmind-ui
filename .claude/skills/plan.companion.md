> Companion to the upmind-agent skill /plan — Upmind-monorepo-specific bindings/overrides.

`/plan` routes depth (light vs full SDD) and carries the epic + draft modes. It absorbs the retired `/stories-plan` (epic mode), `/stories-import` (epic-mode import tail), and `/story-draft` (draft mode). The light route is `/plan simple` (still named `story-plan`, see `story-plan.companion.md`); the full-depth route is the SDD chain (`sdd`, `sdd-requirements`, `sdd-design`, `sdd-bdd`, `sdd-tasks`, see those companions). This file binds only the epic/draft-mode values. The base doctrine is authoritative.

## Issue tracker (Linear)

- The issue tracker is **Linear** (via the Linear MCP tools). Everywhere the base says "issue tracker" — including the epic-mode "Import to the Issue Tracker" tail — it means Linear.
- Bind the base's generic `<tracker>_*` capabilities to the Linear MCP tools:
  - `linear__get_team` — resolve the team
  - `linear__list_projects` — list a team's projects
  - `linear__save_project` — create a project when it doesn't exist
  - `linear__create_issue` — create the epic, parent, and child issues
  - Dependency relations: the Linear MCP has no standalone relation tool — set blocked-by links via `save_issue` (update) with a relations field.

## Actor set (epic mode)

- Organize parent stories by this repo's actor set: **client**, **staff**, **guest**. Create one user-facing parent story per actor the initiative actually touches (skip actors it does not). The base's `USER`/`ADMIN` examples are placeholders; use these actor keys instead.

## Import defaults (epic mode)

- Default `team` for the stories JSON: **FE** (unless a story file's `team` field specifies otherwise).
- Default `labels`: **["frontend"]**.

## Draft mode (was `/story-draft`)

- The issue tracker is **Linear**. Wherever the base says "your issue tracker", it means Linear: paste the generated markdown into the Linear issue's description field.
