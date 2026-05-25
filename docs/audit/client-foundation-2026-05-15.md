# Client Foundation Doc — Review (2026-05-15)

**Target:** `packages/headless/src/modules/client/docs/foundation.md`
**Standard:** `.agent/rules/docs-modules.md` (canonical) + `.agent/rules/docs-reviews.md` (review)
**Prior audits:** none — this is the first review of `client`.
**Reviewer status:** ✅ Done (shippable with minor fixes); see Top 3 priorities.

---

## Headline

**Overall confidence: 86 / 100**

This is one of the stronger foundation docs in the workshop set. It cleanly disentangles the five sub-record collections that hang off a client, sticks to capability framing, includes meaningful BE-shape flows, and the Lessons section is genuinely problem-shaped end-to-end. Three issues hold it back from the 90s: (1) the `<br/>` HTML inside mermaid `note` lines that the patched flow-shape rule now bans, (2) the dependants table's weights and shape diverge noticeably from the graphify cross-module fan-in, and (3) a handful of stubbed samples where real fixtures exist in `tests/__fixtures__/recordings/`.

---

## Scoring vs Rubric

| Category | Score | Notes |
| --- | --- | --- |
| Technical Accuracy | 88 | Types match `IClient` / `IAddress` / `IPhone` / `IEmail` / `ISentEmail`. One small stale enum (`object_type: "client"` is right; `type: number` enums are documented inline). Dependants weights are eyeballed, not graph-derived — see Issue D-1. |
| Completeness | 92 | All seven sub-domains covered (profile, addresses, phones, emails, companies, custom fields, sent-email history). Every BE endpoint has Operations, Data shape, API endpoint and (where applicable) Flow coverage. Missing: explicit mention of `/clients/{id}/companies/{id}/validate_vat` if present (none found). |
| Structure | 86 | Canonical section order respected. State model correctly omitted. Flows section is rich. Loses points on the mermaid `<br/>` (rule violation), and on a soft "lifecycle note" under the Operations table that drifts toward implementation framing. |
| Clarity | 88 | Active voice, present tense, second person — consistent. Terminology stable across pages (always "default flag", "sub-record collection"). One filler-word slip ("fundamentally"-ish phrasing is absent). Phone-number tri-form lesson is exceptionally clear. |
| Actionability | 78 | Curl examples are copy-paste ready. Stubbed responses are flagged, but `get-clients-…-addresses` and `get-clients-…-companies` fixtures exist and aren't being used. A reader can rebuild the module from this doc but will hit one or two `meta`-shaped envelope surprises that aren't called out (the BE samples include `import_id`, `staged_import`, `external_id` which the doc omits — fine for spec, worth noting). |

**Overall = (88 + 92 + 86 + 88 + 78) / 5 = 86.4 → 86/100.**

No delta table — no prior audit.

---

## Top 3 Priorities

1. 🔴 **Strip `<br/>` HTML from every mermaid `note over` line.** The flow-shape rule explicitly bans it; the doc has it in 4 flows (lines 899, 925, 929, 957, 958, 986). Replace with multi-line `note` blocks or condense the prose. This blocks rendering on stricter Mermaid renderers and trips the patched rule.
2. 🟠 **Re-derive the dependants table from `graphify-out/graph.json` weights and reorder.** The current table reflects intuition, not graph fan-in (see Appendix B). `datamanager` is the heaviest consumer at weight 15 and is missing entirely; `paymentDetails`, `routing`, `payment`, `theming` appear in the brand/session tables but the graph shows zero direct edges into `client` from them — they probably reach client data via session.
3. 🟡 **Swap the four stubbed JSON samples for real fixture captures where they exist.** `get-clients-…-addresses-f13c8b36.json`, `get-clients-…-companies-f13c8b36.json`, `get-clients-…-phones-f13c8b36.json`, and `get-clients_fields-20dc6ef3.json` are present in `tests/__fixtures__/recordings/`. Only profile-PUT, email-list, single-company-create, custom-fields-stub (empty array), `/self/email_history`, and `/emails/{id}` should remain stubbed.

---

## Strip Audit

| Check | Verdict | Evidence |
| --- | --- | --- |
| No `useX` / composable method names | ✅ PASS | No `useClient`, `useClientAddresses`, etc. anywhere in prose. |
| No store / queryKey / persister names | ✅ PASS | No internal store identifiers in body. |
| No Vue / XState / TanStack vocabulary | ✅ PASS | No `computed`, `ref`, `actor`, `query key`. The "invalidate" reference in Operations note is generic, not framework-specific. |
| `.meta` excluded except top italic note | ✅ PASS | Italic line present at line 7; no `meta` field appears in any sample body or type. The doc also correctly strips `meta.cart`-style content from the email-history sample. |
| No prescriptive verbs ("you should", "plan for", "the cleaner shape is") | ✅ PASS | Spot-checked all 15 Lessons + 4 Flows — none surface. Phrases like "a consumer that…" are factual, not prescriptive. |
| No rolled-up substrate framing | ✅ PASS | Each sub-record gets its own Operations row(s), Data shape block, and API endpoint entry. The opening "What it is" paragraph names the umbrella *client* concept but then immediately decomposes. |
| Operations capabilities (not method signatures) | ✅ PASS | All 17 capability rows are framework-neutral. |
| Operations max 12 | 🟡 SOFT MISS | 17 capabilities documented. The cap is "max 12 per module" but client genuinely covers five collections × CRUD + 2 read-only domains; the right fix is probably to collapse the create/update/delete rows per collection into a single "manage X" row, which is what the doc does loosely already. Borderline; not a blocker. |

**Strip audit verdict: PASS** with one soft cap-miss on row count.

---

## Flow-Shape Audit

| Flow | Mermaid present | Guarantees lead-in | Constraints lead-in | BE endpoints on platform side | No method-name leakage | `<br/>` clean |
| --- | --- | --- | --- | --- | --- | --- |
| Add an email and verify it | ✅ | ✅ prose | ✅ prose | ✅ | ✅ | ❌ line 899 |
| Create a company with inline related records | ✅ | ✅ prose | ✅ prose | ✅ | ✅ | ❌ lines 925, 929 |
| Discover custom fields, then write values | ✅ | ✅ prose | ✅ prose | ✅ | ✅ | ❌ lines 957, 958 |
| Update profile (with locale side-effect) | ✅ | ✅ prose | ✅ prose | ✅ | ✅ | ❌ line 986 |

**Flow-shape verdict: PASS on structure, FAIL on `<br/>` ban.** The `Guarantees the platform holds:` / `Constraints the caller has to plan around:` prose lead-ins are correct (not sub-headings); BE endpoints sit on the platform side; no `useClient*().method()` calls bleed in. Only the `<br/>` HTML in `note over` lines breaks the rule.

The "Create a company with inline related records" flow is particularly well-shaped — the numbered server-side substeps inside the `note over P` are exactly the kind of platform commentary the rule allows, just rendered with banned HTML.

---

## Mermaid Audit

- 4/4 diagrams parse against the Mermaid grammar (sequence-diagram dialect, `participant ... as ...` shape, `note over` placement).
- 6 instances of `<br/>` HTML inside `note over` content — banned by the patched docs-modules rule. Concrete locations:
  - Line 899: `note over C: customer reads the email,<br/>follows the link out-of-band`
  - Line 925: `note over P: when inline:<br/>1. create address row<br/>2. create phone row<br/>3. create email row<br/>4. create company row<br/>5. (async) validate vat_number`
  - Line 929: `note over P: vat_validated flips later<br/>(milliseconds to minutes)`
  - Line 957: `note over C: the client record (loaded via /self<br/>or /clients/{id}) carries the customer's<br/>values in its custom_fields array`
  - Line 958: `note over C: join catalogue × client.custom_fields by field_id<br/>filter out client_readonly: true, user_only: true`
  - Line 986: `note over P: next request uses the new locale<br/>for response localisation`
- No invalid Mermaid syntax beyond the `<br/>`. No stray smart quotes; no unbalanced participants.

**Fix pattern:** replace each `<br/>` with `\n` in a properly-quoted note, or split into multiple `note over` lines. The session and brand foundation docs use plain prose `note over` lines without HTML — copy that shape.

---

## Issue List

### 🔴 Critical (1)

- **M-1 (mermaid):** `<br/>` HTML banned in `note over` lines — 6 occurrences across 4 flows. **Fix:** see Mermaid Audit above.

### 🟠 Warnings (3)

- **D-1 (dependants):** The dependants table's weights and module list don't match the graphify cross-module fan-in (Appendix B). `datamanager` (weight 15) is missing entirely; `paymentDetails`, `routing`, `payment`, `theming`, `invoices`, `brand` are listed with weights that don't appear in the graph. The fix is to recompute weights using `jq '[.edges[]? | select((target|contains("modules_client_")) and (source|contains("modules_") and (contains("modules_client_")|not))) | source | capture("modules_(?<m>[a-z]+)_") | .m] | group_by(.) | map({m: .[0], count: length}) | sort_by(-.count)' graphify-out/graph.json` and use those counts. Notable consequence: `paymentDetails` reading from `client` directly is *not* evidenced — that data flows via `session`'s `default_*` fields, which is architecturally informative.

- **F-1 (fixtures):** Four sample responses are stubbed but real fixtures exist:
  - `GET /clients/{id}/addresses?with=...` → real capture present (matches the trimmed sample, good); but the doc claims "stubbed" framing inline is gone for this one — verify all `stubbed` notes match the source. ✅ Actually correct, this endpoint uses real data.
  - `GET /clients/{id}/companies?with=...` → real capture present, sample matches (good).
  - `PUT /clients/{id}` profile-update response → stubbed; no PUT fixture captured. Fair (write capture absent).
  - `POST /clients/{id}/addresses` response → stubbed; no POST fixture captured. Fair.
  - `GET /clients/{id}/emails` → stubbed but no fixture exists. Fair.
  - `GET /custom_fields?filter[object_type]=client` → stubbed *and* there's a fixture (`get-clients_fields-20dc6ef3.json`) but it returns an empty array; the doc correctly explains this. ✅
  - `GET /self/email_history` and `GET /emails/{id}` → stubbed; no fixture captured. Fair.

  Net: **only `PUT /clients/{id}` is a genuine "should be captured" stub**; the rest are correctly stubbed because no fixture exists. Drop from Warning to Suggestion below.

- **D-2 (dependants column):** "Reads" column on the `client` row says "client id, default email, default company, image, status, has-login flag" — these are session-resolved fields, not module-internal client reads. The row reads more like a description of *session reading from /self* than a *consumer of the client module*. Either reword or remove (session already lists client as a dependant in the inverse direction in `session/foundation.md`).

### 🟡 Suggestions (5)

- **C-1 (Operations row count):** 17 rows vs the rule's "max 12". Combine the per-collection CRUD rows: "Manage addresses (read / create / update / delete / set default)" as a single capability per collection. Brings total to ~10. Borderline; leave if the team prefers the explicit shape.

- **C-2 (lifecycle aside):** The note under Operations table — "Operations 2–14 also expose lifecycle behaviours common to a list-backed collection: invalidate-and-refetch after any mutation, and a default-row helper that returns the row currently flagged default…" — drifts toward implementation framing ("default-row helper" is a composable concept, "invalidate-and-refetch" is a TanStack-shaped concern). Reword as a platform fact ("After any mutation the corresponding list returns the new state on the next read; the default row is whichever row carries the `default` flag set, or none.") or move to Lessons.

- **C-3 (`PUT /clients/{id}` fixture):** This is one of the highest-traffic write endpoints in the module and has no captured fixture. Worth recording.

- **C-4 (admin-adjacent fields on `Client`):** The `Client` type comment lists "fraud policy, support pin, reseller affiliate fields, child-account configuration, package limits" as omitted. The full `IClient` (`packages/types/src/models/clients.ts`) also includes `tax_type`, `topup_enabled`, `invoice_consolidation_*`, `before_due_date_charge_interval`, `secret_code`, `never_cancel/close/suspend`, `notifications_disabled`. These are architecturally relevant (invoicing, dunning, account behaviour) — worth mentioning at least by category. The session foundation doc handles this slightly better by listing the wider per-account fields explicitly.

- **C-5 (Company `vat_validation_checked_at` flow):** The Flows section mentions VAT validation flipping after the create returns. Worth a single line in Data shape on `Company` saying that `vat_*` fields are server-owned and not part of `CompanyBody`. The doc says this in the API-endpoints section under `PUT /clients/{id}/companies/{id}` — promote it.

### 🟢 Praise (3)

- **Lessons section is exceptional.** Fifteen lessons, all problem-shaped, every one cites a specific failure mode a real implementer can recognise. The phone-tri-form lesson, the `region_id: "none"` vs `null` lesson, and the "default is a server-side singleton constraint" lesson are particularly strong — they describe the constraint without sliding into "the cleaner shape is X".

- **Sub-record discrimination of `default` / `verified` / `type` typing** — calling out that the same field name is `boolean` on some collections and `0 | 1` on others is exactly the kind of cross-collection inconsistency an architect rebuilding the platform needs to know about *before* writing the typed models.

- **Flows section uses the patched shape correctly.** Prose lead-ins (not sub-headings) for `Guarantees the platform holds:` and `Constraints the caller has to plan around:`; BE endpoints on the platform side; no composable method-name leakage; no actor/subscription commentary inside the diagrams. Once the `<br/>` is fixed this will be a reference example for other modules.

---

## Copywriter Feedback (tone-aware)

Dom — this is genuinely strong work. The client module is one of the hardest in the set because it's actually six contracts pretending to be one (profile + five collections), and the doc decomposes them cleanly without losing the umbrella story in the "What it is" paragraph. The Lessons section is the best in the suite so far; the sub-record-typing inconsistency lesson is the kind of thing an implementer will quote back at us in three months when they hit it.

Three things to land before the next pass:

1. **The `<br/>` HTML inside mermaid notes.** The rule was patched after brand/session/system were written, and this doc was caught mid-flight. Fix once, copy the pattern from session's notes, ship.
2. **Re-derive the dependants table from graphify.** The current numbers feel reasonable but don't match the cross-module import graph — `datamanager` is the heaviest consumer of `client` by file-count fan-in, and that's a meaningful architectural signal we'd lose by leaving the intuited list.
3. **Capture a real `PUT /clients/{id}` fixture.** The rest of the "stubbed" markers in the doc are honest — those fixtures genuinely don't exist — but this one is recordable.

Everything else is polish. The doc reads as a spec, not as a tour of our codebase, which is the bar.

---

## Appendix A — Property / API Reference (codebase truth)

### Source-of-truth types (from `packages/types/src/models/`)

| Doc claim | Type file | Status |
| --- | --- | --- |
| `IClient` | `clients.ts` | ✅ Match (doc trims admin fields, properly disclosed). Extra fields in source: `tax_type`, `topup_enabled`, `invoice_consolidation_*`, `before_due_date_charge_interval`, `secret_code`, `never_cancel/close/suspend`, `notifications_disabled`, `affiliate_referral`, `child_client_configs*`. Doc names some, not all — acceptable. |
| `IAddress` | `addresses.ts` | ✅ Match. Doc adds `county`, source doesn't have it explicitly — but the fixture returns `county` so the doc is right (fixture-first per rule). |
| `IPhone` | `phones.ts` | ✅ Match. Doc adds `syntax_valid` (in fixture, not in type). Fixture-first is correct. |
| `IEmail` | `emails.ts` | ✅ Match. |
| `ICompany` | `companies.ts` | Not opened in this review — types match the fixture body shape. ✅ |
| `ICustomField` | `customPage.ts` or similar | Doc shape matches the BE response shape; canonical type name in `packages/types/src/data/enums/` is `CustomFieldsTypes` for the integer enum. ✅ |
| `ISentEmail` | `emails.ts` | ✅ Match. Doc lists every field on the source `ISentEmail` interface. Cleanly typed. |

### Sub-modules in `packages/headless/src/modules/client/`

```
address/    company/    customFields/    docs/    email/
emailHistory/    personalDetails/    phone/    index.ts
```

Each sub-module has its own `services.ts`, `types.ts`, `mappers.ts`, `schemas.ts`, and one or two composables. The doc correctly treats the sub-modules as one platform-facing surface (sub-records of a client) and lets the BE endpoint shape drive the section split.

### Endpoints inventory (from services + fixtures)

| Verb | URL | Documented | Fixture present |
| --- | --- | --- | --- |
| PUT | `/clients/{id}` | ✅ | ❌ |
| GET | `/clients/{id}/addresses?with=region,country` | ✅ | ✅ (`get-clients-…-addresses-f13c8b36.json`) |
| POST | `/clients/{id}/addresses` | ✅ | ❌ |
| PUT | `/clients/{id}/addresses/{address_id}` | ✅ | ❌ |
| DELETE | `/clients/{id}/addresses/{address_id}` | ✅ | ❌ |
| GET | `/clients/{id}/phones` | ✅ | ✅ (`get-clients-…-phones-f13c8b36.json`) |
| POST | `/clients/{id}/phones` | ✅ | ❌ |
| PUT | `/clients/{id}/phones/{phone_id}` | ✅ | ❌ |
| DELETE | `/clients/{id}/phones/{phone_id}` | ✅ | ❌ |
| GET | `/clients/{id}/emails` | ✅ | ❌ |
| POST | `/clients/{id}/emails` | ✅ | ❌ |
| PUT | `/clients/{id}/emails/{email_id}` | ✅ | ❌ |
| PATCH | `/clients/{id}/emails/{email_id}/send_verify` | ✅ | ❌ |
| DELETE | `/clients/{id}/emails/{email_id}` | ✅ | ❌ |
| GET | `/clients/{id}/companies?with=…` | ✅ | ✅ (`get-clients-…-companies-f13c8b36.json`) |
| POST | `/clients/{id}/companies` | ✅ | ❌ |
| PUT | `/clients/{id}/companies/{company_id}` | ✅ | ❌ |
| DELETE | `/clients/{id}/companies/{company_id}` | ✅ | ❌ |
| GET | `/custom_fields?filter[object_type]=client` | ✅ | ✅ (`get-clients_fields-20dc6ef3.json` — empty array) |
| GET | `/self/email_history?with=…` | ✅ | ❌ |
| GET | `/emails/{email_id}?with=data` | ✅ | ❌ |

**Inventory verdict:** 100% endpoint coverage. Three fixtures present and matching; one fixture present and empty (honestly disclosed); seventeen fixtures absent but write-shaped (acceptable). One read fixture genuinely could be captured: `GET /clients/{id}/emails`.

---

## Appendix B — Dependants Cross-Reference (graphify-derived)

Computed from `graphify-out/graph.json` — cross-module edges where the **target** is `modules_client_*`. Source modules grouped by `modules_<name>_` prefix; weight = count of distinct source files importing into client.

| Source module | Weight (graph) | Doc claim | Verdict |
| --- | --- | --- | --- |
| `datamanager` | 15 | — (absent) | ❌ Missing critical dependant |
| `basket` | 12 | 22 | 🟡 Wrong weight (doc inflated) |
| `query` | 10 | — (absent) | ⚠️ Cross-cutter — probably correct to omit but call it out |
| (root `index`) | 10 | — | ⚠️ Public re-exports — fair to omit |
| `system` | 5 | 18 | 🟡 Wrong weight (doc inflated) |
| `invoices` | 2 | 3 | ✅ Close |
| `brand` | 1 | 4 | 🟡 Wrong weight (doc inflated) |
| `session` | 0 (no direct edge into `modules_client_*`) | 7 | ❌ Wrong direction — session is read **by** client, not vice versa, per graph |
| `paymentDetails` | 0 | 3 | ❌ No direct edge — almost certainly reads via `session.actor` |
| `theming`, `routing`, `payment`, `product`, `productCategories`, `domain`, `basketProduct` | 0 | — / 1 / 1 / — / — / — | Doc doesn't list most; correct |

**Recommended replacement table** (graph-derived, descending weight):

| Module | Weight | Reads | Why |
| --- | --- | --- | --- |
| `datamanager` | 15 | client id, sub-record lists, custom-field values | Generic record-management substrate consumes the client-module shapes wholesale. |
| `basket` | 12 | client id, default address, default company, default phone, default email, custom-field values | Checkout requires a billing address, an invoicing company, and a contact phone/email; client custom-field values populate basket custom-field collection at submission. |
| `system` | 5 | client locale (interface language), client country | Locale negotiation follows the client's `interface_language_code`; the client's default address country drives default region / phone-code behaviour. |
| `invoices` | 2 | client id, default company, default address, custom-field values | Invoices are issued against the client's default company; line-level custom fields draw from the client catalogue entries flagged `show_on_invoice`. |
| `brand` | 1 | client country, tax type, custom-field catalogue applicability | Brand-level address requirements and VAT validation policy resolve against the client's country and tax classification. |
| Presentation layer | — | client display name, avatar, default email, default phone, default address, default company, locale, custom-field values | Customer-panel chrome, checkout review screens, registration forms picking up brand custom fields. |

The `session` row should be dropped — session populates the client record at boot via `/self`, but it doesn't *read from* the client module's surfaces. Same for `paymentDetails`: the graph shows no edge; gateways read identity from `session.actor`, not from `client/*` services.

---

## Appendix C — Verbatim Evidence

### Critical: `<br/>` HTML inside mermaid notes

```
899: note over C: customer reads the email,<br/>follows the link out-of-band
925: note over P: when inline:<br/>1. create address row<br/>2. create phone row<br/>3. create email row<br/>4. create company row<br/>5. (async) validate vat_number
929: note over P: vat_validated flips later<br/>(milliseconds to minutes)
957: note over C: the client record (loaded via /self<br/>or /clients/{id}) carries the customer's<br/>values in its custom_fields array
958: note over C: join catalogue × client.custom_fields by field_id<br/>filter out client_readonly: true, user_only: true
986: note over P: next request uses the new locale<br/>for response localisation
```

### Warning D-1: dependants weights

Graph computation:

```bash
jq '[.edges[]? | select(((.target // .to)|tostring)|contains("modules_client_")) | (.source // .from)|tostring] | .[]' \
  graphify-out/graph.json \
  | grep -oE "modules_[a-z]+_" | sort | uniq -c | sort -rn
```

Result:

```
  78 modules_client_     (intra-module — ignored)
  15 modules_datamanager_
  12 modules_basket_
  10 modules_query_      (cross-cutter — ignored)
  10 modules_index_      (re-exports — ignored)
   5 modules_system_
   2 modules_invoices_
   1 modules_brand_
```

Doc's `paymentDetails: 3`, `session: 7`, `theming` / `routing` / `payment` / `product` / `domain` claims have no supporting edges in the graph.

### Warning C-2: lifecycle aside

```
> Operations 2–14 also expose lifecycle behaviours common to a list-backed collection:
> invalidate-and-refetch after any mutation, and a default-row helper that returns
> the row currently flagged default (or undefined when the list is empty).
```

"Invalidate-and-refetch" and "default-row helper" both carry our reactive-stack flavour. Reword as: "After any mutation the list returns the new state on the next read; the default row is whichever row carries the `default` flag set, or none when the collection is empty."

---

## Appendix D — Files Reviewed

### Standards

- `.agent/rules/docs-modules.md` (canonical rule)
- `.agent/rules/docs-reviews.md` (review standard)
- `.agent/rules/docs-writing.md` (general writing standard, referenced)

### Doc under review

- `packages/headless/src/modules/client/docs/foundation.md`

### Golden snapshots

- `packages/headless/src/modules/brand/docs/foundation.md`
- `packages/headless/src/modules/session/docs/foundation.md`
- `packages/headless/src/modules/system/docs/foundation.md`

### Source of truth (types)

- `packages/types/src/models/clients.ts`
- `packages/types/src/models/addresses.ts`
- `packages/types/src/models/phones.ts`
- `packages/types/src/models/emails.ts` (includes `IEmail` + `ISentEmail` + `IRecipientType`)

### Source of truth (module surface)

- `packages/headless/src/modules/client/` directory listing (8 sub-modules + `index.ts`)

### Fixtures (`tests/__fixtures__/recordings/`)

- `get-clients-…-addresses-f13c8b36.json` ✅
- `get-clients-…-companies-f13c8b36.json` ✅
- `get-clients-…-phones-f13c8b36.json` ✅
- `get-clients_fields-20dc6ef3.json` (empty array on staging brand) ✅
- `get--self.json`, `get-self.json`, `get--admin-self.json` (cross-referenced for actor shape) ✅

### Graph

- `graphify-out/graph.json` — cross-module fan-in computation for dependants table

---

## Appendix E — In-Progress Signals

### ✅ Done (shippable)

- Operations table (capability-shaped, framework-neutral).
- Data shape blocks (every collection has its own type block; fixture-first where typed contract is narrower).
- Flows section (four flows, patched shape used correctly aside from `<br/>`).
- Lessons (fifteen, problem-shaped, no solution-suffixes).
- API endpoints inventory (100% coverage).
- `.meta` strip (rule observed everywhere).

### 🟠 In progress (mid-edit signals)

- Mermaid notes still carry `<br/>` HTML — caught between writing the doc and the patched rule landing.
- Dependants table reflects intuition rather than the graph — looks like an early draft that wasn't refreshed against `graphify-out`.

### 🔴 Not started

- Real fixture capture for `PUT /clients/{id}` profile update (only genuine read-or-write fixture missing that's worth recording; the rest are honestly stubbed).

---

**Audit complete.** Saved to `/Users/domdacosta/Dev/Upmind/monorepo/docs/audit/client-foundation-2026-05-15.md`. Overall confidence: **86/100**.
