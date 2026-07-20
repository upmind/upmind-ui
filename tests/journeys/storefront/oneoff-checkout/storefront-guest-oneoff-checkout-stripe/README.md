# storefront-guest-oneoff-checkout-stripe

The pilot journey on the ADR 025 rails: a guest buys a single one-off product
from the storefront and pays with Stripe, ending on a placed order. This folder
is the **self-contained, deletable template** every future journey copies —
fixtures, alias map, replay wiring and both runners' files all live here and
nowhere else, so deleting the folder removes the journey completely.

## Live machine drive (FE-2992 boot harness)

The `.int.test.ts` drives the flow's core modules through their **real** headless
machines to a settled state (not recorded-traffic invariants), using the shared
boot harness at [`../../../support/basket-boot.ts`](../../../support/basket-boot.ts):

- **Session** — `useActiveSession` boots a real guest session through replay.
- **Basket** — `useBasket`'s XState machine settles to `shopping` for the guest
  empty-basket boot, then **recalculates its totals live** when a product is
  added through the real `basketProductServices` seam (`POST /orders`).
- **Catalogue / Currency** — `useProductCatalogue` and `useBasketCurrency` load
  through the same boot; assertions read the live composables, not fixtures.

The **checkout tail** (Stripe gateway offer + payment capture) stays a
recorded-traffic invariant — driving it live needs the payment machines, out of
scope for the basket boot.

### Why the boot harness exists

A guest boot calls `GET orders/current`. This journey's recorded fixture for it
is a transient **401** (the guest had no current basket at capture; in
production the query layer re-mints the guest token and retries to a 200 — see
`query/useQuery.ts` → `refreshToken()`). Replay is static, so the retry
re-serves the same 401, the basket machine's `load` hits its `hasAuthError`
branch, and the machine lands in `error` — it never reaches `shopping`.

The harness supplies the missing piece — the guest's **empty current-basket**
boot response — via `overrideRoute`, so the LIVE machine settles. This is the
claimed-basket/account orchestration; it is **not faked domain data** (ADR 025
A1.2): an empty basket carries no products/prices/order, and every real domain
payload the test asserts on stays a real captured fixture. FE-2937's headless
generator would capture this 200 boot response directly; until it's built, the
harness rebuilds only that empty-basket boot (documented in the harness).

## Fixture provenance

Everything under `fixtures/` is a **real recorded API capture**, PII-masked with
a consistent id-remap so ids still thread across requests. Never hand-write or
hand-edit the JSON — recapture instead. The one non-recorded byte in the flow is
the empty-basket boot envelope the harness serves for `orders/current`; it holds
no domain data (see above).

## Files

- `*.feature` — declarative spec; the Feature name is the slug (folder name).
- `*.int.test.ts` — the integration surface (driven live via the boot harness).
- `journey.ts` / `setup.ts` — alias map and MSW replay wiring.
- `*.spec.ts` — Playwright e2e slices (one smoke = full journey; rest sliced).

## Copying this journey

1. `cp -r` this folder to the new slug and rename the `.feature`, `.int.test.ts`,
   `journey.ts` SLUG, and `.spec.ts` describe blocks to the new slug.
2. Recapture `fixtures/` for the new flow.
3. Reuse the shared boot harness (`../../../support/basket-boot.ts`) — a new
   journey inherits the settled-`shopping` boot for free; add journey-specific
   drivers there if a new actor/flow needs them.
