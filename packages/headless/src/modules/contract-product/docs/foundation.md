# Module: contract-product

## What it is

The **contract-product** module is where a signed-in client reads and manages the individual products living inside their own contracts — the concrete, billable line items (a hosting plan, a domain, a service subscription) rather than the contract envelope that groups them. It offers two working surfaces over the same server resource: a **collection**, which lists and filters the client's own contract products for dashboards and browse views, and a **manager**, which loads one contract product in full detail and drives every change a client is allowed to make directly to it — pausing or resuming automatic renewal, requesting or withdrawing an immediate cancellation, booking or revoking a future-dated cancellation, and choosing whether its invoices consolidate with the rest of the contract's billing.

Cancellation of every kind is this module's responsibility, not the contract's: a contract only holds the list of product ids it groups, and every write that changes what happens to a product — including an immediate ("hard") cancellation request historically thought of as a contract-level action — is this module's write, addressed at one product at a time. The sibling **contract** module keeps exactly one write of its own: changing which stored payment method pays the contract's future invoices. It also never acts on behalf of another client or on a staff operator's authority; every read and write here resolves to the signed-in client's own identity, with one narrow exception: a client can be granted delegated access to another client's products, and the collection can choose whether or not to include those alongside the client's own — there is no dedicated view of only the delegated set.

## Core concepts

- **Contract product** — one product instance inside a contract: what was bought, its billing cadence, whether it renews, and its current lifecycle status. A contract typically holds several contract products.
- **Delegated product** — a contract product belonging to a different client that the signed-in client has been granted access to. The list sends an exclude-delegated flag on every read. When nothing is delegated to the client, the flag is always "exclude", whatever choice was held before. When something is delegated, the flag follows the client's held choice, and with no choice held it is "include". A second selector on the same collection forces exclusion off outright regardless of the choice, so the client's own products and their delegated products are returned together — it is not a dedicated delegated-only view.
- **One-off purchases hidden by the brand** — a brand can hide one-off (non-recurring) purchases from its portal. When it does, the list always excludes them, and the filter that would ask for them is not offered.
- **The status/setup/trial regions** — a contract product's lifecycle is reported as three simultaneous facts rather than one linear status: which of the published statuses it currently sits in (pending, awaiting activation, active, suspended, expiring, or mid-cancellation-request — outside these, the product is either staged, cancelled, lapsed, or flagged fraudulent and reported as unavailable for any action), whether its setup fields are still outstanding, and whether it is currently on a trial and how that trial is expected to end. All three are derived from one read and can be true at once — a product can be both "active" and "still in trial", for example.
- **The cancellation form is one combined form, not three separate calls.** A client picks one of up to three cancellation options — cancel at end of term ("soft"), cancel immediately ("hard"), or book a future date — and the ONE form's chosen option decides which write actually goes out. All three options are computed from the record itself: which of them is offered at all depends on the product's own facts, never on a brand setting or a separate permission read.
  - **Soft cancellation (stop/resume renewal)** — a client can stop a subscription's automatic renewal (it keeps running to its already-paid-for end date and then lapses) and can resume that renewal before it takes effect.
  - **Hard cancellation (immediate request)** — a client can ask staff to cancel a subscription product straight away, and can withdraw that request while it is still pending. This is a genuinely different capability from a scheduled cancellation: a hard request asks for review, a scheduled one books an exact date with no review at all.
  - **Scheduled (future-dated) cancellation** — a subscription client can additionally book an exact future date on which the product will be cancelled, and can revoke that booking before it fires. A future date is only valid when it lands exactly on one of the product's own billing anniversaries (its next due date, or that date plus a whole number of billing cycles) and is not earlier than the next anniversary strictly after today; the module publishes the maths to compute and validate that date, it does not enumerate every valid date itself.
  - **The whole form disappears, rather than offering a refused option, once**: the subscription has already stopped renewing with a calculated end date (auto-expiring), a hard request is already pending, or a future cancellation is already booked. Each of the three options additionally has its own narrower condition (a live subscription that is not already pending, for the soft and scheduled options; the platform's own cancellable flag, for the hard option; a computable billing anniversary, for the scheduled option).
- **Invoice consolidation** — a subscription client can choose whether this product's future invoices are billed together with the rest of the contract's invoices, or kept separate. The form is offered only to a live (not staged), non-cancelled, non-lapsed subscription whose client-level consolidation preference is enabled or inherited and whose catalogue product itself allows consolidation.
- **Unpaid invoices** — a contract product carries its own list of recurring invoices that are currently outstanding; each is independently reported as "still due" or "still eligible to be cancelled", which are overlapping but not identical states (an adjusted invoice, for example, is still due but is no longer cancellable).

## Operations

| #   | Capability                                                                        | Inputs                                                        | Outputs                                                                                     |
| --- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 1   | **List the client's own contract products**                                       | an optional quick-search term (minimum 3 characters), optional filters (name, category, status, subscription/one-time, created/due date, amount), sort, pagination | A page of contract products, each with its status, product, tags, and cancellation facts |
| 2   | **Read the dashboard's grouped counts**                                           | none                                                            | Counts of active contract products grouped by category and service                          |
| 3   | **Read the categories the client has purchased into**                             | none                                                            | The distinct product categories represented across the client's own contract products        |
| 4   | **Read one contract product in full detail**                                      | a contract-product id                                           | Its status/setup/trial facts, billing cycle, catalogue product, tags, and any related contract, scheduled actions and unpaid invoices |
| 5   | **Open the combined cancellation form and see which options it currently offers** | none                                                             | The options this product allows right now (some subset of soft / hard / scheduled), or none at all |
| 6   | **Stop automatic renewal** (soft cancellation; a subscription product only)        | an optional reason and custom fields                             | The renewal is stopped; the re-read product reflects the change                              |
| 7   | **Resume automatic renewal** (undo a pending stop)                                | none                                                            | The renewal is resumed; the re-read product reflects the change                              |
| 8   | **Request an immediate cancellation** (hard cancellation)                         | an optional reason and custom fields                             | A cancellation request is opened against the product; the re-read product reports it as mid-request |
| 9   | **Withdraw a pending immediate-cancellation request**                             | none                                                            | The pending request is withdrawn; the product returns to its prior status                    |
| 10  | **Book a future-dated cancellation**                                              | a valid future anniversary date, an optional reason and custom fields | The cancellation is scheduled; the re-read product reports it as booked                  |
| 11  | **Revoke a booked future-dated cancellation**                                     | none                                                            | The booking is removed; the re-read product reports it as no longer booked                   |
| 12  | **Set the invoice-consolidation preference** (open the form, then set it)         | the desired consolidation setting                                | The preference is applied; the re-read product reflects it. A choice equal to the current setting is not sent |
| 13  | **Compute the valid future-cancellation date range**                              | the product's billing facts, and (to validate one) a candidate date | The earliest bookable date, and whether a given date lands on a valid anniversary        |
| 14  | **Judge an unpaid invoice's due/cancellable state**                               | one invoice                                                     | Whether it is still due, and whether it is still eligible to be included in a cancellation    |
| 15  | **Include or exclude delegated products from the list**                           | a client-held choice, or an explicit request to turn exclusion off | The list scope changes accordingly — delegated products join the client's own, never replace them. Always excluded when nothing is delegated |

**Additional always-on behaviours:**

- Reporting whether the collection, or one loaded product, is currently addressable at all (an authenticated session that can resolve a client).
- Resolving once the collection's first read has settled, or once a loaded product has been placed on a definite status.
- Forcing a re-read of the list, or of one product.
- Paging the list forward keeps the total the first page reported; the total is read only once the list's own addressability check has passed.
- Reporting live state flags for a loaded product — whether it is active, cancelling, staged, cancelled, lapsed, flagged fraudulent, mid-trial, mid-setup, submitting a write, or carrying an error — and reporting whether the collection's own read is loading, empty, filtered, paginated, or has failed.
- Both the cancellation form and the consolidation form stay open, mid-edit or mid-submit, without moving the product off its current status — a client can be mid-way through cancelling a product that is still reported as, say, "active" until the write actually settles.

## Data shape

The view model both surfaces work with:

```ts
import type {
  CancellationRequestStatusCodes,
  ContractStatusCodes,
  IContractProduct,
  InvoiceConsolidationTypes,
  InvoiceStatus,
  TrialEndActionTypes
} from "@upmind-automation/types";

type ContractProduct = {
  id: string;
  contractId: string;
  status?: { code: ContractStatusCodes }; // one of the published contract-product status codes
  /** The owning contract's own status code — the hard-cancellation gate reads it (a hard request cannot be opened on a pending contract). */
  contractStatus?: ContractStatusCodes;
  stagedImport: boolean;
  /** `id` is the pending request's own id — withdrawing a hard cancellation sends it back. */
  contractRequest?: { id?: string; status?: { code: CancellationRequestStatusCodes } };
  renew: boolean;
  billingCycleMonths: number;
  calculatedCancelDate?: string;
  /** Display descriptor for `calculatedCancelDate` (formatted "MMM Do, YYYY" plus a relative form); empty when the date is absent. */
  dateCalculatedCancel: { date?: string | null; relative?: string | null };
  provisionSetupFieldsConfirmed?: boolean;
  inTrial: boolean;
  trialEndAction: TrialEndActionTypes; // what happens when an active trial ends
  nextDueDate?: string;
  /** Display descriptor for `nextDueDate`, same shape as `dateCalculatedCancel`. */
  dateNextDue: { date?: string | null; relative?: string | null };
  /** Display descriptor for the purchase date (the wire `created_at`), same shape. */
  dateCreated: { date?: string | null; relative?: string | null };
  importId?: string;
  moved: boolean;
  name: string;
  /** The display name — the shared product title over this contract product, e.g. "Starter Hosting (testdomain.com)". Without a catalogue product: the product's own name, then its service identifier in brackets. */
  title: string;
  /** The formatted price: the recurring price for a subscription, the discounted price for a one-off purchase. */
  priceFormatted: string;
  /** One price string: `priceFormatted` trimmed of trailing zeros, then the lower-cased billing cycle for a subscription — "£4 monthly", "£60". */
  priceTermSummary: string;
  canCancel: boolean;
  isDelegatedObject: boolean;
  autoCreateRenewInvoice: boolean;
  /** Each row is the invoice's line for this product; its status arrives on the wire as `invoice_status`, not `status`. */
  unpaidRecurringInvoices: { status?: { code: InvoiceStatus } }[];
  /** The members inside each scheduled action stay in their WIRE (snake_case)
   * form, carried straight off the server record. A few other nested members
   * elsewhere in this type do too — each is flagged at its own line below.
   * Every top-level member of this type is renamed to camelCase by the
   * mapper. Nested members are not: `delegatingClients[]` and
   * `movedToContractProduct.clients[]` both carry `fullname` straight off the
   * wire, and each other nested exception is flagged at its own line below. */
  scheduledActions?: { id: string; action_code: string; status: unknown; executed_at?: string; created_at: string }[];
  /** billing_cycle_months > 0 — is this a recurring subscription, not a one-time purchase. */
  isSubscription: boolean;
  /** True once a future-dated cancellation is booked. */
  hasScheduledFutureCancellation: boolean;
  /** The owning CLIENT's (not the product's) invoice-consolidation preference — one of "enabled" / "disabled" / "inherit". The consolidation form is offered only when this is "enabled" or "inherit" AND the catalogue product below allows it. */
  clientInvoiceConsolidationEnabled?: InvoiceConsolidationTypes;
  /** `provision_blueprint` also stays in its WIRE (snake_case) form; `invoice_consolidation_enabled` is the catalogue product's own consolidation switch, read alongside the client preference above. */
  product?: { id: string; name: string; image?: unknown; provision_blueprint?: unknown; invoice_consolidation_enabled?: boolean };
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
  raw: IContractProduct;
};
```

The list-query request state — one model covering filters, sort and pagination together:

```ts
import type { ContractStatusCodes } from "@upmind-automation/types";

type QueryModel = {
  filters?: {
    "product.name"?: { like?: string | null };
    "product.category.name"?: { like?: string | null };
    "product.category.id"?: string | null;
    "status.code"?: ContractStatusCodes | null;
    /** neq = subscriptions only (and the brand-forced one-off hide); eq = one-off purchases only. */
    billing_cycle_days?: { neq?: number | null; eq?: number | null };
    created_at?: { gt?: string | null };
    next_due_date?: { gt?: string | null };
    total_amount?: number | null;
  };
  /** The quick-search term — a sibling of `filters`, not a filter leaf; minimum 3 characters. */
  query?: string | null;
  sort?: { field: "status" | "created_at" | "next_due_date" | "cancelled_date"; dir: "asc" | "desc" }[];
  pagination?: { limit?: number; offset?: number };
};
```

The write inputs. `SoftCancelModel`, `RequestCancellationModel` and `ScheduleCancellationModel` are the three shapes the ONE combined cancellation form can carry, routed by whichever option the client picked — a client never fills in more than one of them at a time:

```ts
import type { InvoiceConsolidationTypes } from "@upmind-automation/types";

/** `{ [fieldCode]: value }` — see below. */
type CustomFieldValues = Record<string, unknown>;

type SoftCancelModel = { renew: boolean; reason?: string; customFields?: CustomFieldValues };
type RequestCancellationModel = { productIds: string[]; reason?: string; customFields?: CustomFieldValues }; // immediate ("hard") cancellation; always this one product's id
type ScheduleCancellationModel = { futureCancellationDate: string; reason?: string; customFields?: CustomFieldValues };
type SetConsolidationModel = { invoiceConsolidationEnabled: InvoiceConsolidationTypes };
```

`customFields` on every cancellation model is a plain `{ [fieldCode]: value }` map, not the definition-shaped list the platform's custom-field type uses elsewhere — the fields on offer come from the brand's own cancellation-request field catalogue, not from this module.

The wire record underneath (`GET .../contract_products/{id}`) carries a `tags` array that the server returns but that is not yet declared on the shared platform contract-product interface; this module reads it through a local augmentation until the shared type catches up. Any `meta`/`object_meta` bag on the raw record is client-UI-specific and out of scope for this document.

## Dependencies

### Dependants — surfaces that read from this one

| Module     | What it uses                                                                                     |
| ---------- | -------------------------------------------------------------------------------------------------- |
| `contract` | Maps a contract's embedded `products` relation through this module's own mapper, and types that relation against this module's view model. A contract cannot represent its own product line items without this module. |

### This module's own dependencies

- **Session / identity** — resolves which client the signed-in caller (or a `.for()`-addressed client) is, and supplies the bearer credential every request carries. It also reports whether anything is delegated to the client, which decides the exclude-delegated flag.
- **HTTP transport / query layer** — request construction, response caching, cache invalidation on write, and pagination and criteria handling for the collection's list.
- **Client personal details (preferences)** — the client's held choice for whether delegated products are excluded from their own list; this module owns the meaning of that preference, the personal-details surface owns the storage channel.
- **Localisation** — the human-readable failure messages returned when a write does not succeed.
- **Brand** — the portal brand's tax type (for the formatted price) and its one-off-purchases visibility setting (for the forced hide).
- **Product titles** — the shared product title and product name rules the display title is built from.

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

Role: the manager's single-product read — every field and relation its detailed view needs, including the parent contract, its own pending cancellation-request custom fields, tags, scheduled actions and unpaid invoices. This read also settles the CANCEL_REQUEST custom-field catalogue alongside it, in the same load, so the cancellation form has its field definitions the moment it opens.

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

### POST /contracts/{contractId}/cancel/request

Role: requests an immediate ("hard") cancellation. Contract-scoped by URL, but this module addresses it for ONE product at a time — the body always names exactly one product id, this product's own.

```bash
curl -X POST "$API/contracts/$CONTRACT_ID/cancel/request" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"product_ids": ["<this product'"'"'s own id>"], "cancellation_reason": "no longer needed"}'
```

Fixture: `post-contracts-id-cancel-request.json` (200) — recorded under the sibling `contract` module's fixtures, since the URL is shared across both modules' test suites.

### DELETE /contracts/{contractId}/cancel/request

Role: withdraws a pending immediate-cancellation request, naming the request's own id (not the product's).

```bash
curl -X DELETE "$API/contracts/$CONTRACT_ID/cancel/request" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"contract_request_id": "<the pending request'"'"'s own id>"}'
```

Fixture: `delete-contracts-id-cancel-request.json` — recorded under the sibling `contract` module's fixtures; the recorded capture is a `404` (no live pending request to withdraw at capture time), so a 200 success shape is not yet on file.

## Failure modes

- **An unauthenticated or unaddressable caller** — every read and write rejects rather than silently returning nothing, so a caller cannot mistake "not signed in" for "the client has no products".
- **An unrecognised status code** — a product whose status does not match any of the module's published codes settles on the module's error state at once: the settled read is checked against one ordered list of status conditions, and a record that matches none records a status error. A caller's readiness check resolves `false` immediately, with no wait. The product never reports itself as "active" or as any other status. A fresh read re-runs the load and re-checks the status.
- **A write attempted from the wrong lifecycle point** — stopping/resuming renewal or setting consolidation on a one-time (non-subscription) product is refused rather than sent to the server; a caller checks the relevant state flag first. Booking a future-dated cancellation carries NO such client-side check: the module sends whatever date the caller supplies, valid anniversary or not, and the module publishes the maths (see Compute the valid future-cancellation date range) purely as a helper — a caller that wants to refuse an invalid date must call it and check the result itself before booking.
- **A second write while one is already in flight** — the module resolves the product to one definite state before accepting the next write; a caller that fires a second write while the first is still processing is left to the same one-write-at-a-time discipline the platform enforces generally.
- **Submitting the open form with an invalid selection** — the module validates the open form's model against its own schema before any request leaves; an invalid model (a missing required field, a `SCHEDULE_FUTURE` option with no date) never reaches the server at all, and the form's own error state reports the rejection.
- **A permission check this module does not make** — the platform's own cancellation and consolidation permission model is not read here at all: the module offers every option its record facts allow, with no separate permission read behind it (see Lessons).

## Lessons (hard-won)

- **A contract product's lifecycle is three parallel facts, not one status string.** A product can be simultaneously "active" and "on a trial that is ending soon" and "setup is still incomplete" — treating status/setup/trial as one linear state loses information a caller needs (e.g. a client should see both "your subscription is active" and "finish your setup" at once, not one or the other).
- **"Not cancellable yet" and "not due" are different facts about the same unpaid invoice.** An invoice that has already been adjusted is still due (it must still be paid or resolved) but is no longer eligible to be swept up into a cancellation; conflating the two under a single "unpaid" flag would let a caller offer to cancel an invoice that the server will refuse.
- **A future cancellation date is only valid on a billing anniversary.** It is not simply "today or later" — a client-picked date has to land exactly on the product's next-due-date, or that date plus a whole number of billing cycles, and not fall before the next anniversary that is still strictly in the future. A caller building a date picker needs both the earliest bookable date and a per-date validity check, not just a minimum bound.
- **The exclude-delegated flag depends on whether anything is delegated at all.** A client with nothing delegated always sends "exclude", so a previously held "include" choice has no effect for them. A client with delegated products gets their held choice, and "include" when none is held. The list read is gated on the client id alone, not on the held choice, so the first read can go out with "include" before a stored "exclude" choice has loaded.
- **The billing-anniversary maths is a helper, not a gate.** The write that books a future cancellation sends whatever date it is given — the module never refuses an off-anniversary date itself. A caller that wants that refusal to be client-side (rather than discovered from the server's response) has to call the minimum-date and validity helpers and act on the result before sending the write.
- **The whole cancellation form vanishes rather than degrading to a smaller offer.** Once auto-expire is already set up, a hard request is already pending, or a future date is already booked, the module offers NONE of the three cancellation options — not "whichever ones still make sense". A caller cannot assume seeing zero options means "cancellation is unsupported for this product" versus "cancellation is already in motion for this product"; the record's own request/schedule/renewal facts distinguish the two, the options list alone does not.
- **The consolidation and cancellation forms read no permission and no brand setting.** Both are gated purely on the product/client record facts this module already reads — a live, non-staged subscription and the client's own consolidation preference for consolidation; the record's cancellation and scheduling facts alone for cancellation. The platform's own actor-permission model (whether this particular signed-in identity is allowed to modify this product at all) is a known gap, not a considered omission — a caller relying on this module to enforce that permission is relying on something it does not do.
