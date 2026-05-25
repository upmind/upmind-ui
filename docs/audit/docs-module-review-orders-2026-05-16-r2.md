# Audit: orders foundation doc (revision 2)

- **Date:** 2026-05-16
- **Reviewer:** docs-module-review (automated loop, iteration 2)
- **Candidate:** `packages/headless/src/modules/orders/docs/foundation.md` (after r1 fixes applied)
- **Prior review:** `docs/audit/docs-module-review-orders-2026-05-16.md`
- **Module:** orders

---

## Executive summary

| Category | Score (r1 → r2) | Delta |
| --- | --- | --- |
| Technical accuracy | 92 → 93 | +1 |
| Completeness | 90 → 90 | 0 |
| Structure | 90 → 92 | +2 |
| Tone | 70 → 92 | +22 |
| Actionability | 88 → 90 | +2 |
| **Overall** | **86 → 91.4** | **+5.4** |

Verdict: **pass**. Tone violations from r1 are resolved across Dependencies, Operations, Data shape, Flows, and Lessons. The `lastPaymentModel` internal-name leak is replaced consistently with the framework-neutral "retained selections" Core-adjacent concept. Dependants footnote now reads as architectural fact, not as graph-extraction commentary.

---

## Part 1: Delta vs prior review

| Prior issue | Status | Evidence |
| --- | --- | --- |
| 🔴 `No headless module imports useOrder` (line 343) | ✅ FIXED | Rewritten to "The orders module is a terminal consumer — no other headless module reads its surface." |
| 🔴 "returns the surface to `subscribing`" (line 350) | ✅ FIXED | Rewritten to "loss of authentication returns the surface to a pre-load state." |
| 🔴 "Orders spawns a paymentDetail child" / "fires `PAYMENT_DETAILS` back" (line 352) | ✅ FIXED | Rewritten to "Orders starts a fresh picker each time it enters the collect-payment surface … consumes the picker's resolved selection." |
| 🔴 "Orders invokes payment as a child machine" (line 353) | ✅ FIXED | Rewritten to "Orders hands across the invoice id and the resolved payment selection, then observes the outcome." |
| 🔴 "not as a TanStack query that the presentation layer reads independently" (line 354) | ✅ FIXED | Rewritten to "rather than reading a presentation-layer cache." |
| 🔴 "the mapper (`mapInvoice`) is reused" (line 354) | ✅ FIXED | Rewritten to "reuses the shared invoice mapper so the loaded record matches every other surface that reads invoices." |
| 🟠 `lastPaymentModel` named across Operations / Data / Flows / Lessons | ✅ FIXED | Replaced with "retained selections" everywhere; the TS shape type renamed `RetainedSelections`. A clarifying note added at the bottom of Operations explains the term. |
| 🟠 "The graph extraction reports inbound edges …" footnote (line 343) | ✅ FIXED | Reframed: "Cross-module edges that surface in graph extractions trace to the `IOrder` / `IInvoice` type alias … and to co-references through shared invoice interfaces, not to runtime dependencies." |
| 🟠 "the orders module ships the long `with` string unchanged because removing fragments piecemeal courts undercount bugs downstream" (line 626) | ✅ FIXED | Reframed to: "Trimming individual `with=` fragments per consumer surface risks undercount bugs downstream — once the long `with=` chain serves multiple sub-views, removing fragments piecemeal makes the source of a missing field hard to trace." |
| 🟡 "Type alias: `IOrder = IInvoice`" (line 13) | ✅ FIXED | Sentence removed. |

### New issues

None of critical or warning severity.

### New strengths

- The new "retained selections" framing in Operations (always-on behaviours block) makes the in-memory cache an architectural fact rather than a producer-side concept. The TS snippet in Data shape uses a neutral name (`RetainedSelections`) that an architect rebuilding the platform could adopt without inheriting our internal type.
- The dependants paragraph now states the architectural truth (terminal consumer; type-alias collisions are graph artefacts) without naming the extraction tool. This is the right framing for an architect reading the doc.

---

## Part 2: Fresh full audit (delta only — full audit in r1)

### Strip audit

No critical or warning hits. Spot-checked:

- `useOrder`, `subscribing`, `spawn`, `TanStack`, `XState`, `mapInvoice`, `lastPaymentModel`, `computed(`, `ref(`, `child machine`, `child actor`, `our implementation`, `we chose`, `we split` — zero matches.

### Section audit

Unchanged from r1: every required section present, State model justified, optional sections (Core concepts, Flows) included with justification. One residual lint diagnostic on line 65 (blank line around list after the new "retained selections" callout) — markdown polish, not in scope.

### Content audit

Unchanged from r1 — technical claims still hold against source.

---

## Top 3 outstanding suggestions (post-90)

These are 🟡 polish only — none would push the score materially. Listed for completeness.

1. **🟡 Markdown lint sweep.** Pre-existing diagnostics on lines 56 (table-column-count on the Operations row 9 — long cell text), 498/537/626/628 (emphasis-style asterisk vs underscore on `*current*` / `*refresh*` / etc.), and 65 (blanks-around-lists after the new callout). All pre-date this review; not in the top-3-by-severity-x-ease budget.
2. **🟡 Consider promoting "retained selections" to a Core concept** so the term enters the Core concepts list (currently introduced inline in the Operations always-on block). Would lift Structure a point.
3. **🟡 Operations row 7 still ends with the phrase "the customer does not re-enter the same selections."** Could shorten to "the customer does not re-enter the prior selections." Pure prose polish.

---

## Appendix A: Source-of-truth references

Unchanged from r1.

## Appendix C: Files reviewed this iteration

- `packages/headless/src/modules/orders/docs/foundation.md` (post-r1 edits)
- `docs/audit/docs-module-review-orders-2026-05-16.md` (prior review for delta)

## Appendix D: Strip-audit exhaustive list

Zero remaining critical or warning hits. The doc passes the strip checklist.
