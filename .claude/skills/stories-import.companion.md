> Companion to the upmind-agent skill /stories-import — Upmind-monorepo-specific bindings/overrides.

## Issue tracker = Linear

The connected issue tracker is **Linear**. Bind the base skill's generic `<tracker>_*` capabilities to the Linear MCP tools:

- `linear__get_team` — resolve the team (step 2)
- `linear__list_projects` — list a team's projects (step 2)
- `linear__save_project` — create a project when it doesn't exist (step 2)
- `linear__create_issue` — create the epic, parent, and child issues (steps 3–5)
- Dependency relations (step 6): the Linear MCP has no standalone relation tool — set the blocked-by links via `save_issue` (update) with a relations field.

## Default team = FE

Story JSON in this repo targets team **FE**. Use `FE` as the team unless a story file's `team` field specifies otherwise.
