# SDD 02 — Brand bootstrap

## Goal

At the end of this feature the app knows **who this storefront is**: brand identity (id, name, logo, theme tokens), the supported + default currency, the supported + default language, the keyed policy switches the prototype actually reads, the licensed platform modules, the canonical reference lists (countries, billing cycles), and the current terms & conditions. The foundations layer's currency slot is populated with the brand default. Cached in memory for the session; subsequent features read from cache rather than refetching.

## Depends on

- Feature 0 (Project scaffold) — HTTP transport, error normalisation, and the currency slot from the foundations layer must exist.
- Feature 1 (Auth) — bootstrap calls are bearer-authenticated, so a **guest token** must be minted first (`POST /oauth/access_token` with `grant_type: "guest"`). The brand-anonymous visitor still carries a guest bearer; there is no useful unauthenticated mode on the platform (foundations §2). Brand resolution itself uses the host header, not the actor — a guest token is sufficient to read `GET /brand/settings`.

## Modules consumed

- `brand` — see [02-module-foundations/brand.md](../02-module-foundations/brand.md)
- `system` — see [02-module-foundations/system.md](../02-module-foundations/system.md)

## Reads (before generating any code)

- `06-initiator/generic.md` — section 4 (host header → brand resolution), section 9 (validation), operating principles 1, 4, 6, 10
- `03-foundations-chapter.md` — full, especially §3 (currency injection — bootstrap is where the default comes from)
- `02-module-foundations/brand.md` — full
- `02-module-foundations/system.md` — full

## What this feature does

1. On app start, after the guest token is in place (feature 1), block first route render on a single bootstrap promise.
2. Fire the six bootstrap calls **in parallel**. They share no dependencies on each other; serialising them costs latency for no benefit.
3. `GET /brand/settings` — resolves the brand from the request's host header. Returns identity, supported currencies + languages, defaults, theme tokens, T&C tax policy.
4. `GET /config/brand/values?keys=<csv>` — keyed policy switches. The prototype asks for the **specific** keys it consumes (see [API calls](#api-calls-in-execution-order) step 2). Unknown keys come back missing — treat as "not configured".
5. `GET /org/modules` — licensed platform modules. The prototype checks `web_hosting` to know whether provisioning-dependent surfaces should light up.
6. `GET /countries` — full country list for billing-address forms (feature 5). Cached for the session; do not refetch.
7. `GET /billing_cycles` — billing-term catalogue, including the `months: 0` one-off entry. Used by catalogue display and basket lines.
8. `GET /terms_and_conditions/current` — the brand's current T&Cs (either `content` or `url`).
9. Once all six resolve, populate the foundations currency slot with `brand.currency.code` (the brand default ISO code, e.g. `"USD"` — `ui.basket.default_currency` is treated as `"brand"` for the prototype per foundations §3.1). Prefer the code over the UUID for request injection per foundations §3.3.
10. Surface a `BrandReady` state to the rest of the app. Features 3+ assume this is done and read from the cached bag.

## Data shapes (feature-scoped)

The bootstrap result is a view-model the rest of the app reads:

```ts
type BrandBootstrap = {
  brand: BrandSettings;              // GET /brand/settings — see brand.md
  brandConfig: Partial<BrandConfig>; // GET /config/brand/values — sparse, only requested keys
  modules: UpmindModule[];           // GET /org/modules
  countries: Country[];              // GET /countries
  billingCycles: BillingCycle[];     // GET /billing_cycles
  termsAndConditions: TermsAndConditions; // GET /terms_and_conditions/current
};

// The specific config keys the prototype reads. Lock this list — over-fetching
// is wasteful, under-fetching costs a second round-trip when a feature needs a
// switch that wasn't requested.
const BRAND_CONFIG_KEYS = [
  "ui.basket.default_currency",                                 // confirm "brand" — affects step 9
  "invoices.common.require_address_for_orders",                 // feature 5 (checkout address)
  "invoices.common.required_region_in_address",                 // feature 5
  "invoices.common.require_phone_for_orders",                   // feature 5
  "invoices.guest_checkout.enabled",                            // feature 4 / 5 — does the spine even need login first?
  // PAYMENT POLICY — read together; feature 6 + feature 7 honour them.
  // Missing any one of these silently breaks the brand's intended payment UX
  // (no stored card, no auto-renew, broken panel delete affordance).
  "billing.gateway.force_card_storage",                         // feature 6: every successful payment auto-stores the card (no opt-in UI). Also forces card capture on free baskets — see SDD 04 free-total edge case + SDD 06 force_card_storage notes
  "billing.gateway.force_auto_payment_for_stored_details",      // feature 6 / feature 7: stored card auto-charges renewals (panel "pay now" CTAs become advisory)
  "billing.gateway.allow_card_removal_replacement",             // feature 7: when false, panel delete-card affordance must be disabled (BE rejects the delete server-side)
] as const;

type BrandReady =
  | { status: "loading" }
  | { status: "ready"; bootstrap: BrandBootstrap }
  | { status: "error"; error: AppError };
```

Type references: `BrandSettings`, `BrandConfig`, `UpmindModule`, `TermsAndConditions` from `02-module-foundations/brand.md`; `Country`, `BillingCycle` from `02-module-foundations/system.md`; `AppError` from `03-foundations-chapter.md` §4.6.

## API calls (in execution order)

All six fire in parallel after the guest token is minted. All carry `Authorization: Bearer <guest_token>` and `Host: <brand_domain>` (the latter set by the browser based on the page origin — never forge it).

| Step | Method | Endpoint | Purpose | Fixture |
| --- | --- | --- | --- | --- |
| 1 | GET | `/brand/settings?lang=en` | Brand identity, supported currencies + languages, defaults, theme tokens, tax type | `07-references/recordings/get-brand-settings.json` |
| 2 | GET | `/config/brand/values?keys=<csv>` | Keyed brand config — six keys above only | `07-references/recordings/get-config-brand-values-{hash}.json` |
| 3 | GET | `/org/modules` | Licensed modules — checked by features 4/6 | `07-references/recordings/get-org-modules.json` |
| 4 | GET | `/countries?limit=0&order=name` | Country list (large; one-shot per session) | `07-references/recordings/get-countries.json` |
| 5 | GET | `/billing_cycles?limit=0` | Billing-cycle catalogue (incl. `months: 0` one-off) | `07-references/recordings/get-billing_cycles.json` |
| 6 | GET | `/terms_and_conditions/current` | Current T&Cs for the brand (embedded `content` OR external `url`) | `07-references/recordings/get-terms_and_conditions-current.json` |

The CSV for step 2 is the literal join of `BRAND_CONFIG_KEYS` above, comma-separated. The fixture hash is the stable hash of the requested key set — if the prototype changes the keys, the fixture filename changes too.

Out of the bootstrap: `GET /config/organisation/values` (org-level config) is documented in `brand.md` but irrelevant for the storefront prototype. `GET /currencies` (system currencies) is not fetched — the brand response already carries the supported currency list.

## Edge cases

- **Brand bootstrap fails outright.** The storefront cannot render without a brand. Show a hard brand-error page with the correlation id from `AppError`. Do not silently degrade — features 3+ assume real data.
- **Step 1 succeeds but `brand.code` / `brand.domain` doesn't match what's expected.** The host header resolved to a different brand than the team thinks (likely a hosts-file mistake — initiator §4). Surface clearly during the workshop; this is the #1 setup-error symptom.
- **Step 2 returns a missing key.** Brand config is sparse — keys the brand owner has never set come back **missing**, not `null`. Treat missing as "not configured" and fall back to a documented default. Do **not** error.
- **Step 3 returns an empty `data: []`.** Org has no licensed modules. Treat as "provisioning surfaces off". Not an error.
- **Step 4 (countries) is large.** Cache aggressively in memory. Address forms (feature 5) read from cache; never refetch per render.
- **`Country.name` is server-localised by `Accept-Language` (system.md lesson).** i18n is out of scope for the prototype — pass `?lang=en` everywhere. Captured fixtures reflect English names.
- **T&Cs has two shapes.** Either `content` (embedded markdown) OR `url` (redirect-style) — brand-by-brand choice. The consumer (feature 5 / 6 checkout) must handle both. Capture but don't render at bootstrap.
- **Tax inclusion is a three-state policy** (`tax_type: 0|1|2`, not a boolean — brand.md lesson). Carry the raw enum through; let the basket/checkout features interpret. Do not collapse to a boolean here.
- **Currency slot ordering.** Step 9 (populate currency slot) must happen **before** any feature 3+ call that needs `currency_code`. The "bootstrap promise resolved" signal is what guards this — don't let feature routes mount before it.
- **Currencies list is full, not just defaults** (brand.md lesson). The currency switcher in a future build needs `brand.currencies` (each carrying `id` + `code`), not just `brand.currency.code`. Keep both the active code and the full list in cache.
- **`?with=currency` on `/brand/settings` may resolve to `currency: null` on some brands.** Observed on staging. The expand inconsistency means the caller cannot rely on `brand.currency.code` being populated; fall back: `brand.currency?.code ?? brand.currencies?.find(c => c.id === brand.currency_id)?.code ?? brand.currencies?.find(c => c.base)?.code ?? brand.currencies?.[0]?.code`. Set the foundations currency slot from this resolved value, not from `brand.currency.code` directly. The fallback chain is verbose because each step covers a real brand configuration variant — pick a brand-default lookup that doesn't crash on any of them.
- **`/terms_and_conditions/current` may return `data: null`.** Brands that have not configured T&Cs return a `200 + status: "ok" + data: null` envelope (no 404). Handle both "no T&Cs" branches: `data === null` (not configured) and `404` (legacy / different platform shape). Treat both as "no T&Cs to render".
- **T&Cs update mid-session.** Out of scope. Capture once at bootstrap; ignore in-session staleness.
- **Org modules say `web_hosting` is off.** Catalogue may still render (depends on the test store), but provisioning-dependent UI degrades. Surface to the team during the workshop rather than handling silently.

## Validation checklist

- [ ] Cold start: all six bootstrap calls fire in parallel; the network panel shows them overlapping, not waterfalling.
- [ ] No feature route mounts until the bootstrap promise resolves.
- [ ] `brand.id` returned matches the `brand_id` recorded in initiator §4 (sanity check on host-header resolution).
- [ ] Foundations currency slot is populated with `brand.currency.code` (ISO code, e.g. `"USD"`) before any feature 3+ call goes out.
- [ ] Requested brand-config keys match `BRAND_CONFIG_KEYS` exactly — no over-fetching, no under-fetching.
- [ ] Country list is cached; navigating to feature 5 (checkout address) does **not** refetch `/countries`.
- [ ] A missing brand-config key surfaces as "not configured" (default fallback), not as an error.
- [ ] T&Cs response — both shape branches handled: `content` populated → embed; `url` populated → link. (Test by stubbing the alternate shape if the live brand only emits one.)
- [ ] Brand bootstrap failure shows a brand-error page with the `AppError.correlationId`; the app does not silently render with empty defaults.
- [ ] Every call carries `Authorization: Bearer <guest_token>` and the browser-set `Host: <brand_domain>` header.

## Notes for the agent

- This feature is **cold-start bootstrap**, not per-route fetching. Run it once per session.
- Brand bootstrap requires a **guest bearer** — feature 1 mints it before feature 2 runs. The brand selector is the host header, not the actor.
- Do **not** hardcode a `brand_id` query parameter anywhere. Brand resolution is by host (initiator operating principle 6).
- Do **not** prefetch products, basket, or anything else here. Those belong to their own features.
- The `meta` / `object_meta` fields on any response are UI-only for Upmind's own client — ignore (brand.md note, foundations §1.3).
- i18n is out of scope. Pass `?lang=en` on `/brand/settings`; skip language-specific T&C endpoints.
- `ui.basket.default_currency` can be `"brand"` or `"language"`. For the prototype, treat as `"brand"` and pick `brand.currency.code` directly (foundations §3.1). If the requested key comes back `"language"` from a real brand, surface to the team — locale-driven currency selection is out of scope.
- The brand's supported `currencies` and `languages` are full lists, not just the defaults. Keep both — a future currency switcher needs them and they're expensive to re-derive (brand.md lesson).
- **Wire the currency switcher in the chrome.** Render a dropdown / menu in the storefront header (or footer) reading from `brand.currencies` — code + symbol + name per option, active option marked, switch on click. The selected code becomes the new active currency:
  - **No basket exists yet** (visitor still browsing, hasn't seated anything): update the foundations currency slot directly. Subsequent catalogue / product reads pick it up via the `?currency_code=` query param.
  - **Basket exists**: fire `PUT /orders/{basketId}/currency` with `{ "currency_code": <newCode> }` (see [basket.md](../02-module-foundations/basket.md) `PUT /orders/{id}/currency` for the endpoint shape). The platform re-prices every line item, re-computes promotions and taxes, and returns the refreshed basket. **Apply the basket's wide `?with=` expand on the call** so the response inflates address / client / products as expected (per generic.md operating principle 20).
  - **Debounce client-side.** Rapid clicks through USD → GBP → EUR fire one `PUT /orders/{id}/currency` per click without a debounce; debouncing on the client is the only way to avoid churning the basket through redundant re-pricings (basket.md lesson "Currency changes thrash a slow API"). 250-500ms debounce on the switcher is the typical pattern.
  - The switcher is **cross-cutting UI** — it lives in the app shell, not in a specific feature. Feature 2's job is making the brand's currency list available to it; feature 4's job is wiring the basket-currency PUT. Either feature can be the home for the switcher component itself; SDD 04 carries the recommendation.
- If `GET /terms_and_conditions/current` 404s on the staging brand (T&Cs never configured), treat as missing rather than a hard error — the spine still works without a T&Cs link.
