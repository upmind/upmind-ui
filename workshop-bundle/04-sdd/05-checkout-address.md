# SDD 05 — Checkout (address)

## Goal

The visitor has a basket with at least one line item and is authenticated. They land on the address step: their saved addresses render in a picker, a "new address" form is always available, a phone is captured if none exists, and (for B2B brands only) a company is captured for tax. The user commits, the foundations layer PUTs the resolved `address_id` / `phone_id` / `company_id` onto the basket envelope, and the basket transitions from "has products" to "ready to pay". No payment calls fire here.

## Depends on

- Feature 4 (Basket) — `basket.id` must exist with at least one line item.
- Feature 1 (Auth) — actor must be a client (not guest). Sub-record reads are scoped under `/clients/{clientId}/…` and require a client token.

## Modules consumed

- `basket` — see [02-module-foundations/basket.md](../02-module-foundations/basket.md) (capability 6: set billing details — `PUT /orders/{basketId}` with `{ address_id, company_id?, phone_id? }`)
- `client` — see [02-module-foundations/client.md](../02-module-foundations/client.md) (capabilities 2–7 for addresses + phones, 12–13 for companies)

## Reads (before generating any code)

- `06-initiator/generic.md` — sections 9 (validation checklist) and 10 (operating principles, especially #5: real shapes from real captures; #10: verify against the spec before committing)
- `03-foundations-chapter.md` — full chapter (§2 auth lifecycle, §4 error model — field-level validation extraction is load-bearing here)
- `02-module-foundations/basket.md` — full, with focus on the `PUT /orders/{basketId}` endpoint and the lesson "Tax behaviour reads from three places" (setting an address invalidates the running tax breakdown)
- `02-module-foundations/client.md` — full, with focus on the address / phone / company data shapes, the `region_id: "none"` vs `null` distinction, and the lesson "The default-record helpers are derived, not stored"

## What this feature does

1. Address page mounts. The basket id is in scope (feature 4 set it). The client id is in scope from the session (feature 1 stored it).
2. Issue three reads in parallel: `GET /clients/{clientId}/addresses?with=region,country`, `GET /clients/{clientId}/phones`, and — only if the brand's checkout config asks for company / tax — `GET /clients/{clientId}/companies?with=address,address.country,address.region`. The countries list is already cached from feature 2's brand bootstrap; do **not** re-fetch.
3. Render the address book. Pick the row carrying `default: true` as the initial selection; if no default and the list is non-empty, pick the first row; if empty, render the new-address form expanded by default.
4. Render the phone picker the same way (`default: 1` for phones — note the integer flag). If the phone list is empty, render a phone form alongside the address form — without a phone the platform won't accept billing on most brands.
5. Render the company picker only when the brand's checkout config flags it (B2B brand). If absent or unset, skip the company UI entirely — the prototype's test brand is B2C unless the brand bootstrap says otherwise.
6. When the user picks a country in the new-address form, lazily fetch its regions: `GET /countries/{countryId}/regions?limit=0`. **Pass `limit=0` explicitly** — the platform defaults to a small page size and the US / UK / Canada region lists silently truncate without it. Cache per-country. If the country has no regions (empty list), don't render the regions dropdown — bind `region_id: null` on submit. If the country has regions but the user hasn't picked one, bind `region_id: "none"` (the sentinel; see client.md lesson on `null` vs `"none"`).
7. On "save new address" submit: `POST /clients/{clientId}/addresses` with the `AddressBody` shape (`address_1`, `city`, `postcode`, `country_id`, optional `region_id`, optional `address_2`, optional `name`/`type`). On success, the new row is appended to the cached address list and auto-selected.
8. On "save new phone" submit (if needed): `POST /clients/{clientId}/phones` with `{ phone, phone_code, phone_country_code, type? }`. National-number form, calling-code with leading `+`, ISO-2 country code — see client.md "Phone numbers are stored in three forms" lesson. Do not round-trip `full_phone` or `international_phone` as the input.
9. On "save company" submit (B2B only): `POST /clients/{clientId}/companies` (new) or `PUT /clients/{clientId}/companies/{companyId}` (existing) with `{ name, reg_number?, vat_number?, address_id, phone_id, email_id? }`. The `vat_*` validation outcome fields are server-owned — do not send them, read them later. The create response always carries `vat_validated: null`; treat that as "pending", not "failed".
10. On "Continue to payment" click: `PUT /orders/{basketId}` with `{ address_id, phone_id, company_id? }` — `company_id: null` for B2C, omitted for "not applicable". The response is the full updated basket (same shape as `GET /orders/current`) with `address_id` / `phone_id` / `company_id` now populated on the envelope and tax recomputed across every line. Replace the cached basket with this response.
11. Enable the "Continue to payment" CTA only after the PUT resolves and the basket envelope shows the expected `address_id` (and `phone_id`, and `company_id` if B2B). Route to feature 6 (payment).
12. Validation: walk the team through the page, confirm the per-feature checklist below, then mark the feature done in section 8 of the initiator.

## Data shapes (feature-scoped)

These are view-models the feature assembles from the module-foundation types. Full types live in the module foundation docs.

```ts
// The page's top-level view-model
type CheckoutViewModel = {
  addresses: AddressOption[];          // mapped from client.md Address[]
  phones: PhoneOption[];               // mapped from client.md Phone[]
  companies: CompanyOption[] | null;   // null when the brand is B2C
  selected: {
    addressId: string | null;
    phoneId: string | null;
    companyId: string | null;
  };
  forms: {
    newAddress: AddressFormState;
    newPhone: PhoneFormState;
    newCompany: CompanyFormState | null;
  };
  errors: FieldErrors;                 // from AppError.fieldErrors (foundations §4)
  status: "idle" | "saving" | "applying" | "ready";
};

// Card-shape projections for the pickers
type AddressOption = {
  id: string;
  isDefault: boolean;                  // Address.default
  label: string;                       // composed: "address_1, city, country.code"
  countryCode: string;
};

type PhoneOption = {
  id: string;
  isDefault: boolean;                  // Phone.default === 1
  display: string;                     // Phone.full_phone
  countryCode: string;                 // Phone.phone_country_code
};

type CompanyOption = {
  id: string;
  isDefault: boolean;                  // Company.default
  name: string;
  vatNumber: string | null;
  vatValidated: 0 | 1 | null;          // null = pending or never validated
};

// Form inputs — mirror the BE input shapes named in client.md
type AddressFormState = {
  address_1: string;
  address_2: string;
  city: string;
  postcode: string;
  country_id: string | null;
  region_id: string | null | "none";   // see client.md region_id lesson
  name?: string;
  type?: number;
};

type PhoneFormState = {
  phone: string;                       // national number, no prefix
  phone_code: string;                  // "+44"
  phone_country_code: string;          // "GB"
  type?: number;
};

type CompanyFormState = {
  name: string;
  reg_number: string;
  vat_number: string;
  address_id: string;                  // id from the address picker
  phone_id: string;                    // id from the phone picker
  email_id?: string;                   // default email if present
};

// Body sent to PUT /orders/{basketId} — confirmed from basket.md
type BasketBillingPatch = {
  address_id: string;                  // required
  phone_id?: string | null;            // recommended; many brands require
  company_id?: string | null;          // B2B only; null/omitted for B2C
};

type FieldErrors = Record<string, string[]>;
```

## API calls (in execution order)

| Step | Method | Endpoint | Purpose | Fixture |
| --- | --- | --- | --- | --- |
| 1 | GET | `/clients/{clientId}/addresses?with=region,country` | Load the address book | `07-references/recordings/get-clients-{clientId}-addresses.json` |
| 2 | GET | `/clients/{clientId}/phones` | Load the phone list | `07-references/recordings/get-clients-{clientId}-phones.json` |
| 3 | GET | `/clients/{clientId}/companies?with=address,address.country,address.region` | Load companies (B2B brand only) | `07-references/recordings/get-clients-{clientId}-companies.json` |
| 4 | GET | `/countries/{countryId}/regions` | Lazy regions for the country picked in the new-address form | `07-references/recordings/get-countries-{countryId}-regions.json` |
| 5 | POST | `/clients/{clientId}/addresses` | Capture a new address | `07-references/recordings/post-clients-{clientId}-addresses.json` |
| 6 | POST | `/clients/{clientId}/phones` | Capture a new phone | `07-references/recordings/post-clients-{clientId}-phones.json` |
| 7 | POST or PUT | `/clients/{clientId}/companies[/{companyId}]` | Create or update company (B2B only) | `07-references/recordings/put-clients-{clientId}-companies-{companyId}.json` |
| 8 | PUT | `/orders/{basketId}` | Apply billing to the basket envelope | `07-references/recordings/put-orders-{basketId}.json` |

The body sent to step 8 is `{ address_id, phone_id?, company_id? }` per basket.md's `SetBillingBody` type and the captured curl in the basket foundation doc. The response is the full updated basket — same shape as `GET /orders/current` — with `address_id`, `phone_id`, `company_id` now populated and every line item's tax row recomputed against the new billing country.

## Edge cases

- **No existing addresses on the client record.** Render the new-address form expanded by default instead of an empty list. Don't pretend the picker is present-but-empty; the customer should see the path forward immediately.
- **No existing phones on the client record.** Render the phone form alongside the address form. Without a phone the brand will likely reject the PUT.
- **Country has no regions** (e.g. small territories — `region_id` returns as `null` on existing addresses). Don't render the regions dropdown; bind `region_id: null` on submit.
- **Country has regions but the user hasn't picked one yet.** Bind `region_id: "none"` (the sentinel — see client.md lesson "`region_id: \"none\"` and `region_id: null` are different states"). The brand may further enforce region-required via its `REQUIRE_REGION_IN_ADDRESS` policy; surface the resulting 422 as a field error on `region_id`.
- **Brand config flags DRIVE form validity, not just sit in cache.** The four checkout-relevant config keys from feature 2's bootstrap directly shape what the form requires:
  - `invoices.common.require_phone_for_orders: true` → the phone section is **required**; "Continue" is disabled until a phone is selected / entered. When `false`, the phone section is **hidden entirely** (do not render an empty phone picker).
  - `invoices.common.require_address_for_orders: true` → at least one address must be selected before "Continue" enables.
  - `invoices.common.required_region_in_address: true` → for any country with a regions list, the region picker is required (binding `"none"` is rejected with 422); for countries without regions, `region_id: null` is still valid.
  - `invoices.guest_checkout.enabled: false` → unauthenticated visitors are redirected to login before this surface mounts; the form assumes an authenticated client.
  - **Implementation rule:** these flags don't just exist in the cache — they are the source of truth for the form's validation predicate. A storefront that caches the flags but hard-codes "phone always required" or "regions always required" ships brand-incorrect validation for any brand with the opposite setting.
- **`PUT /orders/{basketId}` to apply billing requires the wide `?with=` expand on the request** to get an inflated response. Without it the response carries `address_id` populated but `address: null` — and the next view (payment, feature 6) needs `basket.address.country.code` to filter gateways. The basket store's wide expand on rehydrate is not enough; the billing PUT itself must carry it. See generic.md operating principle 20 + basket.md "PUT and PATCH responses inflate only what `?with=` requests".
- **Validation error from POST /clients/{clientId}/addresses.** The foundations layer normalises the 422 envelope into `AppError.fieldErrors` (foundations §4.3). The form attaches messages to inputs by the BE's field names (`address_1`, `postcode`, `country_id`, `region_id`). Do not render as a toast.
- **Phone format.** The form collects three inputs (`phone`, `phone_code`, `phone_country_code`) and sends them back unchanged. Do not synthesise the `phone` field from a stored `international_phone` — round-tripping the server-rendered display form fails validation in unpredictable country-specific ways.
- **Address saved but PUT /orders/{basketId} fails.** The address row persists on the client record. Allow retry of the PUT only — do not re-POST the address (it would create a duplicate). The cached address list already contains the new row.
- **Brand's company-required flag absent or false.** The prototype's test brand is B2C unless the brand bootstrap proves otherwise. Skip the company UI entirely. Send `company_id: null` (or omit) on the PUT.
- **VAT validation outcome on a freshly-saved company.** The POST/PUT response returns `vat_validated: null`. That means "pending", not "failed" — see client.md lesson "VAT validation outcome is asynchronous and read-only". Don't render a red banner off the immediate response; the result lands on a later read.
- **Address change after billing has already been applied.** The basket is mutable until conversion. A second PUT replaces the previous billing and re-runs tax computation — accept this is the normal edit path, no special handling needed.
- **Token expiry mid-edit.** The foundations layer's refresh-and-replay (§2.5) covers this transparently. The feature need not handle 401 itself.

## Validation checklist

- [ ] Cart "Proceed to checkout" CTA routes to the address page; the basket id is in scope and the client id resolves from the session.
- [ ] The address book renders all rows returned by `GET /clients/{clientId}/addresses?with=region,country`; the default row is pre-selected; the "new address" form is always reachable.
- [ ] A new address saves: `POST /clients/{clientId}/addresses` returns the new row, the row appears in the picker without a hard reload, and the new id is the one sent on the subsequent PUT.
- [ ] Country with regions: the regions dropdown loads after the country is picked (`GET /countries/{countryId}/regions?limit=0` — verify `limit=0` is on the wire), full region list renders (no silent truncation on US / UK / CA); country without regions: no dropdown renders and the form submits with `region_id: null`.
- [ ] **Brand-config flags drive form validity, not just cache.** Toggle the test brand's `invoices.common.require_phone_for_orders` and verify: when `true` the phone section is required and "Continue" gates on it; when `false` the phone section is hidden. Same toggle test for `require_address_for_orders` and `required_region_in_address`.
- [ ] **`PUT /orders/{basketId}` for billing carries the wide `?with=` expand.** Network panel shows `?with=address,address.country,client,company,phone,...` on the billing PUT. Response inflates the relations; the next view (feature 6 payment) reads `basket.address.country.code` without re-fetching.
- [ ] Validation errors (missing postcode, missing region when the brand requires it) surface as field-level errors on the form inputs, not as a toast.
- [ ] A new phone saves and is auto-selected; the basket PUT carries the new `phone_id`.
- [ ] `PUT /orders/{basketId}` succeeds: the response basket envelope has `address_id` and `phone_id` populated (and `company_id` for B2B brands); the cached basket is replaced with the response.
- [ ] The "Continue to payment" CTA is disabled until the PUT resolves with the expected envelope fields set; once enabled, clicking it routes to feature 6.
- [ ] No payment endpoints are invoked from this feature — Network tab shows zero calls to `/payments`, `/orders/{id}/convert`, or any gateway endpoint.

## Notes for the agent

- **Every form input gets the right `autocomplete` attribute.** Per initiator operating principle 12 — required for address auto-fill (browser-native + extensions) and password managers' address-storage features. Specifically for this feature:
  - Address line 1 → `autocomplete="address-line1"`
  - Address line 2 → `autocomplete="address-line2"`
  - City → `autocomplete="address-level2"`
  - State / region / county → `autocomplete="address-level1"`
  - Postcode / ZIP → `autocomplete="postal-code"`
  - Country → `autocomplete="country"` (when a free-text input) or `autocomplete="country-name"`
  - Company name → `autocomplete="organization"`
  - Phone → `autocomplete="tel"` (use `tel-national` if you split the country code into its own input)
  - Email (if collected on this screen) → `autocomplete="email"`
  - Each input also gets `name="..."` matching the autocomplete token (e.g. `name="address-line1"`) — some legacy autofillers key off `name` rather than `autocomplete`. Verify by opening the form in a Chrome profile with a saved address and checking the autofill prompt covers every field.
- The basket is mutable until conversion. Setting billing is a patch to the envelope, not a commit.
- DO NOT pre-fetch payment gateways here — that's feature 6's responsibility.
- DO NOT process payment here — that's feature 6.
- The active currency comes from the basket (set in feature 4). Every read in this feature is currency-agnostic except the basket PUT response, which carries the basket's own `currency_code`.
- Use the cached countries list from feature 2's brand bootstrap; do not re-fetch.
- B2B / company capture is brand-driven. If the brand config doesn't explicitly ask for it, default to B2C and skip the company UI.
- T&C inline acceptance is out of scope unless the brand bootstrap surfaces a T&C flag; if it does, include the accepted flag in the PUT body per basket.md's per-basket-fields shape.
- Tax IDs / VAT validation outcomes are read-only and asynchronous. Surface "pending" — don't paint it as an error.
- The `meta` field on any response is UI-specific to Upmind's own client — ignore.
