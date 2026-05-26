# Audit: orders foundation doc

- **Date:** 2026-05-16
- **Reviewer:** docs-module-review (automated loop, iteration 1)
- **Candidate:** `packages/headless/src/modules/orders/docs/foundation.md`
- **Prior review:** none (first audit)
- **Module:** orders

---

## Executive summary

| Category | Score |
| --- | --- |
| Technical accuracy | 92 |
| Completeness | 90 |
| Structure | 90 |
| Tone | 70 |
| Actionability | 88 |
| **Overall** | **86** |

Verdict: **pass with fixes**. The doc scopes itself honestly to invoice-payment orchestration, the State-model use is justified by the platform-defined `InvoiceStatus` enum, the typed-fixture cross-reference holds, and Flows are well-modelled. The score is dragged down by Tone: the Dependencies and Lessons sections leak our orchestrator vocabulary (`subscribing`, "spawns a paymentDetail child", "Orders invokes payment as a child machine", "as a TanStack query"), and the internal type name `lastPaymentModel` is referenced repeatedly across Operations / Data shape / Flows / Lessons.

---

## Part 2: Fresh full audit

### Strip audit

| Severity | Line(s) | Pattern | Quote |
| --- | --- | --- | --- |
| 🔴 | 343 | Composable method name leak | `No headless module imports `useOrder`.` |
| 🔴 | 350 | Reactive-stack state vocabulary | `… `UNAUTHENTICATED` returns the surface to `subscribing`.` |
| 🔴 | 352 | spawn / actor / child framing | `Orders spawns a paymentDetail child each time it enters the collect-payment surface (re-spawned per retry / partial loop …); the picker fires `PAYMENT_DETAILS` back to orders …` |
| 🔴 | 353 | child machine framing | `Orders invokes payment as a child machine, hands it the `orderId` and `paymentDetail`, and observes its terminal state …` |
| 🔴 | 354 | framework leak (TanStack) | `… not as a TanStack query that the presentation layer reads independently` |
| 🔴 | 354 | internal function name | `the mapper (`mapInvoice`) is reused.` |
| 🟠 | 56, 326–333, 543, 546, 610 | Internal type name | `lastPaymentModel` referenced as a named concept five times across Operations, Data shape, Flows, Lessons. It is our internal `LastPaymentModel` type name; the platform truth is "the gateway selections from the prior attempt"; naming the type is a code-side leak. |
| 🟠 | 343 | Implementation-choice commentary | `The graph extraction reports inbound edges from `paymentDetails`, `payment`, and `invoices`, but those edges are either type-name collisions … or co-references through shared interfaces, not actual code dependencies.` — useful as a footnote, but currently reads as our codebase-extraction commentary rather than as architectural fact. |
| 🟠 | 626 | "our implementation" commentary | `… the orders module ships the long `with` string unchanged because removing fragments piecemeal courts undercount bugs downstream.` |
| 🟡 | 13 | Type-alias side note | `Type alias: `IOrder = IInvoice`.` — true, but a code-side artefact in a Core concepts bullet. |

### Section audit

| Section | Status | Notes |
| --- | --- | --- |
| Header | ✅ | `# Module: orders` |
| What it is | ✅ | Scope demarcation against basket, invoices, paymentDetails, payment is explicit and correct. Subscription-management forwarding is in the right place. |
| `meta` note | ✅ | Conditional rule satisfied; both `meta` and `object_meta` confirmed in fixture. |
| Core concepts | ✅ | 6 terms — within budget; "Payment attempt", "Partial payment", "Wallet draw", "Invoice category", "Contract linkage" are all referenced downstream. |
| State model | ⚠️ justified | Platform-defined `InvoiceStatus` enum from `packages/types/src/data/enums/invoice.ts`; verbatim match with source. Caller observes via `status.code`. Justification is sound. |
| Operations | ✅ | 10 capabilities + 3 always-on behaviours — under the 12 cap. Coverage matches the `useOrder` exported surface (`pay`, `retry`, `refresh`, `renderChallenge`, `completeChallenge`, `cancelChallenge`, derived surface flags). |
| Data shape | ✅ | Typed contract cross-reference correct (`IInvoice` extends `IBasket`); fields beyond the typed contract not over-included. `LastPaymentModel` shape matches `order.types.ts`. |
| Dependencies | ✅ (one-row dependants with footnote) | Verified: no other `packages/headless/src/modules/*` file imports from `../orders`. Footnote correctly explains the graph false-positives (type-name collision on `IOrder = IInvoice`). |
| API endpoints | ✅ | Sample comes from real fixture; trimmed; `meta` stripped from sample body; full-fixture pointer included. |
| Flows | ✅ | Three flowcharts, `flowchart TD`, rounded/square/diamond nodes used. `Guarantees` / `Constraints` prose lead-ins (not sub-headings). |
| Lessons | ✅ | 17 lessons; most are stated as problems. A few leak vocabulary (`lastPaymentModel`, "the orders module ships … unchanged because …"). |

### Content audit

**Capabilities** — all 10 map to source. `meta` flags (`isLoading`, `isComplete`, `isProcessing`, `isPaymentDue`, `isPending`, `needsApproval`, `isRenderingChallenge`, `isUnavailable`, `isLocked`, `isFree`, `isPartial`, `hasError`, `isAuthenticated`) map to capability #2 ("Determine payment surface"). Good fold; the always-on behaviours block correctly carries readiness, auth tracking, locked-invoice signal outside the 12-cap table.

**Data shape** — `IInvoice` extends `IBasket` confirmed; fields shown match the fixture (`number`, `paid_amount`, `unpaid_amount`, `payment_failed_attempts`, `auto_cancel_date`, `locked`, `current_data.content`, etc.). `Payment` shape matches fixture (`captured`, `refunded`, `transaction_id`, `pending`). `Contract` shape matches `IContract` typed contract.

**Dependants** — verified by grep: zero cross-module imports `from "../orders"` anywhere under `packages/headless/src/modules/`. Footnote is necessary and accurate.

**API endpoints** — `GET /invoices/{id}` with the long `with=` chain matches `order.services.ts:32–51` verbatim. Delegated endpoints (`POST /payments`, `GET /payment_details`, `PATCH /orders/{id}/convert`) are correctly attributed to sibling modules.

**Lessons** — 17 entries. The "lessons describe problems, not solutions" rule holds in 14/17. Three drift into solution-shape territory: the `lastPaymentModel` bullet implicitly names our caching strategy; the "long `with` string unchanged" bullet narrates our implementation choice; the "filter on `captured: 1 && refunded: 0`" bullet edges into prescriptive territory but is borderline since the field names are platform truths.

---

## Top 3 priorities

1. **🔴 Strip orchestrator vocabulary from Dependencies (lines 343–354).** Rewrite the dependants paragraph and the "own dependencies" bullets to drop `useOrder`, `subscribing`, "spawns a paymentDetail child", "child machine", "as a TanStack query", and `mapInvoice`. Use framework-neutral language: "the payment-method picker delegated to `paymentDetails`", "the actual payment submission delegated to `payment`", "the invoice read delegated to `invoices`'s shared client", etc.
2. **🟠 Replace `lastPaymentModel` with a framework-neutral name across Operations, Data shape, Flows, and Lessons.** Either inline as "the retained gateway selections" / "the prior-attempt selections", or introduce one neutral Core-concept term (e.g. **Retained selections**) and use it consistently. The TypeScript snippet in Data shape can stay (it's a real wire shape) but rename the type.
3. **🟠 Soften "our implementation" commentary in Lessons (line 626) and Dependencies (line 343).** The `with=` lesson can stand as "Trimming individual `with=` fragments per consumer surface risks undercount bugs downstream" without the "the orders module ships … unchanged" framing. The dependants footnote can drop the "graph extraction reports" framing and state the architectural fact directly: "The module is a terminal consumer; type-name collisions in cross-module graphs are an artefact of `IOrder` being a re-exported alias for `IInvoice`."

---

## Appendix A: Source-of-truth references

- `packages/headless/src/modules/orders/useOrder.ts` (lines 36–215)
- `packages/headless/src/modules/orders/order.machine.ts` (lines 36–169 — state names, services, guards)
- `packages/headless/src/modules/orders/order.services.ts` (lines 19–58 — `with=` chain and query options)
- `packages/headless/src/modules/orders/order.types.ts` (lines 22–54 — `LastPaymentModel`, `OrderContext`)
- `packages/headless/src/modules/orders/order.utils.ts` (lines 28–52 — `spawnOrderPaymentDetail`)
- `packages/types/src/data/enums/invoice.ts` (lines 1–17 — `InvoiceStatus`, `InvoiceStatusGroups`)
- `tests/__fixtures__/recordings/get-invoices-63250798-065d-1e20-388f-8174e234e98d.json` — verified both `meta` and `object_meta` present
- `graphify-out/graph.json` — verified no cross-module dependants of `orders/`

## Appendix D: Strip-audit exhaustive list

| Line | Hit | Severity |
| --- | --- | --- |
| 13 | "Type alias: `IOrder = IInvoice`" | 🟡 |
| 56 | "`lastPaymentModel` (gateway id, amount, wallet draw) is preserved" | 🟠 |
| 326–333 | TS `type LastPaymentModel` shown with framing "Persisted retry selections (in-memory only)" | 🟠 |
| 343 | "No headless module imports `useOrder`" | 🔴 |
| 343 | "The graph extraction reports inbound edges …" | 🟠 |
| 350 | "returns the surface to `subscribing`" | 🔴 |
| 352 | "Orders spawns a paymentDetail child each time …"; "fires `PAYMENT_DETAILS` back to orders" | 🔴 |
| 353 | "Orders invokes payment as a child machine, hands it the `orderId` …" | 🔴 |
| 354 | "not as a TanStack query that the presentation layer reads" | 🔴 |
| 354 | "the mapper (`mapInvoice`) is reused" | 🔴 |
| 543 | `Persist { gateway_id, wallet_amount, amount } as lastPaymentModel` (in mermaid) | 🟠 |
| 546 | `paymentDetails re-spawned seeded from lastPaymentModel` (in mermaid) | 🟠 |
| 610 | "The `lastPaymentModel` (gateway id, …) is in-memory only" | 🟠 |
| 626 | "the orders module ships the long `with` string unchanged because removing fragments piecemeal courts undercount bugs downstream" | 🟠 |
