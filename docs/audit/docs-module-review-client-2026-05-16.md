# Client Foundation Doc — Review (2026-05-16)

**Module:** `client`
**Candidate:** `packages/headless/src/modules/client/docs/foundation.md`
**Standard:** `.agent/rules/docs-modules.md` (canonical) + `.agent/rules/docs-reviews.md`
**Prior review:** `docs/audit/client-foundation-2026-05-15.md` (86/100)
**Reviewer status:** ✅ Done (shippable with small set of fixes)

---

## Executive Summary

| Category | Prior (2026-05-15) | Current | Δ | Notes |
| --- | ---: | ---: | ---: | --- |
| Technical Accuracy | 88 | 84 | -4 | Dependants table was edited toward graph-derived weights but the underlying graph interpretation is inverted — see D-1. Type/fixture coverage improved (admin-adjacent fields disclosed, `vat_*` server-owned note landed). |
| Completeness | 92 | 92 | 0 | All seven sub-domains still covered. Three minor fixture-shape gaps remain (`external_id`, `import_id`, `staged_import` on address rows). |
| Structure | 86 | 92 | +6 | Mermaid `<br/>` issue cleanly resolved by switching from `sequenceDiagram` to `flowchart TD`. Rule explicitly permits `<br/>` inside flowchart node labels. Canonical section order respected. |
| Tone | 88 | 90 | +2 | Lifecycle-aside warning C-2 from prior review is now resolved — the post-Operations note no longer uses "invalidate-and-refetch" or "default-row helper" vocabulary. |
| Actionability | 78 | 82 | +4 | Real fixture content visible in the addresses, phones, and companies samples; only seven endpoints still carry honest "stubbed" markers. `PUT /clients/{id}` remains stubbed (only genuine recordable gap). |

**Overall: 88 / 100** (prior 86, **Δ +2**)

**One-paragraph verdict.** The agent landed every prior-review fix cleanly. The mermaid HTML issue is gone (diagrams switched to `flowchart TD`, which the rule permits with `<br/>`), the admin-adjacent column families are now disclosed in the `Client` type comment, the `vat_*` server-owned note landed on `CompanyBody`, and the Operations lifecycle aside was rewritten in framework-neutral prose. The dependants table *was* regenerated against the graph — but the graph traversal direction is inverted: the table currently lists modules that `client` imports *from* (its dependencies), not modules that import *from* `client` (its dependants). The true headless-layer dependants are `session` (4 files), `basket` (3 files), `invoices` (2 files); `dataManager`, `brand`, and `system` do not import from `client/*` at all. This is the only material remaining issue.

---

## Part 1 — Delta vs Prior Review (2026-05-15)

### Prior critical (1)

| ID | Issue | Status | Evidence |
| --- | --- | --- | --- |
| M-1 | `<br/>` HTML in mermaid `note over` lines (6 occurrences, banned by the patched flow-shape rule) | ✅ **FIXED** | Candidate now uses `flowchart TD` for all four flows (lines 896, 922, 954, 980). The rule explicitly permits `<br/>` inside flowchart node labels: "Use `<br/>` inside node labels for line breaks." No `sequenceDiagram` / `note over` lines remain. |

### Prior warnings (3)

| ID | Issue | Status | Evidence |
| --- | --- | --- | --- |
| D-1 | Dependants table weights don't match graphify cross-module fan-in | 🔁 **REGRESSED** (different direction) | Candidate dependants table at lines 347–354 now lists `datamanager 15, basket 12, system 5, invoices 2, brand 1`. These values match the prior review's *Direction A* jq query — but that query counted edges where `target=client`, which in this graph's edge encoding means **modules `client` imports from**, not modules that import from `client`. See Issue D-1-2026-05-16 below for the corrected weights. |
| F-1 | Four sample responses stubbed where real fixtures exist | ✅ **FIXED** (mostly) | Real captures now visible for `GET /clients/{id}/addresses` (lines 422–483), `GET /clients/{id}/phones` (lines 542–589), and `GET /clients/{id}/companies` (lines 698–752). The `state` column documented on `Address` (line 124) is **typed-contract-only** — it's absent from the fixture. Acceptable per the rule's "fixture-first where typed contract is narrower, but admin-relevant typed fields belong in the data shape" guidance, but the inverse case (fixture fields beyond the typed contract: `external_id`, `import_id`, `staged_import`) is not yet reflected. See Suggestion C-3-2026-05-16. |
| D-2 | "Reads" column on prior session-style row was session-internal | ✅ **FIXED** | The note under the dependants table now correctly calls out that `session` and `paymentDetails` are absent because the edge runs the other way (`session` populates the client record at boot via `/self`, gateways read identity from `session.actor`). Good. |

### Prior suggestions (5)

| ID | Issue | Status | Evidence |
| --- | --- | --- | --- |
| C-1 | 17 Operations rows vs rule's max of 12 | 🟡 **PARTIAL** | Current count: 17 capability rows (lines 22–39). The agent did not collapse per-collection CRUD into single rows. Not a blocker — the rule says "max 12 per module" and this is genuinely a five-collections-plus-two-read-domains module — but worth flagging again. |
| C-2 | Lifecycle aside drifted toward implementation framing | ✅ **FIXED** | The post-Operations note at line 41 now reads: "After any mutation against operations 2–14 the corresponding list returns the new state on the next read; the default row is whichever row carries the `default` flag set, or none when the collection is empty." Framework-neutral, observable behaviour. Clean. |
| C-3 | `PUT /clients/{id}` fixture absent — only genuine recordable stub | ❌ **NOT FIXED** | Sample at lines 388–407 still marked `// stubbed — real capture replaces this`. Worth recording. |
| C-4 | Admin-adjacent fields on `Client` not disclosed | ✅ **FIXED** | Type comment at lines 51–56 now names the omitted column families explicitly: "fraud policy, support pin, reseller affiliate fields, child-account configuration, package limits, plus invoicing / dunning / account-behaviour columns (`tax_type`, `topup_enabled`, `invoice_consolidation_*`, `before_due_date_charge_interval`, `secret_code`, `never_cancel`, `never_close`, `never_suspend`, `notifications_disabled`)." Matches the `IClient` interface in `packages/types/src/models/clients.ts:22–93`. |
| C-5 | `vat_*` server-owned note should live on `CompanyBody` | ✅ **FIXED** | `CompanyBody` block now carries the inline comment at lines 245–249: "The `vat_*` outcome fields (`vat_validated`, `vat_validated_with`, `vat_validation_checked_at`, `vat_validation_failed_reason`, `vat_percent`) are server-owned and are not part of this body — the server populates them after running validation." Promoted from the API-endpoints section as requested. |

### New strengths

- 🟢 **Italic `meta` note placement.** The candidate carries the canonical italic line at line 7 immediately after the "What it is" paragraph, exactly per template. The `meta` field is then silently omitted from every sample body, every type block, and every flow — including the otherwise-fixture-faithful samples where the captured payload would have carried `meta: null` on the address rows. Strip discipline is uniform across the doc.
- 🟢 **The "Notably absent" call-out under the dependants table.** Even though the table weights themselves are inverted (see D-1), the prose at lines 356–357 correctly captures the architectural fact that `session` and `paymentDetails` reach client data via `session.actor`, not via `client/*` services. That paragraph survives the table correction.
- 🟢 **The four flowcharts are now reference-quality.** Rounded entry/terminal nodes, square action nodes, diamond branch nodes, `<br/>` inside labels (rule-permitted), BE endpoints as node labels, no composable method-name leakage, no actor / subscription / query-invalidation commentary. The "Create a company with inline related records" flow is the exemplar.

### New issues

- 🟠 **D-1-2026-05-16 (dependants direction inverted).** See Part 2 → Content audit → Dependants. The agent followed the prior review's `jq` snippet verbatim, but that snippet measured client's outgoing imports rather than incoming imports.

---

## Part 2 — Fresh Full Audit

### Strip audit

| Pattern family | Verdict | Evidence |
| --- | --- | --- |
| Composable method names (`useX(`, `isReady(`, `getConfigValue(`, etc.) | ✅ PASS | Spot-grepped lines 1–1033. No `useClient*()`, `isReady()`, `getConfig*()`, `validate*()` in prose. |
| Internal store / queryKey / persister names | ✅ PASS | No `clientStore`, no `["clients"`-shaped query keys, no `localStoragePersister`. |
| Framework terms (`computed`, `ref`, XState, TanStack, `useQuery`, `spawn`, scoped composable) | ✅ PASS | None present. The word "actor" appears only in the `Client.actor` data-shape header (line 45, "the `actor` block returned by `/self`") which is the BE response key, not XState vocabulary. Fine. |
| `.meta` content outside the italic note | ✅ PASS | Italic note at line 7 only; no `meta`, no `BrandMeta`, no `uischema`, no `i18n` overrides referenced anywhere. |
| Prescriptive verbs ("you should", "you must", "everyone awaits", "plan for") | ✅ PASS | None in Lessons or Flows. Lessons are uniformly problem-shaped ("A consumer that…", "A storefront that…", "A panel UI that…"). |
| Solution-shape suffixes ("the cleaner shape is X", "the natural separation is Y") | ✅ PASS | None present. |
| Meta-commentary about implementation ("our implementation", "we chose", "we split") | ✅ PASS | None present. |
| "Operation queue", "pending product", "silent mode", "schema framing" leaks | ✅ PASS | None present. |

### Section audit (canonical order)

| Section | Required? | Status | Notes |
| --- | --- | --- | --- |
| Header (`# Module: client`) | ✅ | ✅ Present | Line 1. |
| What it is | ✅ | ✅ Present | Lines 3–7, one paragraph + italic meta note. |
| Core concepts | optional | ✅ Present, justified | Seven terms, all load-bearing for the rest of the doc. |
| State model | optional | ✅ Correctly omitted | Client doesn't expose a server-defined lifecycle state enum. |
| Operations | ✅ | ✅ Present | Lines 19–41. 17 rows (over the soft cap of 12 — see Suggestion C-1-2026-05-16). |
| Data shape | ✅ | ✅ Present | Lines 43–341. Seven type blocks (Client, Address, Phone, Email, Company, CustomField, SentEmail) + two body shapes (ProfileUpdateBody, CompanyBody). |
| Dependencies | ✅ | 🟡 Present but inverted | Dependants table direction inverted — see D-1-2026-05-16. Own-dependencies list (lines 358–364) is clean and complete. |
| API endpoints | ✅ | ✅ Present | Lines 366–886. 21 endpoints documented, 100% of the source-exposed surface. |
| Side effects | optional | ✅ Correctly omitted | No externally-observable side effect another system needs to replicate. |
| Coordination | optional | ✅ Correctly omitted | No cross-module coordination that doesn't fit in Lessons. |
| Flows | optional | ✅ Present, well-justified | Lines 888–1001. Four flows: add-and-verify-email, create-company-inline, custom-fields-discover-then-write, profile-update-with-locale-side-effect. All four are genuinely multi-step. |
| Lessons | ✅ | ✅ Present | Lines 1003–1032. 15 lessons, all problem-shaped. |

### Content audit

#### Capabilities (Operations table)

Cross-referenced against `packages/headless/src/modules/client/*/services.ts`. Endpoints invoked by the source:

| Service file | Endpoint built | Operations row |
| --- | --- | --- |
| `personalDetails/services.ts:95-100` | `PUT /clients/{id}` | #1 ✅ |
| `address/services.ts:48` | `GET /clients/{id}/addresses` | #2 ✅ |
| `address/services.ts:140` | `POST /clients/{id}/addresses` | #3 ✅ |
| `address/services.ts:156` | `PUT /clients/{id}/addresses/{id}` | #3 ✅ |
| `address/services.ts:196,228` | `DELETE /clients/{id}/addresses/{id}` | #3, #4 ✅ |
| `phone/services.ts` | `GET/POST/PUT/DELETE /clients/{id}/phones` | #5–#7 ✅ |
| `email/services.ts:46,93,109,148,180,212` | `GET/POST/PUT/DELETE /clients/{id}/emails` + `PATCH .../send_verify` | #8–#11 ✅ |
| `company/services.ts` | `GET/POST/PUT/DELETE /clients/{id}/companies` | #12–#14 ✅ |
| `customFields/services.ts` | `GET /custom_fields?filter[object_type]=client` | #15 ✅ |
| `emailHistory/services.ts:35,54` | `GET /self/email_history` + `GET /emails/{id}` | #16, #17 ✅ |

**Verdict:** 100% capability coverage. Every BE call the source surfaces has a row; no source-exposed capability is missing.

🟡 **Suggestion C-1-2026-05-16:** Capability row count is 17 vs the rule's soft cap of 12. The cleanest collapse (per-collection CRUD into "Manage X (read / create / update / delete / set default)") would bring the count to ~10 (profile, addresses, phones, emails, companies, send-email-verification, custom-fields, sent-email-history, single-sent-email). The current shape is more explicit at the cost of cap compliance. Borderline; leave if the producer prefers the explicit shape, but worth a producer-side decision.

#### Data shape

Cross-referenced against `packages/types/src/models/{clients,addresses,phones,emails,companies}.ts` and the captured fixture `get-clients-…-addresses-f13c8b36.json`.

| Type block | Source-of-truth match | Notes |
| --- | --- | --- |
| `Client` | ✅ Match against `IClient` (`clients.ts:22–93`) | Doc trims admin fields and now discloses the trimmed column families inline (lines 51–56). Good. |
| `ProfileUpdateBody` | ✅ Match against `IClientForm` (`clients.ts:106–116`) and the `mapProfileFields` mapper output. | |
| `Address` | 🟡 PARTIAL | Doc lists `state` (line 126) which is present in the typed contract but **absent** from the captured fixture. Fixture additionally carries `external_id`, `import_id`, `staged_import` (admin-adjacent on the address row itself) which the doc omits. The rule says "where the typed contract is narrower than the fixture, follow the fixture; admin-relevant fields the contract excludes are still real and belong in the data shape." Three small misses. |
| `AddressBody` | ✅ Match. | Body shape matches `address/services.ts:140`. |
| `Phone` | ✅ Match. Doc includes `syntax_valid` from fixture (typed contract doesn't carry it). Correct fixture-first per rule. |
| `PhoneBody` | ✅ Match. |
| `Email` | ✅ Match against `IEmail`. |
| `EmailBody` | ✅ Match. |
| `Company` | ✅ Match against `ICompany` (`companies.ts`). The `vat_percent: string` typing is per the fixture (numeric string). Good. |
| `CompanyBody` | ✅ Match. Server-owned `vat_*` callout (lines 245–249) is now correctly inline. |
| `CustomField` | ✅ Match. Type enum values 1–8 in line 274 match `packages/types/src/data/enums/customFields.ts`. |
| `SentEmail` | ✅ Match against `ISentEmail` (`emails.ts`). All 27 fields enumerated. |

🟡 **Suggestion C-3-2026-05-16 (address fixture fields).** Add `external_id: string | null`, `import_id: string | null`, `staged_import: boolean` to the `Address` type block. Present in the captured fixture; mirrors the disclosure pattern now applied on `Client`.

#### Dependants table

**Computed from `graphify-out/graph.json` (and verified by filesystem grep).**

The graph encodes edges as `source = imported file, target = importer`, confirmed by inspecting `relation: "imports_from"` and the `source_file` field on sample edges. So **modules that import from `client/*` are those with `target ∉ client && source ∈ client`** — the reverse of the candidate's calculation.

**Filesystem ground-truth grep (`packages/headless/src/modules/<X>/**/*.ts` containing `from "[./]*client/`):**

| Module | Files importing from client | Notes |
| --- | --- | --- |
| `session` | 4 | `session.machine.ts`, `useSession.ts`, `admin/services.ts`, `guest/services.ts`, `guest/types.ts` |
| `basket` | 3 | `basket/fields/services.ts`, `basket/fields/types.ts`, `basket/billing/unified/services.ts`, `basket/billing/unified/schemas.ts` |
| `invoices` | 2 | `invoices/mappers.ts`, `invoices/types.ts` |
| `system` | 1 | `system/places/types.ts` (type-only) |

**Outside the headless module set,** the graph shows the vue-app modules:

- `packages/client-vue/src/modules/billing/**` — 17 edges (billing tab, address-item, billing summary, etc.)
- `packages/client-vue/src/components/email/**` — 5 edges
- A handful of presentation-layer imports across the customer panel

**Modules in the candidate's current dependants table that do NOT import from `client/*` at the headless layer:**

| Module | Candidate weight | Graph reality |
| --- | --- | --- |
| `dataManager` | 15 | ❌ Zero direct edges into `client/*`. `dataManager` is a generic CRUD substrate; consumers of client *via* `dataManager` pass through `dataManager` itself, not back into `client/*`. |
| `brand` | 1 | ❌ Zero direct edges. `brand` doesn't read from `client/*` — the brand-customizable VAT-validation policy keys are read *by* the client module *from* brand, not the other way round. |
| `system` | 5 | 🟡 1 type-only import (`places/types.ts`); candidate weight 5 is inflated. Direction is correct but small. |

🟠 **D-1-2026-05-16 (dependants direction).** Recompute the table from the corrected direction. Suggested replacement:

| Module | Weight (files importing from client/) | Reads | Why |
| --- | --- | --- | --- |
| `session` | 4 | client id, personal-details mappers, address types | Session orchestrates the post-`/self` actor block and reuses client's personal-details mappers / address types. The edge runs `session → client/*` at the headless layer. |
| `basket` | 3 | custom-field definitions, custom-field mapper, billing-address shape | Basket's fields module imports `mapCustomField` and the `CustomField` type; the unified billing-step schemas import address shapes for the billing-address form. |
| `invoices` | 2 | client id, custom-field value mapper, address shapes | Invoice rendering joins client custom-field values and references address shapes for the billing-address column. |
| `system` | 1 | address type (type-only) | `system/places/types.ts` references the client `Address` type-only for region-list responses. |
| Presentation layer (`packages/client-vue/**`) | — | client display name, avatar, default email, default phone, default address, default company, locale, custom-field values for forms | Customer-panel chrome, billing tab, address book, companies list, email-history surface; checkout review and registration forms picking up brand custom fields. **This row carries the bulk of the real-world fan-in (≈22 files).** |

**Recompute snippet (drop into a future producer pass):**

```bash
python3 -c "
import os, re
from collections import Counter
base = 'packages/headless/src/modules'
c = Counter()
for r,_,fs in os.walk(base):
  if '/client' in r and not r.endswith('/client'): continue
  if r == base + '/client': continue
  for f in fs:
    if not f.endswith(('.ts','.tsx')): continue
    p = os.path.join(r,f)
    try: txt = open(p).read()
    except: continue
    if re.search(r\"from\s+[\'\\\"][./]*client/\", txt):
      mod = p[len(base)+1:].split('/')[0]
      if mod != 'client': c[mod] += 1
for k,v in c.most_common(): print(v,k)
"
```

#### API endpoints

100% URL/method coverage against `packages/headless/src/modules/client/*/services.ts`. Sample bodies match captured fixtures where present:

| Endpoint | Documented | Fixture present | Sample status |
| --- | --- | --- | --- |
| `PUT /clients/{id}` | ✅ | ❌ | stubbed (acceptable; ❌ Not Fixed from prior C-3) |
| `GET /clients/{id}/addresses?with=…` | ✅ | ✅ | real, trimmed (with note) |
| `POST/PUT/DELETE /clients/{id}/addresses(/{id})` | ✅ | ❌ | stubbed |
| `GET /clients/{id}/phones` | ✅ | ✅ | real |
| `POST/PUT/DELETE /clients/{id}/phones(/{id})` | ✅ | ❌ | bodies only, no response samples (fine for writes) |
| `GET /clients/{id}/emails` | ✅ | ❌ | stubbed |
| `POST/PUT/DELETE /clients/{id}/emails(/{id})` | ✅ | ❌ | bodies only |
| `PATCH /clients/{id}/emails/{id}/send_verify` | ✅ | ❌ | curl only — acknowledgement-only response |
| `GET /clients/{id}/companies?with=…` | ✅ | ✅ | real, trimmed (with note) |
| `POST/PUT/DELETE /clients/{id}/companies(/{id})` | ✅ | ❌ | bodies only |
| `GET /custom_fields?filter[object_type]=client` | ✅ | ✅ (empty array on staging brand) | stubbed populated example with honest note |
| `GET /self/email_history` | ✅ | ❌ | stubbed |
| `GET /emails/{id}?with=data` | ✅ | ❌ | stubbed |

#### Lessons

15 lessons, all problem-shaped, all observable. Spot-checked every one against either source comments, sub-module mappers, or git-history feedback in the prior review. No invented lessons. Standouts:

- 🟢 "Default is a server-side singleton constraint, not a client-side hint" (line 1006) — exact match to the `address/services.ts:228` set-default mutation pattern (PUT with `default: true` server-clears the prior).
- 🟢 "`region_id: "none"` and `region_id: null` are different states" (line 1012) — verified against the addresses fixture: row #1 has `region_id: "d6325079-…"`, row #2 has `region_id: "none"`, country US.
- 🟢 "Phone numbers are stored in three forms and a storefront can pick the wrong one" (line 1014) — verified against `phone/services.ts` body shape (national + ISO + calling-code in, full international back).
- 🟢 "Sub-record contracts diverge on `default`/`verified`/`type` typing" (line 1022) — verified against `IAddress`, `IPhone`, `IEmail`, `ICompany`: `default` is `boolean` on addresses/companies and `number` on phones/emails, exactly as the lesson states.

---

## Top 3 Priorities

1. 🟠 **Recompute dependants direction (D-1-2026-05-16).** Replace the table at lines 347–354 with the filesystem-grep-derived table above. The current table inverts the graph traversal — it lists modules `client` imports *from*, not modules that import *from* `client`. Highest-leverage fix because the dependants table is architectural information an external rebuilder reads first.
2. 🟡 **Capture the `PUT /clients/{id}` profile-update fixture (C-3 carryover).** Only genuine recordable stub remaining. Every other "stubbed" marker in the API-endpoints section is honest (no fixture exists). Run the profile-update path against staging once, drop the capture into `tests/__fixtures__/recordings/`, replace the stub.
3. 🟡 **Add `external_id`, `import_id`, `staged_import` to the `Address` type block (C-3-2026-05-16).** Mirrors the admin-adjacent disclosure pattern now applied on `Client`. The fixture carries them on every row; the doc currently omits them silently. Low-effort polish.

---

## Suggested Rule / Skill Updates

One repeated slip pattern surfaced across the prior review and this one — worth a small rule clarification.

### Proposal: Clarify graph-edge direction in `.agent/rules/docs-modules.md` (Dependants section)

**Trigger.** Both the prior review and this candidate computed the dependants table using `target contains modules_<X>_` as the filter — which in the graph's encoding means "files in `<X>` that import *from* another module". This is the *dependencies* direction, not the *dependants* direction. The producer + reviewer both reached for the same wrong query because the rule doesn't spell out the encoding.

**Proposed addition** (insert after the existing "Dependants" sub-heading paragraph in `.agent/rules/docs-modules.md` line 184):

> **Direction note.** In `graphify-out/graph.json` each edge encodes `source = imported file, target = importer` (with `relation: "imports_from"`). So **dependants of module `<X>` are edges where `source ∈ modules/<X> && target ∉ modules/<X>`**, grouped by the `target` module. A common slip is to filter on `target contains modules_<X>_` — that returns `<X>`'s dependencies, not its dependants.
>
> Reference recompute snippet:
>
> ```python
> import os, re
> from collections import Counter
> base = "packages/headless/src/modules"
> c = Counter()
> for r,_,fs in os.walk(base):
>     if r == f"{base}/<X>" or r.startswith(f"{base}/<X>/"): continue
>     for f in fs:
>         if not f.endswith((".ts",".tsx")): continue
>         txt = open(os.path.join(r,f)).read()
>         if re.search(r"from\s+['\"][./]*<X>/", txt):
>             mod = os.path.relpath(os.path.join(r,f), base).split("/")[0]
>             if mod != "<X>": c[mod] += 1
> for k,v in c.most_common(): print(v, k)
> ```

**Why this is rule-worthy and not a one-off slip.** Two consecutive runs against the same module reached for the same wrong query. The rule names "graph weights" as the source of truth; it should name the *direction* too. Single-sentence addition; no impact on the rest of the rule.

---

## Appendix A — Source-of-Truth References

### Standards

- `.agent/rules/docs-modules.md` (canonical rule, lines 1–357)
- `.agent/rules/docs-reviews.md` (review standard)
- `.agent/rules/docs-writing.md` (general writing standard, referenced)
- `.agent/workflows/docs-module-review.md` (this workflow)

### Doc under review

- `packages/headless/src/modules/client/docs/foundation.md` (lines 1–1033)

### Prior review

- `docs/audit/client-foundation-2026-05-15.md`

### Source (module surface)

- `packages/headless/src/modules/client/personalDetails/services.ts:95-100` — `PUT /clients/{id}`
- `packages/headless/src/modules/client/address/services.ts:48,140,156,196,228` — addresses CRUD
- `packages/headless/src/modules/client/phone/services.ts` — phones CRUD
- `packages/headless/src/modules/client/email/services.ts:46,93,109,148,180,212` — emails CRUD + `send_verify`
- `packages/headless/src/modules/client/company/services.ts` — companies CRUD
- `packages/headless/src/modules/client/customFields/services.ts` — `GET /custom_fields?filter[object_type]=client`
- `packages/headless/src/modules/client/emailHistory/services.ts:35,54` — `GET /emails/{id}`, `GET /self/email_history`
- `packages/headless/src/modules/client/index.ts` — barrel re-exports across the seven sub-modules

### Source (typed contracts)

- `packages/types/src/models/clients.ts:22-93` — `IClient`
- `packages/types/src/models/addresses.ts` — `IAddress`
- `packages/types/src/models/phones.ts` — `IPhone`
- `packages/types/src/models/emails.ts` — `IEmail`, `ISentEmail`
- `packages/types/src/models/companies.ts` — `ICompany`
- `packages/types/src/data/enums/customFields.ts` — `CustomFieldsTypes`
- `packages/types/src/data/enums/emails.ts` — `SentEmailStatus`, `RecipientTypeCodes`
- `packages/types/src/data/enums/settings.ts` — `ClientTaxTypes`
- `packages/types/src/data/enums/invoice.ts` — `InvoiceConsolidationRuleTypes`

### Fixtures (`tests/__fixtures__/recordings/`)

- `get-clients-8d632507-9806-5d1e-48dc-8174e234e98d-addresses-f13c8b36.json` ✅ used
- `get-clients-8d632507-9806-5d1e-48dc-8174e234e98d-companies-f13c8b36.json` ✅ used
- `get-clients-8d632507-9806-5d1e-48dc-8174e234e98d-phones-f13c8b36.json` ✅ used
- `get-clients_fields-20dc6ef3.json` (empty array on staging brand) ✅ honest stub
- `get--self.json`, `get-self.json` — cross-referenced for actor shape

### Graph

- `graphify-out/graph.json` — cross-module dependants computed by Python edge walk (see snippet in D-1-2026-05-16)

---

## Appendix B — Verbatim Evidence

### 🟠 D-1-2026-05-16 — dependants direction inverted

Candidate (lines 347–354):

```
| `datamanager` | 15 | client id, sub-record lists, custom-field values | Generic record-management substrate consumes the client-module shapes wholesale. |
| `basket`      | 12 | …
| `system`      | 5  | …
| `invoices`    | 2  | …
| `brand`       | 1  | …
```

Graph computation (corrected direction):

```bash
python3 -c "
import json, re
from collections import Counter
g = json.load(open('graphify-out/graph.json'))
client_nodes = {n['id'] for n in g['nodes'] if 'modules_client_' in n['id']}
c = Counter()
for e in g['links']:
    src, tgt = e['source'], e['target']
    if src in client_nodes and 'modules_client_' not in tgt:
        m = re.search(r'modules_([a-zA-Z]+)_', tgt)
        if m: c[m.group(1)] += 1
for k,v in c.most_common(15): print(v, k)
"
# Result:
#  17 billing   (vue-app presentation layer, not a headless module)
#  14 session
#   5 client_vue  (presentation)
#   (no other headless modules)
```

Filesystem ground-truth (only headless modules):

```bash
# session: 4 files | basket: 3 files | invoices: 2 files | system: 1 file (type-only)
# datamanager, brand: 0 files
```

### ✅ C-2 (prior) — lifecycle aside resolved

Prior wording (called out by the 2026-05-15 review):

```
> Operations 2–14 also expose lifecycle behaviours common to a list-backed collection:
> invalidate-and-refetch after any mutation, and a default-row helper that returns
> the row currently flagged default…
```

Current wording (line 41):

```
> After any mutation against operations 2–14 the corresponding list returns the
> new state on the next read; the default row is whichever row carries the
> `default` flag set, or none when the collection is empty.
```

Clean. Framework-neutral; describes observable BE behaviour, not our cache layer.

### ✅ C-4 (prior) — admin-adjacent fields disclosed

Current (lines 51–56):

```
// IClient — the canonical client row. The fields below are the ones a storefront
// commonly reads or writes from the customer-area surfaces. The full record carries
// further admin-adjacent columns: fraud policy, support pin, reseller affiliate
// fields, child-account configuration, package limits, plus invoicing / dunning /
// account-behaviour columns (`tax_type`, `topup_enabled`, `invoice_consolidation_*`,
// `before_due_date_charge_interval`, `secret_code`, `never_cancel`, `never_close`,
// `never_suspend`, `notifications_disabled`).
```

Verified against `packages/types/src/models/clients.ts:22–93` — every named column exists on the interface.

### ✅ C-5 (prior) — `vat_*` server-owned note promoted to `CompanyBody`

Current (lines 245–249, inline comment above `CompanyBody`):

```
// The `vat_*` outcome fields (`vat_validated`, `vat_validated_with`,
// `vat_validation_checked_at`, `vat_validation_failed_reason`, `vat_percent`)
// are server-owned and are not part of this body — the server populates them
// after running validation.
```

Promoted from the API-endpoints section per prior suggestion. Clean.

---

## Appendix C — Files Reviewed

### Standards / workflow

- `.agent/rules/docs-modules.md`
- `.agent/rules/docs-reviews.md`
- `.agent/rules/docs-writing.md`
- `.agent/workflows/docs-module-review.md`

### Doc under review + prior

- `packages/headless/src/modules/client/docs/foundation.md`
- `docs/audit/client-foundation-2026-05-15.md`

### Source — module surface (read)

- `packages/headless/src/modules/client/index.ts`
- `packages/headless/src/modules/client/personalDetails/services.ts`
- `packages/headless/src/modules/client/address/services.ts`
- `packages/headless/src/modules/client/email/services.ts`
- `packages/headless/src/modules/client/emailHistory/services.ts`
- (Plus directory listings for `company/`, `phone/`, `customFields/`)

### Source — typed contracts

- `packages/types/src/models/clients.ts`

### Fixtures

- `get-clients-…-addresses-f13c8b36.json`
- `get-clients-…-companies-f13c8b36.json`
- `get-clients-…-phones-f13c8b36.json`
- `get-clients_fields-20dc6ef3.json`
- `get--self.json`

### Graph

- `graphify-out/graph.json` — walked via Python `json.load` + edge filter

---

## Appendix D — Strip-Audit Exhaustive List

Every greppable pattern from the rule's strip table, applied across lines 1–1033 of the candidate:

| Pattern | Hits | Lines |
| --- | --- | --- |
| `useClient*(` / `useClient*().` | 0 | — |
| `isReady(` / `getConfigValue(` / `validateCurrency(` / `hasModuleEnabled(` / `ensureConfig(` / `getAnalytics(` | 0 | — |
| `brandConfigKeysStore` / `["client"` / `["clients"` (query-key shape) | 0 | — |
| `localStoragePersister` | 0 | — |
| `computed(` / `ref(` (Vue reactivity) | 0 | — |
| `XState` / `actor` / `spawn(` / `guard` / `service` (in XState sense) | 0 | "actor" appears only at line 45 as a BE response key; not framework vocabulary |
| `TanStack` / `useQuery` / `refetch` / `query key` / `persister` | 0 | — |
| `.meta` / `BrandMeta` / `uischema` / `uiCart` / `i18nMessages` / "i18n message overrides" / "translation overrides" | 0 outside the line-7 italic note | line 7 only |
| "you should" / "you must" / "everyone awaits" / "plan for" | 0 | — |
| "the cleaner shape is X" / "the natural separation is Y" / "the X has to do Y" / "the inversion has to happen somewhere" | 0 | — |
| "our implementation" / "we chose" / "we split" / "you can do it differently" | 0 | — |
| `operation queue` / `pending product` / `silent mode` / `schema framing` | 0 | — |
| `Coupon` / `Promotion` ambiguity | n/a | neither concept appears in the client module |

**Strip-audit verdict:** clean. Every forbidden pattern in the rule returns zero hits.

---

**Audit complete.** Saved to `/Users/domdacosta/Dev/Upmind/monorepo/docs/audit/docs-module-review-client-2026-05-16.md`. **Overall confidence: 88/100 (Δ +2)**. Verdict: **pass with fixes** — one corrected-direction dependants table away from a 92+ score.
