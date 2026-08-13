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
- The door has already held the target to the scope-based precondition. This lane never re-checks it and never half-derives from a module that failed it.

## Derivation contract

Every row is read off the LANDED module, its schemas and its own `__tests__/`. Each carries a `file:line` receipt; the Derive gate is **undecided-field count = 0**.

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

**D8's naming is a gate, not a preference.** Before filing the derivation table, check each drawn control's `name` against `useActions()`: a name that is not a live member — and is not itself the reason a handoff exists — is a control no scenario can press. Echo the create control's resolved capability by name in the report.

`presentation.icon` is neither asked nor derived: the template carries the placeholder token and the author names the module's icon after the run.

**D6's derived set and its exclusions are ECHOED for overrule, never silently applied.** The column picker's options are wider than the element list — every field of the mapped record is offerable — so an excluded field is still switchable on; what the list decides is the DEFAULT visible set, the header row, the column order and each cell's renderer.

## Ownership — every file, one seat

| File | Seat | This lane |
| --- | --- | --- |
| `{module}.scenario.ts` (the playground scenario directory) | developer | **AUTHORS** |
| `{module}.presentation.ts` (same directory) | developer | **AUTHORS** |
| `{scenario}.must-fail.patch` | developer | **AUTHORS** — it knows the mutated line |
| `{module}.steps.ts` (the module's `__tests__/`) | prover | **AUTHORS** |
| `{module}.traceability.test.ts` (same directory) | prover | **AUTHORS** |
| `{scenario}.spec.ts` | prover | **AUTHORS** |
| `{module}.feature` (same directory) | prover | **AUGMENTS ONLY — lane 1 is its author** |

**The augmentation law, exactly.** Lane 1 authors the module's `.feature` — the capability spec a module owes whether or not a page is ever built. This lane APPENDS the scenarios the page drives, and may REPHRASE a scenario so a step can match it. It never deletes a scenario, never narrows a capability, and never becomes the file's author. Appending is at the end of the file, so it can add no `Background:` and no second `Feature:` — every appended scenario carries its own boot `Given`. Where the module's existing `Background:` governs the appended scenarios, its steps are part of them and the catalog defines those too.

The step catalog and the traceability test are the PLAYGROUND's concern; they merely LIVE in the module, because without a page nothing drives the feature. Colocation is the convention, not the ownership.

**A `page` route over a module carrying no `.feature` is refused** in the same plain terms as the scope precondition: there is nothing to augment, and writing that spec is lane 1's job.

Seat lanes are `agent-seat-separation`'s, cited not restated — including its companion's "Must-fail negative-control patches — who authors them": the developer authors the mutant, the prover applies it blind and verifies RED, never reading src to construct it.

## Stage map

| Stage | Skill | Seat | Gate (structured field) |
| --- | --- | --- | --- |
| Derive | `upmind-agent:plan` (light route) → the filled derivation table | planner | **undecided-field count = 0** AND every derived row carries a `file:line` in the landed module |
| Code | `upmind-agent:code` with this lane's `templates/` | developer | **diff file count > 0** AND **hand-off filed** (the declaration's public surface handed to the prover; diff withheld — ADR-029) |
| Tests | `upmind-agent:test` — the module's step catalog and its one traceability test, plus the feature augmentation; layer routing is that factory's own | prover (contract-fed public surface only; diff and hand-off withheld) | **suite exit code = 0** per layer dispatched AND the module's one traceability test green AND **every new mutant proven RED blind** |
| Verify | `upmind-agent:review` (verify lane) | verifier | **verdict = PRESENT** — the page boots and draws at every offered cell, measured against the module's own surface, never the declaration's self-report |
| Review | `upmind-agent:review` (code lane) | reviewer (pre-gate) | **🔴 blocker count = 0** |

**No Docs stage, deliberately.** The declaration is its own documentation surface — the app draws each declaration's source verbatim in the Scenario sheet — and the playground keeps no per-scenario docs. The module doc set is lane 1's.

**Tests are dispatched exclusively through `upmind-agent:test`.** This lane never calls its internal unit / integration / e2e phases directly.

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

**ONE `.feature` per module**, and one `{module}.steps.ts` and one `{module}.traceability.test.ts` beside it. A scenario is DRIVEABLE exactly when a step definition matches every one of its steps; one nothing matches is a capability written down and not yet driven, which is a legitimate state that simply never becomes a track. No marking distinguishes them — the catalog already does.

## Dispatch contract

Everything in the composable lane's "Dispatch contract" holds here unchanged and is cited, not restated: dispatch-only conduction, a gate resolving only on a field a dispatched seat returned, the JTBD in every seat brief, names resolved from the session registry in the `upmind-agent:<name>` form (never a filesystem hunt), rules cited by name and never by constructed path, and the craft executing inside the seat rather than in the conductor's context.

- **Models:** this lane pins none. Derive dispatches the plugin's `plan-story` team map; Code / Tests / Verify / Review dispatch `dev-story`. A change to either map's pins is inherited, not forked.
- **Lifecycle marker:** `UPMIND_LIFECYCLE=factory` — one run, one marker, for every stage of both lanes.
- Absent an explicit model, a stamped `UPMIND_SEAT` and a stamped `UPMIND_LIFECYCLE` on every dispatch, a seat silently inherits the session's model and loses its write-lane enforcement.

## Failure states

- **Any gate fails** → halt and surface the failing structured field verbatim; no silent retry.
- **A derived row with no `file:line`** → halt with that row named. A derivation over a promised module is a guess.
- **Verify returns ABSENT** → the run does not advance to Review; the missing part named in the verifier's own filing routes back to the developer seat.
- **A legitimately-red test is not a halt** — the repair loop is the composable lane's, cited: the failure routes back to a FRESH developer dispatch, up to three cycles on the same failure, then an operator escalation.
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
