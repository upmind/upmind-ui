# Review notes: FE-3031

Binding constraints. Read this file FIRST on any re-run of any SDD phase. Never
silently override an entry here.

---

## 2026-09-08 — planner seat, 2nd parity/SDD correction pass

Context: the Review stage returned 4 blockers (B1–B4). A developer dispatch
landed the code fixes. This pass corrected the SDD artefacts that had claimed
parity the code did not deliver, and re-anchored every citation at source.

### Corrections applied (all in `docs/sdd/**` only)

| Artefact | What changed |
| --- | --- |
| `parity.yaml` | `client×client` cell re-stated against the landed code and given a `blocked_by:`; R01, R02, R04, R05, R06, R07 and both staff cells re-anchored; R11 + R12 split out of R05 |
| `design.md` | Parity table, row summary, services table (`loadList` / `loadUnpaidExistence` / `loadConsolidatableCount`), include-set count, context `total`, attribution edge case, six citation anchors |
| `requirements.md` | AC2, AC10, AC12, AC13 read-backs **strengthened**; the admin-write out-of-scope range re-anchored |

No AC capability sentence was weakened. Every read-back change makes the proof
**stricter**, because each of B1–B4 shipped past a read-back that was too weak
to detect it.

### H1 — CLOSED 2026-09-08 (was: the list read's `client_id` column is not
### durable across a published criteria write)

**Status: CLOSED.** Filed as a blocker on 2026-09-08 by the planner seat,
fixed in code the same day (`a46d8a6d7`), and closed here by the planner seat
against the landed code and its green read-back. Recorded rather than deleted:
this was Review blocker B2's defect reached through the **public surface**
instead of at mint, and the record of how a row was mis-graded twice is the
point of this file.

**What was wrong (the finding, unchanged):**

- `trackClientIdFilter` (now `invoices.services.ts:137-152`) watches the
  **resolved client id** and re-applies `client_id` on change, with
  `{ immediate: true }`. The id does not change after a `.for('client', X)`
  mint, so the watcher fired exactly once.
- `criteria.set` **merges at branch level** — "`set({ filters })` replaces the
  whole `filters` branch"
  (`packages/headless/src/modules/query/useQueryCriteria.ts:100-101`,
  implementation `:111-123`).
- So any published `filters`-branch write that did not itself carry `client_id`
  dropped the column, and the next list fetch returned the **reading** client's
  rows while `select: raw => mapInvoices(raw, clientId.value)` (now
  `invoices.services.ts:253`) still attributed them against the target —
  corrupting `isChildOfClient` / `isDelegated` / `isSettleable`.
- Two reachable doors: `useActions().filterCreditNotes()`
  (`useInvoices.actions.ts:168-170`; its preset `creditNotesCriteria`,
  `invoices.schemas.ts:378-390`, carries no `client_id`) and the published
  `useActions().setCriteria` (`useInvoices.actions.ts:231`), which
  `useInvoices.ts:92`'s own doc example calls with a bare `filters` branch.

**What closes it — read at source by the planner seat, not taken on report:**

- `withDurableClientId` (`invoices.services.ts:195-215`) wraps the handle's
  published `setCriteria` and re-asserts `client_id` **inside the caller's own
  `filters` object** (`:208-211`) on every `filters`-branch write that omits the
  key; a caller that **declares** `client_id` explicitly still wins (`:203`),
  which deliberately preserves `setCriteria`'s own manual-retarget door. A write
  with no `filters` branch passes through untouched (`:201`) — branch-level merge
  leaves the column standing on its own.
- `loadList` returns the wrapped handle (`:260`), and `useInvoices.ts:41` mints
  that ONE handle and passes it to the actions, context, meta and internals
  layers. Every published criteria write in the module goes through
  `query.setCriteria` — `sortBy` (`useInvoices.actions.ts:145`),
  `filterConsolidatable` (`:158`), `filterCreditNotes` (`:169`) and the
  published `setCriteria` (`:231`) — so all four reach the wrapper. Verified
  there is no second door: `criteria.model` is a `computed`
  (`useQueryCriteria.ts:73`), so `useContext().query` (`useInvoices.context.ts:72`)
  is read-only and cannot bypass the wrapper.
- The wrapper's own `@decision` block names the two alternatives that would have
  left the defect open — the query-core fix (out of bounds per the 2026-09-08
  ruling) and "patch only `creditNotesCriteria`" (leaves the published
  `setCriteria` open) — which is the structural choice this finding argued for.
- Fix-per-door grading (all four verbs this finding named):

  | Published verb | Closed? | Receipt |
  | --- | --- | --- |
  | `filterCreditNotes()` | Yes | preset carries no `client_id`, so the wrapper fills it (`invoices.services.ts:208-211`); proof `invoices.scope-identity.int.test.ts:265` |
  | published `setCriteria` (bare `filters`) | Yes | same path; proof `:288`. Manual door still open — an explicitly declared `client_id` wins (`:313`, code `:203`) |
  | `sortBy()` | Yes (was never exposed) | `sort`-branch write only, so `:201` passes it through and the column stands; proof `:338` |
  | `filterConsolidatable()` | Yes (was never exposed) | its preset carries `client_id` itself (`invoices.schemas.ts:343-353`), so `:203` passes it through; proof `:361` |

- **Executable read-back, run by this seat:**
  `pnpm --filter @upmind-automation/headless test:integration src/modules/invoices/__tests__/invoices.scope-identity.int.test.ts`
  → **11/11 passed**, 2026-09-08. The durability block is
  `invoices.scope-identity.int.test.ts:261-382`. `requirements.md` AC12's
  durability read-back is therefore GREEN, not RED.
- `parity.yaml`'s `cells[client x client].blocked_by` is **removed**, and the
  cell note now states the delivered behaviour with the mis-grading history kept
  beneath it as history.

### H2 — CLOSED 2026-09-08 by operator ruling: `data` + `account.user`
### (`parity.yaml` R12)

**Status: CLOSED.** This was the one escalation the 2nd correction pass raised,
and the planner seat did **not** self-sign it.

**Operator ruling 2026-09-08, verbatim: "Sign the drop — covered by PN-1."**
The operator was offered both variants — the tracked drop
(`Dropped-with-Linear-issue`, per
`.claude/rules/verify-parity-oracle.companion.md`) and the plain sign-off — and
chose the plain sign-off. **No Linear issue is owed for R12.**

- R12 is now `Dropped-with-issue-reference`, `signoff:
  op:dom@upmind.com:2026-09-08`.
- The two relations are `data` (`oracle:256`) and `account.user`
  (`oracle:257`), inside `getWithParams`' `with=` array (`oracle:255-268`).
- **The reasoning the ruling rests on is kept verbatim in the R12 row so a
  reviewer can still reject the inference.** Their only oracle read is
  `getWithParams` (`oracle:250-276`), whose **only** consumers are the payment
  modals — `src/components/app/global/payments/openAutoPayModal.vue:56-62` and
  `openInitPayModal.vue:91-97`, `:118-124` (grepped; no other call site exists).
  The payment flow is Out of Scope by name ("The payment flow itself (PN-1)").
  The step a reviewer may reject is from "their only consumer is out of scope"
  to "the relations are out of scope": `getWithParams` is
  `apiPath().contextual`, so the read itself serves the client lane too, and a
  future client-area consumer would need either relation requested and mapped.
- The alternative the operator declined was to rule the two relations in scope,
  which would have owed an include-set entry, mapped VM fields and an AC.
- **Undispositioned row count is now 0**, matching the undispositioned cell
  count. The honest `1` this row carried through the previous pass was
  deliberate.

### Cosmetic / recorded, not halting

- `verify.md:88-93` still reads stale: it states "`loadList` does **not**
  auto-seed the filter from it, while `loadConsolidatableCount` **does**". Both
  seed it now, and `loadList`'s column is additionally durable
  (`withDurableClientId`). `verify.md` is the verifier seat's artefact and is
  outside this seat's write lane, so it was left untouched again on 2026-09-08 —
  the verifier must refresh it on the next pass. Flagged to the conductor.
- `invoices.mappers.ts:70` still carries the wrong label-precedence anchor
  (`oracle:172-179`; the real one is `oracle:175-180`). That line is the
  developer's write lane and was reported there. `parity.yaml` R06 does not
  depend on it.
- `parity.yaml` R08's `tracker:` is still a placeholder string, not a Linear id
  (operator-owned, carried over from the first pass).
- `parity.yaml` R08's `tracker:` is still a placeholder string, not a Linear id
  (operator-owned, carried over from the first pass). Unchanged 2026-09-08.

---

## 2026-09-08 — planner seat, 3rd pass (R12 sign-off + H1 closure)

Two settled items recorded; no capability sentence weakened, no disposition
softened to match the code.

| Artefact | What changed |
| --- | --- |
| `parity.yaml` | R12 `PENDING-OPERATOR-SIGNOFF` → `Dropped-with-issue-reference` with the 2026-09-08 ruling quoted and the signoff token; `cells[client x client].blocked_by` removed and the note rewritten to state delivered behaviour; header + `rows:` header + JTBD-check block re-graded to **0** undispositioned rows; every `invoices.services.ts` anchor re-verified at source after `withDurableClientId` shifted the file |
| `design.md` | client×client parity row de-blocked and re-anchored; R12 summary row signed; `loadList` / `loadUnpaidExistence` / `loadConsolidatableCount` service rows re-anchored; include-set floor anchor re-anchored |
| `requirements.md` | AC12's two read-back commands re-anchored to literals that actually resolve (the retarget half named a `-t` grep matching no landed test); the "expected RED today" clause replaced with the green receipt; the success criterion's stale "ten carried parity rows" corrected to twelve |
| `review-notes.md` | H1 and H2 closed with receipts; `verify.md` staleness re-flagged for the verifier |
| `requirements.md` + `tasks.md` | **Every** read-back / Reality Check `-t` pattern re-anchored to a landed test title (finding H4 below) |

### H4 — CLOSED 2026-09-08: 13 of 15 read-backs and 17 of 19 Reality Checks
### named test titles that do not exist, and would have reported GREEN

**Severity: was blocker-class. Found by the `/sdd-tasks` Step 7 per-AC
executable-proof vetting sweep, run properly on this pass. Fixed in this seat's
own lane.**

The plan was authored with *intended* test titles; the prover chose different
ones. So nearly every `Read-back:` and `Reality Check:` in this bundle named a
`-t "<title>"` that matched nothing in the landed corpus.

**Why that is worse than a missing read-back — measured, not assumed:**

```
pnpm --filter @upmind-automation/headless test:integration -t "invoices collection reads the list"
  → Test Files  131 skipped (131)
  →      Tests  953 skipped (953)
  → EXIT=0
```

A non-matching `-t` runs **zero** tests and **exits 0**. Every one of those
read-backs would have been reported green while asserting nothing — a
gradeable-as-pass proof of nothing, which is the cosplay class
(`verify-cosplay.companion.md`, FE-2824) this bundle exists to prevent. It is
the same defect already found on AC12's retarget half, but systemic.

**Fixed:** every pattern re-anchored to a title extracted from the landed test
files and verified to match. The sweep now reports **0** false-green patterns
across both documents (the single 0-match string that remains is the broken
pattern quoted as history inside AC12's note). Empirically re-run on 2026-09-08:

| Read-back | Result |
| --- | --- |
| AC1 `-t "the live unpaid-amount re-read"` … and 11 siblings | pattern verified against landed titles, 1 match each |
| AC2 → the three files (`invoices.collection` + `invoices.criteria-presets` + `invoices.consolidatable-count`) | **3 files, 17/17 passed** |
| AC8 `-t "awaiting-client"` | **2 passed**, 951 skipped |
| AC12 retarget half (2 files) | **2 files, 14/14 passed** |
| AC12 durability half `-t "the retarget survives every published criteria write"` | **5 passed**, 948 skipped |

`(AC-2)` was tried first and rejected: it matches **146 tests across 34 files**
in other modules, so it executes but does not *scope* the proof. AC2's read-back
names its three files instead.

**No AC capability sentence was changed by this fix.** Only the command that
proves it, from one that could not run to one that does.

### H3 — OPEN, for the operator/reviewer: `invoices.feature` declares 16 ACs;
### `requirements.md` declares 13

**Not a capability drop — a capability ADDITION that requirements.md does not
carry.** Recorded, not resolved, because minting an AC is a capability decision
this seat may not take alone.

- `requirements.md` declares **AC1–AC13**.
- `packages/headless/src/modules/invoices/__tests__/invoices.feature` carries
  `@AC-1 … @AC-16`, and the feature file states the minting deliberately:
  "AC-16 is minted here (beyond the story's own AC1-AC13), same precedent as
  AC-14/AC-15 above and client-email-history.feature's AC-18..21."
- All three have landed, green integration proofs:
  AC-14 `invoices.collection.int.test.ts:234` (refuses to read when no client is
  addressable) · AC-15 `invoices.scope-identity.int.test.ts:384` (refuses an
  undeclared filter) · AC-16 `invoices.payment-state.int.test.ts:65` (overall
  payment state).
- `invoices.traceability.test.ts` gates feature-tag ↔ test-title in both
  directions, so the three are internally consistent — the gap is only against
  `requirements.md`, whose Success Criteria say "Every AC **above** executes its
  named read-back".
- **The question for the operator (one answer):** promote AC-14/AC-15/AC-16 into
  `requirements.md` as declared ACs with read-backs (the behaviours are already
  proven, so this is bookkeeping), or rule them module-level guarantees that
  live only in the feature file and amend the Success Criteria to say so.
- Not blocking the two items this dispatch recorded, because nothing is dropped
  and nothing is mis-graded: the three behaviours are proven and green.


---

## 2026-09-08 — planner seat, 4th pass (H3 closure + Docs-stage drift)

| Artefact | What changed |
| --- | --- |
| `requirements.md` | AC14, AC15, AC16 promoted in as first-class ACs under a new "Whole-module guarantees and whole-invoice payment state" story; each carries a file-scoped `Read-back:` verified by running it; Success Criteria amended to **AC1–AC16** |
| `review-notes.md` | H3 closed with the conductor's ruling; the staff-deprecation corpus drift recorded as a **Docs-stage** item with receipts |

No AC capability sentence was weakened. D1–D6 and the 23-capability list are
untouched. `parity.yaml` is untouched — nothing about the cell or row set
changed, because nothing was added to the build.

### H3 — CLOSED 2026-09-08 by conductor ruling: promote AC-14, AC-15, AC-16

**Status: CLOSED.** Raised on this run's 3rd pass by the planner seat, which
declined to mint the three AC sentences because minting a capability is not
this seat's call. Answered by the conductor, not self-decided.

**Conductor ruling 2026-09-08, verbatim: "promote them."** The reasoning given,
recorded so a reviewer can disagree with it rather than with a fait accompli:

- All three behaviours are **already built and proven** — landed, green and
  gated by `invoices.traceability.test.ts` in both directions.
- `invoices.feature` declares them **deliberately**, with a stated precedent
  (`client-email-history.feature`'s AC-18..21).
- Documenting reality is **bookkeeping, not scope expansion**. This is not a
  new-capability decision; it records three that already shipped.
- Leaving the two documents disagreeing is the **drift that lets a later reader
  believe a capability is unowned**.

**The step a reviewer may reject:** that a capability minted by the prover seat
in a feature file may be adopted into `requirements.md` after the fact. The
alternative the conductor declined was to rule the three module-level
guarantees that live only in the feature file, and amend the Success Criteria to
exclude them. That alternative keeps the plan's AC set frozen at authoring time,
but leaves three proven behaviours with no requirement owning them.

**What landed, per AC — each sentence is derived from the feature scenario and
the landed test title, not from this seat's own reading of the source:**

| AC | Feature scenario | Landed proof |
| --- | --- | --- |
| AC14 | "Refuse to read when no client is addressable" | `invoices.collection.int.test.ts:234-247` |
| AC15 | "Refuse an undeclared filter, and never let one bypass the declared criteria" | `invoices.scope-identity.int.test.ts:384-414` |
| AC16 | "Read an invoice's overall payment state" + "A failed invoice load reports no guessed payment state" | `invoices.payment-state.int.test.ts:65-158` (6 cases) |

**Every read-back was RUN, not assumed** — the H4 discipline applied to the new
patterns:

| AC | Pattern | Selected | Result |
| --- | --- | --- | --- |
| AC14 | `… invoices.collection.int.test.ts -t "AC-14"` | 1 test, 1 file | 1 passed, 8 skipped, exit 0 |
| AC15 | `… invoices.scope-identity.int.test.ts -t "AC-15"` | 1 test, 1 file | 1 passed, 10 skipped, exit 0 |
| AC16 | `… invoices.payment-state.int.test.ts` | 6 tests, 1 file | 6/6 passed, exit 0 |

**Why all three are file-scoped.** The bare id patterns resolve but do not
*scope*, measured with the runner's own `list` command on 2026-09-08:
`-t "AC-14"` → **17 tests / 9 files**; `-t "AC-15"` → **25 / 11**;
`-t "AC-16"` → **19 / 9**. Other modules mint the same ids. A longer title
substring does not save AC14 either — `"reports the collection unavailable"`
appears in **7** other modules' integration files. This is H4's failure class
from the other side: an unresolvable pattern selects zero tests and exits 0; an
over-broad one runs another module's suite and calls it this AC's proof.

### Docs-stage item (NOT this seat's lane) — the staff arm is still declared in the corpus

The operator ruling of **2026-09-01** deprecated the `staff` actor on this
resource ("this is client only, staff is being deprecated"), and `parity.yaml`
disposes both staff cells as `Dropped-with-issue-reference`. Two corpus
documents outside this bundle still **declare** the retired staff arm as
current. They are the **Docs stage's** to fix — recorded here with receipts so
the item cannot be lost between stages. **This seat did not edit them.**

| File | Lines | What it still declares |
| --- | --- | --- |
| `docs/adr/001-scope-based-composables.md` | `:248-255` | Three staff invoice examples as live API: `useInvoices().as('staff')`, `.as('staff').inBrand('brand-abc')`, `.as('staff').for('client', clientId)` — the last is the exact FE-2824 shape, on the one resource where staff is now retired |
| `docs/reference/service-splitting-examples.md` | `:36-64` | "Example 2: Invoices (SPLIT) — ✅ Yes", an actor table granting Staff "View any client's invoices, void, adjust" on `/admin/clients/{id}/invoices`, and a whole `invoices.services.staff.ts` snippet with `getInvoices(clientId)` / `voidInvoice(...)` |
| `docs/reference/service-splitting-examples.md` | `:187` | The summary-table row **Invoices** → Staff Endpoint `/admin/clients/{id}/invoices`, Split? ✅ Yes |

**Why it matters, not just tidiness.** ADR-001 is Tier-2 law
(`agent-behavior.companion.md` §1), and `service-splitting-examples.md` is the
worked reference a later planner reads before splitting a service. Both
currently instruct a reader to build the staff arm this story deliberately
dropped. A future dispatch that follows them re-mints a capability the operator
retired, and no gate in this bundle would catch it — `parity.yaml`'s
disposition binds this story, not the corpus.

**Scope note for the Docs stage:** the ruling was scoped to **invoices**. Do
not read this item as retiring the staff actor corpus-wide; `staff` remains
live on other resources. The minimum honest fix is to mark the invoices
examples as superseded by the 2026-09-01 ruling, not to delete the staff
pattern from ADR-001.

### Cosmetic / recorded, not halting (carried, still open)

- `verify.md:88-93` remains stale (`loadList` **does** auto-seed now, and its
  column is durable). Outside this seat's write lane; a verifier dispatch is
  refreshing it concurrently. Left untouched again on 2026-09-08 (4th pass).
- `invoices.mappers.ts:70` label-precedence anchor is still `oracle:172-179`
  (real: `oracle:175-180`). Developer's lane.
- `parity.yaml` R08's `tracker:` is still a placeholder, not a Linear id.
  Operator-owned. Unchanged.

---

## 2026-09-09 — planner seat, 5th pass (run-close: three operator rulings + closing state)

This pass **records settled rulings**. It re-opens nothing, weakens no AC
capability sentence, and softens no parity disposition. Where a ruling
constrains something this seat previously graded differently, that is stated
plainly and the ruling wins.

Verify returned **PRESENT** at `ccc735601` after four ABSENT verdicts; the
scenario lane is complete. Nothing below changes the cell set, the row set, or
the AC set: `parity.yaml` is untouched by this pass, and so are
`requirements.md`, `design.md`, `tasks.md` and `bdd.md`.

| # | Ruling | Date | Verbatim | Scope |
| --- | --- | --- | --- | --- |
| 1 | The red committed spec stays red, with its disclosure | 2026-09-09 | "Leave it red with the disclosure" | `forced-surface.invoices.spec.ts` |
| 2 | Narrow core authorisation, client-vue | 2026-09-09 | "Authorise the one-line client-vue fix" | `StringsRenderer.vue` only |
| 3 | One repair cycle beyond the three-cycle cap | 2026-09-09 | authorised, conditional on a paired gate extension | facet-filter capability |

---

### Ruling 1 — CLOSED 2026-09-09 by operator ruling: the red committed spec stays red

**Operator ruling 2026-09-09, verbatim: "Leave it red with the disclosure."**

`playgrounds/labs-nuxt/modules/scenarios/runtime/components/__tests__/forced-surface.invoices.spec.ts`
is committed **red** at `ccc735601`, by decision, not by oversight.

**State of the spec, for the record.** The prover fixed **two genuine harness
defects** in `forced-surface.harness.ts`:

1. `witness()` matched the **always-rendered** filter-bar chrome — an
   untranslated multi-select option renders its raw i18n key (e.g.
   `invoices.filter_option.status.invoice_paid`), which contains the corpus's
   own `"invoice_paid"` value as a plain substring. Fixed by excluding
   `[data-test-key="filters"]` from the witness measurement.
2. `rows()` counted the design-system Table's own
   `<tr data-slot="table-empty">` "no results" sentinel as a real record row.
   Fixed by scoping the count to `tr[data-slot="table-row"]`.

Both were verified to regress **none** of the seven sibling
`forced-surface.*.spec.ts` files. (Two figures are on record for that sibling
run — the spec's own disclosure block states **42/42 green**, the dispatch
brief states **39 green**. Recorded as-found rather than reconciled by this
seat, which ran neither.)

The **verifier independently graded those two fixes genuine rather than
loosened**, on the ground that each sibling spec asserts `rows > 0`
positively, so a blinded row counter would have failed all of them. The fixes
turned a **false green into an honest red**.

**The remaining failure.** With both fixed, the **unforced replay mount renders
zero real invoice rows** for this scenario's default criteria (only the
table-empty sentinel), so the differential claims have no baseline. Both the
prover and the verifier isolated it to corpus/replay **routing** in
`playgrounds/labs-nuxt/modules/scenarios/runtime/force/handlers.ts` and
`playgrounds/labs-nuxt/modules/scenarios/runtime/force/corpus.ts` — shared
playground infrastructure, **outside this story's write lane**, named in no AC
(AC1–AC16) and in no parity row. Seven sibling modules draw records through the
same unmodified harness.

**Alternatives the operator declined**, recorded so a reviewer can disagree
with the choice rather than with a fait accompli:

- **Quarantine it with a tracked issue** (`@quarantine` + a Linear id, per
  `test-quarantine`). Declined. The dispatch had no issue-tracker write access,
  so the tag would have carried a fabricated or uncited issue id — worse than an
  honest red.
- **Route a corpus/replay fix to the developer.** Declined. The files are shared
  playground infrastructure serving eight modules, in no AC and no parity row;
  fixing them inside this story would widen its blast radius past its declared
  scope.

**The reasoning the ruling rests on:**

- The spec already carries a **dated, seat-attributed, mechanism-level
  disclosure block** (`forced-surface.invoices.spec.ts:12-38`) naming the exact
  files, the exact two fixed defects, the exact remaining failure and the exact
  suspected routing files. A reader hitting the red hits the explanation first.
- The defect is **neither the module's nor the page's**. It sits in shared
  replay routing.
- An honest, disclosed red is a truer artefact than either a silent quarantine
  or a green bought by re-loosening the two harness defects.

**What a reader must NOT conclude from this red: that the invoices page cannot
draw rows.** The verifier evidenced the composition **from both ends**:

- **The data half, directly** — `invoices.collection.int.test.ts:75-76` asserts
  the mapped collection length against fixtures **re-captured live from
  staging**.
- **The render half, by control** — seven sibling scenarios draw records through
  the same unmodified `ListSurface`.

The failure therefore sits in the routing **between two proven halves**.

**WHAT NO SEAT OBSERVED, stated honestly: no seat observed the invoices page
render rows in the labs replay environment.** The two halves are each proven;
their composition in that one environment is not. That is the exact residual
this ruling accepts.

**Where this constrains this seat's own prior grading.** This seat's standing
discipline (`verify-negative-controls`, `verify-evidence-filing`, and U7's
review-ready gate) would treat a committed-red spec at a review handoff as
either a green-read-back gap or a quarantine-with-tracked-issue obligation. The
operator ruled otherwise on the ground that the red is disclosed, attributed and
out-of-lane. **This seat defers to the ruling** and records it rather than
re-grading it.

---

### Ruling 2 — CLOSED 2026-09-09 by operator ruling: the narrow client-vue authorisation

**Operator ruling 2026-09-09, verbatim: "Authorise the one-line client-vue
fix."** Scoped to **one file only**:
`packages/client-vue/src/components/form/engine/renderers/array/StringsRenderer.vue`.

#### Both narrow core authorisations on this story, together

Recorded in one place so a reviewer finds both without hunting:

| Date | Verbatim ruling | File authorised | Scope of the authorisation |
| --- | --- | --- | --- |
| 2026-09-02 | "Authorise the core fix" | `packages/headless/src/utils/useValidation.ts` | 2 changed lines (`set(result, subKey, …)` → `set(result, [subKey], …)` at `:526` and its top-level twin at `:551`) + a 16-line `@decision` block carrying the sign-off. Confirmed by the verifier (`verify.md:148`). |
| 2026-09-09 | "Authorise the one-line client-vue fix" | `packages/client-vue/src/components/form/engine/renderers/array/StringsRenderer.vue` | That file only. |

Neither authorisation widens the standing off-limits ruling of **2026-09-08,
verbatim "do not chnage any query stuff"** — `packages/headless/src/modules/query/**`
remains off limits (`design.md:446-448`), and `useValidation.ts` is authorised
**only** for the two dotted-key-path lines already landed and signed, not
reopened by this pass.

#### What it actually took — the "one-line" framing is not what shipped

Recorded because a reader deserves the real shape. **Four cycles, each fix at
the mechanism rather than the symptom:**

| # | Symptom | Mechanism found | How it was closed | Commit |
| --- | --- | --- | --- | --- |
| 1 | The facet rendered as the wrong control | `format: "multi-select"` matched **no tester** | Declared `uniqueItems: true` on the leaves, so the renderer's **genuine** `rank: 5` tester dispatches on **shape** rather than on an invented format string | schema change |
| 2 | The click produced no write | The write was swallowed by `handleChange: () => {}` spread **last**; the developer established that `useJsonFormsMultiEnumControl` **never returns one**, so deleting the no-op would have **crashed** | Replaced the swallow at the mechanism, keeping a real handler | `3752377b9f` |
| 3 | The write landed **nested** | `"status.code"` is a **literal dot-bearing column**, and `composeWithUi` builds a dotted string that the model writer splits into segments | Closed via `toDataPathSegments` — the dotted key is written as **one literal path segment** | `cdb13b280a` |
| 4 | Repeat clicks **duplicated** values | The handler diffed against a **stale `current`** | Dispatched the whole next selection as **one literal-path `update`**, sidestepping the read entirely | `2c78a84f01` |

#### Two facts preserved so nobody repeats this hunt

1. **`setCriteria` silently strips a nested or malformed key.** No ajv error;
   `model.filters` simply returns `undefined`. This is precisely why **three
   cycles of green gates saw nothing**: the model looked plausible and the
   suite stayed green while the wire carried nothing. It is the same
   silent-discard class already recorded on this story for the `"count"`
   sentinel (`design.md:436-452`) — a validated channel that drops what it
   cannot spell, without complaint.
2. **The blast radius is exactly two live consumers** — the two invoices
   facets. Every other `uniqueItems` in the repo is either a **sort branch**
   with `items: { type: "object" }` or a **bare string array with no
   vocabulary**, so neither reaches the multi-enum tester. A reader weighing a
   change to `StringsRenderer.vue` should weigh it against two consumers, not
   against every `uniqueItems` in the tree.

---

### Ruling 3 — CLOSED 2026-09-09 by operator ruling: one repair cycle beyond the cap

`agent-behavior` §5's **three-cycle cap** was reached on the facet-filter
capability and **escalated** rather than quietly exceeded.

**Operator ruling 2026-09-09: one further cycle authorised, on the stated
condition that the fix be paired with a gate extension so the same class could
not recur.**

**The condition was MET.** The permanent gate is
`packages/client-vue/src/components/form/renderers/__tests__/invoices-filter-wire.test.ts`,
and **its assertions are post-`translateQuery` by design** (stated in the file's
own docblock, `:6-11`). Confirmed at source by this seat:

| Condition clause | Where it is met |
| --- | --- |
| Drives click A → click B → de-select A → clear-to-empty, **on both facets** | `:257-278` — `status.code|in` (`:258`) and `category.slug|in` (`:269`), each running the same four-step sequence |
| Pins **no-duplicate** emission | `uniq(afterA) === afterA` (`:223`), `uniq(afterB) === afterB` (`:232`), `uniq(afterDeselectA) === afterDeselectA` (`:238`) |
| Pins `uniqueItems` | `:280-294` — both dotted multi-select leaves assert `uniqueItems === true` |
| A cleared facet reads as an **empty value with the key present** | `:243` (`afterClear` is `[]`), then `:252` `wireOwnsKey(...) === true` and `:253` wire value `=== ""` — **EMPTY, not ABSENT**, measured against the live wire, not assumed |
| Dies precisely under its re-pointed mutant | `invoices-filter-wire.must-fail.patch`, colocated (`__tests__/`), cited in the file's docblock at `:17` |

The gate also carries a **fairness control** (`:131`) — a non-dotted column
reaching the wire the same way — so the dotted-key assertion cannot pass by
accident of the harness.

#### The gate-design lesson — recorded verbatim, because it is the transferable one

> **Every gate in the first three cycles graded the model rather than the wire,
> and each one passed over a broken capability.**

The verifier's **own first probe nearly did the same, and it corrected itself in
writing** (`verify.md`, RE-GRADE 2 → RE-GRADE 4). That is the whole lesson: a
model-level assertion on a validated channel is a *shape* assertion, and a
channel that silently strips what it cannot spell will hand a shape-grading gate
a green every time. The load-bearing assertion is the one taken **after**
`translateQuery`, on the wire.

This is the FE-2824 cosplay class (`verify-cosplay.companion.md`) reached
through the *gate* rather than through the code: right filenames, right shape,
green suite, zero capability.

---

## Closing state — the run's honest residue (recorded, NOT re-adjudicated)

Each item below is already known and owned. This section exists so nothing is
lost between this run and the human review. **No item here is re-opened, and
none is a halt.**

| # | Item | Owner | Confirmed against the files? |
| --- | --- | --- | --- |
| C1 | The branch is **unpushed** at the time of writing | operator | **Yes** — `feature/fe-3031-pn-3-invoices-module-augment-unpaid-amount-list-assigned` tracks `gitlab/develop` (no own remote branch), `ahead 24, behind 24` |
| C2 | `parity.yaml` **R08's `tracker:` is still a placeholder**, not a Linear issue id | operator | **Yes** — `parity.yaml:355`, `"FE-3031-TYPES-PARTIAL-AMOUNT-TO-CREDIT (Linear issue to be filed against packages/types by the operator …)"`. Carried unchanged since the 1st pass. |
| C3 | `pnpm lint` exits **1** on a pre-existing tree-wide baseline of **128 problems across 32 files**, **none this story's** | pre-existing | Recorded as reported; not re-run by this seat |
| C4 | `pnpm-lock.yaml` **loses 659 lines** on any `pnpm` invocation in this worktree — a stale `packages/ui` importer, where the real path is `design-system/packages/ui`. **Held out of every commit deliberately.** | pre-existing | Recorded as reported |
| C5 | `vite-plugin-dts` prints **~35 non-fatal `error TS…` lines** from the **uninstalled** `design-system` workspace; `vue-tsc --noEmit` itself emits **none** | pre-existing | Recorded as reported (matches the standing `labs-nuxt`/design-system install trap) |
| C6 | **No committed runner walks `packages/client-vue` must-fail patches** — only `design-system/packages/ui` has one — so those mutants are **seat-verified, not CI-verified**. Pre-existing; shared with **8 sibling patches**. | pre-existing | **Yes** — 8 sibling `filter-*.must-fail.patch` files plus `invoices-filter-wire.must-fail.patch` sit in `packages/client-vue/src/components/form/renderers/__tests__/` |
| C7 | The labs `--project module` suite fails **3, none this story's**: `icon-resolution` (two `client-notes` icons), `forced-surface-coverage` (**`client-notes` only now** — the `invoices` half was closed this run), `negative-controls` (27 pre-existing runtime patches) | pre-existing | Recorded as reported |
| C8 | **Raw i18n keys render** until the external catalogue carries `invoices.filter_option.*` and `invoices.filter_bar.*`. These were **malformed by construction** and are now merely **missing** — a real improvement, and the standing raw-keys disposition now **genuinely covers** them. | external catalogue | Consistent with the red spec's own disclosure, which names the raw-key render as the witness-match cause (`forced-surface.invoices.spec.ts:16-22`) |
| C9 | The **staff-deprecation corpus drift** filed for the Docs stage was **ACTIONED by the documenter**; no ADR-001 amendment judged necessary | Docs stage — **CLOSED** | **Yes** — see the confirmation below |
| C10 | `develop` has moved **twice** since our merge and now carries a **`labs-payment-detail-add`** feature touching `scenarios/runtime/**`. A two-dot **or** three-dot diff against develop therefore shows deltas **no commit of ours produced** — it caused **two false findings** in this run. **Attribution must be per-commit.** | method note | **Yes** — the branch is `behind 24`; only **2** of our own commits touch `playgrounds/labs-nuxt/modules/scenarios/runtime` |

**C10 — the attribution command, so nobody repeats the two false findings:**

```bash
git log --format='%h' gitlab/develop..HEAD -- <path>
```

A path with **no** commit in that list is **not ours**, whatever the diff shows.

### C9 — CORPUS DRIFT OUTCOME, confirmed at source by this seat

The 4th pass filed three receipts as a **Docs-stage** item. All three are
actioned with **dated pointers marking the invoices examples superseded**, and
**no example was deleted** — which is exactly the minimum honest fix that pass
asked for:

| Filed receipt | Now | Confirmed at |
| --- | --- | --- |
| `docs/adr/001-scope-based-composables.md:248-255` — three staff invoice examples as live API | The three examples **stand**, followed by a dated block: **"Superseded for this resource (2026-09-01)"**, naming the retirement, giving the live replacement `useInvoices().as('client').for('client', clientId)`, and stating explicitly that this is **"a per-resource narrowing, not a change to the `staff` actor or to this ADR's decision"** | `docs/adr/001-scope-based-composables.md:256-265` |
| `docs/reference/service-splitting-examples.md:36-64` — "Example 2: Invoices (SPLIT) ✅ Yes", staff actor table, `invoices.services.staff.ts` snippet | A dated **"Superseded for this resource (2026-09-01)"** block precedes the example, stating the module carries **no `invoices.services.staff.ts` arm** and **no `/admin/clients/{id}/invoices` endpoint**, and that the narrowing is resource-specific | `docs/reference/service-splitting-examples.md:40-48` |
| `docs/reference/service-splitting-examples.md:187` — the **Invoices** summary-table row | The row now carries **"superseded 2026-09-01: `staff` is retired for this resource; see Example 2 above"**. The line **moved to `:196`** because the inserted block shifted it — the receipt anchor is stale, the fix is not | `docs/reference/service-splitting-examples.md:196` |

**The documenter judged no ADR-001 amendment necessary**, on the ground that
**the ADR's own decision is unchanged** — this is a per-resource narrowing, not
a change to the scope-based-composable decision or to the `staff` actor
generally. **This seat confirms that judgment against the files and concurs**:
the 4th pass's own scope note asked for exactly this ("the minimum honest fix is
to mark the invoices examples as superseded by the 2026-09-01 ruling, not to
delete the staff pattern from ADR-001"), and the inserted block says so in as
many words. **The Docs-stage item is CLOSED.**

The corpus-drift hazard the 4th pass named — a future dispatch reading either
document and **re-minting the staff arm the operator retired** — is closed at
both doors: a reader now meets the dated supersession before the example.

### Carried cosmetics — status at run close

| Item | Status |
| --- | --- |
| `verify.md` "`loadList` does **not** auto-seed" staleness, flagged on the 2nd, 3rd and 4th passes | **CLOSED by the verifier.** It refreshed its own artefact and now records the stale claim as **history** (`verify.md:285`, "…of the previous run said…"). Outside this seat's write lane throughout; never edited here. |
| `invoices.mappers.ts` label-precedence anchor still `oracle:172-179` (real: `oracle:175-180`) | **STILL OPEN**, developer's lane. The line **moved from `:70` to `:87`**. `parity.yaml` R06 does not depend on it, and `verify.md` already grades the capability PRESENT against the **correct** range. Cosmetic; not a halt. |
| `parity.yaml` R08 `tracker:` placeholder | **STILL OPEN**, operator-owned — see C2. |

---

### Gate + hand grade, this pass

- **Compliance gate:**
  `node "/Users/dom/.claude/plugins/cache/upmind-agent/upmind-agent/0.19.4/ci/lint-plan-compliance.mjs" "docs/sdd/FE-3031"`
  → **exit 0**, no output. (There is no `ci/` directory in this repo; the gate
  exists only in the plugin cache, so that absolute path is the one that runs.)
- **`parity.yaml` by hand, re-graded at source this pass:** **4 cells**, **0
  undispositioned cells**; **12 rows (R01–R12)**, **0 undispositioned rows**;
  **`blocked_by` on 0 cells and 0 rows**; **6 `Dropped-with-issue-reference`
  dispositions, each carrying a `signoff:` token** (2 cells + 4 rows, 6 signoffs
  — a 1:1 match). Disposition census: 9 `Direct`, 6
  `Dropped-with-issue-reference`, 1 `Renamed` = 16 = 4 cells + 12 rows. The hand
  grade remains the load-bearing one: the lint's parity parser grades **cells**
  only.
- **ACs or parity rows weakened by this pass: NONE.** `parity.yaml`,
  `requirements.md`, `design.md`, `tasks.md` and `bdd.md` are untouched; this
  pass wrote `review-notes.md` only.

### Door record — `/plan` (5th pass)

- **Depth band, computed per `rules/agent-orchestration.md` §3.3:** the ask names
  **0** new capabilities / ACs, **0** code surfaces, has no importer blast radius,
  and trips **no** risk-floor question (no trust boundary, no money/auth/protected
  core, no public-contract change) — it is a single-file write to this bundle's
  ruling home. Taken alone that reads `depth=note`. **Route taken: `depth=sdd`**,
  because FE-3031 is an **already-routed sdd bundle** (`docs/sdd/FE-3031/`) and
  this pass is not a fresh ask owing a depth decision — it is the SDD chain's own
  **Step 1b (Capture Review Notes)** under **Step 1c**'s read-notes-first
  discipline, which is why `review-notes.md` was read in full before a line was
  written. `docs/plans/<slug>.md` was deliberately NOT written: a light plan is
  the wrong artefact for a settled-ruling record, and `docs/plans/` is outside
  this seat's write lane. Slug resolved from the ID: `FE-3031`.
- **Step 1b mirror: DONE.** The three rulings, the constraints and the closing
  state are mirrored to Linear as a structured comment on FE-3031
  (`22759568-c130-4b61-9707-0f163c265a2e`, 2026-09-09). Recorded honestly:
  **no prior pass on this story mirrored its review notes** — the issue carried
  **zero** comments before this one, across five passes. Step 1b was owed four
  times and paid once.
- **Tracker label stamp: DECLINED, with reason.** The `/plan` door stamps
  `skill:Plan` when it runs against a tracked issue. FE-3031 is **In Progress**
  carrying `actor:AI` + **`skill:Factory`** — a mid-flight factory run, not a
  `/plan`-initiated planning claim. `agent-orchestration.companion.md` §2 routes
  the runner **by the work label**, and its transition table has no
  `skill:Factory` → `skill:Plan` edge; stamping one would re-route a live
  dispatch to `pick-plan` and hijack the conductor's lifecycle. No label and no
  status were written. Flagged to the conductor, which owns the handoff.

---

## 2026-09-09 — planner seat, 6th pass (post-readback: two documentation items + one named defect)

This pass **records**. The `/factory` door's terminal JTBD readback returned
**MET** at `72ee251d0` (verdict filed at `verify.md:1281`), after one FAILED
verdict and two authorised fix cycles. **That verdict is not re-graded here.**
Four of the five JTBD nouns are SERVED; "assigned method" is PART-SERVED with
its write half out of scope by signed disposition.

The readback left this seat **two items, both graded documentation rather than
capability** (`verify.md:1457-1466`). Both are closed below. Two further things
the readback named — a real defect in nobody's current lane, and three residual
observation gaps — are recorded so they are not lost at handover.

**No AC capability sentence is weakened, no parity disposition is softened, and
no cell or row is added or removed by this pass.** Files written: this file,
`parity.yaml` (`R05` `notes:` only — disposition and capability sentence
untouched), `design.md` (`R05`'s summary-table row, in lock-step). Nothing
outside `docs/sdd/**` was written.

---

### Item 1 — CLOSED 2026-09-09: limitation #1's wording, restated as the press half alone

All run, limitation #1 read as:

> **WAS:** "AC-1's `refreshUnpaidAmount` is readable in the detail, not
> pressable."

**The readback found the READABLE half was false.** The value sat on
`useInvoice().useContext().unpaidAmount` — a **sibling of `data`** — and
`DetailSurface` drew only `context.model`, so nothing on the page addressed it.
The declaration spec's own comment repeated "readable in the detail" while
asserting only `not.toContain("refreshUnpaidAmount")`
(`invoices-declaration.spec.ts:277-280`): the readable half was asserted nowhere
and was **not true** (`verify.md:1153`, `verify.md:1247`).

**It is now true.** `c148e45ea` added `DetailUischema.siblings` under the
2026-09-09 sign-off; `invoices.presentation.ts:295` declares
`siblings: ["unpaidAmount"]`; and the readback **render-proved** `£72.00` on
screen from the real captured `unpaid_amount`, with a differential control that
dies when `siblings` is stripped (`detail-dialog-siblings.invoices.spec.ts`,
3/3 green).

The limitation therefore restates as **the press half alone**:

> **NOW:** "AC-1's `refreshUnpaidAmount` is **not pressable**. The re-read
> itself is readable and render-proven in the detail
> (`invoices.presentation.ts:295`, `siblings: ["unpaidAmount"]`); no control
> re-triggers it on demand, because the runtime's **actions channel binds the
> list cell only** and re-binding it to the detail cell is a materially larger
> change that the 2026-09-09 sign-off does not cover. **The press is an
> ergonomic shortcut legacy never had, not a capability out of reach:** the
> oracle capability is `getUnpaidConvertedAmount` (`oracle:621-632`), a **GET**;
> the oracle exposes **no refresh verb** for it, so a legacy consumer re-reads
> by **reopening the record** — and the page does exactly that, because
> `loadUnpaidAmount` carries `staleTime: 0` (`invoices.services.ts:363`) and
> `DetailDialog` destroys its read instance on unmount, so reopening the invoice
> **re-fires the live read**, by the same route the oracle's own consumer uses."

**The reopening route is recorded** (the sentence above), and it is what makes
the press cost the JTBD nothing rather than merely being an accepted gap.

**The history is kept deliberately.** This limitation was recorded as
**half-false for most of the run** — through six green gates — and the record of
that is worth more than a clean sentence. The confirmation that the press half
is *still* unfixed is what finally made "readable, not pressable" a true
sentence (`verify.md:1307-1308`, `verify.md:1363`); a reader who meets only the
tidy version learns nothing about how a half-false disclosure survived six
gates.

**One precision, verified at source by this seat, so nobody later "finds" a
capability the readback missed.** The oracle *does* contain an action literally
named `refresh` — `regenerateInvoice` (`oracle:492-514`), a **POST** to
`${apiPath().admin}/${invoiceId}/refresh` carrying `company_id`/`address_id`. It
is a **staff-arm write that regenerates the invoice**, not a re-read of the
unpaid amount, and it is already inside a dispositioned range
(`parity.yaml:40`, R07's admin-only writes, signed
`op:dom@upmind.com:2026-09-01`). The readback's "the oracle exposes no refresh
verb" is therefore accurate **for this read**, and no undispositioned oracle
capability is implied. **Not a halt.**

**Where the stale wording still lives — NOT this seat's lane.** The
source-side comment was already corrected by the developer
(`invoices.presentation.ts:100-107` now states "…is accurate for the first time
as of this fix"). What remains stale is the **spec title**
`invoices-declaration.spec.ts:277` — "draws no control named
`refreshUnpaidAmount` — readable in the detail, not pressable" — which is now a
**true** sentence but asserts only the press half. That is the **prover's**
lane; recorded here, not edited.

---

### Item 2 — CLOSED 2026-09-09: R05's `payment_details` grade became true after the fact

**Written to `parity.yaml` `R05` `notes:` and mirrored in `design.md:109`.
Disposition unchanged (`Direct`); capability sentence unchanged.**

R05 graded `payment_details` `Direct` on **include-set membership**. The
readback's PASS 1 called that out precisely (`verify.md:1114`,
`verify.md:1150`): membership is **the criterion R05's own 2026-09-08 correction
(iii) had already rejected**, when it split R11/R12 out of this same `Direct`
row for reaching no `Invoice` VM field. `payment_details` was requested
(`invoices.services.ts:80`, `oracle:262`) and reached none — `mapInvoice` read
no `raw.payment_details`. **At the moment the grade was written, it was wrong,
by this row's own test.**

**It is now true on that same test** — requested **and** reaching a VM field —
because `e3188fca8` added `mapPaymentMethod` (`invoices.mappers.ts:242`) wired
at `invoices.mappers.ts:91` to `Invoice.paymentMethod`, and the detail draws
`paymentMethod.label` as a scalar leaf. The readback verified this **against
reality rather than against the declaration**: two recorded captures
(`get-invoices-id-case-first.json`, `get-invoices-id-case-paid.json`) carry
`card_type: "visa"` / `card_last4: "4242"`, so `label` resolves to
`"visa ****4242"` rather than the empty string.

**What the note records, and why:**

- It **became true by this fix, not when it was written.**
- **PASS 1's finding stands as history.** A row that quietly reads correct today
  would hide that it was wrong when it was signed — so the row says so.

---

### Recorded — 🟠 Hardcoded English in a headless mapper (a real defect, in nobody's current lane)

**Confirmed at source by this seat.** `paymentStateLabel`
(`packages/headless/src/modules/invoices/invoices.mappers.ts:269-273`) emits
`"successful"` (`:270`), `"pending — awaiting you"` / `"pending"` (`:272`) and
`"failed"` (`:273`) as **literals**; `mapBundleGroupsSummary` (`:294-298`) emits
`"Unlinked"` as a literal (`:298`).

**Those strings reach the screen.** `paymentStateLabel` is composed into
`paymentsSummary` at `:284`, mapped onto the record at `:90`;
`mapBundleGroupsSummary` is mapped onto `bundle.groupsSummary` at `:180`. Both
are drawn as detail leaves. That is **untranslatable user-visible copy generated
inside `packages/headless`**, against this repo's i18n mandate.

**The escape route — recorded, because it is the transferable half.** It did not
trip the labs `untranslated()` sweep because
`playgrounds/labs-nuxt/modules/scenarios/runtime/components/surfaces/__tests__/detail-surface.spec.ts`
runs that sweep (`:78`) against the **client-emails** declaration (`:10`
imports `useClientEmails/client-email.scenario`; `:33` passes
`clientEmails.presentation.detail`) — **not the invoices one**. A per-module
sweep that is hard-wired to one module's declaration cannot see a second
module's copy, however many modules adopt the pattern. This is the same
gate-design class already recorded on this story at Ruling 3: **a gate that
grades one shape passes over every capability it does not address.**

**Why it is a defect and not a capability gap.** The readback graded it **not a
capability gap** — the values are **readable**, and the run is graded **EN per
ADR-021** — but a **real defect** (`verify.md:1441-1450`). This seat concurs and
does not re-grade it: no AC and no parity row asserts a translated string, so
the MET verdict is not in question.

**Whose lane, for the handover — this seat's read.** Two lanes, and neither is
open on this story:

1. **The fix is the developer's** — the literals are in `packages/headless`
   production source, and replacing them with keys is a code change, not an
   assertion. It is also a **cross-module** change (a `paymentsSummary`-shaped
   mapper string is a pattern, not a one-off), so it wants its own story rather
   than a widening of FE-3031's blast radius — the same reasoning the operator
   applied to the corpus/replay routing under Ruling 1.
2. **The escape is the prover's** — the `untranslated()` sweep must be
   parameterised over **every** declared scenario rather than hard-wired to
   client-emails, or the next module repeats this exactly. Filing the fix
   without the sweep leaves the class open.

**Not raised as a blocking ambiguity**, because it names no capability, no
actor×context cell and no AC: it is a recorded defect for the handover, not a
scope question. **Not a halt.**

---

### Recorded — eight new i18n keys pending in the external catalogue

Joining the already-pending set (C8 above), the readback names
(`verify.md:1451-1456`):

| # | Key |
| --- | --- |
| 1 | `invoices.notice.has_unpaid` |
| 2 | `invoices.notice.consolidatable_count` |
| 3 | `invoices.detail.unpaid_amount` |
| 4 | `invoices.detail.payment_method` |
| 5 | `invoices.detail.consolidation_invoice` |
| 6 | `invoices.detail.credit_invoice` |
| 7 | `invoices.detail.amount_to_credit` |
| 8 | `invoices.detail.bundle_is_large` |

Owner: **external catalogue** — same owner and same disposition as C8. Until
they land, these render as raw keys. Recorded as known; no AC asserts a
translated string.

---

### Recorded — the residual observation gaps: the run's honest confidence floor

Verbatim from the readback (`verify.md:1404-1420`, and the third carried
unchanged from Ruling 1). **Each is a place where the capability is present and
the mechanism verified, but the render has not been watched.** None is a halt;
none re-opens the verdict.

| # | Gap | Detail |
| --- | --- | --- |
| G1 | **`paymentMethod` has never been watched rendering a method** | The readback's fixture carries `payment_details: null`, so that field draws "—" in the only observed render — while **two other fixtures in the same corpus** (`get-invoices-id-case-first.json`, `get-invoices-id-case-paid.json`) carry a real one. The mechanism was closed **by reading those payloads**, so this is an **unwatched render, not an unproven one**. It is also the **one new mapper member with zero unit coverage**: `invoices.mappers.test.ts` is still **19 tests** across a **70-line** mapper addition, and **no test names `paymentMethod`** (confirmed at source by this seat: 19 `it(` blocks, 0 occurrences of `paymentMethod`). |
| G2 | **The `ModuleRenderer` relay is untested** | `port.rawMeta()` → **both requests fire** (proven, with control) and `ListSurface` + a `notices` prop → **the digits render** (proven, with controls), but **no spec exercises the line joining them** — `ModuleRenderer.vue:28`, `:notices="port.rawMeta?.()"` (confirmed at source by this seat). Both spellings were verified to match `ListSurfaceProps.notices`, and the binding sits on the **LIST branch this page takes**. |
| G3 | **No seat has observed the invoices page render rows in the labs replay environment** | Carried **unchanged** from Ruling 1. `forced-surface.invoices.spec.ts` is still red with the same three cells and the same verbatim first failure; the `notices`/`siblings` work does not touch `runtime/force/**` and did not clear it. The data half and the render half are each proven; their **composition in that one environment** is not. |

G1 and G2 are gaps in **watching**, not in mechanism: the closing evidence for
each is a payload or a spelling this seat re-confirmed at source. G3 is the
residual the operator's Ruling 1 explicitly accepted.

---

### Gate + hand grade, this pass

- **Compliance gate** (there is no `ci/` directory in this repo; the gate exists
  only in the plugin cache, so the absolute path below is the one that runs):

  ```bash
  node "/Users/dom/.claude/plugins/cache/upmind-agent/upmind-agent/0.19.4/ci/lint-plan-compliance.mjs" "docs/sdd/FE-3031"
  ```

  → **exit 0**, no output.

- **`parity.yaml` by hand, re-graded at source this pass:** **4 cells**, **0
  undispositioned cells**; **12 rows (R01–R12)**, **0 undispositioned rows**;
  **`blocked_by` on 0 cells and 0 rows**; **6
  `Dropped-with-issue-reference` dispositions, each carrying a `signoff:`
  token** (2 cells + 4 rows, 6 signoffs — a 1:1 match). Disposition census: **9
  `Direct`, 6 `Dropped-with-issue-reference`, 1 `Renamed` = 16 = 4 cells + 12
  rows** — **identical to the 5th pass**. The hand grade remains the
  load-bearing one: the lint's parity parser grades **cells** only.

- **ACs or parity rows weakened by this pass: NONE.** `requirements.md`,
  `tasks.md` and `bdd.md` are untouched. `parity.yaml` gained **only** a `notes:`
  paragraph on `R05`; its `disposition:` and `capability:` are byte-identical.
  `design.md` gained **only** a dated note inside `R05`'s summary-table
  disposition cell.

- **Write-lane breaches: none.** `docs/sdd/**` only. `verify.md` was **read, not
  written** — it is the verifier's artefact and it filed PASS 2 itself. No
  source file, no `__tests__/**` file, and no file outside `docs/sdd/FE-3031/`
  was modified by this pass.

- **Carried, unchanged by this pass:** C2 (`parity.yaml` R08's `tracker:`
  placeholder, operator-owned), and the `oracle:172-179` anchor cosmetic in
  `invoices.mappers.ts:70` (developer's lane; `parity.yaml` R06 does not depend
  on it).

### Door record — `/plan` (6th pass)

- **Dispatch-record stamp (door Step 4): `depth=sdd`, `start_route=increment`.**
  Per the machine-readable mirror
  (`teams/intensity-ladder.yaml:96-98`), `depth=sdd` pairs with
  `plan: docs/sdd/<slug>/` and `start_route: increment` — **staged** only for an
  epic with child stories, which this is not. **DEPTH ≠ SIZE firewall honoured
  (`§3.3`, `intensity-ladder.yaml:99`):** `depth` reached the spec artefacts and
  this record only. It reached **no seat, no model pin, no test scope and no
  fake-detector setting** — this pass dispatched no seat, pinned no model and
  changed no test scope, so the firewall is satisfied vacuously as well as by
  intent.

- **Depth band, computed per `rules/agent-orchestration.md` §3.3:** the ask names
  **0** new capabilities/ACs, **0** code surfaces, has no importer blast radius,
  and trips **no** risk-floor question (no trust boundary, no money/auth/protected
  core, no public-contract change). Taken alone that reads `depth=note`. **Route
  taken: `depth=sdd`**, for the same reason as the 5th pass — FE-3031 is an
  **already-routed sdd bundle**, and this pass is the SDD chain's own **Step 1b
  (Capture Review Notes)** under **Step 1c**'s read-notes-first discipline, which
  is why this file was read in full before a line was written.
  `docs/plans/<slug>.md` was deliberately NOT written: a light plan is the wrong
  artefact for a post-verdict record, and `docs/plans/` is outside this seat's
  write lane. Slug resolved from the ID: `FE-3031`.
- **Blocking-ambiguity classifier (`/sdd` Step 1d): no halt.** Neither item
  names a capability, an actor×context cell or a scope-matrix disposition — both
  are wording/provenance records the readback itself graded documentation. The
  hardcoded-English defect and the three observation gaps are recorded, not
  adjudicated.
- **Tracker label stamp: DECLINED, same reason as the 5th pass.** FE-3031 is **In
  Progress** carrying `actor:AI` + **`skill:Factory`** — a mid-flight factory
  run, not a `/plan`-initiated planning claim. `agent-orchestration.companion.md`
  §2's transition table has no `skill:Factory` → `skill:Plan` edge; stamping one
  would re-route a live dispatch to `pick-plan` and hijack the conductor's
  lifecycle. No label and no status were written.
- **Step 1b mirror to Linear: DONE.** Comment
  `b09ca520-907c-471c-8d79-f4b72da15ed3` on FE-3031, 2026-09-09, carrying both
  closed items, the hardcoded-English defect with its escape route and lane
  read, the eight pending i18n keys, the three residual observation gaps, the
  `regenerateInvoice` precision, and this pass's gate + hand grade. The 5th pass
  mirrored the rulings and closing state at
  `22759568-c130-4b61-9707-0f163c265a2e`.

  **Corrected in this same pass, and the correction is the point.** This bullet
  first read "NOT performed by this pass — mirroring it is the conductor's
  call". That was this seat declining a step its own door mandates, on a reason
  weaker than the mandate: `/sdd` Step 1b requires the notes be saved **and**
  posted to the tracker, and the 5th pass had already established the channel on
  this very story. Leaving it unpaid would have repeated the exact failure this
  file already records — Step 1b "owed four times and paid once" — while a
  post-verdict pass was busy correcting two other known-false sentences. **No
  label and no status was written**; the comment is the whole tracker write.
