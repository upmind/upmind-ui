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
import type { Ref } from "vue";
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
  scopeKey: string,
  consumerDisabled: Ref<boolean>
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
   *
   * A consumer-locked editor (row C16, `setDisabled(true)`) refuses the
   * input entirely: the model resolves UNCHANGED, and no `SET` reaches the
   * machine — AC15's "a set() while disabled leaves my preference unchanged".
   */
  async function input(
    model: BillingSettingsModel | Record<string, unknown>
  ): Promise<BillingSettingsModel> {
    if (consumerDisabled.value) {
      return contextValue<BillingSettingsModel>(state, "model") ?? {};
    }

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
   * Saves the current (or provided) model and resolves the persisted one.
   * Refuses while consumer-locked (row C16) — the same defence-in-depth
   * `client-billing-settings.services.ts`'s own `update()` applies for the
   * staged-import gate (row C14): the meta flag alone is not enough when a
   * consumer can call this directly.
   */
  async function update(
    value?: BillingSettingsModel | Record<string, unknown>
  ): Promise<BillingSettingsModel> {
    if (consumerDisabled.value) {
      return Promise.reject(
        new DetailedError(
          t("error.client_billing_settings_locked"),
          responseCodes.Forbidden,
          ErrorOrigin.Headless
        )
      );
    }

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
    debouncedInput.cancel();
    const baseModel =
      contextValue<BillingSettingsModel>(state, "baseModel") ?? {};
    return input(baseModel);
  }

  /** Clears the current form context. */
  function clear(): void {
    send({ type: "CLEAR" });
  }

  /**
   * Locks (or unlocks) every control from OUTSIDE this module's own gates
   * (row C16) — independently of `isStaged`/`isProcessing`. Read by
   * `useBillingSettingsManager.meta.ts`'s `isEditable` and enforced by
   * `input()` above.
   */
  function setDisabled(disabled: boolean): void {
    consumerDisabled.value = disabled;
  }

  /** Stops the underlying machine, leaving the registry entry in place. */
  function stop(): void {
    stopService(machineService);
  }

  /**
   * Destroys this scoped instance — stops the machine AND removes it from
   * the registry.
   */
  function destroy(): void {
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

    /** Locks or unlocks every control from outside this module's own gates (row C16). */
    setDisabled,

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
