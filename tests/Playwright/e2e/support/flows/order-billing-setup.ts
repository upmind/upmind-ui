import type { Page } from "@playwright/test";
import type { AddressModel, BillingModel } from "@upmind-automation/headless";
import { addAddressViaHeadless } from "./address-setup";

declare global {
  interface Window {
    /**
     * The live headless system, exposed on `window` when the cart runs in test
     * mode (`testMode: true`, i.e. `pnpm start:test`); `undefined` otherwise.
     */
    Upmind?: typeof import("@upmind-automation/headless");
  }
}

/**
 * Commits a billing address (and optionally company / phone) to the current
 * ORDER by driving the REAL `useBasketBilling` composable inside the page, via
 * the live `window.Upmind` system the app exposes in test mode.
 *
 * This is the cache-correct replacement for the old raw-HTTP `setOrderAddress`
 * seed: it calls the same `update()` the billing UI's Continue button calls
 * (`PUT /orders/{id}` with `{ address_id, company_id, phone_id }`), so the
 * billing actor's `baseModel` is set and `isInitialBilling` flips to `false` —
 * the FE-2457 gating that renders the Continue button. A raw PUT would set the
 * order server-side but leave the in-page billing actor stale.
 *
 * Pair with {@link addAddressViaHeadless}: create the client address first,
 * capture its id, then pass it here to attach it to the order.
 *
 * @param page - The Playwright page (the live system lives on its `window`).
 * @param billing - The identifiers to commit; `addressId` is required for the
 *   order billing PUT to fire.
 */
export async function setOrderBillingViaHeadless(
  page: Page,
  billing: {
    addressId?: string | null;
    companyId?: string | null;
    phoneId?: string | null;
  }
): Promise<void> {
  // The bridge attaches window.Upmind via a dynamic import during app init, so
  // wait for it rather than racing the first call.
  await page
    .waitForFunction(() => !!window.Upmind?.useBasketBilling, null, {
      timeout: 15000
    })
    .catch(() => {
      throw new Error(
        "window.Upmind not exposed — is the cart running in test mode (pnpm start:test)?"
      );
    });
  await page
    .evaluate(async (model: BillingModel) => {
      if (
        !window.Upmind?.useBasketBilling ||
        !window.Upmind?.useActiveSession
      ) {
        throw new Error(
          "window.Upmind not exposed — is the cart running in test mode (pnpm start:test)?"
        );
      }
      if (!model.addressId) {
        throw new Error(
          "setOrderBillingViaHeadless: an addressId is required to commit order billing"
        );
      }
      // The order billing PUT can only be committed while authenticated as a
      // client — wait for the active session before driving billing.
      const authed = await window.Upmind.useActiveSession()
        .useActions()
        .isReady();
      if (!authed) {
        throw new Error(
          "setOrderBillingViaHeadless: session is not authenticated as a client"
        );
      }
      const billingComposable = window.Upmind.useBasketBilling();
      const ready = await billingComposable.isReady();
      if (!ready) {
        throw new Error(
          "setOrderBillingViaHeadless: billing actor did not become ready"
        );
      }
      // update() sends SET with `update: true` and awaits the order PUT — the
      // same path the billing form's Continue button drives.
      await billingComposable.update(model).catch((error: unknown) => {
        throw new Error(
          `setOrderBillingViaHeadless: order billing update failed — ${String(
            (error as { message?: string })?.message ?? error
          )}`
        );
      });
    }, billing as BillingModel)
    .catch(async error => {
      // A SUCCESSFUL billing commit advances the funnel — the app navigates by
      // design, which can tear down this evaluate's context before its result
      // crosses CDP ("Execution context was destroyed"). That is not evidence
      // of failure, so don't assume either way: re-check from the Node side
      // that the order billing actually landed. Any other error is real.
      const message = String((error as { message?: string })?.message ?? error);
      if (!/Execution context was destroyed/i.test(message)) throw error;

      await page
        .waitForFunction(
          async expectedAddressId => {
            const basket = window.Upmind?.useBasket?.();
            if (!basket) return false;
            await basket.isReady();
            return basket.basket.value?.address_id === expectedAddressId;
          },
          billing.addressId,
          { timeout: 15000 }
        )
        .catch(() => {
          throw new Error(
            `setOrderBillingViaHeadless: context was destroyed by navigation and the order billing address never landed — ${message}`
          );
        });
    });
}

/**
 * Adds a client address AND commits it as the order's billing address — the
 * one-shot equivalent of what the real billing UI does when you add an address
 * (adding an address in billing always sets it as the basket address).
 *
 * Use this (not the bare {@link addAddressViaHeadless}) whenever a test needs
 * to get PAST the billing funnel step — e.g. a domain product enforces billing,
 * so the funnel stops at `/billing/` until an address is set as the basket
 * address, then advances to products-setup for any still-missing fields.
 *
 * @param page - The Playwright page (the live system lives on its `window`).
 * @param clientId - The client the address belongs to.
 * @param model - The address model, identical to what the UI submits.
 * @returns The persisted address id (a plain string), or null.
 */
export async function addBillingAddressViaHeadless(
  page: Page,
  clientId: string,
  model: AddressModel
): Promise<string | null> {
  const addressId = await addAddressViaHeadless(page, clientId, model);
  if (addressId) await setOrderBillingViaHeadless(page, { addressId });
  return addressId;
}
