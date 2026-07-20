import type { Page } from "@playwright/test";
import type { AddressModel } from "@upmind-automation/headless";
import { waitForUpmindBridge } from "./headless-bridge";

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
 * Seeds a client address by driving the REAL headless composable inside the
 * page, via the live `window.Upmind` system the app exposes in test mode.
 *
 * WHY the live system and not a raw-HTTP POST: the composable shares the app's
 * TanStack Query cache, so the seeded address is reflected in the UI
 * immediately — no stale cache, no `page.reload()` workaround. A raw `fetch`
 * bypasses the cache and produces the phantom "edit doesn't persist" failure
 * that is the FE-2784 root cause.
 *
 * @param page - The Playwright page (the live system lives on its `window`).
 * @param clientId - The client the address belongs to.
 * @param model - The address model, identical to what the UI submits.
 * @returns The persisted address id (a plain string), or null.
 */
export async function addAddressViaHeadless(
  page: Page,
  clientId: string,
  model: AddressModel
): Promise<string | null> {
  // The bridge attaches window.Upmind (the whole module) via a dynamic import
  // during app init, so wait for it rather than racing the first call. The
  // in-page guard below still asserts this seeder's specific composable exists.
  await waitForUpmindBridge(page);
  return page.evaluate(
    async ({ clientId, model }) => {
      if (
        !window.Upmind?.useClientAddressManager ||
        !window.Upmind?.useActiveSession
      ) {
        throw new Error(
          "window.Upmind not exposed — is the cart running in test mode (pnpm start:test)?"
        );
      }
      // A client address can only be created while authenticated as a client —
      // wait for the active session before driving the address manager.
      const authed = await window.Upmind.useActiveSession()
        .useActions()
        .isReady();
      if (!authed) {
        throw new Error(
          "addAddressViaHeadless: session is not authenticated as a client"
        );
      }
      const manager = window.Upmind.useClientAddressManager(undefined, {
        clientId
      });
      const ready = await manager.isReady();
      if (!ready) {
        throw new Error(
          "addAddressViaHeadless: address manager did not become ready"
        );
      }
      // update() takes the fully-hydrated model and handles the SET itself.
      const saved = await manager.update(model);
      return saved?.id ?? null;
    },
    { clientId, model }
  );
}
