# Module: brand

## What it is

Brand resolves the identity, regional defaults, and policy configuration that every other customer-facing surface is built on top of. It answers four questions: _who is this storefront_ (name, logo, favicon, theme tokens, custom domain), _what regional defaults apply_ (default currency, supported currencies, default language, supported languages, country, tax treatment), _what policies are switched on for this brand_ (keyed configuration values — guest checkout, address requirements, partial payments, analytics IDs, payment-term defaults, …), and _what platform modules are licensed_ (provisioning, multi-brand, etc.). A storefront cannot meaningfully render products, prices, or a checkout until brand has resolved — currencies, tax behaviour, language list, and the active currency all come from here.

> _Any `meta` field returned by Upmind endpoints (e.g. `meta.i18n` on brand settings) is UI-specific to our own client — ignore for spec purposes._

### Keys by lifecycle phase

Brand configuration is keyed and fetched on demand. Keys group by the lifecycle phase in which they first become relevant. Phases describe relevance, not fetch order.

| Phase               | Keys                                                                                                                                                                                                                                                                                                                                | Relevance                                                                                                                                                |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Initial page load   | `ui.basket.default_currency`, `analytics.google.measurement_id`, `analytics.gtm.container_id`                                                                                                                                                                                                                                       | Determines which currency the basket and product list resolve in. Analytics IDs must be wired before the first page view fires.                          |
| Product display     | `invoices.common.display_price_type`, `invoices.common.default_payment_period`, `invoices.common.show_promotion_as`, `ui.basket.payment_term_descriptions`                                                                                                                                                                          | Controls how prices, billing terms, and promotional badges render.                                                                                       |
| Auth / registration | `ui.client_area.hide_registration_forms`, `ui.client_registration.require_phone`                                                                                                                                                                                                                                                    | Switches registration off entirely and toggles whether phone is a registration requirement.                                                              |
| Checkout            | `invoices.common.require_address_for_orders`, `invoices.common.require_company_for_orders`, `invoices.common.required_region_in_address`, `invoices.common.require_phone_for_orders`, `invoices.common.require_payment_details_for_zero_amount_orders`, `invoices.common.is_available_pay_later`, `invoices.guest_checkout.enabled` | Determines which address / company / phone fields are required and which checkout-time actions are available (pay later, guest checkout).                |
| Payment             | `billing.gateway.force_auto_payment_for_stored_details`, `billing.gateway.force_card_storage`, `billing.gateway.client_allow_partial_payments`, `billing.gateway.allow_card_removal_replacement`                                                                                                                                    | Constrains how stored payment methods behave (force-store, force-auto-pay, partial payment availability, prevent removal of last card).                  |
| Post-purchase       | `tickets.support.support_pin_enabled`, `security.ui.allow_vault`                                                                                                                                                                                                                                                                    | Enables the support-pin identity-check flow and the per-client secrets vault.                                                                            |
| Tax                 | `invoices.common.accounting_revenue_recognition`, `price_tax.tax.enable_automatic_vat_validation`                                                                                                                                                                                                                                   | Tax treatment policy. Combined with the brand-level `tax_type` they determine whether prices include tax and whether VAT numbers are validated upstream. |

## Core concepts

- **Brand settings** — the identity bundle for one storefront: name, custom domain, language list, currency list, tax treatment, images, theme tokens.
- **Brand config** — a sparse key/value bag of policy switches scoped to one brand. Read on demand by key.
- **Organisation features** — a similar key/value bag scoped to the parent organisation (account-package entitlements). Sits above brand config in the precedence chain.
- **Module catalogue** — the set of platform modules (e.g. web hosting / provisioning) licensed to the organisation. Drives whether provisioning-dependent surfaces light up.
- **Terms and conditions** — the active T&C document for the brand, either embedded content or a redirect URL.

## Operations

| #   | Capability                           | Inputs                            | Outputs                                                                                                                                |
| --- | ------------------------------------ | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Read brand identity**              | —                                 | `id`, `name`, custom domain, country, prefix, demo-data flag                                                                           |
| 2   | **Read visual assets**               | —                                 | logo image, icon, favicon, theme style + tokens, theme variant                                                                         |
| 3   | **Read regional defaults**           | —                                 | default currency, full currency list, default language, full language list, country                                                    |
| 4   | **Read tax policy**                  | —                                 | `tax_type` enum, derived `includes_tax` flag                                                                                           |
| 5   | **Validate a currency selection**    | currency `{ id?, code? }`         | matched currency from supported list, or brand default if input is unknown/empty                                                       |
| 6   | **Validate a language selection**    | language `{ id?, code? }`         | matched language from supported list, or brand default if input is unknown/empty                                                       |
| 7   | **Check locale support**             | locale code (e.g. `"en"`, `"fr"`) | boolean                                                                                                                                |
| 8   | **Read keyed brand config**          | one or more keys                  | value(s) for the requested keys, defaulted to `null` if the platform has no value set                                                  |
| 9   | **Read organisation features**       | —                                 | record keyed by feature code with boolean / scalar values                                                                              |
| 10  | **Check module entitlement**         | module code (e.g. `web_hosting`)  | boolean — is this module licensed to the organisation                                                                                  |
| 11  | **Read terms & conditions**          | —                                 | `{ title, content }` for embedded T&Cs, or `{ title, url }` for a redirect-style policy                                                |
| 12  | **Readiness / refresh / invalidate** | —                                 | readiness signal (resolves once all four data buckets have settled); refresh forces a re-fetch; invalidate marks all brand state stale |

## Data shape

```ts
// Brand identity bundle — returned by GET /brand/settings.
type BrandSettings = {
  id: string; // brand UUID
  code: string; // short opaque slug
  name: string; // display name
  prefix: string; // invoice / object prefix
  domain: string; // primary custom domain
  country_id: string;
  country?: Country; // populated when expanded
  region_id: string | null;
  language_id: string; // default language
  languages: Language[]; // supported languages
  currency_id: string; // default currency
  currencies: Currency[]; // supported currencies
  pricelist_id: string;
  tax_type: BrandTaxType; // 0=exclude, 1=include-respect-client, 2=include-ignore-client
  vat_number: string;
  vat_exempt: 0 | 1;
  style: {
    // theme assets
    brand_color: string;
    brand_font?: { family: string; version: string };
    tokens?: string; // opaque design-token bundle id
  } | null;
  image: Image | null; // primary logo
  icon: Image | null; // square mark
  favicon: Image | null; // browser-tab icon
  email_logo?: Image | null; // logo used in transactional emails
  oauth_clients: OAuthClient[]; // registered storefront origins
  demo_data_import_id: string | null; // non-null while brand is on seeded demo data
  wipe_data: boolean;
};

type BrandTaxType =
  | 0 // EXCLUDE_TAX — prices net of tax
  | 1 // INCLUDE_TAX_RESPECT_CLIENT_TAX — gross prices, recalculate per client tax
  | 2; // INCLUDE_TAX_IGNORE_CLIENT_TAX — gross prices, do not recalculate

// Per-image asset shape (logo, icon, favicon, email_logo).
type Image = {
  id: string;
  object_id: string;
  object_type: "brand";
  type: "image" | "icon" | "email_logo";
  default: boolean;
  origin_name: string;
  full_url: string;
  hash: string;
  size_category: { id: string; name: string };
  resized: boolean;
  order: number;
  created_at: string;
  updated_at: string;
};

// Per-currency entry.
type Currency = {
  id: string;
  code: string; // ISO 4217 — e.g. "USD"
  name: string; // display name
  prefix: string; // e.g. "$"  — left-of-amount glyph
  suffix: string; // e.g. "R"  — right-of-amount glyph
  decimals: boolean; // false for zero-decimal currencies (e.g. UGX)
  base: boolean; // sourced from the canonical currency list
  manual: 0 | 1; // 1 if the brand maintains a manual conversion rate
};

// Per-language entry.
type Language = {
  id: string;
  language: string; // display name — e.g. "English"
  code: string; // BCP-47 code — e.g. "en", "en-US", "fr"
};

// Registered storefront origin — one per host the brand accepts.
type OAuthClient = {
  id: string;
  name: string;
  origin: string; // host the storefront runs on
  brand_id: string;
  org_id: string;
  default: boolean;
  custom: boolean; // true if added by the brand owner
  staff_enabled: boolean;
  customer_enabled: boolean;
  revoked: boolean;
  origin_healthy: boolean; // result of last reachability probe
  provider: string | null;
};

// Keyed configuration — returned by GET /config/brand/values.
// Sparse: only requested keys appear. Unknown keys come back null.
type BrandConfig = Record<BrandConfigKey, BrandConfigValue>;

type BrandConfigKey =
  | "ui.basket.default_currency" // "brand" | "language"
  | "invoices.common.default_payment_period" // 0=inherit | 1=lowest | 2=lowest_monthly | 3=highest
  | "invoices.common.display_price_type" // "min" | …
  | "invoices.common.show_promotion_as" // "percentage" | "amount" | …
  | "invoices.common.require_address_for_orders" // boolean
  | "invoices.common.require_company_for_orders" // boolean
  | "invoices.common.required_region_in_address" // boolean
  | "invoices.common.require_phone_for_orders" // boolean
  | "invoices.common.is_available_pay_later" // boolean
  | "invoices.common.require_payment_details_for_zero_amount_orders" // boolean
  | "invoices.guest_checkout.enabled" // boolean
  | "ui.basket.payment_term_descriptions" // "monthly" | …
  | "ui.client_area.hide_registration_forms" // boolean
  | "ui.client_registration.require_phone" // boolean
  | "ui.checkout.hide_promotions_field" // boolean
  | "billing.gateway.force_auto_payment_for_stored_details" // boolean
  | "billing.gateway.force_card_storage" // boolean
  | "billing.gateway.client_allow_partial_payments" // boolean
  | "billing.gateway.allow_card_removal_replacement" // boolean
  | "tickets.support.support_pin_enabled" // boolean
  | "security.ui.allow_vault" // boolean
  | "price_tax.tax.enable_automatic_vat_validation" // boolean
  | "analytics.google.measurement_id" // string | null
  | "analytics.gtm.container_id"; // string | null

type BrandConfigValue = string | number | boolean | null;

// Organisation feature flags — returned by GET /config/organisation/values.
// Keys describe entitlements granted by the org's account package.
type OrgFeatures = Record<OrgFeatureKey, boolean>;

type OrgFeatureKey =
  | "package.enabled_features.product_provisioning" // automated provisioning available
  | "package.enabled_features.multi_brand"; // multiple brands per org

// Module catalogue entry — returned by GET /org/modules.
type UpmindModule = {
  id: string;
  code: "web_hosting"; // single value at present
  name: string;
  description: string;
  org_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

// Terms and conditions document — returned by GET /terms_and_conditions/current.
// Either content or url is populated; an embedded policy carries content, a
// redirect-style policy carries url.
type TermsAndConditions = {
  id: string;
  title: string;
  content?: string; // embedded markdown / HTML body
  url?: string; // external link if hosted elsewhere
};
```

## Dependencies

### Dependants — modules that read from this one

| Module              | Weight | Reads                                                                                                                             | Why                                                                                                                               |
| ------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `product`           | 12     | default currency, supported currencies, tax inclusion, default payment period, price display type                                 | Product pricing and term selection are computed against the brand's currency and tax-treatment rules.                             |
| `domain`            | 9      | default currency, tax inclusion, brand config keys (domain search method, web-hosting module entitlement)                         | Domain pricing inherits currency / tax; the domain search behaviour and provisioning availability are keyed brand config.         |
| `session`           | 7      | default language, registration disabled flag, phone-on-registration flag, white-label flag                                        | Registration availability, required fields, locale at login, and white-label gating on auth screens all derive from brand.        |
| `routing`           | 4      | storefront URL, basket-funnelling behaviour                                                                                       | External-storefront redirects and post-add-to-basket navigation choose between in-app and external routes.                        |
| `client`            | 4      | default language, supported currencies, region requirement, tax-validation flag                                                   | Locale for client comms, currency validation against the brand list, address validation, VAT-number handling.                     |
| `system`            | 4      | supported languages, default language, locale support check                                                                       | Locale negotiation depends on the brand's supported language list.                                                                |
| `theming`           | 3      | brand image, theme style, theme tokens, theme variant                                                                             | Renders the brand's logo and applies the design-token bundle.                                                                     |
| `basket`            | 3      | brand id, default currency, supported currencies, default language, tax inclusion, default payment period, guest-checkout enabled | Basket creation and refresh inherit currency/language/tax from brand; guest-checkout availability gates the unauthenticated flow. |
| `basketProduct`     | 2      | default currency, tax inclusion, default payment period                                                                           | Per-line pricing and term resolution use the brand's currency and tax behaviour.                                                  |
| `productCategories` | 2      | brand id, default currency                                                                                                        | Category listings inherit brand currency.                                                                                         |
| `paymentDetails`    | 1      | brand id, default currency, gateway storage policy keys                                                                           | Gateway selection and stored-card behaviour are gated by brand-level billing config.                                              |
| Presentation layer  | —      | brand name, logo, favicon, theme tokens, supported currencies, supported languages, white-label flag                              | Header / footer chrome, locale + currency switchers, white-label gating.                                                          |

> `config` (the brand / organisation config-key registry) imports `brand` to resolve key metadata against the active brand. It's listed as an own-dependency below rather than a dependant, per the workshop scope decision that `config` is a UI override layer rather than a peer module — same treatment as `query` (the HTTP transport layer, which also references brand for currency injection but isn't a domain consumer).

### This module's own dependencies

- **HTTP transport layer** — auth header attachment, locale injection (and locale-bypass for non-localised endpoints), error shape normalisation, response caching with on-disk persistence for fast cold starts.
- **Shared types / enums** — `IBrandSettings`, `IUpmindModule`, `ITermsAndConditions` from `packages/types/src/models/`; `BrandConfigKeys`, `OrgFeatureKeys`, `BasketFunnelling`, `DefaultPaymentPeriod`, `BrandTaxTypes`, `UpmindModuleCodes` from `packages/types/src/data/enums/` and `packages/types/src/data/constants.ts`.

## API endpoints

### `GET /brand/settings`

Brand identity bundle for the storefront resolving the request (resolution is by host / OAuth client origin).

```bash
curl -s "$API/brand/settings?lang=en" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

```json
{
  "status": "ok",
  "data": {
    "id": "47d73824-8507-9315-e54f-81e642d59e06",
    "code": "q5emenbm0y1p",
    "name": "Collab Studio",
    "prefix": "q5emenbm0y1p",
    "domain": "q5emenbm0y1p.staging.upmind.dev",
    "country_id": "320e4357-95e7-8d18-484f-31643202d986",
    "region_id": null,
    "currency_id": "e47d7382-4850-7931-56c8-1e642d59e063",
    "language_id": "45952098-d3de-4091-76a3-1578626e347e",
    "pricelist_id": "5952098d-3de4-0917-86a3-1578626e347e",
    "tax_type": 2,
    "vat_exempt": 0,
    "vat_number": "GB 000 0000",
    "wipe_data": false,
    "has_demo_data": true,
    "demo_data_import_id": "320e4357-95e7-8d18-d8a3-1643202d9860",
    "style": {
      "brand_color": "#CC0033",
      "brand_font": { "family": "Bricolage Grotesque", "version": "v9" },
      "tokens": "mock-tokens"
    },
    "currencies": [
      {
        "id": "e47d7382-4850-7931-56c8-1e642d59e063",
        "code": "USD",
        "name": "US Dollar",
        "prefix": "$",
        "suffix": "",
        "base": true,
        "decimals": true,
        "manual": 0
      },
      {
        "id": "3825d96e-763e-d091-3dc4-174825283406",
        "code": "GBP",
        "name": "British Pound",
        "prefix": "£",
        "suffix": "",
        "base": true,
        "decimals": true,
        "manual": 0
      },
      {
        "id": "85d085e6-9d56-2371-9ea2-18e940d42370",
        "code": "EUR",
        "name": "Euro",
        "prefix": "",
        "suffix": "€",
        "base": true,
        "decimals": true,
        "manual": 0
      },
      {
        "id": "3de78642-de53-9714-7ec2-1208469530d0",
        "code": "UGX",
        "name": "Ugandan Shilling",
        "prefix": "USh.",
        "suffix": "/=",
        "base": true,
        "decimals": false,
        "manual": 0
      }
    ],
    "languages": [
      {
        "id": "3825d96e-763e-d091-3dc4-174825283406",
        "language": "English",
        "code": "en"
      },
      {
        "id": "73de7864-2de5-3971-4ef2-1208469530d0",
        "language": "German",
        "code": "de"
      },
      {
        "id": "68d63250-7980-65d1-e6f8-174e234e98d2",
        "language": "French",
        "code": "fr"
      },
      {
        "id": "e47d7382-4850-7931-56c8-1e642d59e063",
        "language": "Spanish",
        "code": "es"
      }
    ],
    "oauth_clients": [
      {
        "id": "2785d26e-9678-3d16-88db-314502e70439",
        "name": "Collab Studio Portal",
        "origin": "q5emenbm0y1p.staging.upmind.dev",
        "default": true,
        "custom": false,
        "staff_enabled": true,
        "customer_enabled": true,
        "revoked": false,
        "origin_healthy": true,
        "provider": null
      }
    ],
    "image": {
      "id": "4d036794-24d0-e710-245a-3153698d582e",
      "type": "image",
      "default": true,
      "full_url": "https://api.staging.upmind.io/api/images/4d036794-24d0-e710-245a-3153698d582e/download"
    },
    "icon": {
      "id": "8d632507-9806-5d1e-5d2f-8174e234e98d",
      "type": "icon",
      "default": true,
      "full_url": "https://api.staging.upmind.io/api/images/8d632507-9806-5d1e-5d2f-8174e234e98d/download"
    },
    "favicon": {
      "id": "47d73824-8507-9315-e75f-81e642d59e06",
      "type": "image",
      "default": true,
      "full_url": "https://api.staging.upmind.io/api/images/47d73824-8507-9315-e75f-81e642d59e06/download"
    },
    "email_logo": {
      "id": "5d085e69-d562-3719-e46c-218e940d4237",
      "type": "email_logo",
      "default": true,
      "full_url": "https://api.staging.upmind.io/api/images/5d085e69-d562-3719-e46c-218e940d4237/download"
    }
  }
}
```

> Sample trimmed for readability — full asset and currency/language entries omitted but preserved in the captured fixture.

### `GET /config/brand/values?keys=…`

Sparse keyed configuration for one brand. The `keys` query parameter is a comma-separated list. The response contains only the requested keys (and any unknown keys come back missing, not `null`).

```bash
curl -s "$API/config/brand/values?keys=ui.basket.default_currency,invoices.common.default_payment_period,invoices.common.display_price_type,invoices.common.require_address_for_orders,billing.gateway.force_card_storage,security.ui.allow_vault,analytics.gtm.container_id" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

```json
{
  "status": "ok",
  "data": {
    "ui.basket.default_currency": "brand",
    "invoices.common.default_payment_period": 2,
    "invoices.common.display_price_type": "min",
    "invoices.common.require_address_for_orders": false,
    "billing.gateway.force_card_storage": false,
    "security.ui.allow_vault": true,
    "analytics.gtm.container_id": "G-9QKJBFZHN2"
  }
}
```

### `GET /config/organisation/values?keys=…`

Same shape as brand config, scoped to the parent organisation. Returns the entitlements granted by the org's account package.

```bash
curl -s "$API/config/organisation/values?keys=package.enabled_features.product_provisioning,package.enabled_features.multi_brand" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

```json
{
  "status": "ok",
  "data": {
    "package.enabled_features.product_provisioning": true,
    "package.enabled_features.multi_brand": false
  }
}
```

### `GET /org/modules`

The list of platform modules licensed to the organisation. Currently one possible code (`web_hosting`) but the shape is plural.

```bash
curl -s "$API/org/modules" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

```json
{
  "status": "ok",
  "data": [
    {
      "id": "3825d96e-763e-d091-3dc4-174825283406",
      "org_id": null,
      "code": "web_hosting",
      "name": "Hospedagem de sites",
      "description": "This module makes it simple to manage and sell products to automatically provision services such as shared web hosting accounts, domain names and more",
      "created_at": "2022-02-26 01:49:10",
      "updated_at": "2022-02-26 01:49:10",
      "deleted_at": null
    }
  ],
  "total": 1
}
```

### `GET /terms_and_conditions/current`

The active terms and conditions document for the brand. Either `content` is populated (embedded body) or `url` is populated (external policy).

```bash
curl -s "$API/terms_and_conditions/current" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

```json
// stubbed — real capture replaces this
{
  "status": "ok",
  "data": {
    "id": "5d085e69-d562-3719-4eb2-18e940d42370",
    "title": "Terms of Service",
    "content": "By using this service you agree to…",
    "url": null
  }
}
```

## Lessons (hard-won)

- **Brand is read by nearly everything that renders.** Currency, language, tax behaviour, and policy switches are all sourced from brand, which means almost every other module makes its first decisions only after brand has resolved. Consumers reading brand-derived values before brand has settled get defaults or empties, not errors — silent wrong renders rather than loud failures.

- **Brand config is sparse and keyed, and the set of keys grows over the session.** Each new surface (basket, checkout, payment, panel) asks for a different slice of keys. When the requested key list grows, an in-flight older response for a smaller key set can land after a newer response for a larger set — the result is a regression where keys silently disappear from state.

- **Brand identity changes invalidate downstream state.** Currency, language, and policy switches all flow into basket and product computations. If the brand changes (admin switching brands, custom-domain mismatch, host re-resolution) without invalidating the dependent caches, the basket / product surfaces show prices and policies from the previous brand.

- **Same-key cross-bag overlap is real.** Brand config and organisation features can both speak to the same surface (e.g. white-label, multi-brand, provisioning). Consumers that read only one bag miss the override path; consumers that read both without a defined precedence make inconsistent decisions across pages.

- **Tax inclusion is not a boolean — it is a three-state policy.** "Include tax" can mean _recalculate per client tax_ or _ignore client tax_; "exclude" means net-of-tax. A storefront that treats the field as a boolean produces wrong totals at checkout for any brand on the _include-respect-client_ setting and a non-default client tax.

- **The brand response carries identity for systems beyond the cart.** `oauth_clients` (registered storefront origins), `email_logo` (transactional email branding), `prefix` (invoice numbering) and `demo_data_import_id` (whether seeded demo data is live) are admin-surface concerns that ride on the same payload. A consumer that only types the customer-facing subset will discover gaps once admin-adjacent flows (origin validation, email rendering, demo-mode banners) are built.

- **Languages and currencies are full lists, not just defaults.** Multi-currency / multi-language storefronts need the supported sets to render switchers and to validate inbound selections. Consumers that read only `currency_id` / `language_id` cannot recover the full lists later without re-fetching brand settings.

- **Terms and conditions have two shapes that must be handled at point-of-use.** An embedded T&C carries `content`; a redirect-style T&C carries `url`. A consumer that renders only one shape silently breaks for the other — and the choice is per-brand, not per-deployment.

- **Persisted brand state ages.** Currency lists, language lists, and policy keys change rarely but they do change. A storefront that caches brand state across sessions without a background revalidation strategy serves stale identity assets and stale policy after admin edits.

- **The host the cart loads on is the brand selector.** Brand resolution is driven by the request origin matching one of the registered `oauth_clients`. A storefront deployed on an origin not registered against the brand will not resolve a brand at all — and the failure mode is "everything renders defaults" rather than a clear error.

- **The `?with=currency` expand on `/brand/settings` can resolve to `null`.** Observed in production on brands where the default currency relation is configured but the embed didn't materialise on the canonical read. Consumers that bind directly to `brand.currency.code` to populate a downstream currency context break — the slot ends up `undefined` and price-aware calls fall through without a `currency_code`, returning brand-default-currency prices regardless of selection. The fallback chain that handles every observed variant: `brand.currency?.code ?? brand.currencies?.find(c => c.id === brand.currency_id)?.code ?? brand.currencies?.find(c => c.base)?.code ?? brand.currencies?.[0]?.code`. The expand inconsistency is a platform quirk, not a brand misconfiguration — consumers cannot rely on the expand alone.

- **`/terms_and_conditions/current` returns `data: null` for brands that haven't configured T&Cs.** Not a 404 — a `200 + status: "ok" + data: null` envelope. The "no T&Cs to render" state is conveyed as a null payload, not an HTTP error. Consumers that pattern-match only on the embedded-vs-redirect dichotomy miss the third branch and either crash on the null payload or surface an empty T&Cs row. Handle three branches: embed inline (`data.content`), redirect to URL (`data.url`), no T&Cs (`data === null`).
