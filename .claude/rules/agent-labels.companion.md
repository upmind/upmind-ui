> Companion to [agent-labels.md](./agent-labels.md) — Upmind-monorepo-specific bindings/examples.

The Upmind binding of the three-axis model onto **Linear**: label taxonomy, workflow statuses, the `pick-*` routines, the "agent never reviews" narrowing (ADR-029), and the migration map from the deprecated flat `agent:*` family. The base rule owns the axis doctrine; this companion owns the Linear-specific values verbatim.

Supersedes the deprecated flat `agent:*` label family (`agent:plan`, `agent:dev`, `agent:review`, `agent:plan-review`, `agent:queued`, `agent:processing`, `agent:planned`, `agent:reviewed`, `agent:failed`, `🤖 agent`). See the migration map at the bottom.

## The three axes

A story's agent state is three orthogonal labels plus its Linear **status** (workflow column). Never overload one axis to mean another.

| Axis | Values | Means |
| --- | --- | --- |
| **`actor:`** | `AI` · `Human` | **Whose turn it is.** This is the gate. The agent runner only ever picks up `actor:AI` (scanning Backlog / Needs Refinement / Todo — see status below). `actor:Human` = the story is in the operator's lap (reviewing AI output, or unblocking a failed run). Also the permanent provenance marker — a story that has ever carried `actor:AI` was agent-touched. |
| **`skill:`** | `Plan` · `Dev` | **What kind of build work.** `Plan` → write the SDD (routine `pick-plan`). `Dev` → implement the change, **including its tests and docs, with the suite green**, and open the MR (routine `pick-dev`). |
| **`action:`** | `Review` · `Test` | **A discrete step on top of build work.** `Review` → a human reviews (plan or code — always human, never the agent). `Test` → an **opt-in** dedicated test pass (run / triage / quarantine), attached only when a story needs more than dev's own green-check (routine `pick-test`). |

Status (workflow column) carries lifecycle — it is **not** a label. The agent's **intake pool** is `actor:AI` in **Backlog**, **Needs Refinement**, or **Todo** (a plan can be labelled for the agent at any of these stages). **When the agent claims a story it moves it to Todo** (staged for this run), then to **In Progress** while actively working, then hands off to **Needs Review** or, on a stall, **Blocked** — **Done** is the human-only terminal.

```text
Backlog / Needs Refinement / Todo   →   Todo        →   In Progress   →   Needs Review / Blocked   →   Done
   (intake: actor:AI, fair game)     (claimed/staged)   (working)          (handed to human)          (human only)
```

> **There is no agent review routine.** Both plan review and code review are always `actor:Human` + `action:Review`. The agent never reviews. (The `action:Review` label's stock description mentions a `pick-review` routine — that predates this decision and is not used here.)
>
> **Amendment (2026-07-20, ADR-029 pending ratification):** "the agent never reviews" is narrowed to "the agent never emits the review **verdict**". Reviewer/verifier seats defined in `agents/` (per rules/seat-separation.md) may **pre-gate** — block a story from reaching Needs Review — but may **never** emit the `actor:Human` review verdict. The only `actor:Human`→`actor:AI` transition remains the human-authored review verdict.
>
> **There is no `action:Docs`.** Docs are written inside `skill:Dev` and reviewed inside the normal human `action:Review`. You don't "run" docs, so docs have no execution gate — unlike tests.

## The lifecycle

```text
        ┌─────────────────────── operator sets ───────────────────────┐
        │  actor:AI + skill:Plan  (Backlog / Needs Refinement / Todo)  │
        ▼                                                              │
  [pick-plan] agent claims → moves to Todo → In Progress, writes SDD  │
        │                                                              │
        ▼  hand back                                                   │
  actor:Human + skill:Plan + action:Review  (Todo → your lane)         │
        │                                                              │
  you run /sdd-review ── In Progress                                   │
        ├── approve →  actor:AI + skill:Dev            (Todo) ─────────┤
        └── reject  →  actor:AI + skill:Plan + notes   (Todo) ─────────┘
                                                                        
  [pick-dev] agent implements code + tests + docs, greens suite,       
            opens MR ── In Progress                                    
        │                                                              
        ├── (optional) actor:AI + action:Test ── dedicated test pass   
        │                                                              
        ▼  hand back                                                   
  actor:Human + action:Review  (Needs Review → your lane)              
        │                                                              
  you review the code ── In Progress                                   
        ├── approve →  Done            (human-only)                    
        └── reject  →  actor:AI + skill:Dev  (Todo)  → back to pick-dev 
                                                                        
  any failure at any agent step →  actor:Human  (Blocked)              
```

### Handoff rules (exact transitions)

Every handoff **flips `actor:`** and **moves the status column**. Linear `save_issue`'s `labels` replaces the whole set — always `get_issue` → compute → `save_issue`, preserving non-agent labels (area, priority, provenance, releases).

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

## What the agent runner picks up

Query: `actor:AI` in **Backlog**, **Needs Refinement**, or **Todo**, routed by the work label:

- `actor:AI` + `skill:Plan` → `pick-plan`
- `actor:AI` + `skill:Dev` → `pick-dev`
- `actor:AI` + `action:Test` → `pick-test` (opt-in)

On claim, the story is **moved to Todo** (staged), then to **In Progress** when work begins. Rejects and hand-backs re-enter as `actor:AI` in Todo, so they're picked up on the next pass. The runner **ignores** anything `actor:Human` (not its turn), anything already **In Progress** / **Needs Review** / **Blocked**, and any terminal status (**Done**, **Deployed**, **Canceled**). "Queued"/"processing" are not labels — they are the Todo and In Progress columns.

## Migration map (deprecated `agent:*` → this model)

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
