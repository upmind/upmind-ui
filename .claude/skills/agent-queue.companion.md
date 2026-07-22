> Companion to the upmind-agent skill /agent-queue — Upmind-monorepo-specific bindings/overrides.

Binds the generic "issue tracker" of the base skill to this repo's concrete tracker and its API. The base doctrine is authoritative; this file only supplies the values.

## Tracker binding

- **Tracker:** Linear. **MCP connector:** `claude.ai Linear`. If it is unavailable, abort (base Error Handling row "Issue-tracker MCP unavailable").
- **Team key:** `FE`. Every query filters `team: "FE"`, `assignee: "me"`.
- **Ticket-ID format:** `FE-XXXX` (wherever the base writes `<ID>` — e.g. `docs/sdd/FE-XXXX/`, `docs/plans/FE-XXXX.md`, `feature/FE-XXXX`).
- **Branch field:** the base's "tracker's canonical branch-name field" is Linear's **`gitBranchName`**. Use it verbatim for the `branch` value; never fabricate.

## Concrete API calls

**Step 2 — fetch (`query_issues` →):** Linear's `list_issues` takes a **single** `state` per call, so query each intake state and union the results:

```text
list_issues(assignee: "me", team: "FE", state: "<intake state>", label: "actor:AI", label: "skill:Plan")   # → pick-plan
list_issues(assignee: "me", team: "FE", state: "<intake state>", label: "actor:AI", label: "skill:Dev")    # → pick-dev
list_issues(assignee: "me", team: "FE", state: "<intake state>", label: "actor:AI", label: "action:Test")  # → pick-test
```

Repeat each for `state`: `Backlog`, `"Needs Refinement"`, `Todo`.

**Step 6 — relations (`get_relations` →):** `get_issue(id: "FE-XXXX", includeRelations: true)`; extract `blockedBy` and `relatedTo` from the response.

**Step 8 — move to staged (`set_state` →):** `save_issue(id: "[issue-uuid]", state: "Todo")`.

## Status-name mapping (lifecycle role → Linear workflow state)

| Base lifecycle role | Linear state string |
|---------------------|---------------------|
| Intake pool         | `Backlog`, `Needs Refinement`, `Todo` |
| Staged / claimed    | `Todo` |
| Working             | `In Progress` |
| Blocked (needs human) | `Blocked` |
| Handed to human for review | `Needs Review` |
| Terminal            | `Done`, `Deployed`, `Canceled` |

## External-blocker note

Cross-team blockers use other Linear team prefixes (e.g. a backend ticket `ATBE-###`). Status-check them per Step 6 rule 2 before flagging; `/agent-run` skips `dev` stories with an incomplete external blocker.
