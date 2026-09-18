---
name: factory-composable
user-invocable: false
description: Internal (invoked by /factory) — the LAWS the scoped-composable lane runs under. The chain itself is .claude/workflows/run-factory-composable.js; this file is the doctrine that script implements and the reasoning a seat needs. Intake arrives parsed from the door; this lane asks nothing.
---

# factory-composable — the laws of the scoped-composable lane

**JTBD (the anchor for every in-run decision and every `@decision`):** one command that produces a complete, correct, proven scoped composable — new or converted — every single time (`docs/sdd/FE-2966-FE-2967/requirements.md`).

## Where the chain lives

**The lane's conductor is a script: [`.claude/workflows/run-factory-composable.js`](../../../workflows/run-factory-composable.js).** It owns the stage order, the seat per stage, the model per seat, every gate field and threshold, the repair loops, the cycle caps and the halt names. The door calls it directly, as its second dispatch, after the audit.

**This file owns the doctrine that script implements** — the laws, the reasoning, and the receipts a seat needs to do its stage correctly. It carries no stage table, no gate thresholds and no model pins, because those live in the script and a rule written twice drifts.

Where the script and this file disagree, **the script is the defect** — fix the script. Never hand-run the chain from this file: a stage map read and executed turn by turn is the freehand-interpretation defect, and it loses the whole run to any lost session.

The stage ORDER is doctrine, so it is stated once here with its reasons: **Research → Plan → Code → Tests → Verify → Review → Docs.** Verify precedes Review and Docs because an ABSENT verdict must reach neither, and because the documenter takes `verify.md` as an input and refuses to certify a capability the verifier has not returned `PRESENT` on. Sequencing Docs earlier would let it describe something as delivered before delivery is confirmed.

## Trigger

- Dispatched by the `/factory` door's runner whenever the Stage-0 audit grades the module M0–M2 (mode `net-new`, `conversion`, or `upgrade` — the audit's derivation, or an operator override that survived the mismatch law). Never invoked directly, never self-triggered mid-conversation from "build me a composable".
- **Intake arrives parsed from the door** — the seven answers, the audit's state table with its drift list, the recorded run constraints and the arms disposition, already echoed. This lane asks nothing and re-collects nothing; a field it finds missing is a door defect and a halt, not a question raised mid-run.
- **The parsed intake is intake, never a substitute spec.** However detailed the invocation the door parsed, it is input to this lane — the skill was named, so the skill runs.

## What each stage is FOR

The script says which seat, which gate and which threshold. This says why, which is what a seat needs to do the work rather than satisfy the field.

- **Research** establishes the oracle. For a `conversion` that is wherever the existing implementation lives — the current headless module and/or the legacy surface being ported; a module can be new to headless and still be a conversion. For `net-new` there is no existing implementation anywhere, and the oracle is the closest legacy-parity analogue. Conversions additionally derive the **variant** from the oracle's own composable shapes, because an assumed variant amputates whatever the oracle ships that it cannot express (receipt: 2026-08-05 client-email — `variant=query` against an oracle shipping `useClientEmailManager` dropped the entire manager surface).
- **Plan** produces the FULL SDD set for `conversion` and `net-new`: a ported or net-new module is never trivial, so the light plan route is not an option and a lone `design.md` is not acceptable output. `upgrade` dispatches `upmind-agent:plan` BARE and inherits whatever depth that door picks for the drift — the factory does not second-guess it, and the gates are otherwise unchanged, because a gap-closure over a landed module is precisely where silent capability drops hide.
- **Code** scaffolds from the variant's template set. Three laws bind it; each has its own section below.
- **Tests** is contract-fed: the prover receives `design.md`, the Gherkin, the parity table and the exported public surface — the diff and the builder's hand-off report are **withheld** (ADR-029). It runs unit + integration only; this lane never asks `upmind-agent:test` to route a behaviour to e2e, so the feature's journey scenarios are proven at the integration altitude here.
- **Verify** is a **delivery** check, not a quality review. It grades whether the JTBD's capability actually landed, measured against the ORACLE — for a conversion, every composable surface of the module being replaced — never only the parity table's self-declared in-scope list. It neither runs the variance-law lint nor judges a clause; that is Review's job.
- **Review** holds the built module to the variance law. See "Law gate" below.
- **Docs** generates the module's documentation set and is graded by a **separate** reviewer dispatch. An author never grades its own output.

**Tests and Docs are dispatched exclusively through their factories** — `upmind-agent:test` and `upmind-agent:docs`, never their internal unit / integration / e2e or foundation / guide / review phases directly. Those remain the two factories' own internal dispatches.

## Research files its findings — a returned field is not a record

Research is the one artefact-producing stage whose output once existed only as a message in the conductor's context: its gate resolved on returned fields, and nothing reached disk until the Plan stage ran. A session lost between the two lost the entire oracle sweep, and the next run paid for it again.

So the Research seat **writes `research.md` into the story's SDD directory** — the same directory the Plan stage's bundle lands in — before returning its gate fields. The file carries the oracle capability inventory with its `file:line` receipts, the variant derivation, the criteria surface, the precedent modules, and every question the seat could not close. The returned fields stay the gate; the file is the record the Plan stage READS instead of re-deriving.

Writing it is inside the planner seat's existing write lane (`agent-seat-separation`: read-only everywhere except the SDD directory), so this adds no seat permission. Two companions, same directory, same reason:

- **Operator rulings go to `review-notes.md`** — the per-story ruling file (`the seat laws (agents/*.md, Laws section)` §1), read first on every re-run and mirrored to the issue tracker. A ruling the operator gives mid-run — a variant call, a scope boundary, a correction to a seat's output — binds at ADR level for that story and is worthless if it lives only in the run's chat.
- **Where the SDD directory is gitignored** (this repo ignores `docs/sdd` as "working notes, not the durable record"), neither file survives the worktree, so the run ALSO mirrors the rulings to the issue tracker as the `## 🤖 AI Session` comment. On-disk for the seats, tracker for the record — never one alone.

## Code law 1 — the arms determination

**Derived at Plan, independently re-verified at Code, never asked.** The determination is a **per-layer multi-select**, not a single yes/no: does this module's ADR-001 parity table give any actor a member exclusive to it, or one overriding the shared factory (clause 3, `code-composables.companion.md` "Variance law"), at any of services / actions / context / meta / schemas?

The **planner** derives it mechanically at Plan from the parity table plus the research oracle — a per-actor route, capability gate, or member at a layer earns that layer's arm — and records it as the parity table's `arms:` block. The SDD can get this wrong, so the **developer seat re-derives it independently before scaffolding**, from the landed parity table against the clause-3 rules themselves, never by trusting the recorded block. A mismatch between the seat's re-derivation and the recorded block (or an operator `arms=` override) is a gate failure surfaced verbatim with both determinations shown — the run never silently picks a side (`agent-behavior.md` §1: contradiction escalates).

Clause 3 applies independently to each of the five layers — a module may earn a services arm and nothing else, or earn arms at two layers and stay armless at the rest. Answer per layer:

- **A layer determined armless** → scaffold that layer armless only (its own shared `{module}.services.ts` / `use{Module}.actions.ts` / `use{Module}.context.ts` / `use{Module}.meta.ts` / `{module}.schemas.ts` default shape) — the majority case (`account/` is the canonical armless exemplar).
- **A layer determined earning** → copy that layer's arm template per earning actor, concretise its worked-example members into this module's real ones, and wire it into that layer's shared file — a `case` in `scopedServices()` / `scopedSchemas()` for services and schemas, an `actorScope === …` branch plus a last-position spread for actions/context/meta. No signature changes and nothing is renamed: every shared file already carries its resolution seam as live code, so the file looks the same armed or armless. Full when/how/lint-gate decision tree: `templates/ARMS.md`.
- **`schemas`** → earns only when the same form carries **different fields or different required rules per actor**. No module in this codebase has earned this split yet — every current `.schemas*.ts` split is by form/flow — so an earned `schemas` arm is new ground: cite the parity-table row that justifies it in the arm file's own `@decision` block.

**Every arm carries at least one member exclusive to it, OR one overriding the shared factory** — **and an override is A vs A+B**: the shared factory does A; the arm does A *and something more*. An "override" whose body is byte-equal to the shared implementation is cosplay: it claims to override and delivers nothing (`verify-cosplay.md`). Kill it, or make the difference real.

This sub-question exists because the templates alone previously could not produce a full copy of their own canonical exemplar (`auth/`, which carries earned arms) — a direct JTBD gap for any module hitting clause 3 at ANY layer (`docs/sdd/FE-2966-FE-2967/evidence/decisions.md`, 2026-07-28, plus the operator ruling that expanded the closure from two layers to all five).

## Code law 2 — the scope block: a leaf record is an ID, never a context

The scope block is derived from the **legacy oracle**, not from the template's placeholder enum. Answer one question before scaffolding it: *which entities does the legacy code let this actor act on behalf of for this capability?*

- **The oracle names entities** → mint the context enum and the `*_SCOPE_MATRIX` from exactly those, per the parity table.
- **The oracle names none, and the composable reads one record by id** → mint **no** context enum, and mint an **all-`never`** `*_ITEM_SCOPE_MATRIX` whose type you DO pass as `TMatrix`. The id rides on the scope builder's `.withId(id)`. An absent context ENUM is the ANSWER for a single-record read; an absent `TMatrix` is a regression — the default `ActorContextMatrix` widens every cell to `string` and keeps `.for("anything", id)` type-checking.
- **The oracle names none, and it is not a single-record read** → **STOP and ask the operator.** Never mint a context type to fill the slot.

A minted context type is a CLAIMED CAPABILITY; one with no oracle behind it is `verify-cosplay.md` — right shape, green gates, no capability. The `graphify` gate answering "no such construct exists" licenses a new **name**, never a new **concept**. Full decision tree + the FE-3095 receipt: `templates/SINGLE-READ.md`.

## Code law 3 — the criteria-subversion law

Cited from the door's SKILL.md, not restated: the module's queryCriteria schema owns ALL request state — filters, sort, pagination, limit — and every one of them reaches the wire only through the platform channel (`list({ criteria: { schema } })`); the templates already demonstrate the wiring. A hand-rolled filter ref, a `filter[...]` string, or a raw sort/limit literal beside the channel is a defect at Code, a 🔴 at Review, and a drift row at any later audit.

## The `<module>.feature` is the coverage contract for BOTH sides

The Plan stage's BDD phase produces a **co-located Gherkin `<module>.feature`** in the module's `__tests__/` at **capability altitude** — one scenario per ADR-001 actor×context behaviour the parity table carries, in actor/business language, never a per-mapper/per-schema unit nor a vague "it works". The module business-logic feature is authored by the **BDD route of `upmind-agent:test`** (the `code-test-bdd` craft), distinct from the SDD chain's own BDD phase, which owns only cross-module e2e journeys and must **not** author the module feature.

That feature is the module's single behavioural source of truth. Every integration test and every capability-level unit test traces to a scenario in it: a scenario with no proving test is a visible coverage hole, a behavioural test with no scenario is untethered. The link is **enforced in-suite by a co-located `<module>.traceability.test.ts`** — it parses the feature's `@AC-*` scenario tags and the sibling tests' AC-ids and fails if any non-`@todo` scenario has no proving test, or any test names a scenario the feature doesn't carry.

Both sides are bound: the **Code** stage's developer implements every scenario the feature carries, and the **Tests** stage's prover anchors every test to a scenario — an unmapped test means the feature gains the missing scenario, **never** that the test is dropped. Coverage never falls.

## Negative controls — who authors the mutant

A `*.must-fail.patch` needs the exact source line (the **developer**'s knowledge) but lives under `__tests__/` (the **prover**'s write lane). Resolve it by the seam:

- The **developer** authors the mutant patch — it knows the line it changed, and mutating production source is not a test assertion, so it neither self-certifies nor grades anything.
- The **prover** applies it blind, confirms the intended assertion goes RED, then reverts — never reading implementation source to construct one.

Author-of-mutation ≠ verifier-of-red (`the seat laws (agents/*.md, Laws section)`). This holds through every repair cycle: a behaviour repaired or newly armed needs its fresh control authored the same way.

## Seat separation holds across a repair

A **legitimately-red test is not a run halt**. The prover (diff-blind, contract-fed only) files the failure against the public-surface contract, and the failure routes back to the **developer** seat as a **fresh dispatch** — never the same invocation that produced the original diff, exactly as a rejected change request is re-done. The fix is to the SOURCE, not the tests.

The cycle cap and the escalation are the script's; the law here is that the repairing dispatch is never the authoring one.

## Law gate

Review holds the built module to the FE-2967 law — cited, never restated:

- **The bindings:** the five variance-law clauses in `.claude/rules/code-composables.companion.md` ("Variance law (scoped composables, deltas only)"), and the reviewer cues + grandfather clause in `.claude/rules/code-reviews.companion.md` ("Variance-law cues (headless modules)").
- **Where enforcement lands:** the decidable tells are mechanically enforced by the **`scope-based` ESLint plugin** (`packages/eslint-plugin-scope-based/`, wired into the repo's flat config) as part of `pnpm lint` / CI — clause 2 (empty scaffold), clause 3 (byte-identical cosplay override), clause 4 (SELF branch), clause 5 (`@decision` completeness), the decidable half of clause 1, and arm-in-matrix. The Review stage owns what stays judgement: clause 1's full return-shape uniformity, clause 3's override *quality*, and `@decision` *quality*. An unjustified deviation is a 🔴 Blocker at whichever gate catches it. A tolerated exception is a native `// eslint-disable-*-line scope-based/<rule> -- <reason>`, in place.
- **Pass-and-surface:** a deviation carrying a complete `@decision` (`what:`/`why:`/`rejected:`) is not a blocker — it passes, and the run's report surfaces the decision rather than absorbing it silently.
- **Grandfather clause applies unchanged:** a conversion target's pre-existing unscoped structure grades 🟡 advisory, never 🔴, until this run's own diff adds or modifies scoped-composable structure.
- **Behaviour, not a new mechanism:** the identical BLOCK / pass-and-surface shape already proven at `docs/sdd/FE-2966-FE-2967/evidence/task-4-baseline-and-bound/` (AC3).

## Fixture provenance

When the run's diff touches `__tests__/fixtures/`, the verifier **re-captures itself** — runs the repo's fixture generator against the real system and compares fresh capture against shipped fixtures, structurally (keys, shapes, enums; not volatile values). A mismatch is ABSENT: a hand-typed fixture only survives comparison with reality by having recorded reality. No manifest or stamp substitutes — stored receipts are forgeable; the live re-capture is the gate (operator ruling 2026-08-05).

## Doctrine beats the template

Where doctrine and an example or template disagree, **doctrine wins**, and the disagreement is surfaced as a finding for the operator — never silently resolved toward `useAuth` or a template (`code-composables.companion.md`'s precedence correction).

## Names and rules are ambient — never hunt the filesystem

Every skill is named in the exact `upmind-agent:<name>` form the Skill tool takes, and every seat is the agent type `upmind-agent:<seat>` (`planner`, `developer`, `prover`, `verifier`, `reviewer`, `documenter`). The harness resolves both from the session's registry, **not** by locating files on disk — so a run never searches for a plugin directory, an `agents/*.md`, a `seat-guard.sh`, or a `SKILL.md`. The plugin's install root is not knowable from this file, so a hunt finds nothing or, worse, a **different plugin's** files. A name genuinely absent from the session's listing is a missing dependency and a **halt** — never licence to substitute a hand-written brief, a `general-purpose` agent, or another plugin's copy.

The always-on law set (`agent-behavior`, `agent-seat-separation`, `verify-reality-check`, `verify-negative-controls`, `verify-parity-oracle`, `verify-cosplay`) is injected into every session, and this repo's `.claude/rules/*.companion.md` bindings load with it. Cite a rule by **name**; never construct a filesystem path to one.

Since `upmind-agent` 0.13.0 every seat agent type carries the `Skill` tool plus its preloaded entry skill (planner→`plan`, developer→`code`, prover→`test`, reviewer→`code-review`, verifier→`code-verify`, documenter→`docs`), so a dispatched seat executes its stage's REAL skill content. What the script spawns is named seats told to run their named skill — never a hand-written brief that paraphrases one.

## Non-goals

- **Neither this file nor the script produces an artefact itself** — every file on disk at the end of a run was written by a named skill under a named seat.
- **No scripts or generators invented mid-run.** Mechanical law enforcement is the standing `scope-based` ESLint plugin, part of the repo's flat config and CI lint — not a bespoke checker a run spins up. The lane consumes it via `pnpm lint`; it never re-implements, forks, or adds a second one.
- **Protected core is untouchable.** Headless core paths stay behind the operator sign-off token regardless of stage or seat (`rules/agent-behavior.md` §5 and `rules/agent-seat-separation.md`'s developer-row write-lane law; this lane adds no exception).
- **Worktree disposal is not this lane's.** On completion or abandonment the run's worktree is disposed via `upmind-agent:complete`, which owns cleanup; a run never leaves a stale worktree behind.

## Output

On completion: the artefact chain — `research.md` → the SDD set → the diff → the tests → `verify.md` → review findings → the docs set — fully present, every gate's structured field green, and the run's evidence filed. This lane opens no change request and emits no review verdict: the human MR/PR flow and the human review verdict remain outside it (`agent-orchestration` §2, ADR-029). `upmind-agent:complete` is a separate, explicit step a caller takes once Docs clears.
