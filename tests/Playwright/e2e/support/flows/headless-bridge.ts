import { expect, type Locator, type Page } from "@playwright/test";

declare global {
  interface Window {
    /**
     * The live headless system, exposed on `window` when the cart runs in test
     * mode (`testMode: true`, i.e. `pnpm start:test`); `undefined` otherwise.
     */
    Upmind?: typeof import("@upmind-automation/headless");
  }
}

const BRIDGE_TIMEOUT = 15000;
const POLL_TIMEOUT = 15000;
const POLL_INTERVAL = 100;
/** Bounded re-sends for a stepper press the actor never took (see below). */
const MAX_STEPPER_SENDS = 3;

/**
 * Waits for the live `window.Upmind` headless system to attach before any
 * bridge-driven seeding runs.
 *
 * The bridge attaches `window.Upmind` via a dynamic import during app init
 * (only in test mode), so callers must wait for it rather than racing the first
 * call. A prior `page.goto(<app URL>)` is required — no app, no bridge.
 *
 * @param page - The Playwright page (the live system lives on its `window`).
 */
export async function waitForUpmindBridge(page: Page): Promise<void> {
  await page
    .waitForFunction(
      () => !!window.Upmind?.useBasket && !!window.Upmind?.useActiveSession,
      null,
      { timeout: BRIDGE_TIMEOUT }
    )
    .catch(() => {
      throw new Error(
        "window.Upmind not exposed — is the cart running in test mode (pnpm start:test)?"
      );
    });

  // The bridge attaches before the funnel's first navigation settles, and an
  // evaluate that straddles it dies with "Execution context was destroyed".
  // The routing engine's own isReady() is the app's word that it has landed.
  await page.evaluate(
    timeout =>
      Promise.race([
        window.Upmind!.useRoutingEngine().isReady(),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("router never became ready")),
            timeout
          )
        )
      ]),
    BRIDGE_TIMEOUT
  );
}

/**
 * Waits for an active session to be established, without ever exposing a token.
 *
 * Waits for the session store to initialise, then polls until the active
 * session carries an `access_token` (guest sessions carry one too). The token
 * is only read in-page for the readiness check — it never leaves the browser.
 * Use this as a readiness gate where a spec needs a session before acting.
 *
 * @param page - The Playwright page (the live system lives on its `window`).
 */
export async function waitForActiveSessionViaHeadless(
  page: Page
): Promise<void> {
  await waitForUpmindBridge(page);
  await page.evaluate(
    async ({ pollTimeout, pollInterval }) => {
      if (!window.Upmind?.useActiveSession) {
        throw new Error(
          "window.Upmind not exposed — is the cart running in test mode (pnpm start:test)?"
        );
      }
      const session = window.Upmind.useActiveSession();
      await session.useActions().isReady();
      const { session: token } = session.useContext();

      const deadline = Date.now() + pollTimeout;
      while (Date.now() < deadline) {
        if (token.value?.access_token) return;
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
      throw new Error(
        "waitForActiveSessionViaHeadless: no access_token on the active session — is a session established?"
      );
    },
    { pollTimeout: POLL_TIMEOUT, pollInterval: POLL_INTERVAL }
  );
}

/**
 * Waits until the active session IS a guest client — the app's own word that
 * "Continue as guest" has landed.
 *
 * The guest CTA mints a CLIENT-coerced token, and the store then loads `/self`
 * before it commits the session (user attached, scope cookie projected, state
 * persisted — `useSessionStore.actions.add`). The cookie and the access token
 * both appear BEFORE that commit, so a navigation gated on either can boot the
 * next page from a half-written session. `isGuestClient` (`/self` `is_guest`
 * on the active user) flips only at the commit, so gate on it.
 *
 * @param page - The Playwright page (the live system lives on its `window`).
 */
export async function waitForGuestClientSessionViaHeadless(
  page: Page
): Promise<void> {
  await waitForUpmindBridge(page);
  await page.evaluate(
    async ({ pollTimeout, pollInterval }) => {
      if (!window.Upmind?.useActiveSession) {
        throw new Error(
          "window.Upmind not exposed — is the cart running in test mode (pnpm start:test)?"
        );
      }
      const session = window.Upmind.useActiveSession();
      await session.useActions().isReady();
      const { isGuestClient, isLoading } = session.useMeta();

      const deadline = Date.now() + pollTimeout;
      while (Date.now() < deadline) {
        if (isGuestClient.value && !isLoading.value) return;
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
      throw new Error(
        "waitForGuestClientSessionViaHeadless: the active session never became a guest client"
      );
    },
    { pollTimeout: POLL_TIMEOUT, pollInterval: POLL_INTERVAL }
  );
}

/** The basket's own answer to "can this order be placed right now". */
export type CheckoutReadiness = {
  /** Billing actor is `complete` (the guard's first term). */
  hasBilling: boolean;
  /** Custom-fields actor is `complete` (the guard's second term). */
  hasFields: boolean;
  /** The basket holds products (the guard's third term). */
  hasProducts: boolean;
  /** Payment-detail actor is settled and valid, so it can receive the event. */
  hasPaymentDetails: boolean;
  /** `canCheckout`'s terms AND a payment-detail actor able to receive it. */
  isReady: boolean;
  /** Refusal counter: a `CHECKOUT` the guard rejects only increments this. */
  attempts: number;
  /** Plain state tree — the only thing separating "never sent" from "stalled". */
  stateValue: unknown;
  /**
   * False means the basket sits idle in `shopping.paymentDetail`, which PROVES
   * the click never reached the handler — a delivered `CHECKOUT` transitions
   * synchronously, so it is always visible by the next poll tick.
   */
  hasAcceptedCheckout: boolean;
};

/**
 * Reads the basket's published readiness. Returns `null` rather than throwing
 * when the bridge is gone, so it is safe inside a poll.
 *
 * @param page - The Playwright page (the live system lives on its `window`).
 */
export async function readCheckoutReadinessViaHeadless(
  page: Page
): Promise<CheckoutReadiness | null> {
  return page
    .evaluate(() => {
      const basket = window.Upmind?.useBasket?.();
      if (!basket) return null;
      const meta = basket.meta.value;
      const hasBilling = !!meta?.hasBilling;
      const hasFields = !!meta?.hasFields;
      const hasProducts = (basket.products.value ?? []).length > 0;
      const hasPaymentDetails = !!meta?.hasPaymentDetails;
      let stateValue: unknown = null;
      try {
        // Actor refs defeat structured-clone, so take the plain value tree.
        stateValue = JSON.parse(
          JSON.stringify((basket as any).state?.value?.value ?? null)
        );
      } catch {
        stateValue = "unserialisable";
      }
      // `shopping` is parallel, so read the paymentDetail region's own value.
      const region = (stateValue as { shopping?: { paymentDetail?: string } })
        ?.shopping?.paymentDetail;
      const isIdle = region === "available" || region === "configuring";
      return {
        hasBilling,
        hasFields,
        hasProducts,
        hasPaymentDetails,
        isReady: hasBilling && hasFields && hasProducts && hasPaymentDetails,
        attempts: Number(basket.attempts?.value ?? 0),
        stateValue,
        hasAcceptedCheckout: !isIdle
      };
    })
    .catch(() => null);
}

/**
 * Waits until the basket will honour a `CHECKOUT`.
 *
 * Place Order tracks payment validity, but the event is answered by
 * `canCheckout` and the actor it forwards into — settling independently. An
 * early click is dropped in silence, and typing a card opens that window.
 *
 * @param page - The Playwright page (the live system lives on its `window`).
 */
export async function waitForCheckoutReadyViaHeadless(
  page: Page
): Promise<void> {
  await waitForUpmindBridge(page);
  const deadline = Date.now() + POLL_TIMEOUT;
  for (;;) {
    const state = await readCheckoutReadinessViaHeadless(page);
    if (state?.isReady) return;
    if (Date.now() > deadline) {
      throw new Error(
        `waitForCheckoutReadyViaHeadless: the basket never became ready to accept CHECKOUT — ${JSON.stringify(
          state
        )}. A Place Order click in this state is counted as a failed attempt and dropped.`
      );
    }
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
  }
}

/** Addresses one product-config actor: a committed basket line, or a pending
 * product-page configuration. */
export type ProductConfigTarget =
  | { basketProductId: string }
  | { productId: string };

/** A product-config actor's published settle-state snapshot. */
export type ProductConfigQuiet = {
  /** In `loading.*` — positioning the config actor; disables the stepper. */
  isLoading: boolean;
  /** Re-checking availability after a refresh; also disables the stepper. */
  isChecking: boolean;
  /** A `cart/calculate` is in flight (`lookups.prices.calculating`). */
  isCalculating: boolean;
  /** A mutation (e.g. a quantity PUT) is being processed. */
  isProcessing: boolean;
  /** Settled: nothing in flight — the actor sits in `available.valid`, so it
   *  publishes reliably and honours a click. */
  isQuiet: boolean;
  /** The actor's current model quantity, or null when unreadable. */
  quantity: number | null;
};

/**
 * Reads the addressed product-config actor's quiet state. Returns `null` rather
 * than throwing when the bridge or handle is gone, so it is safe inside a poll.
 *
 * @param page - The Playwright page (the live system lives on its `window`).
 * @param target - The committed basket line (`basketProductId`) or the pending
 *   product-page configuration (`productId`).
 */
export async function readProductConfigQuietViaHeadless(
  page: Page,
  target: ProductConfigTarget
): Promise<ProductConfigQuiet | null> {
  return page
    .evaluate(async target => {
      const bridge = window.Upmind as any;
      if (!bridge) return null;
      let handle: any = null;
      if ("basketProductId" in target) {
        if (!bridge.useBasketProducts) return null;
        // configure() returns the cached handle onto the SAME actor the card
        // drives — no new machine — so it is safe to call inside a poll.
        handle = await bridge
          .useBasketProducts()
          .configure(target.basketProductId);
      } else {
        if (!bridge.useBasketProductsPending) return null;
        // Read the page's own pending entry; configure() here could mint a
        // second machine, so never call it. The record is keyed by a base64
        // config hash (btoa of `{ productId, quantity, ... }`), not the raw
        // productId, so decode each key and match on productId.
        const rec =
          bridge.useBasketProductsPending().productsPending?.value ?? {};
        for (const key of Object.keys(rec)) {
          try {
            if (JSON.parse(atob(key))?.productId === target.productId) {
              handle = rec[key];
              break;
            }
          } catch {
            /* a non-decodable key is not this product's entry */
          }
        }
      }
      if (!handle) return null;
      const meta = handle.meta?.value ?? null;
      const isLoading = !!meta?.isLoading;
      const isChecking = !!meta?.isChecking;
      const isCalculating = !!meta?.isCalculating;
      const isProcessing = !!meta?.isProcessing;
      const quantity = handle.model?.value?.quantity;
      return {
        isLoading,
        isChecking,
        isCalculating,
        isProcessing,
        isQuiet:
          !isLoading && !isChecking && !isProcessing && !isCalculating,
        quantity: typeof quantity === "number" ? quantity : null
      };
    }, target)
    .catch(() => null);
}

/**
 * Waits until a product-config actor has settled into `available.valid` — its
 * load, availability re-check, mutation and price calculation all cleared.
 *
 * A quantity/term stepper re-renders the instant the actor flips state — the
 * card's first-poll refresh/re-check, or a pending product's `loading` →
 * `available` positioning. A click dispatched into that flip lands on a node
 * swapped out under it, so the handler never runs (no re-price, no PUT) even
 * though the spinbutton shows the new value from its own state. The actor
 * publishes reliably only once settled, so gate on that before acting — the
 * same phenomenon `waitForCheckoutReadyViaHeadless` guards for
 * `clickCompleteCheckout`. A press that lands while the page's first
 * `cart/calculate` is still in flight is dropped the same way.
 *
 * @param page - The Playwright page (the live system lives on its `window`).
 * @param target - The committed basket line (`basketProductId`) or the pending
 *   product-page configuration (`productId`) whose actor must settle.
 */
export async function waitForProductConfigQuietViaHeadless(
  page: Page,
  target: ProductConfigTarget
): Promise<void> {
  await waitForUpmindBridge(page);
  const deadline = Date.now() + POLL_TIMEOUT;
  for (;;) {
    const state = await readProductConfigQuietViaHeadless(page, target);
    if (state?.isQuiet) return;
    if (Date.now() > deadline) {
      throw new Error(
        `waitForProductConfigQuietViaHeadless: the product-config actor for ${JSON.stringify(
          target
        )} never settled — ${JSON.stringify(
          state
        )}. A stepper click in this state is swapped under and dropped.`
      );
    }
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
  }
}

/**
 * Presses a quantity stepper and returns once the addressed config actor has
 * TAKEN the change — re-sending only on the actor's own proof of
 * non-delivery, the discipline `clickCompleteCheckout` applies to `CHECKOUT`.
 *
 * The race it closes: a pending quantity lives in the `SET.QUANTITY` event
 * alone until `available.checking.parsing` finishes and `setModel` writes it
 * (`product.machine.ts:252`, `:161-172`). Re-enter `available.checking` inside
 * that window — a basket `REFRESH` is the everyday cause
 * (`product.machine.ts:209-230`) — and `parse` re-reads `context.model`, which
 * still holds the OLD quantity, so the increment is discarded. Nothing shows:
 * the stepper still reads the new number (NumberField owns its own value)
 * while the model, the `calculate` and the price stay put. That is the
 * "spinbutton 2, total unchanged, no cart/calculate" failure.
 *
 * Waiting longer cannot fix it — the event is gone, not late — so the only
 * honest close is to detect non-delivery from the actor and send again.
 *
 * @param page - The Playwright page (the live system lives on its `window`).
 * @param stepper - The stepper control to press.
 * @param target - The committed basket line (`basketProductId`) or the pending
 *   product-page configuration (`productId`) whose quantity must advance.
 * @returns The actor's model quantity once it has advanced.
 */
export async function pressQuantityStepperViaHeadless(
  page: Page,
  stepper: Locator,
  target: ProductConfigTarget
): Promise<number> {
  await waitForProductConfigQuietViaHeadless(page, target);
  const before = (await readProductConfigQuietViaHeadless(page, target))
    ?.quantity;
  if (typeof before !== "number") {
    throw new Error(
      `pressQuantityStepperViaHeadless: no readable quantity on the config actor for ${JSON.stringify(
        target
      )} — nothing to advance from.`
    );
  }

  await stepper.click();

  let sends = 1;
  let last: ProductConfigQuiet | null = null;
  try {
    await expect
      .poll(
        async () => {
          const state = await readProductConfigQuietViaHeadless(page, target);
          last = state ?? last;
          // Mid-render: no handle to read, so neither taken nor dropped.
          if (!state) return false;
          // The actor HAS the change.
          if (typeof state.quantity === "number" && state.quantity > before)
            return true;
          // Busy: the change is in flight, so never send a second one.
          if (!state.isQuiet) return false;
          // Settled on the old quantity — the press never reached the handler.
          if (sends >= MAX_STEPPER_SENDS) return false;
          sends += 1;
          await stepper.click({ timeout: 5000 }).catch(() => {});
          return false;
        },
        { timeout: POLL_TIMEOUT }
      )
      .toBe(true);
  } catch (error) {
    throw new Error(
      `pressQuantityStepperViaHeadless: the config actor for ${JSON.stringify(
        target
      )} never advanced past quantity ${before} — sent ${sends} press(es); state at failure ${JSON.stringify(
        last
      )}.`,
      { cause: error }
    );
  }

  return (
    (await readProductConfigQuietViaHeadless(page, target))?.quantity ?? before
  );
}
