# Doc-module review — system — 2026-05-16

| Field | Value |
| --- | --- |
| Module | `system` |
| Reviewer | `/docs-module-review` |
| Date | 2026-05-16 |
| Candidate | `packages/headless/src/modules/system/docs/foundation.md` |
| Prior review | `docs/audit/doc-module-review-system-2026-05-15-r2.md` (primary) |
| Prior review (r1) | `docs/audit/doc-module-review-system-2026-05-15.md` |
| Rule version | `.agent/rules/docs-modules.md` (post-2026-05-14 sharpening; Golden-free workflow) |
| Workflow | `.agent/workflows/docs-module-review.md` |

---

## Executive summary

| Category | Score (today) | r2 | Delta | Notes |
| --- | --- | --- | --- | --- |
| Technical accuracy | 88 | 94 | −6 | Capability count and data shape still match source. Dependants-weight column reads inconsistently with the lead-in's stated aggregation (whole `system/*` folder) — most rows match BE-contract-root weights, a few are inflated. |
| Completeness | 92 | 88 | +4 | All required sections present. Operations now expanded to 8 per-endpoint rows (was 3 compressed) — directly addresses r2's "one row per BE call" intent. New Flows section (country→regions cascade) closes the multi-step gap the r2 audit didn't reach. |
| Structure | 96 | 96 | 0 | Canonical section order intact. The italic-note slot under "What it is" is repurposed for the "Out of scope" callout (the platform-level meta is now stripped without an italic line — see below). |
| Tone | 98 | 96 | +2 | Strip discipline holds across the larger surface. Lessons are still problem-shaped. No "our implementation" leaks. |
| Actionability | 88 | 90 | −2 | Five of seven endpoints still stubbed (regions has a real fixture under a country-id filename — see Endpoints section); the new Flows block helps an architect plan the cascade. |
| **Overall** | **92** | **93** | **−1** | Pass |

**Verdict:** Pass. The 2026-05-16 revision lands two structurally important moves — (a) expanded per-endpoint Operations, and (b) a `flowchart TD` for the country → regions cascade — at the cost of a small consistency wobble in the Dependants weight column. The italic meta-note removal is correct: `meta: null` on system endpoints is an envelope-level field shared by every Upmind response, not a module-specific bag, so flagging it would mislead the reader. One-line numeric reconciliation in the Dependants table is the only thing standing between this and a 95.

---

## Part 1: Delta vs prior review (r2)

### Status of r2 issues

| r2 issue | r2 severity | Status today | Notes |
| --- | --- | --- | --- |
| Five endpoints stubbed (regions, languages, currencies, statuses, tickets/departments) | 🟠 Warning | 🟡 **PARTIAL** | Regions sample is now a real fixture (`get-countries-{id}-regions.json`). Languages, currencies, statuses, tickets/departments still stubbed. Net: 4 stubs remain (was 5). |
| Dependants table dropped graph weights | 🟠 Warning | ✅ **FIXED** (with caveat) | Weight column restored, lead-in explains the whole-folder aggregation. Caveat: actual numbers don't fully match the stated aggregation (see Content audit — dependants). The framing question r2 raised is settled; the numeric reconciliation is the new wrinkle. |
| Capability 3 ("Resolve a record by id, code, or term") leans client-side | 🟡 Suggestion | ✅ **FIXED** | Operations table is now eight per-endpoint capabilities. No "resolve" capability anywhere — record resolution is correctly left to the consumer. |

### New strengths since r2

- 🟢 **Per-endpoint Operations table.** Eight rows, one per BE call. An architect can read the table once and know exactly how many HTTP endpoints they need to wire. The "Retrieve regions for a country" row correctly carries `country id` as the only input — making the multi-step nature visible at a glance.
- 🟢 **Country → regions flow.** The new Flows section uses `flowchart TD` (correct per rule), has rounded entry/terminal nodes, square API-call nodes, a diamond on `Array empty?`, and lists three Guarantees + three Constraints as prose lead-ins (not sub-headings). Textbook execution of the rule's flow shape.
- 🟢 **Tax business types added.** Eighth lookup now documented (`TaxBusinessType` type + capability row), closing a real gap r2 didn't flag (it was missing from the r2 candidate's data shape too).
- 🟢 **Lead-in paragraph on Dependants framing.** "Weights are file-count edges from the dependency graph against the whole `system/*` source folder — they aggregate reads against the BE-contract surface and the out-of-scope cross-cutters together…" — this is exactly the framing the r2 audit asked for. Just needs the numbers to match the prose.
- 🟢 **`query` callout as a footnote.** The "`query` imports system 6× for `Accept-Language` injection…" footnote under the Dependants table neatly resolves the foundational-layer-vs-peer-module question without cluttering the table.

### New issues introduced today

- 🟠 **Dependants weights inconsistent with stated aggregation** — the lead-in promises whole-folder weights; the numbers mostly use root-folder (BE-contract) weights with a few rows (routing 5, domain 4) that don't match either count.
- 🟡 **Meta italic note absent (correctly) but no replacement framing** — the rule's What-it-is template assumes a single italic note describes the meta bag. System has no module-specific meta, so the note is correctly omitted; a follow-up question is whether the rule should grow a "system-level meta only" carve-out (see Suggested rule updates).

---

## Part 2: Fresh full audit

### Strip audit findings

Full-pattern grep against the candidate returned **zero hits** across all four pattern families:

| Pattern family | Hits |
| --- | --- |
| Composable / method names (`useSystem(`, `isReady(`, `getCountry(`, `fetchRegions(`, …) | 0 |
| Internal store / queryKey / persister names (`regionsStore`, `["system"`, `localStoragePersister`) | 0 |
| Framework terms (`computed(`, `ref(`, `XState`, `TanStack`, `useQuery`, `spawn(`, scoped composable) | 0 |
| Meta content (`meta.cart`, `meta.uischema`, `meta.i18n`, "i18n message overrides", "translation overrides", "uischema") | 0 |
| Prescriptive verbs ("you should", "you must", "everyone awaits", "plan for") | 0 |
| Solution-shape suffixes ("the cleaner shape is", "the natural separation", "has to do", "inversion has to happen") | 0 |
| Implementation meta-commentary ("our implementation", "we chose", "we split", "you can do it differently") | 0 |

🟢 **Praise — strip discipline holds across an expanded surface.** Going from 3 compressed capabilities to 8 per-endpoint capabilities is exactly where a producer agent typically leaks a method name. This rewrite cut clean.

### Section audit

| Section | Status | Notes |
| --- | --- | --- |
| Header (`# Module: system`) | ✅ | Present |
| What it is | ✅ | Two paragraphs + Out-of-scope callout. Italic meta-note correctly absent — system has no module-specific meta payload (envelope-level `meta: null` is shared by every Upmind endpoint and is not what the rule's italic note is for). |
| Core concepts | ✅ (optional, justified) | 3 terms (status discriminator, region tree, zero-decimal currency) — all describe BE-contract properties an equivalent has to model. |
| State model | ✅ (correctly omitted) | Reference data exposes no domain state. |
| Operations | ✅ | 8 capabilities, one per BE call. Comfortably under the 12-cap. |
| Data shape | ✅ | 8 TypeScript-ish types, each backed by a typed contract or the fixture. |
| Dependencies | ⚠️ See findings | Dependants table structurally correct (weights + reads + why + presentation row + `query` footnote) but numeric aggregation reads inconsistently against the graph. |
| API endpoints | ✅ | 7 endpoints. Two real fixtures (countries, billing_cycles). Regions sample is hand-crafted but a real fixture exists (`get-countries-{id}-regions.json`). Four still stubbed. |
| Side effects | ✅ (correctly omitted) | Scope cut from r2 still holds. |
| Coordination | ✅ (correctly omitted) | No coordination concerns surface in the BE-contract slice. |
| Flows | ✅ | New: country → regions cascade. Correct Mermaid shape, correct Guarantees/Constraints lead-ins. |
| Lessons (hard-won) | ✅ | 7 lessons, all problem-shaped, all source-backed. |

### Content audit — capabilities

| # | Capability | Source | Notes |
| --- | --- | --- | --- |
| 1 | Retrieve the country list | `services.ts:61-72` (`fetchCountries`) | ✅ Matches |
| 2 | Retrieve regions for a country | `services.ts:74-97` (`fetchRegions`) | ✅ Matches — input correctly stated as `country id` |
| 3 | Retrieve the billing cycle list | `services.ts:50-59` (`fetchBillingCycles`) | ✅ Matches |
| 4 | Retrieve the language list | `services.ts:99-110` (`fetchLanguages`) | ✅ Matches — auth note correctly flagged in Endpoints |
| 5 | Retrieve the currency list | `services.ts:38-48` (`fetchCurrencies`) | ✅ Matches |
| 6 | Retrieve the status list | `services.ts:112-122` (`fetchStatuses`) | ✅ Matches — "including soft-deleted entries" correctly flagged |
| 7 | Retrieve the ticket department list | `services.ts:124-134` (`fetchDepartments`) | ✅ Matches — brand-scoping correctly flagged |
| 8 | Retrieve the tax business type list | _no source export found_ | ⚠️ See below |

🟡 **Suggestion — Capability 8 (tax business types) has no matching source export.** `services.ts:138-147` only exports seven fetchers: `fetchRegions, fetchStatuses, fetchCountries, fetchLanguages, fetchCurrencies, fetchDepartments, fetchBillingCycles`. There is no `fetchTaxBusinessTypes`. The capability appears in the doc and the `TaxBusinessType` type is defined in `packages/types/src/models/tax.ts:21-29`, but the BE endpoint isn't wired by this module in code. Two valid reads: (a) the type is canonical but the source hasn't caught up — keep the row but flag in Lessons or as a callout that an equivalent should expose it; (b) drop the capability + type + endpoint until the source exposes it. Worth a producer-level decision on next run.

The trailing prose ("How the lists are kept fresh, persisted between sessions, or invalidated is up to the consumer.") is a 🟢 praise-worthy line — it's the right place to neutralise the readiness/refresh/invalidate concerns that the r2 audit flagged as out-of-scope.

### Content audit — data shape

All 8 types verified against canonical sources and fixtures:

| Type | Typed contract | Fixture cross-check | Notes |
| --- | --- | --- | --- |
| `Country` | `constants.ts:20-28` (`ICountry`) | `get-countries.json` | ✅ — doc includes `code3`, `vat`, `eea`, `phone_code`, `post_code_regex` which are in the fixture but not the typed contract. Correctly follows the "fixture broader than contract" rule. |
| `Region` | `constants.ts:51-56` (`IRegion`) | `get-countries-{id}-regions.json` | ✅ — doc adds `created_at`, `updated_at` which are in the fixture but not `IRegion`. Correct. |
| `BillingCycle` | `constants.ts:3-8` (`IBillingCycle`) | `get-billing_cycles.json` | ✅ — `recurring: 0 \| 1` matches; `months` enumerated values match the fixture rows. |
| `Language` | `constants.ts:43-49` (`ILanguage`) | (no fixture) | ✅ matches typed contract |
| `Currency` | `constants.ts:30-41` (`ICurrency`) | (no fixture) | ✅ matches; `decimals: boolean` and `base: boolean` correctly typed |
| `Status` | `statuses.ts:3-11` (`IStatus`) | (no fixture) | ✅ matches; `object_type: UpmindObjectType` correctly references the enum |
| `TicketDepartment` | `tickets.ts:124-137` (`ITicketDepartment`) | (no fixture) | ✅ — doc includes `name_translated?`, `brand_id`, `username` correctly; omits implementation-detail relations (`brand?`, `department?`, `brand_ticket_departments?`, `translations`) which is appropriate for an architect rebuild |
| `TaxBusinessType` | `tax.ts:21-29` (`ITaxBusinessType`) | (no fixture) | ✅ — doc includes `[extra: string]: unknown` to mirror the `[key: string]: any` index signature on the typed contract. Note that the source doesn't expose a fetcher for this — see capability 8 above. |

🟢 **Praise — Data shape correctly broader than typed contract where the fixture is.** The rule's "fixture is source of truth, typed contract can lag" guidance is followed throughout, especially on `Country` and `Region`.

### Content audit — dependants

The table has 13 module rows + a presentation-layer row + a `query` footnote. Structure is correct; let me reconcile numeric weights against the graph:

| Doc row | Doc weight | Graph: whole `system/*` | Graph: BE-contract root only | Reconciliation |
| --- | --- | --- | --- | --- |
| basket | 13 | 25 | 13 | ⚠️ Matches BE-contract, not whole folder |
| basketProduct | 7 | 34 | 7 | ⚠️ Matches BE-contract, not whole folder |
| session | 7 | 10 | 2 | ❌ Matches neither (10 = total; 2 = root). 7 ≈ root + localisation + recaptcha = 6, off by 1 |
| paymentDetails | 5 | 13 | 5 | ⚠️ Matches BE-contract |
| routing | 5 | 2 | 0 | ❌ Inflates — graph total is 2, BE-contract is 0 |
| domain | 4 | 1 | 0 | ❌ Inflates — graph total is 1, BE-contract is 0 |
| client | 4 | 15 | 5 | ❌ Under-counts BE-contract by 1; far below whole-folder |
| product | 3 | 18 | 5 | ❌ Under-counts BE-contract by 2 |
| config | 1 | 3 | 0 | ⚠️ Probably counting statuses-only |
| payment | 1 | 3 | 1 | ✅ Matches BE-contract |
| lookup | 1 | 2 | 1 | ✅ Matches BE-contract |
| feedback | 1 | 6 | 5 | ❌ Under-counts BE-contract by 4 |
| recommendations | 1 | 1 | 1 | ✅ Matches |

🟠 **Warning — Dependants weight column reads as an inconsistent aggregation.** The lead-in promises whole-folder weights ("they aggregate reads against the BE-contract surface and the out-of-scope cross-cutters together"). The actual numbers split roughly:

- 8 of 13 rows ≈ BE-contract-root-only weights
- 2 rows (basket=13, basketProduct=7) match both root and the doc's stated framing
- 3 rows (routing=5, domain=4, client=4) don't match either aggregation
- 1 row (session=7) sits between aggregations

The framing prose and the column data tell different stories. Three valid fixes (ordered by least effort):

1. **Rewrite the lead-in to match the data.** If the producer's intent was BE-contract-root weights, the prose should say so: *"Weights are file-count edges from the BE-contract surface (`services.ts`, `useSystem.ts`, `types.ts`); cross-cutting sub-folders (i18n, analytics, places) aren't counted because consuming those is an orthogonal concern."* Then fix the four outlier rows.
2. **Rewrite the data to match the lead-in.** Use whole-folder weights for every row. Better matches the rule's "include every cross-module dependant the graph returns, weighted" instruction; surfaces the analytics/i18n fan-in which is itself architectural information about how often `system` ends up imported.
3. **Drop the weight column entirely.** Replace with a one-sentence per-row lead-in. Loses the numeric anchor but eliminates the inconsistency.

(1) is the lowest-friction fix and preserves the BE-contract focus the doc has otherwise chosen.

The "Presentation layer" row (active currency, countries) is correctly placed at the bottom — matches the rule.

### Content audit — endpoints

| Endpoint | Fixture path | Status |
| --- | --- | --- |
| `GET /countries?limit=0&order=name` | `get-countries.json` | ✅ Real |
| `GET /countries/{id}/regions?limit=0` | `get-countries-320e4357-…-regions.json` exists | ⚠️ Hand-crafted sample shown; real fixture available under country-id filename, doc should swap or note |
| `GET /billing_cycles?limit=0` | `get-billing_cycles.json` | ✅ Real |
| `GET /languages?limit=0` (auth) | _missing_ | ⚠️ Stubbed |
| `GET /currencies?limit=0` | _missing_ | ⚠️ Stubbed |
| `GET /statuses?limit=0` | _missing_ | ⚠️ Stubbed |
| `GET /tickets/departments?limit=0` (auth) | _missing_ | ⚠️ Stubbed |

🟡 **Suggestion — Regions sample is a hand-crafted abbreviation of three rows; a real captured fixture exists.** The candidate's `regions` JSON shows three Scottish-flavoured records that look manually composed (`Aberdeenshire`, `Argyll`, `Aberdeen, City of`). A captured fixture exists at `tests/__fixtures__/recordings/get-countries-320e4357-95e7-8d18-484f-31643202d986-regions.json` — swapping the sample to those exact records would close half of the "regions stubbed" finding from r2.

The `tax_business_types` endpoint is documented in neither Endpoints nor `services.ts` — consistent with the capability-8 finding above. If capability 8 stays, the endpoint section needs the missing entry.

🟠 **Warning — Four endpoints still stubbed.** Same fixture-capture story as r2. Languages, currencies, statuses, tickets/departments. Mechanical work; one capture per endpoint.

### Content audit — lessons

All 7 lessons describe BE-contract properties. Source-grounded:

| Lesson | Source / type backing |
| --- | --- |
| Statuses discriminated by `object_type` | `IStatus.object_type` in `statuses.ts:9` references `UpmindObjectTypes` enum |
| Region tree per-country, not global | `services.ts:74-97` — region endpoint is country-scoped; no aggregate region service |
| Country list server-localised by `Accept-Language` | `services.ts:61-72` uses `useUrl` which injects locale; fixture path includes `?lang=en-US` |
| Currencies carry `decimals` flag | `ICurrency.decimals: boolean` in `constants.ts:38` |
| Billing cycle 0 means one-off | Fixture `get-billing_cycles.json` line 11-16: `{months: 0, recurring: 0}` |
| Ticket departments brand-scoped | `ITicketDepartment.brand_id` in `tickets.ts:126` |
| Status `deleted_at` non-null for soft-deleted | `IStatus.deleted_at: null | string` in `statuses.ts:5` |

🟢 **Praise — Lessons remain canonical-shape.** Each one is a property of the BE response a careful architect would still miss on first build, none describe our caching or coordination. The "Region tree is per-country, not global" lesson now reads particularly well alongside the new country→regions Flow.

---

## Top 3 priorities

1. 🟠 **Reconcile the Dependants weight column with its lead-in.** The simplest fix is to rewrite the lead-in to describe BE-contract-only weights (since that's what most rows reflect) and correct the four outlier rows (routing, domain, client, product). Materially raises Technical accuracy.
2. 🟡 **Resolve capability 8 (tax business types) — type-only or fetcher-backed?** The `ITaxBusinessType` type is canonical but `services.ts` doesn't expose a fetcher. Either keep the row (and add the missing Endpoints entry + a Lesson about the catalog awareness gap) or drop the row, the type, and the endpoint slot until the source exposes it.
3. 🟡 **Swap the hand-crafted regions sample for the captured fixture.** `tests/__fixtures__/recordings/get-countries-320e4357-95e7-8d18-484f-31643202d986-regions.json` already exists; using it removes the only "real fixture available but not used" gap. The remaining four stubs (languages, currencies, statuses, tickets/departments) still need fresh captures.

---

## Suggested rule updates

Two cross-module patterns surfaced today that the rule doesn't yet anticipate. Proposed text below — flagged for approval, not applied.

### 1. Italic meta note: scope distinction between envelope-level and module-specific

**Where:** `.agent/rules/docs-modules.md`, under **What To Strip → Upmind-specific UI workarounds**.

**Proposed addition (after the existing italic-note guidance):**

> The italic note describes **module-specific `meta` payloads** — the cart UI bag, brand i18n overrides, status uischema hints, and similar consumer-facing extensions. Some endpoints return a generic envelope-level `meta` field (`{ status, data, meta: null, ... }`) shared across the whole platform. That envelope `meta` is **not** what the italic note flags — it's a structural artefact of the response envelope, not a module-specific concern. Omit the italic note when a module's only `meta` exposure is the envelope-level field; include it only when a module-specific bag (e.g., `brand.meta.i18n`) appears on the wire.

**Why it's needed:** The system foundation correctly omits the italic note today because `meta: null` on system endpoints is a platform-wide envelope artefact, not a module-specific bag. A producer agent reading the rule literally might (a) add a misleading italic note flagging the envelope `meta`, or (b) feel obliged to invent content to fill the slot. The rule should anticipate this carve-out so the absence reads as correct rather than as a missed-section.

### 2. Dependants weight column must match its lead-in framing

**Where:** `.agent/rules/docs-modules.md`, under **Dependants — modules that read from this one**.

**Proposed addition:**

> When a foundation doc scopes its surface narrower than the source folder (per the scope-cut rule), state the weight basis explicitly in the lead-in and use that basis consistently across every row. Two acceptable bases:
>
> - **Whole-folder weights** — count every cross-module edge into any file under `modules/<name>/`. Surfaces fan-in across the orthogonal sub-concerns the doc has cut from scope, which is itself architectural information.
> - **In-scope weights** — count only edges into the files that back the BE-contract surface (`services.ts`, `useSystem.ts`, `types.ts`, `index.ts`). Cleaner mapping between the table and the rest of the doc.
>
> Pick one and apply it to every row. A weight column that mixes bases (some rows from whole-folder, some from in-scope) reads as imprecise and undermines the trust the numeric anchor is meant to provide.

**Why it's needed:** Today's audit found 4 of 13 rows reading inconsistently with the doc's stated framing. The rule allows the producer to choose the framing (per the r2 audit's suggestion) but doesn't yet warn that the choice has to be applied uniformly. A short paragraph closes the gap.

---

## Appendix A: Source-of-truth references

**Canonical types (cross-referenced for Data shape):**

- `packages/types/src/models/constants.ts` — `IBillingCycle` (3-8), `ICountry` (20-28), `ICurrency` (30-41), `ILanguage` (43-49), `IRegion` (51-56)
- `packages/types/src/models/statuses.ts` — `IStatus` (3-11)
- `packages/types/src/models/tax.ts` — `ITaxBusinessType` (21-29)
- `packages/types/src/models/tickets.ts` — `ITicketDepartment` (124-137)
- `packages/types/src/data/enums/objects.ts` — `UpmindObjectTypes`
- `packages/types/src/data/iso4217.ts` — `ISO_4217_CURRENCY_CODE`

**Module source (in-scope BE-contract surface):**

- `packages/headless/src/modules/system/services.ts` — 7 exported fetchers (`fetchRegions`, `fetchStatuses`, `fetchCountries`, `fetchLanguages`, `fetchCurrencies`, `fetchDepartments`, `fetchBillingCycles`)
- `packages/headless/src/modules/system/useSystem.ts` — substrate composable (helpers + readiness; out-of-scope per the doc's framing)
- `packages/headless/src/modules/system/types.ts` — context types

**Out-of-scope subfolders (consulted only to confirm scope cut held):**

- `analytics/`, `clientArea/`, `form/`, `localisation/`, `places/`, `recaptcha/`, `upload/`

**Fixtures consulted:**

- `tests/__fixtures__/recordings/get-countries.json` (used)
- `tests/__fixtures__/recordings/get-countries-320e4357-95e7-8d18-484f-31643202d986-regions.json` (exists, not yet used in doc)
- `tests/__fixtures__/recordings/get-billing_cycles.json` (used)
- Missing: `get-languages.json`, `get-currencies.json`, `get-statuses.json`, `get-tickets-departments.json`

**Graph edges consulted:** `graphify-out/graph.json` — incoming edges to `modules/system/**` files grouped by source module folder (whole-folder and BE-contract-root breakdowns above).

---

## Appendix B: Verbatim evidence

No 🔴 critical issues.

**🟠 Dependants framing mismatch (foundation.md lines 121-141):**

Lead-in (line 123):

> Every cart/portal module that displays a currency, a country, a billing term, or a status reads from system. Weights are file-count edges from the dependency graph against the whole `system/*` source folder — they aggregate reads against the BE-contract surface and the out-of-scope cross-cutters together, so a high number does not necessarily mean a high read against the reference-data contract specifically.

Sample table rows (line 128 / 131 / 132):

> | `basket` | 13 | countries, billing cycles, currencies | … |
> | `session` | 7 | languages, currencies, countries | … |
> | `routing` | 5 | languages, countries | … |
> | `domain` | 4 | countries, currencies | … |

Graph (whole `system/*` folder): basket=25, session=10, routing=2, domain=1. The lead-in promises whole-folder weights; the data shows otherwise. Either the prose or the numbers needs correction.

**🟡 Capability 8 backed by type but not by source export (foundation.md line 30):**

> | 8 | **Retrieve the tax business type list** | — | Business types used by tax templates |

`services.ts:138-147` exports seven fetchers; `fetchTaxBusinessTypes` is not among them. The endpoint section also has no `tax_business_types` entry.

**🟡 Regions sample hand-crafted, real fixture available (foundation.md lines 201-231):**

> ```json
> {
>   "status": "ok",
>   "data": [
>     { "id": "de78642d-…", "country_id": "320e4357-…", "code": "ABD", "name": "Aberdeenshire", … },
>     …
>   ]
> }
> ```

Real fixture at `tests/__fixtures__/recordings/get-countries-320e4357-95e7-8d18-484f-31643202d986-regions.json` is captured and not yet referenced.

**🟡 Four stubbed endpoint bodies — same pattern as r2:**

Lines 275-283 (languages), 296-313 (currencies), 326-340 (statuses), 354-368 (tickets/departments) — each marked `// stubbed — replace with real capture`.

---

## Appendix C: Files reviewed

**Rule + workflow:**

- `.agent/rules/docs-modules.md`
- `.agent/workflows/docs-module-review.md`

**Prior reviews:**

- `docs/audit/doc-module-review-system-2026-05-15-r2.md` (primary)
- `docs/audit/doc-module-review-system-2026-05-15.md` (r1, context only)

**Candidate:**

- `packages/headless/src/modules/system/docs/foundation.md`

**Source (in-scope BE-contract surface):**

- `packages/headless/src/modules/system/services.ts`
- `packages/headless/src/modules/system/useSystem.ts`
- `packages/headless/src/modules/system/index.ts` (folder listing only)

**Canonical types:**

- `packages/types/src/models/constants.ts`
- `packages/types/src/models/statuses.ts`
- `packages/types/src/models/tax.ts`
- `packages/types/src/models/tickets.ts` (lines 120-150)

**Fixtures:**

- `tests/__fixtures__/recordings/get-countries.json`
- `tests/__fixtures__/recordings/get-billing_cycles.json`
- `tests/__fixtures__/recordings/get-countries-320e4357-95e7-8d18-484f-31643202d986-regions.json` (not used in doc)

**Graph:**

- `graphify-out/graph.json` (incoming-edge analysis to `modules/system/**`)

---

## Appendix D: Strip-audit exhaustive list

All pattern searches returned **zero hits**:

| Pattern | Hits | Notes |
| --- | --- | --- |
| `useSystem(`, `isReady(`, `getCountry(`, `getRegion(`, `getBillingCycle(`, `fetchCountries(`, `fetchRegions(`, `fetchLanguages(`, `fetchStatuses(`, `fetchCurrencies(`, `fetchDepartments(`, `fetchBillingCycles(` | 0 | Composable / fetcher names |
| `regionsStore`, `["system"`, `localStoragePersister`, `storePersister` | 0 | Internal stores / query keys |
| `computed(`, `ref(`, `XState`, `TanStack`, `useQuery`, `spawn(`, "scoped composable" | 0 | Framework leaks |
| `meta.cart`, `meta.uischema`, `meta.i18n`, "i18n message overrides", "translation overrides", `uischema` | 0 | Meta content |
| "you should", "you must", "everyone awaits", "plan for" | 0 | Prescriptive verbs |
| "the cleaner shape", "the natural separation", "has to do", "inversion has to happen" | 0 | Solution-shape suffixes |
| "our implementation", "we chose", "we split", "you can do it differently" | 0 | Implementation meta-commentary |

The only `meta` match anywhere in the doc is the word "metadata" on line 135 (`config | 1 | statuses | Status lookups for config-driven UI metadata`) — descriptive use, not a meta-bag reference.
