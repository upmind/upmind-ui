# Fixture index

> Captured API requests **and** responses from staging Upmind brands. Use these to derive your types, request shapes, and edge cases — do **not** hand-craft response shapes, and do **not** infer request shapes from prose docs alone when a fixture is available.

**Source location in the monorepo:** `tests/fixtures/recordings/`

**In the handover bundle:** copied to `07-references/recordings/` and accessed by the agent as `@workshop-bundle/07-references/recordings/<filename>.json`.

**Total fixtures:** 93. Filename convention: `{method}-{path-with-dashes}-{hash?}.json`. Double-dash after method (`post--oauth-...`) indicates a top-level endpoint (no path-id between method and resource).

**Fixture format:** see [`fixture-format.md`](./fixture-format.md) for the on-disk shape. Two versions coexist during the v1 → v2 migration:

- **v1 (legacy)** — response-only captures. The `request` block contains only `method` + `path`; `request.body` is absent. The agent has to infer the request shape from the foundation doc.
- **v2 (current target)** — full captures with `request.body` and `request.headers` populated. The agent can verify their in-progress request against the captured truth.

A `version` field at the top of each fixture distinguishes them; missing field defaults to `1`. v2 captures supersede v1 captures (overwrite, don't preserve both).

---

## How to use this index

1. **Building a feature?** Find the section for that feature below.
2. **Need a request body shape?** Open a v2 fixture (`version: 2`) and read `request.body`. If only a v1 capture exists, fall back to the documented `RequestBody` type in the relevant module foundation doc and **flag the gap** — the next v2 capture closes it.
3. **Need a response shape?** Open any fixture (v1 or v2 both carry `response.body`).
4. **Captured request disagrees with foundation doc?** The fixture wins. Foundation doc gets updated; captured-from-staging is ground truth. Common cause: BE flags the headless code sends that the doc forgot to document (`provision_field_values_validate` was the canonical example).
5. **Missing a fixture you need?** See [`fixture-format.md`](./fixture-format.md) "How to capture a v2 fixture". Add the file to `recordings/` and update this index.
6. **Don't trust hand-written shapes.** If a doc says "the request looks like X" but the v2 fixture differs, the fixture wins.

---

## Auth (session)

### Login / token grant

| Fixture | What it shows |
| --- | --- |
| `post--oauth-access_token.json` | Generic access-token grant response shape (token, expiry, refresh) |
| `post--oauth-access_token-client.json` | Client-actor token grant (password grant) |
| `post--oauth-access_token-guest.json` | Guest-actor token grant (no credentials — anonymous browse) |
| `post--oauth-access_token-twofa.json` | Two-factor challenge response branching the flow into the 2FA step |

### Registration + recovery

| Fixture | What it shows |
| --- | --- |
| `post--clients-register.json` | Client registration response (top-level path variant) |
| `post-clients-register.json` | Client registration response (current path) |
| `post--clients-password_reset.json` | Password reset request (top-level path) |
| `post-clients-password_reset.json` | Password reset request (current path) |
| `post--admin-users-password_reset.json` | Admin-side reset (out of prototype scope — staff flow) |
| `post--org-register.json` | Organisation register (out of prototype scope) |

### Identity

| Fixture | What it shows |
| --- | --- |
| `get--self.json` | Authenticated `/self` (client identity) |
| `get-self.json` | Same, current path |
| `get--admin-self.json` | Admin `/self` (out of scope — for parity) |

---

## Brand bootstrap (brand + system)

| Fixture | What it shows |
| --- | --- |
| `get-brand-settings.json` | Full brand record (identity, supported currencies, supported languages, default currency, default language, branding assets) |
| `get-org-modules.json` | Organisation-level enabled modules — what the storefront is allowed to do |
| `get-config-brand-values-{hash}.json` (×3) | Brand config — keyed key/value store for brand-level behaviour flags. Multiple hashes = different requested key sets. The agent supplies the keys it needs; response returns only those. |
| `get-config-organisation-values-c1572e00.json` | Org-level config values (cross-brand) |
| `get-terms_and_conditions-current.json` | Current T&Cs for the brand (single object, not a list) |
| `get-countries.json` | Reference data: country list (one-shot, large, cache aggressively) |
| `get-countries-{countryId}-regions.json` | Regions (states / provinces) for one country |
| `get-billing_cycles.json` | Reference data: billing cycle catalogue |
| `get-basket_fields.json` | Field schemas the basket envelope is allowed to carry |
| `get--clients_fields.json` / `get-clients_fields-{hash}.json` | Field schemas for client records (custom fields) |
| `get--org-clients_fields.json` | Org-level client field schemas |

---

## Catalogue browse (productCatalogue + productCategories + product)

### Catalogue listings (no specific product)

| Fixture | What it shows |
| --- | --- |
| `get-basket-products-0aea5e9f.json` | Top-level catalogue listing (paginated) |
| `get-basket-products-413eaf6d.json` | Catalogue listing with filters / different params |
| `get-basket-products-5c6526a4.json` | Variant query |
| `get-basket-products-7b426f83.json` | Variant query |
| `get-basket-products-83cdf05d.json` | Variant query |
| `get-basket-products-96d6096f.json` | Variant query |
| `get-basket-products-c844b0e7.json` | Variant query |
| `get-basket-products-dfb72dd1.json` | Variant query |
| `get-basket-products-e222b273.json` | Variant query |
| `get-basket-products-e4a7a80f.json` | Variant query |
| `get-basket-products_categories-f13c8b36.json` | Category tree (nested) |

### Single product reads

| Fixture | What it shows |
| --- | --- |
| `get-basket-products-{productId}-{hash}.json` (multiple) | Single-product read — full shape with configuration options, pricing rows, sub-products |
| `get-basket-{basketId}-products-{productId}-{hash}.json` (×3) | Basket-aware single-product read (prices recomputed against basket's promotions / currency / country) |
| `get-basket-products-{productId}-provision_fields.json` (×2) | Provisioning field schema for a configurable product |
| `get-basket-products-{productId}-provision_fields-fb94accc.json` | Provisioning fields with a variant param |

---

## Basket (basket + basketProduct + product seating)

### Create / load / claim

| Fixture | What it shows |
| --- | --- |
| `post-orders.json` | Create a new basket — returns the envelope |
| `get-orders-current.json` | Load the current basket for the session |
| `patch-orders-claim.json` | Claim a basket to the current actor (guest → client transitions, or auth token gains a basket) |

### Seat / read / validate

| Fixture | What it shows |
| --- | --- |
| `post-orders-{basketId}-products.json` | Seat a product into the basket — returns full refreshed basket (diff against pre-seat to find the new entry; see `basketProduct` foundation doc) |
| `post-orders-03679424-products-error-allfields-{hash}.json` | Seat error — all required fields missing |
| `post-orders-03679424-products-error-quantityoptions-{hash}.json` | Seat error — quantity-options validation |
| `get-orders-{basketId}-products-{productId}-provision_fields-values.json` (multiple) | Read provisioning values for an in-basket product |
| `patch-orders-{basketId}-provision_fields-values-check.json` (multiple) | Validate provisioning values without persisting |

### Cart calculate (preview prices)

| Fixture | What it shows |
| --- | --- |
| `post-cart-calculate.json` | Price calculation without persisting — useful for "show the basket total before they commit" |

---

## Checkout (basket billing + client sub-records)

### Basket billing fields

| Fixture | What it shows |
| --- | --- |
| `put-orders-{basketId}.json` (×2) | Update the basket envelope — billing details, address selection, currency switch |

### Client address book

| Fixture | What it shows |
| --- | --- |
| `get-clients-{clientId}-addresses-f13c8b36.json` (×2) | Client's address list |
| `post-clients-{clientId}-addresses.json` | Create a new address on the client record |
| `get-clients-{clientId}-phones-f13c8b36.json` (×2) | Client's phone list |
| `post-clients-{clientId}-phones.json` | Create a phone |
| `get-clients-{clientId}-companies-f13c8b36.json` (×2) | Client's company records |
| `put-clients-{clientId}-companies-{companyId}.json` | Update a company |
| `get-clients-{clientId}-emails-f13c8b36.json` | Client's email list |

---

## Payment (paymentDetails + payment)

### Gateways (brand-filtered)

| Fixture | What it shows |
| --- | --- |
| `get-brands-{brandId}-gateways-2d2b5513.json` | Gateway list — filtered variant A |
| `get-brands-{brandId}-gateways-4670e737.json` | Gateway list — filtered variant B |
| `get-brands-{brandId}-gateways-71329560.json` | Gateway list — filtered variant C |
| `get-brands-{brandId}-gateways-e14734e8.json` | Gateway list — filtered variant D (different `?currency=` / `?country=` / `?basket_id=` combinations; see `paymentDetails` foundation doc, brand-gateway 2-way filter) |

### Stored payment methods

| Fixture | What it shows |
| --- | --- |
| `get-clients-{clientId}-payment_details-f0c8c296.json` | Client's stored payment methods (cards on file) |
| `get-clients-{clientId}-payment_details-87245d77.json` | Same, different client |
| `get-clients-{clientId}-payment_details-f3a1bf8d.json` | Same, different client |

### Payment submission

| Fixture | What it shows |
| --- | --- |
| `post-payments.json` | Submit `SelectPaymentMethodData` payload — payment "make" surface (see `payment` foundation doc); response includes inline 3DS / awaiting-client branches |

---

## Confirmation + panel (invoices)

### Conversion + paid invoice

| Fixture | What it shows |
| --- | --- |
| `patch-orders-{basketId}-convert.json` | Convert basket → invoice. Returns the invoice record; immutable from this point. |
| `get-invoices-{invoiceId}.json` | Load a single invoice (after conversion, after payment) |

### Subscription / contract reads

| Fixture | What it shows |
| --- | --- |
| `get-orders-{orderId}-products-{productId}-provision_fields-values.json` (×3) | Post-conversion provisioning values per contract (see `invoices` foundation doc — `Contract` data shape) |

### Wallet

| Fixture | What it shows |
| --- | --- |
| `get-wallet-balance.json` | Client wallet balance (one of the partial-payment sources) |

---

## Out of prototype scope (captured for completeness)

These fixtures exist but are not used in the workshop spine. Listed so the agent doesn't reach for them by accident.

- `patch-templates-client_area-slots-*.json` (×4) — Upmind's own templating layer; the prototype is from-scratch and does not consume rendered HTML slots.
- `post--admin-*.json` — admin-actor flows.
- `post--org-register.json` — organisation registration (not a customer-facing flow).

---

## Capturing new fixtures

For the full v2 capture protocol (including redaction rules, validation checklist, and v1 → v2 migration guidance), see [`fixture-format.md`](./fixture-format.md).

Quick form:

1. Start the recording proxy against the staging brand (the proxy must capture **both request and response bodies** for v2).
2. Drive the flow — existing dev environment, curl, or test harness.
3. Apply redaction (auth headers, passwords, tokens, real PII) per [`fixture-format.md`](./fixture-format.md) "Redaction rules".
4. Save under `tests/fixtures/recordings/{method}-{path-with-dashes}-{hash}.json` with `version: 2` set.
5. Add an entry to this index in the right section.
6. Re-bundle if you've already shipped the handover.

The fixtures are intentionally checked into the monorepo — they're the canonical source of "what shapes the platform actually accepts and returns." Captured-from-staging beats hand-written every time.

---

## v1 → v2 migration backlog

Every existing fixture in this index is **v1 (response-only)**. The agent currently has to infer request shapes from foundation docs, which has produced documented failure modes (e.g. `provision_field_values_validate` missing from `basketProduct.md`). Until each fixture below is re-captured as v2, treat any documented `RequestBody` type as best-effort and double-check against the headless source if behaviour disagrees.

Recapture priority (highest first):

1. `post-orders-{basketId}-products.json` — seating; the basketProduct `provision_field_values_validate` flag bit a real workshop agent here
2. `post-cart-calculate.json` — preview pricing; full request body shape clarifies promotion/coupon scoping
3. `put-orders-{basketId}.json` — basket billing update; documents the POST-create vs PUT-replace divergence
4. `post-payments.json` — `SelectPaymentMethodData` payload shape is captured response-side but never input-side
5. `post-clients-register.json` — exemplar for the doc/code request-shape verification loop
6. `patch-orders-{basketId}-convert.json` — basket → invoice conversion body
7. Every remaining mutation endpoint (POST / PUT / PATCH) in priority order

Read endpoints (GET) can stay v1 — their inputs live in the path/query string, which v1 already captures.
