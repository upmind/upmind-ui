---
name: scoped-composable-factory
description: The pick-dev conductor for scoped composables — one skill that conducts intake, research, plan, code, tests, verify, review, and docs end-to-end by dispatching the existing named skills and seats, so a conversion or net-new module never re-derives the process. Invocation arguments may pre-fill the six intake answers — an answered question is never re-asked. This is the SPEC for the skill; a run of it is FE-2968, not this bundle.
---

# /scoped-composable-factory — the pick-dev conductor for scoped composables

**JTBD (the anchor for every in-run decision and every `@decision`):** one command that produces a complete, correct, proven scoped composable — new or converted — every single time (`docs/sdd/FE-2966-FE-2967/requirements.md`).

This skill **conducts**; it never authors an artefact itself. Every stage below delegates to a named existing skill running under a named seat, and every gate resolves a structured field — never a prose judgement this skill makes on its own. See `docs/sdd/FE-2966-FE-2967/flow.md` for the narrative walkthrough this SKILL.md operationalises.

> **No run of this skill ships in FE-2966/FE-2967.** Running it over a real module — `client-phone` or any other — is FE-2968's job. This file is the conductor's spec.

## Trigger

- `/scoped-composable-factory [intake arguments]` — invoked by the FE-2968 runner (or an operator); the arguments may carry any or all of the intake answers below (see "Invocation arguments pre-fill intake").
- Never self-triggered mid-conversation from "build me a composable" without the intake answers — a missing answer is one blocking question, not an assumption.
- **Arguments are intake, never a substitute spec.** However detailed the invocation, it is input to THIS skill's intake — parse it, echo it, then run the stage map exactly as written. Freehand-interpreting a detailed invocation instead of conducting through this skill is a run defect (the skill was named; the skill runs), not a shortcut.

## Intake (JTBD-first)

Collect, in this order, before any stage runs — **from the invocation arguments first** (see "Invocation arguments pre-fill intake" below), then by asking. A missing answer is **one blocking question**, never a batch and never a default; an answer the invocation already carries is never re-asked:

1. **The module's job to be done** — the anchor every later stage and every `@decision` traces back to. Not "what layers does it need" — what job does a consumer hire it to do.
2. **Target module** (name/path under `packages/headless/src/modules/`).
3. **Mode** — `conversion` (a legacy/vue-app or existing-headless module gets scoped) or `net-new`.
4. **Variant** — `machine` or `query` (selects the template set — see Code stage).
5. **ADR-001 cells in scope** — the actor × context cells this module's parity table will carry (cite ADR-001; do not re-derive the matrix here).
6. **Worktree** — where the run executes (opened via `/start`; worktree lifecycle is `/start` open · `/pause` keep · `/complete` clean · `/resume` list — the former `/worktree` door is folded into these).

### Invocation arguments pre-fill intake

The invocation line may answer any or all of the six questions up front. (`arms=` is NOT a seventh question — the arms determination is derived at Plan from the parity table; the optional `arms=` key exists only as an operator override — see below.) Parse the arguments against the six-question list above **before asking anything**: a question the arguments answer is collected — never re-asked. Exactly two conditions make a field the one blocking question: it is **missing**, or it parses to **two conflicting values**. There is no free-standing "ambiguous" ground for re-asking — a closed-vocabulary field (`mode`, `variant`) whose value matches none of its allowed values, or a `cells` value yielding no actor×context pairs, counts as missing; a free-prose field (`jtbd`) is taken as given, never graded for quality at intake.

Two canonical forms, mixable with surrounding free prose (prose that unambiguously answers a question counts — the forms are conveniences, not gates):

1. **Keyed one-liner** — `key=value` pairs; key ↔ question map: `jtbd`→1, `module`→2, `mode`→3 (`conversion` | `net-new`), `variant`→4 (`machine` | `query`), `cells`→5 (comma-separated actor×context pairs; `×` or `x`), `worktree`→6 (a path, or `none` for the current branch). Quote any value carrying spaces (as `jtbd` always will). Optional `arms=` (comma-separated earning layers, or `none`) is an operator OVERRIDE of the Plan-stage arms derivation, not an answer to a question — omit it unless deliberately overruling.

   ```text
   /scoped-composable-factory jtbd="let a consumer manage a client's postal addresses at full parity with legacy vue-app + current headless" module=packages/headless/src/modules/client-address-dry/ mode=conversion variant=query cells=client×self,staff×admin-context,staff×acting-as-client worktree=none arms=none
   ```

2. **Labelled intake block** — an `Intake answers:` block whose numbering matches the list above (a lead-in prose line before it is fine; an optional `7. Arms:` row is the same operator override as `arms=`):

   ```text
   /scoped-composable-factory full-parity conversion port of client-address → client-address-dry (query variant)

   Intake answers:
   1. JTBD: let a consumer manage a client's postal addresses at full parity with legacy vue-app + current headless.
   2. Target module: packages/headless/src/modules/client-address-dry/
   3. Mode: conversion
   4. Variant: query
   5. ADR-001 cells: client×self; staff×admin-context; staff×acting-as-client (.for('client', id))
   6. Worktree: none — current branch
   ```

**Run constraints ride along — bounds only.** Additional directives the invocation carries bind as run-scoped constraints **only when they are prohibitions or process bounds** — what not to touch (e.g. "do NOT touch `client-address/`"), commit/branch policy (e.g. "no commits"): record them verbatim in the intake echo and hold every stage and seat dispatch to them (an operator-typed invocation carries tier-1 force — `${CLAUDE_PLUGIN_ROOT}/rules/agent-behavior.md` §1). Substantive design or technical direction in the invocation is **intake material for the Plan stage's full-SDD route of `/plan` (the `/sdd` chain), never a constraint** — routing it around Plan and Review is exactly the freehand-interpretation defect the Trigger bans ("Arguments are intake, never a substitute spec").

**Intake echo, then go.** Before anything runs, the conductor emits one parsed-intake table — the six questions, each with its parsed value and source (`args` | `asked`), plus an **arms row** reading `derived-at-Plan` (or the operator override, flagged as such), plus the recorded run constraints — then conducts. The echo is run reporting, not an artefact (nothing lands on disk, so the conductor's never-authors rule is untouched). A fully-answered invocation gets **zero questions** — the echo is a record, not a confirmation prompt, and nothing in it (tier-1 constraints included) waits for a go-ahead. A missing field, or two argument answers that conflict for the same question, gets exactly one blocking question — never a batch and never a default. Arms is never asked: absent an override it is derived at Plan (see the Plan gate), so a fully-answered six-question invocation always runs with zero questions.

## Stage map

Every artefact-producing stage names its skill and its seat; every gate names the structured field it resolves on. Docs runs **after** Verify — deliberately, not incidentally (see Docs row).

| Stage | Skill | Seat | Gate (structured field) |
| --- | --- | --- | --- |
| Research | `/graphify query` + docs-corpus sweep (glossary + `docs/reference/`) | planner | **citation count** ≥ 1 generic-sweep + ≥ 1 mode-specific-oracle citation (conversion → wherever the existing implementation lives: the current headless module and/or the legacy vue-app surface being ported — a module can be new to headless and still a conversion; net-new → no existing implementation anywhere, oracle is the closest vue-app legacy-parity analogue); 0 of either = fail |
| Plan | **The full-depth SDD route of `/plan`** — the FULL set (requirements → design → BDD/Gherkin → tasks; the `/sdd` chain); a ported/net-new module is never trivial, so the light `/plan simple` route (was `/story-plan`) is **not** an option here | planner | **full-SDD-set-exists** (`requirements.md` + `design.md` + a co-located `<module>.feature` + `tasks.md`) AND **undispositioned parity-cell count** = 0 (every ADR-001 cell in `parity.yaml` carries a disposition) AND **arms determination present** (`parity.yaml` carries a per-layer `arms:` block — services/actions/context/meta/schemas each `none` or its earning actors, every earned arm citing the parity row that earns it — derived per clause 3, never asked) |
| Code | `/code-scoped-composable` (scaffold) + `/code-generate` (checklist) with this skill's own `templates/{machine,query}/` set | developer | **diff file count** > 0 AND **hand-off-filed** = true (public-surface contract handed to Tests; diff/hand-off withheld from it — ADR-029) |
| Tests | `/test` — the test factory (was `/test-module`); routes each contract behaviour to unit/integration/e2e itself | prover (contract-fed public surface only — `design.md`, Gherkin, `parity.yaml`, exported types; diff and hand-off withheld) | **suite exit code** = 0 per layer dispatched; a no-boundary determination on the integration branch is a recorded field, not a silent skip |
| Verify | `/code-verify` | verifier | **verdict field** = `PRESENT` (ABSENT halts — see Failure states) |
| Review | `/code-review` (loads this repo's `code-reviews.companion.md`, which carries the FE-2967 variance-law cues) | reviewer (pre-gate) | **🔴 blocker count** = 0 |
| Docs | `/docs` — the docs factory (was `/docs-module`); internally dispatches `/docs-foundation`, `/docs-guide` (persona-facing only), `/docs-review` | documenter | **missing-artefact count** = 0 AND **docs-review verdict** = clean AND upstream **verifier verdict** = `PRESENT` (a capability may not be described as delivered without it) |

**Code-stage clause-3 arms — derived at Plan, independently re-verified at Code, never asked.** The determination is a **per-layer multi-select**, not a single yes/no: does this module's ADR-001 parity table give any actor a member exclusive to it or overriding the shared factory (clause 3, `code-composables.companion.md` "Variance law") at any of services / actions / context / meta / schemas? The **planner** derives it mechanically at Plan from the parity table + research oracle — a per-actor route, capability gate, or member at a layer earns that layer's arm — and records it as `parity.yaml`'s `arms:` block (see the Plan gate). The SDD can get this wrong, so the **developer seat re-derives it independently before scaffolding**, from the landed parity table against the clause-3 rules themselves — never by trusting the recorded block: a mismatch between the seat's re-derivation and the recorded `arms:` block (or an operator `arms=` override) is a gate failure surfaced verbatim with both determinations shown — the run never silently picks a side (`agent-behavior.md` §1: contradiction escalates).

Clause 3 applies independently to each of the five sub-composable layers — a module may earn a services arm and nothing else, or earn arms at two layers and stay armless at the rest. Answer per layer, not once for the whole module:

- **A layer determined armless** → scaffold that layer armless only (its own shared `{module}.services.ts` / `use{Module}.actions.ts` / `use{Module}.context.ts` / `use{Module}.meta.ts` / `{module}.schemas.ts` default shape) — the majority case (`account/` is the canonical armless exemplar).
- **A layer determined earning** → copy that layer's `templates/{machine,query}/{module}.services.{actor}.ts` / `use{Module}.actions.{actor}.ts` / `use{Module}.context.{actor}.ts` / `use{Module}.meta.{actor}.ts` / `{module}.schemas.{actor}.ts` arm template per earning actor, concretise its worked-example members into this module's real ones, and wire it into that layer's shared file — a `case` in `scopedServices()` / `scopedSchemas()` for services and schemas, an `actorScope === …` branch plus a last-position spread for actions/context/meta. No signature changes and nothing is renamed: every shared file already carries its resolution seam as live code, so the file looks the same armed or armless. Full when/how/lint-gate decision tree: `templates/ARMS.md` (one file, covers both variants; per-variant differences are tabled in its own "Variant deltas" section).
- **`schemas`** → earns only when the same form carries **different fields or different required rules per actor** (e.g. a client registering themselves supplies fields a staff member registering on their behalf does not, and is held to a tighter required list). No module in this codebase has earned this split yet — every current `.schemas*.ts` split is by form/flow — so an earned `schemas` arm is new ground: cite the parity-table row that justifies it in the arm file's own `@decision` block.

**Every arm carries at least one member exclusive to it, OR one overriding the shared factory** (the arm templates demonstrate one of each; an arm carries only what it earned) — **and an override is A vs A+B**: the shared factory does A; the arm does A *and something more*. An "override" whose body is byte-equal to the shared implementation is cosplay: it claims to override and delivers nothing (`verify-cosplay.md`). Kill it, or make the difference real.

This sub-question exists because the templates alone previously could not produce a full copy of their own canonical exemplar (`auth/`, which carries earned arms) — a direct JTBD gap for any module hitting clause 3 at ANY layer, closed by this task (`docs/sdd/FE-2966-FE-2967/evidence/decisions.md`, 2026-07-28 "JTBD gap" entry + the operator ruling that followed it, which expanded the closure from two layers to all five).

**Tests and Docs are dispatched exclusively through their factories.** This skill invokes `/test` and `/docs` and nothing else at those stages — it never calls `/code-test-unit`, `/code-test-integration`, `/code-test-e2e`, `/docs-foundation`, `/docs-guide`, or `/docs-review` directly. Those remain the two factories' own internal dispatches; restating their routing here would duplicate a rule this skill only delegates to.

**Docs runs after Verify, not before.** The documenter's own procedure takes `verify.md` as an input and refuses to certify a capability the verifier hasn't returned `PRESENT` on — sequencing Docs any earlier would let it describe something as delivered before delivery is confirmed.

**FULL SDD always — and the co-located `<module>.feature` is the test anchor.** A ported or net-new module is never trivial, so the Plan stage runs the full-depth SDD route of `/plan` (the `/sdd` chain). Its BDD phase must produce a **co-located Gherkin `<module>.feature`** in the module's `__tests__/` at **capability altitude** — one scenario per ADR-001 actor×context behaviour the parity table carries, in actor/business language, never a per-mapper/per-schema unit nor a vague "it works". ⚠️ **Restructure gap (skill-doors):** the skill that authored this artefact — **`/code-test-bdd`**, the module business-logic feature skill (distinct from `/sdd-bdd`, which owns only cross-module e2e journeys) — was **retired with no direct replacement door**. `/sdd-bdd` (now `plan/sdd/bdd`, invoked by `/plan`) remains e2e-only and must **not** be used to author the module feature. Until the operator reassigns module-feature authoring, this stage has no producing skill — surface it as a blocking gap rather than silently routing the module feature through `/sdd-bdd`. That feature is the module's single behavioural source of truth: every integration (and, where run, e2e) test and every capability-level unit test traces to a scenario in it — a scenario with no proving test is a visible coverage hole, a behavioural test with no scenario is untethered. That link is **enforced in-suite by a co-located `<module>.traceability.test.ts`** — it parses the feature's `@AC-*` scenario tags and the sibling tests' AC-ids and fails if any non-`@todo` scenario has no proving test, or any test names a scenario the feature doesn't carry (a test that rides the module's own suite, never a bespoke CI gate). The feature is the coverage contract for **both** sides: the **Code** stage's developer implements every scenario the feature carries (all scenarios covered), and the **Tests** stage's prover anchors every test to a scenario — an unmapped test means the feature gains the missing scenario, **never** that the test is dropped (coverage never falls). This holds whenever a module feature exists — co-located in the module's `__tests__/` or in the SDD dir. A lone `design.md` is not acceptable output for this factory.

**FULL TESTS = unit + integration only (the `<module>.feature` still anchors them).** Per the binding ruling in `review-notes.md`, the factory's Tests stage never dispatches e2e — `/test` would only route a behaviour there if asked to, and this conductor never asks. The co-located Gherkin `<module>.feature` is still authored at Plan/BDD and remains the behavioural anchor the unit + integration tests trace to; not running e2e means its journey scenarios are proven at the integration altitude here, not that the feature is skipped.

## Dispatch contract

**Dispatch-only conductor — loading this skill is not running it.** The only permitted actions per stage are: (1) spawn that stage's named seat as a real seat dispatch — explicit model, stamped `UPMIND_SEAT` + `UPMIND_LIFECYCLE`; (2) collect the structured gate field the seat returns; (3) route on it — advance, repair loop, or halt-and-surface-verbatim (a mid-run blocking question does not exist: anything a seat cannot proceed without was settled at intake or is a halt). A gate resolves **only** on a field a dispatched seat returned, never on the conductor's own artefact inspection — a pre-existing/approved SDD set still gets a planner dispatch, briefed to *validate the existing set and return the gate fields*, not re-author it. Doing any stage's work in the conductor's own context — hand-resolving a gate, settling the arms determination in the conductor's own context, authoring any stage output inline — is the Trigger's freehand-interpretation defect **even with this SKILL.md loaded in context**: zero seat dispatches by the first gate is the tell that the run is cosplay, not conduction.

**Namespace resolution.** Every skill this file names in short form (`/sdd` and its sub-phases now live under the `/plan` door; `/code-scoped-composable`, `/code-generate`, `/code-verify`, `/code-review` keep their names; `/test` was `/test-module`; `/docs` was `/docs-module`; worktree lifecycle is `/start` · `/pause` · `/complete` · `/resume` (was `/worktree`); `/runner` was `/code-workflow`; `/complete` absorbs the former `/mr-create`, …) ships in the **`upmind-agent` plugin**: invoke it via the Skill tool as `upmind-agent:<name>`, and spawn seats as `upmind-agent:<seat>` agent types (`upmind-agent:planner`, `upmind-agent:developer`, `upmind-agent:prover`, `upmind-agent:verifier`, `upmind-agent:reviewer`, `upmind-agent:documenter`). A short name missing from the session's listing while its `upmind-agent:`-prefixed form is present is a namespacing fact, not a missing dependency — resolve the prefix and proceed; halt only when neither form exists in the main session.

**Conduction runs in the MAIN session — never inside a subagent.** The Skill registry exists only in the main session, so the conductor (the main loop that loaded this skill) invokes every stage skill itself (`upmind-agent:<name>`) and dispatches seats as `upmind-agent:<seat>` agent types. The stage map is never wrapped in a background runner or any other Agent-tool subagent: a subagent has no Skill registry, so every `Skill(…)` call there returns Unknown skill and the run either dies or degrades into freehand cosplay.

Every seat dispatch sets an **explicit model** (never inherits the session/max-price model — `${CLAUDE_PLUGIN_ROOT}/rules/agent-orchestration.md` §3, "no exceptions") and an **explicit `UPMIND_SEAT` + `UPMIND_LIFECYCLE`** pair in the spawn environment before the tool call, per the seat-identity-transport mechanics in `${CLAUDE_PLUGIN_ROOT}/rules/agent-seat-separation.md` (cite, don't restate — `hooks/seat-guard.sh` reads only this transport, never prose).

**Per-seat models** (design §D3):

| Seat | Model | Stage(s) |
| --- | --- | --- |
| planner | `opus` | Research, Plan |
| developer | `sonnet` | Code |
| prover | `sonnet` | Tests |
| verifier | `opus` | Verify |
| reviewer | `opus` | Review |
| documenter | `sonnet` | Docs |

**Team maps** — this skill pins no models of its own; it dispatches the two existing seat maps that already carry these pins, so a change to either map's pins is inherited, not forked:

- Research/Plan (planner seat) → `${CLAUDE_PLUGIN_ROOT}/teams/plan-story.yaml`.
- Code/Tests/Review/Verify/Docs (developer → prover → reviewer → verifier → documenter) → `${CLAUDE_PLUGIN_ROOT}/teams/dev-story.yaml`. The Review stage's reviewer-model detail (mixed opus/sonnet/haiku finder panel) is `${CLAUDE_PLUGIN_ROOT}/teams/review-fanout.yaml`, invoked by `/code-review` itself — cited, not restated here.

**Lifecycle marker** — `UPMIND_LIFECYCLE=scoped-composable-factory` for every stage this skill dispatches. Every orchestrating skill mints its own marker value (`sdd`, `agent-run`, `code-wave`, `code-review`, `docs-corpus-audit` are the existing ones — the literal `lifecycle:` values still stamped by the plugin's team maps — see each team map's own `lifecycle:` field); this conductor is a distinct orchestration context from all of those, so it mints its own rather than borrowing `agent-run`'s. `hooks/seat-guard.sh` only requires the marker be non-empty to activate the lifecycle default-deny — it does not enum-check the value.

Absent an explicit model, a stamped `UPMIND_SEAT`, and a stamped `UPMIND_LIFECYCLE` on every dispatch, a seat silently inherits the live session's (max-price) model and loses its write-lane enforcement — this is exactly the failure `agent-orchestration.md` §3 and `agent-seat-separation.md` exist to close.

## Law gate

Review holds the built module to the FE-2967 law — cited, never restated:

- **The bindings:** the five variance-law clauses in `.claude/rules/code-composables.companion.md` ("Variance law (scoped composables, deltas only)"), and the reviewer cues + grandfather clause in `.claude/rules/code-reviews.companion.md` ("Variance-law cues (headless modules)").
- **Where enforcement lands:** the decidable tells are mechanically enforced by the **`scope-based` ESLint plugin** (`packages/eslint-plugin-scope-based/`, wired into the repo's flat config) as part of `pnpm lint` / CI — clause 2 (empty scaffold), clause 3 (byte-identical cosplay override), clause 4 (SELF branch), clause 5 (`@decision` completeness), the decidable half of clause 1 (sub-layer set + `@internal` markers), and arm-in-matrix. Review's `/code-review` pass (loads the second binding automatically, Step 0) owns what stays judgement: clause 1's full return-shape uniformity, clause 3's override *quality*, and `@decision` *quality*. An unjustified deviation is a 🔴 Blocker at whichever gate catches it — a lint error at the Code/CI gate, or the Review-stage gate (`blocker count = 0`). A tolerated exception is a native `// eslint-disable-*-line scope-based/<rule> -- <reason>`, in place.
- **Why Verify's gate doesn't also law-check:** `/code-verify`'s own charter is explicit that it is "not a quality review" and "does not flag style, naming, or correctness defects — only delivery"; design §D5 separately scopes the composed `law-audit` procedure (the `scope-based` ESLint plugin + reviewer-with-worktree-target) to "AC4 (canonical set) and AC6 (templates) and nowhere else." Verify's gate above (`verdict field = PRESENT`) stays a delivery check only — it neither runs the `scope-based` lint nor judges a clause.
- **Behaviour, not a new mechanism:** this is the identical BLOCK / pass-and-surface shape already proven at `docs/sdd/FE-2966-FE-2967/evidence/task-4-baseline-and-bound/` (AC3) — the factory's Review gate keys on exactly those structured fields (blocker count, `@decision` completeness), not a reinvention of them (AC7).
- **Pass-and-surface:** a deviation carrying a complete `@decision` (`what:`/`why:`/`rejected:`) is not a blocker — it passes, and the run's report surfaces the decision rather than absorbing it silently.
- **Grandfather clause applies unchanged:** a conversion target's pre-existing unscoped structure grades 🟡 advisory, never 🔴, until this run's own diff adds or modifies scoped-composable structure.

## Repair loop

A **legitimately-red test** is not a run halt. The prover (diff-blind, contract-fed only) files the failure against the public-surface contract; the conductor routes the failure back to the **developer** seat for repair as a fresh dispatch (never the same invocation that produced the original diff — seat separation holds across a repair, same as a rejected-CR re-do) and re-enters the Tests stage once the fix lands. This repeats up to **three cycles** on the same failure (`${CLAUDE_PLUGIN_ROOT}/rules/agent-behavior.md` §5); a fourth failure of the same behaviour escalates to the operator instead of cycling again.

When a repaired (or newly-armed) behaviour needs a fresh negative control, the `.must-fail.patch` is authored by the **developer** — it knows the mutated line — and verified RED, blind, by the **prover**; a prover never reads src to hand-build the mutant (author-of-mutation ≠ verifier-of-red — `.claude/rules/agent-seat-separation.companion.md`, "Must-fail negative-control patches — who authors them").

## Other failure states

- **Any other gate fails** (Research/Plan/Code/Verify/Review/Docs) → the run halts and surfaces the failing structured field verbatim (never a paraphrase) — no silent retry past a law block.
- **Doctrine-vs-example (or -template) disagreement** — the doctrine wins; the disagreement is surfaced as a finding for the operator, never silently resolved toward `useAuth`/a template (`code-composables.companion.md`'s precedence correction).
- **Verify returns ABSENT** — the run does not advance to Review or Docs; the missing load-bearing part named in `verify.md` routes back to the developer seat, same shape as the repair loop above.
- **Worktree disposal** — on completion (or abandonment), dispose of the run's worktree via `/complete` (worktree cleanup is owned by `/complete`; the former `/worktree` door is folded into the lifecycle doors); a run never leaves a stale worktree behind.

## Non-goals

- This skill **never produces an artefact itself** — every file on disk at the end of a run was written by a named skill under a named seat, never by the conductor directly.
- **No scripts or generators invented mid-run.** Mechanical law enforcement is the standing **`scope-based` ESLint plugin** (`packages/eslint-plugin-scope-based/`) — part of the repo's single flat config and CI lint, with RuleTester specs — not a bespoke script this skill spins up. The skill consumes it via `pnpm lint`; it never re-implements, forks, or adds a second checker.
- **Protected core is untouchable.** Headless core paths stay behind the operator sign-off token regardless of stage or seat (`rules/agent-behavior.md` §5's "never becomes licence to hack" clause and `rules/agent-seat-separation.md`'s developer-row write-lane law both cite this; this skill adds no exception).
- **No stage skips a seat.** A stage without both a named skill and a named seat is a defect in this file, not a shortcut to take at run time.
- **This skill does not run itself.** Authoring this SKILL.md is FE-2966; conducting a real conversion or net-new build with it is FE-2968 — nothing here converts `client-phone`, `client-email`, or any other module.

## Output

On completion: the artefact chain (research → plan → diff → tests → `verify.md` → review findings → docs set) fully present, every gate's structured field green, and the run's evidence filed. This skill opens no change request and emits no review verdict itself — the human MR/PR flow and the human review verdict remain outside it (`rules/agent-orchestration.md` §2, ADR-029); `/complete` (which absorbs the former `/mr-create` — it opens the change request) is a separate, explicit step a caller takes once Docs clears.
