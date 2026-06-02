# Doc-module review — system — 2026-05-15

| Field | Value |
| --- | --- |
| Module | `system` |
| Reviewer | `/doc-module-review` |
| Date | 2026-05-15 |
| Candidate | `packages/headless/src/modules/system/docs/foundation.md` |
| Golden | _none — no archived snapshot exists for system_ |
| Prior review | _none — first review of this module_ |
| Rule version | `.agent/rules/docs-modules.md` (post 2026-05-14 sharpening pass) |
| Producer skill version | `.agent/workflows/doc-module.md` (post 2026-05-15 foundation.md rename) |

---

## Executive summary

| Category | Score | Notes |
| --- | --- | --- |
| Technical accuracy | 92 | Types align with fixtures + typed contracts; weights match graphify; endpoints match services. Stubbed bodies on 8 of 10 endpoints. |
| Completeness | 86 | All required sections present and lifecycle is covered. 14 source-exposed capabilities collapsed to 12 by demoting recaptcha + upload to a one-line note — the hard cap forced a trade-off. |
| Structure | 94 | Canonical section order. Side effects justified. State model / Coordination / Flows correctly omitted. |
| Tone | 95 | Descriptive throughout. No method names, no framework leaks, no prescriptive verbs. Lessons stated as problems. |
| Actionability | 88 | An architect can build a substrate from this doc, but stubbed endpoint bodies require fixture capture before copy-paste works end-to-end. |
| **Overall** | **91** | Pass with fixes |

**Verdict:** Pass with fixes. The doc is publishable as a foundation deliverable after (a) deciding whether to lift recaptcha + upload into Operations and (b) capturing the missing endpoint fixtures. No rule changes needed.

---

## Part 2: Fresh full audit

### Strip audit findings

A full-pattern grep against the candidate returned **zero hits** across all forbidden patterns. Specifically:

| Pattern family | Hits | Severity |
| --- | --- | --- |
| Composable method names (`useX(`, `isReady(`, `getConfigValue(`, `ensureConfig(`, etc.) | 0 | — |
| Internal store / queryKey / persister names (`localStoragePersister`, `["system"`, `regionsStore`) | 0 | — |
| Framework terms (`computed`, `ref`, `XState`, `TanStack`, `spawn`, scoped composable) | 0 | — |
| `.meta` content outside the italic note | 0 | — |
| Prescriptive verbs ("you should", "you must", "everyone awaits", "plan for") | 0 | — |
| Solution-shape suffixes ("the cleaner shape is X", "the natural separation is Y", "has to do Y", "inversion has to happen") | 0 | — |
| Meta-commentary ("our implementation", "we chose", "we split", "we built") | 0 | — |

This is a notable result given the breadth of source: the system module sprawls across analytics, localisation, places, recaptcha, upload, and clientArea + form subfolders — each with its own framework conventions. The candidate stripped cleanly.

🟢 **Praise — Strip discipline.** Source is unusually flavour-heavy (XState recaptcha/upload machines, Vue clientArea slots, JSONForms types, TanStack persisters). The candidate keeps the architectural surface visible without leaking any of it.

### Section audit

| Section | Status | Notes |
| --- | --- | --- |
| Header (`# Module: system`) | ✅ | Present |
| What it is | ✅ | One paragraph; clear domain framing; `.meta` italic immediately after |
| Core concepts | ✅ (optional, justified) | 5 terms; non-obvious from the data shape alone — module spans many domains so a glossary helps |
| State model | ✅ (correctly omitted) | Module is read-data + apply-it; no domain state |
| Operations | ✅ | 12 capabilities, all framework-neutral. Lifecycle (rows 1–3) covered. See content audit re: 2 demoted auxiliaries. |
| Data shape | ✅ | 12 types covering every observable shape including auxiliaries |
| Dependencies (dependants + own) | ✅ | 11 cross-module rows + presentation layer; weights match graph |
| API endpoints | ✅ | 10 endpoints; 2 with captured fixtures, 8 marked `// stubbed — replace with real capture` |
| Side effects | ✅ (optional, justified) | Persists to localStorage + cookie + global queues; externally observable |
| Coordination | ✅ (correctly omitted) | Coordination concerns surfaced in Lessons |
| Flows | ✅ (correctly omitted) | No multi-step domain flows worth diagramming |
| Lessons (hard-won) | ✅ | 11 lessons, all source-grounded; problem-shaped without solution suffixes |

### Content audit — capabilities

**Capability coverage check** against module exports (omitting Vue/UI-only subfolders `clientArea` and `form`):

| Source area | Exported surface | Capability in doc? |
| --- | --- | --- |
| `useSystem` lifecycle | `isReady`, `refresh`, `invalidate` | Capabilities 1, 2, 3 |
| `useSystem` reads | `countries`, `billingCycles`, indirectly `languages`/`currencies`/`statuses`/`departments`/`taxBusinessTypes`/`systemIPAddresses` | Capability 4 |
| `useSystem` region helpers | `getRegion`, `getRegions`, `fetchRegions` | Capability 5 |
| `useSystem` match helpers | `getCountry`, `getBillingCycle` | Capability 6 |
| `useLocale` negotiation | `setDefaultLocale`, `getLocale` (internal), `supportedLanguages` | Capability 7 |
| `useLocale` apply | `setLocale` | Capability 8 |
| `useI18n` translate | `t`, vue-i18n composer | Capability 9 |
| `useDataLayer` push | `init`, `dataLayer` event chain | Capability 10 |
| `useTracking` attribution | `init`, `get`, `remove` | Capability 11 |
| `usePlaces` | `search`, `getPlaceDetails` | Capability 12 |
| `useRecaptcha` | `init`, `generate`, `clear` | ⚠️ Demoted to note |
| `useUpload` | `add`, `getImage`, `getImageByHash`, `remove` | ⚠️ Demoted to note |

🟠 **Warning — Operations table doesn't cover every observable behaviour.** The rule says *"Cover every observable behaviour the module exposes"* AND *"Max 12 capabilities per module"*. The candidate prioritised the 12-cap by demoting recaptcha and upload to the note immediately below the table. They remain documented under Data shape and API endpoints, but the Operations table — which the rule frames as the canonical surface inventory — undercounts.

**Two fixes are equally defensible:**

1. Collapse capabilities 4 (read) and 6 (match) into a single "Read or match a reference lookup" capability, freeing two rows for recaptcha and upload.
2. Treat the hard 12-cap as a soft cap when an honest module has more — and let the table grow to 14, noted as an intentional exception.

The producer chose neither — instead the auxiliaries got demoted. Workable, but the resulting note reads awkwardly and risks a reader skimming Operations and not realising recaptcha and upload are part of this module.

### Content audit — data shape

Cross-referenced against `packages/types/src/models/` (the canonical types).

| Type in doc | Canonical source | Match? | Notes |
| --- | --- | --- | --- |
| `Country` | `ICountry` in `constants.ts:20-28` | ✅ Doc broader than typed contract | Typed `ICountry` has 7 fields. Doc adds `code3`, `vat`, `post_code_regex` — present in fixture, correctly included per rule's "fixture is source of truth". |
| `Region` | `IRegion` in `constants.ts:51-56` | ✅ | Exact match |
| `BillingCycle` | `IBillingCycle` in `constants.ts:3-8` | ✅ Exact match (id, months, name, recurring) |
| `Language` | `ILanguage` in `constants.ts:43-49` | ✅ Exact match |
| `Currency` | `ICurrency` in `constants.ts:30-41` | ✅ Exact match |
| `Status` | `IStatus` in `statuses.ts:3-11` | ✅ Exact match |
| `TicketDepartment` | `ITicketDepartment` in `tickets.ts:124-137` | ✅ Doc is subset (lifted the architectural fields, omitted the relation pointers like `brand_ticket_departments`) — defensible compaction |
| `TaxBusinessType` | `ITaxBusinessType` in `tax.ts:21-29` | ✅ Exact match (incl. the `[key: string]: any` index signature, kept as `[extra: string]: unknown`) |
| `AnalyticsEvent` / `EcommerceItem` | `analytics/types.ts` `DataLayerEcommerce` etc. | ✅ Renamed without losing structural fidelity |
| `AttributionCookie` | `useTracking.ts` `IUpmState.track` (lines 28-35) | ✅ Exact match (5 keys: source/medium/campaign/content/term) |
| `Place` / `PlacePrediction` | `places/types.ts` lines 10-55 | ✅ Doc inlines the address shape; canonical type imports `AddressModel["address"]` |
| `CaptchaToken` | `recaptcha/types.ts` `RecaptchaContext` | ✅ Lifted the observable fields (token, created, action) |
| `UploadTarget` | `upload/services.ts` `fieldPath` switch (lines 27-62) | ✅ Enum values match the switch cases via `ImageObjectTypes` |
| `Image` | `IImage` from types | ⚠️ Marked `// …additional fields from the typed contract` — abbreviated |

🟡 **Suggestion — `Image` type abbreviated.** The placeholder comment is honest but light. If `IImage` has admin-relevant fields (size, mime_type, dimensions, owning entity refs), they're worth including for parity with the brand doc's full data shape.

### Content audit — dependants

Weights independently recomputed from `graphify-out/graph.json` (`imports_from` edges, cross-module only):

| Module | Graph weight | Doc weight | Match |
| --- | --- | --- | --- |
| `basket` | 13 | 13 | ✅ |
| `basketProduct` | 9 | 9 | ✅ |
| `paymentDetails` | 5 | 5 | ✅ |
| `product` | 5 | 5 | ✅ |
| `feedback` | 5 | 5 | ✅ |
| `brand` | 4 | 4 | ✅ |
| `routing` | 2 | 2 | ✅ |
| `config` | 1 | 1 | ✅ |
| `payment` | 1 | 1 | ✅ |
| `lookup` | 1 | 1 | ✅ |
| `recommendations` | 1 | 1 | ✅ |

All 11 cross-module dependants in the graph appear in the doc, weighted correctly, with a presentation-layer row appended.

🟢 **Praise — Comprehensive dependants.** Unlike the brand candidate's earlier slip (top-3 only), this one captures every dependant including the small-weight ones (`config`, `payment`, `lookup`, `recommendations`).

🟡 **Suggestion — `feedback` and `recommendations` are excluded modules.** Per `contabo.md` they're not in workshop scope, but they still import from system, so the graph weight is real. The doc surfaces them factually, which is the right call — flagging in case the user wants to drop them or add a footnote.

### Content audit — endpoints

| Endpoint | Doc | Source service | Fixture | Match |
| --- | --- | --- | --- | --- |
| `GET /countries?limit=0&order=name` | ✅ | `services.ts:61-72` | `get-countries.json` | ✅ Real fixture |
| `GET /countries/{id}/regions?limit=0` | ✅ | `services.ts:74-97` | _missing_ | ⚠️ Stubbed |
| `GET /billing_cycles?limit=0` | ✅ | `services.ts:50-59` | `get-billing_cycles.json` | ✅ Real fixture |
| `GET /languages?limit=0` (auth) | ✅ | `services.ts:99-110` | _missing_ | ⚠️ Stubbed |
| `GET /currencies?limit=0` | ✅ | `services.ts:38-48` | _missing_ | ⚠️ Stubbed |
| `GET /statuses?limit=0` | ✅ | `services.ts:112-122` | _missing_ | ⚠️ Stubbed |
| `GET /tickets/departments?limit=0` (auth) | ✅ | `services.ts:124-134` | _missing_ | ⚠️ Stubbed |
| `POST /{path}/images` | ✅ | `upload/services.ts:147-158` | _missing_ | ⚠️ Stubbed |
| `GET /images/{hash}` | ✅ | `upload/services.ts:67-94` | _missing_ | ⚠️ Stubbed |

🟠 **Warning — Eight of ten endpoints are stubbed.** All stubs are clearly marked with `// stubbed — replace with real capture` per the rule's allowance, but the breadth of stubbing reduces copy-paste fidelity for a workshop deliverable. Capturing the missing fixtures is mechanical work — straightforward and high-value.

🟢 **Praise — Stubs are marked, not faked.** Hand-crafted JSON was not invented to fill the gap. The reader sees exactly where the doc is grounded vs. where capture is pending.

### Content audit — lessons

Every lesson maps to observable phenomena in source:

| Lesson | Source evidence |
| --- | --- |
| Boot-time stale reads | `useSystem.ts:39` (`needsRefresh` localStorage scan) + `useSystem.ts:188-193` (background refresh after readiness) |
| Locale blocked while authenticated | `useLocale.ts:50-52` (explicit comment) + `meta.isAvailable` predicate |
| Translation depends on brand | `useI18n.ts:76-77` (brand-driven init merge) |
| Per-country region accumulation | `services.ts:34` (`regionsStore`) + per-country `storePersister` |
| Places races system | `usePlaces.ts:60-72` (isReady chains on system readiness) |
| Attribution once-only | `useTracking.ts:62-110` (init checks existing cookie first; writes only if absent) |
| Analytics consent default-denied | `useDataLayer.ts:246-271` (init pushes default-denied consent) |
| Captcha tokens one-shot | `useRecaptcha.ts:82-111` (single token per action, no pooling) |
| Upload validation depends on brand config | `upload/services.ts:104-111` (brand-config-keyed allowlist on each check) |
| Tracking cookie staleness vs URL params | `useTracking.ts:62-78` (early-return when cookie exists, URL params dropped) |
| Side-channel store coupled to persistence shape | `useSystem.ts:39` (string-match on `"system"` keys in localStorage) |

🟢 **Praise — Lessons are source-grounded.** Every lesson is observable in code; nothing speculative. The "Side-channel store coupled to persistence shape" and "Tracking-cookie staleness vs URL params" lessons are particularly sharp — both surface non-obvious failure modes that an equivalent build would otherwise have to discover through testing.

🟡 **Suggestion — Lesson 10 wording.** *"Re-attribution requires explicit cookie removal first."* is borderline prescriptive. It reads more like advice than a problem statement. Could be rephrased as *"Attribution overwrites are not supported; the cookie has no eviction path other than manual removal."*

---

## Top 3 priorities

1. 🟠 **Recaptcha + Upload in Operations.** Either lift them as rows 13–14 with an explicit "auxiliaries, max-12 exceeded by design" note, or collapse capabilities 4 and 6 (read + match) into a single "Read or match a reference lookup" row to make room. The current note-under-table approach risks readers under-counting the substrate.

2. 🟠 **Capture the eight missing fixtures.** `regions`, `languages`, `currencies`, `statuses`, `tickets/departments`, `images upload`, `images by hash`. Each is a single record + capture. Materially improves actionability score.

3. 🟡 **Tighten Lesson 10 wording** to drop the prescriptive read. Suggested rephrase above.

No rule or skill changes needed. The candidate's only structural friction (recaptcha + upload demotion) stems from the rule's max-12 limit interacting with an unusually wide module; that's a known tension, not a slip.

---

## Appendix A: Source-of-truth references

**Canonical type definitions (cross-referenced for Data shape):**

- `packages/types/src/models/constants.ts` — `IBillingCycle` (3-8), `ICountry` (20-28), `ICurrency` (30-41), `ILanguage` (43-49), `IRegion` (51-56)
- `packages/types/src/models/statuses.ts` — `IStatus` (3-11)
- `packages/types/src/models/tax.ts` — `ITaxBusinessType` (21-29)
- `packages/types/src/models/tickets.ts` — `ITicketDepartment` (124-137)
- `packages/types/src/data/enums/objects.ts` — `UpmindObjectTypes`
- `packages/types/src/data/iso4217.ts` — `ISO_4217_CURRENCY_CODE`

**Module source files:**

- `packages/headless/src/modules/system/index.ts` — re-exports 7 subfolders + main composable
- `packages/headless/src/modules/system/types.ts` — `SystemContext`
- `packages/headless/src/modules/system/services.ts` — 7 fetcher functions + `regionsStore`
- `packages/headless/src/modules/system/useSystem.ts` — main substrate composable
- `packages/headless/src/modules/system/utils.ts` — `useSystemParser`
- `packages/headless/src/modules/system/analytics/{index,useDataLayer,useTracking,types}.ts`
- `packages/headless/src/modules/system/localisation/{index,locales,useI18n,useLocale,useLocalisation,types}.ts`
- `packages/headless/src/modules/system/places/{usePlaces,types}.ts`
- `packages/headless/src/modules/system/recaptcha/{useRecaptcha,types}.ts`
- `packages/headless/src/modules/system/upload/{useUpload,services,types}.ts`

**Fixtures consulted:**

- `tests/__fixtures__/recordings/get-countries.json` (used)
- `tests/__fixtures__/recordings/get-billing_cycles.json` (used)
- Missing: `get-languages.json`, `get-currencies.json`, `get-statuses.json`, `get-tickets-departments.json`, regions for any country, `post-{path}-images.json`, `get-images-{hash}.json`

**Graphify edges:**

- `graphify-out/graph.json` — 97 nodes under `modules/system/*`; cross-module `imports_from` edges aggregated to 11 dependants (see Content audit — dependants)

---

## Appendix B: Verbatim evidence

No 🔴 critical issues. Verbatim quotes for the 🟠 warnings:

**🟠 Operations table doesn't cover recaptcha + upload (line ~32, immediately below capability table):**

> Bot-protection token generation and file upload are also exposed by this module but are pull-in-when-you-need-them auxiliaries — they don't appear in the substrate API surface other modules consume. They are documented under **Data shape** and **API endpoints** for completeness.

**🟠 Eight stubbed endpoint bodies (e.g., line ~239, regions endpoint):**

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

(Eight instances of `// stubbed — replace with real capture` total. Pattern identical to the example above.)

**🟡 Lesson 10 borderline prescription (line ~424):**

> **Tracking-cookie staleness vs URL params.** When a user arrives with new URL params after an existing cookie is set, the cookie is not overwritten — the new params are silently dropped. Re-attribution requires explicit cookie removal first.

---

## Appendix C: Files reviewed

**Rule + skill:**

- `.agent/rules/docs-modules.md`
- `.agent/workflows/doc-module.md`
- `.agent/workflows/doc-module-review.md`

**Workshop framing:**

- `docs/workshop/contabo.md`
- `docs/workshop/contabo-doc-shape-proposal.md`

**Candidate:**

- `packages/headless/src/modules/system/docs/foundation.md`

**Source (system module):**

- `packages/headless/src/modules/system/{index,types,services,useSystem,utils}.ts`
- `packages/headless/src/modules/system/analytics/{index,useDataLayer,useTracking,types}.ts`
- `packages/headless/src/modules/system/localisation/{index,locales,useI18n,useLocale,useLocalisation}.ts`
- `packages/headless/src/modules/system/places/{usePlaces,types}.ts`
- `packages/headless/src/modules/system/recaptcha/{useRecaptcha,types}.ts`
- `packages/headless/src/modules/system/upload/{useUpload,services}.ts`

**Canonical types:**

- `packages/types/src/models/constants.ts`
- `packages/types/src/models/statuses.ts`
- `packages/types/src/models/tax.ts`
- `packages/types/src/models/tickets.ts` (lines 120-150)

**Fixtures:**

- `tests/__fixtures__/recordings/get-countries.json`
- `tests/__fixtures__/recordings/get-billing_cycles.json`

**Graph:**

- `graphify-out/graph.json` (cross-module edges for system)

---

## Appendix D: Strip-audit exhaustive list

All pattern searches returned **zero hits**. Concretely:

| Pattern | Hits |
| --- | --- |
| `useSystem`, `useI18n`, `useLocale`, `useBrand`, `useDataLayer`, `useTracking`, `usePlaces`, `useRecaptcha`, `useUpload`, `useQuery` | 0 |
| `isReady(`, `ensureConfig(`, `getConfigValue(`, `validateCurrency(`, `hasModuleEnabled(`, `getAnalytics(` | 0 |
| `XState`, `TanStack`, `computed(`, `ref(`, `spawn(`, "scoped composable" | 0 |
| `brandConfigKeysStore`, `localStoragePersister`, `["system"`, `["brand"`, `regionsStore` | 0 |
| `.meta.`, `"meta"`, `meta.i18n`, `meta.cart`, `meta.uischema`, `BrandMeta`, `uischema`, `uiCart`, `i18nMessages`, "i18n message overrides", "translation overrides", "brand-cart UI" | 0 |
| "you should", "you must", "everyone awaits", "plan for" | 0 |
| "the cleaner shape is", "the natural separation is", "has to do", "inversion has to happen" | 0 |
| "our implementation", "we chose", "we split", "we built" | 0 |

The candidate is the cleanest strip pass yet across the brand + system runs.
