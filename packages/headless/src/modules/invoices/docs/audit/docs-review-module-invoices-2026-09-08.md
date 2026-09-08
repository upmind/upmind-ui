# docs-review — invoices module (2026-09-08, documenter self-audit, deep tier)

Supersedes `docs-review-module-invoices-2026-08-31-r2.md`: the module converted from a
flat single-read shape to a scoped, query-backed collection + single read since that
audit, and the doc set is regenerated in full against the landed code.

## Scope

Full set: `foundation.md`, `README.md`, `usage.md`, `architecture.md`, `gotchas.md`,
`CHANGELOG.md`. Reviewed against: the module's 15 source files, the eight captured
fixtures, `packages/types/src/models/invoices.ts`, the knowledge graph
(`graphify query "packages/headless/src/modules/invoices"` /
`get_neighbors invoices/index.ts`), and `docs-modules.md` (foundation lane).

## Strip audit (foundation.md)

`grep -niE` sweep for implementation method names, internal store/query-key names,
framework leaks, SDD/process vocabulary, and prescriptive verbs — **0 hits** (every
apparent match was a false positive: "present", "PRESENT key", "presentation",
"read this first" — none is a banned token). No `useX`, `.as(`, `.for(`, `computed(`,
`ref(`, `watch(`, `criteria`, `TanStack`, `JSONSchema`, `AC-N`, `D1..D6`, `@decision`,
`FE-####`, `verify.md`/`parity.yaml` reference, or seat/verdict vocabulary anywhere in
the file.

## Section audit (foundation.md)

| Section | Status |
| --- | --- |
| What it is | ✅ present, updated for the `client×client` capability and the corrected sibling-scope note |
| Core concepts | ✅ present, category/attribution/entitled-reading concepts added |
| State model | ✅ present, unaffected by this conversion, kept |
| Operations | ✅ present, expanded 5 → 6 BE-call rows + a 6-row derived-capability sub-table (was folded into 5 rows conflating BE calls with client derivations) |
| Data shape | ✅ present, corrected + extended (`products_count`, `delegate_related` cross-reference, unpaid-amount response shape added) |
| Dependencies | ✅ present, dependants table corrected (see Falsehood 3) |
| API endpoints | ✅ present, 1 → 4 endpoints |
| Flows | ✅ present, kept (still accurate — payment lifecycle unaffected by this story) |
| Lessons | ✅ present, 2 falsehoods removed, 4 new lessons added |

No optional section included without justification; no section omitted that the
content requires.

## Content audit — the six falsehoods (design.md) + one found in this pass

| # | Claim | Corrected |
| --- | --- | --- |
| 1 | `category.slug` restricted list + "informational" | Exact 8-value enum from `packages/types/src/models/invoices.ts:129-138`; reframed as load-bearing (credit-note mechanic, consolidation label precedence) |
| 2 | "a client can only see their own invoices" | Replaced with the entitled-other-client capability, in "What it is", Core concepts, and Operations |
| 3 | "No other headless module reads from invoices" | Replaced with a receipted `orders` dependant row (`order.machine.ts:4`,`:176`) |
| 4 | §Operations declared 5 capabilities | Now 6 BE-call rows + 6 derived-capability rows, covering all 15 source files' exposed surface incl. lifecycle |
| 5 | Refresh-after-payment assigned solely to invoices | Reframed as "the list's refresh is also what a payment-outcome signal triggers" — this module's own refetch capability, without claiming the trigger itself |
| 6 | §API-endpoints documented only `GET /invoices/{id}` | Now 4 endpoints: list, single read, unpaid-amount, payment-method write |
| 7 (found this pass) | Operations row "read the post-redirect outcome from the URL" and the "routing" dependency bullet | Removed — `grep -rl "payment_success\|routing"` over the module's 15 `.ts` files returns **no match**; this capability was never implemented by this module's source and was a pre-existing doc overreach, not part of design.md's six |

## Content audit — mechanical checks

- **Dependants table vs the graph**: `get_neighbors invoices/index.ts` (205 nodes) shows exactly one cross-module headless edge into the barrel (`order.machine.ts`) plus the playground page (presentation layer, not a headless module). Table reflects both; no dependant dropped.
- **Endpoint URLs/methods vs services**: `GET /invoices`, `GET /invoices/{id}`, `GET /invoices/unpaid_amount/{id}`, `PATCH /invoices/{id}/payment_details` all verified against `invoices.services.ts`'s `useUrl(...)` calls.
- **Samples fixture-sourced**: list and single-read samples trimmed from the 8 captured fixtures under `__tests__/fixtures/`; the payment-method write has no captured fixture and is marked `// stubbed` per the rule's drafting allowance, rather than hand-crafted and presented as real.
- **Relative links**: every link in the five markdown files resolved with `realpath`/existence checks — 12/12 resolve (sibling foundation docs, fixture references, ADR-001, and the five intra-doc links).
- **Client-only bag note**: fixtures show `meta`, `object_meta`, and `object_meta_data` on invoice rows (`get-invoices-case-default.json`); the top-of-doc note covers all three, once.

## README / usage / architecture / gotchas (docs-writing.md lane)

- `usage.md` cross-checked member-by-member against `useInvoices.context.ts` /
  `.meta.ts` / `.actions.ts` and `useInvoice.context.ts` / `.meta.ts` / `.actions.ts` —
  every exported member is named; two omissions (`findOne`/`getOne`, `destroy` on both
  composables, `isAvailable` on the collection meta) were caught and added during this
  pass.
- `gotchas.md` carries all five gotchas named in the dispatch brief, each labelled
  🧪 or plain per whether a test scenario applies, plus the pre-existing frozen-snapshot
  and money-flavour items carried from the prior committed version.
- `architecture.md` data-flow diagram redrawn for the two-composable, four-read shape;
  sub-units table lists all 15 module files.
- `CHANGELOG.md` records the conversion, the breaking `useInvoice(id)` →
  `useInvoice().withId(id)` change with a migration snippet, and carries the FE-3130
  fix forward.

## Scoring

| Category | Score | Notes |
| --- | --- | --- |
| Technical accuracy | 94 | All six briefed falsehoods + one additional found-and-fixed; every endpoint/field verified against source or fixture |
| Completeness | 90 | Operations, Data shape, API endpoints all expanded to the landed surface; PATCH endpoint sample is stubbed (no fixture exists) — disclosed, not hidden |
| Structure | 95 | Canonical section order; no missing required section; no unjustified optional section |
| Tone | 96 | Strip audit clean; descriptive throughout; no prescriptive verbs |
| Actionability | 92 | An architect could rebuild list + single-read + count + write from this doc; the two flows sections are unaffected by this story and still hold |

**Overall: 93/100.**

🔴 Critical: 0
🟡 Warning: 0

## Verdict

Docs pass. Every falsehood the dispatch named is corrected with a receipt, one further
overreach was found and removed, the doc set now covers the full landed surface
(list, single read, unpaid-amount re-read, existence/consolidatable counts, the
payment-method write, credit notes, attribution, bundling), and nothing in the set
certifies a capability outside the verifier's PRESENT table. No repair cycle needed.
