# Module: contract-product

## What it is

The **contract-product** module is where a signed-in client reads and manages the individual products living inside their own contracts — the concrete, billable line items (a hosting plan, a domain, a service subscription) rather than the contract envelope that groups them. It offers two working surfaces over the same server resource: a **collection**, which lists and filters the client's own contract products for dashboards and browse views, and a **manager**, which loads one contract product in full detail and drives the small set of changes a client is allowed to make directly to it — pausing or resuming automatic renewal, choosing whether its invoices consolidate with the rest of the contract's billing, and booking or cancelling a future-dated cancellation.

It never manages the contract itself (starting a contract, changing its payment method, requesting or withdrawing a hard cancellation) — that is a sibling capability living beside this one. It also never acts on behalf of another client or on a staff operator's authority; every read and write here resolves to the signed-in client's own identity, with one narrow exception: a client can be granted delegated access to another client's products, and the collection can choose whether or not to include those alongside the client's own — there is no dedicated view of only the delegated set.

## Core concepts

- **Contract product** — one product instance inside a contract: what was bought, its billing cadence, whether it renews, and its current lifecycle status. A contract typically holds several contract products.
- **Delegated product** — a contract product belonging to a different client that the signed-in client has been granted access to. A client who has explicitly set the preference gets it honoured in either direction (excluded when set to exclude, included when set to include); a client who has never touched the preference gets delegated products **included** by default — the preference storage this module reads always resolves an untouched preference to "not excluded" before the collection ever sees it, so there is no held-preference state in which delegated products are hidden without the client asking for that. A second selector on the same collection forces exclusion off outright regardless of preference, so the client's own products and their delegated products are returned together — it is not a dedicated delegated-only view.
- **The status/setup/trial regions** — a contract product's lifecycle is reported as three simultaneous facts rather than one linear status: which of the published statuses it currently sits in (pending, awaiting activation, active, suspended, expiring, or mid-cancellation-request — outside these, the product is either staged, cancelled, lapsed, or flagged fraudulent and reported as unavailable for any action), whether its setup fields are still outstanding, and whether it is currently on a trial and how that trial is expected to end. All three are derived from one read and can be true at once — a product can be both "active" and "still in trial", for example.
- **Soft cancellation (stop/resume renewal)** — a client can stop a subscription's automatic renewal (it keeps running to its already-paid-for end date and then lapses) and can resume that renewal before it takes effect. This is distinct from a hard cancellation request, which is not part of this module.
- **Scheduled (future-dated) cancellation** — a subscription client can additionally book an exact future date on which the product will be cancelled, and can revoke that booking before it fires. A future date is only valid when it lands exactly on one of the product's own billing anniversaries (its next due date, or that date plus a whole number of billing cycles) and is not earlier than the next anniversary strictly after today; the module publishes the maths to compute and validate that date, it does not enumerate every valid date itself.
- **Invoice consolidation** — a subscription client can choose whether this product's future invoices are billed together with the rest of the contract's invoices, or kept separate.
- **Unpaid invoices** — a contract product carries its own list of recurring invoices that are currently outstanding; each is independently reported as "still due" or "still eligible to be cancelled", which are overlapping but not identical states (an adjusted invoice, for example, is still due but is no longer cancellable).

## Operations

| #   | Capability                                                                        | Inputs                                                        | Outputs                                                                                     |
| --- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 1   | **List the client's own contract products**                                       | optional filters (name, category, status, subscription/one-time, created/due date, amount), sort, pagination | A page of contract products, each with its status, product, tags, and cancellation facts |
| 2   | **Read the dashboard's grouped counts**                                           | none                                                            | Counts of active contract products grouped by category and service                          |
| 3   | **Read the categories the client has purchased into**                             | none                                                            | The distinct product categories represented across the client's own contract products        |
| 4   | **Read one contract product in full detail**                                      | a contract-product id                                           | Its status/setup/trial facts, billing cycle, catalogue product, tags, and any related contract, scheduled actions and unpaid invoices |
| 5   | **Stop automatic renewal** (a subscription product only)                          | an optional reason and custom fields                            | The renewal is stopped; the re-read product reflects the change                              |
| 6   | **Resume automatic renewal** (undo a pending stop)                                | none                                                            | The renewal is resumed; the re-read product reflects the change                              |
| 7   | **Set the invoice-consolidation preference** (a subscription product only)        | the desired consolidation setting                               | The preference is applied; the re-read product reflects it                                   |
| 8   | **Book a future-dated cancellation**                                              | a valid future anniversary date, an optional reason and custom fields | The cancellation is scheduled; the re-read product reports it as booked                  |
| 9   | **Revoke a booked future-dated cancellation**                                     | none                                                            | The booking is removed; the re-read product reports it as no longer booked                   |
| 10  | **Compute the valid future-cancellation date range**                              | the product's billing facts, and (to validate one) a candidate date | The earliest bookable date, and whether a given date lands on a valid anniversary        |
| 11  | **Judge an unpaid invoice's due/cancellable state**                               | one invoice                                                     | Whether it is still due, and whether it is still eligible to be included in a cancellation    |
| 12  | **Include or exclude delegated products from the list**                           | a client-held preference, or an explicit request to turn exclusion off | The list scope changes accordingly — delegated products join the client's own, never replace them |

**Additional always-on behaviours:**

- Reporting whether the collection, or one loaded product, is currently addressable at all (an authenticated session that can resolve a client).
- Resolving once the collection's first read has settled, or once a loaded product has been placed on a definite status.
- Forcing a re-read of the list, or of one product.
- Reporting live state flags for a loaded product — whether it is active, cancelling, staged, cancelled, lapsed, flagged fraudulent, mid-trial, mid-setup, submitting a write, or carrying an error — and reporting whether the collection's own read is loading, empty, filtered, paginated, or has failed.

## Data shape

The view model both surfaces work with:

```ts
type ContractProduct = {
  id: string;
  contractId: string;
  status?: { code: ContractStatusCode }; // one of the published contract-product status codes
  stagedImport: boolean;
  contractRequest?: { status?: { code: CancellationRequestStatusCode } };
  renew: boolean;
  billingCycleMonths: number;
  calculatedCancelDate?: string;
  provisionSetupFieldsConfirmed?: boolean;
  inTrial: boolean;
  trialEndAction: TrialEndAction; // what happens when an active trial ends
  nextDueDate?: string;
  importId?: string;
  moved: boolean;
  name: string;
  canCancel: boolean;
  isDelegatedObject: boolean;
  autoCreateRenewInvoice: boolean;
  unpaidRecurringInvoices: { status?: { code: InvoiceStatusCode } }[];
  /** The members inside each scheduled action stay in their WIRE (snake_case)
   * form, carried straight off the server record. A few other nested members
   * elsewhere in this type do too — each is flagged at its own line below.
   * Every top-level member of this type, and every member not individually
   * flagged, is renamed to camelCase by the mapper. */
  scheduledActions?: { id: string; action_code: string; status: unknown; executed_at?: string; created_at: string }[];
  /** billing_cycle_months > 0 — is this a recurring subscription, not a one-time purchase. */
  isSubscription: boolean;
  /** True once a future-dated cancellation is booked. */
  hasScheduledFutureCancellation: boolean;
  /** `provision_blueprint` also stays in its WIRE (snake_case) form. */
  product?: { id: string; name: string; image?: unknown; provision_blueprint?: unknown };
  brand?: { id: string; name: string; currency?: unknown };
  /** `show_to_customer` also stays in its WIRE (snake_case) form. */
  tags?: { id: string; name: string; colour?: string; show_to_customer: boolean }[];
  /** All three members here also stay in their WIRE (snake_case) form. */
  futureCancellationRequest?: { id: string; future_cancellation_date?: string; scheduled_for?: string; executed_at?: string };
  movedToContractProduct?: { id: string; name: string; status?: unknown; clients?: { id: string; fullname: string; email: string; image?: unknown; brand?: unknown }[] };
  /** Populated whenever the read carries the `clients` relation — every
   * collection scope, not only the delegated-inclusive one; the manager's
   * single-product read omits this relation, so it is always undefined there. */
  delegatingClients?: { id: string; fullname: string; email: string; image?: unknown; brand?: unknown }[];
  /** The unmodified server record this view model was mapped from. */
  raw: WireContractProduct;
};
```

The list-query request state — one model covering filters, sort and pagination together:

```ts
type QueryModel = {
  filters?: {
    "product.name"?: { like?: string | null };
    "product.category.name"?: { like?: string | null };
    "product.category.id"?: string | null;
    "status.code"?: ContractStatusCode | null;
    /** neq = subscriptions only; eq = one-time purchases only. */
    billing_cycle_days?: { neq?: number | null; eq?: number | null };
    created_at?: { gt?: string | null };
    next_due_date?: { gt?: string | null };
    total_amount?: number | null;
  };
  sort?: { field: "status" | "created_at" | "next_due_date" | "cancelled_date"; dir: "asc" | "desc" }[];
  pagination?: { limit?: number; offset?: number };
};
```

The write inputs:

```ts
type SoftCancelModel = { renew: boolean; reason?: string; customFields?: CustomField[] };
type SetConsolidationModel = { invoiceConsolidationEnabled: InvoiceConsolidationType };
type ScheduleCancellationModel = { futureCancellationDate: string; reason?: string; customFields?: CustomField[] };
```

The wire record underneath (`GET .../contract_products/{id}`) carries a `tags` array that the server returns but that is not yet declared on the shared platform contract-product interface; this module reads it through a local augmentation until the shared type catches up. Any `meta`/`object_meta` bag on the raw record is client-UI-specific and out of scope for this document.

## Dependencies

### Dependants — surfaces that read from this one

| Module     | What it uses                                                                                     |
| ---------- | -------------------------------------------------------------------------------------------------- |
| `contract` | Maps a contract's embedded `products` relation through this module's own mapper, and types that relation against this module's view model. A contract cannot represent its own product line items without this module. |

### This module's own dependencies

- **Session / identity** — resolves which client the signed-in caller (or a `.for()`-addressed client) is, and supplies the bearer credential every request carries.
- **HTTP transport / query layer** — request construction, response caching, cache invalidation on write, and pagination and criteria handling for the collection's list.
- **Client personal details (preferences)** — the client's held preference for whether delegated products are excluded from their own list by default; this module owns the meaning of that preference, the personal-details surface owns the storage channel.
- **Localisation** — the human-readable failure messages returned when a write does not succeed.

## API endpoints

### GET /contracts_products

Role: the collection's list read — every one of the client's own contract products (and, unless excluded, their delegated products), for browse and dashboard views. Always sent with `split_count=1` and a fixed `with` list covering the status, request, catalogue product, brand currency, cancellation and tag relations the view model reads.

```bash
curl "$API/contracts_products?with=clients,clients.image,clients.brand,status,product.image,brand.currency,product.provision_blueprint,contract_request,future_cancellation_request,moved_to_contract_product,moved_to_contract_product.clients,tags&split_count=1&exclude_delegated=1&limit=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Accept: application/json"
```

Fixture: `get-contracts-products-split-count-1.json` (response status 200).

### GET /clients/{clientId}/contracts/products

Role: the dashboard's grouped counts of ACTIVE contract products by category and service — no `exclude_delegated` narrowing.

```bash
curl "$API/clients/$CLIENT_ID/contracts/products?limit=count&group_count=products.category_id,service_identifier&filter%5Bstatus.code%5D=contract_active&sort=ASC,service_identifier&with=status,product.image,brand.currency,product.provision_blueprint,contract_request,future_cancellation_request,moved_to_contract_product,moved_to_contract_product.clients,tags" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Accept: application/json"
```

The `status.code = contract_active` filter and the `sort=ASC,service_identifier` ordering are always sent — this is a count of ACTIVE products only, not every status. `moved_to_contract_product.clients` stays in the `with` list here even though the bare `clients`/`clients.image`/`clients.brand` relations are dropped for this read (they only start with `clients`, not `moved_`).

### GET /contract_product_categories

Role: the distinct categories the client has already purchased into, carrying the same delegated-inclusion rule as the list.

```bash
curl "$API/contract_product_categories?exclude_delegated=1" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Accept: application/json"
```

### GET /contract_products/{id}

Role: the manager's single-product read — every field and relation its detailed view needs, including the parent contract, tags, scheduled actions and unpaid invoices.

```bash
curl "$API/contract_products/$CONTRACT_PRODUCT_ID?with=contract,contract.account,contract.address,contract.brand.currency,contract.cancellation_request.status,contract.cancellation_request.custom_fields.field,contract.client,contract.client.tags,contract.client.image,contract.gateway,contract.import.credentials,contract.import.source,contract.moved_to_contract,contract.moved_to_contract.products,contract.payment_details,contract.payment_details.gateway,contract.promotions,contract.status,allowed_migrations,attributes.product.image,brand,contract_request,contract_request.custom_fields.field,future_cancellation_request,options.product.image,product,product.brand.currency,product.image,product.images,product.provision_blueprint,product.provision_category,scheduled_actions,status,tags,unpaid_recurring_invoices" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Accept: application/json"
```

Thirty-five relations in total, including the whole payment-details and promotions branch on the parent contract, and the moved-to-contract branch used when the product has moved.

```json
{
  "status": "ok",
  "data": {
    "id": "de78642d-e539-7147-e37a-21208469530d",
    "contract_id": "785d26e9-6783-d16e-deeb-314502e70439",
    "product_id": "2785d26e-9678-3d16-934b-314502e70439",
    "name": "Single Use Promo",
    "staged_import": false,
    "quantity": 1
  },
  "related": null,
  "error": null,
  "messages": [],
  "meta": null
}
```

Fixture: `get-contract-products-id.json` (excerpted; response status 200).

### PUT /contracts/{contractId}/products/{contractProductId}/modify_renew

Role: stops or resumes automatic renewal — `renew: false` stops it, `renew: true` resumes it. A subscription product only.

```bash
curl -X PUT "$API/contracts/$CONTRACT_ID/products/$CONTRACT_PRODUCT_ID/modify_renew" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"renew": false}'
```

Fixtures: `put-contracts-id-products-id-modify-renew-case-stop.json` (`{"renew": false}`, 200), `put-contracts-id-products-id-modify-renew-case-resume.json` (`{"renew": true}`, 200).

### PUT /contracts/{contractId}/products/{contractProductId}/properties

Role: sets the invoice-consolidation preference.

```bash
curl -X PUT "$API/contracts/$CONTRACT_ID/products/$CONTRACT_PRODUCT_ID/properties" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"invoice_consolidation_enabled": 2}'
```

Fixture: `put-contracts-id-products-id-properties.json` (200).

### PUT /contracts/{contractId}/products/{contractProductId}/schedule-cancel

Role: books a future-dated cancellation on a valid billing anniversary.

```bash
curl -X PUT "$API/contracts/$CONTRACT_ID/products/$CONTRACT_PRODUCT_ID/schedule-cancel" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"future_cancellation_date": "2026-10-21"}'
```

Fixture: `put-contracts-id-products-id-schedule-cancel.json` (200).

### PUT /contracts/{contractId}/products/{contractProductId}/schedule-cancel-revoke

Role: revokes a booked future-dated cancellation. No body.

```bash
curl -X PUT "$API/contracts/$CONTRACT_ID/products/$CONTRACT_PRODUCT_ID/schedule-cancel-revoke" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

Fixture: `put-contracts-id-products-id-schedule-cancel-revoke.json` (`{}`, 200).

## Failure modes

- **An unauthenticated or unaddressable caller** — every read and write rejects rather than silently returning nothing, so a caller cannot mistake "not signed in" for "the client has no products".
- **An unrecognised status code** — a product whose status does not match any of the module's published codes never resolves to any lifecycle node at all: the load step records the fact on the failure/error property but does not transition the product onward. A caller's readiness check therefore never resolves, and every status/setup/trial flag stays at its initial not-yet-loaded value indefinitely; the product does not report itself as "active" or as anything else, it simply never finishes loading. This is a genuine gap rather than a design choice — an unexpected new server status silently strands the product instead of misreporting it, and nothing but the stuck error flag signals the caller.
- **A write attempted from the wrong lifecycle point** — stopping/resuming renewal or setting consolidation on a one-time (non-subscription) product is refused rather than sent to the server; a caller checks the relevant state flag first. Booking a future-dated cancellation carries NO such client-side check: the module sends whatever date the caller supplies, valid anniversary or not, and the module publishes the maths (see Compute the valid future-cancellation date range) purely as a helper — a caller that wants to refuse an invalid date must call it and check the result itself before booking.
- **A second write while one is already in flight** — the module resolves the product to one definite state before accepting the next write; a caller that fires a second write while the first is still processing is left to the same one-write-at-a-time discipline the platform enforces generally.

## Lessons (hard-won)

- **A contract product's lifecycle is three parallel facts, not one status string.** A product can be simultaneously "active" and "on a trial that is ending soon" and "setup is still incomplete" — treating status/setup/trial as one linear state loses information a caller needs (e.g. a client should see both "your subscription is active" and "finish your setup" at once, not one or the other).
- **"Not cancellable yet" and "not due" are different facts about the same unpaid invoice.** An invoice that has already been adjusted is still due (it must still be paid or resolved) but is no longer eligible to be swept up into a cancellation; conflating the two under a single "unpaid" flag would let a caller offer to cancel an invoice that the server will refuse.
- **A future cancellation date is only valid on a billing anniversary.** It is not simply "today or later" — a client-picked date has to land exactly on the product's next-due-date, or that date plus a whole number of billing cycles, and not fall before the next anniversary that is still strictly in the future. A caller building a date picker needs both the earliest bookable date and a per-date validity check, not just a minimum bound.
- **Delegated-product visibility defaults to included, not excluded, when the client has never touched the preference.** The exclusion seam has a branch that would exclude delegated products by default whenever the client actually has any and no preference is held, but the preference this module actually reads is sourced from a store that coerces an untouched value to "not excluded" before it ever reaches that seam — so that branch never fires in the shipped module, and a client who has never opened the setting sees their delegated products alongside their own. A caller that wants delegated products hidden by default has to set the preference itself; the module will not do it unasked.
- **The billing-anniversary maths is a helper, not a gate.** The write that books a future cancellation sends whatever date it is given — the module never refuses an off-anniversary date itself. A caller that wants that refusal to be client-side (rather than discovered from the server's response) has to call the minimum-date and validity helpers and act on the result before sending the write.
