# Linear lifecycle — Upmind bindings

Tracker: Linear, team `FE`, ids `FE-XXXX`, branch `feature/FE-XXXX`. `save_issue` replaces the whole label set: always read → compute → write, and keep every non-agent label (area, priority, provenance, release).

Labels, three axes:

- `actor:AI` · `actor:Human` — whose turn it is
- `skill:Plan` · `skill:Dev` — what kind of work
- `action:Review` · `action:Test` · `action:Docs` — a discrete pass

Status columns on the Frontend board:

| Stage | Linear status |
| --- | --- |
| intake (`actor:AI`, fair game) | Backlog, Needs Refinement, Todo |
| claimed / paused | Todo |
| working | In Progress |
| handed to human for review | stays In Progress, carries `actor:Human` + `action:Review` (the old "Needs Review" state is archived — never target it) |
| blocked | Blocked |
| done (human only) | Ready |

The runner picks up `actor:AI` in Backlog / Needs Refinement / Todo, routed by `skill:Plan` → plan, `skill:Dev` → build, `action:Test` → test. Every handoff flips `actor:` and moves the column. The review verdict is always a human's.

Fan-out defaults for this metered account: `maxAgents` 40, `reserve` 0.3.
