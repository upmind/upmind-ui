# SDD 04 — Basket (product page + configure + add + cart manage)

## Goal

From a catalogue card click, the visitor lands on the product page (`/product/{id}`): name, description, image, headline price, and a full configurator — term selector, option pickers, attribute pickers, quantity stepper, provision-field form. Pressing "Add to basket" seats the configured product (`POST /orders` first time, `POST /orders/{basketId}/products` thereafter), the cart badge increments, and the basket envelope appears. The cart page then renders line items, per-line quantities, and server-computed totals in the basket's currency; the visitor can adjust quantity, commit deferred provisioning values, remove a line, switch currency, and see totals recompute on every change. A guest who builds a basket and then registers or logs in mid-flow keeps that basket — it transfers to the now-authenticated client. Once a basket exists, its currency is the active currency for the rest of the session.

## Depends on

- Feature 3 (Catalogue browse) — produces the catalogue card click that routes to this feature's product page
- Feature 1 (Auth) — guest mint runs on first load; client login mid-flow triggers the claim path documented here
- Feature 2 (Brand bootstrap) — supplies the currency baseline used until a basket exists; provides `brand.currencies` for the switcher dropdown

## Modules consumed

- `basket` — see [02-module-foundations/basket.md](../02-module-foundations/basket.md)
- `basketProduct` — see [02-module-foundations/basketProduct.md](../02-module-foundations/basketProduct.md)
- `product` — see [02-module-foundations/product.md](../02-module-foundations/product.md) — capabilities 1 (read for configuration), 5 (`POST /orders`), 6 (`POST /orders/{basketId}/products`)

## Reads (before generating any code)

- `06-initiator/generic.md` — sections 9 (validation checklist) and 10 (operating principles, especially #6 host = brand domain, #8 diff to identify new basket entries, #9 `basket_id` recomputation cost, #20 wide `?with=` expand on basket mutations)
- `03-foundations-chapter.md` — full chapter (§1 HTTP transport, §3 currency injection, §4 error model — including §4.7 silent-strip)
- `02-module-foundations/product.md` — full (capability 1 for the configure read, capabilities 5 + 6 for seating)
- `02-module-foundations/basket.md` — full
- `02-module-foundations/basketProduct.md` — full

## What this feature does

### Product page + configurator

1. Visitor arrives at `/product/{id}` from a feature-3 card click. Issue the single-product configure read. Branch on basket existence (the foundations basket-id slot):
   - **No basket yet:** `GET /basket/products/{id}?currency_code=<active>&lang=<active>&with=image,images,prices,products_attributes,products_attributes.icon,products_options,products_options.icon,products_options.prices,category.top_category.top_category.top_category.top_category,provision_blueprint.category` — **no `basket_id`**. The response includes `provision_blueprint` metadata but **not** the provision-field definitions themselves — those come from a separate call (step 2).
   - **Basket exists:** same call **with** `&basket_id=<id>`. The platform recomputes every returned price row against the basket's applied promotions and option overrides, so the configurator's selection-driven totals are basket-accurate. (Operating principle #9 — pay this cost on the product page once a basket exists; feature 3 doesn't pay it on listings.)
2. **Read provision-field definitions separately.** Issue `GET /basket/products/{id}/provision_fields?lang=<active>` on initial product-page load — **no `sub_product_ids` query param** (the storefront fires the call without it; the captured fixture confirms `?lang=en-US` only). Response is a `BlueprintField[]` (see `product.md` "Provision-field definitions" — note the wire field names: `field_label`, `field_type`, `validation_rules: string[]`, `default_value` — NOT `label` / `type` / `validation` / `default`).
3. Render the product page: name, long description, primary image, gallery, headline `display_price` from the `prices[]` row matching the active currency, breadcrumb walked from `category.top_category`, and the **configurator**:
   - **Term selector.** Drive options from the product's `prices[]` rows — each row's `billing_cycle_months` is a selectable term; the row's `price` is what that term costs. Default to the row matching `display_price` (or the lowest cycle if the brand's headline policy isn't reflected in the data).
   - **Options pickers.** One control per `products_options[]` group. Group `required` and `multiple` flags drive the input shape (single-select vs multi-select, mandatory vs optional). Each value's price delta lives in `products_options.prices[]` matching the active currency / billing cycle.
   - **Attributes pickers.** Same shape as options (`products_attributes[]`). Attributes don't carry per-value prices; they're configuration metadata the platform records on the basket line.
   - **Quantity stepper.** Bounded by `product.min_order_quantity` / `product.max_order_quantity` / stepped by `product.unit_quantity`. Treat `0` on any of these as "no constraint" — see Edge cases.
   - **Provision-field form.** One control per `BlueprintField` from step 2. Render `label`, `type`, `required`, plus `options[]` for select/radio types and `validation` for typed constraints. The form **can be submitted empty** — step 5 seats with `provision_field_values_validate: false` to defer per-field validation until the user commits values from the cart page.
4. **Re-read provision fields on option/attribute selection change.** Different sub-product selections can unlock or hide different provisioning fields (per `product.md`). When the user picks or un-picks any option or attribute, re-issue step 2 with the updated `sub_product_ids` and re-render the provision-field form. Preserve already-entered values where the field id still exists in the new response; drop the rest. Debounce client-side (200-300ms) so rapid clicks coalesce into one re-read.
5. **Configured-price preview via `POST /cart/calculate`.** On every configurator change (term toggle, option pick / un-pick, attribute change, quantity bump), the client picks the raw price numbers that apply — the selected term row's `price` from `Product.prices[]`, each selected option value's `price` from `products_options.prices[]` (the row matching the active currency + selected billing cycle), and the quantity — and assembles them into the calculate body:

   ```json
   {
     "currency_id": "<active>",
     "prices": [
       { "price": <term row price>, "quantity": <qty> },
       { "price": <option value price>, "quantity": <qty> },
       …
     ]
   }
   ```

   POST that to `/cart/calculate`. Response is `{ total, total_formatted, prices }` — `total_formatted` is the brand-formatted string (e.g. `"$198.00"`) that the UI renders. Per product.md: "Used to format a sum that the storefront could compute itself, when the client cannot be trusted to render currency the same way the back end will." The client picks **which** prices to send (that's editorial — the configurator owns the selection model); the platform handles **summing + currency formatting**. The seat response is still the authoritative payable price; the calculate preview is the storefront's pre-seat display.
   - **Stale-response guard (the platform does not sequence calculate responses).** Per product.md: "Every option toggle, term change, or quantity bump triggers an independent `/cart/calculate` round-trip. Calculation responses for stale configurations can land after the user has already moved on; the platform does not surface a sequence number on responses, so the displayed price can flicker between configurations and settle on a value that no longer matches what is selected." Tag each outgoing calculate request with a monotonic client-side request id; on response, only commit `total_formatted` to the UI if the request id is the latest issued. Discard older landings. Debounce the calculate call 150-300ms client-side so rapid toggles coalesce.
   - **Reference implementation.** The existing quantity-stepper widget does this correctly — same selection-driven calculate pattern with stale-response guarding. Match its shape rather than reinventing.
   - **Parallel with the provision-fields re-read.** Steps 4 (provision-fields re-read) and 5 (calculate) both fire on option/attribute change. Issue them in parallel; they're independent. Both need the stale-response guard.

### Seat the configured product

6. On "Add to basket" click, disable the CTA until every `required: true` option group has a selection (and every `multiple: false` group has exactly one). Then branch on basket existence:
   - **No basket yet (first ever seat):** `POST /orders` with body:
     ```json
     {
       "category_slug": "new_contract",
       "currency_code": "<active>",
       "products": [<BasketProductConfig>]
     }
     ```
     Response is the **new basket envelope** including the seated line. Persist `basket.id` in the foundations basket-id slot for the rest of the session.
   - **Basket exists:** `POST /orders/{basketId}/products` with body `<BasketProductConfig>` (single product, not wrapped in `products[]`). Response is the **full refreshed basket** — every line, every total.
7. **`BasketProductConfig` body shape** (see `basketProduct.md` for the full type):
   ```json
   {
     "product_id": "<catalogue product id>",
     "billing_cycle_months": <selected term>,
     "quantity": <qty>,
     "options": [{ "id": "<option_value_id>" }, ...],
     "attributes": [{ "id": "<attribute_value_id>" }, ...],
     "provision_field_values": [{ "provision_field_id": "<id>", "value": "<value>" }, ...],
     "provision_field_values_validate": false
   }
   ```
   `provision_field_values_validate: false` lets the seat succeed even when required provisioning values are empty (typical flow: seat first → user enters values from the cart page → step 12's PUT commits with `provision_field_values_validate: true` defaulted back on).
8. **Diff to identify the new entry (operating principle #8).** Snapshot `basket.products[]` before the seat call; after the response lands, diff against the snapshot keyed by basket-product `id`. Two cases the diff must handle:
   - One seating call can yield **multiple** new basket-products (some catalogue products materialise as N entries).
   - Seating a quantifiable product **already on the basket** with identical config yields **zero** new entries — the platform merges into the existing line and bumps `quantity`. Surface as a quantity delta on an existing id.
9. **Silent-strip detection on seat (foundations §4.7).** Seating can return `200 OK + status: "ok"` and still have **stripped the basket product post-acceptance** — the platform validates HTTP-level first (4xx for hard rejections), then runs a viability pass (quantity stepping, mandatory options, brand combination rules). A failure in the second pass produces `data.products[]` missing the line you submitted with `data.warning_notes` populated. **Defensive pattern (must implement):**
   1. Snapshot `basket.products[]` before the seat.
   2. Issue the mutation.
   3. On `2xx`, diff post against pre. If the submitted line is **absent** and `data.warning_notes` is **non-empty**, surface `warning_notes[].message` as a soft error.
   4. Do **NOT** treat the seat as applied unless the line is present in the response. Cart badge increment, success toast, "added to basket" UI all wait on this verification.
10. **Cart badge.** Once any basket exists, the badge reads `basket.products.length` (or sum of `quantity` — pick one and stick to it). Updates on every successful basket-returning call.

### Cart page

11. **Cart page mount.** Issue `GET /orders/current` with the canonical `with=` expand (address, currency, products.product.image, products.product.prices, products.product.products_options, promotions, taxes, taxes.tax_tag_data, client). Render the basket envelope. Display totals strictly from server-computed fields — `total_amount_formatted`, `net_amount_formatted`, `tax_amount_formatted`, `total_discount_amount_formatted`. Do not recompute client-side; the platform applies tax-inclusion policy, promotions stacking, and currency conversion that the client cannot replicate.
12. **Adjust quantity / commit deferred provisioning / edit configuration.** On +/- click for a line, or on submit of the cart-page "enter your provisioning details" form, issue `PUT /orders/{basketId}/products/{basketProductId}` with the **full** `BasketProductConfig` body (re-send `product_id`, `billing_cycle_months`, `options`, `attributes`, `provision_field_values` — the platform reads omitted fields as "clear it", per the basketProduct foundation doc). For commit-deferred provisioning, default `provision_field_values_validate` back to `true` and supply the filled values. Quantity is bounded and stepped per the catalogue product's `min_order_quantity` / `max_order_quantity` / `unit_quantity`. Response is the refreshed basket; replace local state. On 4xx, the line is unchanged — surface per-field errors from `BasketProductErrors`. Silent-strip detection (per step 9) applies to PUT as well.
13. **Remove a line.** Issue `DELETE /orders/{basketId}/products/{basketProductId}`. Response is the refreshed basket. Capture the removed line's configuration **before** the call resolves if analytics needs it (the post-response basket no longer carries the entry — see basketProduct lessons).
14. **Serialise mutations on the same line.** Two parallel +/- clicks on the same basket product race — the second response can land before the first. Serialise client-side per basket-product id; let the latest user intent be the final state.

### Currency + auth transitions

15. **Basket-driven currency authority.** When the basket lands, compare `basket.currency.code` against the foundations currency slot. If different, switch the slot to `basket.currency.code` — the basket is the authority from this point on (per foundations §3.2).
16. **Currency switcher (cross-cutting UI).** The dropdown reads `brand.currencies` (cached from feature 2). On change, branch on basket existence:
    - **No basket:** update the foundations currency slot only. Subsequent catalogue reads (feature 3) and product-page reads (step 1 of this feature) carry the new `currency_code`.
    - **Basket exists:** fire `PUT /orders/{basketId}/currency` with body `{ "currency_code": "<new>" }` and the basket's wide `?with=` expand (per operating principle #20) so the response inflates correctly. The response is the refreshed basket with re-computed totals in the new currency.
    Debounce client-side (250-500ms) so a USD → GBP → EUR triple-click fires at most one PUT.
17. **Basket claim on auth transition.** When feature 1 transitions the visitor from guest to client (login or registration), the guest token built a basket the client now needs to own. Issue `PATCH /orders/claim` — bearer is the new client token, body is `{ "guest_token": "<previous guest access token>" }`. Both tokens must coexist in storage until the claim returns 2xx. On success, re-issue `GET /orders/current` against the client token to observe the same basket with `client_id` now populated.
18. **Mutation in flight at auth transition.** If a basket mutation is in flight when authentication completes, queue the claim behind the in-flight call so the basket settles before claim attempts to re-parent it.

## State model

Lightweight per-feature state (not platform-defined — the platform's basket lifecycle is rich but only `loaded` / `mutating` matter here):

- `empty` — no basket id persisted, no current basket from `/orders/current`
- `creating` — `POST /orders` is in flight (first-ever seat)
- `loaded` — basket id known, envelope hydrated and fresh
- `mutating` — any of seat / quantity / remove / currency / claim in flight; the loaded basket is the still-authoritative pre-mutation snapshot until the response lands
- `error` — last call failed; surface to UI, preserve the prior loaded snapshot

Transitions:

- `empty → creating` (first add-to-basket) → `loaded`
- `loaded → mutating` (any basket-returning call) → `loaded`
- any → `error` on a non-recoverable failure; the loaded snapshot is unchanged so the user can retry

## Data shapes (feature-scoped)

View-models this feature assembles from the module-foundation types. Full platform shapes live in `product.md`, `basket.md`, and `basketProduct.md`.

```ts
// Product page — full configure-shape view-model
type ProductDetail = {
  id: string;
  name: string;                   // Product.name_translated
  description: string;            // Product.description_translated (HTML allowed)
  image: string | null;
  gallery: string[];
  displayPrice: string;           // Product.display_price (headline)
  breadcrumb: { id: string; name: string }[]; // walked from category.top_category chain
  termOptions: TermOption[];      // one per Product.prices[] row
  optionGroups: OptionGroup[];    // selectable
  attributeGroups: OptionGroup[]; // selectable (same shape, no per-value price)
  quantity: { min: number; max: number; step: number };
  provisionFields: ProvisionField[];
};

type TermOption = {
  billingCycleMonths: number;
  price: string;                  // formatted, active currency
  priceRaw: number;               // unformatted, for client-side preview math only
};

type OptionGroup = {
  id: string;                     // option category id
  categoryName: string;
  required: boolean;
  multiple: boolean;
  values: OptionValue[];
};

type OptionValue = {
  id: string;                     // option_value_id — what the seat body sends
  name: string;
  priceDelta: string | null;      // formatted, active currency (null for attributes)
};

type ProvisionField = {
  // BlueprintField from `GET /basket/products/{productId}/provision_fields` —
  // shape pinned from the captured v2 fixture. Wire uses prefixed/suffixed names
  // (`field_label`, `field_type`, `validation_rules`, `default_value`) — see product.md.
  id: string;
  blueprint_id: string;
  name: string;                                  // machine identifier (e.g. "domain")
  field_label: string;                           // display label
  field_type: string;                            // input widget — "input_text" | "input_select" | …
  semantic_type: string | null;                  // e.g. "domain_name", "email"
  required: boolean;
  order: number;
  deferrable: boolean;                           // safe to leave empty at seat with `provision_field_values_validate: false`
  options: { value: string; label: string }[];  // empty array for non-select types
  validation_rules: string[];                    // e.g. ["required", "domain_name"]
  default_value: string | number | boolean | null;
};

// Cart-page view-model — derived from the basket envelope
type BasketViewModel = {
  id: string;                       // basket.id
  status: string;                   // basket.status (e.g. "invoice_draft")
  currencyCode: string;             // basket.currency.code
  items: BasketLineView[];
  totals: TotalsView;
  isClaimed: boolean;               // basket.client_id != null
};

type BasketLineView = {
  id: string;                       // BasketProduct.id (NOT product_id — see lessons)
  productId: string;                // BasketProduct.product_id
  name: string;                     // BasketProduct.name (display name)
  quantity: number;                 // BasketProduct.quantity
  unitPrice: string;                // BasketProduct.selling_price_formatted
  lineTotal: string;                // BasketProduct.total_amount_formatted
  minQty: number;                   // BasketProduct.product.min_order_quantity
  maxQty: number;                   // BasketProduct.product.max_order_quantity (0 = unlimited)
  step: number;                     // BasketProduct.product.unit_quantity
};

type TotalsView = {
  subtotal: string;                 // basket.net_amount_formatted
  discount: string;                 // basket.total_discount_amount_formatted
  tax: string;                      // basket.tax_amount_formatted
  total: string;                    // basket.total_amount_formatted
};

type QuantityChangeIntent = {
  basketProductId: string;
  newQuantity: number;
};

// Claim outcome surfaced back to feature 1's auth flow
type ClaimResult = {
  claimed: boolean;
  basketId: string | null;          // null when there was no guest basket to claim
};
```

## API calls (in execution order)

| Step | Method | Endpoint | Purpose | Fixture |
| --- | --- | --- | --- | --- |
| **Read product for the configurator** | | | | |
| 1a | GET | `/basket/products/{productId}?currency_code=<code>&lang=<lang>&with=image,images,prices,products_attributes,products_attributes.icon,products_options,products_options.icon,products_options.prices,category.top_category.top_category.top_category.top_category,provision_blueprint.category` | Single-product configure read — **no `basket_id`** (no basket yet). Response includes `provision_blueprint` metadata but **not** field definitions | `07-references/recordings/get-basket-products-{productId}-{hash}.json` (see product module's fixture index) |
| 1b | GET | `/basket/products/{productId}?…&basket_id=<id>` | Single-product configure read — **with `basket_id`** (basket exists, basket-accurate prices) | Same shape as 1a; different query string |
| **Read provision-field definitions (separate call)** | | | | |
| 2a | GET | `/basket/products/{productId}/provision_fields?lang=<lang>` | Initial provision-field definitions on product-page load. **No `sub_product_ids`** — storefront captures confirm `?lang=<lang>` only. Returns `BlueprintField[]` | `07-references/recordings/get-basket-products-20403869-...-provision_fields.json` |
| 2b | GET | `/basket/products/{productId}/provision_fields?sub_product_ids=<csv>&lang=<lang>` | Re-read after the user picks / unpicks an option or attribute — different selections can unlock or hide different fields. Pass `sub_product_ids` here, not on the initial load | Same shape as 2a; different query string |
| **Configured-price preview** | | | | |
| 2c | POST | `/cart/calculate` | Sum the configured price rows in the requested currency; returns `{ total, total_formatted, prices }`. Fires on every configurator change (term / option / attribute / qty). Body: `{ currency_id, prices: [<number \| { price, quantity }>] }` | _(see product.md `POST /cart/calculate` for the request/response shapes)_ |
| **Create basket (first add)** | | | | |
| 3 | POST | `/orders` | Create new basket with first configured product; returns full envelope | `07-references/recordings/post-orders.json` |
| **Seat a product (basket exists)** | | | | |
| 4 | POST | `/orders/{basketId}/products` | Add a configured product to the existing basket; returns **full refreshed basket** (diff to find new entry) | `07-references/recordings/post-orders-5d96e763-ed09-13e9-e0df-417482528340-products.json` |
| **Seat errors** | | | | |
| 4a | POST (error) | `/orders/{basketId}/products` | Field-validation error — all required fields missing | `07-references/recordings/post-orders-03679424-products-error-allfields-{hash}.json` |
| 4b | POST (error) | `/orders/{basketId}/products` | Quantity-options validation error | `07-references/recordings/post-orders-03679424-products-error-quantityoptions-{hash}.json` |
| **Load current basket** | | | | |
| 5 | GET | `/orders/current` | Load the calling token's in-flight basket | `07-references/recordings/get-orders-current.json` |
| **Adjust quantity / configuration / commit deferred provisioning** | | | | |
| 6 | PUT | `/orders/{basketId}/products/{basketProductId}` | Update one basket product (quantity, term, options, attributes, provision fields). Body must include the full `BasketProductConfig` — omitted fields clear | _(no error-free capture in bundle yet; envelope shape per basketProduct.md)_ |
| **Remove a line** | | | | |
| 7 | DELETE | `/orders/{basketId}/products/{basketProductId}` | Remove the line; returns the refreshed basket without that entry | _(no dedicated capture in bundle; response is `IBasket`)_ |
| **Switch currency on the basket** | | | | |
| 8 | PUT | `/orders/{basketId}/currency` | Change the basket's currency; body `{ currency_code }`. Apply the canonical wide `?with=` expand so the response inflates correctly (operating principle #20). Response is the refreshed basket with re-computed totals | _(no dedicated capture in bundle; response is `IBasket`)_ |
| **Basket claim on auth transition** | | | | |
| 9 | PATCH | `/orders/claim` | Re-parent the guest's basket onto the now-authenticated client. Bearer = client token; body = `{ guest_token }`. Idempotent. Empty `data` array on success — re-read `/orders/current` to observe the claimed basket | `07-references/recordings/patch-orders-claim.json` |
| **Read in-basket provisioning values (used by feature 6 too)** | | | | |
| 10 | GET | `/orders/{basketId}/products/{basketProductId}/provision_fields/values` | Read stored provisioning values for a basket line. Empty array when none supplied | `07-references/recordings/get-orders-{basketId}-products-{productId}-provision_fields-values.json` |

> Path note: the seat / update / remove endpoints live under `/orders/{basketId}/products/...` (per `basket.md` and `basketProduct.md`). The single-product configure read is `/basket/products/{id}` — same endpoint family as feature 3's listing, with a different `with=` expand and the optional `basket_id` query.

## Edge cases

### Product page + configurator

- **Product not found (404).** Surface a "product unavailable" view tied to foundations §4's `not_found` AppError category, not a raw error.
- **Currency mismatch on the product page.** A product with no price row for the active currency arrives with `prices: []` — the headline `display_price` may still be populated against a fallback, but treat an empty `prices` array as "not sellable in this currency" and either hide the CTA or grey it out.
- **Headline price vs configured price.** `display_price` is the catalogue editorial headline (lowest cycle, or lowest monthly-equivalent — brand-policy driven). It is **not** what the customer pays. The configurator's term + option selections drive the actually-payable price, which the seat response confirms.
- **Configured-price preview is the formatted `/cart/calculate` total.** Don't compute the displayed price client-side from raw numbers — the brand's currency formatting is a back-end concern. Pick the raw prices, POST them to `/cart/calculate`, render `total_formatted`. The calculate preview is editorial in the sense that the seat response remains authoritative; do **not** gate the "Add to basket" CTA on a preview/server match, and do **not** keep the calculate preview displayed once the basket has it — switch to the basket envelope's `total_amount_formatted` once seated.
- **Stale calculate responses (product.md lesson).** The platform doesn't sequence `/cart/calculate` responses, so under rapid configurator interaction a stale response can land after a fresher one. Without a client-side guard the displayed price flickers and can settle on a value that no longer matches the current configuration. Tag each calculate request with a monotonic id; on response, ignore landings whose id is not the latest issued.
- **`basket_id` toggle on the configure read.** The single-product read carries `basket_id` **only after the first seat lands.** Before that there is no basket id to send. Once the basket exists, the configure read for any subsequent product visit carries it so option/term selection drives basket-accurate prices. Don't send `basket_id` speculatively; operating principle #9 still bites for nothing in return.
- **Quantity-constraint sentinel values.** `product.unit_quantity: 0` means **no stepping constraint** (not literal zero); `product.min_order_quantity: 0` means **no minimum**; `product.max_order_quantity: 0` means **unlimited**. Use truthy fallback (`step || 1`, `floor || 1`) when computing — never `??`. A `??` against an explicit `0` applies a stepping rule that doesn't exist; a `*` against `unit_quantity: 0` silently zeroes the quantity. See product.md "Quantity-constraint fields use 0 as no constraint".
- **Required options not yet selected.** Disable "Add to basket" client-side until every `required: true` option group has a selection (and every `multiple: false` group has exactly one). Server-side validation still runs — silent-strip can still fire on edge combinations even with all required fields populated.
- **`required` means different things for option groups vs provision fields.** Same field name on the data model, opposite CTA-gating rules:
  - **Option groups with `required: true`** → block "Add to basket" until the user selects a value (step 6).
  - **Provision fields with `required: true`** → **do not** block "Add to basket". Required-here means required-at-commit (step 12's PUT), not required-at-seat. Seat fires with `provision_field_values_validate: false` and an empty / partial `provision_field_values` array; the user supplies values from the cart page, and the PUT commits them with `provision_field_values_validate: true` defaulted back on. This is the deferral primitive — see basketProduct.md `BasketProductCreate.provision_field_values_validate` for the wire flag.

### Seat + cart manage

- **Diff to find the new entry (operating principle #8).** Seating returns the full basket; the new entry is in there but unflagged. Diff post-seat `products[]` against the pre-seat snapshot keyed by basket-product `id`. Two cases the diff has to handle:
  - One seating call can yield **multiple** new basket-products (some catalogue products materialise as N entries).
  - Seating a quantifiable product **already on the basket** yields **zero** new entries — the platform merges into the existing line and bumps quantity. Surface as a quantity delta on an existing id.
- **`basket_id` recomputation cost (operating principle #9).** Feature 3's catalogue listings fire reads **without** `basket_id` — every product card paying the per-request recomputation is expensive. This feature pays the cost on the single-product configure read once a basket exists. The cart-page `/orders/...` endpoints are basket-scoped by path so the cost is mandatory there.
- **Currency mismatch between brand default and basket.** Basket wins. Switch the foundations currency slot to `basket.currency.code` as soon as the basket lands.
- **Guest basket + client login.** Run claim immediately after `/self` returns the client identity. Don't drop the guest token until claim returns 2xx (basket lesson: "the guest token must only be dropped on a successful claim").
- **Claim is required after login _and_ after the basket refresh that login triggers.** A refresh that races past the persisted client token can silently no-op and leave the basket with `client_id: null`. Re-attempt claim on subsequent refreshes until the underlying record carries a `client_id`.
- **Mutation in flight when user logs in.** Queue the claim behind the in-flight mutation. Firing claim against a basket that's still settling produces a stale view.
- **Parallel quantity adjustments on the same line.** Serialise per basket-product id client-side. The basket is a single mutable envelope and out-of-order responses produce visible "regression" flickers (basket lesson: "in-flight basket reads can land out of order").
- **Partial-body trap on PUT.** A field omitted from `PUT /orders/{basketId}/products/{...}` is treated as "clear it", not "leave it alone". Re-send the full `BasketProductConfig` every time — `product_id`, `billing_cycle_months`, `options`, `attributes`, `provision_field_values`.
- **`product_id` is not the basket product's identity.** A basket can contain the same catalogue product more than once with different configurations. Address every mutation by `basket_product.id`, never by `product_id`.
- **Validation rejections leave the basket unchanged.** A 4xx on `POST /orders`, `POST /orders/{basketId}/products`, or `PUT` leaves the basket as it was. Surface field errors from `error.data` (foundations §4.3) keyed against the form inputs; don't drop the prior state.
- **Silent strip on `2xx + status: "ok"` (THE dangerous third path).** Seating and PUT can return `200 OK + status: "ok"` and still have **stripped the basket product post-acceptance**. The platform validates at HTTP level (4xx for hard rejections) and then runs a second pass on viability (quantity stepping per `unit_quantity`, mandatory options, brand combination rules). A failure in the second pass produces `data.products[]` missing the line you submitted, with `data.warning_notes` populated to explain why. See foundations.md §4.7 and basket.md "Mutations can silently strip what they accepted". **Defensive pattern (must implement):**
  1. Snapshot `basket.products[]` before every seat / PUT.
  2. Issue the mutation.
  3. On `2xx`, diff post against pre. If the line you submitted is **absent** and `data.warning_notes` is **non-empty**, surface `warning_notes[].message` to the user as a soft error.
  4. Do **NOT** treat the mutation as applied unless the line is present in the response. Cart badges, success toasts, "added to basket" UI must wait on this verification.
- **Empty `/orders/current`.** A fresh actor returns an empty / 204-shaped response, not an error. Treat as `state = empty`, not as a failure.
- **Free-total baskets don't automatically skip payment.** When the basket's `total_amount` is `0` (100%-discount promotion, free trial, free product) the storefront's instinct is to skip the payment surface and convert directly. **This is wrong if `brand.config["billing.gateway.force_card_storage"] === true`** — the brand requires a card on file for the resulting subscription's renewal, even on a free first purchase. The basket-to-payment transition logic must read the card-storage key from the cached brand config (feature 2) and route accordingly: total > 0 → payment; total === 0 + force_card_storage → payment in capture-mode (SetupIntent / $0 auth); total === 0 + !force_card_storage → skip directly to confirmation. Cross-ref: SDD 06 edge cases on `force_card_storage`, basket.md lesson "Free-order checkout still needs a payment method on some brands".
- **Basket abandoned and resumed days later.** Out of scope for the prototype — the spine only handles within-session resumption.

## Validation checklist

### Product page + configurator

- [ ] Clicking a card on the catalogue (feature 3) routes to `/product/{id}`; this feature reads the configure shape and renders the page (name, description, image, headline price, breadcrumb walked from `category.top_category`)
- [ ] Configurator renders: term selector (one per `prices[]` row), one picker per option / attribute group, quantity stepper (respecting `min_order_quantity` / `max_order_quantity` / `unit_quantity`), provision-field form (label + type + required)
- [ ] Provision-field definitions come from `GET /basket/products/{productId}/provision_fields` (a separate call from the product configure read) — verify in the Network tab there is a dedicated provision_fields request on product-page load
- [ ] Changing an option or attribute selection re-fires the provision_fields call with the updated `sub_product_ids` query; already-entered values are preserved for fields that still exist in the new response, dropped for fields that don't
- [ ] Changing a term / option / attribute / quantity fires `POST /cart/calculate` with the raw selected prices + currency; the UI renders `total_formatted` from the response — no client-side currency formatting
- [ ] Rapid configurator interaction (e.g. quickly toggle 3 options in a row) does NOT flicker the price between stale values; the stale-response guard ensures only the latest calculate response commits to the UI
- [ ] The calculate preview is replaced by the basket envelope's `total_amount_formatted` once seated — no leftover preview value displayed post-seat
- [ ] "Add to basket" CTA disabled until all `required` option groups have a selection
- [ ] Network tab on the single-product configure read shows **no `basket_id`** before the first seat, and **`basket_id=<id>`** on every product visit thereafter

### Seat + cart manage

- [ ] Anonymous visitor on a product page clicks "Add to basket" — `POST /orders` fires, basket created, line seated, cart badge shows 1
- [ ] Second add (different product) fires `POST /orders/{basketId}/products`; diff against pre-seat snapshot identifies the new line; cart badge updates
- [ ] Seating a quantifiable product already in the basket yields zero new ids in the diff and bumps quantity on the existing line; cart badge increments by 1 (or matches the quantity-sum rule chosen in step 8)
- [ ] Cart page renders line items, per-line quantities, unit prices, line totals, subtotal, tax, and grand total — all from server-computed formatted strings
- [ ] Quantity +/- on a line fires `PUT /orders/{basketId}/products/{...}` with the full config body; totals refresh from the response
- [ ] **Provisioning-deferred seating + commit works.** A product with required provisioning fields can be seated with `provision_field_values_validate: false` (empty provision-field form); the basket lands the line; the cart-page commit form fires PUT with `provision_field_values_validate: true` and the filled values, and that commits them
- [ ] Remove on a line fires `DELETE /orders/{basketId}/products/{...}`; basket reflects the removal
- [ ] Guest builds a basket → registers or logs in → `PATCH /orders/claim` fires with the guest token in the body; subsequent `GET /orders/current` returns the same basket id with `client_id` populated
- [ ] Foundations currency slot switches to `basket.currency.code` the first time a basket with a non-brand-default currency lands
- [ ] Two rapid quantity +/- clicks on the same line are serialised; the final quantity matches the last user click (no "regression" flicker)
- [ ] A 4xx on seat or quantity update leaves the basket unchanged and surfaces field-level errors against the offending input
- [ ] **Silent-strip detection works on seat AND PUT.** Seating with `quantity: 1` against a catalogue product whose `unit_quantity: 2` returns `200 + status: "ok"` with the line absent from `data.products[]` and `data.warning_notes` populated. The UI surfaces `warning_notes[].message` and does NOT show a success state.
- [ ] **Currency switcher works pre- and post-basket.** Visitor with no basket switches USD → GBP via the header dropdown: foundations currency slot updates immediately, next catalogue read carries `?currency_code=GBP`. Visitor with a basket switches currency: `PUT /orders/{basketId}/currency` fires with `{ "currency_code": "GBP" }` and the basket's totals re-compute. Rapid switches debounce 250-500ms.

## Notes for the agent

- The basket envelope is the single source of truth for cart state. Don't shadow line items, totals, or currency in a parallel store.
- **This feature owns the product page.** Feature 3 ends at the card click; `/product/{id}` is rendered here, including the full configurator. The configurator drives the seat — they are one surface.
- Seating returns the full basket — diff against pre-seat to find the new entry (operating principle #8). Don't assume one seating call equals one new line, and don't assume there is always a new line.
- `basket_id` on the configure read costs (operating principle #9). This feature pays it once a basket exists so the configurator preview reflects basket-accurate prices; feature 3's listings do not.
- The configurator's local preview is editorial. The authoritative payable price comes from the seat response and the cart envelope. Don't drift into client-side price recomputation as a source of truth.
- Silent-strip is the dangerous third path: `2xx + status: "ok"` but the line is missing from `data.products[]`. Verify presence post-response before declaring success on seat or PUT.
- `provision_field_values_validate: false` on seat is the deferral primitive — seat now, commit values later via the cart-page PUT.
- Currency follows the basket once one exists. The foundations layer reads the slot transparently — set it once on basket-land, don't re-derive on every render.
- Basket claim is the only auth-aware operation here. Don't try to "log the user in" inside this feature — that's feature 1's job; this feature reacts to the transition.
- Address every mutation by the **basket-product id**, never by `product_id`. The same catalogue product can appear twice on one basket with different configurations.
- `PUT` is a full replace: re-send every field of `BasketProductConfig` even when only quantity is changing. A field omitted is a field cleared.
- Render totals from server-computed `*_formatted` strings. Local recomputation drifts on stacked promotions, tax-inclusive pricing, and cross-currency baskets.
- Promotions, discounts, per-basket custom fields, and sub-products are out of scope. The basket totals are whatever the platform returns; promo entry ships in later features (or stays doc'd-only per generic.md §3).
- **Currency switcher implementation lives here.** The dropdown component reads `brand.currencies` (cached from feature 2). On change, the handler branches on basket existence: no basket → update foundations currency slot only; basket exists → fire `PUT /orders/{basketId}/currency` with `{ currency_code }` and apply the basket's wide `?with=` expand so the response inflates correctly (operating principle 20). Debounce 250-500ms client-side. The component itself can live in the app shell or in a feature 4 sub-component — either is fine; the wiring is what matters.
- `WAITING` / `AWAITING_CLIENT` payment states don't appear in this feature — they're feature 6's concern.
