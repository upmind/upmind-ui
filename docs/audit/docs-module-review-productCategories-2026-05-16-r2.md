# `/docs-module-review productCategories` — 2026-05-16 (r2)

- **Reviewer:** Claude (Opus 4.7)
- **Candidate:** `packages/headless/src/modules/productCategories/docs/foundation.md` (post-r1 edits)
- **Prior review:** `docs/audit/docs-module-review-productCategories-2026-05-16.md`
- **Rule:** `.agent/rules/docs-modules.md`

---

## Executive summary

| Category | r1 | r2 | Δ |
| --- | --- | --- | --- |
| Technical accuracy | 92 | 94 | +2 |
| Completeness | 78 | 93 | +15 |
| Structure | 84 | 94 | +10 |
| Tone | 94 | 94 | — |
| Actionability | 82 | 93 | +11 |
| **Overall** | **86** | **94** | **+8** |

**Verdict:** pass. All three r1 top-priorities landed cleanly. The doc now reads as a complete spec: Core concepts ground every term the rest of the doc uses, the depth-knob constraint surfaces in capability 1's Outputs (not just in Lessons), and the new Browse-the-catalogue-taxonomy flow shows the cross-module hand-off to `productCatalogue` that the dependants table only hints at.

---

## Part 1: Delta vs prior review

| Prior issue | Status | Evidence |
| --- | --- | --- |
| Missing **Core concepts** section | ✅ FIXED | L11–L17 (5 bullets: category tree, breadcrumb path, category type, translated vs untranslated identity, module-targeted category). |
| Missing **Flows** section | ✅ FIXED | L40–L73 — single "Browse the catalogue taxonomy" flow with `flowchart TD`, Guarantees and Constraints as prose lead-ins (not sub-headings — rule-compliant). Diagram uses rounded `([...])` entry/terminal nodes, square `["..."]` action nodes, diamond `{...}` branches. BE endpoints in node labels, no method names, no orchestrator vocabulary. |
| **W1**: Capability 1 hides the `with` depth knob | ✅ FIXED | L25 now reads "…nested `subcategories` to a depth controlled by the `with` expand list (the typical request asks for `subcategories.image` repeated up to four times to materialise five levels)…". |
| **S1**: enum-name inline cross-ref on `category_type` | ❌ NOT FIXED | Suggestion-level; left unaddressed per scope of top-3 fixes. |

**New issues:** none surfaced. **New strengths:** the new flow's Constraints list cleanly forwards the `category_id` join to `productCatalogue` — closes the loop the dependants footnote opened.

---

## Part 2: Fresh full audit

### Strip audit

Re-ran the full forbidden-pattern grep over the post-edit doc (`useX(`, `isReady(`, `computed(`, `ref(`, `XState`, `TanStack`, `useQuery`, `spawn(`, `scoped composable`, `you should`, `you must`, `plan for`, `cleaner shape`, `our implementation`, `we chose`, `we split`, `natural separation`, `has to do`). **Zero hits.** The only `meta` reference remains the L9 italic note (rule-compliant). Strip audit: **clean.**

### Section audit

| Section | Status | Notes |
| --- | --- | --- |
| Header | ✅ | unchanged |
| What it is | ✅ | unchanged |
| Core concepts | ✅ **NEW** | 5 bullets, each bold term + plain-English definition. Within the 3–6 cap. Grounds every term Lessons later uses. |
| State model | ⚠️ Correctly omitted | unchanged |
| Operations | ✅ | Capability 1 now exposes the depth-knob constraint inline. |
| Data shape | ✅ | unchanged |
| Dependencies | ✅ | unchanged |
| API endpoints | ✅ | unchanged |
| Side effects | ⚠️ Correctly omitted | unchanged |
| Coordination | ⚠️ Correctly omitted | unchanged |
| Flows | ✅ **NEW** | Single flow; Mermaid `flowchart TD`; rounded/square/diamond node shapes used per rule; Guarantees / Constraints as prose lead-ins; no sub-heading repetition. BE endpoint labels (`GET /basket/products_categories`, `GET /basket/products?filter[products_category_id]={id}`) — no method names. |
| Lessons (hard-won) | ✅ | unchanged |

### Content audit

**Core concepts (new):**

- ✅ **Category tree** correctly identifies depth as `with`-bound, not platform-bound.
- ✅ **Breadcrumb path** matches the `walkPath` implementation (`useProductCategories.ts` L83–L100).
- ✅ **Category type** enumerates `1` / `2` / `3` with correct semantics; cross-checks against `ProductCategoryTypes` enum.
- ✅ **Translated vs untranslated identity** matches the `useTranslateName` / `useTranslateField` mapper behaviour (`mappers.ts` L29–L30) — including the silent fallback.
- ✅ **Module-targeted category** matches the `module_code` / `module_sub_id` fields on `IProductCategory`.

**Operations (capability 1 depth-knob addition):**

- ✅ The "to a depth controlled by the `with` expand list" wording matches the service implementation (`services.ts` L30–L41 — four levels of `subcategories.image` repetition).
- ✅ "No paginated alternative" closes a gap r1 flagged indirectly via Lessons L225.

**Flows (new):**

- ✅ Entry node `([Storefront boot])` and terminal node `([Render category page])` use rounded brackets (rule-compliant).
- ✅ Action nodes use square brackets with BE endpoints as labels — no composable method names.
- ✅ Decision diamonds for "caller picks a category id" and "node found?" map to caller branches a real implementation handles.
- ✅ Guarantees list pulls from observable BE behaviour (single-call tree, per-node counts, translation fallback).
- ✅ Constraints list mirrors Lessons L227 / L225 / L237 / L229 / L235 without duplicating their prose verbatim — the flow's constraints are caller-planning concerns, the lessons are background-context concerns.
- ✅ No XState / actor / subscription / query-invalidation commentary inside the chart.

---

## Top 3 priorities

None blocking. The doc is publishable. Suggestion-level items below.

## Outstanding suggestions

- 🟡 **S1** (carry-over from r1): consider naming the enum inline on `category_type: 1 | 2 | 3` (e.g. `category_type: ProductCategoryTypes` with the values commented). Cosmetic.

## Appendix A: Source-of-truth references

Same as r1 — no new files consulted for r2.

## Appendix B: Verbatim evidence

- **Core concepts** — L11–L17 of post-edit candidate.
- **Capability 1 depth-knob** — L25: "Array of top-level categories, each carrying nested `subcategories` to a depth controlled by the `with` expand list…"
- **Flow** — L40–L73 of post-edit candidate.

## Appendix C: Files reviewed

Same set as r1.

## Appendix D: Strip-audit exhaustive list

Zero hits across the candidate, modulo the L9 italic meta-note (rule-compliant per the conditional-inclusion branch).
