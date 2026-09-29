import { waitFor } from "xstate/lib/waitFor";
import { resetQueryByKey } from "../query";
import { remove as removeFromRegistry } from "../scope";
import { useI18n } from "../system-localisation";
import { queryKey } from "./client-billing-settings.services";
import {
  DEBOUNCE_DELAY,
  contextValue,
  stateMatches,
  stopService,
  DetailedError,
  ErrorOrigin,
  responseCodes
} from "../../utils";
import { debounce, get, isEmpty, isEqual } from "lodash-es";
import type { BillingSettingsModel } from "./client-billing-settings.types";
import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-billing-settings/useBillingSettingsManager.actions
 * @description Manager actions — form input, save, revert and lifecycle.
 * Sends events to the shared `dataManagerMachine` and awaits the settled
 * state; never reaches into `state.context` to mutate anything, and never
 * raises feedback. A failure rejects with a `DetailedError` for the CALLER
 * to render, while the machine keeps its own copy in context for
 * `useBillingSettingsManager.context.ts` to expose.
 *
 * @doctrine clause 2 (fresh modules start armless).
 */
export function createBillingSettingsManagerActions(
  _actorScope: ScopeActorTypes,
  actor: UseActor,
  scopeKey: string
) {
  const { state, send, service: machineService } = actor;
  const { t } = useI18n();

  /** A REAL, bounded timeout — never `Infinity` (AC16). */
  async function isReady(): Promise<boolean> {
    return waitFor(machineService, s => stateMatches(s, "available"), {
      timeout: 30_000
    })
      .then(s => !stateMatches(s, "error"))
      .catch(() => false);
  }

  /** Resolves once the manager has completed a save. */
  async function onDone(): Promise<boolean> {
    return waitFor(
      machineService,
      s => stateMatches(s, ["processed", "complete"]),
      { timeout: 60_000 }
    )
      .then(() => true)
      .catch(() => false);
  }

  /**
   * Inputs a model and resolves the parsed/validated model. Debounced on the
   * way out — the raw function stays private so `update`/`revert` can flush
   * it.
   */
  async function input(
    model: BillingSettingsModel | Record<string, unknown>
  ): Promise<BillingSettingsModel> {
    send({ type: "SET", data: model });

    return waitFor(machineService, s =>
      stateMatches(s, ["available.valid", "available.invalid"])
    )
      .then(s => get(s, "context.model") as BillingSettingsModel)
      .catch(() =>
        Promise.reject(
          new DetailedError(
            t("error.input_not_available"),
            responseCodes.Forbidden,
            ErrorOrigin.Headless
          )
        )
      );
  }

  const debouncedInput = debounce(input, DEBOUNCE_DELAY);

  /**
   * Saves the current (or provided) model and resolves the persisted one. The
   * consolidation write is refused at the service when the brand restricts
   * consolidation to staff (row O8, AC-17); the account-currency write keeps
   * its own row B6 gate.
   */
  async function update(
    value?: BillingSettingsModel | Record<string, unknown>
  ): Promise<BillingSettingsModel> {
    await debouncedInput.flush()?.catch(() => undefined);

    const model = contextValue<BillingSettingsModel>(state, "model");

    if (!isEmpty(value) && !isEqual(value, model)) {
      send({ type: "SET", data: value, update: true });
    } else {
      send({ type: "UPDATE" });
    }

    return waitFor(
      machineService,
      s =>
        stateMatches(s, ["processed", "available.error", "available.invalid"]),
      { timeout: 60_000 }
    )
      .then(s => {
        if (stateMatches(s, ["available.error", "available.invalid"]))
          throw s.context.error;
        return s.context.model as BillingSettingsModel;
      })
      .catch(error =>
        Promise.reject(
          new DetailedError(
            t("error.client_billing_settings_update_failed"),
            error?.status ?? responseCodes.Timeout,
            ErrorOrigin.Headless,
            { error, state: state.value }
          )
        )
      );
  }

  /**
   * Restores the base model without a machine change (row C9). The shared
   * `dataManagerMachine` has NO `REVERT` event; this is a `SET` carrying
   * `baseModel` through the SAME `input()` pathway, re-entering
   * `available.checking` and re-validating — mirrors
   * `usePersonalDetailsManager.actions.ts:139-142`.
   */
  async function revert(): Promise<BillingSettingsModel> {
    await debouncedInput.flush()?.catch(() => undefined);
    const baseModel =
      contextValue<BillingSettingsModel>(state, "baseModel") ?? {};
    return input(baseModel);
  }

  /** Clears the current form context. */
  async function clear(): Promise<void> {
    await debouncedInput.flush()?.catch(() => undefined);
    send({ type: "CLEAR" });
  }

  /** Stops the underlying machine, leaving the registry entry in place. */
  async function stop(): Promise<void> {
    await debouncedInput.flush()?.catch(() => undefined);
    stopService(machineService);
  }

  /**
   * Destroys this scoped instance — stops the machine AND removes it from
   * the registry.
   */
  async function destroy(): Promise<void> {
    await debouncedInput.flush()?.catch(() => undefined);
    stopService(machineService);
    removeFromRegistry(scopeKey);
  }

  /**
   * Drops the shared client-record cache entry and re-drives the machine
   * through its own `REFRESH` (`loading` → `loadLookups`), so the form asks
   * again through whatever transport answers — the redial the labs force
   * handle needs (`useForcedState`: "the preset is only visible because the
   * page asks again"). `revert()` cannot serve this: it restores from memory
   * with no request (AC9). `resetQueryByKey`, not `invalidate`: an entry
   * removed redraws from scratch; one invalidated keeps stale rows on screen.
   */
  async function reset(): Promise<void> {
    await debouncedInput.flush()?.catch(() => undefined);
    await resetQueryByKey(queryKey)();
    send({ type: "REFRESH", data: {} });
  }

  // --- actor-specific actions: none earned (arms: none — parity.yaml).

  return {
    /** Clears the current form context. */
    clear,

    /** Destroys this scoped instance — stops the machine and deregisters it. */
    destroy,

    /** Inputs a model (debounced), resolving the parsed/validated model. */
    input: debouncedInput,

    /** Resolves true when the manager is ready, false on error or timeout. */
    isReady,

    /** Resolves true once a save has completed. */
    onDone,

    /** Drops the cache entry and re-drives the machine — the force handle's redial. */
    reset,

    /** Restores the base model — row C9. */
    revert,

    /** Stops the underlying machine. */
    stop,

    /** Saves the current (or provided) model, resolving the persisted model. */
    update

    // The arm merges in HERE, last.
    // ...actorActions
  };
}

// Type export for consumers
export type UseBillingSettingsManagerActions = ReturnType<
  typeof createBillingSettingsManagerActions
>;
