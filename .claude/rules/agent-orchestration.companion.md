> Companion to [agent-orchestration.md](./agent-orchestration.md) — Upmind-monorepo Linear + account bindings. Section numbers below are the base rule's.

## §2 Lifecycle — the Linear taxonomy

Supersedes the deprecated flat `agent:*` label family (`agent:plan`, `agent:dev`, `agent:review`, `agent:plan-review`, `agent:queued`, `agent:processing`, `agent:planned`, `agent:reviewed`, `agent:failed`, `🤖 agent`) — see the migration map at the bottom.

### Labels (Linear taxonomy)

The three axes are realized as Linear issue labels:

- **`actor:`** — `actor:AI` · `actor:Human`
- **`skill:`** — `skill:Plan` · `skill:Dev`
- **`action:`** — `action:Review` · `action:Test`

Preserve the non-agent labels (area, priority, provenance, releases) on every write: Linear `save_issue`'s `labels` **replaces the whole set**, so always `get_issue` → compute → `save_issue` (the base's read → compute → write invariant).

### Statuses (Linear workflow columns) and the lifecycle mapping

The base's generic stages map onto these Linear statuses:

| Base stage | Linear status |
| --- | --- |
| intake pool (`actor:AI`, fair game) | **Backlog**, **Needs Refinement**, or **Todo** (a plan can be labelled for the agent at any of these) |
| claimed / staged | **Todo** |
| working | **In Progress** |
| handed to human — review | **Needs Review** |
| handed to human — stall | **Blocked** |
| terminal (human-only) | **Done** (also terminal: **Deployed**, **Canceled**) |

```text
Backlog / Needs Refinement / Todo   →   Todo        →   In Progress   →   Needs Review / Blocked   →   Done
   (intake: actor:AI, fair game)     (claimed/staged)   (working)          (handed to human)          (human only)
```

"Queued" / "processing" are **not** labels — they are the **Todo** and **In Progress** columns.

### Runner query and routine → status bindings

The runner scans `actor:AI` in **Backlog**, **Needs Refinement**, or **Todo**, routed by the work label (`skill:Plan` → `pick-plan`, `skill:Dev` → `pick-dev`, `action:Test` → `pick-test`). On claim it moves the story to **Todo** (staged), then **In Progress** when work begins. It **ignores** anything `actor:Human`, anything already **In Progress** / **Needs Review** / **Blocked**, and any terminal status (**Done**, **Deployed**, **Canceled**).

Exact transitions (every handoff flips `actor:` and moves the column):

| At | From | To | Status |
| --- | --- | --- | --- |
| Operator labels a plan | *(none)* | `actor:AI` + `skill:Plan` | Backlog / Needs Refinement / Todo |
| Agent claims (queue) | `actor:AI` + `skill:Plan` | *(unchanged)* | → Todo (staged) |
| Agent starts planning (run) | `actor:AI` + `skill:Plan` | *(unchanged)* | Todo → In Progress |
| Agent finishes plan | `actor:AI` + `skill:Plan` | `actor:Human` + `skill:Plan` + `action:Review` | In Progress → Needs Review |
| Human approves plan (`/sdd-review approve`) | `actor:Human` + `skill:Plan` + `action:Review` | `actor:AI` + `skill:Dev` | → Todo |
| Human rejects plan (`/sdd-review reject`) | `actor:Human` + `skill:Plan` + `action:Review` | `actor:AI` + `skill:Plan` (+ notes comment) | → Todo |
| Agent starts dev | `actor:AI` + `skill:Dev` | *(unchanged)* | Todo → In Progress |
| Agent finishes dev | `actor:AI` + `skill:Dev` | `actor:Human` + `action:Review` | In Progress → Needs Review |
| Human approves code | `actor:Human` + `action:Review` | *(agent labels cleared)* | → Done |
| Human rejects code | `actor:Human` + `action:Review` | `actor:AI` + `skill:Dev` | → Todo |
| Any agent failure | `actor:AI` + `*` | `actor:Human` + *(work label kept)* | → Blocked |
| Opt-in test pass | `actor:AI` + `action:Test` | `actor:Human` on completion/failure | In Progress → Needs Review / Blocked |

Plan review is the human `/sdd-review` skill; code review is the human reading the MR. The `action:Review` label's stock description mentions a `pick-review` routine — that predates this decision and is **not** used here.

**ADR-029 (2026-07-20, pending ratification):** the base's "the agent never emits the review **verdict**" law is the ratified narrowing of the earlier "the agent never reviews". Reviewer/verifier seats defined in `agents/` (per `rules/agent-seat-separation.md`) may pre-gate a story out of **Needs Review** but never emit the `actor:Human` review verdict; the only `actor:Human` → `actor:AI` transition remains the human-authored verdict.

### Migration map (deprecated `agent:*` → this model)

| Old | New |
| --- | --- |
| `agent:plan` | `actor:AI` + `skill:Plan` |
| `agent:dev` | `actor:AI` + `skill:Dev` |
| `agent:review` *(agent code review)* | **removed** — code review is `actor:Human` + `action:Review` |
| `agent:plan-review` *(agent plan review)* | **removed** — plan review is `actor:Human` + `skill:Plan` + `action:Review` via `/sdd-review` |
| `agent:queued` | *(no label)* — status **Todo** (the agent moves a claimed story here from Backlog / Needs Refinement) |
| `agent:processing` | *(no label)* — status In Progress |
| `agent:planned` | `actor:Human` + `skill:Plan` + `action:Review` (plan awaiting human) |
| `agent:reviewed` | Done (human moved) |
| `agent:failed` | `actor:Human` + status Blocked |
| `🤖 agent` *(provenance)* | *(no label)* — `actor:*` is the provenance marker |

New capability with no old equivalent: `action:Test` (`pick-test`) — the opt-in dedicated test pass.

## §3 Cost — this account's fan-out caps

The base leaves these as operator-declared scope:

| Binding | Value | Applies to |
| --- | --- | --- |
| `maxAgents` (total-agent cap) | **40** (default) | fix runs / wave-runner fan-outs |
| `reserve` (budget-floor fraction) | **0.3** | every budget-guarded run |

- **`maxAgents: 40`** is the default total-agent ceiling for fix runs — the Gap-1 bounded-fan-out cap, not the concurrency limit. A runner may scope higher/lower per its declared budget target, but absent an explicit override, fix runs stop gracefully at 40.
- **`reserve: 0.3`** keeps 30% of the launch budget target unspent as graceful-stop headroom (the base rule's budget-floor fraction).

### Why these values (this account)

This account is on **metered session and week limits** — the same limits an unbounded run once exhausted mid-loop. The caps exist so a fan-out stops on a self-declared proxy ceiling well before it hits the provider's hard session/week limit and starts thrashing dead agents. The base rule's honest ruling stands: the runner **cannot** read the live session/week remaining quota, so these are proxy ceilings, not a live meter. The metered limits are the reason the defaults are this conservative.