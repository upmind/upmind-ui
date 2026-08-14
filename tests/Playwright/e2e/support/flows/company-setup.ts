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
 * `useClientCompanyManager` is now a SCOPED composable (operator ruling R2,
 * `design.md` D4) — the `clientId` CONSTRUCTOR option it used to advertise
 * (`useClientCompanyManager(undefined, { clientId })`) is REMOVED outright; the
 * manager takes no consumer-supplied client target of any kind, under any name.
 * `.as(CLIENT).fresh()` drives the add path exactly as `.as(CLIENT)` with no
 * `.for()` context always has. `clientId` is KEPT as this function's parameter
 * but REPURPOSED from a decorative target into a real ASSERTION: before driving
 * the manager, it is compared against the active session's own client id and a
 * NAMED error is thrown if they differ. Today's seeder "works" only because the
 * seeded client happens to be the session client — an accidental invariant this
 * makes explicit and enforced, so a future test seeding for the wrong client
 * fails loudly instead of silently seeding the wrong account.
 *
 * HOW the drive settles (contract mirrors `addAddressViaHeadless`): a
 * single `update(model)` drives the machine's OWN lifecycle — SET (`update:true`)
 * → `available.checking` (parse, then validate) → `available.valid` (whose
 * `shouldUpdate` guard, armed by the SET's autoupdate, targets `processing`) →
 * `adding` (this is a new company) → `processed`. The manager's `update()` owns
 * the state wait: it `waitFor`s the machine's own transitions to `processed` /
 * `available.error` / `available.invalid` (xstate `send` is synchronous, so the
 * SET has already left the resting `available.invalid` before that `waitFor` is
 * armed). We do NOT poll the manager's meta flags in a loop — the machine's
 * transitions are the source of truth.
 *
 * Pass a fresh model (no `id`) so the machine takes its `isNew` add path. Pass
 * `addressId` (not a full `address`) when the client already has a default
 * address: the schema then requires `addressId`, and the services `add` chain's
 * `ensureDependencies` reuses that address instead of creating a duplicate.
 *
 * @param page - The Playwright page (the live system lives on its `window`).
 * @param clientId - The client the company must belong to — asserted against
 * the active session's own client id, not sent anywhere.
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
        !window.Upmind?.useActiveSession ||
        !window.Upmind?.ScopeActorTypes
      ) {
        throw new Error(
          "window.Upmind not exposed — is the cart running in test mode (pnpm start:test)?"
        );
      }
      // A client company can only be created while authenticated as a client —
      // wait for the active session before driving the company manager.
      const authed = await window.Upmind.useActiveSession()
        .useActions()
        .isAuthenticated();
      if (!authed) {
        throw new Error(
          "addCompanyViaHeadless: session is not authenticated as a client"
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
          `addCompanyViaHeadless: seeded clientId "${clientId}" does not match the active session's own client "${activeClientId}" — the manager resolves its target from the session alone and cannot be redirected.`
        );
      }

      const manager = window.Upmind.useClientCompanyManager()
        .as(window.Upmind.ScopeActorTypes.CLIENT)
        .fresh();
      const { isReady, update } = manager.useActions();

      const ready = await isReady();
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
        const saved = await update(model);
        return saved?.id ?? null;
      } catch (error) {
        // A genuine manager rejection wraps the reactive XState `state.value`
        // graph, which Playwright cannot structured-clone ("object reference
        // chain is too long") — that clone error would mask the real cause. So
        // re-throw the machine's OWN settled state as a PLAIN, serializable
        // trace. This never swallows the failure (it re-throws); it makes a real
        // seed failure legible as the exact machine state + validation errors.
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
          `addCompanyViaHeadless: manager drive did not reach processed — ${JSON.stringify(
            trace
          )}`
        );
      }
    },
    { clientId, model }
  );
}
