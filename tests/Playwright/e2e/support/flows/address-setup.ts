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
 * @param clientId - The client the address belongs to. Asserted against the
 *   session's own resolved client, never passed to the manager — see below.
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
        !window.Upmind?.useActiveSession ||
        !window.Upmind?.ScopeActorTypes
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

      // The manager resolves its OWN target exclusively from the session — it
      // takes no client target of any kind. `clientId` is asserted against
      // that resolved identity rather than passed anywhere, so a test seeding
      // for the wrong client fails loudly instead of silently seeding the
      // wrong account.
      const activeClientId =
        window.Upmind.useActiveSession().useContext().activeUser.value?.id;
      if (activeClientId !== clientId) {
        throw new Error(
          `addAddressViaHeadless: seeded clientId "${clientId}" does not match the active session's own client "${activeClientId}" — the manager resolves its target from the session alone and cannot be redirected.`
        );
      }

      const manager = window.Upmind.useClientAddressManager()
        .as(window.Upmind.ScopeActorTypes.CLIENT)
        .fresh();
      const { isReady, update } = manager.useActions();

      const ready = await isReady();
      if (!ready) {
        throw new Error(
          "addAddressViaHeadless: address manager did not become ready"
        );
      }
      try {
        // update() takes the fully-hydrated model and handles the SET itself.
        const saved = await update(model);
        return saved?.id ?? null;
      } catch (error) {
        // A genuine manager rejection wraps the reactive XState `state.value`
        // graph, which Playwright cannot structured-clone ("object reference
        // chain is too long") — that clone error would mask the real cause. So
        // re-throw the machine's OWN settled state as a PLAIN, serializable
        // trace. This never swallows the failure (it re-throws); it makes a
        // real seed failure legible as the exact machine state + validation
        // errors.
        const meta = manager.useMeta();
        const context = manager.useContext();
        const trace = {
          message: String((error as { message?: string })?.message ?? error),
          meta: {
            isAvailable: meta.isAvailable.value,
            isValid: meta.isValid.value,
            hasErrors: meta.hasErrors.value,
            isProcessing: meta.isProcessing.value,
            isComplete: meta.isComplete.value,
            isNew: meta.isNew.value
          },
          error: context.errors?.value ?? null,
          validationErrors: JSON.parse(
            JSON.stringify(context.validationErrors?.value ?? [])
          )
        };
        throw new Error(
          `addAddressViaHeadless: manager drive did not reach processed — ${JSON.stringify(
            trace
          )}`
        );
      }
    },
    { clientId, model }
  );
}
