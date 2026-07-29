---
name: scoped-composable-factory
description: The pick-dev conductor for scoped composables — one skill that conducts intake, research, plan, code, tests, verify, review, and docs end-to-end by dispatching the existing named skills and seats, so a conversion or net-new module never re-derives the process. This is the SPEC for the skill; a run of it is FE-2968, not this bundle.
---

# /scoped-composable-factory — the pick-dev conductor for scoped composables

**JTBD (the anchor for every in-run decision and every `@decision`):** one command that produces a complete, correct, proven scoped composable — new or converted — every single time (`docs/sdd/FE-2966-FE-2967/requirements.md`).

This skill **conducts**; it never authors an artefact itself. Every stage below delegates to a named existing skill running under a named seat, and every gate resolves a structured field — never a prose judgement this skill makes on its own. See `docs/sdd/FE-2966-FE-2967/flow.md` for the narrative walkthrough this SKILL.md operationalises.

> **No run of this skill ships in FE-2966/FE-2967.** Running it over a real module — `client-phone` or any other — is FE-2968's job. This file is the conductor's spec.

## Trigger

- `/scoped-composable-factory` — invoked by the FE-2968 runner (or an operator) with the intake answers below.
- Never self-triggered mid-conversation from "build me a composable" without the intake answers — a missing answer is one blocking question, not an assumption.

## Intake (JTBD-first)

Collect, in this order, before any stage runs. A missing answer is **one blocking question**, never a batch and never a default:

1. **The module's job to be done** — the anchor every later stage and every `@decision` traces back to. Not "what layers does it need" — what job does a consumer hire it to do.
2. **Target module** (name/path under `packages/headless/src/modules/`).
3. **Mode** — `conversion` (a legacy/vue-app or existing-headless module gets scoped) or `net-new`.
4. **Variant** — `machine` or `query` (selects the template set — see Code stage).
5. **ADR-001 cells in scope** — the actor × context cells this module's parity table will carry (cite ADR-001; do not re-derive the matrix here).
6. **Worktree** — where the run executes (`/worktree`).

## Stage map

Every artefact-producing stage names its skill and its seat; every gate names the structured field it resolves on. Docs runs **after** Verify — deliberately, not incidentally (see Docs row).

| Stage | Skill | Seat | Gate (structured field) |
| --- | --- | --- | --- |
| Research | `/graphify query` + docs-corpus sweep (glossary + `docs/reference/`) | planner | **citation count** ≥ 1 generic-sweep + ≥ 1 mode-specific-oracle citation (conversion → current module; net-new → vue-app legacy-parity oracle); 0 of either = fail |
| Plan | `/story-plan` (or `/sdd` when complex, per its own routing rule) | planner | **plan-artefact-exists** = true AND **undispositioned parity-cell count** = 0 (every ADR-001 cell in `parity.yaml` carries a disposition) |
| Code | `/code-scoped-composable` (scaffold) + `/code-generate` (checklist) with this skill's own `templates/{machine,query}/` set | developer | **diff file count** > 0 AND **hand-off-filed** = true (public-surface contract handed to Tests; diff/hand-off withheld from it — ADR-029) |
| Tests | `/test-module` — the test factory; routes each contract behaviour to unit/integration/e2e itself | prover (contract-fed public surface only — `design.md`, Gherkin, `parity.yaml`, exported types; diff and hand-off withheld) | **suite exit code** = 0 per layer dispatched; a no-boundary determination on the integration branch is a recorded field, not a silent skip |
| Verify | `/code-verify` | verifier | **verdict field** = `PRESENT` (ABSENT halts — see Failure states) |
| Review | `/code-review` (loads this repo's `code-reviews.companion.md`, which carries the FE-2967 variance-law cues) | reviewer (pre-gate) | **🔴 blocker count** = 0 |
| Docs | `/docs-module` — the docs factory; internally dispatches `/docs-foundation`, `/docs-guide` (persona-facing only), `/docs-review` | documenter | **missing-artefact count** = 0 AND **docs-review verdict** = clean AND upstream **verifier verdict** = `PRESENT` (a capability may not be described as delivered without it) |

**Code-stage intake sub-question — clause-3 arms.** Before scaffolding, the developer seat asks one more question, folded into the existing intake (not a new stage) — a **per-layer multi-select**, not a single yes/no: **"Does this module's ADR-001 parity table give any actor a member exclusive to it or overriding the shared factory (clause 3, `code-composables.companion.md` "Variance law")? Select every layer where that's true: services / actions / context / meta / schemas."**

Clause 3 applies independently to each of the five sub-composable layers — a module may earn a services arm and nothing else, or earn arms at two layers and stay armless at the rest. Answer per layer, not once for the whole module:

- **A layer selected "no"** → scaffold that layer armless only (its own shared `{module}.services.ts` / `use{Module}.actions.ts` / `use{Module}.context.ts` / `use{Module}.meta.ts` / `{module}.schemas.ts` default shape) — the majority case (`account/` is the canonical armless exemplar).
- **A layer selected "yes"** → copy that layer's `templates/{machine,query}/{module}.services.{actor}.ts` / `use{Module}.actions.{actor}.ts` / `use{Module}.context.{actor}.ts` / `use{Module}.meta.{actor}.ts` / `{module}.schemas.{actor}.ts` arm template per earning actor, concretise its worked-example members into this module's real ones, and wire it into that layer's shared file — a `case` in `scopedServices()` / `scopedSchemas()` for services and schemas, an `actorScope === …` branch plus a last-position spread for actions/context/meta. No signature changes and nothing is renamed: every shared file already carries its resolution seam as live code, so the file looks the same armed or armless. Full when/how/lint-gate decision tree: `templates/ARMS.md` (one file, covers both variants; per-variant differences are tabled in its own "Variant deltas" section).
- **`schemas`** → answer "yes" when the same form carries **different fields or different required rules per actor** (e.g. a client registering themselves supplies fields a staff member registering on their behalf does not, and is held to a tighter required list). No module in this codebase has earned this split yet — every current `.schemas*.ts` split is by form/flow — so a "yes" here is new ground: cite the parity-table row that justifies it in the arm file's own `@decision` block.

**Every arm carries at least one member exclusive to it, OR one overriding the shared factory** (the arm templates demonstrate one of each; an arm carries only what it earned) — **and an override is A vs A+B**: the shared factory does A; the arm does A *and something more*. An "override" whose body is byte-equal to the shared implementation is cosplay: it claims to override and delivers nothing (`verify-cosplay.md`). Kill it, or make the difference real.

This sub-question exists because the templates alone previously could not produce a full copy of their own canonical exemplar (`auth/`, which carries earned arms) — a direct JTBD gap for any module hitting clause 3 at ANY layer, closed by this task (`docs/sdd/FE-2966-FE-2967/evidence/decisions.md`, 2026-07-28 "JTBD gap" entry + the operator ruling that followed it, which expanded the closure from two layers to all five).

**Tests and Docs are dispatched exclusively through their factories.** This skill invokes `/test-module` and `/docs-module` and nothing else at those stages — it never calls `/code-test-unit`, `/code-test-integration`, `/code-test-e2e`, `/docs-foundation`, `/docs-guide`, or `/docs-review` directly. Those remain the two factories' own internal dispatches; restating their routing here would duplicate a rule this skill only delegates to.

**Docs runs after Verify, not before.** The documenter's own procedure takes `verify.md` as an input and refuses to certify a capability the verifier hasn't returned `PRESENT` on — sequencing Docs any earlier would let it describe something as delivered before delivery is confirmed.

**FULL TESTS = unit + integration only.** Per the binding ruling in `review-notes.md`, the factory's Tests stage never dispatches e2e — `/test-module` itself would only route a behaviour there if asked to, and this conductor never asks.

## Dispatch contract

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

**Lifecycle marker** — `UPMIND_LIFECYCLE=scoped-composable-factory` for every stage this skill dispatches. Every orchestrating skill mints its own marker value (`sdd`, `agent-run`, `code-wave`, `core-review`, `docs-corpus-audit` are the existing ones — see each team map's own `lifecycle:` field); this conductor is a distinct orchestration context from all of those, so it mints its own rather than borrowing `agent-run`'s. `hooks/seat-guard.sh` only requires the marker be non-empty to activate the lifecycle default-deny — it does not enum-check the value.

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

## Other failure states

- **Any other gate fails** (Research/Plan/Code/Verify/Review/Docs) → the run halts and surfaces the failing structured field verbatim (never a paraphrase) — no silent retry past a law block.
- **Doctrine-vs-example (or -template) disagreement** — the doctrine wins; the disagreement is surfaced as a finding for the operator, never silently resolved toward `useAuth`/a template (`code-composables.companion.md`'s precedence correction).
- **Verify returns ABSENT** — the run does not advance to Review or Docs; the missing load-bearing part named in `verify.md` routes back to the developer seat, same shape as the repair loop above.
- **Worktree disposal** — on completion (or abandonment), dispose of the run's worktree via `/worktree`; a run never leaves a stale worktree behind.

## Non-goals

- This skill **never produces an artefact itself** — every file on disk at the end of a run was written by a named skill under a named seat, never by the conductor directly.
- **No scripts or generators invented mid-run.** Mechanical law enforcement is the standing **`scope-based` ESLint plugin** (`packages/eslint-plugin-scope-based/`) — part of the repo's single flat config and CI lint, with RuleTester specs — not a bespoke script this skill spins up. The skill consumes it via `pnpm lint`; it never re-implements, forks, or adds a second checker.
- **Protected core is untouchable.** Headless core paths stay behind the operator sign-off token regardless of stage or seat (`rules/agent-behavior.md` §5's "never becomes licence to hack" clause and `rules/agent-seat-separation.md`'s developer-row write-lane law both cite this; this skill adds no exception).
- **No stage skips a seat.** A stage without both a named skill and a named seat is a defect in this file, not a shortcut to take at run time.
- **This skill does not run itself.** Authoring this SKILL.md is FE-2966; conducting a real conversion or net-new build with it is FE-2968 — nothing here converts `client-phone`, `client-email`, or any other module.

## Output

On completion: the artefact chain (research → plan → diff → tests → `verify.md` → review findings → docs set) fully present, every gate's structured field green, and the run's evidence filed. This skill opens no change request and emits no review verdict itself — the human MR/PR flow and the human review verdict remain outside it (`rules/agent-orchestration.md` §2, ADR-029); `/mr-create` is a separate, explicit step a caller takes once Docs clears.
