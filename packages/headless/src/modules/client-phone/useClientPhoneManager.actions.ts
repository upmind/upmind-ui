import { waitFor } from "xstate/lib/waitFor";
// Deep path, never the `../scope` barrel — see useClientPhones.ts for the
// aggregator-barrel `export *` hazard this sidesteps.
import { remove as removeFromRegistry } from "../scope/scope.registry";
import { useI18n } from "../system-localisation";
import {
  DEBOUNCE_DELAY,
  stateValue,
  contextValue,
  stateMatches,
  stopService,
  DetailedError,
  ErrorOrigin,
  responseCodes
} from "../../utils";
import { debounce, get, isEmpty, isEqual } from "lodash-es";
import type { ClientPhoneServices, PhoneModel } from "./client-phone.types";
import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-phone/useClientPhoneManager.actions
 * @description Manager actions — form input, save and lifecycle. Sends events
 * to the shared `dataManagerMachine` and awaits the settled state; it never
 * reaches into `state.context` to mutate anything, and it never raises
 * feedback (the manager half raises none on save, matching both oracles — row
 * L9). A failure rejects with a `DetailedError` for the CALLER to render,
 * while the machine keeps its own copy in context for
 * `useClientPhoneManager.context.ts` to expose.
 *
 * @doctrine clause 2 (fresh modules start armless).
 */
export function createClientPhoneManagerActions(
  _actorScope: ScopeActorTypes,
  actor: UseActor,
  service: ClientPhoneServices,
  scopeKey: string
) {
  const { state, send, service: machineService } = actor;
  const { t } = useI18n();

  /**
   * Resolves when the manager is ready to accept input.
   * @returns true once `available`, false if the machine settled in error.
   *
   * @decision
   * what: bounded at 60s (matching `update()`'s own waitFor convention),
   *   never `Infinity`.
   * why: `loading` awaits `loadLookups`' own `ensureCountries()` call, which
   *   internally awaits brand readiness and the countries query's own
   *   settled promise — both cross-module and network-backed, so the wait
   *   is unbounded from this module's perspective. `Infinity` turns any
   *   stall in that upstream chain into a silent hang with no error surface
   *   the caller can react to; a bound converts an upstream stall into a
   *   reportable `responseCodes.Timeout` instead.
   * rejected: keeping `Infinity` (the oracle's own choice) — it matches
   *   legacy but leaves a caller with no way to detect or recover from an
   *   upstream stall it does not own.
   */
  async function isReady(): Promise<boolean> {
    return waitFor(machineService, s => stateMatches(s, "available"), {
      timeout: 60_000
    })
      .then(s => !stateMatches(s, "error"))
      .catch(() =>
        Promise.reject(
          new DetailedError(
            t("error.client_phone_not_available"),
            responseCodes.Timeout,
            ErrorOrigin.Headless
          )
        )
      );
  }

  /**
   * Resolves once the manager has completed a save.
   * @returns true on completion, false if it never settled.
   *
   * @decision
   * what: bounded at 60s (matching `isReady()` and `update()`), never
   *   `Infinity`.
   * why: with `Infinity` the `.catch(() => false)` below can never fire on
   *   timeout, so the documented "false if it never settled" case is
   *   unreachable — a stalled save hangs silently forever instead of
   *   resolving false. A bound makes that contract actually true.
   * rejected: keeping `Infinity` (the oracle's own choice) — same rationale
   *   as `isReady()`'s bound above.
   */
  async function onDone(): Promise<boolean> {
    return waitFor(
      machineService,
      s =>
        stateMatches(s, ["processed", "complete"]) ||
        stateValue<boolean>(s, "done", false) === true,
      { timeout: 60_000 }
    )
      .then(() => true)
      .catch(() => false);
  }

  /**
   * Inputs a model and resolves the parsed/validated model. Debounced on the
   * way out — the raw function stays private so `update` can flush it.
   */
  async function input(
    model: PhoneModel | Record<string, unknown>
  ): Promise<PhoneModel> {
    send({ type: "SET", data: model });

    // Waiting on `available` alone would return the PRE-parse model.
    return waitFor(machineService, s =>
      stateMatches(s, ["available.valid", "available.invalid"])
    )
      .then(s => get(s, "context.model") as PhoneModel)
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
   * Saves the current (or provided) model and resolves the persisted one. A
   * fresh draft creates (via find-or-create); a phone-scoped manager updates.
   */
  async function update(
    value?: PhoneModel | Record<string, unknown>
  ): Promise<PhoneModel> {
    // Commit any typed input still pending on the debounce before saving,
    // otherwise the save reads the pre-edit model (row M8).
    await debouncedInput.flush()?.catch(() => undefined);

    const model = contextValue<PhoneModel>(state, "model");

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
        return s.context.model as PhoneModel;
      })
      .then(saved => {
        // Invalidate through the SCOPED services instance so the collection
        // refetches. Never mint a fresh instance here — that would drop the
        // scope's target client (row M9).
        service.refresh();
        return saved;
      })
      .catch(error =>
        Promise.reject(
          new DetailedError(
            t("error.client_phone_update_failed"),
            error?.status ?? responseCodes.Timeout,
            ErrorOrigin.Headless,
            { error, state: state.value }
          )
        )
      );
  }

  /** Clears the current form context. */
  function clear(): void {
    send({ type: "CLEAR" });
  }

  /** Stops the underlying machine, leaving the registry entry in place. */
  function stop(): void {
    debouncedInput.cancel();
    stopService(machineService);
  }

  /**
   * Destroys this scoped instance — stops the machine AND removes it from the
   * registry. The collection's `destroy()` only does the second half, because
   * a query has no service to stop.
   */
  function destroy(): void {
    debouncedInput.cancel();
    stopService(machineService);
    removeFromRegistry(scopeKey);
  }

  // --- actor-specific actions: none earned yet (clause 2). When a scope
  // earns one, add `useClientPhoneManager.actions.{actor}.ts` and spread it
  // LAST.

  return {
    /**
     * @scenario-include
     */
    clear,

    /**
     * @scenario-include
     */
    destroy,

    /**
     * @scenario-include
     */
    input: debouncedInput,

    /**
     * @scenario-include
     */
    isReady,

    /**
     * @scenario-include
     */
    onDone,

    /**
     * @scenario-include
     */
    stop,

    /**
     * @scenario-include
     */
    update

    // The arm merges in HERE, last.
  };
}

// Type export for consumers
export type UseClientPhoneManagerActions = ReturnType<
  typeof createClientPhoneManagerActions
>;
