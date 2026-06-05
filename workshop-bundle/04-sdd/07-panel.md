# SDD 07 — Confirmation + customer panel (reads + targeted management)

## Goal

After payment lands (feature 6), the visitor is routed to `/confirmation/{invoiceId}` — a receipt-shaped surface showing the just-issued invoice number, totals, line items, and a "your subscription is active / go to the panel" CTA. From there the customer panel exposes:

1. **Reads** — panel home (client identity + lists of active subscriptions and invoices), invoice detail page, subscription detail page. The bulk of the panel surface area.
2. **Targeted management surfaces** — add a stored payment method (using the `paymentDetails` `add` context, distinct from checkout's `buy` context); CRUD on the client's address book; CRUD on the client's phones; add new emails to the client record; CRUD on the client's company records. These exist because real customers need to update billing details and keep cards on file between purchases — without them the panel is a museum, not a tool.

Out of scope here (post-workshop iteration): cancellation, suspension, upgrades, refunds, downgrade flows, contract migration UI.

## Depends on

- Feature 6 (Payment) — produces the invoice id the confirmation page renders; if the payment landed `WAITING`, the confirmation page re-uses feature 6's poll helper to wait for terminal state
- Feature 1 (Auth) — every panel read **and write** requires a client token; guest tokens are rejected by `GET /invoices/{id}` (invoices foundation doc, capability 1)
- Feature 2 (Brand bootstrap) — the panel header renders brand identity (logo, name) supplied by the brand record
- Feature 5 (Checkout address) — sub-record CRUD shapes (`POST/PUT/DELETE /clients/{clientId}/addresses` etc.) are documented and partially exercised; this feature re-uses the same shapes from the management surfaces rather than only the checkout surface
- Feature 6 (Payment) — `paymentDetails` capture flow; this feature re-uses the same SDK handshake but with `gateway_context: "add"` instead of `"buy"`

## Modules consumed

- `invoices` — see [02-module-foundations/invoices.md](../02-module-foundations/invoices.md) (reads — confirmation, invoice list, invoice detail, contract detail)
- `client` — see [02-module-foundations/client.md](../02-module-foundations/client.md) (reads for the panel header from cached `/self`; **writes** for address / phone / email / company CRUD from the management surfaces)
- `paymentDetails` — see [02-module-foundations/paymentDetails.md](../02-module-foundations/paymentDetails.md) (capture surface — `gateway_context: "add"` for the panel's "add a card" flow; same SDK handshake as feature 6 but the resulting `SelectPaymentMethodData` is stored against the client rather than submitted to a payment)

## Reads (before generating any code)

- `06-initiator/generic.md` — sections 9 (validation checklist) and 10 (operating principles, especially #1 spec over guess, #6 host = brand domain)
- `03-foundations-chapter.md` — full (HTTP envelope §1.3, error model §4, refresh-replay §2.5; the panel surface is reads-only and benefits most from §1 + §4)
- `02-module-foundations/invoices.md` — full, including the `Contract` data shape used by the subscription detail surface and the Lessons section (status flicker, frozen client snapshot, `with=` shaping the payload)
- `02-module-foundations/client.md` — sections relevant to `/self` and identity (the customer panel reads the cached client record; no new endpoint is hit here)

## What this feature does

1. **Post-payment hand-off.** Feature 6 has just settled (or initiated) a payment against the basket-turned-invoice. On its terminal branch (`approved` or `WAITING`), feature 6 navigates the browser to `/confirmation/{invoiceId}`. This feature does not own the navigation — it owns what renders when the route mounts.
2. **Confirmation page mount.** Issue `GET /invoices/{invoiceId}` with the canonical wide `with=` expand: `brand,taxes,client,status,contract,address,address.country,payments,payments.payment_details,products,promotions,products.product.image,taxes.tax_tag_data,custom_fields.field` (per the invoices foundation doc, API endpoints). The wide expand is by design — the same load serves the receipt today and the detail page tomorrow without re-fetching.
3. **Confirmation surface decision.** Read `status.code` and the status groups:
   - `invoice_paid` (PAID group) → render the receipt surface (invoice number, totals, line items, "subscription is active", CTA to `/panel`).
   - `invoice_unpaid` + any `payments[].pending === true` → render a "we're confirming your payment" surface and re-enter feature 6's poll helper against the same invoice id. Don't re-implement polling here.
   - `invoice_unpaid` with no pending payment → the user landed here via direct URL or feature 6 short-circuited; surface a "this invoice isn't paid yet" message with a CTA back to the payment surface (out of scope to re-host the payment UI in this feature — just link to it).
4. **Confirmation totals.** Render strictly from server-computed fields — `total_amount_formatted`, `paid_amount_formatted`, `currency.code` / `currency.prefix`. Per-line: name, quantity, `total_amount_formatted`. Do not arithmetic-derive anything from the raw numbers — the invoice's `_formatted` fields already carry locale + currency-symbol (invoices Lessons: "Money fields come in three flavours").
5. **Panel route mount (`/panel`).** Don't re-fetch `/self` — feature 1 has already cached the client record. Read it from the cache and render the header (name, primary email, avatar). If the cache is empty (cold-tab entry to `/panel` while a stored token is valid), feature 1's auth bootstrap path runs and the panel surface waits for its readiness signal before rendering.
6. **Panel — list invoices.** Issue `GET /api/invoices` with this canonical query shape (**pinned from a workshop run, do not re-derive**):

   ```
   GET /api/invoices
     ?with=client,client.image,status,products
     &with_count=products
     &order=-create_datetime
     &skip_count=1
     &limit=20
     &lang=en
   ```

   **Key facts that cost time in previous workshops:**
   - **Top-level path: `/api/invoices`.** NOT a sub-resource. `/clients/{id}/invoices`, `/clients/self/invoices`, `/me/invoices`, `/clients/{id}/orders` all 404. The customer-token bearer implicitly scopes the result to the authenticated client; **do not pass `filter[client_id]`** — it's neither required nor useful, and adding it as a "defensive" measure can mask the scoping logic.
   - **Do NOT pass `filter[category.slug]` defensively.** The reference frontend uses a category filter only when surfacing a specific "purchases" tab. Setting it as a general filter on the panel list HIDES invoices in other categories. Omit the filter; render every category the bearer scopes to.
   - **`with_count=products` adds a server-side count of the named relation** to each row's envelope (useful for the "3 items" badge). Cheap on the server.
   - **`skip_count=1`** tells the platform NOT to compute the total — saves a server-side COUNT(*). Use it on the list call unless you need pagination cursors. For "X of Y" UI, issue a separate `limit=count` call (see step 7).
   - **`order=-create_datetime`** sorts newest-first.

   Render each row as `InvoiceRow` (number, status code + display name, total formatted, currency, created date, products count). Page 1 only; pagination is out of scope.
7. **Panel — invoice stat cards (optional).** For "X invoices total" / "Y unpaid" / "$Z paid this year" stat cards, issue **count-only** reads using the `limit=count` magic value:

   ```
   GET /api/invoices?limit=count          # returns envelope.total without rows
   GET /api/invoices?limit=count&filter[status.code]=invoice_unpaid
   ```

   `limit=count` is a documented platform convention (see foundations §1.2 query conventions) — the platform skips the row fetch and returns only `envelope.total`. Use it for dashboard-style summary cards rather than fetching a page and counting client-side.

   > **WARNING — `filter[status.code]=invoice_paid` is unreliable for "paid" counts.** A workshop test surfaced a $198 paid invoice that the filter missed (probably because the actual status.code was a transitional state at the moment of capture). For paid-count derivation, **fetch the list and count with the same predicate the row badges use** — see step 9's three-signal paid-detection rule. Single source of truth between the badge and the count.
8. **Panel — list subscriptions.** Issue a list-style read for the client's contracts. **Confirm the exact endpoint from invoices foundation doc / source-of-truth before generating** — the foundation doc describes the `Contract` record as embedded on every recurring invoice and reads via the contract id, but does not enumerate a top-level "list my contracts" endpoint. **If absent, this is a gap.** Two viable shapes to investigate during the workshop: (a) a dedicated contracts list endpoint, (b) deriving the subscription list from the invoices list by collecting unique `contract_id`s and expanding `contract` on each. Document whichever lands.
9. **Determine "paid" using a three-signal predicate, not just `status.code`.** A naive `status.code === "invoice_paid"` misses transitional / consolidated / partially-paid invoices that are effectively paid. The defensive predicate uses three OR signals:
    ```ts
    function isPaid(inv: Invoice): boolean {
      return (
        inv.status.code.toLowerCase().includes("paid") ||
        inv.payments?.some(p => p.captured === 1 && p.refunded === 0 && !p.pending) ||
        inv.paid_amount_formatted === inv.total_amount_formatted
      );
    }
    ```
    Use the same predicate for the row badge AND for any stat-card count. Single source of truth between badge and count. Cross-ref: generic.md operating principle 18.
10. **Invoice detail route (`/panel/invoices/{invoiceId}`).** Same fetch as the confirmation page (step 2) with the same `with=` expand. Renders the same data shape with richer chrome: full billing address, full payment history (filtered to `captured === 1 && refunded === 0` per invoices Lessons), tax breakdown, status badge. Re-uses the confirmation page's view model — the only differences are the route, the chrome, and the surface decision (no polling here; if it's still pending, render "pending" inline and let the user refresh manually). **Status-check the response:** if `status.code` includes `draft`, the URL is pointing at a pre-converted basket (basket and invoice share the UUID — see generic.md operating principle 16); refuse to render and route the user back to their cart.
11. **Pay-this-invoice surface (`/payment/invoice/:invoiceId`).** A separate route the panel's "Pay this invoice" CTA navigates to when a list row is `invoice_unpaid` (per step 9's predicate). **Critical: this surface SKIPS convert** (the invoice already exists — converting again 4xxs). Fetch the invoice with the same wide expand, run the payment-method picker from SDD 06 step 2-7, assemble `SelectPaymentMethodData` with `invoice_id: <invoiceId>` from the URL, fire `POST /payments` directly. No `PATCH /orders/{id}/convert` call. On `OK` / `WAITING` resolution, route to confirmation. This is a feature-6 surface re-skinned for a different entry point; the picker + Stripe SDK + payments POST + WAITING-poll logic should be shared.
12. **Subscription detail route (`/panel/subscriptions/{contractId}`).** Fetch the contract record (endpoint to confirm from invoices.md / source-of-truth — likely `GET /contracts/{contractId}` with a `with=` expand for the contract's billing address, currency, gateway). Render the `Contract` data shape per invoices.md: status, activation date, next due date, billing cycle (months / days), recurring amount formatted, "cancel anytime" flag. **Cancellation, suspension, upgrade are out of scope** — render the data only.
13. **Empty states.** A fresh test client with no prior history sees one paid invoice and (if the test product was recurring) one subscription. Test the empty-state branches deliberately: an account with no recurring purchases has zero subscriptions and renders "no active subscriptions yet"; an account whose only invoice is the just-paid one renders that single row, not a misleading "no invoices" surface.
14. **Management — payment methods (`/panel/payment-methods`).** List the client's stored cards on file (`GET /clients/{clientId}/payment_details`). For each row render: card brand, last 4 digits (or wallet label), is-default flag, "Set as default" / "Delete" actions. **Add a card** opens the same gateway-capture flow as feature 6 but with `gateway_context: "add"` instead of `gateway_context: "buy"`:
    - `GET /brands/{brandId}/gateways?context=add` to filter gateways available for stored-card capture (typically Stripe Setup Intent; some gateways only support `buy` and won't appear).
    - Run the same SDK handshake from feature 6 against the chosen gateway. The resulting `SelectPaymentMethodData` is **not** submitted via `POST /payments` — instead persist it against the client via `POST /clients/{clientId}/payment_details` so it becomes available for future purchases.
    - **Set default:** `PUT /clients/{clientId}/payment_details/{paymentDetailsId}` with `{ is_default: true }`. The platform unsets the previous default automatically.
    - **Delete:** `DELETE /clients/{clientId}/payment_details/{paymentDetailsId}`. **Check `brand.config["billing.gateway.allow_card_removal_replacement"]` from feature 2's bootstrap before rendering the delete affordance.** When this key is `false`, the platform rejects deletion of the only / default card server-side; the storefront should disable the button with explanation ("your brand requires a payment method on file — add a new card before removing this one") rather than calling DELETE and surfacing the 4xx. When the key is `true` and the user tries to delete their only stored card, still surface a "this is your default, add another first" guard — the platform allows it but the user-facing flow is brittle without a replacement.
    - See [paymentDetails.md](../02-module-foundations/paymentDetails.md) for the gateway-context taxonomy and the `add` vs `buy` distinction (Lessons section).
15. **Management — addresses (`/panel/addresses`).** Full CRUD on the client's address book using `GET / POST / PUT / DELETE /clients/{clientId}/addresses` and `/{addressId}` variants. The same address shapes used in feature 5's checkout flow apply here; the only difference is the surface and the lack of a basket binding. Mark one address as default billing via `PUT` with `{ is_default: true }`. Forms re-use the autocomplete tokens from SDD 05.
16. **Management — phones (`/panel/phones`).** Full CRUD against `/clients/{clientId}/phones` and `/{phoneId}` variants. Edit / add / delete. The country-code + national-number split per `client.md` applies; do not collapse to a single E.164 string. Mark one as default via `PUT` with `{ is_default: true }`.
17. **Management — emails (`/panel/emails`).** List + add against `/clients/{clientId}/emails`. **Edit and delete of the primary email are out of scope** — the primary email is identity-shaped (carried on the OAuth grant) and changing it has security and provisioning implications the workshop won't unwind. Adding **secondary** emails (used for notifications, invoice delivery copies) is the supported flow — `POST /clients/{clientId}/emails` with `{ email, type, is_default }`. Surface "primary email — change via support" against the primary row; allow add/delete on secondaries only.
18. **Management — companies (`/panel/companies`).** CRUD against `/clients/{clientId}/companies` and `/{companyId}` variants. Many storefronts skip this surface entirely (B2C-only brands have no company concept); render it conditionally based on `brand.config.REQUIRE_COMPANY_FOR_ORDERS` or equivalent. When rendered, `name`, `tax_id`, `vat_id`, and address linkage are the editable fields.
19. **Form autocomplete attributes — required across every management surface.** Per initiator operating principle 12. Same tokens as SDD 05 for address forms (`address-line1`, `address-line2`, `address-level1`, `address-level2`, `postal-code`, `country`, `organization`), `tel` / `tel-national` for phones, `email` for email forms, `cc-name` / `cc-csc` / etc. for any non-Stripe-Elements card UI (Stripe Elements handle this internally).
20. **Validation walkthrough.** Walk the team end-to-end: post-payment → confirmation renders → navigate to `/panel` → see the invoice in the list → click into the invoice → drill into the subscription → navigate to `/panel/payment-methods` → add a new test card → set as default → navigate to `/panel/addresses` → add an address → edit it → delete it. Commit on green.

## Data shapes (feature-scoped)

These are **view models for this feature** — not the platform's wire shape. Map the platform's `IInvoice` / `IContract` (per invoices foundation doc) into these for the UI; do not pass the full envelope to render components.

```ts
// Confirmation page
type ConfirmationViewModel = {
  invoice: InvoiceSummary;
  surface: "paid" | "pending" | "unpaid";   // derived from invoice.status + payments[]
  ctas: { panel: string };                   // route to /panel
};

type InvoiceSummary = {
  id: string;
  number: string;                            // e.g. "CS-INV-02642"
  total: string;                             // total_amount_formatted
  currency: string;                          // currency.code
  statusCode: string;                        // PLATFORM RETURNS AN OBJECT — pull .code off the relation
                                             // (see "Status fields are objects" below)
  statusName: string;                        // display_status / status.name
  isPaid: boolean;                           // computed via the three-signal predicate (step 9)
  paidDate: string | null;                   // paid_datetime
  lineItems: LineItemView[];
};

type LineItemView = {
  id: string;
  name: string;                              // products[].name
  qty: number;                               // products[].quantity
  price: string;                             // products[].total_amount_formatted
};

// Panel home
type PanelViewModel = {
  client: ClientIdentity;                    // from cached /self
  subscriptions: SubscriptionRow[];
  invoices: InvoiceRow[];
};

type ClientIdentity = {
  fullname: string;
  email: string;
  avatarUrl: string | null;
};

// Subscription list row (subset of Contract per invoices.md)
type SubscriptionRow = {
  contractId: string;
  productName: string;                       // resolved from the contract's main invoice's products[0].name
  status: string;                            // contract status
  nextBillingAt: string | null;              // contract.next_due_date
  amount: string;                            // contract.total_recurrent_amount_formatted
};

// Invoice list row
type InvoiceRow = {
  id: string;
  number: string;
  statusCode: string;                        // status.code — pull .code off the relation
  statusName: string;                        // status.name (for badge display)
  isPaid: boolean;                           // from the three-signal predicate
  total: string;                             // total_amount_formatted
  currency: string;                          // currency.code
  createdAt: string;                         // create_datetime (note: not `created_at` — confirm against fixture)
  productsCount: number;                     // from envelope's with_count=products
};
```

> **`invoice.status` is an object on the wire, not a string.** Shape: `{ id: string, code: string, name: string, object_type: string }`. Comparing `inv.status === "invoice_paid"` always returns `false` because the LHS is an object reference and the RHS is a string. Always pull `.code` (`inv.status.code === "invoice_paid"`) — or, better, a helper `statusCode(record): string` that defends against `null` status relations. This pattern applies platform-wide to every `status` field — `invoice.status`, `payment.status`, `contract.status`, etc. See generic.md operating principle 17.

## API calls (in execution order)

| Step | Method | Endpoint | Purpose | Fixture |
| --- | --- | --- | --- | --- |
| 1 | GET | `/invoices/{invoiceId}` (with the canonical wide `with=` expand) | Load the invoice for the confirmation page and the invoice detail page | `07-references/recordings/get-invoices-63250798-065d-1e20-388f-8174e234e98d.json` |
| 2 | (cached) | `/self` | Read the client identity for the panel header — **do not re-fetch**; feature 1 cached it | `07-references/recordings/get-self.json` |
| 3 | GET | `/invoices?...` (filter for the current client; page 1 only) | List invoices for the panel home | **GAP** — no list fixture present in the bundle; capture during the workshop |
| 4 | GET | `/contracts?...` (or derive from step 3 — confirm from invoices.md) | List active subscriptions for the panel home | **GAP** — no list fixture present; confirm endpoint shape and capture during the workshop |
| 5 | GET | `/contracts/{contractId}?with=...` (endpoint to confirm) | Subscription detail page | **GAP** — capture during the workshop; alternative: re-use the embedded `contract` from a step 1 fetch keyed by the contract's main invoice id |
| 6 | GET | `/orders/{orderId}/products/{productId}/provision_fields/values` | Optional per-line provisioning detail on the subscription page (host names, custom-field values for domain / hosting products) | `07-references/recordings/get-orders-{orderId}-products-{productId}-provision_fields-values.json` (multiple variants present in `07-references`) |
| 7 | GET | `/wallet/balance` | Optional wallet balance pill in the panel header | `07-references/recordings/get-wallet-balance.json` |
| **Payment methods management** | | | | |
| 8 | GET | `/clients/{clientId}/payment_details` | List stored cards on file | `07-references/recordings/get-clients-{clientId}-payment_details-*.json` (multiple variants) |
| 9 | GET | `/brands/{brandId}/gateways?context=add` | Filter gateways that support standalone capture (vs `context=buy` for checkout) | `07-references/recordings/get-brands-{brandId}-gateways-*.json` (re-use; verify `?context=add` returns the same / a filtered subset) |
| 10 | POST | `/clients/{clientId}/payment_details` | Persist a captured `SelectPaymentMethodData` against the client (does not charge) | **GAP** — no fixture; capture during the workshop |
| 11 | PUT | `/clients/{clientId}/payment_details/{paymentDetailsId}` | Set as default | **GAP** |
| 12 | DELETE | `/clients/{clientId}/payment_details/{paymentDetailsId}` | Remove a stored card | **GAP** |
| **Addresses management** | | | | |
| 13 | GET | `/clients/{clientId}/addresses` | List addresses | `07-references/recordings/get-clients-{clientId}-addresses-*.json` |
| 14 | POST | `/clients/{clientId}/addresses` | Add an address | `07-references/recordings/post-clients-{clientId}-addresses.json` |
| 15 | PUT | `/clients/{clientId}/addresses/{addressId}` | Update an address (incl. set default) | **GAP** — capture during the workshop |
| 16 | DELETE | `/clients/{clientId}/addresses/{addressId}` | Remove an address | **GAP** |
| **Phones management** | | | | |
| 17 | GET | `/clients/{clientId}/phones` | List phones | `07-references/recordings/get-clients-{clientId}-phones-*.json` |
| 18 | POST | `/clients/{clientId}/phones` | Add a phone | `07-references/recordings/post-clients-{clientId}-phones.json` |
| 19 | PUT | `/clients/{clientId}/phones/{phoneId}` | Update a phone (incl. set default) | **GAP** |
| 20 | DELETE | `/clients/{clientId}/phones/{phoneId}` | Remove a phone | **GAP** |
| **Emails management** (add only — primary edit is out of scope) | | | | |
| 21 | GET | `/clients/{clientId}/emails` | List emails | `07-references/recordings/get-clients-{clientId}-emails-*.json` |
| 22 | POST | `/clients/{clientId}/emails` | Add a secondary email | **GAP** |
| 23 | DELETE | `/clients/{clientId}/emails/{emailId}` | Remove a secondary email (NOT the primary) | **GAP** |
| **Companies management** (conditional on brand) | | | | |
| 24 | GET | `/clients/{clientId}/companies` | List companies | `07-references/recordings/get-clients-{clientId}-companies-*.json` |
| 25 | PUT | `/clients/{clientId}/companies/{companyId}` | Update a company | `07-references/recordings/put-clients-{clientId}-companies-{companyId}.json` |

**Confirm before generating:** the exact list endpoints for invoices and contracts are not enumerated in the invoices foundation doc. Read the relevant module's source-of-truth (or capture from a live admin / customer panel session) before writing the fetcher. Don't invent a URL shape.

**Fixtures GAP — capture during the workshop:** the management-surface mutation endpoints (POST/PUT/DELETE on payment_details, addresses, phones, emails) are mostly missing from the existing v1 fixtures. Recapture as v2 fixtures (per [`fixture-format.md`](../references/fixture-format.md)) when running the workshop so the next iteration has request bodies + response shapes for the whole panel-management surface.

## Open questions — status

### ✅ Resolved (pinned from workshop runs)

1. **Customer-scoped invoice list endpoint** → `GET /api/invoices` (NOT a sub-resource). The bearer's actor implicitly scopes the result; **no `filter[client_id]` needed**. Canonical query shape: `?with=client,client.image,status,products&with_count=products&order=-create_datetime&skip_count=1&limit=20`. See step 6.

### ⏳ Still open

1. **Q13 — Customer-scoped contract / subscription list endpoint.** Not probed in workshop runs (subscriptions section was dropped per scope). Candidates: `GET /contracts?filter[client_id]={clientId}`, `GET /clients/{clientId}/contracts`, or **derive from invoices** by collecting unique `contract_id`s from the invoice list response and expanding `contract` on each. Default for the prototype: derive from invoices (uses only documented endpoints).
2. **Q16 — `?with=` expand on basket-mutating PUTs is universal** — generic.md operating principle 20 generalises this; foundations chapter / basket.md should make the rule explicit at the chapter level rather than restating it per SDD. Open whether this belongs as a top-level platform convention in foundations §1.2 or as a basket-specific lesson. Current location: basket.md lesson + generic.md principle. Re-evaluate after next workshop run.
3. **Q17 — `limit=count` cost characteristics.** Documented as "skips row fetch" (foundations §1.2) but does it still run a server-side `COUNT(*)`? For busy brands with stat-card dashboards, is it cheaper to fetch a page and ignore the rows? Likely a platform-team question, not a customer-team one — flag to Upmind back-end if performance is observed.
4. **`is_default` PUT semantics for sub-records.** When `PUT /clients/{clientId}/addresses/{addressId}` (or phones / payment_details) carries `{ is_default: true }`, does the platform automatically clear the previous default, or does the caller need a second PUT? Edge cases on this assumption are noted in this SDD — confirm during workshop and update either this SDD or the relevant module's foundation doc.
5. **Email primary vs secondary type values.** `client.md` documents the email shape; the exact `type` values (`"primary"`, `"secondary"`, `"billing"`, integer enum?) for `POST /clients/{clientId}/emails` are not pinned. Confirm and capture a v2 fixture.

When resolved against staging, update this SDD in place, capture v2 fixtures, and update `invoices.md` / `client.md` to match.

## Edge cases

Cross-reference the invoices Lessons section — many of these are restatements of platform truths the foundation doc already names.

- **Invoice still `invoice_unpaid` with a pending payment on confirmation mount.** The user navigated mid-3DS or the gateway is still propagating. Surface "we're confirming your payment", re-use feature 6's poll helper against the same `invoiceId` — do not re-implement polling. Cross-ref: invoices Lessons, "The gateway response is not authoritative" and "`paid_amount === 0` does not mean no payments attempted".
- **`invoice_draft` flicker.** The first read after a fresh conversion can return `status: "invoice_draft"` briefly before settling to `invoice_unpaid` / `invoice_paid`. Tolerate the transient draft: hold the surface decision until the readiness signal settles, or treat `invoice_draft` as "still loading". Cross-ref: invoices Lessons, "Invoices read while still `invoice_draft` flicker".
- **No prior subscriptions.** A test brand without recurring products produces no contracts. Render an "no active subscriptions yet" empty state — don't crash, don't loop, don't show a spinner forever.
- **No prior invoices** (beyond the just-paid one). Single-row list is the common case for fresh test clients. The empty branch (zero invoices total) only fires if the user landed on `/panel` before feature 6 completed — guard against the race by reading the cached basket / payment state.
- **Partial payment.** An invoice with `paid_amount > 0 && unpaid_amount > 0` is partially paid — render "Partially paid" (use `display_status`) and the remaining balance. Out of scope to host the pay-the-remainder surface in this feature; link back to the payment route. Cross-ref: invoices Operations, capability 3 "Derive payment state".
- **Wallet-funded payments split into two rows.** A payment funded partly from wallet and partly from a gateway appears as two rows in `payments[]` sharing a logical attempt but differing in `payment_type_id`. The invoice detail's payment history surface needs to group them visibly or render each row clearly — don't render one and hide the other. Cross-ref: invoices Lessons, "Wallet draws are separate ledger entries".
- **Frozen client / address snapshot.** The `client` / `address` / `company` / `phone` embedded on the invoice are frozen at conversion time. If the customer edited their address after the invoice was issued, the invoice still renders the *old* address — this is correct (the invoice is a legal document). Don't try to "live-update" it from the cached `/self`. Cross-ref: invoices Lessons, "The embedded client / address / company / phone on an invoice is frozen at conversion time".
- **`payments[]` includes declined and pending rows.** A naive render of every row shows failed attempts alongside successful ones. Filter to `captured === 1 && refunded === 0` for the receipt history view. Cross-ref: invoices Lessons, "The payment list grows across attempts and includes failures".
- **`payment_details: null` is the common case.** Wallet captures and guest-card captures both leave `payment_details` null. Guard `payment_details?.card_last4` reads — don't crash on the most common production payment shape. Cross-ref: invoices Lessons, "Payment-row `payment_details: null` is the common case".
- **Locked invoice.** A `locked: true` flag (consolidation in progress, fraud hold) blocks payments server-side. The detail surface should distinguish "locked — cannot pay right now" from "unpaid — collectable". Reads still work; only mutations are blocked. Cross-ref: invoices Lessons, "An invoice can be locked".
- **Currency display from the invoice, not the foundations slot.** The invoice carries its own `currency` (immutable at conversion time). Don't apply the foundations layer's currency slot (which is basket-driven) to a paid invoice — the invoice's currency is the authority for everything on that document.
- **Subscription transitions (`moved_from_contract_id` / `moved_to_contract_id`).** A subscription that was upgraded / downgraded has both fields populated on the resulting contracts. A naive subscription list shows the closed-and-replaced pair as two separate subscriptions. Out of scope to resolve the migration history in this feature — render both rows and note that a deeper consolidation is a post-workshop iteration. Cross-ref: invoices Lessons, "The contract `moved_from_contract_id` / `moved_to_contract_id` fields carry migration history".
- **Auth token drops mid-panel.** The foundations layer's refresh-replay (§2.5) handles in-flight 401s. Panel reads benefit transparently — no per-feature work needed beyond not catching 401 yourself.
- **`GET /api/invoices/{id}` returns the pre-convert basket as if it were an invoice.** Because basket and invoice share the UUID (generic.md operating principle 15-16), the read endpoint succeeds for a basket id that hasn't been converted yet — returning the basket wrapped in the invoice envelope with `status.code` carrying `invoice_draft`. The confirmation page and invoice detail page must **status-check** before rendering: if `status.code.includes("draft")`, route the user back to their cart rather than confidently displaying the basket as "Invoice unpaid". The status code is the only signal that distinguishes a pre-convert basket from a real invoice.
- **`invoice.status` is an object, not a string.** Comparing `invoice.status === "invoice_paid"` always returns false because the LHS is `{ id, code, name, object_type }`. Read `invoice.status.code` (or use a `statusCode(record)` helper). Same applies to `payment.status`, `contract.status` and every other status relation. See generic.md operating principle 17.
- **`filter[status.code]=invoice_paid` is unreliable for count derivation.** A workshop test surfaced a paid invoice the filter missed (likely a transitional status code at the moment of capture). For paid-count stat cards, **derive from the list with the three-signal predicate** (step 9), not from a server-side status filter. Single source of truth between badge and count.
- **Retry-pay on an existing unpaid invoice skips convert.** When a user clicks "Pay this invoice" on a `/panel/invoices/{id}` row whose status indicates unpaid, the resulting payment flow uses `invoice_id: <invoiceId>` directly — no `PATCH /orders/{id}/convert` call (the invoice already exists; calling convert again returns 4xx). The pay-this-invoice route (step 11) embodies this; do not embed convert in any retry path. See generic.md operating principle 15.
- **Adding a payment method is `gateway_context: "add"`, not `"buy"`.** Critical distinction (see paymentDetails.md Lessons). The `add` context skips the basket / total / currency binding entirely — the gateway just captures the payment method and the platform persists it against the client. Submitting an `add`-context capture through `POST /payments` is wrong; submitting a `buy`-context capture through `POST /clients/{clientId}/payment_details` is wrong. The context is set when fetching gateways AND when running the SDK handshake — both must use the same value.
- **The `add` flow has no 3DS challenge in the same way.** Most gateways issue a SetupIntent (Stripe) or zero-amount auth (Adyen / Worldpay) rather than a real charge — the SDK handshake returns terminal data without an inline challenge. If the gateway *does* surface a challenge (some PSPs require step-up auth for stored cards), handle it identically to the `buy` path; do not branch on context.
- **Setting a new default unsets the previous default.** Server-side. The previously-default payment method / address / phone is set to `is_default: false` automatically. Don't issue a second PUT to "clear" the old one — the platform's already done it, and a manual PUT can race against another tab.
- **The "primary" email is identity-bound.** `client.email` (on `/self`) is the OAuth grant identity — changing it has implications across token validity, password recovery, brand notifications, and admin search. The panel surfaces the primary as read-only and adds new emails as `secondary` (`type: "secondary"` or similar — confirm shape from `client.md`). Email change is a support-ticket flow, not a self-service flow, in scope for the workshop.
- **Deleting an address / phone / company in use by a subscription.** The platform allows the delete, but the subscription retains the snapshot at conversion time (see invoices Lesson "the embedded address is frozen"). Don't block the delete; do surface "this address is on subscription X — deleting it here only removes it from your address book" so the user understands the scope.
- **Address validation is server-side.** Country code mismatches, tax-zone requirements, brand-specific required fields — all enforced on POST/PUT. Surface field-level errors from `error.data` (foundations §4.3). Don't pre-validate locally beyond format / required-not-empty checks.
- **Forms here use the same `autocomplete` tokens as checkout.** Per initiator operating principle 12 and SDD 05's autocomplete table. Address line 1 → `address-line1`, etc. The password manager / browser autofill should be just as good in the panel as it is in checkout.

## Validation checklist

- [ ] After payment, `/confirmation/{invoiceId}` renders the invoice number, totals, line items, and the currency code, all sourced from the server's `_formatted` fields
- [ ] `/panel` renders the user's identity in the header (name, email, avatar) read from the cached `/self` — verify in the network tab that no fresh `/self` request fires on `/panel` mount
- [ ] `/panel` shows the invoice list with the just-paid invoice at the top
- [ ] `/panel` shows the subscription list with the just-created subscription (when the test brand product was recurring); the list renders an "no active subscriptions yet" empty state for non-recurring brands
- [ ] `/panel/invoices/{invoiceId}` drills into the invoice with full chrome — billing address, payment history filtered to captured non-refunded rows, tax breakdown, status badge
- [ ] `/panel/subscriptions/{contractId}` renders the contract record's status, activation date, next due date, billing cycle, and recurring amount
- [ ] An invoice still mid-pending on confirmation mount surfaces a "confirming" UI and re-uses feature 6's poll helper rather than re-implementing one
- [ ] An invoice with `payment_details: null` on any payment row renders without crashing (verify against a wallet-paid invoice if available)
- [ ] **Read-surface routes are `GET`-only.** `/panel`, `/panel/invoices/{...}`, `/panel/subscriptions/{...}` and `/confirmation/{...}` issue only `GET` requests. Mutations only originate from the management routes (`/panel/payment-methods`, `/panel/addresses`, `/panel/phones`, `/panel/emails`, `/panel/companies`).
- [ ] **Add a card via `/panel/payment-methods`.** Network panel shows `GET /brands/{brandId}/gateways?context=add`, then the SDK handshake against the chosen gateway (`context: "add"`), then `POST /clients/{clientId}/payment_details` carrying the resulting `SelectPaymentMethodData`. The card appears in the stored-cards list on refresh. **No** `POST /payments` fires.
- [ ] **Set default card.** `PUT /clients/{clientId}/payment_details/{paymentDetailsId}` with `{ is_default: true }` succeeds; the previously-default card now reads `is_default: false` without a second PUT.
- [ ] **Delete card.** Deleting a non-default card removes it from the list; trying to delete the only remaining card surfaces a "this is your default — add another first" guard (when the brand enforces payment-on-file).
- [ ] **Address CRUD.** Add an address via `POST /clients/{clientId}/addresses`, edit via `PUT`, delete via `DELETE`. All three round-trips reflect in the list immediately.
- [ ] **Phone CRUD.** Same shape as address: add, edit (incl. set default), delete.
- [ ] **Add secondary email.** `POST /clients/{clientId}/emails` with a fresh address succeeds; the new email appears in the list. The **primary** email row is read-only — UI shows no edit / delete affordance on it.
- [ ] **Autocomplete tokens present on every management form input** — `autocomplete="address-line1"`, `autocomplete="tel"`, `autocomplete="email"`, etc. Verify by opening Chrome's autofill suggestions on the form.

## Notes for the agent

- **Reads + targeted management.** The bulk of the panel is reads (confirmation, invoices, subscriptions). The management surfaces add mutation routes: payment-methods (add/set-default/delete), addresses (full CRUD), phones (full CRUD), emails (add secondary only — primary is read-only), companies (full CRUD, conditional on brand). Cancellation, suspension, upgrade, refund, downgrade, contract migration UI all remain out of scope (per generic.md §3, doc'd-only).
- Re-use the cached `/self` from feature 1. The panel's identity header does not justify a fresh read on every mount.
- The invoice is immutable post-conversion. Currency, totals, line items, embedded address, embedded client — none of these change. Render directly from the loaded envelope.
- The `Contract` data shape lives in invoices foundation doc (the `orders` module was merged into `invoices`; `IOrder` is an alias of `IInvoice`). Read it there before mapping to `SubscriptionRow`.
- **Subscriptions list and invoices list endpoints are gaps in the current bundle.** Confirm them from the invoices module's source-of-truth before generating the fetcher — do not invent URL shapes. If the workshop captures fresh fixtures, update this SDD and the invoices foundation doc.
- Don't pre-fetch `/panel` data before the user navigates to it — the confirmation page is the first stop post-payment, and aggressive prefetching obscures the network-tab story the team is walking through.
- Polling on the confirmation page re-uses feature 6's helper. If you find yourself writing a second poll loop, stop — go re-use the one feature 6 already shipped.
- The wide `with=` expand on `GET /invoices/{id}` is the same for the confirmation page and the invoice detail page. One fetcher, two consumers — share the view-model mapper.
- Wallet balance UI is optional polish; the fixture exists (`get-wallet-balance.json`). Skip if time is tight.
- Invoice download (PDF) and any "email me this invoice" surface are out of scope. Mention to the team if they ask; defer.
