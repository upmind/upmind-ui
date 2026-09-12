import { useContext } from "../../utils";
import type {
  BillingSettingsContext,
  BillingSettingsModel,
  ClientBillingSettingsServices
} from "./client-billing-settings.types";
import type { ResponseError, UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { ErrorObject } from "ajv";
// -----------------------------------------------------------------------------
/**
 * @module client-billing-settings/useBillingSettingsManager.context
 * @description Manager context — the reactive read side of the machine
 * context. Every member goes through the `useContext` state-read utility;
 * `state.value.context` is never read directly.
 *
 * THIS is where the schema and uischema surface. They enter the system in
 * `useBillingSettingsManager.machine.ts`'s `setSchemas`, live in machine
 * context, and reach consumers HERE — the barrel exports no bare pair.
 *
 * ERRORS ARE STATE, NOT EVENTS. `errors` and `validationErrors` are the
 * machine's captured failure, exposed for the consumer to render.
 *
 * @doctrine clause 2 — shared-only (armless).
 */
export function createBillingSettingsManagerContext(
  _actorScope: ScopeActorTypes,
  service: ClientBillingSettingsServices,
  actor: UseActor
) {
  const { state } = actor;

  // No state flags here — `isStaged`, `isVisible` and
  // `hasPaymentCurrencyChoice` are meta (`useBillingSettingsManager.meta.ts`);
  // context carries data only.

  // --- actor-specific context: none earned (arms: none — parity.yaml).

  return {
    /** The full data-manager context object. */
    context: useContext<BillingSettingsContext>(state),

    /** Machine-captured error message, if any — read, never raised. */
    errors: useContext<ResponseError["message"]>(state, "error.message"),

    /** The id of the client whose preference is being managed. */
    id: useContext<string | undefined>(state, "id"),

    /** The current form model. */
    model: useContext<BillingSettingsModel | undefined>(state, "model"),

    /** The base (persisted) model `revert()` restores to. */
    baseModel: useContext<BillingSettingsModel | undefined>(state, "baseModel"),

    /**
     * The currency options both account-currency controls offer — the
     * brand's supported currencies ordered by name, plus the account's own
     * currency when the brand list omits it (rows B2/B3).
     */
    currencyOptions: service.currencyOptions,

    /** The JSON schema for the form (from machine context — see JSDoc). */
    schema: useContext<BillingSettingsContext["schema"]>(state, "schema"),

    /** Display title of the preference being edited. */
    title: useContext<string | undefined>(state, "title"),

    /** The UI schema for the form (from machine context — see JSDoc). */
    uischema: useContext<BillingSettingsContext["uischema"]>(state, "uischema"),

    /** Field-level validation errors (AJV `ErrorObject[]`) — read, never raised. */
    validationErrors: useContext<ErrorObject[]>(state, "error.data")

    // The arm merges in HERE, last.
    // ...actorContext
  };
}

// Type export for consumers
export type UseBillingSettingsManagerContext = ReturnType<
  typeof createBillingSettingsManagerContext
>;
