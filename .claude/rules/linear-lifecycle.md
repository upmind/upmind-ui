# Linear lifecycle — Upmind bindings

Tracker: Linear, team `FE`, ids `FE-XXXX`. Branch = the issue's `gitBranchName`, verbatim. `save_issue` with `labels` replaces the whole set: read → compute → write, and keep every non-agent label (System Area, Affected Area, Release Type, releases, priority).

**Labels carry the lifecycle. The status column carries only coarse state.** (Read live from the FE team, 2026-09-16.)

Labels, three groups:

- `actor:AI` · `actor:Human` — whose turn it is. The runner picks up `actor:AI` only.
- `skill:Plan` · `skill:Dev` · `skill:Factory` — what kind of work: plan, build, factory build.
- `action:Review` · `action:Test` · `action:Docs` — a discrete pass. Review is always a human's.

Status columns that exist on the board:

| Stage | Status |
| --- | --- |
| intake (`actor:AI`, fair game) | `Backlog`, `Needs Refinement`, `Todo` |
| claimed / paused | `Todo` |
| working | `In Progress` |
| handed to a human for review | stays `In Progress`; labels flip to `actor:Human` + `action:Review` |
| blocked / failed | `Blocked` |
| done (human moves it) | `Ready`, then `Done / Deployed` after release |
| never targeted by an agent | `Triage`, `Canceled`, `Duplicate` |

There is no "Needs Review" or bare "Done" status. Every handoff flips `actor:` and, where the table says so, moves the column.

Fan-out defaults for this metered account: `maxAgents` 40, `reserve` 0.3.
