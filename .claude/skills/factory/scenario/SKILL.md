---
name: factory-scenario
user-invocable: false
description: Internal (invoked by /factory) — lane 2 of the factory door. Derives a playground scenario page from a LANDED scoped composable and lands its declaration, its presentation, the module's step catalog and its one traceability test. It asks nothing: every field is read off the module, its schemas and its own feature.
---

# factory-scenario — the playground lane

**JTBD (the anchor for every in-run decision):** a module that has landed gets the driveable, replayable page that demonstrates it — derived from the module itself, never hand-built and never guessed.

This lane **conducts**; it never authors an artefact itself. Every stage below delegates to a named existing skill running under a named seat, and every gate resolves a structured field — never a prose judgement this lane makes on its own. Its stage shape, dispatch contract, repair loop and failure discipline are the composable lane's, cited from `.claude/skills/factory/composable/SKILL.md` and restated only where this lane's gates genuinely differ.

## Trigger

- Dispatched by the `/factory` door: on the `both` route once lane 1's Docs gate is green, and on the `page` route over a module that already exists. **Never user-invoked, never self-triggered.**
- **Intake arrives parsed from the door.** This lane asks nothing — the module does not exist at intake on the default route, and the factory WRITES the page, so there is nothing for an author to pin. A field this lane cannot derive is a **halt** naming the row and the file it looked in — never a question, never a default.
- The door has already graded the target M3 — template-conformant, build green (its Stage-0 audit and template contract, cited not restated). This lane never re-checks it and never half-derives from a module that failed it.
- **A mid-run discovery that the module lacks a channel the page consumes is a HALT back to the door** — the module is regraded M2 and the composable lane runs first. It is NEVER derived around, repurposed around, or absorbed as a pass-and-surface decision: a surfaced decision may cover vocabulary lag, never an absent capability (2026-08-14 receipt: a repurposed `useMutate` and a missing criteria surface were both absorbed as surfaced decisions and shipped).

## Derivation contract

Every row is read off the LANDED module, its schemas and its own `__tests__/`, and each carries a `file:line` receipt. **No row is left undecided** — a row the module cannot answer is a module gap and a halt, never a field to guess. The gate's exact field is the runner's.

| # | Fact | Read from |
| --- | --- | --- |
| D1 | `key`, and the url segment / route name | Snake-case of the module noun. The route is the declaring DIRECTORY, never declared — the registry attaches it from the glob key |
| D2 | `useList` | The module's public collection composable, from the target module's own `index.ts` |
| D3 | `useMutate` | The module's manager composable, where the module ships one |
| D4 | Which actors the page offers | The composable's own exported `*_SCOPE_MATRIX` — its non-`never` cells |
| D5 | `identifier` | The row's identity property; omitted where it is `id` (`scenario.types.ts`'s `DEFAULT_ROW_IDENTIFIER`) |
| D6 | The table's element list — one element per field, each element's renderer type and its `i18n` column header | The mapped record the composable publishes (its `{module}.mappers.ts`). Renderer follows the field: a date → `TableCellDate`, a boolean group under `meta` → `TableCellBadges`, a single boolean drawn filled/outline → `TableCellIcon`, else `TableCellText`. A system id, a duplicate of another field, an always-empty field and a server-fixed deprecated const are never elements |
| D7 | The card's element list | The same record, drawn in card slots |
| D8 | Candidate action members, AND the `name` each drawn control carries | `useModules().useActions()`'s live map. A control's `name` IS the capability it performs — the member the composable actually exposes — never the dialog it opens. A scenario step names the capability and the step is a PRESS, so a control named for its dialog (`add` over a composable whose action is `ensure`) is one no step can find: the replay falls back past the screen and only the data moves |
| D9 | Candidate gate flags for those actions | The row's own `meta` booleans — the record carries its per-row capability |
| D10 | `handoff` + its inline editor spec | Present where `useMutate` exists; the create handoff carries no `contextFrom` (a record that does not exist yet boots fresh), `edit` points at the row's identifier. The handoff KEY names the editor; it never renames the control that opens it (D8) |
| D11 | `persistCriteria` | True where the composable exposes a list-criteria surface |
| D12 | `tracks` | The module's own name — the one string the declaration carries. Which of the module's scenarios are driveable is the step catalog's answer, never a derived field |
| D13 | How many scenario directories the run writes | Exactly one per module — one module, one declaration |
| D14 | The filter bar and its fields | `useContext().schemas.query` — the module's own `{ schema, uischema }` pair. ABSENT = halt to door (M2 regrade), never derived around |
| D15 | The sort control's options | The criteria schema's own sort member (the module's sortable-properties enum). ABSENT or a raw string literal = halt to door |
| D16 | The pager | `useContext().pagination` — the reactive descriptor. ABSENT = halt to door |
| D17 | `presentation.icon` | The module's own subject, named as a **lucide** icon the app's map resolves. The template ships `"icon-name"` as a PLACEHOLDER, and a placeholder is a RED gate |
| D18 | The error flag every step's `expectMeta` names | The BOOTED composable's own `.meta.ts`: a collection (`useList`) publishes `hasError`, a manager (`useMutate`) publishes `hasErrors`. A manager-only declaration (a single form) says `hasErrors`; the template's `hasError` is the collection's and is a RED gate there — `expectMeta` is a subset match over raw meta and renames nothing (`client-billing-settings.steps.ts`, 2026-09-12: 51 steps mismatched on the first scene) |
| D19 | The action ids the steps fire (`*_COVERED_ACTIONS`) | Keys of the BOOTED composable's own `useActions()` return, per id. `refresh` is a collection's; a manager re-reads through `reset` and has no `refresh` — a manager-only declaration firing it fails mid-replay with `unknown action` (`client-billing-settings.steps.ts`, 2026-09-12) |
| D20 | The replay spec that RUNS the catalog — `{module}.replay.int.test.ts` | Lands WITH the step catalog, in the same `__tests__/`, never after it and never only when a page exists: it replays every non-`@todo` scenario of the module's own `.feature` through that catalog against the composable the declaration BOOTS, over the module's own RECORDED corpus served by the ONE shared replay — `@upmind-automation/test-fixtures/corpus-replay`, installed through `packages/headless/src/testing/corpus-replay.ts`, the same fake API the labs page arms; a per-module `server.use(http.…)` in the test is a second replay and a RED shape (2026-09-12 sweep, five thrown away) (`templates/{module}.replay.int.test.ts`, over `packages/headless/src/testing/replay-feature.ts`). It is a **RED gate**, not a report — D18's wrong flag and D19's wrong action id both TRACE perfectly, so the traceability test cannot see either and only an execution can. The scenario key maps to the composable whose actions the steps actually fire; a catalog whose scenarios need a second composable's action reds here rather than being skipped, which is the derivation defect surfacing, not the replay's gap (`client-billing-settings`, 2026-09-12: two defects landed under the silence of a catalog nothing executed) |
| D21 | The forced states the page OFFERS, and their names | Not derived by the run — the page reads the module's `.feature` at run time (`labs runtime/force/states.ts`): a sentence's words give the recipe (held: "loading / in progress / still saving / never settles / waits"; refused: "fails / refused / errored"; absent: "empty / no records / absent"; a write verb — save, change, update, delete… — makes it a write, else a read), and the recipe gives the ONE word every page uses (`Loading` · `Empty` · `Errored` · `Saving` · `Refused`, `forcedStateLabel`). `Loading` is offered to every page that reads, named or not. A feature sentence outside that vocabulary offers NO state, silently — so the feature author writes the states in these words, and the `force-states.spec` listing is the receipt |
| D22 | WHICH scenarios get steps at all | Not every scenario does. ADR-020 Amendment 5 (operator ruling 2026-09-12 — "tests are tests, scenarios are scenarios; not every test is a replayable scenario"): a scenario is a TRACK only when a real step drives EVERY line of it; otherwise it stays SPEC, gets no steps, and the player must not list it. So the feature splits into **page stories** (a person reading, filtering, sorting, paging, adding, removing, defaulting — drivable) and **contracts** (transport failure, staged/disabled state, brand gate, scope refusal, identity read-back — a sibling `*.int.test.ts` proves these, never a track). A step is legitimate ONLY if it fires a real action id off the booted composable or presses a real control; `() => Promise.resolve()`, a `seed: { journey }` boot (no executor honours `WorldScope.seed`), and a flag-only `Then` in a scenario nothing drives are all FAKE. And never half-match: the harness reads a partial match as playable, so a scenario that loses one step loses ALL its own steps. Receipt: `client-billing-settings`, 2026-09-12 — 26 scenarios, **18 driveable, 8 faked** with 32 do-nothing steps between them, every gate green throughout |

**D8's naming is a gate, not a preference.** Before filing the derivation table, check each drawn control's `name` against `useActions()`: a name that is not a live member — and is not itself the reason a handoff exists — is a control no scenario can press. Echo the create control's resolved capability by name in the report.

**D17 is a Derive-gate field like every other row, never "named after the run".** `modules/scenarios/__tests__/icon-resolution.spec.ts` (`AC-10`) reds on any name that falls back — and a fallback glyph is still an `<svg>`, so every count-based assertion stays green while the row draws the wrong picture. So the run that ships an unreplaced `icon-name` is the run that breaks the gate. Derive it from the module's subject and resolve it against the audit's own oracle: the published `Icon` component, lucide names only (the playground registers no SVG asset pack, so nothing else can resolve).

**D6's derived set and its exclusions are ECHOED for overrule, never silently applied.** The column picker's options are wider than the element list — every field of the mapped record is offerable — so an excluded field is still switchable on; what the list decides is the DEFAULT visible set, the header row, the column order and each cell's renderer.

## Forced states are the feature's, and forcing needs `reset`

A page's forced states are DERIVED from the module's own `.feature` — one per
transport condition a scenario names, labelled with that scenario's own title
(operator ruling, 2026-09-12; `runtime/force/states.ts`). This lane therefore:

- **declares no forced states anywhere.** There is no field on the declaration
  for them, no tag to add to a scenario, and no fixed list of four states. A
  feature naming no transport condition offers none, and its page is Live-only
  (`S12`) — a legitimate end state, never a gap to close by writing one down.
- **augments the `.feature` when a state is missing, never the declaration.**
  The way to give a page its loading / empty / refused states is the way the
  module gets any other capability: a scenario in its own `.feature` that says
  so, under the augmentation law above.
- **requires the module to publish `reset`.** Arming swaps what the tab's NEXT
  request is answered with, so a module that never asks again shows nothing:
  the page warns loudly (`ScenarioPlayground.vue`) and every state reads as a
  dead control. `reset` ships from the composable lane's own templates
  (`composable/templates/**`); a module without one is a **HALT back to the
  door** (M2 regrade), exactly like an absent channel.
- **owes the rendered proof.** One 3-line spec per scenario the shared
  playground draws, named for the MODULE its `tracks` field carries and landed
  beside the harness in
  `playgrounds/labs-nuxt/modules/scenarios/runtime/components/__tests__/`;
  `modules/scenarios/__tests__/forced-surface-coverage.spec.ts` reds without it.
  It is three lines and no more — every claim lives in the shared harness, so a
  page that hand-writes one is proving the harness, not itself:

  ```ts
  // @vitest-environment happy-dom
  import declaration from "../../../useModules/module.scenario";
  import { proveForcedSurface } from "./forced-surface.harness";

  await proveForcedSurface(declaration);
  ```

  ONE MODULE PER FILE: each module's replay lifecycle installs its own request
  interceptor over the same globals, so two in one file leaves the second one's
  server answering the first one's page.

## Ownership — every file, one seat

| File | Seat | This lane |
| --- | --- | --- |
| `{module}.scenario.ts` (the playground scenario directory) | developer | **AUTHORS** |
| `{module}.presentation.ts` (same directory) | developer | **AUTHORS** |
| `{scenario}.must-fail.patch` | developer | **AUTHORS** — it knows the mutated line, and emits it ONLY beside the spec it protects |
| `{module}.steps.ts` (the module's `__tests__/`) | prover | **AUTHORS** |
| `{module}.replay.int.test.ts` (same directory) | prover | **AUTHORS** — lands WITH the catalog, never after it (D20/D22) |
| `{module}.traceability.test.ts` (same directory) | prover | **AUTHORS** |
| `{scenario}.spec.ts` | prover | **AUTHORS** |
| `forced-surface.{module}.spec.ts` (the rendered proof, beside the harness) | prover | **AUTHORS** — 3 lines, the skeleton above; every claim is the shared harness's |
| `{module}.feature` (same directory) | prover | **AUGMENTS ONLY — lane 1 is its author** |

**The augmentation law, exactly.** Lane 1 authors the module's `.feature` — the capability spec a module owes whether or not a page is ever built. This lane APPENDS the scenarios the page drives, and may REPHRASE a scenario so a step can match it. It never deletes a scenario, never narrows a capability, and never becomes the file's author. Appending is at the end of the file, so it can add no `Background:` and no second `Feature:` — every appended scenario carries its own boot `Given`. Where the module's existing `Background:` governs the appended scenarios, its steps are part of them and the catalog defines those too.

The step catalog and the traceability test are the PLAYGROUND's concern; they merely LIVE in the module, because without a page nothing drives the feature. Colocation is the convention, not the ownership.

**A `page` route over a module carrying no `.feature` is refused** in the same plain terms as the scope precondition: there is nothing to augment, and writing that spec is lane 1's job.

Seat lanes are `agent-seat-separation`'s, cited not restated — including its companion's "Must-fail negative-control patches — who authors them": the developer authors the mutant, the prover applies it blind and verifies RED, never reading src to construct it.

## Where the chain lives

**The lane's conductor is a script: [`.claude/workflows/run-factory-scenario.js`](../../../workflows/run-factory-scenario.js).** It owns the stage order, the seat per stage, the model per seat, every gate field and threshold, the repair loops, the cycle caps and the halt names. The door calls it directly, as its third dispatch, after the composable lane; the ordering re-grade is this script's own first stage and the JTBD readback its last.

**This file owns the doctrine that script implements** — above all the derivation contract (D1–D22), which is the whole substance of this lane. It carries no gate thresholds and no model pins, because those live in the script and a rule written twice drifts. Where the script and this file disagree, the script is the defect: fix the script. Never hand-run the chain from this file.

The stage ORDER is doctrine, so it is stated once here: **Derive → Code → Tests → Verify → Review.**

## What each stage is FOR

- **Derive** fills the derivation table above off the **landed** module — every row cited with a `file:line` in that module, none invented. A row the module cannot answer is a module gap, not a field to guess.
- **Code** authors the scenario directory from this lane's templates against the filled table, and authors its own negative-control mutants — the developer knows the mutated line. It files the declaration's public surface as the prover's hand-off; the diff is withheld from the prover (ADR-029).
- **Tests** authors the step catalog, its one replay spec and its one traceability test **together**, over the module's own recorded corpus through the ONE shared replay. The prover applies each mutant blind, confirms RED, reverts.
- **Verify** grades the page against the **module's oracle surface**, never the declaration's self-report: the page boots and draws at every offered cell, its filter bar, sort control and pager render off the module's own `schemas.query` / `pagination` channels, and every drawn control presses a live member. **A page that draws rows but cannot filter, sort or page what the oracle offers is ABSENT.**
- **Review** is the pre-gate. It may block; it never emits the approval verdict.

**No Docs stage, deliberately.** The declaration is its own documentation surface — the app draws each declaration's source verbatim in the Scenario sheet — and the playground keeps no per-scenario docs. The module doc set is lane 1's.

**Tests are dispatched exclusively through `upmind-agent:test`.** This lane never calls its internal unit / integration / e2e phases directly.

**The replay spec (D20) IS the steps lane's RED gate.** The traceability test grades step TEXT against catalog PATTERNS, so a wrong flag (D18), a wrong action id (D19) and a fake step (D22) all trace perfectly and have never been run. The replay executes them. A SKIP in it is correct — that is a D22 contract scenario, spec-only by design. A RED is a halt, and it is read the same way every other gate is: fix it in the catalog when the catalog is wrong, regrade the module to the door when the capability is absent, never by deleting the scenario or loosening the step.

## Add-or-update — the upgrade law

Every route is add-or-update: this lane creates what is missing and brings what exists up to the current templates and the current contract. Nothing is skipped because a file is already there.

- **Rewrite in place.** No diff-for-approval step, no shadow output directory, no `.new` file. `git` is the diff.
- **The report names what changed** — elements added or dropped, renderer types changed, channels gained or retired — so the operator reads the report beside the diff and never a third artefact.
- **An upgrade over a DIRTY page is refused before anything is written.** Rewrite-in-place replaces uncommitted hand-tuning and git is the only record of it; a page with uncommitted edits is the one case this lane stops on rather than absorbing.

## Where the files land, and how the page reaches them

Nothing is registered, listed or enumerated per module — the page IS its directory, and its scenario data IS its module's own artefacts:

```text
packages/headless/src/modules/<module>/__tests__/<module>.feature     the spec, and the playlist
packages/headless/src/modules/<module>/__tests__/<module>.steps.ts    the ONE step catalog
packages/headless/src/modules/<module>/__tests__/fixtures/*.json      the recorded bodies
```

A page's scenario data is reached by importing headless's ONE published test entry and reading it at the module name the declaration's `tracks` carries. That name is a read key, not a registration: a module is published the moment it keeps the layout above. This lane therefore edits no seam, adds no exports row and names no path inside another package — the declaration imports no artefact at all.

**ONE `.feature` per module**, and one `{module}.steps.ts` and one `{module}.traceability.test.ts` beside it. Per ADR-020 Amendment 5 the package-colocated `.feature` IS the executed artefact: every module `.feature` gets a sibling step catalog — a feature without one is a factory gap to close (receipt: client-email-history, 2026-08-17), never a legitimate end state, and no header prose may claim executability either way (the catalog's presence and coverage are the only truth). A scenario is DRIVEABLE exactly when a step definition matches every one of its steps; one nothing matches is a capability written down and not yet driven, which is a legitimate state that simply never becomes a track. No marking distinguishes them — the catalog already does.

## Dispatch contract

Everything in the composable lane's "Dispatch contract" holds here unchanged and is cited, not restated: dispatch-only conduction, a gate resolving only on a field a dispatched seat returned, the JTBD in every seat brief, names resolved from the session registry in the `upmind-agent:<name>` form (never a filesystem hunt), rules cited by name and never by constructed path, and the craft executing inside the seat rather than in the conductor's context.

- **Lifecycle marker:** `UPMIND_LIFECYCLE=factory` — one run, one marker, for every stage of both lanes.
- Absent an explicit model, a stamped `UPMIND_SEAT` and a stamped `UPMIND_LIFECYCLE` on every dispatch, a seat silently inherits the session's model and loses its write-lane enforcement.

## Failure states

- **Any gate fails** → halt and surface the failing structured field verbatim; no silent retry.
- **A derived row with no `file:line`** → halt with that row named. A derivation over a promised module is a guess.
- **An absent consumed channel (any D-row, D14–D16 above all)** → halt to the DOOR, module regraded M2, composable lane first. Never a derivation around it, never a pass-and-surface absorption — surfaced decisions cover vocabulary lag only, never absent capability.
- **Verify returns ABSENT** → the run does not advance to Review; the missing part named in the verifier's own filing routes back to the developer seat.
- **A legitimately-red test is not a halt** — the repair loop is the composable lane's, cited: the failure routes back to a FRESH developer dispatch, never the authoring one. The cycle cap and the escalation are the script's.
- **Doctrine-vs-template disagreement** — the doctrine wins and the disagreement is surfaced as a finding, never silently resolved toward the template or toward the one built page it cites as a reference.
- **Template-versus-contract lag** — a template naming a shape the tree does not carry yet surfaces at the Verify gate, which reads the LANDED page. It is a red gate and a report, never a template quietly edited back to the old shape.

## Non-goals

- **This lane mints no acceptance criterion.** Acceptance criteria come from the story, which is lane 1's; the appended scenarios and the declaration spec's `describe` tag carry the module's own story tag and never an `@AC-*`.
- **It writes no product code.** The contract type, the `TableCell*` renderers, the column picker's url slot, the registry glob and headless's published test entry are epic work, landed once — never written per run.
- **It generates no template from a built page.** Templates are authored files with placeholders; the one built page is a reference an author reads, cited in each template's docblock, never a match target and never a source to copy.
- **It writes no headless SOURCE file.** This lane's developer writes the playground declaration and its presentation and nothing else; the prover's declared lane is the module's `__tests__/`.
- **One module, one declaration** — no second scenario directory, no editor twin.
- **No new mechanism.** No script, generator, hook or gate is invented; this lane consumes the existing seats, team maps, ESLint plugin and harness.

## Output

On completion: the scenario directory (declaration + presentation), the module's augmented `.feature`, its one step catalog and its one traceability test, every gate's structured field green, the derivation table filed with its receipts, and the change report naming every channel that moved. This lane opens no change request and emits no review verdict.
