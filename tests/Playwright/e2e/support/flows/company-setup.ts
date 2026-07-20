import type { Page } from "@playwright/test";
import type { CompanyModel } from "@upmind-automation/headless";
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
 * Seeds a client company by driving the REAL `useClientCompanyManager` inside
 * the page — the exact composable the checkout business-details form drives when
 * a user adds a company — via the live `window.Upmind` system the app exposes in
 * test mode. Tests never call the `@internal` services layer; the manager IS how
 * the app adds a company, so this seed uses it faithfully.
 *
 * WHY the manager (not a raw POST or the services layer): the manager shares the
 * app's TanStack Query cache, so the seeded company is reflected in the checkout
 * billing UI immediately (business-details tab, link-edit) — no stale cache, no
 * `page.reload()` workaround. A fresh `newUser` client has ZERO companies, so a
 * test that means to EDIT an existing company must seed one first; otherwise the
 * "edit" save hits the create branch (POST, not PUT/PATCH).
 *
 * HOW the drive settles (contract mirrors `addAddressViaHeadless`): a
 * single `update(model)` drives the machine's OWN lifecycle — SET (`update:true`)
 * → `available.checking` (parse, then validate) → `available.valid` (whose
 * `shouldUpdate` guard, armed by the SET's autoupdate, targets `processing`) →
 * `adding` (this is a new company) → `processed`. The manager's `update()` owns
 * the state wait: it `waitFor`s the machine's own transitions to `processed` /
 * `available.error` / `available.invalid` (xstate `send` is synchronous, so the
 * SET has already left the resting `available.invalid` before that `waitFor` is
 * armed). We do NOT poll `manager.meta` — the machine's transitions are the
 * source of truth.
 *
 * Pass a fresh model (no `id`) so the machine takes its `isNew` add path. Pass
 * `addressId` (not a full `address`) when the client already has a default
 * address: the schema then requires `addressId`, and the services `add` chain's
 * `ensureDependencies` reuses that address instead of creating a duplicate.
 *
 * @param page - The Playwright page (the live system lives on its `window`).
 * @param clientId - The client the company belongs to.
 * @param model - The company model, identical to what the UI submits.
 * @returns The persisted company id (a plain string), or null.
 */
export async function addCompanyViaHeadless(
  page: Page,
  clientId: string,
  model: CompanyModel
): Promise<string | null> {
  // The bridge attaches window.Upmind (the whole module) via a dynamic import
  // during app init, so wait for it rather than racing the first call. The
  // in-page guard below still asserts this seeder's specific composable exists.
  await waitForUpmindBridge(page);
  return page.evaluate(
    async ({ clientId, model }) => {
      if (
        !window.Upmind?.useClientCompanyManager ||
        !window.Upmind?.useActiveSession
      ) {
        throw new Error(
          "window.Upmind not exposed — is the cart running in test mode (pnpm start:test)?"
        );
      }
      // A client company can only be created while authenticated as a client —
      // wait for the active session before driving the company manager.
      const authed = await window.Upmind.useActiveSession()
        .useActions()
        .isReady();
      if (!authed) {
        throw new Error(
          "addCompanyViaHeadless: session is not authenticated as a client"
        );
      }
      const manager = window.Upmind.useClientCompanyManager(undefined, {
        clientId
      });
      const ready = await manager.isReady();
      if (!ready) {
        throw new Error(
          "addCompanyViaHeadless: company manager did not become ready"
        );
      }
      try {
        // update() takes the fully-hydrated model and handles the SET + the
        // wait on the machine's own transitions itself — the same one-shot the
        // address sibling uses. Only the plucked id (a primitive string) crosses
        // the page↔node bridge; the resolved model is never handed back whole.
        const saved = await manager.update(model);
        return saved?.id ?? null;
      } catch (error) {
        // A genuine manager rejection wraps the reactive XState `state.value`
        // graph, which Playwright cannot structured-clone ("object reference
        // chain is too long") — that clone error would mask the real cause. So
        // re-throw the machine's OWN settled state as a PLAIN, serializable
        // trace. This never swallows the failure (it re-throws); it makes a real
        // seed failure legible as the exact machine state + validation errors.
        const m = manager.meta.value;
        const trace = {
          message: String((error as { message?: string })?.message ?? error),
          meta: {
            isAvailable: m.isAvailable,
            isValid: m.isValid,
            hasErrors: m.hasErrors,
            isProcessing: m.isProcessing,
            isComplete: m.isComplete,
            isNew: m.isNew
          },
          error: manager.errors?.value ?? null,
          validationErrors: JSON.parse(
            JSON.stringify(manager.validationErrors?.value ?? [])
          )
        };
        throw new Error(
          `addCompanyViaHeadless: manager drive did not reach processed — ${JSON.stringify(
            trace
          )}`
        );
      }
    },
    { clientId, model }
  );
}
