# docs-review — invoices module (r2, independent deep tier)

Date: 2026-08-31 · Tier: deep (independent fan-out) · Supersedes the r1 self-audit.

## Why r2

r1 was authored by the same seat that wrote the docs (self-review). This run is an
independent deep fan-out — three reviewers who did not write the docs — over
foundation + the five internal docs against the module source, fixtures, and the rule.

## Reviewers + verdicts

1. **Accuracy / capability-cosplay** — docs technically accurate to the code; every API
   name, meta flag, data shape, endpoint, and the FE-3130 claim verified. No cosplay.
2. **Cross-doc contradiction / stale reference** — clean; every path, link, module name,
   type, enum, and fixture resolves. Found the foundation dependants row overclaiming
   "settlement state" and the `invoice_adjusted` framing (below).
3. **Strip / section / rule conformance** — caught the foundation regression (below);
   section set + order correct; internal docs pass the writing standard.

## Key finding — the regenerated foundation regressed (RESOLVED)

The `/docs-foundation` re-run replaced the prior committed foundation.md with a version
that documented the **client-mapped** shape instead of the **platform wire** contract:

- 🔴 `Payment.meta { isPending, isSuccessful }` in Data shape — client-derived by the
  mapper, absent from the wire fixture; a derived bag presented as platform data (and it
  reused the reserved word `meta`).
- Data shape used mapped camelCase (`summary.unpaidAmount`) instead of the wire fields
  (`unpaid_amount`, `_formatted`, `_converted`) a rebuilder needs.
- 🔴 Prescriptive "must" in Lessons.
- Dependants row overclaimed that `orders` reads this module's settlement view (it reads
  only the `Invoice` type + `mapInvoice`, re-deriving its own state).
- `products: InvoiceProduct[]` placed in a mapped block.

**Resolution:** reverted `foundation.md` to the prior committed version (`git checkout HEAD`).
That version is wire-shaped, fixture-sourced, strip-clean, and was the correct rebuild
spec. Regenerating it was the wrong call — the module's capability was unchanged this
session, so the existing foundation was already current.

## Internal-doc fixes applied

- `usage.md` — `data`/`meta` typed as `ComputedRef`; invalidate wording corrected to
  "drop the cache and re-fetch" (it triggers an immediate refetch, not merely on next read).
- `gotchas.md` — heading "must target the **exact** query key" → "must **match** the query
  key" (matching is prefix, `exact:false`).
- `README.md` — added the real **Playground** section (`playgrounds/labs/src/pages/invoices/`).
- `architecture.md` — data-flow converted from ASCII to a Mermaid `flowchart TD`.
- All five formatted (`prettier`); markdown table + spacing warnings cleared.

## Pre-existing (in the restored foundation — not introduced this session)

- `invoice_adjusted` State-model row reads "read-only from the customer side", yet the
  status enum groups ADJUSTED under UNPAID (collectible). A pre-existing framing nuance in
  the committed doc — flagged for a future foundation pass, not fixed here.
- The `paymentDetails` scope-boundary link uses camelCase; the sibling dir is
  `payment-details`. Pre-existing broken relative link in the committed doc.

## Verdict

Docs pass. Foundation is the prior-approved wire-shaped rebuild spec (restored, not the
regressed regen); the five internal docs are accurate to the flat module and fixed against
the independent review. Two pre-existing foundation nits noted for a later pass.
