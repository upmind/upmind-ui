# Doc-module review — system — 2026-05-15 (r2)

| Field | Value |
| --- | --- |
| Module | `system` |
| Reviewer | `/doc-module-review` |
| Date | 2026-05-15 (revision 2) |
| Candidate | `packages/headless/src/modules/system/docs/foundation.md` |
| Golden | _none — no archived snapshot exists for system_ |
| Prior review | `docs/audit/doc-module-review-system-2026-05-15.md` (r1, against the pre-reframe candidate) |
| Rule version | `.agent/rules/docs-modules.md` (post 2026-05-14 sharpening pass) |
| Producer skill version | `.agent/workflows/doc-module.md` (post 2026-05-15 foundation.md rename) |

---

## Executive summary

| Category | Score (r2) | r1 | Delta | Notes |
| --- | --- | --- | --- | --- |
| Technical accuracy | 94 | 92 | +2 | Smaller surface to verify; types still match fixture + canonical sources; 5 of 7 endpoints stubbed (was 8 of 10). |
| Completeness | 88 | 86 | +2 | All required sections present within the declared scope. Lifecycle deliberately dropped — see scope-vs-rule note below. |
| Structure | 96 | 94 | +2 | Scope-cut italic note in What it is is a clean way to delineate the contract from the surrounding cross-cutters. |
| Tone | 96 | 95 | +1 | No awkward note-below-table about demoted capabilities; the trim eliminated the friction the r1 audit flagged. |
| Actionability | 90 | 88 | +2 | Sharper data shape, no in-band "auxiliaries" caveat. Stubbed endpoints still the main constraint. |
| **Overall** | **93** | **91** | **+2** | Pass |

**Verdict:** Pass. The rewrite resolves both 🟠 warnings from r1 (recaptcha+upload demotion; 8 stubbed endpoints) — the first by removing those modules from scope entirely, the second by simply being a smaller surface so the ratio of stubs is the only thing that improved. Capturing the remaining fixtures and considering one wording tweak on capability 3 are the only outstanding items.

---

## Part 1: Delta vs prior review (r1)

### Status of r1 issues

| r1 issue | r1 severity | Status in r2 | Notes |
| --- | --- | --- | --- |
| Recaptcha + Upload demoted out of Operations table | 🟠 Warning | ✅ **FIXED** — by reframe | Both modules now explicitly out of scope; documented in the "Out of scope" callout under What it is rather than as awkward demotions in the Operations table. |
| Eight stubbed endpoint bodies | 🟠 Warning | 🟡 **PARTIAL** | Three upload endpoints removed with scope cut. Five stubs remain (regions, languages, currencies, statuses, tickets/departments). Same root cause: missing fixture captures. |
| `Image` type abbreviated | 🟡 Suggestion | ✅ **FIXED** — by reframe | Image type removed entirely with upload scope cut. |
| `feedback`/`recommendations` are excluded modules but appear in dependants | 🟡 Suggestion | ✅ **FIXED** | Dependants table now lists only modules that consume the BE reference-data contract. Excluded modules dropped. |
| Lesson 10 borderline prescription ("Re-attribution requires explicit cookie removal first") | 🟡 Suggestion | ✅ **FIXED** — by reframe | Tracking-cookie lesson removed with attribution scope cut. |

### New strengths since r1

- 🟢 **Scope clarity.** The "Out of scope for this doc" callout under What it is explicitly delineates the BE-contract surface from the surrounding cross-cutters (i18n, analytics, address autocomplete, captcha, file upload). A reader knows immediately what this doc claims and what it doesn't.
- 🟢 **Lesson focus.** Every lesson now describes a property of the BE data itself (discriminators, soft-deletes, server-localisation, zero-decimal currency, brand-scoping) rather than a property of how we cache or coordinate it. That's the canonical "lessons describe what is, not what we did" shape the rule asks for.
- 🟢 **No demoted capabilities.** The Operations table now matches the doc's claimed scope. The r1 awkwardness around recaptcha+upload notes is gone.

### New issues introduced in r2

- 🟠 **Dependants table dropped weights and trimmed rows** — see fresh audit below.
- 🟡 **Capability 3 wording leans client-side** — see fresh audit below.

---

## Part 2: Fresh full audit

### Strip audit findings

Full-pattern grep against the candidate returned **zero hits**. Same patterns as r1; same result.

🟢 **Praise — Strip discipline maintained through the rewrite.** A reframe of this scale often introduces inadvertent leaks (e.g., describing what was cut in terms of how it was implemented). This rewrite cut cleanly.

### Section audit

| Section | Status | Notes |
| --- | --- | --- |
| Header (`# Module: system`) | ✅ | Present |
| What it is | ✅ | Two paragraphs + `.meta` italic + scope-cut italic — clearer delineation than the r1 single-paragraph framing |
| Core concepts | ✅ (optional, justified) | 4 terms, all about BE-contract properties (discriminator, tree shape, zero-decimal flag) |
| State model | ✅ (correctly omitted) | Reference data has no domain state |
| Operations | ✅ | 3 capabilities. Smaller surface than the rule's typical max-12 — appropriate for a scoped contract |
| Data shape | ✅ | 8 types, every field source-grounded |
| Dependencies | ⚠️ See findings | Dependants table dropped graph weights and excluded-module rows; structurally fine but diverges from the rule's "include every cross-module dependant, weighted" instruction |
| API endpoints | ✅ | 7 endpoints; 2 with captured fixtures, 5 marked `// stubbed — replace with real capture` |
| Side effects | ✅ (correctly omitted) | The scope cut removed every side effect that was in r1 (cookie writes, dataLayer pushes, locale persistence) — all out of scope now |
| Coordination | ✅ (correctly omitted) | No in-scope coordination concerns remain |
| Flows | ✅ (correctly omitted) | No multi-step flows in the BE-contract surface |
| Lessons (hard-won) | ✅ | 7 lessons, all describing BE-contract properties |

### Content audit — capabilities

The Operations table collapses 7 of the 8 lookups into a single capability (capability 1), with regions called out separately (capability 2) because of the per-country parameterisation, and a third capability for record resolution.

| Capability | Source backing | Notes |
| --- | --- | --- |
| 1 — Retrieve a reference lookup | `services.ts:38-134` (7 fetch functions) | Defensible compression: all 7 share `GET /{lookup}?limit=0` shape |
| 2 — Retrieve regions for a country | `services.ts:74-97` | Genuinely different — parameterised by country id |
| 3 — Resolve a record by id, code, or term | `useSystem.ts:101-142` (client-side `find`/`get` helpers) | Borderline scope — see suggestion |

🟡 **Suggestion — Capability 3 leans client-side.** "Resolve a record by id, code, or term" reads like a description of what the consumer does with the data after retrieving it. The doc's own scope cut says: *"How the lookups are retrieved, cached, coordinated, or refreshed is a build choice"* — and record resolution is arguably part of that "what the consumer does". Two valid fixes:

1. **Drop capability 3** — let the data shape's `id`/`code`/`months`/`object_type` fields speak for themselves; the consumer's resolution mechanic is their own.
2. **Reframe as a BE capability** — *"Filter a reference lookup by indexed field"* — referring to the BE's `filter[code]=...` query support on these endpoints (which it has), making it factually about the BE contract.

Option 1 is the cleaner cut. Option 2 only makes sense if you want to document the filter-query surface explicitly.

### Content audit — data shape

Unchanged from r1's data-shape findings (re-verified): all 8 types match canonical sources plus the fixture-broader-than-typed-contract pattern on `Country` (`code3`, `vat`, `post_code_regex` retained from fixture).

### Content audit — dependants

The r2 table has 6 module rows + a presentation-layer row, with the "reads" column reframed to lookup-data only. The rule says *"Include every cross-module dependant the graph returns, weighted descendingly"* and *"Add a 'Presentation layer' row at the bottom"*. The r2 doc has the presentation row ✅ but diverges from the graph weights:

| r1 (full graph) | r2 (trimmed to in-scope consumers) | Notes |
| --- | --- | --- |
| basket 13 | basket | Reads countries, billing cycles, currencies |
| basketProduct 9 | basketProduct | Reads billing cycles, currencies |
| paymentDetails 5 | paymentDetails | Reads countries, regions |
| product 5 | product | Reads currencies, billing cycles |
| feedback 5 | _dropped_ | Excluded module; imports from system but against out-of-scope subfolders (upload + translations) |
| brand 4 | _dropped_ | Imports against the i18n subfolder (translations) — out of scope |
| routing 2 | _dropped_ | Imports against locale + attribution — out of scope |
| config 1 | _dropped_ | Imports against translations — out of scope |
| payment 1 | payment | Currency reads remain in scope |
| lookup 1 | lookup | Reads every reference list |
| recommendations 1 | _dropped_ | Excluded module |

🟠 **Warning — Dependants table dropped graph weights and trimmed rows.** The rule's letter says "include every cross-module dependant, weighted." The r2 doc dropped 5 modules and 11 numeric weights. The reasoning is sound — those 5 modules import from the out-of-scope subfolders (i18n, places, recaptcha, upload), not the BE-contract surface this doc describes. But the rule didn't anticipate the scoped-sub-contract case, so the trimming reads as a rule deviation.

**Two valid resolutions:**

1. **Keep the trim, add a one-line note.** Something like: *"Graph weights aren't shown because the cross-module imports aggregate the whole `system/*` source folder, including the out-of-scope subfolders. The rows shown here are restricted to consumers of the BE reference-data contract."*
2. **Restore the full table.** Show all 11 modules + weights, but annotate each row with whether it consumes the contract or an out-of-scope subfolder. More work; preserves rule letter.

This is **the same rule-vs-scope tension the user flagged** in the reframe instruction — see "Suggested rule updates" below.

### Content audit — endpoints

| Endpoint | Fixture | Status |
| --- | --- | --- |
| `GET /countries?limit=0&order=name` | `get-countries.json` | ✅ Real |
| `GET /countries/{id}/regions?limit=0` | _missing_ | ⚠️ Stubbed |
| `GET /billing_cycles?limit=0` | `get-billing_cycles.json` | ✅ Real |
| `GET /languages?limit=0` (auth) | _missing_ | ⚠️ Stubbed |
| `GET /currencies?limit=0` | _missing_ | ⚠️ Stubbed |
| `GET /statuses?limit=0` | _missing_ | ⚠️ Stubbed |
| `GET /tickets/departments?limit=0` (auth) | _missing_ | ⚠️ Stubbed |

🟠 **Warning — Five of seven endpoints are stubbed.** Improved ratio vs. r1 (8/10) but still the dominant gap for actionability. Capture work is mechanical: one record each, except countries (already done).

### Content audit — lessons

All 7 lessons describe BE-contract properties. Source-grounded:

| Lesson | Source / type backing |
| --- | --- |
| Statuses discriminated by `object_type` | `IStatus.object_type` in `statuses.ts:9` |
| Region tree per-country, not global | `services.ts:74-97` (region endpoint is country-scoped); no aggregate region endpoint |
| Country list server-localised by `Accept-Language` | `services.ts:61-72` uses `useUrl` which injects locale; fixture path `/api/countries?lang=en` confirms |
| Currencies carry `decimals` flag | `ICurrency.decimals` in `constants.ts:38` |
| Billing cycle 0 means one-off | Fixture `get-billing_cycles.json` line 11-16: `{months: 0, recurring: 0}` |
| Ticket departments brand-scoped | `ITicketDepartment.brand_id` in `tickets.ts:126` |
| Status `deleted_at` non-null for soft-deleted | `IStatus.deleted_at` in `statuses.ts:5` |

🟢 **Praise — Lessons are sharp and source-grounded.** Every one of these is the kind of thing an architect would hit on a first build attempt: forgetting `object_type` and getting cross-domain status collisions; assuming amounts are always two-decimal and breaking JPY; missing the soft-delete filter and showing a deleted status in a dropdown.

---

## Top 3 priorities

1. 🟠 **Capture the five missing fixtures.** `regions`, `languages`, `currencies`, `statuses`, `tickets/departments`. Mechanical; each is a single record + capture. Materially raises Actionability.
2. 🟠 **Resolve the dependants table tension.** Either drop the row trim with a note about graph aggregation (option 1 above), or restore all 11 rows annotated by scope (option 2). Both are defensible — pick one.
3. 🟡 **Decide capability 3.** Drop it entirely (let the data shape carry resolution), or reframe as a BE-side filter capability. The current wording sits in the awkward middle.

---

## Suggested rule updates

Two rule-level gaps surfaced across both the brand and system reviews and were highlighted directly by your reframe instruction. Proposed text below — flagged for your approval, not applied.

### 1. Scope-cut framing for modules that wrap multiple concerns

**Where:** `.agent/rules/docs-modules.md`, under **What To Strip → Implementation patterns presented as requirements** or as a new section **Scope cuts when a source module wraps multiple concerns**.

**Proposed text:**

> Some source modules host helper mechanics that are *our* opinion rather than part of the platform contract — caching strategy, readiness coordination, refresh/invalidate APIs, ancillary cross-cutters (i18n, analytics, address autocomplete, captcha, file upload) that another stack will solve very differently. The foundation doc describes the BE-contract surface only.
>
> When a source module bundles a BE-contract substrate with one or more helper concerns:
>
> - Document the BE contract in the foundation doc (endpoints, data shapes, lessons about the data).
> - Call out the out-of-scope concerns in a single italic note under **What it is**: *"Out of scope for this doc — folder also contains X, Y, Z. Different stacks will handle these differently."*
> - Do **not** document cache/readiness/refresh/invalidate as capabilities. They are consumer-implementation, not platform contract.

**Why it's needed:** Both the brand and system docs hit this. Brand's i18nMessages-via-meta call was the first symptom; system's reframe is the second. Without the rule, a producer agent that walks the source surface will faithfully document our caching opinions as capabilities — exactly what the user flagged.

### 2. Dependants table when scope is sub-folder

**Where:** `.agent/rules/docs-modules.md`, under **Dependants — modules that read from this one**.

**Proposed text addition:**

> When the foundation doc's scope is narrower than the source module's full surface (see the scope-cut rule above), graph weights aggregate cross-module imports against the whole source folder including out-of-scope sub-concerns. In that case:
>
> - Keep the full table with weights, but annotate each row with the in-scope concern it actually reads, OR
> - Trim the table to in-scope consumers only, with a one-line lead-in explaining why graph weights are omitted.
>
> Either is acceptable. Pick the one that conveys more architectural truth.

**Why it's needed:** The system r2 doc made a defensible call (trim) that diverges from the current rule's letter. The rule should anticipate this rather than make every scoped doc look like a rule deviation.

---

## Appendix A: Source-of-truth references

**Canonical types (cross-referenced for Data shape):**

- `packages/types/src/models/constants.ts` — `IBillingCycle` (3-8), `ICountry` (20-28), `ICurrency` (30-41), `ILanguage` (43-49), `IRegion` (51-56)
- `packages/types/src/models/statuses.ts` — `IStatus` (3-11)
- `packages/types/src/models/tax.ts` — `ITaxBusinessType` (21-29)
- `packages/types/src/models/tickets.ts` — `ITicketDepartment` (124-137)
- `packages/types/src/data/enums/objects.ts` — `UpmindObjectTypes`
- `packages/types/src/data/iso4217.ts` — `ISO_4217_CURRENCY_CODE`

**Module source (in-scope surface only):**

- `packages/headless/src/modules/system/services.ts` — 7 fetcher functions
- `packages/headless/src/modules/system/useSystem.ts` — substrate composable (lifecycle + helpers; lifecycle now out of scope)
- `packages/headless/src/modules/system/types.ts` — `SystemContext`

**Fixtures consulted:**

- `tests/__fixtures__/recordings/get-countries.json` (used)
- `tests/__fixtures__/recordings/get-billing_cycles.json` (used)
- Missing: `get-regions.json`, `get-languages.json`, `get-currencies.json`, `get-statuses.json`, `get-tickets-departments.json`

**Graphify edges:** see r1 audit; same data, scope-filtered.

---

## Appendix B: Verbatim evidence

No 🔴 critical issues.

**🟠 Dependants table trim (foundation.md lines 117-128):**

> Every cart/portal module that displays a currency, a country, a billing term, or a status reads from system. Below is the in-scope fan-in (modules that consume reference data, not the cross-cutters listed under "Out of scope" above).
>
> | Module | Reads | Why |
> | --- | --- | --- |

(Table has no weight column; 6 module rows + presentation-layer row.)

**🟠 Five stubbed endpoint bodies — same pattern as r1, e.g. (lines 186-199):**

> ```json
> // stubbed — replace with real capture
> {
>   "status": "ok",
>   "data": [
>     {
>       "id": "…",
>       "country_id": "…",
>       "code": "ENG",
>       "name": "England"
>     }
>   ]
> }
> ```

**🟡 Capability 3 wording (foundation.md line 26):**

> | 3 | **Resolve a record by id, code, or term** | the lookup + a key (country code, billing-cycle months, status `object_type`, …) | The matching record from the loaded list |

The phrase *"from the loaded list"* tips it into client-side resolution territory.

---

## Appendix C: Files reviewed

**Rule + skill:**

- `.agent/rules/docs-modules.md`
- `.agent/workflows/doc-module.md`
- `.agent/workflows/doc-module-review.md`

**Prior review:**

- `docs/audit/doc-module-review-system-2026-05-15.md` (r1)

**Candidate:**

- `packages/headless/src/modules/system/docs/foundation.md` (rewritten 2026-05-15 post-reframe)

**Source (in-scope only):**

- `packages/headless/src/modules/system/{index,types,services,useSystem}.ts`

(Out-of-scope subfolders not re-read for r2; their absence from the candidate confirms the scope cut.)

**Canonical types:**

- `packages/types/src/models/constants.ts`
- `packages/types/src/models/statuses.ts`
- `packages/types/src/models/tax.ts`
- `packages/types/src/models/tickets.ts` (lines 120-150)

**Fixtures:**

- `tests/__fixtures__/recordings/get-countries.json`
- `tests/__fixtures__/recordings/get-billing_cycles.json`

---

## Appendix D: Strip-audit exhaustive list

All pattern searches returned **zero hits**. Same patterns as r1; same clean result.
