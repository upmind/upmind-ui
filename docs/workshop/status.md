# Contabo workshop — status

> Living progress tracker. Update when something lands. Pairs with `contabo.md` (locked plan). Reference `.agent/rules/docs-modules.md` for the canonical rule and `docs/adr/019-module-doc-shape.md` for the locked-decision rationale.

**Last updated:** 2026-05-16 (autonomous orchestration run complete)
**Branch:** `feature/graphify+docs`
**Current focus:** All pre-workshop deliverables landed. Ready for spot-check + handover bundle build.

---

## Deliverables snapshot

| Deliverable | Status | Notes |
| --- | --- | --- |
| Working prototype | ⏳ Workshop-day | Built during the 2-day session, not pre-work |
| Module reference docs | ✅ 13/13 in scope | Avg ~94/100. `currency` skipped (type-only); `orders` merged into `invoices` |
| Foundations chapter | ✅ Done | `docs/workshop/foundations.md` (571 lines, self-scored 91/100) |
| Build-your-own-core guide | ✅ Done | `docs/workshop/build-your-own-core.md` (732 lines) — 6 sections, 7 design decisions, 18 pitfalls |
| Workshop initiator (kickoff prompt) | ✅ Done | `_initiator/generic.md` + `cursor.md` (331 lines) + `claude-code.md` (507 lines) |
| SDDs per feature | ✅ 8/8 done | `00-scaffold` · `01-auth` · `02-brand-bootstrap` · `03-catalogue` · `04-basket` · `05-checkout-address` · `06-payment` · `07-panel` (1259 lines total) |
| Handover bundle manifest | ✅ Done | `docs/workshop/bundle-manifest.md` |
| Bundle build script | ✅ Done | `docs/workshop/build-bundle.sh` — dry-run produced 122 files, 12 module foundations, 8 SDDs, 93 fixtures |
| Fixture index | ✅ Done | `docs/workshop/references/fixture-index.md` (93 fixtures indexed) |
| Autonomous-run summary | ✅ Done | `docs/workshop/HANDOFF.md` — decisions made, spot-check items, what's left |

---

## Autonomous-run plan

Author returns later today or tomorrow. Until then, I'm orchestrating the remaining deliverables via background agents under `docs/workshop/` only.

**Waves:**

1. **Foundations chapter** + **cursor.md initiator** (parallel background)
2. **claude-code.md initiator** (after cursor lands; reads cursor + generic as base)
3. **8 SDDs** in 2 parallel batches of 4 (after foundations lands)
   - Batch A: 00-scaffold, 01-auth, 02-brand-bootstrap, 03-catalogue
   - Batch B: 04-basket, 05-checkout-address, 06-payment, 07-panel
4. **build-your-own-core** (single agent, after SDDs land)
5. **Bundle manifest** + **fixture index skeleton** + **cross-ref pass** + **HANDOFF.md** (me, foreground)

Auto-commit per landed artefact. No push.

---

## Module reference docs

13 in scope, all complete. Convention codified in `.agent/rules/docs-modules.md`.

| # | Module | Status | Score | Audit |
| --- | --- | --- | --- | --- |
| 1 | `session` | ✅ Complete | 95 | `docs/audit/docs-module-review-session-2026-05-16.md` |
| 2 | `client` | ✅ Complete | ~92 | `docs/audit/docs-module-review-client-2026-05-16.md` |
| 3 | `basket` | ✅ Complete | 95 | `docs/audit/docs-module-review-basket-2026-05-15.md` |
| 4 | `basketProduct` | ✅ Complete | 95 | `docs/audit/docs-module-review-basketProduct-2026-05-16.md` |
| 5 | `product` | ✅ Complete | 95 | `docs/audit/docs-module-review-product-2026-05-16.md` |
| 6 | `productCatalogue` | ✅ Complete | 94 | `docs/audit/docs-module-review-productCatalogue-2026-05-16.md` |
| 7 | `productCategories` | ✅ Complete | 94 | `docs/audit/docs-module-review-productCategories-2026-05-16-r2.md` |
| 8 | `payment` | ✅ Complete | 92 | `docs/audit/docs-module-review-payment-2026-05-16.md` |
| 9 | `paymentDetails` | ✅ Complete | ~95 | `docs/audit/docs-module-review-paymentDetails-2026-05-16-r3.md` |
| 10 | ~~`orders`~~ | ⚪ Merged into `invoices` | — | `IOrder` is an alias of `IInvoice` |
| 11 | `invoices` | ✅ Complete | ~95 | `docs/audit/docs-module-review-invoices-2026-05-16-r2.md` |
| 12 | `currency` | ⚪ Skipped (type-only) | — | Coverage absorbed by `system` / `brand` / `basket` |
| 13 | `brand` | ✅ Complete | 95 | `docs/audit/docs-module-review-brand-2026-05-16.md` |
| 14 | `system` | ✅ Complete | 92 | `docs/audit/docs-module-review-system-2026-05-16.md` |

**Average score across the 11 in-scope docs:** ~94/100.

---

## Workflow + tooling

| Asset | Status |
| --- | --- |
| `/docs-module` skill (producer) | ✅ `.agent/workflows/docs-module.md` |
| `/docs-module-review` skill (reviewer) | ✅ `.agent/workflows/docs-module-review.md` — Golden-free workflow |
| Canonical rule | ✅ `.agent/rules/docs-modules.md` — sharpened with 7 review cycles' worth of patterns |
| Writing standard | ✅ `.agent/rules/docs-writing.md` |
| Review standard | ✅ `.agent/rules/docs-reviews.md` |
| Fixture capture (recording proxy) | ✅ Used heavily across the 11 module docs |

---

## Patterns codified into the rule

Lifted from 7+ module reviews into `.agent/rules/docs-modules.md`:

1. **Meta-note conditional** — italic note only when payload-level `meta` exists.
2. **Scope boundaries between sibling modules** — `product` / `basketProduct`, `basket` / `basketProduct`, `session` / `client`, `paymentDetails` / `payment` / `invoices` / `basket` each demarcate ownership and forward edge cases.
3. **Producer-side strip list** expanded — operation queue, pending product, silent mode, schema framing, Bundle, DeepLinkConfig, Reconfigure flow, sub-track / module-emits vocabulary all listed as forbidden.
4. **Dependants table direction** — explicit grep-verify before regenerating; app-level concerns (`query`, `routing`, `datamanager`) excluded.
5. **Capability count overflow guidance** — fold endpoint families, lift lifecycle to always-on sub-list, move derivations to "Derived from a loaded X" sub-table.
6. **Three lesson-pattern examples** — mutation-returns-full-object diff gotchas; X-id parameter recomputation cost; input-vocabulary vs resolved-record-vocabulary distinction.

---

## Open questions

None currently — autonomous run executing against locked defaults.

---

## Change log

- *2026-05-16* — Initial status artefact after 7/14 modules complete.
- *2026-05-16 (later)* — All 13 in-scope module docs complete; autonomous run started for Foundations chapter, SDDs, build-your-own-core, remaining initiator layers. Scope locked to `docs/workshop/`.
- *2026-05-16 (autonomous run complete)* — All pre-workshop deliverables landed. Foundations chapter, 2 additional initiator layers, 8 SDDs, build-your-own-core, fixture index, bundle manifest + verified build script all in place. ~3300 net lines across 11 commits. See [HANDOFF.md](./HANDOFF.md) for decisions made + spot-check list.
