---
name: factory
description: The factory door for scoped composables and their playground pages — ONE shared intake, then the lanes it routes to: the composable lane (conversion or net-new module) and the scenario lane (the page that proves it). Invocation arguments may pre-fill the seven intake answers — an answered question is never re-asked. Every route adds-or-updates: it creates what is missing and brings what exists up to the current templates and contract.
---

# /factory — one door, two lanes

**JTBD (the anchor for every in-run decision and every `@decision`):** when a scoped composable is needed, one run lands the composable AND the playground page that proves it, so the module ships with a driveable, replayable demonstration of itself instead of a hand-built page nobody knows how to make again.

This file owns the **intake, the precondition, the routes, the ordering gate and the run's one lifecycle marker** — nothing else. Each lane owns its own stage map, gates, dispatch contract and failure states, cited here and restated nowhere:

- **composable lane** — [`composable/SKILL.md`](./composable/SKILL.md) (`factory-composable`): Research → Plan → Code → Tests → Verify → Review → Docs.
- **scenario lane** — [`scenario/SKILL.md`](./scenario/SKILL.md) (`factory-scenario`): Derive → Code → Tests → Verify → Review.

Neither lane is separately invocable. The door is the only entry point.

## Trigger

- `/factory [intake arguments]` — invoked by an operator or a runner; the arguments may carry any or all of the intake answers below (see "Invocation arguments pre-fill intake").
- Never self-triggered mid-conversation from "build me a composable" or "build me a page" without the intake answers — a missing answer is one blocking question, not an assumption.
- **Arguments are intake, never a substitute spec.** However detailed the invocation, it is input to THIS door's intake — parse it, echo it, then run the route exactly as written. Freehand-interpreting a detailed invocation instead of conducting through the lanes is a run defect (the skill was named; the skill runs), not a shortcut.

## Intake (JTBD-first)

Collect, in this order, before any lane runs — **from the invocation arguments first** (see "Invocation arguments pre-fill intake" below), then by asking. A missing answer is **one blocking question**, never a batch and never a default; an answer the invocation already carries is never re-asked:

1. **The module's job to be done** — the anchor every later stage and every `@decision` traces back to. Not "what layers does it need" — what job does a consumer hire it to do.
2. **Target module** (name/path under `packages/headless/src/modules/`).
3. **Mode** — `conversion` (a legacy/vue-app or existing-headless module gets scoped) or `net-new`.
4. **Variant** — `machine`, `query`, or `hybrid` (a query-backed collection composable PLUS a `dataManagerMachine`-backed per-entity manager — the client-phone / client-address shape). Selects the template set (see Code stage). **Conversions: derived, never trusted blind** — the Research stage inventories the oracle's composable shapes (query collection? dataManager-machine manager? bespoke machine?) and derives the variant from them; an explicit `variant=` argument is an operator override, and a derivation-vs-override mismatch is a **halt with both determinations shown** (same law as arms). Net-new: asked.
5. **ADR-001 cells in scope** — the actor × context cells this module's parity table will carry (cite ADR-001; do not re-derive the matrix here).
6. **Worktree** — where the run executes (opened by this run itself at conduction start — `upmind-agent:start` is the full-lifecycle door, not a worktree opener, and is never invoked mid-factory since it would dispatch a second orchestration of the same story; keep = `upmind-agent:pause`, clean = `upmind-agent:complete`, list = `upmind-agent:resume` — the former `/worktree` door is folded into these).
7. **Route** — `both` (composable + page), `composable`, or `page`. **The one question carrying a default: `both`.** The page is how a human sees the module work, so `composable` is a deliberate opt-out rather than an unanswered question, and `page` is the route for a module that already exists (see Routes).

**The scenario lane asks nothing.** On the default route the composable does not exist at intake, so nothing about the page's surface is answerable; and the factory WRITES the page, so there is nothing to pin. Everything the page needs is derived from the landed composable, its schemas and its generated feature — the lane's own derivation contract — and the author tunes the emitted files afterwards.

### Invocation arguments pre-fill intake

The invocation line may answer any or all of the seven questions up front. (`arms=` is NOT an eighth question — the arms determination is derived at Plan from the parity table; the optional `arms=` key exists only as an operator override — see below.) Parse the arguments against the seven-question list above **before asking anything**: a question the arguments answer is collected — never re-asked. Exactly two conditions make a field the one blocking question: it is **missing**, or it parses to **two conflicting values**. There is no free-standing "ambiguous" ground for re-asking — a closed-vocabulary field (`mode`, `variant`, `playground`) whose value matches none of its allowed values, or a `cells` value yielding no actor×context pairs, counts as missing; a free-prose field (`jtbd`) is taken as given, never graded for quality at intake.

Two canonical forms, mixable with surrounding free prose (prose that unambiguously answers a question counts — the forms are conveniences, not gates):

1. **Keyed one-liner** — `key=value` pairs; key ↔ question map: `jtbd`→1, `module`→2, `mode`→3 (`conversion` | `net-new`), `variant`→4 (`machine` | `query` | `hybrid`; for conversions this is an OVERRIDE of the Research-stage derivation, not a blind pick), `cells`→5 (comma-separated actor×context pairs; `×` or `x`), `worktree`→6 (a path, or `none` for the current branch), `playground`→7 (`both` | `composable` | `page`; **omitted means `both`** — the only key with a default). Quote any value carrying spaces (as `jtbd` always will). Optional `arms=` (comma-separated earning layers, or `none`) is an operator OVERRIDE of the Plan-stage arms derivation, not an answer to a question — omit it unless deliberately overruling.

   ```text
   /factory jtbd="let a consumer manage a client's postal addresses at full parity with legacy vue-app + current headless" module=packages/headless/src/modules/client-address-dry/ mode=conversion variant=query cells=client×self,staff×admin-context,staff×acting-as-client worktree=none playground=both arms=none
   ```

2. **Labelled intake block** — an `Intake answers:` block whose numbering matches the list above (a lead-in prose line before it is fine; an optional `8. Arms:` row is the same operator override as `arms=`):

   ```text
   /factory full-parity conversion port of client-address → client-address-dry (query variant)

   Intake answers:
   1. JTBD: let a consumer manage a client's postal addresses at full parity with legacy vue-app + current headless.
   2. Target module: packages/headless/src/modules/client-address-dry/
   3. Mode: conversion
   4. Variant: query
   5. ADR-001 cells: client×self; staff×admin-context; staff×acting-as-client (.for('client', id))
   6. Worktree: none — current branch
   7. Route: both
   ```

**Run constraints ride along — bounds only.** Additional directives the invocation carries bind as run-scoped constraints **only when they are prohibitions or process bounds** — what not to touch (e.g. "do NOT touch `client-address/`"), commit/branch policy (e.g. "no commits"): record them verbatim in the intake echo and hold every stage and seat dispatch to them (an operator-typed invocation carries tier-1 force — `agent-behavior` §1). Substantive design or technical direction in the invocation is **intake material for the Plan stage's full-SDD route of `upmind-agent:plan`, never a constraint** — routing it around Plan and Review is exactly the freehand-interpretation defect the Trigger bans ("Arguments are intake, never a substitute spec").

**Intake echo, then go.** Before anything runs, the door emits one parsed-intake table — the seven questions, each with its parsed value and source (`args` | `asked` | `default` for the route row), plus an **arms row** reading `derived-at-Plan` (or the operator override, flagged as such), plus the recorded run constraints — then conducts. The echo is run reporting, not an artefact (nothing lands on disk, so the never-authors rule is untouched). A fully-answered invocation gets **zero questions** — the echo is a record, not a confirmation prompt, and nothing in it (tier-1 constraints included) waits for a go-ahead. A missing field, or two argument answers that conflict for the same question, gets exactly one blocking question — never a batch and never a default. Arms is never asked: absent an override it is derived at Plan (see the composable lane's Plan gate), so a fully-answered seven-question invocation always runs with zero questions.

**JTBD reconciliation before go.** The JTBD is the run's success metric; the other six answers are means to it. Before conducting, the door checks the answers **can** deliver the JTBD: a conversion whose oracle (the existing implementation) carries a composable shape the chosen `variant` cannot produce (e.g. `variant=query` while the module being replaced ships a dataManager/machine-backed composable, under a parity JTBD), or a `cells`/pre-approved-SDD scope that drops capability the JTBD names, is a **contradiction — one blocking question / halt, never a silent run**. Receipt: the 2026-08-05 client-email run — `variant=query` + "full parity" ran unreconciled and amputated the module's entire single-email manager surface while every gate stayed green.

### Precondition — the target is a scope-based composable

**On every route, before any lane runs.** The door holds intake #2 to ADR-001's four-layer scoped shape: the module exports its own scope matrix and is driven through `.as()` / `.for()`. When it does not, the door **REFUSES** and says plainly which module and which part of the shape is absent. It never half-derives from an unscoped module and it never invents the missing scope surface.

A module predating the pattern is out of scope until it is converted, and converting it is the composable route's own job (`mode=conversion`) — so the refusal on a `page` route names that route as the way forward. The check is on the SHAPE, which is what the derivation needs; whether each cell is behaviourally wired stays the composable lane's Verify gate, measured against the oracle (ADR-001's own caution: a present matrix is not a wired actor).

One further refusal, in the same plain terms: a `page` route over a module carrying no `{module}.feature` in its own `__tests__/` has nothing for the scenario lane to append to. Authoring that spec is the composable lane's, and the `composable` route is where it comes from.

## Routes

| Route (`playground=`) | Runs | Lands |
| --- | --- | --- |
| `both` (default) | the composable lane to its terminal gate, the door gate, then the scenario lane | the composable and the page that proves it |
| `composable` | the composable lane only — the run stops at its Docs gate and writes no scenario directory | the composable alone |
| `page` | the scenario lane only, over the module named at intake | the page for a module that already exists |

**Every route is add-or-update.** It creates what is missing and upgrades what exists; nothing is skipped because a file is already there. Run against a module whose page exists, the scenario lane re-derives from the LANDED composable, applies the current templates and the current contract, and **rewrites the files in place** — no diff-for-approval step, no shadow output directory, no `.new` file. `git` is the diff. The composable lane holds the same law over a module that already exists: its landed layers are re-derived to the current template shape rather than left at the shape they were scaffolded at.

The run's report names what changed (elements added or dropped, renderer types changed, channels gained or retired), so the operator reads the report beside the diff and never a third artefact.

**An upgrade over a dirty target is refused before anything is written.** Rewrite-in-place makes `git` the only record of local hand-tuning, so uncommitted changes under the module or its page directory are named in the refusal and the run stops. A committed target has a recoverable diff; a dirty one does not.

## The chain and its ordering gate

On `both`, the lanes run in order with **one gate between them**: the composable lane's **Docs gate green**. The scenario lane reads the LANDED module's mapper, schemas and matrix — a derivation over a promised module is a guess. On `page` that gate is already satisfied by the landed module, so the run opens at the scenario lane's Derive stage with the same gates it always carries.

Each lane's stage map names its own skill, seat and structured gate field; both are cited above and neither is restated here. A lane gate that fails halts the run and surfaces the failing structured field verbatim, per that lane's own failure states — the door adds no retry, no alternate path and no partial landing.

## Seats, models, marker

- **Seats and dispatch** — the composable lane's dispatch contract governs both lanes: every stage spawns a named seat with an explicit model and a stamped `UPMIND_SEAT` + `UPMIND_LIFECYCLE` pair, and every gate resolves on a field a dispatched seat returned. Cited from that lane, restated nowhere.
- **Models** — neither the door nor either lane pins a model of its own. Both dispatch the plugin's existing `plan-story` (planner) and `dev-story` (the rest) team maps and inherit their pins, per `agent-orchestration` §3: model is the dispatching map's, never the session's.
- **Lifecycle marker** — `UPMIND_LIFECYCLE=factory` for **every stage of both lanes**. One run, one marker: the door is a single orchestration context, so a lane does not mint its own.

## Non-goals

- The door **produces no artefact itself** — every file on disk at the end of a run was written by a named skill under a named seat, in a lane.
- **No route is a partial derivation.** A target failing the precondition is refused, never half-built.
- **The door opens no change request and emits no review verdict** — the human MR/PR flow and the human review verdict remain outside it (`agent-orchestration` §2, ADR-029); `upmind-agent:complete` is a separate, explicit step a caller takes once the route's terminal gate clears.
