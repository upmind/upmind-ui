// -----------------------------------------------------------------------------
/**
 * @module tests/journeys/support/basket-boot
 * @description Shared boot harness for journey integration tests (FE-2992, the
 * ADR-025 A1.3 direction). It drives the REAL headless module graph through MSW
 * replay to a settled `useBasket` machine, so a journey can assert LIVE machine
 * behaviour (totals recalc, currency, catalogue) instead of recorded-traffic
 * invariants.
 *
 * ## The boot the recording can't replay
 * A guest boot calls `GET orders/current`. This journey's recorded fixture for
 * it is a transient **401** ("access token could not be verified"): at capture
 * the guest had no current basket, and in production the query layer re-mints
 * the guest token and retries to a 200 (see `query/useQuery.ts` →
 * `refreshToken()`). Replay is static, so the retry re-serves the same 401, the
 * basket machine's `load` hits its `hasAuthError` branch, and the machine never
 * settles to `shopping` — it lands in `error`. This is the exact no-settle
 * blocker FE-2935 hit and FE-2992 owns.
 *
 * The harness supplies the missing piece — the guest's **empty current-basket**
 * boot response — via {@link overrideRoute}, so the LIVE machine settles to
 * `shopping`. This is the "claimed-basket/account orchestration" the machine
 * needs; it is NOT faked domain data (ADR-025 A1.2): an empty basket carries no
 * products/prices/order, and every real domain payload the journey asserts on
 * (catalogue, currency, the created order, its recalculated totals) stays a real
 * captured fixture served by replay. FE-2937's headless generator would capture
 * this 200 empty-basket boot directly; until it's built, this is what the
 * harness rebuilds (documented per FE-2992 AC4).
 *
 * ## Reused vs rebuilt
 * - REUSED: the replay server + co-located fixtures (FE-2934), the real headless
 *   composables, and the real add-to-basket service seam
 *   (`basketProductServices.update` → `generateBasket` → `POST /orders`, whose
 *   `onSuccess` hands the created basket to `useBasket().refresh()`).
 * - REBUILT here: the empty-basket boot orchestration (the 401→settled-`shopping`
 *   gap) and the reusable session/basket/catalogue/currency boot sequence so
 *   future journeys inherit the pattern.
 */

import {
  basketProductServices,
  useActiveSession,
  useBasket,
  useBasketCurrency,
  useProductCatalogue,
  useSessionStore,
  type UseBasket,
  type UseActiveSession
} from "@upmind-automation/headless";
import { overrideRoute } from "@upmind-automation/test-fixtures/replay-server";

// The MSW handle type is derived from the fixtures tool's own export so a
// journey never has to import `msw` (which only resolves under tests/fixtures).
type ReplayServer = Parameters<typeof overrideRoute>[0];

// -----------------------------------------------------------------------------

/** The empty current-basket boot envelope (no domain data — see file header). */
const EMPTY_CURRENT_BASKET = { status: "ok", data: {} };

/**
 * Clear every `upm_*_session` cookie, sessionStorage, and the session store so a
 * boot never leaks between tests. Call from a journey's `beforeEach`. Clearing
 * the store re-floors the active actor to an un-minted guest, which the store's
 * own subscriber re-mints on the next `isReady()`.
 */
export function resetJourneySession(): void {
  for (const pair of document.cookie.split(";")) {
    const name = pair.split("=")[0]?.trim();
    if (name && /^upm_.*_session$/.test(name)) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
  }
  sessionStorage.clear();
  useSessionStore().useActions().clear();
}

/**
 * The composables + drivers a booted guest journey exposes. All are the REAL
 * headless singletons, driven through replay.
 */
export interface GuestBasketBoot {
  /** The live basket composable, settled to `shopping`. */
  basket: UseBasket;
  /** The live basket-currency composable (its actor already `isReady`). */
  currency: ReturnType<typeof useBasketCurrency>;
  /** The live product-catalogue composable (see {@link whenCatalogueLoaded}). */
  catalogue: ReturnType<typeof useProductCatalogue>;
  /** The live active-session composable (a minted guest). */
  session: UseActiveSession;
  /**
   * Add a product to the basket through the real service seam
   * (`POST /orders` on the first add, `POST /orders/{id}/products` after), then
   * wait for the live machine to finish its refresh. Returns once totals have
   * recalculated. The catalogue product a replay returns is the recorded basket,
   * not necessarily `productId` — assert on the LIVE machine's recalc, not on
   * the id (see the journey int test).
   */
  addProduct: (productId: string, quantity?: number) => Promise<void>;
}

/**
 * Boot a guest into a settled `shopping` basket under replay.
 *
 * 1. Install the empty current-basket override (the no-settle fix).
 * 2. Mint the guest session (`useSessionStore().isReady()`).
 * 3. Reload the basket machine through the override and wait for `shopping`.
 * 4. Wait for the currency actor so the catalogue query (gated on
 *    `currencyCode`) can run.
 *
 * @throws if the machine does not settle to a non-error `shopping` — a loud
 *   failure beats a silent hang, so a future fixture/boot regression is caught.
 */
export async function bootGuestBasket(opts: {
  server: ReplayServer;
}): Promise<GuestBasketBoot> {
  overrideRoute(
    opts.server,
    "get",
    "*/api/orders/current",
    EMPTY_CURRENT_BASKET
  );

  await useSessionStore().useActions().isReady();
  const session = useActiveSession();

  const basket = useBasket();
  // The basket service is a module singleton; a prior test may have left it
  // settled. `clear()` forces a deterministic reload through the override so
  // every boot starts from the same empty `shopping` state.
  basket.clear();
  const settled = await basket.isReady();
  if (!settled) {
    throw new Error(
      `bootGuestBasket: useBasket did not settle to shopping (state: ${JSON.stringify(
        basket.state.value.value
      )})`
    );
  }

  const currency = useBasketCurrency();
  await currency.isReady();

  const catalogue = useProductCatalogue();

  async function addProduct(productId: string, quantity = 1): Promise<void> {
    await basketProductServices.update(basket.basketId.value ?? undefined, {
      productId,
      quantity
    } as Parameters<typeof basketProductServices.update>[1]);
    await basket.isRefreshed();
  }

  return { basket, currency, catalogue, session, addProduct };
}

/**
 * Resolve once the catalogue query has loaded its products. `catalogue.isReady()`
 * only awaits the basket (the query is enabled off `currencyCode`), so a journey
 * must poll the query's own data. Throws once `timeoutMs` elapses if it never
 * populates, so a boot/fixture regression fails loud instead of asserting on an
 * empty list.
 *
 * @param catalogue - The catalogue composable from {@link bootGuestBasket}.
 * @param timeoutMs - Max time to wait for the first page (default 8000).
 */
export async function whenCatalogueLoaded(
  catalogue: ReturnType<typeof useProductCatalogue>,
  timeoutMs = 8000
): Promise<void> {
  await catalogue.isReady();
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (catalogue.data.value && catalogue.data.value.length > 0) return;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw new Error(
    "whenCatalogueLoaded: catalogue never populated under replay"
  );
}
