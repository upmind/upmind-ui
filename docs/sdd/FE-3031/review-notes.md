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
