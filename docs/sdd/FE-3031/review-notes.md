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

### H1 — OPEN BLOCKER (developer lane): the list read's `client_id` column is
### not durable across a published criteria write

**Severity: blocker.** This is Review blocker B2's defect reached through the
public surface instead of at mint. It is in scope (AC7 is in scope, AC12
declares the retarget); it is **not** a follow-up and must not be parked on
effort grounds.

- `trackClientIdFilter` (`packages/headless/src/modules/invoices/invoices.services.ts:136-151`)
  watches the **resolved client id** and re-applies `client_id` on change, with
  `{ immediate: true }`. The id does not change after a `.for('client', X)`
  mint, so the watcher fires exactly once.
- `criteria.set` **merges at branch level** — "`set({ filters })` replaces the
  whole `filters` branch"
  (`packages/headless/src/modules/query/useQueryCriteria.ts:100-101`,
  implementation `:111-123`).
- Therefore any published `filters`-branch write that does not itself carry
  `client_id` drops the column, and the next list fetch returns the **reading**
  client's rows while `select: raw => mapInvoices(raw, clientId.value)`
  (`invoices.services.ts:186`) still attributes them against the target —
  corrupting `isChildOfClient` / `isDelegated` / `isSettleable`.
- Two reachable doors:
  - `useActions().filterCreditNotes()` (`useInvoices.actions.ts:168-170`) — its
    preset `creditNotesCriteria` (`invoices.schemas.ts:378-390`) carries no
    `client_id`.
  - the published `useActions().setCriteria` (`useInvoices.actions.ts:231`),
    which `useInvoices.ts:92`'s own doc example calls with a bare `filters`
    branch.
- **Not** affected: `sortBy` (`:144-146`, `sort` branch only);
  `filterConsolidatable` (`:157-161`, its preset carries `client_id` itself);
  `loadUnpaidExistence` and `loadConsolidatableCount` (their criteria objects
  are private to the factory — no published verb can replace their branches).
- Constraint on the fix: the 2026-09-08 operator ruling — verbatim, **"do not
  chnage any query stuff"** — puts `packages/headless/src/modules/query/**` off
  limits. The fix must live in the invoices module.
- Executable form of this blocker: `requirements.md` AC12's second read-back
  ("the durability half"). It is **expected RED today** and is stated as a
  required read-back rather than removed.
- `parity.yaml` `cells[client×client].blocked_by` names H1 so the `Direct`
  disposition cannot be read as satisfied.

### H2 — OPERATOR DECISION OWED: `data` + `account.user` (`parity.yaml` R12)

**This is the one escalation this pass raises.** One answer closes it.

Review found four relations listed inside R05's `Direct` capability that no
include set requests and that reach no `Invoice` VM field. Two of them —
`original_invoice`, `duplicate_invoice` (`oracle:266-267`) — render the oracle's
**admin** duplicate flow (`oracle:516-540`), so the 2026-09-01 staff/admin
ruling covers them; they are now R11, `Dropped-with-issue-reference`, signoff
`op:dom@upmind.com:2026-09-01`. That inference is stated in the row so it can be
rejected.

The other two have **no ruling covering them**:

- `data` (`oracle:256`) and `account.user` (`oracle:257`).
- Their only oracle read is `getWithParams` (`oracle:250-276`), whose **only**
  consumers are the payment modals —
  `src/components/app/global/payments/openAutoPayModal.vue:56-62` and
  `src/components/app/global/payments/openInitPayModal.vue:91-97`, `:118-124`
  (grepped; no other call site exists).
- The payment flow is declared Out of Scope by name ("The payment flow itself
  (PN-1)"), so a drop is arguable — but that clause carries **no dated operator
  token**, and `getWithParams` is `apiPath().contextual`, so it serves the
  client lane too. The 2026-09-01 staff/admin ruling does not reach it.
- The planner seat **may not self-sign a drop**, and effort is never a
  disposition. R12 therefore stands `PENDING-OPERATOR-SIGNOFF` and the bundle's
  honest undispositioned **row** count is **1**.

**Question for the operator (one answer):** sign the drop of `data` +
`account.user` as covered by the PN-1 out-of-scope boundary, or rule them in
scope — in which case they need an include-set entry, mapped VM fields, and an
AC.

### Cosmetic / recorded, not halting

- `verify.md:88-93` now reads stale: it states "`loadList` does **not**
  auto-seed the filter from it, while `loadConsolidatableCount` **does**". Both
  seed it now. `verify.md` is the verifier seat's artefact and was left
  untouched; the re-Review pass regenerates it.
- `invoices.mappers.ts:70` still carries the wrong label-precedence anchor
  (`oracle:172-179`; the real one is `oracle:175-180`). That line is the
  developer's write lane and was reported there. `parity.yaml` R06 does not
  depend on it.
- `parity.yaml` R08's `tracker:` is still a placeholder string, not a Linear id
  (operator-owned, carried over from the first pass).
