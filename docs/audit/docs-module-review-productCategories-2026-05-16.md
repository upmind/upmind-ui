# `/docs-module-review productCategories` — 2026-05-16

- **Reviewer:** Claude (Opus 4.7)
- **Candidate:** `packages/headless/src/modules/productCategories/docs/foundation.md`
- **Prior review:** none
- **Rule:** `.agent/rules/docs-modules.md` (post-sharpening)

---

## Executive summary

| Category | Score |
| --- | --- |
| Technical accuracy | 92 |
| Completeness | 78 |
| Structure | 84 |
| Tone | 94 |
| Actionability | 82 |
| **Overall** | **86** |

**Verdict:** pass with fixes. The candidate is factually clean, descriptive, and respects the strip rules. Two structural gaps drag the score: no **Core concepts** section (the doc uses terms like "category tree", "breadcrumb", "category_type semantics", "translated vs untranslated", "module-targeted category" without grounding them up front), and no **Flows** section despite the catalogue-browsing flow being a multi-step interaction architects need to plan around (load tree → drill subtree → resolve breadcrumb → cross-link to catalogue read by `category_id`). One technical accuracy nit: the "Read the full category tree" operation glosses that `with` / `with_count` parameters are the depth knob — a key constraint the Lessons later restate but Operations should signal.

---

## Part 2: Fresh full audit

### Strip audit

| # | Severity | Line(s) | Issue |
| --- | --- | --- | --- |
| S1 | 🟢 Praise | 9 | Meta note correctly scoped with `meta.uischema` / `meta.@data.categoryBadge` examples — matches the conditional-rule's "tighten the wording" guidance. |
| S2 | 🟢 Praise | n/a | No method names, no framework leaks, no "our implementation" commentary, no solution-shape suffixes anywhere in the doc. Grep for `useX(`, `computed(`, `XState`, `TanStack`, `you should`, `cleaner shape`, `our implementation` returns only the legitimate meta note on L9. |

Strip audit: **clean.**

### Section audit

| Section | Status | Notes |
| --- | --- | --- |
| Header | ✅ | `# Module: productCategories` |
| What it is | ✅ | Two paragraphs, scope-boundary forwarding present (L7: forwards listing → `productCatalogue`, embedded snapshot → `product`). |
| Core concepts | ❌ **MISSING** | Doc uses "category tree", "subcategories depth", "breadcrumb path", "module-targeted category", "translated vs untranslated", "category_type semantics" without grounding. The canonical references (`product`, `basket`) both carry Core concepts. |
| State model | ⚠️ Correctly omitted | Categories carry no platform-defined lifecycle status. |
| Operations | ✅ | Table + "Derived from a loaded tree" sub-table + "Always-on behaviours" sub-list pattern is well executed. |
| Data shape | ✅ | One block per endpoint (only one endpoint); typed cross-refs to `IProductCategory`, `ProductCategoryTypes`, `DeferModes` are correct. |
| Dependencies (dependants) | ✅ | Honest "no headless dependants" finding is correct (confirmed by graphify: 23 outgoing edges from productCategories all land on `client-vue` presentation files, none on other headless modules). Presentation-layer row present. Footnote correctly excludes `query` and explains `productCatalogue` joins by `category_id` not by import. |
| Dependencies (own) | ✅ | Transport + shared types listed. |
| API endpoints | ✅ | Real curl, real fixture sample, `meta` stripped from the in-doc body, link to fixture preserves the rest. |
| Side effects | ⚠️ Correctly omitted | No externally-observable side effects. |
| Coordination | ⚠️ Correctly omitted | No coordination concerns. |
| Flows | ❌ **MISSING** | Catalogue browsing is a multi-step interaction: load tree → resolve breadcrumb path for a given category → drill into a subtree → hand a `category_id` to `productCatalogue` for the grid. An architect rebuilding the storefront plans around this sequence; the rule says "include when the module exposes one or more multi-step interactions a caller plans around — paginate-then-filter" applies. |
| Lessons (hard-won) | ✅ | Eight lessons, all stated as problems, no solution-shape suffixes, no prescriptive verbs. Particularly strong: L225 (one-shot, no pagination), L227 (depth bounded by `with` expand list), L229 (three category-type semantics in one shape), L235 (tree is identity, not inventory). |

### Content audit

**Operations (factual accuracy):**

- ✅ Capability 1 (Read the full category tree) maps to `service.loadList()` → `GET /basket/products_categories`.
- ✅ Capabilities 2–8 (Derived from a loaded tree) map 1:1 to source exports: `getOne` → look up by id, `findOne(string)` → free-text find, `filter` → filter by name, `getPath` → breadcrumb path, `getChildren` → direct children (with `flattened` flag), `getParent` → ancestor id, `dataFlattened` → flattened tree. ✅ Non-BE marker present.
- ✅ Always-on behaviours covers `isReady` (readiness signal), `refresh`, `invalidate` (matches L243 / L251 in `useProductCategories.ts`).
- 🟠 **W1** (L15): "Read the full category tree" hides the `with` / `with_count` depth knob. The endpoint shape is "load up to N levels depending on the expand list" — capability description should mention "depth is controlled by the expand list (`with=subcategories.image`, repeated per level)". Currently the constraint surfaces only in Lessons L227.

**Data shape:**

- ✅ All fields in fixture appear in the type block — `id`, `parent_id`, `level`, `brand_id`, `org_id`, `user_id`, `reseller_account_id`, `name` + `name_translated`, `description` + `description_translated`, `short_description` + `short_description_translated`, `external_id`, `import_id`, `staged_import`, `module_code`, `module_sub_id`, `category_type`, `multiple`, `required`, `price_override`, `provision_setup_field_defer_mode`, `order`, `hidden`, `ui_settings`, `products_count`, `sub_products_count`, `subcategories_count`, `sub_subcategories_count`, `subcategories`, `image`, `translations`, `created_at`, `updated_at`, `deleted_at`. `meta` correctly stripped.
- ✅ Typed cross-reference accurate: `IProductCategory` in `packages/types/src/models/products.ts`; enum location for `ProductCategoryTypes` correct.
- 🟡 **S1** (L67): `category_type: 1 | 2 | 3` — could reference enum names inline ("`category_type: ProductCategoryTypes` — 1 = PRODUCT (catalogue navigation), 2 = PRODUCT_OPTION, 3 = PRODUCT_ATTRIBUTE"). Currently the mapping is implicit on the same line; mild polish.

**Dependants table:**

- ✅ Verified against graphify: `productCategories` has 23 outgoing edges in `graph.json` (`links` where source startsWith `packages_headless_src_modules_productcategories`). Every target sits under `packages_client_vue_src_modules_catalogue_*`. No headless module imports from productCategories. The candidate's claim on L101 is correct.
- ✅ Presentation-layer row carries the right "reads" data names (title, description, excerpt, badge, image url, product counts, parent/children linkage, breadcrumb path).
- ✅ Footnote correctly excludes `query` and clarifies `productCatalogue` joins by id rather than by import.

**API endpoints:**

- ✅ URL + method match `services.ts` L29 (`useUrl("basket/products_categories", { with, with_count })`).
- ✅ `with` / `with_count` query strings in the curl match the source (`services.ts` L30–L41).
- ✅ Sample response is sourced from `tests/__fixtures__/recordings/get-basket-products_categories-f13c8b36.json`, trimmed for readability with a link to the full fixture. `meta` stripped from the in-doc body.

**Lessons:**

- ✅ All eight lessons map to observable phenomena: response-size (the fixture's depth of nesting), `with`-bounded depth (services.ts expand list), `category_type` semantics (enum file), `products_count` vs `sub_products_count` semantics (fixture fields), translation fallback (mapper L29–L30), tree vs inventory split (no products in fixture nodes), breadcrumb requires tree walk (`walkPath` in useProductCategories L83–L100), `module_code`/`module_sub_id` provisioning hint (type comment L64).
- ✅ No solution-shape suffixes, no prescriptive verbs.

---

## Top 3 priorities (by severity × ease)

1. 🟠 **Add a Core concepts section** between "What it is" and "Operations" — 4–5 bullets grounding: **category tree** (nested `subcategories` to a depth controlled by the expand list), **breadcrumb path** (root → target ordered walk, not derivable from a single `parent_id`), **category type** (the three `category_type` semantics, with only `type=1` being storefront-navigation), **translated vs untranslated identity** (each name/description carries both forms; translated falls back silently). Optionally **module-targeted category** (`module_code` / `module_sub_id` hooks).
2. 🟠 **Add a Flows section** with one flow: "Browse the catalogue taxonomy". One `flowchart TD` covering: load tree → identify target category id → resolve breadcrumb via tree walk → hand `category_id` to `productCatalogue` for grid. Guarantees / Constraints lists pull from existing Lessons (one-shot load, depth bounded by `with`, breadcrumb requires walk).
3. 🟠 **Surface the depth knob in Operations capability 1** — append a sub-bullet or extend the Outputs cell to note that the depth of nesting is bound by the `with` expand-list parameter (e.g. "Up to N levels of subcategories, where N matches the depth requested via the `with=subcategories.subcategories…` expand list — typically four levels"). The Lessons restate this (L227), but Operations should already signal the constraint.

---

## Appendix A: Source-of-truth references

- `packages/headless/src/modules/productCategories/useProductCategories.ts` — L35–L253 (operations inventory)
- `packages/headless/src/modules/productCategories/services.ts` — L19–L53 (endpoint, expand list, query key)
- `packages/headless/src/modules/productCategories/mappers.ts` — L21–L48 (parse, translation, countDeep)
- `packages/headless/src/modules/productCategories/types.ts` — L1–L18 (`ProductCategory` mapped type)
- `packages/types/src/models/products.ts` — `IProductCategory` canonical
- `packages/types/src/data/enums/products.ts` — `ProductCategoryTypes`
- `packages/types/src/data/enums/provisioning.ts` — `DeferModes`
- `tests/__fixtures__/recordings/get-basket-products_categories-f13c8b36.json` — fixture for sample body
- `graphify-out/graph.json` — 23 outgoing edges from `productcategories` nodes, all to `client-vue/catalogue/*` (no headless dependants confirmed)

## Appendix B: Verbatim evidence

- **W1** — L15 quote: *"Array of top-level categories, each carrying nested `subcategories` up to five levels."* — five-level claim is fixed in the doc, but the source's `with` expand list is the actual knob; capability description should expose this.
- **Missing Core concepts** — Lessons L227 references "subcategories depth", L229 references "category_type semantics", L233 references "translated/untranslated" without prior grounding.

## Appendix C: Files reviewed

- `.agent/rules/docs-modules.md`
- `.agent/workflows/docs-module-review.md`
- `packages/headless/src/modules/productCategories/docs/foundation.md` (candidate)
- `packages/headless/src/modules/productCategories/useProductCategories.ts`
- `packages/headless/src/modules/productCategories/services.ts`
- `packages/headless/src/modules/productCategories/mappers.ts`
- `packages/headless/src/modules/productCategories/types.ts`
- `packages/headless/src/modules/productCategories/index.ts`
- `packages/headless/src/modules/product/docs/foundation.md` (canonical reference)
- `packages/headless/src/modules/basket/docs/foundation.md` (canonical reference)
- `tests/__fixtures__/recordings/get-basket-products_categories-f13c8b36.json`
- `graphify-out/graph.json`

## Appendix D: Strip-audit exhaustive list

| Pattern | Hits | Notes |
| --- | --- | --- |
| `useX(`, `isReady(`, `getConfigValue` | 0 | — |
| Store / queryKey / persister names | 0 | — |
| Framework terms (`computed`, `ref`, `XState`, `TanStack`, `useQuery`, `spawn`) | 0 | — |
| `.meta` content outside italic note | 0 | The L9 italic note is legitimate (fixture carries `meta.uischema` and `meta.@data.*` at the data level — conditional-rule "include" branch). |
| Prescriptive verbs ("you should", "you must", "plan for") | 0 | — |
| Solution-shape suffixes ("the cleaner shape is X") | 0 | — |
| Meta-commentary ("our implementation", "we chose", "we split") | 0 | — |
