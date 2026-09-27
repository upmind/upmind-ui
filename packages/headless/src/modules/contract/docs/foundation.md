# Module: contract

## What it is

The **contract** module is where a signed-in client reads their own contracts — the envelope that groups a set of billable products together (a hosting plan, a domain, a subscription) under one billing relationship and one payment method. It offers two working surfaces over the same server resource: a **collection**, which pages through the client's own contracts for browse and dashboard views, and a **manager**, which loads one contract in full detail and drives the one change a client makes directly to the contract envelope itself: which stored payment method or gateway pays its future invoices.

The contract does not manage what happens to the individual products living inside it — starting, cancelling (in any of its forms — end-of-term, immediate, or a future-dated booking), or adjusting invoice consolidation for one product is a sibling module's responsibility, addressed at that one product. A contract only groups the ids of the products it holds; it is not where a change to one of them is made. It also never acts on behalf of another client or on a staff operator's authority — every read and write here resolves to the signed-in client's own identity.

## Core concepts

- **Contract** — the billing envelope a client owns: its own lifecycle status, its own pending hard-cancellation request status (if any), the stored payment method that pays its future invoices, and the ids of the products it groups.
- **The status region** — a contract's lifecycle is reported as a single published status node (pending, awaiting activation, active, suspended, or mid-cancellation-request), or as one of three unavailable nodes (cancelled, lapsed, or flagged fraudulent) when it has left the live set entirely.
- **The payment-method form** — the one write a client makes on the contract envelope itself: picking a different stored payment method (or none) to pay the contract's future invoices. It is offered on every live status node, and — narrower than the rest of the contract's surface — also on a cancelled or lapsed contract (a client may still want to keep a valid card on file even after cancellation); it is refused only when the contract is flagged fraudulent. Submitting the SAME method the contract already uses, or no method at all, is a deliberate no-op: nothing is sent to the server, and the caller gets back `false` rather than a request.
- **A contract's products** — the contract's single-record read carries each of its products with the status, catalogue product, tags and brand-currency facts the contract's own page reads; it deliberately does NOT carry any product's cancellation facts (whether a request is pending, whether a future date is booked) — a caller who needs those for one product loads that product directly through the sibling module.

## Operations

| #   | Capability                                                                   | Inputs                                   | Outputs                                                                                     |
| --- | ------------------------------------------------------------------------------ | ------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| 1   | **Page through the client's own contracts**                                 | pagination only (no filter, no sort)      | A page of contracts, each with its status and cancellation-request status, and no product detail |
| 2   | **Read one contract in full detail**                                        | a contract id                             | Its status and cancellation-request status, its payment-method id, and its products' status/catalogue/tag/currency facts |
| 3   | **See which stored payment methods can currently be picked**                | none                                       | The client's own stored payment methods, reused from the sibling payment-details surface with no extra request |
| 4   | **Set which stored payment method pays the contract's future invoices**     | a stored payment method's id               | The contract's payment method is updated; the re-read contract reflects it. A no-op (nothing sent) when the id names no method, or the method the contract already uses |

**Additional always-on behaviours:**

- Reporting whether the collection, or one loaded contract, is currently addressable at all (an authenticated session that can resolve a client).
- Resolving once the collection's first read has settled, or once a loaded contract has been placed on a definite status.
- Forcing a re-read of the list, or of one contract.
- Reporting live state flags for a loaded contract — whether it is active, cancelling, cancelled, lapsed, flagged fraudulent, submitting a write, or carrying an error — and reporting whether the collection's own read is loading or has failed.
- The payment-method form stays open, mid-edit or mid-submit, without moving the contract off its current status — a client can be mid-way through changing the payment method on a contract still reported as "active" (or "cancelled") until the write actually settles.

## Data shape

The view model both surfaces work with:

```ts
type Contract = {
  id: string;
  status: { code: ContractStatusCode }; // one of the published contract status codes
  cancellationRequest?: { status?: { code: CancellationRequestStatusCode } };
  /** The stored method that pays the contract today — read by the payment-method form's no-op check. */
  paymentDetailsId?: string;
  /** Each product's status, catalogue product, tags and brand currency — NOT its cancellation facts. */
  products: ContractProduct[];
  /** The unmodified server record this view model was mapped from. */
  raw: WireContract;
};
```

The list-query request state — pagination only, no filter and no sort column (the contracts list has no client caller of a filtered/sorted view in the legacy product; every client screen reads the per-product collection instead):

```ts
type QueryModel = {
  pagination?: { limit?: number; offset?: number };
};
```

The write input:

```ts
type SetPaymentMethodModel = { paymentDetailsId: string };
```

Any `meta`/`object_meta` bag on the raw record is client-UI-specific and out of scope for this document.

## Dependencies

### Dependants — surfaces that read from this one

None found — no other module in this codebase imports from `contract`. It is a leaf consumer of `contract-product` and `payment-details`, not a dependency of either.

### This module's own dependencies

- **Session / identity** — resolves which client the signed-in caller is, and supplies the bearer credential every request carries.
- **HTTP transport / query layer** — request construction, response caching, cache invalidation on write, and pagination handling for the collection's list.
- **contract-product** — the module whose mapper and view model this module reuses to type and map its own `products` relation; a contract cannot represent its own product line items without it.
- **payment-details** — the client's stored payment methods, reused with no extra request (the manager awaits the sibling composable's own list query rather than issuing a duplicate read), and that module's own stored-card schema/uischema pair, reused to build this module's payment-method form control.
- **Localisation** — the human-readable failure messages returned when a write does not succeed.

## API endpoints

### GET /contracts

Role: the collection's pagination-only list read — the client's own contracts, one page at a time, with just enough relations for `mapContract` to read each row's status and cancellation-request status.

```bash
curl "$API/contracts?with=status,cancellation_request,cancellation_request.status&limit=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Accept: application/json"
```

This read does NOT request `products` — a list row always maps `products: []`. The client's products surface is the sibling module's own collection (`GET contracts_products`), with its own with-list, paging and delegated-product rules; the single-contract read below carries the products for the one contract that is opened.

### GET /contracts/{id}

Role: the manager's single-contract read — the contract's own status and cancellation-request facts, its payment method, and each of its products' status/catalogue/tag/brand-currency facts (not their cancellation facts).

```bash
curl "$API/contracts/$CONTRACT_ID?with_staged_imports=1&with=products.product.image,products.product.brand.currency,cancellation_request,products.status,products.tags,client.image,status,cancellation_request.status" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Accept: application/json"
```

```json
{
  "status": "ok",
  "data": {
    "id": "785d26e9-6783-d16e-d4ef-314502e70439",
    "status_id": "4d036794-24d0-e710-94a3-153698d582e8",
    "next_due_date": "2025-11-22",
    "payment_details_id": null,
    "billing_cycle_months": 1
  },
  "related": null,
  "error": null,
  "messages": [],
  "meta": null
}
```

Fixture: `get-contracts-id-with-staged-imports-1.json` (excerpted; response status 200) — recorded before the current `with` list was narrowed to drop the product cancellation members, so its captured request `with` string is wider than what the module sends today; the response body's own fields remain a true sample.

### PATCH /contracts/{id}/payment_details

Role: sets which stored payment method (or gateway) pays the contract's future invoices.

```bash
curl -X PATCH "$API/contracts/$CONTRACT_ID/payment_details" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"payment_details_id": "785d26e9-6783-d16e-738f-314502e70439"}'
```

Fixture: `patch-contracts-id-payment-details.json` (response status 200).

## Failure modes

- **An unauthenticated or unaddressable caller** — every read and write rejects rather than silently returning nothing, so a caller cannot mistake "not signed in" for "the client has no contracts".
- **An unrecognised status code** — a contract whose status does not match any of the module's published codes never resolves to any lifecycle node at all: the load step records the fact on the failure/error property but does not transition the contract onward. A caller's readiness check stalls for the full 60-second wait and then resolves `false`; the contract does not report itself as "active" or as anything else — it never finishes loading.
- **A no-op payment-method submission is not an error** — submitting the form with no method selected, or with the method the contract already uses, resolves `false` rather than rejecting or sending a request. A caller distinguishing "nothing changed" from "the write failed" reads the resolved value, not a caught exception, for the first case.
- **A second write while one is already in flight** — the module resolves the contract to one definite state before accepting the next write; a caller that fires a second write while the first is still processing is left to the same one-write-at-a-time discipline the platform enforces generally.
- **Submitting the open form with an invalid selection** — the module validates the open form's model against its own schema before any request leaves; an invalid model never reaches the server, and the form's own error state reports the rejection.

## Lessons (hard-won)

- **A contract's payment method is a contract-level fact, not a per-product one.** A contract may hold several products; no single product answers for which method pays the contract's invoices, so this write lives on the contract manager even though every cancellation write for the products it groups does not.
- **The payment-method form's no-op refusal lives in the action layer, not as a machine guard.** The legacy screen this module ports refuses to send a request when nothing actually changed (the selected method already matches, or nothing was selected) — that refusal is a plain comparison against the loaded contract's own `paymentDetailsId`, made before the write event is even sent, not a state-machine transition guard.
- **The contracts list is pagination-only because nothing in the product it ports ever filtered or sorted it.** Every client screen that lists a client's holdings reads the sibling per-product collection instead, which does carry a full filter/sort/pagination surface; this collection exists to page through contract envelopes, not to be a second, narrower version of that same list.
- **A contract's own read deliberately narrows what it asks for on each product.** Loading a contract in full detail is not "read everything every product surface can offer" — it reads exactly the product fields the contract's own page shows (status, catalogue product, tags, currency) and none of a product's cancellation facts, because those are read once the client opens that ONE product directly.
- **Reusing the sibling stored-payment-methods read avoids a duplicate request.** The payment-method form's options come from awaiting the client's own stored-payment-methods composable rather than issuing a second, parallel fetch of the same data — if that composable's own read is slow or fails, the form degrades to an empty options list rather than blocking or failing the contract's own load.
