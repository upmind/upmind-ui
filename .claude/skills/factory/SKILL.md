---
name: factory
description: The factory door for scoped composables and their playground pages — ONE goal regardless of starting state (absent, legacy, partial, or complete module; no page, stale page, or current page): a full-parity module AND the driveable playground page that proves it. The door AUDITS reality, DERIVES the route, and grades the end state against the goal; invocation arguments pre-fill intake and may override the derivation, never amputate the goal. Every route adds-or-updates.
---

# /factory — one door, one goal, two lanes

**JTBD (the anchor for every in-run decision and every `@decision`):** let a consumer have and use a FULL-PARITY module AND playground, proven by a driveable playground page derived from the module itself. The goal is singular and state-independent: whatever the door finds — no module, a legacy unscoped one, a scoped one missing the surface the page renders off, or a complete one; no page, a stale page, or a current one — one run closes every gap between reality and that goal. A run whose gates are all green but whose page cannot filter, sort, page and act on what the oracle's surface offers has FAILED this JTBD (receipt: 2026-08-14 client-email-history — `playground=page` was honoured over a module missing its whole criteria surface; a page landed around the hole, every gate green).

**First principles, stated once:** the goal is the run's only invariant — routes, modes and arguments are means, and any input that would deliver less than the goal is a contradiction to surface, never a scope-limiter to obey. The page is designed backwards from the hand that drives it: what a hand needs to filter, sort, page, open and act already exists as live code in the composable lane's templates — the templates ARE the module contract, and the door's job is to make reality match them before any page is derived.

**The JTBD is the run's BINDING termination condition — set at intake, never merely suggested** (operator ruling 2026-08-14: prose in a seat brief is a suggestion an agent can ignore; the goal is a gate). A run has exactly two legal endings: the terminal readback proves the goal met, or a halt naming the unmet gap. "Done" with an unmet goal is not a reportable state.

This file owns the **intake, the Stage-0 audit, the template contract, the derived routes, the ordering + build + terminal gates and the run's one lifecycle marker** — nothing else. Each lane owns its own stage map, gates, dispatch contract and failure states, cited here and restated nowhere:

- **composable lane** — [`composable/SKILL.md`](./composable/SKILL.md) (`factory-composable`): Research → Plan → Code → Tests → Verify → Review → Docs. Modes: `net-new`, `conversion`, `upgrade` (gap-closure over an already-scoped module).
- **scenario lane** — [`scenario/SKILL.md`](./scenario/SKILL.md) (`factory-scenario`): Derive → Code → Tests → Verify → Review.

Neither lane is separately invocable. The door is the only entry point.

## Trigger

- `/factory [intake arguments]` — invoked by an operator or a runner; the arguments may carry any or all of the intake answers below (see "Invocation arguments pre-fill intake").
- Never self-triggered mid-conversation from "build me a composable" or "build me a page" without the intake answers — a missing answer is one blocking question, not an assumption.
- **Arguments are intake, never a substitute spec.** However detailed the invocation, it is input to THIS door's intake — parse it, echo it, then run the route exactly as written. Freehand-interpreting a detailed invocation instead of conducting through the lanes is a run defect (the skill was named; the skill runs), not a shortcut.

## Intake (JTBD-first)

Collect, in this order, before any lane runs — **from the invocation arguments first** (see "Invocation arguments pre-fill intake" below), then by asking. A missing answer is **one blocking question**, never a batch and never a default; an answer the invocation already carries is never re-asked:

1. **The module's job to be done** — the anchor every later stage and every `@decision` traces back to. Not "what layers does it need" — what job does a consumer hire it to do.
2. **Target module** (name/path under `packages/headless/src/modules/`). **The target IS the scope** (operator ruling 2026-08-14): a module directory means the ENTIRE module — every composable it ships or owes, list and manager alike; only naming a specific composable narrows the run to it.
3. **Mode** — `conversion` (a legacy/vue-app or existing-headless module gets scoped), `net-new`, or `upgrade` (an already-scoped module drifting from the template contract gets exactly its drift closed). **Derived by the Stage-0 audit, never trusted blind**; an explicit `mode=` is an operator override, and an override-vs-audit mismatch is a **halt with both determinations shown** (same law as variant/arms).
4. **Variant** — `machine`, `query`, or `hybrid` (a query-backed collection composable PLUS a `dataManagerMachine`-backed per-entity manager — the client-phone / client-address shape). Selects the template set (see Code stage). **Conversions: derived, never trusted blind** — the Research stage inventories the oracle's composable shapes (query collection? dataManager-machine manager? bespoke machine?) and derives the variant from them; an explicit `variant=` argument is an operator override, and a derivation-vs-override mismatch is a **halt with both determinations shown** (same law as arms). Net-new: asked.
5. **ADR-001 cells in scope** — the actor × context cells this module's parity table will carry (cite ADR-001; do not re-derive the matrix here).
6. **Worktree** — where the run executes (opened by this run itself at conduction start — `upmind-agent:start` is the full-lifecycle door, not a worktree opener, and is never invoked mid-factory since it would dispatch a second orchestration of the same story; keep = `upmind-agent:pause`, clean = `upmind-agent:complete`, list = `upmind-agent:resume` — the former `/worktree` door is folded into these).
7. **Route override** — the route is **DERIVED by the Stage-0 audit** (see "Stage 0" below), so this question is never asked; `playground=` is an operator override of that derivation, never a scope-limiter. `composable` is the one deliberate opt-out (stop after the composable lane, page deferred). `page` is an ASSERTION that the module is already M3 (full) — the audit still grades it, and `page` over an M0–M2 module is an override-vs-audit mismatch: **halt with both determinations shown**, never a page derived around the gap (the 2026-08-14 receipt is exactly that defect).

**The scenario lane asks nothing.** On the default route the composable does not exist at intake, so nothing about the page's surface is answerable; and the factory WRITES the page, so there is nothing to pin. Everything the page needs is derived from the landed composable, its schemas and its generated feature — the lane's own derivation contract — and the author tunes the emitted files afterwards.

### Invocation arguments pre-fill intake

The invocation line may answer any or all of the seven questions up front. (`arms=` is NOT an eighth question — the arms determination is derived at Plan from the parity table; the optional `arms=` key exists only as an operator override — see below.) Parse the arguments against the seven-question list above **before asking anything**: a question the arguments answer is collected — never re-asked. Exactly two conditions make a field the one blocking question: it is **missing**, or it parses to **two conflicting values**. There is no free-standing "ambiguous" ground for re-asking — a closed-vocabulary field (`mode`, `variant`, `playground`) whose value matches none of its allowed values, or a `cells` value yielding no actor×context pairs, counts as missing; a free-prose field (`jtbd`) is taken as given, never graded for quality at intake.

Two canonical forms, mixable with surrounding free prose (prose that unambiguously answers a question counts — the forms are conveniences, not gates):

1. **Keyed one-liner** — `key=value` pairs; key ↔ question map: `jtbd`→1, `module`→2, `mode`→3 (`conversion` | `net-new` | `upgrade`; an OVERRIDE of the Stage-0 audit derivation), `variant`→4 (`machine` | `query` | `hybrid`; for conversions this is an OVERRIDE of the Research-stage derivation, not a blind pick), `cells`→5 (comma-separated actor×context pairs; `×` or `x`), `worktree`→6 (a path, or `none` for the current branch), `playground`→7 (`both` | `composable` | `page`; an OVERRIDE of the audit-derived route — **omitted means audit-derived**, which is the default and the recommendation). Quote any value carrying spaces (as `jtbd` always will). Optional `arms=` (comma-separated earning layers, or `none`) is an operator OVERRIDE of the Plan-stage arms derivation, not an answer to a question — omit it unless deliberately overruling.

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

**Intake echo, then audit, then go.** Before anything runs, the door emits one parsed-intake table — the seven questions, each with its parsed value and source (`args` | `asked` | `derived` for the mode/route rows), plus an **arms row** reading `derived-at-Plan` (or the operator override, flagged as such), plus the recorded run constraints — then runs Stage 0 and appends the **audit rows** (module state, playground state, derived route, the drift list) to the echo before conducting. The echo is run reporting, not an artefact (nothing lands on disk, so the never-authors rule is untouched). A fully-answered invocation gets **zero questions** — the echo is a record, not a confirmation prompt, and nothing in it (tier-1 constraints included) waits for a go-ahead. A missing field, or two argument answers that conflict for the same question, gets exactly one blocking question — never a batch and never a default. Arms is never asked: absent an override it is derived at Plan (see the composable lane's Plan gate); mode and route are never asked either — absent overrides they are the audit's, so a fully-answered invocation always runs with zero questions.

**JTBD reconciliation before go.** The JTBD is the run's success metric; the other six answers are means to it. Before conducting, the door checks the answers **can** deliver the JTBD: a conversion whose oracle (the existing implementation) carries a composable shape the chosen `variant` cannot produce (e.g. `variant=query` while the module being replaced ships a dataManager/machine-backed composable, under a parity JTBD), or a `cells`/pre-approved-SDD scope that drops capability the JTBD names, is a **contradiction — one blocking question / halt, never a silent run**. Receipts: the 2026-08-05 client-email run — `variant=query` + "full parity" ran unreconciled and amputated the module's entire single-email manager surface while every gate stayed green; the 2026-08-14 client-email-history run — `playground=page` + "full parity" ran unreconciled over a module missing its criteria surface, same result. An argument can amputate the goal only if the door lets it.

## Stage 0 — the audit (the route is DERIVED, never trusted)

**On every invocation, before any lane runs**, the door dispatches ONE planner seat (`plan-story` map, same dispatch contract as everything else) to grade reality on two axes and file a receipt-backed state table — every `present` row carries a `file:line`, every `absent` row names the missing file or member:

| Axis | States |
| --- | --- |
| **Module** | **M0** absent (no module directory) · **M1** unscoped (exists, predates ADR-001's four-layer scoped shape) · **M2** scoped-partial (scoped shape present, but the module drifts from the current template contract — an absent channel, a subverted criteria surface — or the build is red, or a parity gap vs the oracle stands undispositioned) · **M3** full (scoped + template-conformant + build green) |
| **Playground** | **P0** absent (no scenario directory) · **P1** stale (exists but predates the current templates/contract, or draws a surface the module no longer carries) · **P2** current |

The route falls out of the module state — the playground state only tells the scenario lane whether it authors or rewrites (add-or-update law, below):

| Module state | Composable lane | Then scenario lane |
| --- | --- | --- |
| M0 | runs, `net-new` (or `conversion` when a legacy/vue-app analogue exists — the audit says which, the Research oracle confirms) | authors the page |
| M1 | runs, `conversion` | authors or rewrites |
| M2 | runs, `upgrade` — scoped to exactly the audited drift | authors or rewrites |
| M3 | skipped — nothing to close | add-or-update |

`mode=` and `playground=` arguments are operator OVERRIDES of this derivation, bound by the same law as `variant=`/`arms=`: an override-vs-audit mismatch is a **halt with both determinations shown**, never a silent pick — and never a lane run over a module the audit graded below what that lane consumes. The audit's state table and derived route join the intake echo.

### The contract is the template set — no second checklist

The composable lane's `templates/{machine,query,hybrid}/` already carry, as live code, every channel the playground renders off: the criteria schema pair (`useQuerySchema()` / `useQueryUischema()`) wired through `list({ criteria: { schema } })`, `useContext()` exposing `data` / `error` / `pagination` / `query` / `schemas.query`, enum-typed sort, the actions and meta members, the manager/editor surface, and the colocated `{module}.feature` + step catalog. The audit therefore grades ONE question, per composable the module ships **or owes** (the oracle decides what is owed — the 2026-08-05 amputation receipt): **does the landed module match what today's templates would produce for it?** Any drift — an absent channel, a subverted criteria surface, a template-shape lag — is M2 work for the composable lane, each drift row carrying a `file:line` receipt.

**The criteria-subversion law (operator ruling 2026-08-14).** The module's queryCriteria schema owns ALL request state — filters, sort, pagination, limit. Any `filter[...]` key, sort string, or pagination/limit value reaching a `useQuery` call from anywhere BUT that schema's channel is subversion and flags: hand-rolled filter state beside the channel, a raw string where the sort enum belongs, all of it. Decidable, so it also becomes a `scope-based` ESLint rule (follow-up story); until that lands, the audit and each lane's Review grade it from this law.

**An audited drift is composable-lane work, never scenario-lane material.** Deriving a page around a drift — or absorbing one as a pass-and-surface "decision" — is the cosplay `verify-cosplay` names: the page would prove a capability the module does not have. The 2026-08-14 run did both (`useMutate` repurposed, criteria surface missing, both absorbed as surfaced decisions); this contract is why that can no longer grade as pass.

### The build gate, stated once here

Both lanes carry it: the **full monorepo build** must exit 0 at each lane's Code and Tests gates and still be green at Verify — everything builds or the run halts, never scoped down. Headless and the labs playground are the two named focus packages (what the factory touches): a red in either is the run's own defect and enters the repair loop. Receipt: 2026-08-14 — a criteria-less module and a raw `"created_at"` shipped through five green gates because no gate built anything.

## Routes (derived — see Stage 0)

| Route | Runs | Lands |
| --- | --- | --- |
| audit-derived (default) | the composable lane in its audit-derived mode to its Docs gate (skipped only at M3), the ordering gate, then the scenario lane | the full-parity module and the page that proves it |
| `composable` (explicit opt-out) | the composable lane only — the run stops at its Docs gate and writes no scenario directory | the module alone, page deferred |
| `page` (operator assertion of M3) | the scenario lane only — legitimate ONLY when the audit concurs the module is M3; any lower grade is an override-vs-audit halt | the page for a module that is genuinely complete |

**Every route is add-or-update.** It creates what is missing and upgrades what exists; nothing is skipped because a file is already there. Run against a module whose page exists, the scenario lane re-derives from the LANDED composable, applies the current templates and the current contract, and **rewrites the files in place** — no diff-for-approval step, no shadow output directory, no `.new` file. `git` is the diff. The composable lane holds the same law over a module that already exists: its landed layers are re-derived to the current template shape rather than left at the shape they were scaffolded at.

The run's report names what changed (elements added or dropped, renderer types changed, channels gained or retired), so the operator reads the report beside the diff and never a third artefact.

**An upgrade over a dirty target is refused before anything is written.** Rewrite-in-place makes `git` the only record of local hand-tuning, so uncommitted changes under the module or its page directory are named in the refusal and the run stops. A committed target has a recoverable diff; a dirty one does not.

## The chain, its ordering gate, and the terminal JTBD readback

When both lanes run, they run in order with **one gate between them**: the composable lane's **Docs gate green** AND a **conformance re-grade returning drift count = 0** over the landed module — the scenario lane reads the LANDED module's mapper, schemas, criteria surface and matrix, so a derivation over a promised module (or a still-partial one) is a guess. On a legitimate `page` route that gate is satisfied by the audit's M3 grade, and the run opens at the scenario lane's Derive stage with the same gates it always carries.

Each lane's stage map names its own skill, seat and structured gate field; both are cited above and neither is restated here. A lane gate that fails halts the run and surfaces the failing structured field verbatim, per that lane's own failure states — the door adds no retry, no alternate path and no partial landing.

**The terminal gate is the JTBD readback — the binding goal's only exit.** After the last lane clears, the door dispatches the verifier once more to file a two-column capability table: the ORACLE's surface (what the legacy/e2e oracle lets a consumer do — filter, sort, page, search, open, act) beside the LANDED PAGE's driveable surface, row for row. Any oracle capability a hand cannot drive on the page = the run **FAILED the JTBD**, surfaced verbatim, regardless of every lane gate being green (`verify-cosplay`, `verify-parity-oracle` — cited, not restated). Green gates are evidence toward the goal, never the goal: this is the gate the 2026-08-14 run lacked — five green gates, and nobody was required to ask "can a hand actually do the job?"

## Seats, models, marker

- **Seats and dispatch** — the composable lane's dispatch contract governs both lanes: every stage spawns a named seat with an explicit model and a stamped `UPMIND_SEAT` + `UPMIND_LIFECYCLE` pair, and every gate resolves on a field a dispatched seat returned. Cited from that lane, restated nowhere.
- **Models** — neither the door nor either lane pins a model of its own. Both dispatch the plugin's existing `plan-story` (planner) and `dev-story` (the rest) team maps and inherit their pins, per `agent-orchestration` §3: model is the dispatching map's, never the session's.
- **Lifecycle marker** — `UPMIND_LIFECYCLE=factory` for **every stage of both lanes**. One run, one marker: the door is a single orchestration context, so a lane does not mint its own.

## Non-goals

- The door **produces no artefact itself** — every file on disk at the end of a run was written by a named skill under a named seat, in a lane (the Stage-0 audit and terminal readback are seat dispatches returning tables, not files).
- **No route derives around a gap.** A module graded M0–M2 gets the composable lane, never a page built over the hole; the only refusals are a dirty target and a missing dependency — every other starting state is work the run routes, not a dead end.
- **The door opens no change request and emits no review verdict** — the human MR/PR flow and the human review verdict remain outside it (`agent-orchestration` §2, ADR-029); `upmind-agent:complete` is a separate, explicit step a caller takes once the route's terminal gate clears.
