import type { Page } from "@playwright/test";
import { waitForUpmindBridge } from "./headless-bridge";

const POLL_TIMEOUT = 15000;
const POLL_INTERVAL = 100;

/**
 * A JSON-serializable seed for adding a product via the live headless system.
 * The `ProductProps` model the composable expects is built inside the page from
 * this plain object.
 */
export type HeadlessProductSeed = {
  /** The product to add. */
  productId: string;
  /** Quantity to add (default: 1). */
  quantity?: number;
  /** Billing cycle in months (maps to the model `term`). */
  billingCycleMonths?: number;
  /** Provision field values (e.g. domain `sld`). */
  provisionFields?: Record<string, unknown>;
  /** Promotion codes to apply to this product. */
  coupons?: string[];
  /** Whether to start a free trial. */
  startTrial?: boolean;
  /** Validate provision fields on add (default: true). `false` seeds an
   *  invalid product via the service layer, bypassing the pending machine. */
  validateProvisionFields?: boolean;
};

/**
 * Adds a product to the basket by driving the REAL headless composables inside
 * the page, sharing the app's TanStack Query cache (the FE-2784 requirement).
 *
 * The canonical pending-product flow (`add` → `isReady` → `update` → `resolve`)
 * commits a valid configuration. A seed with `validateProvisionFields: false`
 * is deliberately invalid — the pending machine refuses to commit it, so the
 * service layer is driven directly with `silent: true` (which maps to
 * `provision_field_values_validate: false`), then the basket is refreshed.
 *
 * @param page - The Playwright page (the live system lives on its `window`).
 * @param seed - The plain product seed.
 * @returns The basket id and the committed basket-product id (null if absent).
 */
export async function addProductViaHeadless(
  page: Page,
  seed: HeadlessProductSeed
): Promise<{ basketId: string; basketProductId: string | null }> {
  await waitForUpmindBridge(page);
  return page.evaluate(
    async ({ seed, pollTimeout }) => {
      if (
        !window.Upmind?.useBasket ||
        !window.Upmind?.useBasketProductsPending ||
        !window.Upmind?.basketProductServices
      ) {
        throw new Error(
          "window.Upmind not exposed — is the cart running in test mode (pnpm start:test)?"
        );
      }
      const basket = window.Upmind.useBasket();
      const ready = await basket.isReady();
      if (!ready) {
        throw new Error("addProductViaHeadless: basket did not become ready");
      }

      const model = {
        productId: seed.productId,
        quantity: seed.quantity ?? 1,
        term: seed.billingCycleMonths,
        provisionFields: seed.provisionFields,
        coupons: seed.coupons,
        startTrial: seed.startTrial
      };

      if (seed.validateProvisionFields === false) {
        await window.Upmind.basketProductServices.update(
          basket.basketId.value,
          {
            ...model,
            silent: true
          }
        );
      } else {
        const pending = window.Upmind.useBasketProductsPending();
        const item = await pending.add(seed.productId, model);
        await item.isReady();
        await item.update();
        pending.resolve(item.service);
      }

      await basket.isRefreshed();

      const basketId = basket.basketId.value;
      if (!basketId) {
        throw new Error(
          "addProductViaHeadless: basket has no id after committing the product"
        );
      }
      const committed = (basket.products.value ?? []).find(
        product => product.configuration?.productId === seed.productId
      );
      return { basketId, basketProductId: committed?.id ?? null };
    },
    { seed, pollTimeout: POLL_TIMEOUT }
  );
}

/**
 * Empties the basket via the live headless system.
 *
 * `clear()` is a fire-and-forget send, so this waits until the basket reports
 * no products. Returns early if the basket is already empty (which also avoids
 * touching a basket that has no server order yet).
 *
 * @param page - The Playwright page (the live system lives on its `window`).
 */
export async function clearBasketViaHeadless(page: Page): Promise<void> {
  await waitForUpmindBridge(page);
  await page.evaluate(
    async ({ pollTimeout, pollInterval }) => {
      if (!window.Upmind?.useBasket) {
        throw new Error(
          "window.Upmind not exposed — is the cart running in test mode (pnpm start:test)?"
        );
      }
      const basket = window.Upmind.useBasket();
      const ready = await basket.isReady();
      if (!ready) {
        throw new Error("clearBasketViaHeadless: basket did not become ready");
      }
      if ((basket.products.value ?? []).length === 0) return;

      basket.clear();

      const deadline = Date.now() + pollTimeout;
      while (Date.now() < deadline) {
        if ((basket.products.value ?? []).length === 0) return;
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
      throw new Error("clearBasketViaHeadless: basket did not empty in time");
    },
    { pollTimeout: POLL_TIMEOUT, pollInterval: POLL_INTERVAL }
  );
}

/**
 * Applies a promotion code to the basket via the live headless system.
 *
 * @param page - The Playwright page (the live system lives on its `window`).
 * @param promoCode - The promotion code to apply.
 */
export async function addPromotionViaHeadless(
  page: Page,
  promoCode: string
): Promise<void> {
  await waitForUpmindBridge(page);
  await page.evaluate(async promoCode => {
    if (!window.Upmind?.useBasket) {
      throw new Error(
        "window.Upmind not exposed — is the cart running in test mode (pnpm start:test)?"
      );
    }
    const basket = window.Upmind.useBasket();
    const ready = await basket.isReady();
    if (!ready) {
      throw new Error("addPromotionViaHeadless: basket did not become ready");
    }
    await basket.addPromotion(promoCode);
  }, promoCode);
}

/**
 * Removes a single basket product via the live headless system.
 *
 * Drives `useBasketProducts().remove(bpid)` — the same debounced action the UI
 * fires — then polls until the product is gone from the live basket. Removing a
 * product is what fires the `remove_from_cart` dataLayer event, so a spec that
 * asserts on that event must drive the removal through this real module path
 * rather than a hand-rolled DELETE (ADR 021 — test your code, not a shadow of it).
 *
 * @param page - The Playwright page (the live system lives on its `window`).
 * @param basketProductId - The basket-product id to remove.
 */
export async function removeProductViaHeadless(
  page: Page,
  basketProductId: string
): Promise<void> {
  await waitForUpmindBridge(page);
  await page.evaluate(
    async ({ basketProductId, pollTimeout, pollInterval }) => {
      if (!window.Upmind?.useBasket || !window.Upmind?.useBasketProducts) {
        throw new Error(
          "window.Upmind not exposed — is the cart running in test mode (pnpm start:test)?"
        );
      }
      const basket = window.Upmind.useBasket();
      const ready = await basket.isReady();
      if (!ready) {
        throw new Error(
          "removeProductViaHeadless: basket did not become ready"
        );
      }

      await window.Upmind.useBasketProducts().remove(basketProductId);

      const deadline = Date.now() + pollTimeout;
      while (Date.now() < deadline) {
        const stillPresent = (basket.products.value ?? []).some(
          product => product.id === basketProductId
        );
        if (!stillPresent) return;
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
      throw new Error(
        "removeProductViaHeadless: product was not removed from the basket in time"
      );
    },
    { basketProductId, pollTimeout: POLL_TIMEOUT, pollInterval: POLL_INTERVAL }
  );
}

/**
 * Sets the basket currency (by ISO code) via the live headless system.
 *
 * @param page - The Playwright page (the live system lives on its `window`).
 * @param currencyCode - The ISO currency code (e.g. "USD").
 */
export async function setBasketCurrencyViaHeadless(
  page: Page,
  currencyCode: string
): Promise<void> {
  await waitForUpmindBridge(page);
  await page.evaluate(async currencyCode => {
    if (!window.Upmind?.useBasketCurrency) {
      throw new Error(
        "window.Upmind not exposed — is the cart running in test mode (pnpm start:test)?"
      );
    }
    // isReady() self-boots the basket machine and waits for the currency actor
    // to settle; update() then sends SET straight to it. No basket 'shopping'
    // gate (which never arrives on an empty basket and hung setCurrency).
    await window.Upmind.useBasket().isReady();
    const currency = window.Upmind.useBasketCurrency();
    await currency.update({ code: currencyCode });
  }, currencyCode);
}

/**
 * Reads the current basket (order) id from the live headless system.
 *
 * The basket IS `orders/current`, so its id is only populated once something
 * has been committed — seed the basket first, or this throws after timing out.
 *
 * @param page - The Playwright page (the live system lives on its `window`).
 * @returns The current basket id.
 */
export async function getBasketIdViaHeadless(page: Page): Promise<string> {
  await waitForUpmindBridge(page);
  return page.evaluate(
    async ({ pollTimeout, pollInterval }) => {
      if (!window.Upmind?.useBasket) {
        throw new Error(
          "window.Upmind not exposed — is the cart running in test mode (pnpm start:test)?"
        );
      }
      const basket = window.Upmind.useBasket();
      const ready = await basket.isReady();
      if (!ready) {
        throw new Error("getBasketIdViaHeadless: basket did not become ready");
      }

      const deadline = Date.now() + pollTimeout;
      while (Date.now() < deadline) {
        const id = basket.basketId.value;
        if (id) return id;
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
      throw new Error(
        "getBasketIdViaHeadless: basket has no id — seed the basket first"
      );
    },
    { pollTimeout: POLL_TIMEOUT, pollInterval: POLL_INTERVAL }
  );
}

/**
 * Reads the current basket (raw `IBasket`) from the live headless system.
 *
 * Waits for the basket store to initialise and revalidate, then serialises the
 * raw basket context object (`id`, `address_id`, `products`, `promotions`,
 * `amounts`, ...) as plain JSON. This is the same server truth the old
 * `getCurrentOrder` read returned, but read through the app's live basket.
 *
 * @param page - The Playwright page (the live system lives on its `window`).
 * @returns The raw basket object as plain JSON.
 */
export async function getBasketViaHeadless(
  page: Page
): Promise<Record<string, unknown>> {
  await waitForUpmindBridge(page);
  return page.evaluate(async () => {
    if (!window.Upmind?.useBasket) {
      throw new Error(
        "window.Upmind not exposed — is the cart running in test mode (pnpm start:test)?"
      );
    }
    const basket = window.Upmind.useBasket();
    const ready = await basket.isReady();
    if (!ready) {
      throw new Error("getBasketViaHeadless: basket did not become ready");
    }
    await basket.isRefreshed();
    return JSON.parse(JSON.stringify(basket.basket.value ?? {}));
  });
}

/**
 * Reads the basket's products (raw `IBasketProduct[]`) from the live headless
 * system.
 *
 * Serialises `basket.value.products` — the same array the old
 * `getBasketProducts` read returned, so items keep their raw API field names
 * (`id` = basket-product id, `product_id`, `name`, nested `product`).
 *
 * @param page - The Playwright page (the live system lives on its `window`).
 * @returns The basket products as plain JSON (empty array if none).
 */
export async function getBasketProductsViaHeadless(
  page: Page
): Promise<Array<Record<string, unknown>>> {
  await waitForUpmindBridge(page);
  return page.evaluate(async () => {
    if (!window.Upmind?.useBasket) {
      throw new Error(
        "window.Upmind not exposed — is the cart running in test mode (pnpm start:test)?"
      );
    }
    const basket = window.Upmind.useBasket();
    const ready = await basket.isReady();
    if (!ready) {
      throw new Error(
        "getBasketProductsViaHeadless: basket did not become ready"
      );
    }
    await basket.isRefreshed();
    return JSON.parse(JSON.stringify(basket.basket.value?.products ?? []));
  });
}

/**
 * Reads the basket's billing address id from the live headless system.
 *
 * Serialises `basket.value.address_id` — the same value the old
 * `getCurrentAddressId` read returned.
 *
 * @param page - The Playwright page (the live system lives on its `window`).
 * @returns The basket `address_id`, or null if unset.
 */
export async function getBasketAddressIdViaHeadless(
  page: Page
): Promise<string | null> {
  await waitForUpmindBridge(page);
  return page.evaluate(async () => {
    if (!window.Upmind?.useBasket) {
      throw new Error(
        "window.Upmind not exposed — is the cart running in test mode (pnpm start:test)?"
      );
    }
    const basket = window.Upmind.useBasket();
    const ready = await basket.isReady();
    if (!ready) {
      throw new Error(
        "getBasketAddressIdViaHeadless: basket did not become ready"
      );
    }
    await basket.isRefreshed();
    return JSON.parse(JSON.stringify(basket.basket.value?.address_id ?? null));
  });
}
